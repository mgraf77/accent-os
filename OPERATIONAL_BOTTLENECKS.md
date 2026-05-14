# OPERATIONAL_BOTTLENECKS.md

## 1. Manual CSV Import Dependency (Blocked Integrations)
Critical modules like Inventory and Customers rely on manual CSV exports from Windward ERP.
- **Bottleneck:** Data is only as fresh as the last manual export. Warehouse and Sales roles often work with "stale" availability or customer history.
- **Root Cause:** Track 6.11 (Windward Live Sync) is blocked on M03 (S5WebAPI confirmation).

## 2. Vendor Score Verification Lag
306+ vendor score categories are still "Unverified".
- **Bottleneck:** The "Agentic" nature of the system is throttled by missing ground-truth data on vendor terms.
- **Current Process:** Manual outreach campaign is built but not yet fully executed/automated.

## 3. Ambiguous Customer Identifiers
The system currently uses a mix of UUIDs (from `customers` table) and name-string matching for linked records (Quotes, Deals, Jobs).
- **Bottleneck:** Duplicate customer names or minor spelling variations lead to fragmented history in the "Customer 360" view.
- **Manual Labor:** Operators must manually dedupe or resolve ambiguous matches when creating new quotes/deals.

## 4. One-Way Intelligence
The system generates excellent alerts (Stale Deals, Cold Quotes) but doesn't "close the loop" effectively.
- **Bottleneck:** After an alert is actioned (e.g., an email sent), the user must manually update the deal status or dismiss the alert.
- **Friction:** Lack of "auto-action" triggers (e.g., "Draft follow-up email and mark as actioned in one click").

## 5. Sidebar Navigation Overload
The sidebar now contains ~30 entries grouped into "CORE", "INTELLIGENCE", and "ADMIN".
- **Bottleneck:** Important operational pages (Alerts, Pipeline) compete for visual attention with administrative ones (Health Check, Module Modes).
- **Mobile Impact:** Mobile menu scrolling is cumbersome.

## 6. Supabase MCP Permission Block
The inability for Claude to run direct SQL schema changes via MCP slows down infrastructure deployment.
- **Bottleneck:** Michael must manually paste SQL into the Supabase dashboard.
- **Impact:** Increases lead time for new database-backed features.
