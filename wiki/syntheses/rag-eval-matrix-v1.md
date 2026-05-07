---
type: synthesis
slug: rag-eval-matrix-v1
title: RAG Eval Matrix v1
sources: [source-karpathy-llm-wiki, source-master]
related: [ADR-007, karpathy-llm-wiki]
confidence: high
sensitive: false
created: 2026-05-07
updated: 2026-05-07
---

# RAG Eval Matrix v1

**Evaluated**: 2026-05-07  **Path**: wiki+fallback

## Summary scoreboard

| Dimension | Score |
|-----------|-------|
| Recall | 100.0% |
| Precision | 54.1% |
| Coverage | 100.0% |
| Latency | 100.0% |
| Cost | 100.0% |
| Maintenance | 100.0% |
| **Composite** | **92.4%** |

## By cluster

| Cluster | Composite |
|---------|-----------|
| Vendor Scoring | 92.4% |
| Lighting Ref | 93.2% |
| Sop | 91.7% |
| Module Pattern | 90.5% |
| Gotcha | 93.8% |
| Entity | 94.5% |

## Per-query results

| Query | Expected | Got | Recall | Precision | Coverage |
|-------|----------|-----|--------|-----------|---------|
| What score would a vendor with 3% rebate receive?… | rubric-rebates, vendor-scoring | rubric-l1-member, rubric-rebates | 100% | 33% | 100% |
| How is the vendor weighted score calculated?… | vendor-scoring | vendor-scoring, vendor-scoring | 100% | 50% | 100% |
| What does a score of 10 mean for IMAP?… | rubric-imap, vendor-scoring | rubric-dtc, rubric-imap | 100% | 50% | 100% |
| What is the freight free threshold for a score of 7?… | rubric-freight, vendor-scoring | rubric-freight, rubric-freight | 100% | 100% | 100% |
| What is L1 membership in the scoring system?… | rubric-l1-member, vendor-scoring | rubric-lights-america, vendor-scoring | 100% | 67% | 100% |
| How does DTC behavior affect vendor score?… | rubric-dtc, vendor-scoring | rubric-dtc, rubric-imap | 100% | 33% | 100% |
| What are the tier boundaries for vendor scoring?… | vendor-scoring | vendor-scoring, vendor-scoring | 100% | 50% | 100% |
| What is the rep score rubric?… | rubric-rep-score, vendor-scoring | rubric-rep-score, rubric-discounts | 100% | 67% | 100% |
| How are marketing funds scored?… | rubric-marketing-funds, vendor-scoring | rubric-marketing-funds, vendor-scoring | 100% | 67% | 100% |
| What display discount earns a score of 8?… | rubric-display, vendor-scoring | rubric-display, rubric-rebates | 100% | 33% | 100% |
| What CRI is required for retail lighting?… | cri-tm30-tlci, lighting-reference | cri-tm30-tlci, dimming-protocols | 100% | 33% | 100% |
| What footcandle level is needed for a warehouse?… | lumen-output-commercial, lighting-reference | lumen-output-commercial, sop-quote-creation | 100% | 33% | 100% |
| What color temperature for a restaurant?… | color-temperature-selection, lighting-reference | color-temperature-selection, cri-tm30-tlci | 100% | 50% | 100% |
| How long must emergency lighting last on battery?… | emergency-lighting-compliance, lighting-reference | emergency-lighting-compliance, emergency-lighting-compliance | 100% | 50% | 100% |
| What is 0-10V dimming?… | dimming-protocols, lighting-reference | dimming-protocols, dimming-protocols | 100% | 100% | 100% |
| What is TM-30 Rg and what does it mean?… | cri-tm30-tlci | cri-tm30-tlci, cri-tm30-tlci | 100% | 50% | 100% |
| What footcandles for open office per IECC?… | lumen-output-commercial, lighting-reference | lumen-output-commercial, lighting-reference | 100% | 67% | 100% |
| When should I use DALI instead of 0-10V?… | dimming-protocols | dimming-protocols, dimming-protocols | 100% | 100% | 100% |
| What questions should I ask a new vendor rep?… | sop-rep-outreach, sop-vendor-onboarding | sop-rep-outreach, ADR-006 | 100% | 33% | 100% |
| How do I onboard a new vendor to AccentOS?… | sop-vendor-onboarding | sop-vendor-onboarding, sop-vendor-onboarding | 100% | 50% | 100% |
| What margin should I target on a commercial quote?… | sop-quote-creation | sop-quote-creation, dimming-protocols | 100% | 50% | 100% |
| When should I escalate a rep issue to vendor management?… | sop-rep-outreach | sop-rep-outreach, paul-graf | 100% | 33% | 100% |
| What are the steps to convert a quote to a job?… | sop-quote-creation | sop-quote-creation, overview | 100% | 33% | 100% |
| How do I handle a rep score that drops below 4?… | sop-rep-outreach, rubric-rep-score | sop-rep-outreach, sop-rep-outreach | 100% | 100% | 100% |
| What is the file size trigger for splitting AccentOS?… | ADR-004, source-build-intelligence | ADR-004, ADR-004 | 100% | 50% | 100% |
| How does the CSV import flow work in AccentOS?… | source-build-intelligence | overview, rubric-credit-terms | 100% | 33% | 100% |
| Why does AccentOS use vanilla JS instead of React?… | ADR-002 | ADR-002, ADR-002 | 100% | 50% | 100% |
| How does the goTo dispatcher work?… | ADR-004, ADR-002 | ADR-004, ADR-004 | 100% | 50% | 100% |
| What is the AccentOS database?… | ADR-001, overview | overview, ADR-001 | 100% | 100% | 100% |
| What is the Karpathy wiki pattern?… | karpathy-llm-wiki, ADR-007 | karpathy-llm-wiki, source-karpathy-llm-wiki | 100% | 67% | 100% |
| Why was wiki-first RAG chosen over pgvector?… | ADR-007, karpathy-llm-wiki | karpathy-llm-wiki, overview | 100% | 33% | 100% |
| Who are the AccentOS team members?… | overview, michael-graf | overview, overview | 100% | 50% | 100% |
| What is Michael Graf's role at Accent?… | michael-graf, overview | overview, overview | 100% | 100% | 100% |
| Who handles showroom management at Accent Lighting?… | paul-graf | paul-graf, sop-vendor-onboarding | 100% | 33% | 100% |
| What are the credit terms rubric thresholds?… | rubric-credit-terms, vendor-scoring | rubric-credit-terms, vendor-scoring | 100% | 67% | 100% |
| What return policy earns a high vendor score?… | rubric-returns, vendor-scoring | rubric-display, rubric-rebates | 100% | 33% | 100% |
| Why is Row-Level Security used in AccentOS?… | ADR-001 | ADR-001, color-temperature-selection | 100% | 33% | 100% |
| What is the AccentOS data isolation strategy for customer mo… | ADR-006, ADR-001 | ADR-006, ADR-006 | 100% | 50% | 100% |
| How does AccentOS handle authentication?… | ADR-001 | ADR-001, overview | 100% | 33% | 100% |
| What emergency lighting battery runtime is required by code?… | emergency-lighting-compliance | emergency-lighting-compliance, emergency-lighting-compliance | 100% | 50% | 100% |

## Notes

- Latency, cost, and maintenance scores are estimated (wiki path vs pgvector comparison).
- Wiki path: ~50ms fetch + 0-10V inject overhead; pgvector: ~200ms embed + query.
- Recall = any expected slug in top-3; Precision = expected slugs / top-3 count.
- Coverage = expected slugs exist in wiki at all.

## Related

[[ADR-007]] · [[karpathy-llm-wiki]]