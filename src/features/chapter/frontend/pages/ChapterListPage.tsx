/**
 * 章节列表页
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  alpha,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { ArrowBack, Delete } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/frontend/core/animation'

import { chapterAPI } from '../api'
import type { ChapterListItem } from '../types'

export default function ChapterListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [chapters, setChapters] = useState<ChapterListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState<ChapterListItem | null>(null)

  useEffect(() => {
    if (projectId) {
      loadChapters()
    }
  }, [projectId])

  const loadChapters = async () => {
    try {
      setLoading(true)
      const data = await chapterAPI.getChapters(Number(projectId))
      setChapters(data)
    } catch (error) {
      console.error('加载章节列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChapterClick = (chapterId: number) => {
    navigate(`/novel_projects/${projectId}/chapters/${chapterId}`)
  }

  const handleDeleteClick = (chapter: ChapterListItem, event: React.MouseEvent) => {
    event.stopPropagation()
    setChapterToDelete(chapter)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!chapterToDelete) return

    try {
      await chapterAPI.deleteChapter(chapterToDelete.id)
      setChapters(chapters.filter((c) => c.id !== chapterToDelete.id))
      setDeleteDialogOpen(false)
      setChapterToDelete(null)
    } catch (error) {
      console.error('删除章节失败:', error)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setChapterToDelete(null)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿'
      case 'completed':
        return '已完成'
      case 'ai_generated':
        return 'AI生成'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'completed':
        return 'success'
      case 'ai_generated':
        return 'info'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    )
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      sx={{ p: 3 }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/novel_projects/${projectId}`)}
          sx={{ borderRadius: 2 }}
        >
          返回
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          章节列表
        </Typography>
      </Stack>

      {chapters.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
          }}
        >
          <Typography color="text.secondary">
            还没有章节，请先在大纲中创建章节节点
          </Typography>
        </Paper>
      ) : (
        <List component={motion.div} variants={containerVariants}>
          {chapters.map((chapter) => (
            <ListItem
              key={chapter.id}
              component={motion.div}
              variants={itemVariants}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Paper
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(20px)',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.action.hover, 0.1),
                  },
                }}
              >
                <ListItemButton onClick={() => handleChapterClick(chapter.id)}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={`第 ${chapter.chapter_number} 章`}
                          color="primary"
                          size="small"
                        />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {chapter.title}
                        </Typography>
                        <Chip
                          label={getStatusLabel(chapter.status)}
                          color={getStatusColor(chapter.status) as any}
                          size="small"
                        />
                      </Stack>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        字数: {chapter.word_count} · 更新于{' '}
                        {new Date(chapter.updated_at).toLocaleString('zh-CN')}
                      </Typography>
                    }
                  />
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={(e) => handleDeleteClick(chapter, e)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </ListItemButton>
              </Paper>
            </ListItem>
          ))}
        </List>
      )}

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
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
            确定要删除章节「{chapterToDelete?.title}」吗？
            <br />
            此操作不会删除关联的大纲节点。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteCancel} sx={{ borderRadius: 2 }}>
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
    </Box>
  )
}
