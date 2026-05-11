// ── 5.1 KNOWLEDGE HUB (articles table — see sql/M21_phase3_schema.sql) ──
register({ name: 'knowledge_hub', provides: ['knowledge_hub','ARTICLES','sbLoadArticles','sbSaveArticle','sbDeleteArticle'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });
let ARTICLES = [];
let khFilter = {q:'', category:''};
let khSelected = null;

async function sbLoadArticles(){
  if(!sbConfigured()) return false;
  try{
    const rows = await sbFetch('/articles?select=id,slug,title,category,body,tags,related_vendor_id,visible_to_roles,pinned,author_id,created_at,updated_at&order=pinned.desc.nullslast,updated_at.desc&limit=500');
    ARTICLES = Array.isArray(rows) ? rows : [];
    console.log(`[articles] Loaded ${ARTICLES.length} articles`);
    return ARTICLES.length;
  }catch(e){
    if(/relation .* does not exist|404/i.test(e.message||'')){
      console.log('[articles] table not yet created — run sql/M21_phase3_schema.sql');
    } else {
      console.warn('[sb] Load articles failed:', e.message);
    }
    return false;
  }
}

async function sbSaveArticle(rec){
  if(!sbConfigured()) return false;
  try{
    const body = {
      id: rec.id || undefined,
      slug: rec.slug || null,
      title: rec.title,
      category: rec.category || 'reference',
      body: rec.body || null,
      tags: rec.tags || null,
      related_vendor_id: rec.related_vendor_id || null,
      pinned: !!rec.pinned,
      author_id: (CU?.user_id) || null,
      updated_at: new Date().toISOString()
    };
    const headers = {'Prefer': rec.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'};
    const path = rec.id ? '/articles?on_conflict=id' : '/articles';
    const res = await sbFetch(path, {method:'POST', headers, body: JSON.stringify(body)});
    if(Array.isArray(res) && res[0]) return res[0];
    return true;
  }catch(e){ console.warn('[sb] Save article failed:', e.message); return false; }
}

async function sbDeleteArticle(id){
  if(!sbConfigured()) return false;
  try{
    await sbFetch(`/articles?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}});
    return true;
  }catch(e){ console.warn('[sb] Delete article failed:', e.message); return false; }
}

function renderKnowledgeHub(c){
  // Filter
  const q = (khFilter.q||'').toLowerCase();
  const filtered = ARTICLES.filter(a => {
    if(khFilter.category && a.category !== khFilter.category) return false;
    if(q){
      const hay = `${a.title||''} ${a.body||''} ${(a.tags||[]).join(' ')}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  const sel = khSelected ? ARTICLES.find(a => a.id === khSelected) : null;

  c.innerHTML = `
    <div style="display:grid;grid-template-columns:280px 1fr;gap:14px;min-height:560px;">
      <div class="card" style="display:flex;flex-direction:column;">
        <div class="card-hd" style="padding:10px 12px;">
          <span class="card-title" style="font-size:12px;">Articles · ${filtered.length}${filtered.length!==ARTICLES.length?' / '+ARTICLES.length:''}</span>
          <button class="btn btn-accent btn-sm" style="font-size:10px;padding:3px 8px;" onclick="openArticleEdit(null)">+ New</button>
        </div>
        <div style="padding:8px 12px;border-bottom:1px solid var(--border);">
          <input id="kh-q" placeholder="Search…" style="width:100%;padding:5px 8px;font-size:11px;border:1px solid var(--border);border-radius:4px;" value="${esc(khFilter.q)}" oninput="khFilter.q=this.value;clearTimeout(window._khDeb);window._khDeb=setTimeout(()=>renderKnowledgeHub($('kh-content')),200)">
          <select style="width:100%;padding:4px 6px;font-size:11px;margin-top:6px;" onchange="khFilter.category=this.value;renderKnowledgeHub($('kh-content'))">
            <option value="">All categories</option>
            ${['vendor_playbook','rep_protocol','process','training','policy','reference','other'].map(c=>`<option value="${c}" ${khFilter.category===c?'selected':''}>${c.replace('_',' ')}</option>`).join('')}
          </select>
        </div>
        <div style="overflow-y:auto;flex:1;max-height:520px;">
          ${ARTICLES.length === 0 ? '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:12px;">No articles yet. Click "+ New" to add one.<br><br>Run <code>sql/M21_phase3_schema.sql</code> first if articles fail to save.</div>' : (filtered.length === 0 ? '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:12px;">No matches.</div>' : filtered.map(a => {
            const isSel = sel && sel.id === a.id;
            const updated = a.updated_at ? new Date(a.updated_at).toLocaleDateString() : '';
            return `<div onclick="khSelected='${a.id}';renderKnowledgeHub($('kh-content'))" style="padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;background:${isSel?'var(--bg-2)':'transparent'};border-left:3px solid ${isSel?'var(--accent)':'transparent'};">
              <div style="font-weight:${isSel?'700':'600'};font-size:12px;display:flex;align-items:center;gap:6px;">${a.pinned?'<span style="color:var(--accent);">📌</span>':''}${esc(a.title)}</div>
              <div class="muted sm" style="font-size:10px;margin-top:2px;">${esc((a.category||'').replace('_',' '))} · ${updated}</div>
            </div>`;
          }).join(''))}
        </div>
      </div>
      <div class="card" style="overflow:hidden;">
        ${sel ? renderArticleView(sel) : `<div style="padding:60px;text-align:center;color:var(--text-3);">
          <div style="font-size:32px;margin-bottom:10px;">📖</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:6px;">Knowledge Hub</div>
          <div class="sm">Pick an article on the left or click "+ New" to create one.</div>
          <div class="sm" style="margin-top:14px;">Categories: vendor playbooks · rep protocols · process docs · training · policy · reference</div>
        </div>`}
      </div>
    </div>
  `;
}

function renderArticleView(a){
  const updated = a.updated_at ? new Date(a.updated_at).toLocaleString() : '';
  const tagsHTML = (a.tags||[]).length ? `<div style="margin-top:6px;">${a.tags.map(t => `<span class="badge bg-gray" style="font-size:10px;margin-right:4px;">${esc(t)}</span>`).join('')}</div>` : '';
  // Very lightweight markdown rendering — newlines → <br>, **bold**, *italic*, # headings, [text](url)
  const md = (s) => {
    let h = esc(s||'');
    // Inline link
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);">$1</a>');
    // Bold/italic
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    // Headings (line-leading # / ## / ###)
    h = h.replace(/^### (.+)$/gm, '<h4 style="margin:14px 0 6px;font-size:13px;font-weight:700;">$1</h4>');
    h = h.replace(/^## (.+)$/gm, '<h3 style="margin:16px 0 6px;font-size:14px;font-weight:700;">$1</h3>');
    h = h.replace(/^# (.+)$/gm, '<h2 style="margin:18px 0 8px;font-size:15px;font-weight:700;">$1</h2>');
    // Bullet list
    h = h.replace(/^- (.+)$/gm, '<li style="margin-left:18px;list-style:disc;">$1</li>');
    // Newlines → <br>
    h = h.replace(/\n/g, '<br>');
    return h;
  };
  const canPin = CU && ['Owner','Admin','Manager','Sales'].includes(CU.role);
  return `
    <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          ${a.pinned?'<span style="color:var(--accent);">📌</span>':''}
          <span style="font-size:18px;font-weight:700;">${esc(a.title)}</span>
          <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc((a.category||'').replace('_',' '))}</span>
        </div>
        <div class="muted sm" style="margin-top:3px;">Updated ${updated}</div>
        ${tagsHTML}
      </div>
      ${canPin ? `<button class="btn btn-outline btn-sm" onclick="toggleArticlePin('${a.id}')" title="${a.pinned?'Unpin':'Pin to top'}">${a.pinned?'📌 Unpin':'📌 Pin'}</button>` : ''}
      <button class="btn btn-outline btn-sm" onclick="openArticleEdit('${a.id}')">Edit</button>
    </div>
    <div style="padding:18px 22px;overflow-y:auto;max-height:480px;font-size:13.5px;line-height:1.55;color:var(--text);">
      ${a.body ? md(a.body) : '<span class="muted">No content yet.</span>'}
    </div>
  `;
}

function openArticleEdit(articleId){
  const isNew = !articleId;
  const a = isNew ? {category:'reference', tags:[], pinned:false} : ARTICLES.find(x => x.id === articleId);
  if(!a){ toast('Article not found','err'); return; }
  openModal((isNew?'New':'Edit')+' Article', `
    <div class="fg"><label>Title *</label><input id="ka-t" value="${esc(a.title||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>Category</label>
        <select id="ka-c">
          ${['vendor_playbook','rep_protocol','process','training','policy','reference','other'].map(c=>`<option value="${c}" ${a.category===c?'selected':''}>${c.replace('_',' ')}</option>`).join('')}
        </select>
      </div>
      <div class="fcol field" style="display:flex;align-items:flex-end;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input id="ka-pin" type="checkbox" ${a.pinned?'checked':''}> Pin to top</label></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Slug (optional)</label><input id="ka-slug" value="${esc(a.slug||'')}" placeholder="auto-derived from title if blank"></div>
      <div class="fcol field"><label>Tags (comma-separated)</label><input id="ka-tags" value="${esc((a.tags||[]).join(', '))}" placeholder="quoting, freight, ledi"></div>
    </div>
    <div class="fg"><label>Body (Markdown)</label><textarea id="ka-body" rows="12" style="font-family:monospace;font-size:12px;">${esc(a.body||'')}</textarea>
      <div class="fhint">Supports: # / ## / ### headings · **bold** · *italic* · [text](url) · - bullet</div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      ${!isNew?`<button class="btn btn-outline" style="margin-right:auto;color:var(--accent);" onclick="deleteArticleConfirm('${articleId}')">Delete</button>`:''}
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent" onclick="saveArticle(${isNew?'null':`'${articleId}'`})">Save</button>
    </div>
  `);
}

async function saveArticle(articleId){
  const title = $('ka-t')?.value?.trim();
  if(!title){ toast('Title required','err'); return; }
  let slug = $('ka-slug').value?.trim();
  if(!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  const tags = $('ka-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const rec = {
    id: articleId || undefined,
    title,
    slug: slug || null,
    category: $('ka-c').value,
    body: $('ka-body').value || null,
    tags,
    pinned: $('ka-pin').checked
  };
  const saved = await sbSaveArticle(rec);
  if(!saved){ toast('Save failed — table may not exist (run M21 SQL)','err'); return; }
  if(typeof saved === 'object' && saved.id){
    const idx = ARTICLES.findIndex(x => x.id === saved.id);
    if(idx >= 0) ARTICLES[idx] = saved; else ARTICLES.unshift(saved);
    khSelected = saved.id;
  } else {
    await sbLoadArticles();
  }
  if(typeof sbAuditLog==='function') sbAuditLog(articleId?'article_edit':'article_create', 'knowledge', {article_id: articleId||saved?.id, title, category: rec.category});
  closeModal();
  const c = $('kh-content'); if(c) renderKnowledgeHub(c);
  toast('Article '+(articleId?'updated':'added'),'ok');
}

async function deleteArticleConfirm(articleId){
  const a = ARTICLES.find(x => x.id === articleId);
  if(!a) return;
  if(!confirm(`Delete article "${a.title}"?`)) return;
  await sbDeleteArticle(articleId);
  ARTICLES = ARTICLES.filter(x => x.id !== articleId);
  if(khSelected === articleId) khSelected = null;
  if(typeof sbAuditLog==='function') sbAuditLog('article_delete', 'knowledge', {article_id: articleId, title: a.title});
  closeModal();
  const c = $('kh-content'); if(c) renderKnowledgeHub(c);
  toast('Article deleted','ok');
}

// Quick pin/unpin without opening edit modal (v6.10.55)
async function toggleArticlePin(articleId){
  const a = ARTICLES.find(x => x.id === articleId);
  if(!a) return;
  const next = !a.pinned;
  const prev = a.pinned;
  a.pinned = next;
  // Optimistic UI: re-sort + render so the pinned item floats to the top immediately
  ARTICLES.sort((x,y) => {
    if((!!x.pinned) !== (!!y.pinned)) return x.pinned ? -1 : 1;
    return (y.updated_at||'').localeCompare(x.updated_at||'');
  });
  const c = $('kh-content'); if(c) renderKnowledgeHub(c);
  try {
    if(typeof sbConfigured === 'function' && sbConfigured()){
      const res = await sbFetch(`/articles?id=eq.${encodeURIComponent(articleId)}`, {
        method:'PATCH', headers:{'Prefer':'return=minimal'}, body: JSON.stringify({pinned: next, updated_at: new Date().toISOString()})
      });
    }
  } catch(e) {
    a.pinned = prev;
    if(c) renderKnowledgeHub(c);
    toast('Pin save failed — reverted','err');
    return;
  }
  if(typeof sbAuditLog==='function') sbAuditLog('article_pin', 'knowledge', {article_id: articleId, pinned: next});
  toast(next ? `Pinned: ${a.title}` : `Unpinned: ${a.title}`, 'ok');
}
