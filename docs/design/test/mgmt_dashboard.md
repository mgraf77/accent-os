# Golden-Path: Mgmt Dashboard
> Module key: `mgmt_dashboard` · Phase 4 second migration · ≤5 min run.

**Scope:** Overview / KPIs / Goals / Team Activity / System sub-tabs. Owner+Admin+Manager only.

```
[ ] 1. Desktop: log in as Owner; open Mgmt Dashboard; default sub-tab (Overview) renders; KPI cards populate
[ ] 2. Sub-tab navigation: Overview → KPIs → Goals → Team Activity → System; each mounts ≤2s; no leaks
[ ] 3. Mobile 390px: sub-tab strip horizontally scrollable; each card readable single-column; targets ≥44pt
[ ] 4. Role visibility: Owner+Admin+Manager see; Sales+Warehouse do not (sidebar + direct hash both blocked)
[ ] 5. canSeeModule: Sales user pasting `#/mgmt` URL is redirected; no panel renders
[ ] 6. Mount/unmount: open Goals, navigate away, return; goal tree state resets cleanly (no stale parents)
[ ] 7. Navigation continuity: deep link `#/mgmt/kpis` lands directly on KPIs sub-tab on cold load
[ ] 8. JSON parse: `jq '.modules.mgmt_dashboard'` returns object; mode advances per phase plan
[ ] 9. Rollback dry-run on staging: testing→building flip hides from Admin/Manager; Owner retains
[ ] 10. CF deploy green ≤60s; v1 Mgmt surface (if still mounted) renders identical KPI numbers
```

**Module-specific risk highlights:**
- F4 role visibility: this module has the widest role span — re-test all 5 roles after every flip.
- F2 lazy-load partial: 5 sub-tabs = 5 chunks — keep dynamic imports to one level (mount), static imports for sub-tabs.
- KPI parity: numbers must match v1 byte-for-byte. Any rounding drift = freeze.

**Rollback paste-block:**
```
# module_modes.json: mgmt_dashboard.mode = "<prior_mode>"
git commit -m "revert: mgmt_dashboard to <prior_mode>"
```
