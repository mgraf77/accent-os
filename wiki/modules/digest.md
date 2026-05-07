---
type: module
slug: digest
title: Digest Module (Daily Brief Email)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, my-tasks, customers, pipeline-analytics, vendor-scoring]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Digest Module

**File**: `js/digest.js`
**Pattern**: pure compute over inline-shell globals → modal with copy / email actions
**Sidebar route**: none — invoked from Daily Brief topbar button

## Purpose

Plaintext snapshot of the role-aware Daily Brief plus a one-line Pipeline + Vendors KPI summary. Output is paste-ready for email, Slack, or Teams. No new schema. Reuses `computeDailyBrief(role)` from the inline shell — that function owns the brief tiles; digest only formats them.

## Functions

| function | role |
|----------|------|
| `generateDailyDigest()` | reads `CU.role`, calls `computeDailyBrief(role)`, formats lines: title + role + 60-char rule + bulleted brief items (label, value, HTML-stripped detail) + Pipeline KPI line + Vendors KPI line + footer. Falls back to `🎉 nothing requiring attention` when brief is empty |
| `showDailyDigest()` | opens modal containing `<textarea id="dd-text">` with the generated text + Close / Copy / Email buttons |
| `_ddCopy()` | `navigator.clipboard.writeText` → toast `Copied` |
| `_ddEmail()` | builds `mailto:` with `subject = "AccentOS Daily Brief — <date>"` + URL-encoded body |

## Read dependencies

- `CU.role` — current user role for role-aware brief
- `computeDailyBrief(role)` — shell function returning `[{label, value, detail?}]`; defined in `index.html`, not here
- `DEALS` — for active count across `[lead, qualified, quoted, negotiating]` and won count + summed `value`
- `VD` — vendor list; calls `weightedScore(v)` per vendor for the avg-score line (see [[vendor-scoring]])

## Output shape

```
AccentOS Daily Brief — Wednesday, May 7, 2026
Generated for Owner role
────────────────────────────────────────────────────────────

• <label>: <value>
   <detail with HTML stripped>
…
────────────────────────────────────────────────────────────
Pipeline: 12 active · $87,420 · 5 won
Vendors: 178 tracked · avg score 7.2

— Sent from AccentOS · accent-os.pages.dev
```

## Shell touchpoints

- Topbar button on the Daily Brief surface (calls `showDailyDigest()`)
- Modal helpers: `openModal`, `closeModal`, `toast`, `esc`, `$` (all from inline shell)
- No `PAGE_META`, no sidebar entry, no dispatcher route
- Loaded after the inline shell so `computeDailyBrief` is in scope

## Failure modes

- Missing `computeDailyBrief` → empty items list, falls through to the `🎉` line
- Missing `DEALS` / `VD` → KPI lines simply omitted (guarded by `typeof !== 'undefined'`)
- Clipboard API blocked (insecure context) → copy silently fails; user can hand-select textarea

## Related

[[ADR-002]] · [[ADR-004]] · [[my-tasks]] · [[customers]] · [[pipeline-analytics]] · [[vendor-scoring]]
