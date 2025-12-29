/**
 * 角色详情页面
 * 展示和编辑角色完整信息
 */

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Alert,
  Paper,
  Tabs,
  Tab,
  alpha,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Public as PublicIcon,
  FolderSpecial as FolderSpecialIcon,
  Save as SaveIcon,
  Check as CheckIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { pageVariants } from '@/frontend/core/animation'
import {
  CharacterForm,
  getDefaultFormData,
  BackgroundEditor,
  PersonalityEditor,
  AbilitiesEditor,
  RelationsEditor,
} from '@/features/character/frontend/components'
import { characterAPI } from '@/features/character/frontend/api'
import { novelProjectAPI } from '@/features/novel_project/frontend/api'
import type { Character, CharacterFormData } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

export default function CharacterDetailPage() {
  const { characterId } = useParams<{ characterId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = characterId === 'new'
  
  // 从 URL 获取 projectId 参数（创建时使用）
  const urlProjectId = useMemo(() => {
    const id = searchParams.get('projectId')
    return id ? Number(id) : null
  }, [searchParams])

  const [character, setCharacter] = useState<Character | null>(null)
  const [formData, setFormData] = useState<CharacterFormData>(getDefaultFormData())
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [project, setProject] = useState<NovelProjectResponse | null>(null)
  
  // 自动保存相关状态
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const formDataRef = useRef(formData)

  // 更新 formDataRef
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isNew && characterId) {
      loadCharacter()
    }
    // 创建新角色时，如果 URL 带 projectId，加载项目信息
    if (isNew && urlProjectId) {
      loadProjectInfo(urlProjectId)
    }
  }, [characterId, isNew, urlProjectId])

  const loadProjectInfo = async (projectId: number) => {
    try {
      const projectData = await novelProjectAPI.getProject(projectId)
      setProject(projectData)
    } catch (err) {
      console.error('加载项目信息失败:', err)
    }
  }

  const loadCharacter = async () => {
    try {
      setLoading(true)
      const data = await characterAPI.get(Number(characterId))
      setCharacter(data)
      setFormData(getDefaultFormData(data))
      // 加载关联项目信息
      if (data.project_id) {
        try {
          const projectData = await novelProjectAPI.getProject(data.project_id)
          setProject(projectData)
        } catch (err) {
          console.error('加载项目信息失败:', err)
        }
      } else {
        setProject(null)
      }
    } catch (err) {
      setError('加载角色失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 自动保存函数
  const autoSave = useCallback(async () => {
    // 只有编辑模式才自动保存，创建模式不自动保存
    if (isNew || !characterId) return
    
    try {
      setAutoSaving(true)
      await characterAPI.update(Number(characterId), formDataRef.current)
      setLastSaved(new Date())
    } catch (err) {
      console.error('自动保存失败:', err)
    } finally {
      setAutoSaving(false)
    }
  }, [isNew, characterId])

  // 触发自动保存（防抖）
  const triggerAutoSave = useCallback(() => {
    if (isNew) return // 创建模式不自动保存
    
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    // 设置新的定时器（2秒后自动保存）
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave()
    }, 2000)
  }, [isNew, autoSave])

  const handleSave = async (data: CharacterFormData) => {
    try {
      if (isNew) {
        // 创建新角色 - 使用 URL 中的 projectId
        await characterAPI.create({
          ...data,
          project_id: urlProjectId || undefined,
        })
        setSuccess('角色创建成功')
        setTimeout(() => {
          navigate(-1)
        }, 1000)
      } else {
        // 更新现有角色
        await characterAPI.update(Number(characterId), data)
        setSuccess('保存成功')
        setLastSaved(new Date())
        loadCharacter()
      }
    } catch (err) {
      setError('保存失败')
      console.error(err)
    }
  }

  // 处理表单变化（触发自动保存）
  const handleFormChange = useCallback((data: CharacterFormData) => {
    setFormData(data)
    triggerAutoSave()
  }, [triggerAutoSave])

  return (
    <Container
      maxWidth="lg"
      component={motion.div}
      variants={pageVariants}
      initial="hidden"
      animate="show"
      sx={{ py: 4 }}
    >
      {/* 头部 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Typography variant="h4" fontWeight={600}>
            {isNew ? '创建角色' : character?.name || '角色详情'}
          </Typography>
          {/* 自动保存状态 */}
          {!isNew && (
            <Stack direction="row" spacing={1} alignItems="center">
              {autoSaving ? (
                <>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    保存中...
                  </Typography>
                </>
              ) : lastSaved ? (
                <>
                  <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="text.secondary">
                    已保存 {new Date(lastSaved).toLocaleTimeString()}
                  </Typography>
                </>
              ) : null}
            </Stack>
          )}
          {/* 显示角色归属：公共角色或项目专属 */}
          {((!isNew && character) || (isNew && urlProjectId)) && (
            (character?.project_id || urlProjectId) && project ? (
              <Chip
                label={project.title}
                size="small"
                icon={<FolderSpecialIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 500,
                  backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                  color: 'secondary.main',
                  '& .MuiChip-icon': {
                    color: 'secondary.main',
                  },
                }}
              />
            ) : !isNew ? (
              <Chip
                label="公共角色"
                size="small"
                icon={<PublicIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 500,
                  backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
                  color: 'success.main',
                  '& .MuiChip-icon': {
                    color: 'success.main',
                  },
                }}
              />
            ) : null
          )}
        </Stack>
      </Stack>

      {/* 提示信息 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* 内容 */}
      {loading ? (
        <Typography>加载中...</Typography>
      ) : (
        <Paper
          sx={{
            borderRadius: 4,
            p: 4,
            backdropFilter: 'blur(20px)',
            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="基本信息" />
              <Tab label="背景故事" />
              <Tab label="性格特征" />
              <Tab label="能力技能" />
              <Tab label="关系网络" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <CharacterForm
              character={character || undefined}
              formData={formData}
              onFormChange={handleFormChange}
              onSave={handleSave}
              onCancel={() => navigate(-1)}
              mode={isNew ? 'create' : 'edit'}
            />
          )}

          {activeTab === 1 && (
            <BackgroundEditor
              formData={formData}
              onFormChange={handleFormChange}
              onSave={handleSave}
            />
          )}

          {activeTab === 2 && (
            <PersonalityEditor
              formData={formData}
              onFormChange={handleFormChange}
              onSave={handleSave}
            />
          )}

          {activeTab === 3 && (
            <AbilitiesEditor
              formData={formData}
              onFormChange={handleFormChange}
              onSave={handleSave}
            />
          )}

          {activeTab === 4 && !isNew && character && (
            <RelationsEditor
              characterId={character.id}
              characterName={character.name}
            />
          )}

          {activeTab === 4 && isNew && (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary" gutterBottom>
                请先保存角色后再管理关系网络
              </Typography>
              <Typography variant="caption" color="text.secondary">
                关系管理功能需要角色创建完成后才能使用
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  )
}
