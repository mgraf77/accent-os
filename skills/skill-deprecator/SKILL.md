---
name: skill-deprecator
description: >
  AccentOS retirement-loop closer for the skill ecosystem. Reads
  underperformer rows from `skill-performance-tracker`'s last report,
  PROPOSE-DEPRECATION findings from `skill-health-monitor`'s last health
  audit, and (when present) high-fail-rate flags from `skill-eval-runner`
  output. Consolidates these signals into a single deprecation queue with
  a hard rule: a skill needs **≥2 independent signals** before it's even a
  candidate. Single-signal candidates surface as WATCH, never deprecate.
  For each multi-signal candidate, drafts a deprecation proposal block
  (signals, last-invocation, replacement skill if any subsumes the work,
  rollback plan) and waits for Michael's per-skill approval. Approved
  deprecations are physically moved — `mkdir -p skills/_deprecated/`,
  `mv skills/[name] skills/_deprecated/`, removed from `_index.md`,
  appended to `skills/skill-health-monitor/deprecated-log.md`. Closes the
  Accent Lighting vision goal "dying skills deprioritized; thriving skills
  taught to new MCPs" — `skill-health-monitor` proposes Edits but doesn't
  retire, `skill-performance-tracker` measures but doesn't act, this skill
  is the closer. Use this skill when Michael says: "deprecate skills",
  "what should we retire", "/deprecate", "skill graveyard", "kill
  underperformers", or any phrasing that asks which skills should leave
  the active registry. Do not use this skill to fix structural rot (use
  `skill-health-monitor`), measure performance (use
  `skill-performance-tracker`), or run quality probes (use
  `skill-eval-runner`). Always present per-skill proposal blocks before
  any move — never batch-deprecate, never auto-deprecate even after
  approval, never act on a single-source signal.
---

# skill-deprecator

**Purpose:** Be the one skill in the AccentOS ecosystem that actually retires other skills — gated by ≥2 independent signals, per-skill approval, and a documented rollback path. Without this closer, `skill-performance-tracker`'s underperformer report and `skill-health-monitor`'s PROPOSE-DEPRECATION findings just pile up and the Accent Lighting registry rots forward.

> Naming note: the gap-optimizer queue spec called this "skill-deprecator" (16 chars). Within the `skill-forge` ≤25-char skill-name rule. Scope is unchanged from the gap-run-003 brief.

Closes the meta-loop:

```
skill-performance-tracker → underperformer report  ─┐
skill-health-monitor      → PROPOSE-DEPRECATION   ─┼→ skill-deprecator → propose → Michael approves → execute
skill-eval-runner         → high-fail-rate flag    ─┘                                              ↓
                                                                                  skills/_deprecated/[name]/
                                                                                  _index.md (removed)
                                                                                  deprecated-log.md (appended)
```

---

## Trigger Recognition

Run this skill when Michael says anything like (lowercase, terse, knock-out / fire register per `skills/vibe-speak/profiles/michael.md`):

- "deprecate skills" / "deprecate [name]" / "let's deprecate"
- "what should we retire" / "what skills should we retire" / "retire some skills"
- "/deprecate" / "/retire" / "/graveyard"
- "skill graveyard" / "send to the graveyard" / "graveyard time"
- "kill underperformers" / "kill the underperformers" / "kill dead skills"
- "knock out the dead skills" / "fire the deprecator" / "run the deprecator"
- "what's on the chopping block" / "chopping block" / "is anything ready to retire"
- "are any skills ready for retirement" / "should we kill any skills"
- "process the underperformer queue" / "act on the underperformer report"

Also auto-trigger when:
- `skill-performance-tracker` emits a footer suggesting `deprecation-candidates` and Michael accepts it.
- `skill-health-monitor` reports ≥1 PROPOSE-DEPRECATION finding AND `skill-performance-tracker`'s last UNDERPERFORMERS block contains the same skill — the auto-route hints at "run skill-deprecator to consolidate."
- `gap-optimizer` flags "queue saturation" — health audit + deprecation may free forge capacity.

Do **not** trigger for: forging skills (use `skill-forge`), measuring performance (use `skill-performance-tracker`), structural-rot fixes (use `skill-health-monitor`), or merge proposals (use `skill-health-monitor` Step 6).

---

## Scope

**In scope:**
- Reading underperformer + PROPOSE-DEPRECATION + eval-runner reports.
- Consolidating signals per skill, applying the ≥2 independent signals rule.
- Drafting per-skill deprecation proposals with replacement / rollback context.
- Executing approved deprecations: `mv` to `skills/_deprecated/`, `_index.md` registry removal, `deprecated-log.md` append.

**Out of scope — fail fast with a one-line redirect:**
- Building a new skill → "Use `skill-forge`."
- Measuring per-skill performance → "Use `skill-performance-tracker`."
- Structural-rot audit (broken refs, frontmatter rot, duplicate scope) → "Use `skill-health-monitor`."
- Eval / regression probing → "Use `skill-eval-runner`."
- Choosing what to build next → "Use `gap-optimizer`."
- Merging two skills (different from deprecating one) → "Use `skill-health-monitor` Step 6."

---

## Step 0 — Preflight (parallel reads)

Run in parallel:

1. **Read `skill-performance-tracker`'s latest report.** Look in this order:
   - `/home/user/accent-os/skills/skill-performance-tracker/last-run.md` (overwrites every run — this is the canonical "most recent" pointer).
   - If absent, fall back to the newest file in `skills/skill-performance-tracker/reports/YYYY-MM-DD.md`.
   - Parse BLOCK 2 (UNDERPERFORMERS table). Capture each row: `skill`, `match_rate`, `invocation_rate`, `user_satisfaction_signal`, `staleness_days`, `Likely cause`. The recommended-action column carries hints — `consider deprecation`, `quality regression`, `trigger phrases mismatched`. Anything tagged `consider deprecation` is a **performance signal**.
2. **Read `skill-health-monitor`'s latest health report.** Look in this order:
   - The newest file in `skills/skill-health-monitor/health-report-YYYY-MM-DD.md`.
   - If `skills/skill-health-monitor/applied-fixes.md` references PROPOSE-DEPRECATION findings not in the saved report, also include those (in case Michael ran an unsaved audit).
   - Parse the STALENESS section. Each row tagged `Status: PROPOSE-DEPRECATION` is a **structural signal**.
3. **Read `skill-eval-runner` results (optional dependency).** Look at `skills/skill-eval-runner/last-fail-report.md` if it exists. Each skill listed with pass-rate <60% AND ≥2 consecutive failing eval runs is a **quality signal**. If `skill-eval-runner` doesn't exist or has no output yet, skip this signal class — never abort.
4. **Read the registry** — `/home/user/accent-os/skills/_index.md`. Build the canonical name set. Detect drift between registry + `skills/` directory.
5. **Read `skills/skill-health-monitor/deprecated-log.md`** — to skip skills already deprecated (don't re-propose) and to detect "deprecation reverted" patterns (skill returned to active registry after prior deprecation).
6. **Capture branch state** — `git -C /home/user/accent-os branch --show-current`. The deprecation move + `_index.md` edit are committed on the working branch only; never on `main` without explicit consent (see Step 5 commit gate).

Output of Step 0: one-line preflight: "deprecator inputs — performance report: [date or MISSING] · health report: [date or MISSING] · eval-runner: [date or MISSING] · registry skills: [N] · already in _deprecated/: [M]."

**Failure-mode handling for Step 0:**

- **`last-run.md` and any `reports/*.md` are absent on `skill-performance-tracker`** (skill never run): emit one-line `Warning — performance signal source MISSING; deprecator can run on health + eval signals alone, but the ≥2-signal rule means very few candidates will surface. Run "skill performance" first, then re-invoke deprecator.` and continue with whatever signal sources exist.
- **`skill-health-monitor` has never produced a report**: same shape — emit `Warning — structural signal source MISSING; performance + eval may be insufficient alone.` Continue.
- **Both performance + health reports are MISSING and eval-runner has no output**: abort the run with `error: skill-deprecator has zero signal sources — run "skill performance" and "/skill-health" first, then retry.` Never propose deprecations from a single source by relaxing the ≥2-signal rule.
- **Performance report parse failure** (BLOCK 2 markdown table malformed): log `parse warning — UNDERPERFORMERS table at line N unparseable; skipping performance signals for this run; route to skill-health-monitor.` Continue with health + eval.
- **Skill listed in performance report does not exist on disk**: surface as a registry-drift finding in the receipt; do not propose deprecation (the structural skill audit owns that fix). The skill is treated as "no signal" in the consolidation.
- **Skill in `_deprecated/` still appears in `_index.md`**: surface as a registry-drift one-liner; do not re-deprecate. Suggested fix: edit `_index.md` to remove the entry. Defer to Michael.
- **Concurrent deprecator run** (lock file `skills/skill-deprecator/.run.lock` <5 min old): exit with `Warning — concurrent run detected; rerun in [N] seconds.` Stale locks (>5 min) are removed and the run proceeds.

---

## Step 1 — Consolidate signals per skill

For every skill that appears in any signal source, build a row:

```
{
  "skill": "rep-group-matchmaker",
  "signals": ["performance:underperformer", "structural:propose-deprecation"],
  "performance_evidence": "0% match · n/a invocation · 89d stale (skill-performance-tracker last-run.md row 1)",
  "structural_evidence": "STALENESS: 187d since last invocation; no scheduled cadence (skill-health-monitor health-report-2026-05-08.md)",
  "quality_evidence": null,
  "last_invocation": "2026-02-09 (89d ago)",
  "registered_in_index": true,
  "in_deprecated_log": false
}
```

Apply the **≥2 independent signals** rule:

| Signal count | Status | What this run does |
|---|---|---|
| 0 | not in queue | (skill not surfaced) |
| 1 | **WATCH** | Listed in BLOCK 2 of the receipt; no proposal block; tracked across runs to detect when a 2nd signal lands |
| ≥2 | **CANDIDATE** | Listed in BLOCK 1 of the receipt; full proposal block drafted in Step 2 |

The three signal sources are **independent by design**:
- **performance** = "Michael isn't using it" (usage-side)
- **structural** = "Michael hasn't invoked it AND no scheduled-cadence excuse" (calendar-side, redundant-with-performance only when both window definitions overlap exactly)
- **quality** = "when it does run, the eval suite fails" (correctness-side)

Two performance signals from different reports do NOT count as 2 independent — they're the same source class. WATCH-status skills that gain a second class become CANDIDATES on the next run.

Hard rule: **never propose deprecation on a single-class signal**, even if that signal is screaming RED. Single-flag candidates often have a structural fix (trigger-phrase remining, eval-suite stale, scheduled-cadence note missing) that re-uses the skill rather than retiring it. The ≥2 rule forces multiple lenses to agree before retirement.

Edge cases:

- **Skill has a `scheduled-cadence` note in its frontmatter** (e.g. `vendor-risk-register` is quarterly): structural staleness signal does not count for this skill. Surface in BLOCK 4 of the receipt as `excluded — scheduled-cadence: quarterly`. The performance signal still counts; the skill needs a 2nd signal from quality or a different rule. This avoids flagging legitimate low-cadence skills.
- **Skill is BLOCKED on an M-task** (frontmatter description mentions `M##-blocked stub mode`): never deprecate; the skill is intentionally inactive until unblocked. Surface as `excluded — M-task-blocked: [M##]`.
- **Skill is auto-active per `.claude/CLAUDE.md`** (vibe-speak, efficiency-monitor, gap-optimizer): low invocation_rate is structural to its design — surface as `excluded — auto-active per CLAUDE.md`.
- **Skill was deprecated previously** (entry exists in `deprecated-log.md` with a "reverted" line): treat as a yellow flag — propose with extra weight on the rollback-plan section (the skill clearly had a return path before).

---

## Step 2 — Draft per-skill deprecation proposal blocks

For each CANDIDATE row from Step 1, draft a proposal block. Block shape (paste-ready):

```
DEPRECATION PROPOSAL: [skill-name]
  Signals (≥2 independent):
    - PERFORMANCE: [evidence with source line ref]
    - STRUCTURAL:  [evidence with source line ref]
    - QUALITY:     [evidence with source line ref]   ← if present
  Last invocation:     YYYY-MM-DD ([N] days ago)
  Currently in registry: yes/no
  Frontmatter cadence:   [scheduled / on-demand / auto-active]
  Replacement skill:     [name OR "(none — capability dropped)"]
  Replacement rationale: [one-sentence why the replacement covers the deprecated triggers, OR explicitly why no replacement exists]
  Rollback plan:
    1. mv skills/_deprecated/[name] skills/[name]
    2. Restore _index.md entry from deprecated-log.md snapshot
    3. (no schema changes — this skill is read-only on its own scope)
  Risk:                  LOW | MED | HIGH
  Risk rationale:        [one sentence]
  Recommended action:    DEPRECATE | KEEP-AND-FIX | KEEP-AND-MERGE
```

`Replacement skill` semantics:
- If the underperformer's triggers overlap >70% with another active skill's triggers (mined from `_index.md` triggers field + the skill's `## Trigger Recognition` section — Jaccard similarity), name that skill as the replacement.
- If no replacement exists, surface `(none — capability dropped)` AND raise the risk to MED minimum AND set `Recommended action` to KEEP-AND-FIX (the registry doesn't drop capability via deprecation alone — that's a `gap-optimizer` rebuild call).

`Risk` derivation:
- LOW — replacement skill exists AND skill never invoked in last 90d AND not BLOCKED.
- MED — no replacement OR skill invoked 1–5 times in last 90d.
- HIGH — skill is referenced as a companion in ≥3 other skills' frontmatter (deprecation cascades into companion-link breakage; surface as a follow-on for `skill-health-monitor`).

`Recommended action`:
- DEPRECATE — risk LOW or MED, replacement exists or capability genuinely deprecated.
- KEEP-AND-FIX — at least one signal is a fixable structural issue (stale trigger phrases → route to `phrase-miner`; no eval suite → route to `skill-eval-suite`).
- KEEP-AND-MERGE — duplicate-scope finding from `skill-health-monitor` exists; route to its Step 6 merge flow instead of deprecation.

Never auto-pick `DEPRECATE` from the Recommended action — present it; the approval gate in Step 3 is where the decision lives.

---

## Step 3 — Approval gate (per-skill, never batched)

Emit the receipt (see **Output format**) with all CANDIDATE proposal blocks. Stop. Wait for Michael's reply.

Approval grammar (per row, not batch):
- `deprecate [name]` → execute Step 4 for that skill. Other rows are NOT touched.
- `keep [name]` → log decision to `skills/skill-deprecator/decisions-log.md` with rationale `kept-by-michael` and a one-line note (Michael's optional argument or "no rationale given"). Skip Step 4 for this skill.
- `keep [name] and fix triggers` → same as `keep` but also routes to `phrase-miner` with a forwarded `mine triggers for [name]` request.
- `keep [name] and run evals` → routes to `skill-eval-runner` with `eval [name]`.
- `merge [name] into [other]` → routes to `skill-health-monitor` Step 6 with the merge proposal seed.
- `watch [name]` → keep in active registry but record as a permanent watch row in `skills/skill-deprecator/watch-list.md`; the next run will surface it again with this run's signal evidence prepended (so Michael sees the trend).
- `defer all` → log all current candidates to watch-list.md without action.

Hard rule: **no `deprecate all` shortcut.** Each row gets its own approval. The whole point of the ≥2-signal rule is to slow the destructive path; a batch button would defeat that.

If Michael replies in natural language without using the grammar (e.g. "yeah let's drop rep-group-matchmaker"), parse and confirm with the grammar form before executing — never proceed on ambiguous approval.

---

## Step 4 — Execute approved deprecations

For each approved row (and only those):

1. **Snapshot the registry entry** — read the skill's block from `_index.md` (4 lines: `summary`, `triggers`, `when_to_use`, `when_NOT`, `companion`). Capture for the deprecated-log entry.
2. **Move the directory** — `mkdir -p /home/user/accent-os/skills/_deprecated/` if absent. `mv /home/user/accent-os/skills/[name] /home/user/accent-os/skills/_deprecated/[name]`. Use git-aware `git mv` so history follows: `git -C /home/user/accent-os mv skills/[name] skills/_deprecated/[name]`.
3. **Remove from `_index.md`** — Edit out the `### [name]` section block (h3 + 5-line schema entry) cleanly. Preserve surrounding structure.
4. **Append to `skills/skill-health-monitor/deprecated-log.md`** in the schema established by `skill-health-monitor` Step 8:

   ```
   ### YYYY-MM-DD — deprecated [name]
   - reason: multi-signal (performance: [evidence] · structural: [evidence] · quality: [evidence-or-none])
   - last invocation: YYYY-MM-DD or "never"
   - signals at deprecation: [list]
   - replacement skill: [name or "(none)"]
   - moved to: skills/_deprecated/[name]/
   - registry snapshot:
     ```
     [verbatim 5-line _index.md entry — for rollback reconstruction]
     ```
   ```

5. **Append to `skills/skill-deprecator/decisions-log.md`** the per-skill action, including the approval phrase Michael used, for cross-session traceability.
6. **Detect cascade** — for each deprecated skill, search `skills/*/SKILL.md` for `companion: [name]` or `Pairs with \`[name]\`` references. Surface as a follow-on `companion-link cascade` finding in BLOCK 5 of the receipt, routed to `skill-health-monitor` for the next audit. Do NOT modify other skills in this run — companion cleanup is `skill-health-monitor`'s lane.

Hard rule: **never do step 2/3/4 in parallel across multiple deprecations on the same run.** Serialize per skill so a partial-failure mid-batch doesn't leave the registry in a half-moved state. After each per-skill move, verify: (a) `skills/[name]/` no longer exists, (b) `skills/_deprecated/[name]/SKILL.md` exists, (c) `_index.md` no longer contains the `### [name]` h3, (d) `deprecated-log.md` has the new entry. If any verification fails, halt the run and surface the partial state in the receipt.

---

## Step 5 — Commit gate

After all approved per-skill moves succeed:

1. Stage the changed paths only: `git add skills/_deprecated/[deprecated-names]/ skills/[deprecated-names]/ skills/_index.md skills/skill-health-monitor/deprecated-log.md skills/skill-deprecator/decisions-log.md`. Note: the deprecated paths are staged BOTH as deletions (under `skills/[name]/`) AND as adds (under `skills/_deprecated/[name]/`) — git mv handles this.
2. Commit message: `chore(skills): deprecate [N] skill(s) per skill-deprecator approval — [name1, name2, ...]`.
3. Push only if Michael explicitly says `push it` or `commit and push`. Default is local commit only — same posture as `skill-health-monitor` Step 9.
4. Never push to `main` without `push to main` explicit consent. Working branch only.

If zero approvals were given (Michael said `defer all` or only `keep`/`watch`), no commit. The receipt itself is not committed.

---

## Step 6 — Surface to companion skills

After the run (committed or not):

1. **`skill-performance-tracker`** — overwrite `skills/skill-deprecator/last-run.md` with the receipt. Performance-tracker's next run reads this to suppress UNDERPERFORMERS rows for skills already deprecated this cycle (avoids re-flagging skills that just left the registry).
2. **`skill-health-monitor`** — append a one-liner to `skills/skill-health-monitor/applied-fixes.md`: `[YYYY-MM-DD HH:MM] skill-deprecator: [N deprecated] [M kept] [K watched]`. Lets the next `/skill-health` audit see the deprecation activity in context.
3. **`gap-optimizer`** — append to `skills/gap-optimizer/gap-log.md` under a "deprecations this cycle" subhead. Deprecated skills' triggers free up trigger-surface for new skills; gap-optimizer should know.

Never modify SKILL.md files of other skills, never edit `_index.md` beyond removing the deprecated entries, never modify the deprecated skill's own SKILL.md after the move.

---

## Output format

```
═══ SKILL-DEPRECATOR REPORT — YYYY-MM-DD HH:MM ═══
Branch: [branch] | Inputs: perf=[date] health=[date] eval=[date|MISSING]

SUMMARY
  Skills with ≥2 signals (CANDIDATEs):  [N]
  Skills with 1 signal (WATCH):         [M]
  Skills excluded (BLOCKED / scheduled / auto-active): [K]
  Already in _deprecated/:              [P]

═══ BLOCK 1: DEPRECATION PROPOSALS (≥2 independent signals) ═══

[per-skill proposal block — see Step 2 shape]
[per-skill proposal block]
...

═══ BLOCK 2: WATCH LIST (1 signal — track for next run) ═══

| Skill | Single signal | Source line | Why not deprecating yet |
|-------|---------------|-------------|-------------------------|
| [name] | performance:underperformer | last-run.md row 4 | needs structural-or-quality 2nd source |
| ... |

═══ BLOCK 3: EXCLUDED (signal present but rule bars deprecation) ═══

| Skill | Reason | Detail |
|-------|--------|--------|
| vendor-risk-register | scheduled-cadence | quarterly — staleness expected |
| trade-vendor-portal | M-task-blocked | M03+M04+M11+M24+M40 still blocking |
| vibe-speak | auto-active | per .claude/CLAUDE.md step 1 |
| ... |

═══ BLOCK 4: REGISTRY DRIFT NOTES ═══

[any one-liners about skills in _index.md but not on disk, or vice versa, or skills already in _deprecated/ but still listed in _index.md]
[empty if none]

═══ BLOCK 5: COMPANION-LINK CASCADE PREVIEW ═══

If you approve [skill-name]'s deprecation:
  - X other skills reference it as a companion (will surface in next /skill-health)
  - Y other skills' "Pairs with" mentions become dead refs (skill-health-monitor proposes Edits)
  - Z action_queue executor-registry rows depend on this skill (run /registry-check post-deprecation)

═══ APPROVAL GATE ═══
Per-skill grammar (no batch shortcut by hard rule):
  - "deprecate [name]"             → executes the move
  - "keep [name]"                  → logs decision, skips
  - "keep [name] and fix triggers" → routes to phrase-miner
  - "keep [name] and run evals"    → routes to skill-eval-runner
  - "merge [name] into [other]"    → routes to skill-health-monitor Step 6
  - "watch [name]"                 → adds to watch-list, surfaces next run
  - "defer all"                    → no action; all candidates moved to watch-list

I am stopping here. Nothing is moved or removed until you reply per row.
═══════════════════════════════
```

**Partial output rules:**

- All five blocks always emitted — empty blocks render as `(no rows meet criteria)`.
- BLOCK 5 (cascade preview) is computed even when there are zero proposals — empty preview still says "no companion impact (zero candidates this run)".
- If Step 0 surfaced one or more MISSING signal sources, the SUMMARY row prefixes a `⚠ Partial-signal mode — [missing sources]` line.
- A failed `git mv` in Step 4 halts the run mid-row; the receipt grows a `═══ BLOCK 6: HALT NOTICE ═══` block describing which row failed and the rollback state.

---

## AccentOS context

- **Stack:** read across `/home/user/accent-os/skills/`; writes only to `skills/_deprecated/`, `skills/_index.md`, `skills/skill-health-monitor/deprecated-log.md`, `skills/skill-deprecator/decisions-log.md`, `skills/skill-deprecator/last-run.md`, `skills/skill-deprecator/watch-list.md`. No Supabase calls, no BigCommerce calls, no API keys required (meta-infra skill operates entirely on the AccentOS skill ecosystem itself).
- **Project:** AccentOS for Accent Lighting (residential lighting retailer; BC store `store-cwqiwcjxes`; Supabase `hsyjcrrazrzqngwkqsqa`). The skill ecosystem is the audit subject — no Accent Lighting business data is read here.
- **Paths:** `/home/user/accent-os/skills/skill-deprecator/` (Codespace alt: `/workspaces/accent-os/skills/skill-deprecator/`).
- **Source files read (read-only inputs):**
  - `/home/user/accent-os/skills/skill-performance-tracker/last-run.md`
  - `/home/user/accent-os/skills/skill-performance-tracker/reports/*.md` (latest fallback)
  - `/home/user/accent-os/skills/skill-health-monitor/health-report-*.md` (latest)
  - `/home/user/accent-os/skills/skill-health-monitor/applied-fixes.md`
  - `/home/user/accent-os/skills/skill-health-monitor/deprecated-log.md`
  - `/home/user/accent-os/skills/skill-eval-runner/last-fail-report.md` (if present)
  - `/home/user/accent-os/skills/_index.md`
  - Each candidate skill's `SKILL.md` (frontmatter cadence + companion references)
- **Files written (write-side):**
  - `/home/user/accent-os/skills/skill-deprecator/last-run.md` (overwrite each run)
  - `/home/user/accent-os/skills/skill-deprecator/decisions-log.md` (append-only)
  - `/home/user/accent-os/skills/skill-deprecator/watch-list.md` (overwrite each run with current watches)
  - `/home/user/accent-os/skills/_index.md` (Edit: remove deprecated entries only)
  - `/home/user/accent-os/skills/skill-health-monitor/deprecated-log.md` (append-only)
  - `/home/user/accent-os/skills/_deprecated/[name]/` (move target; created via `git mv`)
- **Companion skills:**
  - `skill-performance-tracker` — signal source 1 (UNDERPERFORMERS report). Read-only consumer.
  - `skill-health-monitor` — signal source 2 (PROPOSE-DEPRECATION findings) AND log writer (deprecated-log.md is owned by health-monitor by convention; deprecator appends).
  - `skill-eval-runner` — signal source 3 when present (high-fail-rate quality flag).
  - `gap-optimizer` — downstream consumer (deprecated triggers free up surface; gap-optimizer's next run sees the closure).
  - `skill-forge` — never invoked by deprecator; deprecation does not auto-trigger forge.
  - `phrase-miner` — routed to on `keep [name] and fix triggers` approval.

---

## Anti-patterns

- **Never deprecate on a single signal**, even if that signal is loud. The ≥2 independent signals rule is a hard prerequisite; a single performance underperformer is a `phrase-miner` candidate, not a deprecation candidate.
- **Never auto-deprecate even after batch-level approval.** Each skill gets its own per-row approval. Refuse `deprecate all` shortcuts; if Michael typed it, ask him to retype with per-row grammar.
- **Never count two signals from the same source class as independent.** Two performance reports are still one signal class. The ≥2 rule requires distinct lenses (usage / structural / quality).
- **Never deprecate a skill with `M-task-blocked`, `scheduled-cadence`, or `auto-active per CLAUDE.md` markers** — these are intentionally low-frequency by design. Surface in BLOCK 3 (EXCLUDED) instead.
- **Never modify another skill's SKILL.md.** Companion-link cleanup belongs to `skill-health-monitor` Step 1 (broken-refs check). Surface the cascade as a follow-on; let the next health audit fix the dead refs.
- **Never run Step 4 in parallel across multiple skills.** Serialize per skill; verify each move before the next. A partial-failure mid-batch leaves the registry in a half-moved state that's expensive to reconcile.
- **Never push to `main` without `push to main` explicit consent.** Working branch only — same posture as `skill-health-monitor` Step 9.
- **Never write a "successful run" receipt when a `git mv` failed mid-batch.** Surface the halt notice as BLOCK 6 with the partial state and the rollback step.
- **Never re-propose a skill that's already in `skills/_deprecated/`.** Pre-Step-1 filter from the deprecated-log; rerouting back to active requires Michael to manually `git mv` it back AND re-add the `_index.md` entry.
- **Never collapse a green run to "no deprecations."** Always emit the five blocks (with empty placeholders) — Michael needs to see what was checked, not just what acted. Silent-green and silent-broken-deprecator are indistinguishable.
- **Never delete a deprecated skill's directory.** The `mv` to `skills/_deprecated/` preserves history and supports rollback. `rm -rf` deletes are never the deprecation path.
- **Never auto-promote a `WATCH` row to `CANDIDATE` mid-run.** A WATCH row gains its 2nd signal on the NEXT run's input read, not within the current run's signal pass. Otherwise transient signals could double-count.
