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
  alpha,
  Chip,
  Stack,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { chapterAPI } from '@/features/novel_project/frontend/chapter_api'
import { OutlineNodeSelector, AIGenerationPanel } from '@/features/novel_project/frontend/components'
import { containerVariants, itemVariants, scaleVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

const ChapterEditPage: React.FC = () => {
  const { id, chapterId } = useParams<{ id?: string; chapterId?: string }>()
  const projectId = id ? parseInt(id, 10) : 0
  const isEditing = Boolean(chapterId)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [chapterNumber, setChapterNumber] = useState<number | null>(null)
  const [outlineNodeId, setOutlineNodeId] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  
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
      setOutlineNodeId((chapter as any).outline_node_id || null)
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
          content,
          outline_node_id: outlineNodeId
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
          content,
          outline_node_id: outlineNodeId
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
  
  const handleAIGenerated = (generatedContent: string, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setContent(generatedContent)
    } else {
      setContent((prev) => prev + '\n\n' + generatedContent)
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
            <Stack direction="column" alignItems="center" spacing={1}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                {isEditing ? '编辑章节' : '新建章节'}
              </Typography>
              {isEditing && outlineNodeId && (
                <Chip
                  icon={<AccountTreeIcon sx={{ fontSize: 14 }} />}
                  label="此章节由大纲系统管理"
                  size="small"
                  color="success"
                  sx={{ fontSize: '11px' }}
                />
              )}
            </Stack>
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
                  {isEditing && outlineNodeId && (
                    <Grid2 size={12}>
                      <Alert
                        severity="info"
                        icon={<InfoOutlinedIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            章节与大纲同步
                          </Typography>
                          <Typography variant="body2">
                            此章节由大纲系统自动创建（大纲节点ID: {outlineNodeId}）。
                            章节标题和编号会自动与大纲保持一致。
                          </Typography>
                        </Stack>
                      </Alert>
                    </Grid2>
                  )}  
                  
                  {/* 大纲节点选择器 */}
                  <Grid2 size={12}>
                    <OutlineNodeSelector
                      projectId={projectId}
                      value={outlineNodeId}
                      onChange={setOutlineNodeId}
                      disabled={aiPanelOpen}
                    />
                  </Grid2>
                  
                  <Grid2 size={12}>
                    <TextField
                      label="章节标题"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="请输入章节标题"
                      variant="outlined"
                      fullWidth
                      required
                      disabled={isEditing && outlineNodeId !== null}
                      helperText={isEditing && outlineNodeId ? "标题由大纲系统管理，请在大纲编辑器中修改" : ""}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Grid2>
                  
                  {isEditing && (
                    <>
                      <Grid2 size={6}>
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
                      {outlineNodeId && (
                        <Grid2 size={6}>
                          <TextField
                            label="大纲节点ID"
                            value={outlineNodeId}
                            disabled
                            variant="outlined"
                            fullWidth
                            helperText="与大纲系统的关联ID"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                              }
                            }}
                          />
                        </Grid2>
                      )}
                    </>
                  )
                }
                  
                  <Grid2 size={12}>
                    <Stack direction="row" spacing={2}>
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
                      {isEditing && (
                        <motion.div variants={scaleVariants} whileHover="hover" whileTap="tap">
                          <Button
                            variant="outlined"
                            onClick={() => setAiPanelOpen(true)}
                            startIcon={<AutoAwesomeIcon />}
                            sx={{
                              borderRadius: 3,
                              height: '56px',
                              minWidth: '140px',
                              borderColor: theme.palette.primary.main,
                              color: theme.palette.primary.main,
                              '&:hover': {
                                borderColor: theme.palette.primary.dark,
                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                              }
                            }}
                          >
                            AI生成
                          </Button>
                        </motion.div>
                      )}
                    </Stack>
                  </Grid2>
                </Grid2>
              </Paper>
            </motion.div>
          </Box>
        </Container>
        
        {/* AI生成面板 */}
        {isEditing && chapterId && (
          <AIGenerationPanel
            open={aiPanelOpen}
            onClose={() => setAiPanelOpen(false)}
            chapterId={chapterId}
            outlineNodeId={outlineNodeId}
            projectId={projectId}
            currentContent={content}
            onGenerated={handleAIGenerated}
          />
        )}
        
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