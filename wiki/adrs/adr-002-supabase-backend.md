---
id: adr-002-supabase-backend
title: ADR-002 — Supabase as Primary Backend
type: adr
status: published
weight: 8
tags: [supabase, backend, database, postgres, REST, RLS, auth, persistence, AccentOS, architecture, decision, why-supabase, firebase, chose]
related: [adr-003-localstorage-personal, adr-005-append-only-observations, supabase-source]
created: 2026-05-06
updated: 2026-05-06
---

# ADR-002 — Supabase as Primary Backend

## Status

Accepted — in use from v6.9.7 (2026-05-04)

## Context

AccentOS needed a backend that:
- Stores shared data (deals, quotes, customers, inventory) across users and devices
- Provides role-based access control without a custom auth server
- Is deployable immediately with no backend code to write or maintain
- Has a REST API consumable from a vanilla-JS frontend (no build step)

Options considered:
1. **Supabase** — managed Postgres + PostgREST REST API + Auth + RLS
2. **Firebase** — NoSQL, strong ecosystem, but no SQL, no row-level security by role
3. **Custom Express/Node API** — full control, but requires maintenance and a separate deploy
4. **localStorage only** — zero backend, but no cross-device or multi-user support

## Decision

Supabase. All shared data persists via the Supabase REST API (`sbFetch` helper). Auth uses Supabase Auth (JWT). Row-level security policies control access per role. Schema migrations are SQL files in `sql/` run manually by Michael (M-tasks).

## Consequences

- **Positive**: Zero backend code to maintain. New tables = one SQL migration + JS persistence functions. Auth is managed.
- **Positive**: RLS policies enforce role-based reads/writes at the DB layer — the frontend can't bypass them even with DevTools.
- **Positive**: All data is available cross-device and cross-user immediately after sync.
- **Negative**: Schema changes require Michael to run SQL migrations (M-tasks). Can't auto-migrate from Claude Code.
- **Negative**: No offline support. AccentOS requires a network connection for all persistence.
- **Rule**: Use `on_conflict` upsert on all save operations with a natural unique key. Use `DELETE + INSERT` for line items (quotes, PO lines) only when the item count is small (≤20).

## Key implementation patterns

```js
// Standard load
async function sbLoadCustomers() {
  const rows = await sbFetch('customers', 'GET');
  CUSTOMERS = rows || [];
}

// Upsert (on_conflict natural key)
await sbFetch('customers', 'POST', { ...row }, { Prefer: 'resolution=merge-duplicates' });

// Delete
await sbFetch(`customers?id=eq.${id}`, 'DELETE');
```

## Reference

BUILD_INTELLIGENCE entries: `1.1 vendor_scores`, `1.4 CRM`, `3.1 Employees`.
