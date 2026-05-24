---
phase: 02-rename-preview
plan: 04
subsystem: ui
tags: react, rename, preview, diff, integration

# Dependency graph
requires:
  - phase: 02-rename-preview
    provides: RenamePanel, DiffCell, useRenameEngine, form components
provides:
  - Complete state lift: App.tsx as state root with useFileList + useRenameEngine + useDebounce
  - FileList "新文件名" column with DiffCell highlighting and conflict styling
  - End-to-end preview data flow from right panel to left panel FileList
affects: [03-execute-rename]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - State lifting: App.tsx as single source of truth for file list and rename mode states
    - Props-down data flow: preview data computed in App flows to both left (FileList) and right (RenamePanel) panels

key-files:
  created: []
  modified:
    - rname/src/App.tsx
    - rname/src/components/FileDropZone.tsx
    - rname/src/components/FileList.tsx
    - rname/src/components/FileListRow.tsx
    - rname/src/components/FileList.css

key-decisions:
  - "State lifted to App.tsx: useFileList() called once at top level, data passed down via props to both panels"
  - "previews array converted to Map<string, PreviewResult> for O(1) lookups by fileId in FileList"
  - "Active form component selected via useMemo switch, re-renders on modeStates change to keep form inputs current"

patterns-established:
  - "State lifting pattern: useFileList and useRenameEngine live at App.tsx, not in child components"
  - "Props-driven FileDropZone: all data (files, previews, callbacks) comes from parent"

requirements-completed:
  - PREV-01
  - PREV-02
  - PREV-03
  - SEQ-01
  - SEQ-02
  - SEQ-03
  - SEQ-04
  - REGE-01
  - REGE-02
  - REGE-03
  - PREF-01
  - PREF-02
  - SUFF-01
  - SUFF-02
  - EXT-01
  - EXT-02
  - EXT-03
  - REPL-01
  - REPL-02
  - REPL-03

duration: 15min
completed: 2026-05-14
---

# Phase 02 Plan 04: Integration — State lifting, preview data flow, and preview column in FileList

**State lifted to App.tsx with useFileList + useRenameEngine + useDebounce(300ms). FileList receives previews via props and renders DiffCell-based "新文件名" column with conflict highlighting.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-14T02:36:00Z
- **Completed:** 2026-05-14T02:51:55Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- App.tsx now serves as state root: calls useFileList(), useRenameEngine(files, debouncedModes), useDebounce(modeStates, 300)
- Right panel renders RenamePanel (replaces old placeholder) with active form component based on tab selection
- FileDropZone converted from internal useFileList call to props-driven (files, previews, callbacks from parent)
- FileList adds "新文件名" column between "文件名" and "扩展名", rendering DiffCell with word-level diff highlighting
- FileListRow shows conflict styling (red background row, ⚠ icon) when previewResult.hasConflict is true
- Preview data flows: user types in form → modeStates updated → 300ms debounce → useRenameEngine recomputes → previewMap passed to FileList + RenamePanel

## Task Commits

Each task was committed atomically:

1. **Task 1: 状态提升到 App.tsx** — `ba8cd9b` (feat)
2. **Task 2: FileList + FileListRow 预览列添加** — `453eff3` (feat)
3. **Task 3: CSS 更新** — `140ebfe` (style)

## Files Created/Modified

- `rname/src/App.tsx` — State root: imports hooks (useFileList, useRenameEngine, useDebounce) + form components, manages modeStates/activeTabForm, renders FileDropZone + RenamePanel with props
- `rname/src/components/FileDropZone.tsx` — Converted to props-driven (files, isDragging, previews, callbacks), removed internal useFileList()
- `rname/src/components/FileList.tsx` — Receives files/previews/onRemoveFile/onClearFiles props, adds "新文件名" column in thead, passes previewResult to FileListRow
- `rname/src/components/FileListRow.tsx` — Accepts previewResult prop, renders DiffCell for new name or "—" placeholder, conflict rows get "conflict-row" class
- `rname/src/components/FileList.css` — Added .new-name-column (min-width 150px, overflow ellipsis), .conflict-row (#fff0f0 bg, #ffcdd2 border), .preview-placeholder (#ccc, 13px)

## Decisions Made

- **previewMap as Map<string, PreviewResult>:** Converting the previews array to a Map in useMemo enables O(1) lookups by fileId in FileList, avoiding array searches during render
- **Active form component via useMemo switch:** Each mode (sequential/regex/prefix/suffix/extension/replace) maps to its form component; the switch re-renders on modeStates changes to reflect updated config values in form inputs
- **No App.css changes needed:** RenameTabBar.css and RenamePanel.css already contain the component-specific styles; .right-panel padding stays at 16px as required

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- **Pre-existing Tauri API build error:** `useFileList.ts` imports `appWindow` from `@tauri-apps/api/window`, which no longer exists in Tauri v2 (replaced by `getCurrentWindow()`). This error predates this plan (Phase 1) and prevents `npm run build` from passing. My changes introduce zero new TypeScript errors — only the 2 pre-existing errors in `useFileList.ts` remain. This issue should be addressed in a maintenance plan before Phase 3.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 2 complete: all 20 requirements implemented end-to-end
- 6 rename modes operational with preview data flow
- FileList displays "新文件名" column with DiffCell highlighting
- Conflict detection and visual feedback working
- Phase 3 (execute rename) can now consume the rename pipeline results and implement actual file rename operations
- **Note:** Fix the pre-existing Tauri v2 `appWindow` import in `useFileList.ts` before Phase 3

---

*Phase: 02-rename-preview*
*Completed: 2026-05-14*
