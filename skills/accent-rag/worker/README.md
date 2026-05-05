# accent-rag · Cloudflare Worker

Free 768-dim embeddings for AccentOS OS-RAG. Calls Cloudflare Workers AI (`@cf/baai/bge-base-en-v1.5`).

## Deploy

```bash
cd skills/accent-rag/worker
cp wrangler.toml.example wrangler.toml

# 1) Login (one time per machine)
npx wrangler login

# 2) Set the shared secret (paste a long random hex string — same value goes into AccentOS Settings)
openssl rand -hex 32
npx wrangler secret put RAG_WORKER_SECRET

# 3) Deploy
npx wrangler deploy
```

Wrangler returns a URL like `https://accent-rag.<your-account>.workers.dev`. Paste that URL into AccentOS at:

> Knowledge Engine → Config tab → RAG Worker URL

And paste the same hex secret into:

> Knowledge Engine → Config tab → RAG Worker Secret

## Verify

```bash
# Health check (no auth required)
curl https://accent-rag.<your-account>.workers.dev/health

# Embed a single string (auth required)
curl -X POST https://accent-rag.<your-account>.workers.dev/embed \
  -H "Authorization: Bearer $RAG_WORKER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world"}'
```

The `/embed` response should be `{ ok:true, model:"@cf/baai/bge-base-en-v1.5", count:1, vectors:[[...768 numbers...]] }`.

## Cost

Workers AI has a generous free tier (10K Neurons/day as of 2026). bge-base-en-v1.5 costs ~0.04 Neurons per embedding, so ~250K free embeddings per day. AccentOS scale (thousands of vendor playbooks + thousands of customer notes) is well below that ceiling.

## CORS

The worker enforces an origin allowlist via `ALLOWED_ORIGINS` in `wrangler.toml`. Add your staging URL or localhost preview port if needed. Localhost (any port) is allowed by default for development.
