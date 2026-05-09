# ARCHITECTURE TAGS

> Lightweight 5-tag scheme for future clean-room extraction into AgentOS Core.
> **Optional at P1.** Tag what is obvious; do not retrofit aggressively.
> tag: CORE

## Tags

| Tag | Definition | Examples in this repo |
| --- | --- | --- |
| **CORE** | Universal substrate; would belong in AgentOS Core after extraction. | governance/*, runtime-state/*, stable-evolution-runtime/*, registers/METRICS_REGISTER, policies/MODES, policies/ARCHITECTURE_TAGS itself |
| **DEPLOYMENT** | Specific to one deployment instance (e.g. AccentOS), not a single business. | BUILD_PLAN_*, KPI_CATALOG, MODULE_MODES, scripts/status.sh, .claude/CLAUDE.md |
| **BUSINESS_SPECIFIC** | Tied to a particular business's domain (Accent Roofing pricing, vendors, etc.). | quote-gen pricing rules, vendor-360 logic, customer-360 timeline, internal-meetings seed data |
| **UNIVERSAL** | Reusable across deployments without modification. | vibe-speak, efficiency-monitor, prompt-queue, skills/_index.md routing |
| **EXPERIMENTAL** | Speculative; may not survive the next cycle. | future-core placeholders (CP-1 TOR, CP-2 EGR), any DER Q4 vision items in early form |

## How to Apply
- Add a single line near the top of an MD or source-file header comment:
  ```
  tag: CORE
  ```
  or, when it spans categories:
  ```
  tag: CORE, UNIVERSAL
  ```
- For code files where a comment is awkward, capture the tag in the module's README
  or a sibling `.tags` file. Do not invent metadata systems.

## When NOT to Tag
- Trivial scaffolding (templates, single-purpose helpers obvious from name).
- Files that will be deleted within the cycle.
- Anything where the tag is genuinely ambiguous — leave untagged and revisit at cycle review.

## Tagging Discipline
- One tag is preferred. If two are needed, list at most two.
- A tag is a hint, not a contract. Do not introduce build-time validation of tags at P1.
- Re-tagging is cheap; over-tagging is expensive. Bias toward conservative use.

## Initial Tag Inventory (this commit)
- `runtime-state/*` → CORE
- `evolution-memory/*` → CORE
- `governance/*` → CORE
- `stable-evolution-runtime/*` → CORE
- `audits/*` (specs) → CORE; (logs/reports) → CORE/DEPLOYMENT (mixed; tag at write time)
- `registers/*` → CORE
- `loops/*` → CORE
- `templates/*` → CORE
- `policies/*` → CORE (this file, MODES, ROLLOUT_PLAN, OPERATIONAL_ERGONOMICS, ARCHITECTURE_TAGS)
- `STABILIZATION_LAYER.md` → CORE

Existing repo (untagged at P1; tag opportunistically when next touched):
- `BUILD_PLAN_*.md` → DEPLOYMENT
- `MASTER.md`, `BUILD_INTELLIGENCE.md`, `KPI_CATALOG.md` → DEPLOYMENT
- `SESSION_LOG.md`, `WORK_IN_PROGRESS.md`, `PROMPT_LOG.md`, `PROMPT_QUEUE.md` → DEPLOYMENT
- `index.html` (Quote Gen, vendor 360, customer 360, internal-meetings) → BUSINESS_SPECIFIC + DEPLOYMENT
- `worker/` → DEPLOYMENT
- `wrangler.toml`, `module_modes.json`, `patch_quote.js` → DEPLOYMENT
- `sql/` → BUSINESS_SPECIFIC + DEPLOYMENT
- `skills/vibe-speak/`, `skills/efficiency-monitor/`, `skills/prompt-queue/` → UNIVERSAL
- `skills/_index.md` → UNIVERSAL

## Future Use
At extraction time (post-P4, possibly years out):
- CORE files lift cleanly into AgentOS Core.
- UNIVERSAL files become AgentOS Core skills.
- DEPLOYMENT files stay in AccentOS deployment.
- BUSINESS_SPECIFIC files stay in the business module (Accent Roofing).
- EXPERIMENTAL files get reviewed; survivors graduate, others archive.
