import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Grid2,
  useTheme,
  alpha,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material'
import {
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
  Book as BookIcon,
  Folder as FolderIcon,
  MenuBook as NovelIcon,
  FormatListNumbered as ChapterIcon,
  AccountTree as OutlineIcon,
  TextFields as WordCountIcon,
  Edit as EditIcon,

  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Tag as VersionIcon,
  Cloud as EnvIcon,
  Storage as StorageIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { useUserStore } from '@/frontend/shared/stores/user'
import {
  dashboardAPI,
  type RecentProjectItem,
  type NovelStatistics,
  type SystemInfoSummary,
} from '@/features/dashboard/frontend'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import { systemColors } from '@/frontend/core/theme/macOS'

// --- 辅助函数 ---

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    in_progress: '进行中',
    completed: '已完成',
    archived: '已归档',
  }
  return map[status] || status
}

function getStatusColor(status: string): 'default' | 'primary' | 'success' | 'warning' {
  const map: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
    draft: 'default',
    in_progress: 'primary',
    completed: 'success',
    archived: 'warning',
  }
  return map[status] || 'default'
}

// --- 组件 ---

interface QuickActionCardProps {
  title: string
  subtitle: string
  icon: React.ElementType
  gradient: string
  onClick: () => void
}

const QuickActionCard = ({ title, subtitle, icon: Icon, gradient, onClick }: QuickActionCardProps) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap="tap"
      onClick={onClick}
      elevation={0}
      sx={{
        height: 120,
        cursor: 'pointer',
        background: gradient,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            bgcolor: alpha(theme.palette.common.white, 0.2),
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.common.white,
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.9) }}>
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

interface ProjectCardProps {
  project: RecentProjectItem
  onNavigate: (id: number) => void
  onEdit: (id: number) => void
}

const ProjectCard = ({ project, onNavigate, onEdit }: ProjectCardProps) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      elevation={0}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
      onClick={() => onNavigate(project.id)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: alpha(project.cover_color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              flexShrink: 0,
            }}
          >
            <BookIcon sx={{ color: project.cover_color, fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
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
              color={getStatusColor(project.status)}
              size="small"
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            borderTop: `1px dashed ${theme.palette.divider}`,
            borderBottom: `1px dashed ${theme.palette.divider}`,
            mb: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {formatDate(project.updated_at)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {project.word_count.toLocaleString()}
              </Box>{' '}
              字
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {project.chapter_count}
              </Box>{' '}
              章节
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Tooltip title="编辑项目">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project.id)
              }}
              sx={{
                bgcolor: alpha(systemColors.blue.light, 0.1),
                '&:hover': { bgcolor: alpha(systemColors.blue.light, 0.2) },
              }}
            >
              <EditIcon fontSize="small" sx={{ color: systemColors.blue.light }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="查看详情">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(project.id)
              }}
              sx={{
                bgcolor: alpha(systemColors.green.light, 0.1),
                '&:hover': { bgcolor: alpha(systemColors.green.light, 0.2) },
              }}
            >
              <ViewIcon fontSize="small" sx={{ color: systemColors.green.light }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  loading: boolean
}

const StatCard = ({ title, value, icon: Icon, color, loading }: StatCardProps) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        height: 100,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: '8px',
              bgcolor: alpha(color, 0.1),
              color: color,
              display: 'flex',
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={700} sx={{ color: color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

// --- 主页面 ---

export default function Dashboard() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [recentProjects, setRecentProjects] = useState<RecentProjectItem[]>([])
  const [statistics, setStatistics] = useState<NovelStatistics | null>(null)
  const [systemSummary, setSystemSummary] = useState<SystemInfoSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [systemExpanded, setSystemExpanded] = useState(() => {
    const saved = localStorage.getItem('dashboard_system_expanded')
    return saved === 'true'
  })

  const theme = useTheme()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [projectsData, statsData, summaryData] = await Promise.all([
        dashboardAPI.getRecentProjects(),
        dashboardAPI.getStatistics(),
        dashboardAPI.getSystemSummary(),
      ])
      setRecentProjects(projectsData.items)
      setStatistics(statsData)
      setSystemSummary(summaryData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = useMemo(() => {
    const hour = currentTime.getHours()
    if (hour < 5) return '夜深了'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }, [currentTime])

  const handleSystemToggle = () => {
    const newState = !systemExpanded
    setSystemExpanded(newState)
    localStorage.setItem('dashboard_system_expanded', String(newState))
  }

  return (
    <Stack
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      spacing={4}
      sx={{ pb: 4 }}
    >
      {/* 欢迎区 */}
      <Box component={motion.div} variants={itemVariants}>
        <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
          {currentTime.toLocaleDateString('zh-CN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
          {getGreeting}，{user?.nickname || user?.username}
        </Typography>
      </Box>

      {/* 快捷操作 */}
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <QuickActionCard
            title="快速生成小说"
            subtitle="AI 辅助创作短篇"
            icon={AutoAwesomeIcon}
            gradient={`linear-gradient(135deg, ${systemColors.purple.light} 0%, ${systemColors.purple.dark} 100%)`}
            onClick={() => navigate('/novel_generator')}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <QuickActionCard
            title="新建项目"
            subtitle="开始一个新故事"
            icon={AddIcon}
            gradient={`linear-gradient(135deg, ${systemColors.blue.light} 0%, ${systemColors.blue.dark} 100%)`}
            onClick={() => navigate('/novel_projects/create')}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <QuickActionCard
            title="我的项目"
            subtitle="管理所有小说"
            icon={FolderIcon}
            gradient={`linear-gradient(135deg, ${systemColors.green.light} 0%, ${systemColors.green.dark} 100%)`}
            onClick={() => navigate('/novel_project')}
          />
        </Grid2>
      </Grid2>

      {/* 最近项目 */}
      <Box component={motion.div} variants={itemVariants}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
            📝 最近项目
          </Typography>
          {recentProjects.length > 0 && (
            <Button
              size="small"
              onClick={() => navigate('/novel_project')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              查看全部
            </Button>
          )}
        </Box>

        {loading ? (
          <Grid2 container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid2 key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
              </Grid2>
            ))}
          </Grid2>
        ) : recentProjects.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 5,
              textAlign: 'center',
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <BookIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              开始创作你的第一个故事
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              点击上方"新建项目"或"快速生成小说"开始创作
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/novel_projects/create')}
              sx={{ borderRadius: 3, fontWeight: 600 }}
            >
              新建项目
            </Button>
          </Card>
        ) : (
          <Grid2 container spacing={3}>
            {recentProjects.map((project) => (
              <Grid2 key={project.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProjectCard
                  project={project}
                  onNavigate={(id) => navigate(`/novel_projects/${id}`)}
                  onEdit={(id) => navigate(`/novel_projects/${id}/edit`)}
                />
              </Grid2>
            ))}
          </Grid2>
        )}
      </Box>

      {/* 创作统计 */}
      <Box component={motion.div} variants={itemVariants}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, letterSpacing: '-0.01em' }}>
          📊 创作统计
        </Typography>
        <Grid2 container spacing={3}>
          <Grid2 size={{ xs: 6, sm: 3 }}>
            <StatCard
              title="小说项目"
              value={statistics?.project_count || 0}
              icon={NovelIcon}
              color={systemColors.purple.light}
              loading={loading}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 3 }}>
            <StatCard
              title="章节总数"
              value={statistics?.chapter_count || 0}
              icon={ChapterIcon}
              color={systemColors.blue.light}
              loading={loading}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 3 }}>
            <StatCard
              title="大纲节点"
              value={statistics?.outline_node_count || 0}
              icon={OutlineIcon}
              color={systemColors.green.light}
              loading={loading}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 3 }}>
            <StatCard
              title="总字数"
              value={`${(statistics?.total_words || 0).toLocaleString()} 字`}
              icon={WordCountIcon}
              color={systemColors.orange.light}
              loading={loading}
            />
          </Grid2>
        </Grid2>
      </Box>

      {/* 系统信息折叠区 */}
      <Box component={motion.div} variants={itemVariants}>
        <Card
          elevation={0}
          sx={{
            background: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box
              onClick={handleSystemToggle}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  📦 系统信息：
                </Typography>
                {systemSummary && (
                  <Typography variant="body2" color="text.secondary">
                    {systemSummary.version} | {systemSummary.environment} | 数据库{systemSummary.db_status}
                  </Typography>
                )}
              </Box>
              <IconButton size="small">
                <ExpandMoreIcon
                  sx={{
                    transform: systemExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </IconButton>
            </Box>

            <AnimatePresence>
              {systemExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ pt: 2, mt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                    <Grid2 container spacing={2}>
                      <Grid2 size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <VersionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            版本：{systemSummary?.version}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EnvIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            环境：{systemSummary?.environment}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <StorageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            数据库：{systemSummary?.db_status}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {[
                            'React 18',
                            'TypeScript',
                            'MUI v6',
                            'Framer Motion',
                            'FastAPI',
                            'Tortoise ORM',
                          ].map((tech) => (
                            <Chip
                              key={tech}
                              label={tech}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                borderRadius: '6px',
                                bgcolor: alpha(theme.palette.text.primary, 0.05),
                                fontWeight: 500,
                              }}
                            />
                          ))}
                        </Box>
                      </Grid2>
                    </Grid2>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}
