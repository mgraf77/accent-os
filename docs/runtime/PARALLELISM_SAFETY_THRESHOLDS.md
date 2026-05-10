# PARALLELISM SAFETY THRESHOLDS

> **Companion to:** `EXECUTION_ECONOMICS_MODEL.md`.
> **Scope:** Operational thresholds for running N concurrent Claude sessions on AccentOS without entering a regime where reconciliation cost exceeds delivery value.
> **Frame:** Definitions and hard limits. Analysis-only — does not change governance, does not edit OPERATING RULES.
> **Last updated:** 2026-05-10

---

## 1. Vocabulary

- **Session.** One Claude (or ChatGPT) instance with a live transcript on one device.
- **Branch.** Git branch the session writes to. Sessions and branches are 1:1 in safe regimes.
- **Captain.** Michael — only entity that approves work crossing a money/strategy/vendor-data boundary.
- **Reconciliation.** The act of integrating one session's output into the trunk while preserving every other session's work.
- **Branch entropy (BE).** Probability that a randomly-chosen line in a branch's diff conflicts (textually or semantically) with another live branch's diff.
- **Reconciliation collapse.** State in which the *expected cost* of integrating a new branch exceeds the *expected value* of its work. Once entered, throughput goes negative — the system loses ground per session.

---

## 2. Concurrency zones

Three named zones, mapped to N:

### Zone GREEN — safe concurrency (N = 1–2)

- BE ≤ 0.05.
- Captain supervision is ambient (~5–12% of attention).
- Merge cost is dominated by per-branch fixed cost; conflicts are rare.
- WIP doc can be a single shared file with light discipline.
- *No special restrictions.*

### Zone YELLOW — bounded concurrency (N = 3)

- BE ≈ 0.10–0.20.
- Net useful throughput peaks here, but coordination cost has already begun to bend the curve.
- Captain supervision is ~25%.
- **Required guardrails:**
  - Each session must declare its target BUILD_PLAN item in WIP before starting.
  - No two sessions edit the same `js/<module>.js` simultaneously.
  - Edits to `index.html` are serialized: at most one session at a time may have an uncommitted `index.html` change.
  - Schema migrations (`M##` SQL) are exclusive — only one session may have an open migration.
  - Captain reviews at least once every ~90 minutes during a Yellow run.

### Zone RED — unstable concurrency (N ≥ 4)

- BE ≥ 0.35.
- Net useful throughput drops below Zone YELLOW. Adding a session removes value.
- Captain supervision >45% — Captain is the bottleneck, not the sessions.
- **Hard rule: do not enter Zone RED unless every session is restricted to a non-overlapping module file *and* no session touches `index.html` *and* no session opens a migration.**
- Even with the above, recommended only for short windows (< 60 min) with Captain actively monitoring.

### Zone BLACK — collapse (N ≥ 6)

- BE ≥ 0.65.
- Reconciliation collapse is the default outcome.
- Captain saturates; sessions queue up unacknowledged work that becomes orchestration debt the next day.
- **Do not operate here.** No known guardrail recovers a Zone BLACK regime; the only response is to stop new sessions, drain the existing queue serially, and let BE decay back below 0.20.

---

## 3. Human supervision requirements

Mapped per zone:

| Zone | N | Captain attention floor | Review cadence | Captain may be: |
|---|---|---|---|---|
| GREEN | 1–2 | Ambient | End-of-task | Anywhere, including phone |
| YELLOW | 3 | Active | Every ~90 min | At a real keyboard, not just phone |
| RED | 4–5 | Continuous | Per-commit | At a real keyboard, undistracted |
| BLACK | 6+ | N/A — do not enter | N/A | N/A |

**Rule:** Captain on iPhone-only is sufficient for GREEN, marginal for YELLOW, insufficient for RED. The reason is that semantic merge conflicts (the dangerous kind) require reading multi-file diffs that don't fit comfortably on a phone, so they get rubber-stamped, which is the worst possible failure mode (approval without comprehension).

---

## 4. Branch entropy thresholds

Branch entropy (BE) is a calibrated estimate, not a measured metric. It rises as:

- More live branches exist.
- More of those branches touch shared files (`index.html`, `MASTER.md`, `BUILD_PLAN_CLAUDE.md`, `module_modes.json`).
- More of those branches define or mutate global JS objects (`USERS`, `VENDORS`, `INVENTORY`, `goTo` routes, sidebar entries).
- Branches grow older (each day a branch sits unmerged, its BE roughly doubles relative to the trunk).
- Captain has not reviewed the branch yet.

### Numeric thresholds

| BE | Meaning | Required action |
|---|---|---|
| 0.00–0.05 | Negligible. Branches are isolated by file. | Proceed normally. |
| 0.05–0.20 | Low. Some shared-file edits, no global mutation conflicts. | Merge in arrival order. Captain skim is sufficient. |
| 0.20–0.40 | Elevated. Multiple branches edit `index.html` or shared globals. | Captain must read each diff. Merge in *intent* order, not arrival order. Stage merges; do not bulk-merge. |
| 0.40–0.65 | High. Cross-branch semantic conflicts likely. | Stop spawning new sessions. Drain the live queue. Resolve in a focused window. |
| > 0.65 | Critical. Reconciliation collapse imminent. | Freeze new work entirely. Captain serially merges or rejects each branch. Investigate root cause before resuming. |

### Operationally

- **Branch age cap:** any branch older than 72h with unmerged changes should be either merged or closed. Older branches become entropy reservoirs.
- **Touched-file cap:** if a single branch touches more than 5 files *and* one of them is `index.html`, escalate one BE band.
- **Global-mutation flag:** if any branch adds or removes a top-level `const`/`let`/`window.X`, that branch is treated as one band hotter than its file count would suggest. (Per BUILD_INTELLIGENCE: the `USERS{}` removal already cost a session.)

---

## 5. Reconciliation collapse conditions

Reconciliation collapses when *any* of the following hold:

1. **Captain backlog > 3 unreviewed branches at BE ≥ 0.20.** The merge queue is now growing faster than it can drain.
2. **Two or more branches have modified the same `str_replace` anchor in `index.html`.** Surgical patches no longer apply cleanly; manual reconciliation per patch is required.
3. **WIP doc has been overwritten by a session that did not first read the prior WIP.** Ground truth is now lost across sessions.
4. **A branch has been re-based more than twice in 24h.** Each rebase compounds line drift; the third rebase typically introduces a silent regression.
5. **A schema migration was applied to remote without a paired down-migration *and* the change broke an earlier session's open work.** Data-layer rollback is now non-trivial.
6. **The same BUILD_PLAN item is `[x]`-claimed by two sessions in different commits.** Duplicate ship — both have to be reconciled to one canonical implementation.
7. **`SESSION_LOG.md` is missing entries for shipped commits more than 24h old.** History fidelity is degrading; future sessions will reason from incomplete state.

If any condition holds: **stop spawning new sessions immediately.** The system needs a serial drain, not more parallelism.

---

## 6. Maximum sustainable overnight parallelism

Overnight = Captain unavailable for ≥6h. Numbers from `EXECUTION_ECONOMICS_MODEL.md` §13.

### Default: **N = 2.**

Two sessions, both on isolated branches, each restricted to one module file. No `index.html` edits, no migrations, no shared-global changes.

### Conditional: **N = 3** *only if all of:*

- Each session is on a separate `js/<module>.js` not touched by any other.
- No session edits `index.html`.
- No session opens a SQL migration.
- WIP is per-session (file-per-session, not shared).
- BUILD_PLAN items are pre-claimed before sleep.
- No skill registry edits.
- All three sessions have at least one prior successful overnight run on the same task class.

### Hard cap: **N = 3 overnight.**

Anything above N=3 overnight produces an expected morning Captain-cost greater than the overnight build value. Refer to `EXECUTION_ECONOMICS_MODEL.md` §9 for the asymmetric rollback cost — bad overnight commits compound for 6+ hours before discovery.

### Pre-overnight checklist (analysis spec, not enforcement)

If used:

- [ ] Every live session committed and pushed.
- [ ] WIP doc per session, all up-to-date.
- [ ] BUILD_PLAN items pre-claimed.
- [ ] No open SQL migrations.
- [ ] `index.html` last-touched > 30 min ago across all sessions.
- [ ] BE estimated ≤ 0.20 at sleep time.
- [ ] At least one of the live sessions has the autonomous-mode skill active so it self-paces, doesn't chain wildly.

If any item is missing → reduce N by one for the night.

---

## 7. Failure modes that look like success

These are the dangerous cases — the system reports green but is actually accumulating debt. Defined here so they can be recognized; quantified in `TOKEN_TO_OUTPUT_EFFICIENCY.md` §4.

- **High commit count, low ship count.** Many WIP commits, but the BUILD_PLAN didn't move. Symptom: doc-drift and surface churn.
- **Clean linter, broken cross-branch invariants.** Each branch is internally clean; together they violate something (sidebar registration order, version string monotonicity, schema column presence).
- **Auto-deploy success masking a wrong feature.** Cloudflare Pages says "deployed in 15s." That doesn't mean the feature works — only that the bundle compiled. AccentOS has no deploy-time smoke tests.
- **WIP says "done," BUILD_PLAN still `[ ]`.** Indicates the session forgot the batched-doc-update at session-end. Real cost: the next session does it again.
- **Multiple sessions all "boot complete" but none have made progress yet.** Boot-cost amplification has consumed the morning's token budget.

---

## 8. Suggested governance posture (analysis only — does not modify OPERATING RULES)

This is what the thresholds above imply *if* the project ever wanted to encode them. Captured for reference, not for adoption in this pass.

- Default to **N = 2** for any unsupervised window.
- Promote **N = 3** to "preferred" for supervised waking-hours work — that's where net useful throughput is highest.
- Treat **N ≥ 4** as a deliberate escalation requiring a stated reason and a Captain checkpoint within 60 minutes.
- Never advertise **N ≥ 6** as an option. The model says it cannot work with the current architecture.
- Make BE the primary instrument: estimate it at every session-spawn and merge decision. Even a rough estimate (Low / Elevated / High) prevents the worst regimes.

---

## 9. DONE / KNOWN / NEXT

**DONE**
- Defined GREEN / YELLOW / RED / BLACK concurrency zones.
- Mapped human supervision requirements per zone.
- Specified branch-entropy bands and per-band actions.
- Listed seven reconciliation-collapse trigger conditions.
- Set maximum sustainable overnight parallelism at **N = 2 (3 with all guardrails)**.

**KNOWN**
- Branch entropy is currently estimated, not measured. A simple empirical proxy (count of live branches × shared-file touch count × age in hours) would track the curve well enough for operational use.
- The N=3 "conditional overnight" assumes module isolation that the current `index.html` topology actively prevents. Until the file is split, *real* overnight ceiling is closer to N=2 even with guardrails.
- These thresholds are derived from the AccentOS architecture as it exists today. They will shift after `index.html` is split or after WIP is per-session.

**NEXT**
- `TOKEN_TO_OUTPUT_EFFICIENCY.md` covers per-pattern ROI and the false-productivity signals that can fool an operator into thinking they're in YELLOW when they're already in RED.
- Eventually: a 5-line BE estimator that reads `git branch --list claude/*` + the touched-file set and emits a Low/Elevated/High band — would let `status.sh` print the current zone.
