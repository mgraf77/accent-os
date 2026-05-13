# AccentOS — Runtime Health Scorecard
_Last updated: 2026-05-13_

---

## Purpose

Standardized health scorecard template for AccentOS. Operators fill this out at session start or after any incident. Provides a consistent snapshot of system state.

---

## Scorecard Template

```
AccentOS Runtime Health Scorecard
Date: _______________  Time: _______________  Filled by: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPA version:    _______________  (check <title> tag or curl)
Worker version: _______________  (check probe response)
Worker build:   _______________  (check probe response)
CI last run:    _______________  (GitHub Actions)
Last deploy:    _______________  (last push to main)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKER STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Probe URL:      https://accentos-anthropic-proxy.mgraf77.workers.dev/
Probe result:   [ ] HEALTHY (v3-env-fallback, env_key_set: true)
                [ ] DEGRADED (see notes)
                [ ] FAILED (see notes)
env_key_set:    [ ] true   [ ] false
probe_ms:       _______________ ms
Notes: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Login works:    [ ] YES   [ ] NO
JWT valid:      [ ] YES   [ ] NO
Profile loaded: [ ] YES   [ ] NO
Role assigned:  _______________
Notes: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hydration time: _______________ ms  (window.__AOS_HYDRATE_MS__)
Status:         [ ] HEALTHY (<2500ms)
                [ ] WARN (2500–5000ms)
                [ ] FAIL (>5000ms or error)
Supabase ping:  [ ] HEALTHY   [ ] DEGRADED   [ ] DOWN
Cold-start?:    [ ] YES (first login of day)   [ ] NO
Notes: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All modules nav: [ ] YES (all 26+ navigate without crash)
                 [ ] NO (affected modules: _______________)
Data visible:    [ ] YES   [ ] PARTIAL   [ ] NONE
AI features:     [ ] HEALTHY   [ ] BLOCKED (env key / probe)   [ ] ERROR
Notes: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] HEALTHY — All systems operational. No action needed.
[ ] DEGRADED — Some systems impaired. Usable with limitations.
[ ] INCIDENT — One or more critical systems down. Action required.

Open incidents: _______________
Action items:   _______________
```

---

## Historical Scorecards

| Date | Overall | Worker | Auth | Hydration | Notes |
|---|---|---|---|---|---|
| 2026-05-12 | DEGRADED | FAIL (stale) | HEALTHY | HEALTHY | Worker v3 not deployed; SPA hardened |
| 2026-05-13 | DEGRADED | FAIL (stale) | HEALTHY | HEALTHY | Worker still awaiting Cloudflare redeploy |

---

## Scoring Thresholds (Quick Reference)

### Worker

| Probe result | Score |
|---|---|
| v3-env-fallback + env_key_set:true | HEALTHY |
| v3-env-fallback + env_key_set:false | DEGRADED (AI requires user key) |
| v3-env-fallback + probe_ms > 3000 | DEGRADED (slow worker) |
| stale / non-JSON | FAIL |
| Network error | FAIL |

### Auth

| State | Score |
|---|---|
| Login succeeds + profile loads + role assigned | HEALTHY |
| Login succeeds + profile missing | DEGRADED |
| Login fails | FAIL |

### Data / Hydration

| hydrate_ms | Score |
|---|---|
| < 2500ms | HEALTHY |
| 2500 – 5000ms | WARN |
| > 5000ms | FAIL |
| Error (sbLoad exception) | FAIL |

### Modules

| State | Score |
|---|---|
| All 26+ modules navigate + show data | HEALTHY |
| 1–3 modules empty (isolated sbLoad failure) | DEGRADED |
| Most modules empty | FAIL |
| App won't load | CRITICAL |

---

## Automated Scorecard (Console)

Run this in the browser console to generate a quick text scorecard:

```javascript
(function(){
  const v = window.__AOS_WORKER_VERSION__;
  const ek = window.__AOS_WORKER_ENV_KEY_READY__;
  const pm = window.__AOS_WORKER_PROBE_MS__;
  const hm = window.__AOS_HYDRATE_MS__;
  const workerState = (!v || v==='error' || v==='stale') ? 'FAIL'
    : pm > 3000 ? 'WARN' : 'HEALTHY';
  const aiState = (_aiWorkerReady && _aiWorkerReady()) ? 'HEALTHY' : 'FAIL';
  const hydrateState = !hm ? 'UNKNOWN'
    : hm > 5000 ? 'FAIL' : hm > 2500 ? 'WARN' : 'HEALTHY';
  console.table({
    Worker:    {state: workerState, detail: `v=${v} ek=${ek} ${pm}ms`},
    AI:        {state: aiState, detail: `ready=${_aiWorkerReady && _aiWorkerReady()}`},
    Hydration: {state: hydrateState, detail: `${hm}ms`},
    Overall:   {state: [workerState,aiState,hydrateState].some(s=>s==='FAIL') ? 'DEGRADED' : 'HEALTHY', detail: ''}
  });
})();
```

---

_Fill out this scorecard at session start and after any incident. Append completed scorecards to the Historical section._
