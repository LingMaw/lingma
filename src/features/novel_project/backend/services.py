"""章节相关业务服务

封装章节绑定查询和AI生成的核心逻辑
"""
import json
from typing import AsyncGenerator, Optional

from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_outline.backend.sync_service import ChapterSyncService
from src.features.novel_project.backend.models import Chapter
from src.features.novel_project.backend.schemas import (
    OutlineChapterInfo,
    OutlineChapterListResponse,
    ChapterWithMetadata,
    ChapterListItem,
    OutlineNodeResponse,
)
from src.features.novel_generator.backend.ai import AIService
from src.backend.core.exceptions import APIError
from src.backend.core.logger import logger


class OutlineChapterQueryService:
    """大纲章节查询服务
    
    职责：
    - 查询项目下所有chapter类型的OutlineNode
    - 检查每个节点的绑定状态（是否已被Chapter引用）
    - 返回结构化的节点列表供前端选择器使用
    """
    
    @staticmethod
    async def get_outline_chapters(project_id: int) -> OutlineChapterListResponse:
        """查询项目下的chapter节点及绑定状态
        
        Args:
            project_id: 项目ID
            
        Returns:
            OutlineChapterListResponse: 包含章节节点列表和总数
        """
        try:
            # 查询所有chapter类型节点，按position排序
            chapter_nodes = await OutlineNode.filter(
                novel_id=project_id,
                node_type='chapter'
            ).order_by('position').all()
            
            # 构建返回数据
            items = []
            for node in chapter_nodes:
                # 查询该节点是否已被Chapter绑定
                bound_chapter = await Chapter.filter(outline_node_id=node.id).first()
                
                items.append(OutlineChapterInfo(
                    id=node.id,
                    title=node.title,
                    description=node.description,
                    is_bound=bound_chapter is not None,
                    bound_chapter_id=bound_chapter.chapter_id if bound_chapter else None,
                    bound_chapter_number=bound_chapter.chapter_number if bound_chapter else None
                ))
            
            logger.info(f"查询项目 {project_id} 的 {len(items)} 个chapter节点")
            return OutlineChapterListResponse(total=len(items), items=items)
            
        except Exception as e:
            logger.error(f"查询大纲章节失败 for project {project_id}: {e}")
            raise APIError(
                code="QUERY_OUTLINE_CHAPTERS_FAILED",
                message=f"查询大纲章节失败: {str(e)}",
                status_code=500
            ) from e


class ChapterAIGenerationService:
    """章节AI生成服务
    
    职责：
    - 加载大纲节点信息（标题、描述）
    - 调用ChapterSyncService.get_section_hints()获取小节提示
    - 构建分层Prompt（大纲上下文 + 小节提示 + 用户参数）
    - 调用AIService流式生成章节内容
    """
    
    def __init__(self, ai_service: AIService):
        """初始化
        
        Args:
            ai_service: AI服务实例
        """
        self.ai_service = ai_service
    
    async def generate_chapter_stream(
        self,
        chapter_id: str,
        project_id: int,
        outline_node_id: Optional[int],
        genre: Optional[str],
        style: Optional[str],
        requirement: Optional[str],
        use_sections: bool = True
    ) -> AsyncGenerator[str, None]:
        """流式生成章节内容
        
        Args:
            chapter_id: 章节UUID
            project_id: 项目ID
            outline_node_id: 大纲节点ID（可选）
            genre: 小说类型
            style: 写作风格
            requirement: 额外要求
            use_sections: 是否使用小节提示
            
        Yields:
            JSON格式的响应块字符串
            
        Raises:
            APIError: 生成失败时
        """
        try:
            # 1. 查询章节记录
            chapter = await Chapter.filter(
                chapter_id=chapter_id,
                project_id=project_id
            ).first()
            
            if not chapter:
                raise APIError(
                    code="CHAPTER_NOT_FOUND",
                    message=f"章节不存在: {chapter_id}",
                    status_code=404
                )
            
            # 2. 确定使用的大纲节点ID
            node_id = outline_node_id or chapter.outline_node_id
            
            # 3. 构建Prompt
            prompt = await self._build_prompt(
                chapter_title=chapter.title,
                outline_node_id=node_id,
                genre=genre,
                style=style,
                requirement=requirement,
                use_sections=use_sections
            )
            
            logger.info(f"开始生成章节内容: {chapter_id}, Prompt长度: {len(prompt)}")
            
            # 4. 调用AI服务流式生成
            total_content = ""
            async for chunk in self.ai_service.generate_novel_content_stream(prompt):
                total_content += chunk
                yield json.dumps({
                    "type": "chunk",
                    "content": chunk
                }, ensure_ascii=False) + "\n"
            
            # 5. 返回完成标记
            yield json.dumps({
                "type": "done",
                "total_tokens": len(total_content)
            }, ensure_ascii=False) + "\n"
            
            logger.info(f"章节内容生成完成: {chapter_id}, 总字数: {len(total_content)}")
            
        except APIError:
            raise
        except Exception as e:
            logger.error(f"生成章节内容失败 for chapter {chapter_id}: {e}")
            yield json.dumps({
                "type": "error",
                "error_message": str(e)
            }, ensure_ascii=False) + "\n"
    
    async def _build_prompt(
        self,
        chapter_title: str,
        outline_node_id: Optional[int],
        genre: Optional[str],
        style: Optional[str],
        requirement: Optional[str],
        use_sections: bool
    ) -> str:
        """构建AI生成的Prompt
        
        Args:
            chapter_title: 章节标题
            outline_node_id: 大纲节点ID
            genre: 小说类型
            style: 写作风格
            requirement: 额外要求
            use_sections: 是否使用小节提示
            
        Returns:
            构建好的Prompt字符串
        """
        # 基础Prompt
        prompt_parts = [
            f"请创作一篇小说章节，标题为：《{chapter_title}》\n"
        ]
        
        # 如果有绑定大纲节点，加载大纲信息
        if outline_node_id:
            try:
                # 获取节点信息
                node = await OutlineNode.get(id=outline_node_id)
                
                prompt_parts.append(f"\n【章节标题】{node.title}")
                
                if node.description:
                    prompt_parts.append(f"【章节描述】{node.description}")
                
                # 如果使用小节提示，获取section信息
                if use_sections:
                    section_hints = await ChapterSyncService.get_section_hints(outline_node_id)
                    sections = section_hints.get("sections", [])
                    
                    if sections:
                        prompt_parts.append("\n【小节提示】")
                        for idx, section in enumerate(sections, start=1):
                            prompt_parts.append(f"{idx}. {section['title']}")
                            if section['description']:
                                prompt_parts.append(f"   内容要点：{section['description']}")
                
            except Exception as e:
                logger.warning(f"加载大纲信息失败 for node {outline_node_id}: {e}")
                # 即使加载失败也继续生成，只是没有大纲上下文
        
        # 添加创作要求
        if genre or style or requirement:
            prompt_parts.append("\n【创作要求】")
            if genre:
                prompt_parts.append(f"- 小说类型：{genre}")
            if style:
                prompt_parts.append(f"- 写作风格：{style}")
            if requirement:
                prompt_parts.append(f"- 额外要求：{requirement}")
        
        prompt_parts.append("\n请开始创作章节内容：")
        
        return "\n".join(prompt_parts)


async def validate_outline_node_binding(
    outline_node_id: int,
    project_id: int,
    current_chapter_id: Optional[str] = None
) -> None:
    """验证大纲节点绑定的有效性
    
    Args:
        outline_node_id: 大纲节点ID
        project_id: 项目ID
        current_chapter_id: 当前章节ID（用于更新时排除自身）
        
    Raises:
        APIError: 验证失败时
    """
    # 1. 检查节点是否存在且属于当前项目
    node = await OutlineNode.filter(
        id=outline_node_id,
        novel_id=project_id
    ).first()
    
    if not node:
        raise APIError(
            code="OUTLINE_NODE_NOT_FOUND",
            message=f"大纲节点不存在或不属于当前项目: {outline_node_id}",
            status_code=404
        )
    
    # 2. 检查节点类型是否为chapter
    if node.node_type != 'chapter':
        raise APIError(
            code="INVALID_NODE_TYPE",
            message="只能绑定章节类型的大纲节点",
            status_code=400
        )
    
    # 3. 检查节点是否已被其他章节绑定（排除当前章节自身）
    query = Chapter.filter(outline_node_id=outline_node_id)
    if current_chapter_id:
        query = query.exclude(chapter_id=current_chapter_id)
    
    bound_chapter = await query.first()
    
    if bound_chapter:
        raise APIError(
            code="NODE_ALREADY_BOUND",
            message=f"该大纲节点已被章节 #{bound_chapter.chapter_number} 绑定",
            status_code=409
        )


class ChapterQueryService:
    """章节查询服务（运行时计算编号）
    
    职责：
    - 查询章节列表（按大纲顺序排序）
    - 运行时计算章节编号（基于 OutlineNode.position）
    - 从 OutlineNode 读取标题信息
    """
    
    @staticmethod
    async def get_chapter_with_metadata(chapter_id: str) -> ChapterWithMetadata:
        """获取章节完整信息
        
        Args:
            chapter_id: 章节UUID
            
        Returns:
            包含运行时计算编号和标题的完整章节信息
            
        Raises:
            APIError: 章节不存在时
        """
        # 1. 查询 Chapter 记录
        chapter = await Chapter.filter(chapter_id=chapter_id).first()
        if not chapter:
            raise APIError(
                code="CHAPTER_NOT_FOUND",
                message=f"章节不存在: {chapter_id}",
                status_code=404
            )
        
        # 2. 查询关联的 OutlineNode
        node = await OutlineNode.get(id=chapter.outline_node_id)
        
        # 3. 计算章节编号（统计 position 小于等于当前节点的 chapter 数量）
        chapter_number = await OutlineNode.filter(
            novel_id=node.novel_id,
            node_type='chapter',
            position__lte=node.position
        ).count()
        
        # 4. 组装响应
        return ChapterWithMetadata(
            chapter_id=chapter.chapter_id,
            chapter_number=chapter_number,
            title=node.title,  # 从 OutlineNode 读取
            content=chapter.content or "",
            outline_node=OutlineNodeResponse.model_validate(node),
            created_at=chapter.created_at,
            updated_at=chapter.updated_at
        )
    
    @staticmethod
    async def list_chapters_by_project(project_id: int) -> list[ChapterListItem]:
        """查询项目所有章节（按大纲顺序）
        
        实现逻辑：
        1. 查询所有 chapter 类型节点，按 position 排序
        2. JOIN Chapter 表获取内容
        3. 运行时计算编号（enumerate 排序后的列表）
        
        Args:
            project_id: 项目ID
            
        Returns:
            章节列表（按大纲顺序）
        """
        # 1. 查询所有 chapter 节点
        chapter_nodes = await OutlineNode.filter(
            novel_id=project_id,
            node_type='chapter'
        ).order_by('position').all()
        
        if not chapter_nodes:
            return []
        
        # 2. 批量查询关联的 Chapter 记录（优化 N+1 查询）
        node_ids = [node.id for node in chapter_nodes]
        chapters = await Chapter.filter(
            outline_node_id__in=node_ids
        ).all()
        
        # 3. 构建映射关系
        chapter_map = {ch.outline_node_id: ch for ch in chapters}
        
        # 4. 组装响应（运行时计算编号）
        result = []
        for index, node in enumerate(chapter_nodes, start=1):
            chapter = chapter_map.get(node.id)
            
            result.append(ChapterListItem(
                chapter_id=chapter.chapter_id if chapter else "",
                chapter_number=index,  # 运行时计算
                title=node.title,  # 从 OutlineNode 读取
                content_preview=(chapter.content or "")[:100] if chapter else "",
                outline_node_id=node.id,
                status=node.status
            ))
        
        logger.info(f"查询项目 {project_id} 的 {len(result)} 个章节（运行时计算编号）")
        return result
