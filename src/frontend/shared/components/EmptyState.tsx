import { ReactNode } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
  alpha,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  LibraryBooks as LibraryBooksIcon,
  PersonAdd as PersonAddIcon,
  MenuBook as MenuBookIcon,
  SearchOff as SearchOffIcon,
  Add as AddIcon,
} from '@mui/icons-material'

export type EmptyStateVariant = 
  | 'no-projects' 
  | 'no-characters' 
  | 'no-chapters' 
  | 'no-results'
  | 'custom'

export interface EmptyStateSuggestion {
  icon: ReactNode
  text: string
  onClick?: () => void
}

export interface EmptyStateProps {
  /**
   * 预设场景类型
   */
  variant?: EmptyStateVariant
  /**
   * 主标题
   */
  title?: string
  /**
   * 描述文本
   */
  description?: string
  /**
   * 自定义插画/图标
   */
  illustration?: ReactNode
  /**
   * 主操作按钮
   */
  action?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'contained' | 'outlined'
  }
  /**
   * 次要操作按钮
   */
  secondaryAction?: {
    label: string
    icon?: ReactNode
    onClick: () => void
  }
  /**
   * 建议/提示卡片列表
   */
  suggestions?: EmptyStateSuggestion[]
  /**
   * 自定义底部内容
   */
  footer?: ReactNode
}

// 预设场景配置
const variantConfigs: Record<Exclude<EmptyStateVariant, 'custom'>, Partial<EmptyStateProps>> = {
  'no-projects': {
    title: '还没有创建任何项目',
    description: '开始创作您的第一部作品，探索AI辅助写作的无限可能',
    illustration: <LibraryBooksIcon sx={{ fontSize: 120, opacity: 0.3 }} />,
  },
  'no-characters': {
    title: '暂无角色',
    description: '为您的故事添加生动的角色，让情节更加精彩',
    illustration: <PersonAddIcon sx={{ fontSize: 120, opacity: 0.3 }} />,
  },
  'no-chapters': {
    title: '还没有章节',
    description: '开始构建您的故事框架，AI可以帮助您生成大纲',
    illustration: <MenuBookIcon sx={{ fontSize: 120, opacity: 0.3 }} />,
  },
  'no-results': {
    title: '未找到匹配结果',
    description: '尝试调整搜索条件或清除筛选器',
    illustration: <SearchOffIcon sx={{ fontSize: 120, opacity: 0.3 }} />,
  },
}

/**
 * 通用空状态组件
 * 
 * @example
 * // 预设场景
 * <EmptyState 
 *   variant="no-projects"
 *   action={{ label: '新建项目', onClick: handleCreate }}
 * />
 * 
 * @example
 * // 自定义内容
 * <EmptyState
 *   title="自定义标题"
 *   description="自定义描述"
 *   action={{ label: '操作按钮', onClick: handleAction }}
 *   suggestions={[
 *     { icon: <Icon />, text: '提示1' },
 *     { icon: <Icon />, text: '提示2' }
 *   ]}
 * />
 */
export default function EmptyState(props: EmptyStateProps) {
  const theme = useTheme()
  
  // 合并预设配置和自定义props
  const config = props.variant && props.variant !== 'custom'
    ? { ...variantConfigs[props.variant], ...props }
    : props

  const {
    title,
    description,
    illustration,
    action,
    secondaryAction,
    suggestions,
    footer,
  } = config

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        py: 6,
        px: 3,
      }}
    >
      {/* 插画/图标 */}
      {illustration && (
        <Box
          component={motion.div}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          sx={{
            mb: 3,
            color: 'text.disabled',
          }}
        >
          {illustration}
        </Box>
      )}

      {/* 标题 */}
      {title && (
        <Typography
          variant="h5"
          fontWeight={600}
          gutterBottom
          sx={{ mb: 1, color: 'text.primary' }}
        >
          {title}
        </Typography>
      )}

      {/* 描述 */}
      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 500, textAlign: 'center' }}
        >
          {description}
        </Typography>
      )}

      {/* 操作按钮 */}
      <Stack direction="row" spacing={2} sx={{ mb: suggestions ? 4 : 0 }}>
        {action && (
          <Button
            variant={action.variant || 'contained'}
            size="large"
            startIcon={action.icon || <AddIcon />}
            onClick={action.onClick}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              boxShadow: theme.shadows[4],
            }}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outlined"
            size="large"
            startIcon={secondaryAction.icon}
            onClick={secondaryAction.onClick}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            {secondaryAction.label}
          </Button>
        )}
      </Stack>

      {/* 建议卡片 */}
      {suggestions && suggestions.length > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ width: '100%', maxWidth: 800 }}
        >
          {suggestions.map((suggestion, index) => (
            <Paper
              key={index}
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={suggestion.onClick}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${theme.palette.divider}`,
                cursor: suggestion.onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': suggestion.onClick ? {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[2],
                } : {},
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {suggestion.icon}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {suggestion.text}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* 自定义底部内容 */}
      {footer && (
        <Box sx={{ mt: 4 }}>
          {footer}
        </Box>
      )}
    </Box>
  )
}
