// ── INVENTORY ANALYTICS ──
// Sub-tab on Vendor Ranking page. Pure-compute over INVENTORY + PO_LINES.
// Complements 6.9 Demand Forecasting by focusing on retrospective metrics
// (turn rate, dead stock detection, ABC classification, stock value mix)
// rather than forward-looking reorder suggestions.
register({ name: 'inventory_analytics', provides: ['inventory_analytics','renderInventoryAnalytics'], consumes: ['INVENTORY','POS','PO_LINES','$','esc','toast'] });

const INV_DEAD_STOCK_DAYS = 180;
const INV_VELOCITY_WINDOW_DAYS = 365;   // longer window than demand forecast — annualized signal

function renderInventoryAnalytics(c){
  if(!c) return;
  if(typeof INVENTORY === 'undefined' || !INVENTORY.length){
    c.innerHTML = `<div class="card" style="padding:24px;text-align:center;color:var(--text-3);">No inventory loaded yet. Import a CSV via the Inventory sub-tab first.</div>`;
    return;
  }

  const cutoff = Date.now() - INV_VELOCITY_WINDOW_DAYS * 86400000;
  const deadCutoff = Date.now() - INV_DEAD_STOCK_DAYS * 86400000;

  // Per-SKU annualized velocity from PO lines in last 365 days
  const skuVel = {};
  const skuLastMove = {};   // most recent PO order_date that referenced this SKU
  const recentPOs = (typeof POS !== 'undefined' ? POS : []).filter(p => {
    const t = p.order_date ? new Date(p.order_date).getTime() : 0;
    return t >= cutoff;
  });
  recentPOs.forEach(p => {
    const t = new Date(p.order_date).getTime();
    const lines = (typeof PO_LINES !== 'undefined') ? (PO_LINES[p.id]||[]) : [];
    lines.forEach(l => {
      if(!l.sku) return;
      const k = `${l.sku}|${p.vendor_id||p.vendor_name||''}`;
      const q = Number(l.qty)||0;
      skuVel[k] = (skuVel[k]||0) + q;
      if(!skuLastMove[k] || t > skuLastMove[k]) skuLastMove[k] = t;
    });
  });

  // Per-SKU rows
  const items = INVENTORY.map(it => {
    const k = `${it.sku}|${it.vendor_id||it.vendor_name||''}`;
    const annualVel = skuVel[k] || 0;
    const onHand = Number(it.qty_on_hand) || 0;
    const cost = Number(it.unit_cost) || 0;
    const value = onHand * cost;
    const turn = (annualVel > 0 && onHand > 0) ? annualVel / onHand : null;
    const lastMove = skuLastMove[k] || null;
    const daysSinceMove = lastMove ? Math.floor((Date.now() - lastMove) / 86400000) : null;
    const isDead = (annualVel === 0) && onHand > 0;
    const annualRevenue = annualVel * (Number(it.list_price) || 0);
    return {
      sku: it.sku,
      vendor_name: it.vendor_name || '—',
      description: it.description || '',
      qty_on_hand: onHand,
      unit_cost: cost,
      list_price: Number(it.list_price) || 0,
      value,
      annual_velocity: annualVel,
      turn,
      last_move_days: daysSinceMove,
      is_dead: isDead,
      annual_revenue: annualRevenue
    };
  });

  // ABC classification — by annual revenue, top 80% A, next 15% B, last 5% C
  const sortedByRev = [...items].sort((a,b) => b.annual_revenue - a.annual_revenue);
  const totalRev = sortedByRev.reduce((s,r) => s + r.annual_revenue, 0);
  let cum = 0;
  sortedByRev.forEach(r => {
    cum += r.annual_revenue;
    const pct = totalRev ? cum / totalRev : 0;
    r.abc = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C';
  });

  // Aggregates
  const totalSKUs = items.length;
  const totalValue = items.reduce((s,r) => s + r.value, 0);
  const movers = items.filter(r => r.turn != null);
  const avgTurn = movers.length ? (movers.reduce((s,r) => s + r.turn, 0) / movers.length) : 0;
  const dead = items.filter(r => r.is_dead);
  const deadValue = dead.reduce((s,r) => s + r.value, 0);
  const abcCounts = {A:0, B:0, C:0};
  const abcValue = {A:0, B:0, C:0};
  items.forEach(r => { if(r.abc){ abcCounts[r.abc]++; abcValue[r.abc] += r.value; }});

  const fastest = [...movers].sort((a,b) => b.turn - a.turn).slice(0, 10);
  const slowest = [...movers].sort((a,b) => a.turn - b.turn).slice(0, 10);
  const deadSorted = [...dead].sort((a,b) => b.value - a.value).slice(0, 20);

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Inventory Analytics.</strong> Retrospective metrics over last ${INV_VELOCITY_WINDOW_DAYS} days of PO data: turn rate, dead stock (${INV_DEAD_STOCK_DAYS}d+ no movement), and ABC classification (A=top 80% revenue, B=next 15%, C=last 5%). Pairs with the forward-looking 6.9 Demand Forecast for full picture. Track 6.11 Windward live will swap PO proxy for actual sales-line history.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Total Inventory Value</div><div class="stat-value">$${(totalValue/1000).toFixed(1)}K</div><div class="stat-sub">${totalSKUs.toLocaleString()} SKUs</div></div>
      <div class="card stat-card"><div class="stat-label">Avg Turn Rate</div><div class="stat-value">${avgTurn.toFixed(1)}x</div><div class="stat-sub">Per year, across ${movers.length} active SKUs</div></div>
      <div class="card stat-card"${dead.length?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Dead Stock</div><div class="stat-value" style="color:${dead.length?'var(--accent)':'var(--text)'};">${dead.length}</div><div class="stat-sub">$${Math.round(deadValue).toLocaleString()} tied up · ${INV_DEAD_STOCK_DAYS}d+ idle</div></div>
      <div class="card stat-card"><div class="stat-label">ABC Mix</div><div class="stat-value" style="font-size:18px;">${abcCounts.A}A / ${abcCounts.B}B / ${abcCounts.C}C</div><div class="stat-sub">$${Math.round(abcValue.A/1000)}K · $${Math.round(abcValue.B/1000)}K · $${Math.round(abcValue.C/1000)}K</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="card">
        <div class="card-hd"><span class="card-title">ABC Distribution</span></div>
        <div style="padding:14px 18px;">
          ${['A','B','C'].map(cls => {
            const pct = totalSKUs ? Math.round(100 * abcCounts[cls] / totalSKUs) : 0;
            const valPct = totalValue ? Math.round(100 * abcValue[cls] / totalValue) : 0;
            const color = cls==='A'?'var(--green)':cls==='B'?'var(--blue)':'var(--text-3)';
            return `<div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
                <span><strong>Class ${cls}</strong> · ${cls==='A'?'top 80% rev':cls==='B'?'next 15%':'last 5%'}</span>
                <span class="mono">${abcCounts[cls]} SKUs (${pct}%) · $${Math.round(abcValue[cls]/1000)}K (${valPct}% value)</span>
              </div>
              <div style="background:var(--bg-2);height:18px;border-radius:3px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${color};"></div>
              </div>
            </div>`;
          }).join('')}
          <div class="muted sm" style="margin-top:6px;">Insight: Class A SKUs drive most revenue but hold ${Math.round(100*abcValue.A/(totalValue||1))}% of value. Aim to keep them in stock; Class C SKUs are candidates for slower reorders or discontinuation.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Fastest Movers (turn rate)</span></div>
        <div class="tbl-wrap" style="max-height:300px;overflow-y:auto;">
          <table>
            <thead><tr><th>SKU</th><th>Vendor</th><th>Turn</th><th>On Hand</th><th>Value</th></tr></thead>
            <tbody>
              ${fastest.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-3);">No PO movement to compute turn.</td></tr>' : fastest.map(r => `<tr>
                <td class="mono fw6 sm">${esc(r.sku)}</td>
                <td class="sm" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.vendor_name)}</td>
                <td class="mono fw6" style="color:var(--green);">${r.turn.toFixed(1)}x</td>
                <td class="mono sm">${r.qty_on_hand}</td>
                <td class="mono sm">$${Math.round(r.value).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Slowest Movers (still active)</span></div>
        <div class="tbl-wrap" style="max-height:300px;overflow-y:auto;">
          <table>
            <thead><tr><th>SKU</th><th>Vendor</th><th>Turn</th><th>On Hand</th><th>Value</th></tr></thead>
            <tbody>
              ${slowest.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-3);">—</td></tr>' : slowest.map(r => `<tr>
                <td class="mono fw6 sm">${esc(r.sku)}</td>
                <td class="sm" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.vendor_name)}</td>
                <td class="mono fw6" style="color:${r.turn<1?'var(--accent)':'var(--yellow)'};">${r.turn.toFixed(2)}x</td>
                <td class="mono sm">${r.qty_on_hand}</td>
                <td class="mono sm">$${Math.round(r.value).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Dead Stock · ${dead.length} SKUs · $${Math.round(deadValue).toLocaleString()}</span></div>
        <div class="tbl-wrap" style="max-height:300px;overflow-y:auto;">
          <table>
            <thead><tr><th>SKU</th><th>Vendor</th><th>On Hand</th><th>Value</th></tr></thead>
            <tbody>
              ${deadSorted.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-3);">No dead stock — every SKU moved within ' + INV_DEAD_STOCK_DAYS + ' days.</td></tr>' : deadSorted.map(r => `<tr>
                <td class="mono fw6 sm">${esc(r.sku)}</td>
                <td class="sm" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.vendor_name)}</td>
                <td class="mono sm">${r.qty_on_hand}</td>
                <td class="mono fw6" style="color:var(--accent);">$${Math.round(r.value).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${dead.length > 20 ? `<div class="muted sm" style="padding:6px 14px;">+ ${dead.length - 20} more dead SKUs. Export from Reports → Inventory.</div>` : ''}
      </div>
    </div>
  `;
}
