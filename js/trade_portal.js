// js/trade_portal.js — v6.11.2
// External-facing Trade & Designer Portal (role: TradePartner).
// Trade partners log in with a Supabase account; this portal is their home.
// Data sourced from existing globals (QUOTES, JOBS, DELIVERIES, CUSTOMERS, TRADE_PARTNERS, ARTICLES).
// No new schema needed — filters existing tables by partner's company/email.

/* ── Partner resolution ─────────────────────────────────────────────────── */

function _tpPartner(){
  // Find the trade_partners record that matches the logged-in user.
  // Priority: email match → name match from CU.name.
  if(!CU) return null;
  const email = (CU.email||'').toLowerCase();
  const name  = (CU.name||CU.email||'').toLowerCase();
  return (typeof TRADE_PARTNERS !== 'undefined' ? TRADE_PARTNERS : []).find(p =>
    (p.email && p.email.toLowerCase() === email) ||
    (p.name  && p.name.toLowerCase()  === name)
  ) || null;
}

function _tpCompanyNames(partner){
  const names = new Set();
  if(partner){
    if(partner.name)    names.add(partner.name.toLowerCase());
    if(partner.company) names.add(partner.company.toLowerCase());
  }
  if(CU){
    if(CU.name)  names.add(CU.name.toLowerCase());
    if(CU.email) names.add(CU.email.toLowerCase());
  }
  return names;
}

function _tpMyQuotes(partner){
  const names = _tpCompanyNames(partner);
  return (typeof QUOTES !== 'undefined' ? QUOTES : []).filter(q => {
    const cn = (q.customer_name||'').toLowerCase();
    const cn2 = (q.contact||'').toLowerCase();
    return [...names].some(n => cn.includes(n) || n.includes(cn) || cn2.includes(n));
  });
}

function _tpMyJobs(partner){
  const names = _tpCompanyNames(partner);
  return (typeof JOBS !== 'undefined' ? JOBS : []).filter(j => {
    const cn = (j.customer_name||'').toLowerCase();
    return [...names].some(n => cn.includes(n) || n.includes(cn));
  });
}

function _tpMyDeliveries(partner){
  const names = _tpCompanyNames(partner);
  return (typeof DELIVERIES !== 'undefined' ? DELIVERIES : []).filter(d => {
    const cn = (d.customer_name||'').toLowerCase();
    return [...names].some(n => cn.includes(n) || n.includes(cn));
  });
}

function _tpResources(){
  return (typeof ARTICLES !== 'undefined' ? ARTICLES : []).filter(a =>
    (a.tags||[]).some(t => ['trade-resource','trade','public','catalog','spec'].includes((t||'').toLowerCase()))
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */

function tpInitSidebar(){
  // Replace the standard sidebar with a minimal portal sidebar.
  const sb = document.getElementById('sb');
  if(!sb) return;
  const partner = _tpPartner();
  const company = partner ? (partner.company || partner.name) : (CU?.name || CU?.email || 'Your Account');
  sb.querySelector('.sb-nav').innerHTML = `
    <div class="ni active" data-roles="TradePartner" onclick="goTo('tradeportal')"><span class="ni-icon">⊞</span><span class="ni-label">Home</span></div>
    <div class="ni" data-roles="TradePartner" onclick="goTo('tpquotes')"><span class="ni-icon">◻</span><span class="ni-label">My Quotes</span></div>
    <div class="ni" data-roles="TradePartner" onclick="goTo('tpjobs')"><span class="ni-icon">▤</span><span class="ni-label">My Projects</span></div>
    <div class="ni" data-roles="TradePartner" onclick="goTo('tpdeliveries')"><span class="ni-icon">▶</span><span class="ni-label">Deliveries</span></div>
    <div class="ni" data-roles="TradePartner" onclick="goTo('tpresources')"><span class="ni-icon">⚡</span><span class="ni-label">Resources</span></div>
    <div class="ni" data-roles="TradePartner" onclick="goTo('tpcontact')"><span class="ni-icon">✉</span><span class="ni-label">Contact Us</span></div>
  `;
}

/* ── Pages ───────────────────────────────────────────────────────────────── */

function tradeportal(el){
  const partner = _tpPartner();
  const quotes  = _tpMyQuotes(partner);
  const jobs    = _tpMyJobs(partner);
  const deliveries = _tpMyDeliveries(partner);

  const company = partner ? (partner.company || partner.name) : (CU?.name || 'Your Account');
  const type    = partner ? (partner.type || 'Trade Partner') : 'Trade Partner';
  const rating  = partner ? partner.rating : null;

  const openQ  = quotes.filter(q => !['accepted','declined','expired'].includes(q.status));
  const activeJ = jobs.filter(j => !['complete','cancelled'].includes(j.status));
  const pendingD = deliveries.filter(d => ['scheduled','out_for_delivery'].includes(d.status));

  el.innerHTML = `
<div style="max-width:900px;padding:0 0 40px;">

  <!-- Welcome banner -->
  <div style="background:linear-gradient(135deg,var(--accent) 0%,#1a4f8a 100%);color:#fff;border-radius:10px;padding:28px 32px;margin-bottom:24px;">
    <div style="font-size:22px;font-weight:700;margin-bottom:4px;">Welcome back${company ? ', ' + esc(company) : ''}</div>
    <div style="opacity:.85;font-size:14px;">${esc(type)} · Accent Lighting Partner Portal</div>
  </div>

  ${!partner ? `<div style="background:var(--bg-2);border:1px dashed var(--border);border-radius:8px;padding:16px 20px;margin-bottom:20px;font-size:13px;color:var(--text-2);">
    <strong>Profile not linked.</strong> Ask your Accent Lighting rep to connect your account to your trade profile so your quotes and jobs appear here.
  </div>` : ''}

  <!-- Stat cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">
    ${_tpStatCard('Open Quotes', openQ.length, 'tap to view', 'goTo(\'tpquotes\')', openQ.length > 0 ? 'var(--accent)' : 'var(--text-3)')}
    ${_tpStatCard('Active Projects', activeJ.length, 'tap to view', 'goTo(\'tpjobs\')', activeJ.length > 0 ? '#22c55e' : 'var(--text-3)')}
    ${_tpStatCard('Upcoming Deliveries', pendingD.length, 'tap to view', 'goTo(\'tpdeliveries\')', pendingD.length > 0 ? '#f59e0b' : 'var(--text-3)')}
  </div>

  <!-- Recent quotes -->
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;margin-bottom:16px;">
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:space-between;">
      Recent Quotes
      <button onclick="goTo('tpquotes')" style="font-size:12px;padding:4px 12px;border:1px solid var(--border);border-radius:5px;background:none;cursor:pointer;color:var(--accent);">View all</button>
    </div>
    <div style="padding:8px 0;">
      ${openQ.slice(0,4).map(q => `
        <div style="padding:10px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
          <span style="font-weight:600;font-size:13px;">${esc(q.quote_number||q.id?.slice(0,8)||'—')}</span>
          <span style="flex:1;font-size:12px;color:var(--text-2);">${esc(q.contact||q.customer_name||'')}</span>
          <span style="font-size:12px;color:var(--text-3);">${esc(q.status||'')}</span>
          <span style="font-size:13px;font-weight:600;">$${Number(q.total||0).toLocaleString()}</span>
        </div>`).join('') || '<div style="padding:14px 18px;color:var(--text-3);font-size:13px;">No open quotes</div>'}
    </div>
  </div>

  <!-- Quick contact -->
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:18px 20px;display:flex;align-items:center;gap:16px;">
    <span style="font-size:28px;">✉</span>
    <div>
      <div style="font-weight:600;font-size:14px;">Need help?</div>
      <div style="font-size:12px;color:var(--text-2);margin-top:3px;">Contact your Accent Lighting rep or submit a request.</div>
    </div>
    <button onclick="goTo('tpcontact')" style="margin-left:auto;padding:8px 18px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">Contact Us</button>
  </div>

</div>`;
}

function tpquotes(el){
  const partner = _tpPartner();
  const quotes  = _tpMyQuotes(partner);
  if(!quotes.length){
    el.innerHTML = _tpEmptyState('No quotes found', 'Your quotes will appear here once your rep creates one linked to your account.');
    return;
  }
  el.innerHTML = `
<div style="max-width:900px;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:var(--bg-2);">
      <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);">Quote #</th>
      <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);">Contact</th>
      <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);">Type</th>
      <th style="padding:10px 12px;text-align:right;border-bottom:1px solid var(--border);">Total</th>
      <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);">Status</th>
      <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);">Notes</th>
    </tr></thead>
    <tbody>
      ${quotes.map(q => `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:9px 12px;font-weight:600;">${esc(q.quote_number||'QT-?')}</td>
        <td style="padding:9px 12px;color:var(--text-2);">${esc(q.contact||q.customer_name||'—')}</td>
        <td style="padding:9px 12px;color:var(--text-3);">${esc(q.type||'—')}</td>
        <td style="padding:9px 12px;text-align:right;font-weight:600;">$${Number(q.total||0).toLocaleString()}</td>
        <td style="padding:9px 12px;"><span style="font-size:11px;padding:2px 7px;border-radius:4px;background:var(--bg-2);">${esc(q.status||'—')}</span></td>
        <td style="padding:9px 12px;font-size:12px;color:var(--text-3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(q.notes||'')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;
}

function tpjobs(el){
  const partner = _tpPartner();
  const jobs    = _tpMyJobs(partner);
  if(!jobs.length){
    el.innerHTML = _tpEmptyState('No projects found', 'Your active projects will appear here.');
    return;
  }
  const STATUS_COLOR = {open:'#6366f1',in_progress:'#f59e0b',blocked:'#ef4444',complete:'#22c55e',cancelled:'var(--text-3)'};
  el.innerHTML = `
<div style="max-width:900px;display:grid;gap:12px;">
  ${jobs.map(j => `
    <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:16px 20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;background:${STATUS_COLOR[j.status]||'var(--bg-2)'};color:#fff;">${(j.status||'').replace('_',' ').toUpperCase()}</span>
        <span style="font-weight:700;font-size:14px;">${esc(j.job_number||'')} — ${esc(j.title||j.description||'Untitled')}</span>
        <span style="margin-left:auto;font-size:12px;color:var(--text-3);">Due: ${esc(j.due_date||'TBD')}</span>
      </div>
      <div style="font-size:12px;color:var(--text-2);">${esc(j.description||'')}</div>
      ${j.notes ? `<div style="font-size:12px;color:var(--text-3);margin-top:6px;">${esc(j.notes)}</div>` : ''}
    </div>`).join('')}
</div>`;
}

function tpdeliveries(el){
  const partner   = _tpPartner();
  const deliveries = _tpMyDeliveries(partner);
  if(!deliveries.length){
    el.innerHTML = _tpEmptyState('No deliveries', 'Scheduled deliveries will appear here.');
    return;
  }
  const ST_COLOR = {scheduled:'#6366f1',out_for_delivery:'#f59e0b',delivered:'#22c55e',failed:'#ef4444',rescheduled:'#8b5cf6',cancelled:'var(--text-3)'};
  el.innerHTML = `
<div style="max-width:900px;display:grid;gap:10px;">
  ${deliveries.map(d => `
    <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:14px 18px;display:flex;align-items:center;gap:14px;">
      <div style="width:12px;height:12px;border-radius:50%;background:${ST_COLOR[d.status]||'var(--bg-2)'};flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;">${esc(d.delivery_number||d.id?.slice(0,8)||'—')} — ${esc(d.items_summary||'Delivery')}</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:2px;">${esc(d.customer_address||'')} · ${esc(d.scheduled_date||'')}</div>
      </div>
      <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${ST_COLOR[d.status]||'var(--bg-2)'};color:#fff;">${(d.status||'').replace('_',' ')}</span>
    </div>`).join('')}
</div>`;
}

function tpresources(el){
  const resources = _tpResources();
  el.innerHTML = `
<div style="max-width:800px;">
  <div style="margin-bottom:16px;font-size:13px;color:var(--text-2);">Product catalogs, installation guides, and resources from Accent Lighting.</div>
  ${resources.length ? `
    <div style="display:grid;gap:10px;">
      ${resources.map(a => `
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:14px 18px;">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(a.title||'Untitled')}</div>
          <div style="font-size:12px;color:var(--text-2);margin-bottom:8px;">${esc((a.body||'').slice(0,120))}${(a.body||'').length>120?'…':''}</div>
          ${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent);">View resource →</a>` : ''}
        </div>`).join('')}
    </div>` : `<div style="padding:32px;text-align:center;color:var(--text-3);">
      <div style="font-size:28px;margin-bottom:8px;">📚</div>
      <div>No resources published yet.</div>
      <div style="font-size:12px;margin-top:4px;">Contact your Accent Lighting rep for catalogs and spec sheets.</div>
    </div>`}
</div>`;
}

function tpcontact(el){
  el.innerHTML = `
<div style="max-width:560px;">
  <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:24px 28px;">
    <h3 style="margin:0 0 16px;font-size:16px;">Send a Message</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:4px;">Subject</label>
        <input id="tpc-subject" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-2);color:var(--text-1);" placeholder="Quote question, delivery update, spec request…">
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:4px;">Message</label>
        <textarea id="tpc-msg" rows="5" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-2);color:var(--text-1);resize:vertical;" placeholder="How can we help?"></textarea>
      </div>
      <button onclick="tpSendContact()" style="padding:10px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Send Message</button>
    </div>
  </div>
  <div style="margin-top:20px;font-size:13px;color:var(--text-2);">
    <strong>Accent Lighting Inc.</strong><br>
    Our team will follow up within 1 business day.
  </div>
</div>`;
}

async function tpSendContact(){
  const subject = ($('tpc-subject')?.value||'').trim();
  const msg     = ($('tpc-msg')?.value||'').trim();
  if(!subject || !msg){ toast('Please fill in subject and message', 'warn'); return; }
  const partner = _tpPartner();
  const note = `[Trade Portal] Subject: ${subject}\n\n${msg}`;

  // Log as a customer interaction (best-effort — table may not exist yet)
  if(typeof sbFetch === 'function'){
    const customerId = (typeof CUSTOMERS !== 'undefined' ? CUSTOMERS : []).find(c =>
      (c.company||c.name||'').toLowerCase().includes((partner?.company||CU?.name||'').toLowerCase())
    )?.id;
    try{
      await sbFetch('customer_interactions','POST',{
        customer_id: customerId || null,
        type:'email', direction:'inbound',
        notes: note,
        interaction_date: new Date().toISOString().slice(0,10),
        rep_name: 'Portal',
      });
    }catch(e){ console.log('tpcontact: interaction log skipped', e.message); }
  }
  $('tpc-subject').value = '';
  $('tpc-msg').value = '';
  toast('Message sent — your rep will follow up soon ✓');
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function _tpStatCard(label, value, sub, onclick, color){
  return `<div onclick="${onclick}" style="background:var(--bg-1);border:1px solid var(--border);border-radius:8px;padding:18px 20px;cursor:pointer;transition:box-shadow .15s;" onmouseenter="this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.boxShadow=''">
    <div style="font-size:28px;font-weight:700;color:${color};">${value}</div>
    <div style="font-size:13px;font-weight:600;margin:4px 0 2px;">${label}</div>
    <div style="font-size:11px;color:var(--text-3);">${sub}</div>
  </div>`;
}

function _tpEmptyState(title, sub){
  return `<div style="display:flex;align-items:center;justify-content:center;height:200px;">
    <div style="text-align:center;color:var(--text-3);">
      <div style="font-size:32px;margin-bottom:8px;">📋</div>
      <div style="font-size:14px;font-weight:600;">${title}</div>
      <div style="font-size:12px;margin-top:4px;">${sub}</div>
    </div>
  </div>`;
}
