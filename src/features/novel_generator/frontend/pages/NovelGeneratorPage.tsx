import React, { useReducer, useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Grid2,
  FormControl,
  FormLabel,
  TextField,
  Autocomplete,
  Button,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material'
import { motion } from 'framer-motion'
import { scaleVariants } from '@/frontend/core/animation'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import SaveIcon from '@mui/icons-material/Save'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

// API 和类型
import { novelGeneratorAPI } from '@/features/novel_generator/frontend'
import { INITIAL_STATE } from '@/features/novel_generator/frontend/constants'
import { reducer } from '@/features/novel_generator/frontend/reducer'
import { GENRE_OPTIONS, STYLE_OPTIONS } from '@/features/novel_generator/frontend/constants'

import QuickTemplateSelector from '@/features/novel_generator/frontend/components/QuickTemplateSelector'
import QuickCreateProjectDialog from '@/features/novel_generator/frontend/components/QuickCreateProjectDialog'
import type { ShortStoryTemplate } from '@/features/novel_generator/frontend/types'
import { useUserStore } from '@/frontend/shared/stores/user'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/frontend/shared'

const NovelGeneratorPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useUserStore()
  const { showNotification, showTooltip } = useNotificationStore()
  const { project, content: initialContent } = location.state || {}
  const theme = useTheme()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // 初始化
  useEffect(() => {
    if (project) {
      // 即使没有 initialContent，也应该用 project 信息初始化表单
      dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          content: { generated: initialContent || '', streaming: '' },
          form: {
            title: project?.title || '',
            genre: project?.genre || '',
            style: project?.style || '',
            requirement: project?.description || '',
          },
        },
      })
    }
  }, [initialContent, project])

  const handleFieldChange = useCallback((field: keyof typeof state.form, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!state.form.title.trim()) {
      showNotification('请输入小说标题', 'warning')
      return
    }

    abortControllerRef.current = new AbortController()

    try {
      dispatch({ type: 'SET_STREAMING', isStreaming: true })
      dispatch({ type: 'RESET_CONTENT' })

      const stream = await novelGeneratorAPI.generateNovelStream({
        title: state.form.title,
        genre: state.form.genre,
        style: state.form.style,
        requirement: state.form.requirement,
      })

      const reader = stream.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        let filtered = chunk

        // 移除 REASONING 标签
        while (filtered.includes('[REASONING]') && filtered.includes('[/REASONING]')) {
          const start = filtered.indexOf('[REASONING]')
          const end = filtered.indexOf('[/REASONING]') + '[/REASONING]'.length
          filtered = filtered.substring(0, start) + filtered.substring(end)
        }
        filtered = filtered.replace(/\[\/?REASONING\]/g, '')

        accumulated += filtered
        dispatch({ type: 'SET_CONTENT', value: accumulated })
      }

      dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          content: { generated: accumulated, streaming: '' },
        },
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('生成已停止')
      } else {
        showNotification(err.message || '流式生成失败', 'error')
      }
    } finally {
      dispatch({ type: 'SET_STREAMING', isStreaming: false })
      abortControllerRef.current = null
    }
  }, [state.form])



  const handleApplyTemplate = useCallback((template: ShortStoryTemplate) => {
    dispatch({ type: 'APPLY_TEMPLATE', template })
  }, [])

  const handleQuickCreateProject = useCallback(() => {
    // 检查登录状态
    if (!isAuthenticated) {
      showNotification('请先登录后再创建项目', 'warning')
      navigate('/login')
      return
    }

    // 检查是否有内容
    const contentToSave = state.content.generated || state.content.streaming
    if (!contentToSave) {
      showNotification('没有可保存的内容，请先生成小说', 'warning')
      return
    }

    setCreateDialogOpen(true)
  }, [isAuthenticated, navigate, state.content.generated, state.content.streaming])

  const handleCreateSuccess = useCallback((projectId: number) => {
    // alert('项目创建成功！')
    // 可选：跳转到项目详情页
    navigate(`/novel_projects/${projectId}`)
  }, [])

  const handleCopy = useCallback(async () => {
    const text = state.content.generated || state.content.streaming
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      showTooltip('已复制到剪贴板')
    } catch {
      showNotification('复制失败', 'error')
    }
  }, [state.content.generated, state.content.streaming, showTooltip, showNotification])

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  const inputStyle = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        transition: 'all 0.2s',
        '& fieldset': { borderColor: alpha(theme.palette.divider, 0.5) },
        '&:hover': { backgroundColor: alpha(theme.palette.background.paper, 0.9) },
        '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
        '&.Mui-focused': {
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' },
      },
    }),
    [theme]
  )

  return (
    <Box sx={{ height: '100%' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <Container
          maxWidth={false}
          sx={{
            py: { xs: 1, sm: 2, md: 3 },
            height: '100%',
            px: { xs: 1, sm: 2, md: 3 }
          }}
        >
          <Grid2
            container
            spacing={{ xs: 1, sm: 2, md: 3 }}
            sx={{
              height: '100%',
              mx: 0
            }}
          >
            {/* 左侧：生成器区域 */}
            <Grid2
              size={{
                xs: 12,
                md: 12
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2, md: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                  backdropFilter: 'blur(24px)',
                  borderRadius: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                {/* 标题栏 */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: { xs: 1.5, sm: 2, md: 3 }
                }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                    }}
                  >
                    <AutoStoriesIcon sx={{
                      mr: 1,
                      color: 'primary.main',
                      fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                    }} />
                    AI 短篇小说生成器
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <QuickTemplateSelector onSelectTemplate={handleApplyTemplate} />
                  </Box>
                </Box>

                {/* 主要内容 */}
                <Grid2
                  container
                  spacing={{ xs: 1.5, sm: 2, md: 3 }}
                  sx={{
                    flex: 1,
                    mx: 0
                  }}
                >
                  {/* 左侧控制面板 - 参数设置区域 */}
                  <Grid2
                    size={{
                      xs: 12,
                      lg: 4
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                        backdropFilter: 'blur(20px)',
                        borderRadius: { xs: 1.5, sm: 2, md: 2.5 },
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: { xs: 1, sm: 1.5, md: 2 },
                          color: 'primary.main',
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                        }}
                      >
                        创作参数
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: { xs: 1, sm: 1.5, md: 2 },
                          color: 'text.secondary',
                          fontStyle: 'italic',
                          px: 1,
                          py: 0.5,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          borderRadius: 1,
                          borderLeft: `3px solid ${theme.palette.info.main}`,
                        }}
                      >
                        💡 专注于1000-5000字的短篇小说创作
                      </Typography>

                      <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        pr: 0.5
                      }}>
                        <FormControl fullWidth sx={{ mb: { xs: 1, sm: 1.5, md: 2 } }}>
                          <FormLabel
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                              mb: 0.5,
                              fontWeight: 600
                            }}
                          >
                            小说标题
                          </FormLabel>
                          <TextField
                            value={state.form.title}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            placeholder="请输入标题"
                            disabled={state.isStreaming}
                            sx={inputStyle}
                            size="small"
                          />
                        </FormControl>

                        <Grid2
                          container
                          spacing={{ xs: 1, sm: 1.5, md: 2 }}
                          sx={{
                            mb: { xs: 1, sm: 1.5, md: 2 }
                          }}
                        >
                          <Grid2 size={{ xs: 6 }}>
                            <FormControl fullWidth>
                              <FormLabel
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                                  mb: 0.5,
                                  fontWeight: 600
                                }}
                              >
                                类型
                              </FormLabel>
                              <Autocomplete
                                freeSolo
                                value={state.form.genre}
                                onChange={(_, newValue) => handleFieldChange('genre', newValue || '')}
                                inputValue={state.form.genre}
                                onInputChange={(_, newInputValue) => handleFieldChange('genre', newInputValue)}
                                options={GENRE_OPTIONS}
                                disabled={state.isStreaming}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="请输入或选择类型"
                                    variant="outlined"
                                    size="small"
                                    sx={inputStyle}
                                  />
                                )}
                                sx={{
                                  '& .MuiAutocomplete-popupIndicator': {
                                    color: 'text.secondary'
                                  }
                                }}
                              />
                            </FormControl>
                          </Grid2>
                          <Grid2 size={{ xs: 6 }}>
                            <FormControl fullWidth>
                              <FormLabel
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                                  mb: 0.5,
                                  fontWeight: 600
                                }}
                              >
                                风格
                              </FormLabel>
                              <Autocomplete
                                freeSolo
                                value={state.form.style}
                                onChange={(_, newValue) => handleFieldChange('style', newValue || '')}
                                inputValue={state.form.style}
                                onInputChange={(_, newInputValue) => handleFieldChange('style', newInputValue)}
                                options={STYLE_OPTIONS}
                                disabled={state.isStreaming}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="请输入或选择风格"
                                    variant="outlined"
                                    size="small"
                                    sx={inputStyle}
                                  />
                                )}
                                sx={{
                                  '& .MuiAutocomplete-popupIndicator': {
                                    color: 'text.secondary'
                                  }
                                }}
                              />
                            </FormControl>
                          </Grid2>
                        </Grid2>

                        <FormControl fullWidth sx={{ mb: { xs: 1, sm: 1.5, md: 2 } }}>
                          <FormLabel
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                              mb: 0.5,
                              fontWeight: 600
                            }}
                          >
                            详细要求
                          </FormLabel>
                          <TextField
                            value={state.form.requirement}
                            onChange={(e) => handleFieldChange('requirement', e.target.value)}
                            placeholder="输入故事背景..."
                            multiline
                            rows={6}
                            disabled={state.isStreaming}
                            sx={inputStyle}
                          />
                        </FormControl>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleGenerate}
                        disabled={state.isStreaming}
                        sx={{
                          mt: { xs: 1, sm: 1.5, md: 2 },
                          py: { xs: 1, sm: 1.2, md: 1.5 },
                          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                        }}
                      >
                        {state.isStreaming ? (
                          <>
                            <CircularProgress
                              size={20}
                              sx={{ mr: 1 }}
                            />
                            生成中...
                          </>
                        ) : (
                          '开始创作'
                        )}
                      </Button>
                    </Paper>
                  </Grid2>

                  {/* 右侧内容显示区域 */}
                  <Grid2
                    size={{
                      xs: 12,
                      lg: 8
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                        backdropFilter: 'blur(20px)',
                        borderRadius: { xs: 1.5, sm: 2, md: 2.5 },
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                            flex: 1,
                          }}
                        >
                          小说内容
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {(state.content.generated || state.content.streaming) && (
                            <>
                              <motion.div variants={scaleVariants} whileHover="hover" whileTap="tap">
                                <Button
                                  variant="contained"
                                  startIcon={<SaveIcon />}
                                  onClick={handleQuickCreateProject}
                                  size="small"
                                  sx={{
                                    borderRadius: 2,
                                    py: 0.8,
                                    px: 2,
                                    fontWeight: 600,
                                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                                    background: (theme) =>
                                      `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                                    '&:hover': {
                                      background: (theme) =>
                                        `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)} 0%, ${theme.palette.success.dark} 100%)`,
                                      boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.success.main, 0.4)}`,
                                    }
                                  }}
                                >
                                  保存项目
                                </Button>
                              </motion.div>
                              <Tooltip title="复制内容">
                                <IconButton
                                  onClick={handleCopy}
                                  size="small"
                                  sx={{
                                    borderRadius: 1.5,
                                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                                    color: 'info.main',
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.info.main, 0.2),
                                    }
                                  }}
                                >
                                  <ContentCopyIcon
                                    sx={{
                                      fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' }
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Paper
                        elevation={0}
                        sx={{
                          flex: 1,
                          p: { xs: 1.5, sm: 2, md: 2.5 },
                          backgroundColor: alpha(theme.palette.grey[500], 0.05),
                          borderRadius: { xs: 1.5, sm: 2, md: 2 },
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {!state.content.generated && !state.content.streaming ? (
                          <Box
                            sx={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                            }}
                          >
                            <Box
                              sx={{
                                width: { xs: 60, sm: 80, md: 100 },
                                height: { xs: 60, sm: 80, md: 100 },
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                              }}
                            >
                              <AutoStoriesIcon sx={{
                                fontSize: { xs: 30, sm: 40, md: 50 },
                                color: '#fff'
                              }} />
                            </Box>
                            <Typography
                              variant="h6"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                              }}
                            >
                              故事从这里开始
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                              }}
                            >
                              输入创作参数，点击"开始创作"按钮
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            component="textarea"
                            value={state.content.generated || state.content.streaming}
                            onChange={(e) => {
                              const newValue = e.target.value
                              if (state.content.generated) {
                                dispatch({
                                  type: 'SET_GENERATED_CONTENT',
                                  value: newValue,
                                })
                              } else {
                                dispatch({
                                  type: 'SET_CONTENT',
                                  value: newValue,
                                })
                              }
                            }}
                            sx={{
                              width: '100%',
                              height: '100%',
                              p: { xs: 1.5, sm: 2, md: 2.5 },
                              border: 'none',
                              outline: 'none',
                              borderRadius: 2,
                              bgcolor: 'transparent',
                              color: theme.palette.text.primary,
                              fontFamily: '"Merriweather", "Georgia", serif',
                              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                              lineHeight: 1.8,
                              resize: 'none',
                              overflowY: 'auto',
                              overflowX: 'hidden',

                              // WebKit 滚动条样式
                              '&::-webkit-scrollbar': {
                                width: '12px',
                              },
                              '&::-webkit-scrollbar-track': {
                                background: alpha(theme.palette.background.paper, 0.3),
                                borderRadius: '6px',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: alpha(theme.palette.primary.main, 0.4),
                                borderRadius: '6px',
                                border: `2px solid transparent`,
                                backgroundClip: 'padding-box',
                                transition: 'all 0.2s ease',
                              },
                              '&::-webkit-scrollbar-thumb:hover': {
                                background: alpha(theme.palette.primary.main, 0.7),
                                border: `2px solid transparent`,
                                backgroundClip: 'padding-box',
                              },
                              '&::-webkit-scrollbar-thumb:active': {
                                background: alpha(theme.palette.primary.main, 0.9),
                                border: `2px solid transparent`,
                                backgroundClip: 'padding-box',
                              },
                              '&::-webkit-scrollbar-corner': {
                                background: 'transparent',
                              },

                              // Firefox 滚动条
                              scrollbarWidth: 'thin',
                              scrollbarColor: `${alpha(theme.palette.primary.main, 0.6)} ${alpha(theme.palette.background.paper, 0.3)}`,
                            }}
                          />
                        )}
                      </Paper>
                    </Paper>
                  </Grid2>
                </Grid2>
              </Paper>
            </Grid2>


          </Grid2>
        </Container>
      </motion.div>

      {/* 快捷创建项目对话框 */}
      <QuickCreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        defaultTitle={state.form.title}
        defaultDescription={state.form.requirement}
        genre={state.form.genre}
        style={state.form.style}
        content={state.content.generated || state.content.streaming}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  )
}

export default NovelGeneratorPage
