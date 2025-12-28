/**
 * 角色详情页面
 * 展示和编辑角色完整信息
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
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
import type { Character, CharacterFormData } from '@/features/character/frontend/types'

export default function CharacterDetailPage() {
  const { characterId } = useParams<{ characterId: string }>()
  const navigate = useNavigate()
  const isNew = characterId === 'new'

  const [character, setCharacter] = useState<Character | null>(null)
  const [formData, setFormData] = useState<CharacterFormData>(getDefaultFormData())
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!isNew && characterId) {
      loadCharacter()
    }
  }, [characterId, isNew])

  const loadCharacter = async () => {
    try {
      setLoading(true)
      const data = await characterAPI.get(Number(characterId))
      setCharacter(data)
      setFormData(getDefaultFormData(data))
    } catch (err) {
      setError('加载角色失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: CharacterFormData) => {
    try {
      if (isNew) {
        // 创建新角色
        const urlParams = new URLSearchParams(window.location.search)
        const projectId = urlParams.get('projectId')
        
        await characterAPI.create({
          ...data,
          project_id: projectId ? Number(projectId) : undefined,
        })
        setSuccess('角色创建成功')
        setTimeout(() => {
          navigate(-1)
        }, 1000)
      } else {
        // 更新现有角色
        await characterAPI.update(Number(characterId), data)
        setSuccess('保存成功')
        loadCharacter()
      }
    } catch (err) {
      setError('保存失败')
      console.error(err)
    }
  }

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
              onFormChange={setFormData}
              onSave={handleSave}
              onCancel={() => navigate(-1)}
              mode={isNew ? 'create' : 'edit'}
            />
          )}

          {activeTab === 1 && (
            <BackgroundEditor
              formData={formData}
              onFormChange={setFormData}
              onSave={handleSave}
            />
          )}

          {activeTab === 2 && (
            <PersonalityEditor
              formData={formData}
              onFormChange={setFormData}
              onSave={handleSave}
            />
          )}

          {activeTab === 3 && (
            <AbilitiesEditor
              formData={formData}
              onFormChange={setFormData}
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
