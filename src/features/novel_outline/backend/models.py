"""大纲节点数据模型"""
from tortoise import fields, models
from typing import List


class OutlineNode(models.Model):
    """大纲节点模型
    
    支持三级层级结构:
    - Volume(卷): 顶层节点
    - Chapter(章节): 卷的子节点
    - Section(小节): 章节的子节点
    """
    
    id = fields.IntField(pk=True)
    novel_id = fields.BigIntField(description="所属小说项目ID")
    parent_id = fields.IntField(null=True, description="父节点ID,null表示顶层节点")
    node_type = fields.CharField(max_length=20, description="节点类型: volume/chapter/section")
    title = fields.CharField(max_length=200, description="节点标题")
    description = fields.TextField(null=True, blank=True, description="节点描述/大纲内容")
    position = fields.IntField(default=0, description="在同级节点中的位置序号")
    status = fields.CharField(max_length=20, default="draft", description="节点状态: draft/editing/completed/locked")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="最后更新时间")
    metadata = fields.JSONField(default=dict, description="扩展元数据(JSON格式)")
    
    class Meta:
        table = "outline_nodes"
        ordering = ["position"]
    
    async def get_children(self) -> List['OutlineNode']:
        """获取当前节点的直接子节点列表,按position排序"""
        return await OutlineNode.filter(
            parent_id=self.id
        ).order_by("position").all()
    
    async def get_depth(self) -> int:
        """计算节点在树中的深度
        
        Returns:
            int: 深度值,根节点为1,子节点递增
        """
        if self.parent_id is None:
            return 1
        parent = await OutlineNode.get(id=self.parent_id)
        return await parent.get_depth() + 1
    
    async def validate_hierarchy(self) -> bool:
        """验证节点的层级关系是否合法
        
        验证规则:
        1. 节点深度不能超过3级
        2. volume必须在第1层
        3. chapter必须在第2层
        4. section必须在第3层
        
        Returns:
            bool: 验证通过返回True
            
        Raises:
            ValueError: 层级关系不合法时抛出异常
        """
        depth = await self.get_depth()
        
        # 验证层级深度
        if depth > 3:
            raise ValueError("节点层级不能超过3级")
        
        # 验证节点类型与深度匹配
        type_depth_map = {
            'volume': 1,
            'chapter': 2,
            'section': 3
        }
        
        if self.node_type in type_depth_map:
            expected_depth = type_depth_map[self.node_type]
            if depth != expected_depth:
                raise ValueError(
                    f"{self.node_type}类型节点必须在第{expected_depth}层,当前在第{depth}层"
                )
        
        return True
    
    async def has_circular_reference(self, target_parent_id: int) -> bool:
        """检测是否存在循环引用
        
        Args:
            target_parent_id: 目标父节点ID
            
        Returns:
            bool: 存在循环引用返回True
        """
        if target_parent_id is None:
            return False
        
        if target_parent_id == self.id:
            return True
        
        current = await OutlineNode.filter(id=target_parent_id).first()
        
        while current and current.parent_id is not None:
            if current.parent_id == self.id:
                return True
            current = await OutlineNode.filter(id=current.parent_id).first()
        
        return False
    
    async def count_descendants(self) -> int:
        """统计当前节点的所有子孙节点数量
        
        Returns:
            int: 子孙节点总数
        """
        children = await self.get_children()
        count = len(children)
        
        for child in children:
            count += await child.count_descendants()
        
        return count
    
    def __str__(self) -> str:
        return f"<OutlineNode {self.id}: {self.node_type} - {self.title}>"
