// ── 5.5 TRADE PARTNER NETWORK (trade_partners table — see sql/M24_trade_partners_warranty_schema.sql) ──
// External designers / contractors / architects / builders / installers / electricians.
// Distinct from `customers` (who buy from us) — these are professionals we collaborate with.

let TRADE_PARTNERS = [];
let tpFilter = {q:'', type:'', status:''};

async function sbLoadTradePartners(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/trade_partners?select=id,name,type,company,email,phone,website,address,trade_license,preferred_terms,rating,notes,status,tags,related_customer_id,first_engaged,last_engaged,created_at,updated_at&order=name.asc&limit=1000');
    TRADE_PARTNERS = Array.isArray(rows) ? rows : [];
    console.log(`[trade_partners] Loaded ${TRADE_PARTNERS.length} partners`);
    return TRADE_PARTNERS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[trade_partners] table not yet created — run sql/M24_trade_partners_warranty_schema.sql');
    } else {
      console.warn('[sb] Load trade_partners failed:', e.message);
    }
    return false;
  }
}

async function sbSaveTradePartner(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      name: rec.name,
      type: rec.type || null,
      company: rec.company || null,
      email: rec.email || null,
      phone: rec.phone || null,
      website: rec.website || null,
      address: rec.address || null,
      trade_license: rec.trade_license || null,
      preferred_terms: rec.preferred_terms || null,
      rating: rec.rating == null || rec.rating === '' ? null : Number(rec.rating),
      notes: rec.notes || null,
      status: rec.status || 'active',
      tags: rec.tags || null,
      related_customer_id: rec.related_customer_id || null,
      first_engaged: rec.first_engaged || null,
      last_engaged: rec.last_engaged || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/trade_partners?on_conflict=id' : '/trade_partners';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save trade_partner failed:', e.message); return false; }
}

async function sbDeleteTradePartner(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/trade_partners?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete trade_partner failed:', e.message); return false; }
}

// Single-row PATCH for inline edits (v6.10.50)
async function sbUpdateTradePartnerField(id, field, value){
  if(!sbConfigured() || !id || !field) return false;
  const allowed = ['status','rating','type','email','phone','company','notes','tags','preferred_terms'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value, updated_at: new Date().toISOString() };
    const res = await sbFetch(`/trade_partners?id=eq.${encodeURIComponent(id)}`, {
      method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update trade_partner field failed:', e.message); return false; }
}

async function commitTradePartnerCell(input){
  if(!input) return;
  const id = input.dataset.id;
  const field = input.dataset.field;
  const orig = input.dataset.orig || '';
  const isNumber = input.dataset.kind === 'number';
  const valStr = (input.value || '').trim();
  if(input.style){ input.style.background = 'transparent'; input.style.borderColor = 'transparent'; }
  if(valStr === orig) return;
  let next = null;
  if(valStr !== ''){
    if(isNumber){
      const n = Number(valStr);
      if(isNaN(n) || n < 0 || n > 10){ input.value = orig; toast('Invalid rating (0-10) — reverted','warn'); return; }
      next = n;
    } else {
      next = valStr;
    }
  }
  const item = TRADE_PARTNERS.find(p => p.id === id);
  if(!item){ input.value = orig; toast('Row not found','err'); return; }
  const prev = item[field];
  item[field] = next;
  input.dataset.orig = next == null ? '' : String(next);
  const res = await sbUpdateTradePartnerField(id, field, next);
  if(res === false){
    item[field] = prev;
    input.value = orig;
    input.dataset.orig = orig;
    toast(`Save failed — ${field} reverted`,'err');
    return;
  }
  if(typeof sbAuditLog==='function') sbAuditLog(`tp_${field}_edit`, 'trade_partners', {partner_id: id, field, from: prev, to: next});
  toast(`${item.name||'Partner'} · ${field}: ${prev??'—'} → ${next??'—'}`, 'ok');
  // Re-render so badge/rating styling updates with the new value (especially for status select)
  if(field === 'status' || field === 'rating') renderTradePartners($('pg-content'));
}

async function sbBulkSaveTradePartners(rows){
  if(!sbConfigured()) return false;
  if(!Array.isArray(rows) || !rows.length) return 0;
  try{
    const now = new Date().toISOString();
    const payload = rows.map(r => ({
      name: r.name,
      type: r.type || null,
      company: r.company || null,
      email: r.email || null,
      phone: r.phone || null,
      website: r.website || null,
      address: r.address || null,
      trade_license: r.trade_license || null,
      preferred_terms: r.preferred_terms || null,
      rating: r.rating == null || r.rating === '' ? null : Number(r.rating),
      notes: r.notes || null,
      status: r.status || 'active',
      tags: r.tags || null,
      updated_at: now
    }));
    const res = await sbFetch('/trade_partners', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(payload)});
    if(Array.isArray(res)) return res.length;
    return payload.length;
  }catch(e){ console.warn('[sb] Bulk save trade_partners failed:', e.message); return false; }
}

function tradepartners(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openTradePartnerEdit(null)">+ New Partner</button>`;
  renderTradePartners(el);
}

function renderTradePartners(el){
  // Stats
  const counts = {active:0, inactive:0, prospect:0};
  const byType = {};
  let avgRating = null, ratedCount = 0;
  TRADE_PARTNERS.forEach(p => {
    counts[p.status] = (counts[p.status]||0)+1;
    if(p.type) byType[p.type] = (byType[p.type]||0)+1;
    if(p.rating != null){ avgRating = (avgRating||0) + Number(p.rating); ratedCount++; }
  });
  if(ratedCount) avgRating = avgRating / ratedCount;

  // Filter
  const q = (tpFilter.q||'').toLowerCase();
  const filtered = TRADE_PARTNERS.filter(p => {
    if(tpFilter.type && p.type !== tpFilter.type) return false;
    if(tpFilter.status && p.status !== tpFilter.status) return false;
    if(q){
      const hay = `${p.name||''} ${p.company||''} ${p.email||''} ${p.phone||''} ${p.notes||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    if(a.status !== b.status){
      const order = {active:0, prospect:1, inactive:2};
      return (order[a.status]??9) - (order[b.status]??9);
    }
    return (a.name||'').localeCompare(b.name||'');
  });

  const canImport = CU && (CU.role === 'Owner' || CU.role === 'Admin' || CU.role === 'Manager' || CU.role === 'Sales');
  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Active Partners</div><div class="stat-value">${counts.active||0}</div><div class="stat-sub">${counts.prospect||0} prospect · ${counts.inactive||0} inactive</div></div>
      <div class="card stat-card"><div class="stat-label">Designers</div><div class="stat-value">${byType.designer||0}</div><div class="stat-sub">+ ${byType.architect||0} architect · ${byType.builder||0} builder</div></div>
      <div class="card stat-card"><div class="stat-label">Trades</div><div class="stat-value">${(byType.contractor||0)+(byType.installer||0)+(byType.electrician||0)}</div><div class="stat-sub">${byType.contractor||0} contractor · ${byType.installer||0} installer · ${byType.electrician||0} electrician</div></div>
      <div class="card stat-card"${avgRating!=null && avgRating>=8?` style="border-left:3px solid var(--green);"`:''}><div class="stat-label">Avg Rating</div><div class="stat-value">${avgRating!=null?avgRating.toFixed(1):'—'}</div><div class="stat-sub">Across ${ratedCount} rated</div></div>
    </div>
    ${canImport ? `<div class="card mb16">
      <div class="card-hd"><span class="card-title">Import CSV</span></div>
      <div style="padding:14px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;">
        <input type="file" id="tp-file" accept=".csv,text/csv" style="font-size:12px;" onchange="onTpFilePick(this)">
        <button class="btn btn-outline btn-sm" onclick="openTpCsvPaste()">Or paste CSV</button>
        <button class="btn btn-outline btn-sm" onclick="downloadTpCsvTemplate()">Download template</button>
        <span style="margin-left:auto;color:var(--text-3);">Headers: name (req), type, company, email, phone, website, address, rating, notes, status, tags</span>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Trade Partners · ${filtered.length}${filtered.length!==TRADE_PARTNERS.length?` of ${TRADE_PARTNERS.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="tp-q" placeholder="Search name / company / email…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(tpFilter.q)}" oninput="tpFilter.q=this.value;clearTimeout(window._tpDeb);window._tpDeb=setTimeout(()=>renderTradePartners($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="tpFilter.type=this.value;renderTradePartners($('pg-content'))">
            <option value="">All types</option>
            ${['designer','contractor','architect','builder','installer','electrician','other'].map(t=>`<option value="${t}" ${tpFilter.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="tpFilter.status=this.value;renderTradePartners($('pg-content'))">
            <option value="">All statuses</option>
            ${['active','prospect','inactive'].map(s=>`<option value="${s}" ${tpFilter.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          ${typeof savedFiltersBar==='function'?savedFiltersBar({moduleKey:'tradepartners',currentFilter:tpFilter,applyFn:()=>renderTradePartners($('pg-content')),fields:['q','type','status'],resetState:{q:'',type:'',status:''}}):''}
        </div>
      </div>
      ${typeof bulkSelBar==='function'?bulkSelBar('tradepartners'):''}
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th style="width:30px;">${typeof bulkSelHeaderCheckbox==='function'?bulkSelHeaderCheckbox('tradepartners',filtered.map(x=>x.id)):''}</th><th>Name</th><th>Type</th><th>Company</th><th>Contact</th><th>Rating</th><th>Status</th><th>Last Engaged</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-3);">${TRADE_PARTNERS.length===0?'No trade partners yet. Click "+ New Partner" to add one (run M24 SQL first if save fails).':'No partners match the current filter.'}</td></tr>` : filtered.map(p => {
              const sb = {active:'bg-green', prospect:'bg-blue', inactive:'bg-gray'}[p.status] || 'bg-gray';
              const ratingCell = p.rating != null ? `<span class="mono fw6" style="color:${p.rating>=8?'var(--green)':p.rating>=6?'var(--blue)':'var(--yellow)'};">${Number(p.rating).toFixed(1)}</span>` : '<span class="muted">—</span>';
              const canEditTp = CU && ['Owner','Admin','Manager','Sales'].includes(CU.role);
              const tpStatusOpts = ['active','prospect','inactive'];
              const statusCell = canEditTp
                ? `<td onclick="event.stopPropagation();"><select data-id="${p.id}" data-field="status" data-orig="${esc(p.status)}" onchange="commitTradePartnerCell(this)" style="font-size:11px;padding:3px 6px;border:1px solid var(--border-light);border-radius:4px;background:transparent;font-family:inherit;cursor:pointer;">${tpStatusOpts.map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></td>`
                : `<td><span class="badge ${sb}" style="font-size:10px;">${esc(p.status)}</span></td>`;
              const ratingEditCell = canEditTp
                ? `<td onclick="event.stopPropagation();" style="padding:2px 6px;"><input type="number" min="0" max="10" step="0.1" value="${p.rating!=null?Number(p.rating).toFixed(1):''}" data-id="${p.id}" data-field="rating" data-orig="${p.rating!=null?Number(p.rating).toFixed(1):''}" data-kind="number" onfocus="this.select();this.style.background='var(--surface)';this.style.borderColor='var(--accent)';" onblur="commitTradePartnerCell(this)" onkeydown="if(event.key==='Enter'){this.blur();}else if(event.key==='Escape'){this.value=this.dataset.orig;this.blur();}" style="width:60px;border:1px solid transparent;background:transparent;padding:4px 6px;font-family:inherit;font-size:13px;text-align:right;border-radius:4px;" placeholder="—" title="Click to edit rating (0-10)"></td>`
                : `<td>${ratingCell}</td>`;
              return `<tr style="cursor:pointer;${p.status==='inactive'?'opacity:0.6;':''}" onclick="openTradePartnerEdit('${p.id}')">
                <td onclick="event.stopPropagation();">${typeof bulkSelCheckbox==='function'?bulkSelCheckbox('tradepartners',p.id):''}</td>
                <td style="font-weight:600;color:var(--accent);">${esc(p.name)}</td>
                <td><span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(p.type||'—')}</span></td>
                <td class="sm">${esc(p.company||'—')}</td>
                <td class="sm">${esc(p.email||p.phone||'')}</td>
                ${ratingEditCell}
                ${statusCell}
                <td class="sm mono">${esc(p.last_engaged||'')}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openTradePartnerEdit('${p.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  if(typeof bulkSelRegister === 'function'){
    const isSenior = CU && ['Owner','Admin','Manager'].includes(CU.role);
    bulkSelRegister('tradepartners', isSenior ? [
      {id:'delete', label:'🗑 Delete selected', color:'outline', confirm:'Delete {n} trade partners?', fn: doBulkTradePartnerDelete}
    ] : []);
  }
}

async function doBulkTradePartnerDelete(ids){
  if(!ids?.length) return;
  let ok=0, fail=0;
  for(const id of ids){
    const r = await sbDeleteTradePartner(id);
    if(r) ok++; else fail++;
  }
  TRADE_PARTNERS = TRADE_PARTNERS.filter(p => !ids.includes(p.id));
  if(typeof sbAuditLog==='function') sbAuditLog('trade_partners_bulk_delete', 'trade_partners', {count: ok, failed: fail});
  bulkSelClear('tradepartners');
  renderTradePartners($('pg-content'));
  toast(`Deleted ${ok}${fail?', '+fail+' failed':''}`, fail?'err':'ok');
}

function openTradePartnerEdit(partnerId){
  const isNew = !partnerId;
  const p = isNew ? {type:'designer', status:'active'} : TRADE_PARTNERS.find(x => x.id === partnerId);
  if(!p){ toast('Partner not found','err'); return; }
  const addr = p.address || {};
  const customerOptions = (typeof CUSTOMERS !== 'undefined' && CUSTOMERS.length) ? CUSTOMERS.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(c => `<option value="${c.id}" ${p.related_customer_id===c.id?'selected':''}>${esc(c.name)}</option>`).join('') : '';
  openModal((isNew?'New':'Edit')+' Trade Partner', `
    <div class="frow">
      <div class="fcol field"><label>Name *</label><input id="tp-n" value="${esc(p.name||'')}"></div>
      <div class="fcol field"><label>Type</label>
        <select id="tp-t">
          ${['designer','contractor','architect','builder','installer','electrician','other'].map(t=>`<option value="${t}" ${p.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Company</label><input id="tp-co" value="${esc(p.company||'')}"></div>
      <div class="fcol field"><label>Status</label>
        <select id="tp-s">${['active','prospect','inactive'].map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Email</label><input id="tp-e" type="email" value="${esc(p.email||'')}"></div>
      <div class="fcol field"><label>Phone</label><input id="tp-p" value="${esc(p.phone||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Website</label><input id="tp-web" value="${esc(p.website||'')}" placeholder="https://"></div>
      <div class="fcol field"><label>Trade License #</label><input id="tp-lic" value="${esc(p.trade_license||'')}"></div>
    </div>
    <div class="fg"><label>Address line 1</label><input id="tp-a1" value="${esc(addr.line1||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>City</label><input id="tp-city" value="${esc(addr.city||'')}"></div>
      <div class="fcol field"><label>State</label><input id="tp-state" value="${esc(addr.state||'')}" maxlength="2"></div>
      <div class="fcol field"><label>Zip</label><input id="tp-zip" value="${esc(addr.zip||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Rating (0-10)</label><input id="tp-r" type="number" min="0" max="10" step="0.1" value="${p.rating!=null?p.rating:''}"></div>
      <div class="fcol field"><label>First Engaged</label><input id="tp-fe" type="date" value="${esc(p.first_engaged||'')}"></div>
      <div class="fcol field"><label>Last Engaged</label><input id="tp-le" type="date" value="${esc(p.last_engaged||'')}"></div>
    </div>
    <div class="fg"><label>Linked Customer (if same entity buys from us)</label>
      <select id="tp-cust"><option value="">— none —</option>${customerOptions}</select>
    </div>
    <div class="fg"><label>Preferred Terms (discount, freight, payment, etc.)</label><textarea id="tp-pt" rows="2">${esc(p.preferred_terms||'')}</textarea></div>
    <div class="fg"><label>Notes</label><textarea id="tp-notes" rows="3">${esc(p.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteTradePartnerConfirm('${partnerId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveTradePartner(${isNew?'null':`'${partnerId}'`})">Save</button>
    </div>
  `);
}

async function saveTradePartner(partnerId){
  const name = $('tp-n')?.value?.trim();
  if(!name){ toast('Name required','err'); return; }
  const rec = {
    id: partnerId || undefined,
    name,
    type: $('tp-t').value,
    company: $('tp-co').value || null,
    status: $('tp-s').value,
    email: $('tp-e').value || null,
    phone: $('tp-p').value || null,
    website: $('tp-web').value || null,
    trade_license: $('tp-lic').value || null,
    rating: $('tp-r').value || null,
    first_engaged: $('tp-fe').value || null,
    last_engaged: $('tp-le').value || null,
    address: {
      line1: $('tp-a1').value || null,
      city: $('tp-city').value || null,
      state: $('tp-state').value || null,
      zip: $('tp-zip').value || null
    },
    related_customer_id: $('tp-cust').value || null,
    preferred_terms: $('tp-pt').value || null,
    notes: $('tp-notes').value || null
  };
  const saved = await sbSaveTradePartner(rec);
  if(!saved){ toast('Save failed — table may not exist (run M24 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = TRADE_PARTNERS.findIndex(x => x.id === saved.id);
    if(idx >= 0) TRADE_PARTNERS[idx] = saved; else TRADE_PARTNERS.unshift(saved);
  } else {
    await sbLoadTradePartners();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(partnerId?'tp_edit':'tp_create', 'trade_partners', {partner_id: partnerId||saved?.id, name, type: rec.type});
  closeModal();
  renderTradePartners($('pg-content'));
  toast('Partner '+(partnerId?'updated':'added'),'ok');
}

async function deleteTradePartnerConfirm(partnerId){
  const p = TRADE_PARTNERS.find(x => x.id === partnerId);
  if(!p) return;
  if(!confirm(`Delete trade partner "${p.name}"?`)) return;
  await sbDeleteTradePartner(partnerId);
  TRADE_PARTNERS = TRADE_PARTNERS.filter(x => x.id !== partnerId);
  if(typeof sbAuditLog==='function') sbAuditLog('tp_delete', 'trade_partners', {partner_id: partnerId, name: p.name});
  closeModal();
  renderTradePartners($('pg-content'));
  toast('Partner deleted','ok');
}

// ── BULK CSV IMPORT (v6.10.40) ────────────────────────────
const _TP_TYPES = ['designer','contractor','architect','builder','installer','electrician','other'];
const _TP_STATUSES = ['active','inactive','prospect'];

function downloadTpCsvTemplate(){
  const rows = [
    ['name','type','company','email','phone','website','address','rating','notes','status','tags'],
    ['Jane Designer','designer','Jane Designs LLC','jane@example.com','512-555-0142','https://janedesigns.com','Austin, TX','9','Trade discount 15% · prefers email','active','high-volume,residential'],
    ['Bob Builder','builder','Bob Builds Inc','bob@example.com','512-555-0188','','','7','New construction focus','prospect','']
  ];
  csvDownload(rows, `trade_partners_template_${new Date().toISOString().slice(0,10)}.csv`);
}

function openTpCsvPaste(){
  openModal(`
    <div class="modal-hd"><div class="modal-title">Paste CSV</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>Paste CSV content (first row is headers)</label><textarea id="tp-csv-paste" rows="12" style="width:100%;font-family:monospace;font-size:11px;padding:8px;border:1px solid var(--border);border-radius:6px;" placeholder="name,type,company,email,phone,...
Jane Designer,designer,Jane Designs LLC,jane@example.com,..."></textarea></div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="processTpCsvText($('tp-csv-paste').value)">Parse &amp; Preview</button>
    </div>
  `);
}

function onTpFilePick(input){
  const f = input.files && input.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e => processTpCsvText(e.target.result || '');
  reader.onerror = () => toast('File read failed','err');
  reader.readAsText(f);
}

function processTpCsvText(text){
  if(!text || !text.trim()){ toast('CSV is empty','err'); return; }
  if(typeof parseCsv !== 'function'){ toast('parseCsv helper missing','err'); return; }
  const rows = parseCsv(text);
  if(rows.length < 2){ toast('CSV has no data rows','err'); return; }
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
  const aliasMap = {
    'name':'name', 'partner_name':'name', 'contact_name':'name', 'full_name':'name',
    'type':'type', 'partner_type':'type', 'role':'type', 'category':'type',
    'company':'company', 'company_name':'company', 'firm':'company', 'business':'company',
    'email':'email', 'email_address':'email', 'mail':'email', 'e-mail':'email', 'e_mail':'email',
    'phone':'phone', 'tel':'phone', 'telephone':'phone', 'mobile':'phone', 'cell':'phone', 'phone_number':'phone',
    'website':'website', 'url':'website', 'web':'website', 'site':'website',
    'address':'address', 'mailing_address':'address', 'street':'address', 'addr':'address',
    'trade_license':'trade_license', 'license':'trade_license', 'license_number':'trade_license',
    'preferred_terms':'preferred_terms', 'terms':'preferred_terms', 'payment_terms':'preferred_terms',
    'rating':'rating', 'score':'rating', 'rank':'rating',
    'notes':'notes', 'note':'notes', 'comment':'notes', 'comments':'notes', 'description':'notes',
    'status':'status', 'state':'status',
    'tags':'tags', 'labels':'tags', 'keywords':'tags'
  };
  const colMap = headers.map(h => aliasMap[h] || h);
  if(!colMap.includes('name')){ toast('CSV must include a "name" column','err'); return; }

  const existingByName = new Set();
  TRADE_PARTNERS.forEach(p => { if(p?.name) existingByName.add(String(p.name).toLowerCase().trim()); });

  const parsed = [];
  let dupes = 0;
  let unknownTypes = new Set();
  let unknownStatuses = new Set();
  for(let i=1; i<rows.length; i++){
    const r = rows[i];
    if(r.every(x => !x || !String(x).trim())) continue;
    const obj = {};
    colMap.forEach((c, idx) => { if(c) obj[c] = (r[idx]||'').trim(); });
    if(!obj.name){ continue; }
    if(obj.type){
      const t = obj.type.toLowerCase();
      if(_TP_TYPES.includes(t)) obj.type = t;
      else { unknownTypes.add(obj.type); obj.type = 'other'; }
    }
    if(obj.status){
      const s = obj.status.toLowerCase();
      if(_TP_STATUSES.includes(s)) obj.status = s;
      else { unknownStatuses.add(obj.status); obj.status = 'active'; }
    } else {
      obj.status = 'active';
    }
    if(obj.rating){
      const n = Number(obj.rating);
      if(!isNaN(n) && n >= 0 && n <= 10) obj.rating = n;
      else delete obj.rating;
    }
    obj._dup = existingByName.has(obj.name.toLowerCase());
    if(obj._dup) dupes++;
    parsed.push(obj);
  }

  if(!parsed.length){ toast('No valid rows after parsing','err'); return; }

  const preview = parsed.slice(0, 10);
  const summary = `<div style="font-size:12px;margin-bottom:10px;line-height:1.6;">
    <strong>${parsed.length}</strong> row${parsed.length===1?'':'s'} parsed
    ${dupes ? ` · <span style="color:var(--accent);">${dupes} likely duplicate${dupes===1?'':'s'}</span>` : ''}
    ${unknownTypes.size ? `<br><span style="color:var(--text-3);">${unknownTypes.size} unknown type${unknownTypes.size===1?'':'s'} → "other": ${[...unknownTypes].slice(0,3).map(esc).join(', ')}${unknownTypes.size>3?'…':''}</span>` : ''}
    ${unknownStatuses.size ? `<br><span style="color:var(--text-3);">${unknownStatuses.size} unknown status${unknownStatuses.size===1?'':'es'} → "active": ${[...unknownStatuses].slice(0,3).map(esc).join(', ')}${unknownStatuses.size>3?'…':''}</span>` : ''}
  </div>`;
  const tbl = `<div style="border:1px solid var(--border);border-radius:6px;max-height:300px;overflow:auto;">
    <table style="margin:0;font-size:11px;width:100%;">
      <thead><tr><th></th><th>Name</th><th>Type</th><th>Company</th><th>Email</th><th>Status</th></tr></thead>
      <tbody>${preview.map(p=>`<tr style="${p._dup?'background:#fff7ed;':''}">
        <td style="text-align:center;">${p._dup?'⚠':''}</td>
        <td style="font-weight:500;">${esc(p.name||'')}</td>
        <td>${esc(p.type||'')}</td>
        <td class="sm">${esc(p.company||'')}</td>
        <td class="sm">${esc(p.email||'')}</td>
        <td><span class="badge bg-gray">${esc(p.status||'')}</span></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
  const more = parsed.length > 10 ? `<div class="muted sm" style="margin-top:6px;">…and ${parsed.length-10} more.</div>` : '';

  window._tpStaged = parsed;
  openModal(`
    <div class="modal-hd"><div class="modal-title">Trade Partner Import Preview</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">${summary}${tbl}${more}</div>
    <div class="modal-ft">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="commitTpCsv()">Import ${parsed.length} partner${parsed.length===1?'':'s'}</button>
    </div>
  `);
}

async function commitTpCsv(){
  const staged = window._tpStaged || [];
  if(!staged.length){ toast('Nothing to import','err'); return; }
  const clean = staged.map(r => { const { _dup, ...rest } = r; return rest; });
  toast(`Importing ${clean.length} partners…`);
  const n = await sbBulkSaveTradePartners(clean);
  if(n === false){ toast('Import failed — table may not exist (run M24 SQL)','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog('trade_partners_import', 'trade_partners', {row_count: clean.length, source: 'csv'});
  await sbLoadTradePartners();
  delete window._tpStaged;
  closeModal();
  renderTradePartners($('pg-content'));
  toast(`Imported ${typeof n==='number'?n:clean.length} partner${(typeof n==='number'?n:clean.length)===1?'':'s'}`,'ok');
}
