# PR Plan Template

Use when planning a patch branch to remediate one or more Sentinel findings.

---

## Template

```markdown
# Patch Plan — [FINDING-IDs] — [Brief Title]

## Summary

Addresses findings from AccentOS Sentinel Audit ([DATE]):
- [FINDING-ID]: [One-line description]
- [FINDING-ID]: [One-line description]

**Risk Level:** [Critical / High / Medium]
**Estimated Effort:** [Hours / Days]
**Reviewer Required:** [Yes / No — specify who]
**Deploy Hold Required:** [Yes — hold deploys until merged / No]

## Patch Scope

Only these files will be modified:
- `[file path]` — [what changes]

These files will NOT be modified:
- [any files that might seem related but are out of scope]

## Patch Steps

### Step 1: [Title]
**File:** `[path]`
**Change:** [Specific change]
**Why:** [Reason]

### Step 2: [Title]
...

## Rollback Plan

If this patch causes a regression:
1. [Step 1 — e.g., git revert SHA]
2. [Step 2 — e.g., redeploy previous Worker version]
3. [Step 3 — e.g., confirm previous behavior restored]

## Changelog Entry

```
### [DATE] — Remediation: [FINDING-IDs]
- Fixed [FINDING-ID]: [what was fixed]
- Fixed [FINDING-ID]: [what was fixed]
- Worker patched for: origin validation, API key from env
```

## Verification Checklist

- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Smoke test 1]
- [ ] [Smoke test 2]
- [ ] No regression in [related feature]

## Branch Name

`fix/sentinel-[FINDING-ID-slugs]`

Example: `fix/sentinel-sec-001-worker-api-key`
```
