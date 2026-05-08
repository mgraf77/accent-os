const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const WIP_PATH = path.join(ROOT, 'WORK_IN_PROGRESS.md');
const MAX_CHARS = 2000;

function getWipState() {
  try {
    const raw = fs.readFileSync(WIP_PATH, 'utf8');
    if (!raw.trim()) return null;

    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    const lastEntry = lines[lines.length - 1] || null;

    return {
      raw: raw.length > MAX_CHARS ? raw.slice(-MAX_CHARS) : raw,
      last_entry: lastEntry
    };
  } catch {
    return null;
  }
}

module.exports = { getWipState };
