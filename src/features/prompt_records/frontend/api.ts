/**
 * 提示词记录管理 API
 */

import { httpClient } from '@/frontend/core/http'
import type {
  PromptRecordListResponse,
  PromptRecordQueryParams,
  PromptRecordResponse,
} from './types'

export const promptRecordsAPI = {
  /**
   * 获取提示词记录列表（分页）
   */
  async list(params?: PromptRecordQueryParams): Promise<PromptRecordListResponse> {
    const { data } = await httpClient.get<PromptRecordListResponse>('/prompt-records/', {
      params,
    })
    return data
  },

  /**
   * 获取单个提示词记录详情
   */
  async getById(id: number): Promise<PromptRecordResponse> {
    const { data } = await httpClient.get<PromptRecordResponse>(`/prompt-records/${id}`)
    return data
  },
}
