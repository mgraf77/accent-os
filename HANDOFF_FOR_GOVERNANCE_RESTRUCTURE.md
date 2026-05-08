# HANDOFF FOR GOVERNANCE RESTRUCTURE

> Context for whoever drives the upcoming AccentOS / AgentOS / skills-repo /
> Command Center split. Generated at clean-pause boundary.

---

## TL;DR

Two new skills shipped this session, both fully self-contained:

- `skills/brainstorm-build-handoff/` — orchestration skill (project-agnostic).
- `skills/airlock/` — runtime quarantine layer for community skills.

Plus a new top-level runtime data directory:

- `airlock/` — per-skill policy + ledger state.

Both skills are zero-dependency Node + JSON + Markdown. They can be moved to a
shared skills repo with no code changes; only `_index.md` references and the
`airlock/` runtime path would need adjustment.

---

## Systems touched

| System                          | Touched? | What                                                       |
|---------------------------------|----------|------------------------------------------------------------|
| `skills/_index.md`              | yes      | +2 entries (alphabetic insertion)                          |
| `skills/airlock/`               | new      | Full skill: SKILL.md, gate.js, ledger.js, operator.js, schemas, templates, tests |
| `skills/brainstorm-build-handoff/` | new   | Full skill: SKILL.md, scripts, schemas, templates, validators, examples |
| `airlock/`                      | new      | Runtime data root: `promotion-log.md` + `.gitignore`       |
| MASTER.md                       | no       | Untouched                                                  |
| BUILD_PLAN_*.md                 | no       | Untouched                                                  |
| SESSION_LOG.md                  | no       | Untouched                                                  |
| KPI_CATALOG.md                  | no       | Untouched                                                  |
| index.html / js / worker / sql  | no       | Untouched                                                  |
| WORK_IN_PROGRESS.md             | will be  | Updated to reflect clean pause (last step of this session) |

---

## Where these systems likely belong after restructuring

### `skills/brainstorm-build-handoff/`

**Recommended home:** Shared skills repo (or AgentOS, depending on cut line).

**Why:**
- Project-agnostic. Only the worked example references AccentOS.
- Zero AccentOS coupling in the validator and assembler scripts.
- Likely useful across AccentOS, AgentOS, and any future Anthropic-team workflow.

**What moves:** the entire `skills/brainstorm-build-handoff/` directory.
**What stays in AccentOS:** nothing — examples can move with the skill.

### `skills/airlock/`

**Recommended home:** AccentOS (skill code + runtime data must co-locate).

**Why:**
- Operates against the AccentOS filesystem layout.
- The `airlock/` runtime state is AccentOS-specific (per-skill policy + ledger
  data, references AccentOS skill names).
- Quarantining is meaningful only against a concrete skill registry.

**What moves:** nothing. Both `skills/airlock/` and `airlock/` stay together.

**Caveat:** if the skill-registry layer (`skills/_index.md`) moves to the shared
skills repo, AIRLOCK needs to know where to find it. Currently AIRLOCK does not
read `_index.md`; it operates per-skill via filesystem paths. So a registry move
is harmless.

### `airlock/` runtime directory

**Recommended home:** Wherever AccentOS data lives.

**Why:**
- `airlock/<skill>/policy.yaml` is committed (governance).
- `airlock/<skill>/ledger.jsonl` is committed (audit trail).
- `airlock/<skill>/shadow/` is ephemeral, gitignored.
- `airlock/promotion-log.md` is committed (history).

If AccentOS data moves to a "Command Center" repo, `airlock/` moves with it.

### Stabilization docs (this session)

- `SESSION_SUMMARY.md`
- `CURRENT_STATE.md`
- `NEXT_STEPS.md`
- `KNOWN_ISSUES.md`
- `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md` (this file)

**Recommended home:** AccentOS root, until restructuring is done. Then archive
to a `docs/sessions/` or equivalent.

---

## Dependencies between the new systems

```
brainstorm-build-handoff (general orchestration)
    └─ produces handoff.md → consumed by any executor
       (used AIRLOCK as worked example only; no runtime dependency)

airlock (AccentOS-specific runtime)
    ├─ depends on: AccentOS filesystem layout
    ├─ depends on: skills/<name>/SKILL.md convention
    └─ does NOT depend on: brainstorm-build-handoff at runtime
```

**Important:** brainstorm-build-handoff and AIRLOCK are not coupled at runtime.
The fact that AIRLOCK was *built from* a brainstorm-build-handoff handoff is a
historical artifact, not a dependency. Each skill stands alone.

---

## Architectural assumptions to review during restructuring

1. **Skills self-register via `skills/_index.md`.**
   If governance introduces a different registry (frontmatter scan, JSON manifest,
   etc.), the two new entries in `_index.md` need to migrate. Both new skills
   declare standard `name`/`description` frontmatter compatible with most
   registry conventions.

2. **Runtime state at repo root.**
   `airlock/` is a top-level directory. If governance prefers `data/` or
   `runtime/` prefixes, paths in `gate.js` (`AIRLOCK_ROOT`) and `ledger.js`
   need a single-line change.

3. **AccentOS is single-process.**
   AIRLOCK ledger ordering relies on this. A multi-process AccentOS would need
   file-locking around `flushLedger`. See `KNOWN_ISSUES.md`.

4. **Skill SDK is implicit.**
   AccentOS does not currently have a formal skill SDK; AIRLOCK's `SDK_VERSION`
   is documented but not enforced. If governance formalizes a skill SDK,
   AIRLOCK should pin against it.

5. **No external dependencies.**
   Both skills run on Node stdlib + JSON + Markdown only. Easy to relocate; no
   `package.json` mutations needed.

6. **YAML parser is custom.**
   `gate.js` parses a fixed-shape policy.yaml without `js-yaml`. If governance
   standardizes on `js-yaml` or another parser across skills, swap it in.

---

## Areas of high coupling

None introduced this session. Both new skills are self-contained directory
units. The pre-existing AccentOS coupling (`MASTER.md`, `BUILD_PLAN_*.md`,
`SESSION_LOG.md` cross-references) is unchanged.

---

## Risky architectural zones

1. **AIRLOCK's advisory enforcement model.** The gate functions return
   `{ allowed }` but do not block I/O. Any caller that ignores the return value
   bypasses quarantine. See `KNOWN_ISSUES.md` "Interception is advisory".
   Restructuring may want to take a position on whether the AccentOS skill SDK
   should make hooks inescapable.

2. **`promotion-log.md` is an unstructured Markdown append-log.** Easy to read,
   hard to query. If governance wants programmatic promotion analytics, this
   should become JSONL or a structured format.

3. **AIRLOCK does not yet read `skills/_index.md`.** Currently relies on
   filesystem presence of `airlock/<skill>/policy.yaml` to know what to manage.
   If skills move out of `skills/`, AIRLOCK keeps working as long as
   `airlock/<skill>/` exists. But `operator.js status` (no-arg) iterates
   `airlock/` to find managed skills — this is the only place where the dir
   layout matters.

---

## Incomplete abstractions (to think about, not to build now)

- AIRLOCK gate exposes 4 interceptors (read, write, invoke, network). A future
  "register-interceptor" hook is documented in `05-mvp.json` `future_hooks` but
  not implemented. Don't build until shell or HTTP-egress quarantine is needed.

- brainstorm-build-handoff has separate scripts for `init`, `validate`, and
  `assemble-handoff`. A future `cli.js` wrapper could unify them. Currently
  intentionally separate so each phase is independently scriptable.

- The brainstorm-build-handoff validator's JSON Schema engine is a tiny custom
  subset. A future shared validator across skills could swap to `ajv`. Trigger:
  cross-skill schema reuse.

---

## Duplicate systems

None. AIRLOCK is distinct from `community-skill-vet` (pre-install audit) and
`codex-review` (code review) — these three are complementary, not redundant.

---

## Recommended cleanup opportunities (low priority, after restructuring)

1. Parameterize `PROMO_LOG_PATH` in `operator.js` so tests don't write to the
   production file. ~10-line change. See `KNOWN_ISSUES.md`.

2. Remove the two test-run entries currently in `airlock/promotion-log.md` once
   the parameterization above lands. They were left in place per the "don't
   revert linter changes" instruction this session.

3. Consider moving the stabilization docs (this file, `SESSION_SUMMARY.md`,
   `CURRENT_STATE.md`, `NEXT_STEPS.md`, `KNOWN_ISSUES.md`) into a `docs/`
   subdirectory once restructuring is done.

---

## Confirmation of clean state

- ✅ Working tree clean.
- ✅ Branch pushed to `origin/claude/brainstorm-build-handoff-skill-TVlUc`.
- ✅ All tests pass (46/46).
- ✅ Validator passes for the AIRLOCK example (0 warnings, 0 errors).
- ✅ No external dependencies introduced.
- ✅ No edits to pre-existing AccentOS modules.
- ✅ Pre-session WIP (Cloudflare Worker proxy) untouched.
- ✅ Both new skills self-contained — relocatable as directory units.

---

*Resume from `NEXT_STEPS.md`. Restructure freely.*
