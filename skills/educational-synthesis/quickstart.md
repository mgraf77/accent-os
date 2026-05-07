# educational-synthesis — quickstart

> Fast-path entry to the skill. For full workflow see `SKILL.md`.

## Invoke in 3 ways

### 1. By natural phrase
Drop into chat. Any of these auto-route here:

```
"Teach me [topic]"
"Deep dive on [topic]"
"Build a learning ecosystem for [topic]"
"Show me how [topic] works"
"Podcast this"
"Brief me on [topic]"
"Concept map for [topic]"
```

### 2. By explicit invocation
```
"Run educational-synthesis on [topic] in [mode] mode"
```

Modes: `deep-dive` (default), `exec-briefing`, `podcast`, `visual-thinking`, `teach-me`, `concept-map`.

### 3. From another skill
Skill-forge / analysis-snapshot / decision-log can hand off to educational-synthesis when their output deserves multi-modal teaching.

---

## Smallest possible run (4 minutes wall time)

Topic with no source files, no AccentOS context:

```
"Brief me on [topic]"   →   exec-briefing mode
                            generates: executive-summary.md + risks-limitations.md + faq.md (3 entries)
                            ~400 words total
                            sparse-input fallback triggers WebSearch
```

Topic with AccentOS source (a `js/*.js` module, BUILD_PLAN entry, etc.):

```
"Deep dive on [topic]"   →   deep-dive mode
                             generates: 9–11 files in /knowledge/[slug]/
                             ~3000–4500 words across artifact set
                             AccentOS context auto-loaded from BUILD_PLAN/MASTER/etc.
```

---

## Output destination

Every run writes to `/home/user/accent-os/knowledge/[topic-slug]/` and updates `/home/user/accent-os/knowledge/INDEX.md`.

`[topic-slug]` is auto-derived (kebab-case, ≤4 words). Override by saying "save it as [slug]".

---

## Re-run

```
"Re-do educational synthesis on [slug] in [new mode] mode"
```

If sources have changed since the original run, the skill regenerates. If only the mode changed (e.g., re-do as `podcast` after originally running as `deep-dive`), the skill adds the new mode's files alongside existing ones.

---

## When NOT to use

- For one-shot questions answered in chat → use vibe-speak `teach-me` mode (no files)
- For re-runnable queries → use `analysis-snapshot`
- For ingesting an external tool to build a skill → use `skill-forge`
- For trivial topics (would not deserve >1 month of memory) → just answer in chat

---

## Mode picker (quick reference)

| You want to... | Use mode |
|----------------|----------|
| Deeply understand a topic for >1 month memory | `deep-dive` (default) |
| Decide on something in the next 24h | `exec-briefing` |
| Consume on a walk / drive | `podcast` |
| Share with a non-reader audience | `visual-thinking` |
| Learn a topic from zero domain prior | `teach-me` |
| Diagnose system behavior / feedback loops | `concept-map` |

---

## Companion skills (auto-handoff)

After a synthesis ships, the skill may surface:

- "Want to snapshot the SQL query?" → `analysis-snapshot`
- "Want to forge a skill from this pattern?" → `skill-forge`
- "Want to log this as a decision?" → `decision-log`
- "Run doc-drift to verify alignment?" → `build-plan-status`

Always surfaced as offers, never auto-executed. You decide.
