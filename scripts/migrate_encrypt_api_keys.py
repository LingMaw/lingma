#!/usr/bin/env python3
"""
数据迁移脚本：加密现有的明文 API 密钥

功能：
1. 扫描所有用户的 api_key 设置
2. 检测哪些是明文（未加密）
3. 将明文密钥加密后更新到数据库

使用方法：
    cd /home/devbox/project/lingma
    uv run python scripts/migrate_encrypt_api_keys.py
"""

import asyncio
import json
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from tortoise import Tortoise

from src.backend.config.database import TORTOISE_ORM
from src.backend.core.logger import logger
from src.backend.core.security import encrypt_api_key
from src.features.user.backend.models import UserSetting


async def is_encrypted(value: str) -> bool:
    """
    检测值是否已经加密
    
    Args:
        value: 待检测的值
        
    Returns:
        bool: True 表示已加密，False 表示明文
    """
    if not value:
        return True  # 空值视为已处理
    
    try:
        # 尝试解析为 JSON，如果成功且包含 ct 和 iv，说明已加密
        data = json.loads(value)
        return "ct" in data and "iv" in data  # noqa: TRY300
    except (json.JSONDecodeError, TypeError):
        # 不是 JSON 格式，说明是明文
        return False


async def migrate_api_keys():
    """迁移所有明文 API 密钥为加密格式"""
    logger.info("=" * 60)
    logger.info("开始加密 API 密钥迁移")
    logger.info("=" * 60)
    
    # 初始化数据库连接
    await Tortoise.init(config=TORTOISE_ORM)
    
    try:
        # 获取所有 api_key 设置
        api_key_settings = await UserSetting.filter(key="api_key").all()
        
        total_count = len(api_key_settings)
        encrypted_count = 0
        already_encrypted_count = 0
        empty_count = 0
        
        logger.info(f"找到 {total_count} 个 API 密钥设置")
        
        for setting in api_key_settings:
            if not setting.value:
                empty_count += 1
                continue
            
            # 检查是否已加密
            if await is_encrypted(setting.value):
                already_encrypted_count += 1
                logger.debug(f"用户 {setting.user_id} 的密钥已加密，跳过")
                continue
            
            # 加密明文密钥
            try:
                encrypted_value = encrypt_api_key(setting.value)
                setting.value = encrypted_value
                await setting.save()
                
                encrypted_count += 1
                logger.success(f"✓ 用户 {setting.user_id} 的 API 密钥已加密")
                
            except Exception as e:
                logger.error(f"✗ 用户 {setting.user_id} 的密钥加密失败: {e}")
        
        logger.info("=" * 60)
        logger.info("迁移完成！")
        logger.info(f"总计: {total_count} 个密钥")
        logger.info(f"  - 新加密: {encrypted_count}")
        logger.info(f"  - 已加密: {already_encrypted_count}")
        logger.info(f"  - 空密钥: {empty_count}")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"迁移过程中发生错误: {e}")
        raise
    finally:
        # 关闭数据库连接
        await Tortoise.close_connections()


def main():
    """主入口"""
    try:
        asyncio.run(migrate_api_keys())
    except KeyboardInterrupt:
        logger.warning("\n迁移被用户中断")
        sys.exit(1)
    except Exception as e:
        logger.error(f"迁移失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
