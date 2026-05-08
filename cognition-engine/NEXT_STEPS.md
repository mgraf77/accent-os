# Next Steps — Post Governance Restructuring
> Priority order for resumption after the governance restructure is complete.

---

## Immediate (First Session Back)

### 1. Fix Cloudflare Worker 400 Bug (WIP from prior session)
**What:** Quote Generator "⚡ Parse Notes" returns 400 from the worker proxy.
**Requires from Michael first:**
```js
// Run in browser console on accent-os.pages.dev
fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'})
  .then(r=>r.text()).then(console.log)
```
- If returns `{"error":"Missing x-api-key header"}` → new code is live, problem is elsewhere
- If returns Anthropic auth error → worker not redeployed; run `wrangler deploy` from local terminal

### 2. Determine where Cognition Engine docs belong
After governance restructuring, decide:
- Does `cognition-engine/` stay in AccentOS repo?
- Does it move to a dedicated AgentOS/docs repo?
- Should it become a separate `CLAUDE.md` addendum?

---

## Short Term (2–4 Sessions)

### 3. Cognition Engine Phase 0 — Instrumentation
Per `cognition-engine/BUILD_PLAN.md`:
- Wire `system_events` in `sbFetch` (all CRUD operations emit events)
- Add navigation events to `goTo()`
- Daily KPI auto-snapshot Supabase Edge Function

This is the single highest-leverage infrastructure change — turns on temporal memory system-wide.

### 4. Track 6 Unblocked Items
- **6.5** Trade & Designer Portal (external-facing app for designers/contractors)
- **6.6** Vendor Rep Portal (external-facing app for vendor reps)
- **6.10** AccentOS → accentlightinginc.com embed (employee tools on public site)

### 5. MODULE_REGISTRY Refactor
Per `cognition-engine/ENTROPY_PREVENTION.md`:
Consolidate the 4-touchpoint module registration (sidebar, PAGE_META, dispatcher, hydrate) into a single declarative registry. Already designed in BUILD_INTELLIGENCE.md — waiting for the right session to execute.

---

## Medium Term (1–3 Months)

### 6. Vendor Score History Table (M41)
First temporal versioning table. Enables score trend display on vendor detail.

### 7. pgvector Setup + Article Embeddings
Enable semantic search in Knowledge Hub. Supabase already supports pgvector.

### 8. `cognition.js` Module
The four-role orchestration layer (router/retriever/synthesizer/validator). Wire Knowledge Engine to it as the first consumer.

---

## Depends on Michael Actions

| Action | Unlocks |
|---|---|
| Redeploy Cloudflare Worker | Quote Generator AI Parse |
| Run pending SQL migrations (M21–M40) | Several modules at partial functionality |
| Provide BigCommerce API key (M04) | Items 5.13, 6.3 |
| Windward written confirmation | Item 6.11 (ERP integration) |
| Owner decision: where do cognition-engine docs live? | Architecture clarity for future sessions |
