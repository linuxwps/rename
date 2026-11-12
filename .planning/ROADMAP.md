# Roadmap: Rename

**Created:** 2026-05-13

## Milestones

- ✅ **v1.0.4 安全与可靠性修正** — Phases 1-3 (shipped 2026-11-12)
- ✅ **v1.1 规则链与列表管理** — Phases 4-5 (shipped 2026-11-12)
- ✅ **v1.2 大目录与工作流增强** — Phases 6-9 (shipped 2026-11-12)

## Phases

<details>
<summary>✅ v1.0.4 安全与可靠性修正 (Phases 1-3) — SHIPPED 2026-11-12</summary>

- [x] Phase 1: File Management (1/1 plan) — completed 2026-05-14
- [x] Phase 2: Rename & Preview (4/4 plans) — completed 2026-05-14
- [x] Phase 3: Execution & Undo (2/2 plans) — completed 2026-05-14

</details>

<details>
<summary>✅ v1.2 大目录与工作流增强 (Phases 6-9) — SHIPPED 2026-11-12</summary>

### Phase 6: Case Rule — 大小写转换规则

- [x] 全部大写、全部小写、单词首字母大写
- [x] 只改主文件名并保留扩展名

### Phase 7: ExifDate Rule — 照片日期规则

- [x] 拍摄时间、创建时间、修改时间三种来源
- [x] 日期格式、回退策略和放置位置

### Phase 8: Large Directory UX — 大目录与批量选择

- [x] 文件复选框、全选和仅处理选中文件
- [x] 手动拖拽排序
- [x] 可变行高虚拟滚动，保留规则步骤展开

### Phase 9: CSV & Logs — CSV 与日志

- [x] CSV 路径和“原路径 + 目标文件名”映射导入
- [x] CSV 重命名计划导出
- [x] 内置最近 300 行日志面板

</details>

<details>
<summary>✅ v1.1 链式重命名 (Phases 4-5) — SHIPPED 2026-11-12</summary>

### Phase 4: Chain Core — 链式基础架构

**Goal: ** 用户可以添加规则、按顺序计算预览、执行链式重命名
**Requirements:** CHAIN-01, CHAIN-05, CONF-02, EXEC-01, EXEC-03, EXEC-04
**Plans:** 1

- [x] Phase 4 complete

**Success criteria:**
1. 用户可以添加规则到规则列表
2. 规则按添加顺序依次计算预览（文件名经过每个规则管道）
3. 链式重命名按规则顺序执行（两阶段安全策略）
4. 链式重命名完成后可一次撤销全部更改
5. 规则列表最多 10 条

### Phase 5: Chain UI — 链式用户界面

**Goal: ** 用户可以通过拖拽排序规则、编辑每条规则的配置、从 Tab 快捷添加
**Requirements:** CHAIN-02, CHAIN-03, CHAIN-04, CONF-01, CONF-03, CONF-04, EXEC-02, EXEC-05, PRES-01
**Plans:** 1

- [x] Phase 5 complete

**Success criteria:**
1. 用户可以从规则列表中移除单个规则或清空全部
2. 用户可以通过拖拽调整规则顺序
3. 用户点击规则可编辑其模式参数（表单区域显示选中规则的配置）
4. 活动状态的 Tab 可快捷添加到规则列表
5. 预览中每条规则处理的变更部分有差异化高亮
6. 规则列表为空时执行按钮禁用
7. 常用规则链可保存为本地预设，并支持加载和删除

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. File Management | v1.0.4 | 1/1 | Complete | 2026-05-14 |
| 2. Rename & Preview | v1.0.4 | 4/4 | Complete | 2026-05-14 |
| 3. Execution & Undo | v1.0.4 | 2/2 | Complete | 2026-05-14 |
| 4. Chain Core | v1.1 | 1/1 | Complete | 2026-11-12 |
| 5. Chain UI | v1.1 | 1/1 | Complete | 2026-11-12 |
| 6. Case Rule | v1.2 | 1/1 | Complete | 2026-11-12 |
| 7. ExifDate Rule | v1.2 | 1/1 | Complete | 2026-11-12 |
| 8. Large Directory UX | v1.2 | 1/1 | Complete | 2026-11-12 |
| 9. CSV & Logs | v1.2 | 1/1 | Complete | 2026-11-12 |

---

*Roadmap created: 2026-05-13 | Last updated: 2026-11-12 (v1.2 shipped)*
