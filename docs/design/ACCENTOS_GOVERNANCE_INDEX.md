# AccentOS Governance Index
> **Doc type:** Planning navigation spine. Read-only map of every governance/planning artifact on this branch.
> **Status:** Stable index for branch `claude/accentos-rollout-planning-UTElf` at convergence.
> **Use:** any future session lands here first.

---

## 1. The map

| # | File | Purpose | Authority level | Canonical? |
|---|---|---|---|---|
| 1 | `MASTER.md` | Project source of truth | Supreme on §12 hard rules | ✅ canonical (in-repo) |
| 2 | `MODULE_MODES.md` | Rollout state-machine spec | Locked spec | ✅ canonical (in-repo) |
| 3 | `module_modes.json` | Live rollout state (data) | Live runtime | ✅ canonical (in-repo) |
| 4 | `WORK_IN_PROGRESS.md` | Single in-flight task | Operational | ✅ canonical (in-repo) |
| 5 | `BUILD_PLAN_CLAUDE.md` / `BUILD_PLAN_MICHAEL.md` | Working checklists | Operational | ✅ canonical (in-repo) |
| 6 | `BUILD_INTELLIGENCE.md` | Lessons learned | Operational | ✅ canonical (in-repo) |
| 7 | `SESSION_LOG.md` | Append-only session log | Operational | ✅ canonical (in-repo) |
| 8 | `SYSTEM_STATE.md` | System snapshot | Canonical | ⚠️ canonical (other branch) |
| 9 | `GOVERNANCE_RISKS.md` | Running risk register | Canonical | ⚠️ canonical (other branch) |
| 10 | `STABILIZATION_PROTOCOL.md` | Freeze rules (formal) | Canonical | ⚠️ canonical (other branch) |
| 11 | `MODULE_OWNERSHIP_MAP.md` | Per-module owners | Canonical | ⚠️ canonical (other branch) |
| 12 | `docs/design/ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` | Phases, sequencing, gates §16, coexistence §17 | Spoke draft | ❌ |
| 13 | `docs/design/ACCENTOS_GOVERNANCE_RECONCILIATION.md` | Authority order, conflict resolution | Spoke draft | ❌ |
| 14 | `docs/design/ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md` | F1–F10 failure playbooks | Spoke draft | ❌ |
| 15 | `docs/design/ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` | Authority table, decision flowchart | Spoke draft | ❌ |
| 16 | `docs/design/ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` | S/M/W/G/R sub-scores, vetoes | Spoke draft | ❌ |
| 17 | `docs/design/ACCENTOS_MULTI_SESSION_GOVERNANCE.md` | 12-article constitution | Spoke draft | ❌ |
| 18 | `docs/design/ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md` | Freeze + kill protocol | Spoke draft | ❌ |
| 19 | `docs/design/ACCENTOS_GOVERNANCE_INDEX.md` (this) | Navigation spine | Spoke draft | ❌ |
| 20 | `docs/design/ACCENTOS_GOVERNANCE_TERMINOLOGY.md` | Term normalization | Spoke draft | ❌ |
| 21 | `docs/design/ACCENTOS_GOVERNANCE_CONTRADICTIONS.md` | Internal contradiction audit | Spoke draft | ❌ |
| 22 | `docs/design/ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md` | Handoff packet | Spoke draft | ❌ |
| 23 | `docs/design/test/_template.md` + 6 module checklists | Golden-path runbooks | Spoke draft | ❌ |

⚠️ = canonical content lives on another branch. This branch references but does not author.

---

## 2. Canonical ownership (single-page summary)

| Surface | Owner | Writer | Reader |
|---|---|---|---|
| `MASTER.md` | Captain | Captain (+ Hub appends §15) | All |
| `MODULE_MODES.md` | Captain (locked) | Captain | All |
| `module_modes.json` | Captain | Hub (one flip per commit) | All |
| Canonical governance docs (#8–#11) | Captain | Hub on `claude/governance-*` only | All |
| Spoke planning docs (#12–#23) | Spoke session | Spoke session (drafts) → Hub (adopts) | All |
| Operational docs (#4–#7) | Hub | Hub | All |

---

## 3. Document purpose (one sentence each)

- **Rollout Strategy** — *what phases, in what order, with what measurable gates, and what shell-v2 ↔ v1 coexistence rules.*
- **Governance Reconciliation** — *who wins when documents disagree.*
- **Failure Scenarios** — *for each predictable failure mode, how to detect, contain, and recover.*
- **Escalation Matrix** — *who decides what, how fast, and what the default is when nobody is reachable.*
- **Readiness System** — *the 0–10 scoring that turns "are we ready?" into a number.*
- **Multi-Session Constitution** — *the rules of the road when more than one Claude session is active.*
- **Freeze Protocol** — *what halts the train, how, and how it restarts.*
- **Index** (this) — *the spine.*
- **Terminology** — *one word = one meaning.*
- **Contradictions** — *the known internal disagreements and the recommended resolution path.*
- **Freeze Snapshot** — *the single packet a future implementation phase consumes.*
- **Test checklists** — *the ≤5 minute manual runs that gate a flip.*

---

## 4. Authority level (descending)

```
1. MASTER.md §12 (Hard Rules)
2. STABILIZATION_PROTOCOL.md ⚠️
3. GOVERNANCE_RISKS.md ⚠️
4. MODULE_OWNERSHIP_MAP.md ⚠️
5. SYSTEM_STATE.md ⚠️
6. MODULE_MODES.md
7. module_modes.json
8. ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md
9. ACCENTOS_GOVERNANCE_RECONCILIATION.md
10. ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md
11. ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md
12. ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md
13. ACCENTOS_ROLLOUT_READINESS_SYSTEM.md
14. ACCENTOS_MULTI_SESSION_GOVERNANCE.md
15. ACCENTOS_GOVERNANCE_INDEX.md (this)
16. ACCENTOS_GOVERNANCE_TERMINOLOGY.md
17. ACCENTOS_GOVERNANCE_CONTRADICTIONS.md
18. ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md
19. MASTER.md non-§12
20. BUILD_PLAN_*.md, BUILD_INTELLIGENCE.md
21. WORK_IN_PROGRESS.md, SESSION_LOG.md
22. docs/design/test/*.md
```

When two artifacts disagree → higher authority wins. Equal authority → recency-of-merge.

---

## 5. Dependency order (must exist before)

```
MASTER.md
    ├── STABILIZATION_PROTOCOL.md ⚠️
    ├── GOVERNANCE_RISKS.md ⚠️
    ├── MODULE_OWNERSHIP_MAP.md ⚠️
    └── SYSTEM_STATE.md ⚠️
                        │
                        ▼
              MODULE_MODES.md
              module_modes.json
                        │
                        ▼
        ROLLOUT_STRATEGY ──┬── COEXISTENCE_HARDENING (§17)
                          ├── GATES + METRICS (§16)
                          │
                          ▼
        GOVERNANCE_RECONCILIATION
                          │
                          ▼
        ESCALATION_MATRIX ── FAILURE_SCENARIOS
                          │
                          ▼
        READINESS_SYSTEM
                          │
                          ▼
        MULTI_SESSION_GOVERNANCE
                          │
                          ▼
        FREEZE_PROTOCOL
                          │
                          ▼
        INDEX (this) ── TERMINOLOGY ── CONTRADICTIONS
                          │
                          ▼
        FREEZE_SNAPSHOT  (closes the planning layer)
                          │
                          ▼
        test/*.md  (operational runbooks)
```

---

## 6. Consumption order (read this branch in order)

A future session reading this branch cold consumes documents in this order:

1. `ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md` — single-packet summary.
2. `ACCENTOS_GOVERNANCE_INDEX.md` (this) — the map.
3. `ACCENTOS_GOVERNANCE_TERMINOLOGY.md` — vocabulary.
4. `MASTER.md` §3, §4, §12 — system context + hard rules.
5. `MODULE_MODES.md` + `module_modes.json` — the rollout instrument.
6. **Canonical `STABILIZATION_PROTOCOL.md`** on branch `claude/governance-snapshot-prep-k3dBs` — restructure phase ladder (canonical Phase 0–7) and STOP CONDITIONS. **Read before the rollout strategy** so the canonical-vs-rollout phase distinction is encountered first; canonical authority precedence (per rollout strategy §0.1) is established here.
7. `ACCENTOS_CANONICAL_DELTA.md` — read-only reconciliation of this branch against the four canonical files. Read immediately after canonical `STABILIZATION_PROTOCOL.md` to see how this branch's planning maps to canonical scope.
8. `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` — what we are doing (rollout Phase 0–6, distinct from canonical Phase 0–7).
9. `ACCENTOS_GOVERNANCE_RECONCILIATION.md` — authority basics.
10. `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` — decisions.
11. `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` — measurement.
12. `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md` — what can go wrong.
13. `ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md` — what to do about it (in-branch authority for shell-v2 rollout freezes; canonical `STABILIZATION_PROTOCOL.md` STOP CONDITIONS apply to restructure scope).
14. `ACCENTOS_MULTI_SESSION_GOVERNANCE.md` — multi-agent rules.
15. `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md` — known internal disagreements.
16. `docs/design/test/*.md` — runbooks.

---

## 7. Future implementation consumers

The next layer (implementation/runtime) will consume this branch as input. Specifically:

| Implementation phase | Consumes |
|---|---|
| Phase 0 Stabilize (close WIP) | Freeze Snapshot, MASTER.md, WIP.md |
| Phase 1 Beachhead | Freeze Snapshot, Rollout Strategy §1–§10, Readiness System, daily_command_center checklist |
| Phase 2 Admin testing | Readiness System, Failure Scenarios F1/F2/F4 |
| Phase 3 Read-only live | Escalation Matrix, Readiness System, Captain-go protocol |
| Phase 4 Per-module reads | All test checklists (mgmt, pipeline, quotes, vendor, settings) |
| Phase 5 Smallest writes | Failure Scenarios F3, Coexistence §17, source-tag rule |
| Phase 6 Deprecate v1 | Rollout Strategy §3 Phase 6; 30-day cooldown rule |
| Multi-agent expansion | Multi-Session Constitution; Reconciliation; Index (this) |
| Incident response | Failure Scenarios; Freeze Protocol; Escalation Matrix decision flowchart |

---

## 8. Stability indicator

This branch is **stable for handoff** when:

- ✅ Index, Terminology, Contradictions, Freeze Snapshot all present.
- ✅ No spoke doc conflicts with another spoke doc (per Contradictions audit).
- ✅ The four canonical files (#8–#11) status is documented (present-elsewhere or to-be-merged).
- ✅ Phase 0 hard block (Anthropic-proxy WIP) noted.

This index does not assert that the branch is ready for execution — only that it is ready for *consumption* by the next planning or implementation phase.

---

*End of ACCENTOS_GOVERNANCE_INDEX.md — the spine.*
