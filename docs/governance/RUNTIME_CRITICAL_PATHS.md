# AccentOS — Runtime Critical Paths
_Last updated: 2026-05-13_

---

## Purpose

Documents the exact execution paths for the most critical runtime operations. Used to reason about failure modes, performance bottlenecks, and safe refactoring boundaries.

---

## Critical Path 1 — App Boot (Happy Path)

```
Browser loads index.html
  │
  ├── [inline] Tier 0 globals defined (esc, $, fmt, toast, MODULE_REGISTRY)
  ├── [inline] Supabase client initialized (SB)
  ├── [inline] Worker probe IIFE fires (async, non-blocking)
  │             └── GET /v1/version → GET / → sets __AOS_WORKER_*
  ├── [inline] 36 <script src> tags parsed synchronously
  │             └── All module functions available on window
  │
  ├── DOMContentLoaded fires
  │    └── tryRestoreSession()
  │         ├── Read JWT from localStorage
  │         ├── GET /auth/v1/user (Supabase Auth)
  │         ├── GET /rest/v1/profiles (profile lookup)
  │         └── activateApp()
  │              ├── buildSidebar() → renders nav items
  │              ├── applyRoleVisibility(role) → hides/shows items
  │              ├── defer: setTimeout(_logRuntimeHealth, 2500)
  │              └── hydrateFromSupabase()
  │                   ├── sbLoadCategories() [VD]
  │                   ├── sbLoadChangelog()
  │                   ├── sbLoadParents()
  │                   ├── sbLoadScoreStates()
  │                   ├── sbLoadVendorScores()
  │                   ├── sbLoadVendorOverrides()
  │                   ├── sbLoadQuotes()
  │                   ├── sbLoadCoopFunds()
  │                   ├── sbLoadCustomers()
  │                   ├── sbLoadEmployees()
  │                   ├── sbLoadCalendarEvents()
  │                   ├── sbLoadArticles()
  │                   ├── sbLoadJobs()
  │                   ├── sbLoadInventory()
  │                   ├── sbLoadPurchaseOrders()
  │                   ├── sbLoadTradePartners()
  │                   ├── sbLoadWarrantyClaims()
  │                   ├── sbLoadShowroomDisplays()
  │                   ├── sbLoadLabelBatches()
  │                   ├── sbLoadDeliveries()
  │                   ├── sbLoadCompetitorPrices()
  │                   ├── sbLoadMarketingCampaigns()
  │                   ├── sbLoadMarketingAssets()
  │                   ├── sbLoadAlerts()
  │                   ├── sbLoadPipeline()
  │                   ├── sbLoadKPIs()
  │                   ├── sbLoadGoals()
  │                   ├── generateAlertsFromData()   ← LAST: reads all globals
  │                   └── maybeAutoSnapshotKPIs()
  │
  ├── __AOS_HYDRATE_MS__ set
  ├── applyModuleModesAfterHydrate()
  └── goTo('dashboard') → renderDashboard()
```

**Total latency: 1200–3500ms** (see STARTUP_PERFORMANCE_PROFILE.md)

---

## Critical Path 2 — AI Quote Parse

```
User pastes fixture notes → clicks "Parse with AI"
  │
  ├── aiParseNotes()
  │    ├── _aiWorkerReady() preflight check
  │    │    ├── __AOS_WORKER_ENV_KEY_READY__ === true? → proceed
  │    │    └── false/undefined → show "AI not available" → return
  │    │
  │    ├── notes = trim(textarea value)
  │    ├── !notes → toast("Paste fixture schedule first") → return
  │    │
  │    ├── POST /v1/messages (via Cloudflare Worker)
  │    │    ├── Headers: { x-api-key: [user-env-key], Content-Type }
  │    │    ├── Body: { model: claude-sonnet-4-5, messages: [{role:user, content}] }
  │    │    └── System prompt: fixture parsing instructions + JSON schema
  │    │
  │    ├── HTTP 401 → clear env key flag → show hint → return
  │    ├── HTTP 503 → show "AI temporarily unavailable" → return
  │    ├── Non-2xx → show status error → return
  │    │
  │    ├── response.json() → data
  │    ├── raw = data.content[0].text
  │    ├── Strip markdown fences (```json...```)
  │    ├── JSON.parse(raw) → parsed
  │    ├── !parsed.lines || !parsed.lines.length → toast warning → return
  │    │
  │    ├── LI = parsed.lines.map(l => ({
  │    │         part: l.part || '',
  │    │         desc: l.description || '',
  │    │         qty: Number(l.qty) || 0,
  │    │         price: Number(l.price) || 0,
  │    │         status: l.status || 'ok',
  │    │         notes: l.notes || ''
  │    │       }))
  │    │
  │    └── renderLI() → renderPreview()
  │
  └── UI shows parsed lines in quote table
```

**Failure isolation:** Every error path shows a toast and returns. LI is never partially replaced — either full replacement or no change.

---

## Critical Path 3 — Quote Save

```
User clicks "Save Quote"
  │
  ├── saveQ()
  │    ├── !$('q-proj').value → toast("Add project name first") → return
  │    │
  │    ├── Build quote object:
  │    │    id: QUOTE_ID
  │    │    project: q-proj.value
  │    │    customer_id: q-cust.value
  │    │    lineItems: [...LI]  ← snapshot at save time
  │    │    subtotal: LI.reduce((s,l) => s+(Number(l.qty)||0)*(Number(l.price)||0), 0)
  │    │    notes: q-notes.value
  │    │    status: q-status.value
  │    │    saved_at: new Date().toISOString()
  │    │
  │    ├── In-memory: QUOTES upsert (find by id or push new)
  │    │
  │    ├── sbSaveQuote(quoteObj)  ← async, .then() not awaited
  │    │    ├── DELETE from quotes WHERE number = id
  │    │    ├── INSERT into quotes (metadata row)
  │    │    ├── DELETE from quote_lines WHERE quote_id = id
  │    │    └── INSERT into quote_lines (one row per LI entry)
  │    │         ⚠ NON-ATOMIC: DELETE succeeds, INSERT can fail
  │    │
  │    └── toast("Quote saved") — fires before Supabase completes
  │
  └── Quote is in-memory immediately; Supabase sync is best-effort
```

**Known risk:** sbSaveQuote DELETE+INSERT is not atomic. If INSERT fails, lines are deleted but not re-inserted. Mitigation: upgrade to Supabase RPC transaction (logged in KNOWN_ISSUES.md as future work).

---

## Critical Path 4 — Module Navigation

```
User clicks sidebar item (or goTo('pageName') called in code)
  │
  ├── goTo(page)
  │    ├── Look up page in MODULE_REGISTRY
  │    ├── !entry → fallback render {t:'page', key:page}
  │    ├── entry.mode === 'blocked' → show "Coming Soon" → return
  │    │
  │    ├── Hide all .page-section elements
  │    ├── Show #page-[key] section
  │    ├── Update sidebar active state
  │    │
  │    ├── entry.fn exists → call entry.fn()  ← renders module
  │    │    └── module render function reads from T3 globals
  │    │
  │    └── window.location.hash = '#' + page
  │
  └── User sees module content
```

**Dependency:** Module render functions depend on T3 globals being populated. If called before hydration completes, they render empty state (not errors — all renders handle empty arrays defensively).

---

## Critical Path 5 — Role Visibility

```
tryRestoreSession() → profile loaded → activateApp()
  │
  ├── buildSidebar()
  │    └── Renders all nav items from MODULE_REGISTRY (role-agnostic)
  │
  ├── applyRoleVisibility(role)
  │    └── For each MODULE_REGISTRY entry with role restrictions:
  │         └── Toggle .hidden on nav item based on CU.role
  │
  └── Sidebar shows only role-appropriate items
```

**Order matters:** buildSidebar() MUST run before applyRoleVisibility(). Verified in STARTUP_RUNTIME_ORDER.md. If order is reversed, all items would show to all roles.

---

## Critical Path 6 — Health Check Two-Phase Render

```
goTo('health') → health()
  │
  ├── Phase 1 (synchronous):
  │    └── _renderRuntimeSection(container)
  │         ├── Reads __AOS_WORKER_VERSION__
  │         ├── Reads __AOS_WORKER_ENV_KEY_READY__
  │         ├── Reads __AOS_WORKER_PROBE_MS__
  │         ├── Reads __AOS_HYDRATE_MS__
  │         └── Renders severity table immediately
  │
  └── Phase 2 (async):
       └── _renderSchemaSection(container)
            ├── GET /rest/v1/categories (Supabase ping)
            ├── GET /rest/v1/profiles (Auth ping)
            ├── Check each known table exists
            └── Updates #hc-schema-section div in-place
```

**Design rationale:** Runtime state (worker/AI/hydration) is available immediately from boot flags. Schema state requires live Supabase pings. Separating them gives immediate feedback while async checks run.

---

## Failure Isolation Matrix

| Critical Path | Failure point | Isolation | User impact |
|---|---|---|---|
| Boot | Supabase cold-start | sbLoad* wrapped in try/catch | Slow startup only; app still loads |
| Boot | Single sbLoad fails | Independent try/catch per call | That module shows empty state |
| Boot | Auth failure | tryRestoreSession catches | Login screen shown |
| AI Parse | Worker not deployed | _aiWorkerReady() preflight | Toast message; quote UI intact |
| AI Parse | AI returns non-JSON | try/catch + parse error toast | LI unchanged |
| AI Parse | HTTP 401 | Handler clears env key | Toast with hint; retryable |
| Quote Save | Supabase INSERT fails | .then() not awaited | In-memory save succeeds; silent Supabase failure |
| Navigation | Module not in registry | Fallback `{t:page}` | Shows blank page, no crash |
| Health Check | Schema ping fails | try/catch per check | Shows FAIL row; rest of UI unaffected |

---

_Update when boot sequence changes or new critical paths are added._
