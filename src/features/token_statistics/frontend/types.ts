/**
 * Token统计相关类型定义
 */

/**
 * Token使用记录
 */
export interface TokenUsageRecord {
  id: number
  user_id: number
  project_id: number | null
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  model: string
  endpoint: string
  created_at: string
}

/**
 * 模型统计数据
 */
export interface ModelStats {
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  request_count: number
}

/**
 * 用户Token使用汇总
 */
export interface UserTokenSummary {
  user_id: number
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  request_count: number
  model_stats: Record<string, ModelStats>
  start_date: string | null
  end_date: string | null
}

/**
 * 项目Token使用汇总
 */
export interface ProjectTokenSummary {
  project_id: number
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  request_count: number
  model_stats: Record<string, ModelStats>
  start_date: string | null
  end_date: string | null
}
