/**
 * 危险操作确认对话框
 * 增强版本，带延迟确认、键盘防误触和焦点管理
 */
import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useFocusManagement } from '@/frontend/core'

export interface DangerConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message: string
  itemName?: string
  relatedInfo?: string
  confirmButtonText?: string
  cancelButtonText?: string
  loading?: boolean
  delaySeconds?: number
}

export default function DangerConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '确认删除',
  message,
  itemName,
  relatedInfo,
  confirmButtonText = '删除',
  cancelButtonText = '取消',
  loading = false,
  delaySeconds = 1.5,
}: DangerConfirmDialogProps) {
  const theme = useTheme()
  const [countdown, setCountdown] = useState(delaySeconds)
  const [canConfirm, setCanConfirm] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // 焦点管理
  const { setContainerRef } = useFocusManagement(open, {
    autoFocusOnOpen: true,
    returnFocusOnClose: true,
    focusSelector: 'button', // 自动聚焦到取消按钮
  })

  useEffect(() => {
    if (open) {
      setCountdown(delaySeconds)
      setCanConfirm(false)

      const timer = setTimeout(() => {
        setCanConfirm(true)
        setCountdown(0)
      }, delaySeconds * 1000)

      return () => clearTimeout(timer)
    }
  }, [open, delaySeconds])

  const handleConfirm = async () => {
    if (!canConfirm || loading) return
    await onConfirm()
  }

  // 禁用 Enter 键快捷确认
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        ref: setContainerRef as any,
        sx: {
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            }}
          >
            <WarningIcon sx={{ color: 'error.main', fontSize: 28 }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText component="div" sx={{ mb: 2 }}>
          {message}
        </DialogContentText>

        {itemName && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.error.main, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              删除对象:
            </Typography>
            <Typography variant="body1" fontWeight={700} color="error.main">
              {itemName}
            </Typography>
          </Box>
        )}

        {relatedInfo && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.warning.main, 0.05),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              关联数据:
            </Typography>
            <Typography variant="body2" fontWeight={600} color="warning.dark">
              {relatedInfo}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.error.main, 0.05),
            border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          <Typography variant="caption" color="error.main" fontWeight={600}>
            ⚠️ 此操作不可撤销，请谨慎操作！
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          ref={cancelButtonRef}
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          {cancelButtonText}
        </Button>
        <Button
          component={motion.button}
          whileHover={canConfirm && !loading ? { scale: 1.02 } : {}}
          whileTap={canConfirm && !loading ? { scale: 0.98 } : {}}
          onClick={handleConfirm}
          disabled={!canConfirm || loading}
          variant="contained"
          color="error"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.2,
            fontSize: '1.1rem',
            fontWeight: 700,
            textTransform: 'none',
            minWidth: 120,
            boxShadow: canConfirm
              ? `0 4px 16px ${alpha(theme.palette.error.main, 0.3)}`
              : 'none',
            '&:hover': {
              boxShadow: canConfirm
                ? `0 6px 24px ${alpha(theme.palette.error.main, 0.4)}`
                : 'none',
            },
          }}
        >
          {loading
            ? '处理中...'
            : !canConfirm
              ? `${confirmButtonText} (${countdown.toFixed(1)}s)`
              : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
