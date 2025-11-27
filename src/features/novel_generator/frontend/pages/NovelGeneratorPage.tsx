import React, { useReducer, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Grid2,
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material'
import { motion } from 'framer-motion'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import SaveIcon from '@mui/icons-material/Save'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

// API 和类型
import { novelGeneratorAPI } from '@/features/novel_generator/frontend'
import { httpClient } from '@/frontend/core/http'
import { INITIAL_STATE } from '@/features/novel_generator/frontend/constants'
import { reducer } from '@/features/novel_generator/frontend/reducer'
import { GENRE_OPTIONS, STYLE_OPTIONS } from '@/features/novel_generator/frontend/constants'
import AIChatPanel from '@/features/novel_generator/frontend/components/AIChatPanel'

const NovelGeneratorPage: React.FC = () => {
  const location = useLocation()
  const { project, content: initialContent } = location.state || {}
  const theme = useTheme()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const abortControllerRef = useRef<AbortController | null>(null)

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
      alert('请输入小说标题')
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
        alert(err.message || '流式生成失败')
      }
    } finally {
      dispatch({ type: 'SET_STREAMING', isStreaming: false })
      abortControllerRef.current = null
    }
  }, [state.form])

  const handleInsertToRequirement = useCallback((content: string) => {
    const current = state.form.requirement
    const newValue = current + (current ? '\n\n' : '') + content
    dispatch({ type: 'SET_FIELD', field: 'requirement', value: newValue })
  }, [state.form.requirement])

  const handleSave = useCallback(async () => {
    const contentToSave = state.content.generated || state.content.streaming
    if (!contentToSave) {
      alert('没有可保存的内容')
      return
    }

    try {
      await httpClient.post(`/novel_projects/${project?.id || 1}/save-content`, {
        content: contentToSave,
        title: state.form.title,
      })
      alert('小说已保存到项目')
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || '保存失败')
    }
  }, [state.content.generated, state.content.streaming, state.form.title, project])

  const handleCopy = useCallback(async () => {
    const text = state.content.generated || state.content.streaming
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    } catch {
      alert('复制失败')
    }
  }, [state.content.generated, state.content.streaming])

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
                md: state.showChatPanel ? 8 : 12
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
                    AI 小说生成器
                  </Typography>
                  <Tooltip title="AI助手">
                    <IconButton
                      onClick={() => dispatch({ type: 'SET_CHAT_PANEL', show: !state.showChatPanel })}
                      sx={{
                        p: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <ChatIcon />
                    </IconButton>
                  </Tooltip>
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
                      lg: state.showChatPanel ? 12 : 4
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
                              <Select
                                value={state.form.genre}
                                onChange={(e) => handleFieldChange('genre', e.target.value)}
                                disabled={state.isStreaming}
                                sx={inputStyle}
                                size="small"
                              >
                                <MenuItem value="">选择类型</MenuItem>
                                {GENRE_OPTIONS.map((g) => (
                                  <MenuItem key={g} value={g}>
                                    {g}
                                  </MenuItem>
                                ))}
                              </Select>
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
                              <Select
                                value={state.form.style}
                                onChange={(e) => handleFieldChange('style', e.target.value)}
                                disabled={state.isStreaming}
                                sx={inputStyle}
                                size="small"
                              >
                                <MenuItem value="">选择风格</MenuItem>
                                {STYLE_OPTIONS.map((s) => (
                                  <MenuItem key={s} value={s}>
                                    {s}
                                  </MenuItem>
                                ))}
                              </Select>
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
                      lg: state.showChatPanel ? 12 : 8
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
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: { xs: 1, sm: 1.5, md: 2 }
                      }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                          }}
                        >
                          小说内容
                        </Typography>
                        <Box>
                          {(state.content.generated || state.content.streaming) && (
                            <>
                              <IconButton
                                onClick={handleSave}
                                sx={{
                                  mr: 1,
                                  p: { xs: 0.5, sm: 1 }
                                }}
                              >
                                <SaveIcon
                                  sx={{
                                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                                  }}
                                />
                              </IconButton>
                              <IconButton
                                onClick={handleCopy}
                                sx={{
                                  p: { xs: 0.5, sm: 1 }
                                }}
                              >
                                <ContentCopyIcon
                                  sx={{
                                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                                  }}
                                />
                              </IconButton>
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

            {/* 右侧 AI 助手 */}
            {state.showChatPanel && (
              <Grid2 size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                    backdropFilter: 'blur(24px)',
                    borderRadius: { xs: 2, sm: 2.5, md: 3 },
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 1, sm: 1.5, md: 2 }
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                      }}
                    >
                      <ChatIcon sx={{
                        mr: 1,
                        color: 'primary.main',
                        fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                      }} />
                      AI 创作助手
                    </Typography>
                    <IconButton
                      onClick={() => dispatch({ type: 'SET_CHAT_PANEL', show: false })}
                      sx={{
                        p: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{
                    flex: 1,
                    overflow: 'hidden',
                    minHeight: 0
                  }}>
                    <AIChatPanel onInsertContent={handleInsertToRequirement} />
                  </Box>
                </Paper>
              </Grid2>
            )}
          </Grid2>
        </Container>
      </motion.div>
    </Box>
  )
}

export default NovelGeneratorPage
