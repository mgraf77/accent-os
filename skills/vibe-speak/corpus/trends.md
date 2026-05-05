# vibe-speak — trends

> Temporal patterns in Michael's prompt corpus. Per-week and per-month rollups: vocabulary growth, topic shifts, velocity changes, style drift. Refreshed by `/vibe backtest`.

Last refresh: 2026-05-05.

---

## Why this exists

vibe-speak's profile calibrates ONCE at install and updates via the self-optimize loop (≥3 observations / 14 days). That works for incremental tweaks. But Michael learns new things constantly — new tools, new patterns, new vocabulary. The skill needs to **grow with him**, not just calibrate once.

trends.md tracks:
- New terms entering vocabulary
- Topic shifts (what's he focused on this week vs last)
- Velocity changes (terms growing / declining)
- Style drift (avg prompt length, register changes)

When a trend crosses threshold, surface a proposal — same pattern as Step 13 self-optimize.

---

## 2026 — week of 2026-05-04 (2-day window — corpus seed)

### New vocabulary (entered week)

| Term | Uses | Velocity | Status |
|---|---|---|---|
| inline edit | 11 | new → adopted same day | propose hard-keep |
| extract / extracted | 3 | new → adopted same day | propose hard-keep |
| pivot / pivoted | 2 | new → adopted | propose hard-keep |
| Module Modes (capitalized) | 1 | new | watch — concept emergence |
| vibe-speak | 4 | new (this session) | propose hard-keep |
| knock out (autonomy verb) | 1 | new | propose autonomy-signal |
| bulk import | 7 | new → established same week | propose hard-keep |
| time-budgeted phrasing | 1 | new (single-instance) | propose new signal type |

**Vocabulary growth this week: +9 terms.** Velocity: HIGH (typical: 2-3 new terms/week; this week saw 9).

Cause: heavy build session — Michael shipped 21 versions in 2 days, many introducing new module concepts.

### Topic shifts

| From (early) | To (late) |
|---|---|
| Crash recovery / scaffolding (2026-05-04 morning) | Inline editing / bulk imports (2026-05-04 afternoon) |
| Single-module work | Cross-module abstraction (csv_import.js extraction) |
| Build new features | Polish existing (inline-edit pattern across 12 modules) |
| AccentOS module work | Meta-skill work (vibe-speak, module modes) |

### Velocity changes

- "ship" — frequency 0 → 9 in 2 days (HIGH velocity)
- "inline edit" — 0 → 11 (highest velocity term)
- "extract" — 0 → 3 (refactor mindset emerging)
- "BUILD_INTELLIGENCE" — frequency stable (~2/day)

### Style drift

| Metric | Early week | Late week | Δ |
|---|---|---|---|
| Avg prompt length (words) | 65 | 42 | −35% (terser as week goes on) |
| Lowercase ratio | 60% | 75% | +25% (more casual) |
| Closure-word frequency | 0.3/prompt | 0.6/prompt | +100% |
| Autonomous-trust phrases | 0.2/prompt | 0.5/prompt | +150% (trusting more) |
| Numbered-chain prompts | 17% | 12% | −5% |

**Style drift summary:** Michael's prompts got terser, more lowercase, and more autonomous-trust over the week. This signals the default mode could shift from `vibe` toward `gsd` for build sessions.

**Proposal:** add a per-context default mode — `vibe` for design / discussion, `gsd` for build. Michael's late-week prompts already match gsd's profile.

---

## All-time totals (corpus through 2026-05-05)

- Total unique terms: ~85
- Total prompts logged: 18
- Date range covered: 2 days (single-repo seed)
- Hard-keep proposals pending: 6
- Trigger-phrase proposals pending: 2
- Mode-default proposals pending: 1

These will scale 100× when claude.ai full export is imported.

---

## Trend-detection thresholds

When these trip, surface a proposal:

| Signal | Threshold | Surfacing |
|---|---|---|
| New term used 5+× / 7d | "term entering vocabulary" | "Adding `[term]` to hard-keep" |
| Term frequency drops 80% / 14d | "term leaving vocabulary" | "`[term]` declining — keep on hard-keep?" |
| New topic cluster (3+ co-occurring nouns 3+ times) | "topic emergence" | "New domain detected: `[cluster]`. Mark as project context?" |
| Avg prompt length changes 30%+ over 14d | "register shift" | "Your prompts have gotten [shorter/longer] this period. Adjust default mode?" |
| Closure-frequency changes 50%+ | "autonomy shift" | "You're [trusting more / asking more]. Adjust mode default?" |
| Cross-corpus pattern (term in 3+ separate import files) | "universal vocab" | "`[term]` appears across all your projects — promote to system-wide hard-keep" |

---

## Actionable now (2026-05-05 baseline — already calibrated above)

After this baseline backtest, michael.md profile *would* be updated as follows if Michael runs `/vibe accept proposal`:

```diff
hard_keep additions:
+ inline edit, inline-edit
+ extract, extracted
+ pivot, pivoted
+ Module Modes
+ vibe-speak, vibe mode
+ bulk import
+ knock out (also autonomy-signal)

autonomy_signal additions:
+ knock out (verb form)
+ time-budgeted phrasing ("i have [N] minutes")

mode_default behavior:
+ when input matches time-budgeted pattern, auto-suggest gsd mode
```

---

## Future trend-tracking plans

Once claude.ai full corpus imported (target 1,000+ prompts):

- **Cross-project vocabulary** — terms shared across all Michael's projects vs project-specific
- **Annual vocabulary growth** — track year-over-year vocabulary evolution
- **Project lifecycle patterns** — when does a project's vocabulary stabilize?
- **Topic-to-skill correlation** — which topic clusters became skills via skill-forge? Useful for predicting future skill candidates.
- **Communication-style baseline shift** — if Michael fundamentally communicates differently in 6 months, vibe-speak adapts gracefully

These analyses get added as `/vibe trends [name]` subcommands once the corpus has the data to support them.
