# educational-synthesis — feedback log

> Append-only ledger of issues / shallow output / missed concepts / validation failures from real synthesis runs. Used to drive self-improvement of the skill itself.
>
> Write entries at the end of Step 13 (per SKILL.md self-improvement logging rule). Read entries at the start of Step 0 (preflight) of future runs.

## Schema

```markdown
### feedback-NNN — YYYY-MM-DD — [topic-slug]
- mode: [active mode]
- issue_class: [sparse-input | validation-retry | analogy-gap | mode-reroute | shallow-output | missed-concept | misconception-missed | other]
- what_happened: [one sentence]
- root_cause: [one sentence]
- fix_this_run: [what was done in-flight]
- prevention_rule: [single normalized sentence — same wording for same problem class]
- applied_to_skill_md: no
- outcome: [shipped | shipped_with_failure | aborted]
```

NNN is sequential. `applied_to_skill_md` flips to `yes` when the lesson lands as an Edit to SKILL.md or supporting files.

## Self-optimization rule

After appending an entry, scan the full log. If any `prevention_rule` line (exact string match) appears in ≥3 entries with `applied_to_skill_md: no`, propose an Edit to the relevant skill file in the next session's preflight output. Do not auto-edit — surface the proposal and let Michael approve.

The threshold of 3 is deliberate. One occurrence is noise; two might be coincidence; three is a pattern that justifies changing the skill.

## Issue classes (canonical wordings)

Use these exact strings in `issue_class` so the self-optimization rule can pattern-match:

- `sparse-input` — Step 1 fallback triggered because no source + no AccentOS context
- `validation-retry` — Step 10.5 check failed and required a fix
- `analogy-gap` — a Core concept couldn't get ≥2 analogies (forced "irreducibly novel" flag)
- `mode-reroute` — user requested concept-map but topic had no relationships → re-routed to deep-dive
- `shallow-output` — Michael flagged the deep-dive as shallow / not teaching
- `missed-concept` — a Core concept was missed in Step 2 inventory and surfaced later
- `misconception-missed` — a common misconception was not caught in Step 10 generation and Michael flagged it
- `other` — use sparingly; prefer adding a new canonical class when the same `other` appears 2+ times

## Common preventions (normalized wordings)

Use these exact strings in `prevention_rule` for the corresponding issue class:

| issue_class | prevention_rule |
|-------------|-----------------|
| sparse-input | "Always WebSearch top 2 distinctive variants before asking Michael for source." |
| validation-retry | "Run the failing Step 10.5 check first on next synthesis of similar shape topic." |
| analogy-gap | "Treat 'irreducibly novel' flags as topic shape signals — concept-map mode often fits better." |
| mode-reroute | "Add a Step 0 sub-check: scan Step 2 concept count + Step 3 hierarchy before confirming mode." |
| shallow-output | "Increase Step 5 (10 internal questions) depth — answer each in 2+ sentences, not 1." |
| missed-concept | "Re-read source after Step 3 and challenge: 'what's NOT in my hierarchy that the source shows?'" |
| misconception-missed | "After Step 10, do a final scan: 'what would a smart person mistakenly conclude from layers 1–3?'" |

## Entries

_(empty — first synthesis run will populate)_
