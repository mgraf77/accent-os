// ── SETTINGS MODULE (extracted from index.html at v6.11.1) ──
register({ name: 'settings_module', provides: ['settings','changeMyPassword'], consumes: ['CU','sbFetch','sbConfigured','toast','$','esc'] });

// ── SETTINGS ──────────────────────────────────────────────
function settings(el){
  const isOwner = CU && CU.role === 'Owner';
  el.innerHTML = `<div class="g2">
    <div>
      ${isOwner ? `
      <div class="card mb16"><div class="card-hd"><span class="card-title">API Keys</span></div><div class="card-body">
        <div class="field"><label>Anthropic API Key</label><div style="display:flex;gap:7px;"><input type="password" id="s-ak" placeholder="sk-ant-..." value="${getS('aos-api')?'••••••••••••••••':''}" style="flex:1;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:9px 11px;font-family:'Outfit',sans-serif;font-size:14px;outline:none;"><button class="btn btn-outline btn-sm" onclick="const e=$('s-ak');e.type=e.type==='password'?'text':'password'">Show</button></div><div class="fhint">Powers Knowledge Engine AI + Quote AI Summary.</div></div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn btn-accent btn-sm" onclick="const v=$('s-ak').value;if(v&&!v.includes('•')){sessionStorage.setItem('aos-api',v);toast('API key saved','ok');goTo('settings');}else toast('Enter a valid key','err')">Save Key</button>
          ${getS('aos-api')?`<span class="badge bg-green">✓ Configured</span>`:`<span class="badge bg-yellow">Not set</span>`}
        </div>
      </div></div>
      <div class="card mb16"><div class="card-hd"><span class="card-title">Supabase</span></div><div class="card-body">
        <div class="field"><label>Project URL</label><input id="s-su" placeholder="https://xxx.supabase.co" value="${getS('aos-sb-url')||''}"></div>
        <div class="field"><label>Anon Key Override</label><input type="password" id="s-sk" placeholder="eyJ... (optional — embedded by default)"></div>
        <button class="btn btn-accent btn-sm" onclick="const u=$('s-su').value,k=$('s-sk').value;if(u)sessionStorage.setItem('aos-sb-url',u);if(k&&!k.includes('•'))sessionStorage.setItem('aos-sb-key',k);toast('Saved','ok');goTo('settings')">Save Supabase</button>
        <div class="alert alert-info" style="margin-top:12px;font-size:12.5px;"><strong>Project:</strong> <span class="mono" style="font-size:11px;">hsyjcrrazrzqngwkqsqa.supabase.co</span><br>Anon key is embedded in source (publishable-by-design — RLS protects writes). Use the override field only to test against a different key without redeploying.</div>
      </div></div>
      ` : ''}

      <div class="card"><div class="card-hd"><span class="card-title">My Account</span></div><div class="card-body">
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0 14px;border-bottom:1px solid var(--border-light);margin-bottom:12px;">
          <div class="avatar" style="width:40px;height:40px;font-size:14px;">${esc(CU?.initials||'?')}</div>
          <div>
            <div style="font-weight:600;font-size:14px;">${esc(CU?.name||'')}</div>
            <div style="font-size:12px;color:var(--text-3);">${esc(CU?.email||'')} · <span class="badge bg-${CU?.role==='Owner'?'red':CU?.role==='Admin'?'blue':'gray'}" style="font-size:10px;">${esc(CU?.role||'')}</span></div>
          </div>
        </div>
        <div class="field"><label>New Password</label><input type="password" id="s-pw1" placeholder="At least 8 characters"></div>
        <div class="field"><label>Confirm New Password</label><input type="password" id="s-pw2" placeholder="Repeat the password"></div>
        <button class="btn btn-accent btn-sm" onclick="changeMyPassword()">Change Password</button>
        <button class="btn btn-outline btn-sm" style="margin-left:8px;" onclick="doLogout()">Sign Out</button>
      </div></div>
    </div>

    <div>
      <div class="card mb16"><div class="card-hd"><span class="card-title">System Info</span></div><div class="card-body">
        ${[
          ['Version','AccentOS v6.9.6a'],
          ['Hosting','Cloudflare Pages'],
          ['Auth','Supabase Auth · 5 roles · audit_log live'],
          ['Vendors','478 vendors · 14 categories · $39.7M sales history · 10 corporate parents'],
          ['Scoring','Weighted 0-10 · Auto tier A-F · Sister-brand propagation'],
          ['ERP','Windward — planned (Track 6.11)'],
          ['Ecommerce','BigCommerce — REST integration planned (Track 6.3)']
        ].map(([k,v])=>`<div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13.5px;"><span style="font-weight:600;min-width:150px;color:var(--text-2);">${esc(k)}</span><span class="mono" style="font-size:12px;">${esc(v)}</span></div>`).join('')}
      </div></div>

      <div class="card"><div class="card-hd">
        <span class="card-title">Users</span>
        ${isOwner ? `<button class="btn btn-outline btn-sm" onclick="renderUsersPanel()">↻ Refresh</button>` : ''}
      </div><div class="card-body">
        <div id="users-panel">
          <div style="color:var(--text-3);font-size:12.5px;padding:8px 0;">Loading…</div>
        </div>
      </div></div>
    </div>
  </div>`;
  renderUsersPanel();
}

// Renders the user list inside #users-panel. Owner sees full list with role editors;
// non-Owners see just themselves (read-only).
async function renderUsersPanel(){
  const host = $('users-panel'); if(!host) return;
  const isOwner = CU && CU.role === 'Owner';
  if(!sbConfigured()){
    host.innerHTML = `<div style="color:var(--text-3);font-size:12.5px;">Supabase not configured.</div>`;
    return;
  }
  try{
    const rows = await sbFetch('/user_profiles?select=user_id,email,full_name,role,initials&order=role.asc,full_name.asc');
    if(!Array.isArray(rows) || !rows.length){
      host.innerHTML = `<div style="color:var(--text-3);font-size:12.5px;">No user_profiles rows found.</div>`;
      return;
    }
    const visible = isOwner ? rows : rows.filter(r => r.user_id === CU.user_id);
    host.innerHTML = visible.map(r => {
      const isSelf = r.user_id === CU.user_id;
      const badgeBg = r.role==='Owner'?'red':r.role==='Admin'?'blue':r.role==='Manager'?'amber':'gray';
      const roleEditor = (isOwner && !isSelf) ? `
        <select id="ur-${r.user_id}" style="border:1px solid var(--border);border-radius:5px;padding:4px 7px;font-size:12px;font-family:inherit;">
          ${ROLES.map(rl => `<option value="${rl}" ${r.role===rl?'selected':''}>${rl}</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 8px;" onclick="saveUserRole('${r.user_id}','${esc(r.email).replace(/'/g,"\\'")}')">Save</button>
      ` : `<span class="badge bg-${badgeBg}">${esc(r.role)}</span>`;
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-light);">
        <div class="avatar" style="width:30px;height:30px;font-size:11px;">${esc(r.initials||deriveInitials(r.full_name, r.email))}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13.5px;">${esc(r.full_name||r.email)} ${isSelf?'<span style="color:var(--text-3);font-weight:400;font-size:11px;">(you)</span>':''}</div>
          <div style="font-size:12px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;">${esc(r.email)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">${roleEditor}</div>
      </div>`;
    }).join('');
    if(isOwner){
      host.insertAdjacentHTML('beforeend', `
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-3);">
          <strong>Add a user:</strong> create them in <a href="https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/auth/users" target="_blank" style="color:var(--accent);">Supabase Auth → Add user</a>, then run the seed SQL block (see BUILD_PLAN_MICHAEL.md M13).
        </div>
      `);
    }
  }catch(e){
    host.innerHTML = `<div style="color:var(--accent);font-size:12.5px;">Failed to load users: ${esc(e.message)}</div>`;
  }
}

async function saveUserRole(userId, email){
  if(!CU || CU.role !== 'Owner'){ toast('Only Owner can change roles', 'err'); return; }
  const sel = $('ur-'+userId); if(!sel) return;
  const newRole = sel.value;
  if(!ROLES.includes(newRole)){ toast('Invalid role', 'err'); return; }
  try{
    await sbFetch(`/user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {'Prefer':'return=minimal'},
      body: JSON.stringify({role: newRole, updated_at: new Date().toISOString()})
    });
    sbAuditLog('role_change', 'auth', {target_user_id: userId, target_email: email, new_role: newRole});
    toast(`Role updated → ${newRole}`, 'ok');
  }catch(e){
    toast('Save failed: '+e.message, 'err');
  }
}

async function changeMyPassword(){
  const p1 = v('s-pw1','value'), p2 = v('s-pw2','value');
  if(!p1 || p1.length < 8){ toast('Password must be at least 8 characters', 'err'); return; }
  if(p1 !== p2){ toast('Passwords do not match', 'err'); return; }
  const tok = jwtKey();
  if(!tok){ toast('Sign in first', 'err'); return; }
  try{
    await sbAuthFetch('/user', {
      method: 'PUT',
      headers: {'Authorization':'Bearer '+tok},
      body: JSON.stringify({password: p1})
    });
    sbAuditLog('password_change', 'auth');
    $('s-pw1').value=''; $('s-pw2').value='';
    toast('Password updated', 'ok');
  }catch(e){
    toast('Password change failed: '+e.message, 'err');
  }
}

