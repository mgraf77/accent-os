---
id: adr-005-append-only-observations
title: ADR-005 — Append-Only for Observation/Snapshot Data
type: adr
status: published
weight: 6
tags: [database, append-only, time-series, observations, snapshots, kpi, employee-scores, competitor-prices, AccentOS, architecture, postgres]
related: [adr-002-supabase-backend, supabase-source]
created: 2026-05-06
updated: 2026-05-06
---

# ADR-005 — Append-Only for Observation/Snapshot Data

## Status

Accepted — applied to `kpi_snapshots`, `employee_scores`, `competitor_prices`, `probability_model_log`

## Context

Several AccentOS tables represent observations over time rather than current state. For KPI snapshots, employee scores, and competitor prices, the historical series is the actual value — knowing that a vendor price dropped from $120 to $99 over three months is more valuable than knowing the current price is $99.

Two options:
1. **Upsert (keep latest)** — on_conflict update overwrites the previous value. Simple, but destroys history.
2. **Append-only (insert each observation)** — accumulates all observations. "Latest value" computed in JS via `reduce into map`. Enables trend analysis.

## Decision

Append-only INSERT for all observation/snapshot tables. Latest-per-pair computed client-side.

```js
// Append
await sbFetch('competitor_prices', 'POST', { sku, competitor, price, observed_at: new Date() });

// Get latest per (sku, competitor)
const latest = Object.values(
  allPrices.reduce((acc, row) => {
    const key = `${row.sku}|${row.competitor}`;
    if (!acc[key] || row.observed_at > acc[key].observed_at) acc[key] = row;
    return acc;
  }, {})
);
```

## Exceptions

User-editable records (vendor notes, customer profile, deal stage) use upsert — the latest value IS the correct value, and accumulating edits would create noise.

`kpi_snapshots` uses `on_conflict(kpi_key, snapshot_date)` to make "re-snapshot today" idempotent — same day overwrites rather than duplicates.

## Consequences

- **Positive**: Free time series on all observation tables. Trend analysis (score drop in 90d, price drift) available without schema changes.
- **Positive**: No data loss if a user re-observes a value.
- **Negative**: Table grows unboundedly. For current scale (hundreds of rows/month) this is negligible; at millions of rows, consider partitioning or archival.
- **Rule**: Any table that represents "a measurement at a point in time" → append-only. Any table that represents "current state of an entity" → upsert.

## Reference

BUILD_INTELLIGENCE entry: `5.14 append-only observations`.
