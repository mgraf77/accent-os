---
type: concept
title: "Rubric · Rep Score (admin-only)"
slug: rubric-rep-score
aliases: [rep-score-category, rep-rubric]
sources: [[sources/master]], [[sources/seed-corpus-v1]]
related: [[vendor-scoring]], [[sop-rep-outreach]], [[decisions/ADR-003-rep-score-admin-only]]
cluster: vendor-scoring
cluster_role: member
confidence: high
contradictions: []
open_questions: []
visible_to_roles: [Owner, Admin, Manager]
created: 2026-05-05
updated: 2026-05-05
---

# Rubric · Rep Score

**Weight:** ADMIN ONLY · NEVER VISIBLE ON REP VIEW TAB.

> ⚠️ See [[decisions/ADR-003-rep-score-admin-only]]. This rubric — and any UI surface that shows it — is gated to Owner / Admin / Manager. Vendors must not know they are being scored on rep performance, because disclosure would damage rep relationships and incentivize gaming.

## What it measures

Rep group's value to Accent: responsiveness, knowledge, proactive opportunity-flagging, willingness to advocate for Accent on policy disputes.

## Scale

| Score | Meaning |
|---|---|
| **10** | Proactive (calls Accent first when MAP issues / new SKUs / closeouts), responds <24h, knowledgeable on every product line |
| **6** | Responsive when called but reactive, average product knowledge |
| **0** | Unresponsive, no value-add, often the bottleneck on dispute resolution |

## Hard rule

**Never** add Rep Score visualization to the Rep View tab. Audit-log every UI change touching Rep View visibility. The skill's `/aos-lint` should grep `index.html` for the string `repScore` inside any DOM region tagged for the Rep View context — flag if found.

## Operational use

Drives outreach prioritization in [[sop-rep-outreach]]. Reps with Rep Score ≥ 8 get first call when a new line opportunity appears; reps with Rep Score ≤ 4 get scheduled feedback conversations before any expansion happens with that line.
