# AccentOS — Operational State Model

**Mode:** Workflow systems design (no implementation)
**Anchors:** workflows, event/handoff schema, priority system, AI suggestion model
**Purpose:** Define the runtime orchestration-state spine — the named modes the system (and the operator's experience of it) operates in.

---

## 0. Why state matters

The same screen should *behave differently* depending on what the operator is doing. Not skinning, not toggling — actual orchestration shifts: what's surfaced, what notifies, what AI is allowed to do, what the dashboard prioritizes. Without named states, every feature re-invents these decisions inconsistently.

Operational state is **per-session × per-role**, but its inputs and effects are global and observable.

---

## 1. The nine states

`Normal`, `Focus`, `Urgent`, `Escalated`, `Blocked`, `Read-Only`, `Mobile Quick Mode`, `Executive Review`, `AI Assist`.

States are **not mutually exclusive** at the system level (the warehouse can be `Urgent` while an exec is in `Executive Review`), but each session resolves to a primary state at any moment for UX purposes. Some pairs compose (e.g. `Mobile Quick Mode` + `Urgent`).

---

## 2. Per-state model

### 2.1 Normal

- **Triggers:** default; no overriding condition.
- **UX:** standard density, full feature set, normal notification cadence.
- **Workflow:** all handoffs available; nothing suppressed.
- **Notifications:** banded normally (Y digest, R instant).
- **Escalation:** standard timers.
- **Dashboard:** full layout; sort by `priority_score`.
- **Command center:** full visibility.

### 2.2 Focus

- **Triggers:** user-invoked ("focus on this job") OR system-suggested when an operator picks up a high-`priority_score` task.
- **UX:** other queues collapsed, only the focused subject + its dependencies visible; non-critical notifications muted.
- **Workflow:** quick-actions for the focused subject promoted; cross-subject actions still possible but require an extra step.
- **Notifications:** only `R` and same-subject events break through.
- **Escalation:** unchanged (escalations don't respect focus).
- **Dashboard:** single-subject hero layout; related items as a side rail.
- **Command center:** unaffected (CC is its own session).

### 2.3 Urgent

- **Triggers:** the role's queue contains an `R` subject the operator owns OR a fresh `escalation.opened` arrives in their tier.
- **UX:** red header band, red items pinned to top, AI assist promoted.
- **Workflow:** quick-actions for the red subjects elevated; lower-priority work greyed (not blocked).
- **Notifications:** instant for related events; quiet hours overrideable for severity-1 only.
- **Escalation:** clocks visible.
- **Dashboard:** "Top reds" hero; everything else demoted.
- **Command center:** mirrors red-list; CC is implicitly always-Urgent-aware.

### 2.4 Escalated

- **Triggers:** the operator is the next-tier owner for an open `escalation`.
- **UX:** different from `Urgent` — the operator may not own the subject, just the escalation. Surfaces the *escalation* object, with the underlying subject linked.
- **Workflow:** ack, take-over, reassign, resolve-with-note are the headline verbs.
- **Notifications:** instant; escalations bypass standard quiet rules per tier policy.
- **Escalation:** the operator *is* the escalation; no further escalation in this session unless their tier-ack lapses.
- **Dashboard:** escalation feed as primary; subject details in a secondary pane.
- **Command center:** highlights tier ownership; weekly pattern review surface accumulates these.

### 2.5 Blocked

- **Triggers:** the operator's current subject has an unmet dependency they cannot resolve (waiting on customer, vendor, designer, etc.).
- **UX:** the system shows *what they're waiting on* and *who has it now* — no false promise of action.
- **Workflow:** quick actions are limited to "nudge" / "escalate wait" / "switch to next". Actively guides the operator off the dead-end.
- **Notifications:** wake on the awaited event.
- **Escalation:** wait-aging produces gentle nudges, not red.
- **Dashboard:** "What you're waiting on" + "What you can do instead" pair.
- **Command center:** aggregate "blocked $$ value" tile.

### 2.6 Read-Only

- **Triggers:** historical view, archived subject, audit drill-down, or session lacks write authority for this subject.
- **UX:** explicit read-only banner; no quick-action verbs visible.
- **Workflow:** no events emittable from this view; comments / annotations may still be allowed if scoped.
- **Notifications:** suppressed for this subject (you are observing, not owning).
- **Escalation:** none.
- **Dashboard:** locked layout.
- **Command center:** unchanged; CC is always at least read on everything.

### 2.7 Mobile Quick Mode

- **Triggers:** mobile session OR explicitly invoked compact mode.
- **UX:** verb-first layout. Top of screen = today's actionable list; tap = act, not "open a record".
- **Workflow:** every common workflow has a mobile path that emits a typed event in ≤2 taps + optional voice/photo.
- **Notifications:** push-first; SMS fallback for severity-1 if push fails.
- **Escalation:** can ack escalations from mobile.
- **Dashboard:** five-tile max per role; everything else behind a single "more".
- **Command center:** has a mobile variant — top reds + ack + assign verbs. No spreadsheets on phones.
- **Composition:** combines naturally with `Urgent` (urgent reds float to top), `Focus` (single subject), and `AI Assist` (drafts surface as preview cards).

### 2.8 Executive Review

- **Triggers:** exec session OR scheduled brief moment (AM/EOD).
- **UX:** the morning-brief / EOD digest is the primary surface, not the underlying queues. One screen, scannable.
- **Workflow:** verbs are *ack*, *assign*, *escalate*, *snooze with reason*, *open subject*. Not *edit*.
- **Notifications:** aggregated; only severity-1 interrupts.
- **Escalation:** exec is the terminal tier — must always have a path to ack.
- **Dashboard:** the executive command-center surface is this state's home screen; this state and the CC overlap heavily.
- **Command center:** *is* the dashboard here. The line between "exec dashboard" and "CC" should not exist.

### 2.9 AI Assist

- **Triggers:** operator explicitly invokes AI ("draft", "explain", "suggest", "summarize") OR the AI inbox has items above presentation threshold for this owner.
- **UX:** suggestions appear as first-class objects in the operator's flow — never as modal popups. Accept/reject/defer is one tap, with reason.
- **Workflow:** AI's reach is gated by reversibility and policy class (see AI suggestion doc).
- **Notifications:** AI never pages the operator on its own; it queues.
- **Escalation:** if the operator ignores AI suggestions on a red subject, the suggestion + subject combine into a single escalation object — no double-paging.
- **Dashboard:** "AI suggestions waiting" tile; per-subject AI panel.
- **Command center:** "AI auto-applied actions awaiting verification" + "AI rejection-rate hotspots" tiles.
- **Composition:** layers under any other state — AI is a tool, not a mode by itself for most users.

---

## 3. Composition rules

- **Primary state per session** — the one driving header/density/quick-actions.
- **Layered states** — `AI Assist` and `Mobile Quick Mode` layer under primary states.
- **Precedence (when conflicting):**
  1. `Escalated` (you owe a tier)
  2. `Urgent` (your queue has a red)
  3. `Blocked` (your current subject is waiting)
  4. `Focus` (you opted in)
  5. `Executive Review` (exec session, no other condition)
  6. `Normal`
  - `Read-Only` is a property of the *subject* in view, not the session — it can compose with any.
  - `Mobile Quick Mode` is determined by device/session, composes with everything.
  - `AI Assist` is on/off per surface, composes with everything.

---

## 4. Transitions

- All transitions are **observable** — each emits a session-state event the orchestrator can listen to (telemetry + AI calibration use this).
- **Auto-transitions** happen on: queue red appearing, escalation arriving, subject blocker reported, exec session start, mobile detection, AI inbox crossing threshold.
- **User-initiated transitions** (Focus on/off, manual switch to Read-Only) require zero ceremony — one tap.
- **Sticky states** — `Escalated` and `Urgent` cannot be self-dismissed while their triggering condition is live; the operator can ack, reassign, or resolve, but not "snooze the state".

---

## 5. Cross-cutting effects table

| State | Notifications | Escalation timers | AI auto-apply | Quick-actions |
|---|---|---|---|---|
| Normal | banded | standard | per policy | standard |
| Focus | muted (subject-only) | unchanged | unchanged | subject-promoted |
| Urgent | instant on R | visible | unchanged | red-promoted |
| Escalated | instant tier | tier-tight | suspended on subject | escalation verbs |
| Blocked | wake on awaited | gentle | suggest-only | nudge / switch |
| Read-Only | subject-suppressed | n/a | none | none |
| Mobile Quick | push-first | unchanged | per policy | top-5 verbs |
| Exec Review | aggregated | terminal-tier visible | per policy | ack/assign/escalate |
| AI Assist | AI inbox only | unchanged | active | accept/reject/defer |

---

## 6. Why this becomes the runtime spine

- The shell can ask one question — *what state is this session in?* — and configure surface, notification cadence, and AI behavior coherently.
- No more per-screen rules drifting apart.
- Every state is observable, so the orchestrator (and analytics) can answer "how often are operators in `Blocked`?" — a direct read on operational health.
- New features choose a state-aware behavior; if a feature ignores state, that's a flag.

---

## 7. Anti-patterns

- "Compact mode" toggles unrelated to mobile.
- Per-feature "do not disturb" flags that don't read session state.
- Escalations that don't suppress unrelated AI nags.
- Read-only views that still emit events.
- Exec dashboards that are different from CC.
- Letting `Focus` block escalations.

---

## 8. What this doc deliberately omits

- Visual styling per state.
- Specific timers and thresholds (policy, not architecture).
- Storage / session mechanics.
- Auth scoping for Read-Only — that's a separate access-model doc.
