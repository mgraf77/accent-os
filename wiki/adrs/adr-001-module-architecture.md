---
id: adr-001-module-architecture
title: ADR-001 — Single-File HTML with External JS Modules
type: adr
status: published
weight: 7
tags: [architecture, javascript, modules, single-file, index.html, file-split, lazy-load, AccentOS]
related: [adr-002-supabase-backend, adr-004-inline-onclick]
created: 2026-05-06
updated: 2026-05-06
---

# ADR-001 — Single-File HTML with External JS Modules

## Status

Accepted — shipped v6.10.12 (2026-05-04)

## Context

AccentOS started as a single `index.html` file with all JavaScript inlined. As modules grew (Track 1–5), file size reached 829KB. The file was approaching a point where edits were risky (large old_string replacements), diffs were hard to review, and the browser parse cost was measurable on mobile.

Two options were considered:

1. **ES module refactor** (`import`/`export`) — would require rewriting every cross-module reference (~200 call sites), introducing a bundler, and changing the deployment model.
2. **External script files** (`<script src="js/module.js">`) — modules stay as globals on `window`, the shell `index.html` loads them after the inline `</script>` block, zero user-facing change.

## Decision

Use external `<script src="js/<name>.js?v=...">` tags for each module. Inline JavaScript remains for shared helpers (esc, $, sbFetch, openModal, goTo, etc.) that every module depends on. Each module file declares its own globals (`let CUSTOMERS = []`) and they attach to `window` identically to inline declarations.

True lazy-load (defer until tab activation) was considered but rejected — it would add 50+ LOC of loader infrastructure and introduce race conditions where the Daily Brief (always-on) reads CUSTOMERS/INVENTORY before their modules activate.

## Consequences

- **Positive**: index.html dropped from 829KB → 680KB (-18%). Each module file is 8–26KB. Edits to a module no longer require touching index.html.
- **Positive**: Multi-module extractions done via `awk/sed` on line ranges — much faster than Edit tool for 100+ line blocks.
- **Negative**: All modules load on every page visit (no lazy-load). For the current 20-module scale this is negligible; at 50+ modules it may warrant revisiting.
- **Rule**: New module = new `js/<name>.js` file + `<script src>` tag in index.html after the inline block. Don't add code back into index.html after the split.

## Reference

BUILD_INTELLIGENCE entry: `v6.10.12 file split` (lines 46–49).
