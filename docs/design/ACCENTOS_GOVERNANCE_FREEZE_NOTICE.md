# AccentOS Governance Freeze Notice
> **Status:** Governance planning is FROZEN pending Captain action.
> **Branch:** `claude/accentos-rollout-planning-UTElf`
> **Freeze commit:** `1db969b354d83a0e365b62f66ab735c396014b45` (the C-priority pass HEAD; this notice's commit is the formal freeze marker).
> **Frozen at:** end of C-priority alignment pass.
> **Authority:** spoke session — non-authoritative; Captain confirms the freeze on adoption.

---

## What is frozen

The 18 spoke planning files in `docs/design/` (rollout strategy, reconciliation, escalation matrix, readiness system, multi-session constitution, freeze protocol, failure scenarios, terminology, contradictions, freeze snapshot, index, canonical delta, freeze notice (this), merge checklist, branch lifecycle, multi-session discoveries, Captain decision queue, plus 7 test checklists incl. template under `docs/design/test/`).

These documents collectively define the shell-v2 rollout governance scope. They are **complete to the limit of non-Captain authority** as of the C-priority pass.

---

## What remains (Captain-only)

1. **R-02 worker-proxy mitigation.** `wrangler deploy` of `2dca2a6` from Captain's local machine; verify Parse Notes returns 200 on a golden-path call.
2. **D-priority canonical edits** to `MODULE_OWNERSHIP_MAP.md` (add `js/shell_v2/*.js` STAY row) and `MODULE_MODES.md` (add module-key naming convention `<area>_<surface>_<version>`) on a `claude/governance-*` branch.
3. **Adoption merge** of this branch to `main` (after canonical `claude/governance-snapshot-prep-k3dBs` per multi-session constitution Article IV).
4. **Rollout Phase 1 authorization** — explicit Captain go logged in `SESSION_LOG.md` to begin shell-v2 beachhead.

Nothing else is on the critical path. See `ACCENTOS_CAPTAIN_DECISION_QUEUE.md` for the full ranked list.

---

## What future sessions MAY do (after freeze)

- **Read** any frozen doc.
- **Cite** any frozen doc by path + section.
- **Reference** the freeze commit hash when documenting "as of freeze state."
- **Author** a new spoke planning artifact only if it adds *non-overlapping* operational value (e.g., a per-incident runbook for a newly-discovered failure mode); never re-author governance.
- **Append** to `SESSION_LOG.md` per `MASTER.md` rules.

---

## What future sessions MAY NOT do (during freeze)

- ❌ Edit any of the 18 frozen spoke planning files.
- ❌ Author parallel versions of any frozen file (e.g., a "v2 escalation matrix").
- ❌ Re-derive contradictions or restart contradiction audits.
- ❌ Reopen "what should the readiness scoring be" or any settled question.
- ❌ Edit canonical governance files (always Captain-only via `claude/governance-*` branches).
- ❌ Begin shell-v2 implementation, mount any `js/shell_v2/*.js`, flip `module_modes.json`, or modify `index.html`/`worker/`/SQL.
- ❌ Add new governance subsystems, scoring axes, phase ladders, or authority classes.

Violations are reverted on detection per multi-session constitution Article V.

---

## Governance authority hierarchy (compact)

```
1. Captain (Michael)                      — final on everything
2. Canonical governance docs              — on restructure scope
   (claude/governance-snapshot-prep-k3dBs)
3. MASTER.md §12 hard rules               — on operational hard rules
4. This frozen spoke planning set         — on shell-v2 rollout scope
5. module_modes.json                      — on live rollout state
6. SESSION_LOG.md / WIP.md                — on session/operational state
```

When two sources conflict → higher precedence wins. Equal precedence → recency-of-merge.

---

## Anti-duplication rule

Future rollout / runtime / mobile / shell-v2 sessions **must** consult and cite the frozen spoke planning set rather than re-derive governance. Specifically:

- Need a freeze trigger? → cite `ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md` §1.
- Need authority? → cite `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` §1.
- Need a readiness threshold? → cite `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` §7.
- Need to know who decides? → cite `ACCENTOS_GOVERNANCE_RECONCILIATION.md` §1 + §3.
- Need term meaning? → cite `ACCENTOS_GOVERNANCE_TERMINOLOGY.md`.

Re-authoring any of the above is governance sprawl and is reverted.

---

## Anti-governance-sprawl rule

The rule of thumb: **if a question is already answered by a frozen doc, do not invent a new doc to answer it again.** New governance artifacts require:

1. A demonstrably non-overlapping concern (cite existing docs you searched).
2. Captain authorization on a `claude/governance-*` branch.
3. A single-commit single-file edit per multi-session constitution Article X.

The frozen set is intentionally finite. Three articles in a row needing exception → fix the article, not the practice.

---

## Unfreeze conditions

The freeze is lifted (and these planning docs become editable again as a normal spoke set) only when:

- Captain explicitly authorizes a re-opening (logged in SESSION_LOG.md), **or**
- The branch is merged to `main` and a new spoke session is opened on a fresh `claude/<topic>-*` branch.

Until either happens, this branch's spoke planning content is read-only for all sessions other than Captain.

---

*End of ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md — operational freeze declaration.*
