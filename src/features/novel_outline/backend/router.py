"""
大纲系统API路由
"""

from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import StreamingResponse
from loguru import logger

from src.backend.core.exceptions import APIError
from src.backend.core.response import MessageResponse, message_response

# 导入同步服务
from src.features.chapter.backend.services.sync_service import ChapterSyncService
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_outline.backend.schemas import (
    AIOutlineGenerateRequest,
    OutlineContinueRequest,
    OutlineMetaResponse,
    OutlineNodeCreate,
    OutlineNodeReorder,
    OutlineNodeResponse,
    OutlineNodeUpdate,
    SectionHintsResponse,
)

# 导入AI大纲服务
from src.features.novel_outline.backend.services.ai_outline_service import (
    AIOutlineService,
    OutlineExportService,
)
from src.features.novel_outline.backend.services.outline_continue_service import (
    OutlineContinueService,
)
from src.features.novel_project.backend.models import NovelProject

router = APIRouter(prefix="/outline", tags=["大纲系统"])


@router.get("/projects/{project_id}/nodes", response_model=list[OutlineNodeResponse])
async def get_outline_nodes(
    project_id: int = Path(..., description="项目ID"),
):
    """
    获取项目的所有大纲节点（扁平列表）
    前端可以根据parent_id和position自行构建树状结构
    """
    try:
        nodes = (
            await OutlineNode.filter(project_id=project_id)
            .order_by("position")
            .all()
        )
        
    except Exception as e:
        logger.error(f"获取大纲节点失败: {e}")
        raise APIError(code="FETCH_FAILED", message="获取大纲节点失败", status_code=500) from e
    return nodes


@router.post("/projects/{project_id}/nodes", response_model=OutlineNodeResponse)
async def create_outline_node(
    project_id: int = Path(..., description="项目ID"),
    data: OutlineNodeCreate = ...,
):
    """
    创建大纲节点
    注意：如果是chapter类型，会自动创建对应的Chapter记录（通过同步服务）
    """
    def validate_parent_and_hierarchy(
        parent_id: int | None, 
        node_type: str,
        parent: OutlineNode | None,
    ) -> None:
        """验证父节点存在性和层级规则"""
        if not parent_id:
            return
            
        if not parent:
            raise APIError(
                code="PARENT_NOT_FOUND",
                message="父节点不存在",
                status_code=404,
            )

        # 层级验证
        if node_type == "volume":
            raise APIError(
                code="INVALID_HIERARCHY",
                message="卷(volume)只能作为根节点",
                status_code=400,
            )
        if node_type == "chapter" and parent.node_type != "volume":
            raise APIError(
                code="INVALID_HIERARCHY",
                message="章(chapter)只能挂在卷(volume)下",
                status_code=400,
            )
        if node_type == "section" and parent.node_type != "chapter":
            raise APIError(
                code="INVALID_HIERARCHY",
                message="小节(section)只能挂在章(chapter)下",
                status_code=400,
            )
    
    try:
        # 验证层级规则
        parent = None
        if data.parent_id:
            parent = await OutlineNode.get_or_none(id=data.parent_id)
        
        validate_parent_and_hierarchy(data.parent_id, data.node_type, parent)

        # 计算position：获取同级最大position + 1
        max_position_node = (
            await OutlineNode.filter(
                project_id=project_id, parent_id=data.parent_id,
            )
            .order_by("-position")
            .first()
        )
        position = (max_position_node.position + 1) if max_position_node else 0

        # 创建节点
        node = await OutlineNode.create(
            project_id=project_id,
            parent_id=data.parent_id,
            node_type=data.node_type,
            title=data.title,
            description=data.description,
            position=position,
        )

        # 触发同步：如果是chapter类型，自动创建对应的Chapter记录
        await ChapterSyncService.sync_on_create(node)

        logger.info(f"创建大纲节点: {node.id} - {node.title}")

    except APIError:
        raise
    except Exception as e:
        logger.error(f"创建大纲节点失败: {e}")
        raise APIError(code="CREATE_FAILED", message="创建大纲节点失败", status_code=500) from e
    return node


@router.put("/nodes/{node_id}", response_model=OutlineNodeResponse)
async def update_outline_node(
    node_id: int = Path(..., description="节点ID"),
    data: OutlineNodeUpdate = ...,
):
    """
    更新大纲节点
    注意：如果是chapter类型，会自动更新对应的Chapter记录（通过同步服务）
    """
    def raise_not_found_error() -> None:
        """节点不存在时抛出错误"""
        raise APIError(code="NOT_FOUND", message="节点不存在", status_code=404)
    
    try:
        node = await OutlineNode.get_or_none(id=node_id)
        if not node:
            raise_not_found_error()

        # 更新字段
        if data.title is not None:
            node.title = data.title
        if data.description is not None:
            node.description = data.description
        if data.is_expanded is not None:
            node.is_expanded = data.is_expanded

        await node.save()
        
        # 触发同步：如果是chapter类型，更新对应的Chapter标题
        await ChapterSyncService.sync_on_update(node)
        
        logger.info(f"更新大纲节点: {node.id}")

    except APIError:
        raise
    except Exception as e:
        logger.error(f"更新大纲节点失败: {e}")
        raise APIError(code="UPDATE_FAILED", message="更新大纲节点失败", status_code=500) from e
    return node


@router.delete("/nodes/{node_id}", response_model=MessageResponse)
async def delete_outline_node(
    node_id: int = Path(..., description="节点ID"),
):
    """
    删除大纲节点
    注意：会级联删除所有子节点，对应的Chapter记录的outline_node_id会被设为null
    """
    def raise_not_found_error() -> None:
        """节点不存在时抛出错误"""
        raise APIError(code="NOT_FOUND", message="节点不存在", status_code=404)
    
    try:
        node = await OutlineNode.get_or_none(id=node_id)
        if not node:
            raise_not_found_error()

        # 保存节点ID用于同步
        deleted_node_id = node.id
        
        await node.delete()
        
        # 触发同步：通知章节系统节点已删除
        await ChapterSyncService.sync_on_delete(deleted_node_id)
        
        logger.info(f"删除大纲节点: {node_id}")

    except APIError:
        raise
    except Exception as e:
        logger.error(f"删除大纲节点失败: {e}")
        raise APIError(code="DELETE_FAILED", message="删除大纲节点失败", status_code=500) from e
    return message_response("删除成功")

@router.post("/nodes/{node_id}/reorder", response_model=OutlineNodeResponse)
async def reorder_outline_node(
    node_id: int = Path(..., description="节点ID"),
    data: OutlineNodeReorder = ...,
):
    """
    拖拽排序：调整节点的父节点和位置
    注意：会触发章节编号重算（如果涉及chapter节点）
    """
    def raise_not_found_error() -> None:
        """节点不存在时抛出错误"""
        raise APIError(code="NOT_FOUND", message="节点不存在", status_code=404)
    
    try:
        node = await OutlineNode.get_or_none(id=node_id)
        if not node:
            raise_not_found_error()

        def raise_parent_not_found_error() -> None:
            """抛出父节点不存在异常"""
            raise APIError(  # noqa: TRY301
                code="PARENT_NOT_FOUND",
                message="新父节点不存在",
                status_code=404,
            )
        
        def raise_invalid_hierarchy_error(message: str) -> None:
            """抛出层级验证异常"""
            raise APIError(  # noqa: TRY301
                code="INVALID_HIERARCHY",
                message=message,
                status_code=400,
            )
        
        def validate_new_parent_and_hierarchy(
            new_parent_id: int | None,
            node_type: str,
            new_parent: OutlineNode | None,
        ) -> None:
            """验证新父节点存在性和层级规则"""
            if not new_parent_id:
                return
                        
            if not new_parent:
                raise_parent_not_found_error()
        
            # 层级验证(同创建时的规则)
            if node_type == "volume":
                raise_invalid_hierarchy_error("卷(volume)只能作为根节点")
            elif node_type == "chapter" and new_parent.node_type != "volume":
                raise_invalid_hierarchy_error("章(chapter)只能挂在卷(volume)下")
            elif node_type == "section" and new_parent.node_type != "chapter":
                raise_invalid_hierarchy_error("小节(section)只能挂在章(chapter)下")
        
        # 验证新父节点
        new_parent = None
        if data.new_parent_id:
            new_parent = await OutlineNode.get_or_none(id=data.new_parent_id)
        
        validate_new_parent_and_hierarchy(data.new_parent_id, node.node_type, new_parent)

        # 更新节点的父节点和位置
        node.parent_id = data.new_parent_id
        node.position = data.new_position
        await node.save()

        # 触发章节编号重算（如果涉及chapter节点）
        await ChapterSyncService.recalculate_all_numbers(node.project_id)
        
        logger.info(f"拖拽排序大纲节点: {node_id}")

    except APIError:
        raise
    except Exception as e:
        logger.error(f"拖拽排序失败: {e}")
        raise APIError(code="REORDER_FAILED", message="拖拽排序失败", status_code=500) from e
    return node


@router.get("/nodes/{chapter_node_id}/section-hints", response_model=SectionHintsResponse)
async def get_section_hints(
    chapter_node_id: int = Path(..., description="章节节点ID"),
):
    """
    获取章节下的section节点作为写作提纲
    用于AI生成章节内容时参考
    """
    def raise_invalid_node_type_error() -> None:
        """抛出节点类型无效异常"""
        raise APIError(
            code="INVALID_NODE_TYPE",
            message="节点不是章节类型",
            status_code=400,
        )

    try:
        chapter_node = await OutlineNode.get_or_none(id=chapter_node_id)
        if not chapter_node or chapter_node.node_type != "chapter":
            raise_invalid_node_type_error()

        sections = (
            await OutlineNode.filter(
                parent_id=chapter_node_id, node_type="section",
            )
            .order_by("position")
            .all()
        )

        return {
            "sections": [
                {"title": s.title, "description": s.description} for s in sections
            ],
        }

    except APIError:
        raise
    except Exception as e:
        logger.error(f"获取section提纲失败: {e}")
        raise APIError(
            code="FETCH_FAILED", message="获取section提纲失败", status_code=500,
        ) from e


@router.post("/projects/{project_id}/generate")
async def generate_outline_with_ai(
    project_id: int = Path(..., description="项目ID"),
    user_id: int = Query(1, description="用户ID"),
    data: AIOutlineGenerateRequest = ...,
):
    """
    AI生成大纲（SSE流式返回）
    清空现有大纲并根据项目设定生成新的大纲结构
    注意：会自动使用项目的description、genre、style字段
    """
    return StreamingResponse(
        AIOutlineService.generate_outline_stream(
            project_id=project_id,
            user_id=user_id,
            key_plots=data.key_plots or [],
            additional_content=data.additional_content or "",
            chapter_count_min=data.chapter_count_min,
            chapter_count_max=data.chapter_count_max,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/projects/{project_id}/meta", response_model=OutlineMetaResponse)
async def get_outline_meta(
    project_id: int = Path(..., description="项目ID"),
):
    """
    获取大纲的元信息（meta）
    包括世界观、核心矛盾、主题升华、情节结构、关键转折点、角色弧光等
    """
    def _validate_project(project):
        if not project:
            raise APIError(
                code="PROJECT_NOT_FOUND",
                message="项目不存在",
                status_code=404,
            )
    
    try:
        project = await NovelProject.get_or_none(id=project_id)
        _validate_project(project)
        
        # 从 metadata 中提取 outline_meta
        metadata = project.metadata or {}
        outline_meta = metadata.get("outline_meta")
        
        if outline_meta:
            return {
                "meta": outline_meta,
                "has_meta": True,
            }
    except APIError:
        raise
    except Exception as e:
        logger.error(f"获取大纲meta信息失败: {e}")
        raise APIError(
            code="FETCH_FAILED",
            message="获取大纲meta信息失败",
            status_code=500,
        ) from e
    return {
            "meta": None,
            "has_meta": False,
        }
    


@router.get("/projects/{project_id}/export/markdown")
async def export_outline_markdown(
    project_id: int = Path(..., description="项目ID"),
):
    """
    导出大纲为Markdown格式
    """
    try:
        markdown_content = await OutlineExportService.export_to_markdown(project_id)
        return StreamingResponse(
            iter([markdown_content]),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=outline_{project_id}.md",
            },
        )
    except Exception as e:
        logger.error(f"导出Markdown失败: {e}")
        raise APIError(code="EXPORT_FAILED", message="导出失败", status_code=500) from e


@router.get("/projects/{project_id}/export/json")
async def export_outline_json(
    project_id: int = Path(..., description="项目ID"),
):
    """
    导出大纲为JSON格式
    """
    try:
        json_data = await OutlineExportService.export_to_json(project_id)
        
    except Exception as e:
        logger.error(f"导出JSON失败: {e}")
        raise APIError(code="EXPORT_FAILED", message="导出失败", status_code=500) from e
    return json_data


@router.post("/projects/{project_id}/continue")
async def continue_outline_with_ai(
    project_id: int = Path(..., description="项目ID"),
    user_id: int = Query(1, description="用户ID"),
    data: OutlineContinueRequest = ...,
):
    """
    AI续写大纲（SSE流式返回）
    基于已有大纲内容，智能生成后续章节大纲
    注意：会自动提取现有大纲作为上下文，并为chapter节点创建Chapter记录
    """
    return StreamingResponse(
        OutlineContinueService.continue_outline_stream(
            project_id=project_id,
            user_id=user_id,
            chapter_count=data.chapter_count,
            additional_context=data.additional_context or "",
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )