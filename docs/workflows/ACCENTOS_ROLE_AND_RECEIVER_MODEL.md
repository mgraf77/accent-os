# AccentOS — Role & Receiver Resolution Model

**Mode:** Workflow systems design (no implementation)
**Anchors:** workflows, event/handoff schema, priority, AI suggestion, operational state
**Purpose:** Make receiver resolution **deterministic** before any runtime is built. Every handoff must resolve to one named owner before it opens; no "the team will pick it up".

---

## 0. Design rules

1. **Roles are operational, not titles.** A role is "what you can own and act on", not HR.
2. **One subject, one primary owner at a time.** Multiple watchers OK; multiple owners is a bug.
3. **Receiver resolution must be pure** — same inputs → same receiver. No randomness, no time-of-day quirks unless explicitly modeled (on-shift).
4. **Every role has a lead.** Escalation tier-1 is always defined.
5. **Coverage is first-class.** Vacation/out-of-office is a typed state, not a Slack note.
6. **AI is not a role.** AI is a capability owned by the `ai-policy-owner` role.

---

## 1. Canonical operational roles

| Role | Owns | Lead | Escalation tier |
|---|---|---|---|
| `sales-rep` | leads, opportunities, quotes (own) | `sales-lead` | tier-1 |
| `sales-lead` | sales-pool, rep load, sales escalations | `ops` | tier-2 |
| `designer` | briefs, selections, specs (own) | `design-lead` | tier-1 |
| `design-lead` | design pool, designer load, design escalations | `ops` | tier-2 |
| `pm` | jobs, POs, change orders, install schedule (own portfolio) | `ops` | tier-1 |
| `crew-lead` | crew on a job, daily reports, blockers | `pm` | tier-1 |
| `crew` | install execution, punch capture | `crew-lead` | (no tier; reports up) |
| `warehouse-staff` | receiving, putaway, picks (on shift) | `warehouse-lead` | tier-1 |
| `warehouse-lead` | warehouse pool, stage zones, daily flow | `ops` | tier-2 |
| `vendor-pm` | vendor relationships, PO chasing | `ops` | tier-1 (often same person as `pm` in small orgs) |
| `finance` | deposits, invoices, AR | `ops` | tier-1 |
| `service` | tickets, warranty, recovery | `service-lead` | tier-1 |
| `service-lead` | service pool, severity routing | `ops` | tier-2 |
| `ops` | escalation tier-3, suppression authority, policy config | `exec` | tier-3 |
| `exec` | tier-4 terminal escalation, strategic flags | (none) | tier-4 |
| `ai-policy-owner` | AI policy classes, auto-apply thresholds, calibration health | `ops` | (not in subject escalation chain; owns AI auto-apply escalations) |

### 1.1 Hierarchy (escalation chain)

```
crew → crew-lead → pm → ops → exec
sales-rep → sales-lead → ops → exec
designer → design-lead → ops → exec
warehouse-staff → warehouse-lead → ops → exec
service → service-lead → ops → exec
ai-auto-applied → ai-policy-owner → ops → exec
```

Every chain terminates at `exec`. No other terminus exists.

---

## 2. Ownership boundaries

- **Lead-stage subjects** are owned by `sales-rep` (claimed) or sit in `sales-pool` until claimed.
- **Opportunity through win** stays with the rep.
- **At `quote.accepted`**, ownership of the *order/job subject* transfers to `pm`. The opportunity stays linked but is read-mostly for sales.
- **Spec lifecycle** is owned by `designer`; the *job* is owned by `pm`. Same project, two subjects, two owners — clean.
- **PO subject** is owned by `pm` (or `vendor-pm` where separated); the receiving event is owned by `warehouse-staff` on shift.
- **Punch items** owned by `pm` until cleared; warranty items transition to `service`.
- **Service tickets** owned by assigned `service`; lead routes severity-1.

**Rule:** ownership transitions are typed handoff events. No silent "the PM took it over now".

---

## 3. Queue ownership

| Queue | Owner | Visibility |
|---|---|---|
| Sales pool (unclaimed leads) | `sales-lead` | sales-rep can claim; lead can assign |
| My leads / opportunities | `sales-rep` | self + lead (read) |
| Design pool (awaiting assignment) | `design-lead` | designer claim or lead assign |
| My specs | `designer` | self + lead (read) |
| Job board | `pm` | crew-lead read; exec CC |
| Today's installs | `crew-lead` per crew | pm + ops + exec read |
| Receive dock today | `warehouse-staff` on-shift | lead + pm read |
| PO at risk | `pm` / `vendor-pm` | exec CC |
| Service queue | `service-lead` → `service` | exec CC |
| Escalation feed | per tier | CC always shows full feed |
| AI inbox (per owner) | subject owner | `ai-policy-owner` aggregate |
| AI auto-applied awaiting verification | `ai-policy-owner` | exec CC |

---

## 4. Write authorities

- **Subject owner** — full write within subject lifecycle.
- **Subject lead** — full write + reassign + override-bounded.
- **Tier-2/3** — read everywhere in their branch; write via reassignment / takeover (typed event), not silent edit.
- **Exec** — read everywhere; can suppress red, can pin (logged), but does not silently edit subjects (preserves trust + audit).
- **AI** — writes only via suggestion lifecycle or auto-apply within policy class; never silent.
- **Cross-role write** requires reassignment first. (Designer cannot edit a PM's PO without becoming the owner.)

---

## 5. Read-Only scope

- **Default open-read** within the same branch (sales-rep reads peer's deals at summary level; full read = lead).
- **Customer-PII gated** — only owners + leads + service.
- **Financial** — only `pm`, `finance`, `exec`, `ops`.
- **Vendor terms** — `pm`, `vendor-pm`, `finance`, `ops`, `exec`.
- **Cross-branch** — summary-only by default; deeper reads require typed access grant (logged).
- Read-Only views **cannot emit events** other than annotations (which are typed and visible).

---

## 6. Override authority

| Action | Who | Bounds |
|---|---|---|
| Reassign a subject | owner-lead, ops, exec | logged, reason required |
| Take over a subject | owner-lead, ops, exec | typed `subject.taken_over`; original owner notified |
| Suppress a red | ops, exec | time-boxed, logged, surfaces on CC ("3 reds suppressed today") |
| Pin a subject | owner, owner-lead | bounded duration, decays |
| Snooze a suggestion | owner | wake condition required |
| Override AI policy class | `ai-policy-owner` + `ops` (two-key) | logged; never silent |
| Bypass handoff readiness | owner-lead with reason | typed event `handoff.opened_with_override`; exec CC |

**Anti-rule:** there is no "admin god mode". Every override is typed, logged, attributed, time-bounded.

---

## 7. Delegation & coverage

- **Out-of-office** is a typed role-state with start/end and a *named delegate* (not "ask the team").
- During OOO:
  - New subjects route to delegate per resolution rules.
  - Existing subjects do **not** auto-transfer — owner returns to them — unless a typed `delegation.takeover` is opened by the lead.
  - SLAs continue as if the role were live; the delegate carries the clock.
- **Vacation cover** is just OOO with a longer horizon and (often) a load-balancing nudge to leads.
- **Lead temporary cover** must be defined for each lead — there is always an acting lead. This is the single enforced redundancy in the model.

---

## 8. Lead escalation rules

- A red on a rep's queue ages → notifies rep at SLA% → `escalation.opened` to lead at SLA breach.
- Lead has tier-1 ack window; if missed, escalates to ops; ops to exec.
- Leads cannot self-clear an escalation on their own subject — must be routed up or resolved with a typed reason.
- **Bounce protection:** a subject that escalates, gets reassigned, and re-reds within a short window does **not** silently re-escalate to the new owner — it jumps a tier and surfaces a "pattern" flag (see anti-entropy + telemetry).

---

## 9. AI-policy-owner boundaries

- **Owns:** policy classes, auto-apply thresholds, calibration health, AI suggestion telemetry.
- **Does NOT own:** subjects. AI never holds a subject; it suggests on a subject the human owns.
- **Receives:** escalations from auto-applied AI actions that produced downstream reds (`ai.action.executed → escalation.opened to ai-policy-owner`).
- **Cannot:** unilaterally raise auto-apply thresholds (two-key with ops), unilaterally silence AI for a role (visible toggle, logged).

---

## 10. Receiver resolution rules per major handoff

Resolution is **deterministic** with a stated tie-break order. Every rule reads typed inputs.

### 10.1 Sales → Design (won deal)

1. **Territory rule:** if customer territory has a designated lead designer with capacity, route to them.
2. **Capacity rule:** else, designer with lowest active-spec load AND on-shift today.
3. **Continuity rule:** if customer has prior designer with a job in last 12 months, prefer that designer (override 1+2) unless that designer is OOO.
4. **Fallback:** `design-lead` queue (lead manually assigns).
5. **Overload guard:** if all designers ≥ load cap, hold in `design-pool` and notify lead immediately; never silently exceed cap.

### 10.2 Design → Build (spec locked)

1. **Continuity rule:** PM already attached to opportunity (assigned at `quote.accepted`).
2. If unassigned: PM by territory + capacity.
3. **Fallback:** `ops`.
4. **No on-shift gate** — PM is portfolio-based, not shift-based.

### 10.3 Quote → Procurement (non-stock SKUs)

1. **Continuity rule:** PM owning the job is procurement receiver by default.
2. If org has dedicated `vendor-pm`: route to vendor-pm holding that vendor relationship; tie-break by load.
3. **Fallback:** `ops`.
4. **Speed gate:** ack SLA is 8 business hrs — overload triggers immediate `ops` escalation, not silent backlog.

### 10.4 Vendor → Warehouse (receive)

1. **On-shift rule:** warehouse-staff on shift at delivery window.
2. **Capacity rule:** lowest pending-receive load on shift.
3. **Fallback:** `warehouse-lead`.
4. **No on-shift = receive blocked**, surfaces to `warehouse-lead` + `pm` immediately. Trucks at the dock with no receiver is a typed red event.

### 10.5 Warehouse → Install (stage/load)

1. **Crew-lead by job** — crew is pre-assigned at scheduling, so crew-lead receives.
2. **Fallback:** `pm`.
3. **Same-day swap:** if crew-lead OOO, delegate from coverage record.

### 10.6 Install → Punch (sign-off)

1. PM owning the job (continuity).
2. **Fallback:** `ops`.

### 10.7 Anyone → Service

1. **Severity routing:**
   - Sev-1 → `service-lead` (mandatory; lead assigns within 4 hr).
   - Sev-2/3 → service-on-call by capacity.
2. **Continuity preference:** prior service owner of same customer wins tie-breaks.
3. **Fallback:** `service-lead`.

### 10.8 Escalation tier handoffs

- Always to the **named tier owner** (not "the leads channel").
- If tier owner OOO, to **acting lead** per coverage record.
- If neither resolvable, jump tier with a `tier_skip` reason flag — do not silently delay.

### 10.9 AI Suggestion → Human

- Receiver = subject owner. AI never picks.
- If subject owner OOO, AI suggestion routes to delegate (same as subject-event routing).
- If suggestion concerns *the policy*, receiver = `ai-policy-owner`.

### 10.10 Common fallback ladder

For any handoff where named rules fail to resolve:

```
named owner → owner's lead → ops → exec
```

Never `null`. The system blocks the handoff (and surfaces it) before allowing a null receiver.

---

## 11. Overload rules

- Each role has a **declared load cap** (subjects-in-flight per role + per individual).
- Exceeding cap is a typed event `role.overload_detected`, not a silent worsening of dashboards.
- Overload triggers:
  - Routing pauses for new assignments to that owner.
  - Lead is notified.
  - CC shows overload tile.
- Overload **does not auto-reassign existing subjects** — that's a lead decision.

---

## 12. Reassignment and takeover

- Both are typed events.
- **Reassignment** keeps subject continuity; original owner is notified, not blamed.
- **Takeover** preserves history — original owner remains attributable to their actions, new owner takes the clock from now.
- Takeover during an open handoff cancels the in-flight handoff and re-issues; SLA resets only on the new handoff.

---

## 13. Anti-patterns

- Role inflation ("everyone is an admin").
- "Admin" as a catch-all role.
- AI as a role with subjects.
- Silent reassignment.
- Pool-only ownership (no individual ever named).
- Channel-based escalation ("post in #urgent").
- Round-robin without capacity awareness.
- Coverage-by-Slack-message.
- Letting overload silently degrade SLA instead of pausing assignment.

---

## 14. What this doc deliberately omits

- Specific load caps and SLA numbers (policy, not architecture).
- Identity provider / SSO mapping.
- Storage of role memberships.
- Permission matrices below the operational granularity above (those are auth concerns).
