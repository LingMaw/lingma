"""
大纲节点Pydantic验证模型
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# 请求模型
class OutlineNodeCreate(BaseModel):
    """创建大纲节点"""

    parent_id: Optional[int] = Field(None, description="父节点ID，null表示根节点")
    node_type: Literal['volume', 'chapter', 'section'] = Field(..., description="节点类型：volume/chapter/section")
    title: str = Field(..., min_length=1, max_length=200, description="节点标题")
    description: Optional[str] = Field(None, description="节点描述/摘要")


class OutlineNodeUpdate(BaseModel):
    """更新大纲节点"""

    title: Optional[str] = Field(None, min_length=1, max_length=200, description="节点标题")
    description: Optional[str] = Field(None, description="节点描述/摘要")
    is_expanded: Optional[bool] = Field(None, description="是否展开")


class OutlineNodeReorder(BaseModel):
    """拖拽排序"""

    new_parent_id: Optional[int] = Field(None, description="新父节点ID")
    new_position: int = Field(..., ge=0, description="新位置（0-based）")


# 响应模型
class OutlineNodeResponse(BaseModel):
    """大纲节点响应"""

    id: int
    project_id: int
    parent_id: Optional[int]
    node_type: Literal['volume', 'chapter', 'section']
    title: str
    description: Optional[str]
    position: int
    is_expanded: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OutlineTreeNode(OutlineNodeResponse):
    """树状结构节点（包含子节点）"""

    children: list["OutlineTreeNode"] = []

    class Config:
        from_attributes = True


# 用于section提纲
class SectionHint(BaseModel):
    """章节下的section提纲"""

    title: str
    description: Optional[str]


class SectionHintsResponse(BaseModel):
    """section提纲列表"""

    sections: list[SectionHint]


class AIOutlineGenerateRequest(BaseModel):
    """AI生成大纲请求"""

    key_plots: Optional[list[str]] = Field(default_factory=list, description="关键剧情点列表")
    additional_content: Optional[str] = Field("", description="其他内容/补充说明")
    chapter_count_min: int = Field(10, ge=5, le=100, description="最少章节数")
    chapter_count_max: int = Field(50, ge=5, le=200, description="最多章节数")


class OutlineContinueRequest(BaseModel):
    """AI续写大纲请求"""

    chapter_count: int = Field(..., ge=1, le=100, description="续写章节数")
    additional_context: Optional[str] = Field("", description="额外上下文/指令")
