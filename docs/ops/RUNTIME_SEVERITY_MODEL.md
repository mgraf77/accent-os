# AccentOS — Runtime Severity Model
_Last updated: 2026-05-13_

---

## Purpose

A consistent severity classification for all runtime events, diagnostics, and operational indicators. Used by scripts/status.sh, the Health Check page, the System Status card, and any future alerting infrastructure.

---

## Severity Levels

| Level | Label | Color | Symbol | Meaning |
|---|---|---|---|---|
| 0 | **HEALTHY** | Green | ✓ | All checks pass, nominal operation |
| 1 | **INFO** | Dim/grey | · | Observation only, no action needed |
| 2 | **WARN** | Yellow | ⚠ | Degraded but functional; operator should investigate |
| 3 | **FAIL** | Red | ✗ | Feature broken; operator action required |
| 4 | **CRITICAL** | Red bold | ✗✗ | Business operation blocked; immediate action required |

---

## Runtime Event Severity Assignments

### Deployment Layer

| Event | Severity | Notes |
|---|---|---|
| Worker live, env_key_set=true | HEALTHY | Nominal |
| Worker live, env_key_set=false | WARN | AI works with user key only; env binding needed |
| Worker probe: non-JSON response (stale v1/v2) | FAIL | AI broken for users without personal key |
| Worker probe: timeout / unreachable | WARN | May be transient; retry before escalating |
| Worker version mismatch (live ≠ repo) | WARN | Stale deploy; trigger GitHub Actions |
| GitHub Actions deploy failed | FAIL | Check Actions tab; may need token rotation |
| CF_API_TOKEN / CF_ACCOUNT_ID not set | FAIL | First-deploy blocker |
| wrangler.toml missing | FAIL | Worker deploy will fail |
| deploy-worker.yml missing | WARN | Manual deploy only (degraded CI/CD) |

### Auth + Session Layer

| Event | Severity | Notes |
|---|---|---|
| Valid JWT restored | HEALTHY | — |
| JWT expired (login required) | INFO | Expected behavior after session timeout |
| Login fail: invalid credentials | WARN | User error; log frequency if repeated |
| Login fail: no profile | FAIL | Owner must create user profile |
| Supabase unreachable | FAIL | All data operations blocked |
| Supabase not configured | FAIL (first-run) | Settings must be populated |
| RLS reject (403) | FAIL | User lacks permission; check role assignment |

### Data Hydration Layer

| Event | Severity | Notes |
|---|---|---|
| All 27 sbLoad* calls succeed | HEALTHY | — |
| 1–3 sbLoad* calls fail (non-critical tables) | WARN | Missing M## migration likely |
| sbLoadVendorScores fails | WARN | Scores will show as zeros |
| sbLoadPipeline fails | FAIL | Pipeline empty; deals not visible |
| sbLoadQuotes fails | FAIL | Quote history not accessible |
| generateAlertsFromData fails | WARN | Alerts page empty; check console |
| maybeAutoSnapshotKPIs fails | WARN | KPI won't auto-snapshot today |
| Hydration > 5000ms | WARN | Network or query perf issue |
| Hydration > 10000ms | FAIL | Likely network failure; partial data |

### AI Layer

| Event | Severity | Notes |
|---|---|---|
| Worker env key set, AI call succeeds | HEALTHY | — |
| User key set, AI call succeeds | HEALTHY | — |
| Worker returns 503 ai_unconfigured | FAIL | Secret not bound; fix in CF dashboard |
| Worker returns "missing x-api-key" | FAIL | Stale worker deployed; re-deploy |
| AI call timeout (>30s) | WARN | Claude API latency; retry |
| AI returns non-JSON | WARN | Parse failed; manual entry required |
| AI parse: 0 lines returned | WARN | Notes format mismatch; check input |
| AI parse: flagged lines present | INFO | Unknown fixture codes; operator review |

### Module Layer

| Event | Severity | Notes |
|---|---|---|
| Module function not found (TypeError) | FAIL | Script load order issue or extraction bug |
| typeof guard fires (function undefined) | WARN | Module dependency not loaded |
| sbLoad fails for module's own table | WARN | Table may not exist (run M##) |
| 404 on sbLoad (relation does not exist) | INFO | Expected before SQL migration runs |
| Non-404 HTTP error on sbLoad | FAIL | Auth or network issue |

---

## Severity Escalation Rules

| Initial severity | Escalates to | Condition |
|---|---|---|
| WARN (worker probe timeout) | FAIL | If timeout persists >3 consecutive probes |
| INFO (JWT expired) | WARN | If user cannot complete login after 3 attempts |
| WARN (sbLoad fails for 1 table) | FAIL | If 4+ tables fail simultaneously |
| WARN (AI call fails) | FAIL | If 5+ consecutive AI calls fail |

---

## Severity in Status Output

`scripts/status.sh` uses the following ANSI color scheme matching this model:

```bash
ok()   → green ✓  → HEALTHY
info() → dim   ·  → INFO
warn() → yellow ⚠ → WARN
# No 'fail' in status.sh currently — FAIL events result in warn() + remediation hint
```

The Health Check page (`health.js`) should adopt the same severity vocabulary and colors for consistency.

---

## Machine-Readable Severity

For future API endpoints or telemetry writes, severity is expressed as an integer:

```json
{
  "check": "worker_probe",
  "severity": 0,
  "severity_label": "HEALTHY",
  "detail": "v3-env-fallback · env_key_set=true · 234ms"
}
```

`_runtimeHealth()` currently returns structured data without severity scoring. Future enhancement: add a `severity` field computed by applying this model to the current state.

---

## Severity → Remediation Index

| Severity | Remediation approach |
|---|---|
| HEALTHY | None |
| INFO | Log; no action |
| WARN | Investigate within 24h; document in KNOWN_ISSUES.md |
| FAIL | Operator action required within 1 business day; entry in KNOWN_ISSUES.md |
| CRITICAL | Immediate response; escalate to Michael |

---

_This model is the reference for all health indicators, status scripts, and operational docs. Update severity assignments when new event types are discovered._
