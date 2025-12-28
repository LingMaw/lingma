"""
章节数据模型
"""

from tortoise import fields, models


class Chapter(models.Model):
    """
    章节模型 - 扁平结构
    存储章节正文内容，通过outline_node_id关联到大纲节点
    """

    id = fields.IntField(pk=True, description="主键")
    uuid = fields.UUIDField(unique=True, description="UUID（用于外部引用）")
    project = fields.ForeignKeyField(
        "models.NovelProject",
        related_name="chapters",
        on_delete=fields.CASCADE,
        description="关联项目",
    )
    outline_node = fields.ForeignKeyField(
        "models.OutlineNode",
        related_name="chapter",
        on_delete=fields.SET_NULL,
        null=True,
        description="关联大纲节点（可为空）",
    )
    title = fields.CharField(max_length=200, description="章节标题")
    content = fields.TextField(default="", description="正文内容（纯文本）")
    chapter_number = fields.IntField(description="全局章节编号（1-based）")
    word_count = fields.IntField(default=0, description="字数统计")
    status = fields.CharField(
        max_length=20,
        default="draft",
        description="状态：draft/completed/ai_generated",
    )
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "chapters"
        # 索引：项目内章节编号排序
        indexes = [("project_id", "chapter_number")]

    def __str__(self):
        return f"Chapter {self.chapter_number}: {self.title}"
