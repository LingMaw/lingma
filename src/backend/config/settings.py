"""
应用配置管理
使用pydantic-settings管理环境变量
"""

import secrets
import tomllib
from pathlib import Path
from typing import Any

from loguru import logger
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_version() -> str:
    """从 pyproject.toml 读取版本号"""
    try:
        root_dir = Path(__file__).resolve().parents[3]
        pyproject_path = root_dir / "pyproject.toml"

        if not pyproject_path.exists():
            return "0.1.0"

        with pyproject_path.open("rb") as f:
            data = tomllib.load(f)
            return data.get("project", {}).get("version", "0.1.0")
    except Exception:
        return "0.1.0"


class Settings(BaseSettings):
    """应用配置"""

    # 基础配置
    APP_NAME: str = "灵码小说助手"
    APP_DESCRIPTION: str = "灵码小说助手"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    VERSION: str = get_version()

    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 9871

    # 数据库配置
    DATABASE_URL: str = "sqlite://./data/db.sqlite3"

    # 安全配置
    SECRET_KEY: str = "dev-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # 监控配置
    LOG_BUFFER_SIZE: int = 500

    # CORS配置
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # 配置加载顺序: .env (默认) -> .env.development (开发覆盖) -> .env.local (运行时/自动生成)
    # 后加载的文件优先级更高
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.development", ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def ensure_security(self):
        """
        安全检查与自动修复
        如果是生产环境且使用的是默认密钥，则自动生成新密钥并写入 .env.local
        """
        default_key = "dev-secret-key-change-in-production-please"

        # 检查条件：密钥未修改 且 (环境为生产 或 显式要求)
        # 为了简化 Windows 部署体验，只要是默认密钥，我们就尝试生成
        # 但在开发环境下(DEBUG=True)，我们允许使用默认密钥以避免 git 脏文件

        if default_key == self.SECRET_KEY:
            if self.ENVIRONMENT == "production" or not self.DEBUG:
                self._regenerate_secret()
            else:
                logger.warning("⚠️ 当前正在使用不安全的默认 SECRET_KEY (仅限开发环境)")

    def _regenerate_secret(self):
        """生成新的随机密钥并写入配置文件"""
        new_secret = secrets.token_hex(32)
        env_file = Path(".env.local")

        logger.info("🔐 检测到不安全的默认密钥，正在自动生成新密钥...")

        try:
            # 简单的追加/替换逻辑
            # 注意：这里做了一个简化的处理，直接追加覆盖
            # 在 .env 格式中，后面的键值对会覆盖前面的
            new_line = f'\n# Auto-generated secure key\nSECRET_KEY="{new_secret}"\n'

            with env_file.open("a", encoding="utf-8") as f:
                f.write(new_line)

            # 更新内存中的配置
            self.SECRET_KEY = new_secret
            logger.success(f"✅ 已生成安全密钥并写入 {env_file.absolute()}")

        except Exception as e:
            logger.error(f"❌ 无法写入配置文件: {e}")
            # 内存中更新，至少保证本次运行安全
            self.SECRET_KEY = new_secret


# 初始化配置
settings = Settings()
# 执行安全检查
settings.ensure_security()
