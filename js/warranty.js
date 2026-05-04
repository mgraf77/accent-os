// ── 5.11 WARRANTY TRACKER (warranty_claims table — see sql/M24_trade_partners_warranty_schema.sql) ──
// Tracks defective-product claims across customers + vendors. Status workflow:
// open → sent_to_vendor → approved/denied → replaced/refunded → closed.

let WARRANTY_CLAIMS = [];
let warrFilter = {q:'', status:'', vendor:''};
let WARR_NUM = 1;

async function sbLoadWarrantyClaims(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/warranty_claims?select=id,claim_number,customer_id,customer_name,vendor_id,vendor_name,sku,description,status,severity,reported_date,purchase_date,warranty_expires,resolution_date,vendor_ticket,cost_to_us,refund_amount,notes,related_quote_id,related_job_id,assigned_to,created_at,updated_at&order=updated_at.desc&limit=500');
    WARRANTY_CLAIMS = Array.isArray(rows) ? rows : [];
    WARRANTY_CLAIMS.forEach(c => { const m = /W-(\d+)/.exec(c.claim_number||''); if(m){ const n = parseInt(m[1],10); if(n >= WARR_NUM) WARR_NUM = n+1; } });
    console.log(`[warranty_claims] Loaded ${WARRANTY_CLAIMS.length} claims`);
    return WARRANTY_CLAIMS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[warranty_claims] table not yet created — run sql/M24_trade_partners_warranty_schema.sql');
    } else {
      console.warn('[sb] Load warranty_claims failed:', e.message);
    }
    return false;
  }
}

async function sbSaveWarrantyClaim(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      claim_number: rec.claim_number || ('W-' + String(WARR_NUM).padStart(4,'0')),
      customer_id: rec.customer_id || null,
      customer_name: rec.customer_name || null,
      vendor_id: rec.vendor_id || null,
      vendor_name: rec.vendor_name || null,
      sku: rec.sku || null,
      description: rec.description,
      status: rec.status || 'open',
      severity: rec.severity || null,
      reported_date: rec.reported_date || new Date().toISOString().slice(0,10),
      purchase_date: rec.purchase_date || null,
      warranty_expires: rec.warranty_expires || null,
      resolution_date: rec.resolution_date || (['replaced','refunded','closed','denied'].includes(rec.status)?new Date().toISOString().slice(0,10):null),
      vendor_ticket: rec.vendor_ticket || null,
      cost_to_us: rec.cost_to_us == null || rec.cost_to_us === '' ? null : Number(rec.cost_to_us),
      refund_amount: rec.refund_amount == null || rec.refund_amount === '' ? null : Number(rec.refund_amount),
      notes: rec.notes || null,
      related_quote_id: rec.related_quote_id || null,
      related_job_id: rec.related_job_id || null,
      assigned_to: rec.assigned_to || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/warranty_claims?on_conflict=id' : '/warranty_claims';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]){ if(!rec.id) WARR_NUM++; return res[0]; }
    if(!rec.id) WARR_NUM++;
    return true;
  }catch(e){ console.warn('[sb] Save warranty_claim failed:', e.message); return false; }
}

async function sbDeleteWarrantyClaim(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/warranty_claims?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete warranty_claim failed:', e.message); return false; }
}

function warranty(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openWarrantyEdit(null)">+ New Claim</button>`;
  renderWarranty(el);
}

function renderWarranty(el){
  const today = new Date(); today.setHours(0,0,0,0);
  const counts = {open:0, sent_to_vendor:0, approved:0, denied:0, replaced:0, refunded:0, closed:0};
  let openCost = 0, totalRefund = 0, expiringSoon = 0;
  WARRANTY_CLAIMS.forEach(c => {
    counts[c.status] = (counts[c.status]||0)+1;
    const isOpen = !['closed','denied','replaced','refunded'].includes(c.status);
    if(isOpen) openCost += Number(c.cost_to_us)||0;
    totalRefund += Number(c.refund_amount)||0;
    if(c.warranty_expires && isOpen){
      const d = new Date(c.warranty_expires);
      const days = Math.round((d - today)/86400000);
      if(days >= 0 && days <= 30) expiringSoon++;
    }
  });

  const q = (warrFilter.q||'').toLowerCase();
  const filtered = WARRANTY_CLAIMS.filter(c => {
    if(warrFilter.status && c.status !== warrFilter.status) return false;
    if(warrFilter.vendor && c.vendor_name !== warrFilter.vendor) return false;
    if(q){
      const hay = `${c.claim_number||''} ${c.sku||''} ${c.description||''} ${c.customer_name||''} ${c.vendor_name||''} ${c.notes||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    const aActive = !['closed','denied','replaced','refunded'].includes(a.status);
    const bActive = !['closed','denied','replaced','refunded'].includes(b.status);
    if(aActive !== bActive) return aActive ? -1 : 1;
    return new Date(b.updated_at||0) - new Date(a.updated_at||0);
  });

  const vendors = [...new Set(WARRANTY_CLAIMS.map(c => c.vendor_name).filter(Boolean))].sort();

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Open Claims</div><div class="stat-value">${(counts.open||0)+(counts.sent_to_vendor||0)+(counts.approved||0)}</div><div class="stat-sub">${counts.open||0} new · ${counts.sent_to_vendor||0} sent · ${counts.approved||0} approved</div></div>
      <div class="card stat-card"${expiringSoon?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Warranty Expiring ≤30d</div><div class="stat-value" style="color:${expiringSoon?'var(--accent)':'var(--text)'};">${expiringSoon}</div><div class="stat-sub">File before expiry</div></div>
      <div class="card stat-card"><div class="stat-label">Open Cost-to-Us</div><div class="stat-value">$${(openCost/1000).toFixed(1)}K</div><div class="stat-sub">Pending refund/replace</div></div>
      <div class="card stat-card"><div class="stat-label">Resolved</div><div class="stat-value">${(counts.replaced||0)+(counts.refunded||0)+(counts.closed||0)}</div><div class="stat-sub">${counts.denied||0} denied</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Warranty Claims · ${filtered.length}${filtered.length!==WARRANTY_CLAIMS.length?` of ${WARRANTY_CLAIMS.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="warr-q" placeholder="Search claim # / sku / customer / vendor…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:240px;" value="${esc(warrFilter.q)}" oninput="warrFilter.q=this.value;clearTimeout(window._warrDeb);window._warrDeb=setTimeout(()=>renderWarranty($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="warrFilter.status=this.value;renderWarranty($('pg-content'))">
            <option value="">All statuses</option>
            ${['open','sent_to_vendor','approved','denied','replaced','refunded','closed'].map(s=>`<option value="${s}" ${warrFilter.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="warrFilter.vendor=this.value;renderWarranty($('pg-content'))">
            <option value="">All vendors</option>
            ${vendors.map(v=>`<option value="${esc(v)}" ${warrFilter.vendor===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>#</th><th>Reported</th><th>Vendor</th><th>SKU</th><th>Customer</th><th>Description</th><th>Severity</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-3);">${WARRANTY_CLAIMS.length===0?'No warranty claims yet. Click "+ New Claim" to log one (run M24 SQL first if save fails).':'No claims match the current filter.'}</td></tr>` : filtered.map(c => {
              const sb = {open:'bg-yellow', sent_to_vendor:'bg-blue', approved:'bg-blue', denied:'bg-red', replaced:'bg-green', refunded:'bg-green', closed:'bg-gray'}[c.status] || 'bg-gray';
              const sevColor = {safety:'var(--accent)', functional:'var(--yellow)', cosmetic:'var(--text-3)'}[c.severity] || 'var(--text-3)';
              return `<tr style="cursor:pointer;${['closed','denied','refunded','replaced'].includes(c.status)?'opacity:0.65;':''}" onclick="openWarrantyEdit('${c.id}')">
                <td class="mono fw6 sm">${esc(c.claim_number||'—')}</td>
                <td class="mono sm">${esc(c.reported_date||'')}</td>
                <td class="sm">${esc(c.vendor_name||'—')}</td>
                <td class="mono sm">${esc(c.sku||'—')}</td>
                <td class="sm">${esc(c.customer_name||'—')}</td>
                <td class="sm" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(c.description||'')}">${esc(c.description||'')}</td>
                <td><span class="sm" style="color:${sevColor};font-weight:600;text-transform:capitalize;">${esc(c.severity||'—')}</span></td>
                <td><span class="badge ${sb}" style="font-size:10px;">${esc(c.status.replace('_',' '))}</span></td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openWarrantyEdit('${c.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openWarrantyEdit(claimId){
  const isNew = !claimId;
  const c = isNew ? {status:'open', severity:'functional', reported_date: new Date().toISOString().slice(0,10)} : WARRANTY_CLAIMS.find(x => x.id === claimId);
  if(!c){ toast('Claim not found','err'); return; }
  // Vendor + customer + quote dropdowns
  const vendorOptions = (typeof VD !== 'undefined') ? VD.filter(v => !v.inactive).slice().sort((a,b)=>a.n.localeCompare(b.n)).map(v => `<option value="${v.id}" data-name="${esc(v.n)}" ${String(c.vendor_id)===String(v.id)?'selected':''}>${esc(v.n)}</option>`).join('') : '';
  const customerOptions = (typeof CUSTOMERS !== 'undefined' && CUSTOMERS.length) ? CUSTOMERS.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(x => `<option value="${x.id}" data-name="${esc(x.name||'')}" ${c.customer_id===x.id?'selected':''}>${esc(x.name||'')}</option>`).join('') : '';
  const quoteOptions = (typeof QUOTES !== 'undefined' && QUOTES.length) ? QUOTES.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(q => `<option value="${q._uuid||q.id}" ${c.related_quote_id===(q._uuid||q.id)?'selected':''}>${esc(q.id)} · ${esc(q.customer||'')}</option>`).join('') : '';

  openModal((isNew?'New':'Edit')+' Warranty Claim', `
    <div class="frow">
      <div class="fcol field"><label>Claim # (auto if blank)</label><input id="w-num" value="${esc(c.claim_number||'')}" placeholder="W-${String(WARR_NUM).padStart(4,'0')}"></div>
      <div class="fcol field"><label>Status</label>
        <select id="w-s">${['open','sent_to_vendor','approved','denied','replaced','refunded','closed'].map(s=>`<option value="${s}" ${c.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Vendor *</label>
        <select id="w-v"><option value="">— pick —</option>${vendorOptions}</select>
      </div>
      <div class="fcol field"><label>SKU</label><input id="w-sku" value="${esc(c.sku||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Customer</label>
        <select id="w-c"><option value="">— none —</option>${customerOptions}</select>
      </div>
      <div class="fcol field"><label>Or customer name</label><input id="w-cn" value="${esc(c.customer_name||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Severity</label>
        <select id="w-sev">${['cosmetic','functional','safety'].map(x=>`<option value="${x}" ${c.severity===x?'selected':''}>${x}</option>`).join('')}</select>
      </div>
      <div class="fcol field"><label>Reported</label><input id="w-rd" type="date" value="${esc(c.reported_date||'')}"></div>
      <div class="fcol field"><label>Purchase Date</label><input id="w-pd" type="date" value="${esc(c.purchase_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Warranty Expires</label><input id="w-we" type="date" value="${esc(c.warranty_expires||'')}"></div>
      <div class="fcol field"><label>Resolution Date</label><input id="w-rd2" type="date" value="${esc(c.resolution_date||'')}"></div>
    </div>
    <div class="fg"><label>Description (failure mode) *</label><textarea id="w-desc" rows="3">${esc(c.description||'')}</textarea></div>
    <div class="frow">
      <div class="fcol field"><label>Vendor Ticket / RMA #</label><input id="w-vt" value="${esc(c.vendor_ticket||'')}"></div>
      <div class="fcol field"><label>Linked Quote</label>
        <select id="w-q"><option value="">— none —</option>${quoteOptions}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Cost to Us ($)</label><input id="w-cost" type="number" step="0.01" value="${c.cost_to_us!=null?c.cost_to_us:''}"></div>
      <div class="fcol field"><label>Refund Amount ($)</label><input id="w-ref" type="number" step="0.01" value="${c.refund_amount!=null?c.refund_amount:''}"></div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="w-notes" rows="2">${esc(c.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteWarrantyConfirm('${claimId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveWarranty(${isNew?'null':`'${claimId}'`})">Save</button>
    </div>
  `);
}

async function saveWarranty(claimId){
  const desc = $('w-desc')?.value?.trim();
  if(!desc){ toast('Description required','err'); return; }
  const vId = $('w-v').value;
  if(!vId){ toast('Vendor required','err'); return; }
  const vName = $('w-v').options[$('w-v').selectedIndex]?.getAttribute('data-name') || '';
  const cId = $('w-c').value || null;
  let cName = $('w-cn').value?.trim() || null;
  if(cId && !cName) cName = $('w-c').options[$('w-c').selectedIndex]?.getAttribute('data-name') || null;
  const rec = {
    id: claimId || undefined,
    claim_number: $('w-num').value || null,
    vendor_id: vId,
    vendor_name: vName,
    customer_id: cId,
    customer_name: cName,
    sku: $('w-sku').value || null,
    description: desc,
    status: $('w-s').value,
    severity: $('w-sev').value,
    reported_date: $('w-rd').value || null,
    purchase_date: $('w-pd').value || null,
    warranty_expires: $('w-we').value || null,
    resolution_date: $('w-rd2').value || null,
    vendor_ticket: $('w-vt').value || null,
    related_quote_id: $('w-q').value || null,
    cost_to_us: $('w-cost').value || null,
    refund_amount: $('w-ref').value || null,
    notes: $('w-notes').value || null
  };
  const saved = await sbSaveWarrantyClaim(rec);
  if(!saved){ toast('Save failed — table may not exist (run M24 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = WARRANTY_CLAIMS.findIndex(x => x.id === saved.id);
    if(idx >= 0) WARRANTY_CLAIMS[idx] = saved; else WARRANTY_CLAIMS.unshift(saved);
  } else {
    await sbLoadWarrantyClaims();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(claimId?'warranty_edit':'warranty_create', 'warranty', {claim_id: claimId||saved?.id, vendor_id: vId, status: rec.status});
  closeModal();
  renderWarranty($('pg-content'));
  toast('Claim '+(claimId?'updated':'added'),'ok');
}

async function deleteWarrantyConfirm(claimId){
  const c = WARRANTY_CLAIMS.find(x => x.id === claimId);
  if(!c) return;
  if(!confirm(`Delete warranty claim "${c.claim_number}"?`)) return;
  await sbDeleteWarrantyClaim(claimId);
  WARRANTY_CLAIMS = WARRANTY_CLAIMS.filter(x => x.id !== claimId);
  if(typeof sbAuditLog==='function') sbAuditLog('warranty_delete', 'warranty', {claim_id: claimId, claim_number: c.claim_number});
  closeModal();
  renderWarranty($('pg-content'));
  toast('Claim deleted','ok');
}
