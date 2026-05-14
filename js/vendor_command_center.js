// ── VENDOR COMMAND CENTER (Phase 1, v1.0) ────────────────────────────────────
// Operational intelligence shell for the Vendor Ranking module.
// Replaces the sparse Overview tab with actionable signals.
//
// Depends on globals: VD, VD_RAW, CAT_DEFS, CHANGELOG (optional), COOP_FUNDS (optional)
// Depends on helpers: weightedScore, getAdaptiveTier, scoredCount, fmt$, esc,
//                     tierBadge, scoreColor, heatColor, openVendorDetail,
//                     openVendorScoreEntry, renderVendors, vSortCol, vSortDir, vSection

(function () {

  // ─── STYLE INJECTION ─────────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('vcc-styles')) return;
    const s = document.createElement('style');
    s.id = 'vcc-styles';
    s.textContent = `
      /* ── VCC Layout Grids ── */
      .vcc-kpi    { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
      .vcc-2col   { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .vcc-catgrid{ display:grid; grid-template-columns:1fr 1fr; gap:0 32px; }

      /* ── Alert Strip ── */
      .vcc-alert       { display:flex; align-items:flex-start; gap:10px; padding:11px 16px; border-radius:8px; font-size:13px; font-weight:500; line-height:1.45; }
      .vcc-alert-icon  { font-size:15px; flex-shrink:0; margin-top:1px; }
      .vcc-a-warn      { background:var(--yellow-bg); color:#92400e; border:1px solid #fde68a; }
      .vcc-a-err       { background:var(--red-bg);    color:var(--accent); border:1px solid #fecaca; }
      .vcc-a-info      { background:var(--blue-bg);   color:var(--blue);   border:1px solid #bfdbfe; }
      .vcc-a-lever     { background:var(--purple-bg); color:var(--purple); border:1px solid #ddd6fe; }
      .vcc-alert-action{ margin-left:auto; flex-shrink:0; }

      /* ── Vendor Rows ── */
      .vcc-row      { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-light); cursor:pointer; transition:background .12s, padding .12s, margin .12s; }
      .vcc-row:last-child { border-bottom:none; }
      .vcc-row:hover{ background:var(--bg); margin:0 -14px; padding:9px 14px; border-radius:6px; }
      .vcc-row-info { flex:1; min-width:0; }
      .vcc-row-name { font-size:13px; font-weight:600; color:var(--text); line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .vcc-row-meta { font-size:11px; color:var(--text-3); margin-top:2px; display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
      .vcc-score-pill{ font-family:'DM Mono',monospace; font-size:12.5px; font-weight:700; padding:3px 9px; border-radius:5px; color:#fff; flex-shrink:0; }
      .vcc-row-trend { font-family:'DM Mono',monospace; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; flex-shrink:0; white-space:nowrap; }
      .vcc-trend-up  { background:var(--green-bg);   color:var(--green); }
      .vcc-trend-dn  { background:var(--red-bg);     color:var(--accent); }
      .vcc-trend-flat{ background:var(--border-light); color:var(--text-3); }

      /* ── Category Health Bar ── */
      .vcc-catbar     { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--border-light); cursor:pointer; transition:opacity .15s; }
      .vcc-catbar:hover{ opacity:.8; }
      .vcc-catbar:nth-last-child(-n+2){ border-bottom:none; }
      .vcc-cat-lbl    { font-size:11.5px; font-weight:600; color:var(--text-2); min-width:88px; flex-shrink:0; }
      .vcc-cat-track  { flex:1; height:7px; background:var(--border); border-radius:4px; overflow:hidden; }
      .vcc-cat-fill   { height:100%; border-radius:4px; transition:width .45s; }
      .vcc-cat-avg    { font-family:'DM Mono',monospace; font-size:11px; min-width:28px; text-align:right; color:var(--text-2); font-weight:600; }
      .vcc-cat-cov    { font-size:10.5px; min-width:32px; text-align:right; }

      /* ── Score bar strip (inside health card) ── */
      .vcc-sbar-row   { display:flex; align-items:center; gap:6px; font-size:10.5px; color:var(--text-3); }
      .vcc-sbar-track { flex:1; height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
      .vcc-sbar-fill  { height:100%; border-radius:2px; }

      /* ── Status badge ── */
      .vcc-gap-count  { font-family:'DM Mono',monospace; font-size:12px; font-weight:700; color:var(--accent); flex-shrink:0; }
      .vcc-lever-icon { font-size:16px; flex-shrink:0; color:var(--purple); }

      /* ── Empty / green states ── */
      .vcc-empty { padding:20px 0; text-align:center; color:var(--text-3); font-size:13px; }
      .vcc-green { padding:20px 0; text-align:center; color:var(--green); font-size:13px; font-weight:600; }

      /* ── Section header ── */
      .vcc-section-hd {
        font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
        color:var(--text-3); padding:0 0 6px; border-bottom:1px solid var(--border-light);
        margin-bottom:4px;
      }

      /* ── KPI overrides ── */
      .vcc-kpi .card { padding:0; }
      .vcc-kpi .stat-card { padding:16px 18px; }
      .vcc-kpi .stat-value { font-size:26px; }

      /* ── Responsive ── */
      @media (max-width:900px) {
        .vcc-kpi    { grid-template-columns:1fr 1fr !important; }
        .vcc-2col   { grid-template-columns:1fr !important; }
        .vcc-catgrid{ grid-template-columns:1fr !important; }
      }
      @media (max-width:560px) {
        .vcc-kpi    { grid-template-columns:1fr 1fr !important; }
        .vcc-kpi .stat-value { font-size:20px !important; }
      }
    `;
    document.head.appendChild(s);
  }

  // ─── PRIMITIVE RENDERERS ─────────────────────────────────────────────────────

  function _kpi(label, value, sub) {
    return `<div class="card stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-sub">${sub}</div>
    </div>`;
  }

  function _alertBar(type, icon, msg) {
    const cls = { warn:'vcc-a-warn', err:'vcc-a-err', info:'vcc-a-info', leverage:'vcc-a-lever' }[type] || 'vcc-a-info';
    return `<div class="vcc-alert ${cls}"><span class="vcc-alert-icon">${icon}</span><span>${msg}</span></div>`;
  }

  function _trendBadge(yoy) {
    if (yoy === null || yoy === undefined) return '';
    const pct = Math.round(yoy * 100);
    if (yoy > 0.04)  return `<span class="vcc-row-trend vcc-trend-up">↑${pct}%</span>`;
    if (yoy < -0.04) return `<span class="vcc-row-trend vcc-trend-dn">↓${Math.abs(pct)}%</span>`;
    return `<span class="vcc-row-trend vcc-trend-flat">~0%</span>`;
  }

  function _scorePill(ws) {
    if (ws === null) return `<span style="font-size:11px;color:var(--text-3);font-family:'DM Mono',monospace;padding:3px 6px;">TBD</span>`;
    const bg = ws >= 8 ? '#16a34a' : ws >= 6 ? '#2563eb' : ws >= 4 ? '#d97706' : '#ed1c24';
    return `<span class="vcc-score-pill" style="background:${bg};">${ws}</span>`;
  }

  function _sfmt(n) {
    if (!n || n <= 0) return null;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }

  function _empty(msg) { return `<div class="vcc-empty">${msg}</div>`; }
  function _green(msg) { return `<div class="vcc-green">✓ ${msg}</div>`; }

  // ── Vendor row variants ──────────────────────────────────────────────────────

  function _perfRow(v) {
    const s = _sfmt(v.sales5yr);
    const catColor = v.sc < 8 ? 'color:var(--yellow);' : 'color:var(--text-3);';
    return `<div class="vcc-row" onclick="openVendorDetail(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${v.tier ? tierBadge(v.tier) : ''}
          ${s ? `<span>${s} 5yr</span>` : ''}
          <span style="${catColor}">${v.sc}/${CAT_DEFS.length} scored</span>
        </div>
      </div>
      ${_scorePill(v.ws)}
    </div>`;
  }

  function _moverRow(v) {
    const s25 = _sfmt(v.sales2025);
    const s24 = _sfmt(v.sales2024);
    const latestSales = s25 || s24;
    const yr = s25 ? '2025' : '2024';
    return `<div class="vcc-row" onclick="openVendorDetail(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${v.tier ? tierBadge(v.tier) : '<span style="font-size:10px;color:var(--text-3);">unranked</span>'}
          ${latestSales ? `<span>${yr}: ${latestSales}</span>` : ''}
        </div>
      </div>
      ${_trendBadge(v.yoy)}
    </div>`;
  }

  function _riskRow(v) {
    const s = _sfmt(v.sales5yr);
    return `<div class="vcc-row" onclick="openVendorScoreEntry(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${s ? `<span>${s} 5yr revenue</span>` : ''}
          ${v.sc < 6 ? `<span style="color:var(--accent);">only ${v.sc} categories scored</span>` : ''}
        </div>
      </div>
      ${_scorePill(v.ws)}
    </div>`;
  }

  function _gapRow(v) {
    const s = _sfmt(v.sales5yr);
    return `<div class="vcc-row" onclick="openVendorScoreEntry(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${s ? `<span>${s} 5yr revenue</span>` : ''}
          <span style="color:var(--text-3);">needs scoring attention</span>
        </div>
      </div>
      <span class="vcc-gap-count">${v.sc}/${CAT_DEFS.length}</span>
    </div>`;
  }

  function _leverRow(v) {
    const s = _sfmt(v.sales5yr);
    const flags = [];
    if (v.rebateScore !== null && v.rebateScore < 5) flags.push(`Rebates ${v.rebateScore}/10`);
    if (v.freightScore !== null && v.freightScore < 5) flags.push(`Freight ${v.freightScore}/10`);
    return `<div class="vcc-row" onclick="openVendorDetail(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${s ? `<span>${s} 5yr</span>` : ''}
          ${flags.map(f => `<span style="color:var(--yellow);font-weight:600;">${f}</span>`).join('')}
        </div>
      </div>
      <span class="vcc-lever-icon" title="Negotiation leverage">◈</span>
    </div>`;
  }

  function _confRow(v) {
    const s = _sfmt(v.sales5yr);
    return `<div class="vcc-row" onclick="openVendorScoreEntry(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${s ? `<span>${s} 5yr</span>` : ''}
          <span style="color:var(--yellow);">${v.lowConfCount} low-confidence score${v.lowConfCount > 1 ? 's' : ''}</span>
        </div>
      </div>
      <span style="font-size:11px;color:var(--yellow);font-weight:700;font-family:'DM Mono',monospace;flex-shrink:0;">${Math.round(v.confRisk * 100)}%</span>
    </div>`;
  }

  // ── Category health bar ──────────────────────────────────────────────────────

  function _catBar(cat) {
    const avg = cat.avg;
    const pct = avg !== null ? ((avg / 10) * 100).toFixed(0) : 0;
    const fillColor = avg === null ? 'var(--border-light)' : avg >= 7 ? 'var(--green)' : avg >= 5 ? '#f59e0b' : 'var(--accent)';
    const covPct = cat.total > 0 ? Math.round((cat.coverage / cat.total) * 100) : 0;
    const covColor = covPct < 40 ? 'color:var(--accent);font-weight:700;' : covPct < 60 ? 'color:var(--yellow);font-weight:600;' : 'color:var(--text-3);';
    return `<div class="vcc-catbar" onclick="vSortCol='${cat.key}';vSortDir=-1;vSection='scores';renderVendors($('pg-content'))" title="${cat.label} — click to sort Scores tab">
      <span class="vcc-cat-lbl">${cat.label}</span>
      <div class="vcc-cat-track">
        <div class="vcc-cat-fill" style="width:${pct}%;background:${fillColor};"></div>
      </div>
      <span class="vcc-cat-avg">${avg !== null ? avg.toFixed(1) : '—'}</span>
      <span class="vcc-cat-cov" style="${covColor}">${covPct}%</span>
    </div>`;
  }

  // ─── INTELLIGENCE COMPUTATION ────────────────────────────────────────────────

  function _enrichVendors(allScores) {
    return VD.map(v => {
      const ws = weightedScore(v);
      const tier = ws !== null ? getAdaptiveTier(ws, allScores) : null;
      const sc = scoredCount(v.scores);
      const sales5yr  = v.sales?.t        || 0;
      const sales2025 = v.sales?.['2025'] || 0;
      const sales2024 = v.sales?.['2024'] || 0;
      const sales2023 = v.sales?.['2023'] || 0;

      // Best available YoY trend
      let yoy = null;
      if (sales2025 > 0 && sales2024 > 0) {
        yoy = (sales2025 - sales2024) / sales2024;
      } else if (sales2024 > 0 && sales2023 > 0) {
        yoy = (sales2024 - sales2023) / sales2023;
      }

      // Confidence: scan VD_RAW justifications
      let lowConfCount = 0;
      let scoredWithJ = 0;
      const raw = (typeof VD_RAW !== 'undefined') ? VD_RAW.find(r => r.id === v.id) : null;
      if (raw && raw.s) {
        CAT_DEFS.forEach(c => {
          const entry = raw.s[c.key];
          if (entry && typeof entry === 'object' && entry.j) {
            scoredWithJ++;
            const j = (entry.j || '').toLowerCase();
            if (
              j.includes('confidence: low') ||
              (j.includes('chatgpt') && !j.includes('confidence: high')) ||
              j.includes('assumed 0') ||
              j.includes('deferred')
            ) { lowConfCount++; }
          }
        });
      }
      const confRisk = scoredWithJ > 0 ? lowConfCount / scoredWithJ : 0;

      const rebateScore  = typeof v.scores?.rebates  === 'number' ? v.scores.rebates  : null;
      const freightScore = typeof v.scores?.freight   === 'number' ? v.scores.freight  : null;

      return { ...v, ws, tier, sc, sales5yr, sales2025, sales2024, sales2023, yoy, lowConfCount, confRisk, rebateScore, freightScore };
    });
  }

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────────

  function renderCommandCenter(container) {
    _injectStyles();

    const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
    const vendors   = _enrichVendors(allScores);

    // ── Intelligence signals ────────────────────────────────────────────────
    const topPerformers = [...vendors]
      .filter(v => v.ws !== null && v.sales5yr > 0)
      .sort((a, b) => b.ws - a.ws)
      .slice(0, 8);

    const topMovers = [...vendors]
      .filter(v => v.yoy !== null && v.yoy > 0.04 && v.sales5yr > 4000)
      .sort((a, b) => b.yoy - a.yoy)
      .slice(0, 8);

    // High revenue + low score = misaligned investment
    const deteriorating = [...vendors]
      .filter(v => v.ws !== null && v.ws < 6.0 && v.sales5yr > 20000)
      .sort((a, b) => b.sales5yr - a.sales5yr)
      .slice(0, 7);

    // Revenue vendors with very incomplete scoring
    const dataGaps = [...vendors]
      .filter(v => v.sales5yr > 8000 && v.sc < 5)
      .sort((a, b) => b.sales5yr - a.sales5yr)
      .slice(0, 7);

    // Low-confidence score data — needs verification before decisions
    const confWarnings = [...vendors]
      .filter(v => v.confRisk > 0.33 && v.lowConfCount >= 2 && v.sales5yr > 4000)
      .sort((a, b) => b.sales5yr - a.sales5yr)
      .slice(0, 6);

    // High spend but poor rebate/freight terms = untapped leverage
    const leverageOpps = [...vendors]
      .filter(v => v.sales5yr > 12000 && (
        (v.rebateScore !== null && v.rebateScore < 5) ||
        (v.freightScore !== null && v.freightScore < 5)
      ))
      .sort((a, b) => b.sales5yr - a.sales5yr)
      .slice(0, 7);

    // Per-category average score + coverage
    const categoryHealth = CAT_DEFS.map(cat => {
      const scores = vendors.map(v => v.scores?.[cat.key]).filter(s => typeof s === 'number');
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const coverage = vendors.filter(v => typeof v.scores?.[cat.key] === 'number').length;
      return { ...cat, avg, coverage, total: vendors.length };
    });

    // ── KPI computations ────────────────────────────────────────────────────
    const tieredVendors = vendors.filter(v => v.tier !== null);
    const aTierCount    = tieredVendors.filter(v => v.tier === 'A').length;
    const avgScore      = allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '—';
    const totalSales    = vendors.reduce((s, v) => s + v.sales5yr, 0);
    const movingUp      = vendors.filter(v => v.yoy !== null && v.yoy > 0.04).length;
    const salesStr      = totalSales >= 1e6
      ? `$${(totalSales / 1e6).toFixed(1)}M`
      : `$${(totalSales / 1000).toFixed(0)}K`;

    // ── Operational alerts ──────────────────────────────────────────────────
    const alerts = [];
    if (deteriorating.length > 0) {
      alerts.push({ type:'err',      icon:'↓', msg:`${deteriorating.length} vendor${deteriorating.length > 1 ? 's' : ''} with significant revenue scoring below 6.0 — portfolio misalignment risk` });
    }
    if (dataGaps.length > 0) {
      alerts.push({ type:'warn',     icon:'⚠', msg:`${dataGaps.length} revenue vendor${dataGaps.length > 1 ? 's' : ''} have fewer than 5 scored categories — incomplete intelligence` });
    }
    if (leverageOpps.length > 0) {
      alerts.push({ type:'leverage', icon:'◈', msg:`${leverageOpps.length} vendor${leverageOpps.length > 1 ? 's' : ''} with significant spend and weak rebate or freight terms — open negotiation windows` });
    }
    if (confWarnings.length > 0) {
      alerts.push({ type:'info',     icon:'○', msg:`${confWarnings.length} vendor${confWarnings.length > 1 ? 's' : ''} have estimated or low-confidence scoring — verify before strategic decisions` });
    }

    // ── Render ──────────────────────────────────────────────────────────────
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:28px;">

        ${alerts.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${alerts.map(a => _alertBar(a.type, a.icon, a.msg)).join('')}
          </div>` : ''}

        <!-- KPI STRIP -->
        <div class="vcc-kpi">
          ${_kpi('Vendors Ranked', allScores.length, `of ${VD.length} total`)}
          ${_kpi('Avg Score', avgScore, `${tieredVendors.length} tiered`)}
          ${_kpi('A-Tier', aTierCount, `${tieredVendors.length > 0 ? Math.round((aTierCount / tieredVendors.length) * 100) : 0}% of ranked`)}
          ${_kpi('Revenue Growing', movingUp, 'YoY positive trend')}
          ${_kpi('5-Yr Revenue', salesStr, 'all vendors combined')}
        </div>

        <!-- ROW 1: Top Performers | Top Movers -->
        <div class="vcc-2col">

          <div class="card">
            <div class="card-hd" style="padding-bottom:12px;">
              <span class="card-title">🏆 Top Performers</span>
              <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:4px 8px;"
                onclick="vSortCol='score';vSortDir=-1;vSection='scores';renderVendors($('pg-content'))">All scores →</button>
            </div>
            <div style="padding:0 16px 12px;">
              ${topPerformers.length > 0 ? topPerformers.map(_perfRow).join('') : _empty('No scored vendors yet')}
            </div>
          </div>

          <div class="card">
            <div class="card-hd" style="padding-bottom:12px;">
              <span class="card-title">⬆ Top Movers</span>
              <span style="font-size:11px;color:var(--text-3);">YoY revenue growth</span>
            </div>
            <div style="padding:0 16px 12px;">
              ${topMovers.length > 0 ? topMovers.map(_moverRow).join('') : _empty('No year-over-year trend data available')}
            </div>
          </div>

        </div>

        <!-- ROW 2: Underperformers | Data Gaps -->
        <div class="vcc-2col">

          <div class="card">
            <div class="card-hd" style="padding-bottom:4px;">
              <div>
                <div class="card-title">⚠ Underperforming Vendors</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">High revenue · score below 6.0 · click to edit scores</div>
              </div>
            </div>
            <div style="padding:8px 16px 12px;">
              ${deteriorating.length > 0 ? deteriorating.map(_riskRow).join('') : _green('No high-revenue underperformers')}
            </div>
          </div>

          <div class="card">
            <div class="card-hd" style="padding-bottom:4px;">
              <div>
                <div class="card-title">○ Scoring Gaps</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Revenue vendors with &lt; 5 scored categories · click to score</div>
              </div>
            </div>
            <div style="padding:8px 16px 12px;">
              ${dataGaps.length > 0 ? dataGaps.map(_gapRow).join('') : _green('All major vendors fully scored')}
            </div>
          </div>

        </div>

        <!-- CATEGORY HEALTH -->
        <div class="card">
          <div class="card-hd" style="padding-bottom:12px;">
            <div>
              <div class="card-title">◎ Category Health</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Average score &amp; coverage per scoring dimension · click any bar to sort Scores tab</div>
            </div>
          </div>
          <div style="padding:0 20px 16px;">
            <div class="vcc-catgrid">
              ${categoryHealth.map(_catBar).join('')}
            </div>
          </div>
          <div class="card-foot" style="font-size:11px;color:var(--text-3);display:flex;gap:18px;flex-wrap:wrap;">
            <span>Bar length = avg score (0–10)</span>
            <span>% = coverage (vendors with this category scored)</span>
            <span style="color:var(--green);">● ≥7</span>
            <span style="color:#f59e0b;">● 5–7</span>
            <span style="color:var(--accent);">● &lt;5</span>
          </div>
        </div>

        <!-- ROW 3: Leverage | Confidence -->
        <div class="vcc-2col">

          <div class="card">
            <div class="card-hd" style="padding-bottom:4px;">
              <div>
                <div class="card-title">◈ Negotiation Leverage</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">High spend · rebate or freight score &lt; 5/10</div>
              </div>
            </div>
            <div style="padding:8px 16px 12px;">
              ${leverageOpps.length > 0 ? leverageOpps.map(_leverRow).join('') : _green('No leverage gaps found')}
            </div>
          </div>

          <div class="card">
            <div class="card-hd" style="padding-bottom:4px;">
              <div>
                <div class="card-title">◑ Score Confidence</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Estimated or unverified scoring data · % = low-conf share</div>
              </div>
            </div>
            <div style="padding:8px 16px 12px;">
              ${confWarnings.length > 0 ? confWarnings.map(_confRow).join('') : _green('Score data confidence is solid')}
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // ─── EXPORTS ─────────────────────────────────────────────────────────────────
  window.renderCommandCenter = renderCommandCenter;

})();
