# Email Type Catalog

> The five email types email-drafter supports. Each entry: trigger phrasing, primary Supabase table, subject pattern, body shape, tone guide, banned phrases. Used by SKILL.md Step 1 (classify) + Step 4 (draft prompt construction).

---

## Type 1 — outreach

**When to use:** First touch (or first touch in 90+ days) to a customer or prospect. Warm-but-not-pushy intro that opens a loop without a hard ask.

**Trigger phrasing:**
- "draft outreach to [name]"
- "intro email to [customer]"
- "reach out to [customer]"
- "first email to [name]"
- "warm intro for [segment]"

**Primary table:** `customers` (+ `customer_interactions` for last-touch context, + segment-aware tone via `customers.segment`)

**Subject pattern:**
- `[product/category] for [project name]` — e.g. `landscape lighting for the redmond addition`
- `quick question — [their context]`
- `[mutual connection/event] follow-up`

**Body shape (3 short paragraphs max):**
1. Why-this-email anchor: a specific fact (their project, mutual connection, vendor they spec'd) — never generic.
2. One-sentence value: what Accent Lighting offers that maps to their context.
3. Soft close: an open question OR a one-line offer. Never "let me know if you're interested".

**Tone:** warm, low-pressure, register-mirror Michael's casing. No exclamation marks. No "excited to connect".

**Banned phrases:** "I hope this email finds you well", "I wanted to reach out", "circling back" (this is first touch, can't circle back), "I came across your name", "synergy".

---

## Type 2 — follow-up

**When to use:** Continuation of an existing thread. Customer or vendor responded (or didn't) and Michael needs to nudge.

**Trigger phrasing:**
- "follow up with [customer]"
- "check in on [deal]"
- "circle back to [name]"
- "nudge [vendor] on the [topic]"
- "ping [customer] about the quote"

**Primary table:** `pipeline_deals` (+ `deals_stage_history` for last 3 stage transitions, + linked `quotes` row, + linked `customers` row)

**Subject pattern:**
- `re: [original subject]` (preferred — preserves thread)
- `[deal name] — quick check`
- `still good for [milestone they committed to]?`

**Body shape (2 short paragraphs):**
1. Reference the prior context concretely (date + last topic + last stage). Never "as previously discussed".
2. Specific next step OR a low-friction question. Default to a question if the thread has stalled >7 days.

**Tone:** continuation, not restart. Assume they remember. Short.

**Banned phrases:** "circling back" (use it sparingly — only if Michael himself uses it; avoid by default), "touching base", "per my last email", "as previously mentioned", "just following up to see if".

---

## Type 3 — co-op-claim

**When to use:** Submit a co-op / MDF / rebate claim to a vendor. Claim has a deadline; output must include the dollar amount, the supporting invoice ids, and the deadline.

**Trigger phrasing:**
- "claim co-op from [vendor]"
- "MDF claim for [vendor]"
- "rebate claim — [vendor]"
- "submit co-op for [campaign]"

**Primary table:** `coop_tracker` (+ `vendors` row for claim contact, + `vendor_overrides.notes` for vendor-specific claim quirks, + `invoices` for proof attachments)

**Subject pattern:**
- `co-op claim — [campaign name] — [period] — Accent Lighting`
- `MDF claim submission — [vendor program name] — Q[N] [year]`
- `rebate request — [PO #] — Accent Lighting`

**Body shape (factual, scannable, ≤6 lines):**
1. Greeting + claim type + program name.
2. Dollar amount + period covered.
3. Supporting invoice ids (bulleted).
4. Reference to the vendor's claim portal / form / email-only requirement (from `vendor_overrides.notes`).
5. Deadline acknowledgment + claim window.
6. Close: "let me know if you need anything else from us."

**Tone:** factual, deadline-driven, no flowery framing. This is paperwork-with-prose.

**Banned phrases:** Anything resembling "I hope you can approve this" — that frames it as a favor, not an entitled claim. Avoid "kindly" entirely.

**HOLD-FOR-REVIEW always.** Co-op claims always include a dollar amount → triggers HOLD-FOR-REVIEW per send-or-hold-rules.md.

---

## Type 4 — quote-revival

**When to use:** A quote has gone cold (≥30 days since last contact OR `quotes.status = 'expired'`). Surface a hook: a price drop, restock, lead-time improvement, or a new line item that fits their original spec.

**Trigger phrasing:**
- "revive quote Q-####"
- "wake up that quote"
- "revive the [customer] quote"
- "follow up on cold quote"
- "quote revival for [customer]"

**Primary table:** `quotes` (+ `quote_lines` top-5-by-value, + `customers` row, + `competitor_prices` for "price dropped" hook detection if available)

**Subject pattern:**
- `update on [quote name / project name]` — e.g. `update on the redmond pendants`
- `[product] is back in stock — your quote`
- `price drop on [SKU] — wanted to flag`
- `quote Q-#### — refresh?`

**Body shape (2 paragraphs):**
1. The hook (concrete change since the quote went cold): price drop $X, lead time improved from N to M weeks, new option in the same family, or simply "wanted to check if the project's still active."
2. Quote reference + offer to refresh / extend / re-quote. Soft close.

**Tone:** low-pressure. The customer didn't respond for a reason; don't pretend nothing happened.

**Banned phrases:** "I noticed you didn't respond" (passive-aggressive), "are you still interested" (forces a yes/no the customer doesn't want to give), "just checking in" (filler).

---

## Type 5 — vendor-correspondence

**When to use:** Direct vendor email about a PO, lead time, defect, dispute, request for samples, request for spec sheets, etc. Not a co-op claim — that's Type 3.

**Trigger phrasing:**
- "email [vendor] about [topic]"
- "ask vendor for [spec / sample / ETA]"
- "PO question for [vendor]"
- "dispute [vendor] on [issue]"

**Primary table:** `vendors` (+ `rep_groups` row for cc'ing the rep, + recent `purchase_orders` filtered by `vendor_id` for PO context, + recent `coop_tracker` for context-aware reference)

**Subject pattern:**
- `[PO #] — [topic]` — e.g. `PO-7842 — ETA update?`
- `[product line] spec sheet request — Accent Lighting`
- `defect — [SKU] — order [ref]`
- `lead time check — [SKU]`

**Body shape (direct, ≤4 lines):**
1. Reference (PO #, SKU, order #, claim #).
2. The ask in one sentence.
3. Context (1-2 lines max).
4. Specific deadline or next-step ask.

**Tone:** direct, professional, no preamble. Vendor-side often forwards/CC's the rep group; assume the rep_group_id contact gets cc'd per row in `rep_groups`.

**Banned phrases:** "Hope you're doing well" (vendor doesn't need it), "as per our conversation" (just say what was said), "kindly".

---

## Type-disambiguation rules (for Step 1)

If Michael's phrasing matches >1 type:

| Handle present | Default type |
|---------------|--------------|
| `quote_id` only | quote-revival (if cold) OR follow-up (if active) |
| `deal_id` only | follow-up |
| `customer_id` + no prior interactions | outreach |
| `customer_id` + recent interaction | follow-up |
| `vendor_id` + topic mentions co-op/MDF/rebate | co-op-claim |
| `vendor_id` + topic mentions PO/SKU/ETA/defect | vendor-correspondence |

If still ambiguous after the table: default to **follow-up** (lowest-stakes, easiest to revise).
