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
CREATE TABLE IF NOT EXISTS "character_templates" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 主键 */,
    "name" VARCHAR(200) NOT NULL /* 模板名称 */,
    "description" TEXT /* 模板描述 */,
    "category" VARCHAR(50) /* 模板分类(主角\/配角\/反派等) */,
    "basic_info" JSON NOT NULL /* 基本信息(年龄、性别、外貌等) */,
    "background" JSON NOT NULL /* 背景故事 */,
    "personality" JSON NOT NULL /* 性格特征 */,
    "abilities" JSON NOT NULL /* 能力技能 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */
) /* 角色模板模型 */;
CREATE TABLE IF NOT EXISTS "characters" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 主键 */,
    "name" VARCHAR(200) NOT NULL /* 角色名称 */,
    "basic_info" JSON NOT NULL /* 基本信息 */,
    "background" JSON NOT NULL /* 背景故事 */,
    "personality" JSON NOT NULL /* 性格特征 */,
    "abilities" JSON NOT NULL /* 能力技能 */,
    "notes" TEXT /* 其他备注 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "project_id" INT REFERENCES "novel_projects" ("id") ON DELETE CASCADE /* 所属项目(NULL表示全局角色) */,
    "template_id" INT REFERENCES "character_templates" ("id") ON DELETE SET NULL /* 来源模板(仅记录,不级联删除) */
) /* 角色模型 */;
CREATE INDEX IF NOT EXISTS "idx_characters_project_e32a9f" ON "characters" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_characters_templat_bda68e" ON "characters" ("template_id");
CREATE TABLE IF NOT EXISTS "character_relations" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 主键 */,
    "relation_type" VARCHAR(50) NOT NULL /* 关系类型(家人\/朋友\/敌人等) */,
    "strength" INT NOT NULL DEFAULT 5 /* 关系强度(1-10) */,
    "description" TEXT /* 关系描述 */,
    "timeline" TEXT /* 关系时间线 */,
    "is_bidirectional" INT NOT NULL DEFAULT 0 /* 是否双向关系 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 更新时间 */,
    "source_character_id" INT NOT NULL REFERENCES "characters" ("id") ON DELETE CASCADE /* 源角色 */,
    "target_character_id" INT NOT NULL REFERENCES "characters" ("id") ON DELETE CASCADE /* 目标角色 */,
    CONSTRAINT "uid_character_r_source__ea3d82" UNIQUE ("source_character_id", "target_character_id")
) /* 角色关系模型 */;
CREATE INDEX IF NOT EXISTS "idx_character_r_source__fe6159" ON "character_relations" ("source_character_id");
CREATE INDEX IF NOT EXISTS "idx_character_r_target__b93164" ON "character_relations" ("target_character_id");
CREATE TABLE IF NOT EXISTS "prompt_records" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL /* 记录ID */,
    "user_id" INT NOT NULL /* 用户ID */,
    "project_id" INT /* 项目ID（可选） */,
    "system_prompt" TEXT NOT NULL /* 系统提示词 */,
    "user_prompt" TEXT NOT NULL /* 用户提示词 */,
    "model" VARCHAR(100) /* 使用的AI模型 */,
    "endpoint" VARCHAR(255) NOT NULL /* 请求的API端点 */,
    "temperature" REAL /* 温度参数 */,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP /* 创建时间 */
) /* 提示词记录表 */;
CREATE INDEX IF NOT EXISTS "idx_prompt_reco_user_id_97e3f8" ON "prompt_records" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_reco_project_68dcfb" ON "prompt_records" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_reco_created_95cc08" ON "prompt_records" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_prompt_reco_user_id_92f75e" ON "prompt_records" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_prompt_reco_project_f215bf" ON "prompt_records" ("project_id", "created_at");
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
CREATE INDEX IF NOT EXISTS "idx_token_usage_project_174ffe" ON "token_usage_records" ("project_id", "created_at");
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
