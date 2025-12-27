"""
大纲解析器 API 路由

提供大纲解析和章节批量创建的 API 端点
"""

import uuid
from fastapi import APIRouter, HTTPException
from typing import List

from .parser import OutlineParser
from .schemas import (
    ParseRequest,
    ParseResponse,
    ChapterPreview,
    CreateChaptersRequest,
    CreateChaptersResponse,
)
from src.features.novel_project.backend.models import Chapter, NovelProject
from src.backend.core.exceptions import APIError

router = APIRouter(prefix="/outline-parser", tags=["大纲解析"])


@router.post("/parse", response_model=ParseResponse)
async def parse_outline(request: ParseRequest):
    """
    解析大纲文本

    Args:
        request: 解析请求，包含文本和格式类型

    Returns:
        解析后的章节预览列表

    Raises:
        HTTPException: 解析失败时抛出 400 错误
    """
    try:
        # 验证文本不为空
        if not request.text or not request.text.strip():
            raise APIError(
                code="EMPTY_TEXT", message="大纲文本不能为空", status_code=400
            )

        # 检测格式
        detected_format = OutlineParser.detect_format(request.text)
        format_to_use = (
            detected_format if request.format == "auto" else request.format
        )

        # 解析大纲
        chapter_data_list = OutlineParser.parse(request.text, format_to_use)

        # 验证是否解析出章节
        if not chapter_data_list:
            raise APIError(
                code="NO_CHAPTERS_FOUND",
                message="未能从大纲中识别出章节，请检查格式是否正确",
                status_code=400,
            )

        # 构建预览数据
        chapters = [
            ChapterPreview(
                title=chapter.title,
                outline_description=chapter.outline_description,
                preview=f"识别为第 {idx + 1} 章",
            )
            for idx, chapter in enumerate(chapter_data_list)
        ]

        return ParseResponse(
            chapters=chapters,
            total_count=len(chapters),
            detected_format=detected_format,
        )

    except APIError:
        raise
    except Exception as e:
        raise APIError(
            code="PARSE_ERROR",
            message=f"解析大纲时发生错误: {str(e)}",
            status_code=500,
        )


@router.post("/create-chapters", response_model=CreateChaptersResponse)
async def create_chapters(request: CreateChaptersRequest):
    """
    批量创建章节

    Args:
        request: 创建请求，包含项目 ID 和章节数据列表

    Returns:
        创建结果，包含创建的章节 ID 列表

    Raises:
        HTTPException: 创建失败时抛出错误
    """
    try:
        # 验证项目是否存在
        project = await NovelProject.get_or_none(id=request.project_id)
        if not project:
            raise APIError(
                code="PROJECT_NOT_FOUND",
                message=f"项目 ID {request.project_id} 不存在",
                status_code=404,
            )

        # 验证章节数量
        if len(request.chapters) > 1000:
            raise APIError(
                code="TOO_MANY_CHAPTERS",
                message="单次最多创建 1000 个章节，请分批创建",
                status_code=400,
            )

        if not request.chapters:
            raise APIError(
                code="EMPTY_CHAPTERS", message="章节列表不能为空", status_code=400
            )

        # 获取项目当前最大章节序号
        max_chapter = (
            await Chapter.filter(project_id=request.project_id)
            .order_by("-chapter_number")
            .first()
        )
        next_chapter_number = max_chapter.chapter_number + 1 if max_chapter else 1

        # 批量创建章节
        created_chapters: List[Chapter] = []
        chapter_ids: List[str] = []

        for idx, chapter_data in enumerate(request.chapters):
            chapter_id = str(uuid.uuid4())
            chapter_number = next_chapter_number + idx

            # 创建章节记录
            chapter = await Chapter.create(
                chapter_id=chapter_id,
                chapter_number=chapter_number,
                title=chapter_data.title,
                content="",  # 初始内容为空
                outline_description=chapter_data.outline_description,
                project_id=request.project_id,
            )

            created_chapters.append(chapter)
            chapter_ids.append(chapter_id)

        # 更新项目的 chapter_ids
        current_chapter_ids = project.chapter_ids or []
        updated_chapter_ids = current_chapter_ids + chapter_ids
        project.chapter_ids = updated_chapter_ids
        await project.save()

        # 如果项目未启用章节系统，自动启用
        if not project.use_chapter_system:
            project.use_chapter_system = True
            await project.save()

        return CreateChaptersResponse(
            created_count=len(created_chapters),
            chapter_ids=chapter_ids,
            message=f"成功创建 {len(created_chapters)} 个章节",
        )

    except APIError:
        raise
    except Exception as e:
        raise APIError(
            code="CREATE_ERROR",
            message=f"创建章节时发生错误: {str(e)}",
            status_code=500,
        )
