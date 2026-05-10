# SYNCHRONIZATION COST MODEL — ACTUAL

> **Audit role.** Reality auditor. Quantifies *real* coordination costs observed in this session and on the visible history, not modeled costs.
> **Snapshot time.** 2026-05-10 21:30 UTC.
> **Methodology.** Direct observation of the current branch's session record + `git log` history. Numbers are calibrated estimates against actual events, not telemetry.

---

## 1. The frame

Synchronization costs are real *only when synchronization actually happens*. With one operator, one session at a time, one branch, most modeled costs from the prior corpus are zero in current operation. This document quantifies what is actually being paid.

---

## 2. Relay overhead — REAL

**Definition.** Captain-attention spent transferring context to/from Claude across operator windows.

**Measured (this session window, 2026-05-10):**

- 6 substantive operator prompts in this corridor (the work-passes that produced 16 docs).
- Each prompt was preceded by Captain reading some portion of prior output.
- Total Captain relay time consumed in this corridor: estimated 30–60 minutes spread across the day.

**Compared to the corpus's 5–8 substantive-relays-per-day saturation point (`OPERATOR_BANDWIDTH_LIMITS.md` §5):**

- Today: at the upper end (~6). Marginal.
- This is one of the few corpus numbers that did match real conditions.

**Real cost:** ~30–60 min Captain time today. Sustainable, but the analysis lane has consumed the bulk of available high-attention relay capacity for today.

---

## 3. Review overhead — REAL

**Definition.** Captain time required to read commits and decide on their fate.

**Measured (this session window):**

- Commits awaiting Captain review: **17 commits** ahead of `main` on this branch (16 doc commits + the implicit pre-commits — let me recount: the 7 commits ahead are the actual analysis batches; each batch carries multiple files).
- Actually: 7 commits on this branch (`23c728f`, `af6ec47`, `e9e4769`, `c27d84d`, `6b9de2f`, `229ff87`, `9eda735`) producing 16 docs.
- Captain has reviewed: **0** of these commits as of snapshot.

**Estimated review cost to clear the backlog:**

- Skim only (decide whether to merge): ~5 min.
- Read EXECUTION_HEALTH + EXECUTION_GATES + RECONCILIATION_2026-05-10 (the three most actionable): ~25 min.
- Full corpus ingest: ~2 hours.

**Real cost outstanding:** 5–25 min for the operationally-relevant subset; 2 hours for the full read.

---

## 4. Branch aging cost — REAL

**Definition.** Cost imposed by a branch persisting unmerged.

**Measured:**

- This branch: ~10 hours old at snapshot.
- 72h decision deadline (per `BRANCH_HYGIENE_PROTOCOL.md`): ~62 hours from now.
- Branch entropy contribution to trunk: **zero** — branch touches only previously-empty directory `docs/runtime/`; no other branch can collide.

**Real cost:** zero at present. The aging *clock* runs but the *cost* is still zero because there is no collision surface and no other branch to drift against.

**When this will become non-zero:**

- If Captain forks a new branch from `main` (or the stale local `main`) while this branch sits, the new branch will not see this branch's docs. Minor latent cost.
- If this branch crosses 72h unmerged, it enters AGED state per the protocol and triggers a CAUTION → CRAWL escalation if multiple other branches exist (they don't).

**Real-cost lifecycle for THIS branch:** zero → trivial → recoverable. Not the kind of compounding cost the corpus warned about, because that kind requires multiple branches.

---

## 5. Merge coordination tax — REAL

**Definition.** Wall-clock + cognitive cost to integrate this branch into trunk while preserving other live branches' work.

**Measured:**

- Other live branches: **0.**
- Conflicting files: **0** (this branch touches only `docs/runtime/` which is otherwise empty).
- Captain decisions required: 1 ("merge it").
- Captain time required: ~2 minutes (decide + execute fast-forward).

**Real cost:** ~2 minutes total. Not the modeled 3–8 minutes/branch + per-conflict cost — those costs apply when there are multiple branches and shared files. Neither condition holds.

---

## 6. Human context-switch tax — REAL

**Definition.** Captain orientation cost when switching into AccentOS-Claude context from another responsibility.

**Measured:**

- Captain operates AccentOS-Claude alongside showroom ops, vendor calls, family. Per MASTER §2.
- Per-switch warm-up: estimated 5–15 min before high-quality decisions are possible. Per `OPERATOR_BANDWIDTH_LIMITS.md` §8.
- Switches today: unknown from the session record, but likely ≥2 given the spacing of the 6 prompts.

**Real cost:** estimated 15–45 min total context-switch overhead today. Real and measurable in principle; not measured here.

This is one of the few costs that operates at N=1 — it doesn't require parallelism to be real.

---

## 7. False-concurrency tax — REAL

**Definition.** Cost paid for running N sessions that *appear* parallel but in practice serialize. Per `ORCHESTRATION_COST_CENTERS.md` §9.

**Measured:**

- Concurrent sessions: 0 attempted, 0 active.
- False-concurrency tax: **0.**

This cost cannot exist while N=1. It is purely latent until a second session is actually spawned. The corpus modeled it as real because it modeled multi-session operation; in current single-session reality, it is zero.

---

## 8. Cost summary table

| Cost type | Actual today | Modeled-vs-real ratio |
|---|---|---|
| Relay overhead | 30–60 min Captain | Matches model |
| Review overhead | 0 min consumed; 5–25 min outstanding for actionable subset | Higher than model (more docs to read) |
| Branch aging cost | $0 | Far below model (only 1 branch, no collision surface) |
| Merge coordination tax | ~2 min | Far below model |
| Context-switch tax | 15–45 min | Matches model |
| False-concurrency tax | 0 | Zero (no concurrency attempted) |
| Frozen-file tax | 0 | Zero (one branch, isolated files) |
| Schema rollback cost | 0 | Zero (no migrations in flight) |
| Worker redeploy lag cost | unbounded until fixed (production bug live) | Not in original model |

**Total real synchronization cost today:** ~45 min – 1.5 hr of Captain time outstanding + the latent Worker-deploy production bug.

The hidden cost the model didn't capture: **the analysis lane itself**. Producing 16 docs consumed ~6 prompt-cycles of Captain relay time without producing a single shipped feature or cleared blocker. That cost was real and is not in the synchronization model — it lives in the planning-overhead signal of `EXECUTION_HEALTH.md`.

---

## 9. What the costs say about current state

- **The system is NOT in coordination crisis.** Most modeled costs are zero or trivial.
- **The system IS in attention-allocation drift.** Captain's relay time has been consumed by analysis with no corresponding feature output.
- **The single largest real outstanding cost is the Worker-redeploy lag**, because it represents an unbounded production-customer impact until fixed.
- **The second largest is the unread-corpus cost**, because Captain will eventually need to read the operational subset for the gates to actually function.

---

## 10. DONE / KNOWN / NEXT

**DONE**
- Quantified six real cost types against snapshot observations.
- Compared modeled-vs-real ratios: most modeled costs at zero; relay and context-switch costs match model.
- Identified the largest unmodeled real cost: Worker redeploy lag.

**KNOWN**
- Numbers are calibrated estimates against observed events, not measured.
- The corpus's coordination cost language describes a system that does not yet exist; this document describes the system that does.

**NEXT**
- Action queue in `ACTION_LEDGER.md` addresses the outstanding cost items.
