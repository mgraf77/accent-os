# TRAIN_TRACK_OPERATING_MODEL

> Operating doctrine for multi-session architecture work on AccentOS.
> Defines the train/track actor model, track-decay mechanics, freshness rules,
> stale-track prevention, and the next track-builder assignment strategy.
> Analysis only — no code change, no governance edit, no runtime mutation.
> 13th doc in the cartography pack under `docs/runtime/`.
> Snapshot date: 2026-05-10.

---

## 0. WHY THIS DOC EXISTS — RECALIBRATION TRIGGER

Session 10 (execution) shipped decomposition packets P1 → P9 in a single corridor and reduced `index.html` from ~7,169 LOC / ~735 KB to ~2,009 LOC. That pace is faster than the pack's prior projection — `FROZEN_FILE_PRESSURE_ANALYSIS §8` had estimated Phases 1–7 cumulatively removing ~3,000–4,000 LOC (a ~50 % drop). Reality at end of Session 10 is closer to a **~72 % drop**, achieved in one corridor.

Two consequences:

1. **The far-track team's prior P7 → P12 plan (Session 16 build) is now stale.** The packets it sized, sequenced, and cost-estimated were measured against a 7,169-LOC shell. The current shell is a different artifact. Some P7 → P12 packets no longer exist (the work they pointed at has already happened). Some should be re-sized (same name, different content). Some are still valid but with shifted prerequisites.

2. **Several pack-internal numbers are now historical.** `REPO_TOPOLOGY_MAP §1.1` ("7,169 lines · ~735 KB"), `FROZEN_FILE_PRESSURE_ANALYSIS §0` ("~76 % of declared cap"), and `ARCHITECTURAL_DRIFT_MODEL §6.1` (six-day-old size drift) all describe the *pre-decomposition* shell. The pack itself now carries a drift artifact — the *meta* problem the pack diagnoses has reproduced inside the pack.

This doc does not fix the stale numbers (that is a track-builder packet for next session). It writes the **operating model** that prevents the same staleness from recurring as the train continues.

---

## 1. THE ACTOR MODEL

Three roles, mutually exclusive within a single session, simultaneous across the project.

### 1.1 The train
**Definition:** the session that is *executing* — landing decomposition stages, registering modules, shipping verifiable packets that move the live codebase.

**Properties:**
- Runs against a *fresh* working tree (typically `main` or an integration branch).
- Reads track docs as input; writes code + verification commits as output.
- Its shipping rate sets the *true ground state* of the system. The train does not wait for the track unless explicitly stop-signaled.
- Operates under `TRAIN_SPEED_LIMITS` bands.

**What it must not do:**
- Author the next corridor's spec from inside the same session it is executing.
- Re-architect mid-corridor. ("I'll just refactor while I'm here" is the canonical track-jumping failure.)
- Treat track docs as *suggestions* — track is contractual within a corridor; track is *advisory* outside it.

### 1.2 The near-track builder
**Definition:** a session that prepares the *immediately next* executable corridor — the next 3–9 packets the train will ship.

**Properties:**
- Runs in an analysis lane, typically on a separate branch.
- Reads the *current* live codebase state, the most recent train output, and any train-side observations (BUILD_INTELLIGENCE entries, regressions, surprises).
- Writes packet specs sized to 30–90 minute execution windows. Each packet has a name, a precondition, a single-revert rollback, a verification step, and a clear exit criterion.
- The near-track builder is the role most likely to be outrun — its work has the shortest shelf life.

**Output shape:**
- A `corridor-NN.md` doc (or section) listing N packets in execution order, with prerequisites and per-packet band assignments.
- An updated L1 list in `TRACK_LAYER_MAP §1`.

### 1.3 The far-track builder
**Definition:** a session that prepares architecture *beyond* the next executable corridor — phase shapes, substrate seeds (E0/S0/G0), forbidden-track items, transition criteria.

**Properties:**
- Runs in pure analysis lane.
- Reads the *current* live codebase state plus the near-track plan plus the long-range governance invariants.
- Writes conceptual / strategic docs (the existing cartography pack is an instance of far-track output).
- Far-track output has the longest shelf life — it can survive several train sessions without going stale because it operates at a level above per-packet sizing.

**Output shape:**
- Pack-class docs under `docs/runtime/`.
- Doctrine, classifications, decision criteria — not packet specs.

### 1.4 Role-mixing rule
A single session is one role. Mixing produces stale track:
- Train + near-track in one session = the train inevitably reorders or skips packets, and the resulting "track" is already shipped before it is ratified.
- Train + far-track = architectural decisions are made under shipping pressure, which is the canonical drift accumulator (`ARCHITECTURAL_DRIFT_MODEL §2`).
- Near-track + far-track = the near-track packets get bent toward the far-track shape rather than toward the live ground state. Common when one session feels "productive."

**Rule: declare the role at session start. Hold it for the session. Switch between sessions, not within them.**

---

## 2. TRACK READINESS

### 2.1 Definition
Track is *ready* for the train when **all of the following** are true at the moment the train boots:

1. The next corridor (3–9 packets) is documented with each packet sized for 30–90 minutes of execution.
2. Each packet has: prerequisite, exit criterion, single-revert rollback, verify step, band assignment.
3. The corridor's first packet is currently *unblocked* — its prerequisite holds in the live codebase as of the most recent commit on the integration branch.
4. The corridor was authored against a snapshot of the codebase no older than the train's last shipped commit.
5. No "Stop signal" (§5) is active.

If any of those are false, **track is not ready** and the train's first action is to repair track readiness rather than to ship.

### 2.2 Why each rule exists
1. *3–9 packets sized for 30–90 minutes:* the train ships ~1 packet per 30–90 min in disciplined corridors. Less than 3 packets is "the train will outrun the track in one session." More than 9 is "we're planning faster than reality moves." 5–7 is the typical sweet spot.
2. *Per-packet rollback + verify:* the train cannot pause mid-corridor to invent these. Their absence is what produced the prior session's "wip: pause point" commits.
3. *First packet unblocked:* prevents the train from spending its first 20 minutes diagnosing why the spec doesn't match reality.
4. *Snapshot freshness:* covered in §3.
5. *Stop signal cleared:* covered in §5.

### 2.3 The readiness check
Before the train boots, a 60-second checklist:

```
[ ] Track corridor doc exists and lists ≥3 packets
[ ] First packet's prerequisite is "true now" against current branch HEAD
[ ] No commit landed on integration branch since track was authored
    (or — author of track has confirmed the new commits don't invalidate it)
[ ] No Stop signal in §5 is active
[ ] Each packet has a band assignment from TRAIN_SPEED_LIMITS
[ ] Each packet has a verify step that fits in the corridor
```

If two or more boxes unchecked → track is *not* ready. The train's first packet is to refresh track.

---

## 3. LIVE TRACK vs PLANNED TRACK

A central distinction the prior pack did not draw cleanly.

### 3.1 Live track
**Definition:** track that has been authored against the *current* state of the integration branch and is approved for execution.

Properties:
- Author session reviewed the most recent train commit before writing.
- No subsequent train commit has invalidated any packet's prerequisite.
- Time-since-authored is short enough that codebase drift hasn't crossed the staleness threshold (§4.3).

**Live track is contractual.** The train executes it as written. Deviations require an explicit track-refresh.

### 3.2 Planned track
**Definition:** track that has been authored but is *not yet live* — either because it was sized against an older codebase snapshot, or because it depends on a corridor that has not yet shipped.

Properties:
- Useful as a forecast — "this is what we expect to do after the next corridor."
- Not contractual — the train must not execute planned track without first promoting it to live (§3.4).

**Planned track is advisory.** Treating it as live is the canonical stale-track failure.

### 3.3 The promotion path
Planned track becomes live when:
1. Its prerequisite corridor has shipped.
2. A near-track builder session reviews each packet against the new ground state.
3. Each packet is either (a) confirmed valid as-written, (b) re-sized in place, or (c) deleted because the work no longer applies.
4. The corridor is re-stamped with a fresh authoring date and a reference to the integration branch HEAD it was reviewed against.

**A planned-track corridor that is more than two train-corridors old should be assumed stale and re-validated, not promoted.**

### 3.4 The Session 10 failure mode (worked example)
Session 16's far-track team authored a P7 → P12 plan against a 7,169-LOC `index.html`. Session 10 then shipped P1 → P9 in one corridor — going past P7 directly. The Session 16 plan was always *planned track* — it was never live, because its prerequisite (P1 → P6 shipped) had not held at the time of authoring. The mistake was treating it as if its turn would come *next*. The train didn't reach Session 16's track; it ran past where Session 16's track started.

Two fixes:
- Planned track should not be treated as scheduled. (§3.2 rule.)
- Far-track work should be authored *layer-relative* (Phase B vs Phase C), not *packet-relative* (P7–P12). Packet-relative planning ages discontinuously when the train goes faster than expected.

---

## 4. TRACK DECAY MODEL

### 4.1 Why tracks go stale
A track packet is stale when the live codebase no longer matches the assumptions it was written under. Four mechanisms:

1. **Prerequisite shift.** "Stage 1 CSS extract" assumes there are inline `<style>` blocks. If the train has already extracted them, the packet is empty.
2. **Surface change.** "Patch `customers.js` to add X" assumes `customers.js` has structure Y. If a prior corridor refactored it, X may already be there or no longer apply.
3. **Coupling change.** "Module reads `sbFetch`" assumes the global is shaped a certain way. If a corridor wrapped it, the consumer count and the consumption shape are different.
4. **Phase shift.** "L3 strictness elevation" assumes Phase B has begun. If the train compressed Phase B into a corridor, the packet is now L4 work or already done.

### 4.2 Decay rate
Decay is *not* linear with time. It is linear with **shipped commits on the integration branch since the track was authored**.

Empirical bands (calibrated against Session 10 / 16 experience):

| Commits since track authored | Decay state |
|---|---|
| 0–2 | Fresh — execute as written |
| 3–6 | Half-fresh — review-on-promotion required |
| 7–12 | Stale — re-validate every packet |
| 13+ | Discard — re-author against new ground state |

Calendar time is a poor proxy because some sessions ship 1 commit and others ship 9. Commit count is the load-bearing metric.

### 4.3 The staleness threshold
The transition from "fresh" to "half-fresh" (≥3 commits since authoring) is the **staleness threshold** — at or past this point, planned track must not be promoted to live without explicit per-packet review.

Session 10 → Session 16 example: the integration branch advanced by ~9 commits between Session 16 authoring and Session 10 shipping. The track was already in the "stale" band before the train reached it. Promotion at that point would have re-shipped already-completed work or attempted to apply patches against a shell that no longer existed.

### 4.4 Track-decay symptoms during execution
If the train sees these signals while executing live track, the track has decayed under its feet (most often because a parallel session shipped to the same branch):

- A packet's prerequisite check fails on first attempt.
- A surgical `str_replace` patch's `old_string` is not found.
- A verify step finds the change "already there."
- Two consecutive packets touch the same lines.
- A patch's diff includes more lines than the spec sized for.

**Action on any of these: stop the train, re-validate the corridor, refresh track before continuing.** Never patch around a decayed packet.

---

## 5. STOP SIGNALS

When the train must freeze regardless of bands or readiness:

### 5.1 Hard stops
1. **Track decay symptom (§4.4) on the first or second packet of a corridor.** Indicates the corridor was promoted from a stale planned-track. Refresh before continuing.
2. **Branch divergence.** Another session shipped to the integration branch since the train booted. Even if changes look orthogonal, halt — at minimum re-pull and re-validate the next packet.
3. **Frozen-file blast radius invoked.** The train is being asked to touch `index.html` shell auth, `sbFetch`, RLS, applied SQL migrations, or the worker. (`SAFE_MUTATION_ZONES §1.4 / §1.6`.)
4. **Cross-cutting global rename.** Triggered by `TRAIN_SPEED_LIMITS §7.5` — requires registry coverage that almost certainly is not in place.
5. **Two integrations being touched in one corridor.** §7.7 same doc — substrate must precede.
6. **A new `<script>` tag, sidebar `<a>`, or `data-roles` is being added during Phase A.** §7.6, §7.8 same doc — regenerates the very pressure being drained.
7. **Drift severity rising one band during a corridor.** A packet that should reduce drift increased it. Stop and audit.
8. **Verify step fails on a shipped packet.** The train must not chain to the next packet on top of an unverified one.

### 5.2 Soft stops (downshift, don't freeze)
- Refactor velocity drop within a corridor (a packet sized at 45 min is at 90 min).
- BUILD_INTELLIGENCE clustering on the same file in successive corridors.
- A `?v=` cache-bust skip.
- A second frozen-file candidate emerging.

Soft stops trigger a band downshift (`TRAIN_SPEED_LIMITS §7`) but do not freeze the train. Three soft stops in one corridor become a hard stop.

### 5.3 What "freeze" means operationally
- The train commits whatever is verified and complete.
- The train pushes (so other sessions see the state).
- The train writes a `WORK_IN_PROGRESS.md` note naming the freeze cause.
- The train ends. The next session boots into a near-track-builder role to refresh track.

**Never push through a hard stop. The cost of a partial push is a few minutes; the cost of a chained-onto-bad-state push is the next 3–5 sessions of debugging.**

---

## 6. SPEED BANDS — HOW AGGRESSIVELY TO CHAIN PACKETS

The train chains packets within a corridor when the band allows. Bands inherited from `TRAIN_SPEED_LIMITS §0`, with chain rules added.

| Band | Chain rule | Verify cadence |
|---|---|---|
| GO | Chain freely up to corridor end | End-of-corridor verify is sufficient |
| CAUTION | Chain up to 3 packets, then verify before chaining further | Per packet for the first; per cluster of 3 |
| CRAWL | Do not chain; verify each packet individually | Per packet, with explicit pause |
| HALT | Do not execute; this band means track-readiness fails | n/a |
| FREEZE | Do not execute in this lane | n/a |

### 6.1 Mixed-band corridors
A corridor may contain packets at different bands. The whole corridor inherits the *lowest band's pacing rule* between any two packets that touch overlapping surfaces.

Example: a 6-packet corridor where packets 1–3 are GO (CSS extract pieces), packet 4 is CAUTION (shell utility), packet 5 is GO (small module register), packet 6 is CRAWL (auth-adjacent change). The train chains 1–3, verifies, chains 4–5 with mid-cluster verify, then halts before 6 for explicit owner check-in. The CRAWL packet doesn't poison the GO packets *upstream* of it.

### 6.2 Train-side pacing rule
- A train session targets one corridor. Mixing corridors in one session re-introduces planning load and breaks the verify-at-end-of-corridor model.
- A train session may end *before* the corridor completes if a stop signal fires; the partial-corridor commit must include a `WORK_IN_PROGRESS.md` note naming the next packet.

---

## 7. WHY SESSION 10 OUTRAN SESSION 16

A short post-mortem framed against this model.

### 7.1 What happened
- Session 16 ran as a far-track builder and authored P7 → P12 against a 7,169-LOC shell snapshot.
- Session 10 ran as the train and executed P1 → P9 in a single corridor — landing past P7 in one session.
- Session 16's planned track became unreachable: its prerequisite (P6 shipped) was leapfrogged.

### 7.2 The structural cause
**Far-track output was packet-numbered (P7–P12) instead of phase-classed (Phase B substrate / Phase C seed).** Packet numbers anchor a plan to a specific train-pace assumption; phases anchor to *track readiness conditions*. When the train accelerated, packet numbers slid out from under the plan; phases would have absorbed the acceleration without going stale.

### 7.3 The contributing causes
- The far-track team did not designate its output as *planned track* (advisory) vs *live track* (contractual). Both were treated as if scheduled.
- There was no "≥3 commits since authoring → re-validate" rule. The plan aged through ~9 commits without a re-validation gate.
- Train-side speed bands were not yet defined for "how aggressively to chain." Session 10 chained 9 packets in one corridor — not because it was reckless, but because there was no band saying "stop after 3."

### 7.4 The fix this doc encodes
- Far-track output is **phase-relative**, not packet-relative.
- Planned track is **advisory** until promoted; promotion requires re-validation.
- Decay rate is **commit-counted**, not calendar-aged.
- Speed bands cap chain depth: 3 for CAUTION, 1 for CRAWL.
- Stop signals (§5) include track-decay symptoms.

The pattern was diagnosable from the cartography pack's prior framing — "drift accumulates whenever a system change costs less than the documentation/structure update that would track it" (`ARCHITECTURAL_DRIFT_MODEL §2`). Session 16's planned track was the documentation; Session 10's commits were the system change. The asymmetry compounded.

---

## 8. STALE-TRACK PREVENTION RULES

A compact rulebook. Each rule applies to a specific role.

### 8.1 Rules for the near-track builder
1. **Author against HEAD.** Read the integration branch HEAD before writing any packet. If your last read is more than 3 commits old, re-read.
2. **Phase-class your output.** Each packet is tagged with the phase it advances (Phase A drain / Phase B coverage / Phase C seed). Numeric ordering is cosmetic.
3. **Date-stamp + commit-stamp.** Each corridor doc includes its authoring date *and* the integration branch HEAD SHA at authoring time.
4. **Size for 30–90 minutes per packet.** Outside that range and the train cannot pace reliably.
5. **Include a prerequisite check command per packet** that the train can run to confirm the precondition holds. (e.g. "grep returns N hits" / "file size <X bytes" / "register() function exists").
6. **Mark the corridor's *first* packet explicitly** as the unblocked starting point.
7. **Author at most 1.5x of one corridor's worth of packets.** Authoring more is far-track work, not near-track.

### 8.2 Rules for the far-track builder
1. **Phase-class everything.** Never use packet numbers to anchor far-track plans. Use phase names + transition criteria.
2. **Output is advisory until promoted.** Mark every far-track artifact as *planned track*.
3. **Don't size or sequence specific packets.** That's near-track work and ages too fast at far-track horizon.
4. **Define decisions, not actions.** E0/S0/G0 are decisions; "ship E0 in session 17" is a near-track concern, not a far-track concern.
5. **Re-read the pack at session start.** If pack-internal numbers drift from reality (as they did in this recalibration), flag the drift first; write new far-track second.

### 8.3 Rules for the train
1. **Run the readiness check (§2.3) before shipping anything.**
2. **Stop on the first track-decay symptom (§4.4).**
3. **Honor band chain limits (§6).**
4. **Commit and push before each verify step.** This way another session sees state if you have to freeze.
5. **Never modify track docs from inside the train session.** If a packet is wrong, halt and let a near-track builder fix it.
6. **Leave a `WORK_IN_PROGRESS.md` note at any pause** naming the next intended packet *and* whether track was decaying.

### 8.4 Cross-role rules
1. **Branch hygiene.** The train runs against the integration branch. Near-track and far-track work runs on analysis branches. Promotion is a merge, not a copy-paste.
2. **No role-mixing.** A session declares its role at start and holds it.
3. **Pack stewardship.** When the cartography pack's internal numbers go stale (as in this recalibration), the next pack-touching session corrects them as a single dedicated commit. Don't scatter the correction across feature corridors.

---

## 9. FRESHNESS CHECKS BEFORE EXECUTION

The train's pre-flight, expanded from §2.3:

```
PRE-FLIGHT  (target: < 90 seconds)

1. Read the corridor doc.
2. Note the corridor's authoring SHA + date.
3. git log --oneline <authoring-SHA>..HEAD on the integration branch.
   If >2 commits, halt. Promote to a near-track refresh first.
4. Run the first packet's prerequisite check.
   If fails, halt. Refresh track.
5. Confirm the band assignments are present.
6. Confirm a verify step is named for each packet.
7. Confirm no §5 hard-stop is active.
8. Confirm the corridor's expected exit state is reachable
   from current HEAD with the listed packets.
9. Set a session-end checkpoint: at minimum, what verifies before pushing.
10. Begin packet 1.
```

Steps 1–8 are read-only. Step 9 is a one-line plan write. Step 10 is the first commit-track work.

If the corridor was authored against the *current* HEAD (commit count 0), steps 3–4 collapse to a fast confirm and the whole pre-flight runs in <30 seconds. The expensive cases are the corridors that aged.

---

## 10. HOW MANY PACKETS AHEAD TO PLAN

A heuristic, derived from this recalibration.

| Horizon | Format | Owner role | Lifespan |
|---|---|---|---|
| Current corridor (0–9 packets) | `corridor-NN.md` with sized packets | near-track builder | 1 train session |
| Next corridor (3–9 packets sketched) | section in same doc; not yet sized | near-track builder | re-validate before promotion |
| Phase target (e.g. Phase A finish state) | conceptual, in `POST_DECOMPOSITION_ROADMAP` | far-track builder | many sessions |
| Post-phase architecture (E0/S0/G0) | conceptual seeds, in pack docs | far-track builder | indefinite |

**One full corridor live + one sketched ahead is the sweet spot.** Two full corridors planned ahead has historically gone stale before the train reaches it. Zero planned ahead means every train session has a near-track-builder phase first, doubling per-session overhead.

The forbidden cases:
- Three or more corridors planned ahead in packet detail. They will go stale.
- Phase plans expressed as packet numbers ("Session 17 = P10–P14"). Same failure mode.
- A "long range execution plan" with date estimates. Calendar projections lie because the train's pace varies by 5x between corridors.

---

## 11. HOW TO BUILD 30–90 MINUTE CORRIDORS SAFELY

Concrete near-track-builder doctrine.

### 11.1 Corridor anatomy
```
corridor-NN.md
  Authored: 2026-MM-DD
  Authored against: <integration-branch HEAD SHA>
  Phase: A | B | C
  Expected duration: <NN-NN minutes>
  Stop signals to watch: <list>

  Packet 1 [GO]
    Precondition: <command + expected output>
    Action: <one surgical patch description>
    Verify: <command + expected output>
    Rollback: <single git revert OR specific revert command>
    Estimated time: <NN min>

  Packet 2 [CAUTION]
    ...

  Packet N [GO]
    ...

  End-of-corridor verify: <command(s) for the corridor as a whole>
  Exit state: <one-sentence description of the codebase after the corridor>
```

### 11.2 Sizing rules
- **30 minutes minimum.** Below this, the packet is too small to deserve its own pre-flight overhead; merge with a neighbor.
- **90 minutes maximum.** Above this, the packet is two packets; split it. The single-revert rollback property breaks at scale.
- **Single concern per packet.** A packet that says "extract CSS *and* update MASTER.md" is two packets.

### 11.3 Stitching rules
- Adjacent packets should not share a single surgical patch surface. If packets 3 and 4 both want to modify `js/customers.js` in different places, the train will collide them.
- Adjacent packets at different bands are allowed (see §6.1) but the lower-band one breaks the chain.
- The first packet must be unblocked at corridor start. The last packet must produce the corridor's declared exit state.

### 11.4 Verification structure
- Per-packet verify must be runnable in <90 seconds.
- End-of-corridor verify may be richer (a few minutes), and ideally includes one *behavior* check (e.g. "load the affected page in a browser; confirm it renders") rather than only static checks.
- A verify step that says "looks fine" is not a verify step. Name what the train should observe.

---

## 12. NEXT TRACK-BUILDER ASSIGNMENT STRATEGY

Given the current state (Session 10 just shipped P1–P9; pack carries pre-decomposition numbers; no current near-track corridor exists), the recommended assignment for the next several sessions:

### 12.1 Immediate priority (next session)
**Role: near-track builder.** Output:

1. A single `docs/runtime/corridor-11.md` doc that:
   - Reads `index.html` at its current ~2,009-LOC state.
   - Inventories what P1–P9 actually accomplished (which stages of `DECOMPOSITION_STRATEGY_V1` correspond to which P-packets).
   - Identifies what remains of the original Phase A plan post-Session-10.
   - Sizes the next 5–7 packets at 30–90 minutes each.
   - Stamps the corridor with HEAD SHA at authoring time.
2. A short pack-staleness correction list — a single bullet list naming every cartography-pack section that uses the ~7,169 / ~735 KB / ~76 % numbers and needs update. Do not update the docs in this session; just list them.

### 12.2 Following session
**Role: near-track builder, second pass.** Output:
- Update the cartography pack's stale numbers in one dedicated commit (per §8.4 cross-role rule).
- Sketch corridor-12 (next-after-current).

### 12.3 Then
**Role: train.** Execute corridor-11 against the live integration branch.

### 12.4 Don't
- Don't start a new far-track build until at least one full corridor cycle has run under the doctrine in this doc. The doctrine itself is unproven; running it once gives evidence before extending it.
- Don't re-author the prior Session 16 P7–P12 plan. It is dead. Anything still valuable in it migrates into corridor-11 as a fresh packet, not as a revived plan.
- Don't combine "fix pack staleness" with "ship corridor-11." Different roles, different sessions.

---

## 13. RECOMMENDED TRAIN/TRACK DOCTRINE — SUMMARY

| Principle | One-line statement |
|---|---|
| Roles are exclusive per session | Train, near-track, far-track — declare at start, hold for session |
| Track is contractual only when live | Live = authored against current HEAD with no intervening commits beyond threshold |
| Decay is commit-counted | ≥3 commits since authoring → re-validate; ≥13 → discard |
| Far-track is phase-classed | Use Phase A/B/C; never anchor to packet numbers |
| Speed-band chain limits | GO chain freely · CAUTION 3 then verify · CRAWL 1 at a time · HALT/FREEZE not at all |
| Stop signals freeze the train | Track-decay symptoms · branch divergence · frozen-file blast radius · drift band rise · verify failure |
| Plan one corridor live + one sketched | More than two corridors deep ages out before reaching it |
| Corridor packets sized 30–90 min | Below = merge · above = split |
| Pre-flight always | Read corridor → check decay → check first prereq → confirm bands → start |
| Pack stewardship | When pack numbers drift, correct in one dedicated commit, not scattered |
| Branch hygiene | Train on integration branch; near/far-track on analysis branches; promotion is merge |

---

## 14. CLEAN PAUSE

State at end of this analysis:

**Cartography pack:** 13 docs under `docs/runtime/`. The 12 prior docs carry pre-decomposition numbers (~7,169 LOC / ~735 KB / ~76 % of cap) that are now historical relative to Session 10's ~2,009-LOC reality. Pack staleness is *known* and is itself a worked example of the track-decay model documented here.

**Branches:** this analysis lane is on `claude/repo-cartography-analysis-3McqU`. The execution work (P1–P9 / Session 10) landed on a sibling branch (likely `main`); merging into this branch is *not* in scope for this lane and would invalidate the analysis-only constraint.

**Doctrine ratification:** this doc is a doctrine *proposal*. It becomes operating rule only when (a) the next near-track session runs under it without surfacing structural problems, and (b) a governance commit references it from `MASTER.md` or `.claude/CLAUDE.md`. Until then, it is the cartography pack's recommendation, not enforced policy.

**Next move (advisory, not executed here):**
1. Next session boots in **near-track builder** role.
2. First action: read `index.html` at current ~2,009-LOC state on the integration branch.
3. Second action: author `docs/runtime/corridor-11.md` per §12.1.
4. Third action: list pack-staleness correction items.
5. End session.

**Train must not boot** until step 3 is complete and a corridor-11 doc exists. Any train session that boots without a live corridor will outrun whatever it finds.

---

*See `TRACK_LAYER_MAP.md` for the layered work-classification this doctrine assumes, and `TRAIN_SPEED_LIMITS.md` for the bands this doctrine extends with chain rules. The pack now totals 13 documents.*
