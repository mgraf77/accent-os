# Golden-Path: Pipeline (read-only v2)
> Module key: `pipeline_read_v2` · Phase 4 third migration · ≤5 min run.
> **Read-only.** Write paths stay in v1 until Phase 5.

```
[ ] 1. Desktop: open Pipeline v2; deal list renders; 8-factor probability column populated; archive view reachable
[ ] 2. Forecast/close-rate stats render and match v1 numbers (visual diff on Owner side-by-side)
[ ] 3. Mobile 390px: deal cards stack; probability badge readable; archive accessible from overflow menu
[ ] 4. Role visibility: Owner+Admin+Manager+Sales see; Warehouse does not
[ ] 5. canSeeModule: Warehouse hash-paste blocked; sidebar entry absent
[ ] 6. Mount/unmount: open deal detail, close, reopen; no duplicate fetches; no stale probability values
[ ] 7. Navigation continuity: filter state preserved on tab-switch within session; cleared on full reload (expected)
[ ] 8. JSON parse: `jq '.modules.pipeline_read_v2'` valid; v1 `pipeline` entry untouched in same commit
[ ] 9. Rollback dry-run: flip back to building; v2 disappears for Sales; v1 Pipeline still primary write surface
[ ] 10. CF deploy green ≤60s; no v2 write attempts in audit_log (`source: 'shell_v2'` count = 0 for pipeline rows)
```

**Module-specific risk highlights:**
- F3 divergence: Phase 4 is read-only for v2. Any write coming from v2 here is a P1 — auto-rollback.
- F1/F2 injection: probability calculator is computed client-side; ensure helper imports static, not dynamic.
- Parity: 8-factor scores must match v1 to 2 decimal places. Drift = freeze.

**Rollback paste-block:**
```
# module_modes.json: pipeline_read_v2.mode = "<prior_mode>"
git commit -m "revert: pipeline_read_v2 to <prior_mode>"
```
