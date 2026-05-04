// ── 5.10 DELIVERY SCHEDULING (deliveries table — see sql/M27_deliveries_schema.sql) ──
// Schedule and track customer / job-site deliveries. Status workflow:
// scheduled → out_for_delivery → delivered / failed / rescheduled / cancelled.
// Auto-numbered as DLV-####. Optional linkage to job, quote, or PO.

let DELIVERIES = [];
let dlvFilter = {q:'', status:'', when:'upcoming'};
let DLV_NUM = 1;

async function sbLoadDeliveries(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/deliveries?select=id,delivery_number,customer_id,customer_name,address,scheduled_date,time_window,driver,vehicle,status,items_summary,weight_lbs,signature_required,signature_name,delivered_at,failure_reason,notes,related_job_id,related_quote_id,related_po_id,assigned_to,created_at,updated_at&order=scheduled_date.asc.nullslast,updated_at.desc&limit=500');
    DELIVERIES = Array.isArray(rows) ? rows : [];
    DELIVERIES.forEach(d => { const m = /DLV-(\d+)/.exec(d.delivery_number||''); if(m){ const n = parseInt(m[1],10); if(n >= DLV_NUM) DLV_NUM = n+1; } });
    console.log(`[deliveries] Loaded ${DELIVERIES.length} deliveries`);
    return DELIVERIES.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[deliveries] table not yet created — run sql/M27_deliveries_schema.sql');
    } else {
      console.warn('[sb] Load deliveries failed:', e.message);
    }
    return false;
  }
}

async function sbSaveDelivery(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      delivery_number: rec.delivery_number || ('DLV-' + String(DLV_NUM).padStart(4,'0')),
      customer_id: rec.customer_id || null,
      customer_name: rec.customer_name || null,
      address: rec.address || null,
      scheduled_date: rec.scheduled_date || null,
      time_window: rec.time_window || null,
      driver: rec.driver || null,
      vehicle: rec.vehicle || null,
      status: rec.status || 'scheduled',
      items_summary: rec.items_summary || null,
      weight_lbs: rec.weight_lbs == null || rec.weight_lbs === '' ? null : Number(rec.weight_lbs),
      signature_required: !!rec.signature_required,
      signature_name: rec.signature_name || null,
      delivered_at: rec.delivered_at || (rec.status === 'delivered' && !rec.delivered_at ? new Date().toISOString() : null),
      failure_reason: rec.failure_reason || null,
      notes: rec.notes || null,
      related_job_id: rec.related_job_id || null,
      related_quote_id: rec.related_quote_id || null,
      related_po_id: rec.related_po_id || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/deliveries?on_conflict=id' : '/deliveries';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]){ if(!rec.id) DLV_NUM++; return res[0]; }
    if(!rec.id) DLV_NUM++;
    return true;
  }catch(e){ console.warn('[sb] Save delivery failed:', e.message); return false; }
}

async function sbDeleteDelivery(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/deliveries?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete delivery failed:', e.message); return false; }
}

function deliveries(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openDeliveryEdit(null)">+ Schedule Delivery</button>`;
  renderDeliveries(el);
}

function renderDeliveries(el){
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);
  const counts = {scheduled:0, out_for_delivery:0, delivered:0, failed:0, rescheduled:0, cancelled:0};
  let todayCount = 0, tomorrowCount = 0, overdueCount = 0;
  const tomorrow = new Date(today.getTime() + 86400000);
  const tomorrowStr = tomorrow.toISOString().slice(0,10);
  DELIVERIES.forEach(d => {
    counts[d.status] = (counts[d.status]||0)+1;
    if(['delivered','cancelled'].includes(d.status)) return;
    if(d.scheduled_date === todayStr) todayCount++;
    else if(d.scheduled_date === tomorrowStr) tomorrowCount++;
    else if(d.scheduled_date && d.scheduled_date < todayStr) overdueCount++;
  });

  // Filter
  const q = (dlvFilter.q||'').toLowerCase();
  const filtered = DELIVERIES.filter(d => {
    if(dlvFilter.status && d.status !== dlvFilter.status) return false;
    // 'when' filter: upcoming = future + today, past = before today + delivered/cancelled, all = no filter
    if(dlvFilter.when === 'upcoming'){
      if(['delivered','cancelled'].includes(d.status)) return false;
      if(d.scheduled_date && d.scheduled_date < todayStr) return false;
    } else if(dlvFilter.when === 'past'){
      const isFuture = d.scheduled_date && d.scheduled_date >= todayStr && !['delivered','cancelled'].includes(d.status);
      if(isFuture) return false;
    } else if(dlvFilter.when === 'today'){
      if(d.scheduled_date !== todayStr) return false;
    }
    if(q){
      const hay = `${d.delivery_number||''} ${d.customer_name||''} ${d.driver||''} ${d.notes||''} ${d.items_summary||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    const aActive = !['delivered','cancelled'].includes(a.status);
    const bActive = !['delivered','cancelled'].includes(b.status);
    if(aActive !== bActive) return aActive ? -1 : 1;
    const ad = a.scheduled_date ? a.scheduled_date : '9999-12-31';
    const bd = b.scheduled_date ? b.scheduled_date : '9999-12-31';
    if(ad !== bd) return ad.localeCompare(bd);
    return new Date(b.updated_at||0) - new Date(a.updated_at||0);
  });

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"${todayCount?` style="border-left:3px solid var(--blue);"`:''}><div class="stat-label">Today</div><div class="stat-value" style="color:${todayCount?'var(--blue)':'var(--text)'};">${todayCount}</div><div class="stat-sub">${tomorrowCount} tomorrow</div></div>
      <div class="card stat-card"${overdueCount?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Overdue</div><div class="stat-value" style="color:${overdueCount?'var(--accent)':'var(--text)'};">${overdueCount}</div><div class="stat-sub">Past schedule, not done</div></div>
      <div class="card stat-card"><div class="stat-label">In Transit</div><div class="stat-value">${counts.out_for_delivery||0}</div><div class="stat-sub">Out for delivery now</div></div>
      <div class="card stat-card"><div class="stat-label">Delivered YTD</div><div class="stat-value">${counts.delivered||0}</div><div class="stat-sub">${counts.failed||0} failed · ${counts.rescheduled||0} rescheduled</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Deliveries · ${filtered.length}${filtered.length!==DELIVERIES.length?` of ${DELIVERIES.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="dlv-q" placeholder="Search # / customer / driver…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(dlvFilter.q)}" oninput="dlvFilter.q=this.value;clearTimeout(window._dlvDeb);window._dlvDeb=setTimeout(()=>renderDeliveries($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="dlvFilter.when=this.value;renderDeliveries($('pg-content'))">
            <option value="upcoming" ${dlvFilter.when==='upcoming'?'selected':''}>Upcoming</option>
            <option value="today" ${dlvFilter.when==='today'?'selected':''}>Today only</option>
            <option value="past" ${dlvFilter.when==='past'?'selected':''}>Past / done</option>
            <option value="all" ${dlvFilter.when==='all'?'selected':''}>All</option>
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="dlvFilter.status=this.value;renderDeliveries($('pg-content'))">
            <option value="">All statuses</option>
            ${['scheduled','out_for_delivery','delivered','failed','rescheduled','cancelled'].map(s=>`<option value="${s}" ${dlvFilter.status===s?'selected':''}>${s.replace(/_/g,' ')}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>#</th><th>When</th><th>Customer</th><th>Driver</th><th>Items</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--text-3);">${DELIVERIES.length===0?'No deliveries scheduled. Click "+ Schedule Delivery" to add one (run M27 SQL first if save fails).':'No deliveries match the current filter.'}</td></tr>` : filtered.map(d => {
              const sb = {scheduled:'bg-blue', out_for_delivery:'bg-yellow', delivered:'bg-green', failed:'bg-red', rescheduled:'bg-yellow', cancelled:'bg-gray'}[d.status] || 'bg-gray';
              const isOverdue = d.scheduled_date && d.scheduled_date < todayStr && !['delivered','cancelled'].includes(d.status);
              const dateCell = d.scheduled_date ? `<span class="mono sm" style="color:${isOverdue?'var(--accent)':d.scheduled_date===todayStr?'var(--blue)':'var(--text-2)'};">${d.scheduled_date}${d.time_window?' '+esc(d.time_window):''}${isOverdue?' <span style="font-size:10px;">(overdue)</span>':''}</span>` : '<span class="muted">—</span>';
              return `<tr style="cursor:pointer;${['delivered','cancelled'].includes(d.status)?'opacity:0.6;':''}" onclick="openDeliveryEdit('${d.id}')">
                <td class="mono fw6 sm">${esc(d.delivery_number||'—')}</td>
                <td>${dateCell}</td>
                <td style="font-weight:600;color:var(--accent);">${esc(d.customer_name||'—')}</td>
                <td class="sm">${esc(d.driver||'')}${d.vehicle?' <span class="muted">/ '+esc(d.vehicle)+'</span>':''}</td>
                <td class="sm" style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(d.items_summary||'')}">${esc(d.items_summary||'')}</td>
                <td><span class="badge ${sb}" style="font-size:10px;">${esc(d.status.replace(/_/g,' '))}</span></td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openDeliveryEdit('${d.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openDeliveryEdit(deliveryId){
  const isNew = !deliveryId;
  const d = isNew ? {status:'scheduled', signature_required:false, scheduled_date: new Date().toISOString().slice(0,10)} : DELIVERIES.find(x => x.id === deliveryId);
  if(!d){ toast('Delivery not found','err'); return; }
  const addr = d.address || {};
  const customerOptions = (typeof CUSTOMERS !== 'undefined' && CUSTOMERS.length) ? CUSTOMERS.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(c => `<option value="${c.id}" data-name="${esc(c.name||'')}" data-addr='${JSON.stringify(c.address||{}).replace(/'/g, "&#39;")}' ${d.customer_id===c.id?'selected':''}>${esc(c.name||'')}</option>`).join('') : '';
  const jobOptions = (typeof JOBS !== 'undefined' && JOBS.length) ? JOBS.slice().sort((a,b)=>(a.project_name||'').localeCompare(b.project_name||'')).map(j => `<option value="${j.id}" data-customer="${esc(j.customer_name||'')}" ${d.related_job_id===j.id?'selected':''}>${esc(j.job_number||'?')} · ${esc(j.project_name)}</option>`).join('') : '';
  const quoteOptions = (typeof QUOTES !== 'undefined' && QUOTES.length) ? QUOTES.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(q => `<option value="${q._uuid||q.id}" ${d.related_quote_id===(q._uuid||q.id)?'selected':''}>${esc(q.id)} · ${esc(q.customer||'')}</option>`).join('') : '';
  const poOptions = (typeof POS !== 'undefined' && POS.length) ? POS.slice().sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).map(p => `<option value="${p.id}" ${d.related_po_id===p.id?'selected':''}>${esc(p.po_number||'?')} · ${esc(p.vendor_name||'')}</option>`).join('') : '';

  openModal((isNew?'New':'Edit')+' Delivery', `
    <div class="frow">
      <div class="fcol field"><label>Delivery # (auto if blank)</label><input id="dlv-num" value="${esc(d.delivery_number||'')}" placeholder="DLV-${String(DLV_NUM).padStart(4,'0')}"></div>
      <div class="fcol field"><label>Status</label>
        <select id="dlv-s">${['scheduled','out_for_delivery','delivered','failed','rescheduled','cancelled'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${s.replace(/_/g,' ')}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Customer *</label>
        <select id="dlv-c" onchange="onDlvCustomerPick()"><option value="">— pick —</option>${customerOptions}</select>
      </div>
      <div class="fcol field"><label>Or customer name</label><input id="dlv-cn" value="${esc(d.customer_name||'')}"></div>
    </div>
    <div class="fg"><label>Address line 1</label><input id="dlv-a1" value="${esc(addr.line1||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>City</label><input id="dlv-city" value="${esc(addr.city||'')}"></div>
      <div class="fcol field"><label>State</label><input id="dlv-state" value="${esc(addr.state||'')}" maxlength="2"></div>
      <div class="fcol field"><label>Zip</label><input id="dlv-zip" value="${esc(addr.zip||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Scheduled Date *</label><input id="dlv-sd" type="date" value="${esc(d.scheduled_date||'')}"></div>
      <div class="fcol field"><label>Time Window</label><input id="dlv-tw" value="${esc(d.time_window||'')}" placeholder="9-12, AM, 1-3pm"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Driver</label><input id="dlv-d" value="${esc(d.driver||'')}"></div>
      <div class="fcol field"><label>Vehicle</label><input id="dlv-veh" value="${esc(d.vehicle||'')}" placeholder="Truck 1, Van 2"></div>
      <div class="fcol field"><label>Weight (lbs)</label><input id="dlv-w" type="number" step="1" value="${d.weight_lbs!=null?d.weight_lbs:''}"></div>
    </div>
    <div class="fg"><label>Items Summary</label><textarea id="dlv-is" rows="2">${esc(d.items_summary||'')}</textarea></div>
    <div class="frow">
      <div class="fcol field"><label>Linked Job</label>
        <select id="dlv-job"><option value="">— none —</option>${jobOptions}</select>
      </div>
      <div class="fcol field"><label>Linked Quote</label>
        <select id="dlv-q"><option value="">— none —</option>${quoteOptions}</select>
      </div>
      <div class="fcol field"><label>Linked PO</label>
        <select id="dlv-po"><option value="">— none —</option>${poOptions}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field" style="display:flex;align-items:flex-end;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input id="dlv-sig" type="checkbox" ${d.signature_required?'checked':''}> Signature required</label></div>
      <div class="fcol field"><label>Signature received from</label><input id="dlv-signed" value="${esc(d.signature_name||'')}"></div>
    </div>
    <div class="fg"><label>Failure reason (if failed)</label><input id="dlv-fail" value="${esc(d.failure_reason||'')}"></div>
    <div class="fg"><label>Notes</label><textarea id="dlv-notes" rows="2">${esc(d.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteDeliveryConfirm('${deliveryId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveDelivery(${isNew?'null':`'${deliveryId}'`})">Save</button>
    </div>
  `);
}

function onDlvCustomerPick(){
  const sel = $('dlv-c');
  if(!sel || !sel.value) return;
  const opt = sel.options[sel.selectedIndex];
  const name = opt.getAttribute('data-name') || '';
  const addrAttr = opt.getAttribute('data-addr') || '{}';
  let addr = {};
  try { addr = JSON.parse(addrAttr.replace(/&#39;/g,"'")); } catch {}
  if($('dlv-cn') && !$('dlv-cn').value) $('dlv-cn').value = name;
  if($('dlv-a1') && !$('dlv-a1').value && addr.line1) $('dlv-a1').value = addr.line1;
  if($('dlv-city') && !$('dlv-city').value && addr.city) $('dlv-city').value = addr.city;
  if($('dlv-state') && !$('dlv-state').value && addr.state) $('dlv-state').value = addr.state;
  if($('dlv-zip') && !$('dlv-zip').value && addr.zip) $('dlv-zip').value = addr.zip;
}

async function saveDelivery(deliveryId){
  const cId = $('dlv-c').value || null;
  let cName = $('dlv-cn').value?.trim() || null;
  if(cId && !cName){
    const opt = $('dlv-c').options[$('dlv-c').selectedIndex];
    cName = opt?.getAttribute('data-name') || null;
  }
  if(!cName){ toast('Customer name required','err'); return; }
  const sd = $('dlv-sd').value;
  if(!sd){ toast('Scheduled date required','err'); return; }
  const rec = {
    id: deliveryId || undefined,
    delivery_number: $('dlv-num').value || null,
    customer_id: cId,
    customer_name: cName,
    address: {
      line1: $('dlv-a1').value || null,
      city: $('dlv-city').value || null,
      state: $('dlv-state').value || null,
      zip: $('dlv-zip').value || null
    },
    scheduled_date: sd,
    time_window: $('dlv-tw').value || null,
    driver: $('dlv-d').value || null,
    vehicle: $('dlv-veh').value || null,
    status: $('dlv-s').value,
    items_summary: $('dlv-is').value || null,
    weight_lbs: $('dlv-w').value || null,
    signature_required: $('dlv-sig').checked,
    signature_name: $('dlv-signed').value || null,
    failure_reason: $('dlv-fail').value || null,
    notes: $('dlv-notes').value || null,
    related_job_id: $('dlv-job').value || null,
    related_quote_id: $('dlv-q').value || null,
    related_po_id: $('dlv-po').value || null
  };
  const saved = await sbSaveDelivery(rec);
  if(!saved){ toast('Save failed — table may not exist (run M27 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = DELIVERIES.findIndex(x => x.id === saved.id);
    if(idx >= 0) DELIVERIES[idx] = saved; else DELIVERIES.unshift(saved);
  } else {
    await sbLoadDeliveries();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(deliveryId?'delivery_edit':'delivery_create', 'deliveries', {delivery_id: deliveryId||saved?.id, status: rec.status, scheduled_date: rec.scheduled_date});
  closeModal();
  renderDeliveries($('pg-content'));
  toast('Delivery '+(deliveryId?'updated':'scheduled'),'ok');
}

async function deleteDeliveryConfirm(deliveryId){
  const d = DELIVERIES.find(x => x.id === deliveryId);
  if(!d) return;
  if(!confirm(`Delete delivery "${d.delivery_number}"?`)) return;
  await sbDeleteDelivery(deliveryId);
  DELIVERIES = DELIVERIES.filter(x => x.id !== deliveryId);
  if(typeof sbAuditLog==='function') sbAuditLog('delivery_delete', 'deliveries', {delivery_id: deliveryId, delivery_number: d.delivery_number});
  closeModal();
  renderDeliveries($('pg-content'));
  toast('Delivery deleted','ok');
}
