---
name: mtask-tracker
description: >
  Read-only governance skill for AccentOS that aggregates every BLOCKED-stub
  skill in `skills/` and maps it to the BUILD_PLAN_MICHAEL.md M-task IDs that
  gate it, then ranks M-tasks by leverage = (# skills unblocked × avg
  gap-optimizer composite score of those skills). Surfaces the unblock cadence,
  status (`[ ]`/`[x]`), and the recommended next M-task to close so Michael's
  unblock-time spends maximum downstream skill activation. Use this skill when
  Michael says: "what's blocking what", "what M-task should i knock out next",
  "which M-task unblocks the most", "what's blocked by me", "M-task status",
  "highest-leverage M-task", "/mtask", "if I do M04 what activates", or any
  phrasing that pairs an M-task ID with verbs unblock/block/knock-out across
  the AccentOS skill ecosystem. Distinct from
  bottleneck-finder (which is build-plan-wide TOC across Tracks + M-tasks);
  mtask-tracker is M-task-specific to the skill ecosystem only — it answers
  "if I do M04 next, what activates?" Always produces a ranked M-task table +
  per-skill stub status — never invents M-task IDs, never proposes BC/Klaviyo
  writes, never modifies BUILD_PLAN_MICHAEL.md. Read-only.
---

# mtask-tracker

**Purpose:** AccentOS has 7 skills shipping in BLOCKED stub mode pending Michael M-tasks (M03, M04, M06, M09, M10, action_queue schema, trade-vendor-portal heavy gate). Until now, "M## blocks skill X" lived scattered across each skill's Step 0 gate — nothing aggregates. This skill builds the aggregate map in one read-only pass and ranks M-tasks by *skills unblocked per M-task closure*, so Michael's unblock time spends max leverage.

Five phases in order: **scan-skills → cross-reference-build-plan → score-leverage → rank-and-output → log-cadence**. The output is always a ranked table + per-skill stub status. Nothing else writes.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "what's blocking what"
- "what M-task should i knock out next"
- "which M-task unblocks the most" / "highest-leverage M-task"
- "what's blocked by me" / "what's blocking you"
- "M-task status" / "show the M-task tracker"
- "/mtask" (slash invocation)
- "if I do M04 what unblocks" / "if I knock out M[NN] what activates"
- "unblock priority" / "what to unblock next"
- "todo list that were blocking you" / "what's on my unblock list"

Mine is calibrated for Michael's voice (lowercase, "knock out" hard-keep verb, "blocked by me" recurring phrase). Other invocations that should trigger: any sentence pairing an M-task ID (M03–M45) with verbs `unblock` / `block` / `gate` / `knock out` / `close`, OR any question of the shape "what X should I do" where X is `M-task`.

Also run **automatically**:
- When `gap-optimizer` is invoked — `mtask-tracker` output feeds buildability rescoring (Buildability ≤ 2 if any unresolved M-task blocks per `gap-optimizer/references/scoring-rubric.md`).
- When `daily-brief-composer` builds the Owner brief — surface the top-1 M-task in the brief's "next move" section.
- After a session-end commit if any BLOCKED skill's gate state has changed (e.g. M-task flipped to `[x]`).

---

## Scope

**In scope:**
- Skills with a Step 0 BLOCKED gate citing M-task IDs (currently: ga4-insights, gsc-insights, bc-rest-bridge, klaviyo-flows, windward-bridge, action-queue, trade-vendor-portal).
- M-tasks listed in `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` with `- [ ] **M[NN]**` headers.
- Composite leverage scoring using `gap-optimizer/candidate-queue.md` scores when present.

**Out of scope — fail fast with a one-line redirect:**
- Build-plan-wide TOC across Tracks and M-tasks → "Use `bottleneck-finder` — it covers Tracks + M-tasks together."
- Building or editing a skill → "Use `skill-forge`."
- Editing BUILD_PLAN_MICHAEL.md → "Read-only by design — Michael edits the plan, this skill only reads."
- Picking the next non-skill M-task to close → "Use `bottleneck-finder` for full plan-wide leverage; mtask-tracker is skill-ecosystem-only."

---

## Step 0 — Preflight

Read in parallel — abort fast if any required file is missing:

1. **Skill ecosystem state:**
   - `ls /home/user/accent-os/skills/` — enumerate every skill directory.
   - For each skill dir, read `SKILL.md` (target: Step 0 BLOCKED-gate text).
2. **Build plan state:**
   - `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — full file, parse `- [ ]` and `- [x]` rows for `**M[NN]**` markers.
3. **Optimizer score feed:**
   - `/home/user/accent-os/skills/gap-optimizer/candidate-queue.md` — pull composite scores per skill if present (used in leverage formula).
4. **Cadence reference:**
   - `/home/user/accent-os/skills/gap-optimizer/gap-log.md` — read last 2 entries for prior `Stub-mode inventory` table. Diff vs. current scan to surface "M## flipped since last gap-run-NNN".

**Failure paths:**
- If `BUILD_PLAN_MICHAEL.md` is missing or unreadable → abort with "BUILD_PLAN_MICHAEL.md missing — cannot resolve M-task titles. Restore from git or stop." Do NOT fall back to inferred titles — empty table is wrong, partial table is worse.
- If `skills/_index.md` cannot be read → fall back to filesystem scan only; surface "skills/_index.md unavailable — using filesystem scan only" in the report header.
- If `gap-optimizer/candidate-queue.md` is missing → leverage column shows count-only (no avg-score multiplier); surface "gap-optimizer queue absent — leverage = unblock count only" warning. Do not invent scores.

**Output of Step 0:** one-line preflight note: "Scanned N skills, M BLOCKED, K M-tasks gating — proceeding."

---

## Step 1 — Scan skills for BLOCKED gates

For every skill in `/home/user/accent-os/skills/[name]/SKILL.md`, run:

1. Search for these patterns in Step 0 / Preflight section (case-insensitive):
   - `BLOCKED on M[0-9]{2}` (e.g. "BLOCKED on M04")
   - `M[0-9]{2}-blocked` (e.g. "M09-blocked")
   - `gated on \*\*M[0-9]{2}` (frontmatter style)
   - `Blocked by: M[0-9]{2}` (gap-optimizer queue style)
   - `BLOCKED on schema` or `gated on the.*table` (schema-task variant)
2. For each skill that matches, extract:
   - All M-task IDs cited (canonical regex: `M[0-9]{2}`, normalize to two digits).
   - Schema-task IDs (e.g. `action_queue` table existence) — treat as a virtual M-task labeled `SCHEMA:action_queue`.
   - Soft-blocker vs. hard-blocker classification: hard if Step 0 returns the stub on missing dep; soft if skill notes the M-task but proceeds without it (e.g. trade-vendor-portal soft-blockers).
3. Also check `references/blocking-m-tasks.md` if present (canonical M-task list — trade-vendor-portal pattern). When the reference file exists, prefer its hard/soft classification over inferring from Step 0 text.
4. Build the per-skill record:

```
skill: [name]
  status: BLOCKED | LIVE
  hard_blockers: [M03, M10]
  soft_blockers: [M09, M12]
  gate_text_excerpt: "...gated on M03 + M10 (Windward read access)..."
```

**Failure path — false positives:** If a skill mentions `M04` only in a code comment or example (not in Step 0 / frontmatter / `Blocked by:`), do NOT classify as blocked. Confirm by checking that the skill returns a stub message in the matched section. If ambiguous, mark `status: AMBIGUOUS` and surface in the report.

**Failure path — false negatives (malformed gates):** If a skill's Step 0 cites a literal `Mxx` placeholder, an out-of-range ID (e.g. `M99` when BUILD_PLAN_MICHAEL.md tops out at M45), or any non-canonical pattern that's clearly *intent to gate but malformed*, mark `status: SUSPECT` and surface in BLOCK 0. False-negatives (treating a stub-mode skill as LIVE) are more dangerous than false-positives — Michael will close M-tasks expecting activation that doesn't happen.

**Failure path — partial output on parse error:** If 1+ SKILL.md fails to parse (malformed frontmatter, file empty, encoding error), continue the scan and emit a `parse_errors: [list]` block in the report. Never silently skip — Michael must know which skills weren't checked.

**Failure path — newly-forged skill not yet in `_index.md`:** If a skill directory exists in `skills/` but `_index.md` does not list it, still scan its SKILL.md (filesystem is authoritative). Surface "skill X not in _index.md — scanned anyway; recommend `/vibe regenerate skill index` after this run" in BLOCK 0.

---

## Step 2 — Cross-reference BUILD_PLAN_MICHAEL.md

For each M-task ID surfaced in Step 1:

1. Locate the matching `- [ ] **M[NN]**` or `- [x] **M[NN]**` row in `BUILD_PLAN_MICHAEL.md`.
2. Extract: title (the line content after `**M[NN]** —`), status (`[ ]` open / `[x]` done), unblock-action summary (the `Action:` block), `Then: paste to Claude →` confirmation phrasing.
3. For schema-task virtual M-tasks (e.g. `SCHEMA:action_queue`): cross-reference `references/proposed-schema.md` in the relevant skill (e.g. `skills/action-queue/references/proposed-schema.md`) — if absent, mark `unblock_action: "schema DDL TBD — see skill's references/"`.

**Failure path — M-task referenced but not in plan:** If a skill cites an M-task ID that does not appear in BUILD_PLAN_MICHAEL.md (typo, deleted task, or future task), mark `status: ORPHAN` and surface in the report header as "skill X cites M[NN] which is not in BUILD_PLAN_MICHAEL.md — verify". Do NOT fabricate a title.

Build the per-M-task record:

```
M[NN]: [title]
  status: open | done
  unblocks_skills: [ga4-insights, gsc-insights]
  unblock_action_summary: [one-line]
  paste_to_claude: "M[NN] done — ..."
```

---

## Step 3 — Compute leverage

For each open M-task:

```
direct_unblock_count = count of skills where this M-task is a hard_blocker
soft_assist_count    = count of skills where this M-task is a soft_blocker (weight 0.25)
avg_skill_score      = mean(gap_optimizer composite score of unblocked skills)
                       — fall back to 30.0 (median of run-002 queue) if score absent
leverage             = (direct_unblock_count × avg_skill_score) + (soft_assist_count × 0.25 × avg_skill_score)
```

**Schema-task leverage:** schema M-tasks (e.g. `SCHEMA:action_queue`) score on the same formula. The `action_queue` schema unblocks `action-queue` directly and every 1-hop executor skill that routes through it (per `references/leverage-formula.md` cascade rule, capped at 1 hop — see anti-pattern below for why).

**Multi-hop unblock cascade:** If skill A unblocks (M-task done) and skill A is a hard dependency of skill B (e.g. action-queue is upstream of bc-rest-bridge's executor path), then closing the M-task that gates A is credited 0.5× the leverage of skill B as well. Cap at one hop to avoid exponential explosion.

Record the cascade attribution in the per-M-task block:

```
M[NN]
  direct: [skill-a, skill-b]
  cascade (1-hop): [skill-c via skill-a]
  leverage_raw: 60.0
  leverage_with_cascade: 75.0
```

**Failure path — gap-optimizer queue missing:** If queue scores aren't available, fall back to `leverage = direct_unblock_count` (count only). Surface "leverage = count-only mode — re-run after `/gap` for score-weighted ranking" in the report.

**Failure path — compounded missing inputs:** If BOTH `candidate-queue.md` AND `executor-registry.md` are missing, the leverage table degrades to pure count-only with no cascade. Surface in BLOCK 0 a single combined warning: "leverage = count-only mode + cascade zeroed — both gap-optimizer queue and executor-registry are missing. Output is preliminary; re-run after restoring at least one signal." Do not refuse to emit — count-only ranking is still useful for relative ordering.

**Failure path — concurrent run vs. mid-edit BUILD_PLAN:** If `BUILD_PLAN_MICHAEL.md` was modified within the last 30 seconds (`stat` mtime), the file is likely mid-edit. Surface "BUILD_PLAN_MICHAEL.md modified <30s ago — output may be stale; re-run if Michael just edited it" in BLOCK 0. Do not block — emit the report with the warning.

---

## Step 4 — Rank and recommend

Sort M-tasks descending by `leverage_with_cascade`. Top 5 form the priority queue.

For each top-5, classify recommended-next-action:
- **DO NEXT** — leverage > 50, low effort (per BUILD_PLAN_MICHAEL Action block), no upstream deps. Recommend Michael close this M-task next session.
- **DO SOON** — leverage 20–50 OR has small upstream dep (e.g. M10 needs M03 first). Sequence after DO NEXT items.
- **HOLD** — leverage < 20 OR external blocker not in Michael's control (vendor reply pending). Note as awaiting external trigger.
- **DEPENDENT** — M-task is itself blocked on another M-task (e.g. M10 depends on M03). Show the dep chain.

---

## Step 5 — Output

Always emit four blocks. Tables sorted by leverage descending:

```
═══ BLOCK 1: STUB-MODE SKILL INVENTORY ═══
| Skill | Status | Hard blockers | Soft blockers |
|---|---|---|---|
| ga4-insights | BLOCKED | M06 | — |
| gsc-insights | BLOCKED | M06 | — |
| bc-rest-bridge | BLOCKED | M04 | — |
| klaviyo-flows | BLOCKED | M09 | — |
| windward-bridge | BLOCKED | M03, M10 | — |
| action-queue | BLOCKED | SCHEMA:action_queue | — |
| trade-vendor-portal | BLOCKED | M03, M04, M11, M24, M40 | M09, M10, M12, M18 |

═══ BLOCK 2: M-TASK LEVERAGE RANK ═══
| Rank | M-task | Title | Status | # skills unblocked | Cascade | Leverage | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | M04 | BigCommerce API credentials | [ ] | 2 | +trade-vendor-portal partial | 95.0 | DO NEXT |
| 2 | M06 | GA4 + GSC service account | [ ] | 2 | — | 80.0 | DO NEXT |
| 3 | SCHEMA:action_queue | action_queue table | [ ] | 1 | +5 executor skills 0.5× | 75.0 | DO NEXT |
| 4 | M03 | Windward written confirmation | [ ] | 1 | unlocks M10 | 45.0 | DO SOON |
| 5 | M09 | Klaviyo API key | [ ] | 1 | — | 40.0 | DO SOON |

═══ BLOCK 3: TOP RECOMMENDATION (DO NEXT) ═══
M04 — BigCommerce API credentials (rank 1, leverage 95.0)
  Direct unblocks: bc-rest-bridge, trade-vendor-portal (Trade portal subset)
  Cascade: enables action-queue's update_bc_product executor path; coop-claim-drafter execution surface
  Unblock action: per BUILD_PLAN_MICHAEL.md M04 — create BC API token with write scope at
    BigCommerce store-cwqiwcjxes admin → API Accounts → Create Account.
  Estimated effort: 30 min Michael time
  Confirmation phrase: "M04 done — BC write token in. bc-rest-bridge unblocked."

═══ BLOCK 4: CADENCE + DRIFT ═══
- Last gap-run: gap-run-002 (2026-05-08) — stub-mode inventory size: 7
- Current stub-mode inventory size: [N]
- Flipped since last run: [list of M-tasks that moved [ ] → [x] OR new BLOCKED skills]
- Recommendation: [run /gap to refresh queue if drift > 0]
```

**Partial-output mode:** If Step 1 surfaces parse errors / SUSPECT gates / orphan M-task references OR Step 3 falls back to count-only / cascade-zeroed leverage OR BUILD_PLAN_MICHAEL.md was edited <30s ago, prepend a `═══ BLOCK 0: WARNINGS ═══` block listing each issue with the affected skill or M-task. Never suppress warnings — incomplete leverage rankings without warnings mislead Michael into closing low-value M-tasks.

Block 0 schema:

```
═══ BLOCK 0: WARNINGS ═══
- [warning_class]: [affected entity] — [one-line consequence]
  Example: parse_error: skills/foo-skill/SKILL.md — frontmatter unreadable; skipped from scan.
  Example: count_only_leverage: gap-optimizer/candidate-queue.md missing — ranks may invert vs. score-weighted.
  Example: orphan_mtask: skill-x cites M99 — not in BUILD_PLAN_MICHAEL.md.
```

**Empty-output mode:** If 0 skills are BLOCKED (all M-tasks resolved), emit:

```
═══ BLOCK 1: STUB-MODE SKILL INVENTORY ═══
No skills currently in BLOCKED stub mode.

═══ BLOCK 2: M-TASK LEVERAGE RANK ═══
No M-tasks gating the skill ecosystem. Run /gap to surface vision-driven gaps.
```

Do not fabricate a leverage table from zero data.

---

## Step 6 — Hand-off

After emitting BLOCK 4, surface one-liners for downstream skills as relevant:

- If `gap-optimizer` queue is older than 14 days → "gap-optimizer queue stale — run `/gap` to refresh, then re-run `/mtask` to re-score with fresh composite scores."
- If `daily-brief-composer` Owner section is being assembled → emit the top-1 M-task as a single line: "Top M-task: M[NN] ([title]) — [N] skills unblocked, [leverage]."
- If `bottleneck-finder` was invoked in the same session → note that bottleneck-finder covers Tracks too; cross-reference its leverage rank with this skill's M-task-only rank to spot which M-task is also a Track bottleneck.

This skill writes nothing. The output is the contract.

---

## Output format

See Step 5 for the four-block format. Quick-reference structure:

| Block | Content |
|---|---|
| BLOCK 0 (optional) | Warnings — parse errors, orphans, fallback-mode notes |
| BLOCK 1 | Per-skill stub-mode inventory table |
| BLOCK 2 | M-task leverage rank table (top 5) |
| BLOCK 3 | DO NEXT recommendation detail block |
| BLOCK 4 | Cadence + drift since last gap-run |

All tables Markdown — paste-ready into SESSION_LOG.md or daily brief.

---

## AccentOS context

- **Stack:** Read-only — no Supabase writes, no BigCommerce calls, no Anthropic API spend. Pure file scan.
- **Project:** AccentOS (Accent Lighting internal operating system). Skill ecosystem currently 45 skills, 7 BLOCKED stub mode.
- **Paths:** `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`).
- **Source files (read-only):**
  - `/home/user/accent-os/skills/*/SKILL.md` — Step 0 BLOCKED gate text
  - `/home/user/accent-os/BUILD_PLAN_MICHAEL.md` — M-task titles + status
  - `/home/user/accent-os/skills/gap-optimizer/candidate-queue.md` — composite scores
  - `/home/user/accent-os/skills/gap-optimizer/gap-log.md` — prior cadence
- **Reference data:** `references/m-task-glossary.md` (canonical M-task ID → title map, mirrors BUILD_PLAN_MICHAEL.md so the skill works even when the build plan is being edited mid-scan).
- **Companion skills:**
  - `gap-optimizer` (consumer — uses output for Buildability ≤ 2 rescoring)
  - `bottleneck-finder` (overlapping but plan-wide; this skill is skill-ecosystem-only)
  - `build-plan-status` (sync checker — flips `[ ]` → `[x]` when commits land)
  - `daily-brief-composer` (surfaces top-1 M-task in Owner brief)
  - `skill-health-monitor` (audits skills for broken refs; mtask-tracker assumes Step 0 gates parse cleanly)

---

## Anti-patterns

- **Never** modify `BUILD_PLAN_MICHAEL.md`. Read-only by design — Michael edits the plan; this skill only reports against it.
- **Never** invent M-task IDs or titles. If a skill cites `M[NN]` not in BUILD_PLAN_MICHAEL, surface as ORPHAN — do not fabricate a label.
- **Never** silently fall back to count-only leverage without a BLOCK 0 warning. Score-weighted leverage missing is a meaningful gap, not a default.
- **Never** classify a skill as BLOCKED based on a single M-task mention in a code comment or example. Step 0 gate text + frontmatter `description` are the only authoritative blocked-state signals.
- **Never** propose closing an M-task that depends on another open M-task without surfacing the dependency chain (e.g. M10 needs M03). DEPENDENT classification is mandatory.
- **Never** skip Step 6 hand-offs when running inside a `/gap` or daily-brief composition flow — downstream consumers expect the structured one-liners.
- **Never** emit BLOCK 2 without Block 1 — the leverage table is meaningless without the stub inventory it scored against.
- **Never** include LIVE skills in BLOCK 1. Stub-mode inventory is BLOCKED-only; mixing in active skills inflates the table and dilutes signal.
- **Never** rerun more than once per session unless the skill ecosystem changed (new SKILL.md committed) or BUILD_PLAN_MICHAEL.md was edited. The output is deterministic for the same input set.
- **Never** treat a SUSPECT gate (malformed M-task ID like literal `Mxx` or out-of-range `M99`) as LIVE. False-negatives are worse than false-positives — surface as SUSPECT, never silently classify as LIVE.
- **Never** emit BLOCK 2 leverage rankings without BLOCK 0 warnings when fallbacks fired. A count-only or cascade-zeroed leverage table that looks score-weighted is the worst output mode.
