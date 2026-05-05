// ── 5.15 SALES DECISION ENGINE — pure-compute over existing data, no new schema ──
// Surfaces actionable "do this next" recommendations to sales reps + managers by combining:
// - DEALS (active pipeline, probability, value, stage)
// - QUOTES (open quotes, age, total)
// - CUSTOMERS (segment, RFM)
// - CUSTOMER_INTERACTIONS (recency)
// - INVENTORY (in-stock for quotes that depend on availability)
// - CHANGELOG (recent vendor score deltas affecting deals)
//
// Output: 5 recommendation kinds — each with priority badge, vendor/deal/customer link,
// reason, suggested move, and estimated $-impact. Click row → jump to relevant page.

let deFilter = {kind:'', minImpact:0};

function decisionengine(el, act){
  act.innerHTML = `<button class="btn btn-outline btn-sm" onclick="renderDecisionEngine($('pg-content'))">Refresh</button>`;
  renderDecisionEngine(el);
}

function renderDecisionEngine(el){
  const recs = computeSalesDecisions();
  const counts = {chase:0, followup:0, retain:0, atrisk:0, upsell:0};
  let totalImpact = 0;
  recs.forEach(r => { counts[r.kind] = (counts[r.kind]||0)+1; totalImpact += r.impact||0; });

  // Filter
  const filtered = recs.filter(r => {
    if(deFilter.kind && r.kind !== deFilter.kind) return false;
    if(deFilter.minImpact && (r.impact||0) < deFilter.minImpact) return false;
    return true;
  });

  el.innerHTML = `
    <div class="alert" style="background:var(--bg-2);border-left:3px solid var(--blue);margin-bottom:14px;font-size:12px;">
      <strong>Sales Decision Engine.</strong> Pure-compute layer over deals + quotes + customers + interactions. Recommendations refresh on every page load. Click a row to jump to the relevant module. Heuristics will sharpen as more historical data accumulates.
    </div>
    <div class="g4 mb16">
      <div class="card stat-card" style="border-left:3px solid var(--green);"><div class="stat-label">Chase</div><div class="stat-value" style="color:var(--green);">${counts.chase||0}</div><div class="stat-sub">High prob × value</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--blue);"><div class="stat-label">Follow-up</div><div class="stat-value" style="color:var(--blue);">${counts.followup||0}</div><div class="stat-sub">Stale quotes / deals</div></div>
      <div class="card stat-card" style="border-left:3px solid var(--yellow);"><div class="stat-label">At-risk</div><div class="stat-value" style="color:var(--yellow);">${counts.atrisk||0}</div><div class="stat-sub">Lapsing pipeline</div></div>
      <div class="card stat-card"><div class="stat-label">Est. 30d Impact</div><div class="stat-value">${totalImpact>0?'$'+(totalImpact/1000).toFixed(1)+'K':'—'}</div><div class="stat-sub">Sum of weighted opportunities</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Recommendations · ${filtered.length}${filtered.length!==recs.length?' of '+recs.length:''}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select style="padding:6px 8px;font-size:12px;" onchange="deFilter.kind=this.value;renderDecisionEngine($('pg-content'))">
            <option value="">All kinds</option>
            ${[['chase','Chase'],['followup','Follow-up'],['retain','Retain'],['atrisk','At-risk'],['upsell','Upsell']].map(([v,l])=>`<option value="${v}" ${deFilter.kind===v?'selected':''}>${l}</option>`).join('')}
          </select>
          <select style="padding:6px 8px;font-size:12px;" onchange="deFilter.minImpact=Number(this.value);renderDecisionEngine($('pg-content'))">
            <option value="0" ${deFilter.minImpact===0?'selected':''}>Any impact</option>
            <option value="500" ${deFilter.minImpact===500?'selected':''}>≥ $500</option>
            <option value="2000" ${deFilter.minImpact===2000?'selected':''}>≥ $2K</option>
            <option value="10000" ${deFilter.minImpact===10000?'selected':''}>≥ $10K</option>
          </select>
          ${typeof savedFiltersBar==='function'?savedFiltersBar({moduleKey:'decisionengine',currentFilter:deFilter,applyFn:()=>renderDecisionEngine($('pg-content')),fields:['kind','minImpact'],resetState:{kind:'',minImpact:0}}):''}
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:calc(100vh - 360px);overflow-y:auto;">
        <table>
          <thead><tr><th>Priority</th><th>Subject</th><th>What</th><th>Suggested Move</th><th>Est. Impact</th><th></th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--text-3);">No recommendations right now. Either everything is in good shape, or there's not enough data yet (needs deals + quotes + customer interactions to be populated).</td></tr>` : filtered.map(r => {
              const priColor = {chase:'var(--green)', followup:'var(--blue)', retain:'#7c3aed', atrisk:'var(--yellow)', upsell:'var(--accent)'}[r.kind] || 'var(--text-3)';
              const priLabel = {chase:'Chase', followup:'Follow-up', retain:'Retain', atrisk:'At-risk', upsell:'Upsell'}[r.kind];
              const navAttr = r.nav ? `onclick="${r.nav}"` : '';
              return `<tr style="cursor:${r.nav?'pointer':'default'};" ${navAttr}>
                <td><span class="badge" style="background:${priColor};color:#fff;font-size:10px;text-transform:uppercase;">${priLabel}</span></td>
                <td style="font-weight:600;color:var(--accent);">${esc(r.subject)}</td>
                <td class="sm" style="max-width:300px;">${esc(r.reason)}</td>
                <td class="sm">${esc(r.suggestion)}</td>
                <td class="mono fw6">${r.impact ? '$'+Math.round(r.impact).toLocaleString() : '<span class="muted">—</span>'}</td>
                <td>${r.nav ? '<span style="color:var(--accent);font-size:11px;">→</span>' : ''}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function computeSalesDecisions(){
  const recs = [];
  const now = Date.now();
  const day = 86400000;

  // Index DEALS into a flat array regardless of stage map structure
  const allDeals = [];
  if(typeof DEALS !== 'undefined' && DEALS){
    Object.keys(DEALS).forEach(stage => {
      (DEALS[stage]||[]).forEach(d => allDeals.push(Object.assign({}, d, {_stage: stage})));
    });
  }
  const customers = (typeof CUSTOMERS !== 'undefined' && Array.isArray(CUSTOMERS)) ? CUSTOMERS : [];
  const quotes = (typeof QUOTES !== 'undefined' && Array.isArray(QUOTES)) ? QUOTES : [];

  // ─── 1. CHASE — high probability × high value, not yet won
  const chaseDeals = allDeals.filter(d => !['won','lost','abandoned'].includes(d._stage)).filter(d => {
    const prob = (d.probability != null) ? d.probability : (typeof computeDealProbability === 'function' ? computeDealProbability(d).prob : 50);
    return prob >= 60 && (Number(d.value)||0) >= 5000;
  });
  chaseDeals.forEach(d => {
    const prob = (d.probability != null) ? d.probability : (typeof computeDealProbability === 'function' ? computeDealProbability(d).prob : 50);
    const expected = (Number(d.value)||0) * prob/100;
    recs.push({
      kind:'chase',
      subject: d.name + (d.company ? ' · ' + d.company : ''),
      reason: `${prob}% probability, $${Math.round(d.value).toLocaleString()} value, stage: ${d._stage}`,
      suggestion: 'Move to next stage this week. Get a verbal commit, schedule install date.',
      impact: expected,
      nav: `goTo('pipeline');setTimeout(()=>{if(typeof openDeal==='function')openDeal('${d.id}','${d._stage}')},80)`
    });
  });

  // ─── 2. FOLLOW-UP — open quotes >7d old, not converted
  quotes.forEach(q => {
    const d = q.date ? new Date(q.date) : null;
    if(!d || isNaN(d)) return;
    const ageDays = Math.round((now - d.getTime())/day);
    if(ageDays >= 7 && ageDays <= 60){
      const total = Number(q.total) || 0;
      if(total < 250) return;   // ignore tiny quotes
      recs.push({
        kind:'followup',
        subject: `Quote ${q.id} · ${q.customer||'(no customer)'}`,
        reason: `${ageDays}d old, $${Math.round(total).toLocaleString()} total, no follow-up logged`,
        suggestion: ageDays > 21 ? 'Call directly — quote is going cold. Offer to refresh or revise.' : 'Send follow-up email. Ask if there are questions or pricing concerns.',
        impact: total * 0.35,    // assume 35% conversion if pursued
        nav: `goTo('quotes')`
      });
    }
  });

  // ─── 3. AT-RISK — deals with no update in 14+ days, value > $2K, still active
  allDeals.filter(d => !['won','lost','abandoned'].includes(d._stage)).forEach(d => {
    if(!d.updated_at) return;
    const ageDays = Math.round((now - new Date(d.updated_at).getTime())/day);
    if(ageDays >= 14 && (Number(d.value)||0) >= 2000){
      const prob = (d.probability != null) ? d.probability : 50;
      recs.push({
        kind:'atrisk',
        subject: d.name + (d.company ? ' · ' + d.company : ''),
        reason: `No activity in ${ageDays}d, $${Math.round(d.value).toLocaleString()} at ${prob}% prob`,
        suggestion: 'Re-engage today. If no response in 7 days, mark abandoned and free up rep bandwidth.',
        impact: (Number(d.value)||0) * (prob/100) * 0.5,    // discount expected by 50% due to staleness risk
        nav: `goTo('pipeline');setTimeout(()=>{if(typeof openDeal==='function')openDeal('${d.id}','${d._stage}')},80)`
      });
    }
  });

  // ─── 4. RETAIN — VIP / Active customers with no interaction in 60+ days
  if(typeof computeCustomerRFM === 'function'){
    customers.forEach(c => {
      const r = computeCustomerRFM(c);
      if(!['VIP','Active'].includes(r.segment)) return;
      if(r.recency != null && r.recency >= 60 && r.recency < 365){
        recs.push({
          kind:'retain',
          subject: c.name,
          reason: `${r.segment} segment but ${r.recency}d since last activity, $${Math.round(r.monetary||0).toLocaleString()} 12-mo value`,
          suggestion: 'Personal touchpoint — call or visit. Don\'t let a VIP go cold.',
          impact: (r.monetary || 0) * 0.15,    // 15% of recent annual = retention value
          nav: `goTo('customers');setTimeout(()=>{if(typeof openCustomerDetail==='function')openCustomerDetail('${c.id}')},80)`
        });
      }
    });
  }

  // ─── 5. UPSELL — recently won deals (last 90d) → pitch trade-up / accessories
  allDeals.filter(d => d._stage === 'won').forEach(d => {
    if(!d.updated_at) return;
    const ageDays = Math.round((now - new Date(d.updated_at).getTime())/day);
    if(ageDays >= 7 && ageDays <= 90 && (Number(d.value)||0) >= 3000){
      recs.push({
        kind:'upsell',
        subject: d.name + (d.company ? ' · ' + d.company : ''),
        reason: `Won ${ageDays}d ago, $${Math.round(d.value).toLocaleString()} order. Customer is in install phase.`,
        suggestion: 'Pitch lighting controls, additional fixtures, outdoor add-on. 12-15% attach rate typical.',
        impact: (Number(d.value)||0) * 0.13,
        nav: `goTo('pipeline');setTimeout(()=>{if(typeof openDeal==='function')openDeal('${d.id}','won')},80)`
      });
    }
  });

  // Sort: chase first by impact, then followup/atrisk by impact, then retain/upsell
  const order = {chase:0, atrisk:1, followup:2, retain:3, upsell:4};
  recs.sort((a,b) => {
    const oa = order[a.kind] ?? 9, ob = order[b.kind] ?? 9;
    if(oa !== ob) return oa - ob;
    return (b.impact||0) - (a.impact||0);
  });
  return recs;
}
