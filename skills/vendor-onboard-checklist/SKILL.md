---
name: vendor-onboard-checklist
description: >
  When a new vendor is added to AccentOS — or when M19 fixes assign a
  rep_group_id to one of the 257 unassigned vendors — verify the
  Supabase hsyjcrrazrzqngwkqsqa vendors row is complete: required
  fields present (W-9 status, payment terms, lead time, return
  policy, MOQ, rep_group_id, primary contact email, brand category,
  region), foreign-key integrity (rep_group exists, brand_category
  is in accepted enum), and consistency with sibling vendors in the
  same brand category. Outputs missing-field list + paste-ready SQL
  UPDATE stubs. Use this skill when Michael says: "vendor onboarding
  check", "is this vendor complete", "audit Acme Lighting record",
  "onboarding checklist", "vendor complete?", "verify Bright Co data",
  or any phrasing that asks whether a vendor record meets the
  AccentOS completeness contract. Do not use to populate missing
  data (that's manual or requires API access to Windward) or to
  match rep groups (use rep-group-matchmaker). Always produces a
  per-vendor checklist + remediation actions — never returns
  prose-only.
---

# vendor-onboard-checklist

**Purpose:** rep-group-matchmaker closes M19 by suggesting rep_group_id, but a complete vendor record needs more (W-9, payment terms, MOQ, etc.). Without this skill, M19-resolved vendors silently ship with incomplete data.

Stolen from: B2B partner-onboarding workflow patterns common across Crossbeam, Allbound, Impartner, Tradogram. AccentOS-customized for the Accent Lighting vendor record contract.

---

## Trigger Recognition

Run when Michael says:
- "vendor onboarding check" / "onboarding checklist"
- "is this vendor complete" / "vendor complete?"
- "audit Acme Lighting record" / "audit V123 record"
- "verify Bright Co data" / "verify this vendor data"

---

## Step 1 — Identify the vendor(s) to check

Input one of:
- A specific vendor ID (e.g. `V123`) or name
- All vendors with `rep_group_id IS NOT NULL AND created_at > NOW() - INTERVAL '7 days'` (recently onboarded)
- All vendors that just had `rep_group_id` set (after rep-group-matchmaker run)
- `--all-incomplete` flag → every vendor row

Output the chosen scope up front:

```
SCOPE: 1 vendor — V123 (Acme Lighting)
  — or —
SCOPE: 7 vendors onboarded in the last 7 days
  — or —
SCOPE: ALL vendors where rep_group_id IS NULL (N=243)
```

---

## Step 2 — Define the completeness contract

Required fields for a complete AccentOS vendor record:

| Field | Source | Required? | Format |
|---|---|---|---|
| `id` | vendors.id | YES | UUID |
| `name` | vendors.name | YES | non-empty |
| `brand_category` | vendors.brand_category | YES | enum from M02 |
| `region` | vendors.region | YES | enum (NE/SE/MW/SW/W/National) |
| `rep_group_id` | vendors.rep_group_id | YES (post-M19) | FK to rep_groups |
| `primary_contact_email` | vendors.primary_contact_email | YES | valid email |
| `payment_terms` | vendors.payment_terms | YES | enum (Net30/Net60/COD/Wire) |
| `lead_time_days` | vendors.lead_time_days | YES | int > 0 |
| `moq_dollars` | vendors.moq_dollars | YES (when applicable) | numeric ≥ 0 |
| `return_policy_days` | vendors.return_policy_days | YES | int ≥ 0 |
| `w9_on_file` | vendors.w9_on_file | YES | boolean |
| `hq_city` | vendors.hq_city | DESIRED | non-empty |
| `hq_state` | vendors.hq_state | DESIRED | 2-char state code |
| `revenue_tier` | vendors.revenue_tier | DESIRED | enum (top/mid/long-tail) |

If the actual schema in `/home/user/accent-os/sql/M02_core_schema.sql` does not match, adapt to the live shape and flag the discrepancy.

---

## Step 3 — Run the per-vendor check

For each vendor in scope, build a row:

| Vendor | Field | Status | Issue |
|---|---|---|---|
| Acme Lighting | name | ✓ | — |
| Acme Lighting | rep_group_id | ✓ | — |
| Acme Lighting | payment_terms | ✗ | NULL |
| Acme Lighting | w9_on_file | ⚠ | false (W-9 not received) |
| Acme Lighting | brand_category | ✓ | — |

Status:
- **✓** — present and valid
- **✗** — missing or invalid (required field)
- **⚠** — present but flag-worthy (e.g. w9_on_file = false)

---

## Step 4 — Cross-vendor consistency check

For each vendor with a complete-ish record, compare against sibling vendors in the same `brand_category`:

```sql
WITH sibling_norms AS (
  SELECT brand_category,
         AVG(lead_time_days) AS avg_lead,
         MODE() WITHIN GROUP (ORDER BY payment_terms) AS modal_terms,
         AVG(moq_dollars) AS avg_moq,
         COUNT(*) AS sibling_count
  FROM vendors
  WHERE rep_group_id IS NOT NULL  -- only complete records
  GROUP BY brand_category
  HAVING COUNT(*) >= 3  -- skip categories with <3 siblings; norms meaningless
)
SELECT v.id, v.name, v.brand_category,
       v.lead_time_days, sn.avg_lead,
       v.payment_terms, sn.modal_terms
FROM vendors v
JOIN sibling_norms sn USING (brand_category)
WHERE v.id IN ($1, ...)
  AND (
    ABS(v.lead_time_days - sn.avg_lead) > sn.avg_lead * 0.5  -- 50% deviation
    OR v.payment_terms != sn.modal_terms
  );
```

Flag outliers — e.g. "Acme Lighting has Net60; every other Pendant-category vendor has Net30 — verify."

**When sibling check is skipped:** if the vendor's `brand_category` has fewer than 3 sibling vendors with complete records, output explicitly per affected vendor: "Cross-vendor consistency check skipped — `brand_category` Pendants has only 2 siblings (need ≥3)." Do not silently produce zero outliers.

---

## Step 5 — Output

```
═══ BLOCK 1: SUMMARY ═══
Vendors checked: [N]
Complete: [count]   Missing required: [count]   Flag-worthy: [count]
Cross-vendor outliers: [count]

═══ BLOCK 2: PER-VENDOR CHECKLIST ═══
Vendor: Acme Lighting (V123)
  ✓ name, brand_category, region, rep_group_id, primary_contact_email
  ✗ payment_terms (NULL)
  ✗ moq_dollars (NULL)
  ⚠ w9_on_file (false)
  Outlier: lead_time_days=45 vs sibling avg 21 (Pendants)

[repeat per vendor]

═══ BLOCK 3: PASTE-READY SQL UPDATE STUBS ═══
-- Fill in [VALUE] then run in Supabase SQL Editor:
UPDATE vendors SET payment_terms = '[Net30|Net60|COD|Wire]'
  WHERE id = 'V123';
UPDATE vendors SET moq_dollars = [VALUE]
  WHERE id = 'V123';
-- ... per missing field

═══ BLOCK 4: NEXT-STEP HINTS ═══
- For missing W-9: email vendor; track in M-task list
- For payment terms: confirm with primary_contact_email
- For outliers: pair with vendor-clarity-test to verify scoring is sane
```

---

## Anti-patterns

- **Never** auto-execute the UPDATE stubs. Output them as paste-ready; Michael fills values.
- **Never** invent default values for missing fields (e.g. don't assume Net30 if NULL).
- **Never** flag a "DESIRED" field as a failure. Required vs. desired is the contract.
- **Never** mark a vendor "complete" just because all required columns are non-null — also run the cross-vendor consistency check.
- **Never** modify the contract definition (Step 2 table) from inside this skill. Updates to the contract live in this SKILL.md, not at runtime.
- **Never** skip the cross-vendor consistency check (Step 4) even if all required fields pass — lead time and payment term outliers are invisible without sibling comparison, and Supabase hsyjcrrazrzqngwkqsqa `vendors` table drift is the most common source of silent data quality failures in AccentOS.
