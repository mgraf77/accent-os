# Golden-Path: Daily Command Center
> Module key: `daily_command_center` · Phase 1 beachhead · ≤5 min run.

**Why this is the beachhead:** read-mostly, role-aware, already shipped in v1, lowest entropy to migrate.

```
[ ] 1. Desktop: log in as Owner; open Daily Command Center; Today card renders for current date; no console errors
[ ] 2. Tile coverage: all 10 brief tiles render without "loading…" stuck >3s; numbers match v1 surface
[ ] 3. Mobile 390px: tiles stack single-column; no horizontal scroll; tap each tile target ≥44pt
[ ] 4. Role visibility (5 roles via per-user override on Owner machine):
       Owner → all tiles · Admin → mgmt+sales · Manager → mgmt+sales · Sales → sales tiles · Warehouse → warehouse tiles
[ ] 5. canSeeModule: with mode=`building`, only Owner sees sidebar entry; flip to `testing`, Admin gains access
[ ] 6. Mount/unmount: nav to Vendor → back to DCC; tile counts stable; no duplicate row listeners
[ ] 7. Navigation continuity: hard reload on `#/daily` lands back on DCC; back-button from DCC returns to prior tab
[ ] 8. JSON parse: `jq '.modules.daily_command_center'` returns object with `mode` + `title`
[ ] 9. Rollback dry-run on staging: flip building→idea_only; sidebar entry vanishes for Owner; flip back; entry returns
[ ] 10. Cloudflare deploy green ≤60s post-flip; v1 Daily Brief surface unchanged on curl snapshot diff
```

**Module-specific risk highlights:**
- F3 state divergence: DCC is read-only; risk is low. Do not introduce write paths in Phase 1.
- F5 mobile: tile density is the most likely 390px regression; check per-role mobile separately.
- F8 drift: per-role tile sets are the highest-override-pressure surface — log every override.

**Rollback paste-block:**
```
# module_modes.json: daily_command_center.mode = "idea_only"
git commit -m "revert: daily_command_center to idea_only"
```
