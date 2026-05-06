// ── PORTAL PREVIEW ──
// Staff-side preview of what external Trade Partners and Vendor Reps see.
// The live portals shipped v6.11.2 (js/trade_portal.js + js/vendor_portal.js).
// This page lets Owner/Admin impersonate any partner or rep to QA the live
// data scope without logging out. No new schema, no API.

let portalPreview = {mode:'trade', selectedId:''};

function portalpreview(c, actions){
  if(!c) return;
  if(actions){
    actions.innerHTML = `<button class="btn btn-outline btn-sm" onclick="_ppCopySummary()" title="Copy a plain-text summary of this preview">Copy summary</button>`;
  }

  c.innerHTML = `
    <div class="alert" style="background:linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%);border-left:3px solid var(--green);margin-bottom:14px;font-size:12px;display:flex;align-items:center;gap:12px;">
      <div style="flex:1;"><strong>✓ Live as of v6.11.2.</strong> TradePartner and VendorRep users see their own portal on login. Use this page to impersonate any partner or rep and QA the data scope without logging out.</div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button onclick="_ppOpenLivePortal()" style="padding:4px 10px;font-size:11px;border:1px solid var(--green);border-radius:4px;background:none;cursor:pointer;color:var(--green);font-weight:600;">Open live portal ↗</button>
      </div>
    </div>
    <div class="card mb16">
      <div style="padding:14px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
        <label style="font-size:13px;display:flex;align-items:center;gap:8px;">
          <strong>Preview as:</strong>
          <select onchange="portalPreview.mode=this.value;portalPreview.selectedId='';portalpreview($('pg-content'),$('pg-actions'))" style="padding:6px 10px;font-size:13px;">
            <option value="trade" ${portalPreview.mode==='trade'?'selected':''}>Trade Partner / Designer</option>
            <option value="rep" ${portalPreview.mode==='rep'?'selected':''}>Vendor Rep</option>
          </select>
        </label>
        ${portalPreview.mode === 'trade' ? _ppTradePicker() : _ppRepPicker()}
      </div>
    </div>
    <div id="pp-body"></div>
  `;
  _ppRender();
}

function _ppTradePicker(){
  const partners = (typeof TRADE_PARTNERS !== 'undefined' ? TRADE_PARTNERS : []).filter(t => t.status !== 'inactive');
  return `
    <label style="font-size:13px;display:flex;align-items:center;gap:8px;">
      <strong>Trade Partner:</strong>
      <select onchange="portalPreview.selectedId=this.value;_ppRender()" style="padding:6px 10px;font-size:13px;min-width:220px;">
        <option value="">— pick a partner —</option>
        ${partners.map(p => `<option value="${esc(p.id)}" ${portalPreview.selectedId===p.id?'selected':''}>${esc(p.name||p.company)}${p.partner_type?' ('+p.partner_type+')':''}</option>`).join('')}
      </select>
    </label>
    ${partners.length === 0 ? '<span class="muted sm">No active trade partners. Add one via Trade Partners page.</span>' : ''}
  `;
}

function _ppRepPicker(){
  const reps = [...new Set((typeof VD !== 'undefined' ? VD : []).map(v => v.rep || v.rg).filter(Boolean))].sort();
  return `
    <label style="font-size:13px;display:flex;align-items:center;gap:8px;">
      <strong>Rep / Rep Group:</strong>
      <select onchange="portalPreview.selectedId=this.value;_ppRender()" style="padding:6px 10px;font-size:13px;min-width:220px;">
        <option value="">— pick a rep —</option>
        ${reps.map(r => `<option value="${esc(r)}" ${portalPreview.selectedId===r?'selected':''}>${esc(r)}</option>`).join('')}
      </select>
    </label>
    ${reps.length === 0 ? '<span class="muted sm">No reps assigned. Use Bulk Vendor Ops to assign.</span>' : ''}
  `;
}

function _ppRender(){
  const body = $('pp-body');
  if(!body) return;
  if(!portalPreview.selectedId){
    body.innerHTML = `<div class="card" style="padding:36px;text-align:center;color:var(--text-3);font-size:13px;">Pick ${portalPreview.mode==='trade'?'a trade partner':'a rep'} above to see the preview.</div>`;
    return;
  }
  if(portalPreview.mode === 'trade'){ _ppRenderTrade(body); }
  else { _ppRenderRep(body); }
}

function _ppRenderTrade(body){
  const p = (typeof TRADE_PARTNERS !== 'undefined' ? TRADE_PARTNERS : []).find(x => x.id === portalPreview.selectedId);
  if(!p){ body.innerHTML = '<div class="card" style="padding:24px;color:var(--text-3);">Partner not found.</div>'; return; }

  // Linked customer (if set) → all their quotes / deals / jobs / deliveries
  const linkedCust = p.linked_customer_id
    ? (typeof CUSTOMERS !== 'undefined' ? CUSTOMERS.find(c => c.id === p.linked_customer_id) : null)
    : null;
  const custName = linkedCust?.name || p.company || p.name;

  const matchByName = list => (list||[]).filter(x => {
    const target = (x.customer || x.customer_name || x.company || '').toLowerCase().trim();
    return target && custName && target === custName.toLowerCase().trim();
  });
  const myQuotes = matchByName(typeof QUOTES !== 'undefined' ? QUOTES : []);
  const myDeals = [];
  if(typeof DEALS !== 'undefined') Object.keys(DEALS).forEach(s => matchByName(DEALS[s]).forEach(d => myDeals.push({...d, _stage:s})));
  const myJobs = matchByName(typeof JOBS !== 'undefined' ? JOBS : []);
  const myDeliveries = matchByName(typeof DELIVERIES !== 'undefined' ? DELIVERIES : []);

  const inv = (typeof INVENTORY !== 'undefined' ? INVENTORY : []).filter(r => (Number(r.qty_available)||0) > 0);

  body.innerHTML = `
    <div style="background:linear-gradient(135deg, #fff 0%, #fafafa 100%);border:2px dashed var(--border);border-radius:14px;padding:24px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;">Welcome,</div>
          <div style="font-size:24px;font-weight:700;">${esc(p.name||p.company)}</div>
          <div style="font-size:13px;color:var(--text-3);">${esc(p.partner_type||'Trade Partner')}${p.company && p.name?' · '+esc(p.company):''}</div>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--text-3);">
          ${p.preferred_terms?'<div><strong>Terms:</strong> '+esc(p.preferred_terms)+'</div>':''}
          ${p.rating?'<div><strong>Rating:</strong> '+p.rating+'/5</div>':''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-bottom:18px;">
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Active Projects</div>
          <div style="font-size:22px;font-weight:700;">${myJobs.filter(j => !['complete','cancelled'].includes(j.status)).length}</div>
        </div>
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">My Quotes</div>
          <div style="font-size:22px;font-weight:700;">${myQuotes.length}</div>
        </div>
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Pipeline Value</div>
          <div style="font-size:22px;font-weight:700;">$${Math.round(myDeals.reduce((s,d)=>s+(Number(d.value)||0),0)/1000)}K</div>
        </div>
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Upcoming Deliveries</div>
          <div style="font-size:22px;font-weight:700;">${myDeliveries.filter(d => !['delivered','cancelled'].includes(d.status)).length}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <h4 style="margin-bottom:8px;font-size:13px;">My Quotes (${myQuotes.length})</h4>
          ${myQuotes.length === 0 ? '<div style="font-size:12px;color:var(--text-3);padding:10px;border:1px solid var(--border);border-radius:6px;">No quotes yet. Reach out to sales to start a project.</div>' : `<div style="border:1px solid var(--border);border-radius:6px;max-height:200px;overflow-y:auto;">
            ${myQuotes.slice(0,10).map(q => `<div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:flex;justify-content:space-between;">
              <span><strong>${esc(q.id)}</strong> · ${esc(q.project||q.customer||'—')}</span>
              <span class="mono">$${Math.round(q.total||0).toLocaleString()}</span>
            </div>`).join('')}
          </div>`}
        </div>
        <div>
          <h4 style="margin-bottom:8px;font-size:13px;">My Projects (${myJobs.length})</h4>
          ${myJobs.length === 0 ? '<div style="font-size:12px;color:var(--text-3);padding:10px;border:1px solid var(--border);border-radius:6px;">No active projects yet.</div>' : `<div style="border:1px solid var(--border);border-radius:6px;max-height:200px;overflow-y:auto;">
            ${myJobs.slice(0,10).map(j => `<div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:flex;justify-content:space-between;align-items:center;">
              <span><strong>${esc(j.job_number||'')}</strong> · ${esc(j.project_name||'')}</span>
              <span class="badge bg-${j.status==='complete'?'green':j.status==='active'?'blue':'gray'}" style="font-size:10px;">${j.status}</span>
            </div>`).join('')}
          </div>`}
        </div>
      </div>

      <h4 style="margin:18px 0 8px;font-size:13px;">Available Inventory (${inv.length} SKUs in stock)</h4>
      <div style="border:1px solid var(--border);border-radius:6px;max-height:200px;overflow-y:auto;">
        ${inv.length === 0 ? '<div style="padding:10px;font-size:12px;color:var(--text-3);">No inventory loaded.</div>' : inv.slice(0,15).map(it => `
          <div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:grid;grid-template-columns:120px 1fr 80px 90px;gap:8px;align-items:center;">
            <span class="mono">${esc(it.sku)}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(it.description||'')}</span>
            <span class="mono sm">${it.qty_available||0} avail</span>
            <span class="mono fw6">$${Number(it.list_price||0).toFixed(2)}</span>
          </div>`).join('')}
        ${inv.length > 15 ? `<div style="padding:8px 12px;font-size:11px;color:var(--text-3);">+ ${inv.length - 15} more SKUs available.</div>` : ''}
      </div>

      <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);font-size:11px;color:var(--text-3);">
        <strong>Live portal pages (v6.11.2):</strong> tradeportal · tpquotes · tpjobs · tpdeliveries · tpresources · tpcontact. TradePartner users land here on login.
      </div>
    </div>
  `;
}

function _ppRenderRep(body){
  const repName = portalPreview.selectedId;
  const myVendors = (typeof VD !== 'undefined' ? VD : []).filter(v => (v.rep||v.rg) === repName);
  const myCoop = (typeof COOP_FUNDS !== 'undefined' ? COOP_FUNDS : []).filter(f => myVendors.find(v => v.id === f.vendor_id));
  // Deals mentioning my vendors (loose match — vendor name in deal notes/title)
  const myDeals = [];
  if(typeof DEALS !== 'undefined'){
    Object.values(DEALS).flat().forEach(d => {
      const hay = `${d.title||''} ${d.notes||''}`.toLowerCase();
      myVendors.forEach(v => { if(v.n && hay.includes(v.n.toLowerCase())){ myDeals.push({...d, vendor:v.n}); } });
    });
  }
  const myDisplays = (typeof SHOWROOM_DISPLAYS !== 'undefined' ? SHOWROOM_DISPLAYS : []).filter(d => myVendors.find(v => v.id === d.vendor_id));
  const myWarranty = (typeof WARRANTY_CLAIMS !== 'undefined' ? WARRANTY_CLAIMS : []).filter(w => myVendors.find(v => v.id === w.vendor_id));

  const totalSales = myVendors.reduce((s,v) => s + (v.sales?.t || 0), 0);
  const tiers = {A:0, B:0, C:0};
  myVendors.forEach(v => { const t = (typeof computeVendorTier === 'function') ? computeVendorTier(v) : 'C'; if(tiers[t]!==undefined) tiers[t]++; });
  const avgScore = myVendors.length ? (myVendors.map(v => (typeof weightedScore==='function')?weightedScore(v):null).filter(x => x!==null).reduce((a,b)=>a+b,0) / Math.max(1, myVendors.length)) : 0;

  body.innerHTML = `
    <div style="background:linear-gradient(135deg, #fff 0%, #fafafa 100%);border:2px dashed var(--border);border-radius:14px;padding:24px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;">Rep Portal</div>
          <div style="font-size:24px;font-weight:700;">${esc(repName)}</div>
          <div style="font-size:13px;color:var(--text-3);">${myVendors.length} vendor${myVendors.length===1?'':'s'} in your group</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-bottom:18px;">
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Lifetime Sales</div>
          <div style="font-size:22px;font-weight:700;">$${Math.round(totalSales/1000).toLocaleString()}K</div>
        </div>
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Avg Score</div>
          <div style="font-size:22px;font-weight:700;">${avgScore.toFixed(1)}</div>
        </div>
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Tier Breakdown</div>
          <div style="font-size:14px;font-weight:600;">A:${tiers.A} · B:${tiers.B} · C:${tiers.C}</div>
        </div>
        <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;">Open Co-op $</div>
          <div style="font-size:22px;font-weight:700;">$${Math.round(myCoop.filter(c => c.status==='open').reduce((s,c)=>s+(Number(c.amount)||0),0)/1000)}K</div>
        </div>
      </div>

      <h4 style="margin-bottom:8px;font-size:13px;">Your Vendors (${myVendors.length})</h4>
      <div style="border:1px solid var(--border);border-radius:6px;max-height:240px;overflow-y:auto;">
        ${myVendors.length === 0 ? '<div style="padding:10px;font-size:12px;color:var(--text-3);">No vendors assigned.</div>' : myVendors.slice(0,20).map(v => {
          const tier = (typeof computeVendorTier === 'function') ? computeVendorTier(v) : '—';
          const score = (typeof weightedScore === 'function') ? weightedScore(v) : null;
          return `<div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:grid;grid-template-columns:1fr 60px 60px 100px;gap:8px;align-items:center;">
            <span style="font-weight:600;">${esc(v.n)}</span>
            <span class="badge" style="background:${tier==='A'?'var(--green)':tier==='B'?'var(--blue)':'var(--text-3)'};color:#fff;font-size:10px;text-align:center;">${tier}</span>
            <span class="mono sm">${score!=null?score:'—'}</span>
            <span class="mono sm">$${Math.round((v.sales?.t||0)/1000).toLocaleString()}K</span>
          </div>`;
        }).join('')}
        ${myVendors.length > 20 ? `<div style="padding:8px 12px;font-size:11px;color:var(--text-3);">+ ${myVendors.length - 20} more.</div>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;">
        <div>
          <h4 style="margin-bottom:8px;font-size:13px;">Open Co-op Funds (${myCoop.filter(c => c.status==='open').length})</h4>
          <div style="border:1px solid var(--border);border-radius:6px;max-height:160px;overflow-y:auto;">
            ${myCoop.filter(c => c.status==='open').length === 0 ? '<div style="padding:10px;font-size:12px;color:var(--text-3);">No open funds.</div>' : myCoop.filter(c => c.status==='open').slice(0,8).map(f => {
              const v = myVendors.find(x => x.id === f.vendor_id);
              return `<div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:flex;justify-content:space-between;">
                <span>${esc(v?.n||'—')} · ${esc(f.fund_type||'')}</span>
                <span class="mono fw6">$${Number(f.amount||0).toLocaleString()}${f.deadline?' · by '+f.deadline:''}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div>
          <h4 style="margin-bottom:8px;font-size:13px;">Showroom Displays (${myDisplays.length})</h4>
          <div style="border:1px solid var(--border);border-radius:6px;max-height:160px;overflow-y:auto;">
            ${myDisplays.length === 0 ? '<div style="padding:10px;font-size:12px;color:var(--text-3);">No displays.</div>' : myDisplays.slice(0,8).map(d => `<div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:flex;justify-content:space-between;">
              <span>${esc(d.display_name||d.vendor_name)}</span>
              <span class="badge bg-${d.status==='active'?'green':d.status==='expiring'?'amber':'gray'}" style="font-size:10px;">${d.status}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <h4 style="margin:14px 0 8px;font-size:13px;">Open Warranty Claims (${myWarranty.filter(w => !['closed','denied','replaced','refunded'].includes(w.status)).length})</h4>
      <div style="border:1px solid var(--border);border-radius:6px;max-height:140px;overflow-y:auto;">
        ${myWarranty.filter(w => !['closed','denied','replaced','refunded'].includes(w.status)).length === 0 ? '<div style="padding:10px;font-size:12px;color:var(--text-3);">No open claims.</div>' : myWarranty.filter(w => !['closed','denied','replaced','refunded'].includes(w.status)).slice(0,6).map(w => `<div style="padding:8px 12px;border-bottom:1px solid var(--border-light);font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <span><strong>${esc(w.claim_number||'')}</strong> · ${esc(w.product_description||'')}</span>
          <span class="badge bg-${w.severity==='safety'?'red':w.severity==='functional'?'amber':'gray'}" style="font-size:10px;">${w.severity}</span>
        </div>`).join('')}
      </div>

      <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);font-size:11px;color:var(--text-3);">
        <strong>Live portal pages (v6.11.2):</strong> vendorrep · vrscorecard · vrcoop · vrproducts · vrcontact. VendorRep users land here on login.
      </div>
    </div>
  `;
}

function _ppOpenLivePortal(){
  if(portalPreview.mode === 'trade') goTo('tradeportal');
  else goTo('vendorrep');
}

function _ppCopySummary(){
  if(!portalPreview.selectedId){ toast('Pick a partner or rep first','err'); return; }
  let summary = '';
  if(portalPreview.mode === 'trade'){
    const p = (typeof TRADE_PARTNERS !== 'undefined' ? TRADE_PARTNERS : []).find(x => x.id === portalPreview.selectedId);
    summary = `Portal preview: Trade Partner ${p?.name||p?.company||''} (${p?.partner_type||'—'})\nGenerated ${new Date().toLocaleString()}`;
  } else {
    const myVendors = (typeof VD !== 'undefined' ? VD : []).filter(v => (v.rep||v.rg) === portalPreview.selectedId);
    summary = `Portal preview: Rep ${portalPreview.selectedId} — ${myVendors.length} vendors, $${Math.round(myVendors.reduce((s,v)=>s+(v.sales?.t||0),0)/1000).toLocaleString()}K lifetime sales\nGenerated ${new Date().toLocaleString()}`;
  }
  navigator.clipboard.writeText(summary).then(() => toast('Summary copied','ok'));
}
