# Executor skills — registry-validator scope
> Canonical list of executor skill directories validated by registry-validator. Regenerated each run from `skills/action-queue/references/executor-registry.md` — never hardcoded. This file is a snapshot of the most recent regeneration for reference / debugging.

## How this list is built

1. Step 0 of registry-validator reads `executor-registry.md`.
2. Step 1 parses every row of the `## Registry — current bindings` table, extracting the `executor skill` column.
3. The unique set of executor names becomes the validation scope for Step 2.
4. This file is rewritten with the result so debug runs can see what scope was used.

If the registry adds a new row binding to a skill not on this list, the next run will pick it up automatically — no edit to this file required.

---

## Snapshot — executor skills currently bound in the registry

(Populated on the first registry-validator run. Until then, the initial set per gap-run-002 is documented below for stub-mode operation.)

| # | executor skill | directory | bound action_types | notes |
|---|----------------|-----------|---------------------|-------|
| 1 | email-drafter | `/home/user/accent-os/skills/email-drafter/` | `send_email`, `vendor_outreach` | one skill bound to two action_types — payload `template` field disambiguates per registry's anti-pattern note |
| 2 | coop-claim-drafter | `/home/user/accent-os/skills/coop-claim-drafter/` | `claim_coop` | partial-blocked on vendor_overrides schema additions |
| 3 | bc-rest-bridge | `/home/user/accent-os/skills/bc-rest-bridge/` | `update_bc_product`, `price_change_push` | M04-blocked stub mode |
| 4 | klaviyo-flows | `/home/user/accent-os/skills/klaviyo-flows/` | `propose_klaviyo_edit` | M09-blocked; explicitly refuses `send_klaviyo_flow` (gap-run-002 finding) |
| 5 | alert-router | `/home/user/accent-os/skills/alert-router/` | `route_alert` | M02-gated on alerts/action_queue tables |
| 6 | churn-predictor | `/home/user/accent-os/skills/churn-predictor/` | `churn_nudge` | producer + executor — producer-side path is more common |

## Producer-side reference (NOT in validator scope)

These skills appear in `executor-registry.md`'s "Producer-side reference" section. Registry-validator does not validate them as executors — they only call `action-queue.propose`, never receive Step 5 routing.

- `next-action-recommender`
- `vendor-cascade`
- `daily-brief-composer`

(The same skill can appear on both lists — e.g. `email-drafter` is producer for `send_email` proposals and executor when its own `send_email` row gets approved.)

---

## How to add a new executor

1. Forge the new executor skill via `skill-forge`.
2. Edit `executor-registry.md` to add a row binding the new `action_type` to the new executor.
3. Run `registry-validator` — it should report the new binding as a green row in BLOCK 2.
4. If registry-validator surfaces a BLOCKING finding for the new binding, fix the executor's SKILL.md to declare the action_type properly. Do NOT silence the validator.

This file regenerates on next run — no manual edit needed.
