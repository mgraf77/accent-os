# NEXT STEPS — resume after governance restructuring

**Resume trigger:** "continue cors proxy" or "finish parse notes"

---

## Immediate (do these first, in order)

1. **Redeploy the worker.** From Michael's local machine (not the Codespace):
   ```
   cd <local accent-os clone>
   git fetch origin
   git checkout claude/debug-cors-proxy-qyOYS
   git pull
   npx wrangler deploy
   ```

2. **Verify the new worker is live.** Browser console:
   ```js
   fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/').then(r=>r.json()).then(console.log)
   ```
   Must return `{ok:true, version:2, ...}`. If `version` is missing, deploy didn't take.

3. **Smoke-test the POST path:**
   ```js
   fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':sessionStorage.getItem('aos-api'),'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:50,messages:[{role:'user',content:'hi'}]})}).then(r=>r.text()).then(console.log)
   ```

4. **If step 3 still 400s:** the new client logs the upstream error message in console + UI. Read it. Most likely culprits in priority order:
   - Model name no longer valid → try `claude-sonnet-4-5-20250929`
   - `max_tokens` exceeds quota for that model → lower
   - API key is for a different org / lacks model access

5. **Merge to main once Parse works end-to-end.** PR from `claude/debug-cors-proxy-qyOYS` → `main`.

## Deferred (do after governance restructure)

- Apply the same error-surfacing pattern to the other 3 AI fetch sites (`vd-overview` overview, vendor website lookup, `sendChat`). They will silently fail the same way until then.
- Consolidate the 4 inline `fetch('...workers.dev/v1/messages',...)` calls into one helper. Skipped this session to avoid scope expansion before the governance phase.
- Decide whether the worker code lives in this repo or in a separate `accent-os-infra` repo.
