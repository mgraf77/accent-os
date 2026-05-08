# Golden-Path Checklist Template
> ≤10 steps · ≤5 min · operational survivability, not exhaustive QA.
> Run before any `module_modes.json` flip that increases visibility.

**Module:** `<module_key>`  
**Surface:** v1 / v2-read / v2-write  
**Phase target:** building → testing / testing → live / live → deprecated  
**Run by:** primary session (Claude) on staging, then captain spot-check on prod URL.  
**Pass condition:** all 10 boxes checked. Any miss = no-flip.

```
[ ] 1. Desktop golden path (Chrome 1280×800): module mounts, primary action completes, no console errors
[ ] 2. Mobile parity (iPhone Safari 390×844): no horizontal scroll; all interactive targets ≥44pt
[ ] 3. Role visibility: open as each of 5 roles via per-user override; sidebar matches expected
[ ] 4. canSeeModule honored: no inline role check bypass; resolver returns expected for each role
[ ] 5. Mount/unmount: navigate away then back; no duplicate listeners; no leaked DOM outside rootEl
[ ] 6. Navigation continuity: hash route restores on reload; back/forward not broken
[ ] 7. JSON parse: `jq . module_modes.json` succeeds; module key present at intended mode
[ ] 8. Rollback dry-run: flip mode → previous mode on staging; verify; flip forward; verify
[ ] 9. Notification/error path: a forced failure shows passive placeholder, not a thrown shell
[ ] 10. CF deploy green within 60s of flip commit; curl snapshot diff vs. pre-flip = expected only
```

**Rollback command (paste into commit body of the flip):**
```
# revert: flip <module_key> back to <prior_mode>
# edit module_modes.json: modules.<module_key>.mode = "<prior_mode>"
# git commit -m "revert: <module_key> back to <prior_mode>"
```
