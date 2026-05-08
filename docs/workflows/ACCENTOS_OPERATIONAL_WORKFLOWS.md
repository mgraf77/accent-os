# AccentOS — Operational Workflow Model

**Mode:** Workflow systems design (spoke session — no implementation)
**Goal:** Anchor the approved shell architecture in real operational leverage. Every dashboard surface, command-center widget, quick action, and notification rule should trace back to one of the workflows below.
**Lens:** Operational speed, cognitive simplicity, low friction, orchestration visibility. No enterprise fluff.

---

## How to read each workflow

Each section follows the same template:

- **Trigger** — what kicks the workflow off (event, time, threshold, inbound signal).
- **Primary actions** — the linear path a competent operator runs.
- **Bottlenecks** — where time/attention/clarity is actually lost today.
- **Urgency states** — green / yellow / red, expressed as a rule the system can compute.
- **Notifications** — who/what/when. Channel choice and quiet rules.
- **AI-assist opportunities** — concrete points where AI removes a step or reduces a decision.
- **Command-center visibility** — what executive/orchestrator must always see.
- **Dashboard surfaces** — role-specific dashboard cards/lists.
- **Quick actions** — single-tap operations (mobile-first where applicable).
- **Role-aware considerations** — how the same workflow looks for sales/design/build/exec/warehouse.

Conventions:

- **Urgency rule shorthand:** `R = red`, `Y = yellow`, `G = green`. Stated as a computable predicate.
- **AI-assist tag:** `[A]` = automatable, `[S]` = suggest only, `[D]` = draft for human review.
- **Surface tag:** `CC` = command center, `D-{role}` = role dashboard, `Q` = quick-action tile, `M` = mobile.

---

## 1. Salesperson workflows

### 1.1 New lead intake → first response

- **Trigger:** Lead created (web form, phone log, walk-in, referral, marketplace).
- **Primary actions:**
  1. Acknowledge lead within SLA.
  2. Qualify: budget band, scope, timeline, decision-maker.
  3. Assign or self-claim.
  4. Schedule first contact (call / site visit / showroom).
  5. Log contact result.
- **Bottlenecks:**
  - Leads sit unclaimed in shared inbox.
  - Qualification data captured in free-text, not fielded.
  - Scheduling tag ping-pong between sales and customer.
- **Urgency states:**
  - `R`: lead age > SLA (e.g. >2 business hrs unacknowledged) OR marked "high intent".
  - `Y`: 1 hr unacknowledged, business hours.
  - `G`: claimed and contact scheduled.
- **Notifications:**
  - Push to assigned rep on claim/assignment.
  - Escalate to sales lead at `Y→R` boundary.
  - Quiet hours respected; SLA clock pauses outside business hours.
- **AI-assist:**
  - `[D]` Drafted first-response message (SMS + email) in customer's language.
  - `[S]` Lead-quality score from form fields + enrichment.
  - `[A]` Auto-assign by territory / availability / load.
  - `[D]` Suggested time slots based on rep's calendar + customer time zone.
- **CC:** Unclaimed leads count, average time-to-first-touch, rep load balance.
- **D-sales:** "My new leads" with countdown timer to SLA breach.
- **Q:** *Claim*, *Call*, *Text first response*, *Schedule visit*, *Mark not-a-fit*.
- **Role-aware:** Sales lead sees pool + balance; rep sees only their queue + claimable; exec sees aging.

### 1.2 Active opportunity progression

- **Trigger:** Lead converted to opportunity / quote requested.
- **Primary actions:** Site measure → design request → quote build → proposal sent → follow-up → close.
- **Bottlenecks:**
  - Opportunities stall after proposal sent (no automatic nudge).
  - Sales doesn't know designer is blocked on selections.
  - Quote revisions lose version history.
- **Urgency states:**
  - `R`: stalled > 5 days at any stage with no logged activity.
  - `Y`: stalled 3–5 days OR quote expires within 48 hr.
  - `G`: activity within 48 hr.
- **Notifications:** Daily digest of stalled deals; instant when designer/builder hands back.
- **AI-assist:**
  - `[D]` "Why is this stalled?" inferred reason from last activity.
  - `[D]` Follow-up message tailored to last touchpoint.
  - `[S]` Close-probability score per stage.
- **CC:** Pipeline value by stage, stalled-count, conversion velocity.
- **D-sales:** Stage kanban with stall flags; "needs my action" list at top.
- **Q:** *Send follow-up*, *Request design update*, *Mark won/lost*, *Push to designer*.

### 1.3 Won → handoff to design/build

- **Trigger:** Opportunity marked won OR deposit received.
- **Primary actions:** Confirm scope frozen → assign designer/PM → schedule kickoff → archive sales notes.
- **Bottlenecks:** Tribal knowledge in sales rep's head not transferred; selections still in flux.
- **Urgency states:** `R` if no handoff within 24 hr of deposit.
- **Notifications:** Designer + PM + customer all notified on handoff complete.
- **AI-assist:** `[D]` Handoff packet draft from sales notes, call transcripts, quote line items.
- **CC:** Handoff age, missing-handoff list.
- **Q:** *Generate handoff packet*, *Assign PM*.

---

## 2. Designer workflows

### 2.1 Selections & specification

- **Trigger:** Project handed off OR customer adds change request.
- **Primary actions:** Pull customer brief → pick products from catalog → check stock/lead time → present options → confirm selections → lock spec.
- **Bottlenecks:**
  - Stock data stale → designer specs unavailable items.
  - Multiple product variations make presentation slow.
  - Customer indecision loops with no closure forcing function.
- **Urgency states:**
  - `R`: install date < 3 weeks AND selections incomplete.
  - `Y`: customer hasn't responded to options in 5 days.
  - `G`: selections locked.
- **Notifications:** Designer notified when stock changes for spec'd items; customer reminder cadence configurable.
- **AI-assist:**
  - `[S]` "Closest in-stock match" when chosen item lead time threatens install.
  - `[D]` Selection presentation auto-generated as PDF/web.
  - `[A]` Lead-time recompute when vendor ETA changes.
- **CC:** Projects blocked on selections, install dates within 21 days lacking spec.
- **D-design:** "Awaiting customer", "Awaiting me", "Stock-risk" buckets.
- **Q:** *Send selection link*, *Lock spec*, *Swap to in-stock*, *Request vendor ETA*.

### 2.2 Revisions & change orders

- **Trigger:** Customer or builder requests change post-lock.
- **Primary actions:** Capture delta → impact analysis (price, lead time, install date) → quote change order → get sign-off → propagate.
- **Bottlenecks:** Change impact propagation is manual — easy to miss build/PM/warehouse.
- **AI-assist:** `[A]` Auto-fan-out delta to affected schedules and quotes.
- **CC:** Open change orders, value at risk.

---

## 3. Builder workflows

### 3.1 Job kickoff → install

- **Trigger:** Spec locked AND materials ETA confirmed.
- **Primary actions:** Schedule crew → confirm site readiness → receive materials → install → punch list → sign-off.
- **Bottlenecks:**
  - Crew arrives, material short.
  - Site not ready (other trades behind).
  - Punch list captured on paper, lost.
- **Urgency states:**
  - `R`: install scheduled within 48 hr AND any material not received OR site-readiness unconfirmed.
  - `Y`: any blocker logged.
  - `G`: all green-lit.
- **Notifications:** Morning-of crew dispatch summary; instant alert on blocker creation.
- **AI-assist:**
  - `[A]` Pre-install readiness check across materials, crew, site, customer confirmation.
  - `[D]` Punch-list voice-to-task on mobile.
- **CC:** Today's installs with go/no-go status; weekly install heatmap.
- **D-build:** Today, This week, Blocked, Punch-list open.
- **Q:** *Mark site ready*, *Report blocker*, *Add punch item*, *Sign-off*.
- **M:** Voice punch-list, photo capture tied to job.

### 3.2 Daily field reporting

- **Trigger:** End of crew day.
- **Primary actions:** Hours, % complete, photos, blockers, tomorrow's plan.
- **Bottlenecks:** Reports skipped under fatigue → exec blind.
- **AI-assist:** `[D]` Auto-draft daily report from photos + scheduled scope; crew confirms in <30s.
- **CC:** Reports-missing list by crew.

---

## 4. Vendor management workflows

### 4.1 PO lifecycle

- **Trigger:** Spec locked → required materials not in stock.
- **Primary actions:** Generate PO → send → confirm → track ETA → receive → reconcile invoice.
- **Bottlenecks:**
  - ETAs come via email, not parsed into system.
  - Partial shipments confuse status.
  - Vendor invoice mismatch caught late.
- **Urgency states:**
  - `R`: PO ETA breaches install date OR vendor unresponsive > 3 business days.
  - `Y`: ETA within 1 week with no shipping confirmation.
- **Notifications:** ETA-slip alerts to PM and designer immediately.
- **AI-assist:**
  - `[A]` Email parser for vendor ETA/ship confirmations.
  - `[S]` Vendor reliability score (on-time %, defect %, response time).
  - `[D]` Chase-email draft for unresponsive vendors.
  - `[A]` Three-way match: PO, packing slip, invoice.
- **CC:** POs at risk, vendor reliability board, $$ in transit.
- **D-vendor:** Open POs, awaiting confirmation, late, partial.
- **Q:** *Chase vendor*, *Mark received*, *Flag damage*, *Request expedite*.

### 4.2 Vendor onboarding & terms

- Lighter workflow but worth surfacing: net terms, MOQ, lead-time baseline. Tie reliability score back into PO routing — auto-suggest reliable vendor when multiple sourceable.

---

## 5. Quote workflows

### 5.1 Quote build

- **Trigger:** Designer/sales requests quote OR customer asks for pricing.
- **Primary actions:** Pull selections → apply pricing tier → add labor/install → margin check → review → send.
- **Bottlenecks:**
  - Pricing tiers / promos applied inconsistently.
  - Margin floor checks done by memory.
  - PDF generation slow on revision cycles.
- **Urgency states:**
  - `R`: quote held > 24 hr post-request.
  - `Y`: margin under floor and not flagged for approval.
- **AI-assist:**
  - `[A]` Auto-pricing per customer tier; promo eligibility check.
  - `[S]` Margin guard — block send if below threshold without override.
  - `[D]` Cover note tailored to customer history.
  - `[A]` Version diff between revisions.
- **CC:** Open quotes by stage, expiring this week, margin outliers.
- **D-sales/design:** "Quotes I'm waiting on", "Quotes customer hasn't opened".
- **Q:** *Send*, *Revise*, *Convert to order*, *Mark expired*.

### 5.2 Quote → order conversion

- **Trigger:** Customer accepts; deposit logged.
- Primary AI move: `[A]` reserve inventory and trigger PO generation for non-stock SKUs the moment quote accepts. Removes a 1–3 day silent gap.

---

## 6. Inventory workflows

### 6.1 Daily stock truth

- **Trigger:** Continuous (receive, pick, return, cycle count, install consumption).
- **Bottlenecks:**
  - Reservations vs. on-hand vs. available not differentiated.
  - "Phantom stock" — physical exists but allocated, designers don't see truth.
  - Cycle counts run when remembered, not scheduled.
- **Urgency states:**
  - `R`: SKU on a job within 14 days has available < required.
  - `Y`: SKU below reorder point.
- **AI-assist:**
  - `[A]` ABC classification + dynamic reorder points based on velocity.
  - `[S]` Anomaly detection for unexplained stock drift.
  - `[A]` Auto-reserve on quote-accept, auto-release on quote-expire.
- **CC:** Stock-risk by upcoming installs; aged inventory $$.
- **D-warehouse:** Receive queue, putaway, pick list, count list.
- **Q:** *Receive PO*, *Cycle-count this bin*, *Report damage*, *Reserve for job*.

### 6.2 Reorder & replenishment

- **Trigger:** Available drops below reorder point OR forecast indicates breach.
- **AI-assist:** `[D]` Drafts PO at preferred vendor; PM confirms.
- **CC:** Reorder queue value; coverage days by category.

---

## 7. Customer follow-up workflows

### 7.1 Active-deal nudges

- See §1.2 — covered.

### 7.2 Post-install satisfaction & referrals

- **Trigger:** Job sign-off + N days.
- **Primary actions:** Satisfaction check → review request → referral ask → warranty registration.
- **Bottlenecks:** Manual cadence is the first thing dropped under load.
- **AI-assist:**
  - `[A]` Cadence engine: 24 hr, 7 day, 30 day, 1 yr.
  - `[D]` Personalized message referencing actual project.
  - `[S]` Sentiment analysis on response → routes to recovery flow if negative.
- **CC:** NPS trend, review velocity, recovery cases.
- **Q:** *Send review link*, *Open recovery ticket*.

### 7.3 Warranty & service

- **Trigger:** Customer-reported issue post-install.
- **Bottlenecks:** Service tickets fall between sales and build with no owner.
- **Urgency states:** `R` if no first-response in 24 hr.
- **CC:** Open service tickets, aging, recurring SKUs (quality signal).

---

## 8. Rep workflows (sales + design hybrid; field-mobile)

- **Trigger:** Rep starts day OR enters geofence at job/showroom/customer site.
- **Primary actions:** Today's plan → on-site capture (photos, measurements, voice notes) → quick quote → schedule next.
- **Bottlenecks:** Re-keying field notes back at desk; lost photos; calendar drift.
- **AI-assist:**
  - `[D]` Voice-to-structured-note (turns ramble into measurements + selections + next-step).
  - `[A]` Geofenced auto-checkin to job record.
  - `[S]` "What did you forget?" prompts (deposit not collected, measurement missing).
- **D-rep / M:** Today's stops, current job context, quick-quote, capture.
- **Q:** *Start visit*, *Capture measure*, *Quick quote*, *End visit (auto-summary)*.

---

## 9. Daily executive workflows

- **Trigger:** Daily AM, EOD, on-demand.
- **Primary actions:** Read state of business → unblock → set priority calls.
- **Bottlenecks:** Five tabs, four tools, one spreadsheet. By the time picture is assembled, the day is half-gone.
- **What exec actually needs (one screen):**
  - Pipeline $$ + change vs. yesterday.
  - Today's installs go/no-go.
  - Stalled deals > $X.
  - POs at risk threatening install dates.
  - Inventory red SKUs.
  - Cash-in vs. plan (deposits, milestones, AR aging top 5).
  - 3 things the system thinks need exec attention.
- **AI-assist:**
  - `[D]` Morning brief: 5 bullets, "what changed, what's at risk, what to decide today".
  - `[S]` "Top 3 to look at" inferred from variance and stall signals.
  - `[D]` EOD digest: wins, slips, tomorrow's pivots.
- **CC:** Single executive surface — this *is* the command center.
- **Q:** *Ack brief*, *Assign owner*, *Escalate*, *Snooze with reason*.

---

## 10. Warehouse workflows

- **Trigger:** Inbound truck, outbound install, cycle count, return.
- **Primary actions:** Receive → inspect → putaway → pick → stage → load.
- **Bottlenecks:**
  - Paper pick lists; mismatched SKU labels.
  - Damage discovered at install, not at receive.
  - Staging area collisions for same-day jobs.
- **Urgency states:** `R` for any pick that supports an install within 48 hr that's incomplete.
- **AI-assist:**
  - `[A]` Pick-path optimization for the day.
  - `[S]` Photo-based damage flag at receive (anomaly detection).
  - `[A]` Stage-zone assignment by install date proximity.
- **D-warehouse / M:** Receive, Putaway, Pick, Stage, Load — five tiles.
- **Q:** *Scan in*, *Photo damage*, *Confirm picked*, *Load truck*.

---

## 11. AI-assist workflows (cross-cutting)

The system should treat AI as an **operator**, not a feature. Standing AI duties:

- **Inbox triage** `[A]/[D]`: parse vendor + customer email/SMS into typed events (ETA, complaint, question, approval, payment).
- **Drafting** `[D]`: any outbound communication starts as an AI draft anchored on context (project, history, tone).
- **Anomaly watch** `[S]`: stock drift, margin outliers, stalled stages, vendor reliability slips.
- **Summarization** `[D]`: handoff packets, daily briefs, EOD digests, post-mortems.
- **Search** `[A]`: "Where did we use this SKU?" "Which jobs use vendor X?" "Recent customers in zip Y?"
- **Routing** `[A]`: lead → rep, PO → vendor, ticket → owner, change order → impacted parties.

Design rule: AI suggestions are **first-class objects** with a one-tap accept/reject and a feedback loop, not modal popups.

---

## 12. Escalation workflows

- **Trigger:** Any urgency state hits `R` with no human action in defined window.
- **Pattern:** Owner → owner's lead → operations → exec, each with a window.
- **Bottlenecks:**
  - Today escalation = "someone yells in chat".
  - No record of why escalation happened or how resolved.
- **AI-assist:**
  - `[A]` Auto-escalate by rule.
  - `[D]` Escalation note with context, attempts made, recommended action.
- **CC:** Live escalation feed; weekly escalation pattern review (which workflow keeps escalating?).
- **Q:** *Take over*, *Acknowledge*, *Snooze with reason*, *Resolve with note*.

---

## 13. Priority / urgency workflows

Centralize how the system decides what's hot.

- **Inputs:** install-date proximity, $$ value, customer tier, age-in-stage, vendor risk, stock risk, exec-flagged.
- **Output:** single `priority_score` per object, mapped to G/Y/R bands.
- **Why central:** every dashboard sorts by this; every notification gates on this; every escalation triggers off this.
- **Bottleneck removed:** today, prioritization is in heads. Tomorrow, it's in one ranking the team can argue with.
- **AI-assist:** `[S]` "Why is this red?" — system explains the contributing factors.
- **CC:** Top-10 red list, sortable.
- **Q:** *Pin*, *Snooze*, *Reassign*.

---

## 14. Operational handoff workflows

Handoffs are where AccentOS wins or loses. Pattern is universal:

- Sales → Design (won)
- Design → Build (spec locked)
- Build → Customer (sign-off)
- Vendor → Warehouse (receive)
- Warehouse → Crew (stage/load)
- Anyone → Service (issue reported)

**Each handoff requires:**

1. A definition of "ready" (checklist the system can compute).
2. A receiver assigned before sender can complete.
3. A packet (auto-generated context summary).
4. An ack from receiver within SLA.

**Bottlenecks:** Today, handoffs are *implicit* — a chat ping. Tomorrow, they're a typed event with a contract.

**AI-assist:** `[D]` packet generation, `[A]` readiness check, `[A]` receiver auto-assignment.

**CC:** Open handoffs, ack-pending, breached.

---

## 15. Mobile quick-action workflows

Mobile is not a shrunk dashboard. It's a **verb surface**.

Top quick actions per role (single tap, no scroll):

- **Sales:** Claim lead, Call, Text drafted reply, Schedule visit, Mark won.
- **Designer:** Send selection link, Lock spec, Swap to in-stock, Request ETA.
- **Builder:** Mark site ready, Report blocker, Add punch item, Sign-off.
- **Vendor PM:** Chase vendor, Mark received, Flag damage, Request expedite.
- **Warehouse:** Scan in, Photo damage, Confirm picked, Load truck.
- **Rep (field):** Start visit, Capture measure, Voice note, Quick quote.
- **Exec:** Read brief, Ack, Escalate, Assign.

**Pattern:** every quick action emits a typed event the orchestrator can react to. No "open form, fill 8 fields, submit". Mobile = verbs; desktop = composition.

---

# Cross-cutting design principles (carry into shell)

1. **One priority score**, not five competing dashboards.
2. **Handoffs are first-class events**, not chat messages.
3. **AI suggestions are objects** with accept/reject/feedback, not popups.
4. **Mobile = verbs, desktop = composition.**
5. **Urgency is computed, not declared** — ops can't lie to themselves.
6. **The exec command center is the orchestrator's UI** — what's red for the system is red for the human.
7. **Every workflow emits typed events** — orchestration visibility comes free.
8. **No surface without a workflow** — if a card on a dashboard doesn't map to a workflow above, it doesn't ship.
