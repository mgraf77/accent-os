STATUS:  paused
BUG:     Worker proxy 400 on aiParseNotes — redeploy needed
STEP:    Confirm wrangler redeploy then run browser console test
TEST:    fetch(workerUrl,{method:'POST'}).then(r=>r.text()).then(console.log)
RESUME:  continue last session

---
Commit 2dca2a6 has the fix but was NOT redeployed yet.
wrangler deploy must run from local terminal (not Codespace).
Model ID to verify: claude-sonnet-4-20250514
