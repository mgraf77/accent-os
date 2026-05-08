# NEXT STEPS — after governance restructuring

> Order of priority. Pick up when restructuring is done.

---

## P0 — Real-world AIRLOCK validation

Run AIRLOCK against one actual community skill end-to-end:

1. Install a community skill via `skill-forge` or manually under `skills/`.
2. `node skills/airlock/operator.js init <skill>`.
3. Edit `airlock/<skill>/policy.yaml` — set `read_paths`, `write_paths`,
   `invoke_skills`, thresholds.
4. Run the skill from a real Claude Code session, with the SKILL.md hooks invoked
   per the AIRLOCK contract.
5. Observe `airlock/<skill>/ledger.jsonl` accumulates correct entries.
6. Run `node skills/airlock/operator.js status <skill>`.
7. Force-promote and verify `promotion-log.md` and `policy.yaml` updates.

**Why P0:** the 46 unit tests verify behavior in isolation. A single end-to-end run
is the first real proof that the SKILL.md hooks are workable for Claude.

---

## P1 — Decide where AIRLOCK runtime state belongs

After governance restructuring, decide:

- Does `airlock/` (per-skill policies + ledgers) stay in AccentOS, or move to a
  separate "runtime data" repo / Command Center?
- Does `skills/airlock/` (the skill code) stay with AccentOS, or move to a
  shared skills repo?

These are independent decisions. The skill code can move; the runtime data must
sit beside whatever filesystem the skills actually operate against.

---

## P2 — Decide where brainstorm-build-handoff belongs

Same question. The skill is project-agnostic; only the worked example is
AccentOS-specific. If a shared skills repo is created, this is a strong
candidate for it.

The validator + assembler scripts have zero AccentOS coupling.

---

## P3 — Run brainstorm-build-handoff against a non-AccentOS idea

Once the skill is shipped, the only proof it generalizes is using it on something
other than AIRLOCK. Suggest: feed it a real raw transcript and verify the
artifacts come out structured + the handoff is executable by another agent.

---

## P4 — Convergence diagnostics (`brainstorm-build-handoff` v1.1)

`scripts/diagnose.js` to emit per-pass deltas, convergence flag, time-to-converge
across slugs. Triggered when ≥3 real handoffs exist. See `ROADMAP.md` in that skill.

---

## P5 — Decide AIRLOCK enforcement model

Current model: **advisory** — Claude must call `gate.interceptRead()` etc. before
filesystem ops. There is no OS-level enforcement.

Future options to consider:
- Wrap the AccentOS skill SDK so hooks are inescapable from skill code.
- Use a Node `Proxy` over `fs` for a process running an untrusted skill.
- Accept advisory model and rely on `codex-review` for source-level verification.

This is a governance decision — out of scope for this session.

---

## P6 — Things explicitly deferred (don't pre-build)

From `skills/airlock/SKILL.md` and `skills/brainstorm-build-handoff/ROADMAP.md`:

- AIRLOCK: shell-command sandboxing, wildcard `invoke_skills`, monthly ledger
  archive rotation, ledger sha attestation.
- brainstorm-build-handoff: cross-skill schema sharing, multi-executor handoff
  variants, chunked extraction for large inputs.

Each has a documented trigger condition. Don't build until the trigger fires.

---

## Quick-restart checklist for the next session

```bash
git status                                 # confirm clean
git log --oneline -5                       # confirm 2 new commits ahead
node skills/airlock/tests/ledger.test.js   # confirm 46/46
ls skills/airlock skills/brainstorm-build-handoff
cat WORK_IN_PROGRESS.md                    # see clean-pause note
cat HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md  # restructuring context
```
