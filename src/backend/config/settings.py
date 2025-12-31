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
    SECRET_KEY: str = "1234567890"  # JWT 签名密钥
    ENCRYPTION_KEY: str = ""  # 数据加密密钥（独立于 SECRET_KEY）
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
        1. 检查 SECRET_KEY（JWT 签名）
        2. 检查 ENCRYPTION_KEY（数据加密）
        """
        default_secret_key = "dev-secret-key-change-in-production-please"
        is_production = self.ENVIRONMENT == "production" or not self.DEBUG

        # 检查 SECRET_KEY
        if default_secret_key == self.SECRET_KEY:
            if is_production:
                self._regenerate_secret()
            else:
                logger.warning("⚠️ 当前正在使用不安全的默认 SECRET_KEY (仅限开发环境)")

        # 检查 ENCRYPTION_KEY（必须配置）
        if not self.ENCRYPTION_KEY:
            if is_production:
                self._regenerate_encryption_key()
            else:
                logger.warning("⚠️ 未配置 ENCRYPTION_KEY，数据加密功能将使用 SECRET_KEY 派生（不推荐）")

    def _regenerate_secret(self):
        """生成新的 SECRET_KEY 并写入配置文件"""
        new_secret = secrets.token_hex(32)
        env_file = Path(".env.local")

        logger.info("🔐 检测到不安全的默认 SECRET_KEY，正在自动生成...")

        try:
            new_line = f'\n# Auto-generated JWT secret key\nSECRET_KEY="{new_secret}"\n'
            with env_file.open("a", encoding="utf-8") as f:
                f.write(new_line)

            self.SECRET_KEY = new_secret
            logger.success(f"✅ 已生成 SECRET_KEY 并写入 {env_file.absolute()}")

        except Exception as e:
            logger.error(f"❌ 无法写入配置文件: {e}")
            self.SECRET_KEY = new_secret

    def _regenerate_encryption_key(self):
        """生成新的 ENCRYPTION_KEY 并写入配置文件"""
        new_key = secrets.token_hex(32)
        env_file = Path(".env.local")

        logger.info("🔐 未配置 ENCRYPTION_KEY，正在自动生成...")

        try:
            new_line = f'\n# Auto-generated data encryption key\nENCRYPTION_KEY="{new_key}"\n'
            with env_file.open("a", encoding="utf-8") as f:
                f.write(new_line)

            self.ENCRYPTION_KEY = new_key
            logger.success(f"✅ 已生成 ENCRYPTION_KEY 并写入 {env_file.absolute()}")
            logger.warning("⚠️ 请备份此密钥！丢失后将无法解密已加密的数据")

        except Exception as e:
            logger.error(f"❌ 无法写入配置文件: {e}")
            self.ENCRYPTION_KEY = new_key


# 初始化配置
settings = Settings()
# 执行安全检查
settings.ensure_security()
