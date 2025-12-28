"""
大纲节点数据模型
"""

from tortoise import fields, models


class OutlineNode(models.Model):
    """
    大纲节点模型 - 树状结构
    支持三层层级：卷(volume) → 章(chapter) → 小节(section)
    """

    id = fields.IntField(pk=True, description="主键")
    project = fields.ForeignKeyField(
        "models.NovelProject",
        related_name="outline_nodes",
        on_delete=fields.CASCADE,
        description="关联项目",
    )
    parent = fields.ForeignKeyField(
        "models.OutlineNode",
        related_name="children",
        on_delete=fields.CASCADE,
        null=True,
        description="父节点（null=根节点）",
    )
    node_type = fields.CharField(
        max_length=20,
        description="节点类型：volume/chapter/section",
    )
    title = fields.CharField(max_length=200, description="节点标题")
    description = fields.TextField(null=True, description="节点描述/摘要")
    position = fields.IntField(default=0, description="同级排序位置（0-based）")
    is_expanded = fields.BooleanField(default=True, description="是否展开（UI状态）")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "outline_nodes"
        # 组合索引：项目内的同级排序
        indexes = [("project_id", "parent_id", "position")]

    def __str__(self):
        return f"{self.node_type}:{self.title}"
