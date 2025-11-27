"""AI小说生成服务
集成OpenAI SDK提供小说内容生成功能
"""

import asyncio
import os
from typing import AsyncGenerator, Dict, List

from openai import AsyncOpenAI

from src.backend.core.logger import logger
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
        """加载用户设置"""
        try:
            # 获取用户设置
            settings = {}
            user_settings = await UserSetting.filter(user_id=user_id).all()
            for setting in user_settings:
                settings[setting.key] = setting.value
            
            # 更新API配置
            self.api_key = settings.get("api_key", "")
            self.api_base = settings.get("api_base", "")
            self.api_model = settings.get("api_model", "gpt-3.5-turbo")
            self.api_max_tokens = int(settings.get("api_max_tokens", "1000"))
            
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

        try:
            # 构建提示词
            prompt = self._build_prompt(title, genre, style, requirement)
            
            logger.info(f"开始流式生成小说内容: {title}")
            
            # 调用OpenAI API进行流式生成
            response = await self.client.chat.completions.create(
                model=self.api_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的小说作家，擅长创作各种类型的精彩小说。"},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                temperature=0.8,
                max_tokens=self.api_max_tokens,
            )
            
            # 处理流式响应，支持思维链(Reasoning Content)
            async for chunk in response:
                # 检查是否有思维链内容
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta:
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

    def _build_prompt(self, title: str, genre: str = "", style: str = "", requirement: str = "") -> str:
        """
        构建生成小说的提示词

        Args:
            title: 小说标题
            genre: 小说类型
            style: 写作风格

        Returns:
            str: 构建好的提示词
        """
        prompt = f"请创作一篇中短篇小说，标题为《{title}》"

        if genre:
            prompt += f"，类型为{genre}"

        if style:
            prompt += f"，写作风格为{style}"

        if requirement:
            prompt += f"，要求为:\n{requirement}\n"

        prompt += "。请创作完整的故事情节，包括开端、发展、高潮和结局，确保内容充实完整。直接开始创作，不需要任何前言和后记，只需要小说正文内容。使用txt格式，不要包含markdown格式。"

        logger.info(f"生成小说内容的提示词: {prompt}")

        return prompt

    async def chat_with_ai_stream(
        self,
        user_id: int,
        messages: List[Dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """
        流式与AI进行对话
        
        Args:
            user_id: 用户ID
            messages: 对话历史消息列表
            
        Yields:
            str: AI的回复片段
        """
        # 加载用户设置
        await self.load_user_settings(user_id)

        # 检查客户端是否可用
        if not self.client:
            yield "错误: AI服务未正确配置，请检查您的API设置"
            return
            
        try:
            logger.info("开始流式与AI进行对话")
            
            # 调用OpenAI API进行流式对话
            response = await self.client.chat.completions.create(
                model=self.api_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的小说创作助手，可以帮助用户完善小说情节、角色设定、世界观构建等。"},
                    *messages,
                ],
                stream=True,
                temperature=0.7,
                max_tokens=self.api_max_tokens,
            )
            
            # 处理流式响应，支持思维链(Reasoning Content)
            async for chunk in response:
                # 检查是否有思维链内容
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta:
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
            logger.error(f"流式与AI对话时发生错误: {e}")
            yield f"对话过程中发生错误: {e!s}"

# 创建全局AI服务实例
ai_service = AIService()