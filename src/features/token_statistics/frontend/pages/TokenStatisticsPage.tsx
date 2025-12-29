import { useState, useEffect, useCallback } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Grid2,
  useTheme,
  alpha,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  Token as TokenIcon,
  TrendingUp as TrendingUpIcon,
  Functions as FunctionsIcon,
  QueryStats as QueryStatsIcon,
  Storage as StorageIcon,
  AccessTime as TimeIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

import { tokenStatisticsAPI } from '@/features/token_statistics/frontend/api'
import type { UserTokenSummary, TokenUsageRecord } from '@/features/token_statistics/frontend/index'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import { systemColors } from '@/frontend/core/theme/macOS'

// --- 辅助函数 ---

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1) return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return `${days}天前`
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatEndpoint(endpoint: string): string {
  const parts = endpoint.split('/')
  return parts[parts.length - 1] || endpoint
}

// --- 组件 ---

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  loading: boolean
  subtitle?: string
}

const StatCard = ({ title, value, icon: Icon, color, loading, subtitle }: StatCardProps) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        height: 120,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              bgcolor: alpha(color, 0.1),
              color: color,
              display: 'flex',
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        {loading ? (
          <Skeleton width={80} height={36} />
        ) : (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ color: color, mb: subtitle ? 0.5 : 0 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface ModelStatsCardProps {
  modelName: string
  stats: {
    total_tokens: number
    prompt_tokens: number
    completion_tokens: number
    request_count: number
  }
  color: string
}

const ModelStatsCard = ({ modelName, stats, color }: ModelStatsCardProps) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: alpha(color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            <AIIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {modelName}
          </Typography>
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              总 Token
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: color }}>
              {stats.total_tokens.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Prompt
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {stats.prompt_tokens.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Completion
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {stats.completion_tokens.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1,
              mt: 1,
              borderTop: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              请求次数
            </Typography>
            <Chip
              label={stats.request_count}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: alpha(color, 0.1),
                color: color,
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

// --- 主页面 ---

export default function TokenStatisticsPage() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<UserTokenSummary | null>(null)
  const [records, setRecords] = useState<TokenUsageRecord[]>([])
  const [days, setDays] = useState<number>(30)
  const [recordLimit, setRecordLimit] = useState<number>(50)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [summaryData, recordsData] = await Promise.all([
        tokenStatisticsAPI.getUserSummary(days),
        tokenStatisticsAPI.getUserRecentRecords(recordLimit),
      ])
      setSummary(summaryData)
      setRecords(recordsData)
    } catch (error) {
      console.error('加载Token统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [days, recordLimit])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const modelColors = [
    systemColors.blue.light,
    systemColors.purple.light,
    systemColors.green.light,
    systemColors.orange.light,
  ]

  return (
    <Stack
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      spacing={4}
      sx={{ pb: 4 }}
    >
      {/* 标题区 */}
      <Box component={motion.div} variants={itemVariants}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
          📊 Token 使用统计
        </Typography>
        <Typography variant="body2" color="text.secondary">
          查看您的 AI Token 使用情况和消耗详情
        </Typography>
      </Box>

      {/* 时间范围选择 */}
      <Box component={motion.div} variants={itemVariants}>
        <ToggleButtonGroup
          value={days}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) setDays(newValue)
          }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: alpha(systemColors.blue.light, 0.15),
                color: systemColors.blue.light,
                '&:hover': {
                  bgcolor: alpha(systemColors.blue.light, 0.25),
                },
              },
            },
          }}
        >
          <ToggleButton value={7}>最近 7 天</ToggleButton>
          <ToggleButton value={30}>最近 30 天</ToggleButton>
          <ToggleButton value={90}>最近 90 天</ToggleButton>
          <ToggleButton value={365}>最近一年</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 统计卡片 */}
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="总 Token 消耗"
            value={summary?.total_tokens || 0}
            icon={TokenIcon}
            color={systemColors.purple.light}
            loading={loading}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Prompt Tokens"
            value={summary?.prompt_tokens || 0}
            icon={FunctionsIcon}
            color={systemColors.blue.light}
            loading={loading}
            subtitle="输入消耗"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completion Tokens"
            value={summary?.completion_tokens || 0}
            icon={TrendingUpIcon}
            color={systemColors.green.light}
            loading={loading}
            subtitle="生成消耗"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="请求次数"
            value={summary?.request_count || 0}
            icon={QueryStatsIcon}
            color={systemColors.orange.light}
            loading={loading}
          />
        </Grid2>
      </Grid2>

      {/* 模型使用统计 */}
      {summary && Object.keys(summary.model_stats).length > 0 && (
        <Box component={motion.div} variants={itemVariants}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, letterSpacing: '-0.01em' }}>
            🤖 按模型统计
          </Typography>
          <Grid2 container spacing={3}>
            {Object.entries(summary.model_stats).map(([modelName, stats], index) => (
              <Grid2 key={modelName} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ModelStatsCard
                  modelName={modelName}
                  stats={stats}
                  color={modelColors[index % modelColors.length]}
                />
              </Grid2>
            ))}
          </Grid2>
        </Box>
      )}

      {/* 最近使用记录 */}
      <Box component={motion.div} variants={itemVariants}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
            🕒 最近使用记录
          </Typography>
          <ToggleButtonGroup
            value={recordLimit}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) setRecordLimit(newValue)
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                px: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.75rem',
                '&.Mui-selected': {
                  bgcolor: alpha(systemColors.green.light, 0.15),
                  color: systemColors.green.light,
                  '&:hover': {
                    bgcolor: alpha(systemColors.green.light, 0.25),
                  },
                },
              },
            }}
          >
            <ToggleButton value={20}>20 条</ToggleButton>
            <ToggleButton value={50}>50 条</ToggleButton>
            <ToggleButton value={100}>100 条</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            maxHeight: 600,
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon fontSize="small" />
                    时间
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AIIcon fontSize="small" />
                    模型
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon fontSize="small" />
                    端点
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                  Prompt
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                  Completion
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <TokenIcon fontSize="small" />
                    总计
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6}>
                      <Skeleton width="100%" height={30} />
                    </TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <TokenIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      暂无使用记录
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => (
                  <TableRow
                    key={record.id}
                    component={motion.tr}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(record.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.model}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: alpha(systemColors.blue.light, 0.1),
                          color: systemColors.blue.light,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {formatEndpoint(record.endpoint)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {record.prompt_tokens.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {record.completion_tokens.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} sx={{ color: systemColors.purple.light }}>
                        {record.total_tokens.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  )
}
