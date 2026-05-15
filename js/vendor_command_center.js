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

      /* ── Action Queue (Phase 3) ── */
      .vcc-aq        { display:flex; flex-direction:column; gap:6px; }
      .vcc-aq-row    { display:flex; align-items:center; gap:12px; padding:11px 14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); transition:transform .12s, box-shadow .12s; }
      .vcc-aq-row:hover { transform:translateY(-1px); box-shadow:var(--shadow-md); }
      .vcc-aq-sev    { width:4px; height:36px; border-radius:2px; flex-shrink:0; }
      .vcc-aq-sev-p0 { background:var(--accent); }
      .vcc-aq-sev-p1 { background:#f59e0b; }
      .vcc-aq-sev-p2 { background:var(--blue); }
      .vcc-aq-sev-p3 { background:var(--text-3); }
      .vcc-aq-body   { flex:1; min-width:0; }
      .vcc-aq-title  { font-size:13px; font-weight:600; color:var(--text); line-height:1.3; }
      .vcc-aq-sub    { font-size:11px; color:var(--text-3); margin-top:3px; display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
      .vcc-aq-chip   { display:inline-flex; align-items:center; padding:1px 8px; border-radius:10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
      .vcc-aq-actions{ display:flex; gap:4px; flex-shrink:0; }
      .vcc-aq-btn    { padding:5px 10px; border:1px solid var(--border); background:var(--surface); border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; color:var(--text-2); transition:all .12s; font-family:inherit; }
      .vcc-aq-btn:hover { background:var(--bg); border-color:var(--text-3); color:var(--text); }
      .vcc-aq-btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
      .vcc-aq-btn-primary:hover { background:var(--accent-dark); }
      .vcc-aq-empty  { padding:24px; text-align:center; color:var(--text-3); font-size:13px; }
      .vcc-aq-empty-ok { color:var(--green); font-weight:600; }
      .vcc-aq-filter { display:flex; gap:6px; flex-wrap:wrap; }

      /* ── Trust Score Badge ── */
      .vcc-trust       { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:12px; font-size:11px; font-weight:600; }
      .vcc-trust-high  { background:var(--green-bg); color:var(--green); }
      .vcc-trust-med   { background:var(--yellow-bg); color:#92400e; }
      .vcc-trust-low   { background:var(--red-bg);    color:var(--accent); }
      .vcc-trust-dot   { width:6px; height:6px; border-radius:50%; }

      /* ── Drift surface ── */
      .vcc-drift-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-light); cursor:pointer; }
      .vcc-drift-row:last-child { border-bottom:none; }
      .vcc-drift-row:hover { background:var(--bg); margin:0 -14px; padding:9px 14px; border-radius:6px; }
      .vcc-drift-delta { font-family:'DM Mono',monospace; font-size:13px; font-weight:700; padding:3px 9px; border-radius:5px; flex-shrink:0; min-width:54px; text-align:center; }
      .vcc-drift-up    { background:var(--green-bg); color:var(--green); }
      .vcc-drift-dn    { background:var(--red-bg);   color:var(--accent); }

      /* ── Rep Intel ── */
      .vcc-rep-row   { display:grid; grid-template-columns:1fr auto auto auto; gap:14px; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-light); cursor:pointer; }
      .vcc-rep-row:last-child { border-bottom:none; }
      .vcc-rep-row:hover { background:var(--bg); margin:0 -14px; padding:10px 14px; border-radius:6px; }
      .vcc-rep-name  { font-size:13px; font-weight:600; color:var(--text); }
      .vcc-rep-sub   { font-size:11px; color:var(--text-3); margin-top:2px; }
      .vcc-rep-stat  { font-family:'DM Mono',monospace; font-size:12px; font-weight:600; text-align:right; min-width:50px; }

      /* ── Compare Drawer ── */
      .vcc-cdrawer {
        position:fixed; bottom:0; left:0; right:0; z-index:400;
        background:var(--text); color:#fff;
        padding:12px 18px; box-shadow:0 -6px 24px rgba(0,0,0,.25);
        display:none; align-items:center; gap:14px; flex-wrap:wrap;
      }
      .vcc-cdrawer.on { display:flex; }
      .vcc-cdrawer-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:rgba(255,255,255,.5); }
      .vcc-cdrawer-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; background:rgba(255,255,255,.1); border-radius:14px; font-size:12px; font-weight:500; }
      .vcc-cdrawer-x { background:none; border:none; color:rgba(255,255,255,.7); cursor:pointer; font-size:14px; padding:0; line-height:1; }
      .vcc-cdrawer-x:hover { color:#fff; }
      .vcc-cdrawer-spacer { flex:1; }
      .vcc-cdrawer-go { background:var(--accent); color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; font-family:inherit; font-size:13px; }
      .vcc-cdrawer-go:hover { background:var(--accent-dark); }
      .vcc-cdrawer-clear { background:transparent; color:rgba(255,255,255,.7); border:1px solid rgba(255,255,255,.2); padding:8px 14px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:12px; }
      .vcc-cdrawer-clear:hover { color:#fff; border-color:rgba(255,255,255,.4); }

      /* ── Compare Modal ── */
      .vcc-cmp-wrap { overflow-x:auto; padding:4px; }
      .vcc-cmp-grid { display:grid; gap:0; min-width:max-content; }
      .vcc-cmp-col  { padding:14px 16px; border-right:1px solid var(--border); min-width:200px; }
      .vcc-cmp-col:last-child { border-right:none; }
      .vcc-cmp-col.label { background:var(--surface2); min-width:160px; position:sticky; left:0; z-index:1; }
      .vcc-cmp-row-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3); padding:10px 16px; border-top:1px solid var(--border-light); background:var(--surface2); position:sticky; left:0; z-index:1; }
      .vcc-cmp-cell { padding:10px 16px; border-top:1px solid var(--border-light); border-right:1px solid var(--border); font-size:13px; }
      .vcc-cmp-cell:last-child { border-right:none; }
      .vcc-cmp-name { font-size:14px; font-weight:700; padding:14px 16px; background:var(--surface2); border-bottom:1px solid var(--border); }

      /* ── Compare-add button ── */
      .vcc-add-cmp { padding:5px 11px; font-size:11px; border:1px solid var(--border); background:var(--surface); border-radius:14px; cursor:pointer; color:var(--text-2); font-weight:600; font-family:inherit; transition:all .12s; }
      .vcc-add-cmp:hover { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }
      .vcc-add-cmp.on { background:var(--accent); color:#fff; border-color:var(--accent); }

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
        .vcc-aq-actions { flex-direction:column; }
        .vcc-rep-row { grid-template-columns:1fr auto; row-gap:4px; }
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
    _injectStylesP4();

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

    // ── Phase 4 data ─────────────────────────────────────────────────────────
    const p4Drift = _computeDrift(vendors, 90);
    const p4Expo  = _computeExposure(vendors, categoryHealth);
    const p4Opps  = _buildOpportunities(vendors, bench, p4Drift);

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

        <!-- EXECUTIVE DAILY BRIEF -->
        ${_execBriefCard(vendors, categoryHealth, bench, allScores)}

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

        <!-- PORTFOLIO EXPOSURE (full width) -->
        ${_exposureCard(vendors, categoryHealth, p4Expo)}

        <!-- ACTION QUEUE (full width) -->
        ${_actionQueueCard(vendors, categoryHealth, bench)}

        <!-- OPPORTUNITY RADAR | WATCHLIST -->
        <div class="vcc-2col">
          <div class="card">
            <div class="card-hd" style="padding-bottom:4px;">
              <div>
                <div class="card-title">◉ Opportunity Radar</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Fast movers · underutilized talent · leverage windows · click to act</div>
              </div>
            </div>
            <div style="padding:8px 16px 12px;">
              ${p4Opps.length > 0 ? p4Opps.map(_oppRow).join('') : _green('No standout opportunities detected — portfolio is well-optimized')}
            </div>
          </div>
          ${_watchlistCard(vendors)}
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

        <!-- ROW 2b: Drift | Rep Intel -->
        ${(() => {
          const drift = _computeDrift(vendors, 90).sort((a, b) => Math.abs(b.weighted) - Math.abs(a.weighted)).slice(0, 8);
          const reps  = _aggregateByRep(vendors).filter(g => g.vendors.length > 1).sort((a, b) => b.sales - a.sales).slice(0, 12);
          const driftCard = `<div class="card">
            <div class="card-hd" style="padding-bottom:4px;">
              <div>
                <div class="card-title">◷ Score Drift (90-day)</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Net score movement from CHANGELOG · click to investigate</div>
              </div>
            </div>
            <div style="padding:8px 16px 12px;">
              ${drift.length > 0 ? drift.map(_driftRow).join('') : _empty('No score changes logged in the last 90 days')}
            </div>
          </div>`;
          const repCard = `<div class="card">
            <div class="card-hd" style="padding-bottom:8px;">
              <div>
                <div class="card-title">◉ Rep Group Intelligence</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Sales rep portfolio performance · click to filter</div>
              </div>
            </div>
            <div style="padding:0 16px 4px;">
              <div class="vcc-rep-hdr">
                <div>Rep</div><div>Ranked</div><div>Avg</div><div>5-Yr Sales</div>
              </div>
            </div>
            <div style="padding:0 16px 12px;">
              ${reps.length > 0 ? reps.map(_repRow).join('') : _empty('No rep assignments found')}
            </div>
          </div>`;
          return `<div class="vcc-2col">${driftCard}${repCard}</div>`;
        })()}

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

        <!-- NARRATIVE (full width) -->
        ${_narrativeCard(vendors, categoryHealth, bench, p4Expo, p4Drift)}

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
    const trust = _computeTrust(v);

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

    // Compare + watchlist button state
    const cmpIds    = _getCompareIds();
    const inCompare = cmpIds.includes(v.id);
    const cmpLabel  = inCompare ? '✓ In compare' : '+ Compare';
    const wlEntry   = _getWatchlist().find(e => e.id === v.id);
    const wlLabel   = wlEntry ? ({ pin:'📌 Pinned', watch:'👁 Watching', strategic:'⭐ Strategic' }[wlEntry.type] || '⭐') : '+ Watchlist';

    return `<div class="vcc-intel">
      ${_scoreRing(ws, 'Weighted')}
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          ${_trustBadge(trust)}
          <button class="vcc-add-cmp${inCompare ? ' on' : ''}" data-vid="${v.id}"
            onclick="vccToggleCompare(${v.id})">${cmpLabel}</button>
          <button class="vcc-aq-btn" style="font-size:11px;padding:4px 10px;border-radius:14px;"
            onclick="${wlEntry ? `vccWatchlistRemove(${v.id})` : `vccWatchlistPin(${v.id},'watch')`}">${wlLabel}</button>
        </div>
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PHASE 3: DECISION ACCELERATION LAYER ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── State persistence (localStorage, versioned) ─────────────────────────────
  const LS_SNOOZE   = 'vcc-snooze-v1';
  const LS_DISMISS  = 'vcc-dismiss-v1';
  const LS_COMPARE  = 'vcc-compare-v1';

  function _lsGet(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function _lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function _getSnoozed() {
    const map = _lsGet(LS_SNOOZE, {});
    const now = Date.now();
    // Auto-purge expired snoozes
    let changed = false;
    Object.keys(map).forEach(k => { if (map[k] < now) { delete map[k]; changed = true; } });
    if (changed) _lsSet(LS_SNOOZE, map);
    return map;
  }
  function _snooze(actionId, days) {
    const map = _getSnoozed();
    map[actionId] = Date.now() + days * 86400000;
    _lsSet(LS_SNOOZE, map);
  }
  function _getDismissed() { return new Set(_lsGet(LS_DISMISS, [])); }
  function _dismiss(actionId) {
    const arr = _lsGet(LS_DISMISS, []);
    if (!arr.includes(actionId)) { arr.push(actionId); _lsSet(LS_DISMISS, arr); }
  }
  function _undismissAll() { _lsSet(LS_DISMISS, []); _lsSet(LS_SNOOZE, {}); }

  function _getCompareIds() { return _lsGet(LS_COMPARE, []); }
  function _setCompareIds(ids) { _lsSet(LS_COMPARE, ids); }
  function _toggleCompare(id) {
    const ids = _getCompareIds();
    const idx = ids.indexOf(id);
    if (idx >= 0) ids.splice(idx, 1);
    else if (ids.length < 4) ids.push(id);
    _setCompareIds(ids);
    _refreshCompareDrawer();
  }
  function _clearCompare() { _setCompareIds([]); _refreshCompareDrawer(); }

  // ─── Trust Score ─────────────────────────────────────────────────────────────
  // Derives a 0–100 trust score per vendor from existing signals:
  //   • Coverage          (max 30): how many of 14 categories are scored
  //   • Provenance quality(max 30): justification length + non-AI source presence
  //   • Freshness         (max 25): days since last score change (CHANGELOG)
  //   • Confidence inverse(max 15): inverse of low-confidence rate
  function _computeTrust(v) {
    const sc = scoredCount(v.scores);
    const coverage = Math.min(30, Math.round((sc / CAT_DEFS.length) * 30));

    // Provenance: scan VD_RAW
    let provScore = 0;
    let totalEntries = 0;
    let humanSourceCount = 0;
    const raw = (typeof VD_RAW !== 'undefined') ? VD_RAW.find(r => r.id === v.id) : null;
    if (raw && raw.s) {
      CAT_DEFS.forEach(c => {
        const entry = raw.s[c.key];
        if (entry && typeof entry === 'object' && entry.j) {
          totalEntries++;
          const j = entry.j.toLowerCase();
          // Long justification + non-AI source = high provenance
          const len = entry.j.length;
          let pts = 0;
          if (len > 60) pts += 1.0;
          else if (len > 25) pts += 0.5;
          if (!j.includes('chatgpt') && !j.includes('assumed') && !j.includes('deferred') && !j.includes('source: ai')) {
            pts += 1.5;
            humanSourceCount++;
          }
          provScore += pts;
        }
      });
    }
    const provenance = totalEntries > 0 ? Math.min(30, Math.round((provScore / (totalEntries * 2.5)) * 30)) : 0;

    // Freshness from CHANGELOG (uses vendor NAME)
    let freshness = 0;
    if (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) {
      const my = CHANGELOG
        .filter(c => c.vendor === v.name && c.cat && CAT_DEFS.some(cd => cd.key === c.cat))
        .map(c => new Date(c.ts).getTime())
        .filter(t => !isNaN(t));
      if (my.length > 0) {
        const days = Math.floor((Date.now() - Math.max(...my)) / 86400000);
        if (days <= 30)      freshness = 25;
        else if (days <= 90) freshness = 18;
        else if (days <= 180)freshness = 10;
        else if (days <= 365)freshness = 5;
        else                 freshness = 2;
      }
    } else {
      freshness = 8; // unknown — neutral-low
    }

    // Confidence inverse
    let confInv = 0;
    if (totalEntries > 0) {
      // count low-conf entries
      let low = 0;
      if (raw && raw.s) {
        CAT_DEFS.forEach(c => {
          const entry = raw.s[c.key];
          if (entry && typeof entry === 'object' && entry.j) {
            const j = entry.j.toLowerCase();
            if (j.includes('confidence: low') || j.includes('chatgpt') && !j.includes('confidence: high') || j.includes('assumed 0') || j.includes('deferred')) low++;
          }
        });
      }
      const lowRate = low / totalEntries;
      confInv = Math.round((1 - lowRate) * 15);
    }

    const total = coverage + provenance + freshness + confInv;
    return { total, coverage, provenance, freshness, confInv, humanSourceCount, totalEntries };
  }

  function _trustBadge(trust) {
    const s = trust.total;
    const cls = s >= 70 ? 'vcc-trust-high' : s >= 45 ? 'vcc-trust-med' : 'vcc-trust-low';
    const dotBg = s >= 70 ? 'var(--green)' : s >= 45 ? '#92400e' : 'var(--accent)';
    return `<span class="vcc-trust ${cls}" title="Coverage:${trust.coverage}/30 · Provenance:${trust.provenance}/30 · Freshness:${trust.freshness}/25 · Confidence:${trust.confInv}/15">
      <span class="vcc-trust-dot" style="background:${dotBg};"></span>Trust ${s}
    </span>`;
  }

  // ─── Historical Drift (from CHANGELOG) ───────────────────────────────────────
  // For each vendor, compute net weighted score change over the last N days.
  function _computeDrift(vendors, days) {
    if (typeof CHANGELOG === 'undefined' || !Array.isArray(CHANGELOG) || CHANGELOG.length === 0) return [];
    const cutoff = Date.now() - days * 86400000;
    const catByKey = Object.fromEntries(CAT_DEFS.map(c => [c.key, c]));
    const vendorByName = Object.fromEntries(vendors.map(v => [v.name, v]));
    const drift = {};

    CHANGELOG.forEach(c => {
      const ts = new Date(c.ts).getTime();
      if (isNaN(ts) || ts < cutoff) return;
      const cat = catByKey[c.cat];
      if (!cat) return;
      const oldN = Number(c.oldVal);
      const newN = Number(c.newVal);
      if (isNaN(oldN) || isNaN(newN)) return;
      const v = vendorByName[c.vendor];
      if (!v) return;
      if (!drift[v.id]) drift[v.id] = { vendor: v, netDelta: 0, weighted: 0, changes: 0, biggestCat: null, biggestDelta: 0 };
      const delta = newN - oldN;
      drift[v.id].netDelta += delta;
      drift[v.id].weighted += delta * cat.weight;
      drift[v.id].changes += 1;
      if (Math.abs(delta) > Math.abs(drift[v.id].biggestDelta)) {
        drift[v.id].biggestDelta = delta;
        drift[v.id].biggestCat = cat.label;
      }
    });

    return Object.values(drift).filter(d => d.changes > 0);
  }

  function _driftRow(d) {
    const v = d.vendor;
    const up = d.weighted > 0;
    const sign = up ? '+' : '';
    return `<div class="vcc-drift-row" onclick="openVendorDetail(${v.id})">
      <div style="flex:1;min-width:0;">
        <div class="vcc-row-name">${esc(v.name)}</div>
        <div class="vcc-row-meta">
          ${v.tier ? tierBadge(v.tier) : ''}
          <span>${d.changes} change${d.changes > 1 ? 's' : ''}</span>
          ${d.biggestCat ? `<span style="color:var(--text-3);">biggest: ${esc(d.biggestCat)} ${d.biggestDelta > 0 ? '+' : ''}${d.biggestDelta}</span>` : ''}
        </div>
      </div>
      <span class="vcc-drift-delta ${up ? 'vcc-drift-up' : 'vcc-drift-dn'}">${sign}${d.netDelta.toFixed(1)}</span>
    </div>`;
  }

  // ─── Rep Group Intelligence ──────────────────────────────────────────────────
  function _aggregateByRep(vendors) {
    const groups = {};
    vendors.forEach(v => {
      const rep = (v.rep || '').trim();
      if (!rep) return;
      if (!groups[rep]) groups[rep] = { name: rep, vendors: [], sales: 0, scoreSum: 0, scoreCount: 0, weakCount: 0, declineCount: 0, gapCount: 0 };
      const g = groups[rep];
      g.vendors.push(v);
      g.sales += v.sales5yr || 0;
      if (v.ws !== null) { g.scoreSum += v.ws; g.scoreCount += 1; }
      if (v.ws !== null && v.ws < 5) g.weakCount += 1;
      if (v.yoy !== null && v.yoy < -0.05) g.declineCount += 1;
      if (v.sc < 5) g.gapCount += 1;
    });
    return Object.values(groups).map(g => ({
      ...g,
      avgScore: g.scoreCount > 0 ? g.scoreSum / g.scoreCount : null,
      weakRate: g.vendors.length > 0 ? g.weakCount / g.vendors.length : 0,
      declineRate: g.vendors.length > 0 ? g.declineCount / g.vendors.length : 0
    }));
  }

  function _repRow(g) {
    const salesStr = _sfmt(g.sales) || '—';
    const avgColor = g.avgScore === null ? 'var(--text-3)' : g.avgScore >= 7 ? 'var(--green)' : g.avgScore >= 5 ? '#f59e0b' : 'var(--accent)';
    const flags = [];
    if (g.weakCount >= 2)    flags.push(`<span style="color:var(--accent);font-weight:600;">${g.weakCount} weak</span>`);
    if (g.declineCount >= 2) flags.push(`<span style="color:var(--accent);font-weight:600;">${g.declineCount} declining</span>`);
    if (g.gapCount >= 3)     flags.push(`<span style="color:var(--yellow);">${g.gapCount} unscored</span>`);
    return `<div class="vcc-rep-row" onclick="vRep='${esc(g.name).replace(/'/g, "\\'")}';vSection='replist';renderVendors($('pg-content'))" title="Open rep list filtered to ${esc(g.name)}">
      <div>
        <div class="vcc-rep-name">${esc(g.name)}</div>
        <div class="vcc-rep-sub">${g.vendors.length} vendor${g.vendors.length > 1 ? 's' : ''} · ${salesStr} 5yr${flags.length ? ' · ' + flags.join(' · ') : ''}</div>
      </div>
      <div class="vcc-rep-stat" style="color:var(--text-3);">${g.scoreCount}/${g.vendors.length}</div>
      <div class="vcc-rep-stat" style="color:${avgColor};">${g.avgScore !== null ? g.avgScore.toFixed(1) : '—'}</div>
      <div class="vcc-rep-stat">${salesStr}</div>
    </div>`;
  }

  // ─── Operational Action Queue ────────────────────────────────────────────────
  // Aggregates all signals into a sorted, persistent action queue.
  // Each action: { id, severity (0-3), type, owner, title, sub, vendorId?, primaryAction? }
  function _buildActionQueue(vendors, categoryHealth, bench) {
    const snoozed = _getSnoozed();
    const dismissed = _getDismissed();
    const actions = [];

    vendors.forEach(v => {
      // P0: significant revenue + low score (portfolio misalignment)
      if (v.ws !== null && v.ws < 5 && v.sales5yr > 30000) {
        actions.push({
          id: `misalign:${v.id}`,
          severity: 0,
          type: 'misalignment',
          owner: 'Owner',
          title: `${v.name}: ${v.ws}/10 score on $${Math.round(v.sales5yr / 1000)}K revenue`,
          sub: 'Portfolio misalignment — review for replacement or terms reset',
          vendorId: v.id,
          primaryLabel: 'Open vendor',
          primaryFn: `openVendorDetail(${v.id})`
        });
      }
      // P0: significant YoY decline
      if (v.yoy !== null && v.yoy < -0.15 && v.sales5yr > 20000) {
        const pct = Math.round(Math.abs(v.yoy) * 100);
        actions.push({
          id: `decline:${v.id}`,
          severity: 0,
          type: 'decline',
          owner: 'Manager',
          title: `${v.name}: ${pct}% YoY decline`,
          sub: `Investigate revenue drop on a $${Math.round(v.sales5yr / 1000)}K vendor`,
          vendorId: v.id,
          primaryLabel: 'Open vendor',
          primaryFn: `openVendorDetail(${v.id})`
        });
      }
      // P1: leverage opportunity
      if (v.sales5yr > 25000 && (
        (v.rebateScore !== null && v.rebateScore < 4) ||
        (v.freightScore !== null && v.freightScore < 4)
      )) {
        actions.push({
          id: `leverage:${v.id}`,
          severity: 1,
          type: 'leverage',
          owner: 'Owner',
          title: `${v.name}: weak terms on high-spend vendor`,
          sub: `Rebates ${v.rebateScore ?? '?'}/10 · Freight ${v.freightScore ?? '?'}/10 — open negotiation window`,
          vendorId: v.id,
          primaryLabel: 'Open vendor',
          primaryFn: `openVendorDetail(${v.id})`
        });
      }
      // P1: revenue vendor with scoring gaps
      if (v.sales5yr > 15000 && v.sc < 5) {
        actions.push({
          id: `gap:${v.id}`,
          severity: 1,
          type: 'gap',
          owner: 'Manager',
          title: `${v.name}: only ${v.sc}/${CAT_DEFS.length} categories scored`,
          sub: `$${Math.round(v.sales5yr / 1000)}K revenue with incomplete intelligence`,
          vendorId: v.id,
          primaryLabel: 'Score vendor',
          primaryFn: `openVendorScoreEntry(${v.id})`
        });
      }
      // P2: low confidence on revenue vendor
      if (v.confRisk > 0.5 && v.lowConfCount >= 3 && v.sales5yr > 10000) {
        actions.push({
          id: `conf:${v.id}`,
          severity: 2,
          type: 'confidence',
          owner: 'Sales',
          title: `${v.name}: verify ${v.lowConfCount} low-confidence scores`,
          sub: `${Math.round(v.confRisk * 100)}% of scored categories use estimated data`,
          vendorId: v.id,
          primaryLabel: 'Open scores',
          primaryFn: `openVendorScoreEntry(${v.id})`
        });
      }
    });

    // Portfolio-level: critical categories
    categoryHealth.forEach(cat => {
      if (cat.flags && cat.flags.includes('critical')) {
        actions.push({
          id: `catcrit:${cat.key}`,
          severity: 0,
          type: 'category',
          owner: 'Owner',
          title: `Portfolio: critical weakness in ${cat.label}`,
          sub: `Average score ${cat.avg !== null ? cat.avg.toFixed(1) : '—'}/10 across ${cat.coverage} vendors`,
          primaryLabel: 'View category',
          primaryFn: `vSortCol='${cat.key}';vSortDir=-1;vSection='scores';renderVendors($('pg-content'))`
        });
      } else if (cat.flags && cat.flags.includes('systemic')) {
        actions.push({
          id: `catsys:${cat.key}`,
          severity: 1,
          type: 'category',
          owner: 'Owner',
          title: `Systemic weakness in ${cat.label}`,
          sub: `Avg ${cat.avg !== null ? cat.avg.toFixed(1) : '—'}/10 across portfolio — strategic gap`,
          primaryLabel: 'View category',
          primaryFn: `vSortCol='${cat.key}';vSortDir=-1;vSection='scores';renderVendors($('pg-content'))`
        });
      }
      if (cat.flags && cat.flags.includes('gap') && cat.total > 20) {
        actions.push({
          id: `catgap:${cat.key}`,
          severity: 2,
          type: 'category',
          owner: 'Manager',
          title: `Low coverage on ${cat.label}: ${Math.round(cat.covPct * 100)}%`,
          sub: `Only ${cat.coverage} of ${cat.total} vendors have this dimension scored`,
          primaryLabel: 'View category',
          primaryFn: `vSortCol='${cat.key}';vSortDir=1;vSection='scores';renderVendors($('pg-content'))`
        });
      }
    });

    // Filter snoozed/dismissed, then sort by severity, then by vendor sales (higher = higher priority)
    return actions
      .filter(a => !dismissed.has(a.id) && !snoozed[a.id])
      .map(a => {
        const v = a.vendorId ? vendors.find(x => x.id === a.vendorId) : null;
        return { ...a, _sales: v ? v.sales5yr : 0 };
      })
      .sort((a, b) => a.severity - b.severity || (b._sales - a._sales));
  }

  function _ownerColor(owner) {
    return owner === 'Owner' ? 'background:var(--purple-bg);color:var(--purple);'
         : owner === 'Manager' ? 'background:var(--blue-bg);color:var(--blue);'
         : 'background:var(--green-bg);color:var(--green);';
  }
  function _typeIcon(t) {
    return { misalignment: '⚠', decline: '↓', leverage: '◈', gap: '○', confidence: '◑', category: '◎' }[t] || '•';
  }

  function _actionRow(a) {
    return `<div class="vcc-aq-row" data-aid="${a.id}">
      <div class="vcc-aq-sev vcc-aq-sev-p${a.severity}"></div>
      <div class="vcc-aq-body">
        <div class="vcc-aq-title">${_typeIcon(a.type)} ${esc(a.title)}</div>
        <div class="vcc-aq-sub">
          <span class="vcc-aq-chip" style="${_ownerColor(a.owner)}">${a.owner}</span>
          <span class="vcc-aq-chip" style="background:var(--surface2);color:var(--text-3);">P${a.severity}</span>
          <span>${esc(a.sub)}</span>
        </div>
      </div>
      <div class="vcc-aq-actions">
        <button class="vcc-aq-btn vcc-aq-btn-primary" onclick="${a.primaryFn}">${esc(a.primaryLabel)}</button>
        <button class="vcc-aq-btn" onclick="vccActionSnooze('${a.id}', 7)" title="Snooze 7 days">⏰ 7d</button>
        <button class="vcc-aq-btn" onclick="vccActionDismiss('${a.id}')" title="Dismiss">✕</button>
      </div>
    </div>`;
  }

  // Per-render state for action queue filter
  let _aqFilter = 'all'; // 'all' | 'p0' | 'p1' | 'mine'
  function _filteredActions(actions, filter) {
    if (filter === 'p0') return actions.filter(a => a.severity === 0);
    if (filter === 'p1') return actions.filter(a => a.severity <= 1);
    return actions;
  }

  function _actionQueueCard(vendors, categoryHealth, bench) {
    const actions = _buildActionQueue(vendors, categoryHealth, bench);
    const filtered = _filteredActions(actions, _aqFilter);
    const counts = {
      all: actions.length,
      p0: actions.filter(a => a.severity === 0).length,
      p1: actions.filter(a => a.severity <= 1).length
    };
    const filterBtn = (key, label, count) => `
      <button class="vcc-aq-btn ${_aqFilter === key ? 'vcc-aq-btn-primary' : ''}"
        onclick="vccActionFilter('${key}')">${label}${count !== undefined ? ` <span style="opacity:.7;">${count}</span>` : ''}</button>`;

    return `<div class="card">
      <div class="card-hd" style="padding-bottom:12px;">
        <div>
          <div class="card-title">⚡ Operational Action Queue</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Aggregated signals · ranked by severity · snooze or dismiss to clear</div>
        </div>
        <div class="vcc-aq-filter">
          ${filterBtn('all', 'All', counts.all)}
          ${filterBtn('p0', 'P0 only', counts.p0)}
          ${filterBtn('p1', 'P0–P1', counts.p1)}
          <button class="vcc-aq-btn" onclick="vccActionResetAll()" title="Restore all dismissed and snoozed actions">↻ Reset</button>
        </div>
      </div>
      <div style="padding:0 16px 16px;">
        ${filtered.length > 0
          ? `<div class="vcc-aq">${filtered.slice(0, 12).map(_actionRow).join('')}</div>${filtered.length > 12 ? `<div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:10px;">+ ${filtered.length - 12} more · adjust filter or take action to surface</div>` : ''}`
          : `<div class="vcc-aq-empty ${actions.length === 0 ? 'vcc-aq-empty-ok' : ''}">${actions.length === 0 ? '✓ No outstanding operational actions — clean queue.' : 'No actions match this filter. Try All or click ↻ Reset.'}</div>`}
      </div>
    </div>`;
  }

  // Window-exposed handlers (called from inline onclick)
  window.vccActionSnooze   = function (id, days) { _snooze(id, days); renderVendors($('pg-content')); };
  window.vccActionDismiss  = function (id)       { _dismiss(id); renderVendors($('pg-content')); };
  window.vccActionResetAll = function ()         { _undismissAll(); renderVendors($('pg-content')); };
  window.vccActionFilter   = function (key)      { _aqFilter = key; renderVendors($('pg-content')); };

  // ─── Compare Mode ────────────────────────────────────────────────────────────
  function _refreshCompareDrawer() {
    let drawer = document.getElementById('vcc-compare-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'vcc-compare-drawer';
      drawer.className = 'vcc-cdrawer';
      document.body.appendChild(drawer);
    }
    const ids = _getCompareIds();
    if (ids.length === 0) { drawer.classList.remove('on'); drawer.innerHTML = ''; return; }
    const vendors = ids.map(id => VD.find(v => v.id === id)).filter(Boolean);
    drawer.innerHTML = `
      <span class="vcc-cdrawer-lbl">Compare</span>
      ${vendors.map(v => `
        <span class="vcc-cdrawer-chip">
          ${esc(v.name)}
          <button class="vcc-cdrawer-x" onclick="vccToggleCompare(${v.id})" title="Remove">✕</button>
        </span>
      `).join('')}
      <div class="vcc-cdrawer-spacer"></div>
      <span style="font-size:11px;color:rgba(255,255,255,.5);">${vendors.length} / 4</span>
      <button class="vcc-cdrawer-clear" onclick="vccClearCompare()">Clear</button>
      <button class="vcc-cdrawer-go" onclick="vccOpenCompareModal()" ${vendors.length < 2 ? 'disabled style="opacity:.4;cursor:not-allowed;"' : ''}>Open Comparison →</button>
    `;
    drawer.classList.add('on');

    // Refresh any "Add to compare" buttons on the page (mark selected)
    document.querySelectorAll('.vcc-add-cmp[data-vid]').forEach(btn => {
      const vid = Number(btn.getAttribute('data-vid'));
      if (ids.includes(vid)) { btn.classList.add('on'); btn.textContent = '✓ In compare'; }
      else { btn.classList.remove('on'); btn.textContent = '+ Compare'; }
    });
  }

  function _openCompareModal() {
    const ids = _getCompareIds();
    if (ids.length < 2) return;
    const vendors = ids.map(id => VD.find(v => v.id === id)).filter(Boolean);
    const allScores = VD.map(vx => weightedScore(vx)).filter(s => s !== null);
    const enriched = vendors.map(v => {
      const en = _enrichVendors(allScores).find(x => x.id === v.id);
      const trust = _computeTrust(v);
      return { ...en, trust };
    });
    const bench = _computeBenchmarks(_enrichVendors(allScores));

    const cols = enriched.length;
    const gridCols = `160px repeat(${cols}, 1fr)`;

    const cellFmt = {
      tier: v => v.tier ? tierBadge(v.tier) : '<span style="color:var(--text-3);">unranked</span>',
      score: v => v.ws !== null ? `<span class="mono fw6" style="color:${scoreColor(v.ws)};font-size:16px;">${v.ws}</span><span style="color:var(--text-3);font-size:11px;"> /10</span>` : '<span style="color:var(--text-3);">—</span>',
      trust: v => _trustBadge(v.trust),
      sales5yr: v => `<span class="mono">${_sfmt(v.sales5yr) || '—'}</span>`,
      yoy: v => {
        if (v.yoy === null) return '<span style="color:var(--text-3);">—</span>';
        const pct = Math.round(v.yoy * 100);
        const c = v.yoy > 0.03 ? 'var(--green)' : v.yoy < -0.03 ? 'var(--accent)' : 'var(--text-3)';
        return `<span class="mono fw6" style="color:${c};">${v.yoy >= 0 ? '+' : ''}${pct}%</span>`;
      },
      sc: v => `<span class="mono">${v.sc}/${CAT_DEFS.length}</span>`,
      conf: v => v.lowConfCount > 0 ? `<span style="color:var(--yellow);">${v.lowConfCount} low-conf</span>` : '<span style="color:var(--green);">clean</span>'
    };

    const benchDelta = (val, avg) => {
      if (val === null || val === undefined || avg === null) return '';
      const d = val - avg;
      const c = d > 0.3 ? 'var(--green)' : d < -0.3 ? 'var(--accent)' : 'var(--text-3)';
      return ` <span style="color:${c};font-size:10px;">(${d >= 0 ? '+' : ''}${d.toFixed(1)})</span>`;
    };

    const catRows = CAT_DEFS.map(c => `
      <div class="vcc-cmp-row-lbl">${c.label} <span style="color:var(--text-3);font-weight:500;">(wt ${c.weight})</span></div>
      ${enriched.map(v => {
        const s = v.scores?.[c.key];
        if (s === undefined || s === null) return `<div class="vcc-cmp-cell"><span style="color:var(--text-3);">—</span></div>`;
        if (s === 'na') return `<div class="vcc-cmp-cell"><span class="na">N/A</span></div>`;
        const color = scoreColor(s);
        const cellBg = heatColor(s);
        return `<div class="vcc-cmp-cell" style="padding:8px 12px;">
          <span style="display:inline-block;padding:4px 10px;background:${cellBg};color:${heatTextColor(s)};border-radius:4px;font-family:'DM Mono',monospace;font-weight:700;font-size:13px;min-width:30px;text-align:center;">${s}</span>
          ${benchDelta(s, bench.catAvg[c.key])}
        </div>`;
      }).join('')}
    `).join('');

    const body = `
      <div class="vcc-cmp-wrap">
        <div class="vcc-cmp-grid" style="grid-template-columns:${gridCols};">
          <div class="vcc-cmp-name" style="background:var(--surface2);">Vendor</div>
          ${enriched.map(v => `<div class="vcc-cmp-name">
            ${esc(v.name)}
            <button class="vcc-aq-btn" style="margin-left:8px;font-size:10px;padding:2px 8px;" onclick="closeModal();openVendorDetail(${v.id})">Detail →</button>
          </div>`).join('')}

          <div class="vcc-cmp-row-lbl">Tier</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.tier(v)}</div>`).join('')}

          <div class="vcc-cmp-row-lbl">Weighted Score</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.score(v)}${benchDelta(v.ws, bench.avgScore)}</div>`).join('')}

          <div class="vcc-cmp-row-lbl">Trust Score</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.trust(v)}</div>`).join('')}

          <div class="vcc-cmp-row-lbl">YoY Trend</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.yoy(v)}</div>`).join('')}

          <div class="vcc-cmp-row-lbl">5-Yr Revenue</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.sales5yr(v)}</div>`).join('')}

          <div class="vcc-cmp-row-lbl">Coverage</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.sc(v)}</div>`).join('')}

          <div class="vcc-cmp-row-lbl">Confidence</div>
          ${enriched.map(v => `<div class="vcc-cmp-cell">${cellFmt.conf(v)}</div>`).join('')}

          ${catRows}
        </div>
      </div>
      <div style="padding:14px 18px;font-size:11px;color:var(--text-3);border-top:1px solid var(--border);display:flex;gap:18px;flex-wrap:wrap;">
        <span>Numbers in parens show <strong>delta vs portfolio average</strong></span>
        <span style="color:var(--green);">green = above avg</span>
        <span style="color:var(--accent);">red = below avg</span>
      </div>
    `;
    openModal(`Compare ${enriched.length} Vendors`, body);
    // Widen the modal for comparison
    setTimeout(() => {
      const m = document.querySelector('.overlay.on .modal');
      if (m) { m.style.maxWidth = '1100px'; m.style.width = '95%'; }
    }, 30);
  }

  window.vccToggleCompare    = _toggleCompare;
  window.vccClearCompare     = _clearCompare;
  window.vccOpenCompareModal = _openCompareModal;
  window.vccRefreshDrawer    = _refreshCompareDrawer;

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PHASE 4: PORTFOLIO INTELLIGENCE LAYER ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  function _injectStylesP4() {
    if (document.getElementById('vcc-styles-p4')) return;
    const s = document.createElement('style');
    s.id = 'vcc-styles-p4';
    s.textContent = `
      /* Executive Daily Brief */
      .vcc-brief     { display:grid; grid-template-columns:repeat(5,1fr); gap:0; background:var(--text); border-radius:var(--radius); overflow:hidden; }
      .vcc-brief-item{ display:flex; flex-direction:column; gap:2px; padding:13px 16px; border-right:1px solid rgba(255,255,255,.08); }
      .vcc-brief-item:last-child { border-right:none; }
      .vcc-brief-lbl { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.45); }
      .vcc-brief-val { font-family:'DM Mono',monospace; font-size:17px; font-weight:700; line-height:1.2; color:#fff; }
      .vcc-brief-sub { font-size:10.5px; color:rgba(255,255,255,.5); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .vcc-brief-ok  { color:#4ade80 !important; }
      .vcc-brief-warn{ color:#fbbf24 !important; }
      .vcc-brief-err { color:#f87171 !important; }

      /* Portfolio Exposure */
      .vcc-expo-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px 32px; }
      .vcc-expo-item { display:flex; flex-direction:column; gap:6px; }
      .vcc-expo-lbl  { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); }
      .vcc-expo-bar  { height:8px; background:var(--border); border-radius:4px; overflow:hidden; }
      .vcc-expo-fill { height:100%; border-radius:4px; transition:width .5s; }
      .vcc-expo-val  { font-family:'DM Mono',monospace; font-size:13px; font-weight:700; color:var(--text); }
      .vcc-expo-sub  { font-size:11px; color:var(--text-3); }
      .vcc-expo-band { display:flex; gap:0; height:10px; border-radius:5px; overflow:hidden; margin-top:4px; }
      .vcc-expo-seg  { height:100%; transition:width .5s; }
      .vcc-conc-row  { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-light); cursor:pointer; }
      .vcc-conc-row:last-child { border-bottom:none; }
      .vcc-conc-row:hover { background:var(--bg); margin:0 -14px; padding:7px 14px; border-radius:6px; }
      .vcc-conc-name { flex:1; font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .vcc-conc-pct  { font-family:'DM Mono',monospace; font-size:12px; font-weight:700; min-width:44px; text-align:right; }
      .vcc-conc-bar  { width:70px; height:5px; background:var(--border); border-radius:3px; overflow:hidden; flex-shrink:0; }
      .vcc-conc-fill { height:100%; border-radius:3px; }

      /* Opportunity Radar */
      .vcc-opp-row   { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-light); cursor:pointer; }
      .vcc-opp-row:last-child { border-bottom:none; }
      .vcc-opp-row:hover { background:var(--bg); margin:0 -14px; padding:10px 14px; border-radius:6px; }
      .vcc-opp-icon  { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
      .vcc-opp-body  { flex:1; min-width:0; }
      .vcc-opp-title { font-size:13px; font-weight:600; color:var(--text); }
      .vcc-opp-sub   { font-size:11px; color:var(--text-3); margin-top:2px; }
      .vcc-opp-val   { font-family:'DM Mono',monospace; font-size:12px; font-weight:700; flex-shrink:0; }

      /* Strategic Watchlist */
      .vcc-wl-row    { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-light); }
      .vcc-wl-row:last-child { border-bottom:none; }
      .vcc-wl-tag    { display:inline-flex; align-items:center; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; flex-shrink:0; white-space:nowrap; }
      .vcc-wl-pin    { background:var(--accent); color:#fff; }
      .vcc-wl-watch  { background:var(--blue-bg); color:var(--blue); }
      .vcc-wl-strat  { background:var(--purple-bg); color:var(--purple); }
      .vcc-wl-name   { flex:1; font-size:13px; font-weight:600; cursor:pointer; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .vcc-wl-name:hover { color:var(--accent); }
      .vcc-wl-rm     { background:none; border:none; cursor:pointer; color:var(--text-3); font-size:14px; padding:2px 6px; border-radius:4px; flex-shrink:0; }
      .vcc-wl-rm:hover { color:var(--accent); background:var(--red-bg); }
      .vcc-wl-empty  { padding:24px 0; text-align:center; color:var(--text-3); font-size:12.5px; line-height:1.6; }

      /* Operational Narrative */
      .vcc-narr      { display:flex; flex-direction:column; gap:8px; }
      .vcc-narr-item { display:flex; align-items:flex-start; gap:10px; padding:11px 14px; background:var(--surface2); border-radius:var(--radius-sm); border-left:3px solid transparent; }
      .vcc-narr-err  { border-color:var(--accent); }
      .vcc-narr-warn { border-color:#f59e0b; }
      .vcc-narr-ok   { border-color:var(--green); }
      .vcc-narr-info { border-color:var(--blue); }
      .vcc-narr-ico  { font-size:14px; flex-shrink:0; margin-top:1px; }
      .vcc-narr-txt  { font-size:13px; color:var(--text); line-height:1.55; }

      /* Rep header row */
      .vcc-rep-hdr   { display:grid; grid-template-columns:1fr auto auto auto; gap:14px; padding:4px 0 8px; font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); border-bottom:1px solid var(--border-light); }
      .vcc-rep-hdr > div { text-align:right; }
      .vcc-rep-hdr > div:first-child { text-align:left; }

      /* Responsive P4 */
      @media (max-width:900px) {
        .vcc-brief    { grid-template-columns:1fr 1fr 1fr !important; }
        .vcc-expo-grid{ grid-template-columns:1fr !important; }
      }
      @media (max-width:560px) {
        .vcc-brief    { grid-template-columns:1fr 1fr !important; }
        .vcc-brief-val{ font-size:14px !important; }
      }
    `;
    document.head.appendChild(s);
  }

  // ─── Executive Daily Brief ────────────────────────────────────────────────────
  function _execBriefCard(vendors, categoryHealth, bench, allScores) {
    const criticalCats = categoryHealth.filter(c => c.flags.includes('critical') || c.flags.includes('systemic'));
    const p0Count = _buildActionQueue(vendors, categoryHealth, bench).filter(a => a.severity === 0).length;
    const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;
    const declining = vendors.filter(v => v.yoy !== null && v.yoy < -0.05 && v.sales5yr > 8000)
      .sort((a, b) => a.yoy - b.yoy);
    const improving = vendors.filter(v => v.yoy !== null && v.yoy > 0.12 && v.sales5yr > 3000)
      .sort((a, b) => b.yoy - a.yoy);
    const worstDecline = declining[0];
    const bestMover    = improving[0];

    const items = [
      {
        lbl: 'Portfolio Score',
        val: avg !== null ? avg.toFixed(1) : '—',
        sub: `${allScores.length} vendors ranked`,
        cls: avg === null ? '' : avg >= 6.5 ? 'vcc-brief-ok' : avg >= 5 ? 'vcc-brief-warn' : 'vcc-brief-err'
      },
      {
        lbl: 'P0 Actions',
        val: p0Count,
        sub: p0Count === 0 ? 'queue clear' : 'critical · needs attention',
        cls: p0Count === 0 ? 'vcc-brief-ok' : 'vcc-brief-err'
      },
      {
        lbl: 'Critical Categories',
        val: criticalCats.length,
        sub: criticalCats.length > 0 ? criticalCats.map(c => c.label).slice(0, 2).join(', ') : 'all stable',
        cls: criticalCats.length === 0 ? 'vcc-brief-ok' : 'vcc-brief-err'
      },
      {
        lbl: 'Biggest Risk',
        val: worstDecline ? `↓${Math.abs(Math.round(worstDecline.yoy * 100))}%` : '—',
        sub: worstDecline ? esc(worstDecline.name) : 'no YoY declines detected',
        cls: worstDecline ? 'vcc-brief-err' : 'vcc-brief-ok'
      },
      {
        lbl: 'Best Mover',
        val: bestMover ? `↑${Math.round(bestMover.yoy * 100)}%` : '—',
        sub: bestMover ? esc(bestMover.name) : 'no standout growth',
        cls: bestMover ? 'vcc-brief-ok' : ''
      }
    ];

    return `<div class="vcc-brief">
      ${items.map(it => `<div class="vcc-brief-item">
        <div class="vcc-brief-lbl">${it.lbl}</div>
        <div class="vcc-brief-val ${it.cls}">${it.val}</div>
        <div class="vcc-brief-sub" title="${it.sub}">${it.sub}</div>
      </div>`).join('')}
    </div>`;
  }

  // ─── Portfolio Exposure ───────────────────────────────────────────────────────
  function _computeExposure(vendors, categoryHealth) {
    const totalSales  = vendors.reduce((s, v) => s + v.sales5yr, 0) || 1;
    const byRevenue   = [...vendors].filter(v => v.sales5yr > 0).sort((a, b) => b.sales5yr - a.sales5yr);
    const top1Pct     = byRevenue.length > 0 ? (byRevenue[0].sales5yr / totalSales) * 100 : 0;
    const top3Pct     = byRevenue.slice(0, 3).reduce((s, v) => s + v.sales5yr, 0) / totalSales * 100;
    const top5Pct     = byRevenue.slice(0, 5).reduce((s, v) => s + v.sales5yr, 0) / totalSales * 100;

    const repGroups   = _aggregateByRep(vendors);
    const topRep      = repGroups.sort((a, b) => b.sales - a.sales)[0];
    const topRepPct   = topRep ? (topRep.sales / totalSales) * 100 : 0;
    const topRepName  = topRep ? topRep.name : '—';

    const fragileCats = categoryHealth.filter(c => {
      const above5 = vendors.filter(v => typeof v.scores?.[c.key] === 'number' && v.scores[c.key] >= 5);
      return c.coverage > 0 && above5.length < 3;
    });

    const confRiskRev  = vendors.filter(v => v.confRisk > 0.33).reduce((s, v) => s + v.sales5yr, 0);
    const confRiskPct  = (confRiskRev / totalSales) * 100;
    const dominated    = byRevenue.filter(v => (v.sales5yr / totalSales) > 0.15);
    const riskLevel    = top3Pct > 60 ? 'high' : top3Pct > 45 ? 'medium' : 'low';

    return { totalSales, byRevenue, top1Pct, top3Pct, top5Pct, topRepPct, topRepName, repCount: repGroups.length, fragileCats, confRiskPct, dominated, riskLevel };
  }

  function _exposureCard(vendors, categoryHealth, expo) {
    const { totalSales, byRevenue, top1Pct, top3Pct, top5Pct, topRepPct, topRepName, repCount, fragileCats, confRiskPct, dominated, riskLevel } = expo;
    const next2Pct   = top3Pct - top1Pct;
    const next5Pct   = top5Pct - top3Pct;
    const restPct    = Math.max(0, 100 - top5Pct);
    const riskColor  = riskLevel === 'high' ? 'var(--accent)' : riskLevel === 'medium' ? '#f59e0b' : 'var(--green)';
    const riskBg     = riskLevel === 'high' ? 'var(--red-bg)' : riskLevel === 'medium' ? 'var(--yellow-bg)' : 'var(--green-bg)';

    const concRows = byRevenue.slice(0, 6).map(v => {
      const pct = (v.sales5yr / totalSales * 100).toFixed(1);
      const fc  = pct > 20 ? 'var(--accent)' : pct > 12 ? '#f59e0b' : 'var(--blue)';
      return `<div class="vcc-conc-row" onclick="openVendorDetail(${v.id})">
        <div class="vcc-conc-name">${esc(v.name)}</div>
        <div class="vcc-conc-bar"><div class="vcc-conc-fill" style="width:${Math.min(pct, 100)}%;background:${fc};"></div></div>
        <div class="vcc-conc-pct" style="color:${fc};">${pct}%</div>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card-hd" style="padding-bottom:12px;">
        <div>
          <div class="card-title">⬡ Portfolio Exposure</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Revenue concentration · dependency risk · fragility indicators</div>
        </div>
        <span style="padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;background:${riskBg};color:${riskColor};">${riskLevel.toUpperCase()} CONCENTRATION</span>
      </div>
      <div style="padding:0 20px 16px;">
        <div style="margin-bottom:16px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:8px;">Revenue Concentration Band</div>
          <div class="vcc-expo-band">
            <div class="vcc-expo-seg" style="width:${top1Pct.toFixed(1)}%;background:var(--accent);" title="Top vendor: ${top1Pct.toFixed(0)}%"></div>
            <div class="vcc-expo-seg" style="width:${next2Pct.toFixed(1)}%;background:#f59e0b;" title="#2–3: ${next2Pct.toFixed(0)}%"></div>
            <div class="vcc-expo-seg" style="width:${next5Pct.toFixed(1)}%;background:#3b82f6;" title="#4–5: ${next5Pct.toFixed(0)}%"></div>
            <div class="vcc-expo-seg" style="width:${restPct.toFixed(1)}%;background:var(--border);" title="Rest: ${restPct.toFixed(0)}%"></div>
          </div>
          <div style="display:flex;gap:14px;margin-top:7px;font-size:10px;color:var(--text-3);flex-wrap:wrap;">
            <span><span style="color:var(--accent);">■</span> #1 ${top1Pct.toFixed(0)}%</span>
            <span><span style="color:#f59e0b;">■</span> #2–3 ${next2Pct.toFixed(0)}%</span>
            <span><span style="color:#3b82f6;">■</span> #4–5 ${next5Pct.toFixed(0)}%</span>
            <span><span style="color:var(--text-3);">■</span> Rest ${restPct.toFixed(0)}%</span>
          </div>
        </div>
        <div class="vcc-expo-grid">
          <div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
              ${[
                { lbl:'Top 1', val:top1Pct.toFixed(0)+'%', risk:top1Pct > 20 },
                { lbl:'Top 3', val:top3Pct.toFixed(0)+'%', risk:top3Pct > 45 },
                { lbl:'Top 5', val:top5Pct.toFixed(0)+'%', risk:top5Pct > 60 }
              ].map(m => `<div style="padding:10px 12px;background:var(--surface2);border-radius:6px;text-align:center;">
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);">${m.lbl}</div>
                <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:${m.risk ? 'var(--accent)' : 'var(--text)'};">${m.val}</div>
              </div>`).join('')}
            </div>
            <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:8px;">Top Revenue Vendors</div>
            ${concRows}
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="vcc-expo-item">
              <div class="vcc-expo-lbl">Rep Concentration</div>
              <div class="vcc-expo-bar"><div class="vcc-expo-fill" style="width:${Math.min(topRepPct, 100).toFixed(1)}%;background:${topRepPct > 35 ? 'var(--accent)' : topRepPct > 20 ? '#f59e0b' : 'var(--green)'};"></div></div>
              <div style="display:flex;justify-content:space-between;">
                <div class="vcc-expo-sub">${topRepName !== '—' ? esc(topRepName) + ' · ' : ''}${repCount} total reps</div>
                <div class="vcc-expo-val" style="color:${topRepPct > 35 ? 'var(--accent)' : topRepPct > 20 ? '#f59e0b' : 'var(--green)'};">${topRepPct.toFixed(0)}%</div>
              </div>
            </div>
            <div class="vcc-expo-item">
              <div class="vcc-expo-lbl">Category Fragility</div>
              <div class="vcc-expo-val" style="color:${fragileCats.length > 3 ? 'var(--accent)' : fragileCats.length > 1 ? '#f59e0b' : 'var(--green)'};">${fragileCats.length} fragile</div>
              <div class="vcc-expo-sub">${fragileCats.length > 0 ? fragileCats.map(c => c.label).slice(0, 3).join(', ') : 'all categories have multiple strong vendors'}</div>
            </div>
            <div class="vcc-expo-item">
              <div class="vcc-expo-lbl">Unverified Revenue Exposure</div>
              <div class="vcc-expo-bar"><div class="vcc-expo-fill" style="width:${Math.min(confRiskPct, 100).toFixed(1)}%;background:${confRiskPct > 30 ? 'var(--accent)' : confRiskPct > 15 ? '#f59e0b' : 'var(--green)'};"></div></div>
              <div style="display:flex;justify-content:space-between;">
                <div class="vcc-expo-sub">revenue in low-confidence scored vendors</div>
                <div class="vcc-expo-val" style="color:${confRiskPct > 30 ? 'var(--accent)' : confRiskPct > 15 ? '#f59e0b' : 'var(--green)'};">${confRiskPct.toFixed(0)}%</div>
              </div>
            </div>
            ${dominated.length > 0 ? `<div style="padding:10px 12px;background:var(--red-bg);border-radius:6px;border:1px solid #fecaca;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:4px;">Single-Vendor Risk</div>
              <div style="font-size:12.5px;color:var(--text);line-height:1.4;">${dominated.map(v => `<strong>${esc(v.name)}</strong> (${(v.sales5yr / totalSales * 100).toFixed(0)}%)`).join(', ')} represent${dominated.length === 1 ? 's' : ''} &gt;15% of revenue individually.</div>
            </div>` : `<div style="padding:10px 12px;background:var(--green-bg);border-radius:6px;border:1px solid #bbf7d0;">
              <div style="font-size:11px;font-weight:600;color:var(--green);">✓ No single vendor exceeds 15% of total revenue.</div>
            </div>`}
          </div>
        </div>
      </div>
    </div>`;
  }

  // ─── Opportunity Radar ────────────────────────────────────────────────────────
  function _buildOpportunities(vendors, bench, drift) {
    const opps = [];
    const medianSales = (() => {
      const s = vendors.filter(v => v.sales5yr > 0).map(v => v.sales5yr).sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)] || 0;
    })();

    vendors.filter(v => v.yoy !== null && v.yoy > 0.12 && v.sales5yr > 3000)
      .sort((a, b) => b.yoy - a.yoy).slice(0, 3)
      .forEach(v => opps.push({ type:'improving', icon:'📈', color:'var(--green)', bg:'var(--green-bg)', vendorId:v.id,
        title:`${v.name} — rapid growth`, sub:`↑${Math.round(v.yoy*100)}% YoY · ${_sfmt(v.sales5yr)||''} 5yr · Tier ${v.tier||'—'}`,
        val:`+${Math.round(v.yoy*100)}%`, impact:v.sales5yr * v.yoy }));

    vendors.filter(v => v.ws !== null && v.ws >= 7.5 && v.sales5yr < medianSales && v.sales5yr > 0)
      .sort((a, b) => b.ws - a.ws).slice(0, 3)
      .forEach(v => opps.push({ type:'underutilized', icon:'💎', color:'#7c3aed', bg:'var(--purple-bg)', vendorId:v.id,
        title:`${v.name} — underutilized`, sub:`Score ${v.ws}/10 · ${_sfmt(v.sales5yr)||''} 5yr · below-median revenue for this rating`,
        val:`${v.ws}/10`, impact:(medianSales - v.sales5yr) * 0.4 }));

    if (bench.avgRebate !== null) {
      vendors.filter(v => v.sales5yr > 15000 && v.rebateScore !== null && v.rebateScore < bench.avgRebate - 1.5)
        .sort((a, b) => b.sales5yr - a.sales5yr).slice(0, 2)
        .forEach(v => opps.push({ type:'leverage', icon:'◈', color:'var(--purple)', bg:'var(--purple-bg)', vendorId:v.id,
          title:`${v.name} — rebate leverage`, sub:`Rebate ${v.rebateScore}/10 vs avg ${bench.avgRebate.toFixed(1)} · ${_sfmt(v.sales5yr)||''}`,
          val:`${(bench.avgRebate - v.rebateScore).toFixed(1)} gap`, impact:v.sales5yr * 0.02 }));
    }
    if (bench.avgFreight !== null) {
      vendors.filter(v => v.sales5yr > 12000 && v.freightScore !== null && v.freightScore < bench.avgFreight - 1.5)
        .sort((a, b) => b.sales5yr - a.sales5yr).slice(0, 2)
        .forEach(v => opps.push({ type:'freight', icon:'🚚', color:'#0891b2', bg:'#ecfeff', vendorId:v.id,
          title:`${v.name} — freight terms gap`, sub:`Freight ${v.freightScore}/10 vs avg ${bench.avgFreight.toFixed(1)} · ${_sfmt(v.sales5yr)||''}`,
          val:`${(bench.avgFreight - v.freightScore).toFixed(1)} gap`, impact:v.sales5yr * 0.01 }));
    }

    if (drift && drift.length > 0) {
      drift.filter(d => d.weighted > 0 && d.vendor.sales5yr > 5000)
        .sort((a, b) => b.weighted - a.weighted).slice(0, 2)
        .forEach(d => opps.push({ type:'trending', icon:'⬆', color:'var(--green)', bg:'var(--green-bg)', vendorId:d.vendor.id,
          title:`${d.vendor.name} — score improving`, sub:`+${d.netDelta.toFixed(1)} net · ${d.changes} change${d.changes>1?'s':''} · led by ${d.biggestCat||'—'}`,
          val:`+${d.weighted.toFixed(0)} wt`, impact:d.vendor.sales5yr * 0.05 }));
    }

    const seen = new Set();
    return opps
      .sort((a, b) => b.impact - a.impact)
      .filter(o => { if (seen.has(o.vendorId)) return false; seen.add(o.vendorId); return true; })
      .slice(0, 8);
  }

  function _oppRow(o) {
    return `<div class="vcc-opp-row" onclick="openVendorDetail(${o.vendorId})">
      <div class="vcc-opp-icon" style="background:${o.bg};color:${o.color};">${o.icon}</div>
      <div class="vcc-opp-body">
        <div class="vcc-opp-title">${esc(o.title)}</div>
        <div class="vcc-opp-sub">${o.sub}</div>
      </div>
      <div class="vcc-opp-val" style="color:${o.color};">${o.val}</div>
    </div>`;
  }

  // ─── Strategic Watchlist ──────────────────────────────────────────────────────
  const LS_WATCHLIST = 'vcc-watchlist-v1';

  function _getWatchlist()     { return _lsGet(LS_WATCHLIST, []); }
  function _setWatchlist(list) { _lsSet(LS_WATCHLIST, list); }
  function _addToWatchlist(id, type) {
    const list = _getWatchlist().filter(e => e.id !== id);
    list.push({ id, type, added: Date.now() });
    _setWatchlist(list);
  }
  function _removeFromWatchlist(id) { _setWatchlist(_getWatchlist().filter(e => e.id !== id)); }
  function _isWatched(id) { return _getWatchlist().some(e => e.id === id); }

  function _watchlistCard(vendors) {
    const list = _getWatchlist();
    const tagMeta = { pin:{ lbl:'Pinned', cls:'vcc-wl-pin' }, watch:{ lbl:'Watch', cls:'vcc-wl-watch' }, strategic:{ lbl:'Strategic', cls:'vcc-wl-strat' } };
    const rows = list.map(entry => {
      const v = vendors.find(x => x.id === entry.id);
      if (!v) return '';
      const tag = tagMeta[entry.type] || tagMeta.watch;
      return `<div class="vcc-wl-row">
        <span class="vcc-wl-tag ${tag.cls}">${tag.lbl}</span>
        <span class="vcc-wl-name" onclick="openVendorDetail(${v.id})">${esc(v.name)}</span>
        ${v.ws !== null ? _scorePill(v.ws) : ''}
        ${v.yoy !== null ? _trendBadge(v.yoy) : ''}
        <button class="vcc-wl-rm" onclick="vccWatchlistRemove(${v.id})" title="Remove">✕</button>
      </div>`;
    }).filter(Boolean);

    return `<div class="card">
      <div class="card-hd" style="padding-bottom:4px;">
        <div>
          <div class="card-title">⭐ Strategic Watchlist</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Pinned · monitoring · key relationships</div>
        </div>
        <button class="vcc-aq-btn" onclick="vccWatchlistOpenAdd()">+ Add</button>
      </div>
      <div style="padding:8px 16px 12px;">
        ${rows.length > 0 ? rows.join('') : `<div class="vcc-wl-empty">No vendors on watchlist yet.<br>Open a vendor detail or click <strong>+ Add</strong> to begin tracking.</div>`}
      </div>
    </div>`;
  }

  // ─── Operational Narrative ────────────────────────────────────────────────────
  function _generateNarrative(vendors, categoryHealth, bench, expo, drift) {
    const narratives = [];
    const scored = vendors.filter(v => v.ws !== null);
    const avg    = bench.avgScore;
    const above7 = scored.filter(v => v.ws >= 7).length;

    narratives.push({
      cls: avg === null ? 'vcc-narr-info' : avg >= 6.5 ? 'vcc-narr-ok' : avg >= 5 ? 'vcc-narr-warn' : 'vcc-narr-err',
      ico: avg === null ? '◍' : avg >= 6.5 ? '✓' : avg >= 5 ? '~' : '⚠',
      txt: `Portfolio average score is ${avg !== null ? avg.toFixed(1) : '—'}/10 across ${scored.length} ranked vendors — ${above7} vendors score 7 or above, representing the A/B performance tier.`
    });

    if (expo.top3Pct > 45) {
      const top3names = expo.byRevenue.slice(0, 3).map(v => v.name).join(', ');
      narratives.push({ cls: expo.riskLevel === 'high' ? 'vcc-narr-err' : 'vcc-narr-warn', ico: '⬡',
        txt: `Revenue concentration is ${expo.riskLevel}: ${top3names} account for ${expo.top3Pct.toFixed(0)}% of 5-year sales. Consider additional contractual protections or diversification.` });
    }

    const declining = vendors.filter(v => v.yoy !== null && v.yoy < -0.05 && v.sales5yr > 8000).sort((a, b) => a.yoy - b.yoy);
    if (declining.length > 0) {
      const worst = declining[0];
      let txt = `${worst.name} is deteriorating YoY (${Math.round(worst.yoy * 100)}%)`;
      if (worst.weakCats && worst.weakCats.length > 0) {
        const cats = worst.weakCats.map(k => CAT_DEFS.find(c => c.key === k)?.label).filter(Boolean);
        if (cats.length > 0) txt += `, primarily weak in ${cats.slice(0, 2).join(' and ')}`;
      }
      txt += declining.length > 1 ? `. ${declining.length - 1} additional vendor${declining.length > 2 ? 's' : ''} also declining.` : '.';
      narratives.push({ cls: 'vcc-narr-err', ico: '↓', txt });
    }

    const criticalCats = categoryHealth.filter(c => c.flags.includes('critical') || c.flags.includes('systemic'));
    if (criticalCats.length > 0) {
      narratives.push({ cls: 'vcc-narr-err', ico: '⚠',
        txt: `Category-wide weakness in ${criticalCats.map(c => c.label).join(', ')}. Low avg scores across the vendor base suggest a systemic gap — portfolio-level renegotiation likely more effective than individual vendor action.` });
    }

    const emerging = vendors.filter(v => v.ws !== null && v.ws >= 7 && v.yoy !== null && v.yoy > 0.08 && v.sales5yr > 3000)
      .sort((a, b) => (b.ws + b.yoy * 5) - (a.ws + a.yoy * 5)).slice(0, 2);
    emerging.forEach(v => narratives.push({ cls: 'vcc-narr-ok', ico: '↑',
      txt: `${v.name} is emerging as a high-value partner — score ${v.ws}/10 with ${Math.round(v.yoy * 100)}% YoY revenue growth. Consider deepening the relationship or expanding category placement.` }));

    if (expo.topRepPct > 30) {
      narratives.push({ cls: 'vcc-narr-warn', ico: '◉',
        txt: `Rep concentration risk: ${esc(expo.topRepName)}'s vendor portfolio represents ${expo.topRepPct.toFixed(0)}% of total revenue — key-person dependency for this revenue line.` });
    }

    if (expo.fragileCats.length > 2) {
      narratives.push({ cls: 'vcc-narr-warn', ico: '◎',
        txt: `${expo.fragileCats.length} categories have fewer than 3 vendors scoring above 5/10: ${expo.fragileCats.map(c => c.label).slice(0, 4).join(', ')}. Limited competitive alternatives reduces negotiating leverage.` });
    }

    if (drift && drift.length > 0) {
      const bestDrift  = drift.filter(d => d.weighted > 3).sort((a, b) => b.weighted - a.weighted)[0];
      const worstDrift = drift.filter(d => d.weighted < -3).sort((a, b) => a.weighted - b.weighted)[0];
      if (bestDrift)  narratives.push({ cls: 'vcc-narr-ok',   ico: '◷', txt: `${bestDrift.vendor.name}'s score improved most in the last 90 days (+${bestDrift.netDelta.toFixed(1)} net · ${bestDrift.changes} change${bestDrift.changes>1?'s':''}), led by ${bestDrift.biggestCat||'multiple categories'}.` });
      if (worstDrift) narratives.push({ cls: 'vcc-narr-warn', ico: '◷', txt: `${worstDrift.vendor.name}'s score has declined most recently (${worstDrift.netDelta.toFixed(1)} net), with ${worstDrift.biggestCat||'an unknown category'} as the primary driver.` });
    }

    return narratives.slice(0, 8);
  }

  function _narrativeCard(vendors, categoryHealth, bench, expo, drift) {
    const items = _generateNarrative(vendors, categoryHealth, bench, expo, drift);
    return `<div class="card">
      <div class="card-hd" style="padding-bottom:12px;">
        <div>
          <div class="card-title">◍ Portfolio Intelligence Narrative</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px;">Deterministic signal-driven summaries · template-based · no LLM</div>
        </div>
      </div>
      <div style="padding:0 16px 16px;">
        <div class="vcc-narr">
          ${items.map(n => `<div class="vcc-narr-item ${n.cls}">
            <span class="vcc-narr-ico">${n.ico}</span>
            <span class="vcc-narr-txt">${n.txt}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  // ─── Phase 4 Window Exports ───────────────────────────────────────────────────
  window.vccWatchlistOpenAdd = function () {
    const existing = new Set(_getWatchlist().map(e => e.id));
    const available = VD.filter(v => !existing.has(v.id)).sort((a, b) => a.name.localeCompare(b.name));
    const body = `
      <div style="margin-bottom:12px;">
        <input id="vcc-wl-srch" type="text" placeholder="Search vendors…"
          style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:inherit;font-size:14px;background:var(--surface);color:var(--text);box-sizing:border-box;"
          oninput="document.querySelectorAll('.vcc-wl-pick').forEach(r=>{r.style.display=r.dataset.name.toLowerCase().includes(this.value.toLowerCase())?'':'none';})">
      </div>
      <div style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
        ${available.map(v => `<div class="vcc-wl-pick" data-name="${esc(v.name)}"
            style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;border:1px solid var(--border);background:var(--surface);">
          <span style="flex:1;font-size:13px;font-weight:600;">${esc(v.name)}</span>
          <button class="vcc-aq-btn" onclick="vccWatchlistPin(${v.id},'pin');closeModal();renderVendors($('pg-content'))">📌 Pin</button>
          <button class="vcc-aq-btn" onclick="vccWatchlistPin(${v.id},'watch');closeModal();renderVendors($('pg-content'))">👁 Watch</button>
          <button class="vcc-aq-btn" onclick="vccWatchlistPin(${v.id},'strategic');closeModal();renderVendors($('pg-content'))">⭐ Strategic</button>
        </div>`).join('')}
      </div>`;
    openModal('Add to Strategic Watchlist', body);
    setTimeout(() => { const el = document.getElementById('vcc-wl-srch'); if (el) el.focus(); }, 80);
  };
  window.vccWatchlistPin    = function (id, type)  { _addToWatchlist(id, type); };
  window.vccWatchlistRemove = function (id)         { _removeFromWatchlist(id); renderVendors($('pg-content')); };

  // ─── EXPORTS ─────────────────────────────────────────────────────────────────
  window.renderCommandCenter = renderCommandCenter;
  window.vccVendorIntelPanel  = vccVendorIntelPanel;
  window.vccMobileNavSelect   = vccMobileNavSelect;

  // Initialize compare drawer on load (idempotent)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _refreshCompareDrawer);
  } else {
    setTimeout(_refreshCompareDrawer, 0);
  }

})();
