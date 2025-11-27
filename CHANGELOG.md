# 更新日志

本项目的所有重大更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵守 [Semantic Versioning](https://semver.org/spec/v2.0.0.html) 语义化版本规范。

## [未发布]

### 🚀 新增

- 基于 Nekro VStack 模板的初始项目结构。

## [0.1.0] - 2025-11-23

### 🚀 新增

- **核心架构**:
  - 后端：FastAPI + Tortoise-ORM + Aerich + Loguru。
  - 前端：React + Vite + MUI + Framer Motion。
- **功能模块**:
  - 用户认证系统 (JWT, 登录/注册)。
  - 仪表盘概览页面。
  - 系统监控模块 (支持 SSE 实时日志推送)。
- **部署与构建**:
  - 完整的 Docker 容器化部署支持。
  - Windows 桌面端原生应用构建支持 (PyInstaller)。
  - 全自动 GitHub Actions 发布工作流。
