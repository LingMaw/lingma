/**
 * 全部角色展示页面
 * 展示系统中所有角色信息
 */

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Stack,
  Alert,
  Chip,
  Card,
  Button,
  alpha,
  useTheme,
  Skeleton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  Person as PersonIcon,
  Add as AddIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, scaleVariants } from '@/frontend/core/animation'
import { characterAPI, characterTemplateAPI } from '@/features/character/frontend/api'
import { novelProjectAPI } from '@/features/novel_project/frontend/api'
import {
  CharacterSearchToolbar,
  CreateCharacterDialog,
  PublicCharacterList,
  ProjectCharacterList,
} from '@/features/character/frontend/components'
import type { Character, CharacterTemplate } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

export default function AllCharactersPage() {
  const navigate = useNavigate()
  const theme = useTheme()

  const [characters, setCharacters] = useState<Character[]>([])
  const [templates, setTemplates] = useState<CharacterTemplate[]>([])
  const [projects, setProjects] = useState<Map<number, NovelProjectResponse>>(new Map())
  const [allProjects, setAllProjects] = useState<NovelProjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState<'public' | 'project'>('public')

  // 创建角色对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate | null>(null)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
    loadTemplates()
    loadAllProjects()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const charactersData = await characterAPI.list(undefined, true)
      setCharacters(charactersData)
      
      // 加载角色关联的项目信息
      const projectIds = [...new Set(charactersData.map(c => c.project_id).filter(Boolean))] as number[]
      if (projectIds.length > 0) {
        const projectsMap = new Map<number, NovelProjectResponse>()
        await Promise.all(
          projectIds.map(async (id) => {
            try {
              const project = await novelProjectAPI.getProject(id)
              projectsMap.set(id, project)
            } catch (err) {
              console.error(`加载项目 ${id} 失败:`, err)
            }
          })
        )
        setProjects(projectsMap)
      }
    } catch (err) {
      setError('加载角色数据失败')
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

  // 加载所有项目（用于创建项目专属角色时选择）
  const loadAllProjects = async () => {
    try {
      const response = await novelProjectAPI.getProjects()
      setAllProjects(response.items || [])
    } catch (err) {
      console.error('加载项目列表失败:', err)
    }
  }

  // 创建空白角色
  const handleCreateBlank = async () => {
    if (!newCharacterName.trim()) return

    // 如果在项目专属标签页且未选择项目，提示错误
    if (currentTab === 'project' && !selectedProjectId) {
      setError('请选择一个项目')
      return
    }

    try {
      setCreating(true)
      const newChar = await characterAPI.create({
        name: newCharacterName,
        // 在公共角色标签页创建公共角色，在项目专属标签页创建项目角色
        project_id: currentTab === 'public' ? undefined : selectedProjectId || undefined,
      })
      setCreateDialogOpen(false)
      setNewCharacterName('')
      setSelectedProjectId(null)
      loadData()
      navigate(`/characters/${newChar.id}`)
    } catch (err) {
      setError('创建角色失败')
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  // 从模板创建角色
  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newCharacterName.trim()) return

    // 如果在项目专属标签页且未选择项目，提示错误
    if (currentTab === 'project' && !selectedProjectId) {
      setError('请选择一个项目')
      return
    }

    try {
      setCreating(true)
      const newChar = await characterAPI.create({
        name: newCharacterName,
        template_id: selectedTemplate.id,
        // 在公共角色标签页创建公共角色，在项目专属标签页创建项目角色
        project_id: currentTab === 'public' ? undefined : selectedProjectId || undefined,
      })
      setCreateDialogOpen(false)
      setNewCharacterName('')
      setSelectedTemplate(null)
      setSelectedProjectId(null)
      loadData()
      navigate(`/characters/${newChar.id}`)
    } catch (err) {
      setError('创建角色失败')
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false)
    setNewCharacterName('')
    setSelectedTemplate(null)
    setSelectedProjectId(null)
  }

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set<string>()
    characters.forEach((char) => {
      const category = char.basic_info?.category
      if (category) cats.add(category)
    })
    return Array.from(cats)
  }, [characters])

  // 按标签页和搜索条件过滤角色
  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !categoryFilter || char.basic_info?.category === categoryFilter
      const matchesTab = currentTab === 'public' ? !char.project_id : !!char.project_id
      return matchesSearch && matchesCategory && matchesTab
    })
  }, [characters, searchQuery, categoryFilter, currentTab])

  // 公共角色
  const publicCharacters = useMemo(() => {
    return characters.filter((char) => !char.project_id)
  }, [characters])

  // 项目专属角色（按项目分组）
  const projectCharactersGrouped = useMemo(() => {
    const grouped = new Map<number, Character[]>()
    characters
      .filter((char) => char.project_id)
      .forEach((char) => {
        if (!char.project_id) return
        if (!grouped.has(char.project_id)) {
          grouped.set(char.project_id, [])
        }
        grouped.get(char.project_id)!.push(char)
      })
    return grouped
  }, [characters])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'public' | 'project') => {
    setCurrentTab(newValue)
    // 切换标签页时清空搜索和筛选
    setSearchQuery('')
    setCategoryFilter(null)
  }

  const handleCharacterClick = (characterId: number) => {
    navigate(`/characters/${characterId}`)
  }

  // 打开删除确认对话框
  const handleDeleteClick = (characterId: number) => {
    const char = characters.find((c) => c.id === characterId)
    if (char) {
      setCharacterToDelete(char)
      setDeleteDialogOpen(true)
    }
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!characterToDelete) return
    try {
      setDeleting(true)
      await characterAPI.delete(characterToDelete.id)
      setDeleteDialogOpen(false)
      setCharacterToDelete(null)
      loadData()
    } catch (err) {
      setError('删除角色失败')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Container
      maxWidth="xl"
      component={motion.div}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      sx={{ py: { xs: 2, sm: 3, md: 4 } }}
    >
      {/* 页面标题区域 - 增强视觉层次 */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <PersonIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  角色人设库
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  共 {characters.length} 个角色 · 创作精彩故事
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              component={motion.button}
              variants={scaleVariants}
              whileHover="hover"
              whileTap="tap"
              variant="outlined"
              startIcon={<AccountTreeIcon />}
              onClick={() => navigate('/characters/graph')}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              关系图谱
            </Button>
            <Button
              component={motion.button}
              variants={scaleVariants}
              whileHover="hover"
              whileTap="tap"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 3,
                fontWeight: 600,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              创建角色
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* 标签页导航 */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        sx={{
          mb: 3,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            px: { xs: 2, sm: 3 },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1" fontWeight={600}>
                  公共角色
                </Typography>
                <Chip
                  label={publicCharacters.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor:
                      currentTab === 'public'
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.text.secondary, 0.1),
                    color: currentTab === 'public' ? 'primary.main' : 'text.secondary',
                  }}
                />
              </Stack>
            }
            value="public"
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              py: 2,
            }}
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1" fontWeight={600}>
                  项目专属
                </Typography>
                <Chip
                  label={characters.filter((c) => c.project_id).length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor:
                      currentTab === 'project'
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.text.secondary, 0.1),
                    color: currentTab === 'project' ? 'primary.main' : 'text.secondary',
                  }}
                />
              </Stack>
            }
            value="project"
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              py: 2,
            }}
          />
        </Tabs>
      </Card>

      {/* 工具栏 - 搜索和筛选 */}
      <CharacterSearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      {/* 错误提示 - 更优雅的样式 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                mb: 3,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区 */}
      {loading ? (
        // 加载状态 - 骨架屏
        <Grid2 container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid2 key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="rounded" width={60} height={24} />
                    </Stack>
                    <Stack spacing={1}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="35%" />
                      <Skeleton variant="text" width="45%" />
                    </Stack>
                    <Skeleton variant="text" width="30%" />
                  </Stack>
                </Box>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      ) : currentTab === 'public' ? (
        // 公共角色标签页
        <PublicCharacterList
          characters={filteredCharacters}
          projects={projects}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          onCharacterClick={handleCharacterClick}
          onCharacterDelete={handleDeleteClick}
          onCreateClick={() => setCreateDialogOpen(true)}
        />
      ) : (
        // 项目专属标签页
        <ProjectCharacterList
          projectCharactersGrouped={projectCharactersGrouped}
          filteredCharacters={filteredCharacters}
          projects={projects}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          onCharacterClick={handleCharacterClick}
          onCharacterDelete={handleDeleteClick}
        />
      )}

      {/* 创建角色对话框 */}
      <CreateCharacterDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        templates={templates}
        newCharacterName={newCharacterName}
        onNameChange={setNewCharacterName}
        selectedTemplate={selectedTemplate}
        onTemplateSelect={setSelectedTemplate}
        creating={creating}
        onCreateBlank={handleCreateBlank}
        onCreateFromTemplate={handleCreateFromTemplate}
        currentTab={currentTab}
        allProjects={allProjects}
        selectedProjectId={selectedProjectId}
        onProjectSelect={setSelectedProjectId}
      />

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除角色「{characterToDelete?.name}」吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ borderRadius: 2 }}
          >
            {deleting ? '删除中' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
