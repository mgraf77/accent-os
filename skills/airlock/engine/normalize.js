function normalize({ actualBranch, wipState, handoffState }) {
  return {
    source: 'session-start',
    claimed_branch: handoffState ? handoffState.claimed_branch : null,
    claimed_task: wipState ? wipState.last_entry : null,
    claimed_wip_status: wipState ? wipState.raw : null,
    // internal fields used by checks — not part of the public HandoffPayload schema
    _actual_branch: actualBranch,
    _handoff_raw: handoffState ? handoffState.raw : null
  };
}

module.exports = { normalize };
