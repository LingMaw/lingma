/**
 * AI流式生成进度可视化组件
 * 功能：脉冲式进度条、实时字数统计、停止生成按钮
 */

import { Box, LinearProgress, Typography, Button, Stack, alpha } from '@mui/material'
import { Stop as StopIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface StreamProgressIndicatorProps {
  /** 是否正在生成 */
  isGenerating: boolean
  /** 已生成的内容 */
  generatedContent: string
  /** 停止生成回调 */
  onStop: () => void
  /** 自定义状态文字 */
  statusText?: string
}

/**
 * 计算字数（统计中文字符和单词）
 */
const countWords = (text: string): number => {
  if (!text) return 0
  
  // 统计中文字符
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)
  const chineseCount = chineseChars ? chineseChars.length : 0
  
  // 统计英文单词
  const englishWords = text.match(/[a-zA-Z]+/g)
  const englishCount = englishWords ? englishWords.length : 0
  
  return chineseCount + englishCount
}

export default function StreamProgressIndicator({
  isGenerating,
  generatedContent,
  onStop,
  statusText = 'AI创作中...',
}: StreamProgressIndicatorProps) {
  const wordCount = useMemo(() => countWords(generatedContent), [generatedContent])

  if (!isGenerating) return null

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      {/* 脉冲式进度条 */}
      <LinearProgress
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 1.5,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            background: (theme) => 
              `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            animation: 'pulse 1.5s ease-in-out infinite',
          },
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.6 },
            '100%': { opacity: 1 },
          },
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {/* 状态信息 */}
        <Stack spacing={0.5}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: 'blink 1s ease-in-out infinite',
                '@keyframes blink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.3 },
                },
              }}
            />
            {statusText}
          </Typography>
          
          {/* 实时字数统计 */}
          {wordCount > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              已生成 {wordCount} 字
            </Typography>
          )}
        </Stack>

        {/* 停止生成按钮 */}
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<StopIcon />}
          onClick={onStop}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          停止生成
        </Button>
      </Stack>
    </Box>
  )
}
