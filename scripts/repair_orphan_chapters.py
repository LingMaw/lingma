"""修复孤立的 Chapter 记录

功能：
1. 检查 outline_node_id 为 NULL 的章节
2. 检查 outline_node_id 指向不存在节点的章节
3. 提供修复策略选择
"""
import asyncio
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.backend.config.database import init_db, close_db
from src.features.novel_project.backend.models import Chapter
from src.features.novel_outline.backend.models import OutlineNode
from src.backend.core.logger import logger


async def check_orphan_chapters():
    """检查孤立的 Chapter 记录"""
    logger.info("=" * 60)
    logger.info("开始检查孤立的 Chapter 记录")
    logger.info("=" * 60)
    
    # 1. 查找 outline_node_id 为 NULL 的章节
    null_chapters = await Chapter.filter(outline_node_id__isnull=True).all()
    logger.info(f"\n发现 {len(null_chapters)} 个 outline_node_id 为 NULL 的章节")
    
    # 2. 查找 outline_node_id 指向不存在节点的章节
    all_chapters = await Chapter.all()
    invalid_chapters = []
    
    for chapter in all_chapters:
        if chapter.outline_node_id:
            node_exists = await OutlineNode.filter(id=chapter.outline_node_id).exists()
            if not node_exists:
                invalid_chapters.append(chapter)
    
    logger.info(f"发现 {len(invalid_chapters)} 个指向无效节点的章节")
    
    orphan_chapters = null_chapters + invalid_chapters
    
    if not orphan_chapters:
        logger.info("\n✅ 数据完整性检查通过，未发现孤立章节")
        return []
    
    # 显示孤立章节详情
    logger.info(f"\n总计发现 {len(orphan_chapters)} 个孤立章节：")
    logger.info("-" * 60)
    for idx, chapter in enumerate(orphan_chapters, 1):
        logger.info(f"{idx}. 章节ID: {chapter.chapter_id}")
        logger.info(f"   标题: {chapter.title}")
        logger.info(f"   项目ID: {chapter.project_id}")
        logger.info(f"   outline_node_id: {chapter.outline_node_id}")
        logger.info("-" * 60)
    
    return orphan_chapters


async def repair_strategy_1(orphan_chapters):
    """策略1：为孤立章节自动创建 OutlineNode"""
    logger.info("\n执行策略1：为孤立章节创建 OutlineNode")
    
    created_count = 0
    for chapter in orphan_chapters:
        try:
            # 创建对应的 OutlineNode
            node = await OutlineNode.create(
                novel_id=chapter.project_id,
                parent_id=None,
                node_type='chapter',
                title=chapter.title or f"章节 {chapter.chapter_number}",
                position=chapter.chapter_number - 1 if chapter.chapter_number else 0,
                status='draft',
                description=chapter.outline_description or ""
            )
            
            # 更新章节关联
            chapter.outline_node_id = node.id
            await chapter.save()
            
            logger.info(f"✅ 为章节 {chapter.chapter_id} 创建了节点 {node.id}")
            created_count += 1
            
        except Exception as e:
            logger.error(f"❌ 处理章节 {chapter.chapter_id} 失败: {e}")
    
    logger.info(f"\n修复完成：成功创建 {created_count} 个 OutlineNode")


async def repair_strategy_2(orphan_chapters):
    """策略2：删除所有孤立章节"""
    logger.info("\n执行策略2：删除所有孤立章节")
    
    deleted_count = 0
    for chapter in orphan_chapters:
        try:
            logger.info(f"删除章节: {chapter.chapter_id} - {chapter.title}")
            await chapter.delete()
            deleted_count += 1
        except Exception as e:
            logger.error(f"❌ 删除章节 {chapter.chapter_id} 失败: {e}")
    
    logger.info(f"\n删除完成：成功删除 {deleted_count} 个孤立章节")


async def repair_strategy_3(orphan_chapters):
    """策略3：生成报告，手动处理"""
    logger.info("\n执行策略3：生成详细报告")
    
    report_path = project_root / "orphan_chapters_report.txt"
    
    with report_path.open("w", encoding="utf-8") as f:
        f.write("孤立章节修复报告\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"发现 {len(orphan_chapters)} 个孤立章节\n\n")
        
        for idx, chapter in enumerate(orphan_chapters, 1):
            f.write(f"--- 章节 {idx} ---\n")
            f.write(f"章节ID: {chapter.chapter_id}\n")
            f.write(f"标题: {chapter.title}\n")
            f.write(f"项目ID: {chapter.project_id}\n")
            f.write(f"章节编号: {chapter.chapter_number}\n")
            f.write(f"outline_node_id: {chapter.outline_node_id}\n")
            f.write(f"创建时间: {chapter.created_at}\n")
            f.write(f"更新时间: {chapter.updated_at}\n")
            f.write("-" * 80 + "\n\n")
    
    logger.info(f"✅ 报告已生成: {report_path}")
    logger.info("请手动检查报告并决定如何处理这些孤立章节")


async def main():
    """主函数"""
    try:
        # 初始化数据库
        await init_db()
        logger.info("✅ 数据库连接成功\n")
        
        # 检查孤立章节
        orphan_chapters = await check_orphan_chapters()
        
        if not orphan_chapters:
            return
        
        # 选择修复策略
        print("\n" + "=" * 60)
        print("修复策略选择：")
        print("1. 为孤立章节自动创建 OutlineNode")
        print("2. 删除所有孤立章节")
        print("3. 生成报告，手动处理")
        print("0. 退出（不做任何修改）")
        print("=" * 60)
        
        choice = input("\n请选择策略 (0/1/2/3): ").strip()
        
        if choice == "1":
            confirm = input(f"\n⚠️  将为 {len(orphan_chapters)} 个章节创建 OutlineNode，确认？(yes/no): ")
            if confirm.lower() == "yes":
                await repair_strategy_1(orphan_chapters)
            else:
                logger.info("操作已取消")
        
        elif choice == "2":
            confirm = input(f"\n⚠️  将删除 {len(orphan_chapters)} 个孤立章节，确认？(yes/no): ")
            if confirm.lower() == "yes":
                await repair_strategy_2(orphan_chapters)
            else:
                logger.info("操作已取消")
        
        elif choice == "3":
            await repair_strategy_3(orphan_chapters)
        
        elif choice == "0":
            logger.info("退出脚本")
        
        else:
            logger.warning("无效选择，退出")
    
    except Exception as e:
        logger.error(f"执行失败: {e}")
        raise
    
    finally:
        await close_db()
        logger.info("\n✅ 数据库连接已关闭")


if __name__ == "__main__":
    asyncio.run(main())
