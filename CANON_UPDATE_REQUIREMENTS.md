# CANON_UPDATE_REQUIREMENTS.md
> Session 29 — canon, doc, and registry sync requirements before/after merge wave

---

## §1 — CANON HASHES NEEDING UPDATE

| Surface | When | Why |
|---------|------|-----|
| `CANON.md` content hash | After Tier 2.2 (canon-enforcement-scripts) | Branch introduces canon hashing mechanism; existing hash must be regenerated from new content. |
| `.orchestration/status-wiring.json` checksums | After Tier 2.2 + Tier 2.4 | Wiring map references runtime files that change in Tier 4/5; regen after each tier. |
| `forbidden_runtime_patterns.json` ruleset version | After Tier 2.4 | New patterns introduced; bump ruleset version so downstream consumers invalidate caches. |
| `module_modes.json` mode-set hash | After Tier 4 + Tier 5.5 + Tier 6.1 | Each adds/modifies registered modes. |
| Canon checksum baseline | End of full wave | Single regen across whole canon tree after final tier. |

---

## §2 — DOCS REQUIRING RE-BASELINE

| Document | Reason |
|----------|--------|
| `MASTER.md` | Add Session 29 merge wave entry; update §runtime / §governance sections to reference new doctrines. |
| `MERGE_PLAN.md` | 9 branches all rewrote this. Discard branch-specific versions; regenerate canonical post-wave from this session's MERGE_WAVE_PLAN_V1. |
| `BUILD_PLAN_CLAUDE.md` | Mark merged items `[x]`; add unblocked downstream items. |
| `BUILD_INTELLIGENCE.md` | Lessons from sequential merge of overlapping branches (M49/M50 collision, signal-runtime variant fan-out). |
| `KPI_CATALOG.md` | Add signal-runtime + queue + governance emission KPIs (post Tier 4 + 6). |
| `RUNTIME_HEALTH_VERIFICATION.md` | Re-baseline to reflect new boot-smoke output and post-Tier-5 hardened paths. |
| `STARTUP_DEPENDENCY_ORDER.md` | Update with new script ordering after signal runtime + producer additions. |
| `MODULE_DEPENDENCY_AUDIT.md` | Re-run after Tier 4 and Tier 6; record new producer → emitter → queue chains. |
| `FRONTEND_RUNTIME_FLOW.md` | Update flow diagram for signal emission → dedupe → confidence → queue. |
| `SESSION_LOG.md` | Append Session 29 wrap with wave outcomes. |
| `WORK_IN_PROGRESS.md` | Overwrite after each tier per OPERATING RULES. |

---

## §3 — RUNTIME REGISTRIES NEEDING SYNC

| Registry | Update needed |
|----------|---------------|
| `MODULE_REGISTRY` (in `index.html`) | Add any new module keys introduced by Wave 4/5 (signal, queue, pricing, orchestration surfaces). Single source of truth — do NOT bypass. |
| `js/module_modes.js` + `module_modes.json` | Register new modes added by harden-runtime-escalation, wire-minimal-runtime, pricing-runtime-conversion. Validate `js` and `json` agree. |
| Signal emitter registry (introduced Tier 4.1) | Each producer (pricing, quotes, orchestration) must register before emitting. |
| Queue handler registry | Each new job type registers its handler at boot. Verify post Tier 6.3. |
| Governance policy registry | `governance.js` policies indexed; canon-enforcement scripts cross-check against canon. |
| Worker route registry (`worker/anthropic-proxy.js` switch) | Each new route added by signal/pricing/orchestration branches must be reflected and version-probed. |

---

## §4 — SQL CATALOG SYNC

Final canonical migration ordering after wave:

```
M01–M44   already applied
M45       quote_save_rpc                  (in main)
M46       quote_stale_guard               (in main)
M47       bigcommerce_schema              (in main)
M48       ecommerce_v2_schema             (in main, OR consolidated from Tier 4.2 — verify)
M49       signals_base                    (Tier 4.1, canonical: minimal-signal-runtime)
M50       pricing                         (Tier 6.1, canonical: wire-minimal-runtime)
M51       signal_escalation_ext           (renumbered from harden-runtime-escalation)
M52       signal_confidence_ext           (renumbered from harden-generator-confidence)
M53       pricing_runtime_ext             (renumbered from pricing-runtime-conversion)
M54+      reserved for queue/orchestration if needed
```

Action items:
- [ ] Rebase + renumber loser branches before merge per Tier 3
- [ ] Update `sql/` README / index if one exists
- [ ] Verify Supabase apply-order doc reflects this ordering
- [ ] No two branches may keep the same M-number into main

---

## §5 — POST-WAVE SINGLE REGEN PASS

After final tier completes:

1. Regenerate canon hashes once across the full tree.
2. Re-run `bash scripts/status.sh` and snapshot output into SESSION_LOG.
3. Re-run `scripts/runtime-health.js` and snapshot.
4. Update MASTER.md §Last Reconciliation timestamp.
5. Tag commit: `wave-1-consolidation-complete`.
6. Open Session 30 with a clean baseline.

---

## §6 — BRANCH METADATA CLEANUP

After successful merges:

- Delete merged remote refs (incl. `forge-prompt-queue-v2`)
- For branches NOT merged in this wave (deferred), annotate why in BUILD_PLAN_CLAUDE
- Archive `MERGE_PLAN.md` variants — keep only the canonical one
