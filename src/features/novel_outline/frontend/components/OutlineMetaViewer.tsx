/**
 * 大纲元信息展示组件
 */

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  alpha,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Public as WorldIcon,
  Psychology as ThemeIcon,
  AutoGraph as StructureIcon,
  TurnedIn as TurningPointIcon,
  Groups as CharacterIcon,
  Warning as WarningIcon,
  InfoOutlined,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { itemVariants } from '@/frontend/core/animation'

import { outlineAPI } from '../api'
import type { OutlineMetaResponse, KeyTurningPoint } from '../types'

interface OutlineMetaViewerProps {
  projectId: number
}

export default function OutlineMetaViewer({ projectId }: OutlineMetaViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metaResponse, setMetaResponse] = useState<OutlineMetaResponse | null>(null)
  const [expanded, setExpanded] = useState<string[]>(['worldview'])

  useEffect(() => {
    loadMeta()
  }, [projectId])

  const loadMeta = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await outlineAPI.getOutlineMeta(projectId)
      setMetaResponse(data)
    } catch (err) {
      console.error('加载元信息失败:', err)
      setError('加载元信息失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAccordionChange = (panel: string) => {
    setExpanded((prev) =>
      prev.includes(panel) ? prev.filter((p) => p !== panel) : [...prev, panel]
    )
  }

  if (loading) {
    return (
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Paper>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!metaResponse?.has_meta || !metaResponse?.meta) {
    return (
      <Paper
        component={motion.div}
        variants={itemVariants}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
        }}
      >
        <InfoOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary" variant="h6" gutterBottom>
          暂无元信息
        </Typography>
        <Typography color="text.secondary" variant="body2">
          使用 AI 生成大纲后，将自动生成包含世界观、主题升华等内容的元信息
        </Typography>
      </Paper>
    )
  }

  const meta = metaResponse.meta

  return (
    <Box
      component={motion.div}
      variants={itemVariants}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* 世界观 */}
      {meta.worldview && meta.worldview.trim() !== '' && (
        <Accordion
          expanded={expanded.includes('worldview')}
          onChange={() => handleAccordionChange('worldview')}
          sx={{
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:before': { display: 'none' },
            boxShadow: (theme) => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WorldIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                世界观
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                color: 'text.primary',
              }}
            >
              {meta.worldview}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 核心矛盾 */}
      {meta.core_conflicts && meta.core_conflicts.length > 0 && (
        <Accordion
          expanded={expanded.includes('conflicts')}
          onChange={() => handleAccordionChange('conflicts')}
          sx={{
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:before': { display: 'none' },
            boxShadow: (theme) => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WarningIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                核心矛盾
              </Typography>
              <Chip label={meta.core_conflicts.length} size="small" color="warning" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {meta.core_conflicts.map((conflict, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.warning.main, 0.2),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Chip
                      label={index + 1}
                      size="small"
                      color="warning"
                      sx={{ minWidth: 28, height: 24 }}
                    />
                    <Typography variant="body1" sx={{ flex: 1, lineHeight: 1.8 }}>
                      {conflict}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 主题升华路径 */}
      {meta.theme_evolution && meta.theme_evolution.trim() !== '' && (
        <Accordion
          expanded={expanded.includes('theme')}
          onChange={() => handleAccordionChange('theme')}
          sx={{
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:before': { display: 'none' },
            boxShadow: (theme) => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ThemeIcon color="secondary" />
              <Typography variant="h6" fontWeight={600}>
                主题升华路径
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                color: 'text.primary',
              }}
            >
              {meta.theme_evolution}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 情节结构 */}
      {meta.plot_structure && meta.plot_structure.trim() !== '' && (
        <Accordion
          expanded={expanded.includes('structure')}
          onChange={() => handleAccordionChange('structure')}
          sx={{
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:before': { display: 'none' },
            boxShadow: (theme) => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <StructureIcon color="info" />
              <Typography variant="h6" fontWeight={600}>
                情节结构
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                color: 'text.primary',
              }}
            >
              {meta.plot_structure}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 关键转折点 */}
      {meta.key_turning_points && meta.key_turning_points.length > 0 && (
        <Accordion
          expanded={expanded.includes('turning_points')}
          onChange={() => handleAccordionChange('turning_points')}
          sx={{
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:before': { display: 'none' },
            boxShadow: (theme) => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TurningPointIcon color="error" />
              <Typography variant="h6" fontWeight={600}>
                关键转折点
              </Typography>
              <Chip label={meta.key_turning_points.length} size="small" color="error" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {meta.key_turning_points.map((point: KeyTurningPoint, index: number) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={point.position}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                      >
                        事件描述
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                        {point.description}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                      >
                        后续影响
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.7, color: 'text.secondary' }}
                      >
                        {point.impact}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 角色成长弧光 */}
      {meta.character_arcs && Object.keys(meta.character_arcs).length > 0 && (
        <Accordion
          expanded={expanded.includes('character_arcs')}
          onChange={() => handleAccordionChange('character_arcs')}
          sx={{
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:before': { display: 'none' },
            boxShadow: (theme) => `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CharacterIcon color="success" />
              <Typography variant="h6" fontWeight={600}>
                角色成长弧光
              </Typography>
              <Chip
                label={Object.keys(meta.character_arcs).length}
                size="small"
                color="success"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {Object.entries(meta.character_arcs).map(([character, arc], index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.success.main, 0.2),
                  }}
                >
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: 'success.main' }}
                    >
                      {character}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.7,
                        color: 'text.primary',
                      }}
                    >
                      {arc}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
