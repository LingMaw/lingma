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
    "avatar" VARCHAR(255) /* 头像URL */,
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
)
