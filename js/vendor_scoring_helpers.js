// ── VENDOR SCORING HELPERS (extracted from index.html at v6.11.1) ──
// CHANGELOG, logChange, weightedScore, scoredCount, tier, scoreColor, fmt$, etc.


// Change log
let CHANGELOG=[];
function logChange(vendorName,cat,oldVal,newVal,user){
  const entry = {ts:new Date().toISOString(),vendor:vendorName,cat,oldVal,newVal,user:user||CU?.name||'Unknown'};
  // Append to in-memory CHANGELOG and (if configured) persist to Supabase
  if(typeof sbAppendChangelog==='function'){
    sbAppendChangelog(entry);  // unshifts to CHANGELOG inside
  } else {
    CHANGELOG.unshift(entry);
  }
}

// ── SCORING HELPERS ───────────────────────────────────────

// Eligibility data loaded from vendor_eligibility table (override_tier, etc.).
// Keyed by vendor.id (number coerced to string for lookups).
let VENDOR_ELIGIBILITY = {};

// Tier B vendors are scored on a reduced category set only. Spec: Discount, Freight, Returns, Lead Time.
// 'leadTime' is not yet in CAT_DEFS — listed here for forward-compat when it's added.
const TIER_B_KEYS = ['discounts','freight','returns','leadTime'];

// TODO: Make tier thresholds dynamic per vendor type / product offering category.
// Current values are static ($10K lifetime, 24mo recency). Deferred per Michael 2026-05-04.
function computeVendorTier(v){
  if(!v) return 'C';
  // Override priority: in-vendor field (from vendor_overrides) → eligibility cache → computed
  if(v.tier_override) return v.tier_override;
  const elig = VENDOR_ELIGIBILITY[v.id] || VENDOR_ELIGIBILITY[String(v.id)];
  if(elig && elig.override_tier) return elig.override_tier;
  const lifetime = (v.sales && v.sales.t) || 0;
  const years = Object.keys(v.sales || {}).filter(k => /^\d{4}$/.test(k)).map(Number);
  const lastYear = years.length ? Math.max(...years) : null;
  // 24-month recency window — proxy via year (today: 2026-05-04 → cutoff year 2024).
  const cutoffYear = new Date().getFullYear() - 2;
  const recent = lastYear !== null && lastYear >= cutoffYear;
  if(recent && lifetime >= 10000) return 'A';
  if(recent && lifetime <  10000) return 'B';
  return 'C';
}

// Verification state per vendor+category. Defaults: explicit 'na' score → 'na'; otherwise 'unverified'.
function getDataState(v, catKey){
  const m = v && v._meta && v._meta[catKey];
  if(m && m.data_state) return m.data_state;
  const s = v && v.scores ? v.scores[catKey] : undefined;
  if(s === 'na') return 'na';
  return 'unverified';
}

// Hybrid scoring with eligibility tiers + verification states.
//   verified   → score as-is, included in weighted average
//   unverified → score TREATED AS 0, included, unverifiedCount++
//   na         → category EXCLUDED entirely (denominator shrinks)
//   tier C vendor → return null (not scored)
//   tier B vendor → only TIER_B_KEYS contribute; everything else treated as 'na'
function vendorScore(v){
  if(!v) return {score:null, tier:null, unverifiedCount:0};
  const t = computeVendorTier(v);
  if(t === 'C') return {score:null, tier:'C', unverifiedCount:0};
  let wSum=0, wTotal=0, unverifiedCount=0;
  CAT_DEFS.forEach(c=>{
    if(t === 'B' && !TIER_B_KEYS.includes(c.key)) return;
    const ds = getDataState(v, c.key);
    if(ds === 'na') return;
    const s = v.scores[c.key];
    if(ds === 'verified' && typeof s === 'number'){
      wSum += s * c.weight;
      wTotal += c.weight;
    } else {
      // unverified → contributes 0; weight still counted
      wTotal += c.weight;
      unverifiedCount++;
    }
  });
  return {
    score: wTotal>=20 ? Math.round((wSum/wTotal)*10)/10 : null,
    tier: t,
    unverifiedCount
  };
}

function unverifiedCountFor(v){ return vendorScore(v).unverifiedCount; }

// weightedScore: now tier-aware when called with a vendor object (preferred).
// Legacy callers passing v.scores get the classic weighted average (no tier/data_state logic).
function weightedScore(arg){
  if(arg && typeof arg === 'object' && arg.scores){
    return vendorScore(arg).score;
  }
  const scores = arg || {};
  let wSum=0,wTotal=0;
  CAT_DEFS.forEach(c=>{
    const s=scores[c.key];
    const w=c.weight;
    if(typeof s==='number'){wSum+=s*w;wTotal+=w;}
  });
  return wTotal>=20?Math.round((wSum/wTotal)*10)/10:null;
}
function scoredCount(scores){return CAT_DEFS.filter(c=>typeof scores[c.key]==='number').length;}
function tier(score){
  if(score===null)return null;
  if(score>=8)return'A';if(score>=6.5)return'B';if(score>=5)return'C';if(score>=3.5)return'D';return'F';
}
function tierBadge(t){if(!t)return`<span class="na">TBD</span>`;const cls={A:'tier-a',B:'tier-b',C:'tier-c',D:'tier-d',F:'tier-f'};return`<span class="${cls[t]||'tier-d'}">${t}</span>`;}

// Jump from Rep View "N unverified" badge into the Scores tab edit modal for that vendor.
function filterScoresUnverified(vendorId){
  if(typeof vSection !== 'undefined'){ vSection = 'scores'; }
  if(typeof goTo === 'function' && curPage !== 'vendors'){ goTo('vendors'); }
  else if(typeof renderVendors === 'function' && $('pg-content')){ renderVendors($('pg-content')); }
  setTimeout(()=>{ if(typeof openVendorScoreEntry === 'function') openVendorScoreEntry(vendorId); }, 60);
}
function scoreColor(s){if(s===null||s==='na')return'var(--border)';if(s>=8)return'var(--green)';if(s>=6)return'var(--blue)';if(s>=4)return'var(--yellow)';return'var(--accent)';}
// Heatmap palette for 0-10 rubric. Cell background by score level.
function heatColor(s){
  if(s===null||s===undefined||s==='na'||s==='') return '#f4f4f2';
  const n = typeof s === 'number' ? s : parseFloat(s);
  if(isNaN(n)) return '#f4f4f2';
  if(n>=9) return '#1b5e20';      // dark green
  if(n>=8) return '#2e7d32';      // green
  if(n>=7) return '#66bb6a';      // light green
  if(n>=6) return '#aed581';      // lime
  if(n>=5) return '#fff59d';      // yellow
  if(n>=4) return '#ffcc80';      // light orange
  if(n>=3) return '#ff8a65';      // orange-red
  if(n>=2) return '#ef5350';      // red
  if(n>=1) return '#c62828';      // dark red
  return '#8e0000';               // very dark red for 0
}
function heatTextColor(s){
  if(s===null||s===undefined||s==='na'||s==='') return '#999';
  const n = typeof s === 'number' ? s : parseFloat(s);
  if(isNaN(n)) return '#999';
  // light bg (5-6 range) needs dark text; everything else light
  if(n>=4 && n<=6) return '#222';
  return '#fff';
}
function dispScore(s){if(s===null)return`<span class="na">—</span>`;if(s==='na')return`<span class="na">N/A</span>`;return s;}
function fmt$(n){if(!n||isNaN(n))return'—';return'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:0});}

let vFilter='',vTier='All',vRep='All',vScoredOnly=false,vSection='scores';
let vGroupByParent=false;


// Brief rubric summary for column header tooltips (task 8).
function colSummary(catKey){
  const c = CAT_DEFS.find(x=>x.key===catKey);
  if(!c) return '';
  const summaries = {
    rebates: '0-10 score on rebate %. 10=≥6%, 5=2-2.4%, 0=none.',
    discounts: '0-10 on discount %. 10=≥20%, 5=6-7%, 0=none.',
    credit: '0-10 on Net days. 10=Net 120+, 5=Net 30, 0=no credit.',
    freight: '0-10 on free freight $ threshold (lower=better). 10=<$500, 5=$2000-2499, 0=none.',
    returns: '0-10 on return policy. 10=free returns no fee, 5=≤25% restock, 0=no returns.',
    imap: '0-10 on IMAP enforcement. 10=strict, 5=weak, 0=no policy.',
    mktgFunds: '0-10 on co-op/MDF %. 10=≥3%, 5=0.8-0.9%, 0=none.',
    display: '0-10 on showroom display program. 10=100% coverage, 5=15-19%, 0=none.',
    lightsAm: '0-10. 10=on Lights America, 0=not on Lights America.',
    webListing: '0-10 on web dealer locator. 10=premier featured, 7=general dealer, 0=no locator.',
    repScore: '0-10 on rep performance. (Hidden from rep view)',
    dtc: '0-10 on DTC threat (HIGHER=more threat). 0=no DTC, 10=pure DTC competitor.',
    l1Member: '0-10. 10=active Lighting One, 0=not L1.',
    demand: '0-10 on consumer demand. 10=top brand pull, 5=average, 0=no demand.',
  };
  return `${c.label} (weight ${c.weight})\n${summaries[catKey]||''}`;
}

