const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const HANDOFF_PATH = path.join(ROOT, 'skills/vibe-speak/session-handoff.md');
const MAX_CHARS = 2000;

// Only extract branch from lines with explicit "branch:" or "on branch" context.
// Avoids false positives from file paths like ".claude/CLAUDE.md".
const BRANCH_PATTERNS = [
  /^.*\bbranch[:\s]+([a-zA-Z0-9/_.-]+)/im,
  /\bon\s+branch\s+([a-zA-Z0-9/_.-]+)/i
];

function extractClaimedBranch(content) {
  for (const pattern of BRANCH_PATTERNS) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function getHandoffState() {
  try {
    const raw = fs.readFileSync(HANDOFF_PATH, 'utf8');
    if (!raw.trim()) return null;

    const capped = raw.length > MAX_CHARS ? raw.slice(-MAX_CHARS) : raw;
    return {
      raw: capped,
      claimed_branch: extractClaimedBranch(raw)
    };
  } catch {
    return null;
  }
}

module.exports = { getHandoffState };
