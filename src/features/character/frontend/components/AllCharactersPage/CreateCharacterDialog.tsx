/**
 * 创建角色对话框组件
 * 支持创建空白角色或从模板创建
 */

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  Add as AddIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import type { CharacterTemplate } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

interface CreateCharacterDialogProps {
  open: boolean
  onClose: () => void
  templates: CharacterTemplate[]
  newCharacterName: string
  onNameChange: (name: string) => void
  selectedTemplate: CharacterTemplate | null
  onTemplateSelect: (template: CharacterTemplate | null) => void
  creating: boolean
  onCreateBlank: () => void
  onCreateFromTemplate: () => void
  currentTab: 'public' | 'project'
  allProjects: NovelProjectResponse[]
  selectedProjectId: number | null
  onProjectSelect: (projectId: number | null) => void
}

export default function CreateCharacterDialog({
  open,
  onClose,
  templates,
  newCharacterName,
  onNameChange,
  selectedTemplate,
  onTemplateSelect,
  creating,
  onCreateBlank,
  onCreateFromTemplate,
  currentTab,
  allProjects,
  selectedProjectId,
  onProjectSelect,
}: CreateCharacterDialogProps) {
  const theme = useTheme()

  const handleCreate = () => {
    if (selectedTemplate) {
      onCreateFromTemplate()
    } else {
      onCreateBlank()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              创建{currentTab === 'public' ? '公共' : '项目专属'}角色
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentTab === 'public' 
                ? '公共角色可在所有项目中使用' 
                : '项目专属角色仅在指定项目中可用'}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ opacity: 0.6 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          <TextField
            label="角色名称"
            value={newCharacterName}
            onChange={(e) => onNameChange(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="输入角色名称..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
              },
            }}
          />

          {/* 项目选择器 - 仅在项目专属标签页显示 */}
          {currentTab === 'project' && (
            allProjects.length > 0 ? (
              <FormControl fullWidth required>
                <InputLabel>选择项目</InputLabel>
                <Select
                  value={selectedProjectId || ''}
                  onChange={(e) => onProjectSelect(e.target.value as number)}
                  label="选择项目"
                  sx={{
                    borderRadius: 2.5,
                  }}
                >
                  {allProjects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography>{project.title}</Typography>
                        {project.genre && (
                          <Chip
                            label={project.genre}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                暂无可用项目，请先创建一个小说项目
              </Alert>
            )
          )}

          {templates.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                选择模板（可选）
              </Typography>
              <Grid2 container spacing={2}>
                {templates.map((template) => (
                  <Grid2 key={template.id} size={{ xs: 12, sm: 6 }}>
                    <Box
                      component={motion.div}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        onTemplateSelect(
                          selectedTemplate?.id === template.id ? null : template
                        )
                      }
                      sx={{
                        p: 2.5,
                        border: '2px solid',
                        borderColor:
                          selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        backgroundColor:
                          selectedTemplate?.id === template.id
                            ? alpha(theme.palette.primary.main, 0.08)
                            : 'transparent',
                        boxShadow:
                          selectedTemplate?.id === template.id
                            ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                            : 'none',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {template.name}
                        </Typography>
                        {selectedTemplate?.id === template.id && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main',
                            }}
                          />
                        )}
                      </Stack>
                      {template.category && (
                        <Chip
                          label={template.category}
                          size="small"
                          sx={{
                            mt: 0.5,
                            borderRadius: 1.5,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                      {template.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {template.description}
                        </Typography>
                      )}
                    </Box>
                  </Grid2>
                ))}
              </Grid2>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={onClose}
          disabled={creating}
          sx={{ borderRadius: 2.5, px: 2.5 }}
        >
          取消
        </Button>
        <Button
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          variant="contained"
          disabled={
            !newCharacterName.trim() ||
            creating ||
            (currentTab === 'project' && (!selectedProjectId || allProjects.length === 0))
          }
          startIcon={creating ? undefined : <AddIcon />}
          sx={{
            borderRadius: 2.5,
            px: 3,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          {creating ? '创建中...' : selectedTemplate ? '从模板创建' : '创建空白角色'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
