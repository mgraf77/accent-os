// ── ACTIVITY FEED / AUDIT TRAIL ──
// Owner-facing unified feed pulling three event streams:
//   - vendor_changelog (already loaded into CHANGELOG global)
//   - audit_log (action / module / metadata; loaded on demand)
//   - pipeline_events (deal stage changes / notes; loaded on demand)
// Pure-compute merge by timestamp. No new schema.
register({ name: 'activity_feed', provides: ['activity_feed','AF_AUDITS','AF_PIPELINE','sbLoadAuditLog','sbLoadPipelineEvents','renderActivityFeed'], consumes: ['sbFetch','sbConfigured','CU','CHANGELOG','$','esc','toast'] });

let AF_AUDITS = [];   // {ts, user, action, module, metadata}
let AF_PIPELINE = []; // {ts, deal_id, event_type, from_stage, to_stage, user, payload}
let afFilter = {q:'', stream:'', user:'', daysBack:30};
let afLoadedAt = 0;

async function sbLoadAuditLog(limit = 500){
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return false;
  try{
    const rows = await sbFetch(`/audit_log?select=user_email,action,module,metadata,timestamp&order=timestamp.desc&limit=${limit}`);
    AF_AUDITS = (rows||[]).map(r => ({
      ts: r.timestamp,
      user: r.user_email || 'system',
      action: r.action,
      module: r.module,
      metadata: r.metadata
    }));
    console.log(`[audit_log] Loaded ${AF_AUDITS.length} entries`);
    return AF_AUDITS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[audit_log] table not yet created');
    } else { console.warn('[audit_log] load failed:', e.message); }
    return false;
  }
}

async function sbLoadPipelineEvents(limit = 500){
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return false;
  try{
    const rows = await sbFetch(`/pipeline_events?select=deal_id,event_type,from_stage,to_stage,payload,timestamp&order=timestamp.desc&limit=${limit}`);
    AF_PIPELINE = (rows||[]).map(r => ({
      ts: r.timestamp,
      deal_id: r.deal_id,
      event_type: r.event_type,
      from_stage: r.from_stage,
      to_stage: r.to_stage,
      payload: r.payload
    }));
    console.log(`[pipeline_events] Loaded ${AF_PIPELINE.length} events`);
    return AF_PIPELINE.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[pipeline_events] table not yet created');
    } else { console.warn('[pipeline_events] load failed:', e.message); }
    return false;
  }
}

async function activity(c, actions){
  if(!c) return;
  // Lazy-load audit + pipeline streams on first visit (or if older than 5min)
  const fresh = (Date.now() - afLoadedAt) < 5*60*1000;
  if(!fresh){
    c.innerHTML = `<div class="card" style="padding:24px;text-align:center;color:var(--text-3);">Loading activity streams…</div>`;
    await Promise.all([sbLoadAuditLog(500), sbLoadPipelineEvents(500)]);
    afLoadedAt = Date.now();
  }
  renderActivityFeed(c, actions);
}

function renderActivityFeed(c, actions){
  if(actions){
    actions.innerHTML = `<button class="btn btn-outline btn-sm" onclick="afRefresh()" title="Reload all activity streams">Refresh</button>`;
  }

  // Merge into single sorted array
  const cutoff = Date.now() - (afFilter.daysBack || 30) * 86400000;
  const events = [];
  (CHANGELOG||[]).forEach(c => {
    const t = c.ts ? new Date(c.ts).getTime() : 0;
    if(!t || t < cutoff) return;
    events.push({
      ts: c.ts, t,
      stream:'vendor_change',
      user: c.user || 'unknown',
      title: `${c.vendor} · ${c.cat}`,
      detail: `${c.oldVal||'∅'} → ${c.newVal||'∅'}`,
      action: () => { goTo('vendors'); setTimeout(()=>{ if(typeof window.vSection !== 'undefined'){ window.vSection='changelog'; renderVendors($('pg-content')); } }, 80); }
    });
  });
  AF_AUDITS.forEach(a => {
    const t = a.ts ? new Date(a.ts).getTime() : 0;
    if(!t || t < cutoff) return;
    const meta = a.metadata && typeof a.metadata === 'object' ? a.metadata : {};
    const summary = Object.keys(meta).slice(0, 3).map(k => `${k}=${JSON.stringify(meta[k]).slice(0, 30)}`).join(' · ');
    events.push({
      ts: a.ts, t,
      stream:'audit',
      user: a.user || 'system',
      title: `${a.action}${a.module?' · '+a.module:''}`,
      detail: summary || '—',
      action: null
    });
  });
  AF_PIPELINE.forEach(p => {
    const t = p.ts ? new Date(p.ts).getTime() : 0;
    if(!t || t < cutoff) return;
    const stageMove = p.from_stage && p.to_stage ? `${p.from_stage} → ${p.to_stage}` : (p.event_type || '');
    events.push({
      ts: p.ts, t,
      stream:'pipeline',
      user: p.user || 'system',
      title: `Deal ${String(p.deal_id||'').slice(0,8)} · ${p.event_type||''}`,
      detail: stageMove,
      action: () => goTo('pipeline')
    });
  });
  events.sort((a,b) => b.t - a.t);

  // Stats
  const counts = {vendor_change:0, audit:0, pipeline:0};
  events.forEach(e => counts[e.stream]++);
  const users = [...new Set(events.map(e => e.user).filter(Boolean))].sort();

  // Filter
  const q = (afFilter.q||'').toLowerCase();
  const filtered = events.filter(e => {
    if(afFilter.stream && e.stream !== afFilter.stream) return false;
    if(afFilter.user && e.user !== afFilter.user) return false;
    if(q){
      const hay = `${e.title} ${e.detail} ${e.user}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Activity Feed.</strong> Unified view of every recorded change in AccentOS. Three streams: <strong>vendor changes</strong> (score / note / tier edits), <strong>audit log</strong> (logins / saves / bulk actions), <strong>pipeline events</strong> (deal stage moves). Newest first. Defaults to last 30 days.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Vendor Changes</div><div class="stat-value">${counts.vendor_change.toLocaleString()}</div><div class="stat-sub">Last ${afFilter.daysBack}d</div></div>
      <div class="card stat-card"><div class="stat-label">Audit Events</div><div class="stat-value">${counts.audit.toLocaleString()}</div><div class="stat-sub">Last ${afFilter.daysBack}d</div></div>
      <div class="card stat-card"><div class="stat-label">Pipeline Events</div><div class="stat-value">${counts.pipeline.toLocaleString()}</div><div class="stat-sub">Last ${afFilter.daysBack}d</div></div>
      <div class="card stat-card"><div class="stat-label">Active Users</div><div class="stat-value">${users.length}</div><div class="stat-sub">${users.slice(0,3).map(u=>u.split('@')[0]).join(', ')}${users.length>3?'…':''}</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Activity · ${filtered.length}${filtered.length!==events.length?' of '+events.length:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input placeholder="Search title / user…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:200px;" value="${esc(afFilter.q)}" oninput="afFilter.q=this.value;clearTimeout(window._afDeb);window._afDeb=setTimeout(()=>renderActivityFeed($('pg-content'),$('pg-actions')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="afFilter.stream=this.value;renderActivityFeed($('pg-content'),$('pg-actions'))">
            <option value="">All streams</option>
            <option value="vendor_change" ${afFilter.stream==='vendor_change'?'selected':''}>Vendor changes</option>
            <option value="audit" ${afFilter.stream==='audit'?'selected':''}>Audit log</option>
            <option value="pipeline" ${afFilter.stream==='pipeline'?'selected':''}>Pipeline events</option>
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="afFilter.user=this.value;renderActivityFeed($('pg-content'),$('pg-actions'))">
            <option value="">All users</option>
            ${users.map(u=>`<option value="${esc(u)}" ${afFilter.user===u?'selected':''}>${esc(u.split('@')[0])}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="afFilter.daysBack=Number(this.value);renderActivityFeed($('pg-content'),$('pg-actions'))">
            <option value="7" ${afFilter.daysBack===7?'selected':''}>Last 7d</option>
            <option value="30" ${afFilter.daysBack===30?'selected':''}>Last 30d</option>
            <option value="90" ${afFilter.daysBack===90?'selected':''}>Last 90d</option>
            <option value="365" ${afFilter.daysBack===365?'selected':''}>Last year</option>
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 380px);overflow-y:auto;">
        <table>
          <thead><tr><th>When</th><th>Stream</th><th>User</th><th>Event</th><th>Detail</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--text-3);">${events.length===0?'No activity yet — start using AccentOS and events will appear here.':'No events match the current filter.'}</td></tr>` : filtered.slice(0, 1000).map((e, i) => {
              const streamColor = {vendor_change:'var(--accent)', audit:'var(--blue)', pipeline:'var(--green)'}[e.stream] || 'var(--text-3)';
              const ago = _afTimeAgo(e.t);
              return `<tr ${e.action?`style="cursor:pointer;" onclick="window._afEvents[${i}]?.action?.()"`:''}>
                <td class="mono sm" title="${esc(e.ts)}">${ago}</td>
                <td><span class="badge" style="background:${streamColor};color:#fff;font-size:10px;text-transform:uppercase;">${e.stream.replace('_',' ')}</span></td>
                <td class="sm">${esc((e.user||'').split('@')[0]||e.user)}</td>
                <td class="sm" style="font-weight:600;">${esc(e.title)}</td>
                <td class="sm" style="color:var(--text-2);max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(e.detail)}">${esc(e.detail)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > 1000 ? `<div class="muted sm" style="padding:8px 14px;">Showing first 1000 of ${filtered.length}. Narrow the date range or filter for the full list.</div>` : ''}
    </div>
  `;
  // Stash filtered events for click-through
  window._afEvents = filtered.slice(0, 1000);
}

function _afTimeAgo(ts){
  const diff = Date.now() - ts;
  if(diff < 0) return 'now';
  const m = Math.floor(diff / 60000);
  if(m < 1) return 'now';
  if(m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if(h < 24) return h + 'h';
  const d = Math.floor(h / 24);
  if(d < 30) return d + 'd';
  const mo = Math.floor(d / 30);
  return mo + 'mo';
}

async function afRefresh(){
  toast('Reloading activity streams…');
  afLoadedAt = 0;
  await activity($('pg-content'), $('pg-actions'));
  toast('Activity refreshed','ok');
}
