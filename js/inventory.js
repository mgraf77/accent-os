// ── 5.3 INVENTORY MODULE — CSV phase 1 (inventory_items table — see sql/M22_inventory_schema.sql) ──
// Live Windward integration arrives in Track 6.11 once M03 + M10 land. Until then,
// this module accepts CSV imports (paste or file upload) and writes to inventory_items.
let INVENTORY = [];
let invFilter = {q:'', vendor:'', lowOnly:false, location:''};

async function sbLoadInventory(){
  if(!sbConfigured()) return false;
  try{
    const PAGE = 1000;
    let offset = 0, all = [];
    while(true){
      const batch = await sbFetch(`/inventory_items?select=id,vendor_id,vendor_name,sku,upc,description,category,qty_on_hand,qty_committed,qty_on_order,qty_available,location,bin,unit_cost,list_price,reorder_point,last_imported_at,import_source,notes,updated_at&order=updated_at.desc&offset=${offset}&limit=${PAGE}`);
      if(!Array.isArray(batch) || !batch.length) break;
      all = all.concat(batch);
      if(batch.length < PAGE) break;
      offset += PAGE;
    }
    INVENTORY = all;
    console.log(`[inventory_items] Loaded ${INVENTORY.length} rows`);
    return INVENTORY.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[inventory_items] table not yet created — run sql/M22_inventory_schema.sql');
    } else {
      console.warn('[sb] Load inventory_items failed:', e.message);
    }
    return false;
  }
}

async function sbBulkSaveInventory(rows){
  if(!sbConfigured() || !rows.length) return false;
  try{
    // POST array with Prefer resolution=merge-duplicates on (vendor_id, sku) unique
    const body = rows.map(r => ({
      vendor_id: r.vendor_id || null,
      vendor_name: r.vendor_name || null,
      sku: r.sku,
      upc: r.upc || null,
      description: r.description || null,
      category: r.category || null,
      qty_on_hand: r.qty_on_hand == null ? 0 : Number(r.qty_on_hand),
      qty_committed: r.qty_committed == null ? 0 : Number(r.qty_committed),
      qty_on_order: r.qty_on_order == null ? 0 : Number(r.qty_on_order),
      location: r.location || null,
      bin: r.bin || null,
      unit_cost: r.unit_cost == null || r.unit_cost === '' ? null : Number(r.unit_cost),
      list_price: r.list_price == null || r.list_price === '' ? null : Number(r.list_price),
      reorder_point: r.reorder_point == null || r.reorder_point === '' ? null : Number(r.reorder_point),
      import_source: r.import_source || 'csv',
      last_imported_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    const headers = {'Prefer':'resolution=merge-duplicates,return=representation'};
    const path = '/inventory_items?on_conflict=vendor_id,sku';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    return Array.isArray(res) ? res.length : true;
  }catch(e){ console.warn('[sb] Bulk save inventory failed:', e.message); return false; }
}

async function sbDeleteInventoryItem(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/inventory_items?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete inventory_item failed:', e.message); return false; }
}

// Single-row PATCH for inline edits (v6.10.43). Returns the updated row or false.
async function sbUpdateInventoryField(id, field, value){
  if(!sbConfigured()) return false;
  if(!id || !field) return false;
  const allowed = ['qty_on_hand','qty_committed','qty_on_order','reorder_point','unit_cost','list_price','bin','location'];
  if(!allowed.includes(field)) return false;
  try{
    const body = { [field]: value, updated_at: new Date().toISOString() };
    const res = await sbFetch(`/inventory_items?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {'Prefer':'return=representation'},
      body: JSON.stringify(body)
    });
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Update inventory field failed:', e.message); return false; }
}

function renderInventory(container) {
  // Stats
  const totalItems = INVENTORY.length;
  const totalQty = INVENTORY.reduce((s,r)=>s + (Number(r.qty_on_hand)||0), 0);
  const totalValue = INVENTORY.reduce((s,r)=>s + ((Number(r.qty_on_hand)||0) * (Number(r.unit_cost)||0)), 0);
  const lowStock = INVENTORY.filter(r => r.reorder_point != null && (Number(r.qty_available)||0) < Number(r.reorder_point)).length;
  const vendors = [...new Set(INVENTORY.map(r => r.vendor_name).filter(Boolean))].sort();
  const locations = [...new Set(INVENTORY.map(r => r.location).filter(Boolean))].sort();

  // Filter
  const q = (invFilter.q||'').toLowerCase();
  const filtered = INVENTORY.filter(r => {
    if(invFilter.vendor && r.vendor_name !== invFilter.vendor) return false;
    if(invFilter.location && r.location !== invFilter.location) return false;
    if(invFilter.lowOnly && !(r.reorder_point != null && (Number(r.qty_available)||0) < Number(r.reorder_point))) return false;
    if(q){
      const hay = `${r.sku||''} ${r.upc||''} ${r.description||''} ${r.vendor_name||''} ${r.bin||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).slice(0, 1000);   // cap render to 1000 rows for perf

  container.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>CSV Import phase.</strong> Live Windward sync ships with Track 6.11 (blocked on M03 + M10). Until then, paste or upload a CSV — we map by header name, vendor_id matches against existing vendors, and unique key is (vendor_id, sku) with upsert.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Tracked SKUs</div><div class="stat-value">${totalItems.toLocaleString()}</div><div class="stat-sub">${vendors.length} vendor${vendors.length===1?'':'s'} · ${locations.length} location${locations.length===1?'':'s'}</div></div>
      <div class="card stat-card"><div class="stat-label">Units On Hand</div><div class="stat-value">${Math.round(totalQty).toLocaleString()}</div><div class="stat-sub">Sum across all SKUs</div></div>
      <div class="card stat-card"><div class="stat-label">Inventory Value</div><div class="stat-value">$${(totalValue/1000).toFixed(1)}K</div><div class="stat-sub">qty × unit_cost</div></div>
      <div class="card stat-card"${lowStock?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Below Reorder</div><div class="stat-value" style="color:${lowStock?'var(--accent)':'var(--text)'};">${lowStock}</div><div class="stat-sub">qty_available &lt; reorder_point</div></div>
    </div>
    <div class="card mb16">
      <div class="card-hd"><span class="card-title">Import CSV</span></div>
      <div style="padding:14px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;">
        <input type="file" id="inv-file" accept=".csv,text/csv" style="font-size:12px;" onchange="onInvFilePick(this)">
        <button class="btn btn-outline btn-sm" onclick="openInvCsvPaste()">Or paste CSV</button>
        <button class="btn btn-outline btn-sm" onclick="downloadInvCsvTemplate()">Download template</button>
        <span style="margin-left:auto;color:var(--text-3);">Headers: sku, vendor_name (or vendor_id), description, qty_on_hand, qty_committed, location, bin, unit_cost, list_price, reorder_point, upc, category, notes</span>
      </div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Inventory · ${filtered.length}${filtered.length!==totalItems?' of '+totalItems:''}${INVENTORY.length>=1000?' (showing first 1000)':''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="inv-q" placeholder="Search SKU / desc / vendor / bin…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(invFilter.q)}" oninput="invFilter.q=this.value;clearTimeout(window._invDeb);window._invDeb=setTimeout(()=>renderInventory($('vendor-section-content')),250)">
          <select style="padding:6px 8px;font-size:12px;" onchange="invFilter.vendor=this.value;renderInventory($('vendor-section-content'))">
            <option value="">All vendors</option>
            ${vendors.map(v=>`<option value="${esc(v)}" ${invFilter.vendor===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select>
          ${locations.length ? `<select style="padding:6px 8px;font-size:12px;" onchange="invFilter.location=this.value;renderInventory($('vendor-section-content'))">
            <option value="">All locations</option>
            ${locations.map(l=>`<option value="${esc(l)}" ${invFilter.location===l?'selected':''}>${esc(l)}</option>`).join('')}
          </select>` : ''}
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" ${invFilter.lowOnly?'checked':''} onchange="invFilter.lowOnly=this.checked;renderInventory($('vendor-section-content'))"> Low stock only</label>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 460px);overflow-y:auto;">
        <table>
          <thead><tr><th>SKU</th><th>Vendor</th><th>Description</th><th>On Hand</th><th>Avail</th><th>Reorder</th><th>Location</th><th>Cost</th><th>List</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="10" style="text-align:center;padding:36px;color:var(--text-3);">${totalItems===0?'No inventory yet. Import a CSV above (template button shows the header schema).':'No SKUs match the current filter.'}</td></tr>` : filtered.map(r => {
              const qoh = Number(r.qty_on_hand)||0;
              const avail = Number(r.qty_available)||0;
              const reorder = r.reorder_point != null ? Number(r.reorder_point) : null;
              const isLow = reorder != null && avail < reorder;
              const canEditQty = CU && ['Owner','Admin','Manager','Warehouse'].includes(CU.role);
              const qtyCell = canEditQty
                ? `<td class="mono sm" style="padding:2px 6px;"><input type="number" step="1" value="${qoh}" data-id="${r.id}" data-orig="${qoh}" onfocus="this.select();this.style.background='var(--surface)';this.style.borderColor='var(--accent)';" onblur="commitInventoryQty(this)" onkeydown="if(event.key==='Enter'){this.blur();}else if(event.key==='Escape'){this.value=this.dataset.orig;this.blur();}" style="width:64px;border:1px solid transparent;background:transparent;padding:4px 6px;font-family:inherit;font-size:13px;text-align:right;border-radius:4px;" title="Click to edit qty on hand"></td>`
                : `<td class="mono sm">${qoh}</td>`;
              return `<tr style="${isLow?'background:rgba(239,68,68,0.06);':''}" data-row-id="${r.id}">
                <td class="mono fw6 sm">${esc(r.sku||'')}</td>
                <td class="sm">${esc(r.vendor_name||'—')}</td>
                <td class="sm" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.description||'')}">${esc(r.description||'')}</td>
                ${qtyCell}
                <td class="mono sm" data-avail-for="${r.id}" style="${isLow?'color:var(--accent);font-weight:700;':''}">${avail}</td>
                <td class="mono sm">${reorder!=null?reorder:'—'}</td>
                <td class="sm">${esc(r.location||'')}${r.bin?' · '+esc(r.bin):''}</td>
                <td class="mono sm">${r.unit_cost!=null?'$'+Number(r.unit_cost).toFixed(2):'—'}</td>
                <td class="mono sm">${r.list_price!=null?'$'+Number(r.list_price).toFixed(2):'—'}</td>
                <td><button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="deleteInventoryItem('${r.id}')">×</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function downloadInvCsvTemplate(){
  const rows = [
    ['sku','vendor_name','description','qty_on_hand','qty_committed','qty_on_order','location','bin','unit_cost','list_price','reorder_point','upc','category','notes'],
    ['SAMPLE-001','Hinkley Lighting','3-Light Pendant - Brushed Nickel','8','2','4','Main Warehouse','A12-B3','124.50','249.00','5','012345678901','Pendants','Initial seed']
  ];
  csvDownload(rows, `inventory_template_${new Date().toISOString().slice(0,10)}.csv`);
}

function openInvCsvPaste(){
  openModal('Paste CSV', `
    <div class="fg"><label>Paste CSV content (first row is headers)</label><textarea id="inv-csv-paste" rows="12" style="font-family:monospace;font-size:11px;" placeholder="sku,vendor_name,description,qty_on_hand,...
SKU-001,Vendor Name,Widget,10,..."></textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="processInvCsvText($('inv-csv-paste').value)">Parse & Preview</button>
    </div>
  `);
}

function onInvFilePick(input){
  const f = input.files && input.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e => processInvCsvText(e.target.result || '');
  reader.onerror = () => toast('File read failed','err');
  reader.readAsText(f);
}

function parseCsv(text){
  // Minimal RFC-4180 parser: handles quoted fields, commas inside quotes, escaped quotes.
  const out = [];
  let row = [], cell = '', inQuote = false;
  for(let i=0; i<text.length; i++){
    const c = text[i];
    if(inQuote){
      if(c === '"'){
        if(text[i+1] === '"'){ cell += '"'; i++; } else inQuote = false;
      } else cell += c;
    } else {
      if(c === '"') inQuote = true;
      else if(c === ','){ row.push(cell); cell = ''; }
      else if(c === '\n' || c === '\r'){
        if(c === '\r' && text[i+1] === '\n') i++;
        row.push(cell); cell = '';
        if(row.some(x => x !== '')) out.push(row);
        row = [];
      } else cell += c;
    }
  }
  if(cell !== '' || row.length){ row.push(cell); if(row.some(x => x !== '')) out.push(row); }
  return out;
}

function processInvCsvText(text){
  if(!text || !text.trim()){ toast('CSV is empty','err'); return; }
  const rows = parseCsv(text);
  if(rows.length < 2){ toast('CSV has no data rows','err'); return; }
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
  // Map common variations
  const aliasMap = {
    'qty':'qty_on_hand', 'qty_on_hand':'qty_on_hand', 'on_hand':'qty_on_hand', 'available':'qty_available',
    'qty_committed':'qty_committed', 'committed':'qty_committed', 'allocated':'qty_committed',
    'qty_on_order':'qty_on_order', 'on_order':'qty_on_order',
    'description':'description', 'desc':'description', 'name':'description',
    'cost':'unit_cost', 'unit_cost':'unit_cost', 'cost_each':'unit_cost',
    'price':'list_price', 'list_price':'list_price', 'msrp':'list_price', 'retail':'list_price',
    'reorder':'reorder_point', 'reorder_point':'reorder_point', 'min':'reorder_point', 'min_qty':'reorder_point',
    'sku':'sku', 'item':'sku', 'item_number':'sku', 'item_id':'sku', 'part':'sku', 'part_number':'sku',
    'vendor':'vendor_name', 'vendor_name':'vendor_name', 'manufacturer':'vendor_name', 'mfg':'vendor_name', 'brand':'vendor_name',
    'vendor_id':'vendor_id',
    'location':'location', 'warehouse':'location', 'wh':'location',
    'bin':'bin', 'bin_location':'bin', 'shelf':'bin',
    'upc':'upc', 'gtin':'upc', 'barcode':'upc',
    'category':'category', 'cat':'category', 'class':'category',
    'notes':'notes', 'note':'notes', 'comment':'notes'
  };
  const colMap = headers.map(h => aliasMap[h] || h);
  if(!colMap.includes('sku')){ toast('CSV must include a "sku" column','err'); return; }

  // Index VD by lower-cased name for vendor_id resolution
  const vdByName = {};
  if(typeof VD !== 'undefined') VD.forEach(v => { if(v && v.n) vdByName[v.n.toLowerCase()] = v.id; });

  const parsed = [];
  let unmappedVendors = new Set();
  for(let i=1; i<rows.length; i++){
    const r = rows[i];
    if(r.every(x => !x || !String(x).trim())) continue;   // skip blank
    const obj = {};
    colMap.forEach((c, idx) => { if(c) obj[c] = (r[idx]||'').trim(); });
    if(!obj.sku){ continue; }
    if(!obj.vendor_id && obj.vendor_name){
      const id = vdByName[obj.vendor_name.toLowerCase()];
      if(id) obj.vendor_id = String(id);
      else unmappedVendors.add(obj.vendor_name);
    }
    parsed.push(obj);
  }

  if(!parsed.length){ toast('No valid rows after parsing','err'); return; }

  const preview = parsed.slice(0, 10);
  const summary = `<div style="font-size:12px;margin-bottom:10px;"><strong>${parsed.length}</strong> row${parsed.length===1?'':'s'} parsed${unmappedVendors.size?` · <span style="color:var(--accent);">${unmappedVendors.size} unmapped vendor name${unmappedVendors.size===1?'':'s'}: ${[...unmappedVendors].slice(0,3).map(esc).join(', ')}${unmappedVendors.size>3?'…':''}</span>`:''}</div>`;
  const tbl = `<div style="border:1px solid var(--border);border-radius:6px;max-height:300px;overflow:auto;"><table style="margin:0;font-size:11px;"><thead><tr><th>SKU</th><th>Vendor</th><th>Desc</th><th>Qty</th><th>Cost</th><th>List</th></tr></thead><tbody>${preview.map(p=>`<tr><td class="mono">${esc(p.sku||'')}</td><td>${esc(p.vendor_name||'')}${p.vendor_id?' <span class="muted sm">#'+esc(p.vendor_id)+'</span>':''}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.description||'')}</td><td class="mono">${esc(p.qty_on_hand||'')}</td><td class="mono">${esc(p.unit_cost||'')}</td><td class="mono">${esc(p.list_price||'')}</td></tr>`).join('')}</tbody></table></div>`;
  const more = parsed.length > 10 ? `<div class="muted sm" style="margin-top:6px;">…and ${parsed.length-10} more.</div>` : '';
  // Stash the parsed rows on window for the commit step
  window._invStaged = parsed;
  openModal('CSV Preview', `
    ${summary}${tbl}${more}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="commitInvCsv()">Import ${parsed.length} row${parsed.length===1?'':'s'}</button>
    </div>
  `);
}

async function commitInvCsv(){
  const staged = window._invStaged || [];
  if(!staged.length){ toast('Nothing to import','err'); return; }
  toast(`Importing ${staged.length} rows…`);
  // Tag each row's import_source
  staged.forEach(r => r.import_source = 'csv');
  const n = await sbBulkSaveInventory(staged);
  if(!n){ toast('Import failed — table may not exist (run M22 SQL)','err'); return; }
  if(typeof sbAuditLog==='function') sbAuditLog('inventory_import', 'inventory', {row_count: staged.length, source: 'csv'});
  await sbLoadInventory();
  delete window._invStaged;
  closeModal();
  renderInventory($('vendor-section-content'));
  toast(`Imported ${typeof n==='number'?n:staged.length} rows`,'ok');
}

async function deleteInventoryItem(id){
  if(!confirm('Delete this inventory row?')) return;
  await sbDeleteInventoryItem(id);
  INVENTORY = INVENTORY.filter(r => r.id !== id);
  if(typeof sbAuditLog==='function') sbAuditLog('inventory_delete', 'inventory', {item_id: id});
  renderInventory($('vendor-section-content'));
  toast('Item removed','ok');
}

// Inline qty edit (v6.10.43). Saves on blur if value changed; reverts and warns on failure.
async function commitInventoryQty(input){
  if(!input) return;
  const id = input.dataset.id;
  const orig = Number(input.dataset.orig)||0;
  const next = Number(input.value);
  // Restore the visual styling regardless of save outcome
  input.style.background = 'transparent';
  input.style.borderColor = 'transparent';
  if(isNaN(next) || next < 0){
    input.value = orig;
    toast('Invalid qty — reverted','warn');
    return;
  }
  if(next === orig) return;   // no-op
  // Optimistic UI: update INVENTORY in memory; recompute available + low-stock styling for the row
  const item = INVENTORY.find(r => r.id === id);
  if(!item){ input.value = orig; toast('Row not found','err'); return; }
  const prevQoh = item.qty_on_hand;
  const prevAvail = Number(item.qty_available)||0;
  item.qty_on_hand = next;
  // Available = on_hand - committed (best-effort; the DB-side trigger may compute differently)
  const committed = Number(item.qty_committed)||0;
  item.qty_available = next - committed;
  input.dataset.orig = String(next);
  // Update the available cell + row styling without a full re-render
  const tr = input.closest('tr');
  const availCell = tr?.querySelector(`[data-avail-for="${id}"]`);
  if(availCell){
    availCell.textContent = item.qty_available;
    const reorder = item.reorder_point != null ? Number(item.reorder_point) : null;
    const isLow = reorder != null && item.qty_available < reorder;
    if(tr) tr.style.background = isLow ? 'rgba(239,68,68,0.06)' : '';
    availCell.style.color = isLow ? 'var(--accent)' : '';
    availCell.style.fontWeight = isLow ? '700' : '';
  }
  // Persist
  const res = await sbUpdateInventoryField(id, 'qty_on_hand', next);
  if(res === false){
    // Revert
    item.qty_on_hand = prevQoh;
    item.qty_available = prevAvail;
    input.value = orig;
    input.dataset.orig = String(orig);
    if(availCell) availCell.textContent = prevAvail;
    toast('Save failed — qty reverted','err');
    return;
  }
  // Sync any DB-side computed fields (qty_available may be a generated column)
  if(res && typeof res === 'object'){
    if(res.qty_available != null) {
      item.qty_available = res.qty_available;
      if(availCell) availCell.textContent = res.qty_available;
    }
    item.updated_at = res.updated_at || item.updated_at;
  }
  if(typeof sbAuditLog==='function') sbAuditLog('inventory_qty_edit', 'inventory', {item_id: id, sku: item.sku, from: orig, to: next});
  toast(`Updated ${item.sku}: ${orig} → ${next}`, 'ok');
}
