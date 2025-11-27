from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 用户ID */,
    "username" VARCHAR(50) NOT NULL UNIQUE /* 用户名 */,
    "hashed_password" VARCHAR(128) NOT NULL /* 加密后的密码 */,
    "email" VARCHAR(100) NOT NULL UNIQUE /* 邮箱 */,
    "nickname" VARCHAR(50) /* 昵称 */,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user' /* 角色 */,
    "is_active" INT NOT NULL DEFAULT 1 /* 是否激活 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */
) /* 用户表 */;
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 设置ID */,
    "key" VARCHAR(100) NOT NULL /* 设置键 */,
    "value" TEXT NOT NULL /* 设置值 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE /* 关联用户 */,
    CONSTRAINT "uid_user_settin_user_id_9a41ca" UNIQUE ("user_id", "key")
) /* 用户设置表 */;
CREATE TABLE IF NOT EXISTS "novel_projects" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" VARCHAR(200) NOT NULL /* 项目标题 */,
    "description" TEXT /* 项目描述 */,
    "genre" VARCHAR(50) /* 小说类型 */,
    "style" VARCHAR(50) /* 写作风格 */,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft' /* 项目状态 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "content" TEXT /* 小说内容 */,
    "word_count" INT NOT NULL DEFAULT 0 /* 字数统计 */,
    "user_id" BIGINT NOT NULL /* 创建用户ID */
) /* 小说项目模型 */;
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
    "awlFOuryECkdDaViV/qAQdPHy+N/CJRlFQ=="
)
