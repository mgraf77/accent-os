---
id: adr-004-inline-onclick
title: ADR-004 — Inline onclick="" Handlers
type: adr
status: published
weight: 5
tags: [javascript, onclick, handlers, events, inline, architecture, AccentOS, pattern]
related: [adr-001-module-architecture, adr-003-localstorage-personal]
created: 2026-05-06
updated: 2026-05-06
---

# ADR-004 — Inline onclick="" Handlers

## Status

Accepted — used throughout AccentOS since initial build

## Context

AccentOS renders UI via `el.innerHTML = ...` string templates. Adding event listeners via `addEventListener` after each `innerHTML` write requires tracking which elements exist after each render, managing listener cleanup on re-render, and writing separate JS to bind them. This is manageable with a framework (React/Vue) but adds boilerplate in vanilla JS.

The alternative — inline `onclick="handlerFn(arg)"` — works because the module globals (handler functions) are already on `window` and the browser evaluates the string in the global scope.

## Decision

Use inline `onclick="handlerFn(args)"` for all user action handlers in dynamically rendered HTML. Named global handler functions (not arrow-function IIFEs) are the canonical pattern.

**Rule**: Never use arrow-function IIFEs in inline handlers that reference `this`:
```html
<!-- BAD: 'this' is the global, not the input -->
<input onchange="(e => { /* this doesn't work */ })()">

<!-- GOOD: named function, 'this' is the element -->
<input onchange="onVendorStatusChange(this, '${id}')">
```

## Consequences

- **Positive**: Zero boilerplate for event binding — no `querySelector` + `addEventListener` dance.
- **Positive**: Functions are always available because they're global — no timing/scope issues.
- **Negative**: Long inline strings can get hard to read. Mitigated by keeping handler functions short and named semantically.
- **Negative**: Content Security Policy (CSP) strict-mode would block `eval`-style inline handlers. Acceptable for AccentOS's current internal deployment.
- **Rule**: Cross-module calls in handlers use `typeof X === 'function'` guard to handle load-order edge cases.

## Reference

BUILD_INTELLIGENCE entry: `0.2.B Settings Users panel` (inline handler IIFE shadow bug).
