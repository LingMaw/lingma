/**
 * 角色关系图谱页面
 * 展示项目中所有角色的关系网络
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Drawer,
  Stack,
  Chip,
  Divider,
  alpha,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import GraphContainer from '../components/graph/GraphContainer'
import { characterAPI } from '../api'
import type { Character, CharacterRelation } from '../types'

const CharacterGraphPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  const [characters, setCharacters] = useState<Character[]>([])
  const [relations, setRelations] = useState<CharacterRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 使用新的API直接获取角色和关系数据
        const graphData = await characterAPI.getAllWithRelations(
          projectId ? Number(projectId) : undefined
        )

        // 转换图数据格式
        const characters: Character[] = graphData.nodes.map((node) => ({
          id: node.id,
          name: node.name,
          basic_info: { category: node.category },
          background: {},
          personality: {},
          abilities: {},
          created_at: '',
          updated_at: '',
        }))

        const relations: CharacterRelation[] = graphData.links.map((link, index) => ({
          id: index + 1,
          source_character_id: link.source,
          target_character_id: link.target,
          relation_type: link.relation_type,
          strength: link.strength,
          description: link.description,
          is_bidirectional: false,
          created_at: '',
          updated_at: '',
        }))

        setCharacters(characters)
        setRelations(relations)
      } catch (error) {
        console.error('Failed to load graph data', error)
      }
      setLoading(false)
    }

    loadData()
  }, [projectId])

  // 节点点击处理
  const handleNodeClick = (characterId: number) => {
    const character = characters.find((c) => c.id === characterId)
    if (character) {
      setSelectedCharacter(character)
      setDrawerOpen(true)
    }
  }

  // 边点击处理
  const handleEdgeClick = (relationId: number) => {
    // 可以显示关系详情弹窗
    console.log('Relation clicked:', relationId)
  }

  // 导出图谱
  const handleExport = async () => {
    const graphElement = document.querySelector('.react-flow') as HTMLElement
    if (!graphElement) return

    try {
      const dataUrl = await toPng(graphElement, {
        backgroundColor: theme.palette.background.default,
        quality: 1.0,
      })

      const link = document.createElement('a')
      link.download = `character-graph-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export graph', error)
    }
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
      }}
    >
      {/* 顶部工具栏 */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ padding: 2, paddingX: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate(-1)} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              角色关系图谱
            </Typography>
            {projectId && (
              <Chip label={`项目 #${projectId}`} size="small" color="primary" variant="outlined" />
            )}
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
            >
              导出图谱
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 图谱容器 */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              加载中...
            </Typography>
          </Box>
        ) : (
          <GraphContainer
            characters={characters}
            relations={relations}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
          />
        )}
      </Box>

      {/* 角色详情侧边栏 */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 400,
            padding: 3,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        {selectedCharacter && (
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={600}>
                  {selectedCharacter.name}
                </Typography>
                <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                  <ArrowBackIcon />
                </IconButton>
              </Stack>
            </Box>

            <Divider />

            {/* 基本信息 */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ marginBottom: 1 }}>
                基本信息
              </Typography>
              <Stack spacing={1}>
                {selectedCharacter.basic_info?.age && (
                  <Typography variant="body2">
                    年龄: {selectedCharacter.basic_info.age}
                  </Typography>
                )}
                {selectedCharacter.basic_info?.gender && (
                  <Typography variant="body2">
                    性别: {selectedCharacter.basic_info.gender}
                  </Typography>
                )}
                {selectedCharacter.basic_info?.occupation && (
                  <Typography variant="body2">
                    职业: {selectedCharacter.basic_info.occupation}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* 性格特征 */}
            {selectedCharacter.personality?.traits && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ marginBottom: 1 }}>
                  性格特征
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(selectedCharacter.personality.traits as string[]).map((trait, index) => (
                    <Chip key={index} label={trait} size="small" />
                  ))}
                </Stack>
              </Box>
            )}

            {/* 备注 */}
            {selectedCharacter.notes && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ marginBottom: 1 }}>
                  备注
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCharacter.notes}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Drawer>
    </Box>
  )
}

export default CharacterGraphPage
