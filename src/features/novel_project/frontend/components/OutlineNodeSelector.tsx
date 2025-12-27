/**
 * 大纲节点选择器组件
 * 
 * 功能：
 * - 下拉选择项目下的chapter类型OutlineNode
 * - 显示已绑定节点的Chip标注
 * - 选择已绑定节点时弹出警告
 */
import { useState, useEffect } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import { chapterAPI } from '../chapter_api'
import type { components } from '@/frontend/core/types/generated'

type OutlineChapterInfo = components['schemas']['OutlineChapterInfo']

export interface OutlineNodeSelectorProps {
  projectId: number
  value: number | null
  onChange: (nodeId: number | null) => void
  disabled?: boolean
}

export default function OutlineNodeSelector({
  projectId,
  value,
  onChange,
  disabled = false
}: OutlineNodeSelectorProps) {
  const theme = useTheme()
  const [options, setOptions] = useState<OutlineChapterInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<number | null>(null)

  // 加载大纲章节列表
  useEffect(() => {
    async function loadOutlineChapters() {
      setLoading(true)
      try {
        const data = await chapterAPI.getOutlineChapters(projectId)
        setOptions(data.items)
      } catch (error) {
        console.error('加载大纲章节失败:', error)
        // HTTP拦截器已显示错误，这里降级为空列表
        setOptions([])
      } finally {
        setLoading(false)
      }
    }

    loadOutlineChapters()
  }, [projectId])

  const handleChange = (event: SelectChangeEvent<number | string>) => {
    const selectedId = event.target.value === '' ? null : Number(event.target.value)

    if (selectedId === null) {
      onChange(null)
      return
    }

    // 检查是否选择了已绑定的节点
    const selectedNode = options.find((opt) => opt.id === selectedId)
    if (selectedNode?.is_bound) {
      // 弹出警告对话框
      setPendingSelection(selectedId)
      setWarningOpen(true)
    } else {
      onChange(selectedId)
    }
  }

  const handleWarningConfirm = () => {
    if (pendingSelection !== null) {
      onChange(pendingSelection)
    }
    setWarningOpen(false)
    setPendingSelection(null)
  }

  const handleWarningCancel = () => {
    setWarningOpen(false)
    setPendingSelection(null)
  }

  return (
    <>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="outline-node-label">绑定大纲章节（可选）</InputLabel>
        <Select
          labelId="outline-node-label"
          id="outline-node-select"
          value={value ?? ''}
          label="绑定大纲章节（可选）"
          onChange={handleChange}
          sx={{
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            borderRadius: 3
          }}
        >
          <MenuItem value="">
            <Typography color="text.secondary">不绑定</Typography>
          </MenuItem>
          {loading ? (
            <MenuItem disabled>
              <Typography color="text.secondary">加载中...</Typography>
            </MenuItem>
          ) : (
            options.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography>{option.title}</Typography>
                  {option.is_bound && (
                    <Chip
                      label={`已绑定 #${option.bound_chapter_number}`}
                      size="small"
                      color="warning"
                      sx={{ ml: 'auto' }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* 警告对话框 */}
      <Dialog
        open={warningOpen}
        onClose={handleWarningCancel}
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle>确认绑定</DialogTitle>
        <DialogContent>
          <Typography>
            该大纲节点已被其他章节绑定，确定要继续选择吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            后端验证可能会拒绝重复绑定
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleWarningCancel}>取消</Button>
          <Button onClick={handleWarningConfirm} variant="contained">
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
