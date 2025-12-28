"""
仪表盘相关的Pydantic模型
定义请求和响应的数据结构
"""

from datetime import datetime

from pydantic import BaseModel


class NovelStatistics(BaseModel):
    """小说项目统计数据"""

    project_count: int
    chapter_count: int
    outline_node_count: int
    total_words: int


class AppOverviewResponse(BaseModel):
    """应用概览信息响应"""

    api_count: int
    feature_count: int
    db_status: str  # "Connected" | "Disconnected"
    environment: str
    novel_stats: NovelStatistics


class SystemResource(BaseModel):
    """系统资源使用情况"""

    name: str
    usage: float  # 百分比 0-100
    total: str
    used: str


class SystemInfoResponse(BaseModel):
    """系统信息响应"""

    cpu: SystemResource
    memory: SystemResource
    disk: SystemResource
    uptime: str
    uptime_seconds: float  # 新增：秒数，方便前端格式化
    version: str
    os: str


class RecentProjectItem(BaseModel):
    """最近项目单项数据"""

    id: int
    title: str
    status: str
    word_count: int
    chapter_count: int
    updated_at: datetime
    cover_color: str

    class Config:
        from_attributes = True


class RecentProjectsResponse(BaseModel):
    """最近项目列表响应"""

    items: list[RecentProjectItem]
    total_count: int


class SystemInfoSummary(BaseModel):
    """系统信息摘要（用于折叠区域）"""

    version: str
    environment: str
    db_status: str
