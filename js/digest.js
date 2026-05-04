// ── DAILY BRIEF EMAIL DIGEST ──
// Generates a plaintext summary of the current Daily Brief tiles,
// formatted for pasting into email or Slack. Reuses computeDailyBrief()
// from the inline shell. No new schema, no API.

function generateDailyDigest(){
  const role = (typeof CU !== 'undefined' && CU?.role) ? CU.role : 'Owner';
  const items = (typeof computeDailyBrief === 'function') ? computeDailyBrief(role) : [];
  const today = new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  const lines = [
    `AccentOS Daily Brief — ${today}`,
    `Generated for ${role} role`,
    ''.padEnd(60, '─'),
    ''
  ];
  if(!items.length){
    lines.push('No items requiring attention today. 🎉');
  } else {
    items.forEach(it => {
      lines.push(`• ${it.label}: ${it.value}`);
      if(it.detail) lines.push(`   ${it.detail.replace(/<[^>]+>/g, '')}`);
    });
  }
  // Add KPI overview if available
  if(typeof DEALS !== 'undefined'){
    const won = (DEALS.won||[]).length;
    const active = ['lead','qualified','quoted','negotiating'].reduce((s,k) => s + (DEALS[k]||[]).length, 0);
    const pipelineValue = ['lead','qualified','quoted','negotiating'].reduce((s,k) => s + (DEALS[k]||[]).reduce((sum,d) => sum + (Number(d.value)||0), 0), 0);
    lines.push('');
    lines.push(''.padEnd(60, '─'));
    lines.push(`Pipeline: ${active} active · $${Math.round(pipelineValue).toLocaleString()} · ${won} won`);
  }
  if(typeof VD !== 'undefined'){
    const avg = VD.map(v => (typeof weightedScore==='function')?weightedScore(v):null).filter(x => x!==null);
    if(avg.length){
      lines.push(`Vendors: ${VD.length} tracked · avg score ${(avg.reduce((a,b)=>a+b,0)/avg.length).toFixed(1)}`);
    }
  }
  lines.push('');
  lines.push('— Sent from AccentOS · accent-os.pages.dev');
  return lines.join('\n');
}

function showDailyDigest(){
  const text = generateDailyDigest();
  openModal('Daily Brief — Email Digest', `
    <div class="muted sm" style="margin-bottom:8px;">Plaintext snapshot of today's Daily Brief, ready to paste into email / Slack / Teams.</div>
    <textarea id="dd-text" rows="18" style="width:100%;font-family:'DM Mono',monospace;font-size:11px;border:1px solid var(--border);border-radius:6px;padding:10px;background:var(--bg-2);">${esc(text)}</textarea>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-outline" onclick="_ddCopy()">📋 Copy to clipboard</button>
      <button class="btn btn-accent" onclick="_ddEmail()">✉️ Open in email</button>
    </div>
  `);
}

function _ddCopy(){
  const t = $('dd-text');
  if(!t) return;
  navigator.clipboard.writeText(t.value).then(() => toast('Copied to clipboard','ok'));
}

function _ddEmail(){
  const t = $('dd-text');
  if(!t) return;
  const subject = encodeURIComponent(`AccentOS Daily Brief — ${new Date().toLocaleDateString()}`);
  const body = encodeURIComponent(t.value);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
