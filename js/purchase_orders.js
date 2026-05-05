// ── 5.4 PURCHASE ORDERS (purchase_orders + po_lines tables — see sql/M23_purchase_orders_schema.sql) ──
let POS = [];
let PO_LINES = {};   // po_id → array of line rows
let poFilter = {q:'', status:'', vendor:''};
let PO_NUM = 1;

async function sbLoadPurchaseOrders(){
  if(!sbConfigured()) return false;
  try{
    const headers = await sbFetch('/purchase_orders?select=id,po_number,vendor_id,vendor_name,status,order_date,expected_date,received_date,subtotal,tax,freight,total,notes,related_quote_id,related_job_id,created_at,updated_at&order=updated_at.desc&limit=500');
    if(!Array.isArray(headers)) return 0;
    POS = headers;
    POS.forEach(p => { const m = /PO-(\d+)/.exec(p.po_number||''); if(m){ const n = parseInt(m[1],10); if(n >= PO_NUM) PO_NUM = n+1; } });
    if(POS.length){
      const ids = POS.map(p => p.id);
      const lines = await sbFetch(`/po_lines?select=id,po_id,line_no,sku,description,qty,qty_received,unit_cost,ext_cost,notes&po_id=in.(${ids.join(',')})&order=line_no.asc`);
      PO_LINES = {};
      (lines||[]).forEach(l => (PO_LINES[l.po_id] = PO_LINES[l.po_id]||[]).push(l));
    }
    console.log(`[purchase_orders] Loaded ${POS.length} POs`);
    return POS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[purchase_orders] table not yet created — run sql/M23_purchase_orders_schema.sql');
    } else {
      console.warn('[sb] Load purchase_orders failed:', e.message);
    }
    return false;
  }
}

async function sbSavePurchaseOrder(po, lines){
  if(!sbConfigured()) return false;
  try{
    const subtotal = (lines||[]).reduce((s,l)=> s + (Number(l.qty)||0)*(Number(l.unit_cost)||0), 0);
    const total = subtotal + (Number(po.tax)||0) + (Number(po.freight)||0);
    const body = {
      id: po.id || undefined,
      po_number: po.po_number || ('PO-' + String(PO_NUM).padStart(4,'0')),
      vendor_id: po.vendor_id || null,
      vendor_name: po.vendor_name || null,
      status: po.status || 'draft',
      order_date: po.order_date || new Date().toISOString().slice(0,10),
      expected_date: po.expected_date || null,
      received_date: po.received_date || null,
      subtotal,
      tax: Number(po.tax)||0,
      freight: Number(po.freight)||0,
      total,
      notes: po.notes || null,
      related_quote_id: po.related_quote_id || null,
      related_job_id: po.related_job_id || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': po.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = po.id ? '/purchase_orders?on_conflict=id' : '/purchase_orders';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    let saved = Array.isArray(res) && res[0] ? res[0] : null;
    if(!saved && !po.id) return false;
    if(!saved) saved = Object.assign({}, body, {id: po.id});
    if(!po.id) PO_NUM++;
    // Replace lines: simple delete-then-insert
    if(po.id){
      try{ await sbFetch(`/po_lines?po_id=eq.${encodeURIComponent(po.id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}}); }catch(e){ console.warn('[sb] PO line delete failed:', e.message); }
    }
    const lineBody = (lines||[]).filter(l => l.sku || l.description).map((l, i) => ({
      po_id: saved.id,
      line_no: i+1,
      sku: l.sku || null,
      description: l.description || null,
      qty: Number(l.qty)||0,
      qty_received: Number(l.qty_received)||0,
      unit_cost: l.unit_cost == null || l.unit_cost === '' ? null : Number(l.unit_cost),
      ext_cost: ((Number(l.qty)||0) * (Number(l.unit_cost)||0)) || null,
      notes: l.notes || null
    }));
    if(lineBody.length){
      try{ await sbFetch('/po_lines', {method:'POST', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(lineBody)}); }catch(e){ console.warn('[sb] PO line insert failed:', e.message); }
    }
    return saved;
  }catch(e){ console.warn('[sb] Save purchase_order failed:', e.message); return false; }
}

// Single-row PATCH for inline edits (v6.10.52)
async function sbUpdatePOField(id, field, value){
  if(!sbConfigured() || !id || !field) return false;
  const allowed = ['status','expected_date','order_date','notes','tracking'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value, updated_at: new Date().toISOString() };
    const res = await sbFetch(`/purchase_orders?id=eq.${encodeURIComponent(id)}`, {
      method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update PO field failed:', e.message); return false; }
}

async function commitPOCellSelect(select){
  if(!select) return;
  const id = select.dataset.id;
  const field = select.dataset.field;
  const orig = select.dataset.orig || '';
  const next = select.value;
  if(next === orig) return;
  // PO uses POS array (purchase_orders)
  const item = (typeof POS !== 'undefined' ? POS : []).find(p => p.id === id);
  if(!item){ select.value = orig; toast('Row not found','err'); return; }
  const prev = item[field];
  item[field] = next;
  select.dataset.orig = next;
  const res = await sbUpdatePOField(id, field, next);
  if(res === false){
    item[field] = prev;
    select.value = orig;
    select.dataset.orig = orig;
    toast(`Save failed — ${field} reverted`,'err');
    return;
  }
  if(typeof sbAuditLog==='function') sbAuditLog(`po_${field}_edit`, 'purchase_orders', {po_id: id, field, from: prev, to: next});
  toast(`${item.po_number||'PO'} · ${field}: ${prev} → ${next}`, 'ok');
  renderPOs($('pg-content'));
}

async function sbDeletePurchaseOrder(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/purchase_orders?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete purchase_order failed:', e.message); return false; }
}

function purchaseorders(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openPOEdit(null)">+ New PO</button>`;
  renderPOs(el);
}

function renderPOs(el){
  const today = new Date(); today.setHours(0,0,0,0);
  const counts = {draft:0, sent:0, confirmed:0, partial:0, received:0, cancelled:0};
  let totalOpen = 0, latePOs = 0;
  POS.forEach(p => {
    counts[p.status] = (counts[p.status]||0)+1;
    const isOpen = !['received','cancelled'].includes(p.status);
    if(isOpen) totalOpen += Number(p.total)||0;
    if(isOpen && p.expected_date){
      const d = new Date(p.expected_date);
      if(d < today) latePOs++;
    }
  });

  const q = (poFilter.q||'').toLowerCase();
  const filtered = POS.filter(p => {
    if(poFilter.status && p.status !== poFilter.status) return false;
    if(poFilter.vendor && p.vendor_name !== poFilter.vendor) return false;
    if(q){
      const hay = `${p.po_number||''} ${p.vendor_name||''} ${p.notes||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    const aActive = !['received','cancelled'].includes(a.status);
    const bActive = !['received','cancelled'].includes(b.status);
    if(aActive !== bActive) return aActive ? -1 : 1;
    return new Date(b.updated_at||0) - new Date(a.updated_at||0);
  });

  const vendors = [...new Set(POS.map(p => p.vendor_name).filter(Boolean))].sort();

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Open POs</div><div class="stat-value">${(counts.draft||0)+(counts.sent||0)+(counts.confirmed||0)+(counts.partial||0)}</div><div class="stat-sub">${counts.draft||0} draft · ${counts.sent||0} sent · ${counts.confirmed||0} confirmed · ${counts.partial||0} partial</div></div>
      <div class="card stat-card"${latePOs?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Past Expected</div><div class="stat-value" style="color:${latePOs?'var(--accent)':'var(--text)'};">${latePOs}</div><div class="stat-sub">Open & overdue</div></div>
      <div class="card stat-card"><div class="stat-label">Open $</div><div class="stat-value">$${(totalOpen/1000).toFixed(1)}K</div><div class="stat-sub">Sum of open PO totals</div></div>
      <div class="card stat-card"><div class="stat-label">Received YTD</div><div class="stat-value">${counts.received||0}</div><div class="stat-sub">Closed POs</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Purchase Orders · ${filtered.length}${filtered.length!==POS.length?' of '+POS.length:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="po-q" placeholder="Search PO# / vendor / notes…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(poFilter.q)}" oninput="poFilter.q=this.value;clearTimeout(window._poDeb);window._poDeb=setTimeout(()=>renderPOs($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="poFilter.status=this.value;renderPOs($('pg-content'))">
            <option value="">All statuses</option>
            ${['draft','sent','confirmed','partial','received','cancelled'].map(s=>`<option value="${s}" ${poFilter.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="poFilter.vendor=this.value;renderPOs($('pg-content'))">
            <option value="">All vendors</option>
            ${vendors.map(v=>`<option value="${esc(v)}" ${poFilter.vendor===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>PO #</th><th>Vendor</th><th>Status</th><th>Order date</th><th>Expected</th><th>Lines</th><th>Total</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">${POS.length===0?'No purchase orders yet. Click "+ New PO" to create one (run M23 SQL first if save fails).':'No POs match the current filter.'}</td></tr>` : filtered.map(p => {
              const sb = {draft:'bg-gray', sent:'bg-blue', confirmed:'bg-blue', partial:'bg-yellow', received:'bg-green', cancelled:'bg-gray'}[p.status] || 'bg-gray';
              const lineCount = (PO_LINES[p.id]||[]).length;
              const expCell = p.expected_date ? (() => {
                const d = new Date(p.expected_date);
                const isLate = d < today && !['received','cancelled'].includes(p.status);
                return `<span class="mono sm" style="color:${isLate?'var(--accent)':'var(--text-2)'};">${p.expected_date}</span>`;
              })() : '<span class="muted">—</span>';
              const canEditPo = CU && ['Owner','Admin','Manager'].includes(CU.role);
              const poStatusOpts = ['draft','sent','confirmed','partial','received','cancelled'];
              const poStatusCell = canEditPo
                ? `<td onclick="event.stopPropagation();"><select data-id="${p.id}" data-field="status" data-orig="${esc(p.status)}" onchange="commitPOCellSelect(this)" style="font-size:11px;padding:3px 6px;border:1px solid var(--border-light);border-radius:4px;background:transparent;font-family:inherit;cursor:pointer;">${poStatusOpts.map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></td>`
                : `<td><span class="badge ${sb}" style="font-size:10px;">${esc(p.status)}</span></td>`;
              return `<tr style="cursor:pointer;${['received','cancelled'].includes(p.status)?'opacity:0.6;':''}" onclick="openPOEdit('${p.id}')">
                <td class="mono fw6 sm">${esc(p.po_number||'—')}</td>
                <td style="font-weight:600;color:var(--accent);">${esc(p.vendor_name||'—')}</td>
                ${poStatusCell}
                <td class="mono sm">${esc(p.order_date||'')}</td>
                <td>${expCell}</td>
                <td class="sm">${lineCount}</td>
                <td class="mono fw6 sm">$${Number(p.total||0).toLocaleString()}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openPOEdit('${p.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

let _poEditLines = [];
function openPOEdit(poId, preset){
  const isNew = !poId;
  let p = isNew ? {status:'draft', tax:0, freight:0, order_date: new Date().toISOString().slice(0,10)} : POS.find(x => x.id === poId);
  if(!p){ toast('PO not found','err'); return; }
  if(isNew && preset && typeof preset === 'object'){
    if(preset.po) p = { ...p, ...preset.po };
    if(Array.isArray(preset.lines) && preset.lines.length){
      _poEditLines = preset.lines.map((l,i) => ({line_no:i+1, sku:l.sku||'', description:l.description||'', qty:Number(l.qty)||1, unit_cost:l.unit_cost==null?'':l.unit_cost, qty_received:0, notes:l.notes||null}));
    } else {
      _poEditLines = [];
    }
  } else {
    _poEditLines = isNew ? [] : (PO_LINES[poId]||[]).map(l => ({...l}));
  }
  if(_poEditLines.length === 0) _poEditLines.push({line_no:1, sku:'', description:'', qty:1, unit_cost:'', qty_received:0});

  // Vendor dropdown from VD
  const vendorOptions = (typeof VD !== 'undefined') ? VD.filter(v => !v.inactive).slice().sort((a,b)=>a.n.localeCompare(b.n)).map(v => `<option value="${v.id}" data-name="${esc(v.n)}" ${String(p.vendor_id)===String(v.id)?'selected':''}>${esc(v.n)}</option>`).join('') : '';
  // Quote / job dropdowns
  const quoteOptions = (typeof QUOTES !== 'undefined' && QUOTES.length) ? QUOTES.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(q => `<option value="${q._uuid||q.id}" ${p.related_quote_id===(q._uuid||q.id)?'selected':''}>${esc(q.id)} · ${esc(q.customer||'')}</option>`).join('') : '';
  const jobOptions = (typeof JOBS !== 'undefined' && JOBS.length) ? JOBS.slice().sort((a,b)=>(a.project_name||'').localeCompare(b.project_name||'')).map(j => `<option value="${j.id}" ${p.related_job_id===j.id?'selected':''}>${esc(j.job_number||'?')} · ${esc(j.project_name)}</option>`).join('') : '';

  openModal((isNew?'New':'Edit')+' Purchase Order', `
    <div class="frow">
      <div class="fcol field"><label>PO # (auto if blank)</label><input id="po-num" value="${esc(p.po_number||'')}" placeholder="PO-${String(PO_NUM).padStart(4,'0')}"></div>
      <div class="fcol field"><label>Status</label>
        <select id="po-s">${['draft','sent','confirmed','partial','received','cancelled'].map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Vendor *</label>
        <select id="po-v"><option value="">— pick —</option>${vendorOptions}</select>
      </div>
      <div class="fcol field"><label>Order date</label><input id="po-od" type="date" value="${esc(p.order_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Expected date</label><input id="po-ed" type="date" value="${esc(p.expected_date||'')}"></div>
      <div class="fcol field"><label>Received date</label><input id="po-rd" type="date" value="${esc(p.received_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Linked Quote</label>
        <select id="po-q"><option value="">— none —</option>${quoteOptions}</select>
      </div>
      <div class="fcol field"><label>Linked Job</label>
        <select id="po-j"><option value="">— none —</option>${jobOptions}</select>
      </div>
    </div>
    <div style="margin-top:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <strong style="font-size:13px;">Line Items</strong>
        <button class="btn btn-outline btn-sm" style="font-size:11px;" onclick="addPOLine()">+ Add line</button>
      </div>
      <div id="po-lines-wrap" style="max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;">
        ${renderPOLinesEditor()}
      </div>
    </div>
    <div class="frow" style="margin-top:14px;">
      <div class="fcol field"><label>Tax</label><input id="po-tax" type="number" step="0.01" value="${p.tax||0}" oninput="updatePOTotals()"></div>
      <div class="fcol field"><label>Freight</label><input id="po-fr" type="number" step="0.01" value="${p.freight||0}" oninput="updatePOTotals()"></div>
      <div class="fcol field"><label>Subtotal</label><input id="po-sub" disabled value="0"></div>
      <div class="fcol field"><label>Total</label><input id="po-tot" disabled value="0" style="font-weight:700;"></div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="po-notes" rows="2">${esc(p.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deletePOConfirm('${poId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      ${!isNew && p.status !== 'received' ? `<button class="btn btn-outline" onclick="receivePO('${poId}')">Mark Received & Update Inventory</button>` : ''}
      <button class="btn btn-accent" onclick="savePO(${isNew?'null':`'${poId}'`})">Save</button>
    </div>
  `);
  setTimeout(updatePOTotals, 0);
}

function renderPOLinesEditor(){
  return `<table style="margin:0;font-size:12px;"><thead><tr><th style="width:130px;">SKU</th><th>Description</th><th style="width:60px;">Qty</th><th style="width:70px;">Recv</th><th style="width:90px;">Unit Cost</th><th style="width:90px;">Ext</th><th style="width:30px;"></th></tr></thead><tbody>${_poEditLines.map((l,i)=>{
    const ext = ((Number(l.qty)||0) * (Number(l.unit_cost)||0));
    return `<tr>
      <td><input value="${esc(l.sku||'')}" oninput="_poEditLines[${i}].sku=this.value" style="width:100%;padding:3px 5px;font-size:11px;"></td>
      <td><input value="${esc(l.description||'')}" oninput="_poEditLines[${i}].description=this.value" style="width:100%;padding:3px 5px;font-size:11px;"></td>
      <td><input type="number" step="0.01" value="${l.qty||0}" oninput="_poEditLines[${i}].qty=this.value;updatePOTotals()" style="width:100%;padding:3px 5px;font-size:11px;"></td>
      <td><input type="number" step="0.01" value="${l.qty_received||0}" oninput="_poEditLines[${i}].qty_received=this.value" style="width:100%;padding:3px 5px;font-size:11px;"></td>
      <td><input type="number" step="0.01" value="${l.unit_cost||''}" oninput="_poEditLines[${i}].unit_cost=this.value;updatePOTotals()" style="width:100%;padding:3px 5px;font-size:11px;"></td>
      <td class="mono sm" style="text-align:right;padding:3px 8px;">$${ext.toFixed(2)}</td>
      <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 5px;" onclick="removePOLine(${i})">×</button></td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

function addPOLine(){
  _poEditLines.push({line_no: _poEditLines.length+1, sku:'', description:'', qty:1, unit_cost:'', qty_received:0});
  $('po-lines-wrap').innerHTML = renderPOLinesEditor();
  updatePOTotals();
}
function removePOLine(i){
  _poEditLines.splice(i,1);
  $('po-lines-wrap').innerHTML = renderPOLinesEditor();
  updatePOTotals();
}

function updatePOTotals(){
  const sub = _poEditLines.reduce((s,l)=> s + (Number(l.qty)||0)*(Number(l.unit_cost)||0), 0);
  const tax = Number($('po-tax')?.value)||0;
  const fr = Number($('po-fr')?.value)||0;
  const tot = sub + tax + fr;
  if($('po-sub')) $('po-sub').value = '$'+sub.toFixed(2);
  if($('po-tot')) $('po-tot').value = '$'+tot.toFixed(2);
}

async function savePO(poId){
  const vId = $('po-v').value;
  if(!vId){ toast('Vendor required','err'); return; }
  const vName = $('po-v').options[$('po-v').selectedIndex]?.getAttribute('data-name') || '';
  const po = {
    id: poId || undefined,
    po_number: $('po-num').value || null,
    vendor_id: vId,
    vendor_name: vName,
    status: $('po-s').value,
    order_date: $('po-od').value || null,
    expected_date: $('po-ed').value || null,
    received_date: $('po-rd').value || null,
    related_quote_id: $('po-q').value || null,
    related_job_id: $('po-j').value || null,
    tax: $('po-tax').value || 0,
    freight: $('po-fr').value || 0,
    notes: $('po-notes').value || null
  };
  const saved = await sbSavePurchaseOrder(po, _poEditLines);
  if(!saved){ toast('Save failed — table may not exist (run M23 SQL)','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog(poId?'po_edit':'po_create', 'purchase_orders', {po_id: poId||saved.id, vendor_id: vId, status: po.status, line_count: _poEditLines.length});
  await sbLoadPurchaseOrders();
  closeModal();
  renderPOs($('pg-content'));
  toast('PO '+(poId?'updated':'added'),'ok');
}

async function deletePOConfirm(poId){
  const p = POS.find(x => x.id === poId);
  if(!p) return;
  if(!confirm(`Delete PO "${p.po_number}"? Lines will also be removed.`)) return;
  await sbDeletePurchaseOrder(poId);
  POS = POS.filter(x => x.id !== poId);
  delete PO_LINES[poId];
  if(typeof sbAuditLog==='function') sbAuditLog('po_delete', 'purchase_orders', {po_id: poId, po_number: p.po_number});
  closeModal();
  renderPOs($('pg-content'));
  toast('PO deleted','ok');
}

async function receivePO(poId){
  if(!confirm('Mark this PO as received and increment matching inventory items by line qty? (Use this only when stock physically arrives.)')) return;
  const p = POS.find(x => x.id === poId);
  if(!p) return;
  const lines = PO_LINES[poId] || [];
  // Update inventory_items: add line.qty to qty_on_hand for matching SKU + vendor
  let matched = 0, unmatched = 0;
  for(const l of lines){
    if(!l.sku) continue;
    const inv = INVENTORY.find(r => r.sku === l.sku && (String(r.vendor_id)===String(p.vendor_id) || r.vendor_name === p.vendor_name));
    if(inv){
      const newQty = (Number(inv.qty_on_hand)||0) + (Number(l.qty)||0);
      try{
        await sbFetch(`/inventory_items?id=eq.${encodeURIComponent(inv.id)}`, {
          method:'PATCH', headers:{'Prefer':'return=minimal'},
          body: JSON.stringify({qty_on_hand: newQty, last_imported_at: new Date().toISOString()})
        });
        inv.qty_on_hand = newQty;
        matched++;
      }catch(e){ console.warn('[po receive] inventory update failed:', e.message); }
    } else unmatched++;
  }
  // Update PO status to received
  p.status = 'received';
  p.received_date = new Date().toISOString().slice(0,10);
  await sbSavePurchaseOrder(p, lines);
  if(typeof sbAuditLog==='function') sbAuditLog('po_receive', 'purchase_orders', {po_id: poId, lines_matched: matched, lines_unmatched: unmatched});
  await sbLoadPurchaseOrders();
  closeModal();
  renderPOs($('pg-content'));
  toast(`Received: ${matched} inventory rows updated${unmatched?', '+unmatched+' unmatched':''}`,'ok');
}

// Quote → PO conversion helper. Called from the Saved Quotes modal.
// Groups quote line items by vendor; one PO per vendor. Multi-vendor quotes
// surface a picker so the user can create one PO at a time.
function createPOFromQuote(quoteIdOrUuid){
  if(typeof QUOTES === 'undefined' || !QUOTES.length){ toast('No quotes loaded','err'); return; }
  const q = QUOTES.find(x => x.id === quoteIdOrUuid || x._uuid === quoteIdOrUuid);
  if(!q){ toast('Quote not found','err'); return; }
  const lines = (q.lineItems||[]).filter(l => l.desc || l.qty > 0);
  if(!lines.length){ toast('Quote has no line items','err'); return; }
  // Group by vendorId. Lines with no vendor go in '__none' bucket.
  const groups = {};
  lines.forEach(l => {
    const k = l.vendorId || '__none';
    (groups[k] = groups[k] || {vendor_id: l.vendorId||null, vendor_name: l.vendorName||null, lines: []}).lines.push(l);
  });
  const keys = Object.keys(groups);
  // No vendor-tagged lines → open blank PO with quote link, surface a hint.
  if(keys.length === 1 && keys[0] === '__none'){
    toast('Quote lines have no vendor — pick one in the PO','info');
    closeModal();
    setTimeout(() => openPOEdit(null, {
      po: {related_quote_id: q._uuid || null},
      lines: groups.__none.lines.map(l => ({sku:'', description:l.desc, qty:l.qty, unit_cost:l.price, notes:l.cat}))
    }), 50);
    return;
  }
  // Single vendor group (ignoring an optional __none) → direct preset.
  const vendorKeys = keys.filter(k => k !== '__none');
  if(vendorKeys.length === 1){
    _openPOFromQuoteGroup(q, groups[vendorKeys[0]]);
    return;
  }
  // Multi-vendor → picker modal. Each row creates one PO.
  const VDmap = (typeof VD !== 'undefined') ? Object.fromEntries(VD.map(v => [String(v.id), v.n])) : {};
  const rows = vendorKeys.map(k => {
    const g = groups[k];
    const name = g.vendor_name || VDmap[String(g.vendor_id)] || 'Vendor #'+g.vendor_id;
    const total = g.lines.reduce((s,l)=> s + (Number(l.qty)||0)*(Number(l.price)||0), 0);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;">
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;">${esc(name)}</div>
        <div class="muted sm">${g.lines.length} line${g.lines.length===1?'':'s'} · $${total.toFixed(2)}</div>
      </div>
      <button class="btn btn-accent btn-sm" onclick="_poFromQuotePick('${esc(q._uuid||q.id)}','${esc(k)}')">+ PO</button>
    </div>`;
  }).join('');
  const noneNote = groups.__none ? `<div class="muted sm" style="margin-top:8px;font-style:italic;">${groups.__none.lines.length} line${groups.__none.lines.length===1?'':'s'} have no vendor — not shown.</div>` : '';
  openModal('Create PO from Quote — pick vendor', `
    <div style="font-size:12px;color:var(--text-3);margin-bottom:10px;">Quote ${esc(q.id)} touches ${vendorKeys.length} vendors. Each row creates one PO with that vendor's lines pre-filled.</div>
    ${rows}${noneNote}
  `, `<button class="btn btn-outline" onclick="closeModal()">Done</button>`);
}

function _poFromQuotePick(quoteKey, vendorKey){
  const q = (QUOTES||[]).find(x => x.id === quoteKey || x._uuid === quoteKey);
  if(!q){ toast('Quote not found','err'); return; }
  const lines = (q.lineItems||[]).filter(l => (l.vendorId || '__none') === vendorKey && (l.desc || l.qty > 0));
  if(!lines.length){ toast('No lines for that vendor','err'); return; }
  const g = {
    vendor_id: vendorKey === '__none' ? null : vendorKey,
    vendor_name: lines[0].vendorName || null,
    lines
  };
  _openPOFromQuoteGroup(q, g);
}

function _openPOFromQuoteGroup(q, g){
  const VDmap = (typeof VD !== 'undefined') ? Object.fromEntries(VD.map(v => [String(v.id), v.n])) : {};
  const vName = g.vendor_name || VDmap[String(g.vendor_id)] || null;
  const preset = {
    po: {
      vendor_id: g.vendor_id || null,
      vendor_name: vName,
      related_quote_id: q._uuid || null,
      notes: `From quote ${q.id}${q.project?' · '+q.project:''}`
    },
    lines: g.lines.map(l => ({sku:'', description:l.desc, qty:l.qty, unit_cost:l.price, notes:l.cat}))
  };
  closeModal();
  setTimeout(() => openPOEdit(null, preset), 50);
  if(typeof sbAuditLog==='function') sbAuditLog('po_from_quote', 'quotes', {quote_id: q._uuid||q.id, vendor_id: g.vendor_id||null, line_count: g.lines.length});
}

