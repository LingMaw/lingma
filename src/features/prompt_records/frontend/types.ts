/**
 * 提示词记录相关类型定义
 */

export interface PromptRecordResponse {
  id: number
  user_id: number
  project_id: number | null
  system_prompt: string
  user_prompt: string
  model: string | null
  endpoint: string
  temperature: number | null
  created_at: string
}

export interface PromptRecordListResponse {
  total: number
  page: number
  page_size: number
  records: PromptRecordResponse[]
}

export interface PromptRecordQueryParams {
  page?: number
  page_size?: number
  project_id?: number | null
  endpoint?: string | null
}
