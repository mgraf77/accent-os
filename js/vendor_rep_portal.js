// ── 6.6 VENDOR REP PORTAL (internal staff management view) ──
// Full relationship dashboard for every vendor rep group.
// Shows brands managed, score health, coop fund status, sales volume,
// and quick outreach actions — all in one view.
// Complements portal_preview.js (which shows the external-facing rep view).
// No new schema — reads from: VD (vendor data), REP_DIRECTORY, COOP_FUNDS, SHOWROOM_DISPLAYS.

let repPortalExpanded = null; // rep company name of expanded row
let repPortalSort = 'sales';  // sales | score | vendors | coop

function repportal(el, actions) {
  if (actions) {
    actions.innerHTML = `
      <select style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;" onchange="repPortalSort=this.value;repportal($('pg-content'),$('pg-actions'))">
        <option value="sales" ${repPortalSort === 'sales' ? 'selected' : ''}>Sort: 5-Yr Sales</option>
        <option value="score" ${repPortalSort === 'score' ? 'selected' : ''}>Sort: Avg Score</option>
        <option value="vendors" ${repPortalSort === 'vendors' ? 'selected' : ''}>Sort: Vendor Count</option>
        <option value="coop" ${repPortalSort === 'coop' ? 'selected' : ''}>Sort: Open Co-op $</option>
      </select>
      <button class="btn btn-outline btn-sm" onclick="goTo('portalpreview');setTimeout(()=>{if(typeof portalPreview!=='undefined')portalPreview.mode='rep';portalpreview($('pg-content'),$('pg-actions'));},50)">👁 Rep Portal Preview</button>
    `;
  }

  const vd = typeof VD !== 'undefined' ? VD : [];
  const repDir = typeof REP_DIRECTORY !== 'undefined' ? REP_DIRECTORY : [];
  const coopFunds = typeof COOP_FUNDS !== 'undefined' ? COOP_FUNDS : [];
  const displays = typeof SHOWROOM_DISPLAYS !== 'undefined' ? SHOWROOM_DISPLAYS : [];

  if (!vd.length) {
    el.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:var(--text-3);font-size:13px;">Vendor data not loaded.</div>`;
    return;
  }

  // ── build rep groups from VD ──
  const repMap = {};
  vd.forEach(v => {
    const rn = v.rep || 'Unassigned';
    if (!repMap[rn]) repMap[rn] = { vendors: [], totalSales: 0, scores: [] };
    repMap[rn].vendors.push(v);
    repMap[rn].totalSales += (v.sales?.t || 0);
    const ws = typeof weightedScore === 'function' ? weightedScore(v) : null;
    if (ws !== null) repMap[rn].scores.push(ws);
  });

  // Merge REP_DIRECTORY contact info
  const repGroups = Object.entries(repMap).map(([name, data]) => {
    const dir = repDir.find(r => r['Rep Company'] === name) || {};
    const avgScore = data.scores.length
      ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : null;
    const allScores = data.scores.length ? data.scores : [];
    const tiers = { A: 0, B: 0, C: 0, TBD: 0 };
    data.vendors.forEach(v => {
      const ws = typeof weightedScore === 'function' ? weightedScore(v) : null;
      const allWs = vd.map(x => typeof weightedScore === 'function' ? weightedScore(x) : null).filter(x => x !== null);
      const t = ws !== null && typeof getAdaptiveTier === 'function'
        ? (getAdaptiveTier(ws, allWs) || 'TBD')
        : 'TBD';
      tiers[t] = (tiers[t] || 0) + 1;
    });
    const vendorIds = new Set(data.vendors.map(v => v.id));
    const myCoop = coopFunds.filter(f => vendorIds.has(f.vendor_id));
    const openCoop = myCoop.filter(f => f.status === 'open').reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const myDisplays = displays.filter(d => vendorIds.has(d.vendor_id));
    return {
      name,
      vendors: data.vendors,
      totalSales: data.totalSales,
      avgScore,
      tiers,
      coopFunds: myCoop,
      openCoopAmt: openCoop,
      myDisplays,
      vendorCount: data.vendors.length,
      primaryContact: dir['Primary Contact'] || null,
      phone: dir['Phone'] || dir['Office Phone'] || null,
      email: dir['Email'] || dir['Quote Email'] || null,
      website: dir['Website'] || null,
      type: dir['Type'] || null,
      dir5yrSales: dir['Total 5yr Sales'] || null,
    };
  });

  // sort
  repGroups.sort((a, b) => {
    if (repPortalSort === 'score') return (b.avgScore ?? -1) - (a.avgScore ?? -1);
    if (repPortalSort === 'vendors') return b.vendorCount - a.vendorCount;
    if (repPortalSort === 'coop') return b.openCoopAmt - a.openCoopAmt;
    return b.totalSales - a.totalSales; // default: sales
  });

  // ── stats ──
  const totalBrands = vd.length;
  const repsWithCoop = repGroups.filter(r => r.openCoopAmt > 0).length;
  const totalOpenCoop = repGroups.reduce((s, r) => s + r.openCoopAmt, 0);
  const overallAvgScore = (() => {
    const all = repGroups.filter(r => r.avgScore !== null).map(r => r.avgScore);
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
  })();

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card">
        <div class="stat-label">Rep Groups</div>
        <div class="stat-value">${repGroups.length}</div>
        <div class="stat-sub">${totalBrands} total brands managed</div>
      </div>
      <div class="card stat-card" ${overallAvgScore && overallAvgScore >= 7 ? 'style="border-left:3px solid var(--green);"' : ''}>
        <div class="stat-label">Portfolio Avg Score</div>
        <div class="stat-value">${overallAvgScore !== null ? overallAvgScore.toFixed(1) : '—'}</div>
        <div class="stat-sub">weighted across all vendors</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Reps w/ Open Co-op</div>
        <div class="stat-value">${repsWithCoop}</div>
        <div class="stat-sub">${repsWithCoop} groups have open funds</div>
      </div>
      <div class="card stat-card" ${totalOpenCoop > 0 ? 'style="border-left:3px solid var(--blue);"' : ''}>
        <div class="stat-label">Total Open Co-op $</div>
        <div class="stat-value">$${Math.round(totalOpenCoop / 1000).toLocaleString()}K</div>
        <div class="stat-sub">across all rep groups</div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd">
        <span class="card-title">Vendor Rep Groups · ${repGroups.length}</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="sm muted">Click any row to expand. Sorted by ${repPortalSort}.</span>
          <button class="btn btn-outline btn-sm" onclick="goTo('vendors');setTimeout(()=>{vSection='replist';renderVendors($('pg-content'));},50)">Rep Directory →</button>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 340px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Rep Group</th>
              <th>Type</th>
              <th>Primary Contact</th>
              <th>Brands</th>
              <th>Avg Score</th>
              <th>Tiers</th>
              <th>5-Yr Sales</th>
              <th>Open Co-op</th>
              <th>Displays</th>
            </tr>
          </thead>
          <tbody>
            ${repGroups.map(r => {
              const isExp = repPortalExpanded === r.name;
              const scoreColor = r.avgScore !== null
                ? (r.avgScore >= 8 ? 'var(--green)' : r.avgScore >= 6 ? 'var(--blue)' : 'var(--yellow)')
                : 'var(--text-3)';
              const salesFmt = r.totalSales >= 1000000
                ? `$${(r.totalSales / 1000000).toFixed(2)}M`
                : `$${Math.round(r.totalSales / 1000).toLocaleString()}K`;
              const tierStr = [
                r.tiers.A ? `A:${r.tiers.A}` : '',
                r.tiers.B ? `B:${r.tiers.B}` : '',
                r.tiers.C ? `C:${r.tiers.C}` : '',
              ].filter(Boolean).join(' · ') || '—';
              return `<tr style="cursor:pointer;${isExp ? 'background:var(--surface2);' : ''}" onclick="repPortalExpanded=${isExp ? 'null' : `'${r.name.replace(/'/g, "\\'")}'`};repportal($('pg-content'),$('pg-actions'))">
                <td style="font-weight:600;">${esc(r.name)}<span style="margin-left:4px;font-size:11px;color:var(--text-3);">${isExp ? '▲' : '▼'}</span></td>
                <td><span class="badge bg-gray" style="font-size:10px;">${esc(r.type || '—')}</span></td>
                <td class="sm">${esc(r.primaryContact || '—')}</td>
                <td class="mono">${r.vendorCount}</td>
                <td class="mono fw6" style="color:${scoreColor};">${r.avgScore !== null ? r.avgScore.toFixed(1) : '—'}</td>
                <td class="mono sm">${tierStr}</td>
                <td class="mono fw6">${salesFmt}</td>
                <td class="mono">${r.openCoopAmt > 0 ? `<span style="color:var(--blue);">$${Math.round(r.openCoopAmt / 1000).toLocaleString()}K</span>` : '<span class="muted">—</span>'}</td>
                <td class="mono">${r.myDisplays.length || '<span class="muted">—</span>'}</td>
              </tr>
              ${isExp ? _repPortalDetailRow(r) : ''}`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _repPortalDetailRow(r) {
  const topVendors = [...r.vendors]
    .map(v => ({ v, ws: typeof weightedScore === 'function' ? weightedScore(v) : null }))
    .sort((a, b) => (b.ws ?? -1) - (a.ws ?? -1))
    .slice(0, 8);

  const openCoop = r.coopFunds.filter(f => f.status === 'open');
  const deadlineSoon = openCoop.filter(f => {
    if (!f.deadline) return false;
    const d = new Date(f.deadline);
    return d - new Date() < 30 * 86400000;
  });

  const allWs = (typeof VD !== 'undefined' ? VD : [])
    .map(v => typeof weightedScore === 'function' ? weightedScore(v) : null)
    .filter(x => x !== null);

  return `<tr>
    <td colspan="9" style="padding:0;">
      <div style="background:var(--surface2);border-top:1px solid var(--border);border-bottom:2px solid var(--accent);padding:18px 22px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">

          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Contact Info</div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:4px;">
              ${r.primaryContact ? `<div><strong>${esc(r.primaryContact)}</strong></div>` : ''}
              ${r.phone ? `<div>📞 ${esc(r.phone)}</div>` : ''}
              ${r.email ? `<div>✉ <a href="mailto:${esc(r.email)}" style="color:var(--accent);">${esc(r.email)}</a></div>` : ''}
              ${r.website ? `<div>🌐 <a href="${r.website.startsWith('http') ? esc(r.website) : 'https://' + esc(r.website)}" target="_blank" style="color:var(--accent);">Visit site</a></div>` : ''}
              ${r.dir5yrSales ? `<div style="margin-top:6px;"><strong>5-Yr Sales:</strong> $${Number(r.dir5yrSales).toLocaleString()}</div>` : ''}
            </div>
          </div>

          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Top Brands by Score (${r.vendors.length} total)</div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              ${topVendors.map(({ v, ws }) => {
                const tier = ws !== null && typeof getAdaptiveTier === 'function'
                  ? getAdaptiveTier(ws, allWs) : '—';
                const tc = { A: 'var(--green)', B: 'var(--blue)', C: 'var(--yellow)' }[tier] || 'var(--text-3)';
                return `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--surface);border-radius:5px;border:1px solid var(--border-light);font-size:12px;">
                  <span style="font-weight:600;">${esc(v.n)}</span>
                  <span><span style="font-size:10px;font-weight:700;color:${tc};">${tier}</span> <span class="mono">${ws !== null ? ws : '—'}</span></span>
                </div>`;
              }).join('')}
              ${r.vendors.length > 8 ? `<div style="font-size:11px;color:var(--text-3);padding:4px 8px;">+ ${r.vendors.length - 8} more brands</div>` : ''}
            </div>
          </div>

          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Co-op Funds (${openCoop.length} open)</div>
            ${openCoop.length === 0
              ? `<div style="font-size:12px;color:var(--text-3);">No open co-op funds.</div>`
              : `<div style="display:flex;flex-direction:column;gap:3px;">
                  ${openCoop.slice(0, 6).map(f => {
                    const fv = r.vendors.find(v => v.id === f.vendor_id);
                    const nearDeadline = f.deadline && new Date(f.deadline) - new Date() < 30 * 86400000;
                    return `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--surface);border-radius:5px;border:1px solid ${nearDeadline ? 'var(--yellow)' : 'var(--border-light)'};font-size:12px;">
                      <span>${esc(fv?.n || '—')} · ${esc(f.fund_type || '')}</span>
                      <span class="mono fw6">$${Number(f.amount || 0).toLocaleString()}${f.deadline ? '<span style="font-size:10px;color:var(--text-3)"> · ' + f.deadline + '</span>' : ''}</span>
                    </div>`;
                  }).join('')}
                  ${openCoop.length > 6 ? `<div style="font-size:11px;color:var(--text-3);padding:4px 8px;">+ ${openCoop.length - 6} more</div>` : ''}
                  ${deadlineSoon.length ? `<div style="margin-top:6px;font-size:11px;color:var(--yellow);font-weight:600;">⚠ ${deadlineSoon.length} fund${deadlineSoon.length > 1 ? 's' : ''} expire within 30 days</div>` : ''}
                </div>`
            }
          </div>
        </div>

        ${r.myDisplays.length > 0 ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">Showroom Displays (${r.myDisplays.length})</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${r.myDisplays.slice(0, 8).map(d => `<span style="font-size:11px;padding:3px 8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;">${esc(d.display_name || d.vendor_name || '—')} <span class="badge bg-${d.status === 'active' ? 'green' : 'gray'}" style="font-size:9px;margin-left:2px;">${d.status}</span></span>`).join('')}
            ${r.myDisplays.length > 8 ? `<span style="font-size:11px;color:var(--text-3);">+ ${r.myDisplays.length - 8} more</span>` : ''}
          </div>
        </div>` : ''}

        <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border-light);">
          <button class="btn btn-accent btn-sm" onclick="openRepOutreach('${r.name.replace(/'/g, "\\'")}')">📧 Generate Outreach Email</button>
          <button class="btn btn-outline btn-sm" onclick="goTo('vendors');setTimeout(()=>{vSection='repview';vRep='${r.name.replace(/'/g, "\\'")}';renderVendors($('pg-content'));},50)">📊 Vendor Scores View</button>
          <button class="btn btn-outline btn-sm" onclick="goTo('portalpreview');setTimeout(()=>{if(typeof portalPreview!=='undefined'){portalPreview.mode='rep';portalPreview.selectedId='${r.name.replace(/'/g, "\\'")}';};portalpreview($('pg-content'),$('pg-actions'));_ppRender();},80)">👁 Rep Portal Preview</button>
          ${r.coopFunds.length > 0 ? `<button class="btn btn-outline btn-sm" onclick="goTo('vendors');setTimeout(()=>{vSection='coop';renderVendors($('pg-content'));},50)">💰 Co-op Funds</button>` : ''}
        </div>
      </div>
    </td>
  </tr>`;
}
