# Vendor Ranking System Extraction Plan - AccentOS

## Current Responsibilities
- **Data Storage:** Houses `VD_RAW` (the static vendor master list).
- **Logic:** Weighted scoring calculation, tier determination, parent/sister brand propagation.
- **UI:** Main vendor list rendering, advanced filtering, SVG sales charts, scoring heatmap, vendor detail modal, and rep outreach email scaffolding.

## Dependencies
- **Globals:** `VD_RAW`, `CAT_DEFS`, `PARENT_COMPANIES`, `VENDOR_PARENTS`, `REP_DIRECTORY`.
- **Utilities:** `fmt$`, `fmtS`, `esc`, `sbFetch`, `logChange`.
- **Cross-Module:** Referenced by `Global Search`, `Deal Optimizer`, `Activity Feed`, and `Mgmt Dashboard`.

## Extraction Boundaries
- **Start:** `// ── VENDOR RANKING MODULE` (approx. line 1982)
- **End:** Before `// ── KNOWLEDGE ENGINE` (approx. line 5964)
- **Proposed File:** `js/vendors.js`

## Proposed Module Surface
```javascript
// Internal State
let VD = []; // Initialized from VD_RAW

// Public API
function vendors(el, act);          // Main entry point for goTo()
function openVendorDetail(id);      // Deep link to vendor modal
function weightedScore(vendorObj);  // Pure-compute scoring helper
function vendorScore(vendorObj);    // Returns {score, tier, unverifiedCount}
```

## Migration Risks
1. **File Size Gravity:** `VD_RAW` is extremely large. Moving it to an external file will reduce `index.html` weight but might increase script load time if not handled correctly.
2. **Coupling:** `Global Search` and `Deal Optimizer` call `weightedScore` and `openVendorDetail` directly. These functions must remain globally accessible.
3. **Data Dependency:** `sbLoadScoreStates` and `sbLoadVendorScores` in `index.html` assume `VD` is already initialized.

## Rollback Considerations
- The extraction is mostly a "block move." Reverting involves moving the code back into the main `<script>` tag of `index.html`.

## Verification Requirements
- [ ] Verify search for "Acuity" correctly opens the detail modal.
- [ ] Verify "Apply to Sister Brands" correctly propagates scores.
- [ ] Verify SVG sales chart renders without errors.
- [ ] Verify `weightedScore` returns correct values for Tier A vs Tier B vendors.
