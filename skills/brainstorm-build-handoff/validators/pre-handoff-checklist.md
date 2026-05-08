# Pre-Handoff Checklist
Run before marking a handoff document as BUILD_READY.

---

## Objective

- [ ] True objective is one clear sentence — no "and also" constructions
- [ ] Objective answers: what is built, and why
- [ ] Objective does not include implementation details

## Constraints

- [ ] `must_use` list exists and is non-empty
- [ ] `must_not_use` list exists and includes at least the obvious anti-patterns
- [ ] Scope boundary is one sentence, no ambiguity
- [ ] Scope boundary defines where the system ends (not just what it does)

## Architecture

- [ ] All entities are named and have a defined role
- [ ] Every workflow has a trigger and a terminal condition
- [ ] State transitions are enumerated (not described in prose)
- [ ] No workflow step says "somehow" or "figure out how to"

## Implementation Order

- [ ] Phases are numbered and ordered
- [ ] Each phase has at least one deliverable
- [ ] Each phase has explicit entry and exit criteria
- [ ] Phase 1 can start immediately (no open decisions required)

## Validation Gates

- [ ] Every implementation phase has at least one validation gate
- [ ] Each gate has a concrete pass condition (not "it works")
- [ ] Gates are testable without the author present

## Operating Rules

- [ ] At least 3 operating rules exist
- [ ] Rules are constraints, not suggestions
- [ ] No rule requires interpretation to apply

## Open Items

- [ ] Each open item has an owner
- [ ] Each open item has a defined impact
- [ ] Zero open items with `impact: "blocks Phase 1"` (those must be resolved first)
- [ ] BUILD_READY status is NOT set if any blocker-level open item exists

## Exclusions

- [ ] At least 3 explicit exclusions listed
- [ ] Exclusions cover the most tempting scope creep items
- [ ] No exclusion says "for now" (deferred items go in mvp-reduction, not exclusions)

## Next Phase

- [ ] Next phase is defined (one sentence minimum)
- [ ] Next phase does not contradict the exclusions list

---

## Verdict

All boxes checked → status: BUILD_READY
Any unchecked box → status: REVIEW (fix before handing off)
