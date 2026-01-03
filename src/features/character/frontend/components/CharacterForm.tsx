/**
 * 角色表单组件
 * 用于创建和编辑角色信息
 */

import { useState } from 'react'
import { Box, TextField, Button, Stack } from '@mui/material'
import type { Character, CharacterFormData } from '@/features/character/frontend/types'

interface CharacterFormProps {
  character?: Character
  formData?: CharacterFormData
  onFormChange?: (data: CharacterFormData) => void
  onSave: (data: CharacterFormData) => Promise<void>
  onCancel?: () => void
  mode: 'create' | 'edit'
}

// 默认表单数据
export function getDefaultFormData(character?: Character): CharacterFormData {
  if (!character) {
    return {
      name: '',
      basic_info: {},
      background: {},
      personality: {},
      abilities: {},
      notes: undefined,
    }
  }

  // 标准化后端数据以适配前端表单
  const normalizeSkills = (skills: any): Array<{name: string, level: number, description?: string}> => {
    if (!Array.isArray(skills)) return []
    return skills.map((skill: any) => {
      if (typeof skill === 'string') {
        return { name: skill, level: 5, description: '' }
      }
      return skill
    })
  }

  const normalizeKeyEvents = (events: any): Array<{time: string, event: string, impact: string}> => {
    if (!Array.isArray(events)) return []
    return events.map((event: any) => {
      if (typeof event === 'string') {
        return { time: '', event: event, impact: '' }
      }
      return event
    })
  }

  return {
    name: character.name || '',
    basic_info: character.basic_info || {},
    background: {
      ...character.background,
      // 标准化 key_events (可能来自 major_events)
      key_events: normalizeKeyEvents(
        character.background.key_events || character.background.major_events
      ),
      // 确保 experiences 是数组
      experiences: Array.isArray(character.background.experiences) 
        ? character.background.experiences 
        : [],
    },
    personality: {
      ...character.personality,
      // 标准化 traits (可能来自 core_traits)
      traits: Array.isArray(character.personality.traits)
        ? character.personality.traits
        : Array.isArray(character.personality.core_traits)
        ? character.personality.core_traits
        : [],
      // 从 personality.strengths/weaknesses 移动到 abilities (如果存在)
      habits: Array.isArray(character.personality.habits) ? character.personality.habits : [],
      fears: Array.isArray(character.personality.fears) ? character.personality.fears : [],
    },
    abilities: {
      ...character.abilities,
      // 标准化 skills
      skills: normalizeSkills(character.abilities.skills),
      // 优先使用 abilities 中的数据，否则从 personality 中获取
      strengths: Array.isArray(character.abilities.strengths)
        ? character.abilities.strengths
        : Array.isArray(character.personality.strengths)
        ? character.personality.strengths
        : [],
      weaknesses: Array.isArray(character.abilities.weaknesses)
        ? character.abilities.weaknesses
        : Array.isArray(character.personality.weaknesses)
        ? character.personality.weaknesses
        : [],
      special_abilities: Array.isArray(character.abilities.special_abilities)
        ? character.abilities.special_abilities
        : [],
    },
    notes: character.notes,
  }
}

export default function CharacterForm({ 
  character, 
  formData: externalFormData,
  onFormChange,
  onSave, 
  onCancel, 
  mode 
}: CharacterFormProps) {
  // 支持受控和非受控模式
  const [internalFormData, setInternalFormData] = useState<CharacterFormData>(
    getDefaultFormData(character)
  )
  
  const formData = externalFormData ?? internalFormData
  const setFormData = (data: CharacterFormData) => {
    if (onFormChange) {
      onFormChange(data)
    } else {
      setInternalFormData(data)
    }
  }

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          label="角色名称"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          fullWidth
        />

        <TextField
          label="年龄"
          value={formData.basic_info.age || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              basic_info: { ...formData.basic_info, age: e.target.value },
            })
          }
          fullWidth
        />

        <TextField
          label="性别"
          value={formData.basic_info.gender || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              basic_info: { ...formData.basic_info, gender: e.target.value },
            })
          }
          fullWidth
        />

        <TextField
          label="外貌描述"
          value={formData.basic_info.appearance || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              basic_info: { ...formData.basic_info, appearance: e.target.value },
            })
          }
          multiline
          rows={3}
          fullWidth
        />

        <TextField
          label="职业"
          value={formData.basic_info.occupation || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              basic_info: { ...formData.basic_info, occupation: e.target.value },
            })
          }
          fullWidth
        />

        <TextField
          label="备注"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          multiline
          rows={4}
          fullWidth
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          {onCancel && (
            <Button onClick={onCancel} disabled={loading}>
              取消
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={loading}>
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
