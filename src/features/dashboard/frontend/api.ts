/**
 * 仪表盘功能 API
 */
import { httpClient } from '@/frontend/core/http'

export interface NovelStatistics {
  project_count: number
  chapter_count: number
  outline_node_count: number
  total_words: number
}

export interface AppOverview {
  api_count: number
  feature_count: number
  db_status: string
  environment: string
  novel_stats: NovelStatistics
}

export interface SystemResource {
  name: string
  usage: number
  total: string
  used: string
}

export interface SystemInfo {
  cpu: SystemResource
  memory: SystemResource
  disk: SystemResource
  uptime: string
  uptime_seconds: number
  version: string
  os: string
}

// 新增类型定义
export interface RecentProjectItem {
  id: number
  title: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  word_count: number
  chapter_count: number
  updated_at: string
  cover_color: string
}

export interface RecentProjectsResponse {
  items: RecentProjectItem[]
  total_count: number
}

export interface SystemInfoSummary {
  version: string
  environment: string
  db_status: string
}

/**
 * 仪表盘 API
 */
export const dashboardAPI = {
  /**
   * 获取应用概览数据
   */
  async getOverview() {
    const response = await httpClient.get<AppOverview>('/dashboard/overview')
    return response.data
  },

  /**
   * 获取系统信息
   */
  async getSystemInfo() {
    const response = await httpClient.get<SystemInfo>('/dashboard/system')
    return response.data
  },

  /**
   * 获取最近项目列表
   */
  async getRecentProjects() {
    const response = await httpClient.get<RecentProjectsResponse>('/dashboard/recent-projects')
    return response.data
  },

  /**
   * 获取创作统计数据
   */
  async getStatistics() {
    const response = await httpClient.get<NovelStatistics>('/dashboard/statistics')
    return response.data
  },

  /**
   * 获取系统信息摘要
   */
  async getSystemSummary() {
    const response = await httpClient.get<SystemInfoSummary>('/dashboard/system-summary')
    return response.data
  },
}
