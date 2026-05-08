# AccentOS Governance Escalation Matrix
> **Doc type:** Planning only
> **Sibling docs:** `ACCENTOS_GOVERNANCE_RECONCILIATION.md`, `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md`, `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md`
> **Frame:** operational clarity during incidents. Not theoretical governance.

A single page so an on-call session can resolve in seconds, not minutes.

---

## 1. Authority table (who decides what)

| Action | Authorizer | Executor | Default if unreachable |
|---|---|---|---|
| Phase advance to `live` | Captain | Primary session | NO-GO |
| Phase advance internal (`building`↔`testing`) | Primary session | Primary session | Hold at lower mode |
| Per-user override add (`allow`/`deny`) | Captain (Owner UI) | Captain | NO add |
| Per-user override clear | Captain or Primary | Either | Leave as-is |
| `module_modes.json` flip back (rollback) | Primary session | Primary session | EXECUTE rollback (default = safe) |
| Schema change (any DDL) | Captain | Captain (manual SQL) | NO-GO |
| Worker route add/change | Captain | Captain (`wrangler deploy`) | NO-GO |
| `git revert` on `main` | Captain | Either (Captain authorizes) | EXECUTE if P0 (default = safe) |
| Force-push to `main` | **Forbidden** | n/a | Refuse |
| Canonical-doc edit | Captain | Primary session on dedicated branch | NO edit |
| Spoke planning doc edit | Spoke session | Spoke session | n/a |
| Freeze | Captain or any session detecting trigger | Any | EXECUTE freeze (default = safe) |
| Unfreeze | Captain only | Captain | NO unfreeze |
| Production cutover (deploy window) | Primary session | Cloudflare auto | NO during showroom peak |
| Emergency rollback (P0 active) | Primary session | Primary session | EXECUTE (no Captain wait) |

**Default-safe principle:** when unsure, the default is the action that *removes* state change. Freeze, rollback, hold — never advance, never overwrite.

---

## 2. What blocks rollout

A rollout phase advance is blocked by **any one** of:

- 🔴 Open WIP in `WORK_IN_PROGRESS.md`.
- 🔴 Active P0 anywhere in the system within last 24h.
- 🔴 Active P1 ≥3 within last 24h.
- 🔴 `module_modes.json` failed parse on `main` (any time since last green deploy).
- 🔴 Cloudflare last deploy red.
- 🔴 Supabase outage / MCP-permissions degradation blocking SQL workflow.
- 🔴 Canonical governance doc currently being edited by another session (single-writer rule).
- 🔴 Conflicting flip pending on a different branch for the same module key.
- 🟡 Showroom peak hours (Sat 10:00–15:00 CT) — soft block; Captain may waive.
- 🟡 Active external-comm crisis (MAP, GMC, vendor escalation) — soft block.
- 🟡 Captain unreachable for `→ live` advancement.

A 🔴 = no advance until cleared. A 🟡 = Captain waiver in SESSION_LOG.

---

## 3. Escalation hierarchy

```
Level 0: Spoke session (planning) ── never resolves; only escalates upward
Level 1: Primary session (Claude on main) ── resolves within authority §1; otherwise →
Level 2: Captain (Michael) ── resolves all governance decisions
Level 3: Owners (Paul / Patrick) ── consulted only for spend, vendor relationships, strategy outside Captain delegation
```

Escalation rules:

- A spoke session cannot escalate to L3 directly. It must go through L1 or L2.
- L1 cannot bypass L2 to reach L3 except for P0 incidents that L2 explicitly delegated.
- L2 (Captain) can intervene at any level at any time.
- Skipping a level requires writing the reason in SESSION_LOG.

---

## 4. Conflict resolution chain

When two artifacts disagree:

1. **Canonical wins over non-canonical.** (Reconciliation §1.)
2. **`MASTER.md` §12 hard rules win over everything operational.**
3. **Most-recent merged-to-`main` wins** when both are non-canonical.
4. **Single-writer rule:** if both are canonical and on different branches → freeze both → escalate to Captain.
5. **Document the resolution** in SESSION_LOG with both commit hashes and the chosen winner.

---

## 5. Canonical document precedence

In descending precedence:

1. `MASTER.md` §12 — Hard Rules & Constraints (supreme; spend, vendor, design, code patterns)
2. `STABILIZATION_PROTOCOL.md` — freeze rules (canonical, other branch)
3. `GOVERNANCE_RISKS.md` — risk register (canonical, other branch)
4. `MODULE_OWNERSHIP_MAP.md` — ownership (canonical, other branch)
5. `SYSTEM_STATE.md` — system snapshot (canonical, other branch)
6. `MODULE_MODES.md` — rollout state-machine spec (locked)
7. `module_modes.json` — live rollout state (data)
8. `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` — rollout phases (this branch)
9. `ACCENTOS_GOVERNANCE_RECONCILIATION.md` — reconciliation rules (this branch)
10. `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` (this doc)
11. `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md`
12. `ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md`
13. `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md`
14. `ACCENTOS_MULTI_SESSION_GOVERNANCE.md`
15. `MASTER.md` non-§12 sections
16. `BUILD_PLAN_*` files
17. `BUILD_INTELLIGENCE.md`
18. `WORK_IN_PROGRESS.md`
19. `SESSION_LOG.md`

If two same-precedence docs disagree → §4 chain.

---

## 6. Production-stop conditions

Production stop = no commits to `main`, no flips, no Cloudflare deploys (auto-deploy is naturally paused if `main` is paused).

Triggers:

- 🔴 Active P0 (data loss, privilege escalation, Owner lockout).
- 🔴 Captain explicit "stop production."
- 🔴 Three consecutive deploys red.
- 🔴 Supabase project `hsyjcrrazrzqngwkqsqa` in incident state.
- 🔴 `module_modes.json` parse failure unfixed > 5 minutes after detection.

Resume = Captain explicit "resume" + SESSION_LOG entry naming the cleared trigger.

---

## 7. Emergency rollback authority (P0 in-progress)

When a P0 is active and Captain is unreachable, the primary session has standing emergency authority to:

1. Flip the offending module to a more restrictive mode (`live → testing`, `testing → building`, `building → idea_only`).
2. `git revert` the most recent commit if it caused the P0.
3. Add a `deny` per-user override for any user actively losing data.
4. Push an `--allow-empty` commit to force a Cloudflare redeploy.

Emergency authority does NOT extend to:

- ❌ Schema changes (any DDL).
- ❌ Worker `wrangler deploy`.
- ❌ Force push to `main`.
- ❌ Editing canonical governance docs.
- ❌ Multi-module flips in one commit.
- ❌ Adding new modules to `module_modes.json`.

After exercising emergency authority: notify Captain in SESSION_LOG within the same session.

---

## 8. Shell-v2 freeze conditions

Specific to shell-v2 rollout (subset of §2 with shell-v2 specifics):

- 🔴 Any `js/shell_v2/*.js` file fails to load on production for >5 min.
- 🔴 v2 write tagged `source: 'shell_v2'` appears for a record type still in v2-read-only phase.
- 🔴 `mount(rootEl, ctx)` contract violated (module writes outside `rootEl`, leaks listeners across mounts).
- 🔴 Anthropic-proxy WIP bug reopened.
- 🔴 `index.html` size ≥860KB (within 40KB of hard limit).
- 🟡 Modules in `building` ≥9 (rollout congestion).
- 🟡 Branches `claude/*` open ≥5 (multi-session congestion).

---

## 9. Rollback authority (compact reference)

| Surface | Authority | Mechanism | Time-to-rollback target |
|---|---|---|---|
| `module_modes.json` flip | Primary | Single JSON edit + commit | <2 min |
| Per-user override | Captain (or Primary in P0) | localStorage edit on Owner machine | <1 min |
| `main` revert (single commit) | Captain (or Primary in P0) | `git revert` + push | <3 min |
| Worker | Captain | `wrangler deploy` of prior commit from local | <10 min |
| Schema | Captain | Manual reverse SQL in Supabase Editor | <15 min |
| Cache stalemate | Either | Bump `?v=<sha>` cachebust | <2 min |

**Rule:** rollback is always additive. Never `reset --hard`. Never force-push. Recovery time targets are budgets — exceeding them triggers escalation.

---

## 10. Decision flowchart (incident triage)

```
┌─────────────────────────────────────┐
│ Symptom reported / detected          │
└──────────────────┬───────────────────┘
                   ▼
        Is data at risk (write,    ── YES ──▶ P0 path:
        privilege, lockout)?                 1) Emergency rollback (§7)
                   │                          2) Notify Captain
                   │ NO                       3) SESSION_LOG entry
                   ▼
        Is a `live` module        ── YES ──▶ P1 path:
        broken for ≥1 role?                  1) Flip to `testing`
                   │                          2) Investigate
                   │ NO                       3) Captain notified at next interval
                   ▼
        Is a `testing` module     ── YES ──▶ P2 path:
        broken for Admin?                    1) Flip to `building`
                   │                          2) Fix forward
                   │ NO                       3) Log only
                   ▼
        Is a `building` module    ── YES ──▶ P3 path:
        broken for Owner?                    1) Fix in place (Owner-only blast)
                   │                          2) Log only
                   │ NO
                   ▼
                Cosmetic / non-blocking — fix in next session
```

---

*End of ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md — planning only.*
