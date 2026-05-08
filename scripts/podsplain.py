#!/usr/bin/env python3
"""
podsplain.py — Podcast-style audio generator for the podsplain skill.

Two modes:
  TTS-only (pre-generated script):
    python3 scripts/podsplain.py --script-file podsplains/<slug>/script.md --output-dir podsplains/<slug>/

  Fully autonomous (generate script + audio, requires ANTHROPIC_API_KEY + TTS key):
    python3 scripts/podsplain.py --topic "SQL indexes" --scenario learn --length medium

Options:
  --script-file PATH  Pre-generated script to convert (mutually exclusive with --topic)
  --topic TEXT        Topic to generate a script for (mutually exclusive with --script-file)
  --scenario TEXT     learn|boardroom|ralph-loop|interview|customer-onboarding|debate|pitch|postmortem
  --length TEXT       short|medium|long  (default: medium)
  --output-dir PATH   Directory for episode.wav + meta.json (default: podsplains/<slug>/)
  --tts TEXT          auto|openai|elevenlabs  (default: auto, prefers OpenAI)
  --model TEXT        tts-1|tts-1-hd  (OpenAI only, default: tts-1-hd)
  --workers INT       Concurrent TTS threads  (default: 8)
  --silence-ms INT    Silence between turns in ms  (default: 350)
  --keep-segments     Keep per-segment WAV files after assembly
  --no-checkpoint     Disable segment checkpointing
  --dry-run           Parse/summarise only, no TTS

Env vars:
  ANTHROPIC_API_KEY   Script generation (--topic mode only)
  OPENAI_API_KEY      OpenAI TTS
  ELEVENLABS_API_KEY  ElevenLabs TTS
  ANTHROPIC_BASE_URL  Override Anthropic API base (default: https://api.anthropic.com)
"""

import argparse
import io
import json
import os
import re
import sys
import threading
import time
import wave
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

import requests


# ─── Voice config ─────────────────────────────────────────────────────────────

OPENAI_VOICES = {
    "HOST_1": "onyx",   # deeper, authoritative
    "HOST_2": "nova",   # warm, curious
}

ELEVENLABS_VOICES = {
    "HOST_1": "pNInz6obpgDQGcFmaJgB",   # Adam — confident, clear
    "HOST_2": "EXAVITQu4vr4xnSDxMaL",   # Bella — warm, engaging
}

ELEVENLABS_SAMPLE_RATE = 24000

OPENAI_PRICING = {
    "tts-1":    0.000015,   # $15 / 1M chars
    "tts-1-hd": 0.000030,   # $30 / 1M chars
}

OPENAI_MAX_CHARS = 4000   # hard limit 4096; buffer to stay under

# ─── TTS text normalization ────────────────────────────────────────────────────
# Applied before every TTS call — strips markdown artifacts and fixes punctuation
# that causes unnatural pauses or robot-sounding output.

_TTS_REPLACEMENTS = [
    (r" — ",              ", "),      # em-dash → natural comma pause
    (r"—",                ", "),      # bare em-dash
    (r"\.\.\.",           ", "),      # ellipsis → brief pause, not dead air
    (r"\*\*(.+?)\*\*",   r"\1"),     # strip bold
    (r"\*(.+?)\*",        r"\1"),     # strip italic
    (r"`(.+?)`",          r"\1"),     # strip code ticks
    (r"\[interrupts?\]\s*", ""),      # leftover interrupt markers
    (r"\[HOST_\d+\s+interrupts?\]\s*", ""),
    # Symbols TTS reads literally without guidance
    (r"\$(\d+(?:\.\d+)?)\s*[Bb]",   r"\1 billion dollars"),
    (r"\$(\d+(?:\.\d+)?)\s*[Mm]",   r"\1 million dollars"),
    (r"\$(\d+(?:\.\d+)?)\s*[Kk]",   r"\1 thousand dollars"),
    (r"(\d+(?:\.\d+)?)\s*%",         r"\1 percent"),
    (r" & ",                          " and "),
    (r"\be\.g\.",                     "for example"),
    (r"\bi\.e\.",                     "that is"),
    (r"\betc\.",                      "and so on"),
    (r"\bvs\.",                       "versus"),
    (r"\bw/\b",                       "with"),
]


def _normalize_for_tts(text: str) -> str:
    for pattern, replacement in _TTS_REPLACEMENTS:
        text = re.sub(pattern, replacement, text)
    return text.strip()


# ─── Script parsing ───────────────────────────────────────────────────────────

def parse_script_file(script_path: Path) -> list[dict]:
    """Parse a podsplain .md script into segments.

    Handles multi-line dialogue: if a line after HOST_X: doesn't start with
    HOST_, [PAUSE, or a markdown marker, it's treated as a continuation of
    the previous speech segment and appended (handles Claude line-wrapping).

    Returns: [{type: "speech"|"pause", speaker: str, text: str, ms: int}]
    """
    segments = []
    for line in script_path.read_text(encoding="utf-8").split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^(HOST_[12]):\s*(.+)$", line)
        if m:
            text = re.sub(r"\[HOST_\d+\s+interrupts?\]\s*", "", m.group(2)).strip()
            if text:
                segments.append({"type": "speech", "speaker": m.group(1), "text": text})
        elif line.startswith("[PAUSE_SHORT]"):
            segments.append({"type": "pause", "ms": 500})
        elif line.startswith("[PAUSE_MED]"):
            segments.append({"type": "pause", "ms": 1000})
        elif (segments and segments[-1]["type"] == "speech"
              and not line.startswith(("#", "|", "-", "*", ">", "**", "```"))):
            # Continuation of the previous HOST line (Claude wrapped a long line)
            segments[-1]["text"] += " " + line
    return segments


# ─── TTS backends ─────────────────────────────────────────────────────────────

def _chunk_text(text: str, max_chars: int = OPENAI_MAX_CHARS) -> list[str]:
    """Split at sentence boundaries if text exceeds max_chars."""
    if len(text) <= max_chars:
        return [text]
    chunks, current = [], ""
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if len(current) + len(sentence) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
            current = sentence
        else:
            current = (current + " " + sentence).strip() if current else sentence
    if current:
        chunks.append(current.strip())
    return chunks


def _merge_wav_parts(parts: list[bytes]) -> bytes:
    """Concatenate a list of WAV byte strings into one WAV."""
    if len(parts) == 1:
        return parts[0]
    buf = io.BytesIO()
    out = None
    for part in parts:
        r = wave.open(io.BytesIO(part))
        if out is None:
            out = wave.open(buf, "wb")
            out.setparams(r.getparams())
        out.writeframes(r.readframes(r.getnframes()))
        r.close()
    out.close()
    return buf.getvalue()


def tts_openai(text: str, voice: str, api_key: str, model: str = "tts-1-hd") -> bytes:
    resp = requests.post(
        "https://api.openai.com/v1/audio/speech",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "input": _normalize_for_tts(text), "voice": voice, "response_format": "wav"},
        timeout=90,
    )
    resp.raise_for_status()
    return resp.content


def tts_elevenlabs(text: str, voice_id: str, api_key: str) -> bytes:
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={
            "text": _normalize_for_tts(text),
            "model_id": "eleven_multilingual_v2",
            "output_format": "pcm_24000",
            # Lower stability = more natural variation; higher style = more expressive.
            # These are tuned for podcast speech, not narration or audiobook.
            "voice_settings": {"stability": 0.38, "similarity_boost": 0.80, "style": 0.20, "use_speaker_boost": True},
        },
        timeout=90,
    )
    resp.raise_for_status()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(ELEVENLABS_SAMPLE_RATE)
        wf.writeframes(resp.content)
    return buf.getvalue()


def _call_tts(text: str, speaker: str, backend: str, openai_key: str, elevenlabs_key: str, model: str) -> bytes:
    """Route to the correct backend, chunk long text, with 429-aware retry.

    429 rate-limit responses honor the Retry-After header and do NOT consume
    the 3-attempt retry budget (which is reserved for real errors).
    """
    chunks = _chunk_text(text)   # applied to both backends
    parts = []
    for chunk in chunks:
        attempt = 0
        deadline = time.monotonic() + 120   # hard ceiling: 2 min total waiting per chunk
        while attempt < 3:
            if time.monotonic() > deadline:
                raise RuntimeError(f"TTS timed out after 2m of retries: {chunk[:60]!r}")
            try:
                if backend == "openai":
                    parts.append(tts_openai(chunk, OPENAI_VOICES[speaker], openai_key, model))
                else:
                    parts.append(tts_elevenlabs(chunk, ELEVENLABS_VOICES[speaker], elevenlabs_key))
                break
            except requests.HTTPError as e:
                status = e.response.status_code if e.response is not None else 0
                if status == 429:
                    wait = min(int(e.response.headers.get("Retry-After", 15)), 60)
                    print(f"\n  [429 rate-limited] waiting {wait}s...", file=sys.stderr)
                    time.sleep(wait)
                    # intentionally do NOT increment attempt — rate limits aren't failures
                else:
                    if attempt >= 2:
                        raise
                    wait = 2 ** attempt
                    print(f"\n  [retry {attempt+1}/2 in {wait}s] HTTP {status}", file=sys.stderr)
                    time.sleep(wait)
                    attempt += 1
            except requests.RequestException as e:
                if attempt >= 2:
                    raise
                wait = 2 ** attempt
                print(f"\n  [retry {attempt+1}/2 in {wait}s] {e}", file=sys.stderr)
                time.sleep(wait)
                attempt += 1
    return _merge_wav_parts(parts)


def _make_silence(sample_rate: int, channels: int, sampwidth: int, ms: int) -> bytes:
    return b"\x00" * (int(sample_rate * ms / 1000) * channels * sampwidth)


def _add_audio_padding(wav_bytes: bytes, lead_ms: int = 500, tail_ms: int = 700) -> bytes:
    """Prepend lead silence and append tail silence to a WAV file.

    Lead silence prevents the first word being clipped on Bluetooth/AirPods
    during buffer initialisation. Tail silence prevents abrupt cutoff at end.
    """
    r = wave.open(io.BytesIO(wav_bytes))
    p = r.getparams()
    r.close()
    lead = _make_silence(p.framerate, p.nchannels, p.sampwidth, lead_ms)
    tail = _make_silence(p.framerate, p.nchannels, p.sampwidth, tail_ms)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as out:
        out.setparams(p)
        out.writeframes(lead)
        r = wave.open(io.BytesIO(wav_bytes))
        out.writeframes(r.readframes(r.getnframes()))
        r.close()
        out.writeframes(tail)
    return buf.getvalue()


# ─── Concurrent WAV assembly ──────────────────────────────────────────────────

def assemble_wav(
    segments: list[dict],
    backend: str,
    openai_key: str,
    elevenlabs_key: str,
    silence_ms: int,
    model: str = "tts-1-hd",
    workers: int = 8,
    segments_dir: Path | None = None,
) -> tuple[bytes, float]:
    """Generate all speech segments concurrently, then assemble in order.

    segments_dir: if set, saves each segment as NNN-SPEAKER.wav for resume.
    Returns (wav_bytes, duration_seconds).
    """
    speech_items = [(i, seg) for i, seg in enumerate(segments) if seg["type"] == "speech"]
    total = len(speech_items)

    cached_count = 0
    if segments_dir:
        segments_dir.mkdir(parents=True, exist_ok=True)
        cached_count = sum(
            1 for i, seg in speech_items
            if (segments_dir / f"{i:04d}-{seg['speaker']}.wav").exists()
        )
        resume_note = f", {cached_count} cached" if cached_count else ""
    else:
        resume_note = ""

    print(f"[podsplain] Synthesizing {total} segments via {backend} ({workers} workers{resume_note})...")

    audio_results: dict[int, bytes] = {}
    completed = [0]
    lock = threading.Lock()

    def tts_one(idx_seg: tuple[int, dict]) -> tuple[int, bytes]:
        idx, seg = idx_seg
        if segments_dir:
            cache_path = segments_dir / f"{idx:04d}-{seg['speaker']}.wav"
            if cache_path.exists():
                return idx, cache_path.read_bytes()
        wav = _call_tts(seg["text"], seg["speaker"], backend, openai_key, elevenlabs_key, model)
        if segments_dir:
            (segments_dir / f"{idx:04d}-{seg['speaker']}.wav").write_bytes(wav)
        return idx, wav

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(tts_one, item): item[0] for item in speech_items}
        for future in as_completed(futures):
            idx, wav = future.result()
            audio_results[idx] = wav
            with lock:
                completed[0] += 1
                print(f"\r  [{completed[0]}/{total}] synthesized...", end="", flush=True)
    print()

    # Get WAV params from first speech segment
    first_idx = speech_items[0][0]
    r = wave.open(io.BytesIO(audio_results[first_idx]))
    wav_params = r.getparams()
    r.close()

    inter_silence = _make_silence(wav_params.framerate, wav_params.nchannels, wav_params.sampwidth, silence_ms)

    out_buf = io.BytesIO()
    with wave.open(out_buf, "wb") as out:
        out.setparams(wav_params)
        for i, seg in enumerate(segments):
            if seg["type"] == "pause":
                out.writeframes(_make_silence(wav_params.framerate, wav_params.nchannels, wav_params.sampwidth, seg["ms"]))
            else:
                r = wave.open(io.BytesIO(audio_results[i]))
                out.writeframes(r.readframes(r.getnframes()))
                r.close()
                out.writeframes(inter_silence)

    wav_bytes = _add_audio_padding(out_buf.getvalue())
    r = wave.open(io.BytesIO(wav_bytes))
    duration_s = r.getnframes() / r.getframerate()
    r.close()
    return wav_bytes, duration_s


# ─── Cost estimation ──────────────────────────────────────────────────────────

def estimate_cost(speech_segs: list[dict], backend: str, model: str) -> str | None:
    """Return human-readable cost estimate, or None if backend doesn't have public pricing."""
    if backend != "openai":
        return None
    total_chars = sum(len(_normalize_for_tts(s["text"])) for s in speech_segs)
    rate = OPENAI_PRICING.get(model, OPENAI_PRICING["tts-1-hd"])
    usd = total_chars * rate
    return f"~{total_chars:,} chars × ${rate*1e6:.0f}/1M = ${usd:.3f}"


# ─── Standalone script generation (Anthropic API) ─────────────────────────────

LENGTH_WORDS = {"short": 700, "medium": 1400, "long": 2800}

SCENARIO_FRAMES: dict[str, dict] = {
    "learn": {
        "setup": "HOST_1 is Alex, an expert explainer who uses vivid analogies and is enthusiastic but precise. HOST_2 is Jordan, a curious beginner who asks exactly the questions the listener would ask.",
        "beats": "Jordan starts knowing nothing. Alex builds from first principles. At least one 'Wait, seriously?' moment. End: Jordan summarises what they learned in their own words, then Alex delivers a single memorable one-liner takeaway.",
    },
    "boardroom": {
        "setup": "HOST_1 is an executive presenting a strategy or recommendation with conviction and data. HOST_2 is a skeptical board member who probes for weaknesses, demands specifics, and questions every assumption.",
        "beats": "Real stakes. HOST_1 opens with the recommendation first, context second. HOST_2 challenges at least three times. HOST_1 defends and adjusts. End: board approves conditionally, or issues one concrete follow-up ask.",
    },
    "ralph-loop": {
        "setup": "HOST_1 is Ralph, a systematic optimizer obsessed with measurement, iteration, and root cause. HOST_2 is a team member presenting their work for review.",
        "beats": "Ralph's loop: (1) What was the goal? (2) How was it measured? (3) What actually happened? (4) Why? (5) What changes next cycle? Ralph is methodical, not mean. End: explicit next-iteration hypothesis stated.",
    },
    "interview": {
        "setup": "HOST_1 is the interviewer. HOST_2 is the candidate being evaluated on the topic.",
        "beats": "Mix of technical and situational questions. At least one tough follow-up that forces HOST_2 to think on their feet. HOST_2 gives specific, confident answers with real examples. End: HOST_1 signals whether the answer landed.",
    },
    "customer-onboarding": {
        "setup": "HOST_1 is a customer success rep. HOST_2 is a new customer who has real questions and mild skepticism.",
        "beats": "Open with the outcome HOST_2 cares about, not features. HOST_2 raises at least two realistic objections. HOST_1 focuses on value, not specs. End: HOST_2 names the one thing they'll do first.",
    },
    "debate": {
        "setup": "HOST_1 argues the pro/for position. HOST_2 argues the con/against position. Both are informed and reasonable.",
        "beats": "Each side opens with their strongest point. They engage directly with each other's arguments — no strawmanning. At least one concession from each side. Each closes with their single best argument. Listener understands both sides deeply.",
    },
    "pitch": {
        "setup": "HOST_1 is a founder or product lead pitching the topic as a solution to a real problem. HOST_2 is a skeptical investor or decision-maker evaluating the pitch.",
        "beats": "HOST_1 opens with the problem, not the product. Investor probes: market size, why now, why this team, what's the moat. HOST_1 answers with specifics. End: investor states the one thing that would make or break their interest.",
    },
    "postmortem": {
        "setup": "HOST_1 is the incident commander or team lead running a blameless postmortem. HOST_2 is a team member who was closest to the failure.",
        "beats": "Cover: what happened, when, who was affected, what the impact was. Then: the timeline of discovery and response. Then: contributing factors (not root cause — postmortems find systems, not culprits). End: three concrete action items with owners and due dates.",
    },
}

SCRIPT_SYSTEM = """\
You are a professional podcast script writer. You write naturalistic, engaging two-host podcast scripts.

HARD RULES — every single one must be followed:
1. Contractions always: it's, you're, we're, can't, that's, I've — never the formal form
2. Natural fillers: "basically", "right", "okay so", "I mean", "you know", "kind of"
3. Cold open — the very first HOST_1 line MUST be a hook or tease, NOT an introduction.
   BAD:  "Welcome to PodSplain! Today we're talking about..."
   GOOD: "Okay so here's something that breaks most people's mental model of how this works."
4. 'Why does this matter?' addressed within the first 60 seconds
5. Concrete examples — name real companies, products, people, situations. Not vague abstractions.
6. Analogies — compare complex concepts to everyday things (traffic, cooking, building a house)
7. Real reactions: "That's wild", "Wait, seriously?", "Oh I had no idea", "No way", "Huh"
8. At least 2 interruptions, written as: HOST_2: [interrupts] Oh wait, so you're saying...
9. At least 2 moments where one host finishes or builds on the other's half-formed thought
10. Story arc — every episode needs: setup (what's the problem/question), tension (why it's hard or surprising), resolution (the insight or answer)
11. NO bullet lists, no structured explanations — this is pure spoken conversation
12. Outro — always end with [PAUSE_MED], then HOST_2 summarises the takeaway in 2-3 plain sentences, then HOST_1 closes with "That's a wrap on [topic]." plus one memorable one-liner

FORMAT (strict — no deviations, no extra text):
HOST_1: [dialogue]
HOST_2: [dialogue]
[PAUSE_SHORT]
HOST_1: [dialogue]

Only HOST_1:, HOST_2:, [PAUSE_SHORT], [PAUSE_MED] are valid line starts. Nothing else.\
"""


def generate_script(topic: str, scenario: str, length: str, api_key: str) -> str:
    frame = SCENARIO_FRAMES.get(scenario, SCENARIO_FRAMES["learn"])
    word_count = LENGTH_WORDS.get(length, LENGTH_WORDS["medium"])
    base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com")

    user_msg = (
        f'Write a PodSplain podcast script on: "{topic}"\n\n'
        f"Scenario: {frame['setup']}\n"
        f"Required beats: {frame['beats']}\n"
        f"Target: ~{word_count} words of dialogue total.\n\n"
        "Start the script immediately on the next line — no preamble."
    )

    resp = requests.post(
        f"{base_url}/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-opus-4-7",
            "max_tokens": 8192,
            "system": SCRIPT_SYSTEM,
            "messages": [{"role": "user", "content": user_msg}],
        },
        timeout=180,
    )
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 0
        if status == 401:
            print("ERROR: ANTHROPIC_API_KEY is invalid or expired (401)", file=sys.stderr)
        elif status == 429:
            print("ERROR: Anthropic rate limit hit generating script — wait a moment and retry (429)", file=sys.stderr)
        else:
            print(f"ERROR: Anthropic API returned {status}: {e}", file=sys.stderr)
        sys.exit(1)
    data = resp.json()
    if not data.get("content") or not data["content"][0].get("text"):
        print("ERROR: Anthropic API returned an empty response — check model availability", file=sys.stderr)
        sys.exit(1)
    return data["content"][0]["text"]


# ─── Index ────────────────────────────────────────────────────────────────────

def update_index(podsplains_dir: Path, topic: str, scenario: str, duration_s: float, slug: str):
    index_path = podsplains_dir / "INDEX.md"
    header = (
        "# PodSplain Episodes\n\n"
        "| # | Date | Topic | Scenario | Duration | File |\n"
        "|---|------|-------|----------|----------|------|\n"
    )
    if not index_path.exists():
        index_path.write_text(header, encoding="utf-8")

    existing = index_path.read_text(encoding="utf-8")

    # Guard against duplicate rows when re-running the same command
    if f"`{slug}/episode.wav`" in existing:
        return

    data_rows = [l for l in existing.split("\n") if l.startswith("| ") and "---" not in l and not l.startswith("| #")]
    ep_num = len(data_rows) + 1
    date_str = datetime.now().strftime("%Y-%m-%d")
    mins, secs = int(duration_s // 60), int(duration_s % 60)
    row = f"| {ep_num} | {date_str} | {topic} | {scenario} | {mins}m {secs:02d}s | `{slug}/episode.wav` |\n"
    index_path.write_text(existing + row, encoding="utf-8")


# ─── Setup check ─────────────────────────────────────────────────────────────

def run_check(openai_key: str, elevenlabs_key: str, anthropic_key: str) -> None:
    """Validate environment and print a readiness summary."""
    import importlib.util
    ok = True

    py_ver = sys.version_info
    py_ok = py_ver >= (3, 10)
    print(f"  Python:              {'✓' if py_ok else '✗'} {py_ver.major}.{py_ver.minor}.{py_ver.micro}")
    ok = ok and py_ok

    req_ok = importlib.util.find_spec("requests") is not None
    print(f"  requests:            {'✓' if req_ok else '✗ MISSING — pip install requests'}")
    ok = ok and req_ok

    print(f"  ANTHROPIC_API_KEY:   {'✓ set' if anthropic_key else '– not set  (needed for --topic standalone mode)'}")
    print(f"  OPENAI_API_KEY:      {'✓ set' if openai_key else '– not set'}")
    print(f"  ELEVENLABS_API_KEY:  {'✓ set' if elevenlabs_key else '– not set'}")

    if not openai_key and not elevenlabs_key:
        print("\n  ⚠  No TTS key found — set OPENAI_API_KEY or ELEVENLABS_API_KEY to generate audio.")
        print("     Script generation (--topic) still works with ANTHROPIC_API_KEY alone.")
        ok = False
    else:
        preferred = "OpenAI (tts-1-hd)" if openai_key else "ElevenLabs"
        print(f"\n  Ready to generate audio via {preferred}.")

    voices_openai = " | ".join(f"{h}: {v}" for h, v in OPENAI_VOICES.items())
    voices_el     = " | ".join(f"{h}: {v[:12]}…" for h, v in ELEVENLABS_VOICES.items())
    print(f"\n  OpenAI voices:       {voices_openai}")
    print(f"  ElevenLabs voices:   {voices_el}")
    print(f"\n  Scenarios:           {', '.join(SCENARIO_FRAMES)}")
    sys.exit(0 if ok else 1)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="podsplain — podcast-style audio generator")
    src = p.add_mutually_exclusive_group()
    src.add_argument("--script-file", help="Pre-generated script .md to convert")
    src.add_argument("--topic", help="Topic to generate a script for (needs ANTHROPIC_API_KEY)")
    p.add_argument("--scenario", default="learn", choices=list(SCENARIO_FRAMES), help="Episode scenario")
    p.add_argument("--length", default="medium", choices=["short", "medium", "long"])
    p.add_argument("--output-dir", default=None)
    p.add_argument("--tts", default="auto", choices=["auto", "openai", "elevenlabs"])
    p.add_argument("--model", default="tts-1-hd", choices=["tts-1", "tts-1-hd"], help="OpenAI TTS model")
    p.add_argument("--workers", type=int, default=8, help="Concurrent TTS threads")
    p.add_argument("--silence-ms", type=int, default=350)
    p.add_argument("--keep-segments", action="store_true", help="Keep per-segment WAVs after assembly")
    p.add_argument("--no-checkpoint", action="store_true", help="Disable segment caching")
    p.add_argument("--dry-run", action="store_true", help="Parse + summarise only, no TTS")
    p.add_argument("--check", action="store_true", help="Validate setup (Python, requests, API keys) and exit")
    args = p.parse_args()

    openai_key     = os.getenv("OPENAI_API_KEY", "")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")
    anthropic_key  = os.getenv("ANTHROPIC_API_KEY", "")

    if args.check:
        print("[podsplain] Setup check")
        run_check(openai_key, elevenlabs_key, anthropic_key)

    if not args.script_file and not args.topic:
        p.error("Provide --script-file or --topic")

    # ── Output dir ──
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    # ── Script: generate or load ──
    if args.topic:
        if not anthropic_key:
            print("ERROR: --topic mode needs ANTHROPIC_API_KEY", file=sys.stderr)
            sys.exit(1)

        topic = args.topic
        scenario = args.scenario
        slug = re.sub(r"[^a-z0-9]+", "-", topic.lower())[:50] + f"-{args.scenario}-{timestamp}"
        out_dir = Path(args.output_dir).resolve() if args.output_dir else Path("podsplains") / slug
        out_dir.mkdir(parents=True, exist_ok=True)

        print(f"[podsplain] Generating {args.scenario} script on '{topic}' (~{LENGTH_WORDS[args.length]} words)...")
        script_text = generate_script(topic, args.scenario, args.length, anthropic_key)

        script_path = out_dir / "script.md"
        script_path.write_text(
            f"# PodSplain: {topic}\n\n"
            f"**Scenario:** {args.scenario}  \n"
            f"**Generated:** {datetime.now().isoformat()}  \n"
            f"**Length target:** {args.length} (~{LENGTH_WORDS[args.length]} words)\n\n---\n\n"
            + script_text,
            encoding="utf-8",
        )
        print(f"[podsplain] Script → {script_path}")

    else:
        script_path = Path(args.script_file).resolve()
        if not script_path.exists():
            print(f"ERROR: script not found: {script_path}", file=sys.stderr)
            sys.exit(1)

        # Extract metadata from header
        raw = script_path.read_text(encoding="utf-8")
        tm = re.search(r"^#\s+PodSplain:\s*(.+)$", raw, re.MULTILINE)
        sm = re.search(r"^\*\*Scenario:\*\*\s*(.+?)  *$", raw, re.MULTILINE)
        topic    = tm.group(1).strip() if tm else "unknown"
        scenario = sm.group(1).strip() if sm else args.scenario

        slug = re.sub(r"[^a-z0-9]+", "-", topic.lower())[:50] + f"-{scenario}-{timestamp}"
        out_dir = Path(args.output_dir).resolve() if args.output_dir else script_path.parent

    out_dir.mkdir(parents=True, exist_ok=True)

    # ── TTS backend ──
    backend = args.tts
    if backend == "auto":
        backend = "openai" if openai_key else ("elevenlabs" if elevenlabs_key else "none")
    if backend == "openai" and not openai_key:
        print("ERROR: OPENAI_API_KEY not set", file=sys.stderr); sys.exit(1)
    if backend == "elevenlabs" and not elevenlabs_key:
        print("ERROR: ELEVENLABS_API_KEY not set", file=sys.stderr); sys.exit(1)

    # ElevenLabs has strict concurrency limits (free=1, starter=3, creator=5).
    # 8 workers would cause immediate 429 storms — cap automatically.
    effective_workers = args.workers
    if backend == "elevenlabs" and args.workers > 3:
        effective_workers = 3
        print(f"[podsplain] ElevenLabs: auto-capping workers {args.workers}→3 (API concurrency limit)")

    # ── Parse ──
    print(f"[podsplain] Parsing: {script_path.name}")
    segments   = parse_script_file(script_path)
    speech_segs = [s for s in segments if s["type"] == "speech"]
    pause_segs  = [s for s in segments if s["type"] == "pause"]
    word_count  = sum(len(s["text"].split()) for s in speech_segs)

    print(f"[podsplain] {len(speech_segs)} speech / {len(pause_segs)} pauses / ~{word_count} words")

    if not speech_segs:
        print("ERROR: no HOST_1:/HOST_2: lines found", file=sys.stderr); sys.exit(1)
    if word_count < 50:
        print(f"WARNING: only {word_count} words — script may not have generated correctly", file=sys.stderr)

    # ── Dry run ──
    if args.dry_run or backend == "none":
        h1 = sum(1 for s in speech_segs if s["speaker"] == "HOST_1")
        h2 = sum(1 for s in speech_segs if s["speaker"] == "HOST_2")
        lo, hi = len(speech_segs), len(speech_segs) * 3
        print(f"[{'dry-run' if args.dry_run else 'no TTS key'}] HOST_1: {h1}  HOST_2: {h2}  pauses: {len(pause_segs)}")
        print(f"  words: ~{word_count}   est. gen time: {lo//60}m{lo%60}s – {hi//60}m{hi%60}s")
        if backend == "none":
            print("  Set OPENAI_API_KEY or ELEVENLABS_API_KEY to generate audio.")
            print(f"  Script saved: {script_path}")
        else:
            print("  Remove --dry-run to generate episode.wav")
        return

    # ── Cost estimate ──
    cost_str = estimate_cost(speech_segs, backend, args.model)
    if cost_str:
        print(f"[podsplain] Estimated cost: {cost_str}")

    # ── Generate audio ──
    segs_dir = None if args.no_checkpoint else (out_dir / "segments")
    wav_bytes, duration_s = assemble_wav(
        segments, backend, openai_key, elevenlabs_key, args.silence_ms,
        model=args.model, workers=effective_workers, segments_dir=segs_dir,
    )

    # ── Clean up segment cache ──
    if segs_dir and segs_dir.exists() and not args.keep_segments:
        for f in segs_dir.glob("*.wav"):
            f.unlink()
        try:
            segs_dir.rmdir()
        except OSError:
            pass  # unexpected files left — not critical

    # ── Save ──
    wav_path = out_dir / "episode.wav"
    wav_path.write_bytes(wav_bytes)

    mins, secs_rem = int(duration_s // 60), int(duration_s % 60)
    dur_str = f"{mins}m {secs_rem:02d}s"

    meta = {
        "topic": topic,
        "scenario": scenario,
        "tts_backend": backend,
        "tts_model": args.model if backend == "openai" else None,
        "speech_segments": len(speech_segs),
        "word_count": word_count,
        "duration_seconds": round(duration_s, 1),
        "silence_ms_between_turns": args.silence_ms,
        "generated_at": datetime.now().isoformat(),
        "files": {"script": str(script_path), "audio": str(wav_path)},
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    update_index(out_dir.parent, topic, scenario, duration_s, out_dir.name)

    print(f"\n[podsplain] done")
    print(f"  duration:  {dur_str}")
    print(f"  audio:     {wav_path}")
    print(f"  script:    {script_path}")


if __name__ == "__main__":
    main()
