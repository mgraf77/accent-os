// ── 5.14 COMPETITIVE PRICING INTELLIGENCE (competitor_prices table — see sql/M28_competitor_prices_schema.sql) ──
// Tracks competitor prices for our SKUs over time. Each row = one observation
// (one competitor's price for one SKU on one date). Compares against our
// current INVENTORY.list_price to surface undercut/parity/premium positioning.

let COMPETITOR_PRICES = [];
let cpFilter = {q:'', competitor:'', position:''};

async function sbLoadCompetitorPrices(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/competitor_prices?select=id,sku,vendor_id,vendor_name,description,competitor_name,competitor_url,price,our_price,in_stock,shipping_note,observed_at,notes,created_at&order=observed_at.desc&limit=1000');
    COMPETITOR_PRICES = Array.isArray(rows) ? rows : [];
    console.log(`[competitor_prices] Loaded ${COMPETITOR_PRICES.length} observations`);
    return COMPETITOR_PRICES.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[competitor_prices] table not yet created — run sql/M28_competitor_prices_schema.sql');
    } else {
      console.warn('[sb] Load competitor_prices failed:', e.message);
    }
    return false;
  }
}

async function sbSaveCompetitorPrice(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      sku: rec.sku,
      vendor_id: rec.vendor_id || null,
      vendor_name: rec.vendor_name || null,
      description: rec.description || null,
      competitor_name: rec.competitor_name,
      competitor_url: rec.competitor_url || null,
      price: Number(rec.price),
      our_price: rec.our_price == null || rec.our_price === '' ? null : Number(rec.our_price),
      in_stock: rec.in_stock == null ? null : !!rec.in_stock,
      shipping_note: rec.shipping_note || null,
      observed_at: rec.observed_at || new Date().toISOString().slice(0,10),
      notes: rec.notes || null,
      observed_by: (CU?.user_id) || null
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/competitor_prices?on_conflict=id' : '/competitor_prices';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save competitor_price failed:', e.message); return false; }
}

async function sbDeleteCompetitorPrice(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/competitor_prices?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete competitor_price failed:', e.message); return false; }
}

function competitive(el, act){
  act.innerHTML = `<button class="btn btn-accent btn-sm" onclick="openCompetitivePriceEdit(null)">+ Log Price</button>`;
  renderCompetitive(el);
}

// Latest snapshot per (sku, competitor_name)
function buildCompetitiveLatest(){
  const map = {};
  COMPETITOR_PRICES.forEach(r => {
    const key = `${r.sku}__${r.competitor_name}`;
    const existing = map[key];
    if(!existing || (r.observed_at||'') > (existing.observed_at||'')) map[key] = r;
  });
  return Object.values(map);
}

function positionFor(ourPrice, theirPrice){
  if(ourPrice == null || theirPrice == null) return 'unknown';
  const diff = (ourPrice - theirPrice) / theirPrice;
  if(diff > 0.05) return 'premium';     // we charge >5% more
  if(diff < -0.05) return 'undercut';   // we charge >5% less
  return 'parity';
}

function renderCompetitive(el){
  const latest = buildCompetitiveLatest();
  // Stats
  const competitors = [...new Set(COMPETITOR_PRICES.map(r => r.competitor_name).filter(Boolean))].sort();
  const skus = [...new Set(COMPETITOR_PRICES.map(r => r.sku).filter(Boolean))];
  const positions = {undercut:0, parity:0, premium:0, unknown:0};
  let avgMargin = null, marginCount = 0;
  latest.forEach(r => {
    const our = (r.our_price != null) ? Number(r.our_price) : (() => {
      // Fall back to current INVENTORY list_price if we have it
      if(typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)){
        const inv = INVENTORY.find(i => i.sku === r.sku);
        if(inv && inv.list_price != null) return Number(inv.list_price);
      }
      return null;
    })();
    const pos = positionFor(our, Number(r.price));
    positions[pos] = (positions[pos]||0) + 1;
    if(our != null && r.price != null && r.price > 0){
      avgMargin = (avgMargin||0) + ((our - r.price)/r.price);
      marginCount++;
    }
  });
  if(marginCount) avgMargin = avgMargin / marginCount;

  // Filter
  const q = (cpFilter.q||'').toLowerCase();
  const filtered = latest.filter(r => {
    if(cpFilter.competitor && r.competitor_name !== cpFilter.competitor) return false;
    const our = (r.our_price != null) ? Number(r.our_price) : (() => {
      if(typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)){
        const inv = INVENTORY.find(i => i.sku === r.sku);
        if(inv && inv.list_price != null) return Number(inv.list_price);
      }
      return null;
    })();
    if(cpFilter.position){
      const pos = positionFor(our, Number(r.price));
      if(pos !== cpFilter.position) return false;
    }
    if(q){
      const hay = `${r.sku||''} ${r.description||''} ${r.competitor_name||''} ${r.vendor_name||''} ${r.notes||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    r._our = our;
    r._pos = positionFor(our, Number(r.price));
    return true;
  }).sort((a,b) => {
    // Order: undercut (worst — we're losing) → parity → premium → unknown
    const order = {undercut:0, parity:1, premium:2, unknown:3};
    const oa = order[a._pos] ?? 9, ob = order[b._pos] ?? 9;
    if(oa !== ob) return oa - ob;
    return (b.observed_at||'').localeCompare(a.observed_at||'');
  });

  el.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Competitive Pricing.</strong> Each row is the latest observation per (SKU × competitor). Position computed against our_price (manual) or falls back to current INVENTORY.list_price for the SKU. <strong>Undercut</strong> = our price is &gt;5% below theirs (good, we're winning). <strong>Premium</strong> = ours &gt;5% above (we may be losing). <strong>Parity</strong> = within 5%.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">SKUs Tracked</div><div class="stat-value">${skus.length}</div><div class="stat-sub">${COMPETITOR_PRICES.length} total observations</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">Undercutting</div><div class="stat-value" style="color:var(--green);">${positions.undercut||0}</div><div class="stat-sub">We&rsquo;re cheaper</div></div>
      <div class="card stat-card"${positions.premium?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Premium</div><div class="stat-value" style="color:${positions.premium?'var(--accent)':'var(--text)'};">${positions.premium||0}</div><div class="stat-sub">We&rsquo;re pricier — review</div></div>
      <div class="card stat-card"><div class="stat-label">Avg vs Competitor</div><div class="stat-value">${avgMargin!=null?(avgMargin>0?'+':'')+(avgMargin*100).toFixed(1)+'%':'—'}</div><div class="stat-sub">Across ${marginCount} priced pairs</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Latest Observations · ${filtered.length}${filtered.length!==latest.length?` of ${latest.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="cp-q" placeholder="Search SKU / desc / competitor…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:240px;" value="${esc(cpFilter.q)}" oninput="cpFilter.q=this.value;clearTimeout(window._cpDeb);window._cpDeb=setTimeout(()=>renderCompetitive($('pg-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="cpFilter.competitor=this.value;renderCompetitive($('pg-content'))">
            <option value="">All competitors</option>
            ${competitors.map(c=>`<option value="${esc(c)}" ${cpFilter.competitor===c?'selected':''}>${esc(c)}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="cpFilter.position=this.value;renderCompetitive($('pg-content'))">
            <option value="">All positions</option>
            <option value="undercut" ${cpFilter.position==='undercut'?'selected':''}>Undercutting</option>
            <option value="parity" ${cpFilter.position==='parity'?'selected':''}>Parity</option>
            <option value="premium" ${cpFilter.position==='premium'?'selected':''}>Premium</option>
            <option value="unknown" ${cpFilter.position==='unknown'?'selected':''}>Unknown</option>
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>SKU</th><th>Description</th><th>Competitor</th><th>Their $</th><th>Our $</th><th>Δ</th><th>Position</th><th>Observed</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">${COMPETITOR_PRICES.length===0?'No competitor prices logged yet. Click "+ Log Price" to add one (run M28 SQL first if save fails).':'No observations match the current filter.'}</td></tr>` : filtered.map(r => {
              const our = r._our;
              const pos = r._pos;
              const posColor = {undercut:'var(--green)', parity:'var(--blue)', premium:'var(--accent)', unknown:'var(--text-3)'}[pos];
              const posLabel = {undercut:'undercut', parity:'parity', premium:'premium', unknown:'—'}[pos];
              const diff = (our!=null && r.price>0) ? ((our - r.price) / r.price) * 100 : null;
              return `<tr style="cursor:pointer;" onclick="openCompetitivePriceEdit('${r.id}')">
                <td class="mono fw6 sm">${esc(r.sku)}</td>
                <td class="sm" style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.description||'')}">${esc(r.description||'')}</td>
                <td class="sm">${esc(r.competitor_name)}${r.competitor_url?` <a href="${esc(r.competitor_url)}" target="_blank" rel="noopener" onclick="event.stopPropagation();" style="color:var(--accent);font-size:10px;">↗</a>`:''}</td>
                <td class="mono sm">$${Number(r.price).toFixed(2)}</td>
                <td class="mono sm">${our!=null?'$'+Number(our).toFixed(2):'<span class="muted">—</span>'}</td>
                <td class="mono fw6 sm" style="color:${posColor};">${diff!=null?(diff>0?'+':'')+diff.toFixed(1)+'%':'—'}</td>
                <td><span class="badge" style="background:${posColor};color:#fff;font-size:10px;">${posLabel}</span></td>
                <td class="mono sm">${esc(r.observed_at||'')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openCompetitivePriceEdit(priceId){
  const isNew = !priceId;
  const r = isNew ? {observed_at: new Date().toISOString().slice(0,10), in_stock: true} : COMPETITOR_PRICES.find(x => x.id === priceId);
  if(!r){ toast('Observation not found','err'); return; }
  // Try to autocomplete from inventory if SKU known
  const invList = (typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) ? INVENTORY : [];
  const skuOptions = invList.slice().sort((a,b)=>(a.sku||'').localeCompare(b.sku||'')).slice(0,500).map(i => `<option value="${esc(i.sku)}" data-desc="${esc(i.description||'')}" data-vid="${esc(i.vendor_id||'')}" data-vname="${esc(i.vendor_name||'')}" data-our="${i.list_price||''}"></option>`).join('');
  openModal((isNew?'New':'Edit')+' Competitor Price', `
    <div class="frow">
      <div class="fcol field"><label>SKU *</label>
        <input id="cp-sku" list="cp-sku-list" value="${esc(r.sku||'')}" oninput="onCompetitiveSkuPick()">
        <datalist id="cp-sku-list">${skuOptions}</datalist>
      </div>
      <div class="fcol field"><label>Observed</label><input id="cp-d" type="date" value="${esc(r.observed_at||'')}"></div>
    </div>
    <div class="fg"><label>Description (auto-filled from inventory)</label><input id="cp-desc" value="${esc(r.description||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>Competitor *</label><input id="cp-c" value="${esc(r.competitor_name||'')}" placeholder="Big Box X, ShoppingSite Y"></div>
      <div class="fcol field"><label>URL</label><input id="cp-url" value="${esc(r.competitor_url||'')}" placeholder="https://"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Their Price *</label><input id="cp-p" type="number" step="0.01" value="${r.price!=null?r.price:''}"></div>
      <div class="fcol field"><label>Our Price</label><input id="cp-our" type="number" step="0.01" value="${r.our_price!=null?r.our_price:''}" placeholder="(auto from inventory if blank)"></div>
      <div class="fcol field" style="display:flex;align-items:flex-end;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input id="cp-stock" type="checkbox" ${r.in_stock===false?'':'checked'}> In stock at competitor</label></div>
    </div>
    <div class="fg"><label>Shipping Note</label><input id="cp-ship" value="${esc(r.shipping_note||'')}" placeholder="free over $99, $9 flat, etc."></div>
    <div class="fg"><label>Notes</label><textarea id="cp-notes" rows="2">${esc(r.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCompetitivePriceConfirm('${priceId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveCompetitivePrice(${isNew?'null':`'${priceId}'`})">Save</button>
    </div>
  `);
}

function onCompetitiveSkuPick(){
  const sku = $('cp-sku')?.value;
  if(!sku) return;
  const invList = (typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) ? INVENTORY : [];
  const inv = invList.find(i => i.sku === sku);
  if(!inv) return;
  if($('cp-desc') && !$('cp-desc').value && inv.description) $('cp-desc').value = inv.description;
  if($('cp-our') && !$('cp-our').value && inv.list_price != null) $('cp-our').value = inv.list_price;
}

async function saveCompetitivePrice(priceId){
  const sku = $('cp-sku')?.value?.trim();
  const competitor_name = $('cp-c')?.value?.trim();
  const priceVal = $('cp-p')?.value;
  if(!sku){ toast('SKU required','err'); return; }
  if(!competitor_name){ toast('Competitor name required','err'); return; }
  if(!priceVal){ toast('Price required','err'); return; }
  // Pull vendor info from inventory if available
  let vendor_id = null, vendor_name = null;
  if(typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)){
    const inv = INVENTORY.find(i => i.sku === sku);
    if(inv){ vendor_id = inv.vendor_id; vendor_name = inv.vendor_name; }
  }
  const rec = {
    id: priceId || undefined,
    sku,
    vendor_id,
    vendor_name,
    description: $('cp-desc').value || null,
    competitor_name,
    competitor_url: $('cp-url').value || null,
    price: priceVal,
    our_price: $('cp-our').value || null,
    in_stock: $('cp-stock').checked,
    shipping_note: $('cp-ship').value || null,
    observed_at: $('cp-d').value || null,
    notes: $('cp-notes').value || null
  };
  const saved = await sbSaveCompetitorPrice(rec);
  if(!saved){ toast('Save failed — table may not exist (run M28 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = COMPETITOR_PRICES.findIndex(x => x.id === saved.id);
    if(idx >= 0) COMPETITOR_PRICES[idx] = saved; else COMPETITOR_PRICES.unshift(saved);
  } else {
    await sbLoadCompetitorPrices();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(priceId?'compprice_edit':'compprice_create', 'competitive_pricing', {price_id: priceId||saved?.id, sku, competitor: competitor_name});
  closeModal();
  renderCompetitive($('pg-content'));
  toast('Observation '+(priceId?'updated':'added'),'ok');
}

async function deleteCompetitivePriceConfirm(priceId){
  const r = COMPETITOR_PRICES.find(x => x.id === priceId);
  if(!r) return;
  if(!confirm(`Delete observation: ${r.sku} @ ${r.competitor_name}?`)) return;
  await sbDeleteCompetitorPrice(priceId);
  COMPETITOR_PRICES = COMPETITOR_PRICES.filter(x => x.id !== priceId);
  if(typeof sbAuditLog==='function') sbAuditLog('compprice_delete', 'competitive_pricing', {price_id: priceId, sku: r.sku});
  closeModal();
  renderCompetitive($('pg-content'));
  toast('Observation deleted','ok');
}
