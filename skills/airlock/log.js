const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, 'airlock-log.md');

function formatEntry(payload, decision) {
  const ts = new Date().toISOString();
  const lines = [
    `### ${ts} — ${decision.decision}`,
    `- source: ${payload.source}`,
    `- claimed_branch: ${payload.claimed_branch || 'null'}`,
    `- actual_branch: ${payload._actual_branch || 'null'}`,
    `- claimed_task: ${(payload.claimed_task || 'null').replace(/\n/g, ' ').slice(0, 120)}`,
    `- elapsed_ms: ${decision.elapsed_ms}`
  ];

  if (decision.warnings.length) {
    lines.push(`- warnings:`);
    decision.warnings.forEach(w => lines.push(`  - ${w}`));
  } else {
    lines.push(`- warnings: []`);
  }

  if (decision.reasons.length) {
    lines.push(`- reasons:`);
    decision.reasons.forEach(r => lines.push(`  - ${r}`));
  } else {
    lines.push(`- reasons: []`);
  }

  return lines.join('\n') + '\n\n';
}

async function appendLog(payload, decision) {
  const entry = formatEntry(payload, decision);

  // Initialize log file with header if it doesn't exist
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, '# AIRLOCK Audit Log\n\nAppend-only. Do not edit manually.\n\n---\n\n');
  }

  fs.appendFileSync(LOG_PATH, entry);
}

module.exports = { appendLog };
