# vibe-speak — skill router

> Detection + routing logic for "is there an existing AccentOS skill that handles this task better than brute-forcing it?" Referenced by SKILL.md Step 23.

## The problem

Without skill discovery, every task gets brute-forced from scratch. Even if `bc-business-review` exists and Michael says "give me the weekly numbers," default Claude reads docs ad-hoc and produces a one-off report. The skill exists; it goes unused.

## The fix

At the start of every non-trivial task, check `skills/_index.md` for a match. Surface the skill suggestion BEFORE doing the work.

---

## Detection logic

### Step 1 — Trigger evaluation

Run when ANY of these are true:

- Michael's input contains: `find a skill`, `is there a skill`, `what's the best way`, `better way`, `easier way`, `existing skill`, `tool for this`
- Michael's input contains a noun phrase that matches a skill's primary domain (vendor, kpi, schema, doc-drift, gmc, etc.)
- The about-to-execute task plan has ≥3 tool calls AND the task description has ≥3 nouns matching skill registry entries
- Manual: `/vibe find skill [topic]`

If none of the above, no check fires; proceed normally.

### Step 2 — Match scoring

For each skill in `skills/_index.md`:

```
match_score(skill, request) =
  + 0.4 if any trigger phrase appears verbatim in request
  + 0.3 if ≥2 keywords from skill summary appear in request
  + 0.2 if domain noun (vendor / kpi / schema / etc.) matches skill's primary domain
  + 0.1 if companion skill is also matched (clusters of related work)
  − 0.3 if request matches the skill's `when_NOT` exclusion criteria
  − 0.2 if request mentions another skill explicitly (skill-name conflict)
```

Range: 0.0 to ~1.0. Threshold for surfacing: ≥0.5.

Multiple matches: rank by score, surface top 1 if clearly leading (gap ≥0.2), top 2 if close.

### Step 3 — Surfacing format

**Single high-confidence match:**

```
Looks like a fit for `[skill-name]` — [1-line summary].
[matched_trigger / matched_keyword]
Run it? (yes / no / show details)
```

**Multiple matches:**

```
Two skills could fit:
- `[skill-A]` — [why this fits] (score: X)
- `[skill-B]` — [why this fits] (score: Y)
Pick one, both, or "neither" to brute-force.
```

**No match but task is routine:**

```
No existing skill matches this kind of task. Options:
1. Brute-force it now (proceed normally)
2. Spawn skill-forge to build a new skill, then use it
"brute" / "forge" / "either"?
```

**No match and task is one-off:**

Silent — proceed brute-force, log a `brute_force` observation per Step 13.

### Step 4 — Michael's response

| Response | Action |
|---|---|
| `yes` / skill name / "run it" | Invoke that skill, deactivate brute-force path |
| `no` / `brute` / "just do it" | Proceed brute-force, log `brute_force` signal |
| `show details` / `tell me more` | Print the skill's full SKILL.md description before deciding |
| `forge` | Invoke skill-forge to build a new skill matching the task |
| `both` (multi-match case) | Run both skills, surface combined result |
| no response in plain prose | Treat as `no` — Michael's getting on with the work |

---

## Pattern detection (the self-improving loop)

### What we track

Every time a `brute_force` signal fires (no skill matched, task was routine), append to observation-log:

```
### obs-NNN — YYYY-MM-DD — brute_force
- signal_type: brute_force
- signal_target: [normalized task description, ~10 words]
- michael_said: "[exact request]"
- claude_was_doing: [list of tool calls that resolved the task]
- proposed_profile_change: (n/a — proposes a new skill, not a profile edit)
- applied_to_profile: yes (auto-applied as logged; profile not edited)
- proposal_surfaced: [date when ≥3 same-target accumulate]
```

### What triggers a new-skill proposal

When ≥3 brute-force entries share the same `signal_target` (or fuzzy-match within 70% similarity) AND none has `proposal_surfaced` within last 14 days, surface:

```
═══ VIBE-SPEAK SKILL PROPOSAL ═══
Pattern detected: "[task description]" — N times across M sessions
Suggestion: spawn skill-forge to build a reusable skill for this.

Proposed skill name:    [auto-generated 1–3 word slug]
Proposed description:   [1-line summary inferred from the brute-force history]

Approve:  /vibe forge skill from pattern
Modify:   /vibe forge skill from pattern — name=X, desc=Y
Skip:     /vibe skip skill proposal (suppresses re-surface for 14 days)
```

If Michael approves, vibe-speak invokes `skill-forge` with the proposed name + description, and the result becomes a new entry in `skills/_index.md`.

### Why this matters

The brute-force loop is the system's growth point. Every brute-force is data — either "this should be a skill" or "this is genuinely one-off." Pattern detection promotes the routine into reusable; one-offs stay as one-offs.

Over time, the skill ecosystem grows in the directions Michael actually works.

---

## Anti-patterns

- **Never** auto-invoke a skill without surfacing first. Wrong skill = wasted tokens AND lost trust.
- **Never** propose a new skill from a single brute-force. The 3-pattern threshold is the bar.
- **Never** propose a skill for a one-off task ("audit this one CSV file") even if no existing skill matches. Routine ≠ recurring.
- **Never** override skills/_index.md auto-generated content with manual edits unless explicitly noted as override. Drift = bad routing.
- **Never** match on partial trigger words. "vendor" alone is weak; "vendor cascade" is strong. Multi-word triggers > single keywords.
- **Never** suggest skill-forge when an existing skill is already a clear match. The order is: existing skill > brute-force > forge new.
- **Never** skip the brute-force option in the multiple-match surface. Sometimes the user wants to bypass all suggestions.
- **Never** infinite-loop: if `brute_force` is surfaced + accepted, don't re-fire skill-router on the next subtask of the same brute-force.

---

## Test cases

Self-tests for the router (mental dry-run):

1. "weekly business review for AccentOS" → matches `bc-business-review` (high confidence, single match) → surface
2. "audit the GMC feed for broken images" → matches `gmc-feed-audit` (high confidence) → surface
3. "vet this community skill before I install it" → matches `community-skill-vet` (high confidence) → surface
4. "look into the dbt repo and build me something useful" → ambiguous between `repo-scout` and `skill-forge` → surface both with disambiguation
5. "fix typo in line 47 of customers.js" → no skill matches (one-off) → silent brute-force
6. "audit a CSV file" → matches `table-eda` weakly (~0.35) → below threshold → silent brute-force, log `brute_force`
7. "find a skill for [arbitrary thing]" → run router explicitly, surface best match or "no match found"
8. After 3 sessions of "audit a CSV file" brute-forces → surface skill proposal: "csv-audit"

These test cases get re-run via `/vibe replay` if the router logic changes.

---

## Costs

Token cost of router check per turn: ~200 tokens (read `_index.md` once per session, ~3k cached; per-turn match check is just keyword lookup against in-memory cache).

Latency: negligible if `_index.md` is already in the prompt cache.

Net token effect: positive when ≥1 skill match per session (saves ~5–20× the brute-force cost). Negative when 0 matches (router cost without payoff). Average over typical Michael session: ~3-5× net savings.

## When to disable

Router can be disabled per-session: `/vibe router off`. Re-enable: `/vibe router on`. Disabled state logs to feedback-log; if disabled 3+ sessions in a row, surface "the router seems unhelpful — should we adjust thresholds?"
