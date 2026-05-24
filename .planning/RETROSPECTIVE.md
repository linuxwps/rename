# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-14
**Phases:** 3 | **Plans:** 7 | **Sessions:** 12

### What Was Built
- Tauri v2 + React 19 macOS app with file drag-drop, picker, and metadata table
- 6 rename modes (sequential, regex, prefix, suffix, extension, replace) with live preview pipeline
- Word-level diff highlighting (green additions, red deletions) with APFS-safe conflict detection
- Two-phase rename engine with undo snapshot persistence to filesystem
- ActionBar (6 states), Toast notifications (4 types), and per-row execution results
- Zero TypeScript errors — 27 source files, 2437 LOC

### What Worked
- **Phase decomposition**: 3 coarse phases with clear dependency boundaries avoided rework
- **Tauri v2 + React**: Excellent developer experience for macOS desktop apps
- **YOLO mode + auto-execution**: Full phases executed autonomously in minutes
- **Subagent parallelism**: Wave 2 of Phase 2 executed both UI plans in parallel (~2 min each)

### What Was Inefficient
- **Tauri v2 API friction**: `appWindow` → `getCurrentWindow()` and `onFileDropEvent` → `onDragDropEvent` required mid-Phase-3 fix. These were known in Phase 1 research but surfaced as runtime API mismatches.
- **Sequential subagent execution**: Wave 1 plans were forced sequential which delayed Phase 3 (03-01 backend before 03-02 UI). Inherent dependency, not inefficient — but the 2-plan structure meant both waves ran one-at-a-time.

### Patterns Established
- Custom React hooks (no external state library) for all app state
- Component + CSS file per component (plain CSS, no CSS-in-JS, no shadcn)
- Pure function rename pipeline with composable mode transforms
- Two-phase rename (original → UUID temp → final) for safe batch operations
- Undo snapshot to appLocalDataDir for crash recovery

### Key Lessons
1. Verify Tauri v2 API method names at the start of each phase — the v2 API is still maturing (several rename/collapse events between 2.0 and 2.11)
2. Pure function composition for rename modes keeps the pipeline testable and trivially extensible — the 6 modes are just ordered transforms in a `for..of` loop

### Cost Observations
- Model mix: ~100% deepseek-v4-flash-free (lightning fast inference)
- Sessions: 12 (project init, 4 research, requirements, roadmap, 3 discuss, plan-phase, execute-phase 1, execute-phase 2, execute-phase 3, complete-milestone)
- Notable: YOLO mode + GSD autonomy enabled shipping all 3 phases in under 24 hours

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 12 | 3 | First milestone — established GSD workflow patterns |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | N/A | 1 (`diff@^9.0.0`) |

### Top Lessons (Verified Across Milestones)

1. Pure function composition scales naturally — 1 dependency across 27 source files
2. Custom hooks keep the React tree flat and the data flow clear
