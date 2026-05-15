// js/signals_panel.js — Debug-only runtime visibility panel for SIGNALS (M49)
// ─────────────────────────────────────────────────────────────────────────────
// Tiny floating panel showing:
//   • queue depth (pending)
//   • oldest pending age
//   • dead-letter count
//   • worker running status
//
// Hidden by default. Activate with any of:
//   • URL: ?signals_debug=1
//   • Console: SIGNAL_PANEL.show()
//   • localStorage: localStorage.setItem('signals_debug','1')
// ─────────────────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  let _el = null;
  let _timer = null;

  function _shouldAutoShow(){
    try{
      if(/[?&]signals_debug=1\b/.test(location.search)) return true;
      if(localStorage.getItem('signals_debug') === '1') return true;
    }catch(_){}
    return false;
  }

  function _fmtAge(iso){
    if(!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if(!isFinite(ms) || ms < 0) return '—';
    const s = Math.floor(ms/1000);
    if(s < 60) return s + 's';
    if(s < 3600) return Math.floor(s/60) + 'm';
    return Math.floor(s/3600) + 'h';
  }

  function _mount(){
    if(_el) return _el;
    _el = document.createElement('div');
    _el.id = 'signals-debug-panel';
    _el.style.cssText = [
      'position:fixed','right:12px','bottom:12px','z-index:99999',
      'background:rgba(20,20,20,.92)','color:#eaeaea','font:11px/1.4 DM Mono,monospace',
      'padding:8px 10px','border-radius:8px','min-width:220px',
      'box-shadow:0 6px 18px rgba(0,0,0,.35)','border:1px solid #333',
    ].join(';');
    _el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:600;color:#fff;">SIGNALS</span>
        <span style="cursor:pointer;color:#999;" id="signals-debug-close">×</span>
      </div>
      <div id="signals-debug-body">loading…</div>`;
    document.body.appendChild(_el);
    _el.querySelector('#signals-debug-close').onclick = hide;
    return _el;
  }

  function _row(label, value, accent){
    const color = accent || '#eaeaea';
    return `<div style="display:flex;justify-content:space-between;gap:12px;">
      <span style="color:#999;">${label}</span>
      <span style="color:${color};">${value}</span>
    </div>`;
  }

  async function _refresh(){
    if(!_el) return;
    const body = _el.querySelector('#signals-debug-body');
    if(!window.SIGNALS || typeof window.SIGNALS.metrics !== 'function'){
      body.innerHTML = _row('runtime', 'unavailable', '#f87171');
      return;
    }
    let m = null;
    try{ m = await window.SIGNALS.metrics(); }
    catch(e){
      body.innerHTML = _row('error', String(e && e.message || e).slice(0,40), '#f87171');
      return;
    }
    const snap = (m && m.snapshot) || {};
    const live = (m && m.live) || {};
    const pending = snap.queue_depth_pending != null ? snap.queue_depth_pending : '—';
    const oldest = _fmtAge(snap.oldest_pending_at);
    const dead = snap.dead_letter_count != null ? snap.dead_letter_count : '—';
    const running = live.worker_running ? 'running' : 'stopped';
    const runColor = live.worker_running ? '#86efac' : '#fca5a5';
    const deadColor = (typeof dead === 'number' && dead > 0) ? '#fbbf24' : '#eaeaea';

    const skipped = live.effects_skipped_replay | 0;
    const skipColor = skipped > 0 ? '#86efac' : '#999';
    const lastErr = live.last_error ? String(live.last_error).slice(0, 36) : '';
    body.innerHTML = [
      _row('pending', pending),
      _row('oldest', oldest),
      _row('dead', dead, deadColor),
      _row('worker', running, runColor),
      _row('enq/ok/fail', `${live.enqueued|0}/${live.succeeded|0}/${live.failed|0}`),
      _row('replay-skip', skipped, skipColor),
      lastErr ? _row('last-err', lastErr, '#fbbf24') : '',
      snap.error ? _row('rpc', String(snap.error).slice(0,32), '#fbbf24') : '',
    ].filter(Boolean).join('');
  }

  function show(){
    _mount();
    _el.style.display = 'block';
    if(!_timer) _timer = setInterval(_refresh, 5000);
    _refresh();
  }
  function hide(){
    if(_el) _el.style.display = 'none';
    if(_timer){ clearInterval(_timer); _timer = null; }
  }
  function toggle(){ (_el && _el.style.display !== 'none') ? hide() : show(); }

  window.SIGNAL_PANEL = { show, hide, toggle, refresh: _refresh };

  // Auto-show if hint present, but wait for DOM + runtime.
  function _autoBoot(){
    if(!_shouldAutoShow()) return;
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', show, { once: true });
    } else { show(); }
  }
  _autoBoot();
})();
