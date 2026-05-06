---
id: bigcommerce
title: Source Summary — BigCommerce
type: source_summary
status: published
weight: 5
tags: [bigcommerce, ecommerce, store, orders, products, GMC, API, integration, M04, M05, Track-5-13, Track-6-3, AccentOS]
related: [adr-002-supabase-backend, windward-erp, emp-sales]
created: 2026-05-06
updated: 2026-05-06
---

# Source Summary — BigCommerce

## What it is

Accent Lighting's e-commerce platform at accentlightinginc.com. Hosts the full product catalog and handles online orders. The source of GMC (Google Merchant Center) feed data and e-commerce order metrics.

## Integration status

**BLOCKED — pending M04 (BigCommerce API key).**

Track 5.13 (E-Commerce Command Center) and Track 6.3 (BigCommerce REST integration) are both gated on M04. No current live connection from AccentOS.

## API

BigCommerce V2/V3 REST API. Authentication via API key (store hash + X-Auth-Token header).

Planned use in AccentOS:
- **Products API** (V3): catalog sync → update inventory_items with e-commerce metadata (BC product ID, URL, images).
- **Orders API** (V2): order metrics → feed into Marketing Hub (conversion tracking) and Sales Pipeline (e-com orders as deals).
- **Pricing API**: real-time price updates for competitive pricing comparisons.

## Fields we plan to use

| BigCommerce field | AccentOS module | purpose |
|---|---|---|
| product.sku | inventory_items | link BC product → inventory item |
| product.price | inventory_items | list_price sync from e-com |
| product.inventory_level | inventory_items | e-com stock level (separate from physical) |
| order.total_inc_tax | Marketing Hub | revenue from e-com |
| order.items | Sales Pipeline | auto-create deal from online order |
| product.is_visible | (gating) | hide discontinued items from Quote Generator |

## GMC connection

BigCommerce automatically syncs to Google Merchant Center via the GMC app. The AccentOS `gmc-feed-audit` skill monitors feed health (missing images, disapproved items, schema gaps). The E-Commerce Command Center (Track 5.13) will surface GMC metrics alongside BC metrics.

## Gotchas

- BC V2 vs V3: V2 Orders API is still more complete than V3 for AccentOS's use case. Use V2 for orders, V3 for products/catalog.
- API rate limit: 150 requests/30s (Stencil stores). Batch product syncs need backoff.
- BC product IDs and Windward item numbers will need a mapping table — SKU is the common key.
- E-commerce `inventory_level` and physical warehouse `qty_on_hand` are separate concepts — never overwrite one with the other without a reconciliation step.

## Update cadence (planned)

Nightly catalog sync. Real-time order webhooks (BC supports WebHooks) for high-volume periods.
