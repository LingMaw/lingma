"""
大纲解析器 API Schemas

定义请求和响应的数据验证模型
"""

from pydantic import BaseModel, Field
from typing import List, Literal


class ParseRequest(BaseModel):
    """解析大纲请求"""

    text: str = Field(..., description="大纲文本内容", max_length=1_000_000)
    format: Literal["auto", "markdown", "numbered", "indent"] = Field(
        default="auto", description="大纲格式类型，auto 表示自动检测"
    )


class ChapterPreview(BaseModel):
    """章节预览数据"""

    title: str = Field(..., description="章节标题")
    outline_description: str = Field(..., description="大纲结构化描述")
    preview: str = Field(..., description="预览提示信息")


class ParseResponse(BaseModel):
    """解析大纲响应"""

    chapters: List[ChapterPreview] = Field(..., description="解析后的章节列表")
    total_count: int = Field(..., description="章节总数")
    detected_format: str = Field(..., description="检测到的格式类型")


class ChapterCreateData(BaseModel):
    """章节创建数据"""

    title: str = Field(..., description="章节标题", max_length=200)
    outline_description: str = Field(..., description="大纲结构化描述")


class CreateChaptersRequest(BaseModel):
    """批量创建章节请求"""

    project_id: int = Field(..., description="项目 ID", gt=0)
    chapters: List[ChapterCreateData] = Field(
        ..., description="章节数据列表", max_length=1000
    )


class CreateChaptersResponse(BaseModel):
    """批量创建章节响应"""

    created_count: int = Field(..., description="成功创建的章节数量")
    chapter_ids: List[str] = Field(..., description="创建的章节 ID 列表")
    message: str = Field(..., description="操作结果信息")
