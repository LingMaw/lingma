"""
人物设定系统API路由
定义角色模板、角色、关系的RESTful API
"""

from typing import Optional

from fastapi import APIRouter, Query

from src.backend.core.exceptions import raise_resource_not_found
from src.backend.core.response import MessageResponse, message_response
from src.features.character.backend.models import (
    Character,
    CharacterRelation,
    CharacterTemplate,
)
from src.features.character.backend.schemas import (
    CharacterCreate,
    CharacterRelationCreate,
    CharacterRelationResponse,
    CharacterRelationUpdate,
    CharacterResponse,
    CharacterTemplateCreate,
    CharacterTemplateResponse,
    CharacterTemplateUpdate,
    CharacterUpdate,
    RelationGraphData,
)
from src.features.character.backend.services import CharacterService, RelationService

router = APIRouter(prefix="/characters", tags=["人物设定"])


# ===== 角色模板路由 =====


@router.get("/templates", response_model=list[CharacterTemplateResponse])
async def list_templates(category: Optional[str] = Query(None, description="按分类筛选")):
    """获取所有角色模板"""
    if category:
        templates = await CharacterTemplate.filter(category=category).all()
    else:
        templates = await CharacterTemplate.all()
    return templates


@router.post("/templates", response_model=CharacterTemplateResponse)
async def create_template(data: CharacterTemplateCreate):
    """创建角色模板"""
    return await CharacterTemplate.create(**data.model_dump())


@router.get("/templates/{template_id}", response_model=CharacterTemplateResponse)
async def get_template(template_id: int):
    """获取模板详情"""
    template = await CharacterTemplate.get_or_none(id=template_id)
    if not template:
        raise_resource_not_found("模板", f"模板ID {template_id} 不存在")
    return template


@router.put("/templates/{template_id}", response_model=CharacterTemplateResponse)
async def update_template(template_id: int, data: CharacterTemplateUpdate):
    """更新模板"""
    template = await CharacterTemplate.get_or_none(id=template_id)
    if not template:
        raise_resource_not_found("模板", f"模板ID {template_id} 不存在")

    # 更新非空字段
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    await template.save()
    return template


@router.delete("/templates/{template_id}", response_model=MessageResponse)
async def delete_template(template_id: int):
    """删除模板"""
    await CharacterService.delete_template(template_id)
    return message_response("模板删除成功")


# ===== 角色路由 =====


@router.get("", response_model=list[CharacterResponse])
async def list_characters(
    project_id: Optional[int] = Query(None, description="项目ID(不传则获取全局角色)"),
    include_all: bool = Query(False, description="是否获取所有角色(忽略project_id)"),
):
    """获取角色列表"""
    if include_all:
        characters = await CharacterService.get_all_characters()
    else:
        characters = await CharacterService.get_project_characters(project_id)
    return characters


@router.get("/all/with-relations", response_model=RelationGraphData)
async def get_all_characters_with_relations(
    project_id: Optional[int] = Query(None, description="项目ID(不传则获取所有)"),
):
    """获取所有角色及其关系网络数据"""
    if project_id:
        return await RelationService.get_project_characters_graph(project_id)
    return await RelationService.get_all_characters_graph()


@router.post("", response_model=CharacterResponse)
async def create_character(data: CharacterCreate):
    """创建角色(支持从模板创建)"""
    if data.template_id:
        # 从模板创建
        character = await CharacterService.create_from_template(
            template_id=data.template_id,
            name=data.name,
            project_id=data.project_id,
        )
    else:
        # 创建空白角色
        character = await Character.create(**data.model_dump(exclude={"template_id"}))

    return character


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(character_id: int):
    """获取角色详情"""
    return await CharacterService.get_character_with_relations(character_id)


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(character_id: int, data: CharacterUpdate):
    """更新角色"""
    character = await Character.get_or_none(id=character_id)
    if not character:
        raise_resource_not_found("角色", f"角色ID {character_id} 不存在")

    # 更新非空字段
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(character, key, value)

    await character.save()
    return character


@router.delete("/{character_id}", response_model=MessageResponse)
async def delete_character(character_id: int):
    """删除角色(级联删除所有关系)"""
    await CharacterService.delete_character(character_id)
    return message_response("角色删除成功")


# ===== 关系路由 =====


@router.get("/{character_id}/relations", response_model=list[CharacterRelationResponse])
async def get_character_relations(character_id: int):
    """获取角色的所有关系"""
    # 验证角色存在
    character = await Character.get_or_none(id=character_id)
    if not character:
        raise_resource_not_found("角色", f"角色ID {character_id} 不存在")

    # 获取作为源和目标的所有关系
    relations_as_source = await CharacterRelation.filter(
        source_character_id=character_id,
    ).all()
    relations_as_target = await CharacterRelation.filter(
        target_character_id=character_id,
    ).all()

    return relations_as_source + relations_as_target


@router.post("/{character_id}/relations", response_model=CharacterRelationResponse)
async def create_relation(character_id: int, data: CharacterRelationCreate):
    """创建角色关系"""
    return await RelationService.create_relation(
        source_id=character_id,
        target_id=data.target_character_id,
        relation_type=data.relation_type,
        strength=data.strength,
        description=data.description,
        timeline=data.timeline,
        is_bidirectional=data.is_bidirectional,
    )


@router.put("/relations/{relation_id}", response_model=CharacterRelationResponse)
async def update_relation(relation_id: int, data: CharacterRelationUpdate):
    """更新关系"""
    update_data = data.model_dump(exclude_unset=True)
    return await RelationService.update_bidirectional_relation(
        relation_id=relation_id, **update_data,
    )


@router.delete("/relations/{relation_id}", response_model=MessageResponse)
async def delete_relation(relation_id: int):
    """删除关系(如果是双向关系,同时删除反向关系)"""
    await RelationService.delete_relation_cascade(relation_id)
    return message_response("关系删除成功")


@router.get("/{character_id}/relation-graph", response_model=RelationGraphData)
async def get_relation_graph(
    character_id: int, depth: int = Query(2, ge=1, le=3, description="关系深度(1-3)"),
):
    """获取关系图数据"""
    return await RelationService.get_relation_graph(character_id, depth)
