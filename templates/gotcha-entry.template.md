# Gotcha Entry Template

Two distinct templates here:

1. **Gotcha definition** — added to `audits/GOTCHA_REGISTER.md` (C5).
2. **Gotcha observation** — appended to `audits/AUDIT_LOG.md` (C1) when a known gotcha is
   detected in a session.

## (1) Gotcha Definition (for GOTCHA_REGISTER.md)

```
id:          <slug>
title:       <one line>
detection:   <deterministic rule; bash/grep/manual-review steps>
severity:    <CRIT | HIGH | MED | LOW>
auto-fix:    <no | A1..A5 from AUTO_FIX_POLICY>
escalation:  <which trigger E# applies, or 'none'>
rollback:    <one-liner; n/a if read-only>
first_seen:  <YYYY-MM-DD | n/a>
status:      <tracking | mitigated | recurring | closed | deferred>
```

## (2) Gotcha Observation (for AUDIT_LOG.md)

```
[<ISO timestamp>] gotcha:<id> sev:<S> mode:<mode>
  evidence:    <pointer to commit, file:line, or session note>
  context:     <≤ 2 lines>
  routed_to:   <DER der-id | escalation E# | next patch plan | nothing>
  resolved:    <yes | no | partial>
```

## Rules
- A gotcha definition cannot be removed once added — only `status: closed`.
- An observation links to a definition's `id`. Observations of unknown gotchas trigger
  a definition request (C5).
- Observation count per id is tracked over time; recurrence trends drive M2 and severity
  re-assessment.
