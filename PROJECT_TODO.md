Project TODO - ByteSurge
=======================

This file collects issues, improvements and low-risk change recommendations discovered while scanning the codebase. Items are grouped by priority and reference likely files/areas to change.

Checklist (user request):
- [x] Scan codebase for issues (JS, HTML, CSS, MD, assets)
- [x] Produce a TODO file listing fixes/changes/additions
- [ ] Offer follow-ups / create PRs for high-priority fixes (requires confirmation)

Notes on scope & assumptions
- I performed a high-level scan of the main app files (`index.html`, `js/game.js`, `js/firebase.js`, `js/settings.js`) plus a file list of the repository. I targeted high-impact and low-risk items. If you want a line-by-line review of every JS file, tell me and I will continue.
- Assumption: Keep current architecture (global window namespace & canvas rendering) — TODOs suggest incremental improvements to avoid large refactors.

High priority (bugs / correctness)
--------------------------------
- game.js: Incorrect GAME_WIDTH / GAME_HEIGHT set at end of file
  - Problem: at end of `js/game.js` the code sets `window.GAME_WIDTH = canvas.width` and `window.GAME_HEIGHT = canvas.height`. Earlier `setupCanvas()` sets GAME_WIDTH/HEIGHT to logical base dimensions (1200x800). Overwriting with physical pixel size (width*dpr) breaks placement, bounds, UI and hit-testing.
  - Files: `js/game.js`
  - Fix: remove or change final assignment to use the logical base sizes (e.g. window.GAME_WIDTH = baseWidth, window.GAME_HEIGHT = baseHeight) or store device pixel size separately (window.CANVAS_PIXEL_WIDTH).

- game.js: Duplicate 'mousemove' listener and other duplicated event registrations
  - Problem: `canvas.addEventListener('mousemove', ...)` appears multiple times with slightly different logic. Duplicate listeners cause redundant work and possible conflicts.
  - Files: `js/game.js`
  - Fix: Consolidate mousemove handlers into one, dispatch to subsystems (homeScreen, upgradeMenuUI, settingsMenuUI) to avoid duplicated calculations.

- game.js: Use of ctx.roundRect / other non-widely-supported Canvas APIs without fallbacks
  - Problem: `ctx.roundRect(...)` is used in rendering but isn't supported in older browsers. This may throw and break rendering for some users.
  - Files: `js/game.js` (renderUI, renderInputIndicators, etc.)
  - Fix: Add small helper that draws rounded rects when roundRect is not available, e.g. ctx.roundRect = ctx.roundRect || function(...) { /* path code */ }.

- game.js: Multiple places call window.* functions/objects without safe guards
  - Problem: code often assumes subsystems like `window.upgradeMenuUI`, `window.tutorialSystem`, `window.corruptionSystem`, `window.EnergyNodeSystem` exist. Accessing their methods without proper checks can throw if subsystem not loaded in some builds.
  - Files: `js/game.js` and other modules
  - Fix: Use optional chaining or explicit checks (e.g. if (window.upgradeMenuUI?.update) window.upgradeMenuUI.update(deltaTime)). Add small helper `safeCall(obj, method, ...args)` if helpful.

Medium priority (stability / UX / security)
-----------------------------------------
- firebase.js: Firebase API keys and config in repo
  - Problem: the firebase config object is checked in `js/firebase.js`. While Firebase API keys are normally public, check your project security rules. If this is a shared demo project, consider replacing with environment-driven config or document how to rotate keys.
  - Files: `js/firebase.js`
  - Fix: Document the implications in README, or move sensitive configuration to a separate config file not committed to source, and add example `.env.sample` or `firebase.config.example.js`.

- firebase.js: Auto-save interval uses window.gameRunning which may not be initialized yet
  - Problem: setInterval that calls `cloudSaveSystem.autoSave()` runs immediately when `firebase.js` loads; it checks `isSignedIn && window.gameRunning && navigator.onLine`. If the page hasn't set `window.gameRunning` yet (or if it's undefined) this is likely fine but better to gate auto-save start until firebaseSystem.init completes.
  - Files: `js/firebase.js`
  - Fix: Start auto-save after firebaseSystem.init() returns true and app finished initialization (or check for `typeof window.gameRunning === 'boolean'` before starting interval).

- index.html: meta viewport set to width=800 (nonstandard) and fixed canvas size
  - Problem: `<meta name=