# AccentOS Mobile Planning Index
> **Status:** Authoritative navigation spine  
> **Date:** 2026-05-08  
> **Purpose:** Single entry point for all mobile planning documentation  
> **For:** Any future implementation session, Claude or human, consuming this planning corpus

---

## READING ORDER FOR IMPLEMENTATION SESSIONS

Start here. Read in this order based on what you need:

**New to this codebase? Read:**
1. ACCENTOS_MOBILE_PWA_RESEARCH.md — iOS constraints, patterns, architecture baseline
2. ACCENTOS_MOBILE_OPERATIONAL_PRINCIPLES.md — why mobile is designed the way it is

**Planning an implementation session? Read:**
3. ACCENTOS_MOBILE_PHASE_A_READINESS.md — explicit go/no-go per capability (START HERE for implementation)
4. ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md — ordered phases, file impacts, LOC estimates
5. ACCENTOS_MOBILE_ROLLOUT_STRATEGY.md — coexistence rules, sequencing, install flow

**Before prototype work (M8 or M9)? Read:**
6. ACCENTOS_MOBILE_PROTOTYPE_SPEC.md — PASS/FAIL gates; mandatory before touching index.html

**During implementation? Keep open:**
7. ACCENTOS_MOBILE_INTERACTION_STANDARDS.md — gesture rules, tap targets, sheet/nav specs
8. ACCENTOS_MOBILE_PERFORMANCE_BUDGET.md — quantified limits per change
9. ACCENTOS_MOBILE_TERMINOLOGY.md — one term = one meaning

**Something broke? Go directly to:**
10. ACCENTOS_MOBILE_ROLLBACK_PLAYBOOK.md — triage entry point, step-by-step recovery
11. ACCENTOS_MOBILE_FAILURE_SCENARIOS.md — failure models with blast radius

**Resolving ambiguity? Check:**
12. ACCENTOS_MOBILE_CONTRADICTIONS.md — known conflicts and their resolutions
13. ACCENTOS_MOBILE_FREEZE_SNAPSHOT.md — authoritative philosophy statements
14. ACCENTOS_MOBILE_GATES.md — all validation gates consolidated

---

## DOCUMENT REGISTRY

### Group A — Research Foundation

| Document | Purpose | Authority | Consumer |
|---|---|---|---|
| ACCENTOS_MOBILE_PWA_RESEARCH.md | iOS PWA constraints, patterns, architecture baseline, best-in-class references | Reference | All planning docs; implementation sessions needing iOS context |

### Group B — Implementation Planning

| Document | Purpose | Authority | Consumer |
|---|---|---|---|
| ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md | Ordered phases M1–M19; per-change LOC/risk/rollback/dependency | Implementation spec | Session A, B, C, D build sessions |
| ACCENTOS_MOBILE_ROLLOUT_STRATEGY.md | Coexistence rules, install flow, feature flags, rollout metrics | Deployment spec | All implementation sessions; Cloudflare deploy procedure |
| ACCENTOS_MOBILE_PHASE_A_READINESS.md | Go/no-go matrix; Session A cleared; explicit "never ship" list | Decision authority | First implementation session; all subsequent sessions |

### Group C — Validation Gates

| Document | Purpose | Authority | Consumer |
|---|---|---|---|
| ACCENTOS_MOBILE_PROTOTYPE_SPEC.md | PASS/FAIL criteria for M8 (bottom nav) and M9 (bottom sheet) | Validation gate | Session B and C prototype phases; mandatory before index.html injection |
| ACCENTOS_MOBILE_GATES.md | All validation gates consolidated into scannable checklist | Consolidated gate | All implementation sessions; post-deploy verification |

### Group D — Operational Standards

| Document | Purpose | Authority | Consumer |
|---|---|---|---|
| ACCENTOS_MOBILE_OPERATIONAL_PRINCIPLES.md | Why mobile is task-centric; design philosophy; anti-patterns | Design constitution | All future mobile feature decisions; design reviews |
| ACCENTOS_MOBILE_INTERACTION_STANDARDS.md | How interactions work: gestures, tap targets, sheets, nav, loading | Interaction spec | All implementation sessions; UI decisions during build |
| ACCENTOS_MOBILE_PERFORMANCE_BUDGET.md | Quantified limits: TTI, latency, bundle size, DOM, animation, memory | Performance spec | All implementation sessions; post-deploy checks |

### Group E — Survivability

| Document | Purpose | Authority | Consumer |
|---|---|---|---|
| ACCENTOS_MOBILE_FAILURE_SCENARIOS.md | 10 failure models; symptoms, causes, blast radius, recovery | Failure reference | Post-deploy triage; incident response |
| ACCENTOS_MOBILE_ROLLBACK_PLAYBOOK.md | Step-by-step recovery procedures; exact commands; triage entry point | Operational procedure | Michael (reporting); Claude (responding); any incident |

### Group F — Convergence

| Document | Purpose | Authority | Consumer |
|---|---|---|---|
| ACCENTOS_MOBILE_TERMINOLOGY.md | Canonical term definitions; one term = one meaning | Terminology authority | All documents; all implementation sessions |
| ACCENTOS_MOBILE_CONTRADICTIONS.md | Known conflicts across corpus; resolution paths | Conflict registry | Implementation sessions resolving ambiguity |
| ACCENTOS_MOBILE_FREEZE_SNAPSHOT.md | Philosophy distillation; authoritative handoff packet | Handoff authority | New sessions; ChatGPT handoff; planning reviews |
| ACCENTOS_MOBILE_INDEX.md | This document — navigation spine | Navigation authority | Entry point for all consumers |

---

## IMPLEMENTATION DEPENDENCY ORDER

```
PHASE 1 — SESSION A (all independent, ship together):
  M1 viewport-fit=cover
  M2 safe-area CSS
  M3 manifest.json
  M4 Apple meta tags
  M5 script defer
  M13 font-display swap
  ↓
  GATE: Install to home screen → standalone mode correct

PHASE 2a — SESSION B (depends on Phase 1 gate passing):
  PROTOTYPE: mobile-nav-proto.html → M8 PASS GATE
  M8 bottom tab navigation          ← requires M8 PASS GATE
  M6 mobile landing screen          ← ships with M8
  M7 toast reposition               ← ships with M8
  M14 will-change                   ← ships with M8
  ↓
  GATE: Desktop 1440px unchanged + all 5 tabs functional

PHASE 2b — SESSION C (depends on Session B gate passing):
  PROTOTYPE: bottom-sheet-proto.html → M9 PASS GATE
  M9 bottom sheets (top 3 modals)   ← requires M9 PASS GATE
  M11 pull-to-refresh + visibility  ← ships with M9
  ↓
  GATE: Keyboard tests pass + openModal() desktop unchanged

PHASE 2c — SESSION D (blocked pending cache versioning decision):
  M10 service worker                ← requires automated versioning
  ↓
  GATE: Airplane mode test + SW DevTools verification

PHASE 3 — MULTI-SESSION (blocked on Michael home screen install):
  M17 command launcher
  M16 push notifications            ← requires Michael action + permission
  M15 swipe-to-reveal               ← defer; low urgency
```

---

## ROLLBACK RELATIONSHIP MAP

```
M1  → rollback: remove 1 word from meta tag
M2  → rollback: remove CSS block (M1 can stay)
M3  → rollback: delete manifest.json file
M4  → rollback: remove 5 HTML lines (M3 can stay)
M5  → rollback: remove defer attributes
M6  → rollback: remove isMobile() conditional
M7  → rollback: remove 4 CSS lines
M8  → rollback: CSS display:none on #mobile-bottom-nav (instantaneous; sidebar auto-restores)
M9  → rollback: change openBottomSheet() → openModal() at each call site (~1 min per modal)
M10 → rollback: remove SW registration script; deploy (users need hard refresh or cache clear)
M11 → rollback: remove event listeners
M16 → rollback: disable Cloudflare Worker push endpoint
M17 → rollback: restore original QA FAB HTML
```

Each phase rollback is independent. M8 rollback does not require reverting M1–M7.

---

## ARCHITECTURE CONSTANTS (FROZEN)

These values are fixed across all planning documents and must not be changed without updating all referencing docs:

| Constant | Value | Source |
|---|---|---|
| Mobile breakpoint | 900px | Existing AccentOS `@media (max-width:900px)` |
| isMobile() implementation | `window.matchMedia('(max-width:900px)').matches` | TERMINOLOGY.md (canonical); see CONTRADICTIONS.md |
| Pull-to-refresh scroll check | `contentEl.scrollTop === 0` where `contentEl = document.querySelector('.content')` | CONTRADICTIONS.md (corrects INTERACTION_STANDARDS) |
| Bottom nav height | 60px fixed height | INTERACTION_STANDARDS.md |
| Bottom nav tab count | 5 | INTERACTION_STANDARDS.md |
| Minimum tap target | 44×44px | Apple HIG; INTERACTION_STANDARDS.md |
| Safe-area inset top (iPhone 13 Pro Max) | ~47px (env value) | PWA_RESEARCH.md |
| Safe-area inset bottom (iPhone 13 Pro Max) | ~34px (env value) | PWA_RESEARCH.md |
| Toast auto-dismiss | 3,200ms | index.html line 804 (actual code) |
| Sheet open duration | 250ms | INTERACTION_STANDARDS.md |
| Sheet close duration | 200ms | INTERACTION_STANDARDS.md |
| goTo() modification for bottom nav | 1 line (`.bn-item[data-page]` forEach) | IMPLEMENTATION_PLAN.md, PROTOTYPE_SPEC.md |
| Daily Brief goTo() key | `'dashboard'` | index.html line 391 (actual code) |
| Scroll container for pull-to-refresh | `.content` element (not window) | CONTRADICTIONS.md |
