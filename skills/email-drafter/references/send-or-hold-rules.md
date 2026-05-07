# Send-or-Hold Rules

> Decision matrix used by SKILL.md Step 5 to classify a draft as SEND, HOLD-FOR-REVIEW, or DO-NOT-SEND. The rules are deterministic — model "feels confident" never overrides them. Michael always has the final call; this is advisory.

---

## DO-NOT-SEND (highest priority — checked first)

Output DO-NOT-SEND if **any** of the following is true:

| Condition | Source | Reason |
|-----------|--------|--------|
| `customers.do_not_contact = true` | Supabase | Customer opted out / flagged. |
| `vendor_overrides.notes` contains "no email" / "do not email" / "portal only" | Supabase | Vendor has a non-email channel. |
| `customers.email` is NULL or invalid | Supabase | No deliverable address. |
| Fact-confidence (% of body claims sourced from Supabase) < 0.7 | computed | Risk of fabrication too high. |
| Draft contains a `[verify: ...]` marker on a critical field (price, deadline, dollar amount) | computed | Critical uncertainty. |
| Customer email matches an internal Accent Lighting domain (`@accent-lighting.com` or similar) | computed | Risk of self-emailing in error. |
| Quote / deal value > $25,000 | Supabase | Always escalate above $25k for human eyes. (Override of HOLD — graduates to DO-NOT-SEND-WITHOUT-MICHAEL.) |

When DO-NOT-SEND fires, the output's `SEND-OR-HOLD:` line reads `DO-NOT-SEND — [reason]`. The reasoning block names the exact rule fired and the source column / computed value.

---

## HOLD-FOR-REVIEW (default for high-stakes drafts)

Output HOLD-FOR-REVIEW if any of the following is true (and none of the DO-NOT-SEND rules fired):

| Condition | Source | Reason |
|-----------|--------|--------|
| Email type = co-op-claim AND `claim_amount > 0` | always | All claims with $ require human review. |
| Deal / quote value ≥ $5,000 | Supabase | Mid-stakes — needs Michael's eyes. |
| Body mentions a price quote not in `quote_lines` | computed | LLM-generated price → must verify. |
| Body mentions a discount % | computed | Discount language is commitment-y. |
| Body references a stage change in `pipeline_deals` | computed | Stage commitments matter. |
| Body promises a future action (delivery date, install date, refund) | computed | Operational commitment. |
| Recipient is a vendor and email mentions a dispute or escalation | computed | Vendor-relationship risk. |
| Email type = vendor-correspondence AND topic is defect / return / dispute | computed | Vendor-relationship risk. |

When HOLD-FOR-REVIEW fires, the reasoning block lists *what to verify* before sending. Examples:
- "verify BACL price drop is current — pull `competitor_prices` for SKU 12-PND-OB"
- "verify deadline is correct: `coop_tracker.deadline = 2026-05-22`"
- "verify $14,200 total matches `quotes.total_value`"

---

## SEND (low-stakes, fact-confidence ≥ 0.9)

Output SEND only when **all** of the following are true:

- None of the DO-NOT-SEND rules fired.
- None of the HOLD-FOR-REVIEW rules fired.
- Email is a routine follow-up, intro, or scheduling email.
- Deal / quote value < $5,000 (or no $ context at all).
- Fact-confidence ≥ 0.9 (≥90% of body claims trace to Supabase columns).
- No price quotes, discounts, deadlines, or commitments in the body.

When SEND fires, the reasoning block reads: `SEND — routine, low-stakes, fact-confidence [X.XX]`.

**Default bias toward HOLD.** If the rules are ambiguous, default to HOLD-FOR-REVIEW. Michael can override; the gate prevents auto-confidence drift over time.

---

## Fact-confidence computation

For each claim in the body, classify as:
- **Verified:** traces directly to a Supabase column the skill pulled in Step 2. Score: 1.0.
- **Inferred:** derived from Supabase data (e.g. "your quote from January" derived from `quotes.created_at`). Score: 0.8.
- **Generic:** content the LLM added that doesn't depend on Supabase facts (e.g. "let me know if that works"). Score: 1.0 (counted as safe).
- **Unsourced:** the LLM asserted something not in the context block. Score: 0.0.

Fact-confidence = (sum of scores) / (count of claims).

If any claim is **Unsourced**, drop fact-confidence to ≤0.7 regardless of the other claims, which forces DO-NOT-SEND.

---

## Reasoning block format

The reasoning block in the SEND-OR-HOLD output line:

```
SEND-OR-HOLD: [SEND | HOLD-FOR-REVIEW | DO-NOT-SEND]
  rule fired:        [name of the highest-priority rule that fired]
  fact-confidence:   [0.00–1.00]
  high-stakes flags: [comma-separated list of any HOLD triggers, even if the recommendation is SEND]
  next-step:         [what Michael should verify before sending, if HOLD]
```

If multiple rules fire at the same level, name the most consequential one (e.g. "$ amount" beats "discount mention").

---

## Override / escalation hooks

- If Michael's prompt explicitly says "send anyway", "I'll send it", or "I trust the draft" — keep the recommendation as-is in the output, but Michael's prompt overrides at the harness layer. The skill outputs the rule that *would* have fired, for the audit trail.
- If the draft is HOLD or DO-NOT-SEND and Michael says "fix it" — re-run Step 4 with stricter constraints (drop the HOLD-triggering element from the body, re-classify).
- Never auto-promote a HOLD to SEND. The promotion is Michael's call.
