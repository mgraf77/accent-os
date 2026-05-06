---
id: trade-program-terms
title: "Trade Program Terms"
type: concept
status: published
weight: 7
tags:
  - trade
  - trade-partner
  - designer
  - contractor
  - architect
  - program
  - discount
  - net-terms
  - trade-account
  - preferred-terms
related:
  - layered-lighting
  - vendor-relationship
  - margin-structure
  - sop-002-quote-to-close
created: 2026-05-06
updated: 2026-05-06
---

# Trade Program Terms

Accent Lighting's trade program gives credentialed professionals (designers, architects, contractors, builders, installers) preferred pricing and services not available to retail customers.

## Who qualifies

| Type | Qualification |
|---|---|
| Interior Designer | ASID / IDS / NCIDQ credential or business license |
| Architect | Licensed AIA member |
| Contractor / Builder | Active contractor's license |
| Electrician | Licensed electrician or electrical contractor |
| Installer | Trade references + proof of business |
| Other | Evaluated case-by-case by Owner/Manager |

## Trade discount tiers

| Tier | Condition | Discount off sell price |
|---|---|---|
| Standard trade | Approved account, < $10K/yr | 10% |
| Preferred trade | > $10K/yr or strategic partner | 15% |
| Elite trade | > $25K/yr or project-based agreement | 20–25% |

Tier is tracked in `trade_partners.preferred_terms`. Rep applies discount manually at quote time.

## Net terms

Trade partners may qualify for net payment terms:
- **Net-30**: payment due 30 days from invoice
- **Net-60**: available to high-volume or long-standing accounts (Owner approval)
- **COD / prepay**: default for new or unapproved accounts

Terms are stored in `trade_partners.preferred_terms` as a free-text field (no formal enforcement in AccentOS yet).

## Trade portal access

Active trade partners get a TradePartner Supabase login that gives them access to the Trade & Designer Portal (`js/trade_portal.js`):
- Home dashboard showing their quotes, active projects, and deliveries
- Quote history
- Job tracker view (read-only — their linked jobs)
- Delivery status
- Resources (spec sheets, catalogs, install guides)
- Contact form → logged as `customer_interactions`

## Linking a trade partner to the portal

1. Create or confirm the `trade_partners` row with a valid `email` field
2. Create the Supabase user with the same email and set `role = 'TradePartner'`
3. Trade partner logs in → portal auto-detects the match by email and shows their data

If no match is found, a "profile not linked" banner appears with instructions to contact Accent.

## Common trade requests

- **"I need a spec sheet"** — add the article to Knowledge Hub with tag `trade-resource`
- **"Can I get trade pricing on this project?"** — create a quote and note preferred_terms tier in the quote notes
- **"I want to open a trade account"** — add via Trade Partners page; set status = prospect → active after qualification
