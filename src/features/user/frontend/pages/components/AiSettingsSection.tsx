import { useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Autocomplete,
} from '@mui/material'
import {
    Save as SaveIcon,
    SmartToy as SmartToyIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import type { AiSettingsData } from './types'
import { userAPI } from '@/features/user/frontend'

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

interface AiSettingsSectionProps {
    aiSettings: AiSettingsData
    loading: boolean
    onAiSettingsChange: (field: string, value: string) => void
    onSave: () => void
}

export default function AiSettingsSection({
    aiSettings,
    loading,
    onAiSettingsChange,
    onSave
}: AiSettingsSectionProps) {
    // 模型列表状态
    const [modelList, setModelList] = useState<string[]>([])
    const [fetchingModels, setFetchingModels] = useState(false)

    // 预设模型供应商
    const OPENAI_COMPAT_PROVIDERS = [
        { name: 'OpenAI官方', url: 'https://api.openai.com/v1' },
        { name: 'NekroAI中转', url: 'https://api.nekro.ai/v1' },
        { name: '谷歌Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai' },
        { name: '通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
        { name: '豆包', url: 'https://ark.cn-beijing.volces.com/api/v3' },
        { name: 'Kimi', url: 'https://api.moonshot.cn/v1' },
        { name: '智谱清言', url: 'https://open.bigmodel.cn/api/paas/v4' },
        { name: '百度千帆', url: 'https://qianfan.baidubce.com/v2' },
        { name: '科大讯飞', url: 'https://spark-api-open.xf-yun.com/v1' },
        { name: '百川', url: 'https://api.baichuan-ai.com/v1' },
        { name: '腾讯混元', url: 'https://api.hunyuan.cloud.tencent.com/v1' },
        { name: '商汤日日新', url: 'https://api.sensenova.cn/compatible-mode/v1' },
    ]

    // 获取模型列表
    const fetchModelList = async () => {
        if (!aiSettings.api_key) {
            return
        }

        setFetchingModels(true)
        try {
            const models = await userAPI.getAvailableModels(aiSettings.api_base, aiSettings.api_key)
            setModelList(models)
        } catch (error) {
            console.error('获取模型列表失败:', error)
        } finally {
            setFetchingModels(false)
        }
    }

    // 渲染模型选择组件
    const renderModelSelector = () => {
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {modelList.length > 0 ? (
                    <FormControl fullWidth variant="outlined" sx={{ flex: 1 }}>
                        <InputLabel>模型名称</InputLabel>
                        <Select
                            value={aiSettings.api_model || 'gpt-3.5-turbo'}
                            onChange={e => onAiSettingsChange('api_model', e.target.value as string)}
                            label="模型名称"
                        >
                            {modelList.map(model => (
                                <MenuItem key={model} value={model}>
                                    {model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <TextField
                        label="模型名称"
                        value={aiSettings.api_model || 'gpt-3.5-turbo'}
                        onChange={e => onAiSettingsChange('api_model', e.target.value)}
                        fullWidth
                        variant="outlined"
                        helperText="使用的 AI 模型，例如：gpt-3.5-turbo, gpt-4"
                        sx={{
                            flex: 1,
                            '& .MuiFormHelperText-root': {
                                ml: 0,
                                mt: 1,
                                fontSize: '0.85rem'
                            }
                        }}
                    />
                )}
                <Button
                    variant="outlined"
                    size="large"
                    startIcon={fetchingModels ? <CircularProgress size={20} /> : <RefreshIcon />}
                    onClick={fetchModelList}
                    disabled={fetchingModels || !aiSettings.api_key}
                    sx={{ height: 56, minWidth: 120, mt: 0 }}
                >
                    {fetchingModels ? '获取中...' : modelList.length > 0 ? '刷新模型' : '获取模型'}
                </Button>
            </Box>
        )
    }

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
                        onChange={e => onAiSettingsChange('api_key', e.target.value)}
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

                    <Autocomplete
                        options={OPENAI_COMPAT_PROVIDERS}
                        getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                                return option;
                            }
                            return `${option.name} (${option.url})`;
                        }}
                        value={
                            OPENAI_COMPAT_PROVIDERS.find(provider => provider.url === aiSettings.api_base) ||
                            (aiSettings.api_base ? { name: aiSettings.api_base, url: aiSettings.api_base } : null)
                        }
                        onChange={(_event, newValue) => {
                            if (newValue) {
                                if (typeof newValue !== 'string') {
                                    onAiSettingsChange('api_base', newValue.url);
                                } else {
                                    onAiSettingsChange('api_base', newValue);
                                }
                            } else {
                                onAiSettingsChange('api_base', '');
                            }
                        }}
                        freeSolo
                        fullWidth
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="API Base URL"
                                fullWidth
                                variant="outlined"
                                helperText="AI 服务的基础 URL，可以选择预设供应商或手动输入"
                                sx={
                                    {
                                        '& .MuiFormHelperText-root': {
                                            ml: 0,
                                            mt: 1,
                                            fontSize: '0.85rem'
                                        }
                                    }
                                }
                            />
                        )}
                    />

                    {renderModelSelector()}

                    <TextField
                        label="最大 Token 数"
                        type="number"
                        value={aiSettings.api_max_tokens || '16000'}
                        onChange={e => onAiSettingsChange('api_max_tokens', e.target.value)}
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
                        onChange={e => onAiSettingsChange('auto_save', e.target.value)}
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
                            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5
                            }}
                            onClick={onSave}
                            disabled={loading}
                        >
                            {loading ? '保存中...' : '保存配置'}
                            {!loading && <SaveIcon sx={{ ml: 1 }} />}
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}
