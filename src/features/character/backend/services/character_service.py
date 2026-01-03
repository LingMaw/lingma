"""
角色业务逻辑服务
处理角色和模板的CRUD操作及相关业务逻辑
"""

import json
from typing import Any, Optional

from src.backend.ai import ai_service
from src.backend.core.exceptions import BusinessError, ResourceNotFoundError
from src.backend.core.logger import logger
from src.backend.core.template import TemplateManager
from src.features.character.backend.models import Character, CharacterTemplate
from src.features.novel_project.backend.models import NovelProject


class CharacterService:
    """角色服务类"""

    @staticmethod
    async def generate_by_ai(
        user_id: int,
        character_type: Optional[str] = None,
        gender: Optional[str] = None,
        age_range: Optional[str] = None,
        personality_traits: Optional[str] = None,
        background_hint: Optional[str] = None,
        abilities_hint: Optional[str] = None,
        additional_requirements: Optional[str] = None,
        project_id: Optional[int] = None,
    ) -> Character:
        """
        使用AI生成角色

        Args:
            user_id: 用户ID
            character_type: 角色类型
            gender: 性别
            age_range: 年龄范围
            personality_traits: 性格特点
            background_hint: 背景提示
            abilities_hint: 能力提示
            additional_requirements: 其他要求
            project_id: 所属项目ID

        Returns:
            创建的角色对象

        Raises:
            BusinessError: AI生成失败或解析失败
            ResourceNotFoundError: 项目不存在
        """
        # 验证项目是否存在
        if project_id is not None:
            project = await NovelProject.get_or_none(id=project_id)
            if not project:
                raise ResourceNotFoundError("项目", f"项目ID {project_id} 不存在")

        # 构建提示词
        template_manager = TemplateManager()
        try:
            user_prompt = template_manager.render(
                "character_generate.jinja2",
                character_type=character_type,
                gender=gender,
                age_range=age_range,
                personality_traits=personality_traits,
                background_hint=background_hint,
                abilities_hint=abilities_hint,
                additional_requirements=additional_requirements,
            )
        except Exception as e:
            logger.error(f"渲染角色生成模板失败: {e}")
            raise BusinessError(
                code="TEMPLATE_RENDER_ERROR",
                message="生成提示词失败",
                details={"error": str(e)},
            ) from e

        # 调用AI生成
        system_prompt = "你是一位专业的小说角色设计师，擅长创建生动、立体、富有个性的虚拟人物。你必须严格按照JSON格式返回数据。"
        
        generated_content = ""
        try:
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.8,
                project_id=project_id,
                endpoint="/characters/generate",
            ):
                # 过滤思维链内容
                if "[REASONING]" not in chunk and "[/REASONING]" not in chunk:
                    generated_content += chunk
        except Exception as e:
            logger.error(f"AI生成角色失败: {e}")
            raise BusinessError(
                code="AI_GENERATION_ERROR",
                message="AI生成失败",
                details={"error": str(e)},
            ) from e

        # 解析JSON
        try:
            # 清理可能的markdown代码块标记
            cleaned_content = generated_content.strip()
            if cleaned_content.startswith("```json"):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.startswith("```"):
                cleaned_content = cleaned_content[3:]
            if cleaned_content.endswith("```"):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            character_data = json.loads(cleaned_content)
        except json.JSONDecodeError as e:
            logger.error(f"解析AI生成的JSON失败: {e}\n内容: {generated_content}")
            raise BusinessError(
                code="JSON_PARSE_ERROR",
                message="解析AI生成内容失败",
                details={"error": str(e), "content": generated_content[:500]},
            ) from e

        # 创建角色
        try:
            character = await Character.create(
                name=character_data.get("name", "未命名角色"),
                project_id=project_id,
                basic_info=character_data.get("basic_info", {}),
                background=character_data.get("background", {}),
                personality=character_data.get("personality", {}),
                abilities=character_data.get("abilities", {}),
                notes=character_data.get("notes", ""),
            )
            logger.info(f"AI生成角色成功: {character.name} (ID: {character.id})")
        except Exception as e:
            logger.error(f"创建角色失败: {e}")
            raise BusinessError(
                code="CHARACTER_CREATE_ERROR",
                message="创建角色失败",
                details={"error": str(e)},
            ) from e
        return character

    @staticmethod
    async def create_from_template(
        template_id: int, name: str, project_id: Optional[int] = None,
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
        return await Character.create(
            name=name,
            project_id=project_id,
            template_id=template_id,
            basic_info=template.basic_info.copy() if template.basic_info else {},
            background=template.background.copy() if template.background else {},
            personality=template.personality.copy() if template.personality else {},
            abilities=template.abilities.copy() if template.abilities else {},
        )


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
        return await Character.all().order_by("-created_at")

    @staticmethod
    async def check_template_usage(template_id: int) -> int:
        """
        检查模板使用情况

        Args:
            template_id: 模板ID

        Returns:
            使用该模板的角色数量
        """
        return await Character.filter(template_id=template_id).count()

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
