# AccentOS Governance Reconciliation
> **Doc type:** Planning only — non-implementing spoke session output
> **Status:** Draft v1 — for review by primary UI session
> **Sibling docs:** `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md`, `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md`
> **Branch:** `claude/accentos-rollout-planning-UTElf`
> **Production:** untouched. No `index.html`, `worker/`, SQL, or `module_modes.json` behavior changes.

---

## 0. Why this doc exists

Multiple Claude spoke sessions are authoring AccentOS planning documents in parallel, on different branches. Without a reconciliation layer:

- Two branches author the same governance file with diverging content.
- Two branches advance a `module_modes.json` flip without seeing each other.
- Authority for a rollout decision becomes ambiguous (who has rollback rights? who freezes? who unblocks?).
- The rollout strategy in this branch (`ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md`) cites four governance documents (`SYSTEM_STATE.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `MODULE_OWNERSHIP_MAP.md`) that **exist canonically on a different branch**. This doc resolves that.

This is the "governance API" for AccentOS rollout. It defines who decides what, where canonical artifacts live, and how conflicts are resolved.

---

## 1. Canonical governance artifacts (authoritative list)

The four named governance files are **canonical** and live in another active branch/session. **No spoke session may recreate, rewrite, or fork them on a separate branch.** When a session needs information from them, it consumes them by merge — never by re-authoring.

| File | Role | Authority | Spoke sessions may… |
|---|---|---|---|
| `SYSTEM_STATE.md` | Single-page snapshot: monolith state, module modes, worker state, DB schema version | **Read** snapshot; primary session writes | Cite, never overwrite |
| `GOVERNANCE_RISKS.md` | Running risk register (risk / owner / mitigation / status) | **Read**; primary session adds rows; resolution requires Captain approval | Propose new rows in their own doc; never edit directly |
| `STABILIZATION_PROTOCOL.md` | Formal freeze rules, freeze triggers, unfreeze procedure | **Read**; primary session writes | Cite verbatim; never paraphrase as authority |
| `MODULE_OWNERSHIP_MAP.md` | Per `module_modes.json` key: spec owner, code owner, data-contract owner | **Read**; primary session writes | Reference by key; never re-list ownership |

**Companion canonical artifacts** (already in this repo, distinct purpose):

| File | Role | Authority |
|---|---|---|
| `MASTER.md` | Project source of truth (state, architecture, plan, accounts, vision) | Captain (Michael) is the sole writer. Claude-as-primary appends Section 15 entries at session end. |
| `module_modes.json` | The live rollout state machine | Owner-only via `Mgmt → Modes` UI **or** Claude direct edit (per `MODULE_MODES.md` slash protocol). One flip per commit. |
| `MODULE_MODES.md` | Protocol + spec for `module_modes.json` | Locked spec; changes require Captain go. |
| `WORK_IN_PROGRESS.md` | Single in-flight task | Overwritten after every discrete step. Empty = no freeze trigger from WIP. |
| `BUILD_PLAN_CLAUDE.md` / `BUILD_PLAN_MICHAEL.md` | Working checklists | Append-only during session; check-offs at session end. |
| `BUILD_INTELLIGENCE.md` | Lessons-learned, applied before any code | Append-only by primary session. |
| `SESSION_LOG.md` | Append-only session log | One entry per session-end. Replaces Notion. |

**Spoke-authored artifacts** (this branch and any future planning spoke):

| File | Role | Authority |
|---|---|---|
| `docs/design/ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` | Rollout phases, sequencing, integration boundaries | Spoke draft — primary session adopts |
| `docs/design/ACCENTOS_GOVERNANCE_RECONCILIATION.md` (this) | Governance map, conflict resolution rules | Spoke draft — primary session adopts |
| `docs/design/ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md` | Failure modes, rollback playbooks | Spoke draft — primary session adopts |

---

## 2. Overlapping governance responsibilities (the conflict surface)

These overlaps are **expected**. The rules below disambiguate.

| Topic | Documents that touch it | Authority order (highest first) |
|---|---|---|
| Freeze conditions | `STABILIZATION_PROTOCOL.md`, `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §12, `MASTER.md` §12 | `STABILIZATION_PROTOCOL.md` (canonical) → `MASTER.md` → rollout strategy |
| Risk register | `GOVERNANCE_RISKS.md`, rollout strategy Appendix B, this doc §10 | `GOVERNANCE_RISKS.md` (canonical) — others are advisory inputs |
| Module ownership | `MODULE_OWNERSHIP_MAP.md`, `module_modes.json`, `MASTER.md` §3 | `MODULE_OWNERSHIP_MAP.md` (canonical) for ownership; `module_modes.json` for live state |
| System state snapshot | `SYSTEM_STATE.md`, `MASTER.md` §3 | `SYSTEM_STATE.md` (canonical) when present; `MASTER.md` §3 fallback |
| Rollout sequencing | rollout strategy §3, §6 | rollout strategy is authoritative; ownership map names the responsible owner |
| Hard rules / spending | `MASTER.md` §12 | `MASTER.md` §12 is supreme over everything else |
| Rollback authority | this doc §6, `STABILIZATION_PROTOCOL.md` | `STABILIZATION_PROTOCOL.md` (canonical) → this doc as bridge |
| Module mode definitions | `MODULE_MODES.md`, `module_modes.json` | `MODULE_MODES.md` (spec) → `module_modes.json` (data) |

**Rule:** if a non-canonical doc contradicts a canonical one, the canonical one wins, and the non-canonical doc must be updated within the same session that detects the conflict.

---

## 3. Rollout governance boundaries

| Boundary | Inside the boundary | Outside the boundary |
|---|---|---|
| **Captain (Michael)** | Phase advancement to `live`; spend; strategy; freeze override; canonical doc edits | Daily ops, code authoring, internal flips between `building`↔`testing` |
| **Primary session (Claude on main UI work)** | Code, schema, worker, `index.html`, `module_modes.json` flips, canonical doc writes | Authoring planning artifacts in spoke branches |
| **Spoke planning session (this one)** | `docs/design/*.md` planning docs on `claude/accentos-rollout-planning-*` branches | Any production change, any `module_modes.json` edit, any canonical-doc rewrite |
| **`module_modes.json`** | Live state machine | Risk register, ownership, freeze rules — those live elsewhere |
| **Cloudflare Pages auto-deploy** | Every commit to `main` | Spoke branches do not auto-deploy |

**Single-writer rule for canonical docs:** at most one session at a time may edit a canonical governance file. The session that holds the edit token is the one whose branch was last merged to `main`. All other sessions read.

---

## 4. Ownership boundaries (per surface)

This section names *categories* of owner. The concrete `MODULE_OWNERSHIP_MAP.md` (canonical, on the other branch) is the per-module substrate.

| Surface | Spec owner | Code owner | Data-contract owner | Rollout owner |
|---|---|---|---|---|
| `index.html` shell | Captain | Primary session | Captain | Captain |
| `js/v1/*` (legacy modules) | Captain | Primary session | Captain | Primary session |
| `js/shell_v2/*` (future) | Captain | Primary session | Captain | Primary session |
| `worker/*` | Captain | Primary session | Primary session | Captain |
| Supabase schema (`sql/*`) | Captain | Captain (manual SQL Editor) | Captain | Captain |
| `module_modes.json` | Captain (per `MODULE_MODES.md`) | Either | n/a | Captain for `→ live`; primary for internal flips |
| Canonical governance docs | Captain | Primary session on main | Captain | Captain |
| Spoke planning docs | Spoke session | Spoke session | n/a | Captain (adoption) |

**No surface has two code owners simultaneously.** If a session believes it needs to edit a surface owned by another session, it must (a) hand off, (b) merge, or (c) escalate — never co-edit.

---

## 5. Rollout freeze conditions (reconciliation with `STABILIZATION_PROTOCOL.md`)

This doc does **not** redefine freeze conditions. It maps them.

- **Authoritative source:** `STABILIZATION_PROTOCOL.md` (canonical, other branch).
- **Rollout-strategy mirror:** `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §12.
- **MASTER mirror:** `MASTER.md` §12 (Hard Rules).

**Reconciliation rule:** if `STABILIZATION_PROTOCOL.md` and the rollout strategy disagree, the rollout strategy gets corrected, not the protocol. Until `STABILIZATION_PROTOCOL.md` is merged, the rollout-strategy §12 list is provisional.

**Provisional triggers (rollout strategy §12, restated for visibility):**

- 🔴 Open WIP in `WORK_IN_PROGRESS.md`
- 🔴 P0/P1 on a `live` module within 48h
- 🔴 Cloudflare Pages last deploy red
- 🔴 Supabase outage / MCP-permissions degradation blocking SQL workflow
- 🟡 Showroom peak hours (Sat 10:00–15:00 CT)
- 🟡 Active external-comm crisis (MAP, GMC enforcement)

**Unfreeze authority:** Captain only. Primary session may *propose* unfreeze in SESSION_LOG; Captain executes.

---

## 6. Escalation conditions

A spoke or primary session **must** escalate to Captain (stop work, request input) when any of:

1. A canonical governance doc would need to be edited by this session.
2. A `module_modes.json` flip to `live` is the next step.
3. A schema change (any DDL) is the next step.
4. A worker-route addition or removal is the next step.
5. Two non-canonical planning docs disagree and there is no canonical tie-breaker.
6. The freeze condition list itself is in question.
7. A rollback would affect a `live` surface used by non-Owner roles within the prior 24h.
8. An external integration (BigCommerce, Klaviyo, GMC, Windward) would be touched.
9. Spend would be incurred (per `MASTER.md` §12).
10. Any vendor or rep-facing surface would be modified.

Escalation format: a single SESSION_LOG-style line stating *what is blocked*, *what input is needed*, *what the default is if no input arrives*. Default must be the safe (non-acting) option.

---

## 7. Rollback authority

| Rollback type | Authority | Mechanism |
|---|---|---|
| `module_modes.json` flip back (one module) | Primary session | Single-line JSON edit + commit; rollback command included in original commit body |
| Per-user override revert | Primary session | `accentos_user_overrides` localStorage edit (Owner machine) |
| Phase-level rollback (multiple modules) | Captain | Sequence of single flips, one per commit |
| Worker rollback | Captain (executes `wrangler deploy` from local) | Deploy of prior commit |
| Schema rollback | Captain | Manual reverse SQL paste |
| `main` branch rollback (revert commit) | Captain | `git revert` only — never `reset --hard` on `main` |
| Canonical-doc rollback | Captain | `git revert` |

**Rule:** rollback is always *additive* (a new commit that flips state back), never destructive (no `reset --hard`, no force-push to `main`). This holds even when destructive feels faster.

---

## 8. Integration authorization gates

Every shell-v2 integration into the live system must pass these gates *in order*. Each gate has a single deciding role.

| Gate | Decided by | Pass criterion |
|---|---|---|
| G1 — Plan exists | Spoke session | Module is named in rollout strategy §6 sequencing |
| G2 — Ownership clear | Primary session | Module appears in `MODULE_OWNERSHIP_MAP.md` |
| G3 — Mode entry exists | Primary session | `module_modes.json` has the key at `building` or earlier |
| G4 — Freeze clear | Primary session | `STABILIZATION_PROTOCOL.md` triggers all clear |
| G5 — Golden-path checklist | Primary session | Manual checklist passes on staging |
| G6 — Rollback dry-run | Primary session | Rollback flip executed and reverted on staging |
| G7 — Captain go | Captain | Explicit go in chat or SESSION_LOG |
| G8 — Cutover window OK | Primary session | Not Sat 10–15 CT; not Friday afternoon |
| G9 — Post-deploy snapshot | Primary session | `curl` diff reviewed; Cloudflare green within 60s |
| G10 — Bake period | Primary session | Phase-specific bake duration elapsed without P0/P1 |

A gate that fails returns the module to the prior phase. Gates are never skipped.

---

## 9. Shell-v2 rollout checkpoints

Each shell-v2 module passes through these checkpoints. They sit underneath G1–G10 and are tactical.

1. **C1 — Born extracted.** Module ships as `js/shell_v2/<name>.js` from its first commit. No inlining into `index.html`.
2. **C2 — `mount(rootEl, ctx)` / `unmount()` contract.** Both functions exported, both reversible.
3. **C3 — `canSeeModule` honored.** No surface bypasses the resolver.
4. **C4 — `sbFetch` reused.** No direct `fetch` to Supabase.
5. **C5 — No new sessionStorage keys.** Reuses `aos-sb-key` and `aos-api`. Any new key requires Captain go.
6. **C6 — Mobile parity at 390px.** Verified before leaving `building`.
7. **C7 — Visual parity.** Design tokens from `index.html` only — no inline restyles.
8. **C8 — Write paths tagged.** v2 writes carry `source: 'shell_v2'`.
9. **C9 — Rollback flip rehearsed.** `mode: building` ↔ `mode: testing` toggled at least once on staging.
10. **C10 — SESSION_LOG entry.** Each phase advancement logged.

---

## 10. Extraction authorization checkpoints

Extraction = pulling code out of `index.html` into a dedicated file. Per rollout strategy §13, extraction triggers are size, churn, or shell-v2 dependency. Authorization gates:

| Gate | Decided by | Pass criterion |
|---|---|---|
| E1 — Trigger fired | Primary session | Size ≥ 800KB **or** ≥3 commits / 2 weeks **or** shell-v2 helper dependency |
| E2 — Not during freeze | Primary session | All freeze triggers clear |
| E3 — Not bundled with a flip | Primary session | Same commit contains zero `module_modes.json` edits |
| E4 — One subsystem per session | Primary session | No prior extraction in current session |
| E5 — Visual + functional parity | Primary session | Live URL `curl` snapshot diffs to whitespace-only |
| E6 — Captain go for shell helpers | Captain | Required when extraction is into `js/shared/*` |
| E7 — SESSION_LOG entry | Primary session | Logged with file size before / after |

Anti-patterns explicitly disallowed:

- Extracting and flipping in the same commit.
- Extracting more than one subsystem in one session.
- Pre-emptive extraction below the size trigger.

---

## 11. How future sessions determine canonical governance documents

A spoke or primary session encountering a governance question follows this resolver, in order:

1. **Branch check.** Is there a non-`main` branch named `claude/governance-*` or similar that has been touched within the last 14 days? If yes, the canonical files on that branch take precedence over local copies.
2. **`main` check.** Does `main` contain the file? If yes, that is the working canonical until the governance branch merges.
3. **MASTER fallback.** If neither branch has the file, `MASTER.md` is the fallback for system state and hard rules.
4. **Spoke-doc fallback.** If MASTER does not cover the question, `docs/design/*.md` is the fallback.
5. **Escalate.** If none of the above resolve, escalate per §6.

**Detection helper (reference, not implementation):** `git ls-remote --heads origin 'claude/*' | grep -i governance` and read each branch's `*.md` head.

---

## 12. How conflicting governance docs are resolved

Conflict resolution algorithm:

1. Identify the two (or more) docs that disagree.
2. Determine canonicality per §1.
3. If exactly one is canonical, the canonical one wins; the other is corrected in the same session that detects the conflict (if owned by the detecting session) or escalated (if not).
4. If both are canonical (cross-branch fork), **freeze writes to both** and escalate to Captain. No spoke session may pick a winner across canonical files.
5. If neither is canonical, the more recently merged-to-`main` doc wins. The other is corrected.
6. Log the resolution in SESSION_LOG.md with both commit hashes and the chosen winner.

**Forbidden resolutions:**

- "Both can be true; readers pick." — never. One canonical answer.
- "Whichever is longer / better written." — never. Authority is structural, not editorial.
- Silent overwrite. — every resolution logs both prior states.

---

## 13. How rollout sequencing authority is determined

Sequencing authority follows this hierarchy:

1. **Captain** — sets the overall track order (Track 0/1/2/...) per `MASTER.md` §5.
2. **Rollout strategy §6** — sets within-track shell-v2 sequencing (Daily Command Center → Mgmt Dashboard → Pipeline → ...).
3. **`MODULE_OWNERSHIP_MAP.md`** — names the deciding owner for ambiguous within-module sequencing.
4. **Primary session** — chooses commit-level ordering within a single sequencing slot.

Any sequencing change that crosses level 1 requires Captain. Any change at level 2 requires Captain go via SESSION_LOG. Levels 3–4 are at-will within their slot.

---

## 14. Cross-session governance conflicts (operational rules)

Two sessions running on different branches may both touch governance. Operational rules to keep entropy low:

- **One-flip-per-merge.** A branch that flips `module_modes.json` may contain at most one flip and must merge before its sibling branch flips again.
- **Spoke branches are read-only on `module_modes.json`.** Only primary sessions on `main` (or branches that fast-forward to `main` cleanly) may edit it.
- **Canonical-doc edits travel alone.** A commit that edits a canonical governance doc contains *only* that edit.
- **Branch naming.** `claude/governance-*` for canonical-doc work, `claude/rollout-*` for rollout planning, `claude/feat-*` for code. The naming is the disambiguator at `git branch -a` glance time.
- **Stale-branch rule.** A spoke branch with no commits for 14 days is presumed abandoned; canonical content overrides it on conflict.
- **Merge order rule.** Canonical-doc PRs merge before code PRs that depend on them. Never the reverse.

---

## 15. Reconciliation actions for THIS branch

Concrete delta vs. `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` v1:

| Item | Action | Why |
|---|---|---|
| Rollout strategy §0 says four governance files "do not exist" | **Update** to "exist canonically on another branch; reference, do not recreate" | Captain correction |
| Rollout strategy §11 lists future governance artifacts to author | **Update** to "consume from canonical branch" | Same |
| Rollout strategy §12 freeze list | **Mark provisional** until `STABILIZATION_PROTOCOL.md` merges | Authority order |
| Rollout strategy Appendix B risks | **Mark advisory** to `GOVERNANCE_RISKS.md` | Authority order |
| Rollout strategy Appendix A checklist | **Reframe** as the tactical layer beneath G1–G10 | Gate hierarchy |

These deltas are listed here, not applied to the strategy doc, because the rules in §12 say one canonical doc per commit and the strategy is a peer non-canonical doc — the primary session adopting these recommendations should land them in a single follow-up commit on `main`.

---

*End of ACCENTOS_GOVERNANCE_RECONCILIATION.md — planning only.*
