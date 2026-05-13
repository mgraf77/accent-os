// ── BIGCOMMERCE READ-ONLY ADAPTER (Track 6.3 runway) ──────────────────────────
// Safe, observable, read-only interface to BigCommerce V3/V2 REST API.
// Store: store-cwqiwcjxes.mybigcommerce.com
//
// TOKEN NOT YET AVAILABLE — gracefully degrades to "pending" state until
// Michael completes M04. All public surfaces check bcConfigured() first.
//
// This module provides:
//   bcConfigured()           → bool — token + store hash present
//   bcGetConfig()            → {storeHash, token} or null
//   bcSaveConfig(h, t)       → persist to localStorage (dev) / Supabase (prod)
//   bcFetch(path, opts)      → authenticated GET to BC V3 (rate-limit aware)
//   bcFetchAll(path, params) → paginated fetch, returns full array
//   BC.products.list(opts)   → product catalog
//   BC.products.get(id)      → single product with images+variants
//   BC.categories.list()     → flat category list
//   BC.categories.tree()     → nested tree
//   BC.brands.list()         → brand list
//   BC.summary.get()         → catalog summary (counts, timestamps)
//   BC.priceLists.list()     → price list index
//   BC.priceLists.records(id)→ all price records for a list
//   BC.health.ping()         → lightweight connectivity + latency check
//   BC.syncLog.recent(n)     → last N sync events from Supabase bc_sync_log
//   BC.opportunity.scan()    → compute opportunity flags over cached catalog

// ── CONFIG STORAGE ────────────────────────────────────────────────────────────

const BC_STORE_HASH = 'store-cwqiwcjxes';
const BC_CONFIG_KEY = 'accentos_bc_config';
const BC_CACHE_KEY  = 'accentos_bc_cache';
const BC_API_BASE   = `https://api.bigcommerce.com/stores/${BC_STORE_HASH}/v3`;
const BC_API_V2     = `https://api.bigcommerce.com/stores/${BC_STORE_HASH}/v2`;

// In-memory cache for the session
let _bcConfig = null;
let _bcCache  = { products: null, categories: null, brands: null, summary: null, fetchedAt: null };

function bcConfigured() {
  const cfg = bcGetConfig();
  return !!(cfg && cfg.token && cfg.storeHash);
}

function bcGetConfig() {
  if (_bcConfig) return _bcConfig;
  try {
    const raw = localStorage.getItem(BC_CONFIG_KEY);
    if (raw) { _bcConfig = JSON.parse(raw); return _bcConfig; }
  } catch(e) { /* ignore */ }
  return null;
}

function bcSaveConfig(storeHash, token) {
  _bcConfig = { storeHash: storeHash || BC_STORE_HASH, token };
  try { localStorage.setItem(BC_CONFIG_KEY, JSON.stringify(_bcConfig)); } catch(e) { /* ignore */ }
  console.log('[bc] Config saved. Store:', _bcConfig.storeHash);
}

function bcClearConfig() {
  _bcConfig = null;
  _bcCache  = { products: null, categories: null, brands: null, summary: null, fetchedAt: null };
  try { localStorage.removeItem(BC_CONFIG_KEY); localStorage.removeItem(BC_CACHE_KEY); } catch(e) { /* ignore */ }
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────

let _bcRequestQueue  = [];
let _bcRequestCount  = 0;
let _bcWindowStart   = Date.now();
const BC_RATE_LIMIT  = 120; // conservative — BC allows ~150/min standard plan
const BC_WINDOW_MS   = 60000;

async function _bcRateCheck() {
  const now = Date.now();
  if (now - _bcWindowStart > BC_WINDOW_MS) {
    _bcWindowStart  = now;
    _bcRequestCount = 0;
  }
  if (_bcRequestCount >= BC_RATE_LIMIT) {
    const wait = BC_WINDOW_MS - (now - _bcWindowStart) + 100;
    console.warn(`[bc] Rate limit: waiting ${Math.ceil(wait/1000)}s`);
    await new Promise(r => setTimeout(r, wait));
    _bcWindowStart  = Date.now();
    _bcRequestCount = 0;
  }
  _bcRequestCount++;
}

// ── CORE FETCH ────────────────────────────────────────────────────────────────

async function bcFetch(path, opts = {}) {
  if (!bcConfigured()) throw new Error('BC_NOT_CONFIGURED');
  const cfg = bcGetConfig();
  await _bcRateCheck();

  const base = path.startsWith('/v2/') ? BC_API_V2 : BC_API_BASE;
  const cleanPath = path.startsWith('/v2/') ? path.slice(3) : path;
  const url = base + cleanPath;

  const headers = {
    'X-Auth-Token': cfg.token,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...( opts.headers || {} )
  };

  let res;
  try {
    res = await fetch(url, { method: opts.method || 'GET', headers });
  } catch(e) {
    bcSyncLog('fetch_error', { path, error: e.message });
    throw new Error(`BC network error: ${e.message}`);
  }

  if (res.status === 401) {
    bcSyncLog('auth_error', { path, status: 401 });
    throw new Error('BC_AUTH_FAILED: token invalid or expired');
  }
  if (res.status === 429) {
    bcSyncLog('rate_limit', { path, status: 429 });
    const retry = parseInt(res.headers.get('X-Rate-Limit-Time-Reset-Ms') || '5000');
    await new Promise(r => setTimeout(r, retry + 500));
    return bcFetch(path, opts); // one retry after backoff
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    bcSyncLog('api_error', { path, status: res.status, body: body.slice(0, 200) });
    throw new Error(`BC API ${res.status}: ${body.slice(0, 120)}`);
  }

  return res.json();
}

// Paginated fetch — returns full array across all pages (V3 pagination)
async function bcFetchAll(path, params = {}) {
  const allItems = [];
  let page = 1;
  const limit = params.limit || 250;

  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const qp  = new URLSearchParams({ ...params, page, limit }).toString();
    const data = await bcFetch(`${path}${sep}${qp}`);

    const items = data.data || data || [];
    allItems.push(...(Array.isArray(items) ? items : []));

    const pagination = data.meta?.pagination;
    if (!pagination || page >= pagination.total_pages) break;
    page++;
  }
  return allItems;
}

// ── SYNC LOGGING (writes to Supabase bc_sync_log if available) ────────────────

let _bcSyncBuffer = [];

async function bcSyncLog(event, payload = {}) {
  const entry = {
    event,
    store_hash: BC_STORE_HASH,
    payload,
    occurred_at: new Date().toISOString()
  };
  _bcSyncBuffer.push(entry);

  // Non-blocking flush to Supabase
  if (typeof sbConfigured === 'function' && sbConfigured()) {
    try {
      await sbFetch('/bc_sync_log', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(entry)
      });
    } catch(e) {
      // Table may not exist yet (pre-M45) — buffer only
      console.debug('[bc] sync log write skipped (pre-M45):', e.message);
    }
  }
  console.debug('[bc] sync_log:', event, payload);
}

// ── BC NAMESPACE ─────────────────────────────────────────────────────────────

const BC = {

  // ── HEALTH ──────────────────────────────────────────────────────────────────
  health: {
    async ping() {
      if (!bcConfigured()) return { ok: false, reason: 'not_configured' };
      const t0 = Date.now();
      try {
        await bcFetch('/catalog/summary');
        const ms = Date.now() - t0;
        await bcSyncLog('health_ping', { latency_ms: ms, ok: true });
        return { ok: true, latency_ms: ms };
      } catch(e) {
        await bcSyncLog('health_ping', { ok: false, error: e.message });
        return { ok: false, reason: e.message };
      }
    },

    // Returns a human-readable status object for the UI
    async status() {
      if (!bcConfigured()) {
        return {
          configured: false,
          label: 'Awaiting API token (M04)',
          color: 'var(--yellow)',
          icon: '○'
        };
      }
      const ping = await BC.health.ping();
      if (ping.ok) {
        return {
          configured: true,
          label: `Connected · ${ping.latency_ms}ms`,
          color: 'var(--green)',
          icon: '●'
        };
      }
      if (ping.reason === 'BC_AUTH_FAILED: token invalid or expired') {
        return { configured: true, label: 'Token invalid', color: 'var(--red)', icon: '✕' };
      }
      return { configured: true, label: `Error: ${ping.reason}`, color: 'var(--red)', icon: '✕' };
    }
  },

  // ── CATALOG SUMMARY ─────────────────────────────────────────────────────────
  summary: {
    async get() {
      const data = await bcFetch('/catalog/summary');
      await bcSyncLog('sync_summary', { product_count: data.inventory_count });
      return data;
    }
  },

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  products: {
    async list(opts = {}) {
      const params = {
        include: 'images,custom_fields',
        limit: opts.limit || 250,
        ...opts
      };
      const products = await bcFetchAll('/catalog/products', params);
      await bcSyncLog('sync_products', { count: products.length });
      return products;
    },

    async get(id) {
      const data = await bcFetch(`/catalog/products/${id}?include=images,variants,custom_fields`);
      return data.data || data;
    },

    // Fetch with full variant data — slower, use sparingly
    async listWithVariants(opts = {}) {
      const params = { include: 'images,variants,custom_fields', limit: 250, ...opts };
      return bcFetchAll('/catalog/products', params);
    }
  },

  // ── CATEGORIES ──────────────────────────────────────────────────────────────
  categories: {
    async list() {
      const cats = await bcFetchAll('/catalog/categories', { limit: 250 });
      await bcSyncLog('sync_categories', { count: cats.length });
      return cats;
    },

    async tree() {
      const data = await bcFetch('/catalog/categories/tree');
      return data.data || data;
    }
  },

  // ── BRANDS ──────────────────────────────────────────────────────────────────
  brands: {
    async list() {
      const brands = await bcFetchAll('/catalog/brands', { limit: 250 });
      await bcSyncLog('sync_brands', { count: brands.length });
      return brands;
    }
  },

  // ── PRICE LISTS ─────────────────────────────────────────────────────────────
  priceLists: {
    async list() {
      const lists = await bcFetchAll('/pricelists', { limit: 250 });
      return lists;
    },

    async records(priceListId) {
      return bcFetchAll(`/pricelists/${priceListId}/records`, { limit: 250 });
    }
  },

  // ── SYNC LOG ────────────────────────────────────────────────────────────────
  syncLog: {
    async recent(n = 20) {
      if (typeof sbConfigured !== 'function' || !sbConfigured()) return [];
      try {
        const rows = await sbFetch(
          `/bc_sync_log?order=occurred_at.desc&limit=${n}&select=id,event,store_hash,payload,occurred_at`
        );
        return Array.isArray(rows) ? rows : [];
      } catch(e) {
        console.debug('[bc] syncLog read skipped (pre-M45):', e.message);
        return [];
      }
    },

    async freshness() {
      const rows = await BC.syncLog.recent(50);
      const syncEvents = rows.filter(r => r.event && r.event.startsWith('sync_'));
      if (!syncEvents.length) return null;

      const last = syncEvents[0];
      const ageMs = Date.now() - new Date(last.occurred_at).getTime();
      const ageH  = Math.round(ageMs / 3600000);
      return {
        lastSync: last.occurred_at,
        ageHours: ageH,
        event: last.event,
        stale: ageH > 24
      };
    }
  },

  // ── OPPORTUNITY SCANNERS ─────────────────────────────────────────────────────
  // Each scanner takes a product array and returns { flags[], summary{} }.
  // scanAll() merges all four domains. No ML — pure field checks + thresholds.
  opportunity: {

    // Helper: strip HTML tags and return plain text
    _text(html) { return (html || '').replace(/<[^>]+>/g, '').trim(); },

    // Helper: extract custom field value by name (case-insensitive)
    _cf(p, ...names) {
      const cfs = p.custom_fields || [];
      for (const n of names) {
        const f = cfs.find(c => c.name && c.name.toLowerCase() === n.toLowerCase());
        if (f && f.value) return f.value;
      }
      return null;
    },

    // ── GMC / IMAGE SCANNER ──────────────────────────────────────────────────
    scanGMC(products = []) {
      if (!products.length) return { flags: [], summary: {} };
      const flags = [];

      for (const p of products) {
        const id = p.id || p.bc_product_id;
        const name = p.name || '';
        const sku  = p.sku  || '';
        const imgs = p.images || [];
        const imgCount = p.image_count ?? imgs.length;
        const gtin = this._cf(p, 'GTIN', 'gtin', 'UPC', 'EAN') || p.gtin || null;
        const mpn  = this._cf(p, 'MPN', 'mpn', 'Part Number') || p.mpn || null;
        const textLen = this._text(p.description_html || p.description).length;

        // Missing images entirely
        if (imgCount === 0) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_missing_image',
            severity: 'high', detail: 'No product image — Google will suppress from Shopping' });
        } else if (imgCount < 3) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_low_image_count',
            severity: 'medium', detail: `Only ${imgCount} image${imgCount===1?'':'s'} — 3+ increases CTR` });
        }

        // Description missing or too thin for GMC
        if (textLen < 50) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_missing_description',
            severity: 'high', detail: `Description ${textLen} chars — GMC requires meaningful product copy` });
        }

        // No brand assigned
        if (!p.brand_id) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_missing_brand',
            severity: 'high', detail: 'No brand — required for GMC product listing eligibility' });
        }

        // No GTIN or MPN (identifier exists risk)
        if (!gtin && !mpn) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_no_identifier',
            severity: 'medium', detail: 'No GTIN or MPN in custom fields — affects GMC feed quality score' });
        }

        // Price is zero or missing
        if (!p.price || p.price <= 0) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_no_price',
            severity: 'high', detail: 'Price is 0 or unset — ineligible for Shopping ads' });
        }

        // No category
        const cats = p.categories || [];
        if (!cats.length) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_uncategorized',
            severity: 'medium', detail: 'No category assigned — GMC Google Product Category inference fails' });
        }

        // Condition not set
        if (!p.condition || p.condition === '') {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_condition_unset',
            severity: 'low', detail: 'Product condition not set — GMC defaults to "New" but explicit is safer' });
        }

        // Title too long (GMC truncates at 150 chars)
        if (name.length > 150) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_title_too_long',
            severity: 'low', detail: `Title ${name.length} chars — GMC truncates after 150` });
        }

        // Title too short (weak signal quality)
        if (name.length > 0 && name.length < 20) {
          flags.push({ product_id: id, name, sku, domain: 'gmc', type: 'gmc_title_too_short',
            severity: 'medium', detail: `Title "${name}" is only ${name.length} chars — low descriptiveness` });
        }
      }

      return this._summarize(products.length, flags, 'gmc');
    },

    // ── SEO SCANNER ──────────────────────────────────────────────────────────
    scanSEO(products = []) {
      if (!products.length) return { flags: [], summary: {} };
      const flags = [];

      // Build description fingerprint map for duplicate detection
      const descMap = {};
      for (const p of products) {
        const text = this._text(p.description_html || p.description);
        if (text.length > 80) {
          const fp = text.slice(0, 120).toLowerCase().replace(/\s+/g, ' ');
          descMap[fp] = (descMap[fp] || []);
          descMap[fp].push(p.id || p.bc_product_id);
        }
      }
      const duplicateIds = new Set();
      for (const [, ids] of Object.entries(descMap)) {
        if (ids.length > 1) ids.forEach(id => duplicateIds.add(id));
      }

      for (const p of products) {
        const id   = p.id || p.bc_product_id;
        const name = p.name || '';
        const sku  = p.sku  || '';
        const metaDesc    = (p.meta_description || '').trim();
        const pageTitle   = (p.page_title || '').trim();
        const textContent = this._text(p.description_html || p.description);

        // Missing meta description — biggest SEO gap
        if (!metaDesc) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_missing_meta_description',
            severity: 'high', detail: 'No meta description — snippet defaults to page content in SERPs' });
        } else if (metaDesc.length < 70) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_meta_description_too_short',
            severity: 'medium', detail: `Meta description ${metaDesc.length} chars — optimal 120–155` });
        } else if (metaDesc.length > 160) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_meta_description_too_long',
            severity: 'low', detail: `Meta description ${metaDesc.length} chars — Google truncates at ~155` });
        }

        // Missing page title (separate from product name)
        if (!pageTitle) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_missing_page_title',
            severity: 'medium', detail: 'No page_title set — defaults to product name without brand/modifier' });
        } else if (pageTitle.length > 65) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_title_too_long',
            severity: 'low', detail: `Page title ${pageTitle.length} chars — Google truncates ~60` });
        }

        // Thin description content (affects Panda-style quality signals)
        if (textContent.length < 100) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_thin_description',
            severity: 'high', detail: `Description is ${textContent.length} chars of plain text — thin content risk` });
        }

        // Duplicate description
        if (duplicateIds.has(id)) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_duplicate_description',
            severity: 'high', detail: 'Description matches another product — duplicate content penalty risk' });
        }

        // Missing search keywords
        if (!p.search_keywords || !p.search_keywords.trim()) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_missing_search_keywords',
            severity: 'medium', detail: 'search_keywords empty — BC uses this for on-site search + SEO signals' });
        }

        // Title formatting issues
        if (name === name.toUpperCase() && name.length > 8) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_title_all_caps',
            severity: 'low', detail: 'Product name is all-caps — poor SERP presentation, reduces CTR' });
        }

        // SKU-noise in title (starts with numbers or code-like prefix)
        if (/^[A-Z0-9]{4,10}[-\s]/.test(name)) {
          flags.push({ product_id: id, name, sku, domain: 'seo', type: 'seo_title_sku_noise',
            severity: 'low', detail: 'Title appears to start with a SKU/code — low keyword relevance for organic' });
        }
      }

      return this._summarize(products.length, flags, 'seo');
    },

    // ── MERCHANDISING SCANNER ────────────────────────────────────────────────
    scanMerchandising(products = []) {
      if (!products.length) return { flags: [], summary: {} };
      const flags = [];
      const now = Date.now();
      const day = 86400000;

      for (const p of products) {
        const id   = p.id || p.bc_product_id;
        const name = p.name || '';
        const sku  = p.sku  || '';
        const views = p.view_count || 0;
        const sold  = p.total_sold || 0;
        const price = p.price || 0;
        const cost  = p.cost_price || 0;
        const margin = cost > 0 && price > 0 ? (price - cost) / price : null;
        const convRate = views > 0 ? sold / views : null;
        const hasRelated = Array.isArray(p.related_products) ? p.related_products.length > 0
          : (p.has_related_products === true);

        // High-traffic, zero sales — demand with no close
        if (views > 50 && sold === 0) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_high_traffic_no_sales',
            severity: 'high', detail: `${views} views, 0 sales — price/content/availability may be blocking purchase` });
        }

        // High-traffic, low conversion (views > 200, conv < 0.5%)
        if (views > 200 && convRate !== null && convRate < 0.005 && sold > 0) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_high_traffic_low_conv',
            severity: 'medium', detail: `${views} views, ${sold} sold (${(convRate*100).toFixed(2)}% conv) — revisit price/images/description` });
        }

        // Low-margin + high-traffic: spending marketing $ on thin products
        if (margin !== null && margin < 0.15 && views > 100) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_low_margin_high_traffic',
            severity: 'high', detail: `${(margin*100).toFixed(1)}% margin with ${views} views — high-cost traffic on low-profit SKU` });
        }

        // Sale price set but conversion is still weak
        if (p.sale_price && p.sale_price < price && convRate !== null && convRate < 0.003) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_sale_not_converting',
            severity: 'medium', detail: `On sale ($${p.sale_price}) but still ${(convRate*100).toFixed(2)}% conv — sale price may not be compelling` });
        }

        // Featured but poor conversion
        if (p.is_featured && views > 50 && convRate !== null && convRate < 0.01) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_featured_low_conv',
            severity: 'medium', detail: `Featured product with ${(convRate*100).toFixed(2)}% conv — reconsider featured slot` });
        }

        // No related products (weak cross-sell / accessory attachment)
        if (!hasRelated && sold > 5) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_no_related_products',
            severity: 'medium', detail: `${sold} units sold with no related products set — missed upsell opportunity` });
        }

        // Invisible but historically high seller
        if (p.is_visible === false && sold > 10) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_invisible_high_seller',
            severity: 'high', detail: `Hidden on storefront but has ${sold} historical sales — likely should be reinstated` });
        }

        // Dead listing — available but zero views and zero sales
        if (p.availability === 'available' && p.is_visible && views === 0 && sold === 0) {
          flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_dead_listing',
            severity: 'low', detail: 'Available + visible but 0 views, 0 sales — may need promotion or catalog cleanup' });
        }

        // Stale listing — not modified in 180+ days
        if (p.bc_date_modified) {
          const ageMs = now - new Date(p.bc_date_modified).getTime();
          if (ageMs > 180 * day && sold === 0) {
            flags.push({ product_id: id, name, sku, domain: 'merch', type: 'merch_stale_no_sales',
              severity: 'low', detail: `Not updated in ${Math.round(ageMs/day/30)}mo and never sold — archive candidate` });
          }
        }
      }

      return this._summarize(products.length, flags, 'merch');
    },

    // ── BASE SCANNER (v1 flags — inventory / margin / conversion basics) ──────
    scan(products = []) {
      if (!products.length) return { flags: [], summary: {} };
      const flags = [];

      for (const p of products) {
        const id   = p.id || p.bc_product_id;
        const name = p.name || '';
        const sku  = p.sku  || '';
        const imgs = p.images || [];
        const imgCount = p.image_count ?? imgs.length;

        if (this._text(p.description_html || p.description).length < 50)
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'missing_description',
            severity: 'high', detail: 'Description absent or under 50 chars' });

        if (imgCount === 0)
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'missing_image',
            severity: 'high', detail: 'No product images attached' });

        if (!p.search_keywords || !p.search_keywords.trim())
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'missing_keywords',
            severity: 'medium', detail: 'search_keywords field empty' });

        if (!(p.categories || []).length)
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'no_category',
            severity: 'medium', detail: 'Product not assigned to any category' });

        if (p.cost_price > 0 && p.price > 0) {
          const m = (p.price - p.cost_price) / p.price;
          if (m < 0.10) flags.push({ product_id: id, name, sku, domain: 'base', type: 'low_margin',
            severity: 'medium', detail: `Margin ${(m*100).toFixed(1)}% (cost $${p.cost_price.toFixed(2)}, price $${p.price.toFixed(2)})` });
        }

        if ((p.view_count||0) > 100 && (p.total_sold||0) > 0 && p.total_sold/p.view_count < 0.005)
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'high_traffic_low_conversion',
            severity: 'medium', detail: `${p.view_count} views, ${p.total_sold} sold (${(p.total_sold/p.view_count*100).toFixed(2)}% conv)` });

        if (p.is_visible === false && (p.inventory_level||0) > 0)
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'hidden_with_stock',
            severity: 'low', detail: `Not visible but ${p.inventory_level} units in stock` });

        if (p.inventory_tracking !== 'none' && p.inventory_level > 0 &&
            p.inventory_warning_level > 0 && p.inventory_level <= p.inventory_warning_level)
          flags.push({ product_id: id, name, sku, domain: 'base', type: 'low_stock',
            severity: 'high', detail: `${p.inventory_level} units (warning level: ${p.inventory_warning_level})` });
      }

      return this._summarize(products.length, flags, 'base');
    },

    // ── SCAN ALL — runs all 4 scanners and merges ────────────────────────────
    scanAll(products = []) {
      const base  = this.scan(products);
      const gmc   = this.scanGMC(products);
      const seo   = this.scanSEO(products);
      const merch = this.scanMerchandising(products);

      const allFlags = [...base.flags, ...gmc.flags, ...seo.flags, ...merch.flags];
      const byDomain = { base: base.summary, gmc: gmc.summary, seo: seo.summary, merch: merch.summary };
      const byType = {};
      const bySeverity = { high: 0, medium: 0, low: 0 };

      for (const f of allFlags) {
        byType[f.type]         = (byType[f.type] || 0) + 1;
        bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
      }

      // Executive metrics — catalog quality and opportunity estimates
      const n = products.length || 1;
      const withImages   = products.filter(p => (p.image_count ?? (p.images||[]).length) > 0).length;
      const withDesc     = products.filter(p => this._text(p.description_html||p.description).length >= 100).length;
      const withMeta     = products.filter(p => (p.meta_description||'').length >= 70).length;
      const withCategory = products.filter(p => (p.categories||[]).length > 0).length;
      const withBrand    = products.filter(p => !!p.brand_id).length;
      const gmcEligible  = products.filter(p =>
        (p.image_count ?? (p.images||[]).length) > 0 &&
        this._text(p.description_html||p.description).length >= 50 &&
        !!p.brand_id && (p.price||0) > 0 && (p.categories||[]).length > 0
      ).length;
      const avgPrice = products.reduce((s,p) => s + (p.price||0), 0) / n;

      const execMetrics = {
        catalog_quality_score: Math.round((withImages + withDesc + withCategory + withBrand) / (4*n) * 100),
        gmc_eligibility_rate:  Math.round(gmcEligible / n * 100),
        seo_health_score:      Math.round(withMeta / n * 100),
        image_coverage:        Math.round(withImages / n * 100),
        description_coverage:  Math.round(withDesc / n * 100),
        high_priority_fixes:   bySeverity.high,
        total_flags:           allFlags.length,
        // rough GMC opportunity: ineligible products × avg_price × ~0.002 GMC conv factor
        gmc_revenue_opportunity: Math.round((n - gmcEligible) * avgPrice * 0.002 * 12),
        // total views on high-traffic/no-sales products
        dead_traffic_views: products
          .filter(p => (p.view_count||0) > 50 && (p.total_sold||0) === 0)
          .reduce((s,p) => s + (p.view_count||0), 0)
      };

      return {
        flags: allFlags,
        byDomain,
        byType,
        bySeverity,
        execMetrics,
        totalProducts: products.length
      };
    },

    // Internal summarizer
    _summarize(total, flags, domain) {
      const byType = {};
      const bySeverity = { high: 0, medium: 0, low: 0 };
      for (const f of flags) {
        byType[f.type]         = (byType[f.type] || 0) + 1;
        bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
      }
      return { flags, summary: { domain, total_products: total, total_flags: flags.length, by_type: byType, by_severity: bySeverity } };
    }
  }
};

// ── CACHE HELPERS ────────────────────────────────────────────────────────────

// Full catalog sync: products + categories + brands → Supabase cache tables
// Call manually from the UI "Refresh" button; never auto-runs.
async function bcSyncCatalogToSupabase(products, categories, brands) {
  if (!sbConfigured()) return { ok: false, reason: 'supabase_not_configured' };

  const batchUpsert = async (table, rows, onConflict) => {
    if (!rows.length) return 0;
    const chunks = [];
    for (let i = 0; i < rows.length; i += 100) chunks.push(rows.slice(i, i + 100));
    let count = 0;
    for (const chunk of chunks) {
      try {
        await sbFetch(`/${table}`, {
          method: 'POST',
          headers: { 'Prefer': `resolution=merge-duplicates,return=minimal` },
          body: JSON.stringify(chunk)
        });
        count += chunk.length;
      } catch(e) {
        console.warn(`[bc] cache upsert ${table} failed:`, e.message);
      }
    }
    return count;
  };

  const now = new Date().toISOString();

  const productRows = products.map(p => ({
    bc_product_id: p.id,
    sku: p.sku || null,
    name: p.name || '',
    description_html: p.description || null,
    price: p.price || null,
    cost_price: p.cost_price || null,
    retail_price: p.retail_price || null,
    sale_price: p.sale_price || null,
    inventory_level: p.inventory_level ?? null,
    inventory_warning_level: p.inventory_warning_level ?? null,
    inventory_tracking: p.inventory_tracking || 'none',
    categories: p.categories || [],
    brand_id: p.brand_id || null,
    is_visible: p.is_visible ?? true,
    is_featured: p.is_featured ?? false,
    availability: p.availability || null,
    total_sold: p.total_sold || 0,
    view_count: p.view_count || 0,
    search_keywords: p.search_keywords || null,
    image_count: p.images ? p.images.length : 0,
    thumbnail_url: p.images?.[0]?.url_thumbnail || null,
    custom_fields: p.custom_fields || [],
    bc_date_modified: p.date_modified || null,
    // V2 SEO + GMC fields (M46)
    page_title: p.page_title || null,
    meta_description: p.meta_description || null,
    meta_keywords: p.meta_keywords || null,
    condition: p.condition || null,
    has_related_products: Array.isArray(p.related_products) && p.related_products.length > 0,
    synced_at: now
  }));

  const categoryRows = categories.map(c => ({
    bc_category_id: c.id,
    parent_id: c.parent_id || null,
    name: c.name || '',
    description: c.description || null,
    is_visible: c.is_visible ?? true,
    sort_order: c.sort_order || 0,
    synced_at: now
  }));

  const brandRows = brands.map(b => ({
    bc_brand_id: b.id,
    name: b.name || '',
    image_url: b.image_url || null,
    search_keywords: b.search_keywords || null,
    synced_at: now
  }));

  const [pCount, cCount, bCount] = await Promise.all([
    batchUpsert('bc_products_cache', productRows, 'bc_product_id'),
    batchUpsert('bc_categories_cache', categoryRows, 'bc_category_id'),
    batchUpsert('bc_brands_cache', brandRows, 'bc_brand_id')
  ]);

  await bcSyncLog('catalog_cache_sync', {
    products: pCount, categories: cCount, brands: bCount, synced_at: now
  });

  return { ok: true, products: pCount, categories: cCount, brands: bCount };
}

// Load cached products from Supabase (no live BC call)
async function bcLoadCachedProducts(limit = 500) {
  if (!sbConfigured()) return [];
  try {
    const rows = await sbFetch(
      `/bc_products_cache?order=name.asc&limit=${limit}&select=bc_product_id,sku,name,price,cost_price,retail_price,sale_price,inventory_level,inventory_warning_level,inventory_tracking,categories,brand_id,is_visible,is_featured,availability,total_sold,view_count,search_keywords,image_count,thumbnail_url,description_html,page_title,meta_description,meta_keywords,condition,has_related_products,custom_fields,bc_date_modified,synced_at`
    );
    return Array.isArray(rows) ? rows : [];
  } catch(e) {
    console.debug('[bc] load cached products skipped (pre-M45):', e.message);
    return [];
  }
}

async function bcLoadCachedCategories() {
  if (!sbConfigured()) return [];
  try {
    const rows = await sbFetch('/bc_categories_cache?order=name.asc&limit=500&select=bc_category_id,parent_id,name,is_visible,sort_order');
    return Array.isArray(rows) ? rows : [];
  } catch(e) { return []; }
}

async function bcLoadCachedBrands() {
  if (!sbConfigured()) return [];
  try {
    const rows = await sbFetch('/bc_brands_cache?order=name.asc&limit=500&select=bc_brand_id,name,image_url,search_keywords');
    return Array.isArray(rows) ? rows : [];
  } catch(e) { return []; }
}

// ── MODULE EXPORT CHECK ──────────────────────────────────────────────────────
console.log('[bc] BigCommerce adapter loaded. Configured:', bcConfigured());
