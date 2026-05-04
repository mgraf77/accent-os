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

## How to use this file

When Michael has time:
1. Pick any item from the top.
2. Read **Where** + **Action**.
3. Do it.
4. Mark `[x]` and paste the **Then** prompt into Claude when you next open Claude Code.
5. Claude will pick up from BUILD_PLAN_CLAUDE.md and build whatever was unlocked.

Items can be done **in any order within a category**. Categories are roughly ordered by "what unlocks the most downstream work".
