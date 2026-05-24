# Domain Pitfalls

**Domain:** macOS Batch Rename Tool
**Researched:** 2026-05-13
**Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause data loss, file overwrites, or complete failure of the core workflow.

### Pitfall 1: No Duplicate Filename Detection

**What goes wrong:** When a rename pattern produces identical names for two or more files, one file silently overwrites the other. Data loss occurs with no warning.

**Why it happens:** Many tools calculate new filenames sequentially without checking for collisions against other files in the batch or existing files in the directory.

**Consequences:**

- Permanent data loss from file overwrites
- User loses trust in the tool
- No recovery possible unless user has backups

**Prevention:**

1. **Real-time conflict detection** — Calculate all output filenames before any rename begins. Flag conflicts in the preview with visible warnings.
2. **Check against existing files** — Verify new filenames don't match files outside the current batch that already exist in the directory.
3. **Case-insensitive comparison** — macOS APFS is case-insensitive by default. "Photo.jpg" and "photo.jpg" conflict.

**Detection:**

- Preview shows warning icons on conflicting files
- Rename button disabled or blocked when conflicts exist
- Conflict count displayed in toolbar

**Phase:** Core Feature Implementation (Phase 1-2)

---

### Pitfall 2: Rename Order Collisions

**What goes wrong:** When renaming "1.jpg → 2.jpg" and "2.jpg → 3.jpg" simultaneously, the intermediate state causes conflicts. If file 1 renames first, it overwrites the existing "2.jpg".

**Why it happens:** Processing files in naive alphabetical order without considering that new names may match current names of other files in the batch.

**Consequences:**

- Partial rename completion with data loss
- Unpredictable which files succeed and which fail
- User cannot predict outcome before clicking rename

**Prevention:**

1. **Two-pass rename strategy** — First pass: rename all files to temporary unique names (e.g., prefix with UUID). Second pass: rename temp names to final names.
2. **Reverse processing order** — Process files from highest new name to lowest (rename 9→10 first, then 8→9). This prevents intermediate collisions.
3. **Dependency graph analysis** — Build a directed graph of rename dependencies and process in topologically sorted order.

**Detection:**

- Tool warns when new names overlap with current names of other files in batch
- Preview highlights files that would cause order-based conflicts

**Phase:** Core Feature Implementation (Phase 2)

---

### Pitfall 3: App Sandbox Permission Model

**What goes wrong:** macOS App Sandbox grants access to dragged files but not their parent folder. Renaming requires parent folder write access, so drag-and-drop workflows fail silently or with cryptic errors.

**Why it happens:** File name is stored in the directory metadata, not the file itself. Sandbox gives file access but not directory modification rights.

**Consequences:**

- User drags files into app, clicks rename, nothing happens
- "Permission denied" errors without clear explanation
- Tool appears broken to users

**Prevention:**

1. **Use NSOpenPanel for directory access** — When user adds files via drag-drop, prompt them to also confirm parent folder access via NSOpenPanel.
2. **Security-scoped bookmarks** — Store bookmark data for parent directories to retain access across app restarts.
3. **Clear permission guidance** — If full disk access needed, explain why and guide user to System Settings.

**Detection:**

- Test drag-drop workflow with sandboxed build
- Verify rename works on files from different directories

**Phase:** Implementation (Phase 2)

---

### Pitfall 4: Missing Undo Functionality

**What goes wrong:** Users make mistakes (wrong regex pattern, wrong numbering start) and cannot revert the changes. Batch rename is inherently high-risk because it affects many files at once.

**Why it happens:** Undo is complex to implement — need to store original names, handle partial failures, and support multiple undo levels.

**Consequences:**

- Users are afraid to use the tool
- Single mistake can corrupt hundreds of filenames
- No recovery from typos in patterns

**Prevention:**

1. **Store rename history** — Record (original_path, new_path) for every file renamed.
2. **Support multiple undo levels** — Allow reverting the last N operations, not just the most recent.
3. **Handle partial failures** — If undo fails for some files, continue with others and report results.
4. **Persist history across sessions** — Store undo data in UserDefaults or file for app restart recovery.

**Detection:**

- User can click undo after rename completes
- Undo restores exact original filenames
- Multiple undo levels work correctly

**Phase:** Core Feature Implementation (Phase 2)

---

## Moderate Pitfalls

Issues that cause usability problems, crashes, or significant user friction.

### Pitfall 5: Performance Degradation at Scale

**What goes wrong:** Loading 10,000+ files causes app to freeze, crash, or use excessive memory (1.8GB+). Preview becomes unresponsive.

**Why it happens:**

- No virtualization in file list (renders all rows)
- Preview recalculates on every keystroke without debouncing
- Recursive file scanning has O(n²) behavior

**Consequences:**

- App crashes on large batches
- User cannot preview results before renaming
- Unusable for photographers with large photo libraries

**Prevention:**

1. **Virtualized list rendering** — Only render visible rows. Use lazy loading for list.
2. **Debounced preview** — For 500+ files, add 100-200ms debounce after typing stops before recalculating preview.
3. **Background processing** — Move file scanning and rename operations to background threads.
4. **Batch processing** — Rename files in chunks (e.g., 1000 per batch) to prevent UI blocking.

**Detection:**

- App remains responsive with 10,000 files loaded
- Preview updates within 200ms for typical batch sizes
- Memory usage stays under 500MB

**Phase:** Performance Optimization (Phase 3)

---

### Pitfall 6: Live Preview Not Actually Live

**What goes wrong:** User must click "Preview" button to see results. Preview opens in modal dialog. Changes to rules require re-clicking preview.

**Why it happens:** Preview is implemented as a separate view/screen rather than integrated into the main workflow.

**Consequences:**

- Slow iterative workflow — change rule → click preview → review → change rule → click preview
- Users skip preview due to friction and rename blindly
- Preview becomes separate debugging step rather than core UX

**Prevention:**

1. **Side-by-side columns** — Show original filename and new filename in adjacent columns.
2. **Real-time updates** — Preview recalculates as user types or changes settings.
3. **Visual diff highlighting** — Highlight changed characters so user sees exactly what differs.
4. **Debounce for large batches** — Silent optimization, not visible to user.

**Phase:** UI/UX Implementation (Phase 1-2)

---

### Pitfall 7: macOS Version Compatibility

**What goes wrong:** Tool crashes on macOS Sequoia 15, Tahoe 16, or has UI issues after OS updates. New macOS releases often change file system APIs or security behaviors.

**Why it happens:** Hardcoded API assumptions, missing compatibility testing, reliance on deprecated APIs.

**Consequences:**

- App crashes immediately on new macOS versions
- Poor reviews and user frustration
- Appears abandoned or unmaintained

**Prevention:**

1. **Test on beta releases** — Run on macOS beta before public release.
2. **Defensive API handling** — Use availability checks (@available) for new APIs.
3. **Minimal system dependencies** — Avoid relying on private APIs that Apple changes.
4. **Version-specific workarounds** — Document known issues and provide updates quickly.

**Phase:** QA and Maintenance (Ongoing)

---

### Pitfall 8: Extension Handling Mistakes

**What goes wrong:** User accidentally modifies file extension, rendering files unopenable. Example: "photo.jpg" becomes "photo.jpeg" and no app opens it.

**Why it happens:** Regex or replace patterns match the dot before extension. No protection for extension.

**Consequences:**

- Files become inaccessible
- User loses ability to open documents/images
- Requires manual fix or backup restore

**Prevention:**

1. **Separate extension handling** — Treat filename and extension as separate fields.
2. **Extension lock/protection option** — Allow user to lock extensions from changes.
3. **Clear extension display** — Show extension in distinct visual style so user notices changes.
4. **Warning on extension change** — Alert user if rename would modify extension.

**Phase:** Core Feature Implementation (Phase 1-2)

---

## Minor Pitfalls

Quality of life issues that frustrate users but don't cause data loss.

### Pitfall 9: Regex Pattern Errors

**What goes wrong:** User enters invalid regex (unmatched parentheses, invalid quantifiers) and app crashes or shows cryptic error.

**Why it happens:** No regex validation before applying. Errors not caught until runtime.

**Consequences:**

- User frustration
- App may crash when invalid regex is applied
- Users avoid regex features entirely

**Prevention:**

1. **Real-time regex validation** — Show error message if regex is invalid as user types.
2. **Placeholder testing** — Allow user to test regex against sample text before applying to files.
3. **Fallback to literal matching** — If regex fails, fall back to literal string match with warning.

**Phase:** Core Feature Implementation (Phase 2)

---

### Pitfall 10: Missing Preset System

**What goes wrong:** User has to recreate the same rename rules every time. No way to save and reuse common workflows.

**Why it happens:** Presets considered "nice to have"而非 core feature.

**Consequences:**

- Repetitive manual configuration
- Users don't adopt tool for recurring tasks
- Reduced productivity for power users

**Prevention:**

1. **Save current rules as preset** — One-click save with name.
2. **Load presets from list** — Quick switch between saved configurations.
3. **Preset import/export** — Share presets with other users.

**Phase:** Feature Enhancement (Phase 3)

---

### Pitfall 11: No Confirmation Before Rename

**What goes wrong:** Rename executes immediately when user clicks rename button. No "Are you sure?" moment for large batches.

**Why it happens:** Optimized for speed, but users need safety net for high-risk operations.

**Consequences:**

- Accidental clicks cause unwanted renames
- New users anxious about using tool
- No recovery until undo is discovered

**Prevention:**

1. **Optional confirmation dialog** — For batches over N files, show summary dialog.
2. **Final preview step** — Require one last look at preview before confirm.
3. **Keyboard shortcut for direct rename** — Power users can skip confirmation via preferences.

**Phase:** UI/UX Implementation (Phase 2)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Core UI & File List | No duplicate detection implemented early | Add conflict detection to MVP, not later |
| Phase 2: Rename Operations | Rename order collisions | Implement two-pass rename strategy from start |
| Phase 2: Undo System | History not persisted | Use UserDefaults for basic undo, upgrade later |
| Phase 3: Large Batch Handling | Performance issues | Profile early with 10K+ files, optimize before release |
| Phase 3: macOS Compatibility | Beta testing gaps | Test on macOS beta 4+ weeks before release |

---

## Sources

- Batchio conflict detection documentation (batchio.dev)
- A Better Finder Rename troubleshooting guide (publicspace.net)
- Advanced Renamer collision rules (advancedrenamer.com)
- macOS App Sandbox documentation (developer.apple.com)
- Photo Naminator sandbox limitations (goerke.tech)
- Microsoft PowerToys PowerRename issue #14219 (github.com/microsoft/PowerToys)
- Stack Overflow sandbox file access discussions