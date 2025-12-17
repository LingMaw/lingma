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
  useTheme,
  alpha
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { chapterAPI } from '@/features/novel_project/frontend/chapter_api'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'

const ChapterDetailPage: React.FC = () => {
  const { id, chapterId } = useParams<{ id?: string; chapterId?: string }>()
  const projectId = id ? parseInt(id, 10) : 0
  
  const [chapter, setChapter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  
  const navigate = useNavigate()
  const theme = useTheme()
  
  useEffect(() => {
    if (projectId && chapterId) {
      fetchChapter()
    }
  }, [projectId, chapterId])
  
  const fetchChapter = async () => {
    try {
      setLoading(true)
      const chapterData = await chapterAPI.getChapter(projectId, chapterId!)
      setChapter(chapterData)
    } catch (err) {
      setError('获取章节信息失败')
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Alert severity="error">{error}</Alert>
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
              onClick={() => navigate(`/novel_projects/${projectId}/chapters`)}
              sx={{ borderRadius: 3 }}
            >
              返回章节列表
            </Button>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              章节详情
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/novel_projects/${projectId}/chapter/${chapterId}/edit`)}
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
              编辑章节
            </Button>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    第{chapter?.chapter_number !== null ? chapter?.chapter_number : ''}章 {chapter?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    创建于 {chapter ? formatDate(chapter.created_at) : ''} | 更新于 {chapter ? formatDate(chapter.updated_at) : ''}
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 3,
                    backgroundColor: alpha(theme.palette.background.default, 0.3),
                    borderRadius: 2,
                    border: `1px dashed ${theme.palette.divider}`
                  }}
                >
                  {chapter?.content ? (
                    <Typography
                      component="div"
                      variant="body1"
                      sx={{
                        fontFamily: '"Merriweather", "Georgia", "Times New Roman", serif',
                        fontSize: '1rem',
                        lineHeight: 1.8,
                        color: theme.palette.text.primary,
                        whiteSpace: 'pre-wrap',
                        textAlign: 'justify',
                      }}
                    >
                      {chapter.content}
                    </Typography>
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}>
                      <Typography>该章节暂无内容</Typography>
                    </Box>
                  )}
                </Box>
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
            severity="error"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </motion.div>
    </Box>
  )
}

export default ChapterDetailPage