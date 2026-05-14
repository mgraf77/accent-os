// ── SIGNAL FEED — operator-facing prototype ──
// Mobile-first, scan-first feed. Priority-ordered (severity, then age).
// Renders open signals from SignalEngine. Suppression-aware (only open signals
// surface here), confidence-aware (shows source + age in trigger snapshot).
//
// Mount points (any present is fine — none required):
//   <div id="signalFeedMount"></div>      full-page feed (e.g. on a dedicated view)
//   <div id="signalFeedMini"></div>       compact 5-card mobile feed
//
// Entry points:
//   SignalFeed.render(target?)
//   SignalFeed.renderMini(target?)
//   SignalFeed.refresh()    re-hydrate from Supabase then re-render mounted views

(function(global){
  'use strict';

  const RT = global.SignalRuntime;
  const SE = global.SignalEngine;
  if(!RT || !SE){ console.warn('[signals] feed: runtime/engine missing'); return; }

  const SEV_STYLE = {
    emergency:     { label:'EMRG',  bg:'#7f1d1d', fg:'#fff' },
    critical:      { label:'CRIT',  bg:'#dc2626', fg:'#fff' },
    elevated:      { label:'ELEV',  bg:'#d97706', fg:'#fff' },
    warning:       { label:'WARN',  bg:'#ca8a04', fg:'#fff' },
    informational: { label:'INFO',  bg:'#475569', fg:'#fff' },
  };

  function ageLabel(iso){
    if(!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms/60000);
    if(m < 60) return `${m}m`;
    const h = Math.floor(m/60);
    if(h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  }

  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function snapshotChips(snap){
    if(!snap || typeof snap !== 'object') return '';
    const keys = Object.keys(snap).filter(k => !k.startsWith('__')).slice(0,3);
    return keys.map(k => `<span style="
        display:inline-block;padding:2px 6px;margin-right:4px;border-radius:4px;
        background:#f1f5f9;color:#334155;font-size:11px;font-family:'DM Mono',monospace;">
        ${escapeHtml(k)}=${escapeHtml(snap[k])}
      </span>`).join('');
  }

  function card(sig, opts){
    const sev = SEV_STYLE[sig.severity] || SEV_STYLE.warning;
    const compact = opts && opts.compact;
    return `
      <div data-signal-id="${escapeHtml(sig.id)}" style="
        background:#fff;border:1px solid #e8e8e4;border-left:4px solid ${sev.bg};
        border-radius:8px;padding:${compact?'10px 12px':'14px 16px'};
        margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,.04);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="background:${sev.bg};color:${sev.fg};font-size:10px;font-weight:700;
            padding:2px 6px;border-radius:4px;letter-spacing:.5px;">${sev.label}</span>
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:#475569;">
            ${escapeHtml(sig.signal_name)}
          </span>
          <span style="margin-left:auto;font-size:11px;color:#94a3b8;">
            ${ageLabel(sig.created_at)} • ${escapeHtml(sig.owner_role||'')}
          </span>
        </div>
        <div style="font-size:${compact?'13px':'14px'};color:#1a1a1a;margin-bottom:6px;">
          ${escapeHtml(sig.recommended_action || sig.signal_name)}
          ${sig.entity_id ? ` <span style="color:#64748b;font-family:'DM Mono',monospace;font-size:12px;">[${escapeHtml(sig.entity_id)}]</span>` : ''}
        </div>
        ${compact ? '' : `<div style="margin-bottom:8px;">${snapshotChips(sig.trigger_snapshot)}</div>`}
        <div style="display:flex;gap:6px;">
          <button data-act="ack" style="
            background:#1a1a1a;color:#fff;border:none;border-radius:6px;
            padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;">
            Acknowledge
          </button>
          <button data-act="dismiss" style="
            background:#fff;color:#64748b;border:1px solid #e8e8e4;border-radius:6px;
            padding:6px 12px;font-size:12px;cursor:pointer;">
            Dismiss
          </button>
          <button data-act="resolve" style="
            background:#fff;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;
            padding:6px 12px;font-size:12px;cursor:pointer;">
            Resolve
          </button>
        </div>
      </div>`;
  }

  function emptyState(msg){
    return `<div style="text-align:center;padding:32px 16px;color:#94a3b8;font-size:13px;">
      ${escapeHtml(msg || 'No open signals.')}
    </div>`;
  }

  function attachHandlers(root){
    root.querySelectorAll('[data-signal-id]').forEach(card => {
      const sid = card.getAttribute('data-signal-id');
      card.querySelectorAll('button[data-act]').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const act = btn.getAttribute('data-act');
          btn.disabled = true;
          try{
            if(act === 'ack')      await SE.ack(sid);
            else if(act === 'dismiss') await SE.dismiss(sid, 'manual');
            else if(act === 'resolve') await SE.resolve(sid);
          }finally{
            render();
            renderMini();
          }
        });
      });
    });
  }

  function render(target){
    const mount = target || document.getElementById('signalFeedMount');
    if(!mount) return;
    const sigs = SE.openSignals({});
    mount.innerHTML = `
      <div style="max-width:720px;margin:0 auto;padding:12px;">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px;">
          <h2 style="margin:0;font-size:18px;">Operational Signals</h2>
          <span style="color:#94a3b8;font-size:12px;">${sigs.length} open</span>
          <button id="sigFeedRefresh" style="margin-left:auto;background:#fff;border:1px solid #e8e8e4;
            border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;">Refresh</button>
        </div>
        ${sigs.length ? sigs.map(s => card(s)).join('') : emptyState()}
      </div>`;
    attachHandlers(mount);
    const btn = mount.querySelector('#sigFeedRefresh');
    if(btn) btn.addEventListener('click', () => refresh());
  }

  function renderMini(target){
    const mount = target || document.getElementById('signalFeedMini');
    if(!mount) return;
    // Mobile feed contract: max 5 cards, only CRIT/EMRG + top ELEV.
    const all = SE.openSignals({});
    const high = all.filter(s => ['critical','emergency'].includes(s.severity));
    const elev = all.filter(s => s.severity === 'elevated');
    const picks = high.concat(elev).slice(0, 5);
    mount.innerHTML = `
      <div style="padding:8px;">
        ${picks.length ? picks.map(s => card(s, {compact:true})).join('') : emptyState('All clear.')}
      </div>`;
    attachHandlers(mount);
  }

  async function refresh(){
    await SE.hydrate();
    render();
    renderMini();
  }

  global.SignalFeed = { render, renderMini, refresh };

  // Auto-render on DOM ready if mount points exist.
  function autoBoot(){
    if(document.getElementById('signalFeedMount') || document.getElementById('signalFeedMini')){
      SE.hydrate().then(() => { render(); renderMini(); }).catch(()=>{});
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoBoot);
  } else {
    autoBoot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
