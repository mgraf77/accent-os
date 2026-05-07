# prompt: discussion-questions

> Generator template for the reflection / challenge / scenario prompts that close every learning ecosystem. Used by Step 10.

## How to use

1. Run `educational-synthesis` in any mode.
2. Step 10 generates `/home/user/accent-os/knowledge/[topic-slug]/discussion-questions.md` using this template.
3. Use the questions for: solo journaling, podcast follow-up, team discussion, or as Q&A starters at the end of a slide deck.

## Output schema for `discussion-questions.md`

```markdown
# Discussion questions — [topic name]

> Mix of reflection / challenge / scenario / synthesis. Pick the angle that matches your current mode (solo learning vs. group debate vs. application).

## Reflection prompts (you, alone, thinking)

### Q1: [open-ended personal-application question]
**Why this question:** [1 line — what reflection it forces]
**Hint:** [1 line — what to anchor on if stuck]

### Q2: ...

## Challenge prompts (push back on the synthesis)

### Q3: [argue against the strategic conclusion]
**Why this question:** [what assumption it tests]
**Hint:** [what evidence or counter-position to consider]

### Q4: ...

## Scenario prompts (apply to AccentOS or a specific case)

### Q5: [concrete scenario]
**Setup:** [2–3 sentences establishing the scenario]
**Question:** [the actual question]
**Why this scenario:** [what concept it forces the reader to apply]

### Q6: ...

## Synthesis prompts (combine with adjacent topics)

### Q7: [how does this combine with [adjacent topic]]
**Why this question:** [the connection it surfaces]

### Q8: ...
```

## Question quality rules

**Reflection prompts must:**
- Be open-ended (no yes/no answers)
- Force the reader to apply the topic to their own context
- Avoid leading phrasing ("Don't you think..." or "Wouldn't it be true that...")
- Surface tradeoffs, not validate the synthesis

**Challenge prompts must:**
- Identify the strongest counter-position to the topic's main claim
- Point to specific assumptions that, if wrong, invalidate the synthesis
- NOT be straw-man challenges that the reader can dismiss easily

**Scenario prompts must:**
- Be concrete (specific numbers, named entities, specific decisions)
- Force application of ≥2 Core concepts together
- For AccentOS topics: use real-shaped data (vendor sales tier, customer RFM segment, deal probability) rather than abstract numbers
- Have a non-obvious answer

**Synthesis prompts must:**
- Connect to a specific adjacent concept by name (not "related topics")
- Force the reader to see the second-order implication of combining them

## Count & distribution

5–8 questions total. Distribution roughly:
- 2 reflection
- 2 challenge
- 2–3 scenario
- 1–2 synthesis

Skip a category only when the topic doesn't support it (e.g., purely descriptive topics may not have meaningful scenario prompts).

## AccentOS scenario library (for scenario prompts)

When the topic relates to AccentOS, draw scenarios from:

- A vendor's score dropped by 3 points across 90 days (vendor-cascade context)
- A new vendor was just onboarded but rep_group_id is unassigned (M19 context)
- Customer RFM segment flipped Active → Lapsed for 12 customers in one week
- A pipeline deal stayed in "negotiating" for 21 days with no comm (probability model context)
- An open quote is 18 days old with no follow-up (Daily Brief context)
- Co-op fund deadline is in 14 days and the vendor isn't responding (coop_tracker context)
- A purchase order's expected_date passed 5 days ago (PO module context)
- An employee score dropped on the customer_satisfaction metric specifically (employee_scores context)
- A KPI snapshot showed avg_score regression for the first time in 6 months
- A new BUILD_PLAN item just shipped and changed how an existing module behaves

Reach into this library when generating scenario prompts for AccentOS topics. Adapt the specifics to the topic — the pattern (concrete situation + forced decision) is what makes scenario prompts teach.

## Anti-patterns specific to discussion-questions

- Never write yes/no questions. They short-circuit thinking.
- Never write questions that the deep-dive already answered directly.
- Never write challenge prompts that are easy to dismiss. Real challenges target the strongest assumption.
- Never write scenario prompts using abstract placeholders ("Vendor X did Y"). Use named entities and real numbers.
- Never write more than 8 total questions — past that, none get used.
- Never order questions randomly. Reflection → challenge → scenario → synthesis is the cognitive build order.
