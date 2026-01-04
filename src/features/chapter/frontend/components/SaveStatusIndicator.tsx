/**
 * 保存状态指示器组件
 * 根据保存状态显示不同的视觉反馈
 */

import { Box, Stack, Typography, Tooltip, CircularProgress } from '@mui/material'
import {
  Circle,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import type { SaveStatus, SaveMetadata } from '../hooks/useAutoSave'

export interface SaveStatusIndicatorProps {
  status: SaveStatus
  metadata: SaveMetadata
  /** 是否显示为紧凑模式 */
  compact?: boolean
}

export default function SaveStatusIndicator({
  status,
  metadata,
  compact = false,
}: SaveStatusIndicatorProps) {
  // 格式化时间差
  const formatTimeDiff = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes}分钟前`
    } else if (seconds > 5) {
      return `${seconds}秒前`
    } else {
      return '刚刚'
    }
  }

  // 渲染状态内容
  const renderStatus = () => {
    switch (status) {
      case 'idle':
        return null

      case 'dirty':
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Circle
              sx={{
                fontSize: 8,
                color: 'warning.main',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            {!compact && (
              <Typography variant="caption" color="warning.main">
                未保存
              </Typography>
            )}
          </Stack>
        )

      case 'saving':
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CircularProgress size={12} thickness={4} />
            {!compact && (
              <Typography variant="caption" color="text.secondary">
                保存中...
              </Typography>
            )}
          </Stack>
        )

      case 'saved':
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
            {!compact && (
              <Typography variant="caption" color="success.main">
                {metadata.lastSavedAt
                  ? `${formatTimeDiff(metadata.lastSavedAt)}已保存`
                  : '已保存'}
              </Typography>
            )}
          </Stack>
        )

      case 'error':
        return (
          <Tooltip title={metadata.errorMessage || '保存失败'} arrow>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
              {!compact && (
                <Typography variant="caption" color="error.main">
                  保存失败
                </Typography>
              )}
            </Stack>
          </Tooltip>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {renderStatus()}
        </Box>
      )}
    </AnimatePresence>
  )
}
