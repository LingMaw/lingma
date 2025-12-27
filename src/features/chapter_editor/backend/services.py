"""章节编辑器业务逻辑服务"""
import uuid
import re
from typing import Optional
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from src.features.novel_project.backend.models import Chapter
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_generator.backend.ai import ai_service
from src.features.chapter_editor.backend.schemas import (
    ChapterListItem,
    ChapterDetail,
    OutlineNodeOption,
    ChapterStatusResponse
)
from src.backend.core.exceptions import APIError


class ChapterEditorService:
    """章节编辑器服务"""
    
    @staticmethod
    def calculate_word_count(content: str) -> int:
        """计算字数（移除Markdown标记）
        
        Args:
            content: 章节内容
            
        Returns:
            字数统计
        """
        if not content:
            return 0
        
        # 1. 移除 Markdown 标记符号
        plain_text = content
        plain_text = re.sub(r'[#*_\[\]()]', '', plain_text)  # 移除 Markdown 符号
        plain_text = re.sub(r'```[\s\S]*?```', '', plain_text)  # 移除代码块
        plain_text = re.sub(r'`[^`]*`', '', plain_text)  # 移除行内代码
        
        # 2. 分离中英文计数
        chinese_chars = re.findall(r'[\u4e00-\u9fa5]', plain_text)
        english_words = re.findall(r'[a-zA-Z]+', plain_text)
        
        return len(chinese_chars) + len(english_words)
    
    @staticmethod
    async def get_chapter_list(project_id: int) -> list[ChapterListItem]:
        """获取项目的章节列表
        
        Args:
            project_id: 项目ID
            
        Returns:
            章节列表
        """
        chapters = await Chapter.filter(project_id=project_id).all()
        
        result = []
        for chapter in chapters:
            # 获取关联的大纲节点标题
            outline_title = None
            title = "未命名章节"
            has_outline = False
            
            if chapter.outline_node_id:
                node = await OutlineNode.filter(id=chapter.outline_node_id).first()
                if node:
                    outline_title = node.title
                    title = node.title
                    has_outline = True
            
            # 计算字数
            word_count = ChapterEditorService.calculate_word_count(chapter.content or "")
            
            result.append(ChapterListItem(
                chapter_id=chapter.chapter_id,
                title=title,
                word_count=word_count,
                created_at=chapter.created_at,
                updated_at=chapter.updated_at,
                has_outline=has_outline,
                outline_title=outline_title
            ))
        
        return result
    
    @staticmethod
    async def create_chapter(
        title: str,
        project_id: int,
        outline_node_id: Optional[int] = None
    ) -> ChapterDetail:
        """创建章节（独立创建）
        
        Args:
            title: 章节标题
            project_id: 项目ID
            outline_node_id: 大纲节点ID（可选）
            
        Returns:
            创建的章节详情
            
        Raises:
            HTTPException: 大纲节点不存在或类型错误
        """
        # 验证大纲节点（如果提供）
        outline_title = None
        if outline_node_id:
            node = await OutlineNode.filter(id=outline_node_id).first()
            if not node:
                raise HTTPException(status_code=404, detail="大纲节点不存在")
            if node.node_type != 'chapter':
                raise HTTPException(status_code=400, detail="只能关联 chapter 类型节点")
            outline_title = node.title
        
        # 生成UUID
        chapter_id = str(uuid.uuid4())
        
        # 创建章节
        chapter = await Chapter.create(
            chapter_id=chapter_id,
            title=title,  # 废弃字段，填充默认值
            chapter_number=0,  # 废弃字段，填充默认值
            project_id=project_id,
            outline_node_id=outline_node_id,
            content=""
        )
        
        return ChapterDetail(
            chapter_id=chapter.chapter_id,
            project_id=chapter.project_id,
            title=outline_title or title,
            content="",
            outline_node_id=outline_node_id,
            outline_title=outline_title,
            word_count=0,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        )
    
    @staticmethod
    async def create_from_outline(outline_node_id: int) -> ChapterDetail:
        """从大纲节点创建章节
        
        Args:
            outline_node_id: 大纲节点ID
            
        Returns:
            创建的章节详情
            
        Raises:
            HTTPException: 节点不存在或类型错误
        """
        # 验证节点存在且类型为 chapter
        node = await OutlineNode.filter(id=outline_node_id).first()
        if not node:
            raise HTTPException(status_code=404, detail="大纲节点不存在")
        if node.node_type != 'chapter':
            raise HTTPException(status_code=400, detail="只能从 chapter 类型节点创建章节")
        
        # 生成UUID
        chapter_id = str(uuid.uuid4())
        
        # 创建章节
        chapter = await Chapter.create(
            chapter_id=chapter_id,
            title=node.title,  # 废弃字段，从节点读取
            chapter_number=0,  # 废弃字段
            project_id=node.novel_id,
            outline_node_id=outline_node_id,
            content=node.description or ""  # 使用大纲描述作为初始内容
        )
        
        return ChapterDetail(
            chapter_id=chapter.chapter_id,
            project_id=chapter.project_id,
            title=node.title,
            content=node.description or "",
            outline_node_id=outline_node_id,
            outline_title=node.title,
            word_count=ChapterEditorService.calculate_word_count(node.description or ""),
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        )
    
    @staticmethod
    async def get_chapter_detail(chapter_id: str) -> ChapterDetail:
        """获取章节详情
        
        Args:
            chapter_id: 章节ID
            
        Returns:
            章节详情
            
        Raises:
            HTTPException: 章节不存在
        """
        chapter = await Chapter.filter(chapter_id=chapter_id).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="章节不存在")
        
        # 获取关联的大纲节点标题
        outline_title = None
        title = "未命名章节"
        
        if chapter.outline_node_id:
            node = await OutlineNode.filter(id=chapter.outline_node_id).first()
            if node:
                outline_title = node.title
                title = node.title
        
        word_count = ChapterEditorService.calculate_word_count(chapter.content or "")
        
        return ChapterDetail(
            chapter_id=chapter.chapter_id,
            project_id=chapter.project_id,
            title=title,
            content=chapter.content or "",
            outline_node_id=chapter.outline_node_id,
            outline_title=outline_title,
            word_count=word_count,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        )
    
    @staticmethod
    async def update_chapter(
        chapter_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        outline_node_id: Optional[int] = None
    ) -> ChapterDetail:
        """更新章节内容
        
        Args:
            chapter_id: 章节ID
            title: 章节标题（用于未关联大纲的章节）
            content: 章节内容
            outline_node_id: 大纲节点ID
            
        Returns:
            更新后的章节详情
            
        Raises:
            HTTPException: 章节不存在或节点验证失败
        """
        chapter = await Chapter.filter(chapter_id=chapter_id).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="章节不存在")
        
        # 更新标题（仅当未关联大纲节点时）
        if title is not None and not chapter.outline_node_id:
            chapter.title = title
        
        # 更新内容
        if content is not None:
            chapter.content = content
        
        # 更新大纲关联
        if outline_node_id is not None:
            if outline_node_id > 0:  # 关联节点
                node = await OutlineNode.filter(id=outline_node_id).first()
                if not node:
                    raise HTTPException(status_code=404, detail="大纲节点不存在")
                if node.node_type != 'chapter':
                    raise HTTPException(status_code=400, detail="只能关联 chapter 类型节点")
                chapter.outline_node_id = outline_node_id
            else:  # 解除关联
                chapter.outline_node_id = None
        
        await chapter.save()
        
        return await ChapterEditorService.get_chapter_detail(chapter_id)
    
    @staticmethod
    async def delete_chapter(chapter_id: str) -> None:
        """删除章节
        
        Args:
            chapter_id: 章节ID
            
        Raises:
            HTTPException: 章节不存在
        """
        chapter = await Chapter.filter(chapter_id=chapter_id).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="章节不存在")
        
        await chapter.delete()
    
    @staticmethod
    async def generate_content_stream(
        chapter_id: str,
        prompt: str,
        use_outline_context: bool
    ) -> StreamingResponse:
        """AI生成章节内容（流式）
        
        Args:
            chapter_id: 章节ID
            prompt: 用户提示词
            use_outline_context: 是否使用大纲上下文
            
        Returns:
            SSE流式响应
            
        Raises:
            HTTPException: 章节不存在或未关联大纲节点
        """
        chapter = await Chapter.filter(chapter_id=chapter_id).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="章节不存在")
        
        # 构建上下文
        context = prompt
        if use_outline_context and chapter.outline_node_id:
            node = await OutlineNode.filter(id=chapter.outline_node_id).first()
            if node:
                context = f"章节标题：{node.title}\n"
                if node.description:
                    context += f"大纲描述：{node.description}\n"
                
                # 获取 section 提示
                sections = await OutlineNode.filter(
                    parent_id=node.id,
                    node_type='section'
                ).order_by('position').all()
                
                if sections:
                    context += "\n小节大纲：\n"
                    for section in sections:
                        context += f"- {section.title}"
                        if section.description:
                            context += f": {section.description}"
                        context += "\n"
                
                context += f"\n用户需求：{prompt}"

        # 调用AI服务生成内容
        async def generate_stream():
            # 获取章节标题
            title = "未命名章节"
            if chapter.outline_node_id:
                node = await OutlineNode.filter(id=chapter.outline_node_id).first()
                if node:
                    title = node.title
            
            async for chunk in ai_service.generate_novel_content_stream(
                user_id=1,  # TODO: 获取当前用户ID
                title=title,
                genre="",
                style="",
                requirement=context
            ):
                yield chunk
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    
    @staticmethod
    async def get_available_outline_nodes(project_id: int) -> list[OutlineNodeOption]:
        """获取可关联的大纲节点
        
        Args:
            project_id: 项目ID
            
        Returns:
            大纲节点选项列表
        """
        # 仅获取 chapter 类型节点
        nodes = await OutlineNode.filter(
            novel_id=project_id,
            node_type='chapter'
        ).order_by('position').all()
        
        result = []
        for node in nodes:
            # 构建完整路径
            path_parts = [node.title]
            parent_id = node.parent_id
            
            while parent_id:
                parent = await OutlineNode.filter(id=parent_id).first()
                if parent:
                    path_parts.insert(0, parent.title)
                    parent_id = parent.parent_id
                else:
                    break
            
            path = " > ".join(path_parts)
            
            # 检查是否已被关联
            has_chapter = await Chapter.filter(outline_node_id=node.id).exists()
            
            result.append(OutlineNodeOption(
                id=node.id,
                title=node.title,
                path=path,
                has_chapter=has_chapter
            ))
        
        return result
    
    @staticmethod
    async def get_chapter_status(node_id: int) -> ChapterStatusResponse:
        """检查节点章节状态（用于大纲页面）
        
        Args:
            node_id: 节点ID
            
        Returns:
            章节状态
        """
        chapter = await Chapter.filter(outline_node_id=node_id).first()
        
        if chapter:
            return ChapterStatusResponse(
                has_chapter=True,
                chapter_id=chapter.chapter_id
            )
        else:
            return ChapterStatusResponse(
                has_chapter=False,
                chapter_id=None
            )
