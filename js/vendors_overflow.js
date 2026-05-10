// ── VENDORS OVERFLOW MODULE (extracted from index.html at v6.11.1) ──
// renderChangelog, revertChange, openVP, liveScore, exportCSV, changelog page

function renderChangelog(container) {
  const log = getChangeLog();

  container.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Vendor Ranking Changelog</span>
        <span class="sm muted">${log.length} changes tracked</span>
      </div>
      <div style="padding:20px;">
        ${log.length === 0 ? `
          <div style="text-align:center;padding:40px;color:var(--text-3);">
            <div style="font-size:32px;margin-bottom:12px;">📝</div>
            <p style="font-size:14px;">No changes recorded yet</p>
            <p class="sm">Changes will appear here when vendors are edited</p>
          </div>
        ` : `
          <div style="display:grid;gap:12px;">
            ${log.map(change => `
              <div style="padding:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface2);">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                  <div>
                    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(change.vendorName)}</div>
                    <div style="font-size:12px;color:var(--text-3);">${new Date(change.date).toLocaleString()} • ${esc(change.user)}</div>
                  </div>
                  <button class="btn btn-sm btn-outline" onclick="revertChange(${change.id})">Revert</button>
                </div>
                <div style="font-size:13px;padding:10px;background:var(--surface);border-radius:var(--radius-sm);">
                  <strong>${change.category}:</strong>
                  <span style="color:var(--accent);text-decoration:line-through;">${esc(change.oldValue || '—')}</span>
                  → <span style="color:var(--green);font-weight:600;">${esc(change.newValue || '—')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function revertChange(changeId) {
  if (!confirm('Revert this change?')) return;

  const log = getChangeLog();
  const changeIdx = log.findIndex(c => c.id === changeId);
  if (changeIdx === -1) return;

  const change = log[changeIdx];
  const vendor = VD.find(v => v.id === change.vendorId);
  if (!vendor) return;

  // Revert the change
  if (change.category === 'Name') vendor.name = change.oldValue;
  else if (change.category === 'Rep Group') vendor.rep = change.oldValue;
  else if (change.category === 'Status') vendor.status = change.oldValue;

  // Remove from log
  log.splice(changeIdx, 1);
  saveChangeLog(log);

  renderVendors($('pg-content'));
  toast('Change reverted', 'ok');
}


function openVP(id){
  const v=VD.find(x=>x.id===id);if(!v)return;
  const ws=weightedScore(v);const t=tier(ws);const sc=scoredCount(v.scores);
  const meta=v._meta||{};
  const p=$('vp');
  p.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;">
          <h2 style="font-size:18px;font-weight:700;margin:0;">${esc(v.name)}</h2>
          ${tierBadge(t)}
          ${ws!==null?`<span class="mono fw6" style="color:${scoreColor(ws)};">${ws}</span>`:''}
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
          ${v.rep?`<span class="badge bg-gray">${esc(v.rep)}</span>`:''}
          <span class="badge bg-gray">${sc}/${CAT_DEFS.length} scored</span>
          ${v.sales?.t?`<span class="badge bg-gray">5-Yr: ${fmt$(v.sales.t)}</span>`:''}
        </div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="closeVP()">✕ Close</button>
    </div>

    <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">SCORES (0–10)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
      ${CAT_DEFS.map(c=>{
        const s=v.scores[c.key];
        const val=typeof s==='number'?s:(s==='na'?'na':'');
        const m=meta[c.key];
        const just=m?.j||'';
        return`<div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:12px;font-weight:600;">${c.label}</span>
            <span class="sm muted">wt: ${c.weight}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input class="score-input" style="width:48px;padding:4px 6px;border:1.5px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:13px;text-align:center;" value="${val}" placeholder="—" onchange="liveScore(${v.id},'${c.key}',this.value)">
            <div class="sbar" style="flex:1;"><div class="sbar-fill" style="width:${typeof s==='number'?s*10:0}%;background:${scoreColor(s)};"></div></div>
          </div>
          ${just?`<div style="font-size:10px;color:var(--text-3);margin-top:3px;line-height:1.3;max-height:28px;overflow:hidden;">${esc(just)}</div>`:''}
        </div>`;
      }).join('')}
    </div>

    ${v.sales?.t?`
    <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">SALES HISTORY</div>
    <div style="display:flex;gap:12px;margin-bottom:20px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
      ${['2021','2022','2023','2024','2025'].map(y=>{
        const val=v.sales[y]||0;
        const maxV=Math.max(...['2021','2022','2023','2024','2025'].map(y2=>v.sales[y2]||0),1);
        return`<div style="flex:1;text-align:center;">
          <div style="height:50px;display:flex;align-items:flex-end;justify-content:center;">
            <div style="width:100%;max-width:28px;height:${Math.max(val/maxV*100,3)}%;background:var(--blue);border-radius:3px 3px 0 0;opacity:.6;"></div>
          </div>
          <div class="mono" style="font-size:10px;margin-top:2px;">${y}</div>
          <div class="mono" style="font-size:10px;color:var(--text-3);">${val?fmt$(val):'—'}</div>
        </div>`;
      }).join('')}
      <div style="text-align:center;border-left:1px solid var(--border);padding-left:12px;">
        <div class="stat-label" style="font-size:10px;">Total</div>
        <div class="mono fw6" style="font-size:14px;">${fmt$(v.sales.t)}</div>
        ${v.sales.tr?`<div style="font-size:11px;color:${v.sales.tr>0?'var(--green)':'var(--accent)'};">${v.sales.tr>0?'▲':'▼'} ${(Math.abs(v.sales.tr)*100).toFixed(0)}%</div>`:''}
      </div>
    </div>`:''}

    <button class="btn btn-accent btn-sm" onclick="saveVP(${v.id})" style="margin-right:8px;">Save Scores</button>
    <button class="btn btn-outline btn-sm" onclick="closeVP()">Close</button>
  `;
  p.classList.add('on');
}

function liveScore(id,cat,val){
  const v=VD.find(x=>x.id===id);if(!v)return;
  const oldVal=v.scores[cat];
  if(val===''||val===null){v.scores[cat]=null;}
  else if(val==='na'||val==='NA'||val==='N/A'){v.scores[cat]='na';}
  else{
    const n=parseFloat(val);
    if(isNaN(n)||n<0||n>10){toast('Score must be 0–10, blank, or NA','err');return;}
    v.scores[cat]=n;
  }
  const catLabel=CAT_DEFS.find(c=>c.key===cat)?.label||cat;
  logChange(v.name,catLabel,oldVal,v.scores[cat]);
  openVP(id);
}

function saveVP(id){
  const v=VD.find(x=>x.id===id);if(!v)return;
  toast('Scores saved for '+v.name,'ok');
  log('grn','✏️',`Scores updated: ${v.name} (${scoredCount(v.scores)}/${CAT_DEFS.length})`,'Just now');
}

function closeVP(){$('vp').classList.remove('on');}

// ── CSV EXPORT ────────────────────────────────────────────
function exportCSV(){
  const hdrs=['Vendor','Status','Rep Group','Tier','Weighted Score','Categories Scored','5-Yr Sales',...CAT_DEFS.map(c=>c.label)];
  const rows=VD.map(v=>{
    const ws=weightedScore(v);const t=tier(ws);
    return[v.name,v.status,v.rep,t||'',ws||'',scoredCount(v.scores),v.sales?.t||'',...CAT_DEFS.map(c=>{const s=v.scores[c.key];return s===null?'':s==='na'?'N/A':s;})];
  });
  csvDownload([hdrs,...rows], `VendorRanking_${new Date().toISOString().slice(0,10)}.csv`);
}

// ── CSV IMPORT ────────────────────────────────────────────
function openCSVImport(){
  openModal('Import Vendor Scores CSV',`
    <div id="dz" style="border:2px dashed var(--border);border-radius:var(--radius);padding:40px;text-align:center;cursor:pointer;"
     ondragover="event.preventDefault();this.classList.add('drag');" ondragleave="this.classList.remove('drag');"
     ondrop="handleDrop(event)" onclick="$('csv-file').click()">
      <div style="font-size:32px;margin-bottom:8px;">📂</div>
      <p style="font-size:14px;font-weight:600;">Drop CSV here or click to browse</p>
      <p class="sm muted">Must include Vendor column + score category columns</p>
      <input type="file" id="csv-file" accept=".csv" style="display:none;" onchange="handleFileSelect(this)">
    </div>
    <div id="csv-preview" style="margin-top:16px;"></div>`);
}
function handleDrop(e){e.preventDefault();$('dz')?.classList.remove('drag');const f=e.dataTransfer.files[0];if(f)parseCSVFile(f);}
function handleFileSelect(inp){const f=inp.files[0];if(f)parseCSVFile(f);}
function parseCSVFile(file){
  const reader=new FileReader();
  reader.onload=function(e){
    const lines=e.target.result.split('\n').map(l=>l.split(',').map(c=>c.replace(/^"|"$/g,'').trim()));
    if(lines.length<2){toast('CSV too short','err');return;}
    const hdrs=lines[0];
    let matched=0,skipped=0;
    for(let i=1;i<lines.length;i++){
      const row=lines[i];if(!row[0])continue;
      const vn=row[0].toUpperCase().trim();
      const v=VD.find(x=>x.name.toUpperCase()===vn);
      if(!v){skipped++;continue;}
      matched++;
      hdrs.forEach((h,j)=>{
        if(j===0)return;
        const cat=CAT_DEFS.find(c=>c.label.toLowerCase()===h.toLowerCase()||c.key.toLowerCase()===h.toLowerCase());
        if(!cat)return;
        const val=row[j]?.trim();
        if(!val||val===''||val==='—')return;
        if(val.toUpperCase()==='N/A'||val.toUpperCase()==='NA'){v.scores[cat.key]='na';return;}
        const n=parseFloat(val);
        if(!isNaN(n)&&n>=0&&n<=10)v.scores[cat.key]=n;
      });
    }
    toast(`Imported: ${matched} matched, ${skipped} skipped`,'ok');
    closeModal();renderVendors($('pg-content'));
  };
  reader.readAsText(file);
}

function openAddVendor(){
  openModal('Add New Vendor',`
    <div class="fg"><label>Vendor Name</label><input id="av-n" placeholder="Enter vendor name"></div>
    <div class="fg"><label>Rep Group</label><input id="av-r" placeholder="e.g. Martin Design Group"></div>
    <div class="fg"><label>Status</label><select id="av-s"><option>Active</option><option>Inactive</option></select></div>
  `,`<button class="btn btn-accent" onclick="confirmAddV()">Add Vendor</button>`);
}
function confirmAddV(){
  const name=$('av-n')?.value?.trim();
  if(!name){toast('Name required','err');return;}
  if(VD.find(v=>v.name.toUpperCase()===name.toUpperCase())){toast('Vendor already exists','err');return;}
  const emptyScores=Object.fromEntries(CAT_DEFS.map(c=>[c.key,null]));
  VD.push({id:Date.now(),name,cat:'',rep:$('av-r')?.value||'',status:$('av-s')?.value||'Active',scores:emptyScores,notes:'',raw:'',_meta:{},sales:{}});
  log('blu','◇',`New vendor added: ${name}`,'Just now');
  closeModal();toast('Vendor added — fill scores in Edit panel','ok');
  renderVendors($('pg-content'));
}

// ── CHANGE LOG ────────────────────────────────────────────
function changelog(el){
  el.innerHTML=`
  <div class="card">
    <div class="card-hd"><span class="card-title">Vendor Score Change Log</span>
      ${CHANGELOG.length?`<button class="btn btn-sm btn-outline" onclick="exportChangeLog()">⬇ Export</button>`:''}
    </div>
    <div class="card-body">
      ${CHANGELOG.length===0?`<div class="empty-state" style="text-align:center;padding:40px;color:var(--text-3);"><div style="font-size:32px;margin-bottom:10px;">📋</div><h3 style="font-size:15px;font-weight:600;">No changes yet</h3><p style="font-size:13px;">Every score change made in Vendor Ranking will appear here automatically.</p></div>`
      :CHANGELOG.map(c=>`<div class="cl-row">
        <div class="cl-time">${new Date(c.ts).toLocaleString()}</div>
        <div style="flex:1;">
          <span class="cl-user">${esc(c.vendor)}</span>
          <span class="muted"> — ${esc(c.cat)}: </span>
          <span style="color:var(--accent);font-weight:600;">${dispScore(c.oldVal)}</span>
          <span class="muted"> → </span>
          <span style="color:var(--green);font-weight:600;">${dispScore(c.newVal)}</span>
          <span class="muted sm"> · by ${esc(c.user)}</span>
        </div>
      </div>`).join('')}
    </div>
    ${CHANGELOG.length?`<div class="card-foot muted sm">${CHANGELOG.length} changes this session</div>`:''}
  </div>`;
}
function exportChangeLog(){
  const hdrs=['Timestamp','Vendor','Category','Old Value','New Value','Changed By'];
  const rows=CHANGELOG.map(c=>[new Date(c.ts).toLocaleString(),c.vendor,c.cat,c.oldVal??'',c.newVal??'',c.user]);
  csvDownload([hdrs,...rows], `ChangeLog_${new Date().toISOString().slice(0,10)}.csv`);
}

