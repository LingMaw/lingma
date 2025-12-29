"""
章节同步服务
负责大纲节点和章节记录之间的数据同步
"""

import uuid

from loguru import logger
from tortoise.exceptions import DoesNotExist

from src.features.chapter.backend.models import Chapter
from src.features.novel_outline.backend.models import OutlineNode


class ChapterSyncService:
    """
    章节同步服务
    监听大纲变更，自动同步到章节系统
    """

    @staticmethod
    async def sync_on_create(outline_node: OutlineNode) -> Chapter | None:
        """
        大纲节点创建时同步
        仅chapter类型节点创建对应的Chapter记录
        
        Args:
            outline_node: 大纲节点实例
            
        Returns:
            Chapter | None: 创建的章节记录（如果是chapter类型），否则返回None
        """
        if outline_node.node_type != "chapter":
            return None

        try:
            # 创建章节记录
            chapter = await Chapter.create(
                uuid=uuid.uuid4(),
                project_id=outline_node.project_id,
                outline_node_id=outline_node.id,
                title=outline_node.title,
                chapter_number=0,  # 临时编号，后续重算
                content="",
                word_count=0,
                status="draft",
            )

            # 重新计算所有章节编号
            await ChapterSyncService.recalculate_all_numbers(outline_node.project_id)

            logger.info(
                f"同步创建章节: {chapter.id} - {chapter.title} (关联大纲节点 {outline_node.id})",
            )

        except Exception as e:
            logger.error(f"同步创建章节失败: {e}")
            raise
        return chapter

    @staticmethod
    async def sync_on_update(outline_node: OutlineNode) -> None:
        """
        大纲节点更新时同步
        仅更新chapter类型节点对应的章节标题
        
        Args:
            outline_node: 大纲节点实例
        """
        if outline_node.node_type != "chapter":
            return

        try:
            chapter = await Chapter.get_or_none(outline_node_id=outline_node.id)
            if chapter:
                chapter.title = outline_node.title
                await chapter.save()
                logger.info(f"同步更新章节: {chapter.id} - {chapter.title}")

        except Exception as e:
            logger.error(f"同步更新章节失败: {e}")
            raise

    @staticmethod
    async def sync_on_delete(outline_node_id: int) -> None:
        """
        大纲节点删除时同步
        数据库外键ON DELETE SET NULL自动处理
        这里可以选择删除孤立章节或保留
        
        Args:
            outline_node_id: 被删除的大纲节点ID
        """
        # 当前策略：保留章节，将outline_node_id设为null（由数据库外键自动处理）
        # 未来可以添加配置选项：是否自动删除孤立章节
        logger.info(f"大纲节点 {outline_node_id} 已删除，关联章节的outline_node_id已设为null")

    @staticmethod
    async def recalculate_all_numbers(project_id: int) -> None:
        """
        重新计算项目的所有章节编号
        基于大纲节点的position顺序，全局连续编号（1-based）
        需要先按父节点（卷）的position排序，再按章节自己的position排序
        
        Args:
            project_id: 项目ID
        """
        try:
            # 获取所有chapter类型的大纲节点
            chapter_nodes = (
                await OutlineNode.filter(project_id=project_id, node_type="chapter")
                .prefetch_related("parent")
                .all()
            )
            
            # 手动排序：先按父节点的position，再按自己的position
            # 这样可以确保跨卷的章节顺序正确
            sorted_nodes = sorted(
                chapter_nodes,
                key=lambda node: (
                    node.parent.position if node.parent else 0,
                    node.position,
                ),
            )

            # 按顺序更新关联的章节编号
            for idx, node in enumerate(sorted_nodes, start=1):
                chapter = await Chapter.get_or_none(outline_node_id=node.id)
                if chapter:
                    chapter.chapter_number = idx
                    await chapter.save(update_fields=["chapter_number"])

            logger.info(f"重新计算章节编号完成: 项目 {project_id}, 共 {len(sorted_nodes)} 个章节")

        except Exception as e:
            logger.error(f"重新计算章节编号失败: {e}")
            raise

    @staticmethod
    async def get_section_hints(chapter_node_id: int) -> dict:
        """
        获取章节下的section节点作为写作提纲
        用于AI生成章节内容时参考
        
        Args:
            chapter_node_id: 章节类型的大纲节点ID
            
        Returns:
            dict: {"sections": [{"title": str, "description": str}, ...]}
        """
        try:
            sections = (
                await OutlineNode.filter(
                    parent_id=chapter_node_id, node_type="section",
                )
                .order_by("position")
                .all()
            )

            return {
                "sections": [
                    {"title": s.title, "description": s.description} for s in sections
                ],
            }

        except Exception as e:
            logger.error(f"获取section提纲失败: {e}")
            raise

    @staticmethod
    async def recalculate_positions(project_id: int, parent_id: int | None = None) -> None:
        """
        重新计算指定父节点下所有子节点的position
        确保position连续（0, 1, 2, ...）
        
        Args:
            project_id: 项目ID
            parent_id: 父节点ID（None表示根节点）
        """
        try:
            # 获取所有同级节点（按当前position排序）
            siblings = (
                await OutlineNode.filter(project_id=project_id, parent_id=parent_id)
                .order_by("position")
                .all()
            )

            # 重新分配position
            for idx, node in enumerate(siblings):
                if node.position != idx:
                    node.position = idx
                    await node.save(update_fields=["position"])

            logger.debug(f"重新计算position完成: parent_id={parent_id}, 共 {len(siblings)} 个节点")

        except Exception as e:
            logger.error(f"重新计算position失败: {e}")
            raise
