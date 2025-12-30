"""AI小说生成服务
集成OpenAI SDK提供小说内容生成功能
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, List, NamedTuple, Optional

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk

from src.backend.core.cache import config_cache_manager
from src.backend.core.logger import logger
from src.backend.core.template import TemplateManager
from src.backend.services.prompt_service import prompt_record_service
from src.backend.services.token_statistics import token_statistics_service


# 定义一个轻量级的配置对象，用于在函数间传递
class AIConfigContext(NamedTuple):
    client: AsyncOpenAI
    model: str
    max_tokens: int
    user_id: int
    temperature: float = 0.7

class AIService:
    """AI服务类，用于生成小说内容"""

    def __init__(self):
        """初始化AI服务"""
        # 仅保留无状态的工具类作为实例属性
        self.template_manager = TemplateManager()
        logger.info("AI服务初始化完成")

    async def _get_user_context(self, user_id: int, temperature: float = 0.7) -> Optional[AIConfigContext]:
        """
        获取用户配置并构建上下文环境
        解决并发问题：不再修改 self 属性，而是返回局部配置对象
        """
        try:
            config = await config_cache_manager.get_user_ai_config(user_id)
            
            if not config.api_key:
                logger.warning(f"用户 {user_id} 未设置API密钥")
                return None

            # 每次请求创建独立的 client 实例以保证并发安全
            # 注意：如果高并发场景下 httpx 连接开销大，可考虑实现基于 api_key 的 Client 缓存池
            client = AsyncOpenAI(
                api_key=config.api_key,
                base_url=config.api_base if config.api_base else None,
            )

            return AIConfigContext(
                client=client,
                model=config.api_model,
                max_tokens=config.api_max_tokens,
                user_id=user_id,
                temperature=temperature,
            )
        except Exception as e:
            logger.error(f"加载用户配置失败 user_id={user_id}: {e}")
            return None

    async def _stream_completion_handler(
        self,
        context: AIConfigContext,
        messages: List[Dict[str, str]],
        endpoint: str,
        project_id: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """
        通用的流式响应处理核心逻辑
        包含：API调用、思维链处理、Usage统计、错误捕获
        """
        prompt_tokens = 0
        completion_tokens = 0
        
        # 提取system_prompt和user_prompt用于记录
        system_prompt = ""
        user_prompt = ""
        for msg in messages:
            if msg.get("role") == "system":
                system_prompt = msg.get("content", "")
            elif msg.get("role") == "user":
                user_prompt = msg.get("content", "")
        
        # 在调用AI API之前记录提示词
        prompt_record_service.record_prompt_background(
            user_id=context.user_id,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            endpoint=endpoint,
            model=context.model,
            temperature=context.temperature,
            project_id=project_id,
        )
        
        try:
            logger.info(f"开始请求AI模型: {context.model}, endpoint: {endpoint}")
            
            stream = await context.client.chat.completions.create(
                model=context.model,
                messages=messages,
                stream=True,
                stream_options={"include_usage": True},
                temperature=context.temperature,
                max_tokens=context.max_tokens,
            )

            async for chunk in stream:
                # 1. 处理 Token Usage 信息 (通常在最后一个 chunk)
                if chunk.usage:
                    prompt_tokens = chunk.usage.prompt_tokens
                    completion_tokens = chunk.usage.completion_tokens
                    logger.debug(f"收到Usage信息: p={prompt_tokens}, c={completion_tokens}")

                # 2. 检查有效内容
                if not chunk.choices:
                    continue
                
                delta = chunk.choices[0].delta
                
                # 3. 处理思维链 (DeepSeek R1 等模型)
                # 检查 delta 是否包含 reasoning_content (OpenAI SDK 兼容性处理)
                delta_dict = delta.model_extra or {}
                reasoning_content = delta_dict.get("reasoning_content", "")
                
                if reasoning_content:
                    yield f"[REASONING]{reasoning_content}[/REASONING]"
                
                # 4. 处理常规内容
                if delta.content:
                    yield delta.content

        except Exception as e:
            logger.error(f"流式生成异常 user_id={context.user_id}: {e}")
            yield f"生成过程中发生错误: {e!s}"
        
        finally:
            # 5. 统一记录 Token 使用量
            if prompt_tokens > 0 or completion_tokens > 0:
                token_statistics_service.record_usage_background(
                    user_id=context.user_id,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    model=context.model,
                    endpoint=endpoint,
                    project_id=project_id,
                )
                logger.info(
                    f"Token统计完成: user={context.user_id}, "
                    f"total={prompt_tokens + completion_tokens}",
                )
            else:
                logger.warning(f"本次请求未获取到Token统计 (user={context.user_id})")
            
            # 关闭客户端连接 (很重要，因为我们是针对请求创建的 client)
            await context.client.close()

    async def generate_novel_content_stream(
        self, 
        user_id: int,
        title: str, 
        genre: str = "", 
        style: str = "",
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """流式生成小说内容"""
        
        # 1. 获取上下文
        ctx = await self._get_user_context(user_id, temperature=0.8)
        if not ctx:
            yield "错误: AI服务未正确配置，请检查您的API设置"
            return

        # 2. 构建提示词
        prompt = self._build_prompt(title, genre, style, requirement)
        messages = [
            {"role": "system", "content": "你是一个专业的短篇小说作家，擅长创作1000-5000字的精彩短篇小说。你的作品结构紧凑、情节精练、人物鲜明、主题深刻。"},
            {"role": "user", "content": prompt},
        ]

        # 3. 调用通用处理器
        async for content in self._stream_completion_handler(
            context=ctx,
            messages=messages,
            endpoint="/novel_generator/generate",
        ):
            yield content

    async def generate_content_stream(
        self, 
        user_id: int,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        project_id: int | None = None,
        endpoint: str = "/ai/generate",
    ) -> AsyncGenerator[str, None]:
        """通用流式内容生成方法"""
        
        ctx = await self._get_user_context(user_id, temperature=temperature)
        if not ctx:
            yield "错误: AI服务未正确配置，请检查您的API设置"
            return

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        async for content in self._stream_completion_handler(
            context=ctx,
            messages=messages,
            endpoint=endpoint,
            project_id=project_id,
        ):
            yield content

    async def chat_with_ai_stream(self, user_id: int, messages: list[dict]) -> AsyncGenerator[str, None]:
        """对话模式流式生成"""
        
        ctx = await self._get_user_context(user_id, temperature=0.7)
        if not ctx:
            yield "错误: AI服务未正确配置"
            return

        # 确保包含系统提示词（如果没有的话）
        final_messages = messages
        if not messages or messages[0].get("role") != "system":
            final_messages = [
                {"role": "system", "content": "你是一个专业的短篇小说创作助手，可以帮助用户构思情节、润色文字或提供写作建议。"},
                *messages,
            ]

        async for content in self._stream_completion_handler(
            context=ctx,
            messages=final_messages,
            endpoint="/ai/chat",
        ):
            yield content

    def _build_prompt(self, title: str, genre: str = "", style: str = "", requirement: str = "") -> str:
        """构建生成短篇小说的提示词"""
        try:
            return self.template_manager.render(
                "short_story.jinja2",
                title=title,
                genre=genre,
                style=style,
                requirement=requirement,
            )
        except Exception as e:
            logger.warning(f"模板渲染失败，回退到默认构建逻辑: {e}")
            return self._build_prompt_legacy(title, genre, style, requirement)

    def _build_prompt_legacy(self, title: str, genre: str, style: str, requirement: str) -> str:
        """构建生成短篇小说的提示词（Legacy）"""
        # 使用列表构建字符串比 += 更高效
        parts = [f"请创作一篇短篇小说，标题为《{title}》"]
        
        if genre:
            parts.append(f"，类型为{genre}")
        if style:
            parts.append(f"，写作风格为{style}")
            
        parts.append("。\n\n详细要求：\n" + (requirement if requirement else "无"))
        
        parts.append(
            "\n\n创作要求："
            "\n1. 字数控制：1000-5000字，根据故事需要灵活调整"
            "\n2. 结构完整：必须包含开端、发展、高潮和结局四个部分"
            "\n3. 人物刻画：人物性格鲜明，动机清晰"
            "\n4. 格式要求：直接开始创作，不需要前言后记，分段清晰",
        )
        
        return "".join(parts)

# 创建全局AI服务实例
ai_service = AIService()