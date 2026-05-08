# Golden-Path: Quote Generator (read-only v2)
> Module key: `quotes_read_v2` · Phase 4 fourth migration · ≤5 min run.
> **Read-only.** Hard-blocks: Anthropic-proxy WIP bug must be CLOSED before this module enters `building`.

```
[ ] 1. Pre-flight: confirm WORK_IN_PROGRESS.md empty AND Parse Notes returns 200 on 5/5 calls
[ ] 2. Desktop: open Quotes v2; saved quote list renders; click quote → detail view; lines + totals match v1
[ ] 3. Track calc: open a multi-line quote; track totals match v1 byte-for-byte (no rounding drift)
[ ] 4. Mobile 390px: quote list scrollable; line items readable single-column; CSV export button reachable
[ ] 5. Role visibility: Owner+Admin+Manager+Sales see; Warehouse does not
[ ] 6. Mount/unmount: open quote → list → quote; line state resets; no duplicate XHRs to `/quote_lines`
[ ] 7. Navigation continuity: deep link `#/quotes/<id>` cold-loads to detail; reload preserves
[ ] 8. JSON parse + v1 untouched: `quotes_read_v2` entry added; v1 `quotes` entry mode unchanged in same commit
[ ] 9. Rollback dry-run: flip back; v2 hidden; v1 Quote Generator (write path) still default
[ ] 10. CF deploy green ≤60s; audit_log shows zero `source: 'shell_v2'` writes against `quotes` or `quote_lines`
```

**Module-specific risk highlights:**
- **HARD BLOCK** until Anthropic proxy `2dca2a6` deployed and Parse Notes returns 200. F1 risk is elevated otherwise.
- F3 divergence: quote totals must match v1 byte-for-byte; any drift = instant freeze (data-integrity surface).
- AI calls are v1-only in Phase 4. v2 read view does NOT call the worker.

**Rollback paste-block:**
```
# module_modes.json: quotes_read_v2.mode = "<prior_mode>"
git commit -m "revert: quotes_read_v2 to <prior_mode>"
```
