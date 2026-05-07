## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-07 — session paused (Michael switching from Codespace → Claude iOS app)
**Resume trigger:** "continue last session"

---

## CONTEXT
- Built Quote Generator v2 (AI parse, track calc, per-row approval, CSV export) — shipped, commit `940e7f8`
- Hit CORS blocking api.anthropic.com from browser
- Created Cloudflare Worker proxy at `worker/anthropic-proxy.js` (deployed to https://accentos-anthropic-proxy.mgraf77.workers.dev)
- All 4 fetch calls in `index.html` now point at the worker
- Patched the worker to use `arrayBuffer` body passthrough + CORS `*` + explicit "Missing x-api-key" 400 — pushed as commit **`2dca2a6`, NOT YET REDEPLOYED**

## CURRENT BUG
"⚡ Parse Notes" in Quote Generator returns 400 from the worker. Console shows:
```
POST https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages 400 (Bad Request)
[aiParseNotes] JSON parse error
```
`sessionStorage['aos-api']` key IS set.

## NEXT STEPS PENDING

**1. Confirm worker was redeployed with commit `2dca2a6` code.** Test by running this in the browser console on accent-os.pages.dev:
```js
fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'}).then(r=>r.text()).then(console.log)
```
- Old code → returns Anthropic auth error
- New code → returns `{"error":"Missing x-api-key header"}`

If old code is still live, redeploy needed in local terminal (NOT codespace):
```
cd C:\Users\Michael\Desktop\accent-os
git pull origin main
wrangler deploy
```

**2. If new code is live but Parse still fails:** get the actual upstream response — DevTools → Network → click failed `messages` row → **Response** tab → paste the body. That tells us if it's a model-ID issue, malformed request, or something else.

**3. Model verification:** `aiParseNotes` uses `'claude-sonnet-4-20250514'` — may need to verify this is still a valid model ID.

Pick up from step 1.
