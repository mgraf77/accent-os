# AccentOS — Policy Defaults v0

**Mode:** Architecture / specification (no implementation)
**Anchors:** all runtime docs
**Purpose:** First-cut default values for tunable runtime policy. Each value carries **rationale, risk-too-strict, risk-too-loose, owner, future tuning signal**.

These are *defaults*. They live in policy registries (priority, SLA, AI policy, quiet hours, etc.) and are tunable without architecture changes via the registry-edit event flow.

---

## 1. Mobile clock drift tolerance window

- **Default:** ±5 minutes.
- **Rationale:** wide enough to accommodate normal device clock skew and brief offline gaps; narrow enough that ordering ambiguity stays bounded.
- **Risk too strict:** field captures rejected; mobile UX degrades.
- **Risk too loose:** ordering becomes folklore; reds and acks land in confusing sequences.
- **Owner:** ops + runtime team.
- **Future tuning:** rejection rate of submissions due to drift; complaints from field operators about lost captures.

---

## 2. Override budgets per role per day

| override | role | default | notes |
|---|---|---|---|
| subject.suppress_red | ops + exec (two-key) | **3 per business day** combined | accountability surface visible on CC |
| subject.pin | sales-lead, design-lead, pm, etc. | **5 active pins per individual** | with TTL; reaffirm requires new event |
| handoff.opened_with_override | leads | **2 per role per business day** | ops/exec exempt but logged |
| ai.policy.resume_type (after suspension) | two-key | **no per-day cap** but each emits typed event |

- **Rationale:** budgets exist to prevent override-as-norm without preventing legitimate use.
- **Risk too strict:** real operational needs blocked; ops circumvents via "creative" reassignment.
- **Risk too loose:** suppression-as-norm; CC stops reflecting reality.
- **Owner:** ops; exec sign-off on budget changes.
- **Future tuning:** suppression-followed-by-recurrence rate; bypass-with-override count by role; daily "would have been over budget" count.

---

## 3. Schema deprecation default sunset window

- **Default:** **90 days** from `runtime.schema.deprecated` to `runtime.schema.end_of_life`.
- **Rationale:** long enough for active integrations to update without blocking; short enough that deprecated types don't accumulate forever.
- **Risk too strict:** breaking dependents downstream; rushed migrations.
- **Risk too loose:** registry bloat; subscribers carry old code indefinitely.
- **Owner:** runtime team + ops.
- **Future tuning:** count of post-sunset emissions (should be zero); count of subscribers still consuming deprecated types at sunset minus 30 days.

---

## 4. Projection lag thresholds

| projection | "fresh" | "stale" warn | "stale" hard |
|---|---|---|---|
| CC tiles | < 2s | 5s | 30s |
| Role queues | < 3s | 10s | 60s |
| Subject timeline | < 1s | 3s | 15s |
| Telemetry rollups | < 60s | 5 min | 15 min |
| Operational-state evaluator | < 1s | 3s | 10s |

- **Rationale:** CC and operator-facing surfaces tighter; rollups looser.
- **Risk too strict:** false "stale" alarms; visual flicker on projection cutover.
- **Risk too loose:** operators act on stale data without knowing.
- **Owner:** ops + runtime team.
- **Future tuning:** "stale-tile" complaint rate; projection rebuild duration trend.

---

## 5. Anti-entropy monitor cadence

| monitor | cadence |
|---|---|
| Null-receiver detector | continuous (per emission) |
| Unowned-subject scan | every 5 min |
| Silent-mutation (projection-vs-event-log) differential | every 15 min full; sampled continuous |
| Hidden-AI detector | continuous |
| Notification-without-event detector | continuous |
| Override-without-typed-event detector | continuous |
| Sticky-state-self-clear detector | continuous |
| Bounce-loop detector | continuous |
| Anonymous-event detector | continuous (at submission) |
| Bypass-without-override detector | continuous |
| Audit-immutability self-check | every 1 hr |
| Schema-registry self-check (unregistered events) | continuous (at submission) + nightly full |

- **Rationale:** continuous for cheap inline checks; periodic for differential-style checks.
- **Risk too strict:** monitor overhead noticeable.
- **Risk too loose:** drift accumulates between checks.
- **Owner:** runtime team.
- **Future tuning:** monitor false-positive rate; time-from-violation-to-detection.

---

## 6. Stale-suppression window (replay/recovery)

- **Default:** **15 minutes**. Notifications referencing events with `occurred_at` older than this at time of dispatch are suppressed (not sent) on replay/recovery.
- **Rationale:** prevents alarm flood when the notification engine recovers from outage; old reds the operator would have already discovered get filtered.
- **Risk too strict:** missed notifications during recovery.
- **Risk too loose:** alarm flood after recovery, eroding trust.
- **Owner:** ops.
- **Future tuning:** post-recovery notification volume vs steady state; operator-reported "missed alert" rate.

---

## 7. Bounce-protection window

- **Default:** **2 business hours**. Re-red within window after reassignment jumps a tier instead of re-escalating to the same owner.
- **Rationale:** real recurrence is meaningful within hours; longer windows reflect actual workflow change rather than bounce.
- **Risk too strict:** legitimate re-escalations get jumped prematurely.
- **Risk too loose:** loops persist undetected.
- **Owner:** ops.
- **Future tuning:** tier-skip rate vs recurrence rate; operator complaints about "skipped me".

---

## 8. Hysteresis deltas (priority bands)

- **Default:**
  - G→Y crossing requires `score ≥ y_threshold + 3` (on a 0–100 scale).
  - Y→G drop requires `score ≤ y_threshold − 3`.
  - Y→R crossing requires `score ≥ r_threshold + 3`.
  - R→Y drop requires `score ≤ r_threshold − 5` (slightly stickier — coming off red is conservative).
- **Rationale:** prevents flicker on noisy inputs; stickiness off red is intentional (don't ease too quickly).
- **Risk too strict (deltas too wide):** subjects get stuck above their true band.
- **Risk too loose (deltas too narrow):** band flicker; notification storm.
- **Owner:** ops.
- **Future tuning:** band-flip rate per subject per day; storm-detector triggers tied to priority recomputes.

---

## 9. Cooldown after band crossing

- **Default:** **5 minutes** during which further band changes for the same subject are computed but not emitted (the engine still tracks; emission is throttled).
- **Rationale:** absorb input flurries without emitting flapping events.
- **Risk too strict:** real fast-moving deteriorations are masked briefly.
- **Risk too loose:** storm-on-recompute.
- **Owner:** ops.
- **Future tuning:** longest cooldown-suppressed change vs realized state delta.

---

## 10. Dead-letter horizon

- **Default:**
  - In-flight retries: **5 attempts with exponential backoff** capping at 5 min.
  - Dead-letter age threshold for surfacing: **15 minutes**.
  - Dead-letter retention: **30 days** before archive.
- **Rationale:** retry enough to absorb transient faults; surface persistent issues quickly; archive after a safe ops window.
- **Risk too strict:** retries exhaust before transient issue clears.
- **Risk too loose:** retry storms; old dead-letters never reviewed.
- **Owner:** runtime team + ops (surface ownership).
- **Future tuning:** dead-letter occupancy trend; ops backlog.

---

## 11. Event retention horizon

- **Default:**
  - **Hot (queryable, replayable):** 24 months.
  - **Warm (replay-capable, slower):** 5 years.
  - **Archive (audit-only, slow restore):** indefinite.
- **Rationale:** operational reasoning rarely reaches past 24 months; legal/audit reasons want 5+; archive keeps the spine's promise of immutability.
- **Risk too strict:** historical disputes irresolvable.
- **Risk too loose:** unbounded growth; slow projections.
- **Owner:** ops + legal (where applicable) + infra.
- **Future tuning:** replay-from-N-months-ago latency; legal audit demands.

---

## 12. Replay validation cadence

- **Default:**
  - **Differential check:** every **6 hours**, sampled per major projection (CC, role queues, subject timeline rollups).
  - **Full deterministic replay validation:** **weekly**, on a non-production replica.
- **Rationale:** sampled checks catch drift fast; weekly full replay confirms determinism without disrupting production.
- **Risk too strict:** infra overhead.
- **Risk too loose:** drift sits uncaught.
- **Owner:** runtime team.
- **Future tuning:** drift detection rate; rebuild durations.

---

## 13. AI calibration cadence

| capability class | calibration cadence |
|---|---|
| Routing (e.g. ai.route.*) | weekly |
| Drafting (e.g. ai.draft.*) | per-type review monthly; per-owner trust ongoing |
| Parsing (e.g. ai.parse.vendor_eta) | weekly + on parse-drift event |
| Anomaly | monthly |
| Action | weekly + on induced-red event |
| Outbound message | n/a (never auto-apply); review monthly with sales/exec |

- **Rationale:** parsing and action capabilities are highest blast radius; weekly suffices unless drift triggers it sooner.
- **Risk too strict:** infra/ops overhead.
- **Risk too loose:** confidence drifts; auto-apply behavior degrades silently.
- **Owner:** ai-policy-owner.
- **Future tuning:** calibration error trend; per-type accept/reject volatility.

---

## 14. AI induced-red ceilings

| capability class | ceiling |
|---|---|
| ai.parse.vendor_eta | ≥ 1 induced-red per rolling 7 days → suspend |
| ai.action.auto_reserve_inventory | ≥ 2 per rolling 14 days → suspend |
| ai.action.recompute_lead_time | ≥ 2 per rolling 7 days → suspend |
| ai.action.pre_install_readiness_check | ≥ 1 false-green leading to install red → suspend |
| ai.route.* | ≥ 3 induced-overload per rolling 7 days → suspend |
| ai.anomaly.* (informational) | n/a (suggestions; suspend on rejection-rate ceiling instead) |

- **Rationale:** ceilings are conservative; AI auto-apply is a privilege, not a right.
- **Risk too strict:** suspensions interrupt legitimate auto-apply.
- **Risk too loose:** AI cascading failures.
- **Owner:** ai-policy-owner + ops.
- **Future tuning:** suspension frequency per capability; recovery time post-resume.

---

## 15. AI rejection-rate hotspot ceilings

- **Default:** rejection rate > **40%** over rolling 14 days (with minimum n=20 presentations) → auto-suspend type.
- **Rationale:** if humans reject 4 of 10, the suggestion is more noise than signal.
- **Risk too strict:** suspending merely-noisy-but-tolerable types.
- **Risk too loose:** users learn to ignore AI silently.
- **Owner:** ai-policy-owner.
- **Future tuning:** per-owner rejection vs per-type rejection (a per-owner spike may indicate routing problem, not type problem).

---

## 16. Coverage gap auto-suspend

- **Default:** lead OOO without acting-lead is **rejected at submission** of OOO command. Coverage-gap detector additionally **emits `registry.coverage.gap_detected`** if any role's coverage records become inconsistent (delegate retired, etc.).
- **Rationale:** lead coverage is the single structurally-required redundancy.
- **Risk too strict:** legitimate lead OOO blocked when delegate has not yet been arranged.
- **Risk too loose:** silent lead-cover gaps.
- **Owner:** ops.
- **Future tuning:** rejection rate of OOO submissions; gap-detected count.

---

## 17. Quiet hours defaults

- **Default:**
  - **Per role region:** 19:00 – 07:00 local; weekend reduced.
  - **Severity-1 bypasses always.** Severity-2 bypass only when subject is `R` and SLA < 2 hr.
- **Rationale:** protect operators from non-essential paging.
- **Risk too strict:** real urgents missed.
- **Risk too loose:** burnout; signal degradation.
- **Owner:** ops + per-role lead.
- **Future tuning:** quiet-hour-bypass count; operator-reported "false alert".

---

## 18. Handoff SLAs (default ack windows, business-hour clocks)

| handoff | ack SLA |
|---|---|
| Sales → Design | 24 hr |
| Design → Build | 48 hr |
| Quote → Procurement | 8 hr |
| Vendor → Warehouse | end-of-day-of-arrival |
| Warehouse → Install | day-of-load before truck departs |
| Install → Punch | 7 days for full clear; warn at 14 days per item |
| Anyone → Service | 24 hr first-response (sev 2/3); 4 hr (sev 1) |
| Escalation tier ack | tier-1: 60 min; tier-2: 30 min; tier-3: 15 min; tier-4 (exec): 30 min |
| AI Suggestion → Human | medium type-default 8 hr; defer/auto-policy applies |

- **Rationale:** matches business cadences; faster gates on cash-to-install bridges.
- **Risk too strict:** breach noise.
- **Risk too loose:** handoffs sit; reality drifts.
- **Owner:** ops; per-handoff lead may tune within bounds.
- **Future tuning:** breach rate by handoff type; reopen rate signaling packet defects vs SLA pressure.

---

## 19. Pin TTL caps

| pin scope | max TTL | reaffirmation |
|---|---|---|
| Owner self-pin | 7 days | typed reaffirm event required |
| Lead pin on subject | 14 days | reaffirm |
| Ops/Exec pin | 30 days | reaffirm |

- **Rationale:** pins decay; permanent pins are decoration.
- **Risk too strict:** legitimate long-running focus interrupted.
- **Risk too loose:** pin abuse.
- **Owner:** ops.
- **Future tuning:** pin reaffirmation rate; pin-active-age distribution.

---

## 20. Snooze max durations

- **Default:** snooze wake conditions accepted up to **14 days** out (or event-driven, with no time bound but with audit visibility).
- **Rationale:** prevents long-tail forgetting.
- **Owner:** ops.

---

## 21. Notification storm threshold

- **Default:** > 5 notifications per role per minute → `notification.storm_detected`; storm-detector then suppresses further notifications for that role for **2 minutes** while emitting a single aggregated digest.
- **Rationale:** a storm is itself a problem; aggregating is better than flooding.
- **Owner:** ops + runtime team.

---

## 22. Receiver-resolution determinism check

- **Default:** **daily**, replay 1% sample of receiver-resolutions; expect identical outcomes given same registry version. Mismatch emits `runtime.audit.resolution_drift`.
- **Rationale:** detects role-registry edits poisoning rules.
- **Owner:** runtime team.

---

## 23. Where these defaults live

- Per-registry placement (priority, SLA, AI-policy, quiet-hours) is per the registry artifact spec.
- A consolidated `policy_defaults_v0` artifact may be shipped as a single seed file at runtime initialization, then split into the canonical registries on first event.
- Every default is a typed registry-event change post-seed; nothing is a magic constant in code.

---

## 24. Tuning workflow

1. Telemetry surfaces a tuning signal (e.g. breach rate too high).
2. Ops drafts a registry change.
3. Single-key or two-key edit (per registry artifact spec).
4. Typed event emitted; CC reflects new policy.
5. Subjects emitted post-change carry the new registry version; replays use historical version.

No back-fix.
