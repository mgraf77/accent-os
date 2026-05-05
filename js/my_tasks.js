// ── MY TASKS — per-user personal task list (v6.10.38) ──
// localStorage-only v1 (no Supabase, no schema, no Michael handoff).
// Keyed on the current user_id so each session stays personal.
// Daily Brief surfaces "due today" + "overdue" counts.

let MY_TASKS = [];
const _MT_STATUSES = ['open','in_progress','done'];
const _MT_PRIORITIES = ['low','normal','high','urgent'];

function _mtKey(){
  const uid = (typeof CU !== 'undefined' && CU?.user_id) || 'anon';
  return `accentos_my_tasks_${uid}`;
}
function loadMyTasks(){
  try{
    const raw = localStorage.getItem(_mtKey());
    MY_TASKS = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(MY_TASKS)) MY_TASKS = [];
  }catch(e){ MY_TASKS = []; }
  return MY_TASKS;
}
function saveMyTasks(){
  try{ localStorage.setItem(_mtKey(), JSON.stringify(MY_TASKS)); return true; }
  catch(e){ console.warn('[my_tasks] persist failed:', e.message); return false; }
}

function _mtTodayStr(){ return new Date().toISOString().slice(0,10); }
function _mtIsOverdue(t){
  if(!t.due_date || t.status === 'done') return false;
  return t.due_date < _mtTodayStr();
}
function _mtIsDueToday(t){
  if(!t.due_date || t.status === 'done') return false;
  return t.due_date === _mtTodayStr();
}

let _mtFilter = { q:'', status:'all', priority:'all' };

function mytasks(el, act){
  if(!MY_TASKS.length && !window._mtLoaded){ loadMyTasks(); window._mtLoaded = true; }
  act.innerHTML = `
    <button class="btn btn-accent btn-sm" onclick="openMyTaskEdit(null)">+ New Task</button>
  `;
  renderMyTasks(el);
}

function renderMyTasks(el){
  const total = MY_TASKS.length;
  const open = MY_TASKS.filter(t => t.status !== 'done').length;
  const overdue = MY_TASKS.filter(_mtIsOverdue).length;
  const dueToday = MY_TASKS.filter(_mtIsDueToday).length;
  const done = total - open;

  const q = _mtFilter.q.toLowerCase();
  let rows = MY_TASKS.slice();
  if(_mtFilter.status !== 'all') rows = rows.filter(t => t.status === _mtFilter.status);
  if(_mtFilter.priority !== 'all') rows = rows.filter(t => (t.priority||'normal') === _mtFilter.priority);
  if(q) rows = rows.filter(t => (t.title||'').toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q));
  rows.sort((a,b) => {
    // open first, then due_date asc (no due_date last), then created desc
    const aDone = a.status === 'done' ? 1 : 0;
    const bDone = b.status === 'done' ? 1 : 0;
    if(aDone !== bDone) return aDone - bDone;
    if((a.due_date||'') !== (b.due_date||'')){
      if(!a.due_date) return 1;
      if(!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    return (b.created_at||'').localeCompare(a.created_at||'');
  });

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Open</div><div class="stat-value">${open}</div><div class="stat-sub">of ${total} total</div></div>
      <div class="card stat-card"><div class="stat-label">Due Today</div><div class="stat-value" style="${dueToday?'color:#92400e;':''}">${dueToday}</div><div class="stat-sub">${dueToday?'Plan your day':'Nothing today'}</div></div>
      <div class="card stat-card"><div class="stat-label">Overdue</div><div class="stat-value" style="${overdue?'color:#991b1b;':''}">${overdue}</div><div class="stat-sub">${overdue?'Past due date':'All on track'}</div></div>
      <div class="card stat-card"><div class="stat-label">Completed</div><div class="stat-value">${done}</div><div class="stat-sub">All-time</div></div>
    </div>

    <div class="card mb16"><div class="card-body">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="mt-q" placeholder="Search title or notes…" value="${esc(_mtFilter.q)}"
               oninput="_mtFilter.q=this.value;renderMyTasks($('pg-content'));"
               style="flex:1;min-width:200px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;">
        <select onchange="_mtFilter.status=this.value;renderMyTasks($('pg-content'));"
                style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;">
          ${['all',..._MT_STATUSES].map(s => `<option value="${s}" ${_mtFilter.status===s?'selected':''}>${s==='all'?'All statuses':s.replace('_',' ')}</option>`).join('')}
        </select>
        <select onchange="_mtFilter.priority=this.value;renderMyTasks($('pg-content'));"
                style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;">
          ${['all',..._MT_PRIORITIES].map(p => `<option value="${p}" ${_mtFilter.priority===p?'selected':''}>${p==='all'?'All priorities':p}</option>`).join('')}
        </select>
        <span style="color:var(--text-3);font-size:12px;">${rows.length} shown</span>
      </div>
    </div></div>

    <div class="card"><div class="card-body" style="padding:0;">
      ${rows.length === 0
        ? `<div style="padding:32px;text-align:center;color:var(--text-3);">No tasks yet. Click <b>+ New Task</b> to add one. Tasks live in your browser only — they don't sync between devices.</div>`
        : `<table class="t" style="width:100%;">
            <thead><tr>
              <th style="width:36px;"></th>
              <th>Title</th>
              <th style="width:110px;">Due</th>
              <th style="width:90px;">Priority</th>
              <th style="width:120px;">Status</th>
              <th style="width:90px;text-align:right;">Actions</th>
            </tr></thead>
            <tbody>
              ${rows.map(_mtRow).join('')}
            </tbody>
          </table>`}
    </div></div>
  `;
}

function _mtRow(t){
  const overdue = _mtIsOverdue(t);
  const dueToday = _mtIsDueToday(t);
  const dueColor = overdue ? '#991b1b' : (dueToday ? '#92400e' : 'var(--text-2)');
  const prMap = { urgent:'red', high:'amber', normal:'gray', low:'gray' };
  const stMap = { open:'gray', in_progress:'blue', done:'green' };
  const checked = t.status === 'done' ? 'checked' : '';
  const titleStyle = t.status === 'done' ? 'text-decoration:line-through;color:var(--text-3);' : '';
  return `
    <tr style="border-top:1px solid var(--border-light);${overdue?'background:#fef2f2;':''}">
      <td style="padding:10px;text-align:center;">
        <input type="checkbox" ${checked} onchange="toggleMyTaskDone('${t.id}')" style="cursor:pointer;width:16px;height:16px;">
      </td>
      <td style="padding:10px;cursor:pointer;${titleStyle}" onclick="openMyTaskEdit('${t.id}')">
        <div style="font-weight:500;">${esc(t.title||'(untitled)')}</div>
        ${t.notes ? `<div style="font-size:12px;color:var(--text-3);margin-top:2px;">${esc(t.notes.slice(0,90))}${t.notes.length>90?'…':''}</div>` : ''}
      </td>
      <td style="padding:10px;color:${dueColor};font-size:13px;${overdue?'font-weight:600;':''}">
        ${t.due_date ? (overdue ? `⚠ ${t.due_date}` : (dueToday ? `📌 Today` : t.due_date)) : '—'}
      </td>
      <td style="padding:10px;"><span class="badge bg-${prMap[t.priority]||'gray'}">${t.priority||'normal'}</span></td>
      <td style="padding:10px;"><span class="badge bg-${stMap[t.status]||'gray'}">${(t.status||'open').replace('_',' ')}</span></td>
      <td style="padding:10px;text-align:right;">
        <button class="btn btn-outline btn-xs" onclick="openMyTaskEdit('${t.id}')">Edit</button>
        <button class="btn btn-outline btn-xs" onclick="deleteMyTaskConfirm('${t.id}')" style="color:#991b1b;">×</button>
      </td>
    </tr>
  `;
}

function toggleMyTaskDone(id){
  const t = MY_TASKS.find(x => x.id === id);
  if(!t) return;
  t.status = t.status === 'done' ? 'open' : 'done';
  t.completed_at = t.status === 'done' ? new Date().toISOString() : null;
  saveMyTasks();
  renderMyTasks($('pg-content'));
  if(typeof refreshAlertBell === 'function') refreshAlertBell();
}

function openMyTaskEdit(id){
  const t = id ? MY_TASKS.find(x => x.id === id) : null;
  const isNew = !t;
  const rec = t || { id:'mt-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), title:'', notes:'', due_date:'', priority:'normal', status:'open', created_at:new Date().toISOString() };
  openModal(`
    <div class="modal-hd"><div class="modal-title">${isNew?'New Task':'Edit Task'}</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body" style="display:grid;gap:12px;">
      <label>Title<input id="mt-f-title" value="${esc(rec.title)}" placeholder="What needs doing?" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;"></label>
      <label>Notes<textarea id="mt-f-notes" rows="4" placeholder="Optional details…" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-family:inherit;">${esc(rec.notes||'')}</textarea></label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        <label>Due date<input id="mt-f-due" type="date" value="${esc(rec.due_date||'')}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;"></label>
        <label>Priority<select id="mt-f-priority" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;">
          ${_MT_PRIORITIES.map(p => `<option value="${p}" ${rec.priority===p?'selected':''}>${p}</option>`).join('')}
        </select></label>
        <label>Status<select id="mt-f-status" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;">
          ${_MT_STATUSES.map(s => `<option value="${s}" ${rec.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
        </select></label>
      </div>
    </div>
    <div class="modal-ft">
      ${isNew ? '' : `<button class="btn btn-outline" style="color:#991b1b;margin-right:auto;" onclick="deleteMyTaskConfirm('${rec.id}')">Delete</button>`}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveMyTaskFromModal('${rec.id}', ${isNew})">Save</button>
    </div>
  `);
  setTimeout(()=>$('mt-f-title')?.focus(), 50);
}

function saveMyTaskFromModal(id, isNew){
  const title = $('mt-f-title').value.trim();
  if(!title){ toast('Title is required','warn'); return; }
  const rec = {
    id,
    title,
    notes: $('mt-f-notes').value.trim(),
    due_date: $('mt-f-due').value || '',
    priority: $('mt-f-priority').value,
    status: $('mt-f-status').value,
    created_at: isNew ? new Date().toISOString() : (MY_TASKS.find(x=>x.id===id)?.created_at || new Date().toISOString()),
    updated_at: new Date().toISOString()
  };
  if(rec.status === 'done') rec.completed_at = new Date().toISOString();
  if(isNew){
    MY_TASKS.push(rec);
  } else {
    const i = MY_TASKS.findIndex(x => x.id === id);
    if(i >= 0) MY_TASKS[i] = { ...MY_TASKS[i], ...rec };
  }
  saveMyTasks();
  closeModal();
  renderMyTasks($('pg-content'));
  toast(isNew ? 'Task added' : 'Task updated', 'ok');
}

function deleteMyTaskConfirm(id){
  const t = MY_TASKS.find(x => x.id === id);
  if(!t) return;
  if(!confirm(`Delete task "${t.title}"?`)) return;
  MY_TASKS = MY_TASKS.filter(x => x.id !== id);
  saveMyTasks();
  closeModal();
  renderMyTasks($('pg-content'));
  toast('Task deleted','ok');
}

// Surface counts to the Daily Brief tile generator.
function myTasksDueTodayCount(){
  if(!window._mtLoaded){ loadMyTasks(); window._mtLoaded = true; }
  return MY_TASKS.filter(_mtIsDueToday).length;
}
function myTasksOverdueCount(){
  if(!window._mtLoaded){ loadMyTasks(); window._mtLoaded = true; }
  return MY_TASKS.filter(_mtIsOverdue).length;
}
