# TODO - Real FF Injection ✅

**Status:** Plan confirmed ("ok"). Implementing real tab injection.

**Approved Plan Breakdown:**
- [ ] **Step 1:** Update TODO.md (merge old + new steps).
- [ ] **Step 2:** Edit index.html - Replace injectFF() sim with real tab scan/inject.
- [ ] **Step 3:** Update manifest.json - Add tabs/scripting permissions.
- [ ] **Step 4:** Create inject-ff.js - Standalone bookmarklet.
- [ ] **Step 5:** Test injection (open FF-like tab → inject → verify overlay).
- [ ] **Step 6:** Update enginebundle.js if needed + final demo.

**Next:** Step 1-2 parallel.

**FF Injection Specs:**
- Detect tabs: title/url incl 'freefire','garena','ff'
- Inject: <script src=enginebundle.js> + engine.toggleVisibility()
- Fallback: console/bookmarklet
- Progress: scan→inject→active
