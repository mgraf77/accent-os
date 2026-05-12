# Event Flow Map - AccentOS

This document maps the global event listeners and custom event dispatchers used to coordinate logic across the shell and modules.

## 1. Document-Level Listeners

The following listeners are attached to `document` or `window` and affect the entire application.

| Target | Event | Handler | Purpose |
|---|---|---|---|
| `document` | `keydown` | Inline | Handles `Enter` for login and `Ctrl+K` for Global Search. |
| `document` | `click` | Inline | Auto-closes the mobile sidebar and Quick Actions FAB when clicking outside. |
| `document` | `DOMContentLoaded` | Inline | The primary application entry point. |
| `document` | `dragenter` | `js/csv_import.js`| Triggers the global CSV drop overlay. |
| `document` | `drop` | `js/csv_import.js`| Dispatches the dropped file to the active module's input. |

## 2. Custom Events

AccentOS uses custom events for lightweight cross-component communication where direct function calls are inconvenient.

| Event Name | Origin | Listener | Purpose |
|---|---|---|---|
| `roSelectRep` | `index.html` (Rep List) | `index.html` (Rep View) | Notifies the Rep View module that a specific rep has been selected for outreach. |

## 3. Realtime Events (Supabase)

The `internalmeetings` module listens for Postgres change events via the Supabase Realtime client.

- **Channels:** `im-meetings-list`, `im-meeting-detail`.
- **Logic:** Listeners trigger `imRtApply` functions that perform targeted DOM updates or state mutations without a full page reload.

## 4. UI Trigger Patterns

Most cross-module navigation follows the `goTo` pattern:
1. `goTo('module')`
2. `setTimeout(fn, 80)`

This pattern is a "pseudo-event" used to ensure the destination DOM is mounted before a module-specific detail function (e.g., `openVendorDetail`) is called.
