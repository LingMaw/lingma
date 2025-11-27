import React, { useEffect, useState } from 'react'
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Grid2,
    Paper,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Snackbar,
    Select,
    MenuItem,
    useTheme,
    alpha
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { novelProjectAPI } from '@/features/novel_project/frontend'
import { containerVariants, itemVariants, scaleVariants } from '@/frontend/core/animation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>()
    const isEditing = Boolean(id)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [genre, setGenre] = useState('')
    const [style, setStyle] = useState('')
    const [status, setStatus] = useState('draft')

    const [loading, setLoading] = useState(isEditing)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [snackbarOpen, setSnackbarOpen] = useState(false)

    const navigate = useNavigate()
    const theme = useTheme()

    useEffect(() => {
        if (isEditing) {
            fetchProject()
        }
    }, [id])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const project = await novelProjectAPI.getProject(Number(id))
            setTitle(project.title)
            setDescription(project.description || '')
            setGenre(project.genre || '')
            setStyle(project.style || '')
            setStatus(project.status || 'draft') // 处理可能为null的情况
        } catch (err) {
            setError('获取项目信息失败')
            setSnackbarOpen(true)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            setSaving(true)

            const projectData = {
                title,
                description,
                genre,
                style,
                status,
                word_count: 0 // 添加缺失的word_count字段
            }

            if (isEditing) {
                await novelProjectAPI.updateProject(Number(id), projectData)
                setError('项目更新成功')
            } else {
                await novelProjectAPI.createProject(projectData)
                setError('项目创建成功')
            }

            setSnackbarOpen(true)
            setTimeout(() => navigate('/novel_project'), 1500)
        } catch (err) {
            setError(isEditing ? '更新项目失败' : '创建项目失败')
            setSnackbarOpen(true)
        } finally {
            setSaving(false)
        }
    }

    const genreOptions = ['科幻', '奇幻', '悬疑', '爱情', '历史', '军事', '都市', '武侠', '仙侠', '游戏', '体育', '灵异']
    const styleOptions = ['现实主义', '浪漫主义', '古典主义', '现代主义', '魔幻现实主义', '黑色幽默', '意识流', '自然主义']
    const statusOptions = [
        { value: 'draft', label: '草稿' },
        { value: 'in_progress', label: '进行中' },
        { value: 'completed', label: '已完成' },
        { value: 'archived', label: '已归档' }
    ]

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
                            onClick={() => navigate('/novel_project')}
                            sx={{ borderRadius: 3 }}
                        >
                            返回项目列表
                        </Button>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                            {isEditing ? '编辑项目' : '新建项目'}
                        </Typography>
                        <motion.div variants={scaleVariants} whileHover="hover" whileTap="tap">
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={saving || !title.trim()}
                                startIcon={saving ? <CircularProgress size={20} /> : null}
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
                                {saving ? '保存中...' : '保存项目'}
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
                                        <FormControl fullWidth>
                                            <FormLabel sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>项目标题 *</FormLabel>
                                            <TextField
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="请输入项目标题"
                                                variant="outlined"
                                                fullWidth
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </Grid2>

                                    <Grid2 size={12}>
                                        <FormControl fullWidth>
                                            <FormLabel sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>项目描述</FormLabel>
                                            <TextField
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="请输入项目描述"
                                                multiline
                                                rows={4}
                                                variant="outlined"
                                                fullWidth
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </Grid2>

                                    <Grid2 size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth variant="outlined">
                                            <FormLabel sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>小说类型</FormLabel>
                                            <Select
                                                value={genre}
                                                onChange={(e) => setGenre(e.target.value)}
                                                displayEmpty
                                                sx={{
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: theme.palette.divider,
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'primary.main',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'primary.main',
                                                        borderWidth: '1px',
                                                    }
                                                }}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>选择类型</em>
                                                </MenuItem>
                                                {genreOptions.map((g) => (
                                                    <MenuItem key={g} value={g}>
                                                        {g}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid2>

                                    <Grid2 size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth variant="outlined">
                                            <FormLabel sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>写作风格</FormLabel>
                                            <Select
                                                value={style}
                                                onChange={(e) => setStyle(e.target.value)}
                                                displayEmpty
                                                sx={{
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: theme.palette.divider,
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'primary.main',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'primary.main',
                                                        borderWidth: '1px',
                                                    }
                                                }}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>选择风格</em>
                                                </MenuItem>
                                                {styleOptions.map((s) => (
                                                    <MenuItem key={s} value={s}>
                                                        {s}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid2>

                                    <Grid2 size={12}>
                                        <FormControl fullWidth variant="outlined">
                                            <FormLabel sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>项目状态</FormLabel>
                                            <Select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                sx={{
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: theme.palette.divider,
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'primary.main',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'primary.main',
                                                        borderWidth: '1px',
                                                    }
                                                }}
                                            >
                                                {statusOptions.map((s) => (
                                                    <MenuItem key={s.value} value={s.value}>
                                                        {s.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
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

export default ProjectDetailPage