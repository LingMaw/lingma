/*
 * 大纲编辑主页面 - 修复版 (移除拖拽，适配按钮排序)
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  alpha,
  useTheme,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
// 假设这是你的动画配置路径，如果报错请改为你的实际路径
import { pageVariants } from '@/frontend/core/animation' 
import { useOutlineTree } from '../hooks/useOutlineTree'
import { useOutlineNode } from '../hooks/useOutlineNode'
import OutlineTree from '../components/OutlineTree'
import OutlineNodeEditor from '../components/OutlineNodeEditor'
import OutlineGeneratorDialog from '../components/OutlineGeneratorDialog'
import GenerationProgressPanel from '../components/GenerationProgressPanel'
import type { OutlineNodeWithChildren, OutlineNodeCreate, OutlineNodeUpdate, OutlineGenerateRequest } from '../api'
import { outlineAPI } from '../api'
import { novelProjectAPI } from '@/features/novel_project/frontend/api'
// 注意：删除了 DropResult 的引用，因为不再需要 react-beautiful-dnd

export default function OutlineEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = parseInt(id || '0')
  const theme = useTheme()

  const { treeData, loading, error, loadTree, refreshTree } = useOutlineTree(projectId)
  const { createNode, updateNode, deleteNode } = useOutlineNode(projectId, refreshTree)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [selectedNode, setSelectedNode] = useState<OutlineNodeWithChildren | null>(null)
  const [parentNode, setParentNode] = useState<OutlineNodeWithChildren | null>(null)
  const [defaultNodeType, setDefaultNodeType] = useState<'volume' | 'chapter' | 'section'>(
    'volume'
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('')
  
  // AI生成相关状态
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [progressPanelOpen, setProgressPanelOpen] = useState(false)
  const [generateParams, setGenerateParams] = useState<OutlineGenerateRequest | null>(null)
  const [generateError, setGenerateError] = useState<string>('')
  
  // 项目信息状态
  const [projectInfo, setProjectInfo] = useState<{
    description?: string
    genre?: string
    style?: string
  }>({})

  // 加载项目信息
  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const project = await novelProjectAPI.getProject(projectId)
        setProjectInfo({
          description: project.description || '',
          genre: project.genre || '',
          style: project.style || '',
        })
      } catch (error) {
        console.error('Failed to load project info:', error)
      }
    }
    loadProjectInfo()
  }, [projectId])

  useEffect(() => {
    loadTree()
  }, [loadTree])

  // 处理创建新节点
  const handleCreateNode = useCallback(
    (parent?: OutlineNodeWithChildren, nodeType?: 'volume' | 'chapter' | 'section') => {
      setEditorMode('create')
      setParentNode(parent || null)
      setDefaultNodeType(nodeType || 'volume')
      setSelectedNode(null)
      setEditorOpen(true)
    },
    []
  )

  // 处理编辑节点
  const handleEditNode = useCallback((node: OutlineNodeWithChildren) => {
    setEditorMode('edit')
    setSelectedNode(node)
    setParentNode(null)
    setEditorOpen(true)
  }, [])

  // 处理添加子节点
  const handleAddChild = useCallback((node: OutlineNodeWithChildren) => {
    const childType =
      node.node_type === 'volume' ? 'chapter' : node.node_type === 'chapter' ? 'section' : 'volume'
    handleCreateNode(node, childType)
  }, [handleCreateNode])

  // 处理保存节点
  const handleSaveNode = useCallback(
    async (data: OutlineNodeCreate | OutlineNodeUpdate) => {
      if (editorMode === 'create') {
        const result = await createNode(data as OutlineNodeCreate)
        // 如果是chapter类型，显示同步提示
        if ((data as OutlineNodeCreate).node_type === 'chapter') {
          setSyncStatusMessage('章节节点已创建，章节记录已自动同步')
          setTimeout(() => setSyncStatusMessage(''), 3000)
        }
      } else if (selectedNode) {
        await updateNode(selectedNode.id, data as OutlineNodeUpdate)
        // 如果是chapter类型，显示同步提示
        if (selectedNode.node_type === 'chapter') {
          setSyncStatusMessage('章节节点已更新，章节记录已自动同步')
          setTimeout(() => setSyncStatusMessage(''), 3000)
        }
      }
    },
    [editorMode, selectedNode, createNode, updateNode]
  )

  // 处理删除节点
  const handleDeleteClick = useCallback((nodeId: number) => {
    setNodeToDelete(nodeId)
    setDeleteDialogOpen(true)
  }, [])

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (nodeToDelete) {
      try {
        await deleteNode(nodeToDelete, true)
        setDeleteDialogOpen(false)
        setNodeToDelete(null)
        setSyncStatusMessage('节点已删除，关联的章节记录已自动清理')
        setTimeout(() => setSyncStatusMessage(''), 3000)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }, [nodeToDelete, deleteNode])

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refreshTree()
    setTimeout(() => setIsRefreshing(false), 500)
  }, [refreshTree])

  // --- 新增：处理节点上移/下移 ---
  const handleMoveNode = useCallback(
    async (node: OutlineNodeWithChildren, direction: 'up' | 'down') => {
      if (!treeData) return

      try {
        // 1. 找到该节点所在的兄弟列表 (Siblings)
        let siblings: OutlineNodeWithChildren[] = []
        
        if (node.parent_id === null) {
          // 如果是根节点，兄弟就是 root_nodes
          siblings = treeData.root_nodes
        } else {
          // 如果有父节点，递归查找父节点，然后取其 children
          const findParent = (nodes: OutlineNodeWithChildren[]): OutlineNodeWithChildren | null => {
            for (const n of nodes) {
              if (n.id === node.parent_id) return n
              if (n.children && n.children.length > 0) {
                const found = findParent(n.children)
                if (found) return found
              }
            }
            return null
          }
          const parent = findParent(treeData.root_nodes)
          siblings = parent?.children || []
        }

        // 2. 找到当前节点在兄弟列表中的索引
        const currentIndex = siblings.findIndex(n => n.id === node.id)
        if (currentIndex === -1) return

        // 3. 计算目标索引
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

        // 4. 边界检查 (防止数组越界)
        if (targetIndex < 0 || targetIndex >= siblings.length) return

        // 5. 生成新的 ID 顺序数组
        const siblingIds = siblings.map(n => n.id)
        
        // 交换位置
        const temp = siblingIds[currentIndex]
        siblingIds[currentIndex] = siblingIds[targetIndex]
        siblingIds[targetIndex] = temp

        // 6. 调用后端 API 更新顺序
        // 假设 outlineAPI.reorderNodes 接受 { parent_id, node_ids: number[] }
        await outlineAPI.reorderNodes(projectId, {
          parent_id: node.parent_id,
          node_ids: siblingIds,
        })

        // 7. 刷新树以显示最新顺序
        await refreshTree()
        setSyncStatusMessage('节点顺序已调整，章节编号已自动更新')
        setTimeout(() => setSyncStatusMessage(''), 3000)

      } catch (error) {
        console.error('Move operation failed:', error)
        // 可以在这里添加 Toast 提示错误
      }
    },
    [projectId, treeData, refreshTree]
  )
  // --- 结束新增 ---
  
  // AI生成处理函数
  const handleGenerateStart = useCallback((params: OutlineGenerateRequest) => {
    setGenerateParams(params)
    setGeneratorOpen(false)
    setProgressPanelOpen(true)
    setGenerateError('') // 清除之前的错误
  }, [])
  
  const handleGenerateComplete = useCallback(async (totalNodes: number) => {
    console.log(`生成完成, 共${totalNodes}个节点`)
    await refreshTree()
    setTimeout(() => setProgressPanelOpen(false), 3000)
  }, [refreshTree])
  
  const handleGenerateError = useCallback((error: string) => {
    console.error('生成失败:', error)
    setGenerateError(error) // 在页面主区域显示错误
  }, [])

  if (loading && !treeData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    // 如果没有配置 framer-motion 动画，可以把 motion.div 换成普通的 Box 或 div
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 页面头部 */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            backdropFilter: 'blur(10px)',
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: theme.palette.background.paper,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
            大纲编辑
          </Typography>

          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              bgcolor: theme.palette.background.paper,
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 0.5, ease: 'linear' }}
            >
              <RefreshIcon />
            </motion.div>
          </IconButton>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreateNode(undefined, 'volume')}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            新建卷
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setGeneratorOpen(true)}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            AI生成
          </Button>
        </Stack>

        {/* 错误提示 */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 3,
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* AI生成错误提示 */}
        {generateError && (
          <Alert
            severity="error"
            onClose={() => setGenerateError('')}
            sx={{
              mb: 3,
              borderRadius: 3,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              AI生成失败
            </Typography>
            <Typography variant="body2">{generateError}</Typography>
          </Alert>
        )}
        
        {/* 同步状态提示 */}
        {syncStatusMessage && (
          <Alert
            severity="success"
            onClose={() => setSyncStatusMessage('')}
            sx={{
              mb: 3,
              borderRadius: 3,
            }}
          >
            {syncStatusMessage}
          </Alert>
        )}
        
        {/* 生成进度面板 */}
        {progressPanelOpen && generateParams && (
          <Box sx={{ mb: 3 }}>
            <GenerationProgressPanel
              projectId={projectId}
              generateParams={generateParams}
              onComplete={handleGenerateComplete}
              onError={handleGenerateError}
              onCancel={() => setProgressPanelOpen(false)}
            />
          </Box>
        )}

        {/* 大纲树 */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            minHeight: 500,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          {treeData && (
            <OutlineTree
              nodes={treeData.root_nodes}
              onEdit={handleEditNode}
              onDelete={handleDeleteClick}
              onAddChild={handleAddChild}
              // 关键修复：移除 onDragEnd，传入 onMove
              onMove={handleMoveNode} 
            />
          )}
        </Paper>

        {/* 节点编辑器 */}
        <OutlineNodeEditor
          open={editorOpen}
          mode={editorMode}
          node={selectedNode}
          parentNode={parentNode}
          defaultNodeType={defaultNodeType}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveNode}
        />

        {/* 删除确认对话框 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>确认删除</DialogTitle>
          <DialogContent>
            <DialogContentText>
              确定要删除此节点吗?此操作将同时删除所有子节点，且不可恢复。
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>
              取消
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              删除
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* AI生成对话框 */}
        <OutlineGeneratorDialog
          open={generatorOpen}
          onClose={() => setGeneratorOpen(false)}
          projectId={projectId}
          onGenerateStart={handleGenerateStart}
          projectDescription={projectInfo.description}
          projectGenre={projectInfo.genre}
          projectStyle={projectInfo.style}
        />
      </Container>
    </motion.div>
  )
}