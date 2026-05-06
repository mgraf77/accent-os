---
id: sop-002-quote-to-close
title: SOP-002 — Quote to Close
type: sop
status: published
weight: 9
tags: [quote, deal, close, pipeline, sale, customer, create-quote, win-deal, job, SOP, AccentOS, sales-workflow]
related: [sop-001-vendor-onboarding, sop-003-inventory-reorder, emp-sales, indoor-decorative, adr-005-append-only-observations]
created: 2026-05-06
updated: 2026-05-06
---

# SOP-002 — Quote to Close

End-to-end workflow: customer inquiry → quote → deal → closed job.

## Prerequisites

- Sales, Manager, Admin, or Owner role
- Customer record exists (or you'll create one inline)

---

## Steps

### 1. Create or verify the customer record

1. Open **AccentOS → Customers**.
2. Search for the customer by name or company.
   - If found: open the record and confirm contact info is current.
   - If not found: click **+ Add Customer** and fill name, company, type (residential / trade / commercial), email, phone.
3. Note the customer's **RFM segment** (Prospects need higher attention than VIPs who already trust us).

### 2. Build the quote

1. Open **AccentOS → Quote Generator**.
2. Click **+ New Quote**.
3. Fill in:
   - **Customer** — select from dropdown
   - **Type** — residential / commercial / trade
   - **Contact** — email or phone for follow-up
   - **Square footage** (optional but useful for layered-lighting upsell)
4. Add line items:
   - Use the **Price Book** (Vendor Ranking → Price Book) to check current cost + margin before setting list price.
   - Add notes per line if fixture selection is pending.
5. Apply discount if applicable — check vendor co-op fund availability (Co-op Tracker) before absorbing margin.
6. Save. Quote number (QT-####) auto-assigns.

### 3. Create a deal in the pipeline

1. Open **AccentOS → Sales Pipeline**.
2. Click **+ Add Deal**.
3. Link to the quote by typing the quote number in the **Quote** field.
4. Set:
   - **Stage**: Quoted
   - **Expected close date**: best estimate
   - **Value**: copy from quote total
5. The probability model auto-computes based on customer history, quote age, lead source, and stage.
6. Save.

### 4. Follow up (pipeline cadence)

- **Day 0**: quote delivered, deal at Quoted stage.
- **Day 7**: first follow-up. Move to **Negotiating** if the customer is engaged.
- **Day 21**: quote becomes "stale" — Daily Brief surfaces it. Re-engage or close as Lost.
- Stale deals (14+ days no update) trigger an Intelligent Alert. Act on it before it escalates to red.

### 5. Win the deal

1. When the customer commits:
   - Open the deal, move stage to **Won**.
   - Enter the actual close date.
2. Click **+ Create Job** (available on Won deals) to pre-fill a Job from the deal and customer data.
3. The Job Tracker will track the fulfillment workflow from here.

### 6. Convert to Purchase Order (if items need to be ordered)

1. Open the saved quote (Quote Generator → Saved Quotes).
2. Click **+ PO** next to the quote — a PO draft pre-fills with the quote's vendor lines.
3. Confirm quantities, add freight/tax, save.
4. When goods arrive: click **Mark Received** on the PO — inventory auto-increments for matching SKUs.

### 7. Close the job

1. Open **Job Tracker**, find the job linked to the deal.
2. As work progresses, update the job status: Scheduled → In Progress → Delivered → Complete.
3. When complete: status flips to `complete`, `completed_at` auto-sets.

---

## Notes

- If a deal is lost: move stage to **Lost**, enter the loss reason. This feeds the Close Rate metric and the probability model over time.
- For trade / designer customers: discount structure lives in the **Trade Partners** module — reference before quoting.
- For large commercial quotes: confirm DLC listing and freight estimate (see `commercial-hospitality` cluster page).
