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

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Total Customers</div><div class="stat-value">${totalCount}</div><div class="stat-sub">In CRM</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">VIP / Active</div><div class="stat-value" style="color:var(--green);">${(segCounts.VIP||0)+(segCounts.Active||0)}</div><div class="stat-sub">${segCounts.VIP||0} VIP · ${segCounts.Active||0} active</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--yellow);"><div class="stat-label">Lapsed (180–365d)</div><div class="stat-value" style="color:var(--yellow);">${segCounts.Lapsed||0}</div><div class="stat-sub">Re-engagement candidates</div></div>
      <div class="card stat-card"><div class="stat-label">12-mo Revenue</div><div class="stat-value">$${(totalMonetary/1000).toFixed(1)}K</div><div class="stat-sub">Across all customers</div></div>
    </div>
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
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Segment</th><th>Last activity</th><th>12-mo $</th><th>Visits (12-mo)</th><th>Contact</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--text-3);">${totalCount===0?'No customers yet. Click "+ New Customer" to add one, or wait for the Windward CSV import.':'No customers match the current filter.'}</td></tr>` : filtered.map(c => {
              const r = c._rfm;
              const recDisp = r.recency==null ? '<span class="muted">—</span>' : (r.recency<=30?`<span style="color:var(--green);">${r.recency}d</span>`:r.recency<=180?`<span style="color:var(--text-2);">${r.recency}d</span>`:`<span style="color:var(--accent);">${r.recency}d</span>`);
              return `<tr style="cursor:pointer;" onclick="openCustomerDetail('${c.id}')">
                <td style="font-weight:600;color:var(--accent);">${esc(c.name||'(unnamed)')}</td>
                <td><span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(c.type||'—')}</span></td>
                <td>${segmentBadge(r.segment)}</td>
                <td class="sm">${recDisp}</td>
                <td class="mono fw6">${r.monetary>0?'$'+Math.round(r.monetary).toLocaleString():'<span class="muted">—</span>'}</td>
                <td class="sm">${r.frequency||'<span class="muted">0</span>'}</td>
                <td class="sm">${esc(c.email||c.phone||'')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
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
      <button class="btn btn-accent" onclick="openCustomerEdit('${c.id}')">Edit</button>
    </div>
  `);
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
