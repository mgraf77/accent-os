# Subject-line Rules — klaviyo-flows Mode B
> Spam scoring + A/B candidate generation rules. Read before drafting subject-line edits.

This file defines the subject-line scoring rubric `klaviyo-flows` uses in Mode B (propose) when drafting paste-ready alternates for the Accent Lighting Klaviyo flow library.

The voice baseline mirrors `skills/vibe-speak/profiles/michael.md` — lowercase tolerated, comma-splice tolerant, hard-keep vocab preserved, banned salesperson phrases. Klaviyo subject lines also need to clear inbox spam filters and pass Klaviyo's own warning flags.

---

## Spam scoring (0–10)

Score each subject by counting flagged tokens. Each match adds 1; cap at 10.

**Flagged tokens (case-insensitive):**

| Category | Tokens (each match = 1) |
|----------|------------------------|
| Urgency manipulation | "don't miss", "last chance", "act now", "hurry", "limited time", "only [N] left", "expires today", "ending soon" |
| Hype words | "exclusive", "amazing", "incredible", "shocking", "unbelievable", "best ever", "winner", "guaranteed" |
| Money signals | "$$$", "free!!", "100% free", "save big", "huge savings", "lowest price", "cash" |
| All-caps tokens | any whole word ≥4 chars in ALL CAPS (other than acronyms like SKU, BACL, USA, GMC) |
| Excessive punctuation | "!!", "??", "!?", "!." (any 2+ adjacent terminal punct) |
| Emoji density | ≥2 emoji in a single subject |
| Click-bait phrasing | "you won't believe", "what happens next", "this one trick", "the secret to" |
| Generic blast tone | "newsletter", "weekly update", "monthly digest" (penalize for genericness, not actual spam — but they tank open rates the same way) |

**Scoring bands:**
- 0–2: clean
- 3–4: marginal — flag if open rate is also low
- 5–7: poor — propose alternates
- 8–10: bad — propose alternates with priority

---

## Always-propose triggers (Mode B)

Generate subject-line alternates if any of:
- Spam score ≥ 5
- Open rate < 0.15 on the message
- Subject contains a banned phrase from `vibe-speak/profiles/michael.md` voice rules: "circling back", "touching base", "I hope this finds you well", "as previously mentioned", "looking forward to hearing from you"
- Subject is generic enough that A/B testing is the cheap unlock (e.g. "[brand] update" or "your monthly newsletter")

---

## Alternate generation rules

For each proposal, generate exactly **3 alternates** following these patterns (mix the 3 across patterns — don't generate 3 of the same kind):

### Pattern 1 — Concrete fact anchor
Use a specific SKU, brand, price, or stock event from Supabase context.
- Example: "the BACL pendant you looked at — back in stock"
- Example: "your Hinkley quote dropped 8% this week"
- Example: "Sea Gull recessed kit — last 6 in stock"

### Pattern 2 — Register-mirror low-pressure
Match Michael's lowercase, fragment-friendly voice. Open a loop without selling.
- Example: "quick note on your cart"
- Example: "thought you'd want to know"
- Example: "saw this and thought of your project"

### Pattern 3 — Question or curiosity hook (no click-bait)
Genuine question that maps to a real fact in the email body.
- Example: "still thinking about that pendant?"
- Example: "ready to spec the kitchen lighting?"
- Example: "did the contractor get the fixtures?"

### Pattern 4 — Quantified specificity
Number anchored to a fact in the body.
- Example: "3 fixtures still in your cart"
- Example: "$842 saved on your saved items"
- Example: "12 months since your last order — quick check-in"

---

## Hard rules

- **No emoji** in any alternate — Accent Lighting brand voice is restrained; emoji subjects are off-brand.
- **No ALL-CAPS words** other than acronyms (SKU, BACL, USA, GMC, LED, etc.).
- **No exclamation marks** unless the original subject had one and Michael's voice profile permits it on this flow type (post-purchase delight is fine; transactional is not).
- **Length cap: 50 characters** (Klaviyo + most inboxes truncate around 50–60). Flag any alternate over 50.
- **No "[Customer Name]" personalization tokens** unless the current subject already uses them — adding personalization is a separate edit type, not a subject-line A/B.
- **Trace each rationale to a fact.** "spam score 8/10" cites the flagged tokens; "+12% open rate" cites Klaviyo's 2024 retail benchmark; "register-mirror" cites `vibe-speak/profiles/michael.md`. Don't invent rationales.

---

## Rationale templates

Per alternate, append a 1-line rationale in this shape:

- `(spam: X/10  — [pattern name])`
- `(spam: X/10  — fact-anchored: [the fact])`
- `(spam: X/10  — register-mirror per voice-calibration)`
- `(spam: X/10  — Klaviyo 2024 benchmark: numbered subjects lift +12% open rate on retail accounts)`

Example output block:

```
EDIT 1 — Subject Line — Message #2 in flow "Browse Abandon — Outdoor"
  current:  "Don't miss out on this exclusive outdoor sale!"
  spam-score: 8/10  (flagged: "don't miss", "exclusive", "!" + "sale")
  candidate A: "the outdoor pendant you looked at — back in stock"
                (spam: 0/10  — fact-anchored: BACL ProMax pendant)
  candidate B: "saw your saved fixtures"
                (spam: 0/10  — register-mirror per voice-calibration)
  candidate C: "3 fixtures still in your cart"
                (spam: 0/10  — quantified specificity)
```
