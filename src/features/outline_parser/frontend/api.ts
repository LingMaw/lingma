/**
 * 大纲解析器 API
 */

import { httpClient } from '@/frontend/core/http'

export interface ParseRequest {
  text: string
  format?: 'auto' | 'markdown' | 'numbered' | 'indent'
}

export interface ChapterPreview {
  title: string
  outline_description: string
  preview: string
}

export interface ParseResponse {
  chapters: ChapterPreview[]
  total_count: number
  detected_format: string
}

export interface ChapterCreateData {
  title: string
  outline_description: string
}

export interface CreateChaptersRequest {
  project_id: number
  chapters: ChapterCreateData[]
}

export interface CreateChaptersResponse {
  created_count: number
  chapter_ids: string[]
  message: string
}

export const outlineParserAPI = {
  /**
   * 解析大纲文本
   */
  async parse(request: ParseRequest): Promise<ParseResponse> {
    const { data } = await httpClient.post('/outline-parser/parse', {
      text: request.text,
      format: request.format || 'auto',
    })
    return data
  },

  /**
   * 批量创建章节
   */
  async createChapters(
    request: CreateChaptersRequest
  ): Promise<CreateChaptersResponse> {
    const { data } = await httpClient.post(
      '/outline-parser/create-chapters',
      request
    )
    return data
  },
}
