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


class NovelProjectCreate(NovelProjectBase):
    """创建小说项目请求模型"""
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(0, description="字数统计")


class NovelProjectUpdate(NovelProjectBase):
    """更新小说项目请求模型"""
    title: Optional[str] = Field(None, max_length=200, description="项目标题")
    status: Optional[str] = Field(None, description="项目状态")
    content: Optional[str] = Field(None, description="小说内容")
    word_count: Optional[int] = Field(None, description="字数统计")


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