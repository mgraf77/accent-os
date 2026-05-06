// js/wiki.js — AccentOS Wiki Browser
// Displays wiki/*.md pages from the _index.json file-based index.
// No Supabase dependency — fetches static files from wiki/ directory.

let WIKI_INDEX = [];   // populated by loadWikiIndex()
let WIKI_CURRENT = null;

const WIKI_TYPE_ICONS = {
  sop:            '📋',
  adr:            '🏛',
  cluster:        '💡',
  entity:         '👤',
  source_summary: '🔌',
  concept:        '📖',
  runbook:        '⚙',
};

const WIKI_TYPE_LABELS = {
  sop:            'SOP',
  adr:            'ADR',
  cluster:        'Cluster',
  entity:         'Entity',
  source_summary: 'Source',
  concept:        'Concept',
  runbook:        'Runbook',
};

async function loadWikiIndex() {
  try {
    const res = await fetch('wiki/_index.json');
    if (!res.ok) { console.log('wiki: _index.json not found — run wiki_seed.py first'); return; }
    WIKI_INDEX = await res.json();
    console.log(`wiki: loaded ${WIKI_INDEX.length} pages`);
  } catch (e) {
    console.log('wiki: could not load _index.json', e.message);
  }
}

function wiki(el, actEl) {
  if (!el) return;
  actEl && (actEl.innerHTML = `
    <button onclick="wikiRunLint()" title="Run wiki_lint.py check">🔍 Lint</button>
  `);
  _renderWikiShell(el);
}

function _renderWikiShell(el) {
  const types = [...new Set(WIKI_INDEX.map(p => p.type))].sort();
  const typeOpts = ['', ...types].map(t => `<option value="${t}">${t ? (WIKI_TYPE_LABELS[t] || t) : 'All types'}</option>`).join('');

  el.innerHTML = `
<div style="display:flex;gap:0;height:calc(100vh - 104px);overflow:hidden;">

  <!-- Left pane: list -->
  <div style="width:300px;min-width:260px;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;">
    <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
      <input id="wiki-q" type="search" placeholder="Search wiki…" oninput="_wikiFilter()"
        style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-2);color:var(--text-1);">
      <select id="wiki-type" onchange="_wikiFilter()"
        style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--bg-2);color:var(--text-1);">
        ${typeOpts}
      </select>
    </div>
    <div id="wiki-list" style="overflow-y:auto;flex:1;padding:6px 0;"></div>
    <div style="padding:8px 12px;font-size:11px;color:var(--text-3);border-top:1px solid var(--border);" id="wiki-count"></div>
  </div>

  <!-- Right pane: viewer -->
  <div style="flex:1;overflow-y:auto;padding:24px 32px;" id="wiki-viewer">
    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-3);">
      <div style="text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">📚</div>
        <div style="font-size:14px;">Select a page from the list</div>
        <div style="font-size:12px;margin-top:4px;">${WIKI_INDEX.length} pages indexed</div>
      </div>
    </div>
  </div>

</div>`;

  _wikiFilter();
}

function _wikiFilter() {
  const q = ($('wiki-q')?.value || '').toLowerCase().trim();
  const type = $('wiki-type')?.value || '';
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  let pages = WIKI_INDEX;
  if (type) pages = pages.filter(p => p.type === type);
  if (tokens.length) {
    pages = pages.filter(p => {
      const blob = `${p.title} ${(p.tags || []).join(' ')} ${p.excerpt || ''}`.toLowerCase();
      return tokens.every(t => blob.includes(t));
    });
  }

  const list = $('wiki-list');
  const count = $('wiki-count');
  if (!list) return;

  list.innerHTML = pages.map(p => `
    <div class="wiki-row ${WIKI_CURRENT?.id === p.id ? 'wiki-active' : ''}"
      onclick="wikiOpenPage('${esc(p.id)}','${esc(p.path)}')"
      style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s;"
      onmouseenter="this.style.background='var(--bg-2)'" onmouseleave="this.style.background=''">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;">
        <span title="${p.type}">${WIKI_TYPE_ICONS[p.type] || '📄'}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-1);flex:1;min-width:0;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.title)}</span>
        <span style="font-size:10px;background:var(--bg-3);border-radius:4px;padding:1px 5px;
          color:var(--text-3);white-space:nowrap;">w${p.weight}</span>
      </div>
      <div style="font-size:11px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;
        white-space:nowrap;">${(p.tags || []).slice(0,4).map(t=>`<span style="margin-right:4px;">#${esc(t)}</span>`).join('')}</div>
    </div>`).join('') || `<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px;">No pages match</div>`;

  if (count) count.textContent = `${pages.length} of ${WIKI_INDEX.length} pages`;
}

async function wikiOpenPage(id, path) {
  WIKI_CURRENT = WIKI_INDEX.find(p => p.id === id);
  _wikiFilter(); // re-render list to update active highlight

  const viewer = $('wiki-viewer');
  if (!viewer) return;
  viewer.innerHTML = `<div style="color:var(--text-3);font-size:13px;padding:20px;">Loading…</div>`;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const md = await res.text();
    // Strip frontmatter
    const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
    viewer.innerHTML = _wikiRenderPage(WIKI_CURRENT, body);
  } catch (e) {
    viewer.innerHTML = `<div style="color:var(--danger);padding:20px;">Could not load page: ${esc(e.message)}<br>
      <small>Path: ${esc(path)}</small></div>`;
  }
}

function _wikiRenderPage(page, body) {
  const meta = page || {};
  const tags = (meta.tags || []).map(t => `<span style="font-size:11px;background:var(--bg-2);border:1px solid var(--border);
    border-radius:4px;padding:2px 7px;color:var(--text-2);">#${esc(t)}</span>`).join(' ');

  const related = (meta.related || []).map(id => {
    const p = WIKI_INDEX.find(x => x.id === id);
    return p ? `<span onclick="wikiOpenPage('${esc(p.id)}','${esc(p.path)}')"
      style="font-size:12px;color:var(--accent);cursor:pointer;text-decoration:underline;">${esc(p.title)}</span>` : '';
  }).filter(Boolean).join(' · ');

  const html = _mdToHtml(body);

  return `
<div style="max-width:760px;">
  <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-size:20px;">${WIKI_TYPE_ICONS[meta.type] || '📄'}</span>
      <span style="font-size:11px;background:var(--bg-2);border:1px solid var(--border);border-radius:4px;
        padding:2px 7px;color:var(--text-3);">${WIKI_TYPE_LABELS[meta.type] || meta.type}</span>
      <span style="font-size:11px;background:var(--bg-2);border:1px solid var(--border);border-radius:4px;
        padding:2px 7px;color:var(--text-3);">weight ${meta.weight}</span>
      <span style="font-size:11px;background:var(--bg-2);border:1px solid var(--border);border-radius:4px;
        padding:2px 7px;color:var(--text-3);">${esc(meta.status || '')}</span>
    </div>
    <h1 style="font-size:20px;font-weight:700;margin:0 0 10px;">${esc(meta.title || '')}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">${tags}</div>
    ${related ? `<div style="font-size:12px;color:var(--text-3);">Related: ${related}</div>` : ''}
    <div style="font-size:11px;color:var(--text-3);margin-top:6px;">
      Updated ${esc(meta.updated || '')} · <code style="font-size:10px;">${esc(meta.path || '')}</code>
    </div>
  </div>
  <div class="wiki-body" style="font-size:14px;line-height:1.7;color:var(--text-1);">
    ${html}
  </div>
</div>`;
}

function _mdToHtml(md) {
  return md
    .replace(/^(#{1,6})\s+(.+)$/gm, (_, h, t) => {
      const lvl = h.length;
      const sz = ['', '20', '17', '15', '14', '13', '13'][lvl] || '14';
      const mt = lvl <= 2 ? '28' : '20';
      return `<h${lvl} style="font-size:${sz}px;font-weight:700;margin:${mt}px 0 10px;">${t}</h${lvl}>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg-2);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-size:12px;">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:var(--bg-2);border:1px solid var(--border);border-radius:6px;padding:14px;overflow-x:auto;font-size:12px;margin:14px 0;"><code>$1</code></pre>')
    .replace(/^\|(.+)\|$/gm, (_, r) => {
      const cells = r.split('|').map(c => c.trim());
      const isHeader = cells.some(c => /^[-:]+$/.test(c));
      if (isHeader) return '';
      return '<tr>' + cells.map(c => `<td style="padding:6px 12px;border:1px solid var(--border);">${c}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\s*)+/g, m => `<table style="border-collapse:collapse;width:100%;margin:12px 0;font-size:13px;">${m}</table>`)
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0;">')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin:3px 0;">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\s*)+/g, m => `<ul style="padding-left:20px;margin:10px 0;">${m}</ul>`)
    .replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:3px 0;">$1</li>')
    .replace(/\n{2,}/g, '</p><p style="margin:12px 0;">')
    .replace(/^(?!<[h\d|p|u|l|t|c|p])/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);">$1</a>');
}

function wikiRunLint() {
  openModal(`
    <h3 style="margin:0 0 12px;">Wiki Lint</h3>
    <p style="font-size:13px;color:var(--text-2);">Run from your terminal:</p>
    <pre style="background:var(--bg-2);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:12px;">python scripts/wiki_lint.py</pre>
    <p style="font-size:12px;color:var(--text-3);margin-top:10px;">Exit 0 = all pages valid. Exit 1 = errors found (see output).</p>
    <div style="margin-top:12px;font-size:13px;color:var(--text-2);">Indexed pages: <strong>${WIKI_INDEX.length}</strong></div>
  `);
}
