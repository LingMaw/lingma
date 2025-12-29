/**
 * 关系边渲染组件
 * 用于在 React Flow 图谱中渲染角色间的关系边
 */

import { memo, type CSSProperties } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'
import { useTheme, alpha, type Theme } from '@mui/material'
import type { CharacterRelation } from '../../types'

/**
 * 关系边数据类型
 * 仅包含边特有的业务数据，id/source/target 属于 Edge 本身
 */
export interface RelationEdgeData extends Record<string, unknown> {
  relation: CharacterRelation
}

/**
 * 完整的关系边类型，用于 EdgeProps 泛型约束
 */
export type RelationEdge = Edge<RelationEdgeData, 'relation'>

/**
 * 关系类型到颜色的映射
 */
const getRelationTypeColor = (relationType: string, theme: Theme) => {
  const colorMap: Record<string, string> = {
    家人: theme.palette.success.main,
    朋友: theme.palette.info.main,
    敌人: theme.palette.error.main,
    恋人: theme.palette.secondary.main,
    同事: theme.palette.warning.main,
    师徒: theme.palette.primary.main,
    竞争对手: theme.palette.error.light,
    其他: theme.palette.text.secondary,
  }
  return colorMap[relationType] || theme.palette.text.secondary
}

/**
 * 根据关系强度计算线宽 (1-10 -> 1px-6px)
 */
const getStrokeWidth = (strength: number) => {
  return 1 + (strength / 10) * 5
}

const RelationEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationEdge>) => {
  const theme = useTheme()

  const { relation } = data!

  // 计算边的路径
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // 计算边的样式
  const color = getRelationTypeColor(relation.relation_type, theme)
  const strokeWidth = getStrokeWidth(relation.strength)

  const edgeStyle: CSSProperties = {
    stroke: color,
    strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
    opacity: selected ? 1 : 0.8,
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={`url(#arrow-${id})`}
      />
      {/* 自定义箭头 marker */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="20"
          markerHeight="20"
          refX="18"
          refY="10"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 20 10 L 0 20 z"
            fill={color}
          />
        </marker>
      </defs>

      {/* 边标签 */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(5px)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            color: color,
            border: `1px solid ${alpha(color, 0.3)}`,
            pointerEvents: 'all',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          className="nodrag nopan"
        >
          {relation.relation_type} ({relation.strength})
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// 使用 memo 优化渲染性能
export default memo(RelationEdgeComponent, (prev, next) => {
  return (
    prev.data?.relation.id === next.data?.relation.id &&
    prev.selected === next.selected &&
    prev.sourceX === next.sourceX &&
    prev.sourceY === next.sourceY &&
    prev.targetX === next.targetX &&
    prev.targetY === next.targetY
  )
})
