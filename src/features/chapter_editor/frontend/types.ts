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
