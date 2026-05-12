// Cloudflare Worker — Anthropic API proxy for AccentOS
//
// ── DEPLOYMENT ─────────────────────────────────────────────────────────────
// This file is NOT auto-deployed by the Cloudflare Pages webhook (Pages only
// deploys the SPA). It must be deployed manually with wrangler:
//
//   cd worker
//   wrangler deploy                          # push this file to Cloudflare
//   wrangler secret put ANTHROPIC_API_KEY    # paste sk-ant-... key when prompted
//
// Verify live state:
//   curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
//   Expected: {"version":"v3-env-fallback","env_key_set":true,...}
//   If env_key_set=false → secret not bound. If version≠v3-env-fallback → stale code.
//
// ── AUTH FLOW ──────────────────────────────────────────────────────────────
// POST /v1/messages resolves the API key in priority order:
//   1. x-api-key header from client  (user-supplied key from Settings → API Keys)
//   2. env.ANTHROPIC_API_KEY secret  (Cloudflare Workers secret binding)
//   3. Neither present → 503 ai_unconfigured
//
// With the secret bound, end-users never need to configure auth (option 2 fires).
// User-supplied keys override the env key — useful for power users / dev testing.
//
// ── VERSION HISTORY ────────────────────────────────────────────────────────
// v1/v2 (stale): required x-api-key from client; no env fallback.
//                GET returned "Method not allowed"; POST returned "Missing x-api-key header".
// v3 (this):     env fallback added; GET probe returns JSON with env_key_set field.
//
// Version markers in responses make it trivial to verify which build is live:
//   $ curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
//   {"version":"v3-env-fallback","env_key_set":true,"build":"2026-05-11"}
//
// Behavior:
//   - GET /        → version diagnostics (no Anthropic call, no auth required)
//   - OPTIONS /*   → CORS preflight
//   - POST /v1/*   → proxies to api.anthropic.com using env.ANTHROPIC_API_KEY,
//                    overridable by a client-supplied x-api-key header.
//   - Both keys missing → 503 with a structured ai_unconfigured payload.
const WORKER_VERSION = 'v3-env-fallback';
const WORKER_BUILD   = '2026-05-11';

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

export default {
  async fetch(request, env) {
    const method = request.method;
    const url    = new URL(request.url);

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // Version probe — lets ops verify which worker build is live without
    // making an upstream Anthropic call.
    if (method === 'GET' && (url.pathname === '/' || url.pathname === '/version')) {
      return json({
        version:        WORKER_VERSION,
        build:          WORKER_BUILD,
        env_key_set:    Boolean(env && env.ANTHROPIC_API_KEY),
        // Never echo the actual key. Only presence + length signal.
        env_key_length: env && env.ANTHROPIC_API_KEY ? String(env.ANTHROPIC_API_KEY).length : 0,
      }, 200);
    }

    if (method !== 'POST') {
      return json({ error: 'method_not_allowed', message: 'Use POST or GET /', version: WORKER_VERSION }, 405);
    }

    // Resolve API key: client-supplied x-api-key wins (lets power users use their own
    // account); else fall back to the worker's bound secret so end-users never need
    // to configure anything. If both are missing, return a friendly 503 so the SPA
    // can degrade gracefully.
    const headerKey = request.headers.get('x-api-key');
    const envKey    = (env && env.ANTHROPIC_API_KEY) ? String(env.ANTHROPIC_API_KEY) : '';
    const apiKey    = (headerKey && headerKey.trim()) || envKey || '';

    if (!apiKey) {
      return json({
        error:   'ai_unconfigured',
        message: 'AI service not configured. Set ANTHROPIC_API_KEY as a Workers secret on accentos-anthropic-proxy.',
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
    // Pass-through. x-worker-version response header lets the SPA verify build at runtime.
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
