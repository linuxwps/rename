# Rename

## What This Is

macOS 平台的批量重命名工具，帮助用户快速整理照片、文档和下载文件。支持 8 种重命名方式、规则链、文件选择与排序、虚拟滚动、CSV 工作流和可回滚撤销。

## Core Value

让日常文件整理变得高效简单，一键批量重命名，错了还能撤销。

## Current Milestone: v1.2 大目录与工作流增强

**Goal:** 在安全重命名和规则链基础上，支持大目录、批量选择、CSV 工作流、照片日期命名和应用内日志。

**Target features:**
- 文件复选与仅处理选中项
- 添加顺序、手动拖拽和名称升降序
- 可变行高虚拟滚动
- CSV 路径与目标名映射导入、重命名计划导出
- EXIF 日期和大小写转换规则
- 最近 300 行应用内日志

## Requirements

### Validated

- ✓ 文件列表管理（拖入或文件管理器选择）— v1.0
- ✓ 8 种重命名规则（序号、正则、前缀、后缀、扩展名、替换、大小写、EXIF 日期）— v1.2
- ✓ 预览功能（原文件名 → 新文件名对比，词级高亮）— v1.0
- ✓ 整批预检、原生排他重命名、失败逆序回滚和持久化撤销— v1.0.4
- ✓ 规则链、预设、文件选择与可见排序— v1.1
- ✓ 大目录虚拟滚动、CSV 导入导出和应用内日志— v1.2

### Active

None. v1.0.4、v1.1 和 v1.2 的计划内需求均已实现。

### Future (beyond v1.2)

- 支持使用照片相机型号重命名

### Out of Scope

| Feature | Reason |
|---------|--------|
| 云同步功能 | 非核心，后期考虑 |
| 批处理脚本导入 | 复杂度高，v1 暂不包含 |
| AI 内容分析 | 需要外部依赖，非 pattern-based |
| 文件夹监控 | 后台处理增加复杂度 |
| 跨平台 (Windows) | 目标平台仅为 macOS |

## Context

- **目标平台**: macOS (Apple Silicon, M 系列芯片)
- **技术栈**: Tauri v2 + React 19 + TypeScript + Vite
- **实现状态**: v1.0.4、v1.1、v1.2 共 38 项需求全部完成
- **验证状态**: 31 项前端测试、7 项 Rust 测试、生产构建和 Tauri 调试构建通过
- **当前版本**: 1.2.0

## Constraints

- **平台**: macOS (Apple Silicon) — 原生支持 M 系列芯片
- **UI 框架**: 左右分段布局，左侧 1/3 文件列表，右侧 2/3 选项卡区域

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 原地覆盖重命名 | 用户明确需求，保持文件位置不变 | ✓ Good |
| 8 种规则覆盖 | 覆盖常见命名场景，并支持后续通过规则链组合 | ✓ Good |
| 原生排他重命名 | 从文件系统层阻止覆盖已有目标 | ✓ Good |
| 整批预检与逆序回滚 | 在执行前发现冲突，并在中途失败时恢复已完成文件 | ✓ Good |
| 撤销快照持久化 | 支持应用崩溃后恢复撤销能力 | ✓ Good |
| 300ms 防抖 | 平衡实时预览与性能 | ✓ Good |
| APFS 不区分大小写冲突检测 | macOS 默认文件系统特性 | ✓ Good |
| 可见顺序驱动序号 | 用户在预览中看到的顺序与执行顺序保持一致 | ✓ Good |
| 可变行高虚拟滚动 | 限制大目录的实际渲染量并保留规则步骤展开 | ✓ Good |
| Rust 托管 CSV 对话框 | 避免向 WebView 开放任意路径写入权限 | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-11-12 after v1.2 verification*
