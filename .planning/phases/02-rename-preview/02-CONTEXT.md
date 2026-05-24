# Phase 2: Rename & Preview - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

用户在右侧面板使用 6 种重命名模式并实时预览效果。左侧文件列表（Phase 1）已就绪，Phase 2 填充右侧 2/3 区域的重命名 UI 和预览功能。
</domain>

<decisions>
## Implementation Decisions

### 预览显示方式
- **D-01:** 在 FileList 表格中新增"新文件名"列，展示完整的重命名后文件名
- **D-02:** 对"新文件名"列中的变化部分做词段级颜色高亮（新增文字绿色背景，删除文字红色背景）
- **D-03:** 扩展名和文件名的变化分别高亮

### 重命名模式切换
- **D-04:** 顶部 Tab 栏切换 6 种模式（水平标签栏），类似浏览器标签
- **D-05:** 单字 + 图标标签：时间、正则、前缀、后缀、扩展名、替换
- **D-06:** 切换 Tab 时保留之前的输入内容，切回来时恢复

### 预览更新时机
- **D-07:** 300ms 防抖更新，输入停止后自动刷新预览
- **D-08:** 没有选择文件时，Tab 和输入框显示禁用提示"请先在左侧添加文件"

### 重名冲突显示
- **D-09:** 顶部横幅显示"发现 N 个重名文件"计数
- **D-10:** 冲突行在"新文件名"列中红色高亮 + ⚠ 图标
- **D-11:** 存在重名冲突时，执行按钮禁用（Phase 3 实现执行按钮，此行为同步记录）

### 模式组合方式
- **D-12:** 6 种模式可叠加使用，每个 Tab 可独立启用/禁用
- **D-13:** 多选 Tab：亮起表示该模式已启用，点击展开输入表单
- **D-14:** 应用顺序按 Tab 从左到右依次应用（时间→正则→替换→前缀→后缀→扩展名）

### Sequential 默认值
- **D-15:** 序号起始值从 1 开始
- **D-16:** 默认 3 位固定（001, 002, 003...），用户可调整
- **D-17:** 序号默认放在文件名后（文件名_001.jpg）

### the agent's Discretion
- 高亮颜色具体色值（绿色/红色背景）
- 防抖具体实现方式（useDebounce hook 或 lodash）
- 顶部 Tab 栏的具体样式和间距
- 每个 Tab 输入表单的具体布局
- 模式叠加时预览缓存策略（避免重复计算）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目背景
- `.planning/PROJECT.md` — 项目目标、约束条件、UI 布局要求
- `.planning/REQUIREMENTS.md` — PREV-01~03, SEQ-01~04, REGE-01~03, PREF-01~02, SUFF-01~02, EXT-01~03, REPL-01~03 需求定义
- `.planning/ROADMAP.md` — Phase 2 目标和依赖关系

### Phase 1 上下文
- `.planning/phases/01-file-management/01-CONTEXT.md` — Phase 1 决策（D-01~D-06）
- `.planning/phases/01-file-management/01-01-SUMMARY.md` — Phase 1 实现总结

### 现有代码
- `rname/src/hooks/useFileList.ts` — 文件列表 hook，提供 files 状态管理
- `rname/src/types/file.ts` — FileItem 接口定义
- `rname/src/components/FileList.tsx` — 文件列表表格组件
- `rname/src/App.tsx` — 主布局，左右面板结构

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useFileList` hook — `files: FileItem[]` 是预览引擎的核心数据源
- `FileList` / `FileListRow` 组件 — 新增"新文件名"列时需要扩展
- `formatFileSize` utility — 已有文件大小格式化，可复用

### Established Patterns
- 文件元数据通过 Tauri plugin-fs `stat()` 获取
- React hooks + functional components
- 独立 CSS 文件（非 CSS-in-JS）

### Integration Points
- `App.tsx:10-13` — 当前 `.right-panel` 是占位符 `<p>rename options will appear here</p>`，需要替换为重命名 UI
- `FileDropZone.tsx` — 在 files 不为空时渲染 `<FileList />`，FileList 需要接收预览数据
- `FileList.tsx` — 需要新增"新文件名"列和冲突显示

</code_context>

<specifics>
## Specific Ideas

- 预览数据需要在右面板生成后传递到左面板的 FileList 组件
- 右侧面板布局：顶部 Tab 栏 → 当前 Tab 的输入表单 → 底部预览区（可选）
- 右面板应该和现有左面板风格一致
- 输入框变化触发 300ms 防抖后更新预览

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-Rename & Preview*
*Context gathered: 2026-05-14*
