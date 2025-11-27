import { httpClient } from '@/frontend/core/http'
import type { AxiosResponse } from 'axios'
import type { components } from '@/frontend/core/types/generated'

// 从生成的类型中提取需要的类型
type NovelProjectResponse = components['schemas']['NovelProjectResponse']
type NovelProjectListResponse = components['schemas']['NovelProjectListResponse']
type NovelProjectCreate = components['schemas']['NovelProjectCreate']
type NovelProjectUpdate = components['schemas']['NovelProjectUpdate']

/**
 * 小说项目管理API
 */
export const novelProjectAPI = {
  /**
   * 获取小说项目列表
   * @param params 查询参数
   */
  async getProjects(params?: { page?: number; size?: number; status?: string }): Promise<NovelProjectListResponse> {
    const response: AxiosResponse<NovelProjectListResponse> = await httpClient.get('/novel_projects/', { params })
    return response.data
  },

  /**
   * 获取小说项目详情
   * @param id 项目ID
   */
  async getProject(id: number): Promise<NovelProjectResponse> {
    const response: AxiosResponse<NovelProjectResponse> = await httpClient.get(`/novel_projects/${id}`)
    return response.data
  },

  /**
   * 创建小说项目
   * @param data 项目创建数据
   */
  async createProject(data: NovelProjectCreate): Promise<NovelProjectResponse> {
    const response: AxiosResponse<NovelProjectResponse> = await httpClient.post('/novel_projects/', data)
    return response.data
  },

  /**
   * 更新小说项目
   * @param id 项目ID
   * @param data 项目更新数据
   */
  async updateProject(id: number, data: NovelProjectUpdate): Promise<NovelProjectResponse> {
    const response: AxiosResponse<NovelProjectResponse> = await httpClient.put(`/novel_projects/${id}`, data)
    return response.data
  },

  /**
   * 删除小说项目
   * @param id 项目ID
   */
  async deleteProject(id: number): Promise<void> {
    await httpClient.delete(`/novel_projects/${id}`)
  },

  /**
   * 保存小说内容到项目
   * @param projectId 项目ID
   * @param data 包含小说内容和标题的数据
   */
  async saveContentToProject(projectId: number, data: { content: string; title?: string }): Promise<NovelProjectResponse> {
    const response: AxiosResponse<NovelProjectResponse> = await httpClient.post(
      `/novel_projects/${projectId}/save-content`,
      data
    )
    return response.data
  },
}