// ── PIPELINE ANALYTICS ──
// Modal-displayed analytics over DEALS. Pure-compute, no schema. Shows
// funnel by count + value, stage-to-stage conversion rates, time-in-stage
// (when pipeline_events are loaded), and win/loss reason breakdown.

let _paWindow = '90d';

async function openPipelineAnalytics(){
  // Lazy-load pipeline_events for time-in-stage if not already loaded.
  if(typeof AF_PIPELINE === 'undefined' || AF_PIPELINE.length === 0){
    if(typeof sbLoadPipelineEvents === 'function') await sbLoadPipelineEvents(2000);
  }

  const cutoff = _paWindow === 'all' ? 0
              : _paWindow === '7d'  ? Date.now() - 7*86400000
              : _paWindow === '30d' ? Date.now() - 30*86400000
              : _paWindow === '90d' ? Date.now() - 90*86400000
              : _paWindow === 'ytd' ? new Date(new Date().getFullYear(),0,1).getTime()
              : 0;

  const inWindow = d => {
    const t = d.updated_at ? new Date(d.updated_at).getTime() : 0;
    return t >= cutoff;
  };

  // Funnel — every stage including terminal
  const stages = [
    {key:'lead', label:'Lead'},
    {key:'qualified', label:'Qualified'},
    {key:'quoted', label:'Quoted'},
    {key:'negotiating', label:'Negotiating'},
    {key:'won', label:'Won'}
  ];
  const funnel = stages.map(s => {
    const deals = (DEALS[s.key]||[]).filter(inWindow);
    const value = deals.reduce((sum,d)=>sum+(Number(d.value)||0), 0);
    return {stage: s.key, label: s.label, count: deals.length, value};
  });
  const lostCount = (DEALS.lost||[]).filter(inWindow).length;
  const lostValue = (DEALS.lost||[]).filter(inWindow).reduce((s,d)=>s+(Number(d.value)||0), 0);
  const abandonedCount = (DEALS.abandoned||[]).filter(inWindow).length;

  // Conversion rates from one stage to the next (using pipeline_events from→to counts)
  const stageOrder = ['lead','qualified','quoted','negotiating','won'];
  const moves = {};   // "from→to" → count
  if(typeof AF_PIPELINE !== 'undefined'){
    AF_PIPELINE.forEach(p => {
      if(p.from_stage && p.to_stage){
        const t = p.ts ? new Date(p.ts).getTime() : 0;
        if(t < cutoff) return;
        const k = `${p.from_stage}→${p.to_stage}`;
        moves[k] = (moves[k]||0) + 1;
      }
    });
  }
  const conversions = [];
  for(let i = 0; i < stageOrder.length - 1; i++){
    const from = stageOrder[i], to = stageOrder[i+1];
    const fwd = moves[`${from}→${to}`] || 0;
    // Total exits from `from` to any later stage including won
    let total = 0;
    Object.keys(moves).forEach(k => {
      if(k.startsWith(from + '→')) total += moves[k];
    });
    const rate = total ? Math.round(100*fwd/total) : null;
    conversions.push({from, to, advance: fwd, total, rate});
  }
  // Overall lead→won
  const leadToWon = moves['lead→won'] || 0;
  const totalLeadExits = Object.keys(moves).filter(k=>k.startsWith('lead→')).reduce((s,k)=>s+moves[k], 0);
  const overallRate = totalLeadExits ? Math.round(100*leadToWon/totalLeadExits) : null;

  // Time-in-stage: average days between consecutive stage events on the same deal
  const dealMoves = {};
  if(typeof AF_PIPELINE !== 'undefined'){
    AF_PIPELINE.forEach(p => {
      if(!p.deal_id || !p.to_stage || !p.ts) return;
      (dealMoves[p.deal_id] = dealMoves[p.deal_id]||[]).push({ts:new Date(p.ts).getTime(), to:p.to_stage});
    });
  }
  const stageDurations = {lead:[], qualified:[], quoted:[], negotiating:[]};
  Object.values(dealMoves).forEach(arr => {
    arr.sort((a,b)=>a.ts-b.ts);
    for(let i = 1; i < arr.length; i++){
      const prevStage = arr[i-1].to;
      if(stageDurations[prevStage]){
        const days = (arr[i].ts - arr[i-1].ts) / 86400000;
        if(days >= 0 && days < 365) stageDurations[prevStage].push(days);
      }
    }
  });
  const stageStats = {};
  Object.keys(stageDurations).forEach(k => {
    const arr = stageDurations[k];
    arr.sort((a,b)=>a-b);
    const avg = arr.length ? arr.reduce((s,x)=>s+x,0)/arr.length : null;
    const median = arr.length ? arr[Math.floor(arr.length/2)] : null;
    stageStats[k] = {avg, median, n: arr.length};
  });

  // Loss reasons
  const reasons = {};
  (DEALS.lost||[]).filter(inWindow).forEach(d => {
    const r = (d.loss_reason||'').trim() || '(unspecified)';
    reasons[r] = (reasons[r]||0) + 1;
  });
  const reasonRows = Object.entries(reasons).sort((a,b)=>b[1]-a[1]);

  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1);

  const html = `
    <div style="margin-bottom:14px;display:flex;gap:8px;align-items:center;font-size:12px;">
      <strong>Window:</strong>
      <select onchange="_paWindow=this.value;openPipelineAnalytics()" style="padding:5px 8px;font-size:12px;">
        <option value="7d" ${_paWindow==='7d'?'selected':''}>Last 7d</option>
        <option value="30d" ${_paWindow==='30d'?'selected':''}>Last 30d</option>
        <option value="90d" ${_paWindow==='90d'?'selected':''}>Last 90d</option>
        <option value="ytd" ${_paWindow==='ytd'?'selected':''}>Year to date</option>
        <option value="all" ${_paWindow==='all'?'selected':''}>All time</option>
      </select>
      ${overallRate!=null?`<span style="margin-left:auto;color:var(--text-3);">Overall lead → won: <strong style="color:var(--text);">${overallRate}%</strong></span>`:''}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="card">
        <div class="card-hd"><span class="card-title">Funnel by Count</span></div>
        <div style="padding:14px 18px;">
          ${funnel.map(f => {
            const w = Math.round(100 * f.count / maxFunnelCount);
            return `<div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
                <span style="font-weight:600;">${f.label}</span>
                <span class="mono">${f.count} · $${Math.round(f.value/1000).toLocaleString()}K</span>
              </div>
              <div style="background:var(--bg-2);height:18px;border-radius:3px;overflow:hidden;">
                <div style="width:${w}%;height:100%;background:var(--accent);"></div>
              </div>
            </div>`;
          }).join('')}
          <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--text-3);">
            Closed: <strong style="color:var(--accent);">${lostCount} lost</strong> ($${Math.round(lostValue/1000).toLocaleString()}K) · ${abandonedCount} abandoned
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Stage Conversion</span></div>
        <div style="padding:14px 18px;">
          ${conversions.length === 0 || conversions.every(c => c.total === 0) ? '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:30px 10px;">No pipeline_events in window. Conversion rates compute from stage-move events recorded by the Pipeline UI.</div>' : conversions.map(c => `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
                <span><strong>${c.from}</strong> → <strong>${c.to}</strong></span>
                <span class="mono">${c.rate!=null?c.rate+'%':'—'} <span class="muted sm">(${c.advance}/${c.total})</span></span>
              </div>
              <div style="background:var(--bg-2);height:14px;border-radius:3px;overflow:hidden;">
                <div style="width:${c.rate||0}%;height:100%;background:var(--blue);"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Time in Stage</span></div>
        <div style="padding:14px 18px;font-size:12px;">
          ${Object.values(stageStats).every(s => !s.n) ? '<div style="color:var(--text-3);text-align:center;padding:30px 10px;">No stage-duration data yet. Recorded via pipeline_events on each stage move.</div>' : ['lead','qualified','quoted','negotiating'].map(s => {
            const st = stageStats[s];
            return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light);">
              <span style="font-weight:600;">${s}</span>
              <span class="mono">${st.n ? `${st.avg.toFixed(1)}d avg · ${st.median.toFixed(1)}d median (n=${st.n})` : '<span class="muted">no data</span>'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">Why We Lost</span></div>
        <div style="padding:14px 18px;font-size:12px;">
          ${reasonRows.length === 0 ? '<div style="color:var(--text-3);text-align:center;padding:30px 10px;">No lost deals in window.</div>' : reasonRows.map(([reason, count]) => {
            const max = reasonRows[0][1];
            const w = Math.round(100*count/max);
            return `<div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(reason)}">${esc(reason)}</span>
                <span class="mono">${count}</span>
              </div>
              <div style="background:var(--bg-2);height:10px;border-radius:3px;overflow:hidden;">
                <div style="width:${w}%;height:100%;background:var(--accent);"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  openModal('Pipeline Analytics', html, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
  // Make modal wider
  setTimeout(() => {
    const modal = document.querySelector('#overlay .modal');
    if(modal) modal.style.maxWidth = '1100px';
  }, 30);
}
