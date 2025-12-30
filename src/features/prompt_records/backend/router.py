"""提示词记录管理API路由"""

from fastapi import APIRouter, Query

from src.backend.core.dependencies import CurrentUserId
from src.backend.services.models import PromptRecord

from .schemas import PromptRecordListResponse, PromptRecordResponse

router = APIRouter(prefix="/prompt-records", tags=["提示词记录"])


@router.get("/", response_model=PromptRecordListResponse)
async def list_prompt_records(
    user_id: CurrentUserId,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页大小"),
    project_id: int | None = Query(None, description="项目ID过滤"),
    endpoint: str | None = Query(None, description="端点过滤"),
):
    """
    获取用户的提示词记录列表（分页）

    Args:
        user_id: 当前用户ID
        page: 页码（从1开始）
        page_size: 每页大小（1-100）
        project_id: 可选的项目ID过滤
        endpoint: 可选的端点过滤

    Returns:
        PromptRecordListResponse: 分页的记录列表
    """
    # 构建查询条件
    query = PromptRecord.filter(user_id=user_id)

    if project_id is not None:
        query = query.filter(project_id=project_id)

    if endpoint:
        query = query.filter(endpoint__icontains=endpoint)

    # 获取总数
    total = await query.count()

    # 分页查询
    offset = (page - 1) * page_size
    records = (
        await query.order_by("-created_at")
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return PromptRecordListResponse(
        total=total,
        page=page,
        page_size=page_size,
        records=[PromptRecordResponse.model_validate(record) for record in records],
    )


@router.get("/{record_id}", response_model=PromptRecordResponse)
async def get_prompt_record(
    record_id: int,
    user_id: CurrentUserId,
):
    """
    获取单个提示词记录详情

    Args:
        record_id: 记录ID
        user_id: 当前用户ID

    Returns:
        PromptRecordResponse: 记录详情
    """
    record = await PromptRecord.get_or_none(id=record_id, user_id=user_id)

    if not record:
        from src.backend.core.exceptions import APIError

        raise APIError(
            code="NOT_FOUND",
            message="提示词记录不存在",
            status_code=404,
        )

    return PromptRecordResponse.model_validate(record)
