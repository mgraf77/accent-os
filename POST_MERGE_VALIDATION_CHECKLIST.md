# POST_MERGE_VALIDATION_CHECKLIST.md
> Session 29 — runs after each tier of SAFE_MERGE_ORDER and as final gate

---

## RUN AFTER EVERY TIER

- [ ] `git status` — clean tree
- [ ] `bash scripts/status.sh` — no size regressions; BUILD_PLAN counts sane
- [ ] `bash scripts/boot-smoke.sh` — passes (available after Tier 2.1)
- [ ] `git log --oneline -5` — merge commit recorded
- [ ] No new files outside intended directories

---

## §1 — RUNTIME BOOT

- [ ] `index.html` opens locally; no JS errors in console
- [ ] `window.__AOS_HYDRATED__ === true` within 10s
- [ ] `MODULE_REGISTRY` populated; all modules have entries
- [ ] Module dispatcher resolves every registered key
- [ ] No `undefined` errors in hydration toast surface

## §2 — QUEUE BEHAVIOR

- [ ] Queue runtime initializes (`queue.init` log line present)
- [ ] Submit job → reaches handler → completes or retries per policy
- [ ] Retry/backoff bounded (no infinite loop — regression of bc-sync 429 fix)
- [ ] Queue persists across reload (localStorage / Supabase state intact)
- [ ] Mobile queue UX surfaces visible after Tier 6.3

## §3 — REPLAY SAFETY

- [ ] Re-running last completed signal/job is idempotent
- [ ] Dedupe gate blocks duplicate emission within window (post Tier 5.3)
- [ ] Confidence gate blocks low-confidence emissions (post Tier 5.4)
- [ ] No orphan queue items after replay
- [ ] Signals have unique IDs; ownership metadata attached (post Tier 4.3)

## §4 — FALLBACK PRESERVATION

- [ ] `sbFetch` 15s timeout still active (regression check on Tier 5.1)
- [ ] 401 session-expiry handler still triggers re-auth
- [ ] Worker AI proxy fallback to degraded mode when unauthorized
- [ ] BC adapter does not hot-loop on 429 (regression on 5f68392)
- [ ] Quote save still atomic via `upsert_quote_with_lines` RPC (M45)

## §5 — METRICS SURFACES

- [ ] KPI auto-snapshot fires on Owner login (regression on 5a48639)
- [ ] Dashboard pinning persists per user (regression on 3a29a97)
- [ ] Pipeline analytics modal opens and renders all 5 panels
- [ ] Signal/queue metrics surface visible in operational HUD (post Tier 4)
- [ ] `KPI_CATALOG.md` entries match runtime emissions

## §6 — GOVERNANCE VISIBILITY

- [ ] `CANON.md` hash regenerates and matches `.orchestration/status-wiring.json` (post Tier 2.2)
- [ ] `forbidden_runtime_patterns.json` linter blocks at least one known-bad pattern (post Tier 2.4)
- [ ] Governance log surfaces autonomous decisions (post Tier 2.5)
- [ ] Escalation matrix renders in HUD (post Tier 1.4)
- [ ] Boundary violations produce console + persisted event

## §7 — STATUS.SH INTEGRITY

- [ ] `bash scripts/status.sh` exits 0
- [ ] All file-size checks under 900KB hard limit
- [ ] BUILD_PLAN_CLAUDE.md shipped/pending counts match `[x]/[ ]` greps
- [ ] No phantom branches reported
- [ ] Git ahead/behind reports correctly vs origin

---

## §8 — INTEGRATION SMOKE (final, only after all tiers)

- [ ] Full hydration < 10s on cold load
- [ ] Quote save → reload → reopen → identical
- [ ] Signal emit → dedupe → confidence-gate → queue → handler → metric → surface
- [ ] Worker AI roundtrip < 5s under nominal load
- [ ] BC sync completes one full cycle without 429 or 404
- [ ] No regressions in any module listed in `MODULE_REGISTRY`

---

## §9 — ROLLBACK CRITERIA

Trigger immediate rollback (revert merge, restore prior main) if:

- §1 boot fails on a clean reload
- §3 replay produces duplicates AND tier already includes dedupe
- §4 any preserved-fallback fails (timeout / 401 / 429 loop / atomic save)
- §6 canon hash mismatch persists after regeneration

Document the trigger in `SESSION_LOG.md` and open a follow-up branch
rather than hot-patching on main.
