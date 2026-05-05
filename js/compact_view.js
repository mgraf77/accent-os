// ── COMPACT VIEW TOGGLE (global density switch) ──
// Adds a `body.compact` class that tightens table padding + row spacing across
// all list pages. Persisted in localStorage so the choice sticks across reloads.
// CSS rules live in index.html (search "/* compact view */"). The script-side
// API is just toggle + persistence + a topbar button host.

const _COMPACT_KEY = 'accentos_compact_view';

function isCompactView(){
  try{ return localStorage.getItem(_COMPACT_KEY) === '1'; }
  catch(e){ return false; }
}

function setCompactView(on){
  try{ localStorage.setItem(_COMPACT_KEY, on ? '1' : '0'); }catch(e){}
  document.body.classList.toggle('compact', !!on);
  const btn = document.getElementById('compact-toggle-btn');
  if(btn){
    btn.title = on ? 'Switch to roomy view' : 'Switch to compact view';
    btn.textContent = on ? '☰' : '☷';
    btn.style.color = on ? 'var(--accent)' : 'var(--text-3)';
  }
  if(typeof sbAuditLog === 'function') sbAuditLog('compact_view_toggle', 'ui', {state: on ? 'on' : 'off'});
}

function toggleCompactView(){
  setCompactView(!isCompactView());
}

function mountCompactToggle(){
  // Idempotent — re-running just re-applies state.
  document.body.classList.toggle('compact', isCompactView());
  const host = document.querySelector('.topbar > div:last-child');
  if(!host || document.getElementById('compact-toggle-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'compact-toggle-btn';
  btn.type = 'button';
  btn.style.cssText = 'background:transparent;border:1px solid var(--border);border-radius:6px;width:30px;height:30px;cursor:pointer;font-size:14px;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;';
  btn.onclick = toggleCompactView;
  // Insert before pg-actions so it's grouped with bell + search
  const actions = host.querySelector('#pg-actions');
  if(actions) host.insertBefore(btn, actions);
  else host.appendChild(btn);
  setCompactView(isCompactView());
}

// Mount on DOMContentLoaded (script loads before body content is ready in some cases).
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', mountCompactToggle);
} else {
  mountCompactToggle();
}
