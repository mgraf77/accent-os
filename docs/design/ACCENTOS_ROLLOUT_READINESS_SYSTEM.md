# AccentOS Rollout Readiness System
> **Doc type:** Planning only
> **Purpose:** turn rollout decisions into measurable scores, not feelings.
> **Frame:** weighted, observable, computable in <5 minutes per module.

A rollout decision is GO when the relevant composite score ≥ threshold AND no veto is active. Otherwise NO-GO.

---

## 1. The five sub-scores

Each module gets five sub-scores, 0–10. They roll up into a composite.

| Sub-score | What it measures | Weight |
|---|---|---|
| **S — Survivability** | Can we roll back fast? Is the blast radius bounded? | 25% |
| **M — Mobile readiness** | Is iPhone Safari 390px usable? | 15% |
| **W — Workflow readiness** | Does the user-visible workflow work end-to-end? | 25% |
| **G — Governance readiness** | Are gates, owners, freezes clear? | 15% |
| **R — Rollback confidence** | Has rollback been rehearsed and verified? | 20% |

Composite = `0.25·S + 0.15·M + 0.25·W + 0.15·G + 0.20·R`. Range 0–10.

---

## 2. Survivability score (S, 0–10)

| Component | Points | Source |
|---|---|---|
| Module mounts in `js/shell_v2/<name>.js` (no inline) | 2 | file system |
| Single dynamic `import()` level | 1 | code review |
| `mount`/`unmount` contract honored, idempotent | 2 | code review + manual test |
| Module writes only inside `rootEl` (no body portals) | 1 | manual test |
| Listeners auto-cleaned on `unmount` | 1 | DevTools listener count delta |
| `source: 'shell_v2'` tag on every write (or N/A read-only) | 1 | audit_log sample |
| No new sessionStorage / localStorage keys | 1 | code review |
| Module size <80KB minified | 1 | `wc -c` |

S ≥ 8 required for `→ live`. S ≥ 6 for `→ testing`.

---

## 3. Mobile readiness score (M, 0–10)

| Component | Points | Source |
|---|---|---|
| 390px viewport: zero horizontal scroll on default view | 2 | DevTools device mode |
| All interactive targets ≥44×44pt | 2 | manual measure on 3 sample targets |
| No `position: fixed` overlay obscuring primary content | 1 | manual |
| Cold mount <2.5s on throttled 4G | 1 | DevTools throttling |
| Captain confirmation "usable on iPhone" in SESSION_LOG | 2 | SESSION_LOG.md |
| Sub-tab strip / overflow menus reachable | 1 | manual |
| No hover-only affordances | 1 | code review |

M ≥ 7 required to leave `building`. M ≥ 9 for `→ live`.

---

## 4. Workflow readiness score (W, 0–10)

| Component | Points | Source |
|---|---|---|
| Golden-path checklist passes (10/10) | 4 | `docs/design/test/<module>.md` |
| Visual parity with v1 (numbers, layout, design tokens) | 2 | side-by-side diff |
| All 5 roles checked via per-user override | 2 | manual on Owner machine |
| Navigation continuity (deep link, reload, back/forward) | 1 | manual |
| No console errors during golden path | 1 | DevTools |

W ≥ 9 required for `→ live`. W ≥ 7 for `→ testing`.

---

## 5. Governance readiness score (G, 0–10)

| Component | Points | Source |
|---|---|---|
| Module appears in `MODULE_OWNERSHIP_MAP.md` (canonical) | 2 | doc check |
| Module key present in `module_modes.json` | 1 | `jq` |
| Reconciliation rules satisfied (no canonical conflict) | 2 | `ACCENTOS_GOVERNANCE_RECONCILIATION.md` §11–§12 |
| No active freeze trigger | 2 | `STABILIZATION_PROTOCOL.md` |
| Captain go logged for `→ live` (or N/A) | 2 | SESSION_LOG.md |
| Single-writer rule respected (no concurrent canonical edits) | 1 | branch listing |

G must equal 10 for `→ live`. G ≥ 7 for `→ testing`.

---

## 6. Rollback confidence score (R, 0–10)

| Component | Points | Source |
|---|---|---|
| Rollback flip dry-rehearsed on staging | 3 | SESSION_LOG entry with timestamp |
| Inverse-flip diff included in commit body | 2 | git log |
| Time-to-rollback ≤ target (table in escalation §9) | 2 | rehearsal timing |
| Rollback does not depend on Captain availability (for non-`live` modules) | 1 | governance check |
| `module_modes.json` parses after rollback | 1 | `jq` |
| Audit log sufficient to identify writes for replay/revert | 1 | sample query |

R ≥ 8 required for `→ live`. R ≥ 6 for `→ testing`.

---

## 7. Composite score → go/no-go thresholds

| Target phase | Composite minimum | Sub-score floors | Veto checks |
|---|---|---|---|
| `building` (initial mount, Owner-only) | 5.0 | S≥4, R≥4 | freeze clear |
| `→ testing` | 7.0 | S≥6, M≥7, W≥7, G≥7, R≥6 | freeze clear; 7d at `building` clean |
| `→ live` | 8.5 | S≥8, M≥9, W≥9, G=10, R≥8 | freeze clear; Captain go logged; 7d at `testing` clean |
| `→ deprecated` | n/a | n/a | 30d zero usage |

**Veto rule:** any sub-score floor unmet = NO-GO regardless of composite.

---

## 8. Operational confidence score (overall system, not per-module)

A system-wide health gauge, computed at session start. Range 0–10.

| Component | Points | Source |
|---|---|---|
| `index.html` size headroom (<800KB) | 2 | `wc -c` |
| WIP empty | 1 | `WORK_IN_PROGRESS.md` |
| Days since last green deploy <2 | 1 | git log |
| Active P0 = 0 | 2 | reports |
| Active P1 ≤ 2 | 1 | reports |
| Modules in `building` ≤ 5 | 1 | `module_modes.json` |
| Open `claude/*` branches ≤ 4 | 1 | `git branch -r` |
| Override count vs. justified delta = 0 | 1 | manual audit |

Operational confidence < 6 = freeze candidate. Reported in session-start status block.

---

## 9. Per-phase scoring matrix (Phase 1–6 mapping)

| Phase | Scope of score | Threshold | Notes |
|---|---|---|---|
| Phase 1 Beachhead | Per beachhead module | 5.0 | First mount; tolerated low until baked |
| Phase 2 Admin testing | Composite per module ≥ 7.0 | 7.0 | 7d clean at `building` required |
| Phase 3 Read-only live | Per module ≥ 8.5 | 8.5 | Captain go required |
| Phase 4 Per-module reads | Per module ≥ 8.5 | 8.5 | One module at a time |
| Phase 5 Smallest writes | Per write surface ≥ 9.0 | 9.0 | Higher bar; data integrity |
| Phase 6 Deprecate v1 | n/a | 30d zero hits | Time-based, not score-based |

---

## 10. How to compute (reference, not runtime)

A primary session scoring a module before a flip:

```
1. Open the module's golden-path checklist; run it.
2. Open this doc; mark each component point in SESSION_LOG.
3. Compute sub-scores (sum of points per sub-section).
4. Compute composite = 0.25·S + 0.15·M + 0.25·W + 0.15·G + 0.20·R.
5. Check sub-score floors for target phase.
6. Check vetoes (freeze, Captain go, etc.).
7. Decide GO / NO-GO and log.
```

This is manual today. Auto-tooling is out of scope until post-Phase 6.

---

## 11. Anti-gaming rules

- Sub-score components are binary or measured — not estimated. "I think it's fine" is not a value.
- Components scored without evidence default to 0.
- Captain may downgrade any score with reason logged. Captain cannot upgrade beyond evidence.
- A module that was scored within 7 days requires re-scoring before another flip.
- No module advances on the same day it was first scored.

---

## 12. Failure mapping

The five sub-scores map to failure scenarios in `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md`:

| Score | Primarily prevents |
|---|---|
| S Survivability | F1 (failed shell injection), F2 (lazy-load partial), F7 (`module_modes` corruption) |
| M Mobile | F5 (mobile/PWA regressions) |
| W Workflow | F3 (state divergence), F4 (role visibility), F8 (partial drift), F9 (stale client) |
| G Governance | F10 (cross-session conflicts), and meta-prevention via gates |
| R Rollback | F6 (rollback failures) |

If a failure category is recurring, the corresponding sub-score's components are tightened in the next revision of this doc.

---

*End of ACCENTOS_ROLLOUT_READINESS_SYSTEM.md — planning only.*
