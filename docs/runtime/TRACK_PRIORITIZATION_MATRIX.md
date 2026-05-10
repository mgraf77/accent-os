# TRACK PRIORITIZATION MATRIX

> **Synthesis substrate:** the eight prior `docs/runtime/` analyses + the BUILD_PLAN_CLAUDE.md track inventory + the M-task blocker map.
> **Scope:** A scoring model for future BUILD_PLAN track sections (Track 5 remaining + all of Track 6) so the next round of execution can be *prepared* in the right order — without increasing entropy and without committing to implementation.
> **Frame:** Analysis-only. No code, no index.html edits, no governance changes, no Phase B start, no worker-count change. This document scores tracks; it does not build them.
> **Last updated:** 2026-05-10

---

## 0. Why a track-prioritization matrix exists

The unfinished BUILD_PLAN sections are not equivalent. Some are blocked on Captain credentials (M-tasks); some are blocked on architectural prerequisites; some are net-entropy-positive even when unblocked; one is structurally unbuildable today. Picking the next track to *prepare* (not build) is itself a leverage decision.

This matrix produces a defensible ordering — so the operator does not have to re-derive priority every time a blocker clears.

The scoring criteria are the user-supplied ten, defined precisely in §1 and weighted in §2.

---

## 1. Scoring definitions

Each criterion scored 1–5 (low–high), with explicit definitions so the score is reproducible across sessions.

### 1.1 Execution leverage

How much shipped value the track unlocks per unit of build effort. Revenue-tied features score high; cosmetic-only features score low. Read against the Accent Lighting business actuals (~$18.5K rev YTD on 1.25M visits — anything that moves conversion or AOV scores high; anything purely internal-ops scores medium).

| Score | Meaning |
|---|---|
| 5 | Direct revenue or margin impact within 30 days of ship |
| 4 | Indirect revenue impact, or large internal-time saving |
| 3 | Operational quality-of-life improvement, no revenue tie |
| 2 | Cosmetic / nice-to-have |
| 1 | No discernible per-track value vs. status quo |

### 1.2 Entropy reduction

Net effect on the system's entropy accumulation rate. *Negative* scores allowed conceptually but mapped to 1 in the 1–5 scale; tracks that *add* entropy reservoirs (new external integrations, new out-of-band state) score 1–2.

| Score | Meaning |
|---|---|
| 5 | Reduces entropy (e.g., consolidates fragmented patterns) |
| 4 | Net-neutral with a containment side-effect |
| 3 | Net-neutral |
| 2 | Adds a small bounded entropy reservoir |
| 1 | Adds a large or unbounded entropy reservoir (typical of external integrations without verification substrate) |

### 1.3 Risk reduction

How much the track shrinks the worst-case failure mode. Includes things like adding a feature that catches mistakes earlier (alerts, warranty), adding observability over a process Captain currently does manually (deal optimizer), or adding a guard against a compliance/operational gap.

| Score | Meaning |
|---|---|
| 5 | Closes a critical gap (data loss, compliance, customer-facing failure) |
| 4 | Closes a meaningful gap (missed deadlines, missed revenue) |
| 3 | Adds a soft safety net |
| 2 | Marginal risk surface change |
| 1 | Adds new risk (e.g., new external dependency without rollback path) |

### 1.4 Dependency clearing

Whether shipping this track unblocks other tracks. Tracks that are themselves blocked but, when shipped, unblock several downstream tracks score high.

| Score | Meaning |
|---|---|
| 5 | Unblocks 3+ downstream tracks |
| 4 | Unblocks 1–2 downstream tracks |
| 3 | Unblocks no tracks but enables non-track work |
| 2 | Standalone — no upstream/downstream effect |
| 1 | Adds new blockers (e.g., requires schema that constrains future tracks) |

### 1.5 Future optionality

How many downstream architectural moves the track keeps open. Tracks that lock in a particular pattern score lower; tracks that leave room for the post-decomposition system score higher.

| Score | Meaning |
|---|---|
| 5 | Opens new option space (e.g., new schema enables several future analyses) |
| 4 | Compatible with all known future architectures |
| 3 | Compatible with most future architectures; minor commitments |
| 2 | Commits the system to a specific external integration shape |
| 1 | Closes future options (e.g., locks in a vendor relationship that constrains alternatives) |

### 1.6 Rollback simplicity

How cheaply the track can be reverted if it ships wrong. `js/<feature>.js` modules that don't add schema score high. Schema migrations without paired downs score low. External integrations that mutate third-party state (BigCommerce orders, GMC products) score very low.

| Score | Meaning |
|---|---|
| 5 | Pure-compute layer over existing data; revert = `git revert` |
| 4 | Module file + idempotent schema with paired down |
| 3 | Module file + schema without down (current default) |
| 2 | Touches index.html or shared globals + schema |
| 1 | Mutates external third-party state; no clean revert |

### 1.7 Verification clarity

How obvious it is that the track shipped correctly. Features with verifiable numbers (revenue, counts, dates) score high. Features whose correctness depends on subjective tone or Captain judgment score lower.

| Score | Meaning |
|---|---|
| 5 | Numeric, automatically verifiable (counts, sums, dates match a known source) |
| 4 | UI-visible, easily verified by Captain in <2 min |
| 3 | UI-visible, requires Captain to know what to look for |
| 2 | Correctness depends on subjective judgment |
| 1 | Correctness verifiable only over weeks of usage |

### 1.8 Michael relay reduction

Per `OPERATOR_BANDWIDTH_LIMITS.md`, Captain time is the bottleneck. Tracks that automate or remove Captain effort (alerts, decision engine, demand forecast) score high. Tracks that *increase* Captain decision load (new manual workflows) score low.

| Score | Meaning |
|---|---|
| 5 | Removes a recurring Captain task entirely |
| 4 | Reduces Captain effort on a recurring task by ≥50% |
| 3 | Modest Captain time saving |
| 2 | Roughly neutral |
| 1 | Adds Captain decision load (e.g., new dashboards to monitor) |

### 1.9 Branch collision risk

How much BE the track adds when built. Tracks confined to a new `js/<feature>.js` file score high. Tracks that touch index.html significantly, or that mutate shared globals, score low. Per `ENTROPY_ACCUMULATION_MODEL.md` — this is the dominant entropy source today.

| Score | Meaning |
|---|---|
| 5 | New `js/<feature>.js`, ≤5 lines of index.html wire-up |
| 4 | Same as 5 but adds 1 new global or schema table |
| 3 | Touches index.html in ≥2 places or mutates 1 existing global |
| 2 | Significant index.html edits or multiple global mutations |
| 1 | Cross-cutting changes that touch index.html, multiple modules, and globals |

### 1.10 Merge urgency

Treated *carefully*: high merge urgency is often political/external pressure rather than economic value. Tracks the operator wants done "now" purely for momentum reasons score low here. Tracks tied to time-bounded external opportunities (vendor deadline, season) score appropriately high.

| Score | Meaning |
|---|---|
| 5 | Time-bounded external opportunity (vendor deadline, season) |
| 4 | Customer-facing fix on a known active issue |
| 3 | Internal momentum driver (multiple teams waiting) |
| 2 | Generic backlog priority |
| 1 | "Feels urgent" but no time bound |

---

## 2. Weight assumptions

The 10 criteria are not equally important. Weights derived from the prior eight `docs/runtime/` analyses, especially `ARCHITECTURAL_PRIORITIZATION_MODEL.md` and `OPERATOR_BANDWIDTH_LIMITS.md`.

| Criterion | Weight | Rationale |
|---|---|---|
| Branch collision risk | **2.0** | Architecture-before-scale: minimizing BE is the dominant near-term concern |
| Michael relay reduction | **1.8** | Captain bandwidth is the binding constraint |
| Entropy reduction | **1.6** | Compounds; small gains pay back over months |
| Execution leverage | **1.5** | Real value, but tempered by the others |
| Rollback simplicity | **1.4** | Bad ships are far cheaper if rollback is cheap |
| Risk reduction | **1.3** | Addresses worst-case modes |
| Verification clarity | **1.2** | Cleaner verification → lower supervision tax |
| Dependency clearing | **1.0** | Useful but situational; high-clearance tracks may still be net-negative |
| Future optionality | **1.0** | Long-horizon; weighted modestly because the curves shift after decomposition |
| Merge urgency | **0.5** | Deliberately downweighted: urgency is the dimension most often overstated |

Total weight: **13.3.** Maximum possible score per track: 13.3 × 5 = **66.5.**

---

## 3. Candidate inventory

Unfinished BUILD_PLAN items as of 2026-05-10. Source: `BUILD_PLAN_CLAUDE.md` Track 5 + Track 6. Excluded: items already shipped (✅), and architecture work which is scored separately in `ARCHITECTURAL_PRIORITIZATION_MODEL.md` (the "Phase 1" foundation move).

| ID | Title | Blocker | Notes |
|---|---|---|---|
| 5.13 | E-Commerce Command Center | M04 (BC API key) + M05 (GMC API access) | Aggregates ecom performance |
| 6.1 | GA4 integration | M06 (GA4 service account) | Read-only analytics |
| 6.2 | Google Search Console integration | M06 | Read-only SEO data |
| 6.3 | BigCommerce REST integration | M04 | Read/write product + order data |
| 6.4 | Klaviyo integration | M09 (Klaviyo API key) | Customer messaging |
| 6.5 | Trade & Designer Portal | None listed (architectural) | External-facing |
| 6.6 | Vendor Rep Portal | None listed (architectural) | External-facing |
| 6.10 | AccentOS → accentlightinginc.com embed | Architectural | Loader / iframe surface |
| 6.11 | Windward ERP Live Integration | M03 (Windward written confirmation) + M10 (Curtis outreach) | Real sales-line history; sharpens 6.9 |
| 6.12 | Google Ads / Meta Ads | No API access (per MASTER §10) | Manual admin only — currently unbuildable |

Ten candidates. The matrix scores all ten.

---

## 4. Scoring table

Scores are calibrated qualitative; the same operator scoring the same tracks twice would land within ±0.5 per criterion. The total is the weighted sum.

| Track | Lev | EntR | RiskR | DepC | Opt | Roll | Ver | Relay | Coll | Urg | **Total** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | (1.5) | (1.6) | (1.3) | (1.0) | (1.0) | (1.4) | (1.2) | (1.8) | (2.0) | (0.5) | / 66.5 |
| 5.13 E-Commerce Command Center | 5 | 2 | 4 | 4 | 3 | 3 | 5 | 4 | 3 | 4 | **45.6** |
| 6.1 GA4 integration | 3 | 2 | 3 | 3 | 4 | 3 | 4 | 3 | 4 | 2 | **38.5** |
| 6.2 GSC integration | 3 | 2 | 3 | 2 | 4 | 3 | 4 | 3 | 4 | 2 | **37.5** |
| 6.3 BigCommerce REST | 4 | 2 | 3 | 5 | 3 | 2 | 4 | 4 | 3 | 3 | **41.5** |
| 6.4 Klaviyo integration | 3 | 1 | 3 | 2 | 3 | 2 | 3 | 3 | 3 | 2 | **31.7** |
| 6.5 Trade & Designer Portal | 4 | 1 | 2 | 3 | 4 | 2 | 3 | 3 | 1 | 2 | **30.7** |
| 6.6 Vendor Rep Portal | 4 | 1 | 2 | 3 | 4 | 2 | 3 | 4 | 1 | 2 | **32.5** |
| 6.10 AccentOS embed (public site) | 3 | 1 | 2 | 4 | 5 | 2 | 3 | 3 | 1 | 2 | **30.6** |
| 6.11 Windward ERP Live | 5 | 2 | 4 | 5 | 4 | 2 | 5 | 5 | 3 | 2 | **49.6** |
| 6.12 Google Ads / Meta Ads | 4 | 1 | 2 | 1 | 2 | 1 | 2 | 1 | 2 | 1 | **22.0** |

Reading notes:

- **6.11 Windward ERP Live** scores highest because it removes a major Captain-relay (manual sales-line review), is verifiable against actual sales numbers, and has high downstream optionality (sharpens 6.9 demand forecast, enables future Phase 2 ERP-driven analyses).
- **5.13 E-Commerce Command Center** scores second because it's the highest-leverage revenue-impact item, with reasonable rollback (read-only aggregation) and high verification clarity (revenue numbers don't lie).
- **6.3 BigCommerce REST** scores third because of dependency clearing — it unblocks 5.13 and is a prerequisite for several other ecom moves.
- **6.4 Klaviyo, 6.5 Trade Portal, 6.6 Rep Portal, 6.10 embed** cluster at the bottom because they introduce new entropy reservoirs (external state, public-facing surfaces) without first having the runtime substrate to verify them.
- **6.12 Google Ads / Meta Ads** scores lowest because it is structurally unbuildable today (no API access). Its score reflects the unbuildability — it should not enter a build queue.

---

## 5. Recommended top 10 (ranked)

Out of 10 candidates, all 10 rank. The ranking is the matrix output sorted by total score:

| Rank | Track | Score | Status |
|---|---|---|---|
| 1 | **6.11 Windward ERP Live** | 49.6 | Blocked on M03 + M10 |
| 2 | **5.13 E-Commerce Command Center** | 45.6 | Blocked on M04 + M05 |
| 3 | **6.3 BigCommerce REST** | 41.5 | Blocked on M04 |
| 4 | **6.1 GA4 integration** | 38.5 | Blocked on M06 |
| 5 | **6.2 GSC integration** | 37.5 | Blocked on M06 |
| 6 | **6.6 Vendor Rep Portal** | 32.5 | Architectural prerequisite (loader boundaries) |
| 7 | **6.4 Klaviyo integration** | 31.7 | Blocked on M09 |
| 8 | **6.5 Trade & Designer Portal** | 30.7 | Architectural prerequisite |
| 9 | **6.10 AccentOS embed** | 30.6 | Architectural prerequisite |
| 10 | **6.12 Google Ads / Meta Ads** | 22.0 | Forbidden — no API path |

Important caveats applied to this ranking before it becomes operational guidance:

- **All ten are currently blocked.** None can be *built* today. The ranking is for *preparation* order — which to scope, which to draft schema for, which to write a SKILL or test plan for, in anticipation of unblocking.
- **The architecture work (Phase 1 from `ARCHITECTURAL_PRIORITIZATION_MODEL.md`) outranks every item in this list** for the *next architectural move*. This list ranks among the *track-section preparation* options only. If forced to choose between Phase 1 work and any item here, Phase 1 wins.
- **Items 6–10 share an architectural prerequisite** — they are external-facing surfaces or new external integrations that would be far cheaper to build after loader boundaries (Phase 1) and runtime substrate (Phase 2) land. Preparing them now is fine; building them now is anti-leverage.

---

## 6. How to use this matrix

The matrix supports three operator decisions:

1. **"Which blocker should Captain clear next?"** Answer by reading the M-tasks attached to the top-ranked unblocked items. Today: M03 + M10 (clears 6.11) and M04 + M05 (clears 5.13 and 6.3). Either set has high payoff.
2. **"Which track should I scope next, in advance of the blocker clearing?"** Answer: top of ranking. Today: 6.11 Windward ERP Live, then 5.13 E-Commerce Command Center.
3. **"Which tracks should I leave alone for now?"** Answer: items 6–10 (architectural prerequisite) and 10 (forbidden). Don't even spend scoping cycles on these until Phase 1 is real.

The matrix is not a build queue (`TRACK_BUILD_QUEUE_V1.md` is). It is the *ranking input* to the queue.

---

## 7. Sensitivity notes

If the weights shift, the ranking shifts. A few sanity checks:

- **If "merge urgency" weight rose to 1.5** (treating urgency as legitimate), 5.13 would move slightly closer to 6.11 but ordering wouldn't change. Urgency is the most overstated dimension; downweighting it is a deliberate choice.
- **If "entropy reduction" weight rose to 2.0**, the bottom four items (6.4, 6.5, 6.6, 6.10) would slip further behind because they are the largest entropy adders.
- **If "execution leverage" weight rose to 2.0** (revenue-first framing), 5.13 would move into a near-tie with 6.11 — both remain top-2.

The top 3 (6.11, 5.13, 6.3) are robust across reasonable weight perturbations. The middle and bottom of the table are more sensitive but those tiers are deferred regardless of exact ordering.

---

## 8. DONE / KNOWN / NEXT

**DONE**
- Defined ten scoring criteria with explicit 1–5 bands.
- Stated weight assumptions with rationale tied to prior `docs/runtime/` analyses.
- Scored all ten unfinished BUILD_PLAN tracks.
- Produced ranked top-10.
- Articulated three operator decisions the matrix supports.

**KNOWN**
- Scores are calibrated qualitative, not telemetry.
- The matrix excludes architectural work — that competes in a different lane (`ARCHITECTURAL_PRIORITIZATION_MODEL.md`). Treat the architecture as always outranking any item here when both are options.
- All ten candidates are blocked today; the matrix orders *preparation*, not *execution*.
- Track 6.12 (Google Ads / Meta Ads) is structurally unbuildable per MASTER §10; its low score reflects this and it should never enter a build queue.

**NEXT**
- `TRACK_READINESS_SCORE.md` defines the readiness levels each candidate sits at.
- `TRACK_BUILD_QUEUE_V1.md` translates the ranking into a bounded queue with near/middle/far/deferred/forbidden buckets.
