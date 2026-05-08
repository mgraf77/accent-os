# AccentOS Rollout Failure Scenarios
> **Doc type:** Planning only — non-implementing spoke session output
> **Status:** Draft v1
> **Sibling docs:** `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md`, `ACCENTOS_GOVERNANCE_RECONCILIATION.md`
> **Branch:** `claude/accentos-rollout-planning-UTElf`
> **Frame:** operational survivability over idealized architecture.

Each scenario below is a *failure mode that can occur during shell-v2 rollout*. For each: symptoms, detection, blast radius, rollback strategy, stabilization procedure, prevention.

Numbering is stable — referenced by `ACCENTOS_GOVERNANCE_RECONCILIATION.md` and the rollout strategy.

---

## F1 — Failed shell injection

**Description:** Shell-v2 mount fails (`js/shell_v2/<name>.js` 404, syntax error, or `mount()` throws).

**Symptoms:**
- Sidebar item visible (per `canSeeModule`) but click yields blank panel or console error.
- DevTools Network shows 404 / 500 for the module file.
- Other sidebar items still work.

**Detection:**
- User report ("I clicked X and nothing happened").
- DevTools console error visible on Owner/Admin login.
- `curl https://accent-os.pages.dev/js/shell_v2/<name>.js` returns non-200.

**Blast radius:** Limited to that one module — other shell areas unaffected because of lazy-load + `mount/unmount` isolation.

**Rollback:** Flip `module_modes.json` for that module to `idea_only` (Owner-only, sidebar entry disappears for everyone else). One-line JSON commit. No `wrangler` action.

**Stabilization:**
1. Read the console error.
2. Reproduce locally.
3. Fix in a *separate* commit from the flip-back.
4. Re-flip to `building` after staging verification.

**Prevention:**
- Born-extracted modules ship with a smoke-test commit (Owner-only, visible only via `building` mode) before any flip toward broader visibility.
- C1–C4 checkpoints (governance §9) honored.
- Cloudflare deploy-status check on the post-flip commit before walking away.

---

## F2 — Broken module loads (lazy-load partial)

**Description:** Module loads, mounts, but a downstream `import()` (or a script-tag dependency) fails midway. UI renders partial state.

**Symptoms:**
- Module renders top half; bottom half blank.
- Console shows unhandled promise rejection on `import()`.
- Repeated tab activation does not recover.

**Detection:**
- Visual diff vs. baseline screenshot.
- Unhandled rejection counter (if telemetry is wired) spikes.
- Manual golden-path checklist step failure.

**Blast radius:** That module. State left in `mount`-incomplete condition. Any pending writes are at risk if the user retries.

**Rollback:** Flip module back to `building`; show "Module loading — try again later" placeholder via the `canSeeModule` resolver returning false for non-Owners.

**Stabilization:**
1. Disable the module.
2. Inspect Network panel for the failing chunk.
3. Bundle the dependency into the main module file (no nested dynamic imports beyond one level).
4. Re-deploy; verify on staging.

**Prevention:**
- Hard rule: shell-v2 modules use **at most one** dynamic `import()` level (the top-level `mount`). Sub-imports are static.
- Module size soft cap: 80KB minified. If approaching, split into a sibling module — not via lazy chunks.

---

## F3 — State divergence (v1 ↔ v2)

**Description:** A record (e.g., a quote) is open in v1 in one tab and v2 in another. Both write. Last write wins; the other tab's view becomes stale.

**Symptoms:**
- User reports "I saved that — where did it go?"
- Audit log shows two writes within seconds, opposing values.
- `source: 'shell_v2'` tag distinguishes the v2 write.

**Detection:**
- Audit-log scan for back-to-back writes by same user with conflicting values.
- User report.

**Blast radius:** Single record. No cascading damage if write tags are honored.

**Rollback:** Replay from `audit_log` — the earlier write (per timestamp) is restored if Captain decides. The `source` tag identifies whether v1 or v2 was overwritten.

**Stabilization:**
1. Identify the record.
2. Show both versions to Captain.
3. Restore the chosen version via SQL paste.
4. Add the user to a per-user `deny` override on the *opposite* shell for 24h (cooldown).

**Prevention:**
- Single-shell-per-record rule: when shell-v2 has a write surface for record type X, the v1 write surface for X is hidden via `module_modes` resolution, not coexistent.
- Write paths migrate to v2 *one record type at a time* (rollout strategy Phase 5).
- Every v2 write carries `source: 'shell_v2'` + a client-side updated_at — server-side conflict detection becomes possible later.

---

## F4 — Role visibility failures

**Description:** A user sees a module they should not (privilege escalation) or doesn't see one they should (denial).

**Symptoms:**
- Sales user sees Owner Dashboard tile.
- Or: Owner reports a tile is missing after a flip.

**Detection:**
- User report.
- Periodic Owner-side audit: open each role's view via per-user override and compare.
- Discrepancy between `module_modes.json`, `data-roles` whitelist, and `accentos_user_overrides` localStorage.

**Blast radius:** Potentially every user of the misconfigured role. Information disclosure if the over-shown module reveals data the role shouldn't see.

**Rollback:**
- Flip the module to `building` (Owner-only) immediately. One commit.
- For per-user override mistakes: clear the override (Owner machine).

**Stabilization:**
1. Lock the module to `building`.
2. Reconcile `module_modes.json` mode, sidebar `data-roles`, and the resolver's role mapping.
3. Re-test each of the 5 roles via per-user override on Owner machine before re-flipping.

**Prevention:**
- The `canSeeModule` resolver is the single source of truth — never inline role checks in module code (C3).
- A flip touching role gating is its own commit; never bundled with feature work (governance §14).
- Each `→ live` flip requires a 5-role visual check (G5).

---

## F5 — Mobile / PWA regressions

**Description:** A shell-v2 module works on desktop but breaks (or is unusable) on iPhone Safari at 390px.

**Symptoms:**
- Captain (iPhone-primary) reports unreadable layout, off-screen buttons, untappable controls.
- Touch targets <44pt.
- Service worker (post-Phase 6) serves stale cached shell.

**Detection:**
- Captain manual check pre-flip (mandatory before leaving `building`).
- Width-390 screenshot in golden-path checklist.

**Blast radius:** All mobile users. Captain in particular — if his primary device is broken, the build loop is broken.

**Rollback:**
- Flip to `building` (Owner-only).
- If service worker is the cause: bump the SW version + skipWaiting; if that fails, unregister via a one-line DevTools paste (Captain executes).

**Stabilization:**
1. Disable module mobile-side via a CSS guard (`@media (max-width: 480px) { .shell-v2-<name> { display: none; } }`) until fixed.
2. Show the v1 surface as the mobile fallback during the gap.
3. Fix layout; re-test at 390px before re-flipping.

**Prevention:**
- C6 (mobile parity at 390px) is a hard checkpoint before `building → testing`.
- Service worker is **post-Phase 6 only** (rollout §15). No exceptions.
- Touch-target audit included in golden-path checklist for every shell-v2 module.

---

## F6 — Rollback failures

**Description:** A `module_modes.json` flip-back doesn't restore prior behavior — module remains broken or invisible despite the flip.

**Symptoms:**
- Flip committed, Cloudflare green, but module still misbehaves.
- Or: rollback flip itself fails CI / pre-commit check (if added later).
- Or: cached `module_modes.json` served by CF edge for several minutes after deploy.

**Detection:**
- Post-flip `curl` of `accent-os.pages.dev/module_modes.json` returns prior content.
- User reports persist past the deploy.

**Blast radius:** Time-bounded (typically <5 min CF cache TTL). If longer, suggests a deploy that didn't fire.

**Rollback of the rollback:**
1. Verify Cloudflare deploy actually triggered (`gh` CLI is unavailable per env; check the Pages dashboard or `git log origin/main`).
2. If deploy didn't fire, push an empty `--allow-empty` commit to force redeploy.
3. If still failing, Captain executes manual `wrangler pages deploy` from local.

**Stabilization:**
1. Confirm `module_modes.json` content at the URL matches the commit.
2. If yes but UI still broken, the bug is in code, not the flip. Treat as F1 / F2.

**Prevention:**
- Every flip commit body includes the inverse-flip diff. Rollback is copy-paste, not synthesis.
- Pre-flip rollback dry-run on staging (G6).
- Never combine a flip with a code change in one commit.

---

## F7 — `module_modes.json` corruption

**Description:** The JSON is malformed (trailing comma, duplicate key, missing `modules` root) and the resolver can't parse it.

**Symptoms:**
- Sidebar empty for everyone except Owner (resolver default).
- Console: `JSON.parse: ...`.
- Cloudflare deploy succeeds (it's just a static file).

**Detection:**
- Pre-commit: `python -c "import json; json.load(open('module_modes.json'))"` or equivalent.
- Post-deploy: `curl ... | jq .` returns parse error.

**Blast radius:** Every user. Sidebar collapses. Owner can still navigate via direct hash routes if those exist; otherwise also affected.

**Rollback:** `git revert <bad_commit>` and push. No SQL, no worker action.

**Stabilization:**
1. Revert immediately (don't try to fix forward — JSON revert is fastest).
2. Run a parse check on the reverted state.
3. Fix on a branch; PR with the parse check as a pre-merge gate.

**Prevention:**
- Pre-commit hook (file-local) that runs `jq . module_modes.json > /dev/null`.
- One flip per commit (governance §14) — keeps diffs reviewable by eye.
- Never edit `module_modes.json` in a multi-file commit.

---

## F8 — Partial rollout drift

**Description:** Different users land in different rollout states because per-user overrides + role gates + mode states accumulate inconsistently. No single user sees what the docs say they should.

**Symptoms:**
- "Works on my machine" reports become routine.
- Two users with same role see different sidebars.
- Captain can't reproduce a reported bug.

**Detection:**
- Owner-machine audit: enumerate `accentos_user_overrides`, list all `allow`/`deny`/`read_only` rows.
- Cross-check vs. `module_modes.json` modes and `data-roles` whitelists.
- Drift count = (overrides) - (overrides justified by `MODULE_OWNERSHIP_MAP.md`).

**Blast radius:** Diagnosis cost. No data risk, but rollout decisions become unanchored ("are we 80% rolled out? we don't know").

**Rollback:** Drift cleanup is forward-only — clear stale overrides quarterly.

**Stabilization:**
1. Owner-machine override audit.
2. Remove overrides not justified by current ownership.
3. Document the remaining justified overrides in SESSION_LOG.

**Prevention:**
- Cap overrides at 5% of (users × modules) — enforced manually.
- Each new override carries a written justification logged at creation.
- Migrate to Supabase `user_module_overrides` (M30 candidate) as soon as cross-device gating matters — localStorage v1 is a known drift source.

---

## F9 — Stale client states

**Description:** A user's browser holds an old `index.html` or old `js/shell_v2/<name>.js`; they see and interact with a version that disagrees with current `module_modes.json`.

**Symptoms:**
- User reports a flag/feature behavior that matches a prior commit, not current.
- Hard refresh resolves it.
- More common in browsers with aggressive HTTP caching or future SW caching.

**Detection:**
- User report.
- Compare client-reported version (if a `<meta name="aos-version">` tag is set per deploy) vs. server.

**Blast radius:** Per-user; resolves on refresh.

**Rollback:** N/A — not a state change, a cache stalemate.

**Stabilization:**
1. Bump a query string on `js/shell_v2/*` imports (cachebust).
2. Tell Captain to hard-refresh and message any reporting user.
3. If SW is involved (post-Phase 6): bump SW version, force `skipWaiting`.

**Prevention:**
- Add a `?v=<commit-sha>` query string to all shell-v2 imports — cheap, effective, no build step.
- Document hard-refresh as the first step of every user-facing bug report intake.
- No service worker until post-Phase 6 (rollout §15).

---

## F10 — Cross-session governance conflicts

**Description:** Two Claude sessions on two branches both edit governance state in conflicting ways (e.g., both flip a module mode, both edit a canonical doc, both claim ownership of a surface).

**Symptoms:**
- Merge conflict on `module_modes.json` or canonical docs.
- After merge, sidebar state surprises one or both sessions.
- Stale spoke branch overwrites canonical content on rebase.

**Detection:**
- `git log --oneline origin/main..HEAD` shows commits the local branch didn't see.
- Merge conflict at PR time.
- This doc's resolver (governance §11) returns ambiguous result.

**Blast radius:** Up to repository-wide if a governance doc is forked. Recovery cost high (manual reconciliation).

**Rollback:**
- For `module_modes.json`: `git revert` the offending merge; replay the surviving flip.
- For canonical docs: revert the spoke commit; canonical branch wins per governance §1.

**Stabilization:**
1. Freeze writes on both branches (per governance §12 step 4).
2. Captain picks a winner.
3. Loser's intent is captured in SESSION_LOG; loser's commits are reverted.
4. Resume with one writer.

**Prevention:**
- Branch naming convention (governance §14) so glance-time disambiguation works.
- `claude/governance-*` branches have exclusive write rights to canonical docs.
- One-flip-per-merge rule.
- Spoke branches are read-only on `module_modes.json` and canonical files.
- Stale-branch rule (14 days idle = abandoned).

---

## Summary — failure-mode coverage matrix

| Failure | Detection cost | Blast radius | Rollback cost | Prevention level |
|---|---|---|---|---|
| F1 Shell injection | Low | Single module | Low | High (C1–C4) |
| F2 Lazy-load partial | Medium | Single module | Low | High (one-level imports) |
| F3 State divergence | Medium | Single record | Medium | High (single-shell-per-record) |
| F4 Role visibility | High | Role-wide | Low (flip) / High (data leak) | High (resolver-only) |
| F5 Mobile regressions | Low (Captain) | Mobile users | Low | High (C6) |
| F6 Rollback failures | Medium | Time-bounded | Medium | High (dry-run) |
| F7 `module_modes` corruption | Low (parse) | All users | Low (revert) | High (parse check) |
| F8 Partial rollout drift | High | Diagnostic | High (audit) | Medium (cap + log) |
| F9 Stale client | Low | Per-user | None | Medium (?v=sha) |
| F10 Cross-session governance | Medium | Repo-wide | High | High (naming + single-writer) |

---

*End of ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md — planning only.*
