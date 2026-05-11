// ── GLOBAL SEARCH ──
// Pure-compute meta-feature. Indexes already-loaded data across every module
// (vendors, customers, deals, quotes, inventory, jobs, POs, trade partners,
// warranty claims, calendar events, articles, co-op funds, showroom displays,
// deliveries, alerts, marketing campaigns/assets). No new schema, no API.
// Keyboard: Ctrl/Cmd+K opens. ↑/↓ select. Enter opens. Esc closes.
register({ name: 'global_search', provides: ['global_search','openGlobalSearch','renderGlobalSearch','globalSearchKey'], consumes: ['VD','CUSTOMERS','DEALS','QUOTES','INVENTORY','JOBS','POS','PO_LINES','TRADE_PARTNERS','WARRANTY_CLAIMS','CAL_EVENTS','ARTICLES','COOP_FUNDS','SHOWROOM_DISPLAYS','DELIVERIES','ALERTS','MARKETING_CAMPAIGNS','$','esc','CU'] });

const SEARCH_LIMIT_PER_GROUP = 6;
let _gsResults = [];
let _gsSelected = 0;

function openGlobalSearch(){
  openModal('Search AccentOS', `
    <div style="position:relative;">
      <input id="gs-input" autocomplete="off" placeholder="Search vendors, customers, deals, quotes, SKUs, jobs, POs…" style="width:100%;padding:12px 14px;font-size:15px;border:2px solid var(--border);border-radius:8px;background:var(--bg-2);" oninput="renderGlobalSearch(this.value)" onkeydown="globalSearchKey(event)">
      <div style="position:absolute;right:14px;top:13px;font-size:11px;color:var(--text-3);pointer-events:none;">↑↓ Enter · Esc</div>
    </div>
    <div id="gs-results" style="margin-top:14px;max-height:60vh;overflow-y:auto;"></div>
  `);
  setTimeout(() => {
    const inp = $('gs-input');
    if(inp) inp.focus();
    renderGlobalSearch('');
  }, 30);
}

function globalSearchKey(e){
  if(e.key === 'Escape'){ closeModal(); return; }
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    _gsSelected = Math.min(_gsSelected + 1, _gsResults.length - 1);
    repaintGsHighlight();
    return;
  }
  if(e.key === 'ArrowUp'){
    e.preventDefault();
    _gsSelected = Math.max(0, _gsSelected - 1);
    repaintGsHighlight();
    return;
  }
  if(e.key === 'Enter'){
    e.preventDefault();
    const r = _gsResults[_gsSelected];
    if(r) gsActivate(r);
  }
}

function repaintGsHighlight(){
  document.querySelectorAll('[data-gs-row]').forEach((el, i) => {
    el.style.background = (i === _gsSelected) ? 'var(--bg-3,var(--bg-2))' : 'transparent';
    if(i === _gsSelected) el.scrollIntoView({block:'nearest'});
  });
}

function gsActivate(r){
  closeModal();
  if(r.action) r.action();
}

function renderGlobalSearch(q){
  const host = $('gs-results');
  if(!host) return;
  const ql = (q||'').toLowerCase().trim();

  if(!ql){
    host.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">
      Start typing to search across <strong>vendors</strong>, <strong>customers</strong>, <strong>deals</strong>, <strong>quotes</strong>, <strong>inventory</strong>, <strong>jobs</strong>, <strong>POs</strong>, <strong>trade partners</strong>, <strong>warranty</strong>, <strong>calendar</strong>, <strong>articles</strong>, <strong>co-op funds</strong>, <strong>showrooms</strong>, <strong>deliveries</strong>, <strong>alerts</strong>, and <strong>marketing campaigns</strong>.
    </div>`;
    _gsResults = []; _gsSelected = 0;
    return;
  }

  const groups = computeGlobalSearch(ql);
  _gsResults = [];
  groups.forEach(g => g.items.forEach(it => _gsResults.push(it)));
  _gsSelected = 0;

  if(_gsResults.length === 0){
    host.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">No matches for "<strong>${esc(q)}</strong>".</div>`;
    return;
  }

  host.innerHTML = groups.filter(g => g.items.length).map(g => `
    <div style="margin-bottom:12px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);padding:6px 10px;border-bottom:1px solid var(--border-light);">${esc(g.label)} · ${g.total}${g.total>g.items.length?' (showing top '+g.items.length+')':''}</div>
      ${g.items.map(it => `
        <div data-gs-row data-gs-idx="${_gsResults.indexOf(it)}" onclick="_gsSelected=${_gsResults.indexOf(it)};gsActivate(_gsResults[${_gsResults.indexOf(it)}])" onmouseenter="_gsSelected=${_gsResults.indexOf(it)};repaintGsHighlight()" style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;cursor:pointer;border-radius:5px;">
          <span style="font-size:14px;flex-shrink:0;width:20px;text-align:center;">${it.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(it.title)}</div>
            ${it.subtitle ? `<div style="font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(it.subtitle)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
  repaintGsHighlight();
}

function _gsMatch(text, q){
  if(!text) return -1;
  const t = String(text).toLowerCase();
  if(t === q) return 100;
  if(t.startsWith(q)) return 80;
  const idx = t.indexOf(q);
  return idx >= 0 ? Math.max(20, 60 - idx) : -1;
}

function _gsScoreObj(q, fields){
  let best = -1;
  for(const f of fields){
    const s = _gsMatch(f, q);
    if(s > best) best = s;
  }
  return best;
}

function computeGlobalSearch(q){
  const groups = [];

  // VENDORS
  if(typeof VD !== 'undefined'){
    const matches = [];
    VD.forEach(v => {
      const score = _gsScoreObj(q, [v.n, v.web, v.pc, v.desc, v.rep || v.rg]);
      if(score > 0){
        matches.push({
          score, icon:'◇', title: v.n,
          subtitle: `Vendor · ${v.rep||v.rg||'No rep'}${v.pc?' · '+v.pc:''}${v.sales?.t?' · $'+Math.round(v.sales.t).toLocaleString():''}`,
          action: () => { goTo('vendors'); setTimeout(()=>{ if(typeof openVendorDetail==='function') openVendorDetail(v.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Vendors', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // CUSTOMERS
  if(typeof CUSTOMERS !== 'undefined'){
    const matches = [];
    CUSTOMERS.forEach(c => {
      const score = _gsScoreObj(q, [c.name, c.company, c.email, c.phone, c.city, c.state]);
      if(score > 0){
        matches.push({
          score, icon:'☻', title: c.name || c.company || c.email,
          subtitle: `Customer${c.company && c.name?' · '+c.company:''}${c.email?' · '+c.email:''}${c.city?' · '+c.city:''}`,
          action: () => { goTo('customers'); setTimeout(()=>{ if(typeof openCustomerDetail==='function') openCustomerDetail(c.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Customers', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // DEALS (across all stages incl. lost/abandoned archive)
  if(typeof DEALS !== 'undefined'){
    const matches = [];
    Object.keys(DEALS).forEach(stageKey => {
      (DEALS[stageKey] || []).forEach(d => {
        const score = _gsScoreObj(q, [d.title, d.company, d.contact, d.notes, d.lead_source]);
        if(score > 0){
          matches.push({
            score, icon:'◈', title: d.title || d.company || 'Deal',
            subtitle: `Deal · ${stageKey}${d.value?' · $'+Number(d.value).toLocaleString():''}${d.company?' · '+d.company:''}`,
            action: () => { goTo('pipeline'); setTimeout(()=>{ if(typeof openDeal==='function') openDeal(d.id, stageKey); }, 80); }
          });
        }
      });
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Sales Pipeline', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // QUOTES
  if(typeof QUOTES !== 'undefined'){
    const matches = [];
    QUOTES.forEach(qt => {
      const score = _gsScoreObj(q, [qt.id, qt.customer, qt.project, qt.contact]);
      if(score > 0){
        matches.push({
          score, icon:'◻', title: `${qt.id} — ${qt.project || qt.customer || 'Quote'}`,
          subtitle: `Quote · ${qt.customer||'—'}${qt.total?' · $'+Math.round(qt.total).toLocaleString():''}${qt.date?' · '+qt.date:''}`,
          action: () => { goTo('quotes'); setTimeout(()=>{ if(typeof showSaved==='function') showSaved(); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Quotes', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // INVENTORY
  if(typeof INVENTORY !== 'undefined'){
    const matches = [];
    INVENTORY.forEach(it => {
      const score = _gsScoreObj(q, [it.sku, it.upc, it.description, it.vendor_name, it.bin, it.category]);
      if(score > 0){
        matches.push({
          score, icon:'⌧', title: `${it.sku} — ${it.description||''}`.slice(0, 80),
          subtitle: `Inventory · ${it.vendor_name||'—'} · ${it.qty_on_hand||0} on hand${it.list_price?' · $'+Number(it.list_price).toFixed(2):''}`,
          action: () => { goTo('vendors'); setTimeout(()=>{ if(typeof window.vSection !== 'undefined'){ window.vSection='inventory'; if(typeof renderVendors==='function') renderVendors($('pg-content')); } }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Inventory', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // JOBS
  if(typeof JOBS !== 'undefined'){
    const matches = [];
    JOBS.forEach(j => {
      const score = _gsScoreObj(q, [j.job_number, j.project_name, j.customer_name, j.notes]);
      if(score > 0){
        matches.push({
          score, icon:'▤', title: `${j.job_number||''} — ${j.project_name||''}`.trim(),
          subtitle: `Job · ${j.customer_name||'—'} · ${j.status||'—'}${j.due_date?' · due '+j.due_date:''}`,
          action: () => { goTo('jobs'); setTimeout(()=>{ if(typeof openJobEdit==='function') openJobEdit(j.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Jobs', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // PURCHASE ORDERS
  if(typeof POS !== 'undefined'){
    const matches = [];
    POS.forEach(p => {
      const lines = (typeof PO_LINES !== 'undefined') ? (PO_LINES[p.id]||[]) : [];
      const lineHay = lines.map(l => `${l.sku||''} ${l.description||''}`).join(' ');
      const score = _gsScoreObj(q, [p.po_number, p.vendor_name, p.notes, lineHay]);
      if(score > 0){
        matches.push({
          score, icon:'⌧', title: `${p.po_number||''} — ${p.vendor_name||''}`,
          subtitle: `PO · ${p.status||'—'}${p.total?' · $'+Math.round(p.total).toLocaleString():''}${p.expected_date?' · exp '+p.expected_date:''}`,
          action: () => { goTo('purchaseorders'); setTimeout(()=>{ if(typeof openPOEdit==='function') openPOEdit(p.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Purchase Orders', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // TRADE PARTNERS
  if(typeof TRADE_PARTNERS !== 'undefined'){
    const matches = [];
    TRADE_PARTNERS.forEach(t => {
      const score = _gsScoreObj(q, [t.name, t.company, t.email, t.phone, t.partner_type]);
      if(score > 0){
        matches.push({
          score, icon:'◆', title: t.name || t.company,
          subtitle: `Trade Partner · ${t.partner_type||'—'} · ${t.status||'—'}${t.company && t.name?' · '+t.company:''}`,
          action: () => { goTo('tradepartners'); setTimeout(()=>{ if(typeof openTradePartnerEdit==='function') openTradePartnerEdit(t.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Trade Partners', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // WARRANTY CLAIMS
  if(typeof WARRANTY_CLAIMS !== 'undefined'){
    const matches = [];
    WARRANTY_CLAIMS.forEach(w => {
      const score = _gsScoreObj(q, [w.claim_number, w.vendor_name, w.customer_name, w.product_description, w.issue_description]);
      if(score > 0){
        matches.push({
          score, icon:'⚠', title: `${w.claim_number||''} — ${w.product_description||w.vendor_name||''}`.slice(0, 80),
          subtitle: `Warranty · ${w.status||'—'} · ${w.severity||'—'}${w.customer_name?' · '+w.customer_name:''}`,
          action: () => { goTo('warranty'); setTimeout(()=>{ if(typeof openWarrantyEdit==='function') openWarrantyEdit(w.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Warranty', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // CALENDAR EVENTS
  if(typeof CAL_EVENTS !== 'undefined'){
    const matches = [];
    CAL_EVENTS.forEach(ev => {
      const score = _gsScoreObj(q, [ev.title, ev.description, ev.location, ev.category]);
      if(score > 0){
        matches.push({
          score, icon:'▦', title: ev.title,
          subtitle: `Calendar · ${ev.category||'event'}${ev.starts_at?' · '+new Date(ev.starts_at).toLocaleDateString():''}${ev.location?' · '+ev.location:''}`,
          action: () => { goTo('calendar'); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Calendar', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // ARTICLES (Knowledge Hub)
  if(typeof ARTICLES !== 'undefined'){
    const matches = [];
    ARTICLES.forEach(a => {
      const score = _gsScoreObj(q, [a.title, a.body, a.category, (a.tags||[]).join(' ')]);
      if(score > 0){
        matches.push({
          score, icon:'⚡', title: a.title,
          subtitle: `Article · ${a.category||'—'}${a.pinned?' · 📌':''}${a.tags && a.tags.length?' · '+a.tags.slice(0,3).join(', '):''}`,
          action: () => { goTo('knowledge'); setTimeout(()=>{ if(typeof openArticleEdit==='function') openArticleEdit(a.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Knowledge Hub', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // CO-OP FUNDS
  if(typeof COOP_FUNDS !== 'undefined'){
    const matches = [];
    COOP_FUNDS.forEach(f => {
      const vendor = (typeof VD !== 'undefined') ? VD.find(v => v.id === f.vendor_id) : null;
      const vName = vendor?.n || '';
      const score = _gsScoreObj(q, [vName, f.fund_type, f.notes, f.earned_period]);
      if(score > 0){
        matches.push({
          score, icon:'%', title: `${vName} — ${f.fund_type||'fund'}`,
          subtitle: `Co-op · ${f.status||'—'}${f.amount?' · $'+Number(f.amount).toLocaleString():''}${f.deadline?' · by '+f.deadline:''}`,
          action: () => { goTo('vendors'); setTimeout(()=>{ if(typeof window.vSection !== 'undefined'){ window.vSection='coop'; if(typeof renderVendors==='function') renderVendors($('pg-content')); } }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Co-op Funds', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // SHOWROOM DISPLAYS
  if(typeof SHOWROOM_DISPLAYS !== 'undefined'){
    const matches = [];
    SHOWROOM_DISPLAYS.forEach(d => {
      const score = _gsScoreObj(q, [d.display_name, d.vendor_name, d.location, d.contract_terms, d.notes]);
      if(score > 0){
        matches.push({
          score, icon:'▣', title: d.display_name || d.vendor_name,
          subtitle: `Showroom · ${d.status||'—'}${d.location?' · '+d.location:''}${d.expires_date?' · expires '+d.expires_date:''}`,
          action: () => { goTo('showrooms'); setTimeout(()=>{ if(typeof openShowroomEdit==='function') openShowroomEdit(d.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Showroom Displays', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // DELIVERIES
  if(typeof DELIVERIES !== 'undefined'){
    const matches = [];
    DELIVERIES.forEach(d => {
      const score = _gsScoreObj(q, [d.delivery_number, d.customer_name, d.address, d.driver, d.items_summary]);
      if(score > 0){
        matches.push({
          score, icon:'▶', title: `${d.delivery_number||''} — ${d.customer_name||''}`,
          subtitle: `Delivery · ${d.status||'—'}${d.scheduled_date?' · '+d.scheduled_date:''}${d.driver?' · '+d.driver:''}`,
          action: () => { goTo('deliveries'); setTimeout(()=>{ if(typeof openDeliveryEdit==='function') openDeliveryEdit(d.id); }, 80); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Deliveries', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // ALERTS
  if(typeof ALERTS !== 'undefined'){
    const matches = [];
    ALERTS.forEach(a => {
      const score = _gsScoreObj(q, [a.title, a.body, a.type]);
      if(score > 0){
        matches.push({
          score, icon:'!', title: a.title,
          subtitle: `Alert · ${a.severity||'—'} · ${a.status||'—'}${a.body?' · '+String(a.body).slice(0, 60):''}`,
          action: () => { goTo('alerts'); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Alerts', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  // MARKETING CAMPAIGNS
  if(typeof MARKETING_CAMPAIGNS !== 'undefined'){
    const matches = [];
    MARKETING_CAMPAIGNS.forEach(c => {
      const score = _gsScoreObj(q, [c.name, c.type, c.notes, c.promo_skus]);
      if(score > 0){
        matches.push({
          score, icon:'◉', title: c.name,
          subtitle: `Campaign · ${c.type||'—'} · ${c.status||'—'}${c.start_date?' · '+c.start_date:''}`,
          action: () => { goTo('marketing'); }
        });
      }
    });
    matches.sort((a,b)=>b.score-a.score);
    groups.push({label:'Marketing Campaigns', total:matches.length, items:matches.slice(0, SEARCH_LIMIT_PER_GROUP)});
  }

  return groups;
}

// Wire Ctrl/Cmd+K to open search globally
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
    e.preventDefault();
    openGlobalSearch();
  }
});
