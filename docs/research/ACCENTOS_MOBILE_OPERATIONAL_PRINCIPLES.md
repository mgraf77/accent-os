# AccentOS Mobile Operational Principles
> **Status:** Planning only — design constitution  
> **Date:** 2026-05-08  
> **Authority:** This document defines the long-term mobile design philosophy for AccentOS.  
> **All future mobile decisions should be evaluated against these principles.**

---

## THE FOUNDATIONAL PREMISE

> AccentOS on mobile is an operational tool used during active work, not during leisure time.  
>  
> Michael uses AccentOS on his iPhone in the middle of customer conversations, while walking the showroom floor, while on a jobsite, while following up with a rep on a phone call, and while managing multiple concurrent priorities.  
>  
> This is the usage reality. Every design decision must be measured against it.

Mobile consumer UX optimizes for engagement, delight, and discovery. AccentOS mobile UX optimizes for **speed of execution**, **continuity of focus**, and **minimum time to completion**.

These are fundamentally different goals. When in doubt: **choose speed over beauty, clarity over cleverness, and robustness over elegance.**

---

## PRINCIPLE 1 — TASK-CENTRIC, NOT TABLE-CENTRIC

### The Principle

The mobile experience is organized around **what needs doing**, not around data tables.

### What It Means

The question AccentOS mobile must answer at every moment is:
> *"What should I do right now?"*

Not:
> *"Which module do I want to look at?"*

A table-centric interface makes the user navigate to data and decide what to do with it. A task-centric interface tells the user what requires attention and puts the action one tap away.

### In Practice

| Table-centric (avoid) | Task-centric (target) |
|---|---|
| Navigate to Vendors → filter by low score → decide to score | "3 vendors need scoring this quarter — tap to begin" |
| Navigate to Pipeline → find deals without activity → investigate | "Stonebridge deal: no contact in 14 days — tap to review" |
| Navigate to Co-op → filter by deadline → find urgent ones | "Co-op deadline in 3 days: Progress Lighting $1,200 — tap to file" |
| Navigate to Quotes → find pending → open → approve | "Quote #51 over $5K pending approval — tap to review" |

### Application

The Daily Brief is the primary implementation of task-centric design. On mobile, it must be the default landing screen, must lead with non-zero action items, and must provide one-tap access to the relevant record for every displayed item.

Every new module should ask: "What is the mobile tile for this module in the Daily Brief?" before asking "What does the full module look like on mobile?"

---

## PRINCIPLE 2 — THUMB-ZONE FIRST

### The Principle

Every primary action is placed in the bottom 50% of the screen. The top 30% is read-only.

### What It Means

Michael holds his iPhone 13 Pro Max one-handed, right thumb as primary pointer. The natural thumb arc reaches the bottom two-thirds of the screen with no grip adjustment. The top quarter of the screen requires a grip shift, increasing miss rate and cognitive interruption.

```
SCREEN MAP (Portrait, iPhone 13 Pro Max, 428×926px)

████████████████████ ← TOP (0–250px): Read-only zone
█ Status, headers  █    Titles, breadcrumbs, status badges
█ Page title       █    Module name, last-updated timestamps  
████████████████████    DO NOT put tappable actions here

████████████████████ ← MIDDLE (250–550px): Stretch zone
█ Content, cards   █    Data tables, cards, lists
█ Secondary action █    Secondary buttons, filters
████████████████████    Acceptable for important but infrequent actions

████████████████████ ← BOTTOM (550–926px): Thumb zone
█ Primary actions  █    Most important CTAs
█ Navigation tabs  █    Module-switching navigation
█ [Home indicator] █    env(safe-area-inset-bottom)
████████████████████    ALL primary actions live here
```

### In Practice

- Primary navigation: bottom tab bar (5 tabs)
- Primary action buttons (New Quote, Add Deal, Score Vendor): bottom of content area or floating button
- Modals and forms: bottom-anchored sheets, not top-centered overlays
- Confirmation dialogs: two large buttons anchored to the bottom of the sheet
- Search/filter: top bar is acceptable (rarely tapped; usually typed into)
- Status indicators and labels: top area acceptable (read-only)

### The Override Rule

If a design ever places a frequently-used action in the top 30% of the screen, the design must be revised before shipping. No exceptions.

---

## PRINCIPLE 3 — RAPID ACTION EXECUTION

### The Principle

The number of taps from "intent" to "completed action" must be 3 or fewer for any primary workflow.

### What It Means

Every time a workflow requires more than 3 taps, it creates a pause where Michael must redirect his attention from the customer, conversation, or task in front of him. Three taps is the threshold for "can be done without breaking focus." Four or more taps requires full focus re-allocation.

### Tap Budget by Action Type

| Action | Maximum tap count | Target tap count |
|---|---|---|
| Navigate to a module | 1 (bottom nav tab) | 1 |
| Open a specific deal/quote/vendor | 2 (tab → row tap) | 2 |
| Update a vendor score | 2 (long-press row → swipe → score input) | 3 |
| Create a new quote | 3 (tab → new → first field) | 3 |
| Mark a task complete | 1 (swipe or tap checkbox) | 1 |
| File a coop claim from alert | 2 (Daily Brief tile → action button) | 2 |
| Add a quick note to a deal | 3 (tab → deal → note field tap) | 3 |

### Workflow Audit Trigger

If implementing a mobile feature and the primary action takes > 3 taps, **stop and redesign before shipping**. Common fixes:
- Deep link from Daily Brief tile directly to the action (skips navigate → find → tap)
- Long-press row to reveal actions (eliminates tap-to-open intermediate step)
- Pre-fill forms with context from the entry point (eliminates data entry taps)

---

## PRINCIPLE 4 — MINIMAL COGNITIVE LOAD

### The Principle

AccentOS mobile must minimize the amount of information Michael must hold in working memory to complete a task.

### What It Means

Cognitive load is the enemy of operational efficiency. When Michael is in a customer conversation and checks AccentOS, he has:
- The conversation context in working memory
- The customer's needs in working memory
- The task he came to AccentOS to do

AccentOS must not add a fourth thing. Every unclear label, every ambiguous state indicator, every modal that requires reading before acting — these all add cognitive load.

### In Practice

| High cognitive load (avoid) | Low cognitive load (target) |
|---|---|
| Show all modules equally in navigation | Surface only what has pending action |
| Neutral status indicators (greyed-out badges) | Color-coded, count-based urgency cues |
| Action buttons with generic labels ("Submit", "Update") | Specific labels ("Score this vendor", "Approve quote", "File coop") |
| Form validation only on submit | Real-time validation as user types |
| Long form with all fields visible | Progressive disclosure — required fields first, optional collapsed |
| Full vendor list to scroll | Pre-filtered to "needs attention" by default |
| Decision Engine surface as neutral table | Decision Engine surface with explicit recommended action per row |

### The "One-Screen Rule"

Every mobile screen must answer one primary question. If a screen is trying to answer two questions simultaneously, split it. The Daily Brief answers "What needs attention today?" The Pipeline module answers "What is the state of my deals?" Each screen has a single operational purpose.

---

## PRINCIPLE 5 — OPERATIONAL DENSITY BALANCE

### The Principle

Show enough information to make a decision without requiring a second tap. Show no more than necessary.

### What It Means

Mobile operational tools fail in two opposite directions:
1. **Too sparse**: forces additional taps to get the information needed to act (extra cognitive burden, more time)
2. **Too dense**: overwhelming, hard to scan, small touch targets, high error rate

The right density for AccentOS mobile is **enough to decide, not enough to drown**.

### Information Hierarchy Per Row

Every list row in AccentOS mobile should answer: who/what + status + urgency, without needing to tap.

```
┌────────────────────────────────────────────┐
│ Vendor Name / Deal Name         [STATUS]   │ ← Identity + current state
│ Secondary context (score, $, stage)  [AGE] │ ← Enough to decide if action needed
└────────────────────────────────────────────┘
```

Not:
```
┌────────────────────────────────────────────┐
│ Vendor Name                                │ ← Identity only; useless without tap
└────────────────────────────────────────────┘
```

Not:
```
┌────────────────────────────────────────────┐
│ Vendor Name    Score  Weight  Weighted  %  │ ← Full scoring breakdown in a list row
│ Category 1: 7  Cat 2: 8  Cat 3: 6  ...    │ ← Requires scrolling to read; too dense
└────────────────────────────────────────────┘
```

### Touch Target Minimums

No interactive element on mobile may be smaller than 44×44px. This is Apple's HIG minimum and reflects the physical accuracy of thumb-based interaction.

Current AccentOS interactive elements are designed for cursor precision (10–20px targets). All must be audited and expanded for mobile.

---

## PRINCIPLE 6 — INTERRUPT-DRIVEN WORKFLOW

### The Principle

AccentOS mobile is used in bursts, interrupted frequently. Design for partial sessions, not continuous sessions.

### What It Means

A desktop session might be 30–60 minutes of focused work. A mobile AccentOS session is:
- 30 seconds while a customer considers options
- 2 minutes between appointments to check the Daily Brief
- 45 seconds to pull up a quote for a phone call
- 5 minutes on a break to score vendors while freshly reviewing a presentation

These sessions are **interrupted at any point** — a customer walks in, a call comes in, an employee asks a question. AccentOS mobile must survive interruption gracefully.

### Design Implications

**State persistence:** Partially entered forms must be auto-saved to `localStorage`. If Michael is building a quote and a customer needs attention, he should be able to leave AccentOS, return in 10 minutes, and see his quote exactly as he left it.

**Instant context restore:** On app open, the last-viewed module should be the default (or the Daily Brief if no prior context). Never open to a blank loading state.

**No fragile multi-step flows:** If a workflow requires completing step 1, then step 2, then step 3 in sequence — and interruption between steps is fatal — that workflow needs a draft/autosave mechanism.

**Pull-to-refresh, not auto-refresh:** Auto-refresh during an interrupt is disorienting (new data appears, context shifts, items disappear). Refresh only when Michael explicitly requests it.

---

## PRINCIPLE 7 — URGENCY-AWARE INTERFACE

### The Principle

The interface surfaces urgency proactively. Michael should never have to hunt for what is time-sensitive.

### What It Means

Operational tools fail when urgent items are visually indistinguishable from routine items. A co-op deadline in 3 days should look different from a co-op deadline in 90 days. A deal at risk should look different from a deal on track.

### Urgency Encoding System

AccentOS already uses color-coded badges and status indicators. On mobile, these must be:
- **Visible without tapping** — urgency is a glanceable property, not a detail view property
- **Consistent** — the same color means the same urgency level everywhere in the app
- **Numeric** — "3 items need attention" is clearer than a red dot

| Urgency level | Visual treatment | When to use |
|---|---|---|
| Immediate (today/overdue) | Red badge + count | Overdue deadlines, flagged risk items |
| Upcoming (this week) | Yellow badge + count | Deadlines within 7 days, at-risk items |
| Routine (this month) | Blue badge + count | Regular attention items |
| Informational (no action) | Grey indicator | Status-only items, FYI |

### The Daily Brief Urgency Ladder

Daily Brief tiles must be sorted by urgency: immediate → upcoming → routine. An empty tile (zero count) should be hidden to reduce clutter. The first thing Michael sees when opening the app should be the highest-urgency item, not a balanced overview.

---

## PRINCIPLE 8 — SHOWROOM USAGE ASSUMPTIONS

### The Principle

The primary mobile context is the showroom floor. Design for the specific constraints of that environment.

### Showroom Context Profile

- **Ambient noise:** High (HVAC, customers, music, demo products)
- **Lighting:** Variable (showroom display lighting can create screen glare)
- **Posture:** Standing, walking, one-handed, often while carrying samples or walking alongside a customer
- **Attention:** Divided — AccentOS is checked while maintaining customer conversation
- **Time pressure:** High — customer is waiting
- **Network:** Showroom WiFi (generally reliable but variable near the perimeter/warehouse)

### Design Decisions Driven by Showroom Context

**Large touch targets:** Standing while walking creates micro-vibration; tap accuracy is lower than when seated. 44px minimum, prefer 52px+ for primary actions.

**High contrast required:** Showroom lighting can create screen glare. Text must have sufficient contrast ratio (WCAG AA at minimum) and font size must be readable without squinting (≥ 15px body, ≥ 13px secondary).

**No tiny text anywhere:** 11px labels that are fine on desktop are unreadable standing under display lighting.

**Fast load is non-negotiable:** A 3-second load while a customer waits is 3 seconds of lost focus and professionalism. Target < 1.5s to interactive on WiFi.

**Error states are brief and actionable:** "Failed to load — pull to retry" not a multi-line error with a stack trace or a technical description.

**Audio/vibration not relied upon:** Showroom is loud. Any notification or confirmation that relies on audio must also have a visual component.

---

## PRINCIPLE 9 — ONE-HANDED OPERATION

### The Principle

AccentOS mobile must be fully operable with one hand (right hand, thumb-operated) without any grip adjustment required for primary workflows.

### What This Rules Out

- Navigation items at the top of the screen (requires grip shift or Reachability)
- Small "X" close buttons in the top-right corner of modals (requires two-hand or Reachability)
- Toggle switches or checkboxes positioned at the top of long lists
- Drag handles on panels that are above the thumb zone

### What This Requires

- Bottom tab navigation with thumb-reachable tabs
- Bottom sheets that can be dismissed by swiping down (not tapping X at top)
- Action buttons anchored to the bottom of forms and sheets
- Swipe-to-reveal for row actions (swipe left to see Edit/Delete — no need to tap into a row)
- Large tap targets for the most common actions

### The Grip-Shift Test

Before shipping any mobile UI element, apply the grip-shift test:

> Hold your iPhone 13 Pro Max in your right hand, one-handed, in a relaxed grip. Attempt to interact with the UI element using only your right thumb. If it requires:
> - Shifting your grip
> - Using your other hand
> - Using iOS Reachability (double-tap home area to pull screen down)
>  
> ...then it fails the test. Redesign its position or size.

---

## PRINCIPLE 10 — FIELD-WORK USAGE ASSUMPTIONS

### The Principle

Periodic use occurs outside the showroom — on jobsites, in meetings, while traveling. Design for these contexts as secondary scenarios.

### Field Context Profile

- **Network:** Cellular only (LTE); possible dead zones on some jobsites
- **Posture:** Various — seated in a car, standing on a construction site, in a meeting room
- **Environment:** Outdoor glare possible; variable ambient conditions
- **Use case:** Checking a PO status, looking up a product spec, creating a quick note, reviewing a quote before presenting

### Field-Specific Design Decisions

**Offline shell required:** The app must not show a blank screen if cellular is spotty. The shell loads from cache; the data request shows a graceful loading/retry state.

**Critical read operations before critical meetings:** If Michael needs to look up a spec or quote before entering a meeting, the app must load fast enough to get the data before he goes inside. < 2s on LTE is the target.

**Minimal data input:** Field use is not the time for complex form entry. Quick note creation, score updates, status flags — yes. Full quote creation on a construction site — design for it but don't optimize for it.

**No reliance on keyboard for navigation:** On a jobsite, Michael may not want to type. Primary navigation must be entirely tap/swipe-based with no required text input.

---

## DESIGN DECISION CHECKLIST

When evaluating any proposed mobile feature or UX change, answer all of these:

**Task-centricity:**
- [ ] Does this surface what needs action, or does it surface data that the user must interpret?
- [ ] Can a user determine whether action is needed without tapping into a detail view?

**Thumb-zone:**
- [ ] Is the primary action in the bottom 50% of the screen?
- [ ] Does the element pass the one-handed grip-shift test?
- [ ] Are all tap targets ≥ 44px?

**Rapid action:**
- [ ] Is the primary workflow completable in ≤ 3 taps?
- [ ] If > 3 taps: is there a deep link, swipe gesture, or pre-fill that reduces the count?

**Cognitive load:**
- [ ] Does each screen answer exactly one operational question?
- [ ] Are action button labels specific ("Score this vendor") not generic ("Submit")?
- [ ] Is urgency visually apparent without reading secondary text?

**Interrupt resilience:**
- [ ] If the user leaves mid-workflow and returns in 10 minutes, does state restore?
- [ ] Does the app load instantly enough to use during a brief break?

**Showroom/field survivability:**
- [ ] Does the feature work on spotty showroom WiFi?
- [ ] Does the feature work on cellular only?
- [ ] Does the feature fail gracefully (not blank screen) if the network drops?
- [ ] Is all text readable at arm's length under glare?

**Desktop coexistence:**
- [ ] Is the mobile change isolated via media query or feature flag?
- [ ] Has desktop been tested at 1440px with no regressions?

---

## ANTI-PATTERNS (NEVER DO)

These patterns are prohibited in AccentOS mobile UX:

| Anti-pattern | Reason |
|---|---|
| Auto-playing animations or transitions that run continuously | Battery drain; distraction |
| Toast notifications that require user tap to dismiss | User is focused on primary task; auto-dismiss at 3s |
| Pagination on mobile (tap "Next page" to see more) | Use infinite scroll or load-more-on-scroll |
| Full-screen modals that can't be dismissed by swipe | Bottom sheets must be swipe-dismissable |
| "Are you sure?" confirmation dialogs for minor actions | Reserve for destructive/irreversible operations only |
| Loading spinners with no timeout fallback | Always show an empty state after > 5s wait |
| Error messages with technical jargon | "Something went wrong — pull to retry" not error codes |
| Requiring form completion before saving a draft | Auto-save partial state; never trap the user |
| Color as the only indicator of urgency | Always pair color with a count, icon, or label |
| Navigation items that open in a new browser tab | Breaks the standalone PWA context |
| Scroll-jacking or overriding native scroll momentum | Violates iOS interaction model; disorienting |
| Disabling the iOS pinch-to-zoom on forms | Required for accessibility; some users need it |

---

## VERSION HISTORY

| Date | Change |
|---|---|
| 2026-05-08 | Initial version created from mobile PWA research |

*This document should be revisited and updated as AccentOS mobile usage patterns are observed in production. These principles are grounded in the current understanding of Michael's usage context — they should evolve as that context is better understood.*
