# AccentOS Captain Decision Queue
> **Doc type:** Executive operational queue. The single ranked list of decisions only Captain can make.
> **Use:** read top-down; execute or defer in order.
> **Updated by:** Hub session at session-end (one-line additions); Captain on execution (mark resolved).

---

## Queue (ordered by recommended execution sequence)

### Q1 — R-02 worker-proxy mitigation
- **Decision:** authorize `wrangler deploy` of commit `2dca2a6` from local machine + verify Parse Notes returns 200.
- **Why it matters:** the single shared hard block recognized by both governance scopes (canonical R-02 + rollout Phase-0 freeze). Quote Generator AI Parse is broken in production until resolved.
- **Urgency:** HIGH — blocks rollout Phase 0 → 1 advance and any worker-touching work.
- **Blocking impact:** rollout Phase 1, all shell-v2 modules that consume Anthropic, all canonical Phase 1 hardening exit criteria.
- **Recommended order:** **first.** Independent of merge status.
- **Estimated time:** 5–10 min (`wrangler deploy` + browser smoke test).
- **Risk:** low. The proxy code is already on the branch; deploy is mechanical.
- **Rollback difficulty:** trivial (`wrangler deploy` of prior version from local).

### Q2 — Adoption merge: canonical governance branch → `main`
- **Decision:** merge `claude/governance-snapshot-prep-k3dBs` to `main` (or confirm already merged).
- **Why it matters:** per multi-session constitution Article IV, canonical-doc PRs merge before planning PRs that depend on them. Many references in this rollout-planning branch (§0, §0.1, §3, §12, Appendix B, Index §6) point at canonical files; without merge, those references point at unmerged content.
- **Urgency:** MEDIUM — recommended before Q3 but not strictly required.
- **Blocking impact:** referential integrity of this branch's docs after Q3.
- **Recommended order:** before Q3.
- **Estimated time:** 5 min (PR review + merge).
- **Risk:** low. Canonical files are documentation only; zero runtime effect.
- **Rollback difficulty:** trivial (`git revert` of merge commit).

### Q3 — Adoption merge: rollout-planning branch → `main`
- **Decision:** merge `claude/accentos-rollout-planning-UTElf` (HEAD `1cb85b6` or descendant) to `main`.
- **Why it matters:** makes the 22 spoke planning files (and 7 test checklists) readable from `main` for all future sessions. Without merge, every future session must `git fetch` this branch to consult governance.
- **Urgency:** MEDIUM. Pure documentation merge; zero runtime effect.
- **Blocking impact:** future-session onboarding cost; some governance references point at this branch by name.
- **Recommended order:** after Q2.
- **Estimated time:** 5 min.
- **Risk:** low. Documentation only.
- **Rollback difficulty:** trivial (`git revert` of merge commit). See `ACCENTOS_MERGE_ADOPTION_CHECKLIST.md` §7.

### Q4 — D-priority canonical edits
- **Decision:** on a `claude/governance-*` branch, edit canonical `MODULE_OWNERSHIP_MAP.md` (add `js/shell_v2/*.js` STAY row) and canonical `MODULE_MODES.md` (add module-key naming convention `<area>_<surface>_<version>`).
- **Why it matters:** closes contradictions C-Δ-7 and C12; removes the C8 footnote dependency in rollout-strategy §5.
- **Urgency:** LOW. Footnotes cover the gap until executed.
- **Blocking impact:** none — non-blocking polish.
- **Recommended order:** after Q3, before Q5.
- **Estimated time:** 10 min for both edits (one commit per file per multi-session constitution Article X).
- **Risk:** low. Documentation only.
- **Rollback difficulty:** trivial.

### Q5 — Rollout Phase 1 authorization (shell beachhead)
- **Decision:** explicit "rollout Phase 1 may begin" entry in `SESSION_LOG.md`, naming `daily_command_center` as the beachhead module.
- **Why it matters:** the Captain go gate per `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` §1 and `ACCENTOS_MERGE_ADOPTION_CHECKLIST.md` §8. Without this, no Hub session may begin shell-v2 work.
- **Urgency:** depends on shell-v2 timeline preference. Q1–Q4 unblock the operational state; Q5 starts the actual work.
- **Blocking impact:** rollout Phase 1 cannot start without Q5; everything downstream follows.
- **Recommended order:** after Q1 (mandatory) and Q2/Q3 (recommended). Q4 is parallel.
- **Estimated time:** 1 min (one SESSION_LOG entry).
- **Risk:** low for the entry itself; the work it authorizes is governed by readiness scoring + golden-path checklists.
- **Rollback difficulty:** trivial — Captain can revoke authorization at any time by a follow-up SESSION_LOG entry.

### Q6 — Shell-v2 implementation kickoff session
- **Decision:** authorize a Hub session on `claude/feat-shell-v2-beachhead-*` (or fast-forward to `main`) to scaffold `js/shell_v2/daily_command_center.js`, add `daily_command_center` entry to `module_modes.json` at `building`, and run the golden-path checklist on staging.
- **Why it matters:** this is the first runtime change of the shell-v2 rollout. Distinct from Q5 (authorization) and from the work itself (executed by Hub).
- **Urgency:** dependent on Q5 plus operational readiness gauges per `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` §8.
- **Blocking impact:** all subsequent rollout Phase 1–6 work.
- **Recommended order:** after Q5; only if operational confidence ≥ 6.
- **Estimated time:** 1–2 sessions for scaffold + bake.
- **Risk:** medium. First runtime change carries F1 (failed shell injection) and F4 (role visibility) class risks; mitigated by `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md` and rollback dry-run gate G6.
- **Rollback difficulty:** low. One `module_modes.json` flip-back per `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` §9.

### Q7 — Mobile/PWA Session A kickoff
- **Decision:** authorize a Hub session to begin mobile-readiness work for a beachhead module per `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §15 and §16.6.
- **Why it matters:** Captain's primary device is iPhone (per `MASTER.md` §2). Mobile parity at 390px is a hard checkpoint before any module leaves `building`.
- **Urgency:** in parallel with Q6 (mobile parity must hold before `→ testing`).
- **Blocking impact:** rollout Phase 2 advance depends on mobile readiness.
- **Recommended order:** parallel to Q6, before any rollout `→ testing` flip.
- **Estimated time:** 1 session for scaffolding + 1 week of bake.
- **Risk:** low. Mobile work is additive; CSS guards are reversible.
- **Rollback difficulty:** trivial (CSS guard removal).

### Q8 — Future canonical-doc work (deferred)
- **Decision:** schedule a future canonical pass for: `SYSTEM_STATE.md` re-snapshot after rollout Phase 1 ships; `GOVERNANCE_RISKS.md` updates as R-02 closes and new rollout-scope risks surface.
- **Why it matters:** keeps the canonical baseline current for downstream sessions.
- **Urgency:** LOW. Quarterly cadence acceptable.
- **Blocking impact:** none.
- **Recommended order:** after Q6 ships.
- **Estimated time:** 1 session per pass.
- **Risk:** low. Documentation.
- **Rollback difficulty:** trivial.

---

## Execution dependency graph

```
Q1 (worker proxy) ───────────────┐
                                 │
Q2 (canonical merge) ──► Q3 ─────┼──► Q5 (rollout-Phase-1 authorize)
                                 │              │
Q4 (D-priority) ─────────────────┘              ▼
                                              Q6 (shell-v2 kickoff)
                                                 │
                                                 ├──► Q7 (mobile)
                                                 │
                                                 └──► Q8 (canonical updates)
```

Q1 is on the critical path. Q5 is the gate to all execution. Everything else is sequencing.

---

## Captain queue protocol

- **Adding to queue:** Hub or Spoke session may append a new Q-item at session-end, ranked by impact. New items default to LOW urgency unless argued otherwise in SESSION_LOG.
- **Resolving an item:** Captain marks the section "✅ Resolved YYYY-MM-DD" with one-line resolution note + linked commit hash. Resolved items remain in the file for audit but are visually demoted.
- **Reordering:** Captain only.
- **Removal:** never. Resolved items archive in place.

---

## Snapshot at branch freeze (2026-05-09)

| Item | Status | Owner | Estimated time |
|---|---|---|---|
| Q1 R-02 worker proxy | OPEN | Captain | 5–10 min |
| Q2 canonical merge | OPEN | Captain | 5 min |
| Q3 rollout-planning merge | OPEN | Captain | 5 min |
| Q4 D-priority canonical edits | OPEN | Captain | 10 min |
| Q5 rollout Phase 1 authorize | OPEN | Captain | 1 min |
| Q6 shell-v2 kickoff | DEFERRED until Q1+Q5 | Hub under Captain | 1–2 sessions |
| Q7 mobile Session A | DEFERRED until Q6 | Hub under Captain | 1 session + 1 week bake |
| Q8 canonical updates | DEFERRED until Q6 ships | Captain or Hub | 1 session per pass |

Total Captain time on critical path (Q1–Q5): ~30 min. After that, Hub sessions take over.

---

*End of ACCENTOS_CAPTAIN_DECISION_QUEUE.md — executive operational queue.*
