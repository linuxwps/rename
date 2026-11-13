# Rename

批量文件重命名工具，基于 Tauri v2 构建。

[![Latest release](https://img.shields.io/github/v/release/linuxwps/rename)](https://github.com/linuxwps/rename/releases/latest)
[![Build](https://github.com/linuxwps/rename/actions/workflows/build.yml/badge.svg)](https://github.com/linuxwps/rename/actions/workflows/build.yml)

最新版本：**v1.2.1** · [查看 Release 与下载](https://github.com/linuxwps/rename/releases/tag/v1.2.1)

## v1.2.1 更新

- 新增跟随系统外观的界面深色模式，并同步切换标题栏日间/夜间图标
- App 图标改为无外框细线的圆角矩形底板，提供奶白色日间版和深灰色夜间版，并优化启动台显示尺寸
- 统一 8 种规则图标为无灰色底色的线性图标
- 文件删除按钮改为常显，表头与数据列支持居中对齐
- 优化文件列宽拖动：优先压缩右侧列，达到最小宽度后才显示水平滚动条
- 修复窗口标题栏无法拖拽移动和规则链卡片无法拖拽排序的问题

## 功能

- **链式重命名规则**：序号、正则、前缀、后缀、扩展名、替换、大小写、照片日期八种规则可自由组合，最多 10 条
- **可排序规则链**：支持拖拽排序、单项启停、参数独立编辑、复制、删除和一键清空
- **批量选择**：文件行复选框、全选/取消全选，仅处理选中文件
- **预设管理**：将常用规则链保存到本地，支持加载、覆盖和删除
- **实时预览**：修改前后对比，带词级差异高亮
- **规则级预览**：展开查看每条规则的中间处理结果和具体变化
- **冲突检测**：自动检测重名并告警
- **防覆盖预检**：同时检查批次内重名和目标目录已有文件
- **两步重命名**：先转临时名再转最终名，避免碰撞
- **撤销操作**：持久化快照，支持撤销
- **照片日期重命名**：从 EXIF 拍摄时间、创建时间或修改时间生成日期，支持三种日期格式、回退策略和不同放置位置
- **可控顺序**：文件列表支持添加顺序、手动拖拽、名称升降序
- **大目录优化**：虚拟滚动只渲染可视区域，文件数量大时保持界面流畅
- **CSV 工作流**：导入路径列表或“原路径 + 目标文件名”映射，导出完整重命名计划
- **内置日志**：查看最近 300 行应用日志，记录导入、执行、回滚、撤销和错误
- **原生拖拽**：支持拖拽文件添加

## 截图

<img width="1200" height="800" alt="ScreenShot_2026-11-12_215723_077@2x" src="https://github.com/user-attachments/assets/2d4b1855-397d-4b9e-8312-5399d96e9463" />

<img width="1200" height="798" alt="ScreenShot_2026-11-13_101720_207@2x" src="https://github.com/user-attachments/assets/5864380e-09bb-4320-8d64-32052306a43b" />

<img width="1200" height="798" alt="ScreenShot_2026-11-13_101944_582@2x" src="https://github.com/user-attachments/assets/875a8028-01e4-43a1-bf29-7db91de932da" />


## 系统要求

| 平台 | 架构 | 安装包 |
|------|------|--------|
| macOS 11+ | Apple Silicon | `.dmg` |
| Windows 10+ | x64 | `.exe` |
| Linux | amd64 | `.deb` |

当前 `v1.2.1` Release 暂未提供 Intel Mac 安装包。

## 快速开始

### 下载

从 [GitHub Releases](https://github.com/linuxwps/rename/releases/latest) 下载对应平台的安装包：

| 平台 | 安装包 |
|------|--------|
| macOS（Apple Silicon） | [Rename_1.2.1_aarch64.dmg](https://github.com/linuxwps/rename/releases/download/v1.2.1/Rename_1.2.1_aarch64.dmg) |
| Windows x64 | [Rename_1.2.1_x64-setup.exe](https://github.com/linuxwps/rename/releases/download/v1.2.1/Rename_1.2.1_x64-setup.exe) |
| Linux amd64 | [Rename_1.2.1_amd64.deb](https://github.com/linuxwps/rename/releases/download/v1.2.1/Rename_1.2.1_amd64.deb) |

### 开发

```bash
# 克隆仓库
git clone git@github.com:linuxwps/rename.git
cd rename/rname

# 安装依赖
npm ci

# 运行开发模式
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

构建产物位于 `rname/src-tauri/target/release/bundle/`。

### 测试

```bash
npm test
cd src-tauri && cargo test
```

## 技术栈

- **桌面框架**：[Tauri v2](https://v2.tauri.app/)
- **前端**：React 19 + TypeScript + Vite 8
- **后端**：Rust
- **CI/CD**：GitHub Actions 自动构建并发布 macOS `.dmg`、Windows `.exe`、Linux `.deb`

## 许可证

MIT
