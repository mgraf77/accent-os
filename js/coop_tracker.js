// Co-op / Rebate Tracker — extracted from index.html (Track 2.3)
// Depends on: sbFetch, sbConfigured, sbAuditLog, toast, openModal, closeModal, esc, $, CU, VD, renderVendors
// Global: COOP_FUNDS (array, initialized here)

let COOP_FUNDS = [];

async function sbLoadCoopFunds(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/coop_tracker?select=id,vendor_id,fund_type,amount,currency,earned_period,deadline,status,notes,created_at&order=deadline.asc.nullslast,created_at.desc');
    COOP_FUNDS = Array.isArray(rows) ? rows : [];
    console.log(`[coop_tracker] Loaded ${COOP_FUNDS.length} fund rows`);
    return COOP_FUNDS.length;
  }catch(e){ console.warn('[sb] Load coop_tracker failed:', e.message); return false; }
}

async function sbSaveCoopFund(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      vendor_id: String(rec.vendor_id),
      fund_type: rec.fund_type,
      amount: rec.amount === '' ? null : Number(rec.amount),
      currency: rec.currency || 'USD',
      earned_period: rec.earned_period || null,
      deadline: rec.deadline || null,
      status: rec.status || 'open',
      notes: rec.notes || null,
      updated_at: new Date().toISOString(),
      updated_by: (CU?.name)||'Unknown'
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/coop_tracker?on_conflict=id' : '/coop_tracker';
    const res = await sbFetch(path, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save coop_tracker failed:', e.message); return false; }
}

async function sbDeleteCoopFund(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/coop_tracker?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete coop_tracker failed:', e.message); return false; }
}

// Single-row PATCH for inline edits (v6.10.54)
async function sbUpdateCoopField(id, field, value){
  if(!sbConfigured() || !id || !field) return false;
  const allowed = ['status','notes','amount','deadline','fund_type'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value };
    const res = await sbFetch(`/coop_tracker?id=eq.${encodeURIComponent(id)}`, {
      method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update coop field failed:', e.message); return false; }
}

async function commitCoopCellSelect(select){
  if(!select) return;
  const id = select.dataset.id;
  const field = select.dataset.field;
  const orig = select.dataset.orig || '';
  const next = select.value;
  if(next === orig) return;
  const item = COOP_FUNDS.find(r => r.id === id);
  if(!item){ select.value = orig; toast('Row not found','err'); return; }
  const prev = item[field];
  item[field] = next;
  select.dataset.orig = next;
  const res = await sbUpdateCoopField(id, field, next);
  if(res === false){
    item[field] = prev;
    select.value = orig;
    select.dataset.orig = orig;
    toast(`Save failed — ${field} reverted`,'err');
    return;
  }
  if(typeof sbAuditLog==='function') sbAuditLog(`coop_${field}_edit`, 'coop_tracker', {coop_id: id, field, from: prev, to: next});
  toast(`Co-op fund · ${field}: ${prev} → ${next}`, 'ok');
  // Re-render the coop tracker section if visible
  const sec = $('vendor-section-content');
  if(sec && typeof renderCoopTracker === 'function') renderCoopTracker(sec);
}

function renderCoopTracker(container){
  const today = new Date(); today.setHours(0,0,0,0);
  const totals = {open:0, claimed:0, expired:0, atRisk:0, totalValue:0, openValue:0};
  COOP_FUNDS.forEach(r => {
    if(r.status === 'open') totals.open++;
    else if(r.status === 'claimed') totals.claimed++;
    else if(r.status === 'expired') totals.expired++;
    const amt = Number(r.amount)||0;
    totals.totalValue += amt;
    if(r.status === 'open'){
      totals.openValue += amt;
      if(r.deadline){
        const d = new Date(r.deadline);
        const days = Math.round((d - today)/86400000);
        if(days >= 0 && days <= 30) totals.atRisk++;
      }
    }
  });

  container.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Open Funds</div><div class="stat-value">${totals.open}</div><div class="stat-sub">$${totals.openValue.toLocaleString()} on the table</div></div>
      <div class="card stat-card" style="${totals.atRisk?'border-left:3px solid var(--accent);':''}"><div class="stat-label">Deadline ≤30d</div><div class="stat-value" style="color:${totals.atRisk?'var(--accent)':'var(--text)'};">${totals.atRisk}</div><div class="stat-sub">Action needed</div></div>
      <div class="card stat-card"><div class="stat-label">Claimed YTD</div><div class="stat-value">${totals.claimed}</div><div class="stat-sub">Money recovered</div></div>
      <div class="card stat-card"><div class="stat-label">Total Tracked</div><div class="stat-value">$${(totals.totalValue/1000).toFixed(1)}K</div><div class="stat-sub">All statuses</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Co-op / Rebate Funds</span>
        <button class="btn btn-accent btn-sm" onclick="openCoopEdit(null)">+ Add fund</button>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Period</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${COOP_FUNDS.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">No funds tracked yet. Click "+ Add fund" to log a rebate or co-op claim.</td></tr>` : COOP_FUNDS.map(r => {
              const v = VD.find(x => String(x.id) === String(r.vendor_id));
              const vendorName = v ? v.name : `#${r.vendor_id}`;
              const days = r.deadline ? Math.round((new Date(r.deadline) - today)/86400000) : null;
              const deadlineCell = r.deadline ? `<span class="mono sm" style="color:${days!==null && days<=30 && r.status==='open' ? 'var(--accent)' : 'var(--text-2)'};">${r.deadline}${days!==null ? ` <span style="font-size:10px;color:var(--text-3);">(${days>=0?days+'d':'overdue'})</span>` : ''}</span>` : '<span class="muted sm">—</span>';
              const statusBadge = {open:'bg-yellow', claimed:'bg-green', expired:'bg-red', rejected:'bg-gray'}[r.status] || 'bg-gray';
              const canEditCoop = CU && ['Owner','Admin','Manager'].includes(CU.role);
              const coopStatusOpts = ['open','claimed','expired','rejected'];
              const coopStatusCell = canEditCoop
                ? `<td><select data-id="${r.id}" data-field="status" data-orig="${esc(r.status)}" onchange="commitCoopCellSelect(this)" style="font-size:11px;padding:3px 6px;border:1px solid var(--border-light);border-radius:4px;background:transparent;font-family:inherit;cursor:pointer;">${coopStatusOpts.map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></td>`
                : `<td><span class="badge ${statusBadge}">${esc(r.status)}</span></td>`;
              return `<tr>
                <td style="font-weight:600;cursor:pointer;color:var(--accent);" onclick="if(${v?'true':'false'})openVendorDetail(${v?v.id:'null'});">${esc(vendorName)}</td>
                <td><span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(r.fund_type)}</span></td>
                <td class="mono fw6">${r.amount!=null ? '$'+Number(r.amount).toLocaleString() : '—'}</td>
                <td class="sm">${esc(r.earned_period||'')}</td>
                <td>${deadlineCell}</td>
                ${coopStatusCell}
                <td class="sm" style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.notes||'')}">${esc(r.notes||'')}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="openCoopEdit('${r.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openCoopEdit(fundId){
  const rec = fundId ? COOP_FUNDS.find(r => r.id === fundId) : {fund_type:'rebate', currency:'USD', status:'open'};
  if(!rec){ toast('Fund not found','err'); return; }
  const isNew = !fundId;
  const vendorOptions = VD.filter(v => !v.inactive).sort((a,b)=>a.name.localeCompare(b.name)).map(v =>
    `<option value="${v.id}" ${String(rec.vendor_id)===String(v.id)?'selected':''}>${esc(v.name)}</option>`
  ).join('');
  openModal((isNew?'Add':'Edit')+' Fund', `
    <div class="fg"><label>Vendor</label>
      <select id="cf-vendor"><option value="">— pick a vendor —</option>${vendorOptions}</select>
    </div>
    <div class="fg"><label>Fund Type</label>
      <select id="cf-type">
        ${['rebate','co-op','mdf','spiff','other'].map(t => `<option value="${t}" ${rec.fund_type===t?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Amount ($)</label><input id="cf-amount" type="number" step="0.01" value="${rec.amount||''}"></div>
      <div class="fcol field"><label>Earned Period</label><input id="cf-period" placeholder="2025 Q4" value="${esc(rec.earned_period||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Deadline</label><input id="cf-deadline" type="date" value="${rec.deadline||''}"></div>
      <div class="fcol field"><label>Status</label>
        <select id="cf-status">
          ${['open','claimed','expired','rejected'].map(s => `<option value="${s}" ${rec.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="fg"><label>Notes</label><textarea id="cf-notes" rows="2">${esc(rec.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew ? `<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCoopFund('${rec.id}')">Delete</button>` : ''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveCoopFund(${isNew?'null':`'${rec.id}'`})">Save</button>
    </div>
  `);
}

async function saveCoopFund(fundId){
  const vendorId = $('cf-vendor')?.value;
  if(!vendorId){ toast('Pick a vendor first','err'); return; }
  const rec = {
    id: fundId || undefined,
    vendor_id: vendorId,
    fund_type: $('cf-type').value,
    amount: $('cf-amount').value,
    earned_period: $('cf-period').value,
    deadline: $('cf-deadline').value || null,
    status: $('cf-status').value,
    notes: $('cf-notes').value
  };
  const saved = await sbSaveCoopFund(rec);
  if(!saved){ toast('Save failed','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = COOP_FUNDS.findIndex(r => r.id === saved.id);
    if(idx >= 0) COOP_FUNDS[idx] = saved; else COOP_FUNDS.unshift(saved);
  } else {
    await sbLoadCoopFunds();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(fundId?'coop_edit':'coop_create', 'vendors', {fund_id: fundId||saved?.id, vendor_id: vendorId, type: rec.fund_type, status: rec.status});
  closeModal();
  renderVendors($('pg-content'));
  toast('Fund '+(fundId?'updated':'added'), 'ok');
}

async function deleteCoopFund(id){
  if(!confirm('Delete this fund record?')) return;
  await sbDeleteCoopFund(id);
  COOP_FUNDS = COOP_FUNDS.filter(r => r.id !== id);
  if(typeof sbAuditLog==='function') sbAuditLog('coop_delete', 'vendors', {fund_id: id});
  closeModal();
  renderVendors($('pg-content'));
  toast('Fund deleted', 'ok');
}
