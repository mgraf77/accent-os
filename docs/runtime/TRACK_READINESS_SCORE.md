# TRACK READINESS SCORE

> **Companion to:** `TRACK_PRIORITIZATION_MATRIX.md`. Same synthesis substrate (the eight prior `docs/runtime/` analyses).
> **Scope:** A five-level readiness scheme for any candidate BUILD_PLAN track section. The matrix says *which* track to prepare next; this doc says *what state* each candidate is currently in and what evidence is required to move it forward safely.
> **Frame:** Analysis-only. Defines a classification scheme; does not execute any track. No code, no index.html edits, no governance changes, no Phase B start, no worker-count change.
> **Last updated:** 2026-05-10

---

## 0. Why a readiness score exists

A track section being highly *ranked* (per `TRACK_PRIORITIZATION_MATRIX.md`) does not mean it is *ready to build*. Readiness is a separate axis. A track can be #1 by score and still RED if it requires Captain credentials that haven't landed; a track can be GREEN to scope but BLACK to execute because its blocker is structural, not informational.

The five levels below are exclusive — every candidate sits at exactly one. Movement between levels requires explicit evidence (§ "Required evidence" within each level). Without that evidence, the track does not advance, regardless of scoring or operator pressure.

The scheme is designed to refuse common failure modes: scope-without-clarity (lands in YELLOW with no evidence path), build-without-blocker-clearance (lands in RED but ships anyway), build-when-architecture-isn't-ready (BLACK but framed as YELLOW).

---

## 1. The five levels

### 1.1 GREEN — executable now

Track is fully scoped, prerequisites are met, the build can begin within the current operating window without additional Captain decisions, credential delivery, or architectural prework.

### 1.2 YELLOW — needs validation

Track is scoped but at least one open question must be resolved before execution. The question is *informational*, not *political* — a known unknown with a clear answer-finding path.

### 1.3 ORANGE — needs governance / operator decision

Track requires a Captain-level decision before it can move forward: a strategic call, a vendor commitment, a budget approval, a risk acceptance. The decision cannot be delegated and is not purely informational.

### 1.4 RED — blocked

Track has a hard external dependency (credentials, third-party access, vendor confirmation) that prevents any meaningful progress. The blocker is named and known; resolution is outside Claude's reach.

### 1.5 BLACK — forbidden

Track must not be attempted under current conditions. Either:
- It is structurally unbuildable (no API path, no legal route, no data source), or
- Its execution would violate a higher-priority sequencing rule from `SCALING_SEQUENCE_ANALYSIS.md` (e.g., Codex as concurrent writer pre-isolation), or
- Its execution would generate compounding entropy that the system cannot absorb at current capacity.

BLACK is not "bad track." It is "right move at the wrong time, or wrong move at any time." Many BLACK tracks become GREEN later; some never do.

---

## 2. GREEN — executable now

### Required evidence

A track is GREEN only when *all* of the following are true:

1. The full BUILD_PLAN entry exists with at least: title, schema (if any), wire-up plan, verification path.
2. No M-task blocker remains (if M-tasks were attached, all are marked `[x]` in BUILD_PLAN_MICHAEL.md).
3. The track does not require any architectural prework that has not landed (i.e., does not depend on Phase 1 from `ARCHITECTURAL_PRIORITIZATION_MODEL.md` if Phase 1 hasn't shipped).
4. Captain has either explicitly approved the start or the track sits in a pre-approved class (per current OPERATING RULES).
5. The track's branch collision risk score (per `TRACK_PRIORITIZATION_MATRIX.md` §1.9) is ≥3.
6. The current parallelism state is GREEN or YELLOW per `PARALLELISM_SAFETY_THRESHOLDS.md`.

### Allowed action

- Begin implementation in a fresh `claude/<track-id>-<slug>` branch.
- Apply the pre-approved schema migration (if any) using the idempotent pattern.
- Follow the standard `js/<feature>.js` module pattern unless the BUILD_PLAN entry explicitly says otherwise.
- Commit and push at standard cadence per OPERATING RULES.
- Update WIP, BUILD_PLAN, SESSION_LOG at session-end (batched).

### Stop condition

The session must stop and re-evaluate readiness if any of:

- A new M-task is discovered mid-build.
- Branch collision risk turns out higher than scored (e.g., the feature actually requires significant index.html restructure).
- The current parallelism state shifts to RED per `PARALLELISM_SAFETY_THRESHOLDS.md`.
- An architectural assumption baked into the BUILD_PLAN entry no longer holds.
- Any cost in `ORCHESTRATION_COST_CENTERS.md` spikes during the build (e.g., a frozen-file event).

### Escalation path

If the stop condition fires, the track moves back to YELLOW (informational obstacle) or ORANGE (decision obstacle) with a one-line note in WIP describing the new state. It does not silently continue.

---

## 3. YELLOW — needs validation

### Required evidence

A track is YELLOW when:

1. It would otherwise be GREEN, *except* one or more open questions must be answered before execution.
2. The questions are *informational* (have a discoverable answer): which schema column to add, which vendor field to use, which routing pattern fits, what the existing `js/<feature>.js` module already does.
3. The questions are explicitly named in the BUILD_PLAN entry or in WIP. ("There's something we need to figure out" is not a valid YELLOW; it must be specific.)
4. Captain is not required to make a strategic call — only to provide information or approve the discovery work.

### Allowed action

- Run small, bounded discovery tasks: `grep` over existing modules, `cat` on schema, brief `Read` of relevant files.
- Draft a scoping note in WIP that names each question and proposes an answer-finding step.
- If the discovery clearly answers the question, advance the track to GREEN with a one-line note.
- If discovery raises new questions, stay at YELLOW and update the question list.

NOT allowed:

- Beginning implementation while questions remain open.
- Treating "I think the answer is X" as evidence; the answer must be confirmed.
- Spawning parallel YELLOW work — discovery is bounded; if multiple tracks need discovery, they queue serially per `PARALLELISM_SAFETY_THRESHOLDS.md`.

### Stop condition

- Discovery exceeds 2k tokens of session time without progress → escalate.
- Multiple discovery rounds answer one question and surface two more → re-classify as ORANGE; the track is not just informational.
- Captain becomes the bottleneck for the answer (e.g., "what does this vendor want") → re-classify as ORANGE.

### Escalation path

YELLOW → GREEN if questions resolved.
YELLOW → ORANGE if questions turn out to require Captain decision.
YELLOW → RED if questions reveal a missing external dependency.

---

## 4. ORANGE — needs governance / operator decision

### Required evidence

A track is ORANGE when:

1. Captain decision is required to proceed. Examples: strategic positioning ("do we want to support trade pricing?"), vendor commitment ("are we OK depending on Windward's S5WebAPI?"), budget ("do we want to pay for the Klaviyo tier this requires?"), risk acceptance ("are we comfortable shipping this without a paired down-migration?").
2. The decision question is *named precisely* in WIP or in a dedicated decision-log entry. Vague "needs Michael's input" is not ORANGE; it's not classified.
3. The decision is irreversible or expensive to reverse — otherwise it would be GREEN with a short Captain check.
4. The track cannot be partially completed without making the decision (i.e., scoping the decision-pending portion is wasted work).

### Allowed action

- Write a Captain-facing decision brief: 3–5 sentences naming the decision, the options, the recommendation, the consequences.
- Surface the decision brief at the next Captain interaction (or during session-end if Captain is the next reader).
- Continue with adjacent GREEN work that does not depend on the decision.

NOT allowed:

- Choosing the option on Captain's behalf, even when the recommendation seems obvious.
- "Speculative implementation" — building one branch under each option in parallel.
- Stalling other tracks waiting for a single ORANGE decision; route around it.

### Stop condition

- Captain has not engaged with the decision after 7 days → re-classify the track to RED (effectively blocked) and remove from the active queue.
- Decision becomes ambiguous due to changing conditions → escalate to a synchronous Captain conversation rather than continuing async.

### Escalation path

ORANGE → GREEN once the decision lands.
ORANGE → BLACK if the decision is "no" and the track should not be revisited.
ORANGE → RED if the decision reveals a hard external blocker.

---

## 5. RED — blocked

### Required evidence

A track is RED when:

1. A hard external dependency is missing: API credentials, vendor confirmation, third-party access, regulatory approval.
2. The dependency is *named specifically* — usually as an M-task in `BUILD_PLAN_MICHAEL.md` (e.g., M03, M04, M06, M09, M10).
3. The dependency cannot be worked around inside the system; no clever scoping makes the track buildable without it.
4. The dependency is identified as actionable by Captain (Captain can, at some point, deliver it).

### Allowed action

- Write a "ready when unblocked" preparation note in BUILD_PLAN: schema sketch, expected wire-up shape, identified verification metric.
- Keep the M-task visible in `BUILD_PLAN_MICHAEL.md` and tracked in MASTER §13.
- Periodically re-check the M-task status (e.g., at session-start scan).

NOT allowed:

- Building stub / fake / mock implementations that simulate the missing dependency. (Per "no fake-runtime language" rule and prior analysis on out-of-band drift.)
- Attempting to obtain the credential via shortcuts.
- Ignoring the RED status because the track is high-priority — high priority + blocked = wait.

### Stop condition

- M-task is marked `[x]` → re-evaluate the track. Often advances to GREEN, sometimes to YELLOW (additional questions), occasionally to ORANGE (decision still needed).
- M-task has been open >90 days → consider the track effectively deferred; lower its priority weight in the matrix until the M-task is renewed.
- The dependency is judged *unobtainable* (not just delayed) → re-classify to BLACK.

### Escalation path

RED → GREEN/YELLOW/ORANGE when blocker clears.
RED → BLACK if the blocker is judged permanent.

---

## 6. BLACK — forbidden

### Required evidence

A track is BLACK when *any* of the following hold:

1. **Structurally unbuildable.** No API path exists (e.g., 6.12 Google Ads / Meta Ads — no API access per MASTER §10).
2. **Sequencing-forbidden.** The track would violate a sequencing rule from `SCALING_SEQUENCE_ANALYSIS.md`. Examples: any move that would put Codex or another model as a concurrent writer on `index.html` before module isolation is real; any move that would raise overnight N past 3 before Phase 1 lands.
3. **Capacity-forbidden.** Building would push the system into Zone RED of `PARALLELISM_SAFETY_THRESHOLDS.md` (BE > 0.40) and reconciliation cost would exceed track value.
4. **Captain-veto.** Captain has explicitly said "do not build this" and the veto stands until rescinded.

### Allowed action

- Document why the track is BLACK in `BUILD_PLAN_CLAUDE.md` or in a decision-log entry.
- Periodically re-check whether the conditions causing BLACK still hold — some BLACK tracks become GREEN after Phase 1 / Phase 2 lands.

NOT allowed:

- Beginning implementation under any conditions.
- "Just a small POC" — POCs become commitments.
- Re-classifying a track from BLACK to YELLOW based on operator pressure rather than evidence.

### Stop condition

- The condition causing BLACK is judged *permanent* → the track is removed from the candidate inventory entirely.
- The condition causing BLACK is judged *temporary* and clears (e.g., Phase 1 lands and a sequencing-forbidden track becomes safe) → re-evaluate readiness; track may advance to GREEN, YELLOW, or RED.

### Escalation path

BLACK → re-evaluate when the underlying condition changes. Movement out of BLACK requires explicit evidence that the cause is gone, not just operator wish.

---

## 7. Current readiness assignments (snapshot, 2026-05-10)

Applying the readiness scheme to the ten unfinished BUILD_PLAN candidates:

| Track | Score | Readiness | Reason |
|---|---|---|---|
| 6.11 Windward ERP Live | 49.6 | **RED** | M03 + M10 |
| 5.13 E-Commerce Command Center | 45.6 | **RED** | M04 + M05 |
| 6.3 BigCommerce REST | 41.5 | **RED** | M04 |
| 6.1 GA4 integration | 38.5 | **RED** | M06 |
| 6.2 GSC integration | 37.5 | **RED** | M06 |
| 6.6 Vendor Rep Portal | 32.5 | **BLACK** (sequencing) | External-facing portal — needs loader boundaries (Phase 1) before safe |
| 6.4 Klaviyo integration | 31.7 | **RED** | M09 |
| 6.5 Trade & Designer Portal | 30.7 | **BLACK** (sequencing) | Same as 6.6 |
| 6.10 AccentOS embed (public site) | 30.6 | **BLACK** (sequencing) | Embed surface depends on loader boundaries + Phase 2 substrate |
| 6.12 Google Ads / Meta Ads | 22.0 | **BLACK** (structural) | No API access — unbuildable today |

Observations:

- **No track is currently GREEN.** Every unfinished candidate is either blocked by a Captain credential (RED) or by a sequencing prerequisite (BLACK).
- **Five tracks are RED.** All five become evaluable the moment their M-tasks clear. Captain's M-task delivery directly determines the next-buildable set.
- **Three tracks are BLACK by sequencing.** They become evaluable after Phase 1 (decomposition + module isolation + loader boundaries) lands.
- **One track is BLACK by structural cause** (6.12). It will likely remain BLACK until Captain either obtains Google Ads API access or chooses to permanently de-scope the track.

This snapshot is informational. It is not implementation guidance.

---

## 8. State-transition rules

A track may move between states only with explicit evidence. The valid transitions:

```
              ┌─────────────────┐
              │     BLACK       │
              └────┬─────┬──────┘
                   │     │
              (cause     (judged
              clears)    permanent)
                   │     │
                   ▼     ▼
            ┌─────────┐  removed
            │   RED   │
            └────┬────┘
                 │
             (M-task
              marked [x])
                 │
                 ▼
       ┌──────────────────┐
       │     ORANGE       │ ◄── Captain decision needed
       └────┬─────────────┘
            │
        (decision
         lands)
            │
            ▼
       ┌──────────────────┐
       │     YELLOW       │ ◄── informational discovery
       └────┬─────────────┘
            │
        (questions
         resolved)
            │
            ▼
       ┌──────────────────┐
       │     GREEN        │ ◄── executable
       └──────────────────┘
```

Two rules govern transitions:

1. **No skipping levels in the wrong direction.** A track cannot go directly from RED to GREEN without passing through whatever evidence YELLOW and ORANGE would require. (In practice, when an M-task clears, a track often goes RED → YELLOW briefly while final scoping happens.)
2. **Backward transitions are allowed and expected.** A GREEN track that hits a stop condition mid-build can drop back to YELLOW or ORANGE. Backward movement is not failure; it's the system catching itself before producing entropy.

---

## 9. What the readiness scheme refuses

By design, the scheme refuses several common failure modes:

### 9.1 "It's almost ready, let's just start"

A YELLOW track with one open question cannot be built. The question must be answered first. This refuses scope-creep-during-build, which is one of the largest sources of mid-session pivots that produce stale WIP.

### 9.2 "Captain will approve later, let's preempt"

An ORANGE track cannot be implemented under the assumption that Captain will say yes. This refuses the speculative-implementation pattern that produces work which has to be undone if Captain says no.

### 9.3 "The blocker will clear soon"

A RED track cannot be partially built in anticipation of the blocker clearing. This refuses the build-then-stub pattern that creates fake-runtime language and dead code paths.

### 9.4 "It's BLACK but the architecture is almost ready"

A BLACK track cannot be advanced based on optimism about prerequisite phases. The cause must actually be gone, with evidence. This refuses the most dangerous pattern: building against a future architecture that hasn't materialized.

### 9.5 "It's high priority, we should escalate the readiness"

Priority and readiness are independent. A high-priority RED track is still RED — it just deserves Captain's attention to clear the blocker. It does not become buildable because it is high-priority. This refuses the political-pressure-overrides-evidence pattern.

---

## 10. How readiness interacts with the matrix

The matrix (`TRACK_PRIORITIZATION_MATRIX.md`) gives a *score* per track. The readiness scheme gives a *state* per track. The build-queue (`TRACK_BUILD_QUEUE_V1.md`) combines both.

Practical interaction:

- **GREEN tracks ranked by score.** The top-scored GREEN track is the next to build.
- **YELLOW tracks ranked by (score × ease-of-answering-questions).** The top-scored YELLOW with the smallest discovery cost is the next to scope.
- **ORANGE tracks ranked by (score × decision urgency).** The top-scored ORANGE with the most-time-sensitive decision is the next to brief Captain about.
- **RED tracks ranked by (score × blocker-clearability).** The top-scored RED whose blocker is fastest to clear is the most-leveraged Captain ask.
- **BLACK tracks ranked by (score × likelihood-cause-clears).** Useful only as a watch-list — re-evaluate when the cause might have changed.

This combined rank — score and readiness together — produces the actual build queue.

---

## 11. DONE / KNOWN / NEXT

**DONE**
- Defined the five readiness levels (GREEN, YELLOW, ORANGE, RED, BLACK).
- Specified required evidence, allowed action, stop condition, escalation path for each.
- Snapshot-classified all 10 unfinished BUILD_PLAN candidates: 5 RED (Captain credential), 4 BLACK (3 sequencing, 1 structural), 0 currently GREEN/YELLOW/ORANGE.
- Specified the legal state-transition graph and the two rules that govern it.
- Named five common failure modes the scheme is designed to refuse.

**KNOWN**
- The current readiness picture has *no tracks at GREEN.* This is consistent with the architectural finding (Phase 1 hasn't happened) and the operational finding (M-tasks haven't cleared). It is not a system failure; it is the system correctly refusing to mark anything as ready when nothing is ready.
- The scheme assumes Captain participation in M-task resolution and ORANGE decisions. It does not model what happens if Captain disengages — that is out of scope.
- The "BLACK by sequencing" assignments depend on the architectural state described in `ARCHITECTURAL_PRIORITIZATION_MODEL.md`. If Phase 1 lands, three tracks (6.5, 6.6, 6.10) re-evaluate.

**NEXT**
- `TRACK_BUILD_QUEUE_V1.md` combines this readiness scheme with the matrix scores into a bounded queue.
- The most operator-actionable item from this doc: **the highest-leverage Captain action right now is M-task delivery, not new track scoping.** Specifically, M03 + M10 (clears 6.11) or M04 + M05 (clears 5.13 and 6.3). Either set unlocks a top-3 track.
