"""小说项目管理API路由
提供小说项目的增删改查接口
"""
import uuid

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist

from src.backend.core.dependencies import CurrentUserId
from src.backend.core.exceptions import APIError
from src.backend.core.logger import logger

from .models import NovelProject, Chapter
from .schemas import (
    NovelProjectCreate,
    NovelProjectListResponse,
    NovelProjectResponse,
    NovelProjectUpdate,
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
    ChapterListResponse,
    ChapterOrderUpdate,
    OutlineChapterListResponse,
    ChapterGenerateRequest,
    ChapterWithMetadata,
    ChapterListItem,
    ChapterListItemResponse,
)
from .services import (
    OutlineChapterQueryService,
    ChapterAIGenerationService,
    validate_outline_node_binding,
    ChapterQueryService,
)
from src.features.novel_generator.backend.ai import AIService

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

@router.post(
    "/{project_id}/chapters/",
    response_model=ChapterResponse,
    summary="创建章节"
)
async def create_chapter(
    project_id: int,
    chapter_data: ChapterCreate,
    user_id: CurrentUserId,
):
    """
    为指定小说项目创建新章节
    
    Args:
        project_id: 项目ID
        chapter_data: 章节创建数据
        user_id: 当前用户ID
        
    Returns:
        ChapterResponse: 创建的章节信息
    """
    logger.info(f"用户 {user_id} 创建章节: 项目 {project_id}")
    
    try:
        # 验证项目存在且属于当前用户
        project = await NovelProject.get(id=project_id, user_id=user_id)
        
        # 如果提供了outline_node_id,验证绑定
        if chapter_data.outline_node_id is not None:
            await validate_outline_node_binding(
                outline_node_id=chapter_data.outline_node_id,
                project_id=project_id,
                current_chapter_id=None
            )
        
        # 生成UUID作为章节ID
        chapter_id = str(uuid.uuid4())
        
        # 创建章节
        chapter = await Chapter.create(
            chapter_id=chapter_id,
            title=chapter_data.title,
            chapter_number=chapter_data.chapter_number,
            project_id=project_id,
            content=chapter_data.content or "",
            outline_node_id=chapter_data.outline_node_id,
            outline_description=chapter_data.outline_description,
        )
        
        # 将章节ID添加到项目的章节ID列表中
        project.chapter_ids.append(chapter_id)
        await project.save()
        
        logger.info(f"章节创建成功: {chapter.id} - {chapter.title}")
        return chapter
        
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        raise
    except Exception as e:
        logger.error(f"创建章节失败: {e}")
        raise APIError(code="CREATE_FAILED", message=f"创建章节失败: {e!s}") from e


@router.get("/{project_id}/outline-chapters", response_model=OutlineChapterListResponse, summary="获取可绑定的大纲章节")
async def get_outline_chapters(
    project_id: int,
    user_id: CurrentUserId,
):
    """
    获取项目下所有chapter类型的OutlineNode及其绑定状态
    
    Args:
        project_id: 项目ID
        user_id: 当前用户ID
        
    Returns:
        OutlineChapterListResponse: 章节节点列表
    """
    logger.info(f"用户 {user_id} 查询项目 {project_id} 的大纲章节")
    
    try:
        # 验证项目存在且属于当前用户
        await NovelProject.get(id=project_id, user_id=user_id)
        
        # 调用服务查询
        result = await OutlineChapterQueryService.get_outline_chapters(project_id)
        
        logger.info(f"查询到 {result.total} 个章节节点")
        return result
        
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        raise
    except Exception as e:
        logger.error(f"查询大纲章节失败: {e}")
        raise APIError(code="QUERY_FAILED", message=f"查询大纲章节失败: {e!s}") from e


@router.post("/{project_id}/chapters/{chapter_id}/generate", summary="AI生成章节内容")
async def generate_chapter_content(
    project_id: int,
    chapter_id: str,
    request_data: ChapterGenerateRequest,
    user_id: CurrentUserId,
):
    """
    使用AI流式生成章节内容
    
    Args:
        project_id: 项目ID
        chapter_id: 章节UUID
        request_data: 生成请求参数
        user_id: 当前用户ID
        
    Returns:
        StreamingResponse: SSE流式响应
    """
    logger.info(f"用户 {user_id} 请求生成章节内容: 项目 {project_id}, 章节 {chapter_id}")
    
    try:
        # 验证项目存在且属于当前用户
        await NovelProject.get(id=project_id, user_id=user_id)
        
        # 创建AI服务实例
        ai_service = AIService()
        generation_service = ChapterAIGenerationService(ai_service)
        
        # 调用生成服务
        async def event_generator():
            async for chunk in generation_service.generate_chapter_stream(
                chapter_id=chapter_id,
                project_id=project_id,
                outline_node_id=request_data.outline_node_id,
                genre=request_data.genre,
                style=request_data.style,
                requirement=request_data.requirement,
                use_sections=request_data.use_sections
            ):
                yield f"data: {chunk}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        raise
    except Exception as e:
        logger.error(f"生成章节内容失败: {e}")
        raise APIError(code="GENERATE_FAILED", message=f"生成章节内容失败: {e!s}") from e


@router.get("/{project_id}/chapters/", response_model=ChapterListItemResponse, summary="获取章节列表")
async def list_chapters(
    project_id: int,
    user_id: CurrentUserId,
):
    """
    获取指定小说项目的所有章节（使用新查询服务）
    
    Args:
        project_id: 项目ID
        user_id: 当前用户ID
        
    Returns:
        ChapterListItemResponse: 章节列表（包含运行时计算的编号和标题）
    """
    logger.info(f"用户 {user_id} 获取项目 {project_id} 的章节列表")
    
    try:
        # 验证项目存在且属于当前用户
        await NovelProject.get(id=project_id, user_id=user_id)
        
        # ✅ 使用新查询服务（运行时计算编号）
        chapters = await ChapterQueryService.list_chapters_by_project(project_id)
        
        logger.info(f"获取到 {len(chapters)} 个章节")
        return ChapterListItemResponse(total=len(chapters), items=chapters)
        
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except Exception as e:
        logger.error(f"获取章节列表失败: {e}")
        raise APIError(code="LIST_FAILED", message=f"获取章节列表失败: {e!s}") from e


@router.get("/{project_id}/chapters/{chapter_id}", response_model=ChapterWithMetadata, summary="获取章节详情")
async def get_chapter(
    project_id: int,
    chapter_id: str,
    user_id: CurrentUserId,
):
    """
    获取指定章节的详细信息（包含运行时计算的元数据）
    
    Args:
        project_id: 项目ID
        chapter_id: 章节ID
        user_id: 当前用户ID
        
    Returns:
        ChapterWithMetadata: 章节详细信息
    """
    logger.info(f"用户 {user_id} 获取章节详情: 项目 {project_id}, 章节 {chapter_id}")
    
    try:
        # 验证项目存在且属于当前用户
        await NovelProject.get(id=project_id, user_id=user_id)
        
        # ✅ 使用新查询服务
        chapter = await ChapterQueryService.get_chapter_with_metadata(chapter_id)
        
        return chapter
        
    except DoesNotExist as e:
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        raise
    except Exception as e:
        logger.error(f"获取章节详情失败: {e}")
        raise APIError(code="GET_FAILED", message=f"获取章节详情失败: {e!s}") from e


@router.put("/{project_id}/chapters/{chapter_id}", response_model=ChapterResponse, summary="更新章节")
async def update_chapter(
    project_id: int,
    chapter_id: str,
    chapter_data: ChapterUpdate,
    user_id: CurrentUserId,
):
    """
    更新指定章节的信息
    
    Args:
        project_id: 项目ID
        chapter_id: 章节ID
        chapter_data: 章节更新数据
        user_id: 当前用户ID
        
    Returns:
        ChapterResponse: 更新后的章节信息
    """
    logger.info(f"用户 {user_id} 更新章节: 项目 {project_id}, 章节 {chapter_id}")
    
    try:
        # 验证项目存在且属于当前用户
        project = await NovelProject.get(id=project_id, user_id=user_id)
        
        # 检查章节是否属于该项目
        if chapter_id not in project.chapter_ids:
            raise APIError(code="CHAPTER_NOT_FOUND", message="章节不存在或不属于该项目", status_code=404)
        
        # 获取章节
        chapter = await Chapter.get(chapter_id=chapter_id)
        
        # 如果提供了outline_node_id,验证绑定
        update_data = chapter_data.dict(exclude_unset=True)
        if 'outline_node_id' in update_data and update_data['outline_node_id'] is not None:
            await validate_outline_node_binding(
                outline_node_id=update_data['outline_node_id'],
                project_id=project_id,
                current_chapter_id=chapter_id
            )
        
        # 检查序号是否已存在（如果是更新序号的话）
        if 'chapter_number' in update_data and update_data['chapter_number'] != chapter.chapter_number:
            existing_chapter = await Chapter.filter(
                project_id=project_id, 
                chapter_number=update_data['chapter_number']
            ).exclude(id=chapter.id).first()
            
            if existing_chapter:
                raise APIError(code="DUPLICATE_CHAPTER_NUMBER", message=f"项目中已存在序号为 {update_data['chapter_number']} 的章节", status_code=400)
        
        # 更新字段
        for field, value in update_data.items():
            setattr(chapter, field, value)
        
        # 保存更新
        await chapter.save()
        logger.info(f"章节更新成功: {chapter.id}")
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        # 重新抛出已知的API错误
        raise
    except Exception as e:
        logger.error(f"更新章节失败: {e}")
        raise APIError(code="UPDATE_FAILED", message=f"更新章节失败: {e!s}") from e
    else:
        return chapter


@router.delete("/{project_id}/chapters/{chapter_id}", summary="删除章节")
async def delete_chapter(
    project_id: int,
    chapter_id: str,
    user_id: CurrentUserId,
):
    """
    删除指定章节
    
    Args:
        project_id: 项目ID
        chapter_id: 章节ID
        user_id: 当前用户ID
        
    Returns:
        dict: 删除结果
    """
    logger.info(f"用户 {user_id} 删除章节: 项目 {project_id}, 章节 {chapter_id}")
    
    try:
        # 验证项目存在且属于当前用户
        project = await NovelProject.get(id=project_id, user_id=user_id)
        
        # 检查章节是否属于该项目
        if chapter_id not in project.chapter_ids:
            raise APIError(code="CHAPTER_NOT_FOUND", message="章节不存在或不属于该项目", status_code=404)
        
        # 获取章节并删除
        chapter = await Chapter.get(chapter_id=chapter_id)
        await chapter.delete()
        
        # 从项目章节ID列表中移除该章节ID
        project.chapter_ids.remove(chapter_id)
        await project.save()
        
        logger.info(f"章节删除成功: 项目 {project_id}, 章节 {chapter_id}")
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        # 重新抛出已知的API错误
        raise
    except Exception as e:
        logger.error(f"删除章节失败: {e}")
        raise APIError(code="DELETE_FAILED", message=f"删除章节失败: {e!s}") from e
    else:
        return {"message": "章节删除成功"}


@router.put("/{project_id}/chapters/order", summary="更新章节顺序")
async def update_chapter_order(
    project_id: int,
    order_data: ChapterOrderUpdate,
    user_id: CurrentUserId,
):
    """
    更新章节顺序
    
    Args:
        project_id: 项目ID
        order_data: 章节顺序数据
        user_id: 当前用户ID
        
    Returns:
        dict: 更新结果
    """
    logger.info(f"用户 {user_id} 更新项目 {project_id} 的章节顺序")
    
    try:
        # 验证项目存在且属于当前用户
        project = await NovelProject.get(id=project_id, user_id=user_id)
        
        # 验证所有章节ID都属于该项目
        for chapter_id in order_data.chapter_ids:
            if chapter_id not in project.chapter_ids:
                raise APIError(code="CHAPTER_NOT_FOUND", message=f"章节 {chapter_id} 不存在或不属于该项目", status_code=404)
        
        # 更新项目中的章节ID顺序
        project.chapter_ids = order_data.chapter_ids
        await project.save()
        
        # 更新各章节的序号
        for index, chapter_id in enumerate(order_data.chapter_ids):
            await Chapter.filter(chapter_id=chapter_id).update(chapter_number=index + 1)
        
        logger.info(f"章节顺序更新成功: 项目 {project_id}")
    except DoesNotExist as e:
        logger.warning(f"小说项目不存在或无权限: {project_id}")
        raise APIError(code="PROJECT_NOT_FOUND", message="项目不存在或无权限访问", status_code=404) from e
    except APIError:
        # 重新抛出已知的API错误
        raise
    except Exception as e:
        logger.error(f"更新章节顺序失败: {e}")
        raise APIError(code="ORDER_UPDATE_FAILED", message=f"更新章节顺序失败: {e!s}") from e
    else:
        return {"message": "章节顺序更新成功"}