# detection.md — Mode detection & transition validation

This document is consulted in two scenarios:

1. **Bootstrap** — `repo-manifest.json` is missing or corrupt. Need to pick an initial mode.
2. **Vague request** — operator described intent without naming a mode (e.g. "clean this up", "get this ready"). Need to recommend.

Detection is **always best-effort**. The manifest is authoritative once it exists; detection only seeds it.

---

## Step 1 — Decision tree

Run from top to bottom. Stop at the first match.

```
Is the repo broken?
  - Tests fail catastrophically OR build is broken OR working tree is corrupted
  → recovery
  
Is there an explicit "we are about to ship" intent?
  - Operator said: "ship", "release", "deploy", "go live", "production"
  → deploy-prep

Is there an explicit "we are stopping" intent?
  - Operator said: "freeze", "lock down", "no more changes" → freeze
  - Operator said: "pause", "stop for now", "step away" → pause

Is there an explicit "transferring ownership" intent?
  - Operator said: "hand off", "give this to [agent/person]", "transfer"
  → handoff

Is there an explicit "resume from a stop" intent?
  - Manifest mode is pause OR freeze AND operator wants to work again
  → resume (will pass through audit first via safe-resumption workflow)

Is there an explicit "evaluate" intent?
  - Operator said: "audit", "review", "assess", "what's the state of this"
  → audit

Is there an explicit "extract this part" intent?
  - Operator said: "split this out", "extract X to its own repo", "carve off"
  → extraction-prep

Is there an explicit "change governance" intent?
  - Operator said: "change ownership rules", "new approval process", "migrate to org X"
  → governance-transition

Is there an explicit "experimental, isolated" intent?
  - Operator said: "experiment", "try this", "spike", "POC"
  → sandbox

Is the repo in an unhealthy steady state but not broken?
  - Failing lint, dirty working tree, partial WIP, drift between docs and code
  → stabilize

None of the above?
  → state-report only (no transition); ask operator to clarify.
```

---

## Step 2 — Transition validation table

A mode transition is **valid** only if listed here. Anything else requires going through an intermediate mode.

| From → To | Valid? | Notes |
|---|---|---|
| (any) → sandbox | yes | Always allowed; sandbox is isolated |
| (any) → audit | yes | Read-only; cannot harm |
| sandbox → stabilize | yes | Promote experimental work |
| sandbox → (anything else) | no | Must go through stabilize first |
| stabilize → pause | yes | clean-pause workflow |
| stabilize → freeze | yes | usually via deploy-prep |
| stabilize → deploy-prep | yes | deployment-preparation workflow |
| stabilize → extraction-prep | yes | architecture-extraction workflow |
| stabilize → governance-transition | yes | governance-migration workflow |
| stabilize → handoff | yes | ai-handoff workflow |
| pause → resume | yes | safe-resumption workflow (passes through audit) |
| pause → handoff | yes | direct |
| pause → freeze | yes | escalation (e.g. pre-deploy lockdown extends pause) |
| pause → stabilize | no | use resume workflow instead |
| freeze → resume | no | must go freeze → pause → resume (intentional friction) |
| freeze → deploy-prep | yes | only when freeze was a pre-deploy lockdown |
| freeze → recovery | yes | if a frozen repo is found broken |
| freeze → handoff | yes | direct |
| handoff → (any) | yes | new operator inherits and chooses |
| resume → stabilize | yes | normal resumption |
| resume → audit | yes | escalation (resume revealed problems) |
| audit → (any except recovery) | yes | audit was read-only; results inform next mode |
| audit → recovery | yes | audit found brokenness |
| recovery → stabilize | yes | normal completion |
| recovery → freeze | yes | if recovery determined repo must lock down |
| deploy-prep → freeze | yes | typical: prepare, then freeze, then ship |
| deploy-prep → stabilize | yes | rollback if deploy was aborted |
| deploy-prep → recovery | yes | if prep revealed brokenness |
| extraction-prep → stabilize | yes | extraction completed (or aborted) |
| extraction-prep → freeze | yes | freeze before the actual split |
| governance-transition → stabilize | yes | normal completion |
| governance-transition → freeze | yes | freeze during transition (lock until done) |

**Invalid transitions** must go through `stabilize` (or `audit` for read-only inspection) first.

---

## Step 3 — Detection signals (when bootstrapping)

Used when no manifest exists and no explicit intent was given. Inspect the repo and apply these signals:

| Signal | Suggests mode |
|---|---|
| Recent commits, tests passing, clean working tree | stabilize (recommend declaring it) |
| Recent commits, tests failing, dirty working tree | stabilize (urgent) |
| No commits in last 30 days | pause (or freeze, ask operator) |
| Branch has WIP commit message | pause (with WIP recovery as part of resume) |
| Tag matches `v*-rc*` or release branch pattern | deploy-prep |
| Repo has `.archived` or similar marker | freeze |
| Single experimental file or untested directory | sandbox (path-scoped) |
| Repo has no tests, no CI, no docs | stabilize (with caveats) |
| Repo has a `MIGRATION.md` or `EXTRACTION.md` in flight | extraction-prep or governance-transition |

If no signal matches: default to **sandbox** + recommend operator declare an explicit mode.

---

## Step 4 — Confirmation gate

Detection always produces a **recommendation**, never a unilateral decision.

For LOW-risk recommended modes (sandbox, audit, stabilize): proceed with one-line note "detected → entering [mode]; correct if wrong."

For MEDIUM-risk (pause, freeze, handoff, resume): surface the recommendation + alternatives + ask for confirmation.

For HIGH-risk (deploy-prep, extraction-prep, governance-transition, recovery): always require explicit operator confirmation, even if detection is confident.

---

## Step 5 — Output format

When detection runs, produce:

```
## Mode detection

**Recommended:** [mode]
**Reason:** [1-2 line justification — which signal(s) triggered]
**Alternatives considered:**
  - [mode-alt-1]: [why not preferred]
  - [mode-alt-2]: [why not preferred]
**Risk tier of recommendation:** LOW / MEDIUM / HIGH
**Confirmation required:** yes / no
```

The operator can override with any other mode (subject to Step 2 transition validation).
