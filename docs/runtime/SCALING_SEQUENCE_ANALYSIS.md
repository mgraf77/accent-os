# SCALING SEQUENCE ANALYSIS

> **Companion to:** `ARCHITECTURAL_PRIORITIZATION_MODEL.md`. Same synthesis substrate (the prior six `docs/runtime/` analyses + the topology/substrate/maturity facts of AccentOS).
> **Scope:** Sequencing logic for architectural and scaling moves. Which move belongs *before* which. Which orderings are reversible. Which orderings, once executed wrongly, cannot be undone without rebuilding the system. Why some "fast progress" paths reduce long-term progress.
> **Frame:** Analysis-only. No implementation, no runtime mutation, no governance edits, no orchestration execution.
> **Last updated:** 2026-05-10

---

## 0. Why sequencing matters more than choice

The ten candidate moves in `ARCHITECTURAL_PRIORITIZATION_MODEL.md` are mostly all valuable in isolation. The question is not *whether* to do them; it is in *what order*. Two systems that make the exact same set of moves in different orders end up at radically different positions:

- One ends with low entropy, comfortable supervision, room to scale.
- The other ends with locked-in commitments to the wrong rules, an architecture that fights its own concurrency model, and orchestration debt that consumes the next refactor cycle.

The mistake is almost always not "we did the wrong thing" but "we did the right thing too early or too late." This document is about that risk.

The scaling lane is the most sequence-sensitive of all the lanes, because scaling moves are *amplifiers* — they multiply whatever the underlying system is doing, including the wasteful parts. A premature amplifier locks the wasteful behavior into the system at higher volume.

---

## 1. The correct sequencing order

Stated explicitly. This is the ordered version of `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §4–§5.

### Phase 0 — Baseline hygiene (always-on)

Pre-condition for any phase. Cheap, immediate, no architectural commitment:

- **Branch-age cap (72h merge or close).** Operational habit; touches no code.
- **WIP fidelity at session-end.** Operational habit; per current OPERATING RULES.
- **BUILD_INTELLIGENCE entry capture on every gotcha.** Operational habit.
- **Skill / mode / rule pruning cadence.** Quarterly review at most.

These should be running *now*, regardless of which phase the architecture is in. They are negentropy in pure operational form.

### Phase 1 — Foundation

Goal: eliminate the structural constraint (`index.html` monolith + shared global namespace) that limits every other move.

1. **Decomposition** of `index.html` — split into a thin loader plus per-module entry points.
2. **Module isolation** enforced as a contract — features live entirely in `js/<feature>.js`; no shared global mutation; explicit module export surface.
3. **Loader boundaries** formalized — defined contract for what a module receives and exposes; runtime check that violators are rejected before they merge.

These are co-developed. Splitting them sequentially produces a window where decomposition has happened but isolation isn't enforced — the worst possible intermediate state because BE on the new module surfaces is unbounded until the contract lands.

### Phase 2 — Substrate

Goal: make the foundation operationally safe under concurrency.

4. **Per-session WIP files** (`WORK_IN_PROGRESS/<session-id>.md`) with a deterministic merge strategy.
5. **Paired-down migrations** for every up-migration (going forward; back-fill optional and lower priority).
6. **Deploy verification** — explicit confirmation that a Cloudflare Pages build succeeded *and* served the new bundle (not just that it compiled), and that any Worker code has actually been redeployed (the `2dca2a6` situation in current WIP is the reference pattern).
7. **Idempotent everything** — migrations, doc-update commits, WIP writes — the convention is already established for migrations and should extend to other surfaces.

These can run partially in parallel with Phase 1 but only land fully *after* Phase 1.

### Phase 3 — Operational legibility

Goal: make the now-decomposed, now-substrated system observable enough that next-level decisions are made on data, not vibes.

8. **Branch entropy estimator** — a 5-line proxy reading `git branch --list claude/*` + touched-file count + age, emitting Low/Elevated/High.
9. **Queue durability** — persistent queue of pending merges, pending reviews, pending stabilizations. Survives session boundaries.
10. **Supervision instrumentation** — review-cost-per-ship, reconciliation count, iPhone-vs-desktop review ratio, decision-quality slot tracking.

### Phase 4 — Governance settle

Goal: codify what's stable.

11. **Governance hardening** — narrow OPERATING RULES, prune skills, finalize vibe-speak modes against the post-decomposition system. *Critical that this comes after the system is stable*; doing it earlier locks in rules for a system that no longer exists.

### Phase 5 — Multi-worker concurrency

Goal: bring additional model workers into the loop safely.

12. **Codex integration as reviewer** — single most defensible Codex use, lowest BE risk; can be done earlier than this point as long as Codex never writes the monolith.
13. **Codex integration as concurrent writer** — only safe once Phase 1 (module isolation + loader boundaries) is fully real.

### Phase 6 — Scaled execution

Goal: raise N (parallelism, autonomous chaining, overnight ceiling).

14. **Execution scaling within the supported range** — N=4 supervised becomes safe; N=3 overnight becomes routine; longer autonomous chains become viable.

This is the *last* phase, not the first. Most of this document explains why.

---

## 2. Irreversible ordering mistakes

Some sequencing errors can be corrected by going back and doing the missing earlier step. Others cannot — they create system states from which the correct sequence is no longer reachable without rebuilding. The irreversible ones are the ones to watch.

### 2.1 Governance hardening before architecture stabilization

Once the OPERATING RULES, skill registry, vibe-speak modes, and MODULE_MODES states are codified, every future session reads them and acts on them. Changing them later imposes a re-training cost on every active session and a re-reading cost on every future cold start. Worse, *people* (Captain) build mental models around the rules, and updating those mental models is harder than updating files.

If governance is hardened against the *current* monolithic system, the rules will be wrong after decomposition — but the cost of revising will discourage revision. The system will operate against suboptimal rules indefinitely.

**Why irreversible:** governance has high read-side stickiness. The cost of revising is proportional to the number of operators who have internalized the previous version. Attempting to "rebuild governance from scratch" almost never happens cleanly; old rules linger as folklore.

### 2.2 Codex / external-model concurrent integration before module isolation

Bringing a second model in as a *concurrent writer* on the monolith doubles the writer count on the most contended file. The fact that "we tried it and it worked" — which is the typical first-attempt outcome — locks in the integration pattern. Removing it later means walking back commitments to the second model's role, which is socially expensive.

**Why irreversible:** integrations create dependencies. Once a workflow assumes Codex review, removing Codex review feels like a regression. The right time to integrate is *after* the architecture supports concurrent writers; integrating earlier means the architecture is forever shaped to accommodate the integration's worst behaviors.

### 2.3 Splitting the repo before splitting the file

Multi-repo is sometimes proposed as a solution to the monolithic-file problem. It isn't — multi-repo addresses a problem AccentOS doesn't have (cross-team coordination) and ignores the problem it does have (single-file concurrency). Splitting the repo before decomposition costs the coordination overhead of N repos *plus* the original monolith.

**Why irreversible:** un-splitting a repo is far harder than splitting one. Once two repos exist with their own histories, branches, CLAUDE.md files, and skill registries, merging them back is a multi-week project that no one will fund.

### 2.4 Premature CI/CD on the monolith

Adding a CI pipeline before runtime substrate ([2]) installs verification logic against an architecture that's about to change. The pipeline calibrates against the wrong contract. Once it exists, sessions begin relying on its signal — which means the pipeline becomes load-bearing before its target architecture is real. Revising the pipeline later means breaking sessions that depended on its current behavior.

**Why irreversible:** CI signals shape what Claude considers "ready to ship." Once that shaping is in place, walking it back means re-training the entire workflow. Far easier to add CI *after* the substrate is real.

### 2.5 Overnight execution scaling before substrate

A successful overnight run at N=4 generates a "we proved we can do this" narrative that is essentially impossible to walk back. Subsequent attempts will frame any failures as anomalies rather than as predictions of the current architecture. The narrative becomes the constraint, not the data.

**Why irreversible:** the social cost of un-doing a scaling move is higher than the technical cost. Captain will not voluntarily reduce N after a "successful" overnight, even if morning reconciliation costs are paid.

### 2.6 Schema migrations applied without paired downs

Once a migration is in the production DB, the schema has moved. If the migration was wrong, the only way to undo it is *another* migration — and that migration is itself a candidate to be wrong. Each unrolled migration is a permanent commitment until explicitly reversed.

**Why irreversible:** data shapes are sticky. Tables filled with rows in the new shape cannot be cheaply re-shaped backward. Production data does not have a `git revert`.

### 2.7 Skill registry sprawl

Skills are easy to add, hard to remove. Each unused skill has an attached observation log, a registry entry, a CLAUDE.md / SKILL.md document, and possibly a workflow that depends on it. Pruning a skill that has *any* historical usage requires a Captain decision and a doc revision.

**Why irreversible (in practice):** the energy required to prune is higher than the energy required to add. Unused skills accumulate forever unless an explicit cadence prunes them.

---

## 3. Premature-scaling traps

The seven specific traps where the system is *most likely* to scale prematurely under current pressures.

### 3.1 The "we have N branches, why not run them in parallel" trap

Multiple `claude/*` branches already exist. The temptation is to run sessions on all of them in parallel "since they exist." This treats branch existence as a license to schedule, which it isn't — many branches exist *because* the system fan-outs naturally; running them all simultaneously hits Zone RED in `PARALLELISM_SAFETY_THRESHOLDS.md` immediately.

**Trap signature:** "We already have the branches; the work is already in flight; let's just push through."

**Why it's a trap:** the number of branches you can spawn is much higher than the number you can review. Existing branches without active sessions cost almost nothing; running sessions on all of them at once costs everything.

### 3.2 The "Codex can review while Claude builds" trap

Sounds like classic parallelization. In practice, the failure mode is that Codex's reviews *also* need to be reviewed (by Captain, since Codex is not authorized to merge alone). So Codex doesn't reduce Captain load — it adds a new review surface that Captain must also process.

**Trap signature:** "Codex handles review, Claude handles build, Captain just supervises."

**Why it's a trap:** Captain's role is supervising the *system*, not just the workers. Adding a worker that produces output Captain must review *increases* supervision load unless Codex's output is trusted unread — which is rubber-stamp by another name.

### 3.3 The "autonomous mode all night" trap

The `autonomous-mode` skill is real and useful for short, well-scoped, single-track work. The trap is treating it as a license for multi-session, multi-branch, all-night runs. The morning Captain-cost asymmetry (`EXECUTION_ECONOMICS_MODEL.md` §9) makes this expected-value-negative above N=2 without strict guardrails.

**Trap signature:** "I'll run 3 sessions in autonomous mode overnight and review in the morning."

**Why it's a trap:** the autonomous mode skill doesn't extend operator bandwidth — it extends operator *delay*. The work happens; the review still has to happen later, against branches now older and BE-higher than they would have been.

### 3.4 The "the iPhone is fine for this" trap

Mobile orchestration is real and valuable for ambient work. The trap is letting iPhone reach into review-quality work because Captain is on the phone *anyway*. Per `OPERATOR_BANDWIDTH_LIMITS.md` §3.3, this produces rubber-stamp review without the Captain noticing.

**Trap signature:** "I'm on my phone, but I can approve this quickly."

**Why it's a trap:** the cost of an unreviewed-but-merged change is far higher than the cost of *delaying* the merge until desktop access is available. Pretending iPhone review is desktop review is the dominant fake-supervision pattern.

### 3.5 The "more skills means smarter system" trap

Each skill adds boot-time read cost and curation overhead. The 25 current skills already represent a registry-load cost paid every cold start. Adding skill #26 to address a new pattern feels like infrastructure investment but produces compounding cost without a matching frequency-of-firing payoff for many candidates.

**Trap signature:** "Let's make a skill for that pattern."

**Why it's a trap:** the skill that *would* create leverage is the one that fires often and routes around brute-force paths. The skill that *gets created* is often a one-off codification of a single past pattern. Pruning > adding.

### 3.6 The "let's add another mode" trap

9 vibe-speak modes is at the upper bound of what a session can model accurately at boot. Adding mode #10 adds boot-time cost and intra-mode confusion (sessions choosing between similar modes). Specialization-by-mode also produces voice fragmentation in the SESSION_LOG.

**Trap signature:** "Mode X doesn't quite fit; let's add mode Y."

**Why it's a trap:** more modes means more decisions per session about which mode is active, which is itself a cognitive load. The effective number of modes a system can sustain is much smaller than the number of modes it can describe.

### 3.7 The "we already shipped N features per week last quarter" trap

Past velocity is treated as evidence of current sustainable velocity. But the system's underlying architecture — the very `index.html` monolith and shared globals — has gotten worse since last quarter. Past velocity at lower entropy does not predict current sustainable velocity at higher entropy.

**Trap signature:** "We did 10 ships last week; let's do 12 this week."

**Why it's a trap:** velocity is a *trailing* indicator of system health. A healthy system can absorb high velocity; a stressed system breaks under it. The right question is not "can we ship faster" but "is the system in a state where faster shipping is sustainable."

---

## 4. Architecture-before-scale logic

The principle, stated cleanly:

> Every architectural shortcoming gets *worse* under concurrency, not better. Therefore concurrency must wait until shortcomings are addressed.

The corollary, equally important:

> Concurrency hides shortcomings as well as it amplifies them. Sessions running in parallel produce activity that looks like progress, masking the fact that the system is degrading.

Concretely:

- The monolithic `index.html` is a problem at N=1. It is a worse problem at N=2 (frozen-file tax), an emergency at N=4 (collisions on every shared anchor), and structurally broken at N=6 (no two sessions can patch it without one being stale).
- The lack of paired-down migrations is a problem when one bad migration ships. It is a *worse* problem when concurrent sessions both ship migrations — ordering becomes undefined.
- The single shared WIP doc is annoying at N=1. At N=3 it actively destroys hand-off fidelity.
- Captain rubber-stamp risk on iPhone is a small problem at N=1 (most decisions deferrable to desktop). At N=4, deferral isn't an option — the queue won't drain serially in available desktop time.

In every case, concurrency makes the underlying problem more painful *and* less detectable. The painful-but-detectable single-session version is a feature; it pressures the operator to address the underlying issue. Concurrency takes away the pressure (because activity continues) while increasing the cost (because the issue compounds in the background).

**Architecture before scale is therefore not an aesthetic preference; it is a survival-relevant ordering rule.** Skipping it does not produce a faster system that's slightly messier — it produces a system whose core problems become unaddressable at the scale it's running.

---

## 5. Why some scaling moves create future dead ends

Not every premature scaling move is recoverable. Some create architectural states from which the correct architecture is no longer reachable without a rewrite.

### 5.1 Locking concurrency into the monolith

If the system runs N=4 routinely on `index.html` for several months, a body of work depends on the file's specific structure across multiple branches at any given time. Refactoring the file means picking a moment when no branch depends on the current line context — which becomes harder, not easier, as N increases. Eventually the architecture is locked in by the live work depending on it.

**Dead-end signature:** "We can't refactor `index.html` because too many sessions are mid-flight against it."

**How to avoid:** decompose *before* sustained N>2 operation begins.

### 5.2 Codex-as-writer dependencies on monolith conventions

If Codex contributes patches to the monolithic file using its own patterns (which won't be quite the same as Claude's surgical-`str_replace` discipline), the file gains a second writer's stylistic fingerprint. Refactoring to module isolation later means re-doing Codex's contributions; rolling back means losing them. Either path is expensive.

**Dead-end signature:** "We have Codex-style code and Claude-style code interleaved in `index.html`."

**How to avoid:** Codex as writer waits until module isolation is real.

### 5.3 Skill / mode / rule sediment

If new skills, modes, and rules are added against the current architecture, then the architecture changes, the sediment doesn't get cleared. Future sessions read the now-irrelevant skills/modes/rules at every cold start. The cost is permanent unless explicitly pruned, and the energy required to prune is higher than the energy required to leave them.

**Dead-end signature:** "We have skills/modes/rules from three architectural eras simultaneously."

**How to avoid:** governance hardening waits until architecture is settled (Phase 4).

### 5.4 Schema sediment

Schema choices made under one feature set don't auto-update when the feature set changes. Tables, columns, RLS policies, and indices added for v6.10.x decisions may not match v7.x decisions, but they're in production with rows. Each one becomes either a permanent commitment or a future migration tax.

**Dead-end signature:** "We have several columns in `vendors` table that are no longer used by any code."

**How to avoid:** schema discipline (paired downs, idempotent migrations, periodic schema audits) starts in Phase 2.

### 5.5 Worker / Pages / Supabase out-of-band drift

The Worker code (`worker/anthropic-proxy.js`), the Pages cache, and Supabase RLS state can drift independently from `main`. A long-running drift becomes nearly impossible to fully reconcile — the live state has facts that the repo doesn't represent.

**Dead-end signature:** "We're not 100% sure what's actually live on the Worker."

**How to avoid:** deploy-verification substrate (Phase 2).

### 5.6 Captain-mental-model lock-in

If Captain runs the system for months under one set of mental shortcuts ("Marketing Hub is the hard module, Vendor Ranking is easy, the calendar never breaks"), changing the architecture changes the mental model — but Captain's heuristics lag. For weeks after a refactor, Captain may operate against the old model, producing decisions that mismatch the new architecture.

**Dead-end signature:** Captain repeatedly applies heuristics that no longer fit.

**How to avoid:** small, well-flagged architectural moves with explicit "this changed" announcements; resist large simultaneous refactors.

---

## 6. Current temptations that are anti-leverage

Specific, named temptations present *now* in the AccentOS context. Each is anti-leverage in the precise sense that it consumes attention or produces commitments that *reduce* the system's ability to make the highest-leverage moves later.

### 6.1 Continuing to ship features into the monolith because "it still works"

Each feature shipped as inline `index.html` content (rather than as a `js/<feature>.js` module) makes the eventual decomposition more expensive. The pace of v6.10.x has been good, but the more `index.html` grows, the harder splitting becomes — and decomposition is the highest-leverage move in the ranking. Continuing to inline features is anti-leverage by definition.

The mitigation isn't "stop shipping features." It's "ship every new feature as `js/<feature>.js` with the wire-up the only `index.html` change."

### 6.2 Adding more parallel `claude/*` branches

Each new long-lived branch is a future entropy reservoir per `ENTROPY_ACCUMULATION_MODEL.md` §5.1. The temptation to spawn branches per-task creates more reservoirs than Captain can drain at the current review bandwidth. Anti-leverage because it accelerates the very entropy that must be contained.

### 6.3 Treating "we shipped 8 things last week" as a reason to ship 10 this week

Past velocity at lower BE doesn't predict sustainable velocity at higher BE. Trying to match or exceed last quarter's pace into a more-stressed architecture is anti-leverage; it produces volume without quality and accelerates the path to forced refactor.

### 6.4 Adding skills for one-shot patterns

Each skill costs every future session a registry-read tax. Single-firing or low-firing skills are anti-leverage — they extract tax from every session for value delivered to one. The current skill registry already shows several candidates (specific bulk-task or vendor-specific skills) whose firing rate likely doesn't justify their boot cost.

### 6.5 Documenting the current architecture as if it's stable

Including this document and its companions. Analysis docs are valuable; they are not infinitely valuable. Producing a tenth, eleventh, twelfth analysis doc against a system that hasn't taken the highest-leverage move is anti-leverage past the knee of the curve. **Self-aware caveat: this document represents the eighth doc in this lane; the analysis lane is approaching its diminishing-return knee.**

### 6.6 Optimizing the current cost model

E.g., reducing token usage per session by 5% via tighter cold-start prompts. The work is real but small; the same effort directed at decomposition would produce 10–100× more savings via reduced BE and reduced reconciliation cost. Anti-leverage because it directs energy at the wrong layer.

### 6.7 Onboarding additional model workers (Codex, ChatGPT, others) before Phase 1

Per §2.2 above, this is the irreversible-mistake version. The temptation is high (more workers = more output, surface-reading) but it locks the architecture into supporting a concurrency pattern it cannot actually support.

### 6.8 Premature observability work

Adding metrics, traces, dashboards before the system is settled enough that the metrics will mean something. Observability of a moving target is mostly noise. Anti-leverage in the sense that the same instrumentation effort produces a lasting signal post-Phase-3.

---

## 7. "Fast progress" paths that slow long-term progress

The deeper question — which felt-fast paths actively reduce real progress over a 6–12 month horizon.

### 7.1 Inlining features into `index.html` for speed

Inlining is faster *today* than authoring a clean `js/<feature>.js` module. It is slower *next month* because the file is bigger, BE is higher, and the eventual split is harder. The fastest path *long-term* is the pattern AccentOS has mostly adopted (per-feature module files), and it should be tightened, not relaxed.

### 7.2 Skipping BUILD_INTELLIGENCE entries to "ship faster"

Per `TOKEN_TO_OUTPUT_EFFICIENCY.md` §5.6, BUILD_INTELLIGENCE entries have ~25× ROI per occurrence. Skipping them saves 200 tokens now and costs 5,000 tokens per future re-investigation. Felt-fast, slow.

### 7.3 Skipping per-session WIP discipline

Updating WIP at session-end takes minutes. Skipping it costs the next session ~10k tokens of re-investigation. The cumulative cost over a quarter is far larger than the time saved. Felt-fast, slow.

### 7.4 Running N=4 sessions when N=3 would suffice

The marginal session feels like a 33% throughput boost. In the YELLOW→RED transition, it produces less *useful* throughput than N=3 while consuming more Captain attention. Felt-fast, net-negative.

### 7.5 Letting branches age past 72h "because they're still useful"

Each day past 72h roughly doubles the branch's BE relative to trunk. A "we'll merge it next week" branch becomes nearly unmergeable; the merge or rebuild cost is much higher than continuing the work would have been. Felt-thrifty, slow.

### 7.6 Approving on iPhone "because it's faster than waiting until I'm at the desk"

Each rubber-stamp approval lets entropy past the only filter that catches semantic conflicts. The downstream cost is asymmetric and large. The felt time saved is real (5 minutes per approval × N approvals); the time lost to one shipped semantic conflict is hours. Felt-fast, slow on average.

### 7.7 Generalizing the "agentic level 3 → 4" pattern from Alerts to other modules

Agentic Level 4 (cross-system actions, not just notifications) is appropriate for narrow, well-bounded use cases. Generalizing it to "AccentOS takes more autonomous actions across modules" without runtime substrate ([2]) and queue durability ([7]) creates an autonomy surface that consumes Captain bandwidth in surprise events. Felt-progress (the system "does more"), slow on net.

### 7.8 Adding new external integrations because the M-task came back unblocked

Track 6 features (BigCommerce REST, Klaviyo, GA4) become unblocked when Captain delivers credentials. The temptation is to take them on as soon as unblocked. But each one is a new entropy reservoir without runtime substrate. Felt-progress (BUILD_PLAN moves), real cost (more out-of-band state to track). The right cadence is one external integration per substrate-stabilized window, not all of them in series.

---

## 8. What MUST exist before concurrency increases safely

The minimum bar. Concurrency *can* run without these — it has been — but it cannot *increase* without them, because the existing N=2-to-3 ceiling is set precisely by their absence.

### 8.1 Non-monolithic code surface

Phase 1 ([1] + [5] + [6] from `ARCHITECTURAL_PRIORITIZATION_MODEL.md`).

Without this, the frozen-file tax dominates and BE compounds non-linearly with N. The current ceiling (N=2-to-3) is set by the monolith. Raising N above this ceiling requires removing the monolith.

### 8.2 Per-session WIP

Phase 2 substrate piece. Eliminates WIP-clobber risk and makes hand-offs survive across parallel sessions.

Without this, every new concurrent session is a clobber risk to every other session's WIP. Cannot sustain concurrent autonomous work without it.

### 8.3 Paired-down migrations

Phase 2 substrate piece. Reduces schema-rollback cost from hours/days to minutes.

Without this, any single concurrent session that ships a wrong migration locks the entire system into a recovery cycle that consumes N sessions' worth of capacity.

### 8.4 Deploy verification

Phase 2 substrate piece. Confirms that pushed code is actually live (Pages bundle, Worker code, Supabase state).

Without this, "shipped" is ambiguous. Concurrent sessions building on top of an "apparently shipped" change that didn't actually deploy will produce silent inconsistencies.

### 8.5 Branch-age cap discipline

Phase 0 hygiene. Cheap, immediate.

Without this, concurrent sessions accumulate stale branches faster than they retire them. The reservoir grows; BE compounds.

### 8.6 Captain bandwidth model that accounts for review cadence

Phase 3 supervision instrumentation, plus the operational understanding from `OPERATOR_BANDWIDTH_LIMITS.md`.

Without this, concurrency is increased on the assumption that Captain's bandwidth is elastic — which it isn't. The increase puts Captain past saturation, producing rubber-stamp or queue-dread collapse.

### 8.7 Honest signal that scaling is needed

This one is conceptual rather than technical. The system should not scale concurrency *aspirationally* (because it would be cool to run more sessions); it should scale because there is durable, visible, value-side pressure that the current ceiling can't absorb. Today, that pressure isn't present — N=2-to-3 is producing roughly the system's natural maximum given operator bandwidth. Scaling the concurrency layer when it's not the binding constraint is anti-leverage.

---

## 9. The single highest-leverage architectural move

**Decomposition of `index.html` into a thin loader plus per-module entries, co-developed with module isolation enforcement and a formal loader contract.**

(Same conclusion as `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §12. Re-stated here because the sequencing analysis confirms it independently: every other valuable move's correct timing is *after* this one. It is the keystone of the entire prioritization graph.)

---

## 10. The single most dangerous premature-scaling move

**Increasing overnight concurrency past N=3 (or generalizing autonomous chaining) before Phase 1 is real.**

(Same conclusion as `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §14. Re-stated here because the sequencing analysis identifies it as the single move most likely to create *irreversible* dead ends — both technical, §5.1, and social, §2.5. Its danger is amplified by the fact that the first attempt almost always *appears* successful, locking in a narrative that the system cannot afford.)

A close runner-up that deserves naming: **Codex / external-model integration as a concurrent writer on the monolith.** Same physics, slightly slower compounding, similar irreversibility (§2.2, §5.2). Either move taken now compromises the next 12 months of survivability.

---

## 11. Honest current long-term survivability

Same answer as `ARCHITECTURAL_PRIORITIZATION_MODEL.md` §13, refined by the sequencing lens:

- **Status-quo trajectory:** ~9–12 months of healthy operation, then forced refactor under feature-pressure. Velocity collapses during the refactor; some work accumulated in the meantime is lost or rewritten.
- **Status-quo plus one premature-scaling move (e.g., a "successful" N=4 overnight):** drops to ~3–6 months. Irreversible-narrative effects (§2.5) accelerate the rest.
- **Phase 1 in next quarter, no premature scaling:** indefinite survivability at current operator bandwidth, with the ceiling raised by ~50%.
- **Phase 1 + Phase 2 within next two quarters, no premature scaling:** indefinite survivability with N=4 supervised becoming routinely safe and Codex integration becoming net-positive.

The single biggest sensitivity in this estimate is whether a premature-scaling move happens before Phase 1. If it does, survivability halves. If it doesn't, the trajectory is stable.

This is the central insight from the sequencing analysis: **the system's long-term survivability is more sensitive to what we *don't* do prematurely than to what we *do* do.** Avoiding the wrong move at the wrong time is more leverage than making the right move slightly faster.

---

## 12. Sequencing in one paragraph

Run Phase 0 (hygiene) always; nothing depends on it but everything benefits. Make Phase 1 (decomposition + module isolation + loader boundaries) the next deliberate architectural commitment; treat it as the foundation move from which all others derive correct timing. Layer Phase 2 substrate (per-session WIP, paired-down migrations, deploy verification) onto the now-decomposed system. Add Phase 3 operational legibility (BE estimator, queue durability, supervision instrumentation) once the substrate is real, so it calibrates against the right baseline. Settle Phase 4 governance only after the architecture is stable, to avoid locking in rules that will be revised. Bring multi-worker concurrency (Phase 5) and execution scaling (Phase 6) last — and recognize that today, both are net-negative regardless of how attractive they look. The single sequencing rule: **architecture before scale; scale only when not scaling is more expensive than the foundation work.**

---

## 13. DONE / KNOWN / NEXT

**DONE**
- Defined the correct sequencing in seven phases (Phase 0 hygiene, Phase 1 foundation, Phase 2 substrate, Phase 3 operational legibility, Phase 4 governance settle, Phase 5 multi-worker concurrency, Phase 6 scaled execution).
- Named seven irreversible ordering mistakes — the orderings from which the correct sequence is no longer reachable without rebuild.
- Named seven premature-scaling traps with explicit signatures.
- Articulated architecture-before-scale logic with the corollary: concurrency hides shortcomings as well as it amplifies them.
- Named six dead-end paths that some scaling moves create.
- Named eight current temptations that are anti-leverage *now*.
- Named eight "fast progress" paths that slow long-term progress.
- Specified seven concrete preconditions that MUST exist before concurrency increases safely.
- **Single highest-leverage architectural move:** decomposition of `index.html` (with module isolation + loader boundaries as the foundation cluster). Independently confirmed from sequencing logic.
- **Single most dangerous premature-scaling move:** raising overnight concurrency past N=3 / generalizing autonomous chaining before Phase 1 is real. (Runner-up: Codex as concurrent writer pre-isolation.)
- **Honest long-term survivability:** ~9–12 months status-quo (~3–6 months if a premature-scaling move occurs first); indefinite if Phase 1 lands in next quarter without premature scaling. Sensitivity is dominated by *avoiding* wrong moves more than *making* right ones faster.

**KNOWN**
- All sequencing claims are calibrated qualitative; no measurement.
- The seven phases are an idealized order. In practice phases overlap; the sequencing rule is "don't start a later phase before the binding constraint of an earlier phase is addressed," not "wait until the earlier phase is 100% done."
- The "Codex as reviewer" exception is real and narrow — it can run earlier than its phase placement suggests, *provided* it never writes the monolith. The danger is the writer role, not the reviewer role.
- The narrative-irreversibility cost (§2.5, §5.1) is the hardest cost to predict because it depends on social dynamics, not technical state. It is named honestly here because it is the dominant failure mode of premature-scaling moves in real human systems, not just a theoretical concern.

**NEXT**
- The eight `docs/runtime/` analysis docs now form a coherent corpus: `EXECUTION_ECONOMICS_MODEL.md`, `PARALLELISM_SAFETY_THRESHOLDS.md`, `TOKEN_TO_OUTPUT_EFFICIENCY.md`, `ORCHESTRATION_COST_CENTERS.md`, `ENTROPY_ACCUMULATION_MODEL.md`, `OPERATOR_BANDWIDTH_LIMITS.md`, `ARCHITECTURAL_PRIORITIZATION_MODEL.md`, `SCALING_SEQUENCE_ANALYSIS.md`. They should be read together; each layer constrains the others.
- The analysis lane has reached its diminishing-return knee. Further analysis docs at this rate will *substitute* for action rather than enable it. The next valuable move is *not* a ninth analysis doc; it is a Phase 1 plan or a Phase 0 operational habit.
- The single most operator-actionable item from this corpus: **before any move that scales N, expands autonomy, or onboards another model, ask whether Phase 1 has happened. If no, the move is net-negative regardless of how it feels.**
