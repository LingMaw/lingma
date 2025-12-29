/**
 * 角色节点渲染组件
 * 用于在 React Flow 图谱中渲染单个角色节点
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Card, Avatar, Typography, Chip, Box, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import type { Character } from '../../types'

export interface CharacterNodeData {
  character: Character
  relationCount: number
  [key: string]: unknown
}

// 完整的节点类型，用于 NodeProps 泛型
export type CharacterNodeType = Node<CharacterNodeData, 'character'>

const CharacterNode = ({ data, selected }: NodeProps<CharacterNodeType>) => {
  const theme = useTheme()

  const { character, relationCount } = data

  // 从 basic_info 获取头像 URL
  const avatarUrl = character.basic_info?.avatar_url as string | undefined

  // 获取角色名称首字符作为默认头像
  const avatarText = character.name.charAt(0).toUpperCase()

  return (
    <>
      {/* 四个方向的连接点 */}
      <Handle type="source" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ opacity: 0 }} />

      <Handle type="target" position={Position.Top} id="top-target" style={{ opacity: 0 }} />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ opacity: 0 }}
      />
      <Handle type="target" position={Position.Left} id="left-target" style={{ opacity: 0 }} />

      <Card
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
        sx={{
          width: 140,
          minHeight: 160,
          borderRadius: 3,
          boxShadow: selected ? 8 : 3,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
          transition: 'all 0.3s',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
          '&:hover': {
            boxShadow: 6,
            borderColor: theme.palette.primary.light,
          },
        }}
      >
        {/* 头像 */}
        <Avatar
          src={avatarUrl}
          sx={{
            width: 64,
            height: 64,
            marginBottom: 1.5,
            border: `2px solid ${theme.palette.primary.main}`,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          {avatarText}
        </Avatar>

        {/* 角色名称 */}
        <Typography
          variant="subtitle2"
          align="center"
          sx={{
            fontWeight: 600,
            marginBottom: 0.5,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {character.name}
        </Typography>

        {/* 关系数量徽章 */}
        <Chip
          label={`${relationCount} 关系`}
          size="small"
          sx={{
            height: 20,
            fontSize: 11,
            fontWeight: 500,
            background: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}
        />

        {/* 角色分类标签（如果有） */}
        {character.basic_info?.category && (
          <Box sx={{ marginTop: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: 10,
                color: theme.palette.text.secondary,
              }}
            >
              {character.basic_info.category as string}
            </Typography>
          </Box>
        )}
      </Card>
    </>
  )
}

// 使用 memo 优化渲染性能
export default memo(CharacterNode, (prev, next) => {
  return (
    prev.data.character.id === next.data.character.id &&
    prev.data.relationCount === next.data.relationCount &&
    prev.selected === next.selected
  )
})
