import { useEffect, useMemo } from 'react'
import { useTheme, alpha } from '@mui/material'
import type { NovelState } from './types'

/* Custom Hook: Auto Scroll */
export const useAutoScroll = (
  ref: React.RefObject<HTMLDivElement>,
  content: string,
  isUserScrolling: boolean
) => {
  useEffect(() => {
    if (ref.current && !isUserScrolling) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [content, isUserScrolling, ref])
}

/* Style Hooks */
export const useInputStyles = () => {
  const theme = useTheme()
  return useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        transition: 'all 0.2s',
        '& fieldset': {
          borderColor: alpha(theme.palette.divider, 0.5)
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.background.paper, 0.9)
        },
        '&:hover fieldset': {
          borderColor: alpha(theme.palette.primary.main, 0.5)
        },
        '&.Mui-focused': {
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.primary.main,
          borderWidth: '1.5px'
        },
      },
    }),
    [theme]
  )
}

export const usePaperStyles = () => {
  const theme = useTheme()
  return useMemo(
    () => ({
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: '0 12px 40px rgba(31, 38, 135, 0.08)',
      borderRadius: 3,
    }),
    [theme]
  )
}

export const useTitleBarStyles = () => {
  return useMemo(
    () => ({
      bgcolor: 'rgba(255,255,255,0.3)',
      flexShrink: 0,
    }),
    []
  )
}

export const useGradientButtonStyles = () => {
  return useMemo(
    () => ({
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 8px 20px -4px rgba(118, 75, 162, 0.5)',
      '&:disabled': {
        background: '#ccc',
        boxShadow: 'none'
      },
    }),
    []
  )
}

export const useContentTextStyles = () => {
  const theme = useTheme()
  return useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: 'transparent',
        '& fieldset': { border: 'none' },
      },
      '& .MuiInputBase-input': {
        fontFamily: '"Merriweather", "Georgia", "Times New Roman", serif',
        fontSize: '1.1rem',
        lineHeight: 2,
        color: theme.palette.text.primary,
        textAlign: 'justify',
        pb: 10,
      },
    }),
    [theme]
  )
}

export const useTabsStyles = () => {
  return useMemo(
    () => ({
      minHeight: 48,
      '& .MuiTab-root': {
        minHeight: 48,
        borderRadius: '12px 12px 0 0',
        px: 3,
        transition: 'all 0.3s',
        '&.Mui-selected': {
          bgcolor: 'rgba(255,255,255,0.8)',
          color: '#303f9f',
          fontWeight: 'bold'
        },
      },
      '& .MuiTabs-indicator': { height: 0 },
    }),
    []
  )
}

export const useScrollbarStyles = () => {
  const theme = useTheme()
  return useMemo(
    () => ({
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
      // 滚动轨道悬停效果
      '&::-webkit-scrollbar-track:hover': {
        background: alpha(theme.palette.background.paper, 0.5),
      },
      // Firefox scrollbar
      scrollbarWidth: 'auto',
      scrollbarColor: `${alpha(theme.palette.primary.main, 0.6)} ${alpha(theme.palette.background.paper, 0.3)}`,
    }),
    [theme]
  )
}

/* 计算属性 Hooks */
export const useHasContent = (content: NovelState['content']) => {
  return useMemo(
    () => Boolean(content.generated || content.streaming),
    [content.generated, content.streaming]
  )
}

export const useShowGeneratedTab = (content: NovelState['content'], hasContent: boolean) => {
  return useMemo(
    () => Boolean(content.generated || !hasContent),
    [content.generated, hasContent]
  )
}
