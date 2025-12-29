"""AI小说生成服务
集成OpenAI SDK提供小说内容生成功能
"""

import asyncio
import os
from functools import total_ordering
from typing import AsyncGenerator, Dict, List

from openai import AsyncOpenAI

from src.backend.core.cache import UserAIConfig, config_cache_manager
from src.backend.core.logger import logger
from src.backend.services.token_statistics import token_statistics_service
from src.features.user.backend.models import UserSetting


class AIService:
    """AI服务类，用于生成小说内容"""

    def __init__(self):
        """初始化AI服务"""
        # 初始化OpenAI客户端占位符
        self.client = None
        self.api_key = None
        self.api_base = None
        self.api_model = None
        self.api_max_tokens = None
        logger.info("AI客户端初始化完成")

    async def load_user_settings(self, user_id: int):
        """加载用户设置（使用缓存）"""
        try:
            # 从缓存管理器获取配置
            config = await config_cache_manager.get_user_ai_config(user_id)
            
            # 更新API配置
            self.api_key = config.api_key
            self.api_base = config.api_base
            self.api_model = config.api_model
            self.api_max_tokens = config.api_max_tokens
            
            # 如果有API密钥，初始化客户端
            if self.api_key:
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.api_base if self.api_base else None,
                )
            else:
                self.client = None
                logger.warning("API密钥未设置，AI功能不可用")
                
        except Exception as e:
            logger.error(f"加载用户设置时发生错误: {e}")
            self.client = None

    async def generate_novel_content_stream(
        self, 
        user_id: int,
        title: str, 
        genre: str = "", 
        style: str = "",
        requirement: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        流式生成小说内容
        
        Args:
            user_id: 用户ID
            title: 小说标题
            genre: 小说类型
            style: 写作风格
            
        Yields:
            str: 生成的小说内容片段
        """
        # 加载用户设置
        await self.load_user_settings(user_id)

        # 检查客户端是否可用
        if not self.client:
            yield "错误: AI服务未正确配置，请检查您的API设置"
            return

        # 初始化Token计数器
        prompt_tokens = 0
        completion_tokens = 0
        
        try:
            # 构建提示词
            prompt = self._build_prompt(title, genre, style, requirement)
            
            logger.info(f"开始流式生成小说内容: {title}")
            
            # 调用OpenAI API进行流式生成
            response = await self.client.chat.completions.create(
                model=self.api_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的短篇小说作家，擅长创作1000-5000字的精彩短篇小说。你的作品结构紧凑、情节精练、人物鲜明、主题深刺。"},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                stream_options={"include_usage": True},
                temperature=0.8,
                max_tokens=self.api_max_tokens,
            )
            
            # 处理流式响应，支持思维链(Reasoning Content)
            async for chunk in response:
                # 优先检查usage信息（在最后一个chunk中）
                if hasattr(chunk, "usage") and chunk.usage is not None:
                    if chunk.usage.prompt_tokens is not None:
                        prompt_tokens = chunk.usage.prompt_tokens
                    if chunk.usage.completion_tokens is not None:
                        completion_tokens = chunk.usage.completion_tokens
                    logger.info(f"获取到usage信息: prompt_tokens={prompt_tokens}, completion_tokens={completion_tokens}")
                    

                # 检查是否有内容需要yield
                if not chunk.choices:
                    continue
                    
                delta = chunk.choices[0].delta
                if not delta:
                    continue
                    
                # 获取思维链内容
                delta_dict = delta.model_extra or {}
                reasoning_content = delta_dict.get("reasoning_content", "")
                
                # 如果有思维链内容，先返回
                if reasoning_content:
                    # 使用特殊标记包装思维链内容
                    yield f"[REASONING]{reasoning_content}[/REASONING]"
                
                # 获取常规内容
                content = delta.content or ""
                if content:
                    yield content
                    
        except Exception as e:
            logger.error(f"流式生成小说内容时发生错误: {e}")
            yield f"生成过程中发生错误: {e!s}"
        finally:
            # 确保无论如何都记录Token使用量
            if prompt_tokens > 0 or completion_tokens > 0:
                token_statistics_service.record_usage_background(
                    user_id=user_id,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    model=self.api_model,
                    endpoint="/novel_generator/generate",
                )
                logger.info(f"Token使用已记录: prompt={prompt_tokens}, completion={completion_tokens}, total={prompt_tokens + completion_tokens}")
            else:
                logger.warning(f"Token统计为0, API可能不支持stream_options. model={self.api_model}, base_url={self.api_base}")

    def _build_prompt(self, title: str, genre: str = "", style: str = "", requirement: str = "") -> str:
        """
        构建生成短篇小说的提示词

        Args:
            title: 小说标题
            genre: 小说类型
            style: 写作风格
            requirement: 详细要求

        Returns:
            str: 构建好的提示词
        """
        prompt = f"请创作一篇短篇小说，标题为《{title}》"

        if genre:
            prompt += f"，类型为{genre}"

        if style:
            prompt += f"，写作风格为{style}"

        if requirement:
            prompt += f"。\n\n详细要求：\n{requirement}\n"
        else:
            prompt += "。"

        prompt += (
            "\n\n创作要求："
            "\n1. 字数控制：1000-5000字，根据故事需要灵活调整"
            "\n2. 结构完整：必须包含开端、发展、高潮和结局四个部分"
            "\n3. 人物刻画：人物性格鲜明，动机清晰，具有感染力"
            "\n4. 情节设计：情节紧凑有吸引力，节奏把握得当"
            "\n5. 主题深度：虚构而不空洞，能引发读者思考"
            "\n6. 语言表达：文字细腻生动，画面感强，富有感染力"
            "\n7. 结局处理：结局应有余韵，给读者留下思考空间"
            "\n\n格式要求："
            "\n- 直接开始创作，不需要任何前言和后记"
            "\n- 只需要小说正文内容"
            "\n- 使用纯文本格式，不要包含markdown格式"
            "\n- 分段清晰，段落间用空行隔开"
        )

        logger.info(f"生成短篇小说内容的提示词: {prompt}")

        return prompt

    async def generate_content_stream(
        self, 
        user_id: int,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        project_id: int | None = None,
        endpoint: str = "/ai/generate",
    ) -> AsyncGenerator[str, None]:
        """
        通用流式内容生成方法
            
        Args:
            user_id: 用户ID
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            temperature: 温度参数（0-1），控制创造性
            project_id: 项目ID（可选）
            endpoint: API端点
                
        Yields:
            str: 生成的内容片段
        """
        # 加载用户设置
        await self.load_user_settings(user_id)
    
        logger.info(f"用户提示词: {user_prompt}")
    
        # 检查客户端是否可用
        if not self.client:
            yield "错误: AI服务未正确配置，请检查您的API设置"
            return
    
        # 初始化Token计数器
        prompt_tokens = 0
        completion_tokens = 0
            
        try:
            logger.info("开始流式生成内容")
                    
            # 调用OpenAI API进行流式生成
            response = await self.client.chat.completions.create(
                model=self.api_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                stream=True,
                stream_options={"include_usage": True},
                temperature=temperature,
                max_tokens=self.api_max_tokens,
            )
                                
            # 处理流式响应,支持思维链(Reasoning Content)
            async for chunk in response:
                # 优先检查usage信息(在最后一个chunk中)
                if hasattr(chunk, "usage") and chunk.usage is not None:
                    if chunk.usage.prompt_tokens is not None:
                        prompt_tokens = chunk.usage.prompt_tokens
                    if chunk.usage.completion_tokens is not None:
                        completion_tokens = chunk.usage.completion_tokens
                    logger.info(f"获取到usage信息: prompt_tokens={prompt_tokens}, completion_tokens={completion_tokens}")
                
                # 检查是否有内容需要yield
                if not chunk.choices:
                    continue
                    
                delta = chunk.choices[0].delta
                if not delta:
                    continue
                    
                # 获取思维链内容
                delta_dict = delta.model_extra or {}
                reasoning_content = delta_dict.get("reasoning_content", "")
                        
                # 如果有思维链内容，先返回
                if reasoning_content:
                    yield f"[REASONING]{reasoning_content}[/REASONING]"
                        
                # 获取常规内容
                content = delta.content or ""
                if content:
                    yield content
                            
        except Exception as e:
            logger.error(f"流式生成内容时发生错误: {e}")
            yield f"生成过程中发生错误: {e!s}"
        finally:
            # 确保无论如何都记录Token使用量
            if prompt_tokens > 0 or completion_tokens > 0:
                token_statistics_service.record_usage_background(
                    user_id=user_id,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    model=self.api_model,
                    endpoint=endpoint,
                    project_id=project_id,
                )
                logger.info(f"Token使用已记录: prompt={prompt_tokens}, completion={completion_tokens}, total={prompt_tokens + completion_tokens}")
            else:
                logger.warning(f"Token统计为0, API可能不支持stream_options. model={self.api_model}, base_url={self.api_base}")

    async def chat_with_ai_stream(self, user_id: int, messages: list[dict]) -> AsyncGenerator[str, None]:
        await self.load_user_settings(user_id)
        if not self.client:
            yield "错误: AI服务未正确配置"
            return

        usage_holder = {}          # 用 dict 做可变容器，避免局部变量作用域问题

        try:
            stream = await self.client.chat.completions.create(
                model=self.api_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的短篇小说创作助手……"},
                    *messages,
                ],
                stream=True,
                stream_options={"include_usage": True},
                temperature=0.7,
                max_tokens=self.api_max_tokens,
            )

            async for chunk in stream:
                # 1. 先把业务内容 yield 出去
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content

                # 2. 只要出现 usage 就一次性存下来
                if chunk.usage:
                    usage_holder["prompt"] = chunk.usage.prompt_tokens
                    usage_holder["completion"] = chunk.usage.completion_tokens
                    logger.info("got usage -> %s", chunk.usage)

        except Exception as e:
            logger.exception("stream error")
            yield f"对话异常: {e}"
        finally:
            # 3. 只要曾收到过 usage，就记录；否则说明接口没给
            if usage_holder:
                token_statistics_service.record_usage_background(
                    user_id=user_id,
                    prompt_tokens=usage_holder["prompt"],
                    completion_tokens=usage_holder["completion"],
                    model=self.api_model,
                    endpoint="/ai/chat",
                )
                logger.info(
                    "Token 已记录  p=%s c=%s total=%s",
                    usage_holder["prompt"],
                    usage_holder["completion"],
                    usage_holder["prompt"] + usage_holder["completion"],
                )
            else:
                logger.warning("整个流式过程未收到 usage，可能模型或 SDK 不支持")

# 创建全局AI服务实例
ai_service = AIService()
