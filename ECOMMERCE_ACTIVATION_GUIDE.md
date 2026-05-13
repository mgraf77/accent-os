# ECOMMERCE_ACTIVATION_GUIDE.md
> Phase 5 — BigCommerce Integration Activation
> For: Michael (M04)
> After: RC-1 deployed and smoke tests T01–T15 pass

---

## OVERVIEW

The Ecommerce Intelligence module is already deployed and running in degraded state. It renders a 6-tab dashboard that shows "⚙ Connect BC" until Worker secrets are set. No token is stored in the browser — credentials live entirely in Cloudflare's secret store.

**Time to activate after creds are in hand: ~5 minutes.**

---

## STEP 1 — GET YOUR BIGCOMMERCE API TOKEN

1. Log in to BigCommerce Admin: `https://store-cwqiwcjxes.mybigcommerce.com/admin`
2. Go to **Settings → API Accounts**
3. Click **Create API Account → Create V2/V3 API Token**
4. Name it: `AccentOS Integration`
5. Set scopes:
   - Products: **Read-only**
   - Categories: **Read-only**
   - Orders: **Read-only** (for future revenue correlation)
   - Information & settings: **Read-only**
6. Click **Save** → copy the **Access Token** (shown only once)

---

## STEP 2 — INSTALL WRANGLER (if not already)

```bash
npm install -g wrangler
wrangler login  # opens browser for Cloudflare OAuth
```

---

## STEP 3 — SET WORKER SECRETS

```bash
# From the accent-os repo root:
wrangler secret put BC_STORE_HASH
# Prompt: enter  store-cwqiwcjxes

wrangler secret put BC_ACCESS_TOKEN
# Prompt: paste the token from Step 1
```

Secrets are encrypted at rest in Cloudflare. They survive Worker redeployments. Never appear in logs or wrangler output.

---

## STEP 4 — VERIFY WORKER KNOWS BC IS CONFIGURED

```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
```

Expected response:
```json
{
  "version": "v4-bc-proxy",
  "env_key_set": true,
  "bc_configured": true,
  "build": "2026-05-13"
}
```

If `bc_configured` is `false`: wait 30 seconds and retry (secret propagation).

---

## STEP 5 — VERIFY IN ACCENTS UI

1. Open AccentOS and navigate to **Ecommerce Intel**
2. The header should now show "**↓ Sync**" button instead of "⚙ Connect BC"
3. Click **↓ Sync** → the module will fetch from BigCommerce via the Worker proxy

**Expected on first sync:**
- "Syncing catalog from BigCommerce…" toast
- ~30-60 seconds depending on catalog size
- Products, categories, brands cached to Supabase (M47/M48 tables)
- Exec Dashboard tab populates with catalog health metrics

---

## STEP 6 — CONFIRM INTEGRATION STATUS

In Ecommerce Intel → **Integrations** tab:
- BigCommerce row should show: ● green · "Connected · NNNms"
- GA4, GSC, Klaviyo, GMC rows show "Pending" (not yet configured)

---

## HOW THE PROXY WORKS (for your reference)

```
AccentOS SPA
  → GET /bc/v3/catalog/products
  → Cloudflare Worker
      adds: X-Auth-Token: {BC_ACCESS_TOKEN}  ← you never see this in browser
  → api.bigcommerce.com
  ← products JSON
  ← Cloudflare Worker (adds CORS headers)
  ← AccentOS SPA
```

Your BC token is **never** in:
- Browser localStorage
- Browser DevTools Network tab headers
- AccentOS source code
- Supabase database

---

## TOKEN ROTATION

If you ever need to rotate the BC token:
```bash
wrangler secret put BC_ACCESS_TOKEN
# Paste new token at prompt
```

Takes effect immediately — no code deploy needed.

---

## TROUBLESHOOTING

| Symptom | Cause | Fix |
|---------|-------|-----|
| "⚙ Connect BC" button still shows after setting secrets | Secret propagation delay | Wait 60s, refresh page |
| `bc_configured: false` in Worker probe | Secret not set correctly | Re-run `wrangler secret put BC_ACCESS_TOKEN` |
| "Sync" button works but shows 0 products | BC store empty or wrong store hash | Verify `BC_STORE_HASH` = your actual store hash |
| `BC API 401` error in console | Token expired or wrong scopes | Generate new token with correct scopes |
| Products sync but Supabase insert fails | M47 schema not applied | Run `sql/M47_bigcommerce_schema.sql` in Supabase |

---

## GA4 / GSC / KLAVIYO / GMC (Future Integrations)

These adapters are deployed as stubs. They show "Pending" in the Integrations tab. No credentials required yet. When ready:

| Platform | Activation path |
|---------|----------------|
| GA4 | Measurement ID is public — can go in Settings UI |
| Google Search Console | Service account JSON → Worker secret |
| Klaviyo | Private API key → Worker secret (`wrangler secret put KLAVIYO_API_KEY`) |
| Google Merchant Center | Service account JSON → Worker secret |
