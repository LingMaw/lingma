"""
人物设定系统数据库模型
定义角色模板、角色实体、角色关系的数据库结构
"""

from tortoise import fields, models


class CharacterTemplate(models.Model):
    """
    角色模板模型
    用于存储预设的角色类型,支持快速创建角色
    """

    id = fields.IntField(pk=True, description="主键")
    name = fields.CharField(max_length=200, description="模板名称")
    description = fields.TextField(null=True, blank=True, description="模板描述")
    category = fields.CharField(
        max_length=50, null=True, blank=True, description="模板分类(主角/配角/反派等)"
    )

    # JSON字段存储结构化数据
    basic_info = fields.JSONField(default=dict, description="基本信息(年龄、性别、外貌等)")
    background = fields.JSONField(default=dict, description="背景故事")
    personality = fields.JSONField(default=dict, description="性格特征")
    abilities = fields.JSONField(default=dict, description="能力技能")

    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "character_templates"
        ordering = ["-created_at"]

    def __str__(self):
        return f"CharacterTemplate({self.name})"


class Character(models.Model):
    """
    角色模型
    支持全局角色(project_id=None)和项目专属角色
    """

    id = fields.IntField(pk=True, description="主键")

    # 关联关系
    project = fields.ForeignKeyField(
        "models.NovelProject",
        related_name="characters",
        on_delete=fields.CASCADE,
        null=True,
        description="所属项目(NULL表示全局角色)",
    )
    template = fields.ForeignKeyField(
        "models.CharacterTemplate",
        related_name="characters",
        on_delete=fields.SET_NULL,
        null=True,
        description="来源模板(仅记录,不级联删除)",
    )

    # 基本字段
    name = fields.CharField(max_length=200, description="角色名称")

    # JSON字段存储结构化数据
    basic_info = fields.JSONField(default=dict, description="基本信息")
    background = fields.JSONField(default=dict, description="背景故事")
    personality = fields.JSONField(default=dict, description="性格特征")
    abilities = fields.JSONField(default=dict, description="能力技能")

    notes = fields.TextField(null=True, blank=True, description="其他备注")

    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "characters"
        ordering = ["-created_at"]
        indexes = [("project_id",), ("template_id",)]

    def __str__(self):
        project_info = f"(项目: {self.project_id})" if self.project_id else "(全局)"
        return f"Character({self.name} {project_info})"


class CharacterRelation(models.Model):
    """
    角色关系模型
    支持单向和双向关系,记录角色间的关系类型、强度等信息
    """

    id = fields.IntField(pk=True, description="主键")

    # 关联关系
    source_character = fields.ForeignKeyField(
        "models.Character",
        related_name="relations_as_source",
        on_delete=fields.CASCADE,
        description="源角色",
    )
    target_character = fields.ForeignKeyField(
        "models.Character",
        related_name="relations_as_target",
        on_delete=fields.CASCADE,
        description="目标角色",
    )

    # 关系信息
    relation_type = fields.CharField(max_length=50, description="关系类型(家人/朋友/敌人等)")
    strength = fields.IntField(default=5, description="关系强度(1-10)")
    description = fields.TextField(null=True, blank=True, description="关系描述")
    timeline = fields.TextField(null=True, blank=True, description="关系时间线")
    is_bidirectional = fields.BooleanField(
        default=False, description="是否双向关系"
    )

    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "character_relations"
        ordering = ["-created_at"]
        indexes = [
            ("source_character_id",),
            ("target_character_id",),
        ]
        # 唯一约束:同一对角色只能有一个关系
        unique_together = (("source_character_id", "target_character_id"),)

    def __str__(self):
        return f"Relation({self.source_character_id} -> {self.target_character_id}: {self.relation_type})"
