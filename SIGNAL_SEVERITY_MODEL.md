# SIGNAL_SEVERITY_MODEL.md
> Severity, escalation, notification, suppression — v1
> Pair with OPERATIONAL_SIGNAL_TAXONOMY.md

## Why severity matters more than the signal itself

The taxonomy says *what* happened. Severity decides *whether a human is interrupted, when, how, and how often*. Severity is the contract between AccentOS and operator attention. Get it wrong and either:
- Operators ignore everything (alarm fatigue), or
- Real fires get missed inside the noise.

The severity model is therefore the single most consequential design surface in the entire signal framework.

## The five levels

| Level | Code | Priority | Meaning | Operator expectation |
|---|---|---|---|---|
| **informational** | INFO | P4 | Worth knowing, no action required today | Read at leisure in daily summary |
| **warning** | WARN | P3 | Drift detected, action this week | Surfaces in role dashboard |
| **elevated** | ELEV | P2 | Real operational degradation, action today | Pinned in role feed + daily digest |
| **critical** | CRIT | P1 | Active operational pain, action within hours | Push notification to owner role |
| **emergency** | EMRG | P0 | Money/customer/safety actively bleeding | Phone-class alert, multi-channel, immediate |

### Practical anchors

- **INFO**: "vendor X single-sourced for SKU Y" — true, useful, never urgent
- **WARN**: "vendor lead time drifted 30%" — investigate this week
- **ELEV**: "conversion dropped 25% vs 30d" — investigate today
- **CRIT**: "checkout error rate 4% last hour" — fix now
- **EMRG**: "all integrations down" / "storefront returning 5xx" — wake somebody up

## Escalation paths

```
INFO  → daily digest → archive
WARN  → role dashboard → daily digest → archive
ELEV  → role feed (pinned) → daily digest → if unresolved 24h, escalate to owner
CRIT  → push to owner role + role feed → if unresolved 2h, escalate to owner-of-owner
EMRG  → multi-channel (push + sms + email) → if unresolved 15m, escalate up + page next-in-line
```

**Escalation is not re-firing.** Escalation is a *new signal* (`signal.escalated`) referencing the original. The original is never duplicated.

## Notification philosophy

1. **Notification ≠ signal.** A signal is recorded regardless. Notification is a routing decision.
2. **The default channel is the role dashboard, not push.** Push is reserved for CRIT and EMRG.
3. **One human per signal, by default.** Group/broadcast only at EMRG.
4. **Quiet hours are honored except for CRIT/EMRG.**
5. **Owner role > person.** Routing is by role; person assignment is downstream.
6. **Every notification is replayable** — recipients can find it later without reopening the alert.

## Operator fatigue prevention

These rules are non-negotiable. They exist because a system that emits 200 signals/day is functionally a system that emits zero.

### Budget rules

| Level | Per-role daily ceiling | Behavior at ceiling |
|---|---|---|
| INFO | unlimited (digest only) | rolled into single daily digest entry |
| WARN | 20/day/role | additional WARN demoted to digest |
| ELEV | 8/day/role | additional ELEV batched, paged once |
| CRIT | 4/day/role | additional CRIT triggers `friction.signal_storm` meta-signal |
| EMRG | no ceiling, but auto-trips storm-mode | see storm-mode below |

### Storm mode

When the system emits >3 CRIT or any EMRG within 5 minutes from the *same source system*, AccentOS automatically:
1. Suppresses further CRIT from that source for 15 minutes
2. Emits a single `sys.signal_storm` EMRG to sysops
3. Surfaces a unified storm view (all suppressed signals visible, none re-notified)

This prevents the canonical "20 alerts from one outage" failure.

## Suppression rules

A signal is **suppressed** (recorded but not notified) when any of:

1. **Duplicate within cooldown.** Same `signal_name` + same entity_id within cooldown window (see table below).
2. **Stale source.** `source.last_sync_age > stale_tolerance` for the signal. Replaced with `sys.cache_stale` meta-signal.
3. **Maintenance window.** Explicit operator-declared window for an integration.
4. **Known-issue tag.** Operator has acknowledged the underlying cause; AccentOS suppresses until resolution or 7-day timeout.
5. **Quiet hours** (INFO/WARN only).
6. **Storm-mode active** (per source system, CRIT only).

### Default cooldowns

| Level | Cooldown |
|---|---|
| INFO | 24h |
| WARN | 12h |
| ELEV | 4h |
| CRIT | 30m |
| EMRG | 5m |

Cooldown is keyed on `(signal_name, entity_id)`, never on `signal_name` alone — otherwise a stockout on SKU A would suppress a stockout on SKU B.

## Batching logic

Batching applies to **digests**, never to CRIT/EMRG.

- **Hourly digest**: WARN signals accumulated in the last hour, grouped by category, sent to role dashboard.
- **Daily digest** (default 7am local): INFO + unresolved WARN + ELEV summary, one email per role.
- **Weekly digest** (Monday 7am): trend rollup, delta highlights, signal volume report.

A batched signal is **not** a different signal — it is the same signal-id surfaced through a different channel. No duplication.

## Severity assignment is a deliberate act

When proposing a new signal:

1. Default to **one level lower than your instinct.** Engineers consistently over-rate.
2. If you cannot describe the operator action **in one sentence**, drop a level.
3. If the action is "look at it later," it is **INFO** — full stop.
4. CRIT/EMRG require an explicit reviewer sign-off recorded in the signal definition.

## Auditability

For every notification fired AccentOS records:

- signal_id, severity, signal_name, entity_id
- routing decision (role, channel, recipient_role)
- suppression checks evaluated (and results)
- escalation chain (if any)
- acknowledgement & resolution timestamps

Audit log is retained 365 days minimum. This is what lets us *tune* the model rather than guess at it.

## Tuning loop

Severity is not set once. Every 30 days sysops + owner review:

- Top 10 highest-volume signals → consider demotion or tighter trigger
- Any signal with <10% acknowledgement rate → demote or kill
- Any signal that *should* have fired but didn't (post-incident) → promote
- Any storm-mode trips → diagnose source system, not signal

The severity model lives or dies by this loop.
