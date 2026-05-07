// ── ACCENTOS WIKI MODULE (v6.11.2) ──────────────────────────────────────────
// Karpathy LLM Wiki pattern: fetch wiki/*.md files, render two-pane layout.
// Primary grounding layer for Ask the Engine (sendChat).

let wikiIndex = null;       // Parsed wiki/index.md → [{slug, title, type, confidence, updated}]
let _ragIndex = null;       // Compact BM25 index (loaded once, used by wikiGroundQuery)
let wikiPage = null;        // Currently displayed page content
let wikiQuery = '';         // Current search query
let wikiCurrentSlug = '';   // Currently displayed slug

// ── INDEX PARSER ────────────────────────────────────────────────────────────

function parseWikiIndex(md) {
  const entries = [];
  let currentType = 'concept';
  for (const line of md.split('\n')) {
    const typeMatch = line.match(/^## (\w+) pages/);
    if (typeMatch) { currentType = typeMatch[1]; continue; }
    // Table rows: | slug | title | confidence | updated |
    if (line.startsWith('|') && !line.includes('---') && !line.includes('slug')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        entries.push({ slug: parts[0], title: parts[1], confidence: parts[2], updated: parts[3], type: currentType });
      }
    }
  }
  return entries;
}

async function loadWikiIndex() {
  if (wikiIndex) return wikiIndex;
  try {
    const r = await fetch('wiki/index.md');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const md = await r.text();
    wikiIndex = parseWikiIndex(md);
    return wikiIndex;
  } catch (e) {
    console.log('[wiki] index load failed:', e.message);
    wikiIndex = [];
    return wikiIndex;
  }
}

async function _loadRagIndex() {
  if (_ragIndex) return _ragIndex;
  try {
    const r = await fetch('skills/accent-rag/index/rag_index_compact.json');
    if (!r.ok) return null;
    _ragIndex = await r.json();
    return _ragIndex;
  } catch { return null; }
}

// ── MARKDOWN RENDERER ───────────────────────────────────────────────────────

function renderWikiMd(raw) {
  let h = esc(raw || '');
  // Strip YAML frontmatter
  h = h.replace(/^---[\s\S]*?---\n/, '');
  // [[wikilinks]] → clickable navigation
  h = h.replace(/\[\[([^\]]+)\]\]/g, (_, slug) =>
    `<a href="#" onclick="openWikiPage('${slug}');return false;" style="color:var(--accent);text-decoration:underline;">${slug}</a>`
  );
  // Inline links
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);">$1</a>');
  // Bold/italic
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  // Code inline
  h = h.replace(/`([^`]+)`/g, '<code style="background:var(--surface2);padding:1px 4px;border-radius:3px;font-family:DM Mono,monospace;font-size:11.5px;">$1</code>');
  // Code blocks
  h = h.replace(/```[\s\S]*?```/g, m => {
    const code = m.replace(/^```[^\n]*\n/, '').replace(/```$/, '');
    return `<pre style="background:var(--surface2);padding:10px 14px;border-radius:6px;font-family:DM Mono,monospace;font-size:11px;overflow-x:auto;margin:10px 0;">${code}</pre>`;
  });
  // Headings
  h = h.replace(/^### (.+)$/gm, '<h4 style="margin:14px 0 6px;font-size:13px;font-weight:700;">$1</h4>');
  h = h.replace(/^## (.+)$/gm, '<h3 style="margin:16px 0 6px;font-size:14px;font-weight:700;">$1</h3>');
  h = h.replace(/^# (.+)$/gm, '<h2 style="margin:18px 0 8px;font-size:15px;font-weight:700;border-bottom:1px solid var(--border);padding-bottom:6px;">$1</h2>');
  // Tables
  h = h.replace(/((?:\|.+\|.*\n){2,})/g, (table) => {
    const rows = table.trim().split('\n').filter(r => !r.match(/^\|[\s\-|]+\|$/));
    return '<table style="width:100%;border-collapse:collapse;font-size:12px;margin:10px 0;">' +
      rows.map((row, i) => {
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        const tag = i === 0 ? 'th' : 'td';
        const style = i === 0
          ? 'background:var(--surface2);padding:5px 8px;font-weight:700;text-align:left;border-bottom:2px solid var(--border);'
          : 'padding:5px 8px;border-bottom:1px solid var(--border-light);';
        return `<tr>${cells.map(c => `<${tag} style="${style}">${c}</${tag}>`).join('')}</tr>`;
      }).join('') + '</table>';
  });
  // Bullet lists
  h = h.replace(/^- (.+)$/gm, '<li style="margin-left:18px;list-style:disc;margin-bottom:2px;">$1</li>');
  h = h.replace(/(<li.*<\/li>)(\n<li)/g, '$1$2');
  // Horizontal rules
  h = h.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">');
  // Newlines → <br> (but not inside block elements we already processed)
  h = h.replace(/\n/g, '<br>');
  return h;
}

// ── PAGE FETCHER ─────────────────────────────────────────────────────────────

async function fetchWikiPage(slug) {
  const index = await loadWikiIndex();
  const entry = index.find(e => e.slug === slug);

  // Determine file path from type
  let path;
  if (entry) {
    const typeDir = {
      concept: 'concepts', decision: 'decisions', entity: null,
      module: 'modules', source: 'sources', synthesis: 'syntheses'
    };
    if (entry.type === 'entity') {
      // entities can be employees/vendors/customers — try all
      const subDirs = ['employees', 'vendors', 'customers'];
      for (const sub of subDirs) {
        const tryPath = `wiki/entities/${sub}/${slug}.md`;
        try {
          const r = await fetch(tryPath);
          if (r.ok) return await r.text();
        } catch (_) {}
      }
      return null;
    }
    const dir = typeDir[entry.type] || entry.type;
    path = `wiki/${dir}/${slug}.md`;
  } else {
    // Try common locations
    for (const dir of ['concepts', 'decisions', 'entities/employees', 'entities/vendors', 'modules', 'sources', 'syntheses']) {
      try {
        const r = await fetch(`wiki/${dir}/${slug}.md`);
        if (r.ok) return await r.text();
      } catch (_) {}
    }
    // Try root operational pages
    try {
      const r = await fetch(`wiki/${slug}.md`);
      if (r.ok) return await r.text();
    } catch (_) {}
    return null;
  }

  try {
    const r = await fetch(path);
    if (!r.ok) return null;
    return await r.text();
  } catch (e) {
    console.log(`[wiki] fetch failed for ${slug}:`, e.message);
    return null;
  }
}

// ── SEARCH ────────────────────────────────────────────────────────────────────

function searchWikiIndex(query, entries) {
  if (!query.trim()) return entries;
  const terms = query.toLowerCase().split(/\s+/);
  return entries
    .map(e => {
      const text = (e.slug + ' ' + e.title + ' ' + e.type).toLowerCase();
      const hits = terms.filter(t => text.includes(t)).length;
      return { ...e, hits };
    })
    .filter(e => e.hits > 0)
    .sort((a, b) => b.hits - a.hits);
}

// ── WIKI GROUNDING (for sendChat) ─────────────────────────────────────────────

// Tokenize a query string: split on whitespace/punctuation, keep words >2 chars.
// Also emits slug-component forms: "footcandle" matches "lumen-output-commercial"
// only if the page body is fetched; but slug components ("lumen","output","commercial")
// provide a secondary title-level signal.
// ── BM25 GROUNDING ENGINE ────────────────────────────────────────────────────
// Mirrors rag_search.py: same stemmer, stop words, graph re-ranking, slug dedup.

const _GROUND_STOP = new Set(["what","how","why","when","where","who","which","is","are","was","were","be","been","the","a","an","to","for","in","of","and","or","but","do","does","did","will","would","should","could","may","might","must","shall","can","with","this","that","it","its","by","at","as","from","if"]);

const _STEM_RULES = [["ations",""],["ation",""],["ings",""],["ing",""],["ments",""],["ment",""],["ances",""],["ance",""],["ences",""],["ence",""],["ities",""],["ity",""],["ness",""],["ers",""],["er",""],["ies","y"],["ed",""],["es",""],["s",""]];

function _stem(w) {
  for (const [s, r] of _STEM_RULES) {
    if (w.endsWith(s) && (w.length - s.length + r.length) >= 4) return w.slice(0, w.length - s.length) + r;
  }
  return w;
}

function _bm25Tokenize(text) {
  const lower = text.toLowerCase();
  const raw = [...lower.matchAll(/\b[a-z][a-z0-9\-]{1,}\b/g)].map(m => m[0]);
  raw.push(...[...lower.matchAll(/\b[0-9][a-z0-9\-]+[a-z]\b/g)].map(m => m[0]));
  const expanded = [], seen = new Set();
  for (const tok of raw) {
    if (!seen.has(tok)) { seen.add(tok); expanded.push(tok); }
    const s = _stem(tok);
    if (s !== tok && !seen.has(s)) { seen.add(s); expanded.push(s); }
  }
  return expanded;
}

function _bm25Search(query, ragIndex, topK, chatMode) {
  const GRAPH_N = 10, GRAPH_BOOST = 0.2;
  const EXCL = new Set(["synthesis"]);
  const terms = _bm25Tokenize(query).filter(t => !_GROUND_STOP.has(t));
  if (!terms.length) return [];

  const { inverted, doc_store } = ragIndex;
  const scores = {};

  for (const term of terms) {
    for (const p of (inverted[term] || [])) {
      const doc = doc_store[p.id];
      if (chatMode === 'customer' && doc.type === 'entity') continue;
      if (EXCL.has(doc.type)) continue;
      scores[p.id] = (scores[p.id] || 0) + p.score;
    }
  }
  if (!Object.keys(scores).length) return [];

  // Build slug → chunk-ids map
  const slugMap = {};
  for (const doc of doc_store) {
    (slugMap[doc.slug] = slugMap[doc.slug] || []).push(doc.id);
  }

  // Graph re-ranking: max boost per chunk (not sum) to prevent hub-page runaway
  const initialTop = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, GRAPH_N);
  const topScore = initialTop[0]?.[1] || 0;
  const graphBoosts = {};
  for (const [docId, docScore] of initialTop) {
    const lw = docScore / topScore;
    for (const relSlug of (doc_store[docId].related || [])) {
      const ba = lw * GRAPH_BOOST * topScore;
      for (const cid of (slugMap[relSlug] || [])) {
        if (EXCL.has(doc_store[cid].type)) continue;
        if (ba > (graphBoosts[cid] || 0)) graphBoosts[cid] = ba;
      }
    }
  }
  for (const [cid, boost] of Object.entries(graphBoosts)) {
    scores[cid] = (scores[cid] || 0) + boost;
  }

  // Rank with unique-slug dedup
  const seen = new Set(), results = [];
  for (const [id, score] of Object.entries(scores).sort((a, b) => b[1] - a[1])) {
    const doc = doc_store[id];
    if (seen.has(doc.slug)) continue;
    seen.add(doc.slug);
    results.push({ slug: doc.slug, title: doc.title, score });
    if (results.length >= topK) break;
  }
  return results;
}

async function wikiGroundQuery(query, chatMode) {
  // Returns { context: string, sources: [{slug, title}] } or null
  try {
    // BM25 path: load compact index (cached after first call), run full BM25 + graph re-rank
    const ragIndex = await _loadRagIndex();
    if (ragIndex) {
      const hits = _bm25Search(query, ragIndex, 3, chatMode);
      if (!hits.length) return null;

      const fetched = await Promise.all(hits.map(async h => {
        const raw = await fetchWikiPage(h.slug);
        if (!raw) return null;
        const body = raw.replace(/^---[\s\S]*?---\n/, '').trim();
        return { slug: h.slug, title: h.title, body };
      }));

      const valid = fetched.filter(Boolean);
      if (!valid.length) return null;

      const context = valid.map(p => `[Wiki: ${p.title}]\n${p.body.slice(0, 500)}`).join('\n\n---\n\n');
      return { context, sources: valid.map(p => ({ slug: p.slug, title: p.title })) };
    }

    // Fallback: title+body text search (used when compact index unavailable)
    const index = await loadWikiIndex();
    if (!index || !index.length) return null;

    const terms = _bm25Tokenize(query).filter(t => !_GROUND_STOP.has(t) && t.length > 2);
    if (!terms.length) return null;

    const allowed = index.filter(e => {
      if (chatMode === 'customer' && (e.type === 'entity' || e.confidence === 'low')) return false;
      if (e.type === 'synthesis') return false;
      return true;
    });

    const slugWords = e => e.slug.split('-');
    const titleScore = e => {
      const text = (e.title + ' ' + slugWords(e).join(' ')).toLowerCase();
      return terms.filter(t => text.includes(t)).length;
    };

    const candidates = allowed
      .map(e => ({ ...e, ts: titleScore(e) }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 6);

    const fetched = await Promise.all(candidates.map(async e => {
      const raw = await fetchWikiPage(e.slug);
      if (!raw) return null;
      const body = raw.replace(/^---[\s\S]*?---\n/, '').trim();
      const lower = body.toLowerCase();
      const bodyHits = terms.reduce((s, t) => {
        let c = 0, pos = 0;
        while (c < 5 && (pos = lower.indexOf(t, pos)) !== -1) { c++; pos++; }
        return s + c;
      }, 0);
      return { slug: e.slug, title: e.title, body, score: e.ts * 3 + bodyHits };
    }));

    const ranked = fetched.filter(Boolean).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    if (!ranked.length) return null;

    const context = ranked.map(p => `[Wiki: ${p.title}]\n${p.body.slice(0, 500)}`).join('\n\n---\n\n');
    return { context, sources: ranked.map(p => ({ slug: p.slug, title: p.title })) };
  } catch (e) {
    console.log('[wiki] grounding failed:', e.message);
    return null;
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────

async function openWikiPage(slug) {
  wikiCurrentSlug = slug;
  const pane = document.getElementById('wiki-content-pane');
  if (!pane) return;

  pane.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-3);">Loading ${esc(slug)}…</div>`;

  const raw = await fetchWikiPage(slug);
  if (!raw) {
    pane.innerHTML = `<div style="padding:24px;color:var(--text-3);">
      <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Page not found: ${esc(slug)}</div>
      <div style="font-size:12.5px;">This page may not exist yet. Use <code>/aos-ingest</code> to create it.</div>
    </div>`;
    return;
  }

  pane.innerHTML = `<div style="padding:18px 22px;font-size:13.5px;line-height:1.6;max-height:calc(100vh - 180px);overflow-y:auto;">${renderWikiMd(raw)}</div>`;

  // Highlight active index entry
  document.querySelectorAll('.wiki-idx-row').forEach(el => {
    el.style.background = el.dataset.slug === slug ? 'var(--surface2)' : '';
  });
}

async function wiki(el, act) {
  const index = await loadWikiIndex();

  const filtered = searchWikiIndex(wikiQuery, index);

  // Group by type
  const groups = {};
  for (const e of filtered) {
    groups[e.type] = groups[e.type] || [];
    groups[e.type].push(e);
  }

  const typeOrder = ['concept', 'decision', 'entity', 'module', 'source', 'synthesis'];
  const typeLabels = {
    concept: 'Concepts', decision: 'Decisions', entity: 'Entities',
    module: 'Modules', source: 'Sources', synthesis: 'Syntheses'
  };

  const indexHTML = typeOrder
    .filter(t => groups[t]?.length)
    .map(t => `
      <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);padding:10px 12px 4px;">${typeLabels[t]}</div>
      ${groups[t].map(e => `
        <div class="wiki-idx-row" data-slug="${esc(e.slug)}"
          onclick="openWikiPage('${esc(e.slug)}')"
          style="padding:7px 12px;cursor:pointer;border-radius:4px;margin:0 4px 1px;"
          onmouseover="this.style.background='var(--surface2)'"
          onmouseout="this.style.background=this.dataset.slug==='${esc(wikiCurrentSlug)}'?'var(--surface2)':''">
          <div style="font-size:12.5px;font-weight:600;">${esc(e.title)}</div>
          <div style="font-size:10.5px;color:var(--text-3);">${esc(e.slug)}</div>
        </div>
      `).join('')}
    `).join('');

  el.innerHTML = `
    <div style="display:flex;gap:0;height:calc(100vh - 100px);min-height:400px;">
      <!-- Left pane: index + search -->
      <div style="width:280px;min-width:220px;border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;">
        <div style="padding:12px 12px 8px;">
          <input
            id="wiki-search"
            placeholder="Search wiki…"
            value="${esc(wikiQuery)}"
            oninput="wikiQuery=this.value;wiki($('pg-content'))"
            style="width:100%;padding:7px 10px;font-size:12.5px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);">
        </div>
        <div style="flex:1;overflow-y:auto;">
          ${indexHTML || '<div style="padding:20px 12px;color:var(--text-3);font-size:12.5px;">No pages match.</div>'}
        </div>
        <div style="padding:10px 12px;border-top:1px solid var(--border);font-size:10.5px;color:var(--text-3);">
          ${index.length} pages · <a href="#" onclick="goTo('knowledge');return false;" style="color:var(--accent);">Ask the Engine ⚡</a>
        </div>
      </div>
      <!-- Right pane: page content -->
      <div id="wiki-content-pane" style="flex:1;overflow-y:auto;">
        <div style="padding:40px;text-align:center;color:var(--text-3);">
          <div style="font-size:15px;font-weight:600;margin-bottom:8px;">AccentOS Wiki</div>
          <div style="font-size:13px;margin-bottom:16px;">Karpathy LLM Wiki pattern · ${index.length} pages</div>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" onclick="openWikiPage('vendor-scoring')">⚖ Vendor Scoring</button>
            <button class="btn btn-outline btn-sm" onclick="openWikiPage('lighting-reference')">💡 Lighting Reference</button>
            <button class="btn btn-outline btn-sm" onclick="openWikiPage('sop-vendor-onboarding')">📋 Vendor SOP</button>
            <button class="btn btn-outline btn-sm" onclick="openWikiPage('overview')">🗺 Overview</button>
          </div>
        </div>
      </div>
    </div>
  `;

  act.innerHTML = `<button class="btn btn-outline btn-sm" onclick="openWikiPage('overview')">📖 Overview</button>`;

  // Auto-open slug if set via URL hash
  if (wikiCurrentSlug) {
    setTimeout(() => openWikiPage(wikiCurrentSlug), 0);
  }
}
