# template: concept-inventory

> Step 2 output schema. The exhaustive list of concepts before Step 3 hierarchy filtering.

## Schema

```markdown
| # | concept | one-line definition | source anchor | type |
|---|---------|---------------------|---------------|------|
| 1 | [precise name] | [≤25 words] | [file:line OR section name OR URL fragment] | primitive |
| 2 | [precise name] | [≤25 words] | [anchor] | compound |
```

## Field rules

**concept** — Precise, not generic. "RFM-based segmentation" is precise; "customer segmentation" is generic. If the input uses a precise term, preserve it. If the input is fuzzy, sharpen the name.

**one-line definition** — ≤25 words. The first time a learner reads it, they should grasp the shape even if not the depth.

**source anchor** — Where in the input this concept appeared. For files: `path:line` or `section name`. For URLs: fragment / heading. For pure-topic-name input (no source file), write `derived` and note the AccentOS context source (BUILD_PLAN_CLAUDE.md, MASTER.md, etc.).

**type**:
- `primitive` — atomic; cannot be decomposed within the topic's frame
- `compound` — built from 2+ other concepts in this inventory

## Minimum count

≥10 rows for any non-trivial topic. If your inventory has <10, you stopped early — re-read the source and surface more.

## Aggressive surfacing rule

Step 2 is exhaustive surfacing, not filtering. Include:
- Every named primitive in the source
- Every implicit primitive that isn't named but is doing work in the source
- Every workflow step
- Every decision criterion
- Every tradeoff (a tradeoff is a concept)
- Every assumption the source makes
- Every edge case the source acknowledges
- Every related concept the source references but doesn't explain

Do NOT pre-filter for relevance — Step 3 builds the hierarchy and filters.

## Example (vendor probability model)

```markdown
| # | concept | one-line definition | source anchor | type |
|---|---------|---------------------|---------------|------|
| 1 | 8-factor weighted model | scoring fn combining 8 input signals into deal-close probability | js/pipeline.js:computeDealProbability | compound |
| 2 | lead source weight | 10% factor — origin of the lead (referral / cold / website) | js/pipeline.js:weights | primitive |
| 3 | customer history weight | 18% factor — past buying frequency × monetary | js/pipeline.js:weights | primitive |
| 4 | RFM segment weight | 8% factor — VIP / Active / Lapsed / Lost / Prospect bucket | js/customers.js:rfm | compound |
| 5 | project type weight | 10% factor — residential / trade / commercial | js/pipeline.js:weights | primitive |
| 6 | quote age weight | 12% factor — days since last quote sent | js/pipeline.js:weights | primitive |
| 7 | comm recency weight | 12% factor — days since last customer interaction | js/pipeline.js:weights | primitive |
| 8 | quote size weight | 10% factor — $ size of pending quote | js/pipeline.js:weights | primitive |
| 9 | stage weight | 20% factor — pipeline stage (lead → won) | js/pipeline.js:weights | primitive |
| 10 | factor breakdown UI | per-deal modal showing each factor's contribution | js/pipeline.js:openDeal | compound |
| 11 | recalibration debt | model produces relative ordering even with bad absolute % until probability_model_log accumulates real win/loss | BUILD_INTELLIGENCE.md:1.5 | primitive |
| 12 | weighted forecast | Σ(value × probability) on Pipeline header | js/pipeline.js:render | compound |
```

12 rows for what looks like a "simple" probability model. The exhaustive surface includes the implicit ones (recalibration debt, weighted forecast — both load-bearing for understanding, neither named explicitly in the spec).
