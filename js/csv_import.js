// ── CSV IMPORT FLOW HELPER (v6.10.45) ─────────────────────
// Generalizes the CSV import pattern that was implemented inline 4 times
// (Inventory v6.10.9, Customers v6.10.39, Trade Partners v6.10.40, Jobs v6.10.41).
// Each new import is now ~30 LOC of config instead of ~150 LOC of boilerplate.
//
// Existing 4 imports remain inline and unchanged — refactoring them risks
// regressing working production code. The helper picks up at use case #5.
//
// USAGE:
//   csvImportFlow({
//     key: 'displays',                                   // identifier; drives handler names
//     label: 'Display',                                  // singular human label
//     labelPlural: 'Displays',                           // plural human label
//     templateName: 'showroom_displays_template',        // download filename prefix
//     templateRows: [['header1','header2'], [...]],      // first row = headers, rest = sample data
//     pasteHelp: 'name,vendor_name,location,...',        // placeholder text for paste modal
//     aliasMap: { 'name':'name', 'display_name':'name', ... },
//     requiredFields: ['name'],
//     normalizers: {                                     // per-field, called for each row
//       type: (val, ctx) => { /* return normalized; mutate ctx.unknownTypes if needed */ },
//       status: (val, ctx) => { ... },
//     },
//     postProcess: (obj, ctx) => { ... },                // per-row, after normalization (cross-field stuff)
//     dupCheck: (obj) => boolean,                        // optional; flags row as duplicate
//     previewColumns: [                                  // table columns in the preview modal
//       { label: 'Name', cell: r => esc(r.name) },
//       { label: 'Vendor', cell: r => esc(r.vendor_name) },
//     ],
//     bulkSave: async (rows) => number|false,            // module-supplied save function
//     onSuccess: async () => { /* reload + render */ },
//     auditEvent: 'displays_import',                     // sbAuditLog event name
//   });
//
// REGISTERS (window-scoped):
//   download<Cap>CsvTemplate(), open<Cap>CsvPaste(), on<Cap>FilePick(input),
//   process<Cap>CsvText(text), commit<Cap>Csv()
//   where <Cap> = capitalized config.key (e.g. key='displays' → openDisplaysCsvPaste)

function csvImportFlow(config){
  if(!config || !config.key) throw new Error('csvImportFlow requires a config.key');
  if(typeof config.bulkSave !== 'function') throw new Error('csvImportFlow requires a config.bulkSave function');
  const k = config.key;
  const cap = k.charAt(0).toUpperCase() + k.slice(1);
  const stageVar = `_${k}Staged`;
  const fileInputId = `${k}-file`;
  const pasteId = `${k}-csv-paste`;

  function downloadTemplate(){
    const rows = config.templateRows || [[]];
    const stamp = new Date().toISOString().slice(0,10);
    const filename = `${config.templateName || k}_${stamp}.csv`;
    if(typeof csvDownload === 'function'){
      csvDownload(rows, filename);
    } else {
      const csv = rows.map(r => r.map(x => /[",\n]/.test(String(x)) ? `"${String(x).replace(/"/g,'""')}"` : String(x)).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
    }
  }

  function openPaste(){
    const placeholder = config.pasteHelp ? esc(config.pasteHelp) : '';
    openModal(`
      <div class="modal-hd"><div class="modal-title">Paste CSV</div><button class="modal-x" onclick="closeModal()">×</button></div>
      <div class="modal-body">
        <div class="fg"><label>Paste CSV content (first row is headers)</label><textarea id="${pasteId}" rows="12" style="width:100%;font-family:monospace;font-size:11px;padding:8px;border:1px solid var(--border);border-radius:6px;" placeholder="${placeholder}"></textarea></div>
      </div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-accent" onclick="process${cap}CsvText($('${pasteId}').value)">Parse &amp; Preview</button>
      </div>
    `);
  }

  function onFile(input){
    const f = input.files && input.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = e => processText(e.target.result || '');
    reader.onerror = () => toast('File read failed','err');
    reader.readAsText(f);
  }

  function processText(text){
    if(!text || !text.trim()){ toast('CSV is empty','err'); return; }
    if(typeof parseCsv !== 'function'){ toast('parseCsv helper missing — load inventory.js first','err'); return; }
    const rows = parseCsv(text);
    if(rows.length < 2){ toast('CSV has no data rows','err'); return; }
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
    const colMap = headers.map(h => (config.aliasMap && config.aliasMap[h]) || h);
    const required = config.requiredFields || [];
    for(const req of required){
      if(!colMap.includes(req)){ toast(`CSV must include a "${req}" column`,'err'); return; }
    }

    const ctx = { trackers: {}, dupCount: 0 };   // shared across rows for unknown-value tracking
    const parsed = [];
    for(let i=1; i<rows.length; i++){
      const r = rows[i];
      if(r.every(x => !x || !String(x).trim())) continue;
      const obj = {};
      colMap.forEach((c, idx) => { if(c) obj[c] = (r[idx]||'').trim(); });
      // Skip rows missing any required field
      if(required.some(req => !obj[req])) continue;
      // Run per-field normalizers
      if(config.normalizers){
        for(const field in config.normalizers){
          if(obj[field] !== undefined){
            obj[field] = config.normalizers[field](obj[field], ctx, obj);
          }
        }
      }
      // Run per-row post-processor (cross-field stuff like ID resolution)
      if(typeof config.postProcess === 'function') config.postProcess(obj, ctx);
      // Duplicate flag
      if(typeof config.dupCheck === 'function'){
        obj._dup = !!config.dupCheck(obj);
        if(obj._dup) ctx.dupCount++;
      }
      parsed.push(obj);
    }

    if(!parsed.length){ toast('No valid rows after parsing','err'); return; }

    // Build preview summary
    const summaryParts = [`<strong>${parsed.length}</strong> row${parsed.length===1?'':'s'} parsed`];
    if(ctx.dupCount) summaryParts.push(`<span style="color:var(--accent);">${ctx.dupCount} likely duplicate${ctx.dupCount===1?'':'s'}</span>`);
    for(const tracker in ctx.trackers){
      const t = ctx.trackers[tracker];
      if(t.unknown && t.unknown.size){
        summaryParts.push(`<br><span style="color:var(--text-3);">${t.unknown.size} unknown ${tracker}${t.unknown.size===1?'':'s'} → "${t.fallback}": ${[...t.unknown].slice(0,3).map(esc).join(', ')}${t.unknown.size>3?'…':''}</span>`);
      }
      if(t.unmatched && t.unmatched.size){
        summaryParts.push(`<br><span style="color:var(--accent);">${t.unmatched.size} unmatched ${tracker}: ${[...t.unmatched].slice(0,3).map(esc).join(', ')}${t.unmatched.size>3?'…':''}</span>`);
      }
    }
    const summary = `<div style="font-size:12px;margin-bottom:10px;line-height:1.6;">${summaryParts.join(' · ').replace(/ · <br>/g, '<br>')}</div>`;

    // Preview table
    const preview = parsed.slice(0, 10);
    const cols = config.previewColumns || [];
    const tbl = `<div style="border:1px solid var(--border);border-radius:6px;max-height:300px;overflow:auto;">
      <table style="margin:0;font-size:11px;width:100%;">
        <thead><tr>${ctx.dupCount?'<th></th>':''}${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
        <tbody>${preview.map(p => `<tr style="${p._dup?'background:#fff7ed;':''}">${ctx.dupCount?`<td style="text-align:center;">${p._dup?'⚠':''}</td>`:''}${cols.map(c => `<td>${c.cell(p) ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`;
    const more = parsed.length > 10 ? `<div class="muted sm" style="margin-top:6px;">…and ${parsed.length-10} more.</div>` : '';

    window[stageVar] = parsed;
    openModal(`
      <div class="modal-hd"><div class="modal-title">${esc(config.label||k)} Import Preview</div><button class="modal-x" onclick="closeModal()">×</button></div>
      <div class="modal-body">${summary}${tbl}${more}</div>
      <div class="modal-ft">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-accent" onclick="commit${cap}Csv()">Import ${parsed.length} ${esc(config.label||k).toLowerCase()}${parsed.length===1?'':'s'}</button>
      </div>
    `);
  }

  async function commit(){
    const staged = window[stageVar] || [];
    if(!staged.length){ toast('Nothing to import','err'); return; }
    const clean = staged.map(r => { const { _dup, ...rest } = r; return rest; });
    toast(`Importing ${clean.length} ${(config.labelPlural||config.label||k).toLowerCase()}…`);
    const n = await config.bulkSave(clean);
    if(n === false){ toast(`Import failed${config.tableName?` — ${config.tableName} table may not exist`:''}`,'err'); return; }
    if(typeof sbAuditLog === 'function' && config.auditEvent){
      sbAuditLog(config.auditEvent, k, {row_count: clean.length, source: 'csv'});
    }
    if(typeof config.onSuccess === 'function') await config.onSuccess();
    delete window[stageVar];
    closeModal();
    const count = typeof n === 'number' ? n : clean.length;
    toast(`Imported ${count} ${(config.labelPlural||config.label||k).toLowerCase()}`,'ok');
  }

  // Register handlers under conventional names
  window[`download${cap}CsvTemplate`] = downloadTemplate;
  window[`open${cap}CsvPaste`] = openPaste;
  window[`on${cap}FilePick`] = onFile;
  window[`process${cap}CsvText`] = processText;
  window[`commit${cap}Csv`] = commit;

  // Return a small object so the caller can also reach handlers directly
  return { downloadTemplate, openPaste, onFile, processText, commit, fileInputId };
}

// Helper for normalizer: enum match with fallback + tracking
// usage: csvEnumNormalizer(['active','inactive','prospect'], 'active', 'status')
function csvEnumNormalizer(allowed, fallback, trackerKey){
  return (val, ctx) => {
    if(!val) return fallback;
    const v = String(val).toLowerCase().replace(/\s+/g,'_');
    if(allowed.includes(v)) return v;
    if(!ctx.trackers[trackerKey]) ctx.trackers[trackerKey] = { unknown: new Set(), fallback };
    ctx.trackers[trackerKey].unknown.add(val);
    return fallback;
  };
}

// Helper for normalizer: clamp number to [min, max] or drop if invalid
function csvNumberNormalizer(min=0, max=Infinity){
  return (val) => {
    if(val === '' || val == null) return null;
    const n = Number(val);
    if(isNaN(n) || n < min || n > max) return null;
    return n;
  };
}
