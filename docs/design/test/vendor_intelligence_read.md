# Golden-Path: Vendor Intelligence (read-only v2)
> Module key: `vendor_intelligence_read_v2` · Phase 4 fifth migration · ≤5 min run.
> **Highest data-complexity module.** Read-only in Phase 4. Write paths (score states, overrides) stay in v1 until Phase 5.

```
[ ] 1. Desktop: open Vendor Intelligence v2; vendor list renders 476 active vendors; sort by score works
[ ] 2. Tier badges: A/B/C tiers match v1 distribution; inactive vendors (ELK HOME, SAYLITE TX) excluded from cutoff
[ ] 3. Vendor detail: open a vendor; 14-category breakdown renders; verified/unverified/N/A states match v1
[ ] 4. Rep View role variant: log in as Rep role via override; **Rep Score category MUST be hidden** (hard rule)
[ ] 5. Mobile 390px: vendor list scrollable; detail modal usable; tier badge legible
[ ] 6. canSeeModule + data-roles: Warehouse blocked; Sales+Manager+Admin+Owner see; Rep sees Rep View variant only
[ ] 7. Mount/unmount: open detail, close, open another; `vendor_score_states` not refetched twice; no listener leak
[ ] 8. Navigation continuity: filter state (tier filter, parent-company group) preserved within session
[ ] 9. JSON parse + v1 untouched: `vendor_intelligence_read_v2` added; `vendor` v1 entry unchanged
[ ] 10. Rollback dry-run: flip back; v1 Vendor View remains default; CF deploy green ≤60s
```

**Module-specific risk highlights:**
- **HARD RULE (MASTER §12 #6):** Rep View must NEVER show Rep Score category. Failure = P0, immediate rollback.
- F3 divergence: 14 rows × 476 vendors = 6,664 score-state rows. Any v2 write here in Phase 4 is auto-rollback.
- F4 role visibility: Rep is a vendor-facing role; misconfiguration discloses internal scoring. P0.
- F2 lazy-load: VD_RAW is large; ensure single dynamic import + static deps.
- Parity: tier cutoffs must exclude inactive vendors (matches v1 logic).

**Rollback paste-block:**
```
# module_modes.json: vendor_intelligence_read_v2.mode = "<prior_mode>"
git commit -m "revert: vendor_intelligence_read_v2 to <prior_mode>"
```
