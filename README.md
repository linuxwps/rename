# Rename

批量文件重命名工具，基于 Tauri v2 构建。

## 功能

- **6 种重命名模式**：序号、正则、前缀、后缀、扩展名、替换，可任选一种或者多种组合的方式去重命名
- **实时预览**：修改前后对比，带词级差异高亮
- **冲突检测**：自动检测重名并告警
- **两步重命名**：先转临时名再转最终名，避免碰撞
- **撤销操作**：持久化快照，支持撤销
- **原生拖拽**：支持拖拽文件添加

## 截图

<img width="2158" height="1390" alt="mac_1" src="https://github.com/user-attachments/assets/089ab5a0-63d5-40d2-980e-858fbf151a07" />
<img width="2158" height="1390" alt="mac_2" src="https://github.com/user-attachments/assets/803ec42e-1443-4e41-bb2f-596f2e478191" />
<img width="854" height="632" alt="win_1" src="https://github.com/user-attachments/assets/a73612a3-b088-496b-88d8-fdfe2d80d77d" />


## 系统要求

| 平台 | 支持 |
|------|------|
| macOS 11+ | ✅ (Intel + Apple Silicon)(.dmg) |
| Windows 10+ | ✅ (.exe)|
| Linux | ✅ (.deb) |

## 快速开始

### 下载

从 [Releases](https://github.com/linuxwps/rename/releases) 下载对应平台的安装包。

### 开发

```bash
# 克隆仓库
git clone git@github.com:linuxwps/rename.git
cd rename/rname

# 安装前端依赖
npm install

# 运行开发模式
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

## 技术栈

- **桌面框架**：[Tauri v2](https://v2.tauri.app/)
- **前端**：React 19 + TypeScript + Vite 8
- **后端**：Rust
- **CI/CD**：GitHub Actions（macOS .dmg / Windows .exe / Linux .deb）

## 许可证

MIT
