# Next Steps — AccentOS
**As of:** 2026-05-08
**After governance restructuring completes**

---

## Immediate (before next production deploy)

### P0 — Fix Worker Security (CRITICAL)
Use the Codex delegation prompt from:
`skills/accentos-sentinel-audit/examples/sample-codex-delegation.md`

In one Worker deployment, fix:
1. Move API key from client headers to `env.ANTHROPIC_API_KEY`
2. Replace wildcard CORS with origin allowlist
3. Add body size limit (1MB)
4. Add AbortController timeout (30s)
5. Sanitize error responses (no raw upstream bodies)
6. Rate limiting (30 req/min/IP — requires Wrangler KV binding)

This also resolves ISSUE-001 (Worker 400 bug) if redeployed.

### P0 — Verify RLS on M31–M39 Tables
Check each table in Supabase Dashboard: products, pipeline_deals_stage_history, invoices, payments, service_tickets, survey_responses, recurring_contracts, vendors (M39 context).
If RLS is not enabled on any: run a remediation migration.

---

## Short-term (next build session)

### P1 — Add Patch Boundary Markers to index.html
Use the Codex task in `sample-codex-delegation.md`. Markers only — no functionality changes. This must happen before the next major AI-assisted feature build.

### P1 — Run Claude Architecture Audit
The deterministic scanners ran. The Claude-layer audit (Category A — Architecture Drift) has not run yet. Use `skills/accentos-sentinel-audit/prompts/claude-architecture-audit.md` with current scanner JSON as input.

### P2 — Merge Sentinel Audit Branch to Main
Branch `claude/accentos-sentinel-audit-Q9E8o` should be reviewed and merged. No code functionality changed — only the skills package was added.

---

## Medium-term (post-governance restructure)

### Modular Extraction Planning
index.html at 718KB. Plan extraction order before hitting 750KB (HIGH) threshold. Largest candidate: Vendor Intelligence module (the core Phase 1 feature).

### Lights America data52 Integration Readiness
Before building the integration:
- Run the integration audit prompt: `prompts/product-logic-review.md`
- Define vendor_id → external_sku mapping table
- Define feed_source provenance column
- Confirm price_effective_date and stock_checked_at schema

### Worker Rate Limiting via KV
Rate limiting requires a Cloudflare KV binding (`wrangler.toml` update + KV namespace creation). Defer to when Worker redeploy is planned.

### Module Help Tabs
Each live module needs an employee-facing help/how-to tab. Currently unverified. Run docs drift audit to get the specific list.

---

## Sentinel Audit Cadence (once governance settles)

| Trigger | Scope |
|---|---|
| Before every deploy | Security + RLS |
| After every major AI patch session | Full automated scan |
| Weekly | Architecture + docs drift |
| Monthly | Full Sentinel audit |
