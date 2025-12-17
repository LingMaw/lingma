"""小说项目数据结构定义
定义请求和响应的数据模型
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NovelProjectBase(BaseModel):
    """小说项目基础模型"""
    title: str = Field(..., max_length=200, description="项目标题")
    description: Optional[str] = Field(None, description="项目描述")
    genre: Optional[str] = Field(None, max_length=50, description="小说类型")
    style: Optional[str] = Field(None, max_length=50, description="写作风格")
    status: Optional[str] = Field("draft", description="项目状态")
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(0, description="字数统计")
    use_chapter_system: Optional[bool] = Field(False, description="是否启用章节系统")


class NovelProjectCreate(NovelProjectBase):
    """创建小说项目请求模型"""
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(0, description="字数统计")
    use_chapter_system: Optional[bool] = Field(False, description="是否启用章节系统")


class NovelProjectUpdate(NovelProjectBase):
    """更新小说项目请求模型"""
    title: Optional[str] = Field(None, max_length=200, description="项目标题")
    status: Optional[str] = Field(None, description="项目状态")
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(None, description="字数统计")
    use_chapter_system: Optional[bool] = Field(None, description="是否启用章节系统")


class NovelProjectResponse(NovelProjectBase):
    """小说项目响应模型"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NovelProjectListResponse(BaseModel):
    """小说项目列表响应模型"""
    total: int
    items: List[NovelProjectResponse]

class ChapterBase(BaseModel):
    """章节基础模型"""
    chapter_id: str = Field(..., description="章节UUID")
    chapter_number: int = Field(..., description="章节序号")
    title: str = Field(..., max_length=200, description="章节标题")
    content: Optional[str] = Field(None, description="正文内容")


class ChapterCreate(ChapterBase):
    """创建章节请求模型"""
    pass


class ChapterUpdate(ChapterBase):
    """更新章节请求模型"""
    title: Optional[str] = Field(None, max_length=200, description="章节标题")
    content: Optional[str] = Field(None, description="正文内容")


class ChapterResponse(ChapterBase):
    """章节响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterListResponse(BaseModel):
    """章节列表响应模型"""
    total: int
    items: List[ChapterResponse]


class ChapterOrderUpdate(BaseModel):
    """章节顺序更新模型"""
    chapter_ids: List[str] = Field(..., description="章节ID列表")