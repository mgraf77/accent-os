---
name: coop-claim-drafter
description: >
  Auto-draft AccentOS vendor co-op fund claims for Accent Lighting before
  vendor-imposed deadlines so co-op money never expires unclaimed. Pulls
  per-vendor co-op rules (eligibility %, deadline pattern, required
  documentation) from `vendor_overrides` on Supabase hsyjcrrazrzqngwkqsqa,
  joins eligible spend windows from `coop_tracker` + `purchase_orders` +
  `invoices`, prioritizes vendors by deadline-urgency × claim-amount, and
  emits one paste-ready draft per active window plus a portfolio summary.
  Use this skill when Michael says: "draft co-op claims", "draft the
  co-op claims", "what co-op is about to expire", "find unclaimed co-op",
  "co-op deadline scan", "scan co-op deadlines", "claim vendor co-op",
  "what's the co-op pipeline", "co-op pipeline", "money left on the
  table from co-op", "knock out co-op claims", or any phrasing that asks
  AccentOS to surface and prepare co-op fund claims across the whole
  portfolio. Do not use this skill for one-off ad-hoc co-op emails to a
  named single vendor (those go to email-drafter), for rebate tracking
  that isn't co-op (separate program), or for actually sending the claim
  (the draft is consumed by email-drafter and queued by action-queue).
  Always produces per-vendor claim drafts with a required-documentation
  checklist plus a portfolio table — never sends, never auto-approves,
  never invents a deadline that isn't in `coop_tracker.deadline` or
  derived from `vendor_overrides.coop_deadline_pattern`.
---

# coop-claim-drafter

**Purpose:** Convert AccentOS's vendor co-op program metadata + actual purchase spend into a deadline-prioritized stack of paste-ready co-op claim drafts so Accent Lighting collects every dollar of co-op fund before it expires — the L4 "Draft actions" rung of the Capability Ladder, scoped to co-op claims only.

Closes: V06 (MASTER §14 — "Vendor co-op money is claimed automatically before deadlines") · Capability Ladder L4 (Draft actions, narrow specialization).

---

## Boundary vs. email-drafter

This skill is a **specialization** of `email-drafter`, not a replacement:

| Use this skill when | Use `email-drafter` when |
|---|---|
| Michael wants a deadline-driven scan of all eligible co-op windows | Michael names one specific vendor and says "claim co-op from [vendor]" |
| The output is a portfolio (multiple vendors at once) | The output is a single email |
| The trigger is time-based ("scan", "what's about to expire") | The trigger is vendor-specific ("draft to Kichler about Q2 co-op") |

**Handoff protocol:** This skill drafts the claim *content* (subject, to, body, attachments-needed list, deadline, eligible amount). It then **delegates the email composition voice-pass to `email-drafter`** for each vendor (passing `type=co-op-claim` + the prepared CONTEXT block) and **routes the resulting draft to `action-queue`** in `PROPOSED` state. Michael approves via `action-queue`; `action-queue` then calls `email-drafter` for the actual send. This skill never sends, never queues without an explicit human handoff, never bypasses `action-queue`.

---

## Trigger Recognition

Run this skill when Michael says anything like (lowercase / terse / typo variants all count — match his register per `vibe-speak/profiles/michael.md`):
- "draft co-op claims" / "draft the co-op claims" / "knock out co-op claims"
- "what co-op is about to expire" / "what's expiring"
- "find unclaimed co-op" / "where's our co-op money" / "money left on the table from co-op"
- "co-op deadline scan" / "scan co-op deadlines" / "co-op scan"
- "claim vendor co-op" (no specific vendor named — if a vendor *is* named, route to `email-drafter`)
- "what's the co-op claim pipeline" / "co-op pipeline" / "co-op status"
- "run the co-op drafter" / "co-op drafter"

Also trigger when `daily-brief-composer` surfaces a co-op deadline tile within 30 days, or when `next-action-recommender` proposes promoting a co-op claim to a queued action.

**Boundary vs. email-drafter (crisp rule):** if Michael names exactly one vendor (e.g., "claim co-op from Kichler", "ping Visual Comfort about co-op"), `email-drafter` runs. If the trigger is plural, time-driven, or asks AccentOS to *find* the claims, this skill runs first and delegates per-vendor drafting back to `email-drafter`.

---

## Step 0 — Preflight (partial-blocked gate + parallel reads)

This skill has a **partial-blocked gate** — the per-claim records (`coop_tracker`) already exist in AccentOS, but the *rule-level* vendor co-op config (eligibility %, deadline pattern, required documentation) is the missing data dependency. Specifically: Michael needs three columns added to `vendor_overrides`.

**Run in parallel:**

1. Read `references/proposed-schema.md` — the schema additions needed on `vendor_overrides`.
2. Read `references/claim-template.md` — the canonical co-op claim email shape (subject pattern, body sections, attachment-list format).
3. Read `references/eligibility-rules.md` — the deadline-urgency × claim-amount priority formula and the configurable thresholds (default: deadline <30 days AND eligible-spend > $500).
4. Probe Supabase hsyjcrrazrzqngwkqsqa via `supabase-sql-magic`:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'vendor_overrides'
     AND column_name IN ('coop_eligibility_pct', 'coop_deadline_pattern', 'coop_documentation_required');
   ```

**Stub-mode branch.** If the probe returns < 3 rows (i.e., one or more of the three columns is missing), return this stub and exit:

> warning: skill `coop-claim-drafter` is running in **partial stub mode**. The per-claim ledger `coop_tracker` exists, but vendor-level co-op rules are not yet captured on `vendor_overrides`. Missing column(s): [list of columns that returned 0 rows]. To unblock:
>
> 1. Apply the schema in `skills/coop-claim-drafter/references/proposed-schema.md` to Supabase hsyjcrrazrzqngwkqsqa via `apply_migration` (or paste the SQL in `supabase-sql-magic`).
> 2. Backfill values for the top 20 vendors by FY purchase volume (Michael typically knows these by memory or via vendor binders).
> 3. Re-run this skill.
>
> Until then, this run will fall back to deadline-only scanning of `coop_tracker.deadline` — see Step 1's stub branch.

**Active-mode branch.** If all three columns exist, proceed to Step 1.

**Failure-path notes (Pass-2 hardening):**

- **Columns exist but all rows NULL** (schema landed but no backfill): Step 1's query returns 0 rows. Surface explicitly — don't fall through to "no claims" silently. Output: `Schema present, but no vendor has co-op rules configured. Backfill top-N vendors per references/proposed-schema.md. Falling back to coop_tracker.deadline scan.` Then run the stub-mode `coop_tracker` scan as a partial pass.
- **Zero purchase_orders in computed window** (e.g., newly-onboarded vendor with co-op rules but no spend yet): Step 2 returns `gross_spend = 0`. Filter rows where `eligible_amount = 0` to the watch list with reason `no spend in window`, never to the draft list. Drafting a $0 claim wastes the vendor's review cycle.
- **email-drafter partial failure during Step 5** (e.g., Anthropic API 429 on draft 4 of 7): emit the drafts that succeeded, list the failed-vendors with their CONTEXT block intact in BLOCK 3, and append a remediation entry in BLOCK 4: `email-drafter failed for vendors [list] — re-run skill or invoke email-drafter directly`. Never abort the whole portfolio for one failure.

---

## Step 1 — Pull all vendors with active co-op config

Active-mode SQL (via `supabase-sql-magic`):

```sql
SELECT
  v.id              AS vendor_id,
  v.name            AS vendor_name,
  v.claim_email,
  v.claim_portal_url,
  vo.coop_eligibility_pct,
  vo.coop_deadline_pattern,
  vo.coop_documentation_required,
  vo.notes          AS vendor_notes
FROM vendors v
JOIN vendor_overrides vo ON vo.vendor_id = v.id
WHERE vo.coop_eligibility_pct IS NOT NULL
  AND vo.coop_deadline_pattern IS NOT NULL
ORDER BY v.id;
```

If 0 rows, output: `No vendors have co-op rules configured. Backfill vendor_overrides per references/proposed-schema.md.` and exit.

**Stub-mode fallback** (if Step 0 reported missing columns): pull only `coop_tracker` rows where `status = 'open'` and `deadline > now()`, treating each row as its own claim window. Skip Step 2's eligibility computation and use `coop_tracker.claim_amount` directly.

---

## Step 2 — Compute eligible spend per vendor for the current claim window

For each vendor from Step 1, derive the active claim window from `coop_deadline_pattern` (e.g., `"quarterly:end-of-quarter+30d"`, `"annual:dec-31+60d"`, `"calendar:Q1,Q2,Q3,Q4:claim-30d"`). Map the pattern to a concrete `period_start`, `period_end`, and `deadline`. See `references/deadline-pattern-grammar.md` for the pattern parser.

Then compute eligible spend for that window:

```sql
SELECT
  vendor_id,
  SUM(po.total_value) AS gross_spend,
  ROUND(SUM(po.total_value) * (vo.coop_eligibility_pct / 100.0), 2) AS eligible_amount
FROM purchase_orders po
JOIN vendor_overrides vo ON vo.vendor_id = po.vendor_id
WHERE po.vendor_id = $1
  AND po.issued_at >= $2  -- period_start
  AND po.issued_at <  $3  -- period_end
  AND po.status IN ('received', 'invoiced', 'paid')
GROUP BY vendor_id, vo.coop_eligibility_pct;
```

Emit per vendor: `{vendor_id, vendor_name, period_start, period_end, deadline, gross_spend, eligible_amount, claim_email, documentation_required, days_until_deadline}`.

---

## Step 3 — Apply prioritization filter

For each vendor's record from Step 2, apply the **deadline-urgency × claim-amount** priority formula from `references/eligibility-rules.md`:

```
priority_score = (1 / max(days_until_deadline, 1)) * eligible_amount
```

Filter to draft-worthy vendors:
- `days_until_deadline < 30` (configurable via `coop_drafter.deadline_threshold_days`, default 30)
- `eligible_amount > 500` (configurable via `coop_drafter.min_amount_threshold`, default $500)
- Claim is not already `status = 'submitted'` or `status = 'claimed'` in `coop_tracker` for the same `(vendor_id, period_end)` pair

Sort descending by `priority_score`. This is the **draft list**.

Vendors that have non-null co-op config but fall outside the thresholds go on a **watch list** (output as a separate table — Michael wants visibility, not just drafts).

---

## Step 4 — Vendor-risk pre-check

Before drafting, run `vendor-risk-register` against the draft list (read-only check — do not modify the register). For any vendor flagged `at-risk` (e.g., currently in dispute, payment hold, contract renegotiation), tag the draft with **HOLD-FOR-REVIEW: vendor-risk** and add a one-line reasoning note in the draft's reasoning block. Do not skip drafting — Michael decides; this skill surfaces.

---

## Step 5 — Draft each claim (delegate to email-drafter)

For each vendor in the draft list, build a CONTEXT block per `references/claim-template.md` then invoke `email-drafter` with `type=co-op-claim` and the assembled context. The CONTEXT block carries:

- `vendor_id`, `vendor_name`, `claim_email`, `claim_portal_url`
- `program_name` (derived from `coop_deadline_pattern`)
- `period_start`, `period_end`, `deadline`, `days_until_deadline`
- `gross_spend`, `eligible_amount`
- `documentation_required` (parsed list from `vendor_overrides.coop_documentation_required` — typically a JSON array like `["co-op claim form", "ad placement screenshots", "invoice copies", "proof-of-publication"]`)
- `vendor_notes` (claim quirks: "email PDF only", "portal upload required", "needs rep cosign")
- `risk_flag` (if Step 4 fired)

`email-drafter` returns a paste-ready draft (subject + to + body + send-or-hold + reasoning). This skill does not re-compose — voice calibration is `email-drafter`'s job.

---

## Step 6 — Route drafts to action-queue

For each draft from Step 5, build an `action-queue` row:

```
{
  type: "co-op-claim",
  vendor_id: [vendor_id],
  payload: { subject, to, body, attachments_needed: [...], deadline, eligible_amount },
  idempotency_key: "coop-claim-{vendor_id}-{period_end}",
  proposed_at: now(),
  state: "PROPOSED"
}
```

Invoke `action-queue` once per draft (one invocation per row, not a batch call) with the row above as the payload. The `idempotency_key` ensures re-running this skill the same day doesn't duplicate queue rows for the same `(vendor_id, period_end)` pair — `action-queue` returns the existing row id on collision rather than creating a duplicate.

---

## Step 7 — Emit the portfolio summary

Final report to Michael (single message). See **Output format** below.

---

## Output format

```
COOP CLAIM DRAFTER — [date]

Mode: [active | partial-stub: missing column(s) X]
Vendors scanned: [N from Step 1]
Drafts produced: [count from Step 3 draft list]
Watch list: [count]
Total claim potential (drafts only): $[sum eligible_amount]
Earliest deadline: [vendor — date — days left]

═══ BLOCK 1: DRAFT LIST (queued to action-queue) ═══

| Vendor | Period | Deadline | Days left | Eligible $ | Risk flag | Queue ID |
|--------|--------|----------|-----------|------------|-----------|----------|
| Kichler | Q1 2026 | 2026-05-31 | 24 | $4,200 | — | aq_1742 |
| Hubbardton Forge | FY2025 | 2026-05-15 | 8 | $2,800 | HOLD: vendor-risk | aq_1743 |
| Visual Comfort | Q1 2026 | 2026-06-10 | 34 | $7,100 | — | (skipped: outside threshold) |

═══ BLOCK 2: WATCH LIST (no draft, surfaced for awareness) ═══

| Vendor | Reason | Eligible $ | Next action |
|--------|--------|------------|-------------|
| Visual Comfort | Deadline >30 days | $7,100 | Re-run skill in 5 days |
| Hinkley | Eligible $ < $500 | $340 | Bundle into next quarter |

═══ BLOCK 3: PER-VENDOR DRAFTS ═══

(One block per vendor in the draft list — the email-drafter output verbatim)

--- Draft 1: Kichler ---
Subject: Q1 2026 Co-Op Claim — Accent Lighting (Account #...)
To: coop@kichler.com
Body:
[email-drafter output]

Attachments needed:
- Co-op claim form (Kichler standard)
- Q1 ad placement screenshots (Wichita Eagle 2026-02-14, 2026-03-21)
- Invoices INV-7841, INV-7902, INV-8013
- Proof-of-publication letter

Send-or-hold: HOLD-FOR-REVIEW (all co-op claims require Michael review per send-or-hold-rules.md)
Reasoning: [email-drafter reasoning block]

--- Draft 2: Hubbardton Forge ---
[...]

═══ BLOCK 4: REMEDIATION ═══

- Schema additions still pending: [list, or "none — all 3 columns present"]
- Vendors missing co-op config (in vendors table but no vendor_overrides row): [count + names]
- Stale coop_tracker rows (status='open' with deadline < today): [count + IDs]
- Partial-pass failures (vendors where email-drafter delegation failed): [list + reason] — re-run this skill or invoke email-drafter directly per vendor
```

**Partial output (Pass-2 hardening):** if Step 5 fails for a subset of vendors, the four-block structure still ships — failed vendors appear in BLOCK 3 as `[draft pending — email-drafter failed: <reason>]` with the CONTEXT block visible, and BLOCK 4 lists them in the remediation row above. Never collapse to a single error; partial portfolio visibility beats silent abort.

---

## AccentOS context

- **Stack:** Supabase (`hsyjcrrazrzqngwkqsqa`), Anthropic API (`ANTHROPIC_API_KEY`) via email-drafter delegation
- **Project:** Accent Lighting · `store-cwqiwcjxes`
- **Paths:** `/home/user/accent-os/` (Codespace: `/workspaces/accent-os/`)
- **Primary tables:** `vendors`, `vendor_overrides`, `coop_tracker`, `purchase_orders`, `invoices`
- **Companion skills:**
  - `email-drafter` — composes the actual email body (delegated, never bypassed)
  - `action-queue` — receives every draft in `PROPOSED` state for Michael's approval
  - `vendor-cascade` — explains vendor priority feed (informational, not blocking)
  - `vendor-risk-register` — pre-check for at-risk vendors before submitting claim
  - `daily-brief-composer` — surfaces approaching deadlines on the morning brief
  - `supabase-sql-magic` — executes the schema probe + spend queries
- **MASTER reference:** §14 (Long-Term Vision) · §6 (Database Schema, `coop_tracker`) · §5 Track 2.3 (Rebate & Co-Op Fund Tracker)

---

## Anti-patterns

- **Never** send the claim email. This skill drafts; `email-drafter` composes; `action-queue` holds for approval; only Michael's explicit approval triggers send. Three-stage gate, no shortcuts.
- **Never** skip `vendor-risk-register`. A claim submitted to a vendor in active dispute can torpedo a settlement — the risk pre-check is mandatory.
- **Never** invent a deadline. Deadlines come from `coop_tracker.deadline` (per-claim) or are derived from `vendor_overrides.coop_deadline_pattern` via the documented grammar parser. If neither exists for a vendor, that vendor is excluded from the draft list and surfaced on the watch list with reason `no deadline source`.
- **Never** modify `vendor_overrides` schema directly. Schema additions live in `references/proposed-schema.md` for Michael to apply via `supabase-sql-magic`. This skill is read-only against schema.
- **Never** bypass the idempotency_key. Re-running the skill twice in one day must not duplicate queue rows.
- **Never** drop a vendor below the threshold without surfacing it on the watch list. Money-left-on-the-table is the failure mode this skill exists to prevent — silence on a near-threshold vendor is a bug.
- **Never** fall back to prose-only output. The four-block structure (Draft list / Watch list / Per-vendor drafts / Remediation) is the contract.
- **Never** auto-approve a draft. Even when the deadline is < 3 days, Michael's explicit approval is required — `action-queue` is the gate, not the bypass.
- **Never** abort the portfolio scan because one vendor's draft fails. Emit the successes, list the failures in BLOCK 4 with CONTEXT preserved. Half a portfolio is recoverable; a silent abort isn't.
- **Never** drop a $0-spend vendor from output silently. Surface on watch list with reason `no spend in window` so Michael knows the rule exists but didn't fire.
