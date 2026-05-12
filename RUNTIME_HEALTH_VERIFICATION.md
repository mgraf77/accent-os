# Runtime Health Verification - AccentOS

This document provides a guide for verifying the health of the AccentOS application at runtime.

## 1. Quick Console Health Check

Run these commands in the browser console (F12) to verify core state:

```javascript
// 1. Check Authentication State
console.log('User:', CU ? CU.email : 'Not signed in');

// 2. Check Data Hydration
console.log('Vendors:', VD.length);
console.log('Quotes:', QUOTES.length);
console.log('Customers:', CUSTOMERS.length);

// 3. Check Worker Connectivity
console.log('Worker Version:', window.__AOS_WORKER_VERSION__);

// 4. Check Module Registration
console.log('Module Modes:', window.MODULE_MODES ? 'Loaded' : 'Missing');
```

## 2. Automated Diagnostic Endpoint

The **Health Check** page (`goTo('health')`) performs several automated checks:
- **Schema Detection:** Verifies if required Supabase tables exist.
- **Hydration Status:** Checks if global arrays are populated.
- **Worker Probe:** Verifies if the Anthropic Proxy is reachable and up-to-date.

## 3. Visual Smoke Test (The "Critical Three")

1. **Dashboard:** Ensure the "Today" card loads with at least one tile.
2. **Vendor Ranking:** Search for "Acuity" and ensure the row appears with a score.
3. **Quote Generator:** Open a saved quote and verify the total matches the sum of lines.

## 4. Troubleshooting Common Failures

| Symptom | Probable Cause | Action |
|---|---|---|
| "Supabase not configured" | Missing keys in Settings. | Enter URL/Key in Settings -> Supabase. |
| AI Parsing fails | Stale Worker or missing API key. | Check console for "stale worker" warning. |
| Empty lists (0 vendors) | Hydration failed or DB connection error. | Check Network tab for 401/403/404 on Supabase calls. |
| Navigation doesn't work | JS Syntax Error in a module. | Check console for SyntaxError; re-run `node -c` on files. |
