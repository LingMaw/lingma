/**
 * 性格特征编辑组件
 * 用于编辑角色的性格特征信息
 */

import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Chip,
  Paper,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { itemVariants } from '@/frontend/core/animation'
import type { CharacterFormData } from '@/features/character/frontend/types'

interface PersonalityEditorProps {
  formData: CharacterFormData
  onFormChange: (data: CharacterFormData) => void
  onSave: (data: CharacterFormData) => Promise<void>
}

// 预设的性格特征标签
const PRESET_TRAITS = [
  '勇敢', '善良', '聪明', '固执', '幽默', '冷静',
  '热情', '谨慎', '乐观', '悲观', '正直', '狡猾',
  '忠诚', '独立', '敏感', '坚强', '温柔', '暴躁',
]

// 预设的习惯标签
const PRESET_HABITS = [
  '早起', '熬夜', '阅读', '运动', '冥想', '收藏',
  '整理', '拖延', '喝咖啡', '听音乐', '写日记', '独处',
]

// 预设的恐惧标签
const PRESET_FEARS = [
  '失去亲人', '孤独', '背叛', '失败', '黑暗', '死亡',
  '被遗忘', '失控', '真相', '过去', '未来', '改变',
]

export default function PersonalityEditor({
  formData,
  onFormChange,
  onSave,
}: PersonalityEditorProps) {
  const [loading, setLoading] = useState(false)
  const [newTrait, setNewTrait] = useState('')
  const [newHabit, setNewHabit] = useState('')
  const [newFear, setNewFear] = useState('')

  const personality = formData.personality || {}
  const traits = personality.traits || []
  const habits = personality.habits || []
  const fears = personality.fears || []

  const updatePersonality = (field: string, value: any) => {
    onFormChange({
      ...formData,
      personality: {
        ...formData.personality,
        [field]: value,
      },
    })
  }

  const addTrait = (trait: string) => {
    if (trait && !traits.includes(trait)) {
      updatePersonality('traits', [...traits, trait])
    }
    setNewTrait('')
  }

  const removeTrait = (trait: string) => {
    updatePersonality('traits', traits.filter((t: string) => t !== trait))
  }

  const addHabit = (habit: string) => {
    if (habit && !habits.includes(habit)) {
      updatePersonality('habits', [...habits, habit])
    }
    setNewHabit('')
  }

  const removeHabit = (habit: string) => {
    updatePersonality('habits', habits.filter((h: string) => h !== habit))
  }

  const addFear = (fear: string) => {
    if (fear && !fears.includes(fear)) {
      updatePersonality('fears', [...fears, fear])
    }
    setNewFear('')
  }

  const removeFear = (fear: string) => {
    updatePersonality('fears', fears.filter((f: string) => f !== fear))
  }

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
      <Stack spacing={4}>
        {/* 性格特征 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            性格特征
          </Typography>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {traits.map((trait: string) => (
                  <Chip
                    key={trait}
                    label={trait}
                    onDelete={() => removeTrait(trait)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="添加性格特征"
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTrait(newTrait)
                    }
                  }}
                  sx={{ width: 200 }}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addTrait(newTrait)}
                  disabled={!newTrait}
                >
                  添加
                </Button>
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  快速添加：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {PRESET_TRAITS.filter((t) => !traits.includes(t)).map((trait) => (
                    <Chip
                      key={trait}
                      label={trait}
                      size="small"
                      onClick={() => addTrait(trait)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* 习惯 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            习惯
          </Typography>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {habits.map((habit: string) => (
                  <Chip
                    key={habit}
                    label={habit}
                    onDelete={() => removeHabit(habit)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="添加习惯"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addHabit(newHabit)
                    }
                  }}
                  sx={{ width: 200 }}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addHabit(newHabit)}
                  disabled={!newHabit}
                >
                  添加
                </Button>
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  快速添加：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {PRESET_HABITS.filter((h) => !habits.includes(h)).map((habit) => (
                    <Chip
                      key={habit}
                      label={habit}
                      size="small"
                      onClick={() => addHabit(habit)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* 价值观与目标 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            价值观与目标
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="核心价值观"
              value={personality.values || ''}
              onChange={(e) => updatePersonality('values', e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="角色最看重什么？信奉什么原则？"
            />
            <TextField
              label="人生目标"
              value={personality.goals || ''}
              onChange={(e) => updatePersonality('goals', e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="角色的终极追求是什么？"
            />
          </Stack>
        </Box>

        {/* 恐惧 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            恐惧与弱点
          </Typography>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {fears.map((fear: string) => (
                  <Chip
                    key={fear}
                    label={fear}
                    onDelete={() => removeFear(fear)}
                    color="error"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="添加恐惧"
                  value={newFear}
                  onChange={(e) => setNewFear(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addFear(newFear)
                    }
                  }}
                  sx={{ width: 200 }}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addFear(newFear)}
                  disabled={!newFear}
                >
                  添加
                </Button>
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  快速添加：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {PRESET_FEARS.filter((f) => !fears.includes(f)).map((fear) => (
                    <Chip
                      key={fear}
                      label={fear}
                      size="small"
                      onClick={() => addFear(fear)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={loading}>
            保存性格特征
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
