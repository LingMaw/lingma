/**
 * AI生成大纲对话框组件
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
  Slider,
  alpha,
} from '@mui/material'
import { 
  AutoAwesome as AIIcon, 
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

import { outlineAPI, type AIGenerateParams } from '../api'

interface AIOutlineGeneratorProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  projectId: number
}

export default function AIOutlineGenerator({
  open,
  onClose,
  onComplete,
  projectId,
}: AIOutlineGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState('')

  // 表单字段
  const [keyPlots, setKeyPlots] = useState<string[]>([''])
  const [additionalContent, setAdditionalContent] = useState('')
  const [chapterCountRange, setChapterCountRange] = useState<number[]>([10, 50])

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(0)
    setError(null)
    setGeneratedContent('')
    setStatusMessage('准备生成大纲...')

    const params: AIGenerateParams = {
      key_plots: keyPlots.filter(p => p.trim()).length > 0 
        ? keyPlots.filter(p => p.trim()) 
        : undefined,
      additional_content: additionalContent.trim() || undefined,
      chapter_count_min: chapterCountRange[0],
      chapter_count_max: chapterCountRange[1],
    }

    try {
      await outlineAPI.generateWithAIStream(
        projectId,
        params,
        1,
        (data) => {
          // 处理SSE消息
          if (data.type === 'status') {
            setStatusMessage(data.message)
            setProgress((prev) => Math.min(prev + 10, 90))
          } else if (data.type === 'progress') {
            setGeneratedContent((prev) => prev + data.content)
          } else if (data.type === 'complete') {
            setStatusMessage(`生成完成！共创建 ${data.created_count} 个节点`)
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
      setError(err instanceof Error ? err.message : '生成失败')
      setGenerating(false)
    }
  }

  const handleClose = () => {
    if (!generating) {
      setKeyPlots([''])
      setAdditionalContent('')
      setChapterCountRange([10, 50])
      setProgress(0)
      setStatusMessage('')
      setError(null)
      setGeneratedContent('')
      onClose()
    }
  }

  // 添加关键剧情
  const handleAddPlot = () => {
    setKeyPlots([...keyPlots, ''])
  }

  // 删除关键剧情
  const handleRemovePlot = (index: number) => {
    if (keyPlots.length > 1) {
      setKeyPlots(keyPlots.filter((_, i) => i !== index))
    }
  }

  // 更新关键剧情
  const handlePlotChange = (index: number, value: string) => {
    const newPlots = [...keyPlots]
    newPlots[index] = value
    setKeyPlots(newPlots)
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
        AI生成大纲
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* 说明信息 */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>提示：</strong>
              将使用当前项目的<strong>设定、类型、风格</strong>生成大纲。关键剧情点和其他内容可进一步细化大纲结构。
            </Typography>
          </Alert>

          {/* 关键剧情 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                关键剧情点
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddPlot}
                disabled={generating}
                sx={{ borderRadius: 2 }}
              >
                添加剧情
              </Button>
            </Stack>
            <Stack spacing={1}>
              {keyPlots.map((plot, index) => (
                <Stack key={index} direction="row" spacing={1}>
                  <TextField
                    placeholder={`剧情${index + 1}：如"主角觉醒特殊能力"`}
                    value={plot}
                    onChange={(e) => handlePlotChange(index, e.target.value)}
                    disabled={generating}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  {keyPlots.length > 1 && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemovePlot(index)}
                      disabled={generating}
                      sx={{ minWidth: 40, borderRadius: 2 }}
                    >
                      <RemoveIcon fontSize="small" />
                    </Button>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* 其他内容 */}
          <TextField
            label="其他内容/补充说明"
            placeholder="如人物设定、世界观、特殊要求等"
            multiline
            rows={3}
            value={additionalContent}
            onChange={(e) => setAdditionalContent(e.target.value)}
            disabled={generating}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* 章节数范围 */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              章节数范围: {chapterCountRange[0]} - {chapterCountRange[1]} 章
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              AI将根据内容自动决定卷数和每卷章节数
            </Typography>
            
            <Slider
              value={chapterCountRange}
              onChange={(_, value) => setChapterCountRange(value as number[])}
              valueLabelDisplay="auto"
              min={5}
              max={200}
              step={5}
              marks={[
                { value: 5, label: '5' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
                { value: 150, label: '150' },
                { value: 200, label: '200' },
              ]}
              disabled={generating}
              sx={{ mt: 2 }}
            />
          </Box>

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

          {/* 说明 */}
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>警告：</strong>
              生成过程将清空现有大纲，请确保已保存重要内容。AI会根据章节数范围自主决定卷数和结构安排。
            </Typography>
          </Alert>
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
          onClick={handleGenerate}
          variant="contained"
          disabled={generating}
          startIcon={<AIIcon />}
          sx={{ borderRadius: 2 }}
        >
          {generating ? '生成中...' : '开始生成'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
