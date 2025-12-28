"""
角色业务逻辑服务
处理角色和模板的CRUD操作及相关业务逻辑
"""

from typing import Optional

from src.backend.core.exceptions import BusinessError, ResourceNotFoundError
from src.features.character.backend.models import Character, CharacterTemplate
from src.features.novel_project.backend.models import NovelProject


class CharacterService:
    """角色服务类"""

    @staticmethod
    async def create_from_template(
        template_id: int, name: str, project_id: Optional[int] = None
    ) -> Character:
        """
        从模板创建角色副本

        Args:
            template_id: 模板ID
            name: 角色名称
            project_id: 所属项目ID(可选)

        Returns:
            创建的角色对象

        Raises:
            ResourceNotFoundError: 模板不存在
            ResourceNotFoundError: 项目不存在
        """
        # 验证模板是否存在
        template = await CharacterTemplate.get_or_none(id=template_id)
        if not template:
            raise ResourceNotFoundError("模板", f"模板ID {template_id} 不存在")

        # 如果指定了项目,验证项目是否存在
        if project_id is not None:
            project = await NovelProject.get_or_none(id=project_id)
            if not project:
                raise ResourceNotFoundError("项目", f"项目ID {project_id} 不存在")

        # 创建角色副本,复制模板的所有JSON字段
        character = await Character.create(
            name=name,
            project_id=project_id,
            template_id=template_id,
            basic_info=template.basic_info.copy() if template.basic_info else {},
            background=template.background.copy() if template.background else {},
            personality=template.personality.copy() if template.personality else {},
            abilities=template.abilities.copy() if template.abilities else {},
        )

        return character

    @staticmethod
    async def get_project_characters(
        project_id: Optional[int] = None,
    ) -> list[Character]:
        """
        获取项目角色列表

        Args:
            project_id: 项目ID(None表示获取全局角色)

        Returns:
            角色列表
        """
        if project_id is None:
            # 获取全局角色(project_id为NULL)
            characters = await Character.filter(project_id__isnull=True).all()
        else:
            # 获取指定项目的角色
            characters = await Character.filter(project_id=project_id).all()

        return characters

    @staticmethod
    async def get_all_characters() -> list[Character]:
        """
        获取系统中所有角色

        Returns:
            所有角色列表
        """
        characters = await Character.all().order_by("-created_at")
        return characters

    @staticmethod
    async def check_template_usage(template_id: int) -> int:
        """
        检查模板使用情况

        Args:
            template_id: 模板ID

        Returns:
            使用该模板的角色数量
        """
        count = await Character.filter(template_id=template_id).count()
        return count

    @staticmethod
    async def delete_template(template_id: int) -> None:
        """
        删除模板

        Args:
            template_id: 模板ID

        Raises:
            ResourceNotFoundError: 模板不存在
            BusinessError: 模板被使用中,不能删除
        """
        # 验证模板是否存在
        template = await CharacterTemplate.get_or_none(id=template_id)
        if not template:
            raise ResourceNotFoundError("模板", f"模板ID {template_id} 不存在")

        # 检查是否有角色使用该模板
        usage_count = await CharacterService.check_template_usage(template_id)
        if usage_count > 0:
            raise BusinessError(
                code="TEMPLATE_IN_USE",
                message=f"该模板已被 {usage_count} 个角色使用,不能删除",
                details={"usage_count": usage_count},
            )

        # 删除模板
        await template.delete()

    @staticmethod
    async def get_character_with_relations(character_id: int) -> Optional[Character]:
        """
        获取角色详情(包含关系信息)

        Args:
            character_id: 角色ID

        Returns:
            角色对象(预加载关系)

        Raises:
            ResourceNotFoundError: 角色不存在
        """
        character = (
            await Character.filter(id=character_id)
            .prefetch_related("relations_as_source", "relations_as_target")
            .first()
        )

        if not character:
            raise ResourceNotFoundError("角色", f"角色ID {character_id} 不存在")

        return character

    @staticmethod
    async def delete_character(character_id: int) -> None:
        """
        删除角色(级联删除所有关系)

        Args:
            character_id: 角色ID

        Raises:
            ResourceNotFoundError: 角色不存在
        """
        character = await Character.get_or_none(id=character_id)
        if not character:
            raise ResourceNotFoundError("角色", f"角色ID {character_id} 不存在")

        # 删除角色(关系会自动级联删除)
        await character.delete()
