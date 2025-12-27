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
import { chapterAPI } from '@/features/novel_project/frontend/chapter_api'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import BookIcon from '@mui/icons-material/Book'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import AccountTreeIcon from '@mui/icons-material/AccountTree'

const ProjectViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const [project, setProject] = useState<any>(null)
    const [chapters, setChapters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')

    // 格式化章节内容，处理换行和段落
    const formatChapterContent = (content: string) => {
        // 将连续的换行符替换为段落标签
        return content
            .split('\n\n')
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('')
    }

    const navigate = useNavigate()
    const theme = useTheme()

    useEffect(() => {
        if (id) {
            fetchProject()
            fetchChapters()
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

    const fetchChapters = async () => {
        try {
            const chaptersData = await chapterAPI.getChapters(Number(id))
            setChapters(chaptersData.items)
        } catch (err) {
            console.error('获取章节列表失败:', err)
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
                                variant="outlined"
                                startIcon={<AccountTreeIcon />}
                                onClick={() => navigate(`/novel_projects/${id}/outline`)}
                                sx={{
                                    borderRadius: 3,
                                    py: 1,
                                    px: 2,
                                    mr: 1,
                                    fontWeight: 600,
                                }}
                            >
                                编辑大纲
                            </Button>
                            {project?.use_chapter_system ? (
                                <Button
                                    variant="contained"
                                    startIcon={<BookIcon />}
                                    onClick={() => navigate(`/novel_projects/${id}/chapters`)}
                                    sx={{
                                        borderRadius: 3,
                                        py: 1,
                                        px: 2,
                                        mr: 1,
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
                                    章节管理
                                </Button>
                            ) : (
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
                            )}
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

                    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                        <motion.div variants={itemVariants} style={{ flex: 1, display: 'flex', height: '100%' }}>
                            <Grid2 container spacing={3} sx={{ flex: 1, height: '100%' }}>
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
                                            display: 'flex',
                                            flexDirection: 'column'
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

                                {/* 章节内容显示 */}
                                <Grid2 size={{ xs: 12, lg: 8 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                                            flexDirection: 'column',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <BookIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                {project?.use_chapter_system ? '章节内容' : '小说内容'}
                                            </Typography>
                                        </Box>

                                        {!project?.use_chapter_system ? (
                                            // 显示完整内容
                                            <Box sx={{ 
                                                flex: 1, 
                                                overflow: 'auto',
                                                pr: 1,
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: alpha(theme.palette.background.paper, 0.3),
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: alpha(theme.palette.primary.main, 0.4),
                                                    borderRadius: '4px',
                                                    '&:hover': {
                                                        background: alpha(theme.palette.primary.main, 0.6),
                                                    }
                                                }
                                            }}>
                                                <Typography 
                                                    component="div"
                                                    sx={{ 
                                                        whiteSpace: 'pre-wrap',
                                                        lineHeight: 1.8,
                                                        color: 'text.primary',
                                                        fontSize: '1rem',
                                                        fontFamily: '"Merriweather", "Georgia", "Times New Roman", serif',
                                                        '& p': {
                                                            margin: '0 0 1em 0',
                                                        },
                                                        '& p:last-child': {
                                                            margin: 0,
                                                        }
                                                    }}
                                                >
                                                    {project?.content || '暂无内容'}
                                                </Typography>
                                            </Box>
                                        ) : chapters.length === 0 ? (
                                            <Box sx={{ 
                                                textAlign: 'center', 
                                                py: 8,
                                                borderRadius: 3,
                                                bgcolor: alpha(theme.palette.background.default, 0.6),
                                                border: `1px dashed ${theme.palette.divider}`
                                            }}>
                                                <BookIcon sx={{ fontSize: 48, color: 'primary.light', mb: 2 }} />
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                                    暂无章节内容
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                                    该项目尚未添加任何章节
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<BookIcon />}
                                                    onClick={() => navigate(`/novel_projects/${id}/chapters`)}
                                                    sx={{
                                                        borderRadius: 3,
                                                        py: 1.5,
                                                        px: 4,
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
                                                    添加章节
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ 
                                                flex: 1, 
                                                overflow: 'auto',
                                                pr: 1,
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: alpha(theme.palette.background.paper, 0.3),
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: alpha(theme.palette.primary.main, 0.4),
                                                    borderRadius: '4px',
                                                    '&:hover': {
                                                        background: alpha(theme.palette.primary.main, 0.6),
                                                    }
                                                }
                                            }}>
                                                {chapters.map((chapter, index) => (
                                                    <Paper 
                                                        key={chapter.chapter_id || `chapter-${index}`}
                                                        elevation={0}
                                                        onClick={() => navigate(`/novel_projects/${id}/chapter/${chapter.chapter_id}`)}
                                                        sx={{
                                                            mb: 3,
                                                            p: 3,
                                                            borderRadius: 3,
                                                            backgroundColor: alpha(theme.palette.background.paper, 0.7),
                                                            backdropFilter: 'blur(20px)',
                                                            border: `1px solid ${theme.palette.divider}`,
                                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                            '&:hover': {
                                                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
                                                                transform: 'translateY(-2px)',
                                                                transition: 'all 0.3s ease',
                                                                cursor: 'pointer'
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            mb: 2,
                                                            pb: 1.5,
                                                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`
                                                        }}>
                                                            <Box sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mr: 2,
                                                                flexShrink: 0
                                                            }}>
                                                                <Typography 
                                                                    variant="caption" 
                                                                    sx={{ 
                                                                        fontWeight: 700, 
                                                                        color: 'primary.main' 
                                                                    }}
                                                                >
                                                                    {index + 1}
                                                                </Typography>
                                                            </Box>
                                                            <Typography 
                                                                variant="h6" 
                                                                sx={{ 
                                                                    fontWeight: 700,
                                                                    color: 'text.primary'
                                                                }}
                                                            >
                                                                第{chapter.chapter_number }章   {chapter.title}
                                                            </Typography>
                                                        </Box>
                                                        <Typography 
                                                            component="div"
                                                            sx={{ 
                                                                whiteSpace: 'pre-wrap',
                                                                lineHeight: 1.8,
                                                                color: 'text.primary',
                                                                fontSize: '1rem',
                                                                fontFamily: '"Merriweather", "Georgia", "Times New Roman", serif',
                                                                '& p': {
                                                                    margin: '0 0 1em 0',
                                                                },
                                                                '& p:last-child': {
                                                                    margin: 0,
                                                                }
                                                            }}
                                                            dangerouslySetInnerHTML={{ __html: formatChapterContent(chapter.content || '暂无内容') }}
                                                        />
                                                    </Paper>
                                                ))}
                                            </Box>
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