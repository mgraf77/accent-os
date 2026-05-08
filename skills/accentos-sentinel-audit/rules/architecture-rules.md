# Architecture Rules

---

## Module Contract Rules

### Required module structure

Every AccentOS module MUST expose:

```js
window.AccentOS.modules.moduleName = {
  init() {
    state = createInitialState();
    // attach DOM listeners, fetch initial data
  },
  destroy() {
    state = null;
    // remove listeners, cancel pending fetches
  }
};
```

**Violations — flag as High:**
- Module does not expose `init()` and `destroy()`
- Module state is not nulled in `destroy()`
- Module reads/writes to global state outside `window.AccentOS.modules`
- Module attaches listeners without removing them in `destroy()`

---

## File Size Thresholds

| File | Warning | High | Critical |
|---|---|---|---|
| `index.html` | 500KB | 750KB | 900KB |
| Any single JS section | 100KB | 200KB | 300KB |

At **Critical**, the skill MUST recommend modular extraction and refuse to suggest adding more feature code until extraction is planned.

Current `index.html` status: **CHECK AT AUDIT TIME** (see scanner output).

---

## Monolith Management Rules

**Flag as High if:**
- New major logic is added directly to root `index.html` without a patch boundary marker
- A section exceeds 200KB with no extraction plan documented
- Feature-specific logic leaks into shared global utilities without documentation

**Flag as Medium if:**
- Duplicate utility functions appear in more than one section
- `index.html` grows >10% between audits without a size management note

---

## Global State Rules

**Flag as Critical if:**
- Mutable global state exists outside `window.AccentOS.modules`
- A module writes directly to `window.*` properties that are not part of the module registry

**Allowed:**
```js
window.AccentOS = window.AccentOS || {};
window.AccentOS.modules = window.AccentOS.modules || {};
window.AccentOS.config = { ... }; // read-only config object, set once at boot
```

**Not allowed:**
```js
window.currentVendor = vendor; // direct global mutable state
let globalVendorList = []; // module-level but not inside init/destroy
```

---

## Patch Boundary Marker Rules

**Required format for HTML sections:**
```html
<!-- START: AccentOS [Module Name] Module -->
...
<!-- END: AccentOS [Module Name] Module -->
```

**Required format for JS sections:**
```js
// START: AccentOS [Module Name] Module
...
// END: AccentOS [Module Name] Module
```

**Flag as High if:**
- A section is >100KB and has no START/END markers
- Markers exist but are unmatched (START without END or vice versa)
- Markers are inconsistently named between START and END

**Flag as Medium if:**
- A section is 50–100KB without markers
- Markers are present but very broad (wrapping >500 lines)

---

## Module Extraction Decision Tree

When `index.html` approaches 750KB:
1. Identify the largest self-contained feature section
2. Verify it has clean init/destroy contract
3. Extract to `js/[module-name].js`
4. Replace inline section with `<script src="js/[module-name].js"></script>`
5. Verify no global state leaks across boundary
6. Document extraction in `MASTER.md`

At 900KB: extraction is mandatory before any new feature work.

---

## Dependency Rules

- No new external CDN dependencies without documenting in `MASTER.md`
- No npm packages pulled into `index.html` inline without audit
- No large JSON blobs (>10KB) embedded in HTML
- Supabase client version must be pinned, not `latest`
