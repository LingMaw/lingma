"""
数据库配置（Tortoise-ORM）
"""

import contextlib
import sys

from aerich import Command
from loguru import logger
from tortoise import Tortoise

# 引入统一路径管理
try:
    from src.backend.core.path_conf import get_resource_path
except ImportError:
    # 兼容直接运行此文件的情况 (如有需要)
    from backend.core.path_conf import get_resource_path

from .settings import settings

# Tortoise-ORM配置
TORTOISE_ORM = {
    "connections": {"default": settings.DATABASE_URL},
    "apps": {
        "models": {
            "models": [
                "src.features.user.backend.models",
                "src.features.novel_project.backend.models",
                "src.features.novel_outline.backend.models",
                # 在此添加其他功能模块的models
                "aerich.models",  # Aerich迁移管理
            ],
            "default_connection": "default",
        },
    },
}


async def run_migrations():
    """
    运行 Aerich 数据库迁移
    适用于：
    1. Windows 桌面应用环境 (frozen)
    2. Docker 容器环境 (非 frozen, 但 ENVIRONMENT=production) 且使用 SQLite
    """
    # 1. 确定 migrations 目录位置
    # 使用统一的资源路径查找器
    migrations_dir = get_resource_path("migrations")

    # 严禁掩盖问题：如果生产环境找不到迁移文件，必须报错
    if not migrations_dir:
        error_msg = "❌ CRITICAL: Migrations directory NOT found via get_resource_path"
        logger.critical(error_msg)
        raise RuntimeError(error_msg)

    logger.info(f"🔄 Running migrations from {migrations_dir}...")

    try:
        # 2. 初始化 Aerich Command
        command = Command(tortoise_config=TORTOISE_ORM, location=str(migrations_dir))

        # 3. 初始化数据库连接 (Aerich 需要)
        await command.init()

        # 4. 尝试初始化 aerich 表 (如果不存在)
        # safe=True 保证如果表已存在不报错
        # 注意：在某些版本 aerich 中，init_db 即使 safe=True 也会尝试创建迁移文件而报错
        # 我们这里只需要确保 aerich 表存在即可
        with contextlib.suppress(FileExistsError):
            await command.init_db(safe=True)

        # 5. 执行升级
        # run_in_transaction=True 保证原子性
        await command.upgrade(run_in_transaction=True)

        logger.success("✅ Database migrations applied successfully.")

    except Exception as e:
        # 严禁掩盖问题：迁移失败必须抛出异常
        logger.critical(f"❌ Database migration FAILED: {e}")
        raise


async def init_db():
    """
    初始化数据库连接
    在应用启动时调用
    """
    await Tortoise.init(config=TORTOISE_ORM)

    # 策略：
    # 1. 开发环境：总是尝试生成表结构 (快速开发)
    # 2. 生产环境且使用 SQLite（桌面版场景）：必须且只能使用 Aerich 迁移系统
    # 3. 生产环境且使用服务器数据库：应手动使用 Aerich 迁移工具

    is_sqlite = settings.DATABASE_URL.startswith("sqlite://")
    is_frozen = getattr(sys, "frozen", False)
    is_production = settings.ENVIRONMENT == "production"

    if settings.ENVIRONMENT == "development" and not is_frozen:
        # 开发环境：自动建表 (如果不使用 aerich)
        # safe=True: 如果表已存在则忽略
        logger.info("🔧 Development mode: Generating schemas...")
        await Tortoise.generate_schemas(safe=True)

    elif is_sqlite and (is_frozen or is_production):
        # 生产环境 + SQLite (无论是 Docker 还是 Windows exe)：自动迁移
        # 如果失败，直接崩溃，绝不使用 generate_schemas 兜底
        await run_migrations()


async def close_db():
    """
    关闭数据库连接
    在应用关闭时调用
    """
    await Tortoise.close_connections()
