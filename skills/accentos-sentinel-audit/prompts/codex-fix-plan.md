# Codex Fix Plan Prompt Template

Use this after Claude identifies findings that need precise code-level implementation.
This delegates the patch implementation to Codex.

---

## Template

```
# Codex Fix Plan — AccentOS [FINDING_TITLE]

## Context

AccentOS is an internal Cloudflare Pages app backed by Supabase.
The following finding was identified in a Sentinel Audit:

Finding ID: [FINDING_ID]
Severity: [CRITICAL/HIGH/MEDIUM]
File(s): [FILE_PATHS]
Lines: [LINE_RANGES IF KNOWN]

## Problem

[EXACT DESCRIPTION OF THE ISSUE — copy from audit finding]

## Evidence

[PASTE RELEVANT CODE SNIPPET FROM SCANNER OR CLAUDE FINDING]

## Required Fix

[EXACT SPECIFICATION OF WHAT THE FIX MUST DO]

Be specific:
- What must be added
- What must be changed
- What must NOT be changed
- What existing behavior must be preserved

## Hard Constraints

1. Only change the files listed above
2. Do not modify anything not directly related to this finding
3. Do not add new dependencies
4. Do not remove existing functionality
5. Preserve existing comments and patch boundary markers

## Acceptance Criteria

- [ ] [SPECIFIC VERIFIABLE CRITERION 1]
- [ ] [SPECIFIC VERIFIABLE CRITERION 2]
- [ ] [SPECIFIC VERIFIABLE CRITERION 3]

## Smoke Test

After patching, verify:
[LIST MANUAL OR AUTOMATED TESTS]

## Output Required

1. The complete patched file(s) — do not show just the diff
2. List of every line changed
3. Explanation of why each change was made
4. Any residual risks not addressed by this patch
```

---

## Pre-Filled Example: Worker API Key Fix

```
# Codex Fix Plan — Worker API Key Read From Client Headers

## Context
AccentOS Cloudflare Worker proxy passes the Anthropic API key from the client
request directly to the Anthropic API. This means any caller can use the proxy
with any API key, making the proxy a free open relay.

Finding ID: WORKER-001
Severity: CRITICAL
File(s): worker/anthropic-proxy.js

## Problem
Line ~19: `const apiKey = request.headers.get('x-api-key');`
The Worker reads the API key from the incoming request and forwards it.
It should instead read from env.ANTHROPIC_API_KEY (Wrangler secret).

## Evidence
```js
const apiKey = request.headers.get('x-api-key');
if (!apiKey) {
  return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), {
```

## Required Fix
1. Remove the request.headers.get('x-api-key') read
2. Use env.ANTHROPIC_API_KEY instead (passed as second arg to fetch handler)
3. Return 500 if env.ANTHROPIC_API_KEY is not configured
4. Remove the 'x-api-key' from Access-Control-Allow-Headers in CORS preflight
5. Do not forward any client-provided headers that could override Worker secrets

## Hard Constraints
1. Only change worker/anthropic-proxy.js
2. Preserve the POST-only method check
3. Preserve the arrayBuffer body passthrough
4. Preserve the 'anthropic-version' header forwarding
5. Do not expose env.ANTHROPIC_API_KEY in any response

## Acceptance Criteria
- [ ] No x-api-key header is read from the incoming request
- [ ] env.ANTHROPIC_API_KEY is used as the API key for the upstream call
- [ ] A request without a valid API key in env returns 500 with a safe message
- [ ] Legitimate Anthropic API requests still succeed end-to-end

## Smoke Test
- curl -X POST [worker-url] -H "Content-Type: application/json" -d '{}' → no longer requires x-api-key from caller
- Anthropic completion call still works via the Worker
- x-api-key is not in Access-Control-Allow-Headers response
```
