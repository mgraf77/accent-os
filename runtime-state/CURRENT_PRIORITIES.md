# CURRENT PRIORITIES — cycle-2026-W19

> Top 1–5 active priorities. Anything not here lives in DER.
> tag: CORE

## Cycle
id:     cycle-2026-W19
window: 2026-05-04 → 2026-05-10
opened: 2026-05-09 (mid-cycle bootstrap from P1 seed)

## Ranked List

P1. Unblock Quote Generator AI Parse        id: pri-worker-redeploy
    owner:   Michael (deploy from local)
    success: `fetch('https://accentos-anthropic-proxy.../v1/messages',{method:'POST'})`
             returns `{"error":"Missing x-api-key header"}` (i.e. new code live),
             AND a real Parse Notes call returns 200.
    blocker: requires Michael to run `wrangler deploy` from local terminal.
    source:  WORK_IN_PROGRESS

P2. Verify Anthropic model id                id: pri-model-id-verify
    owner:   Michael
    success: `aiParseNotes` model id confirmed live (or replaced) and one Parse
             Notes call returns 200 in the browser.
    blocker: depends on P1 (need working proxy first).
    source:  WORK_IN_PROGRESS step 3

P3. P1 stabilization layer hardening         id: pri-p1-hardening
    owner:   Claude (this session)
    success: this commit lands; canonical state seeded; CLAUDE.md patch proposed
             (not applied); validation report = ACCEPT or ACCEPT WITH SIMPLIFICATION.
    blocker: none (in-flight).
    source:  Session 8 directive

P4. Apply CLAUDE.md auto-execute amendment   id: pri-claude-md-canonical-read
    owner:   Michael (review + approve)
    success: CLAUDE.md AUTO-EXECUTE includes "Read CANONICAL_RUNTIME_STATE.md before
             BUILD_PLAN_CLAUDE.md"; one full session runs cleanly with that order.
    blocker: depends on Michael review of P1 hardening.
    source:  STABILIZATION_LAYER §9 action 3

(slot 5 reserved — do not fill speculatively)

## Recently Demoted
(none — first cycle under canonical state)

## Promotion Sources
- pri-worker-redeploy   ← WIP (carry-over from prior session)
- pri-model-id-verify   ← WIP (carry-over)
- pri-p1-hardening      ← Session 8 user directive
- pri-claude-md-canonical-read ← der-0001 promotion
