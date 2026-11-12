# Requirements: Rename v1.0.4 / v1.1 / v1.2

**Defined:** 2026-05-14
**Core Value:** 让日常文件整理变得高效简单，一键批量重命名，错了还能撤销。

## v1.0.4 Requirements

### 安全与可靠性 (Safety)

- [x] **SAFE-01**: 使用原生排他重命名禁止覆盖已存在目标
- [x] **SAFE-02**: 执行前完成整批来源、目标、重名和链式名称预检
- [x] **SAFE-03**: 中途失败时逆序回滚已完成操作
- [x] **SAFE-04**: 撤销快照持久化每个文件的 planned / pending / completed / failed 状态
- [x] **SAFE-05**: 支持隐藏文件、正确自然排序并移除 100 文件处理上限

## v1.1 Requirements

### 规则管理 (Chain)

- [x] **CHAIN-01**: 用户可以从 8 种重命名模式中选择一个添加到规则列表
- [x] **CHAIN-02**: 用户可以从规则列表中移除单个规则
- [x] **CHAIN-03**: 用户可以清空规则列表
- [x] **CHAIN-04**: 用户可以通过拖拽调整规则顺序
- [x] **CHAIN-05**: 规则列表最多允许 10 条规则

### 预设管理 (Presets)

- [x] **PRES-01**: 用户可以保存、加载和删除常用重命名规则预设

### 列表管理 (List)

- [x] **LIST-01**: 用户可以勾选单个文件、全选或取消全选，并只处理选中项
- [x] **LIST-02**: 用户可以按添加顺序、手动拖拽或名称升降序查看文件
- [x] **LIST-03**: 选中文件沿用当前可见顺序，因此名称排序和手动排序会影响序号规则计算

### 规则配置 (Config)

- [x] **CONF-01**: 用户点击规则列表中的规则可在右侧表单区域编辑其参数
- [x] **CONF-02**: 每条规则独立保存其模式参数配置
- [x] **CONF-03**: 当前处于活动状态的 Tab 可快捷添加到规则列表
- [x] **CONF-04**: 从规则列表移除规则不影响其他规则的配置

### 预览与执行 (Execute)

- [x] **EXEC-01**: 预览按规则顺序（第一条到最后一条）依次计算新文件名
- [x] **EXEC-02**: 预览中每条规则的变更部分有差异化高亮
- [x] **EXEC-03**: 执行重命名时按规则顺序依次应用所有规则
- [x] **EXEC-04**: 链式重命名完成后可正常撤销（一次撤销全部）
- [x] **EXEC-05**: 规则列表为空时禁用执行按钮

## v1.2 Requirements

### 大小写转换 (Case)

- [x] **CASE-01**: 支持全部大写、全部小写和单词首字母大写，且保留扩展名

### 照片日期重命名 (ExifDate)

- [x] **EXIF-01**: 支持使用照片拍摄时间、创建时间或修改时间重命名
- [x] **EXIF-02**: 拍摄时间缺失时可自动回退到创建时间、修改时间，或严格报错阻止执行
- [x] **EXIF-03**: 支持 YYYYMMDD、YYYY-MM-DD、YYYYMMDD_HHmmss 三种日期格式
- [x] **EXIF-04**: 日期可放在文件名前、后或替换原文件名，扩展名保持不变
- [x] **EXIF-05**: 支持 JPEG/HEIC/PNG/WebP/TIFF/AVIF 等常见图片格式的 EXIF 拍摄时间读取

### 大目录处理 (Performance)

- [x] **PERF-01**: 文件列表使用可变行高虚拟滚动，仅渲染视口附近项目
- [x] **PERF-02**: 文件元数据按批次异步读取，避免一次性阻塞

### CSV 工作流 (CSV)

- [x] **CSV-01**: 导入路径列表或“原路径 + 目标文件名”映射，并应用到预览和执行
- [x] **CSV-02**: 导出原路径、原名、新名、大小、修改时间和冲突状态

### 日志 (Logs)

- [x] **LOG-01**: 内置日志面板，查看最近 300 行日志
- [x] **LOG-02**: 记录启动、CSV、预检、执行、回滚、撤销和错误事件

## v2 Requirements

Deferred to future release.

- **EXIF-06**: 支持使用照片相机型号重命名

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
| CHAIN-01 | Phase 4 | Complete |
| CHAIN-02 | Phase 5 | Complete |
| CHAIN-03 | Phase 5 | Complete |
| CHAIN-04 | Phase 5 | Complete |
| CHAIN-05 | Phase 4 | Complete |
| LIST-01 | Phase 8 | Complete |
| LIST-02 | Phase 8 | Complete |
| LIST-03 | Phase 8 | Complete |
| CONF-01 | Phase 5 | Complete |
| CONF-02 | Phase 4 | Complete |
| CONF-03 | Phase 5 | Complete |
| CONF-04 | Phase 5 | Complete |
| EXEC-01 | Phase 4 | Complete |
| EXEC-02 | Phase 5 | Complete |
| EXEC-03 | Phase 4 | Complete |
| EXEC-04 | Phase 4 | Complete |
| EXEC-05 | Phase 5 | Complete |
| PRES-01 | Phase 5 | Complete |
| CASE-01 | Phase 6 | Complete |
| EXIF-01 | Phase 7 | Complete |
| EXIF-02 | Phase 7 | Complete |
| EXIF-03 | Phase 7 | Complete |
| EXIF-04 | Phase 7 | Complete |
| EXIF-05 | Phase 7 | Complete |
| PERF-01 | Phase 8 | Complete |
| PERF-02 | Phase 8 | Complete |
| CSV-01 | Phase 9 | Complete |
| CSV-02 | Phase 9 | Complete |
| LOG-01 | Phase 9 | Complete |
| LOG-02 | Phase 9 | Complete |
| SAFE-01 | Phase 3 | Complete |
| SAFE-02 | Phase 3 | Complete |
| SAFE-03 | Phase 3 | Complete |
| SAFE-04 | Phase 3 | Complete |
| SAFE-05 | Phase 3 | Complete |

**Coverage:**
- v1.0.4 requirements: 5 total
- v1.1 requirements: 18 total
- v1.2 requirements: 15 total
- mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-11-12 after v1.2 large-directory, CSV and logging implementation*
