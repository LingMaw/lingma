"""流式生成错误处理增强
处理流式生成错误和重试
"""

import asyncio
import contextlib
from enum import Enum
from typing import AsyncGenerator, Callable

from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    RateLimitError,
)

from src.backend.core.logger import logger


class ErrorType(Enum):
    """错误类型枚举"""

    NETWORK_ERROR = "network_error"
    RATE_LIMIT_ERROR = "rate_limit_error"
    AUTHENTICATION_ERROR = "authentication_error"
    INVALID_REQUEST_ERROR = "invalid_request_error"
    TIMEOUT_ERROR = "timeout_error"
    UNKNOWN_ERROR = "unknown_error"


class StreamErrorHandler:
    """流式生成错误处理器
    
    特性:
    - 错误分类
    - 自动重试
    - 指数退避
    """

    def __init__(self, max_retries: int = 3):
        """初始化错误处理器
        
        Args:
            max_retries: 最大重试次数
        """
        self.max_retries = max_retries

    def classify_error(self, error: Exception) -> ErrorType:
        """分类错误类型
        
        Args:
            error: 异常对象
            
        Returns:
            ErrorType: 错误类型
        """
        if isinstance(error, APIConnectionError):
            return ErrorType.NETWORK_ERROR
        if isinstance(error, RateLimitError):
            return ErrorType.RATE_LIMIT_ERROR
        if isinstance(error, AuthenticationError):
            return ErrorType.AUTHENTICATION_ERROR
        if isinstance(error, BadRequestError):
            return ErrorType.INVALID_REQUEST_ERROR
        if isinstance(error, APITimeoutError):
            return ErrorType.TIMEOUT_ERROR
        return ErrorType.UNKNOWN_ERROR

    async def should_retry(
        self, error: Exception, attempt: int,
    ) -> tuple[bool, float]:
        """判断是否应该重试
        
        Args:
            error: 异常对象
            attempt: 当前尝试次数
            
        Returns:
            tuple[bool, float]: (是否重试, 等待时间)
        """
        error_type = self.classify_error(error)

        # 不可重试的错误
        if error_type in [
            ErrorType.AUTHENTICATION_ERROR,
            ErrorType.INVALID_REQUEST_ERROR,
        ]:
            return False, 0

        # 检查重试次数
        if attempt >= self.max_retries:
            return False, 0

        # 计算等待时间（指数退避）
        base_wait = 2**attempt  # 2, 4, 8 秒

        # 根据错误类型调整
        if error_type == ErrorType.RATE_LIMIT_ERROR:
            # 速率限制错误，等待更长时间
            wait_time = base_wait * 2
            # 检查是否有Retry-After头
            if isinstance(error, RateLimitError) and hasattr(error, "response"):
                retry_after = error.response.headers.get("Retry-After")
                if retry_after:
                    with contextlib.suppress(ValueError):
                        wait_time = float(retry_after)
        elif error_type == ErrorType.TIMEOUT_ERROR:
            # 超时错误，仅重试一次
            if attempt >= 1:
                return False, 0
            wait_time = base_wait
        else:
            # 其他错误（网络等）
            wait_time = base_wait

        return True, wait_time

    async def handle_stream(
        self,
        stream_func: Callable,
        *args,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        """包装流式生成器，自动处理错误
        
        Args:
            stream_func: 流式生成函数
            *args: 位置参数
            **kwargs: 关键字参数
            
        Yields:
            str: 生成的内容片段
        """
        attempt = 0

        while attempt < self.max_retries:
            try:
                # 调用流式生成函数
                async for chunk in stream_func(*args, **kwargs):
                    yield chunk
            except Exception as e:
                attempt += 1
                error_type = self.classify_error(e)

                logger.warning(
                    f"流式生成错误 (尝试 {attempt}/{self.max_retries}): "
                    f"类型={error_type.value}, 错误={e}",
                )

                # 判断是否应该重试
                should_retry, wait_time = await self.should_retry(e, attempt)

                if not should_retry:
                    # 不可重试的错误，直接抛出
                    error_msg = self._get_error_message(error_type, e)
                    logger.error(f"流式生成失败（不可重试）: {error_msg}")
                    yield f"错误: {error_msg}"
                    return

                # 等待后重试
                if wait_time > 0:
                    logger.info(f"等待 {wait_time} 秒后重试...")
                    await asyncio.sleep(wait_time)
            else:
                # 成功完成，退出循环
                return

        # 所有重试都失败
        logger.error(f"流式生成失败：已达到最大重试次数 {self.max_retries}")
        yield "错误: 请求失败，已达到最大重试次数，请稍后再试"

    def _get_error_message(self, error_type: ErrorType, error: Exception) -> str:
        """获取用户友好的错误消息
        
        Args:
            error_type: 错误类型
            error: 异常对象
            
        Returns:
            str: 错误消息
        """
        if error_type == ErrorType.AUTHENTICATION_ERROR:
            return "API密钥无效或已过期，请检查您的API配置"
        if error_type == ErrorType.INVALID_REQUEST_ERROR:
            return "请求参数错误，请检查输入内容"
        if error_type == ErrorType.RATE_LIMIT_ERROR:
            return "请求频率过高，请稍后再试"
        if error_type == ErrorType.TIMEOUT_ERROR:
            return "请求超时，请检查网络连接或稍后再试"
        if error_type == ErrorType.NETWORK_ERROR:
            return "网络连接失败，请检查网络设置"
        return f"未知错误: {error!s}"


# 创建全局错误处理器实例
stream_error_handler = StreamErrorHandler()
