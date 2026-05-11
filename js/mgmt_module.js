// ── MGMT MODULE (extracted from index.html at v6.11.1) ──
register({ name: 'mgmt_module', provides: ['mgmt','roadmap'], consumes: ['DEALS','STAGES','VD','CU','weightedScore','esc','$'] });

// ── MGMT ──────────────────────────────────────────────────
// ── MGMT DASHBOARD: Owner Dashboard (4.1) + KPI Registry (4.2) + OKRs (4.3) ──
let mgmtSection = 'overview';
function mgmt(el){
  const tabs = [
    {id:'overview', label:'Overview'},
    {id:'kpis', label:'KPIs'},
    {id:'goals', label:'Goals & OKRs'},
    {id:'employees', label:'Employees'},
    {id:'commission', label:'Commission'},
    {id:'activity', label:'Team Activity'},
    {id:'modes', label:'Modes'},
    {id:'system', label:'System'}
  ];
  el.innerHTML = `
    <div class="card mb16">
      <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);overflow-x:auto;">
        ${tabs.map(t => `<div onclick="mgmtSection='${t.id}';mgmt($('pg-content'))" style="padding:12px 20px;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid ${mgmtSection===t.id?'var(--accent)':'transparent'};color:${mgmtSection===t.id?'var(--accent)':'var(--text-2)'};white-space:nowrap;">${t.label}</div>`).join('')}
      </div>
    </div>
    <div id="mgmt-content"></div>
  `;
  const c = $('mgmt-content');
  if(mgmtSection === 'overview') renderOwnerOverview(c);
  else if(mgmtSection === 'kpis') renderKPIRegistry(c);
  else if(mgmtSection === 'goals') renderGoalsOKR(c);
  else if(mgmtSection === 'employees') renderEmployees(c);
  else if(mgmtSection === 'commission') renderCommissionTracker(c);
  else if(mgmtSection === 'activity') renderTeamActivity(c);
  else if(mgmtSection === 'modes' && typeof renderModuleModesPanel === 'function') renderModuleModesPanel(c);
  else if(mgmtSection === 'system') renderSystemPanel(c);
}


// ── 4.1 OWNER DASHBOARD ──
function renderOwnerOverview(c){
  // Revenue (won deal sum YTD)
  const ytdStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const wonYTD = (DEALS.won||[]).filter(d => d.updated_at && new Date(d.updated_at).getTime() >= ytdStart);
  const wonRev = wonYTD.reduce((s,d)=>s+(d.value||0), 0);

  // Pipeline value + forecast
  const active = STAGES.flatMap(s => DEALS[s.key]||[]);
  const pipeVal = active.reduce((s,d)=>s+(d.value||0), 0);
  const forecast = active.reduce((s,d) => {
    const p = (d.probability!=null) ? d.probability : computeDealProbability(d).prob;
    return s + (d.value||0) * (p/100);
  }, 0);

  // Vendor avg score
  const scores = VD.map(v=>weightedScore(v)).filter(x=>x!==null);
  const avgScore = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : null;

  // Open coop $$
  const openCoop = (COOP_FUNDS||[]).filter(r => r.status==='open').reduce((s,r) => s + (Number(r.amount)||0), 0);

  // Quote velocity
  const dayAgo = Date.now() - 30*86400000;
  const recentQuotes = QUOTES.filter(q => q.date && new Date(q.date).getTime() >= dayAgo);
  const recentQuoteVal = recentQuotes.reduce((s,q)=>s+(q.total||0), 0);

  // Unverified score count
  const unverifiedCount = VD.reduce((s,v) => s + (vendorScore(v).unverifiedCount||0), 0);

  c.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Revenue YTD (Won)</div><div class="stat-value" style="color:var(--green);">$${wonRev.toLocaleString()}</div><div class="stat-sub">${wonYTD.length} closed deals</div></div>
      <div class="card stat-card"><div class="stat-label">Pipeline Forecast</div><div class="stat-value">$${Math.round(forecast).toLocaleString()}</div><div class="stat-sub">$${pipeVal.toLocaleString()} raw · ${active.length} deals</div></div>
      <div class="card stat-card"><div class="stat-label">Co-op $$ Open</div><div class="stat-value" style="color:${openCoop>0?'var(--accent)':'var(--text)'};">$${openCoop.toLocaleString()}</div><div class="stat-sub">Money on the table</div></div>
      <div class="card stat-card"><div class="stat-label">Avg Vendor Score</div><div class="stat-value">${avgScore!==null?avgScore.toFixed(1):'—'}</div><div class="stat-sub">${unverifiedCount} unverified rows</div></div>
    </div>
    <div class="g2 mb16">
      <div class="card"><div class="card-hd"><span class="card-title">Pipeline by Stage</span></div><div class="card-body">
        ${STAGES.map(s => {
          const deals = DEALS[s.key]||[];
          const v = deals.reduce((sum,d)=>sum+(d.value||0), 0);
          const pct = pipeVal ? Math.round(100*v/pipeVal) : 0;
          return `<div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:13px;font-weight:600;">${s.label}</span>
              <span class="mono sm muted">${deals.length} · $${v.toLocaleString()}</span>
            </div>
            <div class="pbar"><div class="pfill" style="width:${pct}%;background:${s.key==='won'?'var(--green)':'var(--blue)'};"></div></div>
          </div>`;
        }).join('')}
      </div></div>
      <div class="card"><div class="card-hd"><span class="card-title">Quote Velocity (30d)</span></div><div class="card-body">
        <div style="font-size:36px;font-weight:700;font-family:'DM Mono',monospace;color:var(--accent);">${recentQuotes.length}</div>
        <div class="muted sm" style="margin-bottom:14px;">Quotes saved · $${Math.round(recentQuoteVal).toLocaleString()} total value</div>
        ${recentQuotes.slice(0,5).map(q => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light);font-size:12.5px;"><span style="font-weight:500;">${esc(q.project||'—')}</span><span class="mono">$${Math.round(q.total||0).toLocaleString()}</span></div>`).join('')}
        ${recentQuotes.length===0 ? '<div class="muted sm">No quotes saved in last 30 days.</div>' : ''}
      </div></div>
    </div>
    <div class="card"><div class="card-hd"><span class="card-title">Top Vendors by Score</span></div><div class="card-body">
      ${(()=>{
        const top = VD.map(v => ({...v, ws:weightedScore(v)})).filter(v => v.ws !== null).sort((a,b)=>b.ws-a.ws).slice(0,10);
        return top.map((v,i) => `<div style="margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
            <span class="mono sm muted">${i+1}</span>
            <span style="font-size:13px;font-weight:600;cursor:pointer;color:var(--accent);" onclick="openVendorDetail(${v.id})">${esc(v.name)}</span>
            <span style="margin-left:auto;">${tierBadge(tier(v.ws))}</span>
            <span class="mono" style="font-size:13px;font-weight:700;color:${scoreColor(v.ws)};min-width:28px;text-align:right;">${v.ws}</span>
          </div>
          <div class="pbar"><div class="pfill" style="width:${Math.round((v.ws/10)*100)}%;background:${scoreColor(v.ws)};"></div></div>
        </div>`).join('');
      })()}
    </div></div>
  `;
}

// ── 4.2 KPI MASTER REGISTRY ──
let KPI_DEFINITIONS = [];
let KPI_SNAPSHOTS = [];

// Seeded KPI catalog. Owner runs M02 schema; Claude writes these on first snapshot trigger.
const SEED_KPIS = [
  {key:'avg_vendor_score', name:'Average Vendor Score', category:'sales', unit:'', direction:'higher_better', target:7.0, source:'computed_from:vendor_scores', visible_to_roles:['Owner','Admin','Manager']},
  {key:'pipeline_forecast', name:'Pipeline Forecast ($)', category:'sales', unit:'$', direction:'higher_better', source:'computed_from:pipeline_deals', visible_to_roles:['Owner','Admin','Manager']},
  {key:'pipeline_active_count', name:'Active Deals', category:'sales', unit:'count', direction:'higher_better', source:'computed_from:pipeline_deals', visible_to_roles:['Owner','Admin','Manager','Sales']},
  {key:'won_revenue_ytd', name:'Revenue YTD (Won)', category:'financial', unit:'$', direction:'higher_better', source:'computed_from:pipeline_deals', visible_to_roles:['Owner','Admin','Manager']},
  {key:'open_coop_dollars', name:'Co-op $$ Open', category:'financial', unit:'$', direction:'lower_better', source:'computed_from:coop_tracker', visible_to_roles:['Owner','Admin','Manager']},
  {key:'unverified_score_count', name:'Unverified Score Categories', category:'operations', unit:'count', direction:'lower_better', source:'computed_from:vendor_score_states', visible_to_roles:['Owner','Admin','Manager']},
  {key:'quote_velocity_30d', name:'Quote Velocity (30d)', category:'sales', unit:'count', direction:'higher_better', source:'computed_from:quotes', visible_to_roles:['Owner','Admin','Manager','Sales']},
  {key:'close_rate', name:'Close Rate', category:'sales', unit:'%', direction:'higher_better', target:50, source:'computed_from:pipeline_deals', visible_to_roles:['Owner','Admin','Manager']}
];

async function sbLoadKPIs(){
  if(!sbConfigured()) return false;
  try{
    const defs = await sbFetch('/kpi_definitions?select=key,name,category,visible_to_roles,unit,direction,target,description,source');
    KPI_DEFINITIONS = Array.isArray(defs) ? defs : [];
    if(KPI_DEFINITIONS.length === 0 && CU?.role==='Owner'){
      // Seed on first run
      console.log('[kpi] seeding initial KPI catalog');
      await sbFetch('/kpi_definitions', {
        method:'POST', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(SEED_KPIS)
      });
      KPI_DEFINITIONS = SEED_KPIS;
    }
    const snaps = await sbFetch('/kpi_snapshots?select=kpi_key,snapshot_date,value,metadata&order=snapshot_date.desc&limit=200');
    KPI_SNAPSHOTS = Array.isArray(snaps) ? snaps : [];
    return KPI_DEFINITIONS.length;
  }catch(e){ console.warn('[sb] Load KPIs failed:', e.message); return false; }
}

function computeCurrentKPIValue(key){
  switch(key){
    case 'avg_vendor_score': {
      const s = VD.map(v=>weightedScore(v)).filter(x=>x!==null);
      return s.length ? Math.round(s.reduce((a,b)=>a+b,0)/s.length*10)/10 : null;
    }
    case 'pipeline_forecast': {
      return Math.round(STAGES.flatMap(s=>DEALS[s.key]||[]).reduce((sum,d)=>{
        const p = (d.probability!=null)?d.probability:computeDealProbability(d).prob;
        return sum + (d.value||0) * (p/100);
      },0));
    }
    case 'pipeline_active_count': return STAGES.flatMap(s=>DEALS[s.key]||[]).length;
    case 'won_revenue_ytd': {
      const yStart = new Date(new Date().getFullYear(),0,1).getTime();
      return (DEALS.won||[]).filter(d => d.updated_at && new Date(d.updated_at).getTime() >= yStart).reduce((s,d)=>s+(d.value||0),0);
    }
    case 'open_coop_dollars': return (COOP_FUNDS||[]).filter(r=>r.status==='open').reduce((s,r)=>s+(Number(r.amount)||0),0);
    case 'unverified_score_count': return VD.reduce((s,v)=>s+(vendorScore(v).unverifiedCount||0),0);
    case 'quote_velocity_30d': {
      const cutoff = Date.now() - 30*86400000;
      return QUOTES.filter(q => q.date && new Date(q.date).getTime() >= cutoff).length;
    }
    case 'close_rate': {
      const w = (DEALS.won||[]).length, l = (DEALS.lost||[]).length;
      return (w+l) > 0 ? Math.round(100*w/(w+l)) : null;
    }
  }
  return null;
}

async function snapshotAllKPIs(){
  if(!sbConfigured()) return;
  const today = new Date().toISOString().slice(0,10);
  const rows = KPI_DEFINITIONS.map(d => ({
    kpi_key: d.key,
    snapshot_date: today,
    value: computeCurrentKPIValue(d.key),
    metadata: null
  })).filter(r => r.value !== null);
  if(!rows.length){ toast('Nothing to snapshot','err'); return; }
  try{
    await sbFetch('/kpi_snapshots?on_conflict=kpi_key,snapshot_date', {
      method:'POST',
      headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify(rows)
    });
    if(typeof sbAuditLog==='function') sbAuditLog('kpi_snapshot', 'mgmt', {count: rows.length});
    await sbLoadKPIs();
    toast(`Snapshot saved — ${rows.length} KPIs`, 'ok');
    mgmt($('pg-content'));
  }catch(e){ toast('Snapshot failed: '+e.message, 'err'); }
}

function renderKPIRegistry(c){
  const role = CU?.role || '';
  const visible = KPI_DEFINITIONS.filter(d => !d.visible_to_roles || d.visible_to_roles.includes(role));
  if(KPI_DEFINITIONS.length === 0){
    c.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-3);">
      KPI catalog not loaded yet. ${role==='Owner'?'Will auto-seed on next page load.':'Wait for Owner to seed.'}
      <div style="margin-top:14px;"><button class="btn btn-accent btn-sm" onclick="sbLoadKPIs().then(()=>mgmt($('pg-content')))">Reload</button></div>
    </div></div>`;
    return;
  }
  const today = new Date().toISOString().slice(0,10);
  c.innerHTML = `
    <div class="card mb16">
      <div class="card-hd">
        <span class="card-title">KPI Master Registry</span>
        ${role==='Owner'?`<button class="btn btn-accent btn-sm" onclick="snapshotAllKPIs()">📸 Snapshot today</button>`:''}
      </div>
      <div class="card-body">
        <div style="font-size:12.5px;color:var(--text-2);margin-bottom:14px;">${visible.length} KPI${visible.length===1?'':'s'} visible to ${role}.</div>
        <table>
          <thead><tr><th>KPI</th><th>Category</th><th>Current</th><th>Target</th><th>Direction</th><th>Last Snapshot</th></tr></thead>
          <tbody>
            ${visible.map(d => {
              const cur = computeCurrentKPIValue(d.key);
              const lastSnap = KPI_SNAPSHOTS.find(s => s.kpi_key === d.key);
              const fmt = v => v===null||v===undefined?'—': d.unit==='$'?'$'+Number(v).toLocaleString(): d.unit==='%'?v+'%': v;
              const arrow = d.direction==='higher_better'?'↑':'↓';
              return `<tr>
                <td style="font-weight:600;">${esc(d.name)}</td>
                <td><span class="badge bg-gray" style="font-size:10px;">${esc(d.category||'')}</span></td>
                <td class="mono fw6">${fmt(cur)}</td>
                <td class="mono sm">${d.target!=null?fmt(d.target):'—'}</td>
                <td class="sm muted">${arrow} ${d.direction==='higher_better'?'higher':'lower'}</td>
                <td class="sm muted">${lastSnap ? `${lastSnap.snapshot_date} · ${fmt(lastSnap.value)}` : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${role==='Owner'?'<div style="margin-top:14px;font-size:11.5px;color:var(--text-3);">Snapshots stamp once per day. Re-running for today\'s date overwrites the same row.</div>':''}
      </div>
    </div>
  `;
}

// ── 4.3 GOALS / OKRs ──
let GOALS = [];
const GOAL_LEVELS = ['company','department','team','individual','daily'];
const GOAL_LEVEL_LABELS = {company:'Company', department:'Department', team:'Team', individual:'Individual', daily:'Daily Action'};

async function sbLoadGoals(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/goals?select=id,parent_id,level,title,description,owner_id,metric_key,target_value,current_value,start_date,due_date,status&order=level.asc,due_date.asc.nullslast');
    GOALS = Array.isArray(rows) ? rows : [];
    return GOALS.length;
  }catch(e){ console.warn('[sb] Load goals failed:', e.message); return false; }
}

async function sbSaveGoal(g){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: g.id || undefined,
      parent_id: g.parent_id || null,
      level: g.level,
      title: g.title,
      description: g.description || null,
      owner_id: g.owner_id || (CU?.user_id) || null,
      metric_key: g.metric_key || null,
      target_value: g.target_value!==''&&g.target_value!=null ? Number(g.target_value) : null,
      current_value: g.current_value!==''&&g.current_value!=null ? Number(g.current_value) : null,
      start_date: g.start_date || null,
      due_date: g.due_date || null,
      status: g.status || 'active',
      updated_at: new Date().toISOString()
    };
    const path = body.id ? '/goals?on_conflict=id' : '/goals';
    const res = await sbFetch(path, {
      method: 'POST',
      headers: {'Prefer': body.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'},
      body: JSON.stringify(body)
    });
    return Array.isArray(res) ? res[0] : true;
  }catch(e){ console.warn('[sb] Save goal failed:', e.message); return false; }
}

async function sbDeleteGoal(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/goals?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete goal failed:', e.message); return false; }
}

function renderGoalsOKR(c){
  // Build hierarchy by parent_id
  const byParent = {};
  GOALS.forEach(g => { (byParent[g.parent_id||'__root__'] = byParent[g.parent_id||'__root__'] || []).push(g); });

  const renderGoalNode = (g, depth) => {
    const kids = byParent[g.id] || [];
    const progress = (g.target_value && g.current_value!=null) ? Math.min(100, Math.round(100*g.current_value/g.target_value)) : null;
    const statusBadge = {active:'bg-blue', complete:'bg-green', at_risk:'bg-yellow', abandoned:'bg-gray'}[g.status]||'bg-gray';
    return `
      <div style="margin-left:${depth*22}px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;background:var(--surface);">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span class="badge bg-gray" style="font-size:9px;text-transform:uppercase;">${GOAL_LEVEL_LABELS[g.level]||g.level}</span>
          <span style="font-weight:600;font-size:13.5px;">${esc(g.title)}</span>
          <span class="badge ${statusBadge}" style="font-size:10px;">${g.status||'active'}</span>
          ${g.due_date ? `<span class="muted sm">Due ${g.due_date}</span>` : ''}
          <button class="btn btn-outline btn-sm" style="margin-left:auto;font-size:10px;padding:3px 7px;" onclick="openGoalEdit('${g.id}')">Edit</button>
          <button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="openGoalEdit(null,'${g.id}')">+ Sub-goal</button>
        </div>
        ${g.description ? `<div style="font-size:12px;color:var(--text-2);margin-top:5px;">${esc(g.description)}</div>` : ''}
        ${progress!==null ? `<div style="margin-top:6px;"><div class="pbar"><div class="pfill" style="width:${progress}%;background:${progress>=100?'var(--green)':progress>=50?'var(--blue)':'var(--yellow)'};"></div></div><div class="muted sm" style="margin-top:3px;">${g.current_value} / ${g.target_value}${g.metric_key?' · '+g.metric_key:''} (${progress}%)</div></div>` : ''}
      </div>
      ${kids.map(k => renderGoalNode(k, depth+1)).join('')}
    `;
  };

  const roots = byParent['__root__'] || [];
  c.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Goals & OKRs</span>
        ${CU?.role==='Owner'?'<button class="btn btn-accent btn-sm" onclick="openGoalEdit(null)">+ New Goal</button>':''}
      </div>
      <div class="card-body">
        ${roots.length === 0 ? '<div style="color:var(--text-3);font-size:13px;text-align:center;padding:30px;">No goals yet. Owner can create the first one.</div>' : roots.map(g => renderGoalNode(g, 0)).join('')}
      </div>
    </div>
  `;
}

function openGoalEdit(goalId, parentId){
  const g = goalId ? GOALS.find(x => x.id === goalId) : {level: parentId ? 'individual' : 'company', status: 'active', parent_id: parentId||null};
  if(!g){ toast('Goal not found','err'); return; }
  const isNew = !goalId;
  // Suggest level: if parentId exists, default to one level deeper
  const parentLevel = parentId ? (GOALS.find(x=>x.id===parentId)?.level) : null;
  if(isNew && parentLevel){
    const idx = GOAL_LEVELS.indexOf(parentLevel);
    if(idx >= 0 && idx < GOAL_LEVELS.length-1) g.level = GOAL_LEVELS[idx+1];
  }
  openModal((isNew?'New':'Edit')+' Goal', `
    <div class="frow">
      <div class="fcol field"><label>Title *</label><input id="g-title" value="${esc(g.title||'')}"></div>
      <div class="fcol field"><label>Level</label><select id="g-level">${GOAL_LEVELS.map(l=>`<option value="${l}" ${g.level===l?'selected':''}>${GOAL_LEVEL_LABELS[l]}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Description</label><textarea id="g-desc" rows="2">${esc(g.description||'')}</textarea></div>
    <div class="frow">
      <div class="fcol field"><label>Target Value</label><input id="g-target" type="number" step="any" value="${g.target_value??''}"></div>
      <div class="fcol field"><label>Current Value</label><input id="g-current" type="number" step="any" value="${g.current_value??''}"></div>
      <div class="fcol field"><label>Metric Key</label><input id="g-metric" placeholder="e.g. won_revenue_ytd" value="${esc(g.metric_key||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Start</label><input id="g-start" type="date" value="${g.start_date||''}"></div>
      <div class="fcol field"><label>Due</label><input id="g-due" type="date" value="${g.due_date||''}"></div>
      <div class="fcol field"><label>Status</label><select id="g-status">${['active','complete','at_risk','abandoned'].map(s=>`<option value="${s}" ${g.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Parent Goal</label><select id="g-parent"><option value="">— top level —</option>${GOALS.filter(x=>x.id!==goalId).map(p=>`<option value="${p.id}" ${g.parent_id===p.id?'selected':''}>${esc(GOAL_LEVEL_LABELS[p.level])}: ${esc(p.title)}</option>`).join('')}</select></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteGoal('${g.id}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveGoal(${isNew?'null':`'${g.id}'`})">Save</button>
    </div>
  `);
}

async function saveGoal(goalId){
  const title = $('g-title')?.value.trim();
  if(!title){ toast('Title required','err'); return; }
  const g = {
    id: goalId || undefined,
    title,
    level: $('g-level').value,
    description: $('g-desc').value,
    target_value: $('g-target').value,
    current_value: $('g-current').value,
    metric_key: $('g-metric').value,
    start_date: $('g-start').value,
    due_date: $('g-due').value,
    status: $('g-status').value,
    parent_id: $('g-parent').value || null
  };
  const saved = await sbSaveGoal(g);
  if(!saved){ toast('Save failed','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = GOALS.findIndex(x=>x.id===saved.id);
    if(idx >= 0) GOALS[idx] = saved; else GOALS.unshift(saved);
  } else {
    await sbLoadGoals();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(goalId?'goal_edit':'goal_create', 'mgmt', {goal_id: goalId||saved?.id, title, level:g.level});
  closeModal();
  mgmt($('pg-content'));
  toast('Goal saved', 'ok');
}

async function deleteGoal(id){
  if(!confirm('Delete goal? Sub-goals will be cascaded.')) return;
  await sbDeleteGoal(id);
  GOALS = GOALS.filter(g => g.id !== id);
  if(typeof sbAuditLog==='function') sbAuditLog('goal_delete', 'mgmt', {goal_id: id});
  closeModal();
  mgmt($('pg-content'));
  toast('Goal deleted', 'ok');
}

// ── Team Activity (audit_log feed, Owner-only) ──
function renderTeamActivity(c){
  if(CU?.role !== 'Owner'){
    c.innerHTML = `<div class="card"><div class="card-body" style="color:var(--text-3);text-align:center;padding:30px;">Owner-only view.</div></div>`;
    return;
  }
  c.innerHTML = `<div class="card">
    <div class="card-hd"><span class="card-title">Team Activity</span><button class="btn btn-outline btn-sm" onclick="loadAuditLog()">↻ Reload</button></div>
    <div class="card-body" id="audit-log-body">
      <div style="color:var(--text-3);font-size:13px;">Loading…</div>
    </div>
  </div>`;
  loadAuditLog();
}

async function loadAuditLog(){
  const host = $('audit-log-body'); if(!host) return;
  try{
    const rows = await sbFetch('/audit_log?select=user_email,action,module,metadata,timestamp&order=timestamp.desc&limit=100');
    if(!Array.isArray(rows) || !rows.length){
      host.innerHTML = `<div style="color:var(--text-3);font-size:13px;">No audit activity yet.</div>`;
      return;
    }
    host.innerHTML = rows.map(r => `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:12.5px;">
        <span class="mono sm muted" style="min-width:140px;">${new Date(r.timestamp).toLocaleString()}</span>
        <span style="min-width:200px;">${esc(r.user_email||'')}</span>
        <span style="font-weight:600;color:var(--text-2);">${esc(r.action)}</span>
        <span class="muted sm">${esc(r.module||'')}</span>
        ${r.metadata?`<span class="mono sm muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title='${esc(JSON.stringify(r.metadata))}'>${esc(JSON.stringify(r.metadata).slice(0,80))}</span>`:''}
      </div>
    `).join('');
  }catch(e){ host.innerHTML = `<div style="color:var(--accent);font-size:13px;">Load failed: ${esc(e.message)}</div>`; }
}

function renderSystemPanel(c){
  c.innerHTML = `
    <div class="card mb16"><div class="card-hd"><span class="card-title">Pending Decisions</span></div><div class="card-body">
      ${[
        {t:'M07 Customers Module', d:'Scoping locked 2026-05-04: Sales+ can view customer scores. Data via Windward CSV import (waiting).', s:'approved'},
        {t:'M08 Employees Module', d:'Scoping locked 2026-05-04: Owner/Admin/Manager only. Employees CANNOT see own scores. Data via Windward CSV import (waiting).', s:'approved'},
        {t:'M03 Windward S5WebAPI', d:'Awaiting written confirmation that S5WebAPI is read-only and included in license.', s:'pending'},
        {t:'M04 BigCommerce API key', d:'Pending creation in BC admin → settings → API.', s:'pending'},
        {t:'M11 Supabase MCP fix', d:'Permission errors on direct MCP calls; SQL still must be pasted manually.', s:'pending'}
      ].map(d=>`<div style="padding:13px 0;border-bottom:1px solid var(--border-light);"><div style="display:flex;align-items:center;gap:9px;margin-bottom:5px;"><span class="badge bg-${d.s==='approved'?'green':'yellow'}">${d.s==='approved'?'Locked':'Pending'}</span><span style="font-weight:600;font-size:14px;">${d.t}</span></div><p style="font-size:13px;color:var(--text-2);line-height:1.6;">${d.d}</p></div>`).join('')}
    </div></div>
    <div class="g2">
      <div class="card"><div class="card-hd"><span class="card-title">Cost</span></div><div class="card-body">
        ${[['Cloudflare Pages','Hosting','$0/mo'],['Supabase','DB + Auth · free tier','$0/mo'],['Anthropic API','Pay-per-use','~$5/mo'],['Total','','~$5/mo']].map(([l,n,c],i)=>`<div style="display:flex;align-items:center;padding:9px 0;border-bottom:${i===3?'none':'1px solid var(--border-light)'};${i===3?'font-weight:700;border-top:2px solid var(--border);padding-top:13px;':''}font-size:13.5px;"><div style="flex:1;">${l}${n?`<div style="font-size:12px;color:var(--text-3);">${n}</div>`:''}</div><div class="mono" style="color:${i===3?'var(--green)':'var(--text)'};">${c}</div></div>`).join('')}
      </div></div>
      <div class="card"><div class="card-hd"><span class="card-title">Recent Build</span></div><div class="card-body">
        <div class="muted sm" style="margin-bottom:8px;">Run <code>bash scripts/status.sh</code> for live numbers.</div>
        <div style="font-size:13px;color:var(--text-2);line-height:1.7;">
          See <strong>SESSION_LOG.md</strong> for autonomous build history and <strong>BUILD_PLAN_CLAUDE.md</strong> for the active queue.
        </div>
      </div></div>
    </div>
  `;
}

