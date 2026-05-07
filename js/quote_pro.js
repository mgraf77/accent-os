// ── QUOTE PRO (Track 1.2 expansion) ──
// AI-driven quote builder. Takes blueprints (PDF/image) → vision takeoff →
// matches against a stored "national-account template" (e.g. Homegrown /
// Thrive Restaurant Group) → produces an editable line grid + Windward-
// friendly CSV + printable invoice.
//
// Two modes on the same page:
//   (a) Train — upload prior-location blueprints + final invoice → save
//       as a template for that brand
//   (b) Build — pick brand template, upload new-location blueprints →
//       AI extracts fixtures → autofills lines from template signature
//       → user reviews → save quote + export
//
// Dependencies (all already in index.html shell):
//   $, esc, openModal, closeModal, toast, sbFetch, sbConfigured, sbKey,
//   getS, sbSaveQuote, sbDeleteQuote, QUOTES, QUOTE_ID, VD (vendor list),
//   formatCurrency.
//
// Schema: sql/M42_quote_templates_schema.sql (quote_templates table).

let QP_TEMPLATES = [];
let qpTab = 'build';           // 'build' | 'templates' | 'saved' | 'help'
let qpDraft = null;            // current working quote draft (header + lineItems)
let qpStaged = { blueprints: [], invoice: [] };  // file batch staging for ingest/build
let qpTemplateFilter = '';

// ── PERSISTENCE ─────────────────────────────────────────────
async function sbLoadQuoteTemplates(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/quote_templates?select=*&order=updated_at.desc&limit=500');
    QP_TEMPLATES = Array.isArray(rows) ? rows : [];
    console.log(`[quote_templates] Loaded ${QP_TEMPLATES.length} templates`);
    return QP_TEMPLATES.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[quote_templates] table not yet created — run sql/M42_quote_templates_schema.sql');
    } else {
      console.warn('[sb] Load quote_templates failed:', e.message);
    }
    return false;
  }
}

async function sbSaveQuoteTemplate(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      brand: rec.brand,
      parent_company: rec.parent_company || null,
      source_location: rec.source_location || null,
      blueprint_notes: rec.blueprint_notes || null,
      fixture_signature: rec.fixture_signature || [],
      invoice_lines: rec.invoice_lines || [],
      totals: rec.totals || null,
      ai_summary: rec.ai_summary || null,
      fixture_count: (rec.fixture_signature || []).reduce((s,f)=>s + (Number(f.qty)||0), 0) || null,
      invoice_total: rec.totals?.total || (rec.invoice_lines||[]).reduce((s,l)=>s + (Number(l.ext_price)||(Number(l.qty)*Number(l.unit_price))||0), 0) || null,
      notes: rec.notes || null,
      updated_at: new Date().toISOString(),
      updated_by: getS('aos-user-name') || null
    };
    const res = await sbFetch('/quote_templates' + (rec.id ? `?id=eq.${rec.id}` : ''), {
      method: rec.id ? 'PATCH' : 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    });
    return Array.isArray(res) ? res[0] : res;
  }catch(e){ console.warn('[sb] Save quote_template failed:', e.message); return false; }
}

async function sbDeleteQuoteTemplate(id){
  if(!sbConfigured() || !id) return false;
  try{
    await sbFetch(`/quote_templates?id=eq.${id}`, { method:'DELETE', headers:{'Prefer':'return=minimal'} });
    return true;
  }catch(e){ console.warn('[sb] Delete quote_template failed:', e.message); return false; }
}

async function sbBumpTemplateUsage(id){
  if(!sbConfigured() || !id) return;
  try{
    const cur = QP_TEMPLATES.find(t=>t.id===id);
    const next = (cur?.use_count || 0) + 1;
    await sbFetch(`/quote_templates?id=eq.${id}`, {
      method:'PATCH',
      headers:{'Prefer':'return=minimal'},
      body: JSON.stringify({ use_count: next, last_used_at: new Date().toISOString() })
    });
    if(cur){ cur.use_count = next; cur.last_used_at = new Date().toISOString(); }
  }catch(e){ console.warn('[sb] Bump template usage failed:', e.message); }
}

// ── ANTHROPIC CALL HELPERS ─────────────────────────────────
function qpApiKey(){ return getS('aos-api') || ''; }

// Build a vision content block for the API. Accepts:
//   {kind:'image', mediaType:'image/png'|'image/jpeg'|..., data:'base64...'}
//   {kind:'pdf',   data:'base64...'}
//   {kind:'text',  text:'...'}
function qpBlock(item){
  if(item.kind === 'image'){
    return { type:'image', source:{ type:'base64', media_type:item.mediaType||'image/png', data:item.data } };
  }
  if(item.kind === 'pdf'){
    return { type:'document', source:{ type:'base64', media_type:'application/pdf', data:item.data } };
  }
  return { type:'text', text:item.text || '' };
}

async function qpCallAnthropic({system, user, files=[], maxTokens=4000, model}){
  const key = qpApiKey();
  if(!key) throw new Error('Add your Anthropic API key in Settings → API Keys.');
  const content = [
    ...files.map(qpBlock),
    { type:'text', text: user }
  ];
  const body = {
    model: model || 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    messages: [{ role:'user', content }]
  };
  if(system) body.system = system;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01' },
    body: JSON.stringify(body)
  });
  if(!r.ok){
    let txt = '';
    try { txt = await r.text(); } catch {}
    throw new Error(`Anthropic ${r.status}: ${txt.slice(0,200)}`);
  }
  const data = await r.json();
  return (data?.content || []).map(c => c.type==='text' ? c.text : '').join('').trim();
}

// Strip ```json fences and parse, or return null.
function qpExtractJson(text){
  if(!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(fence) t = fence[1].trim();
  // Find first { or [
  const startObj = t.indexOf('{'), startArr = t.indexOf('[');
  let start = -1;
  if(startObj === -1) start = startArr;
  else if(startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);
  if(start === -1) return null;
  const sliced = t.slice(start);
  try { return JSON.parse(sliced); }
  catch {
    // Try trimming trailing junk after last } or ]
    const lastObj = sliced.lastIndexOf('}'), lastArr = sliced.lastIndexOf(']');
    const end = Math.max(lastObj, lastArr);
    if(end > -1){ try { return JSON.parse(sliced.slice(0, end+1)); } catch { return null; } }
    return null;
  }
}

// ── FILE INGEST ─────────────────────────────────────────────
function qpReadFileAsBase64(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || '');
      const idx = s.indexOf(',');
      resolve(idx > -1 ? s.slice(idx+1) : s);
    };
    r.onerror = () => reject(new Error('Read failed: ' + (file.name||'unknown')));
    r.readAsDataURL(file);
  });
}

async function qpStageFiles(fileList, bucket /* 'blueprints' | 'invoice' */){
  const arr = Array.from(fileList || []);
  for(const f of arr){
    const mt = (f.type || '').toLowerCase();
    let kind = null;
    if(mt.startsWith('image/')) kind = 'image';
    else if(mt === 'application/pdf' || /\.pdf$/i.test(f.name||'')) kind = 'pdf';
    else if(mt.startsWith('text/') || /\.csv$/i.test(f.name||'')){
      const text = await f.text();
      qpStaged[bucket].push({ name:f.name, kind:'text', text });
      continue;
    } else {
      toast(`Skipped unsupported file: ${f.name}`, 'err');
      continue;
    }
    try{
      const b64 = await qpReadFileAsBase64(f);
      qpStaged[bucket].push({ name:f.name, kind, mediaType: mt || (kind==='pdf'?'application/pdf':'image/png'), data:b64 });
    }catch(e){ toast(e.message, 'err'); }
  }
  qpRender();
}

function qpClearStaged(bucket){ qpStaged[bucket] = []; qpRender(); }

// ── AI: TAKEOFF FROM BLUEPRINTS ────────────────────────────
async function qpRunTakeoff(){
  if(!qpStaged.blueprints.length){ toast('Upload blueprint pages first', 'err'); return; }
  const tplId = $('qp-build-template')?.value || '';
  const tpl = QP_TEMPLATES.find(t => t.id === tplId);
  const btn = $('qp-run-takeoff');
  if(btn){ btn.disabled = true; btn.textContent = 'Running takeoff…'; }
  try{
    const sigHint = tpl?.fixture_signature?.length
      ? `\n\nFor reference, here is the fixture signature from a prior ${tpl.brand} location. Look hard for the same fixture types and try to match tags/specs where possible:\n${JSON.stringify(tpl.fixture_signature, null, 2)}`
      : '';
    const sys = `You are a senior commercial lighting estimator at Accent Lighting (Wichita, KS). You read electrical and architectural drawing pages and produce an exhaustive fixture takeoff for quoting purposes. You err on the side of including everything Accent might supply (decorative + downlights + emergency/NL + exit signs + drivers + dimmers + trims). You DO NOT include items the EC supplies (rough-in boxes, raceway, conduit, generic switches, panels) unless explicitly listed on the lighting schedule.`;
    const user = `Inspect every page provided. For each unique fixture type called out on the lighting plan or schedule, return a JSON array. Each element:
{
  "tag": "fixture symbol on plan (e.g. A1, F2, EM, X)",
  "description": "short description (manufacturer + model if shown, otherwise type + lamp + trim/finish)",
  "qty": <integer count from plan>,
  "rooms": ["dining","bar","kitchen", ...],
  "mounting": "recessed | pendant | surface | wall | track | other",
  "lamping": "e.g. LED 3000K, integrated 90CRI",
  "notes": "any special notes (NL, EM, dimming, decorative, owner-supplied, etc.)",
  "page_refs": ["E-2", "E-3"]
}

Rules:
- Count every fixture across every page; sum if a tag appears multiple places.
- If the schedule shows a fixture but it has zero count on the plan, still include it with qty:0 and add a note.
- If a tag appears with no schedule entry, list it as "tag only" in description.
- Return ONLY the JSON array. No prose, no markdown fences.${sigHint}`;
    const out = await qpCallAnthropic({
      system: sys,
      user,
      files: qpStaged.blueprints,
      maxTokens: 8000
    });
    const arr = qpExtractJson(out);
    if(!Array.isArray(arr)) throw new Error('AI did not return a JSON array. Raw: ' + out.slice(0, 200));
    // Normalize into draft
    qpDraft = qpDraft || qpEmptyDraft();
    qpDraft.template_id = tpl?.id || null;
    qpDraft.brand = tpl?.brand || qpDraft.brand;
    qpDraft.parent_company = tpl?.parent_company || qpDraft.parent_company;
    qpDraft.takeoff = arr.map((f,i) => ({
      lineNo: i+1,
      tag: f.tag || '',
      description: f.description || f.desc || '',
      qty: Number(f.qty)||0,
      rooms: Array.isArray(f.rooms) ? f.rooms.join(', ') : (f.rooms||''),
      mounting: f.mounting || '',
      lamping: f.lamping || '',
      notes: f.notes || f.note || '',
      page_refs: Array.isArray(f.page_refs) ? f.page_refs.join(', ') : (f.page_refs||''),
      // matched/synthesized later from template:
      vendor: '', sku: '', unit_price: 0, unit_cost: 0, ext_price: 0
    }));
    if(tpl) qpApplyTemplateMatch(tpl);
    qpRecalc();
    toast(`Takeoff complete: ${arr.length} fixture types`, 'ok');
  }catch(e){
    toast(e.message || 'Takeoff failed', 'err');
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = 'Run AI takeoff'; }
    qpRender();
  }
}

// Match takeoff rows to a template's fixture_signature by tag/description similarity.
function qpApplyTemplateMatch(tpl){
  if(!qpDraft || !tpl?.fixture_signature?.length) return 0;
  const sig = tpl.fixture_signature;
  let matched = 0;
  qpDraft.takeoff.forEach(row => {
    if(row.unit_price > 0) return; // already filled
    const t = (row.tag||'').toLowerCase();
    const d = (row.description||'').toLowerCase();
    const hit = sig.find(s => {
      const st = (s.tag||'').toLowerCase();
      const sd = (s.description||s.desc||'').toLowerCase();
      if(st && t && st === t) return true;
      if(sd && d && (sd.includes(d.split(' ')[0]) || d.includes(sd.split(' ')[0]))) return true;
      return false;
    });
    if(hit){
      row.vendor = hit.vendor || hit.vendor_name || '';
      row.sku = hit.sku || hit.part_number || '';
      row.unit_price = Number(hit.unit_price)||0;
      row.unit_cost = Number(hit.unit_cost)||0;
      row.matched = true;
      matched++;
    }
  });
  if(matched > 0) toast(`Matched ${matched} of ${qpDraft.takeoff.length} from template`, 'ok');
  return matched;
}

function qpRecalc(){
  if(!qpDraft) return;
  let subtotal = 0;
  qpDraft.takeoff.forEach(r => {
    r.ext_price = (Number(r.qty)||0) * (Number(r.unit_price)||0);
    subtotal += r.ext_price;
  });
  qpDraft.subtotal = subtotal;
  qpDraft.tax = Number(qpDraft.tax) || 0;
  qpDraft.freight = Number(qpDraft.freight) || 0;
  qpDraft.total = subtotal + qpDraft.tax + qpDraft.freight;
}

function qpEmptyDraft(){
  return {
    id: 'QT-' + String((typeof QUOTE_ID !== 'undefined' ? QUOTE_ID : 1)).padStart(4,'0'),
    template_id: null, brand: '', parent_company: '',
    customer: '', project: '', location: '', contact: '',
    takeoff: [],
    subtotal: 0, tax: 0, freight: 0, total: 0,
    notes: '',
    created_at: new Date().toISOString()
  };
}

// ── AI: INGEST TRAINING PAIR (blueprints + invoice → template) ────
async function qpIngestTrainingPair(form){
  const brand = form.brand.value.trim();
  const parent = form.parent_company.value.trim();
  const sourceLoc = form.source_location.value.trim();
  if(!brand){ toast('Brand is required', 'err'); return; }
  if(!qpStaged.blueprints.length && !qpStaged.invoice.length){
    toast('Upload at least the prior invoice (blueprints optional but recommended)', 'err'); return;
  }
  const btn = $('qp-ingest-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Ingesting…'; }
  try{
    const sys = `You are a senior commercial lighting estimator at Accent Lighting. You are ingesting a training pair from a prior job for the brand "${brand}"${parent?` (parent: ${parent})`:''}. Your output will be saved as a reusable template for future quotes for this brand.`;
    const user = `Two inputs are provided (in this order):
1. The blueprints/lighting schedule from the prior location (may be empty if the user only had the invoice).
2. The final invoice we sent the customer.

Produce a single JSON object:
{
  "fixture_signature": [
    { "tag":"A1", "description":"Halo HL36 3in LED downlight 3000K", "qty":24, "rooms":["dining"], "vendor":"Halo", "sku":"HL36A30...", "unit_cost":12.50, "unit_price":18.75, "notes":"" }
    // one per unique fixture across blueprints + invoice
  ],
  "invoice_lines": [
    { "line_no":1, "sku":"HL36A30...", "description":"...", "qty":24, "unit_price":18.75, "ext_price":450.00, "vendor":"Halo" }
    // one per invoice row, exact order from the invoice
  ],
  "totals": { "subtotal":0, "tax":0, "freight":0, "total":0 },
  "blueprint_notes": "1-2 paragraphs of context (what was unusual, what callouts mattered, what items you'd expect every Homegrown to have)",
  "ai_summary": "3-4 sentences: how to think about quoting this brand going forward; what fixtures repeat across locations; gotchas."
}

Rules:
- Reconcile the invoice against the blueprint takeoff so fixture_signature reflects what was actually supplied.
- Keep SKUs exactly as printed on the invoice.
- If the invoice has shipping/freight/tax lines, place them in totals, NOT invoice_lines.
- Return ONLY the JSON object, no prose, no markdown fences.`;
    const files = [
      ...qpStaged.blueprints.map(f => ({...f})),
      // visual separator hint to the model
      { kind:'text', text:'--- END BLUEPRINTS / BEGIN INVOICE ---' },
      ...qpStaged.invoice.map(f => ({...f}))
    ];
    const out = await qpCallAnthropic({ system:sys, user, files, maxTokens: 8000 });
    const obj = qpExtractJson(out);
    if(!obj || !Array.isArray(obj.fixture_signature)) throw new Error('AI did not return a valid template object. Raw: ' + out.slice(0, 200));
    const rec = {
      brand, parent_company: parent || null, source_location: sourceLoc || null,
      blueprint_notes: obj.blueprint_notes || null,
      fixture_signature: obj.fixture_signature || [],
      invoice_lines: obj.invoice_lines || [],
      totals: obj.totals || null,
      ai_summary: obj.ai_summary || null,
      notes: form.notes.value.trim() || null
    };
    const saved = await sbSaveQuoteTemplate(rec);
    if(!saved){ throw new Error('Save failed (run sql/M42_quote_templates_schema.sql in Supabase first?)'); }
    QP_TEMPLATES.unshift(saved);
    qpStaged = { blueprints:[], invoice:[] };
    closeModal();
    toast(`Template saved: ${brand}`, 'ok');
    qpTab = 'templates';
    qpRender();
  }catch(e){
    toast(e.message || 'Ingest failed', 'err');
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = 'Ingest training pair'; }
  }
}

// ── EXPORTS ─────────────────────────────────────────────────
function qpExportCsv(){
  if(!qpDraft || !qpDraft.takeoff.length){ toast('Nothing to export', 'err'); return; }
  // Windward-style: PartNumber, Description, Qty, UnitPrice, ExtPrice, Vendor
  const head = ['PartNumber','Description','Qty','UnitPrice','ExtPrice','Vendor','Tag','Notes'];
  const rows = qpDraft.takeoff.map(r => [
    r.sku||'', r.description||'', r.qty||0,
    Number(r.unit_price||0).toFixed(2), Number(r.ext_price||0).toFixed(2),
    r.vendor||'', r.tag||'', r.notes||''
  ]);
  const csvCell = v => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  };
  const csv = [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${qpDraft.id || 'quote'}_${(qpDraft.brand||'quote').replace(/\W+/g,'_')}.csv`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function qpPrintInvoice(){
  if(!qpDraft || !qpDraft.takeoff.length){ toast('Nothing to print', 'err'); return; }
  const w = window.open('', '_blank');
  if(!w){ toast('Pop-up blocked', 'err'); return; }
  const lines = qpDraft.takeoff.map((r,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${esc(r.sku||'')}</td>
      <td>${esc(r.description||'')}<div style="font-size:11px;color:#666;">${esc(r.tag||'')} ${r.rooms?'· '+esc(r.rooms):''} ${r.notes?'· '+esc(r.notes):''}</div></td>
      <td style="text-align:right;">${r.qty||0}</td>
      <td style="text-align:right;">$${Number(r.unit_price||0).toFixed(2)}</td>
      <td style="text-align:right;">$${Number(r.ext_price||0).toFixed(2)}</td>
    </tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>${esc(qpDraft.id||'Quote')} — ${esc(qpDraft.brand||'')}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:24px;color:#222;}
      h1{margin:0;font-size:22px;}
      h2{margin:24px 0 4px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#888;}
      table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;}
      th,td{padding:6px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top;}
      th{text-align:left;background:#f4f4f2;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#666;}
      .totals{margin-top:16px;width:300px;margin-left:auto;font-size:13px;}
      .totals td{padding:4px 8px;border:none;}
      .totals .grand{border-top:2px solid #222;font-weight:bold;font-size:15px;}
      .meta{display:flex;justify-content:space-between;margin-top:12px;font-size:12px;}
      .meta div{flex:1;}
      @media print { body{margin:12px;} .no-print{display:none;} }
    </style></head><body>
    <div class="no-print" style="text-align:right;margin-bottom:8px;"><button onclick="window.print()">Print</button></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ed1c24;padding-bottom:12px;">
      <div>
        <h1>QUOTE</h1>
        <div style="color:#666;font-size:12px;">${esc(qpDraft.id||'')}</div>
      </div>
      <div style="text-align:right;font-size:12px;line-height:1.4;">
        <strong>Accent Lighting Inc.</strong><br>
        10322 E. Stonegate Ln., Suite 100<br>Wichita, KS 67206<br>(316) 636-1278
      </div>
    </div>
    <div class="meta">
      <div><h2>Customer</h2>${esc(qpDraft.customer||qpDraft.brand||'')}<br>${esc(qpDraft.contact||'')}</div>
      <div><h2>Project</h2>${esc(qpDraft.project||'')}<br>${esc(qpDraft.location||'')}</div>
      <div style="text-align:right;"><h2>Date</h2>${new Date().toLocaleDateString()}</div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Part</th><th>Description</th><th>Qty</th><th>Unit</th><th>Ext</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right;">$${Number(qpDraft.subtotal||0).toFixed(2)}</td></tr>
      <tr><td>Freight</td><td style="text-align:right;">$${Number(qpDraft.freight||0).toFixed(2)}</td></tr>
      <tr><td>Tax</td><td style="text-align:right;">$${Number(qpDraft.tax||0).toFixed(2)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right;">$${Number(qpDraft.total||0).toFixed(2)}</td></tr>
    </table>
    ${qpDraft.notes?`<h2>Notes</h2><div style="font-size:12px;white-space:pre-wrap;">${esc(qpDraft.notes)}</div>`:''}
  </body></html>`);
  w.document.close();
}

async function qpSaveDraftQuote(){
  if(!qpDraft){ toast('No draft to save', 'err'); return; }
  if(!qpDraft.takeoff.length){ toast('Add at least one line', 'err'); return; }
  // Map our richer takeoff into the existing quotes schema (lineItems shape)
  const q = {
    id: qpDraft.id,
    customer: qpDraft.customer || qpDraft.brand || '',
    contact: qpDraft.contact || '',
    project: qpDraft.project || '',
    type: 'commercial',
    sqft: '',
    budget: '',
    notes: (qpDraft.notes ? qpDraft.notes + '\n\n' : '')
         + `[Quote Pro] template_id=${qpDraft.template_id||'none'} | brand=${qpDraft.brand||''} | parent=${qpDraft.parent_company||''}`,
    lineItems: qpDraft.takeoff.map((r,i) => ({
      id: i+1,
      desc: `${r.tag?'['+r.tag+'] ':''}${r.description||''}`.trim(),
      qty: Number(r.qty)||0,
      price: Number(r.unit_price)||0,
      cat: r.notes ? r.notes.slice(0,60) : 'LED Fixtures',
      vendorName: r.vendor || '',
      vendorId: null
    })),
    total: Number(qpDraft.total)||0
  };
  const ok = await sbSaveQuote(q);
  if(ok){
    if(qpDraft.template_id) await sbBumpTemplateUsage(qpDraft.template_id);
    if(typeof QUOTE_ID !== 'undefined'){
      const m = /QT-(\d+)/.exec(qpDraft.id);
      if(m && parseInt(m[1],10) >= QUOTE_ID) QUOTE_ID = parseInt(m[1],10) + 1;
    }
    if(typeof QUOTES !== 'undefined' && Array.isArray(QUOTES)){
      const idx = QUOTES.findIndex(x => x.id === q.id);
      if(idx >= 0) QUOTES[idx] = {...QUOTES[idx], ...q};
      else QUOTES.unshift({...q, date: new Date().toLocaleDateString()});
    }
    toast(`Saved ${q.id}`, 'ok');
    qpRender();
  } else {
    toast('Save failed (check Supabase config)', 'err');
  }
}

// ── RENDER ──────────────────────────────────────────────────
function qpRender(){
  const root = $('pg-content');
  if(!root) return;
  if(curPage !== 'quotepro') return;
  const tabBar = `
    <div class="tab-bar" style="margin-bottom:14px;">
      <button class="tab-btn ${qpTab==='build'?'active':''}"     onclick="qpSetTab('build')">New Quote</button>
      <button class="tab-btn ${qpTab==='templates'?'active':''}" onclick="qpSetTab('templates')">Templates (${QP_TEMPLATES.length})</button>
      <button class="tab-btn ${qpTab==='saved'?'active':''}"     onclick="qpSetTab('saved')">Saved Quotes (${(typeof QUOTES!=='undefined'?QUOTES.length:0)})</button>
      <button class="tab-btn ${qpTab==='help'?'active':''}"      onclick="qpSetTab('help')">Help</button>
    </div>`;
  let body = '';
  if(qpTab === 'build')      body = qpRenderBuildTab();
  else if(qpTab === 'templates') body = qpRenderTemplatesTab();
  else if(qpTab === 'saved') body = qpRenderSavedTab();
  else if(qpTab === 'help')  body = qpRenderHelpTab();
  root.innerHTML = tabBar + body;
}

function qpSetTab(t){ qpTab = t; qpRender(); }

function qpRenderBuildTab(){
  const tplOptions = QP_TEMPLATES.map(t =>
    `<option value="${t.id}" ${qpDraft?.template_id===t.id?'selected':''}>${esc(t.brand)}${t.parent_company?' — '+esc(t.parent_company):''}${t.source_location?' · '+esc(t.source_location):''}</option>`
  ).join('');
  const draft = qpDraft || qpEmptyDraft();
  const stagedB = qpStaged.blueprints.map((f,i) =>
    `<div class="chip">${esc(f.name||(f.kind+' '+(i+1)))} <span style="opacity:.6">· ${f.kind}</span> <button class="x" onclick="qpStaged.blueprints.splice(${i},1);qpRender()" title="Remove">×</button></div>`
  ).join('') || '<span style="color:#888;font-size:12px;">No blueprint pages staged.</span>';

  const hasDraft = qpDraft && qpDraft.takeoff?.length > 0;
  const draftRows = !hasDraft ? '' : qpDraft.takeoff.map((r,i) => `
    <tr data-i="${i}" ${r.matched?'style="background:rgba(60,160,90,.06);"':''}>
      <td style="text-align:center;color:#888;font-size:11px;">${i+1}</td>
      <td><input class="qp-cell" data-k="tag" value="${esc(r.tag||'')}" style="width:60px;"></td>
      <td><input class="qp-cell" data-k="description" value="${esc(r.description||'')}" style="width:100%;"></td>
      <td><input class="qp-cell" data-k="vendor" value="${esc(r.vendor||'')}" style="width:120px;"></td>
      <td><input class="qp-cell" data-k="sku" value="${esc(r.sku||'')}" style="width:140px;"></td>
      <td><input class="qp-cell qp-num" data-k="qty" type="number" min="0" step="1" value="${r.qty||0}" style="width:60px;text-align:right;"></td>
      <td><input class="qp-cell qp-num" data-k="unit_price" type="number" min="0" step="0.01" value="${Number(r.unit_price||0).toFixed(2)}" style="width:90px;text-align:right;"></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;">$${Number(r.ext_price||0).toFixed(2)}</td>
      <td><button class="btn btn-sm" onclick="qpRemoveLine(${i})">×</button></td>
    </tr>`).join('');

  return `
    <div class="card" style="margin-bottom:14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">
        <div><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Brand template</label>
          <select id="qp-build-template" onchange="qpOnTemplateChange(this.value)">
            <option value="">— pick template (or none) —</option>
            ${tplOptions}
          </select></div>
        <div><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Customer / brand</label>
          <input id="qp-customer" value="${esc(draft.customer||draft.brand||'')}" placeholder="Homegrown" oninput="qpDraft && (qpDraft.customer=this.value)"></div>
        <div><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Project</label>
          <input id="qp-project" value="${esc(draft.project||'')}" placeholder="New location buildout" oninput="qpDraft && (qpDraft.project=this.value)"></div>
        <div><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Location</label>
          <input id="qp-location" value="${esc(draft.location||'')}" placeholder="City, ST" oninput="qpDraft && (qpDraft.location=this.value)"></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <h3 style="margin-top:0;">1. Upload blueprint pages</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0;">
        <input type="file" id="qp-blueprint-input" accept="image/*,application/pdf" multiple onchange="qpStageFiles(this.files,'blueprints');this.value=''">
        <button class="btn btn-sm" onclick="qpClearStaged('blueprints')">Clear</button>
        <span style="margin-left:auto;color:#666;font-size:12px;">Electrical + architectural pages. PDF or images. Multi-page PDFs get sent whole.</span>
      </div>
      <div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;">${stagedB}</div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-accent" id="qp-run-takeoff" onclick="qpRunTakeoff()">Run AI takeoff</button>
        <button class="btn btn-sm" onclick="qpAddLine()">+ Add empty line</button>
        <span style="margin-left:auto;font-size:12px;color:${qpApiKey()?'#3a8;':'#c00;'}">${qpApiKey()?'API key configured ✓':'⚠ Add Anthropic API key in Settings'}</span>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <h3 style="margin:0;flex:1;">2. Review fixtures ${hasDraft?`<span style="color:#888;font-weight:400;font-size:13px;">${qpDraft.takeoff.length} lines · matched ${qpDraft.takeoff.filter(r=>r.matched).length}</span>`:''}</h3>
        ${hasDraft?`<button class="btn btn-sm" onclick="qpClearDraft()">Reset</button>`:''}
        ${hasDraft?`<button class="btn btn-sm" onclick="qpExportCsv()">Export CSV</button>`:''}
        ${hasDraft?`<button class="btn btn-sm" onclick="qpPrintInvoice()">Print quote</button>`:''}
        ${hasDraft?`<button class="btn btn-accent btn-sm" onclick="qpSaveDraftQuote()">Save quote</button>`:''}
      </div>
      ${!hasDraft ? `<div style="padding:30px;text-align:center;color:#888;">No takeoff yet. Upload blueprint pages and click <b>Run AI takeoff</b> above.</div>` : `
      <div style="overflow-x:auto;">
      <table class="data-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:30px;">#</th><th>Tag</th><th>Description</th><th>Vendor</th><th>SKU</th>
          <th style="text-align:right;">Qty</th><th style="text-align:right;">Unit $</th>
          <th style="text-align:right;">Ext $</th><th></th>
        </tr></thead>
        <tbody>${draftRows}</tbody>
        <tfoot>
          <tr><td colspan="7" style="text-align:right;color:#666;">Subtotal</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;">$${Number(qpDraft.subtotal||0).toFixed(2)}</td><td></td></tr>
          <tr><td colspan="6" style="text-align:right;color:#666;">Freight</td>
            <td colspan="2" style="text-align:right;"><input class="qp-foot qp-num" data-k="freight" type="number" min="0" step="0.01" value="${Number(qpDraft.freight||0).toFixed(2)}" style="width:90px;text-align:right;"></td><td></td></tr>
          <tr><td colspan="6" style="text-align:right;color:#666;">Tax</td>
            <td colspan="2" style="text-align:right;"><input class="qp-foot qp-num" data-k="tax" type="number" min="0" step="0.01" value="${Number(qpDraft.tax||0).toFixed(2)}" style="width:90px;text-align:right;"></td><td></td></tr>
          <tr><td colspan="7" style="text-align:right;font-weight:bold;">Total</td>
            <td style="text-align:right;font-weight:bold;font-variant-numeric:tabular-nums;">$${Number(qpDraft.total||0).toFixed(2)}</td><td></td></tr>
        </tfoot>
      </table>
      </div>
      <div style="margin-top:12px;">
        <label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Quote notes (printed on invoice)</label>
        <textarea id="qp-notes" rows="2" oninput="qpDraft && (qpDraft.notes=this.value)" style="width:100%;">${esc(qpDraft.notes||'')}</textarea>
      </div>`}
    </div>
  `;
}

function qpRenderTemplatesTab(){
  const filtered = QP_TEMPLATES.filter(t => {
    if(!qpTemplateFilter) return true;
    const q = qpTemplateFilter.toLowerCase();
    return (t.brand||'').toLowerCase().includes(q)
        || (t.parent_company||'').toLowerCase().includes(q)
        || (t.source_location||'').toLowerCase().includes(q);
  });
  const rows = filtered.map(t => `
    <tr>
      <td><strong>${esc(t.brand)}</strong>${t.source_location?`<div style="font-size:11px;color:#888;">${esc(t.source_location)}</div>`:''}</td>
      <td>${esc(t.parent_company||'')}</td>
      <td style="text-align:right;">${t.fixture_count||(t.fixture_signature?.length)||0}</td>
      <td style="text-align:right;">$${Number(t.invoice_total||0).toFixed(2)}</td>
      <td style="text-align:right;">${t.use_count||0}</td>
      <td style="font-size:11px;color:#888;">${t.updated_at?new Date(t.updated_at).toLocaleDateString():''}</td>
      <td>
        <button class="btn btn-sm" onclick="qpViewTemplate('${t.id}')">View</button>
        <button class="btn btn-sm" onclick="qpUseTemplate('${t.id}')">Use</button>
        <button class="btn btn-sm" onclick="qpConfirmDeleteTemplate('${t.id}')" style="color:#c00;">×</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">No templates yet. Click <b>+ New training pair</b> to ingest your first prior job.</td></tr>`;

  return `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
      <input placeholder="Search brand / parent / location" value="${esc(qpTemplateFilter)}" oninput="qpTemplateFilter=this.value;qpRender()" style="flex:1;">
      <button class="btn btn-accent btn-sm" onclick="qpOpenIngestModal()">+ New training pair</button>
    </div>
    <div class="card">
      <table class="data-table" style="width:100%;">
        <thead><tr><th>Brand</th><th>Parent</th><th style="text-align:right;">Fixtures</th><th style="text-align:right;">Invoice $</th><th style="text-align:right;">Used</th><th>Updated</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function qpRenderSavedTab(){
  const rows = (typeof QUOTES !== 'undefined' && Array.isArray(QUOTES) ? QUOTES : []).map(q => `
    <tr>
      <td><strong>${esc(q.id)}</strong></td>
      <td>${esc(q.customer||'')}</td>
      <td>${esc(q.project||'')}</td>
      <td>${esc(q.date||'')}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;">$${Number(q.total||0).toFixed(2)}</td>
      <td><button class="btn btn-sm" onclick="qpReopenSaved('${esc(q.id)}')">Reopen</button></td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No saved quotes yet.</td></tr>`;
  return `
    <div class="card">
      <table class="data-table" style="width:100%;">
        <thead><tr><th>#</th><th>Customer</th><th>Project</th><th>Date</th><th style="text-align:right;">Total</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function qpRenderHelpTab(){
  return `
    <div class="card" style="line-height:1.6;">
      <h3 style="margin-top:0;">How Quote Pro works</h3>
      <ol style="padding-left:20px;">
        <li><strong>Train it once per national account.</strong> On the <em>Templates</em> tab, click <em>+ New training pair</em>. Upload (a) the blueprints from a prior location and (b) the final invoice you sent. Claude reconciles the two and saves a fixture signature + invoice template for that brand.</li>
        <li><strong>Use it for the next location.</strong> On <em>New Quote</em>, pick the brand template, upload the new blueprints, click <em>Run AI takeoff</em>. Claude lists every fixture; matches against the template's signature; fills SKU + price wherever the same fixture repeats.</li>
        <li><strong>Review &amp; edit.</strong> Every line is editable. Add freight + tax. Notes print on the invoice.</li>
        <li><strong>Ship.</strong> Save the quote (writes to the existing <code>quotes</code> + <code>quote_lines</code> tables — appears in <em>Saved Quotes</em> and the rest of AccentOS), or hit <em>Export CSV</em> for Windward import, or <em>Print quote</em> for the customer-facing PDF.</li>
      </ol>
      <h3>What's stored</h3>
      <p>Templates persist in Supabase (<code>quote_templates</code>). Quotes use the existing <code>quotes</code>/<code>quote_lines</code> tables — so they show up in the regular <em>Quote Generator</em> page, the Daily Brief, the Decision Engine, etc.</p>
      <h3>What you need to set up once</h3>
      <ul>
        <li>Run <code>sql/M42_quote_templates_schema.sql</code> in Supabase SQL Editor (creates the <code>quote_templates</code> table).</li>
        <li>Confirm your Anthropic API key is in <em>Settings → API Keys</em> (same key used by Knowledge Engine).</li>
      </ul>
      <h3>Examples this is built for</h3>
      <p><strong>Homegrown / Thrive Restaurant Group:</strong> ingest the last Homegrown buildout's blueprints + invoice once. Future Homegrowns: drop blueprints, hit takeoff, review, send. Each location's quote is reconstructed automatically from the trained pattern.</p>
    </div>
  `;
}

// ── BIND CELL EDITS ─────────────────────────────────────────
function qpBindCells(){
  document.querySelectorAll('.qp-cell').forEach(el => {
    el.oninput = (e) => {
      const tr = e.target.closest('tr'); const i = Number(tr?.dataset?.i);
      if(!qpDraft || !qpDraft.takeoff[i]) return;
      const k = e.target.dataset.k;
      qpDraft.takeoff[i][k] = (e.target.classList.contains('qp-num')) ? Number(e.target.value)||0 : e.target.value;
      if(k === 'qty' || k === 'unit_price'){
        qpRecalc();
        const extCell = tr.querySelector('td:nth-last-child(2)');
        if(extCell) extCell.textContent = '$' + Number(qpDraft.takeoff[i].ext_price||0).toFixed(2);
        const totals = document.querySelectorAll('.data-table tfoot td');
        if(totals.length){
          // re-render footers (simplest: re-render whole tab)
          qpRender();
        }
      }
    };
  });
  document.querySelectorAll('.qp-foot').forEach(el => {
    el.oninput = (e) => {
      if(!qpDraft) return;
      qpDraft[e.target.dataset.k] = Number(e.target.value)||0;
      qpRecalc();
      qpRender();
    };
  });
}

// ── ACTIONS ─────────────────────────────────────────────────
function qpOnTemplateChange(id){
  const tpl = QP_TEMPLATES.find(t => t.id === id);
  if(!qpDraft) qpDraft = qpEmptyDraft();
  qpDraft.template_id = tpl?.id || null;
  qpDraft.brand = tpl?.brand || '';
  qpDraft.parent_company = tpl?.parent_company || '';
  if(tpl && qpDraft.takeoff.length) qpApplyTemplateMatch(tpl);
  qpRecalc();
  qpRender();
}

function qpAddLine(){
  if(!qpDraft) qpDraft = qpEmptyDraft();
  qpDraft.takeoff.push({ lineNo: qpDraft.takeoff.length+1, tag:'', description:'', qty:1, vendor:'', sku:'', unit_price:0, ext_price:0, notes:'' });
  qpRecalc();
  qpRender();
}

function qpRemoveLine(i){
  if(!qpDraft) return;
  qpDraft.takeoff.splice(i, 1);
  qpRecalc();
  qpRender();
}

function qpClearDraft(){
  if(!confirm('Clear current quote draft?')) return;
  qpDraft = null;
  qpStaged = { blueprints:[], invoice:[] };
  qpRender();
}

function qpUseTemplate(id){
  qpTab = 'build';
  qpDraft = qpEmptyDraft();
  const tpl = QP_TEMPLATES.find(t => t.id === id);
  if(tpl){
    qpDraft.template_id = tpl.id;
    qpDraft.brand = tpl.brand;
    qpDraft.parent_company = tpl.parent_company || '';
    qpDraft.customer = tpl.brand;
  }
  qpRender();
}

function qpReopenSaved(id){
  const q = (QUOTES||[]).find(x => x.id === id);
  if(!q){ toast('Not found', 'err'); return; }
  qpDraft = qpEmptyDraft();
  qpDraft.id = q.id;
  qpDraft.customer = q.customer || '';
  qpDraft.contact = q.contact || '';
  qpDraft.project = q.project || '';
  qpDraft.notes = q.notes || '';
  qpDraft.takeoff = (q.lineItems||[]).map((l,i) => ({
    lineNo: i+1,
    tag: '', description: l.desc||'',
    qty: Number(l.qty)||0,
    unit_price: Number(l.price)||0,
    unit_cost: 0,
    ext_price: (Number(l.qty)||0) * (Number(l.price)||0),
    vendor: l.vendorName || '',
    sku: '', rooms:'', mounting:'', lamping:'', notes: l.cat||'', page_refs:''
  }));
  qpRecalc();
  qpTab = 'build';
  qpRender();
}

function qpViewTemplate(id){
  const t = QP_TEMPLATES.find(x => x.id === id);
  if(!t){ toast('Not found','err'); return; }
  const sigRows = (t.fixture_signature||[]).map(f =>
    `<tr><td>${esc(f.tag||'')}</td><td>${esc(f.description||f.desc||'')}</td><td style="text-align:right;">${f.qty||0}</td><td>${esc(f.vendor||'')}</td><td>${esc(f.sku||'')}</td><td style="text-align:right;">$${Number(f.unit_price||0).toFixed(2)}</td></tr>`
  ).join('') || '<tr><td colspan="6" style="color:#888;text-align:center;">No fixture signature</td></tr>';
  const invRows = (t.invoice_lines||[]).map(l =>
    `<tr><td>${l.line_no||''}</td><td>${esc(l.sku||'')}</td><td>${esc(l.description||'')}</td><td style="text-align:right;">${l.qty||0}</td><td style="text-align:right;">$${Number(l.unit_price||0).toFixed(2)}</td><td style="text-align:right;">$${Number(l.ext_price||(Number(l.qty)*Number(l.unit_price))||0).toFixed(2)}</td></tr>`
  ).join('') || '<tr><td colspan="6" style="color:#888;text-align:center;">No invoice lines</td></tr>';
  openModal(`${esc(t.brand)}${t.parent_company?' — '+esc(t.parent_company):''}`, `
    ${t.ai_summary?`<div style="background:#f4f4f2;padding:10px;border-radius:4px;margin-bottom:10px;font-size:13px;line-height:1.5;">${esc(t.ai_summary)}</div>`:''}
    ${t.blueprint_notes?`<details style="margin-bottom:10px;"><summary style="cursor:pointer;font-weight:600;">Blueprint notes</summary><div style="margin-top:6px;white-space:pre-wrap;font-size:12px;">${esc(t.blueprint_notes)}</div></details>`:''}
    <h4 style="margin:14px 0 6px;">Fixture signature (${(t.fixture_signature||[]).length})</h4>
    <div style="max-height:200px;overflow:auto;border:1px solid #e0e0e0;"><table class="data-table" style="width:100%;font-size:12px;"><thead><tr><th>Tag</th><th>Description</th><th style="text-align:right;">Qty</th><th>Vendor</th><th>SKU</th><th style="text-align:right;">Unit $</th></tr></thead><tbody>${sigRows}</tbody></table></div>
    <h4 style="margin:14px 0 6px;">Invoice lines (${(t.invoice_lines||[]).length}) · Total $${Number(t.invoice_total||0).toFixed(2)}</h4>
    <div style="max-height:200px;overflow:auto;border:1px solid #e0e0e0;"><table class="data-table" style="width:100%;font-size:12px;"><thead><tr><th>#</th><th>SKU</th><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit $</th><th style="text-align:right;">Ext $</th></tr></thead><tbody>${invRows}</tbody></table></div>
  `, `
    <button class="btn" onclick="closeModal()">Close</button>
    <button class="btn btn-accent" onclick="closeModal();qpUseTemplate('${t.id}')">Use this template</button>
  `);
}

async function qpConfirmDeleteTemplate(id){
  const t = QP_TEMPLATES.find(x => x.id === id);
  if(!t) return;
  if(!confirm(`Delete template "${t.brand}"? This won't affect any quotes already saved.`)) return;
  const ok = await sbDeleteQuoteTemplate(id);
  if(ok){
    QP_TEMPLATES = QP_TEMPLATES.filter(x => x.id !== id);
    toast('Deleted', 'ok');
    qpRender();
  } else toast('Delete failed', 'err');
}

function qpOpenIngestModal(){
  qpStaged = { blueprints:[], invoice:[] };
  openModal('New training pair', `
    <form id="qp-ingest-form" onsubmit="event.preventDefault();qpIngestTrainingPair(this)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Brand *</label><input name="brand" required placeholder="Homegrown"></div>
        <div><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Parent company</label><input name="parent_company" placeholder="Thrive Restaurant Group"></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Source location (optional)</label><input name="source_location" placeholder="Homegrown — Wichita East"></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:11px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">Notes (optional)</label><textarea name="notes" rows="2" placeholder="e.g. owner-supplied decorative pendants in main dining"></textarea></div>
      </div>

      <h4 style="margin:14px 0 6px;">Blueprints from prior location <span style="font-weight:400;color:#888;font-size:12px;">(PDF or images, multi-page OK)</span></h4>
      <input type="file" id="qp-ing-bp" accept="image/*,application/pdf" multiple onchange="qpStageFiles(this.files,'blueprints');this.value='';qpRefreshIngestChips()">
      <div id="qp-ing-bp-chips" class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;"></div>

      <h4 style="margin:14px 0 6px;">Final invoice <span style="font-weight:400;color:#888;font-size:12px;">(PDF, image, or CSV — what you actually sent the customer)</span></h4>
      <input type="file" id="qp-ing-inv" accept="image/*,application/pdf,.csv,text/csv" multiple onchange="qpStageFiles(this.files,'invoice');this.value='';qpRefreshIngestChips()">
      <div id="qp-ing-inv-chips" class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;"></div>

      <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-accent" id="qp-ingest-btn">Ingest training pair</button>
      </div>
    </form>
  `);
  qpRefreshIngestChips();
}

function qpRefreshIngestChips(){
  const bp = $('qp-ing-bp-chips');
  const inv = $('qp-ing-inv-chips');
  if(bp) bp.innerHTML = qpStaged.blueprints.map((f,i)=>`<div class="chip">${esc(f.name||f.kind)} <button class="x" onclick="qpStaged.blueprints.splice(${i},1);qpRefreshIngestChips()">×</button></div>`).join('') || '<span style="color:#888;font-size:12px;">No files</span>';
  if(inv) inv.innerHTML = qpStaged.invoice.map((f,i)=>`<div class="chip">${esc(f.name||f.kind)} <button class="x" onclick="qpStaged.invoice.splice(${i},1);qpRefreshIngestChips()">×</button></div>`).join('') || '<span style="color:#888;font-size:12px;">No files</span>';
}

// ── PAGE ENTRY POINT ───────────────────────────────────────
async function quotepro(content, actions){
  // Lazy-load templates if not already
  if(!QP_TEMPLATES.length) await sbLoadQuoteTemplates();
  // Reuse existing quotes load if not already loaded
  if(typeof QUOTES !== 'undefined' && QUOTES.length === 0 && typeof sbLoadQuotes === 'function'){
    try { await sbLoadQuotes(); } catch {}
  }
  qpRender();
  // Right-side page actions (above-content)
  if(actions){
    actions.innerHTML = `
      <button class="btn btn-sm" onclick="qpSetTab('templates');qpOpenIngestModal()">+ Train</button>
      <button class="btn btn-accent btn-sm" onclick="qpSetTab('build');qpClearDraftSilent();qpRender()">+ New quote</button>
    `;
  }
  // Bind cell edits after render — observer pattern
  const obs = new MutationObserver(() => qpBindCells());
  const root = $('pg-content');
  if(root){ obs.observe(root, { childList:true, subtree:true }); qpBindCells(); }
}

function qpClearDraftSilent(){
  qpDraft = qpEmptyDraft();
  qpStaged = { blueprints:[], invoice:[] };
}

// Expose globals expected by the shell
window.quotepro = quotepro;
window.qpSetTab = qpSetTab;
window.qpRender = qpRender;
window.qpStageFiles = qpStageFiles;
window.qpClearStaged = qpClearStaged;
window.qpRunTakeoff = qpRunTakeoff;
window.qpExportCsv = qpExportCsv;
window.qpPrintInvoice = qpPrintInvoice;
window.qpSaveDraftQuote = qpSaveDraftQuote;
window.qpAddLine = qpAddLine;
window.qpRemoveLine = qpRemoveLine;
window.qpClearDraft = qpClearDraft;
window.qpClearDraftSilent = qpClearDraftSilent;
window.qpOnTemplateChange = qpOnTemplateChange;
window.qpUseTemplate = qpUseTemplate;
window.qpReopenSaved = qpReopenSaved;
window.qpViewTemplate = qpViewTemplate;
window.qpConfirmDeleteTemplate = qpConfirmDeleteTemplate;
window.qpOpenIngestModal = qpOpenIngestModal;
window.qpIngestTrainingPair = qpIngestTrainingPair;
window.qpRefreshIngestChips = qpRefreshIngestChips;
window.qpStaged = qpStaged;
window.qpDraft = qpDraft;
window.QP_TEMPLATES = QP_TEMPLATES;
window.qpTemplateFilter = qpTemplateFilter;

console.log('[quote_pro] module loaded');
