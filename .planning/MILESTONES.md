# Milestones

## v1.2 Large Directory & Workflow (Shipped: 2026-11-12)

**Phases completed:** 4 phases, 4 plans

**Key accomplishments:**

- Added per-file checkboxes, select-all behavior, and execution limited to the selected batch
- Added manual drag ordering alongside add, ascending-name, and descending-name ordering
- Replaced full table rendering with variable-height virtual scrolling that preserves rule-step panels
- Added CSV export and CSV import for path lists or explicit path-to-target-name mappings
- Applied CSV target names through the existing conflict preflight, exclusive rename and rollback path
- Added an in-app 300-line log panel for startup, CSV, execution, rollback, undo and error events
- Added the EXIF photo-date and case-conversion rules while preserving extension handling

## v1.2 EXIF Date Rule (Shipped: 2026-11-12)

**Phases completed:** 1 phase, 1 plan

**Key accomplishments:**

- Added a photo-date rename rule using EXIF capture time, creation time, or modified time
- Reads capture time through a Rust command with kamadak-exif for JPEG/HEIC/PNG/WebP/TIFF and related containers
- Treated missing capture time by cascading to creation and modified times, or failing with a clear error in strict mode
- Supports YYYYMMDD, YYYY-MM-DD, and YYYYMMDD_HHmmss formats, with the date placed before, after, or replacing the base name
- Kept extension handling unchanged and stored capture time per file for preview-level use in presets and rule chains

## v1.2 Case Rule (Shipped: 2026-11-12)

**Phases completed:** 1 phase, 1 plan

**Key accomplishments:**

- Added uppercase, lowercase, and title-case conversion as a first-class chain rule
- Kept file extensions unchanged by applying case conversion only to the base name
- Added case-rule support to presets, sorting, enable/disable, duplicate, and intermediate previews

## v1.1 Chain Rename (Shipped: 2026-11-12)

**Phases completed:** 2 phases, 2 plans

**Key accomplishments:**

- Replaced fixed six-mode precedence with an ordered, independently configurable rule chain capped at 10 rules
- Added drag sorting, enable/disable, duplicate, remove, and clear actions with rule-level editing
- Added intermediate preview steps and highlighted per-rule filename changes
- Added local preset save, overwrite, load, and delete with fresh rule IDs on load
- Guarded execution and preset saving against empty or ineffective rule configurations

## v1.0.4 Safety Baseline (Shipped: 2026-11-12)

**Phases completed:** 3 phases, 7 plans, 25 tasks

**Key accomplishments:**

- Tauri v2 project with React frontend, implementing drag-drop zone, file picker, file list display with metadata, and remove/clear functionality
- Type definitions, pure rename pipeline, debounce hook, and preview computation hook for the 6 rename modes
- DiffCell, ConflictBanner, RenameTabBar, and RenamePanel — visual skeleton for the rename preview right panel
- 6 stateless rename mode input forms (Sequential, Regex, Prefix, Suffix, Extension, Replace) with shared CSS
- State lifted to App.tsx with useFileList + useRenameEngine + useDebounce(300ms). FileList receives previews via props and renders DiffCell-based "新文件名" column with conflict highlighting.
- Two-phase rename executor (useRenameExecutor) with crypto.randomUUID temp names, undo snapshot persistence via appLocalDataDir, fixed useFileList.ts Tauri v2 API, extended types, and Tauri fs permissions
- ActionBar with 6 interaction states, Toast notifications with 4 types, FileList per-row result indicators, and full App.tsx integration of useRenameExecutor

---
