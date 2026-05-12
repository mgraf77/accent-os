# AI Interaction Map - AccentOS

This document maps the path from frontend AI features to the backend and external APIs.

## Call Path Architecture

```
[Frontend UI] -> [Anthropic Proxy Worker] -> [Anthropic API (Claude)]
```

## 1. Frontend Integration Points

### Quote Generator (AI Quote Builder)
- **Function:** `aiParseNotes()` in `index.html`.
- **Action:** Takes raw fixture schedule text from the "Notes" field.
- **Prompt:** Uses a complex system prompt containing a "Known Fixture Code Map" to identify parts and prices.
- **Output:** Returns a structured JSON of line items.

### Knowledge Engine (Ask the Engine)
- **Function:** `sendChat()` in `index.html`.
- **Modes:**
  - `internal`: Expert AI for staff (fixtures, compliance, specs).
  - `customer`: Friendly assistant for showroom visitors (design tips, sizing).
- **Context:** Maintains a local `CHAT` array for session-based history.

## 2. Cloudflare Worker (Anthropic Proxy)

- **Source:** `worker/anthropic-proxy.js`.
- **Deployment:** `accentos-anthropic-proxy.mgraf77.workers.dev`.
- **Role:**
  - Securely stores `ANTHROPIC_API_KEY` (secret).
  - Handles CORS for the frontend.
  - Enforces `anthropic-version` and model selection (`claude-sonnet-4-5`).
  - Provides a `/v1/version` endpoint for health checks and version verification.

## 3. Worker Interaction Logic

1. **Request:** Frontend sends a POST to `/v1/messages`.
2. **Auth Fallback:**
   - If the client sends `x-api-key`, the worker uses it (per-user override).
   - Otherwise, the worker uses its internal `ANTHROPIC_API_KEY` secret.
3. **Response Handling:**
   - On success: Returns Anthropic's JSON response.
   - On error: Returns structured error JSON.
   - Graceful Degrade: If the worker returns a 503 (unconfigured), the UI surfaces a "manual mode" message rather than crashing.

## 4. Diagnostics

The frontend runs a probe on startup to verify worker connectivity:
- Path: `GET /v1/version`.
- Logs version to console and `window.__AOS_WORKER_VERSION__`.
- Alerts in console if a "Missing x-api-key" error is detected on a GET probe (indicates stale worker build).
