// ── GOOGLE MERCHANT CENTER READ-ONLY ADAPTER (Track 6.3 runway) ──────────────
// Safe, observable, read-only interface to the Google Content API for Shopping v2.1.
// Merchant: Accent Lighting (ID: 687520574)
//
// TOKEN NOT YET AVAILABLE — gracefully degrades to "pending" state until
// bearerToken is configured. All public surfaces check GMC.configured() first.
//
// Production: route auth through Cloudflare Worker /gmc-proxy (same pattern as
//   GA4 — never expose service-account credentials in the browser).
// Dev: paste a Bearer token manually via GMC.saveConfig(merchantId, bearerToken).
//
// This module provides:
//   GMC.configured()                          → bool — merchantId + bearerToken present
//   GMC.getConfig()                           → {merchantId, bearerToken} or null
//   GMC.saveConfig(merchantId, bearerToken)   → persist to localStorage
//   GMC.clearConfig()                         → remove from localStorage
//   GMC.health.ping()                         → {ok, latency_ms} or {ok:false, reason}
//   GMC.health.status()                       → {configured, label, color, icon}
//   GMC.products.list(maxResults)             → paginated product listing
//   GMC.products.get(productId)               → single product
//   GMC.productStatuses.list(maxResults)      → health status per product
//   GMC.productStatuses.issues()              → products with itemLevelIssues, sorted by count
//   GMC.productStatuses.disapproved()         → products with any disapproved issue
//   GMC.accountStatuses.get()                 → account-level issues
//   GMC.datafeeds.list()                      → feed configurations
//   GMC.syncLog(event, payload)               → write to Supabase bc_sync_log via sbFetch

// ── CONFIG STORAGE ────────────────────────────────────────────────────────────

const GMC_CONFIG_KEY     = 'accentos_gmc_config';
const GMC_DEFAULT_MERCHANT_ID = '687520574';

// In-memory config cache for the session
let _gmcConfig = null;

function gmcConfigured() {
  const cfg = gmcGetConfig();
  return !!(cfg && cfg.merchantId && cfg.bearerToken);
}

function gmcGetConfig() {
  if (_gmcConfig) return _gmcConfig;
  try {
    const raw = localStorage.getItem(GMC_CONFIG_KEY);
    if (raw) { _gmcConfig = JSON.parse(raw); return _gmcConfig; }
  } catch(e) { /* ignore */ }
  return null;
}

function gmcSaveConfig(merchantId, bearerToken) {
  _gmcConfig = {
    merchantId: merchantId || GMC_DEFAULT_MERCHANT_ID,
    bearerToken
  };
  try { localStorage.setItem(GMC_CONFIG_KEY, JSON.stringify(_gmcConfig)); } catch(e) { /* ignore */ }
  console.log('[gmc] Config saved. Merchant ID:', _gmcConfig.merchantId);
}

function gmcClearConfig() {
  _gmcConfig = null;
  try { localStorage.removeItem(GMC_CONFIG_KEY); } catch(e) { /* ignore */ }
}

// ── CORE FETCH ────────────────────────────────────────────────────────────────

function _gmcApiBase() {
  const cfg = gmcGetConfig();
  const merchantId = (cfg && cfg.merchantId) ? cfg.merchantId : GMC_DEFAULT_MERCHANT_ID;
  return `https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}`;
}

async function gmcFetch(path, opts = {}) {
  if (!gmcConfigured()) throw new Error('GMC_NOT_CONFIGURED');
  const cfg = gmcGetConfig();

  const url = path.startsWith('https://') ? path : `${_gmcApiBase()}${path}`;

  const headers = {
    'Authorization': `Bearer ${cfg.bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(opts.headers || {})
  };

  let res;
  try {
    res = await fetch(url, { method: opts.method || 'GET', headers });
  } catch(e) {
    await GMC.syncLog('fetch_error', { path, error: e.message });
    throw new Error(`GMC network error: ${e.message}`);
  }

  if (res.status === 401 || res.status === 403) {
    await GMC.syncLog('auth_error', { path, status: res.status });
    throw new Error('GMC_AUTH_FAILED: Bearer token invalid or expired');
  }
  if (res.status === 429) {
    await GMC.syncLog('rate_limit', { path, status: 429 });
    const retryAfter = parseInt(res.headers.get('Retry-After') || '5') * 1000;
    await new Promise(r => setTimeout(r, retryAfter + 200));
    return gmcFetch(path, opts); // one retry after backoff
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    await GMC.syncLog('api_error', { path, status: res.status, body: body.slice(0, 200) });
    throw new Error(`GMC API ${res.status}: ${body.slice(0, 120)}`);
  }

  return res.json();
}

// GMC uses pageToken from nextPageToken in response
async function gmcFetchAll(path, params = {}) {
  const allItems = [];
  let nextPageToken = null;

  do {
    const qParams = { ...params };
    if (nextPageToken) qParams.pageToken = nextPageToken;

    const sep = path.includes('?') ? '&' : '?';
    const qp  = Object.keys(qParams).length
      ? sep + new URLSearchParams(qParams).toString()
      : '';

    const data = await gmcFetch(`${path}${qp}`);

    // GMC returns different top-level keys depending on the endpoint
    const items =
      data.resources ||   // products, productstatuses, datafeeds
      data.entries  ||   // batch responses
      data.items    ||   // some list endpoints
      [];

    allItems.push(...(Array.isArray(items) ? items : []));
    nextPageToken = data.nextPageToken || null;
  } while (nextPageToken);

  return allItems;
}

// ── SYNC LOGGING ──────────────────────────────────────────────────────────────

async function _gmcSyncLog(event, payload = {}) {
  const entry = {
    event,
    source: 'gmc',
    payload,
    occurred_at: new Date().toISOString()
  };

  if (typeof sbConfigured === 'function' && sbConfigured()) {
    try {
      await sbFetch('/bc_sync_log', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(entry)
      });
    } catch(e) {
      console.debug('[gmc] sync log write skipped:', e.message);
    }
  }
  console.debug('[gmc] sync_log:', event, payload);
}

// ── GMC NAMESPACE ─────────────────────────────────────────────────────────────

const GMC = {

  // Expose config helpers on namespace for consistency
  configured() { return gmcConfigured(); },
  getConfig()  { return gmcGetConfig(); },
  saveConfig(merchantId, bearerToken) { return gmcSaveConfig(merchantId, bearerToken); },
  clearConfig()                       { return gmcClearConfig(); },

  syncLog: _gmcSyncLog,

  // ── HEALTH ──────────────────────────────────────────────────────────────────
  health: {
    async ping() {
      if (!gmcConfigured()) return { ok: false, reason: 'not_configured' };
      const cfg = gmcGetConfig();
      const t0  = Date.now();
      try {
        await gmcFetch(`/accounts/${cfg.merchantId}`);
        const ms = Date.now() - t0;
        await GMC.syncLog('health_ping', { latency_ms: ms, ok: true });
        return { ok: true, latency_ms: ms };
      } catch(e) {
        await GMC.syncLog('health_ping', { ok: false, error: e.message });
        return { ok: false, reason: e.message };
      }
    },

    async status() {
      if (!gmcConfigured()) {
        return {
          configured: false,
          label: 'Awaiting Bearer token',
          color: 'var(--yellow)',
          icon: '○'
        };
      }
      const ping = await GMC.health.ping();
      if (ping.ok) {
        return {
          configured: true,
          label: `Connected · ${ping.latency_ms}ms`,
          color: 'var(--green)',
          icon: '●'
        };
      }
      if (ping.reason && ping.reason.includes('AUTH_FAILED')) {
        return { configured: true, label: 'Token invalid or expired', color: 'var(--red)', icon: '✕' };
      }
      return { configured: true, label: `Error: ${ping.reason}`, color: 'var(--red)', icon: '✕' };
    }
  },

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  // Product fields: id (channel:language:country:offerId), title, description,
  // link, imageLink, price, availability, gtin, mpn, brand, googleProductCategory
  products: {
    async list(maxResults = 250) {
      if (!gmcConfigured()) return [];
      try {
        const items = await gmcFetchAll('/products', { maxResults });
        await GMC.syncLog('sync_products', { count: items.length });
        return items;
      } catch(e) {
        console.warn('[gmc] products.list failed:', e.message);
        return [];
      }
    },

    async get(productId) {
      if (!gmcConfigured()) return null;
      try {
        return await gmcFetch(`/products/${encodeURIComponent(productId)}`);
      } catch(e) {
        console.warn('[gmc] products.get failed:', e.message);
        return null;
      }
    }
  },

  // ── PRODUCT STATUSES ────────────────────────────────────────────────────────
  // Each has: productId, title, itemLevelIssues[] with code, servability,
  // resolution, description, detail
  productStatuses: {
    async list(maxResults = 250) {
      if (!gmcConfigured()) return [];
      try {
        const items = await gmcFetchAll('/productstatuses', { maxResults });
        await GMC.syncLog('sync_product_statuses', { count: items.length });
        return items;
      } catch(e) {
        console.warn('[gmc] productStatuses.list failed:', e.message);
        return [];
      }
    },

    // Filter to products with any itemLevelIssues, sorted by issue count desc
    async issues() {
      if (!gmcConfigured()) return [];
      try {
        const all = await GMC.productStatuses.list();
        return all
          .filter(p => p.itemLevelIssues && p.itemLevelIssues.length > 0)
          .sort((a, b) => b.itemLevelIssues.length - a.itemLevelIssues.length);
      } catch(e) {
        console.warn('[gmc] productStatuses.issues failed:', e.message);
        return [];
      }
    },

    // Filter to products where any issue has servability === 'disapproved'
    async disapproved() {
      if (!gmcConfigured()) return [];
      try {
        const all = await GMC.productStatuses.list();
        return all.filter(p =>
          p.itemLevelIssues &&
          p.itemLevelIssues.some(i => i.servability === 'disapproved')
        );
      } catch(e) {
        console.warn('[gmc] productStatuses.disapproved failed:', e.message);
        return [];
      }
    }
  },

  // ── ACCOUNT STATUSES ────────────────────────────────────────────────────────
  accountStatuses: {
    async get() {
      if (!gmcConfigured()) return null;
      const cfg = gmcGetConfig();
      try {
        return await gmcFetch(`/accountstatuses/${cfg.merchantId}`);
      } catch(e) {
        console.warn('[gmc] accountStatuses.get failed:', e.message);
        return null;
      }
    }
  },

  // ── DATAFEEDS ────────────────────────────────────────────────────────────────
  datafeeds: {
    async list() {
      if (!gmcConfigured()) return [];
      try {
        const items = await gmcFetchAll('/datafeeds');
        return items;
      } catch(e) {
        console.warn('[gmc] datafeeds.list failed:', e.message);
        return [];
      }
    }
  }
};

// ── MODULE LOAD CHECK ────────────────────────────────────────────────────────
console.log('[gmc] GMC adapter loaded. Configured:', gmcConfigured());
