# Phase A Integration Risk Catalog
**Read-only survey — no implementation**

Survey date: 2026-05-10
Scope: index.html, js/ modules, ui/ shell files
Prior: pre-Phase-A audit (2026-05-10, commit 822ad73)

---

## Summary

9 risks identified. 4 HIGH, 3 MEDIUM, 2 LOW.
2 must be resolved BEFORE Phase A mount (data-roles, btn class).
3 are Phase B decisions/verifications.
4 are documentation/bridge patterns for later.

---

## RISK-01 — data-roles attribute collision (HIGH — blocks Phase A mount)

Legacy `applyRoleVisibility()` (index.html:588) does:
```js
document.querySelectorAll('[data-roles]').forEach(el => {
  const allowed = el.getAttribute('data-roles').split(',').map(s=>s.trim());
  el.style.display = (!allowed.length || allowed.includes(role)) ? '' : 'none';
});
```

Shell prototype uses `data-roles` on nav items with lowercase values:
`data-roles="owner,manager"`.

Legacy role values come from database: `'Owner'`, `'Admin'`, `'Manager'`, etc.
Shell values are lowercase: `'owner'`, `'manager'`, `'sales'`, etc.

When `applyRoleVisibility('Owner')` runs, it reads ALL `[data-roles]` in the
document — including shell nav items. Shell items with `data-roles="owner"` would
NOT match `'Owner'` (case mismatch) — shell nav would be entirely hidden.

Even if case were fixed, legacy `applyRoleVisibility` would override shell's own
visibility logic by directly setting `style.display` on shell elements.

**Resolution required before mount:** Rename shell's attribute to `data-aos-roles`
throughout the shell HTML and JS. Shell manages its own visibility; legacy manages
its own. Scoped by attribute name, not document scope.

Queued: `qa-07-data-roles-collision`

---

## RISK-02 — font system mismatch (HIGH — visual regression at Phase B)

Legacy loads: `Outfit` + `DM Mono` from Google Fonts (index.html:7-8).
Shell token: `--font-sans: 'Inter', system-ui, ...` (tokens.css:96).

When shell mounts inside index.html, shell elements render in Inter while legacy
elements render in Outfit. Both are geometric sans-serif but noticeably different
at body sizes. Users will see a mixed typeface in Phase B before Phase F cleanup.

Three options:
1. Change `--font-sans` to `'Outfit'` during coexistence (cheapest, no new load)
2. Add Inter to index.html `<link>` and accept both fonts loading (cleanest long-term)
3. Accept visual difference as a known Phase B state

Decision needed before Phase B. Affects tokens.css and possibly the integration PR.
Does not block Phase A (flag infrastructure, no visible shell yet).

Queued: `qa-04-font-system-decision`

---

## RISK-03 — `.btn` class CSS leakage (MEDIUM — Phase A prep)

Legacy (index.html:101):
```css
.btn { display:inline-flex; font-family:'Outfit'; font-size:13px; ... }
```

Shell prototype uses `.btn`, `.btn-primary`, `.btn-ghost` classes on buttons.
`accentos-shell.css` does NOT define `.btn` — all shell button styles are in the
prototype's inline `<style>` block, which does not exist in the production shell.

When shell is mounted in Phase A, `.btn` elements inside `.accentos-shell` will
inherit legacy `.btn` styles: Outfit font, legacy colors, legacy border-radius.
Shell button visual identity breaks.

**Resolution:** Add `.accentos-shell .btn`, `.accentos-shell .btn-primary`,
`.accentos-shell .btn-ghost` selectors to `accentos-shell.css` before mount.
Or rename shell buttons to `.aos-btn` for full scope isolation.

Queued: `qa-06-btn-class-scoping`

---

## RISK-04 — auth state bridge: window.CU (HIGH — Phase B architecture)

Legacy stores auth user as `let CU = null` (index.html:529). After login:
`CU = { user_id, email, name, role, initials, jwt }`.

Shell prototype has a hardcoded role switcher (`<select id="roleSelect">`).
In Phase B, the shell must derive its displayed role from `window.CU.role`,
not its own local switcher. The prototype switcher must be removed or wired
to `window.CU.role` as a read-only display.

`module_modes.js` also reads `CU.role` for `canSeeModule()`. Shell navigation
that triggers `goTo()` will go through the mode guard automatically (correct).
Shell navigation that stays within the shell (future shell-native modules) will
NOT go through the guard — the guard only wraps `window.goTo`.

**Resolution pattern for Phase B:** Shell reads `window.CU` for identity.
Shell navigation to legacy modules calls `window.goTo()` (uses mode guard).
Shell navigation to shell-native modules implements its own `canSeeModule()` check.

Queued: `qa-08-auth-state-bridge`

---

## RISK-05 — navigate/goTo bridge (HIGH — Phase B architecture)

Shell prototype defines `navigate(page)` for its own module routing.
Legacy defines `goTo(page)` for its module routing. `module_modes.js` wraps
`window.goTo` with a permission guard (`_wrapGoToWithModeGuard`).

In Phase B, shell navigate() must call `window.goTo(page)` for legacy-hosted modules
to preserve the permission guard. If shell calls its own navigate() exclusively,
module mode restrictions are silently bypassed for any path going through the shell.

Additionally, `module_modes.js` fires `CustomEvent('aos:navigate', {...})` on `.ni`
nav item clicks. This is a custom event the shell should listen to in Phase B for
sync (e.g., legacy nav action should update shell active-nav highlight).

**Resolution pattern for Phase B:** Document bridge contract. Not a Phase A task.

Queued: `qa-09-navigate-goto-bridge`

---

## RISK-06 — body overflow:hidden iOS fixed-position risk (MEDIUM — Phase B verification)

Legacy (index.html:27): `body { height:100vh; overflow:hidden; }`.

On iOS Safari, `overflow:hidden` on `<body>` is known to interfere with
`position:fixed` elements in certain scroll contexts. Shell has critical fixed
elements: `.aos-header`, `.aos-fab`, `.aos-bottom-bar`, command launcher, rail.

Standard behavior: `position:fixed` escapes overflow clipping in the spec.
iOS Safari behavior: may not escape when `overflow:hidden` is set on `<body>`
directly (as opposed to a scroll container). Shell's bottom bar uses
`env(safe-area-inset-bottom)` which further depends on correct viewport handling.

**Resolution:** Test on iPhone Safari in Phase B. If regression confirmed, isolate
shell in its own scroll root with `overflow:hidden` on the `.accentos-shell` element
rather than relying on `<body>`. Shell CSS already has `min-height:100dvh` and
could be made self-contained scroll root without touching `<body>`.

Queued: `qa-05-body-overflow-ios`

---

## RISK-07 — drag-drop event collision (LOW — likely safe, verify)

`js/csv_import.js` registers:
```js
document.addEventListener('dragover', e => {
  if(!e.dataTransfer.types.includes('Files')) return;
  if(findActiveCsvInput()) { e.preventDefault(); }
});
document.addEventListener('drop', e => { ... });
```

Shell prototype pipeline drag uses `dataTransfer.setData('text/plain', dealId)`.
CSV handler checks for `'Files'` type — shell drag uses `'text/plain'`.
CSV handler's `findActiveCsvInput()` looks for a CSV input on the current page.

**Assessment:** No collision in current implementation. CSV handler ignores non-File
drags; shell drag-drop ignores CSV inputs. Both can coexist.

**Verify in Phase B:** Confirm `findActiveCsvInput()` doesn't match any shell element.
No queue item needed — document here.

---

## RISK-08 — internal_meetings capture click (LOW — safe)

`js/internal_meetings.js` registers a capture-phase click listener:
```js
window.addEventListener('click', e => {
  const ni = e.target.closest('.ni');
  if(ni && !ni.getAttribute('onclick').includes("'internalmeetings'"))
    imShowBubble(false);
}, true);
```

Shell nav items use `.aos-nav-item` class, NOT `.ni`. Legacy nav items use `.ni`.
This listener will not match shell nav clicks.

**Assessment:** Safe. No queue item needed.

---

## RISK-09 — legacy `* { margin:0; padding:0 }` reset (LOW — safe, shell overrides)

Legacy (index.html): `*{box-sizing:border-box;margin:0;padding:0;}` — document-scope.
Shell (accentos-shell.css:15-21): `.accentos-shell *, .accentos-shell *::before, ...`
— scoped reset with same rules.

Shell's scoped reset is equally specific and both declare the same values.
No visual difference.

**Assessment:** Safe. No queue item needed.

---

## Complete Risk Register

| ID | Severity | Blocks | Description | Status |
|----|----------|--------|-------------|--------|
| RISK-01 | HIGH | Phase A mount | data-roles attribute collision with legacy applyRoleVisibility | qa-07 |
| RISK-02 | HIGH | Phase B visual | font mismatch Outfit vs Inter | qa-04 |
| RISK-03 | MEDIUM | Phase A mount | .btn class not scoped in accentos-shell.css | qa-06 |
| RISK-04 | HIGH | Phase B arch | window.CU auth state bridge | qa-08 |
| RISK-05 | HIGH | Phase B arch | navigate() vs goTo() bridge + mode guard bypass | qa-09 |
| RISK-06 | MEDIUM | Phase B iOS | body overflow:hidden may clip shell fixed elements | qa-05 |
| RISK-07 | LOW | None | drag-drop CSV vs shell pipeline — assessed safe | no item |
| RISK-08 | LOW | None | capture click listener .ni vs .aos-nav-item — safe | no item |
| RISK-09 | LOW | None | universal CSS reset — shell override handles it | no item |

---

## Recommended Phase A Execution Order

Phase A = feature flag scaffold + shell CSS/JS import into index.html + NO visible shell.
The shell remains hidden behind `isEnabled('shell-phase-a') === false`.

### Pre-mount (on this branch, files not frozen):

Step 1: `qa-07` — rename `data-roles` → `data-aos-roles` in shell HTML/JS
Step 2: `qa-06` — add scoped `.accentos-shell .btn*` rules to accentos-shell.css
Step 3: `qa-04` decision — set `--font-sans` to Outfit or accept mismatch (1 token change)
Step 4: R-03 — feature flag scaffold (`window.AccentOS.flags.isEnabled()` stub)

### Phase A mount (requires dec-02-phase-a-auth, touches frozen files):

Step 5: Add `viewport-fit=cover` to index.html viewport meta (`qa-02`)
Step 6: Add `<link>` tags for tokens.css and accentos-shell.css to index.html `<head>`
Step 7: Add `<script src="ui/accentos-shell.js">` AFTER all legacy scripts (ensures shell Cmd+K registers last, wins per DEC-01-B hybrid)
Step 8: Add `<div class="accentos-shell" id="aosShell" style="display:none">` as last child of `<body>`
Step 9: Wire flag check: `if(AccentOS.flags.isEnabled('shell-phase-a')) $('#aosShell').style.display=''`

### Post-mount verification (before any Phase B):

Step 10: `qa-05` — iOS overflow:hidden test on real device
Step 11: Confirm legacy applyRoleVisibility does not touch `[data-aos-roles]`
Step 12: Confirm shell Cmd+K overrides global_search.js listener
Step 13: Boot smoke pass
Step 14: Michael sign-off on Phase A visual → authorize dec-02
