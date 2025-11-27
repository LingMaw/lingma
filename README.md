# 灵码小说助手 ⚡️

> **AI驱动的小说创作工具 · 流式生成 · MacOS风格UI**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/typescript-5.6+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)

---

**灵码小说助手**是一款专为创作者设计的AI小说生成工具。它可以帮助用户通过简单的参数设置，快速生成各种类型和风格的小说内容。工具集成了先进的AI技术，支持流式内容生成，让用户能够实时观看创作过程。

## ✨ 核心功能

### 📖 AI小说生成功能

灵码小说助手的核心是强大的AI小说生成引擎，具备以下特色功能：

#### 🚀 流式生成技术
- **实时创作过程**: 不同于传统的一次性输出，我们的AI采用流式生成技术，让用户可以实时观看AI的创作过程
- **即时反馈**: 在AI创作过程中，用户可以看到每一句话的生成，提供更好的互动体验
- **思维链可视化**: 支持显示AI的思考过程，帮助用户理解创作思路

#### 🎯 参数化创作控制
- **标题驱动**: 用户只需提供小说标题，AI即可开始创作
- **类型选择**: 支持科幻、奇幻、悬疑、爱情、历史、军事、都市、武侠、仙侠、游戏、体育、灵异等多种小说类型
- **风格定制**: 提供现实主义、浪漫主义、古典主义、现代主义、魔幻现实主义、黑色幽默、意识流、自然主义等多种写作风格
- **详细要求**: 用户可以输入详细的创作要求，指导AI生成符合期望的内容

#### 💡 AI创作助手
- **交互式创作**: 内置AI聊天面板，用户可以与AI进行交互，获取创作灵感或修改建议
- **内容插入**: 可以将AI助手生成的想法直接插入到创作要求中
- **智能推荐**: AI可以根据当前创作内容提供后续情节发展的建议

#### 📚 内容管理
- **实时保存**: 支持将正在生成的内容实时保存到项目中
- **一键复制**: 可以将生成的小说内容一键复制到剪贴板
- **项目集成**: 与项目管理系统深度集成，方便统一管理多个作品

### 🎨 精美界面
- **MacOS风格**: 采用精美的MacOS风格界面设计，视觉体验优秀
- **流畅动画**: 集成现代化动画效果，操作更加流畅自然
- **深色浅色模式**: 完美支持Light/Dark模式无缝切换

### 🛠 技术特性
- **现代技术栈**: 基于FastAPI、React等现代技术构建
- **容器化部署**: 支持Docker容器化部署，便于运维管理
- **跨平台**: 支持Windows原生应用打包

---

## 🚀 快速开始

### 1. 初始化

```bash
# 初始化环境 (检查依赖、生成配置)
./scripts/init-project.sh
```

### 2. 启动开发

```bash
# 启动所有服务 (前端 + 后端)
pnpm dev:all

# 或者分别启动
# pnpm dev:backend
# pnpm dev:frontend
```

### 3. 访问应用

- **Web UI**: `http://localhost:5173`
- **API Docs**: `http://localhost:9871/docs`
- **默认账号**: `admin` / `admin`

详细说明：[快速开始指南](./docs/getting-started.md)

---

## 📁 项目结构

```text
src/
├── features/          # 🧩 功能模块
│   └── [feature]/
│       ├── frontend/  # 前端组件和逻辑
│       └── backend/   # 后端API和数据模型
├── backend/           # ⚙️ 后端核心 (认证、日志、配置)
└── frontend/          # 🖥️ 前端基础设施 (路由、主题、工具)
```

---

## 📚 文档中心

- **[开发指南](./docs/development.md)**: 如何开发新功能
- **[部署指南](./docs/deployment.md)**: Docker 与 Windows 部署
- **[命令参考](./docs/commands.md)**: 常用命令速查

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！提交前请确保通过类型检查与 Lint：

```bash
pnpm type-check
pnpm lint:backend
```

## 📄 License

MIT © 灵码小说助手