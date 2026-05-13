// ── GOOGLE SEARCH CONSOLE READ-ONLY ADAPTER (Track 6.3 runway) ───────────────
// Safe, observable, read-only interface to the Search Console Search Analytics API.
// Site: https://accentlightinginc.com/ (default; configurable at runtime)
//
// TOKEN NOT YET AVAILABLE — gracefully degrades to "pending" state until
// credentials arrive (M06). All public surfaces check GSC.configured() first.
//
// Production: route auth through Cloudflare Worker /gsc-proxy.
// Dev: token can be pasted manually via GSC.saveConfig(siteUrl, bearerToken).
//
// This module provides:
//   GSC.configured()                          → bool — siteUrl + token present
//   GSC.getConfig()                           → {siteUrl, bearerToken} or null
//   GSC.saveConfig(siteUrl, bearerToken)      → persist to localStorage
//   GSC.clearConfig()                         → remove from localStorage
//   GSC.health.ping()                         → {ok, latency_ms} or {ok:false, reason}
//   GSC.health.status()                       → {configured, label, color, icon}
//   GSC.searchAnalytics.query(requestBody)    → raw POST to Search Analytics API
//   GSC.searchAnalytics.topQueries(days, lim) → query-level clicks/impressions/ctr/position
//   GSC.searchAnalytics.topPages(days, lim)   → page-level clicks/impressions/ctr
//   GSC.searchAnalytics.productQueries(days, lim) → product-intent keyword filter
//   GSC.searchAnalytics.indexCoverage()       → static note (UI-only check)

// ── CONFIG STORAGE ────────────────────────────────────────────────────────────

const GSC_CONFIG_KEY   = 'accentos_gsc_config';
const GSC_DEFAULT_SITE = 'https://accentlightinginc.com/';
const GSC_API_BASE     = 'https://searchconsole.googleapis.com/webmasters/v3/sites';

// In-memory config cache for the session
let _gscConfig = null;

function gscConfigured() {
  const cfg = gscGetConfig();
  return !!(cfg && cfg.siteUrl && cfg.bearerToken);
}

function gscGetConfig() {
  if (_gscConfig) return _gscConfig;
  try {
    const raw = localStorage.getItem(GSC_CONFIG_KEY);
    if (raw) { _gscConfig = JSON.parse(raw); return _gscConfig; }
  } catch(e) { /* ignore */ }
  return null;
}

function gscSaveConfig(siteUrl, bearerToken) {
  _gscConfig = { siteUrl: siteUrl || GSC_DEFAULT_SITE, bearerToken };
  try { localStorage.setItem(GSC_CONFIG_KEY, JSON.stringify(_gscConfig)); } catch(e) { /* ignore */ }
  console.log('[gsc] Config saved. Site:', _gscConfig.siteUrl);
}

function gscClearConfig() {
  _gscConfig = null;
  try { localStorage.removeItem(GSC_CONFIG_KEY); } catch(e) { /* ignore */ }
}

// ── CORE FETCH ────────────────────────────────────────────────────────────────

async function gscFetch(body) {
  if (!gscConfigured()) throw new Error('GSC_NOT_CONFIGURED');
  const cfg     = gscGetConfig();
  const encoded = encodeURIComponent(cfg.siteUrl);
  const url     = `${GSC_API_BASE}/${encoded}/searchAnalytics/query`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.bearerToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch(e) {
    await gscSyncLog('fetch_error', { siteUrl: cfg.siteUrl, error: e.message });
    throw new Error(`GSC network error: ${e.message}`);
  }

  if (res.status === 401 || res.status === 403) {
    await gscSyncLog('auth_error', { siteUrl: cfg.siteUrl, status: res.status });
    throw new Error('GSC_AUTH_FAILED: token invalid or expired');
  }
  if (res.status === 429) {
    await gscSyncLog('rate_limit', { siteUrl: cfg.siteUrl, status: 429 });
    await new Promise(r => setTimeout(r, 5500));
    return gscFetch(body); // one retry after backoff
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    await gscSyncLog('api_error', { siteUrl: cfg.siteUrl, status: res.status, body: text.slice(0, 200) });
    throw new Error(`GSC API ${res.status}: ${text.slice(0, 120)}`);
  }

  return res.json();
}

// ── SYNC LOGGING (writes to Supabase bc_sync_log if available) ────────────────

let _gscSyncBuffer = [];

async function gscSyncLog(event, payload = {}) {
  const entry = {
    event,
    store_hash: 'gsc',
    payload,
    occurred_at: new Date().toISOString()
  };
  _gscSyncBuffer.push(entry);

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
      console.debug('[gsc] sync log write skipped (pre-M45):', e.message);
    }
  }
  console.debug('[gsc] sync_log:', event, payload);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Build startDate/endDate strings for a trailing window of N days
function _gscDateRange(days) {
  const end   = new Date();
  const start = new Date(Date.now() - (days - 1) * 86400000);
  const fmt   = d => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

// Empty result returned when not configured
const _GSC_EMPTY = { rows: [], responseAggregationType: 'auto', configured: false };

// Keywords that signal product-intent queries
const GSC_PRODUCT_KEYWORDS = [
  'light', 'lamp', 'fixture', 'ceiling', 'pendant', 'chandelier'
];

// ── GSC NAMESPACE ─────────────────────────────────────────────────────────────

const GSC = {

  configured() { return gscConfigured(); },
  getConfig()  { return gscGetConfig();  },

  saveConfig(siteUrl, bearerToken) {
    gscSaveConfig(siteUrl, bearerToken);
  },

  clearConfig() {
    gscClearConfig();
  },

  // ── HEALTH ──────────────────────────────────────────────────────────────────
  health: {
    async ping() {
      if (!gscConfigured()) return { ok: false, reason: 'not_configured' };
      const t0 = Date.now();
      try {
        const range = _gscDateRange(3);
        await gscFetch({
          startDate: range.startDate,
          endDate:   range.endDate,
          dimensions: [],
          rowLimit: 1
        });
        const ms = Date.now() - t0;
        await gscSyncLog('health_ping', { latency_ms: ms, ok: true });
        return { ok: true, latency_ms: ms };
      } catch(e) {
        await gscSyncLog('health_ping', { ok: false, error: e.message });
        return { ok: false, reason: e.message };
      }
    },

    async status() {
      if (!gscConfigured()) {
        return {
          configured: false,
          label: 'Awaiting credentials (M06)',
          color: 'var(--yellow)',
          icon: '○'
        };
      }
      const ping = await GSC.health.ping();
      if (ping.ok) {
        return {
          configured: true,
          label: `Connected · ${ping.latency_ms}ms`,
          color: 'var(--green)',
          icon: '●'
        };
      }
      if (ping.reason === 'GSC_AUTH_FAILED: token invalid or expired') {
        return { configured: true, label: 'Token invalid', color: 'var(--red)', icon: '✕' };
      }
      return { configured: true, label: `Error: ${ping.reason}`, color: 'var(--red)', icon: '✕' };
    }
  },

  // ── SEARCH ANALYTICS ────────────────────────────────────────────────────────
  searchAnalytics: {

    // Raw query — pass a full Search Analytics API request body
    async query(requestBody) {
      if (!gscConfigured()) return { ..._GSC_EMPTY };
      try {
        const data = await gscFetch(requestBody);
        return data;
      } catch(e) {
        console.warn('[gsc] searchAnalytics.query error:', e.message);
        return { ..._GSC_EMPTY, error: e.message };
      }
    },

    // Top queries by clicks, descending
    async topQueries(days = 28, limit = 25) {
      if (!gscConfigured()) return { ..._GSC_EMPTY };
      const range = _gscDateRange(days);
      try {
        const data = await gscFetch({
          startDate:  range.startDate,
          endDate:    range.endDate,
          dimensions: ['query'],
          rowLimit:   limit,
          orderBys: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
        });
        await gscSyncLog('report_top_queries', { days, limit, rowCount: (data.rows || []).length });
        return data;
      } catch(e) {
        console.warn('[gsc] searchAnalytics.topQueries error:', e.message);
        return { ..._GSC_EMPTY, error: e.message };
      }
    },

    // Top pages by clicks, descending
    async topPages(days = 28, limit = 25) {
      if (!gscConfigured()) return { ..._GSC_EMPTY };
      const range = _gscDateRange(days);
      try {
        const data = await gscFetch({
          startDate:  range.startDate,
          endDate:    range.endDate,
          dimensions: ['page'],
          rowLimit:   limit,
          orderBys: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
        });
        await gscSyncLog('report_top_pages', { days, limit, rowCount: (data.rows || []).length });
        return data;
      } catch(e) {
        console.warn('[gsc] searchAnalytics.topPages error:', e.message);
        return { ..._GSC_EMPTY, error: e.message };
      }
    },

    // Product-intent queries: filter rows client-side where query contains a product keyword.
    // GSC Search Analytics does not support server-side string filters on query dimension —
    // we fetch the top N queries and filter locally.
    async productQueries(days = 28, limit = 200) {
      if (!gscConfigured()) return { ..._GSC_EMPTY };
      const range = _gscDateRange(days);
      try {
        const data = await gscFetch({
          startDate:  range.startDate,
          endDate:    range.endDate,
          dimensions: ['query'],
          rowLimit:   limit,
          orderBys: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
        });

        const allRows = data.rows || [];
        const keywords = GSC_PRODUCT_KEYWORDS.map(k => k.toLowerCase());
        const productRows = allRows.filter(row => {
          const q = (row.keys && row.keys[0] || '').toLowerCase();
          return keywords.some(k => q.includes(k));
        });

        await gscSyncLog('report_product_queries', { days, matchedRows: productRows.length });
        return { ...data, rows: productRows, rowCount: productRows.length };
      } catch(e) {
        console.warn('[gsc] searchAnalytics.productQueries error:', e.message);
        return { ..._GSC_EMPTY, error: e.message };
      }
    },

    // Index coverage is not available via the Search Analytics query API.
    // Use the URL Inspection API or the Search Console UI directly.
    indexCoverage() {
      return {
        available: false,
        note: 'Index coverage data is not accessible via the Search Analytics query endpoint. ' +
              'Check Search Console UI → Index → Coverage, or use the URL Inspection API ' +
              '(https://searchconsole.googleapis.com/v1/urlInspection/index:inspect) ' +
              'for per-URL indexed status. This adapter does not implement that endpoint — ' +
              'add it to gsc_adapter.js when credentials (M06) are available.',
        uiUrl: 'https://search.google.com/search-console/index'
      };
    }
  }
};

// ── MODULE EXPORT CHECK ──────────────────────────────────────────────────────
console.log('[gsc] Search Console adapter loaded. Configured:', gscConfigured());
