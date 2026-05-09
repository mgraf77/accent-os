# AccentOS Branch Protection Rules
> **Doc type:** Enforcement specification. Per-branch protection policy.
> **Frame:** branch name = role; role = permissions. This document maps roles to enforcement.
> **Authority:** advisory until adopted by Captain; once adopted, configured in GitHub branch-protection settings + repo hooks.

---

## 1. Branch role → protection table

| Role | Branch pattern | Required reviews | Status checks | Allowed pushers | Allowed mergers | Force push | Delete |
|---|---|---|---|---|---|---|---|
| **`main` (Adoption / Execution)** | `main` | 1 (Captain) | parse-checks + boot-smoke + R-AUTO-01/02/03 | Captain | Captain | ❌ forbidden | ❌ forbidden |
| **Canonical** | `claude/governance-*` | 0 | R-AUTO-04 only | Captain, Hub | Captain | ❌ forbidden | ❌ forbidden until merged |
| **Spoke / Convergence** | `claude/<topic>-<suffix>` | 0 | R-AUTO-07 (write-scope) | session author | Captain (via PR) | ❌ forbidden | only after archive-tag |
| **Hub feat** | `claude/feat-*` | 1 (Captain) | parse-checks + R-AUTO-09/10/13/15 | session author | Captain | ❌ forbidden | after merge |
| **Archive** | tags + retained refs | n/a | n/a | none | n/a | ❌ | ❌ |

---

## 2. Enforcement layers (defense in depth)

A push must clear **all** layers in order:

```
Layer 1: client pre-commit hook    (advisory; user-bypassable but logged)
Layer 2: client pre-push hook      (harder to bypass; warns aggressively)
Layer 3: server pre-receive hook   (binding; not bypassable without admin)
Layer 4: GitHub branch protection  (binding; UI-configured)
Layer 5: PR review gate            (binding; human)
Layer 6: post-merge audit          (advisory; flags drift)
```

Bootstrap-tier deployments use Layers 1, 2, and 5. Enterprise-tier adds Layers 3, 4, 6.

---

## 3. Per-role rule mapping (compact)

### `main`
- **Block:** any direct push that is not a fast-forward merge from an authorized branch.
- **Block:** force-push (R-AUTO-08).
- **Block:** delete.
- **Block:** commit modifying `module_modes.json` together with any other file (R-AUTO-03).
- **Block:** commit modifying any canonical file together with any other file (R-AUTO-04).
- **Block:** commit modifying frozen-scope files (R-AUTO-01) without `--allow-frozen-edit`.
- **Require:** parse-clean `module_modes.json` (R-AUTO-02), boot-smoke green, Cloudflare last deploy green at merge time.

### `claude/governance-*` (Canonical)
- **Block:** non-canonical file edits in same commit (R-AUTO-04).
- **Block:** force-push.
- **Allow:** `--allow-frozen-edit` for explicit Captain canonical work.
- **Require:** Captain authorship signature in commit body (string `Captain:` or co-author tag).

### `claude/<topic>-<suffix>` (Spoke / Convergence)
- **Block:** writes outside `docs/design/`, `SESSION_LOG.md`, `WORK_IN_PROGRESS.md` append (R-AUTO-07).
- **Block:** any `module_modes.json` edit.
- **Block:** any canonical-file edit.
- **Block:** force-push.
- **Allow:** any `docs/design/*.md` edit (subject to R-AUTO-01 if frozen).

### `claude/feat-*` (Hub feat)
- **Block:** more than one `module_modes.json` flip per commit (R-AUTO-13).
- **Block:** flip-without-inverse-revert-text in commit body (R-AUTO-15 → warn, not block, by default).
- **Block:** flip toward `live` without SESSION_LOG Captain-go (R-AUTO-10).
- **Block:** flip toward `deprecated` without Captain-go (R-AUTO-12).
- **Block:** subsystem extraction + flip in same commit (R-AUTO-03 generalization).
- **Require:** branch deletes after merge.

---

## 4. Anti-bypass rules

These prevent common ways agents (or humans) might route around protection:

| Bypass | Counter-measure |
|---|---|
| `git commit --no-verify` | Server-side pre-receive duplicates the rule; client bypass loses meaning |
| Renaming a frozen file | R-AUTO-01 checks file *path* AND *content fingerprint* of frozen list |
| Squash-merging multiple flips | R-AUTO-13 runs against post-merge diff, not commit history |
| Editing canonical from a spoke | R-AUTO-07 + R-AUTO-04 catch on push |
| Force-push to delete history | R-AUTO-08 server-side |
| Creating a non-conforming branch | R-AUTO-06 warn-only; sibling rule rejects merge to `main` |
| Bundling flip with code in feat | R-AUTO-03 catches single-file constraint violation |

---

## 5. Captain override mechanism

When a hook blocks an action Captain wants to permit:

```
git -c hooks.governance.override=Captain commit ...
```

The override:
- Is logged (commit body annotation `governance-override: Captain` is required).
- Is captured in `.governance-flags` for end-of-session review.
- Does **not** bypass server-side `main` protection — those still require PR.
- Is not available to Hub or Spoke sessions; only Captain.

The override is the explicit escape hatch. It is **logged**, never silent. Frequent use (>3 in a session) flags a rule that is too tight.

---

## 6. Branch creation policy

A new `claude/*` branch may be created only when:
- The pattern matches one of the four allowed roles (§1).
- No other open `claude/*` branch covers the same topic (Constitution Article X.5: one Spoke per topic).
- Captain explicitly authorized the topic OR the topic is a continuation of an open Captain decision (queue Q-N).

Creation is not enforced (Git allows any branch name). The enforcement runs at first-push and at merge: a branch with a non-conforming name **cannot merge to `main`**.

---

## 7. Branch deletion policy

| Branch | Deletion authority | Conditions |
|---|---|---|
| `main` | none | never |
| `claude/governance-*` | Captain | only after merge to `main` and tag preservation |
| `claude/<topic>-<suffix>` | Captain or session author | only after archive-tag if work is preserved-by-reference |
| `claude/feat-*` | Captain | after merge to `main`; default policy |
| Archive tags | Captain only | extremely rare |

Default: keep branches retained even after merge. Storage is cheap; history is irreplaceable.

---

## 8. PR review requirements

| Target branch | Reviewer required | Auto-checks must pass |
|---|---|---|
| `main` | Captain (1) | all R-AUTO rules in scope |
| canonical merging to `main` | Captain (1) | R-AUTO-04 |
| feat merging to `main` | Captain (1) | R-AUTO-09/10/13/15 |
| spoke merging to `main` | Captain (1) | R-AUTO-01 (frozen-doc check), R-AUTO-07 |

Captain reviews are not delegable.

---

## 9. Failure mode coverage

| Failure (from `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md`) | Rule(s) that prevent / detect |
|---|---|
| F4 role visibility breach | R-AUTO-10, R-AUTO-12, PR review |
| F7 `module_modes.json` corruption | R-AUTO-02 |
| F10 cross-session governance conflict | R-AUTO-04 + R-AUTO-07 + branch-naming layer |
| (governance drift, post-freeze edit) | R-AUTO-01 + frozen-list fingerprint |
| (force-push history loss) | R-AUTO-08 + server-side |

F1, F2, F3, F5, F6, F8, F9 are runtime failures and are not addressable by branch protection — they are addressed by readiness scoring + golden-path checklists + cachebust mechanics.

---

## 10. Implementation cost tiers

| Tier | What is configured | Cost |
|---|---|---|
| **Bootstrap** | Layer 1 + Layer 2 client hooks; manual PR review on `main` | <1 session for hook authoring; Captain-only |
| **Standard** | Add Layer 5 PR templates that surface the rules; weekly stale-branch flag run | 1 session |
| **Enterprise** | Layer 3 server-side hooks (requires self-hosted git or GitHub Enterprise); Layer 4 GitHub branch protection UI fully configured; Slack/email alerts on rule fires | multi-session; only when ROI clear |

Bootstrap is sufficient for the current single-Captain operation.

---

*End of ACCENTOS_BRANCH_PROTECTION_RULES.md — per-branch enforcement policy.*
