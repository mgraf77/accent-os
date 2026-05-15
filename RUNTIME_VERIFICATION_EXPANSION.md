# RUNTIME_VERIFICATION_EXPANSION

**Purpose:** the catalog of runtime verifiers, what each one asserts,
and the gap-list of verifiers we still need.

## Existing verifiers

| Script | Asserts | Touch | Cost |
|---|---|---|---|
| `scripts/check-runtime-wiring.sh` | wiring + load order + boundary | static grep | <1s |
| `scripts/check-pricing-runtime-path.sh` | M50 list_price queue path | static grep | <1s |
| `scripts/health-check.sh` | (general repo health) | varies | varies |
| `scripts/runtime-health.js` | (node-side runtime probe) | node | varies |

## Session 36 additions

| Script | Asserts | Touch | Cost |
|---|---|---|---|
| `scripts/check-runtime-health.sh` | canonical files + SIGNALS surface + counter block + heartbeat fields + metrics() | static grep | <1s |
| `scripts/check-runtime-replay.sh` | producer idem-key + 23505 path + replay counter + sig_record_effect_attempt | static grep | <1s |
| `scripts/check-dead-letter-health.sh` | sig_dead_letter wiring + counter + panel surface + bypass detection | static grep | <1s |

Plus `js/signals_runtime_health.js` exposing
`window.__SIGNAL_RUNTIME_HEALTH__()` for runtime-side probes.

## Coverage matrix

| Surface | Verifier coverage |
|---|---|
| Producer adapters present | ✓ check-runtime-wiring §1 |
| Effect hooks installed | ✓ check-runtime-wiring §2 |
| Producer graceful degradation | ✓ check-runtime-wiring §3 |
| Queue-bypass detection | ✓ check-runtime-wiring §4 |
| Panel metrics surface | ✓ check-runtime-wiring §5 |
| Load order | ✓ check-runtime-wiring §6 |
| Pricing-path conversion | ✓ check-pricing-runtime-path |
| Canonical files exist | ✓ check-runtime-health §1 |
| `window.SIGNALS` surface | ✓ check-runtime-health §2 |
| Live counters block | ✓ check-runtime-health §3 |
| Heartbeat fields | ✓ check-runtime-health §4 |
| metrics() RPC | ✓ check-runtime-health §5 |
| Replay-safety primitives | ✓ check-runtime-replay |
| Dead-letter wiring | ✓ check-dead-letter-health |
| Dead-letter bypass detection | ✓ check-dead-letter-health §4 |

## Gap list (verifiers NOT present, recommended for future sessions)

| Gap | Suggested script | Cost / risk |
|---|---|---|
| SQL schema parity (queue tables exist, indexes present) | `scripts/check-sql-schema.sh` (Supabase RPC; needs network) | medium — requires Supabase access |
| Worker-tick liveness (the worker is actually advancing) | `scripts/check-worker-liveness.sh` (uses metrics() snapshot via headless browser) | medium — node + browser |
| Forbidden name regression (no `js/signals.js`, no direct queue globals) | `scripts/check-forbidden-names.sh` | low — pure grep |
| Registry consistency (every signal type in CANON has producer + hook + handler) | `scripts/check-signal-canon.sh` | low — requires registry to land |
| Health-surface contract test | `scripts/check-runtime-health-contract.sh` (asserts __SIGNAL_RUNTIME_HEALTH__ shape) | low — node script |
| Index.html script-namespace lock (only SIGNAL_*/runtime files in the bottom block) | extension to check-runtime-wiring | low |

## Recommended landing order

1. **`check-forbidden-names.sh`** — cheapest, prevents sidecar #1/#2
   regression. (1 commit, ~50 LOC.)
2. **`check-runtime-health-contract.sh`** — guards the new health surface.
3. **`check-signal-canon.sh`** — only after `js/signals_registry.js` lands.
4. **`check-worker-liveness.sh`** — only when a runtime proving session
   is authorized (out of current scope).
5. **`check-sql-schema.sh`** — only when Supabase apply is authorized.

## Composability target

A single dispatcher `scripts/all-checks.sh` running every verifier in
sequence, exiting non-zero on first failure, with summary tally.
Estimated effort: 30 LOC. This becomes the boot-time gate for any
autonomous session.
