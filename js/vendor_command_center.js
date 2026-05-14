// ── VENDOR COMMAND CENTER — v1.0 ──────────────────────────────────────────────
// Operational intelligence overlay for AccentOS Vendor Ranking.
// Additive layer — does not modify existing scoring, tier, or persistence logic.
// Overrides: renderOverview (from deal_optimizer.js), _vendorVitals (from index.html).
// Wraps:     openVendorDetail (from index.html) to inject insight panel post-render.

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
(function injectVccStyles() {
  const el = document.createElement('style');
  el.id = 'vcc-styles';
  el.textContent = `
    .vcc-health-dot { display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    .vcc-health-dot.green  { background:#22c55e;box-shadow:0 0 0 2px #22c55e33; }
    .vcc-health-dot.yellow { background:#f59e0b;box-shadow:0 0 0 2px #f59e0b33; }
    .vcc-health-dot.red    { background:#ef4444;box-shadow:0 0 0 2px #ef4444aa; }
    .vcc-health-dot.unknown{ background:#94a3b8; }
    .vcc-chip {
      display:inline-flex;align-items:center;gap:3px;
      padding:2px 7px;border-radius:20px;
      font-size:10px;font-weight:700;line-height:1.5;
      border:1px solid;white-space:nowrap;
    }
    .vcc-chip.green  { background:#f0fdf4;color:#16a34a;border-color:#bbf7d0; }
    .vcc-chip.yellow { background:#fffbeb;color:#d97706;border-color:#fde68a; }
    .vcc-chip.red    { background:#fef2f2;color:#dc2626;border-color:#fecaca; }
    .vcc-chip.unknown{ background:var(--surface2);color:var(--text-3);border-color:var(--border); }
    .vcc-chip.blue   { background:#eff6ff;color:#2563eb;border-color:#bfdbfe; }
    .vcc-chip.gray   { background:var(--surface2);color:var(--text-3);border-color:var(--border); }
    .vcc-signal-card {
      display:flex;align-items:flex-start;gap:8px;
      padding:8px 10px;border-radius:var(--radius-sm);
      border:1px solid;font-size:12px;color:var(--text-2);
    }
    .vcc-signal-card.critical { background:#fef2f2;border-color:#fecaca; }
    .vcc-signal-card.warning  { background:#fffbeb;border-color:#fde68a; }
    .vcc-signal-card.info     { background:#eff6ff;border-color:#bfdbfe; }
    .vcc-signal-card.success  { background:#f0fdf4;border-color:#bbf7d0; }
    .vcc-sig-row {
      display:flex;align-items:center;gap:8px;
      padding:7px 10px;background:var(--surface2);
      border-radius:var(--radius-sm);border:1px solid var(--border);
      cursor:pointer;transition:background .15s;
    }
    .vcc-sig-row:hover { background:var(--border-light); }
    .vcc-trend { font-size:13px;font-weight:700;line-height:1; }
    .vcc-trend.up    { color:#16a34a; }
    .vcc-trend.down  { color:#dc2626; }
    .vcc-trend.stable{ color:var(--text-3); }
    .vcc-pbar { background:var(--border);border-radius:4px;height:4px;overflow:hidden; }
    .vcc-pbar-fill { height:4px;border-radius:4px;transition:width .4s; }
    @media (max-width:700px) {
      .vcc-2col { grid-template-columns:1fr !important; }
      .vcc-kpi-grid { grid-template-columns:repeat(2,1fr) !important; }
    }
  `;
  document.head.appendChild(el);
})();

// ─── PRIMITIVE RENDERERS ──────────────────────────────────────────────────────

function vccHealthDot(status) {
  return `<span class="vcc-health-dot ${status||'unknown'}" title="${{green:'Healthy',yellow:'Watch',red:'At Risk',unknown:'Unknown'}[status]||'Unknown'}"></span>`;
}

function vccHealthChip(status) {
  const labels = { green:'● Healthy', yellow:'● Watch', red:'● At Risk', unknown:'○ Unknown' };
  return `<span class="vcc-chip ${status||'unknown'}">${labels[status]||'○ Unknown'}</span>`;
}

function vccTrendBadge(trend) {
  if (!trend || trend.direction === 'unknown') return `<span class="vcc-trend stable">→</span>`;
  const dir = trend.direction;
  const delta = trend.delta != null && !isNaN(trend.delta) ? Math.abs(trend.delta).toFixed(1) : '';
  const title = delta ? `${dir === 'up' ? '+' : '-'}${delta} avg score change in last 60d` : 'Trend based on changelog';
  return `<span class="vcc-trend ${dir}" title="${title}">${{up:'↑',down:'↓',stable:'→'}[dir]||'→'}</span>`;
}

function vccDeltaBadge(delta) {
  if (delta == null || isNaN(delta)) return '';
  const abs = Math.abs(delta).toFixed(1);
  if (delta > 0.2) return `<span style="font-size:10px;font-weight:700;color:#16a34a;">+${abs}</span>`;
  if (delta < -0.2) return `<span style="font-size:10px;font-weight:700;color:#dc2626;">−${abs}</span>`;
  return `<span style="font-size:10px;color:var(--text-3);">±0</span>`;
}

function vccSignalBadge(severity, text) {
  const s = {
    critical:{ bg:'#fef2f2',color:'#dc2626',border:'#fecaca' },
    warning: { bg:'#fffbeb',color:'#d97706',border:'#fde68a' },
    info:    { bg:'#eff6ff',color:'#2563eb',border:'#bfdbfe' },
    success: { bg:'#f0fdf4',color:'#16a34a',border:'#bbf7d0' },
  }[severity] || { bg:'var(--surface2)',color:'var(--text-3)',border:'var(--border)' };
  return `<span style="display:inline-flex;align-items:center;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;background:${s.bg};color:${s.color};border:1px solid ${s.border};white-space:nowrap;">${esc(text)}</span>`;
}

function vccConfidenceChip(v) {
  const total = CAT_DEFS.length;
  const verified = CAT_DEFS.filter(c => getDataState(v, c.key) === 'verified').length;
  const pct = total ? Math.round((verified / total) * 100) : 0;
  const cls = pct >= 70 ? 'green' : pct >= 35 ? 'yellow' : 'gray';
  return `<span class="vcc-chip ${cls}" title="${verified} of ${total} categories verified">✓ ${pct}%</span>`;
}

function vccTrendSparkline(vals, w = 72, h = 20) {
  if (!vals || vals.length < 2) return '';
  const max = Math.max(...vals, 0.01);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = vals[vals.length - 1], first = vals[0];
  const c = last > first + 0.2 ? '#22c55e' : last < first - 0.2 ? '#ef4444' : '#94a3b8';
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:inline-block;vertical-align:middle;"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ─── SIGNAL COMPUTATION ───────────────────────────────────────────────────────

function computeScoreTrend(v) {
  if (typeof CHANGELOG === 'undefined' || !Array.isArray(CHANGELOG)) return { direction: 'unknown', delta: null };
  const now = Date.now();
  const day = 86400000;

  const myLog = CHANGELOG.filter(c => c.vendor === v.name && c.newVal != null && c.oldVal != null);
  if (!myLog.length) return { direction: 'unknown', delta: null };

  const inWindow = (c, from, to) => {
    const ts = new Date(c.ts).getTime();
    const age = now - ts;
    return age > from && age <= to;
  };

  const avgDelta = entries => {
    const ds = entries.map(c => {
      const n = parseFloat(c.newVal), o = parseFloat(c.oldVal);
      return isNaN(n) || isNaN(o) ? null : (n - o);
    }).filter(d => d !== null);
    return ds.length ? ds.reduce((s, d) => s + d, 0) / ds.length : null;
  };

  const recent = myLog.filter(c => inWindow(c, 0, 60 * day));
  const delta = avgDelta(recent);

  if (delta === null) return { direction: 'stable', delta: 0 };
  if (delta > 0.3) return { direction: 'up', delta };
  if (delta < -0.3) return { direction: 'down', delta };
  return { direction: 'stable', delta };
}

function computeVendorSignals(v) {
  const signals = [];
  const now = Date.now();
  const day = 86400000;
  const ws = weightedScore(v);
  const tier = computeVendorTier(v);
  const scored = scoredCount(v.scores);
  const lifetime = v.sales?.t || 0;

  // Missing data — <5 scored cats on a non-C vendor with real spend
  if (scored < 5 && tier !== 'C' && lifetime > 2000) {
    signals.push({ type:'missing_data', severity:'warning', short:`${scored}/${CAT_DEFS.length} Scored`, msg:`Only ${scored} of ${CAT_DEFS.length} categories scored — profile is incomplete.` });
  }

  // Low confidence — many unverified scores
  const unverified = CAT_DEFS.filter(c => {
    const ds = getDataState(v, c.key);
    return typeof v.scores[c.key] === 'number' && ds !== 'verified' && ds !== 'na';
  }).length;
  if (unverified >= 4) {
    signals.push({ type:'low_confidence', severity:'warning', short:`${unverified} Unverified`, msg:`${unverified} category scores are unverified — confidence is low.` });
  }

  // Stale review — no changelog in 90+ days on a scored vendor
  if (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) {
    const myLog = CHANGELOG.filter(c => c.vendor === v.name);
    if (myLog.length && scored > 0) {
      const lastTs = Math.max(...myLog.map(c => new Date(c.ts).getTime()).filter(t => !isNaN(t)));
      const daysSince = Math.floor((now - lastTs) / day);
      if (daysSince > 90) {
        signals.push({ type:'stale_review', severity:'warning', short:`${daysSince}d Stale`, msg:`No score changes in ${daysSince} days — may not reflect current relationship.` });
      }
    }
  }

  // Score dropping — negative trend in changelog
  const trend = computeScoreTrend(v);
  if (trend.direction === 'down' && trend.delta != null && trend.delta < -0.4) {
    signals.push({ type:'score_drop', severity:'critical', short:'Dropping', msg:`Score trending down ${Math.abs(trend.delta).toFixed(1)} pts avg over last 60 days.` });
  }

  // Co-op expiring within 30 days
  if (typeof COOP_FUNDS !== 'undefined' && Array.isArray(COOP_FUNDS)) {
    const expiring = COOP_FUNDS.filter(f => {
      if (f.vendor_id !== v.id || f.status !== 'open' || !f.deadline) return false;
      const daysLeft = Math.floor((new Date(f.deadline).getTime() - now) / day);
      return daysLeft >= 0 && daysLeft <= 30;
    });
    if (expiring.length) {
      const total = expiring.reduce((s, f) => s + (Number(f.amount) || 0), 0);
      signals.push({ type:'coop_expiring', severity:'critical', short:`Co-op $${_fmtShort(total)} Expires`, msg:`$${Math.round(total).toLocaleString()} co-op balance expiring within 30 days — use it or lose it.` });
    }
  }

  // Inactive with recent sales — orphan risk
  if (v.inactive) {
    const recentSales = (v.sales?.['2024'] || 0) + (v.sales?.['2025'] || 0);
    if (recentSales > 500) {
      signals.push({ type:'inactive_orphan', severity:'critical', short:'Inactive+Sales', msg:`Marked inactive but $${Math.round(recentSales).toLocaleString()} in 2024–25 sales — open PO or rep orphan risk.` });
    }
  }

  // Rebate gap — low rebate score with meaningful spend
  const rebate = v.scores?.rebates;
  if (typeof rebate === 'number' && rebate < 3 && lifetime >= 25000) {
    signals.push({ type:'rebate_risk', severity:'warning', short:'Rebate Gap', msg:`Rebate score ${rebate}/10 with $${_fmtShort(lifetime)} spend — renegotiation opportunity.` });
  }

  // Freight risk — low freight score with meaningful spend
  const freight = v.scores?.freight;
  if (typeof freight === 'number' && freight < 3 && lifetime >= 25000) {
    signals.push({ type:'freight_risk', severity:'warning', short:'Freight Risk', msg:`Freight score ${freight}/10 with $${_fmtShort(lifetime)} spend — push for lower free-freight threshold.` });
  }

  // DTC threat — vendor sells direct and competes
  const dtc = v.scores?.dtc;
  if (typeof dtc === 'number' && dtc >= 7) {
    signals.push({ type:'dtc_threat', severity:'warning', short:`DTC ${dtc}/10`, msg:`High DTC score (${dtc}/10) — this vendor actively competes in the direct-to-consumer channel.` });
  }

  // No rep assigned with meaningful sales
  if (!v.rep && lifetime > 5000) {
    signals.push({ type:'no_rep', severity:'info', short:'No Rep Assigned', msg:'No rep group assigned — direct vendor with no relationship owner on file.' });
  }

  // Improving relationship + strong score = opportunity
  if (trend.direction === 'up' && lifetime >= 10000 && ws !== null && ws >= 6) {
    signals.push({ type:'opportunity', severity:'success', short:'Opportunity ↑', msg:`Improving score trend + $${_fmtShort(lifetime)} spend — good time to push for Tier A terms.` });
  }

  return signals;
}

function computeVendorHealth(v) {
  const signals = computeVendorSignals(v);
  const ws = weightedScore(v);
  const scored = scoredCount(v.scores);
  const tier = computeVendorTier(v);

  // Unscored C-tier vendors get 'unknown' not 'red'
  if (tier === 'C' && scored === 0) return 'unknown';
  if (scored === 0) return 'unknown';

  const critical = signals.filter(s => s.severity === 'critical').length;
  const warning  = signals.filter(s => s.severity === 'warning').length;

  if (critical >= 2 || (ws !== null && ws < 3.5)) return 'red';
  if (critical >= 1 || warning >= 2 || (ws !== null && ws < 5.5)) return 'yellow';
  if (ws !== null && ws >= 5.5 && critical === 0 && warning <= 1) return 'green';
  return 'yellow';
}

// Internal short formatter (avoids dependency on fmt$ which may not handle all cases)
function _fmtShort(n) {
  if (!n || isNaN(n)) return '—';
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n/1000)}K`;
  return `$${Math.round(n)}`;
}

// ─── PORTFOLIO SIGNAL AGGREGATOR ──────────────────────────────────────────────

function computePortfolioSignals() {
  const deteriorating = [], opportunity = [], missingData = [], coopRisk = [], dtcThreats = [], noRep = [];
  VD.forEach(v => {
    const sigs = computeVendorSignals(v);
    const life = v.sales?.t || 0;
    if (sigs.some(s => s.type === 'score_drop'))                       deteriorating.push(v);
    if (sigs.some(s => s.type === 'opportunity'))                      opportunity.push(v);
    if (sigs.some(s => s.type === 'missing_data') && life > 5000)     missingData.push(v);
    if (sigs.some(s => s.type === 'coop_expiring'))                   coopRisk.push(v);
    if (sigs.some(s => s.type === 'dtc_threat') && life >= 10000)     dtcThreats.push(v);
    if (sigs.some(s => s.type === 'no_rep') && life >= 10000)         noRep.push(v);
  });
  return { deteriorating, opportunity, missingData, coopRisk, dtcThreats, noRep };
}

// ─── ENHANCED _vendorVitals (overrides index.html) ────────────────────────────
// Adds health dot + trend arrow + critical signal count to each row in Scores tab.

window._vendorVitals = function(v) {
  const bits = [];

  // Sales (existing logic)
  if (v.sales) {
    const years = Object.keys(v.sales).filter(k => /^\d{4}$/.test(k)).map(Number).sort((a,b) => b-a);
    if (years.length) {
      const amt = Number(v.sales[years[0]]) || 0;
      if (amt > 0) {
        const fmt = amt >= 1000000 ? `$${(amt/1000000).toFixed(2)}M` : amt >= 1000 ? `$${(amt/1000).toFixed(0)}K` : `$${amt.toFixed(0)}`;
        bits.push(`<span title="Sales ${years[0]}">${fmt}</span>`);
      }
    }
  }

  // Days since last score change (existing logic)
  if (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) {
    const my = CHANGELOG.filter(c => c.vendor === v.name).map(c => new Date(c.ts).getTime()).filter(t => !isNaN(t));
    if (my.length) {
      const days = Math.floor((Date.now() - Math.max(...my)) / 86400000);
      const color = days <= 30 ? 'var(--green)' : days <= 90 ? 'var(--text-2)' : 'var(--yellow)';
      bits.push(`<span style="color:${color};" title="Last score change">${days}d</span>`);
    }
  }

  // Co-op (existing logic)
  if (typeof COOP_FUNDS !== 'undefined' && Array.isArray(COOP_FUNDS)) {
    const open = COOP_FUNDS.filter(r => r.vendor_id === v.id && r.status === 'open');
    if (open.length) {
      const sum = open.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const fmt = sum >= 1000 ? `$${(sum/1000).toFixed(0)}K` : `$${sum.toFixed(0)}`;
      bits.push(`<span style="color:var(--accent);" title="${open.length} open co-op fund(s)">🎯 ${fmt}</span>`);
    }
  }

  // ── VCC additions ──
  const h = computeVendorHealth(v);
  const trend = computeScoreTrend(v);
  const sigs = computeVendorSignals(v);
  const criticals = sigs.filter(s => s.severity === 'critical');

  // Health dot
  const healthDotHtml = vccHealthDot(h);

  // Trend badge inline
  const trendHtml = vccTrendBadge(trend);

  // Critical signal flag (compact — just the count badge)
  const critHtml = criticals.length
    ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:4px;padding:0 5px;font-size:9px;font-weight:700;">${criticals.length}⚠</span>`
    : '';

  const metaHtml = bits.length
    ? `<div style="font-size:10.5px;color:var(--text-3);font-weight:400;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${healthDotHtml}${bits.join('<span style="color:var(--border);">·</span>')}${trendHtml}${critHtml}</div>`
    : `<div style="font-size:10.5px;color:var(--text-3);font-weight:400;margin-top:2px;display:flex;align-items:center;gap:6px;">${healthDotHtml}${trendHtml}${critHtml}</div>`;

  return metaHtml;
};

// ─── NEW renderOverview (overrides deal_optimizer.js) ─────────────────────────

function renderOverview(container) {
  const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
  const totalSales = VD.reduce((s, v) => s + (v.sales?.t || 0), 0);
  const portfolio = computePortfolioSignals();

  // Tier stats
  const tierStats = { A:{count:0,sales:0}, B:{count:0,sales:0}, C:{count:0,sales:0}, D:{count:0,sales:0}, F:{count:0,sales:0} };
  const vendorsWithTiers = VD.filter(v => weightedScore(v) !== null).map(v => {
    const t = getAdaptiveTier(weightedScore(v), allScores);
    if (t && tierStats[t]) { tierStats[t].count++; tierStats[t].sales += v.sales?.t || 0; }
    return { ...v, tier: t };
  });

  // Health counts
  const healthCounts = { green:0, yellow:0, red:0, unknown:0 };
  VD.forEach(v => { const h = computeVendorHealth(v); healthCounts[h]++; });

  // Spend concentration
  const topBySpend = [...VD].filter(v => v.sales?.t > 0)
    .sort((a,b) => (b.sales?.t||0) - (a.sales?.t||0)).slice(0, 5);
  const top5Sales = topBySpend.reduce((s, v) => s + (v.sales?.t||0), 0);
  const concentrationPct = totalSales > 0 ? Math.round((top5Sales / totalSales) * 100) : 0;

  const hasSignals = Object.values(portfolio).some(arr => arr.length > 0);

  // ── Signal section builder ──
  const sigSection = (label, vendors, severity) => {
    if (!vendors.length) return '';
    return `<div style="margin-bottom:12px;">
      <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">${label} · ${vendors.length}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        ${vendors.slice(0, 5).map(v => {
          const ws = weightedScore(v);
          const h = computeVendorHealth(v);
          const vsigs = computeVendorSignals(v);
          const topSig = vsigs.find(s => s.severity === severity) || vsigs[0];
          return `<div class="vcc-sig-row" onclick="openVendorDetail(${v.id})">
            ${vccHealthDot(h)}
            <span style="font-weight:600;font-size:12px;color:var(--accent);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.name)}</span>
            ${ws != null ? `<span class="mono" style="font-size:11px;color:${scoreColor(ws)};flex-shrink:0;">${ws}</span>` : ''}
            ${vccTrendBadge(computeScoreTrend(v))}
            ${topSig ? vccSignalBadge(topSig.severity, topSig.short) : ''}
          </div>`;
        }).join('')}
        ${vendors.length > 5 ? `<div style="font-size:11px;color:var(--text-3);padding:4px 10px;">+${vendors.length-5} more in Scores tab.</div>` : ''}
      </div>
    </div>`;
  };

  // ── Tier bar builder ──
  const tierColors = { A:'#22c55e', B:'#3b82f6', C:'#f59e0b', D:'#f97316', F:'#ef4444' };

  // ── Portfolio health scan (sorted: red first) ──
  const hOrder = { red:0, yellow:1, green:2, unknown:3 };
  const scanVendors = [...VD]
    .filter(v => scoredCount(v.scores) > 0)
    .sort((a, b) => {
      const ha = hOrder[computeVendorHealth(a)] ?? 3;
      const hb = hOrder[computeVendorHealth(b)] ?? 3;
      if (ha !== hb) return ha - hb;
      return (weightedScore(b)||0) - (weightedScore(a)||0);
    })
    .slice(0, 60);

  container.innerHTML = `

    <!-- ── KPI BAR ── -->
    <div class="vcc-kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px;">
      <div class="card stat-card" style="border-left:3px solid #22c55e;">
        <div class="stat-label">Healthy</div>
        <div class="stat-value" style="color:#22c55e;">${healthCounts.green}</div>
        <div class="stat-sub">Strong + recent</div>
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
        <div class="stat-sub">Score dropping 60d</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid #2563eb;">
        <div class="stat-label">Opportunity</div>
        <div class="stat-value" style="color:#2563eb;">${portfolio.opportunity.length}</div>
        <div class="stat-sub">Improving + spend</div>
      </div>
      <div class="card stat-card" style="border-left:3px solid ${concentrationPct > 60 ? '#ef4444' : concentrationPct > 40 ? '#f59e0b' : '#22c55e'};">
        <div class="stat-label">Spend Conc.</div>
        <div class="stat-value" style="color:${concentrationPct > 60 ? '#ef4444' : concentrationPct > 40 ? '#f59e0b' : 'var(--text)'};">${concentrationPct}%</div>
        <div class="stat-sub">Top 5 of total</div>
      </div>
    </div>

    <!-- ── TWO-COL BODY ── -->
    <div class="vcc-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">

      <!-- LEFT: OPERATIONAL SIGNALS -->
      <div class="card" style="height:100%;">
        <div class="card-hd" style="background:linear-gradient(90deg,#fef2f2,var(--surface));border-bottom:2px solid #fecaca;">
          <span class="card-title" style="color:#dc2626;">⚡ Operational Signals</span>
          <span style="font-size:11px;color:var(--text-3);margin-left:auto;">${hasSignals ? 'Action needed' : 'All clear'}</span>
        </div>
        <div style="padding:14px 16px;">
          ${!hasSignals ? `<div style="text-align:center;padding:28px 0;color:var(--text-3);font-size:13px;">No active signals — portfolio looks clean.</div>` : ''}
          ${sigSection('Deteriorating', portfolio.deteriorating, 'critical')}
          ${sigSection('Co-op Expiring', portfolio.coopRisk, 'critical')}
          ${sigSection('High Opportunity', portfolio.opportunity, 'success')}
          ${sigSection('DTC Threat ≥$10K', portfolio.dtcThreats, 'warning')}
          ${sigSection('No Rep · ≥$10K Spend', portfolio.noRep, 'info')}
          ${sigSection('Thin Data · ≥$5K Spend', portfolio.missingData, 'warning')}
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
              const pct = totalSales > 0 ? (st.sales / totalSales) * 100 : 0;
              return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                ${tierBadge(t)}
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:12px;font-weight:600;">${st.count} vendor${st.count!==1?'s':''}</span>
                    <span class="mono" style="font-size:11px;">${fmt$(st.sales)}</span>
                  </div>
                  <div class="vcc-pbar">
                    <div class="vcc-pbar-fill" style="width:${Math.min(pct,100).toFixed(1)}%;background:${tierColors[t]};"></div>
                  </div>
                </div>
                <span style="font-size:11px;color:var(--text-3);min-width:32px;text-align:right;">${pct.toFixed(0)}%</span>
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
            ${topBySpend.map((v, i) => {
              const pct = totalSales > 0 ? ((v.sales?.t||0)/totalSales)*100 : 0;
              const h = computeVendorHealth(v);
              const ws = weightedScore(v);
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;" onclick="openVendorDetail(${v.id})">
                <span class="mono" style="font-size:11px;color:var(--text-3);min-width:14px;">${i+1}</span>
                ${vccHealthDot(h)}
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.name)}</div>
                  <div class="vcc-pbar" style="margin-top:4px;">
                    <div class="vcc-pbar-fill" style="width:${Math.min(pct,100).toFixed(1)}%;background:var(--accent);"></div>
                  </div>
                </div>
                <span class="mono" style="font-size:11px;font-weight:600;flex-shrink:0;">${fmt$(v.sales?.t)}</span>
                ${vccTrendBadge(computeScoreTrend(v))}
              </div>`;
            }).join('')}
          </div>
        </div>

      </div>
    </div>

    <!-- ── PORTFOLIO HEALTH SCAN ── -->
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Portfolio Health Scan</span>
        <span style="font-size:11px;color:var(--text-3);margin-left:auto;">Scored vendors · sorted by risk · click to open profile</span>
      </div>
      <div class="tbl-wrap" style="max-height:400px;">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Health</th>
              <th>Tier</th>
              <th>Score</th>
              <th>Trend</th>
              <th>Confidence</th>
              <th>Signals</th>
              <th>5-Yr Sales</th>
            </tr>
          </thead>
          <tbody>
            ${scanVendors.map(v => {
              const ws = weightedScore(v);
              const h = computeVendorHealth(v);
              const t = ws !== null ? getAdaptiveTier(ws, allScores) : null;
              const trend = computeScoreTrend(v);
              const sigs = computeVendorSignals(v);
              return `<tr style="cursor:pointer;" onclick="openVendorDetail(${v.id})">
                <td style="font-weight:600;color:var(--accent);">${esc(v.name)}</td>
                <td>${vccHealthChip(h)}</td>
                <td>${t ? tierBadge(t) : '<span class="na">TBD</span>'}</td>
                <td>${ws != null ? `<span class="mono fw6" style="color:${scoreColor(ws)};">${ws}</span>` : '<span class="na">—</span>'}</td>
                <td style="text-align:center;">${vccTrendBadge(trend)}</td>
                <td>${vccConfidenceChip(v)}</td>
                <td style="max-width:200px;">${sigs.slice(0,2).map(s => vccSignalBadge(s.severity, s.short)).join(' ')}</td>
                <td class="mono sm">${fmt$(v.sales?.t)}</td>
              </tr>`;
            }).join('')}
            ${scanVendors.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-3);">No scored vendors yet — use the Scores tab to start evaluating.</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── INSIGHT PANEL (injected into vendor detail modal) ────────────────────────

function vccBuildInsightPanel(v) {
  const signals = computeVendorSignals(v);
  const trend = computeScoreTrend(v);
  const h = computeVendorHealth(v);
  const lifetime = v.sales?.t || 0;

  // Negotiation leverage talking points
  const leverage = [];
  if (lifetime >= 25000)
    leverage.push(`Lifetime spend $${_fmtShort(lifetime)} — volume warrants premium terms.`);
  const rebate = v.scores?.rebates;
  if (typeof rebate === 'number' && rebate < 4)
    leverage.push(`Rebate score ${rebate}/10 — push for improved rebate % commensurate with spend.`);
  const freight = v.scores?.freight;
  if (typeof freight === 'number' && freight < 4)
    leverage.push(`Freight score ${freight}/10 — negotiate lower free-freight threshold.`);
  const credit = v.scores?.credit;
  if (typeof credit === 'number' && credit < 5 && lifetime >= 15000)
    leverage.push(`Credit terms score ${credit}/10 — push for extended net terms given volume.`);
  if (typeof COOP_FUNDS !== 'undefined') {
    const open = COOP_FUNDS.filter(f => f.vendor_id === v.id && f.status === 'open');
    if (open.length) {
      const total = open.reduce((s,f) => s+(Number(f.amount)||0), 0);
      leverage.push(`$${Math.round(total).toLocaleString()} open co-op balance — include in next conversation.`);
    }
  }
  const sales2025 = v.sales?.['2025'] || 0;
  const sales2024 = v.sales?.['2024'] || 0;
  if (sales2025 > 5000 && sales2025 > sales2024 * 0.4)
    leverage.push(`Growing spend in 2025 ($${_fmtShort(sales2025)}) — use momentum in renewal talks.`);

  if (!signals.length && !leverage.length) return '';

  return `<div id="vcc-insight-panel" style="margin-bottom:20px;padding:16px;background:var(--surface2);border-radius:var(--radius);border:1px solid var(--border);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;">⚡ Intelligence</span>
      ${vccHealthChip(h)}
      ${vccConfidenceChip(v)}
      ${vccTrendBadge(trend)}
      ${trend.delta != null ? vccDeltaBadge(trend.delta) : ''}
    </div>

    ${signals.length ? `<div style="margin-bottom:${leverage.length ? 14 : 0}px;">
      <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Active Signals</div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${signals.map(s => `<div class="vcc-signal-card ${s.severity}">
          ${vccSignalBadge(s.severity, s.short)}
          <span>${esc(s.msg)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${leverage.length ? `<div>
      <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Negotiation Leverage</div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${leverage.map(l => `<div style="display:flex;gap:8px;font-size:12px;color:var(--text-2);padding:5px 0;border-top:1px solid var(--border-light);">
          <span style="color:#2563eb;font-weight:700;flex-shrink:0;">→</span>
          <span>${esc(l)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}
  </div>`;
}

// ─── openVendorDetail WRAPPER ─────────────────────────────────────────────────
// Captures original function (already set on window by inline script) and wraps it.
// Uses assignment (not function declaration) to avoid hoisting clobber.

const _vccOrigOpenVendorDetail = window.openVendorDetail;
window.openVendorDetail = async function(vendorId) {
  await _vccOrigOpenVendorDetail(vendorId);
  // DOM is synchronously built by original; inject after paint
  setTimeout(() => {
    if (document.getElementById('vcc-insight-panel')) return; // already injected
    const overlay = document.getElementById('vendor-detail-modal');
    if (!overlay) return;
    const modal = overlay.firstElementChild;
    if (!modal || modal.children.length < 2) return;
    const content = modal.children[1]; // scrollable content area
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
