// ── SAVED FILTER SETS (cross-cutting per-page filter persistence) ──
// Each list page has its own filter state object (invFilter, jobFilter, etc.).
// This helper saves named snapshots of those objects to localStorage so users
// can reapply a common filter combo in one click.
register({ name: 'saved_filters', provides: ['getSavedFilters','saveFilterSet','deleteFilterSet'], consumes: ['$','toast','CU'] });
//
// Usage in a module's render function:
//   const bar = savedFiltersBar({
//     moduleKey: 'inventory',
//     currentFilter: invFilter,
//     applyFn: (f) => { Object.assign(invFilter, f); renderInventory($('pg-content')); },
//     fields: ['q','vendor','lowOnly','location']  // which keys to capture
//   });
//   // splice `bar` into the filter row's HTML

const _SF_STORE_KEY = 'accentos_saved_filters';

function _sfReadAll(){
  try{
    const raw = localStorage.getItem(_SF_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ console.warn('[saved_filters] read failed:', e.message); return {}; }
}

function _sfWriteAll(obj){
  try{ localStorage.setItem(_SF_STORE_KEY, JSON.stringify(obj)); }
  catch(e){ console.warn('[saved_filters] write failed:', e.message); }
}

function getSavedFilters(moduleKey){
  const all = _sfReadAll();
  return all[moduleKey] || {};
}

function saveFilterSet(moduleKey, name, filterState, fields){
  if(!moduleKey || !name) return false;
  const all = _sfReadAll();
  all[moduleKey] = all[moduleKey] || {};
  // Snapshot only the requested fields (skip anything else from the live filter object)
  const snap = {};
  if(fields && fields.length){
    fields.forEach(k => { if(filterState[k] !== undefined) snap[k] = filterState[k]; });
  } else {
    Object.assign(snap, filterState);
  }
  all[moduleKey][name] = {fields: snap, saved_at: new Date().toISOString()};
  _sfWriteAll(all);
  if(typeof sbAuditLog === 'function') sbAuditLog('saved_filter_create', moduleKey, {name});
  return true;
}

function deleteFilterSet(moduleKey, name){
  const all = _sfReadAll();
  if(all[moduleKey] && all[moduleKey][name]){
    delete all[moduleKey][name];
    if(!Object.keys(all[moduleKey]).length) delete all[moduleKey];
    _sfWriteAll(all);
    if(typeof sbAuditLog === 'function') sbAuditLog('saved_filter_delete', moduleKey, {name});
    return true;
  }
  return false;
}

function applyFilterSet(moduleKey, name, applyFn){
  const sets = getSavedFilters(moduleKey);
  const set = sets[name];
  if(!set){ toast('Filter set not found', 'err'); return false; }
  applyFn(set.fields || {});
  if(typeof sbAuditLog === 'function') sbAuditLog('saved_filter_apply', moduleKey, {name});
  return true;
}

// Returns a render-ready HTML snippet — filter chips + Save / Manage buttons.
// Pass {moduleKey, currentFilter, applyFn, fields, label?, resetState?}.
function savedFiltersBar(opts){
  const {moduleKey, currentFilter, applyFn, fields, label, resetState} = opts || {};
  if(!moduleKey || !applyFn) return '';
  const sets = getSavedFilters(moduleKey);
  const names = Object.keys(sets);
  // Stash the raw values for inline-onclick use
  window._sfCtx = window._sfCtx || {};
  window._sfCtx[moduleKey] = {currentFilter, applyFn, fields, resetState};
  const chips = names.map(name => `
    <span class="sf-chip" style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:11px;background:var(--accent-light,#dbeafe);color:var(--accent,#1e40af);font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--accent,#1e40af);" onclick="_sfApply('${esc(moduleKey)}','${esc(name)}')" title="Apply filter">★ ${esc(name)}<button onclick="event.stopPropagation();_sfDelete('${esc(moduleKey)}','${esc(name)}')" style="background:none;border:none;color:inherit;cursor:pointer;padding:0;margin-left:4px;font-size:10px;opacity:0.6;" title="Delete">✕</button></span>
  `).join('');
  const lab = label || 'Saved:';
  return `<span class="sf-bar" style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;">
    ${names.length ? `<span style="font-size:11px;color:var(--text-3);font-weight:600;">${lab}</span>${chips}` : ''}
    <button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 8px;" onclick="_sfSavePrompt('${esc(moduleKey)}')" title="Save current filter combo">+ Save filter</button>
  </span>`;
}

function _sfApply(moduleKey, name){
  const ctx = (window._sfCtx||{})[moduleKey];
  if(!ctx){ toast('Filter context missing', 'err'); return; }
  // Reset first so applied set doesn't merge with stale state
  if(ctx.resetState) Object.assign(ctx.currentFilter, ctx.resetState);
  applyFilterSet(moduleKey, name, (f) => {
    Object.assign(ctx.currentFilter, f);
    ctx.applyFn(ctx.currentFilter);
  });
}

function _sfDelete(moduleKey, name){
  if(!confirm(`Delete saved filter "${name}"?`)) return;
  deleteFilterSet(moduleKey, name);
  const ctx = (window._sfCtx||{})[moduleKey];
  if(ctx) ctx.applyFn(ctx.currentFilter);  // re-render to refresh chip row
}

function _sfSavePrompt(moduleKey){
  const ctx = (window._sfCtx||{})[moduleKey];
  if(!ctx){ toast('Filter context missing', 'err'); return; }
  const name = (prompt('Name this filter combo:') || '').trim();
  if(!name) return;
  if(name.length > 40){ toast('Name too long (40 chars max)', 'err'); return; }
  saveFilterSet(moduleKey, name, ctx.currentFilter, ctx.fields);
  ctx.applyFn(ctx.currentFilter);  // re-render to show new chip
  toast(`Saved: ${name}`, 'ok');
}
