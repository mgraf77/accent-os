# QUEUE ITEM SCHEMA
# Compact Mobile-First Schema
# Version: 0.1 | Date: 2026-05-09

---

## PURPOSE

Minimum viable schema for a queue item. Optimized for:
- readable on a phone in 10 seconds
- writable in a single commit
- parseable without tooling (plain markdown)

---

## SCHEMA

```
id:           string      # kebab-case unique id  e.g. fix-auth-refresh-01
title:        string      # one line, plain english, max 60 chars
status:       enum        # READY | WAITING | RUNNING | DONE | FAILED | RETRY | DEAD | CANCELLED
priority:     int         # 1 (highest) – 5 (lowest)
created_at:   iso8601
updated_at:   iso8601

owner:
  session_id: string | null   # active session id if RUNNING
  claimed_at: iso8601 | null

inputs:
  - key: string
    value: string             # ref to file, branch, url, or literal

defer:
  condition_id: string | null   # from DEFER_CONDITION_CATALOG
  check_method: poll | webhook | manual-confirm
  check_target: string | null   # PR url, branch, deploy id, etc
  recheck_after: int            # minutes
  deferred_at: iso8601 | null
  cleared_at: iso8601 | null

retry:
  count: int          # default 0
  max: int            # default 3
  delay_min: int      # base delay in minutes (doubles each retry)
  last_attempt: iso8601 | null
  retry_after: iso8601 | null

result:
  summary: string | null       # one-paragraph plain english
  output_refs: [string]        # file paths, PR urls, deploy ids
  error_log: string | null     # populated on FAILED/DEAD

meta:
  tags: [string]               # e.g. ["auth", "mobile", "p0"]
  manual_override: bool        # true if last state change was manual
  override_reason: string | null
  session_budget_min: int      # default 45
```

---

## EXAMPLE ITEM (WAITING)

```
id:           fix-auth-refresh-01
title:        Fix token refresh race on mobile cold start
status:       WAITING
priority:     1
created_at:   2026-05-09T10:00:00Z
updated_at:   2026-05-09T11:42:00Z

owner:
  session_id: sess_abc123
  claimed_at: 2026-05-09T11:00:00Z

inputs:
  - key: branch
    value: fix/auth-refresh-race
  - key: ticket
    value: docs/mvhb/tickets/AUTH-009.md

defer:
  condition_id: waiting-for-review
  check_method: poll
  check_target: https://github.com/mgraf77/accent-os/pull/42
  recheck_after: 15
  deferred_at: 2026-05-09T11:42:00Z
  cleared_at: null

retry:
  count: 0
  max: 3
  delay_min: 10
  last_attempt: null
  retry_after: null

result:
  summary: null
  output_refs: []
  error_log: null

meta:
  tags: ["auth", "mobile", "p1"]
  manual_override: false
  override_reason: null
  session_budget_min: 45
```

---

## EXAMPLE ITEM (DONE)

```
id:           update-onboarding-copy-03
title:        Update onboarding step 2 copy for accent coach
status:       DONE
priority:     3
created_at:   2026-05-08T09:00:00Z
updated_at:   2026-05-09T08:55:00Z

owner:
  session_id: sess_xyz789
  claimed_at: 2026-05-09T08:10:00Z

inputs:
  - key: copy_doc
    value: docs/copy/onboarding-v2.md
  - key: component
    value: src/components/Onboarding/Step2.tsx

defer:
  condition_id: null
  check_method: null
  check_target: null
  recheck_after: 0
  deferred_at: null
  cleared_at: null

retry:
  count: 0
  max: 3
  delay_min: 10
  last_attempt: null
  retry_after: null

result:
  summary: Updated Step2.tsx headline and subtext per copy doc v2. No
           logic changes. Committed to main, deployed to staging.
  output_refs:
    - src/components/Onboarding/Step2.tsx
    - https://github.com/mgraf77/accent-os/commit/deadbeef
  error_log: null

meta:
  tags: ["copy", "onboarding"]
  manual_override: false
  override_reason: null
  session_budget_min: 45
```

---

## FIELD CONSTRAINTS

- id: immutable after creation
- title: max 60 chars, no special chars except hyphens
- priority 1 items are always claimed before priority 2+
- result.summary: required before transitioning to DONE
- defer.condition_id: must match an entry in DEFER_CONDITION_CATALOG
- session_budget_min: hard limit, not a suggestion
