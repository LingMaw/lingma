/**
 * 大纲系统API
 */

import { httpClient } from '@/frontend/core/http'
import type { components } from '@/frontend/core/types/generated'

// 类型别名
type OutlineNodeResponse = components['schemas']['OutlineNodeResponse']
type OutlineNodeCreate = components['schemas']['OutlineNodeCreate']
type OutlineNodeUpdate = components['schemas']['OutlineNodeUpdate']
type OutlineNodeReorder = components['schemas']['OutlineNodeReorder']
type SectionHintsResponse = components['schemas']['SectionHintsResponse']

export interface AIGenerateParams {
  key_plots?: string[]
  additional_content?: string
  chapter_count_min?: number
  chapter_count_max?: number
}

export interface ContinueOutlineParams {
  chapter_count: number
  additional_context?: string
}

export interface OutlineExportData {
  project_id: number
  outline: any[]
}

export const outlineAPI = {
  /**
   * 获取项目的所有大纲节点
   */
  async getNodes(projectId: number): Promise<OutlineNodeResponse[]> {
    const { data } = await httpClient.get<OutlineNodeResponse[]>(
      `/novels/outline/projects/${projectId}/nodes`
    )
    return data
  },

  /**
   * 创建大纲节点
   */
  async createNode(
    projectId: number,
    nodeData: OutlineNodeCreate
  ): Promise<OutlineNodeResponse> {
    const { data } = await httpClient.post<OutlineNodeResponse>(
      `/novels/outline/projects/${projectId}/nodes`,
      nodeData
    )
    return data
  },

  /**
   * 更新大纲节点
   */
  async updateNode(
    nodeId: number,
    nodeData: OutlineNodeUpdate
  ): Promise<OutlineNodeResponse> {
    const { data } = await httpClient.put<OutlineNodeResponse>(
      `/novels/outline/nodes/${nodeId}`,
      nodeData
    )
    return data
  },

  /**
   * 删除大纲节点
   */
  async deleteNode(nodeId: number): Promise<void> {
    await httpClient.delete(`/novels/outline/nodes/${nodeId}`)
  },

  /**
   * 拖拽排序
   */
  async reorderNode(
    nodeId: number,
    reorderData: OutlineNodeReorder
  ): Promise<OutlineNodeResponse> {
    const { data } = await httpClient.post<OutlineNodeResponse>(
      `/novels/outline/nodes/${nodeId}/reorder`,
      reorderData
    )
    return data
  },

  /**
   * 获取章节下的section提纲
   */
  async getSectionHints(chapterNodeId: number): Promise<SectionHintsResponse> {
    const { data } = await httpClient.get<SectionHintsResponse>(
      `/novels/outline/nodes/${chapterNodeId}/section-hints`
    )
    return data
  },

  /**
   * AI生成大纲（SSE流式）
   */
  generateWithAI(
    projectId: number,
    params: AIGenerateParams,
    userId: number = 1
  ): EventSource {
    const queryParams = new URLSearchParams({
      user_id: userId.toString(),
    })
    
    // 创建SSE连接
    const eventSource = new EventSource(
      `/api/novels/outline/projects/${projectId}/generate?${queryParams}`,
      {
        withCredentials: false,
      }
    )
    
    // 发送POST请求（由于浏览器EventSource只支持GET，我们需要特殊处理）
    // 这里我们直接使用httpClient发起POST请求
    fetch(`/api/novels/outline/projects/${projectId}/generate?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    
    return eventSource
  },

  /**
   * AI生成大纲（使用fetch API支持SSE）
   */
  async generateWithAIStream(
    projectId: number,
    params: AIGenerateParams,
    userId: number = 1,
    onMessage: (data: any) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/novels/outline/projects/${projectId}/generate?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is null')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          onComplete?.()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onMessage(data)
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      onError?.(error as Error)
      throw error
    }
  },

  /**
   * 导出大纲为Markdown
   */
  async exportMarkdown(projectId: number): Promise<void> {
    const response = await fetch(
      `/api/novels/outline/projects/${projectId}/export/markdown`
    )
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outline_${projectId}.md`
    a.click()
    window.URL.revokeObjectURL(url)
  },

  /**
   * 导出大纲为JSON
   */
  async exportJSON(projectId: number): Promise<OutlineExportData> {
    const { data } = await httpClient.get<OutlineExportData>(
      `/novels/outline/projects/${projectId}/export/json`
    )
    return data
  },

  /**
   * 下载JSON文件
   */
  async downloadJSON(projectId: number): Promise<void> {
    const data = await this.exportJSON(projectId)
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outline_${projectId}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  },

  /**
   * AI续写大纲（SSE流式）
   */
  async continueOutlineStream(
    projectId: number,
    params: ContinueOutlineParams,
    userId: number = 1,
    onMessage: (data: any) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/novels/outline/projects/${projectId}/continue?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is null')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          onComplete?.()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onMessage(data)
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      onError?.(error as Error)
      throw error
    }
  },
}
