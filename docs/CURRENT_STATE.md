# Current State — 2026-05-08

## Operational Status

**App:** accent-os.pages.dev — last known state: running (auth live, Quote Generator v2 present, Cloudflare Worker proxy deployed but has an unresolved 400 on the Parse Notes flow).

**Branch:** `claude/chatgpt-limits-guide-ADDqi` — clean, up to date with origin. No uncommitted work.

**Main/production branch:** Not examined this session. Branch divergence from main is unknown — needs reconciliation before governance restructuring.

---

## Known Working (as of last code session 2026-05-07)

- Supabase Auth + 5-role system
- Role-gated sidebar
- Vendor scoring with persistence
- Parent company / brand family grouping
- Vendor metadata / overrides
- Quote Generator v2 (save/load/delete/CSV export)
- Daily Command Center (phase 1 + phase 2 tiles)
- CRM / Customer Intelligence
- Sales Pipeline with probability model
- All 9 extracted JS modules in `js/`

## Known Broken / Incomplete

- **Worker 400 bug (CRITICAL):** `aiParseNotes` in Quote Generator returns 400 from `accentos-anthropic-proxy.mgraf77.workers.dev`. The worker was patched in commit `2dca2a6` but may not have been redeployed via `wrangler deploy` from Michael's local machine. See WORK_IN_PROGRESS.md for diagnostic steps.
- **M01 (RLS tightening):** `sql/M01_rls_tightening.sql` written but not yet run by Michael in Supabase.
- **M02 (Core schema):** `sql/M02_core_schema.sql` written but not yet run by Michael in Supabase. Many Track 1–4 features are blocked behind this.
- **Model ID risk:** `aiParseNotes` references `claude-sonnet-4-20250514` — needs verification this model ID is still valid.

## Docs Directory (this session's output)

```
docs/
  chatgpt_usage_limits_session_resets_guide.md   — ChatGPT limits reference guide
  ai_workflow_operating_rules.md                  — AI workflow operational checklist
  SESSION_SUMMARY.md                              — this session summary
  CURRENT_STATE.md                                — this file
  NEXT_STEPS.md                                   — recommended next actions
  KNOWN_ISSUES.md                                 — issue registry
  HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md           — handoff for upcoming restructure
```
