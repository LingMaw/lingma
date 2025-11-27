from fastapi import APIRouter

from src.backend.config.settings import settings
from src.features.dashboard.backend.router import router as dashboard_router
from src.features.monitor.backend.router import router as monitor_router

# 导入小说生成器路由
from src.features.novel_generator.backend.router import router as novel_generator_router
from src.features.novel_project.backend.router import router as novel_project_router
from src.features.user.backend.router import router as auth_router

# 创建主 API 路由
api_router = APIRouter(prefix="/api")

# 挂载各功能模块路由
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["仪表盘"])
api_router.include_router(monitor_router, prefix="/monitor", tags=["系统监控"])
api_router.include_router(novel_generator_router, prefix="/novel", tags=["AI小说生成器"])
api_router.include_router(novel_project_router, prefix="/novel_projects", tags=["小说项目管理"])


@api_router.get("/info", tags=["系统信息"])
async def api_info():
    """API 信息"""
    return {
        "message": settings.APP_NAME,
        "version": settings.VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs": "/docs",
    }
