/**
 * 公共角色列表组件
 * 展示没有关联项目的公共角色
 */

import {
  Box,
  Button,
  Fade,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants } from '@/frontend/core/animation'
import AllCharactersCard from './AllCharactersCard'
import type { Character } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

interface PublicCharacterListProps {
  characters: Character[]
  projects: Map<number, NovelProjectResponse>
  searchQuery: string
  categoryFilter: string | null
  onCharacterClick: (characterId: number) => void
  onCreateClick: () => void
}

export default function PublicCharacterList({
  characters,
  projects,
  searchQuery,
  categoryFilter,
  onCharacterClick,
  onCreateClick,
}: PublicCharacterListProps) {
  const theme = useTheme()

  // 空状态
  if (characters.length === 0) {
    return (
      <Fade in timeout={500}>
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 6, md: 10 },
            px: 3,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 3,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <PersonIcon sx={{ fontSize: 56, color: alpha(theme.palette.primary.main, 0.5) }} />
          </Box>
          <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
            {searchQuery || categoryFilter ? '未找到匹配的公共角色' : '暂无公共角色'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {searchQuery || categoryFilter
              ? '尝试调整搜索条件或清除筛选'
              : '公共角色可以在所有项目中使用。点击「创建角色」创建公共角色。'}
          </Typography>
          {!searchQuery && !categoryFilter && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onCreateClick}
              sx={{ borderRadius: 3 }}
            >
              创建角色
            </Button>
          )}
        </Box>
      </Fade>
    )
  }

  return (
    <Grid2
      container
      spacing={{ xs: 2, sm: 2.5, md: 3 }}
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {characters.map((character) => (
        <Grid2 key={character.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <AllCharactersCard
            character={character}
            project={character.project_id ? projects.get(character.project_id) : undefined}
            onClick={() => onCharacterClick(character.id)}
          />
        </Grid2>
      ))}
    </Grid2>
  )
}
