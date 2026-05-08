# NEXT STEPS — 2026-05-08

Ordered by priority. Does not include governance restructuring items (those belong to the incoming restructure phase).

---

## Immediate (requires Michael — local machine)

### 1. Fix Cloudflare Worker 400 bug

**What:** `wrangler deploy` the current `worker/anthropic-proxy.js` code from Michael's local machine. The codespace cannot run wrangler against the Cloudflare account.

**Why:** Quote Generator's "Parse Notes" AI feature is broken until this lands.

**How:**
```bash
# On Michael's local machine:
cd C:\Users\Michael\Desktop\accent-os
git pull origin main
wrangler deploy
```

**Verify:**
```js
// Browser console on accent-os.pages.dev:
fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'})
  .then(r=>r.text()).then(console.log)
// Should return: {"error":"Missing x-api-key header"}
// (Not an Anthropic auth error)
```

---

## After governance restructuring

### 2. Merge DDV Evaluator to main (or target repo)

`claude/build-ddv-evaluator-nj468` is ready to merge. Pure documentation — no app code conflicts. Decision: does `skills/meta/` stay in AccentOS or move to a Skills repo? That answer should come from the governance restructuring.

### 3. First real DDV evaluation

Run the DDV Evaluator on any recently-optimized AccentOS skill (e.g. `vendor-cascade` or `efficiency-monitor`) to generate the first real calibration data in `meta-evaluations/ddv-log.md`.

Target: 10 real evaluations to recalibrate effort weights.

### 4. Wire DDV into skill-forge Ralph loop

Per `integration-guide.md` — add DDV evaluation step to skill-forge's Step 8. This is the primary integration value. One-file change to `skills/skill-forge/SKILL.md`.

### 5. Build plan remaining items

- **5.13 E-Commerce Command Center** — no blocker, next autonomous build candidate
- **6.x integrations** — all require Michael to provide API credentials first

---

## Do NOT do until governance restructuring is complete

- Reorganizing `skills/` folder structure
- Creating new top-level directories in repo root
- Splitting any files into separate repos
- Adding new orchestration infrastructure
- Merging the DDV branch to `main` (wait for path decisions)
