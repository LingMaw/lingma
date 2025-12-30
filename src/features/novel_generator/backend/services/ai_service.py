"""
小说生成器AI服务
提供小说内容生成的AI功能
"""

from typing import AsyncGenerator

from loguru import logger

from src.backend.ai import ai_service as base_ai_service


class NovelGeneratorAIService:
    """小说生成器AI服务"""

    @staticmethod
    async def generate_novel_content_stream(
        user_id: int,
        title: str,
        genre: str | None = None,
        style: str | None = None,
        requirement: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        流式生成小说内容

        Args:
            user_id: 用户ID
            title: 小说标题
            genre: 小说类型
            style: 写作风格
            requirement: 小说生成要求

        Yields:
            生成的内容片段，包括思维链和正文内容
        """
        try:
            # 构建系统提示词
            system_prompt = "你是一个专业的短篇小说作家，擅长创作1000-5000字的精彩短篇小说。你的作品结构紧凑、情节精练、人物鲜明、主题深刻。"
            if genre:
                system_prompt += f"你特别擅长{genre}类型的小说创作。"
            if style:
                system_prompt += f"你的写作风格是{style}。"

            # 构建用户提示词
            prompt_parts = [f"请创作一篇小说，标题是：{title}"]
            if genre:
                prompt_parts.append(f"小说类型：{genre}")
            if style:
                prompt_parts.append(f"写作风格：{style}")
            if requirement:
                prompt_parts.append(f"额外要求：{requirement}")

            full_requirement = "\n".join(prompt_parts)

            logger.info(f"用户 {user_id} 开始流式生成小说: {title}")

            # 调用基础AI服务生成内容
            async for chunk in base_ai_service.generate_novel_content_stream(
                user_id=user_id,
                title=title,
                genre=genre or "",
                style=style or "",
                requirement=full_requirement,
            ):
                yield chunk

        except Exception as e:
            logger.error(f"AI生成小说内容失败: {e}")
            raise


# 创建服务实例
ai_service = NovelGeneratorAIService()
