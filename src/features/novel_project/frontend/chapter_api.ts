import { httpClient } from '@/frontend/core/http'
import type { AxiosResponse } from 'axios'
import type { components } from '@/frontend/core/types/generated'

// 从生成的类型中提取需要的类型
type ChapterResponse = components['schemas']['ChapterResponse']
type ChapterListItemResponse = components['schemas']['ChapterListItemResponse']
type ChapterCreate = components['schemas']['ChapterCreate']
type ChapterUpdate = components['schemas']['ChapterUpdate']
type OutlineChapterListResponse = components['schemas']['OutlineChapterListResponse']
type ChapterGenerateRequest = components['schemas']['ChapterGenerateRequest']
type ChapterWithMetadata = components['schemas']['ChapterWithMetadata']

/**
 * 章节管理API
 */
export const chapterAPI = {
  /**
   * 创建章节
   * @param projectId 项目ID
   * @param data 章节创建数据
   */
  async createChapter(projectId: number, data: ChapterCreate): Promise<ChapterResponse> {
    const response: AxiosResponse<ChapterResponse> = await httpClient.post(
      `/novel_projects/${projectId}/chapters/`,
      data
    )
    return response.data
  },

  /**
   * 获取章节列表
   * @param projectId 项目ID
   */
  async getChapters(projectId: number): Promise<ChapterListItemResponse> {
    const response: AxiosResponse<ChapterListItemResponse> = await httpClient.get(
      `/novel_projects/${projectId}/chapters/`
    )
    return response.data
  },

  /**
   * 获取章节详情
   * @param projectId 项目ID
   * @param chapterId 章节ID
   */
  async getChapter(projectId: number, chapterId: string): Promise<ChapterWithMetadata> {
    const response: AxiosResponse<ChapterWithMetadata> = await httpClient.get(
      `/novel_projects/${projectId}/chapters/${chapterId}`
    )
    return response.data
  },

  /**
   * 更新章节
   * @param projectId 项目ID
   * @param chapterId 章节ID
   * @param data 章节更新数据
   */
  async updateChapter(
    projectId: number,
    chapterId: string,
    data: ChapterUpdate
  ): Promise<ChapterResponse> {
    const response: AxiosResponse<ChapterResponse> = await httpClient.put(
      `/novel_projects/${projectId}/chapters/${chapterId}`,
      data
    )
    return response.data
  },

  /**
   * 删除章节
   * @param projectId 项目ID
   * @param chapterId 章节ID
   */
  async deleteChapter(projectId: number, chapterId: string): Promise<void> {
    await httpClient.delete(`/novel_projects/${projectId}/chapters/${chapterId}`)
  },

  /**
   * 更新章节顺序
   * @param projectId 项目ID
   * @param chapterIds 章节ID列表
   */
  async updateChapterOrder(projectId: number, chapterIds: string[]): Promise<void> {
    await httpClient.put(`/novel_projects/${projectId}/chapters/order`, {
      chapter_ids: chapterIds
    })
  },

  /**
   * 获取可绑定的大纲章节列表
   * @param projectId 项目ID
   */
  async getOutlineChapters(projectId: number): Promise<OutlineChapterListResponse> {
    const response: AxiosResponse<OutlineChapterListResponse> = await httpClient.get(
      `/novel_projects/${projectId}/outline-chapters`
    )
    return response.data
  },

  /**
   * AI生成章节内容（流式）
   * @param projectId 项目ID
   * @param chapterId 章节UUID
   * @param params 生成参数
   * @param signal AbortSignal用于取消请求
   */
  async generateChapterStream(
    projectId: number,
    chapterId: string,
    params: ChapterGenerateRequest,
    signal?: AbortSignal
  ): Promise<Response> {
    // 直接使用fetch调用SSE接口
    const baseURL = httpClient.defaults.baseURL || ''
    const url = `${baseURL}/novel_projects/${projectId}/chapters/${chapterId}/generate`
    
    // 构建fetch兼容的headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // 添加Authorization token（复用httpClient的逻辑）
    const token = localStorage.getItem('token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal
    })
    
    if (!response.ok) {
      throw new Error(`生成失败: ${response.statusText}`)
    }
    
    return response
  }
}