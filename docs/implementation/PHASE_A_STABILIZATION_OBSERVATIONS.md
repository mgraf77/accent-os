# Phase A Stabilization Observations
**Period:** 2026-05-10 — 7-day window post Phase A mount
**Scope:** Read-only survey. No implementation. No architecture changes.
**Commit ref:** 7f754f9 (Phase A mount)

---

## OBS-01 — Cmd+K double-open (HIGH — flag ON only)

**Finding:** Both `js/global_search.js:403` and `ui/accentos-shell.js:201` register
`document.addEventListener('keydown', ...)` in **bubble phase** (no capture flag).
Neither calls `e.stopPropagation()`. Registration order: global_search first
(loads earlier), shell last. In bubble phase, both fire on same Cmd+K keystroke.

**Behavior with flag ON:** `openGlobalSearch()` fires first → legacy modal opens.
`openCommandLauncher()` fires second → shell backdrop opens. Result: both open
simultaneously. User sees legacy search modal on top of shell command backdrop.

**Behavior with flag OFF:** Shell's Cmd+K handler still registers (init() runs
regardless of flag). `.aos-command-backdrop` not in DOM → `openCommandLauncher()`
is a no-op. **Flag-OFF is safe.** Only global search opens.

**Conclusion:** Flag-OFF behavior correct. Flag-ON has UX defect (double-open).
Already queued as qa-01-cmdk-deconflict. Resolution per DEC-01-B: remove/guard
`global_search.js` Cmd+K listener before Phase B. **No action in Phase A.**

---

## OBS-02 — Shell JS init runs unconditionally regardless of flag (LOW — observed)

**Finding:** `accentos-shell.js` calls `init()` on DOMContentLoaded regardless
of `isEnabled('shell-phase-a')`. Registers 3 keyboard handlers, reads localStorage
`aos-sidebar-collapsed` and `aos-mode`, queries DOM for `.aos-sidebar` etc.

**Flag-OFF behavior:**
- DOM queries return null → all guarded with null checks → no errors
- localStorage reads: benign (only applies to shell elements that don't exist)
- Keyboard handlers: register successfully, Cmd+K handler is inert (backdrop not in DOM)

**Flag-OFF is safe** but shell JS has invisible runtime cost on every page load.
Observation only — acceptable for Phase A. Phase B may want an early-exit guard
`if(!AccentOS.flags.isEnabled('shell-phase-a')) return;` in init().

---

## OBS-03 — Legacy z-index values exceed shell command layer ceiling (MEDIUM — Phase B)

Legacy hardcoded values above shell's `--z-command: 1800`:

| Element | z-index | Line | Context |
|---------|---------|------|---------|
| `#toasts` | 9999 | 162 | Fixed toast notifications |
| Inline overlay (quote/bulk) | 9999 | 1857 | Dynamic modal overlay |
| Inline overlay (price form) | 2000 | 3611 | Vendor pricing form overlay |

With flag OFF (Phase A): no impact. Shell not visible.
With flag ON (Phase B): toast container and these specific overlays will render
**above** the shell command launcher. Toasts above Cmd+K is likely acceptable
(toasts are transient). The 2000 and 9999 inline overlays could occlude shell
command launcher if triggered simultaneously.

**Not a Phase A concern.** Document for Phase B integration pass.
Queued as part of qa-03 notes — no new queue item needed.

---

## OBS-04 — [data-mode] CSS selectors unscoped in accentos-shell.css (LOW — latent)

**Finding:** Lines 1397–1404 of `ui/accentos-shell.css` use attribute-root selectors:
```css
[data-mode="focus"] .aos-sidebar { ... }
[data-mode="readonly"] * { cursor: default !important; }
```

The root `[data-mode="*"]` is NOT scoped to `.accentos-shell`. Matches any element
in the document with a `data-mode` attribute.

**Currently safe:** Zero `data-mode` usage in `js/` or `index.html` (confirmed by grep).
Secondary selectors (`.aos-sidebar`, `.aos-header`, etc.) limit visual impact to
shell elements even if root selector matches a legacy element.

**Phase B risk:** If any Phase B implementation adds `data-mode` to a legacy wrapper
element, `[data-mode="readonly"] * { cursor: default !important }` would apply
to ALL that element's children. Hidden regression vector.

**Recommended fix (before Phase B):** Scope all `[data-mode]` rules:
```css
.accentos-shell[data-mode="readonly"] * { cursor: default !important; }
```
(1-line change per rule × 8 rules. Low effort, eliminates latent risk.)

---

## OBS-05 — Inter font not loaded — shell renders in system-ui (LOW — known)

**Finding:** `--font-sans: 'Inter', system-ui, ...` in tokens.css. Inter is not
in index.html `<link>` tags (only Outfit + DM Mono). When shell renders (flag ON),
shell elements display in system-ui (San Francisco on macOS, Segoe UI on Windows).

**Phase A:** Shell hidden — no impact.
**Phase B:** Shell renders in system-ui, not Inter. Known per qa-04 decision
(Michael chose Inter but did not authorize adding the `<link>` tag in Phase A).
Shell renders fine in system-ui; visual fidelity improves if Inter `<link>` is
added at Phase B authorization.

**Not a defect.** Document as known Phase B visual state.

---

## OBS-06 — CSS payload on every page load regardless of flag (LOW — performance)

**Finding:** `tokens.css` (147 lines) + `accentos-shell.css` (1,451 lines) load
and parse on every page request, flag ON or OFF.

**CSS namespace:** Zero collision with legacy vars (confirmed). Shell `:root`
tokens add ~31 new custom properties globally — no shadowing of legacy names.

**Render impact with flag OFF:** `.accentos-shell` div is `display:none`, so
no shell elements are laid out or painted. CSS parse cost only.

**Estimated impact:** ~1,600 lines of modern CSS. Parse time <5ms on desktop.
Mobile low-end devices may add 10–20ms to parse. Not observable to users.
No action required for Phase A stabilization.

---

## OBS-07 — Module mode guard timing race with shell navigation (LOW — Phase B)

**Finding:** `module_modes.js` wraps `window.goTo` inside `applyModuleModesAfterHydrate()`,
which is called after Supabase hydration completes (async). Shell registers
keyboard/nav handlers on `DOMContentLoaded` — before hydration.

**Phase A:** Shell is hidden, no navigation through shell. Not a current risk.

**Phase B hidden coupling:** If user triggers shell navigation before hydration
completes, `window.goTo` exists but is NOT yet wrapped by `_wrapGoToWithModeGuard`.
Navigation succeeds but bypasses module permission check silently.

Window of vulnerability: time between DOMContentLoaded and Supabase hydration
(typically 200–800ms on production). Low probability but non-zero.

**Not a Phase A concern.** Document for qa-09-navigate-goto-bridge resolution.

---

## OBS-08 — Flag gate: shell div children from future Phase B could leak (LOW — latent)

**Finding:** Phase A shell div: `<div id="aosShell" class="accentos-shell" style="display:none"></div>`
Currently empty — no children. `display:none` completely hides all children from
layout and paint.

**Phase B risk pattern:** If Phase B injects shell children before the flag check
runs (e.g., shell JS builds DOM on DOMContentLoaded), and flag resolves to OFF,
`display:none` on the parent hides everything correctly. But any shell JS that
reads child element dimensions (offsetWidth etc.) would get 0 — potential silent
failures if shell JS assumes elements are visible after init.

**Currently safe.** Phase B integration must ensure shell DOM-build guards behind
flag state, not just the parent visibility toggle.

---

## Skill Candidate Patterns (observation only — no build)

These execution patterns recurred with high frequency and low variance:

| Pattern | Occurrences | Effort saved | Candidate name |
|---------|-------------|--------------|----------------|
| Queue item close: status → updated → index → commit | 6× this session | ~8 min/close | `queue-close` |
| Verified commit: add → commit → smoke → push | 9× this session | ~5 min/commit | `verified-commit` |
| Authorization diff preview: read frozen → find insertion → produce diff | 1× (recurs per phase) | ~20 min/phase | `phase-diff-preview` |
| Integration risk audit: grep collision vectors → catalog → queue items | 2× this session | ~40 min/audit | `integration-risk-audit` |
| Phase gate check: read blockers → evaluate ready → report status | 4× this session | ~10 min/check | `gate-status` |

**Strongest candidate for first skill:** `verified-commit` — highest frequency,
lowest variance, zero decision-making required. Pure mechanical sequence.

**Highest-leverage candidate:** `integration-risk-audit` — most time saved per
invocation, directly prevents Phase B defects, structured enough to template.

**DO NOT BUILD YET.** Identification only per stabilization posture.

---

## Summary Table

| ID | Severity | Phase | Description | Action |
|----|----------|-------|-------------|--------|
| OBS-01 | HIGH | B (flag ON) | Cmd+K double-open — both handlers fire | qa-01 queued |
| OBS-02 | LOW | A | Shell JS init unconditional — inert but present | Document only |
| OBS-03 | MEDIUM | B | Legacy z-index 2000/9999 above shell command layer | Document for Phase B |
| OBS-04 | LOW | B | [data-mode] CSS unscoped — latent regression vector | Fix before Phase B |
| OBS-05 | LOW | B | Inter not loaded — shell renders system-ui | Known state |
| OBS-06 | LOW | A | 1.6k CSS lines parse every load regardless of flag | Acceptable |
| OBS-07 | LOW | B | Mode guard wrap races with shell nav on hydration | qa-09 bridge |
| OBS-08 | LOW | B | Shell div children could mis-init if flag OFF during Phase B build | Document |

**Phase A is stable.** No immediate action required.
OBS-04 is the only item worth fixing before Phase B authorization — 8-line CSS change,
no frozen files. All others are either already queued or Phase B concerns.
