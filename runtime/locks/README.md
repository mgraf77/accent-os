# Locks
> Active file/resource locks. Cooperative — sessions self-enforce.

## Usage

- To claim a resource: write `[lock-name].lock` per SCHEMA.md
- To release: delete the file
- To check: `ls runtime/locks/`

## Lock granularity

A lock typically corresponds to:
- A specific file: `prototype-edit.lock` covers `ui/accentos-shell-prototype.html`
- A specific task: `r-01.lock` covers everything that task needs
- A specific resource: `boot-smoke.lock` for the boot-smoke script while it runs

## Conflict policy

Sessions check locks before taking destructive action. The bus does NOT prevent writes — sessions self-enforce by reading lock files.

```
1. Session wants file F
2. Check runtime/locks/ for any .lock containing F
3. If lock exists and not expired: WAIT or abort
4. If lock expired: may reclaim (note in events log)
5. If no lock: acquire by writing own .lock file
```

## Why cooperative not enforced

- Phase 1 is files only — no daemon, no server
- The cost of a violation is low (Hub reviews and resolves)
- Enforcement would require infrastructure not justified yet

## Anti-patterns

- Do NOT hold locks across session boundaries (always release at handoff)
- Do NOT acquire a lock without a clear release plan
- Do NOT use locks for "I might need this later" — only for active work
