import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Grid2,
  useTheme,
  alpha
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { chapterAPI } from '@/features/novel_project/frontend/chapter_api'
import { containerVariants, itemVariants, scaleVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'

const ChapterEditPage: React.FC = () => {
  const { id, chapterId } = useParams<{ id?: string; chapterId?: string }>()
  const projectId = id ? parseInt(id, 10) : 0
  const isEditing = Boolean(chapterId)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [chapterNumber, setChapterNumber] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  
  const navigate = useNavigate()
  const theme = useTheme()
  
  useEffect(() => {
    if (isEditing && projectId && chapterId) {
      fetchChapter()
    }
  }, [projectId, chapterId, isEditing])
  
  const fetchChapter = async () => {
    try {
      setLoading(true)
      const chapter = await chapterAPI.getChapter(projectId, chapterId!)
      setTitle(chapter.title)
      setContent(chapter.content || '')
      setChapterNumber(chapter.chapter_number)
    } catch (err) {
      setError('获取章节信息失败')
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async () => {
    try {
      setSaving(true)
      
      if (isEditing && chapterId) {
        // 更新章节
        const updateData: any = {
          chapter_id: chapterId,
          title,
          content
        };
        
        // 只有当chapterNumber不为null时才发送章节序号
        if (chapterNumber !== null) {
          updateData.chapter_number = chapterNumber;
        }
        
        await chapterAPI.updateChapter(projectId, chapterId, updateData)
        setError('章节更新成功')
      } else {
        // 创建章节
        await chapterAPI.createChapter(projectId, {
          chapter_id: '', // 后端会生成UUID
          chapter_number: -1, // -1作为特殊标记值，后端会自动生成正确的序号
          title,
          content
        })
        setError('章节创建成功')
      }
      
      setSnackbarOpen(true)
      setTimeout(() => navigate(`/novel_projects/${projectId}/chapters`), 1500)
    } catch (err) {
      setError(isEditing ? '更新章节失败' : '创建章节失败')
      setSnackbarOpen(true)
    } finally {
      setSaving(false)
    }
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
              onClick={() => navigate(`/novel_projects/${projectId}/chapters`)}
              sx={{ borderRadius: 3 }}
            >
              返回章节列表
            </Button>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              {isEditing ? '编辑章节' : '新建章节'}
            </Typography>
            <motion.div variants={scaleVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving || !title.trim()}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
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
                {saving ? '保存中...' : '保存章节'}
              </Button>
            </motion.div>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                }}
              >
                <Grid2 container spacing={3}>
                  <Grid2 size={12}>
                    <TextField
                      label="章节标题"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="请输入章节标题"
                      variant="outlined"
                      fullWidth
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Grid2>
                  
                  {isEditing && (
                    <Grid2 size={12}>
                      <TextField
                        label="章节序号"
                        type="number"
                        value={chapterNumber !== null ? chapterNumber : ''}
                        disabled
                        variant="outlined"
                        fullWidth
                        helperText="章节序号由系统自动生成"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                          }
                        }}
                      />
                    </Grid2>
                  )
                }
                  
                  <Grid2 size={12}>
                    <TextField
                      label="章节内容"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请输入章节内容"
                      multiline
                      rows={20}
                      variant="outlined"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Grid2>
                </Grid2>
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

export default ChapterEditPage