// ── 6.3 ECOMMERCE INTELLIGENCE v2 ────────────────────────────────────────────
// 6-tab ecommerce command center. Depends on bigcommerce_adapter.js.
// Tabs: exec | gmc | seo | merch | products | integration
//
// V2 additions over V1:
//   - Executive dashboard with ROI estimates + catalog quality scores
//   - GMC/Image surface (10 flag types)
//   - SEO surface (9 flag types)
//   - Merchandising surface (9 flag types)
//   - Platform integration status cards (BC + GA4 + GSC + Klaviyo + GMC)

let EI = {
  tab: 'exec',
  products: [],
  categories: [],
  brands: [],
  scanResult: null,     // full result from BC.opportunity.scanAll()
  filter: { q: '', type: '', severity: '' },
  gmcFilter: { q: '', type: '', severity: '' },
  seoFilter: { q: '', type: '', severity: '' },
  merchFilter: { q: '', type: '', severity: '' },
  prodFilter: { q: '', brand: '', visibility: '' },
  syncing: false,
  lastStatus: null
};

// ── RENDER ENTRY POINT ────────────────────────────────────────────────────────

async function renderEcommerce(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Ecommerce Intelligence</div>
        <div class="page-sub">BigCommerce · GMC · SEO · Merchandising · Platform runway</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="ei-status-chip" style="font-size:12px;padding:4px 10px;border-radius:20px;background:var(--surface-2);color:var(--muted);">checking…</span>
        ${bcConfigured() ? `<button class="btn btn-accent btn-sm" onclick="eiFullSync()" ${EI.syncing?'disabled':''}>↓ Sync${EI.syncing?' (running…)':''}</button>` : `<button class="btn btn-outline btn-sm" onclick="eiConfigModal()">⚙ Connect BC</button>`}
      </div>
    </div>
    <div class="sub-tabs" id="ei-tabs" style="margin-bottom:18px;">
      ${['exec','gmc','seo','merch','products','integration'].map(t =>
        `<button class="sub-tab ${EI.tab===t?'active':''}" onclick="eiTab('${t}')">${eiTabLabel(t)}</button>`
      ).join('')}
    </div>
    <div id="ei-body"></div>
  `;
  eiRefreshStatus();
  await eiLoadData();
  eiRenderTab();
}

function eiTabLabel(t) {
  return { exec:'Exec Dashboard', gmc:'GMC + Images', seo:'SEO', merch:'Merchandising', products:'Products', integration:'Integrations' }[t] || t;
}

function eiTab(t) {
  EI.tab = t;
  document.querySelectorAll('#ei-tabs .sub-tab').forEach((b,i) => {
    const tabs = ['exec','gmc','seo','merch','products','integration'];
    b.classList.toggle('active', tabs[i] === t);
  });
  eiRenderTab();
}

function eiRenderTab() {
  const body = document.getElementById('ei-body');
  if (!body) return;
  ({
    exec:        () => eiRenderExec(body),
    gmc:         () => eiRenderDomain(body, 'gmc'),
    seo:         () => eiRenderDomain(body, 'seo'),
    merch:       () => eiRenderDomain(body, 'merch'),
    products:    () => eiRenderProducts(body),
    integration: () => eiRenderIntegration(body)
  })[EI.tab]?.();
}

// ── STATUS CHIP ───────────────────────────────────────────────────────────────

async function eiRefreshStatus() {
  const chip = document.getElementById('ei-status-chip');
  if (!chip) return;
  const s = await BC.health.status();
  EI.lastStatus = s;
  chip.textContent = `${s.icon} ${s.label}`;
  chip.style.color = s.color;
}

// ── DATA LOAD ─────────────────────────────────────────────────────────────────

async function eiLoadData() {
  const [products, categories, brands] = await Promise.all([
    bcLoadCachedProducts(2000),
    bcLoadCachedCategories(),
    bcLoadCachedBrands()
  ]);
  EI.products   = products;
  EI.categories = categories;
  EI.brands     = brands;

  if (products.length) {
    // Normalize cached rows for the scanner (bc_product_id → id, etc.)
    const mapped = products.map(p => ({
      ...p,
      id: p.bc_product_id,
      images: p.image_count > 0 ? [{url_thumbnail: p.thumbnail_url}] : []
    }));
    EI.scanResult = BC.opportunity.scanAll(mapped);
  } else {
    EI.scanResult = null;
  }
}

// ── EXEC DASHBOARD ────────────────────────────────────────────────────────────

function eiRenderExec(el) {
  const s = EI.scanResult;
  const n = EI.products.length;
  const configured = bcConfigured();

  if (!n) {
    el.innerHTML = `
      ${!configured ? eiConfigBanner() : ''}
      <div class="empty-state">
        <div style="font-size:36px;margin-bottom:12px;">◈</div>
        <div style="font-weight:700;font-size:16px;margin-bottom:8px;">No catalog data yet</div>
        <div class="muted sm" style="margin-bottom:18px;">
          ${configured ? 'Click Sync to pull your BigCommerce catalog.' : 'Connect BigCommerce (M04 + M45) to unlock ecommerce intelligence.'}
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          ${configured ? `<button class="btn btn-accent" onclick="eiFullSync()">↓ Full Sync</button>` : `<button class="btn btn-accent" onclick="eiConfigModal()">⚙ Connect BigCommerce</button>`}
          <button class="btn btn-outline" onclick="eiTab('integration')">Integration Status</button>
        </div>
      </div>`;
    return;
  }

  const em = s.execMetrics;
  const bs = s.bySeverity;

  // Quality score color
  const qColor = em.catalog_quality_score >= 80 ? 'var(--green)' : em.catalog_quality_score >= 50 ? 'var(--yellow)' : 'var(--red)';
  const gmcColor = em.gmc_eligibility_rate >= 80 ? 'var(--green)' : em.gmc_eligibility_rate >= 50 ? 'var(--yellow)' : 'var(--red)';
  const seoColor = em.seo_health_score >= 70 ? 'var(--green)' : em.seo_health_score >= 40 ? 'var(--yellow)' : 'var(--red)';

  // Top 5 flag types by count
  const topFlags = Object.entries(s.byType).sort((a,b) => b[1]-a[1]).slice(0,5);

  // Domain summaries
  const domains = [
    { key:'gmc',   label:'GMC / Images',   icon:'◈', ...s.byDomain.gmc?.summary   },
    { key:'seo',   label:'SEO',             icon:'◉', ...s.byDomain.seo?.summary   },
    { key:'merch', label:'Merchandising',   icon:'★', ...s.byDomain.merch?.summary  },
    { key:'base',  label:'Catalog Basics',  icon:'◻', ...s.byDomain.base?.summary  }
  ];

  el.innerHTML = `
    ${!configured ? eiConfigBanner() : ''}

    <!-- Score cards row -->
    <div class="stat-grid" style="margin-bottom:20px;">
      ${eiScoreCard('Catalog Quality', em.catalog_quality_score + '%', qColor, `${n} products`)}
      ${eiScoreCard('GMC Eligibility', em.gmc_eligibility_rate + '%', gmcColor, 'Shopping-ready')}
      ${eiScoreCard('SEO Health', em.seo_health_score + '%', seoColor, 'Meta coverage')}
      ${eiScoreCard('High-Priority Fixes', bs.high, 'var(--red)', `+${bs.medium} medium`)}
    </div>

    <!-- Revenue opportunity + coverage row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

      <div class="card">
        <div class="card-title">Revenue Opportunity Estimates</div>
        <div class="muted sm" style="margin-bottom:10px;">Rough floor estimates — actual results vary.</div>
        ${eiOpportunityRow('GMC Feed Eligibility Gap',
          `~$${(em.gmc_revenue_opportunity||0).toLocaleString()}/yr`,
          `${100 - em.gmc_eligibility_rate}% of products ineligible for Shopping`,
          'var(--red)', () => eiTab('gmc'))}
        ${eiOpportunityRow('Dead Traffic Conversion',
          `${(em.dead_traffic_views||0).toLocaleString()} views wasted`,
          'Products with views but 0 sales — each 1% conv lift = revenue',
          'var(--yellow)', () => eiTab('merch'))}
        ${eiOpportunityRow('Meta Description Coverage',
          `${100 - em.seo_health_score}% of products missing`,
          'Meta desc → SERP CTR lift est. 5–15% on organic traffic',
          'var(--yellow)', () => eiTab('seo'))}
        ${eiOpportunityRow('Image Coverage',
          `${100 - em.image_coverage}% missing images`,
          '3+ images shown to increase conv 20–35% in ecommerce studies',
          'var(--red)', () => eiTab('gmc'))}
      </div>

      <div class="card">
        <div class="card-title">Catalog Coverage Breakdown</div>
        ${eiCoverageBar('Images', em.image_coverage)}
        ${eiCoverageBar('Description (100+ chars)', em.description_coverage)}
        ${eiCoverageBar('Meta Description', em.seo_health_score)}
        ${eiCoverageBar('GMC Eligibility', em.gmc_eligibility_rate)}
      </div>
    </div>

    <!-- Domain breakdown + top flags -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

      <div class="card">
        <div class="card-title">Flags by Domain</div>
        <div style="margin-top:10px;">
          ${domains.map(d => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light);cursor:pointer;"
                 onclick="eiTab('${d.key}')">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:14px;">${d.icon}</span>
                <span style="font-size:13px;font-weight:600;">${d.label}</span>
              </div>
              <div style="display:flex;gap:10px;align-items:center;">
                ${eiMiniSeverityChip('H', d.by_severity?.high||0, 'var(--red)')}
                ${eiMiniSeverityChip('M', d.by_severity?.medium||0, 'var(--yellow)')}
                ${eiMiniSeverityChip('L', d.by_severity?.low||0, 'var(--muted)')}
                <span style="font-weight:700;font-size:13px;">${d.total_flags||0}</span>
                <span class="muted" style="font-size:11px;">→</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Top Flag Types</div>
        <div style="margin-top:10px;">
          ${topFlags.map(([type, count]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
              <div>
                <div style="font-size:12px;font-weight:600;">${eiTypeLabel(type)}</div>
                <div class="muted sm">${eiTypeDomain(type)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="height:6px;width:${Math.round(count/topFlags[0][1]*80)}px;background:${eiSeverityColor(eiTypeSeverity(type))};border-radius:3px;"></div>
                <span style="font-weight:700;font-size:13px;color:${eiSeverityColor(eiTypeSeverity(type))};">${count}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

    </div>

    <!-- Quick actions -->
    <div class="card">
      <div class="card-title">Quick Actions</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-outline btn-sm" onclick="eiTab('gmc')">◈ GMC + Images</button>
        <button class="btn btn-outline btn-sm" onclick="eiTab('seo')">◉ SEO Gaps</button>
        <button class="btn btn-outline btn-sm" onclick="eiTab('merch')">★ Merchandising</button>
        <button class="btn btn-outline btn-sm" onclick="eiTab('products')">◻ All Products</button>
        <button class="btn btn-outline btn-sm" onclick="eiTab('integration')">⚙ Integrations</button>
        ${configured ? `<button class="btn btn-accent btn-sm" onclick="eiFullSync()" ${EI.syncing?'disabled':''}>↓ Refresh Catalog</button>` : ''}
      </div>
    </div>
  `;
}

function eiScoreCard(label, val, color, sub) {
  return `<div class="stat-card">
    <div style="font-size:28px;font-weight:800;color:${color};">${val}</div>
    <div style="font-weight:600;font-size:13px;margin-top:4px;">${label}</div>
    <div class="muted sm">${sub}</div>
  </div>`;
}

function eiOpportunityRow(label, val, detail, color, onclick) {
  return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);cursor:pointer;" onclick="(${onclick})()">
    <div style="width:4px;min-height:36px;background:${color};border-radius:2px;margin-top:2px;flex-shrink:0;"></div>
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:600;">${label}</div>
      <div class="muted sm">${detail}</div>
    </div>
    <div style="font-weight:700;font-size:13px;color:${color};white-space:nowrap;">${val}</div>
  </div>`;
}

function eiCoverageBar(label, pct) {
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
  return `<div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
      <span>${label}</span><span style="font-weight:700;color:${color};">${pct}%</span>
    </div>
    <div style="height:7px;background:var(--surface-2);border-radius:4px;">
      <div style="height:7px;background:${color};border-radius:4px;width:${pct}%;transition:width .4s;"></div>
    </div>
  </div>`;
}

function eiMiniSeverityChip(letter, count, color) {
  if (!count) return '';
  return `<span style="font-size:10px;font-weight:700;color:${color};">${letter}:${count}</span>`;
}

// ── DOMAIN FLAGS TAB (GMC / SEO / MERCH) ─────────────────────────────────────

function eiRenderDomain(el, domain) {
  const domainFlags = (EI.scanResult?.flags || []).filter(f => f.domain === domain);
  const filterKey = `${domain}Filter`;
  const f = EI[filterKey] || EI.filter;

  const typeOptions = [...new Set(domainFlags.map(x => x.type))].sort();

  let rows = domainFlags.filter(fl => {
    if (f.q && !(fl.name||'').toLowerCase().includes(f.q.toLowerCase()) &&
               !(fl.sku||'').toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.type && fl.type !== f.type) return false;
    if (f.severity && fl.severity !== f.severity) return false;
    return true;
  });

  const domainMeta = {
    gmc:   { icon: '◈', title: 'GMC + Image Opportunities', desc: 'Products at risk in Google Shopping / Merchant Center' },
    seo:   { icon: '◉', title: 'SEO Opportunities',          desc: 'Meta, title, description, and content gaps' },
    merch: { icon: '★', title: 'Merchandising Intelligence',  desc: 'Conversion blockers, margin analysis, cross-sell gaps' }
  };
  const dm = domainMeta[domain] || { icon: '!', title: domain, desc: '' };

  // Summary stat row
  const allDomainFlags = domainFlags;
  const highCount   = allDomainFlags.filter(x => x.severity === 'high').length;
  const medCount    = allDomainFlags.filter(x => x.severity === 'medium').length;
  const lowCount    = allDomainFlags.filter(x => x.severity === 'low').length;
  const affected    = new Set(allDomainFlags.map(x => x.product_id)).size;

  el.innerHTML = `
    ${!bcConfigured() ? eiConfigBanner() : ''}
    ${!EI.scanResult ? eiNoCacheState(domain) : `

    <!-- Domain summary -->
    <div class="stat-grid" style="margin-bottom:18px;">
      ${eiScoreCard('Products Affected', affected, 'var(--yellow)', `of ${EI.products.length} total`)}
      ${eiScoreCard('High Priority', highCount, 'var(--red)', 'Fix first')}
      ${eiScoreCard('Medium Priority', medCount, 'var(--yellow)', 'Fix soon')}
      ${eiScoreCard('Total Flags', allDomainFlags.length, 'var(--muted)', domain.toUpperCase())}
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
      <input class="search-input" placeholder="Search name / SKU…" value="${esc(f.q)}"
        oninput="EI.${filterKey}.q=this.value;eiRenderTab()" style="min-width:180px;">
      <select onchange="EI.${filterKey}.type=this.value;eiRenderTab()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-1);font-size:13px;">
        <option value="">All Flag Types</option>
        ${typeOptions.map(t => `<option value="${t}" ${f.type===t?'selected':''}>${eiTypeLabel(t)}</option>`).join('')}
      </select>
      <select onchange="EI.${filterKey}.severity=this.value;eiRenderTab()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-1);font-size:13px;">
        <option value="">All Severity</option>
        <option value="high" ${f.severity==='high'?'selected':''}>High</option>
        <option value="medium" ${f.severity==='medium'?'selected':''}>Medium</option>
        <option value="low" ${f.severity==='low'?'selected':''}>Low</option>
      </select>
      <span class="muted sm">${rows.length} flag${rows.length!==1?'s':''}</span>
      ${f.q||f.type||f.severity ? `<button class="btn btn-ghost btn-sm" onclick="EI.${filterKey}={q:'',type:'',severity:''};eiRenderTab()">✕ Clear</button>` : ''}
    </div>

    <!-- Flag type breakdown (mini) -->
    ${eiTypeSummaryBar(allDomainFlags)}

    <!-- Flag table -->
    ${rows.length ? `
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr>
          <th style="width:80px;">Severity</th>
          <th style="width:220px;">Flag</th>
          <th>SKU</th>
          <th>Product</th>
          <th>Detail</th>
        </tr></thead>
        <tbody>
          ${rows.slice(0,500).map(fl => `
            <tr style="cursor:pointer;" onclick="eiProductDetail(${fl.product_id})">
              <td>${eiSeverityBadge(fl.severity)}</td>
              <td style="font-size:12px;font-weight:600;">${eiTypeLabel(fl.type)}</td>
              <td class="mono sm">${esc(fl.sku||'—')}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;">${esc(fl.name)}</td>
              <td class="muted sm" style="max-width:240px;">${esc(fl.detail)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${rows.length > 500 ? `<div class="muted sm" style="padding:10px 0;">Showing first 500 of ${rows.length}</div>` : ''}
    </div>` :
    `<div class="empty-state" style="padding:32px;">
      <div style="font-size:28px;margin-bottom:8px;">${dm.icon}</div>
      <div style="font-weight:600;margin-bottom:4px;">No ${dm.title} flags match your filters</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="EI.${filterKey}={q:'',type:'',severity:''};eiRenderTab()">Clear filters</button>
    </div>`}
    `}
  `;
}

function eiTypeSummaryBar(flags) {
  const counts = {};
  for (const f of flags) counts[f.type] = (counts[f.type]||0)+1;
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if (!sorted.length) return '';
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${sorted.map(([t,c]) => `
      <div style="padding:4px 10px;border-radius:12px;background:${eiSeverityColor(eiTypeSeverity(t))}18;
                  border:1px solid ${eiSeverityColor(eiTypeSeverity(t))}44;font-size:11px;cursor:pointer;"
           onclick="EI[EI.tab+'Filter']={q:'',type:'${t}',severity:''};eiRenderTab()">
        <span style="font-weight:700;color:${eiSeverityColor(eiTypeSeverity(t))};">${c}</span>
        <span class="muted"> ${eiTypeLabel(t)}</span>
      </div>`).join('')}
  </div>`;
}

// ── PRODUCTS TAB ──────────────────────────────────────────────────────────────

function eiRenderProducts(el) {
  const f = EI.prodFilter;
  const brandMap = Object.fromEntries(EI.brands.map(b => [b.bc_brand_id, b.name]));
  const allFlags = EI.scanResult?.flags || [];

  // Build per-product flag count
  const flagCounts = {};
  for (const fl of allFlags) {
    flagCounts[fl.product_id] = (flagCounts[fl.product_id]||0)+1;
  }
  const highFlags = {};
  for (const fl of allFlags.filter(x => x.severity==='high')) {
    highFlags[fl.product_id] = (highFlags[fl.product_id]||0)+1;
  }

  let rows = EI.products.filter(p => {
    if (f.q && !((p.name||'').toLowerCase().includes(f.q.toLowerCase()) ||
                 (p.sku||'').toLowerCase().includes(f.q.toLowerCase()))) return false;
    if (f.brand && String(p.brand_id) !== f.brand) return false;
    if (f.visibility === 'visible' && !p.is_visible) return false;
    if (f.visibility === 'hidden'  && p.is_visible)  return false;
    return true;
  });

  // Sort: most flags first
  rows = rows.slice().sort((a,b) => (flagCounts[b.bc_product_id]||0) - (flagCounts[a.bc_product_id]||0));

  const brandOptions = EI.brands.map(b =>
    `<option value="${b.bc_brand_id}" ${f.brand===String(b.bc_brand_id)?'selected':''}>${esc(b.name)}</option>`
  ).join('');

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
        <option value="hidden"  ${f.visibility==='hidden'?'selected':''}>Hidden only</option>
      </select>
      <span class="muted sm">${rows.length} products · sorted by flag count</span>
    </div>

    ${!EI.products.length ? `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:12px;">◻</div>
        <div style="font-weight:600;margin-bottom:6px;">No cached products</div>
        <div class="muted sm" style="margin-bottom:16px;">Connect BC and run a full sync to populate.</div>
        <button class="btn btn-outline btn-sm" onclick="eiTab('integration')">⚙ Integration Setup</button>
      </div>` :
    `<div style="overflow-x:auto;">
      <table class="data-table">
        <thead><tr>
          <th>Flags</th><th>SKU</th><th>Name</th><th>Brand</th>
          <th>Price</th><th>Stock</th><th>Conv%</th><th>Images</th><th>Meta</th>
        </tr></thead>
        <tbody>
          ${rows.slice(0,300).map(p => {
            const fc = flagCounts[p.bc_product_id] || 0;
            const hf = highFlags[p.bc_product_id]  || 0;
            const conv = p.view_count > 0 ? (p.total_sold/p.view_count*100).toFixed(1)+'%' : '—';
            const hasMeta = (p.meta_description||'').length >= 70;
            return `<tr style="cursor:pointer;" onclick="eiProductDetail(${p.bc_product_id})">
              <td style="white-space:nowrap;">
                ${fc > 0 ? `<span style="font-weight:700;font-size:12px;color:${hf>0?'var(--red)':'var(--yellow)'};">${fc} flag${fc!==1?'s':''}</span>` : `<span class="muted sm">✓</span>`}
              </td>
              <td class="mono sm">${esc(p.sku||'—')}</td>
              <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</td>
              <td class="sm muted">${esc(brandMap[p.brand_id]||'—')}</td>
              <td class="mono sm">$${(p.price||0).toFixed(2)}</td>
              <td class="${(p.inventory_level||0)<=(p.inventory_warning_level||0)&&p.inventory_warning_level>0?'text-red':''} sm">${p.inventory_level??'—'}</td>
              <td class="sm">${conv}</td>
              <td style="text-align:center;">${(p.image_count||0)>0?`<span style="color:var(--green);">✓ ${p.image_count}</span>`:'<span style="color:var(--red);">✕</span>'}</td>
              <td style="text-align:center;">${hasMeta?'<span style="color:var(--green);">✓</span>':'<span style="color:var(--red);">✕</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${rows.length > 300 ? `<div class="muted sm" style="padding:10px 0;">Showing first 300 of ${rows.length}</div>` : ''}
    </div>`}
  `;
}

// ── PRODUCT DETAIL MODAL ──────────────────────────────────────────────────────

function eiProductDetail(id) {
  const p = EI.products.find(x => (x.bc_product_id||x.id) === id);
  if (!p) return;
  const allFlags = (EI.scanResult?.flags || []).filter(f => f.product_id === id);
  const margin   = p.cost_price > 0 && p.price > 0 ? ((p.price - p.cost_price)/p.price*100).toFixed(1)+'%' : '—';
  const conv     = p.view_count > 0 ? (p.total_sold/p.view_count*100).toFixed(2)+'%' : '—';

  const domainGroups = {};
  for (const f of allFlags) {
    (domainGroups[f.domain] = domainGroups[f.domain]||[]).push(f);
  }

  openModal(`
    <div style="padding:4px;max-width:560px;">
      <div style="font-size:17px;font-weight:700;margin-bottom:2px;">${esc(p.name)}</div>
      <div class="muted sm" style="margin-bottom:16px;">SKU: ${esc(p.sku||'—')} · BC ID: ${p.bc_product_id||p.id}</div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        ${eiDetailRow('Price', `$${(p.price||0).toFixed(2)}`)}
        ${eiDetailRow('Cost', p.cost_price>0?`$${p.cost_price.toFixed(2)}`:'—')}
        ${eiDetailRow('Margin', margin)}
        ${eiDetailRow('Stock', p.inventory_level??'—')}
        ${eiDetailRow('Sold', p.total_sold||0)}
        ${eiDetailRow('Views', p.view_count||0)}
        ${eiDetailRow('Conv Rate', conv)}
        ${eiDetailRow('Images', p.image_count||0)}
        ${eiDetailRow('Visible', p.is_visible?'Yes':'No')}
      </div>

      <div style="margin-bottom:10px;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px;">SEO Fields</div>
        <div style="font-size:12px;display:grid;gap:4px;">
          <div><span class="muted">Meta desc:</span> ${p.meta_description ? `<span style="color:var(--green);">✓ ${p.meta_description.length} chars</span>` : '<span style="color:var(--red);">✕ Missing</span>'}</div>
          <div><span class="muted">Page title:</span> ${p.page_title ? `<span style="color:var(--green);">✓ "${esc(p.page_title.slice(0,50))}"</span>` : '<span style="color:var(--red);">✕ Missing</span>'}</div>
          <div><span class="muted">Keywords:</span> ${p.search_keywords ? `<span style="color:var(--green);">✓</span>` : '<span style="color:var(--red);">✕ Missing</span>'}</div>
          <div><span class="muted">Condition:</span> ${p.condition||'<span style="color:var(--yellow);">Not set</span>'}</div>
        </div>
      </div>

      ${allFlags.length ? `
        <div>
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:8px;">
            ${allFlags.length} Flag${allFlags.length!==1?'s':''}
          </div>
          ${['gmc','seo','merch','base'].filter(d => domainGroups[d]).map(d => `
            <div style="margin-bottom:10px;">
              <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:4px;">${d.toUpperCase()}</div>
              ${domainGroups[d].map(f => `
                <div style="padding:6px 10px;border-radius:var(--radius-sm);background:${eiSeverityColor(f.severity)}12;
                            border-left:3px solid ${eiSeverityColor(f.severity)};margin-bottom:5px;font-size:12px;">
                  <span style="font-weight:600;color:${eiSeverityColor(f.severity)};">${eiTypeLabel(f.type)}</span>
                  <span class="muted" style="margin-left:6px;">${esc(f.detail)}</span>
                </div>`).join('')}
            </div>`).join('')}
        </div>` :
        `<div class="muted sm" style="padding:10px 0;">No flags — this product is clean across all domains. ✓</div>`}

      ${p.synced_at ? `<div class="muted sm" style="margin-top:10px;border-top:1px solid var(--border-light);padding-top:10px;">Cached: ${new Date(p.synced_at).toLocaleString()}</div>` : ''}
    </div>
  `);
}

function eiDetailRow(label, val) {
  return `<div style="font-size:12px;padding:6px;background:var(--surface-2);border-radius:var(--radius-sm);">
    <div class="muted" style="font-size:10px;margin-bottom:2px;">${label}</div>
    <div style="font-weight:600;">${val}</div>
  </div>`;
}

// ── INTEGRATION TAB ───────────────────────────────────────────────────────────

async function eiRenderIntegration(el) {
  const configured = bcConfigured();
  const freshness  = await BC.syncLog.freshness();
  const recentLogs = await BC.syncLog.recent(10);

  // Check all platform adapter states
  const platforms = [
    {
      key: 'bc', label: 'BigCommerce', icon: '◈', unlocks: 'M04',
      desc: 'Catalog · Orders · Customers',
      configured: configured,
      status: EI.lastStatus,
      docs: 'Settings → API → Store API accounts',
      docLink: null
    },
    {
      key: 'gmc', label: 'Google Merchant Center', icon: '◉', unlocks: 'M05',
      desc: 'Product feed · Shopping ads · Disapprovals',
      configured: typeof gmcConfigured === 'function' ? gmcConfigured() : false,
      status: null,
      docs: 'GCP Console → Service Account → GMC Admin → Account Access'
    },
    {
      key: 'ga4', label: 'Google Analytics 4', icon: '◷', unlocks: 'M06',
      desc: 'Sessions · Revenue · Conversions · Page performance',
      configured: typeof ga4Configured === 'function' ? ga4Configured() : false,
      status: null,
      docs: 'GCP Service Account → GA4 Admin → Property Access Management'
    },
    {
      key: 'gsc', label: 'Search Console', icon: '◑', unlocks: 'M06',
      desc: 'Search queries · Click-through rates · Index coverage',
      configured: typeof gscConfigured === 'function' ? gscConfigured() : false,
      status: null,
      docs: 'GCP Service Account → GSC Settings → Users & Permissions'
    },
    {
      key: 'klaviyo', label: 'Klaviyo', icon: '✉', unlocks: 'M09',
      desc: 'Email revenue · Campaigns · Flows · Abandoned cart',
      configured: typeof klaviyoConfigured === 'function' ? klaviyoConfigured() : false,
      status: null,
      docs: 'Klaviyo → Account → API Keys → Create Private Key (read-only)'
    }
  ];

  el.innerHTML = `
    <!-- Platform status cards -->
    <div style="margin-bottom:20px;">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px;">Platform Connection Status</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
        ${platforms.map(p => eiPlatformCard(p)).join('')}
      </div>
    </div>

    <!-- BC sync details -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="card">
        <div class="card-title">BC Sync Freshness</div>
        ${freshness ? `
          <div style="margin-top:10px;">
            <div style="font-size:20px;font-weight:700;color:${freshness.stale?'var(--yellow)':'var(--green)'};">
              ${freshness.stale ? '⚠ Stale' : '✓ Fresh'}
            </div>
            <div class="muted sm" style="margin-top:6px;">Last: <strong>${new Date(freshness.lastSync).toLocaleString()}</strong></div>
            <div class="muted sm">Age: <strong>${freshness.ageHours}h</strong>${freshness.stale?' — re-sync recommended':''}</div>
          </div>` : `<div class="muted sm" style="margin-top:10px;">No sync recorded yet.</div>`}
        <div style="margin-top:12px;display:flex;gap:8px;">
          ${configured ? `<button class="btn btn-accent btn-sm" onclick="eiFullSync()" ${EI.syncing?'disabled':''}>↓ Full Sync</button>` : ''}
          <button class="btn btn-outline btn-sm" onclick="eiRefreshStatus().then(()=>eiRenderTab())">↻ Re-check</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Catalog Cache</div>
        <div style="display:flex;gap:14px;margin-top:10px;flex-wrap:wrap;">
          ${eiCacheStatPill('Products', EI.products.length)}
          ${eiCacheStatPill('Categories', EI.categories.length)}
          ${eiCacheStatPill('Brands', EI.brands.length)}
          ${eiCacheStatPill('Total Flags', EI.scanResult?.flags?.length||0)}
        </div>
        <div class="muted sm" style="margin-top:10px;">Cache in Supabase (M45 + M46). Manual sync only — no auto-polling.</div>
      </div>
    </div>

    <!-- Recent sync log -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">Recent Sync Log</div>
      ${recentLogs.length ? `
        <table class="data-table" style="margin-top:10px;">
          <thead><tr><th>Event</th><th>When</th><th>Detail</th></tr></thead>
          <tbody>
            ${recentLogs.map(r => `<tr>
              <td><code style="font-size:11px;">${esc(r.event)}</code></td>
              <td class="muted sm">${new Date(r.occurred_at).toLocaleString()}</td>
              <td class="muted sm" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;">${esc(JSON.stringify(r.payload||{}).slice(0,100))}</td>
            </tr>`).join('')}
          </tbody>
        </table>` :
        `<div class="muted sm" style="margin-top:10px;">No log entries (M45 table may not be created yet).</div>`}
    </div>

    <!-- M04 setup guide (if not configured) -->
    ${!configured ? `
    <div class="card">
      <div class="card-title">BigCommerce Setup Guide (M04)</div>
      <ol style="font-size:13px;line-height:1.8;margin:10px 0 0 0;padding-left:20px;">
        <li>BC Admin → <strong>Settings → API → Store API accounts</strong></li>
        <li>Create API account → name: <em>"AccentOS Read"</em> → type: V2/V3 token</li>
        <li>Scopes: <strong>Products, Orders, Customers, Information &amp; Settings</strong> → all Read</li>
        <li>Save → copy token → click <strong>Connect BC</strong> above → paste token</li>
        <li>Then run <code>sql/M45_bigcommerce_schema.sql</code> + <code>sql/M46_ecommerce_v2_schema.sql</code> in Supabase</li>
        <li>Return here → <strong>Full Sync</strong> → opportunity flags populate</li>
      </ol>
      <div class="muted sm" style="margin-top:8px;">Store hash pre-set: <code>${typeof BC_STORE_HASH !== 'undefined' ? BC_STORE_HASH : 'store-cwqiwcjxes'}</code></div>
    </div>` : ''}
  `;
}

function eiPlatformCard(p) {
  const ok = p.configured;
  const color = ok ? 'var(--green)' : 'var(--yellow)';
  const icon  = ok ? '●' : '○';
  const label = ok ? 'Connected' : `Awaiting ${p.unlocks}`;

  return `<div class="card" style="padding:14px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="font-size:18px;">${p.icon}</span>
      <div>
        <div style="font-weight:700;font-size:13px;">${p.label}</div>
        <div class="muted sm">${p.desc}</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="color:${color};font-weight:700;font-size:12px;">${icon} ${label}</span>
    </div>
    ${ok && p.key === 'bc' ? `<button class="btn btn-outline btn-sm" onclick="eiConfigModal()">Update Token</button>` : ''}
    ${!ok ? `<div class="muted sm" style="font-size:11px;">${esc(p.docs)}</div>` : ''}
  </div>`;
}

function eiCacheStatPill(label, val) {
  return `<div style="text-align:center;padding:8px 14px;background:var(--surface-2);border-radius:var(--radius-sm);">
    <div style="font-size:20px;font-weight:700;">${val}</div>
    <div class="muted sm">${label}</div>
  </div>`;
}

// ── CONFIG MODAL ──────────────────────────────────────────────────────────────

function eiConfigModal() {
  const cfg = bcGetConfig();
  openModal(`
    <div style="padding:4px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:16px;">BigCommerce API Token (M04)</div>
      <div style="margin-bottom:12px;">
        <label class="form-label">Store Hash</label>
        <input id="ei-store-hash" class="form-input" value="${esc(cfg?.storeHash||'store-cwqiwcjxes')}" placeholder="store-cwqiwcjxes">
      </div>
      <div style="margin-bottom:16px;">
        <label class="form-label">API Token (X-Auth-Token)</label>
        <input id="ei-token" class="form-input" type="password" value="${cfg?.token?'••••••••':''}" placeholder="Paste token here…">
        <div class="muted sm" style="margin-top:4px;">Stored in localStorage. Sent only to BigCommerce API — never to AccentOS servers.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-accent" onclick="eiSaveToken()">Save &amp; Test</button>
        ${cfg?`<button class="btn btn-outline" onclick="bcClearConfig();closeModal();toast('BC token cleared','info');">Clear Token</button>`:''}
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      </div>
    </div>
  `);
}

async function eiSaveToken() {
  const hash  = document.getElementById('ei-store-hash')?.value.trim();
  const token = document.getElementById('ei-token')?.value.trim();
  if (!token || token === '••••••••') { toast('Enter a token first', 'warn'); return; }
  bcSaveConfig(hash||'store-cwqiwcjxes', token);
  closeModal();
  toast('Token saved — testing connection…', 'info');
  const status = await BC.health.status();
  toast(status.ok||status.configured ? `BC connected · ${status.label}` : `BC error: ${status.label}`, status.ok?'ok':'warn');
  await eiRefreshStatus();
  eiRenderTab();
}

// ── FULL SYNC ─────────────────────────────────────────────────────────────────

async function eiFullSync() {
  if (!bcConfigured()) { toast('Configure BC token first', 'warn'); return; }
  if (EI.syncing) return;
  EI.syncing = true;
  eiRenderTab();
  toast('Syncing catalog from BigCommerce…', 'info');

  try {
    const [products, categories, brands] = await Promise.all([
      BC.products.list({ include: 'images,custom_fields' }),
      BC.categories.list(),
      BC.brands.list()
    ]);

    await bcSyncCatalogToSupabase(products, categories, brands);

    EI.products   = await bcLoadCachedProducts(2000);
    EI.categories = await bcLoadCachedCategories();
    EI.brands     = await bcLoadCachedBrands();

    if (EI.products.length) {
      const mapped  = EI.products.map(p => ({...p, id: p.bc_product_id, images: p.image_count>0?[{}]:[]}));
      EI.scanResult = BC.opportunity.scanAll(mapped);
    }

    toast(`Sync done · ${EI.products.length} products · ${EI.scanResult?.flags?.length||0} flags`, 'ok');
  } catch(e) {
    toast(`Sync failed: ${e.message}`, 'warn');
    console.error('[ei] sync error:', e);
  }

  EI.syncing = false;
  eiRenderTab();
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function eiNoCacheState(domain) {
  return `<div class="empty-state">
    <div style="font-size:32px;margin-bottom:12px;">◈</div>
    <div style="font-weight:600;margin-bottom:6px;">No catalog data yet</div>
    <div class="muted sm" style="margin-bottom:16px;">
      ${bcConfigured() ? 'Run a full sync to compute opportunity flags.' : 'Connect BigCommerce to enable catalog intelligence.'}
    </div>
    <div style="display:flex;gap:10px;justify-content:center;">
      ${bcConfigured() ? `<button class="btn btn-accent" onclick="eiFullSync()">↓ Full Sync</button>` : `<button class="btn btn-accent" onclick="eiConfigModal()">⚙ Connect BC</button>`}
    </div>
  </div>`;
}

function eiConfigBanner() {
  return `<div style="background:var(--yellow)14;border:1px solid var(--yellow)44;border-radius:var(--radius-sm);padding:10px 16px;margin-bottom:14px;font-size:13px;display:flex;align-items:center;gap:12px;">
    <span>⚠ BigCommerce not connected — data is from Supabase cache only.</span>
    <button class="btn btn-outline btn-sm" onclick="eiConfigModal()">Configure Token (M04)</button>
  </div>`;
}

function eiSeverityBadge(s) {
  const color = eiSeverityColor(s);
  return `<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:${color}22;color:${color};font-weight:700;">${s}</span>`;
}

function eiSeverityColor(s) {
  return s==='high' ? 'var(--red)' : s==='medium' ? 'var(--yellow)' : 'var(--muted)';
}

function eiTypeSeverity(type) {
  const high = ['missing_description','missing_image','gmc_missing_image','gmc_missing_description','gmc_missing_brand','gmc_no_price','seo_missing_meta_description','seo_thin_description','seo_duplicate_description','merch_high_traffic_no_sales','merch_low_margin_high_traffic','merch_invisible_high_seller','low_stock'];
  const low  = ['hidden_with_stock','gmc_condition_unset','gmc_title_too_long','seo_title_too_long','seo_title_all_caps','seo_title_sku_noise','merch_dead_listing','merch_stale_no_sales'];
  if (high.includes(type)) return 'high';
  if (low.includes(type))  return 'low';
  return 'medium';
}

function eiTypeDomain(type) {
  if (type.startsWith('gmc_'))   return 'GMC / Images';
  if (type.startsWith('seo_'))   return 'SEO';
  if (type.startsWith('merch_')) return 'Merchandising';
  return 'Catalog Basics';
}

function eiTypeLabel(type) {
  const map = {
    // Base
    missing_description: 'Missing Description', missing_image: 'Missing Image',
    missing_keywords: 'Missing Keywords', no_category: 'No Category',
    low_margin: 'Low Margin', high_traffic_low_conversion: 'High Traffic / Low Conv',
    hidden_with_stock: 'Hidden (Has Stock)', low_stock: 'Low Stock',
    // GMC
    gmc_missing_image: 'No Images', gmc_low_image_count: 'Low Image Count',
    gmc_missing_description: 'Thin Description', gmc_missing_brand: 'Missing Brand',
    gmc_no_identifier: 'No GTIN / MPN', gmc_no_price: 'No Price',
    gmc_uncategorized: 'No Category', gmc_condition_unset: 'Condition Unset',
    gmc_title_too_long: 'Title Too Long', gmc_title_too_short: 'Title Too Short',
    // SEO
    seo_missing_meta_description: 'Missing Meta Desc', seo_meta_description_too_short: 'Meta Desc Too Short',
    seo_meta_description_too_long: 'Meta Desc Too Long', seo_missing_page_title: 'Missing Page Title',
    seo_title_too_long: 'Page Title Too Long', seo_thin_description: 'Thin Description',
    seo_duplicate_description: 'Duplicate Description', seo_missing_search_keywords: 'Missing Keywords',
    seo_title_all_caps: 'Title All-Caps', seo_title_sku_noise: 'Title SKU Noise',
    // Merch
    merch_high_traffic_no_sales: 'Views / No Sales', merch_high_traffic_low_conv: 'Low Conv Rate',
    merch_low_margin_high_traffic: 'Low Margin + High Traffic', merch_sale_not_converting: 'Sale Not Converting',
    merch_featured_low_conv: 'Featured / Low Conv', merch_no_related_products: 'No Cross-Sells',
    merch_invisible_high_seller: 'Hidden High-Seller', merch_dead_listing: 'Dead Listing',
    merch_stale_no_sales: 'Stale / No Sales'
  };
  return map[type] || type.replace(/_/g,' ');
}

// Page entry point
function ecommerce(el) { return renderEcommerce(el); }

console.log('[ei] Ecommerce Intelligence v2 loaded.');
