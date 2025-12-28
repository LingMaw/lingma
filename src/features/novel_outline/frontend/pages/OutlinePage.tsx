/**
 * 大纲页面
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  IconButton,
  Chip,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  FolderOutlined,
  ArticleOutlined,
  SubdirectoryArrowRight,
  ExpandMore,
  ChevronRight,
  ArrowBack,
  AutoAwesome as AIIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/frontend/core/animation'

import { outlineAPI } from '../api'
import type { OutlineNodeResponse, OutlineTreeNode, NodeType } from '../types'
import OutlineNodeEditor from '../components/OutlineNodeEditor'
import AIOutlineGenerator from '../components/AIOutlineGenerator'
import ContinueOutlineGenerator from '../components/ContinueOutlineGenerator'

export default function OutlinePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<OutlineNodeResponse[]>([])
  const [treeData, setTreeData] = useState<OutlineTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<OutlineNodeResponse | null>(null)
  const [parentNode, setParentNode] = useState<OutlineNodeResponse | null>(null)
  const [creatingType, setCreatingType] = useState<NodeType | null>(null)
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false)
  const [continueGeneratorOpen, setContinueGeneratorOpen] = useState(false)

  // 加载大纲节点
  useEffect(() => {
    if (projectId) {
      loadNodes()
    }
  }, [projectId])

  // 构建树状结构
  useEffect(() => {
    const tree = buildTree(nodes)
    setTreeData(tree)
  }, [nodes])

  const loadNodes = async () => {
    try {
      setLoading(true)
      const data = await outlineAPI.getNodes(Number(projectId))
      setNodes(data)
      
      // 初始化展开状态
      const initialExpanded = new Set<number>()
      data.forEach((node) => {
        if (node.is_expanded) {
          initialExpanded.add(node.id)
        }
      })
      setExpandedIds(initialExpanded)
    } catch (error) {
      console.error('加载大纲失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 构建树状结构
  const buildTree = (flatNodes: OutlineNodeResponse[]): OutlineTreeNode[] => {
    const nodeMap = new Map<number, OutlineTreeNode>()
    const roots: OutlineTreeNode[] = []

    // 创建节点映射
    flatNodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    // 构建树
    flatNodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!
      if (node.parent_id === null) {
        roots.push(treeNode)
      } else {
        const parent = nodeMap.get(node.parent_id)
        if (parent) {
          parent.children.push(treeNode)
        }
      }
    })

    return roots
  }

  // 切换展开状态
  const toggleExpand = async (nodeId: number) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedIds(newExpanded)

    // 更新后端
    try {
      await outlineAPI.updateNode(nodeId, { is_expanded: newExpanded.has(nodeId) })
    } catch (error) {
      console.error('更新展开状态失败:', error)
    }
  }

  // 创建节点
  const handleCreate = (type: NodeType, parent: OutlineNodeResponse | null) => {
    setCreatingType(type)
    setParentNode(parent)
    setEditingNode(null)
    setEditorOpen(true)
  }

  // 编辑节点
  const handleEdit = (node: OutlineNodeResponse) => {
    setEditingNode(node)
    setParentNode(null)
    setCreatingType(null)
    setEditorOpen(true)
  }

  // 删除节点
  const handleDelete = async (nodeId: number) => {
    if (!confirm('确定删除此节点及其所有子节点吗?')) return

    try {
      await outlineAPI.deleteNode(nodeId)
      await loadNodes()
    } catch (error) {
      console.error('删除节点失败:', error)
    }
  }

  // 保存节点(创建或更新)
  const handleSave = async () => {
    setEditorOpen(false)
    await loadNodes()
  }

  // AI生成完成后自动刷新
  const handleAIGenerateComplete = async () => {
    await loadNodes()
  }

  // AI续写完成后自动刷新
  const handleContinueComplete = async () => {
    await loadNodes()
  }

  // 导出功能
  const handleExportMarkdown = async () => {
    try {
      await outlineAPI.exportMarkdown(Number(projectId))
    } catch (error) {
      console.error('导出Markdown失败:', error)
    }
  }

  const handleExportJSON = async () => {
    try {
      await outlineAPI.downloadJSON(Number(projectId))
    } catch (error) {
      console.error('导出JSON失败:', error)
    }
  }

  // 渲染节点图标
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'volume':
        return <FolderOutlined fontSize="small" />
      case 'chapter':
        return <ArticleOutlined fontSize="small" />
      case 'section':
        return <SubdirectoryArrowRight fontSize="small" />
    }
  }

  // 获取节点类型标签
  const getNodeTypeLabel = (type: NodeType) => {
    switch (type) {
      case 'volume':
        return '卷'
      case 'chapter':
        return '章'
      case 'section':
        return '节'
    }
  }

  // 渲染树节点
  const renderNode = (node: OutlineTreeNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id)
    const hasChildren = node.children.length > 0

    return (
      <Box key={node.id} sx={{ ml: level * 3 }}>
        <Paper
          component={motion.div}
          variants={itemVariants}
          sx={{
            p: 1.5,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.action.hover, 0.1),
            },
          }}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren && (
            <IconButton size="small" onClick={() => toggleExpand(node.id)}>
              {isExpanded ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 40 }} />}

          {/* 节点图标 */}
          <Box sx={{ color: 'text.secondary' }}>{getNodeIcon(node.node_type)}</Box>

          {/* 节点信息 */}
          <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {node.title}
            </Typography>
            <Chip
              label={getNodeTypeLabel(node.node_type)}
              size="small"
              color={
                node.node_type === 'volume'
                  ? 'primary'
                  : node.node_type === 'chapter'
                    ? 'secondary'
                    : 'default'
              }
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Stack>

          {/* 操作按钮 */}
          <Stack direction="row" spacing={0.5}>
            {/* 添加子节点按钮 */}
            {node.node_type !== 'section' && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  handleCreate(
                    node.node_type === 'volume' ? 'chapter' : 'section',
                    node
                  )
                }
              >
                添加{node.node_type === 'volume' ? '章' : '节'}
              </Button>
            )}

            <Button size="small" onClick={() => handleEdit(node)}>
              编辑
            </Button>
            <Button size="small" color="error" onClick={() => handleDelete(node.id)}>
              删除
            </Button>
          </Stack>
        </Paper>

        {/* 渲染子节点 */}
        {isExpanded && hasChildren && (
          <Box>{node.children.map((child) => renderNode(child, level + 1))}</Box>
        )}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    )
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      sx={{ p: 3 }}
    >
      {/* 标题栏 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/novel_projects/${projectId}`)}
            sx={{ borderRadius: 2 }}
          >
            返回
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            大纲结构
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {/* AI生成按钮 */}
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiGeneratorOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            AI生成大纲
          </Button>
          
          {/* AI续写按钮 */}
          {treeData.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={() => setContinueGeneratorOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              AI续写大纲
            </Button>
          )}
          
          {/* 导出按钮 */}
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportMarkdown}
            sx={{ borderRadius: 2 }}
          >
            导出Markdown
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportJSON}
            sx={{ borderRadius: 2 }}
          >
            导出JSON
          </Button>
          
          {/* 添加卷按钮 */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreate('volume', null)}
            sx={{ borderRadius: 2 }}
          >
            添加卷
          </Button>
        </Stack>
      </Stack>

      {/* 大纲树 */}
      {treeData.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
          }}
        >
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            还没有大纲节点，点击上方按钮创建第一个卷
          </Typography>
        </Paper>
      ) : (
        <Stack component={motion.div} variants={containerVariants} spacing={0}>
          {treeData.map((node) => renderNode(node))}
        </Stack>
      )}

      {/* 编辑器对话框 */}
      <OutlineNodeEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        projectId={Number(projectId)}
        editingNode={editingNode}
        parentNode={parentNode}
        nodeType={creatingType}
      />

      {/* AI生成对话框 */}
      <AIOutlineGenerator
        open={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        onComplete={handleAIGenerateComplete}
        projectId={Number(projectId)}
      />

      {/* AI续写对话框 */}
      <ContinueOutlineGenerator
        open={continueGeneratorOpen}
        onClose={() => setContinueGeneratorOpen(false)}
        onComplete={handleContinueComplete}
        projectId={Number(projectId)}
        hasExistingOutline={treeData.length > 0}
      />
    </Box>
  )
}
