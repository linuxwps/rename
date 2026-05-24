# Rename

## What This Is

macOS 平台的批量重命名工具，帮助用户快速整理照片、文档、下载文件。支持 6 种重命名方式，提供预览和撤销功能。

## Core Value

让日常文件整理变得高效简单，一键批量重命名，错了还能撤销。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 文件列表管理（拖入或文件管理器选择）
- [ ] 6 种重命名方式（按时间、正则、前缀、后缀、拓展名、替换）
- [ ] 预览功能（原文件名 → 新文件名对比）
- [ ] 原地覆盖重命名
- [ ] 撤销功能

### Out of Scope

- [云同步功能] — 非核心，后期考虑
- [批处理脚本导入] — 复杂度高，v1 暂不包含

## Context

- 目标平台：macOS（M 系列芯片）
- 用户场景：日常整理照片、文档、下载文件

## Constraints

- **平台**: macOS (Apple Silicon) — 原生支持 M 系列芯片
- **UI 框架**: 左右分段布局，左侧 1/3 文件列表，右侧 2/3 选项卡区域

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 原地覆盖重命名 | 用户明确需求，保持文件位置不变 | — Pending |
| 6 个选项卡设计 | 用户明确需求，覆盖常见重命名场景 | — Pending |
| 撤销功能 | 用户明确需求，防止误操作 | — Pending |

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
*Last updated: 2026-05-13 after initialization*