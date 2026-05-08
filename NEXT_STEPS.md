# NEXT STEPS
> Updated: 2026-05-08
> To be resumed AFTER governance restructuring phase completes.

---

## Immediate (unblocked, pre-restructure)

### 1. Redeploy Cloudflare Worker (Michael action, local machine)
- Blocker: Codespace/browser can't run `wrangler deploy`
- Location: commit `2dca2a6` has the patched worker at `worker/anthropic-proxy.js`
- Command: from `C:\Users\Michael\Desktop\accent-os` → `git pull origin main` → `wrangler deploy`
- Verify: `fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {method:'POST'}).then(r=>r.text()).then(console.log)` → should return `{"error":"Missing x-api-key header"}`

---

## After governance restructuring

### 2. Instantiate governance primitives per system
Reference: `research/SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md` Part 4
Priority order:
- AccentOS skill RBAC + permission tier model (highest leverage — already partially in place)
- AgentOS multi-agent governance spec
- Jumpstart Ventures governance constitution template
- BetIQ model decision attribution log
- Franchise/operator-kit governance package (standards manual + inspection cadence)

### 3. Merge `claude/self-aware-skill-optimizer-D6jEW` to main (or successor branch)
- No conflicts expected — all changes are new files or additive edits
- Worker proxy fix (commits `2dca2a6` + `969de17`) should also land in main

### 4. First real skill-optimizer cycle
- After merge: run any existing skill (bc-business-review, vibe-speak, etc.)
- Observe first improvement-queue entries populate
- Validate end-of-run gate format in live session

### 5. system-governance skill (optional — post-restructure)
- governance research scored 85 → implementation authorized
- A `skills/system-governance/SKILL.md` could make the governance framework invocable
- Hold until post-restructure to avoid architectural assumptions

---

## Not prioritized (hold indefinitely)
- Generalizing skill-optimizer beyond AccentOS (wait for AgentOS/SideKick architecture decisions)
- Building governance primitives as code (wait for restructure)
- Splitting skills/ into a separate repo (governance restructure decision)
