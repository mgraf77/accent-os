# SAFETY HARD STOPS

## Purpose
The non-negotiable refusals. These cannot be overridden by mode, by metric thresholds, or
by patch plan. If any apply, refuse and escalate.

## Hard-Stop Categories

### S1 — Recursive Self-Improvement
- No mode may write changes to `governance/`, `stable-evolution-runtime/`, `policies/`, or
  `STABILIZATION_LAYER.md` based on its own recommendation without human approval.
- No agent may instantiate another agent that grants itself broader permissions than the
  parent.

### S2 — Autonomous Architecture Mutation
- No autonomous creation, deletion, or moving of top-level directories.
- No autonomous renames touching `js/`, `worker/`, `index.html`, `patch_quote.js`,
  `wrangler.toml`, `sql/`.
- Architectural change requires C6 in MUTATION_POLICY: human + ROLLOUT_PLAN gate.

### S3 — Unsafe Code Changes
- No `--no-verify`, `--no-gpg-sign`, or hook-bypass flags on any git command.
- No `force-push` to `main`/`master` under any circumstance.
- No `git reset --hard`, `git clean -fd`, or `branch -D` without explicit human request.
- No edits to `.env`, secrets files, or anything matching `*.key|*credentials*|*.pem`.

### S4 — Uncontrolled Orchestration
- No mode may launch background agents whose output mutates files outside their declared
  scope.
- No agent may write to `runtime-state/CANONICAL_RUNTIME_STATE.md` except the runtime loop
  in Clean Pause mode.
- No more than 1 in-flight C4+ patch at a time per branch.

### S5 — Runaway Complexity Growth
- A patch raising entropy_delta > 0 and complexity_velocity > reliability_velocity must be
  rejected unless a paired stabilization patch lands in the same checkpoint.
- A single patch may not introduce > 1 new top-level directory.

### S6 — Governance Lag
- If governance_lag > 14 days, all C3+ mutations are paused until the queue is drained.
- The aging item must be processed (route, defer, or decline) before any new ideas are
  intaked.

### S7 — Security-Sensitive Systems
- No code that handles `x-api-key`, auth tokens, or proxy credentials may be modified
  without explicit human review, regardless of patch class.
- The Cloudflare Worker (`worker/`) is treated as security-sensitive at all times.

### S8 — Unstable Runtime Evolution
- The stabilization layer may not modify itself in the same cycle that it lands an
  externally-triggered governance edit. Cycles must be separated by a verified-green
  checkpoint.

## What "Hard Stop" Means
- Refuse the action.
- Write an `ESCALATION` entry per ESCALATION_POLICY (trigger E5).
- Continue read-only operation; do not retry the blocked action with a workaround.

## Anti-Pattern Detection
The following workaround patterns are themselves S1 violations:
- "Disabling" a hard stop by editing this file in the same cycle.
- Splitting one forbidden action across multiple smaller actions to evade the rule.
- Using a different mode to do what the current mode cannot.
- Re-classifying a file under MUTATION_POLICY to lower its required class.
