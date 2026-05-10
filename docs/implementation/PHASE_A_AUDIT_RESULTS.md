# Phase A Pre-Integration Audit Results
**Read-only catalog pass — no production changes made**

Audit date: 2026-05-10
Auditor: session-9
Source: Appendix A, `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md`
Files audited: `index.html` (7169 lines), `js/global_search.js`, `ui/tokens.css`

---

## Summary

2 blockers found (Phase B). 3 warnings. No Phase A blockers.
Phase A (flag infrastructure, audit-only work) may proceed.

---

## Check 1 — window.AccentOS in index.html

Command: `grep -n 'window\.AccentOS' index.html`
Result: 0 matches

**CLEAN.** No collision risk with shell's `window.AccentOS` namespace.

---

## Check 2 — aos- class= attribute conflicts

Command: `grep -nE 'class="[^"]*aos-' index.html`
Result: 0 matches

**CLEAN.** No class= attribute collisions.

Note: `aos-` prefix does appear in index.html as sessionStorage key strings
(`aos-jwt`, `aos-api`, `aos-sb-key`, `aos-sb-url`, `aos-chat-mode`). These use
`sessionStorage`, not `localStorage`. Shell uses `localStorage` for `aos-views`
and `aos-recent`. Different API, different scope — **no conflict**.

---

## Check 3 — localStorage aos- key conflicts

Command: `grep -nE "localStorage\.(setItem|getItem)\(['\"]aos-" index.html`
Result: 0 matches

**CLEAN.** Legacy uses sessionStorage only for aos- prefixed keys.

---

## Check 4 — z-index catalog

Legacy hardcoded values in index.html:

| Element | z-index | Shell token at same level |
|---------|---------|--------------------------|
| `.sidebar` (desktop) | 10 | below --z-sidebar (100) |
| `.sb-backdrop` | 99 | below --z-sidebar (100) |
| `.sidebar` (mobile) | 100 | = --z-sidebar (100) |
| `.vp` (detail panel) | 200 | = --z-header (200) |
| `.qa-fab` | 300 | = --z-rail (300) |
| `.qa-menu` | 301 | just above --z-rail |
| `#fb-btn` | 400 | = --z-fab (400) |
| `.fb-panel` | 401 | just above --z-fab |
| `.overlay` (modal backdrop) | 500 | = --z-dropdown (500) |
| `#login-screen` | 1000 | above --z-command (800) |
| inline overlay (line 1855) | 9999 | above all shell tokens |
| inline overlay (line 3609) | 2000 | above --z-command (800) |
| `#toasts` | 9999 | above all shell tokens |

**WARNING — 3 structural collisions at Phase B mount:**
1. Legacy `.vp` (200) = shell header (200) — detail panels may conflict with shell header
2. Legacy `.qa-fab` (300) = shell rail (300) — both elements compete for same z-plane
3. Legacy `.overlay` (500) = shell dropdown (500) — modal backdrops may appear behind shell dropdowns

These do not block Phase A. They require z-index remapping before Phase B mount.
Queued as `qa-03-zindex-remap`.

---

## Check 5 — keydown event listeners in index.html

Command: `grep -nE "addEventListener\(['\"]keydown" index.html`
Result: 1 match

Line 639:
```js
document.addEventListener('keydown', e => {
  if(e.key==='Enter' && !$('app').classList.contains('on')) doLogin();
});
```

**CLEAN.** Scoped to login screen Enter key only. No conflict with shell keyboard handlers.

---

## Check 6 — Cmd+K binding

Command: `grep -nE "(metaKey|ctrlKey).*[\"']k[\"']" index.html`
Result: 0 matches in index.html

**BUT:** `js/global_search.js` lines 403–408 (loaded via index.html at line 7152):

```js
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
    e.preventDefault();
    openGlobalSearch();
  }
});
```

**BLOCKER (Phase B) — Cmd+K conflict confirmed.**
`global_search.js` claims both Ctrl+K and Cmd+K globally. Shell command launcher
also claims Cmd+K. When both are loaded simultaneously in Phase B, last-registered
listener wins — currently `global_search.js` (loaded at line 7152, after page JS).

Resolution path per DEC-01-B (Hybrid): shell owns the hotkey; `global_search.js`
registers its search surface as a module injection into the shell's command palette
rather than opening its own modal. The `document.addEventListener` in global_search.js
must be removed at Phase B, replaced by a shell module registration API call.

Queued as `qa-01-cmdk-deconflict`.

---

## Check 7 — CSS token name collisions

Legacy tokens (all defined in index.html inline `<style>`):

```
--accent, --accent-dark, --accent-soft
--bg, --bg-2, --surface, --surface2
--border, --border-light
--text, --text-2, --text-3
--green, --green-bg, --blue, --blue-bg, --purple, --purple-bg
--red, --red-bg, --yellow, --yellow-bg
--shadow, --shadow-md, --shadow-lg
--radius, --radius-sm
--sidebar-bg, --sidebar-hover, --sidebar-active, --sidebar-col, --sidebar-w
```

Shell token names (all prefixed with semantic categories):
`--layer-*`, `--text-*` (different suffixes), `--gold-*`, `--gray-*`, `--status-*`,
`--z-*`, `--space-*`, `--border-*` (different suffixes), `--shadow-*` (different suffixes)

**Partial overlap risk: `--text-*` and `--shadow-*` and `--border-*` prefixes**

- Legacy `--text` / shell `--text-primary`, `--text-body`, etc. — different names, no collision
- Legacy `--shadow`, `--shadow-md`, `--shadow-lg` / shell `--shadow-card`, `--shadow-elevated`, etc. — different names, no collision
- Legacy `--border` / shell `--border-default`, `--border-subtle`, `--border-strong` — different names, no collision

**CLEAN.** Zero token name collisions. Namespaces are fully distinct.

---

## Check 8 — viewport-fit=cover

Command: `grep -n 'name="viewport"' index.html`
Result line 5:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Shell prototype has:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

**BLOCKER (Phase B) — viewport-fit=cover missing.**
Shell uses `env(safe-area-inset-*)` CSS in multiple components (bottom bar, notif panel,
FAB positioning). Without `viewport-fit=cover` in index.html's viewport meta, all
safe-area-inset values resolve to 0 on iOS — shell content clips under notch/Dynamic
Island. Must be added to index.html before Phase B mount.

This is a one-attribute change to a frozen file. Requires Phase A authorization.
Queued as `qa-02-viewport-fit`.

---

## Font conflict check

Legacy: `'Outfit', sans-serif` (body) + `'DM Mono', monospace` (code)
Shell: uses CSS custom properties `--font-sans` and `--font-mono` (values TBD in tokens.css)

Check needed at Phase B: confirm shell `--font-sans` resolves to `'Outfit'` or is
visually compatible. Not a blocker — fonts load independently.

---

## QA FAB — Cmd+K label (informational)

Line 465: The legacy QA menu displays `⌘K` as a label next to the Search item.
This is UI text only — clicking the item calls `openGlobalSearch();toggleQA()`.
No additional keyboard binding. The `⌘K` label will become inaccurate once the
hybrid shell launcher is the canonical Cmd+K surface. Text update needed at Phase B.

---

## Script load order (informational)

`global_search.js` loads at line 7152 of 7169 — near end of script chain.
Shell JS (`accentos-shell.js`) will be side-loaded separately in Phase B.
Load order: if shell loads before page scripts, shell's Cmd+K listener registers
first and global_search.js overrides it. If shell loads after, shell takes precedence.
This must be explicit, not accidental. Queued under `qa-01-cmdk-deconflict`.

---

## Blocker Queue Summary

| ID | Severity | Blocks | Description |
|----|----------|--------|-------------|
| qa-01-cmdk-deconflict | HIGH | Phase B | global_search.js Cmd+K listener conflicts with shell launcher |
| qa-02-viewport-fit | MEDIUM | Phase B | viewport-fit=cover missing from index.html |
| qa-03-zindex-remap | MEDIUM | Phase B | 3 z-index collisions between legacy and shell layers |

No Phase A blockers. Pre-Phase-A audit: PASSED.
