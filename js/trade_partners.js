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

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Active Partners</div><div class="stat-value">${counts.active||0}</div><div class="stat-sub">${counts.prospect||0} prospect · ${counts.inactive||0} inactive</div></div>
      <div class="card stat-card"><div class="stat-label">Designers</div><div class="stat-value">${byType.designer||0}</div><div class="stat-sub">+ ${byType.architect||0} architect · ${byType.builder||0} builder</div></div>
      <div class="card stat-card"><div class="stat-label">Trades</div><div class="stat-value">${(byType.contractor||0)+(byType.installer||0)+(byType.electrician||0)}</div><div class="stat-sub">${byType.contractor||0} contractor · ${byType.installer||0} installer · ${byType.electrician||0} electrician</div></div>
      <div class="card stat-card"${avgRating!=null && avgRating>=8?` style="border-left:3px solid var(--green);"`:''}><div class="stat-label">Avg Rating</div><div class="stat-value">${avgRating!=null?avgRating.toFixed(1):'—'}</div><div class="stat-sub">Across ${ratedCount} rated</div></div>
    </div>
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
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Company</th><th>Contact</th><th>Rating</th><th>Status</th><th>Last Engaged</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">${TRADE_PARTNERS.length===0?'No trade partners yet. Click "+ New Partner" to add one (run M24 SQL first if save fails).':'No partners match the current filter.'}</td></tr>` : filtered.map(p => {
              const sb = {active:'bg-green', prospect:'bg-blue', inactive:'bg-gray'}[p.status] || 'bg-gray';
              const ratingCell = p.rating != null ? `<span class="mono fw6" style="color:${p.rating>=8?'var(--green)':p.rating>=6?'var(--blue)':'var(--yellow)'};">${Number(p.rating).toFixed(1)}</span>` : '<span class="muted">—</span>';
              return `<tr style="cursor:pointer;${p.status==='inactive'?'opacity:0.6;':''}" onclick="openTradePartnerEdit('${p.id}')">
                <td style="font-weight:600;color:var(--accent);">${esc(p.name)}</td>
                <td><span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(p.type||'—')}</span></td>
                <td class="sm">${esc(p.company||'—')}</td>
                <td class="sm">${esc(p.email||p.phone||'')}</td>
                <td>${ratingCell}</td>
                <td><span class="badge ${sb}" style="font-size:10px;">${esc(p.status)}</span></td>
                <td class="sm mono">${esc(p.last_engaged||'')}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="event.stopPropagation();openTradePartnerEdit('${p.id}')">Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
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
