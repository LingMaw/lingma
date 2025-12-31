"""AI配置缓存管理器
提供统一的配置读取接口，透明处理缓存逻辑
"""

import asyncio
from typing import Optional

from cachetools import TTLCache

from src.backend.core.logger import logger
from src.backend.core.security import decrypt_api_key
from src.features.user.backend.models import UserSetting


class UserAIConfig:
    """用户AI配置数据类"""

    def __init__(
        self,
        user_id: int,
        api_key: str = "",
        api_base: str = "",
        api_model: str = "gpt-3.5-turbo",
        api_max_tokens: int = 32000,
    ):
        self.user_id = user_id
        self.api_key = api_key
        self.api_base = api_base
        self.api_model = api_model
        self.api_max_tokens = api_max_tokens

    def __repr__(self):
        return (
            f"UserAIConfig(user_id={self.user_id}, "
            f"api_base={self.api_base}, "
            f"api_model={self.api_model}, "
            f"api_max_tokens={self.api_max_tokens})"
        )


class ConfigCacheManager:
    """AI配置缓存管理器
    
    特性:
    - 内存缓存（TTLCache）
    - 自动失效和刷新
    - 线程安全
    """

    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        """初始化缓存管理器
        
        Args:
            max_size: 最大缓存条目数
            ttl: 缓存过期时间（秒），默认1小时
        """
        self._cache = TTLCache(maxsize=max_size, ttl=ttl)
        self._lock = asyncio.Lock()
        logger.info(f"ConfigCacheManager初始化完成: max_size={max_size}, ttl={ttl}s")

    async def get_user_ai_config(self, user_id: int) -> UserAIConfig:
        """获取用户AI配置（自动处理缓存）
        
        Args:
            user_id: 用户ID
            
        Returns:
            UserAIConfig: 用户AI配置对象
        """
        cache_key = f"ai_config:{user_id}"

        # 先尝试从缓存获取
        async with self._lock:
            if cache_key in self._cache:
                logger.debug(f"缓存命中: {cache_key}")
                return self._cache[cache_key]

        # 缓存未命中，从数据库加载
        logger.debug(f"缓存未命中: {cache_key}，从数据库加载")
        config = await self._load_config_from_db(user_id)

        # 写入缓存
        async with self._lock:
            self._cache[cache_key] = config
            logger.debug(f"配置已缓存: {cache_key}")

        return config

    async def _load_config_from_db(self, user_id: int) -> UserAIConfig:
        """从数据库加载用户AI配置
        
        Args:
            user_id: 用户ID
            
        Returns:
            UserAIConfig: 用户AI配置对象
        """
        try:
            # 获取用户设置
            settings = {}
            user_settings = await UserSetting.filter(user_id=user_id).all()
            for setting in user_settings:
                settings[setting.key] = setting.value

            logger.info(f"成功加载用户配置: user_id={user_id}")

            # 对 api_key 进行解密
            api_key = settings.get("api_key", "")
            if api_key:
                api_key = decrypt_api_key(api_key)

            # 构建配置对象
            return UserAIConfig(
                user_id=user_id,
                api_key=api_key,
                api_base=settings.get("api_base", ""),
                api_model=settings.get("api_model", "gpt-3.5-turbo"),
                api_max_tokens=int(settings.get("api_max_tokens", "32000")),
            )

            

        except Exception as e:
            logger.error(f"加载用户配置失败: user_id={user_id}, error={e}")
            # 返回默认配置
            return UserAIConfig(user_id=user_id)

    async def invalidate_user_config(self, user_id: int) -> None:
        """清除指定用户的配置缓存
        
        Args:
            user_id: 用户ID
        """
        cache_key = f"ai_config:{user_id}"
        async with self._lock:
            if cache_key in self._cache:
                del self._cache[cache_key]
                logger.info(f"配置缓存已清除: {cache_key}")
            else:
                logger.debug(f"配置缓存不存在，无需清除: {cache_key}")

    async def invalidate_all(self) -> None:
        """清除所有配置缓存（维护用）"""
        async with self._lock:
            cache_size = len(self._cache)
            self._cache.clear()
            logger.info(f"所有配置缓存已清除: 清除了 {cache_size} 个条目")

    def get_cache_stats(self) -> dict:
        """获取缓存统计信息
        
        Returns:
            dict: 缓存统计数据
        """
        return {
            "current_size": len(self._cache),
            "max_size": self._cache.maxsize,
            "ttl": self._cache.ttl,
        }


# 创建全局缓存管理器实例
config_cache_manager = ConfigCacheManager()
