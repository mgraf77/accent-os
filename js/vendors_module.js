// ── VENDORS MODULE (extracted from index.html at v6.11.1) ──

// ── VENDORS PAGE ──────────────────────────────────────────
function vendors(el,act){
  const canImportScores = CU && ['Owner','Admin','Manager'].includes(CU.role);
  act.innerHTML=`
    <button class="btn btn-outline btn-sm" onclick="exportCSV()">⬇ Export CSV</button>
    ${canImportScores ? '<button class="btn btn-outline btn-sm" onclick="openVendorScoreCsvPaste()" title="Bulk import scores via CSV (one row per vendor, score columns)">⬆ Import Scores</button>' : ''}
    <button class="btn btn-accent btn-sm" onclick="openAddVendor()">+ Add Vendor</button>`;
  renderVendors(el);
}

function renderVendors(container){
  const reps=[...new Set(VD.map(v=>v.rep).filter(Boolean))].sort();

  // Navigation tabs
  const tabs = [
    {id:'overview',label:'Overview'},
    {id:'scores',label:'Scores'},
    {id:'replist',label:'Rep List'},
    {id:'repview',label:'Rep View'},
    {id:'inventory',label:'Inventory'},
    {id:'history',label:'History'},
    {id:'sales',label:'Sales'},
    {id:'weights',label:'Weights'},
    {id:'changelog',label:'Changelog'},
    {id:'repaudit',label:'Rep Audit'},
    {id:'coop',label:'Co-op Funds'},
    {id:'optimizer',label:'Deal Optimizer'},
    {id:'pricebook',label:'Price Book'},
    {id:'invanalytics',label:'Inventory Analytics'},
    {id:'bulkops',label:'Bulk Ops'}
  ];

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);overflow-x:auto;">
        ${tabs.map(tab => `
          <div class="tab ${vSection === tab.id ? 'active' : ''}"
               onclick="vSection='${tab.id}';renderVendors($('pg-content'))"
               style="padding:12px 20px;cursor:pointer;font-size:13px;font-weight:600;
                      border-bottom:2px solid ${vSection === tab.id ? 'var(--accent)' : 'transparent'};
                      color:${vSection === tab.id ? 'var(--accent)' : 'var(--text-2)'};
                      transition:all 0.2s;white-space:nowrap;">
            ${tab.label}
          </div>
        `).join('')}
      </div>
    </div>
    <div id="vendor-section-content"></div>
  `;

  const sectionContent = $('vendor-section-content');

  if (vSection === 'overview') {
    renderOverview(sectionContent);
  } else if (vSection === 'scores') {
    renderScores(sectionContent);
  } else if (vSection === 'replist') {
    renderRepList(sectionContent);
  } else if (vSection === 'repview') {
    renderRepView(sectionContent);
  } else if (vSection === 'inventory') {
    renderInventory(sectionContent);
  } else if (vSection === 'history') {
    renderHistory(sectionContent);
  } else if (vSection === 'sales') {
    renderSales(sectionContent);
  } else if (vSection === 'weights') {
    renderWeights(sectionContent);
  } else if (vSection === 'changelog') {
    renderChangelog(sectionContent);
  } else if (vSection === 'repaudit') {
    renderRepGroupAudit(sectionContent);
  } else if (vSection === 'coop') {
    renderCoopTracker(sectionContent);
  } else if (vSection === 'optimizer') {
    renderDealOptimizer(sectionContent);
  } else if (vSection === 'pricebook') {
    renderPriceBook(sectionContent);
  } else if (vSection === 'invanalytics') {
    renderInventoryAnalytics(sectionContent);
  } else if (vSection === 'bulkops') {
    renderBulkVendorOps(sectionContent);
  }
}

// ── v6.9 PARENT GROUPING HELPERS ───────────────────────────
// Render one vendor row (used by both flat and grouped views).
function buildScoresRow(v, allScores, opts={}){
  const ws = weightedScore(v);
  const adaptiveTier = ws !== null ? getAdaptiveTier(ws, allScores) : null;
  const sc = scoredCount(v.scores);
  const indent = opts.indent ? 'padding-left:24px;' : '';
  return `<tr>
    <td style="font-weight:600;cursor:pointer;color:var(--accent);${indent}" onclick="openVendorDetail(${v.id})">${esc(v.name)}</td>
    <td>${tierBadge(adaptiveTier)}</td>
    <td>${ws!==null?`<span class="mono fw6" style="color:${scoreColor(ws)};">${ws}</span>`:`<span class="na">TBD</span>`}</td>
    <td><span class="mono sm">${sc}/${CAT_DEFS.length}</span></td>
    <td>${(()=>{const t=totalRawScore(v.scores);return t?`<span class="mono" style="font-size:11px;color:var(--text-2);">${t.sum}<span style="color:var(--text-3)">/${t.max}</span></span>`:'<span class="na">—</span>'})()}</td>
    <td onclick="openCategoryEditor(${v.id},'${esc(v.name).replace(/'/g,"\\'")}',()=>renderVendors($('pg-content')))" style="cursor:pointer;" title="Click to edit categories">${renderCatChips(v.id,3)}</td>
    ${CAT_DEFS.filter(c => c.key !== 'repScore').map(c=>{
      const s=v.scores[c.key];
      if(s===null||s===undefined)return`<td><span class="na">—</span></td>`;
      if(s==='na')return`<td><span class="na">N/A</span></td>`;
      return`<td onclick="openScoreDetail(${v.id},'${c.key}')" style="cursor:pointer;padding:2px;"><div style="background:${heatColor(s)};color:${heatTextColor(s)};border-radius:4px;padding:6px 0;text-align:center;font-family:'DM Mono',monospace;font-weight:700;font-size:13px;line-height:1;">${s}</div></td>`;
    }).join('')}
    <td><button class="btn btn-sm btn-outline" onclick="openVendorScoreEntry(${v.id})">Edit</button></td>
  </tr>`;
}

// Track which parent groups are collapsed in the Scores tab. Persists across re-renders.
let collapsedParents = new Set();
function toggleParentGroup(pid){
  if(collapsedParents.has(pid)) collapsedParents.delete(pid);
  else collapsedParents.add(pid);
  renderVendors($('pg-content'));
}
function expandAllParents(){ collapsedParents.clear(); renderVendors($('pg-content')); }
function collapseAllParents(){
  if(typeof PARENT_BY_ID!=='undefined') Object.keys(PARENT_BY_ID).forEach(pid => collapsedParents.add(pid));
  renderVendors($('pg-content'));
}

// Render a parent group header row with rolled-up sales + average weighted score.
function buildScoresParentHeader(parent, children, allScores){
  const totalSales = children.reduce((sum, v) => sum + ((v.sales && v.sales.t) || 0), 0);
  const childScores = children.map(v => weightedScore(v)).filter(s => s !== null);
  const avgScore = childScores.length ? (childScores.reduce((a,b)=>a+b,0)/childScores.length).toFixed(1) : null;
  const colspan = 6 + CAT_DEFS.filter(c => c.key !== 'repScore').length + 1;
  const salesFmt = totalSales >= 1000000 ? `$${(totalSales/1000000).toFixed(2)}M` : totalSales >= 1000 ? `$${(totalSales/1000).toFixed(0)}K` : `$${totalSales.toFixed(0)}`;
  const collapsed = collapsedParents.has(parent.id);
  return `<tr style="background:linear-gradient(90deg,var(--surface2),var(--surface));border-top:2px solid var(--accent);cursor:pointer;" onclick="toggleParentGroup('${parent.id}')" title="${collapsed?'Click to expand':'Click to collapse'}">
    <td colspan="${colspan}" style="padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--text-3);width:14px;display:inline-block;">${collapsed?'▶':'▼'}</span>
        <span style="font-size:13px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.06em;">🏢 ${esc(parent.name)}</span>
        <span style="font-size:11px;color:var(--text-3);">${children.length} brand${children.length===1?'':'s'}</span>
        <span style="font-size:11px;color:var(--text-2);">Combined sales: <span class="mono fw6">${salesFmt}</span></span>
        ${avgScore ? `<span style="font-size:11px;color:var(--text-2);">Avg score: <span class="mono fw6" style="color:${scoreColor(parseFloat(avgScore))}">${avgScore}</span></span>` : ''}
      </div>
    </td>
  </tr>`;
}

function renderScores(container) {
  // Get all vendors with scores for adaptive tier calculation
  const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);

  let filtered = VD.filter(v => {
    const q = vFilter.toLowerCase();
    const ws = weightedScore(v);
    const adaptiveTier = ws !== null ? getAdaptiveTier(ws, allScores) : null;
    const vcats = getVPCats(v.id);
    const catMatch = !vCatFilter || [...vcats].some(k => k.startsWith(vCatFilter));
    return (!q || v.name.toLowerCase().includes(q) || (v.cat || '').toLowerCase().includes(q))
      && (vTier === 'All' || (vTier === 'TBD' ? adaptiveTier === null : adaptiveTier === vTier))
      && (!vScoredOnly || scoredCount(v.scores) > 0)
      && catMatch
      && passesAdvancedFilters(v, allScores);
  });

  // Default alphabetical sort by name
  if (!vSortCol) vSortCol = 'name';
  if (vSortDir === undefined) vSortDir = 1; // 1 = asc, -1 = desc

  filtered.sort((a, b) => {
    let aVal, bVal;
    if (vSortCol === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (vSortCol === 'tier') {
      aVal = getAdaptiveTier(weightedScore(a), allScores) || 'ZZZ';
      bVal = getAdaptiveTier(weightedScore(b), allScores) || 'ZZZ';
    } else if (vSortCol === 'score') {
      aVal = weightedScore(a) || -999;
      bVal = weightedScore(b) || -999;
    } else if (vSortCol === 'cats') {
      aVal = scoredCount(a.scores);
      bVal = scoredCount(b.scores);
    } else if (vSortCol === 'total') {
      const ta = totalRawScore(a.scores); const tb = totalRawScore(b.scores);
      aVal = ta ? ta.sum : -999; bVal = tb ? tb.sum : -999;
    } else if (vSortCol === 'cats_filter') {
      aVal = getVPCats(a.id).size; bVal = getVPCats(b.id).size;
    } else {
      // Sorting by specific category
      const cat = CAT_DEFS.find(c => c.key === vSortCol);
      if (cat) {
        aVal = a.scores[cat.key] === 'na' ? -1 : (a.scores[cat.key] || -999);
        bVal = b.scores[cat.key] === 'na' ? -1 : (b.scores[cat.key] || -999);
      } else {
        aVal = 0;
        bVal = 0;
      }
    }

    if (typeof aVal === 'string') {
      return vSortDir * aVal.localeCompare(bVal);
    }
    return vSortDir * (aVal - bVal);
  });

  const totalScored = VD.filter(v => scoredCount(v.scores) >= 5).length;
  const withScores = VD.filter(v => scoredCount(v.scores) > 0).length;

  container.innerHTML = `
  <div class="g4 mb16">
    <div class="card stat-card"><div class="stat-label">Total Vendors</div><div class="stat-value">${VD.length}</div><div class="stat-sub">All active lines</div></div>
    <div class="card stat-card"><div class="stat-label">Vendors Scored</div><div class="stat-value">${withScores}</div><div class="stat-sub">${(withScores/VD.length*100).toFixed(0)}% have scores</div></div>
    <div class="card stat-card"><div class="stat-label">Fully Ranked (5+)</div><div class="stat-value">${totalScored}</div><div class="stat-sub">Eligible for tier</div></div>
    <div class="card stat-card"><div class="stat-label">Avg Score</div><div class="stat-value">${(()=>{const s=VD.map(v=>weightedScore(v)).filter(x=>x!==null);return s.length?(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1):'—';})()}</div><div class="stat-sub">Ranked vendors</div></div>
  </div>

  <div class="card">
    <div class="card-hd" style="padding-bottom:14px;flex-wrap:wrap;gap:10px;">
      <span class="card-title">Vendor Rankings</span>
      <button class="btn btn-sm btn-outline" onclick="openScoringMatrix()">📊 Scoring Matrix</button>
      <button class="btn btn-sm btn-outline" onclick="openScoringSystem()">📋 Scoring System</button>
      <button class="btn btn-sm btn-outline" onclick="openWeightScenarios()">⚖️ Weight Scenarios</button>
      <button class="btn btn-sm btn-outline" onclick="openFilterModal()" style="position:relative;">🔍 Filter${(()=>{const n=activeFilterCount();return n?` <span style="display:inline-block;background:var(--accent);color:white;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;margin-left:4px;">${n}</span>`:'';})()}</button>
      ${activeFilterCount()>0?`<button class="btn btn-sm btn-outline" onclick="resetAdvancedFilters();renderVendors($('pg-content'))" title="Clear all filters">✕ Clear</button>`:''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input id="vendor-search-input" class="srch" placeholder="Search vendors..." value="${esc(vFilter)}"
          oninput="vFilter=this.value;renderVendors($('pg-content'));const el=$('vendor-search-input');if(el){el.focus();const v=el.value;el.setSelectionRange(v.length,v.length);}"
        ><button style="background:none;border:none;cursor:pointer;padding:0 6px;font-size:14px;color:var(--text-3);line-height:1;" title="Clear search" onclick="vFilter='';renderVendors($('pg-content'))" ${!`${esc(vFilter)}`?'style="visibility:hidden;"':''}>&times;</button>
        <select class="srch" style="min-width:160px;" onchange="vCatFilter=this.value;renderVendors($('pg-content'))">
          <option value="" ${!vCatFilter?'selected':''}>All Categories</option>
          ${Object.keys(PRODUCT_TAXONOMY).map(cat=>`<option value="${cat}" ${vCatFilter===cat?'selected':''}>${cat}</option>`).join('')}
        </select>
        <div style="display:flex;gap:5px;">
          ${['All','A','B','C','D','F','TBD'].map(t=>`<div class="pill ${vTier===t?'on':''}" onclick="vTier='${t}';renderVendors($('pg-content'))">${t}</div>`).join('')}
        </div>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--text-2);">
          <input type="checkbox" ${vScoredOnly?'checked':''} onchange="vScoredOnly=this.checked;renderVendors($('pg-content'))"> Scored only
        </label>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--text-2);" title="Group vendors by corporate parent / umbrella brand">
          <input type="checkbox" ${vGroupByParent?'checked':''} onchange="vGroupByParent=this.checked;renderVendors($('pg-content'))"> Group by parent
        </label>
        ${vGroupByParent ? `
          <button class="btn btn-outline btn-sm" style="font-size:11px;margin-left:8px;" onclick="expandAllParents()">Expand all</button>
          <button class="btn btn-outline btn-sm" style="font-size:11px;" onclick="collapseAllParents()">Collapse all</button>
        ` : ''}
        <label style="display:none;">
        </label>
      </div>
    </div>
    <div class="tbl-wrap" style="max-height:calc(100vh - 380px);overflow-y:auto;">
      <table>
        <thead><tr>
          <th onclick="sortScores('name')" style="cursor:pointer;" title="Vendor name. Click to view full profile.">Vendor ${vSortCol==='name'?(vSortDir===1?'▲':'▼'):''}</th>
          <th onclick="sortScores('tier')" style="cursor:pointer;" title="Adaptive tier: top 20%=A, next 20%=B, etc. Based on weighted score across all scored vendors.">Tier ${vSortCol==='tier'?(vSortDir===1?'▲':'▼'):''}</th>
          <th onclick="sortScores('score')" style="cursor:pointer;" title="Weighted average score (0-10). Only computed when ≥20 weight points are scored.">Score ${vSortCol==='score'?(vSortDir===1?'▲':'▼'):''}</th>
          <th onclick="sortScores('cats')" style="cursor:pointer;" title="Number of scoring categories filled in (out of 14).">Cats ${vSortCol==='cats'?(vSortDir===1?'▲':'▼'):''}</th>
          <th onclick="sortScores('total')" style="cursor:pointer;min-width:70px;" title="Raw total score / max possible">Total ${vSortCol==='total'?(vSortDir===1?'▲':'▼'):''}</th>
          <th onclick="sortScores('cats_filter')" style="cursor:pointer;min-width:80px;" title="Product categories assigned">Prod Cat ${vSortCol==='cats_filter'?(vSortDir===1?'▲':'▼'):''}</th>
          ${CAT_DEFS.filter(c => c.key !== 'repScore').map(c=>`<th onclick="sortScores('${c.key}')" title="${esc(colSummary(c.key))}" style="min-width:52px;font-size:10px;cursor:pointer;">${c.label.split(' ')[0].substring(0,6)} ${vSortCol===c.key?(vSortDir===1?'▲':'▼'):''}</th>`).join('')}
          <th></th>
        </tr></thead>
        <tbody>
          ${(()=>{
            if(!vGroupByParent){
              const cap = filtered.slice(0, 200);
              return cap.map(v => buildScoresRow(v, allScores)).join('');
            }
            // Grouped mode: cap applied AFTER grouping so sibling sets aren't split
            const byParent = {};
            const independents = [];
            filtered.forEach(v => {
              const pid = (typeof VENDOR_PARENTS!=='undefined') ? VENDOR_PARENTS[v.id] : null;
              if(pid && PARENT_BY_ID[pid]){
                if(!byParent[pid]) byParent[pid] = [];
                byParent[pid].push(v);
              } else {
                independents.push(v);
              }
            });
            // Sort parent groups by total combined sales desc
            const parentIds = Object.keys(byParent).sort((a,b) => {
              const sa = byParent[a].reduce((s,v) => s + ((v.sales && v.sales.t) || 0), 0);
              const sb = byParent[b].reduce((s,v) => s + ((v.sales && v.sales.t) || 0), 0);
              return sb - sa;
            });
            let html = '';
            parentIds.forEach(pid => {
              const parent = PARENT_BY_ID[pid];
              const kids = byParent[pid];
              html += buildScoresParentHeader(parent, kids, allScores);
              if(!collapsedParents.has(pid)){
                html += kids.map(v => buildScoresRow(v, allScores, {indent:true})).join('');
              }
            });
            if(independents.length){
              const colspan = 6 + CAT_DEFS.filter(c => c.key !== 'repScore').length + 1;
              html += `<tr style="background:var(--surface2);"><td colspan="${colspan}" style="padding:8px 12px;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Independent Vendors (${independents.length})</td></tr>`;
              html += independents.map(v => buildScoresRow(v, allScores)).join('');
            }
            return html;
          })()}
        </tbody>
      </table>
    </div>
    <div class="card-foot" style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);">
      <span>Showing ${vGroupByParent ? filtered.length : Math.min(filtered.length,200)} of ${filtered.length} vendors${(!vGroupByParent && filtered.length>200)?' — use search to narrow':''}</span>
      <span>— = no data · Tiers are adaptive (20% buckets) · Score = weighted avg (${TOTAL_WEIGHT} pts)</span>
    </div>
  </div>`;
}

let vSortCol = 'name';
let vSortDir = 1;
function sortScores(col) {
  if (vSortCol === col) {
    vSortDir *= -1;
  } else {
    vSortCol = col;
    vSortDir = 1;
  }
  renderVendors($('pg-content'));
}

function openScoringMatrix() {
  openModal('Scoring Matrix — 14 Categories', `
    <div style="max-height:600px;overflow-y:auto;">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Weight</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${CAT_DEFS.map(c => `
            <tr>
              <td style="font-weight:600;">${c.label}</td>
              <td class="mono">${c.weight}</td>
              <td style="font-size:12px;color:var(--text-2);">${c.desc || 'Scoring criteria for vendor evaluation'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:16px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);font-size:13px;">
        <strong>Total Weight:</strong> ${TOTAL_WEIGHT} points<br>
        <strong>Scoring Range:</strong> 0-10 per category<br>
        <strong>Tiers:</strong> Adaptive 20% buckets (A = top 20%, B = next 20%, C/D/F follow)
      </div>
    </div>
  `);
}

function openScoringSystem() {
  const rubricData = {
    'Rebates (10)': {
      10: 'Rebates ≥6%',
      9: '5-5.9%',
      8: '4-4.9%',
      7: '3-3.9%',
      6: '2.5-2.9%',
      5: '2-2.4%',
      4: '1.5-1.9%',
      3: '1-1.4%',
      2: '<1%',
      1: 'Exists but useless',
      0: 'None'
    },
    'Discounts (8)': {
      10: 'Discounts ≥20%',
      9: '15-19%',
      8: '12-14%',
      7: '10-11%',
      6: '8-9%',
      5: '6-7%',
      4: '4-5%',
      3: '2-3%',
      2: '<2%',
      1: 'Rarely honored',
      0: 'None'
    },
    'Credit Terms (6)': {
      10: 'Net 120+',
      9: 'Net 90',
      8: 'Net 75',
      7: 'Net 60',
      6: 'Net 45',
      5: 'Net 30',
      4: 'Net 15',
      3: 'COD w/ occasional flex',
      2: 'COD only',
      1: 'Strict prepayment',
      0: 'No credit'
    },
    'Freight (8)': {
      10: 'Free freight <$500',
      9: 'Free $500-749',
      8: 'Free $750-999',
      7: 'Free $1000-1499',
      6: 'Free $1500-1999',
      5: 'Free $2000-2499',
      4: 'Free $2500-2999',
      3: 'Free $3000-3499',
      2: 'Free $3500-3999',
      1: 'Free $4000+',
      0: 'No free freight'
    },
    'Returns/RGA (7)': {
      10: 'Free returns, no restock fee, <7 days',
      9: 'No restock fee, <14 days',
      8: '≤10% restock fee, quick process',
      7: '≤15% restock fee, 2-3 weeks',
      6: '≤20% restock fee, slow',
      5: '≤25% restock fee',
      4: '25-30% restock fee',
      3: '>30% restock fee',
      2: 'Case-by-case approval',
      1: 'Rare approvals only',
      0: 'No returns accepted'
    },
    'IMAP/Markup (8)': {
      10: '2.5x or higher markup',
      9: '2.3-2.49x markup',
      8: '2.1-2.29x markup',
      7: '2.0-2.09x markup',
      6: '1.9-1.99x markup',
      5: '1.8-1.89x markup (avg)',
      4: '1.6-1.79x markup',
      3: '1.4-1.59x markup',
      2: '1.2-1.39x markup',
      1: '<1.2x markup',
      0: 'No IMAP / open pricing'
    },
    'Marketing Funds (7)': {
      10: '5 MDF + 3 assets + 1 access + 1 cobrand (max all)',
      9: '5 MDF + 3 assets + 1 of access/cobrand',
      8: '4 MDF + 3 assets',
      7: '3 MDF + 2-3 assets',
      6: '2 MDF + 2 assets + access',
      5: '1 MDF + 2 assets (avg)',
      4: '1 MDF + 1 asset',
      3: 'Token MDF + 1 asset',
      2: 'Assets only no MDF',
      1: 'Minimal asset library',
      0: 'Nothing — no MDF, no assets'
    },
    'Display (6)': {
      10: '4 discount + 2 promos + 4 buyback (1-for-1 all)',
      9: '4 discount + 2 promos + 3 buyback',
      8: '3-4 discount + 2 promos + 2-3 buyback',
      7: '3 discount + 1-2 promos + 2 buyback',
      6: '2-3 discount + 1 promos + 2 buyback',
      5: '2 discount + 1 promos + 1 buyback (avg)',
      4: '2 discount + 0-1 promos + 1 buyback',
      3: '1-2 discount + occasional promos + no buyback',
      2: '1 discount + no promos + no buyback',
      1: '<25% discount + no promos + no buyback',
      0: 'No display program'
    },
    'Lights Am. (5)': {
      10: 'On Lights America',
      9: '—',
      8: '—',
      7: '—',
      6: '—',
      5: '—',
      4: '—',
      3: '—',
      2: '—',
      1: '—',
      0: 'Not on Lights America'
    },
    'Web Listing (4)': {
      10: 'Featured/premier dealer (logo + top placement)',
      9: 'Prominent w/ map pin, link, full info',
      8: 'Listed with link + accurate contact info',
      7: 'Standard dealer locator listing',
      6: '—',
      5: 'Listed but stale or incomplete info',
      4: '—',
      3: 'No locator — directs to contact rep',
      2: '—',
      1: 'Authorized but not on locator',
      0: 'Not on vendor site at all'
    },
    'Rep Score (8)': {
      10: 'Proactive, full support',
      9: 'Excellent, solves issues fast',
      8: 'Good support overall',
      7: 'Reliable but not proactive',
      6: 'Adequate service',
      5: 'Average rep performance',
      4: 'Below average',
      3: 'Reactive only',
      2: 'Rarely helpful',
      1: 'Unreliable',
      0: 'No rep assigned'
    },
    'DTC (7)': {
      10: 'No DTC; refers to Accent specifically',
      9: 'No DTC; routes to lighting showrooms',
      8: 'Brand site, no checkout, dealer-only purchase',
      7: '—',
      6: '—',
      5: 'Sells via showrooms + ecom dealers (Lumens/YLighting), not own ecom (avg)',
      4: 'Showrooms + ecom dealers + light DTC',
      3: 'Sells through designers / trade-only',
      2: 'Active DTC + Amazon competing with dealers',
      1: 'Aggressive DTC; outranks dealers in Google',
      0: 'Sells DTC on own website'
    },
    'L1 Member (6)': {
      10: 'Lighting One member',
      9: '—',
      8: '—',
      7: '—',
      6: '—',
      5: '—',
      4: '—',
      3: '—',
      2: '—',
      1: '—',
      0: 'Not a Lighting One member'
    },
    'Demand (10)': {
      10: '100K+ monthly US searches (top 1%)',
      9: '50K-100K monthly searches',
      8: '20K-50K monthly searches',
      7: '10K-20K monthly searches',
      6: '5K-10K monthly searches',
      5: '1K-5K monthly searches (avg)',
      4: '500-1K monthly searches',
      3: '200-500 monthly searches',
      2: '50-200 monthly searches',
      1: '<50 monthly searches',
      0: 'No measurable signal'
    }
  };

  const financialTerms = ['Rebates (10)', 'Discounts (8)', 'Credit Terms (6)', 'Freight (8)', 'Returns/RGA (7)', 'IMAP/Markup (8)'];
  const salesMarketing = ['Marketing Funds (7)', 'Display (6)', 'Lights Am. (5)', 'Web Listing (4)', 'Rep Score (8)', 'DTC (7)', 'L1 Member (6)', 'Demand (10)'];

  const getCurrentWeights = () => {
    return CAT_DEFS.map(c => ({ label: c.label, weight: c.weight, key: c.key }));
  };

  const currentWeights = getCurrentWeights();

  openModal('Scoring System — Category Weights & 0–10 Rubric', `
    <div style="max-height:70vh;overflow-y:auto;">
      <!-- Compact category groups -->
      <div class="g2 mb16" style="margin-bottom:14px;gap:12px;">
        <div>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;color:var(--text-3);">Financial Terms</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            ${financialTerms.map(cat => {
              const weight = currentWeights.find(w => w.label === cat)?.weight || 0;
              const pct = ((weight / TOTAL_WEIGHT) * 100).toFixed(1);
              const lbl = cat.replace(/\s*\([^)]*\)\s*$/,'').trim();
              return `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--surface2);border-radius:4px;font-size:11px;">
                <span style="font-weight:600;">${lbl}</span>
                <span class="mono" style="font-weight:700;color:var(--accent);">${pct}%</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;color:var(--text-3);">Sales, Marketing & Market Position</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            ${salesMarketing.map(cat => {
              const weight = currentWeights.find(w => w.label === cat)?.weight || 0;
              const pct = ((weight / TOTAL_WEIGHT) * 100).toFixed(1);
              const lbl = cat.replace(/\s*\([^)]*\)\s*$/,'').trim();
              return `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:var(--surface2);border-radius:4px;font-size:11px;">
                <span style="font-weight:600;">${lbl}</span>
                <span class="mono" style="font-weight:700;color:var(--blue);">${pct}%</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Rubric Table (smaller) -->
      <h3 style="font-size:13px;font-weight:700;margin-bottom:8px;margin-top:16px;">0–10 Scoring Rubric</h3>
      <div style="overflow-x:auto;margin-bottom:8px;">
        <table style="width:100%;font-size:10px;">
          <thead>
            <tr style="background:var(--surface2);">
              <th style="padding:5px;text-align:center;position:sticky;left:0;background:var(--surface2);z-index:1;font-size:10px;">Score</th>
              ${Object.keys(rubricData).map(cat => `<th style="padding:5px;min-width:100px;font-size:10px;">${cat.replace(/\s*\([^)]*\)\s*$/,'')}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${[10,9,8,7,6,5,4,3,2,1,0].map(score => `
              <tr style="border-bottom:1px solid var(--border-light);">
                <td style="padding:5px;text-align:center;font-weight:700;background:${score >= 8 ? 'var(--green-bg)' : score >= 6 ? 'var(--yellow-bg)' : score >= 4 ? 'var(--surface2)' : 'var(--red-bg)'};position:sticky;left:0;z-index:1;font-size:11px;">${score}</td>
                ${Object.keys(rubricData).map(cat => `
                  <td style="padding:5px;font-size:9.5px;line-height:1.25;">${rubricData[cat][score]}</td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:11px;color:var(--text-3);margin-top:6px;">Weight scenarios moved to the <strong>Weights</strong> tab.</p>
    </div>
  `);
}

function updateScenarioSum(scenario) {
  const catCount = CAT_DEFS.length;
  let sum = 0;

  for (let i = 0; i < catCount; i++) {
    const input = document.getElementById('scenario-' + scenario + '-' + i);
    if (input) {
      sum += parseFloat(input.value) || 0;
    }
  }

  const sumEl = document.getElementById('scenario-' + scenario + '-sum');
  if (sumEl) {
    sumEl.textContent = sum.toFixed(1) + '%';
    sumEl.style.color = Math.abs(sum - 100) < 0.1 ? 'var(--green)' : 'var(--accent)';
    sumEl.style.fontWeight = '700';
  }
}



// ── WEIGHT SCENARIO BUILDER (own modal, separated from Scoring System) ──
function openWeightScenarios(){
  const currentWeights = CAT_DEFS.map(c => ({ label: c.label, weight: c.weight, key: c.key }));
  openModal('Weight Scenarios — Test Alternate Distributions', `
    <div style="font-size:12px;color:var(--text-3);margin-bottom:12px;">
      Test how alternate weight distributions would affect rankings without changing live scores.
      Each scenario must sum to 100%. Live weights total ${TOTAL_WEIGHT} pts.
    </div>
    <div style="max-height:65vh;overflow-y:auto;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);">
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;font-size:12px;">
        <div style="font-weight:700;padding:6px;">Category</div>
        <div style="font-weight:700;padding:6px;text-align:center;">Live</div>
        <div style="font-weight:700;padding:6px;text-align:center;">Scenario A</div>
        <div style="font-weight:700;padding:6px;text-align:center;">Scenario B</div>

        ${currentWeights.map((c,i)=>`
          <div style="padding:5px 8px;background:var(--surface);border-radius:4px;font-size:12px;">${c.label}</div>
          <div style="padding:5px 8px;text-align:center;background:var(--surface);border-radius:4px;font-family:'DM Mono',monospace;font-size:12px;">${((c.weight/TOTAL_WEIGHT)*100).toFixed(1)}%</div>
          <div style="padding:5px 8px;text-align:center;background:var(--surface);border-radius:4px;">
            <input type="number" id="scenario-a-${i}" step="0.1" min="0" max="100"
                   value="${((c.weight/TOTAL_WEIGHT)*100).toFixed(1)}"
                   oninput="updateScenarioSum('a')"
                   style="width:60px;padding:3px;text-align:center;border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;">
          </div>
          <div style="padding:5px 8px;text-align:center;background:var(--surface);border-radius:4px;">
            <input type="number" id="scenario-b-${i}" step="0.1" min="0" max="100"
                   value="${((c.weight/TOTAL_WEIGHT)*100).toFixed(1)}"
                   oninput="updateScenarioSum('b')"
                   style="width:60px;padding:3px;text-align:center;border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;">
          </div>
        `).join('')}

        <div style="padding:8px;font-weight:700;border-top:2px solid var(--border);margin-top:6px;">Total</div>
        <div style="padding:8px;text-align:center;font-weight:700;border-top:2px solid var(--border);margin-top:6px;font-family:'DM Mono',monospace;">100.0%</div>
        <div id="scenario-a-sum" style="padding:8px;text-align:center;font-weight:700;border-top:2px solid var(--border);margin-top:6px;font-family:'DM Mono',monospace;color:var(--green);">100.0%</div>
        <div id="scenario-b-sum" style="padding:8px;text-align:center;font-weight:700;border-top:2px solid var(--border);margin-top:6px;font-family:'DM Mono',monospace;color:var(--green);">100.0%</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text-3);margin-top:10px;line-height:1.5;">
      <strong>Note:</strong> Scenarios are exploratory only — they do not change live vendor scores.
      Future enhancement: apply a scenario to re-rank all vendors in a side-by-side preview.
    </div>
  `);
}

function openScoreDetail(vendorId, categoryKey) {
  const v = VD.find(x => x.id === vendorId);
  if (!v) return;

  const cat = CAT_DEFS.find(c => c.key === categoryKey);
  if (!cat) return;

  const score = v.scores[categoryKey];
  const meta = v._meta?.[categoryKey] || {};

  openModal(`${cat.label} — ${v.name}`, `
    <div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="font-size:32px;font-weight:700;color:${scoreColor(score)};">${score === 'na' ? 'N/A' : (score || '—')}</div>
        <div>
          <div style="font-size:14px;color:var(--text-3);">Weight: ${cat.weight} points</div>
        </div>
      </div>

      ${meta.j ? `
        <div style="padding:12px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px;">Justification</div>
          <div style="font-size:13px;line-height:1.6;">${esc(meta.j)}</div>
        </div>
      ` : ''}

      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Change History</div>
      <div style="font-size:12px;color:var(--text-2);">No changes recorded</div>
    </div>
  `);
}

// ── SCORING RUBRIC (numeric-aware) ─────────────────────
// For categories with numeric inputs (rebate %, freight $ free threshold, etc.)
// returns a 0-10 score from a raw value. Used by Edit Scores modal to suggest
// a score from raw data the rep provides.
const RUBRIC_NUMERIC = {
  rebates: { unit:'%', dir:'higher_better',
    tiers:[[6,10],[5,9],[4,8],[3,7],[2.5,6],[2,5],[1.5,4],[1,3],[0.5,2],[0.0001,1],[0,0]] },
  discounts: { unit:'%', dir:'higher_better',
    tiers:[[20,10],[15,9],[12,8],[10,7],[8,6],[6,5],[4,4],[2,3],[0.5,2],[0.0001,1],[0,0]] },
  credit: { unit:'days_net', dir:'higher_better',
    tiers:[[120,10],[90,9],[75,8],[60,7],[45,6],[30,5],[15,4],[1,3],[0,0]] },
  freight: { unit:'$_free_threshold_lower_better',
    tiers:[[0,10],[500,9],[750,8],[1000,7],[1500,6],[2000,5],[2500,4],[3000,3],[3500,2],[4000,1],[Infinity,0]] },
  imap: { unit:'markup_multiplier', dir:'higher_better',
    tiers:[[2.5,10],[2.3,9],[2.1,8],[2.0,7],[1.9,6],[1.8,5],[1.6,4],[1.4,3],[1.2,2],[0.0001,1],[0,0]] },
  demand: { unit:'monthly_searches', dir:'higher_better',
    tiers:[[100000,10],[50000,9],[20000,8],[10000,7],[5000,6],[1000,5],[500,4],[200,3],[50,2],[1,1],[0,0]] },
};

const RUBRIC_COMPONENTS = {
  mktgFunds: {
    label: 'Marketing Funds Components',
    fields: [
      {key:'mdfPct', label:'MDF / Co-op %', type:'number', min:0, max:10, step:0.1, suffix:'%', tip:'Annual MDF or co-op percentage of purchases'},
      {key:'assetQuality', label:'Asset Quality', type:'select', options:[
        {v:'none', l:'None — no assets provided'},
        {v:'minimal', l:'Minimal — basic logos only'},
        {v:'standard', l:'Standard — logos + product images'},
        {v:'rich', l:'Rich — full kit (images, copy, video)'},
        {v:'pro', l:'Pro — turnkey campaigns + designer support'}
      ]},
      {key:'portal', label:'Marketing Portal', type:'bool', tip:'Self-serve portal for assets and claims'},
      {key:'cobrand', label:'Co-branded Materials', type:'bool', tip:'Vendor produces materials with dealer name/logo'}
    ],
    score: (v) => {
      const mdf = parseFloat(v.mdfPct) || 0;
      const aq = {none:0, minimal:1, standard:2, rich:3, pro:4}[v.assetQuality] || 0;
      const portal = v.portal ? 1 : 0;
      const cobrand = v.cobrand ? 1 : 0;
      // MDF: 0=0pts, 0.5%=1, 1%=2, 1.5%=3, 2%=4, 3%+=5 (cap 5)
      let mdfPts = 0;
      if(mdf >= 3) mdfPts = 5;
      else if(mdf >= 2) mdfPts = 4;
      else if(mdf >= 1.5) mdfPts = 3;
      else if(mdf >= 1) mdfPts = 2;
      else if(mdf >= 0.5) mdfPts = 1;
      const total = mdfPts + aq + portal + cobrand; // max 5+4+1+1 = 11
      return Math.min(10, Math.round(total));
    }
  },
  display: {
    label: 'Display Program Components',
    fields: [
      {key:'discountPct', label:'Display Discount %', type:'number', min:0, max:100, step:1, suffix:'%', tip:'Discount off net on display product'},
      {key:'promoCadence', label:'Promo Cadence', type:'select', options:[
        {v:'none', l:'None — no promos'},
        {v:'rare', l:'Rare — once a year or less'},
        {v:'occasional', l:'Occasional — 2-3 times/year'},
        {v:'regular', l:'Regular — quarterly'},
        {v:'frequent', l:'Frequent — monthly+'}
      ]},
      {key:'buyback', label:'Display Buyback / Refresh', type:'select', options:[
        {v:'none', l:'None — dealer keeps stale displays'},
        {v:'limited', l:'Limited — case by case'},
        {v:'standard', l:'Standard — annual swap allowed'},
        {v:'generous', l:'Generous — funded refresh program'}
      ]}
    ],
    score: (v) => {
      const disc = parseFloat(v.discountPct) || 0;
      // Discount: 0=0pts, 25%=2, 35%=3, 50%=5, 60%+=6
      let discPts = 0;
      if(disc >= 60) discPts = 6;
      else if(disc >= 50) discPts = 5;
      else if(disc >= 35) discPts = 3;
      else if(disc >= 25) discPts = 2;
      else if(disc >= 10) discPts = 1;
      const cad = {none:0, rare:0, occasional:1, regular:2, frequent:2}[v.promoCadence] || 0;
      const bb = {none:0, limited:1, standard:2, generous:2}[v.buyback] || 0;
      const total = discPts + cad + bb; // max 6+2+2 = 10
      return Math.min(10, Math.round(total));
    }
  }
};

// Plain-text rubric (for categories that don't fit a clean numeric scale).
// Used to display rubric in Edit Scores modal so user can pick informed score.
const RUBRIC_TEXT = {
  returns: ['Free <7d','No restock <14d','≤10% restock','≤15% restock 2-3wk','≤20% slow','≤25%','25-30%','>30%','Case-by-case','Rare only','None'],
  mktgFunds: ['Max all (5+3+1+1)','Strong (5+3+1)','4 MDF + 3 assets','3 MDF + 2-3 assets','2 MDF + 2 assets + access','1 MDF + 2 assets','1 MDF + 1 asset','Token MDF + 1 asset','Assets only','Minimal','Nothing'],
  display: ['Max (4+2+4)','4 disc + 2 promo + 3 buyback','3-4 disc + 2 promo + 2-3 buyback','3 disc + 1-2 promo + 2 buyback','2-3 disc + 1 promo + 2 buyback','2+1+1','2 disc + 0-1 promo + 1 buyback','1-2 disc + occ promo + no buyback','1 disc + no promo + no buyback','<25% + no promo','No program'],
  lightsAm: ['On Lights America','—','—','—','—','—','—','—','—','—','Not on Lights America'],
  webListing: ['Featured/premier','Prominent w/ pin+link','Listed w/ link','Standard locator','—','Stale/incomplete','—','No locator (rep contact)','—','Authorized not listed','Not on site'],
  repScore: ['Rep is best in class','Excellent','Very good','Good','Above avg','Average','Below avg','Weak','Rare touch','Almost absent','No rep'],
  dtc: ['No DTC; refers to Accent','No DTC; lighting showrooms','No checkout','—','—','Showrooms+ecom dealers','+ light DTC','Trade/designers only','Active DTC+Amazon','Aggressive DTC','Sells DTC own site'],
  l1Member: ['L1 member','—','—','—','—','—','—','—','—','—','Not L1 member'],
};

// Recompute and display the component-based score for mktgFunds / display.
function recomputeComponentScore(catKey){
  const cfg = RUBRIC_COMPONENTS[catKey];
  if(!cfg) return;
  const vals = {};
  cfg.fields.forEach(f => {
    const el = document.getElementById(`se-comp-${catKey}-${f.key}`);
    if(!el) return;
    if(f.type === 'bool') vals[f.key] = el.checked;
    else vals[f.key] = el.value;
  });
  const score = cfg.score(vals);
  const out = document.getElementById(`se-comp-result-${catKey}`);
  if(out) out.textContent = score;
  return {vals, score};
}

// Toggle score input enable/disable when verification radio changes.
function onScoreStateChange(radio, catKey){
  const sc = document.getElementById('se-score-'+catKey);
  if(!sc) return;
  if(radio.value === 'na'){ sc.value=''; sc.disabled=true; }
  else { sc.disabled=false; }
}

// Apply the computed component score to the main score input.
function applyComponentScore(catKey){
  const r = recomputeComponentScore(catKey);
  if(!r) return;
  const scInp = document.getElementById('se-score-'+catKey);
  if(scInp){ scInp.value = r.score; scInp.disabled = false; }
  // If currently N/A, flip to Unverified so the score is included.
  const naRadio = document.querySelector(`input[name="se-state-${catKey}"][value="na"]`);
  if(naRadio && naRadio.checked){
    const unv = document.querySelector(`input[name="se-state-${catKey}"][value="unverified"]`);
    if(unv) unv.checked = true;
  }
}

// Suggest a 0-10 score from a numeric raw value based on RUBRIC_NUMERIC tiers.
function suggestScore(catKey, rawVal){
  const r = RUBRIC_NUMERIC[catKey];
  if(!r || rawVal===null || rawVal===undefined || rawVal==='') return null;
  const v = parseFloat(rawVal);
  if(isNaN(v)) return null;
  if(r.unit==='$_free_threshold_lower_better'){
    // lower threshold = better (free freight at lower $ minimum)
    for(const [th,sc] of r.tiers){ if(v<=th) return sc; }
    return 0;
  }
  // higher_better: walk thresholds high->low
  for(const [th,sc] of r.tiers){ if(v>=th) return sc; }
  return 0;
}

// Edit Scores modal — manual entry of vendor data, with auto-suggested scores.
function openVendorScoreEntry(vendorId){
  const v = VD.find(x=>x.id===vendorId);
  if(!v) return;
  const meta = v._meta || {};

  // Build per-category row.
  const rows = CAT_DEFS.map(c=>{
    const sc = v.scores[c.key];
    const rawHint = meta[c.key]?.j || '';  // existing justification (treated as raw notes)
    const isNumeric = !!RUBRIC_NUMERIC[c.key];
    const txtTiers = RUBRIC_TEXT[c.key];
    const unitLabel = isNumeric ? (RUBRIC_NUMERIC[c.key].unit==='%' ? '%' :
                                    RUBRIC_NUMERIC[c.key].unit==='days_net' ? 'days (Net)' :
                                    RUBRIC_NUMERIC[c.key].unit.includes('threshold') ? '$ free freight threshold' :
                                    RUBRIC_NUMERIC[c.key].unit.includes('coverage') ? '% showroom coverage' :
                                    RUBRIC_NUMERIC[c.key].unit==='markup_multiplier' ? 'markup multiplier (e.g. 2.0)' :
                                    RUBRIC_NUMERIC[c.key].unit==='monthly_searches' ? 'avg monthly US searches' : '') : '';
    return `
      <div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--surface);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
          <div style="flex:1;min-width:140px;">
            <div style="font-weight:700;font-size:13px;">${c.label} <span style="font-size:11px;color:var(--text-3);font-weight:400;">(weight ${c.weight})</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label style="font-size:11px;color:var(--text-3);">Score</label>
            <input id="se-score-${c.key}" type="number" min="0" max="10" step="0.5"
                   value="${sc==='na'?'':(typeof sc==='number'?sc:'')}"
                   ${getDataState(v, c.key)==='na'?'disabled':''}
                   style="width:60px;padding:5px 6px;border:1px solid var(--border);border-radius:5px;text-align:center;font-family:'DM Mono',monospace;">
            ${(()=>{
              const ds = getDataState(v, c.key);
              const onChange = `onScoreStateChange(this,'${c.key}')`;
              return `
                <label style="font-size:11px;color:var(--text-3);"><input type="radio" name="se-state-${c.key}" value="verified" ${ds==='verified'?'checked':''} onchange="${onChange}"> Verified</label>
                <label style="font-size:11px;color:var(--text-3);"><input type="radio" name="se-state-${c.key}" value="unverified" ${ds==='unverified'?'checked':''} onchange="${onChange}"> Unverified</label>
                <label style="font-size:11px;color:var(--text-3);"><input type="radio" name="se-state-${c.key}" value="na" ${ds==='na'?'checked':''} onchange="${onChange}"> N/A</label>
              `;
            })()}
            <input id="se-na-${c.key}" type="hidden" value="${sc==='na'?'1':''}">
          </div>
        </div>
        ${RUBRIC_COMPONENTS[c.key] ? (()=>{
          const cfg = RUBRIC_COMPONENTS[c.key];
          const existing = (v._meta?.[c.key]?.components) || {};
          const fieldsHtml = cfg.fields.map(f => {
            const cur = existing[f.key];
            const fid = `se-comp-${c.key}-${f.key}`;
            if(f.type === 'number'){
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <label style="font-size:11px;color:var(--text-2);min-width:140px;">${f.label}</label>
                <input id="${fid}" type="number" min="${f.min}" max="${f.max}" step="${f.step}" value="${cur!=null?cur:''}"
                       oninput="recomputeComponentScore('${c.key}')"
                       style="width:80px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;text-align:right;">
                ${f.suffix ? `<span style="font-size:11px;color:var(--text-3);">${f.suffix}</span>` : ''}
                <span style="font-size:10px;color:var(--text-3);font-style:italic;flex:1;">${f.tip||''}</span>
              </div>`;
            } else if(f.type === 'select'){
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <label style="font-size:11px;color:var(--text-2);min-width:140px;">${f.label}</label>
                <select id="${fid}" onchange="recomputeComponentScore('${c.key}')"
                        style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px;">
                  <option value="">— select —</option>
                  ${f.options.map(o => `<option value="${o.v}" ${cur===o.v?'selected':''}>${o.l}</option>`).join('')}
                </select>
              </div>`;
            } else if(f.type === 'bool'){
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <label style="font-size:11px;color:var(--text-2);min-width:140px;">${f.label}</label>
                <label style="font-size:11px;color:var(--text-2);"><input id="${fid}" type="checkbox" ${cur?'checked':''} onchange="recomputeComponentScore('${c.key}')"> Yes</label>
                <span style="font-size:10px;color:var(--text-3);font-style:italic;flex:1;">${f.tip||''}</span>
              </div>`;
            }
            return '';
          }).join('');
          return `
          <div style="background:var(--surface2);padding:10px;border-radius:6px;margin-bottom:6px;">
            <div style="font-size:11px;color:var(--text-2);font-weight:600;margin-bottom:8px;">${cfg.label}</div>
            ${fieldsHtml}
            <div style="display:flex;align-items:center;gap:8px;padding-top:6px;border-top:1px solid var(--border);">
              <span style="font-size:11px;color:var(--text-3);">Computed score:</span>
              <span id="se-comp-result-${c.key}" style="font-family:'DM Mono',monospace;font-weight:700;font-size:14px;color:var(--green);">—</span>
              <button class="btn btn-sm btn-outline" onclick="applyComponentScore('${c.key}')" style="font-size:10px;margin-left:auto;">Apply to Score</button>
            </div>
          </div>
          `;
        })() : (isNumeric ? `
          <div style="display:flex;gap:8px;align-items:center;background:var(--surface2);padding:8px 10px;border-radius:6px;margin-bottom:6px;">
            <label style="font-size:11px;color:var(--text-2);min-width:95px;">Raw value:</label>
            <input id="se-raw-${c.key}" type="number" step="0.01" placeholder="${unitLabel}"
                   oninput="(()=>{const r=document.getElementById('se-raw-${c.key}').value; const s=suggestScore('${c.key}',r); const o=document.getElementById('se-suggest-${c.key}'); if(o){o.textContent= s===null?'—':s; o.style.color = s===null?'var(--text-3)':'var(--green)';} const btn=document.getElementById('se-apply-${c.key}'); if(btn) btn.disabled=(s===null);})()"
                   style="flex:1;padding:5px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px;">
            <span style="font-size:11px;color:var(--text-3);min-width:60px;">${unitLabel}</span>
            <span style="font-size:11px;color:var(--text-3);">→ Suggested:</span>
            <span id="se-suggest-${c.key}" style="font-family:'DM Mono',monospace;font-weight:700;font-size:13px;color:var(--text-3);min-width:24px;text-align:center;">—</span>
            <button id="se-apply-${c.key}" class="btn btn-sm btn-outline" disabled
                    onclick="(()=>{const s=document.getElementById('se-suggest-${c.key}').textContent; if(s!=='—'){document.getElementById('se-score-${c.key}').value=s; document.getElementById('se-score-${c.key}').disabled=false; const na=document.querySelector('input[name=&quot;se-state-${c.key}&quot;][value=&quot;na&quot;]'); if(na && na.checked){const unv=document.querySelector('input[name=&quot;se-state-${c.key}&quot;][value=&quot;unverified&quot;]'); if(unv) unv.checked=true;}}})()"
                    style="font-size:10px;">Apply</button>
          </div>
        ` : (txtTiers ? `
          <div style="font-size:11px;color:var(--text-3);background:var(--surface2);padding:6px 10px;border-radius:6px;margin-bottom:6px;">
            <strong style="color:var(--text-2);">Rubric:</strong> 10=${txtTiers[0]}; 8=${txtTiers[2]}; 5=${txtTiers[5]}; 0=${txtTiers[10]}
          </div>
        ` : ''))}
        <textarea id="se-just-${c.key}" rows="2" placeholder="Justification / source data (optional)"
                  style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-size:11px;font-family:inherit;resize:vertical;">${esc(rawHint)}</textarea>
      </div>
    `;
  }).join('');

  openModal(`Edit Scores — ${v.name}`, `
    <div style="font-size:12px;color:var(--text-3);margin-bottom:14px;">
      Enter raw data from the vendor (rebate %, free freight $, etc.) and AccentOS suggests a score from the rubric.
      Click <strong>Apply</strong> to use the suggested score, or override manually.
    </div>
    ${(()=>{
      if(typeof getSisterVendors!=='function') return '';
      const sisters = getSisterVendors(vendorId);
      const parent = (typeof getVendorParent==='function') ? getVendorParent(vendorId) : null;
      if(!sisters.length || !parent) return '';
      return `<div style="font-size:12px;background:var(--surface2);border-left:3px solid var(--accent);padding:8px 12px;border-radius:6px;margin-bottom:14px;">
        <strong style="color:var(--accent);">${esc(parent.name)}</strong> · ${sisters.length} sister brand${sisters.length===1?'':'s'}: ${sisters.map(s=>esc(s.name)).join(', ')}
      </div>`;
    })()}
    <div style="max-height:65vh;overflow-y:auto;padding-right:6px;">${rows}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid var(--border);flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      ${(()=>{
        if(typeof getSisterVendors!=='function') return '';
        const sisters = getSisterVendors(vendorId);
        if(!sisters.length) return '';
        return `<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-2);cursor:pointer;margin-right:auto;" title="Also apply these scores to all sister brands under the same parent"><input type="checkbox" id="sister-propagate-cb"> Apply to ${sisters.length} sister${sisters.length===1?'':'s'}</label>`;
      })()}
      <button class="btn btn-accent" onclick="saveVendorScoreEntry(${vendorId}, document.getElementById('sister-propagate-cb')?.checked||false)">Save All Scores</button>
    </div>
  `);
}

function saveVendorScoreEntry(vendorId, propagateToSisters){
  const v = VD.find(x=>x.id===vendorId);
  if(!v) return;
  v._meta = v._meta || {};
  let changed=0;
  // Capture the new values so we can propagate them to sisters if requested
  const newValues = {};
  const newJustifications = {};
  const newDataStates = {};
  const verifiedBy = (typeof CU!=='undefined' && CU?.name) || 'Unknown';
  const verifiedAtIso = new Date().toISOString();
  CAT_DEFS.forEach(c=>{
    const stateRadio = document.querySelector(`input[name="se-state-${c.key}"]:checked`);
    const dataState = stateRadio ? stateRadio.value : 'unverified';
    const scInp = document.getElementById('se-score-'+c.key);
    const justInp = document.getElementById('se-just-'+c.key);
    let newVal;
    if(dataState === 'na') newVal='na';
    else if(scInp && scInp.value!=='') newVal = parseFloat(scInp.value);
    else newVal = null;
    newValues[c.key] = newVal;
    newDataStates[c.key] = dataState;
    const old = v.scores[c.key];
    if(old !== newVal && !(old===null && newVal===null)){
      logChange(v.name, c.label, old===null?'—':old, newVal===null?'—':newVal);
      v.scores[c.key] = newVal;
      changed++;
    }
    // Persist data_state + verification metadata on the vendor's _meta entry.
    const prev = v._meta[c.key] || {};
    const updates = {data_state: dataState};
    if(dataState === 'verified' && prev.data_state !== 'verified'){
      updates.verified_at = verifiedAtIso;
      updates.verified_by = verifiedBy;
    }
    v._meta[c.key] = Object.assign({}, prev, updates);
    if(justInp){
      const j = justInp.value.trim();
      newJustifications[c.key] = j;
      if(j){ v._meta[c.key] = Object.assign({}, v._meta[c.key]||{}, {j}); }
    }
    // v6.9 — capture component values for mktgFunds / display
    if(RUBRIC_COMPONENTS && RUBRIC_COMPONENTS[c.key]){
      const cfg = RUBRIC_COMPONENTS[c.key];
      const compVals = {};
      cfg.fields.forEach(f => {
        const el = document.getElementById(`se-comp-${c.key}-${f.key}`);
        if(!el) return;
        if(f.type === 'bool') compVals[f.key] = el.checked;
        else if(f.type === 'number') compVals[f.key] = el.value === '' ? null : parseFloat(el.value);
        else compVals[f.key] = el.value || null;
      });
      v._meta[c.key] = Object.assign({}, v._meta[c.key]||{}, {components: compVals});
    }
  });

  // v6.9.5 — persist data_state to vendor_score_states (fire-and-forget, parallel).
  if(typeof sbSaveScoreState === 'function'){
    Object.keys(newDataStates).forEach(catKey => {
      sbSaveScoreState(vendorId, catKey, newDataStates[catKey], verifiedBy);
    });
  }
  // v6.9.9 (Track 1.1) — persist numeric score values to vendor_scores
  if(typeof sbSaveVendorScore === 'function'){
    CAT_DEFS.forEach(c => {
      const newVal = newValues[c.key];
      const meta = v._meta[c.key] || {};
      sbSaveVendorScore(vendorId, c.key, newVal, newJustifications[c.key] || meta.j || null, meta.components || null, verifiedBy);
    });
  }

  // v6.9 — propagate the same score set to sister brands under the same parent
  let sisterCount = 0, sisterChanged = 0;
  if(propagateToSisters && typeof getSisterVendors==='function'){
    const sisters = getSisterVendors(vendorId);
    sisterCount = sisters.length;
    sisters.forEach(sv => {
      sv._meta = sv._meta || {};
      CAT_DEFS.forEach(c=>{
        const newVal = newValues[c.key];
        const old = sv.scores[c.key];
        if(old !== newVal && !(old===null && newVal===null)){
          logChange(sv.name, c.label, old===null?'—':old, (newVal===null?'—':newVal) + ' (sister-sync from ' + v.name + ')');
          sv.scores[c.key] = newVal;
          sisterChanged++;
        }
        const ds = newDataStates[c.key];
        if(ds){
          const prev = sv._meta[c.key] || {};
          const updates = {data_state: ds};
          if(ds === 'verified' && prev.data_state !== 'verified'){
            updates.verified_at = verifiedAtIso;
            updates.verified_by = verifiedBy;
          }
          sv._meta[c.key] = Object.assign({}, prev, updates);
        }
        const j = newJustifications[c.key];
        if(j){ sv._meta[c.key] = Object.assign({}, sv._meta[c.key]||{}, {j}); }
      });
      // v6.9.5 — persist sister states to Supabase too
      if(typeof sbSaveScoreState === 'function'){
        Object.keys(newDataStates).forEach(catKey => {
          sbSaveScoreState(sv.id, catKey, newDataStates[catKey], verifiedBy);
        });
      }
      // v6.9.9 (Track 1.1) — persist sister score values to vendor_scores
      if(typeof sbSaveVendorScore === 'function'){
        CAT_DEFS.forEach(c => {
          const newVal = newValues[c.key];
          const meta = sv._meta[c.key] || {};
          sbSaveVendorScore(sv.id, c.key, newVal, newJustifications[c.key] || meta.j || null, meta.components || null, verifiedBy);
        });
      }
    });
  }

  closeModal();
  renderVendors($('pg-content'));
  if(typeof sbAuditLog === 'function' && (changed || sisterChanged)){
    sbAuditLog('score_save', 'vendors', {vendor_id: vendorId, vendor_name: v.name, changed, sister_count: sisterCount, sister_changed: sisterChanged});
  }
  if(propagateToSisters && sisterCount){
    toast(`${changed} score${changed===1?'':'s'} updated · ${sisterChanged} propagated to ${sisterCount} sister${sisterCount===1?'':'s'}`, 'ok');
  } else {
    toast(`${changed} score${changed===1?'':'s'} updated`, 'ok');
  }
}

function openVendorEdit(vendorId) {
  const v = VD.find(x => x.id === vendorId);
  if (!v) return;

  openModal(`Edit Vendor — ${v.name}`, `
    <div class="fg"><label>Vendor Name</label><input id="ve-name" value="${esc(v.name)}"></div>
    <div class="fg"><label>Rep Group</label><input id="ve-rep" value="${esc(v.rep || '')}"></div>
    <div class="fg"><label>Status</label>
      <select id="ve-status">
        <option value="Active" ${v.status === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Closed" ${v.status === 'Closed' ? 'selected' : ''}>Closed</option>
      </select>
    </div>
    ${(()=>{
      const vRaw = VD_RAW.find(r=>r.id===vendorId) || {};
      const curVt = (vRaw.vt||'').toLowerCase();
      return `<div class="fg"><label>Vendor Type</label>
        <select id="ve-vtype" onchange="const nv=this.value; const rec=VD_RAW.find(r=>r.id===${vendorId}); if(rec) rec.vt=nv; const vv=VD.find(x=>x.id===${vendorId}); if(vv) vv.vt=nv; renderVendors($('pg-content'));">
          <option value="" ${!curVt?'selected':''}>(unset)</option>
          ${VENDOR_TYPES.map(t=>`<option value="${t}" ${curVt===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>`;
    })()}
    <div class="fg"><label>Tier Override <span style="font-weight:400;color:var(--text-3);font-size:11px;">(blank = computed from sales)</span></label>
      <select id="ve-tier">
        <option value="" ${!v.tier_override?'selected':''}>(auto)</option>
        <option value="A" ${v.tier_override==='A'?'selected':''}>A — Full score</option>
        <option value="B" ${v.tier_override==='B'?'selected':''}>B — Light score</option>
        <option value="C" ${v.tier_override==='C'?'selected':''}>C — Not scored</option>
      </select>
    </div>
    <div class="fg"><label>Notes</label><textarea id="ve-notes" rows="3" placeholder="Internal notes — visible to all signed-in users" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:inherit;font-size:13px;resize:vertical;">${esc(v.notes||'')}</textarea></div>
    <div class="fg" style="display:flex;align-items:center;gap:10px;">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
        <input type="checkbox" id="ve-inactive" ${v.inactive?'checked':''}> <span>Inactive</span>
      </label>
      <input id="ve-inactive-reason" placeholder="Reason (optional)" value="${esc(v.inactive_reason||'')}" style="flex:1;padding:7px 10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:12px;">
    </div>
    <button class="btn btn-accent" onclick="saveVendorEdit(${vendorId})">Save Changes</button>
  `);
}

function saveVendorEdit(vendorId) {
  const v = VD.find(x => x.id === vendorId);
  if (!v) return;

  const newName = $('ve-name').value;
  const newRep = $('ve-rep').value;
  const newStatus = $('ve-status').value;
  const newTier = $('ve-tier') ? $('ve-tier').value : '';
  const newNotes = $('ve-notes') ? $('ve-notes').value : '';
  const newInactive = $('ve-inactive') ? $('ve-inactive').checked : !!v.inactive;
  const newInactiveReason = $('ve-inactive-reason') ? $('ve-inactive-reason').value : '';

  if (v.name !== newName) logChange(v.name, 'Name', v.name, newName);
  if (v.rep !== newRep) logChange(newName, 'Rep Group', v.rep, newRep);
  if (v.status !== newStatus) logChange(newName, 'Status', v.status, newStatus);
  if ((v.tier_override||'') !== newTier) logChange(newName, 'Tier Override', v.tier_override||'(auto)', newTier||'(auto)');
  if ((v.notes||'') !== newNotes && newNotes.length < 200) logChange(newName, 'Notes', (v.notes||'').slice(0,40), newNotes.slice(0,40));
  if (!!v.inactive !== newInactive) logChange(newName, 'Inactive', v.inactive?'true':'false', newInactive?'true':'false');

  v.name = newName;
  v.rep = newRep;
  v.status = newStatus;
  v.tier_override = newTier || null;
  v.notes = newNotes;
  v.inactive = newInactive;
  v.inactive_reason = newInactiveReason;

  // Persist override fields to vendor_overrides (notes, tier, inactive — not name/rep/status which live in VD_RAW)
  if(typeof sbSaveVendorOverride === 'function'){
    sbSaveVendorOverride(vendorId, {
      notes: newNotes || null,
      tier_override: newTier || null,
      inactive: newInactive,
      inactive_reason: newInactive ? (newInactiveReason || null) : null,
      custom_rep: newRep || null
    }, (CU?.name)||'Unknown');
  }

  if(typeof sbAuditLog === 'function'){
    sbAuditLog('vendor_edit', 'vendors', {vendor_id: vendorId, vendor_name: newName, fields_changed: {tier:newTier!==(v.tier_override||''), notes:newNotes!==(v.notes||''), inactive:newInactive!==!!v.inactive}});
  }

  closeModal();
  renderVendors($('pg-content'));
  toast('Vendor updated', 'ok');
}

async function openVendorDetail(vendorId) {
  const v = VD.find(x => x.id === vendorId);
  if (!v) return;

  const ws = weightedScore(v);
  const allScores = VD.map(vx => weightedScore(vx)).filter(s => s !== null);
  const adaptiveTier = ws !== null ? getAdaptiveTier(ws, allScores) : null;
  const repInfo = REP_DIRECTORY.find(r => r['Rep Company'] === v.rep);

  // Remove any existing modal
  const existing = document.getElementById('vendor-detail-modal');
  if (existing) existing.remove();

  // Build sales chart SVG (reused from before)
  const buildSalesChart = () => {
    if (!v.sales?.t) return '';
    const yrs=['2021','2022','2023','2024','2025'];
    const vals=yrs.map(y=>v.sales[y]||0);
    const maxV=Math.max(...vals,1), minV=Math.min(...vals,0);
    const W=520, H=180, P={t:20,r:20,b:30,l:60};
    const cw=W-P.l-P.r, ch=H-P.t-P.b;
    const range=maxV-minV||maxV||1;
    const xs=yrs.map((_,i)=>P.l+(cw*i/(yrs.length-1)));
    const ys=vals.map(v=>P.t+ch-((v-minV)/range)*ch);
    const path=xs.map((x,i)=>(i?'L':'M')+x.toFixed(1)+','+ys[i].toFixed(1)).join(' ');
    const area=`M${xs[0]},${P.t+ch} L${xs.map((x,i)=>x+','+ys[i]).join(' L')} L${xs[xs.length-1]},${P.t+ch} Z`;
    const ticks=4;
    const tickVals=[];
    for(let i=0;i<=ticks;i++) tickVals.push(minV+(range*i/ticks));
    const fmtTick=v=>v>=1000?'$'+(v/1000).toFixed(0)+'k':'$'+v.toFixed(0);
    return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:10px;">5-Year Sales Trend</div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;font-family:'DM Mono',monospace;">
        ${tickVals.map((tv,i)=>{const y=P.t+ch-((tv-minV)/range)*ch;return`<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${W-P.r}" y2="${y.toFixed(1)}" stroke="#e5e5e3" stroke-width="1" stroke-dasharray="${i===0?'0':'2,3'}"/><text x="${P.l-8}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-size="10" fill="#888">${fmtTick(tv)}</text>`;}).join('')}
        <path d="${area}" fill="rgba(21,101,192,0.12)"/>
        <path d="${path}" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${xs.map((x,i)=>`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="4" fill="#1565c0" stroke="white" stroke-width="2"/><text x="${x.toFixed(1)}" y="${(ys[i]-10).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#1565c0">${fmtTick(vals[i])}</text><text x="${x.toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="11" font-weight="600" fill="#555">${yrs[i]}</text>`).join('')}
      </svg>
      <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;">
        <div><span style="color:var(--text-3);">5-Yr Total:</span> <strong>${fmt$(v.sales.t)}</strong></div>
        ${v.sales.tr!==undefined?`<div><span style="color:var(--text-3);">Trend:</span> <strong style="color:${v.sales.tr>0?'var(--green)':v.sales.tr<0?'var(--accent)':'var(--text-3)'};">${v.sales.tr>0?'+':''}${(v.sales.tr*100).toFixed(0)}%</strong></div>`:''}
      </div>
    </div>`;
  };

  // Overlay + modal
  const overlay = document.createElement('div');
  overlay.id = 'vendor-detail-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.onclick = e => { if(e.target===overlay) closeVendorDetail(); };

  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--surface);border-radius:12px;box-shadow:var(--shadow-lg);width:100%;max-width:760px;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;';

  // Vendor website: try to derive from name
  const websiteGuess = v.website || '';

  modal.innerHTML = `
    <div style="position:sticky;top:0;background:var(--surface);border-bottom:1px solid var(--border);padding:20px 24px;z-index:1;border-radius:12px 12px 0 0;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
        <div>
          <h2 style="font-size:22px;font-weight:700;margin:0 0 4px;">${esc(v.name)}</h2>
          ${websiteGuess ? `<a href="${esc(websiteGuess)}" target="_blank" style="font-size:12px;color:var(--accent);">🔗 ${esc(websiteGuess)}</a>` : `<span id="vd-website-link" style="font-size:12px;color:var(--text-3);">🔗 Searching for website...</span>`}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-sm btn-outline" onclick="openVendorEdit(${v.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-outline" onclick="openCategoryEditor(${v.id},'${esc(v.name).replace(/'/g,"\\'")}',()=>{closeVendorDetail();openVendorDetail(${v.id});renderVendors($('pg-content'))})">🏷️ Cats</button>
          <button class="btn btn-sm btn-outline" onclick="closeVendorDetail()">✕ Close</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${tierBadge(adaptiveTier)}
        ${ws !== null ? `<span class="mono fw6" style="color:${scoreColor(ws)};font-size:18px;">${ws}</span>` : ''}
        <span class="badge bg-gray">${scoredCount(v.scores)}/${CAT_DEFS.length} scored</span>
        ${(()=>{
          if(typeof getVendorParent !== 'function') return '';
          const parent = getVendorParent(v.id);
          if(!parent) return '';
          const sisters = (typeof getSisterVendors==='function') ? getSisterVendors(v.id) : [];
          return `<span class="badge bg-amber" title="Click to see sister brands">🏢 ${esc(parent.name)}${sisters.length?` · ${sisters.length} sister${sisters.length===1?'':'s'}`:''}</span>`;
        })()}
      </div>
    </div>

    <div style="padding:20px 24px;">

      ${(()=>{
        if(typeof getSisterVendors !== 'function') return '';
        const sisters = getSisterVendors(v.id);
        const parent = (typeof getVendorParent==='function') ? getVendorParent(v.id) : null;
        if(!sisters.length || !parent) return '';
        return `<div style="margin-bottom:20px;padding:14px;background:#fffbeb;border:1px solid #fbbf24;border-radius:var(--radius);">
          <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:8px;">Sister Brands · ${esc(parent.name)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${sisters.map(s => {
              const sw = weightedScore(s);
              return `<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 10px;" onclick="closeVendorDetail();openVendorDetail(${s.id});">${esc(s.name)}${sw!==null?` <span class="mono" style="color:${scoreColor(sw)};">${sw}</span>`:''}</button>`;
            }).join('')}
          </div>
        </div>`;
      })()}

      <!-- Vendor Overview -->
      <div style="margin-bottom:20px;padding:14px;background:var(--surface2);border-radius:var(--radius);border-left:3px solid var(--accent);">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">About This Vendor</div>
        <div id="vd-overview" style="font-size:13px;color:var(--text-2);line-height:1.6;">Loading overview...</div>
      </div>

      <!-- Rep Info -->
      ${repInfo ? `
        <div style="margin-bottom:20px;padding:14px;background:var(--surface2);border-radius:var(--radius);">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Rep Group</div>
          <div style="font-weight:600;font-size:15px;margin-bottom:6px;">${esc(repInfo['Rep Company'])}</div>
          ${repInfo['Primary Contact'] ? `<div style="font-size:13px;color:var(--text-2);">${esc(repInfo['Primary Contact'])}</div>` : ''}
          ${repInfo['Phone'] ? `<div style="font-size:13px;color:var(--text-2);">📞 ${esc(repInfo['Phone'])}</div>` : ''}
          ${repInfo['Email'] ? `<div style="font-size:13px;"><a href="mailto:${esc(repInfo['Email'])}" style="color:var(--accent);">${esc(repInfo['Email'])}</a></div>` : ''}
        </div>
      ` : ''}

      <!-- Sales Chart -->
      ${buildSalesChart()}

      <!-- Stock Breakdown Placeholder -->
      <div style="margin-bottom:20px;padding:14px;background:var(--surface2);border-radius:var(--radius);border:1px dashed var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Stock Breakdown</div>
        <div style="font-size:13px;color:var(--text-3);text-align:center;padding:20px 0;">
          📦 Inventory data coming soon — requires Windward S5WebAPI integration
        </div>
      </div>

      <!-- Detailed Sales Breakdown Placeholder -->
      <div style="margin-bottom:20px;padding:14px;background:var(--surface2);border-radius:var(--radius);border:1px dashed var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Sales Breakdown</div>
        <div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0;">
          📊 Detailed breakdown by salesperson, margin, item, and invoice coming soon — requires Windward S5WebAPI integration
        </div>
      </div>

      <!-- Product Categories -->
      <div style="margin-bottom:20px;padding:14px;background:var(--surface2);border-radius:var(--radius);">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;">Product Categories</div>
        <div style="margin-bottom:8px;">${renderCatChips(v.id, 30)}</div>
        <button class="btn btn-sm btn-outline" onclick="openCategoryEditor(${v.id},'${esc(v.name).replace(/'/g,"\\'")}',()=>{closeVendorDetail();openVendorDetail(${v.id});renderVendors($('pg-content'))})" style="font-size:10px;">🏷️ Edit Categories</button>
        ${(()=>{const t=totalRawScore(v.scores);return t?`<div style="margin-top:8px;font-size:11px;color:var(--text-3);">Raw total: <strong style="color:var(--text);">${t.sum} / ${t.max}</strong> pts</div>`:''})()}
      </div>

      <!-- Scoring Breakdown -->
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:12px;">Scoring Breakdown</div>
      <div style="display:grid;gap:12px;">
        ${CAT_DEFS.map(c => {
          const s = v.scores[c.key];
          const m = v._meta?.[c.key] || {};
          return `<div style="padding:14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:13px;font-weight:600;">${c.label}</span>
              <span style="font-size:11px;color:var(--text-3);">wt: ${c.weight}</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px;">
              <div style="font-size:20px;font-weight:700;color:${scoreColor(s)};min-width:40px;">${s === 'na' ? 'N/A' : (s || '—')}</div>
              <div class="sbar" style="flex:1;"><div class="sbar-fill" style="width:${typeof s === 'number' ? s * 10 : 0}%;background:${scoreColor(s)};"></div></div>
            </div>
            ${m.j ? `<div style="font-size:11px;color:var(--text-3);line-height:1.4;">${esc(m.j)}</div>` : ''}
          </div>`;
        }).join('')}
      </div>

      ${(()=>{
        // Vendor 360° cross-references
        const myPOs = (typeof POS!=='undefined'?POS:[]).filter(p => p.vendor_id === v.id || (p.vendor_name && p.vendor_name.toLowerCase() === v.n.toLowerCase()));
        const myCoop = (typeof COOP_FUNDS!=='undefined'?COOP_FUNDS:[]).filter(f => f.vendor_id === v.id);
        const myWarranty = (typeof WARRANTY_CLAIMS!=='undefined'?WARRANTY_CLAIMS:[]).filter(w => w.vendor_id === v.id);
        const myDisplays = (typeof SHOWROOM_DISPLAYS!=='undefined'?SHOWROOM_DISPLAYS:[]).filter(d => d.vendor_id === v.id);
        const myInv = (typeof INVENTORY!=='undefined'?INVENTORY:[]).filter(it => it.vendor_id === v.id || (it.vendor_name && v.n && it.vendor_name.toLowerCase() === v.n.toLowerCase()));
        const total = myPOs.length + myCoop.length + myWarranty.length + myDisplays.length + myInv.length;
        if(total === 0) return '';
        const block = (label, items, extraFn) => items.length ? `<div style="margin-bottom:10px;">
          <div style="font-size:12px;font-weight:600;margin-bottom:4px;">${label} · ${items.length}</div>
          <div style="font-size:11px;color:var(--text-2);">${extraFn(items.slice(0,3))}${items.length>3?` <span class="muted">+${items.length-3} more</span>`:''}</div>
        </div>` : '';
        return `<div style="margin-top:24px;padding:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface2);">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:12px;">Vendor 360° · Cross-References</div>
          ${block('Purchase Orders', myPOs, items => items.map(p => `<strong>${esc(p.po_number||'')}</strong> $${Math.round(p.total||0).toLocaleString()} · ${p.status||''}`).join(' · '))}
          ${block('Inventory SKUs', myInv, items => `${items.length>3?'Including':''} ${items.slice(0,3).map(it=>esc(it.sku)).join(', ')}`)}
          ${block('Co-op Funds', myCoop, items => items.map(f => `${esc(f.fund_type||'fund')} $${Number(f.amount||0).toLocaleString()} (${f.status||''})`).join(' · '))}
          ${block('Showroom Displays', myDisplays, items => items.map(d => `${esc(d.display_name||'display')} (${d.status||''})`).join(' · '))}
          ${block('Warranty Claims', myWarranty, items => items.map(w => `${esc(w.claim_number||'')} · ${w.status||''}`).join(' · '))}
        </div>`;
      })()}

    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // AI overview via Anthropic API
  try {
    const _vdKey = getS('aos-api');
    if (!_vdKey) { const el=document.getElementById('vd-overview'); if(el) el.textContent='Add your API key in Settings to enable vendor overviews.'; return; }
    const resp = await fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': _vdKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Write a single concise paragraph (3–5 sentences) about the lighting vendor "${v.name}" for an internal sales team reference. Cover: what types of products they make, their market positioning (residential, commercial, luxury, value, etc.), and any notable brand characteristics. Be factual and professional. If you don't have reliable information about this specific vendor, say so briefly.`
        }]
      })
    });
    const data = await resp.json();
    const overviewEl = document.getElementById('vd-overview');
    if (overviewEl) {
      const text = data?.content?.[0]?.text || 'No overview available.';
      overviewEl.textContent = text;
    }
  } catch(e) {
    const overviewEl = document.getElementById('vd-overview');
    if (overviewEl) overviewEl.textContent = 'Overview unavailable.';
  }

  // Website link lookup via AI
  if (!websiteGuess) {
    try {
      const resp2 = await fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': _vdKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `What is the official website URL for the lighting manufacturer or vendor named "${v.name}"? Reply with ONLY the URL (e.g. https://example.com) and nothing else. If you are not confident, reply with exactly: unknown`
          }]
        })
      });
      const data2 = await resp2.json();
      const url = (data2?.content?.[0]?.text || '').trim();
      const linkEl = document.getElementById('vd-website-link');
      if (linkEl && url && url !== 'unknown' && url.startsWith('http')) {
        linkEl.outerHTML = `<a href="${url}" target="_blank" style="font-size:12px;color:var(--accent);">🔗 ${url}</a>`;
      } else if (linkEl) {
        linkEl.textContent = '🔗 Website not found';
      }
    } catch(e) {
      const linkEl = document.getElementById('vd-website-link');
      if (linkEl) linkEl.textContent = '';
    }
  }
}

function closeVendorDetail() {
  const modal = document.getElementById('vendor-detail-modal');
  if (modal) modal.remove();
}

// ── REP OUTREACH (Task 2) ──
// Generates a per-rep outreach email — formal 4-section format matching sent email
function buildRepOutreachEmail(repName){
  const rep = REP_DIRECTORY.find(r => r['Rep Company'] === repName);
  const repVendors = VD.filter(v => v.rep === repName).sort((a,b) => (b.sales?.t||0)-(a.sales?.t||0));
  if(!repVendors.length) return null;

  const TERM_CATS = [
    {key:'rebates',   label:'Rebate program'},
    {key:'discounts', label:'Inside/volume discount'},
    {key:'credit',    label:'Credit terms'},
    {key:'freight',   label:'Free freight threshold'},
    {key:'returns',   label:'Returns/RGA'},
    {key:'mktgFunds', label:'Marketing/co-op funds'},
    {key:'display',   label:'Display program'},
  ];

  const buildVendorBlock = v => {
    const lines = TERM_CATS.map(({key, label}) => {
      const sc = v.scores?.[key];
      const j = (v._meta?.[key]?.j || '').trim()
        .replace(/\. Details: nan/g, '')
        .replace(/Scored based on manufacturer direct sales[^.]*\./g, '')
        .replace(/Vendor is on Lights America website\./g, '')
        .replace(/Accent Lighting is listed under general dealers[^.]*\./g, '')
        .trim();
      let val;
      if (!sc && !j) {
        val = '(nothing on file — please provide)';
      } else {
        const hasDetail = j.length > 2;
        if (hasDetail) {
          const needsDetail = ['returns','display','mktgFunds','discounts'].includes(key);
          val = needsDetail ? `${j} — please provide details` : `${j} — correct?`;
        } else {
          val = '(nothing on file — please provide)';
        }
      }
      return `  ${label}:`.padEnd(32) + val;
    });
    const divider = '══════════════════════════════════════════';
    return `${divider}\n${v.name.toUpperCase()}\n${divider}\n${lines.join('\n')}`;
  };

  // Build all contacts on file for this rep
  const contacts = [];
  if(rep?.['Primary Contact'] && (rep?.['Email'] || rep?.['Office Email'])){
    contacts.push({ name: rep['Primary Contact'], email: rep['Email'] || rep['Office Email'], phone: rep['Phone'] || rep['Office Phone'] || '' });
  }
  if(rep?.['Secondary Contact'] && rep?.['Sec Email']){
    contacts.push({ name: rep['Secondary Contact'], email: rep['Sec Email'], phone: '' });
  }
  if(rep?.['Quote Email'] && !contacts.find(c => c.email === rep['Quote Email'])){
    contacts.push({ name: 'Quotes', email: rep['Quote Email'], phone: '' });
  }

  const linecard = repVendors.map(v => `  [ ] ${v.name}`).join('\n');
  const vendorBlocks = repVendors.map(buildVendorBlock).join('\n\n');

  const secContactLine = rep?.['Sec Email']
    ? `\n  Secondary:        ${rep['Secondary Contact'] || 'Secondary'} — ${rep['Sec Email']}`
    : '';

  const subject = `${repName} — Vendor Terms & Linecard Verification (2026 Review)`;

  const defaultGreeting = contacts.length >= 2
    ? contacts.slice(0,2).map(c => c.name.split(' ')[0]).join(' and ')
    : (contacts[0]?.name.split(' ')[0] || repName);

  const body =
`${defaultGreeting},

I'm reaching out as part of a formal vendor ranking and terms review we're doing at Accent Lighting for 2026. We're evaluating every line we carry — looking at rebates, freight, terms, display programs, and channel policies — so we can prioritize growth and display investment with the vendors where the partnership structure works best for both sides. Lines with strong, well-documented terms get more floor space, more active selling, and more of our team's attention.

You represent some significant lines for us, and I want to make sure we're working off accurate information before we finalize rankings and purchasing plans for the year.


SECTION 1 — CONTACT DIRECTORY

Please confirm or correct the following:

  Rep Company:      ${repName}
  Primary Contact:  ${rep?.['Primary Contact'] || '(none on file)'}
  Phone:            ${rep?.['Phone'] || rep?.['Office Phone'] || '(none on file)'}
  Email:            ${rep?.['Email'] || rep?.['Office Email'] || '(none on file)'}
  Website:          ${rep?.['Website'] || '(none on file)'}${secContactLine}

Who should we contact for each of the following? (name + email + phone)

  Quote requests:       ___________________________
  RGA / returns:        ___________________________
  Parts requests:       ___________________________
  Co-op / MDF claims:   ___________________________
  General questions:    ___________________________

—

SECTION 2 — LINECARD VERIFICATION

Below is every line we have assigned to ${repName} in our system. Please:
  • Check off each line you still actively represent for us
  • Note any lines you no longer carry
  • Add any lines you represent that aren't listed

${linecard}

Lines you represent that are NOT listed above:
  ___________________________
  ___________________________
  ___________________________

—

SECTION 3 — VENDOR TERMS

For each vendor, I've listed exactly what we have on file. Fields marked "(nothing on file)" are gaps we need filled. Fields with data just need a confirmation or correction.

If it's easier, attach any dealer program sheets, price book terms, or vendor agreements and I'll pull the data from those directly — no need to fill this out manually if you have the docs.

${vendorBlocks}

—

SECTION 4 — ANYTHING ELSE

Anything else you'd like us to have on file? New programs, line changes, preferred ordering windows, or anything that would help us work better together?

I appreciate you taking the time on this. If it's easier, just attach any dealer program sheets, price book terms, or vendor agreements and I'll pull everything from those directly — no need to fill this all out manually if you have the docs.

Please give me a call if you have any questions or would like to discuss anything prior to responding to this email.

The information you provide goes directly into how we prioritize display space, purchasing decisions, and vendor relationships for 2026.


Michael Graf
Accent Lighting, Inc.
10322 E. Stonegate Lane, Suite 100
Wichita, KS 67206
316-636-1278
michaelg@accentlightinginc.com
accentlightinginc.com`;

  const defaultTo = contacts.map(c => c.email).filter(Boolean).join(', ');

  return { subject, body, to: defaultTo, contacts, repVendors, rep };
}

function openRepOutreach(repName){
  const out = buildRepOutreachEmail(repName);
  if(!out){ toast('No vendors found for this rep', 'err'); return; }
  const { subject, body, to: defaultTo, contacts, repVendors } = out;

  // Build recipient checkbox list
  const recipientRows = contacts.length > 0
    ? contacts.map((c, i) => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border);border-radius:5px;cursor:pointer;font-size:12px;">
          <input type="checkbox" class="ro-recipient-cb" data-email="${esc(c.email)}" data-name="${esc(c.name)}" ${i === 0 ? 'checked' : ''} onchange="(()=>{const checked=[...document.querySelectorAll('.ro-recipient-cb:checked')].map(el=>el.dataset.email);document.getElementById('ro-to').value=checked.join(', ');})()">
          <span><strong>${esc(c.name)}</strong>${c.email ? ` — ${esc(c.email)}` : ''}${c.phone ? ` — ${esc(c.phone)}` : ''}</span>
        </label>`).join('')
    : `<div style="font-size:12px;color:var(--accent);">⚠ No contacts on file for this rep.</div>`;

  openModal(`Outreach Email — ${repName}`, `
    <div style="display:flex;gap:14px;margin-bottom:14px;flex-wrap:wrap;">
      <div style="flex:1;min-width:200px;padding:10px 12px;background:var(--surface2);border-radius:6px;font-size:12px;">
        <div style="color:var(--text-3);font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Vendors</div>
        <div style="font-size:18px;font-weight:700;">${repVendors.length}</div>
      </div>
      <div style="flex:1;min-width:200px;padding:10px 12px;background:var(--surface2);border-radius:6px;font-size:12px;">
        <div style="color:var(--text-3);font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">5-yr sales</div>
        <div style="font-size:18px;font-weight:700;">${fmt$(repVendors.reduce((sum,v)=>sum+(v.sales?.t||0),0))}</div>
      </div>
      <div style="flex:1;min-width:200px;padding:10px 12px;background:var(--surface2);border-radius:6px;font-size:12px;">
        <div style="color:var(--text-3);font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Recipient</div>
        <div style="font-size:13px;font-weight:600;">${esc(defaultTo||'(no email on file — set one below)')}</div>
      </div>
    </div>

    <div class="fg" style="margin-bottom:10px;">
      <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);margin-bottom:6px;display:block;">Recipients — select who to send to</label>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">${recipientRows}</div>
      <input id="ro-to" value="${esc(defaultTo)}" placeholder="Or type emails manually" style="width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:5px;font-family:monospace;font-size:12px;color:var(--text-3);">
    </div>
    <div class="fg" style="margin-bottom:10px;">
      <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);">Subject</label>
      <input id="ro-subj" value="${esc(subject)}" style="width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:5px;font-size:13px;">
    </div>
    <div class="fg">
      <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);">Body</label>
      <textarea id="ro-body" rows="18" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:5px;font-family:monospace;font-size:11.5px;line-height:1.45;resize:vertical;">${esc(body)}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid var(--border);flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="(()=>{const t=document.getElementById('ro-body'); t.select(); document.execCommand('copy'); toast('Email body copied','ok');})()">📋 Copy Body</button>
      <button class="btn btn-outline" onclick="(()=>{const subj=document.getElementById('ro-subj').value; const body=document.getElementById('ro-body').value; const to=document.getElementById('ro-to').value; window.location.href = 'mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);})()">✉ Open in Mail Client</button>
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
    </div>
  `);
}

function renderRepList(container) {
  const sorted = [...REP_DIRECTORY].sort((a, b) => (b['Total 5yr Sales'] || 0) - (a['Total 5yr Sales'] || 0));

  container.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Rep Directory</span>
        <span class="sm muted">${REP_DIRECTORY.length} rep groups</span>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 240px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Rep Company</th>
              <th>Type</th>
              <th>Website</th>
              <th>Primary Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Secondary Contact</th>
              <th>Office Phone</th>
              <th>Quote Email</th>
              <th>Vendors</th>
              <th>5-Yr Sales</th>
              <th>Outreach</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(rep => `
              <tr>
                <td style="font-weight:600;">${esc(rep['Rep Company'] || '')}</td>
                <td><span class="badge bg-gray">${esc(rep['Type'] || '—')}</span></td>
                <td class="sm">${rep['Website'] ? `<a href="${esc(rep['Website'])}" target="_blank" style="color:var(--accent);">Visit</a>` : '—'}</td>
                <td class="sm">${esc(rep['Primary Contact'] || '—')}</td>
                <td class="mono sm">${esc(rep['Phone'] || rep['Office Phone'] || '—')}</td>
                <td class="sm">${rep['Email'] ? `<a href="mailto:${esc(rep['Email'])}" style="color:var(--accent);">${esc(rep['Email'])}</a>` : '—'}</td>
                <td class="sm">${esc(rep['Secondary Contact'] || '—')}</td>
                <td class="mono sm">${esc(rep['Office Phone'] || '—')}</td>
                <td class="sm">${rep['Quote Email'] ? `<a href="mailto:${esc(rep['Quote Email'])}" style="color:var(--accent);">${esc(rep['Quote Email'])}</a>` : '—'}</td>
                <td class="mono">${rep['Vendor Count'] || 0}</td>
                <td class="mono fw6">${fmt$(rep['Total 5yr Sales'])}</td>
                <td><button class="btn btn-sm btn-outline" onclick="openRepOutreach('${esc(rep['Rep Company']||'').replace(/'/g,"\\'")}')">📧 Email</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRepView(container) {
  const reps = [...new Set(VD.map(v => v.rep).filter(Boolean))].sort();
  const selectedRep = vRep === 'All' && reps.length > 0 ? reps[0] : (vRep !== 'All' ? vRep : '');

  const allScores = VD.map(v => weightedScore(v)).filter(s => s !== null);
  const repVendors = VD.filter(v => v.rep === selectedRep).sort((a, b) => {
    const wa = weightedScore(a), wb = weightedScore(b);
    if (wa === null && wb === null) return (b.sales?.t || 0) - (a.sales?.t || 0);
    if (wa === null) return 1; if (wb === null) return -1;
    return wb - wa;
  });

  const repInfo = REP_DIRECTORY.find(r => r['Rep Company'] === selectedRep);

  container.innerHTML = `
    <div class="card mb16">
      <div class="card-hd">
        <span class="card-title">Filter by Rep Group</span>
        <select class="srch" style="min-width:200px;" onchange="vRep=this.value;renderVendors($('pg-content'))">
          ${reps.map(r => `<option value="${esc(r)}" ${selectedRep === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
        </select>
      </div>
      ${repInfo ? `
        <div style="padding:16px;background:var(--surface2);border-top:1px solid var(--border);display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
          <div><span class="sm muted">Contact:</span> <strong>${esc(repInfo['Primary Contact'] || '—')}</strong></div>
          <div><span class="sm muted">Phone:</span> <strong>${esc(repInfo['Phone'] || repInfo['Office Phone'] || '—')}</strong></div>
          <div><span class="sm muted">Email:</span> ${repInfo['Email'] ? `<strong><a href="mailto:${esc(repInfo['Email'])}" style="color:var(--accent);">${esc(repInfo['Email'])}</a></strong>` : '<strong>—</strong>'}</div>
          <div><span class="sm muted">Website:</span> ${repInfo['Website'] ? `<a href="${esc(repInfo['Website'])}" target="_blank" style="color:var(--accent);">Visit</a>` : '—'}</div>
        </div>
      ` : ''}
    </div>

    <div class="card">
      <div class="card-hd" style="flex-wrap:wrap;gap:8px;">
        <span class="card-title">${esc(selectedRep)} — ${repVendors.length} Vendors</span>
        <button class="btn btn-sm btn-accent" onclick="openRepOutreach('${esc(selectedRep).replace(/'/g,"\\'")}')">📧 Generate Outreach Email</button>
        <span class="sm muted" style="flex:1;text-align:right;">Rep Score category hidden from this view</span>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 380px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Tier</th>
              <th>Score</th>
              <th>Scored</th>
              <th>5-Yr Sales</th>
            </tr>
          </thead>
          <tbody>
            ${repVendors.map((v, i) => {
              const info = vendorScore(v);
              const ws = info.score;
              const adaptiveTier = ws !== null ? getAdaptiveTier(ws, allScores) : null;
              const sc = scoredCount(v.scores);
              const eligTier = info.tier;
              const badges = [];
              if(info.unverifiedCount > 0){
                badges.push(`<span class="badge bg-red" style="font-size:10px;cursor:pointer;margin-left:6px;" title="Open Scores tab and filter to unverified categories" onclick="event.stopPropagation();filterScoresUnverified(${v.id});">${info.unverifiedCount} unverified</span>`);
              }
              if(eligTier === 'C'){
                badges.push(`<span class="badge bg-gray" style="font-size:10px;margin-left:6px;">Not Scored</span>`);
              }
              if(eligTier === 'B'){
                badges.push(`<span class="badge bg-amber" style="font-size:10px;margin-left:6px;" title="Tier B: scored on Discount, Freight, Returns, Lead Time only">Light Score</span>`);
              }
              const scoreCell = eligTier === 'C'
                ? `<span class="na">Not Scored</span>`
                : (ws !== null ? `<span class="mono fw6" style="color:${scoreColor(ws)};">${ws}</span>` : `<span class="na">TBD</span>`);
              return `
                <tr>
                  <td style="font-weight:600;cursor:pointer;color:var(--accent);" onclick="openVendorDetail(${v.id})">${esc(v.name)}</td>
                  <td>${tierBadge(adaptiveTier)}${badges.join('')}</td>
                  <td>${scoreCell}</td>
                  <td class="mono sm">${sc}/${CAT_DEFS.length}</td>
                  <td class="mono">${fmt$(v.sales?.t)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function downloadScoringRubric(){
  const rows = [
    [10,'≥6% rebates, quarterly bonuses, transparent reporting','≥20% volume discounts','Net 120+, early pay','Free freight <$500','Free returns, no fees, <7 days','≥3% MDF, easy to claim','100% display coverage','Prominent, easy-to-find listing'],
    [9,'5–5.9%','15–19%','Net 90','$500–749','No restock fee, <14 days','2.5–2.9%','75–99%','Listed prominently'],
    [8,'4–4.9%','12–14%','Net 75','$750–999','≤10% fee, quick approval','2–2.4%','50–74%','Listed but secondary'],
    [7,'3–3.9%','10–11%','Net 60','$1000–1499','≤15% fee, 2–3 weeks','1.5–1.9%','40–49%','Listed under general dealers'],
    [6,'2.5–2.9%','8–9%','Net 45','$1500–1999','≤20% fee, slow','1.0–1.4%','30–39%','Hidden list'],
    [5,'2–2.4%','6–7%','Net 30','$2000–2499','≤25% fee','0.8–0.9%','20–29%','Rarely updated'],
    [4,'1.5–1.9%','4–5%','Net 15','$2500–2999','25–30% fee','0.5–0.7%','15–19%','Outdated'],
    [3,'1–1.4%','2–3%','COD, occasional flex','$3000–3499','>30% fee','0.3–0.4%','10–14%','Requires digging'],
    [2,'<1%','<2%','COD only','$3500–3999','Case-by-case','0.1–0.2%','5–9%','Very poor visibility'],
    [1,'Exists, useless','Rarely honored','Strict prepayment','$4000+','Rare approvals','Exists but unusable','<5% coverage','Name only, no link'],
    [0,'None','None','No credit','No free freight','No returns','None','No display','Not listed'],
  ];
  const colors = {10:'#D5E8D4',9:'#DAF0D5',8:'#E6F3E0',7:'#F0F9E8',6:'#FFF9C4',5:'#FFF3A3',4:'#FFE599',3:'#FCDBB0',2:'#F4CDCD',1:'#EDB0B0',0:'#D9534F'};
  const textColors = {0:'#FFFFFF'};
  const headers = ['Score','Rebates & Back-End Incentives','Inside & Volume Discounts','Credit Terms','Freight Policy','Return & RGA Policy','Marketing Funds','Display Allowance','Website Dealer Listing'];
  const descriptions = ['What we measure','Measures the availability, reliability, and transparency of rebates, growth incentives, annual back-end programs, or performance-based payouts that directly improve effective margin beyond standard discounts.','Evaluates standard, non-project discounts and volume-based pricing structures, with preference given to consistent everyday discounts over hard-to-achieve volume tiers.','Assesses payment terms (Net 30, Net 45, dating, seasonal terms) and flexibility, including extended dating programs that improve cash flow.','Evaluates freight terms including prepaid thresholds, freight allowances, drop-ship policies, surcharge practices, and overall freight cost impact.','Assesses the fairness, flexibility, and ease of returns, including restocking fees, RGA turnaround time, damaged goods handling, and dead-stock support.','Evaluates availability, structure, and usability of MDF, co-op, or marketing reimbursement programs, including ease of approval and payout.','Evaluates financial support for showroom displays, sample programs, floor models, refresh allowances, and long-term display partnership commitment.','Evaluates whether the vendor lists and promotes authorized dealers accurately on their website and actively drives consumer traffic to local partners.'];
  const thS = 'background:#1F3864;color:#fff;padding:8px 10px;font-size:11px;text-align:center;border:1px solid #ccc;font-weight:700;white-space:nowrap;';
  const descS = 'background:#EAF0F8;color:#4A6080;padding:6px 10px;font-size:10px;font-style:italic;border:1px solid #ccc;vertical-align:top;';
  const headerRow = '<tr>' + headers.map(h => `<th style="${thS}">${h}</th>`).join('') + '</tr>';
  const descRow = '<tr>' + descriptions.map(d => `<td style="${descS}">${d}</td>`).join('') + '</tr>';
  const dataRows = rows.map(row => {
    const sc = row[0];
    const bg = colors[sc] || '#fff';
    const col = textColors[sc] || '#2D2D2D';
    const scS = `background:${bg};color:${col};padding:8px 6px;font-size:15px;font-weight:700;text-align:center;border:1px solid #ccc;`;
    const tdS = `background:${bg};color:${col};padding:7px 10px;font-size:11px;text-align:center;border:1px solid #ccc;`;
    return '<tr>' + row.map((v,i) => `<td style="${i===0?scS:tdS}">${v}</td>`).join('') + '</tr>';
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Accent Lighting — Vendor Scoring Rubric</title><style>body{font-family:Arial,sans-serif;margin:20px;}h2{color:#1F3864;font-size:16px;margin-bottom:4px;}p{color:#666;font-size:12px;margin-bottom:14px;}table{border-collapse:collapse;width:100%;table-layout:fixed;}@media print{@page{size:landscape;margin:1cm;}}</style></head><body><h2>Accent Lighting — Vendor Scoring Rubric (0–10)</h2><p>Financial Terms + Sales, Marketing &amp; Market Position &nbsp;|&nbsp; To save as PDF: File → Print → Change destination to "Save as PDF" → set Layout to Landscape → Save.</p><table><thead>${headerRow}${descRow}</thead><tbody>${dataRows}</tbody></table></body></html>`;
  const blob = new Blob([html],{type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='Accent_Vendor_Scoring_Rubric.html'; a.click();
  URL.revokeObjectURL(url);
  toast('Rubric downloaded — open in browser, then Ctrl+P → Save as PDF (Landscape)','ok');
}

