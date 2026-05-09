# AccentOS — Implementation Master Queue
> The authoritative ordered list of all pending implementation work.
> Overwritten only by the Implementation Hub. Read by all agents before starting work.

**Status:** ACTIVE  
**Authority:** Implementation Hub (`claude/implement-claude-design-ui-eFn9b`)  
**Last Updated:** 2026-05-08  
**Source of Truth For:** What gets built next, in what order, with what constraints  

---

## HOW TO READ THIS DOCUMENT

- Items are ordered by unblocking sequence, not subjective priority.
- **BLOCKED** = cannot start until a dependency is resolved.
- **READY** = all prerequisites met; may start immediately.
- **IN FLIGHT** = actively being worked; check ACTIVE_BRANCH_REGISTRY.md for owner.
- **COMPLETE** = done and merged to target branch.
- **GATE-LOCKED** = waiting for an explicit phase gate approval.

---

## QUEUE STATUS SNAPSHOT

| Bucket | Count |
|--------|-------|
| COMPLETE | 8 |
| IN FLIGHT | 1 |
| READY | 3 |
| BLOCKED (Michael) | 7 |
| GATE-LOCKED | 6 |
| DEFERRED | 4 |

---

## SECTION 1 — COMPLETE

These are done. Do not re-do them. Checked against BUILD_PLAN_CLAUDE.md.

| ID | Item | Branch | Commit |
|----|------|--------|--------|
| C-01 | Quote Generator v2 (AI parse, track calc, CSV export) | main | `940e7f8` |
| C-02 | Cloudflare Worker proxy (CORS fix) | main | `87f20a2` |
| C-03 | AccentOS UI Foundation (design system, tokens, shell CSS/JS) | ui-proto | `d189b3b` |
| C-04 | Governance docs (SYSTEM_STATE, RISKS, STABILIZATION, MODULE_OWNERSHIP) | ui-proto | `d189b3b` |
| C-05 | Boot smoke script (27-check static validator) | ui-proto | `d189b3b` |
| C-06 | Phase 2A prototype (role-aware simulation, 5 module tables) | ui-proto | `b9e7f58` |
| C-07 | Phase 2B prototype (task inbox, AI assist mode, mobile sheet, chords) | ui-proto | `b22a9d5` |
| C-08 | Phase 2C prototype (bulk select, saved views, briefing, drag-drop, notif wiring) | ui-proto | `ff17ba1` |
| C-09 | Progressive Shell Rollout plan (docs/design/) | ui-proto | `ff17ba1` |
| C-10 | Implementation Hub layer (this document set) | ui-proto | pending |

---

## SECTION 2 — BLOCKED (MICHAEL ACTION REQUIRED)

These cannot move forward without explicit Michael action. No Claude session unblocks them.

| ID | Item | What Michael Must Do | Risk if Delayed | Priority |
|----|------|---------------------|-----------------|----------|
| BM-01 | **Worker proxy redeploy (BUG-01)** | `wrangler deploy` from `C:\Users\Michael\Desktop\accent-os` | Quote AI Parse stays broken (400 error) | CRITICAL |
| BM-02 | **SQL Migrations M01–M40** | Run in Supabase SQL editor, in order | New features assume migrated schema; drift risk grows | HIGH |
| BM-03 | **Decision Lock — Phase A auth** | Answer 5 questions in `ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md` §11 | Phase A–F integration cannot begin | HIGH |
| BM-04 | **Phase A authorization** | Sign off on side-loading tokens.css + shell.css in index.html | Phase B–F blocked | HIGH (after BM-03) |
| BM-05 | **Phase B authorization** | Sign off on shell-as-chrome mount in index.html | Phase C–F blocked | MEDIUM (after Phase A verified) |
| BM-06 | **Phase F authorization** | Sign off on decommissioning legacy chrome | Irreversible — requires explicit approval | LOW (far future) |
| BM-07 | **RLS enforcement decision** | Decide when to enforce Supabase RLS (separate from shell rollout) | UI visibility ≠ security until this is done | MEDIUM |

---

## SECTION 3 — READY TO WORK

All prerequisites met. Can be started in any session without further authorization.

### R-01: Prototype 2D — Hardening Pass
**Scope:** `ui/accentos-shell-prototype.html` only  
**What:** Empty states for filtered tables, a11y labels, loading skeletons, mobile 390px verify, keyboard reachability audit  
**Estimate:** 1 session  
**Does not touch:** index.html, worker/, SQL, any production file  
**Exit criteria:** Boot smoke 27/27, no console errors across all 7 roles  

### R-02: Decision Lock Document
**Scope:** `docs/implementation/` only  
**What:** Create `ACCENTOS_PHASE_A_DECISION_LOCK.md` — 5 decisions structured for Michael to answer inline  
**Estimate:** 0.5 sessions  
**Exit criteria:** Document created, structured for a non-technical reader  

### R-03: Feature Flag Scaffold
**Scope:** `ui/accentos-shell.js` only  
**What:** Add `window.AccentOS.flags = { isEnabled(name){...} }` — reads localStorage + URL param, no-op until actually used  
**Estimate:** 0.25 sessions  
**Exit criteria:** Boot smoke 27/27, no prod file changes  

---

## SECTION 4 — GATE-LOCKED (PHASE GATES)

These are ready in principle but gated on phase completion. Do not start until gate opens.

| ID | Item | Gate | Depends On |
|----|------|------|------------|
| GL-01 | Phase A integration — side-load shell assets | BM-03 + BM-04 authorized | Decision Lock answered |
| GL-02 | Phase B integration — shell-as-chrome mount | Phase A verified + BM-05 | GL-01 |
| GL-03 | Phase C — System Health module migration | Phase B verified | GL-02 |
| GL-04 | Phase D — Vendor Intelligence module migration | Phase C verified | GL-03 |
| GL-05 | Phase E — remaining modules (1 per session) | Phase D verified | GL-04 |
| GL-06 | Phase F — decommission legacy chrome | Phase E complete + BM-06 | GL-05 |

---

## SECTION 5 — IN FLIGHT

| ID | Item | Branch | Owner | Expected Completion |
|----|------|--------|-------|---------------------|
| IF-01 | Implementation Hub layer (7 docs) | ui-proto | Hub | This session |

---

## SECTION 6 — DEFERRED

Items explicitly postponed. Revisit after Phase D or at Michael's direction.

| ID | Item | Why Deferred | Revisit Trigger |
|----|------|-------------|-----------------|
| D-01 | Real PWA service worker + manifest | Needs production URL decided | After Phase B |
| D-02 | Supabase RLS enforcement (BM-07) | Separate from shell rollout, major effort | After Phase E |
| D-03 | Real auth flow (JWT role claims) | Depends on RLS | After D-02 |
| D-04 | Agent autonomy AML 4+ (dynamic routing) | Requires Claude API integration | After Phase F |

---

## SECTION 7 — UPCOMING QUEUE (ordered)

The next 10 items in sequence, assuming no new blockers.

```
1. IF-01: Implementation Hub docs (this session)
2. R-01: Prototype 2D hardening
3. R-02: Decision Lock document
4. R-03: Feature flag scaffold
5. BM-03: Michael answers 5 decisions (Michael action)
6. BM-01: Worker proxy redeploy (Michael action)
7. GL-01: Phase A integration (requires BM-03 + BM-04)
8. GL-02: Phase B integration
9. GL-03: Phase C — System Health
10. GL-04: Phase D — Vendors
```

---

## QUEUE HEALTH INDICATORS

| Signal | Current | Target | Action |
|--------|---------|--------|--------|
| Items COMPLETE | 10 | growing | good |
| Items BLOCKED on Michael | 7 | ≤3 | Michael to unblock |
| Items IN FLIGHT | 1 | ≤3 | good |
| Items GATE-LOCKED | 6 | decreasing | resolve blockers |
| Commits ahead of main | 4 | ≤5 | merge when Phase A authorized |
| Boot smoke | 27/27 | 27/27 | maintain |

---

## MAINTENANCE RULES

- This doc is overwritten by the Hub each session, not appended.
- Items move from GATE-LOCKED → READY only when Hub confirms gate condition is met.
- Items move from BLOCKED → READY only when Michael confirms action complete.
- Items added to DEFERRED require justification + revisit trigger.
- COMPLETE section grows monotonically — items are never removed.
