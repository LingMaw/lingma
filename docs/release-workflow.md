# 版本发布与更新日志指南

本项目的版本发布采用全自动化流程，遵循 Semantic Versioning 规范。

## 1. 版本号规范

版本号格式：`vMajor.Minor.Patch`

- **Major**: 重大架构变更或不兼容的 API 修改。
- **Minor**: 新增功能（向后兼容）。
- **Patch**: Bug 修复或小的改进（向后兼容）。

示例：`v1.0.0`, `v1.1.0`, `v1.0.1`

## 2. 更新日志 (CHANGELOG)

在发布新版本之前，**必须** 更新根目录下的 `CHANGELOG.md` 文件。

### 格式模板

```markdown
## [v1.0.0] - 2024-03-20

### 🚀 新增功能

- 添加了用户认证模块
- 支持 WebSocket 实时日志推送

### 🐛 修复

- 修复了登录页面的布局错位问题
- 修复了 API 请求超时的 bug

### 🔧 优化

- 优化了 Docker 构建体积
- 升级 FastAPI 到最新版本
```

## 3. 发布流程

### 第一步：准备发布

1. 确保所有代码已合并到 `master` 分支。
2. 更新 `pyproject.toml` 中的版本号：
   ```toml
   [project]
   version = "1.0.0"
   ```
3. 更新 `CHANGELOG.md`，添加新版本的变更记录。
4. 提交更改：
   ```bash
   git add pyproject.toml CHANGELOG.md
   git commit -m "chore: release v1.0.0"
   git push origin master
   ```

### 第二步：触发发布

打上版本 Tag 并推送，这将自动触发 GitHub Actions 工作流：

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 第三步：自动构建

GitHub Actions 将自动执行以下任务：

1. **Linux/Docker 构建**：
   - 构建多架构 Docker 镜像。
   - 推送镜像至 GHCR (GitHub Container Registry)。
2. **Windows 桌面构建**：
   - 搭建 Windows 环境。
   - 构建前端资源 (`pnpm build`)。
   - 使用 PyInstaller 打包后端和前端资源为 EXE 文件。
3. **发布 Release**：
   - 在 GitHub Releases 页面创建新发布。
   - 自动上传构建产物：
     - `NekroVStack-Windows-x64.zip` (开箱即用的 Windows 桌面应用)
     - `docker-compose.yml` (Docker 部署配置)
   - 自动根据 Commit 历史生成发布说明 (Release Notes)。

## 4. 验证发布

发布完成后，请检查：

1. GitHub Release 页面是否有新的发布版本。
2. 是否包含所有预期的附件。
3. 下载 Windows 包并在纯净环境测试运行。
4. 测试 Docker 镜像是否能正常拉取和启动。
