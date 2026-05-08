/**
 * AccentOS Shell JS
 * Version: 1.0 — 2026-05-08
 *
 * Provides: shell behavior (nav, command launcher, right rail, ticker, sidebar collapse)
 * No framework. No build step. Vanilla JS.
 * Safe to include on any AccentOS page as an external script.
 */

(function () {
  'use strict';

  /* ── Command Launcher (Cmd/Ctrl+K) ─────────────────── */

  function openCommandLauncher() {
    const backdrop = document.querySelector('.aos-command-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('open');
    const input = backdrop.querySelector('.aos-command-input');
    if (input) { input.value = ''; input.focus(); }
  }

  function closeCommandLauncher() {
    const backdrop = document.querySelector('.aos-command-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  /* ── Right Rail Inspector ───────────────────────────── */

  function openRail(titleText, content) {
    const rail = document.querySelector('.aos-rail');
    if (!rail) return;
    const titleEl = rail.querySelector('.aos-rail-title');
    const body = rail.querySelector('.aos-rail-body');
    if (titleEl) titleEl.textContent = titleText || 'Details';
    if (body) body.innerHTML = content || '';
    rail.classList.add('open');
  }

  function closeRail() {
    const rail = document.querySelector('.aos-rail');
    if (rail) rail.classList.remove('open');
  }

  /* ── Sidebar Collapse Toggle ────────────────────────── */

  function toggleSidebar() {
    const sidebar = document.querySelector('.aos-sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    try { localStorage.setItem('aos-sidebar-collapsed', isCollapsed ? '1' : '0'); } catch (_) {}
  }

  function restoreSidebarState() {
    const sidebar = document.querySelector('.aos-sidebar');
    if (!sidebar) return;
    try {
      if (localStorage.getItem('aos-sidebar-collapsed') === '1') {
        sidebar.classList.add('collapsed');
      }
    } catch (_) {}
  }

  /* ── Nav Item Activation ────────────────────────────── */

  function activateNavItem(key) {
    document.querySelectorAll('.aos-nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.module === key);
    });
    document.querySelectorAll('.aos-bottom-nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.module === key);
    });
  }

  /* ── Ticker Auto-scroll ─────────────────────────────── */

  function initTicker() {
    const scroll = document.querySelector('.aos-ticker-scroll');
    if (!scroll) return;
    let offset = 0;
    const speed = 0.4;
    function animate() {
      offset += speed;
      const width = scroll.scrollWidth;
      if (offset >= width / 2) offset = 0;
      scroll.style.transform = 'translateX(-' + offset + 'px)';
      requestAnimationFrame(animate);
    }
    if (scroll.children.length > 0) requestAnimationFrame(animate);
  }

  /* ── FAB click ──────────────────────────────────────── */

  function initFab() {
    const fab = document.querySelector('.aos-fab');
    if (fab) fab.addEventListener('click', openCommandLauncher);
    const bottomFab = document.querySelector('.aos-bottom-bar-fab');
    if (bottomFab) bottomFab.addEventListener('click', openCommandLauncher);
  }

  /* ── Command launcher keyboard handling ─────────────── */

  function initCommandLauncher() {
    const backdrop = document.querySelector('.aos-command-backdrop');
    if (!backdrop) return;

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeCommandLauncher();
    });

    const input = backdrop.querySelector('.aos-command-input');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeCommandLauncher(); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const items = Array.from(backdrop.querySelectorAll('.aos-command-item'));
          const current = backdrop.querySelector('.aos-command-item.selected');
          const idx = items.indexOf(current);
          let next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
          next = Math.max(0, Math.min(next, items.length - 1));
          if (current) current.classList.remove('selected');
          if (items[next]) { items[next].classList.add('selected'); items[next].scrollIntoView({ block: 'nearest' }); }
        }
        if (e.key === 'Enter') {
          const selected = backdrop.querySelector('.aos-command-item.selected');
          if (selected) selected.click();
        }
      });

      input.addEventListener('input', function () {
        filterCommandItems(input.value.trim().toLowerCase());
      });
    }
  }

  function filterCommandItems(query) {
    const items = document.querySelectorAll('.aos-command-item');
    items.forEach(function (item) {
      const text = item.textContent.toLowerCase();
      item.style.display = (!query || text.includes(query)) ? '' : 'none';
    });
    const groups = document.querySelectorAll('.aos-command-group-label');
    groups.forEach(function (grp) {
      let sib = grp.nextElementSibling;
      let hasVisible = false;
      while (sib && !sib.classList.contains('aos-command-group-label')) {
        if (sib.classList.contains('aos-command-item') && sib.style.display !== 'none') hasVisible = true;
        sib = sib.nextElementSibling;
      }
      grp.style.display = hasVisible ? '' : 'none';
    });
  }

  /* ── Rail close button ──────────────────────────────── */

  function initRailClose() {
    document.querySelectorAll('[data-close-rail]').forEach(function (btn) {
      btn.addEventListener('click', closeRail);
    });
  }

  /* ── Card click → rail open ─────────────────────────── */

  function initCardClicks() {
    document.querySelectorAll('.aos-card[data-rail-title]').forEach(function (card) {
      card.addEventListener('click', function () {
        const title = card.dataset.railTitle || 'Details';
        const content = card.dataset.railContent || '<p style="color:var(--text-muted)">No details available.</p>';
        openRail(title, content);
        document.querySelectorAll('.aos-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
      });
    });
  }

  /* ── Nav item clicks ────────────────────────────────── */

  function initNavClicks() {
    document.querySelectorAll('.aos-nav-item[data-module], .aos-bottom-nav-item[data-module]').forEach(function (item) {
      item.addEventListener('click', function () {
        activateNavItem(item.dataset.module);
        const event = new CustomEvent('aos:navigate', { detail: { module: item.dataset.module } });
        document.dispatchEvent(event);
      });
    });
  }

  /* ── Sidebar toggle button ──────────────────────────── */

  function initSidebarToggle() {
    document.querySelectorAll('[data-toggle-sidebar]').forEach(function (btn) {
      btn.addEventListener('click', toggleSidebar);
    });
  }

  /* ── Global keyboard shortcuts ──────────────────────── */

  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const backdrop = document.querySelector('.aos-command-backdrop');
        if (backdrop && backdrop.classList.contains('open')) {
          closeCommandLauncher();
        } else {
          openCommandLauncher();
        }
      }
      if (e.key === 'Escape') {
        closeCommandLauncher();
        closeRail();
      }
    });
  }

  /* ── Init ───────────────────────────────────────────── */

  function init() {
    restoreSidebarState();
    initFab();
    initCommandLauncher();
    initRailClose();
    initCardClicks();
    initNavClicks();
    initSidebarToggle();
    initKeyboard();
    initTicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ─────────────────────────────────────── */

  window.AccentOS = window.AccentOS || {};
  window.AccentOS.shell = {
    openCommandLauncher: openCommandLauncher,
    closeCommandLauncher: closeCommandLauncher,
    openRail: openRail,
    closeRail: closeRail,
    activateNavItem: activateNavItem,
    toggleSidebar: toggleSidebar,
  };

})();
