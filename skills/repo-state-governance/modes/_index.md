# Modes

Each mode is a structured contract. Read the individual mode file to enter, operate in, or exit a mode. All mode files share the same section structure for predictability.

## Quick reference

| Mode | File | Risk | Reversibility | Concurrency | One-line purpose |
|---|---|---|---|---|---|
| stabilize | `stabilize.md` | LOW | REVERSIBLE | MULTI_AGENT_OK | Bring repo to a clean steady state |
| pause | `pause.md` | LOW | REVERSIBLE | SINGLE_AGENT | Temporarily stop, preserve resumability |
| freeze | `freeze.md` | MEDIUM | REVERSIBLE | MULTI_AGENT_OK | Hard stop, no changes except hotfixes |
| handoff | `handoff.md` | MEDIUM | REVERSIBLE | SINGLE_AGENT | Transfer ownership across actors |
| resume | `resume.md` | LOW | REVERSIBLE | SINGLE_AGENT | Re-enter active work |
| audit | `audit.md` | LOW | READ-ONLY | MULTI_AGENT_OK | Read-only health / drift / risk evaluation |
| recovery | `recovery.md` | HIGH | SEMI | SINGLE_AGENT | Restore broken repo to known-good |
| deploy-prep | `deploy-prep.md` | HIGH | REVERSIBLE | SINGLE_AGENT | Pre-production validation gate |
| extraction-prep | `extraction-prep.md` | HIGH | IRREVERSIBLE-IF-COMPLETED | SINGLE_AGENT | Prepare subsystem for split |
| governance-transition | `governance-transition.md` | HIGH | SEMI | SINGLE_AGENT | Migrate ownership / standards / process |
| sandbox | `sandbox.md` | LOW | REVERSIBLE | MULTI_AGENT_OK | Free-form experimental space |

## Mode file template

Every mode file has these sections in this order:

1. **Identity** — mode key, risk tier, reversibility, typical duration, concurrency
2. **Purpose** — 1-2 sentences
3. **Entry Conditions** — must be true to enter
4. **Goals** — ordered list of success criteria
5. **Allowed Actions** — explicit permitted operations
6. **Forbidden Actions** — explicit denied operations
7. **Execution Priorities** — ordered when actions conflict
8. **Documentation Requirements** — mandatory artifacts
9. **Validation Requirements** — checks that must pass
10. **Completion Criteria** — what makes this mode "done"
11. **Allowed Transitions** — where you can go from here
12. **Risk Profile** — failure modes + mitigations
13. **AI Agent Guidance** — agent-specific instructions
14. **Human-in-the-Loop Touchpoints** — where humans must approve

When authoring a new mode, copy `sandbox.md` (it has all sections in their canonical form) and adapt.
