/**
 * 小说项目编辑页面 - 针对未启用章节系统的项目
 * 仿照 ChapterEditorPage，提供内容编辑、自动保存、AI辅助等功能
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  alpha,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  ArrowBack,
  Save,
  AutoAwesome,
  ExpandMore,
  Close,
  Spellcheck,
  Brush,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { pageVariants } from '@/frontend/core/animation'
import { StreamProgressIndicator, EnhancedRequirementInput } from '@/frontend/shared'

import { novelProjectAPI } from '../api'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 基础状态
  const [project, setProject] = useState<NovelProjectResponse | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // AI相关状态
  const [aiMenuAnchor, setAiMenuAnchor] = useState<null | HTMLElement>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiContent, setAiContent] = useState('')
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiDialogTitle, setAiDialogTitle] = useState('')
  const [aiRequirementInputOpen, setAiRequirementInputOpen] = useState(false)
  const [aiRequirement, setAiRequirement] = useState('')
  const [aiPendingAction, setAiPendingAction] = useState<'generate' | 'continue' | null>(null)
  const abortControllerRef = useRef<(() => void) | null>(null)

  // 字数统计
  const wordCount = content.length

  // 自动保存功能
  useEffect(() => {
    // 清除之前的计时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 设置新的自动保存计时器（2秒无操作后自动保存）
    autoSaveTimerRef.current = setTimeout(() => {
      if (project && (title !== project.title || content !== project.content)) {
        handleAutoSave()
      }
    }, 2000)

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, content, project])

  useEffect(() => {
    if (id) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const data = await novelProjectAPI.getProject(Number(id))
      setProject(data)
      setTitle(data.title)
      setContent(data.content || '')
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id) return

    try {
      setSaving(true)
      await novelProjectAPI.updateProject(Number(id), {
        title: title.trim(),
        content: content,
      })
      await loadProject()
    } catch (error) {
      console.error('保存项目失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoSave = async () => {
    if (!id || autoSaving) return

    try {
      setAutoSaving(true)
      await novelProjectAPI.updateProject(Number(id), {
        title: title.trim(),
        content: content,
      })
    } catch (error) {
      console.error('自动保存失败:', error)
    } finally {
      setAutoSaving(false)
    }
  }

  const handleBack = () => {
    navigate(`/novel_projects/${id}`)
  }

  // AI菜单处理
  const handleAiMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAiMenuAnchor(event.currentTarget)
  }

  const handleAiMenuClose = () => {
    setAiMenuAnchor(null)
  }

  // AI生成内容 - 打开需求输入对话框
  const handleAiGenerate = async () => {
    handleAiMenuClose()
    setAiRequirement('')
    setAiPendingAction('generate')
    setAiRequirementInputOpen(true)
  }

  // 确认并执行生成
  const handleAiGenerateConfirm = async () => {
    setAiRequirementInputOpen(false)
    setAiDialogTitle('AI生成内容')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await novelProjectAPI.aiGenerateProjectStream(Number(id), {
        requirement: aiRequirement,
        onChunk: (chunk) => {
          setAiContent((prev) => prev + chunk)
        },
        onComplete: () => {
          setAiGenerating(false)
        },
        onError: (error) => {
          console.error('AI生成失败:', error)
          setAiGenerating(false)
          setAiContent((prev) => prev + '\n\n[生成失败]')
        },
      })
      abortControllerRef.current = abort
    } catch (error) {
      console.error('AI生成失败:', error)
      setAiGenerating(false)
    }
  }

  // AI续写 - 打开需求输入对话框
  const handleAiContinue = async () => {
    handleAiMenuClose()
    setAiRequirement('')
    setAiPendingAction('continue')
    setAiRequirementInputOpen(true)
  }

  // 确认并执行续写
  const handleAiContinueConfirm = async () => {
    setAiRequirementInputOpen(false)
    setAiDialogTitle('AI续写')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await novelProjectAPI.aiContinueProjectStream(Number(id), {
        currentContent: content,
        requirement: aiRequirement,
        onChunk: (chunk) => {
          setAiContent((prev) => prev + chunk)
        },
        onComplete: () => {
          setAiGenerating(false)
        },
        onError: (error) => {
          console.error('AI续写失败:', error)
          setAiGenerating(false)
          setAiContent((prev) => prev + '\n\n[续写失败]')
        },
      })
      abortControllerRef.current = abort
    } catch (error) {
      console.error('AI续写失败:', error)
      setAiGenerating(false)
    }
  }

  // AI优化 - 语法
  const handleAiOptimizeGrammar = async () => {
    handleAiMenuClose()
    setAiDialogTitle('AI语法检查')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await novelProjectAPI.aiOptimizeProjectStream(Number(id), {
        content: content,
        type: 'grammar',
        onChunk: (chunk) => {
          setAiContent((prev) => prev + chunk)
        },
        onComplete: () => {
          setAiGenerating(false)
        },
        onError: (error) => {
          console.error('AI优化失败:', error)
          setAiGenerating(false)
          setAiContent((prev) => prev + '\n\n[优化失败]')
        },
      })
      abortControllerRef.current = abort
    } catch (error) {
      console.error('AI优化失败:', error)
      setAiGenerating(false)
    }
  }

  // AI优化 - 风格
  const handleAiOptimizeStyle = async () => {
    handleAiMenuClose()
    setAiDialogTitle('AI风格优化')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await novelProjectAPI.aiOptimizeProjectStream(Number(id), {
        content: content,
        type: 'style',
        onChunk: (chunk) => {
          setAiContent((prev) => prev + chunk)
        },
        onComplete: () => {
          setAiGenerating(false)
        },
        onError: (error) => {
          console.error('AI优化失败:', error)
          setAiGenerating(false)
          setAiContent((prev) => prev + '\n\n[优化失败]')
        },
      })
      abortControllerRef.current = abort
    } catch (error) {
      console.error('AI优化失败:', error)
      setAiGenerating(false)
    }
  }

  // 关闭AI对话框
  const handleAiDialogClose = () => {
    if (aiGenerating && abortControllerRef.current) {
      abortControllerRef.current()
    }
    setAiDialogOpen(false)
    setAiContent('')
    setAiPendingAction(null)
    setAiRequirement('')
  }

  // 应用AI生成的内容
  const handleApplyAiContent = async () => {
    try {
      if (aiDialogTitle === 'AI续写') {
        setContent(content + '\n\n' + aiContent)
      } else {
        setContent(aiContent)
      }
      // AI生成完成后自动保存
      setSaving(true)
      await novelProjectAPI.updateProject(Number(id), {
        title: title.trim(),
        content: aiDialogTitle === 'AI续写' ? content + '\n\n' + aiContent : aiContent,
      })
      await loadProject()
    } catch (error) {
      console.error('应用AI内容失败:', error)
    } finally {
      setSaving(false)
      setAiDialogOpen(false)
      setAiContent('')
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    )
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>项目不存在</Typography>
      </Box>
    )
  }

  return (
    <Box
      component={motion.div}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      sx={{ p: 3, minHeight: '100vh' }}
    >
      {/* 顶部工具栏 */}
      <Paper
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={handleBack} sx={{ borderRadius: 2 }}>
            <ArrowBack />
          </IconButton>

          <Chip label={project.genre || '未分类'} color="primary" />

          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            {title || '未命名项目'}
          </Typography>

          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            endIcon={<ExpandMore />}
            onClick={handleAiMenuOpen}
            sx={{ borderRadius: 2 }}
          >
            AI助手
          </Button>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2, position: 'relative' }}
          >
            {saving ? '保存中...' : '保存'}
            {autoSaving && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            )}
          </Button>
        </Stack>
      </Paper>

      {/* 主内容区 */}
      <Grid2 container spacing={2}>
        {/* 编辑器 */}
        <Grid2 size={{ xs: 12, md: 9 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '70vh',
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
              <TextField
                label="项目标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
              {autoSaving && (
                <Typography variant="caption" color="success.main" sx={{ pt: 1, whiteSpace: 'nowrap' }}>
                  自动保存中...
                </Typography>
              )}
            </Stack>

            <Box sx={{ position: 'relative' }}>
              <TextField
                label="正文内容"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                fullWidth
                minRows={20}
                InputProps={{
                  sx: {
                    alignItems: 'flex-start',
                    fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                    fontSize: '1.05rem',
                    lineHeight: 2,
                  },
                }}
                placeholder="在此输入项目内容..."
              />
              {autoSaving && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                    color: 'success.main',
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 },
                      },
                    }}
                  />
                  自动保存
                </Box>
              )}
            </Box>
          </Paper>
        </Grid2>

        {/* 侧边栏 - 元数据 */}
        <Grid2 size={{ xs: 12, md: 3 }}>
          <Stack spacing={2}>
            {/* 统计信息 */}
            <Card
              sx={{
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(20px)',
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  项目统计
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      字数统计
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {wordCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      创建时间
                    </Typography>
                    <Typography variant="body2">
                      {new Date(project.created_at).toLocaleString('zh-CN')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      最后更新
                    </Typography>
                    <Typography variant="body2">
                      {new Date(project.updated_at).toLocaleString('zh-CN')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* AI快捷操作 */}
            <Card
              sx={{
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                backdropFilter: 'blur(20px)',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AutoAwesome color="primary" fontSize="small" />
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                    AI辅助写作
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<AutoAwesome />}
                    onClick={handleAiGenerate}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    生成内容
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<AutoAwesome />}
                    onClick={handleAiContinue}
                    disabled={!content}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    智能续写
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Spellcheck />}
                    onClick={handleAiOptimizeGrammar}
                    disabled={!content}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    语法检查
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Brush />}
                    onClick={handleAiOptimizeStyle}
                    disabled={!content}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    风格优化
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid2>
      </Grid2>

      {/* AI菜单 */}
      <Menu
        anchorEl={aiMenuAnchor}
        open={Boolean(aiMenuAnchor)}
        onClose={handleAiMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <MenuItem onClick={handleAiGenerate}>
          <AutoAwesome fontSize="small" sx={{ mr: 1 }} />
          生成内容
        </MenuItem>
        <MenuItem onClick={handleAiContinue} disabled={!content}>
          <AutoAwesome fontSize="small" sx={{ mr: 1 }} />
          智能续写
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleAiOptimizeGrammar} disabled={!content}>
          <Spellcheck fontSize="small" sx={{ mr: 1 }} />
          语法检查
        </MenuItem>
        <MenuItem onClick={handleAiOptimizeStyle} disabled={!content}>
          <Brush fontSize="small" sx={{ mr: 1 }} />
          风格优化
        </MenuItem>
      </Menu>

      {/* AI生成对话框 */}
      <Dialog
        open={aiDialogOpen}
        onClose={handleAiDialogClose}
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
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{aiDialogTitle}</Typography>
            <IconButton size="small" onClick={handleAiDialogClose}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {/* 流式生成进度指示器 */}
          <StreamProgressIndicator
            isGenerating={aiGenerating}
            generatedContent={aiContent}
            onStop={() => {
              if (abortControllerRef.current) {
                abortControllerRef.current()
                abortControllerRef.current = null
              }
              setAiGenerating(false)
            }}
            statusText="AI创作中..."
          />
          
          <TextField
            value={aiContent}
            multiline
            fullWidth
            rows={15}
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                fontSize: '1rem',
                lineHeight: 2,
              },
            }}
            placeholder={aiGenerating ? 'AI正在生成内容...' : '等待AI生成'}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleAiDialogClose} sx={{ borderRadius: 2 }}>
            {aiGenerating ? '取消' : '关闭'}
          </Button>
          <Button
            onClick={handleApplyAiContent}
            variant="contained"
            disabled={aiGenerating || !aiContent}
            sx={{ borderRadius: 2 }}
          >
            应用到编辑器
          </Button>
        </DialogActions>
      </Dialog>

      {/* 全局自动保存样式 */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* AI需求输入对话框 */}
      <Dialog
        open={aiRequirementInputOpen}
        onClose={() => setAiRequirementInputOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {aiPendingAction === 'generate' ? 'AI生成内容' : 'AI续写'}
            </Typography>
            <IconButton size="small" onClick={() => setAiRequirementInputOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* 增强的需求输入组件 */}
          <EnhancedRequirementInput
            value={aiRequirement}
            onChange={setAiRequirement}
            disabled={false}
            scene={aiPendingAction || 'generate'}
            minLength={5}
            storageKey={`project_ai_requirement_${aiPendingAction}`}
            maxHistoryCount={5}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAiRequirementInputOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button
            onClick={aiPendingAction === 'generate' ? handleAiGenerateConfirm : handleAiContinueConfirm}
            variant="contained"
            disabled={aiRequirement.trim().length > 0 && aiRequirement.trim().length < 5}
            sx={{ borderRadius: 2 }}
          >
            开始{aiPendingAction === 'generate' ? '生成' : '续写'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
