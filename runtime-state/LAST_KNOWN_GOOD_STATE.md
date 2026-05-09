# LAST KNOWN GOOD STATE (LKG)

> Provisional seed at P1. Bumped only on verified-green Clean Pause checkpoints.
> tag: CORE

## Meta
checkpoint_id:    lkg-0001
captured_at:      2026-05-09
captured_by_mode: Clean Pause Stabilization (P1 bootstrap)

## Commit
sha:    940e7f8
branch: main
tag:    (none)
parent: (the commit immediately preceding the CORS proxy work)

## Verified-Green Evidence
- Quote Generator v2 UI shipped and exercised at this commit (manual workflow path).
- internal-meetings v1.0 (57940d6) operational at this commit.
- earlier shipped features (vendor 360, customer 360, prompt-queue, efficiency-monitor)
  not regressed at this commit.

## State Snapshot Pointers
At lkg-0001 the canonical state layer did not exist yet. Pointers from the perspective
of THIS commit (95bcc8a) describing the LKG operational scope:
- runtime-state/CANONICAL_RUNTIME_STATE.md @ cp-0001 (this seed)
- runtime-state/CURRENT_PRIORITIES.md @ cycle-2026-W19
- ACTIVE_RISKS.md @ cycle-2026-W19

## Known Caveats (do not pretend it is perfect)
- AI Parse Notes path (Quote Gen → Anthropic) was NOT functional from the browser at
  940e7f8. Browser-side calls were CORS-blocked. AI Parse only became reachable after
  the worker proxy was added (87f20a2), which is currently broken pending redeploy.
- Therefore "verified scope" of this LKG = Quote Gen v2 UI + manual flow + CSV export +
  internal-meetings + all earlier shipped features. NOT AI Parse Notes.
- This is a P1 bootstrap LKG. Promote to a stronger LKG once the worker is redeployed
  and AI Parse is verified end-to-end.

## Restore Procedure
```bash
# Catastrophic rollback only. For a worker-only issue, prefer reverting the worker
# commits without disturbing the rest of the tree.
git fetch origin
git checkout main
git reset --hard 940e7f8         # destructive — confirm with operator first
# Redeploys required after restore:
#   - Cloudflare Worker: not present at this LKG (no proxy code). AI Parse will be
#     CORS-blocked from browser. Acceptable for non-AI workflows.
#   - Cloudflare Pages: redeploy current main if pages-deployed assets diverge.
# Secrets to re-check (do not store here):
#   - sessionStorage['aos-api'] in user's browser (client-side only).
```

## When to Bump LKG
A new LKG may be written when ALL hold:
- All P0/P1 priorities green or explicitly suspended.
- No CRIT/HIGH risks open without mitigation in flight.
- A Clean Pause has been completed.
- Verified-green evidence is recorded (test pass / manual smoke / deploy reachable).

Earliest realistic LKG-0002 candidate: after R1 (worker-redeploy) is closed and one
end-to-end Parse Notes call succeeds.
