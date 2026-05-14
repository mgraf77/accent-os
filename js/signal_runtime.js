// ── SIGNAL RUNTIME — Phase 1 primitives ──
// Lightweight foundation for the operational nervous system.
// Additive only. Does not modify existing modules.
//
// Provides:
//   SignalRuntime.SEVERITY            severity constants + ordering
//   SignalRuntime.COOLDOWN_MS         per-severity cooldown defaults
//   SignalRuntime.registerSignal(def) signal registry
//   SignalRuntime.getDef(name)        lookup
//   SignalRuntime.allDefs()           registry dump
//   SignalRuntime.normalize(record)   coerce a partial record to canonical shape
//   SignalRuntime.dedupeKey(rec)      stable key for dedupe checks
//   SignalRuntime.isStale(sourceAge, tolerance)
//   SignalRuntime.delta.{median,mad,robustZ,slope}  cheap stats
//   SignalRuntime.delta.deterioration(curr, base, factor, minAbs)
//   SignalRuntime.delta.velocity(short, long, factor)
//   SignalRuntime.passesVolumeGate(samples, entityVolume, window)
//
// Companion docs:
//   OPERATIONAL_SIGNAL_TAXONOMY.md
//   SIGNAL_SEVERITY_MODEL.md
//   OPERATIONAL_DELTA_MODEL.md

(function(global){
  'use strict';

  const SEVERITY = Object.freeze({
    INFO:  'informational',
    WARN:  'warning',
    ELEV:  'elevated',
    CRIT:  'critical',
    EMRG:  'emergency',
  });

  const SEVERITY_RANK = Object.freeze({
    informational: 0,
    warning:       1,
    elevated:      2,
    critical:      3,
    emergency:     4,
  });

  // Default cooldowns keyed (signal_name, entity_id). See SIGNAL_SEVERITY_MODEL.md.
  const COOLDOWN_MS = Object.freeze({
    informational: 24 * 3600 * 1000,
    warning:       12 * 3600 * 1000,
    elevated:       4 * 3600 * 1000,
    critical:       30 * 60   * 1000,
    emergency:       5 * 60   * 1000,
  });

  // Volume gates from OPERATIONAL_DELTA_MODEL.md.
  const VOLUME_GATES = Object.freeze({
    7:  { minSamples: 14, minEntityEvents: 5  },
    30: { minSamples: 25, minEntityEvents: 20 },
    90: { minSamples: 60, minEntityEvents: 50 },
  });

  const REGISTRY = Object.create(null);

  function registerSignal(def){
    if(!def || typeof def !== 'object') throw new Error('registerSignal: object required');
    const required = ['signal_name','category','severity','owner_role','source_system'];
    for(const k of required){
      if(!def[k]) throw new Error(`registerSignal: missing ${k}`);
    }
    if(!SEVERITY_RANK.hasOwnProperty(def.severity)){
      throw new Error(`registerSignal: invalid severity '${def.severity}'`);
    }
    if(REGISTRY[def.signal_name]){
      // Re-registration is allowed (hot reload) but logged.
      console.debug('[signals] re-registering', def.signal_name);
    }
    REGISTRY[def.signal_name] = Object.freeze({
      stale_tolerance_ms: 60 * 60 * 1000, // default 1h
      rule_version: 'v1',
      ...def,
    });
    return REGISTRY[def.signal_name];
  }

  function getDef(name){ return REGISTRY[name] || null; }
  function allDefs(){ return Object.values(REGISTRY); }

  function normalize(rec){
    if(!rec || !rec.signal_name) throw new Error('normalize: signal_name required');
    const def = getDef(rec.signal_name);
    if(!def) throw new Error(`normalize: unknown signal '${rec.signal_name}'`);
    return {
      signal_name:      def.signal_name,
      category:         def.category,
      severity:         rec.severity || def.severity,
      owner_role:       rec.owner_role || def.owner_role,
      source_system:    def.source_system,
      entity_type:      rec.entity_type || def.entity_type || null,
      entity_id:        rec.entity_id != null ? String(rec.entity_id) : null,
      trigger_snapshot: rec.trigger_snapshot || {},
      recommended_action: rec.recommended_action || def.recommended_action || null,
      rule_version:     def.rule_version || 'v1',
    };
  }

  function dedupeKey(rec){
    return `${rec.signal_name}::${rec.entity_id || '_global_'}`;
  }

  function isStale(sourceAgeMs, toleranceMs){
    if(sourceAgeMs == null || toleranceMs == null) return false;
    return sourceAgeMs > toleranceMs;
  }

  // ── Robust statistics (cheap, dependency-free) ──
  function median(arr){
    const a = arr.filter(x => Number.isFinite(x)).slice().sort((x,y)=>x-y);
    if(!a.length) return null;
    const mid = Math.floor(a.length/2);
    return a.length % 2 ? a[mid] : (a[mid-1]+a[mid])/2;
  }

  function mad(arr){
    const m = median(arr);
    if(m == null) return null;
    return median(arr.filter(Number.isFinite).map(x => Math.abs(x - m)));
  }

  function robustZ(x, sample){
    const m = median(sample);
    const d = mad(sample);
    if(m == null || !d) return null;
    return (x - m) / d;
  }

  // Simple OLS slope on indexed points; returns null if <2 finite points.
  function slope(arr){
    const pts = arr.map((y,i)=>[i, y]).filter(p => Number.isFinite(p[1]));
    if(pts.length < 2) return null;
    const n = pts.length;
    let sx=0, sy=0, sxx=0, sxy=0;
    for(const [x,y] of pts){ sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; }
    const denom = n*sxx - sx*sx;
    if(!denom) return 0;
    return (n*sxy - sx*sy) / denom;
  }

  function deterioration(current, baseline, factor, minAbs){
    if(!Number.isFinite(current) || !Number.isFinite(baseline)) return false;
    if(baseline <= 0) return false;
    const ratioFail = current < baseline * factor;
    const absFail   = (baseline - current) >= (minAbs || 0);
    return ratioFail && absFail;
  }

  function velocity(shortWin, longWin, slowdownFactor){
    if(!Number.isFinite(shortWin) || !Number.isFinite(longWin) || longWin <= 0) return false;
    return shortWin > longWin * slowdownFactor;
  }

  function passesVolumeGate(samples, entityEvents, windowDays){
    const g = VOLUME_GATES[windowDays];
    if(!g) return true; // unknown window — don't block
    return samples >= g.minSamples && entityEvents >= g.minEntityEvents;
  }

  const SignalRuntime = {
    SEVERITY,
    SEVERITY_RANK,
    COOLDOWN_MS,
    VOLUME_GATES,
    registerSignal,
    getDef,
    allDefs,
    normalize,
    dedupeKey,
    isStale,
    passesVolumeGate,
    delta: { median, mad, robustZ, slope, deterioration, velocity },
  };

  global.SignalRuntime = SignalRuntime;
})(typeof window !== 'undefined' ? window : globalThis);
