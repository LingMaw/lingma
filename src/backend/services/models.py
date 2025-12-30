"""Token使用量统计模型和提示词记录模型"""

from tortoise import fields
from tortoise.models import Model


class TokenUsageRecord(Model):
    """Token使用量记录模型"""

    id = fields.IntField(pk=True, description="记录ID")
    user_id = fields.IntField(index=True, description="用户ID")
    project_id = fields.IntField(null=True, index=True, description="项目ID（可选）")

    # Token统计
    prompt_tokens = fields.IntField(description="提示词Token数")
    completion_tokens = fields.IntField(description="生成内容Token数")
    total_tokens = fields.IntField(description="总Token数")

    # 请求元数据
    model = fields.CharField(max_length=100, description="使用的AI模型")
    endpoint = fields.CharField(max_length=255, description="请求的API端点")

    # 时间戳
    created_at = fields.DatetimeField(auto_now_add=True, index=True, description="创建时间")

    class Meta:
        table = "token_usage_records"
        table_description = "Token使用量记录表"
        indexes = [
            ("user_id", "created_at"),
            ("project_id", "created_at"),
        ]

    def __str__(self):
        return f"TokenUsageRecord(id={self.id}, user_id={self.user_id}, total_tokens={self.total_tokens})"


class PromptRecord(Model):
    """提示词记录模型"""

    id = fields.IntField(pk=True, description="记录ID")
    user_id = fields.IntField(index=True, description="用户ID")
    project_id = fields.IntField(null=True, index=True, description="项目ID（可选）")

    # 提示词内容
    system_prompt = fields.TextField(description="系统提示词")
    user_prompt = fields.TextField(description="用户提示词")

    # 请求元数据
    model = fields.CharField(max_length=100, null=True, description="使用的AI模型")
    endpoint = fields.CharField(max_length=255, description="请求的API端点")
    temperature = fields.FloatField(null=True, description="温度参数")

    # 时间戳
    created_at = fields.DatetimeField(auto_now_add=True, index=True, description="创建时间")

    class Meta:
        table = "prompt_records"
        table_description = "提示词记录表"
        indexes = [
            ("user_id", "created_at"),
            ("project_id", "created_at"),
        ]

    def __str__(self):
        return f"PromptRecord(id={self.id}, user_id={self.user_id}, endpoint={self.endpoint})"
