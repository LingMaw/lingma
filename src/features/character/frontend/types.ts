/**
 * 人物设定系统前端类型定义
 * 扩展后端生成的类型
 */

// 基础类型将从生成的types中导入
// 这里定义前端特有的扩展类型

/**
 * 角色模板(将从生成的types导入)
 */
export interface CharacterTemplate {
  id: number
  name: string
  description?: string
  category?: string
  basic_info: Record<string, any>
  background: Record<string, any>
  personality: Record<string, any>
  abilities: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * 角色(将从生成的types导入)
 */
export interface Character {
  id: number
  project_id?: number
  template_id?: number
  name: string
  basic_info: Record<string, any>
  background: Record<string, any>
  personality: Record<string, any>
  abilities: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * 角色关系(将从生成的types导入)
 */
export interface CharacterRelation {
  id: number
  source_character_id: number
  target_character_id: number
  relation_type: string
  strength: number
  description?: string
  timeline?: string
  is_bidirectional: boolean
  created_at: string
  updated_at: string
}

/**
 * 关系图节点
 */
export interface RelationGraphNode {
  id: number
  name: string
  category?: string
}

/**
 * 关系图边
 */
export interface RelationGraphLink {
  source: number
  target: number
  relation_type: string
  strength: number
  description?: string
}

/**
 * 关系图数据
 */
export interface RelationGraphData {
  nodes: RelationGraphNode[]
  links: RelationGraphLink[]
}

// ===== 请求类型 =====

/**
 * 创建角色模板请求
 */
export interface CreateCharacterTemplateRequest {
  name: string
  description?: string
  category?: string
  basic_info?: Record<string, any>
  background?: Record<string, any>
  personality?: Record<string, any>
  abilities?: Record<string, any>
}

/**
 * 更新角色模板请求
 */
export interface UpdateCharacterTemplateRequest {
  name?: string
  description?: string
  category?: string
  basic_info?: Record<string, any>
  background?: Record<string, any>
  personality?: Record<string, any>
  abilities?: Record<string, any>
}

/**
 * 创建角色请求
 */
export interface CreateCharacterRequest {
  name: string
  project_id?: number
  template_id?: number
  basic_info?: Record<string, any>
  background?: Record<string, any>
  personality?: Record<string, any>
  abilities?: Record<string, any>
  notes?: string
}

/**
 * 更新角色请求
 */
export interface UpdateCharacterRequest {
  name?: string
  basic_info?: Record<string, any>
  background?: Record<string, any>
  personality?: Record<string, any>
  abilities?: Record<string, any>
  notes?: string
}

/**
 * 创建角色关系请求
 */
export interface CreateCharacterRelationRequest {
  target_character_id: number
  relation_type: string
  strength?: number
  description?: string
  timeline?: string
  is_bidirectional?: boolean
}

/**
 * 更新角色关系请求
 */
export interface UpdateCharacterRelationRequest {
  relation_type?: string
  strength?: number
  description?: string
  timeline?: string
  is_bidirectional?: boolean
}

/**
 * AI生成角色请求
 */
export interface GenerateCharacterRequest {
  character_type?: string
  gender?: string
  age_range?: string
  personality_traits?: string
  background_hint?: string
  abilities_hint?: string
  additional_requirements?: string
  project_id?: number
  user_id?: number
}

// ===== 前端特有类型 =====

/**
 * 角色表单数据(用于表单组件)
 */
export interface CharacterFormData {
  name: string
  basic_info: {
    age?: number | string
    gender?: string
    appearance?: string
    occupation?: string
    location?: string
    aliases?: string[]
    // 兼容后端AI生成的字段
    social_status?: string
  }
  background: {
    origin?: string
    education?: string
    experiences?: string[]
    key_events?: Array<{
      time: string
      event: string
      impact: string
    }>
    // 兼容后端AI生成的字段
    major_events?: string[] | Array<{
      time: string
      event: string
      impact: string
    }>
    current_situation?: string
  }
  personality: {
    traits?: string[]
    habits?: string[]
    values?: string
    goals?: string
    fears?: string[]
    // 兼容后端AI生成的字段
    core_traits?: string[]
    strengths?: string[]
    weaknesses?: string[]
    desires?: string
  }
  abilities: {
    skills?: Array<{
      name: string
      level: number
      description?: string
    }>
    strengths?: string[]
    weaknesses?: string[]
    special_abilities?: string[]
    // 兼容后端AI生成的字段
    combat_ability?: string
    intellectual_ability?: string
    social_ability?: string
    talents?: string
  }
  notes?: string
}

/**
 * 关系类型预设
 */
export const RELATION_TYPES = {
  FAMILY: '家人',
  FRIEND: '朋友',
  ENEMY: '敌人',
  COLLEAGUE: '同事',
  LOVER: '恋人',
  MASTER: '师徒',
  RIVAL: '竞争对手',
  OTHER: '其他',
} as const

/**
 * 角色分类预设
 */
export const CHARACTER_CATEGORIES = {
  PROTAGONIST: '主角',
  SUPPORTING: '配角',
  ANTAGONIST: '反派',
  CAMEO: '龙套',
} as const
