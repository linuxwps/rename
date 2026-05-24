# Architecture Patterns

**Domain:** macOS Batch Rename Tool
**Researched:** 2026-05-13

## Recommended Architecture

Based on analysis of existing macOS batch rename tools (Batchio, Advanced Renamer, RenameNinja, FolioSort, Renamr), the recommended architecture follows a **Rule-Chained Pipeline** pattern with **MVVM** presentation layer.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI Layer (SwiftUI)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────────────┐  │
│  │   FileListView      │    │         RenameConfigView                 │  │
│  │   - File list       │    │   ┌─────────────────────────────────┐   │  │
│  │   - Selection       │    │   │  TabView (6 rename modes)       │   │  │
│  │   - Preview         │    │   │  - ByTime / Regex / Prefix      │   │  │
│  │                     │    │   │  - Suffix / Extension / Replace │   │  │
│  │                     │    │   └─────────────────────────────────┘   │  │
│  └──────────┬──────────┘    └────────────────────┬────────────────────┘  │
└─────────────┼──────────────────────────────────────┼───────────────────────┘
              │                                      │
              ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ViewModel Layer (Observable)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────────────┐   │
│  │  FileListViewModel  │    │       RenameConfigViewModel              │   │
│  │  - files: [FileItem]│    │  - activeTab: RenameMode                │   │
│  │  - selectedIds      │    │  - config: RenameConfiguration           │   │
│  │  - previewResults   │    │  - generatePreview(files, config)        │   │
│  └──────────┬──────────┘    └────────────────────┬────────────────────┘  │
└─────────────┼──────────────────────────────────────┼───────────────────────┘
              │                                      │
              ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Service Layer (Business Logic)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │     RenameEngine              │  │        UndoManager                │  │
│  │  - applyRules(files, rules)   │  │  - recordOperation(op)            │  │
│  │  - validateRename(source, dest)│  │  - undo() -> revert             │  │
│  │  - executeRename(operations)   │  │  - canUndo: Bool                 │  │
│  └──────────────┬─────────────────┘  └───────────────┬───────────────────┘  │
│                 │                                      │                    │
│                 ▼                                      ▼                    │
│  ┌──────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │     RuleProcessor            │  │      HistoryStore                 │  │
│  │  - process(file, rules)      │  │  - save(op)                       │  │
│  │  - each rule: FileItem ->    │  │  - load()                         │  │
│  │              FileItem        │  │  - clear()                        │  │
│  └──────────────────────────────┘  └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Platform Integration Layer                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │      FileSystemService        │  │       MetadataService             │  │
│  │  - scanDirectory(path)        │  │  - readEXIF(file)                │  │
│  │  - rename(source, dest)       │  │  - readCreationDate(file)       │  │
│  │  - exists(path)               │  │  - readModificationDate(file)    │  │
│  └──────────────────────────────┘  └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Rule-Chained Pipeline?

This architecture matches how existing macOS rename tools work:

1. **Batchio** — Stacks up to 9 rule types in any order, live preview updates instantly
2. **Advanced Renamer** — Chains actions together, re-orderable, full undo/redo
3. **RenameNinja** — Regex → JavaScript → Pattern construction pipeline
4. **FolioSort** — Pattern or Regex mode with before/after preview

The pipeline allows:
- Users to combine multiple rename operations
- Non-destructive preview before execution
- Undo tracking across batch operations
- Easy extension of new rename modes

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **FileListViewModel** | Manages file selection, triggers preview refresh | RenameConfigViewModel (for preview), FileSystemService |
| **RenameConfigViewModel** | Holds active rename mode and configuration | FileListViewModel (provides preview data), RuleProcessor |
| **RenameEngine** | Orchestrates full rename operation: validate → execute → record | FileSystemService (reads/writes), UndoManager (records), RuleProcessor |
| **RuleProcessor** | Applies individual rename rules to transform filenames | Called by RenameEngine, config from RenameConfigViewModel |
| **UndoManager** | Tracks rename operations, provides undo/redo capability | RenameEngine (records), HistoryStore (persists) |
| **FileSystemService** | Low-level file operations via FileManager | RenameEngine, MetadataService |
| **MetadataService** | Extracts EXIF, creation date, modification date | RuleProcessor (for time-based rename rules) |

### Component Communication Flow

```
User selects files
       │
       ▼
FileListViewModel.files ←── FileSystemService.scanDirectory()
       │
       ▼
User configures rename rules
       │
       ▼
RenameConfigViewModel.config + FileListViewModel.files
       │
       ▼ (via generatePreview)
RuleProcessor.processEach(file, rules) → PreviewResult[]
       │
       ▼ (user clicks "Rename")
RenameEngine.executeRename(operations)
       │
       ├──→ FileSystemService.rename() ─→ UndoManager.record()
       │
       ▼ (error or user action)
UndoManager.undo() ─→ FileSystemService.rename() (reverse)
```

## Data Flow

### Input Flow: File Selection → Preview

1. User adds files via drag-drop or file picker
2. FileListViewModel receives `[URL]` → scans via FileSystemService
3. FileSystemService returns `[FileItem]` with metadata
4. User selects rename mode (tab) and configures options
5. RenameConfigViewModel triggers `generatePreview(files, config)`
6. RuleProcessor processes each file through applicable rules
7. Preview results displayed as "Original → New" pairs

### Execution Flow: Preview → Rename

1. User clicks "Rename All" button
2. RenameEngine receives `[RenameOperation]` from preview
3. RenameEngine validates each operation:
   - Destination doesn't already exist (unless overwrite enabled)
   - Source file exists and is accessible
   - No duplicate destination names
4. On validation success:
   - FileSystemService.performRename() for each operation
   - UndoManager.record() saves reverse operation
5. On validation failure:
   - Show error, highlight conflicting files
   - Block execution until resolved

### Undo Flow

1. User clicks "Undo" (or Cmd+Z)
2. UndoManager retrieves last batch operation
3. Reverse operations sent to FileSystemService
4. Original filenames restored

## Patterns to Follow

### Pattern 1: Reactive Preview Pipeline

**What:** Preview updates automatically when any config changes, without user action

**When:** User modifies any rename option (regex, prefix, suffix, etc.)

**Implementation:**
```swift
@Observable
class RenameConfigViewModel {
    var config: RenameConfiguration {
        didSet {
            triggerPreviewRecalculation()
        }
    }
    
    func triggerPreviewRecalculation() {
        // Debounce: wait 100-300ms before recalculating
        // This prevents UI lag during rapid typing
    }
}
```

**Why:** Matches user expectation from Batchio, Advanced Renamer — instant feedback improves UX and reduces errors

### Pattern 2: Validation Before Execution

**What:** All rename operations validated before any file is renamed

**When:** User clicks rename button

**Implementation:**
```swift
func executeRename(_ operations: [RenameOperation]) -> Result<Void, RenameError> {
    // Step 1: Validate ALL operations
    for op in operations {
        if fileSystem.exists(op.destination) {
            return .failure(.destinationExists(op.destination))
        }
    }
    
    // Step 2: Execute ALL operations (if validation passed)
    for op in operations {
        try fileSystem.rename(op.source, to: op.destination)
    }
}
```

**Why:** Prevents partial renames — critical for batch operations where some files might succeed and others fail

### Pattern 3: Operation Recording for Undo

**What:** Every successful rename records enough info to reverse it

**When:** After each rename operation completes

**Implementation:**
```swift
struct RenameOperation {
    let source: URL        // Original location
    let destination: URL   // New location
    let timestamp: Date
}

struct UndoBatch {
    let operations: [RenameOperation]
    let timestamp: Date
    let description: String  // "Renamed 12 files using Replace rule"
}
```

**Why:** Users expect full undo from commercial tools (Batchio, Advanced Renamer)

### Pattern 4: File Item Normalization

**What:** Normalize file information early, keep unified model through pipeline

**When:** File added to list

**Implementation:**
```swift
struct FileItem {
    let id: UUID
    let originalURL: URL
    let originalName: String
    let extension: String
    let creationDate: Date?
    let modificationDate: Date?
    let previewName: String?  // Computed, starts nil
}
```

**Why:** RuleProcessor can work with consistent interface regardless of rename mode

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct FileManager Calls in Views

**What:** Using FileManager directly in SwiftUI view files

**Why bad:** Tight coupling, hard to test, blocks main thread

**Instead:** Inject FileSystemService via environment or dependency injection

### Anti-Pattern 2: Synchronous Rename Operations on Main Thread

**What:** Running file rename synchronously in button action

**Why bad:** UI freezes, large batches hang indefinitely

**Instead:** Use async/await with progress reporting:
```swift
func renameBatch(_ operations: [RenameOperation]) async throws {
    for operation in operations {
        try await fileSystem.rename(operation)
        await progress.update(count: count + 1)
    }
}
```

### Anti-Pattern 3: Per-File Preview Calculation

**What:** Calculating preview for each file individually without caching

**Why bad:** O(n) rebuild on every keystroke, UI lag with 100+ files

**Instead:** Batch preview calculation, debounce input, use `@Observable` efficiently

### Anti-Pattern 4: Undo Without Batch Tracking

**What:** Only storing last single rename operation

**Why bad:** Can't undo entire batch, user loses context

**Instead:** Track undo batches — one "Undo" reverts all files from last rename action

## Scalability Considerations

| Concern | At 100 files | At 1,000 files | At 10,000 files |
|---------|--------------|----------------|-----------------|
| **File scanning** | Sync OK | Background thread | FSEvents or incremental |
| **Preview calculation** | Real-time | Debounced (300ms) | Paginated, async |
| **Rename execution** | Sequential OK | Async with progress | Parallel batches, error isolation |
| **Memory** | In-memory list | Lazy load thumbnails | Virtualized list, load visible only |
| **Undo history** | In-memory OK | SQLite lightweight | Prune old batches (keep last 50) |

### Performance Recommendations

- **< 100 files:** Full preview on every config change
- **100-1,000 files:** Debounce preview by 200-300ms
- **> 1,000 files:** Show "Calculating..." placeholder, compute in chunks

## Build Order Dependencies

Based on component dependencies, suggested build sequence:

1. **Phase 1: Foundation**
   - FileSystemService (file operations)
   - FileItem model
   - Basic file list display

2. **Phase 2: Preview Pipeline**
   - RuleProcessor (single rule first: Replace)
   - RenameConfigViewModel
   - Preview display (original → new)

3. **Phase 3: Rename Execution**
   - RenameEngine (validate + execute)
   - Connect preview → execute flow

4. **Phase 4: Undo Support**
   - UndoManager
   - HistoryStore
   - Connect to RenameEngine

5. **Phase 5: Additional Modes**
   - Add remaining 5 rename modes (ByTime, Regex, Prefix, Suffix, Extension)
   - Integrate MetadataService for time-based rules

6. **Phase 6: Polish**
   - Error handling UI
   - Progress indicators
   - Keyboard shortcuts

### Why This Order?

- **FileSystemService first:** All other components depend on it
- **Preview before execute:** Visual feedback prevents errors, validates requirements
- **Undo last:** Requires RenameEngine to be stable, builds on execution pattern
- **Additional modes last:** Core app works with single rule type first

## Sources

- Batchio — https://batchio.dev/ (Architecture: rule stacking, live preview, undo)
- Advanced Renamer — https://renamer.app/ (Architecture: action chaining, undo/redo)
- RenameNinja — https://loshadki.app/renameninja/ (Architecture: regex → JS → pattern pipeline)
- FolioSort — https://github.com/tiagotrindade/FolioSort (Architecture: pattern/regex modes)
- MiMiNavigator — https://github.com/senatov/MiMiNavigator (Architecture reference: Services layer pattern)
- Fazm Blog — https://fazm.ai/blog/native-macos-app-modular-architecture-file-provider (Architecture: modular split, actors)