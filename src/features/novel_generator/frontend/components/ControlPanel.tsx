import React from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid2,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { scaleVariants } from '@/frontend/core/animation'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import type {
  NovelState,
} from '@/features/novel_generator/frontend/types'
import {
  GENRE_OPTIONS,
  STYLE_OPTIONS,
} from '@/features/novel_generator/frontend/constants'
import {
  useInputStyles,
  useGradientButtonStyles,
} from '@/features/novel_generator/frontend/hooks'

interface ControlPanelProps {
  form: NovelState['form']
  isStreaming: boolean
  onFieldChange: (field: keyof NovelState['form'], value: string) => void
  onGenerate: () => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  form,
  isStreaming,
  onFieldChange,
  onGenerate,
}) => {
  const inputStyle = useInputStyles()
  const gradientButtonStyle = useGradientButtonStyles()

  return (
    <Grid2 size={{ xs: 12, lg: 4 }} sx={{ height: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 12px 40px rgba(31, 38, 135, 0.08)',
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 24,
              bgcolor: 'primary.main',
              borderRadius: 2,
              mr: 1.5,
            }}
          />
          创作参数
        </Typography>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1, mx: -1 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel
              sx={{
                fontWeight: 600,
                mb: 1,
                color: '#455a64',
                fontSize: '0.9rem',
              }}
            >
              小说标题
            </FormLabel>
            <TextField
              value={form.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              placeholder="请输入标题"
              disabled={isStreaming}
              variant="outlined"
              size="small"
              sx={inputStyle}
            />
          </FormControl>

          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={6}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: '#455a64',
                    fontSize: '0.9rem',
                  }}
                >
                  类型
                </FormLabel>
                <Select
                  value={form.genre}
                  onChange={(e) => onFieldChange('genre', e.target.value)}
                  displayEmpty
                  disabled={isStreaming}
                  size="small"
                  sx={inputStyle}
                >
                  <MenuItem value="" disabled>
                    选择类型
                  </MenuItem>
                  {GENRE_OPTIONS.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={6}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: '#455a64',
                    fontSize: '0.9rem',
                  }}
                >
                  风格
                </FormLabel>
                <Select
                  value={form.style}
                  onChange={(e) => onFieldChange('style', e.target.value)}
                  displayEmpty
                  disabled={isStreaming}
                  size="small"
                  sx={inputStyle}
                >
                  <MenuItem value="" disabled>
                    选择风格
                  </MenuItem>
                  {STYLE_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
          </Grid2>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel
              sx={{
                fontWeight: 600,
                mb: 1,
                color: '#455a64',
                fontSize: '0.9rem',
              }}
            >
              详细要求
            </FormLabel>
            <TextField
              value={form.requirement}
              onChange={(e) => onFieldChange('requirement', e.target.value)}
              placeholder="输入故事背景..."
              multiline
              rows={6}
              disabled={isStreaming}
              variant="outlined"
              sx={inputStyle}
            />
          </FormControl>
        </Box>

        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px dashed rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
        >
          <motion.div
            variants={scaleVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onGenerate}
              disabled={isStreaming}
              startIcon={
                isStreaming ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AutoStoriesIcon />
                )
              }
              sx={{
                py: 1.2,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '0.95rem',
                ...gradientButtonStyle,
              }}
            >
              {isStreaming ? '生成中...' : '开始创作'}
            </Button>
          </motion.div>
        </Box>
      </Paper>
    </Grid2>
  )
}

export default ControlPanel
