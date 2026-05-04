// ── QUICK ACTIONS ──
// Topbar "+" button opens a role-aware dropdown of quick-create actions
// across every module. Each entry either calls openX(null) directly
// (when the handler is global) or navigates first then calls.

const QA_ITEMS = [
  {label:'New Deal', icon:'◈', roles:['Owner','Admin','Manager','Sales'], page:'pipeline', fn:'openAddDeal'},
  {label:'New Quote', icon:'◻', roles:['Owner','Admin','Manager','Sales'], page:'quotes'},
  {label:'New Customer', icon:'☻', roles:['Owner','Admin','Manager','Sales'], page:'customers', fn:'openCustomerEdit', arg:null},
  {label:'New Job', icon:'▤', roles:['Owner','Admin','Manager','Sales','Warehouse'], page:'jobs', fn:'openJobEdit', arg:null},
  {label:'New PO', icon:'⌧', roles:['Owner','Admin','Manager'], page:'purchaseorders', fn:'openPOEdit', arg:null},
  {label:'New Trade Partner', icon:'◆', roles:['Owner','Admin','Manager','Sales'], page:'tradepartners', fn:'openTradePartnerEdit', arg:null},
  {label:'New Warranty Claim', icon:'⚠', roles:['Owner','Admin','Manager','Sales','Warehouse'], page:'warranty', fn:'openWarrantyEdit', arg:null},
  {label:'New Showroom Display', icon:'▣', roles:['Owner','Admin','Manager','Sales'], page:'showrooms', fn:'openShowroomEdit', arg:null},
  {label:'New Delivery', icon:'▶', roles:['Owner','Admin','Manager','Sales','Warehouse'], page:'deliveries', fn:'openDeliveryEdit', arg:null},
  {label:'New Article', icon:'⚡', roles:['Owner','Admin','Manager','Sales','Warehouse'], page:'knowledge', fn:'openArticleEdit', arg:null},
  {label:'New Calendar Event', icon:'▦', roles:['Owner','Admin','Manager','Sales','Warehouse'], page:'calendar'},
  {label:'New Co-op Fund', icon:'%', roles:['Owner','Admin','Manager','Sales'], page:'vendors', fn:'openCoopEdit', arg:null, subTab:'coop'},
  {label:'New Vendor', icon:'◇', roles:['Owner','Admin','Manager'], page:'vendors', fn:'openAddVendor'},
];

let _qaOpen = false;

function _qaInjectButton(){
  const host = document.querySelector('.topbar > div:last-child');
  if(!host || document.getElementById('qa-btn')) return;
  // Insert "+" button before the bell-host
  const bell = document.getElementById('bell-host');
  if(!bell) return;
  const btn = document.createElement('button');
  btn.id = 'qa-btn';
  btn.title = 'Quick Actions';
  btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;color:var(--text-2);font-size:18px;font-weight:300;cursor:pointer;line-height:1;';
  btn.textContent = '+';
  btn.onclick = (e) => { e.stopPropagation(); toggleQuickActions(); };
  host.insertBefore(btn, bell);

  // Dropdown container
  const dd = document.createElement('div');
  dd.id = 'qa-dropdown';
  dd.style.cssText = 'position:absolute;top:54px;right:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow-lg);min-width:240px;max-height:400px;overflow-y:auto;z-index:100;display:none;';
  document.body.appendChild(dd);

  // Outside-click closes
  document.addEventListener('click', (e) => {
    if(_qaOpen && !e.target.closest('#qa-btn') && !e.target.closest('#qa-dropdown')){
      _qaClose();
    }
  });
}

function toggleQuickActions(){
  if(_qaOpen) _qaClose();
  else _qaOpen2();
}

function _qaOpen2(){
  const dd = document.getElementById('qa-dropdown');
  if(!dd) return;
  const role = (typeof CU !== 'undefined' && CU?.role) ? CU.role : 'Owner';
  const items = QA_ITEMS.filter(it => it.roles.includes(role));
  if(!items.length){ dd.innerHTML = '<div style="padding:14px;color:var(--text-3);font-size:12px;">No quick actions available for your role.</div>'; }
  else {
    dd.innerHTML = items.map((it, i) => `
      <div data-qa-idx="${i}" onclick="qaActivate(${i})" style="display:flex;gap:10px;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-light);font-size:13px;" onmouseenter="this.style.background='var(--bg-2)'" onmouseleave="this.style.background='transparent'">
        <span style="font-size:14px;width:20px;text-align:center;">${it.icon}</span>
        <span>${esc(it.label)}</span>
      </div>
    `).join('');
  }
  // Position relative to button
  const btn = document.getElementById('qa-btn');
  if(btn){
    const r = btn.getBoundingClientRect();
    dd.style.top = (r.bottom + 4) + 'px';
    dd.style.right = (window.innerWidth - r.right) + 'px';
  }
  dd.style.display = 'block';
  _qaOpen = true;
  window._qaItemsCached = QA_ITEMS.filter(it => it.roles.includes(role));
}

function _qaClose(){
  const dd = document.getElementById('qa-dropdown');
  if(dd) dd.style.display = 'none';
  _qaOpen = false;
}

function qaActivate(idx){
  const items = window._qaItemsCached || [];
  const it = items[idx];
  if(!it){ _qaClose(); return; }
  _qaClose();
  // Navigate to the page first if not already there
  const navAndCall = () => {
    if(typeof curPage !== 'undefined' && curPage !== it.page){
      goTo(it.page);
      setTimeout(() => _qaInvoke(it), 100);
    } else {
      _qaInvoke(it);
    }
  };
  navAndCall();
}

function _qaInvoke(it){
  // Special: vendor sub-tab switch + call
  if(it.subTab && typeof window.vSection !== 'undefined'){
    window.vSection = it.subTab;
    if(typeof renderVendors === 'function') renderVendors($('pg-content'));
    setTimeout(() => {
      if(it.fn && typeof window[it.fn] === 'function') window[it.fn](it.arg);
    }, 80);
    return;
  }
  if(it.fn && typeof window[it.fn] === 'function'){
    window[it.fn](it.arg);
  }
  // For pages where the fn is missing (quotes / calendar), navigation alone is enough — landing on the page is the new-X experience.
}

// Inject after DOM ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', _qaInjectButton);
} else {
  _qaInjectButton();
}
// Also re-inject on auth-resume in case topbar was rebuilt
setTimeout(_qaInjectButton, 1500);
