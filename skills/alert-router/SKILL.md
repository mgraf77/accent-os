---
name: alert-router
description: >
  Route AccentOS Intelligent Alerts (Track 6.8 — 9-signal generator in
  `js/alerts.js`) to the right owner role and downstream skill, suppress
  duplicates within a 24h window, escalate stale alerts past their
  urgency-tier SLA, and emit one `action_queue` row per routed alert plus a
  one-line entry to the daily brief's "Alerts" section. Closes the
  self-healing GMC / vendor / pipeline alert loop for Accent Lighting by
  turning raw rows in the Supabase `alerts` table (project
  hsyjcrrazrzqngwkqsqa) into structured PROPOSED action-queue items with a
  named owner, suggested skill, and dedup key. Use this skill when Michael
  says: "route the alerts", "process new alerts", "who owns this alert",
  "escalate stale alerts", "alert triage", "wire alerts into action queue",
  or any phrasing that asks to convert raw alerts into routed actions. Do
  not use this skill to generate new alert rows (that's `js/alerts.js`
  hydrate cycle) or to surface a single alert in a brief (that's
  `daily-brief-composer`). Always emits a routing report + action_queue
  upserts + a daily-brief alerts block — never returns prose-only triage.
  Top trigger phrases (matched against this description by the harness):
  "route alerts", "process alerts", "what fired", "what fired today",
  "alert triage", "knock out the alerts", "wire alerts to action queue",
  "escalate stale alerts".
---

# alert-router

**Purpose:** Convert the 9-signal alert generator output (Track 6.8 / `js/alerts.js`) into structured, owner-tagged, deduplicated, escalation-aware `action_queue` rows so AccentOS's agentic capability ladder advances from L3 (proactive alerts) to L4 (drafted actions).

Companion skills (orchestration triangle: this skill is one of two upstream feeders writing into `action_queue`; the brief renderer at the apex consumes both):
- `action-queue` — receives PROPOSED rows this skill writes (downstream sink, also the back-pressure source `next-action-recommender` reads)
- `daily-brief-composer` — surfaces this skill's per-role "Alerts" block at the triangle apex (consumer)
- `next-action-recommender` — sibling feeder; reads `action_queue` PROPOSED depth (this skill's writes) as a back-pressure signal in its Step 0 — closes the triangle
- `email-drafter` — invoked when a routed alert's `suggested_action` is `send_email`
- `supabase-sql-magic` — fallback for raw alert reads when MCP is degraded
- `coop-claim-drafter` — owner of `coop_deadline` alerts

---

## Trigger Recognition

Run this skill when Michael says anything like (lowercase, often no apostrophes — match his terse register):
- "route the alerts" / "route alerts" / "route em"
- "process new alerts" / "process alerts" / "triage the alerts" / "triage alerts"
- "who owns this alert" / "whos this alert for" / "assign alert ownership"
- "escalate stale alerts" / "what alerts are old" / "stale alerts"
- "wire alerts into action queue" / "hook alerts into the queue" (Michael uses "hook up" / "wire up" — confirmed in PROMPT_LOG profile)
- "alert triage" / "alert routing" / "alerts triage"
- "merge duplicate alerts" / "dedup alerts"
- "alerts to brief" / "send alerts to daily brief" / "alerts for the brief"
- "what fired" / "what fired today" / "whats firing" (Michael's terse form for "what alerts came in")
- "knock out the alerts" / "knock em out" (Michael uses "knock out" as autonomy verb — confirmed in PROMPT_LOG profile)
- "intelligent alerts" / "Intelligent Alerts" (Track 6.8 module name — surfaces when he references the module directly per profile vocab)
- "process the bell" / "what's in the bell" (the topbar bell icon from Track 6.8 v6.10.22)
- "/route" (slash form for fast invocation)

Auto-trigger when `daily-brief-composer` requests its "Alerts" section and the watermark is older than 1 hour, or when `js/alerts.js` reports new rows since the last route.

Disambiguation: if Michael asks for the morning rundown / "whats on my plate" → run `daily-brief-composer` (which auto-pulls this skill's Alerts block). If he asks "what should i do next" / "top 3" without an alert anchor → defer to `next-action-recommender`. This skill is the router, not the brief renderer or the recommender.

---

## Step 0 — Preflight (BLOCKED gate)

This skill is gated on **M02: core schema run by Michael in Supabase SQL Editor** (the `alerts` and `action_queue` tables both live in M02-extended schema).

Run these checks in parallel:

1. **Schema gate.** Probe Supabase `hsyjcrrazrzqngwkqsqa` via `mcp__7131a9a4__list_tables` — confirm `alerts` exists. Then probe for `action_queue` (proposed schema in `references/proposed-schema.md`). If `alerts` is missing, return:

   > skill `alert-router` is BLOCKED on M02. To unblock:
   > 1. Open Supabase SQL Editor at https://hsyjcrrazrzqngwkqsqa.supabase.co
   > 2. Paste and run `/home/user/accent-os/sql/M02_core_schema.sql`
   > 3. Re-run this skill — it will activate automatically.

   If `alerts` exists but `action_queue` does not, return a softer notice that `action_queue` schema needs to be applied (paste `references/proposed-schema.md` into SQL Editor) and continue in **dry-run mode** — emit the routing report only, skip the upsert step.

2. **Read routing table.** `/home/user/accent-os/skills/alert-router/references/routing-table.md` — single source of truth mapping each of the 9 signal types to (owner_role, suggested_skill, urgency_tier, dedup_key_template, suggested_action). **If the file is missing**, abort with a one-line stub `⚠ alert-router: routing-table.md missing — re-clone or restore. Do not route from inferred defaults.` Routing without a table is unsafe — it produces silent owner-role drift.

3. **Read signal contract.** `/home/user/accent-os/skills/alert-router/references/alert-signals.md` — the 9 enumerated types pulled from `js/alerts.js` lines 101–249. If a row's `type` is not one of the 9, route it to the catch-all bucket (owner=Owner, tier=2) and flag in the report as `unknown_signal`. **If `js/alerts.js` has shipped a 10th type since `alert-signals.md` was last synced**, treat the new type as unknown (catch-all + flag) — never auto-extend the contract. Surface a one-line trailer `_signal-contract drift: [type] in alerts.js but not alert-signals.md — sync references_`.

4. **Read last-route watermark.** `/home/user/accent-os/skills/alert-router/last-route.md` (created on first run). The `routed_at` timestamp is the cutoff for the "new since last route" delta. If the file does not exist, treat as `NOW() - INTERVAL '24 hours'`.

5. **Read active vibe-speak voice.** `/home/user/accent-os/skills/vibe-speak/profiles/_active.md` → resolve mode → apply mode rules to the routing report's narration only (the action_queue rows themselves are structured data, voice does not apply). If `_active.md` is missing, default to `vibe` and continue — voice never blocks routing.

6. **Concurrent-run guard.** Probe `last-route.md` for a `routed_at` newer than `NOW() - 30s`. If present, another router run is mid-flight — emit `⚠ alert-router: another run completed [N]s ago. Aborting to avoid double-routing.` and exit. Routing twice in 30s creates `action_queue` row duplication that breaks the dedup contract.

Output of Step 0: one-line preflight — `alerts=[count] new_since_watermark=[count] action_queue=[present/dry-run] mode=[vibe-mode] guards=[ok|drift|other]`.

---

## Step 1 — Pull unrouted alerts

Query the `alerts` table for rows that have not yet been processed by this skill. The contract for "unrouted" is: `payload->>'routed_at' IS NULL` OR `created_at > [watermark]`.

```sql
-- Supabase hsyjcrrazrzqngwkqsqa
SELECT id, type, severity, title, body, link, payload, status, created_at,
       payload->>'source_id' AS source_id,
       payload->>'routed_at' AS routed_at
FROM alerts
WHERE status IN ('unread','read')           -- skip dismissed/actioned
  AND (payload->>'routed_at' IS NULL OR created_at > '[watermark]')
ORDER BY
  CASE severity WHEN 'urgent' THEN 1 WHEN 'warn' THEN 2 ELSE 3 END,
  created_at ASC
LIMIT 200;
```

If the row count is zero, emit a one-liner `_no unrouted alerts_` and skip to Step 5 (watermark update). Do not omit Steps 2–4 — render them as `_skipped (no alerts)_` placeholders so Michael sees the skill ran end-to-end.

---

## Step 2 — Apply routing table

For each unrouted alert row, look up its `type` in `references/routing-table.md` and assemble a routing record:

| field | source |
|-------|--------|
| `alert_id` | `alerts.id` |
| `signal_type` | `alerts.type` |
| `owner_role` | routing-table → `owner_role` |
| `suggested_skill` | routing-table → `suggested_skill` |
| `suggested_action` | routing-table → `suggested_action` (verb-phrase) |
| `urgency_tier` | routing-table → `urgency_tier` (1=urgent / 2=daily / 3=weekly) |
| `dedup_key` | routing-table template applied to row (e.g. `coop_deadline:vendor_id=137`) |
| `escalation_at` | `created_at` + tier-specific SLA (T1: +4h, T2: +24h, T3: +7d) |
| `link` | `alerts.link` (preserved verbatim) |

Render the routing table as a paste-ready block in the report — one row per alert, sorted by tier ASC then created_at DESC.

**Unknown signal types** route to: `owner_role=Owner`, `suggested_skill=next-action-recommender`, `urgency_tier=2`, `dedup_key=unknown:[alert_id]`, and append a separate "unknown_signals" line to the report so the routing-table can be extended.

---

## Step 3 — Dedup and escalation pass

**Dedup** — within the routing batch and against the last 24h of `action_queue` rows (status `PROPOSED` or `IN_PROGRESS`):

1. Group by `dedup_key`. The newest row in each group survives; older rows in the same group within 24h get marked `merged_into=[surviving_id]` and their action_queue counterparts auto-archived (status → `SUPERSEDED`).
2. If the surviving row's `signal_type` matches an existing `action_queue` row with the same `dedup_key` from <24h ago, do **not** create a new row — instead, refresh the existing row's `last_seen_at` and `severity` (escalating only, never downgrading).

**Escalation** — for each existing `action_queue` row whose `escalation_at` has passed:

| Tier | SLA | Re-route to |
|------|-----|-------------|
| 1 (urgent) | 4h | Direct ping to `owner_role` (priority bell-icon flag) + duplicate row in daily brief "Hot" section |
| 2 (daily) | 24h | Promote to next morning's daily-brief "Alerts" block top-3 |
| 3 (weekly) | 7d | Promote to weekly review queue (write `escalated_to_weekly=true` to the row's payload) |

Escalation never deletes — it stamps `escalated_at` and reroutes the destination. Render escalation actions as a separate sub-block in the report.

---

## Step 4 — Write to action_queue + emit brief block

**Per surviving (post-dedup) routing record:**

Upsert into `action_queue` (schema in `references/proposed-schema.md`). Use SQL `ON CONFLICT (dedup_key) WHERE created_at > NOW() - INTERVAL '24 hours' DO UPDATE`. Each row carries:

```sql
-- Supabase hsyjcrrazrzqngwkqsqa
INSERT INTO action_queue (
  id, source_alert_id, signal_type, owner_role, suggested_skill,
  suggested_action, urgency_tier, dedup_key, status, escalation_at,
  link, payload, created_at, last_seen_at
) VALUES (
  gen_random_uuid(), '[alert_id]', '[signal_type]', '[owner_role]',
  '[suggested_skill]', '[suggested_action]', [tier], '[dedup_key]',
  'PROPOSED', '[escalation_at]', '[link]', '[payload jsonb]',
  NOW(), NOW()
)
ON CONFLICT (dedup_key) WHERE created_at > NOW() - INTERVAL '24 hours'
DO UPDATE SET last_seen_at = NOW(),
              severity     = GREATEST(action_queue.severity, EXCLUDED.severity);
```

Also stamp the source `alerts` row: `UPDATE alerts SET payload = payload || jsonb_build_object('routed_at', NOW(), 'action_queue_id', '[new_id]') WHERE id = '[alert_id]';`.

If schema is in dry-run mode (Step 0 noted `action_queue` missing), output the exact INSERT statements as a paste-ready SQL block instead of executing — Michael runs them via SQL Editor.

**Daily-brief Alerts block** — one line per surviving alert, formatted for the `daily-brief-composer` "Alerts" section per role:

```markdown
## Alerts ([N] · [U] urgent)
- **[signal_type]** — [title] · [owner_role] · [suggested_action] → `[suggested_skill]` · t-[tier]
- ...
```

Cap at top-5 per role for the daily brief; the rest live in the full action_queue.

---

## Step 5 — Update watermark and emit report

After Steps 1–4 complete:

1. Overwrite `/home/user/accent-os/skills/alert-router/last-route.md`:

   ```
   routed_at: [ISO8601]
   alerts_processed: [N]
   action_queue_writes: [N]
   merged: [N]
   escalated: [N]
   unknown_signals: [N]
   ```

2. Emit the routing report — sectioned, paste-ready, mode-voiced:

   ```
   ALERT ROUTING — [date] · mode=[vibe-mode]

   In: [N] alerts ([U] urgent · [W] warn · [I] info)
   Out: [Q] action_queue rows ([D] new · [M] merged · [E] escalated · [X] unknown)

   ═══ ROUTING TABLE ═══
   [Step 2 table — alert_id · type · owner · skill · tier · dedup_key]

   ═══ DEDUP / ESCALATION ═══
   Merged: [list]
   Escalated: [list with Tier and new destination]
   Unknown signals: [list — these need a routing-table.md entry]

   ═══ DAILY-BRIEF ALERTS BLOCK (per role) ═══
   [Owner-block]
   [Sales-block]
   [Ops-block]
   [Marketing-block]

   ═══ action_queue UPSERTS ═══
   [SQL block — executed if schema present, paste-ready if dry-run]
   ```

3. If any signal type was `unknown`, surface a one-line trailer suggesting `Edit references/routing-table.md to map the new signal type — otherwise it falls into the Owner catch-all on next run.`

---

## Output format

Single sectioned report (structure in Step 5). The report itself, the action_queue upserts (executed or paste-ready), the watermark file write, and a `last-route.md` overwrite — those are the four artifacts. No prose preamble, no closing summary.

**Partial-output contract:** if `action_queue` schema is missing (dry-run mode per Step 0), the report still emits — the `action_queue UPSERTS` block becomes a paste-ready SQL block instead of executed statements, and the watermark still advances (so the next run's "new since" delta stays correct). If `routing-table.md` is missing or the concurrent-run guard fires, the skill aborts cleanly with a one-line stub and does NOT advance the watermark — those are the only paths that skip the artifact contract.

---

## AccentOS context

- Stack: Supabase `hsyjcrrazrzqngwkqsqa` (`alerts` table from M02; `action_queue` from `references/proposed-schema.md`); reads `js/alerts.js` line numbers as signal-type ground truth; emits to `daily-brief-composer`.
- Project: AccentOS for Accent Lighting (residential lighting retailer).
- Paths: `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`).
- BC store: `store-cwqiwcjxes` (relevant when alert payloads link to BigCommerce admin URLs).
- Companion skills: `action-queue` (consumer), `daily-brief-composer` (renderer), `email-drafter`, `coop-claim-drafter`, `next-action-recommender`, `supabase-sql-magic`.
- Reads: `alerts` (M02), `action_queue` (proposed), `js/alerts.js` (signal types), `references/routing-table.md`, `references/alert-signals.md`, `references/proposed-schema.md`, `vibe-speak/profiles/_active.md`.
- Writes: `action_queue` rows (PROPOSED), `alerts.payload.routed_at` stamp, `skills/alert-router/last-route.md` (watermark only). Never modifies `js/alerts.js` or the alert generators themselves.

---

## Anti-patterns

- **Never** create new alert rows. This skill is router-only — alert generation is `js/alerts.js`'s job. Crossing that boundary breaks the dedup contract.
- **Never** route an alert without a routing-table entry. Unknown types go to the Owner catch-all + flagged for manual table extension — they do not get LLM-guessed owners.
- **Never** silently drop a duplicate. Mergers stamp `merged_into` and `SUPERSEDED` so the audit trail survives.
- **Never** downgrade severity on dedup-merge. Severity only escalates — `warn` + `urgent` for the same dedup_key resolves to `urgent`.
- **Never** write to `action_queue` without a `dedup_key`. Rows without dedup keys break the 24h dedup window and create alert spam.
- **Never** modify `/home/user/accent-os/sql/M02_core_schema.sql` or any sql/ migration. The `action_queue` schema lives in `references/proposed-schema.md` until Michael adopts it.
- **Never** skip the escalation pass. Stale Tier-1 alerts that don't escalate are the single biggest failure mode of "we have alerts but nobody acts on them."
- **Never** emit a prose-only triage. The four artifacts (report + queue upserts + watermark + brief block) are the contract — anything less is a failed run.
- **Never** auto-extend `alert-signals.md` from a freshly-shipped `js/alerts.js` type. New types route to the Owner catch-all + drift trailer; the human syncs the contract.
- **Never** route when the concurrent-run guard fires. Aborting in <30s is correct — duplicate routing breaks the dedup window.
- **Never** route from inferred defaults when `routing-table.md` is missing. Abort with the missing-table stub and exit.
