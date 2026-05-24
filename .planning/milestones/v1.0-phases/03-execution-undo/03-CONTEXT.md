# Phase 3: Execution & Undo - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

执行批量重命名操作并支持撤销。用户配置好重命名规则（Phase 2）并预览结果后，点击执行按钮触发实际的文件系统重命名操作，执行后可通过撤销恢复原文件名。

</domain>

<decisions>
## Implementation Decisions

### 执行按钮位置
- **D-01:** 执行按钮固定在右侧面板底部，作为全宽操作栏，包含执行按钮、撤销按钮和冲突计数
- **D-02:** 撤销按钮在执行完成后才显示，执行前隐藏
- **D-03:** 点击执行按钮后直接执行，无确认对话框——撤销即是安全保障

### 执行反馈
- **D-04:** 执行期间按钮显示"重命名中..."加旋转动画
- **D-05:** 执行完成后显示短暂提示通知（toast）+ 行内 ✓/✗ 状态
- **D-06:** 文件列表每行显示执行结果（成功/失败）

### 错误处理
- **D-07:** 遇到第一个错误立即停止执行（stop on first error），已成功重命名的文件保持现状
- **D-08:** 使用两阶段重命名策略（先重命名为临时 UUID 名称，再重命名为最终名称），避免中间状态冲突
- **D-09:** 撤销也使用相应的逆序两阶段恢复策略

### 撤销行为
- **D-10:** 撤销快照持久化到文件系统（JSON 文件写入临时目录），支持重启后恢复
- **D-11:** 单次撤销级别——仅撤销最近一次批量重命名
- **D-12:** 撤销恢复时使用逆两阶段策略，确保安全恢复

### D-11 延续（来自 Phase 2）
- **D-13:** 存在重名冲突时，执行按钮禁用（Phase 2 D-11 同步延续）

### the agent's Discretion
- 操作栏的具体样式（高度、颜色、圆角）
- Toast 通知的具体位置和消失时长
- 撤销快照 JSON 的文件路径和命名规则
- 临时 UUID 名称的生成策略
- Tauri capabilities 的具体权限配置（fs:allow-rename 等）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目背景
- `.planning/PROJECT.md` — 项目目标、约束条件
- `.planning/REQUIREMENTS.md` — EXEC-01~03, UNDO-01~02 需求定义
- `.planning/ROADMAP.md` — Phase 3 目标和依赖关系（依赖 Phase 2）

### Phase 2 上下文
- `.planning/phases/02-rename-preview/02-CONTEXT.md` — Phase 2 决策，特别是 D-11（冲突时禁用执行）
- `.planning/phases/02-rename-preview/02-04-SUMMARY.md` — Phase 2 集成层实现总结

### 现有代码
- `rname/src/hooks/useRenameEngine.ts` — 预览计算引擎，提供 PreviewResult（old/new 文件名）
- `rname/src/types/rename.ts` — PreviewResult 接口定义（fileId, newFullName, hasConflict）
- `rname/src/components/rename/RenamePanel.tsx` — 右侧面板组件，需添加底部操作栏
- `rname/src/hooks/useFileList.ts` — 文件列表状态管理，执行后需要更新文件列表
- `rname/src/App.tsx` — 主布局，连接所有组件
- `rname/src-tauri/capabilities/main.json` — Tauri 权限配置，需要添加 fs:allow-rename

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useRenameEngine` hook — 返回 `{ previews, totalConflicts }`，执行时使用其计算的 `newFullName`
- `PreviewResult` — 包含 `fileId`, `oldBaseName`, `newFullName`, `hasConflict`, `conflictWith`——执行器从这些字段驱动实际重命名
- `FileItem` — 包含 `path`（完整路径），用于文件系统操作
- `RenamePanel` — 已有布局（ConflictBanner + RenameTabBar + form-area），需添加底部操作栏
- `useDebounce` hook — 可在撤销按钮交互中复用

### Established Patterns
- 文件操作通过 Tauri plugin-fs 完成（stat, readDir 已在使用）
- React hooks + functional components
- 独立 CSS 文件

### Integration Points
- `App.tsx` — useFileList 和 useRenameEngine 已在此提升状态，执行逻辑需连接两者
- `RenamePanel.tsx` — 需要添加 `executeRename` 和 `undoRename` 回调 props
- `RenamePanel.css` — 需要添加操作栏样式（全宽底部 bar）

</code_context>

<specifics>
## Specific Ideas

- 执行按钮和撤销按钮并排放在底部操作栏左侧或居中
- 冲突计数显示在操作栏中，格式如"发现 N 个重名文件"
- 操作栏高度约 48px，与现有 UI 风格一致
- 执行成功后更新 FileList 中的文件名显示为新名称

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 3-Execution & Undo*
*Context gathered: 2026-05-14*
