// ════════════════════════════════════════════════════════════════════════════
// js/rag.js — AccentOS OS-RAG client (skill: accent-rag)
// Hybrid retrieval (Supabase pgvector + tsvector RRF) → Claude Haiku rerank
// → context assembly → Claude Sonnet generation. Wired into Ask-the-Engine.
// Spec: skills/accent-rag/SKILL.md
// SQL:  sql/M42_rag_pgvector.sql
// ────────────────────────────────────────────────────────────────────────────

// ── Config helpers ──────────────────────────────────────────────────────────
function ragWorkerUrl(){ return (sessionStorage.getItem('aos-rag-worker') || '').replace(/\/+$/,''); }
function ragWorkerSecret(){ return sessionStorage.getItem('aos-rag-secret') || ''; }
function ragApiKey(){ return getS('aos-api') || ''; }
function ragConfigured(){
  return !!ragWorkerUrl() && !!ragWorkerSecret() && typeof sbConfigured === 'function' && sbConfigured();
}

// ── Tunables ────────────────────────────────────────────────────────────────
const RAG = {
  EMBED_MODEL_DIM: 768,
  RETRIEVE_K: 20,            // initial hybrid hits
  RERANK_K: 6,               // post-rerank slice fed into the LLM
  CHUNK_TARGET_TOKENS: 320,  // ~ 200-400 sweet spot for bge-base
  CHUNK_OVERLAP_TOKENS: 50,
  RERANK_MODEL: 'claude-haiku-4-5-20251001',
  ANSWER_MODEL: 'claude-sonnet-4-20250514',
  CONTEXTUALIZE_MODEL: 'claude-haiku-4-5-20251001',
  MAX_INGEST_DOC_TOKENS: 12000,    // truncate huge docs before contextualizing
  MAX_RERANK_BODY_CHARS: 1200,     // truncate chunk body sent to reranker
  RRF_FT_WEIGHT: 1.0,
  RRF_SEM_WEIGHT: 1.0,
  RRF_K: 50
};

// ── Embedding ───────────────────────────────────────────────────────────────
async function ragEmbed(texts){
  if(!Array.isArray(texts)) texts = [texts];
  if(!texts.length) return [];
  const url = ragWorkerUrl();
  const secret = ragWorkerSecret();
  if(!url || !secret) throw new Error('RAG worker not configured (Settings → RAG)');
  const r = await fetch(url + '/embed', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret},
    body: JSON.stringify({texts})
  });
  if(!r.ok){
    const t = await r.text();
    throw new Error(`RAG worker ${r.status}: ${t}`);
  }
  const data = await r.json();
  if(!data?.vectors) throw new Error('RAG worker: no vectors in response');
  return data.vectors;
}

// ── Hybrid search RPC ───────────────────────────────────────────────────────
async function ragHybridSearch(query, embedding, opts={}){
  const k = opts.k ?? RAG.RETRIEVE_K;
  const sourceTypes = opts.sourceTypes && opts.sourceTypes.length ? opts.sourceTypes : null;
  const requiredRoles = opts.requiredRoles || (CU?.role ? [CU.role] : null);
  const body = {
    query_text: query,
    query_embedding: embedding,
    match_count: k,
    full_text_weight: opts.ftWeight ?? RAG.RRF_FT_WEIGHT,
    semantic_weight: opts.semWeight ?? RAG.RRF_SEM_WEIGHT,
    rrf_k: RAG.RRF_K,
    source_types: sourceTypes,
    required_roles: requiredRoles
  };
  // Supabase RPC endpoint: POST /rest/v1/rpc/<fn_name>
  const rows = await sbFetch('/rpc/rag_hybrid_search', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return Array.isArray(rows) ? rows : [];
}

// ── Reranker (Claude Haiku, one call, JSON output) ─────────────────────────
async function ragRerank(query, hits, k=RAG.RERANK_K){
  const key = ragApiKey();
  if(!key) return hits.slice(0, k);   // graceful degrade — keep RRF order
  if(!hits.length) return [];

  const truncBody = (s) => {
    const t = (s || '').slice(0, RAG.MAX_RERANK_BODY_CHARS);
    return t.length < (s || '').length ? t + '…' : t;
  };

  const lines = hits.map((h, i) =>
    `[${i}] ${h.title || h.source_type}::${h.source_id || ''}\n${truncBody(h.context ? (h.context + ' ' + h.body) : h.body)}`
  ).join('\n\n');

  const sys = "You score chunks for retrieval relevance to a user query. Return ONLY a JSON array of {i, s} where i is the index and s is 0-10 (higher = more relevant). No prose.";
  const user = `Query: ${query}\n\nChunks:\n${lines}\n\nReturn JSON array of length ${hits.length}.`;

  try{
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': key,
        'anthropic-version':'2023-06-01'
      },
      body: JSON.stringify({
        model: RAG.RERANK_MODEL,
        max_tokens: 600,
        system: sys,
        messages: [{role:'user', content:user}]
      })
    });
    const data = await r.json();
    const txt = data?.content?.[0]?.text || '[]';
    const m = txt.match(/\[[\s\S]*\]/);
    const arr = m ? JSON.parse(m[0]) : [];
    const scoreById = new Map();
    arr.forEach(o => { if(typeof o?.i === 'number') scoreById.set(o.i, +o.s || 0); });
    const ranked = hits.map((h,i)=>({h, score: scoreById.get(i) ?? 0}));
    ranked.sort((a,b)=>b.score-a.score);
    return ranked.slice(0, k).map(r => Object.assign({}, r.h, {rerank_score: r.score}));
  }catch(e){
    console.warn('[rag] rerank failed, falling back to RRF order', e.message);
    return hits.slice(0, k);
  }
}

// ── Public: ragSearch ───────────────────────────────────────────────────────
async function ragSearch(query, opts={}){
  if(!ragConfigured()) throw new Error('RAG not configured');
  if(!query || !query.trim()) return [];
  const [emb] = await ragEmbed([query]);
  const hits = await ragHybridSearch(query, emb, {k: opts.k ?? RAG.RETRIEVE_K, sourceTypes: opts.sourceTypes});
  if(!hits.length) return [];
  if(opts.rerank === false) return hits.slice(0, opts.topK ?? RAG.RERANK_K);
  return await ragRerank(query, hits, opts.topK ?? RAG.RERANK_K);
}

// ── Public: ragAnswer (full pipeline) ───────────────────────────────────────
async function ragAnswer(question, opts={}){
  const sources = await ragSearch(question, opts);
  const key = ragApiKey();
  if(!key) throw new Error('Anthropic API key required for ragAnswer');

  const ctxBlock = _ragAssembleContext(sources);
  const sys = (opts.system || RAG_DEFAULT_SYSTEM) + (ctxBlock ? `\n\n<retrieved>\n${ctxBlock}\n</retrieved>\n\nGround your answer in the retrieved context above. If the retrieved context does not contain the answer, say so plainly. Cite sources inline like [source_type:source_id].` : '');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
    body: JSON.stringify({
      model: RAG.ANSWER_MODEL,
      max_tokens: opts.max_tokens ?? 800,
      system: sys,
      messages: [{role:'user', content: question}]
    })
  });
  const data = await r.json();
  const text = data?.content?.[0]?.text || 'Unable to respond.';
  return {answer: text, sources, usage: data?.usage || null};
}

const RAG_DEFAULT_SYSTEM = "You are the AccentOS Knowledge Engine for Accent Lighting Inc. — Wichita, KS lighting distributor. Answer concisely, practically, with specifics drawn from the retrieved context.";

function _ragAssembleContext(sources){
  if(!sources || !sources.length) return '';
  return sources.map((s, i) => {
    const tag = `${s.source_type}:${s.source_id||s.id?.slice(0,8)||'src'}`;
    const ctx = s.context ? `(${s.context.trim()}) ` : '';
    return `[${i+1}] (${tag}) ${ctx}${(s.body||'').slice(0,1400)}`;
  }).join('\n\n');
}

// ── Chunking + contextualization (ingest path) ──────────────────────────────
function _approxTokens(s){ return Math.max(1, Math.ceil((s||'').length/4)); }

function _chunkText(text, targetTokens=RAG.CHUNK_TARGET_TOKENS, overlapTokens=RAG.CHUNK_OVERLAP_TOKENS){
  if(!text) return [];
  const targetChars = targetTokens * 4;
  const overlapChars = overlapTokens * 4;
  if(text.length <= targetChars) return [text];
  // Prefer paragraph boundaries
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let buf = '';
  for(const p of paras){
    if((buf + '\n\n' + p).length <= targetChars){
      buf = buf ? (buf + '\n\n' + p) : p;
    } else {
      if(buf) chunks.push(buf);
      // Para itself larger than target → slide
      if(p.length > targetChars){
        let i = 0;
        while(i < p.length){
          const end = Math.min(p.length, i + targetChars);
          chunks.push(p.slice(i, end));
          if(end === p.length) break;
          i = end - overlapChars;
          if(i < 0) i = 0;
        }
        buf = '';
      } else {
        buf = p;
      }
    }
  }
  if(buf) chunks.push(buf);
  // Add overlap by re-prepending the tail of previous chunk
  for(let i=1;i<chunks.length;i++){
    const tail = chunks[i-1].slice(-overlapChars);
    chunks[i] = tail + '\n\n' + chunks[i];
  }
  return chunks;
}

async function _ragGenerateContext(docTitle, docBody, chunkBody){
  const key = ragApiKey();
  if(!key) {
    // No LLM contextualization possible; fall back to a deterministic prefix.
    return `From ${docTitle}: ${chunkBody.split('\n')[0].slice(0,160)}`;
  }
  // Truncate the doc to keep cost down on huge docs.
  const truncDoc = docBody.length > RAG.MAX_INGEST_DOC_TOKENS*4
    ? docBody.slice(0, RAG.MAX_INGEST_DOC_TOKENS*4) + '\n…(truncated)'
    : docBody;
  try{
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
      body: JSON.stringify({
        model: RAG.CONTEXTUALIZE_MODEL,
        max_tokens: 100,
        system: "You write a single-sentence neutral context prefix so a chunk can be retrieved standalone. Format: \"From <doc title>, in <section>: <topic>.\" Be specific. No quotes, no preamble.",
        messages: [{role:'user', content:
          `<document title="${docTitle}">\n${truncDoc}\n</document>\n\n<chunk>\n${chunkBody}\n</chunk>\n\nWrite the context prefix:`}]
      })
    });
    const data = await r.json();
    const text = (data?.content?.[0]?.text || '').trim().split('\n')[0].slice(0, 240);
    return text || `From ${docTitle}: ${chunkBody.split('\n')[0].slice(0,160)}`;
  }catch(e){
    console.warn('[rag] contextualize failed', e.message);
    return `From ${docTitle}: ${chunkBody.split('\n')[0].slice(0,160)}`;
  }
}

async function _sha256Hex(s){
  if(!crypto?.subtle) return null;
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ── Public: ragIngestText ──────────────────────────────────────────────────
//   item: { source_type, source_id, title, body, source_url?, metadata?, visible_to_roles?, pinned? }
async function ragIngestText(item){
  if(!ragConfigured()) throw new Error('RAG not configured');
  if(!item?.body) throw new Error('ragIngestText: body required');
  if(!item?.source_type) throw new Error('ragIngestText: source_type required');

  const chunks = _chunkText(item.body);
  // 1) generate context for each chunk
  const contexts = [];
  for(const ch of chunks){
    contexts.push(await _ragGenerateContext(item.title || item.source_id || item.source_type, item.body, ch));
  }
  // 2) embed chunks (context + body)
  const texts = chunks.map((ch, i) => (contexts[i] + ' ' + ch).slice(0, 7800));
  const vectors = await ragEmbed(texts);

  // 3) Insert one row per chunk, dedup by body_hash
  const rows = [];
  for(let i=0;i<chunks.length;i++){
    const body_hash = await _sha256Hex(chunks[i]);
    rows.push({
      source_type: item.source_type,
      source_id: item.source_id || null,
      source_url: item.source_url || null,
      title: item.title || null,
      body: chunks[i],
      context: contexts[i],
      embedding: vectors[i],
      metadata: item.metadata || {},
      visible_to_roles: item.visible_to_roles || ['Owner','Admin','Manager','Sales','Warehouse'],
      pinned: !!item.pinned,
      chunk_index: i,
      total_chunks: chunks.length,
      body_hash
    });
  }

  // 4) Delete existing rows for (source_type, source_id) to allow safe re-ingest, then insert
  if(item.source_id){
    try{
      await sbFetch(`/rag_chunks?source_type=eq.${encodeURIComponent(item.source_type)}&source_id=eq.${encodeURIComponent(item.source_id)}`, {
        method:'DELETE',
        headers:{'Prefer':'return=minimal'}
      });
    }catch(e){ /* ignore — table may not have any rows yet */ }
  }
  // Bulk insert
  const ins = await sbFetch('/rag_chunks', {
    method:'POST',
    headers:{'Prefer':'return=minimal'},
    body: JSON.stringify(rows)
  });
  return {ok:true, n_chunks: rows.length};
}

// ── Public: ragIngestArticle (Internal Doc) ────────────────────────────────
async function ragIngestArticle(article){
  if(!article?.body) return false;
  return ragIngestText({
    source_type: 'article',
    source_id: article.slug || article.id,
    title: article.title || article.slug,
    body: article.body,
    metadata: {
      tags: article.tags || [],
      category: article.category || 'reference',
      related_vendor_id: article.related_vendor_id || null,
      pinned: !!article.pinned
    },
    visible_to_roles: article.visible_to_roles || ['Owner','Admin','Manager','Sales','Warehouse'],
    pinned: !!article.pinned
  });
}

// ── Public: ragSeed (one-shot) ──────────────────────────────────────────────
//   Loads /skills/accent-rag/ingest-corpus/seed.json from the deployed origin
//   and ingests every entry. Idempotent (re-ingest deletes by source_id first).
async function ragSeed(opts={}){
  if(!ragConfigured()) throw new Error('RAG not configured (Settings → RAG)');
  const url = opts.url || '/skills/accent-rag/ingest-corpus/seed.json';
  const r = await fetch(url, {cache:'no-cache'});
  if(!r.ok) throw new Error('Could not load seed.json: '+r.status);
  const items = await r.json();
  if(!Array.isArray(items)) throw new Error('seed.json must be a JSON array');
  const results = [];
  for(const it of items){
    try{
      const out = await ragIngestText(it);
      results.push({source_id: it.source_id, ok:true, n: out.n_chunks});
      if(typeof toast === 'function') toast(`RAG · ingested ${it.source_id} (${out.n_chunks} chunks)`, 'ok');
    }catch(e){
      results.push({source_id: it.source_id, ok:false, error: e.message});
      console.warn('[rag] seed item failed', it.source_id, e);
    }
  }
  return results;
}

// ── Public: ragHealth ───────────────────────────────────────────────────────
async function ragHealth(){
  const out = {worker:false, supabase:false, table:false, model:null, count:null, error:null};
  // Worker
  try{
    if(ragWorkerUrl()){
      const r = await fetch(ragWorkerUrl()+'/health');
      if(r.ok){ const d = await r.json(); out.worker = !!d.ok; out.model = d.model; }
    }
  }catch(e){ out.error = 'worker: '+e.message; }
  // Supabase rag_chunks count
  try{
    const r = await sbFetch('/rag_chunks?select=id&limit=1');
    out.supabase = true;
    out.table = Array.isArray(r);
    // count
    const c = await sbFetch('/rag_chunks?select=count', {headers:{'Prefer':'count=exact'}});
    out.count = Array.isArray(c) ? c.length : null;
  }catch(e){ out.error = (out.error?out.error+' · ':'') + 'supabase: '+e.message; }
  return out;
}

// ── Auto-attach: extend Internal Doc save to also re-ingest into RAG ────────
//   Wraps sbSaveArticle (defined in js/knowledge_hub.js) when RAG is configured.
//   Triggers async ingest after a successful save. Failure is non-blocking.
(function wireArticleAutoIngest(){
  if(typeof window === 'undefined') return;
  const tryWire = () => {
    if(typeof sbSaveArticle !== 'function') return false;
    if(window._ragArticleWired) return true;
    window._ragArticleWired = true;
    const orig = sbSaveArticle;
    window.sbSaveArticle = async function(rec){
      const res = await orig(rec);
      if(res && ragConfigured()){
        // ingest in background — don't block save UI
        ragIngestArticle(Object.assign({}, rec, res === true ? {} : res))
          .then(r => console.log('[rag] auto-ingested article', rec.slug, r))
          .catch(e => console.warn('[rag] auto-ingest article failed', e.message));
      }
      return res;
    };
    return true;
  };
  if(!tryWire()){
    // Try again after DOM loads (knowledge_hub.js loads after rag.js? both external)
    document.addEventListener('DOMContentLoaded', () => { setTimeout(tryWire, 100); });
  }
})();

// Expose to global so console + Ask-the-Engine can call freely
window.ragConfigured = ragConfigured;
window.ragSearch = ragSearch;
window.ragAnswer = ragAnswer;
window.ragEmbed = ragEmbed;
window.ragIngestText = ragIngestText;
window.ragIngestArticle = ragIngestArticle;
window.ragSeed = ragSeed;
window.ragHealth = ragHealth;
window.RAG = RAG;
