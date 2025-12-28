"""
大纲系统API路由
"""

from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import StreamingResponse
from loguru import logger

from src.backend.core.exceptions import APIError
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_outline.backend.schemas import (
    AIOutlineGenerateRequest,
    OutlineNodeCreate,
    OutlineNodeReorder,
    OutlineNodeResponse,
    OutlineNodeUpdate,
    SectionHintsResponse,
)
# 导入同步服务
from src.features.chapter.backend.services.sync_service import ChapterSyncService
# 导入AI大纲服务
from src.features.novel_outline.backend.services.ai_outline_service import (
    AIOutlineService,
    OutlineExportService,
)

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
        return nodes
    except Exception as e:
        logger.error(f"获取大纲节点失败: {e}")
        raise APIError(code="FETCH_FAILED", message="获取大纲节点失败", status_code=500)


@router.post("/projects/{project_id}/nodes", response_model=OutlineNodeResponse)
async def create_outline_node(
    project_id: int = Path(..., description="项目ID"),
    data: OutlineNodeCreate = ...,
):
    """
    创建大纲节点
    注意：如果是chapter类型，会自动创建对应的Chapter记录（通过同步服务）
    """
    try:
        # 验证层级规则
        if data.parent_id:
            parent = await OutlineNode.get_or_none(id=data.parent_id)
            if not parent:
                raise APIError(
                    code="PARENT_NOT_FOUND",
                    message="父节点不存在",
                    status_code=404,
                )

            # 层级验证
            if data.node_type == "volume":
                raise APIError(
                    code="INVALID_HIERARCHY",
                    message="卷(volume)只能作为根节点",
                    status_code=400,
                )
            elif data.node_type == "chapter" and parent.node_type != "volume":
                raise APIError(
                    code="INVALID_HIERARCHY",
                    message="章(chapter)只能挂在卷(volume)下",
                    status_code=400,
                )
            elif data.node_type == "section" and parent.node_type != "chapter":
                raise APIError(
                    code="INVALID_HIERARCHY",
                    message="小节(section)只能挂在章(chapter)下",
                    status_code=400,
                )

        # 计算position：获取同级最大position + 1
        max_position_node = (
            await OutlineNode.filter(
                project_id=project_id, parent_id=data.parent_id
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
        return node

    except APIError:
        raise
    except Exception as e:
        logger.error(f"创建大纲节点失败: {e}")
        raise APIError(code="CREATE_FAILED", message="创建大纲节点失败", status_code=500)


@router.put("/nodes/{node_id}", response_model=OutlineNodeResponse)
async def update_outline_node(
    node_id: int = Path(..., description="节点ID"),
    data: OutlineNodeUpdate = ...,
):
    """
    更新大纲节点
    注意：如果是chapter类型，会自动更新对应的Chapter记录（通过同步服务）
    """
    try:
        node = await OutlineNode.get_or_none(id=node_id)
        if not node:
            raise APIError(code="NOT_FOUND", message="节点不存在", status_code=404)

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
        return node

    except APIError:
        raise
    except Exception as e:
        logger.error(f"更新大纲节点失败: {e}")
        raise APIError(code="UPDATE_FAILED", message="更新大纲节点失败", status_code=500)


@router.delete("/nodes/{node_id}")
async def delete_outline_node(
    node_id: int = Path(..., description="节点ID"),
):
    """
    删除大纲节点
    注意：会级联删除所有子节点，对应的Chapter记录的outline_node_id会被设为null
    """
    try:
        node = await OutlineNode.get_or_none(id=node_id)
        if not node:
            raise APIError(code="NOT_FOUND", message="节点不存在", status_code=404)

        # 保存节点ID用于同步
        deleted_node_id = node.id
        
        await node.delete()
        
        # 触发同步：通知章节系统节点已删除
        await ChapterSyncService.sync_on_delete(deleted_node_id)
        
        logger.info(f"删除大纲节点: {node_id}")
        return {"message": "删除成功"}

    except APIError:
        raise
    except Exception as e:
        logger.error(f"删除大纲节点失败: {e}")
        raise APIError(code="DELETE_FAILED", message="删除大纲节点失败", status_code=500)


@router.post("/nodes/{node_id}/reorder", response_model=OutlineNodeResponse)
async def reorder_outline_node(
    node_id: int = Path(..., description="节点ID"),
    data: OutlineNodeReorder = ...,
):
    """
    拖拽排序：调整节点的父节点和位置
    注意：会触发章节编号重算（如果涉及chapter节点）
    """
    try:
        node = await OutlineNode.get_or_none(id=node_id)
        if not node:
            raise APIError(code="NOT_FOUND", message="节点不存在", status_code=404)

        # 验证新父节点
        if data.new_parent_id:
            new_parent = await OutlineNode.get_or_none(id=data.new_parent_id)
            if not new_parent:
                raise APIError(
                    code="PARENT_NOT_FOUND",
                    message="新父节点不存在",
                    status_code=404,
                )

            # 层级验证（同创建时的规则）
            if node.node_type == "volume":
                raise APIError(
                    code="INVALID_HIERARCHY",
                    message="卷(volume)只能作为根节点",
                    status_code=400,
                )
            elif node.node_type == "chapter" and new_parent.node_type != "volume":
                raise APIError(
                    code="INVALID_HIERARCHY",
                    message="章(chapter)只能挂在卷(volume)下",
                    status_code=400,
                )
            elif node.node_type == "section" and new_parent.node_type != "chapter":
                raise APIError(
                    code="INVALID_HIERARCHY",
                    message="小节(section)只能挂在章(chapter)下",
                    status_code=400,
                )

        # 更新节点的父节点和位置
        node.parent_id = data.new_parent_id
        node.position = data.new_position
        await node.save()

        # 触发章节编号重算（如果涉及chapter节点）
        await ChapterSyncService.recalculate_all_numbers(node.project_id)
        
        logger.info(f"拖拽排序大纲节点: {node_id}")
        return node

    except APIError:
        raise
    except Exception as e:
        logger.error(f"拖拽排序失败: {e}")
        raise APIError(code="REORDER_FAILED", message="拖拽排序失败", status_code=500)


@router.get("/nodes/{chapter_node_id}/section-hints", response_model=SectionHintsResponse)
async def get_section_hints(
    chapter_node_id: int = Path(..., description="章节节点ID"),
):
    """
    获取章节下的section节点作为写作提纲
    用于AI生成章节内容时参考
    """
    try:
        chapter_node = await OutlineNode.get_or_none(id=chapter_node_id)
        if not chapter_node or chapter_node.node_type != "chapter":
            raise APIError(
                code="INVALID_NODE_TYPE",
                message="节点不是章节类型",
                status_code=400,
            )

        sections = (
            await OutlineNode.filter(
                parent_id=chapter_node_id, node_type="section"
            )
            .order_by("position")
            .all()
        )

        return {
            "sections": [
                {"title": s.title, "description": s.description} for s in sections
            ]
        }

    except APIError:
        raise
    except Exception as e:
        logger.error(f"获取section提纲失败: {e}")
        raise APIError(
            code="FETCH_FAILED", message="获取section提纲失败", status_code=500
        )


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
                "Content-Disposition": f"attachment; filename=outline_{project_id}.md"
            },
        )
    except Exception as e:
        logger.error(f"导出Markdown失败: {e}")
        raise APIError(code="EXPORT_FAILED", message="导出失败", status_code=500)


@router.get("/projects/{project_id}/export/json")
async def export_outline_json(
    project_id: int = Path(..., description="项目ID"),
):
    """
    导出大纲为JSON格式
    """
    try:
        json_data = await OutlineExportService.export_to_json(project_id)
        return json_data
    except Exception as e:
        logger.error(f"导出JSON失败: {e}")
        raise APIError(code="EXPORT_FAILED", message="导出失败", status_code=500)
