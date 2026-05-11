// ── BULK VENDOR OPERATIONS ──
// New sub-tab on the Vendor Ranking page. Multi-select vendors via checkboxes
// and apply bulk actions: assign rep, set tier override, mark inactive,
// set parent company, clear rep. Direct help for M19 (257 vendors with no
// rep group). Persists via the existing vendor_overrides table for tier +
// inactive; rep + parent are written through their existing handlers.
register({ name: 'bulk_vendor_ops', provides: ['bulk_vendor_ops','renderBulkVendorOps'], consumes: ['VD','sbFetch','sbConfigured','CU','$','esc','toast'] });

let bvFilter = {q:'', tier:'', repState:'', parent:''};
let bvSelected = new Set();   // vendor ids

function renderBulkVendorOps(c){
  if(!c) return;
  if(typeof VD === 'undefined' || !VD.length){
    c.innerHTML = `<div class="card" style="padding:24px;text-align:center;color:var(--text-3);">No vendors loaded yet.</div>`;
    return;
  }

  const reps = [...new Set(VD.map(v => v.rep || v.rg).filter(Boolean))].sort();
  const parents = (typeof PARENT_COMPANIES !== 'undefined') ? PARENT_COMPANIES : [];

  const q = (bvFilter.q||'').toLowerCase();
  const filtered = VD.filter(v => {
    if(bvFilter.tier && (typeof computeVendorTier === 'function') && computeVendorTier(v) !== bvFilter.tier) return false;
    if(bvFilter.repState === 'has' && !v.rep && !v.rg) return false;
    if(bvFilter.repState === 'none' && (v.rep || v.rg)) return false;
    if(bvFilter.repState === 'inactive' && !v.inactive) return false;
    if(bvFilter.repState === 'active' && v.inactive) return false;
    if(bvFilter.parent === '__none' && (typeof VENDOR_PARENTS !== 'undefined') && VENDOR_PARENTS[v.id]) return false;
    if(bvFilter.parent && bvFilter.parent !== '__none' && (typeof VENDOR_PARENTS !== 'undefined') && VENDOR_PARENTS[v.id] !== bvFilter.parent) return false;
    if(q){
      const hay = `${v.n||''} ${v.rep||''} ${v.rg||''} ${v.pc||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  // Stats
  const noRepAll = VD.filter(v => !v.rep && !v.rg && !v.inactive).length;
  const noRepFilt = filtered.filter(v => !v.rep && !v.rg).length;
  const inactiveFilt = filtered.filter(v => v.inactive).length;

  c.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Bulk Vendor Operations.</strong> Filter vendors, multi-select with checkboxes, then apply a bulk action. Useful for clearing M19's unassigned-rep backlog (${noRepAll} vendors with no rep, currently). All actions are confirmed before applying. Tier + inactive write to <code>vendor_overrides</code>; rep + parent assignment write to their respective handlers.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card"><div class="stat-label">Total vendors</div><div class="stat-value">${VD.length.toLocaleString()}</div><div class="stat-sub">${VD.filter(v => !v.inactive).length} active</div></div>
      <div class="card stat-card"${noRepAll?` style="border-left:3px solid var(--accent);"`:''}><div class="stat-label">No Rep Assigned</div><div class="stat-value" style="color:${noRepAll?'var(--accent)':'var(--text)'};">${noRepAll}</div><div class="stat-sub">M19 backlog target</div></div>
      <div class="card stat-card"><div class="stat-label">Filtered</div><div class="stat-value">${filtered.length.toLocaleString()}</div><div class="stat-sub">${noRepFilt} no rep · ${inactiveFilt} inactive</div></div>
      <div class="card stat-card"${bvSelected.size?` style="border-left:3px solid var(--blue);"`:''}><div class="stat-label">Selected</div><div class="stat-value" style="color:${bvSelected.size?'var(--blue)':'var(--text)'};">${bvSelected.size}</div><div class="stat-sub">Click rows or "Select all"</div></div>
    </div>

    <div class="card mb16">
      <div class="card-hd">
        <span class="card-title">Filter & select</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input placeholder="Search name / rep / parent…" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:5px;width:200px;" value="${esc(bvFilter.q)}" oninput="bvFilter.q=this.value;clearTimeout(window._bvDeb);window._bvDeb=setTimeout(()=>renderBulkVendorOps($('vendor-section-content')),200)">
          <select style="padding:6px 8px;font-size:12px;" onchange="bvFilter.tier=this.value;renderBulkVendorOps($('vendor-section-content'))">
            <option value="">All tiers</option>
            <option value="A" ${bvFilter.tier==='A'?'selected':''}>Tier A</option>
            <option value="B" ${bvFilter.tier==='B'?'selected':''}>Tier B</option>
            <option value="C" ${bvFilter.tier==='C'?'selected':''}>Tier C</option>
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="bvFilter.repState=this.value;renderBulkVendorOps($('vendor-section-content'))">
            <option value="">All vendors</option>
            <option value="none" ${bvFilter.repState==='none'?'selected':''}>No rep assigned</option>
            <option value="has" ${bvFilter.repState==='has'?'selected':''}>Rep assigned</option>
            <option value="active" ${bvFilter.repState==='active'?'selected':''}>Active only</option>
            <option value="inactive" ${bvFilter.repState==='inactive'?'selected':''}>Inactive only</option>
          </select>
          ${parents.length ? `<select style="padding:6px 8px;font-size:12px;" onchange="bvFilter.parent=this.value;renderBulkVendorOps($('vendor-section-content'))">
            <option value="">All parents</option>
            <option value="__none" ${bvFilter.parent==='__none'?'selected':''}>No parent</option>
            ${parents.map(p=>`<option value="${esc(p.id)}" ${bvFilter.parent===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}
          </select>` : ''}
          <button class="btn btn-outline btn-sm" onclick="bvSelectAllFiltered()">Select all (${filtered.length})</button>
          <button class="btn btn-outline btn-sm" onclick="bvClearSelection()" ${bvSelected.size?'':'disabled'}>Clear</button>
        </div>
      </div>
      ${bvSelected.size > 0 ? `<div style="padding:12px 18px;background:var(--bg-2);border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <strong style="font-size:13px;">${bvSelected.size} selected — apply:</strong>
        <button class="btn btn-outline btn-sm" onclick="bvAction('assign_rep')">Assign rep</button>
        <button class="btn btn-outline btn-sm" onclick="bvAction('clear_rep')">Clear rep</button>
        <button class="btn btn-outline btn-sm" onclick="bvAction('set_tier')">Set tier override</button>
        <button class="btn btn-outline btn-sm" onclick="bvAction('mark_inactive')">Mark inactive</button>
        <button class="btn btn-outline btn-sm" onclick="bvAction('mark_active')">Mark active</button>
        ${parents.length ? `<button class="btn btn-outline btn-sm" onclick="bvAction('set_parent')">Set parent</button>
        <button class="btn btn-outline btn-sm" onclick="bvAction('clear_parent')">Clear parent</button>` : ''}
      </div>` : ''}
      <div class="tbl-wrap" style="max-height:calc(100vh - 460px);overflow-y:auto;">
        <table>
          <thead><tr>
            <th style="width:32px;"><input type="checkbox" ${filtered.length && filtered.every(v=>bvSelected.has(v.id))?'checked':''} onchange="bvToggleAllVisible(${JSON.stringify(filtered.map(v=>v.id)).replace(/"/g,'&quot;')}, this.checked)" title="Toggle all visible"></th>
            <th>Vendor</th><th>Tier</th><th>Tier Override</th><th>Rep</th><th>Parent</th><th>Status</th><th>Lifetime $</th>
          </tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3);">No vendors match the current filter.</td></tr>` : filtered.slice(0, 1000).map(v => {
              const tier = (typeof computeVendorTier === 'function') ? computeVendorTier(v) : '—';
              const parent = (typeof VENDOR_PARENTS !== 'undefined' && typeof PARENT_COMPANIES !== 'undefined')
                ? PARENT_COMPANIES.find(p => p.id === VENDOR_PARENTS[v.id])
                : null;
              const isSelected = bvSelected.has(v.id);
              return `<tr style="${isSelected?'background:rgba(37,99,235,0.08);':''}cursor:pointer;" onclick="bvToggle(${v.id})">
                <td onclick="event.stopPropagation();" style="width:32px;"><input type="checkbox" ${isSelected?'checked':''} onchange="bvToggle(${v.id})"></td>
                <td style="font-weight:600;color:var(--accent);">${esc(v.n)}</td>
                <td><span class="badge" style="background:${tier==='A'?'var(--green)':tier==='B'?'var(--blue)':'var(--text-3)'};color:#fff;font-size:10px;">${tier}</span></td>
                <td class="sm">${v.tier_override?`<span class="badge" style="background:var(--accent);color:#fff;font-size:10px;">${v.tier_override}</span>`:'<span class="muted">—</span>'}</td>
                <td class="sm">${esc(v.rep||v.rg||'')||'<span class="muted">—</span>'}</td>
                <td class="sm">${parent?esc(parent.name):'<span class="muted">—</span>'}</td>
                <td class="sm">${v.inactive?'<span class="badge" style="background:var(--text-3);color:#fff;font-size:10px;">INACTIVE</span>':'<span class="badge" style="background:var(--green);color:#fff;font-size:10px;">ACTIVE</span>'}</td>
                <td class="mono sm">${v.sales?.t?'$'+Math.round(v.sales.t).toLocaleString():'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > 1000 ? `<div class="muted sm" style="padding:8px 14px;">Showing first 1000 of ${filtered.length} matching rows.</div>` : ''}
    </div>
  `;
}

function bvToggle(vendorId){
  if(bvSelected.has(vendorId)) bvSelected.delete(vendorId);
  else bvSelected.add(vendorId);
  renderBulkVendorOps($('vendor-section-content'));
}

function bvToggleAllVisible(ids, checked){
  ids.forEach(id => checked ? bvSelected.add(id) : bvSelected.delete(id));
  renderBulkVendorOps($('vendor-section-content'));
}

function bvSelectAllFiltered(){
  const q = (bvFilter.q||'').toLowerCase();
  VD.filter(v => {
    if(bvFilter.tier && (typeof computeVendorTier === 'function') && computeVendorTier(v) !== bvFilter.tier) return false;
    if(bvFilter.repState === 'has' && !v.rep && !v.rg) return false;
    if(bvFilter.repState === 'none' && (v.rep || v.rg)) return false;
    if(bvFilter.repState === 'inactive' && !v.inactive) return false;
    if(bvFilter.repState === 'active' && v.inactive) return false;
    if(bvFilter.parent === '__none' && (typeof VENDOR_PARENTS !== 'undefined') && VENDOR_PARENTS[v.id]) return false;
    if(bvFilter.parent && bvFilter.parent !== '__none' && (typeof VENDOR_PARENTS !== 'undefined') && VENDOR_PARENTS[v.id] !== bvFilter.parent) return false;
    if(q){
      const hay = `${v.n||''} ${v.rep||''} ${v.rg||''} ${v.pc||''}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }).forEach(v => bvSelected.add(v.id));
  renderBulkVendorOps($('vendor-section-content'));
}

function bvClearSelection(){
  bvSelected.clear();
  renderBulkVendorOps($('vendor-section-content'));
}

function bvAction(kind){
  if(!bvSelected.size){ toast('No vendors selected','err'); return; }
  const reps = [...new Set(VD.map(v => v.rep || v.rg).filter(Boolean))].sort();
  const parents = (typeof PARENT_COMPANIES !== 'undefined') ? PARENT_COMPANIES : [];

  if(kind === 'assign_rep'){
    openModal('Assign Rep', `
      <div class="fg"><label>Rep / Rep group name (free-text or pick existing)</label>
        <input id="bv-rep" list="bv-rep-list" placeholder="Type or select…" autofocus>
        <datalist id="bv-rep-list">${reps.map(r=>`<option value="${esc(r)}">`).join('')}</datalist>
      </div>
      <div class="muted sm" style="margin-top:6px;">Will assign this rep to all <strong>${bvSelected.size}</strong> selected vendors. Existing rep values will be overwritten.</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-accent" onclick="bvApplyRep()">Assign</button>
      </div>
    `);
    return;
  }

  if(kind === 'clear_rep'){
    if(!confirm(`Clear rep assignment from ${bvSelected.size} vendors? This sets rep + rg fields to empty.`)) return;
    bvApplyRepRaw('');
    return;
  }

  if(kind === 'set_tier'){
    openModal('Set Tier Override', `
      <div class="fg"><label>Tier override</label>
        <select id="bv-tier" autofocus>
          <option value="">(auto — clear override)</option>
          <option value="A">A — Full score</option>
          <option value="B">B — Light score</option>
          <option value="C">C — Hide from main lists</option>
        </select>
      </div>
      <div class="muted sm" style="margin-top:6px;">Will write to vendor_overrides.tier_override on all <strong>${bvSelected.size}</strong> selected vendors. Computed tier (from scores) will still be visible; override takes precedence.</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-accent" onclick="bvApplyTier()">Apply</button>
      </div>
    `);
    return;
  }

  if(kind === 'mark_inactive'){
    openModal('Mark Inactive', `
      <div class="fg"><label>Reason (optional)</label>
        <input id="bv-reason" placeholder="e.g. Discontinued, Replaced by Vendor X" autofocus>
      </div>
      <div class="muted sm" style="margin-top:6px;">Will write inactive=true on all <strong>${bvSelected.size}</strong> selected vendors. They'll be hidden from main scoring views but stay searchable.</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-accent" onclick="bvApplyInactive(true)">Mark Inactive</button>
      </div>
    `);
    return;
  }

  if(kind === 'mark_active'){
    if(!confirm(`Mark ${bvSelected.size} vendors as active? Clears the inactive flag + reason.`)) return;
    bvApplyInactive(false);
    return;
  }

  if(kind === 'set_parent'){
    if(!parents.length){ toast('No parent companies defined','err'); return; }
    openModal('Set Parent Company', `
      <div class="fg"><label>Parent company</label>
        <select id="bv-parent" autofocus>
          ${parents.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}
        </select>
      </div>
      <div class="muted sm" style="margin-top:6px;">Will assign all <strong>${bvSelected.size}</strong> selected vendors to this parent company.</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-accent" onclick="bvApplyParent()">Apply</button>
      </div>
    `);
    return;
  }

  if(kind === 'clear_parent'){
    if(!confirm(`Clear parent company assignment from ${bvSelected.size} vendors?`)) return;
    bvApplyParentRaw(null);
    return;
  }
}

async function bvApplyRep(){
  const val = ($('bv-rep')?.value || '').trim();
  if(!val){ toast('Type a rep name','err'); return; }
  closeModal();
  bvApplyRepRaw(val);
}

async function bvApplyRepRaw(val){
  toast(`Updating ${bvSelected.size} vendors…`);
  let n = 0;
  for(const id of bvSelected){
    const v = VD.find(x => x.id === id);
    if(!v) continue;
    v.rep = val || '';
    v.rg = val || '';
    if(typeof sbSaveVendorOverride === 'function'){
      try { await sbSaveVendorOverride(id, {custom_rep: val || null}, (typeof CU!=='undefined'?CU?.email:null)); } catch(e){}
    }
    n++;
  }
  if(typeof sbAuditLog === 'function') sbAuditLog('bulk_assign_rep', 'vendors', {count: n, rep: val});
  bvSelected.clear();
  renderBulkVendorOps($('vendor-section-content'));
  toast(`Updated ${n} vendor${n===1?'':'s'}`,'ok');
}

async function bvApplyTier(){
  const val = $('bv-tier')?.value || '';
  closeModal();
  toast(`Updating ${bvSelected.size} vendors…`);
  let n = 0;
  for(const id of bvSelected){
    const v = VD.find(x => x.id === id);
    if(!v) continue;
    if(val) v.tier_override = val;
    else delete v.tier_override;
    if(typeof sbSaveVendorOverride === 'function'){
      try { await sbSaveVendorOverride(id, {tier_override: val || null}, (typeof CU!=='undefined'?CU?.email:null)); } catch(e){}
    }
    n++;
  }
  if(typeof sbAuditLog === 'function') sbAuditLog('bulk_set_tier', 'vendors', {count: n, tier: val||'auto'});
  bvSelected.clear();
  renderBulkVendorOps($('vendor-section-content'));
  toast(`Updated ${n} vendor${n===1?'':'s'}`,'ok');
}

async function bvApplyInactive(isInactive){
  const reason = $('bv-reason')?.value?.trim() || null;
  closeModal();
  toast(`Updating ${bvSelected.size} vendors…`);
  let n = 0;
  for(const id of bvSelected){
    const v = VD.find(x => x.id === id);
    if(!v) continue;
    v.inactive = isInactive;
    if(typeof sbSaveVendorOverride === 'function'){
      try { await sbSaveVendorOverride(id, {inactive: isInactive, inactive_reason: isInactive ? reason : null}, (typeof CU!=='undefined'?CU?.email:null)); } catch(e){}
    }
    n++;
  }
  if(typeof sbAuditLog === 'function') sbAuditLog(isInactive?'bulk_mark_inactive':'bulk_mark_active', 'vendors', {count: n, reason});
  bvSelected.clear();
  renderBulkVendorOps($('vendor-section-content'));
  toast(`Updated ${n} vendor${n===1?'':'s'}`,'ok');
}

async function bvApplyParent(){
  const val = $('bv-parent')?.value;
  if(!val){ toast('Pick a parent','err'); return; }
  closeModal();
  bvApplyParentRaw(val);
}

async function _bvSaveParent(vendorId, parentId){
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return false;
  try{
    if(parentId){
      await sbFetch('/vendor_parent_assignments?on_conflict=vendor_id', {
        method: 'POST',
        headers: {'Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify({vendor_id: vendorId, parent_id: parentId, updated_at: new Date().toISOString()})
      });
    } else {
      await sbFetch(`/vendor_parent_assignments?vendor_id=eq.${encodeURIComponent(vendorId)}`, {
        method: 'DELETE',
        headers: {'Prefer':'return=minimal'}
      });
    }
    return true;
  }catch(e){ console.warn('[bulk] parent save failed:', e.message); return false; }
}

async function bvApplyParentRaw(parentId){
  if(typeof VENDOR_PARENTS === 'undefined'){
    toast('Parent companies not loaded','err');
    return;
  }
  toast(`Updating ${bvSelected.size} vendors…`);
  let n = 0;
  for(const id of bvSelected){
    if(parentId) VENDOR_PARENTS[id] = parentId;
    else delete VENDOR_PARENTS[id];
    await _bvSaveParent(id, parentId);
    n++;
  }
  if(typeof sbAuditLog === 'function') sbAuditLog(parentId?'bulk_set_parent':'bulk_clear_parent', 'vendors', {count: n, parent_id: parentId});
  bvSelected.clear();
  renderBulkVendorOps($('vendor-section-content'));
  toast(`Updated ${n} vendor${n===1?'':'s'}`,'ok');
}
