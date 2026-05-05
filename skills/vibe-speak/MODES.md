# vibe-speak — modes index

Vibe-speak ships as a **mode framework**. One mode is always active. Switching is a single phrase.

Default mode for Michael: **`vibe`** (auto-activated on every Claude Code session via `.claude/CLAUDE.md`).

---

## Mode catalog

| Mode | File | Voice | Token reduction | When |
|---|---|---|---|---|
| **vibe** | `modes/vibe.md` | Conversational native English, register-mirrored, jargon-stripped | ~50–60% | Default. Code work, status, reasoning. |
| **caveman** | `modes/caveman.md` | Grunt speech, drop articles, fragments | ~75% | Quick status pings, max compression |
| **gsd** | `modes/gsd.md` | Zero prose, action-only, status-block end-of-turn | ~85% | Long autonomous build sessions |
| **executive** | `modes/executive.md` | Full grammar, professional, terse | ~30% | Stakeholder writing, customer comms |
| **pair** | `modes/pair.md` | Pair-coding companion, proactive trap-spotting | ~30% | Design / debug / unfamiliar areas |
| **teach** | `modes/teach.md` | Educational with comprehension checks | 0% (sometimes longer) | Learning new concepts |
| **vibesplain** | `modes/vibesplain.md` | Self-aware mansplain — narrates every action with humor | **−30% (longer)** | Long autonomous builds where you want presence over efficiency |
| **wenyan** | `modes/wenyan.md` | Telegraphic ultra-compression | ~85% | Curiosity / fun |
| **raw** | `modes/raw.md` | Default Claude, vibe-speak fully OFF | 0% | A/B compare, sharing with non-calibrated readers |

---

## How to switch

**Natural language** (preferred):
- `caveman mode` / `go caveman` — switch to caveman
- `gsd` / `get shit done` / `let's get shit done` — switch to gsd
- `pair` / `pair up` / `coding buddy` — pair
- `teach me` / `walk me through` / `teach mode` — teach
- `vibesplain` / `mansplain mode` / `narrate mode` / `play-by-play` — vibesplain
- `formal` / `exec mode` / `stakeholder mode` — executive
- `vibe` / `vibe mode` / `back to vibe` — vibe (the default)
- `raw` / `off` / `normal mode` — raw

**Slash command:**
- `/mode [name]` — exact match
- `/mode list` — print this catalog
- `/mode current` — print active mode + intensity

**Mid-segment switch:**
- `exec for the email, then vibe back` — applies executive to the next segment, returns to vibe after

---

## Mode + intensity

Modes set the *character* of output. **Intensity** (5 levels — soft / vibe / tight / status / one-liner from SKILL.md Step 1) further dials compression within a mode.

Example: `vibe` mode + `tight` intensity = vibe voice, but more aggressively compressed prose.

Modes with their default intensities:

| Mode | Default intensity | Floor | Ceiling |
|---|---|---|---|
| vibe | vibe | one-liner | soft |
| caveman | tight | one-liner | tight |
| gsd | status | status | one-liner |
| executive | soft | tight | soft (full grammar; no further loosening) |
| pair | vibe | tight | soft |
| teach | soft | vibe | soft (no further loosening — teach is intentionally verbose) |
| vibesplain | soft | vibe | soft (intentionally verbose; further loosening is more asides not more facts) |
| wenyan | one-liner | one-liner | one-liner |
| raw | n/a (default Claude) | n/a | n/a |

`/vibe tighter` and `/vibe looser` move within the mode's allowed intensity range. They don't change the mode itself.

---

## Auto-activation (default-on)

Per `.claude/CLAUDE.md` AUTO-EXECUTE step, vibe-speak activates with mode = `vibe` on every Claude Code session start. No trigger phrase needed. Michael switches modes whenever the situation calls for it.

To **opt out** for a session: `raw mode` after start. Persists for that session only; next session re-activates default.

To **change the default** permanently: `/vibe set default mode [name]` — writes to `user-profile.md` `default_mode:` field. Future sessions auto-activate that mode.

---

## Mode-specific hard-keeps

Hard-keep list from SKILL.md Step 3 + user-profile.md applies to **all modes** without exception. No mode is allowed to translate code, paths, SQL, AccentOS proper nouns. Compression applies to prose only.

---

## Custom modes

If a mode in the catalog isn't quite right, create a new one:

1. `skills/vibe-speak/modes/[your-mode].md`
2. Follow the structure of any existing mode (Voice / Activation / Voice rules / Hard-keeps + safety / Differences / Example / When-to-use)
3. Add a row to this MODES.md table
4. Add a triggers entry to the user-profile.md `custom_modes:` field

Custom modes survive `/vibe reset`. They're additive, not replacement.
