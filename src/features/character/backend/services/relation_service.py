"""
角色关系业务逻辑服务
处理角色关系的创建、查询、删除及关系图数据生成
"""

from typing import Optional

from src.backend.core.exceptions import BusinessError, ResourceNotFoundError
from src.features.character.backend.models import Character, CharacterRelation
from src.features.character.backend.schemas import RelationGraphData, RelationGraphLink, RelationGraphNode


class RelationService:
    """角色关系服务类"""

    @staticmethod
    async def create_relation(
        source_id: int,
        target_id: int,
        relation_type: str,
        strength: int = 5,
        description: Optional[str] = None,
        timeline: Optional[str] = None,
        is_bidirectional: bool = False,
    ) -> CharacterRelation:
        """
        创建角色关系

        Args:
            source_id: 源角色ID
            target_id: 目标角色ID
            relation_type: 关系类型
            strength: 关系强度(1-10)
            description: 关系描述
            timeline: 关系时间线
            is_bidirectional: 是否双向关系

        Returns:
            创建的关系对象

        Raises:
            BusinessError: 无效的关系(自我关系或角色不存在)
            BusinessError: 关系已存在
        """
        # 验证不能与自己建立关系
        if source_id == target_id:
            raise BusinessError(
                code="INVALID_RELATION",
                message="不能与自己建立关系",
            )

        # 验证两个角色都存在
        source_character = await Character.get_or_none(id=source_id)
        if not source_character:
            raise ResourceNotFoundError("角色", f"源角色ID {source_id} 不存在")

        target_character = await Character.get_or_none(id=target_id)
        if not target_character:
            raise ResourceNotFoundError("角色", f"目标角色ID {target_id} 不存在")

        # 检查关系是否已存在
        existing_relation = await CharacterRelation.get_or_none(
            source_character_id=source_id, target_character_id=target_id
        )
        if existing_relation:
            raise BusinessError(
                code="DUPLICATE_RELATION",
                message="该关系已存在",
            )

        # 创建关系记录
        relation = await CharacterRelation.create(
            source_character_id=source_id,
            target_character_id=target_id,
            relation_type=relation_type,
            strength=strength,
            description=description,
            timeline=timeline,
            is_bidirectional=is_bidirectional,
        )

        # 如果是双向关系,创建反向关系
        if is_bidirectional:
            await CharacterRelation.create(
                source_character_id=target_id,
                target_character_id=source_id,
                relation_type=relation_type,
                strength=strength,
                description=description,
                timeline=timeline,
                is_bidirectional=True,
            )

        return relation

    @staticmethod
    async def delete_relation_cascade(relation_id: int) -> None:
        """
        删除关系(如果是双向关系,同时删除反向关系)

        Args:
            relation_id: 关系ID

        Raises:
            ResourceNotFoundError: 关系不存在
        """
        relation = await CharacterRelation.get_or_none(id=relation_id)
        if not relation:
            raise ResourceNotFoundError("关系", f"关系ID {relation_id} 不存在")

        # 如果是双向关系,查找并删除反向关系
        if relation.is_bidirectional:
            reverse_relation = await CharacterRelation.get_or_none(
                source_character_id=relation.target_character_id,
                target_character_id=relation.source_character_id,
            )
            if reverse_relation:
                await reverse_relation.delete()

        # 删除原关系
        await relation.delete()

    @staticmethod
    async def update_bidirectional_relation(
        relation_id: int,
        relation_type: Optional[str] = None,
        strength: Optional[int] = None,
        description: Optional[str] = None,
        timeline: Optional[str] = None,
        is_bidirectional: Optional[bool] = None,
    ) -> CharacterRelation:
        """
        更新关系(如果是双向关系,同步更新反向关系)

        Args:
            relation_id: 关系ID
            relation_type: 关系类型
            strength: 关系强度
            description: 关系描述
            timeline: 关系时间线
            is_bidirectional: 是否双向关系

        Returns:
            更新后的关系对象

        Raises:
            ResourceNotFoundError: 关系不存在
        """
        relation = await CharacterRelation.get_or_none(id=relation_id)
        if not relation:
            raise ResourceNotFoundError("关系", f"关系ID {relation_id} 不存在")

        # 保存原双向状态
        old_is_bidirectional = relation.is_bidirectional

        # 更新字段
        if relation_type is not None:
            relation.relation_type = relation_type
        if strength is not None:
            relation.strength = strength
        if description is not None:
            relation.description = description
        if timeline is not None:
            relation.timeline = timeline
        if is_bidirectional is not None:
            relation.is_bidirectional = is_bidirectional

        await relation.save()

        # 处理双向关系同步
        if old_is_bidirectional:
            # 原本是双向关系
            reverse_relation = await CharacterRelation.get_or_none(
                source_character_id=relation.target_character_id,
                target_character_id=relation.source_character_id,
            )

            if reverse_relation:
                if is_bidirectional is False:
                    # 从双向改为单向,删除反向关系
                    await reverse_relation.delete()
                else:
                    # 仍然是双向,同步更新反向关系
                    if relation_type is not None:
                        reverse_relation.relation_type = relation_type
                    if strength is not None:
                        reverse_relation.strength = strength
                    if description is not None:
                        reverse_relation.description = description
                    if timeline is not None:
                        reverse_relation.timeline = timeline
                    await reverse_relation.save()
        elif relation.is_bidirectional:
            # 从单向改为双向,创建反向关系
            await CharacterRelation.create(
                source_character_id=relation.target_character_id,
                target_character_id=relation.source_character_id,
                relation_type=relation.relation_type,
                strength=relation.strength,
                description=relation.description,
                timeline=relation.timeline,
                is_bidirectional=True,
            )

        return relation

    @staticmethod
    async def get_relation_graph(
        character_id: int, depth: int = 2
    ) -> RelationGraphData:
        """
        获取关系图数据(广度优先遍历)

        Args:
            character_id: 中心角色ID
            depth: 关系深度(1-3)

        Returns:
            关系图数据(节点+边)

        Raises:
            ResourceNotFoundError: 角色不存在
        """
        # 验证角色存在
        character = await Character.get_or_none(id=character_id)
        if not character:
            raise ResourceNotFoundError("角色", f"角色ID {character_id} 不存在")

        # 限制深度在1-3之间
        depth = max(1, min(depth, 3))

        # 使用集合去重
        visited_character_ids = {character_id}
        visited_relation_ids = set()
        all_characters = {character_id: character}

        # 当前层级的角色ID
        current_level = {character_id}

        # 广度优先遍历
        for _ in range(depth):
            next_level = set()

            for char_id in current_level:
                # 获取该角色的所有关系(作为源或目标)
                relations_as_source = await CharacterRelation.filter(
                    source_character_id=char_id
                ).prefetch_related("target_character")
                relations_as_target = await CharacterRelation.filter(
                    target_character_id=char_id
                ).prefetch_related("source_character")

                # 处理作为源的关系
                for relation in relations_as_source:
                    if relation.id not in visited_relation_ids:
                        visited_relation_ids.add(relation.id)
                        target_id = relation.target_character_id

                        if target_id not in visited_character_ids:
                            visited_character_ids.add(target_id)
                            next_level.add(target_id)
                            all_characters[target_id] = await Character.get(
                                id=target_id
                            )

                # 处理作为目标的关系
                for relation in relations_as_target:
                    if relation.id not in visited_relation_ids:
                        visited_relation_ids.add(relation.id)
                        source_id = relation.source_character_id

                        if source_id not in visited_character_ids:
                            visited_character_ids.add(source_id)
                            next_level.add(source_id)
                            all_characters[source_id] = await Character.get(
                                id=source_id
                            )

            current_level = next_level
            if not current_level:
                break

        # 构建节点列表
        nodes = [
            RelationGraphNode(
                id=char_id,
                name=char.name,
                category=char.basic_info.get("category") if char.basic_info else None,
            )
            for char_id, char in all_characters.items()
        ]

        # 获取所有涉及的关系并构建边列表
        all_relations = await CharacterRelation.filter(
            id__in=list(visited_relation_ids)
        ).all()

        links = [
            RelationGraphLink(
                source=rel.source_character_id,
                target=rel.target_character_id,
                relation_type=rel.relation_type,
                strength=rel.strength,
                description=rel.description,
            )
            for rel in all_relations
        ]

        return RelationGraphData(nodes=nodes, links=links)

    @staticmethod
    async def get_all_characters_graph() -> RelationGraphData:
        """
        获取系统中所有角色及其关系的图数据

        Returns:
            关系图数据(节点+边)
        """
        # 获取所有角色
        all_characters = await Character.all()

        # 构建节点列表
        nodes = [
            RelationGraphNode(
                id=char.id,
                name=char.name,
                category=char.basic_info.get("category") if char.basic_info else None,
            )
            for char in all_characters
        ]

        # 获取所有关系
        all_relations = await CharacterRelation.all()

        # 构建边列表
        links = [
            RelationGraphLink(
                source=rel.source_character_id,
                target=rel.target_character_id,
                relation_type=rel.relation_type,
                strength=rel.strength,
                description=rel.description,
            )
            for rel in all_relations
        ]

        return RelationGraphData(nodes=nodes, links=links)
