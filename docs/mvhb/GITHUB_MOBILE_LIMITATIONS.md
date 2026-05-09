GITHUB MOBILE LIMITATIONS
Operational Constraints for AccentOS Mobile Workflow
Version: 1.0 — 2026-05-09

---

PURPOSE

This document records what GitHub iOS can and cannot do.
These are operational constraints, not bugs. Design decisions
in the MVHB system depend on knowing exactly where GitHub iOS
fails so those failures can be designed around.

Reference device: iPhone 13 Pro Max, iOS 17+, GitHub iOS app.

---

SUPPORTED OPERATIONS

These work reliably on GitHub iOS and can be included in
standard phone-first workflows.

FILE READING
  Read any markdown file — plain text, lists, labeled fields,
  blockquotes, horizontal rules all render correctly.
  Tap repo → file → renders on first view.
  Copy any text: long-press + select + Copy.

COMMIT HISTORY
  View commit list: Code tab → Commits.
  See full commit message on tap.
  See which files changed (list view, not diff by default).
  Tap any file in the commit to see its diff.
  Commit hashes are visible and tappable (copies to clipboard).

BRANCH LIST
  Tap branch selector on Code tab to see all branches.
  Branches are listed alphabetically.
  No visual indicator of "current active branch" from user POV.
  Tap any branch to switch the file view to that branch.
  Maximum useful branch name: 30 characters before truncation.

PULL REQUESTS
  PR list: Pull Requests tab → Open / Closed / All.
  Read PR description: renders full markdown.
  Read PR diff: swipe left/right to navigate files.
  Add a review comment: tap + hold on a diff line.
  Approve a PR: Review Changes button → Approve → Submit.
  Request changes: same flow, select Request Changes.
  Merge a PR: Merge Pull Request button → Confirm.
  Close a PR: Close Pull Request button.
  View CI status: pass/fail badge visible on PR header.

SEARCH
  Global search (magnifying glass icon):
  - Search file names across repo
  - Search file contents (GitHub Code Search)
  - Search commits by message text
  - Search issues and PRs by title

ISSUES
  Read issues: Issues tab → list view.
  Create an issue: plus icon → Issue.
  Comment on issue: text field at bottom.
  Close an issue: Close Issue button.
  Apply labels: tappable label list in issue detail.

---

UNSUPPORTED OPERATIONS

These do not work on GitHub iOS or work so unreliably they
should not be included in any standard mobile workflow.

FILE EDITING
  The in-app editor exists but is unreliable on iOS.
  Autocorrect attacks code (capitalizes, adds punctuation).
  Commit message defaults to "Update [filename]" with no body.
  Multi-line editing loses cursor position on scroll.
  DO NOT use the GitHub iOS editor for any operational file.
  DO NOT use it for index.html, any .js file, or any .md
  file that contains code blocks or technical content.

MERGE CONFLICT RESOLUTION
  GitHub iOS shows "This branch has conflicts" but provides
  no conflict resolution UI.
  The only option is "Resolve conflicts" which opens the web
  editor — same limitations as file editing above.
  DO NOT attempt merge conflict resolution on mobile.

CI LOG VIEWING
  PR view shows pass/fail status but not the log content.
  Tapping the CI status badge opens a modal with check names
  and pass/fail only — no log lines.
  To see CI logs: desktop browser or terminal required.
  Workaround: ask Claude to pull CI status via gh CLI.

ACTIONS MANUAL TRIGGER
  The Actions tab exists on GitHub iOS.
  "Run workflow" button appears for manual-trigger workflows.
  In practice: the form fields required to trigger a workflow
  are not reliably renderable on mobile. Success rate is low.
  DO NOT rely on GitHub iOS to manually trigger Actions.

WIDE DIFFS
  Files with long lines (80+ chars per line) wrap in diff view.
  Wrap makes added/removed lines hard to distinguish.
  Side-by-side diff: not available on GitHub iOS.
  For wide diffs (index.html changes): desktop required.

LARGE FILE NAVIGATION
  Files longer than ~200 lines require extensive scrolling.
  No equivalent of Ctrl+F within a file view.
  No line-number jump.
  No anchor navigation (even with #heading links in markdown).
  For large files (index.html at 7000+ lines): desktop required.

BRANCH COMPARISON
  No "compare branches" UI on GitHub iOS.
  Cannot see a diff between two arbitrary branches.
  Workaround: open a draft PR between the branches, read the
  diff there, then close the PR without merging.

GITHUB ACTIONS SECRETS / SETTINGS
  Repository Settings are not accessible on GitHub iOS app.
  Secrets, branch protection rules, webhooks: desktop only.

CODE REVIEW ON LARGE PRs
  GitHub iOS PR diff shows one file at a time.
  For PRs with 20+ files: navigating all files is painful.
  No "mark file as reviewed" mechanism on mobile.
  For large PR reviews: desktop strongly preferred.

---

DESIGN IMPLICATIONS

These constraints directly shaped MVHB file format decisions.

IMPLICATION 1 — No markdown tables in mobile-read files
  GitHub iOS renders tables as horizontal scrollers.
  Rightmost columns are clipped on 428px viewport.
  Design response: all operational files use flat labeled
  fields or flat numbered lists — never pipe tables.

IMPLICATION 2 — Code blocks above the fold are invisible
  GitHub iOS collapses code blocks on long files.
  A fenced block in line 1-5 of a file may or may not render
  expanded depending on file length and iOS version.
  Design response: the most critical fields in SESSION_HANDOFF.md
  are bare labeled fields, not inside a fenced block.

IMPLICATION 3 — Branch name 30-char limit
  The branch selector truncates at approximately 30 chars.
  Branch names longer than this are unreadable on mobile.
  Design response: naming convention enforces 30-char max.

IMPLICATION 4 — No active-branch indicator on GitHub iOS
  GitHub iOS does not visually mark the branch that a given
  developer is "working on" — it shows the default branch.
  Design response: STATUS.md BRANCH field is the authoritative
  mobile-visible branch indicator.

IMPLICATION 5 — CI log access requires desktop
  CI failure details are invisible on GitHub iOS.
  Design response: when CI fails, the mobile SOP is to send
  "check CI failure" to Claude, who reads logs via gh CLI
  and returns the failure reason in plain text.

IMPLICATION 6 — File depth maximum 2 levels
  Files 3+ directories deep require 8+ taps to reach.
  Design response: all five operational files live at repo
  root or one level deep (docs/mvhb/ for specs only).
  Docs that Michael reads on mobile: root level only.

IMPLICATION 7 — No file editing on mobile
  GitHub iOS editor is not reliable for code or structured
  markdown. Any edit via the iOS editor risks corrupting
  operational files.
  Design response: Michael never writes to operational files
  directly. Claude owns all writes. If Claude is unavailable,
  the fallback is to send a relay prompt at next availability.

---

REQUIRED WORKAROUNDS

These are the operational workarounds for the most common
GitHub iOS limitations.

WORKAROUND 1 — Branch visibility
  Problem: GitHub iOS doesn't show active branch.
  Workaround: read STATUS.md BRANCH field (root, 2 taps).
  Or send "what branch" to Claude.

WORKAROUND 2 — CI failure details
  Problem: CI log content not visible on GitHub iOS.
  Workaround: send "check ci failure on PR [N]" to Claude.
  Claude runs gh pr checks + gh run view via terminal.
  Returns plain-text failure reason in one paragraph.

WORKAROUND 3 — Large file navigation
  Problem: no in-file search on GitHub iOS.
  Workaround: all mobile-critical content in files under 30
  lines. For large files, ask Claude to extract the relevant
  section: "what does line 344 of index.html say"

WORKAROUND 4 — Wide table in existing files
  Problem: PROMPT_QUEUE.md legacy table format is unreadable.
  Workaround: flat numbered list format (see MVHB_PHASE_0_SPEC.md).
  Migration required: existing PROMPT_QUEUE.md reformatted
  on next session start.

WORKAROUND 5 — Merge conflict on mobile
  Problem: no conflict resolution UI on GitHub iOS.
  Workaround: never create a situation where mobile-initiated
  work results in a merge conflict. Claude always rebases or
  fast-forwards before pushing. If a conflict appears, the
  relay prompt is: "merge conflict on [branch] — resolve and
  push" and Claude handles it from terminal context.

WORKAROUND 6 — Code block session handoff
  Problem: fenced blocks in SESSION_HANDOFF.md collapse.
  Workaround: critical fields (ACTIVE, MODE, MID-TASK, LAST,
  NEXT) are bare labeled fields before the first code block.
  Full detail in the block for Claude to parse, not for Michael
  to read on mobile.

---

END OF SPEC
