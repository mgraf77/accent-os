// ── REPOUTREACH MODULE (extracted from index.html at v6.11.1) ──
register({ name: 'repoutreach_module', provides: ['repoutreach','openRepOutreach'], consumes: ['VD','REP_DIRECTORY','CAT_DEFS','toast','esc','$'] });

// ── REP OUTREACH EMAIL GENERATOR ──
function openRepOutreach(repName){
  const repInfo = REP_DIRECTORY.find(r => r['Rep Company'] === repName) || {};
  const vendors = VD.filter(v => v.rep === repName).sort((a,b)=>(b.sales?.t||0)-(a.sales?.t||0));
  if(vendors.length===0){ toast('No vendors assigned to this rep','err'); return; }

  const TERM_CATS = [
    {key:'rebates',   label:'Rebate program'},
    {key:'discounts', label:'Inside/volume discount'},
    {key:'credit',    label:'Credit terms'},
    {key:'freight',   label:'Free freight threshold'},
    {key:'returns',   label:'Returns/RGA'},
    {key:'mktgFunds', label:'Marketing/co-op funds'},
    {key:'display',   label:'Display program'},
  ];

  const buildVendorBlock = v => {
    const lines = TERM_CATS.map(({key, label}) => {
      const sc = v.scores?.[key];
      const j = (sc?.j || '').replace(/\. Details: nan/g,'').replace(/Scored based on manufacturer direct sales[^.]*\./g,'').replace(/Vendor is on Lights America website\./g,'').replace(/Accent Lighting is listed under general dealers[^.]*\./g,'').trim();
      let val;
      if(!sc && !j){ val = '(nothing on file — please provide)'; }
      else if(j.length > 2){
        val = ['returns','display','mktgFunds','discounts'].includes(key) ? `${j} — please provide details` : `${j} — correct?`;
      } else { val = '(nothing on file — please provide)'; }
      return `  ${label}:`.padEnd(32) + val;
    });
    const div = '══════════════════════════════════════════';
    return `${div}\n${v.name.toUpperCase()}\n${div}\n${lines.join('\n')}`;
  };

  // Build contacts list from all emails on file for this rep
  const contacts = [];
  if(repInfo['Primary Contact'] && (repInfo['Email'] || repInfo['Office Email'])){
    contacts.push({name: repInfo['Primary Contact'], email: repInfo['Email'] || repInfo['Office Email'], phone: repInfo['Phone'] || repInfo['Office Phone'] || ''});
  }
  if(repInfo['Secondary Contact'] && repInfo['Sec Email']){
    contacts.push({name: repInfo['Secondary Contact'], email: repInfo['Sec Email'], phone: ''});
  }
  if(repInfo['Quote Email'] && !contacts.find(c => c.email === repInfo['Quote Email'])){
    contacts.push({name: 'Quotes', email: repInfo['Quote Email'], phone: ''});
  }

  const defaultTo = contacts.map(c => c.email).filter(Boolean).join(', ');
  const greeting = contacts.length >= 2
    ? contacts.slice(0,2).map(c => c.name.split(' ')[0]).join(' and ')
    : (contacts[0]?.name.split(' ')[0] || repName);
  const secLine = repInfo['Sec Email'] ? `\n  Secondary:        ${repInfo['Secondary Contact'] || 'Secondary'} — ${repInfo['Sec Email']}` : '';
  const subject = `${repName} — Vendor Terms & Linecard Verification (2026 Review)`;
  const linecard = vendors.map(v => `  [ ] ${v.name}`).join('\n');
  const vendorBlocks = vendors.map(buildVendorBlock).join('\n\n');

  const body =
`${greeting},

I'm reaching out as part of a formal vendor ranking and terms review we're doing at Accent Lighting for 2026. We're evaluating every line we carry — looking at rebates, freight, terms, display programs, and channel policies — so we can prioritize growth and display investment with the vendors where the partnership structure works best for both sides. Lines with strong, well-documented terms get more floor space, more active selling, and more of our team's attention.

You represent some significant lines for us, and I want to make sure we're working off accurate information before we finalize rankings and purchasing plans for the year.


SECTION 1 — CONTACT DIRECTORY

Please confirm or correct the following:

  Rep Company:      ${repName}
  Primary Contact:  ${repInfo['Primary Contact'] || '(none on file)'}
  Phone:            ${repInfo['Phone'] || repInfo['Office Phone'] || '(none on file)'}
  Email:            ${repInfo['Email'] || repInfo['Office Email'] || '(none on file)'}
  Website:          ${repInfo['Website'] || '(none on file)'}${secLine}

Who should we contact for each of the following? (name + email + phone)

  Quote requests:       ___________________________
  RGA / returns:        ___________________________
  Parts requests:       ___________________________
  Co-op / MDF claims:   ___________________________
  General questions:    ___________________________

—

SECTION 2 — LINECARD VERIFICATION

Below is every line we have assigned to ${repName} in our system. Please:
  • Check off each line you still actively represent for us
  • Note any lines you no longer carry
  • Add any lines you represent that aren't listed

${linecard}

Lines you represent that are NOT listed above:
  ___________________________
  ___________________________
  ___________________________

—

SECTION 3 — VENDOR TERMS

For each vendor, I've listed exactly what we have on file. Fields marked "(nothing on file)" are gaps we need filled. Fields with data just need a confirmation or correction.

If it's easier, attach any dealer program sheets, price book terms, or vendor agreements and I'll pull the data from those directly — no need to fill this out manually if you have the docs.

${vendorBlocks}

—

SECTION 4 — ANYTHING ELSE

Anything else you'd like us to have on file? New programs, line changes, preferred ordering windows, or anything that would help us work better together?

I appreciate you taking the time on this. If it's easier, just attach any dealer program sheets, price book terms, or vendor agreements and I'll pull everything from those directly — no need to fill this all out manually if you have the docs.

Please give me a call if you have any questions or would like to discuss anything prior to responding to this email.

The information you provide goes directly into how we prioritize display space, purchasing decisions, and vendor relationships for 2026.


Michael Graf
Accent Lighting, Inc.
10322 E. Stonegate Lane, Suite 100
Wichita, KS 67206
316-636-1278
michaelg@accentlightinginc.com
accentlightinginc.com

P.S. — I've attached our Vendor Scoring Rubric so you can see exactly how we evaluate each category. Happy to walk through it on a call if helpful.`;

  // Build recipient checkboxes
  const recipientRows = contacts.length > 0
    ? contacts.map((c,i) => `<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border);border-radius:5px;cursor:pointer;font-size:12px;"><input type="checkbox" class="ro-rcb" data-email="${esc(c.email)}" ${i===0?'checked':''} onchange="(()=>{const v=[...document.querySelectorAll('.ro-rcb:checked')].map(el=>el.dataset.email);document.getElementById('ro-to').value=v.join(', ');})()" ><span><strong>${esc(c.name)}</strong>${c.email?' — '+esc(c.email):''}${c.phone?' — '+esc(c.phone):''}</span></label>`).join('')
    : `<div style="font-size:12px;color:var(--accent);">⚠ No contacts on file for this rep.</div>`;

  openModal(`Outreach Email — ${repName}`, `
    <div style="font-size:12px;color:var(--text-3);margin-bottom:10px;">
      Draft generated from vendor terms on file. Edit freely before copying to Outlook.
      ${vendors.length} vendor${vendors.length===1?'':'s'} included.
      ${defaultTo ? '' : '<br><strong style="color:var(--accent);">⚠ No email on file for this rep.</strong>'}
    </div>
    <div style="display:grid;gap:10px;margin-bottom:12px;">
      <div>
        <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);display:block;margin-bottom:6px;">Recipients — select who to send to</label>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">${recipientRows}</div>
        <input id="ro-to" value="${esc(defaultTo)}" placeholder="Or type emails manually" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:5px;font-family:monospace;font-size:12px;">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);">Subject</label>
        <input id="ro-subj" value="${esc(subject)}" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:5px;font-size:13px;">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);">Body — edit before sending</label>
        <textarea id="ro-body" rows="24" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:5px;font-family:'DM Mono',monospace;font-size:11.5px;line-height:1.5;resize:vertical;">${esc(body)}</textarea>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--border);">
      <button class="btn btn-outline" onclick="downloadScoringRubric()">📎 Download Rubric</button>
      <button class="btn btn-outline" onclick="(()=>{const s=document.getElementById('ro-subj').value;navigator.clipboard.writeText(s).then(()=>toast('Subject copied','ok'));})()">📋 Copy Subject</button>
      <button class="btn btn-accent" onclick="(()=>{const b=document.getElementById('ro-body').value;navigator.clipboard.writeText(b).then(()=>toast('Email body copied — paste into Outlook','ok'));})()">📋 Copy Body → Outlook</button>
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
    </div>
  `);
}


function renderHistory(container) {
  // Vendor profile event timeline — repurposed from sales history.
  // Shows changelog entries grouped by date (rep changes, term/score changes, edits).
  const log = (typeof CHANGELOG !== 'undefined' && Array.isArray(CHANGELOG)) ? CHANGELOG : [];

  // Group by date (YYYY-MM-DD)
  const groups = {};
  log.forEach(e => {
    const d = (e.ts || '').slice(0,10) || 'undated';
    (groups[d] = groups[d] || []).push(e);
  });
  const dates = Object.keys(groups).sort().reverse();

  container.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Vendor Profile History</span>
        <span class="sm muted">${log.length} event${log.length===1?'':'s'} logged</span>
      </div>
      <div style="padding:18px 20px 8px 20px;font-size:12px;color:var(--text-3);">
        Tracks every change to a vendor profile — rep changes, term updates, score changes, status changes.
      </div>
      <div style="padding:0 20px 24px 20px;max-height:calc(100vh - 280px);overflow-y:auto;">
        ${log.length===0 ? `
          <div style="text-align:center;padding:60px 20px;color:var(--text-3);">
            <div style="font-size:42px;margin-bottom:10px;">🕘</div>
            <p style="font-size:15px;font-weight:600;margin-bottom:6px;">No events yet</p>
            <p style="font-size:13px;">Vendor changes will appear here as they happen.</p>
          </div>
        ` : dates.map(d => `
          <div style="margin-top:18px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-3);border-bottom:1px solid var(--border);padding-bottom:6px;margin-bottom:8px;">${d}</div>
            ${groups[d].map(e => `
              <div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid var(--border-light);align-items:flex-start;">
                <div style="font-size:11px;font-family:'DM Mono',monospace;color:var(--text-3);min-width:60px;">${(e.ts||'').slice(11,16)}</div>
                <div style="flex:1;">
                  <div style="font-size:13px;"><strong>${esc(e.vendor||'')}</strong> — <span style="color:var(--text-2);">${esc(e.cat||'')}</span></div>
                  <div style="font-size:12px;color:var(--text-3);margin-top:2px;">
                    <span style="text-decoration:line-through;">${esc(String(e.oldVal??'—'))}</span>
                    &nbsp;→&nbsp;
                    <span style="color:var(--text);font-weight:600;">${esc(String(e.newVal??'—'))}</span>
                  </div>
                </div>
                <div style="font-size:11px;color:var(--text-3);">${esc(e.user||'')}</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRepGroupAudit(container) {
  // Flags parent companies where child vendors have mixed or missing rep assignments.
  const issues = [];
  if(typeof PARENT_COMPANIES!=='undefined' && PARENT_COMPANIES.length){
    PARENT_COMPANIES.forEach(parent => {
      const children = VD.filter(v => VENDOR_PARENTS[v.id] === parent.id);
      if(!children.length) return;
      const reps = [...new Set(children.map(v => v.rep||'').filter(Boolean))];
      const blanks = children.filter(v => !v.rep);
      if(reps.length > 1 || blanks.length){
        issues.push({ parent, children, reps, blanks });
      }
    });
  }
  // Sort: most children first
  issues.sort((a,b) => b.children.length - a.children.length);

  container.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Rep-Group Audit</span>
        <span class="sm muted">${issues.length} parent${issues.length===1?'':'s'} with mixed or missing rep assignments</span>
      </div>
      <div style="padding:18px 20px 8px;">
        <p style="font-size:13px;color:var(--text-2);margin-bottom:16px;">Parent companies where child vendors have conflicting or blank rep group assignments. Fix these to ensure sister-vendor grouping works correctly.</p>
        ${issues.length===0 ? `
          <div style="text-align:center;padding:60px 20px;color:var(--text-3);">
            <div style="font-size:42px;margin-bottom:10px;">✅</div>
            <p style="font-size:15px;font-weight:600;margin-bottom:6px;">All clean</p>
            <p style="font-size:13px;">No mixed or blank rep assignments detected across parent groups.</p>
          </div>
        ` : issues.map(issue => `
          <div style="border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:12px;background:var(--surface);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="font-weight:700;font-size:14px;">${esc(issue.parent.name)}</span>
              ${issue.reps.length>1 ? `<span style="font-size:11px;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-weight:600;">⚠ Mixed reps</span>` : ''}
              ${issue.blanks.length ? `<span style="font-size:11px;background:var(--red-bg);color:var(--accent);padding:2px 8px;border-radius:4px;font-weight:600;">${issue.blanks.length} blank</span>` : ''}
            </div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
              <thead>
                <tr style="color:var(--text-3);text-align:left;">
                  <th style="padding:4px 8px;font-weight:600;">Vendor</th>
                  <th style="padding:4px 8px;font-weight:600;">Rep Group</th>
                  <th style="padding:4px 8px;font-weight:600;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${issue.children.map(v => `
                  <tr style="border-top:1px solid var(--border-light);">
                    <td style="padding:5px 8px;">${esc(v.name)}</td>
                    <td style="padding:5px 8px;font-family:'DM Mono',monospace;">${v.rep ? esc(v.rep) : '<span style="color:var(--accent);">— blank —</span>'}</td>
                    <td style="padding:5px 8px;">
                      ${!v.rep ? '<span style="color:var(--accent);font-weight:600;">Needs assignment</span>' : (issue.reps.length>1 && v.rep !== issue.reps[0]) ? '<span style="color:#d97706;font-weight:600;">Differs from siblings</span>' : '<span style="color:var(--green);">OK</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSales(container) {
  const vendorsWithSales = VD.filter(v => v.sales && v.sales.t > 0)
    .sort((a, b) => (b.sales?.t || 0) - (a.sales?.t || 0));

  const totalSales = vendorsWithSales.reduce((sum, v) => sum + (v.sales?.t || 0), 0);

  container.innerHTML = `
    <div class="card mb16">
      <div class="g4">
        <div class="stat-card">
          <div class="stat-label">Total 5-Yr Sales</div>
          <div class="stat-value">${fmt$(totalSales)}</div>
          <div class="stat-sub">${vendorsWithSales.length} vendors</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg per Vendor</div>
          <div class="stat-value">${fmt$(totalSales / vendorsWithSales.length)}</div>
          <div class="stat-sub">Mean 5-year total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Top Vendor</div>
          <div class="stat-value" style="font-size:16px;">${esc(vendorsWithSales[0]?.name || '—')}</div>
          <div class="stat-sub">${fmt$(vendorsWithSales[0]?.sales?.t)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Vendors > $100K</div>
          <div class="stat-value">${vendorsWithSales.filter(v => v.sales.t >= 100000).length}</div>
          <div class="stat-sub">Major suppliers</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd">
        <span class="card-title">Sales Analysis</span>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Vendor</th>
              <th class="mono">2025</th>
              <th class="mono">2024</th>
              <th class="mono">2023</th>
              <th class="mono">2022</th>
              <th class="mono">2021</th>
              <th class="mono">5-Yr Total</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${vendorsWithSales.map((v, i) => {
              const pct = (v.sales.t / totalSales * 100).toFixed(1);
              return `
                <tr>
                  <td class="mono muted">${i + 1}</td>
                  <td style="font-weight:600;cursor:pointer;color:var(--accent);" onclick="openVendorDetail(${v.id})">${esc(v.name)}</td>
                  <td class="mono sm">${v.sales['2025'] ? fmt$(v.sales['2025']) : '—'}</td>
                  <td class="mono sm">${v.sales['2024'] ? fmt$(v.sales['2024']) : '—'}</td>
                  <td class="mono sm">${v.sales['2023'] ? fmt$(v.sales['2023']) : '—'}</td>
                  <td class="mono sm">${v.sales['2022'] ? fmt$(v.sales['2022']) : '—'}</td>
                  <td class="mono sm">${v.sales['2021'] ? fmt$(v.sales['2021']) : '—'}</td>
                  <td class="mono fw6">${fmt$(v.sales.t)}</td>
                  <td class="mono sm muted">${pct}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}


function renderWeights(container){
  const currentWeights = CAT_DEFS.map(c => ({label:c.label, weight:c.weight, key:c.key, group:c.group}));
  const stripParen = s => s.replace(/\s*\([^)]*\)\s*$/,'').trim();

  const buildRow = (c,i) => `
    <div style="padding:6px 8px;background:var(--surface);border-radius:4px;font-size:12px;display:flex;align-items:center;gap:6px;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.group==='Financial'?'var(--accent)':'var(--blue)'};"></span>
      <strong>${c.label}</strong>
      <span style="font-size:10px;color:var(--text-3);margin-left:auto;">${c.group==='Financial'?'Fin':'S&M'}</span>
    </div>
    <div style="padding:6px 8px;text-align:center;background:var(--surface);border-radius:4px;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;">${((c.weight / TOTAL_WEIGHT) * 100).toFixed(1)}%</div>
    <div style="padding:4px 6px;text-align:center;background:var(--surface);border-radius:4px;">
      <input type="number" id="scenario-a-${i}" step="0.1" min="0" max="100"
             value="${((c.weight / TOTAL_WEIGHT) * 100).toFixed(1)}"
             oninput="updateScenarioSum('a')"
             style="width:60px;padding:4px;text-align:center;border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;">
    </div>
    <div style="padding:4px 6px;text-align:center;background:var(--surface);border-radius:4px;">
      <input type="number" id="scenario-b-${i}" step="0.1" min="0" max="100"
             value="${((c.weight / TOTAL_WEIGHT) * 100).toFixed(1)}"
             oninput="updateScenarioSum('b')"
             style="width:60px;padding:4px;text-align:center;border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;">
    </div>
  `;

  container.innerHTML = `
    <div class="card">
      <div class="card-hd"><span class="card-title">Weight Scenario Builder</span></div>
      <div style="padding:18px 20px;">
        <p style="font-size:13px;color:var(--text-2);margin-bottom:14px;">
          Test alternate weight distributions without affecting live scores. The <strong>Live</strong> column shows the active weights used everywhere in AccentOS. Edit Scenario A or B to model alternate weightings — totals must reach 100%.
        </p>

        <div style="display:grid;grid-template-columns:2.5fr 0.9fr 0.9fr 0.9fr;gap:6px;font-size:12px;align-items:center;">
          <div style="font-weight:700;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);">Category</div>
          <div style="font-weight:700;padding:6px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);">Live</div>
          <div style="font-weight:700;padding:6px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);">Scenario A</div>
          <div style="font-weight:700;padding:6px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);">Scenario B</div>

          ${currentWeights.map(buildRow).join('')}

          <div style="padding:8px;font-weight:700;border-top:2px solid var(--border);margin-top:6px;">Total</div>
          <div style="padding:8px;text-align:center;font-weight:700;border-top:2px solid var(--border);margin-top:6px;" class="mono">100%</div>
          <div id="scenario-a-sum" style="padding:8px;text-align:center;font-weight:700;border-top:2px solid var(--border);margin-top:6px;" class="mono">100.0%</div>
          <div id="scenario-b-sum" style="padding:8px;text-align:center;font-weight:700;border-top:2px solid var(--border);margin-top:6px;" class="mono">100.0%</div>
        </div>

        <div style="margin-top:18px;padding:14px;background:var(--surface2);border-radius:8px;font-size:12px;color:var(--text-2);">
          <strong>How it works:</strong> Each scenario shows a hypothetical weight distribution. The vendor scores you see in the <em>Scores</em> tab are computed from the Live column. Use scenarios to evaluate alternate strategies — for example, weighting Demand higher and Rebates lower — before committing to a change.
        </div>
      </div>
    </div>
  `;
}


// ── REP OUTREACH ─────────────────────────────────────────────────
const OUTREACH_CATS=[
  {key:'rebates',   label:'Rebate Program',         desc:'Annual rebates, growth incentives. Include % and thresholds.'},
  {key:'discounts', label:'Inside / Volume Discounts',desc:'Standard discounts and volume-based pricing. Include % tiers.'},
  {key:'credit',    label:'Credit Terms',            desc:'Payment terms (Net 30/45/60), early pay discounts.'},
  {key:'freight',   label:'Freight Policy',          desc:'Prepaid thresholds, drop-ship fees, surcharges. Include $ amounts.'},
  {key:'returns',   label:'Return / RGA Policy',     desc:'Restocking fees, RGA timeframes, damaged goods handling.'},
  {key:'imap',      label:'IMAP / MAP Markup',       desc:'Minimum advertised price multiplier and enforcement details.'},
  {key:'mktgFunds', label:'Marketing Co-op / MDF',   desc:'MDF %, reimbursement structure, ease of claim.'},
  {key:'display',   label:'Display Allowance',       desc:'Display support: discounts, free displays, refresh programs.'},
];

function repoutreach(container){
  const contactable = REP_DIRECTORY.filter(r=>r.Email);
  let selRep = contactable[0]||null;

  function fmtS(n){return n>=1000000?'$'+(n/1000000).toFixed(1)+'M':n>=1000?'$'+(n/1000).toFixed(0)+'K':'$'+Math.round(n);}

  function getVendors(rep){
    return VD.filter(v=>v.rep===rep['Rep Company']).sort((a,b)=>(b.sales?.t||0)-(a.sales?.t||0));
  }

  function buildEmail(rep,vendors){
    const first=(rep['Primary Contact']||rep['Rep Company']).split(' ')[0];
    const vendorSections=vendors.map(v=>{
      const sc=v.scores||{};
      const rows=OUTREACH_CATS.map(cat=>{
        const s=sc[cat.key];
        let onFile=s?s.justification.replace(/\. Details: nan/g,'').replace(/Scored based on manufacturer direct sales[^.]*\./,'').trim():'';
        if(onFile==='[internal scoring]')onFile='';
        return `<tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0ec;vertical-align:top;width:36%;font-size:13px;">
            <strong style="color:#1a1a1a;">${cat.label}</strong><br>
            <span style="font-size:11px;color:#999;">${cat.desc}</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0ec;vertical-align:top;width:32%;background:#EBF5FB;font-size:12px;color:${onFile?'#1a1a1a':'#aaa'};">${onFile||'No data on file'}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0ec;vertical-align:top;width:32%;background:#FEFCE8;font-size:12px;color:#aaa;font-style:italic;">Your correction or update (leave blank if above is correct)</td>
        </tr>`;
      }).join('');
      const sales=v.sales?.t||0;
      return `<div style="margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;border:1px solid #e8e8e4;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#1a1a1a;">
              <td colspan="3" style="padding:14px 18px;">
                <span style="font-size:15px;font-weight:700;color:#fff;">${v.name}</span>
                <span style="font-size:12px;color:#999;margin-left:12px;">5-yr Accent purchases: ${fmtS(sales)}</span>
              </td>
            </tr>
            <tr style="background:#f8f8f6;">
              <td style="padding:7px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em;">Term / Category</td>
              <td style="padding:7px 14px;font-size:11px;font-weight:700;color:#1a6fa0;text-transform:uppercase;letter-spacing:.05em;background:#EBF5FB;">What We Have on File</td>
              <td style="padding:7px 14px;font-size:11px;font-weight:700;color:#a08700;text-transform:uppercase;letter-spacing:.05em;background:#FEFCE8;">Your Update / Correction</td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:6px;padding:10px 14px;background:#f8f8f6;border:1px solid #e8e8e4;border-radius:6px;font-size:12px;color:#888;">Additional notes for ${v.name}: <br><br></div>
      </div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f4f2;">
<div style="max-width:760px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:26px 32px;">
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="background:#ed1c24;width:5px;height:40px;border-radius:3px;flex-shrink:0;"></div>
      <div><div style="font-size:19px;font-weight:700;color:#fff;">ACCENT LIGHTING</div>
      <div style="font-size:12px;color:#888;margin-top:2px;">Vendor Terms Verification — 2025–2026 Program Year</div></div>
    </div>
  </div>
  <div style="padding:30px 32px;">
    <p style="font-size:15px;color:#1a1a1a;margin:0 0 6px;">Hi ${first},</p>
    <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 20px;">We're doing our annual vendor terms review and want to make sure everything we have on file for your lines is accurate. I've put together what we currently have for each vendor below — please take a look and reply with anything that needs updating.</p>
    <div style="background:#f8f8f6;border:1px solid #e8e8e4;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Vendors covered in this email</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${vendors.map(v=>`<span style="background:#fff;border:1px solid #e8e8e4;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:600;color:#1a1a1a;">${v.name}</span>`).join('')}</div>
    </div>
    <div style="background:#EBF5FB;border-left:4px solid #1a6fa0;padding:11px 16px;margin-bottom:26px;border-radius:0 6px 6px 0;">
      <div style="font-size:13px;font-weight:600;color:#1a6fa0;margin-bottom:3px;">How to respond</div>
      <div style="font-size:13px;color:#1a1a1a;line-height:1.6;">The <strong>blue columns</strong> show what we have on file. The <strong>yellow columns</strong> are where you add corrections or additions. Just reply to this email — leave any yellow field blank if the blue info is already correct.</div>
    </div>
    ${vendorSections}
    <div style="border-top:1px solid #e8e8e4;padding-top:22px;margin-top:4px;">
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 10px;">We appreciate you taking the time on this — accurate terms help us make better buying and display decisions across your lines.</p>
      <p style="font-size:14px;color:#444;margin:0 0 18px;">Just hit reply with any updates, or call if it's easier.</p>
      <p style="font-size:14px;color:#1a1a1a;margin:0;">Thanks,<br><strong>Michael Graf</strong><br><span style="color:#888;">Accent Lighting Inc. — Wichita, KS</span><br><span style="color:#888;">316-636-1278 | michaelg@accentlightinginc.com</span></p>
    </div>
  </div>
</div></body></html>`;
  }

  function render(){
    if(!contactable.length){container.innerHTML=`<div class="card" style="padding:40px;text-align:center;color:var(--text-3);">No reps with email on file.</div>`;return;}
    const vendors=selRep?getVendors(selRep):[];
    const emailHTML=selRep?buildEmail(selRep,vendors):'';
    const subject=selRep?`Vendor Terms Verification — ${selRep['Rep Company']} Lines (2025–2026)`:'';

    container.innerHTML=`
      <div style="display:grid;grid-template-columns:268px 1fr;gap:14px;height:calc(100vh-120px);overflow:hidden;">
        <!-- LEFT: Rep list -->
        <div style="overflow-y:auto;">
          <div class="card" style="padding:14px 16px;margin-bottom:10px;">
            <div class="card-title" style="margin-bottom:3px;">Rep Outreach</div>
            <div style="font-size:12px;color:var(--text-3);">Select a rep → preview email → copy to Outlook.</div>
          </div>
          ${contactable.map(rep=>{
            const vs=getVendors(rep);
            const tot=vs.reduce((s,v)=>s+(v.sales?.t||0),0);
            const on=selRep&&selRep['Rep Company']===rep['Rep Company'];
            return `<div data-rep="${esc(rep['Rep Company'])}" onclick="document.dispatchEvent(new CustomEvent('roSelectRep',{detail:this.dataset.rep}))"
              style="cursor:pointer;border-radius:8px;padding:11px 13px;margin-bottom:5px;border:1.5px solid ${on?'var(--accent)':'var(--border)'};background:${on?'var(--accent-soft)':'var(--surface)'};transition:all .15s;">
              <div style="font-size:13px;font-weight:700;color:${on?'var(--accent)':'var(--text)'};">${esc(rep['Rep Company'])}</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${esc(rep['Primary Contact']||'—')}</div>
              <div style="display:flex;justify-content:space-between;margin-top:5px;">
                <span style="font-size:11px;background:var(--surface2);padding:2px 7px;border-radius:4px;color:var(--text-2);">${vs.length} vendors</span>
                <span style="font-size:11px;color:var(--text-3);">${fmtS(tot)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
        <!-- RIGHT: Preview + actions -->
        <div style="overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
          ${selRep?`
          <div class="card" style="padding:11px 15px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:700;">${esc(selRep['Rep Company'])}</div>
              <div style="font-size:12px;color:var(--text-3);">To: ${esc(selRep['Primary Contact']||'')} &lt;${esc(selRep['Email'])}&gt;${selRep['Sec Email']?' · CC: '+esc(selRep['Sec Email']):''}</div>
            </div>
            <button class="btn btn-outline" style="font-size:12px;" onclick="navigator.clipboard.writeText(${JSON.stringify(subject)}).then(()=>{const t=$('ro-subj-toast');t.style.display='block';setTimeout(()=>t.style.display='none',3500);})">📋 Copy Subject Line</button>
            <button class="btn btn-accent" style="font-size:13px;font-weight:600;" onclick="navigator.clipboard.writeText(${JSON.stringify(emailHTML)}).then(()=>{const t=$('ro-copy-toast');t.style.display='block';setTimeout(()=>t.style.display='none',6000);})">📋 Copy Email → Outlook</button>
          </div>
          <div id="ro-subj-toast" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 15px;font-size:13px;color:var(--text-2);">
            Subject copied: <strong>${esc(subject)}</strong>
          </div>
          <div id="ro-copy-toast" style="display:none;background:var(--green-bg);border:1px solid var(--green);border-radius:8px;padding:10px 15px;font-size:13px;color:var(--green);font-weight:600;">
            ✅ Email HTML copied — open a new Outlook message, set format to HTML, then paste (Ctrl+V). The blue/yellow columns will render correctly.
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            <div style="background:var(--surface2);border-bottom:1px solid var(--border);padding:9px 15px;font-size:12px;font-weight:600;color:var(--text-2);">
              Email Preview · ${vendors.length} vendor${vendors.length===1?'':'s'} · ${OUTREACH_CATS.length} term categories each
            </div>
            <iframe style="width:100%;height:680px;border:none;" srcdoc="${emailHTML.replace(/\\/g,'\\\\').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}"></iframe>
          </div>
          `:`<div class="card" style="padding:60px;text-align:center;color:var(--text-3);">← Select a rep to preview their email.</div>`}
        </div>
      </div>`;

    document.addEventListener('roSelectRep',function h(e){
      selRep=contactable.find(r=>r['Rep Company']===e.detail)||selRep;
      document.removeEventListener('roSelectRep',h);
      render();
    },{once:true});
  }
  render();
}

