// ── 6.3 ECOMMERCE INTELLIGENCE (BigCommerce runway — read-only) ───────────────
// UI module for the "Ecommerce Intelligence" page.
// Depends on: bigcommerce_adapter.js (BC.*) loaded before this file.
//
// Sub-tabs:
//   overview      — connection status + catalog health + stat cards
//   products      — paginated cached product list with filters
//   opportunities — flagged products (missing meta, low margin, etc.)
//   integration   — sync log, freshness, API health, config panel

let EI = {
  tab: 'overview',
  products: [],
  categories: [],
  brands: [],
  flags: [],
  flagSummary: {},
  filter: { q: '', type: '', severity: '' },
  prodFilter: { q: '', brand: '', category: '', visibility: '' },
  syncing: false,
  lastStatus: null
};

// ── RENDER ────────────────────────────────────────────────────────────────────

async function renderEcommerce(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Ecommerce Intelligence</div>
        <div class="page-sub">BigCommerce · Read-only catalog analysis</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="ei-status-chip" style="font-size:12px;padding:4px 10px;border-radius:20px;background:var(--surface-2);color:var(--muted);">checking…</span>
        <button class="btn btn-outline btn-sm" onclick="eiRefreshStatus()">↻ Status</button>
      </div>
    </div>
    <div class="sub-tabs" id="ei-tabs" style="margin-bottom:18px;">
      <button class="sub-tab ${EI.tab==='overview'?'active':''}" onclick="eiTab('overview')">Overview</button>
      <button class="sub-tab ${EI.tab==='products'?'active':''}" onclick="eiTab('products')">Products</button>
      <button class="sub-tab ${EI.tab==='opportunities'?'active':''}" onclick="eiTab('opportunities')">Opportunities</button>
      <button class="sub-tab ${EI.tab==='integration'?'active':''}" onclick="eiTab('integration')">Integration</button>
    </div>
    <div id="ei-body"></div>
  `;
  eiRefreshStatus();
  await eiLoadData();
  eiRenderTab();
}

function eiTab(t) {
  EI.tab = t;
  document.querySelectorAll('#ei-tabs .sub-tab').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase() === t.toLowerCase() ||
      (t === 'overview' && b.textContent === 'Overview') ||
      (t === 'products' && b.textContent === 'Products') ||
      (t === 'opportunities' && b.textContent === 'Opportunities') ||
      (t === 'integration' && b.textContent === 'Integration')
    );
  });
  eiRenderTab();
}

function eiRenderTab() {
  const body = document.getElementById('ei-body');
  if (!body) return;
  if (EI.tab === 'overview')      eiRenderOverview(body);
  else if (EI.tab === 'products') eiRenderProducts(body);
  else if (EI.tab === 'opportunities') eiRenderOpportunities(body);
  else if (EI.tab === 'integration')   eiRenderIntegration(body);
}

// ── STATUS CHIP ───────────────────────────────────────────────────────────────

async function eiRefreshStatus() {
  const chip = document.getElementById('ei-status-chip');
  if (!chip) return;
  chip.textContent = 'checking…';
  const s = await BC.health.status();
  EI.lastStatus = s;
  chip.textContent = `${s.icon} ${s.label}`;
  chip.style.color = s.color;
}

// ── DATA LOAD (from Supabase cache, no live BC call) ─────────────────────────

async function eiLoadData() {
  const [products, categories, brands] = await Promise.all([
    bcLoadCachedProducts(1000),
    bcLoadCachedCategories(),
    bcLoadCachedBrands()
  ]);
  EI.products   = products;
  EI.categories = categories;
  EI.brands     = brands;

  // Map bc_product_id field → id for opportunity scanner compat
  const mapped = products.map(p => ({
    ...p,
    id: p.bc_product_id,
    images: p.image_count > 0 ? [{ url_thumbnail: p.thumbnail_url }] : []
  }));
  const result  = BC.opportunity.scan(mapped);
  EI.flags       = result.flags;
  EI.flagSummary = result.summary;
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function eiRenderOverview(el) {
  const p = EI.products.length;
  const c = EI.categories.length;
  const b = EI.brands.length;
  const configured = bcConfigured();
  const fs = EI.flagSummary;

  const statCards = [
    { label: 'Products (cached)', val: p, icon: '◻', color: 'var(--blue)' },
    { label: 'Categories', val: c, icon: '▤', color: 'var(--purple)' },
    { label: 'Brands', val: b, icon: '◆', color: 'var(--teal)' },
    { label: 'Opportunity Flags', val: fs.total_flags || 0, icon: '!', color: 'var(--yellow)' }
  ];

  const flagBreakdown = fs.by_type ? Object.entries(fs.by_type)
    .sort((a,b) => b[1] - a[1])
    .map(([type, count]) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
        <span style="font-size:13px;">${eiTypeLabel(type)}</span>
        <span style="font-weight:700;font-size:13px;color:${eiSeverityColor(eiTypeSeverity(type))};">${count}</span>
      </div>`).join('') : '';

  el.innerHTML = `
    ${configured ? '' : eiConfigBanner()}
    <div class="stat-grid" style="margin-bottom:24px;">
      ${statCards.map(s => `
        <div class="stat-card">
          <div class="stat-icon" style="color:${s.color};">${s.icon}</div>
          <div class="stat-val">${s.val}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card">
        <div class="card-title">Opportunity Breakdown</div>
        ${flagBreakdown || '<div class="muted sm" style="padding:16px;">No cache data yet — connect BC to populate.</div>'}
        ${fs.total_flags ? `<div style="margin-top:12px;"><button class="btn btn-outline btn-sm" onclick="eiTab('opportunities')">View all flags →</button></div>` : ''}
      </div>
      <div class="card">
        <div class="card-title">Severity Distribution</div>
        ${fs.by_severity ? `
          ${eiSeverityBar('High', fs.by_severity.high || 0, fs.total_flags, 'var(--red)')}
          ${eiSeverityBar('Medium', fs.by_severity.medium || 0, fs.total_flags, 'var(--yellow)')}
          ${eiSeverityBar('Low', fs.by_severity.low || 0, fs.total_flags, 'var(--green)')}
        ` : '<div class="muted sm" style="padding:16px;">No data cached yet.</div>'}
        <div style="margin-top:16px;" class="muted sm">
          ${p > 0 ? `${((fs.total_flags||0)/p*100).toFixed(1)}% of products have at least one flag` : 'Sync catalog to compute.'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-title">Quick Actions</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-outline btn-sm" onclick="eiTab('opportunities')">▶ View Opportunities</button>
        <button class="btn btn-outline btn-sm" onclick="eiTab('products')">◻ Browse Products</button>
        <button class="btn btn-outline btn-sm" onclick="eiTab('integration')">⚙ Integration Status</button>
        ${configured ? `<button class="btn btn-outline btn-sm" onclick="eiFullSync()" ${EI.syncing?'disabled':''}>↓ Full Sync${EI.syncing?' (running…)':''}</button>` : ''}
      </div>
    </div>
  `;
}

function eiSeverityBar(label, val, total, color) {
  const pct = total > 0 ? Math.round(val / total * 100) : 0;
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
        <span>${label}</span><span style="color:${color};font-weight:600;">${val}</span>
      </div>
      <div style="height:6px;background:var(--surface-2);border-radius:3px;">
        <div style="height:6px;background:${color};border-radius:3px;width:${pct}%;transition:width .3s;"></div>
      </div>
    </div>`;
}

// ── PRODUCTS TAB ──────────────────────────────────────────────────────────────

function eiRenderProducts(el) {
  const f = EI.prodFilter;
  const brandMap = Object.fromEntries(EI.brands.map(b => [b.bc_brand_id, b.name]));
  const catMap   = Object.fromEntries(EI.categories.map(c => [c.bc_category_id, c.name]));

  let rows = EI.products.filter(p => {
    if (f.q && !((p.name||'').toLowerCase().includes(f.q.toLowerCase()) ||
                 (p.sku||'').toLowerCase().includes(f.q.toLowerCase()))) return false;
    if (f.brand && String(p.brand_id) !== f.brand) return false;
    if (f.visibility === 'visible' && !p.is_visible) return false;
    if (f.visibility === 'hidden' && p.is_visible) return false;
    return true;
  });

  const brandOptions = EI.brands.map(b => `<option value="${b.bc_brand_id}" ${f.brand===String(b.bc_brand_id)?'selected':''}>${esc(b.name)}</option>`).join('');

  el.innerHTML = `
    ${!bcConfigured() ? eiConfigBanner() : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
      <input class="search-input" placeholder="Search name / SKU…" value="${esc(f.q)}"
        oninput="EI.prodFilter.q=this.value;eiRenderTab()" style="min-width:200px;">
      <select onchange="EI.prodFilter.brand=this.value;eiRenderTab()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-1);font-size:13px;">
        <option value="">All Brands</option>${brandOptions}
      </select>
      <select onchange="EI.prodFilter.visibility=this.value;eiRenderTab()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-1);font-size:13px;">
        <option value="">All Visibility</option>
        <option value="visible" ${f.visibility==='visible'?'selected':''}>Visible only</option>
        <option value="hidden" ${f.visibility==='hidden'?'selected':''}>Hidden only</option>
      </select>
      <span class="muted sm">${rows.length} products</span>
    </div>

    ${!EI.products.length ? `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:12px;">◻</div>
        <div style="font-weight:600;margin-bottom:6px;">No cached products</div>
        <div class="muted sm" style="margin-bottom:16px;">Connect BC and run a full sync to populate the product cache.</div>
        <button class="btn btn-outline btn-sm" onclick="eiTab('integration')">⚙ Integration Setup</button>
      </div>` :
    `<div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr>
          <th>SKU</th><th>Name</th><th>Brand</th><th>Price</th><th>Stock</th><th>Sold</th><th>Images</th><th>Visible</th>
        </tr></thead>
        <tbody>
          ${rows.slice(0,250).map(p => `
            <tr style="cursor:pointer;" onclick="eiProductDetail(${p.bc_product_id||p.id})">
              <td class="mono sm">${esc(p.sku||'—')}</td>
              <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</td>
              <td class="sm muted">${esc(brandMap[p.brand_id]||'—')}</td>
              <td class="mono sm">$${(p.price||0).toFixed(2)}</td>
              <td class="${(p.inventory_level||0) <= (p.inventory_warning_level||0) && p.inventory_warning_level > 0 ? 'text-red' : ''} sm">${p.inventory_level ?? '—'}</td>
              <td class="sm">${p.total_sold||0}</td>
              <td style="text-align:center;">${(p.image_count||0) > 0 ? '✓' : '<span style="color:var(--red);">✕</span>'}</td>
              <td style="text-align:center;">${p.is_visible ? '✓' : '<span class="muted">○</span>'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${rows.length > 250 ? `<div class="muted sm" style="padding:10px;">Showing first 250 of ${rows.length}</div>` : ''}
    </div>`}
  `;
}

function eiProductDetail(id) {
  const p = EI.products.find(x => (x.bc_product_id || x.id) === id);
  if (!p) return;
  const flags = EI.flags.filter(f => f.product_id === id);

  openModal(`
    <div style="padding:4px;">
      <div style="font-size:17px;font-weight:700;margin-bottom:4px;">${esc(p.name)}</div>
      <div class="muted sm" style="margin-bottom:16px;">SKU: ${esc(p.sku||'—')} · BC ID: ${p.bc_product_id||p.id}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        ${eiDetailRow('Price', `$${(p.price||0).toFixed(2)}`)}
        ${eiDetailRow('Cost', p.cost_price > 0 ? `$${p.cost_price.toFixed(2)}` : '—')}
        ${eiDetailRow('Margin', p.cost_price > 0 && p.price > 0 ? `${((p.price-p.cost_price)/p.price*100).toFixed(1)}%` : '—')}
        ${eiDetailRow('Stock', p.inventory_level ?? '—')}
        ${eiDetailRow('Total Sold', p.total_sold||0)}
        ${eiDetailRow('Views', p.view_count||0)}
        ${eiDetailRow('Images', p.image_count||0)}
        ${eiDetailRow('Visible', p.is_visible ? 'Yes' : 'No')}
      </div>
      ${flags.length ? `
        <div style="margin-top:8px;">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;">Opportunity Flags</div>
          ${flags.map(f => `
            <div style="padding:8px 12px;border-radius:var(--radius-sm);background:var(--surface-2);margin-bottom:6px;font-size:12px;">
              <span style="font-weight:600;color:${eiSeverityColor(f.severity)};">${eiTypeLabel(f.type)}</span>
              <span class="muted" style="margin-left:6px;">${esc(f.detail)}</span>
            </div>`).join('')}
        </div>` : `<div class="muted sm">No flags — this product looks clean.</div>`}
      ${p.synced_at ? `<div class="muted sm" style="margin-top:12px;">Cached: ${new Date(p.synced_at).toLocaleString()}</div>` : ''}
    </div>
  `);
}

function eiDetailRow(label, val) {
  return `<div style="font-size:13px;"><span class="muted">${label}:</span> <strong>${val}</strong></div>`;
}

// ── OPPORTUNITIES TAB ─────────────────────────────────────────────────────────

function eiRenderOpportunities(el) {
  const f = EI.filter;
  const FLAG_TYPES = [
    'missing_description','missing_image','missing_keywords',
    'no_category','low_margin','high_traffic_low_conversion',
    'hidden_with_stock','low_stock'
  ];

  let rows = EI.flags.filter(fl => {
    if (f.q && !(fl.name||'').toLowerCase().includes(f.q.toLowerCase()) &&
               !(fl.sku||'').toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.type && fl.type !== f.type) return false;
    if (f.severity && fl.severity !== f.severity) return false;
    return true;
  });

  el.innerHTML = `
    ${!bcConfigured() ? eiConfigBanner() : ''}

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
      <input class="search-input" placeholder="Search name / SKU…" value="${esc(f.q)}"
        oninput="EI.filter.q=this.value;eiRenderTab()" style="min-width:180px;">
      <select onchange="EI.filter.type=this.value;eiRenderTab()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-1);font-size:13px;">
        <option value="">All Flag Types</option>
        ${FLAG_TYPES.map(t => `<option value="${t}" ${f.type===t?'selected':''}>${eiTypeLabel(t)}</option>`).join('')}
      </select>
      <select onchange="EI.filter.severity=this.value;eiRenderTab()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-1);font-size:13px;">
        <option value="">All Severity</option>
        <option value="high" ${f.severity==='high'?'selected':''}>High</option>
        <option value="medium" ${f.severity==='medium'?'selected':''}>Medium</option>
        <option value="low" ${f.severity==='low'?'selected':''}>Low</option>
      </select>
      <span class="muted sm">${rows.length} flags</span>
    </div>

    ${!EI.flags.length ? `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:12px;">★</div>
        <div style="font-weight:600;margin-bottom:6px;">No opportunity flags</div>
        <div class="muted sm" style="margin-bottom:16px;">
          ${bcConfigured() ? 'Run a full sync to compute opportunity flags.' : 'Connect BigCommerce to enable opportunity scanning.'}
        </div>
        <button class="btn btn-outline btn-sm" onclick="eiTab('integration')">⚙ Integration Setup</button>
      </div>` :
    `<div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr>
          <th>Severity</th><th>Flag</th><th>SKU</th><th>Product</th><th>Detail</th>
        </tr></thead>
        <tbody>
          ${rows.slice(0,500).map(fl => `
            <tr style="cursor:pointer;" onclick="eiProductDetail(${fl.product_id})">
              <td><span style="font-size:11px;padding:2px 7px;border-radius:10px;background:${eiSeverityColor(fl.severity)}22;color:${eiSeverityColor(fl.severity)};font-weight:600;">${fl.severity}</span></td>
              <td style="font-size:12px;font-weight:600;">${eiTypeLabel(fl.type)}</td>
              <td class="mono sm">${esc(fl.sku||'—')}</td>
              <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;">${esc(fl.name)}</td>
              <td class="muted sm" style="max-width:200px;">${esc(fl.detail)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${rows.length > 500 ? `<div class="muted sm" style="padding:10px;">Showing first 500 of ${rows.length}</div>` : ''}
    </div>`}
  `;
}

// ── INTEGRATION TAB ───────────────────────────────────────────────────────────

async function eiRenderIntegration(el) {
  const configured = bcConfigured();
  const freshness  = await BC.syncLog.freshness();
  const recentLogs = await BC.syncLog.recent(15);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

      <div class="card">
        <div class="card-title">Connection Status</div>
        <div style="margin-top:10px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="font-size:20px;color:${EI.lastStatus?.color||'var(--muted)'};">${EI.lastStatus?.icon||'○'}</span>
            <span style="font-weight:600;">${EI.lastStatus?.label||'Unknown'}</span>
          </div>
          <div class="muted sm" style="margin-bottom:6px;">Store: <strong>${BC_STORE_HASH}</strong></div>
          <div class="muted sm">Token: <strong>${configured ? '✓ Configured' : '✕ Missing (M04)'}</strong></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="eiRefreshStatus().then(()=>eiTab('integration'))">↻ Re-check</button>
          ${!configured ? `<button class="btn btn-accent btn-sm" onclick="eiConfigModal()">⚙ Configure Token</button>` : `<button class="btn btn-outline btn-sm" onclick="eiConfigModal()">⚙ Update Token</button>`}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Sync Freshness</div>
        ${freshness ? `
          <div style="margin-top:10px;">
            <div style="font-size:20px;font-weight:700;color:${freshness.stale?'var(--yellow)':'var(--green)'};">
              ${freshness.stale ? '⚠ Stale' : '✓ Fresh'}
            </div>
            <div class="muted sm" style="margin-top:6px;">Last sync: <strong>${new Date(freshness.lastSync).toLocaleString()}</strong></div>
            <div class="muted sm">Age: <strong>${freshness.ageHours}h</strong>${freshness.stale ? ' — recommend re-sync' : ''}</div>
            <div class="muted sm">Event: <code>${freshness.event}</code></div>
          </div>` : `
          <div class="muted sm" style="margin-top:10px;">No sync recorded yet. Run a full sync after connecting BC.</div>`}
        <div style="margin-top:14px;">
          ${configured ? `<button class="btn btn-outline btn-sm" onclick="eiFullSync()" ${EI.syncing?'disabled':''}>↓ Full Sync${EI.syncing?' (running…)':''}</button>` :
            `<button class="btn btn-outline btn-sm" disabled>↓ Sync (needs BC token)</button>`}
        </div>
      </div>

    </div>

    <div class="card">
      <div class="card-title">Catalog Cache State</div>
      <div style="display:flex;gap:24px;margin-top:10px;flex-wrap:wrap;">
        ${eiCacheStatPill('Products', EI.products.length)}
        ${eiCacheStatPill('Categories', EI.categories.length)}
        ${eiCacheStatPill('Brands', EI.brands.length)}
        ${eiCacheStatPill('Opportunity Flags', EI.flagSummary.total_flags || 0)}
      </div>
      <div class="muted sm" style="margin-top:10px;">
        Cache lives in Supabase tables (M45). Data is refreshed only on manual sync — no automatic polling.
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-title">Recent Sync Log</div>
      ${recentLogs.length ? `
        <div style="overflow-x:auto;margin-top:10px;">
          <table class="data-table">
            <thead><tr><th>Event</th><th>When</th><th>Payload</th></tr></thead>
            <tbody>
              ${recentLogs.map(r => `
                <tr>
                  <td><code style="font-size:11px;">${esc(r.event)}</code></td>
                  <td class="muted sm">${new Date(r.occurred_at).toLocaleString()}</td>
                  <td class="muted sm" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">
                    ${esc(JSON.stringify(r.payload||{}).slice(0,120))}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` :
        `<div class="muted sm" style="margin-top:10px;">No sync log entries yet (Supabase M45 table may not be created).</div>`}
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-title">M04 Setup Guide</div>
      <div style="font-size:13px;line-height:1.7;margin-top:8px;">
        <ol style="margin:0;padding-left:20px;">
          <li>Go to <strong>BigCommerce Admin → Settings → API → Store API accounts</strong></li>
          <li>Click <strong>Create API account</strong> → name it <em>"AccentOS Read"</em></li>
          <li>Token type: <strong>V2/V3 API Token</strong></li>
          <li>Scopes: <strong>Products (Read), Orders (Read), Customers (Read), Information &amp; Settings (Read)</strong></li>
          <li>Save → copy the access token (shown once)</li>
          <li>Click <strong>Configure Token</strong> above and paste it in</li>
        </ol>
        <div class="muted sm" style="margin-top:10px;">Store hash is pre-set: <code>${BC_STORE_HASH}</code></div>
      </div>
    </div>
  `;
}

function eiCacheStatPill(label, val) {
  return `<div style="text-align:center;padding:10px 18px;background:var(--surface-2);border-radius:var(--radius-sm);">
    <div style="font-size:22px;font-weight:700;">${val}</div>
    <div class="muted sm">${label}</div>
  </div>`;
}

// ── CONFIG MODAL ──────────────────────────────────────────────────────────────

function eiConfigModal() {
  const cfg = bcGetConfig();
  openModal(`
    <div style="padding:4px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:16px;">BigCommerce API Token</div>
      <div style="margin-bottom:12px;">
        <label class="form-label">Store Hash</label>
        <input id="ei-store-hash" class="form-input" value="${esc(cfg?.storeHash || BC_STORE_HASH)}" placeholder="store-cwqiwcjxes">
      </div>
      <div style="margin-bottom:16px;">
        <label class="form-label">API Token (X-Auth-Token)</label>
        <input id="ei-token" class="form-input" type="password" value="${cfg?.token ? '••••••••' : ''}" placeholder="Paste token here…">
        <div class="muted sm" style="margin-top:4px;">Stored in localStorage. Never sent to AccentOS servers — only to BigCommerce API.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-accent" onclick="eiSaveToken()">Save & Test</button>
        ${cfg ? `<button class="btn btn-outline" onclick="bcClearConfig();closeModal();toast('BC token cleared','info');">Clear Token</button>` : ''}
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      </div>
    </div>
  `);
}

async function eiSaveToken() {
  const hash  = document.getElementById('ei-store-hash')?.value.trim();
  const token = document.getElementById('ei-token')?.value.trim();
  if (!token || token === '••••••••') { toast('Enter a token first','warn'); return; }
  bcSaveConfig(hash || BC_STORE_HASH, token);
  closeModal();
  toast('Token saved — testing connection…', 'info');
  const status = await BC.health.status();
  if (status.ok || status.configured) {
    toast(`BC connected · ${status.label}`, 'ok');
  } else {
    toast(`BC connection failed: ${status.label}`, 'warn');
  }
  await eiRefreshStatus();
  eiRenderTab();
}

// ── FULL SYNC ─────────────────────────────────────────────────────────────────

async function eiFullSync() {
  if (!bcConfigured()) { toast('Configure BC token first', 'warn'); return; }
  if (EI.syncing) return;
  EI.syncing = true;
  eiRenderTab();
  toast('Starting full catalog sync…', 'info');

  try {
    const [products, categories, brands] = await Promise.all([
      BC.products.list(),
      BC.categories.list(),
      BC.brands.list()
    ]);

    const cacheResult = await bcSyncCatalogToSupabase(products, categories, brands);
    EI.products   = await bcLoadCachedProducts(1000);
    EI.categories = await bcLoadCachedCategories();
    EI.brands     = await bcLoadCachedBrands();

    const mapped  = EI.products.map(p => ({ ...p, id: p.bc_product_id, images: p.image_count > 0 ? [{}] : [] }));
    const result  = BC.opportunity.scan(mapped);
    EI.flags      = result.flags;
    EI.flagSummary= result.summary;

    toast(`Sync complete · ${cacheResult.products} products · ${EI.flagSummary.total_flags} flags`, 'ok');
  } catch(e) {
    toast(`Sync failed: ${e.message}`, 'warn');
    console.error('[bc] full sync error:', e);
  }

  EI.syncing = false;
  eiRenderTab();
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function eiConfigBanner() {
  return `<div style="background:var(--yellow)18;border:1px solid var(--yellow)44;border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;font-size:13px;">
    <strong>⚠ BigCommerce not connected.</strong> Data below is from Supabase cache only.
    <button class="btn btn-outline btn-sm" style="margin-left:12px;" onclick="eiConfigModal()">Configure Token (M04)</button>
  </div>`;
}

function eiTypeLabel(type) {
  const map = {
    missing_description: 'Missing Description',
    missing_image: 'Missing Image',
    missing_keywords: 'Missing Keywords',
    no_category: 'No Category',
    low_margin: 'Low Margin',
    high_traffic_low_conversion: 'High Traffic / Low Conversion',
    hidden_with_stock: 'Hidden (Has Stock)',
    low_stock: 'Low Stock'
  };
  return map[type] || type;
}

function eiSeverityColor(s) {
  return s === 'high' ? 'var(--red)' : s === 'medium' ? 'var(--yellow)' : 'var(--green)';
}

function eiTypeSeverity(type) {
  const highTypes = ['missing_image', 'missing_description', 'low_stock'];
  const lowTypes  = ['hidden_with_stock'];
  if (highTypes.includes(type)) return 'high';
  if (lowTypes.includes(type))  return 'low';
  return 'medium';
}

// Page entry point — called by goTo dispatcher as window.ecommerce(el, actions)
function ecommerce(el) { return renderEcommerce(el); }

console.log('[ei] Ecommerce Intelligence module loaded.');
