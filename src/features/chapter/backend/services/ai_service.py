"""
章节AI辅助写作服务
"""

from typing import AsyncGenerator

from loguru import logger

from src.backend.ai import ai_service
from src.backend.core.template import TemplateManager
from src.features.chapter.backend.models import Chapter
from src.features.chapter.backend.services.context_builder import ContextBuilder
from src.features.character.backend.models import Character
from src.features.novel_outline.backend.models import OutlineNode


class ChapterAIService:
    """章节AI辅助写作服务"""

    # 类级别模板管理器
    template_manager = TemplateManager()

    @staticmethod
    async def generate_chapter_content(
        chapter: Chapter,
        user_id: int,
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        AI生成章节内容
    
        Args:
            chapter: 章节对象
            user_id: 用户ID
            requirement: 额外要求
    
        Yields:
            生成的内容片段
        """
        try:
            # 获取小说项目信息
            await chapter.fetch_related("project")
            novel_genre = chapter.project.genre if chapter.project else ""
            novel_style = chapter.project.style if chapter.project else ""
    
            # 使用上下文构建器收集信息
            context = await ContextBuilder.build_generation_context(chapter)
            context["requirement"] = requirement
    
            # 尝试使用模板渲染
            try:
                full_requirement = ChapterAIService.template_manager.render(
                    "chapter_generate.jinja2",
                    **context,
                )
                logger.info("使用模板生成章节提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败,使用硬编码方法: {e}")
                # 降级到硬编码方法
                prompt_parts = []
    
                volume_title = context.get("volume_title")
                volume_description = context.get("volume_description")
                chapter_title = context.get("chapter_title")
                chapter_description = context.get("chapter_description")
                section_hints = context.get("section_hints", [])
                characters = context.get("characters", [])
    
                if volume_title:
                    prompt_parts.append(f"【卷】{volume_title}")
                    if volume_description:
                        prompt_parts.append(f"卷简介：{volume_description}")
    
                if chapter_title:
                    prompt_parts.append(f"【章】{chapter_title}")
                    if chapter_description:
                        prompt_parts.append(f"章简介：{chapter_description}")
    
                if characters:
                    prompt_parts.append("\n【角色设定】")
                    prompt_parts.append(
                        "以下是本项目的主要角色，请在创作时保持角色设定的一致性：\n",
                    )
                    for char in characters:
                        prompt_parts.append(f"角色名：{char['name']}")
                        if char.get("basic_info"):
                            basic = char["basic_info"]
                            info_parts = []
                            if basic.get("gender"):
                                info_parts.append(f"性别：{basic['gender']}")
                            if basic.get("age"):
                                info_parts.append(f"年龄：{basic['age']}")
                            if basic.get("occupation"):
                                info_parts.append(f"职业：{basic['occupation']}")
                            if basic.get("category"):
                                info_parts.append(f"角色定位：{basic['category']}")
                            if info_parts:
                                prompt_parts.append(f"  基本信息：{','.join(info_parts)}")
                        if char.get("personality") and char["personality"].get("traits"):
                            traits = char["personality"]["traits"]
                            if traits:
                                prompt_parts.append(
                                    f"  性格特征：{','.join(traits[:5])}",
                                )
                        if char.get("background_summary"):
                            prompt_parts.append(
                                f"  背景简介：{char['background_summary']}",
                            )
                        if char.get("notes"):
                            prompt_parts.append(f"  其他备注：{char['notes']}")
                        prompt_parts.append("")  # 空行分隔
    
                prompt_parts.append(f"\n请为章节《{chapter.title}》创作正文内容。")
    
                if section_hints:
                    prompt_parts.append("\n本章要点：")
                    for idx, hint in enumerate(section_hints, 1):
                        prompt_parts.append(f"{idx}. {hint['title']}")
                        if hint.get("description"):
                            prompt_parts.append(f"   {hint['description']}")
    
                if requirement:
                    prompt_parts.append(f"\n额外要求：{requirement}")
    
                prompt_parts.append(
                    "\n请直接开始创作，不需要任何前言和后记，只需要正文内容。使用txt格式，不要包含markdown格式。",
                )
    
                full_requirement = "\n".join(prompt_parts)
    
            # 构建长篇小说章节的系统提示词
            system_prompt = "你是一个专业的长篇小说作家，擅长创作长篇小说的章节内容。你的作品情节连贯、人物丰满、细节丰富。"
            if novel_genre:
                system_prompt += f"你特别擅长{novel_genre}类型的小说创作。"
            if novel_style:
                system_prompt += f"你的写作风格是{novel_style}。"
    
            # 调用通用AI服务生成章节内容
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=full_requirement,
                temperature=0.8,
                project_id=chapter.project_id,
                endpoint="/chapter/generate",
            ):
                yield chunk
    
        except Exception as e:
            logger.error(f"AI生成章节内容失败: {e}")
            raise

    @staticmethod
    async def continue_chapter_content(
        chapter: Chapter,
        user_id: int,
        current_content: str,
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        AI续写章节内容
    
        Args:
            chapter: 章节对象
            user_id: 用户ID
            current_content: 当前已有内容
            requirement: 续写要求
    
        Yields:
            续写的内容片段
        """
        try:
            # 获取小说项目信息
            await chapter.fetch_related("project")
            novel_genre = chapter.project.genre if chapter.project else ""
            novel_style = chapter.project.style if chapter.project else ""
    
            # 使用上下文构建器收集信息
            context = await ContextBuilder.build_continuation_context(chapter, current_content)
            context["requirement"] = requirement
    
            # 尝试使用模板渲染
            try:
                full_requirement = ChapterAIService.template_manager.render(
                    "chapter_continue.jinja2",
                    **context,
                )
                logger.info("使用模板生成续写提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败,使用硬编码方法: {e}")
                # 降级到硬编码方法
                prompt_parts = []
    
                characters = context.get("characters", [])
                current_ctx = context.get("current_content")
    
                # 添加角色设定
                if characters:
                    prompt_parts.append("【角色设定】")
                    prompt_parts.append(
                        "以下是本项目的主要角色，请在续写时保持角色设定的一致性：\n",
                    )
                    for char in characters:
                        prompt_parts.append(f"角色名：{char['name']}")
                        # 添加基本信息
                        if char.get("basic_info"):
                            basic = char["basic_info"]
                            info_parts = []
                            if basic.get("gender"):
                                info_parts.append(f"性别：{basic['gender']}")
                            if basic.get("age"):
                                info_parts.append(f"年龄：{basic['age']}")
                            if basic.get("occupation"):
                                info_parts.append(f"职业：{basic['occupation']}")
                            if basic.get("category"):
                                info_parts.append(f"角色定位：{basic['category']}")
                            if info_parts:
                                prompt_parts.append(f"  基本信息：{','.join(info_parts)}")
                        # 添加性格特征
                        if char.get("personality") and char["personality"].get("traits"):
                            traits = char["personality"]["traits"]
                            if traits:
                                prompt_parts.append(f"  性格特征：{','.join(traits[:5])}")
                        # 添加背景简介
                        if char.get("background_summary"):
                            prompt_parts.append(
                                f"  背景简介：{char['background_summary']}",
                            )
                        # 添加其他备注
                        if char.get("notes"):
                            prompt_parts.append(f"  其他备注：{char['notes']}")
                        prompt_parts.append("")  # 空行分隔
    
                prompt_parts.append(f"\n请为章节《{chapter.title}》续写内容。")
    
                if current_ctx:
                    prompt_parts.append(f"\n已有内容的最后部分：\n{current_ctx}")
    
                if requirement:
                    prompt_parts.append(f"\n续写要求：{requirement}")
    
                prompt_parts.append(
                    "\n请自然地继续故事，保持风格一致。直接开始续写，不需要任何前言。使用txt格式，不要包含markdown格式。",
                )
    
                full_requirement = "\n".join(prompt_parts)
    
            # 构建长篇小说续写的系统提示词
            system_prompt = "你是一个专业的长篇小说作家，擅长续写和延续故事。你能保持前文风格，自然流畅地推进情节发展。"
            if novel_genre:
                system_prompt += f"你特别擅长{novel_genre}类型的小说续写。"
            if novel_style:
                system_prompt += f"你的写作风格是{novel_style}。"
    
            # 调用通用AI服务续写内容
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=full_requirement,
                temperature=0.8,
                project_id=chapter.project_id,
                endpoint="/chapter/continue",
            ):
                yield chunk
    
        except Exception as e:
            logger.error(f"AI续写章节内容失败: {e}")
            raise

    @staticmethod
    async def optimize_chapter_content(
        chapter: Chapter,
        user_id: int,
        content: str,
        optimization_type: str = "general",
    ) -> AsyncGenerator[str, None]:
        """
        AI优化章节内容

        Args:
            chapter: 章节对象
            user_id: 用户ID
            content: 待优化内容
            optimization_type: 优化类型 (general/grammar/style)

        Yields:
            优化后的内容片段
        """
        try:
            # 获取小说项目信息
            await chapter.fetch_related("project")
            novel_title = chapter.project.title if chapter.project else "未命名小说"  # noqa: F841
            novel_genre = chapter.project.genre if chapter.project else ""
            novel_style = chapter.project.style if chapter.project else ""

            # 尝试使用模板渲染
            try:
                prompt = ChapterAIService.template_manager.render(
                    "chapter_optimize.jinja2",
                    content=content,
                    optimization_type=optimization_type,
                )
                logger.info("使用模板生成优化提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败，使用硬编码方法: {e}")
                # 降级到硬编码方法
                if optimization_type == "grammar":
                    prompt = f"请检查并修正以下内容的语法错误、错别字和标点符号问题：\n\n{content}\n\n请直接返回修正后的内容，不要添加任何解释。"
                elif optimization_type == "style":
                    prompt = f"请优化以下内容的写作风格，使其更加生动、流畅、有文采：\n\n{content}\n\n请直接返回优化后的内容，不要添加任何解释。"
                else:
                    prompt = f"请全面优化以下内容，包括语法、风格、逻辑性和可读性：\n\n{content}\n\n请直接返回优化后的内容，不要添加任何解释。"

            # 构建优化的系统提示词
            system_prompt = "你是一个专业的文字编辑和优化专家，擅长提升文本质量。"
            if novel_genre:
                system_prompt += f"你特别熟悉{novel_genre}类型的写作规范。"
            if novel_style:
                system_prompt += f"你熟悉{novel_style}风格的表达方式。"
            
            # 调用通用AI服务优化内容
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=prompt,
                temperature=0.7,
                project_id=chapter.project_id,
                endpoint="/chapter/optimize",
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI优化章节内容失败: {e}")
            raise


    @staticmethod
    async def expand_chapter_content(
        chapter: Chapter,
        user_id: int,
        content: str,
        expand_ratio: float = 1.5,
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        AI扩写章节内容

        Args:
            chapter: 章节对象
            user_id: 用户ID
            content: 原始内容
            expand_ratio: 扩写比例（如1.5表示扩写到原来的1.5倍）
            requirement: 额外要求

        Yields:
            扩写后的内容片段
        """
        try:
            # 获取小说项目信息
            await chapter.fetch_related("project")
            novel_genre = chapter.project.genre if chapter.project else ""
            novel_style = chapter.project.style if chapter.project else ""

            # 获取角色设定信息
            characters = await Character.filter(project_id=chapter.project_id).all()

            # 使用模板渲染
            try:
                full_requirement = ChapterAIService.template_manager.render(
                    "chapter_expand.jinja2",
                    characters=characters,
                    chapter_title=chapter.title,
                    original_content=content,
                    expand_ratio=expand_ratio,
                    requirement=requirement,
                )
                logger.info("使用模板生成扩写提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败，使用硬编码方法: {e}")
                # 降级到硬编码方法
                prompt_parts = []

                # 添加角色设定
                if characters:
                    prompt_parts.append("【角色设定】")
                    prompt_parts.append("以下是本项目的主要角色，请在扩写时保持角色设定的一致性：\n")
                    for char in characters:
                        prompt_parts.append(f"角色名：{char.name}")
                        if char.basic_info:
                            basic = char.basic_info
                            info_parts = []
                            if basic.get("gender"):
                                info_parts.append(f"性别：{basic['gender']}")
                            if basic.get("age"):
                                info_parts.append(f"年龄：{basic['age']}")
                            if basic.get("occupation"):
                                info_parts.append(f"职业：{basic['occupation']}")
                            if info_parts:
                                prompt_parts.append(f"  基本信息：{'，'.join(info_parts)}")
                        prompt_parts.append("")  # 空行分隔

                prompt_parts.append(f"\n请对章节《{chapter.title}》的以下内容进行扩写：")
                prompt_parts.append(f"\n原始内容：\n{content}")
                prompt_parts.append(f"\n扩写比例：{expand_ratio}倍")
                prompt_parts.append("\n保持原文核心情节、人物关系和主题不变，丰富细节描写、扩展对话、增强情节。")

                if requirement:
                    prompt_parts.append(f"\n额外要求：{requirement}")

                prompt_parts.append(
                    "\n直接输出扩写后的完整内容，不要添加任何前言或后记。使用txt格式，不要包含markdown格式。",
                )

                full_requirement = "\n".join(prompt_parts)

            # 构建系统提示词
            system_prompt = "你是一个专业的小说扩写专家，擅长在保持原文核心的基础上丰富细节、扩展情节。"
            if novel_genre:
                system_prompt += f"你特别擅长{novel_genre}类型的小说扩写。"
            if novel_style:
                system_prompt += f"你熟悉{novel_style}风格的表达方式。"

            # 调用通用AI服务扩写内容
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=full_requirement,
                temperature=0.7,
                project_id=chapter.project_id,
                endpoint="/chapter/expand",
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI扩写章节内容失败: {e}")
            raise

    @staticmethod
    async def compress_chapter_content(
        chapter: Chapter,
        user_id: int,
        content: str,
        compress_ratio: int = 50,
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        AI缩写章节内容

        Args:
            chapter: 章节对象
            user_id: 用户ID
            content: 原始内容
            compress_ratio: 压缩比例（百分比，如50表示压缩到原来的50%）
            requirement: 额外要求

        Yields:
            缩写后的内容片段
        """
        try:
            # 获取小说项目信息
            await chapter.fetch_related("project")
            novel_genre = chapter.project.genre if chapter.project else ""
            novel_style = chapter.project.style if chapter.project else ""

            # 获取角色设定信息
            characters = await Character.filter(project_id=chapter.project_id).all()

            # 使用模板渲染
            try:
                full_requirement = ChapterAIService.template_manager.render(
                    "chapter_compress.jinja2",
                    characters=characters,
                    chapter_title=chapter.title,
                    original_content=content,
                    compress_ratio=compress_ratio,
                    requirement=requirement,
                )
                logger.info("使用模板生成缩写提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败，使用硬编码方法: {e}")
                # 降级到硬编码方法
                prompt_parts = []

                # 添加角色设定
                if characters:
                    prompt_parts.append("【角色设定】")
                    prompt_parts.append("以下是本项目的主要角色，请在缩写时保持对这些角色的准确描述：\n")
                    for char in characters:
                        prompt_parts.append(f"角色名：{char.name}")
                        if char.basic_info:
                            basic = char.basic_info
                            info_parts = []
                            if basic.get("gender"):
                                info_parts.append(f"性别：{basic['gender']}")
                            if basic.get("age"):
                                info_parts.append(f"年龄：{basic['age']}")
                            if info_parts:
                                prompt_parts.append(f"  基本信息：{'，'.join(info_parts)}")
                        prompt_parts.append("")  # 空行分隔

                prompt_parts.append(f"\n请对章节《{chapter.title}》的以下内容进行缩写：")
                prompt_parts.append(f"\n原始内容：\n{content}")
                prompt_parts.append(f"\n压缩比例：{compress_ratio}%")
                prompt_parts.append("\n保留核心情节和重要人物，删减冗余描写，简化次要情节。")

                if requirement:
                    prompt_parts.append(f"\n额外要求：{requirement}")

                prompt_parts.append(
                    "\n直接输出缩写后的完整内容，不要添加任何前言或后记。使用txt格式，不要包含markdown格式。",
                )

                full_requirement = "\n".join(prompt_parts)

            # 构建系统提示词
            system_prompt = "你是一个专业的文本缩写专家，擅长提取核心信息、保留关键情节、压缩冗余内容。"
            if novel_genre:
                system_prompt += f"你特别擅长{novel_genre}类型的小说缩写。"
            if novel_style:
                system_prompt += f"你熟悉{novel_style}风格的精炼表达。"

            # 调用通用AI服务缩写内容
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=full_requirement,
                temperature=0.6,
                project_id=chapter.project_id,
                endpoint="/chapter/compress",
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI缩写章节内容失败: {e}")
            raise


# 创建服务实例
chapter_ai_service = ChapterAIService()
