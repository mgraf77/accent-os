# ACCENTOS_ROLE_VISIBILITY_MATRIX.md — Role / Module Visibility Matrix
> First-pass visibility planning for AccentOS modules by role.
>
> ⚠️ IMPORTANT: This is UX VISIBILITY PLANNING only.
> This is NOT security enforcement. Real authorization must be enforced
> server-side via Supabase RLS + JWT role claims.
> The frontend `data-roles` attribute pattern is a UX filter, not a security boundary.
>
> Version: 1.0 — 2026-05-08

---

## ROLE DEFINITIONS

| Role | ID | Description |
|---|---|---|
| Owner / Admin | `owner` | Full access to everything. Business owner. |
| Manager | `manager` | Full operational access. No admin/governance. |
| Salesperson | `sales` | Quotes, pipeline, customers, product lookup. |
| Designer | `designer` | Product lookup, fixture finder, customer context, spec tools. |
| Builder / Trade Support | `builder` | Job tracker, product lookup, delivery status, customer context. |
| Warehouse / Operations | `warehouse` | Inventory, purchase orders, deliveries, receiving. |
| Read-Only / Viewer | `viewer` | Dashboard view only, no writes. |
| Future AI Agent | `ai_agent` | System-level reads only, no UI access. TBD. |

---

## VISIBILITY KEY

| Symbol | Meaning |
|---|---|
| ✅ | Visible + full action (create, edit, delete) |
| 👁 | Visible, read-only (no creates or edits) |
| ➕ | Visible + create only (no edit/delete) |
| 🔒 | Admin-only (Owner or owner-delegated admin) |
| 🚫 | Hidden — module not shown to this role |
| 🔮 | Future — not yet implemented for this role |
| ⚙️ | System-level only — no human UI |

---

## VISIBILITY MATRIX

### Dashboard / Daily Briefing

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Dashboard visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | 🚫 |
| Full metric tiles (pipeline, vendors, co-op) | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Sales-role tiles (my quotes, my deals) | 🚫 | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Warehouse tiles (inventory alerts, PO due) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 |
| Next Actions row | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | 🚫 |

### Vendor Intelligence

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View vendor scores | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Edit vendor scores | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| View co-op tracker | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Edit co-op tracker | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| View changelog | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Override vendor tier | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Quote Generator

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Create / edit quotes | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| View all quotes | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View own quotes | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Delete quotes | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| AI parse notes | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Export CSV | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Product Lookup / Inventory

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | ⚙️ |
| View inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | ⚙️ |
| Edit inventory | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 |
| CSV import | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 |

### Fixture Finder

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 |
| Search fixtures | ✅ | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 |

### Pricing Tools / Price Book

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View pricing | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Edit cost/pricing | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| View margins | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Competitive pricing | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Rep Management

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| View rep assignments | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Edit rep assignments | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Rep territory data | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Customer Workflows (CRM)

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | ✅ | 👁 | 🚫 | 🚫 | ⚙️ |
| View all customers | ✅ | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View own customers | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| Add / edit customers | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Log interactions | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| View RFM segmentation | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Delete customers | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Builder / Designer Workflows (Jobs)

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | ⚙️ |
| View all jobs | ✅ | ✅ | ✅ | 👁 | 👁 | 👁 | 👁 | ⚙️ |
| Create / edit jobs | ✅ | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 |
| Change job status | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| Delete jobs | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Sales Pipeline

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View all deals | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View own deals | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Create / move deals | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Archive / delete deals | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| View forecast | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Reports

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Run / view reports | ✅ | ✅ | 👁 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Export reports | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Financial reports | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### AI Tools

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| AI parse (quote notes) | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| AI assist (future) | 🔮 | 🔮 | 🔮 | 🔮 | 🔮 | 🚫 | 🚫 | 🔮 |

### Integrations

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View integrations | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Configure integrations | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### Governance / Admin

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| User management | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Role assignment | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| Audit log view | 🔒 | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| System settings | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

### System Health

| Feature | Owner | Manager | Sales | Designer | Builder | Warehouse | Viewer | AI Agent |
|---|---|---|---|---|---|---|---|---|
| Module visible | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| View health metrics | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚙️ |
| Restart / fix actions | 🔒 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

---

## SIDEBAR MODULE VISIBILITY BY ROLE

### Owner / Admin sees:
Dashboard, Vendor Intelligence, Quote Generator, Product Lookup, Fixture Finder, Pricing Tools, Rep Management, Customers, Jobs/Trade, Pipeline, Employees, Reports, AI Tools, Integrations, Admin, System Health, Calendar, Knowledge Hub, Marketing, Decision Engine, Deal Optimizer, Competitive Pricing, Deliveries, Warranty, PO, Mgmt Dashboard

### Manager sees:
Dashboard, Vendor Intelligence, Quote Generator, Product Lookup, Fixture Finder, Pricing Tools, Rep Management, Customers, Jobs/Trade, Pipeline, Employees, Reports, AI Tools, Calendar, Knowledge Hub, Marketing, Decision Engine, Deal Optimizer, Competitive Pricing, Deliveries, Warranty, PO, Mgmt Dashboard

### Salesperson sees:
Dashboard, Quote Generator, Product Lookup, Fixture Finder, Customers, Pipeline, Jobs, Reports (own), AI Tools, Calendar, Knowledge Hub, Deal Optimizer

### Designer sees:
Dashboard, Quote Generator, Product Lookup, Fixture Finder, Customers (own context), Jobs, AI Tools, Calendar, Knowledge Hub

### Builder / Trade sees:
Dashboard, Product Lookup, Fixture Finder, Jobs, Deliveries, Calendar, Knowledge Hub

### Warehouse sees:
Dashboard, Inventory/Product Lookup, Purchase Orders, Deliveries, Calendar

### Viewer sees:
Dashboard (read-only), Product Lookup (read-only)

---

## IMPLEMENTATION NOTES

### Current Implementation
The existing `data-roles` attribute on sidebar items (`data-roles="owner,admin,manager"`) provides frontend-only role gating. This is the correct pattern for UX visibility.

### What Must Be Added for Real Security
1. **Supabase RLS policies** — per-table policies enforcing role claims (M01 partially does this)
2. **JWT role claims** — the user's role must be in the JWT, verified server-side on every request
3. **API-level checks** — any server function / worker must verify the JWT role before returning data
4. **Row-level visibility** — "view own quotes" vs "view all quotes" requires `auth.uid()` checks in RLS

### Phase Gate for Real Enforcement
This matrix is: **Phase 1 — UX visibility planning** ✅
Real enforcement: **Phase 4 — Security hardening** (future)

Do not ship this matrix as security. Mark it clearly as UX-only in any user-facing documentation.
