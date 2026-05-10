# WORK IN PROGRESS

**Branch:** claude/setup-codex-integration-gMAyH  
**Last commit:** 5168e6d — refactor(decomp/P2): extract vendor_scoring module  
**Updated:** 2026-05-10

---

## ✅ COMPLETED

| Packet | Commit | Lines Removed | index.html After |
|---|---|---|---|
| P1 vendors_module.js | c345f23 | 1,843 | 5,333 |
| P2 vendor_scoring.js | 5168e6d | 682 | 4,652 |

---

## CURRENT SECTION MAP (post-P2 index.html = 4,652 lines)

| Lines | Section | Packet |
|---|---|---|
| 1–1213 | AUTH, NAV, UTILS, SUPABASE_CORE, VENDOR_SCORE_STATES (stays inline) | — |
| 1214–1671 | [extracted by P2] → gap/renumbered | — |
| 1672–2240 | REP OUTREACH EMAIL GENERATOR + repoutreach() page | P7 |
| 2241–2502 | renderChangelog, revertChange, openVP, CSV export/import, changelog page | (inline — P1 overflow) |
| 2503–2851 | PIPELINE | P6 |
| 2852–3382 | QUOTES | P3 |
| 3383–3462 | KNOWLEDGE ENGINE | P9 |
| 3463–3946 | DASHBOARD | P4 |
| 3947–3969 | MARKETING, ROADMAP (stays inline — page stubs) | — |
| 3970–4437 | MGMT | P5 |
| 4438–4583 | SETTINGS | P8 |
| 4584–4652 | HELPERS, BOOT, script tags, HTML tail | — |

---

## ⬜ NEXT: DECOMP_P3_QUOTES (recommended) or any of P4–P9

**P3 — quotes_module.js**
- Range: lines 2852–3382 in current index.html
- Start marker: `// ══════════════════════════════════════════════════════════` (line 2852)
- End: line 3382 (before `// ══...KNOWLEDGE ENGINE` at 3382)
- Actually: start of QUOTES block = line 2852; end = line 3382 (last ══ before KNOWLEDGE)
- Lines: ~531

**P4 — dashboard_module.js**: lines 3463–3969 (~507 lines), starts `// ── DASHBOARD`
**P5 — mgmt_module.js**: lines 3970–4437 (~468 lines), starts `// ── MGMT`
**P6 — pipeline_module.js**: lines 2503–2851 (~349 lines), starts `// ══...PIPELINE`
**P7 — repoutreach_module.js**: lines 1672–2240 (~569 lines), starts `// ── REP OUTREACH EMAIL GENERATOR`
**P8 — settings_module.js**: lines 4438–4583 (~146 lines), starts `// ── SETTINGS`
**P9 — knowledge_module.js**: lines 3383–3462 (~80 lines), starts `// ── KNOWLEDGE ENGINE`

All independent of each other (all mutate index.html, so serial only).

---

## KNOWN BLOCKERS (Michael must act)

1. **Worker deploy**: Run `git pull && wrangler deploy` from Windows terminal
2. **Codex auth**: Create IP-unrestricted OpenAI key at platform.openai.com/api-keys

