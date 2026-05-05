// ── 5.8 SHOWROOM DISPLAY MANAGEMENT (showroom_displays table — see sql/M25_showroom_displays_schema.sql) ──
// Tracks vendor display programs: what's on display, when it was installed,
// when the program agreement ends, participation cost vs co-op funded, retail
// value of the SKUs on display, and contract obligations.

let SHOWROOM_DISPLAYS = [];
let sdFilter = {q:'', status:'', vendor:''};

async function sbLoadShowroomDisplays(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/showroom_displays?select=id,vendor_id,vendor_name,display_name,location,status,install_date,expires_date,removed_date,participation_cost,coop_value,retail_value,sku_list,contract_terms,notes,related_coop_id,created_at,updated_at&order=expires_date.asc.nullslast,updated_at.desc&limit=500');
    SHOWROOM_DISPLAYS = Array.isArray(rows) ? rows : [];
    console.log(`[showroom_displays] Loaded ${SHOWROOM_DISPLAYS.length} displays`);
    return SHOWROOM_DISPLAYS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[showroom_displays] table not yet created — run sql/M25_showroom_displays_schema.sql');
    } else {
      console.warn('[sb] Load showroom_displays failed:', e.message);
    }
    return false;
  }
}

async function sbSaveShowroomDisplay(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      vendor_id: rec.vendor_id || null,
      vendor_name: rec.vendor_name || null,
      display_name: rec.display_name,
      location: rec.location || null,
      status: rec.status || 'active',
      install_date: rec.install_date || null,
      expires_date: rec.expires_date || null,
      removed_date: rec.removed_date || (rec.status === 'removed' ? new Date().toISOString().slice(0,10) : null),
      participation_cost: rec.participation_cost == null || rec.participation_cost === '' ? null : Number(rec.participation_cost),
      coop_value: rec.coop_value == null || rec.coop_value === '' ? null : Number(rec.coop_value),
      retail_value: rec.retail_value == null || rec.retail_value === '' ? null : Number(rec.retail_value),
      sku_list: rec.sku_list || null,
      contract_terms: rec.contract_terms || null,
      notes: rec.notes || null,
      related_coop_id: rec.related_coop_id || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/showroom_displays?on_conflict=id' : '/showroom_displays';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save showroom_display failed:', e.message); return false; }
}

async function sbDeleteShowroomDisplay(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/showroom_displays?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete showroom_display failed:', e.message); return false; }
}

function showrooms(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openShowroomEdit(null)">+ New Display</button>`;
  renderShowroomDisplays(el);
}

function renderShowroomDisplays(el){
  const today = new Date(); today.setHours(0,0,0,0);
  const counts = {planned:0, installed:0, active:0, expiring:0, expired:0, removed:0};
  let totalRetail = 0, totalCost = 0, totalCoop = 0, expiringSoon = 0;
  SHOWROOM_DISPLAYS.forEach(d => {
    counts[d.status] = (counts[d.status]||0)+1;
    const isLive = ['planned','installed','active','expiring'].includes(d.status);
    if(isLive){
      totalRetail += Number(d.retail_value)||0;
      totalCost += Number(d.participation_cost)||0;
      totalCoop += Number(d.coop_value)||0;
    }
    if(d.expires_date && isLive){
      const e = new Date(d.expires_date);
      const days = Math.round((e - today)/86400000);
      if(days >= 0 && days <= 60) expiringSoon++;
    }
  });

  const q = (sdFilter.q||'').toLowerCase();
  const filtered = SHOWROOM_DISPLAYS.filter(d => {
    if(sdFilter.status && d.status !== sdFilter.status) return false;
    if(sdFilter.vendor && d.vendor_name !== sdFilter.vendor) return false;
    if(q){
      const hay = `${d.display_name||''} ${d.location||''} ${d.vendor_name||''} ${d.notes||''} ${(d.sku_list||[]).join(' ')}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    const order = {expiring:0, active:1, installed:2, planned:3, expired:4, removed:5};
    const so = (order[a.status]??9) - (order[b.status]??9);
    if(so) return so;
    const ae = a.expires_date ? new Date(a.expires_date).getTime() : Infinity;
    const be = b.expires_date ? new Date(b.expires_date).getTime() : Infinity;
    return ae - be;
  });

  const vendors = [...new Set(SHOWROOM_DISPLAYS.map(d => d.vendor_name).filter(Boolean))].sort();

  const canImport = CU && (CU.role === 'Owner' || CU.role === 'Admin' || CU.role === 'Manager' || CU.role === 'Sales');
  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Live Displays</div><div class="stat-value">${(counts.active||0)+(counts.installed||0)+(counts.expiring||0)}</div><div class="stat-sub">${counts.planned||0} planned · ${counts.expired||0} expired · ${counts.removed||0} removed</div></div>
      <div class="card stat-card"${expiringSoon?` style="border-left:3px solid var(--yellow);"`:''}><div class="stat-label">Expiring ≤60d</div><div class="stat-value" style="color:${expiringSoon?'var(--yellow)':'var(--text)'};">${expiringSoon}</div><div class="stat-sub">Renew or remove</div></div>
      <div class="card stat-card"><div class="stat-label">Retail Value</div><div class="stat-value">$${(totalRetail/1000).toFixed(1)}K</div><div class="stat-sub">Live SKUs on floor</div></div>
      <div class="card stat-card"><div class="stat-label">Net Cost</div><div class="stat-value">$${((totalCost-totalCoop)/1000).toFixed(1)}K</div><div class="stat-sub">$${(totalCost/1000).toFixed(1)}K paid · $${(totalCoop/1000).toFixed(1)}K co-op</div></div>
    </div>
    ${canImport ? `<div class="card mb16">
      <div class="card-hd"><span class="card-title">Import CSV</span></div>
      <div style="padding:14px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;">
        <input type="file" accept=".csv,text/csv" style="font-size:12px;" onchange="onShowroomFilePick(this)">
        <button class="btn btn-outline btn-sm" onclick="openShowroomCsvPaste()">Or paste CSV</button>
        <button class="btn btn-outline btn-sm" onclick="downloadShowroomCsvTemplate()">Download template</button>
        <span style="margin-left:auto;color:var(--text-3);">Headers: display_name (req), vendor_name, location, status, install_date, expires_date, participation_cost, coop_value, retail_value, sku_list, notes</span>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Showroom Displays · ${filtered.length}${filtered.length!==SHOWROOM_DISPLAYS.length?` of ${SHOWROOM_DISPLAYS.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="sd-q" placeholder="Search name / vendor / location / SKU…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:240px;" value="${esc(sdFilter.q)}" oninput="sdFilter.q=this.value;clearTimeout(window._sdDeb);window._sdDeb=setTimeout(()=>renderShowroomDisplays($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="sdFilter.status=this.value;renderShowroomDisplays($('pg-content'))">
            <option value="">All statuses</option>
            ${['planned','installed','active','expiring','expired','removed'].map(s=>`<option value="${s}" ${sdFilter.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="sdFilter.vendor=this.value;renderShowroomDisplays($('pg-content'))">
            <option value="">All vendors</option>
            ${vendors.map(v=>`<option value="${esc(v)}" ${sdFilter.vendor===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>Display</th><th>Vendor</th><th>Location</th><th>Status</th><th>Installed</th><th>Expires</th><th>SKUs</th><th>Net Cost</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-3);">${SHOWROOM_DISPLAYS.length===0?'No displays tracked yet. Click "+ New Display" to log one (run M25 SQL first if save fails).':'No displays match the current filter.'}</td></tr>` : filtered.map(d => {
              const sb = {planned:'bg-gray', installed:'bg-blue', active:'bg-green', expiring:'bg-yellow', expired:'bg-red', removed:'bg-gray'}[d.status] || 'bg-gray';
              const expDays = d.expires_date && ['planned','installed','active','expiring'].includes(d.status) ? Math.round((new Date(d.expires_date) - today)/86400000) : null;
              const expCell = d.expires_date ? `<span class="mono sm" style="color:${expDays!==null && expDays<0?'var(--accent)':expDays!==null && expDays<=60?'var(--yellow)':'var(--text-2)'};">${d.expires_date}${expDays!==null?` <span style="font-size:10px;color:var(--text-3);">(${expDays<0?'overdue':expDays+'d'})</span>`:''}</span>` : '<span class="muted">—</span>';
              const skuCount = (d.sku_list||[]).length;
              const net = (Number(d.participation_cost)||0) - (Number(d.coop_value)||0);
              return `<tr style="cursor:pointer;${['expired','removed'].includes(d.status)?'opacity:0.6;':''}" onclick="openShowroomEdit('${d.id}')">
                <td style="font-weight:600;color:var(--accent);">${esc(d.display_name)}</td>
                <td class="sm">${esc(d.vendor_name||'—')}</td>
                <td class="sm">${esc(d.location||'—')}</td>
                <td><span class="badge ${sb}" style="font-size:10px;">${esc(d.status)}</span></td>
                <td class="mono sm">${esc(d.install_date||'')}</td>
                <td>${expCell}</td>
                <td class="sm">${skuCount?skuCount+' SKU'+(skuCount===1?'':'s'):'<span class="muted">—</span>'}</td>
                <td class="mono fw6 sm">${net?'$'+Math.round(net).toLocaleString():'<span class="muted">—</span>'}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openShowroomEdit('${d.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openShowroomEdit(displayId){
  const isNew = !displayId;
  const d = isNew ? {status:'planned'} : SHOWROOM_DISPLAYS.find(x => x.id === displayId);
  if(!d){ toast('Display not found','err'); return; }
  const vendorOptions = (typeof VD !== 'undefined') ? VD.filter(v => !v.inactive).slice().sort((a,b)=>a.n.localeCompare(b.n)).map(v => `<option value="${v.id}" data-name="${esc(v.n)}" ${String(d.vendor_id)===String(v.id)?'selected':''}>${esc(v.n)}</option>`).join('') : '';
  const coopOptions = (typeof COOP_FUNDS !== 'undefined' && COOP_FUNDS.length) ? COOP_FUNDS.slice().sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).map(c => {
    const v = (typeof VD !== 'undefined') ? VD.find(x => String(x.id)===String(c.vendor_id)) : null;
    const label = `${v?v.n:c.vendor_id} · ${c.fund_type} · $${Number(c.amount||0).toLocaleString()}`;
    return `<option value="${c.id}" ${d.related_coop_id===c.id?'selected':''}>${esc(label)}</option>`;
  }).join('') : '';
  openModal((isNew?'New':'Edit')+' Showroom Display', `
    <div class="frow">
      <div class="fcol field"><label>Display Name *</label><input id="sd-n" value="${esc(d.display_name||'')}" placeholder="Hinkley Modern Wall, Quoizel Chandelier Bay, etc."></div>
      <div class="fcol field"><label>Status</label>
        <select id="sd-s">${['planned','installed','active','expiring','expired','removed'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Vendor *</label>
        <select id="sd-v"><option value="">— pick —</option>${vendorOptions}</select>
      </div>
      <div class="fcol field"><label>Location</label><input id="sd-loc" value="${esc(d.location||'')}" placeholder="Front showroom, Lamp gallery, etc."></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Install Date</label><input id="sd-id" type="date" value="${esc(d.install_date||'')}"></div>
      <div class="fcol field"><label>Expires Date</label><input id="sd-ed" type="date" value="${esc(d.expires_date||'')}"></div>
      <div class="fcol field"><label>Removed Date</label><input id="sd-rd" type="date" value="${esc(d.removed_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Participation Cost ($)</label><input id="sd-pc" type="number" step="0.01" value="${d.participation_cost!=null?d.participation_cost:''}"></div>
      <div class="fcol field"><label>Co-op Value ($)</label><input id="sd-cv" type="number" step="0.01" value="${d.coop_value!=null?d.coop_value:''}"></div>
      <div class="fcol field"><label>Retail Value ($)</label><input id="sd-rv" type="number" step="0.01" value="${d.retail_value!=null?d.retail_value:''}"></div>
    </div>
    <div class="fg"><label>SKUs on display (comma-separated)</label><input id="sd-sku" value="${esc((d.sku_list||[]).join(', '))}" placeholder="HK-12345, QZ-67890"></div>
    <div class="fg"><label>Linked Co-op Fund (optional)</label>
      <select id="sd-coop"><option value="">— none —</option>${coopOptions}</select>
    </div>
    <div class="fg"><label>Contract Terms / Obligations</label><textarea id="sd-ct" rows="2">${esc(d.contract_terms||'')}</textarea></div>
    <div class="fg"><label>Notes</label><textarea id="sd-notes" rows="2">${esc(d.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteShowroomConfirm('${displayId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveShowroom(${isNew?'null':`'${displayId}'`})">Save</button>
    </div>
  `);
}

async function saveShowroom(displayId){
  const display_name = $('sd-n')?.value?.trim();
  if(!display_name){ toast('Display name required','err'); return; }
  const vId = $('sd-v').value;
  if(!vId){ toast('Vendor required','err'); return; }
  const vName = $('sd-v').options[$('sd-v').selectedIndex]?.getAttribute('data-name') || '';
  const skuListRaw = $('sd-sku').value || '';
  const sku_list = skuListRaw.split(',').map(s=>s.trim()).filter(Boolean);
  const rec = {
    id: displayId || undefined,
    vendor_id: vId,
    vendor_name: vName,
    display_name,
    location: $('sd-loc').value || null,
    status: $('sd-s').value,
    install_date: $('sd-id').value || null,
    expires_date: $('sd-ed').value || null,
    removed_date: $('sd-rd').value || null,
    participation_cost: $('sd-pc').value || null,
    coop_value: $('sd-cv').value || null,
    retail_value: $('sd-rv').value || null,
    sku_list: sku_list.length ? sku_list : null,
    related_coop_id: $('sd-coop').value || null,
    contract_terms: $('sd-ct').value || null,
    notes: $('sd-notes').value || null
  };
  const saved = await sbSaveShowroomDisplay(rec);
  if(!saved){ toast('Save failed — table may not exist (run M25 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = SHOWROOM_DISPLAYS.findIndex(x => x.id === saved.id);
    if(idx >= 0) SHOWROOM_DISPLAYS[idx] = saved; else SHOWROOM_DISPLAYS.unshift(saved);
  } else {
    await sbLoadShowroomDisplays();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(displayId?'showroom_edit':'showroom_create', 'showroom_displays', {display_id: displayId||saved?.id, vendor_id: vId, status: rec.status});
  closeModal();
  renderShowroomDisplays($('pg-content'));
  toast('Display '+(displayId?'updated':'added'),'ok');
}

async function deleteShowroomConfirm(displayId){
  const d = SHOWROOM_DISPLAYS.find(x => x.id === displayId);
  if(!d) return;
  if(!confirm(`Delete display "${d.display_name}"?`)) return;
  await sbDeleteShowroomDisplay(displayId);
  SHOWROOM_DISPLAYS = SHOWROOM_DISPLAYS.filter(x => x.id !== displayId);
  if(typeof sbAuditLog==='function') sbAuditLog('showroom_delete', 'showroom_displays', {display_id: displayId, name: d.display_name});
  closeModal();
  renderShowroomDisplays($('pg-content'));
  toast('Display deleted','ok');
}

// ── BULK CSV IMPORT (v6.10.45) — uses csvImportFlow helper ──
async function sbBulkSaveShowroomDisplays(rows){
  if(!sbConfigured()) return false;
  if(!Array.isArray(rows) || !rows.length) return 0;
  try{
    const now = new Date().toISOString();
    const payload = rows.map(r => ({
      vendor_id: r.vendor_id || null,
      vendor_name: r.vendor_name || null,
      display_name: r.display_name,
      location: r.location || null,
      status: r.status || 'active',
      install_date: r.install_date || null,
      expires_date: r.expires_date || null,
      removed_date: r.status === 'removed' ? (r.removed_date || now.slice(0,10)) : null,
      participation_cost: r.participation_cost,
      coop_value: r.coop_value,
      retail_value: r.retail_value,
      sku_list: r.sku_list || null,
      contract_terms: r.contract_terms || null,
      notes: r.notes || null,
      updated_at: now
    }));
    const res = await sbFetch('/showroom_displays', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(payload)});
    if(Array.isArray(res)) return res.length;
    return payload.length;
  }catch(e){ console.warn('[sb] Bulk save showroom_displays failed:', e.message); return false; }
}

// Register the helper-driven CSV import handlers (window.openShowroomCsvPaste etc.)
csvImportFlow({
  key: 'showroom',
  label: 'Display',
  labelPlural: 'Displays',
  templateName: 'showroom_displays_template',
  tableName: 'showroom_displays',
  pasteHelp: 'display_name,vendor_name,location,status,install_date,...',
  templateRows: [
    ['display_name','vendor_name','location','status','install_date','expires_date','participation_cost','coop_value','retail_value','sku_list','notes'],
    ['Hudson Valley Pendant Wall','Hudson Valley Lighting','Showroom-Front-Wall','active','2026-03-01','2027-03-01','450','300','1850','HVL-1234,HVL-5678','Featured display, prime visibility'],
    ['Hinkley Outdoor Vignette','Hinkley','Outdoor-Patio','installed','2026-04-15','','800','500','3200','HIN-OUT-100,HIN-OUT-101','']
  ],
  aliasMap: {
    'display_name':'display_name', 'name':'display_name', 'display':'display_name',
    'vendor_name':'vendor_name', 'vendor':'vendor_name', 'manufacturer':'vendor_name', 'brand':'vendor_name',
    'location':'location', 'where':'location', 'placement':'location',
    'status':'status', 'state':'status',
    'install_date':'install_date', 'installed':'install_date', 'install':'install_date',
    'expires_date':'expires_date', 'expires':'expires_date', 'expiry':'expires_date', 'end_date':'expires_date',
    'participation_cost':'participation_cost', 'cost':'participation_cost', 'paid':'participation_cost',
    'coop_value':'coop_value', 'co-op':'coop_value', 'co_op':'coop_value', 'coop':'coop_value',
    'retail_value':'retail_value', 'retail':'retail_value', 'msrp':'retail_value',
    'sku_list':'sku_list', 'skus':'sku_list', 'sku':'sku_list', 'items':'sku_list',
    'contract_terms':'contract_terms', 'terms':'contract_terms',
    'notes':'notes', 'note':'notes', 'comment':'notes', 'comments':'notes'
  },
  requiredFields: ['display_name'],
  normalizers: {
    status: csvEnumNormalizer(['planned','installed','active','expiring','expired','removed'], 'active', 'status'),
    participation_cost: csvNumberNormalizer(0),
    coop_value: csvNumberNormalizer(0),
    retail_value: csvNumberNormalizer(0)
  },
  postProcess: (obj, ctx) => {
    // Resolve vendor_name → vendor_id when possible
    if(obj.vendor_name && typeof VD !== 'undefined'){
      const match = VD.find(v => v?.n && v.n.toLowerCase().trim() === obj.vendor_name.toLowerCase().trim());
      if(match) obj.vendor_id = String(match.id);
      else {
        if(!ctx.trackers.vendor) ctx.trackers.vendor = { unmatched: new Set() };
        ctx.trackers.vendor.unmatched.add(obj.vendor_name);
      }
    }
  },
  dupCheck: (obj) => SHOWROOM_DISPLAYS.some(d => d.display_name && d.display_name.toLowerCase().trim() === obj.display_name.toLowerCase().trim()),
  previewColumns: [
    { label: 'Display', cell: r => `<span style="font-weight:500;">${esc(r.display_name||'')}</span>` },
    { label: 'Vendor', cell: r => esc(r.vendor_name||'') + (r.vendor_id ? ' <span class="muted sm">·linked</span>' : '') },
    { label: 'Location', cell: r => `<span class="sm">${esc(r.location||'')}</span>` },
    { label: 'Status', cell: r => `<span class="badge bg-gray">${esc(r.status||'')}</span>` },
    { label: 'Cost', cell: r => `<span class="mono sm">${r.participation_cost!=null?'$'+Number(r.participation_cost).toFixed(0):''}</span>` }
  ],
  bulkSave: sbBulkSaveShowroomDisplays,
  onSuccess: async () => {
    await sbLoadShowroomDisplays();
    renderShowroomDisplays($('pg-content'));
  },
  auditEvent: 'showroom_displays_import'
});
