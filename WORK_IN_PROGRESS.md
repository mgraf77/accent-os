# WORK IN PROGRESS

**Branch:** claude/setup-codex-integration-gMAyH  
**Last commit:** eeca1db — docs(decomp): Phase 1 COMPLETE  
**Updated:** 2026-05-10

---

## CURRENT STATE: PHASE 1 DECOMPOSITION COMPLETE

**index.html: 7,175 → 2,009 lines (−72%)**

| Packet | Module | Commit |
|---|---|---|
| P1 | js/vendors_module.js | c345f23 |
| P2 | js/vendor_scoring.js | 5168e6d |
| P3 | js/quotes_module.js | b517b8e |
| P4 | js/dashboard_module.js | 48c37bd |
| P5 | js/mgmt_module.js | cf9d32c |
| P6 | js/pipeline_module.js | 2f12a29 |
| P7 | js/repoutreach_module.js | a43f37b |
| P8 | js/settings_module.js | b1321b3 |
| P9 | js/knowledge_module.js | b2736b3 |

All 9 script tags confirmed in index.html at lines 1969–1977. Working tree clean.

---

## KNOWN RESIDUAL INLINE (not a bug)

Lines 1672–1933 in current index.html (262 lines) — vendor overflow functions
that were physically after the repoutreach block in the pre-P1 file:
renderChangelog, revertChange, openVP, liveScore/saveVP/closeVP, exportCSV,
openCSVImport/parseCSVFile, openAddVendor/confirmAddV, changelog() page,
exportChangeLog. App functions correctly — all globally accessible.

Full state map: docs/runtime/POST_P9_DECOMPOSITION_STATE.md

---

## NEXT SAFEST ACTION

**Michael must act first:**
1. Merge branch to main (branch is merge-safe)
2. Deploy to Cloudflare Pages (auto-deploy on merge, or manual push)
3. Smoke-test: Vendor Ranking, Quotes, Dashboard, Pipeline, Rep Outreach, Knowledge

**After merge + deploy confirmed working:**

Optional Phase 1.5 (new branch):
- Extract lines 1672–1933 (262 lines) into js/vendors_overflow.js
- index.html would reach ~1,747 lines
- Risk: Low. All standalone vendor page residual functions.
- See docs/runtime/POST_P9_DECOMPOSITION_STATE.md for full spec.

DO NOT extract: SCORING_HELPERS, ADVANCED_FILTERS, AUTH, SUPABASE_CORE,
VD data — these are Phase 2+ and require a module loader.

---

## BLOCKERS

1. **Michael: merge + deploy** — branch must be merged and deployed before smoke-test
2. **Worker redeploy**: git pull && wrangler deploy from Windows terminal (Parse Notes fix)
3. **Codex auth**: create IP-unrestricted OpenAI key, write to .claude/settings.local.json

---

## ROLLBACK STRATEGY

Any single packet: git revert <commit> --no-edit

Full Phase 1 rollback:
git revert b2736b3 b1321b3 a43f37b 2f12a29 cf9d32c 48c37bd b517b8e 5168e6d c345f23 --no-edit

---

## STALE SPECS — IGNORE

Old P7-P12 specs from prior sessions reference pre-P1 line numbers and are invalid.
Use only docs/runtime/POST_P9_DECOMPOSITION_STATE.md for next-corridor planning.
