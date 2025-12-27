"""小说项目数据结构定义
定义请求和响应的数据模型
"""

from datetime import datetime
from typing import List, Literal, Optional

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
    outline_description: Optional[str] = Field(None, description="大纲结构化描述")
    outline_node_id: Optional[int] = Field(None, description="关联的大纲节点ID")


class ChapterCreate(ChapterBase):
    """创建章节请求模型"""
    pass


class ChapterUpdate(ChapterBase):
    """更新章节请求模型"""
    title: Optional[str] = Field(None, max_length=200, description="章节标题")
    content: Optional[str] = Field(None, description="正文内容")
    outline_node_id: Optional[int] = Field(None, description="关联的大纲节点ID")


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


# ==================== 大纲章节查询相关 Schema ====================

class OutlineChapterInfo(BaseModel):
    """大纲章节节点信息"""
    id: int = Field(..., description="大纲节点ID")
    title: str = Field(..., description="章节标题")
    description: Optional[str] = Field(None, description="章节描述")
    is_bound: bool = Field(..., description="是否已被章节绑定")
    bound_chapter_id: Optional[str] = Field(None, description="已绑定的章节UUID")
    bound_chapter_number: Optional[int] = Field(None, description="已绑定的章节序号")


class OutlineChapterListResponse(BaseModel):
    """大纲章节列表响应模型"""
    total: int = Field(..., description="总数")
    items: List[OutlineChapterInfo] = Field(..., description="章节节点列表")


# ==================== AI生成相关 Schema ====================

class ChapterGenerateRequest(BaseModel):
    """章节AI生成请求模型"""
    outline_node_id: Optional[int] = Field(None, description="大纲节点ID(可选,不传则使用章节已绑定的节点)")
    genre: Optional[str] = Field(None, description="小说类型")
    style: Optional[str] = Field(None, description="写作风格")
    requirement: Optional[str] = Field(None, description="额外要求")
    use_sections: bool = Field(True, description="是否使用小节提示")


class GenerateChunkResponse(BaseModel):
    """AI生成流式响应块"""
    type: Literal["chunk", "done", "error"] = Field(..., description="响应类型")
    content: Optional[str] = Field(None, description="生成的文本内容")
    total_tokens: Optional[int] = Field(None, description="总token数")
    error_message: Optional[str] = Field(None, description="错误消息")


# ==================== 新查询服务相关 Schema ====================

class OutlineNodeResponse(BaseModel):
    """大纲节点响应模型（简化版）"""
    id: int
    title: str
    description: Optional[str] = None
    node_type: str
    status: str
    position: int
    
    class Config:
        from_attributes = True


class ChapterWithMetadata(BaseModel):
    """章节完整信息（包含运行时计算的元数据）"""
    chapter_id: str
    chapter_number: int  # 运行时计算
    title: str  # 从 OutlineNode 读取
    content: str
    outline_node: OutlineNodeResponse  # 嵌套大纲信息
    created_at: datetime
    updated_at: datetime


class ChapterListItem(BaseModel):
    """章节列表项（简化版）"""
    chapter_id: str
    chapter_number: int
    title: str
    content_preview: str  # 前100字
    outline_node_id: int
    status: str  # 从 OutlineNode 读取


class ChapterListItemResponse(BaseModel):
    """章节列表响应模型（新版）"""
    total: int
    items: List[ChapterListItem]