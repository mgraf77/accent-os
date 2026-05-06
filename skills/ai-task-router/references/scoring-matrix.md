# ai-task-router — Scoring Matrix

> Dimension weights per task type + composite score formula + threshold rules.
> Loaded at session start (hot path). ~2K tokens.

---

## Composite score formula

```
composite = Σ(score[dim] × weight[task_type][dim]) / Σ(weight[task_type])
```

Scores from `tool-registry.md` (0–10). Weights below (0–5 scale; higher = more important).
Result: 0–10 composite. Used directly for gap calculation.

---

## Weight table

Columns: AB=Ability, SP=Speed, AC=Accuracy, TC=Token Cost, AX=Action, CX=Context, FR=Freshness, CR=Creativity

| Task type | AB | SP | AC | TC | AX | CX | FR | CR |
|---|---|---|---|---|---|---|---|---|
| code-build | 5 | 2 | 5 | 2 | 5 | 4 | 1 | 2 |
| code-review | 5 | 2 | 5 | 2 | 3 | 4 | 1 | 2 |
| debug | 5 | 3 | 5 | 2 | 4 | 4 | 1 | 2 |
| brainstorm | 4 | 3 | 2 | 2 | 1 | 3 | 2 | 5 |
| cross-check | 4 | 3 | 4 | 2 | 1 | 3 | 3 | 4 |
| research | 4 | 3 | 4 | 3 | 1 | 3 | 5 | 2 |
| quick-lookup | 3 | 5 | 4 | 4 | 1 | 2 | 4 | 1 |
| design-visual | 5 | 2 | 3 | 2 | 4 | 2 | 1 | 5 |
| doc-write | 4 | 2 | 4 | 2 | 2 | 3 | 2 | 5 |
| data-analysis | 5 | 2 | 5 | 2 | 5 | 4 | 2 | 1 |
| automation | 5 | 3 | 4 | 3 | 5 | 2 | 3 | 1 |
| long-context | 3 | 2 | 4 | 2 | 3 | 5 | 2 | 2 |
| real-time-data | 4 | 4 | 4 | 3 | 1 | 2 | 5 | 1 |
| image-gen | 5 | 2 | 3 | 2 | 3 | 1 | 2 | 5 |
| planning | 4 | 2 | 4 | 2 | 3 | 4 | 2 | 4 |

---

## AccentOS context bonus rules

Applied when `ctx_bonus = true` (task references AccentOS project artifacts):

```
claude_code.ability  += 1.5   (capped at 10)
claude_code.context  += 2.0   (capped at 10)
```

**`ctx_bonus = true` conditions (any one fires it):**
- Message references a file path inside `/home/user/accent-os/`
- Message references: Supabase, hsyjcrrazrzqngwkqsqa, vendor_scores, vendor_overrides, vendor scoring, BUILD_PLAN_CLAUDE, M-task, BigCommerce, store-cwqiwcjxes, Feedenomics, Klaviyo
- Current session has active tool calls against AccentOS files
- Task type is `data-analysis` + session has Supabase queries in-flight

**`ctx_bonus = false` conditions (any one overrides true):**
- Task is purely conceptual, creative, or general research with no AccentOS reference
- Michael explicitly asks "clean slate" / "ask somewhere else" / "no context needed"
- Task type is `image-gen`, `real-time-data`, or `automation` (context rarely matters)

---

## Routing thresholds

| Gap (winner vs Claude Code) | Token cost delta | Action |
|---|---|---|
| ≤0 | any | Silent — Claude Code wins |
| 0–0.25 | any | Silent — gap too small to justify switching |
| 0.25–0.50 | winner TC score ≤3 lower than CC | Suppress — cost not worth it |
| 0.25–0.50 | winner TC score ≥ CC | Surface low-priority nudge |
| 0.50+ | winner TC score ≤3 lower than CC | Surface with cost warning |
| 0.50+ | winner TC score ≥ CC | Surface strong nudge |
| active mode | any | Always surface full table |

**Gap formula:**
```
gap = (winner_composite - claude_composite) / claude_composite
```

**Switching cost multiplier:** add to Claude Code's effective score before gap calc:
- `+0.3` if Claude Code already has the relevant file open this session
- `+0.2` if the task is a continuation of a Claude Code task from the last 5 minutes
- `+0.1` if the recommended tool requires account setup not yet confirmed

These multipliers reflect real switching friction, not capability. They make routing more conservative when you'd have to context-switch mid-flow.

---

## Task-type blending (multi-type tasks)

When a task has both a primary and secondary type, blend weights:

```
blended_weight[dim] = 0.7 × weight[primary][dim] + 0.3 × weight[secondary][dim]
```

Example: "brainstorm then write the doc" → primary=brainstorm, secondary=doc-write
Blended weight for AB: 0.7×4 + 0.3×4 = 4.0
Blended weight for CR: 0.7×5 + 0.3×5 = 5.0
Blended weight for AX: 0.7×1 + 0.3×2 = 1.3

Keep blending to 2 types max. If 3+ types present, pick the dominant one only.

---

## Score interpretation guide

| Range | Meaning |
|---|---|
| 9.5–10 | Best-in-class — this is the tool's core competency |
| 8–9.4 | Strong — consistently good, minor weaknesses |
| 6–7.9 | Adequate — works, but not optimal |
| 4–5.9 | Marginal — possible but expect friction |
| 2–3.9 | Weak — capable only with extra prompting |
| 0–1.9 | Cannot do this — route away always |

---

## Dimension calibration notes

**Ability (AB):** Scores based on observed Claude-family benchmark parity and community-reported cross-model comparisons as of May 2026. Revisit quarterly.

**Speed (SP):** Relative latency at typical workload. Claude Code = 7 (seconds per long response). Gemini Flash = 9–10 (fastest API). ChatGPT = 7–8. These shift with infrastructure load.

**Token cost (TC):** Scale anchored to free tier = 10, high-cost API = 1–3. Subscription tools score 6–7 (fixed cost, marginal cost ≈ 0 per use).

**Action (AX):** Claude Code = 10 because it has bash + file edit + git + MCP servers. All browser-based tools score ≤2 on this dimension unless they have their own automation APIs.

**Context (CX):** Gemini Pro = 9–10 (1M token window). Claude Code = 8 (200K + project files). Browser tools = 6–8 (200K but no persistent file memory).

**Freshness (FR):** Perplexity = 10 (live citations). Gemini = 9 (Google Search). ChatGPT = 8 (Bing search tool). Claude Code = 2–4 (training cutoff, WebSearch tool available but not primary).

**Creativity (CR):** ChatGPT 4o and Claude.ai score highest here — strongest for divergent ideation. Codex scores lowest (optimized for precision, not novelty).
