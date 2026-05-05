// ── MODULE MODES (rollout-state registry + per-user overrides) ──
// Loads module_modes.json on hydrate. Caches in window.MODULE_MODES.
// Per-user overrides live in localStorage (key: accentos_user_overrides).
// Owner-only Mgmt sub-tab lets you toggle module modes + manage overrides.

let MODULE_MODES = {version: 1, modules: {}, states: ['idea_only','brainstorming','planning','blocked','building','testing','live','deprecated','hidden']};
let USER_OVERRIDES = {version: 1, overrides: {}};

const _MODE_BADGES = {building: '🚧', testing: '🧪', deprecated: '⚠'};

const _STATE_COLORS = {
  idea_only:     {bg: '#f3f4f6', fg: '#6b7280'},
  brainstorming: {bg: '#fef3c7', fg: '#92400e'},
  planning:      {bg: '#dbeafe', fg: '#1e40af'},
  blocked:       {bg: '#fee2e2', fg: '#991b1b'},
  building:      {bg: '#e9d5ff', fg: '#6b21a8'},
  testing:       {bg: '#fed7aa', fg: '#9a3412'},
  live:          {bg: '#d1fae5', fg: '#065f46'},
  deprecated:    {bg: '#fee2e2', fg: '#7f1d1d'},
  hidden:        {bg: '#e5e7eb', fg: '#374151'}
};

async function sbLoadModuleModes(){
  try{
    const res = await fetch('module_modes.json?cb=' + Date.now());
    if(!res.ok) throw new Error('fetch failed: ' + res.status);
    const j = await res.json();
    MODULE_MODES = Object.assign({version:1, modules:{}, states:[]}, j);
    console.log(`[module_modes] Loaded ${Object.keys(MODULE_MODES.modules).length} modules`);
  }catch(e){
    console.warn('[module_modes] Load failed:', e.message);
  }
  // Load per-user overrides — try Supabase first (real cross-device), fall back to localStorage.
  try{
    const raw = localStorage.getItem('accentos_user_overrides');
    if(raw){ USER_OVERRIDES = JSON.parse(raw); }
  }catch(e){ console.warn('[module_modes] overrides parse failed:', e.message); }
  await _syncOverridesFromSupabase();
}

async function _syncOverridesFromSupabase(){
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return;
  if(typeof CU !== 'object' || !CU || !CU.user_id) return;
  try{
    const isOwner = CU.role === 'Owner';
    const url = isOwner
      ? '/user_module_overrides?select=user_id,module_key,access'
      : `/user_module_overrides?select=user_id,module_key,access&user_id=eq.${encodeURIComponent(CU.user_id)}`;
    const rows = await sbFetch(url);
    if(!Array.isArray(rows)) return;
    // Server is authoritative when present — replace local cache.
    const map = {};
    rows.forEach(r => {
      (map[r.user_id] = map[r.user_id] || {})[r.module_key] = r.access;
    });
    USER_OVERRIDES = {version: 1, overrides: map};
    try{ localStorage.setItem('accentos_user_overrides', JSON.stringify(USER_OVERRIDES)); }catch{}
    console.log(`[module_modes] Synced ${rows.length} overrides from Supabase`);
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[module_modes] user_module_overrides table not yet created — run sql/M40_user_module_overrides.sql for cross-device gating');
    } else {
      console.warn('[module_modes] sync failed:', e.message);
    }
  }
}

function _saveOverrides(){
  try{ localStorage.setItem('accentos_user_overrides', JSON.stringify(USER_OVERRIDES)); }
  catch(e){ console.warn('[module_modes] overrides save failed:', e.message); }
}

async function _saveOverrideRow(userId, key, access){
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return false;
  try{
    const granted_by = (typeof CU === 'object' && CU) ? CU.user_id : null;
    if(access){
      await sbFetch('/user_module_overrides?on_conflict=user_id,module_key', {
        method: 'POST',
        headers: {'Prefer': 'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify({user_id: userId, module_key: key, access, granted_by, updated_at: new Date().toISOString()})
      });
    } else {
      await sbFetch(`/user_module_overrides?user_id=eq.${encodeURIComponent(userId)}&module_key=eq.${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {'Prefer': 'return=minimal'}
      });
    }
    return true;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[module_modes] override save: table missing (M40 not run)');
    } else {
      console.warn('[module_modes] override save failed:', e.message);
    }
    return false;
  }
}

// ── Resolution ───────────────────────────────────────────
// canSeeModule(key, role?, userId?) — defaults to current user (CU).
function canSeeModule(key, role, userId){
  if(!key) return true;
  role = role || (typeof CU === 'object' && CU ? CU.role : null);
  userId = userId || (typeof CU === 'object' && CU ? CU.user_id : null);
  const meta = MODULE_MODES.modules[key];
  // No registry entry → fall back to existing role gating (don't break unknown modules).
  if(!meta) return true;
  const mode = meta.mode || 'live';
  if(mode === 'hidden') return false;

  // User-level override beats everything.
  const userMap = userId ? (USER_OVERRIDES.overrides||{})[userId] : null;
  const access = userMap ? userMap[key] : null;
  if(access === 'deny') return false;
  if(access === 'allow' || access === 'read_only') return true;

  // Mode-based gating.
  if(mode === 'live') return true;  // role gate handled by data-roles
  if(mode === 'testing') return role === 'Owner' || role === 'Admin';
  if(mode === 'building') return role === 'Owner';
  // idea_only, brainstorming, planning, blocked, deprecated — Owner only by default.
  return role === 'Owner';
}

function moduleModeBadge(key){
  const meta = MODULE_MODES.modules[key];
  if(!meta) return '';
  const b = _MODE_BADGES[meta.mode];
  return b ? `<span title="${esc(meta.mode)}" style="margin-left:6px;font-size:11px;">${b}</span>` : '';
}

// ── Sidebar gating ───────────────────────────────────────
// Walks every .ni element in the sidebar, extracts the module key from
// the onclick="goTo('...')" attribute, applies mode-based show/hide and
// injects a badge for non-live modules.
function applyModuleModesToSidebar(){
  document.querySelectorAll('.ni').forEach(el => {
    const onc = el.getAttribute('onclick') || '';
    const m = /goTo\(['"]([^'"]+)['"]\)/.exec(onc);
    if(!m) return;
    const key = m[1];
    const visible = canSeeModule(key);
    // Combine with role gating. data-roles already controls role visibility.
    // We only HIDE additionally based on mode; we don't override a role-hide.
    if(!visible){
      el.style.display = 'none';
    }
    // Badge injection (avoid duplicating)
    const meta = MODULE_MODES.modules[key];
    const existing = el.querySelector('.ni-mod-badge');
    if(existing) existing.remove();
    if(meta && _MODE_BADGES[meta.mode]){
      const span = document.createElement('span');
      span.className = 'ni-mod-badge';
      span.title = meta.mode;
      span.style.cssText = 'margin-left:auto;font-size:11px;opacity:0.85;';
      span.textContent = _MODE_BADGES[meta.mode];
      el.appendChild(span);
    }
  });
}

// ── Mgmt sub-tab UI ─────────────────────────────────────
let _mmSubview = 'modules';  // 'modules' | 'overrides'
let _mmFilter = '';
let _mmModeFilter = '';

function renderModuleModesPanel(c){
  if(!c) return;
  const isOwner = typeof CU === 'object' && CU && CU.role === 'Owner';
  if(!isOwner && CU && CU.role !== 'Admin'){
    c.innerHTML = `<div class="card"><div class="card-body" style="color:var(--text-3);font-size:13px;">Module Modes is restricted to Owner and Admin roles.</div></div>`;
    return;
  }
  const subTabs = [
    {id:'modules', label:'Modules'},
    {id:'overrides', label:'User Overrides'}
  ];
  c.innerHTML = `
    <div class="card mb16"><div class="card-body">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;flex-wrap:wrap;">
        <strong style="font-size:14px;">Module Modes</strong>
        <div style="display:flex;gap:4px;">
          ${subTabs.map(t => `<button class="btn ${_mmSubview===t.id?'btn-accent':'btn-outline'} btn-sm" onclick="_mmSubview='${t.id}';renderModuleModesPanel($('mgmt-content'))">${t.label}</button>`).join('')}
        </div>
        <div style="margin-left:auto;font-size:11px;color:var(--text-3);">Source: <span class="mono">module_modes.json</span></div>
      </div>
      <div id="mm-body"></div>
    </div></div>
  `;
  if(_mmSubview === 'modules') _renderModulesTable($('mm-body'));
  else _renderOverridesPanel($('mm-body'));
}

function _renderModulesTable(host){
  const states = MODULE_MODES.states || ['idea_only','brainstorming','planning','blocked','building','testing','live','deprecated','hidden'];
  const entries = Object.entries(MODULE_MODES.modules).map(([k,v]) => ({key:k, ...v}));
  // Filter
  const q = (_mmFilter||'').toLowerCase();
  const filtered = entries.filter(e => {
    if(_mmModeFilter && e.mode !== _mmModeFilter) return false;
    if(q && !((e.key||'').toLowerCase().includes(q) || (e.title||'').toLowerCase().includes(q))) return false;
    return true;
  });
  // Mode counts
  const counts = {};
  entries.forEach(e => { counts[e.mode] = (counts[e.mode]||0) + 1; });
  const countChips = states.map(s => {
    const c = counts[s] || 0;
    if(!c) return '';
    const col = _STATE_COLORS[s] || {bg:'#eee',fg:'#333'};
    return `<span onclick="_mmModeFilter=(_mmModeFilter==='${s}'?'':'${s}');renderModuleModesPanel($('mgmt-content'))" style="padding:3px 9px;border-radius:11px;font-size:11px;font-weight:600;background:${col.bg};color:${col.fg};cursor:pointer;${_mmModeFilter===s?'outline:2px solid '+col.fg+';':''}">${s} ${c}</span>`;
  }).join(' ');
  host.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
      <input id="mm-q" placeholder="Search by key or title…" value="${esc(_mmFilter)}" oninput="_mmFilter=this.value;clearTimeout(window._mmTimer);window._mmTimer=setTimeout(()=>renderModuleModesPanel($('mgmt-content')),200)" style="flex:1;min-width:200px;">
      ${_mmModeFilter ? `<button class="btn btn-outline btn-sm" onclick="_mmModeFilter='';renderModuleModesPanel($('mgmt-content'))">Clear filter</button>` : ''}
    </div>
    <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">${countChips}<button class="btn btn-outline btn-sm" style="font-size:11px;margin-left:auto;" onclick="_mmAddModulePrompt()">+ Add new module</button></div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:8px;">Showing ${filtered.length} of ${entries.length}. Toggle a mode → UI updates immediately + a <span class="mono">/mode key state</span> command is logged for Claude to commit to <span class="mono">module_modes.json</span>.</div>
    <div style="overflow-x:auto;">
    <table style="width:100%;font-size:13px;">
      <thead><tr>
        <th style="text-align:left;">Key</th>
        <th style="text-align:left;">Title</th>
        <th style="text-align:left;width:160px;">Mode</th>
        <th style="text-align:left;">Notes</th>
      </tr></thead>
      <tbody>
        ${filtered.map(e => {
          const col = _STATE_COLORS[e.mode] || {bg:'#eee',fg:'#333'};
          const opts = states.map(s => `<option value="${s}" ${e.mode===s?'selected':''}>${s}</option>`).join('');
          return `<tr>
            <td class="mono" style="font-size:11px;">${esc(e.key)}</td>
            <td>${esc(e.title||e.key)}</td>
            <td>
              <select onchange="_mmSetMode('${esc(e.key)}',this.value)" style="padding:3px 7px;font-size:11px;background:${col.bg};color:${col.fg};border:1px solid ${col.fg};border-radius:6px;font-weight:600;">
                ${opts}
              </select>
            </td>
            <td style="font-size:11px;color:var(--text-3);">${esc(e.notes||'')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
    <div id="mm-cmd-log" style="margin-top:14px;"></div>
  `;
}

function _mmAddModulePrompt(){
  const states = MODULE_MODES.states || [];
  const stateOpts = states.map(s => `<option value="${s}" ${s==='idea_only'?'selected':''}>${s}</option>`).join('');
  openModal('Add new module', `
    <div class="frow">
      <div class="fcol field"><label>Key * (lowercase, no spaces — e.g. crm_v2)</label><input id="mm-new-key" placeholder="my_module"></div>
      <div class="fcol field"><label>Initial mode</label><select id="mm-new-mode">${stateOpts}</select></div>
    </div>
    <div class="fg"><label>Title *</label><input id="mm-new-title" placeholder="Display name shown in UI"></div>
    <div class="fg"><label>Notes</label><textarea id="mm-new-notes" rows="2" placeholder="Why this exists, current rollout context, M-task dependencies, etc."></textarea></div>
    <div style="font-size:11px;color:var(--text-3);">Tip: a key starting with an existing key prefix (e.g. <span class="mono">portal_</span>) groups it visually with related items in search.</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="_mmAddModuleCommit()">Add</button>
    </div>
  `);
}

function _mmAddModuleCommit(){
  const key = ($('mm-new-key')?.value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const title = ($('mm-new-title')?.value || '').trim();
  const mode = $('mm-new-mode')?.value || 'idea_only';
  const notes = ($('mm-new-notes')?.value || '').trim();
  if(!key || !title){ toast('Key + title required', 'err'); return; }
  if(MODULE_MODES.modules[key]){ toast('That key already exists', 'err'); return; }
  MODULE_MODES.modules[key] = {title, mode, notes, updated_at: new Date().toISOString().slice(0,10)};
  applyModuleModesToSidebar();
  closeModal();
  // Surface the JSON snippet for Claude to commit
  const cmd = `/mode add ${key} ${mode} "${title}"${notes?' — '+notes:''}`;
  const logEl = $('mm-cmd-log');
  if(logEl){
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px 11px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;margin-bottom:6px;font-size:12px;display:flex;align-items:center;gap:8px;';
    div.innerHTML = `<span class="mono" style="flex:1;">${esc(cmd)}</span>
      <button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="navigator.clipboard.writeText('${esc(cmd)}').then(()=>toast('Copied','ok'))">Copy</button>
      <span style="font-size:10px;color:#92400e;">paste to Claude → adds to module_modes.json</span>`;
    logEl.prepend(div);
  }
  if(typeof sbAuditLog==='function') sbAuditLog('module_register', 'module_modes', {key, title, mode});
  renderModuleModesPanel($('mgmt-content'));
  toast(`Added ${title} (${mode})`, 'ok');
}

function _mmSetMode(key, newMode){
  const meta = MODULE_MODES.modules[key];
  if(!meta){ toast('Unknown module','err'); return; }
  const oldMode = meta.mode;
  if(oldMode === newMode) return;
  meta.mode = newMode;
  meta.updated_at = new Date().toISOString().slice(0,10);
  // Re-apply sidebar gating immediately so the user sees the effect.
  applyModuleModesToSidebar();
  // Log the command for Claude to commit.
  const cmd = `/mode ${key} ${newMode}`;
  const logEl = $('mm-cmd-log');
  if(logEl){
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px 11px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:6px;font-size:12px;display:flex;align-items:center;gap:8px;';
    div.innerHTML = `<span class="mono" style="flex:1;">${esc(cmd)}</span>
      <button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 7px;" onclick="navigator.clipboard.writeText('${esc(cmd)}').then(()=>toast('Copied','ok'))">Copy</button>
      <span style="font-size:10px;color:var(--text-3);">paste to Claude to commit</span>`;
    logEl.prepend(div);
  }
  if(typeof sbAuditLog==='function') sbAuditLog('module_mode_change', 'module_modes', {key, from: oldMode, to: newMode});
  toast(`${meta.title}: ${oldMode} → ${newMode}`, 'ok');
}

// ── User overrides UI ───────────────────────────────────
let _mmOvUserId = '';

async function _renderOverridesPanel(host){
  // Need to fetch user list via existing user_profiles read.
  let users = [];
  try{
    if(typeof sbFetch === 'function'){
      const rows = await sbFetch('/user_profiles?select=user_id,email,full_name,role&order=role.asc,full_name.asc');
      users = Array.isArray(rows) ? rows : [];
    }
  }catch(e){ console.warn('[module_modes] user_profiles fetch failed:', e.message); }
  const moduleEntries = Object.entries(MODULE_MODES.modules).map(([k,v]) => ({key:k, ...v}));
  const sel = _mmOvUserId;
  const userMap = sel ? (USER_OVERRIDES.overrides||{})[sel] || {} : {};
  const userOpts = users.map(u => `<option value="${u.user_id}" ${sel===u.user_id?'selected':''}>${esc(u.full_name||u.email||'?')} · ${esc(u.role||'')}</option>`).join('');
  const overrideRows = sel ? moduleEntries.map(e => {
    const cur = userMap[e.key] || '';
    const col = _STATE_COLORS[e.mode] || {bg:'#eee',fg:'#333'};
    return `<tr>
      <td class="mono" style="font-size:11px;">${esc(e.key)}</td>
      <td>${esc(e.title||e.key)}</td>
      <td><span style="padding:1px 6px;border-radius:4px;font-size:10px;background:${col.bg};color:${col.fg};">${esc(e.mode)}</span></td>
      <td>
        <select onchange="_mmSetOverride('${esc(sel)}','${esc(e.key)}',this.value)" style="padding:3px 7px;font-size:11px;border:1px solid var(--border);border-radius:6px;">
          <option value="" ${cur===''?'selected':''}>— inherit —</option>
          <option value="allow" ${cur==='allow'?'selected':''}>allow</option>
          <option value="deny" ${cur==='deny'?'selected':''}>deny</option>
          <option value="read_only" ${cur==='read_only'?'selected':''}>read_only</option>
        </select>
      </td>
    </tr>`;
  }).join('') : '';
  // Summary of all overrides across all users
  const allOverrides = [];
  Object.entries(USER_OVERRIDES.overrides||{}).forEach(([uid, mods]) => {
    Object.entries(mods).forEach(([k, v]) => {
      const u = users.find(x => x.user_id === uid);
      allOverrides.push({uid, name: u ? (u.full_name||u.email) : uid, key: k, access: v});
    });
  });
  host.innerHTML = `
    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px;">Per-user grants override role + mode gating. v1 limitation: stored in this browser's localStorage — affects what THIS browser shows for the selected user. Real cross-device gating needs a Supabase <span class="mono">user_module_overrides</span> table (M-task backlog).</div>
    <div style="margin-bottom:14px;">
      <label style="font-size:12px;font-weight:600;margin-right:8px;">Pick user:</label>
      <select onchange="_mmOvUserId=this.value;renderModuleModesPanel($('mgmt-content'))" style="padding:5px 9px;font-size:13px;min-width:280px;">
        <option value="">— select —</option>
        ${userOpts}
      </select>
    </div>
    ${sel ? `
      <div style="overflow-x:auto;max-height:520px;overflow-y:auto;">
      <table style="width:100%;font-size:12px;">
        <thead><tr style="position:sticky;top:0;background:#fff;z-index:1;">
          <th style="text-align:left;">Key</th><th style="text-align:left;">Title</th><th style="text-align:left;">Mode</th><th style="text-align:left;width:160px;">Override</th>
        </tr></thead>
        <tbody>${overrideRows}</tbody>
      </table>
      </div>
    ` : `<div style="font-size:12px;color:var(--text-3);padding:14px;text-align:center;border:1px dashed var(--border);border-radius:6px;">Pick a user above to manage their overrides.</div>`}
    <div style="margin-top:24px;">
      <strong style="font-size:13px;">All overrides (this browser)</strong>
      ${allOverrides.length === 0
        ? `<div style="font-size:12px;color:var(--text-3);margin-top:6px;">No overrides set yet.</div>`
        : `<table style="width:100%;font-size:12px;margin-top:6px;">
            <thead><tr><th style="text-align:left;">User</th><th style="text-align:left;">Module</th><th style="text-align:left;">Access</th><th></th></tr></thead>
            <tbody>${allOverrides.map(o => `<tr>
              <td>${esc(o.name)}</td><td class="mono" style="font-size:11px;">${esc(o.key)}</td><td>${esc(o.access)}</td>
              <td style="text-align:right;"><button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 6px;" onclick="_mmSetOverride('${esc(o.uid)}','${esc(o.key)}','')">clear</button></td>
            </tr>`).join('')}</tbody>
          </table>`
      }
    </div>
  `;
}

async function _mmSetOverride(userId, key, access){
  if(!userId || !key) return;
  USER_OVERRIDES.overrides = USER_OVERRIDES.overrides || {};
  USER_OVERRIDES.overrides[userId] = USER_OVERRIDES.overrides[userId] || {};
  if(access){
    USER_OVERRIDES.overrides[userId][key] = access;
  } else {
    delete USER_OVERRIDES.overrides[userId][key];
    if(!Object.keys(USER_OVERRIDES.overrides[userId]).length) delete USER_OVERRIDES.overrides[userId];
  }
  _saveOverrides();
  const synced = await _saveOverrideRow(userId, key, access);
  // Re-apply sidebar in case it's the active user.
  applyModuleModesToSidebar();
  if(typeof sbAuditLog==='function') sbAuditLog('user_module_override', 'module_modes', {user_id: userId, key, access: access||null, synced});
  renderModuleModesPanel($('mgmt-content'));
  toast(access ? `Override: ${key} → ${access}${synced?'':' (local only)'}` : `Override cleared: ${key}${synced?'':' (local only)'}`, 'ok');
}

// ── Page-level guard ────────────────────────────────────
// Wraps goTo so navigating to a non-visible module short-circuits.
function _wrapGoToWithModeGuard(){
  if(typeof window.goTo !== 'function' || window._goToModeWrapped) return;
  const orig = window.goTo;
  window.goTo = function(page){
    if(!canSeeModule(page)){
      const meta = MODULE_MODES.modules[page];
      const reason = meta ? `${meta.title} is in "${meta.mode}" mode` : 'Module not available';
      toast(reason, 'err');
      return;
    }
    return orig.apply(this, arguments);
  };
  window._goToModeWrapped = true;
}

// Hook into hydrate. Called from index.html after hydrateFromSupabase().
async function applyModuleModesAfterHydrate(){
  await sbLoadModuleModes();
  applyModuleModesToSidebar();
  _wrapGoToWithModeGuard();
}
