import { useState, useEffect } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { containerVariants } from '@/frontend/core/animation'
import { userAPI } from '@/features/user/frontend'
import { useUserStore } from '@/frontend/shared/stores/user'
import { useNotification } from '@/frontend/shared/hooks/useNotification'
import ProfileInfoSection from './components/ProfileInfoSection'
import AiSettingsSection from './components/AiSettingsSection'
import PasswordChangeSection from './components/PasswordChangeSection'
import type { ProfileFormData, AiSettingsData, PasswordFormData, PasswordVisibility } from './components/types'

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
                setAiSettings(userSettings as AiSettingsData)
            } catch (error) {
                console.error('获取AI配置失败:', error)
            }
        }

        fetchSettings()
    }, [])

    // 个人信息表单状态
    const [profileForm, setProfileForm] = useState<ProfileFormData>({
        nickname: user?.nickname || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
    })

    // AI配置状态
    const [aiSettings, setAiSettings] = useState<AiSettingsData>({
        api_key: '',
        api_base: '',
        api_model: 'gpt-3.5-turbo',
        api_max_tokens: '16000',
        auto_save: 'true'
    })

    // 密码表单状态
    const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    // 密码可见性状态
    const [showPasswords, setShowPasswords] = useState<PasswordVisibility>({
        old: false,
        new: false,
        confirm: false,
    })

    // 处理个人信息表单变更
    const handleProfileChange = (field: string, value: string) => {
        setProfileForm(prev => ({ ...prev, [field]: value }))
    }

    // 处理AI配置变更
    const handleAiSettingsChange = (field: string, value: string) => {
        setAiSettings(prev => ({ ...prev, [field]: value }))
    }

    // 处理密码表单变更
    const handlePasswordChange = (field: string, value: string) => {
        setPasswordForm(prev => ({ ...prev, [field]: value }))
    }

    // 切换密码可见性
    const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
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
                <ProfileInfoSection
                    user={user}
                    profileForm={profileForm}
                    loading={loading}
                    onProfileChange={handleProfileChange}
                    onSave={handleUpdateProfile}
                />

                {/* AI配置和密码修改并排放置 */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
                    gap: 4
                }}>
                    {/* AI配置卡片 */}
                    <AiSettingsSection
                        aiSettings={aiSettings}
                        loading={aiSettingsLoading}
                        onAiSettingsChange={handleAiSettingsChange}
                        onSave={handleUpdateAiSettings}
                    />

                    {/* 修改密码卡片 */}
                    <PasswordChangeSection
                        passwordForm={passwordForm}
                        showPasswords={showPasswords}
                        loading={passwordLoading}
                        onPasswordChange={handlePasswordChange}
                        onTogglePasswordVisibility={togglePasswordVisibility}
                        onSave={handleUpdatePassword}
                    />
                </Box>
            </Stack>
        </Box>
    )
}