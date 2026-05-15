# CANON.md — AccentOS Canonical Reference Index
> **Status:** V1 — Session 7 (canon enforcement build)
> **Read first.** If anything in this repo disagrees with a canonical doc, the canonical doc wins.
> **Source design:** `AGENT_MEMORY_AND_CONTEXT_STRATEGY.md` §3.

This file is the entry point for every agent session. It is hash-pinned, drift-checked, and additive.

---

## 1. CANONICAL FILES (Layer A — authoritative)

| File | Owns | Writer agent |
|---|---|---|
| `MASTER.md` | Business model, accounts, vision, hard rules | michael |
| `BUILD_INTELLIGENCE.md` | Lessons learned, anti-patterns, gotchas | claude-code |
| `AI_INTERACTION_MAP.md` | Worker ↔ frontend call paths | claude-code |
| `MODULE_DEPENDENCY_AUDIT.md` | Module graph | claude-code |
| `STARTUP_DEPENDENCY_ORDER.md` | Boot order invariants | claude-code |
| `module_modes.json` | Module registry truth (machine-readable) | claude-code |

**Rule:** Canonical files are append-mostly. Edits require a relay packet with `corridor: docs-only` (or `module-registry` for `module_modes.json`) and rationale in the commit body.

---

## 2. CANONICAL HASHES (drift detection)

`scripts/check-canon-drift.sh` regenerates and validates this block.
Format: `<sha256>  <path>`.

```
# BEGIN CANON HASHES
23a7c979de9caf9cebf52ec969d0b58419f2a3c69c1524d41e783437ea60bd46  MASTER.md
3328731fb35beef12722870899568ec129b9ffa74a16328d7a814e1aac9e6ef8  BUILD_INTELLIGENCE.md
f8a4ecf05f2e2893a96da1e205b1e6371fb57046ef266b36719d2baf7791a0db  AI_INTERACTION_MAP.md
dbaa2f743325c356dbe7c899801402c9dbeb04d573377afa7079340a0d59a7b3  MODULE_DEPENDENCY_AUDIT.md
17a262c689c64a940447d8186eec80d253046c8136af862ae30a03f8e82f6a3f  STARTUP_DEPENDENCY_ORDER.md
462d4daf87d24d45098676642e856925633459dd26a23e1de78edfb47b855a09  module_modes.json
# END CANON HASHES
```

If an agent reads a canonical file and the live SHA256 does not match the entry above, the agent MUST re-read that file and update this block in the same commit as the canonical edit.

To refresh after an authorized canonical edit:
```
bash scripts/check-canon-drift.sh --update
```

To verify (read-only, exits non-zero on drift):
```
bash scripts/check-canon-drift.sh
```

---

## 3. ARCHITECTURAL MEMORY (Layer B — ADRs)

- Location: `.orchestration/decisions/ADR-NNNN-*.md`
- Numbering: monotonic, never reused
- Lifecycle: `Proposed → Accepted → (Superseded by ADR-MMMM)`
- ADRs are never deleted.

Current ADR count: 0 (none committed yet — first ADR lands when the first irreversible architectural decision is made on top of this canon layer).

---

## 4. "READ NOTHING ELSE BUT THESE" (per role)

**Any agent picking up work:**
1. `CANON.md` (this file)
2. `WORK_IN_PROGRESS.md`
3. The relay packet listed in `.orchestration/relays/` whose `to_agent` matches self

**Claude Code (build lane):**
1. `BUILD_PLAN_CLAUDE.md`
2. `BUILD_INTELLIGENCE.md`
3. `MASTER.md`

**Review / verify lane:**
1. `AI_INTERACTION_MAP.md`
2. `MODULE_DEPENDENCY_AUDIT.md`
3. The diff under review

**Runtime / deploy lane:**
1. `STARTUP_DEPENDENCY_ORDER.md`
2. `module_modes.json`
3. `worker/` + `wrangler.toml`

---

## 5. ORCHESTRATION DESIGN REFERENCES (Layer A')

These docs define how the canonical files are governed. They are themselves canonical for protocol behavior, but they describe rules rather than business truth.

| File | Defines |
|---|---|
| `AUTONOMOUS_HANDOFF_PROTOCOL_V1.md` | Relay packets, branch ownership, corridors, merge authority, escalation, clean pause |
| `AGENT_MEMORY_AND_CONTEXT_STRATEGY.md` | Three-layer memory, CANON.md, ADRs, anti-drift |
| `PARALLEL_EXECUTION_GOVERNANCE.md` | Lane registry, semantic ownership, dependency DAG, conflict handling |
| `OPERATOR_BOTTLENECK_REDUCTION_PLAN.md` | Touchpoint inventory, automation tiers, irreducible-human list |
| `ACCENTOS_DEVELOPMENT_CONTROL_PLANE.md` | Read-mostly dashboard concept |

---

## 6. ENFORCEMENT (Session 7)

| Check | Script | Scope |
|---|---|---|
| Canonical hash drift | `scripts/check-canon-drift.sh` | Section 2 of this file |
| Active-lane collisions | `scripts/check-lane-claims.sh` | `.orchestration/lanes.json` |
| Relay packet well-formedness | `scripts/check-relay-packet.sh` | `.orchestration/relays/*.json` |

All three are **visibility-only** in this session. They report; they do not block, auto-merge, or rewrite.

Promotion to pre-commit / CI gating is a later lane and requires Michael sign-off (see `OPERATOR_BOTTLENECK_REDUCTION_PLAN.md`).

---

## 7. WHAT IS NOT CANONICAL

- Session logs, prompt logs, WIP files (Layer C — ephemeral)
- Audit reports, deployment reports, smoke-test summaries (historical artifacts)
- Anything under `docs/` that does not appear in §1 or §5

Disagreements between non-canonical docs do not require resolution. Disagreements with §1 / §5 do.
