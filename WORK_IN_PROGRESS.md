## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-08 — Phase 2C Interaction Depth + Rollout Plan complete, committing
**Resume trigger:** "continue last session"

---

## CONTEXT

Prior:
- Quote Generator v2 + AI parse — `940e7f8`
- Worker proxy fix at `2dca2a6` — NOT YET REDEPLOYED (BUG-01)
- AccentOS UI Foundation — governance + design + shell + v1 prototype
- Phase 2A — `b9e7f58` — rich operational simulation
- Phase 2B — `b22a9d5` — task inbox, AI assist mode, mobile sheet, keyboard chords

This session (Phase 2C):
- Table interaction depth (bulk select, keyboard nav, range select)
- Saved operational views per table
- Daily briefing card per role
- Notification → workflow click-through
- Pipeline drag-and-drop
- Production-readiness rollout doc (planning-only)
- Zero production touch · Boot smoke 26/27 (only git state delta)

---

## COMPLETED THIS SESSION (Phase 2C)

### 1. Bulk Selection System
- New cb-col first column on Vendors, Quotes, Customers, Inventory tables
- Header `data-bulk-all` for select-all-on-page
- Click checkbox to toggle, Shift-click row range, Esc clears
- Floating `.bulk-bar` action bar appears at bottom on selection
- Per-table bulk actions:
  - Vendors: Score Selected, Email Reps, Export
  - Quotes: Log Follow-Up, Send to Customer, Archive
  - Customers: Schedule Follow-Up, Email Group, Re-segment
  - Inventory: Create PO, Export, Mark Critical
  - Tasks: Mark Done, Assign, Snooze, Delete
- Real action wiring: bulk Mark Done updates DATA.tasks, bulk Archive updates quote status, bulk PO drafts a PO toast
- Switching to a different table auto-clears prior selection
- Mobile: bulk bar reflows, full-width with safe-area respect

### 2. Saved Operational Views
- Filter chip bar above each table with per-role-relevant presets
- Vendors: Tier A · Unassigned · Co-op Open · Declining · Stale
- Quotes: Stale >7d · Mine (MW) · High Value · Active · Accepted
- Customers: VIP · Overdue Follow-Up · Lapsed · Prospects · High LTV
- Inventory: Critical · Below Reorder · In Stock
- Tasks: P1 only · Mine (MW) · Overdue
- Live row counts on each chip
- Persisted per-table to localStorage `aos-views`
- Click chip to toggle, Clear ✕ to reset
- Toast feedback on apply

### 3. Daily Briefing Card
- Auto-injected at top of dashboard (right after surface header)
- Role-aware content:
  - Owner: at-risk dollars + co-op deadline + critical stock + pipeline forecast
  - Manager: pipeline + stale deals + close rate + scoring queue
  - Sales: today's follow-ups + stale quote + proposal due
  - Designer: spec approvals + quote updates
  - Warehouse: deliveries + PO arrivals + critical stock
  - Viewer / AI Agent: none (intentional)
- 3–4 action chips with $-impact / count badges
- Click action → navigates + auto-applies relevant saved view (e.g., "Stale quotes" navigates + applies stale view)
- Auto-generated timestamp · subtle gold-glow border

### 4. Notification → Workflow Wiring
- Each notification now has a `target: {mod, view?, rail?}` field
- Click any notif: closes panel, marks read, navigates to module, optionally applies view, optionally opens rail with target item
- 6 notifs all wired to real targets (vendors V01/V03, quotes QT-0839, inventory WP-2290, deal D04, stale-quotes view)
- Hover hint shows "→ open [id]" or "→ [view]"
- Patches rail openers to be defensive about missing `event.currentTarget`

### 5. Pipeline Drag-and-Drop
- Deal cards are `draggable="true"` with grab cursor
- Pipeline columns are drop targets
- Drop highlight on hover (gold tint + border)
- Stage advance updates `d.stage` and `d.prob` per `STAGE_PROBABILITY` map (lead 25 → qualified 50 → quoted 70 → negotiating 85 → won 100, lost 0)
- Toast confirms transition · success color for "won", warning for "lost"
- Re-renders pipeline immediately

### 6. Table Keyboard Navigation
- ↑ / ↓ moves row focus within active table (`.kb-focus` outline ring)
- Enter opens rail for focused row
- Space toggles bulk selection on focused row
- Shift+↑/↓ extends bulk selection while moving
- Auto-scrolls focused row into view
- Esc clears bulk selection (also closes overlays per Phase 2B)

### 7. Production-Readiness Rollout Doc (NEW)
- `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md` (485 lines)
- Status: PLANNING ONLY — explicit non-authorization to integrate
- 12 sections + 2 appendices covering:
  - Current state inventory (monolith vs prototype vs ui/ assets)
  - Coexistence model: shell-as-frame, monolith-as-content
  - 6-phase progressive rollout (A: side-load → B: outer chrome → C: read-only module → D: read-write module → E: rest of modules → F: decommission legacy)
  - Per-phase exit criteria, rollback methods, blocking risks
  - Low-risk injection points inside index.html (anchor-based, not line-based)
  - Feature flag strategy (localStorage `aos-shell-enabled`, URL override, per-role default, kill-switch)
  - Per-phase rollback protocol referencing STABILIZATION_PROTOCOL.md
  - Migration boundaries (auth, RLS, worker proxy, SQL — all NOT crossed)
  - Coexistence risks R-S01 through R-S08 (z-index, event handlers, localStorage keys, CSS variables, viewport meta, touch events, scroll containment, focus stealing)
  - Open questions for Michael (5 decisions to lock before Phase A)
  - Definition of done — Phase 4 readiness criteria

---

## FILES CHANGED THIS SESSION

- `ui/accentos-shell-prototype.html` — +545 lines (2004 → 2549)
- `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md` — new (485 lines)
- `WORK_IN_PROGRESS.md` — this file

**No production files touched. index.html / worker / sql / settings unchanged.**

---

## PRODUCTION-READINESS DISCOVERIES

1. **Outer-chrome integration is the lowest-risk insertion** — wrapping the existing monolith body inside the shell's surface zone needs only ~5 lines of HTML change in index.html and zero CSS specificity conflicts (shell uses `aos-` prefix, monolith doesn't).

2. **localStorage namespace is the contract** — all shell state uses `aos-*` prefix (mode, recent, views). Monolith uses unprefixed keys. No collisions found in audit.

3. **Z-index lanes don't overlap** — shell uses 100–800 (per ACCENTOS_TOKENS.md), monolith uses ad-hoc but no observed values >100 in initial audit. Documented as R-S01 with mitigation.

4. **Keyboard chord prefix risk** — `G` and `M` chord prefixes could conflict with monolith inputs if focus escapes. Mitigated by `typing` guard already in place. Documented as R-S02.

5. **Feature flag is essential** — `localStorage.aos-shell-enabled` + `?shell=1` URL override gives instant rollback during transition. Per-role default lets owner test first.

6. **No SQL changes required for shell adoption** — UI visibility is purely client-side. Real RLS is a separate Phase 4 gate, not blocked by shell rollout.

---

## WORKFLOW ACCELERATION IMPROVEMENTS

| Workflow | Before | After |
|----------|--------|-------|
| Mark 5 tasks done | 5× click rail + click button | Shift-click range, ⌘Done bulk action |
| Find stale quotes | Scroll table, eyeball ages | One chip click → filtered |
| Triage notifications | Click notif → toast (dead-end) | Click → navigate + open rail directly |
| Advance deal stage | Open deal → click "Advance" button | Drag card to next column |
| Resume yesterday's vendor | Browse sidebar → search → find | ⌘P → arrow → enter |
| Owner's daily kickoff | Read 4 cards individually | Briefing card summarizes + 4 deep-link chips |

---

## OPERATIONAL PRIMITIVES DISCOVERED

1. **`{mod, view, rail}` target object** — universal "navigate me here" descriptor used by notifications, briefing actions, AI hints. Future: command palette items, tasks, search results.

2. **`VIEW_DEFS` predicate registry** — table-keyed map of `{id, label, pred(item)}`. Trivial to extend per role or per user. Future: user-saved custom views.

3. **`bulkState`** — single global selection model `{table, ids:Set, lastClicked}`. Switches table on context change, supports range select. Future: cross-table selections (e.g., "selected tasks + their source items").

4. **Wrapper-pattern function override** — used 8× total now (navigate, setMode, renderDashboard ×2, renderTasks, applyRole, plus all 5 rail openers). Stable pattern for non-invasive enhancement.

5. **CSS data-attribute mode contract** — `data-mode`, `data-role` on shell element drive selectors. Adding a 7th mode is a one-line CSS addition.

---

## RISKS DISCOVERED

- **Rail openers used bare `event` global** — patched to defensive guard. Found while wiring notif click-through. (Was latent risk only — never hit in normal flow.)
- **Sed `&` literal expansion** — caught and recovered. Documented for future: prefer Edit tool for replacements containing regex metacharacters.
- **No new architectural risks.** Phase 2C remained inside the prototype boundary. R-01 through R-06 unchanged.

---

## OPEN ITEMS

### BUG-01 — Worker Proxy Redeploy (BLOCKS ON MICHAEL)
Quote Generator AI Parse 400. Fix `2dca2a6`.
Michael: `wrangler deploy` from `C:\Users\Michael\Desktop\accent-os`

### Open Decisions for Michael (per rollout doc)
1. Should role switcher map to a real `users.role` column eventually, or stay UX-only?
2. Phase B mount point preference (3 candidate anchors documented)?
3. Feature flag granularity — per-role / per-user / per-module?
4. Acceptable downtime window for Phase F?
5. Bundle size budget for shell when integrated?

---

## NEXT STEPS

1. **Commit + push Phase 2C**
2. **Michael review:**
   - Open `ui/accentos-shell-prototype.html`
   - Test bulk select: shift-click rows on Vendors, click Score Selected
   - Test saved views: click "Tier A" chip, then "Coop Open"
   - Test briefing: click "Stale quotes" chip on dashboard briefing
   - Test notif click: open bell, click "Co-op deadline" notif → jumps to vendor + opens rail
   - Test pipeline drag: drag a deal card between columns
   - Test keyboard nav: navigate to Vendors, press ↓↓↓, Enter, Esc
   - Read `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md`
3. **Michael decisions on 5 rollout questions** — needed before any Phase A work
