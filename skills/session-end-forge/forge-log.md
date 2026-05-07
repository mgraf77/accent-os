# session-end-forge — Forge Log

> Append-only ledger of every session-end-forge invocation. Read at next session boot to track forge effectiveness over time. Schema enforced by `SKILL.md` Step 12.

## Schema

```
### forge-NNN — YYYY-MM-DD HH:MM — [skill-name] — [stage]
- session-signature: [one-line description of recurring process]
- occurrences-this-session: N
- pass-1-score: NN/100
- pass-2-score: NN/100
- pass-3-score: NN/100   (only if Pass 3 ran)
- pass-4-score: NN/100   (only if Pass 4 ran)
- final-score: NN/100
- passes-run: K
- rounds-requested: N    (count of times Michael said yes to "another round?" — Step 7 gate)
- portable-variant: yes | no | n/a
- portable-path: skills/[skill-name]/portable/SKILL.md   (only if portable-variant=yes)
- optimization-review-summary: [one-line — full block in Step 11 report]
- outcome: shipped | shipped_with_warning | aborted_low_score | declined | aborted_signature_thin | aborted_duplicate
- skill-path: skills/[skill-name]/   (only if shipped)
- commit: [SHA short]    (only if shipped)
```

`stage` enum: `Pass 1 | Pass 2 | Pass 3 | Pass 4 | FINAL | DECLINED | ABORTED`. Per-pass entries (Pass 1, Pass 2, etc.) capture intermediate scores; FINAL is the closing entry per forge run. `DECLINED` runs still log `optimization-review-summary` (Step 9 is mandatory).

NNN sequential across all stages of all runs (i.e. Pass 1 of run 1 = forge-001, Pass 2 of run 1 = forge-002, FINAL of run 1 = forge-003, Pass 1 of run 2 = forge-004, etc.).

---

## Self-audit triggers

Every 10 entries with `stage=FINAL`, scan the `final-score` distribution and append an audit annotation:

```
#### audit-NNN — YYYY-MM-DD — N entries scanned
- shipped: N (NN%)
- aborted_low_score: N (NN%)
- declined: N (NN%)
- final-score median: NN
- final-score in 85–87 just-passing band: N (NN%)
- recommendation: [tighten | loosen | hold] threshold
```

If >50% shipped scores are 85–87, recommend tightening (rubric too forgiving). If <30% of yes-answers ship, recommend loosening (rubric too harsh). Both are surfaces for review, not auto-applied.

---

## Entries

_(none yet — first run will append here)_
