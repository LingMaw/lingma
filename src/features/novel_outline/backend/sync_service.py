"""章节同步服务

封装 OutlineNode 与 Chapter 的同步逻辑,确保两个系统数据一致性。
"""
import uuid
from typing import Optional
from tortoise.transactions import in_transaction

from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_project.backend.models import Chapter
from src.backend.core.exceptions import APIError
from src.backend.core.logger import logger


class ChapterSyncService:
    """章节同步服务（优化后）
    
    职责:
    - 创建 chapter 节点时自动生成 Chapter 记录
    - 删除节点时同步删除关联的 Chapter 记录（如数据库支持外键级联删除则可废弃）
    - 提取 section 节点内容用于 AI 生成
    
    已移除的功能（阶段三优化）:
    - ❌ sync_on_update: 不再同步标题（改为从 OutlineNode 读取）
    - ❌ recalculate_all_numbers: 不再预计算编号（改为运行时计算）
    """
    
    @staticmethod
    async def sync_on_create(node: OutlineNode) -> Optional[Chapter]:
        """创建 chapter 节点时自动生成 Chapter 记录
        
        Args:
            node: 刚创建的 OutlineNode,必须是 chapter 类型
            
        Returns:
            创建的 Chapter 记录,如果不是 chapter 类型则返回 None
            
        Raises:
            APIError: 创建 Chapter 失败时
        """
        # 只处理 chapter 类型节点
        if node.node_type != 'chapter':
            return None
        
        try:
            # 生成章节 UUID
            chapter_id = str(uuid.uuid4())
            
            # 创建 Chapter 记录（为兼容性仍填充废弃字段，待数据库迁移后移除）
            chapter = await Chapter.create(
                chapter_id=chapter_id,
                outline_node_id=node.id,  # 必填字段
                content="",  # 初始为空,后续通过 AI 生成
                # ✨ 为兼容性仍填充废弃字段（待数据库schema更新后移除）
                title="",  # 废弃字段，但数据库要求NOT NULL
                chapter_number=0,  # 废弃字段，但数据库要求NOT NULL
                project_id=node.novel_id,  # 废弃字段，但数据库要求NOT NULL
            )
            
            logger.info(f"同步创建 Chapter: {chapter.id} (chapter_id={chapter_id}) for OutlineNode: {node.id}")
            return chapter
            
        except Exception as e:
            logger.error(f"创建 Chapter 失败 for OutlineNode {node.id}: {e}")
            raise APIError(
                code="CHAPTER_CREATE_FAILED",
                message=f"创建章节记录失败: {str(e)}",
                status_code=500
            ) from e
    
    # ❌ 已删除 sync_on_update 方法（不再同步标题）
    # 标题统一从 OutlineNode 读取，Chapter 不再存储冗余的 title 字段
    
    @staticmethod
    async def sync_on_delete(node: OutlineNode) -> None:
        """删除节点时同步删除关联的 Chapter 记录
        
        由于 SQLite 不支持 ALTER TABLE ADD CONSTRAINT,
        外键级联删除需要在应用层实现。
        
        Args:
            node: 将要删除的 OutlineNode
        """
        # 只处理 chapter 类型节点
        if node.node_type != 'chapter':
            return
        
        # 删除关联的 Chapter 记录
        deleted_count = await Chapter.filter(outline_node_id=node.id).delete()
        
        if deleted_count > 0:
            logger.info(f"同步删除 Chapter 记录: {deleted_count} 条 for OutlineNode: {node.id}")
    
    # ❌ 已删除 recalculate_all_numbers 方法（改为运行时计算）
    # 章节编号不再预存储，而是在查询时基于 OutlineNode.position 动态计算
    # 详见 ChapterQueryService.list_chapters_by_project() 和 get_chapter_with_metadata()
    
    @staticmethod
    async def get_section_hints(chapter_node_id: int) -> dict:
        """获取章节下所有 section 的内容提示
        
        用于 AI 生成章节内容时作为参考。
        
        Args:
            chapter_node_id: chapter 节点ID
            
        Returns:
            包含章节标题、描述和 section 列表的字典
        """
        # 获取 chapter 节点
        chapter_node = await OutlineNode.filter(
            id=chapter_node_id,
            node_type='chapter'
        ).first()
        
        if not chapter_node:
            raise APIError(
                code="NODE_NOT_FOUND",
                message=f"章节节点不存在: {chapter_node_id}",
                status_code=404
            )
        
        # 获取所有子 section 节点
        section_nodes = await OutlineNode.filter(
            parent_id=chapter_node_id,
            node_type='section'
        ).order_by('position').all()
        
        # 构建结构化数据
        return {
            "chapter_title": chapter_node.title,
            "chapter_description": chapter_node.description or "",
            "sections": [
                {
                    "title": section.title,
                    "description": section.description or "",
                    "position": section.position
                }
                for section in section_nodes
            ]
        }
    
    # ❌ 已删除 _calculate_chapter_number 辅助方法（不再需要）
