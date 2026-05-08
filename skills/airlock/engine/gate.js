function aggregate(results, elapsedMs) {
  const reasons = [];
  const warnings = [];
  let blocked = false;

  for (const r of results) {
    if (!r.pass && r.severity === 'block') {
      blocked = true;
      reasons.push(`[BLOCK:${r.id}] ${r.reason}`);
    } else if (!r.pass && r.severity === 'warn') {
      warnings.push(`[WARN:${r.id}] ${r.reason || r.warning}`);
    } else if (r.warning) {
      warnings.push(`[WARN:${r.id}] ${r.warning}`);
    }
  }

  return {
    decision: blocked ? 'BLOCK' : warnings.length > 0 ? 'WARN' : 'PASS',
    reasons,
    warnings,
    elapsed_ms: elapsedMs
  };
}

module.exports = { aggregate };
