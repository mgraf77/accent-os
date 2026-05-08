function branchMatch(payload) {
  const claimed = payload.claimed_branch;
  const actual = payload._actual_branch;

  if (!claimed) {
    return {
      pass: true,
      warning: 'branch-match skipped: could not extract claimed_branch from session-handoff.md'
    };
  }

  if (!actual) {
    return {
      pass: true,
      warning: 'branch-match skipped: git branch --show-current returned null'
    };
  }

  if (claimed === actual) {
    return { pass: true };
  }

  return {
    pass: false,
    reason: `Branch mismatch: session-handoff.md recorded "${claimed}" but git reports "${actual}"`
  };
}

function wipCoherence(payload) {
  const wip = payload.claimed_wip_status;

  if (!wip) {
    return {
      pass: true,
      warning: 'wip-coherence skipped: WORK_IN_PROGRESS.md missing or empty'
    };
  }

  const lines = wip.split('\n').filter(l => l.trim());
  if (!lines.length) {
    return {
      pass: true,
      warning: 'wip-coherence: WORK_IN_PROGRESS.md is present but has no content'
    };
  }

  const lastLine = lines[lines.length - 1];
  const lastLineCompleted = /completed|done|✓|✅|DONE|COMPLETE/i.test(lastLine);
  const hasPendingAbove = /\[ \]|TODO:|pending|in.progress|WIP/i.test(wip.slice(0, -lastLine.length));

  if (lastLineCompleted && hasPendingAbove) {
    return {
      pass: true,
      warning: 'wip-coherence: last line signals completion but pending items detected earlier in file'
    };
  }

  return { pass: true };
}

function injectionPattern(payload, patterns) {
  const fields = [
    payload.claimed_task,
    payload.claimed_branch,
    payload.claimed_wip_status,
    payload._handoff_raw,
    payload.source
  ].filter(Boolean);

  const allText = fields.join('\n').toLowerCase();
  const matches = patterns.filter(p => allText.includes(p.toLowerCase()));

  if (matches.length > 0) {
    return {
      pass: false,
      reason: `Injection pattern detected in payload: "${matches.slice(0, 3).join('", "')}"`
    };
  }

  return { pass: true };
}

async function runChecks(rules, payload, patterns) {
  const checkMap = { branchMatch, wipCoherence, injectionPattern };
  const results = [];

  for (const rule of rules) {
    const fn = checkMap[rule.check];
    if (!fn) {
      results.push({ id: rule.id, severity: rule.severity, pass: true, warning: `Unknown check function: ${rule.check}` });
      continue;
    }

    const result = fn(payload, patterns);
    results.push({
      id: rule.id,
      severity: rule.severity,
      ...result
    });
  }

  return results;
}

module.exports = { runChecks };
