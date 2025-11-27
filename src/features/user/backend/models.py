"""
用户数据库模型
使用Tortoise-ORM定义
"""

from tortoise import fields
from tortoise.models import Model


class User(Model):
    """用户模型"""

    id = fields.IntField(pk=True, description="用户ID")
    username = fields.CharField(max_length=50, unique=True, description="用户名")
    hashed_password = fields.CharField(max_length=128, description="加密后的密码")
    email = fields.CharField(max_length=100, unique=True, description="邮箱")
    nickname = fields.CharField(max_length=50, null=True, description="昵称")
    role = fields.CharField(max_length=20, default="user", description="角色")
    is_active = fields.BooleanField(default=True, description="是否激活")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "users"
        table_description = "用户表"

    def __str__(self):
        return f"User(id={self.id}, username={self.username})"


class UserSetting(Model):
    """用户设置模型"""

    id = fields.IntField(pk=True, description="设置ID")
    user = fields.ForeignKeyField("models.User", related_name="settings", description="关联用户")
    key = fields.CharField(max_length=100, description="设置键")
    value = fields.TextField(description="设置值")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "user_settings"
        table_description = "用户设置表"
        unique_together = (("user", "key"),)  # 确保每个用户对于每个键只有一个设置

    def __str__(self):
        return f"UserSetting(id={self.id}, user_id={self.user_id}, key={self.key})"


# 预定义的用户设置项
DEFAULT_USER_SETTINGS = {
    "api_key": "",
    "api_base": "",
    "api_model": "gpt-3.5-turbo",
    "api_max_tokens": "1000",
    "auto_save": "true",
}