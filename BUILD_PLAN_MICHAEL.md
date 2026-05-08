# BUILD_PLAN_MICHAEL.md — Michael's Action Queue

> **What this is.** Every action that requires Michael's hands. Claude cannot do these — auth-walled, owner-only, paid-account-gated, or external-confirmation-required.
>
> **How to use it.**
> - Work top to bottom on your own timeline.
> - Each item has a **Where** (URL), **Action** (click-by-click), **Then** (paste this exact prompt to Claude when done), and **Unlocks** (what Claude can build once this lands).
> - Mark `[x]` when complete. Claude will read this file at the start of every session and pick up the unlocked work.

---

## CATEGORY: SUPABASE / DATABASE

- [x] **M01** — Tighten RLS on existing vendor_* tables
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M01_rls_tightening.sql` from the repo (already written by Claude). Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return `relrowsecurity=true` for all 7 tables.
    4. Reload `https://accent-os.pages.dev` and confirm reads + writes still work as Owner.
  - Then: paste to Claude → `M01 done — RLS tightened on vendor_* tables. Continue from BUILD_PLAN_CLAUDE.md`
  - Unlocks: production-grade RLS posture; ability to ship public-facing portals (Track 6.5/6.6) without leaking write access

- [x] **M02** — Run §0.4 Core Database Schema (consolidated CREATE TABLE block)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M02_core_schema.sql` from the repo (already written by Claude). Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return 18 rows, all with `rls_enabled=true`.
    4. Optional: open Table Editor and confirm tables exist.
  - Then: paste to Claude → `M02 done — core schema is in. Build out Track 1 in priority order.`
  - Unlocks: Tracks 1.1, 1.2, 1.4, 1.5, 2.2, 2.3, 4.2, 4.3 (everything that needs new tables)

- [x] **M23** — Run Purchase Orders schema (Track 5.4)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M23_purchase_orders_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return 2 rows (`purchase_orders`, `po_lines`) with `rls_enabled=true`.
    4. Reload `https://accent-os.pages.dev`. Purchase Orders sidebar entry already ships (v6.10.11).
  - Then: paste to Claude → `M23 done — purchase_orders + po_lines tables in. Test PO create + receipt flow.`
  - Unlocks: persistence for Track 5.4. Receipt flow auto-increments inventory_items.qty_on_hand once M22 also lands.

- [x] **M22** — Run Inventory schema (Track 5.3 phase 1)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M22_inventory_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return one row (`inventory_items` with `rls_enabled=true`).
    4. Reload `https://accent-os.pages.dev`. The Inventory sub-tab on Vendor Ranking already ships (v6.10.9) with CSV-import + filterable list — once the table exists, imports persist and reload across sessions.
  - Then: paste to Claude → `M22 done — inventory_items table is in. Import a CSV to test.`
  - Unlocks: persistence for Track 5.3 CSV imports. The same table accepts live syncs from Track 6.11 (Windward) once M03 + M10 land — no schema migration required.

- [x] **M21** — Run Phase 3 schema (Calendar + Knowledge Hub + Job Tracker)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M21_phase3_schema.sql` from the repo (already written by Claude). Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return 3 rows (calendar_events, articles, jobs) all with `rls_enabled=true`.
    4. Reload `https://accent-os.pages.dev`. The Calendar / Internal Docs / Job Tracker UIs already shipped (v6.10.6–6.10.8); they will start saving / loading once the tables exist.
  - Then: paste to Claude → `M21 done — phase 3 schema is in. All three modules are now persistent.`
  - Unlocks: persistence for Tracks 5.1 (Knowledge Hub), 5.2 (Job Tracker), 5.16 (Company Calendar). Until M21 runs, the UIs work but persistence silently no-ops (toast warns on save).

- [ ] **M29** — Run Marketing Hub schema (Track 5.12)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M29_marketing_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return 2 rows (`marketing_campaigns`, `marketing_assets`) with `rls_enabled=true`.
    4. Reload `https://accent-os.pages.dev`. Marketing Hub already ships (v6.10.20) replacing the prior static placeholder.
  - Then: paste to Claude → `M29 done — marketing tables in.`
  - Unlocks: persistence for Track 5.12. Campaigns + Assets become saveable; ROI / attribution stats build over time.

- [ ] **M28** — Run Competitive Pricing schema (Track 5.14)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M28_competitor_prices_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return one row (`competitor_prices` with `rls_enabled=true`).
    4. Reload `https://accent-os.pages.dev`. Competitive Pricing sidebar entry already ships (v6.10.19).
  - Then: paste to Claude → `M28 done — competitor_prices table is in.`
  - Unlocks: persistence for Track 5.14. Append-only observation log; latest snapshot per (SKU × competitor) shown in UI.

- [ ] **M27** — Run Deliveries schema (Track 5.10)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M27_deliveries_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return one row (`deliveries` with `rls_enabled=true`).
    4. Reload `https://accent-os.pages.dev`. Deliveries sidebar entry already ships (v6.10.17).
  - Then: paste to Claude → `M27 done — deliveries table is in.`
  - Unlocks: persistence for Track 5.10. Schedule, dispatch, sign-for, log failures.

- [ ] **M26** — Run Label Batches schema (Track 5.9 — optional)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M26_label_batches_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return one row (`label_batches` with `rls_enabled=true`).
    4. Reload `https://accent-os.pages.dev`. Labels page already ships (v6.10.16); table only enables the "Save batch" button to actually persist.
  - Then: paste to Claude → `M26 done — label_batches table is in.`
  - Unlocks: persistence for saved label batches in Track 5.9. The Labels page works without M26 — printing labels is in-memory and uses no DB write. Only "Save batch" needs the table.

- [ ] **M25** — Run Showroom Display schema (Track 5.8)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M25_showroom_displays_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return one row (`showroom_displays` with `rls_enabled=true`).
    4. Reload `https://accent-os.pages.dev`. Showroom Displays sidebar entry already ships (v6.10.15).
  - Then: paste to Claude → `M25 done — showroom_displays table is in.`
  - Unlocks: persistence for Track 5.8.

- [ ] **M24** — Run Trade Partner + Warranty schema (Tracks 5.5 + 5.11)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M24_trade_partners_warranty_schema.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. The verification SELECT at the bottom should return 2 rows (`trade_partners`, `warranty_claims`) with `rls_enabled=true`.
    4. Reload `https://accent-os.pages.dev`. Trade Partners + Warranty sidebar entries already ship (v6.10.13/v6.10.14).
  - Then: paste to Claude → `M24 done — trade_partners + warranty_claims tables in.`
  - Unlocks: persistence for Tracks 5.5 (Trade Partner Network) and 5.11 (Warranty Tracker).

- [ ] **M11** — Fix Supabase MCP permissions (Track 0.3)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open a Claude.ai session and ask Claude to draft the exact GRANT SQL needed for the MCP service role on this project.
    2. Paste the resulting SQL into Supabase SQL Editor.
    3. Click **Run**.
    4. Test in the next Claude Code session — `mcp__claude_ai_Supabase__execute_sql` should return without permission errors.
  - Then: paste to Claude → `M11 done — Supabase MCP works. Stop pasting SQL manually for trivial table operations.`
  - Unlocks: Claude can run schema migrations directly. Reduces SQL toil on every future track.

---

## CATEGORY: USER MANAGEMENT

- [ ] **M12** — Rotate shared `accentos` password
  - Where: `https://accent-os.pages.dev` (each user signs in, then changes their own)
  - Action:
    1. Once Track 0.2 Chunk B ships (Settings → Users panel includes a "Change my password" form), each of Michael / Paul / Patrick should sign in and change their password from `accentos` to a personal password.
    2. Until Chunk B is shipped, use Supabase dashboard: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/auth/users` → click each user → "Reset password" → set new value → tell the user.
  - Then: paste to Claude → `M12 done — shared password rotated.`
  - Unlocks: nothing build-wise; closes a security loop.

- [ ] **M13** — Add Sales / Warehouse users when those people onboard
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/auth/users`
  - Action:
    1. Click **Add user** → enter email + password + ☑ Auto Confirm.
    2. After Track 0.2 Chunk B ships, use the in-app Settings → Users panel instead.
    3. Run this SQL to seed the profile:
       ```sql
       INSERT INTO user_profiles (user_id, email, full_name, role, initials)
       SELECT id, email, '<Full Name>', '<Sales|Warehouse>', '<XX>'
       FROM auth.users WHERE email = '<email>'
       ON CONFLICT (user_id) DO UPDATE
         SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, initials = EXCLUDED.initials;
       ```
  - Then: paste to Claude → `M13 done — <name> added as <role>. Verify role-gated navigation.`
  - Unlocks: real-world testing of Sales / Warehouse role visibility matrix

---

## CATEGORY: API KEYS & EXTERNAL ACCESS

- [ ] **M04** — BigCommerce API credentials
  - Where: `https://store-cwqiwcjxes.mybigcommerce.com/manage/settings/auth/api-accounts`
  - Action:
    1. Navigate via BigCommerce admin → **Settings** → **API** → **Store-level API accounts**.
    2. Click **Create API account** → name "AccentOS Read", token type "V2/V3 API token".
    3. Scopes: Read-only on Products, Orders, Customers, Categories. (Write only if Claude needs to push data — start read-only.)
    4. Save → copy the access token (shown once).
  - Then: paste to Claude → `M04 done — BC API token created. Token: <paste>. Store hash: store-cwqiwcjxes. Wire it into AccentOS.`
  - Unlocks: Tracks 5.13 (E-Commerce Command Center) and 6.3 (BigCommerce integration)

- [ ] **M05** — Google Merchant Center API access
  - Where: `https://merchants.google.com/mc/overview?a=687520574&authuser=2`
  - Action:
    1. Decide whether to grant Claude Code (or AccentOS) API-level access. Two paths:
       - **(a) Service account** — easier for AccentOS to authenticate. Create one in Google Cloud Console, grant "Standard" access in GMC (Admin → Account access).
       - **(b) OAuth** — sign-in flow per session. More secure but requires re-auth.
    2. If (a): in GCP, create service account, download JSON, paste contents to Claude.
  - Then: paste to Claude → `M05 done — GMC service account created. JSON: <paste OR file path in Drive>.`
  - Unlocks: Track 5.13 (auto-resolve missing image issue, feed health monitoring)

- [ ] **M06** — Google Analytics 4 + Search Console service account
  - Where: `https://console.cloud.google.com/iam-admin/serviceaccounts`
  - Action:
    1. Same service account from M05 can be reused, OR create dedicated `accentos-ga4@`.
    2. Add the service account email as a **Viewer** in GA4 Admin → Property Access Management.
    3. Same in Search Console → Settings → Users and permissions → Add user with Restricted access.
    4. Download service account JSON if not already done in M05.
  - Then: paste to Claude → `M06 done — GA4 + GSC service account configured. Property ID: <paste>. Sites verified: <paste>.`
  - Unlocks: Tracks 6.1 + 6.2 (revenue attribution, search query data, page performance feeds into Owner Dashboard)

- [ ] **M09** — Klaviyo API key
  - Where: `https://www.klaviyo.com/settings/api-keys`
  - Action:
    1. Click **Create Private API Key**.
    2. Name "AccentOS". Scopes: Read-only on Profiles, Lists, Campaigns, Metrics. Write on Profiles only if Claude needs to push customer updates.
    3. Save → copy the key.
  - Then: paste to Claude → `M09 done — Klaviyo private key: <paste>. Wire into AccentOS.`
  - Unlocks: Track 6.4 (email engagement data into customer profiles + RFM scoring)

---

## CATEGORY: WINDWARD / ERP

- [ ] **M03** — Get written confirmation from Windward rep that S5WebAPI is read-only and included in the existing license
  - Where: email Windward support
  - Action:
    1. Draft email (ask Claude to draft if helpful) to your Windward rep.
    2. Specifically request written confirmation of: (a) S5WebAPI is included in the license you currently pay for at no additional charge, (b) read-only access does not violate ToS, (c) the documented authentication procedure for the WebAPI user.
    3. Save the reply email in Gmail with label "Windward / S5WebAPI Confirmation".
  - Then: paste to Claude → `M03 done — Windward written confirmation received. Begin Track 6.11 / Curtis outreach planning.`
  - Unlocks: Track 6.11 (Windward live integration), M10 (Curtis outreach can begin)

- [ ] **M10** — Curtis outreach (Windward integration approval)
  - Where: in-person or scheduled call with Curtis
  - Action: **Do NOT do this until M03 is complete.** Once you have the written confirmation in hand:
    1. Schedule a 15-min meeting with Curtis.
    2. Lead with the written confirmation — "I have a letter from Windward confirming S5WebAPI is included in our license and is read-only."
    3. Ask for: WebAPI user password OR creation of a read-only user for AccentOS.
    4. Document outcome in MASTER.md §13.
  - Then: paste to Claude → `M10 done — Curtis approved. Credentials: <paste secure ref>. Begin Track 6.11 build.`
  - Unlocks: Track 6.11 fully (live ERP data — inventory, customers, orders feed AccentOS in real time)

---

## CATEGORY: ECOMMERCE OPS (BigCommerce / GMC / Feedenomics)

- [ ] **M14** — Resolve GMC missing images (20K+ products)
  - Where: `https://merchants.google.com/mc/items/issues?a=687520574&authuser=2`
  - Action:
    1. Filter to "Missing image" issue.
    2. Decide strategy: (a) bulk supplement via Lights America feed, (b) partial — only top-revenue SKUs, (c) pause non-imageable products from feed.
    3. Coordinate with Eugene Klein at Lights America (eugene@lightsamerica.com) — he can include image URLs in the next feed export.
  - Then: paste to Claude → `M14 strategy: <a/b/c>. Eugene committed to <action> by <date>.`
  - Unlocks: GMC feed health → +$30K–$80K/yr Google Shopping revenue per MASTER §14

- [ ] **M15** — Eugene's CSV for meta description bulk update
  - Where: email Eugene Klein (eugene@lightsamerica.com)
  - Action:
    1. Confirm Eugene is producing the bulk meta description CSV.
    2. When received, save in Google Drive folder "Accent / Lights America / 2026 / Bulk Meta Updates".
    3. Apply the CSV via Feedenomics or BigCommerce bulk product import (depends on how Eugene formats it).
  - Then: paste to Claude → `M15 CSV from Eugene received. Applied via <Feedenomics/BC bulk import>. Result: <N> products updated.`
  - Unlocks: GMC feed quality improvement; Track 5.13 has fewer issues to triage

- [ ] **M16** — 4 GMC URLs still pending re-index (P053-077 batch)
  - Where: `https://search.google.com/search-console/inspect`
  - Action:
    1. For each of the 4 pending URLs, paste into Search Console URL Inspection tool.
    2. Click **Request indexing** if not already requested.
    3. Document status in MASTER.md §13.
  - Then: paste to Claude → `M16 done — all 4 URLs re-indexed (or expired, if rejected).`
  - Unlocks: clears MAP violation followup loop

- [ ] **M17** — Feedenomics "new products only" rule
  - Where: `https://app.feedonomics.com/` (Surface app 199612 / DB 26082)
  - Action:
    1. Coordinate with Seth Masutthi or Jacki Peltier at Feedenomics.
    2. Configure feed rule to only push products with `created_at > <cutoff date>` for meta description fields, so Eugene's manual CSV updates don't get overwritten by feed re-runs.
  - Then: paste to Claude → `M17 done — Feedenomics rule live: new-products-only meta updates.`
  - Unlocks: meta description integrity going forward

---

## CATEGORY: OWNER DECISIONS

- [x] **M07** — Customers module: scoping LOCKED 2026-05-04
  - Decision: customer scores visible to **Sales role and above**. Data source: **Windward CSV import** (waiting). Build module UI + schema hooks now; wire CSV import when Michael provides the file.

- [x] **M08** — Employees module: scoping LOCKED 2026-05-04
  - Decision: employee scores visible to **Owner / Admin / Manager only**. Employees CANNOT see their own scores. Data source: **Windward CSV import** (waiting). Manager role explicitly added as a viewer of employee data — reflect everywhere Manager appears in role visibility matrix.

- [ ] **M18** — Website redesign: owner approval to go to production
  - Where: review the sandbox HTML files in Drive (per MASTER §7)
  - Action:
    1. Review both sandbox files end-to-end.
    2. List any required changes; either fix yourself or queue as a Claude task.
    3. Once satisfied, decide deploy plan: (a) full site swap, (b) staged sub-domain rollout, (c) homepage-first then category pages.
  - Then: paste to Claude → `M18 approved. Deploy plan: <a/b/c>. Begin staged rollout starting <date>.`
  - Unlocks: production website ship; Track 6.10 (AccentOS embed into accentlightinginc.com)

---

## CATEGORY: REP / VENDOR OPS

- [ ] **M19** — 257 vendors with no rep group assigned
  - Where: AccentOS Vendor Ranking → filter "rep is empty"
  - Action:
    1. Walk the list; for each vendor, either assign a rep (existing) or mark as "Direct".
    2. Use the parent-company sister-sync feature to bulk-apply rep groups across brand families.
  - Then: paste to Claude → `M19 done — N vendors assigned, M marked Direct, X still unassignable. Update MASTER §13.`
  - Unlocks: rep outreach campaign can target 100% of catalog; Track 1.1 score persistence has cleaner foreign-key data

- [ ] **M20** — 8 rep companies need call lists (no email on file)
  - Where: AccentOS Rep List view, then Google / phone research
  - Action:
    1. For each of the 8 rep companies, find a phone number + a contact name.
    2. Update via the Rep editor in AccentOS.
  - Then: paste to Claude → `M20 done — call lists complete for all 8 reps. Build outreach campaign assets.`
  - Unlocks: full rep outreach campaign asset generation

---

## CATEGORY: KPI DASHBOARDS — schema gaps surfaced by kpi-data-audit (2026-05-05)

> Each unblocks a count of catalog KPIs. The audit identified these as the
> highest-leverage moves to take dashboard coverage from ~19% to ~85%.
> See `KPI_CATALOG.md` for the full catalog and `kpi-data-audit` skill
> for re-running the audit after each completion.

**Recommended order (from kpi-data-audit --full coverage trajectory):**
1. **Run M24 + M27 + M29** first — already-written files, zero new design, +14 KPIs in ~10 min
2. **M30** (customers.segment) — single column, +22 KPIs, biggest single move
3. **M32 + M33** (stage history + lost_reason) — pipeline analytics unlock
4. **M35** (employees.quota + dates) — sales manager dashboard unlock
5. **M38** (recurring_contracts) — national-account NRR unlock
6. **M36 + M37** (tickets + surveys) — customer experience metrics
7. **M39** (vendors verify) — vendor-cascade enrichment
8. **M34** (invoices/payments) — AR aging, DSO
9. **M31** (products.cost) — gates margin %; depends on M04 BC credentials
10. **M06 + M09 + M05** (external integrations) — funnel + campaign + GMC

After each landed M-task: re-invoke `"audit the KPI data"` to track coverage rise.

- [ ] **M30** — Add `customers.segment` enum (HIGHEST LEVERAGE: 22 KPIs)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M30_customers_segment.sql` from the repo. Copy its contents.
    2. Paste into the SQL Editor → click **Run**.
    3. Backfill: classify top 100 customers by revenue manually; rest default to 'other'.
  - Then: paste to Claude → `M30 done — customers.segment enum added. Re-audit KPIs.`
  - Unlocks: all 8 segment dashboards (walk-in, electrician, national, designer, new-home, hospitality, multifamily, commercial, DIY); 22 catalog KPIs

- [ ] **M31** — Decide products source-of-truth + add cost column (8 KPIs after M04)
  - Where: BC admin + `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Decision: BigCommerce-native (simpler) vs Supabase mirror (more flexible). See file comments in `sql/M31_products_cost.sql`.
  - Action: depends on decision. If Path B: uncomment + run the products mirror block.
  - Then: paste to Claude → `M31 done — products via [BC|Supabase mirror]. Margins computable.`
  - Unlocks: F3, F4, F5, P4, P5, P10, H2, S-OS12 (gross margin / EBITDA / margin-by-product)
  - Blocked on: M04 (BC API credentials)

- [ ] **M32** — Run `pipeline_deals_stage_history` schema (5 KPIs)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action: copy `sql/M32_deals_stage_history.sql` → paste → run. The trigger writes history on every stage update going forward (no backfill possible).
  - Then: paste to Claude → `M32 done — stage history live. Pipeline analytics unblocked.`
  - Unlocks: L3 (lead→opportunity), L4 (stage-to-stage), L5 (pipeline aging), L6 (win rate by stage), partial L7

- [ ] **M33** — Run `pipeline_deals.lost_reason` enum (1 KPI, very cheap)
  - Where: SQL Editor
  - Action: copy `sql/M33_deals_lost_reason.sql` → run.
  - Then: paste to Claude → `M33 done — lost_reason ready. Train sales to fill it on lost deals.`
  - Unlocks: L7 (loss-reason distribution); coaching insights for sales manager

- [ ] **M34** — Decide invoices/payments source + run mirror schema (4 KPIs)
  - Where: SQL Editor (after deciding source)
  - Decision: Windward (M03 + M11) as source-of-truth + Supabase mirror, OR Supabase-native billing.
  - Action: copy `sql/M34_invoices_payments.sql` → run as-is for the schema. Sync logic comes later.
  - Then: paste to Claude → `M34 done — AR tables live. AR aging dashboard unblocked.`
  - Unlocks: F8 (DSO), F12 (AR aging), C-EL3 (Net 30/60 compliance), V9 (vendor invoice accuracy)
  - Blocked on: M03 + M10 + M11 if Windward path

- [ ] **M35** — Run `employees.quota + hire_date + terminated_at` (7 KPIs)
  - Where: SQL Editor
  - Action: copy `sql/M35_employees_quota_dates.sql` → run. Backfill quota from latest comp plan; hire_date from HR records.
  - Then: paste to Claude → `M35 done — employee tenure + quota tracked. Sales Manager dashboard unblocked.`
  - Unlocks: S-OS2 (quota attainment), MGR1 (team quota), MGR2 (pipeline coverage), H3 (turnover), H6 (tenure), H7 (ramp time)

- [ ] **M36** — Run `service_tickets` schema (5 KPIs)
  - Where: SQL Editor
  - Action: copy `sql/M36_service_tickets.sql` → run.
  - Then: paste to Claude → `M36 done — service ticket lifecycle live.`
  - Unlocks: X1 (FCR), X2 (FRT), X3 (AHT), X11 (complaint rate), X12 (escalation rate)

- [ ] **M37** — Pick survey tool + run `survey_responses` schema (3 KPIs)
  - Where: pick tool → SQL Editor → wire webhook
  - Decision: Delighted, Typeform, Google Forms, or BC native reviews.
  - Action: copy `sql/M37_survey_responses.sql` → run. Configure webhook from chosen tool to Supabase.
  - Then: paste to Claude → `M37 done — survey tool [name] wired. CSAT/NPS pipeline live.`
  - Unlocks: X4 (CSAT), X5 (NPS), H8 (eNPS)

- [ ] **M38** — Run `recurring_contracts` schema (6 KPIs)
  - Where: SQL Editor
  - Action: copy `sql/M38_recurring_contracts.sql` → run. Backfill from existing national-account contracts.
  - Then: paste to Claude → `M38 done — recurring contracts live. National-account NRR dashboard unblocked.`
  - Unlocks: S-NA1 (NRR), S-NA2 (GRR), S-NA3 (expansion attach), C-NA1, C-NA2 (account health), C-NA3 (multi-location coverage)

- [ ] **M39** — Verify/extend `vendors` table (~14 KPIs transitively)
  - Where: SQL Editor + Supabase Table Editor
  - Action:
    1. Open Table Editor → check if `vendors` exists. (Audit found vendor_scores references it but no CREATE TABLE in M*.sql.)
    2. Either way, run `sql/M39_vendors_verify.sql` — it's idempotent and ADD COLUMN IF NOT EXISTS for the full schema.
    3. Backfill brand_category, region, payment_terms for top 50 vendors.
  - Then: paste to Claude → `M39 done — vendors fully specced. vendor-cascade enriched.`
  - Unlocks: V2 (concentration risk), V5 (revenue contribution), V10 (supplier diversity); enriches vendor-cascade and vendor-risk-register

- [ ] **M40** — Run `user_module_overrides` schema (cross-device per-user gating)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `sql/M40_user_module_overrides.sql` from the repo (already written by Claude).
    2. Paste into SQL Editor → Run.
    3. Reload AccentOS → Mgmt → Modes → User Overrides — overrides set in the UI now persist server-side and gate access for each user on their own browser/device too (not just Owner's local view).
  - Then: paste to Claude → `M40 done — user_module_overrides table live. Wire UI to read+write the table.`
  - Unlocks: real cross-device per-user module access. Today (v1) overrides only affect Owner's own browser; this M-task makes them effective for the actual user being granted/denied access.

---

## CATEGORY: KPI DASHBOARDS — also-easy already-written files (just run them)

These M-tasks already exist above (M24/M27/M29). The audit confirms running them unblocks 14 KPIs combined with zero new design work. Promote in priority.

---

## CATEGORY: SETUP / ENVIRONMENT (one-time)

- [ ] **M41** — Install OpenAI API key into Claude Code settings (unblocks codex-review)
  - Where: `/home/user/accent-os/.claude/settings.local.json` (gitignored, perms 600)
  - Action:
    1. Get key: `https://platform.openai.com/api-keys` → "Create new secret key" → copy
    2. Open `/home/user/accent-os/.claude/settings.local.json` in any editor (file editor on Claude Code Web works on desktop, not mobile)
    3. Replace the placeholder string `REPLACE_WITH_NEW_KEY_FROM_PLATFORM_OPENAI_COM` with your `sk-proj-...` key
    4. Save. Restart Claude Code session so env vars reload.
    5. Verify: in any new Claude Code session, run a quick `codex review` against a small file — if it returns recommendations, key is working.
  - Then: paste to Claude → `M41 done — OPENAI_API_KEY installed. codex-review unblocked.`
  - Unlocks: codex-review skill (cross-agent peer review with auto-apply LOW-risk fixes); future cross-agent collaboration patterns
  - Note: blocked by Claude Code Web mobile not having a file editor; works fine from desktop.

---

## CATEGORY: L4–L6 CAPABILITY SKILLS — schema gaps surfaced by skill-forge (2026-05-08)

> Each unblocks a count of newly-forged AccentOS skills currently shipping in
> BLOCKED stub mode. These came out of the gap-optimizer / skill-forge run that
> produced 15 new skills (action-queue, alert-router, bc-rest-bridge, churn-predictor,
> coop-claim-drafter, daily-brief-composer, demand-forecaster-skill, email-drafter,
> ga4-insights, gsc-insights, klaviyo-flows, next-action-recommender,
> skill-performance-tracker, trade-vendor-portal, windward-bridge). Each skill
> documents the exact DDL it needs in its own `references/proposed-schema.md`.

**Recommended order:**
1. **M42** (action_queue) first — single largest unlock, gates the L4/L6 ledger that 5+ skills write to
2. **M43** (vendor_overrides co-op cols) — pure ALTER TABLE, immediately flips coop-claim-drafter active
3. **M44** (klaviyo cache) — only matters once M09 lands, but cheap to pre-stage
4. **M45** (rfm_scores cache) — optional perf boost for churn-predictor; skill already runs without it

- [ ] **M42** — Run `action_queue` schema (L4 drafted-actions ledger + L6 autonomous-execution ledger)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Two skills propose schemas for this same table — `action-queue/references/proposed-schema.md` (the L6 executor-state-machine version with `action_type_enum`, `idempotency_key`, `state` enum, `executor_result jsonb`) and `alert-router/references/proposed-schema.md` (the L4 router version with `signal_type`, `owner_role`, `urgency_tier`, `dedup_key`, `escalation_at`). Decide which is canonical, OR merge the supersets into a single CREATE TABLE.
    2. Open the chosen `references/proposed-schema.md` from the repo. Copy the DDL block.
    3. Paste into the SQL Editor → click **Run**.
    4. Verify the table exists: `SELECT to_regclass('public.action_queue');` should return non-null. Verify enums (action-queue version): `SELECT 1 FROM pg_type WHERE typname IN ('action_state','action_type_enum');` should return 2 rows.
    5. No UI ships yet — UI work will be queued in BUILD_PLAN_CLAUDE.md once the table is live.
  - Then: paste to Claude → `M42 done — action_queue table is live. Wire alert-router + action-queue + churn-predictor + klaviyo-flows + next-action-recommender to it.`
  - Unlocks: full L4/L6 capability ladder. Skills currently shipping in BLOCKED stub mode that flip active: `action-queue` (executor backbone), `alert-router` (writes routed alerts), `next-action-recommender` (queues approved actions), `churn-predictor` (writes intervention proposals), `coop-claim-drafter` (writes claim drafts as approval-required actions). Indirect: `daily-brief-composer` reads action_queue depth as a signal.

- [ ] **M43** — Add 3 co-op rule columns to `vendor_overrides` (coop-claim-drafter active mode)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `/home/user/accent-os/skills/coop-claim-drafter/references/proposed-schema.md`. Copy the `ALTER TABLE vendor_overrides ADD COLUMN IF NOT EXISTS ...` block (3 columns: `coop_eligibility_pct numeric(5,2)`, `coop_deadline_pattern text`, `coop_documentation_required jsonb`) plus the partial index.
    2. Paste into the SQL Editor → click **Run**.
    3. Verify with the included verification query: should return 3 rows in `information_schema.columns`.
    4. Backfill top-5 vendors by FY 2025 spend with eligibility % + deadline pattern + documentation array (Kichler, Hubbardton Forge, Visual Comfort, etc. — example values in the proposed-schema.md table).
  - Then: paste to Claude → `M43 done — vendor_overrides has co-op rule columns. Backfilled top-N vendors. coop-claim-drafter unblocked.`
  - Unlocks: `coop-claim-drafter` flips from partial-blocked (deadline-only) to active mode (full claim draft generation with eligibility + documentation checklist). Each backfilled vendor adds one more vendor's worth of claim-drafting coverage.

- [ ] **M44** — Run Klaviyo flow cache schema (klaviyo-flows persistent mode)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `/home/user/accent-os/skills/klaviyo-flows/references/proposed-schema.md`. Copy all 3 CREATE TABLE blocks (`klaviyo_flows`, `klaviyo_flow_metrics`, `klaviyo_flow_proposals`) plus indexes + RLS.
    2. Paste into the SQL Editor → click **Run**.
    3. Verify: `SELECT to_regclass('public.klaviyo_flows'), to_regclass('public.klaviyo_flow_metrics'), to_regclass('public.klaviyo_flow_proposals');` should return 3 non-null OIDs.
    4. No backfill needed — tables populate on next `klaviyo-flows audit` run after M09 lands.
  - Then: paste to Claude → `M44 done — Klaviyo cache tables live.`
  - Unlocks: `klaviyo-flows` upgrades from stateless (live API only) to cached + cross-run trends + proposal state machine. Mode A leaderboard becomes "this week vs last week"; Mode B proposals link to apply timestamp.
  - Blocked on: not strictly blocked, but only meaningful after **M09** (Klaviyo API key) — pre-stage if convenient.

- [ ] **M45** — Run `rfm_scores` cache schema (churn-predictor perf boost — optional)
  - Where: `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`
  - Action:
    1. Open `/home/user/accent-os/skills/churn-predictor/references/proposed-schema.md`. Copy the `rfm_scores` CREATE TABLE block (cache for per-customer baseline RFM stats).
    2. Paste into the SQL Editor → click **Run**.
    3. Verify: `SELECT to_regclass('public.rfm_scores');` non-null.
    4. Schedule a nightly Edge Function or cron to refresh `rfm_scores` from `customers` + `customer_orders` (sample SQL in proposed-schema.md).
  - Then: paste to Claude → `M45 done — rfm_scores cache live. churn-predictor switches to cached baselines.`
  - Unlocks: `churn-predictor` performance boost (much faster than recomputing baselines on every run). Skill works without M45 — falls back to inline computation per top-N candidate. Pure perf optimization, not a hard blocker.

---

## How to use this file

When Michael has time:
1. Pick any item from the top.
2. Read **Where** + **Action**.
3. Do it.
4. Mark `[x]` and paste the **Then** prompt into Claude when you next open Claude Code.
5. Claude will pick up from BUILD_PLAN_CLAUDE.md and build whatever was unlocked.

Items can be done **in any order within a category**. Categories are roughly ordered by "what unlocks the most downstream work".
