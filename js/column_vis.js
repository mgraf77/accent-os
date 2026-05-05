// ── COLUMN VISIBILITY TOGGLE (per-module, persisted) ──
// Modules opt in by:
//   1) Tagging each toggleable <th> + matching <td> with class="${colCls(modKey,key)}".
//      `colCls` returns '' or 'col-hidden' (CSS rule: .col-hidden{display:none}).
//   2) Splicing colMenuButton(moduleKey, columns, applyFn) into the filter row.
//      The button opens a popover with a checkbox per column. Toggling persists
//      and calls applyFn (typically the module's render fn) so the table redraws
//      with the new hidden set baked in.
// State lives in localStorage under a single key so it survives reloads.

const _COLVIS_KEY = 'accentos_hidden_cols';

function _colVisRead(){
  try{
    const raw = localStorage.getItem(_COLVIS_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}

function _colVisWrite(obj){
  try{ localStorage.setItem(_COLVIS_KEY, JSON.stringify(obj)); }catch(e){}
}

function isColHidden(moduleKey, key){
  const all = _colVisRead();
  return (all[moduleKey]||[]).includes(key);
}

// Returns 'col-hidden' or '' — splice into class="" of <th>/<td>.
function colCls(moduleKey, key){
  return isColHidden(moduleKey, key) ? 'col-hidden' : '';
}

function setColHidden(moduleKey, key, hidden){
  const all = _colVisRead();
  all[moduleKey] = all[moduleKey] || [];
  const idx = all[moduleKey].indexOf(key);
  if(hidden && idx === -1) all[moduleKey].push(key);
  if(!hidden && idx !== -1) all[moduleKey].splice(idx,1);
  _colVisWrite(all);
}

function resetColVis(moduleKey){
  const all = _colVisRead();
  delete all[moduleKey];
  _colVisWrite(all);
}

// columns: [{key, label}, ...]; applyCallbackName: name of a global fn to call
// after toggling (e.g. "renderInventory"). The fn is looked up at click time so
// late-loaded modules still work.
function colMenuButton(moduleKey, columns, applyCallbackName){
  if(!Array.isArray(columns) || !columns.length) return '';
  const popoverId = `colvis-pop-${moduleKey}`;
  const all = _colVisRead();
  const hiddenSet = new Set(all[moduleKey]||[]);
  const hiddenCount = columns.filter(c => hiddenSet.has(c.key)).length;
  const cb = applyCallbackName || '';
  const items = columns.map(c => {
    const checked = !hiddenSet.has(c.key);
    return `<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;font-size:12px;cursor:pointer;border-radius:4px;" onmouseover="this.style.background='var(--bg-2)';" onmouseout="this.style.background='';">
      <input type="checkbox" ${checked?'checked':''} onchange="setColHidden('${moduleKey}','${c.key}',!this.checked);if(typeof ${cb}==='function')${cb}();">
      <span>${esc(c.label)}</span>
    </label>`;
  }).join('');
  return `<span style="position:relative;display:inline-block;">
    <button type="button" class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="document.getElementById('${popoverId}').style.display=document.getElementById('${popoverId}').style.display==='block'?'none':'block';event.stopPropagation();" title="Show / hide columns">⫶ Columns${hiddenCount?` <span class='badge bg-gray' style='font-size:9px;margin-left:4px;'>${hiddenCount}</span>`:''}</button>
    <div id="${popoverId}" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:var(--surface);border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,0.10);padding:6px;min-width:180px;z-index:30;">
      ${items}
      <div style="border-top:1px solid var(--border-light);margin:6px 0;"></div>
      <button type="button" class="btn btn-outline btn-sm" style="font-size:11px;width:100%;" onclick="resetColVis('${moduleKey}');if(typeof ${cb}==='function')${cb}();">Reset (show all)</button>
    </div>
  </span>`;
}

// Outside-click closes any open column-vis popover.
document.addEventListener('click', (e) => {
  document.querySelectorAll('[id^="colvis-pop-"]').forEach(p => {
    if(p.style.display === 'block' && !p.contains(e.target)) p.style.display = 'none';
  });
});
