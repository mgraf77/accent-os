---
type: module
slug: customers
title: Customers Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Customers Module

**File**: `js/customers.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadCustomers()`
- `sbLoadCustomerInteractions()`
- `sbSaveCustomer()`
- `sbDeleteCustomer()`
- `sbSaveCustomerInteraction()`
- `sbDeleteCustomerInteraction()`
- `sbUpdateCustomerField()`
- `commitCustomerCell()`
- `sbBulkSaveCustomers()`
- `computeCustomerRFM()`
- `segmentBadge()`
- `customers()`
- `renderCustomers()`
- `doBulkCustomerDelete()`
- `openCustomerDetail()`
- `createDealFromCustomer()`
- `openCustomerEdit()`
- `saveCustomer()`
- `deleteCustomerConfirm()`
- `openCustomerInteractionEdit()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `customers: {t:'...', s:'...'}`
- pages dispatcher: `customers` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
