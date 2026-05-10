// ── REPORTS / EXPORT CENTER ──
// Single page for downloading any dataset as CSV. Pure-compute over already-
// loaded module globals — no schema, no API. Useful for accounting handoffs,
// supplier bulk-update CSVs (e.g. Eugene's meta-description sheet), BI tools,
// and ad-hoc analysis.

function reports(c, actions){
  if(!c) return;
  const all = collectReportDefs();

  if(actions){
    actions.innerHTML = `<button class="btn btn-outline btn-sm" onclick="exportAllReports()" title="Download every report as a single zipped CSV bundle">Export all</button>`;
  }

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Reports Center.</strong> Download any dataset as a CSV. Files use UTF-8 encoding with quoted strings for fields containing commas, quotes, or newlines. Reports reflect what's currently loaded in your session — refresh if you've made recent edits in another tab.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Reports Available</div><div class="stat-value">${all.filter(r => r.count > 0).length}<span style="font-size:14px;color:var(--text-3);"> / ${all.length}</span></div><div class="stat-sub">${all.filter(r => r.count === 0).length} empty in this session</div></div>
      <div class="card stat-card"><div class="stat-label">Total Rows</div><div class="stat-value">${all.reduce((s,r)=>s+r.count,0).toLocaleString()}</div><div class="stat-sub">Across every dataset</div></div>
      <div class="card stat-card"><div class="stat-label">Largest Dataset</div><div class="stat-value" style="font-size:18px;">${all.slice().sort((a,b)=>b.count-a.count)[0]?.label || '—'}</div><div class="stat-sub">${all.slice().sort((a,b)=>b.count-a.count)[0]?.count?.toLocaleString() || 0} rows</div></div>
      <div class="card stat-card"><div class="stat-label">Generated</div><div class="stat-value" style="font-size:18px;">${new Date().toLocaleDateString()}</div><div class="stat-sub">${new Date().toLocaleTimeString()}</div></div>
    </div>
    <div class="card">
      <div class="card-hd"><span class="card-title">Available Reports</span></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Report</th><th>Description</th><th>Rows</th><th></th></tr></thead>
          <tbody>
            ${all.map(r => `<tr style="${r.count===0?'opacity:0.5;':''}">
              <td style="font-weight:600;">${esc(r.label)}</td>
              <td class="sm" style="color:var(--text-2);">${esc(r.description)}</td>
              <td class="mono">${r.count.toLocaleString()}</td>
              <td style="text-align:right;"><button class="btn btn-outline btn-sm" ${r.count===0?'disabled':''} onclick="downloadReport('${r.key}')">Download CSV</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function collectReportDefs(){
  const defs = [
    {key:'vendors', label:'Vendors', description:'Vendor directory · scores · tier · sales totals', count: (typeof VD!=='undefined'?VD.length:0)},
    {key:'customers', label:'Customers', description:'Customer profiles · contact · RFM segments', count: (typeof CUSTOMERS!=='undefined'?CUSTOMERS.length:0)},
    {key:'deals', label:'Sales Pipeline', description:'All deals across every stage incl. archive', count: (typeof DEALS!=='undefined'?Object.values(DEALS).reduce((s,a)=>s+(a||[]).length,0):0)},
    {key:'quotes', label:'Quotes', description:'Quote headers (line items in separate report)', count: (typeof QUOTES!=='undefined'?QUOTES.length:0)},
    {key:'quote_lines', label:'Quote Lines', description:'Individual line items across all quotes', count: (typeof QUOTES!=='undefined'?QUOTES.reduce((s,q)=>s+(q.lineItems||[]).length,0):0)},
    {key:'inventory', label:'Inventory', description:'SKU-level inventory with qty, cost, list price', count: (typeof INVENTORY!=='undefined'?INVENTORY.length:0)},
    {key:'jobs', label:'Jobs', description:'Project work tracking', count: (typeof JOBS!=='undefined'?JOBS.length:0)},
    {key:'pos', label:'Purchase Orders', description:'PO headers (line items in separate report)', count: (typeof POS!=='undefined'?POS.length:0)},
    {key:'po_lines', label:'PO Lines', description:'Individual line items across all POs', count: (typeof POS!=='undefined' && typeof PO_LINES!=='undefined'?Object.values(PO_LINES).reduce((s,a)=>s+(a||[]).length,0):0)},
    {key:'trade_partners', label:'Trade Partners', description:'Designers · contractors · architects', count: (typeof TRADE_PARTNERS!=='undefined'?TRADE_PARTNERS.length:0)},
    {key:'warranty', label:'Warranty Claims', description:'RMAs · status · severity', count: (typeof WARRANTY_CLAIMS!=='undefined'?WARRANTY_CLAIMS.length:0)},
    {key:'showrooms', label:'Showroom Displays', description:'Display program tracking', count: (typeof SHOWROOM_DISPLAYS!=='undefined'?SHOWROOM_DISPLAYS.length:0)},
    {key:'deliveries', label:'Deliveries', description:'Schedule · driver · status', count: (typeof DELIVERIES!=='undefined'?DELIVERIES.length:0)},
    {key:'coop', label:'Co-op Funds', description:'Open · claimed · deadlines', count: (typeof COOP_FUNDS!=='undefined'?COOP_FUNDS.length:0)},
    {key:'alerts', label:'Alerts', description:'All auto-generated alerts', count: (typeof ALERTS!=='undefined'?ALERTS.length:0)},
    {key:'campaigns', label:'Marketing Campaigns', description:'Campaigns with attribution metrics', count: (typeof MARKETING_CAMPAIGNS!=='undefined'?MARKETING_CAMPAIGNS.length:0)},
    {key:'articles', label:'Knowledge Articles', description:'Internal docs · vendor playbooks', count: (typeof ARTICLES!=='undefined'?ARTICLES.length:0)},
    {key:'changelog', label:'Vendor Changelog', description:'Score changes · note edits · tier changes', count: (typeof CHANGELOG!=='undefined'?CHANGELOG.length:0)},
    {key:'demand_reorder', label:'Demand · Reorder List', description:'reorder_now + reorder_soon SKUs with suggested qty', count: (typeof computeDemandForecast==='function'?computeDemandForecast().filter(r=>r.kind==='reorder_now'||r.kind==='reorder_soon').length:0)},
  ];
  return defs;
}

function downloadReport(key){
  const rows = buildReportRows(key);
  if(!rows || rows.length < 2){ toast('Nothing to export','err'); return; }
  const n = csvDownload(rows, `${key}_${new Date().toISOString().slice(0,10)}.csv`);
  if(typeof sbAuditLog === 'function') sbAuditLog('report_export', 'reports', {key, row_count: n});
  toast(`Exported ${n} rows`,'ok');
}

function buildReportRows(key){
  switch(key){
    case 'vendors': {
      const out = [['vendor_id','name','status','rep_group','rep_contact','rep_email','tier_override','parent_company','website','description','inactive','sales_total','sales_2024','sales_2025']];
      (VD||[]).forEach(v => out.push([v.id, v.n, v.st||'', v.rg||'', v.rc||'', v.re||'', v.tier_override||'', v.pc||'', v.web||'', v.desc||'', v.inactive?1:0, v.sales?.t||0, v.sales?.['2024']||'', v.sales?.['2025']||'']));
      return out;
    }
    case 'customers': {
      const out = [['id','name','company','email','phone','address','city','state','zip','customer_type','lead_source','tags','notes','created_at']];
      (CUSTOMERS||[]).forEach(c => out.push([c.id, c.name, c.company||'', c.email||'', c.phone||'', c.address||'', c.city||'', c.state||'', c.zip||'', c.customer_type||'', c.lead_source||'', (c.tags||[]).join('|'), c.notes||'', c.created_at||'']));
      return out;
    }
    case 'deals': {
      const out = [['id','stage','title','company','contact','value','probability','expected_close','lead_source','project_type','created_at','updated_at','notes']];
      Object.keys(DEALS||{}).forEach(stage => (DEALS[stage]||[]).forEach(d => {
        out.push([d.id, stage, d.title||'', d.company||'', d.contact||'', d.value||'', d.probability||'', d.close||'', d.lead_source||'', d.project_type||'', d.created_at||'', d.updated_at||'', d.notes||'']);
      }));
      return out;
    }
    case 'quotes': {
      const out = [['quote_number','customer','project','contact','date','total','line_count','notes']];
      (QUOTES||[]).forEach(q => out.push([q.id, q.customer||'', q.project||'', q.contact||'', q.date||'', q.total||0, (q.lineItems||[]).length, q.notes||'']));
      return out;
    }
    case 'quote_lines': {
      const out = [['quote_number','line_no','vendor','description','qty','unit_price','ext_price','category']];
      (QUOTES||[]).forEach(q => (q.lineItems||[]).forEach((l,i) => {
        out.push([q.id, i+1, l.vendorName||'', l.desc||'', l.qty||0, l.price||0, (l.qty||0)*(l.price||0), l.cat||'']);
      }));
      return out;
    }
    case 'inventory': {
      const out = [['sku','vendor','description','category','qty_on_hand','qty_committed','qty_on_order','qty_available','reorder_point','unit_cost','list_price','location','bin','upc','import_source']];
      (INVENTORY||[]).forEach(r => out.push([r.sku, r.vendor_name||'', r.description||'', r.category||'', r.qty_on_hand||0, r.qty_committed||0, r.qty_on_order||0, r.qty_available||0, r.reorder_point??'', r.unit_cost??'', r.list_price??'', r.location||'', r.bin||'', r.upc||'', r.import_source||'']));
      return out;
    }
    case 'jobs': {
      const out = [['job_number','project_name','customer_name','status','priority','start_date','due_date','completed_at','quote_id','notes']];
      (JOBS||[]).forEach(j => out.push([j.job_number||'', j.project_name||'', j.customer_name||'', j.status||'', j.priority||'', j.start_date||'', j.due_date||'', j.completed_at||'', j.quote_id||'', j.notes||'']));
      return out;
    }
    case 'pos': {
      const out = [['po_number','vendor','status','order_date','expected_date','received_date','subtotal','tax','freight','total','related_quote_id','related_job_id','notes']];
      (POS||[]).forEach(p => out.push([p.po_number||'', p.vendor_name||'', p.status||'', p.order_date||'', p.expected_date||'', p.received_date||'', p.subtotal||0, p.tax||0, p.freight||0, p.total||0, p.related_quote_id||'', p.related_job_id||'', p.notes||'']));
      return out;
    }
    case 'po_lines': {
      const out = [['po_number','line_no','sku','description','qty','qty_received','unit_cost','ext_cost','notes']];
      (POS||[]).forEach(p => ((PO_LINES||{})[p.id]||[]).forEach(l => {
        out.push([p.po_number||'', l.line_no||'', l.sku||'', l.description||'', l.qty||0, l.qty_received||0, l.unit_cost||0, l.ext_cost||0, l.notes||'']);
      }));
      return out;
    }
    case 'trade_partners': {
      const out = [['name','company','type','status','email','phone','address','trade_license','rating','preferred_terms','related_customer_id','notes']];
      (TRADE_PARTNERS||[]).forEach(t => out.push([t.name||'', t.company||'', t.type||'', t.status||'', t.email||'', t.phone||'', t.address||'', t.trade_license||'', t.rating??'', t.preferred_terms||'', t.related_customer_id||'', t.notes||'']));
      return out;
    }
    case 'warranty': {
      const out = [['claim_number','vendor','customer_name','status','severity','product_description','issue_description','warranty_expires','resolution_date','cost_to_us','linked_quote_id','notes']];
      (WARRANTY_CLAIMS||[]).forEach(w => out.push([w.claim_number||'', w.vendor_name||'', w.customer_name||'', w.status||'', w.severity||'', w.product_description||'', w.issue_description||'', w.warranty_expires||'', w.resolution_date||'', w.cost_to_us||'', w.linked_quote_id||'', w.notes||'']));
      return out;
    }
    case 'showrooms': {
      const out = [['display_name','vendor','status','location','install_date','expires_date','removed_date','participation_cost','coop_value','retail_value','linked_coop_fund_id','contract_terms','sku_list','notes']];
      (SHOWROOM_DISPLAYS||[]).forEach(d => out.push([d.display_name||'', d.vendor_name||'', d.status||'', d.location||'', d.install_date||'', d.expires_date||'', d.removed_date||'', d.participation_cost||'', d.coop_value||'', d.retail_value||'', d.linked_coop_fund_id||'', d.contract_terms||'', (d.sku_list||[]).join('|'), d.notes||'']));
      return out;
    }
    case 'deliveries': {
      const out = [['delivery_number','customer_name','status','scheduled_date','time_window','driver','vehicle','address','items_summary','weight','signature_required','signed_by','delivered_at','linked_job_id','linked_quote_id','linked_po_id','failure_reason']];
      (DELIVERIES||[]).forEach(d => out.push([d.delivery_number||'', d.customer_name||'', d.status||'', d.scheduled_date||'', d.time_window||'', d.driver||'', d.vehicle||'', d.address||'', d.items_summary||'', d.weight||'', d.signature_required?1:0, d.signed_by||'', d.delivered_at||'', d.linked_job_id||'', d.linked_quote_id||'', d.linked_po_id||'', d.failure_reason||'']));
      return out;
    }
    case 'coop': {
      const out = [['vendor','fund_type','amount','currency','earned_period','deadline','status','notes','created_at']];
      (COOP_FUNDS||[]).forEach(f => {
        const v = (VD||[]).find(x => x.id === f.vendor_id);
        out.push([v?.n || '', f.fund_type||'', f.amount||0, f.currency||'USD', f.earned_period||'', f.deadline||'', f.status||'', f.notes||'', f.created_at||'']);
      });
      return out;
    }
    case 'alerts': {
      const out = [['type','severity','status','title','body','source_id','created_at','actioned_at']];
      (ALERTS||[]).forEach(a => out.push([a.type||'', a.severity||'', a.status||'', a.title||'', a.body||'', a.source_id||'', a.created_at||'', a.actioned_at||'']));
      return out;
    }
    case 'campaigns': {
      const out = [['name','type','status','start_date','end_date','budget','spent','leads','deals_won','revenue_attributed','linked_vendor_id','discount_pct','discount_amount','promo_skus','notes']];
      (MARKETING_CAMPAIGNS||[]).forEach(c => out.push([c.name||'', c.type||'', c.status||'', c.start_date||'', c.end_date||'', c.budget||0, c.spent||0, c.leads||0, c.deals_won||0, c.revenue_attributed||0, c.linked_vendor_id||'', c.discount_pct||'', c.discount_amount||'', c.promo_skus||'', c.notes||'']));
      return out;
    }
    case 'articles': {
      const out = [['title','slug','category','tags','pinned','body_chars','updated_at']];
      (ARTICLES||[]).forEach(a => out.push([a.title||'', a.slug||'', a.category||'', (a.tags||[]).join('|'), a.pinned?1:0, (a.body||'').length, a.updated_at||'']));
      return out;
    }
    case 'changelog': {
      const out = [['vendor','category','old_value','new_value','user','timestamp']];
      (CHANGELOG||[]).forEach(c => out.push([c.vendor||'', c.cat||'', c.oldVal||'', c.newVal||'', c.user||'', c.ts||'']));
      return out;
    }
    case 'demand_reorder': {
      const out = [['recommendation','sku','vendor','description','velocity_per_week','qty_available','qty_on_order','weeks_of_stock','suggested_qty','unit_cost','suggested_total']];
      (computeDemandForecast()||[]).filter(r => r.kind === 'reorder_now' || r.kind === 'reorder_soon').forEach(r => {
        out.push([r.kind, r.sku, r.vendor_name, r.description, r.velocity_per_week.toFixed(2), r.qty_available, r.qty_on_order, r.weeks_of_stock!=null?r.weeks_of_stock.toFixed(1):'', r.suggested_qty, r.unit_cost!=null?r.unit_cost.toFixed(2):'', (r.suggested_qty*(r.unit_cost||0)).toFixed(2)]);
      });
      return out;
    }
  }
  return null;
}

function exportAllReports(){
  const all = collectReportDefs().filter(r => r.count > 0);
  if(!all.length){ toast('No data to export','err'); return; }
  if(!confirm(`Download ${all.length} CSV file${all.length===1?'':'s'}? Your browser may prompt for permission to save multiple files.`)) return;
  let i = 0;
  const next = () => {
    if(i >= all.length){
      toast(`Exported ${all.length} reports`,'ok');
      return;
    }
    downloadReport(all[i].key);
    i++;
    setTimeout(next, 250);
  };
  next();
}
