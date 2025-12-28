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
    "genre" VARCHAR(100) /* 小说类型 */,
    "style" TEXT /* 写作风格 */,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft' /* 项目状态 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "content" TEXT /* 小说内容 */,
    "word_count" INT NOT NULL DEFAULT 0 /* 字数统计 */,
    "chapter_ids" JSON NOT NULL /* 章节ID列表 */,
    "use_chapter_system" INT NOT NULL DEFAULT 0 /* 是否使用章节系统 */,
    "user_id" BIGINT NOT NULL /* 创建用户ID */
) /* 小说项目模型 */;
CREATE TABLE IF NOT EXISTS "outline_nodes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 主键 */,
    "node_type" VARCHAR(20) NOT NULL /* 节点类型：volume\/chapter\/section */,
    "title" VARCHAR(200) NOT NULL /* 节点标题 */,
    "description" TEXT /* 节点描述\/摘要 */,
    "position" INT NOT NULL DEFAULT 0 /* 同级排序位置（0-based） */,
    "is_expanded" INT NOT NULL DEFAULT 1 /* 是否展开（UI状态） */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "parent_id" INT REFERENCES "outline_nodes" ("id") ON DELETE CASCADE /* 父节点（null=根节点） */,
    "project_id" INT NOT NULL REFERENCES "novel_projects" ("id") ON DELETE CASCADE /* 关联项目 */
) /* 大纲节点模型 - 树状结构 */;
CREATE INDEX IF NOT EXISTS "idx_outline_nod_project_753d8f" ON "outline_nodes" ("project_id", "parent_id", "position");
CREATE TABLE IF NOT EXISTS "chapters" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 主键 */,
    "uuid" CHAR(36) NOT NULL UNIQUE /* UUID（用于外部引用） */,
    "title" VARCHAR(200) NOT NULL /* 章节标题 */,
    "content" TEXT NOT NULL /* 正文内容（纯文本） */,
    "chapter_number" INT NOT NULL /* 全局章节编号（1-based） */,
    "word_count" INT NOT NULL DEFAULT 0 /* 字数统计 */,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft' /* 状态：draft\/completed\/ai_generated */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "outline_node_id" INT REFERENCES "outline_nodes" ("id") ON DELETE SET NULL /* 关联大纲节点（可为空） */,
    "project_id" INT NOT NULL REFERENCES "novel_projects" ("id") ON DELETE CASCADE /* 关联项目 */
) /* 章节模型 - 扁平结构 */;
CREATE INDEX IF NOT EXISTS "idx_chapters_project_f3885b" ON "chapters" ("project_id", "chapter_number");
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
