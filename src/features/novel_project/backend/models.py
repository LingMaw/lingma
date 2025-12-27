"""小说项目数据库模型
定义小说项目的数据库结构
"""

import uuid
from tortoise import fields, models
from tortoise.exceptions import ValidationError


class NovelProject(models.Model):
    """小说项目模型"""
    id = fields.IntField(pk=True)
    title = fields.CharField(max_length=200, description="项目标题")
    description = fields.TextField(null=True, blank=True, description="项目描述")
    genre = fields.CharField(max_length=50, null=True, blank=True, description="小说类型")
    style = fields.CharField(max_length=50, null=True, blank=True, description="写作风格")
    status = fields.CharField(max_length=20, default="draft", description="项目状态")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")
    
    # 添加小说内容字段
    content = fields.TextField(null=True, blank=True, description="小说内容")
    word_count = fields.IntField(default=0, description="字数统计")
    
    # 添加章节ID列表字段 (JSON格式存储UUID列表)
    chapter_ids = fields.JSONField(default=[], description="章节ID列表")
    
    # 是否启用章节系统
    use_chapter_system = fields.BooleanField(default=False, description="是否启用章节系统")
    
    # 关联用户
    user_id = fields.BigIntField(description="创建用户ID")
    
    class Meta:
        table = "novel_projects"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.title} ({self.status})"
    
    async def validate(self):
        """验证模型数据"""
        if not self.title:
            raise ValidationError("项目标题不能为空")
        
        if self.status not in ["draft", "in_progress", "completed", "archived"]:
            raise ValidationError("项目状态必须是: draft, in_progress, completed, archived")

class Chapter(models.Model):
    """章节模型（阶段三优化后 - 逻辑层面）
    
    核心字段:
    - chapter_id: UUID 业务标识
    - outline_node_id: 关联的 OutlineNode
    - content: 正文内容
    
    废弃字段（数据库仍保留，待后续迁移删除）:
    - title: 从 OutlineNode 读取（ChapterQueryService）
    - chapter_number: 运行时计算（ChapterQueryService）
    - project_id: 通过 outline_node_id 获取
    - outline_description: 迁移到 OutlineNode.description
    """
    id = fields.IntField(pk=True)  # 数据库主键
    chapter_id = fields.CharField(max_length=36, unique=True, description="章节UUID")  # UUID格式的章节ID
    
    # ✨ 废弃字段（数据库schema仍为NOT NULL，待迁移修改）
    chapter_number = fields.IntField(description="[废弃] 章节序号（运行时计算）")  # 章节序号
    title = fields.CharField(max_length=200, description="[废弃] 章节标题（从 OutlineNode 读取）")
    project_id = fields.IntField(description="[废弃] 所属项目ID（通过 outline_node_id 获取）")
    outline_description = fields.TextField(null=True, blank=True, description="[废弃] 大纲结构化描述（迁移到 OutlineNode.description）")
    
    # ✅ 核心字段
    content = fields.TextField(null=True, blank=True, description="正文内容")
    outline_node_id = fields.IntField(null=True, description="关联的大纲节点ID(chapter类型)")  # 待迁移改为NOT NULL
    
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="最后修改时间")
    
    class Meta:
        table = "chapters"
        ordering = ["chapter_number"]  # 保持兼容性
        indexes = [
            ("outline_node_id",),
        ]
    
    def __str__(self):
        return f"Chapter {self.chapter_id}"
    
    async def validate(self):
        """验证模型数据（阶段三优化 - 简化验证）"""
        if not self.chapter_id:
            raise ValidationError("章节ID不能为空")
        
        # 验证UUID格式
        try:
            uuid.UUID(self.chapter_id)
        except ValueError:
            raise ValidationError("章节ID必须是有效的UUID格式")
        
        # ❌ 删除 chapter_number 唯一性验证（不再依赖此字段）
        # ❌ 删除 title 验证（不再依赖此字段）
        
        # ✨ 验证关联的大纲节点类型
        if self.outline_node_id:
            from src.features.novel_outline.backend.models import OutlineNode
            try:
                node = await OutlineNode.get(id=self.outline_node_id)
                if node.node_type != 'chapter':
                    raise ValidationError("Chapter 只能关联 chapter 类型的 OutlineNode")
            except Exception:
                # 节点不存在时也抛出验证错误
                raise ValidationError(f"关联的 OutlineNode(id={self.outline_node_id}) 不存在")