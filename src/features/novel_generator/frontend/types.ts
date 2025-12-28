/**
 * 小说生成器类型定义
 */

// 短篇小说快捷模板类型
export interface ShortStoryTemplate {
  id: string
  name: string
  icon: string
  description: string
  genre: string
  style: string
  plotPoints: string[]
  suggestedLength: string
  requirement: string
}

// API 请求/响应类型
export interface NovelGenerateRequest {
  title: string
  genre?: string
  style?: string
  requirement?: string
}

export interface NovelGenerateResponse {
  title: string
  content: string
  genre?: string
  created_at: string
}

export interface NovelStreamGenerateRequest {
  title: string
  genre?: string
  style?: string
  requirement?: string
}

// 页面状态类型
export interface NovelState {
  form: {
    title: string
    genre: string
    style: string
    requirement: string
  }
  content: {
    generated: string
    streaming: string
  }
  isStreaming: boolean

}

export type NovelAction =
  | { type: 'SET_FIELD'; field: keyof NovelState['form']; value: string }
  | { type: 'SET_CONTENT'; value: string }
  | { type: 'SET_GENERATED_CONTENT'; value: string }
  | { type: 'SET_STREAMING'; isStreaming: boolean }

  | { type: 'RESET_CONTENT' }
  | { type: 'INITIALIZE_STATE'; payload: Partial<NovelState> }
  | { type: 'APPLY_TEMPLATE'; template: ShortStoryTemplate }
