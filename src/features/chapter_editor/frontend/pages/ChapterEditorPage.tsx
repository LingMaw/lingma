/**
 * 章节编辑器页面（完整版）
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  TextField,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material'
import { Save, ArrowBack, Delete, Info } from '@mui/icons-material'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useUserStore } from '@/frontend/shared/stores/user'
import { useNotification } from '@/frontend/shared'
import { env } from '@/config/env'
import { chapterEditorAPI } from '../api'
import { useAutoSave } from '../hooks/useAutoSave'
import RichTextEditor from '../components/RichTextEditor'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import OutlineNodeSelector from '../components/OutlineNodeSelector'
import AIAssistant from '../components/AIAssistant'
import type { ChapterDetail } from '../types'

export default function ChapterEditorPage() {
  const { chapterId } = useParams<{ chapterId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useUserStore()
  const notify = useNotification()

  const [chapter, setChapter] = useState<ChapterDetail | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [outlineNodeId, setOutlineNodeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const { saveStatus, checkDraft, clearDraft } = useAutoSave(chapterId, title, content, !!chapterId)

  // 加载章节数据
  useEffect(() => {
    const loadChapter = async () => {
      try {
        if (!chapterId) {
          // 从大纲创建新章节
          const outlineNodeId = searchParams.get('outlineNodeId')
          if (outlineNodeId) {
            const newChapter = await chapterEditorAPI.createFromOutline(Number(outlineNodeId))
            setChapter(newChapter)
            setTitle(newChapter.title)
            setContent(newChapter.content)
            setOutlineNodeId(newChapter.outline_node_id)
            // 创建后替换URL
            navigate(`/chapter-editor/${newChapter.chapter_id}`, { replace: true })
          } else {
            setError('缺少章节ID或大纲节点ID')
          }
        } else {
          // 加载现有章节
          const data = await chapterEditorAPI.getChapter(chapterId)
          setChapter(data)
          setOutlineNodeId(data.outline_node_id)

          // 检查草稿
          const draft = checkDraft(chapterId)
          if (draft) {
            const useDraft = window.confirm('检测到未保存的草稿，是否恢复？')
            if (useDraft) {
              setTitle(draft.title)
              setContent(draft.content)
            } else {
              setTitle(data.title)
              setContent(data.content)
              clearDraft(chapterId)
            }
          } else {
            setTitle(data.title)
            setContent(data.content)
          }
        }
      } catch (err) {
        console.error('加载章节失败:', err)
        setError('加载章节失败')
      } finally {
        setLoading(false)
      }
    }

    loadChapter()
  }, [chapterId])

  // 手动保存
  const handleManualSave = async () => {
    if (!chapterId) return
    try {
      await chapterEditorAPI.updateChapter(chapterId, { title, content, outline_node_id: outlineNodeId })
      notify.success('保存成功')
    } catch (err) {
      notify.error('保存失败')
    }
  }

  // 删除章节
  const handleDelete = async () => {
    if (!chapterId) return
    try {
      setDeleting(true)
      await chapterEditorAPI.deleteChapter(chapterId)
      notify.success('章节已删除')
      navigate(-1)
    } catch (err) {
      notify.error('删除失败')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // AI生成内容
  const handleAIGenerate = async (prompt: string, useOutlineContext: boolean) => {
    if (!chapterId || !token) return

    try {
      setAiGenerating(true)
      const url = `${env.API_BASE_URL}/chapter-editor/chapters/${chapterId}/generate-stream`

      let generatedText = ''

      await fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, use_outline_context: useOutlineContext }),
        onmessage(event) {
          if (event.data) {
            generatedText += event.data
            setContent(prev => prev + event.data)
          }
        },
        onerror(err) {
          console.error('AI生成错误:', err)
          notify.error('AI生成失败')
          throw err
        },
      })

      notify.success('AI内容生成完成')
    } catch (err) {
      console.error('AI生成失败:', err)
    } finally {
      setAiGenerating(false)
    }
  }

  // 处理大纲节点关联变更
  const handleOutlineNodeChange = async (nodeId: number | null) => {
    if (!chapterId) return
    try {
      setOutlineNodeId(nodeId)
      const updated = await chapterEditorAPI.updateChapter(chapterId, { outline_node_id: nodeId })
      setChapter(updated)
      // 如果关联了节点，同步标题
      if (nodeId && updated.outline_title) {
        setTitle(updated.outline_title)
      }
      notify.success(nodeId ? '已关联大纲节点' : '已解除大纲关联')
    } catch (err) {
      notify.error('更新关联失败')
      // 恢复原有值
      setOutlineNodeId(chapter?.outline_node_id ?? null)
    }
  }

  // 计算字数（移除HTML标签）
  const wordCount = content
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/&nbsp;/g, ' ') // 替换空格
    .match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g)?.length || 0

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          返回
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* 第一行：返回按钮、标题、操作按钮 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            返回
          </Button>

          <TextField
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="章节标题"
            variant="standard"
            disabled={!!chapter?.outline_node_id} // 关联大纲节点时不可编辑
            sx={{
              flex: 1,
              '& .MuiInput-input': {
                fontSize: '1.5rem',
                fontWeight: 600,
              },
            }}
          />

          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="字数统计">
              <Chip
                icon={<Info />}
                label={`${wordCount} 字`}
                size="small"
                variant="outlined"
              />
            </Tooltip>

            <Chip
              label={
                saveStatus === 'saved'
                  ? '已保存'
                  : saveStatus === 'saving'
                    ? '保存中...'
                    : '保存失败'
              }
              color={
                saveStatus === 'saved' ? 'success' : saveStatus === 'saving' ? 'info' : 'error'
              }
              size="small"
            />

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
            >
              手动保存
            </Button>

            <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
              <Delete />
            </IconButton>
          </Stack>
        </Box>

        {/* 第二行：元数据和AI助手 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ minWidth: 300 }}>
              <OutlineNodeSelector
                projectId={chapter?.project_id || 0}
                value={outlineNodeId}
                onChange={handleOutlineNodeChange}
              />
            </Box>

            {chapter && (
              <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                <Typography variant="body2" color="text.secondary">
                  创建：{format(new Date(chapter.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  修改：{format(new Date(chapter.updated_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </Typography>
              </Stack>
            )}
          </Box>

          <AIAssistant onGenerate={handleAIGenerate} generating={aiGenerating} />
        </Box>
      </Box>

      {/* 编辑器 */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <RichTextEditor value={content} onChange={setContent} />
      </Box>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title={title || '未命名章节'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleting}
      />
    </Box>
  )
}
