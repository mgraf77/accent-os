# AccentOS — Infrastructure Requirements Brief

**Mode:** Architecture / specification (no implementation, no vendor choice)
**Anchors:** all runtime docs
**Purpose:** State what infrastructure must provide so the runtime contracts hold. Requirements only.

---

## 0. Scope

- **In:** acceptance criteria for storage, replay, observability, dead-letter, audit, degraded-mode behavior, recovery.
- **Out:** technology choice (no DB, queue, cloud, vendor selection); pricing; deployment topology; scaling math.

---

## 1. Event-store durability targets

The event store is the single canonical SPOF. Acceptance:

1. **Acknowledged commits survive single-node failure.** The runtime contract is: ack means committed.
2. **Per-subject ordered logs are preserved across node failures and restarts.** Order is `(occurred_at, received_at, monotonic-tiebreak)`; tiebreak must persist.
3. **Append-only at storage layer.** No update/delete primitives exposed to the runtime.
4. **Immutability self-checks** (every hour per policy defaults) must run against backed storage; results emit typed events.
5. **Replication target:** ≥3 independent failure domains (zones / regions, definition deferred to infra design). Loss of any one does not break write or read.
6. **Recovery point objective (RPO):** zero committed events lost on a single failure-domain loss. This is non-negotiable.
7. **Recovery time objective (RTO):** writes resume within bounds (specific minutes deferred to infra design but explicit before implementation).

---

## 2. Backup / restore acceptance criteria

1. **Backup cadence:** continuous (streaming), not batch nightly.
2. **Backup target:** an independent failure domain from production storage.
3. **Backup integrity self-check:** weekly automated restore test to a non-production environment, verifying immutability + ordering.
4. **Restore primitive:** point-in-time restore to any moment within the hot-retention horizon; archive restore with declared (longer) latency.
5. **Restore validation:** post-restore, run replay-vs-live differential against a known-good projection snapshot; results are typed events.
6. **No silent restore.** Every restore emits start/progress/complete events captured in the runtime event log of the target environment.

---

## 3. Replay performance targets

1. **Per-subject replay:** sub-second for any individual subject within hot retention.
2. **Per-projection rebuild from event store:** target rebuild duration declared per projection (e.g. CC tiles full rebuild < 10 min; subject timeline projections < 5 min). Specific values in policy defaults.
3. **Full-system replay (cold rebuild of all projections):** must complete within an operationally tolerable window — declared explicitly before implementation. The runtime requires this number; infra delivers it.
4. **Replay isolation:** replay workloads must not degrade live ingestion below documented thresholds.

---

## 4. Projection rebuild SLAs

- **Single-projection rebuild without service interruption** (rolling cutover via typed `projection.cutover`).
- **Concurrent rebuilds** of multiple projections supported (no exclusive locks).
- **Drift-triggered rebuilds** auto-throttle to avoid noise; emit progress events.
- **Rebuild failure** is itself a typed event; runtime doesn't silently retry forever.

---

## 5. Observability ingestion

Infrastructure must accept the runtime's observability output:

1. **Typed event ingestion** at scale supporting all `runtime.audit.*`, `projection.*`, `adapter.*`, `notification.*`, `command.rejected.*` events.
2. **Structured query** over observability events (for ops to investigate).
3. **Real-time projection** to the orchestration-health surface on CC (sub-second from event to tile refresh, per policy defaults).
4. **Long-horizon analytics** are explicitly out of scope — this is operational observability only. Analytics warehousing is a separate concern.

---

## 6. Dead-letter handling

1. **Dead-letter store** keyed by event type, target subscriber, age.
2. **Surface ownership** — every dead-letter has a typed owner (per `ACCENTOS_OPERATIONAL_TELEMETRY.md`).
3. **Retention** per policy default (30 days hot, archive thereafter).
4. **Replay tools** for dead-letter items must support idempotent re-enqueue (preserve `event_id` / `command_id`).

---

## 7. Audit log survivability

The audit log *is* the event store. All audit-survivability requirements collapse into event-store requirements (§1, §2).

Additional requirements:

1. **No mutation primitive at admin level.** Operators cannot delete or edit historical events, even with elevated infra access. If someone *can* edit history, audit is theatrical.
2. **Encryption at rest** for the event store with key rotation supporting historical decryption.
3. **Tamper evidence:** periodic cryptographic check (e.g. hash chain) so any out-of-band edit is detectable. (Mechanism deferred; the requirement is detection, not specific hash choice.)

---

## 8. Degraded-mode requirements

Infrastructure must support component-by-component degradation per `ACCENTOS_RUNTIME_SURVIVABILITY_AUDIT.md` § 12:

1. **Event store available; engines down:** events still commit; engines re-converge on restart via replay.
2. **Engines available; one projection store down:** other projections continue; affected reads surface "stale/unavailable" markers.
3. **Notification engine down:** events commit; notifications queue with bounded depth + stale-suppression on recovery.
4. **AI engine down:** suggestions pause; subjects continue; CC shows degraded.
5. **Receiver-resolution down:** handoffs block visibly; senders see explicit block.
6. **Ingress (command intake) down:** clients receive explicit submission failure (typed); offline mobile clients queue and replay.

Each degraded mode emits typed start/end events; CC shows component status; recovery never re-fires alarms.

---

## 9. Disaster recovery expectations

- **Cross-region resilience.** Loss of a single region does not lose committed events (per §1.5–1.7).
- **DR drill cadence** — declared (default: quarterly) — that exercises failover and recovery; results are typed events captured in audit.
- **Read-only mode** — under sustained DR, the runtime must support a read-only operational stance: projections served stale-marked, writes refused with typed `runtime.read_only_mode` events. This is preferable to fabricated state.
- **Backup restore as primary DR** for catastrophic failures: events restored, projections rebuilt from events.

---

## 10. Capacity and scaling posture

- **Bounded by acceptance criteria, not by speculation.** This brief does not declare scale targets; the implementation phase declares them.
- **Headroom requirement:** infra must support ≥2× current peak load before degradation; this is the only scaling rule the runtime requires at this level.
- **Elastic scale of stateless components** (engines, dispatchers) is a goal, not a runtime contract.

---

## 11. Network / connectivity

- **Mobile clients** may be intermittently offline; runtime accepts queued submissions on reconnect (drift tolerance window applies).
- **Adapters to external systems** may be intermittently degraded; adapter contract handles this.
- **Internal component connectivity** must be bounded-latency for interactive paths (command submission, projection reads); specific values in policy defaults.

---

## 12. Time service

- **Wall-clock honesty.** Runtime servers must run a synced clock (NTP or equivalent); drift between runtime nodes must be detectable.
- **Mobile drift tolerance** is per policy defaults; runtime nodes themselves should drift far less.
- **No time-service spoofing** in production — events from nodes with detected clock drift beyond threshold should be flagged.

---

## 13. Security posture (infra-level requirements)

- **Encryption in transit** for all command and event channels.
- **Encryption at rest** for event store, projections, dead-letter, observability stores.
- **Secret management** outside runtime code; runtime consumes secrets via infra-provided injection.
- **Network segmentation** between runtime, adapters, and external integrations.
- **No production data in non-production environments** without explicit scrub procedure.

These are stated as runtime-required infra properties; the runtime does not implement them.

---

## 14. Observability for infra itself

- **Component health** (storage latency, queue depth, dead-letter age) exposed via typed events the runtime consumes — same observability surface, no parallel infra dashboard.
- **Capacity utilization** exposed; sustained high utilization emits typed events ops can act on.

---

## 15. Anti-patterns

- "Infra dashboard" parallel to CC orchestration health.
- Direct admin DB access used to "fix" production data.
- Backup that is never restore-tested.
- Single failure-domain deployment.
- Synchronous coupling between runtime engines via shared state outside the event store.
- Long-horizon analytics imposed on the operational event store.
- Ad-hoc batch jobs that mutate projections out-of-band.
- Time-of-day cron jobs shaping behavior outside the registry-driven cadences.

---

## 16. Acceptance checklist (infra-readiness)

Implementation requires infra to satisfy:

1. ☐ Event store with §1 durability targets.
2. ☐ Backup/restore with §2 acceptance.
3. ☐ Replay performance per §3.
4. ☐ Projection rebuild SLAs per §4.
5. ☐ Observability ingestion per §5.
6. ☐ Dead-letter handling per §6.
7. ☐ Audit immutability + tamper evidence per §7.
8. ☐ Degraded-mode behaviors per §8.
9. ☐ DR posture per §9.
10. ☐ Capacity headroom per §10.
11. ☐ Network/time/security per §11–§13.
12. ☐ Infra observability flowing through the same event surface per §14.

When all 12 are checked, infra is implementation-acceptable.

---

## 17. Out of scope (explicit)

- Cloud provider, orchestration platform, queue technology, database choice.
- Cost optimization.
- Specific instance sizing.
- Network topology specifics.
- Identity provider (separate boundary brief).
- CI/CD pipeline.
- Application performance management tooling beyond the observability ingestion requirement.
