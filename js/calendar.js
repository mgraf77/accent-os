// ── 5.16 COMPANY CALENDAR (calendar_events table — see sql/M21_phase3_schema.sql) ──
register({ name: 'calendar', provides: ['calendar','CAL_EVENTS','sbLoadCalendarEvents','sbSaveCalendarEvent','sbDeleteCalendarEvent'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });
let CAL_EVENTS = [];
let calView = 'month';   // 'month' | 'list'
let calCursor = null;    // YYYY-MM-01 anchor

async function sbLoadCalendarEvents(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/calendar_events?select=id,title,description,category,starts_at,ends_at,all_day,location,url,visible_to_roles,owner_id,created_at,updated_at&order=starts_at.asc&limit=2000');
    CAL_EVENTS = Array.isArray(rows) ? rows : [];
    console.log(`[calendar_events] Loaded ${CAL_EVENTS.length} events`);
    return CAL_EVENTS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[calendar_events] table not yet created — run sql/M21_phase3_schema.sql');
    } else {
      console.warn('[sb] Load calendar_events failed:', e.message);
    }
    return false;
  }
}

async function sbSaveCalendarEvent(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      title: rec.title,
      description: rec.description || null,
      category: rec.category || 'other',
      starts_at: rec.starts_at,
      ends_at: rec.ends_at || null,
      all_day: !!rec.all_day,
      location: rec.location || null,
      url: rec.url || null,
      visible_to_roles: rec.visible_to_roles || ['Owner','Admin','Manager','Sales','Warehouse'],
      owner_id: (CU?.user_id) || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/calendar_events?on_conflict=id' : '/calendar_events';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save calendar_event failed:', e.message); return false; }
}

async function sbDeleteCalendarEvent(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/calendar_events?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete calendar_event failed:', e.message); return false; }
}

function calendar(el, act){
  if(!calCursor){
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
    calCursor = d.toISOString().slice(0,10);
  }
  act.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="calView='${calView==='month'?'list':'month'}';renderCalendar($('pg-content'))">${calView==='month'?'☰ List':'▦ Month'}</button>
    <button class="btn btn-outline btn-sm" onclick="exportCalendarIcs()" title="Export upcoming events as .ics for Google Cal / Outlook">⬇ .ics</button>
    <button class="btn btn-accent btn-sm" onclick="openCalendarEdit(null)">+ New Event</button>
  `;
  renderCalendar(el);
}

function renderCalendar(el){
  const cursor = new Date(calCursor);
  const yr = cursor.getFullYear();
  const mo = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, {month:'long', year:'numeric'});

  // Stats: upcoming 30d, this month, by category
  const now = new Date();
  const in30 = new Date(now.getTime() + 30*86400000);
  const upcoming30 = CAL_EVENTS.filter(e => {
    const s = new Date(e.starts_at);
    return s >= now && s <= in30;
  });
  const thisMonth = CAL_EVENTS.filter(e => {
    const s = new Date(e.starts_at);
    return s.getFullYear() === yr && s.getMonth() === mo;
  });
  const byCat = {};
  upcoming30.forEach(e => byCat[e.category||'other'] = (byCat[e.category||'other']||0)+1);

  const navBar = `
    <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 18px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="btn btn-outline btn-sm" onclick="calShiftMonth(-1)">‹</button>
      <strong style="font-size:15px;min-width:170px;text-align:center;">${monthLabel}</strong>
      <button class="btn btn-outline btn-sm" onclick="calShiftMonth(1)">›</button>
      <button class="btn btn-outline btn-sm" onclick="calToday()">Today</button>
      <span style="margin-left:auto;color:var(--text-3);font-size:12px;">
        ${thisMonth.length} this month · ${upcoming30.length} upcoming 30d
      </span>
    </div>
  `;

  if(calView === 'list'){
    const futureSorted = [...CAL_EVENTS].filter(e => new Date(e.ends_at||e.starts_at) >= new Date()).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
    el.innerHTML = navBar + `
      <div class="card">
        <div class="card-hd"><span class="card-title">Upcoming Events · ${futureSorted.length}</span></div>
        ${futureSorted.length === 0 ? '<div style="padding:36px;text-align:center;color:var(--text-3);">No upcoming events. Click "+ New Event" to add one.</div>' : `
          <div style="max-height:calc(100vh - 360px);overflow-y:auto;">
            ${futureSorted.map(e => calListRow(e)).join('')}
          </div>
        `}
      </div>
    `;
    return;
  }

  // Month grid
  const firstDay = new Date(yr, mo, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(yr, mo+1, 0).getDate();
  const cells = [];
  for(let i=0; i<startDow; i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(d);
  while(cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = {};
  CAL_EVENTS.forEach(e => {
    const s = new Date(e.starts_at);
    if(s.getFullYear() !== yr || s.getMonth() !== mo) return;
    const day = s.getDate();
    (eventsByDay[day] = eventsByDay[day]||[]).push(e);
  });

  const todayStr = new Date().toDateString();
  const cellHTML = cells.map((d, i) => {
    if(d === null) return `<div style="background:var(--bg-2);border:1px solid var(--border);min-height:88px;"></div>`;
    const cellDate = new Date(yr, mo, d);
    const isToday = cellDate.toDateString() === todayStr;
    const events = eventsByDay[d] || [];
    return `<div style="background:var(--surface);border:1px solid var(--border);${isToday?'box-shadow:inset 0 0 0 2px var(--accent);':''}min-height:88px;padding:4px 6px;cursor:pointer;display:flex;flex-direction:column;gap:2px;" onclick="openCalendarEdit(null, '${cellDate.toISOString().slice(0,10)}')">
      <div style="font-size:11px;font-weight:${isToday?'700':'600'};color:${isToday?'var(--accent)':'var(--text-2)'};">${d}</div>
      ${events.slice(0,3).map(e => {
        const catColor = catColorFor(e.category);
        return `<div onclick="event.stopPropagation();openCalendarDetail('${e.id}')" style="font-size:10px;padding:2px 5px;background:${catColor};color:#fff;border-radius:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;" title="${esc(e.title)}">${esc(e.title)}</div>`;
      }).join('')}
      ${events.length > 3 ? `<div style="font-size:10px;color:var(--text-3);">+${events.length-3} more</div>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = navBar + `
    <div class="card" style="padding:14px;">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0;font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;margin-bottom:6px;">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div style="padding:6px 4px;text-align:center;">${d}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0;">${cellHTML}</div>
    </div>
    <div style="margin-top:14px;font-size:11px;color:var(--text-3);display:flex;gap:14px;flex-wrap:wrap;">
      ${['trade_show','training','deadline','holiday','meeting','launch','other'].map(c => `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:11px;height:11px;border-radius:2px;background:${catColorFor(c)};"></span>${c.replace('_',' ')}</span>`).join('')}
    </div>
  `;
}

function catColorFor(cat){
  return ({
    trade_show: '#7c3aed',  // purple
    training:   '#10b981',  // green
    deadline:   '#ef4444',  // red
    holiday:    '#f59e0b',  // amber
    meeting:    '#3b82f6',  // blue
    launch:     '#ec4899',  // pink
    other:      '#6b7280'   // gray
  })[cat] || '#6b7280';
}

function calListRow(e){
  const s = new Date(e.starts_at);
  const dateStr = e.all_day ? s.toLocaleDateString() : s.toLocaleString(undefined, {dateStyle:'medium', timeStyle:'short'});
  const catColor = catColorFor(e.category);
  return `<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="openCalendarDetail('${e.id}')">
    <span style="width:6px;align-self:stretch;background:${catColor};border-radius:3px;flex-shrink:0;"></span>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:600;font-size:13px;">${esc(e.title)}</div>
      <div class="muted sm">${dateStr}${e.location?' · '+esc(e.location):''}</div>
    </div>
    <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc((e.category||'other').replace('_',' '))}</span>
  </div>`;
}

function calShiftMonth(delta){
  const d = new Date(calCursor);
  d.setMonth(d.getMonth() + delta);
  calCursor = d.toISOString().slice(0,10);
  renderCalendar($('pg-content'));
}

function calToday(){
  const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
  calCursor = d.toISOString().slice(0,10);
  renderCalendar($('pg-content'));
}

function openCalendarDetail(eventId){
  const e = CAL_EVENTS.find(x => x.id === eventId);
  if(!e){ toast('Event not found','err'); return; }
  const s = new Date(e.starts_at);
  const ee = e.ends_at ? new Date(e.ends_at) : null;
  const fmt = d => e.all_day ? d.toLocaleDateString() : d.toLocaleString(undefined, {dateStyle:'medium', timeStyle:'short'});
  const catColor = catColorFor(e.category);
  openModal(e.title, `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span class="badge" style="background:${catColor};color:#fff;font-size:10px;text-transform:uppercase;">${esc((e.category||'other').replace('_',' '))}</span>
      ${e.all_day?'<span class="badge bg-gray" style="font-size:10px;">all-day</span>':''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div><div class="muted sm">Starts</div><div>${fmt(s)}</div></div>
      <div><div class="muted sm">Ends</div><div>${ee?fmt(ee):'—'}</div></div>
      <div><div class="muted sm">Location</div><div>${esc(e.location||'—')}</div></div>
      <div><div class="muted sm">Link</div><div>${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener" style="color:var(--accent);">${esc(e.url.length>40?e.url.slice(0,37)+'…':e.url)}</a>`:'—'}</div></div>
    </div>
    ${e.description?`<div class="card" style="padding:10px 14px;background:var(--bg-2);margin-bottom:12px;"><div class="muted sm">Details</div><div style="white-space:pre-wrap;font-size:13px;">${esc(e.description)}</div></div>`:''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCalendarEventConfirm('${e.id}')">Delete</button>
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-accent" onclick="openCalendarEdit('${e.id}')">Edit</button>
    </div>
  `);
}

function openCalendarEdit(eventId, defaultDate){
  const isNew = !eventId;
  const e = isNew ? {category:'meeting', all_day:false} : CAL_EVENTS.find(x => x.id === eventId);
  if(!e){ toast('Event not found','err'); return; }
  const toLocal = (iso) => {
    if(!iso) return '';
    const d = new Date(iso);
    if(isNaN(d)) return '';
    const tzOff = d.getTimezoneOffset()*60000;
    return new Date(d - tzOff).toISOString().slice(0,16);
  };
  const startVal = e.starts_at ? toLocal(e.starts_at) : (defaultDate ? defaultDate + 'T09:00' : '');
  const endVal = e.ends_at ? toLocal(e.ends_at) : '';
  openModal((isNew?'New':'Edit')+' Event', `
    <div class="fg"><label>Title *</label><input id="ce-t" value="${esc(e.title||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>Category</label>
        <select id="ce-c">
          ${['meeting','trade_show','training','deadline','holiday','launch','other'].map(c=>`<option value="${c}" ${e.category===c?'selected':''}>${c.replace('_',' ')}</option>`).join('')}
        </select>
      </div>
      <div class="fcol field" style="display:flex;align-items:flex-end;gap:8px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input id="ce-ad" type="checkbox" ${e.all_day?'checked':''}> All-day</label></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Starts *</label><input id="ce-s" type="datetime-local" value="${startVal}"></div>
      <div class="fcol field"><label>Ends</label><input id="ce-e" type="datetime-local" value="${endVal}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Location</label><input id="ce-l" value="${esc(e.location||'')}"></div>
      <div class="fcol field"><label>URL</label><input id="ce-u" value="${esc(e.url||'')}" placeholder="https://"></div>
    </div>
    <div class="fg"><label>Description</label><textarea id="ce-d" rows="3">${esc(e.description||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCalendarEventConfirm('${eventId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveCalendarEvent(${isNew?'null':`'${eventId}'`})">Save</button>
    </div>
  `);
}

async function saveCalendarEvent(eventId){
  const title = $('ce-t')?.value?.trim();
  const startsLocal = $('ce-s')?.value;
  if(!title){ toast('Title required','err'); return; }
  if(!startsLocal){ toast('Start date required','err'); return; }
  const endsLocal = $('ce-e')?.value;
  const rec = {
    id: eventId || undefined,
    title,
    category: $('ce-c').value || 'meeting',
    all_day: $('ce-ad').checked,
    starts_at: new Date(startsLocal).toISOString(),
    ends_at: endsLocal ? new Date(endsLocal).toISOString() : null,
    location: $('ce-l').value || null,
    url: $('ce-u').value || null,
    description: $('ce-d').value || null
  };
  const saved = await sbSaveCalendarEvent(rec);
  if(!saved){ toast('Save failed — table may not exist yet (run M21 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = CAL_EVENTS.findIndex(x => x.id === saved.id);
    if(idx >= 0) CAL_EVENTS[idx] = saved; else CAL_EVENTS.push(saved);
  } else {
    await sbLoadCalendarEvents();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(eventId?'cal_event_edit':'cal_event_create', 'calendar', {event_id: eventId||saved?.id, title, category: rec.category});
  closeModal();
  renderCalendar($('pg-content'));
  toast('Event '+(eventId?'updated':'added'),'ok');
}

async function deleteCalendarEventConfirm(eventId){
  const e = CAL_EVENTS.find(x => x.id === eventId);
  if(!e) return;
  if(!confirm(`Delete event "${e.title}"?`)) return;
  await sbDeleteCalendarEvent(eventId);
  CAL_EVENTS = CAL_EVENTS.filter(x => x.id !== eventId);
  if(typeof sbAuditLog==='function') sbAuditLog('cal_event_delete', 'calendar', {event_id: eventId, title: e.title});
  closeModal();
  renderCalendar($('pg-content'));
  toast('Event deleted','ok');
}

function _icsEscape(s){
  return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
}
function _icsDt(iso, allDay){
  if(!iso) return null;
  const d = new Date(iso);
  if(isNaN(d)) return null;
  if(allDay){
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth()+1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    return `${y}${m}${dd}`;
  }
  return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
}
function _icsFold(line){
  // RFC 5545: lines >75 octets must be folded with CRLF + space.
  if(line.length <= 75) return line;
  const out = [];
  let i = 0;
  while(i < line.length){
    out.push((i===0?'':' ') + line.slice(i, i + (i===0?75:74)));
    i += (i===0?75:74);
  }
  return out.join('\r\n');
}

function exportCalendarIcs(){
  if(!CAL_EVENTS || !CAL_EVENTS.length){ toast('No events to export','warn'); return; }
  const now = new Date();
  const horizon = new Date(now.getTime() - 30*24*60*60*1000); // include events from past 30d
  const upcoming = CAL_EVENTS.filter(e => {
    const s = new Date(e.starts_at);
    return !isNaN(s) && s >= horizon;
  }).sort((a,b) => new Date(a.starts_at) - new Date(b.starts_at));
  if(!upcoming.length){ toast('No upcoming events to export','warn'); return; }

  const dtstamp = _icsDt(now.toISOString(), false);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AccentOS//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AccentOS Calendar',
    'X-WR-TIMEZONE:UTC'
  ];
  for(const e of upcoming){
    const dtStart = _icsDt(e.starts_at, e.all_day);
    if(!dtStart) continue;
    let dtEnd = _icsDt(e.ends_at, e.all_day);
    if(!dtEnd){
      const s = new Date(e.starts_at);
      if(e.all_day){
        s.setUTCDate(s.getUTCDate()+1);
        dtEnd = _icsDt(s.toISOString(), true);
      } else {
        s.setHours(s.getHours()+1);
        dtEnd = _icsDt(s.toISOString(), false);
      }
    }
    const uid = `${e.id || ('ev-'+Math.random().toString(36).slice(2,10))}@accentos`;
    const startTag = e.all_day ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`;
    const endTag = e.all_day ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(startTag);
    lines.push(endTag);
    lines.push(_icsFold('SUMMARY:' + _icsEscape(e.title || '(untitled)')));
    if(e.description) lines.push(_icsFold('DESCRIPTION:' + _icsEscape(e.description)));
    if(e.location) lines.push(_icsFold('LOCATION:' + _icsEscape(e.location)));
    if(e.url) lines.push(_icsFold('URL:' + _icsEscape(e.url)));
    if(e.category) lines.push('CATEGORIES:' + _icsEscape(String(e.category).toUpperCase()));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');

  const ics = lines.join('\r\n') + '\r\n';
  const stamp = now.toISOString().slice(0,10);
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `accentos-calendar-${stamp}.ics`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  if(typeof sbAuditLog==='function') sbAuditLog('cal_export_ics', 'calendar', {count: upcoming.length});
  toast(`Exported ${upcoming.length} event${upcoming.length===1?'':'s'} to .ics`, 'ok');
}
