// ── VENDOR SCORING MODULE (extracted from index.html at v6.11.1) ──
register({ name: 'vendor_scoring', provides: ['sbLoadCoopFunds','sbSaveCoopFund','sbDeleteCoopFund','renderCoopTracker','sbLoadQuotes','sbSaveQuote','sbDeleteQuote','sbLoadVendorScores','sbSaveVendorScore','sbLoadChangelog','sbAppendChangelog','sbLoadParents','getVendorParent','getSisterVendors','COOP_FUNDS'], consumes: ['sbFetch','sbConfigured','CU','SUPABASE_URL','getVPCats'] });

// ── CO-OP / REBATE TRACKER (Track 2.3, coop_tracker table) ──
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

// ── QUOTES (Track 1.2, quotes + quote_lines tables) ──
// Quote shape stays {id (=number), date, customer, contact, project, type,
// sqft, budget, notes, lineItems, total}. JS id field maps to schema.number.
// Schema also has uuid PK; we look it up via number for child line writes.

async function sbLoadQuotes(){
  if(!sbConfigured()) return false;
  try{
    const headers = await sbFetch('/quotes?select=id,number,customer_name,project_name,status,subtotal,total,notes,created_at&order=created_at.desc&limit=500');
    if(!Array.isArray(headers)) return 0;
    if(!headers.length){ QUOTES=[]; return 0; }
    const ids = headers.map(h => h.id);
    const linesUrl = `/quote_lines?select=quote_id,line_no,vendor_id,vendor_name,description,qty,unit_price,ext_price,notes&quote_id=in.(${ids.join(',')})`;
    const lines = await sbFetch(linesUrl);
    const linesByQuote = {};
    (lines||[]).forEach(l => {
      (linesByQuote[l.quote_id] = linesByQuote[l.quote_id] || []).push(l);
    });
    QUOTES = headers.map(h => {
      let extra = {};
      try { extra = h.notes ? JSON.parse(h.notes) : {}; } catch { extra = {}; }
      const li = (linesByQuote[h.id]||[]).sort((a,b)=>a.line_no-b.line_no).map(l => ({
        id: l.line_no, desc: l.description || '', qty: Number(l.qty)||0,
        price: Number(l.unit_price)||0, cat: l.notes || 'LED Fixtures',
        vendorId: l.vendor_id, vendorName: l.vendor_name
      }));
      return {
        id: h.number || ('QT-' + String(QUOTE_ID++).padStart(4,'0')),
        _uuid: h.id,
        date: h.created_at ? new Date(h.created_at).toLocaleDateString() : '',
        customer: h.customer_name || '',
        contact: extra.contact || '',
        project: h.project_name || '',
        type: extra.type || '',
        sqft: extra.sqft || '',
        budget: extra.budget || '',
        notes: extra.note || '',
        lineItems: li,
        total: Number(h.total)||0
      };
    });
    // Bump QUOTE_ID past the highest seen number
    QUOTES.forEach(q => {
      const m = /QT-(\d+)/.exec(q.id);
      if(m){ const n = parseInt(m[1],10); if(n >= QUOTE_ID) QUOTE_ID = n+1; }
    });
    console.log(`[quotes] Loaded ${QUOTES.length} quotes`);
    return QUOTES.length;
  }catch(e){ console.warn('[sb] Load quotes failed:', e.message); return false; }
}

async function sbSaveQuote(q){
  if(!sbConfigured()) return false;
  try{
    const subtotal = (q.lineItems||[]).reduce((s,l)=>s + (l.qty*l.price), 0);
    const extra = {contact: q.contact||'', type: q.type||'', sqft: q.sqft||'', budget: q.budget||'', note: q.notes||''};
    const headerBody = {
      number: q.id,
      customer_name: q.customer || null,
      project_name: q.project || null,
      status: 'draft',
      subtotal, tax: 0, total: q.total || subtotal,
      notes: JSON.stringify(extra)
    };
    // Upsert header by number; need the UUID back to write lines.
    const headerRes = await sbFetch('/quotes?on_conflict=number', {
      method: 'POST',
      headers: {'Prefer':'resolution=merge-duplicates,return=representation'},
      body: JSON.stringify(headerBody)
    });
    const uuid = Array.isArray(headerRes) && headerRes[0] ? headerRes[0].id : q._uuid;
    if(!uuid) throw new Error('No UUID returned from quotes upsert');
    q._uuid = uuid;
    // Replace all line items: delete then insert.
    await sbFetch(`/quote_lines?quote_id=eq.${uuid}`, {
      method: 'DELETE',
      headers: {'Prefer':'return=minimal'}
    });
    const lineRows = (q.lineItems||[]).map((l,i) => ({
      quote_id: uuid,
      line_no: i + 1,
      vendor_id: l.vendorId || null,
      vendor_name: l.vendorName || null,
      description: l.desc || null,
      qty: Number(l.qty)||0,
      unit_price: Number(l.price)||0,
      ext_price: (Number(l.qty)||0) * (Number(l.price)||0),
      notes: l.cat || null
    }));
    if(lineRows.length){
      await sbFetch('/quote_lines', {
        method: 'POST',
        headers: {'Prefer':'return=minimal'},
        body: JSON.stringify(lineRows)
      });
    }
    return true;
  }catch(e){ console.warn('[sb] Save quote failed:', e.message); return false; }
}

async function sbDeleteQuote(numberId){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/quotes?number=eq.${encodeURIComponent(numberId)}`, {
      method: 'DELETE',
      headers: {'Prefer':'return=minimal'}
    });
    return true;
  }catch(e){ console.warn('[sb] Delete quote failed:', e.message); return false; }
}

// ── VENDOR OVERRIDES (Track 2.2, vendor_overrides table) ──
// Editable vendor metadata: notes, custom_rep, tier_override, inactive flag.
// Loaded on startup; merged into VD[i] (override fields take precedence over VD_RAW).

async function sbLoadVendorOverrides(){
  if(!sbConfigured()) return false;
  if(typeof VD === 'undefined' || !Array.isArray(VD)) return false;
  try{
    const rows = await sbFetch('/vendor_overrides?select=vendor_id,notes,custom_rep,tier_override,inactive,inactive_reason');
    if(!Array.isArray(rows)) return 0;
    const byId = {};
    VD.forEach(v => { byId[String(v.id)] = v; });
    rows.forEach(r => {
      const v = byId[String(r.vendor_id)];
      if(!v) return;
      if(r.notes != null) v.notes = r.notes;
      if(r.custom_rep) v.rep = r.custom_rep;
      if(r.tier_override) v.tier_override = r.tier_override;
      if(typeof r.inactive === 'boolean') v.inactive = r.inactive;
      if(r.inactive_reason) v.inactive_reason = r.inactive_reason;
    });
    console.log(`[vendor_overrides] Loaded ${rows.length} rows`);
    return rows.length;
  }catch(e){ console.warn('[sb] Load vendor_overrides failed:', e.message); return false; }
}

async function sbSaveVendorOverride(vendorId, patch, updatedBy){
  if(!sbConfigured()) return false;
  if(vendorId===null || vendorId===undefined) return false;
  try{
    const body = Object.assign({
      vendor_id: String(vendorId),
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || 'Unknown'
    }, patch);
    await sbFetch('/vendor_overrides?on_conflict=vendor_id', {
      method: 'POST',
      headers: {'Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify(body)
    });
    return true;
  }catch(e){ console.warn('[sb] Save vendor_override failed:', e.message); return false; }
}

// ── VENDOR SCORE VALUES (Track 1.1, vendor_scores table) ──
// Numeric score values per (vendor, category). Loaded on startup; merges
// into VD[i].scores[catKey] + VD[i]._meta[catKey].j (justification).

async function sbLoadVendorScores(){
  if(!sbConfigured()) return false;
  if(typeof VD === 'undefined' || !Array.isArray(VD)) return false;
  try{
    const PAGE = 1000;
    let offset = 0, all = [];
    while(true){
      const batch = await sbFetch(`/vendor_scores?select=vendor_id,category_key,score,justification,components,updated_at&offset=${offset}&limit=${PAGE}`);
      if(!Array.isArray(batch) || !batch.length) break;
      all = all.concat(batch);
      if(batch.length < PAGE) break;
      offset += PAGE;
    }
    const byId = {};
    VD.forEach(v => { byId[String(v.id)] = v; });
    let touched = new Set();
    all.forEach(r => {
      const v = byId[String(r.vendor_id)];
      if(!v) return;
      v._meta = v._meta || {};
      // Supabase value wins over VD_RAW for any category that has a row.
      if(r.score === null || r.score === undefined){
        // null score row = explicit "no value" — leave VD as-is
      } else {
        v.scores[r.category_key] = Number(r.score);
      }
      const prev = v._meta[r.category_key] || {};
      v._meta[r.category_key] = Object.assign({}, prev, {
        j: r.justification || prev.j,
        components: r.components || prev.components
      });
      touched.add(v.id);
    });
    console.log(`[vendor_scores] Loaded ${all.length} rows for ${touched.size} vendors`);
    return all.length;
  }catch(e){
    console.warn('[sb] Load vendor_scores failed:', e.message);
    return false;
  }
}

// Upsert one (vendor, category) score row. Score may be null (clears the value).
// Justification + components optional.
async function sbSaveVendorScore(vendorId, categoryKey, score, justification, components, updatedBy){
  if(!sbConfigured()) return false;
  if(vendorId===null || vendorId===undefined || !categoryKey) return false;
  try{
    const body = {
      vendor_id: String(vendorId),
      category_key: categoryKey,
      score: (score===null || score===undefined || score==='na') ? null : Number(score),
      justification: justification || null,
      components: components || null,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || 'Unknown'
    };
    await sbFetch('/vendor_scores?on_conflict=vendor_id,category_key', {
      method: 'POST',
      headers: {'Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify(body)
    });
    return true;
  }catch(e){
    console.warn('[sb] Save vendor_score failed:', e.message);
    return false;
  }
}

// Upsert one score-state row. Caller responsible for in-memory _meta update.
async function sbSaveScoreState(vendorId, categoryKey, dataState, verifiedBy){
  if(!sbConfigured()) return false;
  if(vendorId===null || vendorId===undefined || !categoryKey) return false;
  try{
    const nowIso = new Date().toISOString();
    const isVerified = (dataState === 'verified');
    await sbFetch('/vendor_score_states?on_conflict=vendor_id,category_key', {
      method: 'POST',
      headers: {'Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify({
        vendor_id: String(vendorId),
        category_key: categoryKey,
        data_state: dataState,
        verified_at: isVerified ? nowIso : null,
        verified_by: isVerified ? (verifiedBy || 'Unknown') : null,
        updated_at: nowIso
      })
    });
    return true;
  }catch(e){
    console.warn('[sb] Save score state failed:', e.message);
    return false;
  }
}

// Load full changelog from Supabase (newest first).
async function sbLoadChangelog(limit=500){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/vendor_changelog?select=*&order=ts.desc&limit='+limit);
    CHANGELOG = rows.map(r => ({
      ts: r.ts,
      vendor: r.vendor_name || ('#' + r.vendor_id),
      cat: r.field,
      oldVal: r.old_val,
      newVal: r.new_val,
      user: r.user_name
    }));
    console.log(`[sb] Loaded ${CHANGELOG.length} changelog entries`);
    return CHANGELOG.length;
  }catch(e){
    console.warn('[sb] Load changelog failed:', e.message);
    return false;
  }
}

// Append one changelog row to Supabase + in-memory CHANGELOG.
async function sbAppendChangelog(entry){
  CHANGELOG.unshift(entry);
  if(!sbConfigured()) return false;
  try{
    // Find vendor_id from name
    const v = (typeof VD!=='undefined') ? VD.find(x => x.name === entry.vendor) : null;
    await sbFetch('/vendor_changelog', {
      method: 'POST',
      headers: {'Prefer':'return=minimal'},
      body: JSON.stringify({
        ts: entry.ts,
        vendor_id: v?.id || null,
        vendor_name: entry.vendor,
        field: entry.cat,
        old_val: entry.oldVal === null || entry.oldVal === undefined ? null : String(entry.oldVal),
        new_val: entry.newVal === null || entry.newVal === undefined ? null : String(entry.newVal),
        user_name: entry.user
      })
    });
    return true;
  }catch(e){
    console.warn('[sb] Append changelog failed:', e.message);
    return false;
  }
}

// ── PARENT COMPANIES (v6.9) ─────────────────────────────────
// Tables: parent_companies(id uuid, name, type, ...) +
//         vendor_parent_assignments(vendor_id, parent_id, ...)
// PARENT_COMPANIES: array of {id, name, type, notes}
// VENDOR_PARENTS: vendor_id (number) -> parent_id (uuid string)
// PARENT_BY_ID: parent_id (uuid string) -> {id, name, type, notes}
let PARENT_COMPANIES = [];
let VENDOR_PARENTS = {};
let PARENT_BY_ID = {};

async function sbLoadParents(){
  if(!sbConfigured()) return false;
  try{
    const parents = await sbFetch('/parent_companies?select=id,name,type,notes&order=name.asc');
    PARENT_COMPANIES = parents || [];
    PARENT_BY_ID = {};
    PARENT_COMPANIES.forEach(p => { PARENT_BY_ID[p.id] = p; });
    const assigns = await sbFetch('/vendor_parent_assignments?select=vendor_id,parent_id');
    VENDOR_PARENTS = {};
    (assigns || []).forEach(a => { VENDOR_PARENTS[a.vendor_id] = a.parent_id; });
    console.log(`[sb] Loaded ${PARENT_COMPANIES.length} parents, ${Object.keys(VENDOR_PARENTS).length} assignments`);
    return PARENT_COMPANIES.length;
  }catch(e){
    console.warn('[sb] Load parents failed:', e.message);
    return false;
  }
}

// Get parent record for a vendor id, or null if standalone
function getVendorParent(vendorId){
  const pid = VENDOR_PARENTS[vendorId];
  return pid ? PARENT_BY_ID[pid] || null : null;
}

// Get all sister vendors (excluding the source) for a given vendor id.
// Returns array of vendor objects from VD.
function getSisterVendors(vendorId){
  const pid = VENDOR_PARENTS[vendorId];
  if(!pid) return [];
  const sisterIds = Object.keys(VENDOR_PARENTS)
    .filter(vid => VENDOR_PARENTS[vid] === pid && Number(vid) !== Number(vendorId))
    .map(Number);
  if(typeof VD === 'undefined') return [];
  return sisterIds.map(id => VD.find(v => v.id === id)).filter(Boolean);
}


// Pre-populate vendorProductCats from Vendor Profiles sheet (102 vendors mapped)
function applyPrefillVendorCats(){
  if(typeof VD === 'undefined' || !Array.isArray(VD)) return;
  let matched=0;
  Object.keys(PREFILL_VENDOR_CATS).forEach(uname => {
    const v = VD.find(x => (x.name||'').toUpperCase().trim() === uname);
    if(v){ vendorProductCats[v.id] = new Set(PREFILL_VENDOR_CATS[uname]); matched++; }
  });
  return matched;
}



const CAT_COLORS = {'Indoor Lighting':'#e65100','Exterior':'#1565c0','Fans':'#2e7d32','More Categories':'#00695c','Commercial':'#6a1b9a','Controls & Accessories':'#880e4f'};

function renderCatChips(vid, max=3){
  const cats = getVPCats(vid);
  if(!cats.size) return '<span class="na">—</span>';
  const arr = [...cats];
  const shown = arr.slice(0, max);
  const extra = arr.length - max;
  let h = '<div style="display:flex;flex-wrap:wrap;gap:3px;">';
  shown.forEach(k => {
    const top = k.split('>')[0];
    const type = k.split('>')[2] || k.split('>')[1] || top;
    const col = CAT_COLORS[top] || '#666';
    h += `<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${col}18;color:${col};border:1px solid ${col}30;white-space:nowrap;">${type}</span>`;
  });
  if(extra > 0){
    const title = arr.slice(max).map(k=>k.split('>')[2]||k.split('>')[1]).join(', ');
    h += `<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:var(--bg);color:var(--text-3);border:1px solid var(--border);cursor:pointer;" title="${title}">+${extra}</span>`;
  }
  h += '</div>';
  return h;
}

let vCatFilter = '';

function openCategoryEditor(vid, vname, onSave){
  const existing = getVPCats(vid);
  let body = '';
  for(const [cat, subs] of Object.entries(PRODUCT_TAXONOMY)){
    const col = CAT_COLORS[cat]||'#666';
    body += `<div style="break-inside:avoid;margin-bottom:14px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${col};border-bottom:2px solid ${col}40;padding-bottom:4px;margin-bottom:6px;">${cat}</div>`;
    for(const [sub, types] of Object.entries(subs)){
      body += `<div style="font-size:11px;font-weight:600;color:var(--text-2);margin:6px 0 3px 0;">${sub}</div>`;
      types.forEach(tp => {
        const key = `${cat}>${sub}>${tp}`;
        const chk = existing.has(key) ? 'checked' : '';
        body += `<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text);padding:2px 0;cursor:pointer;"><input type="checkbox" value="${key}" ${chk} style="accent-color:${col};cursor:pointer;"> ${tp}</label>`;
      });
    }
    body += `</div>`;
  }
  const overlay = document.createElement('div');
  overlay.id = 'catEditorOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:10px;width:820px;max-width:96vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.2);"><div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;"><div><div style="font-size:13px;font-weight:700;">Product Categories</div><div style="font-size:11px;color:var(--text-3);margin-top:2px;">${vname}</div></div><div style="display:flex;align-items:center;gap:10px;"><span id="catEdCount" style="font-size:11px;color:var(--text-3);">0 selected</span><button class="btn btn-sm btn-accent" id="catEdSave">Save</button><button class="btn btn-sm btn-outline" onclick="document.getElementById('catEditorOverlay').remove()">Cancel</button></div></div><div style="overflow-y:auto;padding:16px 20px;flex:1;columns:3;column-gap:20px;">${body}</div></div>`;
  document.body.appendChild(overlay);
  function updateCount(){ document.getElementById('catEdCount').textContent = overlay.querySelectorAll('input:checked').length + ' selected'; }
  overlay.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', updateCount));
  updateCount();
  document.getElementById('catEdSave').onclick = () => {
    const sel = new Set();
    overlay.querySelectorAll('input:checked').forEach(cb => sel.add(cb.value));
    // Compute diff for changelog
    const oldArr = [...(getVPCats(vid)||new Set())].sort();
    const newArr = [...sel].sort();
    const changed = oldArr.length !== newArr.length || oldArr.some((x,i)=>x!==newArr[i]);
    setVPCats(vid, sel);
    if(changed){
      // Log to changelog (also persists to Supabase via sbAppendChangelog)
      if(typeof logChange==='function'){
        logChange(vname, 'Categories', oldArr.join(', ')||'(none)', newArr.join(', ')||'(none)');
      }
      // Persist categories to Supabase (no-op if not configured)
      if(typeof sbSaveCategories==='function'){
        sbSaveCategories(vid, sel, (typeof CU!=='undefined' && CU?.name) || 'Unknown')
          .then(ok => { if(ok && typeof toast==='function') toast('Categories saved','ok'); });
      }
    }
    overlay.remove();
    if(onSave) onSave();
  };
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

function totalRawScore(scores){
  let sum=0, max=0;
  CAT_DEFS.forEach(c => { const s=scores[c.key]; if(typeof s==='number'){sum+=s;max+=10;} });
  return max > 0 ? {sum:Math.round(sum*10)/10, max} : null;
}

