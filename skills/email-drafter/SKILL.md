---
name: email-drafter
description: >
  Generate paste-ready outreach, follow-up, co-op-claim, quote-revival, and
  vendor-correspondence emails for AccentOS / Accent Lighting from Supabase
  context (customers, vendors, pipeline_deals, quotes, coop_tracker). Use
  this skill when Michael says: "draft an email", "draft outreach to",
  "follow up with", "revive that quote", "claim co-op from", "email vendor
  about", "write a follow-up", "email scaffold for", or any phrasing that
  asks for an email Michael can paste into Gmail. Pulls context via
  supabase-sql-magic against hsyjcrrazrzqngwkqsqa, calibrates voice from
  vibe-speak/profiles/michael.md, and emits via Anthropic API
  (ANTHROPIC_API_KEY) when the harness invokes it. Do not use this skill
  for SMS/text drafts, internal Slack messages, or marketing-blast Klaviyo
  flows. Always produces a paste-ready Markdown block (subject + to + body
  + send-or-hold recommendation + reasoning) — never sends, never queues
  to a mail provider, never invents customer/vendor facts not present in
  Supabase.
---

# email-drafter

**Purpose:** Convert an AccentOS context handle (customer_id / vendor_id / deal_id / quote_id) plus an email *type* into a paste-ready draft that sounds like Michael, not a generic salesperson — the L4 "Draft actions" rung of the Capability Ladder, scoped to email only.

Closes: Capability Ladder L4 (Draft actions) · MASTER §14 quote-revival narrative · V01 outreach component · V06 co-op auto-claim drafter.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "draft an email to [customer/vendor]"
- "draft outreach to [name]"
- "follow up with [customer]"
- "revive that quote" / "wake up quote Q-2026-####"
- "claim co-op from [vendor]"
- "email [vendor] about the [issue]"
- "write a follow-up for [deal]"
- "email scaffold for [context]"

Do **not** trigger for: SMS / text drafts, internal Slack messages, Klaviyo broadcasts (those are marketing flows, not 1:1), or generic "write a blog post about X" prose. Route those elsewhere.

If the request is genuinely ambiguous between two email types, pick the highest-signal type from the [type catalog](references/email-types.md) and state the choice in the output's reasoning block.

---

## Step 0 — Preflight (parallel reads)

Run in parallel:

1. Read `references/email-types.md` — the 5-type catalog (outreach, follow-up, co-op-claim, quote-revival, vendor-correspondence) with per-type subject patterns + body shape.
2. Read `references/voice-calibration.md` — extracted voice rules from `skills/vibe-speak/profiles/michael.md` (lowercase, no apostrophe correction, comma-splice tolerance, hard-keep vocab).
3. Read `references/supabase-context-map.md` — which tables to pull per type, which columns matter.
4. Verify environment: `ANTHROPIC_API_KEY` is set (skill emits draft via Anthropic API at runtime, not fallback prose).
5. Confirm the context handle in Michael's prompt resolves to exactly one row. Handles accepted: `customer_id`, `vendor_id`, `deal_id` (→ `pipeline_deals`), `quote_id` (→ `quotes`), or human-readable lookup ("Bob from XYZ Lighting" → resolve via `customers.name ILIKE`).

If `ANTHROPIC_API_KEY` is missing, return:

> warning: email-drafter requires ANTHROPIC_API_KEY. Set it in env, then retry. Skill activates automatically once key is present.

If the handle resolves to 0 or >1 rows, return the candidate list and stop. Do not draft against ambiguous context.

---

## Step 1 — Classify the email type

Map Michael's phrasing to one of five types using the trigger heuristics in `references/email-types.md`:

| Type | Trigger phrasing | Primary table | Output tone |
|------|-----------------|---------------|-------------|
| outreach | "draft outreach", "intro email", "reach out to" | `customers` | warm, low-pressure, opens loop |
| follow-up | "follow up", "check in on", "circle back" | `pipeline_deals` | continuation; references prior thread |
| co-op-claim | "claim co-op", "MDF claim", "rebate claim" | `coop_tracker` + `vendors` | factual, deadline-driven, attaches proof |
| quote-revival | "revive quote", "wake up Q-####", "quote went cold" | `quotes` + `quote_lines` | low-pressure, surfaces price/availability change as the hook |
| vendor-correspondence | "email vendor about", "ask vendor for" | `vendors` | direct, names the ask, attaches PO/invoice when relevant |

If Michael's phrasing maps to >1 type, pick the one whose table the handle naturally points to (e.g. `quote_id` → quote-revival).

Output a one-line classification: `TYPE: [name] | HANDLE: [id] | RATIONALE: [why this type]`.

---

## Step 2 — Pull Supabase context

Hand the classification to `supabase-sql-magic` (companion skill). Build the context query per `references/supabase-context-map.md`:

- **outreach**: `customers` row + last 3 `customer_interactions` + segment + outstanding quotes.
- **follow-up**: `pipeline_deals` row + last 3 stage transitions from `deals_stage_history` + customer name + linked quote.
- **co-op-claim**: `coop_tracker` row + `vendors` row + `vendor_overrides.notes` + claim deadline + supporting invoice ids from `invoices`.
- **quote-revival**: `quotes` row + `quote_lines` (top 5 by value) + customer + days-since-last-contact + flag if any line has a price/stock change.
- **vendor-correspondence**: `vendors` row + `rep_groups` row + recent `purchase_orders` + recent `coop_tracker` activity.

Compose a context block:

```
CONTEXT — [type]
- entity: [customer/vendor/deal/quote name + id]
- last touch: [date + channel + summary]
- relevant facts:
  - [fact 1 from supabase, no LLM-generated facts]
  - [fact 2]
  - [fact 3]
- thread state: [cold | warm | active | stalled]
```

If a relevant fact is missing from Supabase (e.g. quote has no `last_contacted_at`), say "unknown" — do not invent.

---

## Step 3 — Apply voice calibration

Pull from `references/voice-calibration.md`:

- Sentence-initial caps only on hard-keep proper nouns; otherwise lowercase if Michael's prompt was lowercase (register mirror).
- Strip filler kill list: "Now I'll...", "Just to be clear...", "As a reminder...", "If I understand correctly...", "Quick note:" (when ornamental), "Heads up:" (when ornamental).
- Hard-keep vocab — never translate: build, ship, wire up, hook up, BUILD_PLAN, vibe-speak, RLS, upsert, GMC, etc. (full list in voice-calibration.md).
- Sentence rhythm: short. fragments ok. no corporate adverbs ("furthermore", "additionally", "moreover").
- Banned phrases (sales-y boilerplate): "I hope this email finds you well", "I wanted to reach out", "circling back", "touching base", "per my last email", "as previously mentioned", "looking forward to hearing from you" (use a concrete close instead).
- Banned em-dashes only when imitating a specific Michael draft Michael uploaded; default em-dash use is allowed (matches his style).

---

## Step 4 — Draft via Anthropic API

Construct the prompt with prompt caching: cache the system prompt (voice rules + type-specific tone guide from `references/email-types.md`), pass per-call only the context block from Step 2 + the type classification.

System prompt outline:
- Role: ghostwriter for Michael Graf at Accent Lighting (residential lighting retailer)
- Tone: per `references/voice-calibration.md` (vibe register, no salesperson voice)
- Constraints: no fact invention, no fabricated price/availability, no fabricated promises
- Output shape: subject line + body, no signature block (Michael appends his own), no "[Your Name]" placeholder

Per-call user message:
- TYPE classification line
- CONTEXT block from Step 2
- Specific ask (e.g. "this is a 3-month-stale quote — surface the BACL line that just dropped 8% as the hook")

Model: claude-opus-4-7 or claude-sonnet-4-7 (default sonnet for cost; bump to opus if Michael flags the email as high-stakes — co-op claim with deadline ≤7d, deal ≥$10k, or vendor escalation).

If the API call fails: return the context block + a stub "[draft would go here — Anthropic API call failed: [error]]". Do not fabricate the draft locally.

---

## Step 5 — Send-or-hold recommendation

After the draft is generated, classify it as **SEND**, **HOLD-FOR-REVIEW**, or **DO-NOT-SEND** using the rules in `references/send-or-hold-rules.md`:

- **SEND** if: routine follow-up, confidence in all facts ≥0.9, no irreversible commitments, under $5k deal value.
- **HOLD-FOR-REVIEW** if: deal value ≥$5k, mentions price quote, mentions discount, references a stage change, or a co-op claim with $ amount.
- **DO-NOT-SEND** if: Michael's prompt indicated cold outreach to a customer flagged as `do_not_contact` in `customers`, or vendor flagged in `vendor_overrides.notes` as "no email", or fact-confidence <0.7.

Output the recommendation with one-line reasoning. The recommendation is advisory — Michael decides.

---

## Step 6 — Output format (paste-ready block)

Single message containing:

```
═══ EMAIL DRAFT ═══

TYPE:        [type from Step 1]
HANDLE:      [id resolved in Step 0]
ENTITY:      [customer/vendor/deal/quote display name]
SEND-OR-HOLD: [SEND | HOLD-FOR-REVIEW | DO-NOT-SEND]

To:       [resolved email address from Supabase]
Subject:  [generated subject line]

[email body — paste-ready, no signature block]

═══ REASONING ═══
- type rationale: [why this type — one line]
- voice match: [calibrated against michael.md profile]
- facts cited: [bulleted list of facts pulled from Supabase, each with source column]
- send-or-hold: [why this recommendation]
- model used: [sonnet | opus]
- next-step (if HOLD): [what Michael should verify before sending]

═══ FOLLOW-UP HOOK ═══
If sent, queue a follow-up via action-queue in [N] days based on type defaults:
  outreach: 5d  |  follow-up: 7d  |  co-op-claim: 3d before deadline  |
  quote-revival: 14d  |  vendor-correspondence: 5d
```

The block is the entire output. No preamble. No "here's the draft:" framing.

---

## AccentOS context

- **Stack:** Supabase `hsyjcrrazrzqngwkqsqa` for context; Anthropic API via `ANTHROPIC_API_KEY` for draft generation; no email-send integration (paste-ready output only).
- **Project:** AccentOS for Accent Lighting (residential lighting retailer, BC store `store-cwqiwcjxes`).
- **Paths:** `/home/user/accent-os/skills/email-drafter/` (Codespace alt: `/workspaces/accent-os/...`).
- **Schema sources:** `/home/user/accent-os/sql/M02_core_schema.sql` (customers, quotes, coop_tracker), `M30_customers_segment.sql`, `M32_deals_stage_history.sql`, `M34_invoices_payments.sql`.
- **Companion skills:**
  - `supabase-sql-magic` — context fetch (Step 2)
  - `coop-claim-drafter` — specialization for the co-op-claim type (delegates to this skill with a richer template; future skill)
  - `action-queue` — post-draft handoff for approval-then-send (future skill — Step 6 surfaces the hook)
  - `vendor-cascade` — surfaces vendor priority for outreach prioritization (used when batching outreach to multiple vendors)
  - `vibe-speak` — supplies voice profile (`profiles/michael.md`)

---

## Anti-patterns

- **Never** send. This skill outputs paste-ready text only. No SMTP, no Gmail API, no Klaviyo, no webhook fire.
- **Never** invent a fact about a customer, vendor, deal, or quote. Every fact in the body must trace to a Supabase column. If a fact is uncertain, mark it `[verify: ...]` in the body.
- **Never** use the salesperson boilerplate banned in `references/voice-calibration.md` ("I hope this email finds you well", "circling back", "touching base", "per my last email").
- **Never** include a signature block, "[Your Name]" placeholder, or sign-off Michael wouldn't write. He appends his own.
- **Never** route around `supabase-sql-magic` — context comes from there, not from re-implemented inline queries.
- **Never** classify a HOLD-FOR-REVIEW draft as SEND because the model "feels confident". The rules in `references/send-or-hold-rules.md` are the gate.
- **Never** ask Michael which type he wants — pick the highest-signal type per Step 1 and state it.
- **Never** correct Michael's typos / lowercase / comma splices in the email body. Match his register per `voice-calibration.md`.
