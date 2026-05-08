# skill-health-monitor — Applied Fixes Ledger (append-only)

> One entry per fix applied per run. Never edit prior entries.
> Schema: see `SKILL.md` Step 8.

---

### 2026-05-08 — finding sh-2026-05-08-001
- skill: email-drafter
- type: broken-ref (stale "future skill" annotation)
- before: `coop-claim-drafter` and `action-queue` annotated as `future skill` in companion list
- after: `future skill` annotations removed; both skills now exist in registry
- file: skills/email-drafter/SKILL.md (lines 215-216)
- verified: yes — both skills exist in skills/_index.md as of 2026-05-08

### 2026-05-08 — finding sh-2026-05-08-003 (audit) / task-finding 1
- skill: efficiency-monitor
- type: frontmatter-rot (ERROR — description missing "AccentOS"/"Accent Lighting")
- before: description opened with "Always-on observer that watches Michael ↔ Claude..."
- after: description opens with "AccentOS always-on observer that watches Michael ↔ Claude..."
- file: skills/efficiency-monitor/SKILL.md (line 4)
- verified: yes — `grep -c AccentOS skills/efficiency-monitor/SKILL.md` > 0; description still >250 chars; minimal additive change preserves shape

### 2026-05-08 — finding sh-2026-05-08-002 (audit) / task-finding 4
- skill: windward-bridge
- type: broken-ref (preflight-check.sh referenced but does not exist)
- before: `bash /home/user/accent-os/skills/windward-bridge/references/preflight-check.sh` invocation in Step 0
- after: invocation removed; replaced with "Run the preflight check inline using the steps documented in `references/preflight-check.md`..." plus an explicit "future artifact, deferred until M03 + M10 unblock" note
- file: skills/windward-bridge/SKILL.md (lines 74-78 → collapsed to single paragraph at line ~75)
- resolution-path: option B (drop the bash invocation + rephrase to point at the existing `.md`)
- rationale: the `.md` already documents the checks; the skill is BLOCKED on M03+M10 so a runnable script would have nothing to connect to; explicit "future" note preserves the intent without claiming an artifact that doesn't exist
- verified: yes — `references/preflight-check.md` exists; no remaining `.sh` reference in windward-bridge/SKILL.md

