"""
大纲续写服务
基于现有大纲内容,使用AI智能生成后续章节大纲
"""

import json
from typing import Any, AsyncGenerator, Dict

from loguru import logger

from src.backend.ai import ai_service
from src.backend.core.exceptions import APIError
from src.features.chapter.backend.services.sync_service import ChapterSyncService
from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_project.backend.models import NovelProject


class OutlineContinueService:
    """大纲续写服务"""

    @staticmethod
    async def continue_outline_stream(
        project_id: int,
        user_id: int,
        chapter_count: int,
        additional_context: str = "",
    ) -> AsyncGenerator[str, None]:
        """
        流式生成续写大纲
        
        Args:
            project_id: 项目ID
            user_id: 用户ID
            chapter_count: 续写章节数
            additional_context: 额外上下文/指令
            
        Yields:
            str: SSE事件流
        """
        try:
            # 1. 验证项目存在
            project = await NovelProject.get_or_none(id=project_id)
            if not project:
                yield f"data: {json.dumps({'type': 'error', 'message': '项目不存在'}, ensure_ascii=False)}\n\n"
                return
            
            # 2. 提取现有大纲
            yield f"data: {json.dumps({'type': 'status', 'message': '提取现有大纲...'}, ensure_ascii=False)}\n\n"
            
            existing_outline = await OutlineContinueService._extract_existing_outline(project_id)
            
            if not existing_outline:
                yield f"data: {json.dumps({'type': 'error', 'message': '请先创建初始大纲'}, ensure_ascii=False)}\n\n"
                return
            
            # 3. 确定起始章节编号
            last_chapter_number = existing_outline.get("last_chapter_number", 0)
            start_chapter_number = last_chapter_number + 1
            
            # 4. 构建续写 Prompt
            yield f"data: {json.dumps({'type': 'status', 'message': '构建续写提示词...'}, ensure_ascii=False)}\n\n"
            
            project_info = {
                "title": project.title,
                "genre": project.genre or "未指定",
                "style": project.style or "未指定",
            }
            
            prompt = OutlineContinueService._build_continue_prompt(
                existing_outline=existing_outline["outline"],
                project_info=project_info,
                chapter_count=chapter_count,
                additional_context=additional_context,
                start_chapter_number=start_chapter_number,
            )
            
            # 5. 调用AI生成
            yield f"data: {json.dumps({'type': 'status', 'message': '开始AI续写...'}, ensure_ascii=False)}\n\n"
            
            full_response = ""
            async for chunk in ai_service.chat_with_ai_stream(user_id, [
                {"role": "user", "content": prompt},
            ]):
                full_response += chunk
                # 实时返回生成进度
                yield f"data: {json.dumps({'type': 'progress', 'content': chunk}, ensure_ascii=False)}\n\n"
            
            # 6. 解析AI输出
            yield f"data: {json.dumps({'type': 'status', 'message': '解析续写内容...'}, ensure_ascii=False)}\n\n"
            
            continue_data = OutlineContinueService._parse_continue_response(full_response)
            
            # 7. 追加节点到大纲树
            yield f"data: {json.dumps({'type': 'status', 'message': '追加大纲节点...'}, ensure_ascii=False)}\n\n"
            
            last_volume_id = existing_outline.get("last_volume_id")
            created_count = await OutlineContinueService._append_nodes_to_outline(
                project_id=project_id,
                continue_data=continue_data,
                last_volume_id=last_volume_id,
            )
            
            yield f"data: {json.dumps({'type': 'complete', 'created_count': created_count}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            logger.error(f"续写大纲失败: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': f'续写失败: {e!s}'}, ensure_ascii=False)}\n\n"

    @staticmethod
    async def _extract_existing_outline(project_id: int) -> Dict[str, Any] | None:
        """
        提取现有大纲内容作为上下文
        
        Returns:
            dict: {
                'outline': {...},  # 大纲树状结构
                'last_chapter_number': int,
                'last_volume_id': int,
                'total_volumes': int
            }
        """
        # 获取所有节点
        nodes = await OutlineNode.filter(project_id=project_id).order_by("position").all()
        
        if not nodes:
            return None
        
        # 构建树结构
        node_map = {}
        for node in nodes:
            node_map[node.id] = {
                "id": node.id,
                "title": node.title,
                "description": node.description,
                "node_type": node.node_type,
                "position": node.position,
                "children": [],
            }
        
        # 构建父子关系
        volumes = []
        for node in nodes:
            node_dict = node_map[node.id]
            if node.parent_id is None:
                volumes.append(node_dict)
            else:
                parent = node_map.get(node.parent_id)
                if parent:
                    parent["children"].append(node_dict)
        
        # 获取最后一个卷的ID
        last_volume_id = volumes[-1]["id"] if volumes else None
        
        # 计算最后一章的编号
        chapter_nodes = [n for n in nodes if n.node_type == "chapter"]
        # 构建父节点position映射
        parent_position_map = {node.id: node.position for node in nodes}
        chapter_nodes_sorted = sorted(
            chapter_nodes,
            key=lambda n: (
                parent_position_map.get(n.parent_id, 0),
                n.position,
            ),
        )
        last_chapter_number = len(chapter_nodes_sorted)
        
        return {
            "outline": {"volumes": volumes},
            "last_chapter_number": last_chapter_number,
            "last_volume_id": last_volume_id,
            "total_volumes": len(volumes),
        }

    @staticmethod
    def _build_continue_prompt(
        existing_outline: dict,
        project_info: dict,
        chapter_count: int,
        additional_context: str,
        start_chapter_number: int,
    ) -> str:
        """构建续写 Prompt"""
        return f"""你是一位资深小说大纲规划师。现在需要为一部正在创作的小说续写大纲。

【已有大纲】
{json.dumps(existing_outline, ensure_ascii=False, indent=2)}

【项目信息】
- 标题: {project_info['title']}
- 类型: {project_info['genre']}
- 风格: {project_info['style']}

【续写要求】
1. 分析已有大纲的:
   - 语言风格(标题命名方式、描述语气)
   - 故事节奏(章节长度、情节密度)
   - 人物设定和世界观
   
2. 续写 {chapter_count} 个章节,从第 {start_chapter_number} 章开始

3. 保持与原大纲的连贯性:
   - 情节发展自然延续
   - 人物关系合理演进
   - 伏笔和线索有呼应

4. 额外指令: {additional_context or '无'}

【输出格式】
严格按照以下 JSON 格式(只返回 JSON):
{{
  "volumes": [
    {{
      "title": "卷标题",
      "description": "卷简介",
      "chapters": [
        {{
          "title": "章标题",
          "description": "章简介",
          "sections": [
            {{"title": "节标题", "description": "节要点"}}
          ]
        }}
      ]
    }}
  ]
}}

注意:
- 如果原大纲有多卷,续写可新增卷或追加到最后一卷
- 每章建议 3-5 个 section
- 标题风格必须与原大纲一致
- 章节编号从 {start_chapter_number} 开始连续编号
"""

    @staticmethod
    def _parse_continue_response(response: str) -> Dict[str, Any]:
        """
        解析AI返回的续写数据
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
                raise ValueError("无效的续写格式:缺少volumes字段")
            
        except json.JSONDecodeError as e:
            logger.error(f"解析续写JSON失败: {e}\n原始响应: {response}")
            # 返回默认结构
            return {
                "volumes": [
                    {
                        "title": "续写卷",
                        "description": "续写内容",
                        "chapters": [
                            {
                                "title": "续写章节",
                                "description": "续写内容",
                                "sections": [
                                    {"title": "续写小节", "description": "续写要点"},
                                ],
                            },
                        ],
                    },
                ],
            }
        return data

    @staticmethod
    async def _append_nodes_to_outline(
        project_id: int,
        continue_data: Dict[str, Any],
        last_volume_id: int | None,
    ) -> int:
        """
        将续写节点追加到大纲树
        
        Returns:
            int: 创建的节点总数
        """
        created_count = 0
        volumes = continue_data.get("volumes", [])
        
        for vol_data in volumes:
            # 判断是否需要创建新卷
            if last_volume_id is None or vol_data.get("is_new_volume", False):
                # 获取当前最大卷position
                max_vol = await OutlineNode.filter(
                    project_id=project_id,
                    parent_id=None,
                    node_type="volume",
                ).order_by("-position").first()
                
                vol_position = (max_vol.position + 1) if (max_vol and max_vol.position is not None) else 0
                
                # 创建新卷
                volume_node = await OutlineNode.create(
                    project_id=project_id,
                    parent_id=None,
                    node_type="volume",
                    title=vol_data.get("title", "新卷"),
                    description=vol_data.get("description"),
                    position=vol_position,
                    is_expanded=True,
                )
                created_count += 1
                current_volume_id = volume_node.id
            else:
                # 使用最后一卷
                current_volume_id = last_volume_id
            
            # 获取当前卷下的最大章节position
            max_chap = await OutlineNode.filter(
                project_id=project_id,
                parent_id=current_volume_id,
                node_type="chapter",
            ).order_by("-position").first()
            
            chap_start_position = (max_chap.position + 1) if (max_chap and max_chap.position is not None) else 0
            
            # 创建章节
            chapters = vol_data.get("chapters", [])
            for chap_idx, chapter in enumerate(chapters):
                chapter_node = await OutlineNode.create(
                    project_id=project_id,
                    parent_id=current_volume_id,
                    node_type="chapter",
                    title=chapter.get("title", f"第{chap_idx + 1}章"),
                    description=chapter.get("description"),
                    position=chap_start_position + chap_idx,
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
        
        logger.info(f"续写大纲完成,共创建 {created_count} 个节点")
        return created_count
