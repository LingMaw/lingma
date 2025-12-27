/**
 * AI生成章节内容面板
 * 
 * 功能：
 * - 展示大纲信息（标题、描述、小节列表）
 * - 自定义参数输入（类型、风格、要求）
 * - SSE流式内容显示
 * - 生成中止功能
 * - 应用到章节的智能提示（检测冲突）
 */
import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  Collapse,
  IconButton,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import { chapterAPI } from '../chapter_api'
import type { components } from '@/frontend/core/types/generated'

type ChapterGenerateRequest = components['schemas']['ChapterGenerateRequest']

export interface AIGenerationPanelProps {
  open: boolean
  onClose: () => void
  chapterId?: string
  outlineNodeId: number | null
  projectId: number
  currentContent?: string
  onGenerated: (content: string, mode: 'replace' | 'append') => void
}

export default function AIGenerationPanel({
  open,
  onClose,
  chapterId,
  outlineNodeId,
  projectId,
  currentContent = '',
  onGenerated
}: AIGenerationPanelProps) {
  const theme = useTheme()
  const abortControllerRef = useRef<AbortController | null>(null)

  const [genre, setGenre] = useState('')
  const [style, setStyle] = useState('')
  const [requirement, setRequirement] = useState('')
  const [useSections, setUseSections] = useState(true)
  const [sectionExpanded, setSectionExpanded] = useState(false)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  // 模拟大纲信息（实际应该从API获取）
  const [outlineInfo] = useState({
    title: '第一章 开端',
    description: '主角登场，世界观展开',
    sections: [
      { title: '第一节 初遇', description: '主角与关键人物相遇' },
      { title: '第二节 转机', description: '发现隐藏的秘密' }
    ]
  })

  useEffect(() => {
    if (!open) {
      // 重置状态
      setGeneratedContent('')
      setIsGenerating(false)
    }
  }, [open])

  const handleGenerate = async () => {
    if (!chapterId) {
      console.error('缺少章节ID')
      return
    }

    setIsGenerating(true)
    setGeneratedContent('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    const params: ChapterGenerateRequest = {
      outline_node_id: outlineNodeId ?? undefined,
      genre: genre || undefined,
      style: style || undefined,
      requirement: requirement || undefined,
      use_sections: useSections
    }

    try {
      const response = await chapterAPI.generateChapterStream(
        projectId,
        chapterId,
        params,
        controller.signal
      )

      if (!response.body) {
        throw new Error('响应体为空')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'chunk') {
                setGeneratedContent((prev) => prev + parsed.content)
              } else if (parsed.type === 'done') {
                console.log('生成完成，总tokens:', parsed.total_tokens)
              } else if (parsed.type === 'error') {
                console.error('生成错误:', parsed.error_message)
                break
              }
            } catch (e) {
              // 忽略无法解析的行
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('生成已取消')
      } else {
        console.error('生成失败:', error)
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleApply = (mode: 'replace' | 'append') => {
    if (generatedContent) {
      onGenerated(generatedContent, mode)
      onClose()
    }
  }

  const handleApplyClick = () => {
    // 检测content是否为空
    if (currentContent && currentContent.trim().length > 0) {
      // 有内容冲突，显示选择对话框
      // 这里简化处理，直接询问
      const choice = window.confirm(
        '当前章节已有内容，是否覆盖？\n\n点击"确定"覆盖，点击"取消"追加到末尾'
      )
      handleApply(choice ? 'replace' : 'append')
    } else {
      // 直接覆盖
      handleApply('replace')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI生成章节内容</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* 大纲信息区域 */}
          {outlineNodeId && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="primary">
                  大纲信息
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setSectionExpanded(!sectionExpanded)}
                >
                  {sectionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Typography variant="body2" sx={{ mt: 1 }}>
                章节：{outlineInfo.title}
              </Typography>
              {outlineInfo.description && (
                <Typography variant="body2" color="text.secondary">
                  描述：{outlineInfo.description}
                </Typography>
              )}

              <Collapse in={sectionExpanded}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    小节数量：{outlineInfo.sections.length}个
                  </Typography>
                  {outlineInfo.sections.map((section, idx) => (
                    <Box key={idx} sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        {idx + 1}. {section.title}
                      </Typography>
                      {section.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          {section.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Paper>
          )}

          {/* 自定义参数区域 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              自定义参数
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="小说类型"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="如：玄幻、都市、科幻"
                size="small"
                fullWidth
              />
              <TextField
                label="写作风格"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="如：简洁明快、细腻抒情"
                size="small"
                fullWidth
              />
              <TextField
                label="额外要求"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="如：重点描写战斗场景"
                multiline
                rows={2}
                size="small"
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useSections}
                    onChange={(e) => setUseSections(e.target.checked)}
                  />
                }
                label="使用小节提示"
              />
            </Stack>
          </Box>

          <Divider />

          {/* 生成内容显示区域 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              生成内容
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                minHeight: 200,
                maxHeight: 400,
                overflow: 'auto',
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 2
              }}
            >
              {isGenerating && !generatedContent && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography color="text.secondary">正在生成...</Typography>
                </Box>
              )}
              {generatedContent && (
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                >
                  {generatedContent}
                </Typography>
              )}
              {!isGenerating && !generatedContent && (
                <Typography color="text.secondary">
                  点击"开始生成"按钮生成内容
                </Typography>
              )}
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isGenerating}>
          取消
        </Button>
        {isGenerating ? (
          <Button
            onClick={handleStop}
            variant="outlined"
            color="error"
            startIcon={<StopCircleIcon />}
          >
            停止
          </Button>
        ) : (
          <>
            <Button
              onClick={handleGenerate}
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              disabled={!chapterId}
            >
              开始生成
            </Button>
            {generatedContent && (
              <Button
                onClick={handleApplyClick}
                variant="contained"
                color="success"
              >
                应用到章节
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
