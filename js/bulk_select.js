// ── BULK SELECT (multi-row select + action bar for list pages) ──
// Per-module checkbox state + a sticky action bar that surfaces when ≥1 row is selected.
//
// Usage in a module's render fn:
//   bulkSelRegister('inventory', [
//     {id:'delete', label:'Delete', color:'outline', confirm:'Delete {n} SKUs?', fn: ids => doBulkInventoryDelete(ids)}
//   ]);
//   // In list header HTML:
//   ${bulkSelBar('inventory')}
//   // In each row:
//   <td>${bulkSelCheckbox('inventory', r.id)}</td>
//   // In header row of <thead>:
//   <th>${bulkSelHeaderCheckbox('inventory', filtered.map(x=>x.id))}</th>

const _BULK_SEL = {};        // moduleKey → Set<id>
const _BULK_ACTIONS = {};    // moduleKey → [{id,label,fn,color?,confirm?}]

function bulkSelRegister(moduleKey, actions){
  _BULK_ACTIONS[moduleKey] = actions || [];
  _BULK_SEL[moduleKey] = _BULK_SEL[moduleKey] || new Set();
}

function bulkSelGetIds(moduleKey){
  return [...(_BULK_SEL[moduleKey] || new Set())];
}

function bulkSelClear(moduleKey){
  _BULK_SEL[moduleKey] = new Set();
  document.querySelectorAll(`[data-bulk="${moduleKey}"]`).forEach(cb => { cb.checked = false; });
  _bulkSelUpdateBar(moduleKey);
}

function bulkSelToggle(moduleKey, id, checkboxEl){
  const set = _BULK_SEL[moduleKey] = _BULK_SEL[moduleKey] || new Set();
  if(checkboxEl ? checkboxEl.checked : !set.has(id)){
    set.add(id);
  } else {
    set.delete(id);
  }
  _bulkSelUpdateBar(moduleKey);
}

function bulkSelToggleAll(moduleKey, ids, checkboxEl){
  const set = _BULK_SEL[moduleKey] = _BULK_SEL[moduleKey] || new Set();
  if(checkboxEl ? checkboxEl.checked : set.size === 0){
    ids.forEach(id => set.add(id));
  } else {
    ids.forEach(id => set.delete(id));
  }
  document.querySelectorAll(`[data-bulk="${moduleKey}"]`).forEach(cb => {
    cb.checked = set.has(cb.value);
  });
  _bulkSelUpdateBar(moduleKey);
}

function bulkSelCheckbox(moduleKey, id){
  const checked = (_BULK_SEL[moduleKey] || new Set()).has(String(id));
  return `<input type="checkbox" data-bulk="${moduleKey}" value="${esc(String(id))}" ${checked?'checked':''} onclick="event.stopPropagation();bulkSelToggle('${moduleKey}','${esc(String(id))}',this)" style="cursor:pointer;">`;
}

function bulkSelHeaderCheckbox(moduleKey, ids){
  // Stash the visible-id list so bulkSelToggleAll knows what to flip
  window._bulkSelVisible = window._bulkSelVisible || {};
  window._bulkSelVisible[moduleKey] = ids.map(String);
  const set = _BULK_SEL[moduleKey] || new Set();
  const allChecked = ids.length > 0 && ids.every(id => set.has(String(id)));
  return `<input type="checkbox" ${allChecked?'checked':''} onclick="event.stopPropagation();bulkSelToggleAll('${moduleKey}',window._bulkSelVisible['${moduleKey}'],this)" style="cursor:pointer;" title="Select all visible">`;
}

function bulkSelBar(moduleKey){
  const actions = _BULK_ACTIONS[moduleKey] || [];
  const set = _BULK_SEL[moduleKey] || new Set();
  const count = set.size;
  const btns = actions.map(a => `<button class="btn btn-${a.color||'outline'} btn-sm" style="font-size:11px;" onclick="bulkSelInvoke('${moduleKey}','${esc(a.id)}')">${esc(a.label)}</button>`).join(' ');
  return `<div id="bulk-bar-${moduleKey}" style="${count===0?'display:none;':''}position:sticky;top:0;background:#ecfeff;border:1px solid #06b6d4;padding:8px 12px;border-radius:6px;display:flex;align-items:center;gap:10px;margin-bottom:10px;z-index:5;flex-wrap:wrap;">
    <span class="bulk-count" style="font-weight:600;font-size:12px;color:#0e7490;">${count} selected</span>
    ${btns}
    <button class="btn btn-outline btn-sm" style="font-size:11px;margin-left:auto;" onclick="bulkSelClear('${moduleKey}')">Clear</button>
  </div>`;
}

function _bulkSelUpdateBar(moduleKey){
  const bar = document.getElementById('bulk-bar-' + moduleKey);
  const count = (_BULK_SEL[moduleKey] || new Set()).size;
  if(!bar) return;
  bar.style.display = count === 0 ? 'none' : '';
  const span = bar.querySelector('.bulk-count');
  if(span) span.textContent = count + ' selected';
}

function bulkSelInvoke(moduleKey, actionId){
  const actions = _BULK_ACTIONS[moduleKey] || [];
  const action = actions.find(a => a.id === actionId);
  if(!action){ toast('Unknown action','err'); return; }
  const ids = bulkSelGetIds(moduleKey);
  if(!ids.length){ toast('No rows selected','err'); return; }
  if(action.confirm && !confirm(action.confirm.replace('{n}', ids.length))) return;
  action.fn(ids);
}
