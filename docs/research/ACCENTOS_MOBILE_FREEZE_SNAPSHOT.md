# AccentOS Mobile Freeze Snapshot
> **Status:** Authoritative handoff packet  
> **Date:** 2026-05-08  
> **Purpose:** Single-document distillation of the complete mobile architecture philosophy  
> **Audience:** Future implementation sessions; ChatGPT handoff; planning reviews; new contributors  
> **Authority:** This document reflects the frozen state of the mobile architecture as of the planning phase completion.

---

## WHAT THIS IS

Ten planning documents were produced across three research sessions. This document distills their philosophies into canonical statements that survive handoff without requiring reading the full corpus.

If you only read one document: read this one. Then read ACCENTOS_MOBILE_GATES.md for the validation checklist.

---

## THE ONE SENTENCE

AccentOS mobile is an operational command center accessed in 30–120 second bursts by a single user (iPhone 13 Pro Max, showroom + field) — every design and implementation decision optimizes for speed of execution and survivability, not for aesthetics or engagement.

---

## 1. ADDITIVE-ONLY PHILOSOPHY

**Statement:** Every mobile improvement in Phase 1 and Phase 2 is a net addition to the codebase. Nothing is deleted. Nothing is modified except one appended line in `goTo()`. Rollback is always "remove the addition."

**Why:** AccentOS is production operational infrastructure with no staging environment. Any change that modifies existing code has an unquantifiable blast radius. Additive changes have a precisely quantifiable blast radius: zero (the addition simply does nothing if it fails).

**Hard rules that enforce this:**
- `openModal()` is never modified — a parallel `openBottomSheet()` is created
- The sidebar HTML is never touched — bottom nav is a new sibling element
- `goTo()` receives exactly one appended line for bottom nav active state — nothing else
- All mobile CSS lives inside `@media (max-width:900px)` — desktop selectors are never changed

---

## 2. ROLLBACK PHILOSOPHY

**Statement:** Every mobile feature must have a clearly defined, tested rollback that restores the prior state in under 15 minutes. No feature ships without a documented rollback path.

**Why:** Michael uses AccentOS to run the business. If a mobile change breaks his workflow at 9 AM on a Tuesday, the fix cannot wait for a planning session. Rollback must be executable immediately by Claude with no analysis required.

**Rollback speed tiers:**
- CSS class toggle: < 1 minute, no deploy
- Remove added code, push: < 5 minutes, Cloudflare deploys in 15 seconds
- SW cache recovery: < 10 minutes, may require Michael to clear Website Data
- `git revert HEAD`: < 5 minutes, always available as last resort

**The non-negotiable rule:** `git revert`, never `git reset --hard`. History is preserved. The revert commit documents what was undone and when.

---

## 3. MOBILE OPERATIONAL UX PHILOSOPHY

**Statement:** AccentOS mobile surfaces what needs doing, not what data exists. The interface answers "what should I do right now?" not "which module do I want to explore?"

**The task-centric principle in practice:**
- Daily Brief (`goTo('dashboard')`) is the mobile home screen — it lists action items, not module options
- Every Daily Brief tile answers: "this thing needs attention → tap to act"
- Navigation is access to modules, not the primary UI surface
- Every new module asks "what is my Daily Brief tile?" before "what does my mobile layout look like?"

**What this rules out:** Table-centric mobile interfaces that make the user navigate to data and decide what to do with it. Module lists as home screens. Navigation-as-content.

---

## 4. SURVIVABILITY PHILOSOPHY

**Statement:** AccentOS mobile must remain operational under: spotty showroom WiFi, brief cellular dead zones, iOS memory pressure, and failed feature deployments. No single failure should make the app completely unusable.

**Survivability hierarchy:**
1. App shell loads (even offline) — service worker handles this
2. Navigation works — bottom nav and sidebar are both present; if one fails the other covers
3. Data reads gracefully empty — never blank screens; always an empty state with retry path
4. Write actions succeed — network-dependent; fail with clear error + retry option
5. Push notifications arrive — nice-to-have; complete failure is invisible to user

**The floor:** If everything fails except the app shell and sidebar navigation, AccentOS still works as an operational tool. The data will load when connectivity returns.

---

## 5. IMPLEMENTATION SEQUENCE PHILOSOPHY

**Statement:** Risk increases with each phase. Ship the lowest-risk, highest-value changes first. Never gate a trivial change behind a complex one.

**The sequence principle:** Phase 1 (6 trivial changes) ships before Phase 2 (2 prototype-gated changes) ships before Phase 3 (complex, multi-session). This ordering ensures:
- Michael gets immediate value (installable app, correct layout) within 1 session
- Each subsequent phase builds on a validated foundation
- If Phase 3 is never implemented, Phase 1+2 already deliver 80% of the mobile value

**The prototype gate principle:** M8 (bottom nav) and M9 (bottom sheets) are the two highest-complexity changes. Both require a standalone prototype to pass explicit PASS/FAIL criteria before touching `index.html`. Complexity is never injected into production without validation.

---

## 6. DESKTOP PROTECTION PHILOSOPHY

**Statement:** Desktop users (Paul, Patrick, warehouse staff) must never experience degradation from mobile improvements. Desktop is not a secondary concern — it is the primary platform for non-Michael users.

**Enforcement mechanisms:**
- All mobile CSS inside `@media (max-width:900px)` — not inside `@media (max-width:900px)` + `@media (min-width:901px)` duplicates, but isolated to the mobile block
- All mobile JS behind `isMobile()` — `window.matchMedia('(max-width:900px)').matches`
- `openModal()` never modified — desktop modal behavior is structurally unchanged
- Post-deploy desktop check at 1440px is mandatory after every session

**The trigger:** If desktop is broken, rollback immediately. Do not investigate on desktop first. Rollback, then investigate from a known-good state.

---

## 7. VALIDATION PHILOSOPHY

**Statement:** A feature is not ready for production until it has passed its validation gate on a real iPhone in Safari, not a simulator or desktop Chrome DevTools device emulation.

**Why real device:** iOS Simulator does not accurately replicate Safari's keyboard push-up behavior, safe-area rendering in standalone mode, or touch gesture handling. Desktop emulation misses viewport-fit behavior entirely.

**The two validation gates that matter most:**
- M8 PASS GATE (24 tests) — bottom nav must pass all before index.html injection
- M9 PASS GATE (24 tests, esp. B6–B11 keyboard) — bottom sheet must pass all before index.html injection

**The desktop regression check that catches everything:** Open at 1440px in Chrome. Sidebar visible. No bottom nav. All modules render. This 60-second check must happen after every implementation session.

---

## ARCHITECTURE FACTS (FROZEN)

These facts are established from actual code inspection and must not be assumed or inferred:

| Fact | Value | Source |
|---|---|---|
| Daily Brief goTo key | `'dashboard'` | index.html line 391 |
| Login routes to | `goTo('dashboard')` at line 631 | index.html line 631 |
| Scroll container | `.content` element (`overflow-y:auto`), not window | index.html line 84 |
| Toast auto-dismiss | 3,200ms | index.html line 804 |
| openModal signature | `openModal(title, body, foot='')` | index.html line 815 |
| goTo signature | `goTo(page)` → sets curPage, dispatches to pages[page] | index.html line 864 |
| Mobile breakpoint (CSS) | `@media (max-width:900px)` | index.html line 336 |
| isMobile() canonical | `window.matchMedia('(max-width:900px)').matches` | TERMINOLOGY.md |
| Bottom nav height | 60px | INTERACTION_STANDARDS.md |
| Pull-to-refresh check | `.content.scrollTop === 0` | CONTRADICTIONS.md C2 |
| goTo() modification | 1 line appended: `qsa('.bn-item[data-page]').forEach(...)` | IMPLEMENTATION_PLAN.md |
| Toast position (mobile) | `bottom: calc(60px + 16px + env(safe-area-inset-bottom))` | CONTRADICTIONS.md C6 |

---

## WHAT IS FROZEN

These decisions are made and will not be revisited during implementation:

- Bottom tab nav with exactly 5 tabs: Home, Pipeline, Quotes, Vendors, More
- `openBottomSheet()` as parallel function; `openModal()` untouched
- Daily Brief as mobile home screen
- Service worker for app shell only (not Supabase data)
- Push notifications require home screen install — cannot be worked around
- No framework migration; no bundler; vanilla JS throughout
- No consumer-app animations; no parallax; no entrance animations on lists
- `git revert` as the rollback mechanism; never `git reset --hard`

---

## WHAT IS NOT FROZEN (OPEN DECISIONS)

These require a decision before the relevant session:

| Open decision | Relevant session | Options |
|---|---|---|
| SW cache versioning mechanism | Session D | (A) Cloudflare build-time injection; (B) Manual deploy checklist |
| Prototype file handling | Session B | (A) Local only, delete after; (B) Commit to /prototypes/ |
| Icon assets for manifest.json | Session A | (A) Placeholder red square; (B) Actual brand icon if available |
| Script defer audit results | Session A | Must audit before adding defer; result determines which scripts get defer |

---

## PLANNING CORPUS SUMMARY

10 documents, 4,313+ lines, created across 3 research sessions:

| Session | Documents produced |
|---|---|
| Research session 1 | MOBILE_PWA_RESEARCH |
| Research session 2 | IMPLEMENTATION_PLAN, ROLLOUT_STRATEGY, FAILURE_SCENARIOS, OPERATIONAL_PRINCIPLES |
| Research session 3 | PROTOTYPE_SPEC, PERFORMANCE_BUDGET, INTERACTION_STANDARDS, ROLLBACK_PLAYBOOK, PHASE_A_READINESS |
| Convergence session | INDEX, TERMINOLOGY, CONTRADICTIONS, FREEZE_SNAPSHOT, GATES |

**Status:** Planning phase complete. Session A cleared for implementation.
