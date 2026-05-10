# Queue Snapshot

**Updated:** 2026-05-10T01:45:00Z
**Totals:** 0 ready · 12 blocked · 0 in flight · 17 complete

---

## READY

_(none — all pre-mount READY items complete; Phase A mount awaits dec-02-phase-a-auth)_

## IN FLIGHT

_(none)_

## BLOCKED — Michael Action Required

- bug-01-worker-deploy — CRITICAL · `wrangler deploy` from local terminal
- dec-01-phase-a-decisions — HIGH · answer remaining items in `docs/implementation/DECISION_LOCK_V1.md`
- sql-01-migrations — HIGH · run M01–M40 in Supabase SQL editor
- dec-02-phase-a-auth — HIGH · authorize Phase A integration (after dec-01)
- dec-03-phase-b-auth — MEDIUM · authorize Phase B integration (after Phase A verified)
- dec-04-phase-f-auth — LOW · authorize Phase F decommission (far future)
- rls-01-enforcement — MEDIUM · decide RLS enforcement timeline
_(qa-04-font-system-decision — COMPLETE: Inter decided 2026-05-10, no code change needed)_

## BLOCKED — Phase A Auth Gate

- [qa-01-cmdk-deconflict](qa-01-cmdk-deconflict.md) — HIGH · `js/global_search.js` Cmd+K listener conflicts with shell launcher
- [qa-02-viewport-fit](qa-02-viewport-fit.md) — MEDIUM · `viewport-fit=cover` missing from `index.html`
- [qa-03-zindex-remap](qa-03-zindex-remap.md) — MEDIUM · RESOLVED in tokens.css (commit 399157f)

## BLOCKED — Phase B Gate

- [qa-05-body-overflow-ios](qa-05-body-overflow-ios.md) — MEDIUM · verify iOS Safari fixed-position with body overflow:hidden
- [qa-08-auth-state-bridge](qa-08-auth-state-bridge.md) — MEDIUM · window.CU → shell identity bridge contract
- [qa-09-navigate-goto-bridge](qa-09-navigate-goto-bridge.md) — MEDIUM · navigate() vs goTo() bridge + mode guard bypass

## GATE-LOCKED — Phase Gate

- gl-01-phase-a-integration — gated on dec-01 + dec-02
- gl-02-phase-b-integration — gated on Phase A verified + dec-03
- gl-03-phase-c-system-health — gated on Phase B verified
- gl-04-phase-d-vendors — gated on Phase C verified
- gl-05-phase-e-modules — gated on Phase D verified
- gl-06-phase-f-decommission — gated on Phase E + dec-04

## COMPLETE (last 10)

- qa-04-font-system-decision — 2026-05-10 · Inter selected; tokens.css already correct, no code change
- r-03-feature-flag-scaffold — 2026-05-10 · window.AccentOS.flags.isEnabled() + override() in accentos-shell.js
- qa-07-data-roles-collision — 2026-05-10 · shell data-roles → data-aos-roles, blocks Phase A mount resolved
- qa-06-btn-class-scoping — 2026-05-10 · scoped .btn* rules added to accentos-shell.css, blocks Phase A mount resolved
- r-02-decision-lock-doc — 2026-05-10 · `1c750a4` · DECISION_LOCK_V1.md + DEC-01-B/C corrections
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
