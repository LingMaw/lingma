"""大纲管理API路由"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from tortoise.transactions import in_transaction

from src.features.novel_outline.backend.models import OutlineNode
from src.features.novel_outline.backend.schemas import (
    OutlineNodeCreate,
    OutlineNodeUpdate,
    OutlineNodeResponse,
    OutlineTreeResponse,
    OutlineNodeWithChildren,
    PositionUpdate,
    PositionUpdateResponse,
    ReorderRequest,
    ReorderResponse,
    DeleteResponse,
    OutlineGenerateRequest,
    RegenerateChildrenRequest,
)
from src.features.novel_outline.backend.ai import outline_ai_service
from src.backend.core.exceptions import APIError
from src.backend.core.dependencies import CurrentUserId

router = APIRouter()


async def build_tree(nodes: list[OutlineNode]) -> list[OutlineNodeWithChildren]:
    """递归构建大纲树结构
    
    Args:
        nodes: 节点列表
        
    Returns:
        树形结构的节点列表
    """
    # 构建节点字典
    node_dict = {node.id: node for node in nodes}
    
    # 构建父子关系
    tree = []
    for node in nodes:
        node_data = OutlineNodeWithChildren.model_validate(node)
        
        if node.parent_id is None:
            # 根节点
            tree.append(node_data)
        else:
            # 子节点,添加到父节点的children
            parent = node_dict.get(node.parent_id)
            if parent:
                # 需要找到tree中对应的父节点
                parent_in_tree = find_node_in_tree(tree, parent.id)
                if parent_in_tree:
                    parent_in_tree.children.append(node_data)
    
    return tree


def find_node_in_tree(tree: list[OutlineNodeWithChildren], node_id: int) -> Optional[OutlineNodeWithChildren]:
    """在树中查找指定ID的节点
    
    Args:
        tree: 树形结构列表
        node_id: 节点ID
        
    Returns:
        找到的节点或None
    """
    for node in tree:
        if node.id == node_id:
            return node
        if node.children:
            found = find_node_in_tree(node.children, node_id)
            if found:
                return found
    return None


async def count_all_nodes(node_id: int) -> int:
    """递归统计节点及其所有子孙节点数量
    
    Args:
        node_id: 节点ID
        
    Returns:
        节点总数(包含自身)
    """
    count = 1
    children = await OutlineNode.filter(parent_id=node_id).all()
    for child in children:
        count += await count_all_nodes(child.id)
    return count


@router.get("/{project_id}/outline", response_model=OutlineTreeResponse)
async def get_outline_tree(project_id: int):
    """获取小说项目的完整大纲树
    
    Args:
        project_id: 小说项目ID
        
    Returns:
        完整的大纲树结构
    """
    # 获取该项目的所有大纲节点
    nodes = await OutlineNode.filter(novel_id=project_id).order_by("position").all()
    
    # 构建树形结构
    root_nodes = await build_tree(nodes)
    
    return OutlineTreeResponse(
        novel_id=project_id,
        root_nodes=root_nodes,
        total_nodes=len(nodes)
    )


@router.post("/{project_id}/outline", response_model=OutlineNodeResponse)
async def create_outline_node(project_id: int, node_data: OutlineNodeCreate):
    """创建大纲节点
    
    Args:
        project_id: 小说项目ID
        node_data: 节点数据
        
    Returns:
        创建的节点信息
        
    Raises:
        HTTPException: 父节点不存在、层级超限、类型不匹配等错误
    """
    # 验证父节点存在(如果指定了parent_id)
    if node_data.parent_id is not None:
        parent = await OutlineNode.filter(id=node_data.parent_id, novel_id=project_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="父节点不存在")
    
    # 计算position(如果未指定)
    if node_data.position is None:
        siblings = await OutlineNode.filter(
            novel_id=project_id,
            parent_id=node_data.parent_id
        ).all()
        node_data.position = len(siblings)
    
    # 创建节点
    node = await OutlineNode.create(
        novel_id=project_id,
        parent_id=node_data.parent_id,
        node_type=node_data.node_type,
        title=node_data.title,
        description=node_data.description,
        position=node_data.position,
        status=node_data.status,
        metadata=node_data.metadata
    )
    
    # 验证层级关系
    try:
        await node.validate_hierarchy()
    except ValueError as e:
        # 如果验证失败,删除已创建的节点
        await node.delete()
        raise HTTPException(status_code=400, detail=str(e))
    
    return OutlineNodeResponse.model_validate(node)


@router.put("/{project_id}/outline/{node_id}", response_model=OutlineNodeResponse)
async def update_outline_node(
    project_id: int,
    node_id: int,
    update_data: OutlineNodeUpdate
):
    """更新大纲节点
    
    Args:
        project_id: 小说项目ID
        node_id: 节点ID
        update_data: 更新数据
        
    Returns:
        更新后的节点信息
        
    Raises:
        HTTPException: 节点不存在
    """
    node = await OutlineNode.filter(id=node_id, novel_id=project_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 更新字段(只更新提供的字段)
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        if field == "metadata" and value is not None:
            # 合并metadata
            node.metadata = {**node.metadata, **value}
        else:
            setattr(node, field, value)
    
    await node.save()
    
    return OutlineNodeResponse.model_validate(node)


@router.delete("/{project_id}/outline/{node_id}", response_model=DeleteResponse)
async def delete_outline_node(
    project_id: int,
    node_id: int,
    cascade: bool = Query(False, description="是否级联删除子节点")
):
    """删除大纲节点
    
    Args:
        project_id: 小说项目ID
        node_id: 节点ID
        cascade: 是否级联删除子节点
        
    Returns:
        删除结果
        
    Raises:
        HTTPException: 节点不存在、含子节点未指定级联删除
    """
    node = await OutlineNode.filter(id=node_id, novel_id=project_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 检查是否有子节点
    children = await node.get_children()
    if children and not cascade:
        raise HTTPException(
            status_code=400,
            detail=f"节点包含{len(children)}个子节点,请指定cascade=true进行级联删除"
        )
    
    # 统计删除数量
    deleted_count = 1
    if cascade:
        deleted_count = await count_all_nodes(node_id)
    
    # 执行删除
    async with in_transaction():
        if cascade:
            # 递归删除所有子孙节点
            await delete_node_recursive(node_id)
        else:
            await node.delete()
        
        # 调整同级节点的position
        siblings = await OutlineNode.filter(
            novel_id=project_id,
            parent_id=node.parent_id,
            position__gt=node.position
        ).all()
        
        for sibling in siblings:
            sibling.position -= 1
            await sibling.save()
    
    return DeleteResponse(
        message="节点删除成功",
        deleted_count=deleted_count
    )


async def delete_node_recursive(node_id: int):
    """递归删除节点及其所有子孙节点
    
    Args:
        node_id: 节点ID
    """
    children = await OutlineNode.filter(parent_id=node_id).all()
    for child in children:
        await delete_node_recursive(child.id)
    
    await OutlineNode.filter(id=node_id).delete()


@router.patch("/{project_id}/outline/{node_id}/position", response_model=PositionUpdateResponse)
async def update_node_position(
    project_id: int,
    node_id: int,
    position_data: PositionUpdate
):
    """调整节点位置
    
    Args:
        project_id: 小说项目ID
        node_id: 节点ID
        position_data: 位置更新数据
        
    Returns:
        更新后的节点及受影响的兄弟节点
        
    Raises:
        HTTPException: 节点不存在、循环引用、层级超限
    """
    node = await OutlineNode.filter(id=node_id, novel_id=project_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 检查循环引用
    if position_data.parent_id is not None:
        if await node.has_circular_reference(position_data.parent_id):
            raise HTTPException(status_code=400, detail="不能将节点移动到自己的子节点下")
        
        # 验证父节点存在
        parent = await OutlineNode.filter(id=position_data.parent_id, novel_id=project_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="目标父节点不存在")
    
    old_parent_id = node.parent_id
    old_position = node.position
    
    async with in_transaction():
        # 如果改变了父节点
        if position_data.parent_id != old_parent_id:
            # 调整原父节点下其他节点的position
            old_siblings = await OutlineNode.filter(
                novel_id=project_id,
                parent_id=old_parent_id,
                position__gt=old_position
            ).all()
            for sibling in old_siblings:
                sibling.position -= 1
                await sibling.save()
        
        # 更新节点的parent_id和position
        node.parent_id = position_data.parent_id
        node.position = position_data.position
        await node.save()
        
        # 验证新的层级关系
        try:
            await node.validate_hierarchy()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # 调整新父节点下其他节点的position
        new_siblings = await OutlineNode.filter(
            novel_id=project_id,
            parent_id=position_data.parent_id,
            position__gte=position_data.position
        ).exclude(id=node_id).all()
        
        affected_siblings = []
        for sibling in new_siblings:
            sibling.position += 1
            await sibling.save()
            affected_siblings.append({"id": sibling.id, "position": sibling.position})
    
    return PositionUpdateResponse(
        node=OutlineNodeResponse.model_validate(node),
        affected_siblings=affected_siblings
    )


@router.post("/{project_id}/outline/reorder", response_model=ReorderResponse)
async def reorder_nodes(project_id: int, reorder_data: ReorderRequest):
    """批量更新节点顺序
    
    Args:
        project_id: 小说项目ID
        reorder_data: 排序数据
        
    Returns:
        更新后的节点位置信息
        
    Raises:
        HTTPException: 节点不属于同一父节点
    """
    # 验证所有节点都属于同一父节点
    nodes = await OutlineNode.filter(
        id__in=reorder_data.node_ids,
        novel_id=project_id
    ).all()
    
    if len(nodes) != len(reorder_data.node_ids):
        raise HTTPException(status_code=404, detail="部分节点不存在")
    
    for node in nodes:
        if node.parent_id != reorder_data.parent_id:
            raise HTTPException(status_code=400, detail="所有节点必须属于同一父节点")
    
    # 批量更新position
    updated_nodes = []
    async with in_transaction():
        for index, node_id in enumerate(reorder_data.node_ids):
            await OutlineNode.filter(id=node_id).update(position=index)
            updated_nodes.append({"id": node_id, "position": index})
    
    return ReorderResponse(
        message="顺序更新成功",
        updated_nodes=updated_nodes
    )


# ============= AI 生成相关端点 =============

@router.post("/{project_id}/outline/generate")
async def generate_outline(
    project_id: int,
    request: OutlineGenerateRequest,
    current_user_id: CurrentUserId,
):
    """AI 生成完整大纲(SSE流式返回)
    
    Args:
        project_id: 小说项目ID
        request: 生成请求参数
        current_user_id: 当前用户ID
        
    Returns:
        SSE 流式响应
    """
    async def generate_stream():
        async for event in outline_ai_service.generate_outline_stream(
            user_id=current_user_id,
            project_id=project_id,
            params=request,
        ):
            yield event
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/{project_id}/outline/nodes/{node_id}/regenerate-children")
async def regenerate_children(
    project_id: int,
    node_id: int,
    request: RegenerateChildrenRequest,
    current_user_id: CurrentUserId,
):
    """重新生成节点的子节点(SSE流式返回)
    
    Args:
        project_id: 小说项目ID
        node_id: 父节点ID
        request: 重新生成请求参数
        current_user_id: 当前用户ID
        
    Returns:
        SSE 流式响应
    """
    async def regenerate_stream():
        async for event in outline_ai_service.regenerate_children_stream(
            user_id=current_user_id,
            project_id=project_id,
            parent_node_id=node_id,
            params=request,
        ):
            yield event
    
    return StreamingResponse(
        regenerate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
