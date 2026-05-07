## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-07 — session end · transcript-intelligence v2 shipped (native recorder + 2 optimization passes)
**Current task:** —
**Step:** Tree clean on `claude/find-free-meeting-recorder-qnNB1`. HEAD `05d3633`, origin in sync.

**Recent shipped (this session):**
- `skills/transcript-intelligence/` — new skill replacing Otter / Fireflies / Granola / Plaud post-meeting AI layer; 100% local string parsing, no external API
- `js/internal_meetings.js` — full v2 rewrite of `imParseTranscript()`:
  - Pass 1 (quality): filler stripping, speaker-name canonicalisation, action disqualifiers (questions / negations / past-tense recaps), decision/action de-overlap, Jaccard near-dedup, topic noise filter, short-circuit Q-answer detection
  - Pass 2 (perf): pre-compiled regex registry (`_TI_RX`), expanded stop-word `Set`, per-line tokenization cache, single-pass scoring, `Map`-based talk tracker, `/g` regex hot-path with `lastIndex` reset
  - Native recorder: `imToggleRecording()` using Web Speech API; live in-browser capture replaces the manual export-and-paste step entirely
- `skills/_index.md` — `transcript-intelligence` entry registered (companions: decision-log, prompt-queue)

**Files touched:** `skills/transcript-intelligence/SKILL.md`, `skills/_index.md`, `js/internal_meetings.js`, `PROMPT_LOG.md`, `SESSION_LOG.md`, `WORK_IN_PROGRESS.md`, `skills/efficiency-monitor/{efficiency-log.md, session-end-summary.md}`.

**Commit chain:** `7cf9053` (skill v1) → `05d3633` (v2: pass-1 + pass-2 + native recorder) → final (session-end docs).

**Branch status:** `claude/find-free-meeting-recorder-qnNB1` pushed to origin. NOT merged to main.

**Next step if interrupted:**
1. Verify tree clean: `git status`
2. Open PR or merge `claude/find-free-meeting-recorder-qnNB1` → main when Michael approves
3. Smoke test in browser: open a meeting → AI Notes tab → click 🎤 Record Live → speak → ⏹ Stop → verify auto-extraction renders all categories

**Watchlist:**
- Does Web Speech API behave reliably on Michael's primary browser?
- Are Pass-1 disqualifiers (negation / past-tense) producing false negatives on real transcripts?
