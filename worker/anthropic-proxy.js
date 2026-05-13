// Cloudflare Worker — Anthropic API proxy + BigCommerce API proxy for AccentOS
//
// ── DEPLOYMENT ─────────────────────────────────────────────────────────────
// Deployed automatically via GitHub Actions (deploy-worker.yml) when this file
// or wrangler.toml changes on main.
//
// Manual deploy:
//   wrangler deploy
//
// Required secrets (set once, survive all redeployments):
//   wrangler secret put ANTHROPIC_API_KEY   ← sk-ant-...
//   wrangler secret put BC_STORE_HASH       ← store-xxxx (your BC store hash)
//   wrangler secret put BC_ACCESS_TOKEN     ← BC API access token (V2/V3)
//
// Verify live state:
//   curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
//   Expected: {"version":"v4-bc-proxy","env_key_set":true,"bc_configured":true,...}
//
// ── ANTHROPIC AUTH FLOW ─────────────────────────────────────────────────────
// POST /v1/messages key resolution priority:
//   1. x-api-key header from client  (user-supplied key from Settings → API Keys)
//   2. env.ANTHROPIC_API_KEY secret  (no client config needed)
//   3. Neither → 503 ai_unconfigured
//
// ── BIGCOMMERCE PROXY ───────────────────────────────────────────────────────
// Browser calls /bc/v2/* or /bc/v3/* — Worker injects X-Auth-Token from secret.
// BC token NEVER reaches the browser. CORS handled here.
//
// Routes:
//   GET  /bc/v2/*  → api.bigcommerce.com/stores/{BC_STORE_HASH}/v2/*
//   GET  /bc/v3/*  → api.bigcommerce.com/stores/{BC_STORE_HASH}/v3/*
//
// ── VERSION HISTORY ─────────────────────────────────────────────────────────
// v3: env fallback for Anthropic key + version probe.
// v4 (this): adds BigCommerce proxy routes. BC token held as Worker secret.
//
const WORKER_VERSION = 'v4-bc-proxy';
const WORKER_BUILD   = '2026-05-13';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
  'Access-Control-Max-Age':       '86400',
};

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...(extra || {}) }
  });
}

// Pass-through BC rate limit headers so the SPA adapter can honour backoff
// without ever needing to know the token.
const BC_RATE_HEADERS = [
  'X-Rate-Limit-Requests-Left',
  'X-Rate-Limit-Time-Reset-Ms',
  'X-Rate-Limit-Requests-Quota',
  'X-Rate-Limit-Time-Window-Ms',
];

export default {
  async fetch(request, env) {
    const method = request.method;
    const url    = new URL(request.url);

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // ── BIGCOMMERCE PROXY ─────────────────────────────────────────────────
    if (url.pathname.startsWith('/bc/')) {
      return handleBCProxy(request, url, env);
    }

    // ── VERSION PROBE ────────────────────────────────────────────────────
    if (method === 'GET' && (url.pathname === '/' || url.pathname === '/version')) {
      return json({
        version:        WORKER_VERSION,
        build:          WORKER_BUILD,
        env_key_set:    Boolean(env && env.ANTHROPIC_API_KEY),
        env_key_length: env && env.ANTHROPIC_API_KEY ? String(env.ANTHROPIC_API_KEY).length : 0,
        bc_configured:  Boolean(env && env.BC_STORE_HASH && env.BC_ACCESS_TOKEN),
      }, 200);
    }

    // ── ANTHROPIC PROXY ───────────────────────────────────────────────────
    if (method !== 'POST') {
      return json({ error: 'method_not_allowed', message: 'Use POST or GET /', version: WORKER_VERSION }, 405);
    }

    const headerKey = request.headers.get('x-api-key');
    const envKey    = (env && env.ANTHROPIC_API_KEY) ? String(env.ANTHROPIC_API_KEY) : '';
    const apiKey    = (headerKey && headerKey.trim()) || envKey || '';

    if (!apiKey) {
      return json({
        error:   'ai_unconfigured',
        message: 'AI service not configured. Set ANTHROPIC_API_KEY as a Workers secret.',
        version: WORKER_VERSION,
      }, 503);
    }

    const body = await request.arrayBuffer();

    let upstream;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      });
    } catch (err) {
      return json({
        error:   'upstream_unreachable',
        message: 'Could not reach Anthropic API: ' + (err && err.message ? err.message : 'unknown'),
        version: WORKER_VERSION,
      }, 502);
    }

    const text = await upstream.text();
    return new Response(text, {
      status:  upstream.status,
      headers: {
        'Content-Type':                  'application/json',
        'x-worker-version':              WORKER_VERSION,
        'Access-Control-Allow-Origin':   '*',
        'Access-Control-Expose-Headers': 'x-worker-version',
      },
    });
  },
};

async function handleBCProxy(request, url, env) {
  const storeHash = env && env.BC_STORE_HASH   ? String(env.BC_STORE_HASH)   : '';
  const token     = env && env.BC_ACCESS_TOKEN  ? String(env.BC_ACCESS_TOKEN) : '';

  if (!storeHash || !token) {
    return json({
      error:   'bc_unconfigured',
      message: 'BigCommerce not configured. Set BC_STORE_HASH and BC_ACCESS_TOKEN as Worker secrets.',
      version: WORKER_VERSION,
    }, 503);
  }

  // /bc/v3/catalog/products → /stores/{hash}/v3/catalog/products
  const bcPath    = url.pathname.replace(/^\/bc/, '');
  const bcUrl     = `https://api.bigcommerce.com/stores/${storeHash}${bcPath}${url.search}`;

  let upstream;
  try {
    upstream = await fetch(bcUrl, {
      method:  request.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        'X-Auth-Token': token,
      },
      // Only pass body on mutations — GETs have no body
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    });
  } catch (err) {
    return json({
      error:   'bc_upstream_unreachable',
      message: 'Could not reach BigCommerce API: ' + (err && err.message ? err.message : 'unknown'),
    }, 502);
  }

  // Forward rate-limit headers without the auth token
  const fwdHeaders = {
    'Content-Type':                  upstream.headers.get('Content-Type') || 'application/json',
    'Access-Control-Allow-Origin':   '*',
    'Access-Control-Expose-Headers': BC_RATE_HEADERS.join(', '),
  };
  for (const h of BC_RATE_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) fwdHeaders[h] = v;
  }

  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: fwdHeaders });
}
