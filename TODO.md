# TODO - Aim Assist ✅ (Replaced px trava/lock)

**Status:** Plan approved. Implementing step-by-step.

**Implementation Steps:**
- [x] **Step 1:** Edit `engine.js`: Remove trava/lock (`controlVelocity`, `travaPixels`), add aim assist (targets array, `getClosestTarget`, `computeAimAssist`, update `updateTouch`/`loop`).
- [ ] **Step 2:** Test `engine.js` changes (open index.html, check smooth assist to multiple targets, fix any errors).
- [x] **Step 3:** Update `enginebundle.js` (minify engine.js for bundle).
- [x] **Step 4:** Edit `index.html` (UI labels to \"Aim Assist\", status updates).
- [ ] **Step 5:** Final test + update TODO (mark complete).
- [ ] **Demo:** Run `npx live-server .` or open index.html.

**Aim Assist Specs:**
- 4 targets (random move/respawn).
- Strength: 0.4, Speed: 0.12, FOV: 150px.
- Toggle: aimStability enables.

Next: Step 1.
