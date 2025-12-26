/**
 * 大纲树组件 - 递归渲染树形结构 (适配按钮排序版)
 */
import { memo, useMemo } from 'react'
import { Box, Typography, Stack, alpha, useTheme } from '@mui/material'
import { AccountTree as TreeIcon } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import OutlineNodeItem from './OutlineNodeItem'
import type { OutlineNodeWithChildren } from '../api'

// 1. 更新 Props 定义：移除 onDragEnd，添加 onMove
interface OutlineTreeProps {
  nodes: OutlineNodeWithChildren[]
  onEdit: (node: OutlineNodeWithChildren) => void
  onDelete: (nodeId: number) => void
  onAddChild?: (node: OutlineNodeWithChildren) => void
  /** 新增：移动节点回调 */
  onMove: (node: OutlineNodeWithChildren, direction: 'up' | 'down') => void
}

interface OutlineTreeLevelProps extends OutlineTreeProps {
  level?: number
  parentChain?: boolean[]
}

// 2. 递归组件：移除 index 属性传递，计算 isFirst/isLast
const OutlineTreeLevel = memo(function OutlineTreeLevel({
  nodes,
  onEdit,
  onDelete,
  onAddChild,
  onMove, // 接收 onMove
  level = 0,
  parentChain = [],
}: OutlineTreeLevelProps) {
  if (!nodes || nodes.length === 0) {
    return null
  }

  return (
    <AnimatePresence mode="sync">
      {nodes.map((node, index) => {
        const isFirst = index === 0 // 计算是否第一个 (用于禁用上移)
        const isLast = index === nodes.length - 1 // 计算是否最后一个 (用于禁用下移 + 连线)
        const newParentChain = [...parentChain, !isLast]
        
        return (
          <OutlineNodeItem
            key={node.id}
            node={node}
            // 移除 index={index} (子组件不再需要 index)
            level={level}
            isFirst={isFirst} // 传递 isFirst
            isLast={isLast}
            parentChain={parentChain}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onMove={onMove} // 传递 onMove
          >
            {node.children && node.children.length > 0 && (
              <OutlineTreeLevel
                nodes={node.children}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onMove={onMove} // 递归传递
                level={level + 1}
                parentChain={newParentChain}
              />
            )}
          </OutlineNodeItem>
        )
      })}
    </AnimatePresence>
  )
})

// 空状态组件 (保持不变)
function EmptyState() {
  const theme = useTheme()
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ textAlign: 'center', py: 12, px: 4 }}
    >
      <Box
        sx={{
          width: 80, height: 80, borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto', mb: 3,
        }}
      >
        <TreeIcon sx={{ fontSize: 40, color: alpha(theme.palette.primary.main, 0.6) }} />
      </Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
        暂无大纲内容
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, margin: '0 auto' }}>
        点击上方"新建卷"按钮开始创建您的小说大纲结构
      </Typography>
    </Box>
  )
}

// 3. 主组件：移除 DragDropContext 和 Droppable 包裹
export default function OutlineTree({
  nodes,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
}: OutlineTreeProps) {

  // 统计信息
  const stats = useMemo(() => {
    const countNodes = (nodes: OutlineNodeWithChildren[]): number => {
      return nodes.reduce((count, node) => {
        return count + 1 + (node.children ? countNodes(node.children) : 0)
      }, 0)
    }
    return {
      total: nodes ? countNodes(nodes) : 0,
      volumes: nodes?.filter(n => n.node_type === 'volume').length || 0,
    }
  }, [nodes])

  if (!nodes || nodes.length === 0) {
    return <EmptyState />
  }

  return (
    <Stack spacing={2}>
      {/* 统计信息 */}
      {stats.total > 0 && (
        <Box sx={{ display: 'flex', gap: 2, px: 1, py: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            共 {stats.volumes} 卷 · {stats.total} 个节点
          </Typography>
        </Box>
      )}

      {/* 树形结构 - 不再需要 Droppable 容器 */}
      <Box
        sx={{
          minHeight: 100,
          borderRadius: 2,
          // 移除了拖拽相关的背景色变化逻辑
        }}
      >
        <OutlineTreeLevel
          nodes={nodes}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onMove={onMove}
        />
      </Box>
    </Stack>
  )
}