## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — starting Track 6.8 Intelligent Alerts
**Current task:** 6.8 Intelligent Alerts (first Track 6 entry)
**Step:** Planning. The `alerts` table is already in M02 schema (no new SQL needed). Plan: build js/alerts.js with (1) generator that runs on hydrate to compute alerts from existing data — stale deals, expiring co-op funds, quotes going cold, low inventory, recent score drops, overdue deliveries, expiring warranties, etc.; (2) Alerts page showing list with filters (severity / type / status); (3) topbar bell icon with unread count + dropdown for top-N most urgent; (4) per-alert mark-read / dismiss / actioned states persisted via UPDATE on alerts table.
**Files touched so far this task:** PROMPT_LOG.md (logged + about to commit), WORK_IN_PROGRESS.md (this)
**Commit status:** about to commit log + WIP
**Next step if interrupted:** Write js/alerts.js with persistence (sbLoad/Save/UpdateStatus), generator function (buildAlertsFromData()), render with filters, bell icon DOM injection in activateApp. No new SQL needed (alerts is in M02).
