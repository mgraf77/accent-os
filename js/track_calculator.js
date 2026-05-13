// Track Hardware Calculator — extracted from index.html (v6.10.77)
// Depends on: QKB (global const in inline script), openModal, closeModal, toast, esc, $, LI, renderLI, updatePreview

function openTrackCalc() {
  openModal('Track Hardware Calculator',
    `<div style="font-size:13px;margin-bottom:12px;color:var(--text-2);">Enter track run lengths (one per line, in feet). Select color. Calculator outputs all sections, connectors, and power feeds.</div>
    <div class="frow">
      <div class="fcol field">
        <label>Black Track Runs (ft, one per line)</label>
        <textarea id="tc-bl" style="min-height:100px;font-family:'DM Mono',monospace;" placeholder="16\n16\n26\n6\n32"></textarea>
      </div>
      <div class="fcol field">
        <label>White Track Runs (ft, one per line)</label>
        <textarea id="tc-wh" style="min-height:100px;font-family:'DM Mono',monospace;" placeholder="26\n32"></textarea>
      </div>
    </div>
    <div id="tc-preview" style="margin-top:12px;font-size:12.5px;"></div>`,
    `<button class="btn btn-outline" onclick="previewTrackCalc()">Preview</button>
     <button class="btn btn-accent" onclick="addTrackLinesToQuote()">Add to Quote</button>
     <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`
  );
}

// Input: array of run lengths in feet, color 'black'|'white'
// Returns: { lines, reasoning } — lines are quote line items, reasoning is human-readable explanation
function calcTrackHardware(runs, color) {
  const parts = QKB.trackParts;
  const col = color === 'white' ? 'white' : 'black';
  const sectionTotals = { 2:0, 4:0, 6:0, 8:0 };
  let totalConnectors = 0;
  let totalPowerFeeds = runs.length;
  const reasoning = [];

  runs.forEach((len, i) => {
    let remaining = len;
    let sections = [];
    while (remaining >= 8) { sections.push(8); remaining -= 8; }
    if (remaining === 6) { sections.push(6); remaining = 0; }
    else if (remaining === 4) { sections.push(4); remaining = 0; }
    else if (remaining === 2) { sections.push(2); remaining = 0; }
    else if (remaining > 0) {
      if (remaining <= 2) { sections.push(2); }
      else if (remaining <= 4) { sections.push(4); }
      else if (remaining <= 6) { sections.push(6); }
      else { sections.push(8); }
    }
    const connectors = sections.length - 1;
    totalConnectors += connectors;
    sections.forEach(s => sectionTotals[s]++);
    reasoning.push(`Run ${i+1}: ${len}ft → ${sections.map(s=>s+"ft").join("+")} + 1 power feed + ${connectors} connector${connectors!==1?'s':''}`);
  });

  const lines = [];
  [8,6,4,2].forEach(sz => {
    if (sectionTotals[sz] > 0) {
      const p = parts[col][sz];
      lines.push({ part: p.part, desc: `FIXTURE "T${col==='white'?2:1}" ${p.desc}`, qty: sectionTotals[sz], price: p.price, cat: 'Track', status: 'pending', flag: '', reasoning: `${sectionTotals[sz]}× ${sz}ft section from run calculations` });
    }
  });
  if (totalPowerFeeds > 0) {
    const pf = parts.powerfeed[col];
    lines.push({ part: pf.part, desc: `FIXTURE "T${col==='white'?2:1}" ${pf.desc}`, qty: totalPowerFeeds, price: pf.price, cat: 'Track', status: 'pending', flag: '', reasoning: `1 power feed per run × ${totalPowerFeeds} runs` });
  }
  if (totalConnectors > 0) {
    const cn = parts.connector[col];
    lines.push({ part: cn.part, desc: `FIXTURE "T${col==='white'?2:1}" ${cn.desc}`, qty: totalConnectors, price: cn.price, cat: 'Track', status: 'pending', flag: '', reasoning: `Connectors = (sections per run − 1) summed across all runs` });
  }
  return { lines, reasoning };
}

function parseRunLengths(txt) {
  return (txt||'').split('\n').map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>n>0);
}

function previewTrackCalc() {
  const blRuns = parseRunLengths($('tc-bl')?.value);
  const whRuns = parseRunLengths($('tc-wh')?.value);
  const prev = $('tc-preview'); if (!prev) return;
  let html = '';
  if (blRuns.length) {
    const { lines, reasoning } = calcTrackHardware(blRuns, 'black');
    html += `<div style="font-weight:600;margin-bottom:4px;">Black Track (${blRuns.length} runs):</div>`;
    html += reasoning.map(r=>`<div style="color:var(--text-3);margin-bottom:2px;">· ${esc(r)}</div>`).join('');
    html += `<table style="width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12px;">${lines.map(l=>`<tr><td style="padding:3px 0;">${esc(l.part)}</td><td>${esc(l.desc)}</td><td style="text-align:center;">${Number(l.qty)||0}</td><td style="text-align:right;font-family:'DM Mono',monospace;">$${((Number(l.qty)||0)*(Number(l.price)||0)).toFixed(2)}</td></tr>`).join('')}</table>`;
  }
  if (whRuns.length) {
    const { lines, reasoning } = calcTrackHardware(whRuns, 'white');
    html += `<div style="font-weight:600;margin-bottom:4px;">White Track (${whRuns.length} runs):</div>`;
    html += reasoning.map(r=>`<div style="color:var(--text-3);margin-bottom:2px;">· ${esc(r)}</div>`).join('');
    html += `<table style="width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12px;">${lines.map(l=>`<tr><td style="padding:3px 0;">${esc(l.part)}</td><td>${esc(l.desc)}</td><td style="text-align:center;">${Number(l.qty)||0}</td><td style="text-align:right;font-family:'DM Mono',monospace;">$${((Number(l.qty)||0)*(Number(l.price)||0)).toFixed(2)}</td></tr>`).join('')}</table>`;
  }
  if (!html) html = `<div style="color:var(--text-3);">Enter at least one run length to preview.</div>`;
  prev.innerHTML = html;
}

let _pendingTrackLines = [];
function addTrackLinesToQuote() {
  const blRuns = parseRunLengths($('tc-bl')?.value);
  const whRuns = parseRunLengths($('tc-wh')?.value);
  _pendingTrackLines = [];
  if (blRuns.length) _pendingTrackLines.push(...calcTrackHardware(blRuns,'black').lines);
  if (whRuns.length) _pendingTrackLines.push(...calcTrackHardware(whRuns,'white').lines);
  if (!_pendingTrackLines.length) { toast('No runs entered','err'); return; }
  _pendingTrackLines.forEach(l => LI.push({ id:Date.now()+Math.random(), ...l }));
  closeModal();
  renderLI(); updatePreview();
  toast(`${_pendingTrackLines.length} track hardware lines added`, 'ok');
}
