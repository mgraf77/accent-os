# template: analogy-library

> Step 6 output schema. Each Core concept gets ≥2 analogies from different domains.

## Schema for `analogies.md`

```markdown
# Analogies — [topic name]

## [Core concept 1]

### Analogy 1: [domain] → [concept]
**Source domain:** [what the reader already knows]
**Mapping:**
- [source element] ↔ [concept element]
- [source element] ↔ [concept element]
**Where it breaks:** [the specific way the analogy fails — every analogy has limits]

### Analogy 2: [domain] → [concept]
[same structure]

## [Core concept 2]

[same structure]
```

## Domain mix (per concept)

For every Core concept, draw analogies from **at least 2 different domain classes**:

1. **Operational metaphor** — assembly line, kitchen, traffic system, watershed, manufacturing process
2. **Business comparison** — vendor relationships, supply chain, store layout, payment terms, distribution
3. **Historical parallel** — known historical events, trends, or transitions (use sparingly — only when the parallel actually maps)
4. **Visualizable system** — gears, pipes, dam, ecosystem, electrical circuit, plumbing
5. **AccentOS-native parallel** — vendor scoring cascade, RFM segmentation, probability factor weights, role-based gating, BigCommerce ↔ Supabase data flow, Module Modes registry
6. **Adjacent technical concept** — e.g., for a database concept, a parallel from filesystems

Mix at least 2 different classes. Two analogies from the same class produce redundant teaching.

## Domain-class router (pick by topic domain)

Not every topic warrants AccentOS-native analogies. Match the topic's domain to the right analogy classes:

| topic domain | required class | optional class | avoid class |
|--------------|----------------|----------------|-------------|
| AccentOS internals (vendor scoring, modules, RFM, probability model, role gating) | 5 (AccentOS-native) | 2 (business), 1 (operational) | 3 (historical — usually doesn't map) |
| Software engineering / API design / system architecture | 6 (adjacent technical) | 1 (operational), 4 (visualizable) | 5 (AccentOS-native — only when explicitly relevant) |
| Business strategy / vendor relationships / distribution | 2 (business comparison) | 5 (AccentOS-native), 1 (operational) | 6 (technical — usually misfits) |
| Economics / finance / investing | 1 (operational), 3 (historical) | 2 (business) | 6 (technical) |
| Psychology / cognitive science / behavior | 4 (visualizable systems) | 6 (adjacent technical when the concept is computational) | 5 (AccentOS-native — almost never applies) |
| History / philosophy / law / geopolitics | 3 (historical parallel) | 1 (operational), 4 (visualizable) | 5 (AccentOS-native — never), 6 (technical — never) |
| Science / engineering / physics / biology | 4 (visualizable systems), 6 (adjacent technical) | 1 (operational) | 5 (AccentOS-native — never), 2 (business — only when motivation/funding is the angle) |
| Health / medicine / fitness | 1 (operational), 4 (visualizable) | 6 (adjacent technical when the topic is mechanism-heavy) | 5 (AccentOS-native — never) |

**Rule:** required class must produce ≥1 analogy per Core concept. Optional class produces the second analogy. Avoid class is hard-blocked — never reach for it for this domain.

If the topic crosses domains (e.g., "behavioral economics in vendor pricing"), pick the most-applicable required class and document the domain choice in the run's preflight output.

## "Where it breaks" is mandatory

Every analogy has limits. Naming the limits prevents the reader from over-extending the analogy.

Bad: "RFM segmentation is like sorting customers into pots." (works generically; doesn't teach)

Better: "RFM segmentation is like sorting customers into 5 cabinet drawers labeled Recency × Frequency × Monetary. **Where it breaks:** real customer behavior is continuous, not bucketed — a customer who shopped 89 days ago and one who shopped 91 days ago land in different drawers despite being indistinguishable behaviorally."

The break-condition IS the teaching.

## When a concept resists analogy

If you can't find an honest analogy for a Core concept, flag it:

```markdown
## [Core concept]

**Irreducibly novel — learn by direct example.**

This concept does not map cleanly to any familiar domain. The cleanest path to understanding is direct examples (see `practical-applications.md`).

Avoid stretching analogies that almost-fit — they create misconceptions.
```

Forcing a bad analogy is worse than admitting irreducibility. Some concepts (quantum behavior, certain mathematical structures, novel system designs) genuinely don't have parallels.

## Example (RFM segmentation, abbreviated)

```markdown
## RFM segmentation

### Analogy 1: business comparison → customer value buckets
**Source domain:** running a hardware store and tracking who's a regular vs. who hasn't been in a year
**Mapping:**
- "When were they last in?" ↔ Recency
- "How often do they come?" ↔ Frequency
- "How much do they spend?" ↔ Monetary
- "Regular" / "occasional" / "lapsed" mental shorthand ↔ VIP / Active / Lapsed segments
**Where it breaks:** the hardware-store owner remembers customer context (project type, life event, season). RFM only sees transaction count and date. A customer mid-renovation looks like a VIP for 2 months then a Lapsed for 18 — the segmentation is right but uninformative.

### Analogy 2: AccentOS-native → vendor tier cascade
**Source domain:** how vendors get tier A/B/C in vendor_scores
**Mapping:**
- Vendor sales rolled up over period ↔ Customer monetary
- Vendor activity recency ↔ Customer recency
- Vendor count of distinct categories ↔ Customer frequency
- Tier A/B/C cutoffs ↔ VIP/Active/Lapsed cutoffs
**Where it breaks:** vendor tiers use weighted score across many metrics; RFM uses three orthogonal dimensions independently bucketed. RFM is simpler — and that simplicity is both feature and bug.
```
