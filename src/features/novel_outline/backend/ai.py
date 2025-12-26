"""大纲AI生成服务"""
import json
from typing import AsyncGenerator, List, Optional, Dict, Any

from src.backend.core.logger import logger
from src.features.novel_generator.backend.ai import ai_service
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_outline.backend.schemas import (
    OutlineGenerateRequest,
    RegenerateChildrenRequest,
)


class OutlineAIService:
    """大纲AI生成服务"""

    def __init__(self):
        """初始化大纲AI服务"""
        self.ai_service = ai_service
        # 并发控制: project_id -> True (正在生成)
        self._generating_projects: Dict[int, bool] = {}

    async def generate_outline_stream(
        self,
        user_id: int,
        project_id: int,
        params: OutlineGenerateRequest,
    ) -> AsyncGenerator[str, None]:
        """
        流式生成完整大纲

        Args:
            user_id: 用户ID
            project_id: 项目ID
            params: 生成参数

        Yields:
            str: SSE格式的事件字符串
        """
        # 并发控制检查
        if self._generating_projects.get(project_id):
            yield self._format_sse_event(
                "error", {"message": "该项目正在生成大纲,请等待完成"}
            )
            return

        self._generating_projects[project_id] = True

        try:
            # 发送进度事件
            yield self._format_sse_event(
                "progress", {"message": "正在构建生成提示词...", "step": 1, "total": 3}
            )

            # 构建Prompt
            prompt = self._build_prompt(params)
            logger.info(f"项目 {project_id} 开始生成大纲, 用户ID: {user_id}")

            # 发送进度事件
            yield self._format_sse_event(
                "progress", {"message": "正在调用AI生成大纲...", "step": 2, "total": 3}
            )

            # 调用AI流式生成
            messages = [{"role": "user", "content": prompt}]
            full_content = ""
            reasoning_content = ""

            async for chunk in self.ai_service.chat_with_ai_stream(user_id, messages):
                # 检查是否是思维链内容
                if chunk.startswith("[REASONING]") and chunk.endswith("[/REASONING]"):
                    reasoning = chunk[11:-12]  # 提取思维链内容
                    reasoning_content += reasoning
                    yield self._format_sse_event("reasoning", {"content": reasoning})
                else:
                    # 普通内容
                    full_content += chunk
                    yield self._format_sse_event("content", {"chunk": chunk})

            # 发送进度事件
            yield self._format_sse_event(
                "progress", {"message": "正在解析并创建大纲节点...", "step": 3, "total": 3}
            )

            # 解析并创建节点
            created_nodes = await self._parse_and_create_nodes(
                full_content, project_id
            )

            # 发送节点创建事件
            for node in created_nodes:
                yield self._format_sse_event(
                    "node_created",
                    {
                        "node": {
                            "id": node.id,
                            "title": node.title,
                            "type": node.node_type,
                        }
                    },
                )

            # 发送完成事件
            yield self._format_sse_event(
                "complete",
                {"message": "大纲生成完成", "total_nodes": len(created_nodes)},
            )

            logger.info(f"项目 {project_id} 大纲生成完成, 共创建 {len(created_nodes)} 个节点")

        except Exception as e:
            logger.error(f"生成大纲时发生错误: {e}")
            yield self._format_sse_event("error", {"message": f"生成失败: {str(e)}"})

        finally:
            # 释放并发锁
            self._generating_projects.pop(project_id, None)

    async def regenerate_children_stream(
        self,
        user_id: int,
        project_id: int,
        parent_node_id: int,
        params: RegenerateChildrenRequest,
    ) -> AsyncGenerator[str, None]:
        """
        基于父节点重新生成子节点

        Args:
            user_id: 用户ID
            project_id: 项目ID
            parent_node_id: 父节点ID
            params: 重新生成参数

        Yields:
            str: SSE格式的事件字符串
        """
        try:
            # 验证父节点存在
            parent_node = await OutlineNode.filter(
                id=parent_node_id, novel_id=project_id
            ).first()

            if not parent_node:
                yield self._format_sse_event("error", {"message": "父节点不存在"})
                return

            # 发送进度事件
            yield self._format_sse_event(
                "progress", {"message": "正在准备重新生成...", "step": 1, "total": 3}
            )

            # 删除现有子节点(如果需要)
            if params.delete_existing:
                children = await parent_node.get_children()
                for child in children:
                    await child.delete()
                logger.info(f"已删除节点 {parent_node_id} 的 {len(children)} 个子节点")

            # 构建Prompt
            prompt = self._build_child_prompt(parent_node, params)

            # 发送进度事件
            yield self._format_sse_event(
                "progress", {"message": "正在调用AI生成子节点...", "step": 2, "total": 3}
            )

            # 调用AI流式生成
            messages = [{"role": "user", "content": prompt}]
            full_content = ""

            async for chunk in self.ai_service.chat_with_ai_stream(user_id, messages):
                if chunk.startswith("[REASONING]") and chunk.endswith("[/REASONING]"):
                    reasoning = chunk[11:-12]
                    yield self._format_sse_event("reasoning", {"content": reasoning})
                else:
                    full_content += chunk
                    yield self._format_sse_event("content", {"chunk": chunk})

            # 发送进度事件
            yield self._format_sse_event(
                "progress", {"message": "正在创建子节点...", "step": 3, "total": 3}
            )

            # 解析并创建节点
            created_nodes = await self._parse_and_create_nodes(
                full_content, project_id, parent_id=parent_node_id
            )

            # 发送节点创建事件
            for node in created_nodes:
                yield self._format_sse_event(
                    "node_created",
                    {
                        "node": {
                            "id": node.id,
                            "title": node.title,
                            "type": node.node_type,
                        }
                    },
                )

            # 发送完成事件
            yield self._format_sse_event(
                "complete",
                {"message": "子节点生成完成", "total_nodes": len(created_nodes)},
            )

            logger.info(
                f"节点 {parent_node_id} 的子节点重新生成完成, 共创建 {len(created_nodes)} 个节点"
            )

        except Exception as e:
            logger.error(f"重新生成子节点时发生错误: {e}")
            yield self._format_sse_event("error", {"message": f"生成失败: {str(e)}"})

    def _build_prompt(
        self, params: OutlineGenerateRequest, parent_context: Optional[OutlineNode] = None
    ) -> str:
        """
        构建大纲生成Prompt

        Args:
            params: 生成参数
            parent_context: 父节点上下文(用于子节点生成)

        Returns:
            str: 完整的Prompt文本
        """
        prompt = "你是一位专业的小说大纲策划师。请根据以下要求生成一份结构化的小说大纲。\n\n"
        prompt += "【基础信息】\n"
        prompt += f"- 主题/简介: {params.theme}\n"

        if params.genre:
            prompt += f"- 小说类型: {params.genre}\n"

        if params.style:
            prompt += f"- 写作风格: {params.style}\n"

        prompt += "\n【生成要求】\n"

        if params.chapter_count_range:
            prompt += f"- 章节数量: {params.chapter_count_range[0]} 到 {params.chapter_count_range[1]} 章\n"

        if params.key_plots:
            prompt += "- 关键情节点:\n"
            for i, plot in enumerate(params.key_plots, 1):
                prompt += f"  {i}. {plot}\n"

        if params.reference_outline:
            prompt += f"- 参考大纲:\n{params.reference_outline}\n"

        if params.custom_instructions:
            prompt += f"- 自定义指令: {params.custom_instructions}\n"

        prompt += "\n【输出格式要求】(严格遵守)\n"
        prompt += "1. 必须返回有效的 JSON 格式,不要包含任何注释或多余文本\n"
        prompt += "2. 结构为三层: 卷(volume) → 章节(chapter) → 小节(section)\n"
        prompt += "3. 每个节点包含: type, title, description, children(仅前两层)\n"
        prompt += "4. title 长度: 1-50 字\n"
        prompt += "5. description 长度: 50-200 字,描述该部分的内容要点\n"

        prompt += "\n【JSON Schema】\n"
        prompt += """{
  "outline": [
    {
      "type": "volume",
      "title": "卷标题",
      "description": "卷的内容概述",
      "children": [
        {
          "type": "chapter",
          "title": "章节标题",
          "description": "章节内容概述",
          "children": [
            {
              "type": "section",
              "title": "小节标题",
              "description": "小节内容概述"
            }
          ]
        }
      ]
    }
  ]
}
"""

        prompt += "\n【示例】(玄幻题材参考)\n"
        prompt += """{
  "outline": [
    {
      "type": "volume",
      "title": "第一卷:起源之谜",
      "description": "主角从平凡少年逐步觉醒,发现自己的身世秘密,踏上修炼之路",
      "children": [
        {
          "type": "chapter",
          "title": "第1章:神秘的觉醒",
          "description": "主角林辰在一次意外中激活体内沉睡的远古血脉,展现出惊人天赋",
          "children": [
            {
              "type": "section",
              "title": "平凡的日常",
              "description": "林辰作为小镇普通少年的日常生活,暗示其与众不同的细节"
            },
            {
              "type": "section",
              "title": "意外的觉醒",
              "description": "遭遇魔兽袭击,生死关头激活血脉力量,展现惊人战斗本能"
            }
          ]
        }
      ]
    }
  ]
}
"""

        prompt += "\n请严格按照上述格式返回 JSON,确保可以直接被解析。"

        return prompt

    def _build_child_prompt(
        self, parent_node: OutlineNode, params: RegenerateChildrenRequest
    ) -> str:
        """
        构建子节点生成Prompt

        Args:
            parent_node: 父节点
            params: 生成参数

        Returns:
            str: Prompt文本
        """
        prompt = "你是一位专业的小说大纲策划师。请为以下大纲节点生成子节点内容。\n\n"
        prompt += "【父节点信息】\n"
        prompt += f"- 类型: {parent_node.node_type}\n"
        prompt += f"- 标题: {parent_node.title}\n"

        if parent_node.description:
            prompt += f"- 描述: {parent_node.description}\n"

        # 确定期望的子节点类型
        type_map = {"volume": "chapter", "chapter": "section"}
        expected_type = type_map.get(parent_node.node_type, "")

        if not expected_type:
            prompt += "\n注意: 该节点类型不支持子节点生成\n"
            return prompt

        prompt += "\n【生成要求】\n"

        if params.max_children:
            prompt += f"- 生成约 {params.max_children} 个子节点\n"
        else:
            # 默认推断
            default_count = {"volume": "5-10", "chapter": "3-8"}
            prompt += f"- 生成约 {default_count.get(parent_node.node_type, '5')} 个子节点\n"

        if params.custom_instructions:
            prompt += f"- 自定义指令: {params.custom_instructions}\n"

        prompt += "\n【输出格式要求】\n"
        prompt += "返回 JSON 数组,每个元素包含 type, title, description。\n"
        prompt += f"子节点类型为: {expected_type}\n"

        prompt += "\n【JSON Schema】\n"
        prompt += f"""[
  {{
    "type": "{expected_type}",
    "title": "子节点标题",
    "description": "子节点内容概述"
  }}
]
"""

        prompt += "\n请严格按照上述格式返回 JSON 数组。"

        return prompt

    async def _parse_and_create_nodes(
        self, json_str: str, project_id: int, parent_id: Optional[int] = None
    ) -> List[OutlineNode]:
        """
        解析AI返回的JSON并批量创建节点

        Args:
            json_str: AI返回的JSON字符串
            project_id: 项目ID
            parent_id: 父节点ID(可选)

        Returns:
            List[OutlineNode]: 创建的节点列表

        Raises:
            ValueError: JSON格式错误
        """
        try:
            # 清理可能的多余文本
            json_str = json_str.strip()

            # 尝试提取JSON部分(可能包含```json...```)
            if "```json" in json_str:
                start = json_str.find("```json") + 7
                end = json_str.rfind("```")
                json_str = json_str[start:end].strip()
            elif "```" in json_str:
                start = json_str.find("```") + 3
                end = json_str.rfind("```")
                json_str = json_str[start:end].strip()

            # 解析JSON
            data = json.loads(json_str)

            # 检查数据格式
            if parent_id is None:
                # 完整大纲生成
                if "outline" not in data:
                    raise ValueError("JSON格式错误: 缺少 'outline' 字段")
                outline_data = data["outline"]
            else:
                # 子节点生成
                if isinstance(data, list):
                    outline_data = data
                elif "children" in data:
                    outline_data = data["children"]
                else:
                    raise ValueError("JSON格式错误: 应为数组或包含 'children' 字段")

            # 递归创建节点
            created_nodes = []
            await self._create_nodes_recursively(
                outline_data, project_id, parent_id, 0, created_nodes
            )

            return created_nodes

        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, 原始内容: {json_str[:500]}")
            raise ValueError(f"AI返回的内容不是有效的JSON格式: {str(e)}")
        except Exception as e:
            logger.error(f"解析并创建节点时发生错误: {e}")
            raise

    async def _create_nodes_recursively(
        self,
        nodes_data: List[Dict[str, Any]],
        project_id: int,
        parent_id: Optional[int],
        start_position: int,
        created_nodes: List[OutlineNode],
    ) -> None:
        """
        递归创建节点树

        Args:
            nodes_data: 节点数据列表
            project_id: 项目ID
            parent_id: 父节点ID
            start_position: 起始位置
            created_nodes: 已创建节点列表(用于收集)
        """
        for i, node_data in enumerate(nodes_data):
            # 创建当前节点
            node = await OutlineNode.create(
                novel_id=project_id,
                parent_id=parent_id,
                node_type=node_data["type"],
                title=node_data["title"],
                description=node_data.get("description", ""),
                position=start_position + i,
                status="draft",
            )

            created_nodes.append(node)

            # 验证层级关系
            try:
                await node.validate_hierarchy()
            except ValueError as e:
                # 如果验证失败,删除已创建的节点并抛出异常
                for created_node in created_nodes:
                    await created_node.delete()
                raise ValueError(f"节点层级验证失败: {str(e)}")

            # 递归创建子节点
            if "children" in node_data and node_data["children"]:
                await self._create_nodes_recursively(
                    node_data["children"], project_id, node.id, 0, created_nodes
                )

    def _format_sse_event(self, event: str, data: Dict[str, Any]) -> str:
        """
        格式化SSE事件

        Args:
            event: 事件类型
            data: 事件数据

        Returns:
            str: SSE格式的字符串
        """
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# 创建全局服务实例
outline_ai_service = OutlineAIService()
