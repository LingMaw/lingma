"""小说项目管理API路由
提供小说项目的增删改查接口
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, Path, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist

from src.backend.core.dependencies import CurrentUserId
from src.backend.core.exceptions import APIError
from src.backend.core.logger import logger

from .models import NovelProject
from .schemas import (
    NovelProjectCreate,
    NovelProjectListResponse,
    NovelProjectResponse,
    NovelProjectUpdate,
)
from .services.ai_service import project_ai_service

router = APIRouter()


@router.post("/", response_model=NovelProjectResponse, summary="创建小说项目")
async def create_novel_project(
    project_data: NovelProjectCreate,
    user_id: CurrentUserId,
):
    """
    创建新的小说项目
    
    Args:
        project_data: 小说项目创建数据
        user_id: 当前用户ID
        
    Returns:
        NovelProjectResponse: 创建的小说项目信息
    """
    logger.info(f"用户 {user_id} 创建小说项目: {project_data.title}")
    
    try:
        # 创建项目
        project = await NovelProject.create(
            title=project_data.title,
            description=project_data.description,
            genre=project_data.genre,
            style=project_data.style,
            status=project_data.status,
            content=project_data.content,
            word_count=project_data.word_count or 0,
            use_chapter_system=project_data.use_chapter_system,
            user_id=user_id,
        )
        
        logger.info(f"小说项目创建成功: {project.id} - {project.title}")
    except Exception as e:
        logger.error(f"创建小说项目失败: {e}")
        raise APIError(code="CREATE_FAILED", message=f"创建项目失败: {e!s}") from e
    else:
        return project


@router.get("/", response_model=NovelProjectListResponse, summary="获取小说项目列表")
async def list_novel_projects(
    user_id: CurrentUserId,
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="项目状态筛选"),
):
    """
    获取当前用户的小说项目列表
    
    Args:
        user_id: 当前用户ID
        page: 页码
        size: 每页数量
        status: 项目状态筛选
        
    Returns:
        NovelProjectListResponse: 小说项目列表
    """
    logger.info(f"用户 {user_id} 获取小说项目列表，页码: {page}，状态: {status}")
    
    # 构建查询条件
    filters = {"user_id": user_id}
    if status:
        filters["status"] = status
    
    # 分页查询
    offset = (page - 1) * size
    projects = await NovelProject.filter(**filters).offset(offset).limit(size).all()
    total = await NovelProject.filter(**filters).count()
    
    logger.info(f"获取到 {len(projects)} 个项目，总共 {total} 个")
    return NovelProjectListResponse(total=total, items=projects)


@router.get("/{project_id}", response_model=NovelProjectResponse, summary="获取小说项目详情")
async def get_novel_project(
    project_id: int,
    user_id: CurrentUserId,
):
    """
    获取指定小说项目的详细信息
    
    Args:
        project_id: 项目ID
        user_id: 当前用户ID
        
    Returns:
        NovelProjectResponse: 小说项目详细信息
    """
    logger.info(f"用户 {user_id} 获取小说项目详情: {project_id}")
    
    try:
        project = await NovelProject.get(id=project_id, user_id=user_id)
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在: {project_id}")
        raise APIError(code="NOT_FOUND", message="项目不存在", status_code=404) from e
    else:
        return project


@router.put("/{project_id}", response_model=NovelProjectResponse, summary="更新小说项目")
async def update_novel_project(
    project_id: int,
    project_data: NovelProjectUpdate,
    user_id: CurrentUserId,
):
    """
    更新小说项目信息
    
    Args:
        project_id: 项目ID
        project_data: 项目更新数据
        user_id: 当前用户ID
        
    Returns:
        NovelProjectResponse: 更新后的项目信息
    """
    logger.info(f"用户 {user_id} 更新小说项目: {project_id}")
    
    try:
        # 获取项目
        project = await NovelProject.get(id=project_id, user_id=user_id)
        
        # 更新字段
        update_data = project_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        
        # 保存更新
        await project.save()
        logger.info(f"小说项目更新成功: {project.id}")
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在: {project_id}")
        raise APIError(code="NOT_FOUND", message="项目不存在", status_code=404) from e
    except Exception as e:
        logger.error(f"更新小说项目失败: {e}")
        raise APIError(code="UPDATE_FAILED", message=f"更新项目失败: {e!s}") from e
    else:
        return project


@router.delete("/{project_id}", summary="删除小说项目")
async def delete_novel_project(
    project_id: int,
    user_id: CurrentUserId,
):
    """
    删除小说项目
    
    Args:
        project_id: 项目ID
        user_id: 当前用户ID
        
    Returns:
        dict: 删除结果
    """
    logger.info(f"用户 {user_id} 删除小说项目: {project_id}")
    
    try:
        project = await NovelProject.get(id=project_id, user_id=user_id)
        await project.delete()
        logger.info(f"小说项目删除成功: {project_id}")
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在: {project_id}")
        raise APIError(code="NOT_FOUND", message="项目不存在", status_code=404) from e
    else:
        return {"message": "项目删除成功"}


@router.post("/{project_id}/save-content", response_model=NovelProjectResponse, summary="保存小说内容到项目")
async def save_novel_content(
    project_id: int,
    content_data: dict = Body(..., example={"content": "小说内容", "title": "小说标题"}),
    user_id: CurrentUserId = None,
):
    """
    将生成的小说内容保存到指定项目
    
    Args:
        project_id: 项目ID
        content_data: 包含小说内容和标题的数据
        user_id: 当前用户ID
        
    Returns:
        NovelProjectResponse: 更新后的项目信息
    """
    content = content_data.get("content", "")
    title = content_data.get("title", "")
    
    logger.info(f"用户 {user_id} 保存小说内容到项目: {project_id}")
    
    try:
        # 获取项目并验证权限
        project = await NovelProject.get(id=project_id, user_id=user_id)
        
        # 更新项目内容
        project.content = content
        project.word_count = len(content)
        
        # 如果提供了标题，则更新标题
        if title:
            project.title = title
            
        # 更新项目状态为已完成
        project.status = "completed"
        
        # 保存更新
        await project.save()
        logger.info(f"小说内容保存成功: 项目 {project_id}，字数 {project.word_count}")
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except Exception as e:
        logger.error(f"保存小说内容失败: {e}")
        raise APIError(code="SAVE_FAILED", message=f"保存内容失败: {e!s}") from e
    else:
        return project


@router.post("/{project_id}/ai-generate-stream", summary="AI流式生成项目内容")
async def ai_generate_project_stream(
    project_id: int = Path(..., description="项目ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI流式生成项目内容
    """
    try:
        project = await NovelProject.get_or_none(id=project_id, user_id=user_id)
        if not project:
            raise APIError(code="NOT_FOUND", message="项目不存在", status_code=404)

        requirement = data.get("requirement", "")

        async def content_stream():
            try:
                yield "".encode("utf-8")  # 初始心跳包
                async for chunk in project_ai_service.generate_project_content(
                    project=project,
                    user_id=user_id,
                    requirement=requirement,
                ):
                    if chunk.strip():
                        yield chunk.encode("utf-8")
                logger.info(f"AI生成项目内容成功: {project_id}")
            except Exception as e:
                logger.error(f"AI生成项目内容失败: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")

        return StreamingResponse(
            content_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except APIError:
        raise
    except Exception as e:
        logger.error(f"AI生成项目失败: {e}")
        raise APIError(
            code="AI_GENERATE_FAILED", message="AI生成项目失败", status_code=500
        )


@router.post("/{project_id}/ai-continue-stream", summary="AI流式续写项目内容")
async def ai_continue_project_stream(
    project_id: int = Path(..., description="项目ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI续写项目内容
    """
    try:
        project = await NovelProject.get_or_none(id=project_id, user_id=user_id)
        if not project:
            raise APIError(code="NOT_FOUND", message="项目不存在", status_code=404)

        current_content = data.get("current_content", project.content or "")
        requirement = data.get("requirement", "")

        async def content_stream():
            try:
                yield "".encode("utf-8")
                async for chunk in project_ai_service.continue_project_content(
                    project=project,
                    user_id=user_id,
                    current_content=current_content,
                    requirement=requirement,
                ):
                    if chunk.strip():
                        yield chunk.encode("utf-8")
                logger.info(f"AI续写项目内容成功: {project_id}")
            except Exception as e:
                logger.error(f"AI续写项目内容失败: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")

        return StreamingResponse(
            content_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except APIError:
        raise
    except Exception as e:
        logger.error(f"AI续写项目失败: {e}")
        raise APIError(
            code="AI_CONTINUE_FAILED", message="AI续写项目失败", status_code=500
        )


@router.post("/{project_id}/ai-optimize-stream", summary="AI流式优化项目内容")
async def ai_optimize_project_stream(
    project_id: int = Path(..., description="项目ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI优化项目内容（语法检查、风格优化等）
    """
    try:
        project = await NovelProject.get_or_none(id=project_id, user_id=user_id)
        if not project:
            raise APIError(code="NOT_FOUND", message="项目不存在", status_code=404)

        content = data.get("content", "")
        optimization_type = data.get("type", "general")  # general, grammar, style

        async def content_stream():
            try:
                yield "".encode("utf-8")
                async for chunk in project_ai_service.optimize_project_content(
                    project=project,
                    user_id=user_id,
                    content=content,
                    optimization_type=optimization_type,
                ):
                    if chunk.strip():
                        yield chunk.encode("utf-8")
                logger.info(f"AI优化项目内容成功: {project_id}")
            except Exception as e:
                logger.error(f"AI优化项目内容失败: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")

        return StreamingResponse(
            content_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except APIError:
        raise
    except Exception as e:
        logger.error(f"AI优化项目失败: {e}")
        raise APIError(
            code="AI_OPTIMIZE_FAILED", message="AI优化项目失败", status_code=500
        )