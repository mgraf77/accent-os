# AccentOS Sentinel Audit

Periodic AI-governed code audit skill for AccentOS. Coordinates Claude, Codex, deterministic scanners, and GitHub to continuously inspect AccentOS for architecture drift, security issues, Supabase/RLS problems, Cloudflare Worker risks, AI patching damage, documentation divergence, and product logic regressions.

## Quick Start

### Full audit

```text
Use the accentos-sentinel-audit skill to run a full AccentOS audit. Inspect architecture,
Supabase, Worker security, Vendor Intelligence product logic, AI patch boundaries,
integrations, and documentation drift. Generate the full report and Codex delegation prompts.
```

### Pre-deployment audit

```text
Use the accentos-sentinel-audit skill to run a pre-deployment audit focused on security,
Supabase/RLS, Worker proxy safety, migration safety, and smoke-test readiness.
```

### Vendor module audit

```text
Use the accentos-sentinel-audit skill to audit only the Vendor Intelligence module.
Focus on scoring logic, confidence handling, parent company grouping, rep management,
missing data behavior, Supabase writes, and employee usability.
```

### Integration audit

```text
Use the accentos-sentinel-audit skill to audit Lights America data52 and vendor price book
integration readiness. Focus on SKU normalization, price freshness, stock timestamps,
image/document URLs, import logs, rollback strategy, and stale data handling.
```

## Running Scanners Manually

```bash
cd /path/to/accent-os

node skills/accentos-sentinel-audit/scripts/collect_repo_metrics.js
node skills/accentos-sentinel-audit/scripts/scan_accentos_patterns.js
node skills/accentos-sentinel-audit/scripts/scan_sql_migrations.js
node skills/accentos-sentinel-audit/scripts/scan_worker_security.js
node skills/accentos-sentinel-audit/scripts/scan_ai_patch_boundaries.js

# Combine all output into a report:
node skills/accentos-sentinel-audit/scripts/generate_audit_report.js
```

Reports are saved to `skills/accentos-sentinel-audit/history/`.

## Report Location

```text
skills/accentos-sentinel-audit/history/YYYY-MM-DD-[scope]-audit.md
```

## Key Thresholds

| Metric | Warning | High | Critical |
|---|---|---|---|
| index.html size | 500KB | 750KB | 900KB |
| Direct Supabase writes | >0 | >5 | >10 |
| Missing RLS tables | >0 | >3 | >5 |
| Missing patch markers | >10% | >25% | >50% |

## Health Score

0–100. Below 60 = stop feature work and stabilize.

## Files

See `SKILL.md` for the full file inventory.
