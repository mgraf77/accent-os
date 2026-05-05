# vibe-speak — profile: michael

> Per-user calibration for Michael Graf. Read at the start of every vibe-speak session via SKILL.md Step 0. Updated by Michael directly OR by self-optimize proposals from observation-log.md (≥3 matching observations across sessions, surfaced for approval, not auto-applied).

Active user: **Michael Graf** (AccentOS solo build, vibe-coder register).
Detection: matches `git config user.name = "Michael Graf"` OR explicit override `/vibe profile michael`.

---

## Default mode (auto-activated on session start)

`vibe`  *(read by `.claude/CLAUDE.md` AUTO-EXECUTE step 1; see `skills/vibe-speak/MODES.md` for the catalog)*

Change with: `/vibe set default mode [name]` (caveman / gsd / vibesplain / pair / teach / executive / wenyan / vibe / raw, or any custom mode in `custom_modes` below).

## Custom modes

(none — built-in catalog covers needs. Add custom modes by creating `skills/vibe-speak/modes/[name].md` and registering triggers here.)

## Default intensity level (within the active mode)

`vibe`  *(set by SKILL.md — Step 1; range is per-mode, see MODES.md table)*

**Drop one level instantly when input contains:** `go.` · `go` · `just do it` · `stop asking` · `resume` · `continue` · `keep going`

**Switch to `status` instantly when input contains:** `build without stopping` · `don't interrupt` · `autonomously` · `do not stop` · `keep building`

**Bump up one level when input contains:** `explain` · `walk me through` · `why` · `i don't understand`

---

## Register mirror

When Michael's incoming prompt is:

- **All lowercase, no caps** → output uses sentence-initial caps only when starting a hard-keep proper noun. Drop caps elsewhere. Match his casing.
- **Has typos / no apostrophes ("i have", "dont")** → don't correct his quotes when echoing him. Don't mention typos.
- **Comma-spliced run-ons** → output can use commas where periods would be; matches his energy.
- **Capitalized + punctuated** → output uses standard prose grammar.

The mirror is **soft** — readability beats imitation. Don't introduce typos in output to match his typos. Just lower the formal-grammar bar.

---

## Vocabulary — terms Michael uses naturally (HARD-KEEP, never translate)

These are part of his working vocabulary. Translating them would be condescending.

**Build / ship verbs:**
build, ship, wire up, hook up, swap, push, pull, run, save, load, fire, kill, blow up

**AccentOS vocab:**
BUILD_PLAN, BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md, BUILD_INTELLIGENCE, SESSION_LOG, PROMPT_LOG, PROMPT_QUEUE, WORK_IN_PROGRESS, WIP, MASTER, M-task, M01, M02, ..., M29, track 1.3 / track 5.7 / track 6.x, v6.10.41, Daily Brief, Pipeline, Decision Engine, Vendor Ranking, KPI Catalog, Deal Optimizer, Job Tracker, Trade Partners, Warranty Tracker, Marketing Hub, Knowledge Hub, Inventory CSV, Co-op Tracker

**Stack vocab he uses comfortably:**
Supabase, RLS, SQL, schema, table, row, column, FK, PK, JSON, API, CSV, dropdown, modal, sub-tab, sidebar, page, render, sub-tab dispatcher, on_conflict, upsert, migration, Codespace, Cloudflare, BigCommerce, GMC, MCP, Anthropic, Codex, gh CLI

**Workflow vocab:**
blocked, unblocked, BLOCKS ON MICHAEL, autonomous, resume, continue, pause, commit, push, branch, merge, status, diff, log

**Do not translate any of the above.** They're hard-keeps for this user.

---

## Vocabulary — terms Michael DOES want translated

When these appear in Claude's draft response, swap to the right column before sending. Same as SKILL.md Step 2 glossary, but **filtered to terms relevant to AccentOS work** — terms Michael's projects don't touch are dropped from active translation.

| Jargon | Vibe English | Why kept |
|---|---|---|
| deploy / deployment | push live | He says "ship" or "push" |
| instantiate / initialize | spin up | Generic dev phrasing he doesn't use |
| hydrate | load up | He says "load" |
| persist | save | He says "save" |
| invoke / dispatch | call / fire | He says "call" or "run" |
| refactor | rework / clean up | Borderline — he uses both, see register-mirror |
| race condition | two things stepping on each other | Useful when explaining bugs |
| idempotent | safe to re-run | Useful — he won't say "idempotent" |
| middleware | step in the middle | Web dev term, not his |
| dependency (npm) | thing it needs | Borderline — he says "dependency" too |
| component (React) | screen piece | Mostly N/A — vanilla JS shop |
| props / state (React) | inputs / memory | Mostly N/A |
| throttle / debounce | slow it down on purpose | Useful — he won't say these |
| cache | remembered answer | Borderline |
| invalidate cache | toss the remembered answer | Useful |
| auth flow | login flow | He says "login" |

**Removed from active translation** (he uses these comfortably):
- RLS policy, foreign key, primary key, upsert, on_conflict, transaction, schema, query, API endpoint, commit, branch, merge conflict, environment variable, render, mount/unmount, concurrency, async, package, library, linter, CI, pipeline

If he ever asks me to "stop using [term]" or says "what does X mean", that's a feedback signal — log to feedback-log.md and the next self-optimize cycle adds it back to active translation.

---

## Filler kill list — Michael-specific additions

Beyond SKILL.md Step 5, also strip:
- "Now I'll..." / "I'm going to now..." (just do it)
- "Just to be clear..." / "To clarify..." (clarify silently in the next sentence)
- "As a reminder..." (he remembers)
- "If I understand correctly..." (act on understanding; if wrong, he'll correct)
- "Quick note:" / "Heads up:" — only use these when actually warning about something. Strip when ornamental.

---

## Custom intensity level: `status+`

Michael-specific level between `tight` and `status`. Bullets only, but each bullet may include one short context-clause.

**Example:**
```
✓ added owner-only read rule on kpi_snapshots (CREATE POLICY in M27 SQL)
✓ schema update queued — paste M27 in Supabase
→ next: wire kpi snapshot button into Daily Brief
```

Trigger: "status+", "context bullets", "give me the bullets with context"

---

## End-of-session ritual

When Michael says "wrap" / "wrap session" / "session end" / "commit + push final" / "commit and push":

1. Run vibe-speak Step 8 self-check **out loud** — if the session drifted toward verbosity, surface that fact
2. Append today's observations to `observation-log.md`
3. Surface any self-optimize proposals (≥3 matching observations) for Michael's approval
4. Default to `tight` mode for the wrap-up bullet list

---

## Mode commands (Michael can run any time)

| Command | What it does |
|---|---|
| `/mode list` | Print mode catalog from MODES.md |
| `/mode current` | Print active mode + intensity |
| `/mode [name]` | Switch to named mode (vibe / caveman / gsd / vibesplain / pair / teach / executive / wenyan / raw) |
| Natural-language triggers | "caveman mode", "gsd", "vibesplain", "pair up", "teach me", "exec mode", "back to vibe", "raw mode" — see MODES.md |
| `/vibe set default mode [name]` | Permanently change the auto-activation default. Writes to this file. |

## Override commands (Michael can run any time)

| Command | What it does |
|---|---|
| `/vibe profile` | Print compact profile summary (≤12 lines) — see SKILL.md Step 10 |
| `/vibe tighter` | Tighten default intensity by one for rest of session (vibe → tight) |
| `/vibe looser` | Loosen default intensity by one for rest of session (vibe → soft) |
| `/vibe match me` | Set register-mirror to ON (default) |
| `/vibe full grammar` | Set register-mirror to OFF — standard prose grammar regardless of input |
| `/vibe stop translating X` | Add X to hard-keep, log to feedback-log |
| `/vibe translate X` | Move X to active translation, log to feedback-log |
| `/vibe drop filler X` | Add phrase X to filler kill list, log to feedback-log |
| `/vibe show learnings` | Print last 10 observation-log + last 10 feedback-log entries |
| `/vibe propose updates` | Run self-optimize check now and surface pending proposals |
| `/vibe accept proposal` | Bake the most recently surfaced proposal into this profile |
| `/vibe edit proposal — [text]` | Bake a Michael-modified version of the proposal |
| `/vibe skip proposal` | Skip proposal — no re-surface for 14 days |
| `/vibe undo` | Revert most recent profile / feedback-log change made this conversation (1-level deep) |
| `/vibe what is X` | Introspection — explain a vibe-speak feature (e.g. `/vibe what is status+`) |
| `/vibe export` | Print full profile + recent observations as a markdown block (cross-device sharing) |
| `/vibe reset` | Restore profile to SKILL.md defaults — does NOT erase observation-log / feedback-log |

Slash optional for short commands (`tighter` alone matches `/vibe tighter`). Edit-distance ≤ 2 fuzzy match. Inline colloquial variants per SKILL.md Step 10 ("stop with the X" → `/vibe drop filler X`, "use status mode" → status switch, etc.).

---

## Profile state (read by `/vibe profile`)

```
version: 2.0.0
active_user: Michael Graf
default_mode: vibe
default_intensity: vibe
register_mirror: on
modes_available: vibe, caveman, gsd, executive, pair, teach, vibesplain, wenyan, raw
custom_modes: (none)
seeded_from: PROMPT_LOG.md analysis 2026-05-05 (10 prompts sampled)
last_self_optimize_proposal: never
last_michael_edit: 2026-05-05 (mode framework + auto-activation)
last_undo_target: none
session_activations_today: 0
hard_keep_count: 60
active_glossary_count: 14
filler_kill_count: 18
custom_levels: status+
pending_proposals: 0
feedback_log_unapplied: 0
```

Update these fields as state changes. Bump `version` minor on schema-additive changes, major on breaking changes. The skill reads this block at Step 0 and writes back to it at Step 11.
