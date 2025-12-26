/**
 * 大纲节点编辑器组件 - MacOS 风格优化版
 */
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
  IconButton,
  Divider,
  Fade,
  InputAdornment,
} from '@mui/material'
import {
  Close as CloseIcon,
  SourceOutlined as VolumeIcon,   // 对应之前的图标
  FolderOpenOutlined as ChapterIcon,
  DescriptionOutlined as SectionIcon,
  Numbers as NumbersIcon,
} from '@mui/icons-material'
import type { OutlineNodeWithChildren, OutlineNodeCreate, OutlineNodeUpdate } from '../api'

interface OutlineNodeEditorProps {
  open: boolean
  mode: 'create' | 'edit'
  node?: OutlineNodeWithChildren | null
  parentNode?: OutlineNodeWithChildren | null
  defaultNodeType?: 'volume' | 'chapter' | 'section'
  onClose: () => void
  onSave: (data: OutlineNodeCreate | OutlineNodeUpdate) => Promise<void>
}

// 保持与 Tree 组件配色一致
const nodeTypeOptions = [
  { value: 'volume', label: '卷', icon: VolumeIcon, color: '#007AFF', desc: '用于划分小说的主要部分' },
  { value: 'chapter', label: '章', icon: ChapterIcon, color: '#F5B041', desc: '包含多个小节的容器' },
  { value: 'section', label: '节', icon: SectionIcon, color: '#8E8E93', desc: '具体的写作内容单元' },
]

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'editing', label: '撰写中', color: 'primary' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'locked', label: '锁定', color: 'warning' },
]

export default function OutlineNodeEditor({
  open,
  mode,
  node,
  parentNode,
  defaultNodeType,
  onClose,
  onSave,
}: OutlineNodeEditorProps) {
  const theme = useTheme()
  const [formData, setFormData] = useState<{
    title: string
    description: string
    node_type: 'volume' | 'chapter' | 'section'
    status: string
    word_count_target: string
  }>({
    title: '',
    description: '',
    node_type: defaultNodeType || 'volume',
    status: 'draft',
    word_count_target: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && node) {
        setFormData({
          title: node.title,
          description: node.description || '',
          node_type: node.node_type,
          status: node.status,
          word_count_target: node.metadata?.word_count_target?.toString() || '',
        })
      } else {
        // 创建模式：自动推断类型
        const autoType = defaultNodeType || getDefaultNodeType()
        setFormData({
          title: '',
          description: '',
          node_type: autoType,
          status: 'draft',
          word_count_target: '',
        })
      }
      setErrors({})
    }
  }, [open, mode, node, parentNode, defaultNodeType])

  const getDefaultNodeType = () => {
    if (!parentNode) return 'volume'
    if (parentNode.node_type === 'volume') return 'chapter'
    if (parentNode.node_type === 'chapter') return 'section'
    return 'section'
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = '请输入标题'
    }
    if (formData.word_count_target && isNaN(Number(formData.word_count_target))) {
      newErrors.word_count_target = '必须是数字'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const metadata: Record<string, unknown> = {}
      if (formData.word_count_target) {
        metadata.word_count_target = parseInt(formData.word_count_target)
      }

      if (mode === 'create') {
        await onSave({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          node_type: formData.node_type as any,
          status: formData.status as any,
          parent_id: parentNode?.id || null,
          metadata,
        })
      } else {
        await onSave({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status as any,
          metadata,
        })
      }
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedTypeConfig = nodeTypeOptions.find(opt => opt.value === formData.node_type)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // MacOS 风格弹窗样式
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          backgroundImage: 'none',
        },
      }}
      // 淡入淡出动画
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
    >
      {/* 标题栏 */}
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {mode === 'create' ? '新建节点' : '编辑节点'}
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ bgcolor: alpha(theme.palette.text.secondary, 0.1) }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        {parentNode && mode === 'create' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            将在 <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{parentNode.title}</Box> 下创建
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          {/* 类型选择器 - 仅在创建时显示，改为卡片式选择 */}
          {mode === 'create' && (
            <Stack direction="row" spacing={1.5}>
              {nodeTypeOptions.map((option) => {
                const isSelected = formData.node_type === option.value
                const Icon = option.icon
                return (
                  <Box
                    key={option.value}
                    onClick={() => setFormData({ ...formData, node_type: option.value as any })}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isSelected ? option.color : 'transparent',
                      bgcolor: isSelected ? alpha(option.color, 0.08) : alpha(theme.palette.action.hover, 0.05),
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': {
                        bgcolor: isSelected ? alpha(option.color, 0.12) : alpha(theme.palette.action.hover, 0.1),
                      },
                    }}
                  >
                    <Icon sx={{ color: isSelected ? option.color : 'text.secondary', fontSize: 24 }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? option.color : 'text.secondary'
                      }}
                    >
                      {option.label}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
          )}

          {/* 标题输入 */}
          <TextField
            autoFocus
            label="标题"
            required
            fullWidth
            value={formData.title}
            onChange={e => {
              setFormData({ ...formData, title: e.target.value })
              if (errors.title) setErrors({ ...errors, title: '' })
            }}
            error={!!errors.title}
            helperText={errors.title}
            InputProps={{
              startAdornment: selectedTypeConfig && (
                <InputAdornment position="start">
                  <selectedTypeConfig.icon sx={{ color: selectedTypeConfig.color, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '10px' }
            }}
          />

          {/* 描述输入 */}
          <TextField
            label="简述 / 概要"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="本章节的大致剧情走向..."
            InputProps={{ sx: { borderRadius: '10px' } }}
          />

          {/* 底部两列布局 */}
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="状态"
              fullWidth
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              InputProps={{ sx: { borderRadius: '10px' } }}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="计划字数"
              fullWidth
              value={formData.word_count_target}
              onChange={e => setFormData({ ...formData, word_count_target: e.target.value })}
              error={!!errors.word_count_target}
              helperText={errors.word_count_target}
              InputProps={{ 
                sx: { borderRadius: '10px' },
                endAdornment: <InputAdornment position="end"><NumbersIcon fontSize="small" /></InputAdornment>
              }}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <Divider sx={{ opacity: 0.5 }} />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ 
            color: 'text.secondary',
            borderRadius: '8px',
            px: 2
          }}
        >
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.title.trim()}
          startIcon={loading && <CircularProgress size={16} color="inherit" />}
          sx={{
            borderRadius: '8px',
            px: 3,
            bgcolor: 'primary.main',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        >
          {mode === 'create' ? '立即创建' : '保存修改'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}