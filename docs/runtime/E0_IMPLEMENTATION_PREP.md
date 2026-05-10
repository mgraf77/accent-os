# E0 IMPLEMENTATION PREP — STABLE IDENTITY SEED

> **Status:** implementation preparation. Not implementation.
> **Substrate seed:** E0 (identity).
> **Stage in transition path:** parallel-safe seed; precedes E1 shadow
> externalization by weeks of stable operation.
> **Read first:** `SUBSTRATE_RESEARCH_STATE.md` §8 (defensible order),
> `TRANSITION_TO_DURABLE_RUNTIME.md` §3 (incremental evolution),
> `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` §4.5 (identity boundary).

---

## 1. WHAT THIS SEED IS

E0 introduces **stable, globally unique identifiers** for the three classes of
entity that future substrate work will need to reference:

- **plans** — coherent multi-step intents
- **work units** — single steps within a plan
- **workers** — anything that executes a unit (today: the agent session)

The identifiers are *metadata only*. Nothing in the system *behaves* differently
because of them. They appear in commit messages, log entries, and document
headers. They accumulate.

The point is not to make IDs useful in E0. The point is that when E1 begins
(shadow plan externalization), the IDs already exist on the entities being
externalized, so there is no scramble to retrofit identity onto in-flight work.

---

## 2. WHAT THIS SEED IS *NOT*

E0 is **not** any of the following, and any artifact that drifts toward these is
an E0 corruption (see §9):

- **Not** a runtime. No process is started, supervised, or watched.
- **Not** a queue. IDs do not imply units have status, leases, or transitions.
- **Not** a plan externalization. The plan still lives wherever it lives today
  (chat context, markdown). E0 only adds an ID label to it.
- **Not** a worker registry. There is no "active worker" set; the agent session
  is still the only executor and it is not tracked as a worker entity.
- **Not** an audit log. ID assignments are not transitions; they are creation
  events.
- **Not** a permission to call AccentOS "more durable." The §2 floor in
  `SUBSTRATE_RESEARCH_STATE.md` does not move because E0 lands.

**Bright line:** if any consumer of these IDs is a process other than humans
reading docs and logs, E0 has been over-built.

---

## 3. EXACT MINIMAL IMPLEMENTATION SHAPE

E0 is the smallest possible code change that produces stable IDs.

### 3.1 ID format

Single format used everywhere:

```
<entity-prefix>_<base32-sortable-suffix>
```

- **Prefix:** `pln` (plan), `unt` (work unit), `wkr` (worker).
- **Suffix:** time-ordered, lowercase, base32, ~10 chars (a ULID-style or
  similar; the property required is "lexicographically sortable by creation
  time and globally unique").

Examples:
- `pln_01htpm0z4q`
- `unt_01htpm15kc`
- `wkr_01htpm1g3a`

### 3.2 Where IDs are minted

- **Plans:** minted at the moment a plan is *named* in conversation or in
  `BUILD_PLAN_CLAUDE.md` / similar. One plan = one ID. The ID lives in the
  plan's heading.
- **Work units:** minted when a checkbox or task line is added to a plan. The
  ID is appended to the line in a stable position.
- **Workers:** minted at the start of each Claude Code session that does
  AccentOS work. One session = one worker ID. The ID is logged in
  `PROMPT_LOG.md` at session start (already an existing convention to extend).

### 3.3 Where IDs appear

| Surface                         | What appears                                                 |
|---------------------------------|--------------------------------------------------------------|
| Commit messages                 | `[<plan-id>] [<unit-id>] message text`                       |
| `PROMPT_LOG.md` entries         | Session start logs `wkr_…`; per-task lines log `unt_…`       |
| `SESSION_LOG.md` entries        | Reference plan and unit IDs in narrative                      |
| Plan headings (markdown)        | `## Plan: <title> (pln_…)` at the top of plan docs           |
| Work unit lines (markdown)      | `- [ ] task description (unt_…)`                             |
| Future substrate rows (E1+)     | The ID column is already populated from these mintings        |

### 3.4 ID generation

Generation is local to whoever creates the entity:

- The agent generates an ID at the moment of creation, inline in the same
  edit.
- A small helper (a shell function or a single-purpose script) is acceptable
  to make generation effortless. The helper is *not* a service, *not* a
  daemon, *not* networked.
- IDs are never reused. An entity that is renamed keeps its ID. An entity
  that is duplicated gets a new ID for the duplicate.

### 3.5 No registry yet

E0 explicitly does *not* maintain an authoritative registry of all IDs. The
record of all extant IDs is the union of where they appear in the repo
(commit log, markdown files, PROMPT_LOG). An ID exists iff it appears
somewhere. This is sufficient at E0 because nothing depends on enumerating IDs.

---

## 4. EXACT REQUIRED PERSISTENCE

E0 does **not** create a substrate table. Persistence is exactly the existing
file persistence:

- IDs in markdown files are persisted by git.
- IDs in commit messages are persisted by git.
- IDs in `PROMPT_LOG.md` are persisted by git.

**No new table, no new column, no new external store.** The first substrate
table arrives at E1, not E0. If a Supabase table is created at E0, the seed has
been over-built.

The single permitted exception: a *helper config* file (e.g. `.idconfig` or a
section in an existing config) that fixes the ID format and prefix vocabulary.
That is configuration, not state.

---

## 5. EXACT BLAST RADIUS

The set of effects E0 can possibly produce, even when wrong:

- **Worst case (incorrect ID generation):** an ID collides with another, or
  is malformed. Effect: a log line or commit message contains an unparseable
  reference. No system behavior changes; humans notice via log inspection.
  Recovery: regenerate the ID; amend the doc; move on.
- **Worst case (forgetting to mint an ID):** an entity exists without an ID.
  Effect: the entity cannot be referenced precisely in commit messages or
  audit narrative. No system breakage. Recovery: mint and backfill the ID;
  optionally annotate prior commits via a follow-up commit.
- **Worst case (over-minting):** an ID is generated for something that didn't
  need one. Effect: extra noise in logs. Recovery: ignore.

There is no scenario in which E0 produces an external side effect, corrupts a
data store, or affects any user other than the operator-developer reading the
repo.

**Blast radius:** *internal-development-only, fully reversible.*

---

## 6. EXACT ROLLBACK PATH

E0 can be fully rolled back at any time:

1. Stop minting new IDs. Update `CLAUDE.md` / operating rules to remove the
   minting expectation.
2. Existing IDs in markdown and commit messages can remain or be stripped.
   They are inert; leaving them costs nothing and a future reactivation of E0
   keeps continuity.
3. The helper script (if any) is deleted.
4. Any `.idconfig`-style config file is deleted.

Rollback takes one commit. There is no migration, no state to drain, no in-
flight work to wait for.

If E1 has begun, rolling back E0 is more complex because E1 depends on E0.
Rolling back E0 then requires rolling back E1 first.

---

## 7. EXACT FORBIDDEN EXPANSION

The following are *not* part of E0 and must not slip in under the E0 banner:

| Forbidden expansion                                       | Why                                                    |
|-----------------------------------------------------------|--------------------------------------------------------|
| Storing IDs in a Supabase table                           | That is E1 (shadow externalization), not E0            |
| Tracking "current status" alongside the ID                | Status fields are E3 substrate, not E0 metadata        |
| A worker registry with online/offline state               | That is S0/S1 territory, not E0                        |
| A central "id allocator" service                          | E0 is local generation; a service is infrastructure    |
| ID-keyed lookup APIs                                      | E0 has no consumers other than humans                  |
| Linking IDs into a graph (parent/child, depends-on)       | DAG structure is E4, not E0                            |
| Auto-generating IDs from hooks at file save               | Couples E0 to tooling automation; defer until needed   |
| ID-based authorization or routing                         | Not E0; not even E2; not until much later              |
| Renaming existing entities to "match" new ID schemes      | Existing entities without IDs stay as they are         |

If a proposed change touches any row above, it is not E0 — it is a different
seed wearing E0's clothing.

---

## 8. EXACT SUCCESS CRITERIA

E0 is "successful" — i.e. ready to support E1 — when *all* of the following
hold for **at least two weeks of normal operation** (per
`TRANSITION_TO_DURABLE_RUNTIME.md` §11 stable-seed-period):

1. **Coverage.** Every new plan, work unit, and worker created during the
   period received an ID at the moment of creation.
2. **Format consistency.** All IDs follow the format in §3.1. No ad-hoc
   variants.
3. **Stability.** No ID has been reused, edited, or migrated. IDs minted on
   day 1 still refer to the same entities on day 14.
4. **Discoverability.** A grep for an ID across the repo returns the entity's
   creation context plus all subsequent references. No "lost" IDs.
5. **No drift in §2 of `SUBSTRATE_RESEARCH_STATE.md`.** The floor snapshot
   does not move; nothing in E0 changes any cell of that table. Recording
   E0 as "complete" *does not* upgrade any floor capability.
6. **No accidental consumer.** No process, hook, or skill consumes IDs to
   take an automated action. (If one appears, see §9.)

When all six hold, E1 may be considered. Until they hold, E1 is forbidden.

---

## 9. SEED CORRUPTION PATTERNS — E0-SPECIFIC

Ways E0 can drift into fake-runtime theater:

### 9.1 The "ID-as-status" corruption
Adding a status field to the same line as the ID — `(unt_… [in-progress])`
or similar. Status is not E0. The moment status appears, the system has
*shadow-leases without atomic transitions* (`SUBSTRATE_MIGRATION_RISKS.md` §3),
even if no one calls them that.
*Signal:* "let's just track whether it's done in the same place."

### 9.2 The "ID-keyed hook" corruption
A hook that fires on Stop, reads the current unit ID from `WORK_IN_PROGRESS.md`,
and "does the next thing." This is hook-as-supervisor (`SUBSTRATE_RESEARCH_
STATE.md` §6.2) using IDs as its addressing scheme.
*Signal:* "now that we have IDs, we can wire up a continuous loop."

### 9.3 The "registry creep" corruption
Maintaining a single file (`registry.json`, `ids.md`) that lists all extant
IDs. This crosses from E0 (IDs as labels) into a directory service. Now there
is a thing to keep in sync; now there is a question of who can write it; now
there is a half-built substrate table.
*Signal:* "we should keep a list so we know what's out there."

### 9.4 The "worker fleet" corruption
Minting `wkr_…` for things that are not the current session — pretending future
workers exist by giving them IDs. There is no fleet. There is one agent session
at a time. Pre-minting future-worker IDs creates an ontology the substrate
cannot back up.
*Signal:* "let's reserve `wkr_codex` and `wkr_overnight` so they're ready."

### 9.5 The "ID-implies-substrate" corruption
Documents or commit messages start describing AccentOS as having "stable
identity for substrate entities." Technically true; misleading. The §2 floor
shows item 8 (stable identity) at *partial* — it remains partial after E0
because units and workers gain IDs but the substrate that gives those IDs
their power (status, leases, audit) is still absent.
*Signal:* honest snapshot in `SUBSTRATE_RESEARCH_STATE.md` §2 starts
inflating after E0 lands.

### 9.6 The "automation seed" corruption
A small script written to "help mint IDs" grows into a service that watches
the filesystem, mints IDs on save, syncs them to a database, and provides an
API. The original helper was within scope; the service is not.
*Signal:* the helper acquires a daemon mode, a port, or a database
dependency.

### 9.7 The "retrofit" corruption
A push to backfill IDs onto every historical entity in the repo. Beyond a
minimal "tag the active in-flight items" pass, retrofit is a sink of
attention with no payoff. E0's value is *new* entities going forward; the
past is fine without IDs.
*Signal:* a multi-day project to "ID everything that's ever existed."

Each of these is a step toward fake-runtime construction. Recognize the
signals; don't take the step.

---

## 10. PRE-IMPLEMENTATION CHECKLIST

Before any code is written for E0 in a future build session:

- [ ] Confirm `SUBSTRATE_RESEARCH_STATE.md` §2 floor snapshot is current and
      shows item 8 as "partial" pre-E0 and "partial" post-E0 (no upgrade).
- [ ] Confirm no other seed work (S0, G0, anything later) is happening
      concurrently in a way that couples to E0. Each seed lands cleanly.
- [ ] Choose the exact ID format (suffix length, character set, sortability).
      This document specifies the *shape*; the exact bytes are an
      implementation choice and should be fixed once.
- [ ] Choose the helper mechanism (shell function vs script vs none) and
      its location in the repo. Helper must satisfy: no network, no daemon,
      no state.
- [ ] Pre-write the §10 corruption-pattern watchlist into the operator's
      session checklist so the signals are top-of-mind during E0 operation.
- [ ] Confirm `CLAUDE.md` / operating rules will be updated to *expect* IDs
      on new entities, but *not* to enforce them via hook (no automation in
      E0).
- [ ] Confirm there is no E0 code that runs after a session ends. E0 is
      session-local minting, period.

When the checklist is satisfied, E0 implementation can be performed in a
small, single-session change.

---

## 11. THE "THIS IS NOT RUNTIME" CLARIFICATION

After E0 lands, the honest description of the system is:

> AccentOS continues to operate as a session-coupled tooling system. New
> plans, work units, and worker sessions now carry stable identifiers in
> their commit messages, logs, and document headers. These identifiers are
> metadata for human reference and for future substrate consumers. **The
> substrate floor remains 0 of 10 in durable form. No process is supervised.
> No work survives session end. No queue exists.** E0 prepares the ground
> for E1 by ensuring future externalized entities arrive with identity
> already in place.

That paragraph (or its equivalent) is the language to use for E0 in any
status update, README, or AI-context-file. Anything stronger — anything
that calls AccentOS "more durable" or "more substrate-native" because of
E0 — is a §9.5 corruption.
