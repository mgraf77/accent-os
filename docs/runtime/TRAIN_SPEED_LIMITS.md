# TRAIN_SPEED_LIMITS

> Per-action speed and freeze rules for AccentOS architectural work — when execution can
> move fast, when it must slow, when it must freeze, and what signals indicate the track ahead
> is unsafe.
> Analysis only — no implementation, no governance edit, no runtime change.
> Closes the far-track set: `POST_DECOMPOSITION_ROADMAP`, `TRACK_LAYER_MAP`, this doc.
> Snapshot date: 2026-05-10.

---

## 0. WHY SPEED RULES EXIST

`TRACK_LAYER_MAP` answers *which layer* a work item is on. This document answers *how fast that work can run* once a layer is selected. The two questions are independent: an L1 item can be fast, slow, or frozen depending on what it touches. The L1 layer admits a work item; the speed rules govern its pace.

The underlying property: AccentOS is shipped by one part-time human + Claude under a surgical-patch discipline. There is **no test suite**, no CI gate, no automated rollback. Speed is therefore a *blast-radius and observability* function — fast where the blast is contained and the result is observable; slow where the blast is wider; frozen where the blast cannot be undone.

Six speed bands are used throughout this document:

| Band | Pace | Approval | Observation cadence |
|---|---|---|---|
| **GO** | full speed | session-default | end-of-session |
| **CAUTION** | one packet per session, verify before next | session-default | mid-session check |
| **CRAWL** | one surgical packet, then pause for visual verify | session-default with explicit verify step | per-packet |
| **HALT** | do not start without explicit per-task authorization | requires owner-on-record approval | per-packet, owner-visible |
| **FREEZE** | do not touch in this session class regardless of authorization | n/a | n/a |
| **OFF-RAIL** | structurally available but forbidden (see `TRACK_LAYER_MAP §5`) | n/a | n/a |

---

## 1. WHEN EXECUTION CAN GO FASTER (GO band)

Conditions that warrant **GO**:
- Work is on L1 of `TRACK_LAYER_MAP`.
- Work is *additive* — creating new files, appending to logs, writing doc-only commits.
- Work is *reversible by `git revert`* with no runtime reconciliation.
- Work has *no consumer outside the changed file*.
- Failure is *observable* the first time the affected feature is exercised.

### 1.1 GO-band work items
| Item | Why GO |
|---|---|
| New documents under `docs/runtime/` | Doc-only; no runtime; revert trivial |
| Skills `skills/*/SKILL.md` edits | Boot-context only; next-session effect |
| `BUILD_INTELLIGENCE.md` append entries | Append-only by protocol |
| `SESSION_LOG.md`, `PROMPT_LOG.md`, `WORK_IN_PROGRESS.md` writes | Session buffers; no runtime |
| `KPI_CATALOG.md` updates | Doc-only |
| `MASTER.md §15` (Session Log) entries | Append-only by protocol |
| New `module_modes.json` entries with `mode: idea_only` or `planning` | Bounded; no live behavior |
| `internal_meetings.js` sub-file split (Stage A) | Module-internal; no shell touch; single revert |
| Inline `<style>` extraction (Stage 1) | Visual-mass only; zero JS path |
| Quote-print template extract (Stage 3) | One feature path; revert trivial |

### 1.2 GO-band session pattern
- Plan in one short note.
- Execute.
- Verify the affected surface end-to-end *once*.
- Commit + push.
- Move to the next packet.

A GO-band session may stack 2–4 packets if they are independent.

---

## 2. WHEN EXECUTION MUST SLOW DOWN (CAUTION band)

Conditions that warrant **CAUTION**:
- Work is on L1 or L2, but
- It touches `index.html` beyond a `?v=` bump, **or**
- It touches a module file referenced by >5 other files (large modules), **or**
- It introduces a new `<script>` tag, a new sidebar item, or a new `data-roles` attribute, **or**
- It changes a shape that any other module silently depends on (a `window.*` global; a `module_modes.json` `mode` field for a `live` module).

### 2.1 CAUTION-band work items
| Item | Why CAUTION |
|---|---|
| Shell utility extract (Stage 2) | Touches shell; affects every consumer; verify each utility renders |
| `register()` function addition | New cross-cutting surface; verify first three module registrations cleanly |
| Vendor view extract (Stage 4) | ~1,000 LOC moves; verify vendor module renders end-to-end |
| Quick-Actions FAB extract (Stage 5) | Reconcile with existing `quick_actions.js`; verify no double-bind |
| `?v=` cache-bust bump on a touched module | One-line shell touch; verify the new version is what loads in the live browser |
| `module_modes.json` `live` ⇒ any-other-state demotion | Visible to users; verify role gating works post-change |
| Patching an existing `live` module's behavior | Surgical patch; verify the patched page renders + interaction works |
| Stage 6 — sidebar generator (parallel render + cutover) | Visibility surface; two-step ship + verify before removing old HTML |
| Adopting strict-on-collision mode (`register()` throws) | Behavior shift; verify across a session in dev before enabling broadly |
| Cohort 2 / 3 module registrations | One module per session; observe registry warnings between cohorts |

### 2.2 CAUTION-band session pattern
- Plan in a short note that names the affected surfaces.
- Execute the surgical patch.
- Verify the affected page renders **and** any related cross-module navigation works.
- If a global was redefined or extracted, console-check that the global still exists post-load.
- Commit + push.
- One packet per session unless prior packet verified cleanly and next packet is independent.

---

## 3. WHEN EXECUTION MUST CRAWL (CRAWL band)

Conditions that warrant **CRAWL**:
- Work touches a **PRODUCTION-CRITICAL** surface (`SAFE_MUTATION_ZONES §1.6`), **or**
- Work involves a two-step "ship behind feature flag → verify → remove old" cutover, **or**
- Work changes RLS, auth, or a JWT-claim path, **or**
- Work is the first instance of a new pattern (the *first* connector, the *first* strict-mode flip, the *first* Phase 4 webhook receiver — all forbidden in current phases, but listed here for the table).

### 3.1 CRAWL-band work items
| Item | Why CRAWL |
|---|---|
| Auth extract (Stage 7) | Maximum blast radius; only safe after Stages 1–6 land |
| Strict-on-missing-consume enablement | Could throw on a module that loaded fine yesterday |
| Sidebar generator cutover (removing old HTML after generator verified) | Role-visibility blast if wrong; verify per role manually |
| Any new RLS policy change | One-line policy can dark an entire role; verify per role |
| First connector scaffold (forbidden now; in future) | First Phase 4 connector locks in shape; verify against per-field authority table line-by-line |
| First webhook receiver under E0 (forbidden now; in future) | Idempotency / dead-letter convention first instance |
| Migration of an existing global rename (e.g. eventually renaming `sbFetch`) | 22-file touch; can only happen post-Stage-7 |

### 3.2 CRAWL-band session pattern
- The work *is* the session.
- Plan written in full before executing.
- Step through surgically, with explicit verify checkpoints between sub-steps.
- Two-step cutover where applicable (parallel old + new, then remove old in a follow-on commit).
- Owner explicitly told the work is happening *before* the work starts.
- Session ends with a focused verify pass per affected role / per affected page.

---

## 4. WHEN EXECUTION MUST HALT (HALT band)

Conditions that warrant **HALT**:
- Work is on L3 of `TRACK_LAYER_MAP` and Phase B has not begun, **or**
- Work requires a decision recorded somewhere governance-shaped (e.g., the orchestration tier choice in E0; per-field authority in S0), **or**
- Work crosses a phase transition without a transition commit, **or**
- Work would render any cartography-pack invariant false.

### 4.1 HALT-band work items
| Item | What unlocks it |
|---|---|
| Anything that consumes the registry (sidebar generator, auth extract using `consumes`) | Coverage ≥80 %; one week observation-only without unresolved warnings |
| Cohort 4 / final registrations including `module_modes.js` | Cohort 3 must complete cleanly first |
| Strict-on-undeclared-leak mode | Coverage = 100 %; opt-in per environment only |
| E0 commit (CF Workers vs Supabase Edge Functions) | Phase A stable; one full session without shell touch beyond `?v=` |
| S0 commit (per-field authority table) | E0 done; concrete first-connector use case in scope |
| G0 commit (cartography-pack stewardship rules) | Phase A → Phase B transition committed |
| First Phase 4 connector | E0 + S0 done; Phase B stable; first integration explicitly chosen as the seed case |
| ESM migration evaluation | Phase B done; only as preparation for a specific need |
| Build-step adoption (forbidden but enumerated) | Never, per `MASTER.md §4` |

### 4.2 HALT-band session pattern
- Do not start.
- If the impulse to start arises, write the unlock condition into `TRACK_LAYER_MAP` or `POST_DECOMPOSITION_ROADMAP` and move on.
- Re-check at next phase transition.

---

## 5. WHEN EXECUTION MUST FREEZE (FREEZE band)

Conditions that warrant **FREEZE** (per this session class — the analysis-only cartography lane):
- Work would mutate `index.html`, the Cloudflare Worker, or any already-applied SQL migration.
- Work would change governance (`MASTER.md`, `.claude/CLAUDE.md`, `MODULE_MODES.md`) outside of the explicitly invited governance commit set.
- Work would execute or simulate any decomposition stage.
- Work would touch production behavior.

The user directive at the start of this lane named these explicitly. They are frozen for this session class, not forever.

### 5.1 FREEZE-band items (current lane)
- `index.html` edits.
- `worker/anthropic-proxy.js` edits.
- `wrangler.toml` edits.
- `sql/M*.sql` edits.
- `module_modes.json` data writes.
- `js/*.js` module file edits.
- `MASTER.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `.claude/CLAUDE.md`, `MODULE_MODES.md` writes.
- Any decomposition execution.
- Any Codex invocation.
- Any branch cleanup outside the cartography branch itself.

### 5.2 What FREEZE means operationally
- The file is not in scope. Reading is permitted; writing is not.
- Even a one-line edit is forbidden.
- If a discovered fact suggests a frozen file *should* be edited, the response is to write the observation into the analysis pack, not to act on it.

---

## 6. WHEN THE TRACK IS NOT READY

A separate axis from speed. The track can be *not ready* even for work that would otherwise be GO-band. Track readiness is checked *before* speed is chosen.

### 6.1 Conditions under which the track is not ready
| Condition | Effect | Resolution |
|---|---|---|
| `register()` substrate does not yet exist | Any work that would consume it is blocked | Ship Stage 2 first |
| Phase A → Phase B transition commit not written | All L3 work is blocked | Write the transition commit |
| E0 (orchestration tier) not chosen | All Phase 4 work is blocked | Write E0 |
| S0 (per-field authority) not written | All connector-write work is blocked | Write S0 |
| `MASTER.md §3/§4` known-stale | Any architecture-narrative claim in new code or new docs is operating on bad context | Write the §3/§4 currency commit |
| Skills `_index.md` known-out-of-sync | Skill router can't reliably discover capabilities | Audit `_index.md` |
| Migration paste backlog exists | New SQL migrations land in a system where prior ones may not be applied | Sync `sql/` files with live DB before adding M41+ |
| BUILD_INTELLIGENCE.md unread by current session | Lessons not in working memory | Read it as boot context |
| `efficiency-monitor` last-session flags unread | Recurring inefficiency patterns not addressed | Read `session-end-summary.md` |

### 6.2 The track-readiness check
Before any session begins executable work, walk the §6.1 list. If two or more conditions are unresolved, the session's first packet is to resolve one of them (preferably the cheapest). This is not bureaucracy — it is the difference between a session that compounds the pack and a session that compounds the drift.

---

## 7. SIGNALS THAT INDICATE UNSAFE FORWARD PROGRESS

The early-warning indicators from `ARCHITECTURAL_DRIFT_MODEL §8`, translated into actionable session-time signals. If any of these appears, downshift one band immediately.

### 7.1 Refactor velocity drop
**Signal:** a change that the operator estimated at 1 session is still in flight at the end of session 2.
**Cause:** the surrounding context-read is exceeding the change's surface — the shell is too dense for the patch.
**Action:** stop. Re-examine whether the work is on the right layer. Likely this is L2 in disguise of L1, or L3 in disguise of L2.

### 7.2 BUILD_INTELLIGENCE clustering
**Signal:** two or more new lessons in a single week touch the same file or the same pattern.
**Cause:** the underlying coupling that produced the first lesson has produced more lessons because it has not been named.
**Action:** stop. Add the underlying coupling to the registry surface (or to the cartography pack) before continuing to patch around it.

### 7.3 `?v=` skip
**Signal:** a module change shipped without its `?v=` bump.
**Cause:** the manual cache-bust discipline lapsed.
**Action:** stop. Catch up the bump. If this happens twice in two weeks, the cache-bust automation (Stage H(b)) is overdue.

### 7.4 Multiple frozen files emerging
**Signal:** a second file (e.g. `internal_meetings.js`) starts producing the "too big to safely edit" feeling that `index.html` produces.
**Cause:** the same pressure pattern is reproducing at module scale.
**Action:** stop. The Stage A parallel-track split is no longer optional.

### 7.5 Cross-cutting global rename in a single PR
**Signal:** a session reaches for a multi-file rename touching ≥5 modules at once.
**Cause:** a coupling that should have been wrapped in a registry was instead wrapped in a discipline.
**Action:** stop. Renames require the registry to be in place; if it isn't, the rename is forbidden.

### 7.6 New `data-roles` attribute added
**Signal:** a session adds a sidebar item with a hand-coded `data-roles="..."` list.
**Cause:** Stage 6 (sidebar generator) has not yet landed but the work that depends on it is proceeding anyway.
**Action:** stop. Either Stage 6 lands first or the new module waits.

### 7.7 Two integrations being scaffolded simultaneously
**Signal:** in a future session, two connector files are touched in the same week (e.g., a Klaviyo file and a Windward file).
**Cause:** the shared substrate (E0 + S0) was bypassed; two bespoke connector shapes are being built in parallel.
**Action:** stop both. Land E0 + S0 first. Pick one connector. Build it. Build the second using the proven pattern.

### 7.8 New `<script>` tag in `index.html` during Phase A
**Signal:** Phase A shell touch beyond Stage requirements.
**Cause:** new feature work is happening on a shell that is being drained.
**Action:** stop the feature. Phase A finishes before features resume.

### 7.9 Drift-severity rises by one band
**Signal:** any cartography-pack drift class (`ARCHITECTURAL_DRIFT_MODEL §10`) moves from 5 to 6 in a single quarter.
**Cause:** structural drift is approaching the multi-session-correction range.
**Action:** stop net-new work. The next session writes a drift-correction commit.

### 7.10 A frozen file's blast radius is invoked
**Signal:** a discussion includes "we should change `index.html`" / "we should rewrite `sbFetch`" / "we should re-run an applied migration."
**Cause:** the constraint is being negotiated.
**Action:** stop. Re-read `SAFE_MUTATION_ZONES`. If the change is genuinely required, it is a CRAWL/HALT-band action requiring explicit owner authorization, *not* a session-default work item.

### 7.11 The session's first action is "let me just check something quickly"
**Signal:** uncharacterized investigative work without a packet name.
**Cause:** the work has not been positioned on a track. There is no exit criterion.
**Action:** stop. Name the packet. Place it on a track. Then proceed at the appropriate band.

### 7.12 An L5 item starts to feel like L1
**Signal:** "this would be easy — let me just sketch it."
**Cause:** L5 entry vector (`TRACK_LAYER_MAP §5`, R9).
**Action:** stop. The "easy" framing is the warning. If it were L1, it would already be in `TRACK_LAYER_MAP §1`.

---

## 8. SPEED-LIMIT TABLE BY ACTION CLASS

A compact reference for the most common action shapes:

| Action class | Default band | Conditions to downshift | Conditions to upshift |
|---|---|---|---|
| Doc-only commit (governance or cartography) | GO | Affects `.claude/CLAUDE.md` or `MASTER.md §12` rules | n/a (already top band) |
| Append to `BUILD_INTELLIGENCE.md` | GO | None | n/a |
| New file in `docs/runtime/` | GO | None | n/a |
| Skills file edit | GO | Affects `efficiency-monitor` aggregation script | n/a |
| Module-internal patch (one file) | GO | Module is in cohort 1 (registered) → CAUTION | Already verified once this session |
| Module patch with `?v=` bump | CAUTION | Module is large (>500 LOC) or super-module | Two-line patch with obvious effect |
| Adding new SQL migration M41+ | CAUTION | Migration touches RLS or already-applied table | Migration is purely additive (new table) |
| Shell edit (any kind) | FREEZE | n/a | n/a (this session class) |
| Worker edit | FREEZE | n/a | n/a (this session class) |
| Already-applied SQL re-edit | FREEZE | n/a | n/a (this session class) |
| `module_modes.json` add with `mode: idea_only` | GO | Mode is `live` or `building` | n/a |
| `module_modes.json` `live` → other | CAUTION | Module is high-traffic (Customers, Pipeline, Dashboard) | Move is documented + non-live state |
| New connector scaffolding (any Phase 4) | HALT | E0/S0 unwritten | E0 + S0 ratified |
| RLS policy change | CRAWL | Touches roles in use | Adds new role-isolated table only |
| Bulk-rename of a `window.*` global | HALT | Registry not at 100 % coverage | Registry at 100 % + 7 observation days |
| Test harness adoption | HALT | Phase B not yet stable | Phase B stable + explicit need |

---

## 9. WHAT TO DO WHEN THE SPEED RULES PRODUCE A STALL

A practical question: what if every candidate work item is downshifted past where it can be picked up in the current session? Three answers, in order:

### 9.1 Pull a smaller L1 packet
There is almost always a doc-only or skills-file action that advances the pack without consuming context. `MASTER.md §3/§4` currency, BUILD_INTELLIGENCE consolidation entry, skills audit, KPI catalog touch-up.

### 9.2 Resolve a track-readiness condition
Check §6.1. If two or more conditions are unresolved, resolving one *is* the session's work.

### 9.3 Write the next analysis doc
The cartography pack itself is the substrate. If the next executable action is unclear, the highest-leverage move is to make a future session's action more clear. (This document is itself an instance of that move.)

A stall is never a reason to upshift past the speed limit. Stalls are reason to find the next-cheapest L1 item.

---

## 10. SUMMARY

| Question | Answer |
|---|---|
| When can execution go faster (GO)? | Doc-only commits; skills edits; append-only logs; module-internal patches on registered modules; visual-mass extractions (Stage 1, Stage A) |
| When must it slow (CAUTION)? | Shell touches beyond `?v=`; large-module patches; new `<script>`/sidebar/`data-roles`; `register()` ship; Stage 4/5 extracts; cohort 2/3 registrations |
| When must it crawl (CRAWL)? | Auth extract; strictness elevation; sidebar cutover; first-of-a-kind connector or webhook; RLS changes; global renames |
| When must it halt (HALT)? | L3 work before Phase B; L4 work before Phase A stable; any work needing E0/S0/G0 that hasn't been written |
| When must it freeze (FREEZE)? | This session class: `index.html`, worker, applied SQL, governance files, decomposition execution, Codex runs, runtime mutation |
| When is the track not ready? | Substrate missing; transition commit unwritten; tier choice unmade; authority table unwritten; `MASTER.md §3/§4` known-stale |
| Unsafe-forward-progress signals | Velocity drop; BUILD_INTELLIGENCE clustering; `?v=` skip; second frozen file emerging; cross-cutting rename in one PR; new `data-roles` mid-Phase-A; two integrations scaffolded at once; drift severity rising; frozen-file blast radius invoked; uncharacterized "let me just check" work; an L5 item feeling like L1 |
| What to do on stall | Pull a smaller L1; resolve a track-readiness condition; write the next analysis doc — never upshift |

---

## 11. CLOSING NOTE FOR THIS PACK

The far-track set (`POST_DECOMPOSITION_ROADMAP`, `TRACK_LAYER_MAP`, `TRAIN_SPEED_LIMITS`) is intended to be readable by *any* future Claude session at boot, alongside the rest of the cartography pack. Its purpose is to make the next several sessions' work *retrievable* without re-prompting — a session boots, reads the pack, finds the L1 list in `TRACK_LAYER_MAP §1`, checks `TRAIN_SPEED_LIMITS §8` for the band, and proceeds.

The pack is the substrate for substrate. Adding a `register()` function to `js/shell_utils.js` later is what makes module isolation structural. Adding `docs/runtime/` to the boot-read chain now is what makes session work *resumable* without continued human re-direction. The two acts are isomorphic at different layers of the system.

The train moves on its rail because the rail was laid ahead of it.

---

*End of far-track set. Adjacent docs: `POST_DECOMPOSITION_ROADMAP.md`, `TRACK_LAYER_MAP.md`. Full pack: 12 documents under `docs/runtime/`.*
