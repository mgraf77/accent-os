# KNOWN ISSUES — 2026-05-08

---

## ISSUE 1 — Worker Proxy 400 Error (ACTIVE, BLOCKING)

**Severity:** Medium — affects Quote Generator AI features only. Core app functions normally.

**Symptom:** `POST https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages` returns 400 Bad Request. Console shows `[aiParseNotes] JSON parse error`.

**Root cause:** The fix (commit `2dca2a6`) updated `worker/anthropic-proxy.js` to use `arrayBuffer` body passthrough and return a proper `{"error":"Missing x-api-key header"}` 400 when the API key header is absent. This code was committed but NOT redeployed to Cloudflare Workers. The live worker is still running the old code.

**Fix:** `wrangler deploy` from Michael's local machine (cannot run from Codespace — no wrangler auth).

**Affected features:** Quote Generator → "Parse Notes" AI button. All other AI features in Quote Generator use the same proxy and are similarly blocked.

**Not affected:** All non-AI features of the app. All other modules. Auth, Supabase, all data operations.

**Tracking:** `WORK_IN_PROGRESS.md` has the exact verification steps.

---

## ISSUE 2 — DDV Effort Weights Unvalidated (KNOWN, NON-BLOCKING)

**Severity:** Low — framework works, but calibration accuracy is limited.

**Symptom:** DDV evaluation confidence is capped at ~65% for first evaluations because effort weights (time, tokens, tool calls, etc.) are intuition-calibrated, not data-validated.

**Root cause:** No real evaluation data exists yet to derive weights from.

**Fix:** Run 10+ real evaluations on AccentOS skills. Compare predicted vs actual outcomes. Recalibrate weights. Documented in `skills/meta/ddv-evaluator/future-improvements.md` item 1.

**Not affected:** Recommendation logic, risk detection, dimension scoring — all deterministic regardless of weight calibration.

---

## ISSUE 3 — DDV Recommendation Gap at Velocity 4–5 (KNOWN, NON-BLOCKING)

**Severity:** Low — edge case only.

**Symptom:** When velocity falls in the 4–5 range on a first evaluation, no recommendation rule triggers cleanly. The tie-breaker rule added in scoring-logic.md handles this but is a workaround, not a principled rule.

**Fix:** After 10+ real evaluations, determine the empirically correct threshold. The tie-breaker is temporary scaffolding.

---

## ISSUE 4 — Build Plan Items 6.x Blocked on Credentials (KNOWN, NON-BLOCKING)

**Severity:** Low — no in-progress code is broken.

**Symptom:** Items 6.1 (GA4), 6.2 (Search Console), 6.3 (BigCommerce REST), 6.4 (Klaviyo) are unchecked in BUILD_PLAN_CLAUDE.md.

**Root cause:** All require API credentials or OAuth setup from Michael.

**Fix:** Michael provides credentials → Claude builds integrations in one autonomous session.

---

## Closed issues (resolved in recent sessions)

- ~~CORS blocking api.anthropic.com from browser~~ → Resolved via Worker proxy (commit `87f20a2`)
- ~~Quote Generator had no AI parse capability~~ → Resolved in v2 (commit `940e7f8`)
