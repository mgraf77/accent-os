# Frontend Runtime Flow - AccentOS

This document describes the boot sequence, authentication lifecycle, and navigation logic of the AccentOS frontend.

## 1. Boot Sequence

The application initialization follows these steps:

1. **HTML Parsing:** `index.html` is parsed, loading CSS and defining the basic DOM structure.
2. **Core Script Execution:** The main `<script>` block in `index.html` runs, initializing global variables and utility functions.
3. **Module Loading:** External scripts in `js/*.js` are loaded. These attach their functions to the global scope.
4. **DOMContentLoaded:** The boot event listener triggers:
   - `tryRestoreSession()`: Checks `sessionStorage` for a valid JWT.
   - If session exists:
     - `activateApp()`: Hides login, shows shell, applies role visibility.
     - `hydrateFromSupabase()`: Triggers all `sbLoad*` parallel fetches.
     - `applyModuleModesAfterHydrate()`: Loads `module_modes.json` and updates the UI state.
     - `sbAuditLog('session_resume', ...)`: Records the login event.
     - `goTo('dashboard')`: Renders the default landing page.
   - If no session:
     - The login screen remains visible.

## 2. Authentication Lifecycle

- **Login:** `doLogin()` takes email/password, calls Supabase Auth `/token`, fetches the user profile for role assignment, and triggers the boot sequence.
- **Persistence:** The JWT is stored in `sessionStorage` ('aos-jwt').
- **Logout:** `doLogout()` clears `sessionStorage`, calls Supabase Auth `/logout`, and reloads the window.

## 3. Navigation & Page Rendering

Navigation is handled by the `goTo(page)` function:

1. **State Update:** Sets `curPage`, updates sidebar "active" classes.
2. **DOM Reset:** Clears `#pg-actions` and `#pg-content`.
3. **Dispatch:** Calls the render function corresponding to the page key (e.g., `dashboard(content, actions)`).
4. **Modular Logic:** If the page is handled by an external module, the function (e.g., `customers`) is called from the global scope.

## 4. Realtime Sync (Internal Meetings)

The `internalmeetings` module uses the Supabase Realtime client for live updates:
- `sbRealtime()`: Lazy-initializes the Supabase client when needed.
- `imRtSubscribe(meetingId)`: Joins a Postgres change channel for specific rows.
- Updates are applied via `imRtApply` functions, which mutate the local state and trigger partial re-renders.
