# AccentOS — Command Center Specification

**Mode:** Workflow systems design (no implementation)
**Anchors:** workflows, event/handoff schema, priority, AI suggestion, operational state, role model
**Purpose:** Specify the **single executive operational surface** — the operational heartbeat, not a KPI dashboard.

---

## 0. Core philosophy

1. **One screen, scannable.** If the exec needs three tabs, the design failed.
2. **Operational, not analytic.** CC answers *"what should I do today?"*, not *"how did Q2 go?"*.
3. **CC and `Executive Review` operational state are the same surface.** No parallel exec dashboard.
4. **Sort by `priority_score` everywhere.** Always. No per-tile invented sort.
5. **Quiet by default, loud only on real signal.** Reds, breaches, escalations, suppressions.
6. **Verbs over numbers.** Every tile has at least one action; vanity tiles don't ship.
7. **CC mirrors the orchestrator.** What the system thinks is hot is what the human sees as hot. Divergence is a bug.

---

## 1. Layout zones

The CC has three zones, top-to-bottom, with a fixed left rail.

### Zone A — Today's reality (top hero)

- Today's installs go/no-go (per-job tiles).
- POs at risk threatening an install date.
- Handoffs breached awaiting tier ack.
- Live escalation feed (currently open, not historical).

### Zone B — Money & motion (mid)

- Pipeline $$ + change vs. yesterday.
- Stalled deals > $X.
- Cash-in vs. plan: deposits today, milestones due, AR aging top 5.
- Quotes expiring this week.

### Zone C — System health (lower)

- Inventory red SKUs.
- AI auto-applied awaiting verification.
- AI rejection-rate hotspots (signal of bad suggestions or wrong policy).
- Overload tile (any role hitting cap).
- Suppressions today (accountability surface).

### Left rail — "Top 3 to look at"

- Three subjects the system thinks need exec attention now, with a one-line "why" each. Drawn from the priority spine + context (handoff breach, escalation, suppression abuse, blocker pattern).
- Verbs visible: *Open*, *Assign*, *Escalate*, *Snooze with reason*, *Ack brief*.

---

## 2. Tile catalog

Each tile has: **what**, **source events**, **sort**, **verbs**, **quiet/loud rule**, **mobile inclusion**.

### 2.1 Today's installs go/no-go

- **What:** every install scheduled today + tomorrow with status `green/yellow/red` from readiness check.
- **Source:** `build.readiness.checked`, `build.blocker.reported/cleared`, `procurement.po.received`, `inventory.reserved`.
- **Sort:** `priority_score` desc; same-score by install start time.
- **Verbs:** *Open job*, *Force-call PM*, *Reschedule*.
- **Loud rule:** any red blinks the tile heading; mobile push for new red within 24 hr of install.
- **Mobile:** yes — tile-1.

### 2.2 POs at risk

- **What:** POs whose ETA threatens an install date or is unresponsive.
- **Source:** `procurement.po.eta_slipped`, `procurement.po.confirmed` aging, vendor reliability changes.
- **Sort:** `priority_score` desc; ties by smallest ETA-to-install buffer.
- **Verbs:** *Chase vendor*, *Request expedite*, *Swap to in-stock*, *Open PO*.
- **Loud rule:** new entry → CC banner; existing items quiet refresh.
- **Mobile:** yes — tile-2.

### 2.3 Handoffs breached

- **What:** open `handoff.breached` events not yet resolved.
- **Source:** `handoff.breached`, `handoff.acknowledged`.
- **Sort:** age desc within band.
- **Verbs:** *Ack on behalf*, *Reassign*, *Open subject*.
- **Loud rule:** any new breach → CC banner.
- **Mobile:** yes — tile-3.

### 2.4 Live escalation feed

- **What:** all currently open `escalation.opened` events with tier and clock.
- **Source:** `escalation.opened`, `escalation.acknowledged`, `escalation.resolved`.
- **Sort:** tier asc, then clock asc (the highest tier with the tightest clock floats up).
- **Verbs:** *Take over*, *Reassign*, *Resolve with note*.
- **Loud rule:** tier-3+ escalations always loud; tier-1/2 quiet on CC unless aging.

### 2.5 Pipeline pulse

- **What:** total open pipeline $$ + delta vs. yesterday + stage histogram.
- **Source:** `sales.opportunity.stage_changed`, `quote.*`.
- **Sort:** n/a (single visualization).
- **Verbs:** *Drill to stalled*, *Drill to expiring quotes*.
- **Quiet by default.** Loud only on > X% adverse delta.

### 2.6 Stalled deals > $X

- **What:** opportunities with `sales.opportunity.stalled` flag and value > threshold.
- **Source:** stalled events.
- **Sort:** value desc.
- **Verbs:** *Open*, *Force follow-up draft*, *Reassign*.

### 2.7 Cash-in vs. plan

- **What:** deposits captured today, milestones due, AR top 5 aging.
- **Source:** finance events.
- **Sort:** amount desc within sub-section.
- **Verbs:** *Open invoice*, *Send reminder*.

### 2.8 Quotes expiring this week

- **What:** quotes with TTL < 7 days, not yet accepted/declined.
- **Source:** `quote.sent`, `quote.viewed`, `quote.expired`.
- **Sort:** smallest remaining TTL first; tie by value desc.
- **Verbs:** *Nudge*, *Extend TTL with reason*.

### 2.9 Inventory red SKUs

- **What:** SKUs flagged by `inventory.stock_risk_detected` against jobs within 14 days.
- **Source:** stock-risk events, reorder triggers.
- **Sort:** soonest-needing-job first.
- **Verbs:** *Open SKU*, *Open dependent job*, *Force PO draft*.

### 2.10 AI auto-applied awaiting verification

- **What:** AI actions that auto-applied and have not yet been verified or reverted.
- **Source:** `ai.action.executed`, `ai.suggestion.verified/reverted`.
- **Sort:** age desc; unreviewed within reversibility window first.
- **Verbs:** *Verify*, *Revert*, *Open subject*.

### 2.11 AI rejection-rate hotspots

- **What:** suggestion types with rejection rate above threshold over rolling window.
- **Source:** AI feedback signals.
- **Sort:** rejection-rate desc.
- **Verbs:** *Open type policy*, *Suspend type*, *Recalibrate*.

### 2.12 Overload tile

- **What:** any role currently at/over load cap.
- **Source:** `role.overload_detected`.
- **Sort:** severity (over cap) desc.
- **Verbs:** *Reassign queue*, *Open lead*.

### 2.13 Suppressions today

- **What:** reds suppressed by ops/exec today, with reason.
- **Source:** override events.
- **Sort:** time desc.
- **Verbs:** *Reinstate*, *Open subject*.
- **Loud rule:** quiet by default, but persistent — accountability surface.

### 2.14 Top 3 to look at (left rail)

- **What:** three system-picked subjects with one-line "why".
- **Source:** priority spine + context heuristics (breach + value + AI confidence).
- **Verbs:** *Open*, *Assign*, *Escalate*, *Snooze*.
- **Loud rule:** refreshes at most every N minutes; never thrashes.

---

## 3. Sorting & priority discipline

- All list tiles sort by `priority_score` desc by default.
- Ties broken by deterministic secondary keys per tile (install start time, smallest buffer, age).
- **No tile invents its own urgency math.** If a tile needs a different population, it filters; it does not re-derive.
- **No "manual priority" picklists.** Pin/snooze are bounded overrides surfaced separately.

---

## 4. Quiet/loud information rules

- **Loud surfaces:**
  - New `R` band crossing on a CC-relevant subject.
  - New `handoff.breached` or `escalation.opened`.
  - Today's install going red within 24 hr.
  - AI auto-applied action triggering downstream red.
- **Quiet refreshes (no banner):**
  - Within-band updates.
  - Re-sorts.
  - Score deltas without band crossing.
  - Pipeline value drift below adverse-delta threshold.
- **Banner cooldown:** after a loud notification, the same tile suppresses banners for a short cooldown to avoid storming.
- **Severity-1 always breaks quiet hours**, by definition. Everything else respects quiet rules.

---

## 5. Operational focus behavior

- **CC respects exec's `Focus` state.** When exec opens a subject and pins it, the rest of CC dims (visible, not gone).
- **CC ignores exec's `Blocked` state on themselves** — exec is rarely "blocked" in CC sense, and CC must keep showing system reality.
- **`Executive Review` is the default state when exec opens CC** — that's by design; CC is the surface for that state.

---

## 6. Role-aware variants

CC is exec-primary, but lower-tier "command-center-likes" exist:

- **Ops CC** — same surface, full system visibility, write authority on suppression and reassignment.
- **Sales-lead CC** — pipeline pulse + stalled + sales escalations + sales overload.
- **Design-lead CC** — design pool + spec-risk + design escalations.
- **PM CC** — today's installs + POs at risk + punch aging + crew overload.
- **Service-lead CC** — service queue + sev-1 + recovery cases.
- **Warehouse-lead CC** — receive today + pick coverage + stage zones + load deadlines.

These share **the same tiles, the same sort discipline, the same priority spine** — they differ only in scope filter. There is no second priority logic, no second event source.

---

## 7. Mobile compact mode

- **Five-tile max.** No spreadsheets on phones.
- **Default tiles (exec mobile):**
  1. Today's installs go/no-go.
  2. Top 3 to look at.
  3. Live escalations.
  4. Handoffs breached.
  5. Morning brief (or AI auto-applied awaiting verification, post-AM).
- **Verbs on every tile.** Tap = act, not "view record".
- **One swipe deeper at most** to underlying subjects.
- **Quiet hours stricter on mobile** — only severity-1 breaks through.

---

## 8. Morning brief composition

- **Generated at:** start of business day, role-tz aware.
- **Source:** events since previous EOD digest.
- **Format:** five bullets max:
  1. What changed (top deltas in pipeline, install schedule, vendor risk).
  2. What's at risk today (today's reds + tomorrow's reds-in-waiting).
  3. What needs an exec decision (top 3 to look at).
  4. What AI did automatically overnight (auto-applied awaiting verification).
  5. What rolled over from yesterday unresolved.
- **Acks:** *Ack brief*, *Snooze item with reason*, *Assign owner*.
- **AI:** `[D]` — AI drafts; exec accepts/edits inline.
- **Storage as event:** `executive.brief.generated`, `executive.brief.acked` — observable.

---

## 9. EOD digest composition

- **Generated at:** end of business day.
- **Format:**
  1. Wins (closed deals, signed-off jobs, recovered tickets).
  2. Slips (handoffs breached, install reschedules, PO ETA slips).
  3. Money in vs plan today.
  4. Tomorrow's top risks (preview of AM brief inputs).
  5. Pattern flags (recurring escalations, AI hotspots, role overload trends).
- **Acks:** *Ack digest*, *Carry into AM*.
- **AI:** `[D]`.
- **Storage as event:** `executive.eod.generated`.

---

## 10. CC anti-patterns

- KPI walls with no verbs.
- Vanity metrics (lifetime $ closed, all-time pipeline).
- Per-tile invented urgency.
- Parallel "exec dashboard" separate from CC.
- Tile sprawl (more tiles ≠ more clarity).
- Read-only suppressions (every suppression must show on CC).
- Silent AI auto-applies hidden behind a settings page.
- "Health" tiles using made-up scores instead of typed events.
- Mobile that is desktop-shrunk.
- Briefs/digests that aren't tied to typed events (then they aren't auditable).

---

## 11. What this doc deliberately omits

- Visual styling, theming, color palette.
- Specific thresholds (adverse-delta %, cooldown durations).
- Charting library or rendering decisions.
- Auth model — covered by role doc.
