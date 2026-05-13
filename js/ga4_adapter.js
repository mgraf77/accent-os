// ── GOOGLE ANALYTICS 4 READ-ONLY ADAPTER (Track 6.3 runway) ──────────────────
// Safe, observable, read-only interface to the GA4 Data API v1beta.
// Property: configured at runtime via propertyId stored in localStorage.
//
// TOKEN NOT YET AVAILABLE — gracefully degrades to "pending" state until
// credentials arrive (M06). All public surfaces check GA4.configured() first.
//
// Production: route auth through Cloudflare Worker /ga4-proxy.
// Dev: token can be pasted manually as a Bearer token override (bearerOverride
//      field in config, or GA4.saveConfig(propertyId, bearerToken)).
// Service-account JWT → OAuth exchange must NOT happen in the browser —
// it would expose the private key. Use the Worker proxy in production.
//
// This module provides:
//   GA4.configured()                        → bool — propertyId + token present
//   GA4.getConfig()                         → {propertyId, bearerOverride} or null
//   GA4.saveConfig(propertyId, bearerToken) → persist to localStorage
//   GA4.clearConfig()                       → remove from localStorage
//   GA4.health.ping()                       → {ok, latency_ms} or {ok:false, reason}
//   GA4.health.status()                     → {configured, label, color, icon}
//   GA4.reports.run(requestBody)            → raw runReport POST
//   GA4.reports.topPages(days, limit)       → pagePath sessions + screenPageViews
//   GA4.reports.topProducts(days, limit)    → /p/ or /products/ path sessions + conversions
//   GA4.reports.channelRevenue(days)        → channel group revenue + transactions
//   GA4.reports.conversionFunnel(days)      → sessions → addToCarts → checkouts → transactions
//   GA4.syncLog(event, payload)             → write to Supabase bc_sync_log via sbFetch

// ── CONFIG STORAGE ────────────────────────────────────────────────────────────

const GA4_CONFIG_KEY = 'accentos_ga4_config';
const GA4_API_BASE   = 'https://analyticsdata.googleapis.com/v1beta';

// In-memory config cache for the session
let _ga4Config = null;

function ga4Configured() {
  const cfg = ga4GetConfig();
  return !!(cfg && cfg.propertyId && cfg.bearerOverride);
}

function ga4GetConfig() {
  if (_ga4Config) return _ga4Config;
  try {
    const raw = localStorage.getItem(GA4_CONFIG_KEY);
    if (raw) { _ga4Config = JSON.parse(raw); return _ga4Config; }
  } catch(e) { /* ignore */ }
  return null;
}

function ga4SaveConfig(propertyId, bearerToken) {
  _ga4Config = { propertyId, bearerOverride: bearerToken };
  try { localStorage.setItem(GA4_CONFIG_KEY, JSON.stringify(_ga4Config)); } catch(e) { /* ignore */ }
  console.log('[ga4] Config saved. Property:', propertyId);
}

function ga4ClearConfig() {
  _ga4Config = null;
  try { localStorage.removeItem(GA4_CONFIG_KEY); } catch(e) { /* ignore */ }
}

// ── CORE FETCH ────────────────────────────────────────────────────────────────

async function ga4Fetch(propertyId, body) {
  if (!ga4Configured()) throw new Error('GA4_NOT_CONFIGURED');
  const cfg = ga4GetConfig();
  const url = `${GA4_API_BASE}/${propertyId}:runReport`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.bearerOverride}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch(e) {
    await ga4SyncLog('fetch_error', { propertyId, error: e.message });
    throw new Error(`GA4 network error: ${e.message}`);
  }

  if (res.status === 401 || res.status === 403) {
    await ga4SyncLog('auth_error', { propertyId, status: res.status });
    throw new Error('GA4_AUTH_FAILED: token invalid or expired');
  }
  if (res.status === 429) {
    await ga4SyncLog('rate_limit', { propertyId, status: 429 });
    await new Promise(r => setTimeout(r, 5500));
    return ga4Fetch(propertyId, body); // one retry after backoff
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    await ga4SyncLog('api_error', { propertyId, status: res.status, body: text.slice(0, 200) });
    throw new Error(`GA4 API ${res.status}: ${text.slice(0, 120)}`);
  }

  return res.json();
}

// ── SYNC LOGGING (writes to Supabase bc_sync_log if available) ────────────────

let _ga4SyncBuffer = [];

async function ga4SyncLog(event, payload = {}) {
  const entry = {
    event,
    store_hash: 'ga4',
    payload,
    occurred_at: new Date().toISOString()
  };
  _ga4SyncBuffer.push(entry);

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
      console.debug('[ga4] sync log write skipped (pre-M45):', e.message);
    }
  }
  console.debug('[ga4] sync_log:', event, payload);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Build a dateRange object from a number of trailing days
function _ga4DateRange(days) {
  const end   = new Date();
  const start = new Date(Date.now() - (days - 1) * 86400000);
  const fmt   = d => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

// Empty result returned when not configured
const _GA4_EMPTY = { rows: [], rowCount: 0, configured: false };

// ── GA4 NAMESPACE ─────────────────────────────────────────────────────────────

const GA4 = {

  configured() { return ga4Configured(); },
  getConfig()  { return ga4GetConfig();  },

  saveConfig(propertyId, bearerToken) {
    ga4SaveConfig(propertyId, bearerToken);
  },

  clearConfig() {
    ga4ClearConfig();
  },

  // ── SYNC LOG ────────────────────────────────────────────────────────────────
  async syncLog(event, payload = {}) {
    return ga4SyncLog(event, payload);
  },

  // ── HEALTH ──────────────────────────────────────────────────────────────────
  health: {
    async ping() {
      if (!ga4Configured()) return { ok: false, reason: 'not_configured' };
      const cfg = ga4GetConfig();
      const t0  = Date.now();
      try {
        await ga4Fetch(cfg.propertyId, {
          dateRanges: [_ga4DateRange(1)],
          metrics: [{ name: 'sessions' }],
          limit: 1
        });
        const ms = Date.now() - t0;
        await ga4SyncLog('health_ping', { latency_ms: ms, ok: true });
        return { ok: true, latency_ms: ms };
      } catch(e) {
        await ga4SyncLog('health_ping', { ok: false, error: e.message });
        return { ok: false, reason: e.message };
      }
    },

    async status() {
      if (!ga4Configured()) {
        return {
          configured: false,
          label: 'Awaiting credentials (M06)',
          color: 'var(--yellow)',
          icon: '○'
        };
      }
      const ping = await GA4.health.ping();
      if (ping.ok) {
        return {
          configured: true,
          label: `Connected · ${ping.latency_ms}ms`,
          color: 'var(--green)',
          icon: '●'
        };
      }
      if (ping.reason === 'GA4_AUTH_FAILED: token invalid or expired') {
        return { configured: true, label: 'Token invalid', color: 'var(--red)', icon: '✕' };
      }
      return { configured: true, label: `Error: ${ping.reason}`, color: 'var(--red)', icon: '✕' };
    }
  },

  // ── REPORTS ─────────────────────────────────────────────────────────────────
  reports: {

    // Raw runReport — pass a full GA4 Data API v1beta request body
    async run(requestBody) {
      if (!ga4Configured()) return { ..._GA4_EMPTY };
      const cfg = ga4GetConfig();
      try {
        const data = await ga4Fetch(cfg.propertyId, requestBody);
        return data;
      } catch(e) {
        console.warn('[ga4] reports.run error:', e.message);
        return { ..._GA4_EMPTY, error: e.message };
      }
    },

    // Top pages by sessions + screenPageViews, descending
    async topPages(days = 30, limit = 25) {
      if (!ga4Configured()) return { ..._GA4_EMPTY };
      const cfg = ga4GetConfig();
      try {
        const data = await ga4Fetch(cfg.propertyId, {
          dateRanges: [_ga4DateRange(days)],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' }
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit
        });
        await ga4SyncLog('report_top_pages', { days, limit, rowCount: data.rowCount || 0 });
        return data;
      } catch(e) {
        console.warn('[ga4] reports.topPages error:', e.message);
        return { ..._GA4_EMPTY, error: e.message };
      }
    },

    // Top product pages (paths containing /p/ or /products/)
    async topProducts(days = 30, limit = 25) {
      if (!ga4Configured()) return { ..._GA4_EMPTY };
      const cfg = ga4GetConfig();
      try {
        const data = await ga4Fetch(cfg.propertyId, {
          dateRanges: [_ga4DateRange(days)],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' }
          ],
          dimensionFilter: {
            orGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: '/p/', caseSensitive: false }
                  }
                },
                {
                  filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'CONTAINS', value: '/products/', caseSensitive: false }
                  }
                }
              ]
            }
          },
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit
        });
        await ga4SyncLog('report_top_products', { days, limit, rowCount: data.rowCount || 0 });
        return data;
      } catch(e) {
        console.warn('[ga4] reports.topProducts error:', e.message);
        return { ..._GA4_EMPTY, error: e.message };
      }
    },

    // Channel group revenue breakdown: totalRevenue, transactions, purchaseRevenue
    async channelRevenue(days = 30) {
      if (!ga4Configured()) return { ..._GA4_EMPTY };
      const cfg = ga4GetConfig();
      try {
        const data = await ga4Fetch(cfg.propertyId, {
          dateRanges: [_ga4DateRange(days)],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'totalRevenue' },
            { name: 'transactions' },
            { name: 'purchaseRevenue' }
          ],
          orderBys: [{ metric: { metricName: 'totalRevenue' }, desc: true }]
        });
        await ga4SyncLog('report_channel_revenue', { days, rowCount: data.rowCount || 0 });
        return data;
      } catch(e) {
        console.warn('[ga4] reports.channelRevenue error:', e.message);
        return { ..._GA4_EMPTY, error: e.message };
      }
    },

    // Conversion funnel: sessions → addToCarts → checkouts → transactions
    async conversionFunnel(days = 30) {
      if (!ga4Configured()) return { ..._GA4_EMPTY };
      const cfg = ga4GetConfig();
      try {
        const data = await ga4Fetch(cfg.propertyId, {
          dateRanges: [_ga4DateRange(days)],
          metrics: [
            { name: 'sessions' },
            { name: 'addToCarts' },
            { name: 'checkouts' },
            { name: 'transactions' }
          ]
        });
        await ga4SyncLog('report_conversion_funnel', { days, rowCount: data.rowCount || 0 });
        return data;
      } catch(e) {
        console.warn('[ga4] reports.conversionFunnel error:', e.message);
        return { ..._GA4_EMPTY, error: e.message };
      }
    }
  }
};

// ── MODULE EXPORT CHECK ──────────────────────────────────────────────────────
console.log('[ga4] Google Analytics 4 adapter loaded. Configured:', ga4Configured());
