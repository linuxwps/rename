# Roadmap: Rename

**Created:** 2026-05-13
**Phases:** 3
**Granularity:** coarse
**Coverage:** 30/30 requirements mapped ✓

## Phases

- [ ] **Phase 1: File Management** - 用户可以添加和管理文件列表
- [ ] **Phase 2: Rename & Preview** - 用户可以使用6种重命名方式并实时预览效果
- [ ] **Phase 3: Execution & Undo** - 用户可以执行重命名并撤销错误操作

## Phase Details

### Phase 1: File Management
**Goal**: 用户可以添加和管理文件列表
**Depends on**: Nothing (first phase)
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05
**Success Criteria** (what must be TRUE):
  1. 用户可以通过拖拽将文件从 Finder 拖入应用
  2. 用户可以通过文件选择器对话框选择文件
  3. 文件列表显示文件名、扩展名、文件大小、修改日期
  4. 用户可以从列表中移除单个文件
  5. 用户可以清空文件列表
**Plans**: 1 plan
- [x] 01-01-PLAN.md — Initialize Tauri project and implement file management (drag-drop, picker, list, remove/clear)

### Phase 2: Rename & Preview
**Goal**: 用户可以使用6种重命名方式并实时预览效果
**Depends on**: Phase 1
**Requirements**: PREV-01, PREV-02, PREV-03, SEQ-01, SEQ-02, SEQ-03, SEQ-04, REGE-01, REGE-02, REGE-03, PREF-01, PREF-02, SUFF-01, SUFF-02, EXT-01, EXT-02, EXT-03, REPL-01, REPL-02, REPL-03
**Success Criteria** (what must be TRUE):
  1. 实时显示原文件名 → 新文件名的对比
  2. 高亮显示变化部分（新增绿色，删除红色）
  3. 检测并显示重名冲突
  4. 用户可以使用按时间顺序重命名（设置起始值、位数、位置）
  5. 用户可以使用正则替换（支持捕获组、区分大小写）
  6. 用户可以添加前缀
  7. 用户可以添加后缀（在扩展名前）
  8. 用户可以修改/移除/添加扩展名
  9. 用户可以替换文字（区分大小写选项）
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Foundation layer: types, hooks, rename pipeline, debounce, diff install
- [x] 02-02-PLAN.md — Core UI: DiffCell, ConflictBanner, RenameTabBar, RenamePanel
- [x] 02-03-PLAN.md — Mode forms: 6 mode input components + shared form CSS
- [x] 02-04-PLAN.md — Integration: state lift to App.tsx, FileList preview column, wiring

### Phase 3: Execution & Undo
**Goal**: 用户可以执行重命名并撤销错误操作
**Depends on**: Phase 2
**Requirements**: EXEC-01, EXEC-02, EXEC-03, UNDO-01, UNDO-02
**Success Criteria** (what must be TRUE):
   1. 用户点击执行按钮后原地覆盖重命名
   2. 执行前验证所有文件名有效
   3. 执行后更新文件列表
   4. 用户可以撤销最近一次批量重命名
   5. 撤销恢复原文件名和位置
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Execution engine: useRenameExecutor hook, undo snapshot, fix useFileList, Tauri permissions
- [x] 03-02-PLAN.md — Execution UI: ActionBar, Toast, FileList result indicators, App.tsx wiring

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. File Management | 1/1 | Complete | ✅ |
| 2. Rename & Preview | 4/4 | Complete | ✅ |
| 3. Execution & Undo | 0/2 | Planning complete | - |

---

*Roadmap created: 2026-05-13*