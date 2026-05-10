// ── HEALTH CHECK ──
// Owner+Admin diagnostic page. Shows data hydration status across every
// module (which globals are loaded, row counts, sample timestamps), schema
// presence (does the underlying Supabase table exist), and current version
// strings. No new schema, no API beyond a read-only ping per table.
register({ name: 'health', provides: ['health'], consumes: ['sbFetch'] });

let _hcResults = null;
let _hcLastRun = 0;

const HC_TABLES = [
  {name:'vendor_scores', global:'VD', countFn: () => (typeof VD!=='undefined'?VD.length:0)},
  {name:'vendor_overrides', global:null, countFn: () => (typeof VD!=='undefined'?VD.filter(v => v.tier_override || v.inactive).length:'—')},
  {name:'vendor_changelog', global:'CHANGELOG', countFn: () => (typeof CHANGELOG!=='undefined'?CHANGELOG.length:0)},
  {name:'parent_companies', global:'PARENT_COMPANIES', countFn: () => (typeof PARENT_COMPANIES!=='undefined'?PARENT_COMPANIES.length:0)},
  {name:'customers', global:'CUSTOMERS', countFn: () => (typeof CUSTOMERS!=='undefined'?CUSTOMERS.length:0)},
  {name:'customer_interactions', global:'CUSTOMER_INTERACTIONS', countFn: () => (typeof CUSTOMER_INTERACTIONS!=='undefined'?Object.values(CUSTOMER_INTERACTIONS).reduce((s,a)=>s+(a||[]).length,0):0)},
  {name:'quotes', global:'QUOTES', countFn: () => (typeof QUOTES!=='undefined'?QUOTES.length:0)},
  {name:'pipeline_deals', global:'DEALS', countFn: () => (typeof DEALS!=='undefined'?Object.values(DEALS).reduce((s,a)=>s+(a||[]).length,0):0)},
  {name:'pipeline_events', global:'AF_PIPELINE', countFn: () => (typeof AF_PIPELINE!=='undefined'?AF_PIPELINE.length:'lazy')},
  {name:'audit_log', global:'AF_AUDITS', countFn: () => (typeof AF_AUDITS!=='undefined'?AF_AUDITS.length:'lazy')},
  {name:'employees', global:null, countFn: () => '—', schemaCheck:true},
  {name:'employee_scores', global:null, countFn: () => '—', schemaCheck:true},
  {name:'goals', global:null, countFn: () => '—', schemaCheck:true},
  {name:'kpi_definitions', global:null, countFn: () => '—', schemaCheck:true},
  {name:'kpi_snapshots', global:null, countFn: () => '—', schemaCheck:true},
  {name:'alerts', global:'ALERTS', countFn: () => (typeof ALERTS!=='undefined'?ALERTS.length:0)},
  {name:'coop_tracker', global:'COOP_FUNDS', countFn: () => (typeof COOP_FUNDS!=='undefined'?COOP_FUNDS.length:0)},
  {name:'inventory_items', global:'INVENTORY', countFn: () => (typeof INVENTORY!=='undefined'?INVENTORY.length:0)},
  {name:'purchase_orders', global:'POS', countFn: () => (typeof POS!=='undefined'?POS.length:0)},
  {name:'po_lines', global:'PO_LINES', countFn: () => (typeof PO_LINES!=='undefined'?Object.values(PO_LINES).reduce((s,a)=>s+(a||[]).length,0):0)},
  {name:'jobs', global:'JOBS', countFn: () => (typeof JOBS!=='undefined'?JOBS.length:0)},
  {name:'articles', global:'ARTICLES', countFn: () => (typeof ARTICLES!=='undefined'?ARTICLES.length:0)},
  {name:'calendar_events', global:'CAL_EVENTS', countFn: () => (typeof CAL_EVENTS!=='undefined'?CAL_EVENTS.length:0)},
  {name:'trade_partners', global:'TRADE_PARTNERS', countFn: () => (typeof TRADE_PARTNERS!=='undefined'?TRADE_PARTNERS.length:0)},
  {name:'warranty_claims', global:'WARRANTY_CLAIMS', countFn: () => (typeof WARRANTY_CLAIMS!=='undefined'?WARRANTY_CLAIMS.length:0)},
  {name:'showroom_displays', global:'SHOWROOM_DISPLAYS', countFn: () => (typeof SHOWROOM_DISPLAYS!=='undefined'?SHOWROOM_DISPLAYS.length:0)},
  {name:'label_batches', global:null, countFn: () => '—', schemaCheck:true, optional:true},
  {name:'deliveries', global:'DELIVERIES', countFn: () => (typeof DELIVERIES!=='undefined'?DELIVERIES.length:0)},
  {name:'competitor_prices', global:null, countFn: () => '—', schemaCheck:true},
  {name:'marketing_campaigns', global:'MARKETING_CAMPAIGNS', countFn: () => (typeof MARKETING_CAMPAIGNS!=='undefined'?MARKETING_CAMPAIGNS.length:0)},
  {name:'marketing_assets', global:'MARKETING_ASSETS', countFn: () => (typeof MARKETING_ASSETS!=='undefined'?MARKETING_ASSETS.length:0)},
];

async function _hcSchemaCheck(table){
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return {exists:false, msg:'no Supabase'};
  try{
    await sbFetch(`/${table}?select=count&limit=0`, {headers:{'Prefer':'count=exact'}});
    return {exists:true, msg:'ok'};
  }catch(e){
    if(/relation .* does not exist|404|PGRST/i.test(e.message||'')){
      return {exists:false, msg:'table missing'};
    }
    return {exists:false, msg:e.message?.slice(0, 60) || 'err'};
  }
}

async function health(c, actions){
  if(!c) return;
  if(actions){
    actions.innerHTML = `<button class="btn btn-outline btn-sm" onclick="_hcRun(true)" title="Re-run schema checks">Refresh</button>`;
  }
  if(!_hcResults || (Date.now() - _hcLastRun > 5*60*1000)){
    c.innerHTML = `<div class="card" style="padding:24px;text-align:center;color:var(--text-3);">Running schema checks…</div>`;
    await _hcRun(false);
  }
  _renderHealth(c);
}

async function _hcRun(forceRender){
  const results = {};
  // Only schema-check the small set marked schemaCheck (others are inferred from globals)
  await Promise.all(HC_TABLES.filter(t => t.schemaCheck).map(async t => {
    results[t.name] = await _hcSchemaCheck(t.name);
  }));
  _hcResults = results;
  _hcLastRun = Date.now();
  if(forceRender) _renderHealth($('pg-content'));
}

function _renderHealth(c){
  if(!c) return;
  const rows = HC_TABLES.map(t => {
    const count = t.countFn();
    let status = 'ok', detail = '';
    if(t.schemaCheck && _hcResults && _hcResults[t.name]){
      const r = _hcResults[t.name];
      status = r.exists ? 'ok' : 'missing';
      detail = r.msg;
    } else if(typeof count === 'number'){
      if(count === 0) { status = t.optional ? 'empty' : 'empty'; }
      else status = 'ok';
    } else if(count === 'lazy'){
      status = 'lazy';
      detail = 'loaded on demand';
    } else if(count === '—'){
      status = 'unknown';
    }
    return {table: t.name, global: t.global, count, status, detail, optional: t.optional};
  });

  // Aggregate stats
  const okCount = rows.filter(r => r.status === 'ok').length;
  const missingCount = rows.filter(r => r.status === 'missing').length;
  const emptyCount = rows.filter(r => r.status === 'empty').length;
  const lazyCount = rows.filter(r => r.status === 'lazy').length;

  const sbOk = (typeof sbConfigured === 'function' && sbConfigured());
  const user = (typeof CU !== 'undefined' && CU) ? CU : null;
  const lastRun = _hcLastRun ? new Date(_hcLastRun).toLocaleTimeString() : '—';

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>System Health Check.</strong> Diagnostic view — what's loaded, what's missing, what's lazy. Useful for "why doesn't X show data?" debugging. Schema checks run on demand against the marked tables; the rest are inferred from in-memory globals.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"${sbOk?'':' style="border-left:3px solid var(--accent);"'}><div class="stat-label">Supabase</div><div class="stat-value" style="font-size:18px;color:${sbOk?'var(--green)':'var(--accent)'};">${sbOk?'Connected':'Not configured'}</div><div class="stat-sub">${user?(user.email||'—'):'no session'}</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">Tables OK</div><div class="stat-value" style="color:var(--green);">${okCount}</div><div class="stat-sub">Have data + schema</div></div>
      <div class="card stat-card"${missingCount?' style="border-left:3px solid var(--accent);"':''}><div class="stat-label">Schema Missing</div><div class="stat-value" style="color:${missingCount?'var(--accent)':'var(--text)'};">${missingCount}</div><div class="stat-sub">Run pending M-tasks</div></div>
      <div class="card stat-card"><div class="stat-label">Empty / Lazy</div><div class="stat-value">${emptyCount}+${lazyCount}</div><div class="stat-sub">No rows loaded yet</div></div>
    </div>
    <div class="card mb16">
      <div class="card-hd">
        <span class="card-title">Tables · Globals · Status</span>
        <span class="muted sm">Last refresh: ${lastRun}</span>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 380px);overflow-y:auto;">
        <table>
          <thead><tr><th>Table</th><th>Global</th><th>Count</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>
            ${rows.map(r => {
              const statusColor = ({ok:'var(--green)', missing:'var(--accent)', empty:'var(--yellow)', lazy:'var(--blue)', unknown:'var(--text-3)'})[r.status] || 'var(--text-3)';
              return `<tr ${r.status==='missing'?'style="background:rgba(239,68,68,0.04);"':''}>
                <td class="mono fw6">${esc(r.table)}${r.optional?' <span class="muted sm">(optional)</span>':''}</td>
                <td class="mono sm">${r.global || '—'}</td>
                <td class="mono">${r.count}</td>
                <td><span class="badge" style="background:${statusColor};color:#fff;font-size:10px;text-transform:uppercase;">${r.status}</span></td>
                <td class="sm" style="color:var(--text-2);">${esc(r.detail || (r.status==='ok' && typeof r.count==='number' && r.count>0 ? 'loaded' : ''))}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-hd"><span class="card-title">Build Info</span></div>
      <div style="padding:14px 18px;font-size:12px;display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;">
        <div><strong>Browser:</strong> ${esc(navigator.userAgent.slice(0, 80))}</div>
        <div><strong>Window:</strong> ${window.innerWidth}×${window.innerHeight}</div>
        <div><strong>Page:</strong> ${esc(typeof curPage!=='undefined'?curPage:'—')}</div>
        <div><strong>Memory globals:</strong> ${[
          'VD','CUSTOMERS','DEALS','QUOTES','INVENTORY','POS','JOBS','TRADE_PARTNERS','WARRANTY_CLAIMS','SHOWROOM_DISPLAYS','DELIVERIES','ALERTS','MARKETING_CAMPAIGNS','ARTICLES','CAL_EVENTS','COOP_FUNDS','CHANGELOG'
        ].filter(g => typeof window[g] !== 'undefined').length} / 17 loaded</div>
      </div>
    </div>
  `;
}
