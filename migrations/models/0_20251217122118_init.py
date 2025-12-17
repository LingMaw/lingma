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
CREATE TABLE IF NOT EXISTS "chapters" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "chapter_id" VARCHAR(36) NOT NULL UNIQUE /* 章节UUID */,
    "chapter_number" INT NOT NULL /* 章节序号 */,
    "title" VARCHAR(200) NOT NULL /* 章节标题 */,
    "content" TEXT /* 正文内容 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 最后修改时间 */,
    "project_id" INT NOT NULL /* 所属项目ID */
) /* 章节模型 */;
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
    "chapter_ids" JSON NOT NULL /* 章节ID列表 */,
    "use_chapter_system" INT NOT NULL DEFAULT 0 /* 是否启用章节系统 */,
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
    "+h9oYwDI"
)
