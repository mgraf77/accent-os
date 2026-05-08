# HANDOFF FOR GOVERNANCE RESTRUCTURE — 2026-05-08

This document maps what this branch touched and where each piece likely belongs after the AccentOS / AgentOS / Skills / Command Center split.

---

## Systems touched in this branch

1. **Quote Generator AI Parse flow** — `index.html` `aiParseNotes()` and surrounding line-item rendering.
2. **Anthropic API proxy** — `worker/anthropic-proxy.js` + `wrangler.toml`.
3. **Cross-cutting AI fetch sites** in `index.html` (vendor overview, vendor website lookup, `sendChat`) — touched by association, not edited this session.

## Dependencies graph

```
index.html (browser)
  └─ fetch → accentos-anthropic-proxy.mgraf77.workers.dev
              └─ fetch → api.anthropic.com/v1/messages
                          └─ requires: x-api-key from sessionStorage['aos-api']
                                       anthropic-version: 2023-06-01
                                       model: claude-sonnet-4-20250514
```

No backend service, no Supabase, no edge function involved in this flow.

## Assumptions baked in

- Worker URL is stable (`accentos-anthropic-proxy.mgraf77.workers.dev`) and lives on Michael's Cloudflare account.
- `sessionStorage['aos-api']` is the only client-side Anthropic key store.
- Single Anthropic model ID is good for all 4 call sites.
- App is served from Cloudflare Pages (`accent-os.pages.dev`); origin must be allowed by worker CORS (currently `*`).
- `wrangler deploy` is a manual operator action — not automated.

## Where things likely belong post-restructure

| Artifact | Likely home | Why |
|---|---|---|
| `worker/anthropic-proxy.js` | **AgentOS** or new **`accent-os-infra`** repo | It's a shared LLM-access primitive; multiple front-ends will eventually call it |
| `wrangler.toml` | Same repo as the worker | Config travels with code |
| The 4 `fetch('...workers.dev/v1/messages',...)` blocks in `index.html` | **AccentOS** (where they are) — but extracted into a single `aiCall()` helper | Reduces copies-of-URL from 4 to 1 |
| Anthropic key storage (`sessionStorage['aos-api']`) | **AccentOS** UI for input; **Command Center** for distribution if multi-app | One UI to set the key, one convention to read it |
| Skill registry (`skills/_index.md`, `skills/vibe-speak/...`) | **Skills repo** | Already self-contained; just needs lifting out cleanly with `.claude/CLAUDE.md` paths preserved or updated |
| `BUILD_PLAN_*`, `MASTER.md`, `SESSION_LOG.md`, `PROMPT_LOG.md` | **AccentOS** | App-specific operating docs |
| This handoff + `SESSION_SUMMARY.md` etc. | **AccentOS** for now; consider a top-level governance docs space later | Branch-local, archived once restructure completes |

## High-coupling / risky zones

- **Worker URL string literal** appears 4× in `index.html`. Hard-coded. Will break silently if the worker moves to a new domain.
- **Model ID string literal** appears 4× in `index.html`. Will break all 4 AI features simultaneously when the snapshot retires.
- **Error-swallowing pattern** in 3 of the 4 AI fetch sites masks upstream failures as "unavailable" strings. Makes debugging harder during restructure.
- **`.claude/CLAUDE.md` boot sequence** hard-codes paths under `skills/vibe-speak/` and `skills/_index.md`. Lifting Skills repo out without updating these breaks session start.

## Incomplete abstractions / duplicate systems

- 4 inline copies of the same Anthropic POST shape. Obvious extraction opportunity, not done this session.
- Worker has no rate-limit, no logging, no auth beyond passing the key through. Fine for solo use; will need hardening if it becomes shared infra.
- `getS('aos-api')` (in `index.html`) is the only consumer of `sessionStorage['aos-api']`. If Command Center wants to inject the key, it will need a known integration point — none exists today.

## Recommended cleanup opportunities (post-restructure)

1. Extract `aiCall(systemPrompt, userMessage, opts)` helper in `index.html`. Replaces all 4 fetch sites with one call. Centralizes URL, headers, model, and error handling.
2. Add the same error-surfacing patch to the 3 unfixed AI sites (`vd-overview`, vendor website lookup, `sendChat`).
3. Move `worker/` + `wrangler.toml` out of this repo when the new infra repo is decided.
4. Add a `GET /v1/messages` 405 with JSON body so misdirected GETs stop returning the bare-string `Method not allowed`.
5. Decide on a key-distribution convention so `sessionStorage['aos-api']` isn't the only path.

## What this branch should NOT cause friction with

- No schema migrations, no Supabase changes, no new tables.
- No new npm dependencies.
- No new build steps.
- No new env vars in the web app.
- Worker uses `ANTHROPIC_API_KEY` secret if env-mode is ever added; currently key is passed from the browser per-request, not stored on the worker.
