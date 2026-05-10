## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-10 — overnight session complete (6.5 + 6.6 shipped, model ID fixed, field name bugs fixed)
**Resume trigger:** "continue" or "morning standup"

---

## COMPLETED THIS SESSION (2026-05-10 overnight)
- **Codex CLI installed:** `@openai/codex` v0.130.0 globally. Auth deferred — Codex pilot tomorrow.
- **6.5 Trade & Designer Portal** shipped — `js/trade_designer_portal.js`, sidebar CORE entry (Owner/Admin/Manager/Sales). Relationship dashboard per trade partner: stats, expandable linked quotes/deals/jobs, inline actions.
- **6.6 Vendor Rep Portal** shipped — `js/vendor_rep_portal.js`, sidebar ADMIN entry (Owner/Admin). Rep group dashboard: stats, expandable brand scores, co-op status, 30d deadline warnings, outreach shortcuts.
- **Model ID fixed:** `claude-sonnet-4-20250514` → `claude-sonnet-4-6` in all 4 AI call sites in index.html.
- **Field name bugs fixed (3 files):** `portal_preview.js`, `global_search.js`, `reports.js` used stale `partner_type` / `linked_customer_id` — corrected to `type` / `related_customer_id`.

---

## CURRENT BUG (still open — needs Michael's Windows terminal)
"⚡ Parse Notes" in Quote Generator returns 400 from the worker.

**Root cause:** Worker code IS correct (commit `2dca2a6`). Model ID IS now fixed (`claude-sonnet-4-6`). **Worker has NOT been redeployed.** Wrangler not authenticated in this cloud environment.

**Michael's action — run in Windows terminal:**
```
cd C:\Users\Michael\Desktop\accent-os
git pull origin main
wrangler deploy
```

**Verify** (browser console on accent-os.pages.dev):
```js
fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages',{method:'POST'}).then(r=>r.text()).then(console.log)
```
Expected after redeploy: `{"error":"Missing x-api-key header"}`

---

## TOMORROW MORNING — HIGHEST LEVERAGE ACTIONS

1. **Deploy worker** (above — Michael's Windows terminal, 2 commands)
2. **Codex auth** — create IP-unrestricted OpenAI key, set in `.claude/settings.local.json`, verify with test prompt
3. **Codex pilot V1** — once auth verified, dispatch console.log audit task per `docs/codex/CODEX_PILOT_PLAN_V1.md`

**All other open items blocked** on external credentials (M04 BigCommerce, M05 GMC, M06 GA4, M09 Klaviyo, M18 site approval, M03/M10 Windward).
