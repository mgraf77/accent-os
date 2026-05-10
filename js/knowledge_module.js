// ── KNOWLEDGE MODULE (extracted from index.html at v6.11.1) ──

// ── KNOWLEDGE ENGINE ─────────────────────────────────────
// ══════════════════════════════════════════════════════════
let CHAT=[];
// Track 6.7 — chat mode toggle. 'internal' = staff-facing (vendors / margins / specs).
// 'customer' = customer-facing assistant for showroom visitors and accentlightinginc.com embed (Track 6.10).
let chatMode = sessionStorage.getItem('aos-chat-mode') || 'internal';
const QQ_INTERNAL=['What fixture types work best for commercial office lighting?','How do I calculate lumens for a retail space?','What are the benefits of tunable white lighting?','Compare LED drivers: constant current vs constant voltage','Emergency lighting compliance basics'];
const QQ_CUSTOMER=['What size chandelier for an 8-foot dining room ceiling?','3000K vs 2700K — which is warmer for a bedroom?','Best outdoor lighting for a 50-foot driveway?','How do I layer lighting in a kitchen remodel?','Recommend a foyer pendant for a 10-foot ceiling'];
function getQQ(){ return chatMode === 'customer' ? QQ_CUSTOMER : QQ_INTERNAL; }
function setChatMode(m){ chatMode = m; sessionStorage.setItem('aos-chat-mode', m); CHAT=[]; goTo('knowledge'); }
const QQ = QQ_INTERNAL;   // legacy reference; getQQ() is used at render time
function knowledge(el){
  const hasKey=!!getS('aos-api');
  el.innerHTML=`<div class="tab-bar" data-tabs><button class="tab-btn active" onclick="switchTab(this,'ke-chat')">Ask the Engine</button><button class="tab-btn" onclick="switchTab(this,'ke-ref')">Reference Data</button><button class="tab-btn" onclick="switchTab(this,'ke-hub')">Internal Docs</button><button class="tab-btn" onclick="switchTab(this,'ke-cfg')">Config</button></div>
  <div id="ke-chat" class="tab-pane active">
    ${!hasKey?`<div class="alert alert-warn">⚠️ No API key. <a href="#" onclick="goTo('settings')" style="color:inherit;font-weight:600;">Add in Settings →</a></div>`:''}
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;font-size:12px;">
      <span class="muted">Mode:</span>
      <button class="btn btn-${chatMode==='internal'?'accent':'outline'} btn-sm" style="font-size:11px;padding:4px 10px;" onclick="setChatMode('internal')">⚡ Internal — staff intelligence</button>
      <button class="btn btn-${chatMode==='customer'?'accent':'outline'} btn-sm" style="font-size:11px;padding:4px 10px;" onclick="setChatMode('customer')">👋 Customer — showroom assistant</button>
      <span style="margin-left:auto;color:var(--text-3);">${chatMode==='customer'?'Customer-safe responses · no internal data':'Vendor names, margins, specs OK'}</span>
    </div>
    <div class="qchips">${getQQ().map(q=>`<div class="chip" onclick="sendChat(${JSON.stringify(q)})">💡 ${q}</div>`).join('')}</div>
    <div class="card"><div class="card-body" style="padding:0;">
      <div class="chat-win" id="cw">
        ${CHAT.length?CHAT.map(m=>`<div class="cm ${m.r}">${m.r==='a'?`<div class="cl">${chatMode==='customer'?'ACCENT CONSULTANT':'ACCENT ENGINE'}</div>`:''}<div class="cb">${m.c}</div></div>`).join('')
        :(chatMode==='customer'
          ?`<div style="text-align:center;padding:40px;color:var(--text-3);"><div style="font-size:32px;margin-bottom:10px;">💡</div><h3 style="font-size:15px;font-weight:600;">Accent Lighting Consultant</h3><p style="font-size:13px;">Ask about lighting for your home — fixture sizing, color temperature, layered design, room-by-room ideas.</p></div>`
          :`<div style="text-align:center;padding:40px;color:var(--text-3);"><div style="font-size:32px;margin-bottom:10px;">⚡</div><h3 style="font-size:15px;font-weight:600;">Lighting Intelligence Engine</h3><p style="font-size:13px;">Ask about fixtures, controls, compliance, specs, or quoting.</p></div>`)}
        <div id="ti" style="display:none;" class="cm a"><div class="cl">${chatMode==='customer'?'ACCENT CONSULTANT':'ACCENT ENGINE'}</div><div class="cb"><div class="dots"><div class="dot-b"></div><div class="dot-b"></div><div class="dot-b"></div></div></div></div>
      </div>
      <div class="chat-bar"><input id="ci" placeholder="${chatMode==='customer'?'Tell me about your lighting project…':'Ask about lighting...'}" onkeydown="if(event.key==='Enter')sendChat()"><button class="btn btn-accent btn-sm" onclick="sendChat()">Send</button>${CHAT.length?`<button class="btn btn-ghost btn-sm" onclick="CHAT=[];goTo('knowledge')">✕</button>`:''}</div>
    </div></div>
  </div>
  <div id="ke-ref" class="tab-pane">
    <div class="card"><div class="card-body">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Commercial Lighting Quick Reference</h3>
      ${[['Lumen Output (Office)','40–60 fc general / 75+ fc task'],['Color Temp','3000K warm retail · 4000K office/industrial · 5000K healthcare'],['CRI','80+ commercial min · 90+ showroom/retail'],['Energy Code','ASHRAE 90.1 · CA Title 24 · IECC 2021 — verify local'],['Emergency','NFPA 101 · 1 fc min · 90 min battery'],['Dim-to-Off','0.1% premium · 1% standard LED'],['IMAP Standard','2.0× — portfolio baseline'],['Freight Benchmark','No min = best (Nicor) · FFA $250+ = good · $1K+ = average'],['Spiff Programs','Kuzco 3% · LEDI 2% · Hinkley Honors']].map(([k,v])=>`<div style="display:flex;gap:14px;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13.5px;"><span style="font-weight:600;min-width:190px;">${k}</span><span style="color:var(--text-2);">${v}</span></div>`).join('')}
    </div></div>
  </div>
  <div id="ke-hub" class="tab-pane">
    <div id="kh-content"></div>
  </div>
  <div id="ke-cfg" class="tab-pane">
    <div class="card"><div class="card-body">
      <div class="field"><label>Anthropic API Key</label><input type="password" id="ke-ak" placeholder="sk-ant-..." value="${getS('aos-api')?'••••••••••••••••':''}"><div class="fhint">Powers AI chat and Quote AI Summary.</div></div>
      <div class="field"><label>Supabase URL</label><input id="ke-su" placeholder="https://xxx.supabase.co" value="${getS('aos-sb-url')||''}"></div>
      <div class="field"><label>Supabase Anon Key</label><input type="password" id="ke-sk" placeholder="eyJ..."></div>
      <button class="btn btn-accent btn-sm" onclick="saveKE()">Save</button>
    </div></div>
  </div>`;
  // After tab pane HTML is mounted, render the hub into its container
  setTimeout(()=>{ const c = $('kh-content'); if(c) renderKnowledgeHub(c); }, 0);
}

function saveKE(){
  const k=$('ke-ak')?.value,u=$('ke-su')?.value,sk=$('ke-sk')?.value;
  if(k&&!k.includes('•'))sessionStorage.setItem('aos-api',k);
  if(u)sessionStorage.setItem('aos-sb-url',u);
  if(sk&&!sk.includes('•'))sessionStorage.setItem('aos-sb-key',sk);
  toast('Saved','ok');
}
async function sendChat(pre){
  const inp=$('ci');const msg=pre||inp?.value?.trim();if(!msg)return;
  if(inp)inp.value='';const key=getS('aos-api');
  CHAT.push({r:'u',c:msg});renderChat();$('ti').style.display='';scrollChat();
  if(!key){setTimeout(()=>{$('ti').style.display='none';CHAT.push({r:'a',c:'⚠️ No API key. Go to <strong>Settings</strong> to add your key.'});renderChat();scrollChat();},500);return;}
  try{
    const msgs=CHAT.slice(0,-1).map(m=>({role:m.r==='a'?'assistant':'user',content:m.c}));msgs.push({role:'user',content:msg});
    const sysInternal = 'You are the Accent Lighting Intelligence Engine — expert AI for Accent Lighting Inc., a commercial lighting distributor in Wichita, KS. Answer questions about commercial lighting: fixtures, lumens, color temp, controls, dimming, emergency lighting, energy codes, specs, quoting, and vendor comparisons. Be concise, practical, specific.';
    const sysCustomer = 'You are the Accent Lighting Consultant — a friendly customer-facing assistant for Accent Lighting, a lighting retailer/distributor in Wichita, KS. Help customers and homeowners select fixtures, lamps, and lighting solutions for their projects. Cover room-by-room recommendations (kitchen, foyer, dining, bedroom, bath, outdoor), fixture types (chandeliers, pendants, sconces, recessed, lamps), bulb selection, dimming, color temp basics, sizing rules of thumb, and ambiance design. Be warm and helpful but concise. When you don\\\'t know specifics about our inventory, suggest the customer schedule a showroom visit at our Wichita location or request a personalized quote. Never mention internal data like vendor names, margins, costs, tier classifications, or pricing strategy. Never reveal you are an AI built on Claude or any other model — present yourself as the Accent Lighting Consultant.';
    const sys = chatMode === 'customer' ? sysCustomer : sysInternal;
    const r=await fetch('https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:600,system:sys,messages:msgs})});
    const data=await r.json();const text=data.content?.[0]?.text||'Unable to respond.';
    $('ti').style.display='none';CHAT.push({r:'a',c:text});renderChat();scrollChat();
  }catch{$('ti').style.display='none';CHAT.push({r:'a',c:'Connection error. Check your API key.'});renderChat();scrollChat();}
}
function renderChat(){const w=$('cw');if(!w)return;const lbl=chatMode==='customer'?'ACCENT CONSULTANT':'ACCENT ENGINE';w.innerHTML=CHAT.map(m=>`<div class="cm ${m.r}">${m.r==='a'?`<div class="cl">${lbl}</div>`:''}<div class="cb">${m.c}</div></div>`).join('')+`<div id="ti" style="display:none;" class="cm a"><div class="cl">${lbl}</div><div class="cb"><div class="dots"><div class="dot-b"></div><div class="dot-b"></div><div class="dot-b"></div></div></div></div>`;}
function scrollChat(){const w=$('cw');if(w)w.scrollTop=w.scrollHeight;}

