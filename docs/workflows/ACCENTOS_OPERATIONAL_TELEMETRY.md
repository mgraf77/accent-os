# AccentOS — Operational Telemetry Model

**Mode:** Workflow systems design (no implementation)
**Anchors:** all prior workflow docs
**Purpose:** Define operational visibility — signals that tell the team and the system *how the operation is actually running*. Not analytics vanity. Not "lifetime $$ closed". The signals here exist to keep the orchestration honest.

---

## 0. Design rules

1. **Every signal traces to typed events.** No invented metrics, no hidden derivations.
2. **Every signal has a threshold and a verb.** Numbers without action are decoration.
3. **Operational > analytical.** Signals here drive *today's* decisions, not quarterly review.
4. **Same priority spine.** Hot signals feed CC; never a parallel "metrics" board with its own urgency.
5. **AI feedback signals are first-class** — calibration health is operational health.
6. **Aggregations are projections.** The event log remains source of truth.

---

## 1. Operational health signals (top-level)

These are the system-level vital signs. CC reads them; ops watches them daily; exec sees them in briefs.

| Signal | What it measures | Source events | Healthy band | Verb on breach |
|---|---|---|---|---|
| Reds-aging | Count of `R` subjects > N hr unhandled | `priority.recomputed`, ack events | low/flat | reassign / escalate |
| Handoff-breach rate | breaches / opens, by handoff type, rolling 7d | `handoff.*` | low | open contract review |
| Escalation rate | escalations / day per branch | `escalation.opened` | low/flat | open pattern review |
| Tier-skip rate | skips / escalations | `escalation.tier_skipped` | near zero | role coverage review |
| Reopen rate | reopens / completions per subject type | `*.reopened` | low | upstream defect review |
| AI reject rate | rejects / presented per type | AI events | calibrated | suspend / recalibrate |
| AI revert rate | reverts / auto-applied per type | AI events | near zero on `reversible-easy`, zero elsewhere | suspend type |
| Notification storm count | per role per day | notification events | low | review trigger rules |
| Suppression count | reds suppressed / day | override events | low and visible | accountability surface on CC |
| Overload rate | role-time at/over cap | `role.overload_detected` | low | rebalance |
| Blocked-time share | session time in `Blocked` per role | state events | low | unblock / route-around |

**Rule:** every signal must answer *"what do I do if this is bad?"*. If it doesn't, it's not on this list.

---

## 2. Blocked-state metrics

`Blocked` is a key operational health proxy — high blocked-time means the system is waiting on humans (vendors, customers, peers) rather than acting.

- **Blocked-time per role per day** — distribution, not just average.
- **Blocked reason mix** — typed: `waiting-customer`, `waiting-vendor`, `waiting-peer`, `waiting-stock`, `waiting-decision`.
- **Blocked-on-self ratio** — blocked because of internal dependency vs. external. Internal-heavy = orchestration problem.
- **Blocked-recovery time** — time from `state.blocked_entered` to `state.blocked_exited` per reason.
- **Action on breach:** if any reason category > threshold, surface to lead. If blocked-on-self > threshold, surface to ops (workflow gap).

---

## 3. Escalation metrics

- **Open escalations by tier** — point-in-time.
- **Mean ack time per tier** — running 7d.
- **Tier-skip rate** — high means tier owner not present (coverage gap).
- **Recurrence rate** — same subject re-escalating within 14d. High = root cause unaddressed.
- **Pattern flags** — escalations clustered by handoff type, role, or workflow step. Surface weekly to ops.
- **Time-to-resolution per tier.**
- **Suppression-followed-by-recurrence** — suppression that turned out wrong (red came back). Strong signal of override abuse.

---

## 4. Handoff breach metrics

- **Open handoffs by receiver** (point-in-time).
- **Time-in-state per phase** (opened → acknowledged → completed).
- **Breach rate per handoff type** (rolling).
- **Breach causes** typed: `receiver-overloaded`, `receiver-unavailable`, `packet-incomplete`, `readiness-failed`, `reassignment-pending`.
- **Reopen rate per handoff type** — high reopen on a handoff = packet shape or readiness predicate is wrong.
- **Bypass-with-override count** — handoffs opened with readiness-bypass. Should be rare.

---

## 5. AI trust metrics

The AI program survives or dies on these.

- **Per-type accept rate** (rolling).
- **Per-type reject rate + reason histogram.**
- **Per-type revert rate** on auto-applied.
- **Per-type verify rate** on accepted.
- **Calibration error per type** — predicted-vs-actual gap; recompute periodically.
- **Time-to-action** — presented → accepted/rejected/deferred.
- **Per-owner trust** — accept rate per (type, owner). Surfaces "this rep ignores AI follow-ups" before it becomes a problem.
- **Stale defer rate** — deferred suggestions that wake and still don't get acted on. Signal of bad timing or wrong owner.
- **AI-induced-red rate** — auto-applied actions that produced a downstream `R` band crossing within window. Hard ceiling.

**Action ceilings:**
- AI-induced-red rate above ceiling → suspend auto-apply for that type until reviewed.
- Calibration drift above ceiling → trigger recalibration; mark suggestions "uncalibrated" until fixed.
- Per-type rejection rate above ceiling → suspend auto-apply, surface on CC, route to `ai-policy-owner`.

---

## 6. Priority churn metrics

- **Recompute rate per subject** — should be moderate; spikes mean inputs are noisy.
- **Band-flip rate** — G↔Y↔R per subject per day. High = hysteresis broken or aging logic too aggressive.
- **Override decay completion rate** — pinned subjects whose pin expires without being re-affirmed (good = bounded overrides). Pins re-affirmed forever = sign of pin abuse.
- **Suppression count + reason mix** — see §1.
- **Score distribution** per population — sanity check that population is not all-red (calibration drift) or all-green (system not noticing problems).

---

## 7. Workload distribution metrics

- **Active subjects per owner per role** — distribution.
- **Load cap utilization** — per individual, per role pool.
- **Overload incidents per week** — and their durations.
- **Coverage gaps detected** — typed events when OOO has no delegate, or delegate is overloaded.
- **Reassignment frequency per owner** — high inbound reassignment = lead routing isn't fitting.

---

## 8. Workflow latency metrics

Per workflow stage transition, per subject type:

- Time `lead.created → lead.claimed`.
- Time `lead.claimed → first-contact`.
- Time `quote.requested → quote.sent`.
- Time `quote.accepted → handoff.opened (sales→design)`.
- Time `quote.accepted → procurement.po.sent` (the cash-to-install bridge).
- Time `design.selection.locked → handoff.acknowledged (design→build)`.
- Time `procurement.po.sent → procurement.po.confirmed`.
- Time `procurement.po.confirmed → procurement.po.received`.
- Time `build.job.scheduled → build.readiness.checked` (last 48 hr before install).
- Time `build.job.signed_off → service.ticket.opened` (warranty curve).

**Each latency has a healthy band**, surfaced as a single rolled-up "workflow latency map" tile for ops.

---

## 9. Operational throughput metrics

- **Subjects entering vs. completing** per workflow per period — leading indicator of pipeline pressure.
- **Today's installs go-rate** — installs completed as scheduled / installs scheduled.
- **PO on-time receive rate** — receives on/before commit ETA.
- **First-touch SLA hit rate** for new leads.
- **Quote-to-accept rate** rolling.
- **Punch-clear rate** post sign-off.
- **Service first-response SLA hit rate.**

---

## 10. Orchestration-health indicators

These watch the runtime itself.

- **Event-emission failures** — should be near zero; any nonzero is loud.
- **Subscriber lag** — projection time-behind-event-log per subscriber.
- **Idempotency violations** — duplicate effects from re-delivery (should be impossible with proper handlers; if seen, contract is broken).
- **Orphaned events** — events without a resolvable subject. Should be zero.
- **Receiver-resolution failures (block-on-no-receiver)** — count per period, by handoff type.
- **Bypass-with-override count** across all contracts — should be rare and trend down.
- **Notification storm detector** — multiple notifications same subject same minute.
- **Audit-immutability self-check** — periodic verification that no past event mutated.

---

## 11. Surfacing rules

- All signals here surface in **one ops health surface** + relevant tiles on **CC**.
- No signal is hidden behind admin pages.
- Each signal has an **owner** (ops by default; `ai-policy-owner` for AI signals; respective leads for branch signals).
- Each signal has a **breach verb** — the action the runtime exposes when threshold trips.
- Signals never replace events as source of truth; they are projections.

---

## 12. Anti-patterns

- "Health score" composite numbers that hide what's actually wrong.
- Vanity metrics on operational surfaces (lifetime $$ closed).
- Per-team metric pages disconnected from CC priorities.
- Charts without verbs.
- Hidden AI metrics ("trust the AI team").
- Signals computed from non-event data (e.g. polling external systems and storing the result as truth).
- Signals without thresholds.
- Signals without owners.

---

## 13. What this doc deliberately omits

- Specific threshold values (policy, owned by ops).
- Storage / time-series engine choice.
- Visualization / chart library.
- Long-horizon analytics (separate concern, not operational).
