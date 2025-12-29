/**
 * 角色关系图谱容器组件
 * 管理图谱的整体状态和渲染
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, CircularProgress, Typography, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import CharacterNode, { type CharacterNodeType } from './CharacterNode'
import RelationEdge, { type RelationEdge as RelationEdgeType } from './RelationEdge'
import FilterPanel from './FilterPanel'
import { useGraphStore } from '../../stores/graphStore'
import { computeLayout } from '../../utils/layoutEngine'
import type { Character, CharacterRelation } from '../../types'

// 节点和边的类型映射
const nodeTypes = {
  character: CharacterNode,
}

const edgeTypes = {
  relation: RelationEdge,
}

interface GraphContainerProps {
  characters: Character[]
  relations: CharacterRelation[]
  onNodeClick?: (characterId: number) => void
  onEdgeClick?: (relationId: number) => void
}

/**
 * 数据转换：后端数据 -> React Flow 数据
 */
const transformToGraphData = (
  characters: Character[],
  relations: CharacterRelation[],
  selectedRelationTypes: string[],
  strengthRange: [number, number]
): { nodes: CharacterNodeType[]; edges: RelationEdgeType[] } => {
  // 1. 过滤关系
  const filteredRelations = relations.filter(
    (rel) =>
      selectedRelationTypes.includes(rel.relation_type) &&
      rel.strength >= strengthRange[0] &&
      rel.strength <= strengthRange[1]
  )

  // 2. 统计每个角色的关系数量
  const relationCountMap = new Map<number, number>()
  filteredRelations.forEach((rel) => {
    relationCountMap.set(rel.source_character_id, (relationCountMap.get(rel.source_character_id) || 0) + 1)
    relationCountMap.set(rel.target_character_id, (relationCountMap.get(rel.target_character_id) || 0) + 1)
  })

  // 3. 转换节点（只显示有关系的角色）
  const nodes: CharacterNodeType[] = characters
    .filter((char) => relationCountMap.has(char.id))
    .map((char) => ({
      id: String(char.id),
      type: 'character',
      data: {
        character: char,
        relationCount: relationCountMap.get(char.id) || 0,
      },
      position: { x: 0, y: 0 },
    }))

  // 4. 转换边
  const edges: RelationEdgeType[] = filteredRelations.map((rel) => ({
    id: String(rel.id),
    type: 'relation',
    source: String(rel.source_character_id),
    target: String(rel.target_character_id),
    data: { relation: rel },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  }))

  return { nodes, edges }
}

const GraphContainerInner = ({ characters, relations, onNodeClick, onEdgeClick }: GraphContainerProps) => {
  const theme = useTheme()
  const { selectedRelationTypes, strengthRange, currentLayout } = useGraphStore()

  const [nodes, setNodes, onNodesChange] = useNodesState<CharacterNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationEdgeType>([])
  const [isLayouting, setIsLayouting] = useState(false)

  // 转换数据为 React Flow 格式
  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => transformToGraphData(characters, relations, selectedRelationTypes, strengthRange),
    [characters, relations, selectedRelationTypes, strengthRange]
  )

  // 应用布局算法
  useEffect(() => {
    if (rawNodes.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    setIsLayouting(true)

    // 使用 requestAnimationFrame 避免阻塞 UI
    requestAnimationFrame(() => {
      const layoutedNodes = computeLayout(rawNodes, rawEdges, currentLayout, {
        width: 1200,
        height: 800,
      })

      setNodes(layoutedNodes)
      setEdges(rawEdges)
      setIsLayouting(false)
    })
  }, [rawNodes, rawEdges, currentLayout, setNodes, setEdges])

  // 节点点击处理
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: CharacterNodeType) => {
      if (onNodeClick) {
        onNodeClick(node.data.character.id)
      }
    },
    [onNodeClick]
  )

  // 边点击处理
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: RelationEdgeType) => {
      if (onEdgeClick && edge.data) {
        onEdgeClick(edge.data.relation.id)
      }
    },
    [onEdgeClick]
  )

  // 空状态
  if (characters.length === 0) {
    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          📊 暂无角色数据
        </Typography>
        <Typography variant="body2" color="text.disabled">
          请先创建角色并建立关系
        </Typography>
      </Box>
    )
  }

  if (nodes.length === 0 && !isLayouting) {
    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            🔍 没有符合条件的关系
          </Typography>
          <Typography variant="body2" color="text.disabled">
            请调整筛选条件
          </Typography>
        </Box>
        {/* 筛选面板 */}
        <FilterPanel />
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 加载遮罩 */}
      {isLayouting && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: alpha(theme.palette.background.default, 0.7),
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ marginTop: 2 }}>
              正在计算布局...
            </Typography>
          </Box>
        </Box>
      )}

      {/* React Flow 图谱 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'relation',
        }}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={theme.palette.primary.main} />
      </ReactFlow>

      {/* 筛选面板 */}
      <FilterPanel />
    </Box>
  )
}

/**
 * 包裹 ReactFlowProvider 的容器组件
 */
const GraphContainer = (props: GraphContainerProps) => {
  return (
    <ReactFlowProvider>
      <GraphContainerInner {...props} />
    </ReactFlowProvider>
  )
}

export default GraphContainer
