---
name: skill-health-monitor
description: >
  AccentOS skill-ecosystem self-maintenance auditor. Scans every skill in
  /home/user/accent-os/skills/ for regressions (broken file references, dead
  companion-links, schema drift, frontmatter rot), duplication (two skills
  doing the same job), staleness (no triggers fired in N sessions), and merge
  candidates (overlapping scope). Produces a health report with proposed Edits,
  never auto-edits. Use this skill when Michael says: "skill audit", "skill
  health", "audit the skills", "are any skills broken", "find duplicate skills",
  "/skill-health", "should we merge X and Y", or any phrasing that asks about
  ecosystem-level skill quality. Pairs with gap-optimizer (which adds skills)
  and skill-forge (which builds them) — health-monitor is the cleanup half of
  the loop. Always produces a structured report and a per-finding proposed
  Edit; never modifies a SKILL.md without surfacing the proposal first.
---

# skill-health-monitor

**Purpose:** Skills decay. References go stale, two skills converge on the same job, frontmatter contracts drift, companion-links break. This skill audits the entire `skills/` directory at the cadence Michael chooses and surfaces what needs fixing — never fixing silently.

This is the cleanup counterpart to `gap-optimizer` (which adds new skills) and `skill-forge` (which builds them). Together they form the ecosystem maintenance loop:

```
gap-optimizer → skill-forge → skill-health-monitor → gap-optimizer (re-scan)
   (proposes)     (builds)        (audits)              (loop)
```

Six checks in order: **broken-refs → dead-companions → frontmatter-rot → duplicate-scope → staleness → merge-candidates**. The output is a single report with a per-finding proposed Edit. Nothing is auto-edited.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "skill audit"
- "skill health"
- "audit the skills"
- "are any skills broken"
- "find duplicate skills"
- "/skill-health"
- "should we merge [X] and [Y]"
- "is anything in skills broken"
- "skill ecosystem check"
- "ralph the skills"

Also run automatically:
- After any `skill-forge` commit lands (audits the new skill against existing ecosystem)
- Weekly via `efficiency-aggregate.sh` cadence (low-priority background pass)
- When `gap-optimizer` flags "queue saturation" (≥3 unforged top-3 candidates) — health audit may surface cleanup that frees forge capacity

---

## Scope

**In scope:**
- Every `skills/*/SKILL.md` and its supporting `references/*.md` files
- Cross-skill references (companion-skill links, `_index.md` consistency)
- Frontmatter contract conformance per `skill-forge/references/skill-template.md`
- Duplicate-scope detection (two skills overlap >70%)
- Staleness signals (skill never invoked in last N sessions)
- Merge proposals when two skills serve the same trigger surface

**Out of scope — fail fast with a one-line redirect:**
- Building a new skill → "Use `skill-forge`."
- Identifying which skill to build next → "Use `gap-optimizer`."
- Generating eval cases → "Use `skill-eval-suite`."
- Reviewing a skill's logic for correctness → "Use `codex-review`."
- Editing a skill (not just proposing) → "Surface the proposed Edit, then Michael runs the Edit."

---

## Step 0 — Preflight

In parallel:

1. **Enumerate all skills** — `ls /home/user/accent-os/skills/` (excluding `_*.md`). For each, note: directory exists, SKILL.md exists, references/ exists.
2. **Read the skill registry** — `/home/user/accent-os/skills/_index.md`. Build a map of registered skills.
3. **Read the skill template** — `/home/user/accent-os/skills/skill-forge/references/skill-template.md`. Extract frontmatter contract (name, description, length, required substitutions).
4. **Read efficiency-monitor data** — `/home/user/accent-os/skills/efficiency-monitor/efficiency-log.md` (last 30 entries). Build a per-skill invocation count for staleness detection.
5. **Capture branch state** — `git -C /home/user/accent-os branch --show-current`. Audit reports go to the working branch only.

Output of Step 0: a one-line preflight note: "audited N skills, registry has M entries, last 30 sessions show K invocations across L skills."

---

## Step 1 — Broken-references check

For each `SKILL.md`, scan for path references and verify each one resolves:

- Paths matching `/home/user/accent-os/...` or `skills/...` — does the file/directory exist?
- Companion-skill references (e.g. "Pairs with `skill-forge`") — does the companion skill exist?
- References to scripts (`scripts/...`) — does the script exist and is it executable?
- References to docs (`MASTER.md`, `BUILD_PLAN_*`, `KPI_CATALOG.md`) — does the doc exist?
- References to Supabase tables — does the table appear in `sql/M*.sql`?

For each broken reference, record:

```
BROKEN-REF in skills/[skill-name]/SKILL.md
  Line: [line-number]
  Reference: [the exact string]
  Type: path | companion-skill | script | doc | table
  Suggested fix: [most likely correct value, or "remove if no longer applicable"]
```

If a referenced skill was renamed, check git log for a rename commit and propose the new name as the fix.

---

## Step 2 — Dead-companion-link check

For each `SKILL.md` frontmatter description and the body's "Pairs with" / "Companion" mentions, build a directed graph: skill A → references skill B.

Detect:
- **One-way companions** — A references B but B doesn't reference A back. Either intentional (A is a consumer, B is a producer) or rot. Surface for review.
- **Self-references** — A references itself. Always rot.
- **References to deleted skills** — A references B but B is not in the registry. Always rot.

Format each finding:

```
COMPANION-DRIFT in skills/[skill-name]/
  Issue: [one-way | self-ref | deleted-target]
  Detail: [skill-A → skill-B explanation]
  Suggested fix: [add reciprocal | remove self-ref | remove dead reference]
```

One-way companions are NOT auto-flagged as broken — many are legitimate. Surface for human judgment, don't auto-propose Edit.

---

## Step 3 — Frontmatter-contract check

For each `SKILL.md`, validate against the contract from `skill-forge/references/skill-template.md`:

| Check | Rule | Severity |
|-------|------|----------|
| `name` field present | required | ERROR |
| `name` is kebab-case | required | ERROR |
| `name` ≤25 chars | required | WARN |
| `name` matches directory name | required | ERROR |
| `description` field present | required | ERROR |
| `description` uses `>` multi-line | required | WARN |
| `description` ≥250 chars | required | WARN |
| `description` contains "AccentOS" or "Accent Lighting" | required | ERROR |
| `description` ends with shipped-behavior commitment | required | WARN |
| Body has `## Trigger Recognition` section | required | WARN |
| Body has `## Anti-patterns` section with ≥3 entries | required | WARN |
| File total ≤5000 tokens (rough word count × 1.3) | required | WARN |
| No `## Future enhancements` / `## TODO` / `## Roadmap` section | required | WARN |
| At least 3 AccentOS-stack-specific substitutions present | required | WARN |

For each failure:

```
FRONTMATTER-ROT in skills/[skill-name]/SKILL.md
  Severity: ERROR | WARN
  Rule: [the rule that failed]
  Current value: [what's there, truncated to 80 chars]
  Suggested fix: [proposed Edit, or "manually rewrite section X"]
```

ERRORs block the skill from being usable. WARNs are quality issues — surface but don't fail the audit on them.

---

## Step 4 — Duplicate-scope detection

For every pair of skills (A, B) in `_index.md`, compute scope overlap:

1. Extract trigger phrases from each (frontmatter description + `## Trigger Recognition` section).
2. Compute Jaccard similarity on trigger phrase sets.
3. Compute when_to_use overlap (fuzzy match on the `when_to_use:` line in `_index.md`).
4. Combine into a single scope-overlap score 0–1.

Threshold:
- score ≥0.7 → propose merge
- 0.5 ≤ score <0.7 → flag for review (might be intentional companion specialization)
- score <0.5 → no flag

For each pair flagged:

```
DUPLICATE-SCOPE: skills/[A] ⇄ skills/[B]
  Overlap score: 0.NN
  Shared triggers: [list of phrases that appear in both]
  Distinguishing scope: [one sentence on what makes A vs B different, if anything]
  Suggested action: MERGE | KEEP-BOTH | RENAME-FOR-CLARITY
  Rationale: [one sentence]
```

Examples of legitimate near-duplicates: `repo-scout` (install-as-is) vs `skill-forge` (build-custom). They share triggers like "look into [X]" but route to different actions. The skill-forge frontmatter explicitly distinguishes them — a duplicate-scope finding here would be a false positive, and the suggested action would be `KEEP-BOTH` with rationale citing the existing distinction.

---

## Step 5 — Staleness check

For each skill, compute days-since-last-invocation from `efficiency-log.md` (or fall back to `git log` for files inside the skill's directory). Surface when:

- Skill ≥90 days without invocation: STALE
- Skill ≥180 days without invocation AND no scheduled-cadence note: PROPOSE-DEPRECATION

Format:

```
STALENESS: skills/[name]
  Last invocation: YYYY-MM-DD ([N] days ago)
  Status: STALE | PROPOSE-DEPRECATION
  Has scheduled cadence: yes/no
  Suggested action: [archive | review-with-michael | leave-it-as-tool-of-last-resort]
```

Hard rule: NEVER auto-deprecate. Always surface PROPOSE-DEPRECATION as a finding. Some skills (like `vendor-risk-register`) are quarterly by design and shouldn't be flagged just for low frequency.

---

## Step 6 — Merge proposals (only if Step 4 surfaced any)

For each pair flagged with action=MERGE, draft a merge proposal:

```
MERGE PROPOSAL: [skill-A] + [skill-B] → [proposed-merged-name]
  Combined scope: [one paragraph on what the merged skill would do]
  Triggers (combined deduped set): [list]
  References to migrate: [list of files in references/]
  Companion-link updates: [list of other skills whose "pairs with" needs updating]
  _index.md updates: [old entries to remove, new entry to add]
  Estimated effort: LOW | MED | HIGH
```

These are proposals. Health-monitor never executes a merge. After Michael approves, the merge happens via:
1. Manual Edits to combine SKILL.md contents
2. `mv` of the references/ files
3. `rm -r` of the absorbed skill's directory
4. `_index.md` update via this skill's Step 7 below
5. `git commit` with `chore(skills): merge [A] into [B] per skill-health proposal`

---

## Step 7 — Output report

Write a single report to console (and optionally to `skills/skill-health-monitor/health-report-YYYY-MM-DD.md` if Michael requests `/skill-health save`).

Report structure:

```
═══ SKILL-HEALTH REPORT — YYYY-MM-DD HH:MM ═══
Branch: [branch] | Skills audited: N | Registry entries: M

SUMMARY
  Broken refs:         [count]
  Companion drifts:    [count]
  Frontmatter rot:     [count] (ERROR: X | WARN: Y)
  Duplicate-scope:     [count] (MERGE: X | REVIEW: Y)
  Staleness:           [count] (STALE: X | PROPOSE-DEPRECATE: Y)
  Merge proposals:     [count]
  Overall health:      GREEN | YELLOW | RED

DETAILS

[BROKEN-REF entries]

[COMPANION-DRIFT entries]

[FRONTMATTER-ROT entries]

[DUPLICATE-SCOPE entries]

[STALENESS entries]

[MERGE PROPOSAL entries]

═══ APPROVAL GATE ═══
For each finding, reply with one of:
  - "fix all errors"      → applies all ERROR-severity fixes via Edit
  - "fix [finding-id]"    → applies a specific fix
  - "ignore [finding-id]" → adds an ignore-note to skills/skill-health-monitor/ignored.md
  - "merge [A] [B]"       → proceeds with a merge proposal
  - "deprecate [name]"    → archives a skill (moves to skills/_deprecated/[name]/)
  - "snooze 30d"          → silences this report for 30 days

I am stopping here. Nothing is modified until you reply.
═══════════════════
```

Health bands:
- **GREEN** — 0 ERROR-severity findings, ≤3 WARN, 0 PROPOSE-DEPRECATE
- **YELLOW** — 1–2 ERROR or 4–10 WARN
- **RED** — ≥3 ERROR or any deleted-target reference

---

## Step 8 — Apply approved fixes

For each finding Michael approves (`fix [id]`):

1. Use `Edit` tool to apply the suggested fix exactly as written in the finding.
2. Re-run the relevant check (Steps 1–5) on the affected skill to verify the fix worked.
3. If verification fails, surface the failure and ask Michael to manually intervene.
4. Log applied fixes to `skills/skill-health-monitor/applied-fixes.md`:

```
### YYYY-MM-DD HH:MM — [finding-id]
- skill: [name]
- type: [broken-ref | companion-drift | frontmatter-rot | etc.]
- before: [excerpt of what was wrong]
- after: [excerpt of what was changed to]
- verified: yes/no
```

For merge approvals, follow Step 6's merge process. Don't shortcut it.

For deprecation approvals:
1. `mkdir -p skills/_deprecated/`
2. `mv skills/[name] skills/_deprecated/[name]`
3. Remove the skill's entry from `_index.md`
4. Update any companion-links in other skills that referenced the deprecated skill (broken-ref check will catch these next run; alternative is to update them now in the same commit).
5. Append to `skills/skill-health-monitor/deprecated-log.md`:

```
### YYYY-MM-DD — deprecated [name]
- reason: [staleness | superseded by | merged into | obsolete pattern]
- last invocation: [date or "never"]
- moved to: skills/_deprecated/[name]/
```

---

## Step 9 — Commit

After all approved fixes and merges have been applied:

1. Stage only the changed files: `git add skills/[modified-skills]/ skills/_index.md skills/skill-health-monitor/applied-fixes.md`
2. Commit message: `chore(skills): health audit — N fixes, M merges, K deprecations`
3. Push to the working branch (NOT main without explicit permission).

If no fixes were approved, no commit. The report itself does not get committed unless Michael ran `/skill-health save`.

---

## Output format

See Step 7. Files this skill writes:

- (optional) `skills/skill-health-monitor/health-report-YYYY-MM-DD.md` — saved report when Michael runs `/skill-health save`
- `skills/skill-health-monitor/applied-fixes.md` — append-only ledger of fixes applied this run
- `skills/skill-health-monitor/deprecated-log.md` — append-only ledger of deprecations
- `skills/skill-health-monitor/ignored.md` — explicit per-finding ignore notes (so the same finding doesn't re-surface forever)

---

## AccentOS context

- Stack: Supabase `hsyjcrrazrzqngwkqsqa`, BigCommerce `store-cwqiwcjxes`, Cloudflare Pages, Anthropic API
- Project: AccentOS (the skill ecosystem itself is the audit subject)
- Paths: `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`)
- Frontmatter contract source: `skills/skill-forge/references/skill-template.md`
- Registry: `skills/_index.md`
- Companion skills: `gap-optimizer` (proposes new skills), `skill-forge` (builds them), `skill-eval-suite` (per-skill regression tests), `efficiency-monitor` (provides invocation counts for staleness)

---

## Anti-patterns

- **Never** auto-edit a SKILL.md without Michael's explicit approval per finding.
- **Never** auto-deprecate a skill — even at 365+ days unused, surface as PROPOSE-DEPRECATION, not action.
- **Never** auto-merge two skills — propose, don't execute.
- **Never** flag a one-way companion link as ERROR. Many are legitimate; surface as WARN at most.
- **Never** flag low-frequency skills as STALE without checking for "scheduled cadence" notes (e.g. quarterly review skills).
- **Never** run a full audit silently. Always produce the report — even if 0 findings.
- **Never** commit applied-fixes.md or deprecated-log.md without an actual commit message reflecting what changed.
- **Never** process a merge by deleting one skill's directory before its content is preserved in the survivor.
- **Never** treat the same finding as new on a subsequent run if it was added to `ignored.md`. Honor the ignore notes.
