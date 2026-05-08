# Documentation Drift Review Prompt

---

## Prompt

```
ACCENTOS DOCUMENTATION DRIFT AUDIT

You are auditing AccentOS for documentation gaps and drift between code and docs.

REPO CONTEXT:
- README.md
- MASTER.md (architecture decisions)
- SESSION_LOG.md (recent changes)
- BUILD_PLAN_CLAUDE.md (task history)
- BUILD_INTELLIGENCE.md (lessons learned)
- sql/*.sql (migration docs)
- Each module should have an employee-facing help/how-to tab

AUDIT TASKS:

1. MODULE DOCUMENTATION
   For each active module, verify:
   - Does the module have an employee-facing help/how-to section?
   - Is the help content current with the actual feature behavior?
   - Are known limitations documented for employees?
   - Is there guidance on common workflows?

   Active modules to check:
   - Vendor Intelligence
   - [OTHER MODULES FOUND IN index.html]

2. ARCHITECTURE DOCS
   - Does MASTER.md reflect the current module structure?
   - Are all environment variables documented?
   - Are all Supabase tables/migrations listed with purpose?
   - Are all Worker endpoints documented?
   - Are all external integrations documented?

3. MIGRATION DOCS
   - Does each migration file have a comment block explaining purpose?
   - Are rollback instructions available for destructive migrations?
   - Is the migration sequence documented?

4. CHANGELOG ACCURACY
   - Does SESSION_LOG.md reflect recent commits?
   - Are architecture decisions captured in MASTER.md?
   - Do recent commits have meaningful messages (not just "wip" or "fix")?

5. INTEGRATION DOCS
   - Is Lights America data52 integration documented (even as planned)?
   - Are vendor price book feeds documented?
   - Are field mappings documented?
   - Is the import process documented?

6. ENVIRONMENT VARIABLE DOCS
   - Are all required environment variables listed somewhere?
   - Is ANTHROPIC_API_KEY documented (Wrangler secret)?
   - Is the Supabase connection documented?

OUTPUT FORMAT:
## Documentation Health Score: [X]/100
## Missing Employee Help Tabs (Critical/High)
## Stale Architecture Docs (Medium)
## Missing Migration Docs (Medium)
## Undocumented Environment Variables (High)
## Missing Integration Docs (Medium)
## Specific Docs to Create (with templates)
## Specific Docs to Update (with specific gaps)
```
