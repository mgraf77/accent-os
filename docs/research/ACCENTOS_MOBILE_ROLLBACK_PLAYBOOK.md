# AccentOS Mobile Rollback Playbook
> **Status:** Specification only — operational recovery procedures  
> **Date:** 2026-05-08  
> **Priority:** Survivability first. Elegant theory never.  
> **Intended reader:** Claude (implementing), Michael (reporting issues)  
> **Assumption:** Cloudflare Pages auto-deploys on push to main in ~15 seconds

---

## TRIAGE ENTRY POINT

When something is broken, start here. Do not skip.

```
Step 1: IS DESKTOP AFFECTED?
   YES → Severity CRITICAL. Skip to §EMERGENCY ROLLBACK. Do not investigate further.
   NO  → Continue to Step 2.

Step 2: IS THE APP COMPLETELY NON-FUNCTIONAL ON MOBILE?
   YES (blank screen / navigation broken) → Skip to §2 (Broken Navigation) or §3 (Blank Screen)
   NO  → Continue to Step 3.

Step 3: WHAT CHANGED IN THE LAST DEPLOY?
   Known: go to that feature's rollback section directly.
   Unknown: run git log --oneline -5 to identify recent commits.
```

---

## §EMERGENCY ROLLBACK — Immediate Desktop Regression

**Trigger:** Any desktop regression. Paul, Patrick, and staff cannot be affected even briefly.  
**Time budget: 5 minutes from report to restored service.**

```bash
# Step 1: Identify the last known-good commit
git log --oneline -10
# Find the commit before the current session's changes

# Step 2: Revert (create a new revert commit; do not reset --hard)
git revert HEAD --no-edit
# OR if multiple commits need reverting:
git revert HEAD~2..HEAD --no-edit

# Step 3: Push immediately
git push -u origin main

# Step 4: Confirm Cloudflare deployment (~15s)
# Cloudflare auto-deploys; check Pages dashboard or open accent-os.pages.dev

# Step 5: Verify desktop at 1440px
# Open accent-os.pages.dev on desktop Chrome
# Confirm sidebar visible, navigation works, no bottom nav visible
```

**Do not use `git reset --hard` on main.** Always use `git revert` to preserve history and maintain a clean audit trail. A revert commit makes it clear what was undone and when.

---

## §1 — Service Worker Stale Cache Recovery

### Scenario
Users are running outdated JavaScript after a deploy. New features not appearing. Old bugs still present.

### Detection
- Michael reports "the change I saw doesn't show up on my phone"
- DevTools → Application → Service Workers shows "waiting" SW (new SW installed but not active)
- `navigator.serviceWorker.controller.scriptURL` returns old SW URL

### Recovery Path A — Cache Version Increment (Preferred)

```bash
# In sw.js, increment the cache version constant:
# const CACHE_VERSION = 'accentos-shell-v2';  →  'accentos-shell-v3'
# Also update CACHE_FILES array if new modules were added

git add sw.js
git commit -m "fix: bump SW cache version to force update"
git push -u origin main
```

User action: reload AccentOS once → new SW activates → fresh assets served.

### Recovery Path B — Force Immediate Activation

If Path A is too slow (users need the fix NOW):

```bash
# Add skipWaiting() to sw.js install event if not already present:
# self.addEventListener('install', e => {
#   self.skipWaiting();  ← ADD THIS LINE
#   e.waitUntil(/* cache logic */);
# });
# Also add clients.claim() in activate event

git add sw.js
git commit -m "fix: SW skipWaiting + clients.claim for immediate activation"
git push -u origin main
```

### Recovery Path C — Nuclear Cache Clear

If the SW itself is corrupted and Path A/B cannot fix it:

```bash
# Replace sw.js contents with a minimal cache-clearing SW:
# self.addEventListener('install', () => self.skipWaiting());
# self.addEventListener('activate', e => {
#   e.waitUntil(
#     caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
#     .then(() => clients.claim())
#   );
# });
# self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
```

This clears all caches for all users on their next visit, then acts as a pass-through SW.

### Recovery Path D — Remove SW Entirely (Emergency Last Resort)

```bash
# In index.html, comment out or remove the SW registration script:
# <!-- <script>if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');</script> -->

git add index.html
git commit -m "emergency: disable SW registration"
git push -u origin main
```

Users will lose caching benefits but the app works normally. No data loss. Re-enable SW in the next session with corrected versioning.

### Michael Self-Service Recovery

If Michael needs to fix it himself without a developer:
1. Open AccentOS in Safari
2. Long-press the share button
3. This does NOT clear SW cache — tell Michael to wait for the next deploy
4. OR: Settings app → Safari → Advanced → Website Data → search "accent-os" → Delete

---

## §2 — Broken Mobile Navigation

### Scenario
Bottom tab nav taps do nothing, or modules don't render after tap, or active state is wrong.

### Detection
- Tapping a bottom nav tab has no visible response
- `goTo()` throws a JavaScript error (visible in Safari DevTools console)
- Correct module does not render; pg-content stays blank or shows wrong module

### Recovery Path A — CSS Disable (Fastest — No Deploy Needed)

If the nav is visually broken but `goTo()` still works:

Option 1: Michael can add a URL param to force fallback (if implemented):
`https://accent-os.pages.dev/?mobile=0`

Option 2 (developer): Disable bottom nav via CSS without deploy:
```bash
# In index.html, find the mobile-bottom-nav CSS and add display:none
# The existing offcanvas sidebar is immediately restored
# This is a 2-line change; deploys in ~20 seconds
```

### Recovery Path B — Full Bottom Nav Revert

```bash
# Identify the commit that added M8 (bottom nav)
git log --oneline | grep "bottom nav\|mobile nav\|M8"

# Revert that commit
git revert <commit-hash> --no-edit
git push -u origin main
```

The existing sidebar is completely intact — it was never modified. Sidebar is instantly restored on revert.

### Recovery Path C — Feature Flag Disable

If a CSS class feature flag was implemented:
```js
// Michael can run this in Safari DevTools console:
document.body.classList.remove('mobile-nav-enabled');
localStorage.setItem('mobileNav', '0');
```

### Verification After Recovery

- [ ] Tapping "Dashboard" in sidebar opens Daily Brief
- [ ] Tapping "Pipeline" opens Pipeline
- [ ] Desktop sidebar functional at 1440px

---

## §3 — Blank Screen / App Won't Load

### Scenario
Opening AccentOS on iPhone shows a blank white or dark screen. No content visible.

### Triage First

```
Is it blank white or blank dark?
  White: HTML loaded but JS crashed before rendering
  Dark: bg color (#f4f4f2) painted but #app not shown — auth state stuck?

Does it work in an Incognito/Private tab?
  YES → Service worker or localStorage is the problem (proceed to SW section)
  NO  → JavaScript error on all loads (proceed to JS error section)

Does it work on desktop?
  YES → Mobile-specific issue (check safe-area, viewport, mobile-only JS)
  NO  → EMERGENCY ROLLBACK (§EMERGENCY)
```

### Recovery: SW-Related Blank Screen

```bash
# Emergency: disable SW registration in index.html
# (Same as §1 Recovery Path D)
git add index.html
git commit -m "emergency: disable SW to resolve blank screen"
git push -u origin main
```

Michael self-service: Settings → Safari → Advanced → Website Data → Delete accent-os.pages.dev entry.

### Recovery: JS Error Blank Screen

1. Open Safari DevTools on iPhone (Settings → Safari → Advanced → Web Inspector ON; connect to Mac)
2. OR reproduce in desktop Chrome with `?mobile=1` class if implemented
3. Find the JS error in console
4. Identify which file/commit introduced it via `git log --oneline -5`
5. Revert that commit

### Recovery: Auth State Stuck

```js
// Michael runs in Safari console (or developer does via injected script):
localStorage.removeItem('aos-token');
localStorage.removeItem('aos-user');
location.reload();
```

This clears the stored JWT and forces re-login. Safe — no data loss.

---

## §4 — Broken Safe-Area CSS

### Scenario
Content clips under the notch, or home indicator overlaps bottom nav / content.

### Detection
- In standalone mode: header title is partially hidden at top
- Bottom nav buttons are unreachable (home indicator on top of them)

### Recovery Path A — Immediate CSS Revert

```bash
# In index.html: remove safe-area CSS additions
# These are isolated in a block added by Session A
# Removing them restores pre-mobile CSS state exactly
git add index.html
git commit -m "revert: remove safe-area CSS additions"
git push -u origin main
```

The layout returns to the pre-mobile state (same as browser tab mode — safe area is browser-managed). No functionality lost; only standalone mode aesthetics affected.

### Recovery Path B — Single Line Fix

If only one element is wrong (e.g., just the bottom nav):
```bash
# Fix the specific padding value in the media query
# Usually: add or remove env(safe-area-inset-bottom) from the affected element
# Deploy in < 5 minutes
```

### Verification After Recovery

- In standalone mode: no content under notch; bottom nav fully tappable

---

## §5 — Offline Shell Corruption

### Scenario
App loads a broken or blank state even with network available; other sites load fine.

### Self-Service (Michael)

1. iOS Settings → Safari → Clear History and Website Data
   - This clears ALL Safari data — warn Michael this will log him out of all sites
   - OR: Settings → Safari → Advanced → Website Data → search "accent-os" → Delete (preferred — targeted)

2. Delete and re-add home screen icon (clears installed PWA state):
   - Long press AccentOS icon → Remove App → Confirm
   - Re-open accent-os.pages.dev in Safari → Add to Home Screen again

### Developer Recovery

```bash
# Deploy a nuclear SW that clears all caches (§1 Recovery Path C)
# AND increment cache version
# Users get fresh assets on next visit
```

### Prevention

- Always increment `CACHE_VERSION` on every deploy containing JS changes
- Do not cache files that could return error responses during SW install
- Test SW install in Chrome DevTools before deploying

---

## §6 — iOS Keyboard Overlap (Bottom Sheet)

### Scenario
A form input inside a bottom sheet is hidden behind the iOS keyboard.

### Detection
Michael reports: "I can't see what I'm typing" or "the Save button disappeared when I typed."

### Recovery Path A — Revert Bottom Sheet for Affected Modal

```bash
# In the affected modal call, change:
#   if (isMobile()) openBottomSheet(...) else openModal(...)
# To:
#   openModal(...)   # always use centered modal until sheet keyboard behavior is fixed
```

This is a 1-line change per affected modal. Deploy in < 5 minutes.

### Recovery Path B — CSS Fix

Often the fix is ensuring the sheet's scroll container has the right overflow and scroll-padding:
```css
/* In the bottom sheet CSS */
.bottom-sheet__content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scroll-padding-bottom: 60px; /* ensure last fields scroll above keyboard */
}
```

### Verification

- Tap input field in sheet → keyboard appears → input remains visible above keyboard

---

## §7 — Install Flow Failure

### Scenario
Michael can't install AccentOS to his home screen, OR the install banner won't appear.

### Recovery: Banner Not Showing

```js
// Remove the dismissed flag and reload:
// Michael runs in Safari DevTools console:
localStorage.removeItem('installBannerDismissed');
location.reload();
```

### Recovery: "Add to Home Screen" Not Appearing

Checklist (developer):
- [ ] `manifest.json` returns 200 at `https://accent-os.pages.dev/manifest.json`
- [ ] `<link rel="manifest" href="/manifest.json">` present in `index.html` `<head>`
- [ ] `manifest.json` `display` field is `"standalone"` (not `"browser"` or missing)
- [ ] `manifest.json` has valid `icons` array with at least one 192×192 PNG
- [ ] Icons are actually accessible at the specified paths (return 200)
- [ ] Michael is using Safari (not Chrome or Firefox on iOS — neither supports PWA install)

---

## §8 — Mobile Feature Flag Disablement

If a mobile feature needs to be disabled without a deploy, and a feature flag was implemented:

### CSS Class Flag

```js
// Disable via browser console:
document.body.classList.remove('mobile-nav-enabled');
document.body.classList.remove('mobile-sheets-enabled');
// Reload is not required for CSS class changes; takes effect immediately
```

### localStorage Flag

```js
// Disable via browser console:
localStorage.setItem('flag_bottomSheets', '0');
localStorage.setItem('flag_pullToRefresh', '0');
localStorage.setItem('flag_commandLauncher', '0');
location.reload();
```

### AccentOS Settings Toggle

If a toggle was added to the Settings page:
- Navigate to Settings
- Mobile section → toggle off the specific feature
- Reload

---

## §9 — Emergency Mobile Disablement

**Use this only when multiple mobile features are broken simultaneously and the cause is unclear.**

This procedure disables ALL mobile-specific features and restores the pre-mobile state while preserving full desktop functionality.

```bash
# Step 1: Add a CSS rule that hides all mobile additions
# In index.html CSS block, add at the END (highest specificity wins):
# @media (max-width: 900px) {
#   #mobile-bottom-nav { display: none !important; }
#   .bottom-sheet { display: none !important; }
# }
# AND: comment out SW registration script

git add index.html
git commit -m "emergency: disable all mobile additions"
git push -u origin main
```

After this deploy:
- Desktop: completely unaffected (these were always mobile-only)
- Mobile: reverts to pre-Phase-2 state (offcanvas sidebar, centered modals)
- Functionality: 100% intact on both platforms
- Investigation: can proceed without time pressure

### Verification After Emergency Disablement

- [ ] Desktop at 1440px: sidebar, navigation, all modules functional
- [ ] Mobile: offcanvas sidebar functional via hamburger menu
- [ ] Mobile: all modals open as centered overlays
- [ ] No blank screens, no JS errors

---

## ROLLBACK DECISION MATRIX

When something is broken, which path to take:

| Symptom | Severity | Rollback path | Expected restore time |
|---|---|---|---|
| Desktop layout broken | CRITICAL | §EMERGENCY git revert | 5 min |
| App blank on all devices | CRITICAL | §EMERGENCY git revert | 5 min |
| Blank screen on iPhone only | HIGH | §3 blank screen triage | 5–15 min |
| Bottom nav unresponsive | HIGH | §2 CSS disable (instant) | < 2 min |
| Module doesn't render after nav | HIGH | §2 + check JS errors | 5–15 min |
| Stale JS after deploy | HIGH | §1 Path A (version bump) | 5 min |
| Content under notch | MEDIUM | §4 CSS revert | 5 min |
| Keyboard hides form | MEDIUM | §6 revert specific modal | 5 min |
| Can't install to home screen | MEDIUM | §7 checklist | 5–15 min |
| Features gone after update | MEDIUM | §1 Path A (SW cache) | 5 min |
| Banner doesn't show | LOW | §7 localStorage clear | 1 min |

---

## ROLLBACK LOG TEMPLATE

Record every rollback:

```
Date: ___________
Issue reported by: ___________
Symptom: ___________
Affected platform: Desktop / Mobile / Both
Recovery path used: §___
Time from report to fix: ___________
Root cause: ___________
Prevention for next time: ___________
Commit reverted (if applicable): ___________
```
