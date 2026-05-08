# AccentOS Operations SOPs
> Last updated: 2026-05-08

## Daily Operations Flow
1. Login to AccentOS → Dashboard shows role-aware Daily Command Center
2. Review "What Needs Attention" tiles (alerts, stale deals, co-op deadlines)
3. Sales reps: check My Tasks + Decision Engine recommendations
4. Management: check Owner Dashboard → KPIs → Goals
5. Purchasing: Demand Forecast → reorder-now SKUs → create Purchase Orders

## Quote Generation SOP
1. Open Quote Generator → New Quote
2. Fill: customer name, project name, contact, project type, sqft, budget
3. Use "Parse Notes" (⚡) to AI-extract line items from fixture schedules
4. Review line items → approve/reject each row
5. Check margin analysis
6. Save quote → auto-assigns QT-#### number
7. Follow up: Decision Engine surfaces stale quotes at 7d (>$500)

## Vendor Co-op Claim SOP
1. Vendor Ranking → Co-op Funds tab
2. Filter by status = open + deadline ≤30d
3. For each fund: note vendor, amount, deadline, fund type
4. Contact vendor rep directly (use Rep List for contact info)
5. Submit claim per vendor's process
6. Update fund status → claimed when processed

## Delivery Scheduling SOP
1. Deliveries page → New Delivery
2. Link to customer (auto-fills name + address from CRM)
3. Link to related Job/Quote/PO
4. Set scheduled date + time window
5. Assign driver + vehicle
6. Day-of: update status → out_for_delivery when truck leaves
7. On completion: update status → delivered (auto-sets delivered_at timestamp)

## Purchase Order SOP
1. Purchase Orders → New PO
2. Select vendor → fill line items (part, description, qty, cost)
3. Add tax + freight
4. Link to related Quote/Job
5. Submit → PO-#### auto-assigned
6. On receipt: "Mark Received & Update Inventory" → auto-increments inventory qty
7. PO status workflow: draft → submitted → partial_receipt → received → cancelled

## New Vendor Onboarding (AccentOS)
1. Add vendor to Vendor Ranking (if not already in VD_RAW)
2. Score all 14 categories → mark each Verified/Unverified/N/A
3. Assign to parent company group (if applicable)
4. Add rep group assignment
5. Track any co-op/rebate programs in Co-op Funds tab
6. Set display program (if applicable) in Showroom Displays

## Warranty Claim SOP
1. Warranty page → New Claim (W-#### auto-assigned)
2. Link to vendor (required) + customer (optional)
3. Link to original quote if known
4. Set severity: cosmetic / functional / safety
5. Describe issue + set status: open
6. Workflow: open → sent_to_vendor → approved/denied → replaced/refunded → closed
7. Track cost-to-us for vendor scorecard purposes
