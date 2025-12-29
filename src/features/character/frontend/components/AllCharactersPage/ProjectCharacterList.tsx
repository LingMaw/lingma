/**
 * 项目专属角色列表组件
 * 按项目分组展示角色
 */

import {
  Box,
  Chip,
  Fade,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Person as PersonIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants } from '@/frontend/core/animation'
import AllCharactersCard from './AllCharactersCard'
import type { Character } from '@/features/character/frontend/types'
import type { components } from '@/frontend/core/types/generated'

type NovelProjectResponse = components['schemas']['NovelProjectResponse']

interface ProjectCharacterListProps {
  projectCharactersGrouped: Map<number, Character[]>
  filteredCharacters: Character[]
  projects: Map<number, NovelProjectResponse>
  searchQuery: string
  categoryFilter: string | null
  onCharacterClick: (characterId: number) => void
  onCharacterDelete: (characterId: number) => void
}

export default function ProjectCharacterList({
  projectCharactersGrouped,
  filteredCharacters,
  projects,
  searchQuery,
  categoryFilter,
  onCharacterClick,
  onCharacterDelete,
}: ProjectCharacterListProps) {
  const theme = useTheme()

  // 空状态
  if (projectCharactersGrouped.size === 0 || filteredCharacters.length === 0) {
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
            {searchQuery || categoryFilter ? '未找到匹配的项目角色' : '暂无项目专属角色'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {searchQuery || categoryFilter
              ? '尝试调整搜索条件或清除筛选'
              : '项目专属角色仅在特定项目中可用。在项目详情页创建专属角色。'}
          </Typography>
        </Box>
      </Fade>
    )
  }

  return (
    <Stack spacing={4}>
      {Array.from(projectCharactersGrouped.entries())
        .filter(([projectId]) => {
          // 过滤出包含符合搜索条件的角色的项目组
          const projectChars = projectCharactersGrouped.get(projectId) || []
          return projectChars.some((char) => filteredCharacters.includes(char))
        })
        .map(([projectId, projectChars]) => {
          const project = projects.get(projectId)
          const visibleChars = projectChars.filter((char) => filteredCharacters.includes(char))

          return (
            <Box
              key={projectId}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 项目标题 */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 32,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.6)} 100%)`,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {project ? project.title : `项目 #${projectId}`}
                  </Typography>
                  {project?.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {project.description}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={`${visibleChars.length} 个角色`}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                />
              </Stack>

              {/* 角色网格 */}
              <Grid2
                container
                spacing={{ xs: 2, sm: 2.5, md: 3 }}
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {visibleChars.map((character) => (
                  <Grid2 key={character.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <AllCharactersCard
                      character={character}
                      project={project}
                      onClick={() => onCharacterClick(character.id)}
                      onDelete={() => onCharacterDelete(character.id)}
                    />
                  </Grid2>
                ))}
              </Grid2>
            </Box>
          )
        })}
    </Stack>
  )
}
