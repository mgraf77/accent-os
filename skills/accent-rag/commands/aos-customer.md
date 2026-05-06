---
name: aos-customer
description: >
  Build or update a customer entity page in wiki/entities/customers/<slug>.md. Pulls from
  customers + customer_interactions + linked quotes/deals. Idempotent.
trigger: "/aos-customer"
---

# /aos-customer <customer_id_or_slug>

## Steps

1. **Resolve the customer** by id (UUID) or slug. Read the customer row + RFM if computed (recency/frequency/monetary in 12-mo window) + segment (VIP/Active/Lapsed/Lost/Prospect).

2. **Pull interactions** — last 20 customer_interactions, ordered desc.

3. **Pull linked records** — quotes (by name match OR customer_id FK if wired), deals (by company name match OR FK).

4. **Slugify** — `<first-name>-<last-name>` for residential, `<company-slug>` for commercial. Disambiguate with `-2`, `-3` if needed.

5. **Compose / update `wiki/entities/customers/<slug>.md`** with `type: entity`, `entity_kind: customer`. Body:
   - **Profile** — name, type, address, phone, email, contact role
   - **RFM + Segment** — recency days, frequency count, monetary $, segment
   - **Activity timeline** — interactions + linked quotes + linked deals merged chronologically
   - **Open loops** — open quotes >30d, deals stale >14d, interactions flagged "follow-up"
   - **Sources** — at least `[[sources/master]]` and any customer-specific notes

6. **Update `wiki/index.md` Customers section + append `wiki/log.md`** as usual.

## Privacy

- Customer email + phone allowed (already in Supabase; access governed by Sales+ role).
- **Internal notes about a customer** that contain Accent-side strategy ("avoid mentioning we have inventory issues") go in `wiki/entities/customers/<slug>.md` body but with `visible_to_roles: [Owner, Admin, Manager]` in frontmatter.
- Customer-mode Ask-the-Engine never reads `wiki/entities/customers/` — privacy guard at the Ask the Engine layer.

## Anti-patterns

- Don't overwrite human-curated "Background" or "Notes" sections (no `<!-- auto: -->` marker = preserved).
- Don't include credit card / payment data even if it appears in any source.
