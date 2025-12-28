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
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { novelProjectAPI } from '@/features/novel_project/frontend'
import { chapterAPI } from '@/features/chapter/frontend'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import BookIcon from '@mui/icons-material/Book' 
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PersonIcon from '@mui/icons-material/Person'

const ProjectViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [chapters, setChapters] = useState<any[]>([])

    const navigate = useNavigate()
    const theme = useTheme()

    useEffect(() => {
        if (id) {
            fetchProject()
        }
    }, [id])

    // 监听窗口焦点，每次回到页面時刷新数据
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && id) {
                fetchProject()
            }
        }
        window.addEventListener('focus', handleVisibilityChange)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            window.removeEventListener('focus', handleVisibilityChange)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [id])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const projectData = await novelProjectAPI.getProject(Number(id))
            setProject(projectData)
            
            // 只有启用章节系统的项目才获取章节
            if (projectData.use_chapter_system) {
                try {
                    const chaptersData = await chapterAPI.getChapters(Number(id))
                    setChapters(chaptersData)
                } catch (err) {
                    console.error('获取章节失败:', err)
                    setChapters([])
                }
            } else {
                setChapters([])
            }
        } catch (err) {
            setError('获取项目信息失败')
            setSnackbarMessage('获取项目信息失败')
            setSnackbarOpen(true)
        } finally {
            setLoading(false)
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

    const getChapterStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return '草稿'
            case 'completed': return '已完成'
            case 'ai_generated': return 'AI生成'
            default: return status
        }
    }

    const getChapterStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'default'
            case 'completed': return 'success'
            case 'ai_generated': return 'info'
            default: return 'default'
        }
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {project?.use_chapter_system && (
                                <Button
                                    variant="contained"
                                    startIcon={<ListAltIcon />}
                                    onClick={() => navigate(`/novel_projects/${id}/chapters`)}
                                    sx={{
                                        borderRadius: 3,
                                        py: 1,
                                        px: 2,
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
                                    章节管理
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                startIcon={<PersonIcon />}
                                onClick={() => navigate(`/novel_projects/${id}/characters`)}
                                sx={{
                                    borderRadius: 3,
                                    py: 1,
                                    px: 2,
                                    fontWeight: 600,
                                    background: (theme) =>
                                        `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
                                    boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.info.main, 0.2)}`,
                                    '&:hover': {
                                        background: (theme) =>
                                            `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.8)} 0%, ${theme.palette.info.main} 100%)`,
                                    }
                                }}
                            >
                                角色设定
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

                                        <Divider sx={{ my: 3 }} />

                                        {/* 大纲和章节管理入口 */}
                                        {project?.use_chapter_system && (
                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                                                    内容管理
                                                </Typography>
                                                <Grid2 container spacing={2}>
                                                    <Grid2 size={{ xs: 12 }}>
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            startIcon={<AccountTreeIcon />}
                                                            onClick={() => navigate(`/novel_projects/${id}/outline`)}
                                                            sx={{
                                                                borderRadius: 2,
                                                                py: 1.5,
                                                                borderColor: theme.palette.divider,
                                                                color: theme.palette.text.primary,
                                                                justifyContent: 'flex-start',
                                                                '&:hover': {
                                                                    borderColor: theme.palette.primary.main,
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                                }
                                                            }}
                                                        >
                                                            大纲管理
                                                        </Button>
                                                    </Grid2>
                                                    <Grid2 size={{ xs: 12 }}>
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            startIcon={<ListAltIcon />}
                                                            onClick={() => navigate(`/novel_projects/${id}/chapters`)}
                                                            sx={{
                                                                borderRadius: 2,
                                                                py: 1.5,
                                                                borderColor: theme.palette.divider,
                                                                color: theme.palette.text.primary,
                                                                justifyContent: 'flex-start',
                                                                '&:hover': {
                                                                    borderColor: theme.palette.primary.main,
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                                }
                                                            }}
                                                        >
                                                            章节列表
                                                        </Button>
                                                    </Grid2>
                                                    <Grid2 size={{ xs: 12 }}>
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            startIcon={<PersonIcon />}
                                                            onClick={() => navigate(`/novel_projects/${id}/characters`)}
                                                            sx={{
                                                                borderRadius: 2,
                                                                py: 1.5,
                                                                borderColor: theme.palette.divider,
                                                                color: theme.palette.text.primary,
                                                                justifyContent: 'flex-start',
                                                                '&:hover': {
                                                                    borderColor: theme.palette.primary.main,
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                                }
                                                            }}
                                                        >
                                                            角色设定
                                                        </Button>
                                                    </Grid2>
                                                </Grid2>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid2>

                                {/* 章节列表或正文展示 */}
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
                                        {project?.use_chapter_system ? (
                                            // 启用章节系统：显示章节列表
                                            <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                        章节列表 ({chapters.length})
                                                    </Typography>
                                                </Box>

                                                {chapters.length > 0 ? (
                                                    <Box
                                                        sx={{
                                                            flex: 1,
                                                            overflow: 'auto',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 2
                                                        }}
                                                    >
                                                        {chapters.map((chapter) => (
                                                            <Paper
                                                                key={chapter.id}
                                                                elevation={0}
                                                                sx={{
                                                                    p: 2,
                                                                    backgroundColor: alpha(theme.palette.background.default, 0.3),
                                                                    border: `1px solid ${theme.palette.divider}`,
                                                                    borderRadius: 2,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s ease',
                                                                    '&:hover': {
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                                        borderColor: theme.palette.primary.main,
                                                                    }
                                                                }}
                                                                onClick={() => {
                                                                    navigate(`/novel_projects/${id}/chapters/${chapter.id}`)
                                                                    // 延迟刷新，确保返回时数据已更新
                                                                    setTimeout(() => fetchProject(), 500)
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                        {chapter.title}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={getChapterStatusLabel(chapter.status)}
                                                                        color={getChapterStatusColor(chapter.status) as any}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                </Box>
                                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        第 {chapter.chapter_number} 章
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {chapter.word_count > 0 ? `${chapter.word_count} 字` : '待编写'}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {new Date(chapter.updated_at).toLocaleDateString()}
                                                                    </Typography>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ 
                                                        height: '100%', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        color: 'text.secondary'
                                                    }}>
                                                        <Typography>该项目暂无章节，前往章节列表创建</Typography>
                                                    </Box>
                                                )}
                                            </>
                                        ) : (
                                            // 未启用章节系统：显示正文内容
                                            <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                        正文内容
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => navigate(`/novel_projects/${id}/content-editor`)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            py: 0.75,
                                                            px: 2,
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
                                                        编辑内容
                                                    </Button>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        overflow: 'auto',
                                                        p: 2,
                                                        backgroundColor: alpha(theme.palette.background.default, 0.3),
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {project?.content ? (
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                                lineHeight: 1.8,
                                                                textIndent: '2em'
                                                            }}
                                                        >
                                                            {project.content}
                                                        </Typography>
                                                    ) : (
                                                        <Box sx={{ 
                                                            height: '100%', 
                                                            display: 'flex', 
                                                            flexDirection: 'column',
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            color: 'text.secondary',
                                                            gap: 2
                                                        }}>
                                                            <Typography>暂无正文内容</Typography>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<EditIcon />}
                                                                onClick={() => navigate(`/novel_projects/${id}/content-editor`)}
                                                                sx={{ borderRadius: 2 }}
                                                            >
                                                                开始编辑
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </>
                                        )}
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