# Deployment Flow Notes - AccentOS

This document details the deployment process for AccentOS and how to detect/resolve deployment drift.

## 1. The Stack

- **Frontend:** Static HTML/JS hosted on **Cloudflare Pages**.
- **Edge Logic:** **Cloudflare Workers** (Anthropic Proxy).
- **Database/Auth:** **Supabase**.

## 2. CI/CD Pipeline

The deployment is fully automated via GitHub integration:
1. **Push to `main`:** Triggers a Cloudflare Pages build.
2. **Build Time:** ~15–30 seconds.
3. **Live URL:** `https://accent-os.pages.dev`.

## 3. Drift Detection

Drift occurs when the code in the repository differs from what is running in production.

### Identifying Frontend Drift
Check the version string in the `<title>` tag of `index.html`.
- **Repo Version:** See `MASTER.md` or `index.html`.
- **Live Version:** View Page Source on `accent-os.pages.dev`.

### Identifying Worker Drift
The Anthropic Proxy Worker provides a `/v1/version` endpoint.
- **Check:** `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/version`
- **Warning:** If the frontend console logs `[aos-worker] stale worker detected`, the worker code in the repo (`worker/anthropic-proxy.js`) is likely ahead of the deployed version.

## 4. Deployment Checkpoints

After every major ship, verify the following:
- [ ] `index.html` loads without console errors.
- [ ] All `js/*.js` modules listed in the footer script tags are 200 OK in the Network tab.
- [ ] `module_modes.json` is fetched and parsed correctly.
- [ ] Supabase RLS policies match the latest `sql/` migrations.

## 5. Rollback Procedure

Since deployments are Git-triggered:
1. Identify the last stable commit: `git log`.
2. Revert main: `git revert <commit_hash> && git push origin main`.
3. Cloudflare will auto-deploy the previous state in ~30 seconds.
