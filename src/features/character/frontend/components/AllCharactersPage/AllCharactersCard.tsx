/**
 * 全部角色页面专用的角色卡片组件（增强版）
 * 支持显示项目名称、性别图标等增强功能
 */

import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material'
import {
  Public as PublicIcon,
  FolderSpecial as FolderSpecialIcon,
  WorkOutline as WorkIcon,
  CalendarMonth as CalendarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { itemVariants } from '@/frontend/core/animation'
import GenderIcon from './GenderIcon'
import type { Character } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

interface AllCharactersCardProps {
  character: Character
  project?: NovelProjectResponse
  onClick: () => void
  onDelete?: () => void
}

export default function AllCharactersCard({ character, project, onClick, onDelete }: AllCharactersCardProps) {
  const theme = useTheme()
  const hasBasicInfo =
    character.basic_info?.gender ||
    character.basic_info?.age ||
    character.basic_info?.occupation

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      whileHover={{
        y: -6,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          '& .card-accent': {
            opacity: 1,
          },
        },
      }}
    >
      {/* 顶部装饰条 */}
      <Box
        className="card-accent"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      <CardContent sx={{ p: 2.5 }}>
        {/* 头部 */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h6"
                fontWeight={600}
                noWrap
                sx={{
                  lineHeight: 1.3,
                  flex: 1,
                }}
              >
                {character.name}
              </Typography>
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  sx={{
                    opacity: 0.6,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      color: 'error.main',
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Stack>
            {/* 显示所属信息：公共角色或项目名称 */}
            {project ? (
              <Chip
                label={project.title}
                size="small"
                icon={<FolderSpecialIcon sx={{ fontSize: 14 }} />}
                sx={{
                  mt: 0.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  height: 20,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: 'secondary.main',
                  border: 'none',
                  '& .MuiChip-icon': {
                    fontSize: 14,
                    color: 'secondary.main',
                  },
                }}
              />
            ) : (
              <Chip
                label="公共角色"
                size="small"
                icon={<PublicIcon sx={{ fontSize: 14 }} />}
                sx={{
                  mt: 0.5,
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  height: 20,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: 'success.main',
                  border: 'none',
                  '& .MuiChip-icon': {
                    fontSize: 14,
                    color: 'success.main',
                  },
                }}
              />
            )}
          </Box>
          {character.basic_info?.category && (
            <Chip
              label={character.basic_info.category}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 24,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                border: 'none',
              }}
            />
          )}
        </Stack>

        {/* 基本信息 - 使用图标增强 */}
        {hasBasicInfo ? (
          <Stack spacing={1} mb={2}>
            {character.basic_info?.gender && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <GenderIcon gender={character.basic_info.gender} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                  {character.basic_info.gender}
                </Typography>
              </Stack>
            )}
            {character.basic_info?.age && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                  {character.basic_info.age}
                </Typography>
              </Stack>
            )}
            {character.basic_info?.occupation && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <WorkIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ lineHeight: 1 }}
                >
                  {character.basic_info.occupation}
                </Typography>
              </Stack>
            )}
          </Stack>
        ) : (
          <Box
            sx={{
              py: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.disabled">
              点击编辑角色信息
            </Typography>
          </Box>
        )}

        {/* 底部信息 - 更好的布局 */}
        <Box
          sx={{
            pt: 1.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <CalendarIcon sx={{ fontSize: 12 }} />
            创建于 {new Date(character.created_at).toLocaleDateString('zh-CN')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
