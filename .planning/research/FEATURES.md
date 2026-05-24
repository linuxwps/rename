# Feature Landscape: macOS Batch Rename Tools

**Domain:** macOS batch file renaming utilities
**Researched:** 2026-05-13
**Overall confidence:** HIGH

## Executive Summary

The macOS batch rename ecosystem has matured significantly. Tools range from free Finder built-ins to sophisticated $30 apps like A Better Finder Rename and emerging AI-powered solutions like Zush. The market divides clearly: **pattern-based renamers** (tool-centric, power-user focused) versus **AI content-analyzers** (outcome-centric, casual user focused). For this project, the sweet spot is delivering reliable pattern-based renaming with excellent preview/undo—matching what users expect from the $25-30 paid apps, without the complexity.

## Key Findings

| Category | Recommendation |
|----------|----------------|
| Table Stakes | File list + 6 rename methods + preview + undo |
| Differentiators | EXIF metadata support, smart presets, real-time preview |
| Anti-Features | AI content analysis, folder watching, cloud sync |

---

## Table Stakes

**Definition:** Features users expect. Missing any of these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **File list management** | Users need to add files to rename—drag-drop or file picker | Low | Essential entry point |
| **Preview (before/after)** | Users must see result before committing—non-negotiable safety feature | Low | Core trust mechanism |
| **In-place rename** | Keep files in original folder, don't move them | Low | Explicit requirement from PROJECT.md |
| **Undo** | Prevent mistakes from becoming permanent—critical for batch ops | Low | Explicit requirement from PROJECT.md |
| **Add prefix/suffix** | Most common rename need (dates, project names) | Low | Part of original 6 methods |
| **Replace text** | Fix typos, change patterns (vacation → hawaii) | Low | Part of original 6 methods |
| **Sequential numbering** | Photo organizers, document batches need counter | Medium | Padding, start value, step |
| **Extension handling** | Add, remove, or change file extensions | Low | Part of original 6 methods |

### Detailed Table Stakes

**1. File List Management**
- Drag-and-drop from Finder (high priority)
- File picker dialog for folder selection
- Display: filename, extension, file size, date modified
- **Source:** All major apps (A Better Finder Rename, Renamer, Transnomino, NameChanger) start with this

**2. Live Preview**
- Shows original → new name in real-time as user configures rename
- Color-coded changes (green for added, red for removed)
- Conflict detection (duplicate names highlighted)
- **Source:** A Better Finder Rename markets "Instant Preview" as key feature; Advanced Renamer emphasizes "preview new names in real time"

**3. In-Place Rename**
- Rename within original folder (no moving/copying)
- Preserves file content and metadata
- **Source:** Explicit user requirement in PROJECT.md

**4. Undo**
- Single-click to revert entire batch
- History of past rename operations (not just one level)
- **Source:** A Better Finder Rename specifically markets undo that persists after app closes; Zush highlights "Rollback to original filename with one click"

**5. Replace Text**
- Find and replace in filenames
- Case-sensitive option
- **Source:** Finder's built-in rename has this; all third-party apps have it

**6. Add Text (Prefix/Suffix)**
- Insert text at beginning or end of filename
- **Source:** Finder built-in supports this; baseline feature

**7. Sequential Numbering**
- Add incrementing numbers
- Configurable: start number, step, padding (001 vs 1)
- Position: before or after name
- **Source:** Finder has "Format" option with counter; all apps support

**8. Extension Handling**
- Change extension
- Remove extension
- Add extension
- **Source:** Built into Finder's "Format" option; every app supports

---

## Differentiators

**Definition:** Features that add competitive advantage. Not expected, but valued. These separate good products from great ones.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **EXIF metadata for photos** | Rename using camera date/time, camera model | Medium | Very valuable for photographers |
| **ID3 metadata for music** | Use artist/album/track info for file names | Medium | Strong for music collection users |
| **Multi-step/chain operations** | Combine multiple rename rules in sequence | Medium | A Better Finder Rename strength |
| **Presets** | Save and reuse rename configurations | Low | Repeated workflows become one-click |
| **Regex support** | Power users can do complex pattern matching | Medium | Not for everyone, but valued |
| **Custom patterns** | Variables like `{date}`, `{original}`, `{counter}` | Medium | Template-based renaming |
| **Case transformation** | UPPERCASE, lowercase, Title Case, Sentence case | Low | Common need, easy to add |
| **Smart conflict resolution** | Auto-rename duplicates to avoid overwrites | Medium | Essential for large batches |
| **Date insertion** | Insert creation/modification date in various formats | Medium | Use file metadata |

### Detailed Differentiators

**1. EXIF Metadata for Photos**
- Extract shooting date/time from photo EXIF data
- Use camera model/lens information in filename
- Sort by date and rename accordingly
- **Use case:** Photographers with hundreds of RAW/JPG files
- **Source:** A Better Finder Rename markets this heavily; Exif Renamer is dedicated to this
- **Priority for this project:** Medium—add if time permits after core

**2. ID3/Metadata for Music**
- Use artist, album, track title, genre to rename MP3/AAC files
- **Source:** A Better Finder Rename, Advanced Renamer, Smart File Renamer
- **Priority:** Low for v1 (photos/docs are target use case)

**3. Chain Operations**
- Combine multiple rename steps: replace text → add prefix → add numbering
- Reorder steps, enable/disable individual steps
- **Source:** A Better Finder Rename (key differentiator); Renamer also supports this
- **Priority:** Medium—users with complex needs want this

**4. Presets**
- Save current rename configuration as preset
- Load preset with one click
- Apply via drag-drop onto app icon
- **Source:** A Better Finder Rename; NameChanger
- **Priority:** Medium—repeat users benefit greatly

**5. Regex Support**
- Full regular expression find/replace
- Not for casual users, but power users expect it
- **Source:** A Better Finder Rename, Transnomino, Advanced Renamer
- **Priority:** Low for v1 (PROJECT.md shows 6 specific methods only)

**6. Date Insertion**
- Insert file creation date, modification date, or current date
- Configurable format: YYYY-MM-DD, DD-MM-YYYY, etc.
- **Source:** All advanced renamers
- **Priority:** Medium—requested as "按时间" (by time) in PROJECT.md

**7. Case Transformation**
- ALL CAPS, all lowercase, Title Case, Capitalize First Letter
- **Source:** Finder, all third-party apps
- **Priority:** Low—can be added later

**8. Conflict Resolution**
- Detect when two files would get same name
- Auto-append number, skip, or warn user
- **Source:** A Better Finder Rename emphasizes database-backed conflict resolution
- **Priority:** High—essential for large batches

---

## Anti-Features

**Definition:** Features to explicitly NOT build. These are either out of scope, too complex for v1, or not aligned with core value.

| Anti-Feature | Why Avoid | What to Do Instead |
|---------------|-----------|-------------------|
| **Cloud sync** | Explicitly out of scope per PROJECT.md | Focus on local file operations |
| **Batch script import** | High complexity, explicitly deferred in PROJECT.md | Simple UI-based configuration |
| **AI content analysis** | Adds external dependencies, server costs, complexity | Stick to metadata-based renaming |
| **Folder watching/monitoring** | Background processing adds significant complexity | Manual trigger rename |
| **Cross-platform (Windows)** | Target platform is macOS only per PROJECT.md | Native macOS focus |
| **Plugin/extensibility** | v1 should be focused, not extensible | Build solid core first |
| **Cloud storage integration** | Out of scope per PROJECT.md | Local files only |

### Detailed Anti-Features

**1. Cloud Sync**
- Syncing rename history, presets across devices
- **Why avoid:** Explicitly marked "非核心, 后期考虑" (non-core, consider later) in PROJECT.md
- **Alternative:** Local storage only for v1

**2. Batch Script Import**
- Import complex rename scripts or Automator workflows
- **Why avoid:** Marked "复杂度高, v1 暂不包含" (high complexity, not included in v1) in PROJECT.md
- **Alternative:** UI-based configuration with presets

**3. AI Content Analysis**
- Read file content to generate intelligent names (e.g., Zush, Renamer.ai approach)
- **Why avoid:** Requires external API or heavy ML model; not pattern-based; adds cost and dependency
- **Alternative:** Metadata-based (EXIF, file attributes) is sufficient for v1 use case

**4. Folder Watching**
- Monitor folders for new files and auto-rename
- **Why avoid:** Adds background service complexity; Zush markets this but it's a separate workflow
- **Alternative:** Manual trigger—user drags files when ready

---

## Feature Dependencies

```
File List Management
    ├── Preview (requires file list)
    ├── Rename Operations (require file list)
    └── Undo (requires rename operations)

Rename Operations
    ├── Replace Text (standalone)
    ├── Add Prefix/Suffix (standalone)
    ├── Sequential Numbering (standalone)
    ├── Extension Handling (standalone)
    ├── Date Insertion (requires metadata extraction)
    └── Case Transform (standalone)

Chain Operations (v2+)
    ├── Presets (requires chain)
    └── Regex Support (standalone but advanced)
```

---

## MVP Recommendation

**For v1, prioritize in this order:**

### Must Have (Table Stakes)
1. **File list management** — drag-drop + file picker
2. **Live preview** — before/after comparison
3. **In-place rename** — core requirement
4. **Undo** — critical safety feature
5. **6 rename methods** — as specified in PROJECT.md:
   - By time (date insertion)
   - Regex
   - Prefix
   - Suffix
   - Extension change
   - Replace text

### Add If Time Permits
6. **EXIF metadata** — for photo workflows
7. **Case transformation** — low effort, high value
8. **Conflict detection** — prevents data loss

### Defer to v2+
- Chain operations
- Presets/saved workflows
- Regex (unless simple find-replace qualifies)
- ID3/music metadata

---

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| A Better Finder Rename feature list (publicspace.net) | HIGH | Market leader, macOS-focused since 1996 |
| Advanced Renamer documentation (advancedrenamer.com) | HIGH | Cross-platform, robust feature set |
| Transnomino feature list (transnomino.com) | HIGH | Free, modern, native macOS |
| Zush marketing page (zushapp.com) | MEDIUM | AI approach, demonstrates differentiation |
| EDUCBA "Top 6 Safe File Renamers for Mac" | MEDIUM | Aggregated overview |
| File Renamer AI comparison blog | MEDIUM | AI vs pattern-based comparison |
| MacUpdate A Better Finder Rename page | HIGH | User reviews, feature confirmation |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Table Stakes | HIGH | Core features documented across all apps |
| Differentiators | HIGH | Clear patterns from market leaders |
| Anti-Features | HIGH | Explicitly aligned with PROJECT.md scope |
| Dependencies | MEDIUM | Some variation in how apps implement chains |

---

## Open Questions

- Should regex be v1 or v2? (PROJECT.md lists it, but complexity varies)
- EXIF support: High value for photos, but adds metadata extraction dependency
- How deep should preset/saved workflow support be for v1?