// ── 6.8 INTELLIGENT ALERTS (alerts table — already exists in M02 schema, no new SQL needed) ──
// Generates persisted alerts from existing data on hydrate. Each generator returns
// items keyed by (type, source_id) so re-runs don't duplicate. Users see their own
// alerts (recipient_id = auth.uid()) plus broadcast alerts (recipient_id IS NULL).
//
// Generators in this version:
//   deal_stale         — active deals 14d+ no update, value ≥$2K
//   coop_deadline      — open coop funds with deadline ≤14d
//   quote_cold         — quotes >21d old, total ≥$500
//   inventory_low      — inventory items below reorder_point
//   delivery_overdue   — deliveries scheduled past today, not done
//   warranty_expiring  — open warranties expiring ≤30d
//   showroom_expiring  — showroom displays expiring ≤14d
//   po_overdue         — POs past expected_date, not received
//   score_dropped      — vendor scores dropped ≥3 points in last 7d (from CHANGELOG)

let ALERTS = [];
let alertFilter = {q:'', severity:'', status:'unread'};

async function sbLoadAlerts(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/alerts?select=id,recipient_id,recipient_role,type,severity,title,body,link,payload,status,created_at,read_at&order=created_at.desc&limit=500');
    ALERTS = Array.isArray(rows) ? rows : [];
    console.log(`[alerts] Loaded ${ALERTS.length} alerts`);
    return ALERTS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[alerts] table not yet created — should be in M02 schema');
    } else {
      console.warn('[sb] Load alerts failed:', e.message);
    }
    return false;
  }
}

async function sbInsertAlert(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      recipient_id: rec.recipient_id || null,
      recipient_role: rec.recipient_role || null,
      type: rec.type,
      severity: rec.severity || 'info',
      title: rec.title,
      body: rec.body || null,
      link: rec.link || null,
      payload: rec.payload || null,
      status: 'unread'
    };
    const res = await sbFetch('/alerts', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Insert alert failed:', e.message); return false; }
}

async function sbUpdateAlertStatus(id, status){
  if(!sbConfigured()) return false;
  try{
    const body = {status, read_at: status === 'read' || status === 'actioned' ? new Date().toISOString() : null};
    await sbFetch(`/alerts?id=eq.${encodeURIComponent(id)}`, {method:'PATCH', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(body)});
    return true;
  }catch(e){ console.warn('[sb] Update alert failed:', e.message); return false; }
}

// Dedupe key for a Signal. Canonical form: "type:source_id" (matches
// signalDedupeKey in js/signals.js). Retained here for in-memory scan
// suppression alongside shouldSuppress(). Falls back to legacy domain
// fields for backward-compatibility with rows emitted before payload.source_id
// was mandatory.
function alertKey(type, payload){
  if(typeof signalSourceId === 'function'){
    const sid = signalSourceId(type, payload);
    return sid ? `${type}:${sid}` : type;
  }
  if(!payload) return type;
  const id = payload.source_id || payload.deal_id || payload.coop_id || payload.quote_id || payload.inv_id || payload.delivery_id || payload.warranty_id || payload.showroom_id || payload.po_id || payload.vendor_id;
  return id ? `${type}:${id}` : type;
}

// Walk existing data, propose new Signals, route each through createSignal()
// which enforces source_id, dedupe, and type/severity validation.
async function generateAlertsFromData(){
  if(!sbConfigured()) return 0;
  if(typeof createSignal !== 'function'){
    console.warn('[alerts] createSignal() unavailable — js/signals.js must load before js/alerts.js');
    return 0;
  }
  // Build set of currently-active keys for fast in-memory pre-check
  // (createSignal also calls shouldSuppress, which is the authoritative check).
  const activeKeys = new Set();
  ALERTS.forEach(a => {
    if(['dismissed','actioned'].includes(a.status)) return;
    activeKeys.add(alertKey(a.type, a.payload));
  });

  const today = new Date(); today.setHours(0,0,0,0);
  const todayMs = today.getTime();
  const day = 86400000;
  const proposed = [];

  // 1. deal_stale
  if(typeof DEALS !== 'undefined'){
    Object.keys(DEALS).forEach(stage => {
      if(['won','lost','abandoned'].includes(stage)) return;
      (DEALS[stage]||[]).forEach(d => {
        if(!d.updated_at || (Number(d.value)||0) < 2000) return;
        const ageDays = Math.round((Date.now() - new Date(d.updated_at).getTime())/day);
        if(ageDays < 14) return;
        const key = `deal_stale:${d.id}`;
        if(activeKeys.has(key)) return;
        proposed.push({
          type:'deal_stale', severity: ageDays >= 30 ? 'urgent' : 'warn',
          title: `Stale deal: ${d.name}`,
          body: `${ageDays}d since last update · $${Math.round(d.value).toLocaleString()} · stage: ${stage}`,
          link: 'pipeline', payload: {source_id: String(d.id), deal_id: d.id, stage, value: d.value, age_days: ageDays}
        });
      });
    });
  }

  // 2. coop_deadline
  if(typeof COOP_FUNDS !== 'undefined'){
    COOP_FUNDS.forEach(c => {
      if(c.status !== 'open' || !c.deadline) return;
      const daysLeft = Math.round((new Date(c.deadline).getTime() - todayMs)/day);
      if(daysLeft < 0 || daysLeft > 14) return;
      const key = `coop_deadline:${c.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'coop_deadline', severity: daysLeft <= 7 ? 'urgent' : 'warn',
        title: `Co-op fund deadline ≤${daysLeft}d`,
        body: `${c.fund_type} · $${Number(c.amount||0).toLocaleString()} · expires ${c.deadline}`,
        link: 'vendors', payload: {source_id: String(c.id), coop_id: c.id, vendor_id: c.vendor_id, amount: c.amount, days_left: daysLeft}
      });
    });
  }

  // 3. quote_cold
  if(typeof QUOTES !== 'undefined'){
    QUOTES.forEach(q => {
      if(!q.date) return;
      const ageDays = Math.round((Date.now() - new Date(q.date).getTime())/day);
      if(ageDays < 21 || (Number(q.total)||0) < 500) return;
      const key = `quote_cold:${q._uuid||q.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'quote_cold', severity: 'warn',
        title: `Cold quote: ${q.id}`,
        body: `${ageDays}d old · ${q.customer||'(no customer)'} · $${Math.round(Number(q.total)||0).toLocaleString()}`,
        link: 'quotes', payload: {source_id: String(q._uuid || q.id), quote_id: q._uuid || q.id, age_days: ageDays}
      });
    });
  }

  // 4. inventory_low
  if(typeof INVENTORY !== 'undefined'){
    INVENTORY.forEach(r => {
      if(r.reorder_point == null) return;
      const avail = Number(r.qty_available)||0;
      const reorder = Number(r.reorder_point);
      if(avail >= reorder) return;
      const key = `inventory_low:${r.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'inventory_low', severity: avail === 0 ? 'urgent' : 'warn',
        title: `Low stock: ${r.sku}`,
        body: `${avail} on hand vs ${reorder} reorder point · ${r.vendor_name||''}${r.location?' · '+r.location:''}`,
        link: 'vendors', payload: {source_id: String(r.id), inv_id: r.id, sku: r.sku, qty: avail, reorder}
      });
    });
  }

  // 5. delivery_overdue
  if(typeof DELIVERIES !== 'undefined'){
    DELIVERIES.forEach(d => {
      if(['delivered','cancelled'].includes(d.status)) return;
      if(!d.scheduled_date) return;
      const overdueDays = Math.round((todayMs - new Date(d.scheduled_date).getTime())/day);
      if(overdueDays <= 0) return;
      const key = `delivery_overdue:${d.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'delivery_overdue', severity: 'urgent',
        title: `Overdue delivery: ${d.delivery_number||d.id}`,
        body: `${overdueDays}d past schedule · ${d.customer_name||''} · status: ${d.status}`,
        link: 'deliveries', payload: {source_id: String(d.id), delivery_id: d.id, customer_name: d.customer_name, overdue_days: overdueDays}
      });
    });
  }

  // 6. warranty_expiring
  if(typeof WARRANTY_CLAIMS !== 'undefined'){
    WARRANTY_CLAIMS.forEach(w => {
      if(['closed','denied','replaced','refunded'].includes(w.status)) return;
      if(!w.warranty_expires) return;
      const daysLeft = Math.round((new Date(w.warranty_expires).getTime() - todayMs)/day);
      if(daysLeft < 0 || daysLeft > 30) return;
      const key = `warranty_expiring:${w.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'warranty_expiring', severity: daysLeft <= 7 ? 'urgent' : 'warn',
        title: `Warranty expires ≤${daysLeft}d: ${w.claim_number||w.id}`,
        body: `${w.vendor_name||''} · ${w.sku||'(no SKU)'} · status: ${w.status}`,
        link: 'warranty', payload: {source_id: String(w.id), warranty_id: w.id, days_left: daysLeft}
      });
    });
  }

  // 7. showroom_expiring
  if(typeof SHOWROOM_DISPLAYS !== 'undefined'){
    SHOWROOM_DISPLAYS.forEach(s => {
      if(['expired','removed'].includes(s.status)) return;
      if(!s.expires_date) return;
      const daysLeft = Math.round((new Date(s.expires_date).getTime() - todayMs)/day);
      if(daysLeft < 0 || daysLeft > 14) return;
      const key = `showroom_expiring:${s.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'showroom_expiring', severity: daysLeft <= 7 ? 'warn' : 'info',
        title: `Display expiring ≤${daysLeft}d: ${s.display_name}`,
        body: `${s.vendor_name||''} · ${s.location||''} · expires ${s.expires_date}`,
        link: 'showrooms', payload: {source_id: String(s.id), showroom_id: s.id, days_left: daysLeft}
      });
    });
  }

  // 8. po_overdue
  if(typeof POS !== 'undefined'){
    POS.forEach(p => {
      if(['received','cancelled'].includes(p.status)) return;
      if(!p.expected_date) return;
      const overdueDays = Math.round((todayMs - new Date(p.expected_date).getTime())/day);
      if(overdueDays <= 0) return;
      const key = `po_overdue:${p.id}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'po_overdue', severity: overdueDays >= 14 ? 'urgent' : 'warn',
        title: `PO overdue: ${p.po_number||p.id}`,
        body: `${overdueDays}d past expected · ${p.vendor_name||''} · $${Math.round(Number(p.total)||0).toLocaleString()}`,
        link: 'purchaseorders', payload: {source_id: String(p.id), po_id: p.id, vendor_id: p.vendor_id, overdue_days: overdueDays}
      });
    });
  }

  // 9. score_dropped (from CHANGELOG, last 7 days)
  if(typeof CHANGELOG !== 'undefined'){
    const cutoff = Date.now() - 7*day;
    CHANGELOG.forEach(c => {
      if(!c.ts || !c.cat) return;
      if(['Categories','Notes','Tier','Inactive'].includes(c.cat)) return;
      const ts = new Date(c.ts).getTime();
      if(ts < cutoff) return;
      const oldN = parseFloat(c.oldVal), newN = parseFloat(c.newVal);
      if(isNaN(oldN) || isNaN(newN)) return;
      const delta = newN - oldN;
      if(delta > -3) return;   // only flag drops of 3+ points
      const key = `score_dropped:${c.vendor}:${c.cat}:${c.ts}`;
      if(activeKeys.has(key)) return;
      proposed.push({
        type:'score_dropped', severity: delta <= -5 ? 'urgent' : 'warn',
        title: `Score drop: ${c.vendor}`,
        body: `${c.cat}: ${oldN} → ${newN} (${delta}) · by ${c.user||'?'}`,
        link: 'vendors', payload: {source_id: `${c.vendor}:${c.cat}:${c.ts}`, vendor_name: c.vendor, category: c.cat, old: oldN, new: newN, ts: c.ts}
      });
    });
  }

  // Persist proposed Signals through createSignal() — the sanctioned writer.
  // It re-checks suppression (in case ALERTS changed mid-scan) and rejects
  // any payload missing source_id.
  if(proposed.length === 0) return 0;
  let inserted = 0;
  for(const p of proposed){
    const saved = await createSignal(p);
    if(saved){
      if(typeof saved === 'object' && saved.id) ALERTS.unshift(saved);
      inserted++;
    }
  }
  console.log(`[alerts] Generated ${inserted} new alerts (${proposed.length} proposed)`);
  return inserted;
}

function alerts(el, act){
  act.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="regenerateAlerts()">↻ Refresh</button>
    <button class="btn btn-outline btn-sm" onclick="markAllAlertsRead()">Mark all read</button>
  `;
  renderAlerts(el);
}

async function regenerateAlerts(){
  toast('Scanning for new alerts…');
  await sbLoadAlerts();
  const n = await generateAlertsFromData();
  toast(n > 0 ? `Generated ${n} new alerts` : 'No new alerts','ok');
  renderAlerts($('pg-content'));
}

async function markAllAlertsRead(){
  const unread = ALERTS.filter(a => a.status === 'unread');
  if(!unread.length){ toast('Nothing to mark','ok'); return; }
  if(!confirm(`Mark ${unread.length} unread alert(s) as read?`)) return;
  for(const a of unread){
    await sbUpdateAlertStatus(a.id, 'read');
    a.status = 'read';
    a.read_at = new Date().toISOString();
  }
  if(typeof sbAuditLog==='function') sbAuditLog('alerts_mark_all_read', 'alerts', {count: unread.length});
  renderAlerts($('pg-content'));
  toast('Marked read','ok');
}

function renderAlerts(el){
  // Stats
  const total = ALERTS.length;
  const counts = {unread:0, read:0, dismissed:0, actioned:0};
  const sevCounts = {urgent:0, warn:0, info:0};
  ALERTS.forEach(a => {
    counts[a.status] = (counts[a.status]||0)+1;
    if(a.status === 'unread') sevCounts[a.severity] = (sevCounts[a.severity]||0)+1;
  });

  const q = (alertFilter.q||'').toLowerCase();
  const filtered = ALERTS.filter(a => {
    if(alertFilter.status && a.status !== alertFilter.status) return false;
    if(alertFilter.severity && a.severity !== alertFilter.severity) return false;
    if(q){
      const hay = `${a.title||''} ${a.body||''} ${a.type||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    // Unread first; within each status group, urgent → warn → info, then newest first
    if(a.status !== b.status){
      const sOrder = {unread:0, read:1, actioned:2, dismissed:3};
      return (sOrder[a.status]??9) - (sOrder[b.status]??9);
    }
    const vOrder = {urgent:0, warn:1, info:2};
    const v = (vOrder[a.severity]??9) - (vOrder[b.severity]??9);
    if(v) return v;
    return new Date(b.created_at||0) - new Date(a.created_at||0);
  });

  el.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Intelligent Alerts.</strong> Auto-generated from existing data each session: stale deals, coop deadlines, cold quotes, low stock, overdue deliveries, expiring warranties / showroom displays, overdue POs, sharp score drops. Click <strong>↻ Refresh</strong> to re-scan now. Each alert is persisted; dismissed alerts can re-emerge on next scan if the underlying issue is still present.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"${counts.unread?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Unread</div><div class="stat-value" style="color:${counts.unread?'var(--accent)':'var(--text)'};">${counts.unread||0}</div><div class="stat-sub">${sevCounts.urgent||0} urgent · ${sevCounts.warn||0} warn · ${sevCounts.info||0} info</div></div>
      <div class="card stat-card"${sevCounts.urgent?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Urgent</div><div class="stat-value" style="color:${sevCounts.urgent?'var(--accent)':'var(--text)'};">${sevCounts.urgent||0}</div><div class="stat-sub">Action needed today</div></div>
      <div class="card stat-card"><div class="stat-label">Read / Actioned</div><div class="stat-value">${(counts.read||0)+(counts.actioned||0)}</div><div class="stat-sub">${counts.actioned||0} actioned · ${counts.dismissed||0} dismissed</div></div>
      <div class="card stat-card"><div class="stat-label">Total</div><div class="stat-value">${total}</div><div class="stat-sub">All time</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Alerts · ${filtered.length}${filtered.length!==total?` of ${total}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="al-q" placeholder="Search…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:200px;" value="${esc(alertFilter.q)}" oninput="alertFilter.q=this.value;clearTimeout(window._alDeb);window._alDeb=setTimeout(()=>renderAlerts($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="alertFilter.status=this.value;renderAlerts($('pg-content'))">
            <option value="unread" ${alertFilter.status==='unread'?'selected':''}>Unread</option>
            <option value="read" ${alertFilter.status==='read'?'selected':''}>Read</option>
            <option value="dismissed" ${alertFilter.status==='dismissed'?'selected':''}>Dismissed</option>
            <option value="actioned" ${alertFilter.status==='actioned'?'selected':''}>Actioned</option>
            <option value="" ${alertFilter.status===''?'selected':''}>All</option>
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="alertFilter.severity=this.value;renderAlerts($('pg-content'))">
            <option value="">All severity</option>
            <option value="urgent" ${alertFilter.severity==='urgent'?'selected':''}>Urgent</option>
            <option value="warn" ${alertFilter.severity==='warn'?'selected':''}>Warn</option>
            <option value="info" ${alertFilter.severity==='info'?'selected':''}>Info</option>
          </select>
        </div>
      </div>
      <div style="max-height:calc(100vh - 360px);overflow-y:auto;">
        ${filtered.length === 0 ? `<div style="padding:40px;text-align:center;color:var(--text-3);">${total===0?'No alerts yet. Click ↻ Refresh to run the heuristics over your current data.':'No alerts match the current filter.'}</div>` : filtered.map(a => {
          const sevColor = {urgent:'var(--accent)', warn:'var(--yellow)', info:'var(--blue)'}[a.severity] || 'var(--text-3)';
          const sevIcon = {urgent:'!', warn:'⚠', info:'ⓘ'}[a.severity] || '•';
          const isUnread = a.status === 'unread';
          return `<div style="padding:14px 18px;border-bottom:1px solid var(--border);${isUnread?'background:rgba(59,130,246,0.04);':''}display:flex;align-items:flex-start;gap:14px;">
            <span style="width:30px;height:30px;border-radius:50%;background:${sevColor};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">${sevIcon}</span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <strong style="font-size:13px;${isUnread?'':'color:var(--text-2);'}">${esc(a.title)}</strong>
                <span class="badge bg-gray" style="font-size:9px;text-transform:capitalize;">${esc((a.type||'').replace(/_/g,' '))}</span>
                ${a.status !== 'unread' ? `<span class="badge bg-gray" style="font-size:9px;text-transform:capitalize;">${esc(a.status)}</span>` : ''}
              </div>
              <div class="muted sm" style="margin-top:3px;">${esc(a.body||'')}</div>
              <div class="muted sm" style="margin-top:3px;font-size:10px;">${a.created_at?new Date(a.created_at).toLocaleString():''}${a.read_at?' · read '+new Date(a.read_at).toLocaleDateString():''}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
              ${a.link ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px;" onclick="alertGoTo('${a.id}','${esc(a.link)}')">Open →</button>` : ''}
              ${a.status === 'unread' ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px;" onclick="alertSetStatus('${a.id}','read')">Mark read</button>` : ''}
              ${a.status !== 'actioned' ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px;color:var(--green);" onclick="alertSetStatus('${a.id}','actioned')">Done</button>` : ''}
              ${a.status !== 'dismissed' ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px;color:var(--text-3);" onclick="alertSetStatus('${a.id}','dismissed')">Dismiss</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

async function alertSetStatus(alertId, newStatus){
  const a = ALERTS.find(x => x.id === alertId);
  if(!a) return;
  const ok = await sbUpdateAlertStatus(alertId, newStatus);
  if(!ok){ toast('Update failed','err'); return; }
  a.status = newStatus;
  if(newStatus === 'read' || newStatus === 'actioned') a.read_at = new Date().toISOString();
  if(typeof sbAuditLog==='function') sbAuditLog('alert_status', 'alerts', {alert_id: alertId, new_status: newStatus, type: a.type});
  renderAlerts($('pg-content'));
  toast(`Marked ${newStatus}`,'ok');
}

async function alertGoTo(alertId, page){
  // Mark read on click-through
  const a = ALERTS.find(x => x.id === alertId);
  if(a && a.status === 'unread'){
    await sbUpdateAlertStatus(alertId, 'read');
    a.status = 'read';
    a.read_at = new Date().toISOString();
  }
  goTo(page);
}

// Export unread count for any future bell-icon UI
function alertsUnreadCount(){
  return ALERTS.filter(a => a.status === 'unread').length;
}

// ── BELL ICON in topbar (rendered on every goTo + after hydrate) ──
let bellOpen = false;

function renderAlertBell(){
  const host = $('bell-host');
  if(!host) return;
  const unread = alertsUnreadCount();
  const top = ALERTS.filter(a => a.status === 'unread').sort((a,b) => {
    const v = {urgent:0, warn:1, info:2};
    const d = (v[a.severity]??9) - (v[b.severity]??9);
    if(d) return d;
    return new Date(b.created_at||0) - new Date(a.created_at||0);
  }).slice(0,5);

  const dot = unread > 0 ? `<span style="position:absolute;top:-3px;right:-3px;background:var(--accent);color:#fff;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;">${unread > 99 ? '99+' : unread}</span>` : '';
  const dropdown = bellOpen ? `
    <div style="position:absolute;top:36px;right:0;width:340px;background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow-md);z-index:50;max-height:480px;display:flex;flex-direction:column;">
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <strong style="font-size:13px;">Alerts</strong>
        <span class="muted sm">${unread} unread</span>
      </div>
      <div style="overflow-y:auto;flex:1;">
        ${top.length === 0 ? '<div style="padding:30px 14px;text-align:center;color:var(--text-3);font-size:12px;">No unread alerts.</div>' : top.map(a => {
          const sevColor = {urgent:'var(--accent)', warn:'var(--yellow)', info:'var(--blue)'}[a.severity] || 'var(--text-3)';
          return `<div onclick="bellHandleClick('${a.id}','${esc(a.link||'alerts')}')" style="padding:10px 14px;border-bottom:1px solid var(--border-light);cursor:pointer;display:flex;gap:10px;align-items:flex-start;">
            <span style="width:8px;height:8px;border-radius:50%;background:${sevColor};margin-top:5px;flex-shrink:0;"></span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;line-height:1.3;">${esc(a.title)}</div>
              <div class="muted sm" style="font-size:11px;line-height:1.3;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.body||'')}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="padding:8px 14px;border-top:1px solid var(--border);text-align:center;">
        <button class="btn btn-outline btn-sm" style="font-size:11px;" onclick="bellOpen=false;goTo('alerts')">View all alerts →</button>
      </div>
    </div>
  ` : '';

  host.innerHTML = `
    <button onclick="bellToggle()" style="background:transparent;border:none;cursor:pointer;font-size:18px;padding:6px 8px;color:var(--text-2);position:relative;" title="${unread} unread alert${unread===1?'':'s'}">
      ${unread > 0 ? '🔔' : '🔕'}
      ${dot}
    </button>
    ${dropdown}
  `;
}

function bellToggle(){
  bellOpen = !bellOpen;
  renderAlertBell();
  // Close on outside click
  if(bellOpen){
    setTimeout(() => {
      const closer = (e) => {
        if(!$('bell-host')?.contains(e.target)){
          bellOpen = false;
          renderAlertBell();
          document.removeEventListener('click', closer);
        }
      };
      document.addEventListener('click', closer);
    }, 0);
  }
}

async function bellHandleClick(alertId, page){
  bellOpen = false;
  await alertGoTo(alertId, page);
  renderAlertBell();
}

// Hook into goTo() to refresh bell on every page change
(function(){
  const origGoTo = (typeof goTo === 'function') ? goTo : null;
  if(origGoTo && !window._bellGoToWrapped){
    window._bellGoToWrapped = true;
    window.goTo = function(page){
      origGoTo(page);
      try { renderAlertBell(); } catch {}
    };
  }
})();

// Initial render after script loads (in case page is already active)
setTimeout(() => { try { renderAlertBell(); } catch {} }, 100);
