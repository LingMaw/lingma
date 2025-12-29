/**
 * 筛选控制面板
 * 提供关系类型、强度筛选和布局模式切换
 */

import {
  Paper,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Divider,
  IconButton,
  Collapse,
  Typography,
  alpha,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { motion, AnimatePresence } from 'framer-motion'
import { useGraphStore, type LayoutType } from '../../stores/graphStore'

// 关系类型列表
const RELATION_TYPES = ['家人', '朋友', '敌人', '恋人', '同事', '师徒', '竞争对手', '其他']

const FilterPanel = () => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(true)

  const {
    selectedRelationTypes,
    strengthRange,
    currentLayout,
    toggleRelationType,
    setStrengthRange,
    setLayout,
    resetFilters,
  } = useGraphStore()

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        maxWidth: 280,
        background: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        boxShadow: 6,
      }}
    >
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 2,
          paddingBottom: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" fontWeight={600}>
            筛选与布局
          </Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={resetFilters} title="重置筛选">
            <ResetIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <CloseIcon fontSize="small" /> : <FilterIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <AnimatePresence>
        {expanded && (
          <Collapse in={expanded}>
            <Box sx={{ padding: 2, paddingTop: 1 }}>
              {/* 关系类型多选 */}
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <FormLabel sx={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>
                  关系类型
                </FormLabel>
                <FormGroup>
                  {RELATION_TYPES.map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={selectedRelationTypes.includes(type)}
                          onChange={() => toggleRelationType(type)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{type}</Typography>}
                      sx={{ marginY: 0.25 }}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <Divider sx={{ marginY: 2 }} />

              {/* 强度范围滑块 */}
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <FormLabel sx={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>
                  关系强度范围
                </FormLabel>
                <Box sx={{ paddingX: 1 }}>
                  <Slider
                    value={strengthRange}
                    onChange={(_, value) => setStrengthRange(value as [number, number])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10}
                    step={1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' },
                    ]}
                    sx={{
                      '& .MuiSlider-markLabel': {
                        fontSize: 11,
                      },
                    }}
                  />
                </Box>
              </FormControl>

              <Divider sx={{ marginY: 2 }} />

              {/* 布局模式切换 */}
              <FormControl fullWidth>
                <FormLabel sx={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>
                  布局模式
                </FormLabel>
                <ToggleButtonGroup
                  value={currentLayout}
                  exclusive
                  onChange={(_, value) => value && setLayout(value as LayoutType)}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value="force">力导向</ToggleButton>
                  <ToggleButton value="hierarchical">层次</ToggleButton>
                  <ToggleButton value="circular">环形</ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
            </Box>
          </Collapse>
        )}
      </AnimatePresence>
    </Paper>
  )
}

export default FilterPanel
