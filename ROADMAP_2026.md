# AccentOS Roadmap 2026 — Optimized Build Plan

> Synthesized from a 7-stakeholder roleplay review (Owner, CTO, CFO, Sales/Ops frontline,
> Security, AI/ML, Adoption + Skeptic). Replaces and supersedes the original "Master
> Reconstruction" vision doc as the *executable* roadmap.

## Status at planning time (2026-05-07)

- 36 of 46 BUILD_PLAN_CLAUDE items shipped; Track 5 complete
- Tracks 6.1–6.4, 6.10–6.12 pending (mostly blocked on Michael creds M03–M10)
- Hot vs cold module usage **unknown** — no telemetry yet. This is the #1 gap.

## North-star metric

**Actions completed per active user per day** — surfaced on Monday dashboard.

## Threshold check before execution

Plan greenlit to start **Phase 0** if all are true:
- [x] Phases bounded and numbered with exit criteria
- [x] Kill-list defined (external portals; GA4/GSC/Klaviyo integrations; L4/L5 autonomy)
- [x] Risk register names blast-radius items (security ACLs, cost caps, shadow mode)
- [x] Phase 0 gates all subsequent build
- [ ] Adoption baseline data exists — *Phase 0 itself produces this*

Phase 1+ ratified only after Phase 0 telemetry lands (~week 3).

---

## PHASE 0 — Instrument & Gate (2 weeks, blocking)

Promoted from old Phase D. Nothing else builds until this lands.

| Task | Exit criterion |
|---|---|
| 0.A Adoption telemetry: `module_open`, `primary_action_fired` events | 14-day baseline → Hot/Warm/Cold/Dead buckets per module per role |
| 0.B Cost telemetry per LLM call (model, cached/uncached tokens, $) | Per-action $ on every Claude call; workspace cap + 80% kill-switch |
| 0.C Prompt caching enabled (AI Consultant + system prompts) | ≥80% cache-hit rate on multi-turn convos |
| 0.D Model-tier router (Haiku → Sonnet → Opus) | Default Haiku for classify/route; Sonnet for synthesis; Opus on explicit escalate |
| 0.E Bundler (esbuild) + Supabase type-gen + 20-test Playwright smoke harness | Pre-commit hook blocks index.html >1MB; CI runs persistence-trio round-trip per module |
| 0.F Migration runner (kill manual SQL) | Idempotent runner with version table; one-command apply |
| 0.G Hash-chained `audit_log` + RLS regression matrix in CI | Tamper-evident log; ephemeral DB tests every role × table on PR |
| 0.H North-star dashboard | Monday-morning visible to whole team |

**Greenlight gate:** Phase 0 buckets the 36 modules. Anything in Cold/Dead for 30 days
is hidden via Module Modes (not deleted). Phase 1 priorities reshape based on what's hot.

---

## PHASE 1 — ROI Integrations (4 weeks)

Narrowed from old Phase A. Only the two with direct $ leverage.

- **6.3 BigCommerce** — live stock + product data into Quotes; order sync
- **6.11 Windward ERP** — real inventory + sales velocity; replaces PO-line proxy in Demand Forecast

**Deferred (revisit when revenue case is concrete):** 6.1 GA4, 6.2 GSC, 6.4 Klaviyo, 5.13 E-Commerce Command Center.

**Exit criterion:** BC stock visible in active Quote flow; Demand Forecast running on Windward sales-line history; Owner signs off.

---

## PHASE 2 — Inline Retrieval in 3 Hot Modules (4 weeks)

Repositioned from old Phase B. **RAG is plumbing inside hot modules — not a chatbot phase.**

### Surfaces
- **Quote** → "3 similar past quotes + outcome" sidecar
- **Pipeline** → stale-deal context retrieval ("what changed since last touch")
- **Knowledge Hub Ask** → grounded answers with mandatory citations

### Stack
- pgvector on existing Supabase
- Per-source chunking (SOPs by heading; PDFs layout-aware; emails as thread-units)
- Hybrid search: Postgres FTS + vector + Reciprocal Rank Fusion
- Cross-encoder reranker (top-20 → top-5)
- Mandatory `chunk_id` citation in every answer; uncited responses rejected post-process
- Per-source ACL: `tenant_id`, `vendor_id`, `sensitivity` columns + RLS at retrieval AND at ingest
- Vendor pricing in separate pgvector schema with its own service key

### Eval (CI gate, not weekly cron)
- 150 Q/A pairs with labeled source chunks (lookup / synthesis / multi-hop / refusal-correct)
- Metrics: recall@5, MRR, faithfulness (Opus judge spot-checked by human), citation-precision, refusal accuracy
- Regression >2pp blocks merge

### Validation gate
- 14-day pilot, 5 users, inline card click-through >25%, insert rate >10% — else cut the surface and try a different one.

---

## PHASE 3 — 3 Named Automations, Shadow → Default (6 weeks)

Replaces old "L1-L5 agentic ladder." Three specific actions tied to dollars/hours.

| ID | Automation | Target user | Hours/week saved (estimate) |
|---|---|---|---|
| A1 | AI-drafted PO for top-50 fast-movers | Patrick (warehouse) | 3-5 |
| A2 | AI-drafted follow-up for stale deals | Paul (sales) | 5-8 |
| A3 | Auto-logged call notes attached to deal | Paul + all sales | 10-15 |

### Shared infrastructure
- `agent_actions` durable queue table: state machine `pending → approved → running → succeeded | failed | rolled-back`
- Per-action dry-run (diff in audit_log before commit)
- Per-user daily cap; per-action token ceiling
- Workspace kill-switch on cost or error-rate spike

### Promotion ladder (per automation)
1. **Shadow** (30 days): AI drafts side-by-side with blank; user picks
2. **Default-draft** (30 days): AI draft is starting state; user always edits + sends
3. **Approve-once**: user clicks approve, system executes
4. Promote *only when*: ≥70% acceptance for 30 days, zero $-error events, zero customer-facing auto-sends

### Auto-execute allowlist (security-approved)
- **YES:** tag a record, status-flip, internal note, draft-save, regenerate report, request quote refresh
- **NO:** external send, BC mutation, pricing change, comp/scores writes, cross-tenant read, anything in personal-data project, RLS/role changes

### Reject-with-reason loop
Every rejected draft captures a reason; reasons feed prompt + eval set updates monthly.

---

## PHASE 4 — Continuous Ralph + Quarterly Kill List

- Per-module 3-iter Ralph loop (proven on internal-meetings)
- **Quarterly kill review:** Cold/Dead modules (>30d Cold) → hidden via Module Modes; <Hot for 2 quarters → retired
- **Health gate:** WAU/MAU ≥0.5 across top 10 modules. <0.4 for 2 weeks = freeze new module work; fix existing.

---

## Deferred / Killed

| Item | Status | Re-trigger |
|---|---|---|
| External Trade Designer portal (6.5) | Deferred | Internal WAU/MAU >0.5 across top 10; explicit designer demand |
| Vendor Rep portal (6.6) | Deferred | Same |
| Public Consultant embed (6.7 phase 2) | Deferred | After Phase 2 inline retrieval proves out |
| Customer quote pipeline (external) | Deferred | After Phase 3 A2 default-on |
| GA4 (6.1), GSC (6.2), Klaviyo (6.4) | Deferred | Revenue case from Phase 0 telemetry |
| Google/Meta Ads (6.12) | Killed | API access not granted; no manual-only build |
| L4/L5 autonomy beyond 3 named actions | Killed | Revisit only after A1+A2+A3 at default-on for 90 days |

---

## Risk register

| Risk | Mitigation | Owner |
|---|---|---|
| Vendor pricing leaks via shared embeddings | Separate pgvector schema; per-source ACL; RLS at ingest + query | Phase 2 |
| Prompt injection from ingested PDFs/emails → auto-execute | Strip instructions from retrieved chunks; `<untrusted>` delimiters; never reach tool channel | Phase 2 + 3 |
| Token cost runaway | Workspace cap + 80% kill-switch; prompt caching; Haiku-default router; per-user daily cap | Phase 0 |
| Trust-break from one bad auto-action | Shadow mode 30d; reject-with-reason; never customer-facing auto-send | Phase 3 |
| index.html parse-time wall (~1MB) | Bundler + pre-commit size hook | Phase 0.E |
| Silent semantic drift from AI patches | Playwright persistence-trio harness in CI | Phase 0.E |
| Approval queue fatigue | Cap queue depth; pause new drafts above 10 pending | Phase 3 |
| External portal authn bleed | JWT `aud` claim split *now* even pre-portal | Phase 0.G |

---

## Execution order summary

```
Week 1-2:  Phase 0 (telemetry + caching + bundler + audit hardening)
Week 3:    Ratify Phase 1 priorities against Phase 0 data
Week 3-6:  Phase 1 (BC + Windward)
Week 5-9:  Phase 2 (inline retrieval, 3 surfaces)   [overlap OK]
Week 9-15: Phase 3 (A1 + A2 + A3, shadow → default)
Week 15+:  Phase 4 continuous (Ralph + kill list)
```

## Build kicks off when

Owner says "go on Phase 0." This planning doc + updated BUILD_PLAN tasks (Track 7+ to be appended) is the green-light artifact.
