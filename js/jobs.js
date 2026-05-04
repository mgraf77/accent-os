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

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Active Jobs</div><div class="stat-value">${(counts.open||0)+(counts.in_progress||0)+(counts.blocked||0)}</div><div class="stat-sub">${counts.open||0} open · ${counts.in_progress||0} in-progress · ${counts.blocked||0} blocked</div></div>
      <div class="card stat-card"${overdue?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Overdue</div><div class="stat-value" style="color:${overdue?'var(--accent)':'var(--text)'};">${overdue}</div><div class="stat-sub">Past due date</div></div>
      <div class="card stat-card"${dueSoon?` style="border-left:3px solid var(--yellow);"`:''}><div class="stat-label">Due ≤7d</div><div class="stat-value" style="color:${dueSoon?'var(--yellow)':'var(--text)'};">${dueSoon}</div><div class="stat-sub">Action needed</div></div>
      <div class="card stat-card"><div class="stat-label">Completed</div><div class="stat-value">${counts.complete||0}</div><div class="stat-sub">Total to date</div></div>
    </div>
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
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>#</th><th>Project</th><th>Customer</th><th>Status</th><th>Priority</th><th>Due</th><th>Hrs (est/act)</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">${JOBS.length===0?'No jobs yet. Click "+ New Job" to create one (run M21 SQL first if save fails).':'No jobs match the current filter.'}</td></tr>` : filtered.map(j => {
              const sb = {open:'bg-blue', in_progress:'bg-yellow', blocked:'bg-red', complete:'bg-green', cancelled:'bg-gray'}[j.status] || 'bg-gray';
              const pb = {urgent:'bg-red', high:'bg-yellow', normal:'bg-gray', low:'bg-gray'}[j.priority] || 'bg-gray';
              const days = j.due_date && !['complete','cancelled'].includes(j.status) ? Math.round((new Date(j.due_date) - today)/86400000) : null;
              const dueCell = j.due_date ? `<span class="mono sm" style="color:${days!==null && days<0?'var(--accent)':days!==null && days<=7?'var(--yellow)':'var(--text-2)'};">${j.due_date}${days!==null?` <span style="font-size:10px;color:var(--text-3);">(${days<0?'overdue':days+'d'})</span>`:''}</span>` : '<span class="muted">—</span>';
              const hrsCell = (j.estimated_hours!=null || j.actual_hours!=null) ? `<span class="mono sm">${j.estimated_hours!=null?j.estimated_hours:'—'} / ${j.actual_hours!=null?j.actual_hours:'—'}</span>` : '<span class="muted">—</span>';
              return `<tr style="cursor:pointer;${['complete','cancelled'].includes(j.status)?'opacity:0.6;':''}" onclick="openJobEdit('${j.id}')">
                <td class="mono sm">${esc(j.job_number||'—')}</td>
                <td style="font-weight:600;color:var(--accent);">${esc(j.project_name)}</td>
                <td class="sm">${esc(j.customer_name||'—')}</td>
                <td><span class="badge ${sb}" style="font-size:10px;">${esc(j.status.replace('_',' '))}</span></td>
                <td><span class="badge ${pb}" style="font-size:10px;">${esc(j.priority||'normal')}</span></td>
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
}

function openJobEdit(jobId){
  const isNew = !jobId;
  const j = isNew ? {status:'open', priority:'normal'} : JOBS.find(x => x.id === jobId);
  if(!j){ toast('Job not found','err'); return; }
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
  const customer_id = $('jb-c').value || null;
  let customer_name = $('jb-cn').value?.trim() || null;
  if(customer_id && !customer_name){
    const opt = $('jb-c').options[$('jb-c').selectedIndex];
    customer_name = opt?.getAttribute('data-name') || null;
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

