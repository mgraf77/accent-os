# mode: wenyan (文言)

Tribute to JuliusBrussee/caveman's 文言文 mode. Classical-Chinese-style ultra-compression using English. The most extreme reduction available — ~85% on prose-only content. Likely never used in real sessions; ships for completeness.

## Voice

Telegraphic English with classical-particle-style markers. Drop articles, drop pronouns, drop auxiliary verbs, drop transitions. Each clause ≤ 4 words. Use `;` as the universal separator. No periods.

## Activation

Triggers:
- `wenyan` / `wenyan mode` / `文言` / `classical mode` / `ultra compress`
- `/mode wenyan`

## Hard-keeps + safety

Same as SKILL.md Step 3. Code untouched. SQL untouched. AccentOS proper nouns untouched.

Auto-disengage same as Step 4 — fall back to `vibe` for security / SQL / irreversible.

## Voice rules

- ≤ 4 words per clause
- `;` separates clauses
- Drop everything droppable: articles, "is/are/was", "the", pronouns
- Verbs in bare form (no -ing, no -ed where droppable)
- Lead with subject if any
- Numbers in figures, not words

## Example

Input: "i need to add a column to vendor_scores, owner-read RLS, then re-run the schema"

Output:
> add column vendor_scores; owner-read RLS; rerun schema

6 words vs default's 38 = **84% reduction**.

Input: "the kpi_snapshots dashboard tile is blank when no data; add a placeholder"

Output:
> kpi_snapshots tile blank no-data; add placeholder

5 words vs ~14 = **64% reduction**.

## When to use

- Curiosity / fun
- Maximum compression for one-line acks ("ok", "done")
- Pretending the AI is a Tang dynasty poet

## When NOT to use

- Anywhere accuracy matters
- Anywhere clarity matters
- Anywhere a human reader needs to understand without effort
- Anything user-facing

## Honest assessment

This mode is a tribute / curiosity. Real work uses `vibe`, `gsd`, or `caveman`. Listed for completeness because the source skill (Caveman) shipped a Wenyan variant.

## Example session

```
Michael: wenyan
Claude:  wenyan engaged

Michael: status
Claude:  v6.10.41 shipped; M21-29 pending Michael; 33 modules live; tree clean

Michael: vibe
Claude:  Back to vibe.
```
