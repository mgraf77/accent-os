# AIRLOCK — raw brainstorm

I've been thinking about what happens when AccentOS installs a community skill.
Right now we just drop it in skills/ and trust it. That's nuts. I want a real
quarantine layer.

Idea: AIRLOCK. Like a literal airlock on a spacecraft. The skill enters, but it
can't touch real AccentOS state until it's been observed for a while. Maybe like
Docker's read-only mode plus a shadow filesystem.

Stuff I want it to do:
- Observe every file the skill tries to read or write
- Observe every other skill it triggers
- Observe every external API call (ideally block them initially)
- Track success/failure across N runs
- Auto-promote to "trusted" after some threshold of clean runs
- Allow manual promotion with explicit override
- Let me roll back a promotion if a skill misbehaves

Inspirations:
- Docker / chroot / jailshell
- Browser CSP
- Aircraft airlocks
- iOS app sandbox
- Codex review loops (we already have codex-review and community-skill-vet)

Risks I'm thinking about:
- I don't want this to slow down legitimate skill development
- I don't want it to be so heavyweight that nobody uses it
- Need a way to express "this skill SHOULD be allowed to write to MASTER.md"
- Skill that calls another skill via vibe-speak router — need to track propagation
- What about skills that have side effects only on prompt?

Skills already in the registry that touch this:
- community-skill-vet: pre-install audit
- codex-review: peer review of changes
- skill-forge: builds custom skills from external tools
- skill-eval-suite: evaluates skill quality

AIRLOCK is different — it's a runtime policy layer, not an audit. Think of
community-skill-vet as the visa interview, AIRLOCK as the customs hall.

Want this to be an MVP. No fancy infra. Just markdown + JSON + filesystem +
maybe a Node script. Has to work on my Codespace and on my desktop Claude Code.
Should be readable by Claude, Codex, or future agents.

Build me a real spec.
