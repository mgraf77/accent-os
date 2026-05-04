// ── COMMISSION TRACKER ──
// Mgmt Dashboard sub-tab. Pure-compute over DEALS[won] grouped by owner_id,
// resolved to user_profiles for display. Configurable commission rate
// persisted in localStorage. No new schema.

const COMMISSION_DEFAULT_RATE = 0.05;   // 5%
const COMMISSION_TIER_THRESHOLDS = [    // accelerator tiers (annual revenue → bonus rate)
  {min: 0, rate: 0.00},
  {min: 250000, rate: 0.005},
  {min: 500000, rate: 0.010},
  {min: 1000000, rate: 0.020}
];

let _commUsers = null;
let _commLoadedAt = 0;
let commFilter = {period:'qtd'};

async function _loadCommUsers(){
  if(_commUsers && (Date.now() - _commLoadedAt < 5*60*1000)) return _commUsers;
  if(typeof sbConfigured !== 'function' || !sbConfigured()){ _commUsers = []; return _commUsers; }
  try{
    const rows = await sbFetch('/user_profiles?select=user_id,email,full_name,role,initials');
    _commUsers = Array.isArray(rows) ? rows : [];
    _commLoadedAt = Date.now();
  }catch(e){ _commUsers = []; }
  return _commUsers;
}

function _commGetRate(){
  const v = parseFloat(localStorage.getItem('aos-comm-rate'));
  return isNaN(v) ? COMMISSION_DEFAULT_RATE : v;
}

function _commSetRate(rate){
  localStorage.setItem('aos-comm-rate', String(rate));
}

function _commPeriodWindow(period){
  const now = new Date();
  let start;
  if(period === 'mtd'){ start = new Date(now.getFullYear(), now.getMonth(), 1); }
  else if(period === 'qtd'){ start = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1); }
  else if(period === 'ytd'){ start = new Date(now.getFullYear(), 0, 1); }
  else if(period === 'ttm'){ start = new Date(now.getFullYear()-1, now.getMonth(), now.getDate()); }
  else if(period === 'all'){ start = new Date(2000, 0, 1); }
  else { start = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1); }
  return {start: start.getTime(), end: Date.now(), label: ({mtd:'Month to date', qtd:'Quarter to date', ytd:'Year to date', ttm:'Trailing 12 months', all:'All time'})[period] || period};
}

async function renderCommissionTracker(c){
  if(!c) return;
  c.innerHTML = `<div class="card" style="padding:24px;text-align:center;color:var(--text-3);">Loading commission data…</div>`;
  await _loadCommUsers();
  _renderCommissionInner(c);
}

function _renderCommissionInner(c){
  const rate = _commGetRate();
  const window = _commPeriodWindow(commFilter.period);
  const won = (typeof DEALS !== 'undefined' ? (DEALS.won || []) : [])
    .filter(d => {
      const t = d.closed_at ? new Date(d.closed_at).getTime()
              : d.updated_at ? new Date(d.updated_at).getTime()
              : 0;
      return t >= window.start && t <= window.end;
    });

  // Aggregate by owner_id
  const byOwner = {};
  won.forEach(d => {
    const key = d.owner_id || '__unassigned';
    const o = byOwner[key] = byOwner[key] || {owner_id: key, deals: 0, revenue: 0, items: []};
    o.deals++;
    o.revenue += Number(d.value)||0;
    o.items.push(d);
  });

  const userById = {};
  (_commUsers||[]).forEach(u => userById[u.user_id] = u);

  const rows = Object.values(byOwner).map(o => {
    const u = userById[o.owner_id];
    const name = u ? (u.full_name || u.email) : (o.owner_id === '__unassigned' ? 'Unassigned' : `User ${String(o.owner_id).slice(0,8)}`);
    const role = u ? u.role : '';
    const baseCommission = o.revenue * rate;
    // Tier accelerator on revenue (annualized for non-YTD windows for fairness)
    const monthsInWindow = Math.max(1, (window.end - window.start) / (30 * 86400000));
    const annualized = o.revenue * (12 / monthsInWindow);
    const tier = COMMISSION_TIER_THRESHOLDS.slice().reverse().find(t => annualized >= t.min) || {rate:0, min:0};
    const accelerator = o.revenue * tier.rate;
    return {
      owner_id: o.owner_id, name, role,
      deals: o.deals, revenue: o.revenue,
      avgDeal: o.deals ? o.revenue / o.deals : 0,
      baseCommission,
      tierRate: tier.rate,
      tierMin: tier.min,
      annualized,
      accelerator,
      total: baseCommission + accelerator
    };
  }).sort((a,b)=>b.revenue-a.revenue);

  const totals = rows.reduce((s,r) => ({deals:s.deals+r.deals, revenue:s.revenue+r.revenue, base:s.base+r.baseCommission, accel:s.accel+r.accelerator, total:s.total+r.total}), {deals:0, revenue:0, base:0, accel:0, total:0});

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Commission Tracker.</strong> Computed from won deals (DEALS.won) grouped by owner_id, resolved to user_profiles for names. Base rate is configurable below — current: <strong>${(rate*100).toFixed(1)}%</strong>. Tier accelerators add on top: $250K annualized ↑ +0.5%, $500K ↑ +1.0%, $1M ↑ +2.0%. Tier qualification uses revenue annualized from the selected window so quarterly views still recognize high performers.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Period</div><div class="stat-value" style="font-size:18px;">${window.label}</div><div class="stat-sub">${new Date(window.start).toLocaleDateString()} → today</div></div>
      <div class="card stat-card"><div class="stat-label">Won Deals</div><div class="stat-value">${totals.deals.toLocaleString()}</div><div class="stat-sub">${rows.length} earner${rows.length===1?'':'s'}</div></div>
      <div class="card stat-card"><div class="stat-label">Revenue</div><div class="stat-value">$${(totals.revenue/1000).toFixed(1)}K</div><div class="stat-sub">Sum of won deal values</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">Total Commission</div><div class="stat-value" style="color:var(--green);">$${Math.round(totals.total).toLocaleString()}</div><div class="stat-sub">Base $${Math.round(totals.base).toLocaleString()} + accel $${Math.round(totals.accel).toLocaleString()}</div></div>
    </div>
    <div class="card mb16">
      <div class="card-hd">
        <span class="card-title">Settings</span>
      </div>
      <div style="padding:12px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:12px;">
        <label style="display:flex;align-items:center;gap:6px;">
          Period:
          <select onchange="commFilter.period=this.value;_renderCommissionInner($('mgmt-content'))" style="padding:5px 8px;font-size:12px;">
            <option value="mtd" ${commFilter.period==='mtd'?'selected':''}>Month to date</option>
            <option value="qtd" ${commFilter.period==='qtd'?'selected':''}>Quarter to date</option>
            <option value="ytd" ${commFilter.period==='ytd'?'selected':''}>Year to date</option>
            <option value="ttm" ${commFilter.period==='ttm'?'selected':''}>Trailing 12 months</option>
            <option value="all" ${commFilter.period==='all'?'selected':''}>All time</option>
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:6px;">
          Base rate %:
          <input type="number" step="0.1" min="0" max="100" value="${(rate*100).toFixed(1)}" onchange="_commSetRate(Number(this.value)/100);_renderCommissionInner($('mgmt-content'))" style="width:70px;padding:4px 6px;font-size:12px;">
        </label>
        <button class="btn btn-outline btn-sm" onclick="_commExportCsv()" style="margin-left:auto;">Export CSV</button>
      </div>
    </div>
    <div class="card">
      <div class="card-hd"><span class="card-title">Per-Salesperson Breakdown · ${rows.length}</span></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Salesperson</th><th>Role</th><th>Deals</th><th>Revenue</th><th>Avg Deal</th><th>Base ${(rate*100).toFixed(1)}%</th><th>Tier Bonus</th><th>Total Commission</th></tr></thead>
          <tbody>
            ${rows.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">No won deals in this window.</td></tr>` : rows.map(r => `<tr>
              <td style="font-weight:600;">${esc(r.name)}</td>
              <td class="sm">${esc(r.role||'')}</td>
              <td class="mono">${r.deals}</td>
              <td class="mono">$${Math.round(r.revenue).toLocaleString()}</td>
              <td class="mono sm">$${Math.round(r.avgDeal).toLocaleString()}</td>
              <td class="mono">$${Math.round(r.baseCommission).toLocaleString()}</td>
              <td class="mono sm">${r.tierRate>0?'+'+(r.tierRate*100).toFixed(1)+'% · $'+Math.round(r.accelerator).toLocaleString():'<span class="muted">—</span>'}</td>
              <td class="mono fw6" style="color:var(--green);">$${Math.round(r.total).toLocaleString()}</td>
            </tr>`).join('')}
          </tbody>
          ${rows.length ? `<tfoot><tr style="font-weight:700;background:var(--bg-2);">
            <td colspan="2">Totals</td>
            <td class="mono">${totals.deals}</td>
            <td class="mono">$${Math.round(totals.revenue).toLocaleString()}</td>
            <td></td>
            <td class="mono">$${Math.round(totals.base).toLocaleString()}</td>
            <td class="mono">$${Math.round(totals.accel).toLocaleString()}</td>
            <td class="mono" style="color:var(--green);">$${Math.round(totals.total).toLocaleString()}</td>
          </tr></tfoot>` : ''}
        </table>
      </div>
    </div>
  `;
}

function _commExportCsv(){
  const rate = _commGetRate();
  const window = _commPeriodWindow(commFilter.period);
  const won = (typeof DEALS !== 'undefined' ? (DEALS.won || []) : [])
    .filter(d => {
      const t = d.closed_at ? new Date(d.closed_at).getTime()
              : d.updated_at ? new Date(d.updated_at).getTime()
              : 0;
      return t >= window.start && t <= window.end;
    });
  if(!won.length){ toast('Nothing to export','err'); return; }
  const userById = {};
  (_commUsers||[]).forEach(u => userById[u.user_id] = u);
  const rows = [['period','salesperson','role','deal_id','customer','value','closed_at','base_rate','base_commission']];
  won.forEach(d => {
    const u = userById[d.owner_id];
    const name = u ? (u.full_name || u.email) : 'Unassigned';
    const t = d.closed_at || d.updated_at || '';
    rows.push([window.label, name, u?.role||'', d.id||'', d.company||d.name||'', d.value||0, t, rate, (Number(d.value)||0)*rate]);
  });
  const csv = rows.map(r => r.map(c => {
    const s = String(c==null?'':c);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `commission_${commFilter.period}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  if(typeof sbAuditLog === 'function') sbAuditLog('commission_export', 'mgmt', {period: commFilter.period, row_count: rows.length-1});
  toast(`Exported ${rows.length-1} rows`,'ok');
}
