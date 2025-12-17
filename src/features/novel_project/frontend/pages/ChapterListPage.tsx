import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Grid2,
  useTheme,
  alpha
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { novelProjectAPI } from '@/features/novel_project/frontend'
import { chapterAPI } from '@/features/novel_project/frontend/chapter_api'
import { containerVariants, itemVariants, scaleVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import AddIcon from '@mui/icons-material/Add'

const ChapterListPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const projectId = id ? parseInt(id, 10) : 0
  
  const [projectTitle, setProjectTitle] = useState('')
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  
  const navigate = useNavigate()
  const theme = useTheme()
  
  const handleViewChapter = (chapterId: string) => {
    navigate(`/novel_projects/${projectId}/chapter/${chapterId}`)
  }
  
  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchChapters()
    }
  }, [projectId])
  
  const fetchProject = async () => {
    try {
      const project = await novelProjectAPI.getProject(projectId)
      setProjectTitle(project.title)
    } catch (err) {
      setError('获取项目信息失败')
      setSnackbarOpen(true)
    }
  }
  
  const fetchChapters = async () => {
    try {
      setLoading(true)
      const response = await chapterAPI.getChapters(projectId)
      setChapters(response.items)
    } catch (err) {
      setError('获取章节列表失败')
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateChapter = () => {
    navigate(`/novel_projects/${projectId}/chapter/create`)
  }
  
  const handleEditChapter = (chapterId: string) => {
    navigate(`/novel_projects/${projectId}/chapter/${chapterId}/edit`)
  }
  
  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await chapterAPI.deleteChapter(projectId, chapterId)
      setChapters(chapters.filter(chapter => chapter.chapter_id !== chapterId))
      setError('章节删除成功')
      setSnackbarOpen(true)
    } catch (err) {
      setError('删除章节失败')
      setSnackbarOpen(true)
    }
  }
  
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return
    }
    
    const items = Array.from(chapters)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setChapters(items)
    
    try {
      const chapterIds = items.map(item => item.chapter_id)
      await chapterAPI.updateChapterOrder(projectId, chapterIds)
    } catch (err) {
      setError('更新章节顺序失败')
      setSnackbarOpen(true)
      // 如果更新失败，重新获取章节列表以恢复原始顺序
      fetchChapters()
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }
  
  return (
    <Box sx={{ height: '100%' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Container maxWidth="md" sx={{ py: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/novel_projects/${projectId}`)}
              sx={{ borderRadius: 3 }}
            >
              返回项目详情
            </Button>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              {projectTitle} - 章节管理
            </Typography>
            <motion.div variants={scaleVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateChapter}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  px: 3,
                  fontWeight: 600,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    background: (theme) =>
                      `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }}
              >
                新建章节
              </Button>
            </motion.div>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                }}
              >
                {chapters.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      暂无章节
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      点击"新建章节"按钮创建第一个章节
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleCreateChapter}
                      sx={{ borderRadius: 3 }}
                    >
                      新建章节
                    </Button>
                  </Box>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="chapters">
                      {(provided) => (
                        <List {...provided.droppableProps} ref={provided.innerRef}>
                          {chapters.map((chapter, index) => (
                            <Draggable key={chapter.chapter_id} draggableId={chapter.chapter_id} index={index}>
                              {(provided) => (
                                <ListItem
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  onClick={() => handleViewChapter(chapter.chapter_id)}
                                  sx={{
                                    pl: 1,
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    mb: 1,
                                    boxShadow: 1,
                                    '&:hover': {
                                      boxShadow: 3,
                                      cursor: 'pointer'
                                    },
                                    position: 'relative'
                                  }}
                                >
                                  <IconButton {...provided.dragHandleProps} size="small" sx={{ cursor: 'grab' }}>
                                    <DragIndicatorIcon />
                                  </IconButton>
                                  <ListItemText
                                    primary={
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        第{chapter.chapter_number !== null ? chapter.chapter_number : ''}章 {chapter.title}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="body2" color="text.secondary">
                                        更新于 {formatDate(chapter.updated_at)}
                                      </Typography>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <IconButton 
                                      edge="end" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditChapter(chapter.chapter_id);
                                      }}
                                      sx={{ mr: 1 }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton 
                                      edge="end" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChapter(chapter.chapter_id);
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </List>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Paper>
            </motion.div>
          </Box>
        </Container>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={error.includes('失败') ? 'error' : 'success'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error || '操作成功'}
          </Alert>
        </Snackbar>
      </motion.div>
    </Box>
  )
}

export default ChapterListPage