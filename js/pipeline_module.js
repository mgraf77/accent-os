// ── PIPELINE MODULE (extracted from index.html at v6.11.1) ──
register({ name: 'pipeline_module', provides: ['pipeline','DEALS','STAGES','computeDealProbability'], consumes: ['sbFetch','CU','$','esc','toast'] });

// ══════════════════════════════════════════════════════════
// ── PIPELINE ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
// Track 1.5 — Pipeline stages match pipeline_deals.stage CHECK constraint.
// Kanban shows the active 5; Lost / Abandoned reachable via Archive button.
const STAGES=[
  {key:'lead',label:'Lead'},
  {key:'qualified',label:'Qualified'},
  {key:'quoted',label:'Quoted'},
  {key:'negotiating',label:'Negotiating'},
  {key:'won',label:'Won'}
];
const TERMINAL_STAGES = ['won','lost','abandoned'];
const ALL_STAGES = STAGES.map(s=>s.key).concat(['lost','abandoned']);
let DEALS={lead:[],qualified:[],quoted:[],negotiating:[],won:[],lost:[],abandoned:[]};
let DEAL_ID=1;

// 8-factor probability model. Each factor returns 0..1; weights sum to 1.0.
// Heuristic until real Accent win/loss data accumulates (then probability_model_log
// will recalibrate). Returns {prob: 0-100, factors: {...}}.
const PROBABILITY_WEIGHTS = {
  lead_source: 0.10,
  customer_history: 0.18,
  segment: 0.08,
  project_type: 0.10,
  quote_age: 0.12,
  comm_recency: 0.12,
  quote_size: 0.10,
  stage: 0.20
};
function computeDealProbability(d){
  const f = {};
  // 1. Lead source
  const sourceMap = {referral:0.85, repeat:0.90, designer:0.80, web:0.55, 'walk-in':0.55, cold:0.30};
  f.lead_source = sourceMap[(d.source||'').toLowerCase()] ?? 0.50;
  // 2. Customer history — has a linked customer_id with prior interactions = stronger
  f.customer_history = d.customer_id ? 0.75 : 0.40;
  // 3. Segment
  const segmentMap = {trade:0.75, designer:0.75, commercial:0.65, hospitality:0.70, residential:0.55, contractor:0.60, other:0.50};
  f.segment = segmentMap[(d.segment||'').toLowerCase()] ?? 0.55;
  // 4. Project type
  const projTypeMap = {'new build':0.70,'remodel':0.65,'replacement':0.60,'repair':0.50,'unknown':0.50};
  f.project_type = projTypeMap[(d.project_type||'').toLowerCase()] ?? 0.55;
  // 5. Quote age — newer is hotter
  if(d.quote_id){
    f.quote_age = 0.70;  // proxy: has a quote attached
  } else {
    f.quote_age = 0.40;
  }
  // 6. Communication recency — uses updated_at as a proxy
  if(d.updated_at){
    const days = Math.round((Date.now() - new Date(d.updated_at).getTime())/86400000);
    f.comm_recency = days <= 7 ? 0.85 : days <= 30 ? 0.55 : days <= 60 ? 0.30 : 0.15;
  } else {
    f.comm_recency = 0.50;
  }
  // 7. Quote size — bigger jobs close less often (heuristic curve)
  const v = Number(d.value)||0;
  f.quote_size = v < 5000 ? 0.75 : v < 25000 ? 0.65 : v < 100000 ? 0.50 : 0.35;
  // 8. Stage progression
  const stageMap = {lead:0.15, qualified:0.30, quoted:0.50, negotiating:0.70, won:1.0, lost:0.0, abandoned:0.0};
  f.stage = stageMap[d.stage] ?? 0.20;

  let p = 0;
  Object.keys(PROBABILITY_WEIGHTS).forEach(k => { p += (f[k]||0) * PROBABILITY_WEIGHTS[k]; });
  return {prob: Math.round(p * 100), factors: f};
}

async function sbLoadPipeline(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/pipeline_deals?select=id,customer_id,customer_name,quote_id,name,source,segment,project_type,value,stage,probability,probability_factors,expected_close,owner_id,loss_reason,created_at,updated_at&order=updated_at.desc&limit=500');
    if(!Array.isArray(rows)) return 0;
    DEALS = {lead:[],qualified:[],quoted:[],negotiating:[],won:[],lost:[],abandoned:[]};
    rows.forEach(r => {
      const d = {
        id: r.id,
        name: r.name,
        company: r.customer_name || '',
        customer_id: r.customer_id,
        quote_id: r.quote_id,
        value: Number(r.value)||0,
        close: r.expected_close,
        rep: '', // owner_id resolves to user later
        owner_id: r.owner_id,
        notes: '',
        source: r.source || '',
        segment: r.segment || '',
        project_type: r.project_type || '',
        stage: r.stage,
        loss_reason: r.loss_reason || '',
        probability: r.probability,
        updated_at: r.updated_at
      };
      (DEALS[r.stage] = DEALS[r.stage] || []).push(d);
    });
    console.log(`[pipeline_deals] Loaded ${rows.length} deals`);
    return rows.length;
  }catch(e){ console.warn('[sb] Load pipeline failed:', e.message); return false; }
}

async function sbSaveDeal(d){
  if(!sbConfigured()) return false;
  try{
    const {prob, factors} = computeDealProbability(d);
    d.probability = prob;
    const body = {
      id: d.id && d.id.length === 36 ? d.id : undefined,  // UUID detection
      name: d.name,
      customer_id: d.customer_id || null,
      customer_name: d.company || null,
      quote_id: d.quote_id || null,
      source: d.source || null,
      segment: d.segment || null,
      project_type: d.project_type || null,
      value: Number(d.value)||0,
      stage: d.stage,
      probability: prob,
      probability_factors: factors,
      expected_close: d.close || null,
      owner_id: d.owner_id || (CU?.user_id) || null,
      loss_reason: d.stage === 'lost' ? (d.loss_reason || null) : null,
      updated_at: new Date().toISOString()
    };
    const path = body.id ? '/pipeline_deals?on_conflict=id' : '/pipeline_deals';
    const res = await sbFetch(path, {
      method: 'POST',
      headers: {'Prefer': body.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'},
      body: JSON.stringify(body)
    });
    return Array.isArray(res) ? res[0] : null;
  }catch(e){ console.warn('[sb] Save deal failed:', e.message); return false; }
}

async function sbLogPipelineEvent(dealId, eventType, fromStage, toStage, payload){
  if(!sbConfigured()) return false;
  try{
    await sbFetch('/pipeline_events', {
      method: 'POST',
      headers: {'Prefer':'return=minimal'},
      body: JSON.stringify({
        deal_id: dealId,
        event_type: eventType,
        from_stage: fromStage || null,
        to_stage: toStage || null,
        payload: payload || null,
        user_id: (CU?.user_id) || null
      })
    });
    return true;
  }catch(e){ console.warn('[sb] Log pipeline event failed:', e.message); return false; }
}

async function sbDeleteDeal(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/pipeline_deals?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete deal failed:', e.message); return false; }
}

function pipeline(el,act){
  act.innerHTML=`<button class="btn btn-outline btn-sm" onclick="openPipelineAnalytics()" title="Funnel · conversion · time-in-stage · loss reasons">📊 Analytics</button><button class="btn btn-accent btn-sm" onclick="openAddDeal()">+ New Deal</button>`;
  renderPipeline(el);
}
function renderPipeline(el){
  const active = STAGES.flatMap(s => DEALS[s.key]||[]);
  const tv = active.reduce((s,d)=>s+(d.value||0),0);
  // Probability-weighted forecast — sums value × probability/100 for non-terminal deals
  const forecast = active.reduce((s,d) => {
    const p = (d.probability != null) ? d.probability : computeDealProbability(d).prob;
    return s + (d.value||0) * (p/100);
  }, 0);
  const wonCount = (DEALS.won||[]).length;
  const lostCount = (DEALS.lost||[]).length;
  const closeRate = (wonCount+lostCount) > 0 ? Math.round(100*wonCount/(wonCount+lostCount)) : null;

  el.innerHTML=`
  <div style="margin-bottom:14px;"><div class="card" style="padding:14px 22px;display:flex;gap:28px;flex-wrap:wrap;">
    <div><div class="stat-label" style="font-size:11px;">Active Pipeline</div><div class="stat-value" style="font-size:22px;">$${tv.toLocaleString()}</div></div>
    <div style="width:1px;background:var(--border);"></div>
    <div><div class="stat-label" style="font-size:11px;">Forecast (Σ value × prob)</div><div class="stat-value" style="font-size:22px;color:var(--green);">$${Math.round(forecast).toLocaleString()}</div></div>
    <div style="width:1px;background:var(--border);"></div>
    <div><div class="stat-label" style="font-size:11px;">Active Deals</div><div class="stat-value" style="font-size:22px;">${active.length}</div></div>
    <div style="width:1px;background:var(--border);"></div>
    <div><div class="stat-label" style="font-size:11px;">Close Rate</div><div class="stat-value" style="font-size:22px;">${closeRate!==null?closeRate+'%':'—'}</div><div class="stat-sub">Won/(Won+Lost) · ${wonCount}W ${lostCount}L</div></div>
    <div style="margin-left:auto;align-self:center;">
      <button class="btn btn-outline btn-sm" onclick="openArchive()">📁 Archive (${(DEALS.lost||[]).length+(DEALS.abandoned||[]).length})</button>
    </div>
  </div></div>
  <div class="p-cols">${STAGES.map(s=>`
    <div class="p-col">
      <div class="p-col-hd"><span class="p-col-title">${s.label}</span><span class="p-count">${(DEALS[s.key]||[]).length}</span></div>
      <div>${(DEALS[s.key]||[]).map(d=>dealHTML(d,s.key)).join('')}</div>
      <button class="add-btn" onclick="openAddDeal('${s.key}')">+ Add deal</button>
    </div>`).join('')}
  </div>`;
}

function openArchive(){
  const lost = (DEALS.lost||[]).map(d => ({...d, _stage:'lost'}));
  const abandoned = (DEALS.abandoned||[]).map(d => ({...d, _stage:'abandoned'}));
  const all = [...lost, ...abandoned].sort((a,b) => (b.updated_at||'').localeCompare(a.updated_at||''));
  openModal('Archived Deals', `<div style="max-height:480px;overflow-y:auto;">
    ${all.length === 0 ? '<div style="color:var(--text-3);padding:20px;text-align:center;">No archived deals.</div>' : all.map(d => `
      <div style="padding:10px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:12px;" onclick="closeModal();openDeal('${d.id}','${d._stage}')">
        <span class="badge bg-${d._stage==='lost'?'red':'gray'}" style="font-size:10px;text-transform:uppercase;">${d._stage}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;">${esc(d.name)}</div>
          <div class="muted sm">${esc(d.company||'')} · $${(d.value||0).toLocaleString()}${d.loss_reason?` · "${esc(d.loss_reason)}"`:''}</div>
        </div>
      </div>
    `).join('')}
  </div>`, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
}
function probColor(p){ if(p>=70) return 'var(--green)'; if(p>=40) return 'var(--blue)'; if(p>=20) return 'var(--yellow)'; return 'var(--accent)'; }
function dealHTML(d,k){
  const probDisplay = (d.probability != null) ? d.probability : computeDealProbability(d).prob;
  return `<div class="deal-card" onclick="openDeal('${d.id}','${k}')">
    <div class="deal-name">${esc(d.name)}</div>
    <div class="deal-co">${esc(d.company||'')}</div>
    <div class="deal-val">$${(d.value||0).toLocaleString()}</div>
    <div class="deal-meta">
      <span class="deal-rep">${esc(d.rep||(d.source||''))}</span>
      <span class="badge bg-gray" style="font-size:10px;color:${probColor(probDisplay)};font-weight:700;" title="8-factor probability">${probDisplay}%</span>
      ${d.close?`<span class="badge bg-gray" style="font-size:10px;">${d.close}</span>`:''}
    </div>
  </div>`;
}

function openAddDeal(def='lead', preset){
  if(!ALL_STAGES.includes(def)) def = 'lead';
  const p = preset || {};
  openModal('New Deal',`
  <div class="frow"><div class="fcol field"><label>Project Name *</label><input id="nd-n" value="${esc(p.name||'')}"></div><div class="fcol field"><label>Company / Customer</label><input id="nd-c" value="${esc(p.company||'')}"></div></div>
  <div class="frow"><div class="fcol field"><label>Value ($)</label><input id="nd-v" type="number" value="${esc(String(p.value||''))}"></div><div class="fcol field"><label>Expected Close</label><input id="nd-cl" type="date" value="${esc(p.close||'')}"></div></div>
  <div class="frow"><div class="fcol field"><label>Lead Source</label><select id="nd-src">${['','referral','repeat','designer','web','walk-in','cold','other'].map(s=>`<option value="${s}" ${p.source===s?'selected':''}>${s||'—'}</option>`).join('')}</select></div><div class="fcol field"><label>Segment</label><select id="nd-seg">${['','residential','trade','designer','contractor','commercial','hospitality','other'].map(s=>`<option value="${s}" ${p.segment===s?'selected':''}>${s||'—'}</option>`).join('')}</select></div></div>
  <div class="frow"><div class="fcol field"><label>Project Type</label><select id="nd-pt">${['','new build','remodel','replacement','repair','unknown'].map(s=>`<option value="${s}" ${p.project_type===s?'selected':''}>${s||'—'}</option>`).join('')}</select></div><div class="fcol field"><label>Stage</label><select id="nd-s">${STAGES.map(s=>`<option value="${s.key}" ${s.key===def?'selected':''}>${s.label}</option>`).join('')}</select></div></div>
  ${p.related_customer_id?`<input type="hidden" id="nd-cust" value="${esc(p.related_customer_id)}">`:''}`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-accent" onclick="saveDeal()">Add</button>`);
}

async function saveDeal(){
  const n=$('nd-n')?.value?.trim();if(!n){toast('Name required','err');return;}
  const s=$('nd-s').value;
  const d={
    name:n,
    company:$('nd-c')?.value||'',
    value:parseFloat($('nd-v')?.value)||0,
    close:$('nd-cl')?.value,
    source:$('nd-src')?.value||'',
    segment:$('nd-seg')?.value||'',
    project_type:$('nd-pt')?.value||'',
    stage:s,
    updated_at:new Date().toISOString()
  };
  const saved = await sbSaveDeal(d);
  if(saved){
    Object.assign(d, {id: saved.id, probability: saved.probability});
    sbLogPipelineEvent(d.id, 'stage_change', null, s, {created:true, name:n});
    if(typeof sbAuditLog==='function') sbAuditLog('deal_create', 'pipeline', {deal_id:d.id, name:n, value:d.value});
  } else {
    d.id = 'd'+(DEAL_ID++);
    const {prob} = computeDealProbability(d);
    d.probability = prob;
  }
  (DEALS[s] = DEALS[s]||[]).push(d);
  closeModal();log('acc','◈',`New deal: ${n}`,'Just now');toast('Deal added · '+(d.probability||0)+'% close prob','ok');goTo('pipeline');
}

function findDealAnyStage(id){
  for(const k of ALL_STAGES){
    const d = (DEALS[k]||[]).find(x => String(x.id) === String(id));
    if(d) return {deal:d, stage:k};
  }
  return null;
}

function openDeal(id,sk){
  const found = findDealAnyStage(id);
  if(!found) return;
  const d = found.deal; sk = found.stage;
  const {prob, factors} = computeDealProbability(d);
  openModal(d.name,`
    <div class="frow mb16">
      <div><div class="sec-label">Company</div>${esc(d.company||'—')}</div>
      <div style="text-align:right;"><div class="sec-label">Value</div><div class="mono" style="font-size:20px;color:var(--green);">$${(d.value||0).toLocaleString()}</div></div>
    </div>
    <div class="frow mb16">
      <div><div class="sec-label">Source</div>${esc(d.source||'—')}</div>
      <div><div class="sec-label">Segment</div>${esc(d.segment||'—')}</div>
      <div><div class="sec-label">Type</div>${esc(d.project_type||'—')}</div>
      <div><div class="sec-label">Close</div>${d.close||'—'}</div>
    </div>
    <div class="card mb16" style="background:var(--surface2);padding:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;">8-Factor Probability</span>
        <span class="mono" style="font-size:22px;font-weight:700;color:${probColor(prob)};">${prob}%</span>
      </div>
      <div style="font-size:11px;color:var(--text-2);display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
        ${Object.keys(PROBABILITY_WEIGHTS).map(k => `<div style="display:flex;justify-content:space-between;"><span>${k.replace(/_/g,' ')}</span><span class="mono" style="color:var(--text-3);">${Math.round((factors[k]||0)*100)}%</span></div>`).join('')}
      </div>
    </div>
    <div class="field"><label>Notes</label><textarea id="ed-no">${esc(d.notes||'')}</textarea></div>
    <div class="frow"><div class="fcol field"><label>Stage</label><select id="ed-s">${[...STAGES, {key:'lost',label:'Lost'}, {key:'abandoned',label:'Abandoned'}].map(s=>`<option value="${s.key}" ${s.key===sk?'selected':''}>${s.label}</option>`).join('')}</select></div><div class="fcol field" id="ed-loss-wrap" style="${sk==='lost'?'':'display:none;'}"><label>Loss Reason</label><input id="ed-loss" value="${esc(d.loss_reason||'')}"></div></div>`,
    `<button class="btn btn-outline" style="color:var(--accent);border-color:var(--accent);" onclick="delDeal('${d.id}','${sk}')">Delete</button>
     ${['quoted','negotiating','won'].includes(sk) && typeof createJobFromDeal==='function' ? `<button class="btn btn-outline" style="margin-right:auto;color:var(--green);border-color:var(--green);" onclick="createJobFromDeal('${d.id}')" title="Pre-fill a new Job from this deal's data">+ Create Job</button>` : ''}
     <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-accent" onclick="updDeal('${d.id}','${sk}')">Save</button>`);
  // Wire stage change → toggle loss reason field
  const stageSel = $('ed-s'); const lossWrap = $('ed-loss-wrap');
  if(stageSel && lossWrap){
    stageSel.addEventListener('change', () => { lossWrap.style.display = stageSel.value === 'lost' ? '' : 'none'; });
  }
}

async function updDeal(id, os){
  const found = findDealAnyStage(id);
  if(!found) return;
  const d = found.deal;
  const ns = $('ed-s').value;
  d.notes = $('ed-no').value;
  if(ns === 'lost') d.loss_reason = $('ed-loss')?.value || '';
  d.stage = ns;
  d.updated_at = new Date().toISOString();
  const saved = await sbSaveDeal(d);
  if(saved && saved.probability != null) d.probability = saved.probability;
  if(ns !== os){
    DEALS[os] = (DEALS[os]||[]).filter(x => x.id !== id);
    (DEALS[ns] = DEALS[ns]||[]).push(d);
    sbLogPipelineEvent(d.id, 'stage_change', os, ns, {});
  } else {
    sbLogPipelineEvent(d.id, 'note', null, null, {note: d.notes ? d.notes.slice(0,120) : ''});
  }
  if(typeof sbAuditLog==='function') sbAuditLog('deal_update', 'pipeline', {deal_id:id, from_stage:os, to_stage:ns});
  closeModal();
  toast('Updated · '+(d.probability||0)+'% close prob','ok');
  goTo('pipeline');
}

async function delDeal(id, sk){
  if(!confirm('Remove this deal?')) return;
  await sbDeleteDeal(id);
  DEALS[sk] = (DEALS[sk]||[]).filter(x => x.id !== id);
  if(typeof sbAuditLog==='function') sbAuditLog('deal_delete', 'pipeline', {deal_id:id});
  closeModal();
  goTo('pipeline');
}

