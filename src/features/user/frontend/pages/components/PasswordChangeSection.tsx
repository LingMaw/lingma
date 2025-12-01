import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
} from '@mui/material'
import {
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import type { PasswordFormData, PasswordVisibility } from './types'

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

interface PasswordChangeSectionProps {
    passwordForm: PasswordFormData
    showPasswords: PasswordVisibility
    loading: boolean
    onPasswordChange: (field: string, value: string) => void
    onTogglePasswordVisibility: (field: 'old' | 'new' | 'confirm') => void
    onSave: () => void
}

export default function PasswordChangeSection({
    passwordForm,
    showPasswords,
    loading,
    onPasswordChange,
    onTogglePasswordVisibility,
    onSave
}: PasswordChangeSectionProps) {
    return (
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
                            onChange={(e) => onPasswordChange('oldPassword', e.target.value)}
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
                                            onClick={() => onTogglePasswordVisibility('old')}
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
                            onChange={(e) => onPasswordChange('newPassword', e.target.value)}
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
                                            onClick={() => onTogglePasswordVisibility('new')}
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
                            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
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
                                            onClick={() => onTogglePasswordVisibility('confirm')}
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
                            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                fontWeight: 600
                            }}
                            onClick={onSave}
                            disabled={loading}
                        >
                            {loading ? '更新中...' : '更新密码'}
                            {!loading && <LockIcon sx={{ ml: 1 }} />}
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}
