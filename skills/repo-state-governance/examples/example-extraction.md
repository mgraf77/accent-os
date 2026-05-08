# Example: Architecture extraction (skill → its own repo)

End-to-end demonstration of the `architecture-extraction` workflow. Splits a skill out of a monorepo into its own repository.

---

## Setup

### Initial state

**Source repo:** `accentos`
**Branch:** `main`
**Manifest:** `current_mode = "stabilize"`

**Unit to extract:** the `decision-log` skill at `skills/decision-log/`

**Motivation (per decision-log entry `decisions/2026-05-08-extract-decision-log.md`):**
- The `decision-log` skill is becoming useful in two other repos (`acme-app`, `infra-tools`). Each has been copy-pasting it.
- A single canonical version, shared across repos, is preferable to drift across copies.

**Target:**
- Repo name: `agentos-skill-decision-log`
- Hosting: `github.com/mgraf77/agentos-skill-decision-log`
- License: same as source (Apache-2.0)
- Maintainer: Michael (mgraf77)

---

## Trigger

Michael at 11:00Z: "Extract decision-log into its own repo."

---

## Workflow: architecture-extraction

### Phase 1 — Stabilize (verify clean entry)

Already in stabilize. Working tree clean. Validation passing. Audit fresh. ✓

### Phase 2 — Map coupling

Agent updates manifest: `current_mode = "extraction-prep"`, `extraction_target = "decision-log"`.

Agent searches the repo:

**Imports INTO the unit (dependencies):**
- `skills/decision-log/SKILL.md` references `decisions/` directory at repo root → this is data, not code; the skill writes to `decisions/`
- No code-level imports (the unit is a markdown-defined skill)

**Imports FROM the unit (consumers within accentos):**
- `skills/_index.md` references decision-log as a companion skill
- `CLAUDE.md` mentions decision-log indirectly via skills-index reference
- No direct code-level imports from decision-log

**Shared elements:**
- `decisions/INDEX.md` is shared between decision-log and any other skill that reads decisions
- Skill conventions (frontmatter format, naming) are shared with all skills in the monorepo

**Indirect dependencies:**
- The `vibe-speak` skill mentions decision-log in its skill-router logic
- `efficiency-monitor` may flag "did this informally instead of using decision-log"

Agent records this in the extraction spec.

### Phase 3 — Define API boundary

For a markdown-defined skill, the "API" is:
- The trigger phrases (e.g. "log this decision")
- The expected output structure (named decision file + INDEX.md update)
- The skill file itself (`SKILL.md`)

Boundary list:
- **SKILL.md** — primary surface, all of it stable
- **Output schema** — decision file format (frontmatter + sections) — stable
- **INDEX.md update protocol** — stable
- Internal sub-files (none currently in decision-log) — n/a

### Phase 4 — Verify standalone build

For a markdown-defined skill, "standalone build" means:
- Can it function correctly when copied into a fresh repo with no AccentOS-specific files?
- The skill references AccentOS-specific paths (`/home/user/accent-os/decisions/`) that need parameterization

Agent creates `_extraction-sandbox/decision-log/`:
- Copies `skills/decision-log/SKILL.md`
- Adds `package.json` declaring this as a standalone skill package
- Replaces hard-coded `/home/user/accent-os/decisions/` with a configurable `${REPO_ROOT}/decisions/` placeholder
- Adds `README.md` describing standalone usage
- Adds `examples/` showing usage in a generic repo

Standalone "build" = lint markdown + verify all internal references resolve.
Standalone "test" = simulate using the skill on a synthetic repo and verify it produces a correct decision file.

Both pass after the path parameterization. ✓

### Phase 5 — Plan consumer migration

**Consumers (across all repos):**

| Consumer | Owner | New import | API change | Notification | Migration deadline |
|---|---|---|---|---|---|
| accentos (source repo) | Michael | install via skill-pack manager (future) or git submodule | path parameterization (configurable) | self | with extraction |
| acme-app | Michael | install from `agentos-skill-decision-log` repo | API stable | self | within 2 weeks of extraction |
| infra-tools | Michael | install from `agentos-skill-decision-log` repo | API stable | self | within 2 weeks of extraction |

All three consumers are owned by Michael, simplifying coordination.

### Phase 6 — Plan in-repo deprecation

**Strategy:** re-export — keep `skills/decision-log/SKILL.md` in accentos initially as a pointer to the extracted package, then migrate accentos to use the extracted version directly within 1 month.

**Justification:** accentos uses decision-log frequently; abrupt deletion would break in-flight work. Re-export gives a soak period.

**Timeline:**
- Day 0 (extraction split): in-repo SKILL.md becomes a pointer
- Day 14: accentos migrates to install the extracted package directly
- Day 30: in-repo `skills/decision-log/` directory removed entirely

### Phase 7 — Run extraction-readiness evaluator

All required categories pass:
- Coupling map: complete ✓
- API boundary: defined ✓
- Standalone build: verified ✓
- Consumer migration plan: 3 consumers, all owned by same operator, all have plans ✓
- Deprecation strategy: re-export with timeline ✓
- Governance for new repo: name, hosting, license, maintainer all decided ✓
- Pre-extraction state: tag pending (Phase 8)

Recommended (not blocking):
- N1 README for new repo: drafted ✓
- N2 CHANGELOG: drafted ✓
- N3 CI configuration: skipped — markdown-only skill doesn't have a build CI yet, will add post-extraction
- N4 Test coverage: n/a for markdown skill

**Verdict: READY** ✓

### Phase 8 — Tag + operator approval

Agent creates pre-extraction tag at accentos repo:
```
git tag pre-extraction/decision-log/2026-05-08
git push origin pre-extraction/decision-log/2026-05-08
```

Agent surfaces extraction spec to Michael for review.

Michael at 11:30Z: "Reviewed. Approved. Go ahead with the split."

Sign-off recorded in audit trail.

### (External) The actual split

The actual git split is performed manually (out of workflow scope):

```bash
# Using git filter-repo or git subtree split
git subtree split -P skills/decision-log -b extracted-decision-log
# Push to new repo
gh repo create mgraf77/agentos-skill-decision-log --public --license apache-2.0
git push https://github.com/mgraf77/agentos-skill-decision-log extracted-decision-log:main
```

The new repo is published with full git history of the decision-log directory preserved.

### Phase 9 — Return to stabilize (in source repo)

After the split is performed:

Agent updates `skills/decision-log/SKILL.md` in accentos to be a re-export pointer:

```markdown
---
name: decision-log
description: >
  This skill has been extracted to its own repo:
  https://github.com/mgraf77/agentos-skill-decision-log
  Currently re-exported here; will be migrated to direct install by 2026-06-08.
  See `decisions/2026-05-08-extract-decision-log.md` for context.
---

# decision-log (re-export)

This skill now lives at https://github.com/mgraf77/agentos-skill-decision-log.

The behavior is unchanged from the in-repo version; this file is a pointer.

To migrate to direct install:
- (Once a skill-pack manager exists) `agentos-skills add decision-log`
- Until then, keep using this re-export
```

Agent updates manifest:
```json
{
  "schema_version": 1,
  "current_mode": "stabilize",
  "entered_at": "2026-05-08T12:30:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "extraction-prep",
  "next_allowed_transitions": ["pause", "freeze", "deploy-prep", "extraction-prep", "governance-transition", "handoff", "audit", "sandbox"],
  "validation_tier": "language-specific",
  "last_extraction": "decision-log@pre-extraction/decision-log/2026-05-08"
}
```

Audit trail entries (the chain):
```markdown
## 2026-05-08T11:00:00Z stabilize → extraction-prep
- operator: claude-code:michael
- workflow: architecture-extraction
- artifacts: (in progress)
- entry-conditions: pass
- completion: in-progress (Phase 2 starting)
- notes: extracting decision-log skill into its own repo

## 2026-05-08T11:25:00Z (extraction-prep checkpoint)
- operator: claude-code:michael
- workflow: architecture-extraction Phase 7
- artifacts: .governance/artifacts/2026-05-08-extraction-spec-decision-log.md
- entry-conditions: n/a
- completion: extraction-readiness verdict READY
- notes: ready for split

## 2026-05-08T11:30:00Z (operator sign-off)
- operator: human:michael
- workflow: architecture-extraction Phase 8
- artifacts: pre-extraction/decision-log/2026-05-08 (git tag)
- entry-conditions: pass
- completion: split authorized
- notes: tag created and pushed; manual split to follow

## 2026-05-08T12:30:00Z extraction-prep → stabilize
- operator: claude-code:michael
- workflow: architecture-extraction Phase 9
- artifacts: .governance/artifacts/2026-05-08-extraction-spec-decision-log.md (final)
- entry-conditions: pass
- completion: complete
- notes: split complete; new repo at github.com/mgraf77/agentos-skill-decision-log; in-repo skills/decision-log/SKILL.md replaced with re-export pointer; deprecation timeline 30 days
```

Agent surfaces to Michael: "Extraction complete. New repo at https://github.com/mgraf77/agentos-skill-decision-log. accentos's `skills/decision-log/SKILL.md` is now a re-export pointer. Pre-extraction tag preserved at `pre-extraction/decision-log/2026-05-08`. Deprecation: full removal scheduled 2026-06-08; calendar reminder recommended."

---

## Outcome

- Skill cleanly extracted to its own repo with full git history
- Source repo (accentos) cleanly transitioned with re-export pointer
- All consumers (3 repos, all Michael-owned) have migration plans
- Pre-extraction tag preserved as rollback target
- 30-day deprecation timeline gives soak period for migration

## What this example demonstrates

- "Extraction" applies to documentation/skill assets, not just code — the framework is content-agnostic
- The framework distinguishes **prep** (this workflow) from **the actual split** (out of scope, manual git operations)
- Re-export deprecation strategy gives a soak period without abrupt break
- Pre-extraction tag is the rollback safety net — even though extraction is "irreversible" in the architectural sense, the tag preserves the pre-state for audit / debugging
- Even simple cases (3 consumers, single owner) benefit from explicit consumer migration planning — without it, the migration is implicit, and implicit migrations rot
- The framework's modularity shines: the same workflow handles code extraction (e.g. extracting a TypeScript module) and document extraction (e.g. extracting a markdown skill) with no special-casing
