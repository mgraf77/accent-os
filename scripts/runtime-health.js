/**
 * AccentOS Runtime Health Check
 * Run this in the browser console to verify application state.
 */
(function() {
  const checks = [
    { name: 'Auth State', check: () => typeof CU !== 'undefined' && CU !== null },
    { name: 'Supabase Config', check: () => typeof sbConfigured === 'function' && sbConfigured() },
    { name: 'Hydration Flag', check: () => window.__AOS_HYDRATED__ === true },
    { name: 'Vendor Data', check: () => Array.isArray(VD) && VD.length > 400 },
    { name: 'Quotes Data', check: () => Array.isArray(QUOTES) },
    { name: 'Worker Connectivity', check: () => window.__AOS_WORKER_VERSION__ !== 'unverified' && window.__AOS_WORKER_VERSION__ !== undefined },
    { name: 'Module Modes', check: () => typeof window.MODULE_MODES !== 'undefined' }
  ];

  console.group('%c AccentOS Health Check ', 'background: #ed1c24; color: #fff; font-weight: bold;');
  let passed = 0;
  checks.forEach(c => {
    try {
      const ok = c.check();
      console.log(`${ok ? '✅' : '❌'} ${c.name.padEnd(20)} ${ok ? 'PASS' : 'FAIL'}`);
      if (ok) passed++;
    } catch (e) {
      console.log(`❌ ${c.name.padEnd(20)} ERROR: ${e.message}`);
    }
  });
  console.log(`--- Result: ${passed}/${checks.length} checks passed ---`);
  console.groupEnd();
})();
