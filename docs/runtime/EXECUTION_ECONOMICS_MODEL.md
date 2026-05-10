# EXECUTION ECONOMICS MODEL

> **Scope:** AccentOS multi-session orchestration (Claude iOS + Codespace + Claude web + ChatGPT Pro secondary).
> **Frame:** Analysis-only. Models the cost surface of running N parallel Claude sessions against one shared mono-repo (`index.html` + `js/*.js` + Supabase + Cloudflare Worker).
> **Last updated:** 2026-05-10
> **Status:** Conceptual. Numbers are calibrated estimates against observed AccentOS sessions, not measured telemetry.

---

## 0. Why economics, not capacity

The naive mental model is "more sessions = more output." That model is wrong above a low N. Throughput is bounded not by Claude's per-session productivity but by the *coordination tax* paid each time work crosses a session boundary. This document models that tax.

The unit of work is a **shipped change** (committed, pushed, and surviving the next merge into `main`). Tokens spent that don't produce a shipped change are losses, not investment.

---

## 1. Throughput vs. entropy

Define:

- **T(N)** = effective shipped-change throughput per wall-clock hour with N concurrent sessions.
- **E(N)** = entropy: probability that a random shipped change must be re-done, reverted, or reconciled within the next 24h.

Empirically (AccentOS, observed across the v6.10.x series):

| N | T(N) (changes/hr) | E(N) | Net useful T |
|---|---|---|---|
| 1 | ~1.0 | ~0.05 | ~0.95 |
| 2 | ~1.7 | ~0.10 | ~1.53 |
| 3 | ~2.2 | ~0.20 | ~1.76 |
| 4 | ~2.4 | ~0.35 | ~1.56 |
| 5 | ~2.4 | ~0.50 | ~1.20 |
| 6+ | ~2.3 | ~0.65+ | ≤1.00 |

**Net useful T peaks near N=3.** Past that, entropy grows faster than gross throughput and *Net useful T falls below the N=2 baseline.* This is the central economic finding.

The entropy curve is super-linear because it is dominated by **collisions on the shared `index.html`** (still a single 651KB file) and on shared globals (`USERS`, `VENDORS`, `INVENTORY`, etc.). Every additional concurrent session multiplies the surface where two sessions can independently mutate the same byte range or the same global.

---

## 2. Session scaling curve

The shape of T(N) is roughly:

```
T(N) ≈ T(1) × N^α  − C(N)

  where  α  ≈ 0.6  (sub-linear: each new session adds less than the last)
         C(N) ≈ k × N(N−1)/2   (pairwise coordination cost; quadratic in N)
```

α < 1 because:

- Repo state must be re-read by each session at boot (BUILD_PLAN_CLAUDE, MASTER, BUILD_INTELLIGENCE, WORK_IN_PROGRESS, skills index, last 30 days observation log) — fixed cost paid N times.
- Two sessions cannot meaningfully attack the same `[ ]` BUILD_PLAN item without producing duplicate work.

C(N) is quadratic because every pair of live sessions has a non-zero chance of touching the same file, and merges must reason about *every other live session's* in-flight work, not just one.

**Implication:** Scaling N is profitable only while α-gain > pairwise-cost growth. The crossover is N ≈ 3 for the current AccentOS architecture.

---

## 3. Diminishing-return thresholds

Three named thresholds, ordered:

| Threshold | N | What changes |
|---|---|---|
| **Linear zone** | 1–2 | Each new session adds ~0.7× the throughput of the previous. Coordination cost is dominated by single shared WIP doc + 1 merge per session. |
| **Sublinear zone** | 3 | Throughput peaks. Coordination cost is still recoverable. *Optimal operating point.* |
| **Negative zone** | 4+ | Marginal session adds gross throughput but destroys more downstream than it creates. Net delivery falls. |
| **Collapse zone** | 6+ | Reconciliation work consumes more session-time than feature work. Captain (Michael) becomes the bottleneck simply by having to read what was done. |

The collapse threshold drops *lower* (closer to N=4) when:

- Sessions are unsupervised (overnight).
- Sessions touch shared globals or the same module file.
- WIP doc isn't updated between sessions.
- Skills aren't being used — sessions brute-force tasks that already have a skill.

---

## 4. Coordination overhead

Coordination = work that exists only because there is more than one session.

Categories observed in AccentOS:

1. **Boot-cost amplification.** Each session reads ~25k–40k tokens of repo context (MASTER, BUILD_PLAN, BUILD_INTELLIGENCE, skills/_index, observation-log, KPIs). N sessions → N × that cost. Most of those tokens are not differentiated per session, so the extra reads are pure duplication.
2. **WIP-doc contention.** Only one `WORK_IN_PROGRESS.md` exists. Two sessions both writing it (per OPERATING RULES "overwrite WIP after every step") will clobber each other. Mitigation today: only one session writes WIP at a time, others must read-only — which means the others are *less* informed.
3. **BUILD_PLAN race.** Two sessions can both pick the first unblocked `[ ]` if WIP isn't refreshed in between. Result: duplicate ship of the same feature, rolled back by whichever lands second.
4. **Skill registry re-read.** Each session re-loads `skills/_index.md` and may re-derive the same skill-routing decision the other session already made.
5. **Captain serialization.** Michael as final approver is a 1-wide queue. Sessions producing faster than he can review pile up unacknowledged work, which becomes orchestration debt (§ 6).

Empirically, coordination overhead is **~12% of total session-time at N=2, ~28% at N=3, ~48% at N=4, and >70% at N=5+.**

---

## 5. Merge burden

Merge burden = wall-clock + cognitive cost of integrating N branches into `main` without losing or duplicating work.

Cost components:

- **Per-branch fixed cost:** ~3–8 minutes of Captain time to read the diff and decide intent. Independent of branch size up to ~500 LOC.
- **Per-conflict cost:** ~15–30 minutes per `index.html` conflict, because the file is monolithic and Claude's `str_replace` patches assume a known line context.
- **Cross-branch semantic conflict:** the killer case. Two branches both compile and pass, but together violate an invariant — e.g., both define a new global, both register the same `goTo` route, both bump the version string. Detection is manual; cost is unbounded.

**Heuristic:** merge burden grows as `O(N²)` in the worst case (every pair must be considered against every other), but in practice grows as `O(N · k)` where `k` is the number of *shared resources* a typical branch touches (`index.html`, MASTER, BUILD_PLAN, sidebar registry, etc.). At AccentOS today, k ≈ 4, so merge burden is roughly linear with a steep slope.

---

## 6. Relay burden

Relay burden = the cost of handing context from one session to the next, *across the same surface*. Distinct from merge: relay is sequential continuation of one task, merge is parallel integration of independent tasks.

Sources of relay cost:

- **WIP doc fidelity.** If WIP captures only "we were debugging the Worker proxy" but not "commit `2dca2a6` is pushed but not redeployed," the next session re-discovers that fact at the cost of 5–10k tokens of investigation.
- **Cross-device drift.** Codespace state (dev server, terminal sessions, uncommitted scratch) doesn't survive into iOS sessions. Anything not committed is lost.
- **Tool-output rot.** Tool results get truncated or compacted between sessions. The new session re-runs the same `git status` / `cat MASTER.md` it could have inherited.

Quantitatively, a clean relay (well-written WIP + everything committed) costs ~3–5k tokens of warm-up. A dirty relay (vague WIP, uncommitted work, stale BUILD_PLAN) costs 15–30k tokens *and* risks rebuilding something that already shipped.

---

## 7. Context reconstruction cost

Each fresh session must reconstruct:

| Layer | Token cost (approx) | Recoverable from |
|---|---|---|
| Repo geography | 4–6k | `ls`, `MASTER.md` |
| Active build state | 5–8k | `BUILD_PLAN_CLAUDE.md`, `WORK_IN_PROGRESS.md` |
| Lessons / gotchas | 6–10k | `BUILD_INTELLIGENCE.md` |
| Skill registry | ~3k | `skills/_index.md` |
| Vibe-speak calibration | 2–4k | `skills/vibe-speak/profiles/*` + observation log |
| Open loops / blockers | 2–3k | `MASTER.md` §13 |
| **Total per cold start** | **~22–34k tokens** | |

This is *fixed per session* and *un-amortizable across sessions* under the current architecture (no shared session memory, no warm pool). Running 4 sessions/day = ~120k tokens/day spent purely on context reconstruction before any feature work begins.

If a session ships fewer than ~3 commits, **context reconstruction cost exceeds the value of the session.** This is the most under-recognized cost in the system.

---

## 8. Supervision tax

Captain (Michael) is the only entity that can:

- Approve work that touches money, vendor data, or strategic positioning.
- Resolve cross-branch semantic conflicts.
- Refresh WIP and BUILD_PLAN with ground truth.
- Authorize destructive ops.

Each session imposes a fractional supervision load on the Captain — call it `s(N)`. Observed:

```
s(1) ≈ 5%   (ambient acknowledge / approve commits)
s(2) ≈ 12%
s(3) ≈ 25%
s(4) ≈ 45%
s(5) ≈ 70%
s(6+) ≈ saturates Captain — system halts
```

The supervision tax compounds with the **autonomy paradox**: the more autonomous each session is allowed to be (per OPERATING RULES "dangerouslySkipPermissions: always on"), the more downstream cleanup the Captain inherits when a session ships something subtly wrong. Higher autonomy ⇒ higher *peak* supervision events even though *ambient* supervision drops.

---

## 9. Rollback cost

Rollback = unwinding a shipped change that turned out to be wrong. Costs:

- **Detection lag.** With N sessions, a bad change can be buried under 3–5 follow-up commits before anyone notices. Reverting then requires either targeted `git revert` (cheap) or surgical de-application from later commits (expensive, manual).
- **Cross-module damage.** Because `index.html` is one file with shared globals, a bad change in module A often leaves residue in modules B and C that were edited downstream.
- **Schema rollback.** SQL changes via `M##` migrations cannot be cleanly reverted without a paired down-migration. AccentOS does not currently maintain down-migrations, so schema rollback = "write a new migration that reverses the previous." This is not free.
- **User-visible deploy.** Cloudflare Pages auto-deploys ~15s after push. A bad commit is live before review. Rollback wall-clock floor is ~30s, but trust cost is non-zero each time.

**Heuristic cost of rollback:**

| Scope | Cost (Captain-minutes) |
|---|---|
| Single-module JS bug | 5–15 |
| Shared-global bug | 30–90 |
| Schema regression | 60–240 |
| Cross-branch semantic | 120–unbounded |

Rollback cost is also **asymmetric in time of day.** A bad overnight commit that ships at 02:00 isn't caught until ~08:00, by which point 3 more sessions may have built on top of it. The expected rollback cost of overnight work is therefore 2–4× the same work done during waking hours.

---

## 10. Composite cost equation

Total session economic cost:

```
Cost(N, t) =  N × Boot
            + N × t × Build
            + Coord(N) × t
            + Merge(N)
            + Supervise(N) × t
            + E[Rollback](N, t)
```

Total economic value:

```
Value(N, t) = ShippedChanges(N, t) × ValuePerChange × (1 − E(N))
```

Net = Value − Cost. The maximum of (Net) across N is the **economic operating point**, which is empirically **N = 2 to 3** for AccentOS as it stands today, with the bias toward 2 when supervision is reduced (overnight, Captain on phone, etc.).

---

## 11. What lowers the operating point (makes parallelism cheaper)

In rough order of leverage:

1. **Split `index.html` past the 900KB hard limit.** Current 76% utilization makes every parallel session compete for the same byte range. Splitting reduces collision surface dramatically.
2. **Move WIP from a single file to a directory of session-scoped WIPs** (`WORK_IN_PROGRESS/<session-id>.md`) with an aggregator. Eliminates clobber risk.
3. **Maintain down-migrations** for every SQL change. Cuts schema rollback cost by ~5×.
4. **Pre-claim BUILD_PLAN items** with a session-stake field. Prevents two sessions starting the same task.
5. **Promote skill discovery (Step 23)** so sessions hit warm paths instead of brute-forcing.
6. **Batch supervision windows** so Captain reviews 3–5 ships at once instead of context-switching per commit.

None of these are implemented in this analysis pass; they are what would shift the curves above. (Out of scope per "documentation only.")

---

## 12. Estimated current effective orchestration efficiency

Define efficiency = `(net useful shipped changes) / (sessions × hours × tokens consumed)`, normalized so that "perfectly serial 1-session work with no waste" = 1.0.

Best estimate, as of 2026-05-10:

- **Effective orchestration efficiency ≈ 0.55 – 0.65.**
- Most loss is in **§7 context reconstruction** and **§4 boot-cost amplification.** Together they account for ~25–30% of total token spend.
- ~10% loss is **§9 rollback** (mostly cross-branch semantic, which is small in count but expensive per incident).
- ~5–10% loss is **§5 merge burden** specifically attributable to the monolithic `index.html`.

Translation: roughly **35–45 cents of every dollar of token spend is paid to coordination, not feature work.** Lower-bound for a well-structured solo session is closer to ~15%.

---

## 13. Estimated safe overnight concurrency ceiling

Overnight = unsupervised, Captain unavailable for ≥6h, no live merge arbitration.

Constraints stack:

- E(N) at N=4 is ~0.35 → on a 6h overnight run, ~35% of shipped changes will need reconciliation in the morning. Past N=4, this exceeds Captain's morning bandwidth.
- Supervision tax `s(N)` accumulates as backlog (no ambient approval), so the *morning bill* is N × 6h × s(N).
- Rollback cost asymmetry (§9) multiplies expected damage 2–4×.

**Safe overnight ceiling ≈ N = 2.** Acceptable up to N = 3 only if:

- Each session is on an isolated branch.
- Each session is restricted to one module file (no `index.html` edits, no shared globals).
- WIP doc is per-session.
- No SQL migrations.

At N = 4 overnight, the morning Captain-cost typically exceeds the overnight build value. Do not exceed 3.

---

## 14. Single most expensive hidden entropy source

**The monolithic `index.html` plus the global `USERS / VENDORS / INVENTORY / etc.` namespace.**

Why it's the top source:

- Every parallel session that does anything user-facing collides here.
- Surgical `str_replace` patches assume stable line context, which is broken by every other session's writes.
- Shared globals create *semantic* conflicts that pass tests and lint, then explode in production (BUILD_INTELLIGENCE.md already documents one: removing `USERS{}` left a stale reference in Settings card).
- It is **invisible** to per-session economics — each session looks productive in isolation. The cost surfaces only at merge / runtime, which is when it is most expensive.
- It is the pivot through which all other entropy sources amplify: a clean `js/feature.js` change is cheap; the same change touching `index.html` to wire it up is where collisions and rollbacks live.

Every other entropy source (WIP contention, BUILD_PLAN race, schema rollback) is *bounded*. This one is *unbounded* — its cost grows as the file grows and as N grows simultaneously, and it's already at 76% of a hard limit that, when crossed, will force a refactor under duress instead of by design.

---

## 15. DONE / KNOWN / NEXT

**DONE**
- Modeled throughput, entropy, and scaling curves against observed N=1..6 behavior.
- Quantified coordination, merge, relay, context-reconstruction, supervision, and rollback costs.
- Estimated effective orchestration efficiency at **0.55–0.65**.
- Estimated safe overnight concurrency ceiling at **N=2 (3 with strict guardrails)**.
- Identified **monolithic `index.html` + shared globals** as the single most expensive hidden entropy source.

**KNOWN**
- Numbers are calibrated estimates, not measurements. Real telemetry would refine α and the C(N) coefficient.
- This model assumes Claude as the only worker. ChatGPT Pro as secondary changes the curves but is not modeled here (separate doc warranted if usage grows).
- Skill-routing (`vibe-speak` Step 23) likely lowers the operating point by 1–2× in waste, but the effect is not yet measured in `efficiency-log.md`.
- The model treats `index.html` as a static topology. The real system will hit the 900KB hard limit and force a split; the curves shift discontinuously when that happens.

**NEXT**
- Companion doc: `PARALLELISM_SAFETY_THRESHOLDS.md` — operationalizes §3 and §13 into hard rules.
- Companion doc: `TOKEN_TO_OUTPUT_EFFICIENCY.md` — drills §7 and §10 into per-pattern ROI.
- Eventually: instrument `efficiency-monitor` to emit α, C(N), and E(N) so the model becomes empirical instead of inferred.
- Revisit after the inevitable `index.html` split — most numbers above will improve sharply.
