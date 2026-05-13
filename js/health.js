// ── HEALTH CHECK ──
// Owner+Admin diagnostic page. Shows data hydration status across every
// module (which globals are loaded, row counts, sample timestamps), schema
// presence (does the underlying Supabase table exist), and current version
// strings. No new schema, no API beyond a read-only ping per table.

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
  // Runtime section renders immediately from window flags — no async needed.
  _renderRuntimeSection(c);
  if(!_hcResults || (Date.now() - _hcLastRun > 5*60*1000)){
    // Append a loading placeholder for the schema section.
    const placeholder = document.createElement('div');
    placeholder.id = 'hc-schema-placeholder';
    placeholder.className = 'card';
    placeholder.style.cssText = 'padding:24px;text-align:center;color:var(--text-3);margin-top:16px;';
    placeholder.textContent = 'Running schema checks…';
    c.appendChild(placeholder);
    await _hcRun(false);
  }
  _renderSchemaSection(c);
}

function _renderRuntimeSection(c){
  const ver = window.__AOS_WORKER_VERSION__;
  const envKey = window.__AOS_WORKER_ENV_KEY_READY__;
  const probeMs = window.__AOS_WORKER_PROBE_MS__;
  const hydrateMs = window.__AOS_HYDRATE_MS__;

  // Determine worker severity
  let workerSev, workerLabel, workerDetail;
  if(ver === 'stale' || envKey === null){
    workerSev = 'FAIL'; workerLabel = 'Stale worker';
    workerDetail = 'v1/v2 live — deploy v3 via GitHub Actions';
  } else if(ver === 'error'){
    workerSev = 'FAIL'; workerLabel = 'Probe failed';
    workerDetail = 'Fetch threw — worker unreachable or network blocked';
  } else if(ver === undefined){
    workerSev = 'WARN'; workerLabel = 'Probing…';
    workerDetail = 'Probe still in flight';
  } else if(envKey === false){
    workerSev = 'WARN'; workerLabel = ver;
    workerDetail = 'env_key_set=false — bind ANTHROPIC_API_KEY in Cloudflare';
  } else if(envKey === true){
    const slowProbe = probeMs && probeMs > 2000;
    workerSev = slowProbe ? 'WARN' : 'HEALTHY';
    workerLabel = ver;
    workerDetail = `env_key_set=true${probeMs ? ' · ' + probeMs + 'ms' + (slowProbe ? ' ⚠ slow' : '') : ''}`;
  } else {
    workerSev = 'INFO'; workerLabel = ver || 'unknown';
    workerDetail = 'env_key status unknown';
  }

  const aiKey = (typeof getS === 'function') ? getS('aos-api') : '';
  const aiReady = (typeof _aiWorkerReady === 'function') ? _aiWorkerReady() : null;
  let aiSev, aiLabel, aiDetail;
  if(aiKey){ aiSev = 'HEALTHY'; aiLabel = 'User key set'; aiDetail = 'Personal key in Settings · overrides env'; }
  else if(envKey === true && aiReady){ aiSev = 'HEALTHY'; aiLabel = 'Worker env key'; aiDetail = 'ANTHROPIC_API_KEY bound · AI features ready'; }
  else if(envKey === true && !aiReady){ aiSev = 'WARN'; aiLabel = 'Env key bound'; aiDetail = 'Key bound but _aiWorkerReady()=false — check worker state'; }
  else if(envKey === false){ aiSev = 'WARN'; aiLabel = 'No AI auth'; aiDetail = 'Set key in Settings → API Keys or bind secret in Cloudflare'; }
  else if(envKey === null || ver === 'error'){ aiSev = 'FAIL'; aiLabel = 'No AI auth'; aiDetail = 'Worker unreachable or stale — redeploy needed'; }
  else { aiSev = 'INFO'; aiLabel = 'Checking…'; aiDetail = 'Worker probe in flight'; }

  let hydrateSev, hydrateLabel, hydrateDetail;
  if(!hydrateMs){ hydrateSev = 'INFO'; hydrateLabel = '—'; hydrateDetail = 'Not measured this session'; }
  else if(hydrateMs < 2000){ hydrateSev = 'HEALTHY'; hydrateLabel = hydrateMs + 'ms'; hydrateDetail = 'Fast'; }
  else if(hydrateMs < 5000){ hydrateSev = 'INFO'; hydrateLabel = hydrateMs + 'ms'; hydrateDetail = 'Normal'; }
  else if(hydrateMs < 10000){ hydrateSev = 'WARN'; hydrateLabel = hydrateMs + 'ms'; hydrateDetail = 'Slow — possible Supabase cold-start. Normal on first login of day.'; }
  else { hydrateSev = 'FAIL'; hydrateLabel = hydrateMs + 'ms'; hydrateDetail = 'Very slow — likely cold-start or network issue. Run DevTools → Network → XHR to find bottleneck.'; }

  const sevColor = {HEALTHY:'var(--green)',INFO:'var(--text-3)',WARN:'var(--yellow)',FAIL:'var(--accent)',CRITICAL:'var(--accent)'};
  const sevIcon  = {HEALTHY:'✓',INFO:'·',WARN:'⚠',FAIL:'✗',CRITICAL:'✗✗'};

  function sevBadge(sev, label){
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:${sevColor[sev]};color:#fff;">${sevIcon[sev]} ${esc(label)}</span>`;
  }
  function hcRow(label, sev, valLabel, detail){
    return `<tr>
      <td style="font-weight:600;width:140px;">${esc(label)}</td>
      <td>${sevBadge(sev, sev)}</td>
      <td class="mono" style="color:${sevColor[sev]};">${esc(valLabel)}</td>
      <td style="color:var(--text-2);font-size:12px;">${esc(detail)}</td>
    </tr>`;
  }

  const sbOk = (typeof sbConfigured === 'function' && sbConfigured());
  const sbSev = sbOk ? 'HEALTHY' : 'FAIL';
  const sbLabel = sbOk ? 'Connected' : 'Not configured';
  const sbDetail = sbOk ? ((typeof CU !== 'undefined' && CU) ? CU.email : '—') : 'Open Settings → configure Supabase';

  const overall = [workerSev, aiSev, hydrateSev, sbSev];
  const overallSev = overall.includes('FAIL') ? 'FAIL' : overall.includes('WARN') ? 'WARN' : 'HEALTHY';

  c.innerHTML = `
    <div class="card mb16" style="border-left:4px solid ${sevColor[overallSev]};">
      <div class="card-hd" style="padding-bottom:12px;">
        <span class="card-title">Runtime Health</span>
        <span style="font-size:11px;color:var(--text-3);">Session snapshot — live from boot flags</span>
      </div>
      <div style="padding:0 18px 16px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left;padding:6px 8px 8px 0;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;">Layer</th>
            <th style="text-align:left;padding:6px 8px 8px 0;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;">Severity</th>
            <th style="text-align:left;padding:6px 8px 8px 0;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;">Value</th>
            <th style="text-align:left;padding:6px 0 8px 0;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;">Detail</th>
          </tr></thead>
          <tbody style="font-size:13px;">
            ${hcRow('Worker', workerSev, workerLabel, workerDetail)}
            ${hcRow('AI Auth', aiSev, aiLabel, aiDetail)}
            ${hcRow('Hydration', hydrateSev, hydrateLabel, hydrateDetail)}
            ${hcRow('Database', sbSev, sbLabel, sbDetail)}
          </tbody>
        </table>
      </div>
      ${overallSev !== 'HEALTHY' ? `<div style="padding:10px 18px 14px;font-size:12px;color:var(--text-2);border-top:1px solid var(--border-light);">
        Remediation: see <code>docs/ops/OPERATOR_DIAGNOSTICS_GUIDE.md</code> or run <code>bash scripts/status.sh</code>
      </div>` : ''}
    </div>
  `;
}

async function _hcRun(forceRender){
  const results = {};
  await Promise.all(HC_TABLES.filter(t => t.schemaCheck).map(async t => {
    results[t.name] = await _hcSchemaCheck(t.name);
  }));
  _hcResults = results;
  _hcLastRun = Date.now();
  if(forceRender){
    const c = $('pg-content');
    _renderRuntimeSection(c);
    _renderSchemaSection(c);
  }
}

function _renderSchemaSection(c){
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

  const lastRun = _hcLastRun ? new Date(_hcLastRun).toLocaleTimeString() : '—';

  // Remove placeholder if present, then append schema section.
  const placeholder = document.getElementById('hc-schema-placeholder');
  if(placeholder) placeholder.remove();

  const schemaSection = document.createElement('div');
  schemaSection.id = 'hc-schema-section';
  schemaSection.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">Tables OK</div><div class="stat-value" style="color:var(--green);">${okCount}</div><div class="stat-sub">Have data + schema</div></div>
      <div class="card stat-card"${missingCount?' style="border-left:3px solid var(--accent);"':''}><div class="stat-label">Schema Missing</div><div class="stat-value" style="color:${missingCount?'var(--accent)':'var(--text)'};">${missingCount}</div><div class="stat-sub">Run pending M-tasks</div></div>
      <div class="card stat-card"><div class="stat-label">Empty / Lazy</div><div class="stat-value">${emptyCount}+${lazyCount}</div><div class="stat-sub">No rows loaded yet</div></div>
      <div class="card stat-card"><div class="stat-label">Globals loaded</div><div class="stat-value">${['VD','CUSTOMERS','DEALS','QUOTES','INVENTORY','POS','JOBS','TRADE_PARTNERS','WARRANTY_CLAIMS','SHOWROOM_DISPLAYS','DELIVERIES','ALERTS','MARKETING_CAMPAIGNS','ARTICLES','CAL_EVENTS','COOP_FUNDS','CHANGELOG'].filter(g=>typeof window[g]!=='undefined').length}</div><div class="stat-sub">of 17 core globals</div></div>
    </div>
    <div class="card mb16">
      <div class="card-hd">
        <span class="card-title">Tables · Globals · Status</span>
        <span class="muted sm">Schema checked: ${lastRun}</span>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 440px);overflow-y:auto;">
        <table>
          <thead><tr><th>Table</th><th>Global</th><th>Count</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>
            ${rows.map(r => {
              const statusColor = ({ok:'var(--green)', missing:'var(--accent)', empty:'var(--yellow)', lazy:'var(--blue)', unknown:'var(--text-3)'})[r.status] || 'var(--text-3)';
              return `<tr ${r.status==='missing'?'style="background:rgba(239,68,68,0.04);"':''}>
                <td class="mono fw6">${esc(r.table)}${r.optional?' <span class="muted sm">(opt)</span>':''}</td>
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
      <div class="card-hd"><span class="card-title">Environment</span></div>
      <div style="padding:14px 18px;font-size:12px;display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;">
        <div><strong>Browser:</strong> ${esc(navigator.userAgent.slice(0, 80))}</div>
        <div><strong>Window:</strong> ${window.innerWidth}×${window.innerHeight}</div>
        <div><strong>Active page:</strong> ${esc(typeof curPage!=='undefined'?curPage:'—')}</div>
        <div><strong>User role:</strong> ${esc((typeof CU!=='undefined'&&CU)?CU.role+'  ·  '+CU.email:'not authenticated')}</div>
        <div><strong>Worker probe:</strong> ${window.__AOS_WORKER_PROBE_MS__ ? window.__AOS_WORKER_PROBE_MS__ + 'ms' : '—'}</div>
        <div><strong>Worker version:</strong> ${esc(window.__AOS_WORKER_VERSION__ || '—')} · env_key=${String(window.__AOS_WORKER_ENV_KEY_READY__)}</div>
        <div><strong>Hydration:</strong> ${window.__AOS_HYDRATE_MS__ ? window.__AOS_HYDRATE_MS__ + 'ms' : '—'}</div>
        <div><strong>AI ready:</strong> ${(typeof _aiWorkerReady==='function') ? String(_aiWorkerReady()) : '—'}</div>
        <div><strong>Supabase:</strong> ${(typeof sbConfigured==='function'&&sbConfigured()) ? 'configured' : 'not configured'}</div>
        <div><strong>Console:</strong> <code>_runtimeHealth()</code> for full object</div>
      </div>
    </div>
  `;
  // Replace any existing schema section, else append.
  const existing = document.getElementById('hc-schema-section');
  if(existing) existing.replaceWith(schemaSection); else c.appendChild(schemaSection);
}
