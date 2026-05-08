# Vendor Intelligence Product Logic Rules

Rules governing the Vendor Intelligence module — AccentOS Phase 1 core feature.
Violations here affect real purchasing and vendor relationship decisions.

---

## Scoring Integrity Rules

### Categories

AccentOS has 14 vendor scoring categories. Any change to categories must:
1. Be documented in `MASTER.md` or `decision-log` skill
2. Have a migration to update existing vendor scores
3. Update any employee-facing scoring help documentation

**Flag as Critical if:**
- Scoring categories change without a recorded decision
- Category names change without updating all references (UI, DB, docs)
- Score weights change without a changelog entry

**Flag as High if:**
- A new scoring category is added without baseline scores for existing vendors
- A category is removed without handling historical data

### Confidence and Notes fields

**Flag as High if:**
- Confidence scores are removed or always set to a default
- Notes/confidence are overwritten silently on re-import
- Missing data is converted to `0` instead of `null` or `N/A`

**Required behavior:**
- Missing numeric scores: store `null`, display as `N/A` or `—`
- Missing text fields: store `null` or `''`, display as blank
- Confidence fields: `null` = unscored, never fake a confidence score

---

## Parent Company Grouping Rules

**Flag as High if:**
- Parent company grouping logic produces inconsistent results
- A vendor appears under multiple parent companies
- Parent company ID is null for vendors that clearly belong to a group
- Parent company name changes without cascade update to child vendors

---

## Rep Management Rules

**Flag as Medium if:**
- `rep_group_id` is null for a vendor that has an active rep relationship
- Rep contact structure is inconsistent across vendors
- Rep group changes are not logged in vendor change history

---

## Database Integrity Rules

**Flag as Critical if:**
- Vendor table fields are renamed without a migration AND UI update in the same commit
- A migration removes a vendor field that is still referenced in UI code

**Flag as High if:**
- Vendor import truncates or overwrites `notes` or `confidence` without user confirmation
- Duplicate vendors are created during import without deduplication logic
- Vendor `id` column is not a stable UUID (changes between imports)

---

## Missing Data Handling Rules

The vendor module must handle missing data gracefully:

```js
// Required
const score = vendor.score ?? null;
const display = score !== null ? score.toFixed(1) : '—';

// Not allowed
const score = vendor.score || 0; // converts missing to fake zero
```

**Flag as High if:**
- Numeric defaults are applied where data is missing rather than showing blank/N/A
- Sort operations crash on null score values instead of handling gracefully
- Import scripts set `0` as default score for unscored categories

---

## Employee Usability Rules

**Flag as Medium if:**
- The Vendor Intelligence module has no employee-facing help/how-to tab
- The help tab was removed or disabled
- Scoring explanations are absent (employees won't know what scores mean)
- Filter/search UX breaks on edge cases (empty results, special characters)

---

## Vendor Count and Scale Rules

Current vendor count: ~471 vendors.

**Flag as High if:**
- New feature loads all 471 vendors without pagination or virtualization
- Bulk operations have no progress indicator for >50 vendors
- Vendor list queries have no index on `vendor_name` or `parent_company_id`

---

## Data Preservation Rules

When any vendor data import runs:

1. Never overwrite existing non-null scores with null from import
2. Never truncate notes or confidence fields on re-import
3. Log import timestamp and source
4. Provide rollback path (snapshot before import or soft-delete pattern)
5. Show import diff summary before committing

**Flag as Critical if:**
- An import silently overwrites existing vendor intelligence data
- No rollback exists for a bulk vendor data update
