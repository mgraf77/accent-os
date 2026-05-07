# Klaviyo Reports — Pre-defined Report Shapes
> Reference for klaviyo-flows skill. Each section is a report shape the skill emits. Read top to bottom — do not skip sections.

This file defines the four report shapes the `klaviyo-flows` skill produces against the Accent Lighting Klaviyo account, plus the threshold and weighting rules each report uses.

---

## §1 — Flow performance leaderboard (Mode A — audit)

**Purpose:** Rank every live flow by revenue-per-send so Michael sees which flows pay rent and which are dead weight.

**Window:** rolling 30 days (override via `--days N` arg).

**Query path:**
1. `GET /api/flows/?filter=equals(status,"live")` → list of flow_id, name, trigger_type.
2. For each flow, `POST /api/flow-action-metrics-aggregate-queries/` with statistic IDs for: `opens_unique`, `clicks_unique`, `recipients`, `delivered`, `placed_order`, `placed_order_value`. Group by flow_id.

**Computed columns:**
- `open_rate = opens_unique / delivered`
- `click_rate = clicks_unique / delivered`
- `conv_rate = placed_order / delivered`
- `revenue_per_send = placed_order_value / delivered`
- `cohort_median_rps = median(revenue_per_send)` across all flows

**Underperformer flags** (any one fires):
- `open_rate < 0.15`
- `click_rate < 0.02`
- `revenue_per_send < cohort_median_rps`

**Multi-flag severity:**
- 1 flag fires → `UNDERPERFORM`
- 2 flags fire → `UNDERPERFORM (double-flag)`
- 3 flags fire → `UNDERPERFORM (triple-flag)` — top priority

**Minimum data gates** (don't flag if either fails):
- Window ≥ 30 days
- Recipients ≥ 500 in window

**Output table (sort by `revenue_per_send` desc):**

```
Rank | Flow | Recipients | Open % | Click % | Conv % | Rev/send | Status
```

**Top-3 underperformers** also written to `skills/daily-brief-composer/inbox/klaviyo-top3-underperformers.md` (overwrite).

---

## §2 — List growth and churn (Mode C — engagement)

**Purpose:** Track Accent Lighting Klaviyo list health over a window.

**Window:** default 30 days; override via "last 7 days", "last 90 days".

**Query path:**
1. `GET /api/profiles/?filter=greater-than(created,YYYY-MM-DD)` (paginate) → new profiles in window.
2. Klaviyo unsubscribe list export OR `GET /api/profiles/?filter=...subscriptions.email.marketing.consent="UNSUBSCRIBED"` filtered by `last_event_date` in window.
3. `GET /api/profiles/?filter=equals(subscriptions.email.marketing.consent,"SUBSCRIBED")` total at window start (use cache table `klaviyo_profile_history` if available; else estimate from current minus net change).

**Computed:**
- `new_count`
- `unsub_count`
- `net_change = new_count - unsub_count`
- `growth_rate_pct = net_change / starting_count`

**Output:**
```
List growth (last [N]d):  +[new] new  /  −[unsub] unsubs  =  net [+/-net]  ([growth_rate_pct]%)
```

---

## §3 — Abandoned-cart flow recovery rate

**Purpose:** Measure Accent Lighting's abandoned-cart flow against an internal baseline.

**Required flow:** any flow whose name matches ILIKE `%cart%` AND `trigger_type = "metric"` with metric "Started Checkout" or "Added to Cart".

**Computed:**
- `cart_recovered_count = placed_order` from the flow within 7 days of trigger
- `cart_total_count = recipients` of the cart flow in window
- `recovery_rate = cart_recovered_count / cart_total_count`
- `recovery_revenue = placed_order_value`
- `revenue_per_recovered = recovery_revenue / cart_recovered_count`

**Internal benchmarks (from BC store store-cwqiwcjxes baseline):**
- recovery_rate < 8% → underperforming
- recovery_rate 8–15% → acceptable
- recovery_rate > 15% → strong (rare in lighting retail)

**Always include in Mode A output if a cart flow exists** — call it out in a sub-section even if it's not bottom-ranked.

---

## §4 — Post-purchase flow LTV impact

**Purpose:** Measure whether the post-purchase flow is driving second-order LTV (the entire reason a post-purchase flow exists).

**Required flow:** any flow whose name matches ILIKE `%post-purchase%` OR `%after order%`.

**Query path:**
1. Pull flow recipient list from Klaviyo (last 90 days).
2. Cross-join against BC `store-cwqiwcjxes` orders to identify which recipients placed a second order within 60 days of the first order.

**Computed:**
- `second_order_rate_with_flow = (recipients_with_2nd_order / total_recipients)`
- `second_order_rate_without_flow` (control: customers who placed a first order before the post-purchase flow existed, OR customers who unsubscribed before the flow could send) — if no clean control exists, surface "control unavailable; report rate without comparison".
- `ltv_lift = avg_2nd_order_value_with_flow - avg_2nd_order_value_without_flow` (only if control available)

**Format the row in the leaderboard with an extra column:** `2nd-order rate: [X]%`.

---

## §5 — Subject-line A/B candidate output (Mode B)

For each subject-line proposal, output:

```
EDIT [N] — Subject Line — Message #[M] in flow "[flow name]"
  current:    "[current subject]"
  spam-score: [0–10]/10  (flagged: [list flagged words])
  candidate A: "[alt 1]"        (spam: [0–10]/10  — [rationale])
  candidate B: "[alt 2]"        (spam: [0–10]/10  — [rationale])
  candidate C: "[alt 3]"        (spam: [0–10]/10  — [rationale])
```

Spam-scoring rules in `subject-line-rules.md`.

Three candidates is the contract — not two, not four. Three forces a real choice while keeping the paste-ready block scannable.

---

## §6 — Segment refinement output (Mode B)

```
EDIT [N] — Segment Filter — Trigger
  current:  "[current filter expression]"
  proposed: [proposed split / refinement]
  rationale: [why — cite Supabase customers.segment counts or churn-predictor overlap %]
```

Common refinements:
- Split single-branch flow into Trade vs Consumer branches when `customers.segment` distribution shows ≥20% Trade.
- Add `lifetime_value > $5K` filter to win-back flow when revenue-per-send for the high-LTV cohort is ≥3× the low-LTV cohort.
- Exclude `customers.do_not_contact = true` (sanity check — should already be there, flag if missing).

---

## §7 — Send-time refinement output (Mode B)

```
EDIT [N] — Send-time — Action #[N] delay / time-window
  current:  "[current setting — e.g. '1 hour after trigger' or 'send between 10am and 6pm']"
  proposed: "[proposed setting]"
  rationale: open rate by hour-of-day:
    [paste table: hour | recipients | open_rate]
  current window open rate: [X]%
  proposed window open rate: [Y]%   (delta: [+/-Z]pp)
```

Only propose if delta ≥ 3pp. Below that, noise dominates.

---

## §8 — Churn-overlap output (Mode C)

```
Churn-overlap (top-[N] churn risks from churn-predictor vs Klaviyo profiles):
  matched: [M] / [N]
  recommend SUPPRESS: [count]      (reason: already unsubscribed in Klaviyo OR do_not_contact in Supabase)
  recommend EXIT-FLOW: [count]     (reason: still receiving win-back flow but flagged BIG_SPENDER_GONE_QUIET — flow is too generic for this tier)
  recommend URGENT-PERSONAL: [count] (reason: TRIPLE_DROP from churn-predictor — route to email-drafter)
  no-action: [count]
```

Then table:
```
Churn customer | Reason code | Active flows | Recommended action
```

URGENT-PERSONAL routes to `email-drafter` via `action-queue` PROPOSED rows.
EXIT-FLOW routes to a Mode B proposal targeting the offending flow's segment filter.
SUPPRESS adds a one-time-paste action: "exclude profile [email] from flow [name]" (Michael applies in Klaviyo UI).
