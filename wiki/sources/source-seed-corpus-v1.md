---
type: synthesis
slug: source-seed-corpus-v1
title: "Source: Seed Corpus v1"
sources: []
related: [vendor-scoring, lighting-reference, sop-vendor-onboarding]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Source: Seed Corpus v1

**Origin**: Initial knowledge corpus for accent-rag skill, constructed 2026-05-06  
**Status**: Fully extracted into wiki pages — this page is a provenance record  
**Layer**: Derived from Layer 1 (MASTER.md + BUILD_PLAN + index.html rubric data)

## What was in it

The seed corpus covered four knowledge clusters:

**Vendor scoring** (extracted → [[vendor-scoring]] + 14 rubric pages):
- 14-category rubric definitions and 0–10 scales
- RUBRIC_NUMERIC, RUBRIC_COMPONENTS, RUBRIC_TEXT structures from index.html
- Tier system (adaptive percentile) and score state machine

**Lighting reference** (extracted → [[lighting-reference]] + 5 sub-pages):
- Lumen/FC targets by space type
- CCT selection guide (2200K–6500K)
- CRI / TM-30 / TLCI quality metrics
- Emergency lighting codes (NEC 700/701, NFPA 101, IBC 1008)
- Dimming protocols (0-10V, DALI, Triac, ELV)

**SOPs** (extracted → [[sop-vendor-onboarding]], [[sop-quote-creation]], [[sop-rep-outreach]]):
- Vendor onboarding 7-step process
- Quote creation workflow
- Rep outreach triggers, intake questions, escalation path

**System context** (extracted → [[overview]], [[ADR-001]] through [[ADR-007]]):
- AccentOS architecture and tech stack
- Locked decisions
- Team profiles

## Confidence note

`confidence: medium` — seed corpus was constructed from source analysis, not from live vendor data or verified SOPs. Lighting reference values are industry standards (high confidence). Vendor-specific rubric scores need Michael verification.

## Related

[[vendor-scoring]] · [[lighting-reference]] · [[sop-vendor-onboarding]]
