// ── KLAVIYO READ-ONLY ADAPTER (Track 6.3 runway) ──────────────────────────────
// Safe, observable, read-only interface to the Klaviyo API v2024-10-15.
//
// TOKEN NOT YET AVAILABLE — gracefully degrades to "pending" state until
// API key is configured. All public surfaces check Klaviyo.configured() first.
//
// Production: use Private API Key with read-only scopes.
// Auth header: Authorization: Klaviyo-API-Key {apiKey}
// Revision header: revision: 2024-10-15
//
// This module provides:
//   Klaviyo.configured()                       → bool — apiKey present
//   Klaviyo.getConfig()                        → {apiKey} or null
//   Klaviyo.saveConfig(apiKey)                 → persist to localStorage
//   Klaviyo.clearConfig()                      → remove from localStorage
//   Klaviyo.health.ping()                      → {ok, latency_ms} or {ok:false, reason}
//   Klaviyo.health.status()                    → {configured, label, color, icon}
//   Klaviyo.metrics.list()                     → all available metrics
//   Klaviyo.metrics.revenue(days)              → {revenue, orders, aov} summary
//   Klaviyo.campaigns.list(status)             → campaign list with optional status filter
//   Klaviyo.campaigns.stats(campaignId)        → recipient estimation for a campaign
//   Klaviyo.flows.list()                       → automation flows
//   Klaviyo.flows.actions(flowId)              → actions within a flow
//   Klaviyo.lists.list()                       → subscriber lists
//   Klaviyo.segments.list()                    → segments
//   Klaviyo.events.recent(days, limit)         → recent events (opens, clicks, orders)
//   Klaviyo.syncLog(event, payload)            → write to Supabase bc_sync_log via sbFetch

// ── CONFIG STORAGE ────────────────────────────────────────────────────────────

const KLAVIYO_CONFIG_KEY = 'accentos_klaviyo_config';
const KLAVIYO_API_BASE   = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION   = '2024-10-15';

// In-memory config cache for the session
let _klaviyoConfig = null;

function klaviyoConfigured() {
  const cfg = klaviyoGetConfig();
  return !!(cfg && cfg.apiKey);
}

function klaviyoGetConfig() {
  if (_klaviyoConfig) return _klaviyoConfig;
  try {
    const raw = localStorage.getItem(KLAVIYO_CONFIG_KEY);
    if (raw) { _klaviyoConfig = JSON.parse(raw); return _klaviyoConfig; }
  } catch(e) { /* ignore */ }
  return null;
}

function klaviyoSaveConfig(apiKey) {
  _klaviyoConfig = { apiKey };
  try { localStorage.setItem(KLAVIYO_CONFIG_KEY, JSON.stringify(_klaviyoConfig)); } catch(e) { /* ignore */ }
  console.log('[klaviyo] Config saved.');
}

function klaviyoClearConfig() {
  _klaviyoConfig = null;
  try { localStorage.removeItem(KLAVIYO_CONFIG_KEY); } catch(e) { /* ignore */ }
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
// Klaviyo standard: 75 reads/s. Conservative cap at 60/s with 1s window.

let _klaviyoRequestCount = 0;
let _klaviyoWindowStart  = Date.now();
const KLAVIYO_RATE_LIMIT = 60;
const KLAVIYO_WINDOW_MS  = 1000;

async function _klaviyoRateCheck() {
  const now = Date.now();
  if (now - _klaviyoWindowStart > KLAVIYO_WINDOW_MS) {
    _klaviyoWindowStart  = now;
    _klaviyoRequestCount = 0;
  }
  if (_klaviyoRequestCount >= KLAVIYO_RATE_LIMIT) {
    const wait = KLAVIYO_WINDOW_MS - (now - _klaviyoWindowStart) + 50;
    console.warn(`[klaviyo] Rate limit: waiting ${wait}ms`);
    await new Promise(r => setTimeout(r, wait));
    _klaviyoWindowStart  = Date.now();
    _klaviyoRequestCount = 0;
  }
  _klaviyoRequestCount++;
}

// ── CORE FETCH ────────────────────────────────────────────────────────────────

async function klaviyoFetch(path, opts = {}) {
  if (!klaviyoConfigured()) throw new Error('KLAVIYO_NOT_CONFIGURED');
  const cfg = klaviyoGetConfig();
  await _klaviyoRateCheck();

  // Allow absolute URLs (for cursor-based pagination next links)
  const url = path.startsWith('https://') ? path : `${KLAVIYO_API_BASE}${path}`;

  const headers = {
    'Authorization': `Klaviyo-API-Key ${cfg.apiKey}`,
    'revision': KLAVIYO_REVISION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(opts.headers || {})
  };

  let res;
  try {
    res = await fetch(url, { method: opts.method || 'GET', headers, ...(opts.body ? { body: opts.body } : {}) });
  } catch(e) {
    await Klaviyo.syncLog('fetch_error', { path, error: e.message });
    throw new Error(`Klaviyo network error: ${e.message}`);
  }

  if (res.status === 401 || res.status === 403) {
    await Klaviyo.syncLog('auth_error', { path, status: res.status });
    throw new Error('KLAVIYO_AUTH_FAILED: API key invalid or insufficient scope');
  }
  if (res.status === 429) {
    await Klaviyo.syncLog('rate_limit', { path, status: 429 });
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2') * 1000;
    await new Promise(r => setTimeout(r, retryAfter + 200));
    return klaviyoFetch(path, opts); // one retry after backoff
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    await Klaviyo.syncLog('api_error', { path, status: res.status, body: body.slice(0, 200) });
    throw new Error(`Klaviyo API ${res.status}: ${body.slice(0, 120)}`);
  }

  return res.json();
}

// Cursor-based paginated fetch — Klaviyo uses page[cursor] from next link
async function klaviyoFetchAll(path, params = {}) {
  const allItems = [];

  // Build initial URL with any provided query params
  const qp = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  let nextUrl = `${KLAVIYO_API_BASE}${path}${qp}`;

  while (nextUrl) {
    const data = await klaviyoFetch(nextUrl);
    const items = data.data || [];
    allItems.push(...(Array.isArray(items) ? items : []));

    // Klaviyo cursor pagination: links.next contains the full next URL
    nextUrl = (data.links && data.links.next) ? data.links.next : null;
  }

  return allItems;
}

// ── SYNC LOGGING ──────────────────────────────────────────────────────────────

async function _klaviyoSyncLog(event, payload = {}) {
  const entry = {
    event,
    source: 'klaviyo',
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
      console.debug('[klaviyo] sync log write skipped:', e.message);
    }
  }
  console.debug('[klaviyo] sync_log:', event, payload);
}

// ── KLAVIYO NAMESPACE ─────────────────────────────────────────────────────────

const Klaviyo = {

  // Expose config helpers on namespace for consistency
  configured() { return klaviyoConfigured(); },
  getConfig()  { return klaviyoGetConfig(); },
  saveConfig(apiKey) { return klaviyoSaveConfig(apiKey); },
  clearConfig()      { return klaviyoClearConfig(); },

  syncLog: _klaviyoSyncLog,

  // ── HEALTH ──────────────────────────────────────────────────────────────────
  health: {
    async ping() {
      if (!klaviyoConfigured()) return { ok: false, reason: 'not_configured' };
      const t0 = Date.now();
      try {
        await klaviyoFetch('/accounts');
        const ms = Date.now() - t0;
        await Klaviyo.syncLog('health_ping', { latency_ms: ms, ok: true });
        return { ok: true, latency_ms: ms };
      } catch(e) {
        await Klaviyo.syncLog('health_ping', { ok: false, error: e.message });
        return { ok: false, reason: e.message };
      }
    },

    async status() {
      if (!klaviyoConfigured()) {
        return {
          configured: false,
          label: 'Awaiting API key',
          color: 'var(--yellow)',
          icon: '○'
        };
      }
      const ping = await Klaviyo.health.ping();
      if (ping.ok) {
        return {
          configured: true,
          label: `Connected · ${ping.latency_ms}ms`,
          color: 'var(--green)',
          icon: '●'
        };
      }
      if (ping.reason && ping.reason.includes('AUTH_FAILED')) {
        return { configured: true, label: 'API key invalid', color: 'var(--red)', icon: '✕' };
      }
      return { configured: true, label: `Error: ${ping.reason}`, color: 'var(--red)', icon: '✕' };
    }
  },

  // ── METRICS ─────────────────────────────────────────────────────────────────
  metrics: {
    async list() {
      if (!klaviyoConfigured()) return [];
      try {
        return await klaviyoFetchAll('/metrics');
      } catch(e) {
        console.warn('[klaviyo] metrics.list failed:', e.message);
        return [];
      }
    },

    // Query Placed Order metric for revenue aggregation over N days.
    // Uses GET /metric-aggregates with filter on metric name.
    // Returns {revenue, orders, aov} summary object.
    async revenue(days = 30) {
      if (!klaviyoConfigured()) return null;
      try {
        // First, find the Placed Order metric id
        const allMetrics = await klaviyoFetchAll('/metrics');
        const placedOrder = allMetrics.find(m =>
          m.attributes && m.attributes.name &&
          m.attributes.name.toLowerCase().includes('placed order')
        );
        if (!placedOrder) {
          console.warn('[klaviyo] metrics.revenue: "Placed Order" metric not found');
          return { revenue: 0, orders: 0, aov: 0 };
        }

        const metricId = placedOrder.id;
        const endDate  = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const fmt = d => d.toISOString().slice(0, 10);
        const body = JSON.stringify({
          data: {
            type: 'metric-aggregate',
            attributes: {
              metric_id: metricId,
              measurements: ['sum_value', 'count'],
              interval: 'day',
              page_size: days,
              filter: [
                `greater-or-equal(datetime,${fmt(startDate)})`,
                `less-than(datetime,${fmt(endDate)})`
              ],
              timezone: 'UTC'
            }
          }
        });

        const data = await klaviyoFetch('/metric-aggregates', { method: 'POST', body });
        const attrs = (data.data && data.data.attributes) || {};
        const datums = attrs.data || [];

        let totalRevenue = 0;
        let totalOrders  = 0;

        for (const datum of datums) {
          const vals = datum.measurements || {};
          totalRevenue += (vals.sum_value || 0);
          totalOrders  += (vals.count || 0);
        }

        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        await Klaviyo.syncLog('metrics_revenue', { days, revenue: totalRevenue, orders: totalOrders });
        return {
          revenue: Math.round(totalRevenue * 100) / 100,
          orders: totalOrders,
          aov: Math.round(aov * 100) / 100
        };
      } catch(e) {
        console.warn('[klaviyo] metrics.revenue failed:', e.message);
        return null;
      }
    }
  },

  // ── CAMPAIGNS ────────────────────────────────────────────────────────────────
  campaigns: {
    // GET /campaigns with optional status filter ('draft','scheduled','sent')
    async list(status = null) {
      if (!klaviyoConfigured()) return [];
      try {
        const params = { 'filter': 'equals(messages.channel,\'email\')' };
        if (status) {
          params['filter'] = `equals(messages.channel,'email'),equals(status,'${status}')`;
        }
        return await klaviyoFetchAll('/campaigns', params);
      } catch(e) {
        console.warn('[klaviyo] campaigns.list failed:', e.message);
        return [];
      }
    },

    // GET /campaign-recipient-estimations/{campaignId} — recipient count
    async stats(campaignId) {
      if (!klaviyoConfigured()) return null;
      try {
        const data = await klaviyoFetch(`/campaign-recipient-estimations/${campaignId}`);
        return (data.data && data.data.attributes) ? data.data.attributes : data.data || null;
      } catch(e) {
        console.warn('[klaviyo] campaigns.stats failed:', e.message);
        return null;
      }
    }
  },

  // ── FLOWS ────────────────────────────────────────────────────────────────────
  flows: {
    async list() {
      if (!klaviyoConfigured()) return [];
      try {
        return await klaviyoFetchAll('/flows');
      } catch(e) {
        console.warn('[klaviyo] flows.list failed:', e.message);
        return [];
      }
    },

    // GET /flow-actions with filter on flow_id
    async actions(flowId) {
      if (!klaviyoConfigured()) return [];
      try {
        return await klaviyoFetchAll('/flow-actions', {
          'filter': `equals(flow.id,'${flowId}')`
        });
      } catch(e) {
        console.warn('[klaviyo] flows.actions failed:', e.message);
        return [];
      }
    }
  },

  // ── LISTS ────────────────────────────────────────────────────────────────────
  lists: {
    async list() {
      if (!klaviyoConfigured()) return [];
      try {
        return await klaviyoFetchAll('/lists');
      } catch(e) {
        console.warn('[klaviyo] lists.list failed:', e.message);
        return [];
      }
    }
  },

  // ── SEGMENTS ─────────────────────────────────────────────────────────────────
  segments: {
    async list() {
      if (!klaviyoConfigured()) return [];
      try {
        return await klaviyoFetchAll('/segments');
      } catch(e) {
        console.warn('[klaviyo] segments.list failed:', e.message);
        return [];
      }
    }
  },

  // ── EVENTS ──────────────────────────────────────────────────────────────────
  // GET /events with filter on datetime, limit.
  // Returns recent events (email opens, clicks, placed orders).
  events: {
    async recent(days = 7, limit = 100) {
      if (!klaviyoConfigured()) return [];
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const isoStart = startDate.toISOString();

        const params = {
          'filter': `greater-or-equal(datetime,${isoStart})`,
          'page[size]': Math.min(limit, 200),
          'sort': '-datetime'
        };

        const items = await klaviyoFetchAll('/events', params);
        return items.slice(0, limit);
      } catch(e) {
        console.warn('[klaviyo] events.recent failed:', e.message);
        return [];
      }
    }
  }
};

// ── MODULE LOAD CHECK ────────────────────────────────────────────────────────
console.log('[klaviyo] Klaviyo adapter loaded. Configured:', klaviyoConfigured());
