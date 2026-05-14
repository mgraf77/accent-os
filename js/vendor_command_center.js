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

      /* ── Score Ring (Vendor Intel Panel) ── */
      .vcc-ring-wrap { position:relative; width:120px; height:120px; flex-shrink:0; }
      .vcc-ring-num  { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .vcc-ring-val  { font-family:'DM Mono',monospace; font-size:30px; font-weight:700; line-height:1; }
      .vcc-ring-max  { font-family:'DM Mono',monospace; font-size:11px; color:var(--text-3); margin-top:2px; }
      .vcc-ring-lbl  { font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; margin-top:3px; font-weight:600; }

      /* ── Benchmark inline ── */
      .vcc-bench { font-size:10.5px; color:var(--text-3); font-family:'DM Mono',monospace; }
      .vcc-bench-bad { color:var(--accent); font-weight:700; }
      .vcc-bench-ok  { color:var(--green); font-weight:600; }

      /* ── Intel Panel ── */
      .vcc-intel       { display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:center; padding:16px; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius); margin-bottom:18px; }
      .vcc-intel-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px 14px; }
      .vcc-intel-stat  { display:flex; flex-direction:column; gap:2px; }
      .vcc-intel-stat-lbl  { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); }
      .vcc-intel-stat-val  { font-family:'DM Mono',monospace; font-size:15px; font-weight:700; color:var(--text); line-height:1.1; }
      .vcc-intel-stat-sub  { font-size:10px; color:var(--text-3); }

      /* ── Intel flag chips ── */
      .vcc-flag-row    { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
      .vcc-flag        { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:14px; font-size:11px; font-weight:600; line-height:1.2; }
      .vcc-flag-str    { background:var(--green-bg);   color:var(--green); }
      .vcc-flag-weak   { background:var(--red-bg);     color:var(--accent); }
      .vcc-flag-lever  { background:var(--purple-bg); color:var(--purple); }
      .vcc-flag-conf   { background:var(--yellow-bg); color:#92400e; }
      .vcc-flag-info   { background:var(--blue-bg);    color:var(--blue); }

      /* ── Action list (recommended actions in Intel Panel) ── */
      .vcc-actions     { display:flex; flex-direction:column; gap:8px; margin-top:14px; padding:12px 14px; background:#fff; border:1px solid var(--border); border-radius:var(--radius-sm); }
      .vcc-action-hd   { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); margin-bottom:2px; }
      .vcc-action      { display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:var(--text); line-height:1.4; }
      .vcc-action-ico  { font-size:13px; flex-shrink:0; margin-top:1px; }

      /* ── Portfolio Risk strip ── */
      .vcc-risk-strip  { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:12px 14px; background:var(--surface2); border-radius:var(--radius-sm); margin-bottom:14px; }
      .vcc-risk-item   { display:flex; flex-direction:column; gap:2px; }
      .vcc-risk-lbl    { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); }
      .vcc-risk-val    { font-family:'DM Mono',monospace; font-size:18px; font-weight:700; line-height:1; }

      /* ── Mobile jump-to nav ── */
      .vcc-mnav { display:none; padding:10px 14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:12px; align-items:center; gap:10px; }
      .vcc-mnav-lbl { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3); flex-shrink:0; }
      .vcc-mnav select { flex:1; padding:9px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-family:'Outfit',sans-serif; font-size:14px; background:var(--surface); color:var(--text); }

      /* ── Responsive ── */
      @media (max-width:900px) {
        .vcc-kpi    { grid-template-columns:1fr 1fr !important; }
        .vcc-2col   { grid-template-columns:1fr !important; }
        .vcc-catgrid{ grid-template-columns:1fr !important; }
        .vcc-intel  { grid-template-columns:1fr !important; gap:14px; }
        .vcc-intel-stats { grid-template-columns:repeat(2,1fr) !important; }
        .vcc-risk-strip { grid-template-columns:1fr 1fr !important; }
        .vcc-mnav   { display:flex !important; }
        .vcc-tabs-desktop { display:none !important; }
      }
      @media (max-width:560px) {
        .vcc-kpi    { grid-template-columns:1fr 1fr !important; }
        .vcc-kpi .stat-value { font-size:20px !important; }
        .vcc-ring-wrap { width:96px; height:96px; }
        .vcc-ring-val  { font-size:24px; }
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

  function _leverRow(v, bench) {
    const s = _sfmt(v.sales5yr);
    const flags = [];
    if (v.rebateScore !== null && v.rebateScore < 5) {
      flags.push(`<span style="color:var(--yellow);font-weight:600;">Rebates ${v.rebateScore}/10</span>${bench ? ` ${_bench(v.rebateScore, bench.avgRebate)}` : ''}`);
    }
    if (v.freightScore !== null && v.freightScore < 5) {
      flags.push(`<span style="color:var(--yellow);font-weight:600;">Freight ${v.freightScore}/10</span>${bench ? ` ${_bench(v.freightScore, bench.avgFreight)}` : ''}`);
    }
    return `<div class="vcc-row" onclick="openVendorDetail(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${s ? `<span>${s} 5yr</span>` : ''}
          ${flags.join('<span style="color:var(--border);">·</span>')}
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

    // Instability badges
    const flags = cat.flags || [];
    let badge = '';
    if (flags.includes('critical'))      badge = '<span class="vcc-flag vcc-flag-weak" style="font-size:9px;padding:1px 6px;margin-left:4px;" title="Portfolio-wide critical weakness (avg < 3.5)">CRIT</span>';
    else if (flags.includes('systemic')) badge = '<span class="vcc-flag vcc-flag-weak" style="font-size:9px;padding:1px 6px;margin-left:4px;" title="Systemic weakness across portfolio">SYS</span>';
    else if (flags.includes('gap'))      badge = '<span class="vcc-flag vcc-flag-info" style="font-size:9px;padding:1px 6px;margin-left:4px;" title="Low scoring coverage">GAP</span>';
    if (flags.includes('volatile'))      badge += '<span class="vcc-flag vcc-flag-conf" style="font-size:9px;padding:1px 6px;margin-left:4px;" title="High variance — inconsistent vendor performance">VOL</span>';

    return `<div class="vcc-catbar" onclick="vSortCol='${cat.key}';vSortDir=-1;vSection='scores';renderVendors($('pg-content'))" title="${cat.label} — click to sort Scores tab">
      <span class="vcc-cat-lbl">${cat.label}${badge}</span>
      <div class="vcc-cat-track">
        <div class="vcc-cat-fill" style="width:${pct}%;background:${fillColor};"></div>
      </div>
      <span class="vcc-cat-avg">${avg !== null ? avg.toFixed(1) : '—'}</span>
      <span class="vcc-cat-cov" style="${covColor}">${covPct}%</span>
    </div>`;
  }

  // ── Decline row (mirror of mover row, but for declining vendors) ─────────────
  function _declineRow(v) {
    const s5  = _sfmt(v.sales5yr);
    const s25 = _sfmt(v.sales2025);
    const s24 = _sfmt(v.sales2024);
    const lossDollars = (v.sales2024 || 0) - (v.sales2025 || 0);
    const lossStr = lossDollars > 1000 ? `-${_sfmt(lossDollars)}` : null;
    return `<div class="vcc-row" onclick="openVendorDetail(${v.id})">
      <div class="vcc-row-info">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${v.tier ? tierBadge(v.tier) : '<span style="font-size:10px;color:var(--text-3);">unranked</span>'}
          ${s5 ? `<span>${s5} 5yr</span>` : ''}
          ${lossStr ? `<span style="color:var(--accent);font-weight:600;">${lossStr} YoY</span>` : ''}
        </div>
      </div>
      ${_trendBadge(v.yoy)}
    </div>`;
  }

  // ── Score ring (SVG circular score gauge) ────────────────────────────────────
  function _scoreRing(score, label) {
    if (score === null || score === undefined) {
      return `<div class="vcc-ring-wrap">
        <svg viewBox="0 0 120 120" style="width:100%;height:100%;">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"/>
        </svg>
        <div class="vcc-ring-num">
          <div class="vcc-ring-val" style="color:var(--text-3);font-size:18px;">TBD</div>
          <div class="vcc-ring-lbl">${label || 'Score'}</div>
        </div>
      </div>`;
    }
    const pct = score / 10;
    const circ = 2 * Math.PI * 50;
    const dash = (pct * circ).toFixed(1);
    const color = score >= 8 ? '#16a34a' : score >= 6 ? '#2563eb' : score >= 4 ? '#d97706' : '#ed1c24';
    return `<div class="vcc-ring-wrap">
      <svg viewBox="0 0 120 120" style="width:100%;height:100%;transform:rotate(-90deg);">
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="${color}" stroke-width="10"
          stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
          style="transition:stroke-dasharray .6s ease;"/>
      </svg>
      <div class="vcc-ring-num">
        <div class="vcc-ring-val" style="color:${color};">${score}</div>
        <div class="vcc-ring-max">/ 10</div>
        <div class="vcc-ring-lbl">${label || 'Score'}</div>
      </div>
    </div>`;
  }

  // ── Benchmark inline indicator ───────────────────────────────────────────────
  function _bench(val, avg, betterIfHigher = true) {
    if (val === null || val === undefined || avg === null || isNaN(avg)) return '';
    const delta = val - avg;
    const isGood = betterIfHigher ? delta >= 0 : delta <= 0;
    const cls = Math.abs(delta) < 0.3 ? 'vcc-bench' : (isGood ? 'vcc-bench-ok' : 'vcc-bench-bad');
    const arrow = delta > 0.2 ? '↑' : delta < -0.2 ? '↓' : '~';
    return `<span class="${cls}">${arrow} avg ${avg.toFixed(1)}</span>`;
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

      // Weakness / strength: categories scored below 4 (weak) or 8+ (strong)
      const weakCats   = CAT_DEFS.filter(c => typeof v.scores?.[c.key] === 'number' && v.scores[c.key] <  4).map(c => c.key);
      const strongCats = CAT_DEFS.filter(c => typeof v.scores?.[c.key] === 'number' && v.scores[c.key] >= 8).map(c => c.key);

      return {
        ...v, ws, tier, sc, sales5yr, sales2025, sales2024, sales2023, yoy,
        lowConfCount, confRisk, rebateScore, freightScore, weakCats, strongCats, scoredWithJ
      };
    });
  }

  // ── Portfolio benchmarks: averages across the full vendor set ───────────────
  function _computeBenchmarks(vendors) {
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const rebateScores  = vendors.map(v => v.rebateScore).filter(s => typeof s === 'number');
    const freightScores = vendors.map(v => v.freightScore).filter(s => typeof s === 'number');
    const weightedScores = vendors.map(v => v.ws).filter(s => s !== null);
    return {
      avgRebate:  avg(rebateScores),
      avgFreight: avg(freightScores),
      avgScore:   avg(weightedScores),
      catAvg: Object.fromEntries(CAT_DEFS.map(c => {
        const scores = vendors.map(v => v.scores?.[c.key]).filter(s => typeof s === 'number');
        return [c.key, avg(scores)];
      }))
    };
  }

  // ── Category instability detection ──────────────────────────────────────────
  // Flags: 'systemic' (avg<5, broad coverage), 'gap' (low coverage),
  //        'volatile' (high stdev across scored vendors), 'critical' (avg<3.5)
  function _categoryInstability(categoryHealth, vendors) {
    return categoryHealth.map(cat => {
      const scores = vendors.map(v => v.scores?.[cat.key]).filter(s => typeof s === 'number');
      const covPct = cat.total > 0 ? cat.coverage / cat.total : 0;
      const flags = [];

      let stdev = 0;
      if (scores.length > 1 && cat.avg !== null) {
        const variance = scores.reduce((s, x) => s + (x - cat.avg) ** 2, 0) / scores.length;
        stdev = Math.sqrt(variance);
      }

      if (cat.avg !== null && cat.avg < 3.5 && covPct > 0.5)  flags.push('critical');
      else if (cat.avg !== null && cat.avg < 5 && covPct > 0.55) flags.push('systemic');
      if (covPct < 0.4 && cat.total > 10) flags.push('gap');
      if (stdev > 2.8 && scores.length >= 8) flags.push('volatile');

      return { ...cat, stdev, flags, covPct };
    });
  }

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────────

  function renderCommandCenter(container) {
    _injectStyles();

    const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
    const vendors   = _enrichVendors(allScores);
    const bench     = _computeBenchmarks(vendors);

    // ── Intelligence signals ────────────────────────────────────────────────
    const topPerformers = [...vendors]
      .filter(v => v.ws !== null && v.sales5yr > 0)
      .sort((a, b) => b.ws - a.ws)
      .slice(0, 8);

    const topMovers = [...vendors]
      .filter(v => v.yoy !== null && v.yoy > 0.04 && v.sales5yr > 4000)
      .sort((a, b) => b.yoy - a.yoy)
      .slice(0, 8);

    // Declining vendors: significant YoY drop with meaningful revenue
    const declining = [...vendors]
      .filter(v => v.yoy !== null && v.yoy < -0.05 && v.sales5yr > 8000)
      .sort((a, b) => a.yoy - b.yoy)  // most negative first
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

    // Per-category average score + coverage, then layered instability flags
    const categoryHealthRaw = CAT_DEFS.map(cat => {
      const scores = vendors.map(v => v.scores?.[cat.key]).filter(s => typeof s === 'number');
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const coverage = vendors.filter(v => typeof v.scores?.[cat.key] === 'number').length;
      return { ...cat, avg, coverage, total: vendors.length };
    });
    const categoryHealth = _categoryInstability(categoryHealthRaw, vendors);

    // Portfolio risk summary
    const criticalCats = categoryHealth.filter(c => c.flags.includes('critical') || c.flags.includes('systemic'));
    const gapCats      = categoryHealth.filter(c => c.flags.includes('gap'));
    const volatileCats = categoryHealth.filter(c => c.flags.includes('volatile'));
    const decliningRev = declining.reduce((s, v) => s + Math.max(0, (v.sales2024 || 0) - (v.sales2025 || 0)), 0);

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
    if (declining.length > 0) {
      const lossStr = decliningRev >= 1e6 ? `$${(decliningRev/1e6).toFixed(1)}M` : `$${(decliningRev/1000).toFixed(0)}K`;
      alerts.push({ type:'err',      icon:'↓', msg:`${declining.length} vendor${declining.length > 1 ? 's' : ''} declining YoY — combined revenue loss ${lossStr}` });
    }
    if (criticalCats.length > 0) {
      alerts.push({ type:'err',      icon:'⚠', msg:`Portfolio-wide weakness in ${criticalCats.length} categor${criticalCats.length > 1 ? 'ies' : 'y'}: ${criticalCats.map(c => c.label).join(', ')}` });
    }
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

        <!-- ROW 1b: Declining Vendors (full-width emphasis) -->
        ${declining.length > 0 ? `
        <div class="card">
          <div class="card-hd" style="padding-bottom:4px;">
            <div>
              <div class="card-title">↓ Declining Vendors</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:3px;">YoY revenue decline ≥5% · ranked by severity · click to investigate</div>
            </div>
            <div style="text-align:right;font-size:11px;color:var(--text-3);">
              Combined loss: <span style="font-family:'DM Mono',monospace;font-weight:700;color:var(--accent);">${decliningRev >= 1e6 ? '$' + (decliningRev/1e6).toFixed(1) + 'M' : '$' + (decliningRev/1000).toFixed(0) + 'K'}</span>
            </div>
          </div>
          <div style="padding:8px 16px 12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;" class="vcc-2col">
              ${declining.map(_declineRow).join('')}
            </div>
          </div>
        </div>` : ''}

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

        <!-- CATEGORY HEALTH + INSTABILITY -->
        <div class="card">
          <div class="card-hd" style="padding-bottom:12px;">
            <div>
              <div class="card-title">◎ Category Health &amp; Portfolio Instability</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Avg score · coverage · systemic risk flags · click any bar to sort Scores tab</div>
            </div>
          </div>

          <div style="padding:0 20px 6px;">
            <div class="vcc-risk-strip">
              <div class="vcc-risk-item">
                <div class="vcc-risk-lbl">Critical / Systemic</div>
                <div class="vcc-risk-val" style="color:${criticalCats.length > 0 ? 'var(--accent)' : 'var(--green)'};">${criticalCats.length}</div>
                <div style="font-size:10.5px;color:var(--text-3);">portfolio-wide weak categories</div>
              </div>
              <div class="vcc-risk-item">
                <div class="vcc-risk-lbl">Coverage Gaps</div>
                <div class="vcc-risk-val" style="color:${gapCats.length > 0 ? 'var(--yellow)' : 'var(--green)'};">${gapCats.length}</div>
                <div style="font-size:10.5px;color:var(--text-3);">&lt;40% scoring coverage</div>
              </div>
              <div class="vcc-risk-item">
                <div class="vcc-risk-lbl">Volatile</div>
                <div class="vcc-risk-val" style="color:${volatileCats.length > 0 ? '#92400e' : 'var(--green)'};">${volatileCats.length}</div>
                <div style="font-size:10.5px;color:var(--text-3);">high vendor-score variance</div>
              </div>
              <div class="vcc-risk-item">
                <div class="vcc-risk-lbl">Portfolio Avg</div>
                <div class="vcc-risk-val" style="color:${bench.avgScore && bench.avgScore >= 6 ? 'var(--green)' : bench.avgScore && bench.avgScore >= 5 ? '#f59e0b' : 'var(--accent)'};">${bench.avgScore !== null ? bench.avgScore.toFixed(1) : '—'}</div>
                <div style="font-size:10.5px;color:var(--text-3);">weighted score baseline</div>
              </div>
            </div>
          </div>

          <div style="padding:0 20px 16px;">
            <div class="vcc-catgrid">
              ${categoryHealth.map(_catBar).join('')}
            </div>
          </div>
          <div class="card-foot" style="font-size:11px;color:var(--text-3);display:flex;gap:14px;flex-wrap:wrap;">
            <span>Bar = avg score · % = coverage</span>
            <span style="color:var(--green);">● ≥7</span>
            <span style="color:#f59e0b;">● 5–7</span>
            <span style="color:var(--accent);">● &lt;5</span>
            <span style="color:var(--accent);font-weight:600;">CRIT/SYS = systemic weakness</span>
            <span style="color:var(--blue);font-weight:600;">GAP = low coverage</span>
            <span style="color:#92400e;font-weight:600;">VOL = high variance</span>
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
              ${leverageOpps.length > 0 ? leverageOpps.map(v => _leverRow(v, bench)).join('') : _green('No leverage gaps found')}
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

  // ─── VENDOR INTELLIGENCE PANEL ───────────────────────────────────────────────
  // Operational intelligence block for the vendor detail modal.
  // Returns HTML string. Renders: score ring, position, trend, weakness/strength
  // chips, leverage flags, confidence stat, recommended actions, benchmarks.
  function vccVendorIntelPanel(v) {
    _injectStyles();
    const allScores = VD.map(vx => weightedScore(vx)).filter(s => s !== null).sort((a, b) => b - a);
    const vendors   = _enrichVendors(allScores);
    const bench     = _computeBenchmarks(vendors);
    const enriched  = vendors.find(x => x.id === v.id);
    if (!enriched) return '';

    const ws = enriched.ws;
    const rank = ws !== null ? (allScores.indexOf(ws) + 1) : null;
    const totalRanked = allScores.length;

    // Trend formatting
    let trendBlock;
    if (enriched.yoy === null) {
      trendBlock = `<div class="vcc-intel-stat-val" style="color:var(--text-3);">—</div>
                    <div class="vcc-intel-stat-sub">no trend data</div>`;
    } else {
      const pct = Math.round(enriched.yoy * 100);
      const arrow = enriched.yoy > 0.03 ? '↑' : enriched.yoy < -0.03 ? '↓' : '~';
      const color = enriched.yoy > 0.03 ? 'var(--green)' : enriched.yoy < -0.03 ? 'var(--accent)' : 'var(--text-3)';
      const period = enriched.sales2025 > 0 ? "'24→'25" : "'23→'24";
      trendBlock = `<div class="vcc-intel-stat-val" style="color:${color};">${arrow} ${enriched.yoy >= 0 ? '+' : ''}${pct}%</div>
                    <div class="vcc-intel-stat-sub">${period} YoY</div>`;
    }

    const salesFmt = _sfmt(enriched.sales5yr);

    // Weakness / Strength / Leverage / Confidence chips
    const weakChips = enriched.weakCats.map(k => {
      const cat = CAT_DEFS.find(c => c.key === k);
      return cat ? `<span class="vcc-flag vcc-flag-weak" title="Score < 4">${cat.label}</span>` : '';
    }).join('');
    const strongChips = enriched.strongCats.map(k => {
      const cat = CAT_DEFS.find(c => c.key === k);
      return cat ? `<span class="vcc-flag vcc-flag-str" title="Score ≥ 8">${cat.label}</span>` : '';
    }).join('');

    // Leverage detection vs portfolio averages
    const leverChips = [];
    if (enriched.rebateScore !== null && enriched.rebateScore < 5 && bench.avgRebate !== null) {
      const gap = (bench.avgRebate - enriched.rebateScore).toFixed(1);
      leverChips.push(`<span class="vcc-flag vcc-flag-lever">Rebates ${enriched.rebateScore}/10 · ${gap > 0 ? gap + ' below avg' : 'at avg'}</span>`);
    }
    if (enriched.freightScore !== null && enriched.freightScore < 5 && bench.avgFreight !== null) {
      const gap = (bench.avgFreight - enriched.freightScore).toFixed(1);
      leverChips.push(`<span class="vcc-flag vcc-flag-lever">Freight ${enriched.freightScore}/10 · ${gap > 0 ? gap + ' below avg' : 'at avg'}</span>`);
    }

    // Confidence chip
    const confChip = enriched.confRisk > 0.33 && enriched.lowConfCount >= 2
      ? `<span class="vcc-flag vcc-flag-conf">⚠ ${enriched.lowConfCount} low-confidence score${enriched.lowConfCount > 1 ? 's' : ''} (${Math.round(enriched.confRisk * 100)}%)</span>`
      : '';

    // Co-op funds context
    let coopChip = '';
    if (typeof COOP_FUNDS !== 'undefined' && Array.isArray(COOP_FUNDS)) {
      const open = COOP_FUNDS.filter(f => f.vendor_id === v.id && f.status === 'open');
      if (open.length > 0) {
        const sum = open.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        coopChip = `<span class="vcc-flag vcc-flag-info">🎯 ${open.length} open co-op fund${open.length > 1 ? 's' : ''} · $${sum.toLocaleString()}</span>`;
      }
    }

    // Recommended actions (smart inference)
    const actions = [];
    if (enriched.sc < 5 && enriched.sales5yr > 8000) {
      actions.push({ ico: '○', txt: `Score the remaining ${CAT_DEFS.length - enriched.sc} categories — significant revenue but incomplete intelligence.` });
    }
    if (leverChips.length > 0 && enriched.sales5yr > 15000) {
      actions.push({ ico: '◈', txt: 'Open negotiation on rebate / freight — gap vs portfolio average suggests untapped leverage.' });
    }
    if (enriched.yoy !== null && enriched.yoy < -0.1 && enriched.sales5yr > 15000) {
      actions.push({ ico: '↓', txt: `Investigate sales decline — ${Math.abs(Math.round(enriched.yoy * 100))}% YoY drop on a meaningful line.` });
    }
    if (ws !== null && ws < 5 && enriched.sales5yr > 25000) {
      actions.push({ ico: '⚠', txt: 'Portfolio misalignment — high revenue vendor scoring poorly. Review for replacement, terms reset, or de-prioritization.' });
    }
    if (enriched.confRisk > 0.5 && enriched.lowConfCount >= 3) {
      actions.push({ ico: '○', txt: 'Verify low-confidence scores before strategic decisions — multiple categories use estimated data.' });
    }
    if (enriched.weakCats.includes('display') && enriched.sales5yr > 20000) {
      actions.push({ ico: '▣', txt: 'Display program weak — likely a showroom investment opportunity for a vendor of this size.' });
    }
    if (enriched.weakCats.includes('imap') && enriched.sales5yr > 15000) {
      actions.push({ ico: '⚖', txt: 'Weak IMAP enforcement — exposes margins to online channel erosion. Push for stricter policy.' });
    }
    if (actions.length === 0 && ws !== null && ws >= 7) {
      actions.push({ ico: '✓', txt: 'Strong overall vendor — protect margin and maintain display investment to preserve relationship.' });
    }

    const flagCount = weakChips.length + strongChips.length + leverChips.length + (confChip ? 1 : 0) + (coopChip ? 1 : 0);

    return `<div class="vcc-intel">
      ${_scoreRing(ws, 'Weighted')}
      <div>
        <div class="vcc-intel-stats">
          <div class="vcc-intel-stat">
            <div class="vcc-intel-stat-lbl">Rank</div>
            <div class="vcc-intel-stat-val">${rank ? `${rank} <span style="color:var(--text-3);font-size:11px;font-weight:500;">of ${totalRanked}</span>` : '<span style="color:var(--text-3);">—</span>'}</div>
            <div class="vcc-intel-stat-sub">${enriched.tier ? `Tier ${enriched.tier}` : 'unranked'} · vs avg ${bench.avgScore ? bench.avgScore.toFixed(1) : '—'}</div>
          </div>
          <div class="vcc-intel-stat">
            <div class="vcc-intel-stat-lbl">Trend</div>
            ${trendBlock}
          </div>
          <div class="vcc-intel-stat">
            <div class="vcc-intel-stat-lbl">5-Yr Revenue</div>
            <div class="vcc-intel-stat-val">${salesFmt || '<span style="color:var(--text-3);">—</span>'}</div>
            <div class="vcc-intel-stat-sub">${enriched.sc}/${CAT_DEFS.length} categories scored</div>
          </div>
        </div>

        ${flagCount > 0 ? `<div class="vcc-flag-row">${strongChips}${weakChips}${leverChips}${confChip}${coopChip}</div>` : ''}

        ${actions.length > 0 ? `<div class="vcc-actions">
          <div class="vcc-action-hd">Recommended Actions</div>
          ${actions.map(a => `<div class="vcc-action"><span class="vcc-action-ico">${a.ico}</span><span>${a.txt}</span></div>`).join('')}
        </div>` : ''}
      </div>
    </div>`;
  }

  // ─── MOBILE TAB NAV (jump-to dropdown) ───────────────────────────────────────
  // Renders a <select> that mirrors the vendor tab list. Hidden on desktop via CSS.
  function vccMobileNavSelect(tabs, currentId) {
    if (!Array.isArray(tabs)) return '';
    _injectStyles();
    return `<div class="vcc-mnav">
      <span class="vcc-mnav-lbl">Jump to</span>
      <select onchange="vSection=this.value;renderVendors($('pg-content'))">
        ${tabs.map(t => `<option value="${t.id}" ${t.id === currentId ? 'selected' : ''}>${t.label}</option>`).join('')}
      </select>
    </div>`;
  }

  // ─── EXPORTS ─────────────────────────────────────────────────────────────────
  window.renderCommandCenter = renderCommandCenter;
  window.vccVendorIntelPanel  = vccVendorIntelPanel;
  window.vccMobileNavSelect   = vccMobileNavSelect;

})();
