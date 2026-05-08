---
name: registry-validator
description: >
  AccentOS executor-registry contract validator — diffs
  `skills/action-queue/references/executor-registry.md` against each
  bound executor skill's actual SKILL.md (action_type accepted, payload
  shape, return-shape contract) for the Accent Lighting agentic stack on
  Supabase hsyjcrrazrzqngwkqsqa. Catches three drift classes BEFORE they
  hit production: (1) registry hallucination — registry binds an
  action_type the skill never declares; (2) orphan executor — skill
  declares an action that no registry row routes to it; (3) payload-shape
  drift — field names, required-vs-optional, or jsonb shape disagree
  between registry-claim and skill-declaration. Exists because gap-run-002
  surfaced klaviyo-flows incorrectly bound to `send_klaviyo_flow` while the
  skill is read+propose-only — a contract bug only visible at the
  inter-skill boundary surface. Use this skill when Michael says: "validate
  the registry", "registry drift", "executor mismatch", "/registry-check",
  "are the executors aligned", "check the registry", "audit executors", or
  any phrasing that asks whether the action-queue executor bindings still
  match reality. Do not use this skill to add new executors (forge the
  executor skill, then update the registry by hand) or to modify the
  registry (read-only — flags drift, never patches it). Always emits a
  triage table (registry row, skill row, mismatch type, severity, suggested
  fix) plus a green-row count — never silently passes a drifted binding,
  never edits action-queue or any executor skill, never re-routes an
  action_type without Michael's explicit registry edit.
---

# registry-validator

**Purpose:** Be the always-available contract checker between `action-queue`'s executor registry and the executor skills it routes to — so the inter-skill boundary that gap-run-002 caught at klaviyo-flows (`send_klaviyo_flow` bound but unsupported) gets flagged automatically before the next APPROVED row hits a refusing executor.

> Naming note: the gap-optimizer queue spec called this "executor-registry-validator" (27 chars, over the 25-char skill-name limit). Renamed to **registry-validator** (18 chars) to comply with `skill-forge` template rules. Scope is unchanged — full purpose is documented in this SKILL.md so the rename loses no meaning.

Closes: action-queue Step 5 contract surface · gap-run-002 wave-2 cross-skill discipline finding ("issues only visible at the inter-skill boundary surface") · feeds skill-health-monitor's `dead-companions` audit with executor-binding deltas.

---

## Trigger Recognition

Run this skill when Michael says anything like (lowercase, terse, knock-out / fire register per `vibe-speak/profiles/michael.md`):
- "validate the registry" / "validate registry" / "validate the executor registry"
- "registry drift" / "is the registry drifted" / "registry diff" / "diff the registry"
- "executor mismatch" / "executor drift" / "are the executors aligned" / "do the executors match"
- "/registry-check" / "/registry-validate" / "/registry-diff" / "/registry"
- "check the registry" / "audit the registry" / "audit executors"
- "is action-queue still aligned" / "did the executor contract drift"
- "which action_type is broken" / "registry sanity check" / "sanity check the registry"
- "knock out the registry check" / "fire the registry validator" / "run the registry check"
- "any executors broken" / "are any executors broken" / "broken executors"
- "did the registry drift" / "is the registry still good" / "registry still aligned"

Also auto-trigger when:
- `skill-forge` lands a new executor skill (new SKILL.md added under `skills/` whose frontmatter includes `action_type:` declarations) → the parent agent calls this skill to confirm the new binding aligns with `executor-registry.md`.
- `skill-health-monitor` Step 4 (companion-link audit) finds a registry row pointing to an executor skill — it delegates the contract check here rather than re-implementing.
- `action-queue` Step 5 returns `{"error": "action_type not supported by this executor"}` — that error path's receipt should suggest "run registry-validator to find the binding bug."

Do **not** trigger for: forging a new executor (use `skill-forge`), editing the registry (Michael does this by hand in `executor-registry.md`), or generic skill-health audits (use `skill-health-monitor`).

---

## Step 0 — Preflight (parallel reads)

Run in parallel:

1. Read `/home/user/accent-os/skills/action-queue/references/executor-registry.md` — the source of truth for action_type → executor bindings + payload shape claims + return-shape claims. If missing or unreadable, abort with `error: executor-registry.md missing — re-clone action-queue skill` and stop. Validating against an absent registry would silently pass everything.
2. Read `/home/user/accent-os/skills/action-queue/SKILL.md` — extract Step 5's stated executor-result contract (the success / partial / failure JSON shapes every executor must return). The registry promises this contract; this skill verifies executors honor it.
3. Read `references/diff-rules.md` — the three diff classes + severity assignment + suggested-fix grammar.
4. Read `references/executor-skills.md` — the canonical list of executor skill directories the registry binds to (`email-drafter`, `coop-claim-drafter`, `bc-rest-bridge`, `klaviyo-flows`, `alert-router`, plus any added since the last refresh). This list is **regenerated each run from the registry** — it is a cache, not a hardcode.
5. Verify `/home/user/accent-os/skills/` is readable and contains a directory for every executor referenced in the registry. If a referenced executor directory is missing → that's an immediate **BLOCKING** finding (registry binds to a skill that doesn't exist on disk).

**Failure-path notes:**

- **Registry parse failure** (markdown table malformed, missing column header, non-ASCII corruption): abort Step 1 with `error: registry-validator could not parse executor-registry.md row [N] — fix the markdown table syntax then retry`. Do not guess columns. A parser-tolerant pass would silently mis-attribute action_type bindings.
- **Executor skill SKILL.md missing or frontmatter unparseable**: log as a BLOCKING finding for that row, surface in the triage table with `skill_row = "[unreadable: parse error / file missing]"`, continue with remaining executors. Never abort the whole run for one bad skill.
- **Concurrent action-queue execution mid-validation**: the validator is read-only — no race exists against action-queue itself. But if `executor-registry.md` is being edited (file mtime within last 5 seconds), surface a one-line trailer `_warning: registry edited <Ns> ago — re-run after edit lands_` and continue with the as-read snapshot.

---

## Step 1 — Parse the registry into a normalized table

Walk the markdown table under `## Registry — current bindings` in `executor-registry.md`. Extract one row per binding:

```
{
  "action_type": "send_email",
  "executor_skill": "email-drafter",
  "what_it_does": "Composes and saves a draft email...",
  "payload_shape_claim": { "to": "[...]", "cc": "[...]", "subject": "str", ... },
  "registry_line_no": 15
}
```

Notes:
- Payload-shape claim is the JSON-ish object in the registry's "payload shape" column. Parse loosely (single-quoted keys, trailing-comma tolerance, `?` for optional, `|` for unions). Record raw text alongside the parsed shape so the receipt can quote both.
- If the same `action_type` appears in multiple registry rows (registry duplicate), flag as a separate **BLOCKING** finding before Step 2 runs — duplicate bindings let the wrong executor win the routing race.
- If an `action_type` appears in `executor-registry.md`'s "How action-queue invokes the executor" pseudocode but not in the registry table, treat as registry incomplete — surface as **WARN**.
- If a payload-shape cell fails to parse cleanly (truncated brackets, unmatched quotes, malformed union syntax), keep the row in the binding list with `payload_shape_claim = null` and add a **parse warning** finding with severity WARN. Step 3 then skips payload-shape-drift detection for that row but still runs all other diff classes — never drop the row entirely. Surfacing the parse warning is the failure-visible path; silently passing the row is the bug.
- If the registry's executor name has whitespace, mixed case, or obvious typos that don't match any directory under `skills/`, surface as **BLOCKING** with `Skill says = "[no skills/<name>/ directory found]"` and `Suggested fix = "Edit executor-registry.md row [N]: fix executor name typo OR forge the missing skill."`

Output of this step (internal): the normalized binding list. Number of rows logged in the final receipt.

---

## Step 2 — Parse each executor skill's declared contract

For each unique `executor_skill` from Step 1:

1. Read `/home/user/accent-os/skills/<executor>/SKILL.md`.
2. Extract the declared **input contract** — search for any of these markers (in priority order, take the first match):
   - An explicit `## Step 0` or `## Step 1` block whose payload shape is documented as a JSON code block or table.
   - Frontmatter `description:` lines listing `action_type` literals (e.g. bc-rest-bridge mentions `update_bc_product` and `price_change_push` explicitly).
   - The `## Anti-patterns` block — refusal patterns like "refuse any payload not produced by an APPROVED action_queue row" indicate the skill IS an executor and accepts the registry-bound action_types.
   - For executor skills with mode-routing (e.g. klaviyo-flows: audit / propose / engagement modes), match against the **propose mode** subsection — that's the executor surface Step 5 of action-queue invokes.
3. Extract the declared **output contract** — search for the result-shape it returns:
   - Look for a `## Output format` or `## Step N — Return` block specifying the JSON shape returned to action-queue.
   - Compare against action-queue's required success / partial / failure shape (from Step 0 read of `executor-registry.md` "Result contract every executor must return" section).
   - If the executor's declared output omits `status`, `summary`, `duration_ms`, or the failure structure with `error.code` / `error.message` / `error.retryable` → flag as **WARN** (return-shape drift).
4. Extract any **explicit refusal patterns** the executor declares — phrases like "refuses `send_klaviyo_flow`", "refuse any direct write command", "Mode B propose only — never sends" indicate the skill will return `{"error": "action_type not supported"}` for action_types it doesn't actually execute. Record these as a refused-action-type list.

Output of this step (internal): per-executor declaration record:

```
{
  "executor_skill": "klaviyo-flows",
  "declared_action_types": ["propose_klaviyo_edit"],
  "refused_action_types": ["send_klaviyo_flow"],
  "declared_input_shape": { ... },
  "declared_output_shape": { "status": "...", "summary": "...", ... },
  "skill_md_line_no": 42,
  "parse_warnings": [...]
}
```

If parsing yields zero `declared_action_types` AND the executor is bound in the registry, surface a **BLOCKING** "registry says X executes Y but X's SKILL.md never declares Y" — this is the gap-run-002 klaviyo case made generic.

---

## Step 3 — Diff registry-claim vs skill-declaration

For each registry row from Step 1, find the matching executor record from Step 2 and apply the three diff classes from `references/diff-rules.md`:

| # | Diff class | Trigger | Severity | Suggested fix side |
|---|---|---|---|---|
| 1 | **registry-hallucination** | `action_type` in registry but executor skill doesn't declare it (and either explicitly refuses it, OR is silent on it) | BLOCKING if executor explicitly refuses · WARN if executor is silent | Edit registry: remove row OR re-bind to a different executor |
| 2 | **orphan-executor** | Executor skill declares it executes `action_type X` but no registry row binds X to it | INFO if X is a draft/internal action · WARN if X looks production-bound | Edit registry: add a binding row |
| 3 | **payload-shape-drift** | Registry's payload shape and executor's declared input shape disagree on field names, required-vs-optional, or value types | WARN by default · BLOCKING if a required field exists in one but missing in the other | Edit whichever side is wrong (specify) |

Plus two additional diff classes surfaced during Pass 2 hardening:

| # | Diff class | Trigger | Severity | Suggested fix side |
|---|---|---|---|---|
| 4 | **return-shape-drift** | Executor's declared output omits `status` / `error.code` / `error.message` / `error.retryable` from action-queue's required contract | WARN | Edit executor SKILL.md to declare full result contract |
| 5 | **registry-duplicate** | Same `action_type` bound to two different executors in the registry | BLOCKING | Edit registry: remove the duplicate row |

For each diff, build a finding record:

```
{
  "diff_class": "registry-hallucination",
  "action_type": "send_klaviyo_flow",
  "registry_executor": "klaviyo-flows",
  "registry_line_no": 18,
  "skill_declaration": "klaviyo-flows is read+propose only — refuses send_klaviyo_flow",
  "skill_line_no": 42,
  "severity": "BLOCKING",
  "suggested_fix": "Edit executor-registry.md row 18: remove send_klaviyo_flow OR re-bind to a forged send executor (does not exist yet)"
}
```

If two consecutive runs surface the same finding without a fix landing, escalate severity by one tier (INFO → WARN → BLOCKING) on the second run. Use the run-history cache in `references/last-run.md` (overwritten each run) to track this.

---

## Step 4 — Emit the triage report

Write the report to stdout (paste-ready Markdown) AND overwrite `references/last-run.md` with the same content for next-run history. See **Output format** below for the literal block structure.

If zero findings: emit the green-row report (one line per registry binding, all marked OK) — never collapse to "no issues found, ok". Michael wants visibility into what was checked, not just the diff. Silent green is indistinguishable from a broken validator.

---

## Step 5 — Surface to companion skills

Two outbound surfaces:

1. **skill-health-monitor**: append a one-line summary to `skills/skill-health-monitor/applied-fixes.md` at the bottom under a `## registry-validator findings` heading (create the heading if missing). Format: `[YYYY-MM-DD HH:MM] registry-validator: [N findings] — [N BLOCKING] [N WARN] [N INFO]`. This lets the next `/skill-health` run see registry-validator activity without re-running it.
2. **skill-performance-tracker**: do not write directly — performance-tracker reads PROMPT_LOG.md which captures this skill's invocation. Just emit the standard receipt; performance-tracker's match-rate aggregator picks it up.

Never modify `executor-registry.md`, never modify any executor SKILL.md, never modify `action-queue/SKILL.md`. The validator is **read-only on the skills/ ecosystem** by hard rule — the only writes it makes are to its own `references/last-run.md` and the appended one-liner to skill-health-monitor's applied-fixes log.

---

## Output format

```
═══ REGISTRY VALIDATOR — [date] ═══

Registry: skills/action-queue/references/executor-registry.md
Bindings parsed: [N rows]
Executor skills checked: [M]
Findings: [BLOCKING: x | WARN: y | INFO: z | OK: green-rows]

═══ BLOCK 1: TRIAGE TABLE ═══

| # | Severity | Diff class | action_type | Registry executor | Skill says | Suggested fix |
|---|----------|------------|-------------|-------------------|------------|---------------|
| 1 | BLOCKING | registry-hallucination | send_klaviyo_flow | klaviyo-flows | refuses (read+propose only) | Edit executor-registry.md row 18: remove send_klaviyo_flow OR re-bind to a forged send executor |
| 2 | WARN | payload-shape-drift | update_bc_product | bc-rest-bridge | declares `fields` (object); registry says `field_name` + `new_value` (split) | Edit executor-registry.md row 17 to match bc-rest-bridge's `fields` object shape |
| 3 | INFO | orphan-executor | (skill declares) churn_nudge | (no registry row) | churn-predictor declares churn_nudge | Add registry row binding churn_nudge → churn-predictor |

═══ BLOCK 2: GREEN ROWS (verified aligned) ═══

| action_type | executor | declared_input_match | declared_output_match |
|-------------|----------|----------------------|------------------------|
| send_email | email-drafter | ✓ | ✓ |
| claim_coop | coop-claim-drafter | ✓ | ✓ |
| route_alert | alert-router | ✓ | ✓ |

═══ BLOCK 3: ESCALATION (findings recurring across runs) ═══

| action_type | first_seen | runs_unfixed | severity_now | severity_first |
|-------------|------------|--------------|--------------|----------------|
| send_klaviyo_flow | 2026-05-01 | 3 | BLOCKING | WARN |

═══ BLOCK 4: NEXT ACTIONS ═══

- BLOCKING findings: [N] — fix before next action-queue execute run, or APPROVED rows for these action_types will fail at the executor with a refusal error
- WARN findings: [N] — fix this week, downstream payload may pass through but will surface as runtime confusion
- INFO findings: [N] — surface awareness only; no production impact
- Green rows: [N] — verified aligned at this snapshot
- Re-run cadence suggestion: weekly, OR after any skill-forge run that adds an executor

Receipt-line for skill-health-monitor: appended to skills/skill-health-monitor/applied-fixes.md
```

**Partial output (Pass-2 hardening):** if Step 2 fails to parse one or more executor SKILL.md files, the four-block structure still ships — failed executors appear in BLOCK 1 as BLOCKING with `Skill says = "[unparseable: <reason>]"` and `Suggested fix = "Re-pull skill repo / fix SKILL.md frontmatter"`. Never collapse to a single error; partial validator visibility beats silent abort.

---

## AccentOS context

- **Stack:** read-only across `/home/user/accent-os/skills/` filesystem; no Supabase calls, no API calls, no env requirements (this is a meta-infra skill that runs entirely against shipped SKILL.md files). Action-queue is built on Supabase `hsyjcrrazrzqngwkqsqa` — this skill validates the routing layer of that stack without touching the database.
- **Project:** AccentOS for Accent Lighting (residential lighting retailer, BC store `store-cwqiwcjxes`).
- **Paths:** `/home/user/accent-os/skills/registry-validator/` (Codespace alt: `/workspaces/accent-os/skills/registry-validator/`).
- **Source files read (read-only):**
  - `/home/user/accent-os/skills/action-queue/SKILL.md`
  - `/home/user/accent-os/skills/action-queue/references/executor-registry.md`
  - `/home/user/accent-os/skills/email-drafter/SKILL.md`
  - `/home/user/accent-os/skills/coop-claim-drafter/SKILL.md`
  - `/home/user/accent-os/skills/bc-rest-bridge/SKILL.md`
  - `/home/user/accent-os/skills/klaviyo-flows/SKILL.md`
  - `/home/user/accent-os/skills/alert-router/SKILL.md`
  - Any additional executor skill referenced in the registry's table column (auto-discovered, not hardcoded).
- **Companion skills:**
  - `action-queue` — subject of validation (read-only target). When this skill flags a BLOCKING binding, action-queue Step 5's "executor refuses" path is the production failure being prevented.
  - `skill-health-monitor` — composes with this skill: health-monitor handles structural skill audits (broken refs, dead companions), registry-validator handles contract audits. Receives a one-line append from this skill on every run.
  - `skill-performance-tracker` — registry-validator findings predict execution failures; performance-tracker's "harness considered but bypassed" leaderboard correlates with BLOCKING findings here.
  - `skill-forge` — when forge lands a new executor, the parent agent invokes this skill to confirm registry alignment before Michael invokes the new binding.

---

## Anti-patterns

- **Never modify `executor-registry.md`.** This skill is read-only on the registry by hard rule. Surface the suggested edit in BLOCK 1; let Michael apply it. Auto-patching the registry would let a bad parse silently re-route action_types.
- **Never modify any executor SKILL.md.** Same hard rule — surface the suggested edit, never apply. The validator's value depends on its read-only stance: if it can mutate the contracts it checks, it can mask its own bugs.
- **Never collapse a green run to "no issues."** Always emit BLOCK 2's green-row table — Michael needs to see what was checked, not just what failed. Silent-green and silent-broken-validator are indistinguishable.
- **Never skip an executor because its SKILL.md failed to parse.** Surface the parse failure as a BLOCKING finding and continue with the remaining executors. Half a validation report is recoverable; a silent abort isn't.
- **Never auto-extend the registry to add an orphan executor's declared action_type.** Orphan-executor diffs (class 2) are INFO/WARN with a suggested registry edit — never an automated insertion. Adding bindings without Michael's review is how the gap-run-002 klaviyo case originally happened in the other direction.
- **Never validate against a hardcoded list of executor skills.** The list is regenerated each run from `executor-registry.md`. Hardcoding it would mask the case where Michael adds a new executor row to the registry but forgets to forge the skill — that case must surface as BLOCKING.
- **Never silently swallow a payload-shape parse ambiguity.** The registry's payload shape column uses loose JSON-ish syntax. If a column can't be parsed cleanly, surface as a parse warning in BLOCK 1 — do not guess the field types. A wrong-guess validator pass is worse than a parse-error report.
- **Never escalate severity without run-history evidence.** The escalation tier (INFO → WARN → BLOCKING) requires a prior matching finding in `references/last-run.md`. First-run severity is set by `references/diff-rules.md`'s default table — escalation is an after-the-fact stickiness signal, not a first-run aggression.
- **Never silently pass a parse-warning row.** When the registry's payload-shape cell fails to parse cleanly, the row stays in the binding list but the parse warning MUST appear in BLOCK 1 with severity WARN. A "successful" run that hid the parse-warning is worse than an explicit unparseable-cell flag — Michael depends on the validator surfacing every reason a binding is unverifiable.
- **Never assume an executor's mode-routing default matches the registry's bound action_type.** Multi-mode skills (klaviyo-flows: audit / propose / engagement; alert-router: route / escalate / triage) route to different code paths. Step 2 must compare the registry-bound action_type against the **specific mode** that handles it — not the skill's overall capability surface. The gap-run-002 klaviyo case was exactly this trap (action-queue routed `send_klaviyo_flow` against a skill whose only executor mode is propose).
