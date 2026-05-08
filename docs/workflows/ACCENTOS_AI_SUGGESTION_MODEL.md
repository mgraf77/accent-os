# AccentOS — AI Suggestion Object Model

**Mode:** Workflow systems design (no implementation)
**Anchors:** event/handoff schema, priority system
**Core insight:** AI suggestions must behave like operational objects, not popups.

---

## 0. Why an object, not a popup

A popup is fire-and-forget. An operational object:

- has identity, owner, state, and history,
- shows up in queues alongside human work,
- accumulates feedback,
- is auditable and reversible,
- carries enough context that the human reviewer doesn't have to swivel-chair to act.

If AI suggestions don't have these properties, they degrade into background noise and the team learns to ignore them. That kills the AI program before it starts.

---

## 1. Suggestion lifecycle

States, with allowed transitions:

```
proposed → presented → (accepted | rejected | deferred | superseded | expired | auto-applied)
accepted → applied → (verified | reverted)
auto-applied → (verified | reverted | escalated)
deferred → presented (when wake condition hits)
rejected → archived (with reason)
superseded → archived (linked to the suggestion that replaced it)
```

- **proposed** — created internally, not yet visible (e.g. confidence below publish threshold, or batched).
- **presented** — in the human's AI-inbox / surfaced on subject.
- **accepted** — human approved; system applies (or asks AI to apply).
- **applied** — change is in effect.
- **verified** — outcome observed positive (signal completes the feedback loop).
- **reverted** — applied change rolled back; emits `ai.suggestion.reverted` and the suggestion is treated as a negative signal.
- **rejected** — typed reason from a small enum + optional note.
- **deferred** — snoozed with a wake condition (time, event, threshold).
- **superseded** — newer, better suggestion replaces it (link required).
- **expired** — TTL hit without action.
- **auto-applied** — high-confidence + reversible policy class allowed system to act; the human review is a *post-hoc* review, not an approval gate.
- **escalated** — auto-applied action that produced a red downstream signal; surfaces to owner-lead.

---

## 2. Suggestion object shape (conceptual)

- **id** + **subject** (typed reference: `lead:L-1`, `po:PO-2`).
- **action** — what the suggestion proposes (typed verb + parameters).
- **rationale** — the "why", in plain language plus structured factors.
- **confidence** — 0..1, calibrated. The system tracks calibration and recalibrates over time.
- **reversibility class** — `irreversible | reversible-easy | reversible-with-cost | irreversible-with-customer-visibility`.
- **policy class** — `human-required | human-default-with-auto-fallback | auto-with-post-hoc-review`.
- **alternatives** — at most a handful, ranked.
- **evidence** — the events / data points the suggestion drew from (so a human can audit).
- **owner** — derived from subject ownership, not chosen by AI.
- **priority_score** — inherits from subject by default; certain types boost.
- **wake conditions** — for defer support.
- **history** — every state change with actor, time, reason.
- **trust signals** — accumulated accept/reject ratio for this suggestion *type* and this *owner*.

---

## 3. Confidence and calibration

- Confidence is **calibrated**: when AI says 0.8, ~80% of those should turn out right over time. The system tracks this; uncalibrated confidence is worse than no confidence.
- **Publish threshold** — below this, suggestions stay `proposed` (telemetry only).
- **Auto-apply threshold** — combined with reversibility class. Only `reversible-easy` actions with high confidence may auto-apply.
- **Recalibration cadence** — periodic; uses verified outcomes as ground truth.

---

## 4. Rationale and explanation

- Every presented suggestion shows its rationale in **two layers**:
  1. **Headline** — one sentence a busy operator can act on.
  2. **Factors** — the inputs that drove it, ranked. Same inputs the priority system uses where applicable.
- "Trust me" is not a rationale. A suggestion that can't produce a rationale doesn't get presented.
- For drafts (text/email), the rationale points at the source material the draft draws from — so the reviewer can audit voice and facts quickly.

---

## 5. Feedback accumulation

- Every accept/reject/revert/verify is a typed signal feeding back into:
  - **Per-type trust** (e.g. vendor-ETA-parser is trusted; chase-email drafter is not yet).
  - **Per-owner trust** (this rep accepts AI follow-up drafts 9/10; that designer never does — surface accordingly).
  - **Calibration data** for confidence.
- Reject without reason is allowed but discouraged; the UI nudges for a reason from a small enum.
- Feedback never silently changes another live suggestion; it changes future presentations.

---

## 6. Reversibility

- Every action has a reversibility class declared up front. If unclear, default to `human-required`.
- Reversible actions support a one-click revert from the suggestion's history pane for a defined window.
- Auto-applied actions surface a "this happened automatically — review" affordance until verified.
- Customer-visible actions (sent message, sent quote, fired PO) are **never** auto-applied unless explicitly policy-classed and the customer-visible nature is loud in the UI.

---

## 7. Auditability

- Every transition emits an `ai.suggestion.*` event (see schema doc).
- Subject pages show a unified timeline of human + AI actions — no separate "AI log" off to the side. AI's work is *part of the record*.
- A suggestion's evidence pointers are durable: a human reviewing six months later can see *why* the AI suggested what it did.

---

## 8. Escalation

- Auto-applied action that triggers a downstream `R` → `escalation.opened` against the AI-policy owner (ops), not the subject's human owner.
- Suggestion ignored on a red subject → escalates to owner-lead with the suggestion attached, not detached.
- Repeated rejection of the same suggestion type → AI-policy review surface (the *system* is wrong, not the user).

---

## 9. Trust-building UX

The trust model is the product. Concrete UX guarantees:

- **First sight, no surprise.** New AI capability ships in `human-required` mode, gathers signal, then earns auto.
- **Always show the off-ramp.** Reject + reason is one tap; "stop suggesting this for me" is one tap.
- **Show the score honestly.** Low confidence is visible, not hidden — humans triage faster when they see "AI is unsure here".
- **Show the win.** When an accepted suggestion produces a verified positive outcome, surface it briefly on the timeline. Reinforces the loop.
- **No nagging.** A rejected suggestion does not re-appear unchanged. A re-emit must carry a delta in the rationale.

---

## 10. Explanation requirements per suggestion class

| Class | Min rationale | Reversibility default | Example |
|---|---|---|---|
| Routing (assignment, lead claim) | factors + alternative | reversible-easy | auto-assign rep |
| Drafting (text, email, packet) | source pointers | reversible-easy | follow-up draft |
| Parsing (event extraction) | source quote + parsed shape | reversible-easy | vendor ETA parser |
| Anomaly flag | data window + comparison | n/a (informational) | stock drift |
| Action (PO, reservation, schedule) | factors + downstream impact | reversible-with-cost or higher | auto-PO on accept |
| Outbound message (customer-visible) | full preview + recipient | irreversible-with-customer-visibility | send drafted reply |

---

## 11. Anti-patterns

- Modal popups that interrupt focus.
- Silent AI actions with no review surface.
- Confidence numbers shown but never calibrated.
- "AI log" hidden in a settings page.
- Re-presenting rejected suggestions unchanged.
- Letting AI set its own priority.
- Letting AI choose its own owner.
- Auto-applying anything customer-visible by default.

---

## 12. What this doc deliberately omits

- Model choice, prompt design, vendor selection.
- Storage and inference plumbing.
- UI component specifics.
- Specific thresholds — those are policy, owned by ops, tunable without architecture changes.
