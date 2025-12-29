"""Token统计服务
记录和聚合Token使用数据
"""

import asyncio
from datetime import datetime
from typing import Optional

from src.backend.core.logger import logger
from src.backend.services.models import TokenUsageRecord


class TokenStatisticsService:
    """Token统计服务类
    
    特性:
    - 异步记录Token使用
    - 用户级和项目级统计
    - 时间范围查询
    """

    async def record_usage(
        self,
        user_id: int,
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
        endpoint: str,
        project_id: Optional[int] = None,
    ) -> None:
        """记录单次Token使用（异步）
        
        Args:
            user_id: 用户ID
            prompt_tokens: 提示词Token数
            completion_tokens: 生成内容Token数
            model: 使用的AI模型
            endpoint: 请求的API端点
            project_id: 项目ID（可选）
        """
        try:
            total_tokens = prompt_tokens + completion_tokens

            # 创建记录
            await TokenUsageRecord.create(
                user_id=user_id,
                project_id=project_id,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                model=model,
                endpoint=endpoint,
            )

            logger.debug(
                f"Token使用已记录: user_id={user_id}, "
                f"total_tokens={total_tokens}, "
                f"model={model}, "
                f"endpoint={endpoint}",
            )

        except Exception as e:
            # 记录失败不应影响主流程，仅记录错误
            logger.error(f"记录Token使用失败: {e}")

    def record_usage_background(
        self,
        user_id: int,
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
        endpoint: str,
        project_id: Optional[int] = None,
    ) -> None:
        """在后台任务中记录Token使用
        
        Args:
            user_id: 用户ID
            prompt_tokens: 提示词Token数
            completion_tokens: 生成内容Token数
            model: 使用的AI模型
            endpoint: 请求的API端点
            project_id: 项目ID（可选）
        """
        asyncio.create_task(
            self.record_usage(
                user_id=user_id,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                model=model,
                endpoint=endpoint,
                project_id=project_id,
            ),
        )

    async def get_user_statistics(
        self,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """查询用户级别统计
        
        Args:
            user_id: 用户ID
            start_date: 开始时间（可选）
            end_date: 结束时间（可选）
            
        Returns:
            dict: 统计数据
        """
        # 构建查询条件
        query = TokenUsageRecord.filter(user_id=user_id)

        if start_date:
            query = query.filter(created_at__gte=start_date)
        if end_date:
            query = query.filter(created_at__lte=end_date)

        # 获取所有记录
        records = await query.all()

        # 计算统计数据
        total_tokens = sum(record.total_tokens for record in records)
        prompt_tokens = sum(record.prompt_tokens for record in records)
        completion_tokens = sum(record.completion_tokens for record in records)
        request_count = len(records)

        # 按模型分组统计
        model_stats = {}
        for record in records:
            if record.model not in model_stats:
                model_stats[record.model] = {
                    "total_tokens": 0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "request_count": 0,
                }
            model_stats[record.model]["total_tokens"] += record.total_tokens
            model_stats[record.model]["prompt_tokens"] += record.prompt_tokens
            model_stats[record.model]["completion_tokens"] += record.completion_tokens
            model_stats[record.model]["request_count"] += 1

        return {
            "user_id": user_id,
            "total_tokens": total_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "request_count": request_count,
            "model_stats": model_stats,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        }

    async def get_project_statistics(
        self,
        project_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """查询项目级别统计
        
        Args:
            project_id: 项目ID
            start_date: 开始时间（可选）
            end_date: 结束时间（可选）
            
        Returns:
            dict: 统计数据
        """
        # 构建查询条件
        query = TokenUsageRecord.filter(project_id=project_id)

        if start_date:
            query = query.filter(created_at__gte=start_date)
        if end_date:
            query = query.filter(created_at__lte=end_date)

        # 获取所有记录
        records = await query.all()

        # 计算统计数据
        total_tokens = sum(record.total_tokens for record in records)
        prompt_tokens = sum(record.prompt_tokens for record in records)
        completion_tokens = sum(record.completion_tokens for record in records)
        request_count = len(records)

        # 按模型分组统计
        model_stats = {}
        for record in records:
            if record.model not in model_stats:
                model_stats[record.model] = {
                    "total_tokens": 0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "request_count": 0,
                }
            model_stats[record.model]["total_tokens"] += record.total_tokens
            model_stats[record.model]["prompt_tokens"] += record.prompt_tokens
            model_stats[record.model]["completion_tokens"] += record.completion_tokens
            model_stats[record.model]["request_count"] += 1

        return {
            "project_id": project_id,
            "total_tokens": total_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "request_count": request_count,
            "model_stats": model_stats,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        }

    async def get_recent_records(
        self,
        user_id: int,
        limit: int = 50,
    ) -> list[dict]:
        """获取用户最近的Token使用记录
        
        Args:
            user_id: 用户ID
            limit: 返回记录数限制
            
        Returns:
            list[dict]: 记录列表
        """
        records = (
            await TokenUsageRecord.filter(user_id=user_id)
            .order_by("-created_at")
            .limit(limit)
            .all()
        )

        return [
            {
                "id": record.id,
                "user_id": record.user_id,
                "project_id": record.project_id,
                "prompt_tokens": record.prompt_tokens,
                "completion_tokens": record.completion_tokens,
                "total_tokens": record.total_tokens,
                "model": record.model,
                "endpoint": record.endpoint,
                "created_at": record.created_at.isoformat(),
            }
            for record in records
        ]


# 创建全局Token统计服务实例
token_statistics_service = TokenStatisticsService()
