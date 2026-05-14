// ── 5.7 VENDOR DEAL OPTIMIZER ──
// Surfaces actionable negotiation moves from existing data:
// vendor scores, tier, spend, changelog deltas, inactive flags.
// Pure-compute layer — no new schema.
function renderDealOptimizer(c){
  const recs = computeDealRecommendations();
  const counts = {renegotiate:0, investigate:0, replace:0, upgrade:0, cut:0};
  recs.forEach(r => counts[r.kind] = (counts[r.kind]||0) + 1);
  const totalImpact = recs.reduce((s,r)=>s + (r.impact||0), 0);

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Deal Optimizer.</strong> Recommendations are derived from vendor scores, tier, lifetime spend, recent score changes, and inactive flags. Click a row to open vendor detail. Heuristics will sharpen as more changelog data accumulates.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card" style="border-left:3px solid var(--accent);"><div class="stat-label">Renegotiate</div><div class="stat-value" style="color:var(--accent);">${counts.renegotiate||0}</div><div class="stat-sub">High-spend, low-score</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--yellow);"><div class="stat-label">Investigate</div><div class="stat-value" style="color:var(--yellow);">${counts.investigate||0}</div><div class="stat-sub">Recent score drops</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--blue);"><div class="stat-label">Upgrade / Tier-up</div><div class="stat-value" style="color:var(--blue);">${counts.upgrade||0}</div><div class="stat-sub">High-scoring B-tier</div></div>
      <div class="card stat-card"><div class="stat-label">Est. Annual Impact</div><div class="stat-value">${totalImpact>0?'$'+(totalImpact/1000).toFixed(1)+'K':'—'}</div><div class="stat-sub">Sum of est. savings</div></div>
    </div>
    <div class="card">
      <div class="card-hd"><span class="card-title">Recommendations · ${recs.length}</span></div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>Priority</th><th>Vendor</th><th>What changed / Why</th><th>Suggested Move</th><th>Est. Impact</th><th>Lifetime $</th></tr></thead>
          <tbody>
            ${recs.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--text-3);">No recommendations right now. Either every vendor is humming, or there isn't enough data yet (needs scores + recent changelog activity).</td></tr>` : recs.map(r => {
              const v = VD.find(x => x.id === r.vendor_id);
              const lifetime = v?.sales?.t || 0;
              const priColor = {renegotiate:'var(--accent)', investigate:'var(--yellow)', replace:'var(--purple,var(--accent))', upgrade:'var(--blue)', cut:'var(--text-3)'}[r.kind] || 'var(--text-3)';
              const priLabel = {renegotiate:'Renegotiate', investigate:'Investigate', replace:'Replace', upgrade:'Tier-up', cut:'Cut'}[r.kind];
              return `<tr style="cursor:pointer;" onclick="closeModal();openVendorDetail(${r.vendor_id});">
                <td><span class="badge" style="background:${priColor};color:#fff;font-size:10px;text-transform:uppercase;">${priLabel}</span></td>
                <td style="font-weight:600;color:var(--accent);">${esc(r.vendor_name)}</td>
                <td class="sm" style="max-width:280px;">${esc(r.reason)}</td>
                <td class="sm">${esc(r.suggestion)}</td>
                <td class="mono fw6">${r.impact ? '$'+Math.round(r.impact).toLocaleString() : '<span class="muted">—</span>'}</td>
                <td class="mono sm">${lifetime ? '$'+Math.round(lifetime).toLocaleString() : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function computeDealRecommendations(){
  const recs = [];
  const now = Date.now();
  const dayMs = 86400000;

  // Index recent changelog deltas per (vendor, category)
  const recentDelta = {};   // vendor -> {cat -> {old, new, days}}
  (CHANGELOG||[]).forEach(c => {
    if(!c.cat || c.cat === 'Categories' || c.cat === 'Notes' || c.cat === 'Tier' || c.cat === 'Inactive') return;
    const ts = c.ts ? new Date(c.ts).getTime() : 0;
    const days = ts ? Math.round((now - ts)/dayMs) : 999;
    if(days > 90) return; // 90-day window
    const oldN = parseFloat(c.oldVal), newN = parseFloat(c.newVal);
    if(isNaN(newN) || isNaN(oldN)) return;
    const delta = newN - oldN;
    const key = c.vendor;
    (recentDelta[key] = recentDelta[key]||{})[c.cat] = {old:oldN, new:newN, delta, days};
  });

  (typeof VD !== 'undefined' ? VD : []).forEach(v => {
    if(!v) return;
    const lifetime = v.sales?.t || 0;
    const tier = (typeof computeVendorTier === 'function' ? computeVendorTier(v) : 'C');
    const score = (typeof vendorScore === 'function') ? vendorScore(v).weighted : null;
    const scoresMap = v.s || {};
    // Build flat map of cat→numeric score
    const flat = {};
    Object.keys(scoresMap).forEach(k => { const s = scoresMap[k]; if(s && typeof s.v === 'number') flat[k] = s.v; });

    // ── 1. RENEGOTIATE — high spend, low pricing/freight/returns score
    const negCats = ['credit','discounts','freight','returns'];
    const lowNeg = negCats.filter(k => flat[k]!=null && flat[k] <= 4);
    if(lifetime >= 25000 && lowNeg.length > 0){
      const worst = lowNeg.map(k => ({k, v:flat[k]})).sort((a,b)=>a.v-b.v)[0];
      const impact = Math.round(lifetime * 0.03);  // ~3% of spend assumed recoverable
      recs.push({
        vendor_id: v.id, vendor_name: v.n, kind:'renegotiate',
        reason: `Spend $${Math.round(lifetime).toLocaleString()}, ${worst.k} score ${worst.v}/10 (${lowNeg.length>1?'plus '+(lowNeg.length-1)+' other low scores':'flagged'})`,
        suggestion: `Push for better ${worst.k} terms or escalate to rep / corporate`,
        impact
      });
    }

    // ── 2. INVESTIGATE — recent score drop ≥2 points in any category
    const deltas = recentDelta[v.n] || {};
    let worstDrop = null;
    Object.keys(deltas).forEach(cat => {
      const d = deltas[cat];
      if(d.delta <= -2 && (!worstDrop || d.delta < worstDrop.delta)) worstDrop = Object.assign({cat}, d);
    });
    if(worstDrop){
      recs.push({
        vendor_id: v.id, vendor_name: v.n, kind:'investigate',
        reason: `${worstDrop.cat} dropped ${worstDrop.old}→${worstDrop.new} (${worstDrop.delta}) ${worstDrop.days}d ago`,
        suggestion: 'Reach out to rep — what changed? Consider sourcing alternative if structural.',
        impact: Math.round(lifetime * 0.02)
      });
    }

    // ── 3. REPLACE — flagged inactive but still has 2024+ sales (orphan)
    if(v.inactive){
      const recentSales = (v.sales?.['2024']||0) + (v.sales?.['2025']||0);
      if(recentSales > 1000){
        recs.push({
          vendor_id: v.id, vendor_name: v.n, kind:'replace',
          reason: `Marked inactive but $${Math.round(recentSales).toLocaleString()} in 2024–25 sales — orphan risk`,
          suggestion: 'Reactivate or migrate any open POs to a sister brand / replacement vendor.',
          impact: Math.round(recentSales * 0.1)
        });
      }
    }

    // ── 4. UPGRADE — tier B with strong scores (≥7 average across rated cats)
    const ratedScores = Object.values(flat);
    const avg = ratedScores.length ? ratedScores.reduce((s,n)=>s+n,0)/ratedScores.length : null;
    if(tier === 'B' && avg !== null && avg >= 7.5 && ratedScores.length >= 3 && lifetime >= 5000){
      recs.push({
        vendor_id: v.id, vendor_name: v.n, kind:'upgrade',
        reason: `Tier B but avg score ${avg.toFixed(1)}/10 across ${ratedScores.length} cats, $${Math.round(lifetime).toLocaleString()} lifetime`,
        suggestion: 'Negotiate tier-A terms (better pricing tier, MAP enforcement, marketing co-op).',
        impact: Math.round(lifetime * 0.04)
      });
    }

    // ── 5. CUT — low spend, low score, no recent sales
    if(lifetime > 0 && lifetime < 1500 && avg !== null && avg < 4){
      const recent = (v.sales?.['2024']||0) + (v.sales?.['2025']||0);
      if(recent < 100){
        recs.push({
          vendor_id: v.id, vendor_name: v.n, kind:'cut',
          reason: `Lifetime $${Math.round(lifetime).toLocaleString()}, avg ${avg.toFixed(1)}/10, near-zero recent activity`,
          suggestion: 'Drop from active catalog unless strategic. Frees rep + ops bandwidth.',
          impact: 0
        });
      }
    }
  });

  // Priority order
  const order = {renegotiate:0, investigate:1, upgrade:2, replace:3, cut:4};
  recs.sort((a,b) => {
    const oa = order[a.kind] ?? 9, ob = order[b.kind] ?? 9;
    if(oa !== ob) return oa - ob;
    return (b.impact||0) - (a.impact||0);
  });
  return recs;
}

// Tier assignment: weighted score of 0 = auto-F. Remaining non-zero vendors
// are ranked and split into 5 equal buckets (top 20% = A, next 20% = B,
// next 20% = C, next 20% = D, bottom 20% = F). F is the largest bucket because
// it contains both the zeros AND the bottom 20% of non-zero scoring vendors.
function getAdaptiveTier(score, allScores) {
  if (score === null || score === undefined) return null;
  if (score === 0) return 'F';
  const nonZero = [...allScores].filter(s => s !== null && s > 0).sort((a, b) => b - a);
  if (nonZero.length === 0) return 'F';
  // Find this score's rank among non-zero scores. Tied scores share the highest position.
  const rank = nonZero.findIndex(s => s <= score);
  if (rank === -1) return 'F';
  const percentile = (rank / nonZero.length) * 100;
  if (percentile < 20) return 'A';
  if (percentile < 40) return 'B';
  if (percentile < 60) return 'C';
  if (percentile < 80) return 'D';
  return 'F';
}

function renderOverview(container) {
  const totalScored = VD.filter(v => scoredCount(v.scores) >= 5).length;
  const withScores = VD.filter(v => scoredCount(v.scores) > 0).length;
  const totalSales = VD.reduce((sum, v) => sum + (v.sales?.t || 0), 0);

  // Calculate adaptive tiers
  const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
  const vendorsWithTiers = VD.filter(v => weightedScore(v) !== null).map(v => ({
    ...v,
    tier: getAdaptiveTier(weightedScore(v), allScores)
  }));

  const tierStats = {
    A: { count: 0, sales: 0 },
    B: { count: 0, sales: 0 },
    C: { count: 0, sales: 0 },
    D: { count: 0, sales: 0 },
    F: { count: 0, sales: 0 }
  };

  vendorsWithTiers.forEach(v => {
    if (v.tier && tierStats[v.tier]) {
      tierStats[v.tier].count++;
      tierStats[v.tier].sales += v.sales?.t || 0;
    }
  });

  const topVendors = [...vendorsWithTiers]
    .sort((a, b) => weightedScore(b) - weightedScore(a))
    .slice(0, 10);

  container.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card">
        <div class="stat-label">Total Vendors</div>
        <div class="stat-value">${VD.length}</div>
        <div class="stat-sub">Active in system</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Vendors Scored</div>
        <div class="stat-value">${withScores}</div>
        <div class="stat-sub">${(withScores/VD.length*100).toFixed(0)}% have scores</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Total 5-Yr Sales</div>
        <div class="stat-value">${fmt$(totalSales)}</div>
        <div class="stat-sub">All vendors combined</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Tiered Vendors</div>
        <div class="stat-value">${vendorsWithTiers.length}</div>
        <div class="stat-sub">Adaptive 20% buckets</div>
      </div>
    </div>

    <div class="g2 mb16">
      <div class="card">
        <div class="card-hd"><span class="card-title">Tier Distribution (Adaptive 20% Buckets)</span></div>
        <div style="padding:20px;">
          ${['A', 'B', 'C', 'D', 'F'].map(t => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border-light);">
              <div style="display:flex;align-items:center;gap:12px;flex:1;">
                ${tierBadge(t)}
                <div>
                  <div style="font-weight:600;font-size:14px;">${t} Tier</div>
                  <div style="font-size:12px;color:var(--text-3);">${tierStats[t].count} vendors</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div class="mono fw6" style="font-size:16px;">${fmt$(tierStats[t].sales)}</div>
                <div style="font-size:11px;color:var(--text-3);">${((tierStats[t].sales / totalSales) * 100).toFixed(1)}% of total</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Top 10 Vendors by Score</span></div>
        <div class="tbl-wrap" style="max-height:450px;">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Vendor</th>
                <th>Tier</th>
                <th>Score</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              ${topVendors.map((v, i) => `
                <tr style="cursor:pointer;" onclick="openVendorDetail(${v.id})">
                  <td class="mono">${i + 1}</td>
                  <td style="font-weight:600;">${esc(v.name)}</td>
                  <td>${tierBadge(v.tier)}</td>
                  <td class="mono fw6" style="color:${scoreColor(weightedScore(v))};">${weightedScore(v)}</td>
                  <td class="mono">${fmt$(v.sales?.t)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Change log accessors — CHANGELOG is the single source of truth, hydrated
// from Supabase on load via sbLoadChangelog() and appended to via logChange()/sbAppendChangelog().
// These helpers exist for the Changelog tab's UI which uses an alternate shape.
function getChangeLog() {
  // Convert primary CHANGELOG shape -> Changelog tab's expected shape
  return (CHANGELOG || []).map((e, i) => ({
    id: i,
    date: e.ts,
    user: e.user,
    vendorName: e.vendor,
    category: e.cat,
    oldValue: e.oldVal,
    newValue: e.newVal
  }));
}

function saveChangeLog(log) {
  // No-op: changes are persisted via logChange() -> sbAppendChangelog().
  // This shim exists for any legacy callers that expected to overwrite the log.
}

