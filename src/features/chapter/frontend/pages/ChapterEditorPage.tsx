/**
 * 章节编辑器页面 - 完整功能版
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  ArrowBack,
  Save,
  Delete,
  AutoAwesome,
  ExpandMore,
  Close,
  Spellcheck,
  Brush,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { pageVariants } from '@/frontend/core/animation'
import { StreamProgressIndicator, EnhancedRequirementInput, useBreadcrumb } from '@/frontend/shared'
import { useDocumentTitle, useKeyboardShortcuts, useFocusManagement } from '@/frontend/core'
import { novelProjectAPI } from '@/features/novel_project/frontend'

import { chapterAPI } from '../api'
import type { ChapterResponse } from '../types'
import { useAutoSave } from '../hooks/useAutoSave'
import { useTextStats } from '../hooks/useTextStats'
import SaveStatusIndicator from '../components/SaveStatusIndicator'
import EditorStatusBar from '../components/EditorStatusBar'

export default function ChapterEditorPage() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()
  const navigate = useNavigate()
  
  // 基础状态
  const [chapter, setChapter] = useState<ChapterResponse | null>(null)
  const [project, setProject] = useState<{ title: string } | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(true)
  
  // Textarea ref（用于字数统计中的选中监听）
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // AI相关状态
  const [aiMenuAnchor, setAiMenuAnchor] = useState<null | HTMLElement>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiContent, setAiContent] = useState('')
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiDialogTitle, setAiDialogTitle] = useState('')
  const [aiRequirementInputOpen, setAiRequirementInputOpen] = useState(false)
  const [aiRequirement, setAiRequirement] = useState('')
  const [aiPendingAction, setAiPendingAction] = useState<'generate' | 'continue' | 'expand' | 'compress' | null>(null)
  const abortControllerRef = useRef<(() => void) | null>(null)
  
  // 扩写/缩写参数
  const [expandRatio, setExpandRatio] = useState<number>(1.5)
  const [compressRatio, setCompressRatio] = useState<number>(50)
  
  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // 面包屑导航
  const breadcrumbs = useMemo(() => {
    if (!project || !chapter) return undefined
    return [
      { label: '小说项目', path: '/novel_project' },
      { label: `《${project.title}》`, path: `/novel_projects/${projectId}` },
      { label: '章节列表', path: `/novel_projects/${projectId}/chapters` },
      { label: chapter.title, isCurrent: true },
    ]
  }, [project, chapter, projectId])

  useBreadcrumb({ items: breadcrumbs })

  // 动态标题
  useDocumentTitle({
    title: '编辑',
    prefix: chapter && project ? `${chapter.title} - 《${project.title}》` : undefined,
  })

  // 自动保存逻辑（使用新的 Hook）
  const handleSaveData = useCallback(async () => {
    if (!chapterId) return
    
    await chapterAPI.updateChapter(Number(chapterId), {
      title: title.trim(),
      content: content,
      status: status,
    })
  }, [chapterId, title, content, status])

  const autoSave = useAutoSave({
    data: { title, content, status },
    onSave: handleSaveData,
    debounceMs: 300,
    enabled: !!chapter,
    isEqual: (a, b) => 
      a.title === b.title && 
      a.content === b.content && 
      a.status === b.status,
  })

  // 字数统计（使用新的 Hook）
  const textStats = useTextStats({
    content,
    textareaRef,
    targetChars: undefined, // 可以从 localStorage 读取
  })

  // 键盘快捷键
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrlOrCmd: true,
        handler: (e) => {
          e.preventDefault()
          handleSave()
        },
        description: '保存章节',
      },
      {
        key: 'Escape',
        handler: () => {
          // 如果有对话框打开，优先关闭对话框
          if (aiDialogOpen) {
            handleAiDialogClose()
          } else if (aiRequirementInputOpen) {
            setAiRequirementInputOpen(false)
          } else if (deleteDialogOpen) {
            setDeleteDialogOpen(false)
          } else {
            // 否则返回列表
            handleBack()
          }
        },
        description: '返回/关闭对话框',
      },
      {
        key: 'g',
        ctrlOrCmd: true,
        handler: (e) => {
          e.preventDefault()
          if (!aiGenerating) {
            handleAiGenerate()
          }
        },
        description: 'AI生成',
      },
    ],
    enabled: !aiGenerating, // AI生成时禁用快捷键
  })

  // 焦点管理 - AI生成对话框
  const aiDialogFocus = useFocusManagement(aiDialogOpen, {
    autoFocusOnOpen: true,
    returnFocusOnClose: true,
    focusSelector: 'button',
  })

  // 焦点管理 - AI需求输入对话框
  const aiRequirementDialogFocus = useFocusManagement(aiRequirementInputOpen, {
    autoFocusOnOpen: true,
    returnFocusOnClose: true,
    focusSelector: 'textarea, input',
  })

  // 焦点管理 - 删除确认对话框
  const deleteDialogFocus = useFocusManagement(deleteDialogOpen, {
    autoFocusOnOpen: true,
    returnFocusOnClose: true,
    focusSelector: 'button',
  })

  useEffect(() => {
    if (chapterId) {
      loadChapter()
    }
    if (projectId) {
      loadProject()
    }
  }, [chapterId, projectId])

  const loadProject = async () => {
    try {
      const data = await novelProjectAPI.getProject(Number(projectId))
      setProject({ title: data.title })
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }

  const loadChapter = async () => {
    try {
      setLoading(true)
      const data = await chapterAPI.getChapter(Number(chapterId))
      setChapter(data)
      setTitle(data.title)
      setContent(data.content)
      setStatus(data.status)
    } catch (error) {
      console.error('加载章节失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    await autoSave.save()
    await loadChapter()
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!chapterId) return

    try {
      await chapterAPI.deleteChapter(Number(chapterId))
      navigate(`/novel_projects/${projectId}/chapters`)
    } catch (error) {
      console.error('删除章节失败:', error)
    }
  }

  const handleBack = () => {
    navigate(`/novel_projects/${projectId}/chapters`)
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
    setAiDialogTitle('AI生成章节')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await chapterAPI.aiGenerateChapterStream(Number(chapterId), {
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
      const abort = await chapterAPI.aiContinueChapterStream(Number(chapterId), {
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
      const abort = await chapterAPI.aiOptimizeChapterStream(Number(chapterId), {
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
      const abort = await chapterAPI.aiOptimizeChapterStream(Number(chapterId), {
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

  // AI扩写 - 打开参数输入对话框
  const handleAiExpand = async () => {
    handleAiMenuClose()
    setAiRequirement('')
    setExpandRatio(1.5)
    setAiPendingAction('expand')
    setAiRequirementInputOpen(true)
  }

  // 确认并执行扩写
  const handleAiExpandConfirm = async () => {
    setAiRequirementInputOpen(false)
    setAiDialogTitle('AI扩写章节')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await chapterAPI.aiExpandChapterStream(Number(chapterId), {
        content: content,
        expandRatio: expandRatio,
        requirement: aiRequirement,
        onChunk: (chunk) => {
          setAiContent((prev) => prev + chunk)
        },
        onComplete: () => {
          setAiGenerating(false)
        },
        onError: (error) => {
          console.error('AI扩写失败:', error)
          setAiGenerating(false)
          setAiContent((prev) => prev + '\n\n[扩写失败]')
        },
      })
      abortControllerRef.current = abort
    } catch (error) {
      console.error('AI扩写失败:', error)
      setAiGenerating(false)
    }
  }

  // AI缩写 - 打开参数输入对话框
  const handleAiCompress = async () => {
    handleAiMenuClose()
    setAiRequirement('')
    setCompressRatio(50)
    setAiPendingAction('compress')
    setAiRequirementInputOpen(true)
  }

  // 确认并执行缩写
  const handleAiCompressConfirm = async () => {
    setAiRequirementInputOpen(false)
    setAiDialogTitle('AI缩写章节')
    setAiDialogOpen(true)
    setAiGenerating(true)
    setAiContent('')

    try {
      const abort = await chapterAPI.aiCompressChapterStream(Number(chapterId), {
        content: content,
        compressRatio: compressRatio,
        requirement: aiRequirement,
        onChunk: (chunk) => {
          setAiContent((prev) => prev + chunk)
        },
        onComplete: () => {
          setAiGenerating(false)
        },
        onError: (error) => {
          console.error('AI缩写失败:', error)
          setAiGenerating(false)
          setAiContent((prev) => prev + '\n\n[缩写失败]')
        },
      })
      abortControllerRef.current = abort
    } catch (error) {
      console.error('AI缩写失败:', error)
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
      
      setAiDialogOpen(false)
      setAiContent('')
      
      // AI生成完成后自动触发保存
      // useAutoSave hook 会自动检测内容变化并保存
    } catch (error) {
      console.error('应用AI内容失败:', error)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    )
  }

  if (!chapter) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>章节不存在</Typography>
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

          <Chip label={`第 ${chapter.chapter_number} 章`} color="primary" />

          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            {title || '未命名章节'}
          </Typography>

          {/* 保存状态指示器 */}
          <SaveStatusIndicator 
            status={autoSave.status} 
            metadata={autoSave.metadata}
          />

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel size="small">章节状态</InputLabel>
            <Select
              value={status}
              label="章节状态"
              onChange={(e) => setStatus(e.target.value)}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="draft">草稿</MenuItem>
              <MenuItem value="ai_generated">AI生成</MenuItem>
              <MenuItem value="completed">已完成</MenuItem>
            </Select>
          </FormControl>

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
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteClick}
            sx={{ borderRadius: 2 }}
          >
            删除
          </Button>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={autoSave.status === 'saving'}
            sx={{ borderRadius: 2 }}
          >
            {autoSave.status === 'saving' ? '保存中...' : '保存'}
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
                label="章节标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </Stack>

            <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TextField
                label="正文内容"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                fullWidth
                minRows={20}
                inputRef={textareaRef}
                InputProps={{
                  sx: {
                    alignItems: 'flex-start',
                    fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                    fontSize: '1.05rem',
                    lineHeight: 2,
                  },
                }}
                placeholder="在此输入章节内容..."
              />
            </Box>
            
            {/* 编辑器底部状态栏 */}
            <EditorStatusBar 
              stats={textStats} 
              onTargetChange={textStats.setTargetChars}
            />
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
                  章节统计
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      字数统计
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {textStats.totalChars.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      创建时间
                    </Typography>
                    <Typography variant="body2">
                      {new Date(chapter.created_at).toLocaleString('zh-CN')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      最后更新
                    </Typography>
                    <Typography variant="body2">
                      {new Date(chapter.updated_at).toLocaleString('zh-CN')}
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
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<ZoomIn />}
                    onClick={handleAiExpand}
                    disabled={!content}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    内容扩写
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<ZoomOut />}
                    onClick={handleAiCompress}
                    disabled={!content}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    内容缩写
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
          生成章节内容
        </MenuItem>
        <MenuItem onClick={handleAiContinue} disabled={!content}>
          <AutoAwesome fontSize="small" sx={{ mr: 1 }} />
          智能续写
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleAiExpand} disabled={!content}>
          <ZoomIn fontSize="small" sx={{ mr: 1 }} />
          内容扩写
        </MenuItem>
        <MenuItem onClick={handleAiCompress} disabled={!content}>
          <ZoomOut fontSize="small" sx={{ mr: 1 }} />
          内容缩写
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
          ref: aiDialogFocus.setContainerRef as any,
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

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          ref: deleteDialogFocus.setContainerRef as any,
          sx: {
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除章节《{chapter.title}》吗？
            <br />
            此操作不会删除关联的大纲节点。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* AI需求输入对话框 */}
      <Dialog
        open={aiRequirementInputOpen}
        onClose={() => setAiRequirementInputOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          ref: aiRequirementDialogFocus.setContainerRef as any,
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
              {aiPendingAction === 'generate' && 'AI生成章节'}
              {aiPendingAction === 'continue' && 'AI续写'}
              {aiPendingAction === 'expand' && 'AI扩写章节'}
              {aiPendingAction === 'compress' && 'AI缩写章节'}
            </Typography>
            <IconButton size="small" onClick={() => setAiRequirementInputOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* 扩写比例设置 */}
            {aiPendingAction === 'expand' && (
              <FormControl fullWidth>
                <InputLabel size="small">扩写比例</InputLabel>
                <Select
                  value={expandRatio}
                  label="扩写比例"
                  onChange={(e) => setExpandRatio(Number(e.target.value))}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={1.5}>1.5個（轻度扩写）</MenuItem>
                  <MenuItem value={2.0}>2.0個（中度扩写）</MenuItem>
                  <MenuItem value={2.5}>2.5個（大幅扩写）</MenuItem>
                  <MenuItem value={3.0}>3.0個（深度扩写）</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {/* 缩写比例设置 */}
            {aiPendingAction === 'compress' && (
              <FormControl fullWidth>
                <InputLabel size="small">压缩比例</InputLabel>
                <Select
                  value={compressRatio}
                  label="压缩比例"
                  onChange={(e) => setCompressRatio(Number(e.target.value))}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={30}>30%（高度精简）</MenuItem>
                  <MenuItem value={50}>50%（中度精简）</MenuItem>
                  <MenuItem value={70}>70%（轻度精简）</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {/* 增强的需求输入组件 */}
            <EnhancedRequirementInput
              value={aiRequirement}
              onChange={setAiRequirement}
              disabled={false}
              scene={aiPendingAction || 'generate'}
              storageKey={`chapter_ai_requirement_${aiPendingAction}`}
              maxHistoryCount={5}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAiRequirementInputOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button
            onClick={
              aiPendingAction === 'generate'
                ? handleAiGenerateConfirm
                : aiPendingAction === 'continue'
                ? handleAiContinueConfirm
                : aiPendingAction === 'expand'
                ? handleAiExpandConfirm
                : handleAiCompressConfirm
            }
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            开始
            {aiPendingAction === 'generate' && '生成'}
            {aiPendingAction === 'continue' && '续写'}
            {aiPendingAction === 'expand' && '扩写'}
            {aiPendingAction === 'compress' && '缩写'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
