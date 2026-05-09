# Branches
> Live branch state records. Sister to `docs/implementation/ACCENTOS_ACTIVE_BRANCH_REGISTRY.md`.

## Distinction

- `docs/implementation/ACTIVE_BRANCH_REGISTRY.md` — POLICY (what branches should exist)
- `runtime/branches/` — STATE (what each branch is doing right now)

## Usage

- One file per branch: `[sanitized-branch-name].md`
- Slashes replaced with `--` in filename
- Updated at branch state transitions
- Written by sessions, not by automation

## Filename convention

```
claude/implement-claude-design-ui-eFn9b
  ↓
claude--implement-claude-design-ui-eFn9b.md
```

## Lifecycle

```
planned → active → paused → merged → retired
```

Retired branches keep their files (historical record). New branches with the same name reuse the file.
