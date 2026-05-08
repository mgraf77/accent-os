# AI Patching Rules

Rules for maintaining safe AI-assisted development in AccentOS.

---

## Patch Boundary Marker Rules

### Required marker format

HTML sections:
```html
<!-- START: AccentOS [Module Name] Module -->
...content...
<!-- END: AccentOS [Module Name] Module -->
```

JS sections:
```js
// START: AccentOS [Module Name] Module
...content...
// END: AccentOS [Module Name] Module
```

### Naming conventions

Markers must match exactly between START and END:
- `AccentOS Vendor Intelligence Module`
- `AccentOS Core Shell`
- `AccentOS Navigation`
- `AccentOS Utility Functions`

**Flag as High if:**
- Section >100KB has no START/END markers
- A START marker exists without matching END
- An END marker exists without matching START
- START and END names don't match exactly

**Flag as Medium if:**
- Section is 50–100KB with no markers
- Markers wrap very large blocks (>500 lines) without sub-segmentation

---

## AI Patch Scope Rules

**Flag as High if:**
- A Claude/Codex patch modifies code in multiple unrelated sections
- A patch removes existing functionality not listed in the task spec
- A patch introduces a new dependency not approved in the task spec
- A patch changes function signatures that other modules call

**Flag as Medium if:**
- A patch adds TODOs without corresponding GitHub issues
- A patch adds `// TODO: fix later` style comments at >3% density
- A comment says "Claude added this" or "AI-generated" without verification note

---

## Patch Verification Rules

After every substantial AI patch:

1. Verify module contracts still valid (`init`, `destroy`)
2. Verify no new direct Supabase write patterns introduced
3. Verify no global state leak introduced
4. Verify patch markers are intact
5. Verify no unused imports or dead code left
6. Verify changelog entry exists

---

## TODO/FIXME Management Rules

**Flag as High if:**
- TODO/FIXME count increases by >10 in a single session without corresponding issues
- A TODO references a known vulnerability or security gap

**Flag as Medium if:**
- TODOs are >2% of total non-blank, non-comment lines
- TODO exists for >30 days without resolution (use git blame to check)

---

## AI Maintainability Score Factors

Score deductions:

| Factor | Deduction |
|---|---|
| Each unmatched marker pair | -5 points |
| Each 100KB+ section without markers | -8 points |
| Each TODO/FIXME without issue | -1 point |
| Global mutable state reference | -10 points |
| Direct Supabase write outside gateway | -15 points |
| Worker security gap | -15 points |
| Missing module init/destroy | -10 points |

Maximum score: 100 (deductions cumulative, floor at 0).

---

## Safe Patching Checklist

Before any major AI patch:

- [ ] Target section has START/END markers
- [ ] Task spec is clearly bounded to that section
- [ ] No cross-section dependencies without explicit documentation
- [ ] Rollback strategy exists (git branch or checkpoint)
- [ ] Changelog entry planned
- [ ] Reviewer knows which other sections are affected

---

## Codex-Specific Patch Rules

When delegating to Codex:

- Task must be scoped to specific files and line ranges
- Codex must be instructed NOT to refactor outside the target
- Codex output must be reviewed by Claude before merging
- Codex should not be given production credentials
- Codex generated patches must be tested in dev/staging before production
