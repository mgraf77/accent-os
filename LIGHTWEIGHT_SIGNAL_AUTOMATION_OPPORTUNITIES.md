# LIGHTWEIGHT_SIGNAL_AUTOMATION_OPPORTUNITIES.md

This document identifies low-risk automation and orchestration opportunities that can be triggered by operational signals.

## 1. Low-Risk Automations

### **Follow-up Email Drafting**
- **Trigger:** **Flagged Quote Stagnation** > 48h.
- **Automation:** Use the existing `mailto:` generator to pre-draft a follow-up email to the customer, but include a specific line about "verifying project details".
- **Risk:** Zero (Requires user click to send).

### **Vendor Rep "Stale Data" Ping**
- **Trigger:** **Unverified Terms** on Tier A vendor.
- **Automation:** Auto-generate a "Request for Updated Terms" PDF using the Rep Outreach module's existing templates.
- **Risk:** Low.

---

## 2. Escalation Automation

### **Supervisor Notification**
- **Trigger:** **Lead Time Creep** signal reaches **Critical** for a top-10 vendor.
- **Automation:** Inject a specific alert into the "Owner/Manager" dashboard sub-tab with a "Review Vendor Status" action button.
- **Risk:** Very Low.

---

## 3. Stale-Data Detection

### **Inventory Cycle-Count Trigger**
- **Trigger:** `last_bin_check_date` > 180 days AND `qty_on_hand` > 10.
- **Automation:** Add a "Verify Count" task to the Warehouse Daily Brief.
- **Leverage:** Moves the warehouse toward a continuous cycle-count model without manual task management.

---

## 4. Operational Reminders

### **Incomplete Form Recovery**
- **Trigger:** **Form Abandonment** signal detected.
- **Automation:** Store the "Uncommitted State" in LocalStorage (like the Quote Draft system) and show a "Finish what you started?" toast on next session resume.
- **Leverage:** Recovers 5-10% of lost data entry effort.

---

## 5. Lightweight Orchestration

### **Brand Consolidation Suggestion**
- **Trigger:** **Fragmented Procurement** signal on a Quote.
- **Orchestration:** Suggest alternate SKUs from "Tier A" vendors currently in stock that match the category of the "Tier F" item on the quote.
- **Leverage:** Increases margin and reduces procurement friction.
