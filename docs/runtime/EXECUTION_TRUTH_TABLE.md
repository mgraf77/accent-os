# EXECUTION TRUTH TABLE

> **Audit role.** Reality auditor. Maps every claimed orchestration capability to its actual state.
> **Frame.** For each capability: **conceptual only** / **partially real** / **operationally real** / **production-safe** / **forbidden/theater**.
> **Snapshot time.** 2026-05-10 21:30 UTC.

---

## 1. The five states

- **conceptual only** — described in docs; no implementation; no evidence of use.
- **partially real** — some implementation exists; behavior depends on voluntary adherence; not enforced.
- **operationally real** — used in normal operation; works; can be relied upon.
- **production-safe** — operationally real *and* tested under realistic load *and* has a documented failure path.
- **forbidden / theater** — described but actively harmful if attempted under current conditions; or described as if real when it isn't.

A capability can only advance from a lower state to a higher one with evidence — not with optimism.

---

## 2. The truth table

| Capability | State | Evidence / Reasoning |
|---|---|---|
| **Single-session execution** | **production-safe** | Demonstrated repeatedly across v6.10.x. One operator + one Claude session shipping features to `main` via Cloudflare auto-deploy. Failure path: revert commit. |
| **Surgical `str_replace` patches** | **production-safe** | Standard pattern in BUILD_INTELLIGENCE; consistently used. |
| **`js/<feature>.js` module pattern** | **operationally real** | Established convention for v6.10.x features. Working. Not formally enforced — voluntary. |
| **Cloudflare Pages auto-deploy** | **operationally real** | ~15-second deploy lag after push. Works. Failure path: not automated (no smoke tests). |
| **Supabase backend (read/write)** | **operationally real** | RLS policies, hydration, Realtime channels (Internal Meetings module). Working. |
| **Single-file `WORK_IN_PROGRESS.md` handoff** | **operationally real** | Used. Last reliable update 2026-05-07. Per-session WIP is conceptual only. |
| **BUILD_PLAN check-off discipline** | **operationally real** | Markers maintained across recent shipping window. Some drift risk acknowledged. |
| **`BUILD_INTELLIGENCE.md` lesson log** | **operationally real** | Append-only, read at session-start, ~25× ROI per entry (per corpus estimate). |
| **`skills/_index.md` registry** | **partially real** | File exists; read at boot per CLAUDE.md auto-execute. Skill firing is voluntary (no enforcement). Several skills have unknown firing rates. |
| **`vibe-speak` modes** | **partially real** | 9 modes defined. Mode switches happen by phrase recognition; voice rules applied per session. No telemetry on adherence. |
| **`efficiency-monitor` always-on observer** | **partially real** | Skill installed with Stop hook for aggregation. Logs exist. Honest gaps in signal coverage acknowledged within its own SKILL.md. |
| **`autonomous-mode` skill** | **conceptual only** in current operation | Defined in `skills/autonomous-mode/`. **No verified overnight autonomous run has occurred in this session window.** Risk profile is theoretical. |
| **Registry substrate (more than a markdown index)** | **conceptual only** | The "registry substrate" referenced in some corpus docs is the markdown `skills/_index.md`. No daemon, no enforcement layer. |
| **Branch synchronization (automated)** | **conceptual only** | All synchronization is manual via commits + markdown handoff files. No automation. |
| **Runtime coordination (orchestrator/daemon)** | **conceptual only** | Does not exist. The "orchestrator" referenced in some corpus docs is the Captain + the session's read of the handoff files. |
| **Escalation handling (automated)** | **conceptual only** | Escalation paths defined in `EXECUTION_GATES.md` and `BRANCH_HYGIENE_PROTOCOL.md`. None have been triggered or tested. Captain escalation is manual. |
| **Freeze validation (automated)** | **conceptual only** | Frozen-file detection is described in `ORCHESTRATION_COST_CENTERS.md` §6. No implementation. |
| **Train orchestration** | **conceptual only** | "Trains" do not exist. The metaphor describes hypothetical parallel sessions. None observed. |
| **Distributed execution** | **forbidden / theater** | Out of scope. No infrastructure. No use case. |
| **Overnight execution at N>1** | **forbidden in current state** | Per `PARALLELISM_SAFETY_THRESHOLDS.md` and reality: no overnight run has been verified at N=1; N>1 overnight is forbidden by every analysis doc and unsupported by infrastructure. |
| **Autonomous continuation across sessions** | **partially real** | The `vibe-speak/session-handoff.md` + `WORK_IN_PROGRESS.md` together provide a manual continuation channel. Read by next session at boot per CLAUDE.md. Works for short relays. Not automated. |
| **Multi-train swarm orchestration** | **conceptual only** | Modeled extensively in `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `OPERATOR_BANDWIDTH_LIMITS.md`, etc. Not observed in real operation. |
| **Speed governor (GO/CAUTION/CRAWL/HALT)** | **conceptual only** | Defined in `EXECUTION_GATES.md`. No enforcement; no daemon checking conditions. Application is voluntary by each session at decision points. |
| **Branch entropy estimator** | **conceptual only** | Specified concept. No tooling exists. |
| **Queue durability** | **conceptual only** | Specified concept. No durable queue exists outside markdown files. |
| **Captain bandwidth instrumentation** | **conceptual only** | Defined in `OPERATOR_BANDWIDTH_LIMITS.md`. No measurement. |
| **Per-session WIP files** | **conceptual only** | Proposed in `SCALING_SEQUENCE_ANALYSIS.md` §1 Phase 2. Not implemented. |
| **Paired-down migrations** | **conceptual only** | Proposed in same Phase 2. Not implemented. Existing migrations are up-only. |
| **Deploy verification (smoke tests)** | **conceptual only** | Proposed in same Phase 2. AccentOS has no automated smoke tests. |
| **Phase 1 decomposition (split `index.html`)** | **conceptual only** | Highest-ranked architectural move per `ARCHITECTURAL_PRIORITIZATION_MODEL.md`. Not started. |
| **Phase 1a (one module fully extracted)** | **conceptual only** | Pilot variant of Phase 1. Not started. |
| **Module isolation enforcement** | **conceptual only at the contract level**; **partially real in practice** | Convention is followed in v6.10.x; no architectural enforcement. |
| **Codex review skill** | **partially real** | `skills/codex-review/` exists. Firing rate unknown from this snapshot. |
| **Codex as concurrent writer** | **forbidden / theater** | Sequencing-forbidden per `SCALING_SEQUENCE_ANALYSIS.md` §2.2. No instance observed. |
| **Captain-batched supervision windows** | **conceptual only** | Recommended pattern; not formalized. |
| **Track readiness classification (RED/YELLOW/ORANGE/GREEN/BLACK)** | **conceptual only** | Defined in `TRACK_READINESS_SCORE.md`. Snapshot classifications exist (`TRACK_BUILD_QUEUE_V1.md`). No automated state machine. |
| **Action ledger** | **conceptual only** until acted upon | The act of executing an action is real. The ledger that tracks them does not exist beyond `git log` + `SESSION_LOG.md`. |
| **Operational gates (this commit's docs)** | **conceptual only** | The gates are rule documents. They exist on paper. Their effect depends on each session reading and applying them. |

---

## 3. The honest summary

Out of ~36 listed capabilities:

- **production-safe:** 2 (single-session execution; surgical str_replace patches).
- **operationally real:** 7 (the AccentOS feature-shipping workflow itself, working as documented in BUILD_INTELLIGENCE).
- **partially real:** 5 (skills, vibe-speak, efficiency-monitor, manual session continuation, Codex review skill, module isolation by convention).
- **conceptual only:** ~20 (most of the orchestration / substrate / governance machinery the corpus describes).
- **forbidden / theater:** 3 (distributed execution; overnight at N>1; Codex as concurrent writer).

The shape of this distribution is what reality-vs-model divergence looks like in concrete form: a working single-operator feature-shipping system, with an elaborate scaffolding of orchestration concepts on top that does not (yet) correspond to anything running.

---

## 4. Implications

- **Most of the corpus's risk framing is conditional, not active.** "Branch entropy compounding" requires multiple branches; there is one. "Train orchestration" requires trains; there are none. "Overnight catastrophe" requires overnight runs; none happen.
- **Most of the corpus's prescribed mechanisms are not running.** The gates, the dashboard, the readiness state machine — all are markdown documents read voluntarily by sessions. Their effect is whatever each session chooses to apply.
- **The capabilities that ARE operationally real are the ones the existing system already used to ship Tracks 5.x and 6.7–6.9.** Those features shipped because surgical patches + module files + Supabase + Cloudflare auto-deploy work today. They are the production-safe core.

---

## 5. What this table is NOT

- It is not a verdict on which concepts are *valuable*. Many "conceptual only" entries are valuable as latent guardrails for future scaling. They become real if and when scaling happens.
- It is not a recommendation to delete the corpus. The corpus describes what to do *if* the system grows. It is not currently the manual for *operating* the system.
- It is not a critique of the operator. The corpus growth is the natural result of asking the analysis questions; the audit is the natural result of recognizing the answer.

---

## 6. DONE / KNOWN / NEXT

**DONE**
- Classified ~36 named capabilities into the five truth states.
- Identified 2 production-safe, 7 operationally real, 5 partially real, ~20 conceptual only, 3 forbidden/theater.
- Stated the honest implication: most of the orchestration scaffolding describes a system that does not yet exist.

**KNOWN**
- Classifications are calibrated against observed evidence. Some "conceptual only" entries may move to "partially real" the first time they are deliberately applied.
- The two production-safe items and the seven operationally real items are what ships features today.

**NEXT**
- `MAX_SAFE_CONCURRENCY.md` reads the implications for parallelism.
- `ACTION_LEDGER.md` enumerates the immediate moves the production-safe + operationally-real subset can execute.
