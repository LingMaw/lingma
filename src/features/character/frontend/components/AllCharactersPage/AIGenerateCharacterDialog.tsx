/**
 * AI生成角色对话框组件
 * 支持通过AI生成虚拟人物
 */

import {
  Box,
  Button,
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
  Chip,
  CircularProgress,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

interface AIGenerateCharacterDialogProps {
  open: boolean
  onClose: () => void
  onGenerate: (params: GenerateParams) => Promise<void>
  currentTab: 'public' | 'project'
  allProjects: NovelProjectResponse[]
  selectedProjectId: number | null
  onProjectSelect: (projectId: number | null) => void
}

export interface GenerateParams {
  character_type?: string
  gender?: string
  age_range?: string
  personality_traits?: string
  background_hint?: string
  abilities_hint?: string
  additional_requirements?: string
  project_id?: number
}

const CHARACTER_TYPES = ['主角', '配角', '反派', '龙套']
const GENDERS = ['男', '女', '其他']
const AGE_RANGES = ['儿童(0-12岁)', '少年(13-17岁)', '青年(18-35岁)', '中年(36-55岁)', '老年(56岁以上)']

export default function AIGenerateCharacterDialog({
  open,
  onClose,
  onGenerate,
  currentTab,
  allProjects,
  selectedProjectId,
  onProjectSelect,
}: AIGenerateCharacterDialogProps) {
  const theme = useTheme()
  const [generating, setGenerating] = useState(false)
  
  const [characterType, setCharacterType] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [ageRange, setAgeRange] = useState<string>('')
  const [personalityTraits, setPersonalityTraits] = useState<string>('')
  const [backgroundHint, setBackgroundHint] = useState<string>('')
  const [abilitiesHint, setAbilitiesHint] = useState<string>('')
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('')

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await onGenerate({
        character_type: characterType || undefined,
        gender: gender || undefined,
        age_range: ageRange || undefined,
        personality_traits: personalityTraits || undefined,
        background_hint: backgroundHint || undefined,
        abilities_hint: abilitiesHint || undefined,
        additional_requirements: additionalRequirements || undefined,
        project_id: currentTab === 'project' ? selectedProjectId || undefined : undefined,
      })
      // 重置表单
      setCharacterType('')
      setGender('')
      setAgeRange('')
      setPersonalityTraits('')
      setBackgroundHint('')
      setAbilitiesHint('')
      setAdditionalRequirements('')
    } finally {
      setGenerating(false)
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
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(theme.palette.secondary.main, 0.7)} 100%)`,
            }}
          >
            <PsychologyIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              AI生成角色
            </Typography>
            <Typography variant="caption" color="text.secondary">
              通过AI智能生成富有个性的虚拟人物
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ opacity: 0.6 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          {/* 项目选择器 - 仅在项目专属标签页显示 */}
          {currentTab === 'project' && (
            allProjects.length > 0 ? (
              <FormControl fullWidth required>
                <InputLabel>选择项目</InputLabel>
                <Select
                  value={selectedProjectId || ''}
                  onChange={(e) => onProjectSelect(e.target.value as number)}
                  label="选择项目"
                  sx={{ borderRadius: 2.5 }}
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

          {/* 快捷设置 */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              快捷设置
            </Typography>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>角色类型</InputLabel>
                  <Select
                    value={characterType}
                    onChange={(e) => setCharacterType(e.target.value)}
                    label="角色类型"
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="">
                      <em>不限</em>
                    </MenuItem>
                    {CHARACTER_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>性别</InputLabel>
                  <Select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    label="性别"
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="">
                      <em>不限</em>
                    </MenuItem>
                    {GENDERS.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>年龄范围</InputLabel>
                  <Select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    label="年龄范围"
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="">
                      <em>不限</em>
                    </MenuItem>
                    {AGE_RANGES.map((range) => (
                      <MenuItem key={range} value={range}>
                        {range}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
            </Grid2>
          </Box>

          {/* 详细设置 */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              详细设置（可选）
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="性格特点"
                value={personalityTraits}
                onChange={(e) => setPersonalityTraits(e.target.value)}
                placeholder="例如：冷静、果断、有正义感"
                fullWidth
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="背景提示"
                value={backgroundHint}
                onChange={(e) => setBackgroundHint(e.target.value)}
                placeholder="例如：出身贫寒、自幼习武"
                fullWidth
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="能力/技能提示"
                value={abilitiesHint}
                onChange={(e) => setAbilitiesHint(e.target.value)}
                placeholder="例如：擅长剑术、通晓医术"
                fullWidth
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="其他要求"
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder="其他特殊要求..."
                fullWidth
                multiline
                rows={3}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
            </Stack>
          </Box>
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
          disabled={generating}
          sx={{ borderRadius: 2.5, px: 2.5 }}
        >
          取消
        </Button>
        <Button
          component={motion.button}
          whileHover={{ scale: generating ? 1 : 1.02 }}
          whileTap={{ scale: generating ? 1 : 0.98 }}
          onClick={handleGenerate}
          variant="contained"
          disabled={
            generating ||
            (currentTab === 'project' && (!selectedProjectId || allProjects.length === 0))
          }
          startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          sx={{
            borderRadius: 2.5,
            px: 3,
            boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
          }}
        >
          {generating ? '生成中...' : 'AI生成'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
