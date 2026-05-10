# Long-Running Session Pattern
> How AccentOS bounded sessions operate over multiple hours with reduced relay burden.

---

## The Relay Problem

Michael is currently the relay runtime. Each session ends, Michael reads the output, decides what to do, and crafts the next prompt. This is:
- Fine for single-step tasks
- Expensive for multi-hour sequential work
- A bottleneck when sessions run overnight or while Michael is unavailable

The goal of this pattern is **not** to eliminate Michael from the loop — it's to reduce the relay burden from "craft a new prompt + reconstruct context" to "read the NEXT PROMPT block + paste it."

---

## Multi-Hour Bounded Session Model

A long-running session is modeled as a chain of bounded sub-sessions, each one generating the next.

```
Session 0 (kickoff)
  → declares the chain scope
  → builds packet 1
  → produces: commit + NEXT PROMPT for packet 2

Packet 2
  → reads WORK_IN_PROGRESS.md to confirm packet 1 completed
  → executes its declared scope
  → produces: commit + NEXT PROMPT for packet 3

Packet N
  → executes final scope
  → produces: commit + CHAIN COMPLETE summary
```

Each step is bounded. No step assumes it has unlimited continuation time. Each step writes a checkpoint before it would run out of session context.

---

## Reduced Relay Burden

### What Michael needs to do between packets

Minimum:
1. Confirm the previous packet's commit landed (`git log --oneline -3`)
2. Copy the NEXT PROMPT block
3. Paste into a new Claude Code session

That's it. No context reconstruction. No prompt crafting. No reading session output in detail (unless something looks wrong).

### What makes this possible

- Every packet writes WORK_IN_PROGRESS.md at end of every discrete step
- Every packet ends with a complete NEXT PROMPT block
- Every NEXT PROMPT block is self-contained (no assumed context)
- The NEXT PROMPT block includes the branch name, last commit, scope, and forbidden zones

---

## Bounded Continuation Chains

A continuation chain is a sequence of packets that accomplish a goal too large for one session.

**Properties of a valid chain:**

1. **Each packet is independently rollback-safe.** Reverting packet N does not require reverting packet N-1.
2. **Each packet produces a verifiable output.** The next packet can confirm packet N-1 succeeded by reading committed files, not by trusting session output.
3. **The chain has a declared end condition.** It's not open-ended. The last packet knows it's the last.
4. **No packet blocks on state from a non-committed prior step.** If packet 2 needs a file from packet 1, packet 1 must commit it before the chain continues.

**Properties of an invalid chain:**

- Packet 2 references in-memory state from packet 1 that was never committed
- The chain has no declared end condition
- Any packet modifies something another packet also modifies (concurrent writes)
- A packet silently skips its verification step

---

## Orchestration Compression

Traditional relay: Michael writes each prompt from scratch.

Compressed relay: packets self-generate continuations. Michael's cognitive load = reading one NEXT PROMPT block.

Further compression: for known mechanical task chains (e.g. "extract all remaining inline modules from index.html one by one"), the entire chain of NEXT PROMPT blocks can be pre-generated in one session. Michael just queues them.

**When to use orchestration compression:**
- The task chain is fully deterministic (no branching, no decisions required)
- Each step has the same forbidden zones and verification method
- The chain is at least 3 steps

**When NOT to use orchestration compression:**
- Any step might require a Michael decision (escalation)
- Steps have different forbidden zones
- The output of step N changes the scope of step N+1 in a way that can't be predicted

---

## Clean-Freeze Acquisition

A clean freeze is a point where:
1. All work in progress is committed (or reverted)
2. WORK_IN_PROGRESS.md reflects true state
3. NEXT PROMPT block exists and is valid
4. The repo is push-safe (no broken refs, clean working tree)

**Acquiring a clean freeze mid-session:**

If a session must stop before completing its declared scope:
1. Commit all work so far with a clear WIP commit message
2. Overwrite WORK_IN_PROGRESS.md: mark what's done, what's incomplete, what's next
3. Write the NEXT PROMPT block to WORK_IN_PROGRESS.md (not just terminal output)
4. Push
5. The freeze is complete

The repo is now in a state where a new session can continue correctly with zero verbal context from the current session.

---

## Recovery After Session Reset

When a session ends unexpectedly (context limit, tab close, network drop):

**Recovery protocol:**
1. Open new session
2. `cat WORK_IN_PROGRESS.md` — this is the ground truth
3. `git log --oneline -5` — confirm last commit
4. `git status` — confirm clean working tree
5. If WIP.md has a NEXT PROMPT block, use it
6. If WIP.md is stale (doesn't match last commit), read the commit messages to reconstruct state

**What breaks recovery:**
- WIP.md not updated before freeze (shows old state)
- Uncommitted changes that were assumed to be committed
- NEXT PROMPT block that requires context not in WIP.md

This is why WIP.md is overwritten after **every discrete step**, not just at session end.

---

## Session Self-Awareness Concepts

A session is "self-aware" if it knows:
1. What packet it is running (its identity)
2. What it has completed so far (its progress)
3. What it must not do (its constraints)
4. When to stop (its stop conditions)
5. How to hand off (its continuation generation)

Self-awareness is not intelligence or autonomy. It is structured discipline: every session reads the same state files at start, operates within declared bounds, and writes the same state files at end.

**The self-awareness checklist (run at session start):**
- [ ] Read WORK_IN_PROGRESS.md
- [ ] Read BUILD_PLAN_CLAUDE.md — find first unblocked `[ ]` item
- [ ] Read BUILD_INTELLIGENCE.md — apply relevant lessons
- [ ] Confirm branch
- [ ] Confirm git status clean
- [ ] Declare packet scope for this session

**The self-awareness checklist (run at session end):**
- [ ] All steps committed
- [ ] WORK_IN_PROGRESS.md updated
- [ ] NEXT PROMPT block generated
- [ ] Pushed to remote
- [ ] Clean working tree confirmed

---

## Load-Shedding Pattern

When a session's context is filling and it won't complete its declared scope:

1. **Stop adding new work.** Don't try to squeeze in more.
2. **Commit what's done.** Every committed step is permanent.
3. **Update WIP.md** to reflect exactly what's done and what's not.
4. **Write the NEXT PROMPT** for the remaining scope.
5. **Push.**

The remaining scope goes to the next packet as a first-class task, not as "pick up where we left off." The next packet gets the same quality of scoping as the current one did.

This is why packet sizes are bounded: a packet that tries to do too much will load-shed on the wrong steps. Better to scope tightly and hand off cleanly.
