# AccentOS Rollout Freeze + Kill Protocol
> **Doc type:** Planning only. Companion / mirror to canonical `STABILIZATION_PROTOCOL.md` (other branch).
> **Purpose:** survivability-first procedures for halting, containing, and recovering.
> **Frame:** few rules, fast execution, clear authority.

---

## 1. Freeze triggers

A freeze halts: `module_modes.json` flips, shell-v2 commits, code commits to `main`. It does **not** halt rollback commits — rollback is always available.

🔴 **Hard freeze (any one):**
- Active P0 (data loss, privilege escalation, Owner lockout).
- `module_modes.json` parse failure on `main` unfixed >5 minutes.
- Cloudflare last 2 deploys both red.
- Supabase project incident.
- Anthropic-proxy WIP bug reopened.
- `index.html` ≥860KB.
- Two canonical-doc branches edited in parallel.

🟡 **Soft freeze (any one — Captain may waive):**
- ≥3 P1 in last 24h.
- Showroom peak (Sat 10–15 CT).
- ≥9 modules in `building`.
- ≥5 open `claude/*` branches.
- Captain unreachable for `→ live` work.

🟢 **Normal:** none of the above.

---

## 2. Rollback triggers (auto, no waiting)

These trigger immediate rollback action, then a freeze, then escalation:

- ≥1 P0 — instant flip-back of the module + freeze.
- ≥3 P1 within 24h on same module — instant flip-back of that module.
- ≥5 stale-client reports on a module within 24h — flip-back + cachebust bump.
- v1↔v2 row diff >0 on 20-row sample during Phase 5 — flip-back + freeze writes.
- Cloudflare deploy red >5 min after a flip — investigate; flip-back if not green within 15 min.
- Role-visibility breach (any role sees module they should not) — instant `→ idea_only`.

The session that detects executes — does not wait for Captain authorization (per emergency authority, escalation matrix §7).

---

## 3. Kill-switch philosophy

There is no global kill switch. There are only **layered partial disablements**.

1. **Module level:** `module_modes.json` flip → `idea_only` (Owner-only, removes from sidebar for all others).
2. **User level:** per-user `deny` override.
3. **Role level:** flip the module to a mode that excludes that role per the resolver.
4. **Surface level:** add a CSS guard `display: none` for that surface in a single small commit.
5. **Repo level:** `git revert` a specific commit on `main`.

**Why no global kill:**
- A global kill would also kill rollback paths.
- Granular kills preserve the v1 surface for unaffected users.
- A global kill is a destructive action; Cloudflare cannot serve "nothing" without breaking auth bootstrap.

**Closest thing to global:** Captain executes `git revert <merge-of-shell-v2>` on `main`. This is an additive revert, not a kill. Always available.

---

## 4. Production halt conditions

Production halt = no commits to `main`. Distinct from freeze (which allows rollback). Halt triggers are stricter:

- 🛑 Two consecutive emergency rollbacks in the same session.
- 🛑 A canonical-doc fork detected (two branches with conflicting canonical edits).
- 🛑 Captain says "halt."
- 🛑 Three consecutive deploys red.
- 🛑 Audit log indicates data corruption (writes the system cannot explain).

Halt resume requires Captain explicit "resume" + SESSION_LOG entry naming each cleared trigger.

---

## 5. Blast-radius containment

When an incident is detected, the order of containment:

1. **Stop the bleed.** Module → `idea_only` or `git revert`. Whichever is faster.
2. **Identify scope.** How many users? Which records? Which roles? Sample audit_log.
3. **Quarantine writes.** Tag any v2 writes during the incident window for later replay/revert.
4. **Inform.** SESSION_LOG entry; Captain notified.
5. **Investigate.** After containment, never during.
6. **Repair.** New commit; pass through gates G1–G10 again; do not skip checkpoints.
7. **Resume.** Captain explicit go; freeze cleared per §1.

**Rule:** investigation never happens before containment. Containment is always reversible — debugging on a live incident is not.

---

## 6. Partial disablement strategy (preferred over kills)

Each disablement layer has a use case. Choose the smallest sufficient layer.

| Layer | Use when | Recovery |
|---|---|---|
| Per-user `deny` override | One user is hitting a regression others are not | Clear override |
| Module `→ building` | Most users hitting it; Owner+Admin can debug | Flip back when fixed |
| Module `→ idea_only` | Even Owner shouldn't run it | Flip back when fixed |
| CSS `display: none` guard | Visual regression, code is fine | Remove guard |
| `git revert` of feature commit | Code is the cause | Fix-forward in new commit |
| Cachebust bump | Stale clients only | Bumped automatically next deploy |

Anti-pattern: jumping to `git revert` when a flip would do. The flip is faster, additive, and reversible without rebuild.

---

## 7. Shell-v2 shutdown sequencing

When shell-v2 must be wound down (incident or Captain decision), the order is:

```
Step 1: Flip the offending module(s) to `idea_only`.
Step 2: Verify v1 surfaces are reachable for the affected users.
Step 3: If multiple shell-v2 modules implicated, flip each in its own commit.
Step 4: If shell-v2 host code (mount infra) is the cause, `git revert` that specific commit.
Step 5: Cachebust bump (?v=<sha>) on next deploy.
Step 6: Confirm via curl that affected modules are no longer reachable for non-Owner roles.
Step 7: SESSION_LOG entry with affected modules, users, records, time-to-contain.
Step 8: Captain decides: pause shell-v2 program, or fix-forward.
```

A shell-v2 shutdown does not require taking the system offline. v1 is always the survival layer.

---

## 8. Stale-client handling

A stale client is a browser holding old shell code and acting on outdated `module_modes.json`. Symptoms in F9 (failure scenarios).

**Containment:**
- Bump `?v=<commit-sha>` cachebust on next commit (forces shell re-fetch).
- For known-affected users: instruct hard refresh (Ctrl+Shift+R / Cmd+Shift+R).
- For mobile (post-Phase 6 PWA only): bump SW version + `skipWaiting`.

**Prevention:**
- Every shell-v2 import URL carries `?v=<commit-sha>`.
- No service worker until post-Phase 6.
- A `<meta name="aos-version" content="<sha>">` tag in `index.html` lets staleness be observed in user reports.

**Authority:** Primary session may execute cachebust bump without Captain. SW manipulation requires Captain.

---

## 9. Worker rollback handling

Workers are out-of-process and require explicit `wrangler deploy`. Rollback procedure:

1. Identify the prior good commit for `worker/anthropic-proxy.js` (or any future worker).
2. `git checkout <good-sha> -- worker/<name>.js` on Captain's local machine.
3. `wrangler deploy` from Captain's local.
4. Verify with curl: `curl -X POST https://<worker-url> -d ''` returns expected response.
5. Re-commit the rolled-back state to `main` on a new commit.
6. SESSION_LOG entry.

**Authority:** Captain only. Worker rollback is not in primary-session emergency authority because it requires `wrangler` credentials that live on Captain's local machine.

**Time budget:** 10 minutes. Exceeded → escalate (rare; this means `wrangler` itself is failing).

---

## 10. Recovery sequencing (post-incident)

After containment is confirmed, before resuming forward motion:

```
1. Postmortem note in SESSION_LOG (cause, blast, containment time, who acted).
2. Add or update entry in GOVERNANCE_RISKS.md (canonical, via governance branch).
3. Update prevention column in ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md if pattern is new.
4. Re-score the affected module per ACCENTOS_ROLLOUT_READINESS_SYSTEM.md.
5. Re-run the module's golden-path checklist on staging.
6. If sub-score floors fail, return module to a lower phase.
7. Captain go to resume.
8. New commit advancing the module forward (one phase only — not skipping).
```

**Anti-pattern:** "We fixed it, let's flip back to where we were." Always re-pass the gates. The gates exist for the cases nobody anticipated.

---

## 11. Freeze duration and exit

| Freeze cause | Typical duration | Exit |
|---|---|---|
| Active P0 | <1 hour | Captain go after containment + postmortem |
| `module_modes.json` parse failure | <10 min | Revert + parse-clean verification |
| 2 deploys red | <30 min | Cause identified, deploy green |
| Supabase incident | external | Supabase status page green |
| Anthropic-proxy WIP | session-bounded | WIP commit lands and verifies |
| `index.html` ≥860KB | session(s) | Extraction completes, size <800KB |
| Canonical-doc fork | <1 day | Captain picks winner; loser reverted |
| Showroom peak | 5 hours | Window closes |
| Modules ≥9 in `building` | days | Triage; advance or close |

**Default:** when in doubt, freeze longer. Survival > velocity.

---

*End of ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md — planning only.*
