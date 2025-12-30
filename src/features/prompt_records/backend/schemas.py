"""提示词记录相关的Pydantic模型"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PromptRecordResponse(BaseModel):
    """提示词记录响应模型"""

    id: int = Field(description="记录ID")
    user_id: int = Field(description="用户ID")
    project_id: Optional[int] = Field(None, description="项目ID")
    
    # 提示词内容
    system_prompt: str = Field(description="系统提示词")
    user_prompt: str = Field(description="用户提示词")
    
    # 请求元数据
    model: Optional[str] = Field(None, description="AI模型")
    endpoint: str = Field(description="API端点")
    temperature: Optional[float] = Field(None, description="温度参数")
    
    # 时间戳
    created_at: datetime = Field(description="创建时间")

    class Config:
        from_attributes = True


class PromptRecordListResponse(BaseModel):
    """提示词记录分页列表响应"""

    total: int = Field(description="总记录数")
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页大小")
    records: list[PromptRecordResponse] = Field(description="记录列表")
