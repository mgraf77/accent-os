// Dashboard Daily Brief + sRow helper — extracted from index.html
// computeDailyBrief: pure compute, reads globals, returns briefItems array for dashboard card.
// sRow: System Status row renderer, used by dashboard and health modules.
// Depends on: VD, DEALS, STAGES, CUSTOMERS, QUOTES, COOP_FUNDS, CHANGELOG, JOBS, DELIVERIES,
//             WARRANTY_CLAIMS, ALERTS, INVENTORY, POS, VENDOR_PARENTS, PARENT_COMPANIES,
//             vendorScore, computeVendorTier, weightedScore, computeDealProbability,
//             myTasksDueTodayCount, myTasksOverdueCount, computeDemandForecast (optional)

function computeDailyBrief(role){
  const items = [];
  const isSeniorRole = ['Owner','Admin','Manager'].includes(role);

  // Vendors with unverified score categories (anyone can see)
  const unverifiedVendors = VD.filter(v => {
    const info = vendorScore(v);
    return info.unverifiedCount > 0;
  });
  if(unverifiedVendors.length > 0){
    const topByCount = [...unverifiedVendors].sort((a,b) => vendorScore(b).unverifiedCount - vendorScore(a).unverifiedCount).slice(0,3);
    items.push({
      label: 'Unverified Scores',
      value: `${unverifiedVendors.length} vendors`,
      detail: 'Top: ' + topByCount.map(v => v.name).join(', ').slice(0,60),
      color: '#fef2f2', border: '#fecaca', labelColor: '#991b1b',
      action: `goTo('vendors');setTimeout(()=>{vSection='scores';renderVendors($('pg-content'));},50);`
    });
  }

  // Tier C (not scored) — context, not action
  const tierCounts = {A:0, B:0, C:0};
  VD.forEach(v => { const t = computeVendorTier(v); if(tierCounts[t]!==undefined) tierCounts[t]++; });
  if(tierCounts.C > 0 && isSeniorRole){
    items.push({
      label: 'Tier C Vendors',
      value: `${tierCounts.C}`,
      detail: 'Inactive 24mo+ · review for archival',
      color: '#f9fafb', border: '#e5e7eb', labelColor: '#4b5563'
    });
  }

  // Recent changelog activity (last 24h)
  if(typeof CHANGELOG !== 'undefined' && CHANGELOG.length){
    const dayAgo = Date.now() - 86400000;
    const recent = CHANGELOG.filter(e => new Date(e.ts).getTime() > dayAgo);
    if(recent.length > 0){
      items.push({
        label: 'Activity (24h)',
        value: `${recent.length} edits`,
        detail: recent[0] ? `Latest: ${recent[0].vendor} · ${recent[0].cat}` : '',
        color: '#eff6ff', border: '#bfdbfe', labelColor: '#1e40af',
        action: `goTo('changelog')`
      });
    }
  }

  // Vendors with no rep group (Owner/Admin/Manager)
  if(isSeniorRole){
    const unassigned = VD.filter(v => !v.rep && (v.sales?.t || 0) > 0 && computeVendorTier(v) !== 'C');
    if(unassigned.length > 0){
      items.push({
        label: 'Unassigned Reps',
        value: `${unassigned.length}`,
        detail: `Active vendors with no rep group · M19 in plan`,
        color: '#fffbeb', border: '#fde68a', labelColor: '#92400e',
        action: `goTo('vendors');setTimeout(()=>{vSection='replist';renderVendors($('pg-content'));},50);`
      });
    }
  }

  // Mixed-rep parent groups (Owner/Admin/Manager)
  if(isSeniorRole && typeof PARENT_COMPANIES !== 'undefined' && PARENT_COMPANIES.length){
    let mixedCount = 0;
    PARENT_COMPANIES.forEach(parent => {
      const children = VD.filter(v => VENDOR_PARENTS[v.id] === parent.id);
      if(!children.length) return;
      const reps = [...new Set(children.map(v => v.rep||'').filter(Boolean))];
      if(reps.length > 1) mixedCount++;
    });
    if(mixedCount > 0){
      items.push({
        label: 'Mixed-Rep Parents',
        value: `${mixedCount}`,
        detail: 'Parent groups with conflicting rep assignments',
        color: '#fef3c7', border: '#fcd34d', labelColor: '#92400e',
        action: `goTo('vendors');setTimeout(()=>{vSection='repaudit';renderVendors($('pg-content'));},50);`
      });
    }
  }

  // Stale active deals (no update in 14+ days, non-terminal stages)
  if(typeof DEALS !== 'undefined'){
    const cutoff = Date.now() - 14*86400000;
    const stale = STAGES.flatMap(s => DEALS[s.key]||[]).filter(d => {
      if(!d.updated_at) return false;
      return new Date(d.updated_at).getTime() < cutoff;
    });
    if(stale.length > 0){
      const value = stale.reduce((s,d)=>s+(d.value||0), 0);
      items.push({
        label: 'Stale Deals',
        value: `${stale.length}`,
        detail: `No update 14d+ · $${value.toLocaleString()} stuck`,
        color: '#fffbeb', border: '#fde68a', labelColor: '#92400e',
        action: `goTo('pipeline');`
      });
    }

    // Closing this week (expected_close within next 7 days, non-terminal)
    const now = Date.now();
    const weekOut = now + 7*86400000;
    const closing = STAGES.flatMap(s => DEALS[s.key]||[]).filter(d => {
      if(!d.close) return false;
      const t = new Date(d.close).getTime();
      return t >= now && t <= weekOut;
    });
    if(closing.length > 0){
      const fc = closing.reduce((s,d) => {
        const p = (d.probability!=null) ? d.probability : computeDealProbability(d).prob;
        return s + (d.value||0) * (p/100);
      }, 0);
      items.push({
        label: 'Closing ≤7d',
        value: `${closing.length}`,
        detail: `Forecast $${Math.round(fc).toLocaleString()}`,
        color: '#eff6ff', border: '#bfdbfe', labelColor: '#1e40af',
        action: `goTo('pipeline');`
      });
    }
  }

  // Stale draft quotes (saved >7d ago, never sent)
  if(typeof QUOTES !== 'undefined' && QUOTES.length){
    const cutoff = Date.now() - 7*86400000;
    const staleQuotes = QUOTES.filter(q => {
      if(!q.date) return false;
      const t = new Date(q.date).getTime();
      return !isNaN(t) && t < cutoff;
    });
    if(staleQuotes.length > 0 && (role==='Sales' || isSeniorRole)){
      const value = staleQuotes.reduce((s,q) => s + (q.total||0), 0);
      items.push({
        label: 'Stale Quotes',
        value: `${staleQuotes.length}`,
        detail: `>7d old · $${Math.round(value).toLocaleString()} unfollowed`,
        color: '#fef3c7', border: '#fcd34d', labelColor: '#92400e',
        action: `goTo('quotes');setTimeout(()=>showSaved(),50);`
      });
    }
  }

  // Coop fund deadlines (≤30 days, status=open)
  if(typeof COOP_FUNDS !== 'undefined' && COOP_FUNDS.length){
    const today = new Date(); today.setHours(0,0,0,0);
    const atRisk = COOP_FUNDS.filter(r => {
      if(r.status !== 'open' || !r.deadline) return false;
      const days = Math.round((new Date(r.deadline) - today)/86400000);
      return days >= 0 && days <= 30;
    });
    if(atRisk.length > 0){
      const value = atRisk.reduce((s,r) => s + (Number(r.amount)||0), 0);
      items.push({
        label: 'Co-op Deadlines',
        value: `${atRisk.length}`,
        detail: `$${value.toLocaleString()} at risk in next 30 days`,
        color: '#fef2f2', border: '#fecaca', labelColor: '#991b1b',
        action: `goTo('vendors');setTimeout(()=>{vSection='coop';renderVendors($('pg-content'));},50);`
      });
    }
  }

  // Avg score health gauge (everyone)
  const avg = (() => {
    const s = VD.map(v=>weightedScore(v)).filter(x=>x!==null);
    return s.length ? (s.reduce((a,b)=>a+b,0)/s.length) : null;
  })();
  if(avg !== null){
    items.push({
      label: 'Avg Vendor Score',
      value: avg.toFixed(1),
      detail: avg >= 7 ? 'Healthy' : avg >= 5 ? 'Mid-tier' : 'Below target',
      color: '#f0fdf4', border: '#bbf7d0', labelColor: '#166534'
    });
  }

  // ── New-module Daily Brief tiles (Track 6.8 polish) ──
  const today = new Date(); today.setHours(0,0,0,0);
  const todayMs = today.getTime();
  const day = 86400000;

  // Unread alerts (everyone)
  if(typeof ALERTS !== 'undefined' && ALERTS.length){
    const unread = ALERTS.filter(a => a.status === 'unread');
    if(unread.length > 0){
      const urgent = unread.filter(a => a.severity === 'urgent').length;
      items.push({
        label: 'Unread Alerts',
        value: `${unread.length}`,
        detail: urgent > 0 ? `${urgent} urgent · click to view` : 'Auto-generated from your data',
        color: urgent > 0 ? '#fef2f2' : '#fef3c7',
        border: urgent > 0 ? '#fecaca' : '#fcd34d',
        labelColor: urgent > 0 ? '#991b1b' : '#92400e',
        action: `goTo('alerts')`
      });
    }
  }

  // Deliveries today + overdue (Sales/Warehouse + senior)
  if(typeof DELIVERIES !== 'undefined' && DELIVERIES.length){
    const todayStr = today.toISOString().slice(0,10);
    const todayDel = DELIVERIES.filter(d => !['delivered','cancelled'].includes(d.status) && d.scheduled_date === todayStr);
    const overdueDel = DELIVERIES.filter(d => !['delivered','cancelled'].includes(d.status) && d.scheduled_date && d.scheduled_date < todayStr);
    const total = todayDel.length + overdueDel.length;
    if(total > 0){
      items.push({
        label: 'Deliveries',
        value: `${total}`,
        detail: `${todayDel.length} today${overdueDel.length?' · '+overdueDel.length+' overdue':''}`,
        color: overdueDel.length > 0 ? '#fef2f2' : '#eff6ff',
        border: overdueDel.length > 0 ? '#fecaca' : '#bfdbfe',
        labelColor: overdueDel.length > 0 ? '#991b1b' : '#1e40af',
        action: `goTo('deliveries')`
      });
    }
  }

  // Jobs due ≤7d (everyone)
  if(typeof JOBS !== 'undefined' && JOBS.length){
    const cutoff = todayMs + 7*day;
    const dueSoon = JOBS.filter(j => {
      if(['complete','cancelled'].includes(j.status)) return false;
      if(!j.due_date) return false;
      const t = new Date(j.due_date).getTime();
      return t >= todayMs && t <= cutoff;
    });
    if(dueSoon.length > 0){
      items.push({
        label: 'Jobs Due ≤7d',
        value: `${dueSoon.length}`,
        detail: dueSoon[0] ? `Next: ${dueSoon[0].project_name}` : '',
        color: '#fffbeb', border: '#fde68a', labelColor: '#92400e',
        action: `goTo('jobs')`
      });
    }
  }

  // Warranties expiring ≤30d (senior + Sales)
  if(isSeniorRole && typeof WARRANTY_CLAIMS !== 'undefined' && WARRANTY_CLAIMS.length){
    const cutoff = todayMs + 30*day;
    const expiring = WARRANTY_CLAIMS.filter(w => {
      if(['closed','denied','replaced','refunded'].includes(w.status)) return false;
      if(!w.warranty_expires) return false;
      const t = new Date(w.warranty_expires).getTime();
      return t >= todayMs && t <= cutoff;
    });
    if(expiring.length > 0){
      items.push({
        label: 'Warranty Expiring',
        value: `${expiring.length}`,
        detail: `≤30d to file claims`,
        color: '#fef3c7', border: '#fcd34d', labelColor: '#92400e',
        action: `goTo('warranty')`
      });
    }
  }

  // POs past expected (senior only)
  if(isSeniorRole && typeof POS !== 'undefined' && POS.length){
    const overdue = POS.filter(p => {
      if(['received','cancelled'].includes(p.status)) return false;
      if(!p.expected_date) return false;
      return new Date(p.expected_date).getTime() < todayMs;
    });
    if(overdue.length > 0){
      const value = overdue.reduce((s,p)=>s+(Number(p.total)||0), 0);
      items.push({
        label: 'POs Past Expected',
        value: `${overdue.length}`,
        detail: `$${Math.round(value).toLocaleString()} pending receipt`,
        color: '#fef2f2', border: '#fecaca', labelColor: '#991b1b',
        action: `goTo('purchaseorders')`
      });
    }
  }

  // Inventory low (everyone — warehouse cares most)
  if(typeof INVENTORY !== 'undefined' && INVENTORY.length){
    const low = INVENTORY.filter(r => r.reorder_point != null && (Number(r.qty_available)||0) < Number(r.reorder_point));
    if(low.length > 0){
      const out = low.filter(r => (Number(r.qty_available)||0) === 0).length;
      items.push({
        label: 'Low Stock',
        value: `${low.length}`,
        detail: out > 0 ? `${out} out of stock · reorder needed` : 'Below reorder point',
        color: out > 0 ? '#fef2f2' : '#fffbeb',
        border: out > 0 ? '#fecaca' : '#fde68a',
        labelColor: out > 0 ? '#991b1b' : '#92400e',
        action: `goTo('vendors');setTimeout(()=>{vSection='inventory';renderVendors($('pg-content'));},50);`
      });
    }
  }

  // My Tasks — due today + overdue (everyone, personal)
  if(typeof myTasksDueTodayCount === 'function'){
    const dueToday = myTasksDueTodayCount();
    const overdue = myTasksOverdueCount();
    if(dueToday > 0 || overdue > 0){
      const isOverdue = overdue > 0;
      items.push({
        label: 'My Tasks',
        value: isOverdue ? `${overdue}` : `${dueToday}`,
        detail: isOverdue
          ? `${overdue} overdue${dueToday?` · ${dueToday} due today`:''}`
          : `${dueToday} due today`,
        color: isOverdue ? '#fef2f2' : '#fffbeb',
        border: isOverdue ? '#fecaca' : '#fde68a',
        labelColor: isOverdue ? '#991b1b' : '#92400e',
        action: `goTo('mytasks')`
      });
    }
  }

  // Reorder Now from Demand Forecast (senior only — purchasing decision)
  if(isSeniorRole && typeof computeDemandForecast === 'function' && typeof INVENTORY !== 'undefined' && INVENTORY.length){
    try {
      const forecast = computeDemandForecast();
      const reorderNow = forecast.filter(r => r.kind === 'reorder_now');
      if(reorderNow.length > 0){
        const totalValue = reorderNow.reduce((s,r) => s + ((r.suggested_qty||0) * (r.unit_cost||0)), 0);
        items.push({
          label: 'Reorder Now',
          value: `${reorderNow.length}`,
          detail: totalValue ? `$${Math.round(totalValue).toLocaleString()} suggested PO` : 'Below reorder threshold',
          color: '#fef2f2', border: '#fecaca', labelColor: '#991b1b',
          action: `goTo('demandforecast')`
        });
      }
    } catch(e) { /* forecast not yet ready */ }
  }

  return items;
}

// System Status row — used by dashboard System Status card and health module.
function sRow(label,status,note){
  const map={live:['dot-g','Live'],pending:['dot-y','Pending'],planned:['dot-gr','Planned']};
  const[cls,txt]=map[status]||['dot-gr',status];
  return`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light);gap:9px;"><span class="dot ${cls}"></span><span style="font-size:13.5px;font-weight:500;">${label}</span><span class="badge bg-${status==='live'?'green':status==='pending'?'yellow':'gray'}" style="margin-left:auto;">${txt}</span><span style="font-size:12px;color:var(--text-3);min-width:160px;text-align:right;">${note}</span></div>`;
}
