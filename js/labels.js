// ── 5.9 QR / BARCODE LABELING (label_batches table — see sql/M26_label_batches_schema.sql) ──
// Generates printable label sheets for warehouse bins, inventory SKUs, and showroom display tags.
// QR encoding uses api.qrserver.com (free, no API key, GET-based image URLs). For SKU data which
// is non-sensitive this is acceptable; future v2 can swap to a pinned local lib if needed.
//
// Two modes:
//   1. "from inventory" — pick SKUs from existing inventory_items (multi-select with filter)
//   2. "manual" — one entry per line in a textarea
// Each label = QR code + optional human-readable line above. Multiple sizes supported.
// Print uses window.print(); a print stylesheet is injected on the labels page.
register({ name: 'labels', provides: ['labels','LABEL_BATCHES'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

let LABEL_BATCHES = [];
let lblMode = 'manual';     // 'manual' | 'inventory'
let lblItems = [];          // array of {value, caption}
let lblSelected = new Set();
let lblSize = 'medium';     // 'small' | 'medium' | 'large'
let lblCols = 4;
let lblShowText = true;

async function sbLoadLabelBatches(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/label_batches?select=id,name,mode,items,size,cols,show_text,created_at,created_by&order=created_at.desc&limit=100');
    LABEL_BATCHES = Array.isArray(rows) ? rows : [];
    console.log(`[label_batches] Loaded ${LABEL_BATCHES.length} batches`);
    return LABEL_BATCHES.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[label_batches] table not yet created — run sql/M26_label_batches_schema.sql');
    } else {
      console.warn('[sb] Load label_batches failed:', e.message);
    }
    return false;
  }
}

async function sbSaveLabelBatch(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      name: rec.name,
      mode: rec.mode,
      items: rec.items,
      size: rec.size,
      cols: Number(rec.cols)||4,
      show_text: !!rec.show_text,
      created_by: (CU?.user_id) || null
    };
    const headers = {'Prefer':'return=representation'};
    const res = await sbFetch('/label_batches', {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save label_batch failed:', e.message); return false; }
}

function labels(el, act){
  act.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="openLabelBatchHistory()">History</button>
    <button class="btn btn-outline btn-sm" onclick="saveLabelBatch()">Save batch</button>
    <button class="btn btn-accent btn-sm" onclick="printLabels()">Print</button>
  `;
  renderLabels(el);
}

function renderLabels(el){
  // Inventory picker UI
  const invList = (typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) ? INVENTORY : [];
  const invSearch = (window._lblInvQ || '').toLowerCase();
  const invFiltered = invList.filter(r => {
    if(!invSearch) return true;
    const hay = `${r.sku||''} ${r.description||''} ${r.vendor_name||''}`.toLowerCase();
    return hay.includes(invSearch);
  }).slice(0, 200);

  // Build label preview from current state
  const previewItems = lblItems.slice(0, 100);   // cap to 100 per sheet for sanity

  const sizePx = {small: 130, medium: 180, large: 260}[lblSize] || 180;
  const sizeLabel = {small:'1.5"×1.5"', medium:'2"×2"', large:'3"×3"'}[lblSize];

  el.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Labels.</strong> QR codes generated via api.qrserver.com (free, no API key). SKU data is non-sensitive so this is acceptable for v1. To print: pick mode, select items, click <strong>Print</strong> — the browser print dialog opens with a hidden-chrome label sheet.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Mode</div><div class="stat-value" style="font-size:18px;">${lblMode==='inventory'?'From Inventory':'Manual'}</div><div class="stat-sub">Toggle below</div></div>
      <div class="card stat-card"><div class="stat-label">Items in batch</div><div class="stat-value">${lblItems.length}</div><div class="stat-sub">${lblItems.length>100?'(first 100 print)':'all will print'}</div></div>
      <div class="card stat-card"><div class="stat-label">Label size</div><div class="stat-value" style="font-size:18px;">${sizeLabel}</div><div class="stat-sub">${sizePx}px QR</div></div>
      <div class="card stat-card"><div class="stat-label">Columns / sheet</div><div class="stat-value">${lblCols}</div><div class="stat-sub">${Math.ceil(previewItems.length/lblCols)} row${Math.ceil(previewItems.length/lblCols)===1?'':'s'}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:340px 1fr;gap:14px;margin-bottom:14px;" class="lbl-no-print">
      <div class="card">
        <div class="card-hd"><span class="card-title">Source</span></div>
        <div style="padding:12px;">
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button class="btn btn-${lblMode==='manual'?'accent':'outline'} btn-sm" onclick="lblMode='manual';renderLabels($('pg-content'))">Manual entry</button>
            <button class="btn btn-${lblMode==='inventory'?'accent':'outline'} btn-sm" onclick="lblMode='inventory';renderLabels($('pg-content'))">From Inventory</button>
          </div>
          ${lblMode === 'manual' ? `
            <div class="fg"><label>One item per line · "value | caption" or just "value"</label>
              <textarea id="lbl-manual" rows="10" style="font-family:monospace;font-size:11px;" placeholder="HK-12345 | Hinkley Pendant
QZ-67890 | Quoizel Chandelier
PO-2026-001"></textarea>
            </div>
            <button class="btn btn-accent btn-sm" onclick="loadManualLabels()">Use these ${lblItems.length?'(replace current '+lblItems.length+')':''}</button>
          ` : `
            <div class="fg"><label>Search inventory</label>
              <input id="lbl-inv-q" placeholder="SKU / desc / vendor…" value="${esc(window._lblInvQ||'')}" oninput="window._lblInvQ=this.value;clearTimeout(window._lblInvDeb);window._lblInvDeb=setTimeout(()=>renderLabels($('pg-content')),250)" style="width:100%;padding:5px 8px;font-size:11px;">
            </div>
            <div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:5px;font-size:11px;">
              ${invList.length===0 ? '<div style="padding:14px;color:var(--text-3);text-align:center;">No inventory loaded. Import a CSV in Inventory tab first.</div>' : invFiltered.length===0 ? '<div style="padding:14px;color:var(--text-3);text-align:center;">No matches.</div>' : invFiltered.map(r => `
                <label style="display:flex;align-items:center;gap:8px;padding:5px 9px;cursor:pointer;border-bottom:1px solid var(--border-light);">
                  <input type="checkbox" value="${r.id}" ${lblSelected.has(r.id)?'checked':''} onchange="toggleLblSel('${r.id}', this.checked)">
                  <span class="mono fw6">${esc(r.sku||'')}</span>
                  <span style="flex:1;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.description||'')}</span>
                </label>
              `).join('')}
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;">
              <button class="btn btn-outline btn-sm" style="font-size:10px;" onclick="lblSelectAll(true)">Select shown</button>
              <button class="btn btn-outline btn-sm" style="font-size:10px;" onclick="lblSelectAll(false)">Clear</button>
              <button class="btn btn-accent btn-sm" style="font-size:10px;margin-left:auto;" onclick="loadInventoryLabels()">Use ${lblSelected.size} selected</button>
            </div>
          `}
        </div>
      </div>
      <div class="card">
        <div class="card-hd"><span class="card-title">Layout</span></div>
        <div style="padding:12px;">
          <div class="frow">
            <div class="fcol field"><label>Size</label>
              <select onchange="lblSize=this.value;renderLabels($('pg-content'))">
                ${['small','medium','large'].map(s=>`<option value="${s}" ${lblSize===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="fcol field"><label>Columns</label>
              <select onchange="lblCols=Number(this.value);renderLabels($('pg-content'))">
                ${[2,3,4,5,6].map(n=>`<option value="${n}" ${lblCols===n?'selected':''}>${n}</option>`).join('')}
              </select>
            </div>
            <div class="fcol field" style="display:flex;align-items:flex-end;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" ${lblShowText?'checked':''} onchange="lblShowText=this.checked;renderLabels($('pg-content'))"> Show text under QR</label></div>
          </div>
          <div class="muted sm" style="margin-top:8px;">Tip: when printing, set the printer to <strong>Actual size</strong> (not "Fit to page") so the QR codes scan reliably. Standard sheet labels (Avery 5160 etc.) require margin tuning per manufacturer.</div>
        </div>
      </div>
    </div>
    <div class="card lbl-print-area">
      <div class="card-hd lbl-no-print"><span class="card-title">Preview</span></div>
      <div id="lbl-sheet" style="padding:14px;background:#fff;color:#000;">
        ${previewItems.length === 0 ? '<div class="lbl-no-print" style="padding:40px;text-align:center;color:var(--text-3);">No items in batch. Pick items in the source panel to preview.</div>' : `
          <div style="display:grid;grid-template-columns:repeat(${lblCols},1fr);gap:8px;">
            ${previewItems.map(item => {
              const data = encodeURIComponent(item.value || '');
              const url = `https://api.qrserver.com/v1/create-qr-code/?data=${data}&size=${sizePx}x${sizePx}&margin=4`;
              return `<div style="display:flex;flex-direction:column;align-items:center;padding:6px;border:1px dashed #ccc;break-inside:avoid;">
                <img src="${url}" alt="${esc(item.value)}" style="width:${sizePx}px;height:${sizePx}px;display:block;">
                ${lblShowText ? `<div style="margin-top:4px;font-family:monospace;font-size:${lblSize==='small'?9:lblSize==='medium'?11:13}px;text-align:center;line-height:1.2;color:#000;font-weight:600;">${esc(item.value)}</div>${item.caption?`<div style="font-size:${lblSize==='small'?8:lblSize==='medium'?9:11}px;color:#444;text-align:center;line-height:1.1;">${esc(item.caption)}</div>`:''}`:''}
              </div>`;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
  // Inject print stylesheet once
  if(!document.getElementById('lbl-print-style')){
    const style = document.createElement('style');
    style.id = 'lbl-print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        .lbl-print-area, .lbl-print-area * { visibility: visible !important; }
        .lbl-print-area { position: absolute !important; left: 0; top: 0; width: 100%; }
        .lbl-no-print { display: none !important; }
        .card-hd { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }
}

function toggleLblSel(id, checked){
  if(checked) lblSelected.add(id); else lblSelected.delete(id);
}

function lblSelectAll(on){
  if(!on){ lblSelected.clear(); renderLabels($('pg-content')); return; }
  const invList = (typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) ? INVENTORY : [];
  const invSearch = (window._lblInvQ || '').toLowerCase();
  const invFiltered = invList.filter(r => {
    if(!invSearch) return true;
    const hay = `${r.sku||''} ${r.description||''} ${r.vendor_name||''}`.toLowerCase();
    return hay.includes(invSearch);
  }).slice(0, 200);
  invFiltered.forEach(r => lblSelected.add(r.id));
  renderLabels($('pg-content'));
}

function loadManualLabels(){
  const text = $('lbl-manual')?.value || '';
  const parsed = text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [value, ...rest] = line.split('|').map(s => s.trim());
    return {value, caption: rest.join(' | ') || ''};
  }).filter(x => x.value);
  if(!parsed.length){ toast('No valid lines','err'); return; }
  lblItems = parsed;
  renderLabels($('pg-content'));
  toast(`Loaded ${parsed.length} label${parsed.length===1?'':'s'}`,'ok');
}

function loadInventoryLabels(){
  const invList = (typeof INVENTORY !== 'undefined' && Array.isArray(INVENTORY)) ? INVENTORY : [];
  const items = [...lblSelected].map(id => {
    const r = invList.find(x => x.id === id);
    if(!r) return null;
    return {value: r.sku || r.id, caption: r.description || ''};
  }).filter(Boolean);
  if(!items.length){ toast('No items selected','err'); return; }
  lblItems = items;
  renderLabels($('pg-content'));
  toast(`Loaded ${items.length} label${items.length===1?'':'s'} from inventory`,'ok');
}

function printLabels(){
  if(!lblItems.length){ toast('No items to print — pick a source first','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog('labels_print', 'labels', {item_count: lblItems.length, mode: lblMode, size: lblSize});
  setTimeout(() => window.print(), 50);
}

async function saveLabelBatch(){
  if(!lblItems.length){ toast('No items in batch','err'); return; }
  const name = prompt('Batch name (optional)','') || `Batch ${new Date().toLocaleDateString()}`;
  const rec = {name, mode: lblMode, items: lblItems, size: lblSize, cols: lblCols, show_text: lblShowText};
  const saved = await sbSaveLabelBatch(rec);
  if(!saved){ toast('Save failed — table may not exist (run M26 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id) LABEL_BATCHES.unshift(saved);
  if(typeof sbAuditLog==='function') sbAuditLog('labels_batch_save', 'labels', {batch_id: saved?.id, name, item_count: lblItems.length});
  toast(`Saved batch "${name}"`,'ok');
}

function openLabelBatchHistory(){
  const list = LABEL_BATCHES;
  openModal('Label Batch History', `
    ${list.length === 0 ? '<div style="padding:36px;text-align:center;color:var(--text-3);">No saved batches yet.</div>' : `
      <div style="max-height:400px;overflow-y:auto;">
        ${list.map(b => `
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="loadBatchFromHistory('${b.id}');closeModal();">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:12px;">${esc(b.name||'(unnamed)')}</div>
              <div class="muted sm">${(b.items||[]).length} items · ${esc(b.size||'medium')} · ${b.cols||4} cols · ${b.created_at?new Date(b.created_at).toLocaleDateString():''}</div>
            </div>
            <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(b.mode||'manual')}</span>
          </div>
        `).join('')}
      </div>
    `}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
    </div>
  `);
}

function loadBatchFromHistory(batchId){
  const b = LABEL_BATCHES.find(x => x.id === batchId);
  if(!b) return;
  lblMode = b.mode || 'manual';
  lblItems = b.items || [];
  lblSize = b.size || 'medium';
  lblCols = b.cols || 4;
  lblShowText = b.show_text !== false;
  renderLabels($('pg-content'));
  toast(`Loaded batch "${b.name}"`,'ok');
}
