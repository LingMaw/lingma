# 灵码小说助手 ⚡️

> **AI驱动的小说创作工具 · 流式生成 · MacOS风格UI**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/typescript-5.6+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)

---

**灵码小说助手**是一款专为创作者设计的 AI 小说生成工具。它可以帮助用户通过简单的参数设置，快速生成各种类型和风格的小说内容。工具集成了先进的 AI 技术，支持流式内容生成，让用户能够实时观看创作过程。

## ✨ 核心功能

### 📝 大纲系统

- **树状结构**: 支持卷/章/小节三层层级，灵活组织小说结构
- **AI 生成大纲**: 根据小说设定一键生成完整大纲
- **大纲续写**: AI 智能续写后续情节发展
- **拖拽排序**: 自由调整章节顺序和层级关系

### 📚 章节系统

- **章节管理**: 独立章节编辑，支持字数统计和状态追踪
- **大纲关联**: 章节可与大纲节点关联，保持结构一致
- **多种状态**: 草稿/已完成/AI生成，清晰掌握创作进度
- **灵活切换**: 项目可选择使用或不使用章节系统

### 🔌 自定义 API 接入

- **用户级配置**: 每个用户可配置自己的 AI API
- **多参数支持**: 自定义 API Base URL、API Key、模型名称、最大 Token 数
- **安全存储**: API Key 加密存储，保障用户数据安全

### 📖 AI 小说生成

- **流式生成**: 实时观看 AI 创作过程，支持思维链可视化
- **参数化控制**: 支持科幻、奇幻、悬疑、爱情等多种类型和风格
- **AI 创作助手**: 内置交互式聊天面板，获取创作灵感
- **内容管理**: 实时保存、一键复制、项目集成

### 🎨 精美界面

- **MacOS 风格设计**: 毛玻璃效果、圆角、柔和阴影
- **Framer Motion 动画**: 流畅的页面切换和交互反馈
- **深色/浅色模式**: 完美支持 Light/Dark 模式切换
- **多套主题色**: Blue, Purple, Green, Orange 四套强调色

### 🛠 技术特性

- **垂直切分架构**: 前后端代码按功能聚合，AI 友好
- **类型安全**: 后端定义 → OpenAPI → 自动生成前端类型
- **容器化部署**: 支持 Docker 部署
- **跨平台**: 支持 Windows 原生应用打包

---

## 🚀 快速开始

### 前置要求

- Python 3.11+
- Node.js 18+
- pnpm 8+

### 1. 安装依赖

```bash
# 安装 uv (Python 包管理器)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装 Python 和 Node.js 依赖
uv sync
pnpm install
```

### 2. 初始化数据库

```bash
mkdir -p data
pnpm db:init-db
```

### 3. 启动开发服务器

```bash
# 一键启动前后端 (推荐)
pnpm dev:all

# 或分别启动
# pnpm dev:backend
# pnpm dev:frontend
```

### 4. 访问应用

| 服务 | 地址 |
|------|------|
| Web UI | http://localhost:5173 |
| API Docs | http://localhost:9871/docs |
| 默认账号 | `admin` / `admin` |

---

## 📁 项目结构

```text
src/
├── features/              # 🧩 功能模块 (垂直切分)
│   ├── chapter/           # 章节管理
│   ├── character/         # 角色管理
│   ├── novel_project/     # 项目管理
│   ├── novel_outline/     # 大纲管理
│   ├── novel_generator/   # 短篇小说生成器
│   └── user/              # 用户认证
│
├── backend/               # ⚙️ 后端核心
│   ├── core/              # 安全、异常、日志
│   ├── config/            # 配置、数据库
│   └── services/          # 通用服务
│
├── frontend/              # 🖥️ 前端基础设施
│   ├── core/              # HTTP、路由、类型、主题、动画
│   ├── shared/            # 共享组件、hooks、状态
│   └── utils/             # 工具函数
│
└── assets/                # 资源文件
    └── template/          # Jinja2 提示词模板
```

---

## ⚙️ 配置说明

### 后端配置 (.env)

```bash
# 应用信息
APP_NAME="灵码小说助手 API"
ENVIRONMENT="development"

# 数据库
DATABASE_URL="sqlite://./data/db.sqlite3"

# 安全
SECRET_KEY="your-secret-key"  # openssl rand -hex 32
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=["http://localhost:5173"]
```

### 前端配置 (.env.local)

```bash
VITE_APP_NAME="灵码小说助手"
VITE_API_BASE_URL="/api"
```

---

## 📋 常用命令

### 开发服务器

```bash
pnpm dev:all          # 同时启动前后端 ⭐
pnpm dev:backend      # 仅后端
pnpm dev:frontend     # 仅前端
```

### 数据库

```bash
pnpm db:generate --name "说明"  # 生成迁移
pnpm db:migrate                 # 应用迁移
pnpm db:rollback                # 回滚迁移
```

### 类型生成

```bash
pnpm generate:types       # 从 OpenAPI 生成前端类型
```

> 💡 使用 `pnpm dev:all` 时，类型会自动更新！

### 代码检查

```bash
pnpm type-check           # TypeScript 检查
pnpm lint                 # ESLint
pnpm lint:backend         # Ruff 检查
```

### 依赖管理

```bash
# Python (必须用 uv)
uv add <package>
uv add --dev <package>

# Node.js
pnpm add <package>
pnpm add -D <package>
```

---

## 🏗️ 技术栈

### 后端

| 技术 | 用途 |
|------|------|
| FastAPI | Web 框架 |
| Pydantic v2 | 数据验证 |
| Tortoise-ORM | 数据库 ORM |
| Aerich | 数据库迁移 |
| python-jose | JWT 认证 |
| Loguru | 日志系统 |
| uv | 包管理 |

### 前端

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript 5.6 | 类型系统 |
| React Router v7 | 路由 |
| Zustand | 状态管理 |
| MUI v6 | 组件库 (MacOS 风格定制) |
| Framer Motion | 动画 |
| Axios | HTTP 客户端 |
| Vite | 构建工具 |
| pnpm | 包管理 |


---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！提交前请确保通过类型检查与 Lint：

```bash
pnpm type-check
pnpm lint
pnpm lint:backend
```

---

## 📄 License

MIT © 灵码小说助手
