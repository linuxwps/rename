# Walking Skeleton: Phase 1 - File Management

**Phase:** 1
**Created:** 2026-05-14
**Purpose:** Record architectural decisions that subsequent phases build on

---

## Core Architecture Decisions

### Framework Selection
| Decision | Value | Rationale |
|----------|-------|-----------|
| Desktop Framework | Tauri v2 | Native macOS binary ~10MB vs Electron ~150MB |
| Frontend | React 18.x | Component-based, state management built-in |
| Language | TypeScript 5.x | Required for Tauri v2, type safety |
| Build Tool | Vite 6.x | Default Tauri frontend bundler |

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @tauri-apps/api | 2.x | Core Tauri APIs |
| @tauri-apps/plugin-dialog | 2.7.1 | Native file picker |
| @tauri-apps/plugin-fs | 2.5.1 | File metadata |
| @tauri-apps/plugin-os | latest | OS detection |

### Project Structure
```
rname/                      # Project root (from npm create tauri-app)
├── src/                    # React frontend
│   ├── components/
│   │   ├── FileDropZone.tsx
│   │   ├── FileList.tsx
│   │   ├── FileListRow.tsx
│   │   └── FilePickerButton.tsx
│   ├── hooks/
│   │   ├── useFileList.ts
│   │   └── useFileMetadata.ts
│   ├── types/
│   │   └── file.ts
│   ├── utils/
│   │   ├── fileFilters.ts
│   │   └── formatFileSize.ts
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── src-tauri/              # Rust backend
│   ├── src/
│   │   └── main.rs
│   ├── capabilities/
│   │   └── main.json       # Permission config
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

### Permissions Configuration
`src-tauri/capabilities/main.json`:
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

### UI Layout
| Region | Width | Purpose |
|--------|-------|---------|
| Left Panel | 33.33% (1/3) | Drop zone + file list |
| Right Panel | 66.67% (2/3) | Rename options (Phase 2) |

### File Display Format
| Column | Source | Format |
|--------|--------|--------|
| Filename | path.split('/').pop() | Original name |
| Extension | regex /\.([^.]+)$/ | Without dot |
| Size | stat().size | Human readable (KB/MB) |
| Modified | stat().mtime | Local date string |

---

## What This Skeleton Provides

1. **Runnable app** - `npm run tauri dev` launches window
2. **File picker** - Native dialog via @tauri-apps/plugin-dialog
3. **Drag-drop** - Native events via appWindow.onFileDropEvent
4. **File list display** - Basic table with metadata
5. **Remove/Clear** - React state operations

---

## What Subsequent Phases Depend On

| Phase | Dependency |
|-------|------------|
| Phase 2 (Rename & Preview) | File list state, file paths available |
| Phase 3 (Execution & Undo) | File metadata, full file list |

---

## Not Included in Skeleton

- Any rename functionality (Phase 2)
- Execution/undo operations (Phase 3)
- Visual polish beyond basic functionality

---

*Skeleton created: 2026-05-14*
*This file persists architectural choices for the project lifetime*