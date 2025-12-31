"""
小说项目AI辅助写作服务
"""

from typing import AsyncGenerator

from loguru import logger

from src.backend.ai import ai_service
from src.backend.core.template import TemplateManager
from src.features.character.backend.models import Character
from src.features.novel_project.backend.models import NovelProject


class ProjectAIService:
    """小说项目AI辅助写作服务"""
    
    # 类级别模板管理器（复用实例）
    template_manager = TemplateManager()

    @staticmethod
    async def generate_project_content(
        project: NovelProject,
        user_id: int,
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        AI生成项目内容

        Args:
            project: 项目对象
            user_id: 用户ID
            requirement: 额外要求

        Yields:
            生成的内容片段
        """
        try:
            # 获取项目信息
            novel_title = project.title or "未命名小说"
            novel_genre = project.genre or ""
            novel_style = project.style or ""

            # 获取并添加角色设定信息
            characters = await Character.filter(project_id=project.id).all()
            
            # 准备模板上下文
            context = {
                "novel_title": novel_title,
                "novel_genre": novel_genre,
                "novel_style": novel_style,
                "novel_description": project.description or "",
                "characters": characters,
                "requirement": requirement,
            }
            
            # 尝试使用模板渲染提示词
            try:
                full_requirement = ProjectAIService.template_manager.render(
                    "project_generate.jinja2",
                    **context,
                )
                logger.info("使用模板生成项目内容提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败，使用硬编码方法: {e}")
                # 降级到硬编码方法
                prompt_parts = [
                    "请根据以下小说设定生成完整的小说正文：",
                    f"小说标题：{novel_title}",
                ]
                
                if novel_genre:
                    prompt_parts.append(f"小说类型：{novel_genre}")
                
                if novel_style:
                    prompt_parts.append(f"写作风格：{novel_style}")
                
                if project.description:
                    prompt_parts.append(f"小说描述：{project.description}")
                
                if characters:
                    prompt_parts.append("\n【角色设定】")
                    prompt_parts.append("以下是本项目的主要角色，请在创作中合理运用这些角色：\n")
                    for char in characters:
                        char_info = [f"角色名：{char.name}"]
                        # 添加基本信息
                        if char.basic_info:
                            basic = char.basic_info
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
                                char_info.append(f"  基本信息：{'，'.join(info_parts)}")
                        # 添加性格特征
                        if char.personality:
                            personality = char.personality
                            traits = personality.get("traits", [])
                            if traits:
                                char_info.append(f"  性格特征：{'、'.join(traits[:5])}")
                        # 添加背景简介
                        if char.background:
                            background = char.background
                            if background.get("summary"):
                                char_info.append(f"  背景简介：{background['summary'][:100]}")
                        # 添加其他备注
                        if char.notes:
                            char_info.append(f"  其他备注：{char.notes}")
                        prompt_parts.append("\n".join(char_info))
                        prompt_parts.append("")
                
                if requirement:
                    prompt_parts.append(f"用户要求：{requirement}")
                
                full_requirement = "\n".join(prompt_parts)

            # 构建系统提示词
            system_prompt = "你是一个专业的长篇小说作家，擅长创作长篇小说的完整内容。你的作品情节连贯、人物丰满、细节丰富。"
            if novel_genre:
                system_prompt += f"你特别擅长{novel_genre}类型的小说创作。"
            if novel_style:
                system_prompt += f"你的写作风格是{novel_style}。"
            
            # 调用通用AI服务生成项目内容
            async for chunk in ai_service.generate_content_stream(
                user_id=user_id,
                system_prompt=system_prompt,
                user_prompt=full_requirement,
                temperature=0.8,
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI生成项目内容失败: {e}")
            raise

    @staticmethod
    async def continue_project_content(
        project: NovelProject,
        user_id: int,
        current_content: str,
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        AI续写项目内容

        Args:
            project: 项目对象
            user_id: 用户ID
            current_content: 当前已有内容
            requirement: 续写要求

        Yields:
            生成的续写内容片段
        """
        try:
            # 获取项目信息
            novel_title = project.title or "未命名小说"
            novel_genre = project.genre or ""
            novel_style = project.style or ""

            # 截取最后部分内容作为上下文（防止过长）
            max_context_length = 2000
            context_content = current_content[-max_context_length:] if len(current_content) > max_context_length else current_content

            # 获取并添加角色设定信息
            characters = await Character.filter(project_id=project.id).all()
            
            # 准备模板上下文
            context = {
                "novel_title": novel_title,
                "context_content": context_content,
                "context_length": len(context_content),
                "characters": characters,
                "requirement": requirement,
            }
            
            # 尝试使用模板渲染提示词
            try:
                full_requirement = ProjectAIService.template_manager.render(
                    "project_continue.jinja2",
                    **context,
                )
                logger.info("使用模板生成项目续写提示词成功")
            except Exception as e:
                logger.warning(f"模板渲染失败，使用硬编码方法: {e}")
                # 降级到硬编码方法
                prompt_parts = [
                    f"继续创作小说《{novel_title}》的后续内容。",
                    f"前文内容（最后{len(context_content)}字）：\n{context_content}",
                ]
                
                if characters:
                    prompt_parts.append("\n【角色设定参考】")
                    prompt_parts.append("请注意以下角色设定，保持角色一致性：\n")
                    for char in characters:
                        char_info = [f"角色名：{char.name}"]
                        # 添加基本信息
                        if char.basic_info:
                            basic = char.basic_info
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
                                char_info.append(f"  基本信息：{'，'.join(info_parts)}")
                        # 添加性格特征
                        if char.personality:
                            personality = char.personality
                            traits = personality.get("traits", [])
                            if traits:
                                char_info.append(f"  性格特征：{'、'.join(traits[:5])}")
                        prompt_parts.append("\n".join(char_info))
                        prompt_parts.append("")
                
                if requirement:
                    prompt_parts.append(f"续写要求：{requirement}")
                else:
                    prompt_parts.append("请自然流畅地推进故事情节，保持前文的风格和节奏。")
                
                full_requirement = "\n".join(prompt_parts)

            # 构建续写的系统提示词
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
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI续写项目内容失败: {e}")
            raise

    @staticmethod
    async def optimize_project_content(
        project: NovelProject,
        user_id: int,
        content: str,
        optimization_type: str = "general",
    ) -> AsyncGenerator[str, None]:
        """
        AI优化项目内容

        Args:
            project: 项目对象
            user_id: 用户ID
            content: 待优化内容
            optimization_type: 优化类型 (general/grammar/style)

        Yields:
            生成的优化后内容片段
        """
        try:
            # 获取项目信息
            novel_genre = project.genre or ""
            novel_style = project.style or ""

            # 准备模板上下文
            context = {
                "content": content,
                "optimization_type": optimization_type,
            }
            
            # 尝试使用模板渲染提示词
            try:
                prompt = ProjectAIService.template_manager.render(
                    "project_optimize.jinja2",
                    **context,
                )
                logger.info("使用模板生成项目优化提示词成功")
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
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI优化项目内容失败: {e}")
            raise


# 创建服务实例
project_ai_service = ProjectAIService()
