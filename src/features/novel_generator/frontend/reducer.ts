import type { NovelState, NovelAction } from './types'

export function reducer(state: NovelState, action: NovelAction): NovelState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value,
        },
      }
    case 'SET_CONTENT':
      return {
        ...state,
        content: {
          ...state.content,
          streaming: action.value,
        },
      }
    case 'SET_GENERATED_CONTENT':
      return {
        ...state,
        content: {
          ...state.content,
          generated: action.value,
        },
      }
    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.isStreaming,
      }
    case 'SET_CHAT_PANEL':
      return {
        ...state,
        showChatPanel: action.show,
      }
    case 'RESET_CONTENT':
      return {
        ...state,
        content: {
          generated: '',
          streaming: '',
        },
      }
    case 'INITIALIZE_STATE':
      return {
        ...state,
        ...action.payload,
      }
    default:
      return state
  }
}
