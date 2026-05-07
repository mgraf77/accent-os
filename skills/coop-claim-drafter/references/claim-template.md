# Co-op claim — canonical template + CONTEXT block

> The shape `coop-claim-drafter` hands to `email-drafter` for voice-pass composition. Mirror of `email-drafter/references/email-types.md` co-op-claim section, scoped tighter for the auto-drafter's batch flow.

## Subject pattern

```
{period_label} Co-Op Claim — Accent Lighting (Account #{account_number_if_known})
```

Examples:
- `Q1 2026 Co-Op Claim — Accent Lighting (Account #AL-7821)`
- `FY2025 Co-Op Claim — Accent Lighting`

`period_label` is derived from `coop_deadline_pattern`:
- `quarterly:*` → `Q[1-4] {YYYY}`
- `annual:*` → `FY{YYYY}`
- `semiannual:*` → `H1 {YYYY}` or `H2 {YYYY}`

## Body sections (in order)

1. **Greeting** — addressed to `vendors.claim_email` contact (use `claim_contact_name` if present in `vendor_overrides.notes`, else `Co-Op Team`)
2. **Claim summary** — period, gross spend, eligible amount, deadline
3. **Documentation enclosed** — bulleted list from `vendor_overrides.coop_documentation_required` with checkbox markers
4. **Reference to portal/email-only quirk** — pulled from `vendor_overrides.notes` (e.g., "Per your portal-only requirement, I have also uploaded the package at [URL].")
5. **Sign-off** — Michael's standard close (calibrated by email-drafter from `vibe-speak/profiles/michael.md`)

## CONTEXT block schema (handoff to email-drafter)

```
CONTEXT — co-op-claim
- vendor: {vendor_name} (vendor_id={vendor_id})
- to: {claim_email}
- portal: {claim_portal_url or "n/a"}
- program: {program_name from coop_deadline_pattern}
- period: {period_start} → {period_end}
- deadline: {deadline} ({days_until_deadline} days from today)
- gross spend: ${gross_spend}
- eligible amount: ${eligible_amount}  ({coop_eligibility_pct}% of gross)
- documentation required:
  - [ ] {doc_1}
  - [ ] {doc_2}
  - [ ] {doc_3}
- vendor notes: "{vendor_overrides.notes}"
- risk flag: {risk_flag from vendor-risk-register, or "clear"}
- account number: {if known from vendors.notes or null}
```

## Attachments-needed list (separate from body, surfaced in queue payload)

This list is **not embedded in the email body** — it goes in the `action-queue.payload.attachments_needed` array so Michael can gather files at approval time without re-reading the email. The email body references the attachments by name; the queue UI prompts Michael to attach them before send.

Format:

```json
[
  {"name": "Q1 2026 Kichler claim form", "source": "kichler portal download", "status": "pending"},
  {"name": "Wichita Eagle 2026-02-14 ad", "source": "google drive AdPlacements/2026/Q1", "status": "pending"},
  {"name": "Invoice INV-7841", "source": "supabase invoices.pdf_url", "status": "auto-resolvable"},
  {"name": "Invoice INV-7902", "source": "supabase invoices.pdf_url", "status": "auto-resolvable"},
  {"name": "Proof-of-publication letter", "source": "request from Wichita Eagle", "status": "pending"}
]
```

`auto-resolvable` items can be fetched at queue-execution time via `bc-rest-bridge` or direct Supabase pull. `pending` items require Michael's manual gathering — the queue UI flags these.

## Send-or-hold behavior

**All co-op claims default to HOLD-FOR-REVIEW.** This is non-negotiable per `email-drafter/references/send-or-hold-rules.md` — claim amounts are real money and require human review. The skill outputs the draft; Michael approves; only then does `action-queue` execute via `email-drafter`.

If the deadline is < 3 days away, the send-or-hold reasoning notes the urgency but does not auto-promote — surface it visually (Block 1's "Days left" column will sort it to the top).
