# Product Logic Review Prompt

---

## Prompt

```
ACCENTOS PRODUCT LOGIC AUDIT — VENDOR INTELLIGENCE

You are auditing the Vendor Intelligence module for correctness, data integrity,
employee usability, and readiness for planned integrations.

This module supports real purchasing and vendor relationship decisions.
Inaccurate scoring or data loss has direct business impact.

CONTEXT:
- ~471 vendors in the system
- 14 scoring categories
- Parent company grouping
- Rep / rep group management
- Supabase persistence
- Planned: Lights America data52, vendor price book feeds

SCANNER DATA:
[INSERT scan_accentos_patterns.js VENDOR SECTION]
[INSERT scan_sql_migrations.js VENDOR TABLE SECTION]

AUDIT TASKS:

1. SCORING INTEGRITY
   - Are all 14 scoring categories present in schema and UI?
   - Are score weights documented and consistent?
   - Are confidence fields preserved (not overwritten with defaults)?
   - Is missing data shown as null/N/A, not 0?
   - Are score changes logged with timestamps?

2. DATA PRESERVATION
   - What happens when vendor data is re-imported?
   - Are existing scores overwritten silently?
   - Are notes and confidence fields preserved on re-import?
   - Is there a rollback path for bad imports?

3. PARENT COMPANY LOGIC
   - Is parent company grouping consistent (no vendor in multiple parents)?
   - Does parent company change cascade correctly to child vendors?
   - Are parent company IDs stable UUIDs?

4. REP MANAGEMENT
   - Do all vendors with active reps have rep_group_id assigned?
   - Is rep contact structure consistent across vendors?
   - Are rep group changes logged?

5. EMPLOYEE USABILITY
   - Is there a help/how-to tab?
   - Are scoring categories explained to employees?
   - Does the search/filter work correctly?
   - Are edge cases handled gracefully (empty results, special chars)?
   - Is pagination or virtualization in place for 471 vendors?

6. INTEGRATION READINESS
   - Is the schema ready to receive Lights America data52 feed data?
   - Is there a clear separation between manual vendor data and imported data?
   - Is there a vendor_id → external_sku mapping table?
   - Is there a feed_source provenance column?
   - Can price effective dates be stored per vendor?

OUTPUT FORMAT:
## Vendor Intelligence Health Score: [X]/100
## Scoring Integrity Issues
## Data Preservation Risks
## Parent Company Logic Issues
## Rep Management Gaps
## Employee Usability Issues
## Integration Readiness Assessment
## Priority Remediation List
## Recommended Schema Changes (if any)
```
