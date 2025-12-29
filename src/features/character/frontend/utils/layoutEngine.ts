/**
 * 图谱布局引擎
 * 提供三种布局算法：力导向、层次、环形
 */

import type { Node, Edge } from '@xyflow/react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import dagre from 'dagre'

export type LayoutType = 'force' | 'hierarchical' | 'circular'

export interface LayoutOptions {
  width?: number
  height?: number
  spacing?: number
  // 力导向布局专用
  forceStrength?: number
  centerForce?: number
  // 层次布局专用
  rankDirection?: 'TB' | 'LR' // Top-Bottom or Left-Right
}

/**
 * 计算节点布局
 * 使用泛型保留输入节点的具体类型
 */
export const computeLayout = <T extends Node>(
  nodes: T[],
  edges: Edge[],
  layoutType: LayoutType,
  options: LayoutOptions = {}
): T[] => {
  const { width = 1200, height = 800 } = options

  switch (layoutType) {
    case 'force':
      return computeForceLayout(nodes, edges, { ...options, width, height })
    case 'hierarchical':
      return computeHierarchicalLayout(nodes, edges, { ...options, width, height })
    case 'circular':
      return computeCircularLayout(nodes, { ...options, width, height })
    default:
      return nodes
  }
}

/**
 * 力导向布局
 * 使用 d3-force 模拟物理引力
 */
const computeForceLayout = <T extends Node>(
  nodes: T[],
  edges: Edge[],
  options: LayoutOptions
): T[] => {
  if (nodes.length === 0) return nodes

  const { width = 1200, height = 800, forceStrength = -300 } = options

  // 转换为 d3-force 的数据格式
  interface ForceNode extends SimulationNodeDatum {
    id: string
    x?: number
    y?: number
  }

  const forceNodes: ForceNode[] = nodes.map((node) => ({
    id: node.id,
    x: node.position?.x || Math.random() * width,
    y: node.position?.y || Math.random() * height,
  }))

  interface ForceLink extends SimulationLinkDatum<ForceNode> {
    source: string
    target: string
  }

  const forceLinks: ForceLink[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }))

  // 创建力导向模拟
  const simulation = forceSimulation(forceNodes)
    .force(
      'link',
      forceLink(forceLinks)
        .id((d) => (d as ForceNode).id)
        .distance(150)
    )
    .force('charge', forceManyBody().strength(forceStrength))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide().radius(80))

  // 运行模拟直到稳定
  for (let i = 0; i < 300; i++) {
    simulation.tick()
  }

  // 将计算结果应用回节点
  return nodes.map((node) => {
    const forceNode = forceNodes.find((n) => n.id === node.id)
    return {
      ...node,
      position: {
        x: forceNode?.x || node.position.x,
        y: forceNode?.y || node.position.y,
      },
    }
  }) as T[]
}

/**
 * 层次布局
 * 使用 dagre 实现有向图布局
 */
const computeHierarchicalLayout = <T extends Node>(
  nodes: T[],
  edges: Edge[],
  options: LayoutOptions
): T[] => {
  if (nodes.length === 0) return nodes

  const { rankDirection = 'TB' } = options

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: rankDirection, nodesep: 100, ranksep: 150 })
  g.setDefaultEdgeLabel(() => ({}))

  // 添加节点
  nodes.forEach((node) => {
    g.setNode(node.id, { width: 140, height: 160 })
  })

  // 添加边
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  // 计算布局
  dagre.layout(g)

  // 应用布局结果
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 70, // 调整中心点
        y: nodeWithPosition.y - 80,
      },
    }
  }) as T[]
}

/**
 * 环形布局
 * 将所有节点均匀分布在圆形上
 */
const computeCircularLayout = <T extends Node>(nodes: T[], options: LayoutOptions): T[] => {
  if (nodes.length === 0) return nodes

  const { width = 1200, height = 800 } = options
  const radius = Math.min(width, height) / 3
  const angleStep = (2 * Math.PI) / nodes.length

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: width / 2 + radius * Math.cos(index * angleStep - Math.PI / 2),
      y: height / 2 + radius * Math.sin(index * angleStep - Math.PI / 2),
    },
  })) as T[]
}
