# bottleneck-finder — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 60/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | Passed |
| M2 | AccentOS named | 10 | Passed |
| M3 | Behavioral commitment | 0 | No "always X — never Y" shipped-behavior statement present |
| M4 | ≥5 "Never" anti-patterns | 10 | Passed |
| M5 | ≥5 trigger phrases | 10 | Passed |
| M6 | Concrete step outputs | 0 | Steps described actions without specifying output artifacts |
| M7 | Zero passive voice | 0 | Passive constructions present throughout Steps |
| M8 | No prose walls | 10 | Passed |
| M9 | Stack reference | 10 | Passed |
| M10 | No placeholders | 0 | Bracketed placeholder tokens present outside code fences |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added shipped-behavior commitment: "Always names the constraint before proposing exploits — never returns 'wait for Michael' as the only option" | M3 | No behavioral commitment existed; M3 required an explicit always/never pair |
| Added "Origin:" label | — | Stylistic provenance marker, no score impact |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Upgraded description with /home/user/accent-os/ path | M9 | Reinforced stack reference with concrete repo path |
| Added 7 anti-patterns — cycle-detection and fabricated-exploit entries added | M4 | Expanded and strengthened Never entries; cycle-detection rule targets a real failure mode |
| Added trigger phrases "leverage" and "priority analysis" | M5 | Brought trigger phrase inventory to 7 distinct AccentOS-vocabulary phrases |
| Added concrete output artifacts to every Step | M6 | Steps now name the file written and the structure of each output |
| Eliminated passive voice throughout Steps | M7 | Replaced all passive constructions with active imperative voice |
| Removed all [bracketed] placeholder tokens | M10 | Placeholder tokens outside code fences replaced with concrete examples or substitution notes |

**Cycle 1 — Ralph findings**
- M4 anti-patterns list present but fabricated-exploit entry lacked specificity on what "fabricated" means in AccentOS context
- M6 output artifacts present across all Steps

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Tightened fabricated-exploit anti-pattern with concrete example referencing BUILD_PLAN_CLAUDE.md | M4 | Addressed Ralph's finding that the entry was underspecified |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2.

**Cycle 3 — Ralph findings**
- none — confirmed 100/100

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- Shipped-behavior commitment ("Always names the constraint before proposing exploits — never returns 'wait for Michael' as the only option") → closed M3: no always/never pair existed before
- Passive voice elimination across all Steps → closed M7: imperative active voice throughout
- Removing [bracketed] placeholder tokens → closed M10: no placeholder tokens remain outside code fences
- Adding named output artifacts to every Step → closed M6: Steps now specify produced file and format

**Techniques that didn't move score:**
- "Origin:" label → stylistic only, no dimension maps to provenance markers

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line: stale counts removed | "AccentOS has 22 pending M-tasks and 10 open tracks" — hardcoded counts that drift as the build progresses | Replaced with "AccentOS's open BUILD_PLAN_CLAUDE.md tracks and BUILD_PLAN_MICHAEL.md M-tasks" — file-relative, always accurate | Hardcoded counts become false within weeks; file reference stays accurate permanently |
| Trigger phrase "priority analysis" removed | Near-paraphrase of "leverage analysis" — same intent, different word | Replaced with "which M-task is blocking everything" | New phrase is query-specific and distinct from all other triggers |
| Trigger phrase "where's the build stuck" extended | "where's the build stuck" covers blocked-progress but "why isn't the build moving" is a distinct angle | Added "/ why isn't the build moving" as alt form | Covers the "nothing seems to be progressing" phrasing vs "I know it's stuck, where?" |
| Step 1 fallback for missing files | `project-profiles.md` had no fallback — silent missing file would skip capability gap data | Added explicit fallback: "if missing, skip; log 'project-profiles.md not found — capability gap data unavailable'" | New Claude session would not know to continue without the file; now has explicit instruction |
| Step 6 BLOCK 1 and BLOCK 2 | BLOCK 1 had `[N]` and `[from WORK_IN_PROGRESS]`; BLOCK 2 said `[Step 4 table]` | BLOCK 1 now shows concrete state line; BLOCK 2 shows full table with M04/M05/M11 examples and cycle_warning example | Cold-read session sees exact output shape without needing to find Step 4 |

### Pass 2 — Ralph cold-read challenge

No additional changes needed. Step 2 dependency-graph rules have concrete examples (M04, M05, M06, M09 as API credential dependencies; M24-M29 as schema dependencies). Step 3 cycle detection rule is explicit. Step 5 `elevation_only: true` fallback handles the "no genuine exploit" path. All anti-patterns cite specific AccentOS failure modes.

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: removed stale hardcoded M-task and track counts; replaced with file-relative references that age gracefully
- Trigger phrases: "priority analysis" replaced with "which M-task is blocking everything" (distinct intent)
- Step 1: added explicit fallback for missing project-profiles.md
- Step 6 output: BLOCK 1 and BLOCK 2 now show concrete example values including cycle_warning example

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization

**L1 specificity check:**
Three anti-patterns were generic:
- AP1 ("Never suggest elevate before exploit") — no AccentOS artifact. Rewrote to include concrete example: "Recommending 'get the BC API credentials' (elevation) before checking if bc-business-review can run against Supabase deals only (exploit) skips the exploit step."
- AP2 ("Never treat low-leverage leaf tasks as valid build targets") — no artifact. Rewrote to include: "Building a doc-drift fix while M04 blocks 5 downstream tracks wastes the session on a leaf when leverage score of M04 = 5× higher."
- AP4 ("Never rank by [ ] count alone") — no artifact. Rewrote to include cascading-vs-direct contrast: "A task with 1 direct unblock that cascades to 4 more outranks a task with 3 direct unblocks and no cascades."
APs 3/5/6/7 already had specific AccentOS artifacts (elevation_only token, PROMPT_QUEUE.md path, BUILD_PLAN_CLAUDE.md reference, cycle_warning token).

**L2 commitment check:**
Commitment ("Always names the constraint with a leverage score before proposing exploits — never returns 'wait for Michael' as the sole output") has no vague words. "leverage score" is defined in Step 3 formula; "constraint" is defined throughout. Already tight.

**Adversarial check:**
Dimensions sampled: M5, Step 2 dependency graph
- M5 trigger "what's the bottleneck": could overlap with code-profiling context but description explicitly excludes "code-level performance bottlenecks." Routing is clear. No overlap gap.
- Step 2: no explicit dependencies marked in BUILD_PLAN_CLAUDE — multiple fallback heuristics provided (track numbers, blocked-on annotations, API credential patterns, schema dependency patterns). Robust — no failure path found.

**Cold-read check:**
All steps have output artifact specs. Step 1 has fallbacks for missing files. Step 3 cycle detection is explicit with DFS visited-set and cycle_warning log instruction. Step 5 has `elevation_only: true` fallback. Clean — no issues found.

**Cross-skill trigger audit:**
- "what should I work on next" — does not overlap with CLAUDE.md session-start auto-execute (that reads BUILD_PLAN_CLAUDE directly, not via skill trigger). Clean.
- "TOC analysis" / "leverage analysis" / "which M-task is blocking everything" — distinct to bottleneck-finder. Clean.

### Round 6 — Second pass

**L1 specificity check:**
All three AP rewrites from Round 5 verified: AP1 names M04/BC API credentials/bc-business-review/Supabase deals; AP2 names doc-drift fix/M04/5 downstream tracks; AP4 names leverage score and contrasts cascading vs direct unblock counts. All specific.

**L2 commitment check:**
Commitment unchanged — still tight. No rewrite needed.

**Adversarial check:**
Dimensions sampled: M4, M6
- M4 AP7 ("Never run leverage computation without cycle detection"): failure path — M04 → 6.3 → M04 cycle. Step 3 DFS visited-set explicitly handles this; cycle_warning logged and recursion truncated. Robust.
- M6 Step 2 adjacency list: format spec shown with schema descriptor `[blocker] → [unblocked task1, task2, ...]` — this is an internal working artifact feeding Step 3; not user-facing. Step 4 table and Step 5 CONSTRAINT block carry the user-facing output. No failure path found.

**Cold-read check:**
AP1/AP2/AP4 edits from Round 5 verified — no new passive voice or prose walls introduced. Step 6 BLOCK 3 cross-reference to Step 5 is explicit. All anti-patterns now have concrete AccentOS examples. Clean.

**Cross-skill trigger audit:**
No new triggers added in Round 5. No overlaps found.

### Final: 3 sub-dimension edits applied across 2 rounds
Techniques that moved quality: L1-specificity rewrites on AP1/AP2/AP4 (added BC API credentials, M04, doc-drift fix, leverage score contrast as concrete examples)
Techniques that didn't: L2 check — commitment already tight; adversarial checks on M5/Step2/M4/M6 — no failure paths found; cold-read check — no issues found
