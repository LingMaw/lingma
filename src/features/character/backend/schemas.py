"""
人物设定系统Pydantic验证模型
定义API请求和响应的数据结构
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ===== 角色模板相关 Schemas =====


class CharacterTemplateBase(BaseModel):
    """角色模板基础模型"""

    name: str = Field(..., min_length=1, max_length=200, description="模板名称")
    description: Optional[str] = Field(None, description="模板描述")
    category: Optional[str] = Field(None, max_length=50, description="模板分类")
    basic_info: dict[str, Any] = Field(default_factory=dict, description="基本信息")
    background: dict[str, Any] = Field(default_factory=dict, description="背景故事")
    personality: dict[str, Any] = Field(default_factory=dict, description="性格特征")
    abilities: dict[str, Any] = Field(default_factory=dict, description="能力技能")


class CharacterTemplateCreate(CharacterTemplateBase):
    """创建角色模板请求模型"""

    pass


class CharacterTemplateUpdate(BaseModel):
    """更新角色模板请求模型(所有字段可选)"""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    basic_info: Optional[dict[str, Any]] = None
    background: Optional[dict[str, Any]] = None
    personality: Optional[dict[str, Any]] = None
    abilities: Optional[dict[str, Any]] = None


class CharacterTemplateResponse(CharacterTemplateBase):
    """角色模板响应模型"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== 角色相关 Schemas =====


class CharacterBase(BaseModel):
    """角色基础模型"""

    name: str = Field(..., min_length=1, max_length=200, description="角色名称")
    basic_info: dict[str, Any] = Field(default_factory=dict, description="基本信息")
    background: dict[str, Any] = Field(default_factory=dict, description="背景故事")
    personality: dict[str, Any] = Field(default_factory=dict, description="性格特征")
    abilities: dict[str, Any] = Field(default_factory=dict, description="能力技能")
    notes: Optional[str] = Field(None, description="其他备注")


class CharacterCreate(CharacterBase):
    """创建角色请求模型"""

    project_id: Optional[int] = Field(None, description="所属项目ID(NULL表示全局角色)")
    template_id: Optional[int] = Field(None, description="来源模板ID")


class CharacterUpdate(BaseModel):
    """更新角色请求模型(所有字段可选)"""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    basic_info: Optional[dict[str, Any]] = None
    background: Optional[dict[str, Any]] = None
    personality: Optional[dict[str, Any]] = None
    abilities: Optional[dict[str, Any]] = None
    notes: Optional[str] = None


class CharacterResponse(CharacterBase):
    """角色响应模型"""

    id: int
    project_id: Optional[int]
    template_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== 角色关系相关 Schemas =====


class CharacterRelationBase(BaseModel):
    """角色关系基础模型"""

    relation_type: str = Field(..., min_length=1, max_length=50, description="关系类型")
    strength: int = Field(5, ge=1, le=10, description="关系强度(1-10)")
    description: Optional[str] = Field(None, description="关系描述")
    timeline: Optional[str] = Field(None, description="关系时间线")
    is_bidirectional: bool = Field(False, description="是否双向关系")

    @field_validator("strength")
    @classmethod
    def validate_strength(cls, v: int) -> int:
        """验证关系强度在1-10之间"""
        if not 1 <= v <= 10:
            raise ValueError("关系强度必须在1-10之间")
        return v


class CharacterRelationCreate(CharacterRelationBase):
    """创建角色关系请求模型"""

    target_character_id: int = Field(..., description="目标角色ID")


class CharacterRelationUpdate(BaseModel):
    """更新角色关系请求模型(所有字段可选)"""

    relation_type: Optional[str] = Field(None, min_length=1, max_length=50)
    strength: Optional[int] = Field(None, ge=1, le=10)
    description: Optional[str] = None
    timeline: Optional[str] = None
    is_bidirectional: Optional[bool] = None

    @field_validator("strength")
    @classmethod
    def validate_strength(cls, v: Optional[int]) -> Optional[int]:
        """验证关系强度在1-10之间"""
        if v is not None and not 1 <= v <= 10:
            raise ValueError("关系强度必须在1-10之间")
        return v


class CharacterRelationResponse(CharacterRelationBase):
    """角色关系响应模型"""

    id: int
    source_character_id: int
    target_character_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CharacterRelationWithCharacters(CharacterRelationResponse):
    """包含角色信息的关系响应模型"""

    source_character: CharacterResponse
    target_character: CharacterResponse


# ===== 关系图相关 Schemas =====


class RelationGraphNode(BaseModel):
    """关系图节点模型"""

    id: int = Field(..., description="角色ID")
    name: str = Field(..., description="角色名称")
    category: Optional[str] = Field(None, description="角色分类")


class RelationGraphLink(BaseModel):
    """关系图边模型"""

    source: int = Field(..., description="源角色ID")
    target: int = Field(..., description="目标角色ID")
    relation_type: str = Field(..., description="关系类型")
    strength: int = Field(..., description="关系强度")
    description: Optional[str] = Field(None, description="关系描述")


class RelationGraphData(BaseModel):
    """关系图数据模型"""

    nodes: list[RelationGraphNode] = Field(..., description="节点列表")
    links: list[RelationGraphLink] = Field(..., description="边列表")
