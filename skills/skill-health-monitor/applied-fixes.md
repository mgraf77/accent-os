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

