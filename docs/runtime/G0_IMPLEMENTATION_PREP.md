# G0 IMPLEMENTATION PREP — POLICY-AS-DATA SEED

> **Status:** implementation preparation. Not implementation.
> **Substrate seed:** G0 (policy as structured data).
> **Stage in transition path:** parallel-safe seed; precedes G1 (advisory
> gate) by weeks of stable operation. **Nothing enforces policy at G0.**
> **Read first:** `SUBSTRATE_RESEARCH_STATE.md` §8 (defensible order),
> `SAFE_AUTONOMY_CONSTRAINTS.md` (action classes, gates, rollback),
> `SUPERVISOR_WORKER_BOUNDARIES.md` §12–§13 (gated and human-only ops),
> `HUMAN_IN_THE_LOOP_PERSISTENCE.md` (governance anchors).

---

## 1. WHAT THIS SEED IS

G0 extracts the governance rules that today live as prose in `CLAUDE.md`,
`MASTER.md` Section 12 ("Hard Rules & Constraints"), and the various
SKILL.md files into a **single structured policy record**.

The record is *machine-readable* and *human-reviewable*. It declares, for
each named action class, what gate type the project intends to use and what
budgets apply.

**G0 does not enforce anything.** No code path checks the record before
acting. The agent does not consult the record at runtime. There is no
governance interposition. The record is a *declaration* of the policy that
*will eventually* be enforced at G1 (advisory) and G2/G3 (enforcing).

The point is to:
- pull governance out of prose, where it can drift silently with each doc
  edit, into typed structure where drift is visible;
- give the operator a single place to review "what gates are we declaring
  exist?";
- preview the action-class taxonomy that G1+ will operate against, with
  weeks of operator review *before* the first enforcement landing.

---

## 2. WHAT THIS SEED IS *NOT*

G0 is **not** any of the following. Drift toward any of these is a G0
corruption (see §9):

- **Not** an enforcement layer. No code consults the record to decide
  whether to proceed.
- **Not** a gate. Gates intercept; G0 declares.
- **Not** a substitute for `CLAUDE.md`. Operating rules in `CLAUDE.md`
  remain authoritative for the agent's behavior at G0. G0 is a *parallel*
  declaration, not a replacement.
- **Not** runtime-mutable. The agent does not edit the policy record. (See
  §13's permanently-human-controlled list — policy edits are §2.1 trust-
  framework operations.)
- **Not** an upgrade to the floor. Item 10 (governance gate on
  irreversible ops) stays at "partial" after G0 — partial in the same
  sense as before, just better-documented.
- **Not** a permission to act on classes that were previously gated. If
  CLAUDE.md required operator approval for `outbound-email-send` before
  G0, it still does after.

**Bright line:** if anything other than humans reads the policy record
and changes its behavior accordingly, G0 has been over-built.

---

## 3. EXACT MINIMAL IMPLEMENTATION SHAPE

G0 is the smallest possible artifact that captures current policy in
structured form.

### 3.1 The action-class vocabulary

A fixed, reviewable list of action classes. The list is derived from
`SUPERVISOR_WORKER_BOUNDARIES.md` §12 and `SAFE_AUTONOMY_CONSTRAINTS.md` §3,
intersected with what AccentOS actually does today. Initial vocabulary:

| Class id                          | Plain-language meaning                                  |
|-----------------------------------|---------------------------------------------------------|
| `local-file-edit`                 | Edit a file in the working tree                         |
| `local-bash-readonly`             | Run a bash command that does not write or send          |
| `local-bash-write`                | Run a bash command that writes outside the repo         |
| `git-commit`                      | Create a commit on the current branch                   |
| `git-push-feature-branch`         | Push to a non-main branch                               |
| `git-push-main`                   | Push to main / production branch                        |
| `git-destructive`                 | Force-push, branch delete, history rewrite              |
| `supabase-read`                   | Read from any Supabase table                            |
| `supabase-write-internal`         | Write to AccentOS internal tables (vendor data, etc.)   |
| `supabase-schema-change`          | DDL — alter tables, add columns, run migrations         |
| `supabase-credential-change`      | Rotate or issue Supabase credentials                    |
| `outbound-email-draft`            | Draft an email (not send)                               |
| `outbound-email-send`             | Send an email to a human                                |
| `outbound-message-other`          | SMS, slack, social, public comment                      |
| `cloudflare-deploy-pages`         | Deploy a new build to accent-os.pages.dev               |
| `cloudflare-deploy-worker`        | Deploy a new Cloudflare Worker                          |
| `cloudflare-credential-change`    | Rotate or issue Cloudflare credentials                  |
| `vendor-account-action`           | Any operation affecting a third-party account standing  |
| `money-movement`                  | Charges, refunds, transfers, ad spend                   |
| `mass-operation`                  | Any operation touching > N entities (define N)          |
| `permission-change`               | Add/remove operator, change role                        |
| `policy-change`                   | Edit the G0 record itself                               |

Each class id is stable forever. Classes can be added (additively); the
meaning of an existing id never changes. Renames are a migration (§9.5).

### 3.2 The gate-type vocabulary

Five gate types. Match `SAFE_AUTONOMY_CONSTRAINTS.md` §5:

| Gate type              | Meaning                                                                |
|------------------------|------------------------------------------------------------------------|
| `none`                 | No gate. Action proceeds without approval.                             |
| `human-in-loop`        | Operator must approve each action before execution.                    |
| `human-on-loop`        | Operator can interrupt; default is proceed if no objection in T.       |
| `automated-invariant`  | An automated check (tests green, schema compatible) must pass.         |
| `human-only`           | Action is not in any autonomous code path; requires direct human action.|

### 3.3 The G0 record schema

A single declarative record. Format choice: a YAML file at
`docs/runtime/governance/policy.v1.yaml`, or an equivalent structured form.
YAML is recommended for human readability.

```
# docs/runtime/governance/policy.v1.yaml
version: 1
revised: 2026-MM-DD
revised_by: <operator>

action_classes:
  - id: local-file-edit
    description: "Edit a file in the working tree"
    intended_gate: none
    current_practice: none
    notes: "agent has freedom to edit working tree"

  - id: outbound-email-send
    description: "Send an email to a human"
    intended_gate: human-in-loop
    current_practice: human-in-loop
    notes: "always operator-approved per CLAUDE.md"

  - id: cloudflare-deploy-pages
    description: "Deploy build to accent-os.pages.dev"
    intended_gate: human-in-loop
    current_practice: human-in-loop
    notes: "auto-deploy via git push to main, but git-push-main is gated"

  - id: policy-change
    description: "Edit this G0 record"
    intended_gate: human-only
    current_practice: human-only
    notes: "trust-framework op; never runtime-reachable"

  # ... one entry per class id from §3.1

budgets:
  default:
    wall_clock_minutes: null     # not yet declared
    cost_usd: null
    action_count: null
    reach_entities: null
    recursion_depth: null
  notes: "budgets are not enforced at G0; declared as null until G2+"

permanently_human_only:           # mirrors HUMAN_IN_THE_LOOP_PERSISTENCE §2.1, §13
  - permission-change
  - policy-change
  - supabase-credential-change
  - cloudflare-credential-change
  - vendor-account-action
  - money-movement
  - "decommissioning the runtime"
  - "substrate migration"
  - "schema-incompatible writes"
```

Two columns per class are deliberate:

- `intended_gate`: what the policy says the gate *should* be at maturity.
- `current_practice`: what is *actually* happening today.

When the two diverge, the divergence is visible. When they match, the
declaration is honest.

### 3.4 Where the file lives

`docs/runtime/governance/policy.v1.yaml` — under `docs/runtime/` so the
substrate corpus stays cohesive.

The filename is versioned (`v1`) so future schema evolutions are
forward-compatible additive changes. A v2 would live alongside v1 during
any transition; the active version is named in `SUBSTRATE_RESEARCH_STATE.md`.

### 3.5 What the agent does at G0

**Nothing new.** The agent's behavior is unchanged. The agent does not read
the policy file at runtime. The agent does not validate its actions against
it. `CLAUDE.md` operating rules continue to govern agent behavior.

The operator may consult the file when reviewing autonomy decisions.

### 3.6 What changes for the operator

The operator gains a single source of truth for *what gates the project
intends to enforce*. The operator's review process can begin to use the
file as the canonical reference, instead of reading prose across CLAUDE.md,
MASTER.md §12, and various SKILL.md files.

---

## 4. EXACT REQUIRED PERSISTENCE

A single file in the repository. Smallest possible footprint.

- **File:** `docs/runtime/governance/policy.v1.yaml`
- **Persisted by:** git, like any doc.
- **No database table.** G0 does not introduce a Supabase representation
  of the policy. Database storage of policy is a *later* seed (after G1
  becomes advisory and the consumer needs queryable access).
- **No service.** No process loads or serves the file. It is a static
  artifact.
- **Versioned by filename, not by row.** v2 is `policy.v2.yaml`, side-by-
  side with v1 during any transition.

The single permitted optional artifact is a small **schema file** —
`docs/runtime/governance/policy.schema.json` or similar — describing the
allowed structure of `policy.vN.yaml`. The schema lets the operator and
future consumers validate the YAML's shape. The schema file does not
*enforce* anything either — it is a description of structure.

---

## 5. EXACT BLAST RADIUS

The set of effects G0 can possibly produce, even when wrong:

- **Worst case (file is malformed YAML):** the operator's reference is
  unreadable until fixed. No system behavior changes; no runtime depends
  on the file. Recovery: fix the file in a single commit.
- **Worst case (file declares a class incorrectly — e.g. `outbound-email-send`
  marked `none`):** the operator sees a wrong declaration in their reference.
  No agent behavior changes because the agent does not consult the file.
  Recovery: edit the file; commit.
- **Worst case (a class is forgotten / not declared):** the operator's
  reference is incomplete. CLAUDE.md governs agent behavior in the meantime.
  Recovery: add the class.
- **Worst case (the file is edited by someone other than the operator):**
  this should be impossible at G0 — the file is in `docs/runtime/governance/`
  and edits are committed to git. The commit identifies the editor. If an
  agent edited it (autonomous policy mutation), that is a §9.7 corruption
  and a discrete incident. Recovery: revert the commit; investigate.

There is **no** scenario in which G0 produces an external side effect,
modifies agent behavior, or affects users. It is a documentation artifact
in structured form.

**Blast radius:** *documentation-only, fully reversible.*

---

## 6. EXACT ROLLBACK PATH

G0 can be fully rolled back at any time:

1. Delete `docs/runtime/governance/policy.v1.yaml` (and the schema file if
   present).
2. Revert any edits to `CLAUDE.md` that referenced the policy file. (None
   are required at G0; if added, remove.)
3. Update `SUBSTRATE_RESEARCH_STATE.md` to mark G0 as not landed.

Rollback is one commit. There is no migration of state, no consumer to
notify (because there is no consumer), no in-flight enforcement to drain.

If G1 has begun (advisory gate that *reads* the policy file), rolling back
G0 requires rolling back G1 first. G1 is a separate seed and is forbidden
until G0 is stable per §8.

---

## 7. EXACT FORBIDDEN EXPANSION

The following are *not* part of G0 and must not slip in under the G0
banner:

| Forbidden expansion                                                                | Why                                                                            |
|------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Code that reads `policy.v1.yaml` and changes agent behavior                        | That is G1 (advisory), not G0                                                   |
| A pre-tool-use hook that consults the policy and blocks                            | That is G2 (enforcing), not G0                                                  |
| Storing the policy in a Supabase table for queryability                            | Not at G0; runtime-readable policy is at G1+                                    |
| Allowing the agent to edit the policy file via its normal tooling                  | Policy edits are `human-only` (§3.3); making them runtime-reachable is §9.7    |
| Auto-generating the policy from CLAUDE.md or skills                                | Generation hides drift; the value of G0 is *manual* extraction                  |
| Splitting policy across multiple files by class                                    | Single file = single review surface; splitting fragments the review             |
| Versioning by row (with a `revision` timestamp per class)                           | Row-level versioning invites partial updates and class-by-class drift           |
| Adding a "current_actor" or "delegated_to" field per class                         | That is access-control/RBAC; out of G0 scope                                    |
| Importing the policy into MASTER.md as an embedded table                           | Two sources of truth (`SUBSTRATE_MIGRATION_RISKS.md` §2)                        |
| A separate "policy review dashboard"                                               | Operator pane is its own seed; not bundled                                      |
| Treating the policy as a "config" the substrate consumes                           | At G0 there is no substrate consumer; calling it "config" implies one          |

If a proposed change touches any row above, it is not G0 — it is G1+ or a
different seed entirely.

---

## 8. EXACT SUCCESS CRITERIA

G0 is "successful" — i.e. ready to support G1 — when *all* of the following
hold for **at least four weeks of stable operation** (the operator must
have actually consulted the file in real reviews, not merely written it):

1. **Coverage.** Every action class the agent or operator actually performs
   in normal AccentOS operation is represented in `policy.v1.yaml`. Classes
   that no one performs need not be present.
2. **Honesty.** For every class, `current_practice` matches what is
   actually happening. Where `current_practice` differs from `intended_gate`,
   the divergence is visible and known to the operator.
3. **Permanence list correct.** The `permanently_human_only` list matches
   `HUMAN_IN_THE_LOOP_PERSISTENCE.md` §2.1 and §13. No drift.
4. **Operator review.** The operator has reviewed the file at least twice
   during the period and made at least one correction (a class added, a
   `current_practice` updated, a description sharpened) on the basis of
   actual operational experience. If no correction was needed, the file
   was probably under-reviewed.
5. **No agent reads.** Logs / commits show no instance of the agent reading
   the policy file at runtime. (If they show one, see §9.1.)
6. **No drift in §2 of `SUBSTRATE_RESEARCH_STATE.md`.** Floor item 10
   (governance gate on irreversible ops) stays at "partial" — partial in
   the same sense as before. G0 makes the policy structured, not enforced.
7. **No conflict with CLAUDE.md.** Operating rules in CLAUDE.md and the
   policy record agree. When they don't, the discrepancy is resolved
   *before* the divergence period extends.

When all seven hold, G1 (advisory gate) may be considered. Until they
hold, G1 is forbidden.

---

## 9. SEED CORRUPTION PATTERNS — G0-SPECIFIC

Ways G0 can drift into fake-runtime theater:

### 9.1 The "agent-reads-the-policy" corruption
The agent's prompt or a skill begins consulting `policy.v1.yaml` to decide
how to act. This is G1 (advisory) sneaking in under the G0 banner. If the
read also conditions a behavior, it is G2 (enforcing) — and crossed without
calibration. Either way, the substrate has gained a new "intelligence"
without operator review.
*Signal:* `policy.v1.yaml` appears in any `Read` tool call, grep, or skill
prompt during agent execution.

### 9.2 The "documented-gate" corruption
A status update or PR description claims AccentOS now has "machine-readable
governance" in a way that implies enforcement. The policy is written; no
enforcement exists. This is the documented-gate hazard
(`SUBSTRATE_MIGRATION_RISKS.md` §6) wearing a YAML costume.
*Signal:* the words "enforce," "block," or "prevent" appear next to "G0"
or "policy.v1.yaml" in any non-research doc.

### 9.3 The "drift between intended and current is hidden" corruption
The operator marks `current_practice: human-in-loop` when in reality the
class is being performed `none`. The policy stops reflecting reality and
starts reflecting hope. This makes the upcoming G1 calibration impossible —
the advisory gate will fire on rules that don't match observed practice.
*Signal:* a class's `current_practice` is more strict than what the agent
is actually doing in commits / logs.

### 9.4 The "auto-generation" corruption
A script generates `policy.v1.yaml` from `CLAUDE.md` or from skill metadata.
Generation is convenient and exactly wrong: G0's value is the operator's
*manual* extraction, which forces them to read the rules carefully and
notice gaps. Auto-generation hides those gaps.
*Signal:* any commit message describing the policy file as "regenerated"
or "synced from CLAUDE.md."

### 9.5 The "rename instead of add" corruption
A class id is renamed (e.g. `outbound-email-send` → `email-outbound`)
because the new name "reads better." Class ids are stable forever. Renames
break every prior reference (commit messages, audit logs, future enforcement
records). If a name is wrong, *add* a new class with the right name and
deprecate the old one over time.
*Signal:* a diff shows a class id changed value rather than added/removed.

### 9.6 The "policy edit via runtime" corruption
The agent commits a change to `policy.v1.yaml` as part of its normal work,
even with operator review of the commit. The operator review of a commit
is post-hoc; it is not a `human-only` gate. `policy-change` is in the
permanently_human_only list — edits to the policy file should arrive via
operator-driven commits, not agent-driven ones.
*Signal:* `git log policy.v1.yaml` shows author / committer = the agent.

### 9.7 The "G0 = floor item 10" corruption
The §2 snapshot in `SUBSTRATE_RESEARCH_STATE.md` is updated to mark item 10
(governance gate on irreversible ops) as "partial → durable" because policy
is now structured. No. The change in form (prose → YAML) does not change
enforcement. Item 10 stays "partial" with the same content as before.
*Signal:* any update to §2 that upgrades item 10 on the strength of G0
alone.

### 9.8 The "central config" corruption
The policy file grows fields beyond gate type and budgets — feature flags,
operator preferences, runtime tunables. It becomes the project's
"config.yaml." This conflates governance with configuration; the next
person reading the file cannot tell which fields are policy declarations
(human-only edits) and which are tunables (anyone can change).
*Signal:* the file gains fields unrelated to action-class gating.

### 9.9 The "implementation in the doc" corruption
The policy YAML grows `pre_check` or `validator` fields containing
expressions to be evaluated by a future gate. This embeds enforcement
logic in the declaration. At G0 the file is *what* is intended; *how* is
G2's problem.
*Signal:* the YAML contains executable expressions (regexes, predicates,
function names).

Each of these is a step toward fake-runtime construction. Recognize the
signals; don't take the step.

---

## 10. PRE-IMPLEMENTATION CHECKLIST

Before any G0 commit is made in a future build session:

- [ ] Confirm E0 and S0 have either landed and stabilized OR are explicitly
      not blocking G0. (The three seeds are parallel-safe; G0 does not
      strictly depend on E0/S0, but landing them in any order is fine.)
- [ ] Audit the action-class vocabulary in §3.1 against current AccentOS
      practice. Add missing classes. Remove classes that aren't real.
- [ ] Walk `CLAUDE.md`, `MASTER.md` §12, and the SKILL.md files; for each
      governance-shaped statement, confirm the corresponding class exists
      and `current_practice` matches.
- [ ] Confirm the `permanently_human_only` list matches
      `HUMAN_IN_THE_LOOP_PERSISTENCE.md` §2.1 / §13 exactly. Drift here
      undermines the trust framework.
- [ ] Decide the file format (YAML recommended) and lock it. Don't iterate
      on format after first commit.
- [ ] Decide whether a JSON Schema file accompanies the YAML. If yes, write
      it now; if no, leave it out and don't add later without explicit
      reason.
- [ ] Confirm `CLAUDE.md` will be updated to *reference* the policy file as
      the canonical declaration, while keeping CLAUDE.md authoritative for
      agent behavior at G0.
- [ ] Confirm there is no agent-side code that reads the policy at G0.
      Pre-write a search: a future check that grep for `policy.v1.yaml` in
      agent tooling returns nothing.
- [ ] Pre-write the §9 corruption-pattern watchlist into the operator's
      review checklist for the four-week stable-operation period.

When the checklist is satisfied, G0 implementation is a one-commit,
documentation-only landing.

---

## 11. THE "THIS IS NOT RUNTIME" CLARIFICATION

After G0 lands, the honest description of the system is:

> AccentOS now carries a structured declaration of governance policy at
> `docs/runtime/governance/policy.v1.yaml`. The file enumerates action
> classes, declares the gate type intended for each, and lists the
> operations that remain permanently human-controlled. **Nothing reads the
> file at runtime. The agent's behavior is unchanged. CLAUDE.md remains
> the operating-rule authority. The substrate floor remains 0 of 10 in
> durable form, with item 10 (governance gate on irreversible ops) still
> scored "partial" — partial in the same sense as before, just now
> reviewable in one place.** G0 prepares the ground for G1 (advisory
> gate) by giving the future advisory consumer a stable, typed record to
> read against.

That paragraph (or its equivalent) is the language to use for G0 in any
status update, README, or AI-context-file. Anything stronger — anything
that calls AccentOS "governed," "policy-enforced," or "more durable"
because of G0 — is a §9.2 or §9.7 corruption.

---

## 12. CROSS-SEED COORDINATION NOTE

E0, S0, and G0 are parallel-safe and non-coupling. Specifically:

- E0's `worker_id` shows up in S0 heartbeat rows; S0 *consumes* E0's
  identity scheme but does not couple to E0's behavior.
- G0 references action classes that the agent performs; the agent's E0/S0
  emissions are themselves classified (heartbeat writes are
  `supabase-write-internal` for the heartbeat table, scoped narrowly).
- None of the three seeds enables behavior that depends on the others. Any
  one of them can be rolled back without cascading.

The three seeds may land in any order. The recommendation is E0 → S0 → G0
because S0's heartbeat rows benefit from E0's IDs, and G0's class list
benefits from observing real actions (including E0/S0 writes). But other
orderings are valid.

The disciplines that apply to all three:

- Each seed lands as a single, focused change.
- Each seed's success criteria is met before the next is considered.
- No seed's landing upgrades the §2 floor snapshot. Seeds prepare the
  ground; they do not constitute substrate.
- No seed grows a runtime consumer until the corresponding next stage
  (E1, S1, G1) is explicitly entered after the four-week-plus stable-
  operation period.

The four-week minimum is not arbitrary; it is the period over which
real-world variation (network failures, edge cases, operator habit) will
stress the seed and reveal whether it is honest or theatrical.
