// ════════════════════════════════════════════════════════════════════════════
// AccentOS · accent-rag · Cloudflare Worker
// Free 768-dim embeddings via Workers AI · @cf/baai/bge-base-en-v1.5
// Hard-bound to AccentOS origins. Shared-secret authed.
// ────────────────────────────────────────────────────────────────────────────
// Endpoints:
//   POST /embed
//     body: { texts: string[] }     (max 100 texts, 8KB each)
//     resp: { vectors: number[][] }  (each 768 long)
//
//   POST /embed/single
//     body: { text: string }
//     resp: { vector: number[] }
//
//   GET  /health
//     resp: { ok: true, model: "@cf/baai/bge-base-en-v1.5" }
// ────────────────────────────────────────────────────────────────────────────
// Bindings (wrangler.toml):
//   [ai] binding = "AI"
//   [vars]  ALLOWED_ORIGINS = "https://accent-os.pages.dev,https://accent-os-staging.pages.dev,http://localhost:8788"
//   [secrets] RAG_WORKER_SECRET — `wrangler secret put RAG_WORKER_SECRET`
// ────────────────────────────────────────────────────────────────────────────

const MODEL = "@cf/baai/bge-base-en-v1.5";
const MAX_TEXTS = 100;
const MAX_TEXT_BYTES = 8 * 1024;

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  // Allow listed exact origins; also allow any localhost port for codespace previews
  const ok = origin && (
    allowed.includes(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  );
  return {
    "access-control-allow-origin": ok ? origin : (allowed[0] || "*"),
    "access-control-allow-methods": "POST,GET,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function jsonResponse(data, init = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
  });
}

function unauthorized(origin, env) {
  return jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 }, corsHeaders(origin, env));
}

function badRequest(origin, env, msg) {
  return jsonResponse({ ok: false, error: msg }, { status: 400 }, corsHeaders(origin, env));
}

async function handleEmbed(req, env, ctx) {
  const origin = req.headers.get("origin") || "";
  const auth = req.headers.get("authorization") || "";
  const expected = "Bearer " + (env.RAG_WORKER_SECRET || "");
  if (!env.RAG_WORKER_SECRET || auth !== expected) {
    return unauthorized(origin, env);
  }

  let body;
  try { body = await req.json(); }
  catch { return badRequest(origin, env, "invalid json"); }

  let texts = [];
  if (Array.isArray(body?.texts)) texts = body.texts;
  else if (typeof body?.text === "string") texts = [body.text];
  else return badRequest(origin, env, "expected { texts: string[] } or { text: string }");

  if (texts.length === 0) return badRequest(origin, env, "no texts");
  if (texts.length > MAX_TEXTS) return badRequest(origin, env, `too many texts (max ${MAX_TEXTS})`);
  for (let i = 0; i < texts.length; i++) {
    if (typeof texts[i] !== "string") return badRequest(origin, env, `texts[${i}] is not a string`);
    const bytes = new TextEncoder().encode(texts[i]).byteLength;
    if (bytes > MAX_TEXT_BYTES) return badRequest(origin, env, `texts[${i}] exceeds ${MAX_TEXT_BYTES} bytes`);
  }

  // Workers AI accepts either a single string or array of strings.
  const result = await env.AI.run(MODEL, { text: texts });
  // Result shape: { shape: [n, 768], data: number[][] }
  const vectors = result?.data || [];

  return jsonResponse(
    { ok: true, model: MODEL, count: vectors.length, vectors },
    { status: 200 },
    corsHeaders(origin, env)
  );
}

async function handleHealth(req, env) {
  const origin = req.headers.get("origin") || "";
  return jsonResponse(
    { ok: true, model: MODEL, version: 1, time: new Date().toISOString() },
    { status: 200 },
    corsHeaders(origin, env)
  );
}

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("origin") || "";
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return handleHealth(req, env);
    }

    if (req.method === "POST" && (url.pathname === "/embed" || url.pathname === "/embed/single")) {
      return handleEmbed(req, env, ctx);
    }

    return jsonResponse(
      { ok: false, error: "not_found", path: url.pathname },
      { status: 404 },
      corsHeaders(origin, env)
    );
  },
};
