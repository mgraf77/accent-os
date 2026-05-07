# KPI deviation thresholds — daily-brief-composer

> SKILL.md Step 0 reads this for the "what counts as a deviation worth surfacing" cutoff in the KPI deviations section. Defaults below; override per group as Michael tunes the noise floor.

> Threshold semantics: a KPI is surfaced when `abs(wow_delta_pct) >= threshold`. Lower threshold = more sensitive = more rows surfaced.

---

## Default thresholds by KPI group

These mirror KPI_CATALOG.md group taxonomy.

| Group | Group name | WoW threshold | Rationale |
|-------|------------|---------------|-----------|
| F | Financial / executive | 15% | Owner-level sensitivity; finance KPIs are high-trust, small swings matter |
| $ | Cash / Profit First | 20% | Cash flow has more weekly noise; require larger swing |
| S-* | Sales (all sub-groups) | 20% | Weekly sales noise is high (rep PTO, deal close timing) |
| L | Pipeline / lead health | 15% | Leading indicators — surface earlier |
| C-* | Customer / segment | 25% | Segment counts are smaller; require bigger swing for signal |
| P | Product mix | 20% | Mix shifts week-over-week routinely |
| X | Customer experience / service | 15% | Service quality drift surfaces fast |
| O-* | Operations / Warehouse / Delivery / Install | 20% | Operational noise tolerated |
| I-* | Inventory + Purchasing | 15% | Stockouts and PO slippage matter early |
| M-* | Marketing / digital / SEO + GMC | 15% | Funnel and acquisition deserve early surfacing |
| V | Vendor / supplier | 20% | Vendor scores are composites — small swings expected |
| H | Workforce / HR | 25% | Slow-moving by nature |
| MGR | Manager-specific composites | 15% | Composite KPIs amplify sub-noise; flag earlier |

---

## Per-role override layer

Some roles want quieter or noisier briefs. Applied on top of group threshold.

| Role | Multiplier | Effect |
|------|------------|--------|
| Owner | 1.0× | use group defaults |
| Sales | 1.3× | quieter (only big swings; reps don't need finance noise) |
| Marketing | 1.0× | use group defaults; never lower than 10% on Group M-* |
| Ops | 1.2× | slightly quieter on non-O/I groups |

Compute: `effective_threshold = group_threshold × role_multiplier`. Round to nearest 1%.

Example: Sales role + Group F (Financial) = 15 × 1.3 = 19.5 → round to 20%.

---

## Anomaly fast-path (overrides threshold)

Always surface, regardless of WoW threshold:

1. Any KPI with `value = 0` when `value_last_week > 0` (collapse).
2. Any KPI flagged by `kpi-data-audit` as having broken upstream data.
3. Any KPI with `abs(wow_delta_pct) >= 50%` regardless of role/group.
4. Any KPI with consecutive 3-week directional drift (3 weeks in same direction with cumulative |Δ| ≥ 20%).

These show up in the `kpi_dev` section with a leading `!` marker — e.g. `! M-FN-conversion ↓62% WoW — collapse, check tracking`.

---

## Tuning protocol

If Michael says "the brief is too noisy" or "I'm missing things":

1. Identify the offending group (which KPIs are spamming or missing).
2. Edit the row in the table above. Bump threshold +5% (less sensitive) or −5% (more sensitive).
3. Note the change date in a one-line `_tuned: YYYY-MM-DD by Michael — [reason]_` comment under the table.
4. No SKILL.md change needed — skill re-reads this file each run.

---

## Tuning history

_(append-only log of threshold tuning. Newest at top.)_

- _2026-05-07: initial defaults seeded from KPI_CATALOG group structure._
