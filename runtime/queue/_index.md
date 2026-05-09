# Queue Snapshot

**Updated:** 2026-05-09T21:30:00Z
**Totals:** 2 ready · 7 blocked · 0 in flight · 12 complete

---

## READY

- r-02-decision-lock-doc — high · 0.5 sessions (queue file pending)
- r-03-feature-flag-scaffold — low · 0.25 sessions (queue file pending)

## IN FLIGHT

_(none)_

## BLOCKED — Michael Action Required

- bug-01-worker-deploy — CRITICAL · `wrangler deploy` from local terminal
- dec-01-phase-a-decisions — HIGH · answer 5 questions in `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md §11`
- sql-01-migrations — HIGH · run M01–M40 in Supabase SQL editor
- dec-02-phase-a-auth — HIGH · authorize Phase A integration (after dec-01)
- dec-03-phase-b-auth — MEDIUM · authorize Phase B integration (after Phase A verified)
- dec-04-phase-f-auth — LOW · authorize Phase F decommission (far future)
- rls-01-enforcement — MEDIUM · decide RLS enforcement timeline

## GATE-LOCKED — Phase Gate

- gl-01-phase-a-integration — gated on dec-01 + dec-02
- gl-02-phase-b-integration — gated on Phase A verified + dec-03
- gl-03-phase-c-system-health — gated on Phase B verified
- gl-04-phase-d-vendors — gated on Phase C verified
- gl-05-phase-e-modules — gated on Phase D verified
- gl-06-phase-f-decommission — gated on Phase E + dec-04

## COMPLETE (last 5)

- r-01-prototype-hardening — 2026-05-09 · `86ff903` · empty states, aria, role=dialog
- mvhb-first-exec-layer — 2026-05-09 · `1062dc5` · MVHB_ROADMAP, SESSION_LIFECYCLE, EXECUTION_TOPOLOGY, MICHAEL_ATTENTION_BUDGET
- mvhb-phase-1 — 2026-05-08 · `99f4f6e` · runtime foundation
- impl-hub-layer — 2026-05-08 · `7d761fd`
- phase-2c-prototype — 2026-05-08 · `ff17ba1`

---

## Sync notes

This file is hand-maintained. To re-sync from individual queue files:
1. Read each `runtime/queue/[task-id].md`
2. Group by status
3. Overwrite this file

Future Phase 2 may automate this.
