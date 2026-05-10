// ── SUPABASE CATEGORIES MODULE (extracted from index.html at v6.11.1) ──
// ── SUPABASE REALTIME CLIENT (lazy) ─────────────────────────
// REST goes through sbFetch; this client exists only to open WebSocket
// channels for postgres_changes (Realtime). Initialized on first use.
let _sbRT = null;
function sbRealtime(){
  if(_sbRT) return _sbRT;
  if(typeof supabase === 'undefined' || !supabase.createClient) return null;
  const key = sbKey(); if(!key) return null;
  try{
    _sbRT = supabase.createClient(SUPABASE_URL, key, {
      auth: { persistSession:false, autoRefreshToken:false },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    const jwt = (typeof jwtKey==='function' ? jwtKey() : '');
    if(jwt && _sbRT.realtime?.setAuth) _sbRT.realtime.setAuth(jwt);
  }catch(e){ console.warn('[realtime] init failed:', e.message); _sbRT = null; }
  return _sbRT;
}

// Load all vendor categories from Supabase into vendorProductCats.
async function sbLoadCategories(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/vendor_categories?select=vendor_id,categories');
    let n = 0;
    rows.forEach(r => {
      if(Array.isArray(r.categories)){
        vendorProductCats[r.vendor_id] = new Set(r.categories);
        n++;
      }
    });
    console.log(`[sb] Loaded ${n} vendor category rows`);
    return n;
  }catch(e){
    console.warn('[sb] Load categories failed:', e.message);
    return false;
  }
}

// Upsert one vendor's categories.
async function sbSaveCategories(vendorId, categoriesSet, userName){
  if(!sbConfigured()) return false;
  if(vendorId === null || vendorId === undefined){
    console.warn('[sb] sbSaveCategories called with no vendorId — aborting');
    if(typeof toast==='function') toast('Internal error: no vendor ID', 'err');
    return false;
  }
  try{
    const arr = [...categoriesSet];
    await sbFetch('/vendor_categories', {
      method: 'POST',
      headers: {'Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify({
        vendor_id: vendorId,
        categories: arr,
        updated_at: new Date().toISOString(),
        updated_by: userName || (typeof CU!=='undefined' && CU?.name) || 'Unknown'
      })
    });
    return true;
  }catch(e){
    console.warn('[sb] Save categories failed:', e.message);
    toast('Categories saved locally only — Supabase error', '');
    return false;
  }
}

// ── VENDOR SCORE STATES (v6.9.5) ──
// Per-(vendor,category) verification state. Schema:
//   vendor_score_states(vendor_id text, category_key text, data_state text,
//                       verified_at timestamptz, verified_by text, updated_at timestamptz)
// Loaded on startup; merged into VD[i]._meta[catKey].

async function sbLoadScoreStates(){
  if(!sbConfigured()) return false;
  if(typeof VD === 'undefined' || !Array.isArray(VD)) return false;
  try{
    // Paginate to handle Supabase default 1000-row cap.
    const PAGE = 1000;
    let offset = 0, all = [];
    while(true){
      const batch = await sbFetch(`/vendor_score_states?select=vendor_id,category_key,data_state,verified_at,verified_by&offset=${offset}&limit=${PAGE}`);
      if(!Array.isArray(batch) || !batch.length) break;
      all = all.concat(batch);
      if(batch.length < PAGE) break;
      offset += PAGE;
    }
    // Index VD by id (string + numeric tolerance) for fast merge.
    const byId = {};
    VD.forEach(v => { byId[String(v.id)] = v; });
    let touchedVendors = new Set();
    all.forEach(r => {
      const v = byId[String(r.vendor_id)];
      if(!v) return;
      v._meta = v._meta || {};
      v._meta[r.category_key] = Object.assign({}, v._meta[r.category_key] || {}, {
        data_state: r.data_state,
        verified_at: r.verified_at,
        verified_by: r.verified_by
      });
      touchedVendors.add(v.id);
    });
    console.log(`[vendor_score_states] Loaded ${all.length} rows for ${touchedVendors.size} vendors`);
    return all.length;
  }catch(e){
    console.warn('[sb] Load score states failed:', e.message);
    return false;
  }
}

