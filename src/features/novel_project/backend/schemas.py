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
    genre: Optional[str] = Field(None, max_length=100, description="小说类型")
    style: Optional[str] = Field(None, max_length=500, description="写作风格")
    status: Optional[str] = Field("draft", description="项目状态")
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(0, description="字数统计")
    target_word_count: Optional[int] = Field(None, description="目标字数")
    use_chapter_system: Optional[bool] = Field(False, description="是否启用章节管理")


class NovelProjectCreate(NovelProjectBase):
    """创建小说项目请求模型"""
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(0, description="字数统计")
    use_chapter_system: Optional[bool] = Field(False, description="是否启用章节管理")


class NovelProjectUpdate(NovelProjectBase):
    """更新小说项目请求模型"""
    title: Optional[str] = Field(None, max_length=200, description="项目标题")
    status: Optional[str] = Field(None, description="项目状态")
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(None, description="字数统计")
    use_chapter_system: Optional[bool] = Field(None, description="是否启用章节管理")


class NovelProjectResponse(NovelProjectBase):
    """小说项目响应模型"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    chapter_count: Optional[int] = Field(0, description="章节数量")
    character_count: Optional[int] = Field(0, description="角色数量")

    class Config:
        from_attributes = True


class NovelProjectListResponse(BaseModel):
    """小说项目列表响应模型"""
    total: int
    items: List[NovelProjectResponse]