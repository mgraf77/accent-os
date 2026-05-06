---
id: rfm-segments
title: "RFM Customer Segments"
type: concept
status: published
weight: 7
tags:
  - rfm
  - segments
  - customer
  - recency
  - frequency
  - monetary
  - lifecycle
  - at-risk
  - champion
  - win-back
  - retention
  - CRM
related:
  - sop-002-quote-to-close
  - supabase-source
created: 2026-05-06
updated: 2026-05-06
---

# RFM Customer Segments

RFM (Recency · Frequency · Monetary) is AccentOS's primary method for segmenting the customer base and prioritizing outreach.

## How RFM scores are calculated

Each customer receives a score of 1–5 on each dimension:

| Dimension | Measures | Score 5 = |
|---|---|---|
| **Recency** | Days since last purchase | Bought in last 30 days |
| **Frequency** | Number of orders (lifetime) | 10+ orders |
| **Monetary** | Total revenue (lifetime) | $25,000+ spent |

Scores are computed relative to the full customer population (quintile ranking), so thresholds adjust as the customer base grows.

## Segment definitions

| Segment | RFM pattern | Description |
|---|---|---|
| **Champion** | R5 F5 M5 | High-value, recent, frequent buyers |
| **Loyal** | R4+ F4+ M4+ | Reliable repeat customers |
| **Potential Loyalist** | R4+ F2–3 M3+ | Recent but not yet frequent |
| **New Customer** | R5 F1 M1–2 | First-time buyer |
| **At-Risk** | R2–3 F3+ M3+ | Previously frequent, gone quiet |
| **Can't Lose** | R1–2 F4+ M4+ | High-value but hasn't bought in 3+ months |
| **Hibernating** | R1–2 F1–2 M1–2 | Low value, long lapse |
| **Lost** | R1 F1 M1 | No activity in 6+ months |

## Where RFM appears in AccentOS

- **Customers module** — RFM badge on each customer card; filter bar has segment filter
- **Dashboard** — Champion count and At-Risk count in KPI cards
- **Sales actions** — "Win-back" action shown for At-Risk and Can't Lose segments
- **Decision Engine** — weighs customer RFM when recommending upsell products
- **Reports** — exportable RFM breakdown CSV

## Recalculation cadence

RFM scores recalculate on-demand when `sbLoadCustomers()` runs (login + any manual refresh). Scores are not persisted to Supabase — they're computed client-side from order history in the `customers` table rows.

## Sales playbook by segment

| Segment | Action |
|---|---|
| Champion | Thank + exclusive preview of new arrivals |
| At-Risk | Personalized check-in call within 2 weeks |
| Can't Lose | Escalate to Owner; offer volume incentive |
| New Customer | Follow-up quote review after 14 days |
| Lost | Automated re-engagement sequence via Marketing Hub |
