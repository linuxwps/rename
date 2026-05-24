# Phase 1: File Management - Research

**Researched:** 2026-05-14
**Domain:** macOS desktop application - file selection and management
**Confidence:** HIGH

## Summary

This phase implements file management for a macOS batch rename tool. Users add files via file picker dialog or drag-and-drop from Finder. The file list displays metadata (filename, extension, size, modified date) and supports removal operations.

**Primary recommendation:** Use Tauri v2 with React frontend. The dialog plugin handles file/folder selection with filters, while the fs plugin provides file metadata. For drag-and-drop, use Tauri's native file drop events (no need to disable dragDropEnabled).

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Multi-file selection mode
- **D-02:** Folder selection — auto-lists all files in folder
- **D-03:** File type filtering (images, documents, video, audio, all)
- **D-04:** Drag area: entire left 1/3 of screen
- **D-05:** Visual feedback: highlight + "拖入文件到这里" hint text
- **D-06:** Max 100 files limit

### the agent's Discretion
- File list column implementation (filename, extension, size, modified date)
- Sort default behavior
- File removal and clear UI interaction

### Deferred Ideas (OUT OF SCOPE)
None — all discussed items are within phase scope.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FILE-01 | Drag files from Finder into app | Tauri native file drop events via `appWindow.onFileDropEvent` |
| FILE-02 | File picker dialog selection | `@tauri-apps/plugin-dialog` with `open()` supports multi-select, directory, filters |
| FILE-03 | Display filename, extension, size, modified date | `@tauri-apps/plugin-fs.stat()` returns all metadata |
| FILE-04 | Remove single file from list | React state management - filter array |
| FILE-05 | Clear entire file list | React state management - reset array |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File picker dialog | Frontend Server (Tauri) | — | Native OS dialog via plugin, returns paths to frontend |
| Drag-and-drop from Finder | Browser/Client | Frontend Server | HTML5 drag events or Tauri native events capture file paths |
| File metadata retrieval | Frontend Server (Tauri) | — | Rust backend reads filesystem metadata, exposes via plugin |
| File list display | Browser/Client (React) | — | Pure UI rendering from state |
| File removal/clear | Browser/Client (React) | — | State management, no backend needed |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tauri | 2.11.1 | Desktop framework | Native macOS app with WebView, Rust backend |
| @tauri-apps/api | 2.x | Core Tauri APIs | Window, event, path utilities |
| @tauri-apps/plugin-dialog | 2.7.1 | Native file picker | Multi-select, folder, filters |
| @tauri-apps/plugin-fs | 2.5.1 | File system operations | stat() for metadata |
| React | 18.x | Frontend UI | Component-based, state management |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.x | Type safety | Required for Tauri v2 |
| Vite | 6.x | Build tool | Default Tauri frontend bundler |
| @tauri-apps/plugin-os | latest | OS info | Detect platform for path handling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tauri | Electron | Electron is heavier (~150MB vs ~10MB), more memory; Tauri is leaner |
| React | Vue/Svelte | React has larger ecosystem; Vue/Svelte simpler for small apps |
| Native file drop | HTML5 drag-drop | Native events give direct file paths; HTML5 requires parsing |

**Installation:**
```bash
# Using Tauri scaffolding with React + TypeScript
npm create tauri-app@latest rname -- --template react-ts
cd rname

# Add plugins
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-os
```

**Version verification:**
- `@tauri-apps/cli`: 2.11.1 (2026-05-06) — [VERIFIED: npm registry]
- `@tauri-apps/plugin-dialog`: 2.7.1 — [VERIFIED: npm registry]
- `@tauri-apps/plugin-fs`: 2.5.1 — [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    macOS Application                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  WebView (React)                      │   │
│  │  ┌────────────────┐  ┌─────────────────────────────┐ │   │
│  │  │  Left 1/3      │  │  Right 2/3                  │ │   │
│  │  │  ┌──────────┐  │  │  ┌────────────────────────┐  │ │   │
│  │  │  │ Drop Zone│  │  │  │ Tab: Sequential        │  │ │   │
│  │  │  │ + List   │  │  │  │ Tab: Regex             │  │ │   │
│  │  │  │          │  │  │  │ Tab: Prefix            │  │ │   │
│  │  │  │ [Files]  │  │  │  │ Tab: Suffix            │  │ │   │
│  │  │  └──────────┘  │  │  │ Tab: Extension         │  │ │   │
│  │  └────────────────┘  │  │  Tab: Replace           │  │ │   │
│  └───────────────────────┘  └────────────────────────────┘ │   │
│                        │                                    │
│  ═══════════════════════╪═════════════════════════════════│   │
│                    Tauri IPC                                 │
│  ═══════════════════════╪═════════════════════════════════│   │
│                        │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │              Rust Backend (Tauri Core)               │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │ dialog plugin│  │  fs plugin  │  │  OS plugin   │  │  │
│  │  │ - open()     │  │ - stat()    │  │ - platform   │  │  │
│  │  │ - save()     │  │ - readDir() │  │ - hostname   │  │  │
│  │  └──────────────┘  └─────────────┘  └──────────────┘  │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                    │
    ┌────▼────┐          ┌────▼────┐
    │ Finder  │          │ Finder  │
    │ (drag)  │          │ (drop)  │
    └─────────┘          └─────────┘
```

### Recommended Project Structure
```
src/
├── components/
│   ├── FileDropZone.tsx     # Drag-drop area + visual feedback
│   ├── FileList.tsx         # Table displaying files
│   ├── FileListRow.tsx      # Individual file row
│   └── FilePickerButton.tsx # Opens native dialog
├── hooks/
│   ├── useFileList.ts       # State management for files
│   └── useFileMetadata.ts   # Fetch metadata for paths
├── types/
│   └── file.ts              # FileItem interface
├── utils/
│   ├── fileFilters.ts       # Filter by type (images, docs, etc.)
│   └── formatFileSize.ts    # Human-readable size
├── App.tsx
├── App.css
└── main.tsx
```

### Pattern 1: File Picker with Filters
**What:** Native file/folder selection with type filtering
**When to use:** When user clicks "添加文件" button
**Example:**
```typescript
// Source: [Tauri v2 dialog plugin docs](https://v2.tauri.app/plugin/dialog/)
import { open } from '@tauri-apps/plugin-dialog';

async function selectFiles() {
  const selected = await open({
    multiple: true,          // D-01: multi-file
    directory: false,         // File mode (not folder)
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx'] },
      { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
      { name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (selected) {
    // Returns string[] when multiple: true
    return Array.isArray(selected) ? selected : [selected];
  }
  return [];
}

async function selectFolder() {
  const selected = await open({
    multiple: false,
    directory: true   // D-02: folder selection
  });

  if (selected) {
    // Need to read directory contents via fs plugin
    return selected;
  }
  return null;
}
```

### Pattern 2: Native File Drop Events
**What:** Capture files dragged from Finder directly into the app
**When to use:** When user drags files onto the left panel
**Example:**
```typescript
// Source: [Tauri v2 window events](https://v2.tauri.app/api/event/)
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

interface FileDropEvent {
  paths: string[];
  position: { x: number; y: number };
}

async function setupFileDropListener(
  onFilesDropped: (paths: string[]) => void
) {
  // Listen for file drop events
  const unlisten = await appWindow.onFileDropEvent((event) => {
    if (event.payload.type === 'drop') {
      // event.payload.paths contains the file paths
      onFilesDropped(event.payload.paths);
    } else if (event.payload.type === 'hover') {
      // User is hovering - could show visual feedback
      console.log('Files hovering:', event.payload.paths);
    } else if (event.payload.type === 'cancel') {
      // User cancelled the drop
      console.log('Drop cancelled');
    }
  });

  return unlisten; // Call to remove listener
}
```

### Pattern 3: File Metadata Retrieval
**What:** Get file size, modified date, extension from file path
**When to use:** After getting file paths, before displaying in list
**Example:**
```typescript
// Source: [Tauri v2 fs plugin](https://v2.tauri.app/plugin/file-system/)
import { stat } from '@tauri-apps/plugin-fs';

interface FileMetadata {
  size: number;        // bytes
  mtime: number;       // Unix timestamp (milliseconds)
  isFile: boolean;
  isDirectory: boolean;
}

async function getFileMetadata(path: string): Promise<FileMetadata> {
  const metadata = await stat(path);
  return {
    size: metadata.size,
    mtime: metadata.mtime ? new Date(metadata.mtime).getTime() : 0,
    isFile: metadata.isFile(),
    isDirectory: metadata.isDirectory()
  };
}

// Extract extension from filename
function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}
```

### Pattern 4: File List State Management (React)
**What:** Managing file list with add, remove, clear operations
**When to use:** React state for FILE-04 and FILE-05
**Example:**
```typescript
// FileList state interface
interface FileItem {
  id: string;           // Unique identifier (path + timestamp)
  path: string;         // Full file path
  name: string;         // Filename without path
  extension: string;   // File extension
  size: number;         // Size in bytes
  modifiedAt: number;   // Unix timestamp
}

// Adding files (FILE-01, FILE-02)
function addFiles(currentList: FileItem[], newPaths: string[]): FileItem[] {
  // Check 100 file limit (D-06)
  const remaining = 100 - currentList.length;
  const pathsToAdd = newPaths.slice(0, remaining);

  const newFiles: FileItem[] = pathsToAdd.map(path => {
    const name = path.split('/').pop() || '';
    return {
      id: `${path}-${Date.now()}`,
      path,
      name,
      extension: getExtension(name),
      size: 0,           // Will be filled by metadata fetch
      modifiedAt: 0
    };
  });

  return [...currentList, ...newFiles];
}

// Removing single file (FILE-04)
function removeFile(currentList: FileItem[], fileId: string): FileItem[] {
  return currentList.filter(f => f.id !== fileId);
}

// Clearing list (FILE-05)
function clearFiles(): FileItem[] {
  return [];
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Native file picker | Build custom HTML dialog | @tauri-apps/plugin-dialog | OS-native look, keyboard shortcuts, favorites |
| File metadata | Parse paths manually | @tauri-apps/plugin-fs.stat() | Handles symlinks, permissions, timestamps correctly |
| Drag-drop from Finder | HTML5 File API only | Tauri native events | HTML5 doesn't give full paths, only names |
| File type filtering | Regex on filenames | dialog filters option | OS handles filter UI natively |

**Key insight:** Desktop apps should leverage native OS capabilities where possible. The Tauri plugin ecosystem provides these without writing platform-specific code.

---

## Common Pitfalls

### Pitfall 1: Forgetting to configure permissions
**What goes wrong:** File operations fail with "Permission denied" errors
**Why it happens:** Tauri v2 uses capability-based permissions; by default, no filesystem access
**How to avoid:** Create `src-tauri/capabilities/main.json` with required permissions:
```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "fs:default",
    "fs:allow-stat",
    "fs:allow-read-dir"
  ]
}
```
**Warning signs:** Console shows "Permission denied" or "Operation not permitted"

### Pitfall 2: Drag-drop conflicts with window dragging
**What goes wrong:** Files dropped but Tauri interprets as window drag
**Why it happens:** Default `dragDropEnabled: true` consumes drop events
**How to avoid:** Use Tauri native `onFileDropEvent` — it works regardless of this setting. Do NOT set to false unless you need HTML5 drag within the app.
**Warning signs:** Drop event never fires, or window moves unexpectedly

### Pitfall 3: Folder selection returns path, not contents
**What goes wrong:** User selects folder but only get folder path, not files inside
**Why it happens:** Dialog plugin returns folder path; need fs plugin to read contents
**How to avoid:** After folder selection, use `readDir()` from fs plugin:
```typescript
import { readDir } from '@tauri-apps/plugin-fs';

async function getFilesInFolder(folderPath: string): Promise<string[]> {
  const entries = await readDir(folderPath);
  return entries
    .filter(entry => entry.isFile)
    .map(entry => `${folderPath}/${entry.name}`);
}
```

### Pitfall 4: File count exceeds 100 limit silently
**What goes wrong:** User adds 150 files, only first 100 appear with no feedback
**Why it happens:** No UI feedback when limit reached
**How to avoid:** Show toast/alert when limit reached:
```typescript
if (currentList.length + newPaths.length > 100) {
  alert(`已达到最大文件数量限制 (100)。已添加前 ${100 - currentList.length} 个文件。`);
}
```

### Pitfall 5: Not handling file paths on Apple Silicon
**What goes wrong:** Paths like `/Users/user/file.txt` work in dev but fail in production
**Why it happens:** App sandbox may restrict filesystem access
**How to avoid:** Add appropriate scope in capabilities, or use `BaseDirectory` for app-specific storage

---

## Code Examples

### Complete File List Hook
```typescript
// Source: Custom implementation based on Tauri APIs
import { useState, useEffect, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { stat, readDir } from '@tauri-apps/plugin-fs';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

interface FileItem {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: number;
}

export function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch metadata for a list of paths
  const fetchMetadata = useCallback(async (paths: string[]): Promise<FileItem[]> => {
    const items: FileItem[] = [];

    for (const path of paths) {
      try {
        const metadata = await stat(path);
        const name = path.split('/').pop() || '';
        const extMatch = name.match(/\.([^.]+)$/);
        const extension = extMatch ? extMatch[1] : '';

        items.push({
          id: `${path}-${Date.now()}-${Math.random()}`,
          path,
          name,
          extension,
          size: metadata.size,
          modifiedAt: metadata.mtime ? new Date(metadata.mtime).getTime() : 0
        });
      } catch (err) {
        console.error(`Failed to get metadata for ${path}:`, err);
      }
    }

    return items;
  }, []);

  // Add files from paths (with 100 limit)
  const addFiles = useCallback(async (paths: string[]) => {
    const remaining = 100 - files.length;
    if (remaining <= 0) {
      alert('已达到最大文件数量限制 (100)');
      return;
    }

    const pathsToAdd = paths.slice(0, remaining);
    const newItems = await fetchMetadata(pathsToAdd);

    setFiles(prev => [...prev, ...newItems]);

    if (paths.length > remaining) {
      alert(`已添加 ${remaining} 个文件。超出限制的文件未添加。`);
    }
  }, [files.length, fetchMetadata]);

  // Open file picker (FILE-02)
  const openFilePicker = useCallback(async () => {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx'] },
        { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (selected && selected.length > 0) {
      await addFiles(selected);
    }
  }, [addFiles]);

  // Open folder picker (D-02)
  const openFolderPicker = useCallback(async () => {
    const selected = await open({
      multiple: false,
      directory: true
    });

    if (selected) {
      // Read directory contents
      const entries = await readDir(selected);
      const filePaths = entries
        .filter(e => e.isFile)
        .map(e => `${selected}/${e.name}`);
      await addFiles(filePaths);
    }
  }, [addFiles]);

  // Remove single file (FILE-04)
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Clear all files (FILE-05)
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Setup drag-drop listener
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await appWindow.onFileDropEvent((event) => {
        if (event.payload.type === 'drop') {
          setIsDragging(false);
          addFiles(event.payload.paths);
        } else if (event.payload.type === 'hover') {
          setIsDragging(true);
        } else if (event.payload.type === 'cancel') {
          setIsDragging(false);
        }
      });

      return unlisten;
    };

    let cleanup: (() => void) | null = null;
    setupListener().then(unlisten => {
      cleanup = unlisten;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [addFiles]);

  return {
    files,
    isDragging,
    openFilePicker,
    openFolderPicker,
    removeFile,
    clearFiles
  };
}
```

### Visual Feedback Component (D-05)
```tsx
// Source: Custom React component
import { useFileList } from './hooks/useFileList';

function FileDropZone() {
  const { files, isDragging, openFilePicker, openFolderPicker } = useFileList();

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      style={{
        width: '33.33%',  // Left 1/3 (D-04)
        height: '100%',
        border: isDragging ? '3px dashed #4CAF50' : '2px dashed #ccc',
        backgroundColor: isDragging ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {files.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: isDragging ? '#4CAF50' : '#666', fontSize: '16px' }}>
            {isDragging ? '松开鼠标添加文件' : '拖入文件到这里'}
          </p>
          <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
            或
          </p>
          <button onClick={openFilePicker}>选择文件</button>
          <button onClick={openFolderPicker}>选择文件夹</button>
        </div>
      ) : (
        <FileList files={files} />
      )}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTML5 File API | Tauri native events | Tauri v2 (2024) | Direct file paths, no parsing needed |
| Allowlist (v1) | Capabilities system (v2) | Tauri v2 (2024) | More granular, explicit permissions |
| @tauri-apps/api/fs | @tauri-apps/plugin-fs | Tauri v2 | Modular plugins, tree-shakeable |

**Deprecated/outdated:**
- `tauri.conf.json` allowlist — replaced with capabilities system in v2
- `@tauri-apps/api/dialog` — replaced by `@tauri-apps/plugin-dialog` in v2

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tauri is the correct framework for macOS rename tool | Standard Stack | LOW — macOS + small binary needs = Tauri is optimal choice |
| A2 | React is preferred over Vue/Svelte | Standard Stack | LOW — React has larger ecosystem, any would work |
| A3 | No existing project code to integrate | Project Context | HIGH if wrong — would change architecture significantly |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Should folder selection auto-recursively include subfolders?**
   - What we know: D-02 says "自动列出其中所有文件" - current interpretation is top-level only
   - What's unclear: User may expect recursive folder inclusion
   - Recommendation: Start with non-recursive (top-level files only), document as v1 limitation

2. **What happens when duplicate files are added?**
   - What we know: No requirement specified
   - What's unclear: Should duplicates be allowed or rejected?
   - Recommendation: Allow duplicates (user may want to rename same file in different ways), but add visual indicator

3. **Sorting default behavior for file list?**
   - What we know: Agent's discretion - not specified in requirements
   - What's unclear: Sort by name? Date added? File type?
   - Recommendation: Default to order files were added (preserves selection order)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend build | — | — | Will be installed via project init |
| Rust | Tauri backend | — | — | Will be installed via Tauri init |
| macOS (Apple Silicon) | Target platform | — | — | Required for native app |

**Missing dependencies with no fallback:**
- All dependencies will be installed during project scaffolding phase.

**Missing dependencies with fallback:**
- None identified.

---

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (included with Tauri React template) |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:ui` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILE-01 | Drag files from Finder | Integration | Manual test required (OS-level) | — |
| FILE-02 | File picker dialog | Integration | Manual test required (native dialog) | — |
| FILE-03 | Display file metadata | Unit | `npm run test -- --run useFileList` | ❌ Wave 0 |
| FILE-04 | Remove single file | Unit | `npm run test -- --run useFileList` | ❌ Wave 0 |
| FILE-05 | Clear file list | Unit | `npm run test -- --run useFileList` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:ui`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/useFileList.test.ts` — covers FILE-03, FILE-04, FILE-05
- [ ] `tests/fileFilters.test.ts` — covers filter logic
- [ ] Framework install: `npm install` — run after project init

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — not applicable |
| V3 Session Management | No | N/A — not applicable |
| V4 Access Control | Yes | Tauri capabilities system for file access scope |
| V5 Input Validation | Yes | Validate file paths, limit file count to 100 |
| V6 Cryptography | No | N/A — not applicable |

### Known Threat Patterns for Tauri

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal | Tampering | Tauri plugins prevent `../` in paths; scope limits accessible directories |
| Arbitrary file read | Information Disclosure | Capabilities restrict fs:allow-stat to specific scopes |
| File数量 DoS | Denial of Service | Enforce 100 file limit in frontend state |

---

## Sources

### Primary (HIGH confidence)
- [Tauri v2 dialog plugin](https://v2.tauri.app/plugin/dialog/) — Official docs for file picker
- [Tauri v2 fs plugin](https://v2.tauri.app/plugin/file-system/) — Official docs for file metadata
- [Tauri v2 window events](https://v2.tauri.app/api/event/) — Official docs for file drop events
- npm registry versions — Verified package versions

### Secondary (MEDIUM confidence)
- [Stack Overflow: Tauri v2 drag and drop](https://stackoverflow.com/questions/77327020/tauri-angular-16-drag-and-drop) — Confirms dragDropEnabled behavior

### Tertiary (LOW confidence)
- None — all key findings verified against primary sources

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Verified versions from npm registry
- Architecture: HIGH — Based on official Tauri v2 documentation
- Pitfalls: MEDIUM — Based on community discussions and known issues

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (30 days for stable stack; Tauri v2 is actively maintained)

---

## RESEARCH COMPLETE

**Phase:** 1 - File Management
**Confidence:** HIGH

### Key Findings
1. **Tech Stack:** Tauri v2 + React + TypeScript is the optimal choice for macOS batch rename tool
2. **File Picker:** @tauri-apps/plugin-dialog v2.7.1 natively supports multi-select, folder selection, and type filters
3. **Drag-Drop:** Use Tauri's native `onFileDropEvent` API — no need to disable dragDropEnabled
4. **Metadata:** @tauri-apps/plugin-fs.stat() provides size, mtime for FILE-03
5. **Permissions:** Tauri v2 requires capabilities configuration for fs and dialog plugins

### File Created
`.planning/phases/01-file-management/01-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Versions verified via npm registry |
| Architecture | HIGH | Official Tauri v2 docs, stable patterns |
| Pitfalls | MEDIUM | Based on community discussions, some edge cases may vary |

### Open Questions
- Should folder selection be recursive? (recommend: no, start simple)
- How to handle duplicate files? (recommend: allow with visual indicator)
- What sorting default? (recommend: preserve add order)

### Ready for Planning
Research complete. Planner can now create PLAN.md files.