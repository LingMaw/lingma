"""
章节Pydantic验证模型
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# 请求模型
class ChapterCreate(BaseModel):
    """创建章节"""

    title: str = Field(..., min_length=1, max_length=200, description="章节标题")
    outline_node_id: Optional[int] = Field(None, description="关联大纲节点ID（可为空）")


class ChapterUpdate(BaseModel):
    """更新章节"""

    title: Optional[str] = Field(None, min_length=1, max_length=200, description="章节标题")
    content: Optional[str] = Field(None, description="正文内容")
    status: Optional[str] = Field(None, description="状态：draft/completed/ai_generated")


class ChapterExpandRequest(BaseModel):
    """章节扩写请求"""

    content: str = Field(..., description="原始内容")
    expand_ratio: float = Field(default=1.5, ge=1.0, le=5.0, description="扩写比例（1.0-5.0）")
    requirement: Optional[str] = Field(default="", description="额外要求")


class ChapterCompressRequest(BaseModel):
    """章节缩写请求"""

    content: str = Field(..., description="原始内容")
    compress_ratio: int = Field(default=50, ge=10, le=90, description="压缩比例（10-90，表示压缩到50%）")
    requirement: Optional[str] = Field(default="", description="额外要求")


# 响应模型
class ChapterResponse(BaseModel):
    """章节响应"""

    id: int
    uuid: UUID
    project_id: int
    outline_node_id: Optional[int]
    title: str
    content: str
    chapter_number: int
    word_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterListItem(BaseModel):
    """章节列表项（简化版）"""

    id: int
    uuid: UUID
    title: str
    chapter_number: int
    word_count: int
    status: str
    outline_node_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterWithHints(ChapterResponse):
    """章节详情（包含section提纲）"""

    section_hints: list[dict] = []

    class Config:
        from_attributes = True
