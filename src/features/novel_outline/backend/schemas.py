"""大纲节点Pydantic Schema定义"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class OutlineNodeBase(BaseModel):
    """大纲节点基础模型"""
    
    title: str = Field(..., min_length=1, max_length=200, description="节点标题")
    description: Optional[str] = Field(None, description="节点描述/大纲内容")
    node_type: str = Field(..., description="节点类型: volume/chapter/section")
    status: str = Field("draft", description="节点状态: draft/editing/completed/locked")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="扩展元数据")
    
    @field_validator('node_type')
    @classmethod
    def validate_node_type(cls, v: str) -> str:
        """验证节点类型"""
        allowed_types = ['volume', 'chapter', 'section']
        if v not in allowed_types:
            raise ValueError(f"节点类型必须是 {allowed_types} 之一")
        return v
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        """验证节点状态"""
        allowed_statuses = ['draft', 'editing', 'completed', 'locked']
        if v not in allowed_statuses:
            raise ValueError(f"状态必须是 {allowed_statuses} 之一")
        return v


class OutlineNodeCreate(OutlineNodeBase):
    """创建大纲节点请求模型"""
    
    parent_id: Optional[int] = Field(None, description="父节点ID,null表示顶层节点")
    position: Optional[int] = Field(None, ge=0, description="位置序号,默认为同级最后")


class OutlineNodeUpdate(BaseModel):
    """更新大纲节点请求模型"""
    
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="节点标题")
    description: Optional[str] = Field(None, description="节点描述")
    status: Optional[str] = Field(None, description="节点状态")
    metadata: Optional[Dict[str, Any]] = Field(None, description="扩展元数据")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """验证节点状态"""
        if v is None:
            return v
        allowed_statuses = ['draft', 'editing', 'completed', 'locked']
        if v not in allowed_statuses:
            raise ValueError(f"状态必须是 {allowed_statuses} 之一")
        return v


class OutlineNodeResponse(OutlineNodeBase):
    """大纲节点响应模型"""
    
    id: int
    novel_id: int
    parent_id: Optional[int]
    position: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class OutlineNodeWithChildren(OutlineNodeResponse):
    """带子节点的大纲节点响应模型(用于树形结构)"""
    
    children: List['OutlineNodeWithChildren'] = Field(default_factory=list, description="子节点列表")


# 解决自引用问题
OutlineNodeWithChildren.model_rebuild()


class OutlineTreeResponse(BaseModel):
    """大纲树响应模型"""
    
    novel_id: int
    root_nodes: List[OutlineNodeWithChildren] = Field(default_factory=list, description="根节点列表")
    total_nodes: int = Field(..., description="节点总数")


class PositionUpdate(BaseModel):
    """位置更新请求模型"""
    
    parent_id: Optional[int] = Field(None, description="新父节点ID,null表示移到顶层")
    position: int = Field(..., ge=0, description="新位置索引")


class ReorderRequest(BaseModel):
    """批量排序请求模型"""
    
    parent_id: Optional[int] = Field(None, description="父节点ID,null表示顶层节点")
    node_ids: List[int] = Field(..., min_length=1, description="按新顺序排列的节点ID列表")


class DeleteResponse(BaseModel):
    """删除响应模型"""
    
    message: str = Field(..., description="删除结果消息")
    deleted_count: int = Field(..., description="实际删除的节点数量")


class PositionUpdateResponse(BaseModel):
    """位置更新响应模型"""
    
    node: OutlineNodeResponse
    affected_siblings: List[Dict[str, int]] = Field(
        default_factory=list,
        description="受影响的兄弟节点信息(id和position)"
    )


class ReorderResponse(BaseModel):
    """批量排序响应模型"""
    
    message: str = Field(..., description="排序结果消息")
    updated_nodes: List[Dict[str, int]] = Field(
        default_factory=list,
        description="更新后的节点信息(id和position)"
    )
