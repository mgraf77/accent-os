# SAFE_MERGE_ORDER.md
> Session 29 — risk-prioritized ordered execution plan
> Principle: governance before expansion · runtime primitives before producers · additive before behavioral · lowest risk first

---

## ORDERED MERGE SEQUENCE

### TIER 0 — CLEANUP (zero-risk, do first)
| Step | Action | Branch | Risk |
|------|--------|--------|------|
| 0.1 | Delete merged ref | `claude/forge-prompt-queue-v2-f31c66a9` | none |

### TIER 1 — DOCS / DESIGN (pure additive)
| Step | Action | Branch | Risk |
|------|--------|--------|------|
| 1.1 | Merge | `claude/extract-orchestration-intelligence-BhxXb` | none — 1 commit, docs only |
| 1.2 | Merge | `claude/mvhb-queue-runtime-UG9pN` | none — new dir |
| 1.3 | Merge | `claude/orchestration-maturity-analysis-qdJ5W` | low — verify SQL is observational |
| 1.4 | Merge | `claude/governance-doctrine-design-kNUPb` | low — M42 additive |
| 1.5 | Merge | `claude/runtime-stabilization-layer-Tneyd` | none — new top-level dirs |

**Gate:** run `bash scripts/status.sh`. Tree must be clean. Continue.

### TIER 2 — GOVERNANCE RAILS (canon + enforcement primitives)
| Step | Action | Branch | Risk |
|------|--------|--------|------|
| 2.1 | Merge | `claude/governance-snapshot-prep-k3dBs` | low — adds boot-smoke.sh |
| 2.2 | Merge | `claude/canon-enforcement-scripts-wp0M4` | medium — modifies CANON.md, expect docs conflict from Tier 1; resolve "theirs" for `.orchestration/` |
| 2.3 | Run | `bash scripts/boot-smoke.sh` (from 2.1) — must pass | gate |
| 2.4 | Merge | `claude/runtime-boundary-enforcement-XcoKi` | medium — depends on 2.2 canon |
| 2.5 | Merge | `claude/add-autonomous-governance-NwHL7` | medium — M41 governance schema + governance.js |

**Gate:** boot-smoke + status.sh + canon hashes regenerated.

### TIER 3 — SQL RENUMBER (pre-flight for Tier 4+)
Resolve M49/M50 collisions BEFORE any runtime branch lands.

| Step | Action | Detail |
|------|--------|--------|
| 3.1 | Decide M49 owner | Canonical: `claude/minimal-signal-runtime` defines base schema. Others extend via M51 / M52. |
| 3.2 | Decide M50 owner | Canonical: `claude/wire-minimal-runtime` keeps `M50_pricing.sql`. `pricing-runtime-conversion` renames to `M53_pricing_runtime.sql`. |
| 3.3 | Update affected branches | Rebase + rename SQL files in each loser branch before merging. |

### TIER 4 — SIGNAL RUNTIME (consolidation wave)
Sequential. Pick canonical, layer the rest as deltas. Do NOT batch.

| Step | Action | Branch | Risk |
|------|--------|--------|------|
| 4.1 | Merge canonical | `claude/minimal-signal-runtime-ZEwod` | medium — index.html + M49 + worker |
| 4.2 | Cherry-pick deltas | `claude/consolidate-signal-system-Z5Xhb` (M48 only) | medium |
| 4.3 | Merge | `claude/emitter-ownership-visibility-QfOTG` | medium — adds ownership metadata onto emitters from 4.1 |
| 4.4 | Merge | `claude/operational-signal-framework-UGMDn` (docs only — defer code if any) | low |
| 4.5 | Merge | `ox-signal-audit-design-9200557531541259754` (docs) | low |

**Gate:** signal emission smoke test — emit, dedupe, observe in queue.

### TIER 5 — RUNTIME HARDENING (behavioral, scoped)
Sequential. Re-run status.sh + boot-smoke between each.

| Step | Action | Branch | Risk |
|------|--------|--------|------|
| 5.1 | Merge | `claude/harden-operational-workflows-gP9bP` | low — most likely no-op vs main |
| 5.2 | Merge | `claude/harden-quote-transactions-zukcz` | low — M45/M46 already in main |
| 5.3 | Merge | `claude/harden-signal-dedupe-CsO6N` | medium — layers dedupe on Tier 4 emitter |
| 5.4 | Merge | `claude/harden-generator-confidence-SBtlt` | medium — layers confidence gate |
| 5.5 | Merge | `claude/harden-runtime-escalation-eYOqF` | medium — escalation handlers |

### TIER 6 — PRODUCERS + ORCHESTRATION (expansion)
Behavioral additions on hardened runtime.

| Step | Action | Branch | Risk |
|------|--------|--------|------|
| 6.1 | Merge | `claude/wire-minimal-runtime-tgo0c` | medium — M50_pricing.sql + wiring |
| 6.2 | Merge | `claude/pricing-runtime-conversion-9ZISb` | medium — after SQL rename in 3.2 |
| 6.3 | Merge | `operational-queue-ux-finalization-14686126636490175698` | medium — mobile queue UX |
| 6.4 | Merge | `claude/orchestration-layer-design-fkUMQ` | medium — control plane docs + worker |

**Final Gate:** full POST_MERGE_VALIDATION_CHECKLIST.

---

## RISK LADDER (LOW → HIGH)

```
TIER 1 docs        ░░░░░░░░░░  none
TIER 2 governance  ██░░░░░░░░  low/medium (canon hash churn)
TIER 3 renumber    █░░░░░░░░░  mechanical
TIER 4 signal      █████░░░░░  medium-high (6-way overlap collapsed)
TIER 5 hardening   ████░░░░░░  medium (behavioral)
TIER 6 expansion   █████░░░░░  medium (rides on all above)
```

---

## STOP CONDITIONS

Abort the merge wave if any of the following occurs:

- `boot-smoke.sh` fails after any Tier 2+ merge
- `status.sh` reports dirty tree after a clean merge (indicates orphaned files)
- Canon hash regeneration produces no diff when a canon-touching branch merged (canon wiring broken)
- Signal emission smoke produces duplicates after Tier 5.3 (dedupe wiring broken)
- M49/M50 schema conflicts re-emerge (renumber pre-flight skipped)
