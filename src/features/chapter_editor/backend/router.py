"""章节编辑器API路由"""
from fastapi import APIRouter, Query
from typing import List

from src.features.chapter_editor.backend.schemas import (
    ChapterListItem,
    ChapterDetail,
    ChapterCreateRequest,
    ChapterCreateFromOutlineRequest,
    ChapterUpdateRequest,
    ChapterDeleteResponse,
    AIGenerateRequest,
    OutlineNodeOption,
    ChapterStatusResponse
)
from src.features.chapter_editor.backend.services import ChapterEditorService

router = APIRouter()


@router.get("/chapters", response_model=List[ChapterListItem])
async def get_chapters(project_id: int = Query(..., description="项目ID")):
    """获取章节列表
    
    Args:
        project_id: 项目ID
        
    Returns:
        章节列表
    """
    return await ChapterEditorService.get_chapter_list(project_id)


@router.post("/chapters", response_model=ChapterDetail)
async def create_chapter(request: ChapterCreateRequest):
    """创建章节（独立创建）
    
    Args:
        request: 创建请求
        
    Returns:
        创建的章节详情
    """
    return await ChapterEditorService.create_chapter(
        title=request.title,
        project_id=request.project_id,
        outline_node_id=request.outline_node_id
    )


@router.post("/chapters/from-outline", response_model=ChapterDetail)
async def create_chapter_from_outline(request: ChapterCreateFromOutlineRequest):
    """从大纲节点创建章节
    
    Args:
        request: 创建请求
        
    Returns:
        创建的章节详情
    """
    return await ChapterEditorService.create_from_outline(request.outline_node_id)


@router.get("/chapters/{chapter_id}", response_model=ChapterDetail)
async def get_chapter(chapter_id: str):
    """获取章节详情
    
    Args:
        chapter_id: 章节ID
        
    Returns:
        章节详情
    """
    return await ChapterEditorService.get_chapter_detail(chapter_id)


@router.put("/chapters/{chapter_id}", response_model=ChapterDetail)
async def update_chapter(chapter_id: str, request: ChapterUpdateRequest):
    """更新章节内容
    
    Args:
        chapter_id: 章节ID
        request: 更新请求
        
    Returns:
        更新后的章节详情
    """
    return await ChapterEditorService.update_chapter(
        chapter_id=chapter_id,
        title=request.title,
        content=request.content,
        outline_node_id=request.outline_node_id
    )


@router.delete("/chapters/{chapter_id}", response_model=ChapterDeleteResponse)
async def delete_chapter(chapter_id: str):
    """删除章节
    
    Args:
        chapter_id: 章节ID
        
    Returns:
        删除结果
    """
    await ChapterEditorService.delete_chapter(chapter_id)
    return ChapterDeleteResponse(success=True, message="章节删除成功")


@router.post("/chapters/{chapter_id}/generate-stream")
async def generate_content_stream(chapter_id: str, request: AIGenerateRequest):
    """AI生成章节内容（流式）
    
    Args:
        chapter_id: 章节ID
        request: 生成请求
        
    Returns:
        SSE流式响应
    """
    return await ChapterEditorService.generate_content_stream(
        chapter_id=chapter_id,
        prompt=request.prompt,
        use_outline_context=request.use_outline_context
    )


@router.get("/outline-nodes", response_model=List[OutlineNodeOption])
async def get_outline_nodes(project_id: int = Query(..., description="项目ID")):
    """获取可关联的大纲节点
    
    Args:
        project_id: 项目ID
        
    Returns:
        大纲节点选项列表
    """
    return await ChapterEditorService.get_available_outline_nodes(project_id)


@router.get("/outline-node/{node_id}/chapter-status", response_model=ChapterStatusResponse)
async def get_chapter_status(node_id: int):
    """检查节点章节状态（大纲页面使用）
    
    Args:
        node_id: 节点ID
        
    Returns:
        章节状态
    """
    return await ChapterEditorService.get_chapter_status(node_id)
