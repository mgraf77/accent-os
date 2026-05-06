---
id: margin-structure
title: "Margin Structure"
type: concept
status: published
weight: 7
tags:
  - margin
  - markup
  - pricing
  - cost
  - list-price
  - discount
  - price-book
  - dealer-net
  - trade-discount
  - profitability
related:
  - vendor-relationship
  - rfm-segments
  - supabase-source
created: 2026-05-06
updated: 2026-05-06
---

# Margin Structure

Understanding how Accent Lighting prices products requires knowing the difference between margin and markup, and how dealer-net pricing flows from the vendor to the customer.

## Key pricing terms

| Term | Formula | Example |
|---|---|---|
| **List price** | Vendor's published MSRP | $100.00 |
| **Dealer net** | List × (1 − trade discount) | $100 × (1 − 0.40) = $60.00 |
| **Cost** | Landed cost after freight + any surcharges | ≈ dealer net (or slightly above with freight) |
| **Sell price** | What Accent charges the customer | $85.00 |
| **Gross margin** | (sell − cost) / sell | ($85 − $60) / $85 = **29.4%** |
| **Markup** | (sell − cost) / cost | ($85 − $60) / $60 = **41.7%** |

> Rule of thumb: to achieve ≥30% margin, apply ≈43% markup over cost.

## Trade discounts

Vendors quote Accent a trade discount off list. Common tiers:

| Tier | Typical discount |
|---|---|
| Standard dealer | 35–45% |
| Preferred dealer | 45–55% |
| Stocking dealer (high volume) | 55–65% |

Trade discounts live in the vendor record (not always in Supabase — often known by the rep). AccentOS Price Book computes margin from `inventory_items.cost` and `inventory_items.list_price`; if `cost` is blank, margin cannot be shown.

## Trade partner pricing

Trade Partners (designers, architects, contractors) typically get a "trade price" which is a discount off Accent's sell price:
- Standard trade: 10–15% off sell
- Preferred trade (high-volume): 15–25% off sell

Trade pricing is manual today (rep applies at quote time). Future automation would apply `trade_partners.preferred_terms` to quote line items automatically.

## MAP pricing

Minimum Advertised Price (MAP) agreements with vendors prevent Accent from advertising below a floor price. Violations risk losing dealer status. MAP is typically 10–15% below MSRP. AccentOS does not enforce MAP automatically — the Competitive Pricing module flags when Accent's price goes below competitor observations, which can proxy MAP violations.

## Price Book in AccentOS

The Price Book sub-tab (Vendor Ranking → Price Book) computes per-SKU margin and markup from loaded inventory. Color coding:
- Green ≥50% margin
- Blue ≥30%
- Accent color (orange) < 30%

The 30% threshold is the internal gross-margin target for standard SKUs.
