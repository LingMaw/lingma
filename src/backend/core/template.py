"""Jinja2 模板管理工具类"""

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, Template, TemplateNotFound
from jinja2.exceptions import TemplateError

from src.backend.core.logger import logger
from src.backend.core.path_conf import get_resource_path


class TemplateManager:
    """Jinja2 模板管理器"""

    def __init__(self, template_dir: Path | None = None):
        """
        初始化模板环境

        Args:
            template_dir: 模板目录路径，默认为 src/assets/template/
        """
        if template_dir is None:
            # 使用 get_resource_path 获取跨平台兼容的模板路径
            template_path = get_resource_path("src/assets/template")
            if template_path is None or not template_path.exists():
                logger.warning(f"模板目录不存在，尝试创建: {template_path}")
                # 在开发环境中创建目录
                if template_path is not None:
                    template_path.mkdir(parents=True, exist_ok=True)
                else:
                    # 如果 get_resource_path 返回 None，使用默认路径
                    from src.backend.core.path_conf import get_base_dir
                    template_path = get_base_dir() / "src" / "assets" / "template"
                    template_path.mkdir(parents=True, exist_ok=True)
            template_dir = template_path

        self.template_dir = template_dir
        logger.info(f"初始化模板管理器，模板目录: {self.template_dir}")

        # 初始化 Jinja2 环境
        try:
            self.env = Environment(
                loader=FileSystemLoader(str(self.template_dir)),
                autoescape=False,  # 不自动转义，因为是纯文本
                trim_blocks=True,  # 去除块后的第一个换行
                lstrip_blocks=True,  # 去除块前的空白
            )
            logger.info("Jinja2 环境初始化成功")
        except Exception as e:
            logger.error(f"初始化 Jinja2 环境失败: {e}")
            self.env = None

    def render(self, template_name: str, **context: Any) -> str:
        """
        渲染模板

        Args:
            template_name: 模板文件名（如 "short_story.jinja2"）
            **context: 模板上下文变量

        Returns:
            str: 渲染后的字符串

        Raises:
            TemplateNotFound: 模板文件不存在
            TemplateError: 模板渲染错误
            Exception: 其他错误
        """
        if self.env is None:
            raise RuntimeError("Jinja2 环境未正确初始化")

        try:
            template = self.env.get_template(template_name)
            logger.debug(f"模板 {template_name} 渲染成功")
            return template.render(**context)
            
        except TemplateNotFound:
            logger.warning(f"模板文件未找到: {template_name}")
            raise
        except TemplateError as e:
            logger.error(f"模板渲染错误 ({template_name}): {e}")
            raise
        except Exception as e:
            logger.error(f"模板渲染时发生未知错误 ({template_name}): {e}")
            raise

    def render_safe(
        self, template_name: str, fallback: str, **context: Any,
    ) -> str:
        """
        安全渲染模板，失败时返回 fallback

        Args:
            template_name: 模板文件名
            fallback: 失败时的后备字符串
            **context: 模板上下文变量

        Returns:
            str: 渲染后的字符串，失败时返回 fallback
        """
        try:
            return self.render(template_name, **context)
        except TemplateNotFound:
            logger.warning(f"模板文件未找到: {template_name}，使用硬编码方法")
            return fallback
        except TemplateError as e:
            logger.error(f"模板渲染错误: {e}，使用硬编码方法")
            return fallback
        except Exception as e:
            logger.error(f"未知错误: {e}，使用硬编码方法")
            return fallback

    def template_exists(self, template_name: str) -> bool:
        """
        检查模板文件是否存在

        Args:
            template_name: 模板文件名

        Returns:
            bool: 模板是否存在
        """
        if self.env is None:
            return False

        template_path = self.template_dir / template_name
        return template_path.exists()
