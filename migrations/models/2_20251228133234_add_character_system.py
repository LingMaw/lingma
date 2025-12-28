from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
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
CREATE INDEX IF NOT EXISTS "idx_character_r_target__b93164" ON "character_relations" ("target_character_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "characters";
        DROP TABLE IF EXISTS "character_templates";
        DROP TABLE IF EXISTS "character_relations";"""


MODELS_STATE = (
    "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"
    "5Uane/PcN4N1H954gwl7+9PLj/8DKVy+gA=="
)
