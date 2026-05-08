---
name: skill-optimizer
description: >
  Always-on AccentOS skill intelligence layer that makes every skill self-aware.
  When any AccentOS skill is invoked, skill-optimizer silently logs the invocation
  and generates ML-style improvement suggestions (trigger drift, friction points,
  format mismatches, anti-pattern gaps, scope boundaries, companion gaps). At
  session end, uncovered suggestions are surfaced grouped by skill — Michael is
  asked to optimize now or defer. Deferred suggestions accumulate a count; at
  3 deferrals the suggestion escalates at next occurrence. Pairs with
  efficiency-monitor (shared session-end boundary), skill-forge (executes deep
  rewrites), and skill-eval-suite (validates post-optimization). Auto-activates
  at session start via CLAUDE.md. Never interrupts mid-flow. Treats every AccentOS
  skill invocation as a training signal for self-improvement — no manual catch
  required. This is the self-optimization trigger: it flags improvement
  opportunities so Michael never has to notice them himself.
---

# skill-optimizer

**Purpose:** Turn every AccentOS skill run into a feedback signal. Skills shouldn't need Michael to notice friction — they should flag it themselves, generate specific improvement proposals, and ask for authorization to fix or defer. This closes the gap between a skill being used and a skill being improved.

**Hybrid design:**
- **In-flight (silent):** After each skill invocation, Claude logs observations and generates suggestions to `improvement-queue.md` — zero interruption during work.
- **End-of-run gate:** At session end, uncovered suggestions surface as a structured prompt with optimize-or-defer choices per skill.
- **Escalation:** Suggestions deferred 3+ times without a new justification automatically escalate to HIGH priority.

**Hard rules:**
- Never surface suggestions mid-session. Session end only.
- Never auto-edit a skill without explicit "optimize [name]" approval.
- Never propose optimization for a skill that was invoked but produced no friction signals.
- Log POSITIVE_SIGNAL runs — they matter for calibration.

---

## Suggestion types (the ML layer)

Each invocation is evaluated against 10 signal classes. Claude generates 0–3 suggestions per run.

| Code | Signal | What it means |
|------|--------|---------------|
| `TRIGGER_DRIFT` | Phrase used ≠ any listed trigger in SKILL.md | Add the phrase to trigger list |
| `MISSING_INPUT` | Claude had to ask for info the skill didn't pre-document | Add required input spec to skill |
| `STEP_FRICTION` | A step required re-tries, re-reads, or felt ambiguous | Clarify or split the step |
| `FORMAT_MISMATCH` | Output needed post-processing or reformatting | Adjust output format spec |
| `ANTI_PATTERN_GAP` | Edge case hit that anti-patterns section didn't cover | Add the new anti-pattern |
| `SCOPE_CREEP` | Skill used for something outside its stated scope | Narrow scope OR expand and doc it |
| `COMPANION_GAP` | Had to manually chain to another skill with no guidance | Add companion reference + handoff note |
| `STEP_ORDER` | Steps ran in different order than documented | Resequence documented steps |
| `VERBOSITY_MISMATCH` | Output was significantly too long or too short | Tune step output specs |
| `POSITIVE_SIGNAL` | Clean, frictionless invocation — no improvising needed | Log as success baseline |

**Priority assignment:**
- `HIGH` — same suggestion code appears 2+ times for same skill this session, OR signal is `MISSING_INPUT` or `ANTI_PATTERN_GAP`
- `MEDIUM` — single occurrence of `TRIGGER_DRIFT`, `FORMAT_MISMATCH`, `COMPANION_GAP`, `SCOPE_CREEP`
- `LOW` — `POSITIVE_SIGNAL`, minor `STEP_ORDER`, `VERBOSITY_MISMATCH` on first occurrence

---

## Step 0 — Boot (auto, session start)

Triggered by CLAUDE.md AUTO-EXECUTE step 1.k.

1. Read `skills/skill-optimizer/improvement-queue.md`.
2. Count entries by status: `uncovered`, `deferred`, `escalated`, `resolved`.
3. Count entries by skill name.
4. Read `skills/skill-optimizer/optimization-history.md` — note last optimization per skill.
5. Surface to Michael in current vibe-speak mode **only if** there are uncovered or escalated items:

```
⚙ skill-optimizer — pending from last session
  🔴 ESCALATED: [skill-name] — [suggestion code]: [one-line] (deferred [N]×)
  🟡 UNCOVERED: [skill-name] — [suggestion code]: [one-line]
  ...
  → reply "optimize [name]" or "defer [name]" or just continue and I'll ask at session end
```

If no uncovered/escalated items: output nothing. Fully silent boot.

---

## Step 1 — In-flight observation (silent, after each skill invocation)

After completing any AccentOS skill's workflow, before moving on:

1. **Self-report**: Internally evaluate the just-completed skill run against all 10 signal classes.
2. **Score the run**: For each signal found, note the skill name, signal code, one-line description.
3. **Append to usage log**: Write to `skills/skill-optimizer/skill-usage-log.md`:

```
### [YYYY-MM-DD HH:MM] — [skill-name]
- trigger_phrase: "[exact phrase Michael used]"
- outcome: [success | partial | failed]
- signals: [SIGNAL_CODE: one-line, SIGNAL_CODE: one-line, ...]
- positive: [yes if POSITIVE_SIGNAL | no]
```

4. **Generate suggestions**: For each non-POSITIVE signal, generate one actionable suggestion:

```
### [skill-name] — [SIGNAL_CODE] — [YYYY-MM-DD]
- skill: [skill-name]
- signal: [SIGNAL_CODE]
- priority: [HIGH | MEDIUM | LOW]
- observation: [one sentence: what happened]
- suggestion: [one sentence: specific change to SKILL.md]
- target_section: [section name in SKILL.md where change belongs]
- status: uncovered
- defer_count: 0
```

5. **Append to improvement-queue.md** — one block per suggestion.
6. **Update POSITIVE_SIGNAL count** in optimization-history.md if clean run.
7. Silent. Do not narrate.

**What to look for per signal class:**

- `TRIGGER_DRIFT`: Was the exact phrase Michael used listed verbatim or near-verbatim in the skill's trigger list? If not → flag.
- `MISSING_INPUT`: Did Claude have to ask a clarifying question or make an assumption because the skill didn't specify a required input? → flag.
- `STEP_FRICTION`: Did any step require more than one attempt, a re-read of the SKILL.md, or produce an unexpected intermediate state? → flag.
- `FORMAT_MISMATCH`: Did the output require editing or reformatting after generation (copy-paste adjustment, length trim, structural change)? → flag.
- `ANTI_PATTERN_GAP`: Did the skill hit a case explicitly NOT covered by its anti-patterns section, or a case that should have been warned against? → flag.
- `SCOPE_CREEP`: Was the skill invoked for a purpose outside its stated "when to use" definition? → flag.
- `COMPANION_GAP`: Did Claude have to manually chain to another skill or external lookup that the skill's `pairs with` section didn't reference? → flag.
- `STEP_ORDER`: Were steps executed in a different order than the SKILL.md workflow specifies, and would reordering improve the skill? → flag.
- `VERBOSITY_MISMATCH`: Was the output significantly longer or shorter than what the use case actually needed (not preference — actual utility)? → flag.
- `POSITIVE_SIGNAL`: Did the skill run cleanly with no improvising, no re-reads, output matched expected format exactly? → log as positive.

---

## Step 2 — Session end gate

Triggered at session end alongside efficiency-monitor Step 2. Run after efficiency-monitor completes so the output blocks don't overlap.

### 2a. Compile suggestions

1. Read `skills/skill-optimizer/improvement-queue.md`.
2. Filter: status = `uncovered` or `escalated`.
3. Group by skill name.
4. Within each group: sort HIGH → MEDIUM → LOW.
5. Check defer_count for each `uncovered` item — if ≥ 3, promote status to `escalated` before surfacing.

### 2b. Surface the gate

Format the gate block exactly:

```
━━ SKILL OPTIMIZER — session end ━━

[for each skill with uncovered/escalated items:]
📦 [skill-name]
  🔴 [SIGNAL_CODE] — [observation one-line] → [suggestion one-line]
  🟡 [SIGNAL_CODE] — [observation one-line] → [suggestion one-line]
  ...

[if no items:]
  ✓ No uncovered suggestions. All clear.

━━ GATE ━━
Optimize which skills now? Or defer?
  → "optimize [name]"          — Claude edits SKILL.md directly (small changes)
  → "optimize [name] via forge" — invokes skill-forge for structural rewrite
  → "optimize all high"        — applies all HIGH-priority items now
  → "defer [name]"             — increments defer_count, schedules for next session
  → "defer all"                — defers everything
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for Michael's reply before touching any SKILL.md.

### 2c. Execute approved optimizations

For each "optimize [name]" approval:

**Small changes** (apply directly):
- Adding a trigger phrase to the trigger list
- Adding an anti-pattern entry
- Adding a companion skill reference
- Fixing a step's output description
- Minor wording clarification

Process:
1. Read the target SKILL.md.
2. Apply the change via Edit tool.
3. Re-read to confirm change landed.
4. Mark suggestion as `resolved` in improvement-queue.md with `resolved_date`.
5. Append to optimization-history.md.

**Structural changes** (invoke skill-forge or skill-eval-suite):
- Rewriting a workflow step
- Reordering multiple steps
- Scoping expansion or contraction
- Adding a new workflow phase

Process:
1. State the structural change needed.
2. Ask Michael: "This needs skill-forge — want me to run it now or log it as a future-build?"
3. If yes: invoke skill-forge with the existing skill as the target.
4. If no: log to `skills/skill-forge/future-builds.md` with `why_deferred`.

### 2d. Execute defers

For each "defer [name]":
1. Find all `uncovered` suggestions for that skill in improvement-queue.md.
2. Increment `defer_count` by 1 for each.
3. If `defer_count` reaches 3: set `status: escalated`.
4. Write note: "Deferred [YYYY-MM-DD]. Next occurrence auto-escalates to HIGH."

### 2e. Post-gate writes

After all optimization decisions:
1. Write updated `improvement-queue.md` (statuses updated).
2. Write session entry to `optimization-history.md`.
3. Update `skills/skill-optimizer/session-end-summary.md` (overwrite each session).

Bundle all three into the session-end commit alongside efficiency-monitor writes.

---

## Step 3 — Direct invocation (on-demand analysis)

Triggered when Michael says:
- "optimize [skill-name]"
- "check [skill-name] for improvements"
- "what's wrong with [skill-name]"
- "how can [skill-name] be better"
- "skill health check on [skill-name]"
- "analyze [skill-name]"

Process:
1. Read the target skill's SKILL.md fully.
2. Read its usage log entries from `skill-usage-log.md` (last 10 invocations).
3. Run all 10 signal evaluations against the accumulated log data.
4. Generate comprehensive suggestion list.
5. Present findings + proposed edits.
6. Apply with approval.

Output format for direct invocation:

```
SKILL HEALTH REPORT — [skill-name]
Last [N] invocations analyzed

Signal summary:
  TRIGGER_DRIFT   [count]×
  STEP_FRICTION   [count]×
  ANTI_PATTERN_GAP [count]×
  POSITIVE_SIGNAL  [count]×
  [...]

Top suggestions:
  1. [HIGH] [SIGNAL_CODE]: [observation] → [specific proposed change]
  2. [MEDIUM] ...
  3. ...

Proposed edits:
  [section name]: [current text] → [replacement text]

Apply now? Y/N
```

---

## Anti-patterns

- **Never surface mid-session.** Skill friction exists during work; noticing it then breaks flow. Session end only.
- **Never auto-apply.** Every change to a SKILL.md requires explicit approval. The gate is the gate.
- **Never flag POSITIVE_SIGNAL as a problem.** Clean runs are data — record them, don't optimize them away.
- **Never generate suggestions for skills that were mentioned but not actually invoked.** Observation requires a real run.
- **Never generate more than 3 suggestions per single skill invocation.** Over-suggestion is noise. Pick the 3 highest-signal observations.
- **Never escalate before defer_count ≥ 3.** One defer is normal. Two defers is a pattern. Three is escalation territory.
- **Never run skill-forge on a skill without confirming.** Structural rewrites are higher stakes than minor edits.
- **Never batch small edits and structural rewrites into the same "optimize" action.** Execute small ones immediately, surface structural ones separately.
- **Never treat a SCOPE_CREEP signal as evidence the skill is broken.** It may mean the scope should expand — evaluate before suggesting contraction.
- **Never let improvement-queue.md grow beyond 50 entries.** If it does, consolidate duplicates and archive resolved entries.

---

## Files

| File | Purpose |
|------|---------|
| `skill-usage-log.md` | Per-invocation observation log (append-only) |
| `improvement-queue.md` | All suggestions with status, priority, defer count |
| `optimization-history.md` | What was optimized, when, and what changed |
| `session-end-summary.md` | Last session's gate output (overwritten each session) |

---

## Integration points

| Skill | How skill-optimizer integrates |
|-------|-------------------------------|
| `efficiency-monitor` | Shares session-end boundary. Run after efficiency-monitor Step 2 — same commit batch. |
| `skill-forge` | Invoked for structural optimizations (rewrite-level changes). skill-optimizer hands off target + suggestion list. |
| `skill-eval-suite` | Run after any optimization to validate the improved SKILL.md hasn't broken the eval suite. |
| `vibe-speak` | Session-start and end output uses current vibe-speak mode. Gate block always uses `vibe` mode (auto-disengage rule for multi-step sequences). |

---

## Companion skills

- `efficiency-monitor` — same session boundary hooks; complementary signal types
- `skill-forge` — executes the structural optimizations skill-optimizer proposes
- `skill-eval-suite` — validates improvements don't introduce regressions
- `codex-review` — use for deeper review before major rewrites
