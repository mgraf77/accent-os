// ── 6.9 AI DEMAND FORECASTING ──
// Pure-compute layer over INVENTORY + PO_LINES. No new schema.
// Velocity proxy: qty in PO lines over the last 90 days / 13 weeks.
// Heuristics:
//   weeks_of_stock = qty_available / velocity_per_week
//   default lead_time = 4 weeks, safety_buffer = 2 weeks → reorder threshold = 6 weeks
//   reorder_now:  weeks < 6  (or qty_available <= 0 with velocity > 0)
//   reorder_soon: 6 ≤ weeks < 9
//   overstock:    weeks > 26
//   normal:       9 ≤ weeks ≤ 26
//   no_data:      velocity == 0 (no PO history in window)
// Sharpens as PO history accumulates. When Track 6.11 (Windward live) lands,
// swap PO-line proxy for actual sales-line history without changing the UI.

let demandFilter = {q:'', vendor:'', kind:''};

const DEMAND_LEAD_WEEKS = 4;
const DEMAND_SAFETY_WEEKS = 2;
const DEMAND_REORDER_THRESHOLD = DEMAND_LEAD_WEEKS + DEMAND_SAFETY_WEEKS;   // 6 weeks
const DEMAND_TARGET_WEEKS = DEMAND_LEAD_WEEKS + DEMAND_SAFETY_WEEKS + 8;   // 14 weeks of forward demand
const DEMAND_OVERSTOCK_WEEKS = 26;
const DEMAND_VELOCITY_WINDOW_DAYS = 90;

function computeDemandForecast(){
  // 1. Build per-SKU velocity from PO lines in last 90 days.
  const cutoff = Date.now() - DEMAND_VELOCITY_WINDOW_DAYS * 86400000;
  const skuVel = {};   // key=sku|vendor_id (or sku|name) → total qty in window
  const recentPOs = (typeof POS !== 'undefined' ? POS : []).filter(p => {
    if(!p.order_date) return false;
    const t = new Date(p.order_date).getTime();
    return !isNaN(t) && t >= cutoff;
  });
  recentPOs.forEach(p => {
    const lines = (typeof PO_LINES !== 'undefined' ? (PO_LINES[p.id]||[]) : []);
    lines.forEach(l => {
      if(!l.sku) return;
      const q = Number(l.qty)||0;
      if(q <= 0) return;
      const k = `${l.sku}|${p.vendor_id||p.vendor_name||''}`;
      skuVel[k] = (skuVel[k]||0) + q;
    });
  });

  const weeksInWindow = DEMAND_VELOCITY_WINDOW_DAYS / 7;   // 12.857
  const recs = [];
  (typeof INVENTORY !== 'undefined' ? INVENTORY : []).forEach(it => {
    if(!it.sku) return;
    const k = `${it.sku}|${it.vendor_id||it.vendor_name||''}`;
    const winQty = skuVel[k] || 0;
    const velocity = winQty / weeksInWindow;   // units / week
    const avail = (it.qty_available != null ? Number(it.qty_available)
                  : (Number(it.qty_on_hand)||0) - (Number(it.qty_committed)||0));
    const onOrder = Number(it.qty_on_order)||0;
    let kind, weeksOfStock = null, suggestedQty = 0;
    if(velocity <= 0.05){
      kind = 'no_data';
    } else {
      weeksOfStock = avail / velocity;
      if(avail <= 0 || weeksOfStock < DEMAND_REORDER_THRESHOLD){
        kind = 'reorder_now';
        suggestedQty = Math.max(1, Math.round(velocity * DEMAND_TARGET_WEEKS - avail - onOrder));
      } else if(weeksOfStock < DEMAND_REORDER_THRESHOLD * 1.5){
        kind = 'reorder_soon';
        suggestedQty = Math.max(1, Math.round(velocity * DEMAND_TARGET_WEEKS - avail - onOrder));
      } else if(weeksOfStock > DEMAND_OVERSTOCK_WEEKS){
        kind = 'overstock';
      } else {
        kind = 'normal';
      }
    }
    recs.push({
      sku: it.sku,
      vendor_id: it.vendor_id,
      vendor_name: it.vendor_name || '—',
      description: it.description || '',
      qty_available: avail,
      qty_on_order: onOrder,
      reorder_point: it.reorder_point != null ? Number(it.reorder_point) : null,
      unit_cost: it.unit_cost != null ? Number(it.unit_cost) : null,
      list_price: it.list_price != null ? Number(it.list_price) : null,
      velocity_per_week: velocity,
      weeks_of_stock: weeksOfStock,
      kind, suggested_qty: suggestedQty
    });
  });
  // Sort: reorder_now first (by weeks_of_stock asc), reorder_soon, overstock, normal, no_data
  const order = {reorder_now:0, reorder_soon:1, overstock:2, normal:3, no_data:4};
  recs.sort((a,b) => {
    if(order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
    if(a.kind === 'reorder_now' || a.kind === 'reorder_soon')
      return (a.weeks_of_stock||0) - (b.weeks_of_stock||0);
    if(a.kind === 'overstock') return (b.weeks_of_stock||0) - (a.weeks_of_stock||0);
    return 0;
  });
  return recs;
}

function demandforecast(c, actions){
  if(!c) return;
  const all = computeDemandForecast();
  const counts = {reorder_now:0, reorder_soon:0, overstock:0, normal:0, no_data:0};
  all.forEach(r => counts[r.kind]++);
  const stockoutSoon = all.filter(r => r.kind === 'reorder_now').length;
  const next60 = all.filter(r => r.kind === 'reorder_now' || r.kind === 'reorder_soon').length;
  const totalReorderValue = all.filter(r => r.kind === 'reorder_now' || r.kind === 'reorder_soon')
    .reduce((s,r) => s + (r.suggested_qty || 0) * (r.unit_cost || 0), 0);

  // Filter
  const q = (demandFilter.q||'').toLowerCase();
  const filtered = all.filter(r => {
    if(demandFilter.vendor && r.vendor_name !== demandFilter.vendor) return false;
    if(demandFilter.kind && r.kind !== demandFilter.kind) return false;
    if(q){
      const hay = `${r.sku} ${r.vendor_name} ${r.description}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  const vendors = [...new Set(all.map(r => r.vendor_name).filter(Boolean))].sort();

  if(actions){
    actions.innerHTML = `<button class="btn btn-outline btn-sm" onclick="exportDemandReorderCsv()" title="Download a CSV of all reorder_now + reorder_soon SKUs">Export reorder list</button>`;
  }

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Demand Forecast.</strong> Velocity is derived from PO lines in the last ${DEMAND_VELOCITY_WINDOW_DAYS} days as a proxy for sell-through (we order what we sell at steady state). Lead time defaults to ${DEMAND_LEAD_WEEKS} weeks + ${DEMAND_SAFETY_WEEKS}-week safety buffer = reorder threshold ${DEMAND_REORDER_THRESHOLD} weeks of stock. Suggested qty targets ${DEMAND_TARGET_WEEKS} weeks of forward demand. Sharpens as PO + sales history accumulates; Track 6.11 (Windward live) will swap the proxy for actual sales-line data.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">SKUs Forecasted</div><div class="stat-value">${all.length.toLocaleString()}</div><div class="stat-sub">${counts.no_data} have no recent PO history</div></div>
      <div class="card stat-card"${stockoutSoon?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Reorder Now</div><div class="stat-value" style="color:${stockoutSoon?'var(--accent)':'var(--text)'};">${stockoutSoon}</div><div class="stat-sub">&lt; ${DEMAND_REORDER_THRESHOLD} weeks of stock</div></div>
      <div class="card stat-card"${next60?` style="border-left:3px solid var(--yellow);"`:''}><div class="stat-label">Reorder Soon</div><div class="stat-value" style="color:${counts.reorder_soon?'var(--yellow)':'var(--text)'};">${counts.reorder_soon}</div><div class="stat-sub">${DEMAND_REORDER_THRESHOLD}–${Math.round(DEMAND_REORDER_THRESHOLD*1.5)} weeks of stock</div></div>
      <div class="card stat-card"><div class="stat-label">Suggested PO $</div><div class="stat-value">${totalReorderValue ? '$'+(totalReorderValue/1000).toFixed(1)+'K' : '—'}</div><div class="stat-sub">qty × unit_cost across reorder set</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Forecast · ${filtered.length}${filtered.length!==all.length?' of '+all.length:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input placeholder="Search SKU / desc / vendor…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(demandFilter.q)}" oninput="demandFilter.q=this.value;clearTimeout(window._dfDeb);window._dfDeb=setTimeout(()=>demandforecast($('pg-content'),$('pg-actions')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="demandFilter.vendor=this.value;demandforecast($('pg-content'),$('pg-actions'))">
            <option value="">All vendors</option>
            ${vendors.map(v=>`<option value="${esc(v)}" ${demandFilter.vendor===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="demandFilter.kind=this.value;demandforecast($('pg-content'),$('pg-actions'))">
            <option value="">All recommendations</option>
            <option value="reorder_now" ${demandFilter.kind==='reorder_now'?'selected':''}>Reorder now</option>
            <option value="reorder_soon" ${demandFilter.kind==='reorder_soon'?'selected':''}>Reorder soon</option>
            <option value="overstock" ${demandFilter.kind==='overstock'?'selected':''}>Overstock</option>
            <option value="normal" ${demandFilter.kind==='normal'?'selected':''}>Normal</option>
            <option value="no_data" ${demandFilter.kind==='no_data'?'selected':''}>No data</option>
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 380px);overflow-y:auto;">
        <table>
          <thead><tr><th>Recommendation</th><th>SKU</th><th>Vendor</th><th>Description</th><th>Velocity (u/wk)</th><th>Available</th><th>On Order</th><th>Weeks of Stock</th><th>Suggested Qty</th><th>Suggested PO $</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="10" style="text-align:center;padding:36px;color:var(--text-3);">${all.length===0?'No inventory yet. Import a CSV via the Inventory page first, then add a few POs to seed velocity.':'No SKUs match the current filter.'}</td></tr>` : filtered.slice(0, 1000).map(r => {
              const kindStyle = {
                reorder_now: {label:'Reorder now', color:'var(--accent)'},
                reorder_soon: {label:'Reorder soon', color:'var(--yellow)'},
                overstock: {label:'Overstock', color:'var(--blue)'},
                normal: {label:'Normal', color:'var(--green,var(--text-2))'},
                no_data: {label:'No data', color:'var(--text-3)'}
              }[r.kind];
              const wos = r.weeks_of_stock == null ? '—'
                        : r.weeks_of_stock > 999 ? '∞'
                        : r.weeks_of_stock.toFixed(1);
              const sugDollars = r.suggested_qty && r.unit_cost ? '$'+Math.round(r.suggested_qty * r.unit_cost).toLocaleString() : '—';
              return `<tr>
                <td><span class="badge" style="background:${kindStyle.color};color:#fff;font-size:10px;text-transform:uppercase;">${kindStyle.label}</span></td>
                <td class="mono fw6 sm">${esc(r.sku)}</td>
                <td class="sm">${esc(r.vendor_name)}</td>
                <td class="sm" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.description)}">${esc(r.description)}</td>
                <td class="mono sm">${r.velocity_per_week.toFixed(2)}</td>
                <td class="mono sm" style="${r.qty_available<=0?'color:var(--accent);font-weight:700;':''}">${r.qty_available}</td>
                <td class="mono sm">${r.qty_on_order||'—'}</td>
                <td class="mono sm" style="${r.kind==='reorder_now'?'color:var(--accent);font-weight:700;':r.kind==='overstock'?'color:var(--blue);':''}">${wos}</td>
                <td class="mono sm">${r.suggested_qty || '—'}</td>
                <td class="mono sm">${sugDollars}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > 1000 ? `<div class="muted sm" style="padding:8px 14px;">Showing first 1000 of ${filtered.length} matching rows. Narrow with filters to see the rest.</div>` : ''}
    </div>
  `;
}

function exportDemandReorderCsv(){
  const recs = computeDemandForecast().filter(r => r.kind === 'reorder_now' || r.kind === 'reorder_soon');
  if(!recs.length){ toast('Nothing to reorder right now','ok'); return; }
  const rows = [['recommendation','sku','vendor','description','velocity_per_week','qty_available','qty_on_order','weeks_of_stock','suggested_qty','unit_cost','suggested_total']];
  recs.forEach(r => rows.push([
    r.kind, r.sku, r.vendor_name, (r.description||'').replace(/"/g,'""'),
    r.velocity_per_week.toFixed(2), r.qty_available, r.qty_on_order,
    r.weeks_of_stock != null ? r.weeks_of_stock.toFixed(1) : '',
    r.suggested_qty, r.unit_cost != null ? r.unit_cost.toFixed(2) : '',
    r.suggested_qty && r.unit_cost ? (r.suggested_qty * r.unit_cost).toFixed(2) : ''
  ]));
  const csv = rows.map(r => r.map(c => {
    const s = String(c==null?'':c);
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `reorder_list_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  if(typeof sbAuditLog==='function') sbAuditLog('demand_export_reorder', 'inventory', {row_count: recs.length});
  toast(`Exported ${recs.length} SKUs`,'ok');
}
