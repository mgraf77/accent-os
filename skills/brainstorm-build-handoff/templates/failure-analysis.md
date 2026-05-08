# Failure + Entropy Analysis — {{SYSTEM_NAME}}
Date: {{DATE}}

---

## Bottlenecks

<!-- Where throughput or progress collapses under real usage. -->

{{BOTTLENECKS}}

---

## Ambiguity Defects

<!-- Things that will require mid-build clarification. Must be resolved before BUILD_READY. -->

{{AMBIGUITY_DEFECTS}}

---

## Token Explosion Risks

<!-- Prompts or data flows that will exceed AI context limits. -->

{{TOKEN_EXPLOSION_RISKS}}

---

## Orchestration Drift

<!-- Where agents or components will desync over time. -->

{{ORCHESTRATION_DRIFT}}

---

## Governance Failures

<!-- Where authorization, ownership, or accountability is undefined. -->

{{GOVERNANCE_FAILURES}}

---

## Overengineering Risks

<!-- Complexity that wasn't asked for and won't be needed. -->

{{OVERENGINEERING_RISKS}}

---

## Maintainability Risks

<!-- Decisions that will be expensive to change in 6 months. -->

{{MAINTAINABILITY_RISKS}}

---

## Missing Implementation Detail

<!-- Gaps that block a builder from starting. Each one must be resolved before BUILD_READY. -->

{{MISSING_IMPLEMENTATION_DETAIL}}

---

## Verdict

- [ ] All `missing_implementation_detail` items resolved
- [ ] All `ambiguity_defects` resolved or flagged as OPEN ITEMS
- [ ] Overengineering risks documented in exclusions
- [ ] Governance defined for all workflows
