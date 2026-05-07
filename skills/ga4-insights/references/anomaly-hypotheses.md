# GA4 Anomaly Hypotheses

> Lookup table for `ga4-insights` Step 4 — when an anomaly flag fires (|z| > 2.0), this file generates the one-line hypothesis that ships in BLOCK 4. Hypotheses are deliberately *non-causal* — they suggest where to look next, not what's happening.

---

## How to use

Each firing anomaly has three coordinates:
1. **Tier**: TRAFFIC_SOURCE / LANDING_PAGE / CONVERSION_RATE
2. **Direction**: UP (z > 0) or DOWN (z < 0)
3. **Dimension value**: the specific source/medium, landing page, or `site-wide`

Match the row's tier + direction + dimension pattern against the table below. First match wins. Ship the matched `hypothesis` text + `companion_skill` handoff in the brief. If no row matches, ship `→ no hypothesis available — investigate manually` rather than guessing.

---

## TRAFFIC_SOURCE tier

| Direction | Source pattern | Hypothesis | Companion handoff |
|---|---|---|---|
| UP | `google / organic` | possible new keyword ranking or featured snippet | `→ check gsc-insights for SERP movement` |
| UP | `google / cpc` | paid spend increased OR Google Ads bid adjustment landed | `→ verify Google Ads spend log` |
| UP | `(direct) / (none)` | brand campaign / press / podcast mention OR bot traffic | `→ scan referrer audit; check Klaviyo / press queue` |
| UP | `bing / organic` | Bing index refresh — usually short-lived | `→ no action; monitor next week` |
| UP | `klaviyo / email` | email campaign sent — confirm via Klaviyo flow | `→ pair with klaviyo-flows for campaign attribution` |
| UP | `facebook / referral` OR `instagram / referral` | social post traction | `→ verify Marketing Hub campaign log (M29)` |
| UP | `houzz.com / referral` OR `pinterest.com / referral` | trade-channel referral spike — Accent Lighting trade-portal driver | `→ pair with bc-business-review trade split` |
| DOWN | `google / organic` | algorithm update OR sitewide ranking drop | `→ run gsc-insights for ranking-drops + broken-link-rescue` |
| DOWN | `google / cpc` | paid spend cut OR Google Ads disapproval | `→ check Google Ads + GMC feed via gmc-feed-audit` |
| DOWN | `(direct) / (none)` | brand awareness drop OR analytics tag regression | `→ verify GA4 tag firing site-wide; check recent deploys` |
| DOWN | `klaviyo / email` | flow paused / list shrunk / send cadence changed | `→ pair with klaviyo-flows` |
| DOWN | any source | possible GA4 measurement gap (tag broken / consent banner regression) | `→ check GA4 DebugView + recent site deploys` |

---

## LANDING_PAGE tier

| Direction | Page pattern | Hypothesis | Companion handoff |
|---|---|---|---|
| UP | `/p/[product-slug]` | product trending OR new ranking on a query | `→ check gsc-insights queries for that page` |
| UP | `/category/[slug]` | seasonal demand shift OR Google updated category snippet | `→ no action; tag for marketing review` |
| UP | `/blog/[slug]` OR `/guides/[slug]` | content marketing landed OR press pickup | `→ verify in Marketing Hub; consider doubling down` |
| UP | `/trade/[*]` | trade-portal driver — possible new partner onboarded | `→ pair with bc-business-review trade split` |
| DOWN | `/p/[product-slug]` | product disapproval, OOS, or ranking drop | `→ run gmc-feed-audit + gsc-insights + broken-link-rescue` |
| DOWN | `/category/[slug]` | category page broken (404, slow, layout regression) | `→ run broken-link-rescue + check recent deploys` |
| DOWN | `/cart` OR `/checkout` | checkout funnel regression — revenue-critical | `→ flag IMMEDIATELY; verify checkout flow + BigCommerce store-cwqiwcjxes status` |
| DOWN | `/trade/account` OR `/trade/login` | trade portal auth/UX regression | `→ check Supabase RLS + recent trade-portal deploys` |
| DOWN | `/` (homepage) | homepage SEO drop OR site-wide tag regression | `→ run gsc-insights + verify GA4 tag firing` |
| DOWN | any page with `?utm_*` query | UTM campaign ended OR tracking link broken | `→ verify campaign in Marketing Hub` |

---

## CONVERSION_RATE tier

| Direction | Hypothesis | Companion handoff |
|---|---|---|
| UP | traffic mix shifted to higher-intent sources OR conversion-event definition changed | `→ verify GA4 conversion events config; cross-check bc-business-review revenue` |
| UP | promotion / discount campaign live | `→ verify in Marketing Hub` |
| UP | trade portal share of traffic increased (trade converts higher than consumer) | `→ confirm via BLOCK 2 trade-vs-consumer split` |
| DOWN | paid traffic mix increased (lower-intent) | `→ check Google Ads spend log + R5 conversion-by-source` |
| DOWN | checkout regression OR payment processor issue | `→ flag IMMEDIATELY; check BigCommerce store-cwqiwcjxes + recent deploys` |
| DOWN | analytics tag firing inconsistently | `→ verify GA4 DebugView + Tag Assistant` |
| DOWN | OOS rate increased — high-intent visitors hitting empty product pages | `→ pair with inventory check via supabase-sql-magic` |
| DOWN | seasonal demand shift (e.g. post-holiday cooldown) | `→ no action; tag for context in next week's brief` |

---

## Cross-tier escalation rules

If two or more anomalies fire in the same direction simultaneously, the hypothesis carries more weight — surface a one-line escalation summary at the top of BLOCK 4:

| Pattern | Escalation summary |
|---|---|
| DOWN `google / organic` + DOWN `/p/[*]` landing page | `Likely sitewide SEO regression — escalate gsc-insights run` |
| DOWN `(direct)` + DOWN site-wide conversion rate | `Likely GA4 tag regression — escalate to engineering before drawing conclusions` |
| DOWN `/cart` OR `/checkout` + DOWN site-wide conversion rate | `Checkout funnel break — flag to BigCommerce ops immediately` |
| UP `google / cpc` + DOWN site-wide conversion rate | `Paid spend ramped on lower-intent traffic — review Google Ads campaign config` |
| DOWN `/trade/[*]` + DOWN trade-portal conversions in BLOCK 2 | `Trade portal degraded — check recent deploys + Supabase RLS` |

---

## When to add a row

If a real anomaly fires and no row matches, do not invent a hypothesis on the fly. Add a row here on the next session, paired with the actual root cause once it's confirmed. The hypothesis library is a learning artifact — empty cells are honest, made-up cells are noise.

This file is intentionally short of "every possible hypothesis" — patterns get added as Accent Lighting accumulates real anomaly history, not preemptively.
