let QUOTES=[],QUOTE_ID=1,CQ=null,LI=[];

// ── QUOTE KNOWLEDGE BASE (Alexandria template + Thrive/HomeGrown patterns) ──
const QKB = {
  // Fixture codes → { part, description, unitPrice, bulbPart, bulbDesc, bulbPrice, category, notes }
  fixtures: {
    'E1': { part:'JSF 7IN 10LM SWW5 90CRI MVOLT ZT WH M12', desc:'FIXTURE "E1" — JSF 7" Downlight White', unitPrice:67.00, cat:'LED Fixtures', notes:'White body downlight. Confirm trim ring color.' },
    'E2': { part:'JSF 7IN 10LM SWW5 90CRI MVOLT ZT WH M12', desc:'FIXTURE "E2" — JSF 7" Downlight (alt zone)', unitPrice:67.00, cat:'LED Fixtures', notes:'Same body as E1. Typically black trim zone. Verify if JSFTRIM 7IN BL M12 trim applies.' },
    'L':  { part:'8837401EN3-12', desc:'FIXTURE "L" — Pendant', unitPrice:225.00, bulkPart:'LED8A19/CL/3000K/D', bulbDesc:'FIXTURE "L" BULBS — LED8A19/CL/3000K/D', bulbPrice:5.85, cat:'LED Fixtures', notes:'Pendant fixture. Confirm quantity of bulbs per fixture.' },
    'A':  { part:'142-S1WG4/20SB/BKCC', desc:'FIXTURE "A" — Wall Sconce', unitPrice:209.80, bulbPart:'LED8ST19/CL/3000K', bulbDesc:'FIXTURE "A" BULBS — LED8ST19/CL/3000K', bulbPrice:8.90, cat:'LED Fixtures', notes:'Wall sconce. 1 bulb per fixture.' },
    'B':  { part:'142-FWD10-50-375WCC-BLC', desc:'FIXTURE "B" — Heat Lamp Fixture', unitPrice:148.50, bulbPart:'375R40/1', bulbDesc:'FIXTURE "B" HEAT LAMP — 375R40/1', bulbPrice:9.90, cat:'LED Fixtures', notes:'Heat lamp. Restaurant/food service application. Confirm qty of lamps per fixture.' },
    'F':  { part:'LPX-24-CP4', desc:'FIXTURE "F" — LPX Linear', unitPrice:89.60, cat:'LED Fixtures', notes:'Linear fixture. Verify mounting and driver.' },
    'C':  { part:'73-T31N-BL', desc:'FIXTURE "C" — Pendant Adaptor', unitPrice:27.30, cat:'LED Fixtures', notes:'Pendant adaptor. Confirm fixture it pairs with.' },
    'T1': { part:'73-R533-BL', desc:'FIXTURE "T1" HEADS — Black Track Head', unitPrice:29.50, bulbPart:'LED12.5PAR30/LN/25/3K', bulbDesc:'FIXTURE "T1" BULBS — LED12.5PAR30/LN/25/3K', bulbPrice:8.50, cat:'Track', notes:'Black track head. 1 bulb per head. Requires R533-BL.' },
    'T2': { part:'R533-WH', desc:'FIXTURE "T2" HEADS — White Track Head', unitPrice:29.50, bulbPart:'LED12.5PAR30/LN/25/3K', bulbDesc:'FIXTURE "T2" BULBS — LED12.5PAR30/LN/25/3K', bulbPrice:8.50, cat:'Track', notes:'White track head. 1 bulb per head. Requires white track system.' }
  },
  // Track section parts by length and color
  trackParts: {
    black: {
      2:  { part:'R2-BL',  desc:'TRACK 2 FT. BLACK',  price:20.90 },
      4:  { part:'R4-BL',  desc:'TRACK 4 FT. BLACK',  price:22.00 },
      6:  { part:'R6-BL',  desc:'TRACK 6 FT. BLACK',  price:32.00 },
      8:  { part:'R8-BL',  desc:'TRACK 8 FT. BLACK',  price:36.00 }
    },
    white: {
      2:  { part:'R2-WH',  desc:'TRACK 2 FT. WHITE',  price:20.90 },
      4:  { part:'R4-WH',  desc:'TRACK 4 FT. WHITE',  price:22.00 },
      6:  { part:'R6-WH',  desc:'TRACK 6 FT. WHITE',  price:32.00 },
      8:  { part:'R8-WH',  desc:'TRACK 8 FT. WHITE',  price:36.00 }
    },
    connector: {
      black: { part:'R23 BL',  desc:'TRACK CONNECTORS BLACK',  price:10.00 },
      white: { part:'R23-WH',  desc:'TRACK CONNECTORS WHITE',  price:10.00 }
    },
    powerfeed: {
      black: { part:'73-R49-BL', desc:'TRACK CONTINUATION POWER FEED BLACK', price:37.65 },
      white: { part:'73-R49-WH', desc:'TRACK CONTINUATION POWER FEED WHITE', price:37.65 }
    }
  }
};

// ── TRACK HARDWARE CALCULATOR ──
// Input: array of run lengths in feet, color 'black'|'white'
// Returns: array of line items covering all sections, connectors, power feeds
// Logic: fill each run with 8ft sections, then the largest remainder section.
// Each run = 1 power feed + (length/8 rounded sections) + connectors per joint.
function calcTrackHardware(runs, color) {
  const parts = QKB.trackParts;
  const col = color === 'white' ? 'white' : 'black';
  const sectionTotals = { 2:0, 4:0, 6:0, 8:0 };
  let totalConnectors = 0;
  let totalPowerFeeds = runs.length;
  const reasoning = [];

  runs.forEach((len, i) => {
    let remaining = len;
    let sections = [];
    while (remaining >= 8) { sections.push(8); remaining -= 8; }
    if (remaining === 6) { sections.push(6); remaining = 0; }
    else if (remaining === 4) { sections.push(4); remaining = 0; }
    else if (remaining === 2) { sections.push(2); remaining = 0; }
    else if (remaining > 0) {
      // Round up to next section size
      if (remaining <= 2) { sections.push(2); }
      else if (remaining <= 4) { sections.push(4); }
      else if (remaining <= 6) { sections.push(6); }
      else { sections.push(8); }
    }
    const connectors = sections.length - 1;
    totalConnectors += connectors;
    sections.forEach(s => sectionTotals[s]++);
    reasoning.push(`Run ${i+1}: ${len}ft → ${sections.map(s=>s+"ft").join("+")} + 1 power feed + ${connectors} connector${connectors!==1?'s':''}`);
  });

  const lines = [];
  [8,6,4,2].forEach(sz => {
    if (sectionTotals[sz] > 0) {
      const p = parts[col][sz];
      lines.push({ part: p.part, desc: `FIXTURE "T${col==='white'?2:1}" ${p.desc}`, qty: sectionTotals[sz], price: p.price, cat: 'Track', status: 'pending', flag: '', reasoning: `${sectionTotals[sz]}× ${sz}ft section from run calculations` });
    }
  });
  if (totalPowerFeeds > 0) {
    const pf = parts.powerfeed[col];
    lines.push({ part: pf.part, desc: `FIXTURE "T${col==='white'?2:1}" ${pf.desc}`, qty: totalPowerFeeds, price: pf.price, cat: 'Track', status: 'pending', flag: '', reasoning: `1 power feed per run × ${totalPowerFeeds} runs` });
  }
  if (totalConnectors > 0) {
    const cn = parts.connector[col];
    lines.push({ part: cn.part, desc: `FIXTURE "T${col==='white'?2:1}" ${cn.desc}`, qty: totalConnectors, price: cn.price, cat: 'Track', status: 'pending', flag: '', reasoning: `Connectors = (sections per run − 1) summed across all runs` });
  }
  return { lines, reasoning };
}

// ── LINE ITEM FACTORY ──
function nLI(){ return { id: Date.now()+Math.random(), part:'', desc:'', qty:1, price:0, cat:'LED Fixtures', status:'pending', flag:'', reasoning:'' }; }
function addLI(){ LI.push(nLI()); renderLI(); updatePreview(); }

function buildCuDatalist() {
  if (!$('q-cu-options')) {
    const dl = document.createElement('datalist');
    dl.id = 'q-cu-options';
    document.body.appendChild(dl);
  }
  const dl = $('q-cu-options');
  if (dl && typeof CUSTOMERS !== 'undefined' && Array.isArray(CUSTOMERS)) {
    dl.innerHTML = CUSTOMERS.slice(0, 1000).map(c => `<option value="${esc(c.name||'')}">`).join('');
  }
}

// ── MAIN QUOTE RENDERER ──
function quotes(el, act) {
  act.innerHTML = `<button class="btn btn-outline btn-sm" onclick="goTo('quotes')">+ New</button>${QUOTES.length?`<button class="btn btn-outline btn-sm" onclick="showSaved()">Saved (${QUOTES.length})</button>`:''}<button class="btn btn-outline btn-sm" onclick="exportQuoteCSV()">⬇ CSV</button>`;
  if (!LI.length) LI = [nLI()];
  const qid = CQ ? CQ.id : 'QT-'+String(QUOTE_ID).padStart(4,'0');
  el.innerHTML = `<div class="g2">
    <div>
      <div class="card mb16" style="margin-bottom:14px;"><div class="card-hd"><span class="card-title">Customer & Project</span></div><div class="card-body">
        <div class="frow"><div class="fcol field"><label>Customer</label><input id="q-cu" list="q-cu-options" autocomplete="off" value="${CQ?.customer||''}" onfocus="buildCuDatalist()"><datalist id="q-cu-options"></datalist></div><div class="fcol field"><label>Contact</label><input id="q-co" value="${CQ?.contact||''}"></div></div>
        <div class="frow"><div class="fcol field"><label>Project Name</label><input id="q-pr" value="${CQ?.project||''}"></div><div class="fcol field"><label>Type</label><select id="q-ty">${['Commercial Office','Retail','Industrial','Hospitality','Healthcare','Residential','Other'].map(t=>`<option ${CQ?.type===t?'selected':''}>${t}</option>`).join('')}</select></div></div>
        <div class="frow"><div class="fcol field"><label>Ship To Address</label><input id="q-addr" value="${CQ?.address||''}"></div><div class="fcol field"><label>Budget</label><input id="q-bu" value="${CQ?.budget||''}"></div></div>
        <div class="field"><label>Raw Notes / Fixture Schedule <span style="color:var(--text-3);font-size:11px;">(paste fixture codes + counts + track runs here)</span></label><textarea id="q-no" style="min-height:90px;">${CQ?.notes||''}</textarea></div>
      </div></div>

      <div class="card mb16" style="margin-bottom:14px;">
        <div class="card-hd"><span class="card-title">AI Quote Builder</span><span class="muted sm">Paste raw notes above, then click Parse</span></div>
        <div class="card-body" style="padding:13px;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-accent btn-sm" onclick="aiParseNotes()">⚡ Parse Notes → Line Items</button>
            <button class="btn btn-outline btn-sm" onclick="openTrackCalc()">📐 Track Calculator</button>
            <button class="btn btn-outline btn-sm" onclick="approveAllRows()">✓ Approve All</button>
            <button class="btn btn-outline btn-sm" onclick="addLI()">+ Manual Row</button>
          </div>
          <div id="ai-parse-status" style="margin-top:10px;font-size:13px;color:var(--text-3);"></div>
        </div>
      </div>

      <div class="card"><div class="card-hd"><span class="card-title">Line Items</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span id="q-approval-summary" class="muted sm"></span>
        </div>
      </div>
        <div class="card-body" style="padding:13px;">
          <div class="tbl-wrap"><table class="li-table"><thead><tr>
            <th style="width:4%">✓</th>
            <th style="width:14%">Part #</th>
            <th style="width:28%">Description</th>
            <th style="width:8%">Qty</th>
            <th style="width:10%">Price</th>
            <th style="width:10%">Total</th>
            <th style="width:12%">Category</th>
            <th style="width:14%"></th>
          </tr></thead><tbody id="li-body"></tbody></table></div>
          <div style="display:flex;justify-content:flex-end;gap:18px;margin-top:10px;padding-top:9px;border-top:1px solid var(--border);"><span class="muted sm">Subtotal</span><span class="mono fw6" id="q-sub">$0.00</span></div>
        </div>
      </div>
    </div>

    <div><div class="card" style="position:sticky;top:0;">
      <div class="card-hd"><span class="card-title">Preview</span><span class="mono sm muted">${qid}</span></div>
      <div class="card-body"><div class="q-prev">
        <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
          <div><div style="font-size:16px;font-weight:700;" id="pv-pr">Project</div><div class="sm muted" id="pv-cu">Customer</div></div>
          <div style="text-align:right;"><div class="mono sm muted">${qid}</div><div class="mono sm muted">${new Date().toLocaleDateString()}</div></div>
        </div>
        <div class="sm muted" id="pv-addr" style="margin-bottom:8px;"></div>
        <div class="sm muted mb16" id="pv-meta" style="margin-bottom:8px;"></div>
        <div id="pv-items" style="font-size:13px;"></div>
        <div class="sep"></div>
        <div style="display:flex;justify-content:space-between;"><span class="fw6">SUBTOTAL</span><span class="mono" style="font-size:20px;font-weight:700;" id="pv-total">$0.00</span></div>
        <div style="margin-top:8px;padding:9px;background:var(--bg);border-radius:6px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span class="muted">Freight (TBD)</span><span class="mono" id="pv-freight">—</span></div>
          <div style="display:flex;justify-content:space-between;"><span class="muted">Tax (confirm exempt status)</span><span class="mono muted">🚩 Verify</span></div>
        </div>
        <div id="pv-flags" style="margin-top:10px;"></div>
      </div></div>
      <div class="card-foot" style="display:flex;gap:7px;flex-wrap:wrap;">
        <button class="btn btn-accent btn-sm" onclick="saveQ()">💾 Save</button>
        <button class="btn btn-outline btn-sm" onclick="printQ()">🖨 PDF</button>
        <button class="btn btn-outline btn-sm" onclick="exportQuoteCSV()">⬇ CSV</button>
        <button class="btn btn-ghost btn-sm" onclick="CQ=null;LI=[nLI()];goTo('quotes')">Clear</button>
      </div>
    </div></div>
    <!-- Sticky quote action bar — stays visible while scrolling long line-item lists. -->
    <div id="q-stickybar" style="position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:450;background:var(--surface);border:1px solid var(--border);box-shadow:0 6px 22px rgba(0,0,0,.12);border-radius:30px;padding:8px 14px;display:flex;align-items:center;gap:10px;font-size:13px;">
      <span class="muted sm" style="font-size:11px;">Total</span>
      <span class="mono fw6" id="q-sticky-total" style="font-size:17px;color:var(--green);">$0.00</span>
      <span style="width:1px;height:18px;background:var(--border);"></span>
      <span class="muted sm" id="q-sticky-count">0 lines</span>
      <span style="width:1px;height:18px;background:var(--border);"></span>
      <button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 9px;" onclick="approveAllRows()">✓ Approve all</button>
      <button class="btn btn-accent btn-sm" style="font-size:12px;padding:5px 14px;" onclick="saveQ()" title="Cmd/Ctrl+S">💾 Save</button>
    </div>
  </div>`;
  renderLI(); updatePreview();
}

function buildSkuDatalist() {
  if (!$('li-sku-options')) {
    const dl = document.createElement('datalist');
    dl.id = 'li-sku-options';
    document.body.appendChild(dl);
  }
  const dl = $('li-sku-options');
  if (dl && typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) {
    dl.innerHTML = INVENTORY
      .filter(it => it.sku)
      .slice(0, 5000)
      .map(it => `<option value="${esc(it.sku)}">${esc(it.description||'')}${it.list_price?' — $'+Number(it.list_price).toFixed(2):''}${it.vendor_name?' · '+esc(it.vendor_name):''}</option>`)
      .join('');
  }
}

// ── RENDER LINE ITEMS ──
function renderLI() {
  const b = $('li-body'); if (!b) return;
  const approved = LI.filter(l=>l.status==='approved').length;
  const flagged  = LI.filter(l=>l.status==='flagged').length;
  const pending  = LI.filter(l=>l.status==='pending').length;
  const summary  = $('q-approval-summary');
  if (summary) summary.innerHTML = `<span style="color:var(--green);">✓ ${approved} approved</span>&nbsp;&nbsp;<span style="color:#f59e0b;">⚠ ${flagged} flagged</span>&nbsp;&nbsp;<span style="color:var(--text-3);">${pending} pending</span>`;

  if (!$('li-sku-options') || !$('li-sku-options').childNodes.length) buildSkuDatalist();

  b.innerHTML = LI.map((li, i) => {
    const rowBg = li.status==='approved' ? 'background:rgba(34,197,94,.05);' : li.status==='flagged' ? 'background:rgba(245,158,11,.07);' : '';
    const statusBadge = li.status==='approved'
      ? `<span style="color:var(--green);font-size:16px;cursor:pointer;" title="Approved — click to revert" onclick="LI[${i}].status='pending';renderLI();updatePreview()">✓</span>`
      : li.status==='flagged'
      ? `<span style="color:#f59e0b;font-size:14px;cursor:pointer;" title="${esc(li.flag||'Flagged')}" onclick="LI[${i}].status='pending';renderLI();updatePreview()">⚠</span>`
      : `<span style="color:var(--text-3);font-size:14px;cursor:pointer;" title="Click to approve" onclick="LI[${i}].status='approved';renderLI();updatePreview()">○</span>`;
    const flagHint = li.flag ? `<div style="font-size:10.5px;color:#f59e0b;margin-top:2px;">🚩 ${esc(li.flag)}</div>` : '';
    const reasonHint = li.reasoning ? `<div style="font-size:10px;color:var(--text-3);margin-top:2px;font-style:italic;">${esc(li.reasoning)}</div>` : '';
    return `<tr id="li-row-${i}" style="${rowBg}">
      <td style="text-align:center;">${statusBadge}</td>
      <td data-label="Part #"><input class="li-part" value="${esc(li.part)}" list="li-sku-options" autocomplete="off" oninput="liSkuPick(${i},this.value)" onchange="LI[${i}].part=this.value;LI[${i}].status='pending';" style="font-family:'DM Mono',monospace;font-size:11px;" placeholder="Part #"></td>
      <td data-label="Description"><input class="li-desc" value="${esc(li.desc)}" onchange="LI[${i}].desc=this.value;LI[${i}].status='pending';updatePreview()" placeholder="Description">${flagHint}${reasonHint}</td>
      <td data-label="Qty"><input class="li-qty" type="number" value="${li.qty}" onchange="LI[${i}].qty=parseFloat(this.value)||0;LI[${i}].status='pending';updateRowTotal(${i});updatePreview()" style="text-align:center;"></td>
      <td data-label="Price"><input class="li-price" type="number" value="${li.price}" onchange="LI[${i}].price=parseFloat(this.value)||0;LI[${i}].status='pending';updateRowTotal(${i});updatePreview()"></td>
      <td data-label="Total" class="mono li-total" style="font-weight:600;">$${(li.qty*li.price).toFixed(2)}</td>
      <td data-label="Category"><select onchange="LI[${i}].cat=this.value" style="border:1.5px solid var(--border);border-radius:4px;padding:3px;font-family:'Outfit',sans-serif;font-size:12px;width:100%;">${['LED Fixtures','Controls','Emergency','Track','Outdoor','Other'].map(c=>`<option ${li.cat===c?'selected':''}>${c}</option>`).join('')}</select></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-outline btn-sm" style="padding:2px 6px;min-width:0;" onclick="LI[${i}].status='approved';renderLI();updatePreview()" title="Approve">✓</button>
        <button class="btn btn-outline btn-sm" style="padding:2px 6px;min-width:0;" onclick="LI.splice(${i+1},0,{...LI[${i}], id:Date.now()+Math.random()});renderLI();updatePreview()" title="Clone">⎘</button>
        <button class="btn btn-outline btn-sm" style="padding:2px 6px;min-width:0;" onclick="qFlagRow(${i})" title="Flag">⚑</button>
        <button onclick="LI.splice(${i},1);if(!LI.length)LI.push(nLI());renderLI();updatePreview()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:15px;margin-left:4px;" title="Remove">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function updateRowTotal(i) {
  const row = $(`li-row-${i}`);
  if (row) {
    const totalEl = row.querySelector('.li-total');
    if (totalEl) totalEl.textContent = '$' + (LI[i].qty * LI[i].price).toFixed(2);
  }
}

// liSkuPick — auto-fill from inventory with debounce and targeted DOM updates
let _skuDebounce;
function liSkuPick(i, sku) {
  LI[i].part = sku;
  clearTimeout(_skuDebounce);
  _skuDebounce = setTimeout(() => {
    if (!sku || typeof INVENTORY === 'undefined' || !Array.isArray(INVENTORY)) return;
    const item = INVENTORY.find(it => (it.sku||'').toLowerCase() === sku.toLowerCase());
    if (!item) return;

    LI[i].part = item.sku;
    const row = $(`li-row-${i}`);
    if (row) {
      const descInp = row.querySelector('.li-desc');
      const priceInp = row.querySelector('.li-price');
      if (descInp && (!LI[i].desc || LI[i].desc.length < 3)) {
        LI[i].desc = item.description || LI[i].desc;
        descInp.value = LI[i].desc;
      }
      if (priceInp && (!LI[i].price || LI[i].price === 0)) {
        LI[i].price = Number(item.list_price) || LI[i].price;
        priceInp.value = LI[i].price;
      }
      updateRowTotal(i);
    }
    if (item.vendor_name) { LI[i].vendorName = item.vendor_name; LI[i].vendorId = item.vendor_id; }
    LI[i].status = 'pending';
    updatePreview();
  }, 150);
}

function qFlagRow(i) {
  const reason = prompt('Flag reason (leave blank to cancel):', LI[i].flag || '');
  if (reason === null) return;
  LI[i].flag = reason;
  LI[i].status = 'flagged';
  renderLI(); updatePreview();
}

function approveAllRows() {
  if (!confirm(`Approve all ${LI.length} rows? Review flagged items first.`)) return;
  LI.forEach(l => { if (l.status !== 'flagged') l.status = 'approved'; });
  renderLI(); updatePreview();
  toast('All unflagged rows approved', 'ok');
}

// ── UPDATE PREVIEW ──
function updatePreview() {
  const sub = LI.reduce((s,l)=>s+l.qty*l.price, 0);
  $('q-sub')  && ($('q-sub').textContent  = '$'+sub.toFixed(2));
  $('pv-pr')  && ($('pv-pr').textContent  = $('q-pr')?.value||'Project');
  $('pv-cu')  && ($('pv-cu').textContent  = $('q-cu')?.value||'Customer');
  $('pv-addr')&& ($('pv-addr').textContent = $('q-addr')?.value||'');
  const t=$('q-ty')?.value;
  $('pv-meta')&& ($('pv-meta').textContent = t||'');
  $('pv-total')&& ($('pv-total').textContent = '$'+sub.toFixed(2));
  $('q-sticky-total') && ($('q-sticky-total').textContent = '$'+sub.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}));
  $('q-sticky-count') && ($('q-sticky-count').textContent = (LI||[]).length + ' line' + ((LI||[]).length===1?'':'s'));
  const ie = $('pv-items');
  if (ie) ie.innerHTML = LI.filter(l=>l.desc||l.price>0).map(l=>{
    const flagTag = l.status==='flagged' ? `<span style="color:#f59e0b;font-size:10px;margin-left:4px;">⚠</span>` : '';
    const approvedTag = l.status==='approved' ? `<span style="color:var(--green);font-size:10px;margin-left:4px;">✓</span>` : '';
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light);">
      <div style="flex:1;min-width:0;padding-right:12px;">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${esc(l.desc||l.part||'—')}</div>
        <div class="muted" style="font-size:11px;">${esc(l.part||'')} ${l.part?'·':''} ${l.qty} @ $${l.price.toFixed(2)}</div>
      </div>
      <div style="text-align:right;">
        <div class="mono" style="font-weight:600;">$${(l.qty*l.price).toFixed(2)}</div>
        <div>${flagTag}${approvedTag}</div>
      </div>
    </div>`;
  }).join('');
  // Flag summary in preview
  const flagged = LI.filter(l=>l.status==='flagged');
  const flagEl = $('pv-flags');
  if (flagEl) {
    flagEl.innerHTML = flagged.length
      ? `<div style="padding:9px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:6px;font-size:12px;"><div style="font-weight:700;color:#f59e0b;margin-bottom:5px;">⚠ ${flagged.length} flagged row${flagged.length>1?'s':''} — resolve before finalizing</div>${flagged.map(l=>`<div style="color:var(--text-2);padding:2px 0;">• ${esc(l.desc||l.part||'Row')} — ${esc(l.flag||'No reason given')}</div>`).join('')}</div>`
      : '';
  }
}

// ── AI PARSE NOTES → LINE ITEMS ──
async function aiParseNotes() {
  const key = getS('aos-api');
  if (!key) { toast('Add API key in Settings', 'err'); return; }
  const notes = $('q-no')?.value?.trim();
  if (!notes) { toast('Paste fixture schedule in the Notes field first', 'err'); return; }
  const btn = event?.target?.closest('button');
  if (btn) { btn.disabled = true; btn.dataset.origText = btn.innerHTML; btn.innerHTML = '⌛ Parsing...'; }
  const statusEl = $('ai-parse-status');
  if (statusEl) statusEl.innerHTML = `<div style="display:flex;gap:8px;align-items:center;"><div class="dots"><div class="dot-b"></div><div class="dot-b"></div><div class="dot-b"></div></div>Parsing fixture schedule…</div>`;

  const systemPrompt = `You are a commercial lighting quote builder for Accent Lighting Inc., a lighting distributor in Wichita, KS. You process raw field notes from restaurant and hospitality lighting projects and return structured line items.

KNOWN FIXTURE CODE MAP (from prior HomeGrown/Thrive projects):
- E1 = JSF 7IN 10LM SWW5 90CRI MVOLT ZT WH M12 | $67.00 | White downlight
- E2 = JSF 7IN 10LM SWW5 90CRI MVOLT ZT WH M12 | $67.00 | Same body, may need JSFTRIM 7IN BL M12 black trim add-on at $13.59
- L  = 8837401EN3-12 pendant | $225.00 + LED8A19/CL/3000K/D bulb $5.85 each (1 per fixture)
- A  = 142-S1WG4/20SB/BKCC wall sconce | $209.80 + LED8ST19/CL/3000K bulb $8.90 each
- B  = 142-FWD10-50-375WCC-BLC heat lamp | $148.50 + 375R40/1 heat lamp $9.90 each
- F  = LPX-24-CP4 linear | $89.60
- T1 = 73-R533-BL black track head | $29.50 + LED12.5PAR30/LN/25/3K bulb $8.50 each (1 per head)
- T2 = R533-WH white track head | $29.50 + LED12.5PAR30/LN/25/3K bulb $8.50 each (1 per head)
- Track hardware: R8=8ft section, R6=6ft, R4=4ft, R2=2ft. BL=black (T1 system), WH=white (T2 system).
- Power feed: 73-R49-BL $37.65 (black) / 73-R49-WH $37.65 (white) — 1 per run
- Connectors: R23 BL $10.00 (black) / R23-WH $10.00 (white) — (sections per run - 1) per run
- Unknown codes (U, H, P1, P2, P3, etc.) = FLAG as unknown, include them with $0 price and status "flagged"

TRACK HARDWARE RULES:
1. For each track run length: fill with 8ft sections first, then use the best-fit remainder (2/4/6ft).
2. Each run needs exactly 1 power feed.
3. Connectors = (number of sections in run) - 1.
4. Calculate black runs and white runs separately.

RULES:
- Every fixture that has a bulb = create TWO line items: one for the fixture, one for bulbs (qty = fixture qty × bulbs per fixture).
- Unknown fixture codes → include with status "flagged", price 0, flag message "Unknown fixture code — verify with project notes or blueprints"
- For track heads: ALSO generate all track hardware line items from the run lengths provided.
- Prices: use the known prices above exactly. If unknown, use 0 and flag.
- Return ONLY a valid JSON object. No markdown, no explanation outside the JSON.

OUTPUT FORMAT:
{
  "reasoning": "Plain English explanation of every decision made, line by line",
  "lines": [
    {
      "part": "part number string",
      "desc": "description string",
      "qty": number,
      "price": number (unit price),
      "cat": "LED Fixtures|Track|Controls|Emergency|Outdoor|Other",
      "status": "pending|flagged",
      "flag": "flag reason string or empty string",
      "reasoning": "why this line was created"
    }
  ]
}`;

  try {
    const r = await fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Parse this fixture schedule and generate line items:\n\n${notes}` }]
      })
    });
    const bodyText = await r.text();
    if (!r.ok) {
      let msg = bodyText;
      try { const j = JSON.parse(bodyText); msg = j.error?.message || j.error || bodyText; } catch {}
      if (statusEl) statusEl.innerHTML = `<div style="color:var(--red);font-size:13px;">⚠ API ${r.status}: ${esc(String(msg).slice(0,300))}</div>`;
      console.error('[aiParseNotes] upstream', r.status, bodyText);
      return;
    }
    let data;
    try { data = JSON.parse(bodyText); } catch(e) {
      if (statusEl) statusEl.innerHTML = `<div style="color:var(--red);font-size:13px;">⚠ Proxy returned non-JSON: ${esc(bodyText.slice(0,200))}</div>`;
      console.error('[aiParseNotes] non-JSON body:', bodyText.slice(0,500));
      return;
    }
    const raw = data.content?.[0]?.text || '';
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) {
      if (statusEl) statusEl.innerHTML = `<div style="color:var(--red);font-size:13px;">⚠ Parse failed — AI response was not valid JSON. Try again.</div>`;
      console.error('[aiParseNotes] JSON parse error:', raw.slice(0,200));
      return;
    }
    if (!parsed.lines || !parsed.lines.length) {
      if (statusEl) statusEl.innerHTML = `<div style="color:#f59e0b;font-size:13px;">⚠ No lines returned. Check notes format.</div>`;
      return;
    }
    // Inject parsed lines
    const newLines = parsed.lines.map(l => ({
      id: Date.now()+Math.random(),
      part: l.part || '',
      desc: l.desc || '',
      qty: Number(l.qty) || 0,
      price: Number(l.price) || 0,
      cat: l.cat || 'LED Fixtures',
      status: l.status || 'pending',
      flag: l.flag || '',
      reasoning: l.reasoning || ''
    }));
    LI = newLines;
    renderLI(); updatePreview();
    // Show reasoning panel
    const flagCount = newLines.filter(l=>l.status==='flagged').length;
    if (statusEl) statusEl.innerHTML = `
      <div style="margin-top:4px;">
        <div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--green);">✓ ${newLines.length} lines generated · ${flagCount} flagged for review</div>
        <details style="font-size:12px;cursor:pointer;">
          <summary style="color:var(--text-3);cursor:pointer;user-select:none;">View AI reasoning (click to expand)</summary>
          <div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:6px;line-height:1.6;white-space:pre-wrap;color:var(--text-2);">${esc(parsed.reasoning||'No reasoning provided.')}</div>
        </details>
        <div style="margin-top:8px;font-size:12px;color:var(--text-3);">Review each row · approve or flag · then Save or export CSV</div>
      </div>`;
    toast(`${newLines.length} lines built · ${flagCount} need review`, flagCount ? '' : 'ok');
  } catch(e) {
    if (statusEl) statusEl.innerHTML = `<div style="color:var(--red);font-size:13px;">⚠ Connection error: ${esc(e.message)}</div>`;
    toast('AI parse failed','err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.origText; }
  }
}

// ── TRACK CALCULATOR MODAL ──
function openTrackCalc() {
  openModal('Track Hardware Calculator',
    `<div style="font-size:13px;margin-bottom:12px;color:var(--text-2);">Enter track run lengths (one per line, in feet). Select color. Calculator outputs all sections, connectors, and power feeds.</div>
    <div class="frow">
      <div class="fcol field">
        <label>Black Track Runs (ft, one per line)</label>
        <textarea id="tc-bl" style="min-height:100px;font-family:'DM Mono',monospace;" placeholder="16\n16\n26\n6\n32"></textarea>
      </div>
      <div class="fcol field">
        <label>White Track Runs (ft, one per line)</label>
        <textarea id="tc-wh" style="min-height:100px;font-family:'DM Mono',monospace;" placeholder="26\n32"></textarea>
      </div>
    </div>
    <div id="tc-preview" style="margin-top:12px;font-size:12.5px;"></div>`,
    `<button class="btn btn-outline" onclick="previewTrackCalc()">Preview</button>
     <button class="btn btn-accent" onclick="addTrackLinesToQuote()">Add to Quote</button>
     <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`
  );
}

function parseRunLengths(txt) {
  return (txt||'').split('\n').map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>n>0);
}

function previewTrackCalc() {
  const blRuns = parseRunLengths($('tc-bl')?.value);
  const whRuns = parseRunLengths($('tc-wh')?.value);
  const prev = $('tc-preview'); if (!prev) return;
  let html = '';
  if (blRuns.length) {
    const { lines, reasoning } = calcTrackHardware(blRuns, 'black');
    html += `<div style="font-weight:600;margin-bottom:4px;">Black Track (${blRuns.length} runs):</div>`;
    html += reasoning.map(r=>`<div style="color:var(--text-3);margin-bottom:2px;">· ${esc(r)}</div>`).join('');
    html += `<table style="width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12px;">${lines.map(l=>`<tr><td style="padding:3px 0;">${esc(l.part)}</td><td>${esc(l.desc)}</td><td style="text-align:center;">${l.qty}</td><td style="text-align:right;font-family:'DM Mono',monospace;">$${(l.qty*l.price).toFixed(2)}</td></tr>`).join('')}</table>`;
  }
  if (whRuns.length) {
    const { lines, reasoning } = calcTrackHardware(whRuns, 'white');
    html += `<div style="font-weight:600;margin-bottom:4px;">White Track (${whRuns.length} runs):</div>`;
    html += reasoning.map(r=>`<div style="color:var(--text-3);margin-bottom:2px;">· ${esc(r)}</div>`).join('');
    html += `<table style="width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12px;">${lines.map(l=>`<tr><td style="padding:3px 0;">${esc(l.part)}</td><td>${esc(l.desc)}</td><td style="text-align:center;">${l.qty}</td><td style="text-align:right;font-family:'DM Mono',monospace;">$${(l.qty*l.price).toFixed(2)}</td></tr>`).join('')}</table>`;
  }
  if (!html) html = `<div style="color:var(--text-3);">Enter at least one run length to preview.</div>`;
  prev.innerHTML = html;
}

let _pendingTrackLines = [];
function addTrackLinesToQuote() {
  const blRuns = parseRunLengths($('tc-bl')?.value);
  const whRuns = parseRunLengths($('tc-wh')?.value);
  _pendingTrackLines = [];
  if (blRuns.length) _pendingTrackLines.push(...calcTrackHardware(blRuns,'black').lines);
  if (whRuns.length) _pendingTrackLines.push(...calcTrackHardware(whRuns,'white').lines);
  if (!_pendingTrackLines.length) { toast('No runs entered','err'); return; }
  _pendingTrackLines.forEach(l => LI.push({ id:Date.now()+Math.random(), ...l }));
  closeModal();
  renderLI(); updatePreview();
  toast(`${_pendingTrackLines.length} track hardware lines added`, 'ok');
}

// ── SAVE QUOTE ──
async function saveQ() {
  const proj = $('q-pr')?.value?.trim();
  const cust = $('q-cu')?.value?.trim();
  if(!proj){ toast('Project Name is required','err'); $('q-pr')?.focus(); return; }
  if(!cust){ toast('Customer is required','err'); $('q-cu')?.focus(); return; }

  const btn = event?.target?.closest('button') || document.querySelector('button[onclick="saveQ()"]');
  const isSticky = btn?.closest('#q-stickybar');
  if (btn) { btn.disabled = true; btn.dataset.origText = btn.innerHTML; btn.innerHTML = '⌛ Saving...'; }

  const sub = LI.reduce((s,l)=>s+l.qty*l.price, 0);
  const qid = CQ?CQ.id:'QT-'+String(QUOTE_ID++).padStart(4,'0');
  const q = { id:qid, _uuid:CQ?._uuid, date:new Date().toLocaleDateString(), customer:$('q-cu')?.value||'', contact:$('q-co')?.value||'', project:proj, type:$('q-ty')?.value||'', address:$('q-addr')?.value||'', sqft:'', budget:$('q-bu')?.value||'', notes:$('q-no')?.value||'', lineItems:[...LI], total:sub };
  const ex = QUOTES.findIndex(x=>x.id===qid);
  if(ex>=0)QUOTES[ex]=q;else QUOTES.push(q);
  CQ=null; log('acc','◻',`Quote: ${proj} — $${sub.toFixed(2)}`,'Just now');
  if(typeof sbSaveQuote==='function'){
    try {
      const ok = await sbSaveQuote(q);
      if(ok) {
        if(typeof sbAuditLog==='function') sbAuditLog('quote_save','quotes',{quote_id:qid,total:sub});
        toast('Saved ('+qid+')','ok');
      } else {
        toast('Save failed — check connection','err');
      }
    } catch (e) {
      console.error('[saveQ] error:', e);
      toast('Save error: ' + e.message, 'err');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.origText; }
    }
  } else {
    toast('Saved locally ('+qid+')','ok');
    if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.origText; }
  }
}

// ── DELETE / SAVED ──
async function deleteQ(numberId) {
  if(!confirm('Delete quote '+numberId+'?')) return;
  const btn = event?.target?.closest('button');
  if (btn) { btn.disabled = true; btn.dataset.origText = btn.innerHTML; btn.innerHTML = '⌛...'; }

  try {
    QUOTES = QUOTES.filter(q=>q.id!==numberId);
    if(typeof sbDeleteQuote==='function') await sbDeleteQuote(numberId);
    if(typeof sbAuditLog==='function') sbAuditLog('quote_delete','quotes',{quote_id:numberId});
    closeModal(); showSaved();
    toast('Quote deleted','ok');
  } catch (e) {
    console.error('[deleteQ] error:', e);
    toast('Delete failed: ' + e.message, 'err');
    if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.origText; }
  }
}

// Duplicate an existing saved quote — clones line items, blanks the project
// + dates so the user can re-save against a new project. Fresh quote ID is
// assigned at save time. Useful for repeat-bid workflows.
function duplicateQuote(quoteId) {
  const src = QUOTES.find(q => q.id === quoteId);
  if (!src) { toast('Quote not found','err'); return; }
  CQ = null;  // force new quote ID on next save
  LI = (src.lineItems||[]).map(l => ({
    id: Date.now()+Math.random(),
    part: l.part||'', desc: l.desc||'',
    qty: Number(l.qty)||0, price: Number(l.price)||0,
    cat: l.cat||'LED Fixtures',
    vendorId: l.vendorId, vendorName: l.vendorName,
    status: 'pending', flag: '', reasoning: ''
  }));
  if (!LI.length) LI = [nLI()];
  closeModal();
  goTo('quotes');
  // Pre-fill copyable customer / type / sqft / budget without forcing the project name —
  // user typically wants to retype that for the new bid.
  setTimeout(() => {
    if ($('q-cu')) $('q-cu').value = src.customer || '';
    if ($('q-co')) $('q-co').value = src.contact || '';
    if ($('q-ty')) $('q-ty').value = src.type || '';
    if ($('q-addr')) $('q-addr').value = src.address || '';
    if ($('q-bu')) $('q-bu').value = src.budget || '';
    renderLI(); updatePreview();
    toast(`Cloned ${src.lineItems?.length||0} line items · set a new project name`, 'ok');
  }, 60);
  if (typeof sbAuditLog==='function') sbAuditLog('quote_duplicate','quotes',{source_id: quoteId});
}

let _savedQuoteFilter = '';
function showSaved() {
  const list = renderSavedQuoteRows();
  openModal('Saved Quotes',`
    <input id="sq-filter" placeholder="Filter by project / customer / quote # / $…" value="${esc(_savedQuoteFilter)}" oninput="_savedQuoteFilter=this.value;document.getElementById('sq-list').innerHTML=renderSavedQuoteRows()" style="width:100%;padding:8px 12px;font-size:13px;border:1px solid var(--border);border-radius:6px;margin-bottom:10px;">
    <div id="sq-list" style="max-height:360px;overflow-y:auto;">${list}</div>
  `,
  `<button class="btn btn-outline" onclick="closeModal()">Close</button>`);
  setTimeout(() => { const f = document.getElementById('sq-filter'); if (f) f.focus(); }, 50);
}

function renderSavedQuoteRows() {
  if (!QUOTES.length) return '<div style="color:var(--text-3);font-size:13px;padding:20px;text-align:center;">No quotes saved yet.</div>';
  const f = (_savedQuoteFilter||'').trim().toLowerCase();
  const list = !f ? QUOTES : QUOTES.filter(q => {
    const hay = `${q.project||''} ${q.customer||''} ${q.contact||''} ${q.id||''} ${q.total||''} ${q.notes||''}`.toLowerCase();
    return hay.includes(f);
  });
  if (!list.length) return `<div style="color:var(--text-3);font-size:13px;padding:20px;text-align:center;">No matches for "${esc(_savedQuoteFilter)}".</div>`;
  return list.map(q=>`<div style="padding:11px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:9px;display:flex;align-items:center;gap:10px;"><div style="flex:1;cursor:pointer;" onclick="CQ=QUOTES.find(x=>x.id==='${q.id}');LI=CQ.lineItems.length?CQ.lineItems.map(l=>({...l})):[nLI()];closeModal();goTo('quotes')"><div style="font-weight:600;font-size:14px;">${esc(q.project)}</div><div class="muted sm">${esc(q.customer)} · ${q.date} · ${q.id}</div></div><div class="mono" style="font-size:16px;font-weight:700;color:var(--green);">$${q.total.toFixed(2)}</div><button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="event.stopPropagation();emailQuote('${q.id}')" title="Open mail draft with quote summary">✉ Email</button><button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="event.stopPropagation();duplicateQuote('${q.id}')" title="Clone line items into a new quote">⎘ Dup</button>${typeof createDealFromQuote==='function'?`<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="event.stopPropagation();createDealFromQuote('${q._uuid||q.id}')">+ Deal</button>`:''}${(q.lineItems&&q.lineItems.length&&typeof createPOFromQuote==='function')?`<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="event.stopPropagation();createPOFromQuote('${q._uuid||q.id}')">+ PO</button>`:''}${typeof createJobFromQuote==='function'?`<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="event.stopPropagation();createJobFromQuote('${q._uuid||q.id}')">+ Job</button>`:''}<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="event.stopPropagation();deleteQ('${q.id}')">Delete</button></div>`).join('');
}

// emailQuote — open the user's mail client with a draft addressed to the
// quote's customer (if we can find an email on the CRM record), pre-filled
// with subject + body summarizing the quote. Common follow-up workflow.
function emailQuote(quoteId) {
  const q = QUOTES.find(x => x.id === quoteId);
  if (!q) { toast('Quote not found','err'); return; }
  // Look up customer email via FK first, name match as fallback.
  let email = '';
  if (typeof CUSTOMERS !== 'undefined' && Array.isArray(CUSTOMERS) && q.customer) {
    const cust = CUSTOMERS.find(c => (q.customer_id && c.id === q.customer_id)
      || (c.name||'').toLowerCase().trim() === q.customer.toLowerCase().trim());
    if (cust && cust.email) email = cust.email;
  }
  const lines = (q.lineItems||[]).filter(l => l.qty > 0 || l.price > 0);
  const subject = `Quote ${q.id} — ${q.project||'Lighting'}`;
  const bodyLines = [
    `Hi${q.contact?' '+q.contact.split(' ')[0]:''},`,
    '',
    `Here's the quote for ${q.project || 'your project'}:`,
    '',
    ...lines.slice(0, 50).map(l => `  • ${l.part||'—'} · ${l.desc||''} — ${l.qty} @ $${Number(l.price||0).toFixed(2)}  =  $${(Number(l.qty||0)*Number(l.price||0)).toFixed(2)}`),
    ...(lines.length > 50 ? [`  …and ${lines.length-50} more line items (see attached PDF)`] : []),
    '',
    `Total: $${Number(q.total||0).toFixed(2)}`,
    '',
    'Let me know if anything needs adjusting.',
    '',
    'Thanks,',
    (CU?.name || 'Accent Lighting Inc.')
  ];
  const body = bodyLines.join('\n');
  const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
  if (typeof sbAuditLog==='function') sbAuditLog('quote_email','quotes',{quote_id: quoteId, customer_email: email||null});
}

// ── CSV EXPORT (Windward-ready) ──
function exportQuoteCSV() {
  const flagged = LI.filter(l=>l.status==='flagged');
  if (flagged.length) {
    if (!confirm(`${flagged.length} row${flagged.length>1?'s are':' is'} still flagged. Export anyway? (flagged rows will be included with a flag note)`)) return;
  }
  const unapproved = LI.filter(l=>l.status==='pending');
  if (unapproved.length) {
    if (!confirm(`${unapproved.length} row${unapproved.length>1?'s have':' has'} not been approved. Export anyway?`)) return;
  }
  const proj = $('q-pr')?.value||CQ?.project||'Quote';
  const cust = $('q-cu')?.value||CQ?.customer||'';
  const addr = $('q-addr')?.value||CQ?.address||'';
  const date = new Date().toLocaleDateString('en-US',{year:'numeric',month:'2-digit',day:'2-digit'});
  const rows = [
    ['Quote Number','Customer','Project','Ship To','Date',''],
    [CQ?.id||('QT-'+String(QUOTE_ID).padStart(4,'0')), cust, proj, addr, date, ''],
    [''],
    ['Part Number','Description','Qty','Unit Price','Ext Price','Category','Approval Status','Flag Note']
  ];
  LI.forEach(l => {
    rows.push([
      l.part||'',
      l.desc||'',
      l.qty,
      l.price.toFixed(2),
      (l.qty*l.price).toFixed(2),
      l.cat||'',
      l.status||'pending',
      l.flag||''
    ]);
  });
  const sub = LI.reduce((s,l)=>s+l.qty*l.price,0);
  rows.push(['','','','SUBTOTAL',sub.toFixed(2),'','','']);
  rows.push(['','','','FREIGHT','TBD — verify with carrier','','','🚩 Flag: confirm freight before finalizing']);
  rows.push(['','','','TAX','TBD — verify exempt status','','','🚩 Flag: confirm tax exempt cert on file']);
  const filename = `Quote_${(proj||'project').replace(/\s+/g,'_')}_${date.replace(/\//g,'-')}.csv`;
  const n = csvDownload(rows, filename);
  if (n > 0) toast(`CSV exported (${n-6} line items)`, 'ok');
}

// ── PDF PRINT ──
function printQ() {
  const proj=$('q-pr')?.value||'Quote',cust=$('q-cu')?.value||'',addr=$('q-addr')?.value||'';
  const total=LI.reduce((s,l)=>s+l.qty*l.price,0);
  const qid=CQ?CQ.id:'QT-'+String(QUOTE_ID).padStart(4,'0');
  const date=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const flagged=LI.filter(l=>l.status==='flagged');
  const rows=LI.filter(l=>l.desc||l.price>0).map(l=>{
    const flagNote=l.flag?`<div style="font-size:10px;color:#d97706;">⚠ ${esc(l.flag)}</div>`:'';
    const approvedBadge=l.status==='approved'?`<span style="color:#16a34a;font-size:10px;"> ✓</span>`:'';
    return `<tr><td style="padding:9px 11px;border-bottom:1px solid #eee;font-family:'DM Mono',monospace;font-size:11px;">${esc(l.part||'—')}</td><td style="padding:9px 11px;border-bottom:1px solid #eee;">${esc(l.desc||'—')}${approvedBadge}${flagNote}</td><td style="padding:9px 11px;border-bottom:1px solid #eee;text-align:center;">${l.qty}</td><td style="padding:9px 11px;border-bottom:1px solid #eee;text-align:right;">$${l.price.toFixed(2)}</td><td style="padding:9px 11px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">$${(l.qty*l.price).toFixed(2)}</td></tr>`;
  }).join('');
  const flagBlock=flagged.length?`<div style="margin-top:22px;padding:14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;"><div style="font-weight:700;color:#d97706;margin-bottom:6px;">⚠ ${flagged.length} Flagged Item${flagged.length>1?'s':''} — Requires Review Before Order</div>${flagged.map(l=>`<div style="font-size:12px;color:#92400e;padding:2px 0;">• ${esc(l.desc||l.part||'Unknown')}: ${esc(l.flag||'Flagged')}</div>`).join('')}</div>`:' ';
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Quote ${qid}</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"><style>body{font-family:'Outfit',sans-serif;margin:0;padding:40px;color:#1a1a1a;max-width:860px;margin:0 auto;line-height:1.4;}.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #ed1c24;margin-bottom:26px;}.co{font-size:22px;font-weight:700;}.acc{color:#ed1c24;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th{background:#f4f4f2;padding:9px 11px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555;border-bottom:1px solid #ddd;}td{padding:9px 11px;border-bottom:1px solid #eee;font-size:13px;}.tr-tot{background:#1a1a1a;color:#fff;}.tr-tot td{padding:13px 11px;font-family:'DM Mono',monospace;font-size:17px;font-weight:700;border:none;}.foot{margin-top:44px;padding-top:18px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;}@media print{.no-print{display:none;}}</style></head><body>
  <div class="hdr"><div><div class="co">Accent<span class="acc">OS</span></div><div style="font-size:13px;color:#555;">Accent Lighting Inc. · 10322 E. Stonegate Ln. Ste 100 · Wichita, KS 67206 · (316) 636-1278</div></div><div style="text-align:right;"><div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:#ed1c24;">${qid}</div><div style="font-size:13px;color:#555;">${date}</div><div style="margin-top:4px;padding:3px 9px;background:#ed1c24;color:#fff;border-radius:4px;font-weight:600;font-size:12px;display:inline-block;">COMMERCIAL QUOTE</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:26px;"><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#999;margin-bottom:4px;">Bill To</div><div style="font-size:15px;font-weight:600;">${esc(cust||'—')}</div><div style="color:#555;font-size:13px;">${esc($('q-co')?.value||'')}</div></div><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#999;margin-bottom:4px;">Ship To / Project</div><div style="font-size:15px;font-weight:600;">${esc(proj)}</div><div style="color:#555;font-size:13px;white-space:pre-line;">${esc(addr)}</div></div></div>
  <table><thead><tr><th style="width:13%;">Part #</th><th>Description</th><th style="text-align:center;width:8%;">Qty</th><th style="text-align:right;width:10%;">Unit Price</th><th style="text-align:right;width:11%;">Total</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="tr-tot"><td colspan="4">SUBTOTAL</td><td style="text-align:right;">$${total.toFixed(2)}</td></tr><tr style="background:#f4f4f2;"><td colspan="4" style="padding:9px 11px;">Freight</td><td style="padding:9px 11px;text-align:right;font-family:'DM Mono',monospace;color:#d97706;">TBD 🚩</td></tr><tr style="background:#f4f4f2;"><td colspan="4" style="padding:9px 11px;">Tax</td><td style="padding:9px 11px;text-align:right;font-family:'DM Mono',monospace;color:#d97706;">Verify exempt 🚩</td></tr></tfoot></table>
  ${flagBlock}
  ${$('q-no')?.value?`<div style="margin-top:22px;padding:14px;background:#f8f8f6;border-radius:8px;font-size:12px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#999;margin-bottom:4px;">Notes</div><div style="white-space:pre-wrap;">${esc($('q-no').value)}</div></div>`:''}
  <div class="foot">Accent Lighting Inc. · Commercial Lighting Solutions · Wichita, KS · Valid 30 days · www.accentlightinginc.com</div>
  <div class="no-print" style="margin-top:22px;text-align:center;"><button onclick="window.print()" style="background:#ed1c24;color:#fff;border:none;padding:11px 30px;border-radius:6px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Print / Save as PDF</button></div>
  </body></html>`);w.document.close();
}

// legacy stub — replaced by aiParseNotes
async function aiSummary(){ aiParseNotes(); }



// ══════════════════════════════════════════════════════════

// ── QUOTE PERSISTENCE (Track 1.2, quotes + quote_lines tables) ──

async function sbLoadQuotes(){
  if(!sbConfigured()) return false;
  try{
    const headers = await sbFetch('/quotes?select=id,number,customer_id,customer_name,project_name,status,subtotal,total,notes,created_at&order=created_at.desc&limit=500');
    if(!Array.isArray(headers)) return 0;
    if(!headers.length){ QUOTES=[]; return 0; }
    const ids = headers.map(h => h.id);
    const linesUrl = `/quote_lines?select=quote_id,line_no,vendor_id,vendor_name,description,qty,unit_price,ext_price,notes&quote_id=in.(${ids.join(',')})`;
    const lines = await sbFetch(linesUrl);
    const linesByQuote = {};
    (lines||[]).forEach(l => {
      (linesByQuote[l.quote_id] = linesByQuote[l.quote_id] || []).push(l);
    });
    QUOTES = headers.map(h => {
      let extra = {};
      try { extra = h.notes ? JSON.parse(h.notes) : {}; } catch { extra = {}; }
      const li = (linesByQuote[h.id]||[]).sort((a,b)=>a.line_no-b.line_no).map(l => ({
        id: l.line_no, desc: l.description || '', qty: Number(l.qty)||0,
        price: Number(l.unit_price)||0, cat: l.notes || 'LED Fixtures',
        vendorId: l.vendor_id, vendorName: l.vendor_name
      }));
      return {
        id: h.number || ('QT-' + String(QUOTE_ID++).padStart(4,'0')),
        _uuid: h.id,
        date: h.created_at ? new Date(h.created_at).toLocaleDateString() : '',
        customer: h.customer_name || '',
        customer_id: h.customer_id || null,
        contact: extra.contact || '',
        project: h.project_name || '',
        type: extra.type || '',
        sqft: extra.sqft || '',
        budget: extra.budget || '',
        notes: extra.note || '',
        lineItems: li,
        total: Number(h.total)||0
      };
    });
    // Bump QUOTE_ID past the highest seen number
    QUOTES.forEach(q => {
      const m = /QT-(\d+)/.exec(q.id);
      if(m){ const n = parseInt(m[1],10); if(n >= QUOTE_ID) QUOTE_ID = n+1; }
    });
    console.log(`[quotes] Loaded ${QUOTES.length} quotes`);
    return QUOTES.length;
  }catch(e){ console.warn('[sb] Load quotes failed:', e.message); return false; }
}

async function sbSaveQuote(q){
  if(!sbConfigured()) return false;
  try{
    const subtotal = (q.lineItems||[]).reduce((s,l)=>s + (l.qty*l.price), 0);
    const extra = {contact: q.contact||'', type: q.type||'', sqft: q.sqft||'', budget: q.budget||'', note: q.notes||''};
    // Resolve customer FK via shared helper (BI 1.4 cleanup). See js/customers.js.
    let custId = q.customer_id || (q.customer && typeof resolveCustomerByName === 'function'
      ? await resolveCustomerByName(q.customer, 'quote ' + (q.id || ''))
      : null);
    const headerBody = {
      number: q.id,
      customer_id: custId,
      customer_name: q.customer || null,
      project_name: q.project || null,
      status: 'draft',
      subtotal, tax: 0, total: q.total || subtotal,
      notes: JSON.stringify(extra)
    };
    // Upsert header by number; need the UUID back to write lines.
    const headerRes = await sbFetch('/quotes?on_conflict=number', {
      method: 'POST',
      headers: {'Prefer':'resolution=merge-duplicates,return=representation'},
      body: JSON.stringify(headerBody)
    });
    const uuid = Array.isArray(headerRes) && headerRes[0] ? headerRes[0].id : q._uuid;
    if(!uuid) throw new Error('No UUID returned from quotes upsert');
    q._uuid = uuid;
    // Replace all line items: delete then insert.
    await sbFetch(`/quote_lines?quote_id=eq.${uuid}`, {
      method: 'DELETE',
      headers: {'Prefer':'return=minimal'}
    });
    const lineRows = (q.lineItems||[]).map((l,i) => ({
      quote_id: uuid,
      line_no: i + 1,
      vendor_id: l.vendorId || null,
      vendor_name: l.vendor_name || null,
      description: l.desc || null,
      qty: Number(l.qty)||0,
      unit_price: Number(l.price)||0,
      ext_price: (Number(l.qty)||0) * (Number(l.price)||0),
      notes: l.cat || null
    }));
    if(lineRows.length){
      await sbFetch('/quote_lines', {
        method: 'POST',
        headers: {'Prefer':'return=minimal'},
        body: JSON.stringify(lineRows)
      });
    }
    return true;
  }catch(e){ console.warn('[sb] Save quote failed:', e.message); return false; }
}

async function sbDeleteQuote(numberId){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/quotes?number=eq.${encodeURIComponent(numberId)}`, {
      method: 'DELETE',
      headers: {'Prefer':'return=minimal'}
    });
    return true;
  }catch(e){ console.warn('[sb] Delete quote failed:', e.message); return false; }
}
