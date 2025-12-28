/**
 * 能力技能编辑组件
 * 用于编辑角色的能力和技能信息
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
  Slider,
  IconButton,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { itemVariants } from '@/frontend/core/animation'
import type { CharacterFormData } from '@/features/character/frontend/types'

interface AbilitiesEditorProps {
  formData: CharacterFormData
  onFormChange: (data: CharacterFormData) => void
  onSave: (data: CharacterFormData) => Promise<void>
}

interface Skill {
  name: string
  level: number
  description?: string
}

export default function AbilitiesEditor({
  formData,
  onFormChange,
  onSave,
}: AbilitiesEditorProps) {
  const [loading, setLoading] = useState(false)
  const [newStrength, setNewStrength] = useState('')
  const [newWeakness, setNewWeakness] = useState('')
  const [newSpecial, setNewSpecial] = useState('')

  const abilities = formData.abilities || {}
  const skills: Skill[] = abilities.skills || []
  const strengths: string[] = abilities.strengths || []
  const weaknesses: string[] = abilities.weaknesses || []
  const specialAbilities: string[] = abilities.special_abilities || []

  const updateAbilities = (field: string, value: any) => {
    onFormChange({
      ...formData,
      abilities: {
        ...formData.abilities,
        [field]: value,
      },
    })
  }

  // 技能相关操作
  const addSkill = () => {
    const newSkills = [...skills, { name: '', level: 5, description: '' }]
    updateAbilities('skills', newSkills)
  }

  const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
    const newSkills = [...skills]
    newSkills[index] = { ...newSkills[index], [field]: value }
    updateAbilities('skills', newSkills)
  }

  const removeSkill = (index: number) => {
    const newSkills = skills.filter((_, i) => i !== index)
    updateAbilities('skills', newSkills)
  }

  // 优势相关操作
  const addStrength = (strength: string) => {
    if (strength && !strengths.includes(strength)) {
      updateAbilities('strengths', [...strengths, strength])
    }
    setNewStrength('')
  }

  const removeStrength = (strength: string) => {
    updateAbilities('strengths', strengths.filter((s) => s !== strength))
  }

  // 劣势相关操作
  const addWeakness = (weakness: string) => {
    if (weakness && !weaknesses.includes(weakness)) {
      updateAbilities('weaknesses', [...weaknesses, weakness])
    }
    setNewWeakness('')
  }

  const removeWeakness = (weakness: string) => {
    updateAbilities('weaknesses', weaknesses.filter((w) => w !== weakness))
  }

  // 特殊能力相关操作
  const addSpecialAbility = (ability: string) => {
    if (ability && !specialAbilities.includes(ability)) {
      updateAbilities('special_abilities', [...specialAbilities, ability])
    }
    setNewSpecial('')
  }

  const removeSpecialAbility = (ability: string) => {
    updateAbilities('special_abilities', specialAbilities.filter((a) => a !== ability))
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

  const getLevelLabel = (level: number) => {
    if (level <= 2) return '入门'
    if (level <= 4) return '熟练'
    if (level <= 6) return '精通'
    if (level <= 8) return '大师'
    return '宗师'
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        {/* 技能列表 */}
        <Box component={motion.div} variants={itemVariants}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={500}>
              技能列表
            </Typography>
            <Button startIcon={<AddIcon />} onClick={addSkill} size="small">
              添加技能
            </Button>
          </Stack>

          <Stack spacing={2}>
            {skills.map((skill, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.6),
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="技能名称"
                      value={skill.name}
                      onChange={(e) => updateSkill(index, 'name', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                      placeholder="如：剑术、魔法..."
                    />
                    <IconButton
                      onClick={() => removeSkill(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  <Box sx={{ px: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        熟练度
                      </Typography>
                      <Chip
                        label={`${getLevelLabel(skill.level)} (${skill.level}/10)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    <Slider
                      value={skill.level}
                      onChange={(_, value) => updateSkill(index, 'level', value as number)}
                      min={1}
                      max={10}
                      marks
                      sx={{ width: '100%' }}
                    />
                  </Box>

                  <TextField
                    label="技能描述"
                    value={skill.description || ''}
                    onChange={(e) => updateSkill(index, 'description', e.target.value)}
                    size="small"
                    multiline
                    rows={2}
                    fullWidth
                    placeholder="这项技能的具体表现..."
                  />
                </Stack>
              </Paper>
            ))}

            {skills.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                暂无技能，点击上方按钮添加
              </Typography>
            )}
          </Stack>
        </Box>

        {/* 优势 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            优势
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
                {strengths.map((strength) => (
                  <Chip
                    key={strength}
                    label={strength}
                    onDelete={() => removeStrength(strength)}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="添加优势"
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addStrength(newStrength)
                    }
                  }}
                  sx={{ width: 200 }}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addStrength(newStrength)}
                  disabled={!newStrength}
                >
                  添加
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* 劣势 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            劣势
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
                {weaknesses.map((weakness) => (
                  <Chip
                    key={weakness}
                    label={weakness}
                    onDelete={() => removeWeakness(weakness)}
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="添加劣势"
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addWeakness(newWeakness)
                    }
                  }}
                  sx={{ width: 200 }}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addWeakness(newWeakness)}
                  disabled={!newWeakness}
                >
                  添加
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* 特殊能力 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="subtitle1" fontWeight={500} mb={2}>
            特殊能力
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
                {specialAbilities.map((ability) => (
                  <Chip
                    key={ability}
                    label={ability}
                    onDelete={() => removeSpecialAbility(ability)}
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="添加特殊能力"
                  value={newSpecial}
                  onChange={(e) => setNewSpecial(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSpecialAbility(newSpecial)
                    }
                  }}
                  sx={{ width: 200 }}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addSpecialAbility(newSpecial)}
                  disabled={!newSpecial}
                >
                  添加
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={loading}>
            保存能力技能
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
