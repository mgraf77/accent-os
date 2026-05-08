---
name: klaviyo-flows
description: >
  AccentOS integration skill for the Accent Lighting Klaviyo account.
  Reads flow performance (open / click / conversion / revenue per send),
  ranks flows by revenue contribution, flags underperformers, drafts
  proposed flow edits (subject-line A/B candidates, segment refinements,
  send-time changes), and surfaces last-N-day engagement plus churn-risk
  segment overlap with churn-predictor output. Talks to Klaviyo via REST
  API v2024-* using the private key from M09. Use this skill when Michael
  says: "audit klaviyo", "audit the flows", "scan klaviyo", "which klaviyo flows suck",
  "underperforming flows", "klaviyo performance", "klaviyo report", "rank the flows",
  "propose flow edits for [name]", "fix [flow]", "draft new subjects for [flow]",
  "email engagement", "engagement last 30d", "klaviyo churn overlap", "whos drifting
  in our flows", "send to klaviyo", "knock out klaviyo", "/klaviyo audit",
  "/klaviyo propose", or any phrasing that asks for Klaviyo automation-flow
  intelligence on the Accent Lighting store-cwqiwcjxes ecosystem. Do not use for one-off
  1:1 email drafts (use email-drafter) or for the BigCommerce order
  product feed (use bc-business-review). Always produces a ranked
  Markdown report with paste-ready edit proposals and explicit blocked-
  status surfacing — never auto-edits Klaviyo, never invents flow IDs,
  never sends or schedules a send.
---

# klaviyo-flows

**Purpose:** Turn the Accent Lighting Klaviyo flow library from a black box into a ranked, fix-ordered queue — surface the underperformers, propose paste-ready edits, and feed the daily brief and action queue.

Closes: BUILD_PLAN Track 6.4 (Klaviyo integration). Capability ladder: L3 (Diagnose) for `audit` mode + L4 (Draft actions) for `propose` mode.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "audit klaviyo" / "audit the flows" / "audit klaviyo flows" / "scan klaviyo"
- "which klaviyo flows suck" / "underperforming flows" / "flows that suck" / "which flows are bad"
- "klaviyo performance" / "klaviyo report" / "rank the flows" / "klaviyo leaderboard"
- "propose flow edits for [name]" / "fix [flow]" / "draft new subjects for [flow]" / "propose subjects"
- "email engagement" / "engagement last 30d" / "engagement last 7 days" / "klaviyo last 30"
- "klaviyo churn overlap" / "whos drifting in our flows" / "churn vs klaviyo"
- "send to klaviyo" (routes to propose mode for the named flow — never auto-sends)
- "knock out klaviyo" / "knock out the flow audit"
- "/klaviyo audit" / "/klaviyo propose [flow]" / "/klaviyo engagement"

Also trigger when:
- `daily-brief-composer` requests top-3 underperforming flows for the morning brief.
- `action-queue` is opened and a `klaviyo-flows.propose` PROPOSED row is the next item.
- `bc-business-review` asks for revenue attribution by flow over the review window.

If ambiguous between the three modes, default per `references/mode-routing.md`:
- "audit" / "scan" / "rank" → mode A (audit)
- "propose" / "fix" / "draft edits" → mode B (propose)
- "engagement" / "last N days" / "churn overlap" → mode C (engagement)

---

## Step 0 — Preflight (BLOCKED gate — runs FIRST, before any other work)

This skill is gated on **M09 (Klaviyo API key)**. Until it resolves the skill returns the stub verbatim and a structured error to any caller (including action-queue Step 5) — no API calls, no report generation, no churn-overlap reads happen until M09 lands.

1. Check whether the dependency exists:
   - Env var `KLAVIYO_API_KEY` is set and non-empty, OR
   - File `/home/user/accent-os/.claude/settings.local.json` has a `klaviyo_api_key` entry (gitignored, perms 600), OR
   - Supabase `hsyjcrrazrzqngwkqsqa` has a populated `klaviyo_flows` cache table with `last_synced_at > now() - interval '24 hours'` (offline/cached path).

2. If none of those pass, return this stub verbatim AND a structured error to action-queue, then exit (no further steps run):

   > skill `klaviyo-flows` is BLOCKED on **M09 (Klaviyo API key)**. To unblock, per BUILD_PLAN_MICHAEL.md M09:
   > 1. Go to `https://www.klaviyo.com/settings/api-keys` → click **Create Private API Key**.
   > 2. Name it "AccentOS". Scopes: **read-only** on Profiles, Lists, Campaigns, Metrics, Flows. Write on Profiles only if Michael needs to push customer updates (skill is read-only by default — keep write off).
   > 3. Save the key. Paste to Claude: `M09 done — Klaviyo private key: <paste>. Wire into AccentOS.`
   > 4. Claude installs the key into env (`KLAVIYO_API_KEY=...`) via `/home/user/accent-os/.claude/settings.local.json` (perms 600, gitignored).
   > Skill activates automatically once `KLAVIYO_API_KEY` is set.

   Structured return to action-queue Step 5 (only relevant for `propose_klaviyo_edit` action_type — this skill never accepts `send_klaviyo_flow`):
   ```json
   {
     "status": "error",
     "error": { "code": "BLOCKED_ON_M09", "message": "klaviyo-flows blocked on M09", "retryable": true },
     "unblock_m_task": "M09",
     "duration_ms": 0
   }
   ```

3. If the dependency exists, also read in parallel:
   - `references/klaviyo-reports.md` — pre-defined report shapes (flow performance leaderboard, list growth/churn, abandoned-cart recovery rate, post-purchase LTV impact).
   - `references/mode-routing.md` — the three-mode dispatch + threshold definitions.
   - `references/subject-line-rules.md` — Klaviyo spam-words list + subject-line A/B rationale templates.
   - `references/proposed-schema.md` — `klaviyo_flows`, `klaviyo_flow_metrics`, `klaviyo_flow_proposals` cache tables (M-task pending; never write SQL migrations from this skill).
   - Then proceed to Step 1.

---

## Step 1 — Dispatch to the requested mode

Pick exactly one of three modes from Michael's phrasing:

| Mode | Phrases | Output |
|------|---------|--------|
| **A — audit** | "audit", "scan", "rank", "which flows suck" | Ranked leaderboard + underperformer flags |
| **B — propose** | "propose edits", "fix [flow]", "draft new subject lines for [flow]" | Paste-ready edit proposals for one named flow |
| **C — engagement** | "engagement", "last N days", "churn overlap" | Engagement summary + churn-predictor segment overlap |

Output the dispatch line up front: `MODE: [A/B/C] | SCOPE: [all flows | flow_id=XXX | last 30d]`. Then jump to the matching step (Step 2A, 2B, or 2C).

---

## Step 2A — Mode A: audit (ranked leaderboard)

Pull all live flows via Klaviyo REST API v2024-* `/api/flows/` (use header `revision: 2024-10-15`). For each flow, fetch metrics from `/api/flow-action-metrics-aggregate-queries/` over the last 30 days.

**API failure handling (applies to every Klaviyo call across Mode A/B/C):**
- **401 / 403** → `KLAVIYO_API_KEY` revoked or scope-shrunk. Surface "Klaviyo auth failed — re-check M09 key in /home/user/accent-os/.claude/settings.local.json", abort the run, do NOT degrade to cached data silently.
- **404** on a flow_id lookup → return the candidate list per the rule in Step 2B; never fabricate a result.
- **429 Too Many Requests** → respect `Retry-After`; sleep then retry once. If second 429, abort the mode and surface "Klaviyo rate-limited — retry in N minutes".
- **5xx** → abort the mode, surface the Klaviyo-side error verbatim, do NOT auto-retry.

- `opens_unique`, `clicks_unique`, `recipients`, `delivered`
- `placed_order_value` (revenue), `placed_order` (count)

Compute per flow:

```
open_rate     = opens_unique / delivered
click_rate    = clicks_unique / delivered
conv_rate     = placed_order / delivered
revenue_per_send = placed_order_value / delivered
```

Compute the median `revenue_per_send` across all flows; that's the cohort baseline.

Flag a flow as **UNDERPERFORMING** if any of:
- `open_rate < 0.15`
- `click_rate < 0.02`
- `revenue_per_send < cohort_median`

Sort all flows descending by `revenue_per_send`. Output the leaderboard per the format in `references/klaviyo-reports.md` §1 — top performers at top, underperformers grouped at bottom with reason flags.

Persist a snapshot via `analysis-snapshot` named `klaviyo-flows-audit-YYYY-MM-DD.md`.

If Michael asked for "top 3 underperformers" (or `daily-brief-composer` requested it), write only those three to `skills/daily-brief-composer/inbox/klaviyo-top3-underperformers.md` (overwrite each run).

---

## Step 2B — Mode B: propose (paste-ready edit drafts)

Resolve the flow name to a flow_id via `/api/flows/?filter=equals(name,"...")`. If 0 or >1 match, return candidates and stop — don't draft against ambiguous context.

Pull the flow's current state:
- All flow actions (`/api/flow-actions/?filter=equals(flow,"<id>")`) — capture send-time, segment filters, message bodies.
- Per-action metrics from `/api/flow-action-metrics-aggregate-queries/` last 90 days.
- Current subject lines from `/api/flow-messages/`.

Then draft three categories of proposed edit, scoring each subject line against `references/subject-line-rules.md`:

1. **Subject-line A/B candidates** — generate 3 alternates per low-open-rate message. For each alternate, include rationale (e.g. "current subject scores 8/10 on Klaviyo's spam-words list — alternate scores 2/10; preserves brand voice from vibe-speak/profiles/michael.md", or "concrete number in subject lifts open rate +12% on Klaviyo's 2024 benchmark for retail accounts").

2. **Segment refinements** — flag if the flow targets a segment that overlaps a churn-predictor `BIG_SPENDER_GONE_QUIET` cohort but doesn't have a Trade-tier branch. Propose a split per `references/klaviyo-reports.md` §3.

3. **Send-time changes** — if average open rate by send-hour deviates from current send-time by >3 percentage points, propose the better hour. Cite the per-hour table.

Output paste-ready into Klaviyo UI: each proposal block has an "exact field" header (e.g. `Subject Line — Message #2 in flow`, `Filter — Send only to: [segment]`, `Send-time — Trigger delay`) so Michael can navigate to it without ambiguity.

This skill does NOT auto-edit Klaviyo. Every proposal becomes a PROPOSED row in `action-queue` (state machine: PROPOSED → APPROVED → APPLIED, the apply step is manual paste by Michael).

---

## Step 2C — Mode C: engagement (last-N-day summary + churn overlap)

Default N = 30. Override via "last 7 days", "last 90 days", etc.

Pull from Klaviyo:
- Profiles created in window (`/api/profiles/` filter `created` ≥ now() - N days)
- Profiles unsubscribed in window (`/api/profiles/?filter=...`)
- Aggregated email engagement metrics across the account (sum of opens, clicks, conversions, revenue across all flows + campaigns)
- Flow-level recipient count + unsubscribe count per flow

Compute:
- List growth rate = (new profiles − unsubscribes) / starting_count
- Account-wide engagement: open rate, click rate, revenue/recipient
- Per-flow recipient share + unsubscribe share

Then compute **churn overlap**:
1. Read top-50 churn risks from `skills/churn-predictor` latest snapshot at `skills/analysis-snapshot/runs/churn-predictor-*.md` (most recent file).
   - **If no churn-predictor snapshot exists** (companion not yet run): skip the overlap section entirely, emit "Churn overlap skipped — run `churn-predictor` first to populate snapshot, then re-run `/klaviyo engagement`" in the report, continue with the engagement summary. Do not fabricate overlap rows.
   - **If snapshot is older than 7 days**: include the overlap but stamp "stale churn snapshot — re-run churn-predictor for fresh data" in the table caption.
2. Resolve each churn customer's `email` against Klaviyo profiles via `/api/profiles/?filter=equals(email,"...")` (batched 100 at a time).
3. For matched profiles, list which flows they're still receiving (via `/api/profile-segments/`).

Output the engagement summary + a table: `Churn-flagged customer | Reason code (from churn-predictor) | Active Klaviyo flows | Recommended action` (suppress, exit-flow, urgent-personal, no-action).

---

## Step 3 — Emit ranked output + snapshot + handoffs

Every mode emits three artifacts:

1. **In-message Markdown report** — paste-ready, see Output format. Mode-specific shape per `references/klaviyo-reports.md`.
2. **Snapshot** via `analysis-snapshot` — `klaviyo-flows-{mode}-YYYY-MM-DD.md`. Include the API queries, parameters, and the full output.
3. **Action queue handoff** — every PROPOSED row uses `action_type = propose_klaviyo_edit` per `action-queue/references/executor-registry.md`. This is a paste-ready edit, never an auto-send.
   - Mode A: each underperformer → one PROPOSED row "audit flow [name] for revival" with severity by revenue gap. `edit_type = "audit_followup"`.
   - Mode B: each subject-line / segment / send-time proposal → one PROPOSED row "apply paste-ready edit to [flow] [field]" with `edit_type = "subject_line"|"segment"|"send_time"`.
   - Mode C: each churn-overlap row with `Recommended action != no-action` → one PROPOSED row routed to the suggested skill (suppress → another `propose_klaviyo_edit` for exit-flow; urgent-personal → `email-drafter` via action_type `send_email`).
   - **If `action_queue` table doesn't exist yet** (action-queue Step 0 BLOCKED on schema): skip the handoff, persist the proposals to `references/proposed-edits-pending.md` (overwrite each run), and surface "action-queue schema missing — proposals saved to references/proposed-edits-pending.md; run action-queue Step 0 to migrate" in the report. Do NOT silently lose proposals.

If `--dry-run` (or "preview only"), skip the action-queue + brief writes — keep only the in-message report.

---

## Step 4 — Cache to Supabase (when proposed-schema lands)

If `klaviyo_flows`, `klaviyo_flow_metrics`, `klaviyo_flow_proposals` tables exist in Supabase `hsyjcrrazrzqngwkqsqa` (per `references/proposed-schema.md`), upsert the run's data:

- `klaviyo_flows` — one row per live flow, current state.
- `klaviyo_flow_metrics` — append-only per-day metric rows.
- `klaviyo_flow_proposals` — proposals from Mode B with status PROPOSED.

If those tables don't exist, skip silently (skill still works in stateless mode against the live API). Never write SQL migrations from this skill — surface a one-line note "cache schema not yet landed; run M-task for `klaviyo_flows` to enable cross-run trends."

---

## Output format

```
KLAVIYO-FLOWS — [YYYY-MM-DD HH:MM]  •  Accent Lighting  •  mode: [A audit | B propose | C engagement]

API:    Klaviyo REST v2024-10-15  •  Auth: KLAVIYO_API_KEY (read-only)
Scope:  [scope line — all flows | flow_id=XXX | last 30d]

═══ [MODE-SPECIFIC SECTION] ═══

(Mode A — RANKED FLOW LEADERBOARD)
Rank | Flow                          | Recipients | Open % | Click % | Conv % | Rev/send | Status
-----+-------------------------------+------------+--------+---------+--------+----------+---------------
   1 | Post-Purchase 30d             |     12,400 | 47.2%  |  6.8%   |  3.1%  |  $4.12   | TOP
   2 | Abandoned Cart                |      8,900 | 41.8%  |  9.4%   |  4.7%  |  $3.85   | TOP
 ... |                               |            |        |         |        |          |
  17 | Browse Abandon — Outdoor      |      2,100 | 11.4%  |  1.2%   |  0.4%  |  $0.18   | UNDERPERFORM (open<15%, rev<median)
  18 | Win-Back 90d                  |      4,300 |  9.8%  |  0.9%   |  0.2%  |  $0.09   | UNDERPERFORM (triple-flag)

(Mode B — PROPOSED EDITS for flow "[name]")
EDIT 1 — Subject Line — Message #2
  current:  "Don't miss out on this exclusive offer!"
  spam-score: 8/10  (flagged: "exclusive", "don't miss", "!")
  candidate A: "your saved fixtures are still here"        (spam: 1/10  — concrete, low-pressure)
  candidate B: "the BACL pendant you looked at — back in stock"  (spam: 0/10 — fact-anchored)
  candidate C: "quick note on your cart"                   (spam: 0/10 — register-mirror per voice-calibration)

EDIT 2 — Segment Filter — Trigger
  current:  "Anyone who viewed product"
  proposed: split into Trade tier (existing branch) + Consumer (new branch with longer wait)
  rationale: 28% of flow recipients are Trade per customers.segment join; Trade buying cycle 3× longer

EDIT 3 — Send-time — Action #1 delay
  current:  "1 hour after trigger"
  proposed: "4 hours after trigger"
  rationale: open rate by hour table shows 4h window: 38% vs 1h window: 22%

(Mode C — ENGAGEMENT SUMMARY + CHURN OVERLAP)
List growth (last 30d):    +312 new  /  −89 unsubs  =  net +223  (1.4%)
Account-wide opens:        38.2%  (+2.1pp vs prior 30d)
Account-wide rev/recipient: $1.84  (-$0.12 vs prior 30d)

Churn-overlap (top-50 churn risks vs Klaviyo profiles):
  matched: 41 / 50
  recommend SUPPRESS: 12
  recommend EXIT-FLOW: 18
  recommend URGENT-PERSONAL (route to email-drafter): 8
  no-action: 3

═══ HANDOFFS ═══
Snapshot:           skills/analysis-snapshot/runs/klaviyo-flows-{mode}-YYYY-MM-DD.md
Daily brief feed:   skills/daily-brief-composer/inbox/klaviyo-top3-underperformers.md  (Mode A only, overwritten)
Action queue:       [N] PROPOSED rows queued for approval
Companion routing:  [list of skills the proposals route to]

═══ PASTE-READY API CALLS (for re-run / verification) ═══
[the curl-equivalent calls from Step 2{A|B|C}, parameterized]
```

---

## AccentOS context

- **Stack:** Klaviyo REST API v2024-* (auth via `KLAVIYO_API_KEY`, read-only scopes per M09), Supabase `hsyjcrrazrzqngwkqsqa` (cache + cross-run trends — schema in `references/proposed-schema.md`), BigCommerce `store-cwqiwcjxes` (revenue attribution path: Klaviyo `placed_order_value` ↔ BC orders).
- **Project:** AccentOS — internal operating system for Accent Lighting (residential lighting retailer).
- **Paths:** `/home/user/accent-os/skills/klaviyo-flows/` (Codespace alt: `/workspaces/accent-os/...`).
- **BUILD_PLAN tracks:** 6.4 (Klaviyo integration — this skill closes it). Blocked-on M09 in `BUILD_PLAN_MICHAEL.md`.
- **Capability ladder:** L3 audit + L4 draft (proposes, never applies — apply step is manual paste by Michael per AccentOS Hard Rule "Spend Rules" and L6 autonomous-execution gating).
- **Companion skills:**
  - `email-drafter` — 1:1 reach-out drafting; klaviyo-flows handles automation flows. Routes URGENT-PERSONAL churn-overlap rows here.
  - `churn-predictor` — Mode C consumes its latest snapshot for segment overlap.
  - `bc-business-review` — pulls revenue attribution from this skill's flow leaderboard for the review window.
  - `daily-brief-composer` — consumes top-3 underperformers from Mode A.
  - `action-queue` — receives PROPOSED rows from all three modes; nothing auto-applies.
  - `analysis-snapshot` — captures every run.
  - `supabase-sql-magic` — for ad-hoc queries against the `klaviyo_flows*` cache tables once they land.

---

## Anti-patterns

- **Never** auto-edit Klaviyo. This skill is read + propose only. Every edit is a paste-ready block Michael applies in the Klaviyo UI. The Klaviyo private API key from M09 must be **read-only** scope on Profiles / Lists / Campaigns / Metrics / Flows; if Michael ever provisions a write key, this skill still refuses to use the write endpoints.
- **Never** invent a flow ID, message ID, segment ID, or metric value. If the Klaviyo API returns 0 rows for a name lookup, return the candidate list and stop — don't draft against fiction.
- **Never** send or schedule a send. No campaign creation, no flow trigger, no test-send. Klaviyo `POST /api/campaigns/` and `POST /api/flow-actions/` are forbidden for this skill.
- **Never** use a single global underperformer threshold without the cohort median. Accent Lighting flows have wide variance (post-purchase converts at 3%+ revenue/send; browse-abandon converts at <$0.20). Always compute the cohort median before flagging.
- **Never** classify a flow as underperforming on a single low-recipient day. Require ≥30d window AND ≥500 recipients before flagging.
- **Never** route around `analysis-snapshot`. Every run is captured for re-run + diff.
- **Never** write SQL migrations from this skill. If `klaviyo_flows*` tables don't exist, document in `references/proposed-schema.md` and run in stateless mode — schema lands via a future M-task.
- **Never** output prose-only commentary ("your Klaviyo flows look fine"). Every run produces the ranked Markdown report + handoffs — that's the contract.
- **Never** include suppressed / unsubscribed / `do_not_contact`-flagged customers in any churn-overlap "URGENT-PERSONAL" routing. Filter on Klaviyo profile `subscriptions.email.marketing.consent != "SUBSCRIBED"` first.
- **Never** accept `action_type = send_klaviyo_flow` even if action-queue routes one here. This skill is read+propose only; the only action_type it processes is `propose_klaviyo_edit`. Refuse with `{"status": "error", "error": {"code": "ACTION_TYPE_NOT_SUPPORTED", "message": "klaviyo-flows is read+propose only — send_klaviyo_flow is not implemented", "retryable": false}}` and surface "fix action-queue/references/executor-registry.md binding".
- **Never** silently drop proposals when action-queue is BLOCKED on schema. Persist to `references/proposed-edits-pending.md` and surface the migration step — losing proposals erases work and breaks the audit trail.
- **Never** degrade a 401 / 403 to cached data without an explicit warning. Auth failure means the M09 key was revoked, scope-shrunk, or rotated; running on stale cache hides the security issue.
