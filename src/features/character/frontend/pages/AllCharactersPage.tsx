/**
 * 全部角色展示页面
 * 展示系统中所有角色信息及关系网络
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
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  Search as SearchIcon,
  Person as PersonIcon,
  AccountTree as RelationIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants, pageVariants } from '@/frontend/core/animation'
import { characterAPI, characterTemplateAPI } from '@/features/character/frontend/api'
import type { Character, CharacterTemplate, RelationGraphData, RelationGraphLink, RelationGraphNode } from '@/features/character/frontend/types'

// 视图模式
type ViewMode = 'grid' | 'relations'

export default function AllCharactersPage() {
  const navigate = useNavigate()
  const theme = useTheme()

  const [characters, setCharacters] = useState<Character[]>([])
  const [graphData, setGraphData] = useState<RelationGraphData | null>(null)
  const [templates, setTemplates] = useState<CharacterTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<number | null>(null)

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
      const [charactersData, graphDataResult] = await Promise.all([
        characterAPI.list(undefined, true),
        characterAPI.getAllWithRelations(),
      ])
      setCharacters(charactersData)
      setGraphData(graphDataResult)
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

  // 过滤角色
  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !categoryFilter || char.basic_info?.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [characters, searchQuery, categoryFilter])

  // 过滤关系图数据
  const filteredGraphData = useMemo(() => {
    if (!graphData || !categoryFilter) return graphData
    
    // 获取符合分类的节点
    const filteredNodes = graphData.nodes.filter(node => {
      const char = characters.find(c => c.id === node.id)
      return char && char.basic_info?.category === categoryFilter
    })
    
    // 获取涉及这些节点的关系
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id))
    const filteredLinks = graphData.links.filter(link => 
      filteredNodeIds.has(link.source) || filteredNodeIds.has(link.target)
    )
    
    return {
      nodes: filteredNodes,
      links: filteredLinks,
    }
  }, [graphData, categoryFilter, characters])

  // 获取角色的关系数量
  const getRelationCount = (characterId: number) => {
    if (!graphData) return 0
    return graphData.links.filter(
      (link) => link.source === characterId || link.target === characterId
    ).length
  }

  // 获取角色的关系列表
  const getCharacterRelations = (characterId: number) => {
    if (!graphData) return []
    return graphData.links.filter(
      (link) => link.source === characterId || link.target === characterId
    )
  }


  // 渲染关系网络视图
  const renderRelationsView = () => {
    const displayGraphData = categoryFilter ? filteredGraphData : graphData
    
    if (!displayGraphData || displayGraphData.nodes.length === 0) {
      return (
        <Box 
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{ 
            textAlign: 'center', 
            py: 12,
            px: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            }}
          >
            <RelationIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            暂无角色关系数据
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            创建角色并添加关系后，关系网络将在这里展示
          </Typography>
        </Box>
      )
    }

    // 计算关系密度（用于统计卡片）
    const avgRelations = displayGraphData.nodes.length > 0 
      ? (displayGraphData.links.length * 2 / displayGraphData.nodes.length).toFixed(1) 
      : '0'

    return (
      <Stack spacing={4}>
        {/* 关系统计仪表盘 */}
        <Grid2 container spacing={3}>
          {/* 角色总数 */}
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{
                borderRadius: 4,
                backdropFilter: 'blur(20px)',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: alpha(theme.palette.primary.main, 0.1),
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                    }}
                  >
                    <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {displayGraphData.nodes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      角色总数
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>

          {/* 关系总数 */}
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              sx={{
                borderRadius: 4,
                backdropFilter: 'blur(20px)',
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: alpha(theme.palette.secondary.main, 0.1),
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                      boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.4)}`,
                    }}
                  >
                    <RelationIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="secondary.main">
                      {displayGraphData.links.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      关系总数
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>

          {/* 平均关系数 */}
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              sx={{
                borderRadius: 4,
                backdropFilter: 'blur(20px)',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: alpha(theme.palette.success.main, 0.1),
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`,
                    }}
                  >
                    <FilterIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {avgRelations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      平均关系数
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* 角色关系列表 */}
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RelationIcon fontSize="small" color="primary" />
            角色关系网络
          </Typography>
          <Grid2
            container
            spacing={3}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {displayGraphData.nodes.map((node, index) => (
              <Grid2 key={node.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <RelationCard
                  node={node}
                  relations={getCharacterRelations(node.id)}
                  characters={characters}
                  isSelected={selectedNode === node.id}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  onViewDetail={() => navigate(`/characters/${node.id}`)}
                  index={index}
                />
              </Grid2>
            ))}
          </Grid2>
        </Box>
      </Stack>
    )
  }

  return (
    <Container
      maxWidth="xl"
      component={motion.div}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      sx={{ py: 4 }}
    >
      {/* 页面标题 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            角色人设库
          </Typography>
          <Typography variant="body2" color="text.secondary">
            查看和管理系统中的所有角色及其关系网络
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          创建角色
        </Button>
      </Stack>

      {/* 工具栏 */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            {/* 搜索和视图切换 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="搜索角色..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Tabs
                value={viewMode}
                onChange={(_, v) => setViewMode(v)}
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': { minHeight: 40, py: 1 },
                }}
              >
                <Tab icon={<PersonIcon />} iconPosition="start" label="卡片视图" value="grid" />
                <Tab icon={<RelationIcon />} iconPosition="start" label="关系视图" value="relations" />
              </Tabs>
            </Stack>

            {/* 分类筛选 */}
            {categories.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <FilterIcon fontSize="small" color="action" />
                <Chip
                  label="全部"
                  size="small"
                  variant={categoryFilter === null ? 'filled' : 'outlined'}
                  color={categoryFilter === null ? 'primary' : 'default'}
                  onClick={() => setCategoryFilter(null)}
                  sx={{ cursor: 'pointer' }}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    variant={categoryFilter === cat ? 'filled' : 'outlined'}
                    color={categoryFilter === cat ? 'primary' : 'default'}
                    onClick={() => setCategoryFilter(cat)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 主内容区 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">加载中...</Typography>
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {filteredCharacters.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {searchQuery || categoryFilter ? '未找到匹配的角色' : '暂无角色数据'}
                  </Typography>
                </Box>
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
                      <CharacterCardWithRelations
                        character={character}
                        relationCount={getRelationCount(character.id)}
                        onClick={() => navigate(`/characters/${character.id}`)}
                      />
                    </Grid2>
                  ))}
                </Grid2>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="relations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderRelationsView()}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {/* 创建角色对话框 */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>创建新角色</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="角色名称"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            
            {templates.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  选择模板（可选）:
                </Typography>
                <Grid2 container spacing={2}>
                  {templates.map((template) => (
                    <Grid2 key={template.id} size={{ xs: 12, sm: 6 }}>
                      <Box
                        onClick={() => setSelectedTemplate(
                          selectedTemplate?.id === template.id ? null : template
                        )}
                        sx={{
                          p: 2,
                          border: '2px solid',
                          borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: selectedTemplate?.id === template.id 
                            ? alpha(theme.palette.primary.main, 0.08) 
                            : 'transparent',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          {template.name}
                        </Typography>
                        {template.category && (
                          <Chip 
                            label={template.category} 
                            size="small" 
                            sx={{ mt: 0.5, borderRadius: 1 }} 
                          />
                        )}
                        {template.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ mt: 1 }}
                          >
                            {template.description}
                          </Typography>
                        )}
                      </Box>
                    </Grid2>
                  ))}
                </Grid2>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseCreateDialog} disabled={creating}>
            取消
          </Button>
          <Button
            onClick={selectedTemplate ? handleCreateFromTemplate : handleCreateBlank}
            variant="contained"
            disabled={!newCharacterName.trim() || creating}
          >
            {creating ? '创建中...' : selectedTemplate ? '从模板创建' : '创建空白角色'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

// 带关系数量的角色卡片
interface CharacterCardWithRelationsProps {
  character: Character
  relationCount: number
  onClick: () => void
}

function CharacterCardWithRelations({ character, relationCount, onClick }: CharacterCardWithRelationsProps) {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        {/* 头部 */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1 }}>
            {character.name}
          </Typography>
          {character.basic_info?.category && (
            <Chip
              label={character.basic_info.category}
              size="small"
              sx={{ borderRadius: 2, fontWeight: 500 }}
            />
          )}
        </Stack>

        {/* 基本信息 */}
        <Stack spacing={1} mb={2}>
          {character.basic_info?.gender && (
            <Typography variant="body2" color="text.secondary">
              性别: {character.basic_info.gender}
            </Typography>
          )}
          {character.basic_info?.age && (
            <Typography variant="body2" color="text.secondary">
              年龄: {character.basic_info.age}
            </Typography>
          )}
          {character.basic_info?.occupation && (
            <Typography variant="body2" color="text.secondary">
              职业: {character.basic_info.occupation}
            </Typography>
          )}
        </Stack>

        {/* 底部信息 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {new Date(character.created_at).toLocaleDateString()}
          </Typography>
          <Tooltip title="关系数量">
            <Chip
              icon={<RelationIcon sx={{ fontSize: 16 }} />}
              label={relationCount}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  )
}

// 关系类型颜色映射
const relationTypeColors: Record<string, string> = {
  '朋友': '#4CAF50',
  '敌人': '#F44336',
  '家人': '#FF9800',
  '恋人': '#E91E63',
  '同事': '#2196F3',
  '师生': '#9C27B0',
  '对手': '#FF5722',
  '盟友': '#00BCD4',
}

// 获取关系类型颜色
const getRelationColor = (relationType: string, theme: ReturnType<typeof useTheme>) => {
  return relationTypeColors[relationType] || theme.palette.primary.main
}

// 关系卡片组件
interface RelationCardProps {
  node: RelationGraphNode
  relations: RelationGraphLink[]
  characters: Character[]
  isSelected: boolean
  onClick: () => void
  onViewDetail: () => void
  index: number
}

function RelationCard({ node, relations, characters, isSelected, onClick, onViewDetail }: RelationCardProps) {
  const theme = useTheme()

  const getCharacterName = (id: number) => {
    return characters.find((c) => c.id === id)?.name || '未知'
  }

  // 根据关系数量计算影响力等级
  const influenceLevel = relations.length >= 5 ? '核心' : relations.length >= 3 ? '重要' : relations.length >= 1 ? '普通' : '孤立'
  const influenceColor = relations.length >= 5 ? 'error' : relations.length >= 3 ? 'warning' : relations.length >= 1 ? 'info' : 'default'

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      onClick={onClick}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      sx={{
        cursor: 'pointer',
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        background: isSelected 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`
          : alpha(theme.palette.background.paper, 0.85),
        border: `1px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
        boxShadow: isSelected 
          ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}` 
          : `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        },
      }}
    >
      {/* 顶部装饰条 */}
      <Box
        sx={{
          height: 4,
          background: isSelected
            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.3)}, ${alpha(theme.palette.secondary.main, 0.3)})`,
        }}
      />

      <CardContent sx={{ pt: 2.5 }}>
        {/* 头部 */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* 头像占位 */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <PersonIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                {node.name}
              </Typography>
              {node.category && (
                <Chip 
                  label={node.category} 
                  size="small" 
                  sx={{ 
                    mt: 0.5, 
                    height: 20, 
                    fontSize: 11,
                    borderRadius: 1.5,
                    background: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    fontWeight: 500,
                  }} 
                />
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip
              label={influenceLevel}
              size="small"
              color={influenceColor as 'error' | 'warning' | 'info' | 'default'}
              sx={{ 
                height: 22, 
                fontSize: 11, 
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            />
            <Tooltip title="查看详情">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetail()
                }}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  },
                }}
              >
                <ViewIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* 关系统计 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            py: 1,
            px: 1.5,
            borderRadius: 2,
            background: alpha(theme.palette.action.hover, 0.4),
          }}
        >
          <RelationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            关系网络
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={`${relations.length} 个关系`}
            size="small"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 600,
              background: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          />
        </Box>

        {/* 关系列表 */}
        <Box>
          {relations.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 3,
                px: 2,
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                background: alpha(theme.palette.action.hover, 0.2),
              }}
            >
              <Typography variant="body2" color="text.disabled">
                暂无关系连接
              </Typography>
            </Box>
          ) : (
            <Stack 
              spacing={1} 
              sx={{ 
                maxHeight: isSelected ? 280 : 160, 
                overflow: 'auto',
                pr: 0.5,
                '&::-webkit-scrollbar': {
                  width: 4,
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: 2,
                },
              }}
            >
              <AnimatePresence>
                {relations.slice(0, isSelected ? undefined : 3).map((rel, idx) => {
                  const isSource = rel.source === node.id
                  const otherName = getCharacterName(isSource ? rel.target : rel.source)
                  const relationColor = getRelationColor(rel.relation_type, theme)

                  return (
                    <Box
                      component={motion.div}
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1,
                        px: 1.5,
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${alpha(relationColor, 0.08)} 0%, transparent 100%)`,
                        border: `1px solid ${alpha(relationColor, 0.15)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: `linear-gradient(90deg, ${alpha(relationColor, 0.15)} 0%, ${alpha(relationColor, 0.05)} 100%)`,
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      {/* 关系类型标签 */}
                      <Chip
                        label={rel.relation_type}
                        size="small"
                        sx={{ 
                          fontSize: 11, 
                          height: 22, 
                          fontWeight: 600,
                          borderRadius: 1.5,
                          background: alpha(relationColor, 0.15),
                          color: relationColor,
                          border: `1px solid ${alpha(relationColor, 0.3)}`,
                          minWidth: 48,
                        }}
                      />

                      {/* 方向指示器 */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: alpha(relationColor, 0.1),
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: relationColor,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {rel.source === rel.target ? '⟷' : isSource ? '→' : '←'}
                        </Typography>
                      </Box>

                      {/* 对方角色名 */}
                      <Typography 
                        variant="body2" 
                        fontWeight={600} 
                        noWrap 
                        sx={{ 
                          flex: 1,
                          color: 'text.primary',
                        }}
                      >
                        {otherName}
                      </Typography>

                      {/* 关系强度条 */}
                      <Tooltip title={`关系强度: ${rel.strength}/10`} placement="top">
                        <Box
                          sx={{
                            width: 50,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(relationColor, 0.15),
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <Box
                            component={motion.div}
                            initial={{ width: 0 }}
                            animate={{ width: `${rel.strength * 10}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            sx={{
                              height: '100%',
                              background: `linear-gradient(90deg, ${relationColor}, ${alpha(relationColor, 0.7)})`,
                              borderRadius: 3,
                            }}
                          />
                        </Box>
                      </Tooltip>
                    </Box>
                  )
                })}
              </AnimatePresence>

              {/* 查看更多提示 */}
              {!isSelected && relations.length > 3 && (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  sx={{
                    textAlign: 'center',
                    py: 1,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, 0.05),
                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    fontWeight={600}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                  >
                    点击展开查看全部 {relations.length} 个关系
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
