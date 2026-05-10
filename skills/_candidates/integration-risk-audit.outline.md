# Skill outline (DRAFT — not installed): `integration-risk-audit`

> Status: **candidate**. Not in `_index.md`. Not auto-invoked. Promotion requires Michael review.
> Source pattern: each time an external integration is added or changed (Anthropic worker proxy, Supabase RLS, BigCommerce API, Windward sync), we hand-audit the same risk surfaces. This skill bundles the audit, with a concrete grep sub-step at its core.

## One-line summary
Audit an external integration boundary (auth, CORS, error path, secret handling, retry shape) before promoting it to production.

## Trigger phrases
- "audit this integration"
- "integration risk check"
- "before we deploy this worker / proxy / sync"

## When to use
- A new external system is wired in (worker, edge function, third-party fetch, RLS policy).
- An existing integration is being changed in a way that crosses a security boundary (CORS, auth header, key rotation, redirect behavior).

## When NOT to use
- Pure UI / styling change.
- Internal-only code paths with no external surface.

## Companions
- `codex-review` — second-opinion peer review after the audit shortlist is built.
- `schema-contract-tests` — if integration is a Supabase write path.
- `verified-commit` — gate on the audit before commit.
- `decision-log` — capture any explicit risk acceptance.

## Procedure (draft)

### Step 0 — Identify the boundary
- File set involved (e.g., `worker/anthropic-proxy.js` + every fetch in `index.html` that targets it).
- Direction (browser → worker → vendor; or DB → frontend; or webhook → DB).
- Trust posture (public URL? signed? rate-limited?).

### Step 1 — Grep sub-step (the core mechanic)

Run a fixed grep matrix across the touched file set. The matrix below is the minimum overnight-safe shape; production version will codify it.

```
# 1. Direct external URLs (anything browser-to-vendor that bypasses our proxy)
grep -nE "https?://(api\.anthropic\.com|api\.openai\.com|.*\.bigcommerce\.com|.*\.supabase\.co)" <files>

# 2. Hard-coded secrets / keys
grep -nE "(sk-[A-Za-z0-9_-]{20,}|sbp_[A-Za-z0-9]{20,}|x-api-key\s*[:=]\s*[\"'][^\"']+[\"'])" <files>

# 3. Permissive CORS
grep -nE "Access-Control-Allow-Origin\s*[:=]\s*[\"']\\*[\"']" <files>

# 4. Missing await on fetch
grep -nE "(^|[^a-zA-Z_])fetch\(" <files> | grep -v "await\|return"

# 5. .json() without try
grep -B2 -nE "\.json\(\)" <files> | grep -v "try\|catch"

# 6. Error swallowed
grep -nE "catch\s*\(.*\)\s*{\s*}" <files>

# 7. Retry without backoff
grep -nE "for\s*\(.*retr" <files>
```

The grep set is intentionally noisy — false positives are fine; missed positives are not.

### Step 2 — Triage
For each grep hit:
- 🟢 known-safe (whitelisted in `KNOWN_SAFE_INTEGRATION_HITS.md`)
- 🟡 needs note (e.g., CORS `*` is intentional on the proxy because we restrict by API key, not origin)
- 🔴 blocker (must be fixed before deploy)

### Step 3 — Auth / secret review
- Where does the secret enter the request? (header / query string / body)
- Where is it stored? (sessionStorage, env var, Worker secret, never repo)
- Rotation path documented?

### Step 4 — Error path review
- What does the user see on 4xx? On 5xx? On network failure?
- Is the error wired to a toast / inline UI hint? Or silently console.logged?

### Step 5 — Output
A short markdown report:
```
INTEGRATION: <name>
BOUNDARY: <direction>
HITS: <count by color>
BLOCKERS: <list or none>
RECOMMENDATION: ship / hold / split
```

## Smallest end-to-end test
Run the audit against `worker/anthropic-proxy.js` + the four fetch sites in `index.html`. Expect:
- 🟡 on CORS `*` (intentional — proxy is keyed)
- 🟡 on `sessionStorage['aos-api']` consumption (intentional — owner-only path)
- 🔴 on the current commit `2dca2a6` since worker is not redeployed (blocker = "deploy + retest").

## Promotion checklist
- [ ] Michael review.
- [ ] Decide: standalone skill, or a sub-step inside `codex-review`?
- [ ] Add `KNOWN_SAFE_INTEGRATION_HITS.md` allowlist file to repo.
- [ ] Draft full SKILL.md with the grep matrix as a stable artifact.
- [ ] Smoke test: re-run against the worker proxy boundary; expect the canonical 🔴 deploy blocker.
