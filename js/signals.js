// ── SIGNAL RUNTIME — Phase 3 hardening primitives ──
// Canonical confidence + escalation layer for the alerts/signals runtime.
// Additive only: never auto-suppresses, never blocks runtime, never throws.
//
// Exports (window-global, no module system):
//   evaluateConfidence(ctx)    → 0..1   bounded, deterministic
//   deriveEscalation(signal)   → 'critical' | 'urgent' | 'warn' | 'info' | 'muted'
//   normalizeSeverity(sig)     → { level, color, dim, badge }
//   shouldDimStale(sourceTs)   → bool   visual-only stale source dimming
//   trackSignal(kind, signal)  → void   updates window.__SIGNAL_RUNTIME_HEALTH__
//
// Doctrine:
//   - No ML, no scoring engine, no broad analytics. Heuristic only.
//   - Missing inputs → lower confidence, never error.
//   - Confidence is metadata. Suppression is operator-driven, not automatic.

(function(){
  'use strict';

  const DAY_MS = 86_400_000;

  // ── 1. Confidence model ──
  // Inputs in generatorCtx (all optional):
  //   sourceTs       — ISO/ms of underlying record (older = lower)
  //   missingFields  — array of field names that should have been present
  //   heuristicQuality — caller's own 0..1 self-assessment
  //   hasBaseline    — bool, whether a comparison baseline exists
  //   duplicateCount — int, prior emissions of same key (more = lower)
  //   generatorReliability — 0..1 historical reliability of this generator
  //   historicalAccuracy   — 0..1 accuracy from prior actioned/dismissed ratio
  function evaluateConfidence(ctx){
    if(!ctx || typeof ctx !== 'object') return 0.5;
    let c = 0.7; // neutral starting prior

    // Stale source: linearly degrade across 0..60d
    if(ctx.sourceTs){
      const t = (typeof ctx.sourceTs === 'number') ? ctx.sourceTs : new Date(ctx.sourceTs).getTime();
      if(!isNaN(t)){
        const ageDays = Math.max(0, (Date.now() - t) / DAY_MS);
        const stalePenalty = Math.min(0.35, ageDays / 60 * 0.35);
        c -= stalePenalty;
      } else {
        c -= 0.05;
      }
    } else {
      c -= 0.05; // unknown source age is mildly suspicious
    }

    // Missing fields: 5% per field, capped at 25%
    if(Array.isArray(ctx.missingFields) && ctx.missingFields.length){
      c -= Math.min(0.25, ctx.missingFields.length * 0.05);
    }

    // Caller's own heuristic quality nudges up to ±15%
    if(typeof ctx.heuristicQuality === 'number'){
      const q = Math.max(0, Math.min(1, ctx.heuristicQuality));
      c += (q - 0.5) * 0.30;
    }

    // Baseline available is a small positive
    if(ctx.hasBaseline === true) c += 0.05;
    else if(ctx.hasBaseline === false) c -= 0.05;

    // Duplicate frequency: each prior dup costs 8%, capped at 32%
    if(typeof ctx.duplicateCount === 'number' && ctx.duplicateCount > 0){
      c -= Math.min(0.32, ctx.duplicateCount * 0.08);
    }

    // Generator reliability nudges ±10%
    if(typeof ctx.generatorReliability === 'number'){
      const g = Math.max(0, Math.min(1, ctx.generatorReliability));
      c += (g - 0.5) * 0.20;
    }

    // Historical accuracy nudges ±15%
    if(typeof ctx.historicalAccuracy === 'number'){
      const h = Math.max(0, Math.min(1, ctx.historicalAccuracy));
      c += (h - 0.5) * 0.30;
    }

    if(isNaN(c)) c = 0.5;
    return Math.max(0, Math.min(1, c));
  }

  // ── 2. Escalation derivation ──
  // Signal-shape: { severity, payload, type, status, confidence }
  function deriveEscalation(signal){
    if(!signal) return 'info';
    const sev = signal.severity || 'info';
    const conf = (signal.payload && typeof signal.payload.confidence === 'number')
      ? signal.payload.confidence
      : (typeof signal.confidence === 'number' ? signal.confidence : 0.7);

    // Confidence shapes the visual escalation but never suppresses:
    // urgent + low conf → still urgent, but visually softened ('warn-tier')
    if(sev === 'urgent'){
      if(conf >= 0.75) return 'critical';
      if(conf >= 0.40) return 'urgent';
      return 'warn'; // visually de-emphasized but still in queue
    }
    if(sev === 'warn'){
      if(conf >= 0.55) return 'warn';
      return 'info';
    }
    return 'info';
  }

  // ── 3. Visual severity normalization ──
  function normalizeSeverity(signal){
    const level = deriveEscalation(signal);
    const conf = (signal && signal.payload && typeof signal.payload.confidence === 'number')
      ? signal.payload.confidence : 0.7;
    const color = {
      critical: 'var(--accent)',
      urgent:   'var(--accent)',
      warn:     'var(--yellow)',
      info:     'var(--blue)',
      muted:    'var(--text-3)'
    }[level] || 'var(--text-3)';
    return {
      level,
      color,
      dim: shouldDimStale(signal && signal.payload && signal.payload.source_ts) || conf < 0.35,
      confidence: conf,
      badge: level === 'critical' ? '!!' : (level === 'urgent' ? '!' : (level === 'warn' ? '⚠' : 'ⓘ'))
    };
  }

  // ── 4. Stale-source dimming ──
  function shouldDimStale(sourceTs, thresholdDays){
    if(!sourceTs) return false;
    const t = (typeof sourceTs === 'number') ? sourceTs : new Date(sourceTs).getTime();
    if(isNaN(t)) return false;
    const days = (Date.now() - t) / DAY_MS;
    return days > (thresholdDays || 45);
  }

  // ── 5. Operational trust instrumentation ──
  function _initHealth(){
    if(window.__SIGNAL_RUNTIME_HEALTH__) return window.__SIGNAL_RUNTIME_HEALTH__;
    return (window.__SIGNAL_RUNTIME_HEALTH__ = {
      generated: 0,
      lowConfidence: 0,        // confidence < 0.5
      urgentDismissed: 0,
      duplicatesSuppressed: 0,
      staleSourced: 0,
      byGenerator: {},         // { type: { generated, lowConf, dismissed } }
      lowConfidenceRate: function(){
        return this.generated ? this.lowConfidence / this.generated : 0;
      },
      snapshot: function(){
        return JSON.parse(JSON.stringify({
          generated: this.generated,
          lowConfidence: this.lowConfidence,
          urgentDismissed: this.urgentDismissed,
          duplicatesSuppressed: this.duplicatesSuppressed,
          staleSourced: this.staleSourced,
          lowConfidenceRate: this.lowConfidenceRate(),
          byGenerator: this.byGenerator
        }));
      }
    });
  }

  function trackSignal(kind, signal){
    const h = _initHealth();
    const type = (signal && signal.type) || 'unknown';
    h.byGenerator[type] = h.byGenerator[type] || { generated:0, lowConf:0, dismissed:0, duplicate:0, stale:0 };
    const g = h.byGenerator[type];
    const conf = (signal && signal.payload && typeof signal.payload.confidence === 'number')
      ? signal.payload.confidence : null;
    const stale = signal && signal.payload && shouldDimStale(signal.payload.source_ts);

    if(kind === 'generated'){
      h.generated++; g.generated++;
      if(conf !== null && conf < 0.5){ h.lowConfidence++; g.lowConf++; }
      if(stale){ h.staleSourced++; g.stale++; }
    } else if(kind === 'duplicate'){
      h.duplicatesSuppressed++; g.duplicate++;
    } else if(kind === 'dismissed'){
      g.dismissed++;
      if(signal && signal.severity === 'urgent') h.urgentDismissed++;
    }
  }

  // ── 6. Historical accuracy reducer ──
  // Deterministic per-type reliability from the alerts cache.
  //   actioned   → operator confirmed the signal was real
  //   dismissed  → operator rejected it as noise
  //   read/unread→ undecided, ignored
  // Returns map: { [type]: 0..1 }. Types with < MIN_SAMPLES of decided signals
  // are omitted (undefined → no nudge applied by evaluateConfidence).
  function computeHistoricalAccuracy(alerts){
    const MIN_SAMPLES = 3;
    const acc = {};
    if(!Array.isArray(alerts)) return acc;
    const tally = {};
    for(const a of alerts){
      if(!a || !a.type) continue;
      if(a.status !== 'actioned' && a.status !== 'dismissed') continue;
      const t = tally[a.type] || (tally[a.type] = { actioned:0, dismissed:0 });
      if(a.status === 'actioned') t.actioned++;
      else t.dismissed++;
    }
    for(const [type, t] of Object.entries(tally)){
      const total = t.actioned + t.dismissed;
      if(total < MIN_SAMPLES) continue;
      acc[type] = t.actioned / total;
    }
    return acc;
  }

  // ── 7. Low-confidence spike reporter ──
  // Optional, opt-in console line if low-confidence rate crosses a threshold
  // since the last report. Never throws, never blocks.
  let _lastReport = { generated: 0, lowConf: 0 };
  function maybeReportLowConfidenceSpike(threshold){
    const h = window.__SIGNAL_RUNTIME_HEALTH__;
    if(!h) return;
    const dGen = h.generated - _lastReport.generated;
    const dLow = h.lowConfidence - _lastReport.lowConf;
    if(dGen < 5) return; // need a sample
    const rate = dLow / dGen;
    if(rate >= (threshold || 0.5)){
      try {
        console.warn(`[signals] low-confidence spike: ${(rate*100).toFixed(0)}% of last ${dGen} signals < 0.5 confidence`);
      } catch {}
    }
    _lastReport = { generated: h.generated, lowConf: h.lowConfidence };
  }

  // Public surface
  window.evaluateConfidence       = evaluateConfidence;
  window.deriveEscalation         = deriveEscalation;
  window.normalizeSeverity        = normalizeSeverity;
  window.shouldDimStale           = shouldDimStale;
  window.trackSignal              = trackSignal;
  window.computeHistoricalAccuracy = computeHistoricalAccuracy;
  window.maybeReportLowConfidenceSpike = maybeReportLowConfidenceSpike;
  _initHealth();
})();
