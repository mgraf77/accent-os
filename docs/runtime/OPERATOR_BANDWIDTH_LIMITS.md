# OPERATOR BANDWIDTH LIMITS

> **Companion to:** `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `TOKEN_TO_OUTPUT_EFFICIENCY.md`, `ORCHESTRATION_COST_CENTERS.md`, `ENTROPY_ACCUMULATION_MODEL.md`.
> **Scope:** Models the human side of the AccentOS orchestration loop — Captain (Michael) as the bottleneck resource, his real review and decision throughput, mobile-only constraints, and the points where the orchestration system collapses *psychologically* before it collapses technically.
> **Frame:** Analysis-only. Documentation-only. No implementation, no governance edits, no runtime mutation, no autonomous scaling.
> **Last updated:** 2026-05-10

---

## 0. Frame

Every model in the prior docs assumes Claude can scale (more sessions, more parallelism, more autonomy). What does *not* scale is the operator. The orchestration system has exactly one Captain; the Captain's bandwidth is the single largest hard limit on the entire system.

This document treats the Captain as a fixed-capacity component and models how the rest of the system must shape itself to that capacity.

The frame is deliberately neutral: it is not a critique of the operator, it is a description of physics. Any human in this role has the same limits.

---

## 1. Captain as orchestration bottleneck

### 1.1 The role

Per MASTER §2 ("Operating Model"):

- **Captain (Michael).** Direction, approvals, content, internal coordination. Does not write code. Uses Claude on iPhone, work Windows desktop, and home Windows laptop.
- **Claude.** Primary builder and executor. All code, all analysis, all external communications drafted.
- **ChatGPT Pro.** Secondary, deep research / parallel workstreams.

The role assigns to Captain *only* the work that cannot be safely delegated:

- Strategic decisions (vendor relationships, money, agency moves).
- Final approval of irreversible operations.
- Ground-truth corrections (when the doc layer drifts from reality).
- Cross-branch reconciliation arbitration.
- External communication tone / final-form review.

Everything else routes to Claude. This is the right division — but it concentrates *all bottleneck work in one person*, which is what makes Captain the rate-limiter.

### 1.2 Why Captain is a 1-wide queue

There is no second Captain. Claude can spawn N parallel sessions; the Captain remains 1. Per `ORCHESTRATION_COST_CENTERS.md` §5, the supervision tax curve is concave-up — Captain saturates fast.

There is no degree of process design that turns Captain into N parallel reviewers. Adding tooling can *reduce per-review cost* (better diffs, summarized changes, smarter routing), but it cannot raise the parallelism. **The 1-wide queue is structural.**

### 1.3 The asymmetry

Captain's time costs more than Claude's tokens by 1–3 orders of magnitude in every meaningful sense:

- A 30-minute Captain reconciliation costs more than thousands of tokens of Claude work.
- Captain attention is non-storable; tokens are.
- Captain attention has a daily ceiling (~6–10 high-quality decision-hours); Claude tokens have no daily ceiling.
- Captain attention is interruptible by any other Accent Lighting business need (showroom, vendor calls, family). Claude is not.

**Implication.** Whenever a workflow choice trades Captain time for Claude time, take the trade. Whenever it trades Captain time for *more* Captain time elsewhere, refuse it.

---

## 2. Review bandwidth

### 2.1 Definition

Review bandwidth = (Captain-minutes available per day) ÷ (Captain-minutes required per ship).

### 2.2 Captain-minutes available

Realistic estimate for a working day:

- Total daily attention slot for AccentOS-related work: ~3–5 hours, *non-contiguous*.
- Of that, "high-attention review-quality" time: ~1.5–2.5 hours. The rest is operational (vendor calls, showroom, ops).
- On iPhone: high-attention time is structurally lower-quality (small screen, no diff tooling, frequent context switches). Estimate ~30–50% effective.

### 2.3 Captain-minutes required per ship

By type of change:

| Change type | Cap-minutes / review | Notes |
|---|---|---|
| Single-module `js/<feature>.js` ship | 3–6 | Easy to skim |
| `js/*.js` + small `index.html` wire-up | 5–10 | Standard pattern |
| `index.html` significant edit | 10–25 | Anchor / line-context risk |
| Schema migration | 15–40 | Reversibility check, RLS check |
| Cross-branch reconciliation | 30–120 | Semantic conflict territory |
| External communication draft (Eugene, vendors, agencies) | 5–15 | Tone matters; one-shot risk |

### 2.4 Daily ship ceiling

Roughly: Captain can review **6–12 single-module ships per day** (best case, desktop, focused). On iPhone-only: ~3–6, with material risk of rubber-stamp on the upper half.

Cross-branch reconciliations cap the day fast — one significant reconciliation can consume an hour, displacing 6+ ship reviews.

### 2.5 What this implies for N

Per `PARALLELISM_SAFETY_THRESHOLDS.md`:

- N=2 produces ~2–4 ships/hour of supervised work — comfortably within Captain's daily ceiling.
- N=3 at peak throughput produces ~5–7 ships/hour — at the edge of sustainable Captain bandwidth.
- N=4+ generates ships faster than Captain can review them at quality. Surplus ships either queue or merge unread.

**The N≤3 ceiling from earlier docs is not arbitrary; it is calibrated against Captain's review bandwidth.**

---

## 3. Mobile-only orchestration limits

Captain spends real working time on iPhone (per MASTER §2 — "Uses Claude on iPhone, work Windows desktop, and home Windows laptop"). This is operationally important and operationally limiting.

### 3.1 What works on iPhone

- **Reading short MASTER / WIP / BUILD_PLAN excerpts.**
- **Approving simple status updates.**
- **Drafting / approving short external messages.**
- **Asking high-level direction questions.**
- **Reading small diffs (≤ ~50 lines).**
- **Confirming a single ship.**

### 3.2 What does *not* work on iPhone

- **Reviewing `index.html` diffs.** Width, line wrapping, line numbers — all degrade.
- **Resolving cross-branch semantic conflicts.** Requires multi-file scrolling.
- **Reading SQL migration with RLS implications.** Subtle correctness; requires desktop attention.
- **Comparing two patches against the same anchor.** Requires side-by-side.
- **Reading 200+ line diffs.** Skim mode kicks in; review quality collapses.
- **Reviewing a deploy that touched >2 files.** Cross-file reasoning doesn't fit on a phone.
- **Tracing a runtime bug across modules.** Hard on a 6" screen.

### 3.3 The iPhone trap

iPhone-only orchestration *feels* like full orchestration. Captain can read MASTER, write decisions, see commit messages, approve text. The trap is that the *failure mode* of iPhone review is rubber-stamp, not refusal. If a diff is too large to read carefully, the answer is rarely "stop and read it later" — it is usually "ok, ship it." Approval-without-comprehension is the dominant iPhone-review error mode.

This is the dangerous version of fake productivity at the human layer: it looks like supervision, it is not supervision.

### 3.4 Operational rule of thumb

- iPhone-only Captain ↔ **N=1 only** for any work touching shared files, or N=2 for strictly module-isolated work.
- iPhone-only Captain ↔ **no schema migrations**.
- iPhone-only Captain ↔ **no cross-branch reconciliation**.
- iPhone-only Captain ↔ **no `index.html` direct edits** (wire-ups via `js/<module>.js` only).

These are not enforced — they are observations of where the iPhone failure modes appear.

---

## 4. Supervision throughput

### 4.1 Three modes of supervision

Per `ORCHESTRATION_COST_CENTERS.md` §5:

- **Ambient acknowledge** (~1 min / event). Cheapest. "Yes, ship that."
- **Active review** (~5–15 min / event). Read the diff before approval.
- **Semantic reconciliation** (~30–120 min / event). Cross-branch / cross-module reasoning.

### 4.2 The mix matters

A day with 8 ambient + 4 active + 0 reconciliations = ~1.5 Captain-hours. Comfortable.

A day with 8 ambient + 4 active + 1 reconciliation = ~2.5–3.5 Captain-hours. Near ceiling.

A day with 8 ambient + 4 active + 2 reconciliations = ~4–5 Captain-hours. Past ceiling; quality erodes.

**Reconciliations are the single largest consumer of supervision throughput.** Avoiding them — by avoiding the conditions that produce them — is the highest-leverage way to increase effective Captain throughput.

### 4.3 What raises supervision throughput

Per `ORCHESTRATION_COST_CENTERS.md` §11 cross-cost interactions:

- **Lower BE.** Fewer reconciliations needed.
- **Smaller, more focused diffs.** Faster active review.
- **Module isolation.** Ambient-acknowledge sufficient, active review unnecessary.
- **Pre-claimed BUILD_PLAN items.** Eliminates duplicate-ship reconciliations.
- **Idempotent migrations.** Reduces SQL review depth needed.

### 4.4 What lowers supervision throughput

- **iPhone-only review on non-trivial diffs** (rubber-stamp risk, §3.3).
- **Backlog of unreviewed branches** (Captain dreads opening it; review gets deferred; queue grows).
- **Late-day review** (decision fatigue, §6).
- **Frequent context-switching across modules** (re-orientation cost per switch).

---

## 5. Relay saturation

Relay = the act of Captain transferring context to Claude or between Claude sessions, or absorbing context from a finished session.

### 5.1 Relay channels

- Captain → Claude: prompts, decisions, blocker resolutions.
- Claude → Captain: status reports, ship summaries, questions.
- Claude → Claude (next session): WIP, BUILD_PLAN, BUILD_INTELLIGENCE, MASTER. Captain is a passive participant here — but the *fidelity* of these hand-offs depends on Captain having required clean stabilization at the end of the previous session.

### 5.2 Saturation point

Captain can sustain ~5–8 substantive relays per day. "Substantive" = required Captain to read, decide, or correct. Beyond that, relay quality degrades — the same way review quality degrades. Captain starts reading the *summary* instead of the *content*; small errors slip through.

### 5.3 Symptoms of relay saturation

- Captain replies "ok, proceed" to multi-option decisions without selecting an option.
- Captain confirms a plan that has visible inconsistency the Captain didn't catch.
- Captain stops reading WIP entries.
- Captain re-asks Claude for a status that was given in the previous reply.

### 5.4 Why relay saturation is the leading indicator of system collapse

When relay saturates, the orchestration system loses its highest-quality channel — the one where Captain corrects ground truth. The system continues to operate but starts accumulating uncorrected entropy at the rate the relay channel was previously absorbing. This is usually the first sign visible to Captain *that something is wrong*, before any other failure mode.

---

## 6. Decision fatigue

### 6.1 The fatigue curve

A working day has a non-flat decision-quality curve. Empirically (general human-factors research, calibrated by AccentOS observation):

- Morning (first 2 hours of focused work): high-quality, slow. Best for strategic decisions.
- Mid-day (next 3–4 hours): high-quality, fast. Best for batched ambient + active review.
- Late afternoon: moderate, fast. Risk of rubber-stamp on harder calls.
- Evening: variable. High-emotion or high-creativity decisions OK; quantitative reasoning weak.
- Late night: lowest quality. Multiple BUILD_INTELLIGENCE entries trace to bugs shipped by tired humans approving tired-Claude work.

### 6.2 Operational implications

- **Strategic / vendor / agency / money decisions** belong in the morning slot.
- **Batched ship reviews** belong in the mid-day slot.
- **Reconciliations** require fresh attention; should not be left for end-of-day.
- **Schema migrations** should never be reviewed late at night.
- **Overnight runs** should not commit to anything Captain hasn't already pre-approved at morning quality (per `PARALLELISM_SAFETY_THRESHOLDS.md` §6).

### 6.3 Fatigue as an entropy source

Tired-Captain approvals are an entropy source per `ENTROPY_ACCUMULATION_MODEL.md` — they pass divergent state through review without correction. The lessons they ship into BUILD_INTELLIGENCE are usually corrective: "we shipped X tired and it was wrong."

---

## 7. Reconciliation fatigue

A specific subclass of decision fatigue, deserving its own treatment because reconciliations are the most expensive review type.

### 7.1 What it looks like

- Captain opens a multi-branch reconciliation, reads the first conflict, and says "merge in arrival order, fix any issues after." This is the giving-up signature.
- Captain defers the reconciliation: "I'll deal with it tomorrow." The branch ages, BE rises, the reconciliation is harder tomorrow than it would have been today.
- Captain merges all branches without reading individual diffs because the merge would otherwise take an hour.

### 7.2 Why reconciliation fatigue compounds

Each deferred reconciliation increases the cost of the next one. Branch ages, BE rises, the trunk moves further from each branch's base. The fatigue compounds with the cost — Captain dreads it more, defers it more, and the cost grows.

### 7.3 Symptoms specific to reconciliation fatigue

- Captain says "let's just throw out one of the branches" — even if both have value.
- Captain says "let me redo this myself" — a category error (Captain doesn't write code per MASTER §2).
- Captain pushes the entire reconciliation onto Claude with vague instructions and rubber-stamps the result.

### 7.4 Operational implication

Reconciliation cost is the first thing to cap. Whenever the system would generate work whose downstream tax is reconciliation, the right answer is usually to *not generate that work in the first place* — i.e., don't run a fourth parallel session, don't open a third migration, don't let a branch age past 72h.

---

## 8. Context-switch overhead

### 8.1 The cost

Captain is a context-switching agent across many domains:
- AccentOS development.
- Vendor Ranking strategic decisions.
- Showroom operations.
- Vendor relationships.
- Ecommerce / GMC / agency relationships.
- Family / personal life.
- Cross-device (iPhone, work desktop, home laptop).

Each switch into and out of AccentOS-Claude context costs ~5–15 minutes of warm-up before high-quality decisions are possible. At ~6 switches per day, this is ~30–90 minutes of pure overhead.

### 8.2 Compounding with N

When multiple Claude sessions are running, Captain context-switches not just into "AccentOS-Claude" but across modules within it. Going from a Marketing Hub diff to a Vendor Ranking diff requires re-orienting on different invariants, different module shapes, different recent commits.

This intra-AccentOS context-switching is the cost that grows with N. At N=2 with two unrelated features, Captain is paying inter-module context-switch cost on every alternation. At N=4, it dominates supervision time.

### 8.3 Counter-pattern

Batching reviews by module reduces context-switch cost. Captain reviewing 3 Vendor Ranking ships in one window costs less than reviewing 1 Vendor Ranking + 1 Marketing + 1 Demand Forecast.

This favors workflows where parallel sessions all work in the same module — but those are exactly the workflows that maximize *technical* collision (frozen-file tax, BE), per `ORCHESTRATION_COST_CENTERS.md` §6.

**The tradeoff is unavoidable.** Either Captain pays high context-switch cost (parallel work across modules) or Claude pays high frozen-file tax (parallel work in one module). There is no setting that minimizes both simultaneously.

---

## 9. The true human scaling limit

Pulling all of the above together, the empirical Captain throughput ceiling is:

- **~6–12 ships per day** with comfortable review.
- **~3–6 ships per day** if iPhone-only.
- **~1–2 reconciliations per day** before reconciliation fatigue degrades quality.
- **~5–8 substantive relays per day** before relay saturation.
- **~1–3 strategic decisions per day** at morning quality.

These are independent ceilings. The day's bottleneck is whichever Claude generates faster than Captain can absorb.

**Practical translation:**

- Sustainable parallelism: **N=2 throughout the day, occasionally N=3 for short focused windows.**
- Sustainable nightly autonomous work: **N=2 default, max N=3 with strict guardrails.**
- Sustainable monthly velocity: **~6–10 ships per working day × ~22 working days ≈ ~150 ships/month.** (AccentOS has been hitting roughly this rate during peak v6.10.x weeks.)

**Beyond this rate, the *human* layer collapses before the *technical* layer does.** Captain saturates, decisions get rubber-stamped, relay quality drops, and the system enters orchestration debt regardless of what Claude is producing.

---

## 10. What should NEVER be delegated

Even with arbitrarily-capable Claude sessions, certain decisions cannot route off Captain without producing damage. Listed in rough order of irrecoverability if delegated wrongly:

1. **Vendor relationship decisions.** Tone, timing, escalation, agency-relationship signals. Errors here have multi-month consequences and external visibility. Per MASTER §2 "Communication Style."
2. **Spending money / authorizing purchases / committing to deals.** Per MASTER §2 Autopilot Rules — explicitly "only pause before: changes to canonical vendor workbook, spending money, strategy decisions affecting agency relationships."
3. **Strategic positioning decisions.** Where AccentOS sits in the stack vs. agencies vs. ERP. Multi-month impact if wrong.
4. **Final external communications to Eugene, Feedenomics, vendors, reps.** Tone and content. One-shot — cannot be retracted.
5. **Schema design decisions affecting durable data shape.** Reversible only via migration; cumulative cost grows fast.
6. **Decisions about what counts as a finished feature** for BUILD_PLAN check-off purposes. The definition of "done" is Captain's call.
7. **Risk acceptance.** "Are we OK shipping with this caveat" — Claude can flag, Claude cannot decide.
8. **People-affecting decisions.** Anything that touches employee permissions, customer-facing visibility, or rep-portal access.

Everything else *can* be delegated, but should be reviewed at the appropriate cadence per §2.

---

## 11. What can scale safely

Inverse list — the operations where Captain bandwidth is *not* the bottleneck:

1. **Internal-only feature builds confined to `js/<module>.js`.** Low review cost, low risk.
2. **Pure-compute layers over existing data** (Decision Engine, Demand Forecast, Deal Optimizer pattern). No new schema, no shared globals, no external impact.
3. **Idempotent doc updates** (BUILD_PLAN check-offs, SESSION_LOG appends, MASTER §15 entries). Low review cost.
4. **CSS / layout polish in module files.** Visual review only.
5. **BUILD_INTELLIGENCE entry capture.** Pure additive; Captain confirms only.
6. **Skill scoping inside `skills/` for new internal-use skills** — provided they're scoped to internal patterns, not external comms.
7. **Read-only analysis** (this document, the others in `docs/runtime/`). Zero runtime risk.
8. **Stat / KPI computation** over Supabase data. Read-only.

These are the workloads where adding a parallel session pays off, because Captain's marginal review cost per ship is low.

---

## 12. Where orchestration systems collapse psychologically

The system fails *psychologically* before it fails *technically* in most real cases. Five specific collapse signatures:

### 12.1 The "I dread opening the queue" collapse

Captain has unreviewed branches piling up. Every time Captain considers opening the queue, the cost looks higher than the benefit (especially if the previous queue session was long). The queue grows; entropy compounds; eventually a forced reconciliation happens at far higher cost than incremental review would have been.

**Mitigation that works psychologically:** smaller, more frequent windows. The queue must always look short enough to start.

### 12.2 The "this is taking too long" collapse

Captain or Claude over-engineers a feature; iterations stack; the feature's wall-clock time exceeds the tolerance. Captain gives up partway, leaving a half-shipped artifact that creates entropy without producing value.

**Mitigation:** time-boxing per feature; explicit "we're going to ship the smallest version first" framing.

### 12.3 The "I don't trust the WIP anymore" collapse

WIP has been wrong enough times that Captain stops reading it as ground truth. From this point, Captain re-checks reality manually for every decision — a 3–5× supervision tax increase. Once trust in the doc layer is gone, it is hard to rebuild.

**Mitigation:** be aggressive about WIP correctness. A small lie in WIP costs more than a large omission.

### 12.4 The "rubber stamp" collapse

Captain's review quality drops below the threshold where review adds value. Approvals continue but are no longer corrective. Bugs ship; entropy accumulates; trust in the build erodes; downstream Captain time has to be spent on emergency rollbacks.

**Mitigation:** stop reviewing rather than rubber-stamp. An unreviewed branch left unmerged costs less than a rubber-stamped merge.

### 12.5 The "I'll just do it myself" collapse

Captain reaches for direct work despite the role assignment. Often signals reconciliation fatigue (§7.3) or trust collapse in the WIP layer (§12.3). The orchestration system has effectively reverted to single-operator mode; Claude time is wasted; Captain hours are double-spent.

**Mitigation:** when this urge appears, the answer is to reduce N and stabilize, not to override the role assignment.

---

## 13. Structural truths about the human layer

A few hard facts that govern everything above:

### 13.1 Captain's bandwidth is the system's clock speed.

Claude's tokens scale; Captain's hours don't. Any architectural choice that converts Captain hours into Claude tokens is a win. Any choice that does the reverse is a loss.

### 13.2 The orchestration system is a *human* system with a Claude sub-system, not the reverse.

Claude is the worker; Captain is the system. Designs that assume Captain's role can be reduced or routed around fail in practice — Captain's role is irreducible because it owns the externalities (vendor relationships, money, strategy) that no other component is qualified to own.

### 13.3 Faster Claude does not produce more output past the Captain ceiling.

Above the Captain ceiling, faster Claude produces more *unreviewed work*, which is worse than less work. The ceiling is the system's actual throughput.

### 13.4 The right way to scale this system is to lower review cost per ship, not raise Captain bandwidth.

Module isolation, smaller diffs, idempotent migrations, BUILD_INTELLIGENCE capture — all these *reduce review cost per ship*, which raises throughput at constant Captain hours. Trying to raise Captain hours instead is a category error.

### 13.5 Mobile orchestration is real but limited.

iPhone is good for keeping the system warm and for low-cost ambient supervision. It is not good for review of non-trivial work. Pretending otherwise produces rubber-stamp collapse (§12.4).

### 13.6 The system fails before the operator does, if designed well.

A well-designed orchestration system flags saturation before Captain feels saturated. The failure-mode-of-choice should be Claude refusing to start a fourth parallel session, not Captain working past 11pm to clean up a queue.

---

## 14. Estimated current entropy accumulation rate

Restated and refined from `ENTROPY_ACCUMULATION_MODEL.md` §13, with the human layer accounted for:

- ~0.2 reservoir entries per session in the doc layer.
- ~1 deferred reconciliation per ~10 sessions (each compounds BE).
- ~1 stale BUILD_INTELLIGENCE entry per ~20 sessions (each compounds boot tax).
- ~1 long-lived `claude/*` branch per ~5 sessions (each compounds BE).
- Captain mental-model drift: ungaugeable, but probably ~1 substantive drift per week.

**Combined honest estimate:** the system is accumulating entropy at a rate equivalent to ~1 hour of Captain-time-debt per working week. Not catastrophic, but not zero, and **not currently being repaid**. Over a quarter, this is ~12 hours of accumulated orchestration debt that Captain will eventually pay in a single high-friction reconciliation cycle.

---

## 15. Single largest hidden orchestration tax (human-side)

**iPhone-only rubber-stamp review of non-trivial diffs.**

Why this ranks above all other hidden human-side taxes:

- It looks like supervision; it is not. Captain feels they reviewed; they didn't.
- It is paid silently — the cost surfaces only when a buggy ship breaks in production.
- It is the most likely failure mode of *normal operation* (mid-day, busy, on phone, between vendor calls). It is not an edge case.
- It is the single mechanism by which entropy crosses *into* the trunk. Before iPhone rubber-stamp, drifted state is in a branch (containable); after, it's in `main` (propagating to every future session).
- It is the most subjectively invisible tax — by definition, an over-stretched Captain isn't aware of which approvals were rubber-stamps.

The technical-side largest hidden tax (boot-cost duplication, per `ENTROPY_ACCUMULATION_MODEL.md` §14) is large in tokens. iPhone rubber-stamp is large in *consequence* — it lets entropy past the only filter that catches semantic conflicts.

These are two different "single largest" taxes for two different layers. Both are real.

---

## 16. Biggest fake-productivity pattern currently present (human-side)

**Captain "staying engaged" via iPhone throughout the day, in lieu of focused desktop windows.**

Why it qualifies:

- It feels productive — Captain is responsive, things move, commits land.
- It maximizes ambient acknowledge throughput (cheap supervision) but minimizes active review and reconciliation throughput (expensive, value-add supervision).
- It encourages Claude to ship more, because acknowledgments come back fast — but the ratio of *reviewed* ships to *acknowledged* ships drops.
- It produces high commit-velocity with degraded quality, which is the worst combination — fast accumulation of un-corrected entropy.
- It substitutes engagement for review, which feels like the same thing and isn't.

The technical-side biggest fake-productivity pattern (many active branches, per `ENTROPY_ACCUMULATION_MODEL.md` §15) compounds on top of this — iPhone rubber-stamp Captain plus growing branch count is the acute failure mode.

The right operational alternative is **fewer, longer, desktop-based review windows** — which produces lower commit-velocity but higher *review-corrected* commit-velocity. That is the real throughput.

---

## 17. DONE / KNOWN / NEXT

**DONE**
- Modeled Captain as the structural 1-wide queue and the system's clock speed.
- Quantified review bandwidth (~6–12 ships/day desktop, ~3–6 iPhone), supervision throughput (3 modes), relay saturation (~5–8 substantive relays/day), decision/reconciliation fatigue curves, and context-switch overhead.
- Defined mobile-only limits explicitly: what works, what doesn't, the iPhone trap of rubber-stamp review.
- **The true human scaling limit:** ~6–12 ships/day desktop, ~3–6 iPhone, with N=2 sustainable / N=3 with guardrails.
- Listed eight items that should NEVER be delegated and eight workloads that scale safely.
- Catalogued five psychological collapse signatures.
- **Honest entropy accumulation rate (human-aware):** ~1 hour of Captain-time-debt per working week.
- **Single largest hidden orchestration tax (human-side):** iPhone-only rubber-stamp review of non-trivial diffs.
- **Biggest fake-productivity pattern currently present (human-side):** Captain staying engaged via iPhone throughout the day in lieu of focused desktop windows.

**KNOWN**
- All bandwidth numbers are calibrated against typical knowledge-work patterns, not measured for this specific operator. They are honest order-of-magnitude estimates, not precision values.
- The model assumes Captain can choose iPhone vs. desktop; in practice, much AccentOS work happens during the workday when iPhone is the only available surface.
- The "N=2 sustainable" finding aligns with both the technical analysis (`PARALLELISM_SAFETY_THRESHOLDS.md`) and the human analysis (this doc) — meaning both layers cap at the same point. This is a coincidence worth noting; it argues against pushing N higher even if a single layer's analysis suggested it could.
- Several mitigation patterns (smaller queue windows, stricter doc fidelity, time-boxed reviews) would help but are not implementable from this analysis-only pass.

**NEXT**
- The full set of `docs/runtime/` analysis docs is now: `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `TOKEN_TO_OUTPUT_EFFICIENCY.md`, `ORCHESTRATION_COST_CENTERS.md`, `ENTROPY_ACCUMULATION_MODEL.md`, `OPERATOR_BANDWIDTH_LIMITS.md`. They should be read together; each isolates a layer of the same system.
- Future companion: a measurement plan for `efficiency-monitor` to emit boot-cost, review-cost, and reconciliation-cost counters so this analysis can be re-grounded against real numbers.
- The single highest-leverage operator-side change implied: **default to fewer, longer, desktop-based review windows; route iPhone time to ambient acknowledge only.**
