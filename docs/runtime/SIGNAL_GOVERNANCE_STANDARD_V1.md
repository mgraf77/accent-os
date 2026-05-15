# SIGNAL_GOVERNANCE_STANDARD_V1
**Status:** authoritative · **Pairs with:** CANONICAL_SIGNAL_RUNTIME_V1.md
**Purpose:** Freeze the words. Drift in vocabulary is the leading cause of architectural entropy in this system.

---

## 1. Frozen nouns

| Canonical noun | Means | Forbidden synonyms |
|---|---|---|
| **Signal**          | a persisted operational record (§ runtime doc) | alert (in new prose), event, notification, incident, ping |
| **Generator**       | a function that detects a condition and emits a Signal | rule, check, scanner, monitor, detector |
| **Operator**        | the human acting on a Signal | user (ambiguous), admin, agent |
| **Sink**            | the storage destination of a Signal | log, store, channel |
| **Dedupe key**      | `(type, source_id)` from payload | hash, fingerprint, idempotency key |
| **Lifecycle state** | one of unread/read/dismissed/actioned | status (avoid when ambiguous), phase |
| **Severity band**   | one of info/warn/urgent | priority, level, importance |
| **Escalation**      | the X12 condition (urgent + unread + >24h) | promotion, paging, fanout |
| **Suppression**     | a Signal NOT emitted because dedupe key is open | mute, ignore, skip (in code only) |
| **Confidence**      | generator's self-asserted probability the condition is real (0.0–1.0, optional, in payload) | score, weight, certainty |

Documents that use a forbidden synonym in new prose are out of compliance and must be reconciled.

## 2. Frozen verbs

- **emit** — generator → new Signal
- **transition** — operator → Signal lifecycle change
- **suppress** — generator declines to emit (dedupe hit)
- **escalate** — Signal meets §6 condition (no action verb in V1)
- **dismiss** / **action** / **read** — specific lifecycle transitions

Forbidden in new code: `fire`, `raise`, `trigger`, `notify`, `dispatch`, `publish` (for signal emission).

## 3. Frozen table & column names

- Table: `alerts` (retained, §7 of runtime doc)
- Columns: as in M02 schema. No new columns added by this session.
- Any new column MUST be proposed via `SIGNAL_ENTROPY_RISKS.md` first.

## 4. Frozen severity vocabulary

Exactly: `info`, `warn`, `urgent`.
Banned: `critical`, `high`, `medium`, `low`, `notice`, `debug`, `error`, `fatal`, `p0`, `p1`, `p2`.

## 5. Frozen lifecycle vocabulary

Exactly: `unread`, `read`, `dismissed`, `actioned`.
Banned: `new`, `open`, `closed`, `resolved`, `acknowledged`, `ack`, `snoozed`, `archived`.

## 6. Frozen type registry

Canonical types listed in CANONICAL_SIGNAL_RUNTIME_V1 §4.1. To add a new type:
1. Append a row to that table in a versioned doc update (V2).
2. Add the generator with dedupe key.
3. Choose a severity floor from §4.2 — no new severities permitted.
4. Update `js/alerts.js` and ensure topbar bell renders correctly.

No generator may ship without a registered type.

## 7. Confidence terminology (frozen)

If a generator emits with `payload.confidence`, it MUST be a float in `[0.0, 1.0]`. The UI MAY hide Signals with `confidence < 0.5` from the bell dropdown but MUST still persist them. No other confidence schemes (stars, tiers, labels) are sanctioned.

## 8. Suppression semantics (frozen)

Suppression = "do not emit a new row because an unresolved Signal with the same dedupe key exists." Suppression is a property of the generator, not of the operator. Operators cannot "suppress" Signals — they `dismiss` or `action` them.

## 9. Operator-class signal segregation

`efficiency-monitor` Operator Signals (retry-loops, redundant-reads, recurring-sequences, skill-bypass, clarification-loops, redone-wip) MUST stay in `skills/efficiency-monitor/efficiency-log.md`. They are NOT written to `alerts`. Crossing this boundary in either direction is a governance violation.

## 10. Compliance check (manual, V1)

Before any PR touching signals merges, the author confirms:
- [ ] No forbidden synonyms in new prose or identifiers
- [ ] New types appear in §4.1 of the runtime doc
- [ ] Severity is one of the 3 frozen bands
- [ ] Lifecycle uses the 4 frozen states
- [ ] Generator has a dedupe key
- [ ] Operator-class signals went to the correct sink
