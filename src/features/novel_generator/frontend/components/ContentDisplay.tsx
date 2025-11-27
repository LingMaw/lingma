import React, { useMemo } from 'react'
import {
  Box,
  Grid2,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Typography,
  useTheme,
  alpha
} from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SaveIcon from '@mui/icons-material/Save'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import type {
  NovelState,
} from '@/features/novel_generator/frontend/types'

interface ContentDisplayProps {
  content: NovelState['content']
  hasContent: boolean
  streamingRef: React.RefObject<HTMLDivElement>
  onEditContent: (contentType: keyof NovelState['content'], value: string) => void
  onCopy: () => void
  onSave: () => void
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  hasContent,
  streamingRef,
  onEditContent,
  onCopy,
  onSave,
  onScroll,
}) => {
  const theme = useTheme()

  // 空状态显示
  const EmptyState = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(142, 197, 252, 0.4)',
          mb: 3,
        }}
      >
        <AutoStoriesIcon sx={{ fontSize: 60, color: '#fff' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        故事从这里开始
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', maxWidth: 400 }}
      >
        输入创作参数，点击"开始创作"按钮，AI 将为你生成精彩的小说内容
      </Typography>
    </Box>
  )

  // 标签页头部
  const TabHeader = useMemo(() => ({
    px: 2,
    pt: 2,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    bgcolor: alpha(theme.palette.background.paper, 0.3),
    flexShrink: 0,
  }), [theme])

  // 内容区域样式
  const contentAreaStyles = useMemo(() => ({
    flex: 1,
    position: 'relative',
    bgcolor: alpha(theme.palette.grey[500], 0.03),
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  }), [theme])

  return (
    <Grid2 size={{ xs: 12 }} sx={{ height: '80vh', maxHeight: 800 }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
          backdropFilter: 'blur(24px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          boxShadow: '0 12px 40px rgba(31, 38, 135, 0.08)',
          borderRadius: 3,
        }}
      >
        {/* 顶部操作栏 */}
        <Box sx={TabHeader}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              小说内容
            </Typography>
          </Box>

          <Box>
            {hasContent && (
              <>
                <Tooltip title="保存到项目">
                  <IconButton size="small" onClick={onSave} sx={{ mr: 1 }}>
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="复制内容">
                  <IconButton size="small" onClick={onCopy}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* 内容展示区 */}
        <Box sx={contentAreaStyles}>
          <AnimatePresence mode="wait">
            {!content.generated && !content.streaming ? (
              <EmptyState />
            ) : (
              <Box
                ref={streamingRef}
                onScroll={onScroll}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  p: { xs: 2, sm: 3, md: 5 },
                  scrollBehavior: 'smooth',
                  minHeight: 0,
                  '&::-webkit-scrollbar-corner': {
                    background: 'transparent',
                  },
                }}
              >
                <Fade in={true}>
                  <Box
                    component="textarea"
                    value={content.generated || content.streaming}
                    onChange={(e) => onEditContent(content.generated ? 'generated' : 'streaming', e.target.value)}
                    placeholder="在此处编辑您的小说内容..."
                    sx={{
                      width: '100%',
                      height: '100%',
                      p: 0,
                      border: 'none',
                      outline: 'none',
                      bgcolor: 'background.default',
                      color: theme.palette.text.primary,
                      fontFamily: '"Merriweather", "Georgia", "Times New Roman", serif',
                      fontSize: '1.1rem',
                      lineHeight: 2,
                      textAlign: 'justify',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      resize: 'none',

                      // Webkit 滚动条样式
                      '&::-webkit-scrollbar': {
                        width: '14px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.background.paper, 0.3),
                        borderRadius: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.4),
                        borderRadius: '8px',
                        border: `3px solid transparent`,
                        backgroundClip: 'padding-box',
                        transition: 'all 0.2s ease',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: alpha(theme.palette.primary.main, 0.7),
                        border: `3px solid transparent`,
                        backgroundClip: 'padding-box',
                      },
                      '&::-webkit-scrollbar-thumb:active': {
                        background: alpha(theme.palette.primary.main, 0.9),
                        border: `3px solid transparent`,
                        backgroundClip: 'padding-box',
                      },
                      '&::-webkit-scrollbar-corner': {
                        background: 'transparent',
                      },

                      // Firefox 滚动条
                      scrollbarWidth: 'auto',
                      scrollbarColor: `${alpha(theme.palette.primary.main, 0.6)} ${alpha(theme.palette.background.paper, 0.3)}`,
                    }}
                  />
                </Fade>
              </Box>
            )}
          </AnimatePresence>
        </Box>
      </Paper>
    </Grid2>
  )
}

export default ContentDisplay