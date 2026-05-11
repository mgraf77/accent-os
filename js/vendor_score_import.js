// ── BULK VENDOR SCORE CSV IMPORT (v6.10.47) ──
// Wide-format CSV: one row per vendor, with columns matching CAT_DEFS keys.
// Each row gets expanded into N (vendor_id, category_key, score) tuples
// and bulk-saved to vendor_scores via on_conflict on (vendor_id, category_key).
//
// Uses the csvImportFlow helper from v6.10.45 with a custom postProcess that
// stamps the row with the resolved vendor_id and the per-category score map.
// The bulkSave function then performs the wide→long expansion.
register({ name: 'vendor_score_import', provides: ['vendor_score_import','sbBulkSaveVendorScores','openVendorScoreCsvPaste','downloadVendorScoreCsvTemplate','onVendorScoreFilePick','processVendorScoreCsvText','commitVendorScoreCsv'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast','CAT_DEFS','VD','csvImportFlow'] });

async function sbBulkSaveVendorScores(rows){
  if(!sbConfigured()) return false;
  if(!Array.isArray(rows) || !rows.length) return 0;
  // Expand wide format to long format
  const now = new Date().toISOString();
  const updatedBy = (CU?.name) || 'Bulk Import';
  const longRows = [];
  for(const r of rows){
    if(!r._vendor_id) continue;   // unmatched vendor — skipped at expansion time
    for(const key of (r._scoreKeys || [])){
      const score = r[key];
      if(score == null || score === '' || isNaN(Number(score))) continue;
      const n = Number(score);
      if(n < 0 || n > 10) continue;
      longRows.push({
        vendor_id: r._vendor_id,
        category_key: key,
        score: n,
        justification: null,
        components: null,
        updated_at: now,
        updated_by: updatedBy
      });
    }
  }
  if(!longRows.length) return 0;
  try{
    const headers = {'Prefer':'resolution=merge-duplicates,return=minimal'};
    await sbFetch('/vendor_scores?on_conflict=vendor_id,category_key', {
      method:'POST', headers, body: JSON.stringify(longRows)
    });
    return longRows.length;
  }catch(e){ console.warn('[sb] Bulk save vendor_scores failed:', e.message); return false; }
}

// Build the alias map from CAT_DEFS so column headers can use either the
// internal key (e.g. "rebates") or a slug of the label (e.g. "rebates",
// "freight", "credit_terms").
function _buildVendorScoreAliasMap(){
  const m = { 'vendor_name':'vendor_name', 'vendor':'vendor_name', 'name':'vendor_name', 'manufacturer':'vendor_name', 'brand':'vendor_name' };
  if(typeof CAT_DEFS === 'undefined') return m;
  for(const c of CAT_DEFS){
    m[c.key.toLowerCase()] = c.key;
    const slug = c.label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    if(slug && !m[slug]) m[slug] = c.key;
    // Common short forms
    if(c.key === 'mktgFunds') { m['mktg_funds'] = 'mktgFunds'; m['marketing_funds'] = 'mktgFunds'; }
    if(c.key === 'lightsAm') { m['lights_am'] = 'lightsAm'; m['lights_americana'] = 'lightsAm'; }
    if(c.key === 'webListing') { m['web_listing'] = 'webListing'; m['web'] = 'webListing'; }
    if(c.key === 'repScore') { m['rep_score'] = 'repScore'; m['rep'] = 'repScore'; }
    if(c.key === 'l1Member') { m['l1_member'] = 'l1Member'; m['l1'] = 'l1Member'; }
  }
  return m;
}

(function registerVendorScoreImport(){
  if(typeof csvImportFlow !== 'function') return;
  if(typeof CAT_DEFS === 'undefined') return;

  const catKeys = CAT_DEFS.map(c => c.key);
  // Per-category normalizer: clamp to 0-10
  const normalizers = {};
  for(const k of catKeys){
    normalizers[k] = (val) => {
      if(val === '' || val == null) return null;
      const n = Number(val);
      if(isNaN(n) || n < 0 || n > 10) return null;
      return n;
    };
  }

  csvImportFlow({
    key: 'vendorScore',
    label: 'Vendor',
    labelPlural: 'Vendors',
    templateName: 'vendor_scores_template',
    tableName: 'vendor_scores',
    pasteHelp: 'vendor_name,rebates,discounts,credit,freight,returns,...',
    templateRows: [
      ['vendor_name', ...catKeys],
      ['Hinkley', '8','7','9','7','8','7','6','7','5','7','8','6','7','9'],
      ['Hudson Valley Lighting', '7','8','8','7','8','8','6','8','6','8','8','7','8','8']
    ],
    aliasMap: _buildVendorScoreAliasMap(),
    requiredFields: ['vendor_name'],
    normalizers,
    postProcess: (obj, ctx) => {
      // Resolve vendor_name → vendor_id from VD
      if(typeof VD !== 'undefined'){
        const match = VD.find(v => v?.n && v.n.toLowerCase().trim() === obj.vendor_name.toLowerCase().trim());
        if(match){
          obj._vendor_id = String(match.id);
        } else {
          if(!ctx.trackers.vendor) ctx.trackers.vendor = { unmatched: new Set() };
          ctx.trackers.vendor.unmatched.add(obj.vendor_name);
        }
      }
      // Track which category keys this row carries values for
      obj._scoreKeys = catKeys.filter(k => obj[k] != null && obj[k] !== '');
      // Track row-level score count for the preview
      obj._scoreCount = obj._scoreKeys.length;
    },
    previewColumns: [
      { label: 'Vendor', cell: r => `<span style="font-weight:500;">${esc(r.vendor_name||'')}</span>${r._vendor_id ? ' <span class="muted sm">·linked</span>' : ' <span style="color:var(--accent);">·no match</span>'}` },
      { label: 'Scores', cell: r => `<span class="mono sm">${r._scoreCount||0}/${catKeys.length}</span>` },
      { label: 'Sample', cell: r => {
        const sample = (r._scoreKeys||[]).slice(0,4).map(k => `${k}:${r[k]}`).join(' · ');
        return `<span class="muted sm">${esc(sample)}${(r._scoreKeys||[]).length>4?'…':''}</span>`;
      }}
    ],
    bulkSave: sbBulkSaveVendorScores,
    onSuccess: async () => {
      if(typeof sbLoadVendorScores === 'function') await sbLoadVendorScores();
      if(typeof renderVendors === 'function' && typeof $ === 'function'){
        const el = $('pg-content');
        if(el) renderVendors(el);
      }
    },
    auditEvent: 'vendor_scores_import'
  });
})();
