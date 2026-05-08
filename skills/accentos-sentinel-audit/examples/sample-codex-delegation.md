# Sample Codex Delegation Prompts

Ready-to-paste prompts from a real AccentOS Sentinel Audit session.

---

## Codex Task: Harden Worker Proxy — SEC-001 through SEC-003

```
# Codex Fix Plan — AccentOS Worker Proxy Security

## Repo Context
AccentOS is an internal Cloudflare Pages app. The Worker proxy (worker/anthropic-proxy.js)
forwards requests to the Anthropic API. It currently has critical security gaps that must
be fixed before the next production deployment.

## Files to Modify
- worker/anthropic-proxy.js ONLY

## Critical Issues to Fix

### SEC-001: API key read from client request headers (CRITICAL)
Current code reads `request.headers.get('x-api-key')` and forwards it to Anthropic.
This makes the proxy an open relay — any caller can use it with any API key.

Fix: Replace with `env.ANTHROPIC_API_KEY` (second parameter to the fetch handler).
Return 500 if env key is missing.

### SEC-002: Wildcard CORS (CRITICAL)
Current code sets `'Access-Control-Allow-Origin': '*'` in all responses.
This allows any website to make requests through this proxy.

Fix: Add an origin allowlist. Validate `request.headers.get('Origin')` against the list.
Return 403 if origin is not in the list. The OPTIONS preflight must also respect the list.

### SEC-003: No origin validation (CRITICAL)
Related to SEC-002. There is no origin check at all — only CORS headers.

Fix: Add explicit origin validation before processing any request.

## High Issues to Fix

### SEC-004: No body size limit (HIGH)
No max body size enforcement. An attacker can send arbitrarily large payloads.
Fix: Check Content-Length header. Reject requests > 1MB with 413.

### SEC-005: No upstream timeout (HIGH)
No AbortController or timeout on the upstream Anthropic fetch.
Fix: Add 30-second timeout using AbortController. Return 504 on timeout.

### SEC-006: No rate limiting (HIGH)
No rate limiting. The proxy can be hammered.
Note: Full rate limiting requires Cloudflare KV. For this patch, add a basic
per-request check using CF-Connecting-IP with a simple KV-based sliding window,
OR add a comment and TODO noting rate limiting requires KV setup, and add IP
logging to prepare for it.

### SEC-007: Raw upstream errors returned (HIGH)
`const responseText = await upstream.text(); return new Response(responseText, ...)`
This returns raw Anthropic error bodies to the browser, potentially leaking info.
Fix: Check upstream.ok. If not ok, return a sanitized { error: 'Upstream error', status: N }.

## Hard Constraints
1. ONLY change worker/anthropic-proxy.js
2. Keep the POST-only method check (it exists and is correct)
3. Keep the arrayBuffer body passthrough for the actual payload
4. Keep the 'anthropic-version' header forwarding
5. Do NOT expose env.ANTHROPIC_API_KEY in any response or log
6. The Worker must still work end-to-end for legitimate AccentOS users

## Output Required
1. Complete patched worker/anthropic-proxy.js (full file, not just diff)
2. Numbered list of every changed line
3. Explanation for each change
4. Smoke test checklist
5. What SEC-006 (rate limiting) would need beyond this file to implement fully
```

---

## Codex Task: Add Patch Boundary Markers to index.html

```
# Codex Task — Add START/END Patch Markers to index.html

## Context
AccentOS has a large index.html file (~718KB). Major feature sections need
START/END patch boundary markers to make AI-assisted editing safe and targeted.
Markers must be added without changing any functionality.

## File to Modify
- index.html ONLY

## Task
Locate the major feature sections in index.html and add START/END markers.

Required marker format for HTML sections:
<!-- START: AccentOS [Section Name] -->
...existing content unchanged...
<!-- END: AccentOS [Section Name] -->

Required marker format for JS sections inside <script> tags:
// START: AccentOS [Section Name]
...existing content unchanged...
// END: AccentOS [Section Name]

## Sections to Mark (identify by content, add marker before/after)
1. Navigation / shell structure
2. Vendor Intelligence module section
3. Each other major module section (identify by feature name in the HTML)
4. Utility/shared functions section
5. Initialization/boot sequence

## Hard Constraints
1. Do NOT change any functionality — add only comment lines
2. Do NOT remove any existing comments
3. START and END names must match exactly
4. Do NOT add markers inside existing marked sections
5. If a section is ambiguous, add a comment like:
   <!-- TODO: verify section boundary before marking -->

## Output Required
1. List of all markers added with line numbers
2. Complete list of identified sections
3. Any sections that were unclear (for human review)
```

---

## Codex Task: Audit Direct Supabase Writes in /js/ modules

```
# Codex Review Task — Direct Supabase Write Patterns in AccentOS JS Modules

## Context
AccentOS requires all Supabase writes to go through a centralized write gateway
(dbInsert, dbUpdate, dbDelete). Direct calls to .insert(), .update(), .delete(),
.upsert() from UI module code are a policy violation and must be flagged.

## Files to Review
- All files in /js/ directory (37 files)

## Review Objective
Find every instance of direct Supabase write patterns in the /js/ modules:
- supabase.from('table').insert(...)
- supabase.from('table').update(...).eq(...)
- supabase.from('table').delete().eq(...)
- supabase.from('table').upsert(...)
- Any equivalent patterns using a local supabase variable reference

## Do NOT Flag (these are expected and correct)
- Read patterns: .select(), .eq(), .order() without a write operation
- Code inside the write gateway module itself (dbInsert/dbUpdate/dbDelete definitions)
- Commented-out code

## Output Required
1. Findings table: | File | Line | Pattern | Severity |
2. For each finding, the exact line of code
3. Suggested replacement using dbInsert/dbUpdate/dbDelete
4. Count of total violations
5. Estimate of effort to migrate (per file and total)
```
