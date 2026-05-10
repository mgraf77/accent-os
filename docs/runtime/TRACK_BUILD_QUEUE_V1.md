# TRACK BUILD QUEUE V1

> **Companion to:** `TRACK_PRIORITIZATION_MATRIX.md` (scoring) + `TRACK_READINESS_SCORE.md` (state classification).
> **Scope:** A bounded, ranked queue of future track-building work for AccentOS, organized into near-track / middle-track / far-track / deferred / forbidden buckets.
> **Frame:** Analysis and planning only. No implementation, no runtime claims, no substrate claims, no autonomous spawning, no fake-runtime language. This document orders preparation; it does not start work.
> **Version:** v1, 2026-05-10. Re-version on every refresh.

---

## 0. What this queue is and isn't

**Is:** a snapshot of what's next, organized so the operator can see at a glance what to scope, what to wait on, what to leave alone. Each entry carries the matrix score, the readiness state, and the specific bounded action allowed at this moment.

**Isn't:** a build order to be executed automatically. Nothing in this queue is "ready to ship." The architecture work named in `ARCHITECTURAL_PRIORITIZATION_MODEL.md` outranks every track-section item and is not in this queue (it lives in its own lane).

**Bounded:** the queue lists 10 candidates plus the architecture lane. It does not invent new tracks. It does not propose new modules. It does not commit to building anything beyond what BUILD_PLAN_CLAUDE.md already names.

---

## 1. Queue structure

Five buckets, in order of expected attention:

- **Near-track** (1–4 weeks horizon): tracks that are likely to become buildable within Captain's next M-task delivery window. Worth scoping now.
- **Middle-track** (1–3 months): tracks that could become buildable within the next quarter, depending on Phase 1 progress and M-task delivery. Worth a one-paragraph readiness sketch.
- **Far-track** (3–6+ months): tracks dependent on architectural prerequisites that haven't been started. Watch-list only.
- **Deferred**: tracks where the readiness picture is ambiguous or where current operator capacity argues against engagement. Re-evaluate next refresh.
- **Forbidden**: tracks that must not be attempted under current conditions, by structural or sequencing rule.

The classification is *not* a promise about timing — Captain's M-task pace and architectural decisions both shift these. The horizons are honest estimates, not commitments.

---

## 2. Near-track (1–4 weeks)

These are the candidates that, if Captain delivers their M-tasks in the next operator window, become the most leveraged immediate work.

### 2.1 Track 6.11 — Windward ERP Live Integration

- **Matrix score:** 49.6 (rank 1 of 10).
- **Readiness:** RED (blocked on M03 + M10).
- **Why near-track:** Highest matrix score by a clear margin. Removes the largest Captain-relay in the system (manual sales-line review). Sharpens 6.9 demand forecast immediately. M-tasks are *known and named*, with paths to clearance (Windward written confirmation + Curtis outreach).
- **Allowed action now:** Write a "ready when unblocked" preparation note in BUILD_PLAN entry: schema sketch (likely 1–2 read-only mirror tables), expected `js/<feature>.js` module shape, identified verification metric (latest sales-line date matches Windward source-of-truth). One scoping pass, capped at ~30 minutes of session time. Do not draft schema migrations.
- **Stop condition for prep:** If scoping reveals this requires significant index.html restructure → escalate; the prep stops and the track gets a BLACK-by-sequencing addendum.
- **Captain-side action:** Pursue M03 + M10. This is the single highest-leverage Captain ask in the system.

### 2.2 Track 5.13 — E-Commerce Command Center

- **Matrix score:** 45.6 (rank 2).
- **Readiness:** RED (blocked on M04 + M05).
- **Why near-track:** Second-highest matrix score. Direct revenue-impact track. Verification clarity is high (revenue numbers are unambiguous). Captain has both M-tasks (BC API key, GMC API access) within reach.
- **Allowed action now:** Same pattern as 2.1 — preparation note: aggregation shape, planned read-only data sources, intended Daily Brief tile placement. ~30 minutes.
- **Stop condition for prep:** If scoping reveals dependencies on 6.3 BigCommerce REST being shipped first, stop and explicitly note the ordering — both should be queued together.
- **Captain-side action:** Pursue M04 + M05.

### 2.3 Track 6.3 — BigCommerce REST integration

- **Matrix score:** 41.5 (rank 3).
- **Readiness:** RED (blocked on M04 — same M-task as 5.13).
- **Why near-track:** Highest dependency-clearing score in the entire matrix (5/5). Unblocks 5.13 ecom command center and is a prerequisite for several future ecom analyses. Sharing M04 with 5.13 means one Captain action clears two tracks.
- **Allowed action now:** Preparation note: API surface scope (read-first, write-deferred), error-handling expectations, idempotency stance for any write paths. ~30 minutes.
- **Stop condition for prep:** If scoping suggests this needs runtime-substrate (Phase 2) deploy verification before write paths can be safe, restrict the prep note to read-first scope only.
- **Captain-side action:** Same M-task as 5.13.

---

## 3. Middle-track (1–3 months)

These are the candidates likely buildable inside the next quarter if either Captain delivers M-tasks or Phase 1 architecture lands.

### 3.1 Track 6.1 — GA4 integration

- **Matrix score:** 38.5 (rank 4).
- **Readiness:** RED (blocked on M06).
- **Why middle-track:** High future optionality (GA4 data feeds many future analyses), reasonable verification, but lower execution leverage than 6.11 or 5.13. M06 also unblocks 6.2.
- **Allowed action now:** None beyond a one-line BUILD_PLAN check at session-start scan. Do not pre-scope until 6.11 / 5.13 / 6.3 prep is complete; this is intentionally serialized.
- **Captain-side action:** M06, but lower priority than M03/M04/M10.

### 3.2 Track 6.2 — Google Search Console integration

- **Matrix score:** 37.5 (rank 5).
- **Readiness:** RED (blocked on M06 — same M-task as 6.1).
- **Why middle-track:** Same M-task as 6.1; together one Captain action unlocks both.
- **Allowed action now:** None beyond BUILD_PLAN scan. Same serialization as 6.1.
- **Captain-side action:** Same as 6.1.

### 3.3 Track 6.4 — Klaviyo integration

- **Matrix score:** 31.7 (rank 7).
- **Readiness:** RED (blocked on M09).
- **Why middle-track (not near):** Lower matrix score. Adds a new external entropy reservoir (customer messaging state). Per the scoring sensitivity analysis, this track is closer to "deferred" than "near"; placing it in middle-track is a deliberate hedge in case M09 clears unexpectedly.
- **Allowed action now:** None beyond BUILD_PLAN scan.
- **Captain-side action:** M09 may be deferred — not the most leveraged Captain ask.

---

## 4. Far-track (3–6+ months)

These are the candidates dependent on architectural prerequisites that haven't been started. They are not queued for active scoping; they are on a watch-list.

### 4.1 Track 6.6 — Vendor Rep Portal

- **Matrix score:** 32.5 (rank 6).
- **Readiness:** BLACK (sequencing — needs loader boundaries / Phase 1).
- **Why far-track:** External-facing portal. Building before loader boundaries are real produces high BE, frozen-file tax, and fake-runtime risk. Becomes evaluable once Phase 1 lands.
- **Allowed action now:** None. Re-evaluate after Phase 1.

### 4.2 Track 6.5 — Trade & Designer Portal

- **Matrix score:** 30.7 (rank 8).
- **Readiness:** BLACK (sequencing — same family as 6.6).
- **Why far-track:** Same architecture dependency as 6.6.
- **Allowed action now:** None. Re-evaluate after Phase 1.

### 4.3 Track 6.10 — AccentOS embed on accentlightinginc.com

- **Matrix score:** 30.6 (rank 9).
- **Readiness:** BLACK (sequencing — depends on loader boundaries + Phase 2 substrate).
- **Why far-track:** Public-facing surface that requires the embed contract. Building before substrate is real produces customer-visible failure modes that are hard to roll back.
- **Allowed action now:** None. Re-evaluate after Phase 1 + Phase 2.

---

## 5. Deferred

Currently no track sits in deferred. The categorization is reserved for tracks where the readiness picture is ambiguous or where Captain capacity argues against engagement. Tracks may move into deferred at the next refresh based on M-task age, Captain bandwidth, or shifting business priorities.

Tracks at risk of moving into deferred next refresh:

- **6.4 Klaviyo** — may move from middle-track to deferred if M09 ages past 90 days without resolution.
- **6.1 / 6.2 GA4 + GSC** — may move from middle-track to deferred if M06 ages past 90 days.

If a track moves into deferred, its preparation cycle stops; periodic re-evaluation only.

---

## 6. Forbidden

Tracks that must not be attempted under current conditions.

### 6.1 Track 6.12 — Google Ads / Meta Ads

- **Matrix score:** 22.0 (rank 10, lowest).
- **Readiness:** BLACK (structural — no API access per MASTER §10).
- **Why forbidden:** No API path exists. The track is unbuildable, not blocked. There is no M-task that clears it; only an external Google Ads decision (account-holder grants API auth) would change the picture, and that path is currently not on Captain's roadmap.
- **Action:** Remove from active queue. Move to a watch-list with a 6-month re-evaluation cadence.

### 6.2 Class — any track that would require concurrent writers on `index.html`

Not a specific track, but a forbidden *class*. Per `SCALING_SEQUENCE_ANALYSIS.md` §2.2: bringing Codex or any other model in as a concurrent writer on the monolith doubles BE and is irreversible-by-narrative. This stays forbidden until Phase 1 lands.

### 6.3 Class — any track that would require N>3 overnight concurrency

Per `PARALLELISM_SAFETY_THRESHOLDS.md` §6 and `SCALING_SEQUENCE_ANALYSIS.md` §3.3. Stays forbidden until Phase 1 + Phase 2 + Phase 3 land.

### 6.4 Class — any track that would generalize Agentic Level 4 beyond Alerts

Per `SCALING_SEQUENCE_ANALYSIS.md` §7.7. Cross-system autonomous actions beyond the narrow Alerts case stay forbidden until queue durability (Phase 2) and supervision instrumentation (Phase 3) are real.

---

## 7. Architectural lane (separate, non-track)

Not a "track" in the BUILD_PLAN sense, but the highest-leverage work available right now per `ARCHITECTURAL_PRIORITIZATION_MODEL.md` and `SCALING_SEQUENCE_ANALYSIS.md`. Listed here for completeness so the operator does not miss it when reading the queue.

### 7.1 Phase 1 — Decomposition + module isolation + loader boundaries

- **Readiness:** Conceptually GREEN (no external blocker). Practically requires Captain commitment to a multi-week architectural focus rather than feature shipping.
- **Why first:** Highest score on every axis in the architectural prioritization. Unblocks 3 currently-BLACK tracks (6.5, 6.6, 6.10). Eliminates the largest entropy source. Races the 900KB hard limit.
- **Allowed action now:** Write a Phase 1 plan: split shape (loader + N module entries), migration path (which modules move first), enforcement contract (what "isolated" means in code), verification (how to know a module is fully isolated). ~1–2 hours of Captain + Claude time. Plan only — not implementation.
- **Stop condition:** If the plan reveals the split is significantly larger than estimated, scope down to a "Phase 1a — extract one module fully" pilot and treat the remainder as Phase 1b.

The architectural lane consistently outranks every track-section item. If the operator has a choice between Phase 1 prep and any of §2/§3 above, Phase 1 wins.

---

## 8. The combined queue at a glance

| Position | Item | Score | Readiness | Bucket |
|---|---|---|---|---|
| 0 | **Phase 1 architecture** | (top of architecture lane) | GREEN concept, awaiting commitment | Architectural lane |
| 1 | 6.11 Windward ERP Live | 49.6 | RED (M03 + M10) | Near-track |
| 2 | 5.13 E-Commerce Command Center | 45.6 | RED (M04 + M05) | Near-track |
| 3 | 6.3 BigCommerce REST | 41.5 | RED (M04) | Near-track |
| 4 | 6.1 GA4 | 38.5 | RED (M06) | Middle-track |
| 5 | 6.2 GSC | 37.5 | RED (M06) | Middle-track |
| 6 | 6.6 Vendor Rep Portal | 32.5 | BLACK (sequencing) | Far-track |
| 7 | 6.4 Klaviyo | 31.7 | RED (M09) | Middle-track |
| 8 | 6.5 Trade Portal | 30.7 | BLACK (sequencing) | Far-track |
| 9 | 6.10 AccentOS embed | 30.6 | BLACK (sequencing) | Far-track |
| — | 6.12 Google Ads / Meta Ads | 22.0 | BLACK (structural) | Forbidden |

---

## 9. Operator-side reading

What this queue tells Captain to focus on:

### 9.1 If Captain has M-task delivery time

The single highest-leverage M-task pair right now is **M04 + M05** (clears 5.13 *and* unblocks 6.3 — two top-3 tracks for one credential delivery cycle). Second-best is **M03 + M10** (clears 6.11, the top-scored item). M06 (clears 6.1 + 6.2) is third. Other M-tasks are deferable.

### 9.2 If Captain has architectural decision time

Phase 1 commitment is the dominant move. Even one focused planning session on the decomposition + isolation + loader-boundaries cluster moves the system more than any feature track in the queue.

### 9.3 If Captain wants a quick win

There is no GREEN track today. The honest answer is: there is no quick win in the track lane. The architectural lane is the only available work, and it's not "quick." If the operator is truly time-constrained today, the highest-leverage move is **branch hygiene** (close any `claude/*` branch >72h old, including `claude/execution-economics-analysis-vf0FX` itself when this analysis is merged).

### 9.4 If Captain wants to delegate

Of the items in the queue, **none are delegable today** in the sense of "go build this." The only delegable work is *preparation* — preparation notes for the top 3 near-track items, capped at ~30 min per item. After preparation, all items remain RED or BLACK pending Captain action.

---

## 10. Refresh cadence

This is v1 of the queue. The intended refresh cadence:

- **At every M-task delivery:** re-evaluate any track gated by that M-task. If a track moves to GREEN/YELLOW, update its bucket.
- **At every Phase 1 milestone:** re-evaluate the three BLACK-by-sequencing tracks (6.5, 6.6, 6.10). If Phase 1 lands fully, they move to RED or YELLOW depending on M-task status.
- **At every quarter:** full re-score using the matrix. Weights and scores both may shift as the business or architecture changes.
- **At every BUILD_PLAN edit:** re-snapshot the candidate inventory. New BUILD_PLAN items enter the matrix at v(N+1).

Historical versions of the queue should be retained (v1, v2, ...) so the trajectory of priorities is auditable.

---

## 11. The single most important question this queue raises

**Why is no track currently GREEN?**

The honest answer: because the system is correctly refusing to mark anything as buildable while:

- Five tracks lack Captain credentials.
- Three tracks lack architectural prerequisites.
- One is structurally unbuildable.
- The architecture itself has not entered Phase 1.

This is not a queue failure. It is the queue working — refusing to surface false-readiness. The right operator response is one of:

1. **Captain delivers M-tasks** to clear RED. Top picks: M04+M05, then M03+M10.
2. **Operator commits to Phase 1** to clear BLACK-by-sequencing.
3. **Operator does branch hygiene** (Phase 0 work) to reduce ambient entropy while neither of the above happens.

Continuing to spawn analysis docs in this lane (the lane that produced docs 9–11 right now) without taking one of those three actions is anti-leverage per `SCALING_SEQUENCE_ANALYSIS.md` §6.5. The analysis lane has reached its diminishing-return knee, and no twelfth analysis doc will change the readiness picture.

---

## 12. Before clean pause

### #1 next track section to *prepare*

**6.11 Windward ERP Live Integration.** Highest matrix score, blocks the largest existing Captain-relay, sharpens 6.9 immediately. Preparation = the bounded note from §2.1 only. Not buildable until M03 + M10 clear.

(If the question is "what to *build* next?" — there is no buildable track. The honest #1 next move is either Phase 1 architecture work or M-task delivery.)

### Highest-risk tempting section to avoid

**Any of 6.5 / 6.6 / 6.10** — the external-facing portals and the public-site embed. They are *attractive* because they expand AccentOS visibility and create new value surfaces. They are *dangerous* because attempting them before Phase 1 (loader boundaries) lands would compound BE on the monolith, lock in a portal contract against the wrong architecture, and create customer-visible failure modes that propagate through the most expensive entropy channels (out-of-band drift, public site → repo asymmetry).

The temptation is highest precisely because these are the tracks that look *most* like "the system maturing." That impression is correct in eventual scope and incorrect in current timing. Premature attempt destroys the eventual scope's payoff.

### What should be ready by the time Session 10 reaches the end of its corridor

By Session 10 (interpreted as: ~10 sessions from now of normal operation along this corridor), the readiness picture should look like one of:

**Best case:**
- Phase 1 plan exists and at least Phase 1a (one module fully extracted as proof) has shipped.
- M03 + M10 *or* M04 + M05 has cleared, advancing one near-track item from RED to YELLOW or GREEN.
- All `claude/*` branches >72h old have been merged or closed.
- This analysis lane has stopped (no docs 12–14); attention has shifted to Phase 0/1 work.

**Acceptable case:**
- Phase 1 plan exists but no implementation yet.
- One M-task pair has cleared.
- Branch hygiene caught up.

**Failure case:**
- No M-task progress, no Phase 1 progress, more analysis docs added, branches still aging.
- Ten sessions of pure ambient activity with no foundation movement.
- Long-term survivability estimate per `SCALING_SEQUENCE_ANALYSIS.md` §11 ticks down accordingly.

The honest expectation: the failure case is not just possible, it is the path of least resistance under current conditions. Preventing it requires a deliberate Captain-side commitment to either an M-task delivery or a Phase 1 planning window in the very next operator availability slot.

---

## 13. DONE / KNOWN / NEXT

**DONE**
- Bounded ten candidate tracks into five buckets (near / middle / far / deferred / forbidden).
- Mapped each candidate to its matrix score, readiness state, and bucket, with the specific allowed action for the current moment.
- Surfaced the architectural lane (Phase 1) as outranking every track-section item.
- Named the single highest-leverage Captain M-task (M04 + M05; runner-up M03 + M10).
- Identified that **no track is currently GREEN**, and explained why this is the queue working correctly, not failing.
- **#1 next track to prepare:** 6.11 Windward ERP Live (preparation only — not buildable until M03 + M10 clear).
- **Highest-risk tempting section to avoid:** any of 6.5 / 6.6 / 6.10 — external-facing portals + public embed before Phase 1 lands.
- **What should be ready by Session 10:** at minimum a Phase 1 plan and one cleared M-task pair; ideally Phase 1a shipped + branch hygiene caught up.

**KNOWN**
- This is v1 of the queue, snapshotted on 2026-05-10. Refresh cadence in §10.
- Five tracks are RED on Captain credentials; three are BLACK on sequencing; one is structurally BLACK; one is the architectural lane outranking all tracks. Zero tracks are GREEN.
- The queue refuses to surface false-readiness. If Captain pressure produces "let's just start something," the queue's answer is: no track is something to start today.
- The analysis lane (this corpus of `docs/runtime/` files, now eleven docs) has reached its diminishing-return knee. Doc #12 in this lane would be anti-leverage.

**NEXT**
- Operator-side: pursue M-task delivery (top picks M04+M05 or M03+M10) *or* commit a planning window to Phase 1 architecture *or* do branch hygiene. Any of the three moves the system; further analysis does not.
- Queue-side: refresh on next M-task delivery or next architectural milestone, whichever comes first. Bump version to v2.
- Process-side: this queue should be re-read at session-start by any session asking "what's next?" — the answer is encoded here, not re-derivable from BUILD_PLAN alone.
