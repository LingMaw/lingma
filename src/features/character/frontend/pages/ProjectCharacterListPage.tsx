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
import { Add as AddIcon, ArrowBack as ArrowBackIcon, ImportExport as ImportExportIcon } from '@mui/icons-material'
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

  // 人设库导入对话框
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false)
  const [libraryCharacters, setLibraryCharacters] = useState<Character[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [libraryPage, setLibraryPage] = useState(0)
  const [rowsPerPage] = useState(8)
  const [importing, setImporting] = useState(false)

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

  const loadLibraryCharacters = async () => {
    try {
      setLibraryLoading(true)
      // 获取全局角色（project_id 为 undefined）
      const data = await characterAPI.list(undefined, false)
      setLibraryCharacters(data)
    } catch (err) {
      setError('加载人设库失败')
      console.error(err)
    } finally {
      setLibraryLoading(false)
    }
  }

  const handleOpenLibraryDialog = () => {
    setLibraryDialogOpen(true)
    loadLibraryCharacters()
  }

  const handleImportCharacter = async (character: Character) => {
    if (!projectId) return

    try {
      setImporting(true)
      // 复制角色到当前项目
      await characterAPI.create({
        name: character.name,
        basic_info: character.basic_info,
        background: character.background,
        personality: character.personality,
        abilities: character.abilities,
        notes: character.notes,
        project_id: Number(projectId),
      })
      loadCharacters()
      setLibraryDialogOpen(false)
      setLibrarySearchQuery('')
      setLibraryPage(0)
    } catch (err) {
      setError('导入角色失败')
      console.error(err)
    } finally {
      setImporting(false)
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
          <Button variant="outlined" startIcon={<ImportExportIcon />} onClick={handleOpenLibraryDialog}>
            从人设库导入
          </Button>
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

      {/* 从人设库导入对话框 */}
      <Dialog
        open={libraryDialogOpen}
        onClose={() => {
          setLibraryDialogOpen(false)
          setLibrarySearchQuery('')
          setLibraryPage(0)
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>从人设库导入角色</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* 搜索框 */}
            <TextField
              fullWidth
              placeholder="搜索人设库中的角色..."
              value={librarySearchQuery}
              onChange={(e) => {
                setLibrarySearchQuery(e.target.value)
                setLibraryPage(0)
              }}
            />

            {/* 角色列表 */}
            {libraryLoading ? (
              <Typography textAlign="center" py={4}>
                加载中...
              </Typography>
            ) : (
              <>
                <Grid2 container spacing={2}>
                  {libraryCharacters
                    .filter((char) => char.name.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                    .slice(libraryPage * rowsPerPage, libraryPage * rowsPerPage + rowsPerPage)
                    .map((character) => (
                      <Grid2 key={character.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {character.name}
                          </Typography>
                          {character.basic_info?.gender && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              性别: {character.basic_info.gender}
                            </Typography>
                          )}
                          {character.basic_info?.age && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              年龄: {character.basic_info.age}
                            </Typography>
                          )}
                          {character.basic_info?.occupation && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              职业: {character.basic_info.occupation}
                            </Typography>
                          )}
                          {character.personality?.traits && Array.isArray(character.personality.traits) && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 2,
                              }}
                            >
                              性格: {character.personality.traits.join(', ')}
                            </Typography>
                          )}
                          <Box sx={{ mt: 'auto' }}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="small"
                              onClick={() => handleImportCharacter(character)}
                              disabled={importing}
                            >
                              {importing ? '导入中...' : '导入'}
                            </Button>
                          </Box>
                        </Box>
                      </Grid2>
                    ))}
                </Grid2>

                {/* 分页 */}
                {libraryCharacters.filter((char) =>
                  char.name.toLowerCase().includes(librarySearchQuery.toLowerCase())
                ).length > rowsPerPage && (
                  <Stack direction="row" justifyContent="center" spacing={2} alignItems="center">
                    <Button
                      disabled={libraryPage === 0}
                      onClick={() => setLibraryPage((prev) => prev - 1)}
                    >
                      上一页
                    </Button>
                    <Typography variant="body2">
                      第 {libraryPage + 1} 页 / 共{' '}
                      {Math.ceil(
                        libraryCharacters.filter((char) =>
                          char.name.toLowerCase().includes(librarySearchQuery.toLowerCase())
                        ).length / rowsPerPage
                      )}{' '}
                      页
                    </Typography>
                    <Button
                      disabled={
                        libraryPage >=
                        Math.ceil(
                          libraryCharacters.filter((char) =>
                            char.name.toLowerCase().includes(librarySearchQuery.toLowerCase())
                          ).length / rowsPerPage
                        ) -
                          1
                      }
                      onClick={() => setLibraryPage((prev) => prev + 1)}
                    >
                      下一页
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setLibraryDialogOpen(false)
              setLibrarySearchQuery('')
              setLibraryPage(0)
            }}
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>

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
