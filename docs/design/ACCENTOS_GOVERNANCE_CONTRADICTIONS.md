# AccentOS Governance Contradiction Audit
> **Doc type:** Planning. Identification only — not resolution.
> **Method:** read every spoke planning doc on this branch + canonical-in-repo files; flag every place two artifacts disagree, double-count, or use language inconsistently.
> **Output:** a list of items with (a) location, (b) the disagreement, (c) recommended resolution path, (d) authority that should resolve it.
> **Rule:** this doc does not edit other docs. It only catalogs.

---

## 1. Active contradictions

### C1 — Rollout Strategy §0 / §11 vs. Reconciliation §1
- **Where:** `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §0 says four canonical files "do not exist." Reconciliation §1 says they exist canonically on another branch.
- **Disagreement:** state of the four canonical files.
- **Resolution path:** the rollout strategy was authored before the Captain correction. Reconciliation §15 lists the deltas; a single follow-up commit on `main` should land them. Until then, Reconciliation supersedes.
- **Resolves at:** Hub session, single commit.

### C2 — Freeze conditions in three places
- **Where:** Rollout Strategy §12, Escalation Matrix §2, Freeze Protocol §1.
- **Disagreement:** the lists overlap but are not byte-identical. Freeze Protocol §1 adds `index.html` ≥860KB and Anthropic-proxy reopened; Escalation Matrix §2 adds canonical-doc concurrent edit; Rollout Strategy §12 has the original list.
- **Resolution path:** authoritative source is the canonical `STABILIZATION_PROTOCOL.md` (other branch). Until merged, Freeze Protocol §1 is the most complete in-branch list. Rollout Strategy §12 should reference Freeze Protocol §1, not duplicate.
- **Resolves at:** Hub adoption pass; until then, Freeze Protocol §1 wins on this branch.

### C3 — Risk register duplicated
- **Where:** Rollout Strategy Appendix B has a 10-row risk table; Reconciliation §10 references "this doc §10" but no §10 exists in Reconciliation; canonical `GOVERNANCE_RISKS.md` exists on another branch.
- **Disagreement:** three potential locations for the risk register; one is dangling.
- **Resolution path:** `GOVERNANCE_RISKS.md` is canonical. Rollout Strategy Appendix B is *advisory inputs*. The "this doc §10" reference in Reconciliation should be removed or pointed at Failure Scenarios.
- **Resolves at:** Hub adoption pass.

### C4 — "Veto" used at two granularities
- **Where:** Readiness System §7 uses "veto" for sub-score floors; Escalation Matrix §1 implicitly treats Captain's authority as a veto without naming it.
- **Disagreement:** is Captain's "no-go" called a veto?
- **Resolution path:** Terminology defines veto as "a single check that turns GO into NO-GO." Captain authority qualifies. Recommend explicit cross-reference in Escalation Matrix §1.
- **Resolves at:** docs touch-up; non-blocking.

### C5 — Override authority asymmetry
- **Where:** Escalation Matrix §1 says per-user override add requires Captain; Freeze Protocol §6 (partial disablement table) says "per-user `deny`" is a layer the system uses for containment, with implied Primary-session execution during incidents.
- **Disagreement:** can a Primary session add a `deny` override during a P0?
- **Resolution path:** Escalation Matrix §7 (emergency authority) includes "add a `deny` per-user override for any user actively losing data." This is consistent with Freeze Protocol §6 if read as "during P0, Primary may; otherwise Captain only." Recommend Escalation Matrix §1 cite §7 to make the carve-out explicit.
- **Resolves at:** docs touch-up; non-blocking.

### C6 — Score thresholds Phase mapping vs. main thresholds table
- **Where:** Readiness System §7 says `→ live` requires composite ≥8.5 + sub-score floors. Readiness System §9 (per-phase matrix) repeats 8.5 for Phase 3/4 but also says Phase 5 requires ≥9.0.
- **Disagreement:** Phase 5 floor is 9.0 (only stated in §9), but §7 has no row for "writes" — its table tops out at `→ live`.
- **Resolution path:** add a Phase-5/writes row to §7 with composite ≥9.0 and a stricter R floor (rollback confidence on writes). Until added, §9 is authoritative.
- **Resolves at:** Spoke (this branch) follow-up if requested; else Hub adoption.

### C7 — "Bake period" duration ambiguity
- **Where:** Reconciliation §8 G10 says "Phase-specific bake duration." Rollout Strategy §3 specifies 7 days for Phase 2, 2–3 weeks for Phase 3, ≥2 weeks for Phase 5 writes. Readiness System §11 says "scored within 7 days requires re-scoring."
- **Disagreement:** are the bake period and the re-scoring window the same? They are different concepts but easy to conflate.
- **Resolution path:** Terminology should add **Bake period** = "calendar time at a mode without P0/P1 before advance" and distinguish from re-score window = "freshness of a readiness score." Add to Terminology §1.
- **Resolves at:** Spoke follow-up (Terminology edit) — small but worth doing before freeze.

### C8 — `MASTER.md` §3 module list vs. `module_modes.json`
- **Where:** `MASTER.md` §3 lists Live modules in a table. `module_modes.json` is the live state. Spoke docs reference both.
- **Disagreement:** these can drift between sessions.
- **Resolution path:** declare `module_modes.json` authoritative for live mode state; `MASTER.md` §3 is advisory and updated session-end. Already implicit in Index §4 authority order — recommend explicit note.
- **Resolves at:** Hub adoption pass; non-blocking for this branch.

### C9 — Authority for `→ deprecated`
- **Where:** Escalation Matrix §1 includes "Phase advance to `live`" as Captain. Phase advance to `deprecated` is not listed.
- **Disagreement:** ambiguous authority for the `live → deprecated` flip.
- **Resolution path:** treat `→ deprecated` as Captain authority (it is user-visible in scope of removal). Add explicit row to Escalation Matrix §1.
- **Resolves at:** Spoke follow-up or Hub adoption.

### C10 — Worker authority vs. emergency
- **Where:** Escalation Matrix §7 forbids Primary from `wrangler deploy` even during P0. Freeze Protocol §9 says worker rollback is Captain only. Failure Scenarios F1 (failed shell injection) does not involve worker. F1 + worker overlap is unclear if a P0 implicates the worker.
- **Disagreement:** if a P0 is in the worker, what is Primary's recourse during Captain unreachable?
- **Resolution path:** acknowledge that worker P0 + Captain unreachable = a wait-state. The system has no Primary recovery path here. Recommend documenting this gap explicitly in Escalation Matrix §7 ("known unaddressable scenarios"). The mitigation is operational: keep worker surface narrow, redeploy carefully, never let `2dca2a6`-style WIP linger.
- **Resolves at:** docs touch-up; underlying constraint is intentional (credentials don't live with Primary).

### C11 — "Snapshot" verb vs. noun
- **Where:** Rollout Strategy §10 mentions "curl snapshot" pre/post deploy. Freeze Snapshot doc title uses "snapshot" as the entire-governance summary. SYSTEM_STATE.md is also described as a snapshot.
- **Disagreement:** "snapshot" used for three different things.
- **Resolution path:** Terminology update. Use **curl snapshot** (pre/post-deploy diff), **system state** (one-page system summary, canonical), **handoff packet** (Freeze Snapshot doc). Add to Terminology when next edited.
- **Resolves at:** Spoke follow-up (Terminology) — non-blocking.

### C12 — Module key naming convention
- **Where:** Test checklists use `pipeline_read_v2`, `quotes_read_v2`, etc. Rollout Strategy §6 mentions "Pipeline read" without committing to a key. `MODULE_MODES.md` has no naming convention rule.
- **Disagreement:** ad-hoc key invention risks collision with existing v1 keys.
- **Resolution path:** establish convention `<area>_<surface>_<version>` (e.g., `pipeline_read_v2`). Document in `MODULE_MODES.md` (canonical, requires Captain go).
- **Resolves at:** Captain (canonical edit).

### C13 — Mobile readiness threshold mismatch
- **Where:** Readiness System §3 says M ≥ 7 to leave `building`, M ≥ 9 for `→ live`. Rollout Strategy §16.6 lists mobile gates without a numeric M score. Freeze Protocol §1 lists `index.html` size but no mobile trigger.
- **Disagreement:** mobile is gated by M score in one place and by qualitative gates in another.
- **Resolution path:** Rollout Strategy §16.6 enumerates the components that build M score. They should be cross-referenced explicitly. No semantic conflict, only navigational.
- **Resolves at:** docs touch-up; non-blocking.

### C14 — Override storage authority during multi-device era
- **Where:** Escalation Matrix says per-user overrides are localStorage v1 (Owner machine). Multi-Session Constitution Article VI lists `accentos_user_overrides` as Owner-machine. F8 prevention recommends migrating to Supabase (M30).
- **Disagreement:** none, but the timing of M30 is undefined and Phase 4+ depends on it for cross-device early access.
- **Resolution path:** flag M30 as a Phase-4 prerequisite in `GOVERNANCE_RISKS.md` (canonical, other branch).
- **Resolves at:** Captain via canonical edit.

### C15 — Captain go logged "where"
- **Where:** Multiple docs say Captain go must be "logged" — Escalation Matrix §1, Readiness System §5/§11, Reconciliation §11. Some say SESSION_LOG, some are silent.
- **Disagreement:** is SESSION_LOG the only acceptable log?
- **Resolution path:** SESSION_LOG.md is the operational log per `MASTER.md`. Standardize all "logged" references to "logged in SESSION_LOG.md."
- **Resolves at:** Spoke or Hub touch-up; non-blocking.

---

## 2. Duplicate-concept inventory

These are not contradictions but redundancies. Convergence does not require eliminating them — only being aware.

| Concept | Appears in | Recommendation |
|---|---|---|
| Freeze trigger list | Rollout §12, Escalation §2, Freeze Protocol §1 | Treat Freeze Protocol §1 as the in-branch authority; others reference. |
| Risk register | Rollout Appendix B, `GOVERNANCE_RISKS.md` (canonical) | `GOVERNANCE_RISKS.md` authoritative; Appendix B advisory. |
| Rollback authority table | Escalation §9, Freeze Protocol §3 | Escalation §9 is the compact reference. |
| Authority precedence | Reconciliation §1, Escalation §5, Index §4 | Index §4 is the navigational; others are scoped. |
| Module mode glossary | `MODULE_MODES.md`, Terminology §4 | `MODULE_MODES.md` authoritative; Terminology §4 mirrors. |
| Phase definition | Rollout §3, Readiness §9 | Rollout §3 authoritative; Readiness §9 maps scores to phases. |

---

## 3. Inconsistent escalation language

| Doc | Phrase | Recommended |
|---|---|---|
| Escalation Matrix §3 | "escalates upward" | "escalates" (upward is implicit per Article I) |
| Reconciliation §6 | "must escalate to Captain" | OK |
| Constitution Article IX | "escalation during session conflicts" | OK |
| Freeze Protocol §10 | "Captain go to resume" | OK |
| Failure Scenarios F10 | "escalate to Captain" | OK |

Mostly consistent; only one minor phrasing.

---

## 4. Rollout ambiguity

| Item | Ambiguity | Resolution path |
|---|---|---|
| Phase 1 module key | Strategy says "Daily Command Center" — not a key | Use `daily_command_center` (already in test checklist) |
| Phase 4 ordering | Strategy lists by name, not key | Add module-key column in §6 sequencing diagram |
| Phase 5 starting module | "Smallest writes first" — undefined | Recommend Captain go on the first write surface (likely a quote line edit) before starting Phase 5 |
| Phase 6 deletion timing | "30 days zero usage, then deletable" — by whom? | Add to Escalation Matrix §1: "v1 code deletion = Captain authority" |

---

## 5. Contradictory freeze semantics (none)

No contradictions found between freeze docs after C2/C5 noted above. Freeze always allows rollback; halt does not. Both docs that touch freeze (Escalation Matrix §2, Freeze Protocol §1) agree on this. **No resolution required.**

---

## 6. Scoring inconsistencies (already in §1)

C6 (Phase 5 floor in two tables), C13 (mobile cross-reference), C7 (bake vs. re-score window). All in §1.

---

## 7. Ownership ambiguity

| Surface | Ambiguity | Resolution path |
|---|---|---|
| `js/shared/*` | New surface, no canonical owner | Treat as Hub-owned, Captain-approved on creation |
| `docs/design/test/*.md` | Spoke-authored; who maintains? | Spoke or Hub; whoever last touched the corresponding module checklist |
| `?v=<commit-sha>` cachebust convention | Not enumerated as a surface | Implicit Hub responsibility; mention in Multi-Session Constitution Article VI next pass |
| Per-user override Supabase migration (M30) | Owner unspecified | `MODULE_OWNERSHIP_MAP.md` (canonical) should add row |

---

## 8. Resolution priority (recommended order to clean up)

If the next session does only one cleanup pass, do these in order:

1. **C1** — drop the "do not exist" framing in Rollout Strategy §0/§11 (1 commit).
2. **C2** — replace Rollout Strategy §12 list with a one-line reference to Freeze Protocol §1 (1 commit).
3. **C3** — re-frame Rollout Strategy Appendix B as advisory; remove the dangling "this doc §10" in Reconciliation (1 commit).
4. **C9** — add `→ deprecated` row to Escalation Matrix §1 (1 commit).
5. **C12** — propose module-key naming convention to Captain for canonical edit.
6. **C7, C11** — Terminology touch-ups (1 commit).
7. **C6, C13** — scoring cross-references (1 commit).
8. **C5, C10, C15** — minor doc-touch-ups (1 commit).

All of the above are single-commit, single-file (or single-doc) edits. None require Captain except C12.

---

## 9. What is *not* contradictory (positive findings)

- The five-class authority model (Captain / Hub / Spoke / Owner-role / per-module owner) is consistent across all spoke docs.
- The additive-rollback principle is universal — no doc proposes destructive recovery anywhere.
- The single-writer rule for canonical files is unambiguous.
- The default-safe principle ("when in doubt, no state change") is consistently applied.
- No doc proposes a global kill switch; all defer to layered partial disablement.
- `module_modes.json` as the rollout instrument is uncontested across all docs.
- Phase ordering (0→6) is consistent across Rollout Strategy, Readiness System §9, and Index §7.

---

*End of ACCENTOS_GOVERNANCE_CONTRADICTIONS.md — identification, not resolution.*
