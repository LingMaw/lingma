import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
    InputAdornment,
    CircularProgress,
    Avatar,
} from '@mui/material'
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    Save as SaveIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import type { User } from '@/frontend/core/types'
import type { ProfileFormData } from './types'

// 动画变体
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.25, 0, 1]
        }
    }
}

interface ProfileInfoSectionProps {
    user: User | null
    profileForm: ProfileFormData
    loading: boolean
    onProfileChange: (field: string, value: string) => void
    onSave: () => void
}

export default function ProfileInfoSection({
    user,
    profileForm,
    loading,
    onProfileChange,
    onSave
}: ProfileInfoSectionProps) {
    return (
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
                        onClick={onSave}
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
                            onChange={(e) => onProfileChange('nickname', e.target.value)}
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
                            onChange={(e) => onProfileChange('email', e.target.value)}
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
                            onChange={(e) => onProfileChange('avatar', e.target.value)}
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
    )
}
