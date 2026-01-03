/**
 * 大纲系统类型定义
 */

import type { components } from '@/frontend/core/types/generated'

// 导出类型别名
export type OutlineNodeResponse = components['schemas']['OutlineNodeResponse']
export type OutlineNodeCreate = components['schemas']['OutlineNodeCreate']
export type OutlineNodeUpdate = components['schemas']['OutlineNodeUpdate']
export type OutlineNodeReorder = components['schemas']['OutlineNodeReorder']
export type OutlineMetaResponse = components['schemas']['OutlineMetaResponse']
export type OutlineMeta = components['schemas']['OutlineMeta']
export type KeyTurningPoint = components['schemas']['KeyTurningPoint']

// 节点类型枚举
export type NodeType = 'volume' | 'chapter' | 'section'

// 树状节点结构(用于前端渲染)
export interface OutlineTreeNode extends OutlineNodeResponse {
  children: OutlineTreeNode[]
}

// 节点操作类型
export type NodeAction = 'create' | 'edit' | 'delete'
