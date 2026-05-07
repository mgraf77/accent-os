---
name: daily-brief-composer
description: >
  Assemble a role-aware morning brief for Accent Lighting by querying
  Supabase hsyjcrrazrzqngwkqsqa for today's top-3 actions, deals at risk,
  vendors needing attention, KPI deviations, and a 24-hour "new since
  last brief" diff. The brief is composed in vibe-speak default mode and
  emitted as paste-ready Markdown that the AccentOS Daily Command Center
  UI (Track 1.3) renders without further formatting. Roles supported:
  Owner (default), Sales, Marketing, Ops — each gets a different section
  shape per `references/role-templates.md`. Use this skill when Michael
  says: "morning brief", "what's on my plate", "daily brief for [role]",
  "what should I do today", "owner brief", "sales brief", "compose the
  brief", or any phrasing that asks for a one-screen rundown of today's
  priorities. Do not use this skill to surface a single alert (use
  alert-router) or to compute KPI integrity (use kpi-data-audit). Always
  produces a sectioned, ≤1-screen Markdown brief — never returns prose
  walls or "I would include" placeholders.
---

# daily-brief-composer

**Purpose:** Every role at Accent Lighting should walk into a brief that already knows what's on their plate. AccentOS shipped the Daily Command Center UI (Track 1.3) — this skill is the composer that fills it.

Companion skills feeding this composer:
- `next-action-recommender` (top-3 actions when available)
- `alert-router` (alerts feed)
- `kpi-data-audit` (KPI deviation thresholds)
- `vendor-cascade` (vendor delta source)
- `supabase-sql-magic` (raw queries when companions aren't yet built)

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "morning brief" / "daily brief"
- "what's on my plate" / "what should I do today"
- "compose the brief" / "owner brief"
- "sales brief" / "marketing brief" / "ops brief"
- "brief for [role]"
- "today's rundown"
- "what's the situation"

Auto-trigger on AccentOS session-start when Michael's first message is a date or "morning."

---

## Step 0 — Preflight

Run these in parallel:

1. **Resolve role.** Parse the trigger phrase for a role keyword (`owner`, `sales`, `marketing`, `ops`). If none, default to **Owner**. Single source of role-shape truth: `/home/user/accent-os/skills/daily-brief-composer/references/role-templates.md`.
2. **Resolve voice.** Read `/home/user/accent-os/skills/vibe-speak/profiles/_active.md` → resolve the active mode (default `vibe`). Read `/home/user/accent-os/skills/vibe-speak/modes/[mode].md`. Voice rules from that mode apply to every section header narration and every action verb in this brief.
3. **Resolve last-brief watermark.** Read `/home/user/accent-os/skills/daily-brief-composer/last-brief.md` (created on first run). The `composed_at` timestamp is the cutoff for the "New since last brief" 24h diff in Step 4. If the file does not exist, treat the watermark as `NOW() - INTERVAL '24 hours'`.
4. **Probe companion availability.** Check whether each of these skills exists at `/home/user/accent-os/skills/[name]/SKILL.md`: `next-action-recommender`, `alert-router`, `kpi-data-audit`, `vendor-cascade`. Each missing companion → fall back to direct Supabase query (Step 2 / Step 3 / Step 4) using the SQL stubs in `references/fallback-queries.md`.
5. **Resolve KPI deviation thresholds.** Read `/home/user/accent-os/KPI_CATALOG.md`. The default WoW deviation threshold for "deviation worth surfacing" is **|Δ| ≥ 15%** for Group F (financial), **|Δ| ≥ 20%** for Group $ / Group V (vendor) / Group S (sales). Override via `references/kpi-thresholds.md` if Michael has tuned these.

Output of Step 0: a one-line preflight: `role=[X] voice=[mode] last-brief=[ts] companions=[present/missing list]`.

---

## Step 1 — Compose the role-aware section list

Look up the role's section ordering and presence flags from `references/role-templates.md`. The default Owner shape:

| # | Section | Source |
|---|---------|--------|
| 1 | Top-3 actions today | `next-action-recommender` (fallback: direct query) |
| 2 | Deals at risk | `pipeline_deals` (no contact >30d OR stage stalled >14d) |
| 3 | Vendors needing attention | `vendor_scores` deltas + co-op deadlines + broken vendor links |
| 4 | KPI deviations | `kpi_snapshots` WoW deltas above threshold (Step 0) |
| 5 | New since last brief | 24h diff from watermark |

Sales / Marketing / Ops swap, drop, or reweight these — see `references/role-templates.md`. Do not invent new section types in this skill. New sections require an Edit to that reference file.

---

## Step 2 — Pull Top-3 actions

**If `next-action-recommender` is built:** invoke it with `role=[X]`. Take the first 3 returned actions. Each action must include: action verb, named target (deal/vendor/customer), context one-liner, and an estimated minutes-to-complete.

**Fallback (companion missing):** run the role-specific top-3 query from `references/fallback-queries.md` against Supabase hsyjcrrazrzqngwkqsqa via the Supabase MCP tool. The Owner fallback is roughly:

```sql
-- Top-3 actions for Owner — ranked by money-on-the-line × time-decay
SELECT 'deal' AS kind, d.id AS target_id, d.title AS target_name,
       d.amount AS dollars,
       EXTRACT(DAY FROM NOW() - d.last_contact_at) AS days_stale
FROM pipeline_deals d
WHERE d.status = 'open' AND d.amount > 5000
ORDER BY d.amount DESC, days_stale DESC
LIMIT 3;
```

Render each action as a single bullet — verb-first, paste-ready, ≤16 words. Do not pad with hedging language.

---

## Step 3 — Pull supporting sections in parallel

Issue all of these queries in parallel (or invoke companion skills in parallel). Each section has a hard cap so the whole brief stays ≤1 screen.

| Section | Source / query | Cap |
|---------|----------------|-----|
| Deals at risk | `pipeline_deals` WHERE `last_contact_at < NOW() - INTERVAL '30 days'` OR (stage unchanged for 14d AND amount > $2k) | 5 rows |
| Vendors needing attention | `vendor_scores` WHERE day-over-day delta > 0.10 OR co-op deadline within 14d OR broken-link-rescue flagged | 5 rows |
| KPI deviations | `kpi_snapshots` WHERE `abs(wow_delta_pct)` > threshold from Step 0 | 4 rows |
| New since last brief | rows in `pipeline_deals`, `customer_interactions`, `alerts` WHERE `created_at > [watermark]` | 6 rows |

For each row, format: **named entity** + **one-line why-it-matters** + **suggested next move** (verb-first, links to the AccentOS module path when relevant — e.g. `Vendor Intel → [vendor]`).

Companion fallbacks live in `references/fallback-queries.md`. If a query returns 0 rows, render the section as a single line: `_nothing flagged_` (italicized). Do not omit the section entirely — Michael needs to see "I checked, there's nothing" vs. "I forgot to check."

---

## Step 4 — Assemble the brief in vibe-speak voice

Apply the active vibe-speak mode to every section narration. Default `vibe` mode rules: contractions OK, fragments OK, lead with result, no preamble. Strip every hedging phrase ("I would suggest", "you might consider"). Strip jargon — e.g. "decay-weighted opportunity score" → "deals going cold".

Brief shape (Owner default):

```markdown
# Morning brief — [role] — [YYYY-MM-DD]

## Top 3 today
1. [verb] [target] — [one-line why] · ~[N]min
2. ...
3. ...

## Deals at risk ([N])
- **[deal name]** ($[amount]) — [why it's at risk] · [next move]
- ...

## Vendors needing attention ([N])
- **[vendor]** — [delta or deadline] · [next move]
- ...

## KPI deviations ([N])
- **[KPI name]** [↑/↓][X]% WoW — [one-line interpretation]
- ...

## New since last brief (24h)
- [event one-liner]
- ...

---
_Composed: [HH:MM]  ·  watermark: [last-brief ts]  ·  role: [role]  ·  voice: [mode]_
```

Total length cap: **≤1 screen** (~50 lines / ~2500 chars). If sections push past the cap, trim row counts in Step 3 first (vendors → 3, deals at risk → 3) before truncating the Top-3 or KPI sections.

---

## Step 5 — Update watermark and exit

After emitting the brief:

1. Overwrite `/home/user/accent-os/skills/daily-brief-composer/last-brief.md` with:

   ```
   composed_at: [ISO8601 timestamp]
   role: [role]
   sections_emitted: [comma-separated section names]
   row_counts: top3=3 risk=N vendor=N kpi=N new=N
   ```

2. Log a one-liner to `/home/user/accent-os/PROMPT_LOG.md` only if explicitly asked (default: silent — the brief itself is the artifact).

3. Surface a one-line trailer suggesting companion follow-ups — e.g. "want to draft outreach for [deal X]? → run `email-drafter`."

Do not auto-snapshot the brief. Daily briefs are ephemeral by design; if Michael wants this kept, he runs `analysis-snapshot` himself.

---

## Output format

Single Markdown block emitted to chat in the structure shown in Step 4. Ready to paste directly into the Daily Command Center UI tile. No surrounding prose, no "here's your brief:" preamble, no closing summary — the brief is the entire output.

---

## AccentOS context

- Stack: Supabase `hsyjcrrazrzqngwkqsqa` (read-only for this skill); Daily Command Center UI in `/home/user/accent-os/index.html` (Track 1.3 shipped); voice via `/home/user/accent-os/skills/vibe-speak/modes/[mode].md`.
- Project: AccentOS for Accent Lighting (residential lighting retailer).
- Paths: `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`).
- BC store: `store-cwqiwcjxes` (referenced when surfacing GMC / feed-related items in vendor section).
- Companion skills: `next-action-recommender`, `alert-router`, `kpi-data-audit`, `vendor-cascade`, `supabase-sql-magic`.
- Reads: `KPI_CATALOG.md`, `vendor_scores`, `pipeline_deals`, `customer_interactions`, `alerts`, `kpi_snapshots`, `coop_tracker`.
- Writes: `skills/daily-brief-composer/last-brief.md` (watermark only).

---

## Anti-patterns

- **Never** emit a prose wall. Every section is a header + bullets, no narrative paragraphs.
- **Never** hedge. "Here's what you might want to consider" is wrong. "Top 3 today: ..." is right.
- **Never** silently omit a section because it's empty — render `_nothing flagged_` so Michael knows it was checked.
- **Never** invent new section types in-skill. New sections require an Edit to `references/role-templates.md` first.
- **Never** exceed 1 screen. If sections overflow, trim row counts per the cascade rule in Step 4 — do not shrink the Top-3.
- **Never** call this skill from a workflow that needs a single alert (use `alert-router`) or KPI integrity audit (use `kpi-data-audit`).
- **Never** auto-snapshot the brief — daily briefs are ephemeral; persistence is Michael's call via `analysis-snapshot`.
- **Never** write to any Supabase table other than the local `last-brief.md` watermark file. This skill is read-mostly.
- **Never** generate the brief without first checking the watermark — losing the "new since last brief" diff is the single biggest value-leak.
