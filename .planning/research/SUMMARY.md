# Project Research Summary

**Project:** Batch Rename Tool (macOS)
**Domain:** macOS Native Application Development
**Researched:** 2026-05-13
**Confidence:** HIGH

## Executive Summary

This is a macOS-native batch file renaming utility targeting casual users who need a simple, safe tool to rename multiple files at once. The research analyzed top competitors (A Better Finder Rename, Batchio, Advanced Renamer, Transnomino) and found the market divides between pattern-based renamers and AI-content analyzers. For this project, the sweet spot is delivering reliable pattern-based renaming with excellent preview and undo—matching what users expect from $25-30 paid apps without their complexity.

The recommended approach uses SwiftUI with Swift 6 for a modern declarative UI, MVVM architecture with a Rule-Chained Pipeline pattern, and heavy emphasis on safety features (conflict detection, two-pass rename strategy, robust undo). The critical risks are data loss from duplicate filename collisions and sandbox permission issues—both well-documented with clear mitigations. Phased development starting with core file operations, then preview pipeline, then execution with undo is the most reliable path.

## Key Findings

### Recommended Stack

The recommended stack leverages Apple's native toolchain with SwiftUI for declarative UI, Swift 6 for data race safety and modern concurrency, and minimal third-party dependencies.

**Core technologies:**
- **SwiftUI** — Apple's recommended framework for macOS apps. Provides native controls (Table, sidebar), automatic accessibility, and declarative syntax.
- **Swift 6.0+** — Required for 2025+ projects. Provides complete data race safety checking and improved concurrency diagnostics.
- **Swift Concurrency** — async/await, Task, MainActor for non-blocking file operations. Essential for batch rename tool.
- **Foundation** — URL, FileManager, FileHandle for all file system interactions. No external dependencies needed.
- **XcodeGen** — Project generation from YAML, eliminates merge conflicts, supports Xcode 16.0+.

### Expected Features

**Must have (table stakes):**
- **File list management** — Drag-drop + file picker to add files
- **Live preview** — Real-time before/after comparison with color-coded changes
- **In-place rename** — Rename within original folder (no moving/copying)
- **Undo** — Single-click revert for entire batch, persists across sessions
- **6 rename methods** — By time (date insertion), Regex, Prefix, Suffix, Extension change, Replace text

**Should have (competitive):**
- **EXIF metadata** — For photo workflows (camera date, model)
- **Conflict detection** — Auto-detect duplicate names to prevent overwrites
- **Case transformation** — UPPERCASE, lowercase, Title Case
- **Date insertion** — Insert creation/modification date in various formats

**Defer (v2+):**
- Chain operations (multiple rules combined)
- Presets (save/reuse configurations)
- ID3/music metadata
- Folder watching

### Architecture Approach

The recommended architecture is a **Rule-Chained Pipeline** with **MVVM** presentation layer. This matches how existing macOS rename tools work (Batchio, Advanced Renamer) and supports the core requirement: non-destructive preview before execution with full undo capability.

**Major components:**
1. **FileListViewModel** — Manages file selection, triggers preview refresh
2. **RenameConfigViewModel** — Holds active rename mode and configuration, generates preview
3. **RenameEngine** — Orchestrates rename operation: validate → execute → record for undo
4. **RuleProcessor** — Applies individual rename rules to transform filenames
5. **UndoManager** — Tracks rename operations, provides undo/redo capability
6. **FileSystemService** — Low-level file operations via FileManager

### Critical Pitfalls

1. **Duplicate filename detection** — Without collision checks, one file silently overwrites another. Prevention: calculate all output filenames before any rename, check against existing files in directory, case-insensitive comparison.

2. **Rename order collisions** — "1.jpg → 2.jpg" and "2.jpg → 3.jpg" simultaneously causes overwrites. Prevention: two-pass rename (temp unique names → final names) or reverse processing order.

3. **App Sandbox permission model** — Drag-drop grants file access but not parent folder write access needed for rename. Prevention: use NSOpenPanel for directory access, security-scoped bookmarks.

4. **Missing undo functionality** — Batch rename is high-risk; mistakes affect many files. Prevention: store rename history, support multiple undo levels, persist across app restarts.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & File List
**Rationale:** All other components depend on FileSystemService. Must establish core file operations and basic list display before building preview or rename execution.

**Delivers:**
- FileSystemService with FileManager operations
- FileItem model with metadata (URL, name, extension, dates)
- Basic file list display with drag-drop support
- Project.yml for XcodeGen

**Uses:** SwiftUI, Swift 6, Foundation, XcodeGen

**Implements:** FileListViewModel

**Avoids:** Sandbox permission issues by using NSOpenPanel early

### Phase 2: Preview Pipeline & Core Rename
**Rationale:** Users expect live preview before execution—this prevents data loss. Build RuleProcessor with single rule first (Replace), then expand to all 6 methods.

**Delivers:**
- RuleProcessor with 6 rename methods
- Live preview with before/after columns
- RenameConfigViewModel with config-driven preview
- Visual diff highlighting (green added, red removed)
- Debounced preview for large batches (100-500 files)

**Addresses:** All 6 rename methods from PROJECT.md

**Avoids:** Pitfall #6 (preview not live) by making it side-by-side and real-time

### Phase 3: Rename Execution & Undo
**Rationale:** RenameEngine requires stable RuleProcessor. Undo builds on execution pattern. This is where safety features matter most.

**Delivers:**
- RenameEngine with validation before execution
- Two-pass rename strategy to avoid order collisions
- Conflict detection (flag duplicates, disable rename button)
- UndoManager with history persistence
- Extension lock/protection option

**Implements:** RenameEngine, UndoManager, HistoryStore

**Avoids:** Pitfalls #1 (duplicate detection), #2 (rename order), #4 (missing undo), #8 (extension mistakes)

### Phase 4: Polish & Features
**Rationale:** Core app works; now add competitive differentiators and refine UX.

**Delivers:**
- EXIF metadata support for photos
- Case transformation (uppercase, lowercase, title case)
- Date insertion with configurable formats
- Keyboard shortcuts (Cmd+Z undo)
- Progress indicators for large batches

**Research Flag:** EXIF extraction may need deeper research on ImageIO framework integration—mark for optional research-phase during planning.

### Phase Ordering Rationale

- **Foundation first:** FileSystemService is dependency for all other components
- **Preview before execute:** Visual feedback prevents errors, validates requirements, and is core user expectation
- **Undo last:** Requires RenameEngine to be stable; builds naturally on execution pattern
- **Additional modes throughout:** Core app works with single rule type first, expand to 6 methods in Phase 2

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (EXIF):** ImageIO framework integration for extracting EXIF metadata from photos. Consider research-phase if complex.

Phases with standard patterns (skip research-phase):
- **Phase 1-2:** Well-documented SwiftUI patterns, Apple frameworks
- **Phase 3:** Two-pass rename and undo are established patterns from competitor analysis

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Apple documentation, Swift 6 release notes, XcodeGen docs |
| Features | HIGH | Verified against multiple competitor apps (A Better Finder Rename, Batchio, Advanced Renamer) |
| Architecture | HIGH | Based on analysis of 5+ existing tools with proven patterns |
| Pitfalls | HIGH | Well-documented issues from competitor troubleshooting, Apple developer forums |

**Overall confidence:** HIGH

### Gaps to Address

- **Regex complexity:** PROJECT.md lists regex, but complexity varies. Need to decide on scope during planning—simple find/replace vs full regex support.
- **EXIF extraction:** May require ImageIO framework research; mark as optional Phase 4.
- **Preset system:** Defer to v2, but define minimal MVP storage format for future extension.

## Sources

### Primary (HIGH confidence)
- Context7: `/websites/developer_apple_swiftui` — SwiftUI documentation, macOS app patterns
- Context7: `/swiftlang/swift` — Swift 6 concurrency, async/await
- A Better Finder Rename feature list (publicspace.net) — Market leader since 1996
- Batchio documentation (batchio.dev) — Architecture: rule stacking, live preview
- Advanced Renamer (renamer.app) — Action chaining, undo/redo patterns

### Secondary (MEDIUM confidence)
- Transnomino feature list (transnomino.com) — Free, modern, native macOS
- RenameNinja (loshadki.app) — Regex → JS → pattern pipeline
- macOS App Sandbox documentation — Permission model issues

### Tertiary (LOW confidence)
- Zush marketing (zushapp.com) — AI approach differentiation (not relevant for this project)

---
*Research completed: 2026-05-13*
*Ready for roadmap: yes*