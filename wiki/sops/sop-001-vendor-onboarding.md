---
id: sop-001-vendor-onboarding
title: SOP-001 — Vendor Onboarding
type: sop
status: published
weight: 9
tags: [vendor, onboarding, add-vendor, vendor-data, VD, rep-group, scoring, baseline, AccentOS, SOP]
related: [adr-002-supabase-backend, emp-owner, windward-erp, sop-002-quote-to-close]
created: 2026-05-06
updated: 2026-05-06
---

# SOP-001 — Vendor Onboarding

Add a new vendor to AccentOS, score them, and connect all downstream modules.

## Prerequisites

- Owner or Admin role (Vendor Data page is Owner/Admin-gated)
- Vendor's contact info, terms, rep group assignment, and at least a rough spend estimate

---

## Steps

### 1. Create the vendor record

1. Open **AccentOS → Vendor Ranking → Vendor Data** tab.
2. Click **+ Add Vendor**.
3. Fill in required fields:
   - **Vendor name** — exact legal/brand name
   - **Rep group** — select from the existing list or type a new group name
   - **Status** — set to `active` unless intentionally onboarding as inactive
   - **Tier** — leave as `Auto` (system will compute from score); override only if contractually tiered
4. Optional but recommended: fill **Terms**, **Contact name**, **Phone**, **Email**, **Notes**.
5. Save.

### 2. Run a score baseline

1. With the new vendor selected, open the **Score Detail** panel.
2. For each scoring category (Product Quality, Pricing, Freight, Returns, Support, Fill Rate), enter an initial score of **5** (neutral baseline) unless you have data to justify higher or lower.
3. Click **Save Scores**.
4. Tier auto-computes (A/B/C) from the average score.

### 3. Check the rep-group assignment

1. Open **Vendor Ranking → Scores** tab.
2. Verify the vendor appears under the correct parent company group.
3. If the rep-group is new: go to **Vendor Data**, open the vendor, and confirm the `rep_group_id` is set. If it shows blank, type the group name and save — AccentOS will create the group on first save.

### 4. Add to Co-op Tracker (if applicable)

1. Open **Vendor Ranking → Co-op Funds** tab.
2. If the vendor has open co-op or rebate funds, click **+ Add Fund** and fill:
   - Vendor (from dropdown)
   - Fund type (co-op / rebate / MDF)
   - Amount, period, deadline
3. Save. The Daily Brief will surface this fund 30 days before the deadline.

### 5. Verify downstream module availability

- **Inventory**: new vendor is available immediately in the vendor picker of any new inventory import.
- **Purchase Orders**: new vendor appears in the PO vendor dropdown.
- **Showroom Displays**: new vendor appears in the display vendor picker.
- **Warranty**: new vendor appears in the warranty claim vendor picker.

### 6. Log the vendor onboarding

Open **Settings → Audit Log** and confirm a `vendor_create` entry exists for the new vendor. If audit_log is empty (M02 schema not yet run), note the onboarding in AccentOS **Notes** field on the vendor record.

---

## Notes

- If the vendor has a parent company (sister brands), set the **Parent Company** field in Vendor Data so the vendor scores roll up into the parent group view.
- Scoring is subjective at first. Schedule a 30-day review after the first PO is received to adjust scores based on actual experience.
- For Windward-sourced vendor data (when M03/M10 are unblocked): the S5WebAPI sync will auto-populate `sales_ytd` and `sales_prior_year` fields. Until then, enter manually or leave blank.
