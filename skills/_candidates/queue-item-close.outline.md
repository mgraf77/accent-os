# Skill outline (DRAFT — not installed): `queue-item-close`

> Status: **candidate**. Not in `_index.md`. Not auto-invoked. Promotion requires Michael review.
> Source pattern: closing items in `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `PROMPT_QUEUE.md`, `WORK_IN_PROGRESS.md`, `SAFE_OVERNIGHT_QUEUE.md` follows the same shape and is currently brute-forced each time.

## One-line summary
Close a queued item correctly across all linked ledgers in one motion — never leave half-closed state.

## Trigger phrases
- "mark X done"
- "close M22"
- "tick off 5.13"
- "queue item done"

## When to use
- A `[ ] M##` or `[ ] T##` item from any AccentOS plan ledger has just been completed.
- A `WORK_IN_PROGRESS.md` task is finishing.
- A `PROMPT_QUEUE.md` entry was acted on.

## When NOT to use
- Item only partially done — leave open.
- Item turns out to be wrong / superseded — supersede via `decision-log` skill instead.

## Companions
- `build-plan-status` — recomputes counts after the close.
- `prompt-queue` — when item came from PROMPT_QUEUE.
- `verified-commit` — close-out commit must follow that cycle.
- `decision-log` — if closing reveals a meaningful architectural decision.

## Procedure (draft)

1. **Locate** the item across files. Items reference each other (e.g., M22 unlocks Track 5.3 in BUILD_PLAN_CLAUDE).
2. **Verify completion**:
   - For `M##` (Michael items) — verify the *Then* line ack from Michael, not just the artifact.
   - For Claude `[ ]` items — verify the BUILD_PLAN unlock condition is true (e.g., schema run shows expected rows).
3. **Update all touched ledgers in one commit**:
   - Flip `[ ]` → `[x]`.
   - Append a one-line note (date + commit SHA) where the schema supports it.
   - If the item's *Unlocks* points to other items, they remain `[ ]` — never auto-close downstream.
4. **WIP state**:
   - Overwrite `WORK_IN_PROGRESS.md` with either the next discrete step or `clean`.
5. **Status block** printed last, identical format to `verified-commit`.

## Edge cases
- **Partially done** — split into a child item rather than tick.
- **Out-of-order completion** — fine; ledger ordering is a recommendation, not a constraint.
- **Cross-doc drift** — if the item is `[x]` in one file and `[ ]` in another, surface it; don't silently fix (`doc-drift` handles drift fixes).

## Smallest end-to-end test
Flip a synthetic `[ ] T99` test entry → all linked ledgers show `[x]`, status block shipped, no other diffs.

## Promotion checklist
- [ ] Michael review.
- [ ] Confirm overlap vs `build-plan-status` (this skill is the *write* path; `build-plan-status` is the *sync* path).
- [ ] Draft full SKILL.md.
- [ ] Add registry entry.
- [ ] Smoke test on a real ticked item.
