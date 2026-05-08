# System Ontology Design — AccentOS Organizational Cognition Engine
> Author: Claude Code | Date: 2026-05-08

---

## 1. WHAT THE ONTOLOGY IS

The ontology is the **canonical definition of what things are and how they relate** in Accent Lighting's operational reality. It is not a schema — it is the meaning behind the schema. Every table, every field, every relationship should have a reason traceable to this ontology.

Without a canonical ontology:
- A "vendor" in vendor_scores is not clearly the same entity as a "vendor" in trade_partners
- A "customer" in customers vs. a quote's free-text customer_name can diverge silently
- The AI cannot reason about "the relationship between Visual Comfort Group and Minka Group" because it's not modeled anywhere

With a canonical ontology:
- Every entity has one authoritative definition
- Every relationship is typed and queryable
- The AI can navigate from a customer to their quotes to the vendor who supplied those products to that vendor's co-op balance — in a single query path

---

## 2. CORE ENTITY TYPES

### 2.1 VENDOR
**Definition:** A manufacturer or distributor whose products Accent Lighting sells or could sell.

**Canonical identifier:** `vendor_id` (TEXT, e.g., "1" through "478")
**Display name:** `vendor_name` in VD_RAW
**Entity subtype:** Standard (active, 475) | Inactive (2: ELK HOME, SAYLITE TX)

**Key attributes:**
- Identity: id, name, website, phone
- Classification: tier (A/B/C), active flag
- Relationships: parent_company (→ PARENT_COMPANY), rep_group (→ REP_GROUP)
- Intelligence: 14 scoring category scores + states, changelog, override notes
- Economics: annual sales volume, co-op balance, rebate status

**Relationships:**
- belongs_to → PARENT_COMPANY (many-to-one)
- represented_by → REP_GROUP (many-to-many)
- supplies → PRODUCT (one-to-many)
- subject_to → CO_OP_FUND (one-to-many)
- tracked_in → INVENTORY_ITEM (one-to-many)
- displayed_by → SHOWROOM_DISPLAY (one-to-many)

**Temporal aspects:**
- Scores change over time → vendor_score_history
- Tier changes over time → vendor_tier_history
- Activity changes over time → vendor_changelog

---

### 2.2 CUSTOMER
**Definition:** A person or business that has purchased from or interacted with Accent Lighting.

**Canonical identifier:** UUID (customers.id)
**Secondary identifiers:** windward_id (TEXT), email

**Key attributes:**
- Identity: name, company, email, phone, address
- Classification: segment (VIP/Active/Lapsed/Lost/Prospect), type (residential/trade/designer/contractor/commercial)
- Intelligence: RFM scores (recency, frequency, monetary), LTV estimate, order_freq_baseline_days
- Relationships: assigned_to → EMPLOYEE (sales rep)

**Relationships:**
- placed → QUOTE (one-to-many)
- in → PIPELINE_DEAL (one-to-many)
- received → DELIVERY (one-to-many)
- submitted → WARRANTY_CLAIM (one-to-many)
- has → CUSTOMER_INTERACTION (one-to-many)
- worked_with → TRADE_PARTNER (many-to-many)

**Temporal aspects:**
- Segment changes over time → customer_segment_history
- Order history builds over time → customer_orders (from Windward)

---

### 2.3 PRODUCT
**Definition:** A specific SKU that Accent Lighting stocks, sells, or can order.

**Canonical identifier:** (vendor_id, sku) compound key — no single UUID yet
**Note:** Products exist in two places today: inventory_items + price_book. These must converge.

**Key attributes:**
- Identity: sku, description, vendor_id
- Economics: cost, list_price, margin
- Logistics: qty_on_hand, qty_available, reorder_point, bin
- Tracking: import_source (windward/csv), last_updated

**Relationships:**
- supplied_by → VENDOR
- appears_in → QUOTE_LINE (one-to-many)
- appears_in → PO_LINE (one-to-many)
- tracked_in → LABEL_BATCH (many-to-many)
- priced_against → COMPETITOR_PRICE (one-to-many)
- forecasted_by → DEMAND_FORECAST (one-to-one)

**Temporal aspects:**
- Price changes over time → competitor_prices (already append-only ✓)
- Cost changes over time → needs cost_history table
- Inventory changes over time → needs inventory_adjustment_log

---

### 2.4 EMPLOYEE
**Definition:** A person who works at Accent Lighting and uses AccentOS.

**Canonical identifier:** UUID (employees.id)
**Auth link:** auth.users.id (Supabase Auth)

**Key attributes:**
- Identity: name, email, role, department, hire_date, quota_date
- Performance: commission_pct, scorecards by period × metric
- Access: AccentOS role (owner/admin/manager/sales/warehouse)

**Relationships:**
- manages → PIPELINE_DEAL (as owner)
- authors → CUSTOMER_INTERACTION
- assigned_to → DELIVERY (as driver)
- has_score_for → EMPLOYEE_SCORE (one-to-many)
- participates_in → INTERNAL_MEETING (many-to-many)

---

### 2.5 REP_GROUP
**Definition:** An external sales representative company that represents one or more vendors to Accent Lighting.

**Canonical identifier:** rep_company (TEXT) — no UUID yet; needs one
**Note:** Rep group identity is currently implicit in VD_RAW fields. Needs promotion to a first-class entity.

**Key attributes:**
- Identity: name, contact_email, contact_phone, territory
- Performance: rep_score (the hidden 14th vendor scoring category)
- Assignment: which vendors they represent

**Relationships:**
- represents → VENDOR (one-to-many; a rep may represent many vendors)
- contacts → EMPLOYEE (who at Accent manages this rep relationship)

---

### 2.6 PIPELINE_DEAL
**Definition:** An active sales opportunity with a known customer and estimated value.

**Canonical identifier:** UUID (pipeline_deals.id)

**Key attributes:**
- Identity: title, customer linkage, estimated_value
- State: stage (lead/qualified/quoted/negotiating/won/lost/abandoned), probability
- Temporal: created_at, last_updated, expected_close, won_at, lost_at
- Intelligence: 8-factor probability model snapshot, loss_reason

**Relationships:**
- involves → CUSTOMER
- owned_by → EMPLOYEE
- has → QUOTE (one-to-one, ideally; currently name-matched)
- spawns → JOB (on win)
- triggers → WARRANTY_CLAIM (post-installation)
- logged_in → PIPELINE_EVENT (timeline of stage changes)

---

### 2.7 QUOTE
**Definition:** A formal price proposal sent to a customer.

**Canonical identifier:** UUID (quotes.id); human-readable QT-#### number

**Key attributes:**
- Header: customer linkage, status, total_amount, created_at
- Lines: SKU + description + qty + unit_price + ext_price
- Extras: contact name, project type, sqft, budget (in notes JSONB currently)
- AI: parsed from notes input (Quote Generator v2)

**Relationships:**
- for → CUSTOMER
- from → PIPELINE_DEAL (ideally; currently loose)
- has → QUOTE_LINE (one-to-many)
- seeds → PURCHASE_ORDER (via Quote→PO preset)
- leads_to → JOB (on approval)

---

### 2.8 PURCHASE_ORDER
**Definition:** An order placed with a vendor to fulfill inventory or a customer quote.

**Canonical identifier:** UUID (purchase_orders.id); human-readable PO-#### number

**Key attributes:**
- Header: vendor linkage, status, order_date, expected_date
- Lines: sku + description + qty_ordered + qty_received + unit_cost + ext_cost
- Financials: subtotal, tax, freight, total
- Linkages: related_quote, related_job

**Relationships:**
- from → VENDOR
- for → QUOTE (optional)
- for → JOB (optional)
- contains → PO_LINE (one-to-many)
- updates_on_receipt → INVENTORY_ITEM

---

### 2.9 JOB
**Definition:** A project or installation that Accent Lighting is executing for a customer.

**Canonical identifier:** UUID (jobs.id); human-readable J-#### number

**Key attributes:**
- Identity: title, description, customer, status, priority
- Dates: due_date, completed_at
- Linkages: customer_id, quote_id

---

### 2.10 CO_OP_FUND
**Definition:** A marketing fund or rebate arrangement with a vendor, tracked against a deadline.

**Canonical identifier:** UUID (coop_tracker.id)

**Key attributes:**
- Identity: vendor_id, fund_type (co_op/rebate/mdf/spiff/other)
- Financials: amount, claimed_amount, period
- State: status (open/submitted/approved/denied/expired), deadline

---

### 2.11 ALERT
**Definition:** A system-generated notification that something requires attention.

**Canonical identifier:** UUID (alerts.id)

**Key attributes:**
- Classification: type (deal_stale/coop_deadline/etc.), severity (info/warning/urgent/critical)
- State: status (unread/read/actioned/dismissed)
- Linkages: source entity type + id
- Content: title, body, action_url

---

### 2.12 KNOWLEDGE_ARTICLE
**Definition:** Internal documentation, SOP, or playbook.

**Canonical identifier:** UUID (articles.id); slug (TEXT)

**Key attributes:**
- Content: title, body (markdown), category, tags
- Meta: pinned, created_by, updated_at

---

### 2.13 PENDING_ACTION
**Definition:** An AI-drafted or system-generated action awaiting human review.

**Canonical identifier:** UUID (pending_actions.id)

**Key attributes:**
- Classification: action_type, risk_level
- Content: payload JSONB (the draft content)
- Governance: requires_role, status, reviewed_by, reviewed_at

---

### 2.14 SYSTEM_EVENT
**Definition:** An immutable record of something that happened in the system.

**Canonical identifier:** UUID (system_events.id)

**Key attributes:**
- Identity: entity_type + entity_id (what the event is about)
- Classification: event_type (created/updated/deleted/stage_changed/score_updated/etc.)
- Attribution: actor_type + actor_id (who/what caused it)
- Content: payload JSONB (the delta or full state snapshot)
- Temporal: ts (immutable)

---

## 3. ENTITY RELATIONSHIP MAP

```
PARENT_COMPANY
    ↑ belongs_to
VENDOR ←──── represents ─────→ REP_GROUP
    ↓ supplies
PRODUCT ←── tracked_in ──→ INVENTORY_ITEM
    ↓ appears_in          ↓ appears_in
QUOTE_LINE               PO_LINE
    ↑ has                    ↑ has
QUOTE ←──────────────── PURCHASE_ORDER
    ↑ for                ↑ for
CUSTOMER ←── placed      JOB ←──── spawns ── PIPELINE_DEAL
    ↑ receives               ↑ for         ↑ involves
DELIVERY                  WARRANTY_CLAIM

EMPLOYEE ──── owns ──────→ PIPELINE_DEAL
         ──── authors ───→ CUSTOMER_INTERACTION
         ──── drives ────→ DELIVERY

VENDOR ──── tracked_by ──→ CO_OP_FUND
       ──── displayed_in → SHOWROOM_DISPLAY
       ──── scored_by ───→ VENDOR_SCORE
       ──── observed_in → COMPETITOR_PRICE

ALERT ──── references ──→ any entity
SYSTEM_EVENT ──── about ─→ any entity
PENDING_ACTION ──── targets → any entity
```

---

## 4. METADATA STANDARDS

### Required on Every Entity Table
```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ           -- set via trigger or manual update
created_by  TEXT                  -- user_id or 'system' or 'import'
```

### Required on Every Relationship Table
```sql
effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
expires_at   TIMESTAMPTZ           -- null = currently active
created_by   TEXT
```

### Required on Every Event/History Table
```sql
ts           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- NO updated_at — events are immutable
```

---

## 5. TEMPORAL VERSIONING PATTERN

For any entity whose state matters over time, use the two-table pattern:

```sql
-- CURRENT STATE (upsert/update in place)
vendor_scores (vendor_id, category_key, score, updated_at, updated_by)

-- HISTORY (append-only, never update)
vendor_score_history (vendor_id, category_key, score, changed_at, changed_by, prior_score)
```

Apply this to:
| Table | History Needed | Why |
|---|---|---|
| vendor_scores | ✅ Yes | Trend tracking, relationship-over-time analysis |
| inventory_items.list_price | ✅ Yes | Margin change tracking |
| inventory_items.cost | ✅ Yes | Profitability analysis |
| pipeline_deals.stage | ✅ Already (pipeline_events) | Velocity analysis |
| customers.segment | ✅ Yes | Churn detection |
| employees.commission_pct | ✅ Yes | Compensation history |
| kpi_definitions | 🔲 Not yet | Values already in kpi_snapshots |

---

## 6. INHERITANCE RULES

### Entity Subtype Pattern
When an entity type has variants that share most fields:

```sql
-- Use one table with a 'type' column (not separate tables)
-- Example: trade_partners.type = 'designer' | 'contractor' | etc.
-- Exception: If the variant has >30% unique fields, consider a separate table
```

### Parent-Child Pattern
```sql
-- goals table uses parent_id → goals.id for 5-level hierarchy
-- Apply same pattern for: product categories, organizational hierarchy
-- Max depth for recursive display: 5 levels (current goals limit is right)
```

---

## 7. ONTOLOGY GOVERNANCE

### Adding a New Entity Type
1. Define it here first: what is it, what are its key attributes, how does it relate to existing entities?
2. Only then design the SQL table
3. Register it in `entities.type` enum
4. Document its relationships in the Entity Relationship Map

### Retiring an Entity Type
1. Mark records as `archived_at = NOW()` (soft delete)
2. Do not drop columns — add `_deprecated` suffix comment in schema
3. Remove from UI filtering but preserve in historical queries

### Relationship Type Registry
All `rel_type` values in `entity_relationships` must be defined here:

| rel_type | Direction | Example |
|---|---|---|
| `belongs_to` | Child → Parent | Vendor belongs_to Parent Company |
| `represented_by` | Entity → Rep | Vendor represented_by RepGroup |
| `supplies` | Vendor → Product | Vendor supplies Product |
| `employs` | Company → Employee | Accent employs Employee |
| `owns` | Employee → Deal | Employee owns Deal |
| `competed_with` | Product ↔ Product | SKU competed_with CompetitorSKU |
| `linked_to` | Any ↔ Any | Job linked_to Quote |

---

*Next: See MEMORY_SYSTEM.md for the full memory architecture design.*
