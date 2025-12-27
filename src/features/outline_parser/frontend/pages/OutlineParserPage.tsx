/**
 * 大纲解析页面
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Divider,
  alpha,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { motion } from 'framer-motion'
import {
  AccountTreeOutlined,
  AddCircleOutline,
  Description,
} from '@mui/icons-material'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import { outlineParserAPI, ChapterPreview } from '@/features/outline_parser/frontend'
import { enqueueSnackbar } from 'notistack'

export default function OutlineParserPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [outlineText, setOutlineText] = useState('')
  const [parsedChapters, setParsedChapters] = useState<ChapterPreview[]>([])
  const [detectedFormat, setDetectedFormat] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // 解析大纲
  const handleParse = async () => {
    if (!outlineText.trim()) {
      setError('请输入大纲文本')
      return
    }

    setError('')
    setIsParsing(true)

    try {
      const result = await outlineParserAPI.parse({
        text: outlineText,
        format: 'auto',
      })

      setParsedChapters(result.chapters)
      setDetectedFormat(result.detected_format)
      enqueueSnackbar(
        `成功解析 ${result.total_count} 个章节（格式：${result.detected_format}）`,
        { variant: 'success' }
      )
    } catch (err: any) {
      const message = err.response?.data?.detail?.message || '解析失败，请检查格式'
      setError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setIsParsing(false)
    }
  }

  // 创建章节
  const handleCreateChapters = async () => {
    if (!projectId || !parsedChapters.length) {
      return
    }

    setIsCreating(true)

    try {
      const result = await outlineParserAPI.createChapters({
        project_id: parseInt(projectId),
        chapters: parsedChapters.map((ch) => ({
          title: ch.title,
          outline_description: ch.outline_description,
        })),
      })

      enqueueSnackbar(result.message, { variant: 'success' })

      // 跳转到章节列表页
      setTimeout(() => {
        navigate(`/projects/${projectId}/chapters`)
      }, 1000)
    } catch (err: any) {
      const message = err.response?.data?.detail?.message || '创建章节失败'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      sx={{ p: 3 }}
    >
      <Stack spacing={3}>
        {/* 页面标题 */}
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="h4" fontWeight={600}>
            大纲解析
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            支持 Markdown、数字列表、缩进三种格式，自动识别章节结构
          </Typography>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Box component={motion.div} variants={itemVariants}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        )}

        {/* 主内容区 */}
        <Grid2 container spacing={3}>
          {/* 左侧：输入区 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Paper
              component={motion.div}
              variants={itemVariants}
              sx={{
                p: 3,
                height: '100%',
                backdropFilter: 'blur(20px)',
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.8),
              }}
            >
              <Stack spacing={2} height="100%">
                <Box display="flex" alignItems="center" gap={1}>
                  <Description color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    大纲输入
                  </Typography>
                </Box>

                <Divider />

                <TextField
                  multiline
                  rows={20}
                  fullWidth
                  placeholder={`示例格式：

# 第一卷：起源

## 第一章：觉醒
### 1.1 神秘的梦境
### 1.2 力量觉醒

## 第二章：启程`}
                  value={outlineText}
                  onChange={(e) => setOutlineText(e.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      height: '100%',
                    },
                  }}
                />

                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    isParsing ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AccountTreeOutlined />
                    )
                  }
                  onClick={handleParse}
                  disabled={isParsing || !outlineText.trim()}
                  sx={{ borderRadius: 3 }}
                >
                  {isParsing ? '解析中...' : '解析大纲'}
                </Button>
              </Stack>
            </Paper>
          </Grid2>

          {/* 右侧：预览区 */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Paper
              component={motion.div}
              variants={itemVariants}
              sx={{
                p: 3,
                height: '100%',
                backdropFilter: 'blur(20px)',
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.8),
              }}
            >
              <Stack spacing={2} height="100%">
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountTreeOutlined color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    解析预览
                    {parsedChapters.length > 0 && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        （共 {parsedChapters.length} 章）
                      </Typography>
                    )}
                  </Typography>
                </Box>

                {detectedFormat && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    检测到格式：{detectedFormat}
                  </Alert>
                )}

                <Divider />

                {/* 章节列表 */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    borderRadius: 2,
                    border: (theme) =>
                      `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  {parsedChapters.length > 0 ? (
                    <List disablePadding>
                      {parsedChapters.map((chapter, idx) => (
                        <ListItem
                          key={idx}
                          component={motion.div}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          sx={{
                            borderBottom: (theme) =>
                              idx < parsedChapters.length - 1
                                ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                : 'none',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight={500}>
                                {chapter.title}
                              </Typography>
                            }
                            secondary={chapter.preview}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      color="text.disabled"
                    >
                      <Typography variant="body2">
                        解析后的章节将在此显示
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  color="success"
                  startIcon={
                    isCreating ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AddCircleOutline />
                    )
                  }
                  onClick={handleCreateChapters}
                  disabled={isCreating || parsedChapters.length === 0}
                  sx={{ borderRadius: 3 }}
                >
                  {isCreating
                    ? '创建中...'
                    : `创建 ${parsedChapters.length} 个章节`}
                </Button>
              </Stack>
            </Paper>
          </Grid2>
        </Grid2>
      </Stack>
    </Box>
  )
}
