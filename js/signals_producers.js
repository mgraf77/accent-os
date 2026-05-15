// js/signals_producers.js — Minimal producer adapters for SIGNALS runtime (M49)
// ─────────────────────────────────────────────────────────────────────────────
// Additive. Provides three thin queue producers + the corresponding effect
// implementations that delegate to existing flows. If SIGNALS runtime is not
// available (or Supabase not configured), producers degrade gracefully and
// callers see the same observable behavior as before (no-op queue, fallback
// to direct path where one is wired).
//
// Public producer surface (window-scoped, callable from anywhere):
//   queueCatalogUpsert(product, opts)
//   queueInventorySync(sku, location, opts)
//   queuePricingUpdate(sku, price, opts)
//
// Effect implementations (consumed by signals_runtime.js handlers via the
// window.<name>FromSignal contract):
//   window.catalogUpsertFromSignal(payload)
//   window.inventoryLevelSyncFromSignal(payload)
//   window.pricingUpdateFromSignal(payload)
// ─────────────────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  const SIG_TYPES = {
    catalog:   'catalog.item.upsert.requested',
    inventory: 'inventory.level.sync.requested',
    pricing:   'pricing.update.requested',
  };

  // Lightweight live metrics (producer-side; complements runtime counters).
  const PROD_COUNTERS = {
    catalog_queued: 0,
    catalog_fallback: 0,
    inventory_queued: 0,
    inventory_fallback: 0,
    pricing_queued: 0,
    pricing_fallback: 0,
    last_error: null,
  };

  function _runtimeAvailable(){
    return typeof window.SIGNALS === 'object'
        && window.SIGNALS
        && typeof window.SIGNALS.enqueue === 'function'
        && typeof sbConfigured === 'function'
        && sbConfigured();
  }

  // Stable idempotency key composer. Callers may pass an explicit key in opts.
  function _idem(prefix, parts){
    const tail = parts.filter(x => x != null && x !== '').join(':');
    // Buckets reduce duplicate enqueues within a short window without hiding
    // legitimately new state. 30s bucket is generous and matches worker tick.
    const bucket = Math.floor(Date.now() / 30000);
    return `${prefix}:${tail || 'na'}:${bucket}`;
  }

  async function _enqueueSafe(signal_type, payload, idem, opts){
    if(!_runtimeAvailable()){
      return { queued: false, reason: 'runtime_unavailable' };
    }
    try{
      const r = await window.SIGNALS.enqueue(signal_type, payload || {}, idem, opts || {});
      return { queued: true, id: r && r.id, status: r && r.status };
    }catch(e){
      PROD_COUNTERS.last_error = String(e && e.message || e);
      // Never throw from a producer — preserve caller flow.
      console.debug('[signals.producer] enqueue failed:', e && e.message);
      return { queued: false, reason: 'enqueue_error', error: String(e && e.message || e) };
    }
  }

  // ── Producer: catalog upsert ──────────────────────────────────────────────
  async function queueCatalogUpsert(product, opts){
    if(!product || typeof product !== 'object'){
      return { queued: false, reason: 'invalid_payload' };
    }
    const sku = product.sku || product.bc_product_id || product.id || null;
    const idem = (opts && opts.idempotency_key)
              || _idem('cat.upsert', [sku, product.bc_date_modified || '']);
    const out = await _enqueueSafe(SIG_TYPES.catalog, { product, sku }, idem, opts);
    if(out.queued) PROD_COUNTERS.catalog_queued++;
    else PROD_COUNTERS.catalog_fallback++;
    return out;
  }

  // ── Producer: inventory level sync ────────────────────────────────────────
  async function queueInventorySync(sku, location, opts){
    if(!sku){ return { queued: false, reason: 'invalid_payload' }; }
    const idem = (opts && opts.idempotency_key)
              || _idem('inv.sync', [sku, location || 'default']);
    const payload = { sku, location: location || null, level: opts && opts.level };
    const out = await _enqueueSafe(SIG_TYPES.inventory, payload, idem, opts);
    if(out.queued) PROD_COUNTERS.inventory_queued++;
    else PROD_COUNTERS.inventory_fallback++;
    return out;
  }

  // ── Producer: pricing update ──────────────────────────────────────────────
  async function queuePricingUpdate(sku, price, opts){
    if(!sku || price == null){
      return { queued: false, reason: 'invalid_payload' };
    }
    const idem = (opts && opts.idempotency_key)
              || _idem('price.update', [sku, String(price)]);
    const payload = { sku, price, currency: (opts && opts.currency) || 'USD' };
    const out = await _enqueueSafe(SIG_TYPES.pricing, payload, idem, opts);
    if(out.queued) PROD_COUNTERS.pricing_queued++;
    else PROD_COUNTERS.pricing_fallback++;
    return out;
  }

  // ── Effect implementations (delegate to existing modules) ─────────────────
  // These are installed only if no upstream implementation has already claimed
  // the slot. They use the well-known module APIs already shipped in this app.

  if(typeof window.catalogUpsertFromSignal !== 'function'){
    window.catalogUpsertFromSignal = async function(payload){
      const product = (payload && payload.product) || null;
      if(!product) return { skipped: true, reason: 'no_product' };
      // Delegate to existing BC catalog→Supabase sync helper when present.
      // bcSyncCatalogToSupabase accepts arrays; we pass a 1-element wrap.
      if(typeof window.bcSyncCatalogToSupabase === 'function'){
        const r = await window.bcSyncCatalogToSupabase([product], [], []);
        return { delegated: 'bcSyncCatalogToSupabase', result: r };
      }
      // No fallback target: report as inert success so the signal finalizes.
      return { delegated: null, noop: true };
    };
  }

  if(typeof window.inventoryLevelSyncFromSignal !== 'function'){
    window.inventoryLevelSyncFromSignal = async function(payload){
      // Replay-safe shallow write: update inventory_level on cached BC row
      // when a level is provided. Skip silently when row not present.
      if(!payload || !payload.sku) return { skipped: true, reason: 'no_sku' };
      if(payload.level == null) return { skipped: true, reason: 'no_level' };
      if(typeof sbConfigured !== 'function' || !sbConfigured()){
        return { skipped: true, reason: 'sb_not_configured' };
      }
      try{
        await sbFetch(`/bc_products_cache?sku=eq.${encodeURIComponent(payload.sku)}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ inventory_level: payload.level, synced_at: new Date().toISOString() }),
        });
        return { patched: true, sku: payload.sku, level: payload.level };
      }catch(e){
        // Bubble so the signal retries with backoff.
        throw new Error('inventory sync failed: ' + (e && e.message || e));
      }
    };
  }

  if(typeof window.pricingUpdateFromSignal !== 'function'){
    window.pricingUpdateFromSignal = async function(payload){
      if(!payload || !payload.sku || payload.price == null){
        return { skipped: true, reason: 'invalid_payload' };
      }
      if(typeof sbConfigured !== 'function' || !sbConfigured()){
        return { skipped: true, reason: 'sb_not_configured' };
      }
      try{
        await sbFetch(`/bc_products_cache?sku=eq.${encodeURIComponent(payload.sku)}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ price: payload.price, synced_at: new Date().toISOString() }),
        });
        return { patched: true, sku: payload.sku, price: payload.price };
      }catch(e){
        throw new Error('pricing update failed: ' + (e && e.message || e));
      }
    };
  }

  // ── Replay-safe lightweight logging (grouped, debug-only) ─────────────────
  // Off by default. Toggle: window.__SIGNALS_TRACE__ = true.
  function _trace(group, detail){
    if(!window.__SIGNALS_TRACE__) return;
    try{
      console.groupCollapsed(`[signals.producer] ${group}`);
      console.log(detail);
      console.groupEnd();
    }catch(_){}
  }
  // Wrap producers with optional tracing without altering return contract.
  const _wrap = (name, fn) => async function(){
    const out = await fn.apply(this, arguments);
    _trace(name, { args: Array.from(arguments), out });
    return out;
  };

  // ── Export ────────────────────────────────────────────────────────────────
  window.queueCatalogUpsert  = _wrap('queueCatalogUpsert',  queueCatalogUpsert);
  window.queueInventorySync  = _wrap('queueInventorySync',  queueInventorySync);
  window.queuePricingUpdate  = _wrap('queuePricingUpdate',  queuePricingUpdate);

  window.SIGNAL_PRODUCERS = {
    queueCatalogUpsert: window.queueCatalogUpsert,
    queueInventorySync: window.queueInventorySync,
    queuePricingUpdate: window.queuePricingUpdate,
    _counters: PROD_COUNTERS,
    _types: SIG_TYPES,
    runtimeAvailable: _runtimeAvailable,
  };
})();
