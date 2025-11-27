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
    Snackbar,
    Chip,
    Divider,
    useTheme,
    alpha,
    IconButton,
    Tooltip
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { novelProjectAPI } from '@/features/novel_project/frontend'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import BookIcon from '@mui/icons-material/Book'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'

const ProjectViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')

    const navigate = useNavigate()
    const theme = useTheme()

    useEffect(() => {
        if (id) {
            fetchProject()
        }
    }, [id])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const projectData = await novelProjectAPI.getProject(Number(id))
            setProject(projectData)
        } catch (err) {
            setError('获取项目信息失败')
            setSnackbarMessage('获取项目信息失败')
            setSnackbarOpen(true)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyContent = () => {
        if (project?.content) {
            navigator.clipboard.writeText(project.content)
            setSnackbarMessage('内容已复制到剪贴板')
            setSnackbarOpen(true)
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

    const getGenreText = (genre: string) => {
        return genre || '未指定'
    }

    const getStyleText = (style: string) => {
        return style || '未指定'
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
                <Container maxWidth="xl" sx={{ py: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/novel_project')}
                            sx={{ borderRadius: 3 }}
                        >
                            返回项目列表
                        </Button>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                            项目详情
                        </Typography>
                        <Box>
                            <Button
                                variant="contained"
                                startIcon={<AutoStoriesIcon />}
                                onClick={() => {
                                    if (!project) {
                                        alert('项目信息未加载，请稍候')
                                        return
                                    }
                                    navigate('/novel_generator', { 
                                        state: { 
                                            project: {
                                                id: project.id,
                                                title: project.title,
                                                genre: project.genre,
                                                style: project.style,
                                                description: project.description,
                                                content: project.content,
                                                status: project.status,
                                                word_count: project.word_count,
                                                created_at: project.created_at,
                                                updated_at: project.updated_at
                                            },
                                            content: project.content || ''
                                        } 
                                    })
                                }}
                                sx={{
                                    borderRadius: 3,
                                    py: 1,
                                    px: 2,
                                    mr: 1,
                                    fontWeight: 600,
                                    background: (theme) =>
                                        `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                                    boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                    '&:hover': {
                                        background: (theme) =>
                                            `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.8)} 0%, ${theme.palette.secondary.main} 100%)`,
                                    }
                                }}
                            >
                                AI创作
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/novel_projects/${id}/edit`)}
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
                                编辑项目
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <motion.div variants={itemVariants}>
                            <Grid2 container spacing={3}>
                                {/* 项目基本信息 */}
                                <Grid2 size={{ xs: 12, lg: 4 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                            backdropFilter: 'blur(20px)',
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 3,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <Box
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: '16px',
                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 2,
                                                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                                }}
                                            >
                                                <BookIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {project?.title}
                                                </Typography>
                                                <Chip
                                                    label={getStatusText(project?.status)}
                                                    color={getStatusColor(project?.status) as any}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        borderRadius: '6px',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        mt: 0.5
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                类型
                                            </Typography>
                                            <Typography variant="body1">
                                                {getGenreText(project?.genre)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                风格
                                            </Typography>
                                            <Typography variant="body1">
                                                {getStyleText(project?.style)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                字数
                                            </Typography>
                                            <Typography variant="body1">
                                                {project?.word_count || 0} 字
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                创建时间
                                            </Typography>
                                            <Typography variant="body1">
                                                {project?.created_at ? new Date(project.created_at).toLocaleString() : '未知'}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid2>

                                {/* 小说内容展示 */}
                                <Grid2 size={{ xs: 12, lg: 8 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                            backdropFilter: 'blur(20px)',
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 3,
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                小说内容
                                            </Typography>
                                            {project?.content && (
                                                <Tooltip title="复制内容">
                                                    <IconButton size="small" onClick={handleCopyContent}>
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Box
                                            sx={{
                                                flex: 1,
                                                overflow: 'auto',
                                                p: 2,
                                                backgroundColor: alpha(theme.palette.background.default, 0.3),
                                                borderRadius: 2,
                                                border: `1px dashed ${theme.palette.divider}`
                                            }}
                                        >
                                            {project?.content ? (
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
                                                    {project.content}
                                                </Typography>
                                            ) : (
                                                <Box sx={{ 
                                                    height: '100%', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    color: 'text.secondary'
                                                }}>
                                                    <Typography>该项目暂无小说内容</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid2>
                            </Grid2>
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
                        severity="success"
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </motion.div>
        </Box>
    )
}

export default ProjectViewPage