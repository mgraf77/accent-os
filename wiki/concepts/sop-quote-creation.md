---
type: concept
slug: sop-quote-creation
title: SOP: Quote Creation
sources: [source-master]
related: [sop-vendor-onboarding, sop-rep-outreach, lighting-reference]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# SOP: Quote Creation

Standard process for building and delivering a commercial lighting quote.

## Pre-quote: scope intake

Gather from customer/specifier:
- Project type (office, retail, warehouse, restaurant, residential, etc.)
- Square footage by space type
- Existing infrastructure: ceiling height, mounting type, conduit, dimming protocol
- Budget range ($/SF or total)
- Timeline: bid due date, project start, substantial completion
- Decision-maker role (owner, GC, electrician, designer)
- Spec set or open spec? (if open: you can spec Accent products; if specified: substitution process)

## Product selection

1. Match space type → lumen target (see [[lumen-output-commercial]])
2. Confirm CCT requirement ([[color-temperature-selection]])
3. Check CRI spec — ≥80 standard commercial, ≥90 for retail/medical ([[cri-tm30-tlci]])
4. Check emergency lighting code requirements ([[emergency-lighting-compliance]])
5. Confirm dimming protocol ([[dimming-protocols]])
6. Select products from Accent's vendor lineup; prioritize high-score vendors ([[vendor-scoring]])

## Building the quote in AccentOS

1. Open Quote Generator → New Quote
2. Set customer, project name, type, square footage, budget
3. Add line items: product, qty, unit net cost, unit list
4. AI summary auto-generates via Claude API
5. Review for: freight applicability, lead time flags, missing items (emergency, controls)
6. Adjust margin if needed: standard commercial = 40–45% GP

## Pricing rules

- Standard GP target: 40–45% on product; 35% minimum
- Freight: check vendor free-freight threshold — include in quote if below threshold
- Lead times: flag long-lead items (>4 weeks) explicitly in quote
- List price: never show net cost to customer; show list price with discount % OR show net with "your price"
- IMAP: never quote below vendor IMAP on branded products

## Delivery

- Email quote PDF + product cut sheets
- Follow up in 48–72 hours if no response
- Competitive situations: authorized substitution requires matching spec sheet attributes (lumen output, CCT, CRI, dimming, listing)

## Quote → Job conversion

If customer awards project: use Deal → Job preset in AccentOS Pipeline (goTo pipeline → openDeal → Create Job button).

## Related

[[sop-vendor-onboarding]] · [[lumen-output-commercial]] · [[color-temperature-selection]] · [[cri-tm30-tlci]]
