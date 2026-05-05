# vibe-speak feedback log

> Append-only log of explicit corrections from Michael during a session. Distinct from `observation-log.md` (which captures inferred signals). This file logs *direct, explicit* feedback Michael gives via the override commands or in plain-language correction.

## How to use this file

**Read (session start):** Apply every entry with `applied: no` to the current session — these are corrections that haven't yet been baked into `user-profile.md`.

**Write (during session):** Append every time Michael:
- Runs an override command (`/vibe tighter`, `/vibe stop translating X`, etc.)
- Says "stop doing X" / "do Y instead" / "use the technical term" / "drop the [filler]"
- Reverts a vibe-translated word back to the technical term in his own next message

**Self-optimize:** Every entry feeds the next `user-profile.md` revision proposal. Unlike observation-log entries (which need ≥3 matches), feedback-log entries propose profile changes after **a single occurrence** — Michael said it directly, no inference needed.

---

## Entry schema

```
### fb-NNN — YYYY-MM-DD HH:MM — [feedback_type]
- feedback_type: command | correction | revert
- michael_said: "[exact quote or command]"
- prior_behavior: [what Claude was doing]
- new_behavior: [what Claude should do going forward]
- scope: this_session | permanent
- applied: yes | no  (yes = baked into user-profile.md; no = pending next profile revision)
- profile_section_to_update: [section name in user-profile.md]
```

`NNN` is sequential, zero-padded to 3 digits.

---

## Active feedback

(none yet — populated as Michael uses the skill)

---

## Applied feedback (graveyard)

(none yet — populated when feedback is baked into user-profile.md)
