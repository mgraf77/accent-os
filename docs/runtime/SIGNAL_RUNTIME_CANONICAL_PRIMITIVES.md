# SIGNAL_RUNTIME_CANONICAL_PRIMITIVES
**Status:** authoritative function contracts · **Pairs with:** CANONICAL_SIGNAL_RUNTIME_V1.md
**Scope:** signatures and semantics only — no rewrites of `js/alerts.js`. These are the names every future implementation must match.

> All seven primitives are **pure with respect to the Signal model**: they read/write only `alerts` (and inputs) and never call external systems in V1.

---

## 1. `createSignal(input) → Signal | null`

```
input = {
  type:          string  // must be in §4.1 type registry
  source_id:     string  // generator-stable identifier of the underlying record
  severity?:     'info' | 'warn' | 'urgent'  // defaults to type's floor
  title:         string
  body?:         string
  link?:         string
  payload?:      object  // generator-specific evidence; MUST include source_id
  recipient_id?: uuid | null
  recipient_role?: string | null
  confidence?:   number  // [0,1]; persists in payload.confidence
}
```

**Semantics:**
1. Reject if `type` not in §4.1.
2. Reject if `severity` not in §4.2.
3. Compute dedupe key `(type, source_id)`. If `shouldSuppress(key)` → return `null`.
4. INSERT row into `alerts` with `status='unread'`. Return the inserted Signal.

**Returns** the new Signal, or `null` when suppressed.
**Never throws** for "already exists" — that's suppression, not an error.

---

## 2. `transitionSignal(signalId, nextState, actor) → Signal`

```
nextState ∈ { 'read', 'dismissed', 'actioned' }
```

**Semantics:**
1. Load Signal. If current state is terminal (`dismissed` | `actioned`) → reject.
2. Validate transition against the lifecycle DAG in runtime §5.1.
3. On `read`, set `read_at = now()` if null.
4. UPDATE `alerts.status = nextState` and return the updated row.

**This is the ONLY sanctioned mutator of `alerts.status`.**

---

## 3. `computeDelta(signal, currentSourceRow) → DeltaReport`

```
DeltaReport = {
  changed:     boolean
  fields:      string[]   // which fields of the underlying source row changed
  severityShouldChange?: 'info'|'warn'|'urgent'
}
```

**Semantics:**
Compare the `payload` snapshot at emit time to the current state of the underlying source row identified by `source_id`. Used by Phase 1 dedupe to decide whether an existing unresolved Signal is still describing reality. **Does NOT mutate** anything; pure read.

In V1, `severityShouldChange` is advisory only — no auto-promotion (§6 of runtime).

---

## 4. `evaluateConfidence(generatorCtx) → number`

```
returns: number in [0.0, 1.0]
```

**Semantics:**
Generator-local function. Default implementation returns `1.0` (the existing 9 generators are deterministic). When a generator opts in (Phase 3), it implements this to derive a confidence from the inputs. Result is written to `payload.confidence`.

Forbidden: returning values outside [0,1]; returning strings or tiers (governance §7).

---

## 5. `shouldEscalate(signal) → boolean`

**Canonical implementation (V1, frozen):**
```
shouldEscalate(s) :=
     s.severity === 'urgent'
  && s.status   === 'unread'
  && (now - s.created_at) > 24h
```

No other inputs. No paging side effects. Pure predicate. Feeds the X12 dashboard view (Phase 4).

---

## 6. `shouldSuppress(dedupeKey) → boolean`

**Canonical implementation:**
```
shouldSuppress((type, source_id)) :=
   EXISTS row in alerts WHERE
        type = $type
    AND payload->>'source_id' = $source_id
    AND status IN ('unread', 'read')      -- non-terminal
```

Generators MUST call this (or an equivalent SELECT) before INSERT. A future SQL unique partial index may enforce it; see ENTROPY_RISKS §index-design.

---

## 7. `queuePriority(signal) → (number, timestamp)`

**Canonical implementation (used for bell + queue ordering):**
```
queuePriority(s) :=
  ( severityRank(s.severity), s.created_at )
  where severityRank: urgent=3, warn=2, info=1
  sort: severityRank DESC, created_at DESC
```

This is the **only** sanctioned ordering. UI surfaces (bell dropdown, alerts page) must use it.

---

## Cross-cutting invariants

- Every primitive is idempotent at the dedupe-key granularity.
- No primitive writes outside `alerts`.
- No primitive sends external notifications in V1.
- `createSignal` and `transitionSignal` are the only writers; everything else is read-only.
