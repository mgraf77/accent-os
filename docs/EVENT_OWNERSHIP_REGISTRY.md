# Event Ownership Registry

Companion to `.orchestration/forbidden_runtime_patterns.json` and the
`scripts/check-runtime-emitters.sh` visibility scan. Lists every custom
event (`dispatchEvent` / `CustomEvent`) emitted or listened to in this
repo. External browser/DOM events (click, change, DOMContentLoaded, …)
are tracked in `known_external_events` inside the JSON config and are
intentionally absent here.

Status legend:

- **owned** — declared in `signal_owners` in the JSON config; emitter is
  the sole owner and at least one listener exists.
- **orphan-emit** — emitted with no listener (intentional or pending).
- **orphan-listen** — listener with no emitter (intentional or pending).
- **mismatch** — emitted from a file other than its declared owner.
- **external** — DOM/browser/system event; tracked via the exclusion
  list, not here.

## Custom event registry

| Event           | Owner            | Emitter location          | Listener location         | Purpose                                                                 | Status         |
| --------------- | ---------------- | ------------------------- | ------------------------- | ----------------------------------------------------------------------- | -------------- |
| `roSelectRep`   | _(none — UI)_    | `index.html` (rep picker) | `index.html` (rep picker) | Repair-order rep selection inside the legacy modal UI.                  | orphan (known) |
| `module_loaded` | `js/module_modes.js` | _(not yet emitted)_    | _(not yet listened)_      | Future declared signal: module registry has finished loading manifests. | declared       |
| `health_check`  | `js/health.js`       | _(not yet emitted)_    | _(not yet listened)_      | Future declared signal: periodic runtime health probe.                  | declared       |
| `decision_made` | `js/decision_engine.js` | _(not yet emitted)_ | _(not yet listened)_      | Future declared signal: decision engine produced an outcome.            | declared       |

## Process

When you add or rename a custom event:

1. Add (or update) the event in `signal_owners` (and where relevant
   `signal_synonym_families`) inside
   `.orchestration/forbidden_runtime_patterns.json`.
2. Add a row here with emitter location, listener location, purpose, and
   status.
3. If the event is intentionally orphan (no listener, e.g. legacy UI
   hooks), also add the name to `known_orphan_emitters` so the scan stays
   quiet.
4. Re-run `bash scripts/check-runtime-emitters.sh` — confirm zero new
   findings, or document the new finding here.

Visibility-first: this is a report-only registry. The scan never blocks a
commit. Drift is surfaced; correction is a human call.
