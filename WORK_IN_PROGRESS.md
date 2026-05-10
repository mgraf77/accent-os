# WORK IN PROGRESS

**Branch:** claude/setup-codex-integration-gMAyH  
**Last commit:** 4a5d7f5 — docs(decomp): mark P1 complete, P2 ready  
**Updated:** 2026-05-10

---

## ✅ COMPLETED THIS SESSION

- **DECOMP_P1_VENDORS** — DONE
  - Extracted 1,843 lines (2354–4196) → `js/vendors_module.js` (1,845 lines with header)
  - 28 top-level functions extracted verbatim
  - `index.html` reduced from 7,175 → 5,333 lines
  - Script tag added: `<script src="js/vendors_module.js?v=6.11.1">` at line 5301
  - Live `openRepOutreach` stays inline at line 2355 (P7 territory)
  - `renderChangelog`, `openVP`, etc. at lines 4766+ remain inline (called globally)
  - Commit: c345f23
  - Docs updated: PHASE1_PACKETIZED_TASKS.md P1 ✅, P2 = Ready

---

## ⬜ NEXT: DECOMP_P2_VENDOR_SCORING

**P2 is unblocked. Actual line ranges in current index.html:**
- Start: line 1214 (`// ── CO-OP / REBATE TRACKER (Track 2.3, coop_tracker table) ──`)
- End: line 1895 (after `totalRawScore()`, before VD data at 1896)
- Total: ~682 lines

**What stays inline (do NOT extract):**
`weightedScore`, `scoredCount`, `scoreColor`, `heatColor`, `fmt$`, `tier`, `tierBadge`, `logChange`

**New file:** `js/vendor_scoring.js`  
**Script tag placement:** after `js/vendors_module.js` tag (currently at line 5301)

---

## KNOWN BLOCKERS (Michael must act)

1. **Worker deploy**: Run `git pull && wrangler deploy` from Windows terminal to fix Parse Notes 400 error (model ID was fixed in code; worker not yet redeployed)
2. **Codex auth**: Create IP-unrestricted OpenAI API key at platform.openai.com/api-keys → write to `.claude/settings.local.json`

---

## PENDING DECOMP PACKETS

| Packet | Status | Note |
|---|---|---|
| P1 vendors_module.js | ✅ c345f23 | Done |
| P2 vendor_scoring.js | ⬜ Ready | Lines 1214-1895 in current index.html |
| P3 quotes_module.js | ⬜ Ready | Independent, search `// ── QUOTES ───` |
| P4 dashboard_module.js | ⬜ Ready | Independent |
| P5 mgmt_module.js | ⬜ Ready | Independent |
| P6 pipeline_module.js | ⬜ Ready | Independent |
| P7 repoutreach_module.js | ⬜ Ready | P1 done → prereq met |
| P8 settings_module.js | ⬜ Ready | Independent |
| P9 knowledge_module.js | ⬜ Ready | Independent |

