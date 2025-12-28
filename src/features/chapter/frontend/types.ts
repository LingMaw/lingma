/**
 * 章节系统类型定义
 */

import type { components } from '@/frontend/core/types/generated'

// 导出类型别名
export type ChapterResponse = components['schemas']['ChapterResponse']
export type ChapterListItem = components['schemas']['ChapterListItem']
export type ChapterCreate = components['schemas']['ChapterCreate']
export type ChapterUpdate = components['schemas']['ChapterUpdate']
export type ChapterWithHints = components['schemas']['ChapterWithHints']

// 章节状态
export type ChapterStatus = 'draft' | 'completed' | 'ai_generated'
