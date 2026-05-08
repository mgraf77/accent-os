const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

function getActualBranch() {
  try {
    return execSync('git branch --show-current', { cwd: ROOT, encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

module.exports = { getActualBranch };
