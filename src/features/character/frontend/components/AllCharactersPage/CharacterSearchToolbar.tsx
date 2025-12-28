/**
 * 角色搜索和筛选工具栏组件
 * 提供搜索框和分类筛选功能
 */

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

interface CharacterSearchToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categoryFilter: string | null
  onCategoryChange: (category: string | null) => void
  categories: string[]
}

export default function CharacterSearchToolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
}: CharacterSearchToolbarProps) {
  const theme = useTheme()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      sx={{
        mb: 4,
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.5}>
          {/* 搜索框 - 增强视觉效果 */}
          <TextField
            placeholder="搜索角色名称..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            size="medium"
            fullWidth
            sx={{
              maxWidth: { xs: '100%', md: 480 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.6),
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: searchFocused ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.2s ease',
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 分类筛选 - 更好的视觉反馈 */}
          {categories.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Tooltip title="筛选分类">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <FilterIcon fontSize="small" sx={{ color: 'primary.main' }} />
                </Box>
              </Tooltip>
              <Chip
                label="全部"
                size="small"
                variant={categoryFilter === null ? 'filled' : 'outlined'}
                color={categoryFilter === null ? 'primary' : 'default'}
                onClick={() => onCategoryChange(null)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                }}
              />
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  variant={categoryFilter === cat ? 'filled' : 'outlined'}
                  color={categoryFilter === cat ? 'primary' : 'default'}
                  onClick={() => onCategoryChange(cat)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 500,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
