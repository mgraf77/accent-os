# AccentOS Autonomous Handoff Rules
> **Doc type:** Enforcement specification. Rules for how one session hands off to the next without human re-stating context.
> **Frame:** every prompt should be self-contained; every session-end should produce the next prompt; every handoff should be machine-validatable.
> **Authority:** advisory until adopted by Captain.

---

## 1. The handoff contract

A session ends with **all of**:

1. WIP empty or marked-paused with a resume contract in `WORK_IN_PROGRESS.md`.
2. SESSION_LOG.md entry: date, branch, commits, Captain authorizer (if any), next decision queued.
3. **Exact next recommended prompt** authored as the final output.
4. Branch pushed to origin.
5. Any `claude/governance-*` rule fires logged to `.governance-flags`.

Without all five, the session is **not complete** and may not be resumed by a fresh session.

---

## 2. Handoff format requirements

The "exact next recommended prompt" must:

- Name the **branch** the next session operates on.
- Name the **HEAD commit hash** the next session resumes from.
- Name the **role** (Hub feat / Spoke / Canonical) explicitly per `ACCENTOS_GOVERNANCE_BRANCH_LIFECYCLE.md`.
- Name the **autonomy level** (L0–L3) per `ACCENTOS_AGENT_EXECUTION_LIMITS.md`.
- Enumerate **HARD CONSTRAINTS** (DO NOT modify lists).
- Enumerate **REQUIRED WORK** as discrete tasks.
- Specify **OUTPUT FORMAT** (e.g., COPYABLE RESPONSE markers).
- Be self-contained — no "see the prior conversation" dependencies.

A prompt missing any of these is **invalid** and should be rejected by the receiving session.

---

## 3. Autonomous routing rules (when Captain is not in the loop per-prompt)

If the system is operating with Captain authorizing batches rather than per-prompt:

| Routing rule | Trigger | Destination |
|---|---|---|
| **R-RT-01** | Last session ended at "Phase-0 BLOCKED" | New prompt routes to Captain queue (`ACCENTOS_CAPTAIN_DECISION_QUEUE.md` Q1) |
| **R-RT-02** | Last session emitted "BLOCKED on canonical merge" | New prompt routes to Captain queue Q2 |
| **R-RT-03** | Last session emitted contradiction count >0 | New prompt routes to a Spoke (alignment pass) |
| **R-RT-04** | Last session marked "ready for Captain merge: YES" | New prompt routes to Captain queue Q3 |
| **R-RT-05** | Last session emitted "rollout Phase 1 may begin" | New prompt routes to Hub feat session for `daily_command_center` scaffold |
| **R-RT-06** | Last session ended with WIP non-empty | New prompt is the resume of WIP |
| **R-RT-07** | Last session marked freeze + "non-Captain work exhausted" | New prompt is Captain-action notice; no agent prompt routes |

These rules are advisory. The router does not execute; it suggests.

---

## 4. Autonomous-handoff *forbidden* patterns

These are explicit anti-patterns. Routing logic that produces them must be blocked.

- ❌ **Auto-routing across freeze boundaries.** A session cannot autonomously decide to unfreeze a frozen branch.
- ❌ **Auto-routing to a `→ live` flip.** Captain go is mandatory; routing logic that proposes the flip must surface it as a Captain decision, not execute it.
- ❌ **Auto-routing to canonical-doc edits.** Always Captain.
- ❌ **Auto-routing across repos.** Multi-repo operations require Captain (per `MODULE_OWNERSHIP_MAP.md` ownership map).
- ❌ **Auto-routing during a freeze trigger.** If `WORK_IN_PROGRESS.md` is non-empty or `module_modes.json` parse fails, no autonomous route fires; only "fix WIP / fix parse" routes.
- ❌ **Auto-routing to spend money.** Always Captain.
- ❌ **Auto-routing to external comms.** Always Captain.

---

## 5. Handoff payload (machine-readable companion to the prose prompt)

A prompt generator may emit a sidecar JSON for routing automation:

```
{
  "branch": "claude/accentos-rollout-planning-UTElf",
  "head": "c6afc89706e3181531017b827ccfb90a1ea413ce",
  "role": "spoke",
  "autonomy_level": "L1",
  "captain_required": true,
  "queue_item": "Q1",
  "frozen_scope": true,
  "constraints": ["no_runtime", "no_canonical_edit", "no_module_modes"],
  "expected_output": "5_files_5_commits"
}
```

This is **advisory and optional**. The prose prompt is authoritative. The JSON is for automation that wants to validate handoff correctness without parsing prose.

---

## 6. Pre-resume validation

A receiving session must verify, before doing anything else:

```
[ ] Branch matches the handoff prompt's named branch
[ ] HEAD matches or is a fast-forward descendant of the handoff prompt's named HEAD
[ ] Working tree is clean (not in a half-merge state)
[ ] WORK_IN_PROGRESS.md is consistent with the prompt's claim
[ ] SESSION_LOG.md last entry matches the prior session's claim
[ ] Role implied by branch matches the prompt's claimed role
[ ] No freeze trigger active that the prompt didn't acknowledge
```

Any mismatch → halt + report the discrepancy + escalate to Captain. Do not proceed.

---

## 7. Handoff drift detection

A receiving session that has accumulated >3 prompts without a Captain check-in must:

1. Surface the chain length in its first output.
2. Recompute Phase-0 verdict from scratch (not inherited from prior prompt).
3. Re-read the freeze notice and freeze snapshot.
4. Confirm none of R-AUTO-01 through R-AUTO-18 has fired since the last Captain check-in.

Drift detection is the autonomy circuit-breaker. It prevents agents from convincing themselves of progress that the human has not validated.

---

## 8. Stop-on-doubt rule

When a receiving session encounters **any** of:

- An ambiguous instruction (two reasonable interpretations).
- A constraint conflict (HARD CONSTRAINTS partially permits + partially forbids the same action).
- An unfamiliar branch state (commits or files that the prompt did not predict).
- A frozen-doc edit that the prompt assumes can be made.
- An authority claim that cannot be validated against SESSION_LOG.

The session **stops** and produces a clarification request to Captain. It does not interpret. Stopping is the safe default.

---

## 9. Approval-gated handoff escalation

Some handoffs implicitly require Captain mid-stream:

| Mid-stream trigger | Action |
|---|---|
| A frozen-doc edit was inadvertently authored | Halt; Captain decides revert or unfreeze |
| A `→ live` flip prepared | Halt; Captain authorizes |
| Schema or worker change needed | Halt; Captain executes |
| External communication drafted | Halt; Captain reviews and sends (or doesn't) |
| Spending implicated | Halt; Captain decides |
| Two sessions detect each other on overlapping branches | Halt both; Captain coordinates |

These are not bugs in the handoff system — they are intentional pause-points. The handoff system must surface them, not bypass them.

---

## 10. Future automation: routing supervisor (deferred)

A future supervisor session — operating on its own dedicated branch, observing other sessions read-only — could:

- Read each session's final-output prompt at session-end.
- Validate the handoff payload against §1 (handoff contract) and §2 (format requirements).
- Match the prompt to a routing rule (§3 R-RT-01 through R-RT-07).
- Surface the next-step decision to Captain.
- **Never execute** the next session itself; only suggest.

This supervisor is **L0** (read-only) plus the ability to write a single advisory file (`SUPERVISOR_RECOMMENDATIONS.md`). It is implemented only after Bootstrap-tier enforcement is stable.

---

## 11. Handoff cost-control

A session that produces a handoff prompt longer than ~1000 tokens has likely failed to compress. Compression discipline:

- Reference docs by path + section, not by quotation.
- Cite commit hashes, not commit content.
- Use the freeze snapshot as the onboarding packet for receiving sessions.
- Avoid repeating context the receiving session can read from `docs/design/` directly.

Cost-throttle: prompts >2000 tokens trigger a Warn ("prompt has grown; consider rewriting").

---

## 12. Anti-handoff-loop rule

If three consecutive sessions hand off without Captain check-in **and** without converging on a closeable task, the chain is in a loop. The next session must:

1. Stop processing.
2. Summarize the loop in SESSION_LOG.md.
3. Surface to Captain.
4. Refuse to author another autonomous handoff prompt.

Loops are how autonomy turns into busywork. Detecting and breaking them is the system's job.

---

*End of ACCENTOS_AUTONOMOUS_HANDOFF_RULES.md — handoff contract.*
