"""
大纲解析引擎模块

支持三种格式的大纲解析：
1. Markdown 格式（# ## ###）
2. 数字列表格式（1. 1.1 1.2）
3. 缩进格式（无缩进/缩进）
"""

import re
from typing import List
from pydantic import BaseModel


class ChapterData(BaseModel):
    """章节数据结构"""

    title: str  # 章节标题
    outline_description: str  # 结构化描述（包含子级信息）
    original_content: str  # 原始文本片段


class OutlineParser:
    """大纲解析器"""

    @staticmethod
    def detect_format(text: str) -> str:
        """
        检测大纲格式

        Args:
            text: 大纲文本

        Returns:
            "markdown" | "numbered" | "indent"
        """
        if not text or not text.strip():
            return "indent"

        lines = text.split("\n")

        # 检测 Markdown 格式（优先级最高）
        markdown_pattern = re.compile(r"^#{1,6}\s+")
        markdown_count = sum(1 for line in lines if markdown_pattern.match(line))
        if markdown_count >= 2:  # 至少有 2 个标题行
            return "markdown"

        # 检测数字列表格式
        numbered_pattern = re.compile(r"^\d+\.\s+")
        numbered_count = sum(1 for line in lines if numbered_pattern.match(line))
        if numbered_count >= 2:  # 至少有 2 个数字标记
            return "numbered"

        # 默认为缩进格式
        return "indent"

    @staticmethod
    def parse(text: str, format_type: str = "auto") -> List[ChapterData]:
        """
        解析大纲为章节数据

        Args:
            text: 大纲文本
            format_type: 格式类型 ("auto" | "markdown" | "numbered" | "indent")

        Returns:
            章节数据列表
        """
        if not text or not text.strip():
            return []

        # 自动检测格式
        if format_type == "auto":
            format_type = OutlineParser.detect_format(text)

        # 根据格式调用对应解析器
        if format_type == "markdown":
            return OutlineParser._parse_markdown(text)
        elif format_type == "numbered":
            return OutlineParser._parse_numbered(text)
        else:
            return OutlineParser._parse_indent(text)

    @staticmethod
    def _parse_markdown(text: str) -> List[ChapterData]:
        """
        解析 Markdown 格式大纲

        格式规则：
        - # 卷标题（提示信息）
        - ## 章标题（识别为章节）
        - ### 小节标题（提示信息）
        """
        lines = text.split("\n")
        chapters = []
        current_volume = None
        current_chapter = None
        current_sections = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # 匹配 Markdown 标题
            match = re.match(r"^(#{1,6})\s+(.+)$", stripped)
            if not match:
                # 非标题行，作为描述文本
                if current_sections:
                    current_sections[-1] += f"\n{stripped}"
                continue

            level = len(match.group(1))
            title = match.group(2).strip()

            if level == 1:
                # 卷标题（提示信息）
                current_volume = title
            elif level == 2:
                # 章标题（保存上一章并开始新章）
                if current_chapter:
                    # 保存上一章
                    chapters.append(
                        OutlineParser._build_chapter_data(
                            current_chapter, current_volume, current_sections
                        )
                    )
                current_chapter = title
                current_sections = []
            elif level >= 3:
                # 小节标题（提示信息）
                if current_chapter:
                    current_sections.append(stripped)

        # 保存最后一章
        if current_chapter:
            chapters.append(
                OutlineParser._build_chapter_data(
                    current_chapter, current_volume, current_sections
                )
            )

        return chapters

    @staticmethod
    def _parse_numbered(text: str) -> List[ChapterData]:
        """
        解析数字列表格式大纲

        格式规则：
        - 1. 章标题（顶层，识别为章节）
        -    1.1 小节标题（缩进，提示信息）
        -    1.2 小节标题（缩进，提示信息）
        - 2. 章标题（顶层，识别为章节）
        """
        lines = text.split("\n")
        chapters = []
        current_chapter = None
        current_sections = []

        for line in lines:
            if not line.strip():
                continue

            # 检测缩进
            indent_level = len(line) - len(line.lstrip())

            # 顶层数字（识别为章节）
            if indent_level == 0:
                match = re.match(r"^\d+\.\s+(.+)$", line.strip())
                if match:
                    # 保存上一章
                    if current_chapter:
                        chapters.append(
                            OutlineParser._build_chapter_data(
                                current_chapter, None, current_sections
                            )
                        )
                    current_chapter = match.group(1).strip()
                    current_sections = []
            else:
                # 缩进内容（小节或描述）
                if current_chapter:
                    current_sections.append(line.strip())

        # 保存最后一章
        if current_chapter:
            chapters.append(
                OutlineParser._build_chapter_data(
                    current_chapter, None, current_sections
                )
            )

        return chapters

    @staticmethod
    def _parse_indent(text: str) -> List[ChapterData]:
        """
        解析缩进格式大纲

        格式规则：
        - 无缩进行 → 章标题（识别为章节）
        - 缩进行 → 小节或描述（提示信息）
        """
        lines = text.split("\n")
        chapters = []
        current_chapter = None
        current_sections = []

        for line in lines:
            if not line.strip():
                continue

            # 检测缩进
            indent_level = len(line) - len(line.lstrip())

            if indent_level == 0:
                # 无缩进 → 章标题
                if current_chapter:
                    # 保存上一章
                    chapters.append(
                        OutlineParser._build_chapter_data(
                            current_chapter, None, current_sections
                        )
                    )
                current_chapter = line.strip()
                current_sections = []
            else:
                # 有缩进 → 小节
                if current_chapter:
                    current_sections.append(line.strip())

        # 保存最后一章
        if current_chapter:
            chapters.append(
                OutlineParser._build_chapter_data(
                    current_chapter, None, current_sections
                )
            )

        return chapters

    @staticmethod
    def _build_chapter_data(
        chapter_title: str, volume_title: str | None, sections: List[str]
    ) -> ChapterData:
        """
        构建章节数据

        Args:
            chapter_title: 章节标题
            volume_title: 卷标题（可选）
            sections: 小节列表

        Returns:
            ChapterData 对象
        """
        # 构建 outline_description
        description_parts = [f"## {chapter_title}", ""]

        if volume_title:
            description_parts.append(f"**所属卷**：{volume_title}")
            description_parts.append("")

        if sections:
            description_parts.append("**小节大纲**：")
            for section in sections:
                description_parts.append(f"- {section}")

        outline_description = "\n".join(description_parts)

        # 构建原始内容
        original_content = chapter_title
        if sections:
            original_content += "\n" + "\n".join(sections)

        return ChapterData(
            title=chapter_title,
            outline_description=outline_description,
            original_content=original_content,
        )
