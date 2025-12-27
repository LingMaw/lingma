"""章节编辑器 Pydantic 数据模型"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class ChapterListItem(BaseModel):
    """章节列表项"""
    chapter_id: str = Field(description="章节UUID")
    title: str = Field(description="章节标题（从OutlineNode读取或显示'未命名章节'）")
    word_count: int = Field(description="正文字数（过滤Markdown标记）")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最后修改时间")
    has_outline: bool = Field(description="是否关联大纲节点")
    outline_title: Optional[str] = Field(None, description="关联节点的标题")
    
    class Config:
        from_attributes = True


class ChapterDetail(BaseModel):
    """章节详情"""
    chapter_id: str = Field(description="章节UUID")
    project_id: int = Field(description="所属项目ID")
    title: str = Field(description="章节标题")
    content: str = Field(description="章节正文内容")
    outline_node_id: Optional[int] = Field(None, description="关联的大纲节点ID")
    outline_title: Optional[str] = Field(None, description="关联节点的标题")
    word_count: int = Field(description="正文字数")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最后修改时间")
    
    class Config:
        from_attributes = True


class ChapterCreateRequest(BaseModel):
    """创建章节请求"""
    title: str = Field(min_length=1, max_length=200, description="章节标题")
    project_id: int = Field(description="所属项目ID")
    outline_node_id: Optional[int] = Field(None, description="关联的大纲节点ID（可选）")


class ChapterCreateFromOutlineRequest(BaseModel):
    """从大纲节点创建章节请求"""
    outline_node_id: int = Field(description="大纲节点ID")


class ChapterUpdateRequest(BaseModel):
    """更新章节请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="章节标题")
    content: Optional[str] = Field(None, description="章节内容")
    outline_node_id: Optional[int] = Field(None, description="关联的大纲节点ID")


class ChapterDeleteResponse(BaseModel):
    """删除章节响应"""
    success: bool = Field(description="是否成功")
    message: str = Field(description="提示消息")


class AIGenerateRequest(BaseModel):
    """AI生成章节内容请求"""
    prompt: str = Field(description="用户提示词")
    use_outline_context: bool = Field(default=False, description="是否使用大纲上下文")


class OutlineNodeOption(BaseModel):
    """可关联的大纲节点选项"""
    id: int = Field(description="节点ID")
    title: str = Field(description="节点标题")
    path: str = Field(description="完整路径，如'第一卷 > 第一章'")
    has_chapter: bool = Field(description="是否已被其他章节关联")


class ChapterStatusResponse(BaseModel):
    """章节状态响应（用于大纲页面）"""
    has_chapter: bool = Field(description="是否已创建章节")
    chapter_id: Optional[str] = Field(None, description="章节ID")
