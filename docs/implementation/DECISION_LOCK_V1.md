# Decision Lock V1
**Answer inline. Commit or reply with answers. One block unblocks Phase A.**

Last updated: 2026-05-09
Status: AWAITING MICHAEL

---

## HOW TO USE

Read each item. Type your answer on the `Answer:` line.
Send back the whole file or just the numbered answers.
Defaults are safe — skip any item you want to defer.

---

## BUG-01 — Worker Redeploy

The Cloudflare Worker (`worker/anthropic-proxy.js`) needs a redeploy from your
local terminal. The Quote Generator "Parse Notes" feature returns 400 errors
because the deployed worker is behind the current code. Running `wrangler deploy`
from the `accent-os` project folder on your machine fixes it.

Default if skipped: Parse Notes stays broken. Other features unaffected.

**Steps when ready:**
1. Open terminal in `C:\Users\Michael\Desktop\accent-os`
2. Run: `wrangler deploy`
3. Test: open index.html → Quotes → Parse Notes → confirm no 400 error

Answer: Done / Not yet / Different path — my project folder is: ___________

---

## SQL-01 — Database Migrations

Migrations M01–M40 in the `sql/` folder define the production schema (RLS rules,
core tables, inventory, purchase orders, deliveries, and more). They must be run
in order in the Supabase SQL editor. None have been run yet; the database is
currently using whatever schema Supabase auto-created.

Default if skipped: Production features that need real data stay blocked.
Prototype continues to work fine (uses hardcoded data).

**Steps when ready:**
1. Open Supabase dashboard → SQL editor
2. Run M01 through M40 in order, one paste per file
3. Check for errors — stop and flag any that fail

Answer: Done / Not yet / Partially done through M___

---

## DEC-01-A — Role Switcher: UX-only or real auth?

The shell's 7-role switcher (Owner, Manager, Sales, etc.) currently works as
a pure front-end filter — it changes what you see but there is no server-side
enforcement. The question is whether this role system should eventually connect
to a real `users.role` database column, or remain browser-only forever.

Default: Stay UX-only. Per-user role is stored in localStorage, not the database.
Choosing "real auth" does not block Phase A — it only affects the later RLS phase.

Answer: Keep UX-only / Connect to real users.role eventually / Decide later

---

## DEC-01-B — Keyboard shortcut ownership: who handles Cmd+K?

The new shell prototype claims Cmd+K to open the command launcher. The legacy
`index.html` may already have a Cmd+K binding (unaudited). If both claim it,
one silently wins — probably the last event listener registered.

Default: Shell handles Cmd+K. A pre-Phase-A audit will grep `index.html` for
existing bindings and de-conflict them before any production code is touched.

Answer: Shell owns Cmd+K / Legacy keeps it / Run audit first, decide after

---

## DEC-01-C — Feature flag granularity

Phase A introduces a feature flag system to control which users see the new shell.
Four granularity levels are possible: (1) global on/off, (2) per-role, (3) per-user,
(4) per-module. The spec currently defaults to all four layers but that adds
maintenance overhead.

Default: All four layers. Needed for safe per-module rollback during Phase E.
Choosing "master flag only" is simpler but risks needing a full rollback instead
of a per-module one if something breaks late in the rollout.

Answer: All four layers / Master flag only / Global + per-user (skip role and module)

---

## DEC-01-D — Phase B shell mount point

Phase B mounts the new shell into the live `index.html`. Two candidates:
Candidate 1 inserts the shell after the existing top nav (lowest risk, both navs
visible briefly). Candidate 3 replaces the top nav entirely (cleaner but higher risk).

Default: Candidate 1 (additive, lower risk, easier to revert).
Candidate 3 looks better but requires the legacy nav to be completely audited
and removable before Phase B starts.

Answer: Candidate 1 (after nav) / Candidate 3 (replace nav) / Decide after Phase A audit

---

## DEC-01-E — Phase C target module

Phase C is the first real module integration — one module gets migrated from
legacy rendering to shell-native rendering. System Health is the recommended
target because it is read-only (zero data mutation risk during the migration).

Default: System Health. It has no write paths, making it the safest first migration.
Any other read-only module (e.g., Dashboard KPI view) is also acceptable.

Answer: System Health / Dashboard / Other: ___________

---

## DEC-01-F — Per-module flag overhead worth it?

Related to DEC-01-C. Per-module flags let you disable one module's shell
integration without rolling back the whole shell. The tradeoff is that each
new module integration requires a flag definition, a flag check in the code,
and a toggle in the flag config — roughly 15 minutes of overhead per module.

Default: Per-module flags. Required for safe Phase E rollback.
Master-flag-only means any regression forces a full shell disable, which is
a longer recovery if multiple modules are already live.

Answer: Per-module flags worth it / Master flag is enough / Decide at Phase C

---

## DEC-01-G — Phase F: build step or stay no-bundler?

Phase F decommissions the legacy shell. At that point, a build step (Vite, esbuild,
etc.) becomes optional — the codebase is clean enough that bundling would give
smaller payloads and tree-shaking. The alternative is to keep the current approach:
plain JS files, no build, instant deploy.

Default: Stay no-bundler. Revisit only if measured boot time regresses below
acceptable threshold after Phase F.

Answer: Stay no-bundler / Introduce build step at Phase F / Decide at Phase F

---

## DEC-01-H — Phase F downtime window

Phase F is the final decommission of the legacy shell — it will require a
short window where the site is at higher risk of visual issues. A `git revert`
is always available as a rollback. The question is what downtime/risk window
is acceptable.

Default: Off-hours deploy, under 5 minutes, with a `git revert` rollback rehearsed
the day before on the staging environment.

Answer: Accept default / Different window: ___________ / Defer to Phase F planning

---

## PRIORITY ORDER (if you only have 10 minutes)

1. BUG-01 — fixes a live broken feature right now
2. SQL-01 — unblocks all production data features
3. DEC-01-B — Cmd+K conflict blocks Phase A audit start
4. DEC-01-C — flag granularity blocks Phase A implementation
5. Everything else — defaults are safe, can defer

---

## WHAT HAPPENS NEXT

Once BUG-01 + SQL-01 are done and DEC-01-B/C have answers:
Phase A integration work can begin immediately. That is the largest single
block of remaining build work — roughly 6–8 sessions.

Send answers back as a reply or commit this file with your answers filled in.
