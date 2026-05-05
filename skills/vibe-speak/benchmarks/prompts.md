# vibe-speak — benchmark prompts

> 8 representative prompts used to measure compression ratios across all 9 modes. Run by `/vibe kpi run` (computes current results.md). Used both as documentation and as regression checks.

## Selection criteria

Prompts cover:
- Range of complexity (1-step → 6-step)
- Range of jargon density (low → high)
- Different signal types (closure, autonomy, normal, learning, exec)
- Different modes' strengths (gsd-friendly vs vibesplain-friendly)

## The 8 prompts

### P1 — short technical request
> i need to add a column to vendor_scores, owner-read RLS, then re-run the schema

Signals: action verb chain, low jargon, hard-keep heavy.
Best for: vibe / gsd / caveman.

### P2 — bulk-build request with autonomy signal
> build the customers bulk-CSV import — pattern from inventory CSV, parse → preview → commit. don't interrupt me, just ship it.

Signals: autonomy ("don't interrupt"), hard-keeps (CSV / inventory).
Best for: gsd (autonomy auto-switches).

### P3 — debug / diagnosis
> the kpi_snapshots dashboard tile is blank when no data, what's happening and how do i fix

Signals: bump-up ("how do i"), question form.
Best for: pair (proactive trap-spotting) or teach.

### P4 — wrap session
> wrap session, commit and push, status block at the end

Signals: end-of-session ritual, status request.
Best for: vibe (Step 11 ritual fires automatically).

### P5 — explanation request
> explain how M21 schema migration interacts with vendor_scores

Signals: bump-up ("explain"), AccentOS proper noun.
Best for: teach (educational mode).

### P6 — stakeholder writing
> draft a 3-paragraph customer email about the warranty tracker rollout

Signals: external audience implied.
Best for: executive (formal voice).

### P7 — long autonomous build
> build out 5.16 calendar like the plan says, then 5.17, then commit

Signals: multi-step, autonomy ("then ... then").
Best for: gsd.

### P8 — playful / lols
> walk me through every single thing you do in the next 3 tool calls, im bored and want commentary

Signals: explicit narration request.
Best for: vibesplain.

## How to run

`/vibe kpi run` reads this file, generates a fresh `results.md`, and appends a summary entry to `kpi-log.md`. Manual: walk each prompt through each mode mentally, write the output, count words, fill the table.

## Why 8 not 100

Diminishing returns above ~10. The variance between similar prompts in the same mode is small enough that 8 covers the design space. Add more if a category is missing.
