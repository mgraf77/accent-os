# skill-health-monitor — Ignored Findings

> Findings explicitly ignored by Michael. Subsequent audits will skip these.
> Schema: one entry per ignored finding.

```
### YYYY-MM-DD — [finding-id]
- skill: [name]
- type: [broken-ref | companion-drift | frontmatter-rot | etc.]
- reason: [one sentence why this is intentional]
```

---

### 2026-05-08 — sh-2026-05-08-004 (audit) / task-finding 2
- skill: efficiency-monitor
- type: frontmatter-rot (WARN — body missing `## Trigger Recognition` section)
- reason: auto-active observer skill, alternative section conventions — efficiency-monitor is invoked via `.claude/CLAUDE.md` AUTO-EXECUTE step 1.j (boot) and step 8 (wrap-up), not via natural-language triggers, so the standard `## Trigger Recognition` section does not apply; auto-trigger conditions are documented in Step 0 (Boot) and Step 2 (Session end).

### 2026-05-08 — sh-2026-05-08-005 (audit) / task-finding 2
- skill: efficiency-monitor
- type: frontmatter-rot (WARN — body missing `## Anti-patterns` section)
- reason: auto-active observer skill, alternative section conventions — efficiency-monitor uses `## Hard rules` (5 entries) which is semantically equivalent to `## Anti-patterns`; the rename was deliberately deferred because the rules are framed as positive constraints ("Never interrupt", "No false positives over false negatives") that already match anti-pattern voice without further rewording.

### 2026-05-08 — sh-2026-05-08-006 (audit) / task-finding 3
- skill: vibe-speak
- type: frontmatter-rot (WARN — file size ~14151 tokens, exceeds ~5000-token soft cap)
- reason: auto-active framework skill, alternative section conventions — vibe-speak is the canonical custom-convention example and is the AccentOS-wide communication framework; its size reflects 9 mode definitions, 24 numbered steps, override commands, and adaptive-learning specs that downstream skills + CLAUDE.md depend on as a single source-of-truth. Splitting into `references/` is a known design consideration but deferred — bloat is intentional for read-once-per-session boot performance via lazy-load contract (see Step 1).
