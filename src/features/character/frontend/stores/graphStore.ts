/**
 * 角色关系图谱状态管理
 * 使用 Zustand 管理图谱的筛选、布局等状态
 */

import { create } from 'zustand'
import type { Character, CharacterRelation } from '../types'

export type LayoutType = 'force' | 'hierarchical' | 'circular'

interface GraphStore {
  // 数据
  characters: Character[]
  relations: CharacterRelation[]

  // 筛选
  selectedRelationTypes: string[]
  strengthRange: [number, number]

  // 布局
  currentLayout: LayoutType

  // Actions
  setCharacters: (characters: Character[]) => void
  setRelations: (relations: CharacterRelation[]) => void
  toggleRelationType: (type: string) => void
  setStrengthRange: (range: [number, number]) => void
  setLayout: (layout: LayoutType) => void
  resetFilters: () => void
}

// 默认的关系类型
const DEFAULT_RELATION_TYPES = ['家人', '朋友', '敌人', '恋人', '同事', '师徒', '竞争对手', '其他']

export const useGraphStore = create<GraphStore>((set) => ({
  characters: [],
  relations: [],
  selectedRelationTypes: DEFAULT_RELATION_TYPES,
  strengthRange: [0, 10],
  currentLayout: 'force',

  setCharacters: (characters) => set({ characters }),
  setRelations: (relations) => set({ relations }),

  toggleRelationType: (type) =>
    set((state) => ({
      selectedRelationTypes: state.selectedRelationTypes.includes(type)
        ? state.selectedRelationTypes.filter((t) => t !== type)
        : [...state.selectedRelationTypes, type],
    })),

  setStrengthRange: (range) => set({ strengthRange: range }),
  setLayout: (layout) => set({ currentLayout: layout }),

  resetFilters: () =>
    set({
      selectedRelationTypes: DEFAULT_RELATION_TYPES,
      strengthRange: [0, 10],
    }),
}))
