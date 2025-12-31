"""
章节系统API路由
"""

import uuid
from typing import Any, Dict

from fastapi import APIRouter, Body, Path
from fastapi.responses import StreamingResponse
from loguru import logger

from src.backend.core.dependencies import CurrentUserId
from src.backend.core.exceptions import APIError
from src.backend.core.response import MessageResponse, message_response
from src.features.chapter.backend.models import Chapter
from src.features.chapter.backend.schemas import (
    ChapterCreate,
    ChapterListItem,
    ChapterResponse,
    ChapterUpdate,
    ChapterWithHints,
)
from src.features.chapter.backend.services.ai_service import chapter_ai_service
from src.features.novel_outline.backend.models import OutlineNode

router = APIRouter(prefix="/chapters", tags=["章节系统"])


@router.get("/projects/{project_id}", response_model=list[ChapterListItem])
async def get_chapters(
    project_id: int = Path(..., description="项目ID"),
):
    """
    获取项目的所有章节列表（按chapter_number排序）
    """
    try:
        chapters = (
            await Chapter.filter(project_id=project_id)
            .order_by("chapter_number")
            .all()
        )
    except Exception as e:
        logger.error(f"获取章节列表失败: {e}")
        raise APIError(code="FETCH_FAILED", message="获取章节列表失败", status_code=500) from e
    return chapters


@router.post("/projects/{project_id}", response_model=ChapterResponse)
async def create_chapter(
    project_id: int = Path(..., description="项目ID"),
    data: ChapterCreate = ...,
):
    """
    创建章节（手动创建，不关联大纲）
    注意：通常应该通过创建大纲节点来自动创建章节
    """
    def _raise_invalid_node() -> None:
        raise APIError(
            code="INVALID_NODE",
            message="关联的大纲节点不存在或类型不是chapter",
            status_code=400,
        )

    try:
        # 验证outline_node_id（如果提供）
        if data.outline_node_id:
            node = await OutlineNode.get_or_none(id=data.outline_node_id)
            if not node or node.node_type != "chapter":
                _raise_invalid_node()

        # 计算chapter_number：获取最大编号 + 1
        max_chapter = (
            await Chapter.filter(project_id=project_id)
            .order_by("-chapter_number")
            .first()
        )
        chapter_number = (max_chapter.chapter_number + 1) if max_chapter else 1

        # 创建章节
        chapter = await Chapter.create(
            uuid=uuid.uuid4(),
            project_id=project_id,
            outline_node_id=data.outline_node_id,
            title=data.title,
            chapter_number=chapter_number,
            content="",
            word_count=0,
            status="draft",
        )

    except APIError:
        raise
    except Exception as e:
        logger.error(f"创建章节失败: {e}")
        raise APIError(code="CREATE_FAILED", message="创建章节失败", status_code=500) from e
    else:
        logger.info(f"创建章节: {chapter.id} - {chapter.title}")
        return chapter


@router.get("/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    chapter_id: int = Path(..., description="章节ID"),
):
    """
    获取章节详情
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

    except APIError:
        raise
    except Exception as e:
        logger.error(f"获取章节详情失败: {e}")
        raise APIError(code="FETCH_FAILED", message="获取章节详情失败", status_code=500) from e
    else:
        return chapter


@router.get("/{chapter_id}/with-hints", response_model=ChapterWithHints)
async def get_chapter_with_hints(
    chapter_id: int = Path(..., description="章节ID"),
):
    """
    获取章节详情（包含section提纲）
    用于AI生成章节内容
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)
    
    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()
    
        # 获取section提纲
        section_hints = []
        if chapter.outline_node_id:
            sections = (
                await OutlineNode.filter(
                    parent_id=chapter.outline_node_id, node_type="section",
                )
                .order_by("position")
                .all()
            )
            section_hints = [
                {"title": s.title, "description": s.description} for s in sections
            ]
    
        # 构造响应
        chapter_dict = {
            "id": chapter.id,
            "uuid": chapter.uuid,
            "project_id": chapter.project_id,
            "outline_node_id": chapter.outline_node_id,
            "title": chapter.title,
            "content": chapter.content,
            "chapter_number": chapter.chapter_number,
            "word_count": chapter.word_count,
            "status": chapter.status,
            "created_at": chapter.created_at,
            "updated_at": chapter.updated_at,
            "section_hints": section_hints,
        }
    
    except APIError:
        raise
    except Exception as e:
        logger.error(f"获取章节详情失败: {e}")
        raise APIError(code="FETCH_FAILED", message="获取章节详情失败", status_code=500) from e
    else:
        return chapter_dict


@router.put("/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: int = Path(..., description="章节ID"),
    data: ChapterUpdate = ...,
):
    """
    更新章节
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        # 更新字段
        if data.title is not None:
            chapter.title = data.title
        if data.content is not None:
            chapter.content = data.content
            # 更新字数统计（去除换行符和空格后的长度）
            chapter.word_count = len(data.content.replace("\n", "").replace("\r", "").replace(" ", ""))
        if data.status is not None:
            chapter.status = data.status

        await chapter.save()

        # 更新关联项目的字数统计（所有章节字数之和）
        try:
            from src.features.novel_project.backend.models import NovelProject
            project = await NovelProject.get_or_none(id=chapter.project_id)
            if project:
                # 获取该项目所有章节的字数总和
                chapters = await Chapter.filter(project_id=chapter.project_id).all()
                total_word_count = sum(ch.word_count for ch in chapters)
                project.word_count = total_word_count
                await project.save()
                logger.info(f"更新项目 {chapter.project_id} 字数统计: {total_word_count}")
        except Exception as e:
            logger.error(f"更新项目字数统计失败: {e}")

    except APIError:
        raise
    except Exception as e:
        logger.error(f"更新章节失败: {e}")
        raise APIError(code="UPDATE_FAILED", message="更新章节失败", status_code=500) from e
    else:
        logger.info(f"更新章节: {chapter.id}")
        return chapter


@router.delete("/{chapter_id}", response_model=MessageResponse)
async def delete_chapter(
    chapter_id: int = Path(..., description="章节ID"),
):
    """
    删除章节（不影响大纲节点）
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        await chapter.delete()

    except APIError:
        raise
    except Exception as e:
        logger.error(f"删除章节失败: {e}")
        raise APIError(code="DELETE_FAILED", message="删除章节失败", status_code=500) from e
    else:
        logger.info(f"删除章节: {chapter_id}")
        return message_response("删除成功")


@router.post("/{chapter_id}/ai-generate-stream")
async def ai_generate_chapter_stream(
    chapter_id: int = Path(..., description="章节ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI流式生成章节内容
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        requirement = data.get("requirement", "")

        async def content_stream():
            try:
                yield "".encode("utf-8")  # 初始心跳包

                # 调用AI服务生成内容
                async for chunk in chapter_ai_service.generate_chapter_content(
                    chapter=chapter,
                    user_id=int(user_id),
                    requirement=requirement,
                ):
                    if "[REASONING]" in chunk and "[/REASONING]" in chunk:
                        start_idx = chunk.find("[REASONING]") + len("[REASONING]")
                        end_idx = chunk.find("[/REASONING]")
                        reasoning_content = chunk[start_idx:end_idx]
                        yield f"[REASONING]{reasoning_content}[/REASONING]".encode(
                            "utf-8",
                        )
                    elif chunk.strip():
                        yield chunk.encode("utf-8")
                    yield "".encode("utf-8")  # 心跳包

            except Exception as e:
                logger.error(f"流式生成章节内容时发生错误: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")
            finally:
                yield "".encode("utf-8")  # 结束标记

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
        logger.error(f"AI生成章节失败: {e}")
        raise APIError(
            code="AI_GENERATE_FAILED", message="AI生成章节失败", status_code=500,
        ) from e


@router.post("/{chapter_id}/ai-continue-stream")
async def ai_continue_chapter_stream(
    chapter_id: int = Path(..., description="章节ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI续写章节内容
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        current_content = data.get("current_content", chapter.content)
        requirement = data.get("requirement", "")

        async def content_stream():
            try:
                yield "".encode("utf-8")

                async for chunk in chapter_ai_service.continue_chapter_content(
                    chapter=chapter,
                    user_id=int(user_id),
                    current_content=current_content,
                    requirement=requirement,
                ):
                    if "[REASONING]" in chunk and "[/REASONING]" in chunk:
                        start_idx = chunk.find("[REASONING]") + len("[REASONING]")
                        end_idx = chunk.find("[/REASONING]")
                        reasoning_content = chunk[start_idx:end_idx]
                        yield f"[REASONING]{reasoning_content}[/REASONING]".encode(
                            "utf-8",
                        )
                    elif chunk.strip():
                        yield chunk.encode("utf-8")
                    yield "".encode("utf-8")

            except Exception as e:
                logger.error(f"流式续写章节内容时发生错误: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")
            finally:
                yield "".encode("utf-8")

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
        logger.error(f"AI续写章节失败: {e}")
        raise APIError(
            code="AI_CONTINUE_FAILED", message="AI续写章节失败", status_code=500,
        ) from e


@router.post("/{chapter_id}/ai-optimize-stream")
async def ai_optimize_chapter_stream(
    chapter_id: int = Path(..., description="章节ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI优化章节内容
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        content_to_optimize = data.get("content", chapter.content)
        optimization_type = data.get("type", "general")  # general, grammar, style

        async def content_stream():
            try:
                yield "".encode("utf-8")

                async for chunk in chapter_ai_service.optimize_chapter_content(
                    chapter=chapter,
                    user_id=int(user_id),
                    content=content_to_optimize,
                    optimization_type=optimization_type,
                ):
                    if "[REASONING]" in chunk and "[/REASONING]" in chunk:
                        start_idx = chunk.find("[REASONING]") + len("[REASONING]")
                        end_idx = chunk.find("[/REASONING]")
                        reasoning_content = chunk[start_idx:end_idx]
                        yield f"[REASONING]{reasoning_content}[/REASONING]".encode(
                            "utf-8",
                        )
                    elif chunk.strip():
                        yield chunk.encode("utf-8")
                    yield "".encode("utf-8")

            except Exception as e:
                logger.error(f"流式优化章节内容时发生错误: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")
            finally:
                yield "".encode("utf-8")

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
        logger.error(f"AI优化章节失败: {e}")
        raise APIError(
            code="AI_OPTIMIZE_FAILED", message="AI优化章节失败", status_code=500,
        ) from e


@router.post("/{chapter_id}/ai-expand-stream")
async def ai_expand_chapter_stream(
    chapter_id: int = Path(..., description="章节ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI扩写章节内容
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        content_to_expand = data.get("content", chapter.content)
        expand_ratio = data.get("expand_ratio", 1.5)  # 默认扩写1.5倍
        requirement = data.get("requirement", "")

        async def content_stream():
            try:
                yield "".encode("utf-8")

                async for chunk in chapter_ai_service.expand_chapter_content(
                    chapter=chapter,
                    user_id=int(user_id),
                    content=content_to_expand,
                    expand_ratio=expand_ratio,
                    requirement=requirement,
                ):
                    if "[REASONING]" in chunk and "[/REASONING]" in chunk:
                        start_idx = chunk.find("[REASONING]") + len("[REASONING]")
                        end_idx = chunk.find("[/REASONING]")
                        reasoning_content = chunk[start_idx:end_idx]
                        yield f"[REASONING]{reasoning_content}[/REASONING]".encode(
                            "utf-8",
                        )
                    elif chunk.strip():
                        yield chunk.encode("utf-8")
                    yield "".encode("utf-8")

            except Exception as e:
                logger.error(f"流式扩写章节内容时发生错误: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")
            finally:
                yield "".encode("utf-8")

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
        logger.error(f"AI扩写章节失败: {e}")
        raise APIError(
            code="AI_EXPAND_FAILED", message="AI扩写章节失败", status_code=500,
        ) from e


@router.post("/{chapter_id}/ai-compress-stream")
async def ai_compress_chapter_stream(
    chapter_id: int = Path(..., description="章节ID"),
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
):
    """
    AI缩写章节内容
    """
    def _raise_not_found() -> None:
        raise APIError(code="NOT_FOUND", message="章节不存在", status_code=404)

    try:
        chapter = await Chapter.get_or_none(id=chapter_id)
        if not chapter:
            _raise_not_found()

        content_to_compress = data.get("content", chapter.content)
        compress_ratio = data.get("compress_ratio", 50)  # 默认压缩到50%
        requirement = data.get("requirement", "")

        async def content_stream():
            try:
                yield "".encode("utf-8")

                async for chunk in chapter_ai_service.compress_chapter_content(
                    chapter=chapter,
                    user_id=int(user_id),
                    content=content_to_compress,
                    compress_ratio=compress_ratio,
                    requirement=requirement,
                ):
                    if "[REASONING]" in chunk and "[/REASONING]" in chunk:
                        start_idx = chunk.find("[REASONING]") + len("[REASONING]")
                        end_idx = chunk.find("[/REASONING]")
                        reasoning_content = chunk[start_idx:end_idx]
                        yield f"[REASONING]{reasoning_content}[/REASONING]".encode(
                            "utf-8",
                        )
                    elif chunk.strip():
                        yield chunk.encode("utf-8")
                    yield "".encode("utf-8")

            except Exception as e:
                logger.error(f"流式缩写章节内容时发生错误: {e}")
                yield f"error: {e!s}\n\n".encode("utf-8")
            finally:
                yield "".encode("utf-8")

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
        logger.error(f"AI缩写章节失败: {e}")
        raise APIError(
            code="AI_COMPRESS_FAILED", message="AI缩写章节失败", status_code=500,
        ) from e
