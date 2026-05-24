# Phase 2: Rename & Preview - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 2-Rename & Preview
**Areas discussed:** 预览显示方式, 重命名模式切换, 预览更新时机, 重名冲突显示, 模式组合方式, Sequential 默认值

---

## 预览显示方式

| Option | Description | Selected |
|--------|-------------|----------|
| 新增列 | 在 FileList 表格中新增"新文件名"列 | |
| 行内对比 | 每行显示"原文件名 → 新文件名"箭头形式 | |
| 两种结合 | 新增列展示完整新文件名，同时词段级颜色高亮 | ✓ |

**User's choice:** 两种结合
**Notes:** 新增"新文件名"列 + 词段级高亮（新增绿、删除红），扩展名和文件名分别高亮

---

## 重命名模式切换

| Option | Description | Selected |
|--------|-------------|----------|
| 顶部 Tab 栏 | 水平 Tab 在右面板顶部 | ✓ |
| 左侧纵向 Tab | 右面板左侧纵向标签栏 | |
| 下拉选择 | 顶部下拉框选择，下方动态渲染表单 | |

**User's choice:** 顶部 Tab 栏
**Notes:** 切换 Tab 保留输入内容；单字+图标标签：时间、正则、前缀、后缀、扩展名、替换

---

## 预览更新时机

| Option | Description | Selected |
|--------|-------------|----------|
| 实时更新 | 输入框变化立即更新 | |
| 防抖更新 | 300ms 防抖 | ✓ |
| 手动按钮 | 点击"预览"才触发 | |

**User's choice:** 防抖更新
**Notes:** 300ms 防抖，无文件时显示禁用提示

---

## 重名冲突显示

| Option | Description | Selected |
|--------|-------------|----------|
| 行内红色警告 | 红色 + ⚠ 图标在冲突行 | |
| 顶部横幅 | 页面上方红色横幅计数 | |
| 两种结合 | 顶部横幅 + 行内红色高亮 | ✓ |

**User's choice:** 两种结合
**Notes:** 存在冲突时禁止执行（执行按钮禁用）

---

## 模式组合方式

| Option | Description | Selected |
|--------|-------------|----------|
| 单一模式 | 每次只能选一种，Tab 切换 | |
| 可叠加 | 多选 Tab，亮起启用 | ✓ |

**User's choice:** 可叠加
**Notes:** Tab 勾选模式，从左到右顺序应用；Tab 亮起=启用，点击展开输入表单；保留所有启用 Tab 的输入

---

## Sequential 默认值

| Question | Answer |
|----------|--------|
| 序号起始值 | 从 1 开始 |
| 默认位数 | 3 位固定（001, 002...） |
| 序号位置 | 文件名后（文件名_001.jpg） |

**Notes:** 用户可调整这些默认值

---

## the agent's Discretion

- 高亮颜色具体色值
- 防抖具体实现方式
- Tab 栏样式和间距
- 各 Tab 输入表单布局
- 预览缓存策略

## Deferred Ideas

None.
