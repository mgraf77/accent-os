---
name: email-drafter
description: >
  Generate paste-ready outreach, follow-up, co-op-claim, quote-revival, and
  vendor-correspondence emails for AccentOS / Accent Lighting from Supabase
  context (customers, vendors, pipeline_deals, quotes, coop_tracker). Use
  this skill when Michael says: "draft an email to [name]", "email
  [name]", "follow up with [name]", "ping [name]", "wake up that quote",
  "knock out an email to [name]", "claim co-op from [vendor]" (single
  named vendor), "reach out to [name]", "draft me something for [name]",
  or any phrasing that asks for one email Michael can paste into Gmail
  for a single named entity. Pulls context via supabase-sql-magic against
  Supabase hsyjcrrazrzqngwkqsqa, calibrates voice from
  vibe-speak/profiles/michael.md, and emits via Anthropic API
  (ANTHROPIC_API_KEY) when the harness invokes it. Do not use this skill
  for SMS/text drafts, internal Slack messages, marketing-blast Klaviyo
  flows, or for portfolio-wide co-op deadline scans like "draft co-op
  claims" or "what co-op is about to expire" (those route to
  coop-claim-drafter). Always produces a paste-ready Markdown block
  (subject + to + body + send-or-hold recommendation + reasoning) — never
  sends, never queues to a mail provider, never invents customer/vendor
  facts not present in Supabase.
---

# email-drafter

**Purpose:** Convert an AccentOS context handle (customer_id / vendor_id / deal_id / quote_id) plus an email *type* into a paste-ready draft that sounds like Michael, not a generic salesperson — the L4 "Draft actions" rung of the Capability Ladder, scoped to email only.

Closes: Capability Ladder L4 (Draft actions) · MASTER §14 quote-revival narrative · V01 outreach component · V06 co-op auto-claim drafter.

---

## Trigger Recognition

Run this skill when Michael says anything like (terse / lowercase / typo variants all count — match his register per `vibe-speak/profiles/michael.md`; he writes "remue building" / "knock out" / lowercase fragments / no apostrophes):
- "draft an email to [name]" / "email [name]" / "draft email to [name]"
- "draft outreach to [name]" / "reach out to [name]" / "intro email to [name]"
- "follow up with [name]" / "follow up on [deal]" / "check in on [name]"
- "wake up quote Q-####" / "revive that quote" / "ping [name] on that quote" / "that quote went cold"
- "claim co-op from [vendor]" (single named vendor — if no vendor named or it's a portfolio scan, route to `coop-claim-drafter` instead)
- "email [vendor] about [issue]" / "ping [vendor] about [issue]" / "ping [name]"
- "knock out an email to [name]" / "knock out a quick email" / "write a quick email to [name]"
- "draft me something for [name]" / "email scaffold for [context]"

Do **not** trigger for: SMS / text drafts, internal Slack messages, Klaviyo broadcasts (those are marketing flows, not 1:1), generic "write a blog post about X" prose, or **portfolio-level co-op scans** like "draft co-op claims" / "what co-op is about to expire" / "co-op deadline scan" — those route to `coop-claim-drafter`, which then delegates back here per-vendor.

**Boundary vs. coop-claim-drafter (crisp rule):** If Michael names exactly one vendor (or one specific co-op claim window), this skill handles it. If the trigger is plural, time-driven, or asks AccentOS to find the claims, `coop-claim-drafter` runs first and calls this skill once per qualifying vendor.

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

If the handle resolves to 0 or >1 rows, return the candidate list (id + display name + last-touch date) and stop. Do not draft against ambiguous context — picking "the highest-value match" silently is the failure mode this gate prevents.

**Failure-path notes (Pass-2 hardening):**

- **Missing referenced table** (e.g. `customer_interactions` or `pipeline_deals` not yet migrated): Step 2 catches the SQL error, downgrades the CONTEXT block to whatever the primary table returned, marks affected facts as `[unknown — table not yet migrated]`, and tags the draft `HOLD-FOR-REVIEW: thin-context`. Never silently drop the field.
- **Supabase rate-limit / network error during context fetch**: Step 2 retries once with 2-second backoff. On second failure, return the partial CONTEXT block plus an explicit `error: supabase fetch failed — [error]` line and stop *before* calling the Anthropic API. Drafting on stale/empty context is a worse failure than no draft.
- **Concurrent run on the same handle**: if the same `(handle, type)` pair was drafted in the last 60 seconds (check via `action-queue` if companion exists, else best-effort), surface a one-line warning and ask Michael to confirm before continuing — duplicate drafts spam the queue.
- **Reference files missing** (e.g. invoked by `coop-claim-drafter` delegation in a fresh checkout where `references/email-types.md`, `references/voice-calibration.md`, `references/supabase-context-map.md`, or `references/send-or-hold-rules.md` haven't been pulled): Step 0 fails fast with `error: email-drafter references/ missing — [list of missing files]; re-pull skill repo` and stops. Never substitute hardcoded fallback rules — voice drift is the failure mode.
- **Ambiguous handle with one high-value match**: never pick the highest-value match silently. Always return the candidate list and let Michael disambiguate. (Same reason vendor-cascade surfaces ties instead of breaking them.)

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

If Michael's phrasing maps to >1 type, pick the one whose table the handle naturally points to (e.g. `quote_id` → quote-revival; `vendor_id` + "co-op" word → co-op-claim). If no handle disambiguates, walk this fixed precedence list and pick the first match: co-op-claim → quote-revival → follow-up → outreach → vendor-correspondence.

Output a one-line classification: `TYPE: [name] | HANDLE: [id] | RATIONALE: [why this type]`. This line is mandatory — never start drafting without it.

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

If the API call fails: return the context block + a stub "[draft would go here — Anthropic API call failed: [error]]". Do not fabricate the draft locally. If the failure is a 429/overloaded, retry once with 5-second backoff before stubbing. If the failure is auth (401/403), surface "ANTHROPIC_API_KEY rejected — verify in env" and stop.

---

## Step 5 — Send-or-hold recommendation

After the draft is generated, classify it as **SEND**, **HOLD-FOR-REVIEW**, or **DO-NOT-SEND** using the rules in `references/send-or-hold-rules.md`:

- **SEND** if: routine follow-up, confidence in all facts ≥0.9, no irreversible commitments, under $5k deal value.
- **HOLD-FOR-REVIEW** if: deal value ≥$5k, mentions price quote, mentions discount, references a stage change, or a co-op claim with $ amount.
- **DO-NOT-SEND** if: Michael's prompt indicated cold outreach to a customer flagged as `do_not_contact` in `customers`, or vendor flagged in `vendor_overrides.notes` as "no email", or fact-confidence <0.7.

Output exactly one of the three labels with one-line reasoning. The label is advisory — Michael decides — but the label itself is contractual: a draft without one of those three labels is malformed.

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

**Partial output (Pass-2 hardening):** If Step 2 returned thin context (rate-limit fallback, missing table) or Step 4 returned an Anthropic stub, still emit the full block — but `SEND-OR-HOLD` becomes `HOLD-FOR-REVIEW` automatically, the body section reads `[stub — partial context, see reasoning]`, and the reasoning block lists every missing field. Never suppress the block; partial visibility beats silent failure.

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
- **Never** silently swallow a Supabase fetch error or schema-missing column — surface it in the reasoning block and degrade to `HOLD-FOR-REVIEW: thin-context`. A "successful" draft built on missing facts is worse than a stub.
- **Never** call the Anthropic API before the CONTEXT block has at least the entity row + one supporting fact. Drafting on a single-row resolve with no relationship data produces a generic email that fails the voice match.
