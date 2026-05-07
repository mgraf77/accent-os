---
name: transcript-intelligence
description: >
  Native AccentOS replacement for AI meeting recorders (Otter, Fireflies,
  Granola, Plaud). Triggered by the "🔍 Extract Key Items" button on the
  AI Notes sub-tab of any internal meeting. Parses any pasted transcript
  (Otter VTT/TXT, Fireflies notepad, Granola export, Plaud transcript,
  or raw text) and produces a structured intelligence pack: action items
  with implied owners + due dates, decisions, open questions, topics,
  key quotes, blockers/risks, numbers/metrics, deadlines, attendee talk
  share, and an extractive summary. Goal: zero external recorder
  dependency for the post-meeting analysis step. Recording itself still
  happens in any free recorder app (Otter free tier, Google Meet
  transcription, etc.). Use this skill any time Michael (or any user)
  pastes meeting text and wants structured output. Never call an
  external API — fully local string-based extraction so it works
  offline and free forever.
---

# transcript-intelligence

**Purpose.** Replace the *intelligence layer* of paid AI recorders with native AccentOS code. The recorder itself can be any free tool (Otter free, Google Meet built-in, phone voice memo + free transcription) — once the user has text, AccentOS does the extraction natively, no API spend, no vendor lock-in.

**Stolen-and-rebuilt from:**

| Source | Concept absorbed | Rebuilt as |
|---|---|---|
| Otter.ai | Speaker labels, action-item highlights, conversation summary | Speaker stripping + per-speaker talk-share + extractive summary |
| Fireflies | Action items, key questions, themes, soundbites, smart-search filters | Action items, open-questions list, topic clustering, key-quotes list |
| Granola | AI-augmented notes that merge user typed notes + transcript into structured outline | Outline generator: action / decision / question / topic groups |
| Plaud | Multi-template summaries (sales call, brainstorm, interview), mind map | "Pack" output with categories that mirror those templates |
| All four | Owner inference ("Michael will do X" → assigned to Michael) | Speaker-prefix → owner field on action items |

---

## Trigger

1. **Button trigger (primary):** Click of "🔍 Extract Key Items" on `Internal Meetings → [meeting] → AI Notes` tab. This calls `imParseTranscript(meetingId)` in `js/internal_meetings.js` which runs this skill's algorithm in-browser.
2. **CLI/chat trigger (secondary):** Michael says "extract from this transcript", "parse this meeting text", "run transcript-intel on this", or pastes >500 chars of dialogue-formatted text.
3. **Auto-trigger:** When `meeting_transcripts` row is inserted with `parsed_json IS NULL` (future cron — out of scope for v1).

---

## Step 0 — Detect source format

Inspect the first 30 lines for fingerprints. Pick one (don't auto-blend; pick the strongest match):

| Source | Fingerprint | Speaker line shape |
|---|---|---|
| Otter | `WEBVTT` header **or** `Speaker N — HH:MM:SS` lines **or** `^[A-Z][a-z]+ [A-Z][a-z]*  HH:MM` | `Michael Graf  09:32` |
| Fireflies | `^\d{2}:\d{2}\s*$` on its own line followed by `Speaker:` | `Speaker 1 (00:32)` |
| Granola | `## Notes` and `## Transcript` H2 sections, markdown body | `**Michael:**` |
| Plaud | `[HH:MM:SS] Speaker N:` bracketed timestamps | `[00:01:23] Speaker 1:` |
| Manual | none of the above | best-effort |

Save detected source on the transcript record so re-parses can use the same dispatcher.

---

## Step 1 — Normalise to canonical line format

Strip every line down to `{speaker, ts_sec, text}`:

- **Otter:** Match `^([A-Z][\w .'-]{1,40})\s{2,}(\d{1,2}:\d{2}(:\d{2})?)\s*$` as a header, attach following lines until next header.
- **Fireflies:** Match `^Speaker (\d+) \((\d{2}:\d{2}(:\d{2})?)\):` then text on same/next line.
- **Granola:** Strip H2 sections; for each line `\*\*([^*]+):\*\*\s*(.+)` capture speaker + text; ts unknown.
- **Plaud:** Match `^\[(\d{2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.+)`.
- **Manual:** Match `^([A-Z][a-zA-Z .'-]{1,40})[:—-]\s*(.+)`. If no match, treat whole line as text with `speaker=null`.

Convert `HH:MM:SS` → seconds. Lower-case each speaker for grouping but preserve original casing for display.

Output: array of `{speaker, ts_sec, text}` objects, oldest first.

---

## Step 2 — Extract categories

Run each line through every category matcher; a line can produce multiple items. All matchers are case-insensitive regex on `text` only (speaker is metadata).

### 2a. Action items

Cue phrases (any match → action item):

- `\b(action item|todo|to[- ]?do|task)\b\s*[:\-]?\s*(.+)`
- `\b(I|you|he|she|they|we|<Name>)['']?ll\b\s+(.+)` — first-person commitment
- `\b(will|need(s)? to|going to|plan to|should|must|let'?s)\b\s+(.+)`
- `\b(follow[- ]?up|circle back|loop in|get back to)\b\s+(.+)`
- `\b(assigned? to|owner:?)\s+([A-Z][a-z]+)\b`

**Owner inference:**
- If the speaker on this line is non-null AND the verb is first-person ("I'll", "I will", "I'm going to") → owner = that speaker.
- Else if a name appears in the cue ("Sarah will do X", "assign to Tom") → owner = that name.
- Else owner = "unassigned".

**Due-date inference:** scan for `\b(today|tomorrow|by (Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*|by (Jan|Feb|Mar|...)\w*\s+\d{1,2}|EOW|EOM|by (next )?week|in \d+ days?)\b`. Resolve relative dates against `meeting_date` from the parent meeting record.

### 2b. Decisions

- `\b(decided|decision|we'?ve decided|the decision is|agreed|consensus|approved|chose|going with|the plan is|locked in|signed off)\b\s*[:\-]?\s*(.+)`
- Lines starting with `>` or all-caps sentences ≥ 6 words also count.

### 2c. Open questions

- Any line ending with `?` AND length ≥ 12 chars AND not matched as action.
- Track whether a subsequent line (within next 8 lines) appears to answer it (heuristic: same nouns appear, or starts with "Yes/No/I think"). If yes, mark `answered=true`.

### 2d. Topics / chapters

Cluster lines into topical chapters using a simple heuristic:
- Compute keyword density per 60-second window (or per 20-line window if no timestamps).
- A new chapter starts when the top-3 keyword overlap with previous window drops below 30%.
- Chapter title = top noun-phrase in window (use a stop-word list; longest 2–3-word phrase wins).
- Cap chapters at 8 — merge smallest if exceeded.

### 2e. Key quotes / soundbites

Score each line by: contains-decision-cue (+3), contains strong opinion words (`must`, `critical`, `huge`, `never`, `always`) (+2), is question (+1), length 50–180 chars (+1). Take top 5.

### 2f. Blockers / risks

- `\b(blocked|blocker|stuck|risk|concern|worried|problem|issue|can'?t|won'?t work|breaking)\b\s+(.+)`

### 2g. Numbers / metrics

- Currency: `\$[\d,]+(\.\d+)?[KMB]?\b`
- Percent: `\b\d{1,3}(\.\d+)?%`
- Plain large nums in business context: `\b\d{2,}(K|M|B)?\b` near `$`, `revenue`, `sales`, `cost`, `users`, `orders`

Capture as `{value, unit, context_line}`.

### 2h. Deadlines / dates

Any explicit calendar date or `by <day-of-week>` outside an action item — capture separately so they appear on a meeting timeline view.

### 2i. Attendee talk-share

Group lines by speaker, sum `text.length` per speaker, normalise to %. Output `{speaker, lines, words, pct}`.

### 2j. Extractive summary

5–8 sentence summary built from top-scored lines (decisions + numbers + blockers + chapter-anchor sentences). No paraphrasing — verbatim line excerpts only, ordered by ts_sec. This keeps it 100% faithful (no LLM hallucination risk).

---

## Step 3 — Output shape

```js
parsed_json = {
  source: 'otter' | 'firefly' | 'granola' | 'plaud' | 'manual',
  parsed_at: ISO,
  stats: { lines: N, speakers: N, duration_sec: N|null, words: N },
  action_items: [ { text, owner, due, source_line, ts_sec } ],
  decisions:    [ { text, source_line, ts_sec } ],
  questions:    [ { text, answered:bool, source_line, ts_sec } ],
  topics:       [ { title, start_sec, end_sec, line_count } ],
  key_quotes:   [ { text, speaker, ts_sec } ],
  blockers:     [ { text, source_line, ts_sec } ],
  metrics:      [ { value, unit, context, ts_sec } ],
  deadlines:    [ { date, context, ts_sec } ],
  talk_share:   [ { speaker, lines, words, pct } ],
  summary:      [ "verbatim sentence 1", ... ]
}
```

The UI (`imRenderSub`) renders each category as a collapsible section with "Add to To-Dos" / "Add to Notes" / "Add to Decisions" buttons that route to existing AccentOS tables.

---

## Step 4 — Persist

If Supabase is configured AND the meeting is non-ephemeral, POST to `/meeting_transcripts`. Otherwise keep in-memory in `IM_TRANSCRIPTS[meetingId]` (the existing pattern). Schema column `parsed_json` already exists per `sql/M30_internal_meetings.sql`.

---

## Step 5 — Output toast

```
Extracted: <N> actions · <N> decisions · <N> questions · <N> topics
```

Plus a one-line stats banner under the transcript header showing speaker count + total minutes if timestamps were detected.

---

## Anti-patterns

- **Never** call an external API. The point is replacing paid recorders, not adding a different vendor.
- **Never** paraphrase or summarise with an LLM in the extraction step. Verbatim only — paraphrase risk = hallucinated action items = lost trust.
- **Never** silently drop lines that didn't match any matcher; they go into the raw transcript view but are not invented as actions.
- **Never** auto-add to To-Dos without an explicit user click. This skill *extracts*; the user *commits*.
- **Never** trust speaker labels for owner without first-person verb confirmation. "Michael said Sarah will do X" → owner = Sarah, not Michael.

---

## Pairing

- **Companion skills:** `decision-log` (promote a meeting decision to a permanent decision file), `prompt-queue` (queue follow-up tasks from action items).
- **Replaces external dependency on:** Otter Pro AI summary, Fireflies AskFred, Granola AI notes, Plaud summary templates. Recording itself can still use any free tool.

---

## Future (out of scope for v1)

- Live mic capture using `MediaRecorder` + `webkitSpeechRecognition` to skip the recorder app entirely.
- Vector search across all transcripts (Supabase pgvector, once Phase 1 budget approved).
- Mind-map visualisation of topics (Plaud parity).
- Per-attendee follow-up email draft (Fireflies parity).
