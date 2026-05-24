# Requirements: Rename v1.1

**Defined:** 2026-05-14
**Core Value:** 让日常文件整理变得高效简单，一键批量重命名，错了还能撤销。

## v1.1 Requirements

### 规则管理 (Chain)

- [ ] **CHAIN-01**: 用户可以从 6 种重命名模式中选择一个添加到规则列表
- [ ] **CHAIN-02**: 用户可以从规则列表中移除单个规则
- [ ] **CHAIN-03**: 用户可以清空规则列表
- [ ] **CHAIN-04**: 用户可以通过拖拽调整规则顺序
- [ ] **CHAIN-05**: 规则列表最多允许 10 条规则

### 规则配置 (Config)

- [ ] **CONF-01**: 用户点击规则列表中的规则可在右侧表单区域编辑其参数
- [ ] **CONF-02**: 每条规则独立保存其模式参数配置
- [ ] **CONF-03**: 当前处于活动状态的 Tab 可快捷添加到规则列表
- [ ] **CONF-04**: 从规则列表移除规则不影响其他规则的配置

### 预览与执行 (Execute)

- [ ] **EXEC-01**: 预览按规则顺序（第一条到最后一条）依次计算新文件名
- [ ] **EXEC-02**: 预览中每条规则的变更部分有差异化高亮
- [ ] **EXEC-03**: 执行重命名时按规则顺序依次应用所有规则
- [ ] **EXEC-04**: 链式重命名完成后可正常撤销（一次撤销全部）
- [ ] **EXEC-05**: 规则列表为空时禁用执行按钮

## v2 Requirements

Deferred to future release.

- **EXIF-01**: 支持使用照片 EXIF 日期重命名
- **EXIF-02**: 支持使用照片相机型号重命名
- **PRES-01**: 支持保存/加载重命名预设
- **CASE-01**: 支持大小写转换（全部大写/小写/首字母大写）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 云同步功能 | 非核心，后期考虑 |
| 批处理脚本导入 | 复杂度高 |
| AI 内容分析 | 需要外部依赖 |
| 文件夹监控 | 后台处理增加复杂度 |
| 跨平台 (Windows) | 目标平台仅为 macOS |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAIN-01 | Phase 4 | Pending |
| CHAIN-02 | Phase 5 | Pending |
| CHAIN-03 | Phase 5 | Pending |
| CHAIN-04 | Phase 5 | Pending |
| CHAIN-05 | Phase 4 | Pending |
| CONF-01 | Phase 5 | Pending |
| CONF-02 | Phase 4 | Pending |
| CONF-03 | Phase 5 | Pending |
| CONF-04 | Phase 5 | Pending |
| EXEC-01 | Phase 4 | Pending |
| EXEC-02 | Phase 5 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| EXEC-05 | Phase 5 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-14 after initial definition*
