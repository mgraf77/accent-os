# Cloudflare Worker / API Proxy Rules

---

## Required Security Controls

Every AccentOS Worker/API proxy must implement ALL of the following:

| Control | Minimum Standard | Flag If Missing |
|---|---|---|
| Origin validation | Allowlist of known origins | Critical |
| Method restriction | POST-only for writes | High |
| Body size limit | ≤1MB default | High |
| Request timeout | ≤30s | High |
| Rate limiting | ≥30 req/min/IP baseline | High |
| Structured error responses | `{ error: "..." }` only — no upstream raw errors | High |
| Input validation | JSON content-type check | Medium |
| Secret isolation | Secrets via Wrangler env only | Critical |
| IP identification | `CF-Connecting-IP` where available | Medium |

---

## CORS Rules

**Current violation in `worker/anthropic-proxy.js`:**

```js
'Access-Control-Allow-Origin': '*'  // CRITICAL — wildcard CORS
```

**Required instead:**

```js
const ALLOWED_ORIGINS = [
  'https://accent-os.pages.dev',
  'https://accentlighting.com',  // add all known prod/staging origins
];

const origin = request.headers.get('Origin') || '';
const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

return new Response(body, {
  headers: {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
    ...
  }
});
```

**Flag as Critical if:**
- `Access-Control-Allow-Origin: *` is used in production
- Origin validation is absent entirely
- OPTIONS preflight does not echo back a validated origin

---

## API Key Handling Rules

**Current Critical Violation in `worker/anthropic-proxy.js`:**

```js
const apiKey = request.headers.get('x-api-key'); // reads key from CLIENT
// ... passes directly to Anthropic API
```

This means ANY caller can use this proxy with ANY Anthropic API key, and the proxy is a free relay for anyone who finds it.

**Required fix:**

```js
// Key must come from Worker environment, never from the request
const apiKey = env.ANTHROPIC_API_KEY; // Wrangler secret
if (!apiKey) {
  return new Response(JSON.stringify({ error: 'Worker misconfigured' }), { status: 500 });
}
```

**Flag as Critical if:**
- Any API key is read from request headers and forwarded to an upstream service
- Any secret is derived from client-provided input
- `env.*` secrets are logged or returned in responses

---

## Body Size Limit Rules

**Flag as High if body size is not enforced:**

```js
// Required
const MAX_BODY = 1_000_000; // 1MB
const contentLength = parseInt(request.headers.get('content-length') || '0');
if (contentLength > MAX_BODY) {
  return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
}
```

---

## Rate Limiting Rules

**Cloudflare Workers rate limiting via KV or Durable Objects:**

```js
// Baseline: 30 req/min per IP
const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
// implement token bucket or sliding window via KV
```

**Flag as High if:**
- No rate limiting logic exists
- Rate limiting is only commented out or disabled
- Rate limiting does not use `CF-Connecting-IP`

---

## Error Response Rules

**Flag as High if:**
- Raw upstream error bodies are returned to the browser
- Error responses include stack traces
- Error responses include internal URLs, keys, or credentials

**Required pattern:**

```js
try {
  const upstream = await fetch(...);
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: 'Upstream error', status: upstream.status }), {
      status: 502
    });
  }
} catch (err) {
  return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
}
```

---

## Method Restriction Rules

```js
if (request.method !== 'POST') {
  return new Response('Method not allowed', { status: 405 });
}
```

**Flag as High if:**
- Write-path endpoints accept GET
- No method check exists on mutating endpoints

---

## Timeout Rules

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
try {
  const upstream = await fetch(url, { signal: controller.signal, ... });
  clearTimeout(timeout);
} catch (err) {
  clearTimeout(timeout);
  if (err.name === 'AbortError') {
    return new Response(JSON.stringify({ error: 'Upstream timeout' }), { status: 504 });
  }
  throw err;
}
```

**Flag as High if:**
- No timeout exists on upstream fetch calls
- Timeout is >60 seconds

---

## Wrangler Config Rules

Check `wrangler.toml`:

**Flag as High if:**
- Secrets are hardcoded in `wrangler.toml` (they should be in Wrangler secret store)
- `[vars]` contains sensitive values
- No `compatibility_date` is set
- Routes are overly broad (exposing unintended paths)
