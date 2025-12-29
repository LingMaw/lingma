/**
 * Token统计相关API
 */
import { httpClient } from '@/frontend/core/http'
import type { UserTokenSummary, ProjectTokenSummary, TokenUsageRecord } from './types'

export const tokenStatisticsAPI = {
  /**
   * 获取用户Token使用汇总
   * @param days 统计天数，默认30天
   */
  async getUserSummary(days: number = 30): Promise<UserTokenSummary> {
    const { data } = await httpClient.get<UserTokenSummary>('/statistics/user/summary', {
      params: { days },
    })
    return data
  },

  /**
   * 获取用户最近的Token使用记录
   * @param limit 返回记录数，默认50
   */
  async getUserRecentRecords(limit: number = 50): Promise<TokenUsageRecord[]> {
    const { data } = await httpClient.get<TokenUsageRecord[]>('/statistics/user/recent', {
      params: { limit },
    })
    return data
  },

  /**
   * 获取项目Token使用汇总
   * @param projectId 项目ID
   * @param days 统计天数，默认30天
   */
  async getProjectSummary(projectId: number, days: number = 30): Promise<ProjectTokenSummary> {
    const { data } = await httpClient.get<ProjectTokenSummary>(
      `/statistics/project/${projectId}/summary`,
      {
        params: { days },
      },
    )
    return data
  },
}
