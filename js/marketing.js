// ── 5.12 MARKETING HUB (marketing_campaigns + marketing_assets — see sql/M29_marketing_schema.sql) ──
// Replaces the static placeholder marketing() function. 4 tabs:
//   Overview — stats + recent campaigns + ROI breakdown
//   Campaigns — full CRUD across campaign + promotion + event types
//   Assets — content library: images, documents, videos, links
//   Site Audit — preserved from prior placeholder (site issues + agency status)

let MARKETING_CAMPAIGNS = [];
let MARKETING_ASSETS = [];
let mktTab = 'overview';
let mktCampFilter = {q:'', type:'', status:''};
let mktAssetFilter = {q:'', type:''};

async function sbLoadMarketingCampaigns(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/marketing_campaigns?select=id,name,type,status,start_date,end_date,budget,spent,channels,audience,related_vendor_id,related_vendor_name,discount_pct,discount_amount,promo_skus,leads_generated,deals_won,revenue_attributed,notes,owner_id,created_at,updated_at&order=updated_at.desc&limit=500');
    MARKETING_CAMPAIGNS = Array.isArray(rows) ? rows : [];
    console.log(`[marketing_campaigns] Loaded ${MARKETING_CAMPAIGNS.length} campaigns`);
    return MARKETING_CAMPAIGNS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[marketing_campaigns] table not yet created — run sql/M29_marketing_schema.sql');
    } else {
      console.warn('[sb] Load marketing_campaigns failed:', e.message);
    }
    return false;
  }
}

async function sbLoadMarketingAssets(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/marketing_assets?select=id,name,type,url,description,tags,related_vendor_id,related_vendor_name,related_campaign_id,file_size_kb,thumbnail_url,created_at,updated_at&order=updated_at.desc&limit=500');
    MARKETING_ASSETS = Array.isArray(rows) ? rows : [];
    console.log(`[marketing_assets] Loaded ${MARKETING_ASSETS.length} assets`);
    return MARKETING_ASSETS.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[marketing_assets] table not yet created — run sql/M29_marketing_schema.sql');
    } else {
      console.warn('[sb] Load marketing_assets failed:', e.message);
    }
    return false;
  }
}

async function sbSaveMarketingCampaign(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      name: rec.name,
      type: rec.type || null,
      status: rec.status || 'planned',
      start_date: rec.start_date || null,
      end_date: rec.end_date || null,
      budget: rec.budget == null || rec.budget === '' ? null : Number(rec.budget),
      spent: rec.spent == null || rec.spent === '' ? null : Number(rec.spent),
      channels: rec.channels || null,
      audience: rec.audience || null,
      related_vendor_id: rec.related_vendor_id || null,
      related_vendor_name: rec.related_vendor_name || null,
      discount_pct: rec.discount_pct == null || rec.discount_pct === '' ? null : Number(rec.discount_pct),
      discount_amount: rec.discount_amount == null || rec.discount_amount === '' ? null : Number(rec.discount_amount),
      promo_skus: rec.promo_skus || null,
      leads_generated: rec.leads_generated == null || rec.leads_generated === '' ? null : Number(rec.leads_generated),
      deals_won: rec.deals_won == null || rec.deals_won === '' ? null : Number(rec.deals_won),
      revenue_attributed: rec.revenue_attributed == null || rec.revenue_attributed === '' ? null : Number(rec.revenue_attributed),
      notes: rec.notes || null,
      owner_id: (CU?.user_id) || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/marketing_campaigns?on_conflict=id' : '/marketing_campaigns';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save marketing_campaign failed:', e.message); return false; }
}

async function sbDeleteMarketingCampaign(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/marketing_campaigns?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete marketing_campaign failed:', e.message); return false; }
}

async function sbSaveMarketingAsset(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      name: rec.name,
      type: rec.type || null,
      url: rec.url || null,
      description: rec.description || null,
      tags: rec.tags || null,
      related_vendor_id: rec.related_vendor_id || null,
      related_vendor_name: rec.related_vendor_name || null,
      related_campaign_id: rec.related_campaign_id || null,
      file_size_kb: rec.file_size_kb == null || rec.file_size_kb === '' ? null : Number(rec.file_size_kb),
      thumbnail_url: rec.thumbnail_url || null,
      updated_at: new Date().toISOString(),
      created_by: (CU?.user_id) || null
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/marketing_assets?on_conflict=id' : '/marketing_assets';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save marketing_asset failed:', e.message); return false; }
}

async function sbDeleteMarketingAsset(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/marketing_assets?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete marketing_asset failed:', e.message); return false; }
}

function marketing(el){
  const tabs = [
    {id:'overview', label:'Overview'},
    {id:'campaigns', label:'Campaigns'},
    {id:'assets', label:'Asset Library'},
    {id:'audit', label:'Site Audit'}
  ];
  el.innerHTML = `
    <div class="card mb16">
      <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);overflow-x:auto;">
        ${tabs.map(t => `<div onclick="mktTab='${t.id}';marketing($('pg-content'))" style="padding:12px 20px;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid ${mktTab===t.id?'var(--accent)':'transparent'};color:${mktTab===t.id?'var(--accent)':'var(--text-2)'};white-space:nowrap;">${t.label}</div>`).join('')}
      </div>
    </div>
    <div id="mkt-content"></div>
  `;
  const c = $('mkt-content');
  if(mktTab === 'overview') renderMktOverview(c);
  else if(mktTab === 'campaigns') renderMktCampaigns(c);
  else if(mktTab === 'assets') renderMktAssets(c);
  else if(mktTab === 'audit') renderMktAudit(c);
}

function renderMktOverview(c){
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);
  let active = 0, totalBudget = 0, totalSpent = 0, totalRevenue = 0, totalLeads = 0, totalDealsWon = 0;
  const byType = {};
  MARKETING_CAMPAIGNS.forEach(c => {
    if(c.status === 'active') active++;
    if(c.status !== 'cancelled'){
      totalBudget += Number(c.budget)||0;
      totalSpent += Number(c.spent)||0;
      totalRevenue += Number(c.revenue_attributed)||0;
      totalLeads += Number(c.leads_generated)||0;
      totalDealsWon += Number(c.deals_won)||0;
    }
    if(c.type) byType[c.type] = (byType[c.type]||0)+1;
  });
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) : null;
  const recent = [...MARKETING_CAMPAIGNS].sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||'')).slice(0,8);

  c.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Active Campaigns</div><div class="stat-value">${active}</div><div class="stat-sub">${MARKETING_CAMPAIGNS.length} total · ${MARKETING_ASSETS.length} assets</div></div>
      <div class="card stat-card"><div class="stat-label">Budget vs Spent</div><div class="stat-value">$${(totalSpent/1000).toFixed(1)}K</div><div class="stat-sub">of $${(totalBudget/1000).toFixed(1)}K planned${totalBudget?` · ${Math.round(totalSpent/totalBudget*100)}%`:''}</div></div>
      <div class="card stat-card"${roi!=null && roi>=1?` style="border-left:3px solid var(--green);"`:roi!=null && roi<0?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">Marketing ROI</div><div class="stat-value" style="color:${roi!=null && roi>=1?'var(--green)':roi!=null && roi<0?'var(--accent)':'var(--text)'};">${roi!=null?(roi>0?'+':'')+(roi*100).toFixed(0)+'%':'—'}</div><div class="stat-sub">$${(totalRevenue/1000).toFixed(1)}K attributed</div></div>
      <div class="card stat-card"><div class="stat-label">Leads / Deals</div><div class="stat-value">${totalLeads} / ${totalDealsWon}</div><div class="stat-sub">${totalLeads>0?Math.round(totalDealsWon/totalLeads*100)+'% conversion':'no leads logged'}</div></div>
    </div>
    <div class="g2 mb16">
      <div class="card">
        <div class="card-hd"><span class="card-title">By Type</span></div>
        <div style="padding:14px 18px;font-size:12px;">
          ${Object.keys(byType).length === 0 ? '<div class="muted">No campaigns yet.</div>' : Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([type,n]) => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light);">
              <span style="text-transform:capitalize;">${esc(type.replace('_',' '))}</span>
              <span class="mono fw6">${n}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-hd"><span class="card-title">Recent Activity</span></div>
        <div style="padding:6px 0;max-height:260px;overflow-y:auto;">
          ${recent.length === 0 ? '<div class="muted" style="padding:14px 18px;">No activity yet.</div>' : recent.map(r => {
            const sb = {planned:'bg-gray', active:'bg-green', complete:'bg-blue', cancelled:'bg-gray', paused:'bg-yellow'}[r.status]||'bg-gray';
            return `<div style="padding:8px 18px;border-bottom:1px solid var(--border-light);font-size:12px;cursor:pointer;" onclick="mktTab='campaigns';marketing($('pg-content'));setTimeout(()=>openCampaignEdit('${r.id}'),80)">
              <div style="display:flex;align-items:center;gap:8px;"><span class="badge ${sb}" style="font-size:10px;">${esc(r.status)}</span><strong>${esc(r.name)}</strong></div>
              <div class="muted sm" style="margin-top:2px;">${esc((r.type||'').replace('_',' '))} · ${r.start_date?esc(r.start_date):'no dates'}${r.end_date?' → '+esc(r.end_date):''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderMktCampaigns(c){
  const q = (mktCampFilter.q||'').toLowerCase();
  const filtered = MARKETING_CAMPAIGNS.filter(r => {
    if(mktCampFilter.type && r.type !== mktCampFilter.type) return false;
    if(mktCampFilter.status && r.status !== mktCampFilter.status) return false;
    if(q){
      const hay = `${r.name||''} ${r.audience||''} ${r.notes||''} ${r.related_vendor_name||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => {
    const order = {active:0, planned:1, paused:2, complete:3, cancelled:4};
    const so = (order[a.status]??9) - (order[b.status]??9);
    if(so) return so;
    return (a.start_date||'').localeCompare(b.start_date||'');
  });

  c.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Campaigns · ${filtered.length}${filtered.length!==MARKETING_CAMPAIGNS.length?` of ${MARKETING_CAMPAIGNS.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="mkt-q" placeholder="Search…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:200px;" value="${esc(mktCampFilter.q)}" oninput="mktCampFilter.q=this.value;clearTimeout(window._mktDeb);window._mktDeb=setTimeout(()=>renderMktCampaigns($('mkt-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="mktCampFilter.type=this.value;renderMktCampaigns($('mkt-content'))">
            <option value="">All types</option>
            ${['email','print','digital','social','event','promo','co_op','other'].map(t=>`<option value="${t}" ${mktCampFilter.type===t?'selected':''}>${t.replace('_',' ')}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="mktCampFilter.status=this.value;renderMktCampaigns($('mkt-content'))">
            <option value="">All statuses</option>
            ${['planned','active','complete','paused','cancelled'].map(s=>`<option value="${s}" ${mktCampFilter.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-accent btn-sm" onclick="openCampaignEdit(null)">+ New</button>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Dates</th><th>Budget</th><th>Spent</th><th>Revenue</th><th>ROI</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">${MARKETING_CAMPAIGNS.length===0?'No campaigns yet. Click "+ New" to log one (run M29 SQL first if save fails).':'No campaigns match the current filter.'}</td></tr>` : filtered.map(r => {
              const sb = {planned:'bg-gray', active:'bg-green', complete:'bg-blue', cancelled:'bg-gray', paused:'bg-yellow'}[r.status]||'bg-gray';
              const spent = Number(r.spent)||0;
              const rev = Number(r.revenue_attributed)||0;
              const roi = spent > 0 ? ((rev - spent)/spent) : null;
              const roiColor = roi==null?'var(--text-3)':roi>=1?'var(--green)':roi>=0?'var(--blue)':'var(--accent)';
              return `<tr style="cursor:pointer;${['cancelled','complete'].includes(r.status)?'opacity:0.7;':''}" onclick="openCampaignEdit('${r.id}')">
                <td style="font-weight:600;color:var(--accent);">${esc(r.name)}</td>
                <td><span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc((r.type||'').replace('_',' '))}</span></td>
                <td><span class="badge ${sb}" style="font-size:10px;">${esc(r.status)}</span></td>
                <td class="sm mono">${r.start_date?esc(r.start_date):'—'}${r.end_date?' → '+esc(r.end_date):''}</td>
                <td class="mono sm">${r.budget!=null?'$'+Number(r.budget).toLocaleString():'<span class="muted">—</span>'}</td>
                <td class="mono sm">${spent?'$'+spent.toLocaleString():'<span class="muted">—</span>'}</td>
                <td class="mono sm">${rev?'$'+rev.toLocaleString():'<span class="muted">—</span>'}</td>
                <td class="mono fw6 sm" style="color:${roiColor};">${roi!=null?(roi>0?'+':'')+(roi*100).toFixed(0)+'%':'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openCampaignEdit(campaignId){
  const isNew = !campaignId;
  const r = isNew ? {status:'planned', type:'email'} : MARKETING_CAMPAIGNS.find(x => x.id === campaignId);
  if(!r){ toast('Campaign not found','err'); return; }
  const vendorOptions = (typeof VD !== 'undefined') ? VD.filter(v => !v.inactive).slice().sort((a,b)=>a.n.localeCompare(b.n)).map(v => `<option value="${v.id}" data-name="${esc(v.n)}" ${String(r.related_vendor_id)===String(v.id)?'selected':''}>${esc(v.n)}</option>`).join('') : '';
  const channelsStr = (r.channels||[]).join(', ');
  const skusStr = (r.promo_skus||[]).join(', ');
  openModal((isNew?'New':'Edit')+' Campaign', `
    <div class="frow">
      <div class="fcol field"><label>Name *</label><input id="mc-n" value="${esc(r.name||'')}"></div>
      <div class="fcol field"><label>Type</label>
        <select id="mc-t">${['email','print','digital','social','event','promo','co_op','other'].map(t=>`<option value="${t}" ${r.type===t?'selected':''}>${t.replace('_',' ')}</option>`).join('')}</select>
      </div>
      <div class="fcol field"><label>Status</label>
        <select id="mc-s">${['planned','active','complete','paused','cancelled'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Start Date</label><input id="mc-sd" type="date" value="${esc(r.start_date||'')}"></div>
      <div class="fcol field"><label>End Date</label><input id="mc-ed" type="date" value="${esc(r.end_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Budget ($)</label><input id="mc-bud" type="number" step="0.01" value="${r.budget!=null?r.budget:''}"></div>
      <div class="fcol field"><label>Spent ($)</label><input id="mc-spent" type="number" step="0.01" value="${r.spent!=null?r.spent:''}"></div>
    </div>
    <div class="fg"><label>Channels (comma-separated)</label><input id="mc-ch" value="${esc(channelsStr)}" placeholder="Klaviyo, Facebook, Instagram, Google Ads"></div>
    <div class="fg"><label>Audience</label><input id="mc-aud" value="${esc(r.audience||'')}" placeholder="VIP customers, prospects, designers"></div>
    <div class="fg"><label>Linked Vendor (for co-op / vendor-funded campaigns)</label>
      <select id="mc-v"><option value="">— none —</option>${vendorOptions}</select>
    </div>
    <details ${r.type==='promo' || r.discount_pct || skusStr ? 'open' : ''} style="margin:10px 0;border:1px solid var(--border);border-radius:6px;padding:8px 12px;">
      <summary style="cursor:pointer;font-weight:600;font-size:12px;">Promotion details (if type = promo)</summary>
      <div class="frow" style="margin-top:8px;">
        <div class="fcol field"><label>Discount %</label><input id="mc-dp" type="number" step="0.1" min="0" max="100" value="${r.discount_pct!=null?r.discount_pct:''}"></div>
        <div class="fcol field"><label>Discount $</label><input id="mc-da" type="number" step="0.01" value="${r.discount_amount!=null?r.discount_amount:''}"></div>
      </div>
      <div class="fg"><label>Promo SKUs (comma-separated)</label><input id="mc-skus" value="${esc(skusStr)}" placeholder="HK-12345, QZ-67890"></div>
    </details>
    <details ${r.leads_generated || r.deals_won || r.revenue_attributed ? 'open' : ''} style="margin:10px 0;border:1px solid var(--border);border-radius:6px;padding:8px 12px;">
      <summary style="cursor:pointer;font-weight:600;font-size:12px;">Attribution / Results</summary>
      <div class="frow" style="margin-top:8px;">
        <div class="fcol field"><label>Leads Generated</label><input id="mc-leads" type="number" min="0" value="${r.leads_generated!=null?r.leads_generated:''}"></div>
        <div class="fcol field"><label>Deals Won</label><input id="mc-dw" type="number" min="0" value="${r.deals_won!=null?r.deals_won:''}"></div>
        <div class="fcol field"><label>Revenue Attributed ($)</label><input id="mc-rev" type="number" step="0.01" value="${r.revenue_attributed!=null?r.revenue_attributed:''}"></div>
      </div>
    </details>
    <div class="fg"><label>Notes</label><textarea id="mc-notes" rows="2">${esc(r.notes||'')}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteCampaignConfirm('${campaignId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveCampaign(${isNew?'null':`'${campaignId}'`})">Save</button>
    </div>
  `);
}

async function saveCampaign(campaignId){
  const name = $('mc-n')?.value?.trim();
  if(!name){ toast('Name required','err'); return; }
  const vId = $('mc-v').value || null;
  const vName = vId ? ($('mc-v').options[$('mc-v').selectedIndex]?.getAttribute('data-name') || '') : null;
  const channels = ($('mc-ch').value||'').split(',').map(s=>s.trim()).filter(Boolean);
  const promo_skus = ($('mc-skus').value||'').split(',').map(s=>s.trim()).filter(Boolean);
  const rec = {
    id: campaignId || undefined,
    name,
    type: $('mc-t').value,
    status: $('mc-s').value,
    start_date: $('mc-sd').value || null,
    end_date: $('mc-ed').value || null,
    budget: $('mc-bud').value || null,
    spent: $('mc-spent').value || null,
    channels: channels.length ? channels : null,
    audience: $('mc-aud').value || null,
    related_vendor_id: vId,
    related_vendor_name: vName,
    discount_pct: $('mc-dp').value || null,
    discount_amount: $('mc-da').value || null,
    promo_skus: promo_skus.length ? promo_skus : null,
    leads_generated: $('mc-leads').value || null,
    deals_won: $('mc-dw').value || null,
    revenue_attributed: $('mc-rev').value || null,
    notes: $('mc-notes').value || null
  };
  const saved = await sbSaveMarketingCampaign(rec);
  if(!saved){ toast('Save failed — table may not exist (run M29 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = MARKETING_CAMPAIGNS.findIndex(x => x.id === saved.id);
    if(idx >= 0) MARKETING_CAMPAIGNS[idx] = saved; else MARKETING_CAMPAIGNS.unshift(saved);
  } else {
    await sbLoadMarketingCampaigns();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(campaignId?'campaign_edit':'campaign_create', 'marketing', {campaign_id: campaignId||saved?.id, name, type: rec.type});
  closeModal();
  marketing($('pg-content'));
  toast('Campaign '+(campaignId?'updated':'added'),'ok');
}

async function deleteCampaignConfirm(campaignId){
  const r = MARKETING_CAMPAIGNS.find(x => x.id === campaignId);
  if(!r) return;
  if(!confirm(`Delete campaign "${r.name}"?`)) return;
  await sbDeleteMarketingCampaign(campaignId);
  MARKETING_CAMPAIGNS = MARKETING_CAMPAIGNS.filter(x => x.id !== campaignId);
  if(typeof sbAuditLog==='function') sbAuditLog('campaign_delete', 'marketing', {campaign_id: campaignId, name: r.name});
  closeModal();
  marketing($('pg-content'));
  toast('Campaign deleted','ok');
}

function renderMktAssets(c){
  const q = (mktAssetFilter.q||'').toLowerCase();
  const filtered = MARKETING_ASSETS.filter(a => {
    if(mktAssetFilter.type && a.type !== mktAssetFilter.type) return false;
    if(q){
      const hay = `${a.name||''} ${a.description||''} ${(a.tags||[]).join(' ')} ${a.related_vendor_name||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  c.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Asset Library · ${filtered.length}${filtered.length!==MARKETING_ASSETS.length?` of ${MARKETING_ASSETS.length}`:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="ast-q" placeholder="Search name / desc / tag…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:220px;" value="${esc(mktAssetFilter.q)}" oninput="mktAssetFilter.q=this.value;clearTimeout(window._astDeb);window._astDeb=setTimeout(()=>renderMktAssets($('mkt-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="mktAssetFilter.type=this.value;renderMktAssets($('mkt-content'))">
            <option value="">All types</option>
            ${['image','document','video','link','template','other'].map(t=>`<option value="${t}" ${mktAssetFilter.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <button class="btn btn-accent btn-sm" onclick="openAssetEdit(null)">+ New Asset</button>
        </div>
      </div>
      <div style="padding:14px;max-height:calc(100vh - 360px);overflow-y:auto;">
        ${filtered.length === 0 ? `<div style="padding:36px;text-align:center;color:var(--text-3);">${MARKETING_ASSETS.length===0?'No assets yet. Click "+ New Asset" to add one (run M29 SQL first if save fails).':'No assets match the current filter.'}</div>` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
            ${filtered.map(a => {
              const icon = {image:'🖼', document:'📄', video:'🎬', link:'🔗', template:'📋', other:'📁'}[a.type]||'📁';
              return `<div onclick="openAssetEdit('${a.id}')" style="border:1px solid var(--border);border-radius:6px;padding:12px;cursor:pointer;background:var(--surface);">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="font-size:20px;">${icon}</span>
                  <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(a.type||'')}</span>
                </div>
                <div style="font-weight:600;font-size:12px;line-height:1.3;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.name)}</div>
                ${a.description?`<div class="muted sm" style="font-size:11px;line-height:1.3;height:30px;overflow:hidden;">${esc(a.description.slice(0,80))}</div>`:''}
                ${a.url?`<div style="margin-top:6px;"><a href="${esc(a.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation();" style="color:var(--accent);font-size:10px;text-decoration:none;">Open ↗</a></div>`:''}
                ${(a.tags||[]).length?`<div style="margin-top:4px;">${(a.tags||[]).slice(0,3).map(t=>`<span class="badge bg-gray" style="font-size:9px;margin-right:3px;">${esc(t)}</span>`).join('')}</div>`:''}
              </div>`;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function openAssetEdit(assetId){
  const isNew = !assetId;
  const a = isNew ? {type:'document'} : MARKETING_ASSETS.find(x => x.id === assetId);
  if(!a){ toast('Asset not found','err'); return; }
  const vendorOptions = (typeof VD !== 'undefined') ? VD.filter(v => !v.inactive).slice().sort((a,b)=>a.n.localeCompare(b.n)).map(v => `<option value="${v.id}" data-name="${esc(v.n)}" ${String(a.related_vendor_id)===String(v.id)?'selected':''}>${esc(v.n)}</option>`).join('') : '';
  const campaignOptions = MARKETING_CAMPAIGNS.slice().sort((x,y)=>(x.name||'').localeCompare(y.name||'')).map(c => `<option value="${c.id}" ${a.related_campaign_id===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
  const tagsStr = (a.tags||[]).join(', ');
  openModal((isNew?'New':'Edit')+' Asset', `
    <div class="frow">
      <div class="fcol field"><label>Name *</label><input id="ma-n" value="${esc(a.name||'')}"></div>
      <div class="fcol field"><label>Type</label>
        <select id="ma-t">${['image','document','video','link','template','other'].map(t=>`<option value="${t}" ${a.type===t?'selected':''}>${t}</option>`).join('')}</select>
      </div>
    </div>
    <div class="fg"><label>URL *</label><input id="ma-url" value="${esc(a.url||'')}" placeholder="https://drive.google.com/... or https://... "></div>
    <div class="fg"><label>Description</label><textarea id="ma-desc" rows="2">${esc(a.description||'')}</textarea></div>
    <div class="fg"><label>Tags (comma-separated)</label><input id="ma-tags" value="${esc(tagsStr)}" placeholder="instagram, fall-2026, hinkley"></div>
    <div class="frow">
      <div class="fcol field"><label>Linked Vendor</label>
        <select id="ma-v"><option value="">— none —</option>${vendorOptions}</select>
      </div>
      <div class="fcol field"><label>Linked Campaign</label>
        <select id="ma-c"><option value="">— none —</option>${campaignOptions}</select>
      </div>
    </div>
    <div class="fg"><label>Thumbnail URL (optional)</label><input id="ma-thumb" value="${esc(a.thumbnail_url||'')}"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteAssetConfirm('${assetId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveAsset(${isNew?'null':`'${assetId}'`})">Save</button>
    </div>
  `);
}

async function saveAsset(assetId){
  const name = $('ma-n')?.value?.trim();
  if(!name){ toast('Name required','err'); return; }
  const url = $('ma-url')?.value?.trim();
  if(!url){ toast('URL required','err'); return; }
  const vId = $('ma-v').value || null;
  const vName = vId ? ($('ma-v').options[$('ma-v').selectedIndex]?.getAttribute('data-name') || '') : null;
  const tags = ($('ma-tags').value||'').split(',').map(s=>s.trim()).filter(Boolean);
  const rec = {
    id: assetId || undefined,
    name,
    type: $('ma-t').value,
    url,
    description: $('ma-desc').value || null,
    tags: tags.length ? tags : null,
    related_vendor_id: vId,
    related_vendor_name: vName,
    related_campaign_id: $('ma-c').value || null,
    thumbnail_url: $('ma-thumb').value || null
  };
  const saved = await sbSaveMarketingAsset(rec);
  if(!saved){ toast('Save failed — table may not exist (run M29 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = MARKETING_ASSETS.findIndex(x => x.id === saved.id);
    if(idx >= 0) MARKETING_ASSETS[idx] = saved; else MARKETING_ASSETS.unshift(saved);
  } else {
    await sbLoadMarketingAssets();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(assetId?'asset_edit':'asset_create', 'marketing', {asset_id: assetId||saved?.id, name, type: rec.type});
  closeModal();
  marketing($('pg-content'));
  toast('Asset '+(assetId?'updated':'added'),'ok');
}

async function deleteAssetConfirm(assetId){
  const a = MARKETING_ASSETS.find(x => x.id === assetId);
  if(!a) return;
  if(!confirm(`Delete asset "${a.name}"?`)) return;
  await sbDeleteMarketingAsset(assetId);
  MARKETING_ASSETS = MARKETING_ASSETS.filter(x => x.id !== assetId);
  if(typeof sbAuditLog==='function') sbAuditLog('asset_delete', 'marketing', {asset_id: assetId, name: a.name});
  closeModal();
  marketing($('pg-content'));
  toast('Asset deleted','ok');
}

function renderMktAudit(c){
  // Preserved from prior placeholder. Static lists; not data-backed.
  c.innerHTML = `
    <div class="g2">
      <div class="card"><div class="card-hd"><span class="card-title">Site Issues (Audit 2026-03-18)</span></div><div class="card-body">
        ${[['Homepage H1','❌ Instagram hashtag — not a keyword heading','red'],['Product Titles','❌ Lead with brand name, not search query','red'],['Product Schema JSON-LD','❌ URL-encoded descriptions (%20) sitewide','red'],['AggregateRating','❌ Missing — no star ratings in Google','red'],['Featured Products Widget','⚠️ Empty tab on homepage','yellow'],['Canonical Tags','✅ Present','green'],['Add to Cart','✅ Functional','green'],['Alt Text','✅ Feed-populated','green']].map(([l,d,t])=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--border-light);font-size:13.5px;"><span class="badge bg-${t==='red'?'red':t==='yellow'?'yellow':'green'}" style="flex-shrink:0;">${t==='red'?'Issue':t==='yellow'?'Warn':'OK'}</span><div><div style="font-weight:600;">${l}</div><div style="color:var(--text-3);font-size:12px;">${d}</div></div></div>`).join('')}
      </div></div>
      <div class="card"><div class="card-hd"><span class="card-title">Agency Status</span></div><div class="card-body">
        <div style="margin-bottom:18px;"><div class="sec-label">Locally Lit</div><span class="badge bg-yellow">Active Consideration</span><p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-top:8px;">Scope split not finalized. AI-first posture approved.</p></div>
        <div><div class="sec-label">Agital (Theme Builders)</div><span class="badge bg-blue">Awaiting Reply</span><p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-top:8px;">Email sent 2026-03-18 re: 5 site issues. Items 1–2 need admin approval. Items 3–5 need template changes.</p></div>
      </div></div>
    </div>
  `;
}
