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
                    {"role": "system", "content": "你是一个专业的短篇小说作家，擅长创作1000-5000字的精彩短篇小说。你的作品结构紧凑、情节精练、人物鲜明、主题深刺。"},
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
    ) -> AsyncGenerator[str, None]:
        """
        通用流式内容生成方法
        
        Args:
            user_id: 用户ID
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            temperature: 温度参数（0-1），控制创造性
            
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
                temperature=temperature,
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
            logger.error(f"流式生成内容时发生错误: {e}")
            yield f"生成过程中发生错误: {e!s}"

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
                    {"role": "system", "content": "你是一个专业的短篇小说创作助手，可以帮助用户完善小说情节、角色设定、世界观构建等。特别擅长帮助创作1000-5000字的短篇小说。"},
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
