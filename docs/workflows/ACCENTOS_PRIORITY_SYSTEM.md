# AccentOS — Priority System

**Mode:** Workflow systems design (no implementation)
**Anchors:** workflows doc, event/handoff schema
**Purpose:** Define one centrally-computed `priority_score` so the shell and every dashboard orbit a single ranking — not five disconnected urgency systems.

---

## 0. Core philosophy

1. **One score, system-wide.** Every actionable subject (lead, opportunity, quote, PO, job, ticket, suggestion) carries one `priority_score` (0–100) and one band (`G/Y/R`).
2. **Computed, not declared.** Humans don't set priority; they set inputs (deadlines, customer tier). The system derives the score.
3. **Explainable.** Every score has a "why" — the contributing factors are inspectable. If you can't explain a red, the score is broken.
4. **Stable under noise.** Bands change only when a meaningful threshold is crossed; minor input drift doesn't flip G↔R repeatedly.
5. **Aging is a feature.** Items get more urgent as they sit, but at a controlled rate — not "everything is urgent by Friday".
6. **Override is logged, scoped, and time-boxed.** Humans can pin/snooze; the system remembers why and for how long.
7. **Role-aware presentation, role-blind computation.** The score is the same for everyone; *what each role sees ranked first* depends on their queue, not on per-role math.

---

## 1. Urgency vs. importance

Two orthogonal axes that combine into the single score:

- **Importance** — how much this matters if attended to (deal value, customer tier, downstream impact, strategic flag).
- **Urgency** — how much it matters *now* (deadline proximity, age, blocked-downstream flag, vendor risk).

`priority_score = clamp(0..100, weighted_sum(importance_factors) + weighted_sum(urgency_factors) + override_delta)`

- Importance dominates the floor (a $5 ticket never beats a $200k install) but urgency dominates the band (a low-value item with a 2-hour SLA breach still goes red on its own queue).
- Bands are **per-queue** thresholds against the same underlying score, so a "red lead" and a "red PO" share semantics but not absolute scale.

---

## 2. Contributing factors

Each factor has: **input source**, **weight class** (low / medium / high / critical), **decay/aging behavior**.

### 2.1 Time-based

- **Install-date proximity** — critical, nonlinear: ramps hard inside the buffer window, flat outside.
- **SLA clock** — high; band crosses at SLA percentages (e.g. 50% → Y, 90% → R).
- **Stage age** — medium; activates after threshold per stage (a 3-day-old proposal is fine; 7 days isn't).
- **Quote TTL** — medium; ramps as expiry approaches.

### 2.2 Value-based

- **Deal $$ value** — high importance contributor; log-scaled so a $1M job doesn't make every $50k job invisible.
- **Customer tier / lifetime value** — medium importance; configurable tiers.
- **Strategic flag** (referral source, marquee customer) — medium; capped to prevent abuse.

### 2.3 Risk-based

- **Vendor reliability score** — medium urgency contributor on POs; low-reliability vendor → earlier yellow.
- **Stock-risk** — high urgency on jobs/POs that protect upcoming installs.
- **Blocker present** — critical urgency on builds.
- **Margin floor breach** — high importance contributor on quotes (forces review).

### 2.4 Workflow-state risk

- **Stalled-stage flag** — high urgency once detected.
- **Handoff-breach flag** — critical urgency on the originating subject *and* the receiver's queue.
- **Escalation-active flag** — critical, while open.

### 2.5 AI-confidence weighting

- AI-generated subjects (suggestions, drafts, parsed events) carry an `ai_confidence` (0..1).
- **Low confidence does not lower priority** — it raises *human-review* weight. A low-confidence parsed ETA-slip is **more** urgent for review, not less.
- High-confidence reversible AI actions can self-execute; the resulting human-review subject inherits a low priority unless reversed.

### 2.6 Override delta

- Human pins (+15) and snoozes (-bands until time expires) are bounded, logged, and reasoned.
- Pins decay automatically after a configurable horizon — no permanent pinning without re-affirmation.

---

## 3. Aging logic

- Aging adds a small monotonic urgency increment per business unit-of-time.
- Aging is **bounded** — capped per subject so a forgotten item doesn't asymptote red and crowd the board.
- Aging **resets on meaningful activity** (typed events, not "viewed"). A note added counts; opening the page doesn't.
- Aging **pauses** during legitimate waits (`waiting-on-customer`, `waiting-on-vendor`, `snoozed`) and resumes on receive.

---

## 4. Band thresholds and stability

- `G` = score < y_threshold
- `Y` = y_threshold ≤ score < r_threshold
- `R` = score ≥ r_threshold
- **Hysteresis:** crossing G→Y requires +Δ, dropping Y→G requires −Δ−ε. Prevents flicker.
- **Cooldown:** after a band change, ignore further changes for a brief window to avoid storm-on-recompute.
- Per-queue thresholds let "what's red on my desk" stay calibrated even as score scale drifts globally.

---

## 5. Escalation influence

- Bands feed escalation rules but don't *replace* them.
- An `R` that is also `escalation.acknowledged` continues to count as red until resolved (no premature de-escalation).
- The act of opening an escalation slightly lowers the originating subject's urgency contribution from "no-action" while raising the escalator-tier's queue priority. Net effect: red moves from owner's queue to the right tier's queue without disappearing from the system.

---

## 6. Workflow-risk influence

- Subjects on a critical path (current install week, current deposit-to-PO bridge, current punch backlog) get a path-risk multiplier.
- Path-risk is computed by the orchestrator, not declared per dashboard — same input feeds CC and role queues.

---

## 7. Customer-value influence

- Customer tier acts on importance, not urgency. A VIP's stalled lead gets noticed sooner because importance pushes the floor up; the urgency curve is otherwise normal.
- Lifetime value is a slow input — recomputed nightly is fine. Today's score should not depend on whether a nightly job ran.

---

## 8. Override rules

- **Pin** — explicit human boost, capped, time-boxed, requires reason from a small enum + optional note.
- **Snooze** — defer until time/event; emits `priority.recomputed` on wake.
- **Suppress** — only ops/exec can suppress red on a subject, and suppression is itself logged and visible on CC ("3 reds suppressed today" — accountability surface).
- **No silent overrides.** Every override emits an event and shows on the subject's history.

---

## 9. Role-aware prioritization

- The **score is global**; the **lens is per-role**.
- Each role's queue filters by ownership/scope and sorts by score; the score itself does not change per viewer.
- CC sees everything, ranked.
- A rep cannot "make my lead red" by changing scope to themselves — overrides are bounded as in §8.

---

## 10. AI-assist on priority

- `[S]` "Why is this red?" — top contributing factors, ranked.
- `[S]` "What would clear this?" — minimal action that drops it to Y.
- `[D]` Daily briefing draws from the top-N reds with explanations attached.
- `[A]` Recompute on every event; recompute on every input source change (vendor ETA, stock, tier).
- AI **never sets priority directly**. It can change inputs (mark a vendor unreliable after a slip) and the score follows.

---

## 11. What the shell must inherit

1. Every list view sorts by `priority_score` desc by default.
2. Every notification gates on band (Y/R) and quiet rules.
3. Every escalation rule reads the same band the dashboard shows.
4. Every "why is this here?" tooltip shows the top 3 contributing factors.
5. No view computes its own urgency. If a screen needs a different sort, it filters the population, not re-derives the score.

---

## 12. Anti-patterns (do not build these)

- Per-dashboard "urgent" toggles that mean different things on different screens.
- Color codes derived from arbitrary status values rather than score bands.
- Manual "priority" picklists on the entity (low/med/high) without ties to inputs — always degrades to "everything high".
- Silent priority decay without aging cap.
- Hidden overrides.
- Letting AI set priority directly.

---

## 13. What this doc deliberately omits

- Specific weight numbers and thresholds — those belong in an ops-owned config, tunable without architecture changes.
- Storage / recompute mechanics.
- UI styling of bands.
