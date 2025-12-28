/**
 * 角色卡片组件
 * 用于展示角色/模板的基本信息
 */

import { Card, CardContent, Typography, Box, Chip, IconButton, alpha } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { itemVariants } from '@/frontend/core/animation'
import type { Character, CharacterTemplate } from '@/features/character/frontend/types'

interface CharacterCardProps {
  character: Character | CharacterTemplate
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showUsageCount?: boolean
  usageCount?: number
}

export default function CharacterCard({
  character,
  onClick,
  onEdit,
  onDelete,
  showUsageCount,
  usageCount,
}: CharacterCardProps) {
  const isTemplate = 'category' in character && !('project_id' in character)
  const category = isTemplate
    ? (character as CharacterTemplate).category
    : (character as Character).basic_info?.category

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: (theme) => theme.shadows[8],
        },
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* 标题和分类 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {character.name}
          </Typography>
          {category && (
            <Chip
              label={category}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 500,
              }}
            />
          )}
        </Box>

        {/* 描述 */}
        {isTemplate && (character as CharacterTemplate).description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {(character as CharacterTemplate).description}
          </Typography>
        )}

        {/* 底部信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(character.created_at).toLocaleDateString()}
          </Typography>

          {showUsageCount !== undefined && usageCount !== undefined && (
            <Typography variant="caption" color="text.secondary">
              已使用 {usageCount} 次
            </Typography>
          )}

          {/* 操作按钮 */}
          {(onEdit || onDelete) && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  sx={{
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  sx={{
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                      color: 'error.main',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
