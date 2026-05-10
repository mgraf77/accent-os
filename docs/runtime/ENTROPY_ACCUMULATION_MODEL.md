# ENTROPY ACCUMULATION MODEL

> **Companion to:** `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `TOKEN_TO_OUTPUT_EFFICIENCY.md`, `ORCHESTRATION_COST_CENTERS.md`.
> **Scope:** Models how entropy enters the AccentOS orchestration system, how it propagates and amplifies, where it accumulates, and which forms of entropy are invisible to per-session observation.
> **Frame:** Analysis-only. No implementation. No governance edits. No runtime mutation.
> **Last updated:** 2026-05-10

---

## 0. Working definition of entropy

In this document, entropy is the divergence between *what the system thinks is true* and *what is actually true at the trunk of `main`*. It is not raw "code mess" — code can be messy and entropy-free if every session has the same accurate picture of it. Entropy is the *gap between models held by sessions, docs, and reality*.

Every gap has a cost (re-investigation, rollback, re-implementation). Entropy in this sense is the leading indicator of every cost in `ORCHESTRATION_COST_CENTERS.md`.

---

## 1. Entropy sources

The set of mechanisms that introduce divergence between models and reality.

### 1.1 Concurrent writes to a shared file
Two sessions independently mutate `index.html`. The first to commit wins; the second's plan is now built against a stale model of the file.

### 1.2 Top-level global mutations
Adding, removing, or renaming a top-level identifier (`USERS`, `VENDORS`, `goTo`, `MODULES`). Every session caching a mental model of "which globals exist" is now wrong.

### 1.3 Schema changes without down-migrations
A migration applied without a paired down-migration creates an asymmetric reality: the live DB has moved, but the codebase has no description of how to undo. Future sessions reading only the codebase have an incomplete model.

### 1.4 Doc-drift writes
A session marks `[x]` in BUILD_PLAN for an item that didn't actually ship, or fails to mark `[x]` for one that did. Either case introduces lasting model gap.

### 1.5 WIP overwrites without prior reads
A session that writes WIP without first reading the previous WIP destroys the previous session's hand-off note. The next session inherits a corrupt model.

### 1.6 "Looks live but isn't" deploys
A push to `main` that didn't trigger or didn't successfully deploy (Cloudflare cache, Worker not redeployed, etc.). The repo says the code is live; it isn't. The Worker proxy `2dca2a6` situation in WIP is a live example.

### 1.7 Skill-routing decisions made without registry reads
A session that brute-forces a task with an existing skill leaves the skill's `observation-log` un-updated. The skill's effective trigger set drifts from the actual usage.

### 1.8 Mode-switch residue
Vibe-speak mode changes ("caveman mode" → "exec mode" → "vibe") leave residual voice patterns in commit messages or in feedback-log if not flushed cleanly.

### 1.9 Inflight rollbacks
A session that starts work, then partially undoes it, then commits the result. The diff doesn't reflect the exploration; the *intent* of the change is now divergent from the diff.

### 1.10 External state changes
Supabase row mutations, Cloudflare Worker redeploys, Cloudflare Pages cache flushes, BigCommerce / GMC console changes. Anything that happens *outside* the repo is invisible to it by default.

---

## 2. Entropy propagation

How entropy moves once introduced.

### 2.1 Through commits
A commit that ships divergent state propagates entropy to every session that reads the repo afterward. Commits are the highest-bandwidth propagation channel — they reach every future session.

### 2.2 Through WIP
WIP propagates entropy to the *next* session, narrowly. If WIP says "we shipped X" and we didn't, exactly one downstream session is misled — until it commits and re-propagates the corrected state through channel 2.1.

### 2.3 Through MASTER and BUILD_PLAN
Slow, system-wide propagation. These docs are read at every session start, so entropy here reaches every future session, but the data is already stale by design (only updated at session-end).

### 2.4 Through BUILD_INTELLIGENCE
A *bad* lesson written into BUILD_INTELLIGENCE propagates indefinitely — every future session reads it. A *missing* lesson is also propagation: the absence of the lesson allows the same gotcha to recur.

### 2.5 Through the skill registry
A skill with stale trigger phrases routes incorrectly. Every session that hits the bad route inherits the entropy.

### 2.6 Through SESSION_LOG
Lower bandwidth than MASTER (sessions don't always read it), but very long-lived. Entropy here outlives most other forms.

### 2.7 Through mental models off-repo
Captain's recollection of "where things are." Doesn't propagate to Claude sessions — but propagates Captain's decisions, which propagate back into the repo. The slowest channel and the hardest to correct.

---

## 3. Entropy amplification

How a small entropy seed becomes a large entropy bill.

### 3.1 The branch-on-stale-state amplifier
Session A makes a small wrong change. Session B reads A's commit, builds on top of it, ships. Now the wrong change is:
- duplicated in A's diff
- referenced by B's diff
- baked into both branches' line-context for any later patches.

Original cost: 5k tokens. After two layers of building on top: 30–60k tokens to disentangle.

### 3.2 The doc-drift amplifier
A drifted BUILD_PLAN marker leads a future session to either redo work (if `[ ]` says incomplete but it shipped) or skip work (if `[x]` says complete but it didn't). Either case creates a *new* entropy event, which can drift further in turn.

### 3.3 The shared-global amplifier
A renamed global means every reference site is now wrong. With 651KB of `index.html` and many `js/*.js` modules, finding all references requires `grep` — and grep's miss rate at scale is non-zero. Each missed reference is a future runtime error, which propagates further entropy.

### 3.4 The semantic-conflict amplifier
Two branches each look correct individually. Together they violate an invariant. The amplification: the *system* now has a problem that neither branch has any record of, so investigation has to start from nothing.

### 3.5 The migration-without-down amplifier
A bad migration on remote requires a *new* migration to fix, which is itself a candidate to be wrong. Entropy can layer up the migration stack faster than it gets resolved.

### 3.6 The WIP-clobber amplifier
A session overwriting WIP destroys the previous WIP's hand-off. The next session works from a wrong starting point and writes a *new* WIP based on that wrong starting point. Two amplifications stacked.

### 3.7 The Captain-misinformed amplifier
Captain making a strategic decision based on a drifted MASTER section. The decision propagates downstream into multiple future sessions, each acting on the bad assumption. One drift seed → many drifted commits.

---

## 4. Entropy containment

Mechanisms that *limit* propagation. AccentOS has some, but most are weaker than the propagation paths above.

### 4.1 BUILD_INTELLIGENCE
Good lessons written here actively *reduce* entropy because future sessions avoid the gotcha. **Net negentropy**, when used.

### 4.2 Surgical `str_replace`
Patches are small and reviewable. Compared to wholesale rewrites, the entropy surface per patch is far smaller.

### 4.3 Module-isolated `js/*.js` files
A change confined to one module has limited propagation surface. Best containment we have today.

### 4.4 Idempotent migrations
`DROP POLICY IF EXISTS` and similar patterns allow re-runs without entropy accumulation in the schema state.

### 4.5 Captain review
The strongest filter, but bandwidth-limited per `OPERATOR_BANDWIDTH_LIMITS.md`. Unreviewed merges bypass this filter entirely.

### 4.6 SESSION_LOG batched at session-end
Constraining doc-update to one batched commit per session reduces churn-driven drift.

### 4.7 The skill-registry router (vibe-speak Step 23)
Skills with sharp triggers route entropy *out* of brute-force paths. Skills with loose triggers can themselves become entropy sources (false-firings).

**Containment is structurally weaker than propagation in the current system.** This is the core reason entropy accumulates over time even when each individual session looks fine.

---

## 5. Entropy reservoirs

Places in the system where entropy accumulates without active correction. Reservoirs are dangerous because they pay no day-to-day cost — until something needs to be done that depends on their accuracy.

### 5.1 Stale branches
Branches > 72h old without merge or close. Per `PARALLELISM_SAFETY_THRESHOLDS.md` §4, BE doubles per 72h. A 2-week-old branch is essentially unmergeable without manual reconciliation.

### 5.2 BUILD_PLAN markers
`[x]` and `[ ]` markers that were never reconciled with reality. Today's BUILD_PLAN_CLAUDE.md shows ~50 items shipped; some of those `[x]` were retroactively marked in batched session-end commits, and any drift between commit reality and marker is silent.

### 5.3 MASTER §13 "Open Loops & Blockers"
Items entered when they were active blockers, never removed when the blocker resolved. The list of "things blocking us" drifts further from reality each session.

### 5.4 SESSION_LOG entries for non-shipping sessions
Sessions that ran but didn't ship are sometimes logged, sometimes not. Pattern is irregular → reading SESSION_LOG to estimate velocity gives a wrong number.

### 5.5 BUILD_INTELLIGENCE entries that no longer apply
Lessons captured against an older architecture that no longer matches the current code. They're still read by every future session — pure friction with no benefit.

### 5.6 Skills that no longer fire
Skills authored, registered in `_index.md`, and never triggered. Pay registry-read cost forever; deliver nothing.

### 5.7 `module_modes.json` entries for deprecated modules
States like `deprecated` are kept for legacy users. Over time, modules that should be hidden remain visible to override-allow users; the visibility logic compounds.

### 5.8 Worker code drift
The Cloudflare Worker (`accentos-anthropic-proxy`) is deployed independently of repo commits. Per current WIP, commit `2dca2a6` was pushed but not redeployed — so the live Worker code drifts from `worker/anthropic-proxy.js`. This kind of out-of-band drift is a hidden reservoir.

### 5.9 Supabase RLS policies
Policies applied via console or via migration but not represented in `sql/` are invisible to repo readers. Same out-of-band drift class as 5.8.

### 5.10 Captain's recollection
Items Captain "remembers" are blockers/decisions but never wrote down. The single most dangerous reservoir because it has no storage medium other than Captain's working memory.

---

## 6. Branch aging risk

Branches accumulate entropy at a rate that grows with their age. Operationally:

| Age | BE multiplier | Treatment |
|---|---|---|
| 0–24h | 1.0× | Merge or continue |
| 24–72h | 1.5–2× | Merge or rebase soon |
| 72–168h | 2–4× | Risky to merge without re-reading; consider rebasing |
| > 168h | 4–8×+ | Often unmergeable without manual reconciliation; consider closing |

Why aging compounds:

- The trunk has moved on (commits land in `main` from other branches).
- The shared resources (`index.html`, MASTER, BUILD_PLAN) have changed line context.
- The branch's mental model of "what's needed" has diverged from current MASTER §13.
- The Captain's recollection of *why* the branch was opened has faded.

**Operational implication.** Any branch hitting the 72h mark should be either merged or closed. A pile of 2-week-old branches is a classic late-stage failure of an orchestration system.

---

## 7. Abstraction fragmentation

A specific entropy sub-class: when "the same thing" is implemented multiple ways across the codebase because no session has time/context to unify.

### 7.1 Examples in AccentOS

- **Stat-card patterns.** Each `js/<module>.js` page has its own stat-card layout (Marketing, Decision Engine, Demand Forecast). They're 80% similar; differences are accidental, not intentional.
- **`goTo` route registration.** Modules register routes inline in different forms.
- **Modal close handlers.** Per BUILD_INTELLIGENCE, the inline `onclick` arrow-IIFE pattern bit a session once; some modules still use it.
- **Filter UI.** Free-text + dropdown filter pattern is reimplemented in most modules.
- **Vendor dropdown.** Reads from VD in slightly different ways across modules.

### 7.2 Why fragmentation is an entropy form

Each new session that builds a feature has to choose: copy the most recent example, or do it the "right" way. The accumulation of *non-canonical* examples means later sessions copy non-canonical patterns, propagating them.

### 7.3 Why fragmentation usually loses

Refactoring N implementations to one is a high-touch task that:

- Edits N module files.
- Touches `index.html` (registration, exports).
- Has high BE if any other branches are live.
- Provides no user-visible value, so it gets deferred.

The structural pressure is *toward* more fragmentation, not toward unification. Per CLAUDE.md and the global system prompt, premature abstraction is a real failure mode — but post-hoc abstraction needs deliberate windows that don't naturally appear.

### 7.4 Entropy contribution

Abstraction fragmentation is a slow-growth, low-cliff form of entropy. It doesn't break the system; it makes every future feature ~10–20% more expensive to ship cleanly. Compounds over a long timeframe.

---

## 8. Stale-documentation drift

A specific accumulation that deserves its own treatment: how docs move out of sync with reality.

### 8.1 Forms of stale-doc drift

- **`[x]` for items not yet shipped.** Aspirational marking.
- **`[ ]` for items shipped but not closed.** Marker-update skipped.
- **Version strings in MASTER not matching `index.html`.** Independent edits.
- **MASTER §13 listing resolved blockers as open.** Removal skipped.
- **WIP showing the wrong "current task."** Last session forgot to update.
- **BUILD_INTELLIGENCE entries describing fixed bugs.** No "obsolete" markers.
- **MASTER §11 (Tech Stack) listing tools no longer in use.** Permanent record without prune.

### 8.2 Detection

Drift is silent until either:
- Someone checks the doc against reality (rare, expensive).
- A future session acts on the doc and gets confused (cost paid by that session).

Currently, AccentOS has the `doc-drift` skill for explicit checks, but the firing rate is low — drift is detected reactively, not proactively.

### 8.3 Why drift accumulates

Doc updates are batched at session-end. End-of-session is the lowest-attention point of the session — the most likely time for an update to be skipped or done sloppily. Structurally, the cheapest moment to update docs is the moment they're least likely to be updated correctly.

---

## 9. Runtime illusion accumulation

A subtle category: states where the system *believes* something is true at runtime that isn't.

### 9.1 Examples

- **Cloudflare Pages cache.** A push deploys, but a CDN edge node may serve stale content for some users. Repo says shipped; users see old version.
- **Service-worker caching.** AccentOS doesn't ship a service worker, but if it did, this would be a major reservoir.
- **Cloudflare Worker redeploy lag.** Per current WIP, code can be in repo but not on the Worker.
- **Browser localStorage state from earlier sessions.** Module visibility overrides, vibe-speak preferences, sessionStorage API key. Future sessions reason about "what users see" while ignoring the localStorage layer.
- **Supabase row state vs. UI cache.** Hydration races where the UI shows stale rows because re-fetch wasn't triggered.
- **Auth token state.** Sessions assume current login = future login.

### 9.2 Why these are entropy

Repo state, Captain's mental model, and runtime state can all disagree simultaneously. Each disagreement is a silent failure waiting to surface — and the cost of fixing them is paid in surprise, which is the most expensive form of cost.

---

## 10. "Invisible entropy" categories

Catalog of entropy that no session is structurally positioned to see. These are the highest-leverage forms because they accumulate uninspected.

### 10.1 Per-session boot-cost duplication
Every session boots fresh. The duplicate work *across* sessions is invisible from inside any one session.

### 10.2 Worker / Pages / Supabase out-of-band state
Commits succeed; deploys may not. Sessions assume push = live.

### 10.3 Captain mental-model drift
Captain's working memory of blockers, decisions, agreements with vendors/agencies. Not reflected in any file. Drifts continuously.

### 10.4 Skill observation-log gaps
Skills fire (or fail to fire) but only the active one writes to its log. Skill-bypass cases are invisible unless `efficiency-monitor` flags them.

### 10.5 Cross-branch semantic conflict potential
Each branch is internally clean. Pairwise conflict probability is invisible to any single branch.

### 10.6 BUILD_INTELLIGENCE staleness
Entries describing problems that are now solved. No metadata to mark them obsolete.

### 10.7 Skill duplication
Two skills with overlapping triggers; neither is wrong individually.

### 10.8 Out-of-repo data drift
Customer-visible state on `accentlightinginc.com`, GMC, BigCommerce — outside repo, outside Cloudflare, outside any Claude session.

These eight categories are not detectable by any session reading the repo. They require *meta-observation* — which is what `efficiency-monitor` exists for, but its current scope covers only some of them.

---

## 11. "Looks productive but increases entropy" patterns

Anti-patterns where the work feels good and produces visible artifacts but the *net* contribution is more divergence, not less.

### 11.1 Refactoring without consolidation
Renaming variables, restructuring functions, "cleaning up" without unifying with existing patterns. Produces churn; doesn't reduce fragmentation; bumps line context for every other branch.

### 11.2 New skill creation when an existing one would fit
Adds a registry-read cost; routes some traffic away from the original skill (which now under-fires); produces fragmentation in skill space.

### 11.3 New module file for tightly related logic
Splitting into more modules can reduce frozen-file tax — *good* — but can also fragment a coherent feature across files no future session knows are related — *bad*. The judgment call is invisible from any one session.

### 11.4 Long WIP entries
Detailed WIP feels diligent. Long WIP usually means the work is stuck and entropy is accumulating *in the work itself.* Healthy WIP is short.

### 11.5 Mode-switch experimentation
Trying many vibe-speak modes in one session feels exploratory. Produces voice fragmentation in commit messages and observation-log noise.

### 11.6 Speculative scaffolding
Per CLAUDE.md / global prompt: builds for not-yet-needed features. Each unused scaffold is a permanent maintenance edge.

### 11.7 Dense commit messages with multiple unrelated topics
Looks like productivity. Costs Captain time per merge — Captain has to read more to find the actionable bit — and confuses future `git log`-readers.

### 11.8 Updating MASTER mid-session
Per OPERATING RULES, batched at session-end. Mid-session MASTER edits create races and force ad-hoc rebases.

---

## 12. False-progress signatures

Specific repeating shapes that, when observed, indicate entropy is accumulating faster than work is shipping.

### 12.1 Many WIP commits, no version bump
The version string in MASTER §3 hasn't moved, but the commit count has. Almost always: features in flight, none shipped.

### 12.2 BUILD_PLAN unchanged across sessions
Two or three sessions in a row with no `[x]`/`[ ]` modifications. Either nothing shipped or nothing was tracked. Either case is bad.

### 12.3 Long-running same-error fix attempts
Three or more sessions touching the same bug. Each session pays full boot cost. The bug is either harder than expected or being misunderstood — entropy is accumulating in the *understanding* of the bug, not the code.

### 12.4 Re-creation of recently-removed structures
A session adds back something a previous session deleted. Indicates BUILD_INTELLIGENCE / SESSION_LOG drift — the lesson didn't propagate.

### 12.5 Multiple sessions claiming "boot complete" without subsequent ship
Per `TOKEN_TO_OUTPUT_EFFICIENCY.md` §8.2. N sessions in this state = N × boot cost, output zero.

### 12.6 Increasing branch count without merge count
The number of `claude/*` branches grows; the number merged into `main` doesn't. Pure entropy reservoir growth (§5.1).

### 12.7 Skill firings going down while skill count goes up
Adding skills without raising the skill-firing rate. Each new skill is registry-cost without payoff.

### 12.8 SESSION_LOG entries getting denser per session-day
Long entries usually mean long sessions producing little or producing many small unrelated things. Either is entropy-positive.

---

## 13. Estimated current entropy accumulation rate

Honest, calibrated estimate as of 2026-05-10:

- **BUILD_PLAN drift rate:** ~1 line per ~10 sessions (one mismarked or unmarked item). Low absolute, but compounds over months.
- **Stale BUILD_INTELLIGENCE entries:** estimated 5–15% of current entries are now-obsolete relative to live architecture. Cost paid every cold start.
- **Live `claude/*` branches > 72h old:** unknown without inspection, but the existence of this branch (`claude/execution-economics-analysis-vf0FX`) suggests at least one. Each is an entropy reservoir.
- **`index.html` size growth:** 76% of 900KB hard limit. Every feature inlined here accelerates entropy on every other branch.
- **Skill firing-vs-existence ratio:** unknown without `efficiency-monitor` data; suspected several skills haven't fired in months.
- **Worker/Pages/Supabase out-of-band drift:** at least one currently active (Worker `2dca2a6` per WIP).
- **MASTER §13 open-loop staleness:** estimated 2–5 items resolved-but-still-listed.

**Summary rate:** the system is accumulating ~1 entropy-incident per session, with ~80% being self-clearing (corrected by the next session) and ~20% becoming reservoir entries. **Net long-term accumulation: ~0.2 reservoir entries per session.** At current pace, this is ~5–8 reservoir entries per month — manageable today, structurally untreated.

The accumulation rate is **non-catastrophic but increasing**, because every doubling of N or t multiplies several of the propagation paths in §2 without strengthening containment in §4.

---

## 14. Single largest hidden orchestration tax

**Per-session boot-cost duplication across parallel sessions** (§10.1, also `EXECUTION_ECONOMICS_MODEL.md` §7).

Why it ranks above other invisible taxes:

- It is paid every time *any* session starts, on every device.
- It scales linearly with N — 4 sessions = 4× the cost.
- It is *fully duplicated*: each of the N sessions reconstructs the same picture from the same files.
- It is invisible to the session paying it (the session only sees its own ingest).
- It is the largest *aggregate* cost line item in the system (~12–15% of total spend, per `TOKEN_TO_OUTPUT_EFFICIENCY.md` §12).
- It has no current containment — there is no warm pool, no shared session memory, no incremental boot.

Branch entropy and reconciliation are higher-cliff, but boot duplication is higher *steady-state* cost. Over a month of operations it likely dominates.

---

## 15. Biggest fake-productivity pattern currently present

**"Many active branches" as a proxy for progress.**

The signature: at any given moment, multiple `claude/*` branches exist, each with commits, each pushed, none merged. Each session associated with a branch feels productive. The trunk has not moved.

Why it qualifies as the *biggest* fake-productivity pattern right now:

- It generates the most visible "we are building" signal (multiple branches with commits).
- It produces the largest reservoir entropy contribution — every unmerged branch ages and accumulates BE.
- It is the natural output of the current workflow: web sessions and iOS sessions create per-task branches, and Captain merges them when convenient, which is sometimes "later."
- It self-reinforces: more parallel work feels like more output, so more parallel work is initiated, so more branches accumulate.
- The cost is paid by Captain (review queue saturation) and by *future* Claude sessions (high BE on every shared file), not by the originating session.

This is structurally worse than the "many WIP commits" pattern (§12.1) because branches survive across sessions while WIP commits at least pin to one branch.

---

## 16. DONE / KNOWN / NEXT

**DONE**
- Defined entropy as model-vs-reality divergence and traced its full lifecycle: sources, propagation, amplification, containment, reservoirs.
- Catalogued ten entropy sources, seven propagation paths, seven amplification mechanisms, seven containment forms, ten reservoir types.
- Modeled branch aging risk as a multiplier curve (1× → 8×+ over 0–168h+).
- Treated abstraction fragmentation, stale-doc drift, and runtime illusions as named entropy sub-classes.
- Listed eight invisible-entropy categories, eight "looks productive but increases entropy" patterns, and eight false-progress signatures.
- **Estimated entropy accumulation rate:** ~0.2 reservoir entries per session, ~5–8 per month, non-catastrophic but increasing.
- **Single largest hidden orchestration tax:** per-session boot-cost duplication across parallel sessions.
- **Biggest fake-productivity pattern currently present:** "many active branches" as a proxy for progress.

**KNOWN**
- All rates and ratios are calibrated, not measured. Real telemetry from `efficiency-monitor` would refine them.
- The model assumes Claude as primary builder; ChatGPT-Pro flows would add an additional propagation path not modeled here.
- Several invisible-entropy categories (§10) cannot be detected without instrumentation that doesn't currently exist. They remain invisible by structural necessity.

**NEXT**
- `OPERATOR_BANDWIDTH_LIMITS.md` covers the human-side bottlenecks that interact with this entropy model.
- A future, optional "entropy ledger" would record reservoir entries explicitly so they can be drained on a cadence — out of scope for analysis-only work.
