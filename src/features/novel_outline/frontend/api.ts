/**
 * 大纲管理API接口封装
 */
import { httpClient } from '@/frontend/core/http'

export interface OutlineNode {
  id: number
  novel_id: number
  parent_id: number | null
  node_type: 'volume' | 'chapter' | 'section'
  title: string
  description: string | null
  position: number
  status: 'draft' | 'editing' | 'completed' | 'locked'
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

export interface OutlineNodeWithChildren extends OutlineNode {
  children: OutlineNodeWithChildren[]
}

export interface OutlineTreeResponse {
  novel_id: number
  root_nodes: OutlineNodeWithChildren[]
  total_nodes: number
}

export interface OutlineNodeCreate {
  parent_id?: number | null
  node_type: 'volume' | 'chapter' | 'section'
  title: string
  description?: string | null
  position?: number
  status?: 'draft' | 'editing' | 'completed' | 'locked'
  metadata?: Record<string, unknown>
}

export interface OutlineNodeUpdate {
  title?: string
  description?: string | null
  status?: 'draft' | 'editing' | 'completed' | 'locked'
  metadata?: Record<string, unknown>
}

export interface PositionUpdate {
  parent_id: number | null
  position: number
}

export interface ReorderRequest {
  parent_id: number | null
  node_ids: number[]
}

// ============= AI 生成相关类型 =============

export interface OutlineGenerateRequest {
  theme: string
  genre?: string
  style?: string
  chapter_count_range?: [number, number]
  reference_outline?: string
  key_plots?: string[]
  custom_instructions?: string
  generate_sections?: boolean
}

export interface RegenerateChildrenRequest {
  delete_existing?: boolean
  custom_instructions?: string
  max_children?: number
}

export const outlineAPI = {
  /**
   * 获取项目的完整大纲树
   */
  async getTree(projectId: number): Promise<OutlineTreeResponse> {
    const { data } = await httpClient.get(`/novel-projects/${projectId}/outline`)
    return data
  },

  /**
   * 创建大纲节点
   */
  async createNode(projectId: number, nodeData: OutlineNodeCreate): Promise<OutlineNode> {
    const { data } = await httpClient.post(`/novel-projects/${projectId}/outline`, nodeData)
    return data
  },

  /**
   * 更新大纲节点
   */
  async updateNode(
    projectId: number,
    nodeId: number,
    updateData: OutlineNodeUpdate
  ): Promise<OutlineNode> {
    const { data } = await httpClient.put(
      `/novel-projects/${projectId}/outline/${nodeId}`,
      updateData
    )
    return data
  },

  /**
   * 删除大纲节点
   */
  async deleteNode(
    projectId: number,
    nodeId: number,
    cascade = false
  ): Promise<{ message: string; deleted_count: number }> {
    const { data } = await httpClient.delete(`/novel-projects/${projectId}/outline/${nodeId}`, {
      params: { cascade },
    })
    return data
  },

  /**
   * 更新节点位置
   */
  async updatePosition(
    projectId: number,
    nodeId: number,
    positionData: PositionUpdate
  ): Promise<{ node: OutlineNode; affected_siblings: Array<{ id: number; position: number }> }> {
    const { data } = await httpClient.patch(
      `/novel-projects/${projectId}/outline/${nodeId}/position`,
      positionData
    )
    return data
  },

  /**
   * 批量更新节点顺序
   */
  async reorderNodes(
    projectId: number,
    reorderData: ReorderRequest
  ): Promise<{ message: string; updated_nodes: Array<{ id: number; position: number }> }> {
    const { data } = await httpClient.post(
      `/novel-projects/${projectId}/outline/reorder`,
      reorderData
    )
    return data
  },

  /**
   * AI 生成完整大纲 (返回 SSE URL)
   */
  getGenerateOutlineUrl(projectId: number): string {
    return `/novel-projects/${projectId}/outline/generate`
  },

  /**
   * 重新生成子节点 (返回 SSE URL)
   */
  getRegenerateChildrenUrl(projectId: number, nodeId: number): string {
    return `/novel-projects/${projectId}/outline/nodes/${nodeId}/regenerate-children`
  },
}
