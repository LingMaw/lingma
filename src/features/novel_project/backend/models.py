"""小说项目数据库模型
定义小说项目的数据库结构
"""

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

