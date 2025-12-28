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
  return {
    name: character?.name || '',
    basic_info: character?.basic_info || {},
    background: character?.background || {},
    personality: character?.personality || {},
    abilities: character?.abilities || {},
    notes: character?.notes,
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
