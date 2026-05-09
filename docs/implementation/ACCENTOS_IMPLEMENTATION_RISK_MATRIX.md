# ACCENTOS_IMPLEMENTATION_RISK_MATRIX.md — Implementation Risk Register

| Field | Value |
|---|---|
| Status | **Active — reviewed each planning session** |
| Owner | Michael Graf (authority) / Claude (maintenance) |
| Last Updated | 2026-05-09 |
| Scope | Implementation-level risks only. System-level risks (R-01–R-06) live in `GOVERNANCE_RISKS.md`. |
| Related | `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `ACCENTOS_AGENT_AUTONOMY_RULES.md`, `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md` |
| Prefix | IRI = Implementation Risk Item |

---

## 1. RISK CLASSIFICATION SYSTEM

### Scoring dimensions

```
Risk Score = Probability (1–5) × Impact (1–5)
Range: 1 (negligible) → 25 (critical)
```

| Probability | Definition |
|---|---|
| 1 | Rare — unlikely under normal operating conditions |
| 2 | Unlikely — possible under edge conditions |
| 3 | Possible — roughly even odds given current state |
| 4 | Likely — expected to occur absent active mitigation |
| 5 | Near-certain — will occur without immediate action |

| Impact | Definition |
|---|---|
| 1 | Negligible — dev inconvenience only, no user effect |
| 2 | Minor — dev time lost, no production effect |
| 3 | Moderate — production degraded but recoverable same session |
| 4 | Significant — production broken, Michael required to fix |
| 5 | Critical — data loss, security breach, or unrecoverable prod outage |

### Categories

- **Implementation (I):** risks during development and code changes
- **Integration (G):** risks at the boundary between new shell and legacy monolith
- **Operational (O):** risks in the running production system
- **Financial (F):** token cost, infrastructure cost, or opportunity cost
- **Organizational (Z):** single-owner risks, decision bottlenecks, process gaps

### Status values

- **Open** — risk is active, no sufficient mitigation in place
- **Mitigated** — mitigation is in place and reducing the risk
- **Accepted** — risk is acknowledged; mitigation cost exceeds expected loss
- **Closed** — risk is no longer applicable

---

## 2. RISK REGISTRY

| ID | Title | Cat | Prob | Impact | Score | Status |
|---|---|---|---|---|---|---|
| IRI-01 | Multi-agent file collision | I | 2 | 4 | **8** | Mitigated |
| IRI-02 | Branch proliferation | Z | 3 | 2 | **6** | Open |
| IRI-03 | index.html edit under pressure | I | 4 | 4 | **16** | Open |
| IRI-04 | Phase gate skip | I | 3 | 4 | **12** | Open |
| IRI-05 | Worker proxy undeployed (BUG-01) | O | 5 | 4 | **20** | Open |
| IRI-06 | SQL migrations silently outdated | O | 4 | 4 | **16** | Open |
| IRI-07 | Feature flag stuck in prod | O | 2 | 3 | **6** | Accepted |
| IRI-08 | CSS z-index collision on Phase B | G | 3 | 3 | **9** | Open |
| IRI-09 | localStorage quota exceeded | O | 2 | 2 | **4** | Accepted |
| IRI-10 | Keyboard shortcut conflict | G | 3 | 2 | **6** | Open |
| IRI-11 | Mobile viewport meta conflict | G | 2 | 3 | **6** | Open |
| IRI-12 | Agent spawned without scope declaration | I | 3 | 3 | **9** | Mitigated |
| IRI-13 | Cost ceiling breach | F | 3 | 2 | **6** | Open |
| IRI-14 | Autonomy scope creep | Z | 3 | 4 | **12** | Open |
| IRI-15 | Session context compaction loses impl state | I | 3 | 3 | **9** | Mitigated |
| IRI-16 | Monolith grows past 8K lines | I | 3 | 3 | **9** | Open |
| IRI-17 | Sub-agent spawns another sub-agent | I | 2 | 4 | **8** | Mitigated |
| IRI-18 | Decision lock never completed | Z | 4 | 3 | **12** | Open |

---

### IRI-01 — Multi-agent file collision

Two agents write to the same file in the same session, producing conflicting or corrupted output.

- **Trigger:** Hub spawns two agents without checking output file overlap.
- **Detection:** Git conflict markers appear on commit; or second agent overwrites first agent's work silently.
- **Mitigation:** Scope declaration required at spawn time (Section 3 of ACCENTOS_AGENT_AUTONOMY_RULES). File-level lock enforced by anti-chaos Rule 6. Hub must verify no overlap before spawning second agent.
- **Residual risk:** Race condition possible if Hub logic is manual rather than automated. Drops to 1 at AML 4+.

---

### IRI-02 — Branch proliferation

Active branch count grows beyond what Michael can track or reason about, causing merge confusion and abandoned WIP.

- **Trigger:** Each autonomy branch adds 1 more active context. Currently: main + 1 implementation + 4 planned authority branches = 6 active.
- **Detection:** `git branch -r | wc -l` > 8.
- **Mitigation:** Authority branches have defined ownership scope (ACCENTOS_AGENT_AUTONOMY_RULES Section 6 routing table). Stale branches require explicit close decision by Michael.
- **Monitoring:** Review active branch count at each planning session.

---

### IRI-03 — index.html edit under pressure

Michael asks for a "quick fix" that touches `index.html`. Time pressure causes the 50-line gate to be skipped or the change to be larger than expected.

- **Trigger:** Production incident + verbal request + "just this once."
- **Detection:** git diff on index.html shows > 50 lines changed without WIP checkpoint.
- **Mitigation:** GATE-05 is a hard stop. Claude must refuse to commit without checkpoint regardless of stated urgency. Alternatives: (a) fix in a js/ extracted module instead, (b) create a scoped hotfix branch.
- **Current state: Open.** No automated enforcement — relies on Claude discipline.

---

### IRI-04 — Phase gate skip

Phase B shell integration begins before Phase A exit criteria are met (e.g., boot-smoke passes with flag on AND off, no visual regression). Skipping causes compounded rollback complexity.

- **Trigger:** Michael or Claude declares "Phase A is done" based on the last commit passing, not on explicit exit criteria verification.
- **Detection:** Phase A exit criteria checklist in ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md Section 4 is not fully checked before Phase B work begins.
- **Mitigation:** Phase gate requires explicit written authorization in BUILD_PLAN_MICHAEL.md per ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md. Claude must refuse Phase B work unless Michael has written "Phase B authorized."
- **Current state: Open.** Phase A not yet started. Risk is latent.

---

### IRI-05 — Worker proxy undeployed (BUG-01)

The Cloudflare Worker fix (commit 2dca2a6) is staged but not deployed. Quote Generator AI parse remains broken in production. Every day this is open is a day the AI feature is degraded for the Accent Lighting team.

- **Trigger:** Already triggered. `wrangler deploy` has not been run since the fix was committed.
- **Detection:** Quote Generator "AI Parse" button returns an error or no data.
- **Mitigation:** Michael must run `wrangler deploy` from a local terminal. Cannot be executed from Codespace/cloud environment (GATE-01). Tracked in GOVERNANCE_RISKS.md as R-02.
- **Current state: Open. Score: 20. Highest-priority operational risk.**

---

### IRI-06 — SQL migrations silently outdated

New code in `js/` or `index.html` assumes a schema shape that M01–M40 migrations would create, but Michael has not run those migrations. Code silently no-ops or throws 404 on first use.

- **Trigger:** A module is built against the migrated schema; deployed code runs against the old schema.
- **Detection:** Feature loads but shows empty data or logs `relation does not exist` (silenced per BUILD_INTELLIGENCE entry).
- **Mitigation:** BUILD_PLAN_MICHAEL.md tracks pending M-tasks. Each migration file is documented with its dependencies. Convention: downgrade "table missing" log level to INFO (not WARN) per BUILD_INTELLIGENCE.
- **Current state: Open.** M01–M40 are pending. Any user-facing module added this sprint may silently fail until run.

---

### IRI-07 — Feature flag forgotten in prod

`aos-shell-enabled` or similar localStorage flag is left `true` for users who cannot roll back without dev intervention.

- **Trigger:** Phase A or B ships; flag is toggled for testing; flag is never documented as requiring cleanup.
- **Detection:** End-user reports unexpected shell UI that can't be dismissed.
- **Mitigation:** Feature flag lifecycle must be documented in rollout plan. Flag cleanup is an explicit Phase F exit criterion. Accepted at current low probability because shell is not yet side-loaded.

---

### IRI-08 — CSS z-index collision on Phase B integration

Shell overlay elements (command palette, right-rail, notification panel) collide with legacy z-index stack in `index.html`. One or both surfaces render at wrong depth.

- **Trigger:** Shell CSS `z-index: 9000` conflicts with legacy modal or tooltip at `z-index: 10000`.
- **Detection:** Visual regression on first Phase B boot in production context (not prototype isolation).
- **Mitigation:** Pre-Phase-B audit: `grep -n "z-index" index.html | sort -t: -k3 -n`. Resolve conflicts before Phase B begins. Shell z-index ladder is defined in `ui/tokens.css`; treat it as the authority.
- **Current state: Open.** Audit not yet run (Phase A not started).

---

### IRI-09 — localStorage quota exceeded

Accumulated `aos-*` keys (sidebar state, mode, feature flags, module preferences) exhaust the browser's 5MB localStorage limit after full integration.

- **Trigger:** Each shell module persists preferences; 20+ modules × N keys approaches quota.
- **Detection:** `localStorage.setItem()` throws `QuotaExceededError`.
- **Mitigation:** Audit total `aos-*` key count + estimated byte size before Phase D. Accepted at current state because the prototype stores < 10 keys. Revisit at Phase D.

---

### IRI-10 — Keyboard shortcut conflict

The `G`-chord navigation system (or `Cmd/Ctrl+K` command palette) is silently hijacked by a monolith `keydown` event handler.

- **Trigger:** Legacy `index.html` registers a global `keydown` listener that matches the same key sequence as the shell's global shortcuts.
- **Detection:** Shell shortcut appears unresponsive; dev console shows both handlers firing.
- **Mitigation:** Pre-Phase-B audit: `grep -n "keydown\|keyup\|hotkey\|shortcut" index.html`. Shell listeners must use `.stopPropagation()` or check `event.defaultPrevented`. Document any conflicts found.
- **Current state: Open.** Audit not yet run.

---

### IRI-11 — Mobile viewport meta conflict

Shell and monolith both declare `<meta name="viewport" ...>` with different values. Mobile rendering is undefined behavior.

- **Trigger:** Phase A side-load adds shell assets; shell prototype's viewport meta was written for isolated demo context.
- **Detection:** Mobile layout breaks on first Phase A load on a real device.
- **Mitigation:** Shell must NOT include a `<meta name="viewport">` tag. The monolith's existing tag is the authority. Verify in `ui/accentos-shell-prototype.html` before Phase A — remove any viewport meta from the prototype's injected HTML fragment.
- **Current state: Open.** Easy fix, low urgency until Phase A.

---

### IRI-12 — Agent spawned without scope declaration

A sub-agent begins work without a file-level scope declaration, writes to a file outside its intended boundary, and the error is discovered only at commit time.

- **Trigger:** Hub spawns agent with vague task description ("work on the shell"); agent infers scope and writes to `index.html`.
- **Detection:** `git diff --name-only` at commit time shows unexpected files.
- **Mitigation:** Anti-chaos Rule 6 + spawn-time scope declaration (ACCENTOS_AGENT_AUTONOMY_RULES Section 3). Boot-smoke pass required before commit (catches some violations). Mitigated by design; residual risk is manual Hub discipline.

---

### IRI-13 — Cost ceiling breach

A long session with multiple sub-agents or a research agent with unbounded depth exhausts the session token ceiling, resulting in an unexpected billing spike.

- **Trigger:** Multi-agent session + research agent + long context window = > session ceiling in one bill cycle.
- **Detection:** Console token usage warning OR post-session billing review.
- **Mitigation:** Session ceiling tiers defined in ACCENTOS_AGENT_AUTONOMY_RULES Section 5. Compaction triggers defined. Research agents are Haiku by default (5× cheaper). Escalation trigger at ceiling hit.
- **Current state: Open.** No automated enforcement yet — relies on session discipline.

---

### IRI-14 — Autonomy scope creep

The set of "approved action classes" in ACCENTOS_AGENT_AUTONOMY_RULES Section 4 gradually expands through informal additions (verbal "yeah just do it") without a formal re-authorization step. Autonomy ceiling drifts upward without governance review.

- **Trigger:** Michael verbally approves a one-off action outside the table; Claude treats it as a permanent expansion.
- **Detection:** Claude performs an action class not in the approval table and cites "Michael said it was OK last session."
- **Mitigation:** Section 4 table is the authority. One-off approval does not modify the table. To add a new approved class: (1) add a row to Section 4, (2) commit the change, (3) Michael confirms in BUILD_PLAN_MICHAEL.md. No exceptions.
- **Current state: Open.** Relies on Claude discipline and Michael awareness.

---

### IRI-15 — Context compaction loses implementation state

Claude's context is compacted mid-session (or the session ends unexpectedly). WORK_IN_PROGRESS.md has not been updated since the last checkpoint. The next session cannot determine what was completed vs. abandoned.

- **Trigger:** Long implementation session + no WIP update for > 3 steps + unexpected context end.
- **Detection:** Next session reads WORK_IN_PROGRESS.md and finds stale state that doesn't match the actual working tree.
- **Mitigation:** WORK_IN_PROGRESS.md updated after every discrete build step (BUILD_INTELLIGENCE operating rule). Compaction only triggered after WIP update (ACCENTOS_AGENT_AUTONOMY_RULES Section 5). Mitigated by discipline; residual risk is operator error.

---

### IRI-16 — Monolith grows past 8K lines

`index.html` grows from its current 7,169 lines past the 8,000-line boot-smoke alert threshold. Each line added increases the review and rollback surface for every future edit.

- **Trigger:** New feature added directly to `index.html` instead of being extracted to `js/`.
- **Detection:** `wc -l index.html` > 8000 (boot-smoke alert threshold).
- **Mitigation:** R-01 governance risk. New features MUST go to `js/<module>.js` + a `<script src>` tag addition. Inline additions to `index.html` are capped at 50 lines per session (GATE-05). Module extraction is the primary long-term mitigation.
- **Current state: Open.** Line count is 7,169. Margin is ~831 lines.

---

### IRI-17 — Sub-agent spawns another sub-agent (cascade)

A spawned agent, seeing an opportunity to parallelize, spawns its own sub-agents. This creates an uncontrolled agent tree that violates scope isolation, makes cost accounting impossible, and can produce conflicting file writes at multiple levels.

- **Trigger:** Prototype agent or doc-writer agent spawns a "helper" agent for a sub-task without Hub authorization.
- **Detection:** More than 1 level of agent hierarchy observed; Hub did not authorize the second-level spawn.
- **Mitigation:** Anti-chaos Rule 2. Sub-spawning is architecturally prohibited regardless of task scope. Mitigated by design. Enforcement relies on agent discipline until AML 4 Hub is built.

---

### IRI-18 — Decision lock never completed

Five or more Michael decisions accumulate in `BUILD_PLAN_MICHAEL.md` or `PROMPT_QUEUE.md` without resolution. Development blocks multiply. Claude begins working around decisions instead of surfacing them.

- **Trigger:** Session after session adds BLOCKS ON MICHAEL items; Michael's bandwidth is consumed by the business; decision queue grows.
- **Detection:** `grep -c "BLOCKS ON MICHAEL" BUILD_PLAN_CLAUDE.md` > 5.
- **Mitigation:** Surface decision queue at every session start (CLAUDE.md auto-execute rule). Reduce decision cost: prepackage decisions as "Option A / Option B / Option C" with recommended default. Michael's job is to confirm, not to author. Maximum queue depth: 5 decisions before Claude stops adding new items.
- **Current state: Open.** Decision queue not yet at threshold, but pattern is latent.

---

## 3. RISK HEAT MAP

```
Impact
  5 |         |         |         |         |         |
    |         |         |         |         |         |
  4 |         | IRI-01  | IRI-03  | IRI-05  |         |
    |         | IRI-17  | IRI-04  | IRI-06  |         |
    |         |         | IRI-14  |         |         |
  3 |         | IRI-11  | IRI-08  | IRI-18  |         |
    |         |         | IRI-12  | IRI-15  |         |
    |         |         | IRI-16  |         |         |
  2 |         | IRI-09  | IRI-02  | IRI-13  |         |
    |         |         | IRI-07  | IRI-10  |         |
  1 |         |         |         |         |         |
    +----+----+----+----+----+----+----+----+----+----+
         1         2         3         4         5
                        Probability

Zone:  [Score 1–5] Low  [6–10] Moderate  [12–16] High  [20–25] Critical
```

| Zone | Risk IDs |
|---|---|
| Critical (20–25) | IRI-05 |
| High (12–16) | IRI-03, IRI-06, IRI-04, IRI-14, IRI-18 |
| Moderate (6–10) | IRI-01, IRI-02, IRI-07, IRI-08, IRI-10, IRI-11, IRI-12, IRI-13, IRI-15, IRI-16, IRI-17 |
| Low (1–5) | IRI-09 |

---

## 4. TOP 5 CRITICAL RISKS — EXPANDED MITIGATION PLANS

### IRI-05 — Worker proxy undeployed (Score: 20)

**Expanded mitigation:**
1. Michael opens local terminal (not Codespace).
2. `cd` to accent-os repo.
3. Run `wrangler deploy`.
4. Verify: navigate to Quote Generator → click "AI Parse" → confirm response is non-error.
5. Update GOVERNANCE_RISKS.md R-02 status to RESOLVED.
6. IRI-05 status → Closed.

**Failure modes:** Cloudflare auth expired (re-run `wrangler login`), wrangler version mismatch (run `npm install wrangler@latest` first), API key missing from environment (check `.env` or Cloudflare dashboard secrets).

**Time estimate:** 5–10 minutes if local environment is ready.

---

### IRI-03 — index.html edit under pressure (Score: 16)

**Expanded mitigation:**
1. When a "quick fix" is requested, Claude must first ask: "Can this be done in `js/<module>.js` instead?"
2. If `index.html` is the only option: count the line delta before committing.
3. If delta > 50: stop, write a WIP checkpoint, surface to Michael for explicit approval before proceeding.
4. Never commit `index.html` changes without a boot-smoke pass.
5. Add a post-commit hook (future): `wc -l index.html` → warn if > 7500.

**Prevention:** Every new feature defaults to `js/` extraction. `index.html` is for routing hooks and `<script>` tags only.

---

### IRI-06 — SQL migrations silently outdated (Score: 16)

**Expanded mitigation:**
1. BUILD_PLAN_MICHAEL.md lists each pending M-task with its dependency chain.
2. Before building any new feature that requires a new table: verify the migration file is written and documented.
3. After building the feature: add an explicit BUILD_PLAN_MICHAEL.md entry: "Run M## before [feature] will work."
4. Code that depends on a missing table must log `console.log('[INFO] Table not found — run M## to activate this feature.')` (not WARN).
5. Monthly: Michael reviews pending M-tasks. Anything pending > 60 days is either run or explicitly deferred.

---

### IRI-04 — Phase gate skip (Score: 12)

**Expanded mitigation:**
1. Phase transitions are authorized ONLY by explicit written statement in `BUILD_PLAN_MICHAEL.md`.
2. Claude must verify authorization before beginning Phase B or later work — not infer it from context.
3. Each phase exit criteria must be verified with a checklist, not assumed from "the last commit passed."
4. If Michael asks to skip a phase: Claude surfaces the specific exit criteria that would be violated and asks for written confirmation.
5. Phase gate bypasses are appended to GOVERNANCE_RISKS.md as new risks on the same session they occur.

---

### IRI-14 — Autonomy scope creep (Score: 12)

**Expanded mitigation:**
1. ACCENTOS_AGENT_AUTONOMY_RULES Section 4 is the single source of truth for approved action classes.
2. Any verbal approval of a new action class triggers an immediate doc update to Section 4 (same session).
3. If Michael approves an action verbally and the session ends before the doc is updated: the approval does not carry to the next session.
4. Quarterly review: Michael reads Section 4 table and confirms each row is still intentional.
5. Additions require: (a) a row in the table, (b) a BUILD_PLAN_MICHAEL.md confirmation, (c) a commit. Three steps, no shortcuts.

---

## 5. RISK OWNERSHIP MATRIX

| ID | Risk Title | Primary Owner | Secondary | Enforcement |
|---|---|---|---|---|
| IRI-01 | Multi-agent file collision | Claude (scope declaration) | Hub (future) | Spawn-time scope check |
| IRI-02 | Branch proliferation | Michael (branch decisions) | Claude (tracking) | Monthly branch audit |
| IRI-03 | index.html edit under pressure | Claude (gate enforcement) | Michael (approval) | GATE-05 hard stop |
| IRI-04 | Phase gate skip | Michael (authorization) | Claude (gate check) | Explicit BUILD_PLAN_MICHAEL.md entry |
| IRI-05 | Worker proxy undeployed | **Michael (action required)** | — | Manual wrangler deploy |
| IRI-06 | SQL migrations silently outdated | **Michael (action required)** | Claude (documentation) | BUILD_PLAN_MICHAEL.md tracking |
| IRI-07 | Feature flag stuck in prod | Claude (cleanup step) | Michael (awareness) | Phase F exit criteria |
| IRI-08 | CSS z-index collision | Claude (pre-Phase-B audit) | Michael (approval) | Pre-Phase-B checklist |
| IRI-09 | localStorage quota exceeded | Automatic (browser) | Claude (future audit) | Phase D audit |
| IRI-10 | Keyboard shortcut conflict | Claude (pre-Phase-B audit) | — | Grep audit before Phase B |
| IRI-11 | Mobile viewport meta conflict | Claude (prototype fix) | — | Pre-Phase-A verification |
| IRI-12 | Agent spawned without scope | Claude (discipline) | Hub (future) | Anti-chaos Rule 6 |
| IRI-13 | Cost ceiling breach | Claude (session tracking) | Michael (billing review) | Token ceiling per Section 5 |
| IRI-14 | Autonomy scope creep | Both | — | Section 4 table is authority |
| IRI-15 | Context compaction loses state | Claude (WIP discipline) | — | WIP checkpoint after every step |
| IRI-16 | Monolith growth past 8K lines | Claude (extraction discipline) | Michael (gate approval) | boot-smoke alert + GATE-05 |
| IRI-17 | Sub-agent cascade spawn | Claude (discipline) | Hub (future) | Anti-chaos Rule 2 |
| IRI-18 | Decision lock | Both | — | 5-decision queue cap |

---

## 6. RISK MONITORING CADENCE

| Risk Category | Review Frequency | Trigger for Out-of-Cycle Review |
|---|---|---|
| Critical (Score 20–25) | Every session | Any related incident or change |
| High (Score 12–16) | Each planning session (weekly or bi-weekly) | Any related build work begins |
| Moderate (Score 6–10) | Monthly | Phase transition occurring |
| Low (Score 1–5) | Quarterly | Phase D or later milestone hit |
| Newly added risks | Immediately upon addition | Always reviewed in the session they are added |

### Session start checklist (risk-relevant)

- [ ] IRI-05: Has Michael run `wrangler deploy`? If not, surface it first.
- [ ] IRI-06: Are there pending M-tasks blocking today's build work?
- [ ] IRI-16: `wc -l index.html` — still below 8,000?
- [ ] IRI-18: How many BLOCKS ON MICHAEL items are open? If > 5, stop adding new ones.

---

## APPENDIX: RISK STATUS CHANGELOG

| Date | ID | Change |
|---|---|---|
| 2026-05-09 | IRI-01 through IRI-18 | Initial registry created |

> Append new rows when status changes. Never delete rows. Resolved risks get status → Closed with a date.
