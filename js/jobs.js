// ── 5.2 JOB TRACKER (jobs table — see sql/M21_phase3_schema.sql) ──
let JOBS = [];
let jobFilter = {q:'', status:'', priority:''};
let JOB_NUM = 1;

async function sbLoadJobs(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/jobs?select=id,job_number,customer_id,customer_name,project_name,status,priority,assigned_to,due_date,estimated_hours,actual_hours,notes,related_quote_id,related_deal_id,created_at,updated_at,completed_at&order=updated_at.desc&limit=500');
    JOBS = Array.isArray(rows) ? rows : [];
    JOBS.forEach(j => { const m = /J-(\d+)/.exec(j.job_number||''); if(m){ const n = parseInt(m[1],10); if(n >= JOB_NUM) JOB_NUM = n+1; } });
    console.log(`[jobs] Loaded ${JOBS.length} jobs`);
    return JOBS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[jobs] table not yet created — run sql/M21_phase3_schema.sql');
    } else {
      console.warn('[sb] Load jobs failed:', e.message);
    }
    return false;
  }
}

async function sbSaveJob(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      job_number: rec.job_number || ('J-' + String(JOB_NUM).padStart(4,'0')),
      customer_id: rec.customer_id || null,
      customer_name: rec.customer_name || null,
      project_name: rec.project_name,
      status: rec.status || 'open',
      priority: rec.priority || 'normal',
      assigned_to: rec.assigned_to || null,
      due_date: rec.due_date || null,
      estimated_hours: rec.estimated_hours == null || rec.estimated_hours === '' ? null : Number(rec.estimated_hours),
      actual_hours: rec.actual_hours == null || rec.actual_hours === '' ? null : Number(rec.actual_hours),
      notes: rec.notes || null,
      related_quote_id: rec.related_quote_id || null,
      related_deal_id: rec.related_deal_id || null,
      updated_at: new Date().toISOString(),
      completed_at: rec.status === 'complete' ? (rec.completed_at || new Date().toISOString()) : null
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/jobs?on_conflict=id' : '/jobs';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]){ if(!rec.id) JOB_NUM++; return res[0]; }
    if(!rec.id) JOB_NUM++;
    return true;
  }catch(e){ console.warn('[sb] Save job failed:', e.message); return false; }
}

async function sbBulkSaveJobs(rows){
  if(!sbConfigured()) return false;
  if(!Array.isArray(rows) || !rows.length) return 0;
  try{
    const now = new Date().toISOString();
    const payload = rows.map(r => {
      const job_number = r.job_number || ('J-' + String(JOB_NUM++).padStart(4,'0'));
      return {
        job_number,
        customer_id: r.customer_id || null,
        customer_name: r.customer_name || null,
        project_name: r.project_name,
        status: r.status || 'open',
        priority: r.priority || 'normal',
        assigned_to: r.assigned_to || null,
        due_date: r.due_date || null,
        estimated_hours: r.estimated_hours == null || r.estimated_hours === '' ? null : Number(r.estimated_hours),
        actual_hours: r.actual_hours == null || r.actual_hours === '' ? null : Number(r.actual_hours),
        notes: r.notes || null,
        updated_at: now,
        completed_at: r.status === 'complete' ? (r.completed_at || now) : null
      };
    });
    const res = await sbFetch('/jobs', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(payload)});
    if(Array.isArray(res)) return res.length;
    return payload.length;
  }catch(e){ console.warn('[sb] Bulk save jobs failed:', e.message); return false; }
}

async function sbDeleteJob(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/jobs?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete job failed:', e.message); return false; }
}

function jobs(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openJobEdit(null)">+ New Job</button>`;
  renderJobs(el);
}

function renderJobs(el){
  const today = new Date(); today.setHours(0,0,0,0);
  const counts = {open:0, in_progress:0, blocked:0, complete:0, cancelled:0};
  let overdue = 0, dueSoon = 0;
  JOBS.forEach(j => {
    counts[j.status] = (counts[j.status]||0) + 1;
    if(j.status === 'complete' || j.status === 'cancelled' || !j.due_date) return;
    const d = new Date(j.due_date);
    const days = Math.round((d - today)/86400000);
    if(days < 0) overdue++;
    else if(days <= 7) dueSoon++;
  });

  // Filter
  const q = (jobFilter.q||'').toLowerCase();
  const filtered = JOBS.filter(j => {
    if(jobFilter.status && j.status !== jobFilter.status) return false;
    if(jobFilter.priority && j.priority !== jobFilter.priority) return false;
    if(q){
      const hay = `${j.project_name||''} ${j.customer_name||''} ${j.notes||''} ${j.job_number||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    // Active jobs first by due date asc; complete/cancelled last by updated desc
    const aActive = !['complete','cancelled'].includes(a.status);
    const bActive = !['complete','cancelled'].includes(b.status);
    if(aActive !== bActive) return aActive ? -1 : 1;
    if(aActive){
      // by priority then due date
      const prio = {urgent:0, high:1, normal:2, low:3};
      const pp = (prio[a.priority]??2) - (prio[b.priority]??2);
      if(pp) return pp;
      const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ad - bd;
    }
    return new Date(b.updated_at||0) - new Date(a.updated_at||0);
  });

  const canImport = CU && (CU.role === 'Owner' || CU.role === 'Admin' || CU.role === 'Manager' || CU.role === 'Sales');
  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Active Jobs</div><div class="stat-value">${(counts.open||0)+(counts.in_progress||0)+(counts.blocked||0)}</div><div class="stat-sub">${counts.open||0} open · ${counts.in_progress||0} in-progress · ${counts.blocked||0} blocked</div></div>
      <div class="card stat-card"${overdue?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Overdue</div><div class="stat-value" style="color:${overdue?'var(--accent)':'var(--text)'};">${overdue}</div><div class="stat-sub">Past due date</div></div>
      <div class="card stat-card"${dueSoon?` style="border-left:3px solid var(--yellow);"`:''}><div class="stat-label">Due ≤7d</div><div class="stat-value" style="color:${dueSoon?'var(--yellow)':'var(--text)'};">${dueSoon}</div><div class="stat-sub">Action needed</div></div>
      <div class="card stat-card"><div class="stat-label">Completed</div><div class="stat-value">${counts.complete||0}</div><div class="stat-sub">Total to date</div></div>
    </div>
    ${canImport ? `<div class="card mb16">
      <div class="card-hd"><span class="card-title">Import CSV</span></div>
      <div style="padding:14px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;">
        <input type="file" id="job-file" accept=".csv,text/csv" style="font-size:12px;" onchange="onJobFilePick(this)">
        <button class="btn btn-outline btn-sm" onclick="openJobCsvPaste()">Or paste CSV</button>
        <button class="btn btn-outline btn-sm" onclick="downloadJobCsvTemplate()">Download template</button>
        <span style="margin-left:auto;color:var(--text-3);">Headers: project_name (req), customer_name, status, priority, assigned_to, due_date, estimated_hours, notes</span>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Jobs · ${filtered.length}${filtered.length!==JOBS.length?` of ${JOBS.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="job-q" placeholder="Search…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:200px;" value="${esc(jobFilter.q)}" oninput="jobFilter.q=this.value;clearTimeout(window._jobDeb);window._jobDeb=setTimeout(()=>renderJobs($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="jobFilter.status=this.value;renderJobs($('pg-content'))">
            <option value="">All statuses</option>
            ${['open','in_progress','blocked','complete','cancelled'].map(s=>`<option value="${s}" ${jobFilter.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="jobFilter.priority=this.value;renderJobs($('pg-content'))">
            <option value="">All priorities</option>
            ${['urgent','high','normal','low'].map(p=>`<option value="${p}" ${jobFilter.priority===p?'selected':''}>${p}</option>`).join('')}
          </select>
          ${typeof savedFiltersBar==='function'?savedFiltersBar({moduleKey:'jobs',currentFilter:jobFilter,applyFn:()=>renderJobs($('pg-content')),fields:['q','status','priority'],resetState:{q:'',status:'',priority:''}}):''}
        </div>
      </div>
      ${typeof bulkSelBar==='function'?bulkSelBar('jobs'):''}
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th style="width:30px;">${typeof bulkSelHeaderCheckbox==='function'?bulkSelHeaderCheckbox('jobs',filtered.map(x=>x.id)):''}</th><th>#</th><th>Project</th><th>Customer</th><th>Status</th><th>Priority</th><th>Due</th><th>Hrs (est/act)</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-3);">${JOBS.length===0?'No jobs yet. Click "+ New Job" to create one (run M21 SQL first if save fails).':'No jobs match the current filter.'}</td></tr>` : filtered.map(j => {
              const sb = {open:'bg-blue', in_progress:'bg-yellow', blocked:'bg-red', complete:'bg-green', cancelled:'bg-gray'}[j.status] || 'bg-gray';
              const pb = {urgent:'bg-red', high:'bg-yellow', normal:'bg-gray', low:'bg-gray'}[j.priority] || 'bg-gray';
              const days = j.due_date && !['complete','cancelled'].includes(j.status) ? Math.round((new Date(j.due_date) - today)/86400000) : null;
              const dueCell = j.due_date ? `<span class="mono sm" style="color:${days!==null && days<0?'var(--accent)':days!==null && days<=7?'var(--yellow)':'var(--text-2)'};">${j.due_date}${days!==null?` <span style="font-size:10px;color:var(--text-3);">(${days<0?'overdue':days+'d'})</span>`:''}</span>` : '<span class="muted">—</span>';
              const hrsCell = (j.estimated_hours!=null || j.actual_hours!=null) ? `<span class="mono sm">${j.estimated_hours!=null?j.estimated_hours:'—'} / ${j.actual_hours!=null?j.actual_hours:'—'}</span>` : '<span class="muted">—</span>';
              const canEdit = CU && ['Owner','Admin','Manager','Sales','Warehouse'].includes(CU.role);
              const statusOpts = ['open','in_progress','blocked','complete','cancelled'];
              const priorityOpts = ['urgent','high','normal','low'];
              const statusCell = canEdit
                ? `<td onclick="event.stopPropagation();"><select data-id="${j.id}" data-field="status" data-orig="${esc(j.status)}" onchange="commitJobCellSelect(this)" style="font-size:11px;padding:3px 6px;border:1px solid var(--border-light);border-radius:4px;background:transparent;font-family:inherit;cursor:pointer;">${statusOpts.map(s=>`<option value="${s}" ${j.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select></td>`
                : `<td><span class="badge ${sb}" style="font-size:10px;">${esc(j.status.replace('_',' '))}</span></td>`;
              const priorityCell = canEdit
                ? `<td onclick="event.stopPropagation();"><select data-id="${j.id}" data-field="priority" data-orig="${esc(j.priority||'normal')}" onchange="commitJobCellSelect(this)" style="font-size:11px;padding:3px 6px;border:1px solid var(--border-light);border-radius:4px;background:transparent;font-family:inherit;cursor:pointer;">${priorityOpts.map(p=>`<option value="${p}" ${(j.priority||'normal')===p?'selected':''}>${p}</option>`).join('')}</select></td>`
                : `<td><span class="badge ${pb}" style="font-size:10px;">${esc(j.priority||'normal')}</span></td>`;
              return `<tr style="cursor:pointer;${['complete','cancelled'].includes(j.status)?'opacity:0.6;':''}" onclick="openJobEdit('${j.id}')">
                <td onclick="event.stopPropagation();">${typeof bulkSelCheckbox==='function'?bulkSelCheckbox('jobs',j.id):''}</td>
                <td class="mono sm">${esc(j.job_number||'—')}</td>
                <td style="font-weight:600;color:var(--accent);">${esc(j.project_name)}</td>
                <td class="sm">${esc(j.customer_name||'—')}</td>
                ${statusCell}
                ${priorityCell}
                <td>${dueCell}</td>
                <td>${hrsCell}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openJobEdit('${j.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  if(typeof bulkSelRegister === 'function'){
    const canEdit = CU && ['Owner','Admin','Manager','Sales','Warehouse'].includes(CU.role);
    bulkSelRegister('jobs', canEdit ? [
      {id:'complete', label:'✓ Mark complete', color:'outline', confirm:'Mark {n} jobs as complete?', fn: ids => doBulkJobStatus(ids, 'complete')},
      {id:'cancel', label:'✕ Mark cancelled', color:'outline', confirm:'Mark {n} jobs as cancelled?', fn: ids => doBulkJobStatus(ids, 'cancelled')}
    ] : []);
  }
}

async function doBulkJobStatus(ids, status){
  if(!ids?.length) return;
  let ok = 0, fail = 0;
  for(const id of ids){
    const r = await sbUpdateJobField(id, 'status', status);
    if(r){
      ok++;
      const idx = JOBS.findIndex(j => j.id === id);
      if(idx >= 0){
        JOBS[idx].status = status;
        if(status === 'complete') JOBS[idx].completed_at = new Date().toISOString();
        else if(status === 'cancelled') JOBS[idx].completed_at = null;
      }
    } else fail++;
  }
  if(typeof sbAuditLog==='function') sbAuditLog('jobs_bulk_status', 'jobs', {count: ok, status, failed: fail});
  bulkSelClear('jobs');
  renderJobs($('pg-content'));
  toast(`Updated ${ok}${fail?', '+fail+' failed':''}`, fail?'err':'ok');
}

function openJobEdit(jobId, preset){
  const isNew = !jobId;
  let j = isNew ? {status:'open', priority:'normal'} : JOBS.find(x => x.id === jobId);
  if(!j){ toast('Job not found','err'); return; }
  if(isNew && preset && typeof preset === 'object'){
    j = { ...j, ...preset };
  }
  // Customer dropdown
  const customerOptions = (typeof CUSTOMERS !== 'undefined' && CUSTOMERS.length) ? CUSTOMERS.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(c => `<option value="${c.id}" data-name="${esc(c.name||'')}" ${j.customer_id===c.id?'selected':''}>${esc(c.name||'')}</option>`).join('') : '';
  // Quote dropdown
  const quoteOptions = (typeof QUOTES !== 'undefined' && QUOTES.length) ? QUOTES.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(q => `<option value="${q._uuid||q.id}" ${j.related_quote_id===(q._uuid||q.id)?'selected':''}>${esc(q.id)} · ${esc(q.customer||q.project||'')}</option>`).join('') : '';
  openModal((isNew?'New':'Edit')+' Job', `
    <div class="frow">
      <div class="fcol field"><label>Project Name *</label><input id="jb-p" value="${esc(j.project_name||'')}"></div>
      <div class="fcol field"><label>Job # (auto if blank)</label><input id="jb-num" value="${esc(j.job_number||'')}" placeholder="J-${String(JOB_NUM).padStart(4,'0')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Customer (optional)</label>
        <select id="jb-c"><option value="">— none —</option>${customerOptions}</select>
      </div>
      <div class="fcol field"><label>Or type customer name</label><input id="jb-cn" value="${esc(j.customer_name||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Status</label>
        <select id="jb-s">${['open','in_progress','blocked','complete','cancelled'].map(s=>`<option value="${s}" ${j.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select>
      </div>
      <div class="fcol field"><label>Priority</label>
        <select id="jb-pr">${['low','normal','high','urgent'].map(p=>`<option value="${p}" ${j.priority===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Due Date</label><input id="jb-d" type="date" value="${esc(j.due_date||'')}"></div>
      <div class="fcol field"><label>Linked Quote</label>
        <select id="jb-q"><option value="">— none —</option>${quoteOptions}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Est. Hours</label><input id="jb-eh" type="number" step="0.25" value="${j.estimated_hours!=null?j.estimated_hours:''}"></div>
      <div class="fcol field"><label>Actual Hours</label><input id="jb-ah" type="number" step="0.25" value="${j.actual_hours!=null?j.actual_hours:''}"></div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="jb-notes" rows="3">${esc(j.notes||'')}</textarea></div>
    <input type="hidden" id="jb-deal" value="${esc(j.related_deal_id||'')}">
    ${j.related_deal_id ? `<div style="font-size:11px;color:var(--text-3);margin-top:-6px;">Linked to deal: <span class="mono">${esc(j.related_deal_id)}</span></div>` : ''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteJobConfirm('${jobId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveJob(${isNew?'null':`'${jobId}'`})">Save</button>
    </div>
  `);
}

async function saveJob(jobId){
  const project_name = $('jb-p')?.value?.trim();
  if(!project_name){ toast('Project name required','err'); return; }
  let customer_id = $('jb-c').value || null;
  let customer_name = $('jb-cn').value?.trim() || null;
  if(customer_id && !customer_name){
    const opt = $('jb-c').options[$('jb-c').selectedIndex];
    customer_name = opt?.getAttribute('data-name') || null;
  }
  // Auto-link by name if dropdown wasn't used but customer name was typed.
  // Same pattern as sbSaveQuote / sbSaveDeal — exact match links, no-match auto-creates a prospect.
  if(!customer_id && customer_name && Array.isArray(window.CUSTOMERS)){
    const norm = customer_name.toLowerCase().trim();
    const matches = window.CUSTOMERS.filter(c => (c.name||'').toLowerCase().trim() === norm);
    if(matches.length === 1){
      customer_id = matches[0].id;
    } else if(matches.length === 0 && typeof sbSaveCustomer === 'function'){
      try{
        const created = await sbSaveCustomer({
          name: customer_name,
          type: 'other',
          lifecycle_stage: 'prospect',
          first_seen: new Date().toISOString().slice(0,10),
          notes: 'Auto-created from job ' + project_name
        });
        if(created && created.id){ customer_id = created.id; window.CUSTOMERS.push(created); }
      }catch(e){ console.warn('[jobs] auto-create customer failed:', e.message); }
    }
  }
  const rec = {
    id: jobId || undefined,
    project_name,
    job_number: $('jb-num').value || null,
    customer_id,
    customer_name,
    status: $('jb-s').value,
    priority: $('jb-pr').value,
    due_date: $('jb-d').value || null,
    related_quote_id: $('jb-q').value || null,
    related_deal_id: $('jb-deal')?.value || null,
    estimated_hours: $('jb-eh').value || null,
    actual_hours: $('jb-ah').value || null,
    notes: $('jb-notes').value || null
  };
  const saved = await sbSaveJob(rec);
  if(!saved){ toast('Save failed — table may not exist (run M21 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = JOBS.findIndex(x => x.id === saved.id);
    if(idx >= 0) JOBS[idx] = saved; else JOBS.unshift(saved);
  } else {
    await sbLoadJobs();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(jobId?'job_edit':'job_create', 'jobs', {job_id: jobId||saved?.id, project_name, status: rec.status});
  closeModal();
  renderJobs($('pg-content'));
  toast('Job '+(jobId?'updated':'added'),'ok');
}

async function deleteJobConfirm(jobId){
  const j = JOBS.find(x => x.id === jobId);
  if(!j) return;
  if(!confirm(`Delete job "${j.project_name}"?`)) return;
  await sbDeleteJob(jobId);
  JOBS = JOBS.filter(x => x.id !== jobId);
  if(typeof sbAuditLog==='function') sbAuditLog('job_delete', 'jobs', {job_id: jobId, project_name: j.project_name});
  closeModal();
  renderJobs($('pg-content'));
  toast('Job deleted','ok');
}

// ── BULK CSV IMPORT (v6.10.41) ────────────────────────────
const _JOB_STATUSES = ['open','in_progress','blocked','complete','cancelled'];
const _JOB_PRIORITIES = ['urgent','high','normal','low'];

function downloadJobCsvTemplate(){
  const rows = [
    ['project_name','customer_name','status','priority','assigned_to','due_date','estimated_hours','notes'],
    ['Smith Residence — Master Bedroom Reno','John Smith','in_progress','high','Alice','2026-06-15','24','Lighting + ceiling fan install'],
    ['Acme Lobby Refresh','Acme Lighting Co.','open','normal','','2026-07-01','40','Pendant + recessed downlight package']
  ];
  if(typeof csvDownload === 'function'){
    csvDownload(rows, `jobs_template_${new Date().toISOString().slice(0,10)}.csv`);
  } else {
    const csv = rows.map(r => r.map(x => /[",\n]/.test(String(x)) ? `"${String(x).replace(/"/g,'""')}"` : String(x)).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `jobs_template_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  }
}

function openJobCsvPaste(){
  openModal(`
    <div class="modal-hd"><div class="modal-title">Paste CSV</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Paste CSV content (first row is headers)</label><textarea id="job-csv-paste" rows="12" style="width:100%;font-family:monospace;font-size:11px;padding:8px;border:1px solid var(--border);border-radius:6px;" placeholder="project_name,customer_name,status,priority,assigned_to,due_date,...
Smith Residence — Master Bedroom,John Smith,in_progress,high,Alice,..."></textarea></div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="processJobCsvText($('job-csv-paste').value)">Parse &amp; Preview</button>
    </div>
  `);
}

function onJobFilePick(input){
  const f = input.files && input.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e => processJobCsvText(e.target.result || '');
  reader.onerror = () => toast('File read failed','err');
  reader.readAsText(f);
}

function processJobCsvText(text){
  if(!text || !text.trim()){ toast('CSV is empty','err'); return; }
  if(typeof parseCsv !== 'function'){ toast('parseCsv helper missing','err'); return; }
  const rows = parseCsv(text);
  if(rows.length < 2){ toast('CSV has no data rows','err'); return; }
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
  const aliasMap = {
    'project_name':'project_name', 'project':'project_name', 'name':'project_name', 'title':'project_name', 'job_name':'project_name',
    'customer_name':'customer_name', 'customer':'customer_name', 'client':'customer_name', 'client_name':'customer_name', 'company':'customer_name',
    'status':'status', 'state':'status',
    'priority':'priority', 'pri':'priority',
    'assigned_to':'assigned_to', 'assignee':'assigned_to', 'owner':'assigned_to', 'rep':'assigned_to',
    'due_date':'due_date', 'due':'due_date', 'deadline':'due_date', 'target_date':'due_date',
    'estimated_hours':'estimated_hours', 'est_hours':'estimated_hours', 'estimate':'estimated_hours', 'hours':'estimated_hours',
    'actual_hours':'actual_hours', 'logged_hours':'actual_hours',
    'notes':'notes', 'note':'notes', 'comment':'notes', 'comments':'notes', 'description':'notes',
    'job_number':'job_number', 'number':'job_number'
  };
  const colMap = headers.map(h => aliasMap[h] || h);
  if(!colMap.includes('project_name')){ toast('CSV must include a "project_name" column','err'); return; }

  // Customer name lookup so customer_id auto-resolves
  const custByName = {};
  if(typeof CUSTOMERS !== 'undefined') CUSTOMERS.forEach(c => { if(c?.name) custByName[c.name.toLowerCase().trim()] = c.id; });

  const parsed = [];
  let unknownStatuses = new Set();
  let unknownPriorities = new Set();
  let unmatchedCustomers = new Set();
  for(let i=1; i<rows.length; i++){
    const r = rows[i];
    if(r.every(x => !x || !String(x).trim())) continue;
    const obj = {};
    colMap.forEach((c, idx) => { if(c) obj[c] = (r[idx]||'').trim(); });
    if(!obj.project_name){ continue; }
    if(obj.status){
      const s = obj.status.toLowerCase().replace(/\s+/g,'_');
      if(_JOB_STATUSES.includes(s)) obj.status = s;
      else { unknownStatuses.add(obj.status); obj.status = 'open'; }
    } else {
      obj.status = 'open';
    }
    if(obj.priority){
      const p = obj.priority.toLowerCase();
      if(_JOB_PRIORITIES.includes(p)) obj.priority = p;
      else { unknownPriorities.add(obj.priority); obj.priority = 'normal'; }
    } else {
      obj.priority = 'normal';
    }
    if(obj.customer_name){
      const id = custByName[obj.customer_name.toLowerCase().trim()];
      if(id) obj.customer_id = id;
      else unmatchedCustomers.add(obj.customer_name);
    }
    if(obj.estimated_hours){
      const n = Number(obj.estimated_hours);
      if(!isNaN(n) && n >= 0) obj.estimated_hours = n;
      else delete obj.estimated_hours;
    }
    if(obj.actual_hours){
      const n = Number(obj.actual_hours);
      if(!isNaN(n) && n >= 0) obj.actual_hours = n;
      else delete obj.actual_hours;
    }
    parsed.push(obj);
  }

  if(!parsed.length){ toast('No valid rows after parsing','err'); return; }

  const preview = parsed.slice(0, 10);
  const summary = `<div style="font-size:12px;margin-bottom:10px;line-height:1.6;">
    <strong>${parsed.length}</strong> job${parsed.length===1?'':'s'} parsed
    ${unmatchedCustomers.size ? `<br><span style="color:var(--accent);">${unmatchedCustomers.size} customer name${unmatchedCustomers.size===1?'':'s'} not found in CRM</span> (will save as free-text customer_name): ${[...unmatchedCustomers].slice(0,3).map(esc).join(', ')}${unmatchedCustomers.size>3?'…':''}` : ''}
    ${unknownStatuses.size ? `<br><span style="color:var(--text-3);">${unknownStatuses.size} unknown status → "open": ${[...unknownStatuses].slice(0,3).map(esc).join(', ')}${unknownStatuses.size>3?'…':''}</span>` : ''}
    ${unknownPriorities.size ? `<br><span style="color:var(--text-3);">${unknownPriorities.size} unknown priority → "normal": ${[...unknownPriorities].slice(0,3).map(esc).join(', ')}${unknownPriorities.size>3?'…':''}</span>` : ''}
  </div>`;
  const tbl = `<div style="border:1px solid var(--border);border-radius:6px;max-height:300px;overflow:auto;">
    <table style="margin:0;font-size:11px;width:100%;">
      <thead><tr><th>Project</th><th>Customer</th><th>Status</th><th>Pri</th><th>Due</th><th>Est hrs</th></tr></thead>
      <tbody>${preview.map(p=>`<tr>
        <td style="font-weight:500;">${esc(p.project_name||'')}</td>
        <td class="sm">${esc(p.customer_name||'')}${p.customer_id?' <span class="muted sm">·linked</span>':''}</td>
        <td><span class="badge bg-gray">${esc(p.status||'')}</span></td>
        <td><span class="badge bg-gray">${esc(p.priority||'')}</span></td>
        <td class="sm">${esc(p.due_date||'')}</td>
        <td class="mono sm">${p.estimated_hours!=null?p.estimated_hours:''}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
  const more = parsed.length > 10 ? `<div class="muted sm" style="margin-top:6px;">…and ${parsed.length-10} more.</div>` : '';

  window._jobStaged = parsed;
  openModal(`
    <div class="modal-hd"><div class="modal-title">Job Import Preview</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">${summary}${tbl}${more}</div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="commitJobCsv()">Import ${parsed.length} job${parsed.length===1?'':'s'}</button>
    </div>
  `);
}

// Quote → Job conversion helper. Called from the Saved Quotes modal "+ Job" button.
function createJobFromQuote(quoteIdOrUuid){
  if(typeof QUOTES === 'undefined' || !QUOTES.length){ toast('No quotes loaded','err'); return; }
  const q = QUOTES.find(x => x.id === quoteIdOrUuid || x._uuid === quoteIdOrUuid);
  if(!q){ toast('Quote not found','err'); return; }
  // Resolve customer_id from quote.customer name if a CRM record matches.
  let customer_id = null;
  let customer_name = q.customer || null;
  if(typeof CUSTOMERS !== 'undefined' && customer_name){
    const match = CUSTOMERS.find(c => c?.name && c.name.toLowerCase().trim() === customer_name.toLowerCase().trim());
    if(match){ customer_id = match.id; customer_name = match.name; }
  }
  // Pre-fill priority from quote total: high if ≥$10K, urgent if ≥$50K
  let priority = 'normal';
  if(q.total >= 50000) priority = 'urgent';
  else if(q.total >= 10000) priority = 'high';
  const seedNotes = [
    q.type ? `Project type: ${q.type}` : null,
    q.sqft ? `Sq ft: ${q.sqft}` : null,
    q.budget ? `Budget: ${q.budget}` : null,
    q.total ? `Quote total: $${Number(q.total).toLocaleString()}` : null,
    q.notes ? `Quote notes: ${q.notes}` : null
  ].filter(Boolean).join('\n');
  const preset = {
    project_name: q.project || (customer_name ? `${customer_name} project` : 'New project'),
    customer_id,
    customer_name,
    status: 'open',
    priority,
    related_quote_id: q._uuid || null,
    notes: seedNotes
  };
  closeModal();
  setTimeout(() => openJobEdit(null, preset), 50);
  if(typeof sbAuditLog==='function') sbAuditLog('job_from_quote', 'quotes', {quote_id: q._uuid||q.id, total: q.total});
}

// Quote / Deal → Job conversion helper. Called from the deal detail modal.
function createJobFromDeal(dealId){
  if(typeof findDealAnyStage !== 'function'){ toast('Pipeline module not loaded','err'); return; }
  const found = findDealAnyStage(dealId);
  if(!found){ toast('Deal not found','err'); return; }
  const d = found.deal;
  // Resolve customer_id from deal.company name if a CRM record matches.
  let customer_id = null;
  let customer_name = d.company || d.name || null;
  if(typeof CUSTOMERS !== 'undefined' && customer_name){
    const match = CUSTOMERS.find(c => c?.name && c.name.toLowerCase().trim() === customer_name.toLowerCase().trim());
    if(match){ customer_id = match.id; customer_name = match.name; }
  }
  // Pre-fill priority from deal value: high if ≥$10K, urgent if ≥$50K
  let priority = 'normal';
  if(d.value >= 50000) priority = 'urgent';
  else if(d.value >= 10000) priority = 'high';
  // Notes seed: keep deal context discoverable
  const seedNotes = [
    d.project_type ? `Project type: ${d.project_type}` : null,
    d.value ? `Deal value: $${Number(d.value).toLocaleString()}` : null,
    d.source ? `Source: ${d.source}` : null,
    d.notes ? `Deal notes: ${d.notes}` : null
  ].filter(Boolean).join('\n');
  const preset = {
    project_name: d.name || (customer_name ? `${customer_name} project` : 'New project'),
    customer_id,
    customer_name,
    status: 'open',
    priority,
    due_date: d.close || null,   // deal expected close → job target
    related_deal_id: d.id,
    notes: seedNotes
  };
  closeModal();
  // Tiny defer so the closeModal animation completes before the new modal opens.
  setTimeout(() => openJobEdit(null, preset), 50);
  if(typeof sbAuditLog==='function') sbAuditLog('job_from_deal', 'pipeline', {deal_id: d.id, deal_value: d.value});
}

// Single-row PATCH for inline edits (v6.10.49)
async function sbUpdateJobField(id, field, value){
  if(!sbConfigured() || !id || !field) return false;
  const allowed = ['status','priority','assigned_to','due_date','estimated_hours','actual_hours','notes'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value, updated_at: new Date().toISOString() };
    if(field === 'status' && value === 'complete') body.completed_at = new Date().toISOString();
    if(field === 'status' && value !== 'complete') body.completed_at = null;
    const res = await sbFetch(`/jobs?id=eq.${encodeURIComponent(id)}`, {
      method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update job field failed:', e.message); return false; }
}

async function commitJobCellSelect(select){
  if(!select) return;
  const id = select.dataset.id;
  const field = select.dataset.field;
  const orig = select.dataset.orig || '';
  const next = select.value;
  if(next === orig) return;
  const item = JOBS.find(j => j.id === id);
  if(!item){ select.value = orig; toast('Row not found','err'); return; }
  const prev = item[field];
  item[field] = next;
  if(field === 'status' && next === 'complete') item.completed_at = new Date().toISOString();
  if(field === 'status' && next !== 'complete') item.completed_at = null;
  select.dataset.orig = next;
  const res = await sbUpdateJobField(id, field, next);
  if(res === false){
    item[field] = prev;
    select.value = orig;
    select.dataset.orig = orig;
    toast(`Save failed — ${field} reverted`,'err');
    return;
  }
  // Re-render the badge styling — quick re-render of just this row would be cleaner,
  // but renderJobs is fast enough for the row counts we expect.
  if(typeof sbAuditLog==='function') sbAuditLog(`job_${field}_edit`, 'jobs', {job_id: id, field, from: prev, to: next});
  toast(`${item.job_number||'Job'} · ${field}: ${prev||'—'} → ${next}`, 'ok');
  renderJobs($('pg-content'));
}

async function commitJobCsv(){
  const staged = window._jobStaged || [];
  if(!staged.length){ toast('Nothing to import','err'); return; }
  toast(`Importing ${staged.length} jobs…`);
  const n = await sbBulkSaveJobs(staged);
  if(n === false){ toast('Import failed — table may not exist (run M21 SQL)','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog('jobs_import', 'jobs', {row_count: staged.length, source: 'csv'});
  await sbLoadJobs();
  delete window._jobStaged;
  closeModal();
  renderJobs($('pg-content'));
  toast(`Imported ${typeof n==='number'?n:staged.length} job${(typeof n==='number'?n:staged.length)===1?'':'s'}`,'ok');
}

