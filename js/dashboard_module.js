// ── DASHBOARD MODULE (extracted from index.html at v6.11.1) ──
register({ name: 'dashboard_module', provides: ['dashboard','computeDailyBrief'], consumes: ['DEALS','VD','STAGES','CU','weightedScore','CHANGELOG','CAT_DEFS','esc'] });

// ── DASHBOARD ─────────────────────────────────────────────
function dashboard(el){
  const allDeals=Object.values(DEALS).flat();
  const tv=allDeals.reduce((s,d)=>s+(d.value||0),0);
  const scoredV=VD.filter(v=>weightedScore(v)!==null);
  const avgScore=scoredV.length?(scoredV.reduce((s,v)=>s+weightedScore(v),0)/scoredV.length).toFixed(1):null;

  // ── Daily Command Center brief (Track 1.3 partial — uses existing tables only) ──
  const role = CU?.role || '';
  const briefItems = computeDailyBrief(role);

  el.innerHTML=`
  <div class="card mb16" style="border-left:3px solid var(--accent);">
    <div class="card-hd">
      <span class="card-title">📌 Today · ${esc(role||'Welcome')}, ${esc(CU?.name?.split(' ')[0]||'')}</span>
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="showDailyDigest()" title="Generate plaintext email digest">✉️ Email digest</button>
        <span class="sm muted">${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</span>
      </div>
    </div>
    <div class="card-body">
      ${briefItems.length===0 ? `<div style="color:var(--text-3);font-size:13.5px;">All clear. No outstanding items today.</div>` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
          ${briefItems.map(b => `
            <div style="background:${b.color||'var(--surface2)'};border:1px solid ${b.border||'var(--border)'};border-radius:8px;padding:11px 13px;cursor:${b.action?'pointer':'default'};" ${b.action?`onclick="${b.action}"`:''}>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${b.labelColor||'var(--text-3)'};margin-bottom:4px;">${esc(b.label)}</div>
              <div style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace;line-height:1.1;">${esc(b.value)}</div>
              <div style="font-size:11.5px;color:var(--text-2);margin-top:3px;">${esc(b.detail||'')}</div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  </div>

  ${renderRoleSpecificDashboard(role, allDeals, tv, scoredV, avgScore)}
  `;
}

// Track 3.2 — Role-Based Dashboards. Per-role landing content below the Daily Brief.
function renderRoleSpecificDashboard(role, allDeals, tv, scoredV, avgScore){
  const isSenior = ['Owner','Admin','Manager'].includes(role);
  const isSales = role === 'Sales';
  const isWarehouse = role === 'Warehouse';

  if(isWarehouse){
    // Warehouse: minimal — inventory placeholder + recent activity
    return `
      <div class="g2 mb16">
        <div class="card"><div class="card-hd"><span class="card-title">Inventory</span></div><div class="card-body">
          <div style="font-size:13px;color:var(--text-2);line-height:1.6;">Inventory live data is gated on Track 6.11 (Windward S5WebAPI integration). Until then, Inventory tab shows reference-only data.</div>
          <div style="margin-top:14px;"><button class="btn btn-outline btn-sm" onclick="goTo('vendors');setTimeout(()=>{vSection='inventory';renderVendors($('pg-content'));},50);">📦 View inventory data</button></div>
        </div></div>
        <div class="card"><div class="card-hd"><span class="card-title">Recent Activity</span></div><div class="card-body">
          ${(CHANGELOG||[]).slice(0,8).map(e=>`<div style="font-size:12.5px;padding:6px 0;border-bottom:1px solid var(--border-light);"><strong>${esc(e.vendor)}</strong> · ${esc(e.cat||'')} <span class="muted sm">${esc(e.user||'')}</span></div>`).join('') || '<div class="muted sm">No recent changes.</div>'}
        </div></div>
      </div>
    `;
  }

  if(isSales){
    // Sales: my deals, my quotes, vendor quick-access
    const myDeals = STAGES.flatMap(s => DEALS[s.key]||[]).filter(d => !d.owner_id || d.owner_id === CU?.user_id);
    const myQuotes = QUOTES.filter(q => true);  // owner filter when quotes have created_by
    const myActiveValue = myDeals.reduce((s,d) => s+(d.value||0), 0);
    const myForecast = myDeals.reduce((s,d) => {
      const p = (d.probability!=null) ? d.probability : computeDealProbability(d).prob;
      return s + (d.value||0) * (p/100);
    }, 0);
    return `
      <div class="g4 mb16">
        <div class="card stat-card"><div class="stat-label">My Active Deals</div><div class="stat-value">${myDeals.length}</div><div class="stat-sub">$${myActiveValue.toLocaleString()} value</div></div>
        <div class="card stat-card"><div class="stat-label">My Forecast</div><div class="stat-value" style="color:var(--green);">$${Math.round(myForecast).toLocaleString()}</div><div class="stat-sub">Σ value × probability</div></div>
        <div class="card stat-card"><div class="stat-label">My Quotes</div><div class="stat-value">${myQuotes.length}</div><div class="stat-sub">Saved</div></div>
        <div class="card stat-card"><div class="stat-label">Vendors</div><div class="stat-value">${VD.length}</div><div class="stat-sub">${scoredV.length} scored</div></div>
      </div>
      <div class="g2 mb16">
        <div class="card"><div class="card-hd"><span class="card-title">Quick Actions</span></div><div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;">
            <button class="btn btn-accent btn-lg" style="width:100%;justify-content:center;" onclick="goTo('quotes')">✏ New Quote</button>
            <button class="btn btn-outline btn-lg" style="width:100%;justify-content:center;" onclick="goTo('pipeline')">+ Add Deal</button>
            <button class="btn btn-outline btn-lg" style="width:100%;justify-content:center;" onclick="goTo('vendors')">📊 Vendors</button>
            <button class="btn btn-outline btn-lg" style="width:100%;justify-content:center;" onclick="goTo('knowledge')">⚡ Ask Engine</button>
          </div>
        </div></div>
        <div class="card"><div class="card-hd"><span class="card-title">My Open Deals</span></div><div class="card-body">
          ${myDeals.slice(0,6).map(d => {
            const p = (d.probability!=null)?d.probability:computeDealProbability(d).prob;
            return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border-light);font-size:12.5px;cursor:pointer;" onclick="openDeal('${d.id}','${d.stage}')">
              <span style="font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(d.name)}</span>
              <span class="badge bg-gray" style="font-size:10px;">${d.stage}</span>
              <span class="mono" style="color:${probColor(p)};font-weight:700;">${p}%</span>
              <span class="mono" style="font-weight:600;">$${(d.value||0).toLocaleString()}</span>
            </div>`;
          }).join('') || '<div class="muted sm">No deals yet — click "Add Deal" to start.</div>'}
        </div></div>
      </div>
    `;
  }

  // Owner / Admin / Manager: original wide view
  return `
  <div class="g4 mb16">
    <div class="card stat-card"><div class="stat-label">Active Pipeline</div><div class="stat-value">$${tv.toLocaleString()}</div><div class="stat-sub">${allDeals.length} deals</div></div>
    <div class="card stat-card"><div class="stat-label">Quotes Saved</div><div class="stat-value">${QUOTES.length}</div><div class="stat-sub">All time</div></div>
    <div class="card stat-card"><div class="stat-label">Vendors Tracked</div><div class="stat-value">${VD.length}</div><div class="stat-sub">${scoredV.length} with scores</div></div>
    <div class="card stat-card"><div class="stat-label">Avg Vendor Score</div><div class="stat-value">${avgScore||'—'}</div><div class="stat-sub">Scored vendors only</div></div>
  </div>
  <div class="g2 mb16">
    <div class="card"><div class="card-hd"><span class="card-title">Quick Actions</span></div><div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;">
        <button class="btn btn-accent btn-lg" style="width:100%;justify-content:center;" onclick="goTo('quotes')">✏ New Quote</button>
        <button class="btn btn-outline btn-lg" style="width:100%;justify-content:center;" onclick="goTo('pipeline')">+ Add Deal</button>
        ${isSenior?`<button class="btn btn-outline btn-lg" style="width:100%;justify-content:center;" onclick="goTo('mgmt')">📈 Owner View</button>`:''}
        <button class="btn btn-outline btn-lg" style="width:100%;justify-content:center;" onclick="goTo('vendors')">📊 Vendor Scores</button>
      </div>
    </div></div>
    <div class="card"><div class="card-hd"><span class="card-title">System Status</span></div><div class="card-body">
      ${sRow('AccentOS','live','v6.10.x · Cloudflare Pages')}
      ${sRow('Auth','live','Supabase Auth · 5 roles · audit_log')}
      ${sRow('Vendor Ranking','live','478 vendors · vendor_scores + vendor_score_states')}
      ${sRow('Pipeline','live','pipeline_deals · 8-factor probability model')}
      ${sRow('Quotes','live','quotes + quote_lines persistence')}
      ${sRow('Co-op Tracker','live','coop_tracker · deadline alerts')}
      ${sRow('Anthropic API',getS('aos-api')?'live':'pending',getS('aos-api')?'Key configured':'Add in Settings')}
    </div></div>
  </div>
  <div class="g2">
    <div class="card"><div class="card-hd"><span class="card-title">Score Coverage by Category</span></div><div class="card-body">
      ${CAT_DEFS.map(c=>{
        const scored=VD.filter(v=>typeof v.scores[c.key]==='number').length;
        const pct=Math.round((scored/VD.length)*100);
        const w=c.weight;
        return`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12.5px;font-weight:600;">${c.label} <span class="muted" style="font-weight:400;">(wt:${w})</span></span><span class="mono sm muted">${scored}/${VD.length}</span></div><div class="pbar"><div class="pfill" style="width:${pct}%;background:${pct===100?'var(--green)':'var(--blue)'}"></div></div></div>`;
      }).join('')}
    </div></div>
    <div class="card"><div class="card-hd"><span class="card-title">Top Vendors by Score</span></div><div class="card-body">
      ${(()=>{const sv=VD.map(v=>({...v,ws:weightedScore(v)})).filter(v=>v.ws!==null).sort((a,b)=>b.ws-a.ws).slice(0,8);
      return sv.map((v,i)=>`<div style="margin-bottom:9px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span class="mono sm muted">${i+1}</span><span style="font-size:13px;font-weight:600;cursor:pointer;color:var(--accent);" onclick="openVendorDetail(${v.id})">${esc(v.name)}</span><span style="margin-left:auto;">${tierBadge(tier(v.ws))}</span><span class="mono" style="font-size:13px;font-weight:700;color:${scoreColor(v.ws)};min-width:28px;text-align:right;">${v.ws}</span></div><div class="pbar"><div class="pfill" style="width:${Math.round((v.ws/10)*100)}%;background:${scoreColor(v.ws)};"></div></div></div>`).join('');})()}
    </div></div>
  </div>`;
}
// Track 1.3 Daily Command Center — computes the brief items shown at top of dashboard.
// Role-aware: Sales/Warehouse see fewer items than Owner/Admin/Manager.
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

  // ── New-module Daily Brief tiles (Track 6.8 polish — surface module activity from the dashboard) ──
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

function sRow(label,status,note){
  const map={live:['dot-g','Live'],pending:['dot-y','Pending'],planned:['dot-gr','Planned']};
  const[cls,txt]=map[status]||['dot-gr',status];
  return`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light);gap:9px;"><span class="dot ${cls}"></span><span style="font-size:13.5px;font-weight:500;">${label}</span><span class="badge bg-${status==='live'?'green':status==='pending'?'yellow':'gray'}" style="margin-left:auto;">${txt}</span><span style="font-size:12px;color:var(--text-3);min-width:160px;text-align:right;">${note}</span></div>`;
}

// ── MARKETING ─────────────────────────────────────────────
// marketing() — moved to js/marketing.js (Track 5.12 v6.10.20)

// ── ROADMAP ───────────────────────────────────────────────
function roadmap(el){el.innerHTML=`
  <div class="g2 mb16">
    <div class="card stat-card"><div class="stat-label">Version</div><div class="stat-value mono">v6.9</div><div class="stat-sub">${new Date().toLocaleDateString()}</div></div>
    <div class="card stat-card"><div class="stat-label">Hosting</div><div class="stat-value" style="font-size:18px;">Cloudflare</div><div class="stat-sub">Pages — free, unlimited bandwidth</div></div>
  </div>
  <div class="card mb16"><div class="card-hd"><span class="card-title">v6.9 — This Build</span><span class="badge bg-green">Current</span></div><div class="card-body">
    ${[[1,'Parent company / umbrella grouping — 10 corporate parents, 39 vendor assignments live in Supabase'],[1,'Group by Parent toggle on Scores tab — collapsible parent groups with rolled-up combined sales + average score'],[1,'Apply to Sister Brands button on Edit Scores — propagates a score set to every vendor under the same parent in one click, with full changelog tracking'],[1,'Independent vendors render as a separate section below grouped parents'],[1,'Visual Comfort Group, Hudson Valley Lighting Group, Minka Group, Hinkley, WAC Group, Maxim Group, Coleto Brands, Acuity Brands, Current, Hunter Fan all mapped'],[0,'Score persistence to Supabase (vendor_scores table) — coming v6.10'],[0,'Vendor metadata persistence (vendor_overrides table) — coming v6.11']].map(([d,l])=>`<div class="chk"><span class="chk-ico">${d?'✅':'⬜'}</span><span class="${d?'done':''}">${l}</span></div>`).join('')}
  </div></div>

  <div class="card mb16"><div class="card-hd"><span class="card-title">v6.8 — Previous Build</span><span class="badge bg-amber">Shipped</span></div><div class="card-body">
    ${[[1,'Supabase persistence — categories + changelog write to and read from Supabase'],[1,'Confidence ratings (H/M/L) purged — removed from data and UI'],[1,'Vendor Intelligence renamed to Vendor Ranking'],[1,'Product categories pre-filled from Vendor Profiles sheet (102 vendors mapped, 98 IDs matched)'],[1,'History tab repurposed — vendor profile event timeline'],[1,'Sales chart redesigned — clean SVG line chart with Y-axis, dollar labels, area fill'],[1,'Edit Scores modal — manual data entry per category with rubric-suggested scores'],[1,'Advanced Filter button — multi-criteria (rep, category, tier, status, sales, score, scored cats, trend)'],[1,'Heatmap score cells — colored boxes with numbers'],[1,'Column header tooltips — rubric summary on hover for every category'],[1,'Scoring System modal cleaned up — condensed ~50%, "Rebates 10.0%" format fixed'],[1,'Weight Scenario Builder moved to its own ⚖️ Weight Scenarios modal'],[1,'Generate Outreach Email button on Rep View — drafts editable email per rep with all vendor terms'],[0,'Score edits not yet writing to Supabase (in-memory only — coming next)'],[0,'Email send integration (mailto only — no direct Gmail send yet)']].map(([d,l])=>`<div class="chk"><span class="chk-ico">${d?'✅':'⬜'}</span><span class="${d?'done':''}">${l}</span></div>`).join('')}
  </div></div>
  <div class="card mb16"><div class="card-hd"><span class="card-title">Supabase SQL — Run These</span></div><div class="card-body">
    <div class="raw-block">-- Feedback table\nCREATE TABLE feedback (\n  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n  page text, type text, message text,\n  user_name text,\n  submitted_at timestamptz DEFAULT now()\n);\nALTER TABLE feedback ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "anon_insert" ON feedback FOR INSERT TO anon WITH CHECK (true);\nCREATE POLICY "admin_read" ON feedback FOR SELECT TO authenticated USING (true);</div>
  </div></div>
  <div class="card"><div class="card-hd"><span class="card-title">Open Loops</span></div><div class="card-body">
    ${[['Search Demand','Upload Locally Lit keyword files → score all 23 vendors on highest-weight category'],['Cloudflare Deploy','Direct upload index.html to accent-os project on Cloudflare Pages'],['Supabase','Run feedback SQL → add URL + key in Settings'],['Tiers','Finish scoring → assign A/B/C/D/F based on weighted scores'],['Auth','Replace hardcoded credentials with Supabase Auth before wider rollout'],['GitHub','Connect business account (michaelg@accentlightinginc.com) for auto-deploy']].map(([t,d])=>`<div class="chk"><span class="badge bg-yellow" style="flex-shrink:0;font-size:10px;">${t}</span><span style="font-size:13.5px;">${d}</span></div>`).join('')}
  </div></div>`;}

