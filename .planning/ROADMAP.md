# Roadmap: Rename

**Created:** 2026-05-13

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 (shipped 2026-05-14)
- ◆ **v1.1 链式重命名** — Phases 4-5 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-05-14</summary>

- [x] Phase 1: File Management (1/1 plan) — completed 2026-05-14
- [x] Phase 2: Rename & Preview (4/4 plans) — completed 2026-05-14
- [x] Phase 3: Execution & Undo (2/2 plans) — completed 2026-05-14

</details>

<details open>
<summary>◆ v1.1 链式重命名 (Phases 4-5)</summary>

### Phase 4: Chain Core — 链式基础架构

**Goal: ** 用户可以添加规则、按顺序计算预览、执行链式重命名
**Requirements:** CHAIN-01, CHAIN-05, CONF-02, EXEC-01, EXEC-03, EXEC-04
**Plans:** 1

**Success criteria:**
1. 用户可以添加规则到规则列表
2. 规则按添加顺序依次计算预览（文件名经过每个规则管道）
3. 链式重命名按规则顺序执行（两阶段安全策略）
4. 链式重命名完成后可一次撤销全部更改
5. 规则列表最多 10 条

### Phase 5: Chain UI — 链式用户界面

**Goal: ** 用户可以通过拖拽排序规则、编辑每条规则的配置、从 Tab 快捷添加
**Requirements:** CHAIN-02, CHAIN-03, CHAIN-04, CONF-01, CONF-03, CONF-04, EXEC-02, EXEC-05
**Plans:** 1

**Success criteria:**
1. 用户可以从规则列表中移除单个规则或清空全部
2. 用户可以通过拖拽调整规则顺序
3. 用户点击规则可编辑其模式参数（表单区域显示选中规则的配置）
4. 活动状态的 Tab 可快捷添加到规则列表
5. 预览中每条规则处理的变更部分有差异化高亮
6. 规则列表为空时执行按钮禁用

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. File Management | v1.0 | 1/1 | Complete | 2026-05-14 |
| 2. Rename & Preview | v1.0 | 4/4 | Complete | 2026-05-14 |
| 3. Execution & Undo | v1.0 | 2/2 | Complete | 2026-05-14 |
| 4. Chain Core | v1.1 | 0/1 | Pending | — |
| 5. Chain UI | v1.1 | 0/1 | Pending | — |

---

*Roadmap created: 2026-05-13 | Last updated: 2026-05-14 (v1.1 roadmap added)*
