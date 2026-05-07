#!/usr/bin/env python3
"""
podsplain.py — TTS audio generator for the podsplain skill.

Reads a pre-generated podcast script (HOST_1:/HOST_2: format) and converts it
to a single WAV file using OpenAI TTS or ElevenLabs TTS.

Usage:
  python3 scripts/podsplain.py --script-file podsplains/<slug>/script.md --output-dir podsplains/<slug>/

Options:
  --script-file PATH    Script file to convert (required)
  --output-dir PATH     Directory to write episode.wav + meta.json (default: same dir as script)
  --tts TEXT            auto|openai|elevenlabs (default: auto — prefers OpenAI)
  --silence-ms INT      Milliseconds of silence between speaker turns (default: 350)

Env vars (at least one TTS key required):
  OPENAI_API_KEY        For OpenAI TTS (tts-1, voices: onyx + nova)
  ELEVENLABS_API_KEY    For ElevenLabs TTS (eleven_multilingual_v2)
"""

import argparse
import io
import json
import os
import re
import sys
import time
import wave
from datetime import datetime
from pathlib import Path

import requests


# ─── Voice config ─────────────────────────────────────────────────────────────

# OpenAI TTS voices — onyx is deeper/authoritative, nova is warm/curious
OPENAI_VOICES = {
    "HOST_1": "onyx",
    "HOST_2": "nova",
}

# ElevenLabs voice IDs — Adam (confident) and Bella (warm)
ELEVENLABS_VOICES = {
    "HOST_1": "pNInz6obpgDQGcFmaJgB",
    "HOST_2": "EXAVITQu4vr4xnSDxMaL",
}

ELEVENLABS_SAMPLE_RATE = 24000  # pcm_24000

# TTS normalization — replacements applied before sending text to any TTS engine
# Prevents em-dashes from creating unnatural pauses, cleans markdown artifacts
_TTS_REPLACEMENTS = [
    (r" — ",        ", "),     # em-dash mid-sentence → natural comma pause
    (r"—",          ", "),     # bare em-dash
    (r"\.\.\.",     ", "),     # ellipsis → brief comma pause (not trailing silence)
    (r"\*\*(.+?)\*\*", r"\1"),  # strip bold markdown
    (r"\*(.+?)\*",  r"\1"),    # strip italic markdown
    (r"`(.+?)`",    r"\1"),    # strip inline code ticks
    (r"\[interrupts\]\s*", ""),  # strip any leftover interrupt markers
]


# ─── Script parsing ───────────────────────────────────────────────────────────

def parse_script_file(script_path: Path) -> list[dict]:
    """
    Parse a podsplain script file into segments.

    Skips the markdown header block (lines before the first HOST_1:/HOST_2: line).
    Returns list of dicts: {type: "speech"|"pause", speaker: str, text: str, ms: int}
    """
    text = script_path.read_text(encoding="utf-8")
    segments = []

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue

        m = re.match(r"^(HOST_[12]):\s*(.+)$", line)
        if m:
            speaker = m.group(1)
            dialogue = m.group(2).strip()
            # Strip inline interrupt markers — TTS doesn't need them
            dialogue = re.sub(r"\[HOST_\d+\s+interrupts?\]\s*", "", dialogue)
            dialogue = dialogue.strip()
            if dialogue:
                segments.append({"type": "speech", "speaker": speaker, "text": dialogue})
            continue

        if line.startswith("[PAUSE_SHORT]"):
            segments.append({"type": "pause", "ms": 500})
        elif line.startswith("[PAUSE_MED]"):
            segments.append({"type": "pause", "ms": 1000})

    return segments


# ─── TTS backends ─────────────────────────────────────────────────────────────

def _normalize_for_tts(text: str) -> str:
    """Clean text of markdown artifacts and punctuation that sounds bad in TTS."""
    for pattern, replacement in _TTS_REPLACEMENTS:
        text = re.sub(pattern, replacement, text)
    return text.strip()


def tts_openai(text: str, voice: str, api_key: str) -> bytes:
    """Call OpenAI TTS API, return WAV bytes (24kHz 16-bit mono)."""
    resp = requests.post(
        "https://api.openai.com/v1/audio/speech",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "tts-1-hd",
            "input": _normalize_for_tts(text),
            "voice": voice,
            "response_format": "wav",
        },
        timeout=90,
    )
    resp.raise_for_status()
    return resp.content


def tts_elevenlabs(text: str, voice_id: str, api_key: str) -> bytes:
    """Call ElevenLabs TTS API, return WAV bytes (PCM 24kHz wrapped in WAV)."""
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": _normalize_for_tts(text),
            "model_id": "eleven_multilingual_v2",
            "output_format": "pcm_24000",
            "voice_settings": {
                "stability": 0.50,
                "similarity_boost": 0.75,
                "style": 0.10,
                "use_speaker_boost": True,
            },
        },
        timeout=90,
    )
    resp.raise_for_status()
    # ElevenLabs returns raw PCM — wrap it in a WAV container
    return _pcm_to_wav(resp.content, sample_rate=ELEVENLABS_SAMPLE_RATE)


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, sampwidth: int = 2) -> bytes:
    """Wrap raw 16-bit PCM bytes in a standard WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)
    return buf.getvalue()


def _make_silence(sample_rate: int, channels: int, sampwidth: int, ms: int) -> bytes:
    """Generate raw WAV frame data for a silent gap."""
    n_frames = int(sample_rate * ms / 1000)
    return b"\x00" * (n_frames * channels * sampwidth)


OPENAI_MAX_CHARS = 4000  # OpenAI TTS hard limit is 4096; stay safely under


def _chunk_text(text: str, max_chars: int = OPENAI_MAX_CHARS) -> list[str]:
    """Split text at sentence boundaries if it exceeds max_chars."""
    if len(text) <= max_chars:
        return [text]
    chunks = []
    current = ""
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


def _call_tts(text: str, speaker: str, backend: str, openai_key: str, elevenlabs_key: str) -> bytes:
    """Route TTS call to the correct backend, chunking long text, with retry."""
    chunks = _chunk_text(text) if backend == "openai" else [text]
    wav_parts = []
    for chunk in chunks:
        for attempt in range(3):
            try:
                if backend == "openai":
                    part = tts_openai(chunk, OPENAI_VOICES[speaker], openai_key)
                else:
                    part = tts_elevenlabs(chunk, ELEVENLABS_VOICES[speaker], elevenlabs_key)
                wav_parts.append(part)
                break
            except requests.RequestException as e:
                if attempt == 2:
                    raise
                wait = 2 ** attempt
                print(f"  [retry {attempt+1}/2 in {wait}s] {e}", file=sys.stderr)
                time.sleep(wait)
    if len(wav_parts) == 1:
        return wav_parts[0]
    # Merge multiple WAV chunks into one
    buf = io.BytesIO()
    params = None
    for part in wav_parts:
        r = wave.open(io.BytesIO(part))
        if params is None:
            params = r.getparams()
            buf_w = wave.open(buf, "wb")
            buf_w.setparams(params)
        buf_w.writeframes(r.readframes(r.getnframes()))
        r.close()
    buf_w.close()
    return buf.getvalue()


# ─── WAV assembly ─────────────────────────────────────────────────────────────

def assemble_wav(segments: list[dict], backend: str, openai_key: str, elevenlabs_key: str, silence_ms: int) -> tuple[bytes, float]:
    """
    Convert parsed segments into a single WAV file.

    Returns (wav_bytes, duration_seconds).
    """
    speech_count = sum(1 for s in segments if s["type"] == "speech")
    print(f"[podsplain] Synthesizing {speech_count} speech segments via {backend}...")

    wav_parts = []
    wav_params = None
    speech_idx = 0

    for seg in segments:
        if seg["type"] == "pause":
            if wav_params:
                silence = _make_silence(wav_params.framerate, wav_params.nchannels, wav_params.sampwidth, seg["ms"])
                wav_parts.append(("raw", silence))
            continue

        speech_idx += 1
        speaker = seg["speaker"]
        preview = seg["text"][:55] + ("..." if len(seg["text"]) > 55 else "")
        print(f"  [{speech_idx}/{speech_count}] {speaker}: {preview}")

        wav_bytes = _call_tts(seg["text"], speaker, backend, openai_key, elevenlabs_key)
        wav_parts.append(("wav", wav_bytes))

        # Capture WAV params from first audio chunk
        if wav_params is None:
            r = wave.open(io.BytesIO(wav_bytes))
            wav_params = r.getparams()
            r.close()

        # Add inter-speaker silence after every speech segment
        if wav_params:
            silence = _make_silence(wav_params.framerate, wav_params.nchannels, wav_params.sampwidth, silence_ms)
            wav_parts.append(("raw", silence))

    if wav_params is None:
        raise RuntimeError("No audio was generated — check TTS keys and script content.")

    # Assemble final WAV
    out_buf = io.BytesIO()
    with wave.open(out_buf, "wb") as out:
        out.setparams(wav_params)
        for kind, data in wav_parts:
            if kind == "raw":
                out.writeframes(data)
            else:
                r = wave.open(io.BytesIO(data))
                out.writeframes(r.readframes(r.getnframes()))
                r.close()

    wav_bytes = out_buf.getvalue()

    # Calculate duration
    total_frames = len(wav_bytes) / (wav_params.sampwidth * wav_params.nchannels)
    duration_s = total_frames / wav_params.framerate

    return wav_bytes, duration_s


# ─── Index update ─────────────────────────────────────────────────────────────

def update_index(podsplains_dir: Path, topic: str, scenario: str, duration_s: float, slug: str, wav_path: Path):
    index_path = podsplains_dir / "INDEX.md"
    header = (
        "# PodSplain Episodes\n\n"
        "| # | Date | Topic | Scenario | Duration | File |\n"
        "|---|------|-------|----------|----------|------|\n"
    )
    if not index_path.exists():
        index_path.write_text(header)

    existing = index_path.read_text(encoding="utf-8")

    # Count existing data rows to derive next episode number
    data_rows = [l for l in existing.split("\n") if l.startswith("| ") and not l.startswith("| #") and "---" not in l]
    ep_num = len(data_rows) + 1

    date_str = datetime.now().strftime("%Y-%m-%d")
    mins = int(duration_s // 60)
    secs = int(duration_s % 60)
    dur_str = f"{mins}m {secs:02d}s"
    row = f"| {ep_num} | {date_str} | {topic} | {scenario} | {dur_str} | `{slug}/episode.wav` |\n"

    index_path.write_text(existing + row, encoding="utf-8")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="podsplain TTS audio generator")
    parser.add_argument("--script-file", required=True, help="Path to the podsplain script .md file")
    parser.add_argument("--output-dir", default=None, help="Directory to write episode.wav (default: script file's directory)")
    parser.add_argument("--tts", default="auto", choices=["auto", "openai", "elevenlabs"], help="TTS backend")
    parser.add_argument("--silence-ms", type=int, default=350, help="Milliseconds of silence between speaker turns")
    parser.add_argument("--dry-run", action="store_true", help="Parse script and print segment summary, skip TTS and WAV generation")
    args = parser.parse_args()

    script_path = Path(args.script_file).resolve()
    if not script_path.exists():
        print(f"ERROR: script file not found: {script_path}", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(args.output_dir).resolve() if args.output_dir else script_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── TTS key detection ──
    openai_key = os.getenv("OPENAI_API_KEY", "")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")

    backend = args.tts
    if backend == "auto":
        if openai_key:
            backend = "openai"
        elif elevenlabs_key:
            backend = "elevenlabs"
        else:
            print("ERROR: No TTS API key found.", file=sys.stderr)
            print("  Set OPENAI_API_KEY (preferred) or ELEVENLABS_API_KEY", file=sys.stderr)
            print("  The script file has been generated:", script_path, file=sys.stderr)
            sys.exit(1)

    if backend == "openai" and not openai_key:
        print("ERROR: --tts openai specified but OPENAI_API_KEY is not set", file=sys.stderr)
        sys.exit(1)
    if backend == "elevenlabs" and not elevenlabs_key:
        print("ERROR: --tts elevenlabs specified but ELEVENLABS_API_KEY is not set", file=sys.stderr)
        sys.exit(1)

    # ── Parse script ──
    print(f"[podsplain] Parsing script: {script_path.name}")
    segments = parse_script_file(script_path)

    speech_segs = [s for s in segments if s["type"] == "speech"]
    pause_segs = [s for s in segments if s["type"] == "pause"]
    word_count = sum(len(s["text"].split()) for s in speech_segs)
    print(f"[podsplain] {len(speech_segs)} speech segments, {len(pause_segs)} pauses, ~{word_count} words")

    if not speech_segs:
        print("ERROR: No HOST_1:/HOST_2: lines found in script file.", file=sys.stderr)
        print("  Make sure the script uses the format: HOST_1: [text]", file=sys.stderr)
        sys.exit(1)

    if word_count < 50:
        print(f"WARNING: Script is very short ({word_count} words). Expected 700+ for a short episode.", file=sys.stderr)
        print("  The script may not have generated correctly — check script.md.", file=sys.stderr)

    if args.dry_run:
        host1 = sum(1 for s in speech_segs if s["speaker"] == "HOST_1")
        host2 = sum(1 for s in speech_segs if s["speaker"] == "HOST_2")
        est_secs_low = len(speech_segs) * 1
        est_secs_high = len(speech_segs) * 3
        print(f"[dry-run] Segment breakdown:")
        print(f"  HOST_1: {host1} segments")
        print(f"  HOST_2: {host2} segments")
        print(f"  pauses: {len(pause_segs)}")
        print(f"  words:  ~{word_count}")
        print(f"  est. generation time: {est_secs_low//60}m{est_secs_low%60}s – {est_secs_high//60}m{est_secs_high%60}s")
        print(f"[dry-run] No audio generated. Remove --dry-run to produce episode.wav.")
        return

    # ── Generate audio ──
    wav_bytes, duration_s = assemble_wav(segments, backend, openai_key, elevenlabs_key, args.silence_ms)

    # ── Save files ──
    wav_path = out_dir / "episode.wav"
    wav_path.write_bytes(wav_bytes)

    mins = int(duration_s // 60)
    secs = int(duration_s % 60)
    dur_str = f"{mins}m {secs:02d}s"

    # Derive topic and scenario from script header if present
    topic = "unknown"
    scenario = "learn"
    script_text = script_path.read_text(encoding="utf-8")
    topic_match = re.search(r"^#\s+PodSplain:\s*(.+)$", script_text, re.MULTILINE)
    scenario_match = re.search(r"^\*\*Scenario:\*\*\s*(.+)$", script_text, re.MULTILINE)
    if topic_match:
        topic = topic_match.group(1).strip()
    if scenario_match:
        scenario = scenario_match.group(1).strip()

    meta = {
        "topic": topic,
        "scenario": scenario,
        "tts_backend": backend,
        "speech_segments": len(speech_segs),
        "word_count": word_count,
        "duration_seconds": round(duration_s, 1),
        "silence_ms_between_turns": args.silence_ms,
        "generated_at": datetime.now().isoformat(),
        "files": {
            "script": str(script_path),
            "audio": str(wav_path),
        },
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    # Update parent INDEX.md
    slug = out_dir.name
    update_index(out_dir.parent, topic, scenario, duration_s, slug, wav_path)

    print(f"\n[podsplain] Episode complete!")
    print(f"  duration:  {dur_str}")
    print(f"  audio:     {wav_path}")
    print(f"  script:    {script_path}")
    print(f"  meta:      {out_dir / 'meta.json'}")


if __name__ == "__main__":
    main()
