/**
 * 章节系统API
 */

import { httpClient } from '@/frontend/core/http'
import type { components } from '@/frontend/core/types/generated'

// 类型别名
type ChapterResponse = components['schemas']['ChapterResponse']
type ChapterListItem = components['schemas']['ChapterListItem']
type ChapterCreate = components['schemas']['ChapterCreate']
type ChapterUpdate = components['schemas']['ChapterUpdate']
type ChapterWithHints = components['schemas']['ChapterWithHints']

export const chapterAPI = {
  /**
   * 获取项目的所有章节
   */
  async getChapters(projectId: number): Promise<ChapterListItem[]> {
    const { data } = await httpClient.get<ChapterListItem[]>(
      `/novels/chapters/projects/${projectId}`
    )
    return data
  },

  /**
   * 创建章节
   */
  async createChapter(
    projectId: number,
    chapterData: ChapterCreate
  ): Promise<ChapterResponse> {
    const { data } = await httpClient.post<ChapterResponse>(
      `/novels/chapters/projects/${projectId}`,
      chapterData
    )
    return data
  },

  /**
   * 获取章节详情
   */
  async getChapter(chapterId: number): Promise<ChapterResponse> {
    const { data } = await httpClient.get<ChapterResponse>(
      `/novels/chapters/${chapterId}`
    )
    return data
  },

  /**
   * 获取章节详情(包含section提纲)
   */
  async getChapterWithHints(chapterId: number): Promise<ChapterWithHints> {
    const { data } = await httpClient.get<ChapterWithHints>(
      `/novels/chapters/${chapterId}/with-hints`
    )
    return data
  },

  /**
   * 更新章节
   */
  async updateChapter(
    chapterId: number,
    chapterData: ChapterUpdate
  ): Promise<ChapterResponse> {
    const { data } = await httpClient.put<ChapterResponse>(
      `/novels/chapters/${chapterId}`,
      chapterData
    )
    return data
  },

  /**
   * 删除章节
   */
  async deleteChapter(chapterId: number): Promise<void> {
    await httpClient.delete(`/novels/chapters/${chapterId}`)
  },

  /**
   * AI生成章节内容（流式）
   */
  async aiGenerateChapterStream(
    chapterId: number,
    options: {
      requirement?: string
      onChunk: (chunk: string) => void
      onComplete?: () => void
      onError?: (error: Error) => void
    }
  ): Promise<() => void> {
    const controller = new AbortController()
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('未登录')
    }

    try {
      const response = await fetch(
        `${httpClient.defaults.baseURL}/novels/chapters/${chapterId}/ai-generate-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requirement: options.requirement || '',
          }),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              options.onComplete?.()
              break
            }
            const chunk = decoder.decode(value, { stream: true })
            if (chunk) {
              options.onChunk(chunk)
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            options.onError?.(error)
          }
        }
      })()
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        options.onError?.(error)
      }
    }

    return () => controller.abort()
  },

  /**
   * AI续写章节内容（流式）
   */
  async aiContinueChapterStream(
    chapterId: number,
    options: {
      currentContent: string
      requirement?: string
      onChunk: (chunk: string) => void
      onComplete?: () => void
      onError?: (error: Error) => void
    }
  ): Promise<() => void> {
    const controller = new AbortController()
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('未登录')
    }

    try {
      const response = await fetch(
        `${httpClient.defaults.baseURL}/novels/chapters/${chapterId}/ai-continue-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_content: options.currentContent,
            requirement: options.requirement || '',
          }),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              options.onComplete?.()
              break
            }
            const chunk = decoder.decode(value, { stream: true })
            if (chunk) {
              options.onChunk(chunk)
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            options.onError?.(error)
          }
        }
      })()
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        options.onError?.(error)
      }
    }

    return () => controller.abort()
  },

  /**
   * AI优化章节内容（流式）
   */
  async aiOptimizeChapterStream(
    chapterId: number,
    options: {
      content: string
      type: 'general' | 'grammar' | 'style'
      onChunk: (chunk: string) => void
      onComplete?: () => void
      onError?: (error: Error) => void
    }
  ): Promise<() => void> {
    const controller = new AbortController()
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('未登录')
    }

    try {
      const response = await fetch(
        `${httpClient.defaults.baseURL}/novels/chapters/${chapterId}/ai-optimize-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: options.content,
            type: options.type,
          }),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              options.onComplete?.()
              break
            }
            const chunk = decoder.decode(value, { stream: true })
            if (chunk) {
              options.onChunk(chunk)
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            options.onError?.(error)
          }
        }
      })()
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        options.onError?.(error)
      }
    }

    return () => controller.abort()
  },
}
