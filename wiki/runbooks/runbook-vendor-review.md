---
id: runbook-vendor-review
title: "Runbook: Quarterly Vendor Review"
type: runbook
status: published
weight: 8
tags:
  - vendor
  - vendor-review
  - quarterly
  - scorecard
  - runbook
  - audit
  - scores
  - vendor-ranking
  - at-risk
  - cascade
related:
  - vendor-relationship
  - sop-001-vendor-onboarding
  - co-op-mechanics
  - supabase-source
created: 2026-05-06
updated: 2026-05-06
---

# Runbook: Quarterly Vendor Review

Run this process at the end of each quarter (March, June, September, December). Takes 30–60 minutes with AccentOS open.

## Pre-requisites

- Owner or Admin role
- Inventory CSV loaded (for fill-rate proxy)
- Co-op funds up to date in AccentOS
- Changelog entries current (so score drop alerts are valid)

## Steps

### 1. Open Vendor Ranking

Navigate to **Vendor Ranking** (sidebar). Set filter to "All vendors", sort by Score descending.

### 2. Identify tier shifts

Look for:
- **Tier C vendors with ≥$5K annual spend** — candidates for renegotiation or cut
- **Tier B vendors at 7.0–7.4 avg** — close to A; review which one score is holding them back
- **Recent score drops** — check Alerts for `score_dropped` alerts (≥3 points in last 90d)

### 3. Run Deal Optimizer (optional)

Vendor Ranking → Deal Optimizer tab. Review RENEGOTIATE and INVESTIGATE recommendations. Note any with estimated impact > $5K.

### 4. Score each at-risk vendor

For each vendor flagged in steps 2–3:

a. Click the vendor → open detail modal
b. Review per-category scores. The lowest 2 scores are the focus.
c. Check `vendor_changelog` for context (last entry from rep, any notes on disputes)
d. Decide: **maintain**, **flag for rep call**, or **begin cut process** (see `runbook-cut-vendor`)

### 5. Update scores

If a category score should change based on recent data:
1. Click vendor row → Score sub-tab
2. Update the relevant metric (fill_rate, defect_rate, pricing, etc.)
3. Save → changelog entry auto-writes
4. Recalculate tier — if tier changed, note in vendor_changelog manually

### 6. Verify co-op status

For each Tier A and Tier B vendor:
- Vendor Ranking → Co-op Funds tab → filter to that vendor
- Are any funds expiring in the next 90 days? If yes, plan a spend activity before the deadline.
- Are any `open` funds from > 6 months ago? These may have been missed — verify with the rep.

### 7. Update vendor_changelog

For each vendor reviewed, add a `vendor_contact` or `score_update` changelog entry with a 1-sentence summary of the quarter's conclusion:
> "Q1 2026 review: fill_rate improved to 7.2 after supply chain stabilization. Staying Tier B; monitor pricing score next quarter."

### 8. Log to decision-log (if a major decision was made)

If a vendor is being put on watch, renegotiated, or cut, use the `decision-log` skill to create a persistent record.

## Completion checklist

- [ ] Tier shifts reviewed
- [ ] Deal Optimizer checked
- [ ] At-risk vendors scored and noted
- [ ] Co-op expiry confirmed
- [ ] Changelog updated for each reviewed vendor
- [ ] Major decisions logged
