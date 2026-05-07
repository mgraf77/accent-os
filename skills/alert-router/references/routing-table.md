# Routing table
> Maps each of the 9 alert signal types to (owner_role, suggested_skill, urgency_tier, dedup_key, suggested_action). Read by `alert-router` Step 2. Edit this file to re-tune routing — never edit the SKILL.md.

## Tier definitions

| Tier | Meaning | SLA | Escalation destination |
|------|---------|-----|------------------------|
| 1 | Urgent — money or commitment at risk | 4 hours | Direct ping to owner + Hot block in daily brief |
| 2 | Daily — surface in next morning brief | 24 hours | Promote to brief Alerts top-3 |
| 3 | Weekly — review cadence | 7 days | Weekly review queue (`escalated_to_weekly=true`) |

## The 9 signal routes

| signal_type | owner_role | suggested_skill | urgency_tier | dedup_key template | suggested_action |
|-------------|------------|-----------------|--------------|--------------------|------------------|
| `deal_stale` | Sales | `email-drafter` | 2 (or 1 if amount ≥ $10K) | `deal_stale:deal_id={deal_id}` | `Email customer to re-open the deal` |
| `coop_deadline` | Owner | `coop-claim-drafter` | 1 (≤7d) / 2 (≤14d) | `coop_deadline:coop_id={coop_id}` | `Draft co-op claim before deadline` |
| `quote_cold` | Sales | `email-drafter` | 2 | `quote_cold:quote_id={quote_id}` | `Send quote follow-up email` |
| `inventory_low` | Warehouse | `next-action-recommender` | 1 (qty=0) / 2 | `inventory_low:sku={sku}` | `Reorder SKU or substitute` |
| `delivery_overdue` | Ops | `next-action-recommender` | 1 | `delivery_overdue:delivery_id={delivery_id}` | `Contact carrier; update customer ETA` |
| `warranty_expiring` | Sales | `email-drafter` | 2 (≤30d) / 1 (≤7d) | `warranty_expiring:warranty_id={warranty_id}` | `Notify customer of warranty window` |
| `showroom_expiring` | Marketing | `next-action-recommender` | 3 (≤14d) / 2 (≤7d) | `showroom_expiring:display_id={display_id}` | `Plan display refresh or removal` |
| `po_overdue` | Ops | `email-drafter` | 2 / 1 (≥14d overdue) | `po_overdue:po_id={po_id}` | `Email vendor; request shipment ETA` |
| `score_dropped` | Owner | `vendor-cascade` | 2 / 1 (Δ ≤ -5) | `score_dropped:vendor_id={vendor_id}` | `Investigate drop; vendor cascade trace` |

## Catch-all (unknown signal_type)

| owner_role | suggested_skill | urgency_tier | dedup_key | suggested_action |
|------------|-----------------|--------------|-----------|------------------|
| Owner | `next-action-recommender` | 2 | `unknown:{alert_id}` | `Triage and add to routing-table.md` |

## Role coverage check

Every role from the 5-role auth model (Owner, Manager, Sales, Warehouse, Admin) maps to at least one signal — except `Manager` and `Admin`. That's intentional: Managers see roll-ups via `daily-brief-composer`'s Owner-or-Manager template; Admins see the audit trail via `audit_log` not via routed alerts.

## Tier upgrades by amount/days

These upgrades are encoded as inline conditions in the table above. The general rule: dollar amount or days-overdue past a threshold bumps the tier by exactly 1 (T2 → T1). Never bump 2 tiers at once — that signals a generator threshold mistuning, not a routing decision.

## Editing rules

- One signal type = one row. If the same type splits by sub-condition (e.g. `coop_deadline ≤7d` vs `≤14d`), encode the split in the `urgency_tier` cell using slash notation, not duplicate rows.
- `suggested_skill` must reference an actual skill in `/home/user/accent-os/skills/`. If the skill doesn't exist yet, point to `next-action-recommender` as the temporary owner.
- `dedup_key` template variables must come from `alerts.payload` keys — never invent new fields.
- After editing, run `/skill-health` to verify no broken companion-link references.
