/**
 * 关系网络编辑组件
 * 用于管理角色之间的关系
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  SwapHoriz as SwapHorizIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/frontend/core/animation'
import { characterAPI, characterRelationAPI } from '@/features/character/frontend/api'
import { RELATION_TYPES, type Character, type CharacterRelation, type CreateCharacterRelationRequest } from '@/features/character/frontend/types'

interface RelationsEditorProps {
  characterId: number
  characterName: string
}

interface RelationFormData {
  target_character_id: number
  relation_type: string
  strength: number
  description: string
  timeline: string
  is_bidirectional: boolean
}

const defaultFormData: RelationFormData = {
  target_character_id: 0,
  relation_type: '',
  strength: 5,
  description: '',
  timeline: '',
  is_bidirectional: false,
}

export default function RelationsEditor({
  characterId,
  characterName,
}: RelationsEditorProps) {
  const [relations, setRelations] = useState<CharacterRelation[]>([])
  const [allCharacters, setAllCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRelation, setEditingRelation] = useState<CharacterRelation | null>(null)
  const [formData, setFormData] = useState<RelationFormData>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  // 自动清除提示
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [relationsData, charactersData] = await Promise.all([
        characterRelationAPI.list(characterId),
        characterAPI.list(undefined, true),
      ])
      setRelations(relationsData)
      // 排除当前角色
      setAllCharacters(charactersData.filter((c) => c.id !== characterId))
    } catch (err) {
      setError('加载关系数据失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [characterId])

  useEffect(() => {
    loadData()
  }, [loadData])

  /**
   * 关系去重处理
   * 双向关系在数据库中存储为两条记录，前端只需显示一条
   * 规则：对于双向关系，只保留当前角色作为源的那条记录
   */
  const deduplicatedRelations = useMemo(() => {
    const seen = new Set<string>()
    const result: CharacterRelation[] = []

    for (const relation of relations) {
      const isSource = relation.source_character_id === characterId
      const otherCharacterId = isSource
        ? relation.target_character_id
        : relation.source_character_id

      // 为双向关系创建唯一标识（使用排序后的ID对）
      const pairKey = [characterId, otherCharacterId].sort((a, b) => a - b).join('-')

      if (relation.is_bidirectional) {
        // 双向关系：只保留当前角色作为源的记录，避免重复
        if (!seen.has(pairKey)) {
          seen.add(pairKey)
          result.push(relation)
        }
      } else {
        // 单向关系：直接添加
        result.push(relation)
      }
    }

    return result
  }, [relations, characterId])

  /**
   * 获取可用于添加关系的角色列表
   * 排除已有关系的角色
   */
  const availableCharacters = useMemo(() => {
    const relatedIds = new Set(
      relations.map((r) =>
        r.source_character_id === characterId
          ? r.target_character_id
          : r.source_character_id
      )
    )
    return allCharacters.filter((c) => !relatedIds.has(c.id))
  }, [allCharacters, relations, characterId])

  const openAddDialog = () => {
    setEditingRelation(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const openEditDialog = (relation: CharacterRelation) => {
    setEditingRelation(relation)
    setFormData({
      target_character_id:
        relation.source_character_id === characterId
          ? relation.target_character_id
          : relation.source_character_id,
      relation_type: relation.relation_type,
      strength: relation.strength,
      description: relation.description || '',
      timeline: relation.timeline || '',
      is_bidirectional: relation.is_bidirectional,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.target_character_id || !formData.relation_type) {
      setError('请选择目标角色和关系类型')
      return
    }

    setSubmitting(true)
    try {
      if (editingRelation) {
        // 更新关系
        await characterRelationAPI.update(editingRelation.id, {
          relation_type: formData.relation_type,
          strength: formData.strength,
          description: formData.description || undefined,
          timeline: formData.timeline || undefined,
          is_bidirectional: formData.is_bidirectional,
        })
        setSuccess('关系更新成功')
      } else {
        // 创建新关系
        const payload: CreateCharacterRelationRequest = {
          target_character_id: formData.target_character_id,
          relation_type: formData.relation_type,
          strength: formData.strength,
          description: formData.description || undefined,
          timeline: formData.timeline || undefined,
          is_bidirectional: formData.is_bidirectional,
        }
        await characterRelationAPI.create(characterId, payload)
        setSuccess('关系创建成功')
      }
      setDialogOpen(false)
      await loadData()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '操作失败'
      setError(message)
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (relationId: number) => {
    if (!confirm('确定要删除这个关系吗？')) return

    try {
      await characterRelationAPI.delete(relationId)
      setSuccess('关系删除成功')
      await loadData()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '删除失败'
      setError(message)
      console.error(err)
    }
  }

  const getCharacterName = (id: number) => {
    if (id === characterId) return characterName
    const char = allCharacters.find((c) => c.id === id)
    return char?.name || `角色#${id}`
  }

  const getStrengthLabel = (strength: number) => {
    if (strength <= 2) return '微弱'
    if (strength <= 4) return '一般'
    if (strength <= 6) return '较强'
    if (strength <= 8) return '强烈'
    return '深厚'
  }

  const getStrengthColor = (strength: number) => {
    if (strength <= 3) return 'default'
    if (strength <= 6) return 'primary'
    if (strength <= 8) return 'secondary'
    return 'success'
  }

  if (loading) {
    return (
      <Box py={4} textAlign="center">
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography color="text.secondary">加载中...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* 提示信息 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* 头部 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1" fontWeight={500}>
            {characterName} 的关系网络
          </Typography>
          <Chip
            label={`${deduplicatedRelations.length} 个关系`}
            size="small"
            variant="outlined"
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={loadData} title="刷新">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            variant="outlined"
            size="small"
            disabled={availableCharacters.length === 0}
          >
            添加关系
          </Button>
        </Stack>
      </Stack>

      {/* 无可用角色提示 */}
      {availableCharacters.length === 0 && allCharacters.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          暂无其他角色可供建立关系。请先创建更多角色。
        </Alert>
      )}

      {/* 关系列表 */}
      <Stack
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        spacing={2}
      >
        {deduplicatedRelations.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
            }}
          >
            <Typography color="text.secondary">
              暂无关系，点击上方按钮添加
            </Typography>
          </Paper>
        ) : (
          deduplicatedRelations.map((relation) => {
            const isSource = relation.source_character_id === characterId
            const otherCharacterId = isSource
              ? relation.target_character_id
              : relation.source_character_id

            return (
              <Paper
                key={relation.id}
                component={motion.div}
                variants={itemVariants}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.6),
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Chip label={characterName} size="small" variant="outlined" color="primary" />
                      {relation.is_bidirectional ? (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <ArrowForwardIcon
                            color="action"
                            fontSize="small"
                            sx={{ transform: 'rotate(-90deg)' }}
                          />
                          <SwapHorizIcon color="primary" fontSize="small" />
                          <ArrowForwardIcon
                            color="action"
                            fontSize="small"
                            sx={{ transform: 'rotate(90deg)' }}
                          />
                        </Stack>
                      ) : (
                        <>
                          {isSource ? (
                            <ArrowForwardIcon color="action" fontSize="small" />
                          ) : (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <ArrowForwardIcon
                                color="action"
                                fontSize="small"
                                sx={{ transform: 'rotate(180deg)' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                反向
                              </Typography>
                            </Stack>
                          )}
                        </>
                      )}
                      <Chip label={getCharacterName(otherCharacterId)} size="small" variant="outlined" />
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => openEditDialog(relation)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(relation.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={relation.relation_type}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`${getStrengthLabel(relation.strength)} (${relation.strength}/10)`}
                      color={getStrengthColor(relation.strength) as any}
                      size="small"
                    />
                    {relation.is_bidirectional && (
                      <Chip label="双向" size="small" variant="outlined" />
                    )}
                  </Stack>

                  {relation.description && (
                    <Typography variant="body2" color="text.secondary">
                      {relation.description}
                    </Typography>
                  )}

                  {relation.timeline && (
                    <Typography variant="caption" color="text.secondary">
                      时间线: {relation.timeline}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )
          })
        )}
      </Stack>

      {/* 添加/编辑对话框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRelation ? '编辑关系' : '添加关系'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {!editingRelation && (
              <FormControl fullWidth>
                <InputLabel>目标角色</InputLabel>
                <Select
                  value={formData.target_character_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, target_character_id: e.target.value as number })
                  }
                  label="目标角色"
                  disabled={availableCharacters.length === 0}
                >
                  {availableCharacters.length === 0 ? (
                    <MenuItem disabled>暂无可选角色</MenuItem>
                  ) : (
                    availableCharacters.map((char) => (
                      <MenuItem key={char.id} value={char.id}>
                        {char.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            {editingRelation && (
              <TextField
                label="关联角色"
                value={getCharacterName(
                  editingRelation.source_character_id === characterId
                    ? editingRelation.target_character_id
                    : editingRelation.source_character_id
                )}
                disabled
                fullWidth
                helperText="编辑时无法更改关联角色"
              />
            )}

            <FormControl fullWidth>
              <InputLabel>关系类型</InputLabel>
              <Select
                value={formData.relation_type}
                onChange={(e) =>
                  setFormData({ ...formData, relation_type: e.target.value })
                }
                label="关系类型"
              >
                {Object.entries(RELATION_TYPES).map(([key, label]) => (
                  <MenuItem key={key} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>
                关系强度: {formData.strength}/10 ({getStrengthLabel(formData.strength)})
              </Typography>
              <Slider
                value={formData.strength}
                onChange={(_, value) =>
                  setFormData({ ...formData, strength: value as number })
                }
                min={1}
                max={10}
                marks
              />
            </Box>

            <TextField
              label="关系描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
              placeholder="描述这段关系..."
            />

            <TextField
              label="时间线"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              fullWidth
              placeholder="如：相识于5年前..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_bidirectional}
                  onChange={(e) =>
                    setFormData({ ...formData, is_bidirectional: e.target.checked })
                  }
                />
              }
              label="双向关系"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {editingRelation ? '保存' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
