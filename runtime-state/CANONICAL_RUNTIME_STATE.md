# CANONICAL RUNTIME STATE

## Purpose
The single low-entropy source of "what is true in this repo right now." All audits,
modes, and patch plans read this file first. If a fact is not here, it is not canonical.

## Required Sections (fixed order)

1. **Meta** — last_updated, last_checkpoint_id, current_mode.
2. **Active Build Surface** — module → status (one line each).
3. **In-Flight Work** — pointer to WORK_IN_PROGRESS.md + summary.
4. **Last Known Good** — commit SHA + checkpoint id (mirrors LKG file).
5. **Open Mutations** — patches in flight, each with owner + ETA.
6. **Active Risks (top 5)** — pointer to ACTIVE_RISKS.md, top 5 inline.
7. **Suspended Areas** — modules under freeze; reason + thaw condition.
8. **Runtime Health (snapshot)** — RCI, entropy_delta, governance_lag, complexity_velocity.
9. **Next Required Read** — list of 1–3 files the next session must consult before action.

## Update Rules
- Updated **only** by the runtime loop after a successful checkpoint, or by Clean Pause mode.
- Each update increments `last_checkpoint_id` (monotonic).
- A field that cannot be filled is written as `unknown` — never omitted.
- Diffs go to `RUNTIME_DELTA_REPORT.md`; this file is overwritten with the new state.

## Ownership Rules
- Write owner: runtime loop; Clean Pause mode (human-approved).
- Read owner: every mode, every session start.
- Hand-edit allowed only via Plan-Then-Execute mode with patch plan.

## Allowed Mutation Rules
- Append-only sections: none — this file is overwritten in full per checkpoint.
- Forbidden in this file: speculation, future ideas, brainstorming. Those go to DER.

## Compression Standards
- Hard cap: 200 lines. If exceeded, runtime loop must compact (move detail to registers).
- One fact per line where possible. No prose paragraphs > 3 lines.
- Use module slugs (e.g. `quote-gen`, `worker-proxy`) consistently across all files.

## Archival Rules
- On overwrite, previous version is archived to `audits/state-archive/<checkpoint_id>.md`
  (created lazily by runtime loop; no archive at v0.1).
- Archive retention: last 50 checkpoints; older summarized into `audits/AUDIT_LOG.md`.

## Initial Content (v0.1, unseeded)
This file is **unseeded** at v0.1. P1 rollout populates it from current
WORK_IN_PROGRESS.md + BUILD_PLAN_CLAUDE.md. Until seeded, treat as `state: bootstrapping`.
