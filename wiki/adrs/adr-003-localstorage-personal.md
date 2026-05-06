---
id: adr-003-localstorage-personal
title: ADR-003 — localStorage for Personal-Only Data
type: adr
status: published
weight: 6
tags: [localStorage, personal-data, my-tasks, session, cross-device, AccentOS, architecture, storage]
related: [adr-002-supabase-backend]
created: 2026-05-06
updated: 2026-05-06
---

# ADR-003 — localStorage for Personal-Only Data

## Status

Accepted — first used v6.10.38 (My Tasks module, 2026-05-05)

## Context

Some AccentOS features are genuinely personal: to-do lists, session UI state, module preference overrides. These don't need to sync across devices or be visible to other users. Sending them to Supabase would require a schema migration (M-task), add an async loading step, and burn API calls on data that's already local.

## Decision

Use `localStorage` for data that is:
- Personal (one user, their own browser instance)
- Non-collaborative (no other user needs to read it)
- Not business-critical (losing it doesn't cause data loss that matters)

Key by `accentos_<feature>_<CU.user_id || 'anon'>` to namespace per user per browser.

**Do NOT use localStorage for:**
- Shared business records (deals, quotes, customers, inventory)
- Anything another user or role needs to read
- Financial data (always Supabase for audit trail)

## Consequences

- **Positive**: Instant, synchronous reads/writes — no async, no loading state, no M-task required.
- **Positive**: Zero API calls for personal data.
- **Negative**: Not cross-device. A user's My Tasks on desktop don't appear on mobile.
- **Negative**: Cleared on browser data wipe / incognito.
- **Migration path**: when a feature outgrows localStorage (user asks for cross-device), ship a Supabase table migration (e.g. M30: `user_module_overrides`) and write a one-time local→remote migration function.

## Current localStorage features

| feature | key pattern | data |
|---|---|---|
| My Tasks | `accentos_my_tasks_${uid}` | task objects |
| Module Mode overrides | `accentos_module_overrides` | per-module per-user state |
| Session state | `accentos_session_*` | current user, last page |

## Reference

BUILD_INTELLIGENCE entry: `v6.10.38 My Tasks — localStorage-first`.
