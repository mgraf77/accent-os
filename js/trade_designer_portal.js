// ── 6.5 TRADE & DESIGNER PORTAL (internal staff management view) ──
// Full relationship dashboard for every trade partner (designer/architect/contractor/etc).
// Surfaces linked business (quotes, deals, jobs, deliveries) per partner in one place.
// Complements portal_preview.js (which shows the future external-facing view).
// No new schema — reads from: trade_partners, quotes, deals, jobs, customers.

let tpPortalExpanded = null; // id of partner with expanded detail row

function tradeportal(el, actions) {
  if (actions) {
    actions.innerHTML = `
      <button class="btn btn-accent btn-sm" onclick="openTradePartnerEdit(null)">+ New Partner</button>
      <button class="btn btn-outline btn-sm" onclick="goTo('portalpreview');setTimeout(()=>{if(typeof portalPreview!=='undefined')portalPreview.mode='trade';portalpreview($('pg-content'),$('pg-actions'));},50)">👁 Portal Preview</button>
    `;
  }

  const partners = typeof TRADE_PARTNERS !== 'undefined' ? TRADE_PARTNERS : [];
  const allDeals = typeof DEALS !== 'undefined' ? Object.values(DEALS).flat() : [];
  const allQuotes = typeof QUOTES !== 'undefined' ? QUOTES : [];
  const allJobs = typeof JOBS !== 'undefined' ? JOBS : [];
  const allCustomers = typeof CUSTOMERS !== 'undefined' ? CUSTOMERS : [];

  if (!partners.length) {
    el.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:var(--text-3);font-size:13px;">
      No trade partners loaded.<br>
      <button class="btn btn-accent btn-sm" style="margin-top:12px;" onclick="goTo('tradepartners')">Go to Trade Partners →</button>
    </div>`;
    return;
  }

  // ── compute linked business per partner ──
  function partnerKey(p) {
    return (p.company || p.name || '').trim().toLowerCase();
  }
  function matchName(name, str) {
    if (!name || !str) return false;
    const k = name.trim().toLowerCase();
    const s = str.trim().toLowerCase();
    return s === k || s.startsWith(k) || k.startsWith(s.split(' ')[0]);
  }
  function getLinked(p) {
    const key = partnerKey(p);
    const custId = p.related_customer_id || null;
    const quotes = allQuotes.filter(q =>
      (custId && q.customer_id === custId) ||
      matchName(key, q.customer || q.customer_name || q.company || '')
    );
    const deals = allDeals.filter(d =>
      (custId && d.customer_id === custId) ||
      matchName(key, d.company || d.customer || '')
    );
    const jobs = allJobs.filter(j =>
      (custId && j.customer_id === custId) ||
      matchName(key, j.company || j.customer_name || '')
    );
    return { quotes, deals, jobs };
  }

  // ── aggregate stats ──
  const active = partners.filter(p => p.status === 'active');
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
  const recentlyEngaged = partners.filter(p => p.last_engaged && p.last_engaged >= thirtyDaysAgo).length;
  let totalPipelineValue = 0;
  let partnersWithBusiness = 0;
  partners.forEach(p => {
    const { quotes, deals } = getLinked(p);
    const val = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    totalPipelineValue += val;
    if (quotes.length || deals.length) partnersWithBusiness++;
  });

  // ── table rows ──
  const sorted = [...partners].sort((a, b) => {
    const ord = { active: 0, prospect: 1, inactive: 2 };
    if (a.status !== b.status) return (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
    return (a.name || '').localeCompare(b.name || '');
  });

  const typeColors = { designer: '#3b82f6', architect: '#8b5cf6', contractor: '#f59e0b', builder: '#10b981', installer: '#06b6d4', electrician: '#f97316', other: '#6b7280' };

  el.innerHTML = `
    <div class="g4 mb16">
      <div class="card stat-card">
        <div class="stat-label">Active Partners</div>
        <div class="stat-value">${active.length}</div>
        <div class="stat-sub">${partners.filter(p => p.status === 'prospect').length} prospect · ${partners.filter(p => p.status === 'inactive').length} inactive</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Engaged (30d)</div>
        <div class="stat-value">${recentlyEngaged}</div>
        <div class="stat-sub">last_engaged ≥ ${thirtyDaysAgo}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Partners w/ Business</div>
        <div class="stat-value">${partnersWithBusiness}</div>
        <div class="stat-sub">linked quotes or deals</div>
      </div>
      <div class="card stat-card" ${totalPipelineValue > 0 ? 'style="border-left:3px solid var(--green);"' : ''}>
        <div class="stat-label">Linked Pipeline</div>
        <div class="stat-value">$${Math.round(totalPipelineValue / 1000).toLocaleString()}K</div>
        <div class="stat-sub">deals attributed to partners</div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd">
        <span class="card-title">Trade & Designer Relationships · ${partners.length}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span class="sm muted">Click any row to expand relationship details.</span>
          <button class="btn btn-outline btn-sm" onclick="goTo('tradepartners')">Manage Partners →</button>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 340px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Company</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Quotes</th>
              <th>Deals</th>
              <th>Jobs</th>
              <th>Last Engaged</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(p => {
              const { quotes, deals, jobs } = getLinked(p);
              const isExp = tpPortalExpanded === p.id;
              const typeColor = typeColors[p.type] || '#6b7280';
              const ratingColor = p.rating >= 8 ? 'var(--green)' : p.rating >= 6 ? 'var(--blue)' : 'var(--yellow)';
              const dealVal = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
              const hasActivity = quotes.length || deals.length || jobs.length;
              return `<tr style="cursor:pointer;${p.status === 'inactive' ? 'opacity:0.55;' : ''}${isExp ? 'background:var(--surface2);' : ''}" onclick="tpPortalExpanded=${isExp ? 'null' : `'${p.id}'`};tradeportal($('pg-content'),$('pg-actions'))">
                <td style="font-weight:600;">${esc(p.name || '')}<span style="margin-left:4px;font-size:11px;color:var(--text-3);">${isExp ? '▲' : '▼'}</span></td>
                <td><span style="font-size:11px;font-weight:600;color:${typeColor};">${p.type || '—'}</span></td>
                <td class="sm">${esc(p.company || '—')}</td>
                <td>${p.rating != null ? `<span class="mono fw6" style="color:${ratingColor};">${Number(p.rating).toFixed(1)}</span>` : '<span class="muted">—</span>'}</td>
                <td><span class="badge ${p.status === 'active' ? 'bg-green' : p.status === 'prospect' ? 'bg-blue' : 'bg-gray'}" style="font-size:10px;">${esc(p.status)}</span></td>
                <td class="mono">${quotes.length ? `<span style="color:var(--accent);">${quotes.length}</span>` : '<span class="muted">—</span>'}</td>
                <td class="mono">${deals.length ? `<span style="color:var(--green);">${deals.length}${dealVal ? ' · $' + Math.round(dealVal / 1000) + 'K' : ''}</span>` : '<span class="muted">—</span>'}</td>
                <td class="mono">${jobs.length ? `<span style="color:var(--blue);">${jobs.length}</span>` : '<span class="muted">—</span>'}</td>
                <td class="sm">${p.last_engaged ? `<span style="color:${p.last_engaged >= thirtyDaysAgo ? 'var(--green)' : 'var(--text-2)'}">${p.last_engaged}</span>` : '<span class="muted">—</span>'}</td>
              </tr>
              ${isExp ? _tpPortalDetailRow(p, quotes, deals, jobs, allCustomers) : ''}`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _tpPortalDetailRow(p, quotes, deals, jobs, allCustomers) {
  const linkedCust = p.related_customer_id
    ? allCustomers.find(c => c.id === p.related_customer_id)
    : null;

  const openDeals = deals.filter(d => !['won', 'lost', 'abandoned'].includes(d._stage || d.stage));
  const wonDeals = deals.filter(d => (d._stage || d.stage) === 'won');
  const openQuotes = quotes.filter(q => q.status !== 'archived');

  return `<tr>
    <td colspan="9" style="padding:0;">
      <div style="background:var(--surface2);border-top:1px solid var(--border);border-bottom:2px solid var(--accent);padding:18px 22px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">

          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Profile</div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:4px;">
              ${p.email ? `<div>✉ <a href="mailto:${esc(p.email)}" style="color:var(--accent);">${esc(p.email)}</a></div>` : ''}
              ${p.phone ? `<div>📞 ${esc(p.phone)}</div>` : ''}
              ${p.website ? `<div>🌐 <a href="${esc(p.website)}" target="_blank" style="color:var(--accent);">${esc(p.website)}</a></div>` : ''}
              ${p.address ? `<div>📍 ${esc(p.address)}</div>` : ''}
              ${p.trade_license ? `<div>🪪 License: ${esc(p.trade_license)}</div>` : ''}
              ${p.preferred_terms ? `<div>📋 Terms: ${esc(p.preferred_terms)}</div>` : ''}
              ${linkedCust ? `<div style="margin-top:6px;">🔗 Linked customer: <a href="#" style="color:var(--accent);" onclick="goTo('customers')">${esc(linkedCust.name)}</a></div>` : ''}
              ${p.notes ? `<div style="margin-top:6px;color:var(--text-2);font-style:italic;">${esc(p.notes)}</div>` : ''}
            </div>
          </div>

          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Quotes (${quotes.length})</div>
            ${openQuotes.length === 0
              ? `<div style="font-size:12px;color:var(--text-3);">No linked quotes found.</div>`
              : `<div style="font-size:12px;display:flex;flex-direction:column;gap:3px;">
                  ${openQuotes.slice(0, 5).map(q => `
                    <div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--surface);border-radius:5px;border:1px solid var(--border-light);">
                      <span>${esc(q.id || '')} · ${esc((q.project || q.customer || '').slice(0, 28))}</span>
                      <span class="mono fw6">$${Math.round(q.total || 0).toLocaleString()}</span>
                    </div>`).join('')}
                  ${openQuotes.length > 5 ? `<div style="color:var(--text-3);">+ ${openQuotes.length - 5} more</div>` : ''}
                </div>`
            }
          </div>

          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Deals — ${openDeals.length} open · ${wonDeals.length} won</div>
            ${deals.length === 0
              ? `<div style="font-size:12px;color:var(--text-3);">No linked deals found.</div>`
              : `<div style="font-size:12px;display:flex;flex-direction:column;gap:3px;">
                  ${deals.slice(0, 5).map(d => {
                    const stg = d._stage || d.stage || '';
                    return `<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--surface);border-radius:5px;border:1px solid var(--border-light);">
                      <span>${esc((d.title || d.company || '').slice(0, 28))} <span style="font-size:10px;color:var(--text-3);">${stg}</span></span>
                      <span class="mono fw6">$${Math.round(Number(d.value) || 0).toLocaleString()}</span>
                    </div>`;
                  }).join('')}
                  ${deals.length > 5 ? `<div style="color:var(--text-3);">+ ${deals.length - 5} more</div>` : ''}
                </div>`
            }
          </div>
        </div>

        ${jobs.length > 0 ? `
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">Jobs (${jobs.length})</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${jobs.slice(0, 6).map(j => `<span style="font-size:11px;padding:3px 8px;background:var(--surface);border:1px solid var(--border);border-radius:4px;">${esc(j.job_number || '')} ${esc((j.project_name || '').slice(0, 24))}</span>`).join('')}
            ${jobs.length > 6 ? `<span style="font-size:11px;color:var(--text-3);">+ ${jobs.length - 6} more</span>` : ''}
          </div>
        </div>` : ''}

        <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border-light);">
          ${p.email ? `<a href="mailto:${esc(p.email)}?subject=Accent Lighting - Following Up" class="btn btn-outline btn-sm">✉ Email Partner</a>` : ''}
          <button class="btn btn-outline btn-sm" onclick="openTradePartnerEdit('${p.id}')">✏ Edit Profile</button>
          <button class="btn btn-outline btn-sm" onclick="goTo('portalpreview');setTimeout(()=>{if(typeof portalPreview!=='undefined'){portalPreview.mode='trade';portalPreview.selectedId='${p.id}';}portalpreview($('pg-content'),$('pg-actions'));_ppRender();},80)">👁 Preview Portal</button>
          <button class="btn btn-outline btn-sm" onclick="goTo('quotes')">+ New Quote</button>
        </div>
      </div>
    </td>
  </tr>`;
}
