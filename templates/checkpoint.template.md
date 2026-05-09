# Checkpoint Template

Used by CHECKPOINT_LOOP when overwriting `runtime-state/CANONICAL_RUNTIME_STATE.md`. Keep
the section order; it is canonical.

```
# CANONICAL RUNTIME STATE — checkpoint <id>

## 1. Meta
last_updated:        <ISO timestamp>
last_checkpoint_id:  <monotonic int>
current_mode:        <mode>

## 2. Active Build Surface
- <module-slug>: <one-line status>
- <module-slug>: <one-line status>

## 3. In-Flight Work
pointer: WORK_IN_PROGRESS.md
summary: <one paragraph, ≤ 4 lines>

## 4. Last Known Good
commit:        <SHA>
checkpoint_id: <id>
captured_at:   <ISO date>

## 5. Open Mutations
- patch:<patch-id> owner:<name> ETA:<date> status:<state>

## 6. Active Risks (top 5)
pointer: runtime-state/ACTIVE_RISKS.md
- R<id> sev:<S> <title>     mitigation:<one liner>
... (max 5)

## 7. Suspended Areas
- <module-slug>: reason:<one liner> thaw_when:<condition>

## 8. Runtime Health (snapshot)
RCI:           <value | null>
entropy_delta: <value | null>
gov_lag:       <value | null>
cv:            <value | null>
rv:            <value | null>
runtime_health: <value | null>

## 9. Next Required Read
1. <file>
2. <file>
3. <file>
```

## Rules
- File hard cap: 200 lines (per CANONICAL_RUNTIME_STATE.md spec).
- Every section appears, every cycle. Use `(none)` for empty sections — never omit.
- Field values may be `unknown` or `null`, but the field key must remain.
