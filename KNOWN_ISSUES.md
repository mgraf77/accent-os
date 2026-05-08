# KNOWN ISSUES

Issues, risks, and tradeoffs in the work shipped this session. Each entry has a
severity tag and a recommended response.

---

## AIRLOCK

### [Medium] Interception is advisory, not enforced

**Surface:** `skills/airlock/gate.js` + `skills/airlock/SKILL.md`.

**Issue:** The gate module exports interceptors, but nothing forces a quarantined
skill to call them. The SKILL.md hooks describe the contract Claude must follow.
A skill that imports `fs` directly and bypasses the gate will not be observed.

**Mitigation today:** AccentOS skills are markdown-driven; they don't import `fs`
themselves. Claude reads files through the Read tool which honors SKILL.md
instructions.

**Long-term fix:** wrap the AccentOS skill SDK so hooks are inescapable, or
accept that source-level review (`codex-review`, `community-skill-vet`) is the
real safety layer and AIRLOCK is the runtime audit trail.

---

### [Low] Custom YAML parser

**Surface:** `skills/airlock/gate.js` `parseYaml()`.

**Issue:** Hand-rolled parser supports only the fixed-shape policy.yaml format
(top-level scalars + simple lists). It does not handle nested objects, anchors,
multi-line strings, or anything else.

**Mitigation:** policy.yaml schema is locked at v1 and the JSON Schema enforces
the shape. Any addition requires explicit schema_version bump.

**Fix when needed:** swap `parseYaml()` for `js-yaml` (the only place it's used).

---

### [Low] Concurrent-run invariant relies on AccentOS being single-process

**Surface:** ledger ordering across simultaneous quarantined-skill runs.

**Issue:** `gate.js` uses an in-process Map for the ledger buffer. Two concurrent
runs of the same skill in separate Node processes would each flush their own
ledger and the run-end timestamps could interleave, but `validateAppendOnly()`
already guards against that via monotonic-timestamp check.

**Mitigation:** AccentOS is a single Claude Code session at a time. Documented in
SKILL.md "Operating rules".

**Fix when needed:** add file-locking around append, or move to a real append
log (e.g., SQLite WAL) when concurrency becomes a real requirement.

---

### [Low] Test-run entries persist in `airlock/promotion-log.md`

**Surface:** `airlock/promotion-log.md`.

**Issue:** `tests/ledger.test.js` writes real entries to the production
promotion-log. The CI run from this session left two pairs of `_test-*`
promote/demote entries.

**Mitigation:** test-skill names start with `_test-` and `airlock/.gitignore`
hides their per-skill directories. Only the log entries persist.

**Fix when needed:** parameterize `PROMO_LOG_PATH` in `operator.js` so tests can
point it elsewhere. ~10-line change. Not urgent.

---

### [Low] No version-pin assertion between `gate.SDK_VERSION` and skill SDK

**Surface:** the build-plan validation gate "AirlockGate version pin" exists in
the handoff doc but is not tested.

**Issue:** AccentOS does not currently expose a versioned skill SDK that AIRLOCK
can pin against. `gate.SDK_VERSION` is declared but never compared to anything.

**Mitigation:** mark this gate as "documented but not enforced" — it's a future
hook for when the SDK is formalized.

---

## brainstorm-build-handoff

### [Medium] Ambiguity-keyword scan is heuristic, not semantic

**Surface:** `scripts/validate.js` `AMBIGUITY_TOKENS`.

**Issue:** The validator catches obvious tokens (`TBD`, `various`, `etc.`,
`later`) but does not detect semantic vagueness like "the system will manage
state appropriately."

**Mitigation:** the keyword list is empirically common in vague drafts and
catches real cases. The schema-required-keys checks force concreteness on
structural fields.

**Fix when needed:** add an LLM-judge pass in v1.1 if real handoffs ship with
semantically-vague but keyword-clean text. Don't pre-build.

---

### [Medium] Three-pass Ralph cap is rigid

**Surface:** `skills/brainstorm-build-handoff/SKILL.md` Step 4.

**Issue:** Highly entangled systems may need more than 3 passes to converge.
The current cap forces unresolved items into `open_issues[]` to be surfaced in
the handoff.

**Mitigation:** `open_issues[]` propagates to the assembled handoff so a human
can resolve them. Convergence detection (≤2 changes + empty open_issues)
identifies "actually done" passes.

**Fix when needed:** loosen the cap to 5 passes if real runs report frequent
unresolved items. Don't pre-build.

---

### [Low] Examples directory will grow indefinitely

**Surface:** `skills/brainstorm-build-handoff/examples/`.

**Issue:** Each new worked example commits ~10 JSON files + a HANDOFF.md to git.
At scale this could bloat the skill directory.

**Mitigation:** examples are documentation; they're rarely added (one per major
version). Current count: 1 (AIRLOCK).

**Fix when needed:** rotate older examples to a separate `examples-archive/`
directory if more than ~5 accumulate.

---

### [Low] Validator's JSON Schema subset

**Surface:** `scripts/validate.js`.

**Issue:** Custom validator supports `type`, `required`, `enum`, `properties`,
`additionalProperties: false`, `items`, `minItems`, `maxItems`, `minLength`,
`maxLength`, `pattern`, `const`, `$ref` to local `#/definitions`. It does NOT
support `oneOf`, `allOf`, `anyOf`, `if/then/else`, format validators, or remote
refs.

**Mitigation:** every shipped schema fits the subset. Adding new schemas is
explicit and reviewed.

**Fix when needed:** swap in `ajv` if cross-skill schema reuse arrives (v1.2
trigger in ROADMAP.md). Don't pre-build.

---

## Cross-cutting

### [Low] Two new top-level directories at repo root

**Surface:** `airlock/` and the five new stabilization docs at repo root.

**Issue:** Increases repo-root clutter slightly. Governance restructuring may
want to move `airlock/` runtime state somewhere else.

**Mitigation:** documented in `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md` with
recommended placement options.

---

### [Low] Test entries pollute production promotion-log

See "Test-run entries persist" above. Same root cause.

---

## What is NOT a known issue

- Test stability: 46/46 pass deterministically across reruns.
- Schema correctness: hand-validated against worked example.
- Validator false negatives on the AIRLOCK example: 0 warnings, 0 errors.
- Module imports: `node` resolves all internal `require()` calls.
