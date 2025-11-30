import { useState, useEffect } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
    Divider,
    IconButton,
    InputAdornment,
    CircularProgress,
    Avatar,
} from '@mui/material'
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Save as SaveIcon,
    SmartToy as SmartToyIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import { userAPI } from '@/features/user/frontend'
import { useUserStore } from '@/frontend/shared/stores/user'
import { useNotification } from '@/frontend/shared/hooks/useNotification'

export default function ProfilePage() {
    const { user, setUser } = useUserStore()
    const { error: showError, success: showSuccess } = useNotification()
    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [aiSettingsLoading, setAiSettingsLoading] = useState(false)

    // 获取用户设置
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const userSettings = await userAPI.getUserSettings()
                setAiSettings(userSettings)
            } catch (error) {
                console.error('获取AI配置失败:', error)
            }
        }

        fetchSettings()
    }, [])

    // 个人信息表单状态
    const [profileForm, setProfileForm] = useState({
        nickname: user?.nickname || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
    })

    // AI配置状态
    const [aiSettings, setAiSettings] = useState<Record<string, string>>({
        api_key: '',
        api_base: '',
        api_model: 'gpt-3.5-turbo',
        api_max_tokens: '16000',
        auto_save: 'true'
    })

    // 密码表单状态
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    // 密码可见性状态
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    })

    // 处理个人信息表单变更
    const handleProfileChange = (field: string, value: string) => {
        setProfileForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // 处理AI配置变更
    const handleAiSettingsChange = (field: string, value: string) => {
        setAiSettings(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // 处理密码表单变更
    const handlePasswordChange = (field: string, value: string) => {
        setPasswordForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // 切换密码可见性
    const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

    // 更新个人信息
    const handleUpdateProfile = async () => {
        if (!user) return

        setLoading(true)
        try {
            // 更新用户资料
            const updatedUser = await userAPI.updateProfile(profileForm)
            setUser(updatedUser)

            // 保存AI配置
            const updatePromises = Object.entries(aiSettings).map(([key, value]) =>
                userAPI.updateUserSetting(key, value)
            )

            try {
                await Promise.all(updatePromises)
            } catch (error) {
                console.error('部分AI设置更新失败:', error)
                // 即使部分设置更新失败，我们仍然显示成功，但记录错误
            }

            showSuccess('个人信息和AI配置更新成功')
        } catch (error) {
            showError('更新失败: ' + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    // 更新密码
    const handleUpdatePassword = async () => {
        // 验证密码表单
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showError('新密码和确认密码不匹配')
            return
        }

        if (passwordForm.newPassword.length < 6) {
            showError('新密码长度至少为6位')
            return
        }

        if (!passwordForm.oldPassword) {
            showError('请输入旧密码')
            return
        }

        setPasswordLoading(true)
        try {
            await userAPI.updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
            showSuccess('密码更新成功')

            // 清空密码表单
            setPasswordForm({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
        } catch (error) {
            showError('密码更新失败: ' + (error as Error).message)
        } finally {
            setPasswordLoading(false)
        }
    }

    // 更新AI配置
    const handleUpdateAiSettings = async () => {
        if (!user) return

        setAiSettingsLoading(true)
        try {
            // 保存AI配置
            const updatePromises = Object.entries(aiSettings).map(([key, value]) =>
                userAPI.updateUserSetting(key, value)
            )

            try {
                await Promise.all(updatePromises)
            } catch (error) {
                console.error('部分AI设置更新失败:', error)
                showError('部分AI设置更新失败: ' + (error as Error).message)
                return
            }

            showSuccess('AI配置更新成功')
        } catch (error) {
            showError('更新失败: ' + (error as Error).message)
        } finally {
            setAiSettingsLoading(false)
        }
    }

    return (
        <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    个人资料
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    管理您的个人信息和账户安全设置
                </Typography>
            </Box>

            <Stack spacing={4}>
                {/* 个人信息卡片 */}
                <Card component={motion.div} variants={itemVariants} sx={{
                    boxShadow: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'visible',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                    }
                }}>
                    <CardContent>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 4,
                            pb: 2,
                            borderBottom: '2px solid',
                            borderColor: 'primary.light',
                            borderRadius: 1
                        }}>
                            <PersonIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                                个人信息
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="medium"
                                sx={{
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1
                                }}
                                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                onClick={handleUpdateProfile}
                                disabled={loading}
                            >
                                保存
                            </Button>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', lg: 'row' },
                            gap: { xs: 3, lg: 4 },
                            alignItems: { xs: 'center', lg: 'flex-start' }
                        }}>
                            {/* 头像预览和信息 */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: { xs: '100%', lg: 240 },
                                p: 2,
                                bgcolor: 'action.hover',
                                borderRadius: 3
                            }}>
                                {profileForm.avatar ? (
                                    <Avatar
                                        src={profileForm.avatar}
                                        sx={{
                                            width: 140,
                                            height: 140,
                                            mb: 2.5,
                                            border: '4px solid',
                                            borderColor: 'primary.main',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'scale(1.08) rotate(2deg)',
                                                boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
                                            }
                                        }}
                                    />
                                ) : (
                                    <Avatar
                                        sx={{
                                            width: 140,
                                            height: 140,
                                            mb: 2.5,
                                            bgcolor: 'primary.main',
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            border: '4px solid',
                                            borderColor: 'primary.light',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                                        }}
                                    >
                                        {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                                    </Avatar>
                                )}

                                {/* 用户基本信息 */}
                                <Box sx={{
                                    textAlign: 'center',
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    p: 2,
                                    width: '100%',
                                    mb: 1.5
                                }}>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={700}
                                        color="primary.main"
                                        sx={{ mb: 0.5 }}
                                    >
                                        {user?.nickname || user?.username}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        @{user?.username}
                                    </Typography>
                                </Box>

                                {/* 注册时间 */}
                                {user?.created_at && (
                                    <Box sx={{
                                        textAlign: 'center',
                                        bgcolor: 'background.paper',
                                        borderRadius: 2,
                                        p: 2,
                                        width: '100%',
                                        borderLeft: '4px solid',
                                        borderColor: 'success.main'
                                    }}>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                            📅 注册时间
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="success.main">
                                            {new Date(user.created_at).toLocaleDateString('zh-CN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* 表单区域 */}
                            <Stack spacing={3} sx={{ flex: 1, width: '100%' }}>
                                <TextField
                                    label="用户名"
                                    value={user?.username || ''}
                                    disabled
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input.Mui-disabled': {
                                            WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                                        }
                                    }}
                                />

                                <TextField
                                    label="昵称"
                                    value={profileForm.nickname}
                                    onChange={(e) => handleProfileChange('nickname', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    label="邮箱"
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => handleProfileChange('email', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    label="头像URL"
                                    value={profileForm.avatar}
                                    onChange={(e) => handleProfileChange('avatar', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LinkIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {profileForm.avatar && (
                                                    <Avatar
                                                        src={profileForm.avatar}
                                                        sx={{ width: 24, height: 24 }}
                                                    />
                                                )}
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* AI配置和密码修改并排放置 */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
                    gap: 4
                }}>
                    {/* AI配置卡片 */}
                    <Card component={motion.div} variants={itemVariants} sx={{
                        boxShadow: 2,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4
                        }
                    }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 4,
                                pb: 2,
                                borderBottom: '2px solid',
                                borderColor: 'primary.light',
                                borderRadius: 1
                            }}>
                                <SmartToyIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                                    AI 服务配置
                                </Typography>
                            </Box>

                            <Stack spacing={3}>
                                <TextField
                                    label="API Key"
                                    type="password"
                                    value={aiSettings.api_key || ''}
                                    onChange={e => handleAiSettingsChange('api_key', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    helperText="请输入您的 AI 服务 API 密钥"
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            ml: 0,
                                            mt: 1,
                                            fontSize: '0.85rem'
                                        }
                                    }}
                                />

                                <TextField
                                    label="API Base URL"
                                    value={aiSettings.api_base || ''}
                                    onChange={e => handleAiSettingsChange('api_base', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    helperText="AI 服务的基础 URL，例如：https://api.openai.com/v1"
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            ml: 0,
                                            mt: 1,
                                            fontSize: '0.85rem'
                                        }
                                    }}
                                />

                                <TextField
                                    label="模型名称"
                                    value={aiSettings.api_model || 'gpt-3.5-turbo'}
                                    onChange={e => handleAiSettingsChange('api_model', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    helperText="使用的 AI 模型，例如：gpt-3.5-turbo, gpt-4"
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            ml: 0,
                                            mt: 1,
                                            fontSize: '0.85rem'
                                        }
                                    }}
                                />

                                <TextField
                                    label="最大 Token 数"
                                    type="number"
                                    value={aiSettings.api_max_tokens || '16000'}
                                    onChange={e => handleAiSettingsChange('api_max_tokens', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    helperText="单次请求的最大 token 数量"
                                    InputProps={{
                                        inputProps: { min: 1, max: 100000 }
                                    }}
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            ml: 0,
                                            mt: 1,
                                            fontSize: '0.85rem'
                                        }
                                    }}
                                />

                                <TextField
                                    label="自动保存"
                                    value={aiSettings.auto_save || 'true'}
                                    onChange={e => handleAiSettingsChange('auto_save', e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    helperText="是否自动保存生成的内容 (true/false)"
                                    sx={{
                                        '& .MuiFormHelperText-root': {
                                            ml: 0,
                                            mt: 1,
                                            fontSize: '0.85rem'
                                        }
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        endIcon={aiSettingsLoading ? <CircularProgress size={20} color="inherit" /> : null}
                                        sx={{
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1.5
                                        }}
                                        onClick={handleUpdateAiSettings}
                                        disabled={aiSettingsLoading}
                                    >
                                        {aiSettingsLoading ? '保存中...' : '保存配置'}
                                        {!aiSettingsLoading && <SaveIcon sx={{ ml: 1 }} />}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* 修改密码卡片 */}
                    <Card component={motion.div} variants={itemVariants} sx={{
                        boxShadow: 2,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4
                        }
                    }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 4,
                                pb: 2,
                                borderBottom: '2px solid',
                                borderColor: 'primary.light',
                                borderRadius: 1
                            }}>
                                <LockIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                                <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                                    修改密码
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: 'calc(100% - 60px)' // 减去标题区域的高度
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                    flex: 1
                                }}>
                                    <TextField
                                        label="当前密码"
                                        type={showPasswords.old ? 'text' : 'password'}
                                        value={passwordForm.oldPassword}
                                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                                        fullWidth
                                        variant="outlined"
                                        helperText="输入当前使用的密码"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => togglePasswordVisibility('old')}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showPasswords.old ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        label="新密码"
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        fullWidth
                                        variant="outlined"
                                        helperText="新密码至少6位字符"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => togglePasswordVisibility('new')}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        label="确认新密码"
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        fullWidth
                                        variant="outlined"
                                        helperText="再次输入新密码确认"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => togglePasswordVisibility('confirm')}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="large"
                                        endIcon={passwordLoading ? <CircularProgress size={20} color="inherit" /> : null}
                                        sx={{
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 600
                                        }}
                                        onClick={handleUpdatePassword}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? '更新中...' : '更新密码'}
                                        {!passwordLoading && <LockIcon sx={{ ml: 1 }} />}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Stack>
        </Box>
    )
}