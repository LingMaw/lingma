/**
 * 项目角色列表页面
 * 展示项目专属角色列表,支持创建、编辑、删除
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants, pageVariants } from '@/frontend/core/animation'
import { CharacterCard } from '@/features/character/frontend/components'
import { characterAPI, characterTemplateAPI } from '@/features/character/frontend/api'
import type { Character, CharacterTemplate } from '@/features/character/frontend/types'

export default function ProjectCharacterListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [characters, setCharacters] = useState<Character[]>([])
  const [templates, setTemplates] = useState<CharacterTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 模板选择对话框
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate | null>(null)
  const [newCharacterName, setNewCharacterName] = useState('')

  useEffect(() => {
    loadCharacters()
    loadTemplates()
  }, [projectId])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      const data = await characterAPI.list(projectId ? Number(projectId) : undefined)
      setCharacters(data)
    } catch (err) {
      setError('加载角色列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await characterTemplateAPI.list()
      setTemplates(data)
    } catch (err) {
      console.error('加载模板失败:', err)
    }
  }

  const handleCreateBlank = () => {
    navigate(`/characters/new?projectId=${projectId}`)
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newCharacterName.trim()) return

    try {
      await characterAPI.create({
        name: newCharacterName,
        project_id: projectId ? Number(projectId) : undefined,
        template_id: selectedTemplate.id,
      })
      setTemplateDialogOpen(false)
      setNewCharacterName('')
      setSelectedTemplate(null)
      loadCharacters()
    } catch (err) {
      setError('创建角色失败')
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该角色?该角色的所有关系也将被删除。')) return

    try {
      await characterAPI.delete(id)
      loadCharacters()
    } catch (err) {
      setError('删除角色失败')
      console.error(err)
    }
  }

  const filteredCharacters = characters.filter((char) =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Container
      maxWidth="xl"
      component={motion.div}
      variants={pageVariants}
      initial="hidden"
      animate="show"
      sx={{ py: 4 }}
    >
      {/* 头部 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Typography variant="h4" fontWeight={600}>
          角色管理
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setTemplateDialogOpen(true)}>
            从模板创建
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateBlank}>
            创建空白角色
          </Button>
        </Stack>
      </Stack>

      {/* 搜索 */}
      <TextField
        fullWidth
        placeholder="搜索角色..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 角色列表 */}
      {loading ? (
        <Typography>加载中...</Typography>
      ) : (
        <Grid2
          container
          spacing={3}
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredCharacters.map((character) => (
            <Grid2 key={character.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <CharacterCard
                character={character}
                onClick={() => navigate(`/characters/${character.id}`)}
                onEdit={() => navigate(`/characters/${character.id}`)}
                onDelete={() => handleDelete(character.id)}
              />
            </Grid2>
          ))}
        </Grid2>
      )}

      {/* 从模板创建对话框 */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>从模板创建角色</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="角色名称"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              fullWidth
              required
            />
            <Typography variant="subtitle2">选择模板:</Typography>
            <Grid2 container spacing={2}>
              {templates.map((template) => (
                <Grid2 key={template.id} size={{ xs: 12, sm: 6 }}>
                  <Box
                    onClick={() => setSelectedTemplate(template)}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Typography variant="subtitle1">{template.name}</Typography>
                    {template.description && (
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    )}
                  </Box>
                </Grid2>
              ))}
            </Grid2>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCreateFromTemplate}
            variant="contained"
            disabled={!selectedTemplate || !newCharacterName.trim()}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
