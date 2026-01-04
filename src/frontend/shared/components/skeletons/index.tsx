import { Box, Paper, Skeleton, Stack, useTheme, alpha } from '@mui/material'
import Grid2 from '@mui/material/Grid2'

/**
 * 项目卡片骨架屏
 */
export function SkeletonProjectCard() {
  const theme = useTheme()
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack spacing={2}>
        {/* 图标和标题 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Skeleton variant="rounded" width={48} height={48} sx={{ mr: 2, borderRadius: '12px' }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
          </Box>
        </Box>

        {/* 标签 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 2 }} />
        </Box>

        {/* 描述 */}
        <Box>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </Box>

        {/* 统计信息 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
        </Box>

        {/* 进度条 */}
        <Skeleton variant="rounded" width="100%" height={4} />

        {/* 底部信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
      </Stack>
    </Paper>
  )
}

/**
 * 项目列表骨架屏（8个卡片）
 */
export function SkeletonProjectList() {
  return (
    <Grid2 container spacing={3}>
      {[...Array(8)].map((_, index) => (
        <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={index}>
          <SkeletonProjectCard />
        </Grid2>
      ))}
    </Grid2>
  )
}

/**
 * 详情页骨架屏
 */
export function SkeletonDetail() {
  const theme = useTheme()
  
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* 标题区域 */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: 3 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 2 }} />
            </Box>
          </Stack>
        </Paper>

        {/* 内容区域 */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2}>
            <Skeleton variant="text" width="30%" height={28} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="85%" />
          </Stack>
        </Paper>

        {/* 统计卡片 */}
        <Grid2 container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid2 size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
              </Paper>
            </Grid2>
          ))}
        </Grid2>
      </Stack>
    </Box>
  )
}

/**
 * 章节列表项骨架屏
 */
export function SkeletonChapterItem() {
  const theme = useTheme()
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="50%" height={24} />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Skeleton variant="text" width={80} />
            <Skeleton variant="text" width={100} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>
    </Paper>
  )
}

/**
 * 章节列表骨架屏（多个条目）
 */
export function SkeletonChapterList({ count = 5 }: { count?: number }) {
  return (
    <Stack spacing={1}>
      {[...Array(count)].map((_, index) => (
        <SkeletonChapterItem key={index} />
      ))}
    </Stack>
  )
}

/**
 * 搜索结果骨架屏
 */
export function SkeletonSearchResults() {
  const theme = useTheme()
  
  return (
    <Stack spacing={2}>
      {[...Array(3)].map((_, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="80%" height={16} />
            </Box>
          </Box>
        </Paper>
      ))}
    </Stack>
  )
}

/**
 * 表格骨架屏
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const theme = useTheme()
  
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* 表头 */}
      <Box
        sx={{
          display: 'flex',
          p: 2,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {[...Array(columns)].map((_, index) => (
          <Box key={index} sx={{ flex: 1, px: 1 }}>
            <Skeleton variant="text" width="80%" height={20} />
          </Box>
        ))}
      </Box>

      {/* 表格行 */}
      {[...Array(rows)].map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            p: 2,
            borderBottom: rowIndex < rows - 1 ? `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Box key={colIndex} sx={{ flex: 1, px: 1 }}>
              <Skeleton variant="text" width="70%" />
            </Box>
          ))}
        </Box>
      ))}
    </Paper>
  )
}
