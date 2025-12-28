import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid2,
  IconButton,
  Typography,
  useTheme,
  alpha,
  Collapse,
} from '@mui/material'
import { motion } from 'framer-motion'
import CloseIcon from '@mui/icons-material/Close'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { SHORT_STORY_TEMPLATES } from '@/features/novel_generator/frontend/constants'
import type { ShortStoryTemplate } from '@/features/novel_generator/frontend/types'

interface QuickTemplateSelectorProps {
  onSelectTemplate: (template: ShortStoryTemplate) => void
}

const QuickTemplateSelector: React.FC<QuickTemplateSelectorProps> = ({ onSelectTemplate }) => {
  const theme = useTheme()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleTemplateClick = (template: ShortStoryTemplate) => {
    onSelectTemplate(template)
    setDialogOpen(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => setDialogOpen(true)}
        sx={{
          borderRadius: 3,
          fontWeight: 700,
          py: 1.2,
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
          '&:hover': {
            boxShadow: `0 6px 25px ${alpha(theme.palette.secondary.main, 0.4)}`,
          },
        }}
      >
        快捷生成项目
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: 'blur(24px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              短篇小说快捷模板
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, fontStyle: 'italic' }}
          >
            选择一个模板快速开始创作您的短篇小说（1000-5000字）
          </Typography>

          <Grid2 container spacing={3}>
            {SHORT_STORY_TEMPLATES.map((template) => (
              <Grid2 key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: 32,
                            mr: 1.5,
                            lineHeight: 1,
                          }}
                        >
                          {template.icon}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {template.name}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {template.description}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={template.genre}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={template.style}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(template.id)
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: 'text.secondary' }}
                          >
                            故事要素
                          </Typography>
                          <IconButton size="small">
                            {expandedId === template.id ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>

                        <Collapse in={expandedId === template.id}>
                          <Box sx={{ mt: 1 }}>
                            {template.plotPoints.map((point, idx) => (
                              <Typography
                                key={idx}
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: 'text.secondary',
                                  pl: 1,
                                  py: 0.3,
                                  borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                  mb: 0.5,
                                }}
                              >
                                {idx + 1}. {point}
                              </Typography>
                            ))}
                          </Box>
                        </Collapse>
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          mb: 2,
                          fontStyle: 'italic',
                        }}
                      >
                        建议字数：{template.suggestedLength}
                      </Typography>

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleTemplateClick(template)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 700,
                          py: 1,
                        }}
                      >
                        使用此模板
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid2>
            ))}
          </Grid2>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default QuickTemplateSelector
