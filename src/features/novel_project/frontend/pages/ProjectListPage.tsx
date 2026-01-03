import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Grid2,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Fab,
  useTheme,
  alpha
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { novelProjectAPI } from '@/features/novel_project/frontend'
import { containerVariants, itemVariants, scaleVariants } from '@/frontend/core/animation'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BookIcon from '@mui/icons-material/Book'
import { DangerConfirmDialog } from '@/frontend/shared'
import { useNotificationStore } from '@/frontend/shared'

const ProjectListPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)

  const navigate = useNavigate()
  const theme = useTheme()
  const { showNotification } = useNotificationStore()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await novelProjectAPI.getProjects()
      setProjects(response.items)
    } catch (err) {
      setError('获取项目列表失败')
      showNotification('获取项目列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (project: any) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!projectToDelete) return
    try {
      setDeletingId(projectToDelete.id)
      await novelProjectAPI.deleteProject(projectToDelete.id)
      setProjects(projects.filter(project => project.id !== projectToDelete.id))
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      showNotification('项目删除成功', 'success')
    } catch (err) {
      showNotification('删除项目失败', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'in_progress': return 'primary'
      case 'completed': return 'success'
      case 'archived': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'in_progress': return '进行中'
      case 'completed': return '已完成'
      case 'archived': return '已归档'
      default: return status
    }
  }

  return (
    <Box sx={{ height: '100%' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Container maxWidth="xl" sx={{ py: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              小说项目管理
            </Typography>
            <motion.div variants={scaleVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/novel_projects/create')}
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
                新建项目
              </Button>
            </motion.div>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : error && projects.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <Grid2 container spacing={3}>
                {projects.map((project) => (
                  <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                    <motion.div variants={itemVariants}>
                      <Paper
                        elevation={0}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          p: 3,
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: (theme) => `0 12px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                            cursor: 'pointer'
                          }
                        }}
                        onClick={() => navigate(`/novel_projects/${project.id}`)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '12px',
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2,
                              boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                          >
                            <BookIcon sx={{ color: 'primary.main' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                mb: 1,
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {project.title}
                            </Typography>
                            <Chip
                              label={getStatusText(project.status)}
                              color={getStatusColor(project.status) as any}
                              size="small"
                              sx={{
                                height: 24,
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        </Box>

                        {project.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              flex: 1,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {project.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(project.created_at).toLocaleDateString()}
                          </Typography>
                          <Box>
                            <Tooltip title="编辑">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/novel_projects/${project.id}/edit`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(project);
                                }}
                                disabled={deletingId === project.id}
                              >
                                {deletingId === project.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    </motion.div>
                  </Grid2>
                ))}

                {projects.length === 0 && (
                  <Grid2 size={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 5,
                        textAlign: 'center',
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                      }}
                    >
                      <BookIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        暂无项目
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        点击"新建项目"按钮创建您的第一个小说项目
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/novel_projects/create')}
                        sx={{
                          borderRadius: 3,
                          py: 1,
                          px: 3,
                          fontWeight: 600,
                          background: (theme) =>
                            `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                          boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                      >
                        新建项目
                      </Button>
                    </Paper>
                  </Grid2>
                )}
              </Grid2>
            </Box>
          )}
        </Container>

        <Fab
          color="primary"
          aria-label="add"
          onClick={() => navigate('/novel_projects/create')}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <AddIcon />
        </Fab>

        {/* 删除确认对话框 */}
        <DangerConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          message="确定要删除此项目吗？删除后将无法恢复。"
          itemName={projectToDelete?.title}
          relatedInfo={`状态: ${getStatusText(projectToDelete?.status || '')} | 创建时间: ${projectToDelete ? new Date(projectToDelete.created_at).toLocaleDateString() : ''}`}
          loading={deletingId !== null}
        />
      </motion.div>
    </Box>
  )
}

export default ProjectListPage