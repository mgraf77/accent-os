// js/vendor_portal.js — v6.11.2
// External-facing Vendor Rep Portal (role: VendorRep).
// Vendor reps log in with a Supabase account; this portal shows their vendor's data.
// Match heuristic: find a vendor in VD where contact email or vendor name matches CU.email / CU.name.
// No new schema needed — reads from VENDOR_DATA, COOP_FUNDS, INVENTORY globals.

/* ── Vendor resolution ───────────────────────────────────────────────────── */

function _vrMyVendor(){
  if(!CU) return null;
  const email = (CU.email||'').toLowerCase();
  const name  = (CU.name ||'').toLowerCase();
  // VENDOR_DATA is the global from the inline script (Vendor Ranking module).
  const vd = typeof VENDOR_DATA !== 'undefined' ? VENDOR_DATA : (typeof VD !== 'undefined' ? Object.values(VD) : []);
  return vd.find(v =>
    (v.contact_email && v.contact_email.toLowerCase() === email) ||
    (v.contact_name  && v.contact_name.toLowerCase()  === name)  ||
    (v.vendor_name   && v.vendor_name.toLowerCase()   === name)
  ) || null;
}

function _vrMyCoopFunds(vendor){
  if(!vendor) return [];
  const vname = (vendor.vendor_name||'').toLowerCase();
  return (typeof COOP_FUNDS !== 'undefined' ? COOP_FUNDS : []).filter(f =>
    (f.vendor_id && vendor.id && f.vendor_id === vendor.id) ||
    (f.vendor_name && f.vendor_name.toLowerCase() === vname)
  );
}

function _vrMyInventory(vendor){
  if(!vendor) return [];
  const vname = (vendor.vendor_name||'').toLowerCase();
  return (typeof INVENTORY !== 'undefined' ? INVENTORY : []).filter(i =>
    (i.vendor_id && vendor.id && i.vendor_id === vendor.id) ||
    (i.vendor_name && i.vendor_name.toLowerCase() === vname)
  );
}

function _vrScores(vendor){
  if(!vendor || !vendor.scores) return [];
  return Object.entries(vendor.scores).map(([cat, val]) => ({cat, val}));
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */

function vrInitSidebar(){
  const sb = document.getElementById('sb');
  if(!sb) return;
  const vendor = _vrMyVendor();
  const vname  = vendor ? vendor.vendor_name : (CU?.name || 'Vendor Portal');
  sb.querySelector('.sb-nav').innerHTML = `
    <div class="ni active" data-roles="VendorRep" onclick="goTo('vendorrep')"><span class="ni-icon">⊞</span><span class="ni-label">Dashboard</span></div>
    <div class="ni" data-roles="VendorRep" onclick="goTo('vrscorecard')"><span class="ni-icon">◈</span><span class="ni-label">My Scorecard</span></div>
    <div class="ni" data-roles="VendorRep" onclick="goTo('vrcoop')"><span class="ni-icon">$</span><span class="ni-label">Co-op Funds</span></div>
    <div class="ni" data-roles="VendorRep" onclick="goTo('vrproducts')"><span class="ni-icon">▤</span><span class="ni-label">My Products</span></div>
    <div class="ni" data-roles="VendorRep" onclick="goTo('vrcontact')"><span class="ni-icon">✉</span><span class="ni-label">Contact</span></div>
  `;
}

/* ── Pages ───────────────────────────────────────────────────────────────── */

function vendorrep(el){
  const vendor = _vrMyVendor();
  const funds  = _vrMyCoopFunds(vendor);
  const inv    = _vrMyInventory(vendor);
  const scores = _vrScores(vendor);

  const avgScore = scores.length ? (scores.reduce((s,x)=>s+Number(x.val||0),0)/scores.length).toFixed(1) : '—';
  const tier     = vendor?.tier_override || _vrComputeTier(avgScore);
  const openFunds = funds.filter(f => f.status === 'open');
  const totalOpen = openFunds.reduce((s,f)=>s+Number(f.amount||0),0);

  el.innerHTML = `
<div style="max-width:900px;padding:0 0 40px;">

  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#0f2035 100%);color:#fff;border-radius:10px;padding:28px 32px;margin-bottom:24px;">
    <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${esc(vendor?.vendor_name || CU?.name || 'Vendor Portal')}</div>
    <div style="opacity:.85;font-size:14px;">Vendor Rep Portal · Accent Lighting</div>
  </div>

  ${!vendor ? `<div style="background:var(--bg-2);border:1px dashed var(--border);border-radius:8px;padding:16px 20px;margin-bottom:20px;font-size:13px;color:var(--text-2);">
    <strong>Vendor not linked.</strong> Contact Accent Lighting to connect your account to your vendor profile.
  </div>` : ''}

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;">
    ${_vrStatCard('Avg Score', avgScore, 'out of 10', '')}
    ${_vrStatCard('Tier', tier || '—', 'computed from scores', '')}
    ${_vrStatCard('Open Co-op', '$'+totalOpen.toLocaleString(), `${openFunds.length} fund${openFunds.length!==1?'s':''}`, 'goTo(\'vrcoop\')')}
    ${_vrStatCard('SKUs Listed', inv.length, 'in Accent inventory', 'goTo(\'vrproducts\')')}
  </div>

  <!-- Score radar preview -->
  ${scores.length ? `
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:20px 24px;margin-bottom:16px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:14px;">Score Summary</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
      ${scores.map(s => {
        const pct = Math.min(100, Math.round((Number(s.val)||0)/10*100));
        const color = Number(s.val)>=7.5?'#22c55e':Number(s.val)>=5?'#f59e0b':'#ef4444';
        return `<div style="background:var(--bg-2);border-radius:6px;padding:12px;">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;">${esc(s.cat.replace(/_/g,' '))}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
            </div>
            <span style="font-size:13px;font-weight:700;color:${color};">${s.val}</span>
          </div>
        </div>`;}).join('')}
    </div>
  </div>` : ''}

  <!-- Action strip -->
  <div style="display:flex;gap:10px;">
    <button onclick="goTo('vrscorecard')" style="flex:1;padding:12px;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:13px;">View Full Scorecard</button>
    <button onclick="goTo('vrcontact')"  style="flex:1;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">Contact Your Rep</button>
  </div>
</div>`;
}

function vrscorecard(el){
  const vendor = _vrMyVendor();
  const scores = _vrScores(vendor);

  if(!vendor || !scores.length){
    el.innerHTML = _vrEmptyState('No scorecard data', 'Your scorecard will appear here once scores are entered by Accent Lighting.');
    return;
  }

  el.innerHTML = `
<div style="max-width:700px;">
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px;">
      ${esc(vendor.vendor_name)} — Scorecard
      <span style="font-size:11px;color:var(--text-3);margin-left:8px;">Read-only view</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:var(--bg-2);">
        <th style="padding:10px 16px;text-align:left;border-bottom:1px solid var(--border);">Category</th>
        <th style="padding:10px 16px;text-align:left;border-bottom:1px solid var(--border);">Score</th>
        <th style="padding:10px 16px;text-align:left;border-bottom:1px solid var(--border);">Rating</th>
      </tr></thead>
      <tbody>
        ${scores.map(s => {
          const n = Number(s.val)||0;
          const color = n>=7.5?'#22c55e':n>=5?'#f59e0b':'#ef4444';
          const label = n>=8?'Excellent':n>=7?'Good':n>=5?'Average':n>=3?'Below Average':'Poor';
          return `<tr style="border-bottom:1px solid var(--border);">
            <td style="padding:10px 16px;font-weight:500;">${esc(s.cat.replace(/_/g,' '))}</td>
            <td style="padding:10px 16px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:80px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                  <div style="width:${Math.min(100,n/10*100)}%;height:100%;background:${color};border-radius:3px;"></div>
                </div>
                <span style="font-weight:700;color:${color};">${s.val} / 10</span>
              </div>
            </td>
            <td style="padding:10px 16px;font-size:12px;color:${color};">${label}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  <div style="margin-top:12px;font-size:12px;color:var(--text-3);">
    Scores are set by Accent Lighting based on product quality, pricing, freight, returns, support, and fill rate. Contact your rep to discuss improvement opportunities.
  </div>
</div>`;
}

function vrcoop(el){
  const vendor = _vrMyVendor();
  const funds  = _vrMyCoopFunds(vendor);

  if(!funds.length){
    el.innerHTML = _vrEmptyState('No co-op funds', 'Co-op funds and rebates linked to your vendor account will appear here.');
    return;
  }

  const STATUS_COLOR = {open:'#22c55e',pending:'#f59e0b',claimed:'#6366f1',expired:'var(--text-3)'};
  const total    = funds.reduce((s,f)=>s+Number(f.amount||0),0);
  const claimed  = funds.filter(f=>f.status==='claimed').reduce((s,f)=>s+Number(f.amount||0),0);

  el.innerHTML = `
<div style="max-width:800px;">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
    ${_vrStatCard('Total Tracked', '$'+total.toLocaleString(), funds.length+' fund'+(funds.length!==1?'s':''), '')}
    ${_vrStatCard('Open', '$'+funds.filter(f=>f.status==='open').reduce((s,f)=>s+Number(f.amount||0),0).toLocaleString(), 'available to claim', '')}
    ${_vrStatCard('Claimed YTD', '$'+claimed.toLocaleString(), 'received', '')}
  </div>
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:var(--bg-2);">
        <th style="padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);">Type</th>
        <th style="padding:10px 14px;text-align:right;border-bottom:1px solid var(--border);">Amount</th>
        <th style="padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);">Period</th>
        <th style="padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);">Deadline</th>
        <th style="padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);">Status</th>
      </tr></thead>
      <tbody>
        ${funds.map(f => `<tr style="border-bottom:1px solid var(--border);">
          <td style="padding:9px 14px;">${esc(f.fund_type||'—')}</td>
          <td style="padding:9px 14px;text-align:right;font-weight:600;">$${Number(f.amount||0).toLocaleString()}</td>
          <td style="padding:9px 14px;color:var(--text-2);">${esc(f.period||'—')}</td>
          <td style="padding:9px 14px;color:var(--text-2);">${esc(f.deadline||'—')}</td>
          <td style="padding:9px 14px;"><span style="font-size:11px;padding:2px 7px;border-radius:4px;background:${STATUS_COLOR[f.status]||'var(--bg-2)'};color:${f.status?'#fff':'var(--text-1)'};">${esc(f.status||'—')}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`;
}

function vrproducts(el){
  const vendor = _vrMyVendor();
  const inv    = _vrMyInventory(vendor);

  if(!inv.length){
    el.innerHTML = _vrEmptyState('No products found', 'Your inventory listed at Accent Lighting will appear here once data is imported.');
    return;
  }

  const totalSkus  = inv.length;
  const inStock    = inv.filter(i => Number(i.qty_on_hand||0) > 0).length;
  const totalValue = inv.reduce((s,i)=>s+Number(i.qty_on_hand||0)*Number(i.list_price||0),0);

  el.innerHTML = `
<div style="max-width:900px;">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
    ${_vrStatCard('SKUs Listed', totalSkus, 'at Accent Lighting', '')}
    ${_vrStatCard('In Stock', inStock, 'with qty > 0', '')}
    ${_vrStatCard('Retail Value', '$'+totalValue.toLocaleString(), 'at list price', '')}
  </div>
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:var(--bg-2);">
        <th style="padding:9px 14px;text-align:left;border-bottom:1px solid var(--border);">SKU</th>
        <th style="padding:9px 14px;text-align:left;border-bottom:1px solid var(--border);">Description</th>
        <th style="padding:9px 14px;text-align:right;border-bottom:1px solid var(--border);">Qty on Hand</th>
        <th style="padding:9px 14px;text-align:right;border-bottom:1px solid var(--border);">List Price</th>
        <th style="padding:9px 14px;text-align:left;border-bottom:1px solid var(--border);">Location</th>
      </tr></thead>
      <tbody>
        ${inv.map(i => {
          const low = i.reorder_point != null && Number(i.qty_on_hand||0) <= Number(i.reorder_point);
          return `<tr style="border-bottom:1px solid var(--border);${low?'background:#fff5f5;':''}" title="${low?'Low stock':''}">
            <td style="padding:8px 14px;font-family:monospace;font-size:12px;">${esc(i.sku||'—')}</td>
            <td style="padding:8px 14px;">${esc((i.description||'').slice(0,50))}</td>
            <td style="padding:8px 14px;text-align:right;font-weight:600;color:${low?'#ef4444':'inherit'};">${i.qty_on_hand??'—'}</td>
            <td style="padding:8px 14px;text-align:right;">$${Number(i.list_price||0).toFixed(2)}</td>
            <td style="padding:8px 14px;color:var(--text-3);font-size:12px;">${esc(i.location||'—')}</td>
          </tr>`;}).join('')}
      </tbody>
    </table>
  </div>
</div>`;
}

function vrcontact(el){
  el.innerHTML = `
<div style="max-width:560px;">
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:24px 28px;">
    <h3 style="margin:0 0 16px;font-size:16px;">Contact Accent Lighting</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:4px;">Subject</label>
        <input id="vrc-subject" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-2);color:var(--text-1);" placeholder="Score dispute, co-op claim, product update…">
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:4px;">Message</label>
        <textarea id="vrc-msg" rows="5" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-2);color:var(--text-1);resize:vertical;" placeholder="Your message…"></textarea>
      </div>
      <button onclick="vrSendContact()" style="padding:10px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Send</button>
    </div>
  </div>
</div>`;
}

async function vrSendContact(){
  const subject = ($('vrc-subject')?.value||'').trim();
  const msg     = ($('vrc-msg')?.value||'').trim();
  if(!subject || !msg){ toast('Please fill in subject and message','warn'); return; }
  const vendor = _vrMyVendor();
  const note   = `[Vendor Portal] ${vendor?.vendor_name||CU?.name||'Vendor'} — Subject: ${subject}\n\n${msg}`;
  if(typeof sbFetch === 'function'){
    try{
      await sbFetch('vendor_changelog','POST',{
        vendor_id: vendor?.id || null,
        vendor_name: vendor?.vendor_name || CU?.name || '',
        change_type: 'vendor_contact',
        notes: note,
        changed_by: CU?.name || CU?.email || 'VendorRep',
      });
    }catch(e){ console.log('vrcontact: log skipped', e.message); }
  }
  $('vrc-subject').value='';
  $('vrc-msg').value='';
  toast('Message sent — your Accent rep will follow up ✓');
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function _vrComputeTier(avg){
  const n = Number(avg);
  if(isNaN(n)) return '—';
  return n >= 7.5 ? 'A' : n >= 5 ? 'B' : 'C';
}

function _vrStatCard(label, value, sub, onclick){
  return `<div ${onclick?`onclick="${onclick}"`:''}  style="${onclick?'cursor:pointer;':''}background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:16px 20px;">
    <div style="font-size:24px;font-weight:700;color:var(--accent);">${value}</div>
    <div style="font-size:13px;font-weight:600;margin:4px 0 2px;">${label}</div>
    <div style="font-size:11px;color:var(--text-3);">${sub}</div>
  </div>`;
}

function _vrEmptyState(title, sub){
  return `<div style="display:flex;align-items:center;justify-content:center;height:200px;">
    <div style="text-align:center;color:var(--text-3);">
      <div style="font-size:32px;margin-bottom:8px;">📊</div>
      <div style="font-size:14px;font-weight:600;">${title}</div>
      <div style="font-size:12px;margin-top:4px;">${sub}</div>
    </div>
  </div>`;
}
