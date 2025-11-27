# 部署指南

本文档详细介绍了如何部署 Nekro VStack 应用，包括使用 Docker 部署和运行 Windows 桌面版应用。

## 📦 发布与部署

本项目内置完整的 CI/CD 工作流，支持全自动发版。

### 1. 自动化发布流程

只需推送版本 Tag，GitHub Actions 将自动完成所有工作：

```bash
# 1. 更新 pyproject.toml 中的版本号
# 2. 提交代码
git commit -m "chore: release v1.0.0"

# 3. 推送标签触发构建
git tag v1.0.0
git push origin v1.0.0
```

**自动构建产物**：

- 🐳 **Docker 镜像**: 推送至 GHCR (默认为 `ghcr.io/nekroai/nekro-vstack-template:latest`，Fork 后会自动变为您的用户名)
- 🪟 **Windows 桌面版**: `NekroVStack-Windows-x64.zip` (绿色免安装)
- 📝 **Release Notes**: 自动生成发布说明

详细文档：[版本发布工作流](./release-workflow.md)

### 2. Docker 部署

#### 方式 A：使用 Release 产物（推荐）

直接下载 Release 附件中的 `docker-compose.yml`，其中镜像地址已被自动替换为当前版本，可直接运行。

#### 方式 B：手动配置

如果您复制以下配置，请注意默认使用的是官方镜像：

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    # ⚠️ 如果您 Fork 了本项目，请将此处修改为您的 GitHub 用户名和仓库名
    # 例如: ghcr.io/your-username/my-project:latest
    image: ghcr.io/nekroai/nekro-vstack-template:latest
    ports:
      - '9871:9871'
    volumes:
      - ./data:/app/data
```

### 3. Windows 桌面版

下载 Release 中的 ZIP 包，解压后双击 `NekroVStack.exe` 即可直接运行，无需配置环境。

---

## 🔑 仓库配置指南

为了确保 GitHub Actions 自动化工作流能正常运行（推送镜像和创建 Release），您**必须**完成以下配置。

### 1. 启用 Workflow 读写权限 (必须)

默认情况下，GitHub Actions 的令牌 (`GITHUB_TOKEN`) 只有读取权限。为了能推送 Docker 镜像到 GHCR 和创建 Release，需要开启写入权限：

1. 进入项目仓库页面。
2. 点击顶部导航栏的 **Settings**。
3. 在左侧菜单栏点击 **Actions** -> **General**。
4. 滚动到底部找到 **Workflow permissions** 区域。
5. 选中 **Read and write permissions**。
6. 点击 **Save** 保存。

> **⚠️ 注意：选项不可点击？**
>
> 如果 **Read and write permissions** 选项为灰色不可选，说明该仓库属于 **GitHub Organization (组织)**，且组织策略限制了权限。
>
> **解决方法**：请联系组织管理员（Owner），进入 **Organization Settings** -> **Actions** -> **General** -> **Workflow permissions**，将权限修改为 "Read and write permissions"。

### 2. 配置 Secrets (可选)

本项目默认使用 GitHub Container Registry (GHCR)，**无需配置任何额外的 Secrets** 即可运行。

如果您想推送到 Docker Hub 或其他私有仓库，请按以下步骤配置：

1. 在 **Settings** -> **Secrets and variables** -> **Actions** 中点击 **New repository secret**。
2. 添加以下变量（需修改 `.github/workflows/deploy.yml` 适配）：
   - `DOCKER_USERNAME`: Docker Hub 用户名
   - `DOCKER_PASSWORD`: Docker Hub Access Token
