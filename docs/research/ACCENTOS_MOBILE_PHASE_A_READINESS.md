# AccentOS Mobile Phase A Readiness
> **Status:** Planning only — decision matrix  
> **Date:** 2026-05-08  
> **Purpose:** Explicit go/no-go for each proposed mobile capability  
> **Architecture reference:** index.html (7,169 lines), 38 js/*.js modules, Cloudflare Pages + Supabase

---

## READING THIS DOCUMENT

Each capability is evaluated on seven dimensions:

| Dimension | Definition |
|---|---|
| **Readiness** | READY / BLOCKED / DEFERRED |
| **Dependencies** | What must be true/done first |
| **Survivability confidence** | How certain are we the app survives if this fails? (HIGH/MED/LOW) |
| **Rollback confidence** | How fast and clean is the rollback? (HIGH/MED/LOW) |
| **Desktop regression risk** | Probability this breaks desktop users (LOW/MED/HIGH) |
| **Operational value** | Direct benefit to Michael's operational workflows (HIGH/MED/LOW) |
| **Implementation difficulty** | LOC + complexity (TRIVIAL/LOW/MEDIUM/HIGH) |

---

## CAPABILITY MATRIX

### PHASE 1 CAPABILITIES (Session A)

---

#### M1 — `viewport-fit=cover`
**Readiness: READY — Ship Session A**

| Dimension | Assessment |
|---|---|
| Dependencies | None |
| Survivability confidence | HIGH — browsers that don't understand it ignore it |
| Rollback confidence | HIGH — 1 word, 1 minute |
| Desktop regression risk | NONE — desktop browsers don't have notches; value evaluates to 0 |
| Operational value | HIGH — prerequisite for all safe-area work; without it, standalone mode is broken |
| Implementation difficulty | TRIVIAL — 1 word added to existing meta tag |

**Verdict: MUST SHIP FIRST. This is the load-bearing prerequisite for all mobile layout work.**

---

#### M2 — Safe-Area CSS Insets
**Readiness: READY — Ship Session A (after M1)**

| Dimension | Assessment |
|---|---|
| Dependencies | M1 must ship in same commit |
| Survivability confidence | HIGH — `env()` evaluates to 0 on desktop; zero desktop effect |
| Rollback confidence | HIGH — remove CSS block |
| Desktop regression risk | NONE |
| Operational value | HIGH — prevents critical notch/home-indicator clipping in standalone mode |
| Implementation difficulty | TRIVIAL — ~15 CSS lines |

**Verdict: SHIP WITH M1. Same commit, zero risk.**

---

#### M3 — `manifest.json`
**Readiness: READY — Ship Session A (requires icon assets)**

| Dimension | Assessment |
|---|---|
| Dependencies | Icon PNG files (192×192, 512×512, 512×512 maskable) |
| Survivability confidence | HIGH — browser silently ignores manifest errors; app still works |
| Rollback confidence | HIGH — delete file |
| Desktop regression risk | NONE |
| Operational value | HIGH — unlocks installability (required for push notifications; improves standalone experience) |
| Implementation difficulty | TRIVIAL — JSON file creation |

**Blocker note:** Icon assets must exist. If Accent Lighting has an existing brand icon at the right resolution, use it. If not: use a temporary placeholder for Session A (solid red square with "OS" text) and replace with proper icon before Michael is directed to install.

**Verdict: READY with icon caveat. Do not block Session A on perfect icons — ship with placeholder, replace in Session B or C.**

---

#### M4 — Apple PWA Meta Tags
**Readiness: READY — Ship Session A (after M3)**

| Dimension | Assessment |
|---|---|
| Dependencies | M3 (icon assets needed for `apple-touch-icon`) |
| Survivability confidence | HIGH — ignored by non-iOS browsers |
| Rollback confidence | HIGH — remove 5 HTML lines |
| Desktop regression risk | NONE |
| Operational value | MEDIUM — improves home screen icon, status bar styling, standalone mode feel |
| Implementation difficulty | TRIVIAL — 5 HTML lines |

**Verdict: SHIP WITH M3. Same commit.**

---

#### M5 — Script `defer` Optimization
**Readiness: READY WITH CAUTION — Ship Session A**

| Dimension | Assessment |
|---|---|
| Dependencies | Requires audit of inline scripts that depend on module globals |
| Survivability confidence | HIGH — `defer` preserves execution order; should be safe |
| Rollback confidence | HIGH — remove `defer` attributes |
| Desktop regression risk | LOW — requires audit: if any inline `<script>` in `<body>` reads globals set by deferred external scripts before DOMContentLoaded, it will fail |
| Operational value | MEDIUM — faster FCP on mobile, especially cellular |
| Implementation difficulty | LOW — add attribute to 38 `<script>` tags; audit for ordering issues |

**Required pre-ship check:** Grep `index.html` for any inline `<script>` blocks that reference module globals (e.g., `VENDORS`, `QUOTES`, `CUSTOMERS`) — these may need to be inside `DOMContentLoaded` handlers if scripts are deferred.

**Verdict: READY — but audit required first. Do not blindly add `defer` without checking inline script ordering.**

---

#### M6 — Daily Brief as Mobile Landing Screen
**Readiness: BLOCKED until M8 ships**

| Dimension | Assessment |
|---|---|
| Dependencies | M8 (bottom nav) — without bottom nav, landing on Daily Brief without accessible nav is disorienting |
| Survivability confidence | HIGH — trivial conditional on `goTo()` call at login |
| Rollback confidence | HIGH — remove 3-line conditional |
| Desktop regression risk | NONE — conditional gated on `isMobile()` |
| Operational value | HIGH — makes mobile opening immediately task-centric |
| Implementation difficulty | TRIVIAL — 3–5 JS lines |

**Verdict: DEFERRED to Session B. Ship on same session as M8.**

---

#### M7 — Toast Position for Bottom Nav Coexistence
**Readiness: BLOCKED until M8 ships**

| Dimension | Assessment |
|---|---|
| Dependencies | M8 (need to know bottom nav height to set correct toast offset) |
| Survivability confidence | HIGH — CSS-only positioning change |
| Rollback confidence | HIGH — remove 4 CSS lines |
| Desktop regression risk | NONE — media-query gated |
| Operational value | LOW-MEDIUM — prevents toast from hiding behind nav bar |
| Implementation difficulty | TRIVIAL |

**Verdict: DEFERRED to Session B. Ship same commit as M8.**

---

### PHASE 2 CAPABILITIES (Sessions B and C)

---

#### M8 — Bottom Tab Navigation
**Readiness: READY FOR PROTOTYPE — Not ready for production until prototype passes**

| Dimension | Assessment |
|---|---|
| Dependencies | M1, M2 must ship first; prototype must pass all M8 PASS GATE criteria (PROTOTYPE_SPEC.md) |
| Survivability confidence | HIGH — additive-only; sidebar preserved; CSS-disable rollback available instantly |
| Rollback confidence | HIGH — `display:none` on `#mobile-bottom-nav`; sidebar immediately restored |
| Desktop regression risk | LOW — gated by `@media (max-width:900px)` and `@media (min-width:901px) { display:none }` |
| Operational value | HIGH — highest ROI mobile change; moves navigation to thumb zone |
| Implementation difficulty | MEDIUM — ~100 lines HTML/CSS/JS; requires 1 addition to `goTo()` |

**The single `goTo()` modification required:**
```js
// This line is added after the existing .ni forEach in goTo():
qsa('.bn-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === page));
```
This is the only change to existing production logic. It is purely additive (adds a new code path; does not modify existing `.ni` handling).

**Verdict: PROTOTYPE FIRST. When prototype passes M8 PASS GATE → ship Session B. Do not ship to index.html without prototype validation.**

---

#### M9 — Bottom Sheet Conversion (Top 3 Modals)
**Readiness: READY FOR PROTOTYPE — Not ready for production until prototype passes**

| Dimension | Assessment |
|---|---|
| Dependencies | M8 must ship first (bottom nav height needed for sheet z-index and overlay coordination); M2 for safe-area padding at sheet bottom |
| Survivability confidence | HIGH — `openModal()` is never touched; fallback is 1-line change per modal |
| Rollback confidence | HIGH — change `openBottomSheet()` back to `openModal()` per call site |
| Desktop regression risk | LOW-MED — `isMobile()` gate is critical; if gate fails, desktop gets bottom sheets instead of modals |
| Operational value | HIGH — eliminates keyboard-overlap issue on all converted forms |
| Implementation difficulty | MEDIUM — ~80 CSS lines + 20 JS lines (new function) + 5 lines per converted modal |

**The `isMobile()` gate is the single most important implementation detail for M9:**
```js
// Every converted modal call:
function openDealForm(deal) {
  const body = buildDealFormHTML(deal);
  if (window.innerWidth < 900) {
    openBottomSheet('Edit Deal', body, dealFormFooter());
  } else {
    openModal('Edit Deal', body, dealFormFooter());
  }
}
```

**Verdict: PROTOTYPE FIRST. When prototype passes M9 PASS GATE → ship Session C.**

---

#### M10 — Service Worker + App Shell Cache
**Readiness: READY FOR PROTOTYPE — Not ready for production until cache versioning is solved**

| Dimension | Assessment |
|---|---|
| Dependencies | M3 (manifest.json) must exist; HTTPS enforced (done by Cloudflare Pages) |
| Survivability confidence | MED — SW registration failure is silent and safe; but stale cache is HIGH risk without versioning |
| Rollback confidence | MED — removing SW registration in index.html disables SW; but existing cached SW takes ~24h to expire |
| Desktop regression risk | LOW — desktop browsers also support SW but are not the concern; cache versioning affects all platforms |
| Operational value | HIGH — instant shell load; showroom WiFi resilience |
| Implementation difficulty | MEDIUM-HIGH — 60–80 lines (sw.js) + versioning automation |

**Critical requirement: cache versioning must be automated before shipping.** Manual version bumping is a guaranteed failure point across multiple deploys.

**Verdict: BLOCKED until cache versioning strategy is decided. Options:**
1. Build-time injection: use Cloudflare Pages build hooks to inject a timestamp into `sw.js`
2. Manual discipline: increment version in `sw.js` as part of every commit checklist
3. Content hash: add `?v=[date]` to all `<script src>` URLs in index.html → SW treats each version as a distinct cache entry

Option 2 is lowest-effort for now; Option 1 is most reliable long-term.

---

#### M11 — Pull-to-Refresh + Visibility Refresh
**Readiness: READY — Ship Session C (after M8)**

| Dimension | Assessment |
|---|---|
| Dependencies | M8 should ship first (need to know page-level scroll context with bottom nav present) |
| Survivability confidence | HIGH — event listeners; failure is silent (gesture just doesn't trigger) |
| Rollback confidence | HIGH — remove event listeners |
| Desktop regression risk | LOW — touch events don't fire on desktop; `visibilitychange` is benign on desktop |
| Operational value | MEDIUM — eliminates need for any polling; natural mobile refresh |
| Implementation difficulty | LOW — ~30 JS lines |

**Verdict: READY. Ship Session C.**

---

### PHASE 3 CAPABILITIES (Multi-session, requires Michael action)

---

#### M17 — FAB Command Launcher
**Readiness: DEFERRED**

| Dimension | Assessment |
|---|---|
| Dependencies | M9 (bottom sheets established); M8 (nav pattern stable) |
| Survivability confidence | MED — QA FAB already exists; must not break existing quick actions |
| Rollback confidence | MED — restore original QA FAB HTML |
| Desktop regression risk | LOW — mobile-gated |
| Operational value | MEDIUM-HIGH — reduces cross-module navigation to 2 taps |
| Implementation difficulty | HIGH — integrating global_search.js + quick_actions.js into new bottom sheet |

**Verdict: DEFERRED. Complete Phase 1+2 first. Revisit when daily workflows are established on mobile.**

---

#### M16 — Push Notifications
**Readiness: BLOCKED — Michael must install first**

| Dimension | Assessment |
|---|---|
| Dependencies | M3 (manifest), M10 (SW), Michael must have app installed on home screen, Michael must grant notification permission, VAPID keys generated, Supabase table for push_subscriptions created, Cloudflare Worker push dispatch |
| Survivability confidence | HIGH — completely additive; failure means no notifications; app unaffected |
| Rollback confidence | HIGH — disable Worker endpoint; push stops |
| Desktop regression risk | NONE |
| Operational value | HIGH — operational alerts to lock screen; closes "I forgot to check" loop for coop deadlines and deal risks |
| Implementation difficulty | HIGH — multi-system; Michael action required |

**Verdict: BLOCKED on Michael install + permission. Cannot be sequenced until Phase 1 is shipped and Michael has installed AccentOS to his home screen and verified push permissions.**

---

#### M15 — Swipe-to-Reveal on List Rows
**Readiness: DEFERRED**

| Dimension | Assessment |
|---|---|
| Dependencies | M8 and M9 stable; confirmed in production |
| Survivability confidence | HIGH — isolated to individual list modules |
| Rollback confidence | HIGH — remove touch handlers from individual module |
| Desktop regression risk | NONE — touch events don't fire on desktop |
| Operational value | MEDIUM — nice-to-have; saves 2 taps per action |
| Implementation difficulty | MEDIUM — per-module touch handler + CSS; ~3 modules to implement |

**Verdict: DEFERRED. Low urgency; implement when Phase 2 is stable.**

---

## EXPLICIT RECOMMENDATIONS

### What Ships First (Session A — Ship Immediately)

```
M1: viewport-fit=cover          → SHIP
M2: Safe-area CSS               → SHIP
M3: manifest.json               → SHIP (with placeholder icons)
M4: Apple meta tags             → SHIP
M5: Script defer                → SHIP (with audit)
M13: font-display swap          → SHIP (1-line CSS addition)
```

**Zero risk, additive only, foundational.** These can ship in a single session. If any of them fail: rollback is < 2 minutes each, and failure is invisible to users.

---

### What Ships Next (Session B — After Prototype Passes M8 PASS GATE)

```
M8: Bottom tab navigation       → SHIP after prototype validation
M6: Mobile landing screen       → SHIP same session as M8
M7: Toast reposition            → SHIP same session as M8
M14: will-change on animations  → SHIP same session as M8
```

**Medium risk, prototype-gated.** Do not touch index.html for M8 without passing the PROTOTYPE_SPEC.md M8 PASS GATE.

---

### What Ships After (Session C — After Prototype Passes M9 PASS GATE)

```
M9: Bottom sheets (top 3 modals) → SHIP after prototype validation
M11: Pull-to-refresh + visibility → SHIP same session
```

**Medium risk, prototype-gated.** Keyboard interaction tests in PROTOTYPE_SPEC.md must pass before shipping.

---

### What Ships Later (Session D — When Cache Versioning Is Solved)

```
M10: Service worker + shell cache → SHIP when versioning automated
```

**Highest operational impact for connectivity resilience, but carries the most ongoing maintenance risk. Solve versioning before shipping.**

---

### What Should Wait (Phase 3 — After Phase 1+2 Stable)

```
M17: Command launcher            → Wait until Phase 1+2 in production
M16: Push notifications          → Wait until Michael installs + confirms permission
M15: Swipe-to-reveal rows        → Nice-to-have; schedule when bandwidth allows
```

---

### What Should Never Ship

| Capability | Reason |
|---|---|
| Real-time Supabase WebSocket subscriptions | Overkill for single-user tool; battery drain; complexity without ROI |
| Offline write queue (IndexedDB sync) | High complexity, low ROI for mostly-connected showroom use |
| PWA-to-native bridge (Capacitor/Tauri) | Engineering investment not justified by use case |
| Virtual DOM / React/Vue migration | No performance issue that justifies framework adoption |
| Full offline mode (all data cached) | Data freshness more important than offline access for operational tool |
| Animations that run continuously | Battery drain; no operational value |
| Consumer-style onboarding flows | One user; already knows the tool |

---

## PHASE A READINESS SUMMARY

```
SHIP IMMEDIATELY (Session A):
  ✅ M1  viewport-fit=cover           TRIVIAL | ZERO RISK
  ✅ M2  Safe-area CSS                TRIVIAL | ZERO RISK
  ✅ M3  manifest.json                TRIVIAL | ZERO RISK (placeholder icons OK)
  ✅ M4  Apple meta tags              TRIVIAL | ZERO RISK
  ✅ M5  Script defer                 LOW     | LOW RISK (requires audit)
  ✅ M13 font-display swap            TRIVIAL | ZERO RISK

SHIP AFTER PROTOTYPE VALIDATION (Session B):
  🔷 M8  Bottom tab navigation        MEDIUM  | LOW RISK (additive, sidebar preserved)
  🔷 M6  Mobile landing screen        TRIVIAL | ZERO RISK (blocked on M8)
  🔷 M7  Toast reposition             TRIVIAL | ZERO RISK (blocked on M8)

SHIP AFTER PROTOTYPE VALIDATION (Session C):
  🔷 M9  Bottom sheets                MEDIUM  | LOW RISK (parallel function)
  🔷 M11 Pull-to-refresh              LOW     | ZERO RISK

BLOCKED PENDING DECISION (Session D):
  ⚠️  M10 Service worker              MEDIUM-H | MED RISK (stale cache without versioning)

DEFERRED (Phase 3+):
  ⬜ M17 Command launcher              HIGH    | Medium risk
  ⬜ M16 Push notifications            HIGH    | Blocked on Michael install
  ⬜ M15 Swipe-to-reveal              MEDIUM   | Low risk
```

---

## PRE-SESSION A CHECKLIST

Before the first mobile implementation session begins, confirm:

- [ ] Current `index.html` on `main` branch is the production version (no uncommitted changes)
- [ ] Cloudflare Pages deployment is working (last deploy successful)
- [ ] `accent-os.pages.dev` loads correctly in Safari on iPhone
- [ ] Git branch strategy: implement on `claude/mobile-phase-a-[hash]` or directly on `main` if single-session changes
- [ ] Icon assets available OR confirmed to use placeholder for M3
- [ ] All 5 research docs in `docs/research/` committed and accessible for reference
- [ ] Post-Session A validation plan confirmed: install to home screen, confirm standalone mode, check safe-area

**Mobile planning phase is COMPLETE. Session A is cleared for implementation.**
