"""提示词记录服务
记录每次AI请求的提示词内容
"""

import asyncio
from typing import Optional

from src.backend.core.logger import logger
from src.backend.services.models import PromptRecord


class PromptRecordService:
    """提示词记录服务类
    
    特性:
    - 异步记录提示词
    - 支持用户级和项目级关联
    - 后台任务模式避免阻塞主流程
    """

    async def record_prompt(
        self,
        user_id: int,
        system_prompt: str,
        user_prompt: str,
        endpoint: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        project_id: Optional[int] = None,
    ) -> Optional[int]:
        """记录提示词（异步）
        
        Args:
            user_id: 用户ID
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            endpoint: 请求的API端点
            model: 使用的AI模型（可选）
            temperature: 温度参数（可选）
            project_id: 项目ID（可选）
            
        Returns:
            int: 记录ID，失败返回None
        """
        try:
            record = await PromptRecord.create(
                user_id=user_id,
                project_id=project_id,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=model,
                endpoint=endpoint,
                temperature=temperature,
            )

            logger.debug(
                f"提示词已记录: user_id={user_id}, "
                f"endpoint={endpoint}, "
                f"record_id={record.id}",
            )

        except Exception as e:
            # 记录失败不应影响主流程，仅记录错误
            logger.error(f"记录提示词失败: {e}")
            return None
        else:
            return record.id

    def record_prompt_background(
        self,
        user_id: int,
        system_prompt: str,
        user_prompt: str,
        endpoint: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        project_id: Optional[int] = None,
    ) -> None:
        """在后台任务中记录提示词
        
        Args:
            user_id: 用户ID
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            endpoint: 请求的API端点
            model: 使用的AI模型（可选）
            temperature: 温度参数（可选）
            project_id: 项目ID（可选）
        """
        asyncio.create_task(
            self.record_prompt(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                endpoint=endpoint,
                model=model,
                temperature=temperature,
                project_id=project_id,
            ),
        )

    async def get_user_prompts(
        self,
        user_id: int,
        limit: int = 50,
    ) -> list[dict]:
        """获取用户最近的提示词记录
        
        Args:
            user_id: 用户ID
            limit: 返回记录数限制
            
        Returns:
            list[dict]: 记录列表
        """
        records = (
            await PromptRecord.filter(user_id=user_id)
            .order_by("-created_at")
            .limit(limit)
            .all()
        )

        return [
            {
                "id": record.id,
                "user_id": record.user_id,
                "project_id": record.project_id,
                "system_prompt": record.system_prompt,
                "user_prompt": record.user_prompt,
                "model": record.model,
                "endpoint": record.endpoint,
                "temperature": record.temperature,
                "created_at": record.created_at.isoformat(),
            }
            for record in records
        ]


# 创建全局提示词记录服务实例
prompt_record_service = PromptRecordService()
