/**
 * AI续写大纲对话框组件
 */

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  LinearProgress,
  Box,
  Alert,
  MenuItem,
  alpha,
} from '@mui/material'
import { 
  AutoAwesome as AIIcon, 
  Close as CloseIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

import { outlineAPI } from '../api'

interface ContinueOutlineGeneratorProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  projectId: number
  hasExistingOutline: boolean
}

// 预设章节数选项
const CHAPTER_COUNT_PRESETS = [
  { value: 5, label: '5章(快速续写)' },
  { value: 10, label: '10章(标准续写)' },
  { value: 20, label: '20章(长篇续写)' },
  { value: 0, label: '自定义' },
]

export default function ContinueOutlineGenerator({
  open,
  onClose,
  onComplete,
  projectId,
  hasExistingOutline,
}: ContinueOutlineGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState('')

  // 表单字段
  const [chapterCountPreset, setChapterCountPreset] = useState(10)
  const [customChapterCount, setCustomChapterCount] = useState(10)
  const [additionalContext, setAdditionalContext] = useState('')

  // 计算实际使用的章节数
  const actualChapterCount = chapterCountPreset === 0 ? customChapterCount : chapterCountPreset

  const handleContinue = async () => {
    if (!hasExistingOutline) {
      setError('请先创建初始大纲')
      return
    }

    setGenerating(true)
    setProgress(0)
    setError(null)
    setGeneratedContent('')
    setStatusMessage('准备续写大纲...')

    try {
      await outlineAPI.continueOutlineStream(
        projectId,
        {
          chapter_count: actualChapterCount,
          additional_context: additionalContext.trim() || undefined,
        },
        1,
        (data) => {
          // 处理SSE消息
          if (data.type === 'status') {
            setStatusMessage(data.message)
            setProgress((prev) => Math.min(prev + 10, 90))
          } else if (data.type === 'progress') {
            setGeneratedContent((prev) => prev + data.content)
          } else if (data.type === 'complete') {
            setStatusMessage(`续写完成！共创建 ${data.created_count} 个节点`)
            setProgress(100)
            setTimeout(() => {
              setGenerating(false)
              onComplete()
              handleClose()
            }, 1500)
          } else if (data.type === 'error') {
            setError(data.message)
            setGenerating(false)
          }
        },
        (err) => {
          setError(err.message)
          setGenerating(false)
        },
        () => {
          // 完成回调
          if (!error) {
            setProgress(100)
          }
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '续写失败')
      setGenerating(false)
    }
  }

  const handleClose = () => {
    if (!generating) {
      setChapterCountPreset(10)
      setCustomChapterCount(10)
      setAdditionalContext('')
      setProgress(0)
      setStatusMessage('')
      setError(null)
      setGeneratedContent('')
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
        }}
      >
        <AIIcon color="primary" />
        AI续写大纲
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* 说明信息 */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>提示：</strong>
              将基于现有大纲的风格和内容续写后续章节，系统会自动提取现有大纲作为上下文。
            </Typography>
          </Alert>

          {/* 续写章节数 */}
          <TextField
            select
            label="续写章节数"
            value={chapterCountPreset}
            onChange={(e) => setChapterCountPreset(Number(e.target.value))}
            disabled={generating}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          >
            {CHAPTER_COUNT_PRESETS.map((preset) => (
              <MenuItem key={preset.value} value={preset.value}>
                {preset.label}
              </MenuItem>
            ))}
          </TextField>

          {/* 自定义章节数 */}
          {chapterCountPreset === 0 && (
            <TextField
              type="number"
              label="自定义章节数"
              value={customChapterCount}
              onChange={(e) => setCustomChapterCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              disabled={generating}
              fullWidth
              inputProps={{ min: 1, max: 100 }}
              helperText="范围：1-100章"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          )}

          {/* 额外指令 */}
          <TextField
            label="额外指令(可选)"
            placeholder="如：加快节奏、引入新角色、增加冲突等"
            multiline
            rows={3}
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            disabled={generating}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* 进度显示 */}
          <AnimatePresence>
            {generating && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {statusMessage}
                </Typography>

                {/* 显示生成的内容片段 */}
                {generatedContent && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                      borderRadius: 2,
                      maxHeight: 200,
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {generatedContent.slice(-500)}
                  </Box>
                )}
              </Box>
            )}
          </AnimatePresence>

          {/* 错误提示 */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* 警告提示 */}
          {!hasExistingOutline && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>提示：</strong>
                当前项目还没有大纲，请先创建初始大纲再使用续写功能。
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={generating}
          startIcon={<CloseIcon />}
          sx={{ borderRadius: 2 }}
        >
          取消
        </Button>
        <Button
          onClick={handleContinue}
          variant="contained"
          disabled={generating || !hasExistingOutline}
          startIcon={<AIIcon />}
          sx={{ borderRadius: 2 }}
        >
          {generating ? '续写中...' : '开始续写'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
