# Known Issues — 2026-05-08

## Deployment
- **Redesign not live**: The AccentOS redesign artifact (`claude.ai/design/p/019df965-e55f-7c47-bb65-c6c605045b47`) has never been committed to the repo. Live site still shows pre-redesign `index.html`.

## Version Label Drift
- `index.html` `<title>` says "AccentOS v6.10.2" but internal JS references go up to v6.10.65. The title was never updated as features were added. Low priority but confusing.

## Branch Hygiene
- 23 open `claude/*` branches on origin. Most are feature-complete but not formally closed/deleted. No functional risk but creates noise.

## Supabase Integrations Blocked
- Several modules noted in BUILD_PLAN as blocked on M03/M04/M05/M06/M09/M10/M18 (pending Supabase table migrations). Score edits, email send, and several integrations are in-memory only.
