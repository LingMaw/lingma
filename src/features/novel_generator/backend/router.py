"""小说生成器API路由
提供小说生成、查询等接口
"""

from typing import Any, Dict

from fastapi import APIRouter, Body, Query
from fastapi.responses import StreamingResponse

from src.backend.core.dependencies import CurrentUserId
from src.backend.core.exceptions import AuthenticationError
from src.backend.core.logger import logger
from src.backend.core.security import decode_access_token
from src.features.novel_generator.backend.services import ai_service

# 创建一个简单的路由器
router = APIRouter(tags=["AI小说生成器"])


@router.post("/generate-stream")
async def generate_novel_stream(
    data: Dict[str, Any] = Body(...),
    user_id: CurrentUserId = None,
    token: str = Query(None, description="认证令牌"),
):
    """
    流式生成小说内容
    
    Args:
        data: 小说生成请求数据
        user_id: 当前用户ID（通过Header认证）
        token: 认证令牌（通过查询参数传递）
        
    Returns:
        StreamingResponse: 流式返回生成的小说内容
    """
    # 如果没有通过Header认证，尝试通过查询参数认证
    if user_id is None and token:
        try:
            payload = decode_access_token(token)
            if payload:
                user_id = payload.get("sub")
        except Exception as e:
            logger.warning(f"令牌解析失败: {e}")
    
    # 如果仍然没有用户ID，返回错误
    if user_id is None:
        raise AuthenticationError("认证失败")
    
    title = data.get("title", "")
    genre = data.get("genre")
    style = data.get("style")
    requirement = data.get("requirement")
    
    logger.info(f"用户 {user_id} 请求流式生成小说: {title}")
    
    async def content_stream():
        try:
            # 发送一个初始心跳包，确保连接建立
            yield "".encode("utf-8")
            
            # 调用AI服务流式生成小说内容
            async for chunk in ai_service.generate_novel_content_stream(
                user_id=int(user_id),
                title=title,
                genre=genre,
                style=style,
                requirement=requirement,
            ):
                # 处理思维链内容和普通内容
                if "[REASONING]" in chunk and "[/REASONING]" in chunk:
                    start_idx = chunk.find("[REASONING]") + len("[REASONING]")
                    end_idx = chunk.find("[/REASONING]")
                    reasoning_content = chunk[start_idx:end_idx]
                    yield f"[REASONING]{reasoning_content}[/REASONING]".encode("utf-8")
                elif chunk.strip():
                    yield chunk.encode("utf-8")
                
                # 心跳包以保持连接活跃
                yield "".encode("utf-8")
                
        except Exception as e:
            logger.error(f"流式生成过程中发生错误: {e}")
            yield f"error: {e!s}\n\n".encode("utf-8")
        finally:
            yield "".encode("utf-8")
        
    return StreamingResponse(
        content_stream(), 
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )

