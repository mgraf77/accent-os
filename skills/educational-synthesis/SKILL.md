---
name: educational-synthesis
description: >
  Universal educational synthesis engine for AccentOS — transforms any complex topic,
  document, internal system, vendor strategy, or external framework into a multi-format
  learning ecosystem (executive briefing, layered deep-dive, NotebookLM-style podcast,
  slide deck architecture, infographic layout, mind map, FAQ, analogy library,
  misconception correction, discussion questions). Optimizes for understanding,
  retention, and systems-level comprehension — not compression. Use when Michael says:
  "teach me [X]", "explain [X] like a course", "build a learning ecosystem for [X]",
  "synthesize [topic]", "make this learnable", "podcast this", "deck this", "deep dive
  on [X]", "executive briefing on [X]", "mental model for [X]", "concept map for [X]",
  "turn this into a learning module", "break this down for me", "produce a course on",
  or after any complex AccentOS architecture decision (Module Modes registry, RFM
  segmentation, vendor probability model, role-based gating cascade) where the reasoning
  deserves to outlive the chat. Distinct from skill-forge (ingest external tool → ship
  custom skill) and analysis-snapshot (capture a re-runnable query): educational-synthesis
  ingests a topic and produces a multi-modal learning ecosystem. Always writes files to
  /home/user/accent-os/knowledge/[topic]/ — never returns a prose summary in lieu of
  the artifact set. Companion to skill-forge, analysis-snapshot, vibe-speak teach-me mode.
---

# educational-synthesis

**Purpose:** Stop losing hard-won AccentOS reasoning, vendor intelligence, external research, and complex topic mastery to chat scrollback. Every meaningful concept becomes a structured, multi-modal learning ecosystem — executive briefing for skim, deep-dive for mastery, podcast for ambient absorption, deck for sharing, mind map for cross-reference, reinforcement for retention.

The skill is **NOT** a summarizer. It is a knowledge synthesizer, educational architect, mental-model generator, and adaptive teaching system. Output should feel like a world-class educational course — not a generic AI summary.

---

## Core design principle

The objective is **maximize understanding**, not compress information.

Every output choice serves: conceptual clarity, mental model formation, relationship mapping, progressive understanding, retention, insight density, real-world applicability, systems-level comprehension.

When tradeoffs surface (depth vs. brevity, layered vs. flat, analytical vs. punchy), pick the side that makes the reader **understand more deeply** a week later. This is the load-bearing rule.

---

## Lazy-load contract (token budget)

**HOT path** (~3K tokens, always loaded): this SKILL.md + `MODES.md` + `references/tone-rules.md`. Steps 0–6 always run.
→ Cache breakpoint #1 (after `references/tone-rules.md` final byte)

**WARM path** (~3K, load on first generation): the active mode file from `modes/[mode].md` + `templates/concept-inventory.md` + `templates/output-skeleton.md`. Steps 7–10 use these.
→ Cache breakpoint #2 (after `templates/output-skeleton.md` final byte)

**COLD path** (~4K, load on explicit invocation): `prompts/notebooklm-podcast.md`, `prompts/slide-deck.md`, `prompts/infographic.md`, `prompts/discussion-questions.md`, `references/adaptive-difficulty.md`, `references/educational-architecture.md`, `examples/*`. Step 12 (write outputs) picks only the prompts the chosen output formats need.
→ Cache breakpoint #3 (after final cold-path file)

With Anthropic prompt caching markers placed at the three breakpoints above, second+ run on the same topic hits ~95% cache. The HOT path stays cached across sessions; WARM path is cached per-mode; COLD path caches per format selection.

---

## Trigger recognition

Run this skill when Michael says anything like:

- "teach me [X]" / "break down [X] for me"
- "explain [X] like a course"
- "build a learning ecosystem for [X]"
- "synthesize [topic]"
- "make this learnable"
- "deep dive on [X]"
- "executive briefing on [X]"
- "podcast this" / "turn this into a NotebookLM podcast"
- "deck this" / "produce a slide deck on"
- "mental model for [X]" / "concept map for [X]"
- "produce a course on [X]"
- "turn this into a learning module"
- "show me how [X] works" / "explain how [X] works"
- "trace this through" / "walk me through [X]"
- "I want to understand [X] deeply"

Also fire automatically (with confirmation) after:
- Any AccentOS architecture decision worth >1 month memory (Module Modes registry, probability model recalibration, score gating cascade)
- Any vendor-strategy session that concluded with non-trivial reasoning
- Any external-research session that produced ≥3 reusable concepts (skill-forge often spawns this)

**Disambiguation:**
- "Save this analysis" → analysis-snapshot
- "Build me a skill from [tool]" → skill-forge
- "Teach me [topic]" → this skill (educational-synthesis)
- "Explain it simply right now in chat" → vibe-speak teach-me mode (no files)

---

## Step 0 — Preflight

Before any output, do these in parallel:

1. **Load tone rules** — read `references/tone-rules.md`. Apply: analytical, calm, intellectually honest, no hype, no buzzwords, no shallow futurism. This is non-negotiable.
2. **Load active mode** — `modes/[mode].md`. Default mode: `deep-dive` if Michael didn't specify. See `MODES.md` for the catalog.
3. **Identify input shape** — markdown / PDF / transcript / notes / URL / pure-topic-name / multi-source. If multi-source, list the sources before proceeding.
4. **Identify audience** — beginner / intermediate / advanced / executive. When unspecified, default to **intelligent non-expert** (the highest-leverage default — covers most Michael use cases).
5. **Identify domain** — software / vendor strategy / economics / psychology / operations / ai / etc. Domain influences analogy selection (Step 5).

Output: a 4-line preflight note. Mode + audience + domain + sources.

---

## Step 1 — Ingest

For each input source:

- **Pure topic name** ("teach me Module Modes architecture") — pull AccentOS context from BUILD_PLAN_CLAUDE.md, MASTER.md, BUILD_INTELLIGENCE.md, the relevant `js/*.js` module, MODULE_MODES.md, and any `skills/*/SKILL.md` that touches the topic. Note every source consulted.
- **Document/file** — read in full. For PDFs >10 pages, read in 5-page chunks across multiple Read calls.
- **URL** — WebFetch the page. If 403/404, fall back to WebSearch with `site:` operator + distinctive terms.
- **Transcript** — read in full; mark speaker turns explicitly.
- **Multi-source** — process each source separately, then cross-reference in Step 4.

**Sparse-input fallback** — if the topic is a pure name AND no AccentOS context grep finds it AND no source file was provided:
1. Run WebSearch for the topic with at least 2 distinctive query variants (e.g., "[topic] explained", "[topic] mechanism").
2. WebFetch the top 2–3 authoritative results (academic / official / well-known explainer sources — NOT random blog SEO).
3. If WebSearch returns nothing useful (rare for non-trivial topics), pause and ask Michael for one source URL or a 1-paragraph primer. Do not guess content.

Output: a one-block summary of what was ingested. Sources listed by name with token-count estimate. Note explicitly whether sparse-input fallback was triggered.

---

## Step 2 — Identify core concepts

Extract every named primitive, mechanism, decision, tradeoff, and pattern. Aim for **≥10 concepts** for any non-trivial topic. Do NOT pre-filter — that is Step 3's job.

For each concept, record:
- Name (precise, not generic)
- One-sentence definition
- Where in the input it appeared (anchor)
- Whether it's a primitive (atomic) or compound (built from other concepts)

Use the `templates/concept-inventory.md` schema. Output a single table: # | concept | def | anchor | type.

---

## Step 3 — Build conceptual hierarchy

Sort the Step 2 inventory into 4 tiers:

1. **Core concepts** — the 3–7 ideas that, if removed, collapse the topic. These get the most teaching real estate.
2. **Supporting concepts** — ideas that sharpen the core but aren't load-bearing on their own.
3. **Dependencies** — pre-requisites the reader must hold before the core lands. Often background concepts from adjacent domains.
4. **Strategic implications** — what changes in the world / in AccentOS / in Michael's decisions because the core is true.

Output: a 4-section hierarchy. Each tier as a bulleted list with one-line annotations.

The hierarchy IS the spine of the deep-dive output. Everything downstream uses it.

---

## Step 4 — Map relationships (conditional)

**Skip-condition:** If the topic has <2 Core concepts OR Core concepts have no meaningful causal/compositional relationships (e.g., a single isolated principle, a definition-only topic), skip this step. Note "relationships not applicable to this topic shape" in the output.

When the step applies, for each Core concept identify:
- **Upstream causes** — what produces it
- **Downstream effects** — what it produces
- **Feedback loops** — circular causation paths (often the most important insight)
- **Antagonists** — concepts it competes with or replaces
- **Composes with** — concepts it combines with to produce 1+1=3 effects

Output a relationship graph in Mermaid format. Concepts as nodes, relationship type as edge labels. Save to `/knowledge/[topic]/relationships.mmd` for downstream rendering.

If the topic has feedback loops, **flag them in bold** in the graph. Feedback loops are the highest-leverage insight category — they explain why systems behave non-linearly.

**When skipped**, the `concept-map` mode is also unavailable for this topic (it requires Step 4 output). Re-route to `deep-dive` mode if the user originally requested `concept-map`.

---

## Step 5 — Run the 10 internal questions

Before writing any output prose, internally answer all 10 in 1–2 sentences each. Surface them in the deep-dive output as a "Reader's Compass" appendix.

1. What are the core concepts? (already from Step 3)
2. What relationships matter most? (already from Step 4)
3. What would confuse a learner? (misconceptions)
4. What visualizations would help? (drives Step 9)
5. What analogies would simplify this? (drives Step 6)
6. What misconceptions are likely?
7. What strategic implications matter?
8. What practical applications exist? (in AccentOS specifically when relevant)
9. What learning order creates the clearest understanding?
10. What format best teaches each concept? (drives Step 7)

Skipping this step produces shallow output. The 10 questions force the depth that distinguishes synthesis from summarization.

---

## Step 6 — Generate analogies (aggressively)

For each Core concept, produce **at least 2 analogies** drawn from different domains. Mix:
- Operational metaphor (assembly line, kitchen, traffic system)
- Business comparison (vendor relationships, supply chain, store layout)
- Historical parallel (when fits the topic)
- Visualizable system (gears, pipes, watershed, ecosystem)
- AccentOS-native parallel (vendor scoring, RFM segmentation, probability model, role gating, BigCommerce vs Supabase data flow)

Save the analogy set as `/knowledge/[topic]/analogies.md` using `templates/analogy-library.md` schema.

When a Core concept resists analogy, that itself is an insight — flag it as "irreducibly novel; learn by direct example."

---

## Step 7 — Choose output formats

Pick a subset of these based on the active mode (default mode = deep-dive, which selects most of them):

- `executive-summary.md` — 1 page, decisions-grade
- `deep-dive.md` — full layered teaching (foundational → intermediate → advanced → strategic)
- `notebooklm-prompt.md` — drop-in prompt for NotebookLM Audio Overview
- `slide-deck.md` — slide-by-slide architecture (titles, bullets, speaker notes)
- `infographic.md` — visual layout spec (sections, hierarchy, data callouts)
- `mind-map.md` — Markmap-compatible outline
- `concept-glossary.md` — alphabetized glossary with cross-references
- `faq.md` — 10–20 questions with layered answers
- `misconceptions.md` — what learners typically get wrong + correction
- `discussion-questions.md` — reflection / challenge / scenario prompts
- `practical-applications.md` — implementation guide (AccentOS-specific when relevant)
- `risks-limitations.md` — what this concept doesn't cover, when it breaks

Each format has a corresponding template under `templates/` or `prompts/`.

Do not generate **every** format every time. Default set: executive + deep-dive + notebooklm + faq + misconceptions + discussion. Add slide-deck / infographic / mind-map only when the input is visualization-shaped or Michael asked. Add practical-applications + risks-limitations when input is a system or framework Michael might act on.

Output: a 1-line list of which formats will be generated this run.

---

## Step 8 — Generate progressive learning structure

The `deep-dive.md` is built in 4 layers, in this order:

1. **Foundational** — the absolute prerequisites. Beginner's mental model. Aggressive analogies. ≤500 words.
2. **Intermediate** — the core mechanics. How the concepts produce the outcomes. ≤1000 words.
3. **Advanced** — the edge cases, the failure modes, the second-order effects. ≤1000 words.
4. **Strategic** — what this changes about decisions, priorities, or architecture. AccentOS-specific when relevant. ≤500 words.

Each layer ends with a "What you should now be able to do" bulleted box — explicit competency markers.

Layer transitions are NOT optional and NOT to be merged. The progressive structure IS the teaching.

Tone follows `references/tone-rules.md`. Adaptive difficulty calibration uses `references/adaptive-difficulty.md`.

---

## Step 9 — Generate audio + visual structures

**Audio (NotebookLM-style podcast prompt):**

Use `prompts/notebooklm-podcast.md` as the template. Produce a drop-in prompt for NotebookLM Audio Overview (or any future AI voice system) that generates a 15–30 minute conversational explainer. The prompt specifies:
- Two-host dynamic (one explains, one asks the smart-listener questions)
- Pacing target: NPR / Acquired / Lex Fridman
- Required moments: opening hook, the "wait, why" question 5–7 minutes in, the misconception-correction segment, the strategic-implications close
- Avoid: robotic summary, hype, corporate buzzwords

Save as `notebooklm-prompt.md` in the topic folder.

**Visual structures:**

For any concept tagged in Step 5 as "needs visualization":
- If hierarchy → mind map (`mind-map.md`, Markmap-compatible)
- If sequence → flowchart (Mermaid)
- If feedback loops → system diagram (Mermaid graph TD with feedback edges)
- If comparison → table (in `deep-dive.md` body)
- If transformation → before/after diagram

Slide deck: only when explicitly requested or when Michael's intent is "share this with someone." Use `prompts/slide-deck.md` for the architecture.

---

## Step 10 — Generate reinforcement systems

Reinforcement is what separates a learning ecosystem from a one-time read. Generate:

- **`faq.md`** — 10–20 questions a learner would ask. Group by Foundational / Intermediate / Advanced / Strategic. Each answer is layered: 1-line direct answer, then 2–3 sentences of context.
- **`misconceptions.md`** — 5–10 common misunderstandings, each with: the wrong mental model, why it's tempting, the correct mental model.
- **`discussion-questions.md`** — 5–8 prompts. Mix reflection ("what would you do if…"), challenge ("argue against the strategic conclusion"), and scenario ("apply this to AccentOS Module X"). See `prompts/discussion-questions.md` for the template.
- **`risks-limitations.md`** (when applicable) — what the concept does NOT cover, where it fails, what would invalidate it.

These four files are what makes the topic stick. Skip reinforcement and the deep-dive is just a long article.

---

## Step 10.5 — Pre-write validation gate

Before writing any file, run this 6-check validation pass. The anti-pattern list at the bottom of this skill is descriptive; this gate is **enforcement**.

1. **Forbidden-phrase scan** — read the full `references/tone-rules.md` forbidden list (15 phrases). Grep every drafted file for each phrase. Any hit → rewrite the offending sentence before write.
2. **Mandatory file presence** — for the active mode, verify the mode's "files generated" list (in `modes/[mode].md`) is fully populated. Missing file → generate before write, never ship a partial set.
3. **Layer word-budget enforcement** — for `deep-dive.md`, count words per layer. Foundational/Intermediate/Advanced/Strategic each within ±20% of mode's budget. Over → trim. Under → expand or document why (some Strategic layers are legitimately short).
4. **Analogy coverage** — every Core concept (Step 3 tier 1) has ≥2 analogies in `analogies.md` from different domain classes. Missing → generate before write.
5. **Reinforcement coverage** — `faq.md` has ≥10 entries, `misconceptions.md` has ≥5 entries, `discussion-questions.md` has ≥5 prompts. Below threshold → generate before write.
6. **Audience calibration consistency** — every file in the artifact set uses the same audience calibration (per `references/adaptive-difficulty.md`). The `executive-summary.md` is allowed to be tighter than the deep-dive (different consumption shape, same audience tier), but a beginner-tier deep-dive should not produce an advanced-tier FAQ.

Each check produces a pass/fail. Any fail → fix in place; do NOT proceed to Step 11. Re-run the failed check after fix.

If a check fails twice in a row on the same item, log the topic + check + cause to `feedback-log.md` and ship anyway with the failure noted in `INDEX.md`. Don't loop indefinitely.

---

## Step 11 — Write outputs to /knowledge

File structure target:

```
/home/user/accent-os/knowledge/[topic-slug]/
├── INDEX.md                   # what's here, what each file does, last-updated
├── executive-summary.md
├── deep-dive.md
├── notebooklm-prompt.md
├── slide-deck.md              # only if generated
├── infographic.md             # only if generated
├── mind-map.md
├── concept-glossary.md
├── analogies.md
├── relationships.mmd          # Mermaid graph from Step 4
├── faq.md
├── misconceptions.md
├── discussion-questions.md
├── practical-applications.md  # only if applicable
└── risks-limitations.md       # only if applicable
```

`[topic-slug]` is kebab-case, ≤4 words. Examples: `vendor-probability-model`, `module-modes-architecture`, `rfm-segmentation`, `bigcommerce-vs-shopify-economics`, `hick-hyman-law`, `claude-tool-use-protocol`.

Write all files via the Write tool. Never use bash heredocs.

---

## Step 12 — Update /knowledge/INDEX.md

Append to (or create) `/home/user/accent-os/knowledge/INDEX.md`:

```markdown
| slug | created | mode | audience | files | description |
|------|---------|------|----------|-------|-------------|
| vendor-probability-model | 2026-05-07 | deep-dive | intelligent non-expert | 11 | 8-factor model from BUILD_PLAN 1.5 |
```

Sort by created descending (newest first). The index is what Michael consults to find an old learning artifact 6 months later.

---

## Step 13 — Output the report + companion-skill handoff

### Report

Confirmation block to Michael:

```
EDUCATIONAL SYNTHESIS — shipped

Topic: [name]
Mode: [active mode]
Audience: [calibration]
Files written: [count]
Validation: [pass/fail summary from Step 10.5]

Folder: /home/user/accent-os/knowledge/[slug]/
Indexed: yes

Recommended next:
  - Drop notebooklm-prompt.md into NotebookLM for audio
  - Open deep-dive.md to read in full
  - Skim faq.md when re-engaging the topic later

Re-synthesize any time with:
  > "Re-do educational synthesis on [topic] in [mode] mode"
```

If invoked from another skill (skill-forge, analysis-snapshot), note the originating skill in the report so the chain is traceable.

### Companion-skill handoff (auto-trigger)

After the report, scan the synthesis output for these handoff conditions:

| condition | handoff to | action |
|-----------|------------|--------|
| Synthesis surfaced a re-runnable SQL or vendor-cascade query | `analysis-snapshot` | Surface: "this synthesis includes a re-runnable query — want me to snapshot it?" |
| Synthesis surfaced a reusable pattern that could become a skill | `skill-forge` | Surface: "the [pattern name] pattern is reusable — want me to forge a skill from it?" |
| Synthesis concluded with a go/no-go decision | `decision-log` | Surface: "the [decision] is decision-grade — want me to log it?" |
| Synthesis flagged ≥2 BUILD_INTELLIGENCE-worthy lessons | `build-plan-status` (drift check) | Surface: "this synthesis added lessons — run doc-drift to verify alignment?" |

Do NOT auto-invoke the companion skill. Surface the offer; let Michael decide. The handoff protocol prevents skill-cascade churn — each skill stays user-triggered or single-handoff.

### Self-improvement logging

If the synthesis encountered any non-trivial issue (sparse input, validation retry, analogy gap, mode re-routing), append a 1-line entry to `skills/educational-synthesis/feedback-log.md` per its schema. Log writes happen at the end of Step 13, not mid-flow.

### Self-score (4 dimensions, 0–10 each)

Before closing the run, score the synthesis on these four dimensions. Output the scores in the report block above and append a row to `skills/educational-synthesis/synthesis-log.md`.

| dim | what it measures | 10/10 | 5/10 | 0/10 |
|-----|------------------|-------|------|------|
| **Depth** | Did Step 5 (10 internal questions) get answered in 2+ sentences each, with the answers shaping the deep-dive? | Every question shaped a section | Half answered superficially | Skipped or one-line answers |
| **Coverage** | Did every Core concept get its full treatment (≥2 analogies, mention in deep-dive layers, glossary entry, FAQ entry)? | Every Core concept fully treated | Some Core concepts absent from FAQ or analogies | Missing tier-1 concepts entirely |
| **Reinforcement** | Did `faq.md` (≥10 entries), `misconceptions.md` (≥5), `discussion-questions.md` (≥5) hit the targets, AND are they non-trivially distinct from the deep-dive? | All three full, distinct, and useful | Threshold met but content rehashes deep-dive | Below threshold |
| **Calibration** | Does the artifact set hold the stated audience tier consistently across all files? | Vocabulary + analogy density + competency markers all consistent | One file off-tier (e.g., advanced-tier FAQ in beginner synthesis) | Mixed tier across the set |

Score honestly. A 7/10 average is normal; a 10/10 is rare. Scores below 6/10 on any dimension = the synthesis is shallow → write a `shallow-output` entry to `feedback-log.md` proactively (don't wait for Michael to flag it).

Self-scores accumulate in `synthesis-log.md` as a trend signal. After 5+ runs, scan for dimensions persistently below 7 — those are the calibration gaps to fix in the skill itself.

---

## Anti-patterns

- **Never** summarize when the spec asks for synthesis. Summary compresses; synthesis reorganizes for understanding. The output is longer than the input when done right.
- **Never** skip Step 5 (the 10 internal questions). Skipping produces a competent-looking but shallow artifact that won't teach anything a week later.
- **Never** generate every output format every run. Default set is curated for a reason; bloated output wastes Michael's reading time.
- **Never** use hype tone, corporate buzzwords, sensationalism, or shallow futurism. The tone target is analytical / calm / intellectually honest. See `references/tone-rules.md`.
- **Never** write prose walls in the deep-dive. Each layer is structured (subheads, bullets, callouts). A wall-of-text deep-dive fails Step 8's progressive structure.
- **Never** invent analogies that don't actually map. A bad analogy creates a misconception. If a Core concept resists analogy, flag it as "irreducibly novel" rather than forcing.
- **Never** skip the INDEX.md update. An un-indexed knowledge artifact is invisible 6 months later — same rule as analysis-snapshot.
- **Never** generate output without identifying audience first (Step 0). "Intelligent non-expert" is the default; named audiences override.
- **Never** pre-filter concepts in Step 2. Concept inventory is exhaustive surfacing; Step 3 does the hierarchy.
- **Never** present strategic implications without grounding them in the core concepts. Implications floating free of mechanics are speculation.
- **Never** auto-trigger this skill on trivial topics ("what does git status do"). Trigger threshold: topic deserves >1 month of memory or has ≥10 concepts.

---

## Companion skills

- **skill-forge** — when a topic ingestion produces a reusable pattern that should become its own skill, hand off to skill-forge after the synthesis ships.
- **analysis-snapshot** — when the synthesis includes a re-runnable query (vendor-cascade, supabase-sql-magic), snapshot that separately. The educational artifact and the snapshot are different shapes.
- **vibe-speak teach-me mode** — for in-chat teaching when no files are needed. Use vibe-speak first; promote to educational-synthesis when the topic deserves persistence.
- **decision-log** — when the synthesis surfaces a go/no-go decision, log it via decision-log alongside the deep-dive.

---

## Maintenance

- This skill is invoked by name, by trigger phrase, or by skill router (vibe-speak Step 23).
- Every run touches `/knowledge/INDEX.md` — never skip the index write.
- Self-improvement: track shallow-output complaints in a future `feedback-log.md` and tune the 10-question depth or the layer-length caps. Defer until ≥3 complaints accumulate.
