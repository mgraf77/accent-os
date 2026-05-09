# PROMPT PATTERNS V0
> AccentOS MVHB — Relay-Optimized Prompt Vocabulary
> Goal: minimize keystrokes, clipboard events, and cognitive load per relay hop.

---

## COMPACT PROMPTS
Short, high-signal prompts for known tasks. Always prefer over long descriptions.

```
continue
resume
next
go
push it
status
done
wrap
skip
skip + next
abort
revert last
```

**Pattern:** `[verb] [target?] [scope?]`
Examples:
- `fix the 400`
- `push index only`
- `commit + push`
- `check logs`
- `what broke`
- `finish the wip`

---

## QUEUE PROMPTS
Queue multiple tasks in one relay event. Prevents multiple copy-paste cycles.

**Format:**
```
1. [task]
2. [task]
3. [task]
do all. no stops.
```

**Compact variant:**
```
q: fix worker / push / status
```

**Rules:**
- Max 5 items per queue
- Implicit sequencing — execute top to bottom
- `no stops` = suppress confirmation gates
- If item fails, pause and surface the failure only

---

## RESUME PROMPTS
Re-establish session context after gap (sleep, switch, crash).

```
resume last
continue wip
finish [feature]
where were we
pick up from [step N]
```

**Minimal resume (Claude reads WIP automatically):**
```
resume
```

**Resume with override:**
```
resume — skip step 1, go to step 2
```

---

## STATUS PROMPTS
Query current state without triggering build action.

```
status
what's done
what's left
what's blocked
show wip
show build plan
show last commit
what failed
```

**Compact status with scope:**
```
status: worker
status: quote gen
status: db
```

---

## BRANCH PROMPTS
Git branch operations with minimal keystrokes.

```
new branch [name]
switch to [name]
merge to main
push branch
delete [name]
branch status
```

**Shorthand:**
```
branch: feature/worker-fix
push: worker-fix
merge: worker-fix → main
```

---

## RELAY PROMPTS
Used when human is the relay between two Claude instances (web ↔ iOS ↔ CLI).

**Relay-out (export from current session):**
```
relay out
package for relay
handoff block
```

**Relay-in (import to new session):**
```
relay in: [paste block]
context: [paste block]
pick up: [paste block]
```

**Relay-state-only (no action, just sync):**
```
relay state
sync state
read state
```

---

## GATE PROMPTS
Explicit approval/rejection gates. Single word. No ambiguity.

```
yes
no
skip
abort
force it
override
revert
```

**Gate with scope:**
```
yes: push
no: delete
skip: migration
abort: deploy
```

---

## FAILURE PROMPTS
Fast error recovery without long descriptions.

```
it failed
still broken
same error
new error: [paste]
rollback
undo last [N] steps
why
```

**Error relay (copy-paste the actual error, no description needed):**
```
err: [paste raw error text]
```
Claude infers context from WIP + recent commits + the error.

---

## PATTERN COMBOS (High-Value Shortcuts)

| Goal | Prompt |
|------|--------|
| Resume + no stops | `resume. no stops.` |
| Fix + push + status | `fix it, push, status` |
| Approve deploy | `yes: deploy` |
| Relay out for iOS | `relay out` |
| Investigate error | `err: [paste]` |
| Skip to next build item | `skip + next` |
| Session wrap | `wrap` |

---

## ANTI-PATTERNS (avoid these)
- Long English descriptions for known tasks
- Re-explaining context Claude already has in WIP
- Multi-paragraph error descriptions instead of raw paste
- Asking if Claude is ready
- Confirming each step manually when `no stops` works
