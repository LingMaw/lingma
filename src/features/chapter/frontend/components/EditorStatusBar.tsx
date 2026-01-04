/**
 * 编辑器底部状态栏组件
 * 显示字数统计、段落信息、目标进度等
 */

import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  Divider,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  alpha,
} from '@mui/material'
import { Flag, Edit } from '@mui/icons-material'
import { useState } from 'react'
import type { TextStats } from '../hooks/useTextStats'

export interface EditorStatusBarProps {
  stats: TextStats
  onTargetChange?: (target: number | undefined) => void
}

export default function EditorStatusBar({
  stats,
  onTargetChange,
}: EditorStatusBarProps) {
  const [targetDialogOpen, setTargetDialogOpen] = useState(false)
  const [targetInput, setTargetInput] = useState(
    stats.targetChars?.toString() || ''
  )

  const handleSaveTarget = () => {
    const target = parseInt(targetInput, 10)
    if (target > 0) {
      onTargetChange?.(target)
    } else {
      onTargetChange?.(undefined)
    }
    setTargetDialogOpen(false)
  }

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderTop: 1,
          borderColor: 'divider',
          px: 2,
          py: 1,
          zIndex: 10,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* 总字数 */}
          <Stack direction="row" spacing={0.5} alignItems="baseline">
            <Typography variant="body2" fontWeight={600}>
              {stats.totalChars.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              字
            </Typography>
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* 段落数 */}
          <Stack direction="row" spacing={0.5} alignItems="baseline">
            <Typography variant="body2">
              {stats.paragraphCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              段落
            </Typography>
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* 平均段落长度 */}
          <Stack direction="row" spacing={0.5} alignItems="baseline">
            <Typography variant="body2">
              {stats.avgParagraphLength}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              平均段长
            </Typography>
          </Stack>

          {/* 选中字数（仅在有选中时显示） */}
          {stats.selectedChars > 0 && (
            <>
              <Divider orientation="vertical" flexItem />
              <Stack direction="row" spacing={0.5} alignItems="baseline">
                <Typography variant="body2" color="primary.main">
                  {stats.selectedChars.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  已选中
                </Typography>
              </Stack>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          {/* 目标字数和进度 */}
          {stats.targetChars && stats.progress !== undefined ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 200 }}>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={0.5} alignItems="baseline" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    目标进度
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {stats.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={stats.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.totalChars.toLocaleString()}/{stats.targetChars.toLocaleString()}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setTargetInput(stats.targetChars?.toString() || '')
                  setTargetDialogOpen(true)
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <Button
              size="small"
              startIcon={<Flag />}
              onClick={() => setTargetDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              设置目标字数
            </Button>
          )}
        </Stack>
      </Box>

      {/* 目标字数设置对话框 */}
      <Dialog
        open={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>设置目标字数</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="目标字数"
            type="number"
            fullWidth
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="例如：5000"
            helperText="留空则清除目标"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTargetDialogOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button
            onClick={handleSaveTarget}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
