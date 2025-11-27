import type { NovelState } from './types'

// 选项数据
export const GENRE_OPTIONS = [
  '科幻', '奇幻', '悬疑', '爱情', '历史', '军事', '都市', '武侠', '仙侠', '游戏', '体育', '灵异'
]

export const STYLE_OPTIONS = [
  '现实主义', '浪漫主义', '古典主义', '现代主义', '魔幻现实主义', '黑色幽默', '意识流', '自然主义'
]

// 初始状态
export const INITIAL_STATE: NovelState = {
  form: {
    title: '',
    genre: '',
    style: '',
    requirement: '',
  },
  content: {
    generated: '',
    streaming: '',
  },
  isStreaming: false,
  showChatPanel: false,
}
