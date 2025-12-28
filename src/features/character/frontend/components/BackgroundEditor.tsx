/**
 * 背景故事编辑组件
 * 用于编辑角色的背景故事信息
 */

import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  Paper,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { itemVariants } from '@/frontend/core/animation'
import type { CharacterFormData } from '@/features/character/frontend/types'

interface BackgroundEditorProps {
  formData: CharacterFormData
  onFormChange: (data: CharacterFormData) => void
  onSave: (data: CharacterFormData) => Promise<void>
}

export default function BackgroundEditor({
  formData,
  onFormChange,
  onSave,
}: BackgroundEditorProps) {
  const [loading, setLoading] = useState(false)

  const background = formData.background || {}
  const keyEvents = background.key_events || []

  const updateBackground = (field: string, value: any) => {
    onFormChange({
      ...formData,
      background: {
        ...formData.background,
        [field]: value,
      },
    })
  }

  const addKeyEvent = () => {
    const newEvents = [...keyEvents, { time: '', event: '', impact: '' }]
    updateBackground('key_events', newEvents)
  }

  const updateKeyEvent = (index: number, field: string, value: string) => {
    const newEvents = [...keyEvents]
    newEvents[index] = { ...newEvents[index], [field]: value }
    updateBackground('key_events', newEvents)
  }

  const removeKeyEvent = (index: number) => {
    const newEvents = keyEvents.filter((_: any, i: number) => i !== index)
    updateBackground('key_events', newEvents)
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
      <Stack spacing={3}>
        <Box component={motion.div} variants={itemVariants}>
          <TextField
            label="出身背景"
            value={background.origin || ''}
            onChange={(e) => updateBackground('origin', e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="描述角色的出身、家庭背景等"
          />
        </Box>

        <Box component={motion.div} variants={itemVariants}>
          <TextField
            label="教育经历"
            value={background.education || ''}
            onChange={(e) => updateBackground('education', e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="角色的教育背景、所学技能等"
          />
        </Box>

        <Box component={motion.div} variants={itemVariants}>
          <TextField
            label="重要经历"
            value={(background.experiences || []).join('\n')}
            onChange={(e) =>
              updateBackground(
                'experiences',
                e.target.value.split('\n').filter((s: string) => s.trim())
              )
            }
            multiline
            rows={4}
            fullWidth
            placeholder="每行一条重要经历"
            helperText="每行输入一条经历"
          />
        </Box>

        {/* 关键事件 */}
        <Box component={motion.div} variants={itemVariants}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={500}>
              关键事件
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addKeyEvent}
              size="small"
            >
              添加事件
            </Button>
          </Stack>

          <Stack spacing={2}>
            {keyEvents.map((event: any, index: number) => (
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
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                      label="时间"
                      value={event.time || ''}
                      onChange={(e) => updateKeyEvent(index, 'time', e.target.value)}
                      size="small"
                      sx={{ width: 150 }}
                      placeholder="如：童年时期"
                    />
                    <TextField
                      label="事件"
                      value={event.event || ''}
                      onChange={(e) => updateKeyEvent(index, 'event', e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="发生了什么"
                    />
                    <IconButton
                      onClick={() => removeKeyEvent(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                  <TextField
                    label="影响"
                    value={event.impact || ''}
                    onChange={(e) => updateKeyEvent(index, 'impact', e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="这件事对角色产生了什么影响"
                  />
                </Stack>
              </Paper>
            ))}

            {keyEvents.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                暂无关键事件，点击上方按钮添加
              </Typography>
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={loading}>
            保存背景故事
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
