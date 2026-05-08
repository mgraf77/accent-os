// Autonomous Governance — approval authorities, auto-action rules, audit trail
// Owner-only visibility and management
// Requires M41 schema (approval_authorities, auto_action_rules, auto_action_log)

let APPROVAL_AUTHORITIES = [];
let AUTO_ACTION_RULES = [];
let AUTO_ACTION_LOG = [];

async function sbLoadGovernance(){
  if(!sbConfigured()) return;
  try{
    APPROVAL_AUTHORITIES = await sbFetch('/approval_authorities?select=id,role,action_type,threshold_usd,description,enabled&order=role.asc,action_type.asc') || [];
    AUTO_ACTION_RULES = await sbFetch('/auto_action_rules?select=id,rule_name,trigger_type,trigger_entity,action_type,description,enabled&order=created_at.desc') || [];
    AUTO_ACTION_LOG = await sbFetch('/auto_action_log?select=id,rule_id,trigger_entity,trigger_id,action_type,action_status,executed_at,created_at&order=created_at.desc&limit=50') || [];
  } catch(e){ console.log('[sbLoadGovernance]', e.message); }
}

async function sbSaveApprovalAuthority(row){
  if(!sbConfigured()) return;
  const { id, role, action_type, threshold_usd, description, enabled } = row;
  try{
    const result = await fetch(`${SB_URL}/rest/v1/approval_authorities${id ? `?id=eq.${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}` },
      body: JSON.stringify({ role, action_type, threshold_usd, description, enabled })
    });
    if(!result.ok) throw new Error(await result.text());
    toast('Authority saved', 'ok');
    await sbLoadGovernance();
    renderGovernance($('governance-container'));
  } catch(e){
    console.error('[sbSaveApprovalAuthority]', e);
    toast(`Save failed: ${e.message}`, 'err');
  }
}

async function sbSaveAutoActionRule(row){
  if(!sbConfigured()) return;
  const { id, rule_name, trigger_type, trigger_entity, action_type, action_params, description, enabled } = row;
  try{
    const body = {
      rule_name,
      trigger_type,
      trigger_entity,
      trigger_condition: JSON.stringify({field:'status',operator:'eq',value:'won'}), // placeholder
      action_type,
      action_params: JSON.stringify(action_params || {}),
      description,
      enabled
    };
    const result = await fetch(`${SB_URL}/rest/v1/auto_action_rules${id ? `?id=eq.${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}` },
      body: JSON.stringify(body)
    });
    if(!result.ok) throw new Error(await result.text());
    toast('Rule saved', 'ok');
    await sbLoadGovernance();
    renderGovernance($('governance-container'));
  } catch(e){
    console.error('[sbSaveAutoActionRule]', e);
    toast(`Save failed: ${e.message}`, 'err');
  }
}

function renderGovernance(el){
  if(!el) return;
  const isOwner = CU && CU.role === 'Owner';
  if(!isOwner) {
    el.innerHTML = `<div class="alert alert-warning">🔒 Governance rules are Owner-only.</div>`;
    return;
  }

  let section = 'authorities'; // authorities, rules, log
  el.innerHTML = `
    <div style="margin-bottom:16px;border-bottom:1px solid var(--border);">
      <div style="display:flex;gap:8px;">
        <button class="btn ${section==='authorities'?'btn-accent':'btn-outline'} btn-sm" onclick="govSwitch('authorities')">Approval Authorities</button>
        <button class="btn ${section==='rules'?'btn-accent':'btn-outline'} btn-sm" onclick="govSwitch('rules')">Auto-Action Rules</button>
        <button class="btn ${section==='log'?'btn-accent':'btn-outline'} btn-sm" onclick="govSwitch('log')">Audit Log</button>
      </div>
    </div>
    <div id="governance-content"></div>
  `;
  govSwitch('authorities');
}

function govSwitch(section){
  const host = $('governance-content');
  if(!host) return;
  const isOwner = CU && CU.role === 'Owner';

  if(section === 'authorities'){
    host.innerHTML = `
      <h3 style="margin-bottom:12px;font-size:16px;">Approval Authorities</h3>
      <p style="color:var(--text-2);font-size:13px;margin-bottom:12px;">Define role-based approval thresholds. Users can approve items within their role's ceiling without escalation.</p>
      <table class="table" style="width:100%;font-size:13px;">
        <thead><tr>
          <th>Role</th>
          <th>Action Type</th>
          <th>Limit ($)</th>
          <th>Description</th>
          <th>Enabled</th>
          <th>Action</th>
        </tr></thead>
        <tbody>
          ${APPROVAL_AUTHORITIES.map(a => `<tr>
            <td><strong>${esc(a.role)}</strong></td>
            <td><code style="font-size:11px;">${esc(a.action_type)}</code></td>
            <td>${a.threshold_usd ? `$${a.threshold_usd.toLocaleString()}` : 'Unlimited'}</td>
            <td style="font-size:12px;color:var(--text-3);">${esc(a.description||'')}</td>
            <td><input type="checkbox" ${a.enabled?'checked':''} onchange="updateAuthorityToggle('${a.id}',this.checked)"></td>
            <td><button class="btn btn-outline btn-xs" onclick="editAuthority('${a.id}')">Edit</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <button class="btn btn-accent btn-sm" style="margin-top:12px;" onclick="openNewAuthorityModal()">+ Add Authority</button>
    `;
  } else if(section === 'rules'){
    host.innerHTML = `
      <h3 style="margin-bottom:12px;font-size:16px;">Auto-Action Rules</h3>
      <p style="color:var(--text-2);font-size:13px;margin-bottom:12px;">Define if-then workflows. When a trigger occurs, the action executes automatically with an audit trail.</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${AUTO_ACTION_RULES.map(r => `<div class="card" style="margin:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;margin-bottom:4px;">${esc(r.rule_name)}</div>
              <div style="font-size:12px;color:var(--text-3);">When ${esc(r.trigger_entity)}.${esc(r.trigger_type)} → ${esc(r.action_type)}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${esc(r.description||'')}</div>
            </div>
            <div style="display:flex;gap:6px;">
              <input type="checkbox" ${r.enabled?'checked':''} onchange="updateRuleToggle('${r.id}',this.checked)" style="margin-top:8px;">
              <button class="btn btn-outline btn-xs" onclick="editRule('${r.id}')">Edit</button>
            </div>
          </div>
        </div>`).join('')}
      </div>
      <button class="btn btn-accent btn-sm" style="margin-top:12px;" onclick="openNewRuleModal()">+ Add Rule</button>
    `;
  } else if(section === 'log'){
    host.innerHTML = `
      <h3 style="margin-bottom:12px;font-size:16px;">Audit Log (Last 50 Actions)</h3>
      <table class="table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th>Timestamp</th>
          <th>Rule</th>
          <th>Entity</th>
          <th>Action</th>
          <th>Status</th>
          <th>Details</th>
        </tr></thead>
        <tbody>
          ${AUTO_ACTION_LOG.map(log => `<tr>
            <td><code style="font-size:10px;">${new Date(log.created_at).toLocaleString()}</code></td>
            <td style="color:var(--text-3);font-size:11px;">${log.rule_id ? `Rule ${log.rule_id.slice(0,8)}…` : '–'}</td>
            <td><code>${esc(log.trigger_entity)}</code></td>
            <td><code>${esc(log.action_type)}</code></td>
            <td><span class="badge ${log.action_status==='executed'?'bg-green':log.action_status==='failed'?'bg-red':'bg-gray'}">${esc(log.action_status)}</span></td>
            <td style="color:var(--text-3);font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;">
              ${log.action_status === 'failed' && log.error_message ? esc(log.error_message) : log.action_result ? esc(JSON.stringify(log.action_result).slice(0,50)) : '–'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:12px;font-size:12px;color:var(--text-3);">Showing 50 most recent actions. Refresh to update.</div>
    `;
  }
}

function updateAuthorityToggle(id, enabled){
  const auth = APPROVAL_AUTHORITIES.find(a => a.id === id);
  if(auth){
    auth.enabled = enabled;
    sbSaveApprovalAuthority(auth);
  }
}

function updateRuleToggle(id, enabled){
  const rule = AUTO_ACTION_RULES.find(r => r.id === id);
  if(rule){
    rule.enabled = enabled;
    sbSaveAutoActionRule(rule);
  }
}

function editAuthority(id){
  const auth = APPROVAL_AUTHORITIES.find(a => a.id === id);
  if(!auth) return;
  openModal(`
    <h2>Edit Approval Authority</h2>
    <div class="field"><label>Role</label><select id="ga-role">${ROLES.map(r => `<option ${r === auth.role ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
    <div class="field"><label>Action Type</label><input id="ga-action" value="${esc(auth.action_type)}" placeholder="quote_approve, po_approve, etc."></div>
    <div class="field"><label>Limit (USD)</label><input id="ga-limit" type="number" value="${auth.threshold_usd || ''}" placeholder="Leave blank for unlimited"></div>
    <div class="field"><label>Description</label><textarea id="ga-desc" rows="2">${esc(auth.description || '')}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-accent" onclick="saveEditedAuthority('${id}')">Save</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function saveEditedAuthority(id){
  const auth = APPROVAL_AUTHORITIES.find(a => a.id === id);
  if(!auth) return;
  const updated = {
    id,
    role: $('ga-role').value,
    action_type: $('ga-action').value,
    threshold_usd: $('ga-limit').value ? parseFloat($('ga-limit').value) : null,
    description: $('ga-desc').value,
    enabled: auth.enabled
  };
  closeModal();
  sbSaveApprovalAuthority(updated);
}

function openNewAuthorityModal(){
  openModal(`
    <h2>New Approval Authority</h2>
    <div class="field"><label>Role</label><select id="ga-new-role">${ROLES.map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field"><label>Action Type</label><input id="ga-new-action" placeholder="quote_approve"></div>
    <div class="field"><label>Limit (USD)</label><input id="ga-new-limit" type="number" placeholder="Leave blank for unlimited"></div>
    <div class="field"><label>Description</label><textarea id="ga-new-desc" rows="2" placeholder="e.g., Sales reps can approve quotes under $5K"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-accent" onclick="saveNewAuthority()">Create</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function saveNewAuthority(){
  const newAuth = {
    role: $('ga-new-role').value,
    action_type: $('ga-new-action').value,
    threshold_usd: $('ga-new-limit').value ? parseFloat($('ga-new-limit').value) : null,
    description: $('ga-new-desc').value,
    enabled: true
  };
  if(!newAuth.role || !newAuth.action_type){
    toast('Role and Action Type are required', 'err');
    return;
  }
  closeModal();
  sbSaveApprovalAuthority(newAuth);
}

function editRule(id){
  const rule = AUTO_ACTION_RULES.find(r => r.id === id);
  if(!rule) return;
  openModal(`
    <h2>Edit Auto-Action Rule</h2>
    <div class="field"><label>Rule Name</label><input id="gr-name" value="${esc(rule.rule_name)}"></div>
    <div class="field"><label>Trigger Entity</label><input id="gr-entity" value="${esc(rule.trigger_entity)}" placeholder="deal, quote, po, inventory_item"></div>
    <div class="field"><label>Trigger Type</label><input id="gr-trigger" value="${esc(rule.trigger_type)}" placeholder="status_change, threshold_crossed"></div>
    <div class="field"><label>Action Type</label><input id="gr-action" value="${esc(rule.action_type)}" placeholder="create_job, create_po, escalate"></div>
    <div class="field"><label>Description</label><textarea id="gr-desc" rows="2">${esc(rule.description || '')}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-accent" onclick="saveEditedRule('${id}')">Save</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function saveEditedRule(id){
  const rule = AUTO_ACTION_RULES.find(r => r.id === id);
  if(!rule) return;
  const updated = {
    id,
    rule_name: $('gr-name').value,
    trigger_entity: $('gr-entity').value,
    trigger_type: $('gr-trigger').value,
    action_type: $('gr-action').value,
    description: $('gr-desc').value,
    action_params: rule.action_params || {},
    enabled: rule.enabled
  };
  closeModal();
  sbSaveAutoActionRule(updated);
}

function openNewRuleModal(){
  openModal(`
    <h2>New Auto-Action Rule</h2>
    <div class="field"><label>Rule Name</label><input id="gr-new-name" placeholder="e.g., Deal→Job Auto-Create"></div>
    <div class="field"><label>Trigger Entity</label><input id="gr-new-entity" placeholder="deal"></div>
    <div class="field"><label>Trigger Type</label><input id="gr-new-trigger" placeholder="status_change"></div>
    <div class="field"><label>Action Type</label><input id="gr-new-action" placeholder="create_job"></div>
    <div class="field"><label>Description</label><textarea id="gr-new-desc" rows="2" placeholder="When trigger fires, what happens?"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-accent" onclick="saveNewRule()">Create</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function saveNewRule(){
  const newRule = {
    rule_name: $('gr-new-name').value,
    trigger_entity: $('gr-new-entity').value,
    trigger_type: $('gr-new-trigger').value,
    action_type: $('gr-new-action').value,
    description: $('gr-new-desc').value,
    action_params: {},
    enabled: true
  };
  if(!newRule.rule_name || !newRule.trigger_entity){
    toast('Rule Name and Trigger Entity are required', 'err');
    return;
  }
  closeModal();
  sbSaveAutoActionRule(newRule);
}
