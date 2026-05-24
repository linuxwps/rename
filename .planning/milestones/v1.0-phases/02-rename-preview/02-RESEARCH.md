# Phase 2: Rename & Preview - Research

**Researched:** 2026-05-14
**Domain:** Frontend rename engine, diff visualization, multi-tab mode management
**Confidence:** HIGH

## Summary

Phase 2 implements the core rename functionality: 6 rename modes with real-time preview and diff highlighting. The rename engine is **purely frontend TypeScript** — no Tauri backend calls needed. Every rename mode transforms filenames via string manipulation in the browser, producing preview results that flow down to the existing FileList component.

The critical architectural decision is **lifting `useFileList` state up to `App.tsx`** so preview data can flow from the right-panel rename UI to the left-panel FileList. A custom `useRenameEngine` hook computes preview results with 300ms debounce, using the `diff` npm package (v9.0.0) for word-level highlighting.

**Primary recommendation:** Install the `diff` package for word-level filename diffing. Build a custom `useRenameEngine` hook for the preview pipeline. Build the tab bar as a custom component (no library needed). Lift state to App.tsx.

## User Constraints (from CONTEXT.md)

<user_constraints>
### Locked Decisions

#### 预览显示方式
- **D-01:** 在 FileList 表格中新增"新文件名"列，展示完整的重命名后文件名
- **D-02:** 对"新文件名"列中的变化部分做词段级颜色高亮（新增文字绿色背景，删除文字红色背景）
- **D-03:** 扩展名和文件名的变化分别高亮

#### 重命名模式切换
- **D-04:** 顶部 Tab 栏切换 6 种模式（水平标签栏），类似浏览器标签
- **D-05:** 单字 + 图标标签：时间、正则、前缀、后缀、扩展名、替换
- **D-06:** 切换 Tab 时保留之前的输入内容，切回来时恢复

#### 预览更新时机
- **D-07:** 300ms 防抖更新，输入停止后自动刷新预览
- **D-08:** 没有选择文件时，Tab 和输入框显示禁用提示"请先在左侧添加文件"

#### 重名冲突显示
- **D-09:** 顶部横幅显示"发现 N 个重名文件"计数
- **D-10:** 冲突行在"新文件名"列中红色高亮 + ⚠ 图标
- **D-11:** 存在重名冲突时，执行按钮禁用（Phase 3 实现执行按钮，此行为同步记录）

#### 模式组合方式
- **D-12:** 6 种模式可叠加使用，每个 Tab 可独立启用/禁用
- **D-13:** 多选 Tab：亮起表示该模式已启用，点击展开输入表单
- **D-14:** 应用顺序按 Tab 从左到右依次应用（时间→正则→替换→前缀→后缀→扩展名）

#### Sequential 默认值
- **D-15:** 序号起始值从 1 开始
- **D-16:** 默认 3 位固定（001, 002, 003...），用户可调整
- **D-17:** 序号默认放在文件名后（文件名_001.jpg）

### the agent's Discretion
- 高亮颜色具体色值（绿色/红色背景）
- 防抖具体实现方式（useDebounce hook 或 lodash）
- 顶部 Tab 栏的具体样式和间距
- 每个 Tab 输入表单的具体布局
- 模式叠加时预览缓存策略（避免重复计算）

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PREV-01 | 实时显示原文件名→新文件名对比 | Rename engine computes `oldName → newName` for every FileItem. Results passed as props to FileList. |
| PREV-02 | 高亮变化部分（新增绿色，删除红色） | `diff` library `diffWords()` provides word-level change tokens. Rendered as `<span>` elements with CSS classes. |
| PREV-03 | 检测并显示重名冲突 | Preview computation phase includes conflict detection (Set-based O(n) dedup check on new filenames). |
| SEQ-01 | 按文件修改时间排序后重命名 | Files sorted by `modifiedAt` timestamp. Sequential number assigned based on sort position. |
| SEQ-02 | 用户可设置序号起始值 | Input field for `startAt` (number), default 1 per D-15. |
| SEQ-03 | 用户可设置序号位数 | Input field for `digits` (number, min 1), default 3 per D-16. Padding via `String.padStart()`. |
| SEQ-04 | 用户可选择序号位置（名前/名后） | Toggle/select between position options. Default "名后" per D-17. |
| REGE-01 | 用户可输入正则表达式匹配 | Text input for regex pattern. `new RegExp(pattern, flags)` with try-catch for invalid regex. |
| REGE-02 | 用户可输入替换文本支持捕获组 | Text input for replacement string. `String.replace(regex, replacement)` supports `$1`, `$&` etc. natively. |
| REGE-03 | 用户可选择是否区分大小写 | Toggle adds/removes `i` flag on RegExp. |
| PREF-01 | 用户可输入前缀文本 | Text input, prepended to base name. |
| PREF-02 | 前缀添加在原文件名前 | `newName = prefix + oldName`. |
| SUFF-01 | 用户可输入后缀文本 | Text input, appended to base name before extension. |
| SUFF-02 | 后缀添加在原文件名后、扩展名前 | `newName = oldBaseName + suffix + '.' + extension`. |
| EXT-01 | 用户可修改文件扩展名 | Select/dropdown or text input for new extension. |
| EXT-02 | 用户可以移除文件扩展名 | Special option: no extension → `newName = oldBaseName`. |
| EXT-03 | 用户可以添加文件扩展名 | If file has no extension, append new one. |
| REPL-01 | 用户可输入查找文本 | Text input for plain text search. |
| REPL-02 | 用户可输入替换文本 | Text input for replacement. |
| REPL-03 | 用户可选择是否区分大小写 | Toggle uses case-sensitive vs case-insensitive comparison (via `String.replace` or `RegExp`). |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rename engine (string transformations) | Browser | — | Pure frontend computation, no I/O needed |
| Diff highlighting | Browser | — | Word-level diff on short strings, computed in browser |
| Tab UI & mode state management | Browser | — | React state + CSS, no server needed |
| Conflict detection | Browser | — | O(n) Set-based dedup on transformed names |
| Preview data flow (left→right panel) | Browser | — | Lifted state via App.tsx props drilling |
| File system rename execution | — | — | Deferred to Phase 3 (Tauri `fs:rename`) |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `diff` | ^9.0.0 | Word-level filename diff for highlighting | Industry standard (90M+ weekly downloads, zero dependencies, built-in TypeScript types) |
| (no new npm packages for tabs) | — | Custom tab bar component | Only 6 tabs, browser-style, no library needed |
| (no new npm packages for debounce) | — | Custom `useDebounce` hook | Simple ~10-line hook pattern, no dependency needed |

**Installation:**

```bash
npm install diff
npm install -D @types/diff   # Only needed if diff <8; v9 ships its own types
```

**Version verification:**
```
diff        9.0.0  (2026-04-13) — zero dependencies, 56 versions, 90M+ weekly downloads
```

Since `diff` v8+, built-in TypeScript types are included. No `@types/diff` needed.

### Supporting

| Utility | Purpose | When to Use |
|---------|---------|-------------|
| `String.padStart()` | Zero-pad sequential numbers (001, 002) | SEQ-03 (built-in, no library) |
| `String.replace()` with regex | Regex search & replace, capture groups | REGE-01/02 (built-in, no library) |
| `new RegExp()` | Case-sensitive/insensitive matching | REGE-03, REPL-03 (built-in) |
| `Array.sort()` by `modifiedAt` | Sort files by modification time | SEQ-01 (built-in) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `diff` library | Custom LCS algorithm | Diff library handles edge cases (unicode, whitespace, punctuation). Not worth hand-rolling. |
| `diff` library | `react-diff-viewer` | Full React component overkill — we only need raw diff tokens for inline rendering in a table cell |
| Custom `useDebounce` hook | `lodash.debounce` + `useMemo` | Extra dependency (4KB+) for ~10 lines of code. Not justified. |
| Custom tab bar | `@radix-ui/react-tabs` | 6 simple tabs, no complex behavior. Overkill. |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App.tsx (state root)                        │
│                                                                     │
│  ┌──── useFileList() ────┐    ┌── useRenameEngine(files, modes) ──┐ │
│  │ files: FileItem[]     │    │ previews: PreviewResult[]         │ │
│  │ addFiles / removeFile │───▶│ conflicts: number                 │ │
│  │ clearFiles            │    │ isComputing: boolean              │ │
│  └───────────────────────┘    └────────────┬──────────────────────┘ │
│                                            │                        │
│  ┌───────────────────┐     ┌──────────────▼───────────────────┐    │
│  │   Left Panel      │     │        Right Panel               │    │
│  │   (33.33%)        │     │        (66.67%)                  │    │
│  │                   │     │                                  │    │
│  │  FileDropZone     │     │  ┌── Conflict Banner ──────┐    │    │
│  │   └── FileList    │     │  │ "发现N个重名文件"         │    │    │
│  │       ├─ headers  │     │  └────────────────────────┘    │    │
│  │       ├─ 文件名   │     │                                 │    │
│  │       ├─ 新文件名 │◄────│── previews per file            │    │
│  │       ├─ ...      │     │  ┌── Tab Bar ──────────────┐    │    │
│  │       └─ rows     │     │  │ 时间│正则│前缀│后缀│扩展名│替换│    │
│  │                   │     │  └────────────────────────┘    │    │
│  │                   │     │                                 │    │
│  └───────────────────┘     │  ┌── Active Tab Form ───────┐    │    │
│                            │  │ (mode-specific inputs)    │    │    │
│                            │  │                           │    │    │
│                            │  │ [  start: 1  ] [digits:3]│    │    │
│                            │  │                         ｜    │    │
│                            │  └────────────────────────┘    │    │
│                            └────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
       ▲                          │
       │                          │
       └──── modeStates: ─────────┘
            RenameModeState[]
            (updated on every input change,
             300ms debounce before recompute)
```

**Data flow:**
1. User types in any rename mode tab form → updates `modeStates` state in App.tsx
2. 300ms debounce timer starts (resets on each keystroke)
3. After 300ms idle → `useRenameEngine` recomputes all preview results
4. Preview results flow down to both panels:
   - Left: `FileList` receives `previewResults` prop, renders "新文件名" column
   - Right: `RenamePanel` receives `previews` for its own preview display (if any)
5. Each `PreviewResult` contains `diffSegments` → rendered as `<span>` with `.added`/`.removed` CSS classes

### renaming Pipeline (left-to-right per D-14)

```
Original filename: "DSC_1234.JPG"

Step 1: Start with base name (no extension): "DSC_1234"
Step 2: Sequential → sort by date, append number:    "DSC_1234_001"
Step 3: Regex → s/DSC_/IMG_/i:                      "IMG_1234_001"
Step 4: Replace → "1234" → "5678":                   "IMG_5678_001"
Step 5: Prefix → add "holiday_":                     "holiday_IMG_5678_001"
Step 6: Suffix → add "_final":                       "holiday_IMG_5678_001_final"
Step 7: Extension → change to ".png":                "holiday_IMG_5678_001_final.png"

Final new filename: "holiday_IMG_5678_001_final.png"
```

Each step operates on the output of the previous step (pipe-like architecture). Steps whose mode is disabled are skipped.

### Recommended Project Structure

```
rname/src/
├── components/
│   ├── rename/
│   │   ├── RenamePanel.tsx          # Right panel: tab bar + active form
│   │   ├── RenameTabBar.tsx         # Horizontal tab bar (6 tabs, multi-select)
│   │   ├── SequentialForm.tsx       # Sequential mode inputs
│   │   ├── RegexForm.tsx            # Regex mode inputs
│   │   ├── PrefixForm.tsx           # Prefix mode input
│   │   ├── SuffixForm.tsx           # Suffix mode input
│   │   ├── ExtensionForm.tsx        # Extension mode inputs
│   │   ├── ReplaceForm.tsx          # Replace text mode inputs
│   │   └── ConflictBanner.tsx       # Top banner showing conflict count
│   ├── FileList.tsx                 # MODIFIED: add 新文件名 column
│   ├── FileListRow.tsx              # MODIFIED: render diff highlighted cells
│   ├── FileDropZone.tsx             # UNCHANGED
│   └── ...
├── hooks/
│   ├── useFileList.ts               # UNCHANGED (moved to App.tsx level)
│   ├── useRenameEngine.ts           # NEW: core preview computation
│   └── useDebounce.ts               # NEW: 300ms debounce hook
├── types/
│   ├── file.ts                      # UNCHANGED (FileItem)
│   └── rename.ts                    # NEW: RenameModeState, PreviewResult, DiffSegment types
├── utils/
│   ├── formatFileSize.ts            # UNCHANGED
│   └── renamePipeline.ts            # NEW: pure functions for each rename step
├── App.tsx                          # MODIFIED: state root, useFileList + useRenameEngine
├── App.css                          # MODIFIED: add tab/form styles
└── ...
```

### Pattern 1: useDebounce Hook

**What:** Custom React hook that delays value updates until after a specified delay.
**When to use:** Any input that triggers expensive recomputation (here: 300ms for rename preview).

**Why no lodash:** The hook is ~10 lines of TypeScript. Adding lodash.debounce (4KB+) for this is not justified.

**Example:**
```typescript
// Source: standard React pattern (useHooks.io / react.wiki)
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Pattern 2: Rename Engine Pipeline

**What:** Pure function composition that applies enabled rename steps in order.
**When to use:** Every time preview needs recomputing (after debounce settles).

**Key insight:** Each step is a pure `(name: string) => string` function. The engine iterates through enabled modes in order, passing the output of one as input to the next. This makes testing trivial and composition predictable.

```typescript
// Source: custom design for this project
type RenameStep = (name: string) => string;

const modePriority: Array<keyof RenameModeStates> = [
  "sequential", "regex", "replace", "prefix", "suffix", "extension"
];

function computeNewFileName(
  file: FileItem,
  modes: RenameModeStates,
  index: number,          // position in sorted file list (for sequential)
  totalFiles: number      // total for sequential digit calculation
): { newBaseName: string; newExtension: string } {
  let baseName = file.name.replace(`.${file.extension}`, "");
  let newExtension = file.extension;

  for (const mode of modePriority) {
    const config = modes[mode];
    if (!config.enabled) continue;

    switch (mode) {
      case "sequential": {
        const seq = config as SequentialConfig;
        const numStr = (seq.startAt + index).toString()
          .padStart(seq.digits, "0");
        if (seq.position === "after") {
          baseName = `${baseName}_${numStr}`;
        } else {
          baseName = `${numStr}_${baseName}`;
        }
        break;
      }
      case "regex": {
        const r = config as RegexConfig;
        const flags = r.caseSensitive ? "g" : "gi";
        try {
          baseName = baseName.replace(new RegExp(r.pattern, flags), r.replacement);
        } catch { /* invalid regex, skip */ }
        break;
      }
      case "replace": {
        const r = config as ReplaceConfig;
        const flags = r.caseSensitive ? "g" : "gi";
        const escaped = r.findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        baseName = baseName.replace(new RegExp(escaped, flags), r.replaceText);
        break;
      }
      case "prefix":
        baseName = `${(config as PrefixConfig).text}${baseName}`;
        break;
      case "suffix":
        baseName = `${baseName}${(config as SuffixConfig).text}`;
        break;
      case "extension": {
        const ext = config as ExtensionConfig;
        if (ext.mode === "change" && ext.newExtension) {
          newExtension = ext.newExtension;
        } else if (ext.mode === "remove") {
          newExtension = "";
        } else if (ext.mode === "add" && !newExtension) {
          newExtension = ext.newExtension;
        }
        break;
      }
    }
  }

  return { newBaseName: baseName, newExtension };
}
```

### Pattern 3: Diff Highlighting Component

**What:** Render a filename string with `<span>` elements wrapping added/removed word segments.
**When to use:** In the "新文件名" table cell for every file row.

```typescript
// Source: diff library API (npm:diff) + custom rendering
import { diffWords } from "diff";

interface DiffSegment {
  value: string;
  type: "added" | "removed" | "unchanged";
}

function computeDiffSegments(oldName: string, newName: string): DiffSegment[] {
  const changes = diffWords(oldName, newName);
  return changes.map((part) => ({
    value: part.value,
    type: part.added ? "added" : part.removed ? "removed" : "unchanged",
  }));
}

// In the React component:
function DiffCell({ segments }: { segments: DiffSegment[] }) {
  return (
    <span>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={
            seg.type === "added"
              ? "diff-added"
              : seg.type === "removed"
              ? "diff-removed"
              : "diff-unchanged"
          }
        >
          {seg.value}
        </span>
      ))}
    </span>
  );
}
```

### Pattern 4: Multi-Select Tab Bar

**What:** Custom horizontal tab bar where tabs are toggle buttons (not radio). Each tab toggles its mode on/off and expands its form when active.
**When to use:** Only here — the 6 rename mode tab bar.

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  🔢 时间  │  🔍 正则  │  📎 前缀  │  ➕ 后缀  │  📄 扩展名 │  🔄 替换  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
      ▲ active       │                     │
      └── form expanded below              │
                                           └── inactive, no form shown
```

**State shape:**
```typescript
type TabKey = "sequential" | "regex" | "prefix" | "suffix" | "extension" | "replace";

const [activeTabs, setActiveTabs] = useState<Set<TabKey>>(new Set());
const [activeTabForm, setActiveTabForm] = useState<TabKey | null>("sequential");
```

**Behavior:**
- Click inactive tab → add to `activeTabs`, open its form, persist mode config (D-06)
- Click active tab → remove from `activeTabs`, close its form
- At least one mode must remain active? No — user can disable all (none applied, all names unchanged)

### Anti-Patterns to Avoid

- **Too much abstraction:** Don't create a generic "rename step" interface with a registry. The 6 modes are fixed and known. A simple `switch` statement in the pipeline is clearer and easier to debug than a plugin architecture.
- **Recomputing without debounce:** Without 300ms debounce, every keystroke recomputes previews for all 100 files. The diff algorithm is fast, but React re-renders for 100 rows × diff segments would be wasteful.
- **Storing preview results in useState:** Preview is derived data (from `files` + `modes`). Use `useMemo` inside the debounced update, not `useState`. This avoids sync bugs.
- **Using `diffWords` on full filename (including extension):** Per D-03, diff the base name and extension separately to get cleaner highlighting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word-level text diff | Custom LCS algorithm | `diff` (npm) `diffWords()` | LCS is non-trivial to implement correctly for unicode, CJK, punctuation. `diff` is battle-tested with 90M+ weekly downloads. |
| Debounce logic | setTimeout boilerplate in every component | `useDebounce` custom hook | ~10 lines, reusable pattern, cleanly separated |
| Regex parsing | Manual regex string → flags conversion | Built-in `new RegExp()` | Native support for capture groups (`$1`, `$&`), case flags, and error handling via try-catch |

**Key insight:** The rename engine is deceptively simple string manipulation. The real complexity is in the **preview** (diff) and **UX** (multi-select tabs with state persistence, conflict detection). These are the areas to focus engineering effort on.

## Common Pitfalls

### Pitfall 1: State Sync Between Panels
**What goes wrong:** Left panel FileList renders stale preview data because mode changes in right panel haven't propagated.
**Why it happens:** `useFileList` is instantiated inside `FileDropZone`, which is a child of the left panel. Mode state is in the right panel. No shared state.
**How to avoid:** Lift `useFileList` and `useRenameEngine` up to `App.tsx`. Pass `previewResults` as a prop to `FileList`. Both panels read from the same parent state.
**Warning signs:** Preview in left panel doesn't update when typing in right panel.

### Pitfall 2: Debounce Not Cancelling Properly
**What goes wrong:** Stale preview flashes briefly after rapid typing stops.
**Why it happens:** React strict mode double-fires effects, or cleanup doesn't clear the timeout.
**How to avoid:** Always return `clearTimeout(timerId)` from useEffect. For extra safety, use a ref to track the timer. [VERIFIED: react.wiki custom useDebounce]
**Warning signs:** Preview shows intermediate state (e.g., incomplete regex) after typing stops.

### Pitfall 3: Regex Error Crashes Preview
**What goes wrong:** User types an invalid regex pattern (e.g., unmatched `(`), preview crashes entire app.
**Why it happens:** `new RegExp(badPattern)` throws `SyntaxError`.
**How to avoid:** Wrap every `new RegExp()` in try-catch. Show inline error ("正则表达式无效") in the form, and set that file's new name = old name (skip mode).
**Warning signs:** Previews disappear entirely when typing `(` or `[` in regex field.

### Pitfall 4: Conflict Detection Misses Edge Cases
**What goes wrong:** Two files with different original names get the same new name but conflict detection misses it.
**Why it happens:** Case-insensitive filesystem (macOS APFS is case-insensitive by default) — "Photo.JPG" and "photo.JPG" would conflict after rename even though strings differ.
**How to avoid:** Normalize new filenames to lowercase when checking for conflicts. Use a Set-based check: `new Set(newNames.map(n => n.toLowerCase()))`.
**Warning signs:** Two rows show same new name but no conflict warning.

### Pitfall 5: Sequential + Replace Combo Error
**What goes wrong:** User applies sequential (adds `_001`) then replace (replaces `00` with `XX`), corrupting the sequential number.
**Why it happens:** Replace mode operates on the output of sequential mode, and can destroy parts of the sequential number.
**How to avoid:** This is actually correct behavior per D-14 (left-to-right apply). But the UI should show the final result clearly in preview so the user can see what will happen. No code fix needed — preview is the safety net.
**Warning signs:** User complains "the sequential number got corrupted" — explain the order of operations.

## Code Examples

### Example 1: useRenameEngine Hook (Core Preview Computation)

```typescript
// Source: custom design for this project
// File: rname/src/hooks/useRenameEngine.ts

import { useMemo } from "react";
import { diffWords } from "diff";
import type { FileItem } from "../types/file";
import type {
  RenameModeStates,
  PreviewResult,
  DiffSegment,
  SequentialConfig,
  RegexConfig,
  ReplaceConfig,
  PrefixConfig,
  SuffixConfig,
  ExtensionConfig,
} from "../types/rename";
import { applyRenamePipeline } from "../utils/renamePipeline";

export const MODE_ORDER: Array<keyof RenameModeStates> = [
  "sequential",
  "regex",
  "replace",
  "prefix",
  "suffix",
  "extension",
];

function detectConflicts(results: PreviewResult[]): void {
  const seen = new Map<string, number[]>();
  results.forEach((r, i) => {
    const key = r.newFullName.toLowerCase();
    if (seen.has(key)) {
      seen.get(key)!.push(i);
    } else {
      seen.set(key, [i]);
    }
  });
  for (const [, indices] of seen) {
    if (indices.length > 1) {
      for (const idx of indices) {
        results[idx].hasConflict = true;
        results[idx].conflictWith = indices
          .filter((i) => i !== idx)
          .map((i) => results[i].newFullName);
      }
    }
  }
}

export function useRenameEngine(
  files: FileItem[],
  modes: RenameModeStates,
  debounced: boolean // true = value is already debounced
): {
  previews: PreviewResult[];
  totalConflicts: number;
} {
  return useMemo(() => {
    // Sort files by modifiedAt for sequential mode
    const sorted = [...files].sort(
      (a, b) => (a.modifiedAt ?? 0) - (b.modifiedAt ?? 0)
    );

    const previews: PreviewResult[] = sorted.map((file, index) => {
      const oldBaseName = file.name.replace(`.${file.extension}`, "");
      const oldExtension = file.extension;

      const { newBaseName, newExtension } = applyRenamePipeline(
        file,
        modes,
        index,
        files.length
      );

      const newFullName = newExtension
        ? `${newBaseName}.${newExtension}`
        : newBaseName;

      // Compute diff segments for base name and extension separately
      const baseNameDiff = diffWords(oldBaseName, newBaseName);
      const extensionDiff =
        oldExtension !== newExtension
          ? diffWords(
              oldExtension ? `.${oldExtension}` : "(无扩展名)",
              newExtension ? `.${newExtension}` : "(无扩展名)"
            )
          : [{ value: oldExtension ? `.${oldExtension}` : "", added: false, removed: false, count: 1 }];

      const diffBaseName: DiffSegment[] = baseNameDiff.map((p) => ({
        value: p.value,
        type: p.added ? "added" : p.removed ? "removed" : "unchanged",
      }));

      const diffExtension: DiffSegment[] = extensionDiff.map((p) => ({
        value: p.value,
        type: p.added ? "added" : p.removed ? "removed" : "unchanged",
      }));

      return {
        fileId: file.id,
        oldBaseName,
        oldExtension,
        newBaseName,
        newExtension,
        newFullName,
        diffBaseName,
        diffExtension,
        hasConflict: false,
        conflictWith: [],
      };
    });

    detectConflicts(previews);

    const totalConflicts = previews.filter((p) => p.hasConflict).length;
    return { previews, totalConflicts };
  }, [files, modes]);
}
```

### Example 2: Diff-Capable Table Cell

```tsx
// Source: custom component for this project
// File: rname/src/components/DiffCell.tsx

import type { DiffSegment } from "../types/rename";
import "./DiffCell.css";

interface DiffCellProps {
  baseNameSegments: DiffSegment[];
  extensionSegments: DiffSegment[];
  hasConflict: boolean;
}

export function DiffCell({
  baseNameSegments,
  extensionSegments,
  hasConflict,
}: DiffCellProps) {
  return (
    <span className={`diff-cell ${hasConflict ? "diff-conflict" : ""}`}>
      {hasConflict && <span className="conflict-icon">⚠</span>}
      {baseNameSegments.map((seg, i) => (
        <span key={`b-${i}`} className={`diff-${seg.type}`}>
          {seg.value}
        </span>
      ))}
      {extensionSegments.map((seg, i) => (
        <span key={`e-${i}`} className={`diff-${seg.type}`}>
          {seg.value}
        </span>
      ))}
    </span>
  );
}
```

```css
/* File: rname/src/components/DiffCell.css */
.diff-added {
  background-color: #e6ffe6;  /* light green */
  border-radius: 2px;
}

.diff-removed {
  background-color: #ffe6e6;  /* light red */
  border-radius: 2px;
  text-decoration: line-through;
}

.diff-conflict {
  background-color: #fff0f0;
  border: 1px solid #ff4444;
  border-radius: 4px;
  padding: 2px 4px;
}

.conflict-icon {
  margin-right: 4px;
}
```

### Example 3: Conflict Detection (Edge Case Safe)

```typescript
// Source: custom implementation for APFS case-insensitive filesystem
// APFS (macOS default) is case-insensitive. Two filenames that differ
// only in case WILL collide at rename time.

function detectConflicts(results: PreviewResult[]): void {
  const buckets = new Map<string, number[]>();

  results.forEach((r, idx) => {
    // Normalize to lowercase for APFS case-insensitive matching
    const key = r.newFullName.toLowerCase();
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(idx);
  });

  for (const [, indices] of buckets) {
    if (indices.length > 1) {
      for (const idx of indices) {
        results[idx].hasConflict = true;
        results[idx].conflictWith = indices
          .filter((i) => i !== idx)
          .map((i) => results[i].newFullName);
      }
    }
  }
}
```

### Example 4: Multi-Select Tab State Management

```tsx
// Source: custom component for this project
// Simplified state pattern

const [modeStates, setModeStates] = useState<RenameModeStates>({
  sequential: { enabled: false, startAt: 1, digits: 3, separator: "_" },
  regex: { enabled: false, pattern: "", replacement: "", caseSensitive: true },
  replace: { enabled: false, findText: "", replaceText: "", caseSensitive: true },
  prefix: { enabled: false, text: "" },
  suffix: { enabled: false, text: "" },
  extension: { enabled: false, mode: "keep", newExtension: "" },
});

// Toggle mode on/off
function toggleMode(mode: keyof RenameModeStates) {
  setModeStates((prev) => ({
    ...prev,
    [mode]: { ...prev[mode], enabled: !prev[mode].enabled },
  }));
}

// Update mode config (preserves input on tab switch per D-06)
function updateModeConfig<K extends keyof RenameModeStates>(
  mode: K,
  patch: Partial<RenameModeStates[K]>
) {
  setModeStates((prev) => ({
    ...prev,
    [mode]: { ...prev[mode], ...patch },
  }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `lodash.debounce` import | Custom `useDebounce` hook | ~2021+ (React hooks pattern matures) | Smaller bundle, more idiomatic React |
| `react-diff-viewer` for diffs | `diff` library + custom rendering | This project | Full diff viewer is overkill; we only need inline `<span>` highlights in a table cell |
| CSS-in-JS (styled-components) | Plain CSS files | Project decision | Consistent with Phase 1, simpler build setup |

**Deprecated/outdated:**
- `@types/diff`: Not needed since `diff` v8 ships its own TypeScript declarations.
- `react-tabs` or similar tab libraries: Unnecessary for 6 static tabs. A 40-line custom component is smaller and more flexible.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | APFS (macOS default filesystem) is case-insensitive, so conflict detection should use lowercase normalization | Common Pitfalls | If user is on case-sensitive APFS (rare, but possible), conflicts would be falsely detected for same-case-different-files. Mitigation: log a warning during conflict detection with both normalized and non-normalized checks. |
| A2 | `diffWords()` handles Chinese filenames adequately without `Intl.Segmenter` | Pattern 3 | Chinese character sequences may not segment into words correctly without an Intl.Segmenter. Mitigation: The diff will still highlight at the character level (individual CJK chars as "words"), which is visually acceptable. |
| A3 | Built-in `String.replace()` with regex handles all capture group patterns users might try | Example 4 | Edge cases like `$<name>` named capture groups require different syntax. Mitigation: This is standard JS regex behavior — users who know regex will expect this. |
| A4 | No new Tauri permissions needed for Phase 2 | Environment Availability | Phase 3 (Execution) will need `fs:allow-rename`. If Phase 2 accidentally depends on fs operations, this assumption breaks. Mitigation: Review plans before execution to ensure no fs:rename calls leak into Phase 2. |

## Open Questions

1. **How to handle the "no file selected" state per D-08?**
   - What we know: Tab bar and forms should show disabled state with提示 "请先在左侧添加文件"
   - What's unclear: Exact visual treatment — dim the entire right panel? Show overlay? Show inline message in each form?
   - Recommendation: The agent's discretion area. Recommend a centered placeholder message in the right panel (consistent with existing `.placeholder` style in App.css), replaced by tab bar + form when `files.length > 0`.

2. **What icon/emoji for each tab label per D-05?**
   - What we know: D-05 says "单字 + 图标标签"
   - What's unclear: Which specific icons. No icon library is installed (no react-icons, no lucide).
   - Recommendation: Use simple Unicode/emoji icons (🔢 时间, 🔍 正则, 📎 前缀, ➕ 后缀, 📄 扩展名, 🔄 替换). These work without any npm dependency and are cross-platform on macOS.

3. **Should sequential mode affect ALL files or only the files it's applied to?**
   - What we know: Sequential numbers are assigned based on sorted order. D-14 says modes stack.
   - What's unclear: When sequential is enabled alongside other modes, does the sequential number index count ALL files or only a subset? **Decision: ALL files** — the numbering is based on position in the sorted master file list, regardless of other active modes. This is consistent with how batch renamers work.
   - Recommendation: No special handling needed. The numbering always uses the sorted file list index.

## Environment Availability

**Step 2.6: SKIPPED** (no external dependencies beyond existing Node.js/Rust toolchain, which was validated in Phase 1)

Phase 2 adds no new external service, database, or CLI dependencies. The rename engine runs entirely in the browser. The only new npm package (`diff`) is a pure JS library with zero dependencies.

## Validation Architecture

**Skipped:** `workflow.nyquist_validation` is explicitly set to `false` in `.planning/config.json`.

## Security Domain

**Skipped:** Phase 2 operates entirely on client-side string transformations. No file I/O, no network requests, no user data sent anywhere. The rename engine manipulates strings in memory only. Security concerns (file system access validation, path traversal prevention) belong in Phase 3 (Execution) where `fs:rename` is called.

## Sources

### Primary (HIGH confidence)
- npm registry (`diff@9.0.0`): Confirmed version 9.0.0 published 2026-04-13, zero dependencies, built-in TypeScript types
- npm registry (`react@19.2.6`): Confirmed current React version
- npm registry (`@tauri-apps/api@2.11.0`): Confirmed current Tauri API version
- JavaScript built-in `String.replace()`, `new RegExp()`, `String.padStart()`: Native APIs, no library needed
- CONTEXT.md (D-01 through D-17): Locked user decisions for this phase

### Secondary (MEDIUM confidence)
- `diff` library npm README: Confirmed `diffWords()` API, `diffChars()`, change object format, TypeScript support
- React.dev `useMemo` reference: Official React documentation on memoization patterns
- useHooks.io `useDebounce`: Verified standard debounce hook pattern with cleanup

### Tertiary (LOW confidence)
- APFS case-insensitivity for conflict detection: Based on general macOS knowledge. Verify during implementation with a test on case-sensitive APFS volume.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `diff` library is industry standard. Custom hooks are standard React patterns.
- Architecture: HIGH — Lifting state, useMemo for derived data, pure pipeline functions are well-established patterns.
- Pitfalls: MEDIUM — Regex crash handling and conflict detection edge cases are based on experience but unverified against production usage of this specific app.

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (30 days — npm package versions may drift)
