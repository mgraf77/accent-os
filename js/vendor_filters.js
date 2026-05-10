// ── VENDOR FILTERS MODULE (extracted from index.html at v6.11.1) ──
// vFilters state + activeFilterCount, passesAdvancedFilters, openFilterModal

// ── ADVANCED FILTERS (Filter button on Scores tab) ──
let vFilters = {
  reps: new Set(),          // selected rep companies
  cats: new Set(),          // selected top-level product categories
  tiers: new Set(),         // selected tiers (A,B,C,D,F,TBD)
  status: new Set(),        // Active, Closed
  salesMin: '', salesMax: '',  // 5yr sales bounds
  scoreMin: '', scoreMax: '',  // weighted score bounds
  scoredCatsMin: '',        // min # of scored categories
  hasCategories: '',        // 'yes' | 'no' | ''  (has product cats assigned)
  trendMin: '', trendMax: '',
};

function activeFilterCount(){
  let n=0;
  if(vFilters.reps.size) n++;
  if(vFilters.cats.size) n++;
  if(vFilters.tiers.size) n++;
  if(vFilters.status.size) n++;
  if(vFilters.salesMin!==''||vFilters.salesMax!=='') n++;
  if(vFilters.scoreMin!==''||vFilters.scoreMax!=='') n++;
  if(vFilters.scoredCatsMin!=='') n++;
  if(vFilters.hasCategories) n++;
  if(vFilters.trendMin!==''||vFilters.trendMax!=='') n++;
  return n;
}

function passesAdvancedFilters(v, allScores){
  // Rep
  if(vFilters.reps.size && !vFilters.reps.has(v.rep||'')) return false;
  // Categories (top-level)
  if(vFilters.cats.size){
    const vcats = getVPCats(v.id);
    const tops = new Set([...vcats].map(k => k.split('>')[0]));
    let any=false;
    vFilters.cats.forEach(c => { if(tops.has(c)) any=true; });
    if(!any) return false;
  }
  // Tier
  if(vFilters.tiers.size){
    const ws = weightedScore(v);
    const t = ws !== null ? getAdaptiveTier(ws, allScores) : 'TBD';
    if(!vFilters.tiers.has(t||'TBD')) return false;
  }
  // Status
  if(vFilters.status.size && !vFilters.status.has(v.status||'Active')) return false;
  // Sales
  const sales = (v.sales && v.sales.t) || 0;
  if(vFilters.salesMin!=='' && sales < parseFloat(vFilters.salesMin)) return false;
  if(vFilters.salesMax!=='' && sales > parseFloat(vFilters.salesMax)) return false;
  // Score
  const ws = weightedScore(v);
  if(vFilters.scoreMin!=='' && (ws===null || ws < parseFloat(vFilters.scoreMin))) return false;
  if(vFilters.scoreMax!=='' && (ws===null || ws > parseFloat(vFilters.scoreMax))) return false;
  // Scored categories
  if(vFilters.scoredCatsMin!=='' && scoredCount(v.scores) < parseInt(vFilters.scoredCatsMin)) return false;
  // Has product cats
  const cs = getVPCats(v.id);
  if(vFilters.hasCategories==='yes' && cs.size===0) return false;
  if(vFilters.hasCategories==='no'  && cs.size>0) return false;
  // Trend
  const tr = (v.sales && v.sales.tr!==undefined) ? v.sales.tr : null;
  if(vFilters.trendMin!=='' && (tr===null || tr*100 < parseFloat(vFilters.trendMin))) return false;
  if(vFilters.trendMax!=='' && (tr===null || tr*100 > parseFloat(vFilters.trendMax))) return false;
  return true;
}

function resetAdvancedFilters(){
  vFilters = { reps:new Set(), cats:new Set(), tiers:new Set(), status:new Set(),
    salesMin:'', salesMax:'', scoreMin:'', scoreMax:'', scoredCatsMin:'',
    hasCategories:'', trendMin:'', trendMax:'' };
}

function openFilterModal(){
  const reps = [...new Set(VD.map(v=>v.rep).filter(Boolean))].sort();
  const cats = Object.keys(PRODUCT_TAXONOMY);
  const tiers = ['A','B','C','D','F','TBD'];
  const stat = ['Active','Closed'];
  const chk = (set, val, group) =>
    `<label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid var(--border);border-radius:14px;font-size:11px;cursor:pointer;background:${set.has(val)?'var(--accent)':'var(--surface)'};color:${set.has(val)?'white':'var(--text)'};">
       <input type="checkbox" ${set.has(val)?'checked':''} onchange="toggleFilter('${group}','${esc(val).replace(/'/g,"\\'")}',this.checked);openFilterModal();" style="display:none;">
       ${esc(val)}
     </label>`;

  openModal('Advanced Filters', `
    <div style="display:grid;gap:18px;max-height:65vh;overflow-y:auto;padding-right:6px;">

      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Tier</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${tiers.map(t=>chk(vFilters.tiers,t,'tiers')).join('')}</div>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Status</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${stat.map(s=>chk(vFilters.status,s,'status')).join('')}</div>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Product Categories (top-level)</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${cats.map(c=>chk(vFilters.cats,c,'cats')).join('')}</div>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Has Product Categories?</div>
        <select onchange="vFilters.hasCategories=this.value;" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">
          <option value="" ${!vFilters.hasCategories?'selected':''}>Any</option>
          <option value="yes" ${vFilters.hasCategories==='yes'?'selected':''}>Yes — has categories assigned</option>
          <option value="no"  ${vFilters.hasCategories==='no'?'selected':''}>No — needs categories</option>
        </select>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Rep Group <span style="font-weight:400;text-transform:none;color:var(--text-3);">(${vFilters.reps.size} selected)</span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;max-height:140px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">${reps.map(r=>chk(vFilters.reps,r,'reps')).join('')}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">5-Yr Sales ($)</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="number" placeholder="min" value="${vFilters.salesMin}" onchange="vFilters.salesMin=this.value;" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
            <span style="color:var(--text-3);">to</span>
            <input type="number" placeholder="max" value="${vFilters.salesMax}" onchange="vFilters.salesMax=this.value;" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
          </div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Weighted Score</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="number" step="0.1" min="0" max="10" placeholder="min" value="${vFilters.scoreMin}" onchange="vFilters.scoreMin=this.value;" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
            <span style="color:var(--text-3);">to</span>
            <input type="number" step="0.1" min="0" max="10" placeholder="max" value="${vFilters.scoreMax}" onchange="vFilters.scoreMax=this.value;" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
          </div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Min Scored Categories (0-14)</div>
          <input type="number" min="0" max="14" value="${vFilters.scoredCatsMin}" onchange="vFilters.scoredCatsMin=this.value;" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Sales Trend % (5yr)</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="number" placeholder="min %" value="${vFilters.trendMin}" onchange="vFilters.trendMin=this.value;" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
            <span style="color:var(--text-3);">to</span>
            <input type="number" placeholder="max %" value="${vFilters.trendMax}" onchange="vFilters.trendMax=this.value;" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;">
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:14px;border-top:1px solid var(--border);">
        <button class="btn btn-outline" onclick="resetAdvancedFilters();closeModal();renderVendors($('pg-content'))">Reset All</button>
        <button class="btn btn-accent" onclick="closeModal();renderVendors($('pg-content'))">Apply Filters</button>
      </div>
    </div>
  `);
}

function toggleFilter(group, val, on){
  const set = vFilters[group];
  if(!set || !(set instanceof Set)) return;
  if(on) set.add(val); else set.delete(val);
}


