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
  alpha,
  LinearProgress,
  Stack,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { novelProjectAPI } from '@/features/novel_project/frontend'
import { containerVariants, itemVariants, scaleVariants } from '@/frontend/core/animation'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BookIcon from '@mui/icons-material/Book'
import DescriptionIcon from '@mui/icons-material/Description'
import PeopleIcon from '@mui/icons-material/People'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { DangerConfirmDialog, EmptyState, SkeletonProjectList } from '@/frontend/shared'
import { useNotificationStore } from '@/frontend/shared'
import { useDocumentTitle } from '@/frontend/core'

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

  // 动态标题
  useDocumentTitle({ title: '小说项目' })

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

  // 相对时间
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
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
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <SkeletonProjectList />
            </Box>
          ) : error && projects.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : projects.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                variant="no-projects"
                action={{
                  label: '新建项目',
                  onClick: () => navigate('/novel_projects/create'),
                }}
                suggestions={[
                  {
                    icon: <AutoAwesomeIcon />,
                    text: '使用AI快速生成小说',
                    onClick: () => navigate('/novel_generator'),
                  },
                  {
                    icon: <BookIcon />,
                    text: '从模板创建项目',
                  },
                  {
                    icon: <DescriptionIcon />,
                    text: '查看使用指南',
                  },
                ]}
              />
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
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: (theme) => `0 12px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                            '& .quick-actions': {
                              opacity: 1,
                              transform: 'translateY(0)',
                            },
                          }
                        }}
                        onClick={() => navigate(`/novel_projects/${project.id}`)}
                      >
                        {/* 类型/风格标签 */}
                        {(project.genre || project.style) && (
                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            {project.genre && (
                              <Chip
                                label={project.genre}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                }}
                              />
                            )}
                            {project.style && (
                              <Chip
                                label={project.style}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                  color: 'secondary.main',
                                }}
                              />
                            )}
                          </Stack>
                        )}

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
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                mb: 0.5,
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
                                height: 20,
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.65rem',
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
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.5,
                            }}
                          >
                            {project.description}
                          </Typography>
                        )}

                        {/* 统计信息 */}
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{
                            mb: 2,
                            pt: 2,
                            borderTop: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {project.word_count ? `${(project.word_count / 1000).toFixed(1)}k 字` : '0 字'}
                            </Typography>
                          </Box>
                          {project.use_chapter_system && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BookIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {project.chapter_count || 0} 章
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {project.character_count || 0} 人
                            </Typography>
                          </Box>
                        </Stack>

                        {/* 进度条 */}
                        {project.target_word_count && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                完成度
                              </Typography>
                              <Typography variant="caption" fontWeight={600} color="primary">
                                {Math.min(100, Math.round((project.word_count || 0) / project.target_word_count * 100))}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (project.word_count || 0) / project.target_word_count * 100)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        )}

                        {/* 底部信息 */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                          <Typography variant="caption" color="text.secondary">
                            {getRelativeTime(project.updated_at || project.created_at)}
                          </Typography>
                        </Box>

                        {/* 悬浮快捷操作 */}
                        <Stack
                          className="quick-actions"
                          direction="row"
                          spacing={1}
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            opacity: 0,
                            transform: 'translateY(-8px)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Tooltip title="查看">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/novel_projects/${project.id}`);
                              }}
                              sx={{
                                bgcolor: alpha(theme.palette.background.paper, 0.9),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="编辑">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/novel_projects/${project.id}/edit`);
                              }}
                              sx={{
                                bgcolor: alpha(theme.palette.background.paper, 0.9),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                },
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
                              sx={{
                                bgcolor: alpha(theme.palette.background.paper, 0.9),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  color: 'error.main',
                                },
                              }}
                            >
                              {deletingId === project.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    </motion.div>
                  </Grid2>
                ))}
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