"""
仪表盘API路由
提供统计信息等接口
"""

import platform
from datetime import datetime
from pathlib import Path

import psutil
from fastapi import APIRouter, Request
from tortoise import Tortoise

from src.backend.core.dependencies import CurrentUserId

from .schemas import (
    AppOverviewResponse,
    NovelStatistics,
    RecentProjectItem,
    RecentProjectsResponse,
    SystemInfoResponse,
    SystemInfoSummary,
    SystemResource,
)

router = APIRouter()


def get_size_str(bytes_value: int) -> str:
    """将字节转换为可读字符串"""
    num = float(bytes_value)
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} PB"


@router.get("/overview", response_model=AppOverviewResponse)
async def get_app_overview(_user_id: CurrentUserId, request: Request):
    """
    获取应用概览信息 (真实元数据)
    """
    # 1. 获取 API 路由数量
    # 过滤掉 OPTIONS 请求和自动生成的文档路由
    routes = [
        r
        for r in request.app.routes
        if getattr(r, "methods", None) and "OPTIONS" not in r.methods
    ]
    api_count = len(routes)

    # 2. 获取 Features 数量
    features_dir = Path("src/features")
    feature_count = 0
    if features_dir.exists():
        feature_count = len(
            [
                d
                for d in features_dir.iterdir()
                if d.is_dir() and not d.name.startswith("__")
            ],
        )

    # 3. 检查数据库连接
    try:
        conn = Tortoise.get_connection("default")
        await conn.execute_query("SELECT 1")
        db_status = "Connected"
    except Exception:
        db_status = "Disconnected"

    # 4. 环境
    # 简单判断 debug 模式
    env = "Development"  # 可以从配置中读取，这里作为模板默认显示 Dev

    # 5. 获取小说项目统计数据
    from src.features.chapter.backend.models import Chapter
    from src.features.novel_outline.backend.models import OutlineNode
    from src.features.novel_project.backend.models import NovelProject

    project_count = await NovelProject.all().count()
    chapter_count = await Chapter.all().count()
    outline_node_count = await OutlineNode.all().count()

    # 计算总字数：项目内容 + 章节内容
    projects = await NovelProject.all()
    chapters = await Chapter.all()
    total_words = sum(p.word_count for p in projects) + sum(c.word_count for c in chapters)

    novel_stats = NovelStatistics(
        project_count=project_count,
        chapter_count=chapter_count,
        outline_node_count=outline_node_count,
        total_words=total_words,
    )

    return AppOverviewResponse(
        api_count=api_count,
        feature_count=feature_count,
        db_status=db_status,
        environment=env,
        novel_stats=novel_stats,
    )


@router.get("/system", response_model=SystemInfoResponse)
async def get_system_info(_user_id: CurrentUserId):
    """
    获取系统状态信息 (真实数据)
    """
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_count = psutil.cpu_count(logical=True)
    cpu_freq = psutil.cpu_freq()
    cpu_freq_current = f"{cpu_freq.current / 1000:.1f} GHz" if cpu_freq else "N/A"

    # Memory
    vm = psutil.virtual_memory()

    # Disk
    disk = psutil.disk_usage("/")

    # Uptime
    boot_time_timestamp = psutil.boot_time()
    boot_time = datetime.fromtimestamp(boot_time_timestamp)
    uptime_delta = datetime.now() - boot_time
    uptime_seconds = uptime_delta.total_seconds()

    days = uptime_delta.days
    hours, remainder = divmod(uptime_delta.seconds, 3600)
    minutes, _ = divmod(remainder, 60)

    uptime_str = (
        f"{days}天 {hours}小时 {minutes}分钟"
        if days > 0
        else f"{hours}小时 {minutes}分钟"
    )

    return SystemInfoResponse(
        cpu=SystemResource(
            name=platform.processor() or "Generic CPU",
            usage=cpu_percent,
            total=f"{cpu_count} Cores",
            used=cpu_freq_current,
        ),
        memory=SystemResource(
            name="System Memory",
            usage=vm.percent,
            total=get_size_str(vm.total),
            used=get_size_str(vm.used),
        ),
        disk=SystemResource(
            name="Root Partition",
            usage=disk.percent,
            total=get_size_str(disk.total),
            used=get_size_str(disk.used),
        ),
        uptime=uptime_str,
        uptime_seconds=uptime_seconds,
        version="v1.0.0",
        os=f"{platform.system()} {platform.release()}",
    )


@router.get("/recent-projects", response_model=RecentProjectsResponse)
async def get_recent_projects(user_id: CurrentUserId):
    """
    获取最近更新的项目列表（按更新时间倒序）
    """
    from src.features.chapter.backend.models import Chapter
    from src.features.novel_project.backend.models import NovelProject

    # 查询用户的项目，按更新时间倒序，限制6条
    projects = (
        await NovelProject.filter(user_id=user_id)
        .order_by("-updated_at")
        .limit(6)
    )

    total_count = await NovelProject.filter(user_id=user_id).count()

    # 生成封面颜色（基于项目ID的简单哈希）
    color_palette = [
        "#667eea",  # 紫色
        "#3b82f6",  # 蓝色
        "#10b981",  # 绿色
        "#f59e0b",  # 橙色
        "#ef4444",  # 红色
        "#8b5cf6",  # 紫罗兰
    ]

    items = []
    for project in projects:
        # 统计章节数量
        chapter_count = await Chapter.filter(project_id=project.id).count()

        # 计算总字数：项目内容字数 + 章节字数总和
        chapters = await Chapter.filter(project_id=project.id)
        chapter_words = sum(c.word_count for c in chapters)
        total_word_count = project.word_count + chapter_words

        # 选择封面颜色
        cover_color = color_palette[project.id % len(color_palette)]

        items.append(
            RecentProjectItem(
                id=project.id,
                title=project.title,
                status=project.status,
                word_count=total_word_count,
                chapter_count=chapter_count,
                updated_at=project.updated_at,
                cover_color=cover_color,
            ),
        )

    return RecentProjectsResponse(items=items, total_count=total_count)


@router.get("/statistics", response_model=NovelStatistics)
async def get_statistics(user_id: CurrentUserId):
    """
    获取小说创作统计数据
    """
    from src.features.chapter.backend.models import Chapter
    from src.features.novel_outline.backend.models import OutlineNode
    from src.features.novel_project.backend.models import NovelProject

    project_count = await NovelProject.filter(user_id=user_id).count()
    
    # 章节统计：通过project外键关联
    projects = await NovelProject.filter(user_id=user_id)
    project_ids = [p.id for p in projects]
    chapter_count = await Chapter.filter(project_id__in=project_ids).count() if project_ids else 0
    
    # 大纲节点统计：通过project外键关联
    outline_node_count = await OutlineNode.filter(project_id__in=project_ids).count() if project_ids else 0

    # 计算总字数：项目内容 + 章节内容
    chapters = await Chapter.filter(project_id__in=project_ids) if project_ids else []
    total_words = sum(p.word_count for p in projects) + sum(c.word_count for c in chapters)

    return NovelStatistics(
        project_count=project_count,
        chapter_count=chapter_count,
        outline_node_count=outline_node_count,
        total_words=total_words,
    )


@router.get("/system-summary", response_model=SystemInfoSummary)
async def get_system_summary(_user_id: CurrentUserId):
    """
    获取系统信息摘要（用于折叠区域）
    """
    from tortoise import Tortoise

    # 检查数据库连接
    try:
        conn = Tortoise.get_connection("default")
        await conn.execute_query("SELECT 1")
        db_status = "已连接"
    except Exception:
        db_status = "断开"

    return SystemInfoSummary(
        version="v1.0.0",
        environment="Development",
        db_status=db_status,
    )
