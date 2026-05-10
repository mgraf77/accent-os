// ── SHELL UTILS (extracted from index.html at v6.11.1) ──
// ── UTILS ─────────────────────────────────────────────────
const $=id=>document.getElementById(id);
const qsa=s=>document.querySelectorAll(s);
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function v(id,prop='value'){return $(id)?.[prop]?.trim()??'';}
// CSV utilities — RFC 4180 quoting (only quote when value contains comma, quote, or newline; double embedded quotes).
function csvStringify(rows){
  return rows.map(r => r.map(c => {
    const s = c==null ? '' : String(c);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(',')).join('\n');
}
function csvDownload(rows, filename){
  if(!rows || !rows.length){ toast('Nothing to export','err'); return 0; }
  const csv = csvStringify(rows);
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  return rows.length - 1;   // data row count (excludes header)
}
// v6.10.57 — toast dedup: identical messages within 2.5s collapse to a count badge
const _toastRecent = new Map();   // msg|type → {el, count, badge, timer}
function toast(msg,type=''){
  const key = msg + '|' + type;
  const existing = _toastRecent.get(key);
  if(existing && existing.el && existing.el.isConnected){
    existing.count++;
    if(!existing.badge){
      existing.badge = document.createElement('span');
      existing.badge.style.cssText = 'display:inline-block;margin-left:8px;padding:1px 8px;border-radius:10px;background:rgba(255,255,255,0.25);font-size:11px;font-weight:600;';
      existing.el.appendChild(existing.badge);
    }
    existing.badge.textContent = '×' + existing.count;
    clearTimeout(existing.timer);
    existing.timer = setTimeout(()=>{ existing.el.remove(); _toastRecent.delete(key); }, 3200);
    return;
  }
  const el=document.createElement('div');
  el.className='toast'+(type?' '+type:'');
  el.textContent=msg;
  $('toasts').appendChild(el);
  const entry = { el, count: 1, badge: null, timer: null };
  entry.timer = setTimeout(()=>{ el.remove(); _toastRecent.delete(key); }, 3200);
  _toastRecent.set(key, entry);
}
function openModal(title,body,foot=''){
  $('m-title').textContent=title;
  $('m-body').innerHTML=body;
  $('m-foot').innerHTML=foot;
  $('overlay').classList.add('on');
}
function closeModal(e){ if(!e||e.target===$('overlay')) $('overlay').classList.remove('on'); }
