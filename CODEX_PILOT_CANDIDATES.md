# CODEX_PILOT_CANDIDATES.md

> Authored under **Safe Overnight Autonomy Mode** on 2026-05-10.
> Purpose: enumerate work the Codex pilot **could** be pointed at first, ranked by risk.
> **No Codex dispatch happens from this file.** This is preparation only.

## Selection criteria
A pilot candidate must be:
- **Read-only or near-read-only** (audit, summary, draft proposal — not direct production write).
- **Easily reversible** (any artifact lives in a doc, not in `index.html`).
- **Bounded** (clear input file set, clear output shape).
- **Verifiable by Michael in < 5 minutes** (so we can call it good or bad fast).

If a task fails any of those, it is NOT a pilot candidate.

---

## Tier 1 — read-only audits (lowest risk; recommended first 3)

### P1. Anthropic worker proxy review (vs. commit `2dca2a6`)
- **Input:** `worker/anthropic-proxy.js` + the four fetch sites in `index.html`.
- **Output:** markdown review listing concrete issues + suggested patches (NOT applied).
- **Why first:** the active bug (Parse Notes 400) is a focused integration boundary; ideal probe.
- **Verification:** Michael reads the review, picks 0–3 suggestions to action himself.

### P2. RLS posture audit on `sql/M01_rls_tightening.sql` + `sql/M02_core_schema.sql`
- **Input:** the two SQL files only.
- **Output:** markdown report of any policy that's loose (e.g., `USING (true)`, missing `WITH CHECK`, public anon writes).
- **Why:** RLS is the security floor; cheap second opinion has high upside.
- **Verification:** spot-check against Supabase dashboard.

### P3. `KPI_CATALOG.md` ↔ source-of-truth drift report
- **Input:** `KPI_CATALOG.md` + `sql/` + the existing `kpi-data-audit` skill description.
- **Output:** which KPIs lack a verifiable data source, ranked.
- **Why:** matches the existing `kpi-data-audit` skill's contract; safe overlap to validate.
- **Verification:** cross-reference 3 random rows.

## Tier 2 — draft proposals (moderate risk; Michael review required before any action)

### P4. `index.html` size split plan
- **Input:** `index.html` (717KB; trigger threshold 900KB) + `js/` directory.
- **Output:** a *plan document only* (e.g., `INDEX_HTML_SPLIT_PLAN.md`) describing which sections could move to `js/` modules and the load-order constraints. No code change.
- **Why:** the split is coming; staging the analysis early reduces panic when the trigger fires.
- **Verification:** Michael reads the plan; nothing yet executed.

### P5. Skill `_index.md` registry consistency check
- **Input:** every `skills/*/SKILL.md` frontmatter + `skills/_index.md`.
- **Output:** drift report (skills installed but not indexed; entries indexed but folder missing).
- **Why:** existing `vibe-speak` Step 23 depends on this index; cheap to verify.
- **Verification:** count match.

### P6. `BUILD_PLAN_CLAUDE.md` vs `SESSION_LOG.md` reconciliation
- **Input:** the two files.
- **Output:** items that look shipped per SESSION_LOG but still `[ ]` in BUILD_PLAN; or vice versa.
- **Why:** matches `build-plan-status` skill contract; quick correctness probe.
- **Verification:** spot-check 3 entries.

## Tier 3 — explicitly NOT pilot candidates yet

| Task | Why excluded |
|------|--------------|
| Worker redeploy / Parse Notes fix | Requires deploy access. Hard stop overnight + first pilot. |
| Any `M##` schema migration | Requires Supabase auth — Michael only. |
| `index.html` actual split | Production mutation; pilot must NOT do this until P4 plan is approved. |
| Quote Generator v2 follow-ups | Live user feature. Touch only with full verify cycle. |
| BigCommerce / Windward integration | External auth + production data. |
| Any auth, RLS, or password change | Security boundary. |

---

## Pilot-day plan (when Michael says go)
1. Run **P1** in dispatch mode — return review markdown only.
2. Michael reads, picks any apply-able items, hands them to a Claude session as a normal task.
3. If P1 quality is good, queue **P2** + **P3** in parallel (both read-only).
4. Hold all Tier 2 until Tier 1 has shown trustworthy output 3×.
5. Tier 3 stays excluded until policy explicitly opens it.

## Open questions (for the morning)
- Which Codex model + prompt frame? (Decision-log entry needed.)
- Where does Codex output land? (Suggest: `codex-out/` directory, gitignored, with explicit `git add` only after Michael review.)
- Token / cost ceiling per pilot run? (Decision-log entry needed.)

## Cross-references
- `skills/codex-review/SKILL.md` — existing local skill that already handles "Codex audit" semantics. Reuse, don't duplicate.
- `skills/community-skill-vet/SKILL.md` — same vetting pattern applies to Codex output before any apply.
