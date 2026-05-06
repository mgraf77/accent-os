---
id: co-op-mechanics
title: "Co-op Fund Mechanics"
type: concept
status: published
weight: 7
tags:
  - co-op
  - cooperative-advertising
  - marketing-fund
  - vendor
  - deadline
  - claim
  - accrual
  - fund-type
  - budget
related:
  - vendor-relationship
  - sop-001-vendor-onboarding
  - supabase-source
created: 2026-05-06
updated: 2026-05-06
---

# Co-op Fund Mechanics

Co-operative advertising funds (co-op) are marketing dollars that vendors commit to Accent Lighting, earmarked for jointly promoting the vendor's products.

## Fund lifecycle

```
Open → (spend approved) → Claimed → Closed
                        ↘ Expired (deadline passed, unclaimed)
```

AccentOS tracks this via the `coop_funds` table. Each row is one fund grant, not one spend event.

## Fund types

| Type | Description |
|---|---|
| `advertising` | Print / digital ads featuring the vendor's line |
| `catalog` | Product catalog inclusion / printing |
| `showroom` | Display build-out or refresh contribution |
| `event` | Trade show, training event, demo day sponsorship |
| `promo` | Temporary price promotions, sale events |
| `rebate` | Volume-based cash-back once purchase threshold is met |
| `other` | Catch-all; note the actual purpose in the notes field |

## How accrual works

Most vendors accrue co-op as a percentage of Accent's net purchases (typically 1–3%). Example: 2% on $120,000 annual purchases = $2,400 accrued. Some vendors grant flat-dollar amounts annually regardless of purchases.

AccentOS does not auto-compute accruals (requires Windward purchase data, M03/M10). Funds are entered manually at the start of each vendor agreement period.

## Claim process

1. Marketing spends on a qualifying activity (ad, event, display)
2. Rep submits proof-of-performance to the vendor (invoice + tearsheet / photo)
3. Vendor approves → AccentOS co-op row status flips to `claimed`
4. Credit appears on the next vendor invoice or as a wire transfer

## Deadlines and expiry

Most funds expire at end of calendar year or at a rolling 12-month mark. AccentOS Alerts auto-fires a `coop_deadline` alert when a fund deadline is ≤14 days out. The Daily Brief tile also surfaces upcoming expiries for Owner/Admin/Manager roles.

## AccentOS fields

| Field | Notes |
|---|---|
| `fund_type` | See types above |
| `amount` | Total committed dollars |
| `period` | Human-readable period (e.g. "Q1 2026") |
| `deadline` | ISO date — drives alert timing |
| `status` | open / claimed / expired |
| `notes` | Claim details, invoice numbers, approval contacts |
| `linked_coop_fund` | Optional cross-ref from Showroom Displays |
