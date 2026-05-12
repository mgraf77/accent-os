# Module Registry Evolution Plan - AccentOS

## Current Architecture
The navigation and rollout gating are handled via hardcoded maps in `index.html`:
- `PAGE_META`: Titles and subtitles.
- `goTo()` dispatcher: `const pages = { ... }` maps keys to functions.
- `module_modes.json`: State gating.

## Objectives
- Remove the redundant `pages` map in `goTo`.
- Allow modules to register themselves at runtime.
- Centralize metadata for navigation, gating, and hydration.

## Proposed Evolution Stages

### Stage 1: Declarative `MODULE_REGISTRY`
Move all metadata into a single global array defined in the shell:
```javascript
window.MODULE_REGISTRY = [
  {
    key: 'customers',
    title: 'Customers',
    sub: 'CRM · RFM · Lifecycle',
    roles: ['Owner','Admin','Manager','Sales'],
    hydrate: 'sbLoadCustomers',
    render: 'customers'
  },
  // ...
];
```

### Stage 2: Self-Registering Modules
Update `goTo` to iterate over `MODULE_REGISTRY`. Modules in external files can then register themselves if they aren't pre-defined:
```javascript
// in js/customers.js
registerModule({ key: 'customers', ... });
```

### Stage 3: Unified Shell Dispatch
Refactor `goTo` to be a pure router:
```javascript
function goTo(pageKey) {
  const mod = window.MODULE_REGISTRY.find(m => m.key === pageKey);
  if (!mod || !canSeeModule(pageKey)) return;
  // ... clear content ...
  window[mod.render]($('pg-content'), $('pg-actions'));
}
```

## Migration Risks
1. **Startup Race:** If a module is accessed via deep link or `goTo` before its script has registered, it will fail.
2. **Naming Drift:** Keys in `module_modes.json` must match registry keys exactly.

## Verification Requirements
- [ ] Verify sidebar badges (🚧 / 🧪) still appear correctly.
- [ ] Verify role-based gating works for the Management Dashboard.
- [ ] Verify `goTo` handles unknown modules gracefully.
