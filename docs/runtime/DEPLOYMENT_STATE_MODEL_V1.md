# AccentOS — Deployment State Model v1
_Spec only — no implementation. Created: 2026-05-12_

This document defines the desired future state model for tracking deployment drift
across the three environments that compose AccentOS: the GitHub repository,
Cloudflare Pages (SPA), and Cloudflare Workers (AI proxy).

---

## Problem Being Modeled

AccentOS has three independently deployable components, each with its own deploy
trigger and version surface. Today there is no structured way to answer:

> "Are the repo, SPA, and Worker all at the same logical version right now?"

The stale-worker incident (2026-05-12) demonstrated that:
- The repo contained v3 worker code
- The live worker was running v1/v2
- No automated check detected the drift
- The discrepancy was only found during live verification testing

This model defines the state surfaces, drift detection signals, and future
telemetry approach needed to prevent this class of incident.

---

## State Surfaces

### 1. Repo State

| Field | Source | Example |
|---|---|---|
| `repo.worker_version` | `WORKER_VERSION` constant in `worker/anthropic-proxy.js` | `"v3-env-fallback"` |
| `repo.worker_build` | `WORKER_BUILD` constant | `"2026-05-11"` |
| `repo.wrangler_name` | `name` field in `wrangler.toml` | `"accentos-anthropic-proxy"` |
| `repo.wrangler_main` | `main` field in `wrangler.toml` | `"worker/anthropic-proxy.js"` |
| `repo.wrangler_compat` | `compatibility_date` in `wrangler.toml` | `"2024-01-01"` |
| `repo.last_worker_commit` | git log on `worker/` path | SHA + timestamp |
| `repo.last_worker_deploy_run` | GitHub Actions run ID | from Actions API |

### 2. Deployed Worker State

| Field | Source | Example |
|---|---|---|
| `worker.version` | `GET /` → `response.version` | `"v3-env-fallback"` |
| `worker.build` | `GET /` → `response.build` | `"2026-05-11"` |
| `worker.env_key_set` | `GET /` → `response.env_key_set` | `true` |
| `worker.env_key_length` | `GET /` → `response.env_key_length` | `108` |
| `worker.probe_latency_ms` | measured at probe time | `142` |
| `worker.probe_timestamp` | ISO timestamp of last probe | `"2026-05-12T18:00:00Z"` |

### 3. SPA State (Cloudflare Pages)

| Field | Source | Example |
|---|---|---|
| `spa.version` | version tag in index.html (comment/meta) | `"v6.10.60"` |
| `spa.deploy_timestamp` | Cloudflare Pages API or x-deployment-id header | timestamp |
| `spa.worker_url_assumed` | `AOS_WORKER_BASE` constant in index.html | URL string |

### 4. Environment State

| Field | Source | Example |
|---|---|---|
| `env.anthropic_key_bound` | `worker.env_key_set` | `true` |
| `env.supabase_reachable` | sbFetch probe at login | `true` |
| `env.worker_reachable` | probe success/failure | `true` |
| `env.pages_reachable` | HTTP check on pages URL | `true` |

---

## Drift Detection Signals

### Worker code drift (highest priority)

```
DRIFT if: repo.worker_version ≠ worker.version
DRIFT if: repo.worker_build ≠ worker.build (secondary signal)
HEALTHY if: repo.worker_version === worker.version AND worker.env_key_set === true
```

### Secret binding drift

```
DEGRADED if: worker.env_key_set === false
  (worker deployed but ANTHROPIC_API_KEY not bound)
```

### URL consistency drift

```
DRIFT if: spa.worker_url_assumed ≠ canonical worker URL
  (happens if worker is renamed or moved to a custom domain)
```

---

## Future Telemetry Implementation Path

### Phase 1 — Client-side passive (no new infra)

Already partially implemented:
- `window.__AOS_WORKER_VERSION__` — set at probe time
- `window.__AOS_WORKER_ENV_KEY_READY__` — set at probe time

**To add:** Expose worker state on the Owner Dashboard system status row:
```
Anthropic Worker: v3-env-fallback ✓ | env_key: bound ✓ | latency: 142ms
```
(Read from `window.__AOS_WORKER_VERSION__` and `__AOS_WORKER_ENV_KEY_READY__`)

### Phase 2 — GitHub Actions probe step (zero new infra)

Already implemented in `deploy-worker.yml` (the post-deploy verify step).
**To enhance:** Write probe result to a GitHub Actions job summary so it appears
in the Actions run UI.

### Phase 3 — Supabase telemetry table (requires M-task)

Define a `deployment_events` table:
```sql
create table deployment_events (
  id           bigint generated always as identity primary key,
  component    text not null,       -- 'worker' | 'spa' | 'supabase'
  event_type   text not null,       -- 'deploy' | 'probe' | 'drift_detected'
  version      text,
  build        text,
  env_key_set  boolean,
  deployed_by  text,                -- 'github_actions' | 'manual' | 'cloudflare_pages'
  sha          text,
  notes        text,
  created_at   timestamptz default now()
);
```
The GitHub Actions workflow could POST to a Supabase function on successful deploy.
The SPA probe could POST on first successful probe per session.

### Phase 4 — Owner Dashboard drift panel

Surface `deployment_events` on the Owner Dashboard with:
- Last deploy per component
- Current live version vs repo version (drift indicator)
- `env_key_set` status
- Days since last worker deploy

---

## Implementation Decision Record

| Decision | Rationale |
|---|---|
| Phase 1 first | Zero infra cost; already partially done |
| No GitHub webhook back to Supabase yet | Requires Supabase edge function + auth; M-task |
| Build date as constant not git SHA | Keep worker code simple; SHA would require build step |
| Worker version as string not semver | Worker isn't independently semver'd; string is clearer |
| Drift detection client-side first | The SPA always probes; server-side adds latency for no gain at this scale |

---

## Known Gaps in v1 Model

1. **`repo.worker_version` not machine-readable from outside** — `WORKER_VERSION` is a JS constant. To read it automatically, either parse the file or standardize it into `package.json` or a dedicated `worker/version.txt`.

2. **`worker.build` is stale immediately** — `WORKER_BUILD` is hardcoded as `"2026-05-11"`. It doesn't update on deploy. Fix: inject the build date from the GitHub Actions workflow via an environment variable or sed substitution before deploy.

3. **No SPA version surface** — `index.html` has a version in comments (`v6.10.xx`) but no machine-readable meta tag. A `<meta name="aos-version" content="...">` tag would allow automated scraping.

4. **GitHub Actions run history** is the only audit trail for worker deploys today. A Supabase `deployment_events` table (Phase 3) would survive branch deletion and be queryable from the app.
