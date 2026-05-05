# skill-forge gotcha log

Self-optimization journal. Every skill-forge run reads this file at Step 0 and applies all prevention rules. New gotchas are appended at Step 8.

## How to use this file

**Read (Step 0):** Apply every `prevention_rule` listed below as a constraint on this run.

**Write (Step 8):** Append a new entry only when something non-trivial happened. Clean runs write nothing.

**Self-optimize:** When the same `prevention_rule` line (exact string match) appears in ≥2 entries with `applied_to_skill_md: no` AND no entry in that group has a `proposal_surfaced` date within the last 7 days, the run report proposes an Edit to `SKILL.md` that bakes the rule into a step. Do not auto-edit — surface the proposal so Michael can approve. Set `proposal_surfaced: YYYY-MM-DD` on the matching entries when the proposal is surfaced. After the edit lands, set `applied_to_skill_md: yes`.

## Entry schema

```
### gotcha-NNN — YYYY-MM-DD — [target name]
- target: [full target identifier]
- what_happened: [one sentence]
- root_cause: [one sentence]
- fix_this_run: [what was done in-flight]
- prevention_rule: [single normalized sentence — same wording for same problem class]
- applied_to_skill_md: yes | no
- outcome: success | aborted_to_watch | validation_retry
- proposal_surfaced: [YYYY-MM-DD; omit until self-optimize fires]
```

NNN is sequential and zero-padded to 3 digits.

---

## Seed entries (from initial stress test, 2026-05-05)

These are gotchas surfaced during the very first stress-test of skill-forge. All are already addressed in SKILL.md.

### gotcha-001 — 2026-05-05 — Cascade (alirezarezvani/c-level-advisor)
- target: alirezarezvani/claude-skills strategic-alignment skill
- what_happened: Step 4 returned KEEP < 3 because the literal "board reporting" framing failed AccentOS fit; the cascade *pattern* (org goal → IC metric → orphan detection) was the actual reusable value.
- root_cause: Skill treated target as monolithic product, not as a pattern that can be re-framed.
- fix_this_run: Added Step 1.5 "Pattern vs. product check" — retry once with target re-framed as underlying pattern before aborting to WATCH.
- prevention_rule: When KEEP < 3, retry once with target re-framed as underlying pattern before aborting to WATCH.
- applied_to_skill_md: yes
- outcome: success

### gotcha-002 — 2026-05-05 — Cascade (alirezarezvani/c-level-advisor)
- target: alirezarezvani/claude-skills c-level-advisor pack
- what_happened: Step 2 instructed harvesting from "primary repo README" but the pack contained 28 separate SKILL.md files, each with distinct concepts. Pack-level README under-represented the surface.
- root_cause: Step 2 didn't distinguish single-skill targets from multi-skill pack targets.
- fix_this_run: Added explicit pack-detection clause to Step 2 GitHub layer: enumerate every sub-skill folder when >3 SKILL.md files exist.
- prevention_rule: Multi-skill pack targets require enumerating every sub-skill SKILL.md, not just the pack-level README.
- applied_to_skill_md: yes
- outcome: success

### gotcha-003 — 2026-05-05 — (meta — applies to all targets)
- target: skill-forge itself
- what_happened: Step 5 generated trigger phrases from imagination; produced phrases that don't match Michael's actual conversational style.
- root_cause: No source for "how Michael actually talks." Trigger phrases drove from generic skill conventions.
- fix_this_run: Added Step 0 phrasing-mining from PROMPT_LOG.md and SESSION_LOG.md so Step 5 has Michael's real phrasing to draw from.
- prevention_rule: Trigger phrases must be sourced from PROMPT_LOG.md / SESSION_LOG.md when present, not invented.
- applied_to_skill_md: yes
- outcome: success

### gotcha-004 — 2026-05-05 — (meta)
- target: skill-forge itself
- what_happened: Step 6 wrote files with no validation gate; risk of malformed YAML, name collision with existing skill, or unfilled `[bracket]` placeholders shipping to commit.
- root_cause: No pre-commit checklist.
- fix_this_run: Added Step 6.5 with a 5-point validation gate.
- prevention_rule: Every forged SKILL.md must pass a 5-point validation gate (YAML, name uniqueness, ≥3 AccentOS substitutions, anti-patterns ≥3, no prose walls) before commit.
- applied_to_skill_md: yes
- outcome: success

### gotcha-005 — 2026-05-05 — (meta)
- target: skill-forge itself
- what_happened: Step 4 hard-referenced repo-scout/references/project-profiles.md as the only source of AccentOS gaps; deletion or rename of repo-scout would silently break skill-forge.
- root_cause: Single point of failure on a sibling skill.
- fix_this_run: Added Step 0 fallback chain: project-profiles.md → BUILD_PLAN_CLAUDE.md → MASTER.md.
- prevention_rule: Cross-skill references require a fallback chain to AccentOS root docs.
- applied_to_skill_md: yes
- outcome: success

### gotcha-006 — 2026-05-05 — (meta)
- target: skill-forge itself
- what_happened: Step 7 said "active feature branch" without verifying; if Claude landed on main, the skill would commit and push to main directly.
- root_cause: No branch-state check.
- fix_this_run: Added branch capture in Step 0 + branch-creation fallback in Step 7.
- prevention_rule: Branch state must be verified in preflight; pushes to main require explicit permission.
- applied_to_skill_md: yes
- outcome: success

### gotcha-007 — 2026-05-05 — (meta)
- target: skill-forge itself
- what_happened: No mechanism existed for the skill to learn from prior runs; same mistakes would repeat.
- root_cause: Skills are stateless by default unless given persistent state.
- fix_this_run: Created this gotcha-log.md; added Step 0 read + Step 8 write + self-optimize threshold.
- prevention_rule: Skills with execution variance need a gotcha-log read at preflight and write at completion.
- applied_to_skill_md: yes
- outcome: success

### gotcha-008 — 2026-05-05 — (meta)
- target: skill-forge itself
- what_happened: Edge cases (no target named, internal target, "build a skill from my workflow") would silently produce malformed runs.
- root_cause: No explicit out-of-scope handling.
- fix_this_run: Added Scope section with three named out-of-scope cases and one-line redirects.
- prevention_rule: Out-of-scope inputs must fail fast with a one-line redirect, not silently degrade.
- applied_to_skill_md: yes
- outcome: success

---

## Live entries (post-seed)

### gotcha-009 — 2026-05-05 — (meta, iteration 2)
- target: skill-forge itself
- what_happened: Step 0 phrasing-mine had no explicit handling for empty/missing PROMPT_LOG.md or SESSION_LOG.md.
- root_cause: Optional sources weren't marked as silently skippable.
- fix_this_run: Tightened Step 0.3 to "skip silently and fall back to existing skill descriptions for tone."
- prevention_rule: Optional input sources must be tagged silently-skippable when absent.
- applied_to_skill_md: yes
- outcome: success

### gotcha-010 — 2026-05-05 — (meta, iteration 2)
- target: skill-forge itself
- what_happened: Step 6.5 substitution count required terms like "Accent Lighting" that wouldn't naturally appear in stack-only skills (e.g. a Supabase-RLS skill).
- root_cause: Substitution allowlist was too narrow.
- fix_this_run: Expanded allowlist to include vendor_scores, vendor_overrides, Feedenomics, Cloudflare Pages, Anthropic API, BigCommerce, Supabase, GMC, Klaviyo, plus repo paths.
- prevention_rule: Substitution allowlist must cover the full AccentOS stack, not just project names.
- applied_to_skill_md: yes
- outcome: success

### gotcha-011 — 2026-05-05 — (meta, iteration 2)
- target: skill-forge itself
- what_happened: Self-optimize trigger had no debounce; once a prevention_rule recurred, every subsequent run would re-propose the same Edit until applied.
- root_cause: No "proposal already surfaced" state on entries.
- fix_this_run: Added `proposal_surfaced` date field with 7-day debounce.
- prevention_rule: Self-optimize proposals require a debounce mechanism to avoid re-proposing on every run.
- applied_to_skill_md: yes
- outcome: success

### gotcha-012 — 2026-05-05 — (meta, iteration 2)
- target: skill-forge itself
- what_happened: Step 6.5 validated SKILL.md output but not the gotcha-log entry being appended; schema drift in the log was possible.
- root_cause: Gotcha-log integrity wasn't part of the pre-commit gate.
- fix_this_run: Added validation point #6 to Step 6.5 covering gotcha-log entry conformance.
- prevention_rule: Pre-commit validation must cover all artifacts being written, not just the SKILL.md.
- applied_to_skill_md: yes
- outcome: success

### gotcha-013 — 2026-05-05 — (meta, iteration 3)
- target: skill-forge itself
- what_happened: Step 6.5 validation point #6 said "all 7 fields" but the schema actually has 8 fields (with optional `proposal_surfaced`); ambiguous validator could fail valid entries.
- root_cause: Required vs. optional field counts weren't separated.
- fix_this_run: Rewrote validation point #6 to enumerate the 7 required fields explicitly and call out `proposal_surfaced` as the optional 8th.
- prevention_rule: Schema validators must enumerate required fields explicitly and mark optional fields separately.
- applied_to_skill_md: yes
- outcome: success

### gotcha-014 — 2026-05-05 — (meta, iteration 3)
- target: skill-forge itself
- what_happened: Step 0 said "abort the commit step until feature branch exists" while Step 7 said "If on main, create branch first" — contradictory framing on whether main triggers abort or auto-create.
- root_cause: Two steps owned overlapping logic with different verbs.
- fix_this_run: Step 0 now only captures branch state; Step 7 owns the auto-create-on-main behavior.
- prevention_rule: Conditional logic must live in one step only — capture state early, act on state late.
- applied_to_skill_md: yes
- outcome: success

### gotcha-015 — 2026-05-05 — (meta, iteration 3)
- target: skill-forge itself
- what_happened: Step 5 mandated description ≥250 chars and AccentOS/Accent Lighting mention but Step 6.5 didn't validate either constraint, so a malformed description could ship.
- root_cause: Design constraints in Step 5 weren't echoed in the Step 6.5 validation gate.
- fix_this_run: Expanded Step 6.5 validation point #1 to check description length and AccentOS/Accent Lighting presence.
- prevention_rule: Every design constraint stated in Step 5 must have a corresponding check in Step 6.5.
- applied_to_skill_md: yes
- outcome: success

### gotcha-016 — 2026-05-05 — Cascade (live shakedown forging vendor-cascade)
- target: alirezarezvani/claude-skills strategic-alignment
- what_happened: Step 6.5 #1 bracket-check flagged 5 legitimate runtime-substitution markers inside fenced code blocks (e.g. `[metric name]` inside an output template) as if they were unfilled SKILL.md placeholders.
- root_cause: Validator regex matched `[bracketed]` strings everywhere; didn't distinguish text outside fenced blocks (real placeholders) from template markers inside them (intentional).
- fix_this_run: Manually verified all 5 hits were inside ``` fences and accepted the SKILL.md as valid. No file change.
- prevention_rule: Bracket-placeholder check in Step 6.5 must scope only to text outside fenced code blocks.
- applied_to_skill_md: yes
- outcome: success

### gotcha-017 — 2026-05-05 — Cascade (live shakedown)
- target: alirezarezvani/claude-skills strategic-alignment
- what_happened: WebFetch on millitool.com and alirezarezvani.github.io both returned 403; two of the planned Step 2 sources were inaccessible.
- root_cause: Some hosts block direct fetch but their content surfaces in search engine snippets.
- fix_this_run: Pivoted to WebSearch with quoted SKILL.md filename + concept terms; aggregated content recovered the same concept set.
- prevention_rule: When WebFetch returns 403/404 on a planned source, fall back to WebSearch with quoted filename and extracted-content keywords before logging the source as empty.
- applied_to_skill_md: yes
- outcome: success

### gotcha-018 — 2026-05-05 — Hex (hex.tech)
- target: hex.tech — collaborative AI data analytics SaaS
- what_happened: Step 1.5 re-frame raised KEEP from 1 to 3, but every re-framed KEEP was already covered by an existing skill (skill-forge + vendor-cascade) or by Claude Code's native conversational SQL. Forge correctly aborted to WATCH.
- root_cause: Targets in adjacent SaaS categories often overlap heavily with what Claude Code itself already provides; concepts that "look like gaps" actually aren't.
- fix_this_run: Aborted to WATCH per Step 4 decision gate. No skill written. Logged here for future targets.
- prevention_rule: When re-framed KEEPs duplicate capabilities already provided by Claude Code or by existing skills in skills/, treat them as covered (not gaps) and abort to WATCH rather than forge a redundant skill.
- applied_to_skill_md: no — SUPERSEDED by gotcha-019
- outcome: aborted_to_watch

### gotcha-019 — 2026-05-05 — (recalibration; supersedes gotcha-018)
- target: skill-forge itself
- what_happened: Michael flagged that the gap-analysis framing was wrong. Step 4 was filtering OUT concepts that overlapped existing capabilities, when the correct framing is "steal the concept, rebuild it in AccentOS-native voice." This caused both Cascade and Hex runs to under-deliver — Cascade produced 1 skill when it could have produced 2-3, Hex aborted to WATCH when it had 3 stealable concepts.
- root_cause: Step 4 was scoped as a gap analysis (does AccentOS have a hole this fills?) when it should be a concept-theft assessment (is this concept worth rebuilding in my voice?). Default outcome was "abort to WATCH" when it should be "produce 1-5 skills."
- fix_this_run: Rewrote Step 4 as "Concept theft assessment." STEAL/DROP/ADD replaces KEEP/DROP/ADD. Default deliverable changed to 1-5 skills per target. WATCH abort now requires STEAL=0 (rare). Step 5 marked explicitly as per-skill iteration. Step 7 commits all skills under one branch per forge run.
- prevention_rule: Step 4 default outcome is "produce N skills from the concept inventory." WATCH is only for genuinely empty targets. Overlap with existing capability is not disqualifying — rebuilding a tighter, AccentOS-native version is the point of the skill.
- applied_to_skill_md: yes
- outcome: success

### gotcha-020 — 2026-05-05 — Cascade + Hex re-run under recalibrated framing
- target: alirezarezvani/strategic-alignment + hex.tech
- what_happened: Step 6.5 #1 bracket-check (post-gotcha-016) flagged 9/11/8 bracket strings across the 3 forged skills. All hits were inside double-quoted trigger phrase examples (e.g. "articulate [priority]") in the trigger list — intentional template markers, not forgotten placeholders. Validator was over-broad even after the first refinement.
- root_cause: gotcha-016 fix exempted bracket strings inside fenced code blocks but did not exempt them inside double-quoted strings or markdown list items used as trigger-phrase examples.
- fix_this_run: Manual inspection confirmed all 28 hits were intentional. Skills shipped. No file change to skill-forge SKILL.md this run.
- prevention_rule: Bracket-placeholder check must also exempt brackets inside double-quoted strings (e.g. trigger-phrase examples) and inline backtick code, in addition to fenced code blocks.
- applied_to_skill_md: no
- outcome: success

### gotcha-021 — 2026-05-05 — (workflow recalibration: approval gate + Ralph loop)
- target: skill-forge itself
- what_happened: Even after gotcha-019's concept-theft recalibration, skill-forge was still over-shipping — producing 3 skills in one shot without Michael approving each one individually, and with no per-skill stress test before commit. Michael flagged that the proper flow is: exhaustive concept extraction → gap analysis → brief proposal per candidate → Michael approves each → build only approved → Ralph loop until happy → ship.
- root_cause: Step 4 produced a STEAL list that flowed directly into Step 5 (build), with no human-in-the-loop gate and no iterative stress test. The skill assumed AI judgment is sufficient — but Michael's intent is "I approve each, you recommend, then you build, then you Ralph-loop."
- fix_this_run: Restructured workflow to 10 steps. Step 2 now mandates exhaustive feature-by-feature extraction (≥15 concepts target). Step 4 produces a candidate list, NOT a build manifest. NEW Step 5 is a proposal block per candidate with my recommendation (BUILD/DEFER/SKIP) and an explicit halt-and-await-approval gate. Steps 6/7/7.5 (was 5/6/6.5) only run on approved candidates. NEW Step 8 is the Ralph loop — per-skill stress test with iteration cap of 4. Steps 9/10 (was 7/8) renumbered.
- prevention_rule: Step 4 produces candidates, not skills. Step 5 halts the run for Michael's per-skill approval. Step 8 Ralph-loops every approved skill before commit. No exceptions.
- applied_to_skill_md: yes
- outcome: success

### gotcha-022 — 2026-05-05 — Cascade + Hex batch (5-skill forge run under new workflow)
- target: alirezarezvani/strategic-alignment + hex.tech (concept theft, second pass)
- what_happened: First end-to-end run of skill-forge under the approval-gate + Ralph-loop workflow. Forged 5 skills (doc-drift, vendor-clarity-test, decision-log, vendor-risk-register, table-eda); deferred 3 to future-builds.md (vendor-rebalance, multi-step-analysis, chart-from-query). Michael ambiguity on count (5 vs 6 BUILD recs); first attempt asked for clarification, second turn auto-resolved by dropping chart-from-query as lowest-urgency. Ralph loop surfaced 15 real fixes across the 5 skills (mostly SQL-correctness and prereq-redirect patterns).
- root_cause: New workflow's first run; no prior run to validate against. Approval-gate ambiguity surfaced because my own gate header miscounted (5) before the corrected list (6).
- fix_this_run: Resolved ambiguity by Claude-pick of lowest-urgency BUILD candidate after Michael repeated his "5" instruction. Logged the dropped skill to future-builds.md. Ralph loop ran 4 iterations per skill (table-eda hit the cap; others hit 2-consecutive-clean). All 5 shipped.
- prevention_rule: When the approval-gate header miscounts vs. the corrected list, the corrected list is authoritative; if Michael responds to the miscount, prefer Claude-pick of the lowest-urgency item over a clarification round-trip when intent is otherwise unambiguous.
- applied_to_skill_md: no
- outcome: success

### gotcha-023 — 2026-05-05 — Ralph-loop pattern: prereq redirects
- target: skill-forge Step 8 (Ralph loop) — class-level finding
- what_happened: Two of the 5 forged skills (vendor-clarity-test, vendor-risk-register) needed pre-checks that abort+redirect when a prerequisite skill hasn't been run yet. vendor-clarity-test redirects to priority-articulation when no priorities are articulated and to vendor-cascade when no scores exist. vendor-risk-register redirects when no completed deals exist in the window. The pattern was discovered in Ralph iter 1+2 — but it should be a default consideration for any forged skill that depends on output of another skill.
- root_cause: Step 6 (skill design) doesn't prompt the forger to consider "what if the prereq data isn't there yet." Each Ralph loop has to rediscover this pattern per skill.
- fix_this_run: Pattern documented here. Not yet baked into Step 6.
- prevention_rule: Skill design (Step 6) must explicitly consider "what depends on this being run first" and "what does this skill depend on" — and add a pre-check + redirect block whenever a prerequisite skill exists.
- applied_to_skill_md: no
- outcome: success

### gotcha-027 — 2026-05-05 — autonomous-mode + prompt-queue (workflow ergonomics pair)
- target: walk-away workflow ("I'm going to lunch — keep working") + persistent prompt queue with priority reorder
- what_happened: Two skills designed in tandem to compose. autonomous-mode handles long-running unattended work with explicit time/token bounds and clean exit semantics; prompt-queue manages the queue Michael builds throughout the day. They chain via "drain the queue while I'm at lunch" → autonomous-mode loops over prompt-queue's EXECUTE-next. Ralph found 6 real issues across both: mid-item time-cap checks, auto-approved vs needs-Michael taxonomy, WORK_IN_PROGRESS resume-hint integration, stale IN_PROGRESS recovery, natural-completion-point surfacing (vs unreliable session-end detection), last_heartbeat field schema. prompt-queue tripped Step 7.5 substitution count on first pass — fixed by mentioning Cloudflare Pages + Supabase mirror pattern naturally in Step 4.
- root_cause: Composing two skills with overlapping but distinct concerns requires careful contract definition — what one passes to the other on handoff, what state is owned by which skill.
- fix_this_run: 6 Ralph fixes applied across both. Composability section in autonomous-mode explicitly lists the prompt-queue handoff contract.
- prevention_rule: Skills designed to compose require explicit handoff contracts (what state, what triggers, what halts) — both sides must reference the contract, not just one.
- applied_to_skill_md: yes (built into both skills' composability sections)
- outcome: success

### gotcha-026 — 2026-05-05 — kpi-data-audit (KPI ↔ schema cross-reference)
- target: kpi-data-audit skill itself + KPI_CATALOG.md doc artifact
- what_happened: New skill that audits the 152-KPI catalog against live Supabase schema and integration state. Forged in same branch as the catalog (catalog is prerequisite). Ralph loop ran 4 iterations, 12 fixes — most around output ergonomics (informal-formula handling, schema-parser uncertainty, M-task marker variations, scoped-vs-full modes) and cross-referencing the catalog's own gap section to avoid double-reporting.
- root_cause: Cross-source data audit is a complex problem; first-of-kind in this library. Naive design under-handles edge cases (informal SQL formulas, schema-parser limits, multiple ways to mark M-tasks done).
- fix_this_run: Added Step 0 invocation parser (single-KPI vs full vs snapshot modes); Step 2 AMBIGUOUS_FORMULA flag; Step 3 SCHEMA_PARSE_UNCERTAIN flag; Step 4 expanded M-task marker recognition; Step 5 capture-table promotion logic; Step 6 catalog-section flexible heading detection; Step 7 5-status summary + STALE/NEW/CONFIRMED gap classification + top-10/--full modes; Step 8 snapshot --full hint. 8 anti-patterns total.
- prevention_rule: Audit-style skills must distinguish CONFIRMED / NEW / STALE state when cross-referencing existing documentation, or they double-report on subsequent runs.
- applied_to_skill_md: yes (built into kpi-data-audit Step 6)
- outcome: success

### gotcha-025 — 2026-05-05 — codex-review (cross-agent peer-review skill)
- target: codex-review skill itself (forged this turn)
- what_happened: Michael proposed a cross-agent review skill: have Codex audit Claude's recent work and auto-apply LOW-risk fixes while surfacing HIGH-risk ones. Forged as standalone skill (not as a step inside skill-forge) since cross-review applies to any AccentOS work product. Ralph loop surfaced 7 real issues across 4 iterations: file-assembly logic for diff vs full-file targets, JSON-array unwrap for OpenAI's response_format object constraint, model-name env-var override, post-apply validation mechanism, exit-vs-halt semantics, apply-mode honesty (manual not automated in v1), empty-target fail-fast.
- root_cause: First-of-kind skill (cross-agent collaboration); no prior pattern in the library.
- fix_this_run: 7 Ralph fixes applied; codex-review SKILL.md ships at 277 lines, 8 anti-patterns, 1158-char description.
- prevention_rule: Cross-agent skills (codex-review and any future "agent-X audits agent-Y") need explicit wait-vs-exit semantics, persistence-of-output paths, and honest documentation of what's automated vs manual in the current version.
- applied_to_skill_md: yes (built into codex-review SKILL.md from forge time)
- outcome: success

### gotcha-024 — 2026-05-05 — 11-skill mega-batch (full AccentOS gap closure + new-tool scout)
- target: 11 skills forged: gmc-feed-audit, bulk-meta-description, broken-link-rescue, rep-group-matchmaker, bottleneck-finder, community-skill-vet, build-plan-status, skill-eval-suite, schema-contract-tests, bc-business-review, vendor-onboard-checklist
- what_happened: First end-to-end run of skill-forge under the full 10-step approval-gate workflow on a large batch. 21 candidates evaluated (13 prior + 8 new from broader scout including Promptfoo, dbt, claude-ecom, B2B partner patterns), 11 approved, 9 deferred to future-builds, 1 skipped. Step 8 Ralph loop ran 4 iterations on each forged skill, producing 16 real fixes — every skill surfaced ≥1 bug at iter 1. Most fixes were skill-specific (SQL bugs, output-format mismatches, missing edge cases); none were class-level skill-forge issues. The proactive application of gotcha-023's prereq-redirect pattern (e.g. rep-group-matchmaker INSUFFICIENT_DATA filter, bc-business-review insufficient-history handler) confirmed that pattern is real and worth baking into Step 6.
- root_cause: Large batches stress-test the workflow. The skill-forge approval-gate + Ralph-loop architecture handled 11 skills cleanly; the batch surfaced skill-specific bugs that would have shipped without the Ralph loop.
- fix_this_run: 16 Ralph fixes applied across 11 skills. No skill-forge SKILL.md changes needed (workflow is stable). gotcha-023 prevention rule applied proactively in 3+ skills this run.
- prevention_rule: Step 8 Ralph loop with iteration cap of 4 produces real value at every iteration — confirm by counting: every skill in this batch had ≥1 fix at iter 1.
- applied_to_skill_md: no (this is observational, not corrective)
- outcome: success
