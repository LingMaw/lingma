/**
 * 章节编辑器 API
 */
import { httpClient } from '@/frontend/core/http'

/**
 * 章节编辑器类型定义
 */

export interface ChapterListItem {
  chapter_id: string
  title: string
  word_count: number
  created_at: string
  updated_at: string
  has_outline: boolean
  outline_title: string | null
}

export interface ChapterDetail {
  chapter_id: string
  project_id: number
  title: string
  content: string
  outline_node_id: number | null
  outline_title: string | null
  word_count: number
  created_at: string
  updated_at: string
}

export interface ChapterCreateRequest {
  title: string
  project_id: number
  outline_node_id?: number | null
}

export interface ChapterUpdateRequest {
  title?: string | null
  content?: string | null
  outline_node_id?: number | null
}

export interface OutlineNodeOption {
  id: number
  title: string
  path: string
  has_chapter: boolean
}

export interface ChapterStatusResponse {
  has_chapter: boolean
  chapter_id: string | null
}

export type SaveStatus = 'saved' | 'saving' | 'error'


export const chapterEditorAPI = {
  /**
   * 获取章节列表
   */
  async getChapters(projectId: number): Promise<ChapterListItem[]> {
    const { data } = await httpClient.get(`/chapter-editor/chapters`, {
      params: { project_id: projectId }
    })
    return data
  },

  /**
   * 创建章节（独立创建）
   */
  async createChapter(request: ChapterCreateRequest): Promise<ChapterDetail> {
    const { data } = await httpClient.post('/chapter-editor/chapters', request)
    return data
  },

  /**
   * 从大纲节点创建章节
   */
  async createFromOutline(outlineNodeId: number): Promise<ChapterDetail> {
    const { data } = await httpClient.post('/chapter-editor/chapters/from-outline', {
      outline_node_id: outlineNodeId
    })
    return data
  },

  /**
   * 获取章节详情
   */
  async getChapter(chapterId: string): Promise<ChapterDetail> {
    const { data } = await httpClient.get(`/chapter-editor/chapters/${chapterId}`)
    return data
  },

  /**
   * 更新章节内容
   */
  async updateChapter(chapterId: string, request: ChapterUpdateRequest): Promise<ChapterDetail> {
    const { data } = await httpClient.put(`/chapter-editor/chapters/${chapterId}`, request)
    return data
  },

  /**
   * 删除章节
   */
  async deleteChapter(chapterId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await httpClient.delete(`/chapter-editor/chapters/${chapterId}`)
    return data
  },

  /**
   * 获取可关联的大纲节点
   */
  async getOutlineNodes(projectId: number): Promise<OutlineNodeOption[]> {
    const { data } = await httpClient.get('/chapter-editor/outline-nodes', {
      params: { project_id: projectId }
    })
    return data
  },

  /**
   * 检查节点章节状态
   */
  async getChapterStatus(nodeId: number): Promise<ChapterStatusResponse> {
    const { data } = await httpClient.get(`/chapter-editor/outline-node/${nodeId}/chapter-status`)
    return data
  }
}
