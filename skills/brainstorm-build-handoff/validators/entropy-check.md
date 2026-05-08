# Entropy Check
Run during Phase 3 (Failure Analysis) and after each Ralph loop pass.
Entropy = ambiguity + duplication + undefined state.

---

## Ambiguity Audit

- [ ] Every workflow step is a verb phrase (not a noun or concept)
- [ ] No step contains "handle", "manage", "process", or "deal with" without specifics
- [ ] No entity role says "coordinates" or "orchestrates" without defining the mechanism
- [ ] Every "if" condition has a defined "then" AND "else"
- [ ] State transitions have explicit triggers (not "when appropriate")

## Duplication Audit

- [ ] No two entities own the same data
- [ ] No two workflows perform the same action on the same entity
- [ ] No schema field appears in more than one entity without a clear reason
- [ ] Operating rules do not repeat what's already in constraints

## Undefined State Audit

- [ ] Every state has at least one transition out
- [ ] No state is terminal without being labeled as terminal
- [ ] Workflow terminal conditions are reachable (not theoretically possible)
- [ ] Error states are defined — what happens when a rule or step fails?

## Token Explosion Audit

- [ ] No workflow step passes unbounded text to an AI model
- [ ] HandoffPayload has a defined maximum size or field cap
- [ ] No validation rule requires reading an entire session transcript
- [ ] Audit log entries are structured (not free text dumps)

## Synchronization Audit (multi-agent / multi-session contexts)

- [ ] Concurrent writes to shared files are handled (append-only, timestamped, or locked)
- [ ] No two agents are expected to own the same state simultaneously
- [ ] Session start and session end are atomic operations (not partially applied)

---

## Entropy Score

Count unchecked boxes:

- 0: Low entropy — proceed
- 1–3: Medium entropy — fix before BUILD_READY
- 4+: High entropy — return to Phase 4 (additional Ralph loop pass required)
