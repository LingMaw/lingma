from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "token_usage_records" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 记录ID */,
    "user_id" INT NOT NULL /* 用户ID */,
    "project_id" INT /* 项目ID（可选） */,
    "prompt_tokens" INT NOT NULL /* 提示词Token数 */,
    "completion_tokens" INT NOT NULL /* 生成内容Token数 */,
    "total_tokens" INT NOT NULL /* 总Token数 */,
    "model" VARCHAR(100) NOT NULL /* 使用的AI模型 */,
    "endpoint" VARCHAR(255) NOT NULL /* 请求的API端点 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */
) /* Token使用量记录表 */;
CREATE INDEX IF NOT EXISTS "idx_token_usage_user_id_166f55" ON "token_usage_records" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_token_usage_project_37c7ed" ON "token_usage_records" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_token_usage_created_c825d0" ON "token_usage_records" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_token_usage_user_id_f0ec15" ON "token_usage_records" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_token_usage_project_174ffe" ON "token_usage_records" ("project_id", "created_at");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "token_usage_records";"""


MODELS_STATE = (
    "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"
)
