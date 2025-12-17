import { httpClient } from '@/frontend/core/http'
import type { AxiosResponse } from 'axios'
import type { components } from '@/frontend/core/types/generated'

// 从生成的类型中提取需要的类型
type ChapterResponse = components['schemas']['ChapterResponse']
type ChapterListResponse = components['schemas']['ChapterListResponse']
type ChapterCreate = components['schemas']['ChapterCreate']
type ChapterUpdate = components['schemas']['ChapterUpdate']

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
  async getChapters(projectId: number): Promise<ChapterListResponse> {
    const response: AxiosResponse<ChapterListResponse> = await httpClient.get(
      `/novel_projects/${projectId}/chapters/`
    )
    return response.data
  },

  /**
   * 获取章节详情
   * @param projectId 项目ID
   * @param chapterId 章节ID
   */
  async getChapter(projectId: number, chapterId: string): Promise<ChapterResponse> {
    const response: AxiosResponse<ChapterResponse> = await httpClient.get(
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
  }
}