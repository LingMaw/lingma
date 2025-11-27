import { useEffect, useState, useCallback, useRef } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControlLabel,
    FormGroup,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
    Save as SaveIcon,
    SmartToy as SmartToyIcon
} from '@mui/icons-material'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import { userAPI } from '@/features/user/frontend/api'
import { useNotification } from '@/frontend/shared/hooks/useNotification'

// 防抖函数
const useDebounce = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    return useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args)
        }, delay)
    }, [callback, delay])
}

export default function SettingsPage() {
    const { error: showError, success: showSuccess } = useNotification()
    const [settings, setSettings] = useState<Record<string, string> | null>(null)
    const [loading, setLoading] = useState(true)

    // 获取用户设置
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const userSettings = await userAPI.getUserSettings()
                setSettings(userSettings)
            } catch (error) {
                showError('获取设置失败')
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [showError])

    // 更新服务器设置
    const updateServerSetting = useCallback(async (key: string, value: string) => {
        if (!settings) return

        try {
            await userAPI.updateUserSetting(key, value)
        } catch (error) {
            showError('更新设置失败')
        }
    }, [settings, showError])

    // 使用防抖优化服务器更新
    const debouncedUpdateSetting = useDebounce(updateServerSetting, 500)

    // 更新本地设置
    const updateLocalSetting = (key: string, value: string) => {
        if (!settings) return

        // 立即更新本地状态以提供即时反馈
        setSettings(prev => {
            if (!prev) return prev
            return { ...prev, [key]: value }
        })

        // 防抖更新服务器设置
        debouncedUpdateSetting(key, value)
    }

    // 重置设置
    const resetSettings = async () => {
        try {
            const resetSettings = await userAPI.resetUserSettings()
            setSettings(resetSettings)
            showSuccess('设置已重置')
        } catch (error) {
            showError('重置设置失败')
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography>加载中...</Typography>
            </Box>
        )
    }

    // 如果设置尚未加载完成，不显示设置内容
    if (!settings) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography>加载失败</Typography>
            </Box>
        )
    }

    return (
        <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    AI 配置设置
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    配置您的 AI 服务参数
                </Typography>
            </Box>

            <Card component={motion.div} variants={itemVariants} sx={{ boxShadow: 2, maxWidth: 600 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                            AI 服务配置
                        </Typography>
                    </Box>

                    <Stack spacing={3}>
                        <TextField
                            label="API Key"
                            type="password"
                            value={settings.api_key || ''}
                            onChange={e => updateLocalSetting('api_key', e.target.value)}
                            fullWidth
                            helperText="请输入您的 AI 服务 API 密钥"
                        />

                        <TextField
                            label="API Base URL"
                            value={settings.api_base || ''}
                            onChange={e => updateLocalSetting('api_base', e.target.value)}
                            fullWidth
                            helperText="AI 服务的基础 URL，例如：https://api.openai.com/v1"
                        />

                        <TextField
                            label="模型名称"
                            value={settings.api_model || 'gpt-3.5-turbo'}
                            onChange={e => updateLocalSetting('api_model', e.target.value)}
                            fullWidth
                            helperText="使用的 AI 模型，例如：gpt-3.5-turbo, gpt-4"
                        />

                        <TextField
                            label="最大 Token 数"
                            type="number"
                            value={settings.api_max_tokens || '1000'}
                            onChange={e => updateLocalSetting('api_max_tokens', e.target.value)}
                            fullWidth
                            helperText="单次请求的最大 token 数量"
                            InputProps={{
                                inputProps: { min: 1, max: 10000 }
                            }}
                        />

                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.auto_save === 'true'}
                                        onChange={e => updateLocalSetting('auto_save', e.target.checked ? 'true' : 'false')}
                                        color="primary"
                                    />
                                }
                                label="自动保存生成内容"
                            />
                        </FormGroup>

                        {/* 操作按钮 */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={resetSettings}
                                startIcon={<SaveIcon />}
                            >
                                重置为默认设置
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    )
}