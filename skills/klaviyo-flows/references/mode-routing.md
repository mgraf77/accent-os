# Mode Routing — klaviyo-flows
> Dispatch table for the three klaviyo-flows modes. Read at Step 0; consulted at Step 1.

The `klaviyo-flows` skill has three mutually exclusive modes per run. This file defines how to map Michael's natural-language phrasing to a mode, and the threshold + parameter defaults per mode.

---

## Mode dispatch

| Mode | Phrases trigger | Output |
|------|-----------------|--------|
| **A — audit** | "audit", "scan", "rank", "leaderboard", "which flows suck", "underperforming flows", "klaviyo report", "/klaviyo audit" | Ranked leaderboard + underperformer flags + top-3 to daily brief |
| **B — propose** | "propose edits for [flow]", "fix [flow]", "draft new subject lines for [flow]", "what should I change about [flow]", "/klaviyo propose [flow]" | Paste-ready edit proposals (subject A/B + segment + send-time) for one named flow |
| **C — engagement** | "engagement", "list growth", "last N days", "klaviyo churn overlap", "who's drifting in our flows", "/klaviyo engagement" | Engagement summary + churn-predictor overlap |

If two modes match, prefer:
- B over A (more specific — Michael named a flow)
- A over C (audit is the most common request)

If no mode matches, default to A.

---

## Mode A defaults

- Window: 30 days (override `--days N`)
- Top-N flags: all underperformers (no cap)
- Daily brief feed: top 3 underperformers, write to `skills/daily-brief-composer/inbox/klaviyo-top3-underperformers.md` (overwrite)
- Snapshot: `klaviyo-flows-audit-YYYY-MM-DD.md`
- Action queue: one PROPOSED row per underperformer ("audit flow [name] for revival")

## Mode B defaults

- Required arg: flow name or flow_id
- Output blocks: 3 categories (subject A/B + segment + send-time), 1–N edits per category
- Subject A/B: exactly 3 alternates per low-open message
- Snapshot: `klaviyo-flows-propose-YYYY-MM-DD-[flowname].md`
- Action queue: one PROPOSED row per edit ("apply paste-ready edit to [flow] [field]")

## Mode C defaults

- Window: 30 days (override "last 7 days", "last 90 days")
- Churn source: `skills/analysis-snapshot/runs/churn-predictor-*.md` — most recent file
- Top-N churn customers to overlap: 50 (override via `--top N`)
- Snapshot: `klaviyo-flows-engagement-YYYY-MM-DD.md`
- Action queue: one PROPOSED row per non-no-action overlap row

---

## Thresholds (shared across modes)

**Underperformer triggers (Mode A):**
- `open_rate < 0.15`
- `click_rate < 0.02`
- `revenue_per_send < cohort_median`

**Minimum data gates (Mode A):**
- Window ≥ 30 days
- Recipients ≥ 500

**Send-time delta gate (Mode B):**
- Only propose if `delta ≥ 3pp` between current and proposed window open rates.

**Subject-line spam gate (Mode B):**
- Only propose alternates if current spam score `≥ 5/10` OR open rate `< 0.15`.

**Churn-overlap recommendation (Mode C):**
- SUPPRESS if profile is unsubscribed OR `customers.do_not_contact = true`
- EXIT-FLOW if reason code in {`BIG_SPENDER_GONE_QUIET`, `RECENCY_DROP_TRADE`} AND active in win-back flow
- URGENT-PERSONAL if reason code = `TRIPLE_DROP`
- no-action otherwise

---

## Mode-conflict examples

| Michael says | Mode picked | Why |
|---|---|---|
| "audit klaviyo" | A | "audit" + no flow name |
| "audit klaviyo flows and propose fixes" | A then B | Two-pass: A first, then B for each underperformer (B requires explicit flow name; if none given, queue as `klaviyo-flows.propose` PROPOSED rows for action-queue review) |
| "fix the abandoned cart flow" | B | Flow name present, "fix" verb |
| "klaviyo last 30 days" | C | "last N days" → engagement |
| "klaviyo churn overlap" | C | "churn overlap" is the C-specific phrase |
| "show me klaviyo" | A | Default — most common interpretation |
