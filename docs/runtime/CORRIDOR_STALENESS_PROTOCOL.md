# CORRIDOR STALENESS PROTOCOL
> AccentOS — Commit-counted decay, invalidation triggers, promotion rules, revalidation discipline.
> Applies to all corridor docs: LIVE_CORRIDOR_V2.md, POST_REGISTER_CORRIDORS.md, any future corridor.
> Last updated: 2026-05-10

---

## FRESHNESS MODEL

A corridor doc is calibrated to a HEAD commit at the moment it was written or revalidated.
Every commit that touches `index.html` after calibration ages the corridor by 1.

**Age = number of index.html-touching commits since corridor was last calibrated.**

| Age | State | Line numbers | Action before executing |
|-----|-------|-------------|------------------------|
| 0 | FRESH | Exact | Execute directly — no checks needed |
| 1–2 | AGED | Shifted | Run entry gate command (30 sec) — anchors still valid |
| 3–4 | STALE | Possibly drifted | Run full revalidation procedure (5 min) |
| 5+ | EXPIRED | Unreliable | Do not execute — re-calibrate from HEAD |

**Check corridor age (30 sec):**
```bash
git log --oneline -- index.html | head -10
```
Count commits above the calibration hash listed in the corridor doc header. That count is the age.

---

## PRE-EXECUTION STALE CHECK

Run before executing any corridor or corridor block. Takes 30 seconds.

```bash
# 1. Age check:
git log --oneline -- index.html | head -10
# Find the calibration commit hash from the corridor doc header.
# Count commits above it = age. Age 5+: EXPIRED — stop.

# 2. Entry gate (from the specific corridor block):
# (paste the entry gate command from the corridor you're about to run)

# 3. Output file check — for each planned new file in the corridor:
ls js/[planned-output].js 2>/dev/null
# Must NOT exist. If it exists: that zone was already extracted.
```

All three pass → safe to execute.
Any single failure → re-calibrate or investigate before proceeding.

---

## IMMEDIATE INVALIDATION TRIGGERS

These expire a corridor regardless of age. Check each before executing any packet.

| Trigger | Detection command | Result |
|---------|-------------------|--------|
| Output file already exists | `ls js/[planned-file].js` | EXPIRED — zone extracted; skip this packet |
| Zone anchor function missing | `grep -c "^function [anchor]" index.html` → 0 | EXPIRED — zone extracted or removed |
| New function added to zone since calibration | `git diff [cal-hash] -- index.html \| grep "^+function"` in zone range | STALE — new symbol would be missed |
| index.html line count differs >5% from expected | `wc -l index.html` >> expected value | STRUCTURAL CHANGE — stop, investigate |
| Merge conflict markers present | `grep -c "^<<<<<<<" index.html` → >0 | NEVER EXECUTE in conflict state |
| Another open decomp branch touches same zone | `git branch -a \| grep decomp` | FREEZE until other branch merges or closes |

---

## INVALIDATION BY CORRIDOR

Quick reference — check these first before executing each corridor.

| Corridor | Immediate invalidation if... |
|----------|------------------------------|
| Register Substrate | `ls css/accent-os.css js/utils.js js/sb-core.js` → any exists |
| R1 Cohort-1 | `ls js/auth.js js/vendor-data.js` → any exists |
| R2 Cohort-2 | `ls js/coop.js js/quotes.js js/pipeline.js` → any exists |
| P4b VD-UI CRAWL | `ls js/vendor-data.js` and `grep -c "^let vFilter=" js/vendor-data.js` → >0 |
| R3 Cohort-3 | `ls js/knowledge-engine.js js/dashboard.js js/mgmt.js` → any exists |

---

## REVALIDATION PROCEDURE

When a corridor is STALE (age 3–4), run this before executing. Takes 5 minutes.

**Step 1 — Run all anchor commands for each packet in the corridor:**
```bash
# Example for R1 Cohort-1:
grep -n "^const ROLES" index.html                              # P3 zone start
grep -n "^let sbCol=false" index.html                         # P3 zone end boundary
grep -n "^const PRODUCT_TAXONOMY" index.html                   # P4a zone A start
grep -n "^let COOP_FUNDS" index.html                           # P4a zone A end boundary
grep -n "^async function sbLoadVendorOverrides" index.html     # P4a zone B start
grep -n "^let vFilter=" index.html                             # P4a zone B end boundary
```
→ If anchor missing but output file doesn't exist: something has moved — investigate before proceeding.
→ If anchor present: corridor still valid. Line numbers in the doc may be stale but anchors work.

**Step 2 — Confirm wc -l index.html is within range:**
Compare current line count to the expected entry count from the corridor doc. Significant deviation (>50 lines) means another extraction has run — check which zone moved.

**Step 3 — Update the corridor doc header:**
```
> Age: [N] commits since calibration → reset to 0
> Calibrated: [today's date] · commit [current HEAD hash]
> State: FRESH
```

**Step 4 — Proceed.** Revalidation complete.

**Revalidation is NOT re-writing.** It is running 5–8 grep commands and updating a header line. A corridor that passes revalidation is as good as freshly calibrated. Only EXPIRED corridors (age 5+) require full re-calibration.

---

## PROMOTION RULES: SKETCH → LIVE

A SKETCH corridor becomes the LIVE corridor when all conditions below pass.

| Requirement | Verification |
|-------------|-------------|
| Current LIVE corridor fully complete | LIVE corridor exit gate passes (all `→ 0` checks pass) |
| All predecessor packets merged to main | `git log main --oneline \| grep "decomp("` shows expected commits |
| SKETCH entry gate passes | Run the entry gate command from the SKETCH corridor block |
| No open decomp branches on same zones | `git branch -a \| grep decomp` → no overlapping zone work |
| SKETCH corridor age ≤ 3 | If age > 3, revalidate first |

**Promotion is immediate** when conditions pass. No approval ceremony needed.

**Promotion action:**
1. Update LIVE_CORRIDOR_V2.md: move promoted corridor from SKETCH to LIVE section
2. Sketch the next corridor as the new SKETCH (or mark SKETCH as "TBD — calibrate after LIVE exits")
3. Commit: `docs(corridors): promote R[N] to LIVE, sketch R[N+1]`

---

## CORRIDOR DECAY SCHEDULE

After every commit that touches `index.html`:

1. **Check all active corridors for immediate invalidation** (output file check + anchor check for the committed zone)
2. **Increment age by 1** for all corridors that did NOT have their zone committed
3. **If any corridor hits age 5**: mark EXPIRED in its header — do not execute without re-calibration
4. **If LIVE corridor expires**: re-calibrate before starting the next session

**Document decay in the corridor doc header:**
```markdown
> Age: [N] commits since calibration
> State: FRESH / AGED / STALE / EXPIRED
```

**One-command age check after any index.html commit:**
```bash
git log --oneline -- index.html | head -5
# First line is latest commit. Find each corridor's calibration hash.
# Distance from top = age for that corridor.
```

---

## HANDOFF COMPRESSION RULES

A corridor block is handoff-compressed when an operator can:
1. Read the corridor block **once**
2. Execute all steps **without opening any other document**
3. **Complete the full corridor in 45–90 min**
4. Exit with a verified, merged, smoke-tested state

**A corridor block fails handoff compression if it requires:**
- Cross-referencing another doc mid-execution
- Judgment calls not covered by an explicit stop condition
- Verification steps whose expected output is ambiguous
- More than 3 packets (CAUTION mode maximum)
- Any step that takes >20 min without a checkpointed verification

**Handoff compression means the doc IS the brief.** An operator or AI session reads the corridor block, executes top-to-bottom, and completes without needing context beyond what's on the page.

**VD-UI (P4b) is never handoff-compressed.** It is a 45–60 min solo CRAWL session that requires a dedicated operator. It is not a corridor — it is a single heavily-supervised packet.

---

## DETECTING STALE LINE NUMBERS

Corridor docs reference original line numbers as orientation, but execute via anchor commands (grep-based locators). If a corridor's line numbers look wrong:

```bash
# Check where the anchor actually is now:
grep -n "^function [zone-start-anchor]" index.html
# Compare to the line number in the corridor doc.
# Difference = line shift from prior extractions.
```

Line shift is expected and benign. Anchor commands always find the right zone regardless of shift. A corridor with stale line numbers but valid anchors is **AGED**, not STALE. Execute using the anchor commands; ignore the shifted line numbers.

---

## CORRIDOR STATE HEADER FORMAT

Every corridor doc must have a header of this form:

```markdown
> Calibrated: [YYYY-MM-DD] · commit [short-hash]
> Age: [N] commits since calibration
> State: FRESH / AGED / STALE / EXPIRED
```

Update this header:
- After every revalidation (reset age to 0, update date + hash)
- After any index.html commit (increment age)
- When promoting a corridor (update state + date)

---

## ESCALATION: EXPIRED CORRIDOR RECOVERY

If a corridor reaches EXPIRED state before it has been executed:

1. **Do not execute the expired corridor.**
2. Check git log to understand what moved the zone:
   ```bash
   git log --oneline -- index.html | head -10
   git show [recent-commit-hash] --stat
   ```
3. If the zone being extracted was not modified by the intervening commits: the corridor's logic is still sound, only line numbers shifted. Run revalidation procedure — corridor is recoverable.
4. If the zone being extracted WAS modified by an intervening commit (hotfix, feature): re-calibrate the corridor from HEAD. The intervening change must be incorporated into the extraction.
5. Never attempt to execute an expired corridor without completing recovery steps first.
