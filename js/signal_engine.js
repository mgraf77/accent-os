// ── SIGNAL ENGINE — Phase 1 orchestration ──
// Lightweight signal lifecycle: emit → dedupe → cooldown → suppress → persist → audit.
// Backed by tables in sql/M49_signals_schema.sql.
//
// Replay-safe philosophy:
//   * Rules are pure functions of (state, baselines). They live in signal_rules_phase1.js.
//   * The engine itself contains no rule logic — only routing and persistence.
//   * All writes are idempotent on (signal_name, entity_id, open).
//   * Audit entries are append-only.
//
// No invasive runtime integration: the engine is opt-in. Callers do:
//   SignalEngine.emit({signal_name, entity_id, trigger_snapshot, ...})
//   SignalEngine.evaluateAll()    // runs registered scheduled rules
//   SignalEngine.openSignals(opts)
//   SignalEngine.ack(signal_id) / SignalEngine.dismiss(signal_id, reason)

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  if(!RT){ console.warn('[signals] SignalRuntime missing — load order issue'); return; }

  // ─── In-memory mirrors. Filled from Supabase on hydrate; kept fresh on emit. ───
  let SIGNALS_OPEN = [];        // open signals (read-side cache for UI)
  let LAST_EMIT_AT = Object.create(null); // dedupeKey → epoch ms (cooldown gate)
  let HYDRATED_AT  = 0;

  // ─── Scheduled rule registry (event-driven rules just call emit directly) ───
  const SCHEDULED_RULES = [];

  function registerRule(rule){
    if(!rule || typeof rule.evaluate !== 'function' || !rule.id){
      throw new Error('registerRule: needs {id, evaluate}');
    }
    SCHEDULED_RULES.push(rule);
  }

  function rulesIndex(){
    return SCHEDULED_RULES.map(r => ({ id: r.id, cadence: r.cadence || 'on-demand' }));
  }

  // ─── Persistence helpers (Supabase via global sbFetch / sbConfigured) ───
  function sbReady(){
    return typeof global.sbConfigured === 'function' && global.sbConfigured();
  }

  async function sbInsert(table, row){
    if(!sbReady()) return null;
    return global.sbFetch(`/${table}`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Prefer':'return=representation' },
      body: JSON.stringify(row),
    });
  }

  async function sbPatch(table, filter, patch){
    if(!sbReady()) return null;
    return global.sbFetch(`/${table}?${filter}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', 'Prefer':'return=representation' },
      body: JSON.stringify(patch),
    });
  }

  async function sbSelect(table, query){
    if(!sbReady()) return [];
    try{
      const rows = await global.sbFetch(`/${table}?${query}`);
      return Array.isArray(rows) ? rows : [];
    }catch(e){
      console.warn(`[signals] select ${table} failed`, e.message||e);
      return [];
    }
  }

  // ─── Hydration ───
  async function hydrate(){
    if(!sbReady()){ HYDRATED_AT = Date.now(); return SIGNALS_OPEN; }
    SIGNALS_OPEN = await sbSelect('signals',
      'select=id,signal_name,category,severity,entity_type,entity_id,owner_role,source_system,trigger_snapshot,recommended_action,created_at,last_observed_at,acknowledged_at,resolved_at,dismissed_at,is_open' +
      '&is_open=eq.true&order=created_at.desc&limit=500'
    );
    // Seed cooldown map from open signals so reloads don't re-fire.
    LAST_EMIT_AT = Object.create(null);
    for(const s of SIGNALS_OPEN){
      LAST_EMIT_AT[`${s.signal_name}::${s.entity_id || '_global_'}`] =
        new Date(s.last_observed_at || s.created_at).getTime();
    }
    HYDRATED_AT = Date.now();
    return SIGNALS_OPEN;
  }

  // ─── Suppression gates ───
  function withinCooldown(rec){
    const key = RT.dedupeKey(rec);
    const last = LAST_EMIT_AT[key];
    if(!last) return false;
    const cd = RT.COOLDOWN_MS[rec.severity] ?? RT.COOLDOWN_MS.warning;
    return (Date.now() - last) < cd;
  }

  function findOpen(rec){
    const key = RT.dedupeKey(rec);
    return SIGNALS_OPEN.find(s =>
      s.signal_name === rec.signal_name &&
      (s.entity_id || '_global_') === (rec.entity_id || '_global_')
    );
  }

  // ─── Emit ───
  async function emit(partial){
    let rec;
    try{ rec = RT.normalize(partial); }
    catch(e){ console.warn('[signals] normalize failed', e.message); return { ok:false, reason:'normalize_failed' }; }

    // Stale-source gate: caller can pass sourceAgeMs in trigger_snapshot.__sourceAgeMs.
    const def = RT.getDef(rec.signal_name);
    const ageMs = partial?.trigger_snapshot?.__sourceAgeMs;
    if(ageMs != null && def?.stale_tolerance_ms != null && RT.isStale(ageMs, def.stale_tolerance_ms)){
      return { ok:false, reason:'stale_source' };
    }

    const existing = findOpen(rec);

    // Cooldown / dedupe: same open signal → bump last_observed_at, no new row, no notify.
    if(existing){
      const now = new Date().toISOString();
      LAST_EMIT_AT[RT.dedupeKey(rec)] = Date.now();
      existing.last_observed_at = now;
      if(sbReady()){
        sbPatch('signals', `id=eq.${existing.id}`, { last_observed_at: now }).catch(()=>{});
      }
      return { ok:true, reason:'deduped', signal_id: existing.id };
    }
    if(withinCooldown(rec)){
      return { ok:false, reason:'cooldown' };
    }

    const row = {
      ...rec,
      created_at: new Date().toISOString(),
      last_observed_at: new Date().toISOString(),
    };

    if(!sbReady()){
      // Offline / pre-Supabase mode: keep in-memory only.
      const id = `local_${Math.random().toString(36).slice(2,10)}`;
      const local = { id, ...row, is_open:true };
      SIGNALS_OPEN.unshift(local);
      LAST_EMIT_AT[RT.dedupeKey(rec)] = Date.now();
      return { ok:true, reason:'emitted_local', signal_id: id };
    }

    try{
      const inserted = await sbInsert('signals', row);
      const persisted = Array.isArray(inserted) ? inserted[0] : inserted;
      if(persisted){
        SIGNALS_OPEN.unshift({ ...persisted, is_open:true });
        LAST_EMIT_AT[RT.dedupeKey(rec)] = Date.now();
        await audit(persisted.id, 'created', { severity: rec.severity });
      }
      return { ok:true, reason:'emitted', signal_id: persisted?.id };
    }catch(e){
      console.warn('[signals] emit failed', e.message||e);
      return { ok:false, reason:'persist_failed', error: e.message };
    }
  }

  // ─── Acknowledge / dismiss / resolve ───
  async function audit(signal_id, event, payload){
    if(!sbReady() || !signal_id || String(signal_id).startsWith('local_')) return;
    try{
      await sbInsert('signal_audit', {
        signal_id, event, payload: payload || {},
        actor_role: global.AUTH_ROLE || null,
      });
    }catch(e){ /* audit failures are non-fatal */ }
  }

  async function ack(signal_id){
    const now = new Date().toISOString();
    const local = SIGNALS_OPEN.find(s => s.id === signal_id);
    if(local) local.acknowledged_at = now;
    if(sbReady() && !String(signal_id).startsWith('local_')){
      await sbPatch('signals', `id=eq.${signal_id}`, { acknowledged_at: now }).catch(()=>{});
      await audit(signal_id, 'acknowledged', {});
    }
    return { ok:true };
  }

  async function dismiss(signal_id, reason){
    const now = new Date().toISOString();
    SIGNALS_OPEN = SIGNALS_OPEN.filter(s => s.id !== signal_id);
    if(sbReady() && !String(signal_id).startsWith('local_')){
      await sbPatch('signals', `id=eq.${signal_id}`, { dismissed_at: now, dismiss_reason: reason || null }).catch(()=>{});
      await audit(signal_id, 'dismissed', { reason });
    }
    return { ok:true };
  }

  async function resolve(signal_id){
    const now = new Date().toISOString();
    SIGNALS_OPEN = SIGNALS_OPEN.filter(s => s.id !== signal_id);
    if(sbReady() && !String(signal_id).startsWith('local_')){
      await sbPatch('signals', `id=eq.${signal_id}`, { resolved_at: now }).catch(()=>{});
      await audit(signal_id, 'resolved', {});
    }
    return { ok:true };
  }

  // ─── Read-side ───
  function openSignals(opts){
    const o = opts || {};
    let out = SIGNALS_OPEN.slice();
    if(o.owner_role) out = out.filter(s => s.owner_role === o.owner_role);
    if(o.minSeverity){
      const min = RT.SEVERITY_RANK[o.minSeverity] ?? 0;
      out = out.filter(s => (RT.SEVERITY_RANK[s.severity] ?? 0) >= min);
    }
    // Priority order: severity desc, then age desc (older first → aging-out visible).
    out.sort((a,b) => {
      const dr = (RT.SEVERITY_RANK[b.severity] ?? 0) - (RT.SEVERITY_RANK[a.severity] ?? 0);
      if(dr) return dr;
      return new Date(a.created_at) - new Date(b.created_at);
    });
    return out;
  }

  // ─── Scheduled rule evaluation ───
  // Each rule: { id, cadence?, evaluate: async (ctx) => [emitted-records] }
  // Returns a summary; never throws.
  async function evaluateAll(opts){
    const ctx = (opts && opts.ctx) || {};
    const onlyCadence = opts && opts.cadence;
    const results = [];
    for(const rule of SCHEDULED_RULES){
      if(onlyCadence && rule.cadence !== onlyCadence) continue;
      try{
        const candidates = await rule.evaluate(ctx);
        const arr = Array.isArray(candidates) ? candidates : [];
        const outcomes = [];
        for(const c of arr){
          outcomes.push(await emit(c));
        }
        results.push({ rule: rule.id, emitted: outcomes.length, summary: outcomes.reduce((acc,o)=>{
          acc[o.reason] = (acc[o.reason]||0)+1; return acc;
        }, {}) });
      }catch(e){
        console.warn(`[signals] rule '${rule.id}' threw`, e.message||e);
        results.push({ rule: rule.id, error: e.message||String(e) });
      }
    }
    return results;
  }

  global.SignalEngine = {
    hydrate,
    emit,
    ack, dismiss, resolve,
    openSignals,
    registerRule,
    rulesIndex,
    evaluateAll,
    // Diagnostics
    _state: () => ({ open: SIGNALS_OPEN.length, hydratedAt: HYDRATED_AT, rules: SCHEDULED_RULES.length }),
  };
})(typeof window !== 'undefined' ? window : globalThis);
