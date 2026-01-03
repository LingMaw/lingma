/**
 * AI需求输入增强组件
 * 功能：示例占位符、快捷标签选择、输入验证、历史记录
 */

import { useState, useEffect, useMemo } from 'react'
import {
  TextField,
  Stack,
  Box,
  Chip,
  Typography,
  Paper,
  alpha,
} from '@mui/material'
import {
  LightbulbOutlined as LightbulbIcon,
  History as HistoryIcon,
} from '@mui/icons-material'

interface EnhancedRequirementInputProps {
  /** 输入值 */
  value: string
  /** 值变化回调 */
  onChange: (value: string) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 场景类型，决定示例和快捷标签 */
  scene: 'generate' | 'continue' | 'expand' | 'compress' | 'optimize'
  /** 最小字符数限制 */
  minLength?: number
  /** 标签文本 */
  label?: string
  /** 历史记录localStorage key */
  storageKey?: string
  /** 最大历史记录数 */
  maxHistoryCount?: number
}

// 不同场景的示例占位符
const PLACEHOLDERS: Record<string, string> = {
  generate: '例如：增加心理描写，突出主角矛盾心理；加强环境渲染，营造紧张氛围',
  continue: '例如：继续推进剧情发展，引入新的冲突点；保持人物性格一致性',
  expand: '例如：丰富对话细节，增加人物互动；加强场景描写，提升画面感',
  compress: '例如：保留关键情节转折，删除冗余描写；精简对话，保持核心矛盾',
  optimize: '例如：修正语法错误，优化句式结构；统一叙事风格，提升可读性',
}

// 不同场景的快捷标签
const QUICK_TAGS: Record<string, string[]> = {
  generate: ['增加对话', '加强描写', '情节转折', '人物刻画', '环境渲染', '心理活动'],
  continue: ['推进剧情', '引入冲突', '制造悬念', '角色发展', '伏笔呼应', '情感升华'],
  expand: ['丰富对话', '场景细节', '动作描写', '心理刻画', '感官描写', '氛围营造'],
  compress: ['保留核心', '精简对话', '删除冗余', '突出重点', '浓缩情节', '提炼主题'],
  optimize: ['语法修正', '风格统一', '逻辑优化', '表达精炼', '节奏调整', '细节打磨'],
}

/**
 * 从localStorage获取历史记录
 */
const getHistory = (key: string, maxCount: number): string[] => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return []
    const history = JSON.parse(stored) as string[]
    return history.slice(0, maxCount)
  } catch {
    return []
  }
}

/**
 * 保存到localStorage历史记录
 */
const saveToHistory = (key: string, value: string, maxCount: number) => {
  try {
    const history = getHistory(key, maxCount)
    // 去重并添加到开头
    const newHistory = [value, ...history.filter(item => item !== value)].slice(0, maxCount)
    localStorage.setItem(key, JSON.stringify(newHistory))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

export default function EnhancedRequirementInput({
  value,
  onChange,
  disabled = false,
  scene,
  minLength = 5,
  label = '需求或提示',
  storageKey,
  maxHistoryCount = 5,
}: EnhancedRequirementInputProps) {
  const [history, setHistory] = useState<string[]>([])

  const placeholder = PLACEHOLDERS[scene] || PLACEHOLDERS.generate
  const quickTags = QUICK_TAGS[scene] || QUICK_TAGS.generate

  // 加载历史记录
  useEffect(() => {
    if (storageKey) {
      setHistory(getHistory(storageKey, maxHistoryCount))
    }
  }, [storageKey, maxHistoryCount])

  // 输入验证
  const isValid = useMemo(() => {
    const trimmed = value.trim()
    return trimmed.length === 0 || trimmed.length >= minLength
  }, [value, minLength])

  const errorMessage = useMemo(() => {
    const trimmed = value.trim()
    if (trimmed.length > 0 && trimmed.length < minLength) {
      return `请输入至少${minLength}个字符的具体需求`
    }
    return ''
  }, [value, minLength])

  // 点击快捷标签
  const handleTagClick = (tag: string) => {
    const newValue = value.trim() ? `${value.trim()}；${tag}` : tag
    onChange(newValue)
  }

  // 选择历史记录
  const handleHistorySelect = (selectedValue: string) => {
    onChange(selectedValue)
  }

  // 当组件失去焦点且有有效输入时，保存到历史
  const handleBlur = () => {
    const trimmed = value.trim()
    if (storageKey && trimmed && trimmed.length >= minLength) {
      saveToHistory(storageKey, trimmed, maxHistoryCount)
      setHistory(getHistory(storageKey, maxHistoryCount))
    }
  }

  return (
    <Stack spacing={2}>
      {/* 快捷标签区 */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <LightbulbIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            快捷标签（点击添加）
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {quickTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={() => handleTagClick(tag)}
              disabled={disabled}
              sx={{
                borderRadius: 1.5,
                fontSize: '0.75rem',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* 输入框 */}
      <Box>
        <TextField
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          multiline
          fullWidth
          minRows={3}
          maxRows={8}
          disabled={disabled}
          error={!isValid}
          helperText={errorMessage || '留空则使用默认生成策略'}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* 历史记录 */}
      {storageKey && history.length > 0 && !disabled && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <HistoryIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              最近使用（点击复用）
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            {history.map((item, index) => (
              <Paper
                key={index}
                elevation={0}
                onClick={() => handleHistorySelect(item)}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderColor: 'primary.main',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
