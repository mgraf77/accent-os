// ── AEOS COMMAND CENTER — Command Center · AI Router · Handoff Generator ──
// v6.11.0 — Phase 1 of AEOS master build (ACCENTOS_AEOS_COMMAND_CENTER_MASTER_HANDOFF.md)

// ═══════════════════════════════════════════════════════════════════
// COMMAND CENTER
// ═══════════════════════════════════════════════════════════════════

function aeoscommand(c, actions) {
  if (!c) return;
  if (actions) {
    actions.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="goTo('airouter')">⚡ AI Router</button>
      <button class="btn btn-accent btn-sm" onclick="goTo('handoffgen')">↗ Handoff Generator</button>`;
  }

  const now = new Date();

  // Active deals (non-terminal stages)
  const allDeals = typeof DEALS !== 'undefined'
    ? Object.values(DEALS).flat().filter(d => !['won','lost','abandoned'].includes(d.stage))
    : [];
  const pipelineValue = allDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // Open quotes
  const openQuotes = (typeof QUOTES !== 'undefined' ? QUOTES : []).filter(q => !q.archived).length;

  // Alerts
  const allAlerts = typeof ALERTS !== 'undefined' ? ALERTS : [];
  const activeAlerts = allAlerts.filter(a => a.status !== 'actioned' && a.status !== 'dismissed').length;
  const urgentAlerts = allAlerts.filter(a =>
    (a.severity === 'critical' || a.severity === 'high') &&
    a.status !== 'actioned' && a.status !== 'dismissed'
  ).length;

  // Inventory below reorder point
  const reorderItems = (typeof INVENTORY !== 'undefined' ? INVENTORY : []).filter(i => {
    const qty = Number(i.qty_available) || 0;
    const rp  = Number(i.reorder_point) || 0;
    return rp > 0 && qty <= rp;
  }).length;

  // Pending deliveries
  const pendingDeliveries = (typeof DELIVERIES !== 'undefined' ? DELIVERIES : [])
    .filter(d => !['delivered','cancelled'].includes(d.status)).length;

  // Co-op funds expiring ≤14 days
  const coopFunds = typeof COOP_FUNDS !== 'undefined' ? COOP_FUNDS : [];
  const coopExpiring = coopFunds.filter(f => {
    if (f.status !== 'open' || !f.deadline) return false;
    const days = Math.round((new Date(f.deadline) - now) / 86400000);
    return days >= 0 && days <= 14;
  }).length;
  const coopTotal = coopFunds.filter(f => f.status === 'open')
    .reduce((s, f) => s + (Number(f.amount) || 0), 0);

  // Deals closing ≤7 days
  const closingSoon = allDeals.filter(d => {
    if (!d.expected_close) return false;
    const days = Math.round((new Date(d.expected_close) - now) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  // Stale high-value deals (14d+ no update, ≥$1K)
  const staleDeals = (typeof DEALS !== 'undefined' ? Object.values(DEALS).flat() : []).filter(d => {
    if (['won','lost','abandoned'].includes(d.stage) || !d.updated_at) return false;
    return Math.round((now - new Date(d.updated_at)) / 86400000) >= 14 && (Number(d.value) || 0) >= 1000;
  });

  // Top alerts for the attention panel
  const sevRank = { critical: 4, high: 3, medium: 2, low: 1 };
  const topAlerts = allAlerts
    .filter(a => a.status !== 'actioned' && a.status !== 'dismissed')
    .sort((a, b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0))
    .slice(0, 6);

  const sevColor = s => ({ critical: 'red', high: 'amber', medium: 'yellow', low: 'gray' })[s] || 'gray';
  const sevLabel = s => ({ critical: '!!! CRITICAL', high: '!! HIGH', medium: '! MED', low: 'LOW' })[s] || (s || 'ALERT');

  const kpis = [
    { label: 'Pipeline Value', val: '$' + (pipelineValue >= 1000 ? Math.round(pipelineValue / 1000) + 'K' : Math.round(pipelineValue)), sub: allDeals.length + ' active deals', nav: 'pipeline', color: 'var(--blue)' },
    { label: 'Open Quotes',    val: openQuotes,        sub: 'pending follow-up',          nav: 'quotes',        color: 'var(--purple)' },
    { label: 'Active Alerts',  val: activeAlerts,      sub: urgentAlerts + ' urgent',      nav: 'alerts',        color: urgentAlerts > 0 ? 'var(--accent)' : 'var(--green)' },
    { label: 'Reorder Items',  val: reorderItems,      sub: 'below reorder point',         nav: 'demandforecast', color: reorderItems > 0 ? 'var(--yellow)' : 'var(--green)' },
    { label: 'Deliveries',     val: pendingDeliveries, sub: 'in transit / scheduled',      nav: 'deliveries',    color: 'var(--text-2)' },
    { label: 'Co-op Expiring', val: coopExpiring,      sub: '≤14d · $' + Math.round(coopTotal / 1000) + 'K open', nav: 'vendors', color: coopExpiring > 0 ? 'var(--accent)' : 'var(--green)' },
  ];

  const buildTracks = [
    { label: 'Track 0 — Infrastructure',   pct: 100, items: '4/4 complete' },
    { label: 'Track 1 — Business Impact',  pct: 100, items: '5/5 complete' },
    { label: 'Track 2 — Vendor Intel',     pct: 100, items: '3/3 complete' },
    { label: 'Track 3 — Employee Intel',   pct: 100, items: '2/2 complete' },
    { label: 'Track 4 — Owner Intel',      pct: 100, items: '3/3 complete' },
    { label: 'Track 5 — Phase 3 Modules', pct: 94,  items: '15/16 (5.13 blocked)' },
    { label: 'Track 6 — AI + Integrations',pct: 38,  items: '5/13 (6.1–6.4 blocked)' },
    { label: 'AEOS Command Center',        pct: 100, items: 'v6.11.0' },
    { label: 'AI Orchestration Layer',     pct: 100, items: 'Router + Handoffs v6.11.0' },
  ];

  const quickActions = [
    { label: 'New Quote',           icon: '◻', nav: 'quotes',        desc: 'Start a quote' },
    { label: 'AI Router',           icon: '⚡', nav: 'airouter',      desc: 'Route a task to AI' },
    { label: 'Handoff Generator',   icon: '↗', nav: 'handoffgen',    desc: 'Build a handoff packet' },
    { label: 'Decision Engine',     icon: '★', nav: 'decisionengine', desc: 'Sales recommendations' },
    { label: 'Demand Forecast',     icon: '∿', nav: 'demandforecast', desc: 'Check reorder needs' },
    { label: 'Vendor Ranking',      icon: '◇', nav: 'vendors',       desc: 'Score vendors' },
    { label: 'Knowledge Engine',    icon: '⊹', nav: 'knowledge',     desc: 'Ask the AI' },
    { label: 'Mgmt Dashboard',      icon: '◎', nav: 'mgmt',          desc: 'Owner view' },
  ];

  c.innerHTML = `
    <div style="max-width:1400px;">

      <!-- KPI Strip: 6 cards -->
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">
        ${kpis.map(s => `
          <div class="card stat-card" onclick="goTo('${s.nav}')" style="cursor:pointer;border-top:3px solid ${s.color};">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value" style="font-size:26px;color:${s.color};">${s.val}</div>
            <div class="stat-sub">${s.sub}</div>
          </div>`).join('')}
      </div>

      <!-- Attention + Opportunities row -->
      <div class="g2" style="margin-bottom:20px;">

        <div class="card">
          <div class="card-hd">
            <span class="card-title">What Needs Attention</span>
            <button class="btn btn-ghost btn-sm" onclick="goTo('alerts')">View all →</button>
          </div>
          <div class="card-body" style="padding-top:8px;">
            ${topAlerts.length === 0
              ? '<div class="muted sm" style="text-align:center;padding:20px;">No active alerts — system is clear.</div>'
              : topAlerts.map(a => `
                <div style="display:flex;align-items:flex-start;gap:9px;padding:8px 0;border-bottom:1px solid var(--border-light);">
                  <span class="badge bg-${sevColor(a.severity)}" style="flex-shrink:0;font-size:10px;margin-top:1px;">${sevLabel(a.severity)}</span>
                  <div style="min-width:0;">
                    <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.title || a.type || '')}</div>
                    <div class="muted sm">${esc(a.message || '')}</div>
                  </div>
                </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-hd"><span class="card-title">Opportunities</span></div>
          <div class="card-body" style="padding-top:8px;">
            ${closingSoon > 0 ? `
              <div class="chk" style="padding:7px 0;">
                <span class="chk-ico">◈</span>
                <div>
                  <div class="fw6 sm">${closingSoon} deal${closingSoon > 1 ? 's' : ''} closing ≤7 days</div>
                  <a href="#" onclick="goTo('pipeline');return false;" class="sm" style="color:var(--blue);">Review pipeline →</a>
                </div>
              </div>` : ''}
            ${coopExpiring > 0 ? `
              <div class="chk" style="padding:7px 0;">
                <span class="chk-ico">$</span>
                <div>
                  <div class="fw6 sm">$${Math.round(coopTotal / 1000)}K co-op at risk — ${coopExpiring} fund${coopExpiring > 1 ? 's' : ''} expiring ≤14d</div>
                  <a href="#" onclick="goTo('vendors');return false;" class="sm" style="color:var(--blue);">Claim funds →</a>
                </div>
              </div>` : ''}
            ${staleDeals.length > 0 ? `
              <div class="chk" style="padding:7px 0;">
                <span class="chk-ico">★</span>
                <div>
                  <div class="fw6 sm">${staleDeals.length} high-value deal${staleDeals.length > 1 ? 's' : ''} stale 14+ days</div>
                  <div class="muted sm">${staleDeals.slice(0,2).map(d => esc(d.title || d.company || '')).join(', ')}</div>
                </div>
              </div>` : ''}
            ${reorderItems > 0 ? `
              <div class="chk" style="padding:7px 0;">
                <span class="chk-ico">∿</span>
                <div>
                  <div class="fw6 sm">${reorderItems} SKU${reorderItems > 1 ? 's' : ''} need reordering</div>
                  <a href="#" onclick="goTo('demandforecast');return false;" class="sm" style="color:var(--blue);">View forecast →</a>
                </div>
              </div>` : ''}
            ${closingSoon === 0 && coopExpiring === 0 && staleDeals.length === 0 && reorderItems === 0
              ? '<div class="muted sm" style="text-align:center;padding:20px;">No critical opportunities flagged right now.</div>'
              : ''}
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card mb16">
        <div class="card-hd"><span class="card-title">Quick Actions</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
            ${quickActions.map(a => `
              <div onclick="goTo('${a.nav}')"
                style="padding:14px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;background:var(--surface);transition:all .15s;"
                onmouseover="this.style.borderColor='var(--accent)';this.style.background='var(--accent-soft)'"
                onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
                <div style="font-size:18px;margin-bottom:4px;">${a.icon}</div>
                <div style="font-size:13px;font-weight:700;">${a.label}</div>
                <div class="muted sm">${a.desc}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Build Status -->
      <div class="card">
        <div class="card-hd">
          <span class="card-title">AEOS Build Status</span>
          <button class="btn btn-ghost btn-sm" onclick="goTo('roadmap')">Full roadmap →</button>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${buildTracks.map(t => `
              <div style="padding:8px 0;border-bottom:1px solid var(--border-light);">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="font-size:12px;font-weight:600;">${t.label}</span>
                  <span class="mono" style="font-size:11px;color:var(--text-3);">${t.pct}%</span>
                </div>
                <div class="pbar"><div class="pfill" style="width:${t.pct}%;background:${t.pct === 100 ? 'var(--green)' : t.pct > 60 ? 'var(--blue)' : 'var(--yellow)'};"></div></div>
                <div class="muted sm" style="margin-top:3px;">${t.items}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════════
// AI ROUTER
// ═══════════════════════════════════════════════════════════════════

let _routerState = { taskType: '', complexity: 'medium', opRisk: 'low', repoRisk: 'none', description: '' };

function airouter(c, actions) {
  if (!c) return;
  if (actions) {
    actions.innerHTML = `<button class="btn btn-accent btn-sm" onclick="goTo('handoffgen')">↗ Handoff Generator</button>`;
  }

  const taskTypes = [
    'Architecture / Systems Design',
    'Implementation / Code',
    'Bug Fix',
    'Code Review / PR Review',
    'Business Analysis',
    'Content / Copywriting',
    'Data Analysis',
    'Automation / Workflow',
    'Database / Schema',
    'UI / Frontend',
    'Testing',
    'Documentation',
    'Strategy / Planning',
    'Google Ecosystem (GA4, GMC, GCP)',
  ];

  const routingRef = [
    ['Architecture / Systems Design', 'Claude',   'bg-purple', 'Deep reasoning, safety, long context',          'Complex decisions, multi-system design'],
    ['Implementation / Code',          'Codex',    'bg-blue',   'Code generation, repetitive tasks',             'Standard CRUD, boilerplate, migrations'],
    ['Bug Fix',                        'Codex → Claude', 'bg-blue', 'Fast iteration + escalation path',          'Low-risk → Codex; production bugs → Claude'],
    ['Business Analysis',              'ChatGPT',  'bg-yellow', 'Strategy, synthesis, narrative',                'Market insights, competitive analysis, SOPs'],
    ['Content / Copywriting',          'ChatGPT',  'bg-yellow', 'Tone, persuasion, marketing',                   'Emails, product descriptions, SEO copy'],
    ['Data Analysis',                  'Claude',   'bg-purple', 'Data reasoning, structured output',             'Schema analysis, KPI interpretation'],
    ['Automation / Workflow',          'Codex',    'bg-blue',   'n8n/Make blueprints, scripts',                  'Repeatable automations, webhook handlers'],
    ['Database / Schema',              'Claude',   'bg-purple', 'SQL safety, migration review',                  'Schema design, RLS policies, migrations'],
    ['Google Ecosystem',               'Gemini',   'bg-green',  'Google APIs, GCP native',                       'GA4, GMC, Search Console integrations'],
    ['High Risk (any type)',            'Claude + Human Review', 'bg-red', 'Caution, reversibility', 'Production ops, DB destructive ops, live data'],
  ];

  const agentCards = [
    { name: 'Claude',   badge: 'bg-purple', icon: '⊹',  color: 'var(--purple)', roles: ['Architecture','Systems Design','Security','SQL/Schema','Code Review','Complex Reasoning'], strengths: 'Deep reasoning · Long context · Safety-first · Governance', when: 'High-risk, complex, multi-system, reversibility matters' },
    { name: 'Codex',    badge: 'bg-blue',   icon: '{ }', color: 'var(--blue)',   roles: ['Implementation','Migrations','Tests','Boilerplate','Bug Fixes'], strengths: 'Fast code generation · Pattern matching · CRUD', when: 'Well-defined scope, low risk, repetitive engineering' },
    { name: 'ChatGPT',  badge: 'bg-yellow', icon: '✦',  color: 'var(--yellow)', roles: ['Strategy','Content','Analysis','SOPs','Synthesis'], strengths: 'Business reasoning · Narrative · Versatile', when: 'Non-code tasks, business planning, content creation' },
    { name: 'Gemini',   badge: 'bg-green',  icon: '◈',  color: 'var(--green)',  roles: ['Google APIs','GCP','Search Console','GMC','GA4'], strengths: 'Google ecosystem native · Multimodal · Vision', when: 'Google-adjacent tasks, image analysis, GCP' },
  ];

  c.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 360px;gap:16px;max-width:1200px;">

      <!-- Left: Form + Results + Reference table -->
      <div>
        <div class="card mb16">
          <div class="card-hd"><span class="card-title">Describe the Task</span></div>
          <div class="card-body">
            <div class="field">
              <label>Task Description</label>
              <textarea id="rt-desc" rows="3"
                placeholder="Describe what needs to be built, fixed, or analyzed..."
                style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;color:var(--text);background:var(--surface);outline:none;resize:vertical;min-height:70px;transition:border-color .2s;"
                onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"
                oninput="_routerState.description=this.value">${esc(_routerState.description)}</textarea>
            </div>
            <div class="frow">
              <div class="fcol field">
                <label>Task Type</label>
                <select onchange="_routerState.taskType=this.value"
                  style="padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;">
                  <option value="">— select —</option>
                  ${taskTypes.map(t => `<option value="${t}" ${_routerState.taskType === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="fcol field">
                <label>Complexity</label>
                <select onchange="_routerState.complexity=this.value"
                  style="padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;">
                  ${['low','medium','high','critical'].map(v => `<option value="${v}" ${_routerState.complexity === v ? 'selected' : ''}>${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="frow">
              <div class="fcol field">
                <label>Operational Risk</label>
                <select onchange="_routerState.opRisk=this.value"
                  style="padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;">
                  ${['none','low','medium','high','critical'].map(v => `<option value="${v}" ${_routerState.opRisk === v ? 'selected' : ''}>${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="fcol field">
                <label>Repo / Code Risk</label>
                <select onchange="_routerState.repoRisk=this.value"
                  style="padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;width:100%;outline:none;">
                  ${['none','low','medium','high'].map(v => `<option value="${v}" ${_routerState.repoRisk === v ? 'selected' : ''}>${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}
                </select>
              </div>
            </div>
            <button class="btn btn-accent" onclick="_computeRoute()">⚡ Route Task</button>
          </div>
        </div>

        <div id="rt-result"></div>

        <!-- Routing Reference Table -->
        <div class="card">
          <div class="card-hd"><span class="card-title">Routing Reference</span></div>
          <div class="card-body" style="padding:0;">
            <div class="tbl-wrap">
              <table>
                <thead><tr><th>Task Type</th><th>Recommended AI</th><th>Strengths</th><th>Use When</th></tr></thead>
                <tbody>
                  ${routingRef.map(([t, ai, badge, s, u]) => `
                    <tr>
                      <td style="font-size:12.5px;">${t}</td>
                      <td><span class="badge ${badge}" style="font-size:11px;">${ai}</span></td>
                      <td class="sm muted">${s}</td>
                      <td class="sm muted">${u}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: AI Agent Cards -->
      <div>
        ${agentCards.map(a => `
          <div class="card mb16">
            <div class="card-hd">
              <span class="badge ${a.badge}" style="font-size:12.5px;padding:4px 10px;">${a.icon} ${a.name}</span>
            </div>
            <div class="card-body" style="padding-top:10px;">
              <div style="margin-bottom:9px;display:flex;flex-wrap:wrap;gap:4px;">
                ${a.roles.map(r => `<span class="pill" style="font-size:11px;padding:2px 8px;">${r}</span>`).join('')}
              </div>
              <div class="muted sm"><strong>Strengths:</strong> ${a.strengths}</div>
              <div class="muted sm" style="margin-top:4px;"><strong>Best for:</strong> ${a.when}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  `;
}

function _computeRoute() {
  const el = $('rt-result');
  if (!el) return;
  const { taskType, complexity, opRisk, repoRisk, description } = _routerState;

  const highRisk    = opRisk === 'high' || opRisk === 'critical' || repoRisk === 'high';
  const isGoogle    = taskType.includes('Google') || (description && /google|ga4|gmc|gcp|search console/i.test(description));
  const isContent   = taskType.includes('Content') || taskType.includes('Strategy') || taskType.includes('Business Analysis');
  const isCode      = taskType.includes('Implementation') || taskType.includes('Bug') || taskType.includes('Automation') || taskType.includes('Testing');
  const isArch      = taskType.includes('Architecture') || taskType.includes('Database') || taskType.includes('Systems');
  const isHighComp  = complexity === 'high' || complexity === 'critical';

  let ai, rationale, approval = false, scope, fallback;

  if (highRisk) {
    ai = 'Claude'; fallback = 'Human Review'; approval = true; scope = isHighComp ? 'Large' : 'Medium';
    rationale = 'High operational or repo risk detected. Claude\'s safety-first reasoning and reversibility focus are required. Human sign-off is mandatory before execution begins.';
  } else if (isGoogle) {
    ai = 'Gemini'; fallback = 'Claude'; scope = 'Medium';
    rationale = 'Google ecosystem task identified. Gemini is natively optimized for GA4, GMC, Search Console, and GCP — significantly outperforms other models on Google-specific APIs.';
  } else if (isContent) {
    ai = 'ChatGPT'; fallback = 'Claude'; scope = complexity === 'low' ? 'Small' : 'Medium';
    rationale = 'Business strategy, analysis, or content task. ChatGPT excels at narrative synthesis, SOP generation, and non-code business deliverables.';
  } else if (isCode && !isArch && !isHighComp) {
    ai = 'Codex'; fallback = 'Claude'; scope = complexity === 'low' ? 'Small' : 'Medium';
    rationale = 'Well-scoped code implementation with manageable risk. Codex is optimized for fast, pattern-driven code generation and executes routine engineering tasks efficiently.';
  } else if (isArch || isHighComp) {
    ai = 'Claude'; fallback = 'Human Review'; approval = complexity === 'critical'; scope = isHighComp ? 'Medium-Large' : 'Medium';
    rationale = 'Architecture or high-complexity task. Claude\'s deep reasoning and long-context window are required for multi-system decisions that have broad downstream impact.';
  } else {
    ai = 'Claude'; fallback = 'ChatGPT'; scope = 'Medium';
    rationale = taskType
      ? 'General task — Claude is the safe default choice with broad capability coverage and the best safety profile for uncertain-scope work.'
      : 'Select a task type above for a precise recommendation. Defaulting to Claude as the safe general-purpose choice.';
  }

  // Store for _sendToHandoffGen() — avoids embedding user text in onclick attributes
  window._lastRouteResult = { taskType, description, ai };

  const aiBadge = { Claude: 'bg-purple', Codex: 'bg-blue', ChatGPT: 'bg-yellow', Gemini: 'bg-green', 'Human Review': 'bg-red' };
  const aiBorderColor = { Claude: 'var(--purple)', Codex: 'var(--blue)', ChatGPT: 'var(--yellow)', Gemini: 'var(--green)' };

  el.innerHTML = `
    <div class="card mb16" style="border-left:3px solid ${aiBorderColor[ai] || 'var(--text-3)'};">
      <div class="card-hd"><span class="card-title">Routing Result</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
          <div><div class="sec-label">Recommended AI</div><span class="badge ${aiBadge[ai] || 'bg-gray'}" style="font-size:13px;padding:4px 12px;">${ai}</span></div>
          <div><div class="sec-label">Fallback</div><span class="badge ${aiBadge[fallback] || 'bg-gray'}">${fallback}</span></div>
          <div><div class="sec-label">Est. Scope</div><span class="fw6">${scope}</span></div>
          <div><div class="sec-label">Human Approval</div><span class="badge ${approval ? 'bg-red' : 'bg-green'}">${approval ? 'REQUIRED' : 'Not required'}</span></div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:12px;font-size:13px;line-height:1.6;margin-bottom:14px;">
          <strong>Rationale:</strong> ${esc(rationale)}
        </div>
        ${approval ? `
          <div style="background:var(--red-bg);border-left:3px solid var(--accent);padding:10px 14px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;">
            ⚠ <strong>High-risk task.</strong> Requires human review and approval before any AI executes. Document the rollback plan in your handoff packet.
          </div>` : ''}
        <button class="btn btn-accent" onclick="_sendToHandoffGen()">↗ Generate Handoff Packet</button>
      </div>
    </div>
  `;
}

function _sendToHandoffGen() {
  const r = window._lastRouteResult || {};
  window._hgPreset = { taskType: r.taskType || '', description: r.description || '', recommendedAI: r.ai || '' };
  goTo('handoffgen');
}


// ═══════════════════════════════════════════════════════════════════
// HANDOFF GENERATOR
// ═══════════════════════════════════════════════════════════════════

let _hgState = {
  template:     'claude-code',
  objective:    '',
  bizContext:   '',
  techContext:  '',
  repo:         'mgraf77/accent-os',
  files:        '',
  constraints:  '',
  acceptance:   '',
  qualityGates: '',
  rollback:     '',
  output:       '',
};

const _hgTemplates = {
  'claude-code': {
    label:        'Claude Code Prompt',
    desc:         'Full context prompt for Claude Code CLI',
    acceptance:   'Compiles clean · No console errors · Matches design system · Manual smoke test passes',
    qualityGates: 'No unresolved globals · All onclick handlers use ${...} template literals · Module isolation verified · No breaking changes to existing modules',
    rollback:     'git revert <commit> — safe if no DB migration required. If migration shipped, run compensating SQL.',
    output:       'Committed + pushed code · WORK_IN_PROGRESS.md updated · SESSION_LOG entry appended',
  },
  'codex': {
    label:        'Codex Implementation Packet',
    desc:         'Scoped implementation task for Codex / GPT-4o',
    acceptance:   'All specified functions implemented · Tests pass · No lint errors',
    qualityGates: 'TypeScript strict · No any types · No console.log in production · No hardcoded secrets',
    rollback:     'Feature flag disable or git revert the feature branch',
    output:       'Pull request with passing CI · PR description includes scope and test plan',
  },
  'pr-review': {
    label:        'PR Review Prompt',
    desc:         'Structured code review request',
    acceptance:   'No security vulnerabilities · Performance acceptable · Meets coding standards',
    qualityGates: 'OWASP top-10 checked · No hardcoded secrets · No N+1 queries · Error handling complete',
    rollback:     'Reject PR and request rework',
    output:       'Approved PR or detailed review comments with required changes listed',
  },
  'analysis': {
    label:        'Operational Analysis',
    desc:         'Business or data analysis task',
    acceptance:   'Analysis addresses stated business question · Sources cited · Actionable recommendations provided',
    qualityGates: 'Data completeness noted · Assumptions documented · Limitations stated · Confidence level given',
    rollback:     'N/A — analysis-only task, no system changes',
    output:       'Summary report with recommendations + supporting data + next steps',
  },
};

function handoffgen(c, actions) {
  if (!c) return;
  if (actions) {
    actions.innerHTML = `<button class="btn btn-outline btn-sm" onclick="_hgClearHistory()">Clear History</button>`;
  }

  // Apply preset from AI Router if present
  if (window._hgPreset) {
    const p = window._hgPreset;
    if (p.description)    _hgState.objective   = p.description;
    if (p.recommendedAI)  _hgState.techContext = 'Recommended AI: ' + p.recommendedAI + (p.taskType ? ' · Task type: ' + p.taskType : '') + '\nStack: Vanilla JS / HTML / Supabase / Cloudflare Pages. No build step.';
    delete window._hgPreset;
  }

  // Auto-fill quality-gate defaults from template when fields are empty
  const tpl = _hgTemplates[_hgState.template] || _hgTemplates['claude-code'];
  if (!_hgState.acceptance)   _hgState.acceptance   = tpl.acceptance;
  if (!_hgState.qualityGates) _hgState.qualityGates = tpl.qualityGates;
  if (!_hgState.rollback)     _hgState.rollback      = tpl.rollback;
  if (!_hgState.output)       _hgState.output        = tpl.output;

  const history = JSON.parse(localStorage.getItem('aeos_handoffs') || '[]');

  const ta = (id, val, placeholder, rows) =>
    `<textarea id="${id}" rows="${rows || 2}"
      placeholder="${placeholder}"
      style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;color:var(--text);background:var(--surface);outline:none;resize:vertical;transition:border-color .2s;"
      onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"
      oninput="_hgState.${id.replace('hg-','').replace(/-([a-z])/g, (_,c) => c.toUpperCase())}=this.value">${esc(val)}</textarea>`;

  c.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;max-width:1300px;">

      <!-- Form column -->
      <div>
        <!-- Template Picker -->
        <div class="card mb16">
          <div class="card-body" style="padding:12px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${Object.entries(_hgTemplates).map(([key, t]) => `
                <div onclick="_hgSetTemplate('${key}')"
                  style="padding:10px 14px;border:1.5px solid ${_hgState.template === key ? 'var(--accent)' : 'var(--border)'};background:${_hgState.template === key ? 'var(--accent-soft)' : 'var(--surface)'};border-radius:var(--radius-sm);cursor:pointer;flex:1;min-width:130px;transition:all .15s;">
                  <div style="font-size:13px;font-weight:700;color:${_hgState.template === key ? 'var(--accent)' : 'var(--text)'};">${t.label}</div>
                  <div class="muted sm">${t.desc}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="card mb16">
          <div class="card-hd"><span class="card-title">Handoff Details</span></div>
          <div class="card-body">

            <div class="field">
              <label>Objective *</label>
              ${ta('hg-objective', _hgState.objective, 'What exactly needs to be built or done?')}
            </div>

            <div class="frow">
              <div class="fcol field">
                <label>Business Context</label>
                ${ta('hg-bizContext', _hgState.bizContext, 'Why does this matter? What job does it do for the business?')}
              </div>
              <div class="fcol field">
                <label>Technical Context</label>
                ${ta('hg-techContext', _hgState.techContext, 'Stack, relevant patterns, architecture notes, prior decisions...')}
              </div>
            </div>

            <div class="frow">
              <div class="fcol field">
                <label>Repo</label>
                <input type="text" value="${esc(_hgState.repo)}" oninput="_hgState.repo=this.value"
                  placeholder="mgraf77/accent-os"
                  style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s;"
                  onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
              </div>
              <div class="fcol field">
                <label>Files / Modules Affected</label>
                <input type="text" value="${esc(_hgState.files)}" oninput="_hgState.files=this.value"
                  placeholder="index.html, js/quotes.js, sql/M41_..."
                  style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s;"
                  onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
              </div>
            </div>

            <div class="field">
              <label>Constraints</label>
              ${ta('hg-constraints', _hgState.constraints, 'No new dependencies · Must work offline · Vanilla JS only · Role-gated to Owner+Admin...')}
            </div>

            <div class="frow">
              <div class="fcol field">
                <label>Acceptance Criteria</label>
                ${ta('hg-acceptance', _hgState.acceptance, 'When is this done?', 3)}
              </div>
              <div class="fcol field">
                <label>Quality Gates</label>
                ${ta('hg-qualityGates', _hgState.qualityGates, 'What must be verified before shipping?', 3)}
              </div>
            </div>

            <div class="frow">
              <div class="fcol field">
                <label>Rollback Plan</label>
                <input type="text" value="${esc(_hgState.rollback)}" oninput="_hgState.rollback=this.value"
                  placeholder="How do we undo this if it goes wrong?"
                  style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s;"
                  onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
              </div>
              <div class="fcol field">
                <label>Required Output</label>
                <input type="text" value="${esc(_hgState.output)}" oninput="_hgState.output=this.value"
                  placeholder="Code committed + pushed · PR created · Analysis report..."
                  style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s;"
                  onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
              </div>
            </div>

            <div style="display:flex;gap:8px;margin-top:6px;">
              <button class="btn btn-accent" onclick="_hgGenerate()">↗ Generate Handoff</button>
              <button class="btn btn-outline" onclick="_hgClear()">Clear</button>
            </div>
          </div>
        </div>

        <div id="hg-output"></div>
      </div>

      <!-- History sidebar -->
      <div>
        <div class="card">
          <div class="card-hd">
            <span class="card-title">Handoff History</span>
            <span class="muted sm">${history.length} saved</span>
          </div>
          <div style="max-height:580px;overflow-y:auto;">
            ${history.length === 0
              ? '<div class="muted sm" style="padding:16px;">No handoffs yet. Generate one above.</div>'
              : history.slice(0, 20).map((h, i) => `
                <div style="padding:10px 14px;border-bottom:1px solid var(--border-light);cursor:pointer;transition:background .1s;"
                  onclick="_hgLoadHistory(${i})"
                  onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
                  <div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(h.objective || 'Untitled')}</div>
                  <div class="muted sm">${esc((_hgTemplates[h.template] || {}).label || h.template || 'claude-code')} · ${h.date || ''}</div>
                </div>`).join('')}
          </div>
        </div>
      </div>

    </div>
  `;
}

function _hgSetTemplate(key) {
  const tpl = _hgTemplates[key] || _hgTemplates['claude-code'];
  _hgState.template     = key;
  _hgState.acceptance   = tpl.acceptance;
  _hgState.qualityGates = tpl.qualityGates;
  _hgState.rollback     = tpl.rollback;
  _hgState.output       = tpl.output;
  handoffgen($('pg-content'), $('pg-actions'));
}

function _hgClear() {
  _hgState = { ..._hgState, objective: '', bizContext: '', techContext: '', files: '', constraints: '', acceptance: '', qualityGates: '', rollback: '', output: '' };
  handoffgen($('pg-content'), $('pg-actions'));
}

function _hgGenerate() {
  const el = $('hg-output');
  if (!el) return;
  const s = _hgState;
  if (!s.objective.trim()) { toast('Objective is required', 'err'); return; }

  const tplLabel = (_hgTemplates[s.template] || _hgTemplates['claude-code']).label;
  const ts = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const packet = `# ${tplLabel}
**Generated:** ${ts}
**Repo:** ${s.repo || 'mgraf77/accent-os'}

---

## Objective
${s.objective}

## Business Context
${s.bizContext || 'See AccentOS MASTER.md for full business context. Accent Lighting Inc. — Wichita, KS. Employees depend on this system daily.'}

## Technical Context
${s.techContext || 'Stack: Vanilla JS / HTML / Supabase (Postgres) / Cloudflare Pages. No build step. Surgical str_replace patches only. See MASTER.md §4 for full architecture and code patterns.'}

## Files / Modules
${s.files || 'index.html + relevant js/ module files'}

## Constraints
${s.constraints || '· No new external dependencies\n· Preserve all existing data-roles visibility gating\n· No breaking changes to existing module APIs\n· Follow compact-CRUD pattern from BUILD_INTELLIGENCE.md\n· Commit message must reference version bump'}

## Acceptance Criteria
${s.acceptance}

## Quality Gates
${s.qualityGates}

## Rollback Plan
${s.rollback}

## Required Output
${s.output}

---
*Generated by AccentOS AEOS Handoff Generator v6.11.0*`;

  // Persist to localStorage history
  const history = JSON.parse(localStorage.getItem('aeos_handoffs') || '[]');
  history.unshift({ objective: s.objective, template: s.template, date: new Date().toLocaleDateString(), packet });
  if (history.length > 25) history.pop();
  localStorage.setItem('aeos_handoffs', JSON.stringify(history));

  // Store latest for copy button (avoids embedding packet text in onclick attribute)
  window._hgLastPacket = packet;

  el.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Generated Handoff</span>
        <button class="btn btn-outline btn-sm" onclick="_hgCopyPacket()">Copy</button>
      </div>
      <div class="card-body" style="padding:0;">
        <pre style="background:#1a1a1a;color:#d4d4d4;padding:18px 20px;font-family:'DM Mono',monospace;font-size:12px;line-height:1.75;border-radius:0 0 var(--radius) var(--radius);overflow-x:auto;white-space:pre-wrap;margin:0;">${esc(packet)}</pre>
      </div>
    </div>
  `;
  toast('Handoff generated', 'ok');
}

function _hgCopyPacket() {
  navigator.clipboard.writeText(window._hgLastPacket || '').then(() => toast('Copied to clipboard', 'ok'));
}

function _hgLoadHistory(i) {
  const history = JSON.parse(localStorage.getItem('aeos_handoffs') || '[]');
  const h = history[i];
  if (!h) return;
  window._hgLastPacket = h.packet || '';
  const el = $('hg-output');
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">${esc(h.objective || 'Handoff')}</span>
        <button class="btn btn-outline btn-sm" onclick="_hgCopyPacket()">Copy</button>
      </div>
      <div class="card-body" style="padding:0;">
        <pre style="background:#1a1a1a;color:#d4d4d4;padding:18px 20px;font-family:'DM Mono',monospace;font-size:12px;line-height:1.75;border-radius:0 0 var(--radius) var(--radius);overflow-x:auto;white-space:pre-wrap;margin:0;">${esc(h.packet || '')}</pre>
      </div>
    </div>`;
}

function _hgClearHistory() {
  if (!confirm('Clear all saved handoff history?')) return;
  localStorage.removeItem('aeos_handoffs');
  handoffgen($('pg-content'), $('pg-actions'));
  toast('History cleared', 'ok');
}
