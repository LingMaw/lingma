import { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha,
  Skeleton,
  Chip,
  Paper,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Collapse,
  Divider,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

import { promptRecordsAPI } from '@/features/prompt_records/frontend/api'
import type { PromptRecordResponse } from '@/features/prompt_records/frontend/types'
import { containerVariants, itemVariants } from '@/frontend/core/animation'

// --- 辅助函数 ---

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1)
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return `${days}天前`
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEndpoint(endpoint: string): string {
  const parts = endpoint.split('/')
  return parts[parts.length - 1] || endpoint
}


// --- 组件 ---

interface PromptDetailDialogProps {
  open: boolean
  onClose: () => void
  record: PromptRecordResponse | null
}

const PromptDetailDialog = ({ open, onClose, record }: PromptDetailDialogProps) => {
  const theme = useTheme()
  const [expandedSystem, setExpandedSystem] = useState(true)
  const [expandedUser, setExpandedUser] = useState(true)

  if (!record) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.2 },
        sx: {
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: 'blur(40px)',
          boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
        },
      }}
    >
      {/* 头部 */}
      <DialogTitle
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: theme.palette.primary.main,
                  display: 'flex',
                }}
              >
                <CodeIcon />
              </Box>
              <Typography variant="h5" fontWeight={800}>
                提示词详情
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {formatDate(record.created_at)}
                </Typography>
              </Stack>
              <Chip
                icon={<ArticleIcon sx={{ fontSize: 14 }} />}
                label={formatEndpoint(record.endpoint)}
                size="small"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              />
            </Stack>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: alpha(theme.palette.action.hover, 0.5),
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.8),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          {/* 元数据卡片 */}
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {record.model && (
                  <Chip
                    icon={<SmartToyIcon sx={{ fontSize: 14 }} />}
                    label={record.model}
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      px: 1,
                    }}
                  />
                )}
                {record.temperature !== null && (
                  <Chip
                    label={`温度 ${record.temperature}`}
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main,
                      px: 1,
                    }}
                  />
                )}
                {record.project_id && (
                  <Chip
                    label={`项目 #${record.project_id}`}
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      px: 1,
                    }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* 系统提示词 */}
          <Card
            component={motion.div}
            layout
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                },
              }}
              onClick={() => setExpandedSystem(!expandedSystem)}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.15),
                      color: theme.palette.secondary.main,
                      display: 'flex',
                    }}
                  >
                    <SmartToyIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      系统提示词
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      System Prompt
                    </Typography>
                  </Box>
                </Stack>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    },
                  }}
                >
                  {expandedSystem ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
            </Box>
            <Collapse in={expandedSystem}>
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.8,
                      color: 'text.primary',
                    }}
                  >
                    {record.system_prompt}
                  </Typography>
                </Paper>
              </Box>
            </Collapse>
          </Card>

          {/* 用户提示词 */}
          <Card
            component={motion.div}
            layout
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                },
              }}
              onClick={() => setExpandedUser(!expandedUser)}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.15),
                      color: theme.palette.info.main,
                      display: 'flex',
                    }}
                  >
                    <PersonIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      用户提示词
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      User Prompt
                    </Typography>
                  </Box>
                </Stack>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                    },
                  }}
                >
                  {expandedUser ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
            </Box>
            <Collapse in={expandedUser}>
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.8,
                      color: 'text.primary',
                    }}
                  >
                    {record.user_prompt}
                  </Typography>
                </Paper>
              </Box>
            </Collapse>
          </Card>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default function PromptRecordsPage() {
  const theme = useTheme()

  // 状态管理
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<PromptRecordResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [selectedRecord, setSelectedRecord] = useState<PromptRecordResponse | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [endpointFilter, setEndpointFilter] = useState('')

  // 加载数据
  const loadRecords = async () => {
    try {
      setLoading(true)
      const response = await promptRecordsAPI.list({
        page,
        page_size: pageSize,
        endpoint: endpointFilter || null,
      })
      setRecords(response.records)
      setTotal(response.total)
    } catch (error) {
      console.error('加载提示词记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [page, endpointFilter])

  // 处理详情查看
  const handleViewDetail = (record: PromptRecordResponse) => {
    setSelectedRecord(record)
    setDetailOpen(true)
  }

  // 处理分页
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      {/* 页面标题 */}
      <Box component={motion.div} variants={itemVariants} sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              display: 'flex',
            }}
          >
            <HistoryIcon />
          </Box>
          <Typography variant="h4" fontWeight={800}>
            提示词记录
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          查看和管理您的 AI 提示词历史记录
        </Typography>
      </Box>

      {/* 过滤器 */}
      <Box component={motion.div} variants={itemVariants} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="按端点过滤..."
          value={endpointFilter}
          onChange={(e) => {
            setEndpointFilter(e.target.value)
            setPage(1) // 重置到第一页
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* 记录列表 */}
      <Box component={motion.div} variants={itemVariants}>
        {loading ? (
          // 加载骨架屏
          <Grid2 container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid2 key={index} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2 }} />
                      <Skeleton width="60%" />
                      <Skeleton width="80%" />
                      <Skeleton width="40%" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        ) : records.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              p: 8,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <HistoryIcon sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" color="text.secondary">
                暂无记录
              </Typography>
              <Typography variant="body2" color="text.secondary">
                开始使用 AI 功能后，记录将显示在这里
              </Typography>
            </Box>
          </Card>
        ) : (
          <>
            <Grid2 container spacing={3}>
              {records.map((record, index) => (
                <Grid2 key={record.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    elevation={0}
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                    }}
                    onClick={() => handleViewDetail(record)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        {/* 头部：端点和时间 */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          flexWrap="wrap"
                          gap={1}
                        >
                          <Chip
                            icon={<ArticleIcon sx={{ fontSize: 16 }} />}
                            label={formatEndpoint(record.endpoint)}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                            }}
                          />
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <ScheduleIcon
                              sx={{
                                fontSize: 14,
                                color: 'text.secondary',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {formatDate(record.created_at)}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Divider />

                        {/* 系统提示词 */}
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <SmartToyIcon
                              sx={{
                                fontSize: 16,
                                color: theme.palette.secondary.main,
                              }}
                            />
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              系统提示词
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.6,
                            }}
                          >
                            {record.system_prompt}
                          </Typography>
                        </Box>

                        {/* 用户提示词 */}
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <PersonIcon
                              sx={{
                                fontSize: 16,
                                color: theme.palette.info.main,
                              }}
                            />
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              用户提示词
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.6,
                            }}
                          >
                            {record.user_prompt}
                          </Typography>
                        </Box>

                        <Divider />

                        {/* 元数据 */}
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {record.model && (
                            <Chip
                              label={record.model}
                              size="small"
                              sx={{
                                borderRadius: 1.5,
                                fontSize: '0.7rem',
                                height: 24,
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                              }}
                            />
                          )}
                          {record.temperature !== null && (
                            <Chip
                              label={`温度 ${record.temperature}`}
                              size="small"
                              sx={{
                                borderRadius: 1.5,
                                fontSize: '0.7rem',
                                height: 24,
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                              }}
                            />
                          )}
                          {record.project_id && (
                            <Chip
                              label={`项目 #${record.project_id}`}
                              size="small"
                              sx={{
                                borderRadius: 1.5,
                                fontSize: '0.7rem',
                                height: 24,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
            </Grid2>

            {/* 分页 */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    px: 2,
                    py: 1,
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Card>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* 统计信息 */}
      {!loading && (
        <Box component={motion.div} variants={itemVariants} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            共 {total} 条记录
          </Typography>
        </Box>
      )}

      {/* 详情对话框 */}
      <PromptDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        record={selectedRecord}
      />
    </Box>
  )
}
