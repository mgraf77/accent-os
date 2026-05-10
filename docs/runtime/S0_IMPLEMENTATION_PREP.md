# S0 IMPLEMENTATION PREP — HEARTBEAT EMISSION SEED

> **Status:** implementation preparation. Not implementation.
> **Substrate seed:** S0 (heartbeat).
> **Stage in transition path:** parallel-safe seed; precedes S1 (passive
> observer) by weeks of stable operation. No supervisor exists at S0.
> **Read first:** `SUBSTRATE_RESEARCH_STATE.md` §8 (defensible order),
> `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` §6 (supervision model),
> `SUPERVISOR_WORKER_BOUNDARIES.md` §3.1 (worker heartbeat contract).

---

## 1. WHAT THIS SEED IS

S0 introduces **heartbeat emission** — the agent session, while it is alive
and doing AccentOS work, periodically writes a small record indicating "I am
alive at this moment, with this identity." The records are durable and
externally observable.

S0 has *no consumer*. Nothing reads the heartbeats yet. There is no
supervisor, no observer process, no alerting, no escalation. The records
accumulate; the operator can read them by hand if curious, but no automated
behavior depends on them.

The point is to:
- exercise the durable-write path that future substrate work will use,
- accumulate weeks of real-world heartbeat data so its cadence and noise
  characteristics are known *before* a supervisor ever consumes them,
- make the absence of a heartbeat a meaningful signal once S1 lands.

---

## 2. WHAT THIS SEED IS *NOT*

S0 is **not** any of the following. Drift toward any of these is an S0
corruption (see §9):

- **Not** a supervisor. Nothing watches the heartbeat. Nothing restarts
  anything. Nothing escalates on absence.
- **Not** a worker registry. The heartbeat records "this session was alive
  at this time"; it does not assert "this session is the worker for X."
- **Not** crash detection. A missing heartbeat at S0 is just absence — no
  alert, no log entry "supervisor noticed worker died," nothing.
- **Not** a health check. There is no "healthy / unhealthy" derivation. The
  record says "alive at moment T," nothing more.
- **Not** an audit log. Heartbeats record presence, not transitions or
  actions.
- **Not** session-resumption signal. A new session does *not* read prior
  heartbeats to "pick up where it left off."
- **Not** an upgrade to the floor. The §2 snapshot in
  `SUBSTRATE_RESEARCH_STATE.md` does not move when S0 lands. Floor item 5
  (heartbeat + crash detection) stays "absent" because crash detection is
  the load-bearing half and S0 has none of it.

**Bright line:** if any process other than humans reading rows by hand
*acts on* the presence or absence of a heartbeat, S0 has been over-built.

---

## 3. EXACT MINIMAL IMPLEMENTATION SHAPE

S0 is the smallest possible code change that produces durable heartbeat
records.

### 3.1 What a heartbeat record contains

Five fields. No more.

| Field            | Type            | Source                                                        |
|------------------|-----------------|---------------------------------------------------------------|
| `id`             | uuid / ulid     | Generated per-record at write time                            |
| `worker_id`      | string          | Current session's `wkr_…` ID (from E0). Required.             |
| `emitted_at`     | timestamptz     | Moment of emission. Server-side default acceptable.           |
| `kind`           | enum / string   | `start` | `tick` | `stop`. Three values total.                  |
| `note`           | string nullable | Optional free-text, capped at ~120 chars. Default empty.      |

Nothing else. No status field. No "current task." No "last action." No
capability list. No host/IP. No version. Each of those is a different seed.

### 3.2 When a heartbeat is emitted

Three emission points only:

1. **`start`** — at the beginning of an AccentOS-related session, after the
   session's `worker_id` is established (per E0 §3.2).
2. **`tick`** — every N minutes during the session while AccentOS work is
   active. N is **5 minutes** as a default; finalize during pre-implementation.
3. **`stop`** — at the end of the session, on clean shutdown. (S0 makes no
   guarantee that `stop` is emitted on every termination — crash-without-stop
   is the normal case and is exactly what S1+ would later detect.)

`tick` does not need to be precise. ±30 seconds is fine. There is no
sub-minute substrate consumer.

### 3.3 How a heartbeat is written

The agent calls a single, narrow primitive — a one-line write to the
heartbeats table — at each emission point. It is acceptable for the agent to
call this primitive directly (no intermediate service). The primitive must:

- be idempotent at the row level (each emission is a new row; no upsert);
- fail loudly to the operator if the substrate is unreachable, but **never
  block** ongoing work — a missed heartbeat is not an error condition for
  S0.

Failure mode hierarchy at S0:
- **Substrate up, write succeeds:** record appears.
- **Substrate up, write fails (network blip):** the agent logs the failure
  to `PROMPT_LOG.md` and continues. No retry. The heartbeat is just missed.
- **Substrate down for the whole session:** the session works without
  heartbeats. A note is logged once. Operator hears about it later.

S0 must tolerate substrate outages without becoming the limiting factor for
work. That is itself a property worth exercising before S1 ever lands.

### 3.4 What the agent does not do

- Does **not** read heartbeats from prior sessions.
- Does **not** decide "I should restart" based on a missing heartbeat.
- Does **not** spawn a separate process to keep emitting after the session
  ends.
- Does **not** vary its behavior based on heartbeat success or failure.

---

## 4. EXACT REQUIRED PERSISTENCE

A single Supabase table. Smallest possible shape.

### 4.1 Table: `runtime_heartbeats`

```
runtime_heartbeats
├── id            uuid    primary key, default gen_random_uuid()
├── worker_id     text    not null
├── emitted_at    timestamptz  not null, default now()
├── kind          text    not null  check (kind in ('start','tick','stop'))
└── note          text    null
```

That is the entire schema. No foreign keys (workers don't have a registry
yet). No indexes beyond the primary key (volume is tiny — at 5-minute ticks
across heavy daily use, hundreds of rows per day, not thousands).

### 4.2 RLS / permissions

- **Read:** operator only. No public read. No anon-key read.
- **Insert:** restricted to a service-role or authenticated-as-operator path
  the agent uses. No public insert; the table is not part of the
  Anthropic-proxy worker's surface.
- **Update / delete:** disallowed for the agent and operator alike during
  S0. (Truncation for testing is operator-only via a separate admin path.)

The table is an append-only log of presence. Editing past entries violates
the future audit-log discipline (`SUBSTRATE_MIGRATION_RISKS.md` §13 mistake
#5). Disallowing it now keeps the discipline cheap.

### 4.3 No retention policy yet

Rows accumulate. At ~300 rows/day, a year is ~110k rows — trivial for
Postgres. A retention policy is a separate question for a later seed; do not
introduce one at S0.

---

## 5. EXACT BLAST RADIUS

The set of effects S0 can possibly produce, even when wrong:

- **Worst case (heartbeats stop being emitted):** rows stop accumulating.
  Effect: nothing. No consumer notices because there is no consumer. The
  next session resumes emitting on its own. Recovery: investigate why the
  agent stopped emitting; restore.
- **Worst case (heartbeats are emitted from sessions that aren't doing
  AccentOS work):** noise rows. Effect: harmless; a future S1 observer would
  ignore them or scope its read by `worker_id` pattern. Recovery: tune
  emission triggers; ignore historical noise.
- **Worst case (heartbeat write fails repeatedly):** error noise in
  `PROMPT_LOG.md`; no work is blocked. Recovery: diagnose substrate
  reachability; the agent's substantive work is unaffected.
- **Worst case (substrate is down):** no rows written for the duration. No
  cascading effect. Recovery: substrate restored; emissions resume; the gap
  is a permanent feature of the historical record (and a useful one — it
  shows when the substrate was unreachable).

There is **no** scenario in which S0 produces an external side effect
(emails, money, deploys), corrupts business data, affects users, or causes
the agent to make different decisions about substantive work.

**Blast radius:** *substrate-only, append-only, fully reversible.*

---

## 6. EXACT ROLLBACK PATH

S0 can be fully rolled back at any time:

1. Stop emitting heartbeats. Update operating rules to remove the emission
   expectation. The agent simply stops calling the write primitive.
2. The `runtime_heartbeats` table can either remain (inert; harmless) or be
   dropped. Recommendation: keep the table dropped/truncated only if S0 is
   being abandoned long-term; otherwise leave it.
3. The narrow write primitive can be deleted from the agent's tooling path.

Rollback is one to two commits. There is no migration of existing data, no
in-flight process to drain, no consumer to notify (because there is no
consumer).

If S1 has already begun (a passive observer process exists), rolling back S0
requires rolling back S1 first or the observer will alarm on the absence.
But S1 is itself a separate seed and is forbidden until S0 is stable per §8.

---

## 7. EXACT FORBIDDEN EXPANSION

The following are *not* part of S0 and must not slip in under the S0 banner:

| Forbidden expansion                                          | Why                                                       |
|--------------------------------------------------------------|-----------------------------------------------------------|
| A process that reads `runtime_heartbeats` and acts on absence | That is S1 (passive observer); not S0                    |
| Alerting / paging on missed heartbeats                        | That is S1+ at minimum, possibly S3 territory            |
| Restart logic ("I haven't heartbeat in N minutes, so…")       | That is full supervision (S3); never partial             |
| Heartbeats that include current-task status                   | That conflates S0 (presence) with E3 (lease/status)      |
| Multi-row atomic batches of heartbeats                        | A heartbeat is a single row; complexity is not warranted |
| A "supervisor" markdown doc claiming S0 implements supervision | That is the hook-as-supervisor anti-pattern             |
| Cross-session "did the prior session crash" inference         | Not at S0. The data exists; the inference is forbidden.  |
| Per-tool-call heartbeats                                      | Far too granular; rejects the substrate, not load-tests it|
| A heartbeats-reading dashboard tab in AccentOS                | Operator pane is its own seed; not bundled with S0       |
| Auto-resuming a "session" based on heartbeat history          | Session resumption requires plan externalization (E1+)   |

If a proposed change touches any row above, it is not S0 — it is S1 or
later, premature, and will create a fake-runtime illusion.

---

## 8. EXACT SUCCESS CRITERIA

S0 is "successful" — i.e. ready to support S1 — when *all* of the following
hold for **at least four weeks of normal operation** (heartbeat data
characteristics need real-world calibration):

1. **Coverage.** Every AccentOS-related session of nontrivial duration
   emitted at least one `start`, at least some `tick`s, and either a `stop`
   or a known reason for the missing `stop`.
2. **Cadence honesty.** The actual interval between `tick` emissions is
   close to the configured N minutes (within tolerance). If it isn't, the
   discrepancy is understood and recorded — *before* a future supervisor
   uses cadence as a liveness signal.
3. **Failure transparency.** When the substrate was unreachable, that fact
   is visible in the heartbeat history (a gap) and in `PROMPT_LOG.md` (a
   logged note). No silent gaps.
4. **No drift in §2 of `SUBSTRATE_RESEARCH_STATE.md`.** Floor item 5
   (heartbeat + crash detection) stays at "absent" — heartbeats alone don't
   move it; crash *detection* is the load-bearing half.
5. **No accidental consumer.** No process, hook, or skill reads heartbeats
   to take an action. (If one appears, see §9.)
6. **No identity drift.** Every heartbeat carries a `worker_id` consistent
   with E0's identity scheme. No anonymous heartbeats.

When all six hold, S1 may be considered. Until they hold, S1 is forbidden.

---

## 9. SEED CORRUPTION PATTERNS — S0-SPECIFIC

Ways S0 can drift into fake-runtime theater:

### 9.1 The "heartbeat-as-supervision" corruption
A note appears in CLAUDE.md or in a PR description: "AccentOS now has
supervision via heartbeats." It does not. S0 is *emission*; supervision
requires a *consumer* that detects absence and *acts*. Calling S0
"supervision" is the hook-as-supervisor anti-pattern wearing a heartbeat
costume.
*Signal:* the word "supervision" or "monitoring" appears alongside
"heartbeat" in any non-research doc.

### 9.2 The "let's just add status" corruption
A field is added to the heartbeat row: `current_task`, `progress_pct`,
`last_action`. Each is well-meaning. Each turns the heartbeat table into a
substrate fragment of plan/lease/audit, none of which are E3/E4 yet. This
produces shadow-lease-without-atomic-CAS exposure
(`SUBSTRATE_MIGRATION_RISKS.md` §3) before any real lease semantics exist.
*Signal:* schema review proposes any column beyond the five in §3.1.

### 9.3 The "auto-restart" corruption
A small script runs on a cron (or as a Stop hook) that detects "no heartbeat
in 10 minutes" and "restarts the agent." This is partial supervision built
on partial substrate. It *will* misfire under network blips. It *will*
double-execute under race conditions. It is the worst combination: the
illusion of recovery without the discipline of recovery.
*Signal:* anything that programmatically responds to heartbeat absence
appears in any branch.

### 9.4 The "frequency arms race" corruption
The tick interval drops from 5 minutes to 1 minute to 10 seconds because
"more data is better." It is not. Heartbeats are presence signals; their
value comes from being trustable, not granular. Sub-minute heartbeats start
to look like a substrate timing channel and invite features that depend on
sub-minute timing.
*Signal:* the tick interval starts being tuned for "responsiveness."

### 9.5 The "cross-session continuity" corruption
A new session reads the prior session's heartbeats and infers "the prior
session was working on plan X; let me continue." This is session
resumption, which requires plan externalization (E1+) *and* lease semantics
(E3) — both substrate-shaped capabilities forbidden at S0. Inferring intent
from heartbeats is plan reconstruction from a presence log.
*Signal:* an agent prompt or skill reads `runtime_heartbeats` to influence
what the next session does.

### 9.6 The "operator alarm channel" corruption
An out-of-band alert (email, push, Slack) is wired to fire when heartbeats
stop. The alert is itself an irreversible side effect (an email sent is an
email sent) and crosses into the gated action classes
(`SUPERVISOR_WORKER_BOUNDARIES.md` §12) — without a real gate.
*Signal:* a notification integration is added on the back of S0.

### 9.7 The "registry retrofit" corruption
The `worker_id` field gains a foreign-key relationship to a workers table
that didn't exist before. This sneaks in a worker registry (forbidden under
E0 §9.4) via the heartbeat schema.
*Signal:* a `workers` table appears alongside `runtime_heartbeats`.

### 9.8 The "S0 = floor item 5" corruption
The §2 snapshot in `SUBSTRATE_RESEARCH_STATE.md` is updated to mark item 5
as "partial" because heartbeats now exist. This is the most insidious
corruption because it looks like honest progress tracking. It is not. Item
5 is "heartbeat *and* crash detection." Without the second half, it stays
"absent." Cadence data exists; nothing detects crashes.
*Signal:* any update to §2 that upgrades item 5 on the strength of S0
alone.

Each of these is fake-runtime construction in a heartbeat costume.
Recognize the signals; don't take the step.

---

## 10. PRE-IMPLEMENTATION CHECKLIST

Before any code is written for S0 in a future build session:

- [ ] Confirm E0 has been stable for at least the §8 minimum. S0's
      `worker_id` field requires E0's identity scheme to be in place and
      reliable. S0 *follows* E0; it does not run in parallel.
- [ ] Confirm `SUBSTRATE_RESEARCH_STATE.md` §2 floor snapshot will *not*
      move on item 5 as a result of S0 landing. Pre-write the snapshot
      update so the discipline is explicit.
- [ ] Choose the exact tick interval (default 5 minutes; finalize the
      number).
- [ ] Choose the exact write primitive: a Supabase client call from the
      agent's existing tooling, with credentials scoped to inserting into
      `runtime_heartbeats` only. The credential must not grant write to any
      other table.
- [ ] Confirm RLS / permissions per §4.2 — operator-only read; restricted
      insert path; no update/delete.
- [ ] Confirm there is no S0 code that runs after the session ends.
      `stop` is emitted as part of the session's shutdown, not by an
      external process.
- [ ] Pre-write the §9 corruption-pattern watchlist into the operator's
      session checklist so the signals are visible during the four-week
      stable-operation period.
- [ ] Confirm `CLAUDE.md` operating rules will be updated to expect S0
      emission but **not** to interpret heartbeat data for any purpose.

When the checklist is satisfied, S0 implementation can be performed in a
small, single-session change.

---

## 11. THE "THIS IS NOT RUNTIME" CLARIFICATION

After S0 lands, the honest description of the system is:

> AccentOS sessions emit a small "I am alive" record to a Supabase table at
> session start, every five minutes during work, and at session end. The
> records carry the session's `worker_id` and a timestamp. **Nothing reads
> these records. There is no supervisor. There is no crash detection. The
> substrate floor remains 0 of 10 in durable form, with item 5 (heartbeat
> + crash detection) still scored "absent" because crash detection — the
> load-bearing half — does not exist.** S0 prepares the ground for S1
> (passive observer) by ensuring real-world heartbeat data is available
> for a future consumer to calibrate against.

That paragraph (or its equivalent) is the language to use for S0 in any
status update, README, or AI-context-file. Anything stronger — anything
that calls AccentOS "supervised," "monitored," or "more durable" because
of S0 — is a §9.1 or §9.8 corruption.
