// ── CUSTOMERS / CRM (Track 1.4, customers + customer_interactions tables) ──
// Extracted from index.html during file split (v6.10.12).
// Globals here remain on window for cross-module access (Daily Brief, Pipeline match, etc.).

let CUSTOMERS = [];
let CUSTOMER_INTERACTIONS = {};   // keyed by customer_id → array of interaction rows
let custFilter = {q:'', segment:'', type:''};

async function sbLoadCustomers(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/customers?select=id,external_id,name,type,email,phone,address,notes,rfm_recency,rfm_frequency,rfm_monetary,segment,lifecycle_stage,first_seen,last_seen,created_at,updated_at&order=name.asc&limit=2000');
    CUSTOMERS = Array.isArray(rows) ? rows : [];
    console.log(`[customers] Loaded ${CUSTOMERS.length} customers`);
    return CUSTOMERS.length;
  }catch(e){ console.warn('[sb] Load customers failed:', e.message); return false; }
}

async function sbLoadCustomerInteractions(customerId){
  if(!sbConfigured() || !customerId) return false;
  try{
    const rows = await sbFetch(`/customer_interactions?select=id,customer_id,type,ref_id,subject,body,amount,user_id,occurred_at,created_at&customer_id=eq.${encodeURIComponent(customerId)}&order=occurred_at.desc&limit=200`);
    CUSTOMER_INTERACTIONS[customerId] = Array.isArray(rows) ? rows : [];
    return CUSTOMER_INTERACTIONS[customerId].length;
  }catch(e){ console.warn('[sb] Load interactions failed:', e.message); return false; }
}

async function sbSaveCustomer(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      external_id: rec.external_id || null,
      name: rec.name,
      type: rec.type || null,
      email: rec.email || null,
      phone: rec.phone || null,
      address: rec.address || null,
      notes: rec.notes || null,
      rfm_recency: rec.rfm_recency!=null ? Number(rec.rfm_recency) : null,
      rfm_frequency: rec.rfm_frequency!=null ? Number(rec.rfm_frequency) : null,
      rfm_monetary: rec.rfm_monetary!=null ? Number(rec.rfm_monetary) : null,
      segment: rec.segment || null,
      lifecycle_stage: rec.lifecycle_stage || null,
      first_seen: rec.first_seen || null,
      last_seen: rec.last_seen || null,
      updated_at: new Date().toISOString(),
      updated_by: (CU?.name)||'Unknown'
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/customers?on_conflict=id' : '/customers';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save customer failed:', e.message); return false; }
}

async function sbDeleteCustomer(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/customers?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete customer failed:', e.message); return false; }
}

async function sbSaveCustomerInteraction(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      customer_id: rec.customer_id,
      type: rec.type || 'note',
      ref_id: rec.ref_id || null,
      subject: rec.subject || null,
      body: rec.body || null,
      amount: rec.amount === '' || rec.amount == null ? null : Number(rec.amount),
      user_id: (CU?.user_id) || null,
      occurred_at: rec.occurred_at || new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/customer_interactions?on_conflict=id' : '/customer_interactions';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save interaction failed:', e.message); return false; }
}

async function sbDeleteCustomerInteraction(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/customer_interactions?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete interaction failed:', e.message); return false; }
}

// Single-row PATCH for inline edits (v6.10.48). Allow-listed fields only.
async function sbUpdateCustomerField(id, field, value){
  if(!sbConfigured() || !id || !field) return false;
  const allowed = ['name','email','phone','type','address','notes','segment','lifecycle_stage'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value, updated_at: new Date().toISOString(), updated_by: (CU?.name)||'Unknown' };
    const res = await sbFetch(`/customers?id=eq.${encodeURIComponent(id)}`, {
      method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update customer field failed:', e.message); return false; }
}

// Inline-edit handler — saves on blur if value changed; reverts on failure.
async function commitCustomerCell(input){
  if(!input) return;
  const id = input.dataset.id;
  const field = input.dataset.field;
  const origStr = input.dataset.orig || '';
  const valStr = input.value.trim();
  input.style.background = 'transparent';
  input.style.borderColor = 'transparent';
  if(valStr === origStr) return;
  const next = valStr || null;
  const item = CUSTOMERS.find(c => c.id === id);
  if(!item){ input.value = origStr; toast('Row not found','err'); return; }
  const prev = item[field];
  item[field] = next;
  input.dataset.orig = valStr;
  const res = await sbUpdateCustomerField(id, field, next);
  if(res === false){
    item[field] = prev;
    input.value = origStr;
    input.dataset.orig = origStr;
    toast(`Save failed — ${field} reverted`,'err');
    return;
  }
  if(typeof sbAuditLog==='function') sbAuditLog(`customer_${field}_edit`, 'customers', {customer_id: id, field, from: prev, to: next});
  toast(`Updated ${item.name||'customer'} · ${field}`, 'ok');
}

async function sbBulkSaveCustomers(rows){
  if(!sbConfigured()) return false;
  if(!Array.isArray(rows) || !rows.length) return 0;
  try{
    const now = new Date().toISOString();
    const payload = rows.map(r => ({
      external_id: r.external_id || null,
      name: r.name,
      type: r.type || null,
      email: r.email || null,
      phone: r.phone || null,
      address: r.address || null,
      notes: r.notes || null,
      lifecycle_stage: r.lifecycle_stage || null,
      first_seen: r.first_seen || null,
      last_seen: r.last_seen || null,
      updated_at: now,
      updated_by: (CU?.name) || 'Bulk Import'
    }));
    const headers = {'Prefer':'return=representation'};
    const res = await sbFetch('/customers', {method:'POST', headers, body: JSON.stringify(payload)});
    if(Array.isArray(res)) return res.length;
    return payload.length;
  }catch(e){
    console.warn('[sb] Bulk save customers failed:', e.message);
    return false;
  }
}

// Compute RFM scores + segment from interactions + linked quotes/deals.
// Recency: days since last activity (lower = better).
// Frequency: number of revenue events in last 365d.
// Monetary: $ sum of revenue events in last 365d.
// Segment: VIP / Active / Lapsed / Lost / Prospect.
function computeCustomerRFM(c){
  const cid = c.id;
  const ints = CUSTOMER_INTERACTIONS[cid] || [];
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365*86400000);
  const events = [];
  ints.forEach(i => {
    const d = i.occurred_at ? new Date(i.occurred_at) : null;
    if(d) events.push({date:d, amount:Number(i.amount)||0, type:i.type});
  });
  if(typeof QUOTES !== 'undefined' && Array.isArray(QUOTES)){
    QUOTES.forEach(q => {
      const matchByName = q.customer && c.name && q.customer.toLowerCase().trim() === c.name.toLowerCase().trim();
      if(matchByName){
        const d = q.date ? new Date(q.date) : null;
        if(d && !isNaN(d)) events.push({date:d, amount: Number(q.total)||0, type:'quote'});
      }
    });
  }
  if(typeof DEALS !== 'undefined' && DEALS){
    ['won','quoted','negotiating','qualified','lead'].forEach(stage => {
      (DEALS[stage]||[]).forEach(d => {
        const matchByName = d.company && c.name && d.company.toLowerCase().trim() === c.name.toLowerCase().trim();
        if(matchByName){
          const dt = d.updated_at ? new Date(d.updated_at) : null;
          if(dt && !isNaN(dt)) events.push({date:dt, amount: stage==='won'?(Number(d.value)||0):0, type:'deal_'+stage});
        }
      });
    });
  }
  events.sort((a,b)=>b.date-a.date);
  const lastDate = events.length ? events[0].date : (c.last_seen ? new Date(c.last_seen) : null);
  const recencyDays = lastDate ? Math.round((now - lastDate)/86400000) : null;
  const recentEvents = events.filter(e => e.date >= yearAgo);
  const frequency = recentEvents.length;
  const monetary = recentEvents.reduce((s,e)=>s + (e.amount||0), 0);
  let segment = 'Prospect';
  if(recencyDays === null && frequency === 0){
    segment = 'Prospect';
  } else if(recencyDays !== null && recencyDays <= 90 && monetary >= 5000){
    segment = 'VIP';
  } else if(recencyDays !== null && recencyDays <= 180){
    segment = 'Active';
  } else if(recencyDays !== null && recencyDays <= 365){
    segment = 'Lapsed';
  } else {
    segment = 'Lost';
  }
  return {recency:recencyDays, frequency, monetary, segment, lastDate};
}

function segmentBadge(seg){
  const cls = {VIP:'bg-green', Active:'bg-blue', Lapsed:'bg-yellow', Lost:'bg-red', Prospect:'bg-gray'}[seg] || 'bg-gray';
  return `<span class="badge ${cls}" style="font-size:10px;">${seg||'—'}</span>`;
}

function customers(el, act){
  if(CU && CU.role === 'Warehouse'){
    el.innerHTML = `<div class="alert">Warehouse role does not have customer access.</div>`;
    return;
  }
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openCustomerEdit(null)">+ New Customer</button>`;
  renderCustomers(el);
}

function renderCustomers(el){
  const all = CUSTOMERS.map(c => Object.assign({}, c, {_rfm: computeCustomerRFM(c)}));
  const totalCount = all.length;
  const segCounts = {VIP:0, Active:0, Lapsed:0, Lost:0, Prospect:0};
  let totalMonetary = 0;
  all.forEach(c => { segCounts[c._rfm.segment] = (segCounts[c._rfm.segment]||0)+1; totalMonetary += c._rfm.monetary||0; });

  const q = (custFilter.q||'').toLowerCase();
  const filtered = all.filter(c => {
    if(custFilter.segment && c._rfm.segment !== custFilter.segment) return false;
    if(custFilter.type && c.type !== custFilter.type) return false;
    if(q){
      const hay = `${c.name||''} ${c.email||''} ${c.phone||''} ${c.notes||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    const segOrder = {VIP:0, Active:1, Lapsed:2, Lost:3, Prospect:4};
    const so = (segOrder[a._rfm.segment]||9) - (segOrder[b._rfm.segment]||9);
    if(so) return so;
    const ar = a._rfm.recency==null ? 99999 : a._rfm.recency;
    const br = b._rfm.recency==null ? 99999 : b._rfm.recency;
    if(ar !== br) return ar - br;
    return (a.name||'').localeCompare(b.name||'');
  });

  const canImport = CU && (CU.role === 'Owner' || CU.role === 'Admin' || CU.role === 'Manager' || CU.role === 'Sales');
  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Total Customers</div><div class="stat-value">${totalCount}</div><div class="stat-sub">In CRM</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">VIP / Active</div><div class="stat-value" style="color:var(--green);">${(segCounts.VIP||0)+(segCounts.Active||0)}</div><div class="stat-sub">${segCounts.VIP||0} VIP · ${segCounts.Active||0} active</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--yellow);"><div class="stat-label">Lapsed (180–365d)</div><div class="stat-value" style="color:var(--yellow);">${segCounts.Lapsed||0}</div><div class="stat-sub">Re-engagement candidates</div></div>
      <div class="card stat-card"><div class="stat-label">12-mo Revenue</div><div class="stat-value">$${(totalMonetary/1000).toFixed(1)}K</div><div class="stat-sub">Across all customers</div></div>
    </div>
    ${canImport ? `<div class="card mb16">
      <div class="card-hd"><span class="card-title">Import CSV</span></div>
      <div style="padding:14px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;">
        <input type="file" id="cust-file" accept=".csv,text/csv" style="font-size:12px;" onchange="onCustFilePick(this)">
        <button class="btn btn-outline btn-sm" onclick="openCustCsvPaste()">Or paste CSV</button>
        <button class="btn btn-outline btn-sm" onclick="downloadCustCsvTemplate()">Download template</button>
        <span style="margin-left:auto;color:var(--text-3);">Headers: name (req), email, phone, type, address, notes, external_id</span>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Customers · ${filtered.length}${filtered.length!==totalCount?` of ${totalCount}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="cust-q" placeholder="Search name / email / phone…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(custFilter.q)}" oninput="custFilter.q=this.value;clearTimeout(window._custDeb);window._custDeb=setTimeout(()=>renderCustomers($('pg-content')),200)">
          <select id="cust-seg" style="padding:6px 8px;font-size:12px;" onchange="custFilter.segment=this.value;renderCustomers($('pg-content'))">
            <option value="">All segments</option>
            ${['VIP','Active','Lapsed','Lost','Prospect'].map(s=>`<option value="${s}" ${custFilter.segment===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <select id="cust-type" style="padding:6px 8px;font-size:12px;" onchange="custFilter.type=this.value;renderCustomers($('pg-content'))">
            <option value="">All types</option>
            ${['residential','trade','designer','contractor','commercial','other'].map(t=>`<option value="${t}" ${custFilter.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
          ${typeof savedFiltersBar==='function'?savedFiltersBar({moduleKey:'customers',currentFilter:custFilter,applyFn:()=>renderCustomers($('pg-content')),fields:['q','segment','type'],resetState:{q:'',segment:'',type:''}}):''}
        </div>
      </div>
      ${typeof bulkSelBar==='function'?bulkSelBar('customers'):''}
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th style="width:30px;">${typeof bulkSelHeaderCheckbox==='function'?bulkSelHeaderCheckbox('customers',filtered.map(x=>x.id)):''}</th><th>Name</th><th>Type</th><th>Segment</th><th>Last activity</th><th>12-mo $</th><th>Visits</th><th>Email</th><th>Phone</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-3);">${totalCount===0?'No customers yet. Click "+ New Customer" to add one, or wait for the Windward CSV import.':'No customers match the current filter.'}</td></tr>` : filtered.map(c => {
              const r = c._rfm;
              const recDisp = r.recency==null ? '<span class="muted">—</span>' : (r.recency<=30?`<span style="color:var(--green);">${r.recency}d</span>`:r.recency<=180?`<span style="color:var(--text-2);">${r.recency}d</span>`:`<span style="color:var(--accent);">${r.recency}d</span>`);
              const canEdit = CU && ['Owner','Admin','Manager','Sales'].includes(CU.role);
              const editCell = (val, field, width) => {
                if(!canEdit) return `<td class="sm">${esc(val||'')}</td>`;
                return `<td class="sm" style="padding:2px 6px;" onclick="event.stopPropagation();"><input type="text" value="${esc(val||'')}" data-id="${c.id}" data-field="${field}" data-orig="${esc(val||'')}" onfocus="this.select();this.style.background='var(--surface)';this.style.borderColor='var(--accent)';" onblur="commitCustomerCell(this)" onkeydown="if(event.key==='Enter'){this.blur();}else if(event.key==='Escape'){this.value=this.dataset.orig;this.blur();}" style="width:${width}px;border:1px solid transparent;background:transparent;padding:4px 6px;font-family:inherit;font-size:13px;border-radius:4px;" placeholder="—" title="Click to edit ${field}"></td>`;
              };
              return `<tr style="cursor:pointer;" onclick="openCustomerDetail('${c.id}')">
                <td onclick="event.stopPropagation();">${typeof bulkSelCheckbox==='function'?bulkSelCheckbox('customers',c.id):''}</td>
                <td style="font-weight:600;color:var(--accent);">${esc(c.name||'(unnamed)')}</td>
                <td><span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(c.type||'—')}</span></td>
                <td>${segmentBadge(r.segment)}</td>
                <td class="sm">${recDisp}</td>
                <td class="mono fw6">${r.monetary>0?'$'+Math.round(r.monetary).toLocaleString():'<span class="muted">—</span>'}</td>
                <td class="sm">${r.frequency||'<span class="muted">0</span>'}</td>
                ${editCell(c.email, 'email', 180)}
                ${editCell(c.phone, 'phone', 120)}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  if(typeof bulkSelRegister === 'function'){
    const isSenior = CU && ['Owner','Admin','Manager'].includes(CU.role);
    bulkSelRegister('customers', isSenior ? [
      {id:'delete', label:'🗑 Delete selected', color:'outline', confirm:'Delete {n} customers? This cannot be undone.', fn: doBulkCustomerDelete}
    ] : []);
  }
}

async function doBulkCustomerDelete(ids){
  if(!ids?.length) return;
  let ok = 0, fail = 0;
  for(const id of ids){
    const r = await sbDeleteCustomer(id);
    if(r) ok++; else fail++;
  }
  CUSTOMERS = CUSTOMERS.filter(c => !ids.includes(c.id));
  if(typeof sbAuditLog==='function') sbAuditLog('customers_bulk_delete', 'customers', {count: ok, failed: fail});
  bulkSelClear('customers');
  renderCustomers($('pg-content'));
  toast(`Deleted ${ok}${fail?', '+fail+' failed':''}`, fail?'err':'ok');
}

async function openCustomerDetail(customerId){
  const c = CUSTOMERS.find(x => String(x.id) === String(customerId));
  if(!c){ toast('Customer not found','err'); return; }
  await sbLoadCustomerInteractions(customerId);
  const ints = CUSTOMER_INTERACTIONS[customerId] || [];
  const r = computeCustomerRFM(c);
  const linkedQuotes = (typeof QUOTES !== 'undefined' && Array.isArray(QUOTES)) ? QUOTES.filter(q => q.customer && c.name && q.customer.toLowerCase().trim() === c.name.toLowerCase().trim()) : [];
  const linkedDeals = [];
  if(typeof DEALS !== 'undefined' && DEALS){
    Object.keys(DEALS).forEach(stage => {
      (DEALS[stage]||[]).forEach(d => {
        if(d.company && c.name && d.company.toLowerCase().trim() === c.name.toLowerCase().trim()){
          linkedDeals.push({...d, _stage: stage});
        }
      });
    });
  }
  // Extended cross-module links by name match (jobs, deliveries, warranty)
  const matchByName = list => (list||[]).filter(x => {
    const t = (x.customer_name || x.customer || '').toLowerCase().trim();
    return t && c.name && t === c.name.toLowerCase().trim();
  });
  const linkedJobs = matchByName(typeof JOBS !== 'undefined' ? JOBS : []);
  const linkedDeliveries = matchByName(typeof DELIVERIES !== 'undefined' ? DELIVERIES : []);
  const linkedWarranty = matchByName(typeof WARRANTY_CLAIMS !== 'undefined' ? WARRANTY_CLAIMS : []);

  const timeline = [];
  ints.forEach(i => timeline.push({date: i.occurred_at, kind: i.type, label: i.subject || i.type, body: i.body, amount: i.amount, _id: i.id, _src:'interaction'}));
  linkedQuotes.forEach(q => timeline.push({date: q.date ? new Date(q.date).toISOString() : null, kind:'quote', label: `Quote ${q.id}`, body: q.project||'', amount: q.total, _src:'quote', _qid: q.id}));
  linkedDeals.forEach(d => timeline.push({date: d.updated_at, kind:'deal_'+d._stage, label: `Deal: ${d.name}`, body: d.notes||'', amount: d.value, _src:'deal', _did: d.id, _stage:d._stage}));
  linkedJobs.forEach(j => timeline.push({date: j.updated_at || j.start_date, kind:'job', label: `Job ${j.job_number||''} — ${j.project_name||''}`, body: j.status||'', amount: null, _src:'job', _jid: j.id}));
  linkedDeliveries.forEach(d => timeline.push({date: d.scheduled_date, kind:'delivery', label: `Delivery ${d.delivery_number||''}`, body: d.status||'', amount: null, _src:'delivery', _did: d.id}));
  linkedWarranty.forEach(w => timeline.push({date: w.created_at, kind:'warranty', label: `Warranty ${w.claim_number||''}`, body: w.product_description||'', amount: w.cost_to_us||null, _src:'warranty', _wid: w.id}));
  timeline.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));

  const addr = c.address || {};
  const addrStr = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');

  openModal(c.name || 'Customer', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div>
        <div class="muted sm">Type</div>
        <div style="margin-bottom:8px;"><span class="badge bg-gray" style="text-transform:capitalize;">${esc(c.type||'—')}</span></div>
        <div class="muted sm">Email</div>
        <div style="margin-bottom:8px;">${esc(c.email||'—')}</div>
        <div class="muted sm">Phone</div>
        <div style="margin-bottom:8px;">${esc(c.phone||'—')}</div>
        <div class="muted sm">Address</div>
        <div style="margin-bottom:8px;">${esc(addrStr||'—')}</div>
      </div>
      <div>
        <div class="muted sm">Segment</div>
        <div style="margin-bottom:8px;">${segmentBadge(r.segment)}</div>
        <div class="muted sm">Recency</div>
        <div style="margin-bottom:8px;">${r.recency==null?'—':r.recency+' days since last activity'}</div>
        <div class="muted sm">Frequency (12-mo)</div>
        <div style="margin-bottom:8px;">${r.frequency} touchpoints</div>
        <div class="muted sm">Monetary (12-mo)</div>
        <div style="margin-bottom:8px;font-weight:700;">$${Math.round(r.monetary||0).toLocaleString()}</div>
      </div>
    </div>
    ${c.notes?`<div class="card" style="padding:10px 14px;background:var(--bg-2);margin-bottom:14px;"><div class="muted sm">Notes</div><div style="white-space:pre-wrap;font-size:13px;">${esc(c.notes)}</div></div>`:''}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="font-size:13px;">Activity Timeline · ${timeline.length}</strong>
      <button class="btn btn-outline btn-sm" onclick="openCustomerInteractionEdit('${c.id}', null)">+ Add interaction</button>
    </div>
    <div style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;">
      ${timeline.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--text-3);">No activity yet.</div>' : timeline.map(t => {
        const dt = t.date ? new Date(t.date) : null;
        const dateStr = dt && !isNaN(dt) ? dt.toLocaleDateString() : '—';
        const iconMap = {quote:'◻', order:'$', call:'☏', email:'✉', visit:'⌂', note:'✎', support:'?', deal_won:'★', deal_lost:'✕', job:'▤', delivery:'▶', warranty:'⚠'};
        const ic = iconMap[t.kind] || '•';
        const amt = t.amount ? `<span class="mono fw6" style="margin-left:auto;">$${Number(t.amount).toLocaleString()}</span>` : '';
        const editBtn = t._src === 'interaction' ? `<button class="btn btn-outline btn-sm" style="font-size:9px;padding:2px 6px;" onclick="event.stopPropagation();openCustomerInteractionEdit('${c.id}','${t._id}')">edit</button>` : '';
        return `<div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
          <span style="width:22px;height:22px;border-radius:50%;background:var(--bg-2);display:inline-flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">${ic}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;">${esc(t.label||'—')} <span class="muted sm" style="font-weight:400;">· ${dateStr}</span></div>
            ${t.body?`<div class="sm" style="color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.body)}</div>`:''}
          </div>
          ${amt}
          ${editBtn}
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCustomerConfirm('${c.id}')">Delete customer</button>
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      ${typeof createQuoteFromCustomer==='function' && CU && ['Owner','Admin','Manager','Sales'].includes(CU.role)?`<button class="btn btn-outline" onclick="createQuoteFromCustomer('${c.id}')">+ New Quote</button>`:''}
      ${typeof createDealFromCustomer==='function' && CU && ['Owner','Admin','Manager','Sales'].includes(CU.role)?`<button class="btn btn-outline" onclick="createDealFromCustomer('${c.id}')">+ New Deal</button>`:''}
      <button class="btn btn-accent" onclick="openCustomerEdit('${c.id}')">Edit</button>
    </div>
  `);
}

// Customer → Quote — opens the Quote Generator pre-filled with the customer.
// Fourth use of the cross-module preset pattern (after Deal→Job, Quote→PO, Quote→Deal).
function createQuoteFromCustomer(customerId){
  if(typeof CUSTOMERS === 'undefined') return;
  const c = CUSTOMERS.find(x => x.id === customerId);
  if(!c){ toast('Customer not found','err'); return; }
  if(typeof window === 'undefined') return;
  // Seed CQ + LI in the global namespace the Quote page reads. Use the
  // contact and address fields when they exist on the customer record.
  const addr = c.address || {};
  const addrStr = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  window.CQ = {
    customer: c.name || '',
    customer_id: c.id || null,
    contact: c.email || c.phone || '',
    project: '',
    type: '',
    address: addrStr,
    sqft: '',
    budget: '',
    notes: '',
    lineItems: [],
    total: 0
  };
  window.LI = (typeof window.nLI === 'function') ? [window.nLI()] : [];
  closeModal();
  setTimeout(() => goTo('quotes'), 50);
  if(typeof sbAuditLog==='function') sbAuditLog('quote_from_customer', 'customers', {customer_id: c.id, customer_name: c.name});
}

// Customer → Deal conversion helper. Called from customer detail modal.
function createDealFromCustomer(customerId){
  if(typeof CUSTOMERS === 'undefined') return;
  const c = CUSTOMERS.find(x => x.id === customerId);
  if(!c){ toast('Customer not found','err'); return; }
  // Map customer.type → deal segment when they overlap
  const segMap = {residential:'residential', trade:'trade', designer:'designer', contractor:'contractor', commercial:'commercial'};
  const segment = segMap[c.type] || '';
  // Use the customer's RFM-12mo monetary as a value seed (rounded to 100s) — gives a sensible default for repeat customers
  const valueSeed = c._rfm && c._rfm.monetary > 100 ? Math.round(c._rfm.monetary / 100) * 100 : 0;
  const preset = {
    name: `${c.name||'New'} project`,
    company: c.name || '',
    segment,
    value: valueSeed,
    related_customer_id: c.id
  };
  closeModal();
  setTimeout(() => openAddDeal('lead', preset), 50);
  if(typeof sbAuditLog==='function') sbAuditLog('deal_from_customer', 'customers', {customer_id: c.id, customer_name: c.name});
}

function openCustomerEdit(customerId){
  const isNew = !customerId;
  const c = isNew ? {type:'residential', address:{}} : CUSTOMERS.find(x => String(x.id) === String(customerId));
  if(!c){ toast('Customer not found','err'); return; }
  const addr = c.address || {};
  openModal((isNew?'New':'Edit')+' Customer', `
    <div class="frow">
      <div class="fcol field"><label>Name *</label><input id="cu-n" value="${esc(c.name||'')}"></div>
      <div class="fcol field"><label>Type</label>
        <select id="cu-t">
          ${['residential','trade','designer','contractor','commercial','other'].map(t=>`<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Email</label><input id="cu-e" type="email" value="${esc(c.email||'')}"></div>
      <div class="fcol field"><label>Phone</label><input id="cu-p" value="${esc(c.phone||'')}"></div>
    </div>
    <div class="fg"><label>Address line 1</label><input id="cu-a1" value="${esc(addr.line1||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>City</label><input id="cu-city" value="${esc(addr.city||'')}"></div>
      <div class="fcol field"><label>State</label><input id="cu-state" value="${esc(addr.state||'')}" maxlength="2"></div>
      <div class="fcol field"><label>Zip</label><input id="cu-zip" value="${esc(addr.zip||'')}"></div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="cu-notes" rows="3">${esc(c.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveCustomer(${isNew?'null':`'${c.id}'`})">Save</button>
    </div>
  `);
}

async function saveCustomer(customerId){
  const name = $('cu-n')?.value?.trim();
  if(!name){ toast('Name is required','err'); return; }
  const isNew = !customerId;
  const existing = isNew ? {} : (CUSTOMERS.find(x => String(x.id) === String(customerId)) || {});
  const r = !isNew ? computeCustomerRFM(existing) : {recency:null, frequency:0, monetary:0, segment:'Prospect'};
  const rec = {
    id: customerId || undefined,
    name,
    type: $('cu-t').value || 'residential',
    email: $('cu-e').value || null,
    phone: $('cu-p').value || null,
    address: {
      line1: $('cu-a1').value || null,
      city: $('cu-city').value || null,
      state: $('cu-state').value || null,
      zip: $('cu-zip').value || null
    },
    notes: $('cu-notes').value || null,
    rfm_recency: r.recency,
    rfm_frequency: r.frequency,
    rfm_monetary: r.monetary,
    segment: r.segment,
    first_seen: existing.first_seen || new Date().toISOString(),
    last_seen: r.lastDate ? r.lastDate.toISOString() : (existing.last_seen || null)
  };
  const saved = await sbSaveCustomer(rec);
  if(!saved){ toast('Save failed','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = CUSTOMERS.findIndex(x => x.id === saved.id);
    if(idx >= 0) CUSTOMERS[idx] = saved; else CUSTOMERS.unshift(saved);
  } else {
    await sbLoadCustomers();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(isNew?'customer_create':'customer_edit', 'customers', {customer_id: customerId||saved?.id, name});
  closeModal();
  renderCustomers($('pg-content'));
  toast('Customer '+(isNew?'added':'updated'), 'ok');
}

async function deleteCustomerConfirm(customerId){
  const c = CUSTOMERS.find(x => String(x.id) === String(customerId));
  if(!c) return;
  if(!confirm(`Delete customer "${c.name}"? This will also remove their interaction history. Quotes/deals are preserved.`)) return;
  const ok = await sbDeleteCustomer(customerId);
  if(!ok){ toast('Delete failed','err'); return; }
  CUSTOMERS = CUSTOMERS.filter(x => x.id !== customerId);
  delete CUSTOMER_INTERACTIONS[customerId];
  if(typeof sbAuditLog==='function') sbAuditLog('customer_delete', 'customers', {customer_id: customerId, name: c.name});
  closeModal();
  renderCustomers($('pg-content'));
  toast('Customer deleted', 'ok');
}

function openCustomerInteractionEdit(customerId, intId){
  const isNew = !intId;
  const list = CUSTOMER_INTERACTIONS[customerId] || [];
  const rec = isNew ? {type:'note', occurred_at: new Date().toISOString().slice(0,16)} : list.find(x => x.id === intId);
  if(!rec){ toast('Interaction not found','err'); return; }
  let dtVal = '';
  if(rec.occurred_at){
    const dt = new Date(rec.occurred_at);
    if(!isNaN(dt)){
      const tzOff = dt.getTimezoneOffset()*60000;
      dtVal = new Date(dt - tzOff).toISOString().slice(0,16);
    }
  }
  openModal((isNew?'New':'Edit')+' Interaction', `
    <div class="frow">
      <div class="fcol field"><label>Type</label>
        <select id="ci-t">
          ${['quote','order','call','email','visit','note','support','other'].map(t=>`<option value="${t}" ${rec.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="fcol field"><label>When</label><input id="ci-when" type="datetime-local" value="${dtVal}"></div>
    </div>
    <div class="fg"><label>Subject</label><input id="ci-sub" value="${esc(rec.subject||'')}" placeholder="Short summary"></div>
    <div class="fg"><label>Notes</label><textarea id="ci-body" rows="3">${esc(rec.body||'')}</textarea></div>
    <div class="frow">
      <div class="fcol field"><label>Amount ($) — optional</label><input id="ci-amt" type="number" step="0.01" value="${rec.amount!=null?rec.amount:''}"></div>
      <div class="fcol field"><label>Ref ID — optional</label><input id="ci-ref" value="${esc(rec.ref_id||'')}" placeholder="QT-1234, ticket #"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCustomerInteraction('${customerId}','${intId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="openCustomerDetail('${customerId}')">Cancel</button>
      <button class="btn btn-accent" onclick="saveCustomerInteraction('${customerId}',${isNew?'null':`'${intId}'`})">Save</button>
    </div>
  `);
}

async function saveCustomerInteraction(customerId, intId){
  const occurredLocal = $('ci-when')?.value;
  const occurred_at = occurredLocal ? new Date(occurredLocal).toISOString() : new Date().toISOString();
  const rec = {
    id: intId || undefined,
    customer_id: customerId,
    type: $('ci-t').value,
    subject: $('ci-sub').value || null,
    body: $('ci-body').value || null,
    amount: $('ci-amt').value || null,
    ref_id: $('ci-ref').value || null,
    occurred_at
  };
  const saved = await sbSaveCustomerInteraction(rec);
  if(!saved){ toast('Save failed','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog(intId?'interaction_edit':'interaction_create', 'customers', {customer_id: customerId, interaction_id: intId||saved?.id, type: rec.type});
  const c = CUSTOMERS.find(x => String(x.id) === String(customerId));
  if(c){
    c.last_seen = occurred_at;
    await sbSaveCustomer(c);
  }
  await sbLoadCustomerInteractions(customerId);
  await openCustomerDetail(customerId);
  toast('Interaction '+(intId?'updated':'added'), 'ok');
}

async function deleteCustomerInteraction(customerId, intId){
  if(!confirm('Delete this interaction?')) return;
  await sbDeleteCustomerInteraction(intId);
  if(typeof sbAuditLog==='function') sbAuditLog('interaction_delete', 'customers', {customer_id: customerId, interaction_id: intId});
  await sbLoadCustomerInteractions(customerId);
  await openCustomerDetail(customerId);
  toast('Interaction deleted', 'ok');
}

// ── BULK CSV IMPORT (v6.10.39) ────────────────────────────
const _CUST_TYPES = ['residential','trade','designer','contractor','commercial','other'];

function downloadCustCsvTemplate(){
  const rows = [
    ['name','email','phone','type','address','notes','external_id'],
    ['Acme Lighting Co.','procurement@acme.com','512-555-0100','commercial','123 Main St, Austin TX','Net-30 terms, prefers AM delivery','ACME-001'],
    ['Jane Designer','jane@example.com','512-555-0142','designer','','Trade discount 15%','']
  ];
  if(typeof csvDownload === 'function'){
    csvDownload(rows, `customers_template_${new Date().toISOString().slice(0,10)}.csv`);
  } else {
    // Fallback if shared util not loaded
    const csv = rows.map(r => r.map(x => /[",\n]/.test(String(x)) ? `"${String(x).replace(/"/g,'""')}"` : String(x)).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `customers_template_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  }
}

function openCustCsvPaste(){
  openModal(`
    <div class="modal-hd"><div class="modal-title">Paste CSV</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Paste CSV content (first row is headers)</label><textarea id="cust-csv-paste" rows="12" style="width:100%;font-family:monospace;font-size:11px;padding:8px;border:1px solid var(--border);border-radius:6px;" placeholder="name,email,phone,type,address,notes
Acme Lighting,buyer@acme.com,512-555-0100,commercial,123 Main St,..."></textarea></div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="processCustCsvText($('cust-csv-paste').value)">Parse &amp; Preview</button>
    </div>
  `);
}

function onCustFilePick(input){
  const f = input.files && input.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e => processCustCsvText(e.target.result || '');
  reader.onerror = () => toast('File read failed','err');
  reader.readAsText(f);
}

function processCustCsvText(text){
  if(!text || !text.trim()){ toast('CSV is empty','err'); return; }
  if(typeof parseCsv !== 'function'){ toast('parseCsv helper missing — load inventory.js first','err'); return; }
  const rows = parseCsv(text);
  if(rows.length < 2){ toast('CSV has no data rows','err'); return; }
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
  const aliasMap = {
    'name':'name', 'customer_name':'name', 'full_name':'name', 'company':'name', 'company_name':'name', 'client':'name', 'account_name':'name',
    'email':'email', 'email_address':'email', 'mail':'email', 'e-mail':'email', 'e_mail':'email',
    'phone':'phone', 'tel':'phone', 'telephone':'phone', 'mobile':'phone', 'cell':'phone', 'phone_number':'phone',
    'type':'type', 'customer_type':'type', 'category':'type', 'class':'type',
    'address':'address', 'mailing_address':'address', 'street':'address', 'street_address':'address', 'addr':'address',
    'notes':'notes', 'note':'notes', 'comment':'notes', 'comments':'notes', 'description':'notes',
    'external_id':'external_id', 'customer_id':'external_id', 'windward_id':'external_id', 'account_number':'external_id', 'account':'external_id', 'id':'external_id',
    'lifecycle_stage':'lifecycle_stage', 'stage':'lifecycle_stage',
    'first_seen':'first_seen', 'last_seen':'last_seen'
  };
  const colMap = headers.map(h => aliasMap[h] || h);
  if(!colMap.includes('name')){ toast('CSV must include a "name" column','err'); return; }

  // Existing-name set for duplicate warning
  const existingByName = new Set();
  CUSTOMERS.forEach(c => { if(c?.name) existingByName.add(String(c.name).toLowerCase().trim()); });
  const existingByExt = new Set();
  CUSTOMERS.forEach(c => { if(c?.external_id) existingByExt.add(String(c.external_id).trim()); });

  const parsed = [];
  let dupes = 0;
  let unknownTypes = new Set();
  for(let i=1; i<rows.length; i++){
    const r = rows[i];
    if(r.every(x => !x || !String(x).trim())) continue;
    const obj = {};
    colMap.forEach((c, idx) => { if(c) obj[c] = (r[idx]||'').trim(); });
    if(!obj.name){ continue; }
    // Normalize type to enum
    if(obj.type){
      const t = obj.type.toLowerCase();
      if(_CUST_TYPES.includes(t)) obj.type = t;
      else { unknownTypes.add(obj.type); obj.type = 'other'; }
    }
    // Mark duplicates so the preview can flag them
    obj._dup = existingByName.has(obj.name.toLowerCase()) || (obj.external_id && existingByExt.has(obj.external_id));
    if(obj._dup) dupes++;
    parsed.push(obj);
  }

  if(!parsed.length){ toast('No valid rows after parsing','err'); return; }

  const preview = parsed.slice(0, 10);
  const summary = `<div style="font-size:12px;margin-bottom:10px;line-height:1.6;">
    <strong>${parsed.length}</strong> row${parsed.length===1?'':'s'} parsed
    ${dupes ? ` · <span style="color:var(--accent);">${dupes} likely duplicate${dupes===1?'':'s'}</span> (matched by name or external_id)` : ''}
    ${unknownTypes.size ? `<br><span style="color:var(--text-3);">${unknownTypes.size} unknown type${unknownTypes.size===1?'':'s'} → "other": ${[...unknownTypes].slice(0,3).map(esc).join(', ')}${unknownTypes.size>3?'…':''}</span>` : ''}
  </div>`;
  const tbl = `<div style="border:1px solid var(--border);border-radius:6px;max-height:300px;overflow:auto;">
    <table style="margin:0;font-size:11px;width:100%;">
      <thead><tr><th></th><th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th>External ID</th></tr></thead>
      <tbody>${preview.map(p=>`<tr style="${p._dup?'background:#fff7ed;':''}">
        <td style="text-align:center;">${p._dup?'⚠':''}</td>
        <td style="font-weight:500;">${esc(p.name||'')}</td>
        <td>${esc(p.type||'')}</td>
        <td class="sm">${esc(p.email||'')}</td>
        <td class="sm">${esc(p.phone||'')}</td>
        <td class="mono sm">${esc(p.external_id||'')}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
  const more = parsed.length > 10 ? `<div class="muted sm" style="margin-top:6px;">…and ${parsed.length-10} more.</div>` : '';
  const dupNote = dupes ? `<div style="margin-top:10px;font-size:12px;color:var(--text-3);">⚠ Rows flagged as duplicates will still be imported — Supabase keeps all rows since names aren't unique. After import, you can dedupe manually from each customer's detail page.</div>` : '';

  window._custStaged = parsed;
  openModal(`
    <div class="modal-hd"><div class="modal-title">Customer Import Preview</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">${summary}${tbl}${more}${dupNote}</div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="commitCustCsv()">Import ${parsed.length} customer${parsed.length===1?'':'s'}</button>
    </div>
  `);
}

async function commitCustCsv(){
  const staged = window._custStaged || [];
  if(!staged.length){ toast('Nothing to import','err'); return; }
  // Strip the _dup flag before save
  const clean = staged.map(r => { const { _dup, ...rest } = r; return rest; });
  toast(`Importing ${clean.length} customers…`);
  const n = await sbBulkSaveCustomers(clean);
  if(n === false){ toast('Import failed — check Supabase connection','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog('customers_import', 'customers', {row_count: clean.length, source: 'csv'});
  await sbLoadCustomers();
  delete window._custStaged;
  closeModal();
  renderCustomers($('pg-content'));
  toast(`Imported ${typeof n==='number'?n:clean.length} customer${(typeof n==='number'?n:clean.length)===1?'':'s'}`,'ok');
}
