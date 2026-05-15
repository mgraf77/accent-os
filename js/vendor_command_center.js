// ── VENDOR COMMAND CENTER — v2.0 ──────────────────────────────────────────────
// Operational intelligence overlay for AccentOS Vendor Ranking.
// Additive — does not modify scoring, tier, or persistence logic.
// Overrides: renderOverview (deal_optimizer.js), _vendorVitals (index.html).
// Wraps:     openVendorDetail (index.html) to inject insight panel post-render.

// ─── CSS ─────────────────────────────────────────────────────────────────────
(function injectVccStyles() {
  if (document.getElementById('vcc-styles')) return;
  const el = document.createElement('style');
  el.id = 'vcc-styles';
  el.textContent = `
    /* ── health dots ── */
    .vcc-dot { display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    .vcc-dot.green  { background:#22c55e;box-shadow:0 0 0 2px #22c55e33; }
    .vcc-dot.yellow { background:#f59e0b;box-shadow:0 0 0 2px #f59e0b33; }
    .vcc-dot.red    { background:#ef4444;box-shadow:0 0 0 2px #ef4444aa; }
    .vcc-dot.unknown{ background:#cbd5e1; }

    /* ── chips ── */
    .vcc-chip {
      display:inline-flex;align-items:center;gap:3px;
      padding:2px 8px;border-radius:20px;
      font-size:10px;font-weight:700;line-height:1.6;
      border:1px solid;white-space:nowrap;
    }
    .vcc-chip.green  { background:#f0fdf4;color:#16a34a;border-color:#bbf7d0; }
    .vcc-chip.yellow { background:#fffbeb;color:#d97706;border-color:#fde68a; }
    .vcc-chip.red    { background:#fef2f2;color:#dc2626;border-color:#fecaca; }
    .vcc-chip.unknown{ background:#f8fafc;color:#94a3b8;border-color:#e2e8f0; }
    .vcc-chip.blue   { background:#eff6ff;color:#2563eb;border-color:#bfdbfe; }
    .vcc-chip.gray   { background:var(--surface2);color:var(--text-3);border-color:var(--border); }
    .vcc-chip.orange { background:#fff7ed;color:#ea580c;border-color:#fed7aa; }

    /* ── signals ── */
    .vcc-sbadge {
      display:inline-flex;align-items:center;
      padding:2px 6px;border-radius:4px;
      font-size:10px;font-weight:600;border:1px solid;white-space:nowrap;
    }
    .vcc-sbadge.critical { background:#fef2f2;color:#dc2626;border-color:#fecaca; }
    .vcc-sbadge.warning  { background:#fffbeb;color:#d97706;border-color:#fde68a; }
    .vcc-sbadge.info     { background:#eff6ff;color:#2563eb;border-color:#bfdbfe; }
    .vcc-sbadge.success  { background:#f0fdf4;color:#16a34a;border-color:#bbf7d0; }

    .vcc-signal-card {
      display:flex;align-items:flex-start;gap:8px;
      padding:8px 10px;border-radius:var(--radius-sm);border:1px solid;
      font-size:12px;color:var(--text-2);line-height:1.5;
    }
    .vcc-signal-card.critical { background:#fef2f2;border-color:#fecaca; }
    .vcc-signal-card.warning  { background:#fffbeb;border-color:#fde68a; }
    .vcc-signal-card.info     { background:#eff6ff;border-color:#bfdbfe; }
    .vcc-signal-card.success  { background:#f0fdf4;border-color:#bbf7d0; }

    /* ── signal rows (feed) ── */
    .vcc-sig-row {
      display:flex;align-items:center;gap:8px;
      padding:7px 10px;background:var(--surface2);
      border-radius:var(--radius-sm);border:1px solid var(--border);
      cursor:pointer;transition:background .12s;
    }
    .vcc-sig-row:hover { background:var(--border-light,#efefed); }
    .vcc-sig-row:active { opacity:.85; }

    /* ── trend arrows ── */
    .vcc-trend { font-size:13px;font-weight:700;line-height:1;flex-shrink:0; }
    .vcc-trend.up    { color:#16a34a; }
    .vcc-trend.down  { color:#dc2626; }
    .vcc-trend.stable{ color:#cbd5e1; }

    /* ── progress bars ── */
    .vcc-pbar { background:var(--border);border-radius:4px;height:4px;overflow:hidden; }
    .vcc-pbar-fill { height:4px;border-radius:4px;transition:width .35s ease; }

    /* ── score band ── */
    .vcc-score-band {
      position:relative;height:8px;border-radius:4px;overflow:hidden;
      background:linear-gradient(90deg,#ef4444 0%,#f59e0b 30%,#facc15 50%,#86efac 70%,#22c55e 100%);
    }
    .vcc-score-cursor {
      position:absolute;top:-1px;width:3px;height:10px;
      background:#1e293b;border-radius:2px;transform:translateX(-50%);
    }

    /* ── confidence ladder (category dots) ── */
    .vcc-conf-ladder { display:flex;gap:3px;flex-wrap:wrap;align-items:center; }
    .vcc-cat-dot {
      width:7px;height:7px;border-radius:50%;
      flex-shrink:0;border:1px solid transparent;
    }
    .vcc-cat-dot.verified   { background:#22c55e;border-color:#16a34a; }
    .vcc-cat-dot.unverified { background:#e2e8f0;border-color:#cbd5e1; }
    .vcc-cat-dot.na         { background:transparent;border-color:#e2e8f0;border-style:dashed; }
    .vcc-cat-dot.empty      { background:#f1f5f9;border-color:#e2e8f0; }

    /* ── friction grid ── */
    .vcc-friction-grid {
      display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
      gap:12px;margin-bottom:14px;
    }
    .vcc-friction-item {
      display:flex;align-items:center;gap:9px;
      padding:8px 10px;border-radius:var(--radius-sm);
      cursor:pointer;border:1px solid var(--border);
      background:var(--surface2);transition:background .12s;
    }
    .vcc-friction-item:hover { background:var(--border-light,#efefed); }

    /* ── section header ── */
    .vcc-section-hd {
      display:flex;align-items:center;gap:8px;
      padding:10px 16px;border-bottom:1px solid var(--border);
      font-size:12px;font-weight:700;color:var(--text);
    }
    .vcc-section-hd .vcc-sub { font-size:11px;font-weight:400;color:var(--text-3);margin-left:auto; }

    /* ── dist bar ── */
    .vcc-dist-bar {
      display:flex;align-items:flex-end;gap:2px;height:36px;
    }
    .vcc-dist-col {
      flex:1;border-radius:3px 3px 0 0;background:var(--accent);
      transition:height .3s ease;min-width:6px;
    }

    /* ── risk item ── */
    .vcc-risk-item {
      display:flex;align-items:center;gap:8px;
      padding:6px 0;border-bottom:1px solid var(--border-light,#f0f0ec);
    }
    .vcc-risk-item:last-child { border-bottom:none; }

    /* ── mobile executive card ── */
    .vcc-exec-card {
      display:flex;flex-direction:column;gap:6px;
      padding:12px 14px;border-radius:var(--radius);
      border:1px solid var(--border);background:var(--surface);
      cursor:pointer;transition:box-shadow .12s,border-color .12s;
      -webkit-tap-highlight-color:transparent;
    }
    .vcc-exec-card:hover { box-shadow:var(--shadow);border-color:var(--accent); }
    .vcc-exec-card-row { display:flex;align-items:center;gap:8px; }
    .vcc-exec-cards { display:none;flex-direction:column;gap:8px; }

    /* ── responsive ── */
    @media (max-width:720px) {
      .vcc-2col  { grid-template-columns:1fr !important; }
      .vcc-kpi-grid { grid-template-columns:repeat(2,1fr) !important; }
      .vcc-scan-tbl { display:none !important; }
      .vcc-exec-cards { display:flex !important; }
      .vcc-friction-grid { grid-template-columns:1fr 1fr !important; }
    }
    @media (max-width:420px) {
      .vcc-kpi-grid { grid-template-columns:1fr 1fr !important; }
      .vcc-friction-grid { grid-template-columns:1fr !important; }
    }
  `;
  document.head.appendChild(el);
})();

// ─── PRIMITIVE RENDERERS ──────────────────────────────────────────────────────

function vccHealthDot(status) {
  const labels = { green:'Healthy', yellow:'Watch', red:'At Risk', unknown:'Unknown' };
  return `<span class="vcc-dot ${status||'unknown'}" title="${labels[status]||'Unknown'}"></span>`;
}

function vccHealthChip(status) {
  const labels = { green:'● Healthy', yellow:'● Watch', red:'● At Risk', unknown:'○ Unknown' };
  return `<span class="vcc-chip ${status||'unknown'}">${labels[status]||'○ Unknown'}</span>`;
}

function vccTrendBadge(trend) {
  if (!trend || trend.direction === 'unknown') return `<span class="vcc-trend stable">→</span>`;
  const dir = trend.direction;
  const abs = trend.delta != null && !isNaN(trend.delta) ? Math.abs(trend.delta).toFixed(1) : '';
  const tip = abs ? `${dir==='up'?'+':'-'}${abs} avg pts (60d)` : 'Changelog trend';
  return `<span class="vcc-trend ${dir}" title="${tip}">${{up:'↑',down:'↓',stable:'→'}[dir]}</span>`;
}

function vccDeltaBadge(delta) {
  if (delta == null || isNaN(delta)) return '';
  const abs = Math.abs(delta).toFixed(1);
  if (delta > 0.2) return `<span style="font-size:10px;font-weight:700;color:#16a34a;">+${abs}</span>`;
  if (delta < -0.2) return `<span style="font-size:10px;font-weight:700;color:#dc2626;">−${abs}</span>`;
  return `<span style="font-size:10px;color:var(--text-3);">±0</span>`;
}

function vccSignalBadge(severity, text) {
  return `<span class="vcc-sbadge ${severity||'info'}">${esc(text)}</span>`;
}

function vccConfidenceChip(v) {
  const total = CAT_DEFS.length;
  const verified = CAT_DEFS.filter(c => getDataState(v, c.key) === 'verified').length;
  const pct = total ? Math.round((verified / total) * 100) : 0;
  const cls = pct >= 70 ? 'green' : pct >= 35 ? 'yellow' : 'gray';
  return `<span class="vcc-chip ${cls}" title="${verified}/${total} categories verified">✓ ${pct}%</span>`;
}

// Score band: 0–10 gradient bar with cursor at score position
function vccScoreBand(score, w = 80) {
  if (score == null || isNaN(score)) return `<span style="color:var(--text-3);font-size:11px;">—</span>`;
  const pct = Math.min(Math.max(score / 10, 0), 1) * 100;
  return `<div class="vcc-score-band" style="width:${w}px;display:inline-block;vertical-align:middle;">
    <div class="vcc-score-cursor" style="left:${pct}%;"></div>
  </div>`;
}

// Heat gradient bar (uses heatColor from index.html if available, else own palette)
function vccHeatBar(score, w = 80) {
  if (score == null || isNaN(score)) return '';
  const bg = typeof heatColor === 'function' ? heatColor(score) : scoreColor(score);
  const pct = Math.min(Math.max(score / 10, 0), 1) * 100;
  return `<div style="width:${w}px;display:inline-block;vertical-align:middle;background:var(--border);border-radius:4px;height:6px;overflow:hidden;">
    <div style="height:6px;border-radius:4px;width:${pct}%;background:${bg};"></div>
  </div>`;
}

// Confidence ladder: one tiny dot per category (verified/unverified/na/empty)
function vccConfidenceLadder(v) {
  const dots = CAT_DEFS.map(c => {
    const ds = getDataState(v, c.key);
    const hasScore = typeof v.scores[c.key] === 'number' || v.scores[c.key] === 'na';
    let cls = 'empty';
    if (ds === 'verified') cls = 'verified';
    else if (ds === 'na' || v.scores[c.key] === 'na') cls = 'na';
    else if (hasScore) cls = 'unverified';
    return `<span class="vcc-cat-dot ${cls}" title="${c.label}: ${ds||'not scored'}"></span>`;
  }).join('');
  return `<div class="vcc-conf-ladder" style="width:120px;">${dots}</div>`;
}

// Sparkline from a value array
function vccTrendSparkline(vals, w = 72, h = 22) {
  if (!vals || vals.length < 2) return '';
  const max = Math.max(...vals, 0.01);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 5) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = vals[vals.length - 1], first = vals[0];
  const c = last > first + 0.05 ? '#22c55e' : last < first - 0.05 ? '#ef4444' : '#94a3b8';
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:inline-block;vertical-align:middle;overflow:visible;">
    <polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${vals.map((_,i)=>(i/(vals.length-1))*w).at(-1).toFixed(1)}" cy="${pts.split(' ').at(-1).split(',')[1]}" r="2.5" fill="${c}" stroke="white" stroke-width="1"/>
  </svg>`;
}

// Review age badge: days since last changelog entry, color-coded
function vccReviewAgeBadge(v) {
  if (typeof CHANGELOG === 'undefined' || !Array.isArray(CHANGELOG)) return '';
  const my = CHANGELOG.filter(c => c.vendor === v.name).map(c => new Date(c.ts).getTime()).filter(t => !isNaN(t));
  if (!my.length) return `<span class="vcc-chip gray" style="font-size:9px;">No history</span>`;
  const days = Math.floor((Date.now() - Math.max(...my)) / 86400000);
  const cls = days <= 30 ? 'green' : days <= 90 ? 'yellow' : 'orange';
  return `<span class="vcc-chip ${cls}" style="font-size:9px;">${days}d ago</span>`;
}

// Composite risk weight: severity × spend proximity
function vccRiskWeight(v) {
  const sigs = computeVendorSignals(v);
  const lifetime = v.sales?.t || 0;
  const spendFactor = Math.log10(Math.max(lifetime, 100)) / 5;
  const severityScore = sigs.reduce((s, sig) => s + ({critical:3,warning:1.5,info:0.5,success:0}[sig.severity]||0), 0);
  return severityScore * spendFactor;
}

// ─── SIGNAL COMPUTATION ───────────────────────────────────────────────────────

function computeScoreTrend(v) {
  if (typeof CHANGELOG === 'undefined' || !Array.isArray(CHANGELOG)) return { direction:'unknown', delta:null };
  const now = Date.now(), day = 86400000;
  const myLog = CHANGELOG.filter(c => c.vendor === v.name && c.newVal != null && c.oldVal != null);
  if (!myLog.length) return { direction:'unknown', delta:null };

  const avgDelta = entries => {
    const ds = entries.map(c => {
      const n = parseFloat(c.newVal), o = parseFloat(c.oldVal);
      return isNaN(n)||isNaN(o) ? null : (n-o);
    }).filter(d => d !== null);
    return ds.length ? ds.reduce((s,d) => s+d, 0) / ds.length : null;
  };

  const recent = myLog.filter(c => (now - new Date(c.ts).getTime()) <= 60 * day);
  const delta = avgDelta(recent);
  if (delta === null) return { direction:'stable', delta:0 };
  if (delta > 0.3) return { direction:'up', delta };
  if (delta < -0.3) return { direction:'down', delta };
  return { direction:'stable', delta };
}

// Cumulative delta time series from changelog (for sparklines)
function computeVendorTrendPoints(v) {
  if (typeof CHANGELOG === 'undefined' || !Array.isArray(CHANGELOG)) return [];
  const entries = CHANGELOG
    .filter(c => c.vendor === v.name && !isNaN(parseFloat(c.newVal)) && !isNaN(parseFloat(c.oldVal)))
    .map(c => ({ ts: new Date(c.ts).getTime(), delta: parseFloat(c.newVal) - parseFloat(c.oldVal) }))
    .filter(c => !isNaN(c.delta))
    .sort((a,b) => a.ts - b.ts);
  if (entries.length < 2) return [];

  const now = Date.now();
  const oldest = entries[0].ts;
  const span = Math.max(now - oldest, 1);
  const N = Math.min(entries.length, 8);
  const buckets = Array.from({ length: N }, () => 0);
  entries.forEach(e => {
    const i = Math.min(Math.floor(((e.ts - oldest) / span) * N), N - 1);
    buckets[i] += e.delta;
  });
  // Cumulative
  let running = 0;
  return buckets.map(b => { running += b; return parseFloat(running.toFixed(2)); });
}

// Stability: has both positive AND negative changes in 90d window = unstable
function computeVendorStability(v) {
  if (typeof CHANGELOG === 'undefined' || !Array.isArray(CHANGELOG)) return { stable:true, pos:0, neg:0 };
  const cutoff = Date.now() - 90 * 86400000;
  const entries = CHANGELOG.filter(c => c.vendor === v.name && new Date(c.ts).getTime() >= cutoff);
  const pos = entries.filter(c => parseFloat(c.newVal) > parseFloat(c.oldVal)).length;
  const neg = entries.filter(c => parseFloat(c.newVal) < parseFloat(c.oldVal)).length;
  return { stable: !(pos > 0 && neg > 0), pos, neg, total: pos + neg };
}

function computeVendorSignals(v) {
  const signals = [];
  const now = Date.now(), day = 86400000;
  const ws = weightedScore(v);
  const tier = computeVendorTier(v);
  const scored = scoredCount(v.scores);
  const lifetime = v.sales?.t || 0;

  if (scored < 5 && tier !== 'C' && lifetime > 2000)
    signals.push({ type:'missing_data', severity:'warning', short:`${scored}/${CAT_DEFS.length} Scored`, msg:`Only ${scored} of ${CAT_DEFS.length} categories scored — profile incomplete.` });

  const unverified = CAT_DEFS.filter(c => {
    const ds = getDataState(v, c.key);
    return typeof v.scores[c.key] === 'number' && ds !== 'verified' && ds !== 'na';
  }).length;
  if (unverified >= 4)
    signals.push({ type:'low_confidence', severity:'warning', short:`${unverified} Unverified`, msg:`${unverified} category scores are unverified — data confidence is low.` });

  if (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) {
    const myLog = CHANGELOG.filter(c => c.vendor === v.name);
    if (myLog.length && scored > 0) {
      const lastTs = Math.max(...myLog.map(c => new Date(c.ts).getTime()).filter(t => !isNaN(t)));
      const daysSince = Math.floor((now - lastTs) / day);
      if (daysSince > 90)
        signals.push({ type:'stale_review', severity:'warning', short:`${daysSince}d Stale`, msg:`No score changes in ${daysSince} days — may not reflect current relationship.` });
    }
  }

  const trend = computeScoreTrend(v);
  if (trend.direction === 'down' && trend.delta != null && trend.delta < -0.4)
    signals.push({ type:'score_drop', severity:'critical', short:'Dropping', msg:`Score trending down ${Math.abs(trend.delta).toFixed(1)} pts avg over last 60 days.` });

  const stability = computeVendorStability(v);
  if (!stability.stable && stability.total >= 4)
    signals.push({ type:'unstable', severity:'warning', short:'Unstable', msg:`Mixed score changes in last 90d (${stability.pos} up, ${stability.neg} down) — relationship or data is volatile.` });

  if (typeof COOP_FUNDS !== 'undefined' && Array.isArray(COOP_FUNDS)) {
    const expiring = COOP_FUNDS.filter(f => {
      if (f.vendor_id !== v.id || f.status !== 'open' || !f.deadline) return false;
      const daysLeft = Math.floor((new Date(f.deadline).getTime() - now) / day);
      return daysLeft >= 0 && daysLeft <= 30;
    });
    if (expiring.length) {
      const total = expiring.reduce((s,f) => s+(Number(f.amount)||0), 0);
      signals.push({ type:'coop_expiring', severity:'critical', short:`Co-op ${_fmtShort(total)} Expires`, msg:`${_fmtShort(total)} co-op balance expiring within 30 days.` });
    }
  }

  if (v.inactive) {
    const recentSales = (v.sales?.['2024']||0) + (v.sales?.['2025']||0);
    if (recentSales > 500)
      signals.push({ type:'inactive_orphan', severity:'critical', short:'Inactive+Sales', msg:`Marked inactive but ${_fmtShort(recentSales)} in 2024–25 sales — orphan risk.` });
  }

  const rebate = v.scores?.rebates;
  if (typeof rebate === 'number' && rebate < 3 && lifetime >= 25000)
    signals.push({ type:'rebate_risk', severity:'warning', short:'Rebate Gap', msg:`Rebate ${rebate}/10 with ${_fmtShort(lifetime)} spend — renegotiation opportunity.` });

  const freight = v.scores?.freight;
  if (typeof freight === 'number' && freight < 3 && lifetime >= 25000)
    signals.push({ type:'freight_risk', severity:'warning', short:'Freight Risk', msg:`Freight ${freight}/10 with ${_fmtShort(lifetime)} spend — push for lower threshold.` });

  const dtc = v.scores?.dtc;
  if (typeof dtc === 'number' && dtc >= 7)
    signals.push({ type:'dtc_threat', severity:'warning', short:`DTC ${dtc}/10`, msg:`DTC ${dtc}/10 — vendor actively competes direct-to-consumer.` });

  if (!v.rep && lifetime > 5000)
    signals.push({ type:'no_rep', severity:'info', short:'No Rep Assigned', msg:'No rep group assigned — direct vendor with no relationship owner.' });

  if (trend.direction === 'up' && lifetime >= 10000 && ws !== null && ws >= 6)
    signals.push({ type:'opportunity', severity:'success', short:'Opportunity ↑', msg:`Improving trend + ${_fmtShort(lifetime)} spend — push for Tier A terms.` });

  return signals;
}

function computeVendorHealth(v) {
  const signals = computeVendorSignals(v);
  const ws = weightedScore(v);
  const scored = scoredCount(v.scores);
  const tier = computeVendorTier(v);
  if ((tier === 'C' || scored === 0)) return 'unknown';
  const crit = signals.filter(s => s.severity === 'critical').length;
  const warn = signals.filter(s => s.severity === 'warning').length;
  if (crit >= 2 || (ws !== null && ws < 3.5)) return 'red';
  if (crit >= 1 || warn >= 2 || (ws !== null && ws < 5.5)) return 'yellow';
  if (ws !== null && ws >= 5.5 && crit === 0 && warn <= 1) return 'green';
  return 'yellow';
}

function _fmtShort(n) {
  if (!n || isNaN(n)) return '—';
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n/1000)}K`;
  return `$${Math.round(n)}`;
}

// ─── PORTFOLIO AGGREGATORS ────────────────────────────────────────────────────

function computePortfolioSignals() {
  const deteriorating=[], opportunity=[], missingData=[], coopRisk=[], dtcThreats=[], noRep=[], unstable=[];
  VD.forEach(v => {
    const sigs = computeVendorSignals(v);
    const life = v.sales?.t || 0;
    if (sigs.some(s => s.type==='score_drop'))                   deteriorating.push(v);
    if (sigs.some(s => s.type==='opportunity'))                  opportunity.push(v);
    if (sigs.some(s => s.type==='missing_data') && life>5000)   missingData.push(v);
    if (sigs.some(s => s.type==='coop_expiring'))               coopRisk.push(v);
    if (sigs.some(s => s.type==='dtc_threat') && life>=10000)   dtcThreats.push(v);
    if (sigs.some(s => s.type==='no_rep') && life>=10000)       noRep.push(v);
    if (sigs.some(s => s.type==='unstable') && life>=5000)      unstable.push(v);
  });
  return { deteriorating, opportunity, missingData, coopRisk, dtcThreats, noRep, unstable };
}

function computeFrictionLists() {
  const now = Date.now(), day = 86400000;
  const stale=[], lowConf=[], incomplete=[], blindSpots=[], reviewAging=[];

  VD.forEach(v => {
    const life = v.sales?.t || 0;
    const scored = scoredCount(v.scores);
    const tier = computeVendorTier(v);

    // Stale: scored but no changelog in 90+ days
    if (scored > 0) {
      const myLog = (CHANGELOG||[]).filter(c => c.vendor === v.name);
      if (myLog.length) {
        const lastTs = Math.max(...myLog.map(c => new Date(c.ts).getTime()).filter(t => !isNaN(t)));
        const days = Math.floor((now - lastTs) / day);
        if (days > 90) stale.push({ v, days });
        reviewAging.push({ v, days });
      } else {
        reviewAging.push({ v, days: 999 });
      }
    }

    // Low confidence: 4+ unverified with meaningful spend
    if (life > 2000) {
      const unverified = CAT_DEFS.filter(c => {
        const ds = getDataState(v, c.key);
        return typeof v.scores[c.key] === 'number' && ds !== 'verified' && ds !== 'na';
      }).length;
      if (unverified >= 4) lowConf.push({ v, unverified });
    }

    // Incomplete: <8 of 14 scored, non-C tier, meaningful spend
    if (scored > 0 && scored < 8 && tier !== 'C' && life > 5000)
      incomplete.push({ v, scored });

    // Blind spots: >$10K spend, zero scores
    if (scored === 0 && life > 10000)
      blindSpots.push(v);
  });

  stale.sort((a,b) => b.days - a.days);
  reviewAging.sort((a,b) => b.days - a.days);
  lowConf.sort((a,b) => b.unverified - a.unverified);
  incomplete.sort((a,b) => (b.v.sales?.t||0) - (a.v.sales?.t||0));
  blindSpots.sort((a,b) => (b.sales?.t||0) - (a.sales?.t||0));

  return { stale, lowConf, incomplete, blindSpots, reviewAging };
}

// Score distribution (10 buckets: 0–1, 1–2, ..., 9–10)
function computeScoreDistribution() {
  const buckets = Array(10).fill(0);
  const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
  allScores.forEach(s => {
    const i = Math.min(Math.floor(s), 9);
    buckets[i]++;
  });
  return { buckets, total: allScores.length, avg: allScores.length ? (allScores.reduce((s,v)=>s+v,0)/allScores.length).toFixed(1) : null };
}

// ─── ENHANCED _vendorVitals ───────────────────────────────────────────────────

window._vendorVitals = function(v) {
  const bits = [];

  if (v.sales) {
    const years = Object.keys(v.sales).filter(k => /^\d{4}$/.test(k)).map(Number).sort((a,b)=>b-a);
    if (years.length) {
      const amt = Number(v.sales[years[0]])||0;
      if (amt > 0) {
        const fmt = amt>=1000000?`$${(amt/1000000).toFixed(1)}M`:amt>=1000?`$${(amt/1000).toFixed(0)}K`:`$${amt.toFixed(0)}`;
        bits.push(`<span title="Sales ${years[0]}">${fmt}</span>`);
      }
    }
  }

  if (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) {
    const my = CHANGELOG.filter(c=>c.vendor===v.name).map(c=>new Date(c.ts).getTime()).filter(t=>!isNaN(t));
    if (my.length) {
      const days = Math.floor((Date.now()-Math.max(...my))/86400000);
      const color = days<=30?'var(--green)':days<=90?'var(--text-2)':'var(--yellow)';
      bits.push(`<span style="color:${color};" title="Last score change">${days}d</span>`);
    }
  }

  if (typeof COOP_FUNDS !== 'undefined' && Array.isArray(COOP_FUNDS)) {
    const open = COOP_FUNDS.filter(r=>r.vendor_id===v.id&&r.status==='open');
    if (open.length) {
      const sum = open.reduce((s,r)=>s+(Number(r.amount)||0),0);
      bits.push(`<span style="color:var(--accent);" title="${open.length} open co-op fund(s)">🎯 ${sum>=1000?`$${(sum/1000).toFixed(0)}K`:`$${sum.toFixed(0)}`}</span>`);
    }
  }

  const h = computeVendorHealth(v);
  const trend = computeScoreTrend(v);
  const sigs = computeVendorSignals(v);
  const crits = sigs.filter(s=>s.severity==='critical');
  const critHtml = crits.length ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:4px;padding:0 5px;font-size:9px;font-weight:700;">${crits.length}⚠</span>` : '';

  return bits.length
    ? `<div style="font-size:10.5px;color:var(--text-3);font-weight:400;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${vccHealthDot(h)}${bits.join('<span style="color:var(--border);">·</span>')}${vccTrendBadge(trend)}${critHtml}</div>`
    : `<div style="font-size:10.5px;color:var(--text-3);font-weight:400;margin-top:2px;display:flex;align-items:center;gap:6px;">${vccHealthDot(h)}${vccTrendBadge(trend)}${critHtml}</div>`;
};

// ─── SECTION BUILDERS ─────────────────────────────────────────────────────────

function _sigSection(label, vendors, severity) {
  if (!vendors.length) return '';
  return `<div style="margin-bottom:12px;">
    <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">${label} · ${vendors.length}</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      ${vendors.slice(0, 5).map(v => {
        const ws = weightedScore(v);
        const h = computeVendorHealth(v);
        const vsigs = computeVendorSignals(v);
        const topSig = vsigs.find(s=>s.severity===severity)||vsigs[0];
        return `<div class="vcc-sig-row" onclick="openVendorDetail(${v.id})">
          ${vccHealthDot(h)}
          <span style="font-weight:600;font-size:12px;color:var(--accent);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.name)}</span>
          ${ws!=null?`<span class="mono" style="font-size:11px;color:${scoreColor(ws)};flex-shrink:0;">${ws}</span>`:''}
          ${vccTrendBadge(computeScoreTrend(v))}
          ${topSig?vccSignalBadge(topSig.severity,topSig.short):''}
        </div>`;
      }).join('')}
      ${vendors.length > 5 ? `<div style="font-size:11px;color:var(--text-3);padding:2px 10px;">+${vendors.length-5} more</div>` : ''}
    </div>
  </div>`;
}

// Trend Intelligence section
function _buildTrendSection(portfolio) {
  // Improving: up trend + meaningful spend
  const improving = VD.filter(v => {
    const t = computeScoreTrend(v);
    return t.direction === 'up' && (v.sales?.t||0) > 5000;
  }).sort((a,b) => {
    const ta = computeScoreTrend(a), tb = computeScoreTrend(b);
    return (tb.delta||0) - (ta.delta||0);
  }).slice(0, 8);

  // Deteriorating: down trend + meaningful spend
  const deteriorating = VD.filter(v => {
    const t = computeScoreTrend(v);
    return t.direction === 'down' && (v.sales?.t||0) > 5000;
  }).sort((a,b) => {
    const ta = computeScoreTrend(a), tb = computeScoreTrend(b);
    return (ta.delta||0) - (tb.delta||0);
  }).slice(0, 8);

  // Unstable: both pos and neg changes in 90d
  const unstable = VD.filter(v => {
    const s = computeVendorStability(v);
    return !s.stable && s.total >= 3 && (v.sales?.t||0) > 5000;
  }).sort((a,b) => {
    const sa = computeVendorStability(a), sb = computeVendorStability(b);
    return sb.total - sa.total;
  }).slice(0, 8);

  const trendRow = (v, highlight) => {
    const ws = weightedScore(v);
    const trend = computeScoreTrend(v);
    const pts = computeVendorTrendPoints(v);
    return `<div class="vcc-sig-row" style="gap:10px;" onclick="openVendorDetail(${v.id})">
      ${vccHealthDot(computeVendorHealth(v))}
      <span style="font-weight:600;font-size:12px;color:var(--accent);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.name)}</span>
      ${pts.length >= 2 ? vccTrendSparkline(pts, 60, 20) : ''}
      ${ws!=null?`<span class="mono" style="font-size:11px;color:${scoreColor(ws)};">${ws}</span>`:''}
      ${vccTrendBadge(trend)}
      ${trend.delta!=null?vccDeltaBadge(trend.delta):''}
    </div>`;
  };

  if (!improving.length && !deteriorating.length && !unstable.length)
    return `<div class="card" style="margin-bottom:14px;"><div class="vcc-section-hd">📈 Trend Intelligence<span class="vcc-sub">Insufficient changelog history — trends appear as data accumulates.</span></div></div>`;

  return `<div class="card" style="margin-bottom:14px;">
    <div class="vcc-section-hd">📈 Trend Intelligence<span class="vcc-sub">Based on changelog deltas · 60–90 day windows</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0;border-top:1px solid var(--border);">

      <div style="padding:14px 16px;${deteriorating.length?'border-right:1px solid var(--border);':''}">
        <div style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:8px;">↓ Deteriorating · ${deteriorating.length}</div>
        ${deteriorating.length ? `<div style="display:flex;flex-direction:column;gap:4px;">${deteriorating.map(v=>trendRow(v,'red')).join('')}</div>` : `<div style="color:var(--text-3);font-size:12px;padding:8px 0;">None detected.</div>`}
      </div>

      <div style="padding:14px 16px;${(improving.length&&unstable.length)?'border-right:1px solid var(--border);':''}">
        <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:8px;">↑ Improving · ${improving.length}</div>
        ${improving.length ? `<div style="display:flex;flex-direction:column;gap:4px;">${improving.map(v=>trendRow(v,'green')).join('')}</div>` : `<div style="color:var(--text-3);font-size:12px;padding:8px 0;">None detected.</div>`}
      </div>

      ${unstable.length ? `<div style="padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;margin-bottom:8px;">⇅ Unstable · ${unstable.length}</div>
        <div style="display:flex;flex-direction:column;gap:4px;">${unstable.map(v => {
          const s = computeVendorStability(v);
          return `<div class="vcc-sig-row" onclick="openVendorDetail(${v.id})">
            ${vccHealthDot(computeVendorHealth(v))}
            <span style="font-weight:600;font-size:12px;color:var(--accent);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.name)}</span>
            <span style="font-size:10px;color:#16a34a;">+${s.pos}</span>
            <span style="font-size:10px;color:#dc2626;">-${s.neg}</span>
          </div>`;
        }).join('')}</div>
      </div>` : ''}

    </div>
  </div>`;
}

// Operational Friction section
function _buildFrictionSection(friction) {
  const frictionCard = (title, color, items, renderItem) => {
    if (!items.length) return `<div class="card">
      <div class="vcc-section-hd" style="font-size:11px;">${title}<span class="vcc-sub">All clear</span></div>
    </div>`;
    return `<div class="card">
      <div class="vcc-section-hd" style="color:${color};font-size:11px;">${title}<span class="vcc-sub">${items.length} vendors</span></div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:4px;">
        ${items.slice(0,6).map(renderItem).join('')}
        ${items.length > 6 ? `<div style="font-size:11px;color:var(--text-3);padding:2px 0;">+${items.length-6} more</div>` : ''}
      </div>
    </div>`;
  };

  return `<div style="margin-bottom:14px;">
    <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">🔍 Operational Friction</div>
    <div class="vcc-friction-grid">

      ${frictionCard('Stale Reviews', '#d97706', friction.stale, ({v, days}) =>
        `<div class="vcc-friction-item" onclick="openVendorDetail(${v.id})">
          ${vccHealthDot(computeVendorHealth(v))}
          <span style="font-size:12px;font-weight:600;flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(v.name)}</span>
          <span style="font-size:10px;color:#d97706;font-weight:700;">${days}d</span>
        </div>`
      )}

      ${frictionCard('Low Confidence', '#7c3aed', friction.lowConf, ({v, unverified}) =>
        `<div class="vcc-friction-item" onclick="openVendorDetail(${v.id})">
          ${vccConfidenceLadder(v)}
          <span style="font-size:11px;font-weight:600;flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(v.name)}</span>
          <span style="font-size:10px;color:#7c3aed;font-weight:700;">${unverified} unverf.</span>
        </div>`
      )}

      ${frictionCard('Incomplete Coverage', '#ea580c', friction.incomplete, ({v, scored}) =>
        `<div class="vcc-friction-item" onclick="openVendorDetail(${v.id})">
          ${vccHealthDot(computeVendorHealth(v))}
          <span style="font-size:12px;font-weight:600;flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(v.name)}</span>
          <span style="font-size:10px;color:#ea580c;font-weight:700;">${scored}/${CAT_DEFS.length}</span>
        </div>`
      )}

      ${frictionCard('Blind Spots', '#64748b', friction.blindSpots, (v) =>
        `<div class="vcc-friction-item" onclick="openVendorDetail(${v.id})">
          ${vccHealthDot('unknown')}
          <span style="font-size:12px;font-weight:600;flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(v.name)}</span>
          <span style="font-size:10px;color:#64748b;font-weight:700;">${_fmtShort(v.sales?.t)}</span>
        </div>`
      )}

    </div>
  </div>`;
}

// Portfolio Intelligence section
function _buildPortfolioSection(allScores, totalSales, tierStats) {
  const dist = computeScoreDistribution();
  const maxBucket = Math.max(...dist.buckets, 1);

  // Risk-weighted top vendors (signal severity × spend)
  const topRisk = [...VD]
    .filter(v => vccRiskWeight(v) > 0)
    .sort((a,b) => vccRiskWeight(b) - vccRiskWeight(a))
    .slice(0, 6);

  // Tier concentration: % spend in non-A vendors
  const nonATierSales = (tierStats.B?.sales||0)+(tierStats.C?.sales||0)+(tierStats.D?.sales||0)+(tierStats.F?.sales||0);
  const nonAPct = totalSales > 0 ? Math.round((nonATierSales/totalSales)*100) : 0;

  return `<div style="margin-bottom:14px;">
    <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">📊 Portfolio Intelligence</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">

      <!-- Score Distribution -->
      <div class="card">
        <div class="vcc-section-hd" style="font-size:11px;">Score Distribution<span class="vcc-sub">${dist.total} scored · avg ${dist.avg||'—'}</span></div>
        <div style="padding:12px 16px;">
          <div style="display:flex;align-items:flex-end;gap:3px;height:48px;margin-bottom:8px;">
            ${dist.buckets.map((cnt, i) => {
              const h = maxBucket > 0 ? Math.round((cnt / maxBucket) * 44) : 0;
              const colors = ['#ef4444','#ef4444','#f97316','#f97316','#facc15','#facc15','#86efac','#4ade80','#22c55e','#16a34a'];
              return `<div style="flex:1;background:${colors[i]};border-radius:3px 3px 0 0;height:${h}px;min-width:4px;opacity:0.85;" title="${i}-${i+1}: ${cnt} vendors"></div>`;
            }).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-3);">
            <span>0</span><span>5</span><span>10</span>
          </div>
        </div>
      </div>

      <!-- Risk-Weighted Top Exposure -->
      <div class="card">
        <div class="vcc-section-hd" style="font-size:11px;">Risk Exposure<span class="vcc-sub">Signal severity × spend weight</span></div>
        <div style="padding:10px 14px;">
          ${topRisk.length ? topRisk.map(v => {
            const ws = weightedScore(v);
            const sigs = computeVendorSignals(v);
            const topSig = sigs.find(s=>s.severity==='critical')||sigs.find(s=>s.severity==='warning')||sigs[0];
            return `<div class="vcc-risk-item" style="cursor:pointer;" onclick="openVendorDetail(${v.id})">
              ${vccHealthDot(computeVendorHealth(v))}
              <span style="font-size:12px;font-weight:600;flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(v.name)}</span>
              ${ws!=null?`<span class="mono" style="font-size:11px;color:${scoreColor(ws)};">${ws}</span>`:''}
              ${topSig?vccSignalBadge(topSig.severity,topSig.short):''}
            </div>`;
          }).join('') : `<div style="color:var(--text-3);font-size:12px;padding:8px 0;">No risk signals detected.</div>`}
        </div>
      </div>

      <!-- Concentration + Coverage -->
      <div class="card">
        <div class="vcc-section-hd" style="font-size:11px;">Portfolio Exposure<span class="vcc-sub">Coverage + concentration</span></div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
              <span style="color:var(--text-3);">Non-A tier spend</span>
              <span style="font-weight:700;color:${nonAPct>70?'#ef4444':nonAPct>50?'#f59e0b':'var(--text)'};">${nonAPct}%</span>
            </div>
            <div class="vcc-pbar">
              <div class="vcc-pbar-fill" style="width:${nonAPct}%;background:${nonAPct>70?'#ef4444':nonAPct>50?'#f59e0b':'#22c55e'};"></div>
            </div>
            <div style="font-size:10px;color:var(--text-3);margin-top:3px;">${_fmtShort(nonATierSales)} of ${_fmtShort(totalSales)} total in B/C/D/F tiers</div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
              <span style="color:var(--text-3);">Scoring coverage</span>
              <span style="font-weight:700;">${VD.filter(v=>scoredCount(v.scores)>0).length} of ${VD.length}</span>
            </div>
            <div class="vcc-pbar">
              <div class="vcc-pbar-fill" style="width:${Math.round(VD.filter(v=>scoredCount(v.scores)>0).length/Math.max(VD.length,1)*100)}%;background:var(--accent);"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
              <span style="color:var(--text-3);">Verified categories</span>
              <span style="font-weight:700;">${(() => {
                const total = VD.reduce((s,v) => s + CAT_DEFS.filter(c=>getDataState(v,c.key)==='verified').length, 0);
                const max = VD.filter(v=>scoredCount(v.scores)>0).length * CAT_DEFS.length;
                return max ? `${Math.round((total/max)*100)}%` : '—';
              })()}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>`;
}

// ─── renderOverview (overrides deal_optimizer.js) ────────────────────────────

function renderOverview(container) {
  const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
  const totalSales = VD.reduce((s,v) => s+(v.sales?.t||0), 0);
  const portfolio = computePortfolioSignals();
  const friction = computeFrictionLists();

  const tierStats = { A:{count:0,sales:0}, B:{count:0,sales:0}, C:{count:0,sales:0}, D:{count:0,sales:0}, F:{count:0,sales:0} };
  VD.filter(v => weightedScore(v) !== null).forEach(v => {
    const t = getAdaptiveTier(weightedScore(v), allScores);
    if (t && tierStats[t]) { tierStats[t].count++; tierStats[t].sales += v.sales?.t||0; }
  });

  const healthCounts = { green:0, yellow:0, red:0, unknown:0 };
  VD.forEach(v => { const h = computeVendorHealth(v); healthCounts[h]++; });

  const topBySpend = [...VD].filter(v=>v.sales?.t>0).sort((a,b)=>(b.sales?.t||0)-(a.sales?.t||0)).slice(0,5);
  const top5Sales = topBySpend.reduce((s,v)=>s+(v.sales?.t||0), 0);
  const concentrationPct = totalSales>0 ? Math.round((top5Sales/totalSales)*100) : 0;
  const hasSignals = Object.values(portfolio).some(arr => arr.length>0);
  const tierColors = { A:'#22c55e', B:'#3b82f6', C:'#f59e0b', D:'#f97316', F:'#ef4444' };

  const hOrder = { red:0, yellow:1, green:2, unknown:3 };
  const scanVendors = [...VD]
    .filter(v => scoredCount(v.scores)>0)
    .sort((a,b) => {
      const ha = hOrder[computeVendorHealth(a)]??3, hb = hOrder[computeVendorHealth(b)]??3;
      if (ha!==hb) return ha-hb;
      return (weightedScore(b)||0)-(weightedScore(a)||0);
    }).slice(0, 60);

  container.innerHTML = `

    <!-- ── KPI BAR ── -->
    <div class="vcc-kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px;">
      <div class="card stat-card" style="border-left:3px solid #22c55e;">
        <div class="stat-label">Healthy</div>
        <div class="stat-value" style="color:#22c55e;">${healthCounts.green}</div>
        <div class="stat-sub">Strong + current</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid #f59e0b;">
        <div class="stat-label">Watch</div>
        <div class="stat-value" style="color:#f59e0b;">${healthCounts.yellow}</div>
        <div class="stat-sub">Needs attention</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid #ef4444;">
        <div class="stat-label">At Risk</div>
        <div class="stat-value" style="color:#ef4444;">${healthCounts.red}</div>
        <div class="stat-sub">Critical signals</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid var(--accent);">
        <div class="stat-label">Deteriorating</div>
        <div class="stat-value" style="color:var(--accent);">${portfolio.deteriorating.length}</div>
        <div class="stat-sub">60d decline</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid #2563eb;">
        <div class="stat-label">Opportunity</div>
        <div class="stat-value" style="color:#2563eb;">${portfolio.opportunity.length}</div>
        <div class="stat-sub">Improving + spend</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid #d97706;">
        <div class="stat-label">Stale Reviews</div>
        <div class="stat-value" style="color:#d97706;">${friction.stale.length}</div>
        <div class="stat-sub">&gt;90d no update</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid ${concentrationPct>60?'#ef4444':concentrationPct>40?'#f59e0b':'#22c55e'};">
        <div class="stat-label">Spend Conc.</div>
        <div class="stat-value" style="color:${concentrationPct>60?'#ef4444':concentrationPct>40?'#f59e0b':'var(--text)'};">${concentrationPct}%</div>
        <div class="stat-sub">Top 5 of total</div>
      </div>
    </div>

    <!-- ── TWO-COL BODY ── -->
    <div class="vcc-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">

      <!-- LEFT: SIGNAL FEED -->
      <div class="card" style="height:100%;">
        <div class="card-hd" style="background:linear-gradient(90deg,#fef2f2,var(--surface));border-bottom:2px solid #fecaca;">
          <span class="card-title" style="color:#dc2626;">⚡ Operational Signals</span>
          <span style="font-size:11px;color:var(--text-3);margin-left:auto;">${hasSignals?'Action needed':'All clear'}</span>
        </div>
        <div style="padding:14px 16px;">
          ${!hasSignals?`<div style="text-align:center;padding:28px 0;color:var(--text-3);font-size:13px;">No active signals — portfolio looks clean.</div>`:''}
          ${_sigSection('Deteriorating', portfolio.deteriorating, 'critical')}
          ${_sigSection('Co-op Expiring', portfolio.coopRisk, 'critical')}
          ${_sigSection('High Opportunity', portfolio.opportunity, 'success')}
          ${_sigSection('DTC Threat ≥$10K', portfolio.dtcThreats, 'warning')}
          ${_sigSection('No Rep · ≥$10K Spend', portfolio.noRep, 'info')}
          ${_sigSection('Thin Data · ≥$5K', portfolio.missingData, 'warning')}
        </div>
      </div>

      <!-- RIGHT: TIER + TOP SPEND -->
      <div style="display:flex;flex-direction:column;gap:14px;">

        <div class="card">
          <div class="card-hd">
            <span class="card-title">Tier Distribution</span>
            <span style="font-size:11px;color:var(--text-3);margin-left:auto;">Adaptive 20% buckets</span>
          </div>
          <div style="padding:14px 16px;">
            ${['A','B','C','D','F'].map(t => {
              const st = tierStats[t];
              const pct = totalSales>0?(st.sales/totalSales)*100:0;
              return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
                ${tierBadge(t)}
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:12px;font-weight:600;">${st.count} vendor${st.count!==1?'s':''}</span>
                    <span class="mono" style="font-size:11px;">${fmt$(st.sales)}</span>
                  </div>
                  <div class="vcc-pbar"><div class="vcc-pbar-fill" style="width:${Math.min(pct,100).toFixed(1)}%;background:${tierColors[t]};"></div></div>
                </div>
                <span style="font-size:11px;color:var(--text-3);min-width:30px;text-align:right;">${pct.toFixed(0)}%</span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-hd">
            <span class="card-title">Top 5 by Spend</span>
            <span style="font-size:11px;color:${concentrationPct>60?'#ef4444':'var(--text-3)'};margin-left:auto;">${concentrationPct}% concentration</span>
          </div>
          <div style="padding:12px 16px;">
            ${topBySpend.map((v,i) => {
              const pct = totalSales>0?((v.sales?.t||0)/totalSales)*100:0;
              const h = computeVendorHealth(v);
              const ws = weightedScore(v);
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;" onclick="openVendorDetail(${v.id})">
                <span class="mono" style="font-size:11px;color:var(--text-3);min-width:14px;">${i+1}</span>
                ${vccHealthDot(h)}
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.name)}</div>
                  <div class="vcc-pbar" style="margin-top:4px;"><div class="vcc-pbar-fill" style="width:${Math.min(pct,100).toFixed(1)}%;background:var(--accent);"></div></div>
                </div>
                <span class="mono" style="font-size:11px;font-weight:600;flex-shrink:0;">${fmt$(v.sales?.t)}</span>
                ${vccTrendBadge(computeScoreTrend(v))}
              </div>`;
            }).join('')}
          </div>
        </div>

      </div>
    </div>

    <!-- ── TREND INTELLIGENCE ── -->
    ${_buildTrendSection(portfolio)}

    <!-- ── OPERATIONAL FRICTION ── -->
    ${_buildFrictionSection(friction)}

    <!-- ── PORTFOLIO INTELLIGENCE ── -->
    ${_buildPortfolioSection(allScores, totalSales, tierStats)}

    <!-- ── PORTFOLIO HEALTH SCAN ── -->
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Portfolio Health Scan</span>
        <span style="font-size:11px;color:var(--text-3);margin-left:auto;">Sorted by risk · click to open profile</span>
      </div>

      <!-- Desktop table -->
      <div class="vcc-scan-tbl tbl-wrap" style="max-height:420px;">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Health</th>
              <th>Tier</th>
              <th>Score</th>
              <th style="min-width:90px;">Score Band</th>
              <th>Trend</th>
              <th style="min-width:120px;">Coverage</th>
              <th>Signals</th>
              <th>5-Yr Sales</th>
            </tr>
          </thead>
          <tbody>
            ${scanVendors.map(v => {
              const ws = weightedScore(v);
              const h = computeVendorHealth(v);
              const t = ws!==null?getAdaptiveTier(ws,allScores):null;
              const trend = computeScoreTrend(v);
              const sigs = computeVendorSignals(v);
              return `<tr style="cursor:pointer;" onclick="openVendorDetail(${v.id})">
                <td style="font-weight:600;color:var(--accent);">${esc(v.name)}</td>
                <td>${vccHealthChip(h)}</td>
                <td>${t?tierBadge(t):'<span class="na">TBD</span>'}</td>
                <td>${ws!=null?`<span class="mono fw6" style="color:${scoreColor(ws)};">${ws}</span>`:'<span class="na">—</span>'}</td>
                <td>${ws!=null?vccScoreBand(ws,80):''}</td>
                <td style="text-align:center;">${vccTrendBadge(trend)}</td>
                <td>${vccConfidenceLadder(v)}</td>
                <td style="max-width:180px;">${sigs.slice(0,2).map(s=>vccSignalBadge(s.severity,s.short)).join(' ')}</td>
                <td class="mono sm">${fmt$(v.sales?.t)}</td>
              </tr>`;
            }).join('')}
            ${scanVendors.length===0?`<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-3);">No scored vendors yet.</td></tr>`:''}
          </tbody>
        </table>
      </div>

      <!-- Mobile executive cards -->
      <div class="vcc-exec-cards" style="padding:12px;">
        ${scanVendors.map(v => {
          const ws = weightedScore(v);
          const h = computeVendorHealth(v);
          const t = ws!==null?getAdaptiveTier(ws,allScores):null;
          const trend = computeScoreTrend(v);
          const sigs = computeVendorSignals(v);
          const topSig = sigs.find(s=>s.severity==='critical')||sigs.find(s=>s.severity==='warning')||sigs[0];
          return `<div class="vcc-exec-card" onclick="openVendorDetail(${v.id})">
            <div class="vcc-exec-card-row">
              ${vccHealthDot(h)}
              <span style="font-weight:700;font-size:14px;flex:1;color:var(--text);">${esc(v.name)}</span>
              ${ws!=null?`<span class="mono fw6" style="font-size:15px;color:${scoreColor(ws)};">${ws}</span>`:''}
              ${vccTrendBadge(trend)}
            </div>
            <div class="vcc-exec-card-row" style="gap:6px;">
              ${vccHealthChip(h)}
              ${t?tierBadge(t):''}
              ${vccReviewAgeBadge(v)}
              ${topSig?vccSignalBadge(topSig.severity,topSig.short):''}
            </div>
            ${ws!=null?`<div>${vccScoreBand(ws, 220)}</div>`:''}
          </div>`;
        }).join('')}
        ${scanVendors.length===0?`<div style="text-align:center;padding:24px;color:var(--text-3);">No scored vendors yet.</div>`:''}
      </div>
    </div>
  `;
}

// ─── INSIGHT PANEL ────────────────────────────────────────────────────────────

function vccBuildInsightPanel(v) {
  const signals = computeVendorSignals(v);
  const trend = computeScoreTrend(v);
  const h = computeVendorHealth(v);
  const lifetime = v.sales?.t || 0;
  const pts = computeVendorTrendPoints(v);
  const stability = computeVendorStability(v);

  const leverage = [];
  if (lifetime >= 25000)
    leverage.push(`Lifetime spend ${_fmtShort(lifetime)} — volume warrants premium terms.`);
  const rebate = v.scores?.rebates;
  if (typeof rebate === 'number' && rebate < 4)
    leverage.push(`Rebate ${rebate}/10 — push for improved % commensurate with spend.`);
  const freight = v.scores?.freight;
  if (typeof freight === 'number' && freight < 4)
    leverage.push(`Freight ${freight}/10 — negotiate lower free-freight threshold.`);
  const credit = v.scores?.credit;
  if (typeof credit === 'number' && credit < 5 && lifetime >= 15000)
    leverage.push(`Credit terms ${credit}/10 — push for extended net terms given volume.`);
  if (typeof COOP_FUNDS !== 'undefined') {
    const open = COOP_FUNDS.filter(f=>f.vendor_id===v.id&&f.status==='open');
    if (open.length) {
      const total = open.reduce((s,f)=>s+(Number(f.amount)||0),0);
      leverage.push(`${_fmtShort(total)} open co-op balance — include in next conversation.`);
    }
  }
  const s2025 = v.sales?.['2025']||0, s2024 = v.sales?.['2024']||0;
  if (s2025 > 5000 && s2025 > s2024 * 0.4)
    leverage.push(`Growing spend in 2025 (${_fmtShort(s2025)}) — use momentum in renewal talks.`);

  if (!signals.length && !leverage.length) return '';

  return `<div id="vcc-insight-panel" style="margin-bottom:20px;padding:16px;background:var(--surface2);border-radius:var(--radius);border:1px solid var(--border);">
    <!-- Header row -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;">⚡ Intelligence</span>
      ${vccHealthChip(h)}
      ${vccConfidenceChip(v)}
      ${vccTrendBadge(trend)}
      ${trend.delta!=null?vccDeltaBadge(trend.delta):''}
      ${vccReviewAgeBadge(v)}
      ${!stability.stable?`<span class="vcc-chip orange">⇅ Unstable</span>`:''}
    </div>

    <!-- Sparkline (only if meaningful) -->
    ${pts.length >= 3 ? `<div style="margin-bottom:12px;padding:8px 10px;background:var(--surface);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;align-items:center;gap:10px;">
      <span style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;white-space:nowrap;">Score Movement</span>
      ${vccTrendSparkline(pts, 120, 26)}
      <span style="font-size:10px;color:var(--text-3);">${pts[0]>=0?'+':''}${pts[0].toFixed(1)} → ${pts.at(-1)>=0?'+':''}${pts.at(-1).toFixed(1)} pts cumulative</span>
    </div>` : ''}

    <!-- Confidence ladder -->
    <div style="margin-bottom:12px;padding:8px 10px;background:var(--surface);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;">Coverage</span>
      ${vccConfidenceLadder(v)}
      ${vccConfidenceChip(v)}
      <span style="font-size:10px;color:var(--text-3);margin-left:auto;">
        ● verified  ○ unverified  ⊙ N/A
      </span>
    </div>

    <!-- Active signals -->
    ${signals.length ? `<div style="margin-bottom:${leverage.length?12:0}px;">
      <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:7px;">Active Signals</div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${signals.map(s=>`<div class="vcc-signal-card ${s.severity}">${vccSignalBadge(s.severity,s.short)}<span>${esc(s.msg)}</span></div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Leverage -->
    ${leverage.length ? `<div>
      <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:7px;">Negotiation Leverage</div>
      <div style="display:flex;flex-direction:column;gap:0;">
        ${leverage.map((l,i)=>`<div style="display:flex;gap:8px;font-size:12px;color:var(--text-2);padding:6px 0;${i>0?'border-top:1px solid var(--border-light,#f0f0ec);':''}">
          <span style="color:#2563eb;font-weight:700;flex-shrink:0;">→</span><span>${esc(l)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}
  </div>`;
}

// ─── openVendorDetail WRAPPER ─────────────────────────────────────────────────

const _vccOrigOpenVendorDetail = window.openVendorDetail;
window.openVendorDetail = async function(vendorId) {
  await _vccOrigOpenVendorDetail(vendorId);
  setTimeout(() => {
    if (document.getElementById('vcc-insight-panel')) return;
    const overlay = document.getElementById('vendor-detail-modal');
    if (!overlay) return;
    const modal = overlay.firstElementChild;
    if (!modal || modal.children.length < 2) return;
    const content = modal.children[1];
    if (!content) return;
    const v = VD.find(x => x.id === vendorId);
    if (!v) return;
    const html = vccBuildInsightPanel(v);
    if (!html) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    content.insertBefore(wrapper.firstChild, content.firstChild);
  }, 30);
};
