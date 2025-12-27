/**
 * OutlineNodeItem.tsx
 * 大纲节点组件 - MacOS 风格 + 按钮排序版
 * 特性：字数右侧列对齐，悬停显示操作按钮
 */
import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  Stack,
  Fade,
  Collapse,
  Chip,
  type Theme,
} from '@mui/material'
import {
  ArrowRight as ArrowRightIcon,
  DescriptionOutlined as FileIcon,
  FolderOpenOutlined as FolderIcon,
  SourceOutlined as VolumeIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  AddCircleOutline as AddIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material'
import type { OutlineNodeWithChildren } from '../api'

// ---------------------------
// 1. 类型定义
// ---------------------------

interface OutlineNodeItemProps {
  node: OutlineNodeWithChildren
  /** 当前层级 (用于缩进计算) */
  level?: number 
  /** 回调：编辑节点 */
  onEdit: (node: OutlineNodeWithChildren) => void
  /** 回调：删除节点 */
  onDelete: (nodeId: number) => void
  /** 回调：添加子节点 */
  onAddChild?: (node: OutlineNodeWithChildren) => void
  /** 回调：移动节点 direction: 'up' | 'down' */
  onMove: (node: OutlineNodeWithChildren, direction: 'up' | 'down') => void
  /** 是否是列表中的第一个 (用于禁用上移按钮) */
  isFirst: boolean
  /** 是否是列表中的最后一个 (用于禁用下移按钮 + 绘制连接线) */
  isLast: boolean
  /** 父级链条 (用于绘制垂直引导线) */
  parentChain?: boolean[]
  /** 递归渲染的子组件 */
  children?: React.ReactNode
}

// ---------------------------
// 2. 样式与配置
// ---------------------------

const getNodeTypeConfig = (theme: Theme) => ({
  volume: {
    icon: VolumeIcon,
    color: '#007AFF', // MacOS Blue
    bgColor: alpha('#007AFF', 0.12),
  },
  chapter: {
    icon: FolderIcon,
    color: '#F5B041', // MacOS Yellow
    bgColor: alpha('#F5B041', 0.12),
  },
  section: {
    icon: FileIcon,
    color: theme.palette.text.secondary,
    bgColor: alpha(theme.palette.text.secondary, 0.08),
  },
})

// ---------------------------
// 3. 辅助组件
// ---------------------------

// 垂直引导线组件
const GuideLines = ({ level, parentChain, theme }: { level: number, parentChain: boolean[], theme: Theme }) => {
  if (level === 0) return null
  const indentSize = 24
  return (
    <>
      {parentChain.map((hasLine, idx) =>
        hasLine ? (
          <Box
            key={idx}
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '1px',
              bgcolor: alpha(theme.palette.divider, 0.6),
              left: 12 + idx * indentSize,
              zIndex: 0,
            }}
          />
        ) : null
      )}
    </>
  )
}

// 操作按钮封装
function ActionBtn({ 
  icon, 
  title, 
  onClick, 
  color = 'default',
  disabled = false 
}: { 
  icon: React.ReactNode, 
  title: string, 
  onClick: () => void,
  color?: 'default' | 'error' | 'primary',
  disabled?: boolean
}) {
  const theme = useTheme()
  const isError = color === 'error'
  
  // 如果被禁用，渲染一个不可见的占位符或者直接不渲染
  // 这里选择直接不渲染以节省空间
  if (disabled) return null 

  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        sx={{
          width: 24,
          height: 24,
          borderRadius: '4px',
          color: 'text.secondary',
          '&:hover': {
            color: isError ? 'error.main' : 'primary.main',
            bgcolor: isError ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
          },
          '& svg': { fontSize: 16 },
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  )
}

// ---------------------------
// 4. 主组件实现
// ---------------------------

export default function OutlineNodeItem({
  node,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
  isFirst,
  isLast,
  parentChain = [],
  children,
}: OutlineNodeItemProps) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const hasChildren = node.children && node.children.length > 0
  const nodeTypeConfig = useMemo(() => getNodeTypeConfig(theme), [theme])
  const typeConfig = nodeTypeConfig[node.node_type as keyof typeof nodeTypeConfig] || nodeTypeConfig.section
  const TypeIcon = typeConfig.icon
  const canHaveChildren = node.node_type === 'volume' || node.node_type === 'chapter'

  const INDENT_SIZE = 24
  const ROW_HEIGHT = 36

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }, [])

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 
        --------------------
        节点内容行 (Row)
        --------------------
      */}
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
           // 点击整行也可以折叠/展开
           if (hasChildren) setExpanded(!expanded)
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: ROW_HEIGHT,
          pr: 1,
          pl: 1,
          mb: '2px', // 行间距
          borderRadius: '6px',
          cursor: 'default',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            bgcolor: alpha(theme.palette.text.primary, 0.04),
          },
          userSelect: 'none',
        }}
      >
        {/* 1. 引导线层 */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            height: '100%',
            width: level * INDENT_SIZE,
            pointerEvents: 'none',
          }}
        >
          <GuideLines level={level} parentChain={parentChain} theme={theme} />
        </Box>

        {/* 2. 缩进占位符 */}
        <Box sx={{ width: level * INDENT_SIZE, flexShrink: 0 }} />

        {/* 3. 折叠/展开 箭头 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            mr: 0.5,
            borderRadius: '4px',
            cursor: 'pointer',
            '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05) },
          }}
          onClick={handleToggle}
        >
          <ArrowRightIcon
            sx={{
              fontSize: 18,
              color: 'text.secondary',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hasChildren && expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              opacity: hasChildren ? 0.8 : 0,
            }}
          />
        </Box>

        {/* 4. 类型图标 (卷/章/节) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            mr: 1.5,
            color: typeConfig.color,
            bgcolor: level < 2 ? typeConfig.bgColor : 'transparent',
            borderRadius: '5px',
          }}
        >
          <TypeIcon sx={{ fontSize: level < 2 ? 16 : 18 }} />
        </Box>

        {/* 5. 标题 (Flex: 1 占据中间所有剩余空间) */}
        <Typography
          variant="body2"
          noWrap
          sx={{
            flex: 1,
            fontWeight: level === 0 ? 600 : 500,
            fontSize: level === 0 ? '14px' : '13.5px',
            color: 'text.primary',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            mr: 1, 
          }}
        >
          {node.title}
        </Typography>

        {/* 5.5. 章节编号和特殊标识 */}
        {node.node_type === 'chapter' && node.chapter_number && (
          <Chip
            label={`第${node.chapter_number}章`}
            size="small"
            sx={{
              height: 20,
              fontSize: '11px',
              fontWeight: 600,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              mr: 0.5,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}
        {node.node_type === 'section' && (
          <Tooltip title="小节不会创建章节记录，内容将合并到父章节" arrow>
            <Chip
              icon={<InfoIcon sx={{ fontSize: 12 }} />}
              label="仅大纲"
              size="small"
              sx={{
                height: 20,
                fontSize: '10px',
                fontWeight: 500,
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                color: 'text.secondary',
                mr: 0.5,
                '& .MuiChip-label': { px: 0.8 },
                '& .MuiChip-icon': { ml: 0.5 },
              }}
            />
          </Tooltip>
        )}

        {/* 
           6. 右侧区域 (包含操作按钮 + 字数) 
           Stack 默认不换行，且紧贴右边缘
        */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          
          {/* A. 操作按钮组 (悬停显示，位于字数左侧) */}
          <Fade in={isHovered} timeout={150} unmountOnExit>
            <Box
              sx={{
                display: 'flex',
                gap: 0,
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(4px)',
                borderRadius: '4px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                pl: 0.5,
                // 防止按钮组挤压右侧字数
                flexShrink: 0, 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 移动按钮 */}
              <ActionBtn 
                icon={<MoveUpIcon />} 
                title="上移" 
                disabled={isFirst}
                onClick={() => onMove(node, 'up')} 
              />
              <ActionBtn 
                icon={<MoveDownIcon />} 
                title="下移" 
                disabled={isLast}
                onClick={() => onMove(node, 'down')} 
              />
              
              {/* 分割线 */}
              <Box sx={{ width: 1, height: 16, bgcolor: 'divider', mx: 0.5, alignSelf: 'center' }} />

              {/* 编辑类按钮 */}
              {canHaveChildren && onAddChild && (
                <ActionBtn icon={<AddIcon />} title="添加子项" onClick={() => onAddChild(node)} />
              )}
              <ActionBtn icon={<EditIcon />} title="编辑" onClick={() => onEdit(node)} />
              <ActionBtn
                icon={<DeleteIcon />}
                title="删除"
                color="error"
                onClick={() => onDelete(node.id)}
              />
            </Box>
          </Fade>

          {/* B. 字数统计 (永远位于最右侧，固定宽度，形成列对齐) */}
          <Box
            sx={{
              width: 70,           // 固定宽度
              textAlign: 'right',  // 内容右对齐
              flexShrink: 0,       // 禁止被压缩
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            {node.metadata?.word_count_target ? (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '11px',
                  color: 'text.secondary',
                  // 使用等宽字体确保数字对齐
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace', 
                  fontWeight: 500,
                  opacity: 0.8,
                  // 淡淡的背景增加可读性
                  bgcolor: alpha(theme.palette.action.hover, 0.04),
                  px: 0.6,
                  borderRadius: '3px',
                }}
              >
                {node.metadata.word_count_target.toLocaleString()}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </Box>

      {/* 
        --------------------
        子节点渲染区域
        --------------------
      */}
      <Collapse in={hasChildren && expanded} timeout="auto" unmountOnExit>
        <Box sx={{ position: 'relative' }}>
          {/* 子节点的左侧垂直引导线 */}
          {!isLast && level >= 0 && (
            <Box
              sx={{
                position: 'absolute',
                left: level * INDENT_SIZE + 12, // 对齐父节点图标中心
                top: 0,
                bottom: 0,
                width: '1px',
                bgcolor: alpha(theme.palette.divider, 0.6),
                zIndex: 0,
              }}
            />
          )}
          
          {/* 递归渲染 */}
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}