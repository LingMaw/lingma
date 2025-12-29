"""Token统计API路由"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Query

from src.backend.core.dependencies import CurrentUserId
from src.backend.services.token_statistics import token_statistics_service

router = APIRouter(prefix="/statistics", tags=["统计"])


@router.get("/user/summary")
async def get_user_token_summary(
    user_id: CurrentUserId,
    days: int = Query(30, ge=1, le=365, description="统计天数"),
):
    """
    获取用户Token使用汇总

    Args:
        user_id: 当前用户ID
        days: 统计天数（默认30天）

    Returns:
        dict: Token使用统计数据
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    return await token_statistics_service.get_user_statistics(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/user/recent")
async def get_user_recent_records(
    user_id: CurrentUserId,
    limit: int = Query(50, ge=1, le=200, description="返回记录数"),
):
    """
    获取用户最近的Token使用记录

    Args:
        user_id: 当前用户ID
        limit: 返回记录数

    Returns:
        list: Token使用记录列表
    """
    return await token_statistics_service.get_recent_records(
        user_id=user_id,
        limit=limit,
    )


@router.get("/project/{project_id}/summary")
async def get_project_token_summary(
    project_id: int,
    _user_id: CurrentUserId,
    days: int = Query(30, ge=1, le=365, description="统计天数"),
):
    """
    获取项目Token使用汇总

    Args:
        project_id: 项目ID
        user_id: 当前用户ID（用于权限验证）
        days: 统计天数（默认30天）

    Returns:
        dict: Token使用统计数据
    """
    # TODO: 添加项目权限验证

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    return await token_statistics_service.get_project_statistics(
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
    )
