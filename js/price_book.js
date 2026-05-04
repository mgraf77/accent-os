// ── 5.6 PRICE BOOK — pure-compute over inventory_items + VD ──
let pbFilter = {q:'', vendor:'', tier:'', inStockOnly:false};
function renderPriceBook(c){
  if(!INVENTORY.length){
    c.innerHTML = `
      <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
        <strong>Price Book.</strong> Empty until the Inventory tab has rows. Import a CSV in Inventory (one tab over) — same data drives this view, joined with vendor tier + score.
      </div>
      <div class="card"><div style="padding:60px;text-align:center;color:var(--text-3);"><div style="font-size:48px;margin-bottom:14px;">📒</div><strong>No inventory loaded</strong><div class="sm" style="margin-top:6px;">Switch to the Inventory sub-tab to import a CSV.</div></div></div>
    `;
    return;
  }
  // Index VD by name + id
  const vdByName = {}, vdById = {};
  if(typeof VD !== 'undefined') VD.forEach(v => { if(v){ if(v.n) vdByName[v.n.toLowerCase()] = v; vdById[String(v.id)] = v; } });

  // Compute joined rows
  const rows = INVENTORY.map(r => {
    const cost = Number(r.unit_cost) || 0;
    const list = Number(r.list_price) || 0;
    const margin = list > 0 ? (list - cost) / list : null;   // 0..1
    const markup = cost > 0 ? (list - cost) / cost : null;   // 0..N
    let v = r.vendor_id ? vdById[String(r.vendor_id)] : null;
    if(!v && r.vendor_name) v = vdByName[r.vendor_name.toLowerCase()];
    const tier = v ? (typeof computeVendorTier==='function' ? computeVendorTier(v) : (v.tier_override||'C')) : null;
    const vScore = v && typeof vendorScore === 'function' ? vendorScore(v).weighted : null;
    const inStock = (Number(r.qty_available)||0) > 0;
    return Object.assign({}, r, {_margin:margin, _markup:markup, _tier:tier, _vScore:vScore, _inStock:inStock});
  });

  // Stats
  const withMargin = rows.filter(r => r._margin != null);
  const avgMargin = withMargin.length ? withMargin.reduce((s,r)=>s+r._margin, 0)/withMargin.length : null;
  const distribution = {high:0, mid:0, low:0, none:0};
  rows.forEach(r => {
    if(r._margin == null) distribution.none++;
    else if(r._margin >= 0.50) distribution.high++;
    else if(r._margin >= 0.30) distribution.mid++;
    else distribution.low++;
  });
  const inStockCount = rows.filter(r => r._inStock).length;

  // Filter
  const q = (pbFilter.q||'').toLowerCase();
  const filtered = rows.filter(r => {
    if(pbFilter.vendor && r.vendor_name !== pbFilter.vendor) return false;
    if(pbFilter.tier && r._tier !== pbFilter.tier) return false;
    if(pbFilter.inStockOnly && !r._inStock) return false;
    if(q){
      const hay = `${r.sku||''} ${r.upc||''} ${r.description||''} ${r.vendor_name||''} ${r.category||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => (b._margin||0) - (a._margin||0)).slice(0, 500);

  const vendors = [...new Set(rows.map(r => r.vendor_name).filter(Boolean))].sort();
  const tiers = ['A','B','C','D','F'];

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Price Book.</strong> Catalog view of all inventory SKUs with computed margin and vendor tier. Use this to spot mispriced SKUs, low-margin vendor concentration, and high-margin in-stock anchors for sales conversations.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">SKUs in Book</div><div class="stat-value">${rows.length.toLocaleString()}</div><div class="stat-sub">${inStockCount.toLocaleString()} in stock</div></div>
      <div class="card stat-card" style="border-left:3px solid ${avgMargin!=null && avgMargin>=0.4?'var(--green)':avgMargin!=null && avgMargin>=0.25?'var(--blue)':'var(--yellow)'};"><div class="stat-label">Avg Margin</div><div class="stat-value" style="color:${avgMargin!=null && avgMargin>=0.4?'var(--green)':avgMargin!=null && avgMargin>=0.25?'var(--blue)':'var(--yellow)'};">${avgMargin!=null?(avgMargin*100).toFixed(1)+'%':'—'}</div><div class="stat-sub">Across ${withMargin.length} priced SKUs</div></div>
      <div class="card stat-card"><div class="stat-label">High-Margin (≥50%)</div><div class="stat-value" style="color:var(--green);">${distribution.high.toLocaleString()}</div><div class="stat-sub">${distribution.mid.toLocaleString()} mid · ${distribution.low.toLocaleString()} low · ${distribution.none.toLocaleString()} unpriced</div></div>
      <div class="card stat-card"><div class="stat-label">Vendors</div><div class="stat-value">${vendors.length}</div><div class="stat-sub">${vendors.slice(0,2).map(esc).join(' · ')}${vendors.length>2?' …':''}</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Catalog · ${filtered.length}${filtered.length!==rows.length?' of '+rows.length:''}${rows.length>500 && filtered.length===500?' (showing 500)':''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="pb-q" placeholder="Search SKU / desc / vendor / category…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:240px;" value="${esc(pbFilter.q)}" oninput="pbFilter.q=this.value;clearTimeout(window._pbDeb);window._pbDeb=setTimeout(()=>renderPriceBook($('vendor-section-content')),250)">
          <select style="padding:6px 8px;font-size:12px;" onchange="pbFilter.vendor=this.value;renderPriceBook($('vendor-section-content'))">
            <option value="">All vendors</option>
            ${vendors.map(v=>`<option value="${esc(v)}" ${pbFilter.vendor===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="pbFilter.tier=this.value;renderPriceBook($('vendor-section-content'))">
            <option value="">All tiers</option>
            ${tiers.map(t=>`<option value="${t}" ${pbFilter.tier===t?'selected':''}>Tier ${t}</option>`).join('')}
          </select>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" ${pbFilter.inStockOnly?'checked':''} onchange="pbFilter.inStockOnly=this.checked;renderPriceBook($('vendor-section-content'))"> In stock only</label>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 460px);overflow-y:auto;">
        <table>
          <thead><tr><th>SKU</th><th>Vendor</th><th>Tier</th><th>Description</th><th>Cost</th><th>List</th><th>Margin</th><th>Markup</th><th>On Hand</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-3);">No SKUs match the current filter.</td></tr>` : filtered.map(r => {
              const m = r._margin;
              const mColor = m == null ? 'var(--text-3)' : m >= 0.5 ? 'var(--green)' : m >= 0.3 ? 'var(--blue)' : 'var(--accent)';
              return `<tr>
                <td class="mono fw6 sm">${esc(r.sku||'')}</td>
                <td class="sm">${esc(r.vendor_name||'—')}</td>
                <td>${r._tier ? tierBadge(r._tier) : '<span class="muted">—</span>'}</td>
                <td class="sm" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.description||'')}">${esc(r.description||'')}</td>
                <td class="mono sm">${r.unit_cost!=null?'$'+Number(r.unit_cost).toFixed(2):'—'}</td>
                <td class="mono sm">${r.list_price!=null?'$'+Number(r.list_price).toFixed(2):'—'}</td>
                <td class="mono fw6 sm" style="color:${mColor};">${m!=null?(m*100).toFixed(1)+'%':'—'}</td>
                <td class="mono sm">${r._markup!=null?(r._markup*100).toFixed(0)+'%':'—'}</td>
                <td class="mono sm">${r._inStock?(Number(r.qty_on_hand)||0).toString():'<span class="muted">—</span>'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

