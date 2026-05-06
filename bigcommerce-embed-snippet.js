// ── AccentOS Employee Widget — BigCommerce Script Manager ─────────────────────
// Paste this into BigCommerce → Storefront → Script Manager.
// Placement: Footer. Pages: All pages.
// Visibility: Optionally use "Customers only" after enabling customer accounts.
//
// What it does: adds a floating "A" button in the bottom-right corner of every
// page on accentlightinginc.com. Click opens the AccentOS Employee Tools widget
// in an overlay. Non-employees see a login screen (magic link via Supabase).
//
// BEFORE deploying: replace EMBED_URL with the actual Cloudflare Pages URL.
// ─────────────────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  var EMBED_URL = 'https://accentos.pages.dev/embed.html'; // ← update with real URL

  // Don't double-inject
  if(document.getElementById('aos-widget-btn')) return;

  // Floating button
  var btn = document.createElement('div');
  btn.id = 'aos-widget-btn';
  btn.title = 'AccentOS Employee Tools';
  btn.setAttribute('aria-label', 'AccentOS Employee Tools');
  btn.style.cssText = [
    'position:fixed','bottom:20px','right:20px','z-index:2147483647',
    'width:44px','height:44px','border-radius:50%',
    'background:#e65100','color:#fff',
    'display:flex','align-items:center','justify-content:center',
    'font-family:system-ui,sans-serif','font-weight:900','font-size:17px',
    'cursor:pointer','user-select:none',
    'box-shadow:0 4px 16px rgba(0,0,0,.25)',
    'transition:transform .15s,box-shadow .15s',
  ].join(';');
  btn.textContent = 'A';
  btn.addEventListener('mouseenter', function(){ btn.style.transform='scale(1.08)'; btn.style.boxShadow='0 6px 20px rgba(0,0,0,.3)'; });
  btn.addEventListener('mouseleave', function(){ btn.style.transform=''; btn.style.boxShadow='0 4px 16px rgba(0,0,0,.25)'; });

  // Widget iframe panel
  var panel = null;

  function openPanel(){
    if(panel){ panel.remove(); panel=null; btn.textContent='A'; return; }
    panel = document.createElement('iframe');
    panel.id = 'aos-widget-panel';
    panel.src = EMBED_URL;
    panel.allow = 'clipboard-write';
    panel.style.cssText = [
      'position:fixed','bottom:74px','right:20px','z-index:2147483646',
      'width:380px','height:560px',
      'border:none','border-radius:12px',
      'box-shadow:0 8px 40px rgba(0,0,0,.22)',
      'opacity:0','transform:translateY(8px)',
      'transition:opacity .2s,transform .2s',
    ].join(';');
    document.body.appendChild(panel);
    // Animate in
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        panel.style.opacity='1';
        panel.style.transform='translateY(0)';
      });
    });
    btn.textContent = '✕';

    // Close on outside click
    function onOutsideClick(e){
      if(panel && !panel.contains(e.target) && e.target !== btn){
        panel.remove(); panel=null; btn.textContent='A';
        document.removeEventListener('click', onOutsideClick, true);
      }
    }
    setTimeout(function(){ document.addEventListener('click', onOutsideClick, true); }, 100);
  }

  btn.addEventListener('click', openPanel);
  document.body.appendChild(btn);

  // Keyboard shortcut: Ctrl+Shift+A
  document.addEventListener('keydown', function(e){
    if(e.ctrlKey && e.shiftKey && (e.key==='A'||e.key==='a')){ e.preventDefault(); openPanel(); }
  });

})();
