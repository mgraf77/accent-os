// ── SIGNAL COMMAND SURFACE — operational visibility layer ──
// Additive overlay that surfaces signals from SignalEngine inside existing pages
// without rewriting their renderers.
//
// Public API:
//   SignalCommandSurface.injectVendorRail(container, section)   one-line hook from renderVendors
//   SignalCommandSurface.renderCriticalStrip(target)            page-top critical/emergency strip
//   SignalCommandSurface.renderExecSummary(target)              "3 vendors deteriorating" style
//   SignalCommandSurface.renderClusters(target)                 deteriorating/opportunity/stale clusters
//   SignalCommandSurface.renderMobileFeed(target)               touch-first mobile feed
//   SignalCommandSurface.renderPulseBar(target, opts)           operational pulse bar primitive
//   SignalCommandSurface.refreshAll()                           re-render every mounted surface
//
// Visual primitives (all dependency-free, inline-styled to avoid CSS collisions):
//   _pulseBar, _severityLadder, _trendStrip, _heatDot, _confidenceLadder
//
// Doctrine: additive overlays only. No invasive rewrites. No websockets.
// Reads from SignalEngine.openSignals(). Writes nothing.

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  const SE = global.SignalEngine;
  if(!RT || !SE){ console.warn('[signals] command-surface: runtime/engine missing'); return; }

  const SEV = {
    emergency:     { label:'EMRG',  bg:'#7f1d1d', fg:'#fff', dot:'#7f1d1d' },
    critical:      { label:'CRIT',  bg:'#dc2626', fg:'#fff', dot:'#dc2626' },
    elevated:      { label:'ELEV',  bg:'#d97706', fg:'#fff', dot:'#d97706' },
    warning:       { label:'WARN',  bg:'#ca8a04', fg:'#fff', dot:'#ca8a04' },
    informational: { label:'INFO',  bg:'#475569', fg:'#fff', dot:'#94a3b8' },
  };

  const MOUNTS = new Set(); // surfaces to re-render on refresh

  // ─────────────────────────────────────────── helpers ───
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function ageLabel(iso){
    if(!iso) return '';
    const m = Math.floor((Date.now() - new Date(iso).getTime())/60000);
    if(m < 60) return `${m}m`;
    const h = Math.floor(m/60);
    if(h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  }

  function groupBy(arr, fn){
    const out = Object.create(null);
    for(const x of arr){
      const k = fn(x);
      (out[k] = out[k] || []).push(x);
    }
    return out;
  }

  function severityRankDesc(a,b){
    return (RT.SEVERITY_RANK[b.severity]||0) - (RT.SEVERITY_RANK[a.severity]||0);
  }

  // ─────────────────────────────────────────── visual primitives ───

  // Operational pulse bar: severity-tinted segment bar, totals shown right.
  // opts.signals  array of open signals
  // opts.label    bar caption
  function _pulseBar(signals, label){
    const total = signals.length;
    if(!total){
      return `<div style="font-size:11px;color:#94a3b8;font-family:'DM Mono',monospace;">
        ${esc(label || 'pulse')} · clear</div>`;
    }
    const byOrder = ['emergency','critical','elevated','warning','informational'];
    const counts = byOrder.map(s => ({ sev:s, n: signals.filter(x => x.severity === s).length }));
    const segments = counts.filter(c => c.n > 0).map(c => {
      const pct = (c.n/total)*100;
      return `<div style="flex:${c.n};background:${SEV[c.sev].bg};" title="${SEV[c.sev].label} ${c.n}"></div>`;
    }).join('');
    return `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;color:#64748b;font-family:'DM Mono',monospace;min-width:80px;">${esc(label||'pulse')}</span>
        <div style="flex:1;display:flex;height:6px;border-radius:3px;overflow:hidden;background:#f1f5f9;">${segments}</div>
        <span style="font-size:11px;font-weight:600;color:#1a1a1a;min-width:24px;text-align:right;">${total}</span>
      </div>`;
  }

  // Severity ladder: tiny vertical bars showing count per level.
  function _severityLadder(signals){
    const counts = ['emergency','critical','elevated','warning','informational']
      .map(s => ({ sev:s, n:signals.filter(x => x.severity === s).length }));
    return `<div style="display:flex;align-items:flex-end;gap:2px;height:18px;">
      ${counts.map(c => {
        const h = c.n ? Math.min(18, 4 + c.n*2) : 2;
        return `<div title="${SEV[c.sev].label}: ${c.n}" style="
          width:6px;height:${h}px;background:${c.n?SEV[c.sev].bg:'#e5e7eb'};border-radius:1px;"></div>`;
      }).join('')}
    </div>`;
  }

  // Trend strip: takes a series of numbers, renders sparkline-style cells.
  function _trendStrip(series, opts){
    const arr = (series||[]).filter(n => Number.isFinite(n));
    if(arr.length < 2) return `<span style="color:#cbd5e1;font-size:11px;">—</span>`;
    const min = Math.min(...arr), max = Math.max(...arr);
    const span = (max - min) || 1;
    const direction = arr[arr.length-1] - arr[0];
    const color = (opts && opts.invert ? -direction : direction) >= 0 ? '#16a34a' : '#dc2626';
    return `<div style="display:flex;align-items:flex-end;gap:1px;height:18px;">
      ${arr.map(v => {
        const h = 3 + Math.round(((v-min)/span)*15);
        return `<div style="width:3px;height:${h}px;background:${color};opacity:.75;border-radius:1px;"></div>`;
      }).join('')}
    </div>`;
  }

  // Heat dot: single color circle for "is this OK at a glance"
  function _heatDot(severity){
    const c = SEV[severity] || SEV.informational;
    return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.dot};"></span>`;
  }

  // Confidence ladder: 3 dots, filled by confidence (low/med/high).
  // signal.trigger_snapshot may carry __confidence: 'low'|'med'|'high'.
  function _confidenceLadder(sig){
    const c = (sig?.trigger_snapshot?.__confidence) || 'med';
    const lvl = c === 'high' ? 3 : c === 'low' ? 1 : 2;
    const ageMs = sig?.trigger_snapshot?.__sourceAgeMs;
    const stale = ageMs != null && ageMs > (60*60*1000);
    const fill = stale ? '#cbd5e1' : '#16a34a';
    return `<span title="confidence: ${c}${stale?' (source stale)':''}" style="display:inline-flex;gap:2px;">
      ${[1,2,3].map(i => `<span style="width:6px;height:6px;border-radius:50%;
        background:${i<=lvl?fill:'#e5e7eb'};"></span>`).join('')}
    </span>`;
  }

  // ─────────────────────────────────────────── card primitive ───
  function _signalCard(sig, opts){
    const s = SEV[sig.severity] || SEV.warning;
    const compact = opts && opts.compact;
    const showActions = !(opts && opts.noActions);
    return `
      <div data-signal-id="${esc(sig.id)}" style="
        background:#fff;border:1px solid #e8e8e4;border-left:3px solid ${s.bg};
        border-radius:8px;padding:${compact?'8px 10px':'12px 14px'};margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="background:${s.bg};color:${s.fg};font-size:9px;font-weight:700;
            padding:2px 5px;border-radius:3px;letter-spacing:.5px;">${s.label}</span>
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:#475569;">
            ${esc(sig.signal_name)}
          </span>
          ${_confidenceLadder(sig)}
          <span style="margin-left:auto;font-size:11px;color:#94a3b8;">
            ${ageLabel(sig.created_at)} · ${esc(sig.owner_role||'')}
          </span>
        </div>
        <div style="font-size:${compact?'12px':'13px'};color:#1a1a1a;">
          ${esc(sig.recommended_action || sig.signal_name)}
          ${sig.entity_id ? ` <span style="color:#64748b;font-family:'DM Mono',monospace;font-size:11px;">[${esc(sig.entity_id)}]</span>` : ''}
        </div>
        ${showActions ? `
          <div style="display:flex;gap:4px;margin-top:6px;">
            <button data-act="ack" style="background:#1a1a1a;color:#fff;border:none;
              border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;">Ack</button>
            <button data-act="dismiss" style="background:#fff;color:#64748b;
              border:1px solid #e8e8e4;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;">Dismiss</button>
            <button data-act="resolve" style="background:#fff;color:#16a34a;
              border:1px solid #bbf7d0;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;">Resolve</button>
          </div>
        ` : ''}
      </div>`;
  }

  function _attachActions(root){
    root.querySelectorAll('[data-signal-id]').forEach(card => {
      const sid = card.getAttribute('data-signal-id');
      card.querySelectorAll('button[data-act]').forEach(btn => {
        btn.addEventListener('click', async ev => {
          ev.stopPropagation();
          btn.disabled = true;
          const act = btn.getAttribute('data-act');
          try{
            if(act === 'ack')          await SE.ack(sid);
            else if(act === 'dismiss') await SE.dismiss(sid, 'manual');
            else if(act === 'resolve') await SE.resolve(sid);
          }finally{ refreshAll(); }
        });
      });
    });
  }

  // ─────────────────────────────────────────── surfaces ───

  // Critical strip: pinned thin bar showing CRIT/EMRG counts + jump.
  function renderCriticalStrip(target){
    const mount = typeof target === 'string' ? document.getElementById(target) : target;
    if(!mount) return;
    MOUNTS.add({ kind:'critStrip', el: mount });
    const open = SE.openSignals({});
    const high = open.filter(s => ['critical','emergency'].includes(s.severity));
    if(!high.length){ mount.innerHTML = ''; return; }
    const first = high[0];
    mount.innerHTML = `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;
        border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;">
        <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:700;
          padding:3px 8px;border-radius:4px;letter-spacing:.5px;">${high.length} OPEN</span>
        <span style="font-size:13px;color:#7f1d1d;font-weight:600;">
          ${esc(first.recommended_action || first.signal_name)}
          ${first.entity_id ? `<span style="font-family:'DM Mono',monospace;font-size:11px;font-weight:400;opacity:.7;"> [${esc(first.entity_id)}]</span>`:''}
        </span>
        <span style="margin-left:auto;font-size:11px;color:#7f1d1d;">${high.length>1?`+${high.length-1} more critical`:''}</span>
      </div>`;
  }

  // Executive summary: one-line operational narrative.
  function renderExecSummary(target){
    const mount = typeof target === 'string' ? document.getElementById(target) : target;
    if(!mount) return;
    MOUNTS.add({ kind:'execSummary', el: mount });
    const open = SE.openSignals({});
    const byCat = groupBy(open, s => s.category);

    const lines = [];
    const vendorDet = (byCat.vendor_health||[]).filter(s => s.signal_name === 'vendor.score_deteriorating');
    if(vendorDet.length) lines.push({ text:`${vendorDet.length} vendor${vendorDet.length>1?'s':''} deteriorating`, sev:'elevated' });

    const invRisk = (byCat.inventory||[]).filter(s => ['inv.stockout_active','inv.stockout_imminent','inv.negative_on_hand'].includes(s.signal_name));
    if(invRisk.length) lines.push({ text:`inventory risk: ${invRisk.length} SKU${invRisk.length>1?'s':''}`, sev: invRisk.some(s=>s.severity==='critical')?'critical':'elevated' });

    const quoteSlow = (byCat.quote||[]).filter(s => s.signal_name === 'quote.velocity_slowing');
    if(quoteSlow.length) lines.push({ text:'quote velocity slowing', sev:'elevated' });

    const stale = (byCat.quote||[]).filter(s => s.signal_name === 'quote.stale_open');
    if(stale.length) lines.push({ text:`${stale.length} stale quote${stale.length>1?'s':''}`, sev:'warning' });

    const ecomDrop = (byCat.ecommerce||[]).filter(s => s.signal_name === 'ecom.conversion_drop');
    if(ecomDrop.length) lines.push({ text:'ecommerce conversion drop', sev:'elevated' });

    const sysDown = (byCat.system_health||[]).filter(s => s.signal_name === 'sys.integration_down');
    if(sysDown.length) lines.push({ text:`${sysDown.length} integration${sysDown.length>1?'s':''} down`, sev:'critical' });

    const marginPressure = (byCat.margin||[]).length;
    if(marginPressure) lines.push({ text:'margin pressure elevated', sev:'elevated' });

    if(!lines.length){
      mount.innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
          padding:10px 14px;margin-bottom:12px;font-size:13px;color:#166534;">
          <span style="font-weight:600;">Operational pulse:</span> all clear across ${SE._state().rules} rules.
        </div>`;
      return;
    }

    mount.innerHTML = `
      <div style="background:#fff;border:1px solid #e8e8e4;border-radius:8px;
        padding:12px 14px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;">OPERATIONAL PULSE</span>
          <span style="font-size:11px;color:#94a3b8;">${open.length} open</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${lines.map(l => `<span style="
            display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
            background:${SEV[l.sev].bg}1a;color:${SEV[l.sev].bg};border-radius:14px;
            font-size:12px;font-weight:600;">
            ${_heatDot(l.sev)} ${esc(l.text)}
          </span>`).join('')}
        </div>
      </div>`;
  }

  // Cluster trio: deteriorating vendors / opportunities / stale data.
  function renderClusters(target){
    const mount = typeof target === 'string' ? document.getElementById(target) : target;
    if(!mount) return;
    MOUNTS.add({ kind:'clusters', el: mount });

    const open = SE.openSignals({});
    const deteriorating = open.filter(s => s.category === 'vendor_health');
    const opportunities = open.filter(s => s.signal_name === 'inv.dead_stock_aging'
      || s.signal_name === 'inv.stockout_imminent');
    const staleData = open.filter(s => s.signal_name === 'sys.cache_stale'
      || s.signal_name === 'sys.export_missed');

    function cluster(title, items, emptyMsg, accent){
      const top = items.slice(0,4);
      return `
        <div style="flex:1;min-width:240px;background:#fff;border:1px solid #e8e8e4;
          border-top:3px solid ${accent};border-radius:8px;padding:12px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:.5px;color:#1a1a1a;">${esc(title)}</span>
            <span style="font-size:11px;color:#94a3b8;">${items.length}</span>
          </div>
          ${items.length ? top.map(s => `
            <div data-signal-id="${esc(s.id)}" style="
              padding:6px 0;border-top:1px solid #f1f5f9;display:flex;align-items:center;gap:6px;">
              ${_heatDot(s.severity)}
              <span style="font-size:12px;color:#1a1a1a;flex:1;">
                ${esc(s.entity_id || s.signal_name)}
              </span>
              <span style="font-size:10px;color:#94a3b8;font-family:'DM Mono',monospace;">
                ${ageLabel(s.created_at)}
              </span>
            </div>
          `).join('') + (items.length > top.length ? `
            <div style="font-size:11px;color:#64748b;margin-top:6px;">+${items.length-top.length} more</div>
          ` : '') : `<div style="font-size:12px;color:#94a3b8;padding:8px 0;">${esc(emptyMsg)}</div>`}
        </div>`;
    }

    mount.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
        ${cluster('Deteriorating',  deteriorating, 'No vendor drift detected.', '#d97706')}
        ${cluster('Opportunities',  opportunities, 'No opportunities surfaced.', '#2563eb')}
        ${cluster('Stale / incomplete data', staleData, 'All sources fresh.', '#64748b')}
      </div>`;
  }

  // Vendor command center rail — assembled from the above, scoped to vendor + purchasing roles.
  function injectVendorRail(container, section){
    if(!container || section !== 'overview') return;
    // Idempotent: remove any existing rail before re-inject.
    let host = container.querySelector('#signal-vendor-rail');
    if(host){ host.remove(); }
    host = document.createElement('div');
    host.id = 'signal-vendor-rail';
    host.style.cssText = 'margin-bottom:16px;';
    host.innerHTML = `
      <div id="signal-vendor-critstrip"></div>
      <div id="signal-vendor-execsummary"></div>
      <div id="signal-vendor-pulse" style="background:#fff;border:1px solid #e8e8e4;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;margin-bottom:10px;">SIGNAL PULSE — VENDORS &amp; PURCHASING</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div id="signal-pulse-vendor"></div>
          <div id="signal-pulse-purchasing"></div>
          <div id="signal-pulse-inventory"></div>
          <div id="signal-pulse-system"></div>
        </div>
      </div>
      <div id="signal-vendor-clusters"></div>
      <div id="signal-vendor-active-rail"></div>
    `;
    // Prepend so it appears above the tab content.
    const section_node = container.querySelector('#vendor-section-content');
    if(section_node){ section_node.insertBefore(host, section_node.firstChild); }
    else { container.appendChild(host); }

    renderCriticalStrip('signal-vendor-critstrip');
    renderExecSummary('signal-vendor-execsummary');
    renderClusters('signal-vendor-clusters');
    _renderPulseRow();
    _renderActiveRail('signal-vendor-active-rail');
  }

  function _renderPulseRow(){
    const open = SE.openSignals({});
    const byRole = groupBy(open, s => s.owner_role || 'unassigned');
    const map = [
      ['signal-pulse-vendor',     'vendor',     open.filter(s => s.category === 'vendor_health')],
      ['signal-pulse-purchasing', 'purchasing', byRole.purchasing || []],
      ['signal-pulse-inventory',  'inventory',  open.filter(s => s.category === 'inventory')],
      ['signal-pulse-system',     'system',     open.filter(s => s.category === 'system_health')],
    ];
    for(const [id, label, items] of map){
      const el = document.getElementById(id);
      if(el) el.innerHTML = _pulseBar(items, label);
    }
  }

  function _renderActiveRail(targetId){
    const mount = document.getElementById(targetId);
    if(!mount) return;
    MOUNTS.add({ kind:'activeRail', el: mount });
    const open = SE.openSignals({}).filter(s => ['purchasing','warehouse','owner'].includes(s.owner_role));
    const top = open.slice(0, 6);
    if(!top.length){
      mount.innerHTML = `
        <div style="background:#fff;border:1px solid #e8e8e4;border-radius:8px;padding:14px;
          font-size:12px;color:#94a3b8;text-align:center;">No active operational signals.</div>`;
      return;
    }
    mount.innerHTML = `
      <div style="background:#fff;border:1px solid #e8e8e4;border-radius:8px;padding:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;">ACTIVE SIGNALS</span>
          ${_severityLadder(open)}
          <span style="margin-left:auto;font-size:11px;color:#94a3b8;">showing ${top.length} of ${open.length}</span>
        </div>
        ${top.map(s => _signalCard(s, { compact:true })).join('')}
      </div>`;
    _attachActions(mount);
  }

  // Mobile feed: touch-first, severity ordered, suppression aware.
  function renderMobileFeed(target){
    const mount = typeof target === 'string' ? document.getElementById(target) : target;
    if(!mount) return;
    MOUNTS.add({ kind:'mobileFeed', el: mount });
    const open = SE.openSignals({});
    const grouped = groupBy(open, s => s.severity);
    const ladders = [
      { sev:'emergency', label:'Emergencies' },
      { sev:'critical',  label:'Critical' },
      { sev:'elevated',  label:'Elevated' },
      { sev:'warning',   label:'Warnings' },
    ];
    mount.innerHTML = `
      <div style="max-width:480px;margin:0 auto;padding:12px;font-family:'Outfit',sans-serif;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <h2 style="margin:0;font-size:16px;font-weight:700;">Operations</h2>
          ${_severityLadder(open)}
          <button id="sigMobileRefresh" style="margin-left:auto;background:#fff;border:1px solid #e8e8e4;
            border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;">↻</button>
        </div>
        <div style="background:#fff;border:1px solid #e8e8e4;border-radius:8px;padding:10px;margin-bottom:10px;">
          ${_pulseBar(open, 'all signals')}
        </div>
        ${ladders.map(({sev, label}) => {
          const list = (grouped[sev]||[]).slice(0,5);
          if(!list.length) return '';
          return `
            <div style="margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                ${_heatDot(sev)}
                <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;">
                  ${esc(label.toUpperCase())} · ${(grouped[sev]||[]).length}
                </span>
              </div>
              ${list.map(s => _signalCard(s, { compact:true })).join('')}
            </div>`;
        }).join('')}
        ${open.length === 0 ? `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
            padding:18px;text-align:center;color:#166534;font-size:13px;">All clear.</div>` : ''}
      </div>`;
    _attachActions(mount);
    const btn = mount.querySelector('#sigMobileRefresh');
    if(btn) btn.addEventListener('click', async () => { await SE.hydrate(); refreshAll(); });
  }

  // ─────────────────────────────────────────── refresh ───
  function refreshAll(){
    // Drop dead mounts (removed from DOM) then re-render the rest.
    const alive = [];
    for(const m of MOUNTS){
      if(!m.el || !document.body.contains(m.el)) continue;
      alive.push(m);
    }
    MOUNTS.clear();
    for(const m of alive){
      if(m.kind === 'critStrip')   renderCriticalStrip(m.el);
      else if(m.kind === 'execSummary') renderExecSummary(m.el);
      else if(m.kind === 'clusters')    renderClusters(m.el);
      else if(m.kind === 'mobileFeed')  renderMobileFeed(m.el);
      else if(m.kind === 'activeRail')  _renderActiveRail(m.el.id);
    }
    _renderPulseRow();
  }

  global.SignalCommandSurface = {
    injectVendorRail,
    renderCriticalStrip,
    renderExecSummary,
    renderClusters,
    renderMobileFeed,
    refreshAll,
    // Primitive exports for re-use by other surfaces.
    primitives: { _pulseBar, _severityLadder, _trendStrip, _heatDot, _confidenceLadder, _signalCard },
  };

  // ─────────────────────────────────────────── auto-mount ───
  function autoBoot(){
    // Mobile feed if mount point present (independent of vendor page).
    const mobile = document.getElementById('signalMobileFeed');
    if(mobile){
      SE.hydrate().then(() => renderMobileFeed(mobile)).catch(()=>{});
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoBoot);
  } else {
    autoBoot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
