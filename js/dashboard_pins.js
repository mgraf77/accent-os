// Dashboard Pins — extracted from index.html (v6.10.77)
// Depends on: CU, MODULE_REGISTRY, openModal, closeModal, esc, goTo, dashboard

function loadDashPins(){
  const uid = CU?.user_id||'anon';
  try{ return JSON.parse(localStorage.getItem(`aos_dash_pins_${uid}`)||'[]'); }catch(e){ return []; }
}
function saveDashPins(keys){
  localStorage.setItem(`aos_dash_pins_${CU?.user_id||'anon'}`, JSON.stringify(keys));
}
function openPinModal(){
  const pins = loadDashPins();
  const role = CU?.role||'';
  const mods = MODULE_REGISTRY.filter(m =>
    m.key && !m.noNav &&
    (!m.roles || m.roles.split(',').map(r=>r.trim()).includes(role))
  );
  openModal('Customize Dashboard Pins', `
  <div style="max-height:400px;overflow-y:auto;">
    <div style="font-size:12.5px;color:var(--text-2);margin-bottom:14px;">Select pages to pin as quick-access tiles on your dashboard.</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;" id="pin-grid">
      ${mods.map(m=>`<label style="display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:13px;user-select:none;">
        <input type="checkbox" value="${m.key}" ${pins.includes(m.key)?'checked':''} style="margin:0;flex-shrink:0;">
        <span style="font-size:14px;">${m.icon}</span><span>${m.label}</span>
      </label>`).join('')}
    </div>
  </div>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
   <button class="btn btn-accent" onclick="applyDashPins()">Save Pins</button>`);
}
function applyDashPins(){
  const keys = Array.from(document.querySelectorAll('#pin-grid input[type=checkbox]:checked')).map(i=>i.value);
  saveDashPins(keys);
  closeModal();
  dashboard($('pg-content'));
}
function renderPinnedCard(){
  const pins = loadDashPins();
  if(!pins.length) return '';
  const mods = pins.map(k=>MODULE_REGISTRY.find(m=>m.key===k)).filter(Boolean);
  if(!mods.length) return '';
  return `<div class="card mb16">
    <div class="card-hd"><span class="card-title">📌 Pinned</span><button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 8px;" onclick="openPinModal()">Edit</button></div>
    <div class="card-body" style="display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;">
      ${mods.map(m=>`<button class="btn btn-outline" onclick="goTo('${m.key}')" style="font-size:13px;gap:6px;"><span>${m.icon}</span>${esc(m.label)}</button>`).join('')}
    </div>
  </div>`;
}
