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
    "chapter_number" INT NOT NULL /* [废弃] 章节序号（运行时计算） */,
    "title" VARCHAR(200) NOT NULL /* [废弃] 章节标题（从 OutlineNode 读取） */,
    "project_id" INT NOT NULL /* [废弃] 所属项目ID（通过 outline_node_id 获取） */,
    "outline_description" TEXT /* [废弃] 大纲结构化描述（迁移到 OutlineNode.description） */,
    "content" TEXT /* 正文内容 */,
    "outline_node_id" INT /* 关联的大纲节点ID(chapter类型) */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 最后修改时间 */
) /* 章节模型（阶段三优化后 - 逻辑层面） */;
CREATE INDEX IF NOT EXISTS "idx_chapters_outline_dac714" ON "chapters" ("outline_node_id");
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
CREATE TABLE IF NOT EXISTS "outline_nodes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "novel_id" BIGINT NOT NULL /* 所属小说项目ID */,
    "parent_id" INT /* 父节点ID,null表示顶层节点 */,
    "node_type" VARCHAR(20) NOT NULL /* 节点类型: volume\/chapter\/section */,
    "title" VARCHAR(200) NOT NULL /* 节点标题 */,
    "description" TEXT /* 节点描述\/大纲内容 */,
    "position" INT NOT NULL DEFAULT 0 /* 在同级节点中的位置序号 */,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft' /* 节点状态: draft\/editing\/completed\/locked */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 最后更新时间 */,
    "metadata" JSON NOT NULL /* 扩展元数据(JSON格式) */
) /* 大纲节点模型 */;
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
