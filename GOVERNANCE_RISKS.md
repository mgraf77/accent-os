# GOVERNANCE_RISKS.md — AccentOS Risk Register
> Append-only risk log. New risks get new IDs. Resolved risks get a RESOLVED date but are never deleted.

**Last updated:** 2026-05-08

---

## ACTIVE RISKS

### R-01 — index.html Monolith Size
- **Risk:** 7,169-line single-file monolith is difficult to maintain, edit safely, and reason about
- **Severity:** Medium
- **Mitigation:** Module extraction to js/ is ongoing. Do NOT make large edits to index.html until extraction is further along
- **Gate:** Any edit to index.html > 50 lines requires explicit approval + WIP checkpoint before and after
- **Owner:** Claude (extraction) + Michael (approval for large edits)

### R-02 — Worker Proxy Redeploy Required
- **Risk:** Cloudflare Worker fix (commit 2dca2a6) is not yet redeployed — Quote Generator AI parse is broken
- **Severity:** High (affects production AI feature)
- **Mitigation:** Michael must run `wrangler deploy` from local terminal
- **Blocker:** This is BLOCKS ON MICHAEL — cannot redeploy from Codespace/cloud environment
- **Owner:** Michael

### R-03 — RLS Not Tightened
- **Risk:** M01_rls_tightening.sql has not been run — anon access policies still in place
- **Severity:** High (security)
- **Mitigation:** Script written and reviewed; pending Michael run via Supabase SQL editor
- **Gate:** Do not add new tables with sensitive data until M01 is live
- **Owner:** Michael (SQL run) + Claude (wrote M01)

### R-04 — UI Role Visibility Is Not Security Enforcement
- **Risk:** The AccentOS Shell role visibility matrix (this session) uses frontend-only `data-roles` gating — it is NOT a real security boundary
- **Severity:** Medium
- **Mitigation:** Clearly documented. Real enforcement requires server-side RLS + JWT role claims. Tracked as future work.
- **Gate:** Do not present the visibility matrix as security. It is UX filtering only.
- **Owner:** Claude (document clearly) + Michael (approve when real enforcement is added)

### R-05 — No Boot Smoke Script (Pre-Session)
- **Risk:** No automated smoke test to verify the app boots before/after changes
- **Severity:** Low-Medium
- **Mitigation:** scripts/boot-smoke.sh created this session — validates file integrity, no broken syntax
- **Owner:** Claude

### R-06 — AgentOS / AccentOS Confusion Risk
- **Risk:** This codebase is AccentOS (employee-facing business OS), not AgentOS (AI agent platform). UI patterns from AgentOS design should be adapted, not literally copied.
- **Severity:** Low (design/communication)
- **Mitigation:** All design docs use AccentOS terminology. AgentOS is inspiration only.
- **Owner:** Claude

---

## RESOLVED RISKS

*(none yet)*

---

## RISK GATES (ALWAYS ACTIVE)

These are hard stops — if any of these conditions arise, stop and surface to Michael:

| Gate | Condition |
|---|---|
| GATE-01 | Any edit touching worker/ or wrangler.toml |
| GATE-02 | Any new SQL migration that drops or alters existing tables |
| GATE-03 | Any change that would break production at accent-os.pages.dev |
| GATE-04 | Any change requiring real security enforcement decisions |
| GATE-05 | index.html edits > 50 lines without explicit Michael approval |
| GATE-06 | Moving files across repos (AccentOS ↔ AgentOS) |
