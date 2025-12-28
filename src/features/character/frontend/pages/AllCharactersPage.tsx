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
  TextField,
  Stack,
  Alert,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Skeleton,
  IconButton,
  Tooltip,
  Fade,
  Tabs,
  Tab,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  Search as SearchIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  WorkOutline as WorkIcon,
  CalendarMonth as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Transgender as TransgenderIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants, pageVariants, scaleVariants } from '@/frontend/core/animation'
import { characterAPI, characterTemplateAPI } from '@/features/character/frontend/api'
import { novelProjectAPI } from '@/features/novel_project/frontend/api'
import type { Character, CharacterTemplate } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

// 性别图标组件
function GenderIcon({ gender }: { gender?: string }) {
  if (!gender) return null
  const lowerGender = gender.toLowerCase()
  if (lowerGender.includes('女') || lowerGender === 'female') {
    return <FemaleIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
  }
  if (lowerGender.includes('男') || lowerGender === 'male') {
    return <MaleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
  }
  return <TransgenderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
}

export default function AllCharactersPage() {
  const navigate = useNavigate()
  const theme = useTheme()

  const [characters, setCharacters] = useState<Character[]>([])
  const [templates, setTemplates] = useState<CharacterTemplate[]>([])
  const [projects, setProjects] = useState<Map<number, NovelProjectResponse>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [currentTab, setCurrentTab] = useState<'public' | 'project'>(0 as any)

  // 初始化标签页
  useEffect(() => {
    setCurrentTab('public')
  }, [])

  // 创建角色对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate | null>(null)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
    loadTemplates()
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

  // 创建空白角色
  const handleCreateBlank = async () => {
    if (!newCharacterName.trim()) return

    try {
      setCreating(true)
      const newChar = await characterAPI.create({
        name: newCharacterName,
      })
      setCreateDialogOpen(false)
      setNewCharacterName('')
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

    try {
      setCreating(true)
      const newChar = await characterAPI.create({
        name: newCharacterName,
        template_id: selectedTemplate.id,
      })
      setCreateDialogOpen(false)
      setNewCharacterName('')
      setSelectedTemplate(null)
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

      {/* 工具栏 - 更现代的搜索和筛选 */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        sx={{
          mb: 4,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5}>
            {/* 搜索框 - 增强视觉效果 */}
            <TextField
              placeholder="搜索角色名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              size="medium"
              fullWidth
              sx={{
                maxWidth: { xs: '100%', md: 480 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.default, 0.6),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: searchFocused ? 'primary.main' : 'text.secondary',
                        transition: 'color 0.2s ease',
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* 分类筛选 - 更好的视觉反馈 */}
            {categories.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Tooltip title="筛选分类">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    <FilterIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  </Box>
                </Tooltip>
                <Chip
                  label="全部"
                  size="small"
                  variant={categoryFilter === null ? 'filled' : 'outlined'}
                  color={categoryFilter === null ? 'primary' : 'default'}
                  onClick={() => setCategoryFilter(null)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 500,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    variant={categoryFilter === cat ? 'filled' : 'outlined'}
                    color={categoryFilter === cat ? 'primary' : 'default'}
                    onClick={() => setCategoryFilter(cat)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 500,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                      },
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

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
                <CardContent sx={{ p: 2.5 }}>
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
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      ) : currentTab === 'public' ? (
        // 公共角色标签页
        filteredCharacters.length === 0 ? (
          // 空状态
          <Fade in timeout={500}>
            <Box
              sx={{
                textAlign: 'center',
                py: { xs: 6, md: 10 },
                px: 3,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                }}
              >
                <PersonIcon sx={{ fontSize: 56, color: alpha(theme.palette.primary.main, 0.5) }} />
              </Box>
              <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
                {searchQuery || categoryFilter ? '未找到匹配的公共角色' : '暂无公共角色'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                {searchQuery || categoryFilter
                  ? '尝试调整搜索条件或清除筛选'
                  : '公共角色可以在所有项目中使用。点击「创建角色」创建公共角色。'}
              </Typography>
              {!searchQuery && !categoryFilter && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{ borderRadius: 3 }}
                >
                  创建角色
                </Button>
              )}
            </Box>
          </Fade>
        ) : (
          <Grid2
            container
            spacing={{ xs: 2, sm: 2.5, md: 3 }}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredCharacters.map((character) => (
              <Grid2 key={character.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <CharacterCard
                  character={character}
                  project={character.project_id ? projects.get(character.project_id) : undefined}
                  onClick={() => navigate(`/characters/${character.id}`)}
                />
              </Grid2>
            ))}
          </Grid2>
        )
      ) : (
        // 项目专属标签页
        projectCharactersGrouped.size === 0 || filteredCharacters.length === 0 ? (
          // 空状态
          <Fade in timeout={500}>
            <Box
              sx={{
                textAlign: 'center',
                py: { xs: 6, md: 10 },
                px: 3,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                }}
              >
                <PersonIcon sx={{ fontSize: 56, color: alpha(theme.palette.primary.main, 0.5) }} />
              </Box>
              <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
                {searchQuery || categoryFilter ? '未找到匹配的项目角色' : '暂无项目专属角色'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                {searchQuery || categoryFilter
                  ? '尝试调整搜索条件或清除筛选'
                  : '项目专属角色仅在特定项目中可用。在项目详情页创建专属角色。'}
              </Typography>
            </Box>
          </Fade>
        ) : (
          // 按项目分组显示
          <Stack spacing={4}>
            {Array.from(projectCharactersGrouped.entries())
              .filter(([projectId]) => {
                // 过滤出包含符合搜索条件的角色的项目组
                const projectChars = projectCharactersGrouped.get(projectId) || []
                return projectChars.some((char) => filteredCharacters.includes(char))
              })
              .map(([projectId, projectChars]) => {
                const project = projects.get(projectId)
                const visibleChars = projectChars.filter((char) => filteredCharacters.includes(char))

                return (
                  <Box
                    key={projectId}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* 项目标题 */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        mb: 3,
                        pb: 2,
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 4,
                          height: 32,
                          borderRadius: 2,
                          background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.6)} 100%)`,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {project ? project.title : `项目 #${projectId}`}
                        </Typography>
                        {project?.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {project.description}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={`${visibleChars.length} 个角色`}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          fontWeight: 500,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      />
                    </Stack>

                    {/* 角色网格 */}
                    <Grid2
                      container
                      spacing={{ xs: 2, sm: 2.5, md: 3 }}
                      component={motion.div}
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {visibleChars.map((character) => (
                        <Grid2 key={character.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                          <CharacterCard
                            character={character}
                            project={project}
                            onClick={() => navigate(`/characters/${character.id}`)}
                          />
                        </Grid2>
                      ))}
                    </Grid2>
                  </Box>
                )
              })}
          </Stack>
        )
      )}
      {/* 创建角色对话框 - 现代化样式 */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
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
                创建新角色
              </Typography>
              <Typography variant="caption" color="text.secondary">
                为你的故事添加独特的角色
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleCloseCreateDialog} size="small" sx={{ opacity: 0.6 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="角色名称"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
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
                          setSelectedTemplate(
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
            onClick={handleCloseCreateDialog}
            disabled={creating}
            sx={{ borderRadius: 2.5, px: 2.5 }}
          >
            取消
          </Button>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={selectedTemplate ? handleCreateFromTemplate : handleCreateBlank}
            variant="contained"
            disabled={!newCharacterName.trim() || creating}
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
    </Container>
  )
}

// 角色卡片组件 - 增强版
interface CharacterCardProps {
  character: Character
  project?: NovelProjectResponse
  onClick: () => void
}

function CharacterCard({ character, project, onClick }: CharacterCardProps) {
  const theme = useTheme()
  const hasBasicInfo =
    character.basic_info?.gender ||
    character.basic_info?.age ||
    character.basic_info?.occupation

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      whileHover={{
        y: -6,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          '& .card-accent': {
            opacity: 1,
          },
        },
      }}
    >
      {/* 顶部装饰条 */}
      <Box
        className="card-accent"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      <CardContent sx={{ p: 2.5 }}>
        {/* 头部 */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              noWrap
              sx={{
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {character.name}
            </Typography>
            {/* 显示项目名称 */}
            {project && (
              <Chip
                label={project.title}
                size="small"
                icon={<PersonIcon sx={{ fontSize: 14 }} />}
                sx={{
                  mt: 0.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  height: 20,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: 'secondary.main',
                  border: 'none',
                  '& .MuiChip-icon': {
                    fontSize: 14,
                    color: 'secondary.main',
                  },
                }}
              />
            )}
          </Box>
          {character.basic_info?.category && (
            <Chip
              label={character.basic_info.category}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 24,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                border: 'none',
              }}
            />
          )}
        </Stack>

        {/* 基本信息 - 使用图标增强 */}
        {hasBasicInfo ? (
          <Stack spacing={1} mb={2}>
            {character.basic_info?.gender && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <GenderIcon gender={character.basic_info.gender} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                  {character.basic_info.gender}
                </Typography>
              </Stack>
            )}
            {character.basic_info?.age && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                  {character.basic_info.age}
                </Typography>
              </Stack>
            )}
            {character.basic_info?.occupation && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <WorkIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ lineHeight: 1 }}
                >
                  {character.basic_info.occupation}
                </Typography>
              </Stack>
            )}
          </Stack>
        ) : (
          <Box
            sx={{
              py: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.disabled">
              点击编辑角色信息
            </Typography>
          </Box>
        )}

        {/* 底部信息 - 更好的布局 */}
        <Box
          sx={{
            pt: 1.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <CalendarIcon sx={{ fontSize: 12 }} />
            创建于 {new Date(character.created_at).toLocaleDateString('zh-CN')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

