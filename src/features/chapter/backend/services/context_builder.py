"""
章节上下文构建器
收集生成提示词所需的所有上下文信息
"""

from typing import Any

from loguru import logger

from src.features.chapter.backend.models import Chapter
from src.features.character.backend.models import Character, CharacterRelation
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_project.backend.models import NovelProject


class ContextBuilder:
    """上下文构建器 - 收集生成提示词所需的所有信息"""

    @staticmethod
    async def build_generation_context(chapter: Chapter) -> dict[str, Any]:
        """
        构建生成章节的上下文

        返回结构：
        {
            # 章节基本信息
            "chapter_title": str,
            "chapter_number": int,
            "chapter_description": str | None,

            # 大纲信息
            "volume_title": str | None,
            "volume_description": str | None,
            "section_hints": list[dict],  # [{title, description}, ...]

            # 故事进度
            "story_progress": {
                "current": int,
                "total": int,
                "percentage": float
            },

            # 上下文章节
            "previous_chapter": {
                "title": str,
                "summary": str  # 前 200 字或摘要
            } | None,
            "next_chapter": {
                "title": str
            } | None,

            # 角色信息（结构化）
            "characters": list[dict],  # 增强后的角色信息

            # 项目信息
            "project_genre": str,
            "project_style": str,

            # 大纲元数据
            "outline_meta": dict | None  # 包含世界观、核心矛盾、主题升华、角色弧光等
        }
        """
        context = {}

        # 获取项目信息
        await chapter.fetch_related("project")
        project = chapter.project
        context["project_genre"] = project.genre if project and project.genre else ""
        context["project_style"] = project.style if project and project.style else ""

        # 章节基本信息
        context["chapter_number"] = chapter.chapter_number

        # 获取大纲信息
        chapter_outline = None
        volume_outline = None
        if chapter.outline_node_id:
            chapter_outline = await OutlineNode.get_or_none(id=chapter.outline_node_id)
            if chapter_outline and chapter_outline.parent_id:
                volume_outline = await OutlineNode.get_or_none(
                    id=chapter_outline.parent_id,
                )

        context["volume_title"] = volume_outline.title if volume_outline else None
        context["volume_description"] = (
            volume_outline.description if volume_outline else None
        )
        context["chapter_title"] = (
            chapter_outline.title if chapter_outline else chapter.title
        )
        context["chapter_description"] = (
            chapter_outline.description if chapter_outline else None
        )

        # 获取 section 提纲
        section_hints = []
        if chapter.outline_node_id:
            sections = (
                await OutlineNode.filter(
                    parent_id=chapter.outline_node_id,
                    node_type="section",
                )
                .order_by("position")
                .all()
            )
            section_hints = [
                {"title": s.title, "description": s.description} for s in sections
            ]
        context["section_hints"] = section_hints

        # 计算故事进度
        total_chapters = await Chapter.filter(project_id=chapter.project_id).count()
        context["story_progress"] = {
            "current": chapter.chapter_number,
            "total": total_chapters,
            "percentage": (
                round((chapter.chapter_number / total_chapters) * 100, 1)
                if total_chapters > 0
                else 0.0
            ),
        }

        # 获取前后章节
        context["previous_chapter"] = await ContextBuilder._get_previous_chapter(
            chapter,
        )
        context["next_chapter"] = await ContextBuilder._get_next_chapter(chapter)

        # 获取并结构化角色信息
        context["characters"] = await ContextBuilder._get_structured_characters(
            chapter.project_id,
        )

        # 获取大纲元数据
        context["outline_meta"] = await ContextBuilder._get_outline_meta(
            chapter.project_id,
        )

        return context

    @staticmethod
    async def build_continuation_context(
        chapter: Chapter,
        current_content: str,
    ) -> dict[str, Any]:
        """构建续写章节的上下文"""
        context = {}

        # 获取项目信息
        await chapter.fetch_related("project")
        project = chapter.project
        context["project_genre"] = project.genre if project and project.genre else ""
        context["project_style"] = project.style if project and project.style else ""

        # 章节基本信息
        context["chapter_title"] = chapter.title
        context["chapter_number"] = chapter.chapter_number

        # 当前已有内容（取最后1500字）
        if current_content:
            context["current_content"] = (
                current_content[-1500:]
                if len(current_content) > 1500
                else current_content
            )
            context["current_word_count"] = len(
                current_content.replace("\n", "").replace("\r", "").replace(" ", ""),
            )
        else:
            context["current_content"] = None
            context["current_word_count"] = 0

        # 获取 section 提纲用于推导情节方向
        section_hints = []
        if chapter.outline_node_id:
            sections = (
                await OutlineNode.filter(
                    parent_id=chapter.outline_node_id,
                    node_type="section",
                )
                .order_by("position")
                .all()
            )
            section_hints = [
                {"title": s.title, "description": s.description} for s in sections
            ]
        context["section_hints"] = section_hints

        # 获取并结构化角色信息
        context["characters"] = await ContextBuilder._get_structured_characters(
            chapter.project_id,
        )

        # 获取大纲元数据
        context["outline_meta"] = await ContextBuilder._get_outline_meta(
            chapter.project_id,
        )

        return context

    @staticmethod
    async def _get_outline_meta(project_id: int) -> dict[str, Any] | None:
        """
        获取项目的大纲元数据
        
        Returns:
            大纲元数据字典，如果不存在则返回None
        """
        try:
            project = await NovelProject.get_or_none(id=project_id)
            if not project or not project.metadata:
                return None
            
            outline_meta = project.metadata.get("outline_meta")
            if not outline_meta:
                return None
            
            logger.debug(f"成功获取项目 {project_id} 的大纲元数据")
            
        except Exception as e:
            logger.warning(f"获取大纲元数据失败: {e}")
            return None
        return outline_meta

    @staticmethod
    async def _get_previous_chapter(chapter: Chapter) -> dict[str, Any] | None:
        """获取前一章节信息"""
        prev_chapter = await Chapter.filter(
            project_id=chapter.project_id,
            chapter_number=chapter.chapter_number - 1,
        ).first()

        if not prev_chapter:
            return None

        # 获取章节摘要（优先使用前200字）
        summary = ""
        if prev_chapter.content:
            # 取最后200字作为结尾摘要
            summary = (
                prev_chapter.content[-200:]
                if len(prev_chapter.content) > 200
                else prev_chapter.content
            )

        return {
            "title": prev_chapter.title,
            "summary": summary,
        }

    @staticmethod
    async def _get_next_chapter(chapter: Chapter) -> dict[str, Any] | None:
        """获取下一章节信息"""
        next_chapter = await Chapter.filter(
            project_id=chapter.project_id,
            chapter_number=chapter.chapter_number + 1,
        ).first()

        if not next_chapter:
            return None

        return {
            "title": next_chapter.title,
        }

    @staticmethod
    async def _get_structured_characters(project_id: int) -> list[dict[str, Any]]:
        """
        获取并结构化角色信息

        增强的角色信息结构：
        {
            "name": str,
            "role_type": str,  # 主角/配角/反派
            "basic_info": {...},
            "personality": {
                "traits": list[str],
                "behavior_patterns": list[str]  # 从性格推导
            },
            "background_summary": str,
            "speech_style": str,  # 从性格推导
            "relationships": list[dict]  # 与其他角色的关系
        }
        """
        characters = await Character.filter(project_id=project_id).all()
        structured_chars = []

        for char in characters:
            # 基本信息
            char_data = {
                "name": char.name,
                "role_type": (
                    char.basic_info.get("category", "角色")
                    if char.basic_info
                    else "角色"
                ),
                "basic_info": char.basic_info or {},
            }

            # 性格特征
            personality = char.personality or {}
            traits = personality.get("traits", [])
            char_data["personality"] = {
                "traits": traits,
                "behavior_patterns": ContextBuilder._derive_behavior_patterns(traits),
            }

            # 背景简介
            background = char.background or {}
            summary = background.get("summary", "")
            char_data["background_summary"] = summary[:100] if summary else ""

            # 语言风格（从性格推导）
            char_data["speech_style"] = ContextBuilder._derive_speech_style(traits)

            # 获取角色关系
            char_data["relationships"] = await ContextBuilder._get_character_relations(
                char.id,
            )

            # 其他备注
            char_data["notes"] = char.notes or ""

            structured_chars.append(char_data)

        return structured_chars

    @staticmethod
    def _derive_behavior_patterns(traits: list[str]) -> list[str]:
        """从性格特征推导行为模式"""
        # 性格 -> 行为模式映射
        trait_behavior_map = {
            "勇敢": "面对危险时主动出击",
            "善良": "愿意帮助他人",
            "冲动": "容易在情绪激动时做出决定",
            "冷静": "遇事三思而后行",
            "谨慎": "行事小心，避免风险",
            "果断": "决策迅速，不拖泥带水",
            "温柔": "言行举止体贴他人",
            "高傲": "不屑与人为伍",
            "狡猾": "善于谋划和算计",
            "忠诚": "对朋友和盟友绝对可靠",
            "好奇": "喜欢探索未知事物",
            "固执": "坚持己见，不易改变",
        }

        patterns = []
        for trait in traits[:3]:  # 取前3个性格特征
            if trait in trait_behavior_map:
                patterns.append(trait_behavior_map[trait])

        return patterns

    @staticmethod
    def _derive_speech_style(traits: list[str]) -> str:
        """从性格特征推导语言风格"""
        # 性格 -> 语言风格映射
        trait_speech_map = {
            "温柔": "语气柔和，措辞委婉",
            "高傲": "语气高傲，言辞犀利",
            "冷静": "言简意赅，理性客观",
            "冲动": "语速较快，情绪化表达",
            "幽默": "喜欢开玩笑，语言轻松",
            "严肃": "正式严谨，不苟言笑",
            "直率": "有话直说，不拐弯抹角",
            "狡猾": "话中有话，善用暗示",
        }

        for trait in traits:
            if trait in trait_speech_map:
                return trait_speech_map[trait]

        return "语言风格自然"

    @staticmethod
    async def _get_character_relations(character_id: int) -> list[dict[str, Any]]:
        """获取角色关系"""
        relations = await CharacterRelation.filter(
            source_character_id=character_id,
        ).prefetch_related("target_character")

        relation_list = []
        for rel in relations:
            target = await rel.target_character
            relation_list.append(
                {
                    "name": target.name,
                    "relation": rel.relation_type,
                    "description": rel.description or "",
                },
            )

        return relation_list
