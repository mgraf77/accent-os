# Skill Feedback Queue

> Append-only log of PARTIAL and FAIL skill outcomes. Auto-populated by the Outcome Signal block in each skill's final step.
> Read by **skill-optimizer Step 0** (parallel with git history check) to seed brainstorm loops with real-world failure data.
> Read by **skill-finder** (planned) to route: optimizer (fix existing skill) vs. forge (build a replacement).

---

## Entry Format

```markdown
## [YYYY-MM-DD] [skill-name] — FAIL | PARTIAL

**Trigger used:** "[exact phrase]"
**Goal:** [what was intended]
**Gap:** [what was missing or wrong — be specific]
**Fix direction:** optimize | rebuild | adjust-input | out-of-scope
**Optimizer run:** YES (pass [N], [date]) | NO
```

---

## How skill-optimizer uses this file

Step 0 reads this file in parallel with git history. For each FAIL/PARTIAL entry matching the target skill:
- Gap descriptions seed the brainstorm "real-world failure" pool (labeled `[FEEDBACK: real failure]`)
- Fix directions influence weight calibration (e.g. multiple "gap: accuracy" entries → suggest accuracy-heavy profile)
- Optimizer-run status prevents duplicate optimization of already-addressed failures

---

## How to add an entry

Skills emit PARTIAL/FAIL outcome blocks automatically at run end. To manually log:
```
"log skill failure: [skill-name] — [gap description]"
```

---

<!-- Entries appended below -->
