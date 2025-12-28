"""AI大纲生成服务
支持根据用户输入的主题/设定生成结构化大纲
"""

import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List

from src.backend.ai import ai_service
from src.backend.core.logger import logger
from src.features.chapter.backend.services.sync_service import ChapterSyncService
from src.features.character.backend.models import Character
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_project.backend.models import NovelProject


class AIOutlineService:
    """AI大纲生成服务"""

    @staticmethod
    async def generate_outline_stream(
        project_id: int,
        user_id: int,
        key_plots: list[str] | None = None,
        additional_content: str = "",
        chapter_count_min: int = 10,
        chapter_count_max: int = 50,
    ) -> AsyncGenerator[str, None]:
        """
        流式生成大纲结构
        
        Args:
            project_id: 项目ID
            user_id: 用户ID
            key_plots: 关键剧情点列表
            additional_content: 其他内容/补充说明
            chapter_count_min: 最少章节数
            chapter_count_max: 最多章节数
            
        Yields:
            str: SSE事件流，包含生成进度和节点数据
        """
        try:
            # 获取项目信息，使用项目自带的设定、类型、风格
            project = await NovelProject.get_or_none(id=project_id)
            if not project:
                yield f"data: {json.dumps({'type': 'error', 'message': '项目不存在'}, ensure_ascii=False)}\n\n"
                return
            
            topic = project.description or project.title
            genre = project.genre or ""
            style = project.style or ""
            
            # 构建提示词（包含项目角色信息）
            prompt = await AIOutlineService._build_outline_prompt(
                project_id, topic, genre, style, key_plots or [], additional_content, chapter_count_min, chapter_count_max
            )
            
            yield f"data: {json.dumps({'type': 'status', 'message': '开始生成大纲...'}, ensure_ascii=False)}\n\n"
            
            # 调用AI服务生成大纲
            full_response = ""
            logger.info(f"AI大纲提示词: {prompt}")
            async for chunk in ai_service.chat_with_ai_stream(user_id, [
                {"role": "user", "content": prompt}
            ]):
                full_response += chunk
                # 实时返回生成进度
                yield f"data: {json.dumps({'type': 'progress', 'content': chunk}, ensure_ascii=False)}\n\n"
            
            # 解析生成的大纲
            yield f"data: {json.dumps({'type': 'status', 'message': '解析大纲结构...'}, ensure_ascii=False)}\n\n"
            
            outline_data = AIOutlineService._parse_outline_response(full_response)
            
            # 清空现有大纲
            yield f"data: {json.dumps({'type': 'status', 'message': '清理现有大纲...'}, ensure_ascii=False)}\n\n"
            await OutlineNode.filter(project_id=project_id).delete()
            
            # 批量创建节点
            yield f"data: {json.dumps({'type': 'status', 'message': '创建大纲节点...'}, ensure_ascii=False)}\n\n"
            
            created_count = await AIOutlineService._create_nodes_batch(
                project_id, outline_data
            )
            
            yield f"data: {json.dumps({'type': 'complete', 'created_count': created_count}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            logger.error(f"生成大纲失败: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': f'生成失败: {str(e)}'}, ensure_ascii=False)}\n\n"

    @staticmethod
    async def _build_outline_prompt(
        project_id: int,
        topic: str,
        genre: str = "",
        style: str = "",
        key_plots: list[str] = None,
        additional_content: str = "",
        chapter_count_min: int = 10,
        chapter_count_max: int = 50,
    ) -> str:
        """构建大纲生成提示词（包含项目角色信息）"""
        prompt = f"""请根据以下设定生成一个小说大纲结构：

主题设定：{topic}
"""
        
        if genre:
            prompt += f"小说类型：{genre}\n"
        if style:
            prompt += f"写作风格：{style}\n"
        
        # 获取并添加角色设定信息
        characters = await Character.filter(project_id=project_id).all()
        if characters:
            prompt += "\n【角色设定】\n"
            prompt += "以下是本项目的主要角色，请在生成大纲时合理安排这些角色的出场：\n\n"
            for char in characters:
                prompt += f"角色名：{char.name}\n"
                # 添加基本信息
                if char.basic_info:
                    basic = char.basic_info
                    info_parts = []
                    if basic.get('gender'):
                        info_parts.append(f"性别：{basic['gender']}")
                    if basic.get('age'):
                        info_parts.append(f"年龄：{basic['age']}")
                    if basic.get('occupation'):
                        info_parts.append(f"职业：{basic['occupation']}")
                    if basic.get('category'):
                        info_parts.append(f"角色定位：{basic['category']}")
                    if info_parts:
                        prompt += f"  基本信息：{'，'.join(info_parts)}\n"
                # 添加性格特征
                if char.personality:
                    personality = char.personality
                    traits = personality.get('traits', [])
                    if traits:
                        prompt += f"  性格特征：{'、'.join(traits[:5])}\n"
                # 添加背景简介
                if char.background:
                    background = char.background
                    if background.get('summary'):
                        prompt += f"  背景简介：{background['summary'][:100]}\n"
                # 添加其他备注
                if char.notes:
                    prompt += f"  其他备注：{char.notes}\n"
                prompt += "\n"
        
        # 添加关键剧情
        if key_plots:
            prompt += f"\n关键剧情点：\n"
            for idx, plot in enumerate(key_plots, 1):
                prompt += f"{idx}. {plot}\n"
        
        # 添加其他内容
        if additional_content:
            prompt += f"\n其他要求/补充说明：\n{additional_content}\n"
        
        # 构建角色名称列表用于提示
        character_names = [char.name for char in characters] if characters else []
        character_list_hint = f"可用角色：{', '.join(character_names)}" if character_names else "请根据故事需要创建合适的角色"
        
        prompt += f"""
结构要求：
- 总章节数在 {chapter_count_min}-{chapter_count_max} 章之间
- 根据故事内容自行决定卷数（建议2-5卷）
- 每卷的章节数可以不同，根据剧情需要灵活安排
- 每章包含3-5个小节（section）
- 确保故事完整性，有明确的开端、发展、高潮和结局
- 【重要】每个小节的description必须包含"出场人物："标识，列出该小节中出现的角色名称

请按照以下JSON格式返回大纲结构（只返回JSON，不要其他说明）：

{{
  "volumes": [
    {{
      "title": "第一卷标题",
      "description": "卷的简介",
      "chapters": [
        {{
          "title": "第一章标题",
          "description": "章节简介",
          "sections": [
            {{
              "title": "小节标题",
              "description": "小节内容概要。出场人物：角色A、角色B"
            }}
          ]
        }}
      ]
    }}
  ]
}}

要求：
1. 标题要有吸引力，符合{genre if genre else '小说'}类型特点
2. 描述要具体，包含关键情节和人物
3. 层次清晰，逻辑连贯
4. 每个节点都要有title和description字段
5. 严格按照JSON格式输出，确保可以被解析
6. 灵活安排卷数和每卷章节数，确保故事节奏合理
7. 总章节数必须在{chapter_count_min}-{chapter_count_max}章范围内
8. 【重要】每个section的description必须以"出场人物："结尾，列出该小节中出场的角色
   - {character_list_hint}
   - 格式示例："主角初次来到学院，感受到浓厚的学术氛围。出场人物：张三、李四"
   - 如果该小节无角色出场，写"出场人物：无"
"""
        
        return prompt

    @staticmethod
    def _parse_outline_response(response: str) -> Dict[str, Any]:
        """
        解析AI返回的大纲数据
        支持从Markdown代码块中提取JSON
        """
        try:
            # 清理思维链标记
            response = response.replace("[REASONING]", "").replace("[/REASONING]", "")
            
            # 尝试从markdown代码块中提取JSON
            if "```json" in response:
                start = response.find("```json") + 7
                end = response.find("```", start)
                json_str = response[start:end].strip()
            elif "```" in response:
                start = response.find("```") + 3
                end = response.find("```", start)
                json_str = response[start:end].strip()
            else:
                json_str = response.strip()
            
            # 解析JSON
            data = json.loads(json_str)
            
            # 验证数据结构
            if "volumes" not in data or not isinstance(data["volumes"], list):
                raise ValueError("无效的大纲格式：缺少volumes字段")
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"解析大纲JSON失败: {e}\n原始响应: {response}")
            # 返回默认结构
            return {
                "volumes": [
                    {
                        "title": "第一卷：起始",
                        "description": "故事的开端",
                        "chapters": [
                            {
                                "title": "第一章",
                                "description": "初次相遇",
                                "sections": [
                                    {"title": "开场", "description": "场景描述"}
                                ]
                            }
                        ]
                    }
                ]
            }

    @staticmethod
    async def _create_nodes_batch(project_id: int, outline_data: Dict[str, Any]) -> int:
        """
        批量创建大纲节点
        
        Returns:
            int: 创建的节点总数
        """
        created_count = 0
        
        volumes = outline_data.get("volumes", [])
        
        for vol_idx, volume in enumerate(volumes):
            # 创建卷节点
            volume_node = await OutlineNode.create(
                project_id=project_id,
                parent_id=None,
                node_type="volume",
                title=volume.get("title", f"第{vol_idx + 1}卷"),
                description=volume.get("description"),
                position=vol_idx,
                is_expanded=True,
            )
            created_count += 1
            
            # 创建章节点
            chapters = volume.get("chapters", [])
            for chap_idx, chapter in enumerate(chapters):
                chapter_node = await OutlineNode.create(
                    project_id=project_id,
                    parent_id=volume_node.id,
                    node_type="chapter",
                    title=chapter.get("title", f"第{chap_idx + 1}章"),
                    description=chapter.get("description"),
                    position=chap_idx,
                    is_expanded=False,
                )
                created_count += 1
                
                # 同步创建对应的Chapter记录
                await ChapterSyncService.sync_on_create(chapter_node)
                
                # 创建小节节点
                sections = chapter.get("sections", [])
                for sec_idx, section in enumerate(sections):
                    await OutlineNode.create(
                        project_id=project_id,
                        parent_id=chapter_node.id,
                        node_type="section",
                        title=section.get("title", f"第{sec_idx + 1}节"),
                        description=section.get("description"),
                        position=sec_idx,
                        is_expanded=False,
                    )
                    created_count += 1
        
        logger.info(f"批量创建大纲节点完成，共创建 {created_count} 个节点")
        return created_count


class OutlineExportService:
    """大纲导出服务"""

    @staticmethod
    async def export_to_markdown(project_id: int) -> str:
        """导出为Markdown格式"""
        nodes = await OutlineNode.filter(project_id=project_id).order_by("position").all()
        
        # 构建树结构
        tree = OutlineExportService._build_tree(nodes)
        
        # 生成Markdown
        md_lines = ["# 小说大纲\n"]
        
        for volume in tree:
            md_lines.append(f"\n## {volume['title']}\n")
            if volume.get('description'):
                md_lines.append(f"*{volume['description']}*\n")
            
            for chapter in volume.get('children', []):
                md_lines.append(f"\n### {chapter['title']}\n")
                if chapter.get('description'):
                    md_lines.append(f"{chapter['description']}\n")
                
                for section in chapter.get('children', []):
                    md_lines.append(f"\n#### {section['title']}\n")
                    if section.get('description'):
                        md_lines.append(f"{section['description']}\n")
        
        return "\n".join(md_lines)

    @staticmethod
    async def export_to_json(project_id: int) -> Dict[str, Any]:
        """导出为JSON格式"""
        nodes = await OutlineNode.filter(project_id=project_id).order_by("position").all()
        
        # 构建树结构
        tree = OutlineExportService._build_tree(nodes)
        
        return {
            "project_id": project_id,
            "outline": tree
        }

    @staticmethod
    def _build_tree(nodes: List[OutlineNode]) -> List[Dict[str, Any]]:
        """构建树状结构"""
        node_map = {}
        
        # 创建节点映射
        for node in nodes:
            node_map[node.id] = {
                "id": node.id,
                "title": node.title,
                "description": node.description,
                "node_type": node.node_type,
                "children": []
            }
        
        # 构建树
        roots = []
        for node in nodes:
            node_dict = node_map[node.id]
            if node.parent_id is None:
                roots.append(node_dict)
            else:
                parent = node_map.get(node.parent_id)
                if parent:
                    parent['children'].append(node_dict)
        
        return roots
