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
    """章节模型"""
    id = fields.IntField(pk=True)  # 数据库主键
    chapter_id = fields.CharField(max_length=36, unique=True, description="章节UUID")  # UUID格式的章节ID
    chapter_number = fields.IntField(description="章节序号")  # 章节序号
    title = fields.CharField(max_length=200, description="章节标题")
    content = fields.TextField(null=True, blank=True, description="正文内容")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="最后修改时间")
    
    # 添加关联的小说项目ID
    project_id = fields.IntField(description="所属项目ID")
    
    class Meta:
        table = "chapters"
        ordering = ["chapter_number"]
    
    def __str__(self):
        return f"Chapter {self.chapter_number}: {self.title}"
    
    async def validate(self):
        """验证模型数据"""
        if not self.title:
            raise ValidationError("章节标题不能为空")
        
        if not self.chapter_id:
            raise ValidationError("章节ID不能为空")
        
        # 验证UUID格式
        try:
            uuid.UUID(self.chapter_id)
        except ValueError:
            raise ValidationError("章节ID必须是有效的UUID格式")
        
        # 验证章节序号唯一性
        if self.project_id and self.chapter_number:
            existing = await Chapter.filter(
                project_id=self.project_id, 
                chapter_number=self.chapter_number
            ).exclude(id=self.id).first()
            
            if existing:
                raise ValidationError(f"项目中已存在序号为 {self.chapter_number} 的章节")