# PHONE_FIRST_DASHBOARD_CONCEPT.md — AccentOS iPhone Operational Dashboard

> High-level UX concept only. No code. No React. No implementation.
> This defines what Michael sees and taps when he checks the system from iPhone.

---

## CORE CONSTRAINT

Michael checks system state from iPhone GitHub app or Safari.
The interface is whatever GitHub renders + raw text.
There is no custom UI to build for v1.
The "dashboard" IS the STATUS.md file — optimized to render cleanly on a 375px screen.

---

## THE SINGLE SCREEN RULE

Everything Michael needs to triage the system must fit in one iPhone screen
(no scroll) or at most 1.5 screens (one quick scroll to confirm HEALTH).

If Michael has to scroll to find BLOCKED or NEXT ACTION, the design failed.

---

## INFORMATION PRIORITY ORDER (top of screen = most important)

Order based on: "what does Michael look for first when he opens the status file?"

```
1. HEALTH           ← one glance — GREEN / YELLOW / RED
2. BLOCKED          ← is Claude stopped?
3. CURRENT GATE     ← if blocked, what does Michael need to do?
4. WIP              ← what is Claude actually doing?
5. NEXT ACTION      ← what happens next (or what will Claude do on resume)?
6. LAST PUSH        ← proof of work — when did Claude last land something?
7. BRANCH           ← where is the work?
8. QUEUE DEPTH      ← how much is left?
9. SESSION STATE    ← active / frozen / paused?
10. ACTIVE SESSIONS / FROZEN SESSIONS  ← parallel work context
```

---

## PROPOSED STATUS.md TOP-TO-BOTTOM ORDER (phone-optimized)

```
# STATUS — [date] [time]

## HEALTH
[GREEN | YELLOW | RED] — [reason]

## BLOCKED
[NO | YES — reason]

## CURRENT GATE
[NONE | M##: description]

## WIP
[one sentence]

## NEXT ACTION
[one sentence]

## LAST PUSH
[hash] — [message] — [timestamp]

## BRANCH
[branch name]

## QUEUE DEPTH
[N items]

## SESSION STATE
[value]

## ACTIVE SESSIONS
[value]

## FROZEN SESSIONS
[value]
```

This order puts the two binary triage signals (HEALTH, BLOCKED) at the absolute top.
Michael knows within 2 seconds if he needs to act or can put his phone down.

---

## THREE READ MODES

### Mode 1 — Quick Glance (2 seconds)
Michael sees HEALTH color + BLOCKED value.
- GREEN / NO → put phone down, Claude is running
- GREEN / YES → impossible (contradictory — flag as HUD failure)
- YELLOW / NO → optional check-in, no urgency
- YELLOW / YES → look at CURRENT GATE
- RED / YES → action required — read CURRENT GATE immediately

### Mode 2 — Status Check (15 seconds)
Michael reads through WIP + NEXT ACTION + LAST PUSH.
Confirms Claude is making progress and the next step makes sense.
Checks QUEUE DEPTH for rough ETA.

### Mode 3 — Full Triage (60 seconds)
Michael reads every field.
Used when HEALTH = RED, or frozen sessions are stacking up,
or Michael hasn't checked in for >24h.

---

## PHONE UX CONSTRAINTS

### What works on iPhone GitHub app:
- H1 and H2 headers (render as styled text)
- Bold text (`**value**`)
- Single-column content
- Code fences (monospace, no horizontal scroll if <60 chars wide)
- Short ordered and unordered lists

### What breaks or degrades:
- Markdown tables → render inconsistently on narrow viewports, avoid in STATUS.md
- Long lines → force horizontal scroll in some readers
- Nested lists beyond 1 level → visual noise, hard to scan
- Emoji overuse → clutters the scan pattern Michael needs
- H3/H4 → too small at 375px, hard to distinguish from body text

---

## NOTIFICATION SURFACE CONCEPT (v1 — no automation required)

Michael's notification model in v1 is pull-based: he opens STATUS.md when he wants to check.
Push notifications require a CI/monitoring layer (out of scope for MVHB).

v1 trigger for Michael to check STATUS.md:
- He wakes up / switches context
- Claude posts in chat (the chat IS the push mechanism in v1)
- He finishes an M-task and wants to confirm Claude resumed

v2 surface (future, not now):
- GitHub webhook → mobile notification on STATUS.md update
- Or: minimal Cloudflare Worker that watches STATUS.md and sends a push when HEALTH changes

---

## WHAT THE PHONE VIEW DOES NOT NEED (v1)

- Graphs or charts
- Multiple tabs or views
- Interactive elements (buttons, toggles)
- Real-time updates / polling
- Custom domain or hosted UI
- Auth or login (STATUS.md is in the repo — same access as Michael's normal GitHub sessions)
- Any dependency on AccentOS being deployed or running

---

## IDEAL PHONE READ — EXAMPLE INTERACTION

Michael opens GitHub app → navigates to `accent-os` repo → taps `STATUS.md`

He sees:
```
STATUS — 2026-05-09 14:32 UTC

HEALTH
GREEN — clean push, no blockers, queue moving

BLOCKED
NO

CURRENT GATE
NONE

WIP
Wiring Supabase persist into Goals module save handler

NEXT ACTION
Commit Goals persist, then move to 3.4 (KPI snapshot wiring)

LAST PUSH
3f8a12c — feat: employee persist v1 — 2026-05-09 14:30

BRANCH
claude/employee-supabase-wiring-S2Abc

QUEUE DEPTH
9 items

SESSION STATE
ACTIVE

ACTIVE SESSIONS
1 — solo

FROZEN SESSIONS
1 — claude/operational-hud-design-S1Eon
```

Michael reads HEALTH (GREEN) + BLOCKED (NO) in 2 seconds.
Puts his phone down. Claude keeps building.

---

## ESCALATION PATH (HEALTH = RED)

If Michael opens STATUS.md and sees RED + BLOCKED YES:

1. Read CURRENT GATE — what does Michael need to do?
2. Do it (run SQL, deploy worker, answer a question in chat)
3. Tell Claude "[M-task] done" in chat
4. Claude updates STATUS.md → HEALTH returns to GREEN/YELLOW

The phone is the trigger device. The action happens wherever the M-task lives
(Supabase dashboard, local terminal, chat).
