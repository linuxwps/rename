# Rename

## What This Is

macOS 平台的批量重命名工具，帮助用户快速整理照片、文档、下载文件。支持 6 种重命名方式，提供实时预览、词级差异高亮和撤销功能。

## Core Value

让日常文件整理变得高效简单，一键批量重命名，错了还能撤销。

## Current Milestone: v1.1 链式重命名

**Goal:** 用户可以组合多个重命名规则，按顺序依次应用到文件名上

**Target features:**
- 链式规则列表（左侧规则面板，可拖拽排序）
- 规则依次应用（管道式处理）
- 实时预览每个规则的效果
- 每个规则可独立配置参数
- 限制 5-10 个规则

## Requirements

### Validated

- ✓ 文件列表管理（拖入或文件管理器选择）— v1.0
- ✓ 6 种重命名方式（按时间、正则、前缀、后缀、拓展名、替换）— v1.0
- ✓ 预览功能（原文件名 → 新文件名对比，词级高亮）— v1.0
- ✓ 原地覆盖重命名（两阶段安全策略）— v1.0
- ✓ 撤销功能（快照持久化到文件系统）— v1.0

### Active

- [ ] **CHAIN-01**: 用户可以向链式规则列表添加一个重命名规则（从 6 种模式中选择）
- [ ] **CHAIN-02**: 用户可以从规则列表中移除单个规则
- [ ] **CHAIN-03**: 用户可以清空所有规则
- [ ] **CHAIN-04**: 用户可以通过拖拽调整规则顺序
- [ ] **CHAIN-05**: 每条规则可以选择 6 种重命名模式之一
- [ ] **CHAIN-06**: 每条规则可独立配置其模式参数
- [ ] **CHAIN-07**: 规则列表限制最多 10 条
- [ ] **CHAIN-08**: 文件名依次经过每条规则处理，预览展示最终结果
- [ ] **CHAIN-09**: 执行时按规则顺序依次应用所有规则
- [ ] **CHAIN-10**: 链式重命名完成后可正常撤销

### Future (beyond v1.1)

- 支持使用照片 EXIF 日期重命名
- 支持保存/加载重命名预设
- 支持大小写转换（全部大写/小写/首字母大写）
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
- **代码规模**: 27 个源文件, 2437 LOC TypeScript/CSS
- **实现状态**: 30/30 v1 需求全部实现, TypeScript 编译零错误
- **开发周期**: ~16 小时 (2026-05-13 → 2026-05-14)
- **提交数**: 43 次原子提交

## Constraints

- **平台**: macOS (Apple Silicon) — 原生支持 M 系列芯片
- **UI 框架**: 左右分段布局，左侧 1/3 文件列表，右侧 2/3 选项卡区域

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 原地覆盖重命名 | 用户明确需求，保持文件位置不变 | ✓ Good |
| 6 个选项卡设计 | 用户明确需求，覆盖常见重命名场景 | ✓ Good |
| 撤销功能 | 用户明确需求，防止误操作 | ✓ Good |
| 两阶段重命名策略 | 防止中间状态文件冲突（UUID temp → final） | ✓ Good |
| 撤销快照持久化 | 支持应用崩溃后恢复撤销能力 | ✓ Good |
| 300ms 防抖 | 平衡实时预览与性能 | ✓ Good |
| APFS 不区分大小写冲突检测 | macOS 默认文件系统特性 | ✓ Good |
| 链式规则列表（左侧规则面板，拖拽排序） | 用户明确需求，v1.1 核心功能 | — Pending |

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

*Last updated: 2026-05-14 after v1.1 milestone start*
