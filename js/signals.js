// ── CANONICAL SIGNAL PRIMITIVES (Phase 1: Dedupe Hardening) ──
// Source of truth: docs/runtime/CANONICAL_SIGNAL_RUNTIME_V1.md
//                  docs/runtime/SIGNAL_RUNTIME_CANONICAL_PRIMITIVES.md
//
// Vocabulary: physical table is `alerts` (retained for compatibility, §7),
// conceptual name is **Signal**. All new emit-path code MUST route through
// createSignal(). Direct INSERTs into `alerts` outside this module are a
// governance violation (R5).
//
// V1 scope: emit-path primitives only. transitionSignal/computeDelta/
// evaluateConfidence/shouldEscalate/queuePriority are out of Phase 1 scope.

// Frozen type registry — must match CANONICAL_SIGNAL_RUNTIME_V1 §4.1
const SIGNAL_TYPES = Object.freeze([
  'deal_stale',
  'coop_deadline',
  'quote_cold',
  'inventory_low',
  'delivery_overdue',
  'warranty_expiring',
  'showroom_expiring',
  'po_overdue',
  'score_dropped'
]);

// Frozen severity bands — must match §4.2
const SIGNAL_SEVERITIES = Object.freeze(['info', 'warn', 'urgent']);

// signalSourceId(type, payload) → stable string id for the underlying record.
// If payload already has source_id, trust it. Otherwise derive from the
// domain-specific field the legacy alerts code used, so old + new code agree
// on dedupe keys without a data migration.
function signalSourceId(type, payload){
  if(!payload) return null;
  if(payload.source_id != null) return String(payload.source_id);
  // Legacy fallbacks — kept in sync with js/alerts.js generators
  const legacy = (
    payload.deal_id ||
    payload.coop_id ||
    payload.quote_id ||
    payload.inv_id ||
    payload.delivery_id ||
    payload.warranty_id ||
    payload.showroom_id ||
    payload.po_id ||
    payload.vendor_id
  );
  if(legacy != null) return String(legacy);
  // score_dropped is an event-class signal: dedupe on the specific changelog event
  if(type === 'score_dropped' && payload.vendor_name && payload.category && payload.ts){
    return `${payload.vendor_name}:${payload.category}:${payload.ts}`;
  }
  return null;
}

// signalDedupeKey(type, source_id) → canonical "(type, source_id)" string
function signalDedupeKey(type, sourceId){
  return `${type}:${sourceId == null ? '' : sourceId}`;
}

// normalizeSignalPayload — ensure payload.source_id is present and stable.
// This is the single chokepoint that guarantees every emitted Signal carries
// the dedupe field required by §3 of the runtime doc.
function normalizeSignalPayload(type, payload){
  const p = payload && typeof payload === 'object' ? {...payload} : {};
  const sid = signalSourceId(type, p);
  if(sid != null) p.source_id = sid;
  return p;
}

// shouldSuppress(type, source_id) → boolean
// Canonical: a non-terminal (unread|read) Signal already exists for this
// dedupe key. Checks the in-memory ALERTS cache (populated by sbLoadAlerts),
// which is the same source the bell renders from. The SQL partial unique
// index (M49) provides the durable backstop on the DB side.
function shouldSuppress(type, sourceId){
  if(sourceId == null) return false;
  if(typeof ALERTS === 'undefined' || !Array.isArray(ALERTS)) return false;
  return ALERTS.some(a =>
    a && a.type === type
    && (a.status === 'unread' || a.status === 'read')
    && signalSourceId(a.type, a.payload) === String(sourceId)
  );
}

// createSignal(input) → Signal | null
// The ONLY sanctioned writer for new Signals. Validates type + severity,
// computes the dedupe key, suppresses on hit, then routes through the
// existing sbInsertAlert() transport. Returns null on suppression or
// validation rejection (never throws for "already exists").
async function createSignal(input){
  if(!input || typeof input !== 'object') return null;
  const type = input.type;
  if(!SIGNAL_TYPES.includes(type)){
    console.warn(`[signals] reject: unknown type "${type}"`);
    return null;
  }
  const severity = input.severity || 'warn';
  if(!SIGNAL_SEVERITIES.includes(severity)){
    console.warn(`[signals] reject: bad severity "${severity}" for ${type}`);
    return null;
  }

  const payload = normalizeSignalPayload(type, input.payload);
  const sourceId = payload.source_id || signalSourceId(type, input);
  if(sourceId == null){
    console.warn(`[signals] reject: missing source_id for ${type}`, payload);
    return null;
  }
  payload.source_id = sourceId;

  if(shouldSuppress(type, sourceId)) return null;

  if(typeof sbInsertAlert !== 'function'){
    console.warn('[signals] sbInsertAlert unavailable');
    return null;
  }

  const saved = await sbInsertAlert({
    recipient_id: input.recipient_id || null,
    recipient_role: input.recipient_role || null,
    type,
    severity,
    title: input.title,
    body: input.body || null,
    link: input.link || null,
    payload
  });
  return saved || null;
}

// Expose to window for callers in js/alerts.js and verification
if(typeof window !== 'undefined'){
  window.createSignal = createSignal;
  window.shouldSuppress = shouldSuppress;
  window.signalSourceId = signalSourceId;
  window.signalDedupeKey = signalDedupeKey;
  window.normalizeSignalPayload = normalizeSignalPayload;
  window.SIGNAL_TYPES = SIGNAL_TYPES;
  window.SIGNAL_SEVERITIES = SIGNAL_SEVERITIES;
}
