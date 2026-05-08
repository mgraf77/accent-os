# Diff rules — registry-validator
> Canonical reference for the five diff classes registry-validator emits, their severity defaults, and the suggested-fix grammar. Read by SKILL.md Step 3.

## Why these five classes (and not more)

Gap-run-002 caught one case: registry bound `send_klaviyo_flow` to `klaviyo-flows` but the skill is read+propose only. Generalizing that case yields three primary classes (registry-hallucination, orphan-executor, payload-shape-drift) plus two safety-net classes (return-shape-drift, registry-duplicate). Adding a sixth class would require a new failure mode observed in production — until then, five is the contract.

---

## Class 1 — registry-hallucination

**Trigger:** an `action_type` row exists in `skills/action-queue/references/executor-registry.md`, but the bound executor skill's SKILL.md does **not** declare it as an accepted action_type. Two sub-cases:

- **1a — explicit refusal.** The executor's SKILL.md contains a refusal pattern naming the action_type (e.g. klaviyo-flows: "never accepts `send_klaviyo_flow`"). **Severity: BLOCKING.** A row in this state is guaranteed to fail at runtime — action-queue Step 5 will record `{"error": "action_type not supported by this executor"}` and the row stays APPROVED indefinitely.

- **1b — silent omission.** The executor's SKILL.md doesn't mention the action_type at all (neither accepts nor refuses). **Severity: WARN.** Likely the executor was forged before the registry row was added, or the registry was updated and the executor wasn't re-documented. Not guaranteed to fail at runtime if the executor is permissive about payload, but is a contract-documentation bug.

**Suggested fix grammar:**
```
Edit executor-registry.md row [N]: remove [action_type] OR re-bind to a forged executor that supports it.
```
Or, if 1b:
```
Edit [executor]/SKILL.md to declare [action_type] in the input contract section, OR remove the registry row if the binding is stale.
```

---

## Class 2 — orphan-executor

**Trigger:** an executor skill's SKILL.md declares it executes `action_type X` (in frontmatter description, Step 0/1 input contract, or anti-patterns refusal-of-everything-else), but no row in `executor-registry.md` binds X to that executor.

**Severity:**
- **INFO** if X is clearly a draft / internal / not-yet-shipped action_type (e.g. mentioned with "future" or "TBD" wording).
- **WARN** if X looks production-bound (named in the executor's primary purpose statement, has a documented payload shape, no draft/TBD wording).

**Suggested fix grammar:**
```
Add a registry row binding [action_type] → [executor]. Payload shape (per [executor]/SKILL.md): [shape].
```

**Note:** producer-side action_types (skills that propose to the queue but don't execute) are NOT orphans — those go in the registry's "Producer-side reference" section, not the main routing table. Only action_types the executor claims to **execute** count as orphans.

---

## Class 3 — payload-shape-drift

**Trigger:** the registry's "payload shape" column and the executor's declared input shape disagree on:
- **Field names** (registry says `field_name` + `new_value`, executor says `fields: { ... }`)
- **Required-vs-optional** (registry marks a field as required, executor's SKILL.md treats it as optional with a default — or vice versa)
- **Value types** (registry says `int`, executor expects `str`)
- **Cardinality** (registry says `to: str`, executor expects `to: [...]`)

**Severity:**
- **WARN** by default — most shape drift surfaces as runtime confusion but doesn't block execution if the executor is permissive.
- **BLOCKING** if a required field exists on one side but is missing on the other — the executor will reject the payload with a validation error and the row will stay APPROVED.

**Parse strategy:** the registry's payload shape uses loose JSON-ish syntax with `?` for optional, `|` for unions, single-quoted keys tolerated. Parse it as best-effort; on parse failure, surface as a **parse warning** rather than guessing the shape.

**Suggested fix grammar:** specify which side to edit and what to change.
```
Edit executor-registry.md row [N] to match [executor]'s declared shape: [shape].
```
or
```
Edit [executor]/SKILL.md Step [N] to accept the registry's shape: [shape].
```

The "which side to fix" call is heuristic: the executor SKILL.md is usually the more concrete contract (it has explicit Step 0 / Step 1 documentation), so when in doubt, suggest editing the registry to match. Annotate the suggestion with `(heuristic — Michael may prefer fixing the executor)`.

---

## Class 4 — return-shape-drift

**Trigger:** the executor's declared output shape (from its `## Output format` block or final return step) omits one or more required fields from action-queue's executor-result contract:
- `status` — must be present, value in `"ok" | "partial" | "error"`
- `summary` — must be present for `ok` and `partial` returns
- `duration_ms` — must be present for all returns
- For `error` status: `error.code` (enum from action-queue's contract), `error.message` (str), `error.retryable` (bool) — all required

**Severity:** WARN. Action-queue stores whatever the executor returns into `executor_result` jsonb — a non-conforming shape doesn't crash, but breaks downstream skills (skill-performance-tracker, alert-router) that expect the contract.

**Suggested fix grammar:**
```
Edit [executor]/SKILL.md Output format section to declare the full executor-result contract (status / summary / duration_ms / error.{code,message,retryable}).
```

---

## Class 5 — registry-duplicate

**Trigger:** the same `action_type` literal appears in two or more registry rows, bound to different executors (or the same executor twice).

**Severity:** BLOCKING. Action-queue Step 5's lookup is "find the first matching row" — duplicate bindings let the wrong executor win the routing race silently.

**Suggested fix grammar:**
```
Edit executor-registry.md: remove the duplicate row binding [action_type]. Keep row [N] (correct executor: [name]); remove row [M].
```

The "which row to keep" call: prefer the row whose payload shape matches more executors' declared inputs (per Step 2 records). If unclear, surface both rows in the receipt and let Michael pick.

---

## Severity escalation across runs

If the same finding (same `action_type` + same `diff_class` + same `executor_skill`) appears in two consecutive runs without a fix landing, escalate severity by one tier:
- INFO → WARN
- WARN → BLOCKING
- BLOCKING → BLOCKING (already at top, surface in BLOCK 3 with "fix overdue: N runs unfixed")

Run-history cache: `references/last-run.md` (overwritten each run). Compare the new findings list against the prior run's findings list by the (action_type, diff_class, executor_skill) tuple.

The escalation rule exists because BLOCKING findings that linger 3+ runs without action are stronger signals than first-run BLOCKING — and recurring INFO/WARN findings often hide a pattern Michael hasn't surfaced consciously yet.

---

## Out of scope (not a diff class)

- **Stylistic divergence** between registry payload shape syntax and skill SKILL.md syntax (e.g. registry uses `[...]` for arrays, skill uses `[ ... ]` with spaces) — never flagged. The validator parses semantically, not lexically.
- **Optional-field count mismatch** (registry has 3 optional fields, skill documents 4) — not flagged unless one of the optional fields is missing on the other side. Optional fields by definition can be absent without runtime impact.
- **Documentation-string drift** (registry's "what the executor does" column doesn't match the executor's purpose statement) — out of scope; that's a `skill-health-monitor` concern (frontmatter rot check).
