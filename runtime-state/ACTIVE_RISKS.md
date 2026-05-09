# ACTIVE RISKS

## Purpose
Open risks that could destabilize the runtime, with severity, likelihood, mitigation, and
trigger condition. Read by every mode before mutation.

## Required Sections
1. **Meta** — last_review, next_review (≤ 7 days out).
2. **Risk table** — id, title, severity, likelihood, owner, mitigation, trigger, status.
3. **Closed since last review** — id + resolution one-liner.
4. **Watchlist (sub-threshold)** — risks not yet active but tracked.

## Update Rules
- Reviewed at every checkpoint and at every cycle start.
- Any new risk surfaced by gap analysis is appended within the same session.
- A risk with severity ≥ HIGH and no mitigation = automatic escalation to ESCALATION_POLICY.

## Ownership Rules
- Append: any mode (including Passive Audit).
- Edit existing entry: Plan-Then-Execute or human.
- Close entry: human or Clean Pause mode.

## Allowed Mutation Rules
- Severity may only be lowered after evidence is logged in `audits/AUDIT_LOG.md`.
- Status transitions: `open → mitigating → contained → closed`. No skipping.

## Compression Standards
- Hard cap: 100 lines.
- Each risk ≤ 5 lines in the table; full discussion goes to `audits/AUDIT_LOG.md`.

## Archival Rules
- Closed risks archived weekly to `audits/risk-archive/<cycle_id>.md`.

## Severity Scale
- **CRIT** — could brick runtime, destroy data, or block all work.
- **HIGH** — destabilizes a major module or causes silent corruption.
- **MED** — degrades reliability or user experience meaningfully.
- **LOW** — annoyance, cosmetic, or contained.

## Likelihood Scale
`unlikely (<10%)` / `possible (10–40%)` / `likely (40–70%)` / `expected (>70%)` over the next cycle.

## Schema (entry)
```
R<n>. <title>           id: <slug>
      severity: <CRIT|HIGH|MED|LOW>
      likelihood: <unlikely|possible|likely|expected>
      owner: <name>
      trigger: <observable condition that materializes the risk>
      mitigation: <action under way OR none>
      status: <open|mitigating|contained|closed>
```
