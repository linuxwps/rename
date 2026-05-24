# Milestones

## v1.0 MVP (Shipped: 2026-05-14)

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
