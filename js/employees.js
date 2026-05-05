// ── 3.1 EMPLOYEE SCORECARDS (M08 LOCKED — Owner/Admin/Manager only) ──
let EMPLOYEES = [];
let EMPLOYEE_SCORES = {};   // employee_id → array of score rows
const EMP_DEFAULT_METRICS = [
  {key:'revenue_attainment', label:'Revenue Attainment', unit:'%'},
  {key:'quote_close_rate', label:'Quote Close Rate', unit:'%'},
  {key:'avg_deal_size', label:'Avg Deal Size', unit:'$'},
  {key:'customer_satisfaction', label:'Customer Satisfaction', unit:'NPS'},
  {key:'tickets_resolved', label:'Tickets Resolved', unit:'count'},
  {key:'on_time_delivery', label:'On-Time Delivery', unit:'%'},
  {key:'attendance', label:'Attendance', unit:'%'},
  {key:'training_complete', label:'Training Complete', unit:'%'}
];

async function sbLoadEmployees(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/employees?select=id,user_id,full_name,role,department,hire_date,active,notes,created_at,updated_at&order=full_name.asc&limit=500');
    EMPLOYEES = Array.isArray(rows) ? rows : [];
    console.log(`[employees] Loaded ${EMPLOYEES.length} employees`);
    return EMPLOYEES.length;
  }catch(e){ console.warn('[sb] Load employees failed:', e.message); return false; }
}

async function sbLoadEmployeeScores(employeeId){
  if(!sbConfigured() || !employeeId) return false;
  try{
    const rows = await sbFetch(`/employee_scores?select=id,employee_id,period,metric_key,metric_value,score,notes,recorded_at&employee_id=eq.${encodeURIComponent(employeeId)}&order=period.desc,metric_key.asc&limit=500`);
    EMPLOYEE_SCORES[employeeId] = Array.isArray(rows) ? rows : [];
    return EMPLOYEE_SCORES[employeeId].length;
  }catch(e){ console.warn('[sb] Load employee_scores failed:', e.message); return false; }
}

async function sbSaveEmployee(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      user_id: rec.user_id || null,
      full_name: rec.full_name,
      role: rec.role || null,
      department: rec.department || null,
      hire_date: rec.hire_date || null,
      active: rec.active !== false,
      notes: rec.notes || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/employees?on_conflict=id' : '/employees';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save employee failed:', e.message); return false; }
}

// Single-row PATCH for inline edits (v6.10.53)
async function sbUpdateEmployeeField(id, field, value){
  if(!sbConfigured() || !id || !field) return false;
  const allowed = ['role','department','active','email','quota','hire_date','terminated_at'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value, updated_at: new Date().toISOString() };
    const res = await sbFetch(`/employees?id=eq.${encodeURIComponent(id)}`, {
      method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update employee field failed:', e.message); return false; }
}

async function commitEmployeeCell(input){
  if(!input) return;
  const id = input.dataset.id;
  const field = input.dataset.field;
  const isSelect = input.tagName === 'SELECT';
  const isBoolean = input.dataset.kind === 'boolean';
  const orig = input.dataset.orig || '';
  const valStr = (input.value || '').trim();
  if(input.style){ input.style.background = 'transparent'; input.style.borderColor = 'transparent'; }
  if(valStr === orig) return;
  let next = valStr === '' ? null : valStr;
  if(isBoolean) next = valStr === 'true' ? true : valStr === 'false' ? false : null;
  const item = EMPLOYEES.find(x => x.id === id);
  if(!item){ if(!isSelect) input.value = orig; toast('Row not found','err'); return; }
  const prev = item[field];
  item[field] = next;
  input.dataset.orig = valStr;
  const res = await sbUpdateEmployeeField(id, field, next);
  if(res === false){
    item[field] = prev;
    input.value = orig;
    input.dataset.orig = orig;
    toast(`Save failed — ${field} reverted`,'err');
    return;
  }
  if(typeof sbAuditLog==='function') sbAuditLog(`employee_${field}_edit`, 'employees', {employee_id: id, field, from: prev, to: next});
  toast(`${item.full_name||'Employee'} · ${field}: ${prev??'—'} → ${next??'—'}`, 'ok');
  if(field === 'active') renderEmployees($('pg-content'));
}

async function sbDeleteEmployee(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/employees?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete employee failed:', e.message); return false; }
}

async function sbSaveEmployeeScore(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      employee_id: rec.employee_id,
      period: rec.period,
      metric_key: rec.metric_key,
      metric_value: rec.metric_value === '' || rec.metric_value == null ? null : Number(rec.metric_value),
      score: rec.score === '' || rec.score == null ? null : Number(rec.score),
      notes: rec.notes || null,
      recorded_at: new Date().toISOString(),
      recorded_by: (CU?.user_id) || null
    };
    const headers = {'Prefer': 'resolution=merge-duplicates,return=representation'};
    const path = '/employee_scores?on_conflict=employee_id,period,metric_key';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save employee_score failed:', e.message); return false; }
}

async function sbDeleteEmployeeScore(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/employee_scores?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete employee_score failed:', e.message); return false; }
}

// Compute aggregate score across recent periods for each employee.
function computeEmployeeAggregate(empId){
  const scores = EMPLOYEE_SCORES[empId] || [];
  if(!scores.length) return {avgScore:null, periods:0, latestPeriod:null};
  const byPeriod = {};
  scores.forEach(s => { if(s.score!=null) (byPeriod[s.period] = byPeriod[s.period]||[]).push(Number(s.score)); });
  const periods = Object.keys(byPeriod);
  if(!periods.length) return {avgScore:null, periods:0, latestPeriod:null};
  // Average within each period, then mean across periods
  const perPeriod = periods.map(p => byPeriod[p].reduce((s,n)=>s+n,0)/byPeriod[p].length);
  const avg = perPeriod.reduce((s,n)=>s+n, 0) / perPeriod.length;
  const latest = periods.sort().reverse()[0];
  return {avgScore: Math.round(avg*10)/10, periods: periods.length, latestPeriod: latest};
}

function renderEmployees(c){
  // Aggregate stats
  const all = EMPLOYEES.map(e => Object.assign({}, e, {_agg: computeEmployeeAggregate(e.id)}));
  const active = all.filter(e => e.active !== false);
  const depts = {};
  all.forEach(e => { if(e.department) depts[e.department] = (depts[e.department]||0)+1; });
  const overallAvg = (() => {
    const scored = all.filter(e => e._agg.avgScore != null);
    if(!scored.length) return null;
    return Math.round(scored.reduce((s,e)=>s + e._agg.avgScore, 0) / scored.length * 10) / 10;
  })();

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Restricted view.</strong> Employee scorecards are visible to Owner / Admin / Manager only. Employees do not see their own scores.
      Data source: Windward CSV import (waiting). You can also enter scores manually below.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Active Employees</div><div class="stat-value">${active.length}</div><div class="stat-sub">${all.length - active.length} inactive</div></div>
      <div class="card stat-card"><div class="stat-label">Departments</div><div class="stat-value">${Object.keys(depts).length}</div><div class="stat-sub">${Object.entries(depts).slice(0,3).map(([d,n])=>`${esc(d)} (${n})`).join(' · ')||'—'}</div></div>
      <div class="card stat-card"${overallAvg!=null?` style="border-left:3px solid ${overallAvg>=8?'var(--green)':overallAvg>=6?'var(--blue)':'var(--yellow)'};"`:''}><div class="stat-label">Avg Score</div><div class="stat-value">${overallAvg!=null?overallAvg:'—'}</div><div class="stat-sub">Across all rated</div></div>
      <div class="card stat-card"><div class="stat-label">Rated Employees</div><div class="stat-value">${all.filter(e=>e._agg.avgScore!=null).length}</div><div class="stat-sub">Have at least 1 score</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Employee Directory</span>
        <button class="btn btn-accent btn-sm" onclick="openEmployeeEdit(null)">+ Add employee</button>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 420px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Hire date</th>
              <th>Avg score</th>
              <th>Periods</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${all.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">No employees yet. Click "+ Add employee" to seed manually, or wait for Windward CSV import.</td></tr>` : all.sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||'')).map(e => {
              const a = e._agg;
              const scoreCell = a.avgScore!=null ? `<span class="mono fw6" style="color:${a.avgScore>=8?'var(--green)':a.avgScore>=6?'var(--blue)':a.avgScore>=4?'var(--yellow)':'var(--accent)'};">${a.avgScore}</span>` : '<span class="muted">—</span>';
              const canEditEmp = CU && ['Owner','Admin','Manager'].includes(CU.role);
              const txtCell = (val, field, w=90) => canEditEmp
                ? `<td onclick="event.stopPropagation();" style="padding:2px 6px;"><input type="text" value="${esc(val||'')}" data-id="${e.id}" data-field="${field}" data-orig="${esc(val||'')}" onfocus="this.select();this.style.background='var(--surface)';this.style.borderColor='var(--accent)';" onblur="commitEmployeeCell(this)" onkeydown="if(event.key==='Enter'){this.blur();}else if(event.key==='Escape'){this.value=this.dataset.orig;this.blur();}" style="width:${w}px;border:1px solid transparent;background:transparent;padding:4px 6px;font-family:inherit;font-size:13px;border-radius:4px;" placeholder="—"></td>`
                : `<td class="sm">${esc(val||'—')}</td>`;
              const activeCell = canEditEmp
                ? `<td onclick="event.stopPropagation();"><select data-id="${e.id}" data-field="active" data-orig="${e.active===false?'false':'true'}" data-kind="boolean" onchange="commitEmployeeCell(this)" style="font-size:11px;padding:3px 6px;border:1px solid var(--border-light);border-radius:4px;background:transparent;font-family:inherit;cursor:pointer;"><option value="true" ${e.active!==false?'selected':''}>active</option><option value="false" ${e.active===false?'selected':''}>inactive</option></select></td>`
                : `<td>${e.active===false?'<span class="badge bg-gray" style="font-size:10px;">inactive</span>':'<span class="badge bg-green" style="font-size:10px;">active</span>'}</td>`;
              return `<tr style="cursor:pointer;${e.active===false?'opacity:0.5;':''}" onclick="openEmployeeDetail('${e.id}')">
                <td style="font-weight:600;color:var(--accent);">${esc(e.full_name||'(unnamed)')}</td>
                ${txtCell(e.role, 'role', 110)}
                ${txtCell(e.department, 'department', 110)}
                <td class="sm mono">${esc(e.hire_date||'—')}</td>
                <td>${scoreCell}</td>
                <td class="sm">${a.periods||0}</td>
                ${activeCell}
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openEmployeeEdit('${e.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function openEmployeeDetail(empId){
  const e = EMPLOYEES.find(x => String(x.id) === String(empId));
  if(!e){ toast('Employee not found','err'); return; }
  await sbLoadEmployeeScores(empId);
  const scores = EMPLOYEE_SCORES[empId] || [];
  const a = computeEmployeeAggregate(empId);
  // Pivot scores into period × metric grid
  const periods = [...new Set(scores.map(s => s.period))].sort().reverse();
  const metrics = [...new Set(scores.map(s => s.metric_key))];
  const grid = {};
  scores.forEach(s => { (grid[s.period] = grid[s.period]||{})[s.metric_key] = s; });

  openModal(e.full_name + ' · Scorecard', `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><div class="muted sm">Role</div><div>${esc(e.role||'—')}</div></div>
      <div><div class="muted sm">Department</div><div>${esc(e.department||'—')}</div></div>
      <div><div class="muted sm">Hire Date</div><div class="mono">${esc(e.hire_date||'—')}</div></div>
      <div><div class="muted sm">Avg Score</div><div style="font-weight:700;color:${a.avgScore>=8?'var(--green)':a.avgScore>=6?'var(--blue)':'var(--yellow)'};">${a.avgScore!=null?a.avgScore:'—'}</div></div>
      <div><div class="muted sm">Periods Tracked</div><div>${a.periods||0}</div></div>
      <div><div class="muted sm">Status</div><div>${e.active===false?'<span class="badge bg-gray">inactive</span>':'<span class="badge bg-green">active</span>'}</div></div>
    </div>
    ${e.notes?`<div class="card" style="padding:10px 14px;background:var(--bg-2);margin-bottom:14px;"><div class="muted sm">Notes</div><div style="white-space:pre-wrap;font-size:13px;">${esc(e.notes)}</div></div>`:''}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="font-size:13px;">Score History</strong>
      <button class="btn btn-outline btn-sm" onclick="openEmployeeScoreEdit('${empId}', null)">+ Add score</button>
    </div>
    ${periods.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--text-3);border:1px solid var(--border);border-radius:6px;">No scores recorded yet.</div>' : `
      <div class="tbl-wrap" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;">
        <table style="margin:0;">
          <thead><tr><th>Period</th>${metrics.map(m=>`<th class="sm">${esc((EMP_DEFAULT_METRICS.find(x=>x.key===m)||{}).label||m)}</th>`).join('')}<th></th></tr></thead>
          <tbody>
            ${periods.map(p => `<tr>
              <td class="mono fw6">${esc(p)}</td>
              ${metrics.map(m => {
                const s = grid[p]?.[m];
                if(!s) return '<td class="muted sm">—</td>';
                const scoreStr = s.score!=null ? `<span style="font-weight:600;color:${s.score>=8?'var(--green)':s.score>=6?'var(--blue)':'var(--yellow)'};">${s.score}</span>` : '';
                const valStr = s.metric_value!=null ? `<span class="muted sm">(${s.metric_value})</span>` : '';
                return `<td><a href="#" onclick="event.preventDefault();openEmployeeScoreEdit('${empId}','${s.id}')" style="text-decoration:none;color:inherit;">${scoreStr} ${valStr}</a></td>`;
              }).join('')}
              <td></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-accent" onclick="openEmployeeEdit('${empId}')">Edit profile</button>
    </div>
  `);
}

function openEmployeeEdit(empId){
  const isNew = !empId;
  const e = isNew ? {active:true} : EMPLOYEES.find(x => String(x.id) === String(empId));
  if(!e){ toast('Employee not found','err'); return; }
  openModal((isNew?'New':'Edit')+' Employee', `
    <div class="frow">
      <div class="fcol field"><label>Full Name *</label><input id="ee-n" value="${esc(e.full_name||'')}"></div>
      <div class="fcol field"><label>Role / Title</label><input id="ee-r" value="${esc(e.role||'')}" placeholder="Sales Rep, Warehouse, etc."></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Department</label><input id="ee-d" value="${esc(e.department||'')}" placeholder="Sales, Operations, etc."></div>
      <div class="fcol field"><label>Hire Date</label><input id="ee-h" type="date" value="${esc(e.hire_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Linked AccentOS user (optional)</label><input id="ee-u" value="${esc(e.user_id||'')}" placeholder="auth.users UUID"></div>
      <div class="fcol field"><label>Active</label><select id="ee-a"><option value="1" ${e.active!==false?'selected':''}>Active</option><option value="0" ${e.active===false?'selected':''}>Inactive</option></select></div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="ee-notes" rows="3">${esc(e.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteEmployeeConfirm('${empId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveEmployee(${isNew?'null':`'${empId}'`})">Save</button>
    </div>
  `);
}

async function saveEmployee(empId){
  const name = $('ee-n')?.value?.trim();
  if(!name){ toast('Name required','err'); return; }
  const rec = {
    id: empId || undefined,
    full_name: name,
    role: $('ee-r').value || null,
    department: $('ee-d').value || null,
    hire_date: $('ee-h').value || null,
    user_id: $('ee-u').value || null,
    active: $('ee-a').value === '1',
    notes: $('ee-notes').value || null
  };
  const saved = await sbSaveEmployee(rec);
  if(!saved){ toast('Save failed','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = EMPLOYEES.findIndex(x => x.id === saved.id);
    if(idx >= 0) EMPLOYEES[idx] = saved; else EMPLOYEES.unshift(saved);
  } else {
    await sbLoadEmployees();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(empId?'employee_edit':'employee_create', 'employees', {employee_id: empId||saved?.id, name});
  closeModal();
  mgmt($('pg-content'));
  toast('Employee '+(empId?'updated':'added'),'ok');
}

async function deleteEmployeeConfirm(empId){
  const e = EMPLOYEES.find(x => String(x.id) === String(empId));
  if(!e) return;
  if(!confirm(`Delete employee "${e.full_name}"? This will also remove their score history.`)) return;
  const ok = await sbDeleteEmployee(empId);
  if(!ok){ toast('Delete failed','err'); return; }
  EMPLOYEES = EMPLOYEES.filter(x => x.id !== empId);
  delete EMPLOYEE_SCORES[empId];
  if(typeof sbAuditLog==='function') sbAuditLog('employee_delete', 'employees', {employee_id: empId, name: e.full_name});
  closeModal();
  mgmt($('pg-content'));
  toast('Employee deleted','ok');
}

function openEmployeeScoreEdit(empId, scoreId){
  const isNew = !scoreId;
  const list = EMPLOYEE_SCORES[empId] || [];
  const rec = isNew ? {period: defaultPeriodNow(), metric_key:'revenue_attainment'} : list.find(x => x.id === scoreId);
  if(!rec){ toast('Score not found','err'); return; }
  openModal((isNew?'New':'Edit')+' Score', `
    <div class="frow">
      <div class="fcol field"><label>Period *</label><input id="es-p" value="${esc(rec.period||'')}" placeholder="2026-Q1, 2026-04"></div>
      <div class="fcol field"><label>Metric *</label>
        <select id="es-m">
          ${EMP_DEFAULT_METRICS.map(m=>`<option value="${m.key}" ${rec.metric_key===m.key?'selected':''}>${m.label} (${m.unit})</option>`).join('')}
          ${rec.metric_key && !EMP_DEFAULT_METRICS.find(m=>m.key===rec.metric_key) ? `<option value="${esc(rec.metric_key)}" selected>${esc(rec.metric_key)} (custom)</option>` : ''}
        </select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Raw Value (optional)</label><input id="es-v" type="number" step="0.01" value="${rec.metric_value!=null?rec.metric_value:''}" placeholder="100, 0.85, etc."></div>
      <div class="fcol field"><label>Score (0–10)</label><input id="es-s" type="number" min="0" max="10" step="0.1" value="${rec.score!=null?rec.score:''}"></div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="es-notes" rows="2">${esc(rec.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteEmployeeScore('${empId}','${scoreId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="openEmployeeDetail('${empId}')">Cancel</button>
      <button class="btn btn-accent" onclick="saveEmployeeScore('${empId}',${isNew?'null':`'${scoreId}'`})">Save</button>
    </div>
  `);
}

function defaultPeriodNow(){
  const d = new Date();
  return d.getFullYear() + '-Q' + (Math.floor(d.getMonth()/3)+1);
}

async function saveEmployeeScore(empId, scoreId){
  const period = $('es-p')?.value?.trim();
  const metric_key = $('es-m').value;
  if(!period){ toast('Period required','err'); return; }
  const rec = {
    id: scoreId || undefined,
    employee_id: empId,
    period,
    metric_key,
    metric_value: $('es-v').value || null,
    score: $('es-s').value || null,
    notes: $('es-notes').value || null
  };
  const saved = await sbSaveEmployeeScore(rec);
  if(!saved){ toast('Save failed','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog(scoreId?'emp_score_edit':'emp_score_create', 'employees', {employee_id: empId, period, metric_key});
  await sbLoadEmployeeScores(empId);
  await openEmployeeDetail(empId);
  toast('Score '+(scoreId?'updated':'added'),'ok');
}

async function deleteEmployeeScore(empId, scoreId){
  if(!confirm('Delete this score?')) return;
  await sbDeleteEmployeeScore(scoreId);
  if(typeof sbAuditLog==='function') sbAuditLog('emp_score_delete', 'employees', {employee_id: empId, score_id: scoreId});
  await sbLoadEmployeeScores(empId);
  await openEmployeeDetail(empId);
  toast('Score deleted','ok');
}
