# vendor-risk-register — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 60/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment block present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Steps described actions but produced no literal output examples |
| M7 | Zero passive voice | 0 | "Do not proceed" missing after NULL-total abort; "do not exist" used passive construction |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | `[window]` unfilled in severity-window description |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "Do not proceed" added as explicit imperative after NULL-total abort condition | M7 | NULL-total abort block ended with a passive conditional; adding "Do not proceed" makes the instruction an active command |
| "do not exist" → "are missing" in vendor-record validation step | M7 | "do not exist" is passive-adjacent and formal-awkward; "are missing" is direct and active |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| `[window]` unfilled placeholder in severity-window field replaced with "rolling 90-day window" as the concrete default | M10 | Bracket syntax in a field description is unfilled template — M10 requires zero such instances anywhere in the file |
| 6th anti-pattern added: never use the composite score alone to define severity when the individual-factor breakdown is available | M4 | Only 5 anti-patterns at baseline; 6th closes a real analytical gap — composite scores can mask a single catastrophic factor |
| RUN PARAMETERS echo block added to Step 1: outputs vendor_id, lookback window, severity thresholds, and run timestamp | M6 | M6 requires literal output blocks at step boundaries; Step 1 had no output, only a list of inputs to gather |
| Behavioral commitment block added: "Always surface the individual risk factors alongside the composite score — never report composite alone" | M3 | M3 was entirely absent; commitment is tied directly to the 6th anti-pattern for reinforcement |

**Cycle 1 — Ralph findings**
- M10 clean — `[window]` resolved; no other brackets found
- M6 confirmed: RUN PARAMETERS block has concrete named fields (vendor_id, lookback, thresholds, timestamp)
- M3 commitment is specific to the skill's analytical output, not boilerplate
- Suggested: ensure 6th anti-pattern uses "Never" imperative, not "Do not"

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 6th anti-pattern re-phrased from "Do not use" to "Never use composite alone" | M4 | Ralph flagged casing inconsistency with existing "Never" imperatives in the anti-pattern list |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- "Do not proceed" imperative after NULL-total abort → closed M7: passive conditional became an active command; M7 requires every instruction to be an active imperative
- `[window]` → "rolling 90-day window" → closed M10: replacing bracket with a concrete default removes template syntax without losing meaning
- RUN PARAMETERS echo block at Step 1 → closed M6: naming actual output fields (vendor_id, lookback, thresholds, timestamp) satisfies the "concrete step output" requirement
- Behavioral commitment anchored to composite-vs-factor distinction → closed M3: commitment is actionable because it references a specific output format decision

**Techniques that didn't move score:**
- "do not exist" → "are missing" → stylistic M7 tightening; M7 was already failing for the bigger NULL-abort issue, so this change contributed to the fix but wasn't the sole driver

**Stuck dimensions:** none
