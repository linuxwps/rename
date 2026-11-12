# Rename

批量文件重命名工具，基于 Tauri v2 构建。

[![Latest release](https://img.shields.io/github/v/release/linuxwps/rename)](https://github.com/linuxwps/rename/releases/latest)
[![Build](https://github.com/linuxwps/rename/actions/workflows/build.yml/badge.svg)](https://github.com/linuxwps/rename/actions/workflows/build.yml)

最新版本：**v1.2.0** · [查看 Release 与下载](https://github.com/linuxwps/rename/releases/tag/v1.2.0)

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

<img width="2158" height="1390" alt="mac_1" src="https://github.com/user-attachments/assets/089ab5a0-63d5-40d2-980e-858fbf151a07" />
<img width="2158" height="1390" alt="mac_2" src="https://github.com/user-attachments/assets/803ec42e-1443-4e41-bb2f-596f2e478191" />
<img width="854" height="632" alt="win_1" src="https://github.com/user-attachments/assets/a73612a3-b088-496b-88d8-fdfe2d80d77d" />


## 系统要求

| 平台 | 架构 | 安装包 |
|------|------|--------|
| macOS 11+ | Apple Silicon | `.dmg` |
| Windows 10+ | x64 | `.exe` |
| Linux | amd64 | `.deb` |

当前 `v1.2.0` Release 暂未提供 Intel Mac 安装包。

## 快速开始

### 下载

从 [GitHub Releases](https://github.com/linuxwps/rename/releases/latest) 下载对应平台的安装包：

| 平台 | 安装包 |
|------|--------|
| macOS（Apple Silicon） | [Rename_1.2.0_aarch64.dmg](https://github.com/linuxwps/rename/releases/download/v1.2.0/Rename_1.2.0_aarch64.dmg) |
| Windows x64 | [Rename_1.2.0_x64-setup.exe](https://github.com/linuxwps/rename/releases/download/v1.2.0/Rename_1.2.0_x64-setup.exe) |
| Linux amd64 | [Rename_1.2.0_amd64.deb](https://github.com/linuxwps/rename/releases/download/v1.2.0/Rename_1.2.0_amd64.deb) |

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
